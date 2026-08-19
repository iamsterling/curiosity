use std::collections::BTreeMap;
use std::str;

use super::analyzer::{analyze_count, is_single_token, term_frequency};
use super::model::{
    Code, Counters, Limits, Manifest, Passage, Reader, Result, Telemetry, Term, fail,
    fail_with_telemetry,
};
use super::sha256::Sha256;
use super::source::{Access, Sources};

const NAMES: [&str; 4] = [
    "manifest.json",
    "passages.colr",
    "terms.colr",
    "postings.colr",
];

impl Reader {
    pub fn open(sources: &Sources<'_>, limits: Limits) -> Result<Self> {
        let mut counters = Counters::default();
        let mut telemetry = Telemetry::default();
        if sources.len() != NAMES.len() || NAMES.iter().any(|name| !sources.contains_key(name)) {
            return Err(fail(Code::ManifestInvalid, None, None, &counters));
        }
        let manifest_source = sources["manifest.json"];
        let manifest_len = manifest_source.len();
        if manifest_len > limits.max_manifest_bytes || manifest_len > limits.max_allocation {
            return Err(fail(
                Code::ResourceLimit,
                Some("manifest.json"),
                None,
                &counters,
            ));
        }
        let manifest_access = Access {
            name: "manifest.json",
            source: manifest_source,
            sampled_len: manifest_len,
        };
        let mut bytes = read_temporary(
            &manifest_access,
            0,
            manifest_len,
            &limits,
            &mut telemetry,
            &counters,
        )?;
        if let Err(failure) = manifest_access.finish(&counters, bytes.telemetry()) {
            return Err(bytes.release_failure(failure));
        }
        if let Err(failure) = bytes.retain(manifest_len, &limits, &counters) {
            return Err(bytes.release_failure(failure));
        }
        let manifest = match parse_manifest(&bytes.bytes, &counters) {
            Ok(manifest) => manifest,
            Err(failure) => return Err(bytes.release_failure(failure)),
        };
        bytes.commit();
        drop(bytes);

        let mut total = 0u64;
        let mut accesses = BTreeMap::new();
        for name in ["passages.colr", "terms.colr", "postings.colr"] {
            let source = sources[name];
            let actual = source.len();
            let declared = manifest.artifacts[name].0;
            if actual != declared {
                return Err(fail(Code::BoundsInvalid, Some(name), None, &counters));
            }
            if actual > limits.max_artifact_bytes {
                return Err(fail(Code::ResourceLimit, Some(name), None, &counters));
            }
            total = total
                .checked_add(actual)
                .ok_or_else(|| fail(Code::ResourceLimit, Some(name), None, &counters))?;
            if total > limits.max_total_artifact_bytes {
                return Err(fail(Code::ResourceLimit, Some(name), None, &counters));
            }
            accesses.insert(
                name,
                Access {
                    name,
                    source,
                    sampled_len: actual,
                },
            );
        }
        let passage_count = validate_header(
            &accesses["passages.colr"],
            b"COLRPAS\0",
            &limits,
            &mut telemetry,
            &counters,
        )?;
        let term_count = validate_header(
            &accesses["terms.colr"],
            b"COLRTRM\0",
            &limits,
            &mut telemetry,
            &counters,
        )?;
        let posting_lists = validate_header(
            &accesses["postings.colr"],
            b"COLRPST\0",
            &limits,
            &mut telemetry,
            &counters,
        )?;
        if passage_count != u64::from(manifest.passage_count)
            || passage_count > limits.max_passages
            || term_count != posting_lists
            || term_count > limits.max_terms
        {
            return Err(fail(
                if passage_count > limits.max_passages || term_count > limits.max_terms {
                    Code::ResourceLimit
                } else {
                    Code::RecordInvalid
                },
                None,
                None,
                &counters,
            ));
        }
        for name in ["passages.colr", "terms.colr", "postings.colr"] {
            validate_digest(
                &accesses[name],
                manifest.artifacts[name].1,
                &limits,
                &mut telemetry,
                &counters,
            )?;
        }
        let passages = parse_passages(
            &accesses["passages.colr"],
            &manifest,
            passage_count,
            &limits,
            &mut telemetry,
            &mut counters,
        )
        .map_err(|mut failure| {
            failure.telemetry = telemetry.clone();
            failure
        })?;
        let mut terms = parse_terms(
            &accesses["terms.colr"],
            term_count,
            manifest.passage_count,
            accesses["postings.colr"].sampled_len,
            &limits,
            &mut telemetry,
            &mut counters,
        )
        .map_err(|mut failure| {
            failure.telemetry = telemetry.clone();
            failure
        })?;
        parse_postings(
            &accesses["postings.colr"],
            &passages,
            &mut terms,
            &limits,
            &mut telemetry,
            &mut counters,
        )
        .map_err(|mut failure| {
            failure.telemetry = telemetry.clone();
            failure
        })?;
        for access in accesses.values() {
            access.finish(&counters, &telemetry)?;
        }
        Ok(Self {
            manifest,
            passages,
            terms,
            counters,
            telemetry,
            limits,
        })
    }
}

