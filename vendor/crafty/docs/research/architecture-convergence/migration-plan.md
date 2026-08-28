# Migration Proposal

This is a proposed sequence, not an authorization to execute it.

## Stage 0: Baseline and truth cleanup

- Intent: make current reality explainable before adding seams.
- Scope: route links, architecture docs, protocol/version claims, preview
  semantics, component persistence/resolution claims, stale tool lists.
- Invariants: no behavior change; source remains authoritative.
- Tests: full typecheck, lint, format, isolated and full tests, route smoke
  checks.
- Rollback: one documentation/compatibility checkpoint.
- Completion: docs and links describe the live tree, or explicitly label
  transitional behavior.

## Stage 1: Boundary inventory

- Intent: record ownership of duplicated coordinate, hit-test, scene, and
  harness semantics.
- Scope: no public API redesign; add measurements and focused tests.
- Completion: each duplicated path has an owner, adapter, or retirement task.

## Stage 2: Selection and workspace seam

- Intent: make future modes possible without route or shell sprawl.
- Scope: only after a concrete second mode is selected; define selection scopes
  and a first-party mode descriptor at the smallest required size.
- Completion: one existing mode and one new mode use the seam without a giant
  conditional shell.

## Stage 3: Command-room foundation

- Intent: make automation and future collaboration use durable semantics.
- Scope: bounded reads, revisioned envelopes, receipts, idempotency, capability
  checks, persistence status; initially serialize one operation per file.
- Completion: an in-process adapter and one transport adapter pass stale-state,
  rollback, and persistence-failure tests.

## Stage 4: Renderer convergence

- Intent: reduce legacy `Scene` and side-channel coupling.
- Scope: measure packet/scene cost, confirm split-path behavior, migrate one
  shape family at a time, preserve protocol compatibility checkpoints.
- Completion: no duplicated ordering/hit-test assumptions for the migrated family.

## Stage 5: Code and animation seams

- Intent: establish projections and resolved-time motion without making either
  a second canonical artifact.
- Scope: only when product work demands it; use stable IDs/anchors, validated
  commands, deterministic evaluation, cancellation/versioning.

Each stage requires review, a coherent commit, relevant tests, and a rollback
point before the next stage begins.
