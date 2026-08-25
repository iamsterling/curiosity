# ADR-003: Command idempotency, attempts, fencing, retry, and cancellation

**Status:** Accepted — 2026-08-24  
**Decision history:** Proposed 2026-08-24; accepted by the user 2026-08-24.  
**Authority:** Accepted architecture only; no scheduler or worker implementation
authority. Implementation remains gated by the separately reviewed
[Phase 1 implementation plan](../PHASE-1-IMPLEMENTATION-PLAN.md).

## Context

Transport retries, crashes, expired workers, uncertain external delivery, and
recursive child execution must not create duplicate commands, stale completion,
or background processes that outlive cancellation.

## Decision

Every accepted request has an authenticated `ActorId`, `CommandId`, actor-scoped
`IdempotencyKey`, request digest, `SessionId`, and `ExecutionId`. Reusing the key
with the same digest returns the original command; reuse with different content
is a conflict. All transports call the same admission transaction and
acknowledge only after commit.

Each claim or retry creates a new `AttemptId`. Claims use compare-and-swap over
execution version, owner, lease expiry, heartbeat, and monotonically increasing
fencing generation. Default Phase 1 execution is serialized per session.
Parallel branches require an explicit policy and isolated targets.

Before a provider call, Effect commits an immutable attempt snapshot covering
history revision, context/compaction references, provider/model settings, tool
schemas and versions, policy/authority ceiling, provenance, and accounting
context. A later policy relaxation cannot widen the attempt; a revocation may
narrow it. Any digest-bound snapshot artifact completes ADR-002's durable
write/readback/publication protocol before the snapshot transaction can commit
or a provider/tool dispatch can begin.

Retries are delivery-aware:

- internal idempotent work may retry finitely;
- known-undelivered provider calls retry with a new `ProviderCallId`;
- uncertain provider delivery records unknown usage before policy decides;
- idempotent tools or verified idempotency-key sinks may retry finitely; and
- uncertain non-idempotent effects require reconciliation or human decision.

Cancellation is a durable command. It commits intent, recursively targets child
executions, prevents new dispatch, aborts provider streams, asks Rust to
terminate descendants, and fences late results. A timeout uses the same path.
Cancellation completes only after verified termination or an explicit
uncertainty/reconciliation state.

Completion is an attempt-scoped compare-and-swap requiring the current owner,
fencing generation, eligible execution state, satisfied dependencies/gates, no
active cancellation, and committed action/accounting records.

## Invariants

- **ADR-003-I01:** Retries never rewrite an earlier attempt or provider-call
  identity.
- **ADR-003-I02:** A stale owner or supervisor result can add quarantined evidence but cannot
  complete work.
- **ADR-003-I03:** No acknowledged command is memory-only.
- **ADR-003-I04:** No infinite automatic retry or promise-only timeout is
  permitted.

## Binary acceptance checks

- [ ] **ADR-003-AC01:** Cross-transport duplicates resolve to one command and
      execution.
- [ ] **ADR-003-AC02:** Kill-after-acknowledgment recovery reschedules accepted
      work.
- [ ] **ADR-003-AC03:** Lease expiry fences stale completion and creates a new
      attempt.
- [ ] **ADR-003-AC04:** A missing or corrupt digest-bound attempt artifact blocks recovery,
      provider/tool dispatch, and completion.
- [ ] **ADR-003-AC05:** Recursive cancellation terminates descendants and rejects
      late results.
- [ ] **ADR-003-AC06:** Uncertain non-idempotent dispatch cannot auto-retry.

## Non-goals

Distributed workers, unconstrained parallel sessions, and exactly-once delivery
across external systems.
