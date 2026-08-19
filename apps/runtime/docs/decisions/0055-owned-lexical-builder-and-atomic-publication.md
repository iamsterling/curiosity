# ADR 0055: owned lexical builder and atomic publication contract

**Status:** Accepted 2026-08-19 for implementation of exactly this removable,
private qualification tranche; dependencies, integration, serving, release,
live/production inputs, and production authority remain NO-GO

## Context

ADR 0054 authorizes only a clean-room reader over hand-authored `COLR/1`
fixtures. It intentionally leaves construction, generation addressing,
publication, activation, recovery, and rollback unspecified. This decision fixes
those mechanics and authorizes their exact qualification implementation without
making the acquisition database authoritative or weakening the reader oracle.

ADR numbering was checked against `docs/decisions/`: 0054 is the highest prior
runtime ADR, so 0055 is the next available number.

## Decision

Adopt the [owned lexical builder and publication v1 specification](../specifications/owned-lexical-builder-publication-v1.md)
as the complete normative contract and implementation authority for this
removable, private qualification tranche. Implementation is **GO** only for:

- project-authored, typed `BuildAuthorityV1` and passage inputs, independently
  canonical source, authority, and typed tombstone-inventory digests, and exact
  builder/policy bindings;
- deterministic `COLR/1` construction with checked resource limits;
- immutable generations addressed by their canonical manifest digest and a
  separate deterministic, non-authoritative receipt, with digest-addressed
  immutable source/authority/tombstone records outside the four reader files;
- an exact operator-preinitialized, bounded root under ADR 0053's threat-model
  precondition; the publisher has no bootstrap or repair authority;
- advisory-lock serialization, staged write/sync/full-sync/reader-validation,
  atomic rename, and directory-sync ordering;
- a bounded canonical-JSON `ACTIVE` selector with expected-current compare and
  swap, previous-generation binding, and no symlink interpretation;
- rename-as-visibility-commit semantics with distinct pre-commit preservation and
  stable post-commit durability-indeterminate reporting; and
- closed recovery, explicit activation and rollback, tombstone exclusion and
  anti-resurrection, nondecreasing current-authorization gates, hard retained/work
  caps, stable failures, and fault/crash tests.

`sourceManifestDigest` is non-circular. It is the SHA-256 of canonical
`SourceManifestV1`, which binds canonical input inventory and the independently
computed `BuildAuthorityV1` digest but contains no output manifest, generation
address, artifact digest, receipt, or `sourceManifestDigest` field. The output
manifest then contains that digest. Its exact bytes are hashed only after all
artifact bindings and the deterministic logical `generationId` are known; that
manifest hash is the physical generation address.

The current owned-web acquisition SQLite qualification is neither authoritative
nor sufficient input. It may not mint `BuildAuthorityV1`, authorize a passage,
or establish canonical tombstone state. This implementation tranche admits only
private project-authored qualification values. It grants no acquisition or
Ledger integration and no production-data path.

Canonical `BuildAuthorityV1`, `SourceManifestV1`, and
`TombstoneInventoryV1` records are immutable and independently digest-addressed
outside the reader's four-file map. Receipts and selectors bind those addresses,
so current, previous, and candidate chains are validated from retained records;
callers do not resupply historical authority contents. Tombstone entries are
canonical, sorted, scope/sequence/reason-bound inputs. Exact matches are excluded
before construction, and activation or rollback cannot select a generation that
would resurrect a currently tombstoned passage.

The hand-authored `golden-three-v1` reader fixture remains an independent oracle.
It must not be regenerated, replaced, normalized, or blessed by a future
builder. `COLR/1` bytes and reader/query semantics are unchanged.

## Threat model and durability boundary

The operator supplies an absolute, pre-existing root outside the source tree and
preinitializes the exact publication subtree, lock, and empty child directories
with specified ownership and modes. Partial or unknown bootstrap state is
rejected, never publisher-created or repaired. The stable-namespace precondition,
limitations, and defense-in-depth interpretation in ADR 0053 apply unchanged.
The advisory lock coordinates conforming processes only; it is not an isolation
or authorization boundary and does not defeat a same-UID or privileged actor.

`ACTIVE.json` rename is the visibility commit. Every pre-rename failure preserves
the old selector. A required full-sync or directory-sync failure after rename
returns only the stable post-commit indeterminate code and observed selector
digest; recovery under lock determines old or new, and retry cannot assume old.
Successful required file and directory synchronization is necessary before a
success result, but this design makes no production, arbitrary-filesystem,
hardware-cache, kernel, or power-loss durability claim. Fixed caps bound retained
generations, authority records, receipts, staging, entries, bytes, and validation
work; v1 performs no garbage collection.

## Exclusions and stop conditions

This ADR authorizes only the project-authored implementation necessary to satisfy
the exact builder, immutable persistence, validation, activation, rollback,
recovery, and tests in the v1 specification. It does not authorize a builder
dependency, public/stable ABI, TypeScript wrapper, package export, live or
production inputs, acquisition or Ledger integration, `OwnedSnapshotPort`,
retrieval serving, network access, memory mapping, compression, positions,
phrase/proximity, merges, sharding, SearXNG changes, automatic fallback or
activation, deployment, release, or production/power-loss authority.

Stop and seek a new decision if implementation would change reader bytes or
semantics, rewrite the independent fixture, accept an untyped or non-project
input, treat SQLite as authority, weaken current authorization/tombstone checks,
introduce an unknown root entry, depend on symlinks, skip synchronization or
reader validation, autoactivate or autofallback, or expose the tranche through
`OwnedSnapshotPort` or another serving boundary.

## Binary acceptance

This implementation authority is bounded by these binary checks:

1. ADR 0055 is the unique next runtime ADR and every new local Markdown link
   resolves.
2. The specification explicitly and non-circularly binds source, authority,
   schema, format, analyzer, ranking, builder, artifacts, receipt, selector,
   authorization, and tombstone state.
3. The construction, publication, recovery, rollback, failure, durability, and
   crash/fault contracts are closed and have binary tests in the implementation,
   including pre/post-commit distinction, persisted authority, bootstrap,
   tombstone anti-resurrection, and every hard root/work cap.
4. ADR 0054, reader v1, target lexical v1, and the documentation index link this
   contract while preserving reader bytes and semantics.
5. The implementing diff changes only the authorized removable internal tranche
   and tests; the hand-authored fixture, dependency manifests, package exports,
   public ABI, and serving/integration paths remain unchanged.

This ADR grants implementation GO; it does not claim that an implementation has
already passed these checks. Repository qualification is complete only when the
unchanged tests and boundaries pass together.

## Consequences

The exact private builder/publisher may now be implemented without silently
deciding authority or filesystem semantics in code. This authority ends at local
qualification generation construction and operator-invoked atomic selection.
No generated state is thereby eligible for `OwnedSnapshotPort`, retrieval
serving, live operations, deployment, or production; each requires a later ADR.

## References

[ADR 0053](0053-fixture-only-owned-web-sqlite-qualification.md),
[ADR 0054](0054-clean-room-owned-lexical-reader-qualification.md),
[reader v1](../specifications/owned-lexical-reader-format-v1.md), and
[owned-web lexical target v1](../specifications/owned-web-lexical-query-v1.md).
