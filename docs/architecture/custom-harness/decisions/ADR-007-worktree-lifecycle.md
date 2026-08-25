# ADR-007: Real Git worktree lifecycle and interrupted-operation reconciliation

**Status:** Accepted — 2026-08-24  
**Decision history:** Proposed 2026-08-24; accepted by the user 2026-08-24.  
**Authority:** Accepted architecture only; no Git mutation implementation
authority. Implementation remains gated by the separately reviewed
[Phase 1 implementation plan](../PHASE-1-IMPLEMENTATION-PLAN.md).

## Context

A directory name or successful command exit is insufficient proof of a usable
worktree. Path races, symlinks, wrong repositories, interrupted Git operations,
and stale HEAD assumptions can redirect later mutations.

## Decision

Effect owns worktree intent and lifecycle state; Rust performs and verifies host
Git operations. A worktree lifecycle is `Requested`, `Preparing`, `Ready`,
`ReconciliationRequired`, and a terminal removed/failed state. Only verified
host facts permit the transition to `Ready`.

Before creation, Effect records the registered repository identity, expected
HEAD object, allocated destination, initiating actor/command, and required
capability grant. The destination is allocated relative to an opened, configured
worktree-root handle; callers cannot supply arbitrary host paths.

Rust uses structured arguments and qualified per-platform primitives that walk
components without following links and perform effects relative to retained root
and target directory handles. Creation, Git mutation, and cleanup must establish
root-anchored resolution and use-time containment at every effecting operation,
not merely canonicalize a string before use. The mechanism must prevent or
detect ancestor rename/reparent and symlink substitution between resolution and
use, retain and compare stable filesystem identities, and never re-resolve an
untrusted absolute path. A check-then-use `realpath`/canonical-path test is
insufficient.

The exact OS, filesystem, supervisor build, and primitive sequence are separately
qualified. If race-resistant no-follow traversal, anchored mutation/deletion, or
use-time identity/containment checks are unavailable for an operation, that Git
or path capability is unavailable and the action fails closed. This requirement
includes the Git subprocess working directory and every path it resolves; a Git
backend that can only re-resolve a mutable path outside the qualified mechanism
is ineligible. Rust then performs the Git operation and verifies:

- repository identity and registration;
- root-anchored identity and use-time containment of the resulting target;
- actual Git worktree registration; and
- actual HEAD object against the accepted expectation.

Effect commits `Ready` only from the matching receipt, action, attempt, and
fence. A crash or disconnect leaves `Preparing` or
`ReconciliationRequired`. Recovery inspects Git's actual registered state and
filesystem facts; directory existence never implies success.

Merge, rebase, push, deletion, and destructive cleanup are separate sinks with
separate policy, gates, idempotency, and reconciliation. Cleanup may not delete
an unverified or non-contained target.

## Invariants

- **ADR-007-I01:** Plain directories cannot masquerade as worktrees.
- **ADR-007-I02:** Effect owns intent/state; Rust owns mechanical Git facts; neither duplicates
  the other's authority.
- **ADR-007-I03:** Every mutation is tied to exact repository, path, action,
  attempt, and fence.
- **ADR-007-I04:** Containment is a use-time property of root-anchored operations, not an earlier
  lexical or canonical-path assertion.
- **ADR-007-I05:** Interrupted operations are reconciled, not blindly replayed.

## Binary acceptance checks

- [ ] **ADR-007-AC01:** Fake directories, wrong repositories, wrong HEADs, traversal, and symlink
      escapes fail before `Ready`.
- [ ] **ADR-007-AC02:** Concurrent negative tests swap or reparent each destination ancestor and
      replace each path component with a symlink before and during creation,
      mutation, and cleanup; no effect reaches or deletes an object outside the
      retained root, and uncertainty fails closed into reconciliation.
- [ ] **ADR-007-AC03:** Removing any required root-handle, no-follow, stable-identity, or use-time
      containment primitive prevents the dependent operation on that exact
      platform/filesystem profile.
- [ ] **ADR-007-AC04:** Crash at each lifecycle transition recovers to verified `Ready`, explicit
      failure, or `ReconciliationRequired` without duplicate mutation.
- [ ] **ADR-007-AC05:** Push, merge, and deletion cannot reuse a creation grant.
- [ ] **ADR-007-AC06:** Cleanup cannot escape the configured worktree root or act on a path whose
      retained identity no longer matches the root-anchored target.

## Non-goals

Git hosting integration, merge strategy, automatic push, caller-selected paths,
and treating a directory as worktree evidence.
