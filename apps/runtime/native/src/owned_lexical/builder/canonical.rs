use std::collections::{BTreeMap, BTreeSet};
use std::fmt::Write;

use super::*;

fn hex(value: Digest32) -> String {
    value.iter().fold(String::with_capacity(64), |mut s, b| {
        write!(s, "{b:02x}").expect("string write");
        s
    })
}
fn quoted(out: &mut String, value: &str) {
    out.push('"');
    for c in value.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\u{8}' => out.push_str("\\b"),
            '\u{c}' => out.push_str("\\f"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if c < '\u{20}' => write!(out, "\\u{:04x}", c as u32).expect("string write"),
            c => out.push(c),
        }
    }
    out.push('"');
}
fn id(v: &str) -> bool {
    !v.is_empty()
        && v.len() <= 128
        && v.bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._:-".contains(&b))
}
fn printable(v: &str, min: usize, max: usize) -> bool {
    v.len() >= min && v.len() <= max && v.bytes().all(|b| (0x20..=0x7e).contains(&b))
}
pub(super) fn limits_valid(l: &BuildLimitsV1) -> bool {
    l.max_passages > 0
        && l.max_passages <= 10_000
        && l.max_terms > 0
        && l.max_terms <= 100_000
        && l.max_postings > 0
        && l.max_postings <= 1_000_000
        && l.max_artifact_bytes > 0
        && l.max_artifact_bytes <= 16 * 1024 * 1024
        && l.max_total_artifact_bytes > 0
        && l.max_total_artifact_bytes <= 32 * 1024 * 1024
        && l.max_source_bytes > 0
        && l.max_source_bytes <= 32 * 1024 * 1024
        && l.max_token_emissions > 0
        && l.max_token_emissions <= 2_000_000
        && l.max_retained_logical_bytes > 0
        && l.max_retained_logical_bytes <= 16 * 1024 * 1024
}

pub fn validate_and_prepare(input: &BuildInputV1) -> Result<PreparedBuild> {
    if !id(&input.authority.authority_id)
        || !id(&input.authority.authorization_decision_id)
        || !id(&input.authority.cell_id)
        || !limits_valid(&input.authority.limits)
        || input.authority.tombstone_watermark != input.tombstones.watermark
    {
        return Err(Failure::new(
            Code::BuildInputInvalid,
            Phase::Input,
            FileKind::Authority,
        ));
    }
    let mut prior: Option<&[u8]> = None;
    let mut tombstones = BTreeMap::new();
    for t in &input.tombstones.entries {
        if !id(&t.passage_id)
            || t.effective_sequence == 0
            || t.effective_sequence > input.tombstones.watermark
            || prior.is_some_and(|p| p >= t.passage_id.as_bytes())
        {
            return Err(Failure::new(
                Code::BuildInputInvalid,
                Phase::Input,
                FileKind::Tombstone,
            ));
        }
        prior = Some(t.passage_id.as_bytes());
        tombstones.insert(t.passage_id.as_str(), t);
    }
    let mut values = Vec::new();
    values
        .try_reserve_exact(input.passages.len())
        .map_err(|_| Failure::new(Code::BuildResourceLimit, Phase::Sizing, FileKind::Source))?;
    values.extend(input.passages.iter());
    values.sort_by(|a, b| a.passage_id.as_bytes().cmp(b.passage_id.as_bytes()));
    let mut result = Vec::new();
    let mut seen = BTreeSet::new();
    let mut emissions = 0u64;
    for p in values {
        if !seen.insert(p.passage_id.clone()) {
            return Err(Failure::new(
                Code::BuildInputInvalid,
                Phase::Input,
                FileKind::Source,
            ));
        }
        if !valid_passage(p, &input.authority) {
            return Err(Failure::new(
                Code::BuildInputInvalid,
                Phase::Input,
                FileKind::Source,
            ));
        }
        if let Some(t) = tombstones.get(p.passage_id.as_str()) {
            if p.authority_scope_digest != t.authority_scope_digest
                || p.tombstone_sequence != t.effective_sequence
            {
                return Err(Failure::new(
                    Code::BuildInputInvalid,
                    Phase::Input,
                    FileKind::Tombstone,
                ));
            }
            continue;
        }
        if p.tombstone_sequence != 0 {
            return Err(Failure::new(
                Code::BuildInputInvalid,
                Phase::Input,
                FileKind::Tombstone,
            ));
        }
        let title_tokens = analyze(&p.title)
            .map_err(|_| Failure::new(Code::BuildInputInvalid, Phase::Input, FileKind::Source))?;
        let text_tokens = analyze(&p.text)
            .map_err(|_| Failure::new(Code::BuildInputInvalid, Phase::Input, FileKind::Source))?;
        emissions = emissions
            .checked_add((title_tokens.len() + text_tokens.len()) as u64)
            .ok_or_else(|| {
                Failure::new(Code::BuildResourceLimit, Phase::Sizing, FileKind::Source)
            })?;
        if emissions > input.authority.limits.max_token_emissions
            || result.len() >= input.authority.limits.max_passages as usize
        {
            return Err(Failure::new(
                Code::BuildResourceLimit,
                Phase::Sizing,
                FileKind::Source,
            ));
        }
        let ordinal = u32::try_from(result.len())
            .map_err(|_| Failure::new(Code::BuildResourceLimit, Phase::Sizing, FileKind::Source))?;
        result.push(PreparedPassage {
            value: p.clone(),
            ordinal,
            title_tokens,
            text_tokens,
        });
    }
    Ok(PreparedBuild { passages: result })
}
fn valid_passage(p: &BuildPassageV1, a: &BuildAuthorityV1) -> bool {
    [
        &p.passage_id,
        &p.source_object_id,
        &p.revision_id,
        &p.capture_id,
        &p.representation_id,
        &p.cell_id,
        &p.admission_id,
    ]
    .iter()
    .all(|v| id(v))
        && p.cell_id == a.cell_id
        && p.observed_at != i64::MIN
        && p.published_at != Some(i64::MIN)
        && p.title.len() <= 1024
        && p.text.len() <= 65536
        && p.locator_display.len() <= 2048
        && printable(&p.media_type, 1, 64)
        && printable(&p.language, 1, 16)
        && printable(&p.source_class, 1, 64)
}

