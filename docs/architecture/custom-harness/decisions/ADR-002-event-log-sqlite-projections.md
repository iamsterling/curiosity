# ADR-002: Event-log truth, SQLite transactions, and disposable projections

**Status:** Accepted — 2026-08-24  
**Decision history:** Proposed 2026-08-24; accepted by the user 2026-08-24.  
**Authority:** Accepted architecture only; no persistence implementation or
migration authority. Implementation remains gated by the separately reviewed
[Phase 1 implementation plan](../PHASE-1-IMPLEMENTATION-PLAN.md).

## Context

Acknowledged commands, attempts, gates, actions, and outcomes must survive
restart without allowing a UI projection, telemetry sink, or partially updated
row to become lifecycle authority. Phase 1 is trusted-local and single-user, so
a distributed database is not required.

## Decision

The append-only domain event log is canonical for reconstructable application
history. Event envelopes include aggregate identity and version, actor,
command/execution/attempt causation, schema version, timestamp, and payload or a
digest-bound canonical artifact reference.

Use SQLite only on an exact qualified combination of SQLite build, VFS,
operating system, storage device/cache policy, and local filesystem. Every
connection verifies the effective database identity and `journal_mode=WAL`,
`foreign_keys=ON`, `synchronous=FULL`, and every additional synchronization
setting required by that profile (for example, `fullfsync=ON` and
`checkpoint_fullfsync=ON` where applicable) before it may serve reads or writes.
The profile must establish that SQLite/VFS sync and
directory-sync primitives reach the claimed storage boundary. A connection with
changed, ineffective, unsupported, or unverifiable settings is rejected; network
filesystems and VFS/filesystem combinations with unqualified sync semantics
cannot report storage readiness.

Use one Effect writer. One transaction must atomically:

1. check expected aggregate/control-ledger versions;
2. append domain events;
3. update authoritative coordination rows; and
4. enqueue transactional-outbox entries.

Idempotency reservations, leases, fencing generations, gate resolutions,
outbox delivery state, and usage-call identities are authoritative operational
ledgers, not read projections. Their consequential changes emit corresponding
events in the same transaction.

Phase 1 acknowledges a durable command, gate decision, or provider-call
allocation only after `COMMIT` returns under the verified synchronization
profile. Its failure model is explicit:

- after process kill, an acknowledged transaction is present exactly once;
- after power loss or hard reset on an exact qualified profile, recovery contains
  every acknowledged transaction exactly once and no torn transaction; and
- an unacknowledged transaction may be wholly present or absent, so recovery
  reconciles it and never infers acknowledgment from intent or side effects.

This expectation is a qualification result, not a portable SQLite guarantee. A
platform/storage profile that cannot pass power-cut or equivalent filesystem
fault qualification is unsupported for acknowledged Phase 1 durability.

Read projections and snapshots are rebuildable and never grant permission,
resolve gates, or complete attempts. Large or restricted canonical payloads may
live in an artifact store only when events retain an immutable digest and
custody reference. The artifact store also requires an exact qualified
local-filesystem profile for
durable file/directory sync, no-replace atomic installation, and recovery. Stage
and final identity must share that profile; unavailable or cross-device
publication primitives make digest-bound artifact publication unavailable.

Digest-bound artifacts use this publication protocol:

1. stage bytes under a unique unpublished identity within the qualified artifact
   store;
2. durably write and synchronize the staged file and required directories,
   close and reopen it, read it back, and verify its canonical digest;
3. atomically install it at an immutable digest-derived identity without
   replacement, synchronize the publication directory, and verify the installed
   bytes; then
4. perform transactional event publication, including the digest and custody
   record, in the same SQLite transaction as the consequential state change.

An event never references a staging path. A missing, mutable, or digest-mismatched
referenced artifact fails closed during commit validation, startup, replay, and
before dependent dispatch or completion. Recovery performs orphan reconciliation
for staged or installed artifacts lacking a committed custody/event reference;
it may safely retain, quarantine, or delete them after reference checks, but it
cannot create an event from their presence. Event schemas and migrations are
versioned; unknown versions fail closed.

Domain code depends on persistence ports rather than SQLite SQL. PostgreSQL is a
later explicit quiesced cutover with export digests, import, projection rebuild,
and reconciliation—not Phase 1 dual-write or a zero-downtime claim.

## Invariants

- **ADR-002-I01:** Acknowledgment occurs only after the admission transaction
  commits.
- **ADR-002-I02:** State, event, and outbox changes all commit or all roll back.
- **ADR-002-I03:** Projection loss cannot erase canonical history or change
  authority.
- **ADR-002-I04:** Transactional event publication cannot precede durable, readback-verified
  publication of any referenced artifact.
- **ADR-002-I05:** External provider/tool side effects are not transactionally exactly-once with
  SQLite; ambiguity remains explicit.

## Consequences

Local operation remains simple and replayable. Event evolution, artifact
custody, backup consistency, and replay testing become mandatory engineering
work. SQLite does not authorize team, remote, high-availability, or network
filesystem use.

## Binary acceptance checks

- [ ] **ADR-002-AC01:** Crash injection proves event, control row, and outbox
      atomicity.
- [ ] **ADR-002-AC02:** Connection qualification verifies `journal_mode=WAL`,
      `foreign_keys=ON`, `synchronous=FULL`, and profile-specific sync settings
      on every connection; changing or disabling one fails readiness.
- [ ] **ADR-002-AC03:** Process-kill and power-cut or equivalent filesystem-fault tests on every
      supported SQLite/VFS/filesystem profile recover all acknowledged
      transactions exactly once, permit only whole unacknowledged transactions,
      and reject corruption or torn state.
- [ ] **ADR-002-AC04:** Deleting projections followed by replay reconstructs
      canonical history.
- [ ] **ADR-002-AC05:** Startup rejects a network filesystem, failed write probe, corrupt database,
      or unknown event schema.
- [ ] **ADR-002-AC06:** Crash injection at every artifact publication boundary—from stage/write,
      synchronization, close/readback, immutable install, directory sync, event
      commit, and acknowledgment—never exposes an event with a missing or
      mismatched artifact and reconciles unreferenced bytes as orphans.
- [ ] **ADR-002-AC07:** Deleting or corrupting a referenced artifact blocks replay, dependent
      dispatch, and completion rather than treating the event alone as complete.
- [ ] **ADR-002-AC08:** Backup/restore preserves matching SQLite and artifact digests and uses a
      qualified consistent-cut procedure.

## Non-goals

Event-store implementation, PostgreSQL, dual-write, high availability, and
exactly-once external side effects.
