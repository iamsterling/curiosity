use std::collections::{BTreeMap, BTreeSet};

#[cfg(test)]
use std::sync::atomic::{AtomicU64, Ordering};

use super::*;

#[cfg(test)]
static CONSTRUCTION_ADVANCES: AtomicU64 = AtomicU64::new(0);
#[cfg(test)]
static PLANNED_TERMS: AtomicU64 = AtomicU64::new(0);
#[cfg(test)]
static PLANNED_POSTINGS: AtomicU64 = AtomicU64::new(0);
#[cfg(test)]
static OUTPUT_ALLOCATIONS: AtomicU64 = AtomicU64::new(0);

#[cfg(test)]
pub(super) fn reset_construction_advances() {
    CONSTRUCTION_ADVANCES.store(0, Ordering::SeqCst);
    PLANNED_TERMS.store(0, Ordering::SeqCst);
    PLANNED_POSTINGS.store(0, Ordering::SeqCst);
    OUTPUT_ALLOCATIONS.store(0, Ordering::SeqCst);
}

#[cfg(test)]
pub(super) fn construction_counts() -> (u64, u64, u64) {
    (
        PLANNED_TERMS.load(Ordering::SeqCst),
        PLANNED_POSTINGS.load(Ordering::SeqCst),
        OUTPUT_ALLOCATIONS.load(Ordering::SeqCst),
    )
}

#[cfg(test)]
fn planned_term() {
    PLANNED_TERMS.fetch_add(1, Ordering::SeqCst);
}
#[cfg(not(test))]
fn planned_term() {}
#[cfg(test)]
fn planned_posting() {
    PLANNED_POSTINGS.fetch_add(1, Ordering::SeqCst);
}
#[cfg(not(test))]
fn planned_posting() {}
#[cfg(test)]
fn output_allocation() {
    OUTPUT_ALLOCATIONS.fetch_add(1, Ordering::SeqCst);
}
#[cfg(not(test))]
fn output_allocation() {}

#[cfg(test)]
pub(super) fn construction_advances() -> u64 {
    CONSTRUCTION_ADVANCES.load(Ordering::SeqCst)
}

#[cfg(test)]
fn advanced() {
    CONSTRUCTION_ADVANCES.fetch_add(1, Ordering::SeqCst);
}

#[cfg(not(test))]
fn advanced() {}

struct EncodingPlan {
    passages_bytes: usize,
    terms_bytes: usize,
    postings_bytes: usize,
    terms: usize,
    postings: u64,
}

fn plan_encoding(build: &PreparedBuild, limits: &BuildLimitsV1) -> Result<EncodingPlan> {
    let mut terms: BTreeMap<(u8, &[u8]), BTreeSet<u32>> = BTreeMap::new();
    let mut posting_count = 0u64;
    for passage in &build.passages {
        for (field, tokens) in [(1, &passage.title_tokens), (2, &passage.text_tokens)] {
            for token in tokens {
                if !terms.contains_key(&(field, token.as_slice())) {
                    if terms.len() >= limits.max_terms as usize {
                        return Err(resource_limit());
                    }
                    terms.insert((field, token), BTreeSet::new());
                    planned_term();
                }
                let documents = terms
                    .get_mut(&(field, token.as_slice()))
                    .ok_or_else(resource_limit)?;
                if !documents.contains(&passage.ordinal) {
                    if posting_count >= limits.max_postings {
                        return Err(resource_limit());
                    }
                    documents.insert(passage.ordinal);
                    planned_posting();
                    posting_count = posting_count.checked_add(1).ok_or_else(resource_limit)?;
                }
            }
        }
    }
    let passages_bytes = build.passages.iter().try_fold(32usize, |total, passage| {
        let strings = [
            &passage.value.passage_id,
            &passage.value.source_object_id,
            &passage.value.revision_id,
            &passage.value.capture_id,
            &passage.value.representation_id,
            &passage.value.cell_id,
            &passage.value.admission_id,
            &passage.value.title,
            &passage.value.text,
            &passage.value.locator_display,
            &passage.value.media_type,
            &passage.value.language,
            &passage.value.source_class,
        ];
        let payload = strings.iter().try_fold(184usize, |sum, value| {
            sum.checked_add(value.len()).ok_or_else(resource_limit)
        })?;
        total
            .checked_add(4)
            .and_then(|value| value.checked_add(payload))
            .ok_or_else(resource_limit)
    })?;
    let terms_bytes = terms.keys().try_fold(32usize, |total, (_, term)| {
        total
            .checked_add(36)
            .and_then(|value| value.checked_add(term.len()))
            .ok_or_else(resource_limit)
    })?;
    let postings_bytes = usize::try_from(posting_count)
        .ok()
        .and_then(|count| count.checked_mul(8))
        .and_then(|bytes| bytes.checked_add(32))
        .ok_or_else(resource_limit)?;
    for size in [passages_bytes, terms_bytes, postings_bytes] {
        if size as u64 > limits.max_artifact_bytes {
            return Err(resource_limit());
        }
    }
    let total = (passages_bytes as u64)
        .checked_add(terms_bytes as u64)
        .and_then(|value| value.checked_add(postings_bytes as u64))
        .ok_or_else(resource_limit)?;
    if total > limits.max_total_artifact_bytes {
        return Err(resource_limit());
    }
    Ok(EncodingPlan {
        passages_bytes,
        terms_bytes,
        postings_bytes,
        terms: terms.len(),
        postings: posting_count,
    })
}