fn charge(
    bytes: u64,
    limits: &Limits,
    telemetry: &mut Telemetry,
    counters: &Counters,
) -> Result<()> {
    if bytes > limits.max_allocation {
        return Err(fail_with_telemetry(
            Code::ResourceLimit,
            None,
            None,
            counters,
            telemetry,
        ));
    }
    let current = telemetry
        .current_allocated_bytes
        .checked_add(bytes)
        .ok_or_else(|| fail_with_telemetry(Code::ResourceLimit, None, None, counters, telemetry))?;
    if current > limits.max_retained {
        return Err(fail_with_telemetry(
            Code::ResourceLimit,
            None,
            None,
            counters,
            telemetry,
        ));
    }
    telemetry.current_allocated_bytes = current;
    telemetry.allocated_bytes_high_water = telemetry.allocated_bytes_high_water.max(current);
    Ok(())
}

struct TemporaryAllocation<'a> {
    telemetry: &'a mut Telemetry,
    temporary: u64,
    retained: u64,
    committed: bool,
}

impl TemporaryAllocation<'_> {
    fn telemetry(&mut self) -> &mut Telemetry {
        self.telemetry
    }
    fn retain(&mut self, bytes: u64, limits: &Limits, counters: &Counters) -> Result<()> {
        charge(bytes, limits, self.telemetry, counters)?;
        self.retained = bytes;
        Ok(())
    }
    fn commit(&mut self) {
        release(self.temporary, self.telemetry);
        self.temporary = 0;
        self.retained = 0;
        self.committed = true;
    }

    fn release_failure(mut self, mut failure: super::model::Failure) -> super::model::Failure {
        release(self.temporary.saturating_add(self.retained), self.telemetry);
        self.temporary = 0;
        self.retained = 0;
        self.committed = true;
        failure.telemetry = self.telemetry.clone();
        failure
    }
}

impl Drop for TemporaryAllocation<'_> {
    fn drop(&mut self) {
        if !self.committed {
            release(self.temporary.saturating_add(self.retained), self.telemetry);
        }
    }
}

struct TemporaryBytes<'a> {
    bytes: Vec<u8>,
    allocation: TemporaryAllocation<'a>,
}

impl TemporaryBytes<'_> {
    fn telemetry(&self) -> &Telemetry {
        self.allocation.telemetry
    }
    fn retain(&mut self, bytes: u64, limits: &Limits, counters: &Counters) -> Result<()> {
        self.allocation.retain(bytes, limits, counters)
    }
    fn commit(&mut self) {
        self.allocation.commit();
    }

    fn release_failure(self, failure: super::model::Failure) -> super::model::Failure {
        self.allocation.release_failure(failure)
    }
}

