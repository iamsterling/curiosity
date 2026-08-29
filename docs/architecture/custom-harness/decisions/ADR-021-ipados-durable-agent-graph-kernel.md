# ADR-021: iPadOS durable agent graph kernel

**Status:** Accepted — 2026-08-29  
**Decision history:** The user requested deep research and architecture for a
fully native iPad Curiosity harness with custom agents, loops, and graphs on
2026-08-29 and accepted ADR-017 through ADR-021 as implementation authority on
2026-08-29.  
**Authority:** Authorizes implementation of this architecture. It does not
authorize production tool mutation, background execution claims, Apple
private-cloud use, frontier deployment, or release.

## Context

Curiosity's mobile authority currently supports one tool-free generation call
per turn. The desktop harness already implements bounded tool rounds, action and
provider attempts, workflow transitions, gates, children, recovery, and usage
ambiguity, but its concrete implementation imports Effect, Node, Bun SQLite, AI
SDK providers, and desktop capabilities that cannot enter the iPad production
closure.

Foundation Models and AI SDK both offer automatic model/tool loops. Letting
either own execution would place context, stopping, and effects outside
Curiosity's durable authority. A generic statechart snapshot likewise does not
provide pre-effect action allocation, external delivery ambiguity, capability
ceilings, gates, or atomic event/action/child transitions.

## Decision

1. Build one durable event-driven agent graph kernel in portable TypeScript under
   `@curiosity/authority`. Hermes runs one serialized semantic scheduler outside
   React state.
2. Port the project-owned workflow transition, action allocation, provider
   attempt, gate, child, budget, no-progress, and reconciliation semantics behind
   portable ports. Preserve desktop/mobile golden parity.
3. Models execute one physical step at a time through `AgentStepPort` and return
   one bounded typed `AgentStepProposal`: final, action batch, question, or
   no-go. Model output never performs an effect or commits a graph transition.
4. Foundation Models uses guided structured generation with an empty native tool
   list. The frontier broker uses AI SDK Core/provider adapters with automatic
   tool loops and hidden retries disabled. Both produce the same step contract.
5. Graph transitions are bundled, versioned, pure contributions. Each transition
   proposes next state, actions, children, progress identity, and terminal intent.
   The journal atomically fences and commits the transition plus all allocations.
6. Add a mobile native journal ABI v2 with coarse run, transition, action,
   attempt, gate, runnable, and reconciliation transactions. Hermes receives no
   SQL, table, path, or transaction primitive.
7. Every physical native or provider effect requires a durable exact action,
   attempt generation, immutable input digest, capability/resource grant, and
   gate receipt when applicable. External interruption preserves
   delivery-unknown rather than fabricating success or safe retry.
8. The graph supports deterministic conditions, actions, model steps, gates,
   questions, waits, forks, joins, bounded children, and terminals. A later
   declarative JSON graph may compile to this contract but cannot contain or
   download executable code.
9. Model transcripts are transient adapter state. `ContextPlanner` reconstructs
   every step from bounded provenance-labelled journal, memory, retrieval, and
   receipt blocks under the selected route's context policy.
10. Background execution is opportunistic. Backgrounding fences scheduling and
    cancels safe work; foreground/relaunch reconciles and resumes from the
    journal. A native background host may stage evidence but cannot become a
    second semantic authority.

## Invariants

- **ADR-021-I01:** Exactly one portable authority owns each graph transition and
  canonical terminal fact.
- **ADR-021-I02:** No physical effect begins without prior durable allocation and
  exact dispatch authority.
- **ADR-021-I03:** Model, tool, provider, native host, UI, and child output is
  proposal or evidence, never authority by assertion.
- **ADR-021-I04:** Route adapters share one step contract and own no hidden loop,
  retry, tool effect, or fallback.
- **ADR-021-I05:** Every child inherits equal or narrower capabilities, tools,
  resources, routes, disclosures, budgets, and depth.
