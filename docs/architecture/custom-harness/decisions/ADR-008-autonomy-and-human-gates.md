# ADR-008: Default-deny, propose-first autonomy and one-human gates

**Status:** Accepted — 2026-08-24  
**Decision history:** Proposed 2026-08-24; accepted by the user 2026-08-24.  
**Accepted input:** AC-03  
**Authority:** Accepted architecture only; no autonomous-operation or approval
implementation authority. Implementation remains gated by the separately
reviewed [Phase 1 implementation plan](../PHASE-1-IMPLEMENTATION-PLAN.md).

## Context

Model and tool output is untrusted proposal data. Treating generated claims,
simulated councils, UI state, or prompt text as approval would allow the actor
seeking authority to manufacture it.

## Decision

Phase 1 is default-deny and propose-first. Reads and mutations require explicit
typed grants; consequential tool calls decoded from model output become durable
proposals and never execute merely because the model requested or described
them. Policy may pre-authorize a bounded class only through an explicit reviewed
rule; no implicit “safe” class exists.

Use one authenticated human principal for every binding human approval. Do not
represent model agents as voters or call the Phase 1 mechanism a multi-party
council. The schema may preserve future quorum fields, but the active rule is a
single eligible human decision.

A gate binds the proposal ID, revision, payload digest, exact execution/action
scope, policy version, eligible human identity, decision rule, expiry, and
durable approve/deny record. Proposal mutation creates a new revision and
invalidates prior approval. Only Effect's Gate Service resolves a gate by
compare-and-swap. Completion checks every binding gate in its own
compare-and-swap.

Model, tool, supervisor, projection, telemetry, or UI output may supply evidence
to the human but cannot vote, authenticate the human, resolve the gate, or
complete the action. Declassification, widened authority, Git publication, and
uncertain non-idempotent retry are distinct commands/gates when policy requires
them.

## Invariants

- **ADR-008-I01:** Absence, timeout, stale revision, digest mismatch, and authentication failure
  deny the gated action.
- **ADR-008-I02:** Approval is not transferable across action, payload, target,
  or revision.
- **ADR-008-I03:** Policy relaxation never retroactively widens an in-flight
  attempt.
- **ADR-008-I04:** UI presentation is not the gate's durable source of truth.

## Binary acceptance checks

- [ ] **ADR-008-AC01:** Model/tool claims cannot approve a proposal or complete
      an attempt.
- [ ] **ADR-008-AC02:** Mutation after approval invalidates the approval.
- [ ] **ADR-008-AC03:** Replay, expiry, wrong actor, and digest substitution are
      denied.
- [ ] **ADR-008-AC04:** Completion cannot bypass an unresolved binding gate.

## Non-goals

Multi-human quorum, model voting, unattended mutation by default, and claims
that a proposal is an authorized action.