fn read_temporary<'a>(
    access: &Access<'_>,
    offset: u64,
    length: u64,
    limits: &Limits,
    telemetry: &'a mut Telemetry,
    counters: &Counters,
) -> Result<TemporaryBytes<'a>> {
    let length = usize::try_from(length).map_err(|_| {
        fail_with_telemetry(
            Code::ResourceLimit,
            Some(access.name),
            Some(offset),
            counters,
            telemetry,
        )
    })?;
    let charged = length as u64;
    charge(charged, limits, telemetry, counters)?;
    let mut allocation = TemporaryAllocation {
        telemetry,
        temporary: charged,
        retained: 0,
        committed: false,
    };
    let mut bytes = vec![0; length];
    if let Err(mut failure) =
        access.read(offset, &mut bytes, limits, allocation.telemetry(), counters)
    {
        failure = allocation.release_failure(failure);
        return Err(failure);
    }
    Ok(TemporaryBytes { bytes, allocation })
}

fn release(bytes: u64, telemetry: &mut Telemetry) {
    telemetry.current_allocated_bytes = telemetry.current_allocated_bytes.saturating_sub(bytes);
}

fn validate_header(
    access: &Access<'_>,
    magic: &[u8; 8],
    limits: &Limits,
    telemetry: &mut Telemetry,
    counters: &Counters,
) -> Result<u64> {
    if access.sampled_len < 32 {
        return Err(fail(
            Code::BoundsInvalid,
            Some(access.name),
            Some(access.sampled_len),
            counters,
        ));
    }
    let mut b = [0; 32];
    access.read(0, &mut b, limits, telemetry, counters)?;
    if &b[..8] != magic
        || u16::from_le_bytes([b[8], b[9]]) != 1
        || u16::from_le_bytes([b[10], b[11]]) != 0
        || b[12..16] != [4, 3, 2, 1]
        || u32::from_le_bytes(
            b[16..20]
                .try_into()
                .map_err(|_| fail(Code::BoundsInvalid, Some(access.name), Some(16), counters))?,
        ) != 32
    {
        return Err(fail(
            Code::FormatUnsupported,
            Some(access.name),
            Some(0),
            counters,
        ));
    }
    if b[28..32] != [0; 4] {
        return Err(fail(
            Code::RecordInvalid,
            Some(access.name),
            Some(28),
            counters,
        ));
    }
    Ok(u64::from_le_bytes(b[20..28].try_into().map_err(|_| {
        fail(Code::BoundsInvalid, Some(access.name), Some(20), counters)
    })?))
}

fn validate_digest(
    access: &Access<'_>,
    expected: [u8; 32],
    limits: &Limits,
    telemetry: &mut Telemetry,
    counters: &Counters,
) -> Result<()> {
    let mut sha = Sha256::new();
    let mut offset = 0u64;
    let mut buffer = [0u8; 65_536];
    while offset < access.sampled_len {
        let remaining = access.sampled_len - offset;
        let take = usize::try_from(remaining.min(buffer.len() as u64)).map_err(|_| {
            fail(
                Code::BoundsInvalid,
                Some(access.name),
                Some(offset),
                counters,
            )
        })?;
        access.read(offset, &mut buffer[..take], limits, telemetry, counters)?;
        sha.update(&buffer[..take]);
        offset = offset.checked_add(take as u64).ok_or_else(|| {
            fail(
                Code::BoundsInvalid,
                Some(access.name),
                Some(offset),
                counters,
            )
        })?;
    }
    if sha.finish() != expected {
        return Err(fail(
            Code::ChecksumMismatch,
            Some(access.name),
            None,
            counters,
        ));
    }
    Ok(())
}