pub fn passage_inventory(passages: &[PreparedPassage]) -> Result<Vec<u8>> {
    let mut out = Vec::new();
    for p in passages {
        let object = passage_json(&p.value);
        out.extend_from_slice(&(object.len() as u64).to_le_bytes());
        out.extend_from_slice(object.as_bytes());
    }
    Ok(out)
}
pub(super) fn passage_json(p: &BuildPassageV1) -> String {
    let mut s = String::from("{\"admissionId\":");
    quoted(&mut s, &p.admission_id);
    s.push_str(",\"authorityScopeDigest\":\"");
    s.push_str(&hex(p.authority_scope_digest));
    s.push_str("\",\"captureId\":");
    quoted(&mut s, &p.capture_id);
    s.push_str(",\"cellId\":");
    quoted(&mut s, &p.cell_id);
    s.push_str(",\"language\":");
    quoted(&mut s, &p.language);
    s.push_str(",\"locatorDisplay\":");
    quoted(&mut s, &p.locator_display);
    s.push_str(",\"mediaType\":");
    quoted(&mut s, &p.media_type);
    write!(s, ",\"observedAt\":{},\"passageId\":", p.observed_at).unwrap();
    quoted(&mut s, &p.passage_id);
    s.push_str(",\"publishedAt\":");
    match p.published_at {
        Some(v) => write!(s, "{v}").unwrap(),
        None => s.push_str("null"),
    };
    s.push_str(",\"representationId\":");
    quoted(&mut s, &p.representation_id);
    s.push_str(",\"revisionId\":");
    quoted(&mut s, &p.revision_id);
    s.push_str(",\"revisionPolicyDigest\":\"");
    s.push_str(&hex(p.revision_policy_digest));
    s.push_str("\",\"revisionScopeDigest\":\"");
    s.push_str(&hex(p.revision_scope_digest));
    s.push_str("\",\"sourceClass\":");
    quoted(&mut s, &p.source_class);
    s.push_str(",\"sourceObjectId\":");
    quoted(&mut s, &p.source_object_id);
    s.push_str(",\"text\":");
    quoted(&mut s, &p.text);
    s.push_str(",\"title\":");
    quoted(&mut s, &p.title);
    write!(s, ",\"tombstoneSequence\":{}}}", p.tombstone_sequence).unwrap();
    s
}

