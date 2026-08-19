# ADR 0054: clean-room owned lexical reader qualification

**Status:** Accepted 2026-08-19 only for a removable, internal, reader-only
qualification; production, publication, serving, and corpus authority remain
NO-GO

## Context

ADR 0052 selected Tantivy as a replaceable lexical projection while expressly
leaving dependency review open. Completed lexical research found the durable
lessons to be immutable generations, sorted postings, snapshot readers,
versioned analysis and ranking, and exhaustive-before-optimized top-K—not any
upstream library, API, or file format. The [research synthesis](../research/owned-lexical-reader-synthesis-2026-08-19.md)
recommends the smallest independently specified reader tranche.

ADR numbering was checked against `docs/decisions/`: 0053 is the highest prior
runtime ADR, so 0054 is the next available number.

## Decision

Supersede **only** ADR 0052's choice of Tantivy as the owned-web lexical
implementation. Curiosity selects an in-repository, dependency-free,
clean-room-owned immutable lexical format and engine governed by the
[engine-neutral target contract](../specifications/owned-web-lexical-query-v1.md)
and the [reader-v1 format/query specification](../specifications/owned-lexical-reader-format-v1.md).
There is no compatibility claim with Tantivy or Lucene.

Authorize a first implementation proposal only for:

- a defensive parser over bounded `read_at(offset,length)` access;
- the fixed v1 UTF-8 analyzer and closed typed query/filter model;
- exact exhaustive BM25 top-K with deterministic resource accounting;
- hand-authored golden byte fixtures, corruption/property tests, and stable
  failure codes; and
- an internal-only integration seam that is absent from package exports and
  public/stable ABIs.

Reader v1 has no third-party runtime or development dependencies. It may use
only the repository's existing language standard libraries and test facilities.
Published algorithms and primary literature may inform independently written
requirements and tests; upstream source, formats, constants without an
independent rationale, fixtures, APIs, and code must not be copied or translated.

All ADR 0052 projection and governance invariants remain in force: captures and
Ledger records remain authoritative; generations are immutable; manifests,
stable provenance, tombstones, rollback/rebuild, authorization, hydration,
ranking policy, deduplication, diversity, freshness, and migration seams remain
Curiosity-owned and fail closed. This ADR does not change SQLite qualification,
SearXNG, source admission, or canonical Ledger authority.

## Exclusions

This ADR grants no authority for an index builder, generation publication or
activation, production corpus, live fetch, package/public ABI, Retrieval v3
serving, phrase/proximity queries or positions, compression, memory mapping,
merges, sharding, SearXNG change, deployment, release, or production use. It
does not authorize importing upstream indexes or using Tantivy/Lucene as a test
oracle. Each excluded capability requires a later ADR and qualification plan.

## Binary acceptance and stop conditions

Implementation is accepted only when all checks in the reader-v1 specification
pass unchanged, including exact golden ranking, every-byte truncation, bounded
`read_at` behavior, checksum and cross-file corruption, typed-query rejection,
resource-limit accounting, tombstone suppression, deterministic repeated runs,
no-network execution, dependency-tree equality, and export/symbol absence.
Equal fixture bytes, semantic query, tombstones, and semantic work limits must
produce equal result IDs, rank keys, semantic work counters, and failure codes.
Read-call, requested-byte, and allocation telemetry is implementation-local: it
must stay within bounds and repeat for the same implementation, configuration,
and inputs, but is not equal across conforming implementation strategies.

Stop without widening scope if any implementation needs a dependency, builder,
positions, compression, mmap, mutable files, unbounded allocation/read, public
surface, live/production input, upstream fixture/format copying, or a change to
an ADR 0052 governance invariant. Stop and seek a new decision if the format is
ambiguous enough for two conforming readers to disagree, the golden fixture
cannot be authored without an index writer, deterministic rank keys cannot be
reproduced, or clean-room provenance cannot be demonstrated.

## Consequences

The first tranche proves only that hostile immutable fixture bytes can be parsed
and queried correctly within explicit budgets. It deliberately pays the cost of
an exhaustive scorer and simple uncompressed layout to establish an auditable
oracle before optimization. It cannot create, publish, activate, or serve an
owned-web generation.

## References

[ADR 0052](0052-next-retrieval-source-and-owned-web-specification-program.md),
[ADR 0053](0053-fixture-only-owned-web-sqlite-qualification.md),
[lexical target contract](../specifications/owned-web-lexical-query-v1.md), and
[reader-v1 format/query specification](../specifications/owned-lexical-reader-format-v1.md).