struct Bytes<'a> {
    data: &'a [u8],
    at: usize,
    file: &'static str,
    base: u64,
}
impl<'a> Bytes<'a> {
    fn take(&mut self, n: usize, c: &Counters) -> Result<&'a [u8]> {
        let end = self.at.checked_add(n).ok_or_else(|| {
            fail(
                Code::BoundsInvalid,
                Some(self.file),
                Some(self.base + self.at as u64),
                c,
            )
        })?;
        if end > self.data.len() {
            return Err(fail(
                Code::BoundsInvalid,
                Some(self.file),
                Some(self.base + self.at as u64),
                c,
            ));
        }
        let out = &self.data[self.at..end];
        self.at = end;
        Ok(out)
    }
    fn u8(&mut self, c: &Counters) -> Result<u8> {
        Ok(self.take(1, c)?[0])
    }
    fn u32(&mut self, c: &Counters) -> Result<u32> {
        let b = self.take(4, c)?;
        Ok(u32::from_le_bytes([b[0], b[1], b[2], b[3]]))
    }
    fn u64(&mut self, c: &Counters) -> Result<u64> {
        let b = self.take(8, c)?;
        Ok(u64::from_le_bytes(b.try_into().map_err(|_| {
            fail(
                Code::BoundsInvalid,
                Some(self.file),
                Some(self.base + self.at as u64),
                c,
            )
        })?))
    }
    fn i64(&mut self, c: &Counters) -> Result<i64> {
        let b = self.take(8, c)?;
        Ok(i64::from_le_bytes(b.try_into().map_err(|_| {
            fail(
                Code::BoundsInvalid,
                Some(self.file),
                Some(self.base + self.at as u64),
                c,
            )
        })?))
    }
    fn text(&mut self, max: usize, c: &Counters) -> Result<&'a str> {
        let n = self.u32(c)? as usize;
        if n > max {
            return Err(fail(
                Code::RecordInvalid,
                Some(self.file),
                Some(self.base + self.at as u64 - 4),
                c,
            ));
        }
        let offset = self.base + self.at as u64;
        let b = self.take(n, c)?;
        let s = str::from_utf8(b)
            .map_err(|_| fail(Code::Utf8Invalid, Some(self.file), Some(offset), c))?;
        Ok(s)
    }
}

fn read_payload<'a>(
    access: &Access<'_>,
    offset: u64,
    limits: &Limits,
    telemetry: &'a mut Telemetry,
    c: &Counters,
) -> Result<(TemporaryBytes<'a>, u64)> {
    let mut l = [0; 4];
    access.read(offset, &mut l, limits, telemetry, c)?;
    let n = u32::from_le_bytes(l) as u64;
    let start = offset
        .checked_add(4)
        .ok_or_else(|| fail(Code::BoundsInvalid, Some(access.name), Some(offset), c))?;
    let end = start
        .checked_add(n)
        .ok_or_else(|| fail(Code::BoundsInvalid, Some(access.name), Some(start), c))?;
    if end > access.sampled_len {
        return Err(fail(Code::BoundsInvalid, Some(access.name), Some(start), c));
    }
    let out = read_temporary(access, start, n, limits, telemetry, c)?;
    Ok((out, end))
}