pub fn tombstone_bytes(t: &TombstoneInventoryV1) -> Vec<u8> {
    let mut s = String::from("{\"entries\":[");
    for (i, e) in t.entries.iter().enumerate() {
        if i > 0 {
            s.push(',')
        }
        write!(
            s,
            "{{\"authorityScopeDigest\":\"{}\",\"effectiveSequence\":{},\"passageId\":",
            hex(e.authority_scope_digest),
            e.effective_sequence
        )
        .unwrap();
        quoted(&mut s, &e.passage_id);
        write!(s, ",\"reasonDigest\":\"{}\"}}", hex(e.reason_digest)).unwrap()
    }
    write!(
        s,
        "],\"format\":\"owned-lexical-tombstone-inventory-v1\",\"version\":1,\"watermark\":{}}}",
        t.watermark
    )
    .unwrap();
    s.into_bytes()
}
pub fn authority_bytes(a: &BuildAuthorityV1) -> Vec<u8> {
    format!("{{\"analyzerId\":\"curiosity_scalar_v1\",\"authorityId\":\"{}\",\"authorizationDecisionId\":\"{}\",\"authorizationScopeDigest\":\"{}\",\"builderId\":\"curiosity_owned_lexical_builder_v1\",\"cellId\":\"{}\",\"formatMajor\":1,\"formatMinor\":0,\"inputClass\":\"project-authored-qualification\",\"limits\":{{\"maxArtifactBytes\":{},\"maxPassages\":{},\"maxPostings\":{},\"maxRetainedLogicalBytes\":{},\"maxSourceBytes\":{},\"maxTerms\":{},\"maxTokenEmissions\":{},\"maxTotalArtifactBytes\":{}}},\"passageInventoryDigest\":\"{}\",\"rankingPolicyId\":\"bm25-colr-v1\",\"schema\":\"owned-lexical-build-authority-v1\",\"schemaVersion\":1,\"tombstoneInventoryDigest\":\"{}\",\"tombstoneWatermark\":{},\"version\":1}}",a.authority_id,a.authorization_decision_id,hex(a.authorization_scope_digest),a.cell_id,a.limits.max_artifact_bytes,a.limits.max_passages,a.limits.max_postings,a.limits.max_retained_logical_bytes,a.limits.max_source_bytes,a.limits.max_terms,a.limits.max_token_emissions,a.limits.max_total_artifact_bytes,hex(a.passage_inventory_digest),hex(a.tombstone_inventory_digest),a.tombstone_watermark).into_bytes()
}
pub fn source_bytes(a: &BuildAuthorityV1, ad: Digest32, count: u32) -> Vec<u8> {
    format!("{{\"analyzerId\":\"curiosity_scalar_v1\",\"buildAuthorityDigest\":\"{}\",\"builderId\":\"curiosity_owned_lexical_builder_v1\",\"cellId\":\"{}\",\"format\":\"curiosity-owned-lexical-reader\",\"formatVersion\":1,\"passageCount\":{},\"passageInventoryDigest\":\"{}\",\"rankingPolicyId\":\"bm25-colr-v1\",\"schema\":\"owned-lexical-source-v1\",\"schemaVersion\":1,\"tombstoneInventoryDigest\":\"{}\",\"tombstoneWatermark\":{}}}",hex(ad),a.cell_id,count,hex(a.passage_inventory_digest),hex(a.tombstone_inventory_digest),a.tombstone_watermark).into_bytes()
}
fn binding(bytes: &[u8]) -> String {
    format!(
        "{{\"length\":{},\"sha256\":\"{}\"}}",
        bytes.len(),
        hex(digest(bytes))
    )
}
pub fn manifest_bytes(
    a: &BuildAuthorityV1,
    count: u32,
    sd: Digest32,
    p: &[u8],
    t: &[u8],
    o: &[u8],
) -> Vec<u8> {
    format!("{{\"analyzerId\":\"curiosity_scalar_v1\",\"artifactDigests\":{{\"passages.colr\":{},\"postings.colr\":{},\"terms.colr\":{}}},\"byteOrder\":\"little\",\"cellId\":\"{}\",\"format\":\"curiosity-owned-lexical-reader\",\"formatVersion\":1,\"generationId\":\"colr1-{}\",\"passageCount\":{},\"rankingPolicyId\":\"bm25-colr-v1\",\"schemaVersion\":1,\"sourceManifestDigest\":\"{}\",\"tombstoneWatermark\":{}}}",binding(p),binding(o),binding(t),a.cell_id,hex(sd),count,hex(sd),a.tombstone_watermark).into_bytes()
}
#[allow(clippy::too_many_arguments)]
pub fn receipt_bytes(
    ad: Digest32,
    sd: Digest32,
    td: Digest32,
    md: Digest32,
    m: &[u8],
    p: &[u8],
    t: &[u8],
    o: &[u8],
) -> Vec<u8> {
    format!("{{\"artifactDigests\":{{\"manifest.json\":{},\"passages.colr\":{},\"postings.colr\":{},\"terms.colr\":{}}},\"buildAuthorityDigest\":\"{}\",\"builderId\":\"curiosity_owned_lexical_builder_v1\",\"format\":\"curiosity-owned-lexical-build-receipt\",\"manifestDigest\":\"{}\",\"sourceManifestDigest\":\"{}\",\"tombstoneInventoryDigest\":\"{}\",\"version\":1}}",binding(m),binding(p),binding(o),binding(t),hex(ad),hex(md),hex(sd),hex(td)).into_bytes()
}