fn resource_limit() -> Failure {
    Failure::new(
        Code::BuildResourceLimit,
        Phase::Sizing,
        FileKind::Generation,
    )
}

fn header(out: &mut Vec<u8>, magic: &[u8; 8], count: u64) {
    out.extend_from_slice(magic);
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&[4, 3, 2, 1]);
    out.extend_from_slice(&32u32.to_le_bytes());
    out.extend_from_slice(&count.to_le_bytes());
    out.extend_from_slice(&[0; 4]);
}
fn text(out: &mut Vec<u8>, value: &str) -> Result<()> {
    let n = u32::try_from(value.len()).map_err(|_| {
        Failure::new(
            Code::BuildEncodingFailed,
            Phase::Sizing,
            FileKind::Generation,
        )
    })?;
    out.extend_from_slice(&n.to_le_bytes());
    out.extend_from_slice(value.as_bytes());
    Ok(())
}
fn checked_len(out: &[u8], max: u64) -> Result<()> {
    if out.len() as u64 > max {
        Err(Failure::new(
            Code::BuildResourceLimit,
            Phase::Sizing,
            FileKind::Generation,
        ))
    } else {
        Ok(())
    }
}

pub fn encode_artifacts(
    build: &PreparedBuild,
    limits: &BuildLimitsV1,
) -> Result<(Vec<u8>, Vec<u8>, Vec<u8>)> {
    let plan = plan_encoding(build, limits)?;
    let passages = encode_passages(build, limits, plan.passages_bytes)?;
    let mut map: BTreeMap<(u8, Vec<u8>), BTreeMap<u32, u32>> = BTreeMap::new();
    for p in &build.passages {
        for (field, tokens) in [(1, &p.title_tokens), (2, &p.text_tokens)] {
            for token in tokens {
                let tf = map
                    .entry((field, token.clone()))
                    .or_default()
                    .entry(p.ordinal)
                    .or_default();
                *tf = tf.checked_add(1).ok_or_else(|| {
                    Failure::new(
                        Code::BuildEncodingFailed,
                        Phase::Sizing,
                        FileKind::Generation,
                    )
                })?;
                advanced();
            }
        }
    }
    if map.len() != plan.terms {
        return Err(Failure::new(
            Code::BuildResourceLimit,
            Phase::Sizing,
            FileKind::Generation,
        ));
    }
    let postings_count = map
        .values()
        .try_fold(0u64, |sum, p| sum.checked_add(p.len() as u64))
        .ok_or_else(|| {
            Failure::new(
                Code::BuildResourceLimit,
                Phase::Sizing,
                FileKind::Generation,
            )
        })?;
    if postings_count != plan.postings {
        return Err(Failure::new(
            Code::BuildResourceLimit,
            Phase::Sizing,
            FileKind::Generation,
        ));
    }
    let mut postings = Vec::new();
    postings
        .try_reserve_exact(plan.postings_bytes)
        .map_err(|_| resource_limit())?;
    output_allocation();
    header(&mut postings, b"COLRPST\0", map.len() as u64);
    let mut terms = Vec::new();
    terms
        .try_reserve_exact(plan.terms_bytes)
        .map_err(|_| resource_limit())?;
    output_allocation();
    header(&mut terms, b"COLRTRM\0", map.len() as u64);
    advanced();
    for ((field, term), docs) in map {
        let offset = postings.len() as u64;
        let mut previous = None;
        let mut total = 0u64;
        for (ordinal, tf) in &docs {
            let delta = match previous {
                None => ordinal.checked_add(1),
                Some(p) => ordinal.checked_sub(p),
            }
            .ok_or_else(|| {
                Failure::new(
                    Code::BuildEncodingFailed,
                    Phase::Sizing,
                    FileKind::Generation,
                )
            })?;
            if delta == 0 || *tf == 0 {
                return Err(Failure::new(
                    Code::BuildEncodingFailed,
                    Phase::Sizing,
                    FileKind::Generation,
                ));
            }
            postings.extend_from_slice(&delta.to_le_bytes());
            postings.extend_from_slice(&tf.to_le_bytes());
            total = total.checked_add(u64::from(*tf)).ok_or_else(|| {
                Failure::new(
                    Code::BuildEncodingFailed,
                    Phase::Sizing,
                    FileKind::Generation,
                )
            })?;
            previous = Some(*ordinal)
        }
        terms.push(field);
        terms.extend_from_slice(&[0; 3]);
        terms.extend_from_slice(&(term.len() as u32).to_le_bytes());
        terms.extend_from_slice(&term);
        terms.extend_from_slice(&(docs.len() as u32).to_le_bytes());
        terms.extend_from_slice(&total.to_le_bytes());
        terms.extend_from_slice(&offset.to_le_bytes());
        terms.extend_from_slice(&((docs.len() as u64) * 8).to_le_bytes());
    }
    checked_len(&passages, limits.max_artifact_bytes)?;
    checked_len(&terms, limits.max_artifact_bytes)?;
    checked_len(&postings, limits.max_artifact_bytes)?;
    let total = (passages.len() as u64)
        .checked_add(terms.len() as u64)
        .and_then(|x| x.checked_add(postings.len() as u64))
        .ok_or_else(|| {
            Failure::new(
                Code::BuildResourceLimit,
                Phase::Sizing,
                FileKind::Generation,
            )
        })?;
    if total > limits.max_total_artifact_bytes {
        return Err(Failure::new(
            Code::BuildResourceLimit,
            Phase::Sizing,
            FileKind::Generation,
        ));
    }
    if passages.len() != plan.passages_bytes
        || terms.len() != plan.terms_bytes
        || postings.len() != plan.postings_bytes
    {
        return Err(Failure::new(
            Code::BuildEncodingFailed,
            Phase::Sizing,
            FileKind::Generation,
        ));
    }
    Ok((passages, terms, postings))
}
fn encode_passages(
    build: &PreparedBuild,
    limits: &BuildLimitsV1,
    planned: usize,
) -> Result<Vec<u8>> {
    let mut out = Vec::new();
    out.try_reserve_exact(planned)
        .map_err(|_| resource_limit())?;
    output_allocation();
    header(&mut out, b"COLRPAS\0", build.passages.len() as u64);
    advanced();
    for p in &build.passages {
        let length_offset = out.len();
        out.extend_from_slice(&0u32.to_le_bytes());
        let body_offset = out.len();
        out.extend_from_slice(&p.ordinal.to_le_bytes());
        text(&mut out, &p.value.passage_id)?;
        text(&mut out, &p.value.source_object_id)?;
        text(&mut out, &p.value.revision_id)?;
        text(&mut out, &p.value.capture_id)?;
        text(&mut out, &p.value.representation_id)?;
        text(&mut out, &p.value.cell_id)?;
        text(&mut out, &p.value.admission_id)?;
        out.extend_from_slice(&p.value.revision_scope_digest);
        out.extend_from_slice(&p.value.revision_policy_digest);
        text(&mut out, &p.value.title)?;
        text(&mut out, &p.value.text)?;
        text(&mut out, &p.value.locator_display)?;
        text(&mut out, &p.value.media_type)?;
        text(&mut out, &p.value.language)?;
        out.extend_from_slice(&p.value.observed_at.to_le_bytes());
        out.extend_from_slice(&p.value.published_at.unwrap_or(i64::MIN).to_le_bytes());
        text(&mut out, &p.value.source_class)?;
        out.extend_from_slice(&p.value.authority_scope_digest);
        out.extend_from_slice(&p.value.tombstone_sequence.to_le_bytes());
        out.extend_from_slice(&(p.title_tokens.len() as u32).to_le_bytes());
        out.extend_from_slice(&(p.text_tokens.len() as u32).to_le_bytes());
        let body_length = u32::try_from(out.len() - body_offset).map_err(|_| resource_limit())?;
        out[length_offset..body_offset].copy_from_slice(&body_length.to_le_bytes());
        checked_len(&out, limits.max_artifact_bytes)?
    }
    if out.len() != planned {
        return Err(Failure::new(
            Code::BuildEncodingFailed,
            Phase::Sizing,
            FileKind::Generation,
        ));
    }
    Ok(out)
}