fn parse_passages(
    access: &Access<'_>,
    manifest: &Manifest,
    count: u64,
    limits: &Limits,
    telemetry: &mut Telemetry,
    c: &mut Counters,
) -> Result<Vec<Passage>> {
    let mut result = Vec::new();
    let mut offset = 32;
    for ordinal in 0..count {
        let (mut payload, end) = read_payload(access, offset, limits, telemetry, c)?;
        payload.retain(payload.bytes.len() as u64, limits, c)?;
        let mut b = Bytes {
            data: &payload.bytes,
            at: 0,
            file: "passages.colr",
            base: offset + 4,
        };
        if b.u32(c)? != ordinal as u32 {
            return Err(fail(
                Code::RecordInvalid,
                Some(access.name),
                Some(offset + 4),
                c,
            ));
        }
        let passage_id = b.text(128, c)?;
        let source_object_id = b.text(128, c)?;
        let revision_id = b.text(128, c)?;
        let capture_id = b.text(128, c)?;
        let representation_id = b.text(128, c)?;
        let cell_id = b.text(128, c)?;
        let admission_id = b.text(128, c)?;
        for value in [
            &passage_id,
            &source_object_id,
            &revision_id,
            &capture_id,
            &representation_id,
            &cell_id,
            &admission_id,
        ] {
            if !valid_id(value) {
                return Err(fail(
                    Code::RecordInvalid,
                    Some(access.name),
                    Some(offset),
                    c,
                ));
            }
        }
        if result
            .last()
            .is_some_and(|p: &Passage| p.passage_id.as_bytes() >= passage_id.as_bytes())
            || cell_id != manifest.cell_id
        {
            return Err(fail(
                Code::RecordInvalid,
                Some(access.name),
                Some(offset),
                c,
            ));
        }
        let revision_scope_digest = b
            .take(32, c)?
            .try_into()
            .map_err(|_| fail(Code::BoundsInvalid, Some(access.name), Some(offset), c))?;
        let revision_policy_digest = b
            .take(32, c)?
            .try_into()
            .map_err(|_| fail(Code::BoundsInvalid, Some(access.name), Some(offset), c))?;
        let title = b.text(1024, c)?;
        let text = b.text(65_536, c)?;
        let locator_display = b.text(2048, c)?;
        let media_type = b.text(64, c)?;
        let language = b.text(16, c)?;
        let observed_at = b.i64(c)?;
        let published_at = b.i64(c)?;
        let source_class = b.text(64, c)?;
        let authority_scope_digest = b
            .take(32, c)?
            .try_into()
            .map_err(|_| fail(Code::BoundsInvalid, Some(access.name), Some(offset), c))?;
        let tombstone_sequence = b.u64(c)?;
        let title_token_count = b.u32(c)?;
        let text_token_count = b.u32(c)?;
        let title_tokens = analyze_count(title)
            .map_err(|_| fail(Code::RecordInvalid, Some(access.name), Some(offset), c))?;
        let text_tokens = analyze_count(text)
            .map_err(|_| fail(Code::RecordInvalid, Some(access.name), Some(offset), c))?;
        if b.at != payload.bytes.len()
            || observed_at == i64::MIN
            || !printable(language, 1)
            || !printable(media_type, 1)
            || !printable(source_class, 1)
            || title_token_count as usize != title_tokens
            || text_token_count as usize != text_tokens
        {
            return Err(fail(
                Code::RecordInvalid,
                Some(access.name),
                Some(offset),
                c,
            ));
        }
        result.push(Passage {
            passage_id: passage_id.to_owned(),
            source_object_id: source_object_id.to_owned(),
            revision_id: revision_id.to_owned(),
            capture_id: capture_id.to_owned(),
            representation_id: representation_id.to_owned(),
            cell_id: cell_id.to_owned(),
            admission_id: admission_id.to_owned(),
            revision_scope_digest,
            revision_policy_digest,
            title: title.to_owned(),
            text: text.to_owned(),
            locator_display: locator_display.to_owned(),
            media_type: media_type.to_owned(),
            language: language.to_owned(),
            observed_at,
            published_at,
            source_class: source_class.to_owned(),
            authority_scope_digest,
            tombstone_sequence,
            title_token_count,
            text_token_count,
        });
        payload.commit();
        drop(payload);
        c.passages_decoded += 1;
        offset = end;
    }
    if offset != access.sampled_len {
        return Err(fail(
            Code::BoundsInvalid,
            Some(access.name),
            Some(offset),
            c,
        ));
    }
    Ok(result)
}

