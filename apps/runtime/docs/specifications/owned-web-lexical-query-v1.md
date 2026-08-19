# Owned-web lexical index and query specification v1

**Status:** engine-neutral target contract under ADRs 0052 and 0054. ADR 0054
supersedes only ADR 0052's Tantivy implementation choice and authorizes only the
reader qualification identified below. This target does not itself authorize a
builder, publication, serving, corpus, dependency, or production use.

## Authority layers

This document is the **target contract** for a future owned-web lexical
projection. Its generation, governance, ranking, and delivery requirements
continue to constrain later proposals. The narrower **current implementation
authority** is [owned lexical reader format/query v1](owned-lexical-reader-format-v1.md):
defensive reads of hand-authored immutable fixtures through an internal seam.
Where this target discusses build, activation, rollback, hydration, or serving,
it is a requirement for future authority, not permission to implement it now.

The lexical engine and format are Curiosity-owned, clean-room, in-repository,
and replaceable behind a Curiosity projection port. Reader v1 has no third-party
dependencies and makes no compatibility claim with Tantivy or Lucene. The index
MUST NOT own source/capture identity or bytes, authorization, tombstones, corpus
membership, evidence status, or query eligibility.

## Generation and provenance contract

Input to a future builder is one immutable authorized Ledger/capture inventory
plus extracted passages. Output is one immutable generation. No query may open
a mutable writer view. `ProjectionGenerationV1` is exactly:

```text
{version:"1",generationId,cellId,ledgerCursor,captureInventoryDigest,
 admissionInventoryDigest,revisionPolicyInventoryDigest,
 schemaVersion,formatVersion,analyzerSetDigest,rankingPolicyDigest,createdAt,
 passageCount,sourceCount,tombstoneWatermark,artifactDigests,builderVersion}
```

The canonical manifest is an immutable authority binding: it identifies all
generation inputs, versions, watermarks, artifacts, lengths, and digests. A
build receipt is separate non-authoritative process evidence and MUST NOT change
reader interpretation or grant activation. A receipt points to the manifest;
the manifest does not point to mutable process or lifecycle state. `STAGED`,
`ACTIVE`, and `RETIRED` are states of a separate publication selector, never
fields mutated inside an immutable generation. Manifests and artifacts are
strictly validated before use. A future publisher MUST atomically select a
complete generation; failed activation leaves the previous generation selected.

Readers pin one selected immutable generation for a request. Rollback means
atomically selecting a retained, already-qualified generation whose authority
and tombstone state remain compatible; it never restores deleted eligibility.
A full rebuild from equal canonical inputs and versioned policies MUST reproduce
the same eligible stable passage-ID set, manifest input bindings, and stable
diagnostics. Byte equality is required only where the separately authorized
format/builder contract says so.

Each passage is logically:

```text
{passageId,sourceObjectId,revisionId,captureId,representationId,cellId,
 admissionId,revisionScopeDigest,revisionPolicyDigest,
 title,text,locatorDisplay,mediaType,language,observedAt,publishedAt|null,
 sourceClass,authorityScopeDigest,tombstoneSequence,ordinal}
```

Stable IDs and provenance fields are never tokenized. Indexed/display data is
bounded. Raw captures, credentials, ACL labels, hidden policy, and unrestricted
bodies MUST NOT enter the projection. Every passage and generation binds the
admitted revision scope and observed-revision policy. Stale or mismatched
admission/reapproval blocks build, activation, and query eligibility; a later
revision never inherits admission.

## Analysis, mutation, and lifecycle invariants

Analyzer selection binds field, language, UTF-8 policy, Unicode normalization,
tokenizer, case handling, stopword/stemming policy, token limits, and version.
Unknown language uses explicit `und`. Index and query analysis use the same
descriptor. Analyzer drift requires a new incompatible generation and rebuild.

Future incremental construction MAY consume committed events, but publication
MUST represent a closed inventory and tombstone watermark. Tombstones are
authoritative external inputs, apply before publication, apply again before
delivery, and are never inferred from missing index rows. A generation behind
the authoritative tombstone watermark is not servable. Retention and rollback
cannot bypass takedown, erasure, legal hold, or final authority checks.

Corruption, missing or extra artifacts, duplicate stable IDs, inconsistent
capture lineage, checksum mismatch, changing build input, or an unknown version
fails closed. Physical addresses are generation-local and never enter citations
or durable provenance. The format/version seam MUST allow a later reader and a
parallel rebuilt generation to be qualified before migration; migration cannot
silently reinterpret old bytes.

