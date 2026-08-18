# ADR 0026: M2 foundational durable-state boundary

**Status:** Accepted for bounded dependency-free M2 on 2026-08-18

## Context

M2 requires D5 approval before authoritative state is written. The boundary must
separate durable truth from disposable query machinery and must not make query
credentials administrative authority. M1 is stateless.

## Proposed decision

The selected dependency-free design candidate is canonical files, as specified
in [canonical file state](../design/canonical-file-state.md). This selects only a
design direction for review: it does not accept D5, create state, establish
durability, or authorize M2. SQLite is not selected; adopting it would require a
future ADR plus D8 approval of its exact dependency/build provenance.

If separately accepted, authoritative records would be the approved snapshot
manifest and immutable document versions; rights, provenance, classification,
custody, retention, and digest records; import/validation/activation decisions;
lifecycle state and transition reasons; withdrawal, deletion, and tombstone
facts; schema/migration identity; and the minimum redacted administrative audit
needed to prove those acts. Backups preserve authoritative records but are not a
second writable authority.

Search indexes, analyzer output, caches, derived passages, ranking features,
statistics, build checkpoints, and query-optimized views would be rebuildable
projections. A projection never becomes provenance, rights, lifecycle, deletion,
or audit truth and must carry the authoritative snapshot and projection-build
versions from which it was derived.

The proposed snapshot lifecycle is `registered` → `validated` → `active`.
Validation failure enters `rejected`; suspected corruption or policy breach
enters `quarantined`; owner withdrawal enters `withdrawn`; removal proceeds
through `deleting` to `deleted`, retaining only the approved tombstone and audit
facts. Only an explicit admin transition may activate, quarantine, withdraw,
delete, restore, or supersede. Query authority may read only an active,
compatible projection and may never import, transition, rebuild, restore, or
delete state.

The accepted design would also have to require:

- atomic authoritative writes and lifecycle transitions, crash-safe projection
  publication, no partially active import, and deterministic idempotency rules;
- fail-closed digest/schema checks, quarantine of corrupt authoritative records,
  discard-and-rebuild for corrupt projections, and distinct stable outcomes for
  absence, incompatibility, corruption, and partial rebuild;
- versioned, integrity-checked backups with defined custody, encryption/access
  policy where classification requires it, restore rehearsal, point-in-time
  scope, and proof that restored projections derive from restored authority;
- deletion and withdrawal that first durably persist a minimal non-content
  tombstone and lifecycle commit, then remove query visibility, propagate through every projection/cache/backup under a
  defined policy, and survive rebuild and restore without resurrection; and
- append-only or equivalently tamper-evident, bounded, redacted audit records for
  admin attempts and outcomes, denial, import, activation, quarantine,
  withdrawal, deletion, backup, restore, and rebuild. Document bodies, secrets,
  raw failures, and sensitive principal data do not belong in audit output.

This foundational boundary proposes no domain-event stream. If later operations
need durable jobs or event delivery, D5A must define ordering, replay, cursors,
deduplication, retention, and settlement separately.

## Mechanism trade-offs

| Mechanism | Benefit | Cost/risk | Proposed disposition |
| --- | --- | --- | --- |
| Canonical files | Dependency-free mechanism and inspectable immutable records | Must resolve locking, journaling, atomic rename/fsync, concurrency, backup consistency, and migration safety | **Selected design candidate only; not approved for implementation** |
| SQLite | Transactions, constraints, integrity checks, backup support, and local single-file operation | Adds a mechanism/dependency and schema/migration/locking obligations; exact package/build provenance must pass D8 | Not selected; future ADR plus D8 required |
| In-memory state | Simple and adequate for M1 | Cannot satisfy durability, restart, backup/restore, custody, tombstone, or audit requirements | Insufficient for M2 authoritative state |

## Gates and STOP conditions

D5 may become accepted only after state/security/privacy/operations owners
approve record classification, lifecycle transitions, query/admin authorization,
custody paths, retention/deletion/tombstone policy, backup/restore objectives,
corruption response, atomicity model, audit/redaction, and a tested rollback
plan. The exact persistence mechanism, schema, migration policy, and dependency
record must be separately approved; SQLite or another dependency must pass D8.

`STOP` if a projection is the only truth; query and admin authority merge;
partial imports can become visible; corruption can be silently served or
overwritten; restore can resurrect withdrawn data; deletion cannot propagate;
audit leaks content or secrets; owners, custody, retention, or recovery targets
are absent; or mechanism/dependency selection is merely implied by this text.

## Open owner decisions

Resolved for M2 by the requester acting as state, security/privacy, custody, and
operations owner: canonical files are authoritative; one local administrative
writer is separated from query capabilities; fixture classification is
public-synthetic; repository fixture custody and an externally configured state
root are approved; commits are the bounded lifecycle audit; and minimal
non-content tombstones remain after withdrawal/deletion. Projections are
disposable and deterministic. No domain event stream is introduced.

Publication uses same-filesystem temporary-file write, file sync, atomic rename,
and visible-ref-last ordering. Supported evidence is Darwin/APFS test execution;
directory sync is attempted but no cross-filesystem, power-loss, RPO/RTO, or
production durability guarantee is made. A create-new writer lock fails closed;
normal exit removes it, while crash-stale lock removal is an operator act after
exclusive-writer verification. Orphan `.stage-*` files are removed under that
lock. Backup/restore is not exposed or claimed in M2. Format migration,
downgrade, garbage collection beyond the one approved fixture, break-glass, and
production identity are out of scope.

Every observed component beneath fixture and state roots is rejected if it is a
symlink, including content-address prefix directories, and confinement is
rechecked before authoritative reads/writes. Rust stdlib pathname checks do not
provide descriptor-relative `openat`/`O_NOFOLLOW`; a same-process attacker that
can swap path components between check and use remains outside this M2 boundary.

1. Who owns authoritative state, security/privacy classification, operations,
   backup/restore, deletion, and audit review?
2. What principal and capability model enforces query/admin separation, and what
   is the break-glass and revocation policy?
3. Which records and minimal tombstone fields may remain after deletion, for how
   long, and under which legal basis?
4. What atomicity, durability, corruption-detection, recovery-point,
   recovery-time, and restore-test requirements apply?
5. What exact canonical-file fsync, locking, migration, downgrade, and recovery
   policy is accepted, or does a future ADR replace this candidate with SQLite
   after D8 approval?
6. Are foundational audit records part of D5 without a domain-event stream, and
   where are they retained and reviewed?

## Non-authorization

The prior non-authorization is superseded only for bounded M2 under ADR 0027.
It remains in force for events, dependencies, migrations, production durability,
networking, adapters, packaging, deployment, and M3–M7.