fn parse_terms(
    access: &Access<'_>,
    count: u64,
    passages: u32,
    postings_len: u64,
    limits: &Limits,
    telemetry: &mut Telemetry,
    c: &mut Counters,
) -> Result<Vec<Term>> {
    let mut result = Vec::new();
    let mut offset = 32;
    let mut expected_post = 32;
    for _ in 0..count {
        let mut fixed = [0; 8];
        access.read(offset, &mut fixed, limits, telemetry, c)?;
        let field = fixed[0];
        if !matches!(field, 1 | 2) || fixed[1..4] != [0; 3] {
            return Err(fail(
                Code::RecordInvalid,
                Some(access.name),
                Some(offset),
                c,
            ));
        }
        let n = u32::from_le_bytes(
            fixed[4..8]
                .try_into()
                .map_err(|_| fail(Code::BoundsInvalid, Some(access.name), Some(offset + 4), c))?,
        ) as usize;
        if !(1..=64).contains(&n) {
            return Err(fail(
                Code::RecordInvalid,
                Some(access.name),
                Some(offset + 4),
                c,
            ));
        }
        let record_len = 8usize
            .checked_add(n)
            .and_then(|x| x.checked_add(28))
            .ok_or_else(|| fail(Code::BoundsInvalid, Some(access.name), Some(offset), c))?;
        let record_end = offset
            .checked_add(record_len as u64)
            .ok_or_else(|| fail(Code::BoundsInvalid, Some(access.name), Some(offset), c))?;
        if record_end > access.sampled_len {
            return Err(fail(
                Code::BoundsInvalid,
                Some(access.name),
                Some(offset),
                c,
            ));
        }
        let mut data = read_temporary(access, offset, record_len as u64, limits, telemetry, c)?;
        data.retain(record_len as u64, limits, c)?;
        let mut b = Bytes {
            data: &data.bytes,
            at: 8,
            file: "terms.colr",
            base: offset,
        };
        let term = b.take(n, c)?;
        let text = str::from_utf8(term)
            .map_err(|_| fail(Code::Utf8Invalid, Some(access.name), Some(offset + 8), c))?;
        if !is_single_token(text, term).unwrap_or(false) {
            return Err(fail(
                Code::RecordInvalid,
                Some(access.name),
                Some(offset + 8),
                c,
            ));
        }
        let df = b.u32(c)?;
        let total_tf = b.u64(c)?;
        let postings_offset = b.u64(c)?;
        let length = b.u64(c)?;
        if result
            .last()
            .is_some_and(|p: &Term| (p.field, p.bytes.as_slice()) >= (field, term))
            || df == 0
            || df > passages
            || total_tf < u64::from(df)
            || length != u64::from(df) * 8
        {
            return Err(fail(
                Code::RecordInvalid,
                Some(access.name),
                Some(offset),
                c,
            ));
        }
        if postings_offset != expected_post {
            return Err(fail(
                Code::BoundsInvalid,
                Some("postings.colr"),
                Some(postings_offset),
                c,
            ));
        }
        let end = postings_offset.checked_add(length).ok_or_else(|| {
            fail(
                Code::BoundsInvalid,
                Some("postings.colr"),
                Some(postings_offset),
                c,
            )
        })?;
        if end > postings_len {
            return Err(fail(
                Code::BoundsInvalid,
                Some("postings.colr"),
                Some(postings_offset),
                c,
            ));
        }
        expected_post = end;
        result.push(Term {
            field,
            bytes: term.to_vec(),
            df,
            total_tf,
            offset: postings_offset,
            length,
            postings: Vec::new(),
        });
        data.commit();
        drop(data);
        c.terms_decoded += 1;
        offset = record_end;
    }
    if offset != access.sampled_len || expected_post != postings_len {
        return Err(fail(
            Code::BoundsInvalid,
            Some(access.name),
            Some(offset),
            c,
        ));
    }
    Ok(result)
}