- **ADR-021-I06:** Suspension, termination, and stale callbacks cannot advance a
  newer run revision.
- **ADR-021-I07:** Missing background time, route, permission, credential,
  storage, or native capability fails only dependent work and never selects a
  less-safe substitute.
- **ADR-021-I08:** Downloaded graph content cannot add executable behavior or
  provider clients.

## Consequences

The iPad can become a real Curiosity harness rather than a chat shell: durable
multi-step work, governed native tools, memory, gates, children, graph
inspection, cancellation, and recovery all share one kernel. React Native stays
productive for the product UI, Swift owns Apple frameworks and lifecycle, Rust
owns bounded transactional primitives, and AI SDK remains a provider adapter.

This requires a substantial portable-kernel extraction and native journal ABI
evolution. It intentionally delays direct Apple tool calling, generic graph DSLs,
unattended background claims, and high concurrency until the deterministic
kernel and crash semantics qualify.

## Rejected alternatives

- **Foundation Models `Tool.call` as the loop:** calls occur autonomously inside
  the session and may run repeatedly or in parallel before Curiosity allocation.
- **AI SDK `ToolLoopAgent` as authority:** duplicates context, stop, retry, and
  tool-loop ownership outside the journal.
- **XState snapshots as canonical execution:** restoration semantics do not
  provide Curiosity's physical-effect accounting or atomic transition boundary.
- **Swift-owned second kernel:** duplicates product law and makes desktop/mobile
  parity harder without evidence Hermes is inadequate.
- **Promise-chain orchestration:** cannot recover authoritative state after
  suspension or process death.
- **Downloaded executable plugins:** violates the selected static catalog and
  iPad self-contained product boundary.

## Binary acceptance checks

- [ ] **ADR-021-AC01:** Desktop and portable golden fixtures match for workflow,
      tool-loop, gate, child, cancellation, no-progress, provider ambiguity, and
      reconciliation semantics.
- [ ] **ADR-021-AC02:** Static and runtime observation finds no native/network
      effect without a prior matching durable action and dispatch generation.
- [ ] **ADR-021-AC03:** On-device and frontier adapters pass one step contract;
      hidden adapter loops/retries and silent route fallback perform zero calls.
- [ ] **ADR-021-AC04:** Crash injection around transition, allocation, dispatch,
      receipt, join, and completion preserves idempotency and ambiguity.
- [ ] **ADR-021-AC05:** Physical background/suspend/terminate/relaunch tests
      reject stale callbacks and resume only journal-runnable work.
- [ ] **ADR-021-AC06:** Limits for steps, tools, actions, evidence, children,
      depth, parallelism, no progress, and wall time fail under stable codes.
- [ ] **ADR-021-AC07:** Child and graph property tests prove authority can only
      narrow across allocation and continuation.
- [ ] **ADR-021-AC08:** The production bundle contains no Node, Bun, Effect, AI
      SDK loop, XState authority, downloaded executable plugin, shell, process,
      Git/worktree, Mac, or LAN dependency.

## Non-goals

No release qualification, daemon behavior, direct model tools, arbitrary graph
code, generic plugin marketplace, shell/process/Git parity, Apple private-cloud
acceptance, provider deployment, or claim that the existing mobile journal ABI
already supports durable agent graphs.

## Evidence

The 2026-08-29 portable implementation point now allocates, arms, authorizes,
and settles every `AgentStepPort` invocation as a `provider.generate` attempt.
Succeeded proposals are applied from the relaunch-readable terminal event on a
later drain; dispatched-but-unsettled recovery becomes `delivery-unknown` and is
not replayed. This is deterministic implementation evidence only and does not
close the physical AC02, AC04, or AC05 gates.

- [H2–H3 native ABI and structured-step point evidence,
  2026-08-29](../evidence/ipados-native-h2-h3-2026-08-29.md)
- [Portable AgentKernel and mobile composition point evidence,
  2026-08-29](../evidence/ipados-portable-agent-kernel-2026-08-29.md)