## Query, ranking, and delivery invariants

The query surface is a closed typed model containing request/generation/cell
bindings, a typed lexical expression, closed typed filters, `limit`,
`freshnessAsOf`, and `authorityDecisionRef`. There is no free-form query-parser
syntax. Unknown nodes, fields, operators, enum values, or incompatible versions
fail `QUERY_UNSUPPORTED`. Authorization completes before index open or analysis.
Reader v1 realizes only an internal semantic enum/struct subset of this target;
serialization, duplicate-key handling, wire bytes, and public query ABI remain
deferred.

The candidate scorer is versioned BM25 over title/text. Analyzer, field boosts,
BM25 parameters and statistics, numeric/rank-key policy, exhaustive or optimized
execution, limits, and tie-breaks are generation-bound. A rank trace identifies
generation and policy with bounded component values. Scores are snapshot-local,
not probabilities, and MUST NOT be compared across generations or source strata.
An optimization is admissible only after exhaustive equivalence on generated
and adversarial fixtures.

Candidate results deduplicate exact `passageId`, group the same capture and
representation, then apply versioned canonical-URL/content relationship rules
without destructive identity merge. A bounded diversity policy caps repeated
source/object/origin representation. Freshness may be only an explicit bounded
rerank feature when source-class semantics and time are known; unknown time is
neither fresh nor old. Ranking, deduplication, diversity, and freshness never
override authorization, corpus policy, lineage, or tombstones.

A future serving path hydrates from authoritative capture records, verifies the
passage selector/digest, then runs ADR 0046 final authority and tombstone checks.
Missing/corrupt hydration suppresses the item and marks explicit partiality.
Empty means no eligible result in the disclosed generation. There is no silent
query-time fallback to another generation, engine, SearXNG, or source.

## Target failure and acceptance contract

Target lifecycle/delivery codes remain `PROJECTION_INPUT_INVALID`,
`PROJECTION_BUILD_FAILED`, `PROJECTION_CORRUPT`, `PROJECTION_STALE`,
`GENERATION_UNAVAILABLE`, `QUERY_UNSUPPORTED`, `QUERY_LIMIT_EXCEEDED`,
`QUERY_TIMEOUT`, `QUERY_PARTIAL`, `HYDRATION_FAILED`, and `DELIVERY_REVOKED`.
The reader tranche defines its narrower stable parse/query codes without
claiming target serving behavior.

A future end-to-end implementation MUST prove:

1. equal canonical inputs reproduce stable IDs and manifest bindings; schema or
   analyzer change creates an incompatible generation;
2. artifact corruption, duplicate IDs, stale tombstones, changing input, and
   admission/revision mismatch cannot stage, activate, or serve;
3. publication and rollback are atomic for concurrent readers and cannot
   resurrect a tombstone;
4. ranking, deterministic ties, deduplication, diversity, and unknown freshness
   match versioned policy fixtures;
5. denied queries perform zero projection reads and delivery revocation returns
   no revoked passage;
6. every delivered selector/digest reproduces against its named capture; and
7. any future shard loss is explicit partial/failure, never hidden fallback.

The only presently authorized acceptance suite is the reader-only suite in the
reader-v1 specification.

## Deferrals

Builder and publication, production corpus, live fetch, package/public ABI,
Retrieval v3 serving, phrase/proximity and positional postings, compression,
memory mapping, merges, sharding, SearXNG change, vector/hybrid retrieval,
learned ranking, production thresholds, and production authority are deferred.
Snippet policy, broader language support, generation retention, storage budgets,
performance SLOs, and representative quality judgments also require named owner
approval. None is implied by this target contract.

## Traceability

[ADRs 0041](../decisions/0041-unified-retrieval-memory-evidence-substrate.md),
[0046](../decisions/0046-retrieval-authority-security-and-mcp-boundary.md),
[0047](../decisions/0047-investigation-ranking-and-stopping-semantics.md),
[0052](../decisions/0052-next-retrieval-source-and-owned-web-specification-program.md),
and [0054](../decisions/0054-clean-room-owned-lexical-reader-qualification.md);
[Contracts v3](curiosity-retrieval-contracts-v3.md); and the
[2026-08-19 reader synthesis](../research/owned-lexical-reader-synthesis-2026-08-19.md).