fn parse_postings(
    access: &Access<'_>,
    passages: &[Passage],
    terms: &mut [Term],
    limits: &Limits,
    telemetry: &mut Telemetry,
    c: &mut Counters,
) -> Result<()> {
    let mut total = 0u64;
    for term in terms {
        let pairs = term.length / 8;
        total = total
            .checked_add(pairs)
            .ok_or_else(|| fail(Code::ResourceLimit, Some(access.name), Some(term.offset), c))?;
        if total > limits.max_postings {
            return Err(fail(
                Code::ResourceLimit,
                Some(access.name),
                Some(term.offset),
                c,
            ));
        }
        let mut previous: Option<u32> = None;
        let mut sum = 0u64;
        for index in 0..pairs {
            let offset = term.offset + index * 8;
            let mut raw = [0; 8];
            access.read(offset, &mut raw, limits, telemetry, c)?;
            let delta = u32::from_le_bytes(
                raw[..4]
                    .try_into()
                    .map_err(|_| fail(Code::BoundsInvalid, Some(access.name), Some(offset), c))?,
            );
            let tf =
                u32::from_le_bytes(raw[4..].try_into().map_err(|_| {
                    fail(Code::BoundsInvalid, Some(access.name), Some(offset + 4), c)
                })?);
            if delta == 0 || tf == 0 {
                return Err(fail(
                    Code::RecordInvalid,
                    Some(access.name),
                    Some(offset),
                    c,
                ));
            }
            let ordinal = if let Some(p) = previous {
                p.checked_add(delta)
            } else {
                delta.checked_sub(1)
            }
            .ok_or_else(|| fail(Code::RecordInvalid, Some(access.name), Some(offset), c))?;
            if ordinal as usize >= passages.len() {
                return Err(fail(
                    Code::RecordInvalid,
                    Some(access.name),
                    Some(offset),
                    c,
                ));
            }
            let field = if term.field == 1 {
                &passages[ordinal as usize].title
            } else {
                &passages[ordinal as usize].text
            };
            let actual = term_frequency(field, &term.bytes)
                .map_err(|_| fail(Code::RecordInvalid, Some(access.name), Some(offset), c))?;
            if actual != tf as usize {
                return Err(fail(
                    Code::RecordInvalid,
                    Some(access.name),
                    Some(offset),
                    c,
                ));
            }
            charge(8, limits, telemetry, c)?;
            let mut allocation = TemporaryAllocation {
                telemetry,
                temporary: 0,
                retained: 8,
                committed: false,
            };
            sum = sum
                .checked_add(u64::from(tf))
                .ok_or_else(|| fail(Code::RecordInvalid, Some(access.name), Some(offset), c))?;
            term.postings.push((ordinal, tf));
            allocation.commit();
            previous = Some(ordinal);
            c.postings_decoded += 1;
        }
        if sum != term.total_tf {
            return Err(fail(
                Code::RecordInvalid,
                Some(access.name),
                Some(term.offset),
                c,
            ));
        }
    }
    Ok(())
}

fn valid_id(v: &str) -> bool {
    !v.is_empty()
        && v.len() <= 128
        && v.bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._:-".contains(&b))
}
fn printable(v: &str, min: usize) -> bool {
    v.len() >= min && v.bytes().all(|b| (0x20..=0x7e).contains(&b))
}

