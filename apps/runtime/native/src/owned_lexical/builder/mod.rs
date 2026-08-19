//! Private, removable ADR 0055 builder/publication qualification.

mod canonical;
mod canonical_records;
mod encoding;
mod model;
mod publication;
mod publication_fs;
mod publication_inventory;

use std::collections::BTreeMap;

use super::analyzer::{analyze, analyze_metrics};
use super::model::{Limits as ReaderLimits, Reader};
use super::sha256::Sha256;
use super::source::{ReadAtV1, Sources};
use canonical::{authority_bytes, passage_inventory, source_bytes, tombstone_bytes};
use encoding::encode_artifacts;
use model::*;
#[allow(unused_imports)]
pub(super) use publication::*;

fn build(input: &BuildInputV1) -> Result<BuildOutputV1> {
    logical_memory_preflight(input)?;
    let prepared = canonical::validate_and_prepare(input)?;
    let inventory = passage_inventory(&prepared.passages)?;
    if digest(&inventory) != input.authority.passage_inventory_digest {
        return Err(Failure::new(
            Code::BuildInputInvalid,
            Phase::Input,
            FileKind::Source,
        ));
    }
    let tombstones = tombstone_bytes(&input.tombstones);
    if digest(&tombstones) != input.authority.tombstone_inventory_digest {
        return Err(Failure::new(
            Code::BuildInputInvalid,
            Phase::Input,
            FileKind::Tombstone,
        ));
    }
    let authority = authority_bytes(&input.authority);
    let authority_digest = digest(&authority);
    let source = source_bytes(
        &input.authority,
        authority_digest,
        prepared.passages.len() as u32,
    );
    let source_total = inventory
        .len()
        .checked_add(tombstones.len())
        .and_then(|n| n.checked_add(authority.len()))
        .and_then(|n| n.checked_add(source.len()))
        .ok_or_else(|| Failure::new(Code::BuildResourceLimit, Phase::Sizing, FileKind::Source))?;
    if source_total as u64 > input.authority.limits.max_source_bytes {
        return Err(Failure::new(
            Code::BuildResourceLimit,
            Phase::Sizing,
            FileKind::Source,
        ));
    }
    let source_digest = digest(&source);
    let (passages, terms, postings) = encode_artifacts(&prepared, &input.authority.limits)?;
    let manifest = canonical::manifest_bytes(
        &input.authority,
        prepared.passages.len() as u32,
        source_digest,
        &passages,
        &terms,
        &postings,
    );
    let manifest_digest = digest(&manifest);
    validate_reader(&manifest, &passages, &terms, &postings)?;
    let receipt = canonical::receipt_bytes(
        authority_digest,
        source_digest,
        input.authority.tombstone_inventory_digest,
        manifest_digest,
        &manifest,
        &passages,
        &terms,
        &postings,
    );
    Ok(BuildOutputV1 {
        build_authority: authority,
        source_manifest: source,
        tombstone_inventory: tombstones,
        manifest,
        passages,
        terms,
        postings,
        receipt,
        build_authority_digest: authority_digest,
        source_manifest_digest: source_digest,
        tombstone_inventory_digest: input.authority.tombstone_inventory_digest,
        manifest_digest,
    })
}

fn logical_memory_preflight(input: &BuildInputV1) -> Result<()> {
    let transcript = logical_memory_transcript(input)?;
    let retained = transcript.total;
    let emissions = transcript.emissions;
    if emissions > input.authority.limits.max_token_emissions
        || retained > input.authority.limits.max_retained_logical_bytes
    {
        return Err(memory_limit());
    }
    Ok(())
}

fn logical_memory_required(input: &BuildInputV1) -> Result<(u64, u64)> {
    let transcript = logical_memory_transcript(input)?;
    Ok((transcript.total, transcript.emissions))
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct LogicalMemoryTranscript {
    charges: [(&'static str, u64); 4],
    total: u64,
    emissions: u64,
}

fn logical_memory_transcript(input: &BuildInputV1) -> Result<LogicalMemoryTranscript> {
    let mut input_strings = 0u64;
    let mut emissions = 0u64;
    let mut token_bytes = 0u64;
    for passage in &input.passages {
        for value in [
            &passage.passage_id,
            &passage.source_object_id,
            &passage.revision_id,
            &passage.capture_id,
            &passage.representation_id,
            &passage.cell_id,
            &passage.admission_id,
            &passage.title,
            &passage.text,
            &passage.locator_display,
            &passage.media_type,
            &passage.language,
            &passage.source_class,
        ] {
            input_strings = input_strings
                .checked_add(value.len() as u64)
                .ok_or_else(memory_limit)?;
        }
        for value in [&passage.title, &passage.text] {
            let (count, bytes) = analyze_metrics(value).map_err(|_| {
                Failure::new(Code::BuildInputInvalid, Phase::Input, FileKind::Source)
            })?;
            emissions = emissions.checked_add(count).ok_or_else(memory_limit)?;
            token_bytes = token_bytes.checked_add(bytes).ok_or_else(memory_limit)?;
        }
    }
    let token_slots = emissions.checked_mul(48).ok_or_else(memory_limit)?;
    let tombstone_slots = (input.tombstones.entries.len() as u64)
        .checked_mul(128)
        .ok_or_else(memory_limit)?;
    let charges = [
        ("input-strings", input_strings),
        ("token-bytes", token_bytes),
        ("token-slots", token_slots),
        ("tombstone-slots", tombstone_slots),
    ];
    let total = charges.iter().try_fold(0u64, |sum, (_, charge)| {
        sum.checked_add(*charge).ok_or_else(memory_limit)
    })?;
    Ok(LogicalMemoryTranscript {
        charges,
        total,
        emissions,
    })
}

fn memory_limit() -> Failure {
    Failure::new(Code::BuildResourceLimit, Phase::Sizing, FileKind::Source)
}

fn digest(bytes: &[u8]) -> Digest32 {
    let mut hash = Sha256::new();
    hash.update(bytes);
    hash.finish()
}

struct Memory<'a>(&'a [u8]);
impl ReadAtV1 for Memory<'_> {
    fn len(&self) -> u64 {
        self.0.len() as u64
    }
    fn read_at(&self, offset: u64, destination: &mut [u8]) -> std::result::Result<(), ()> {
        let start = usize::try_from(offset).map_err(|_| ())?;
        let end = start.checked_add(destination.len()).ok_or(())?;
        destination.copy_from_slice(self.0.get(start..end).ok_or(())?);
        Ok(())
    }
}

fn validate_reader(manifest: &[u8], passages: &[u8], terms: &[u8], postings: &[u8]) -> Result<()> {
    let manifest_source = Memory(manifest);
    let passages_source = Memory(passages);
    let terms_source = Memory(terms);
    let postings_source = Memory(postings);
    let sources: Sources<'_> = BTreeMap::from([
        ("manifest.json", &manifest_source as &dyn ReadAtV1),
        ("passages.colr", &passages_source as &dyn ReadAtV1),
        ("terms.colr", &terms_source as &dyn ReadAtV1),
        ("postings.colr", &postings_source as &dyn ReadAtV1),
    ]);
    Reader::open(&sources, ReaderLimits::default())
        .map(|_| ())
        .map_err(|_| {
            Failure::new(
                Code::ReaderValidationFailed,
                Phase::Validation,
                FileKind::Generation,
            )
        })
}

#[cfg(test)]
mod tests;
