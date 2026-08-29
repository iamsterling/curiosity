# Portable AgentKernel implementation point — 2026-08-29

**Status:** Durable provider-attempt lifecycle implemented in portable and native
deterministic tests; not production-wired or physical lifecycle-qualified.  
**Scope:** `AgentKernel` → `AgentStepPort` + `AgentJournalPort` for serialized
allocation, dispatch, settlement, and proposal application.

## Implemented boundary

`packages/curiosity-authority/src/agent-kernel.ts` now:

- reads at most one ordered journal-runnable run;
- obtains one bounded context/route/agent/tool plan;
- derives a deterministic step identity from run, revision, and state digest;
- first commits an exact `provider.generate` action containing the bounded step
  request and request digest;
- allocates and authorizes one immutable provider attempt generation before
  invoking `AgentStepPort.step` exactly once with no internal retry or loop;
- atomically settles success, failure, or cancellation with a canonical terminal
  event and output digest;
- applies only a succeeded relaunch-readable terminal event on a later explicit
  drain, without invoking the model again;
- repeats run, revision, state, route, context, selection, model, and step result
  fencing;
- re-reads the run before proposing a commit;
- re-runs each model tool call through one bundled deterministic tool proposer;
- intersects requested capabilities with the run ceiling and rejects unknown
  tools, versions, widened authority, unsorted capabilities, or wrong execution;
- converts final, action, question, and no-go branches into bounded durable
  transition inputs; and
- commits through `AgentJournalPort.commitTransition` with exact expected
  revision and observed state digest.

Native `readRunProjection` now includes the workflow execution generation and,
only while the run is waiting for its provider, the exact provider action, call,
dispatch state, terminal status, and terminal event. Native dispatch recomputes
the stored request and rejects a changed model, prompt, purpose, source revision,
or capability before an attempt can be armed.

Questions become non-approval `question.ask` action allocations so they cannot
spin as immediately runnable model work. Final and no-go proposals request
terminal reconciliation but do not fabricate terminal success.

The mobile pure composition in `apps/mobile/src/mobile-agent-kernel.ts` uses the
real `createFoundationModelAgentStep` and `createNativeAgentJournal` adapters.
`native-agent-kernel.ts` binds that composition to the Expo module only when an
explicit planner is supplied. Neither file is imported by
`local-curiosity-runtime.ts`.

## Focused evidence

Portable tests prove:

- durable action allocation and authorization precede the model invocation;
- one model call is settled before its proposal is applied;
- deterministic governed action allocation;
- stale revision after generation performs no commit;
- a model failure is settled once and never retried by a later drain;
- crashes before and after allocation acknowledgement recover from the durable
  phase without a duplicate model call;
- a crash after dispatch but before settlement reconciles to
  `delivery-unknown` and cannot advance or replay;
- settlement acknowledgement loss applies the durable result without a second
  model call; and
- interrupted-attempt reconciliation is invoked exactly once when requested.

The mobile composition test passed through the native adapters with the exact
operation sequence:

```text
runnableRuns -> commitTransition -> readRunProjection -> armDispatch(allocate)
-> armDispatch(authorize) -> agentStep -> settleAttempt
```

A second explicit drain reads the settled provider terminal and commits the
proposal without another `agentStep`. A stale native model result is durably
settled as a failed provider attempt and cannot advance or repeat. The authority
package passes 43 tests; the focused mobile kernel/journal suite passes 5 tests;
the native Rust journal passes 10 tests.

## Deliberate limits

This point does **not** satisfy ADR-021-AC01, AC02, AC04, or AC05. In particular:

- terminal reconciliation, durable question answers, action joins, and complete
  H0 desktop/mobile parity remain open;
- the crash tests are deterministic port tests, not physical process-death
  evidence; and
- no production scheduler invokes this kernel.