struct Json<'a> {
    b: &'a [u8],
    at: usize,
}
impl Json<'_> {
    fn lit(&mut self, s: &[u8], c: &Counters) -> Result<()> {
        let end = self.at + s.len();
        if self.b.get(self.at..end) != Some(s) {
            return Err(fail(
                Code::ManifestInvalid,
                Some("manifest.json"),
                Some(self.at as u64),
                c,
            ));
        }
        self.at = end;
        Ok(())
    }
    fn string(&mut self, c: &Counters) -> Result<String> {
        self.lit(b"\"", c)?;
        let start = self.at;
        while self.at < self.b.len() && self.b[self.at] != b'\"' {
            let x = self.b[self.at];
            if x < b' ' || x == b'\\' {
                return Err(fail(
                    Code::ManifestInvalid,
                    Some("manifest.json"),
                    Some(self.at as u64),
                    c,
                ));
            }
            self.at += 1;
        }
        let s = str::from_utf8(&self.b[start..self.at])
            .map_err(|_| {
                fail(
                    Code::ManifestInvalid,
                    Some("manifest.json"),
                    Some(start as u64),
                    c,
                )
            })?
            .to_owned();
        self.lit(b"\"", c)?;
        Ok(s)
    }
    fn number(&mut self, c: &Counters) -> Result<u64> {
        let start = self.at;
        while self.b.get(self.at).is_some_and(u8::is_ascii_digit) {
            self.at += 1;
        }
        if start == self.at || (self.at - start > 1 && self.b[start] == b'0') {
            return Err(fail(
                Code::ManifestInvalid,
                Some("manifest.json"),
                Some(start as u64),
                c,
            ));
        }
        str::from_utf8(&self.b[start..self.at])
            .ok()
            .and_then(|s| s.parse().ok())
            .ok_or_else(|| {
                fail(
                    Code::ManifestInvalid,
                    Some("manifest.json"),
                    Some(start as u64),
                    c,
                )
            })
    }
}
fn parse_hex(s: &str, c: &Counters) -> Result<[u8; 32]> {
    if s.len() != 64
        || !s
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    {
        return Err(fail(Code::ManifestInvalid, Some("manifest.json"), None, c));
    }
    let mut out = [0; 32];
    for (i, o) in out.iter_mut().enumerate() {
        *o = u8::from_str_radix(&s[i * 2..i * 2 + 2], 16)
            .map_err(|_| fail(Code::ManifestInvalid, Some("manifest.json"), None, c))?;
    }
    Ok(out)
}
fn artifact(
    j: &mut Json<'_>,
    name: &'static str,
    c: &Counters,
) -> Result<(&'static str, (u64, [u8; 32]))> {
    j.lit(format!("\"{name}\":{{\"length\":").as_bytes(), c)?;
    let length = j.number(c)?;
    j.lit(b",\"sha256\":", c)?;
    let hash = parse_hex(&j.string(c)?, c)?;
    j.lit(b"}", c)?;
    Ok((name, (length, hash)))
}
fn parse_manifest(bytes: &[u8], c: &Counters) -> Result<Manifest> {
    for (key, supported) in [
        (
            b"\"analyzerId\":".as_slice(),
            b"\"analyzerId\":\"curiosity_scalar_v1\"".as_slice(),
        ),
        (
            b"\"byteOrder\":".as_slice(),
            b"\"byteOrder\":\"little\"".as_slice(),
        ),
        (
            b"\"format\":".as_slice(),
            b"\"format\":\"curiosity-owned-lexical-reader\"".as_slice(),
        ),
        (
            b"\"formatVersion\":".as_slice(),
            b"\"formatVersion\":1".as_slice(),
        ),
        (
            b"\"rankingPolicyId\":".as_slice(),
            b"\"rankingPolicyId\":\"bm25-colr-v1\"".as_slice(),
        ),
        (
            b"\"schemaVersion\":".as_slice(),
            b"\"schemaVersion\":1".as_slice(),
        ),
    ] {
        if let Some(offset) = find_bytes(bytes, key)
            && !bytes[offset..].starts_with(supported)
        {
            return Err(fail(
                Code::FormatUnsupported,
                Some("manifest.json"),
                Some(offset as u64),
                c,
            ));
        }
    }
    let mut j = Json { b: bytes, at: 0 };
    j.lit(
        b"{\"analyzerId\":\"curiosity_scalar_v1\",\"artifactDigests\":{",
        c,
    )?;
    let mut artifacts = BTreeMap::new();
    let (a, v) = artifact(&mut j, "passages.colr", c)?;
    artifacts.insert(a, v);
    j.lit(b",", c)?;
    let (a, v) = artifact(&mut j, "postings.colr", c)?;
    artifacts.insert(a, v);
    j.lit(b",", c)?;
    let (a, v) = artifact(&mut j, "terms.colr", c)?;
    artifacts.insert(a, v);
    j.lit(b"},\"byteOrder\":\"little\",\"cellId\":", c)?;
    let cell_id = j.string(c)?;
    j.lit(
        b",\"format\":\"curiosity-owned-lexical-reader\",\"formatVersion\":1,\"generationId\":",
        c,
    )?;
    let generation_id = j.string(c)?;
    j.lit(b",\"passageCount\":", c)?;
    let passage_count = u32::try_from(j.number(c)?)
        .map_err(|_| fail(Code::ManifestInvalid, Some("manifest.json"), None, c))?;
    j.lit(
        b",\"rankingPolicyId\":\"bm25-colr-v1\",\"schemaVersion\":1,\"sourceManifestDigest\":",
        c,
    )?;
    let source_manifest_digest = parse_hex(&j.string(c)?, c)?;
    j.lit(b",\"tombstoneWatermark\":", c)?;
    let tombstone_watermark = j.number(c)?;
    j.lit(b"}", c)?;
    if j.at != bytes.len() || !valid_id(&generation_id) || !valid_id(&cell_id) {
        return Err(fail(
            Code::ManifestInvalid,
            Some("manifest.json"),
            Some(j.at as u64),
            c,
        ));
    }
    Ok(Manifest {
        generation_id,
        cell_id,
        passage_count,
        tombstone_watermark,
        source_manifest_digest,
        artifacts,
    })
}

fn find_bytes(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack
        .windows(needle.len())
        .position(|window| window == needle)
}
