//! Exact parsers for ADR 0055 persistence records.
//!
//! These parsers deliberately accept only the canonical encoding. They are not
//! general JSON parsers and are not exposed outside the qualification tranche.

use super::{BuildLimitsV1, Digest32};

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct ArtifactBinding {
    pub length: u64,
    pub sha256: Digest32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct ReceiptRecord {
    pub manifest: ArtifactBinding,
    pub passages: ArtifactBinding,
    pub postings: ArtifactBinding,
    pub terms: ArtifactBinding,
    pub build_authority_digest: Digest32,
    pub manifest_digest: Digest32,
    pub source_manifest_digest: Digest32,
    pub tombstone_inventory_digest: Digest32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct AuthorityRecord {
    pub authority_id: String,
    pub authorization_decision_id: String,
    pub authorization_scope_digest: Digest32,
    pub cell_id: String,
    pub limits: BuildLimitsV1,
    pub passage_inventory_digest: Digest32,
    pub tombstone_inventory_digest: Digest32,
    pub tombstone_watermark: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct SourceRecord {
    pub build_authority_digest: Digest32,
    pub cell_id: String,
    pub passage_count: u32,
    pub passage_inventory_digest: Digest32,
    pub tombstone_inventory_digest: Digest32,
    pub tombstone_watermark: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct TombstoneRecord {
    pub entries: Vec<TombstoneRecordEntry>,
    pub watermark: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct TombstoneRecordEntry {
    pub authority_scope_digest: Digest32,
    pub effective_sequence: u64,
    pub passage_id: String,
    pub reason_digest: Digest32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct SelectorRecord {
    pub authorization_decision_id: String,
    pub authorization_scope_digest: Digest32,
    pub build_authority_digest: Digest32,
    pub manifest_digest: Digest32,
    pub previous_manifest_digest: Option<Digest32>,
    pub tombstone_inventory_digest: Digest32,
    pub tombstone_watermark: u64,
    pub source_manifest_digest: Digest32,
}

type ParseResult<T> = std::result::Result<T, ()>;

struct Cursor<'a> {
    bytes: &'a [u8],
    at: usize,
}

impl<'a> Cursor<'a> {
    fn new(bytes: &'a [u8], maximum: usize) -> ParseResult<Self> {
        if bytes.is_empty() || bytes.len() > maximum || std::str::from_utf8(bytes).is_err() {
            return Err(());
        }
        Ok(Self { bytes, at: 0 })
    }

    fn literal(&mut self, expected: &[u8]) -> ParseResult<()> {
        let end = self.at.checked_add(expected.len()).ok_or(())?;
        if self.bytes.get(self.at..end) != Some(expected) {
            return Err(());
        }
        self.at = end;
        Ok(())
    }

    fn finish(self) -> ParseResult<()> {
        (self.at == self.bytes.len()).then_some(()).ok_or(())
    }

    fn string(&mut self) -> ParseResult<String> {
        let start = self.at;
        self.literal(b"\"")?;
        let mut value = String::new();
        loop {
            let byte = *self.bytes.get(self.at).ok_or(())?;
            if byte == b'"' {
                self.at += 1;
                break;
            }
            if byte < 0x20 {
                return Err(());
            }
            if byte == b'\\' {
                self.at += 1;
                match *self.bytes.get(self.at).ok_or(())? {
                    b'"' => value.push('"'),
                    b'\\' => value.push('\\'),
                    b'b' => value.push('\u{8}'),
                    b'f' => value.push('\u{c}'),
                    b'n' => value.push('\n'),
                    b'r' => value.push('\r'),
                    b't' => value.push('\t'),
                    b'u' => {
                        let digits = self.bytes.get(self.at + 1..self.at + 5).ok_or(())?;
                        if digits
                            .iter()
                            .any(|b| !b.is_ascii_digit() && !(b'a'..=b'f').contains(b))
                        {
                            return Err(());
                        }
                        let text = std::str::from_utf8(digits).map_err(|_| ())?;
                        let code = u32::from_str_radix(text, 16).map_err(|_| ())?;
                        let ch = char::from_u32(code).ok_or(())?;
                        if ch >= '\u{20}' || matches!(ch, '\u{8}' | '\u{c}' | '\n' | '\r' | '\t') {
                            return Err(());
                        }
                        value.push(ch);
                        self.at += 4;
                    }
                    _ => return Err(()),
                }
                self.at += 1;
                continue;
            }
            let rest = std::str::from_utf8(&self.bytes[self.at..]).map_err(|_| ())?;
            let ch = rest.chars().next().ok_or(())?;
            if ch == '"' || ch == '\\' {
                return Err(());
            }
            value.push(ch);
            self.at += ch.len_utf8();
        }
        let mut encoded = String::new();
        encode_string(&mut encoded, &value);
        if encoded.as_bytes() != self.bytes.get(start..self.at).ok_or(())? {
            return Err(());
        }
        Ok(value)
    }

    fn u64(&mut self) -> ParseResult<u64> {
        let start = self.at;
        while self.bytes.get(self.at).is_some_and(u8::is_ascii_digit) {
            self.at += 1;
        }
        let digits = self.bytes.get(start..self.at).ok_or(())?;
        if digits.is_empty() || (digits.len() > 1 && digits[0] == b'0') {
            return Err(());
        }
        std::str::from_utf8(digits)
            .map_err(|_| ())?
            .parse::<u64>()
            .map_err(|_| ())
    }

    fn u32(&mut self) -> ParseResult<u32> {
        u32::try_from(self.u64()?).map_err(|_| ())
    }

    fn digest(&mut self) -> ParseResult<Digest32> {
        let text = self.string()?;
        if text.len() != 64
            || text
                .bytes()
                .any(|b| !b.is_ascii_digit() && !(b'a'..=b'f').contains(&b))
        {
            return Err(());
        }
        let mut result = [0; 32];
        for (index, byte) in result.iter_mut().enumerate() {
            *byte = u8::from_str_radix(&text[index * 2..index * 2 + 2], 16).map_err(|_| ())?;
        }
        Ok(result)
    }
}

fn encode_string(output: &mut String, value: &str) {
    use std::fmt::Write;
    output.push('"');
    for ch in value.chars() {
        match ch {
            '"' => output.push_str("\\\""),
            '\\' => output.push_str("\\\\"),
            '\u{8}' => output.push_str("\\b"),
            '\u{c}' => output.push_str("\\f"),
            '\n' => output.push_str("\\n"),
            '\r' => output.push_str("\\r"),
            '\t' => output.push_str("\\t"),
            c if c < '\u{20}' => write!(output, "\\u{:04x}", c as u32).expect("string write"),
            c => output.push(c),
        }
    }
    output.push('"');
}

fn identifier(value: String) -> ParseResult<String> {
    if value.is_empty()
        || value.len() > 128
        || value
            .bytes()
            .any(|b| !b.is_ascii_alphanumeric() && !b"._:-".contains(&b))
    {
        return Err(());
    }
    Ok(value)
}

fn artifact(cursor: &mut Cursor<'_>) -> ParseResult<ArtifactBinding> {
    cursor.literal(b"{\"length\":")?;
    let length = cursor.u64()?;
    cursor.literal(b",\"sha256\":")?;
    let sha256 = cursor.digest()?;
    cursor.literal(b"}")?;
    Ok(ArtifactBinding { length, sha256 })
}

pub(super) fn parse_receipt(bytes: &[u8]) -> ParseResult<ReceiptRecord> {
    let mut c = Cursor::new(bytes, 8_192)?;
    c.literal(b"{\"artifactDigests\":{\"manifest.json\":")?;
    let manifest = artifact(&mut c)?;
    c.literal(b",\"passages.colr\":")?;
    let passages = artifact(&mut c)?;
    c.literal(b",\"postings.colr\":")?;
    let postings = artifact(&mut c)?;
    c.literal(b",\"terms.colr\":")?;
    let terms = artifact(&mut c)?;
    c.literal(b"},\"buildAuthorityDigest\":")?;
    let build_authority_digest = c.digest()?;
    c.literal(b",\"builderId\":\"curiosity_owned_lexical_builder_v1\",\"format\":\"curiosity-owned-lexical-build-receipt\",\"manifestDigest\":")?;
    let manifest_digest = c.digest()?;
    c.literal(b",\"sourceManifestDigest\":")?;
    let source_manifest_digest = c.digest()?;
    c.literal(b",\"tombstoneInventoryDigest\":")?;
    let tombstone_inventory_digest = c.digest()?;
    c.literal(b",\"version\":1}")?;
    c.finish()?;
    Ok(ReceiptRecord {
        manifest,
        passages,
        postings,
        terms,
        build_authority_digest,
        manifest_digest,
        source_manifest_digest,
        tombstone_inventory_digest,
    })
}

pub(super) fn parse_authority(bytes: &[u8]) -> ParseResult<AuthorityRecord> {
    let mut c = Cursor::new(bytes, 65_536)?;
    c.literal(b"{\"analyzerId\":\"curiosity_scalar_v1\",\"authorityId\":")?;
    let authority_id = identifier(c.string()?)?;
    c.literal(b",\"authorizationDecisionId\":")?;
    let authorization_decision_id = identifier(c.string()?)?;
    c.literal(b",\"authorizationScopeDigest\":")?;
    let authorization_scope_digest = c.digest()?;
    c.literal(b",\"builderId\":\"curiosity_owned_lexical_builder_v1\",\"cellId\":")?;
    let cell_id = identifier(c.string()?)?;
    c.literal(b",\"formatMajor\":1,\"formatMinor\":0,\"inputClass\":\"project-authored-qualification\",\"limits\":{\"maxArtifactBytes\":")?;
    let max_artifact_bytes = c.u64()?;
    c.literal(b",\"maxPassages\":")?;
    let max_passages = c.u32()?;
    c.literal(b",\"maxPostings\":")?;
    let max_postings = c.u64()?;
    c.literal(b",\"maxRetainedLogicalBytes\":")?;
    let max_retained_logical_bytes = c.u64()?;
    c.literal(b",\"maxSourceBytes\":")?;
    let max_source_bytes = c.u64()?;
    c.literal(b",\"maxTerms\":")?;
    let max_terms = c.u32()?;
    c.literal(b",\"maxTokenEmissions\":")?;
    let max_token_emissions = c.u64()?;
    c.literal(b",\"maxTotalArtifactBytes\":")?;
    let max_total_artifact_bytes = c.u64()?;
    c.literal(b"},\"passageInventoryDigest\":")?;
    let passage_inventory_digest = c.digest()?;
    c.literal(b",\"rankingPolicyId\":\"bm25-colr-v1\",\"schema\":\"owned-lexical-build-authority-v1\",\"schemaVersion\":1,\"tombstoneInventoryDigest\":")?;
    let tombstone_inventory_digest = c.digest()?;
    c.literal(b",\"tombstoneWatermark\":")?;
    let tombstone_watermark = c.u64()?;
    c.literal(b",\"version\":1}")?;
    c.finish()?;
    Ok(AuthorityRecord {
        authority_id,
        authorization_decision_id,
        authorization_scope_digest,
        cell_id,
        limits: BuildLimitsV1 {
            max_passages,
            max_terms,
            max_postings,
            max_artifact_bytes,
            max_total_artifact_bytes,
            max_source_bytes,
            max_token_emissions,
            max_retained_logical_bytes,
        },
        passage_inventory_digest,
        tombstone_inventory_digest,
        tombstone_watermark,
    })
}

pub(super) fn parse_source(bytes: &[u8]) -> ParseResult<SourceRecord> {
    let mut c = Cursor::new(bytes, 65_536)?;
    c.literal(b"{\"analyzerId\":\"curiosity_scalar_v1\",\"buildAuthorityDigest\":")?;
    let build_authority_digest = c.digest()?;
    c.literal(b",\"builderId\":\"curiosity_owned_lexical_builder_v1\",\"cellId\":")?;
    let cell_id = identifier(c.string()?)?;
    c.literal(
        b",\"format\":\"curiosity-owned-lexical-reader\",\"formatVersion\":1,\"passageCount\":",
    )?;
    let passage_count = c.u32()?;
    c.literal(b",\"passageInventoryDigest\":")?;
    let passage_inventory_digest = c.digest()?;
    c.literal(b",\"rankingPolicyId\":\"bm25-colr-v1\",\"schema\":\"owned-lexical-source-v1\",\"schemaVersion\":1,\"tombstoneInventoryDigest\":")?;
    let tombstone_inventory_digest = c.digest()?;
    c.literal(b",\"tombstoneWatermark\":")?;
    let tombstone_watermark = c.u64()?;
    c.literal(b"}")?;
    c.finish()?;
    Ok(SourceRecord {
        build_authority_digest,
        cell_id,
        passage_count,
        passage_inventory_digest,
        tombstone_inventory_digest,
        tombstone_watermark,
    })
}

pub(super) fn parse_tombstone(bytes: &[u8]) -> ParseResult<TombstoneRecord> {
    let mut c = Cursor::new(bytes, 1_048_576)?;
    c.literal(b"{\"entries\":[")?;
    let mut entries = Vec::new();
    let mut previous: Option<String> = None;
    if c.bytes.get(c.at) != Some(&b']') {
        loop {
            c.literal(b"{\"authorityScopeDigest\":")?;
            let authority_scope_digest = c.digest()?;
            c.literal(b",\"effectiveSequence\":")?;
            let effective_sequence = c.u64()?;
            c.literal(b",\"passageId\":")?;
            let passage_id = identifier(c.string()?)?;
            c.literal(b",\"reasonDigest\":")?;
            let reason_digest = c.digest()?;
            c.literal(b"}")?;
            if effective_sequence == 0
                || previous
                    .as_ref()
                    .is_some_and(|p| p.as_bytes() >= passage_id.as_bytes())
            {
                return Err(());
            }
            previous = Some(passage_id.clone());
            entries.push(TombstoneRecordEntry {
                authority_scope_digest,
                effective_sequence,
                passage_id,
                reason_digest,
            });
            if c.bytes.get(c.at) != Some(&b',') {
                break;
            }
            c.at += 1;
        }
    }
    c.literal(
        b"],\"format\":\"owned-lexical-tombstone-inventory-v1\",\"version\":1,\"watermark\":",
    )?;
    let watermark = c.u64()?;
    c.literal(b"}")?;
    c.finish()?;
    if entries
        .iter()
        .any(|entry| entry.effective_sequence > watermark)
    {
        return Err(());
    }
    Ok(TombstoneRecord { entries, watermark })
}

pub(super) fn parse_selector(bytes: &[u8]) -> ParseResult<SelectorRecord> {
    let mut c = Cursor::new(bytes, 1_024)?;
    c.literal(b"{\"authorizationDecisionId\":")?;
    let authorization_decision_id = identifier(c.string()?)?;
    c.literal(b",\"authorizationScopeDigest\":")?;
    let authorization_scope_digest = c.digest()?;
    c.literal(b",\"buildAuthorityDigest\":")?;
    let build_authority_digest = c.digest()?;
    c.literal(b",\"format\":\"curiosity-owned-lexical-active\",\"manifestDigest\":")?;
    let manifest_digest = c.digest()?;
    c.literal(b",\"previousManifestDigest\":")?;
    let previous_manifest_digest = if c.bytes.get(c.at) == Some(&b'n') {
        c.literal(b"null")?;
        None
    } else {
        Some(c.digest()?)
    };
    c.literal(b",\"tombstoneInventoryDigest\":")?;
    let tombstone_inventory_digest = c.digest()?;
    c.literal(b",\"tombstoneWatermark\":")?;
    let tombstone_watermark = c.u64()?;
    c.literal(b",\"sourceManifestDigest\":")?;
    let source_manifest_digest = c.digest()?;
    c.literal(b",\"version\":1}")?;
    c.finish()?;
    Ok(SelectorRecord {
        authorization_decision_id,
        authorization_scope_digest,
        build_authority_digest,
        manifest_digest,
        previous_manifest_digest,
        tombstone_inventory_digest,
        tombstone_watermark,
        source_manifest_digest,
    })
}
