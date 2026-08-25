# ADR-004: Provider Gateway and complete physical-call accounting

**Status:** Accepted — 2026-08-24  
**Decision history:** Proposed 2026-08-24; accepted by the user 2026-08-24.  
**Accepted input:** AC-03  
**Authority:** Accepted architecture only; no provider or dependency adoption
authority. Implementation remains gated by the separately reviewed
[Phase 1 implementation plan](../PHASE-1-IMPLEMENTATION-PLAN.md).

## Context

Vercel AI SDK is preferred for provider integration, but provider helpers must
not become a hidden harness with independent loops, retries, tool execution,
state, or budget claims. Every actual provider request must remain attributable,
including requests that fail or have uncertain delivery.

## Decision

All provider access goes through one Effect `ProviderGateway`. Vercel AI SDK is
limited to request encoding, provider adaptation, structured response/tool-call
decoding, stream parsing, and provider error normalization.

The SDK and its adapters may not own multi-step loops, execute tools, choose
retries, select context or visible tools, authorize actions, write durable state,
resolve gates, complete attempts, or enforce budgets. Hidden SDK retries and
automatic tool loops must be disabled. An adapter that cannot expose or disable
additional calls is ineligible.

Before each physical request, Effect durably allocates a `ProviderCallId` and
records attempt, purpose, provider/model, request digest, dispatch state, and
accounting context. Purposes include normal turns, retries, warmups, compaction,
child calls, reconciliation, and evaluation calls. Result, failure,
cancellation, or delivery uncertainty is appended to that same call identity.
Physical dispatch is forbidden until this transaction satisfies ADR-002's
acknowledged-durability profile and every digest-bound request artifact is
durably published and readback-verified.

The durable pre-dispatch state arms that identity for at most one gateway send.
After process crash, power loss, or hard reset, any armed call without a durable
terminal delivery fact becomes `DISPATCH_UNKNOWN` unless provider evidence proves
it was not delivered. Recovery never deletes or reuses its `ProviderCallId`,
assumes zero usage, or retries under that identity. Reconciliation or policy must
resolve the ambiguity; any later physical retry receives a new identity and
retains causation to the unknown call.

Complete call accounting is a qualified TCB invariant, not a claim that a Rust
grant blocks arbitrary same-user network traffic. Reviewed external tools must
contain no provider client or direct provider-request behavior, and launch
hygiene removes inherited provider credentials. A tool observed attempting a
direct provider call is ineligible. If accounting must withstand a
noncooperative tool, that invocation additionally requires exact qualified OS
network and credential confinement under ADR-006 or is denied.

“Complete accounting” means every physical call is represented, not that every
provider reports complete token or currency data. Preserve raw provider usage,
cache/retry fields, and provider request IDs when available. Estimates, reported
usage, versioned prices, and reconciled totals are distinct values. Missing or
contradictory usage is an explicit `UNKNOWN` state, never zero.

Phase 1 may report reservations and estimates but claims **no hard currency
limit**. A hard-money guarantee requires a later provider-specific pricing,
delivery-ambiguity, and invoice-reconciliation decision.

## Invariants

- **ADR-004-I01:** No direct provider client exists outside `ProviderGateway`
  adapters.
- **ADR-004-I02:** One gateway dispatch creates exactly one known physical-call
  identity.
- **ADR-004-I03:** Every physical-call identity is durable before the network
  request can begin.
- **ADR-004-I04:** A tool call decoded from model output is a proposal only.
- **ADR-004-I05:** Provider transport success cannot complete an attempt by
  itself.

## Binary acceptance checks

- [ ] **ADR-004-AC01:** Qualification records normal, warmup, retry, compaction, child, failed,
      cancelled, and delivery-unknown calls.
- [ ] **ADR-004-AC02:** Network observation finds no provider request without a
      prior call record.
- [ ] **ADR-004-AC03:** Network observation includes reviewed-tool execution; direct provider
      behavior disqualifies the tool, and a policy requiring technical egress
      denial fails closed without qualified OS confinement.
- [ ] **ADR-004-AC04:** Crash and power-cut injection before/after call allocation, socket send,
      response receipt, and result commit leaves every observed request attached
      to its original durable identity; unresolved armed calls recover as
      `DISPATCH_UNKNOWN` with unknown usage and cannot auto-retry.
- [ ] **ADR-004-AC05:** A missing or mismatched digest-bound request artifact prevents allocation
      acknowledgment and network dispatch.
- [ ] **ADR-004-AC06:** Hidden SDK retry/tool-loop features are disabled or the
      adapter is rejected.
- [ ] **ADR-004-AC07:** Missing usage renders `UNKNOWN`, not zero cost or a budget
      pass.

## Non-goals

Provider selection, pricing accuracy claims, invoice reconciliation, or hard
currency-spend enforcement.
