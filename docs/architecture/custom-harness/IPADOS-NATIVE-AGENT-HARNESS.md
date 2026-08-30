# iPadOS native agent harness

Research date: 2026-08-29  
Status: **Accepted architecture and implementation plan; not release authority.**  
Decision: [ADR-021](decisions/ADR-021-ipados-durable-agent-graph-kernel.md)  
Related: [iPadOS intelligence architecture](IPADOS-INTELLIGENCE-ARCHITECTURE.md)

## Executive decision

Build Curiosity's iPad agent as a durable, event-driven graph kernel in portable
TypeScript running on Hermes. Swift and Rust provide bounded platform
primitives. Models produce typed step proposals. Neither Foundation Models,
Vercel AI SDK, React, nor a native tool owns the loop.

**2026-08-30 primary/sidecar correction:** Apple Intelligence is a bounded local
sidecar only. It may classify intent, formulate retrieval queries, rerank bounded
memory candidates, curate memory proposals, summarize bounded material, and
generate titles. It is not the primary answer provider and must not be injected
as the production `AgentKernel` step port. Primary agent steps require an exact
connected frontier route and fail closed when none is available.

This is a new native iPad harness, but not a semantic rewrite from zero. The
project already owns the right desktop concepts: workflow transitions, action
allocation, capability ceilings, gates, provider attempts, tool-loop budgets,
child lineage, no-progress detection, and recovery. Those concepts should be
ported into `@curiosity/authority`, stripped of Node/Bun/Effect/SQLite concrete
dependencies, and proven against the desktop oracle.

The resulting stack is:

```text
React Native product UI
chat · run graph · gates · memory · provider/model selection
                              |
                       LocalCuriosityClient
                              |
AgentKernel in Hermes (one serialized semantic authority)
commands · graph scheduler · policy · context · routes · projections
       |                      |                        |
AgentJournalPort       AgentStepGateway       CapabilityGateway
Rust/SQLite ABI v3     exact model route      exact action grant
       |               |        |        |          |
canonical events   Apple     Apple PCC  broker    Swift/Rust
+ operational      on-device  candidate  AI SDK   typed tools
  scheduler state
```

## Why this boundary

### Model-owned loops are the wrong authority

Apple documents that Foundation Models tools are selected and called by the
model, may be called multiple times in one request, and may execute in parallel.
That is useful for low-risk app personalization, but it runs inside the model
session before Curiosity can durably allocate, gate, fence, and account for each
effect.

AI SDK's `ToolLoopAgent` similarly owns context management, stopping conditions,
and tool execution. That is convenient for stateless server agents but would be
a second harness beside Curiosity's journal and policy.

Curiosity therefore uses both technologies below the same port:

- Foundation Models uses constrained structured generation to produce an
  `AgentStepProposal`; native Foundation Models tools remain empty.
- The frontier broker uses AI SDK Core/provider adapters to convert text and
  provider tool-call parts into the same proposal. AI SDK automatic loops and
  hidden retries remain disabled.

### A static DAG is insufficient

Agent work needs dynamic tool batches, gates, questions, retries, child runs,
and recovery after uncertain external delivery. The kernel is therefore a
durable reactive graph:

- graph definitions and transition implementations are versioned and bundled;
- nodes produce proposed actions and children rather than performing effects;
- edges are selected from durable outcomes;
- fan-out and joins are represented by allocated child/action identities;
- every transition is step-fenced and atomically committed; and
- the runnable set is reconstructed from the journal after every launch.

## Runtime ownership

| Responsibility                          | Owner                             | Not owner                |
| --------------------------------------- | --------------------------------- | ------------------------ |
| Command admission and canonical events  | portable `AgentKernel`            | UI, model, native host   |
| Graph transition and route policy       | portable `AgentKernel`            | model adapter            |
| Atomic graph/action/attempt storage     | mobile Rust/SQLite ABI            | Hermes SQL, Swift policy |
| On-device structured inference          | Swift Foundation Models actor     | graph scheduler          |
| Apple private-cloud candidate inference | separate Swift route actor        | implicit fallback        |
| User-connected providers                | broker-side AI SDK adapter        | app-bundled AI SDK       |
| Native effects                          | typed Swift/Rust capability hosts | model session            |
| Memory meaning proposals                | on-device structured model        | memory storage authority |
| Context selection and disclosure        | portable context planner/policy   | provider or UI           |
| Presentation and approvals              | React Native                      | canonical state          |

## Agent catalog

Agents are signed, static catalog contributions. They describe policy and prompt
behavior; they are not downloaded executable plugins.

```ts
interface AgentDefinition {
  readonly agentId: string;
  readonly version: string;
  readonly mode: "primary" | "child";
  readonly systemInstructions: string;
  readonly allowedChildAgentIds: readonly string[];
  readonly capabilityCeiling: readonly string[];
  readonly toolCeiling: readonly ToolIdentity[];
  readonly routePolicyId: string;
  readonly contextPolicyId: string;
  readonly limits: AgentRunLimits;
}

interface AgentRunLimits {
  readonly maximumActions: number;
  readonly maximumChildren: number;
  readonly maximumDelegationDepth: number;
  readonly maximumEvidenceBytes: number;
  readonly maximumModelSteps: number;
  readonly maximumNoProgressSteps: number;
  readonly maximumParallelActions: number;
  readonly maximumToolCalls: number;
}
```

Role identity, graph identity, route identity, provider connection, and model
identity remain separate. The catalog digest freezes all agent, tool, graph,
prompt-command, context-policy, and route-policy definitions used by a run.

### Initial roles

| Role             | Purpose                                            | Initial restrictions                       |
| ---------------- | -------------------------------------------------- | ------------------------------------------ |
| `generalist`     | ordinary chat, planning, local document assistance | bounded read tools; mutations gated        |
| `memory-curator` | extraction, compaction, reranking                  | Apple on-device only; no effect tools      |
| `researcher`     | source discovery, retrieval, synthesis             | frontier route; governed network tools     |
| `builder`        | document/Craft changes and validation              | no shell/Git/process; exact mutation gates |
| `reviewer`       | check a bounded result against acceptance checks   | read-only, fresh context                   |

## One model-step protocol

Every model invocation is one physical action and returns one bounded proposal.
The request carries the exact observed run revision and context digest so stale
output cannot advance a newer run.

```ts
interface AgentStepRequest {
  readonly runId: string;
  readonly stepId: string;
  readonly stepNumber: number;
  readonly observedRunRevision: number;
  readonly observedStateDigest: string;
  readonly agent: { readonly id: string; readonly version: string };
  readonly routeSelection: GenerationSelection;
  readonly contextPlan: ContextPlan;
  readonly availableTools: readonly ToolDefinitionSnapshot[];
  readonly finalizationOnly: boolean;
  readonly signal: AbortSignal;
}

type AgentStepProposal =
  | {
      readonly kind: "final";
      readonly text: string;
      readonly citations: readonly CitationProposal[];
    }
  | {
      readonly kind: "actions";
      readonly assistantState: string;
      readonly calls: readonly ToolCallProposal[];
    }
  | {
      readonly kind: "question";
      readonly prompt: string;
      readonly choices: readonly string[];
      readonly allowFreeText: boolean;
    }
  | {
      readonly kind: "no-go";
      readonly code: string;
      readonly missingEvidence: readonly string[];
    };
```

Delegation is a governed `agent.delegate` action rather than a privileged model
output kind. Binding approval is a policy-created gate rather than a model
request. Memory proposals use the separate ADR-020 schema.

### Proposal validation

The kernel rejects the entire proposal when any structural invariant fails:

- wrong run, step, revision, state, route, agent, or catalog identity;
- unknown proposal kind, field, tool name, tool version, or citation identity;
- duplicate tool-call identity;
- tool/capability/delegation ceiling violation;
- oversized assistant state, evidence, output, batch, or schema;
- an action outside the run's resource claims;
- a tool request while `finalizationOnly` is true; or
- an unavailable gate, route, context, permission, or native capability.

Schema-valid output is still only a proposal. Foundation Models constrained
decoding prevents structural mistakes; it does not establish truth,
authorization, freshness, or completion.

## Kernel-driven tool loop

```text
turn/workflow command admitted
        |
run created with catalog, policy, limits, route preference
        |
context plan assembled from projections, memory, and receipts
        |
provider.generate action allocated and dispatch-armed
        |
exact route returns AgentStepProposal
        |
kernel validates against observed revision and ceilings
        |
  +-----+--------------+------------------+
  |                    |                  |
final             action batch          question/no-go
  |                    |                  |
complete turn    allocate actions       wait/terminate
                       |
              policy gates + resource locks
                       |
               execute authorized effects
                       |
              settle fenced action receipts
                       |
                  durable join
                       |
             assemble next bounded context
```

The model never calls a native effect directly. For every tool call:

1. Decode and validate the model proposal.
2. Re-run the static tool contribution's deterministic `propose` function.
3. Intersect requested authority with run, agent, graph, workspace, and user
   policy ceilings.
4. Create a binding human gate when policy requires it.
5. Atomically allocate the action and immutable input digest.
6. Mark the exact attempt dispatch-armed immediately before the physical call.
7. Pass a bounded `ActionGrant` to the native capability host.
8. Receive a fenced evidence receipt.
9. Settle success, failure, cancellation, or delivery ambiguity.
10. Re-enter the graph only from durable terminal evidence.

Parallel action execution is permitted only when all calls are independently
authorized and resource claims do not conflict. A model's parallel batch is not
itself permission to run in parallel.

## Durable graph model

### Portable transition substrate

The first implementation ports the existing project-owned contract rather than
inventing a large graph DSL:

```ts
interface WorkflowTransitionInput {
  readonly instanceId: string;
  readonly input: unknown;
  readonly state: unknown;
  readonly step: number;
  readonly actions: readonly ActionTerminalSnapshot[];
  readonly children: readonly ChildTerminalSnapshot[];
  readonly gates: readonly GateSnapshot[];
}

interface WorkflowTransition {
  readonly actions: readonly ActionProposal[];
  readonly children: readonly WorkflowChildProposal[];
  readonly nextState: unknown;
  readonly progressKey: string;
  readonly terminalRequested: boolean;
}
```

A bundled pure transition maps one durable snapshot to one proposed transition.
The journal commit fences `expectedStep`, verifies definition/version, applies
budgets, detects repeated progress keys, allocates actions/children/gates, and
appends transition events atomically.

### Derived graph vocabulary

The run inspector and later declarative authoring layer use these node kinds:

| Node        | Meaning                                                  |
| ----------- | -------------------------------------------------------- |
| `reduce`    | deterministic state/projection transition                |
| `model`     | one exact `AgentStepRequest` action                      |
| `action`    | one governed typed capability action                     |
| `gate`      | wait for a revision/digest-bound human decision          |
| `question`  | wait for untrusted user input without granting approval  |
| `fork`      | allocate independent actions or child runs               |
| `join`      | wait for named terminal identities and apply join policy |
| `condition` | choose an edge using a bundled deterministic predicate   |
| `wait`      | durable pause until an event/deadline/system wake        |
| `child`     | allocate a bounded child graph under inherited ceilings  |
| `terminal`  | request completion, failure, cancellation, or no-go      |

The graph view is derived from canonical events and operational attempt state.
It is never an independently mutable React graph.

### Future declarative graphs

A later JSON graph format may compile into the same transition contract.
Downloaded or user-authored graphs may reference only bundled node types,
predicates, agents, and tools. They cannot contain JavaScript, Swift, WASM,
shell, templates that evaluate code, or new provider clients.

XState may be used later as a read-only visualization/authoring dependency. It
is not selected as the runtime authority because restoring its invocations does
not provide Curiosity's external-effect allocation, delivery ambiguity, gates,
catalog version fencing, or atomic event/action/child transaction.

## Scheduler

The scheduler is a serialized portable service outside React state.

### Wake sources

- accepted command;
- model/action completion receipt;
- gate decision or question answer;
- child terminal event;
- explicit retry/resume command;
- app foreground/relaunch reconciliation; and
- a future system-granted background continuation signal.

### Drain algorithm

```text
open and verify journal
reconcile armed/running attempts
repeat within drain budget:
  read ordered runnable instances
  compute one pure transition per instance
  atomically commit transition + allocations
  dispatch newly eligible actions outside transaction
  serialize returned receipts through authority admission
stop on quiescence, wall-time limit, step limit, cancellation, or lifecycle fence
```

Runnable ordering is deterministic: priority class, graph depth descending,
creation sequence, then stable instance identity. The initial app-wide scheduler
allows one model generation at a time and bounded non-conflicting native reads.
Concurrency expands only after thermal, memory, cancellation, and stale-event
qualification.

### Run states

The projection distinguishes:

`queued`, `runnable`, `waiting-generation`, `waiting-actions`, `waiting-gate`,
`waiting-question`, `waiting-children`, `paused`, `completion-requested`,
`completed`, `failed`, `cancelled`, and `delivery-unknown`.

No state named `running` is sufficient by itself for user presentation; the UI
must show what the run is waiting on and whether interruption is safe.

## Native journal ABI v3

The existing v1 ABI exposes only generic event admission/read. Full agent logic
requires coarse operational transactions without exposing SQL:

- `startRun` — idempotently create a run from an admitted request event;
- `commitTransition` — fence expected revision/step and atomically append the
  transition, action, child, and gate allocations;
- `armDispatch` — allocate/mark one exact generation or tool attempt immediately
  before an effect;
- `settleAttempt` — fence generation and record terminal evidence/usage state;
- `runnableRuns` — return bounded ordered runnable snapshots;
- `reconcileInterrupted` — classify interrupted attempts as not-dispatched,
  cancelled, resumable, or delivery-unknown; and
- `cancelRun` — atomically fence one run and generation, project cancellation,
  and return only exact dispatched provider/tool call identities for physical
  abort; and
- `readRunProjection` — return bounded graph/attempt/gate status.

Rust validates ABI version, bounds, digests, state revisions, and transaction
preconditions. It does not select routes, tools, graph edges, retries, gates, or
semantic completion. Canonical events remain the source of semantic truth;
operational tables are atomic scheduler indexes and attempt records.

## Generation routes

All routes implement one `AgentStepPort` and return the same receipt shape.

### `apple.on-device` sidecar

- `SystemLanguageModel.default` in a dedicated Swift actor;
- total input-plus-output envelope treated as 4,096 tokens;
- fresh bounded session per step, rebuilt from `ContextPlan`;
- `@Generable` step envelope with guided arrays/enums/ranges;
- no Foundation Models tools;
- default greedy/low-variance sampling for planning, still treated as
  nondeterministic across model/OS versions;
- intended for memory curation/reranking, query formulation, classification,
  bounded summaries, and title generation;
- never eligible for `turn.answer` or the production primary `agent.step`; and
- each hook is one bounded proposal call with no native tools or child delegation.

### `apple.private-cloud` candidate

The installed iOS 27 SDK publicly exposes `PrivateCloudComputeLanguageModel` as
a `LanguageModel` with capabilities, availability, context size, languages,
quota, and network/service errors. It can therefore fit the same native step
adapter in principle.

It remains unavailable in the product until a physical-device spike establishes
its actual context size, eligibility, privacy/retention terms, supported
capabilities, quota behavior, cancellation, background behavior, quality, and
App Review implications. Its name is not evidence for those properties. It is
never a silent fallback for either the on-device or user-connected route.

### `frontier.<connection>`

- native authenticated HTTPS stream to the Curiosity account broker;
- AI SDK Core/provider adapter at the broker, not in Hermes;
- explicit user connection and model selection;
- AI SDK automatic tool loops and hidden retries disabled;
- larger context and advanced reasoning, governed by per-run policy; and
- physical call allocation, usage state, cancellation, and delivery ambiguity
  under ADR-004 and ADR-019.

## Context, retrieval, and memory

`ContextPlanner` deterministically assembles every step from bounded blocks:

```ts
interface ContextBlock {
  readonly blockId: string;
  readonly kind:
    | "agent-policy"
    | "conversation"
    | "memory"
    | "tool-evidence"
    | "workflow"
    | "kernel-notice";
  readonly provenance: "trusted-durable" | "untrusted-evidence";
  readonly sourceEventIds: readonly string[];
  readonly contentDigest: string;
  readonly content: string;
}
```

Selection order is policy, current objective/state, recent conversation,
terminal action receipts, local retrieval/memory, then optional older context.
Each route has an independently qualified budget. Omissions are recorded by
digest so compaction is attributable.

Foundation Models transcripts are useful native diagnostics but are not durable
memory or canonical context. The kernel builds a fresh step from admitted
blocks. Apple Intelligence manages memory semantically under ADR-020; authority
owns acceptance, sensitivity, retention, retrieval, and frontier disclosure.

Tool output and fetched material remain `untrusted-evidence`. They cannot inject
new policy, tools, graph edges, completion claims, or citations merely by
containing instruction-like text.

## Native capability host

Initial iPad capabilities are app-shaped rather than desktop emulations:

| Capability                        | Native owner                                  | Initial policy                     |
| --------------------------------- | --------------------------------------------- | ---------------------------------- |
| document list/read/search         | Swift Files coordination + bounded Rust query | read-only, scoped roots            |
| document create/update            | coordinated Swift writer                      | digest precondition + human gate   |
| Craft read/project                | existing editor kernel projections            | read-only                          |
| Craft mutation                    | existing `EditorKernel` command transaction   | exact command + gate + undo parity |
| memory query/curation             | Rust query + Foundation Models proposal       | local only by default              |
| bounded HTTPS fetch               | native `URLSession`                           | exact host/redirect/size policy    |
| provider generation               | exact route host                              | route and disclosure policy        |
| camera/microphone/photos/calendar | public Apple APIs                             | purpose-specific permission + gate |
| shell/process/Git worktree        | none                                          | unavailable                        |

An `ActionGrant` includes action/attempt/generation identity, tool identity and
version, input digest, resource, capability list, deadline, cancellation token,
and gate receipt when required. Native code rejects missing or mismatched grants.

## Child agents and graph composition

Child agents are fresh bounded runs, not hidden threads inside a provider call.
Allocation records:

- objective, deliverable, acceptance checks, and non-goals;
- parent/root execution and source tool-call identities;
- agent/catalog versions;
- read/write resource claims;
- capability and tool ceilings;
- provider/tool/model-step budgets;
- depth and sibling group;
- continuation session and expected revision, when applicable; and
- join policy: `all`, `all-settled`, `first-success`, or `quorum`.

The initial iPad profile permits depth one, at most four children, and read-only
children. On-device child generation remains disabled until a quality test shows
it adds value beyond a direct bounded step. Frontier child runs remain explicit
physical calls and never share provider credentials or ambient native grants.

## Lifecycle and backgrounding

iPadOS is not a daemon environment. Installed SDK contracts state that scheduled
background start dates are not guaranteed, expiration may arrive early, and
processing work may be interrupted by system conditions or user activity.

Initial lifecycle behavior:

1. On background, stop scheduling new steps.
2. Persist/fence all local scheduler state.
3. Cancel Foundation Models tasks and native operations that have safe
   cancellation.
4. Mark dispatched external operations for later reconciliation rather than
   inventing failure or success.
5. On foreground/relaunch, verify the journal, ingest staged native evidence,
   reconcile attempts, and run a bounded drain.

`BGTaskScheduler` is an optimization only. A future background host may resume
already authorized bounded maintenance or stage native evidence, but it cannot
become a Swift semantic authority. If a background launch cannot reliably start
the Hermes kernel, it performs no graph transition. No product claim may promise
continuous unattended agent execution.

## Product surfaces

The iPad harness should expose its mechanics rather than hide them:

- route/model chip per turn and graph node;
- run status with current wait reason;
- live graph with actions, joins, children, gates, and failure nodes;
- tool cards showing proposed/approved/running/terminal state;
- capability and memory-disclosure preview before binding approval;
- pause, resume, cancel, retry-as-new-attempt, and inspect receipts;
- memory provenance and retirement controls;
- provider connection/model catalog separate from roles; and
- explicit `delivery unknown`, `route unavailable`, and `no-go` states.

## Target package map

```text
packages/curiosity-authority/src/
  agent-definition.ts       static agent/role contracts
  agent-step.ts             request/proposal/receipt decoding
  context-plan.ts           bounded provenance blocks
  workflow-domain.ts        run/action/child/gate snapshots
  workflow-transition.ts    pure transition validation
  workflow-engine.ts        bounded deterministic drain
  agent-journal-port.ts     coarse operational transaction port
  capability-policy.ts      ceilings, resources, gates
  route-policy.ts           exact route selection
  projections/              run graph, actions, gates, memory

apps/mobile/src/
  local-agent-runtime.ts    singleton composition and lifecycle
  native-agent-journal.ts   validated ABI v3 adapter
  agent-step-gateway.ts     exact route dispatch
  native-capability-host.ts validated action-grant adapter

apps/mobile/modules/curiosity-runtime/ios/
  FoundationAgentStepHost.swift
  PrivateCloudAgentStepHost.swift   candidate spike only
  NativeCapabilityHost.swift
  AgentLifecycleHost.swift

apps/mobile/modules/curiosity-runtime/native/
  graph/                    coarse workflow/attempt transactions
  journal/                  canonical schema and integrity
  query/                    bounded document/memory retrieval
```

## Current composition audit — 2026-08-30

The repository now wires the durable provider-step substrate into the iPad
product. `local-curiosity-runtime.ts` admits turns through the portable chat
semantics, starts deterministic native runs, and delegates execution to the
serialized durable scheduler. The legacy one-shot client remains only as an
injectable test/profile implementation.

| Boundary        | Current                                                                                                                                | Missing before product wiring                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Primary route   | Exact connected frontier answer/agent step or explicit unavailability; strict frontier step adapter                                    | Live provider fixture qualification                            |
| Agent kernel    | Provider/action allocation, settlement, proposal admission, serialized drain coordinator, chat/run admission, terminal chat projection | Exact cancellation and live provider fixture qualification     |
| Context         | Static eight-role/read-tool catalog; bounded conversation, workflow, read-receipt, and project-scoped ordinary-memory planner          | Apple retrieval rerank and compaction                          |
| Tool actions    | Bounded runnable query, exact read-only grant/dispatcher, native document port, receipt event                                          | Gates and mutation dispatchers                                 |
| Questions/gates | Durable tables                                                                                                                         | List/answer/decide ports and authenticated UI commands         |
| Memory          | Proposal decoder, policy, projection, Apple curator host, project-scoped active-memory context query                                   | Durable sidecar dispatcher, reranker, review/retire UI         |
| Lifecycle       | AppState-owned wake service outside React state; interrupted attempts recover before orphan turn admission and draining                | Exact per-run cancel and physical stale-callback qualification |

Implementation must follow this dependency order:

1. **B0 — Primary/sidecar fence:** primary turns never select Apple; kernel
   composition receives an explicit `AgentStepPort`. **Implemented in source.**
2. **B1 — Operational journal closure:** add bounded runnable-action,
   question/gate, terminal-reconciliation, and active-memory query operations.
   **Runnable read-only actions, terminal chat reconciliation, and bounded
   project-scoped active-memory projection are implemented; question and gate
   operations remain.**
3. **B2 — Frontier step probe:** convert one native frontier response into the
   exact `AgentStepResult` envelope with one physical request, no fallback, no
   hidden retry, and retained delivery ambiguity. The current undocumented
   consumer backend cannot inherit public Responses API qualification. **The
   strict one-call adapter is implemented; live provider qualification remains.**
4. **B3 — Mobile static catalog and planner:** freeze agent/tool/policy versions;
   assemble provenance-labelled context from conversation, state, receipts, and
   bounded memory candidates. **Implemented for the static eight-role catalog,
   three read-only document tools, and project-scoped ordinary memory.**
5. **B4 — Serialized scheduler and client bridge:** chat admission starts one
   durable run; lifecycle wakes drain provider, action, question, and terminal
   queues outside React state. **Implemented for chat admission, recovery,
   provider/read-tool drains, atomic terminal chat projection, and AppState
   foreground/background wakes. Question draining remains.**
6. **B5 — Read-only vertical slice:** one frontier-led task performs a governed
   native document read, consumes its untrusted receipt, finalizes, relaunches,
   and produces the same projection without duplicate effects.
7. **B6 — Apple sidecar hooks:** add intent classification, retrieval query/
   rerank, memory curation, bounded summary, and title jobs. Hook failure may
   reduce enrichment but cannot silently become or replace the primary route.
8. **B7 — Gates, mutations, children, and wider lifecycle qualification:** only
   after the read-only loop and sidecar provenance pass physical crash tests.

### B0 acceptance evidence

- Primary route selection fails `PROVIDER_ROUTE_UNAVAILABLE` without a qualified
  connected frontier model.
- `local-curiosity-runtime.ts` does not import the Foundation Models free-text
  generation port as its primary `GenerationPort`.
- `mobile-agent-kernel.ts` accepts an injected `AgentStepPort` and does not
  hard-code `createFoundationModelAgentStep`.
- Foundation Models agent-step and curator hosts remain bounded adapters and are
  not production scheduler composition.

### B1/B2/B4 implementation evidence

- Native ABI v3 exposes `runnableToolActions` only for ungated, non-provider,
  non-question actions on live uncancelled runs; Rust tests prove ordering and
  exclusion.
- `AgentReadToolKernel` performs one durable allocation, creates one digest-bound
  grant, invokes one read-only native tool, and settles one bounded receipt or
  failure event with no retry.
- `reconcileTerminalRuns` changes eligible `completion-requested` runs exactly
  once and atomically appends the typed workflow terminal plus the corresponding
  assistant/turn completion or turn failure projection.
- `createFrontierAgentStep` accepts only an exact frontier `agent.step` route,
  one transport attempt, zero transport retries, strict JSON, known tools, and
  known citation sources. Cancellation targets the deterministic step identity.
- `DurableAgentLoop` drains one unit in terminal → tool → agent order and runs
  interrupted-attempt recovery before terminal reconciliation.
- `DurableAgentAdmission` deterministically maps each pending `turn.requested`
  source event to one idempotent native run, including relaunch reconciliation.
- `DurableAgentScheduler` owns serialization, recovery, bounded drain budgets,
  and AppState cancellation outside React state; concurrent wake requests do not
  create concurrent drains.
- Provider route/planning and physical generation failures commit a typed
  terminal transition without hidden retry or a permanently blocked run.
- `cancelRun` atomically fences the exact execution generation, projects
  `execution.cancelled` plus `turn.failed(ACTION_CANCELLED)`, and returns exact
  dispatched provider/tool call IDs. Replayed cancellation retries only those
  idempotent native aborts; late terminal receipts are quarantined as stale.

## Implementation tranches

### H0 — Golden semantic inventory

Port no code yet. Freeze desktop fixtures for workflow start/advance, action
allocation, gate, child, cancellation, no progress, tool loop, provider
ambiguity, and terminal reconciliation.

**Exit:** every behavior has canonical input/events/projection/operational-state
goldens and a named mobile owner.

**Inventory point, 2026-08-29:**
`packages/curiosity-authority/tests/fixtures/kernel-semantics-v1.json` freezes
the nine required cases with canonical input, event constraints, projection,
operational state, executable desktop oracle, and mobile owner. Its canonical
digest is `9d9471642f56349eb34a39415586ae99f841bce1b3ee23aa89c22a632c51e5de`.
The inventory exit is met; executing every case through desktop, portable, and
native implementations remains H1/ADR-021-AC01 work.

### H1 — Portable workflow kernel

Extract workflow domain, transition validation, scheduler, tool proposal
validation, role policy, and child ceilings into `@curiosity/authority` without
Node, Bun, Effect, SQL, AI SDK, or React imports.

**Exit:** Bun desktop and portable kernel produce identical transitions and
diagnostics for H0 fixtures.

**Implementation point, 2026-08-29:** a serialized portable `AgentKernel` now
composes `AgentStepPort` and `AgentJournalPort`. Every model invocation is now
preceded by a durable `provider.generate` action plus allocated and authorized
attempt generation, then settled as one relaunch-readable terminal event before
its proposal may advance the run. A later explicit drain applies the settled
proposal without another model call. Focused tests cover stale revisions, no
hidden retry/loop, deterministic actions, crashes before/after allocation and
settlement acknowledgement, dispatched-call ambiguity, and relaunch
reconciliation. Full H0 desktop/mobile golden execution parity remains open, so
the H1 exit is not met.

### H2 — Native journal ABI v3

Implement coarse run/transition/action/attempt/gate operations in mobile Rust;
add migration and crash injection before linking production scheduling.

**Exit:** every transition/dispatch/settlement crash point recovers without
duplicate effects or fabricated terminal success; ambiguous delivery remains
explicit.

**Implementation point, 2026-08-30:** ABI v3 retains v1/v2 schema-v15 open
compatibility and extends the coarse operations with exact run cancellation.
Revision fencing, interrupted-attempt reconciliation, deterministic transaction
rollback, cancellation replay, and late-receipt quarantine tests are
implemented. Native projection exposes the exact provider action/call generation
and its atomic terminal event without exposing SQL, and native allocation
rebinds model, prompt digest, purpose, source revision, and `provider.generate`
capability to the stored action input.
Physical VFS/WAL, hard-reset, device-lock, storage-pressure, backup/restore, and
forward/failing migration qualification remain H11 work; H2 is not
release-qualified.

### H3 — Structured on-device agent step

Add `@Generable AgentStepEnvelope`, context preflight, greedy planning mode,
stream/usage receipts, and stale-step fencing. Keep native tools empty.

**Exit:** physical iPad fixtures produce valid final/action/question/no-go
proposals, reject overflow/stale output, and cancel cleanly on background.

**Implementation point, 2026-08-29:** a signed physical iPad produced all four
true generated-union branches, rejected native total-context overflow, and
cancelled an in-flight structured step through the host cancellation method used
by the background hook. Portable tests reject stale identities before authority
admission. A real Home/lock/suspend/terminate/relaunch lifecycle remains open.

### H4 — Read-only native tools

Ship app-root document list/read/search and Craft read projections through exact
action grants.

**Exit:** traversal, stale scope, permission loss, oversized output,
cancellation, grant mismatch, and prompt-injection fixtures fail closed.

**Implementation point, 2026-08-29:** portable exact action grants and bounded
app-root `document.list/read/search` contracts are implemented. Swift repeats
grant/request fencing, authorizes the stored ABI-v2 tool call before coordinated
file access, and returns only provenance-labelled untrusted evidence. A signed
physical iPad passed authorized read/settlement, list/search, traversal, stale
grant, cancellation, oversized file, symlink, permission-loss, and
prompt-injection fixtures. Craft projections, production AgentKernel wiring,
and real suspend/relaunch qualification remain open, so H4 is not complete.

### H5 — Complete local tool loop

Connect step proposals to durable action batches, resource-aware execution,
joins, evidence context, finalization-only mode, and no-progress budgets.

**Exit:** a physical Mac-off iPad completes and recovers a multi-step read-only
task with every effect allocated before execution.

### H6 — Memory and retrieval

Implement ADR-020 curation, compaction, active-memory query, reranking, context
selection, review UI, and disclosure policy.

**Exit:** local memory supports provenance, supersession, retirement, relaunch,
and bounded recall without network access or silent frontier processing.

### H7 — Gates and mutation tools

Add coordinated document writes and Craft mutations with digest preconditions,
binding approval, durable receipts, and undo/parity checks.

**Exit:** stale inputs and missing/revoked gates cause zero mutation; crash tests
preserve ambiguity and document integrity.

### H8 — Children and advanced graphs

Port child allocation, lineage, continuation revisions, fan-out/join policies,
reviewer runs, and graph inspector.

**Exit:** depth/count/budget/resource ceilings and cancellation propagate across
the graph; no child can widen parent authority.

### H9 — Apple private-cloud spike

Measure the iOS 27 candidate route independently.

**Exit:** accept a separate ADR only if availability, context size, capabilities,
privacy terms, quota, errors, quality, cancellation, and lifecycle are known and
the route remains explicit.

### H10 — User-connected frontier routes

Implement ADR-019 native broker session, connection/model UI, AI SDK broker step
adapter, provider usage, and disclosure receipts.

**Exit:** no credential enters Hermes/events/logs; exact-route and no-fallback
tests pass; all observed physical calls have prior durable allocation.

### H11 — Lifecycle and release qualification

Add bounded scheduling budgets, optional background opportunities, storage
qualification, thermal/memory tests, hard-reset recovery, migrations, and
complete Mac-off product lifecycle.

**Exit:** every release claim maps to physical iPad evidence under the exact OS,
model, SQLite VFS, Data Protection, route, and entitlement profile.

## Binary architecture acceptance

- [ ] **AH-AC01:** One portable serialized authority owns every graph transition,
      route decision, action allocation, gate, and canonical terminal event.
- [ ] **AH-AC02:** Network/native observation finds zero effects without a prior
      matching durable action and dispatch grant.
- [ ] **AH-AC03:** Local and frontier adapters pass the same step-proposal
      fixtures; neither adapter owns a loop, retry, tool effect, or fallback.
- [ ] **AH-AC04:** Crash injection at transition, allocation, dispatch, receipt,
      join, and completion boundaries preserves idempotency and delivery
      ambiguity.
- [ ] **AH-AC05:** Step/action/child/depth/evidence/no-progress/wall-time limits
      terminate under stable codes.
- [ ] **AH-AC06:** Background, suspension, termination, and relaunch never allow
      stale model/tool output to advance a newer run revision.
- [ ] **AH-AC07:** Child capability, tool, route, resource, and disclosure
      authority is always an equal or narrower subset of its parent.
- [ ] **AH-AC08:** Untrusted tool/retrieval text cannot create policy, tools,
      graph edges, citations, approvals, or completion evidence.
- [ ] **AH-AC09:** App bundle and runtime contain no downloaded executable plugin,
      shell/process/Git imitation, required Mac/LAN service, or app-bundled AI
      SDK provider loop.
- [ ] **AH-AC10:** Run graph, route, waits, gates, usage uncertainty, memory
      disclosure, cancellation, and no-go states are visible in the product.

## Evidence synthesis

Point evidence: [H2–H3 native ABI and structured-step evidence,
2026-08-29](evidence/ipados-native-h2-h3-2026-08-29.md).

Point evidence: [H4 governed app-document evidence,
2026-08-29](evidence/ipados-native-h4-documents-2026-08-29.md).

Point evidence: [portable AgentKernel and mobile composition,
2026-08-29](evidence/ipados-portable-agent-kernel-2026-08-29.md).

| Finding                                                                                                                      | Label                                                              | Confidence                |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------- |
| Foundation Models sessions accumulate transcripts and require explicit context recovery                                      | **Documented** by Apple WWDC25                                     | High                      |
| `Generable`/dynamic schemas constrain output structure                                                                       | **Documented** by Apple WWDC25 and installed SDK                   | High                      |
| Foundation Models tools may be called repeatedly and in parallel inside one request                                          | **Documented** by Apple WWDC25 and `@concurrent Tool.call` surface | High                      |
| Expo Modules supports async native work, serializable records, events, and app lifecycle hooks over a JSI-backed abstraction | **Documented** by Expo                                             | High                      |
| Background scheduling/start time is not guaranteed and work can expire or be interrupted                                     | **Documented** by installed iPhoneOS 27 headers                    | High                      |
| XState snapshot restoration does not solve Curiosity's external-effect ambiguity                                             | **Documented** XState behavior plus architectural inference        | High                      |
| Existing desktop workflow semantics are a stronger starting point than a new generic loop library                            | **Local evidence and inference**                                   | High                      |
| `PrivateCloudComputeLanguageModel` is a public iOS 27 `LanguageModel` with context/quota/network surfaces                    | **Documented** by installed SDK interface                          | High for API surface only |
| The Apple private-cloud route is suitable for Curiosity production use                                                       | **Unknown**                                                        | Unknown                   |
| Expo events remain sufficient for sustained multi-action graph streaming                                                     | **Unknown until measured**                                         | Unknown                   |
| iPad background launch can reliably initialize the full Hermes authority                                                     | **Unknown until physical spike**                                   | Unknown                   |

## Unknowns requiring implementation evidence

- Foundation Models structured-planning quality for each proposed local tool and
  the useful maximum local loop depth within the total context envelope.
- Exact iOS 27 Apple private-cloud behavior and terms; public web documentation
  was not readable in this research environment and web search was rate-limited.
- Whether full Hermes startup is reliable inside each selected background task
  class; no architecture depends on it until proven.
- Rust/SQLite ABI v3 crash, VFS, WAL, migration, lock, storage pressure, backup,
  and restore behavior.
- Sustained Expo event throughput, memory, stale listener behavior, and whether
  any measured path warrants a lower-level JSI/TurboModule optimization.
- Thermal and battery limits for repeated on-device inference, retrieval, and
  concurrent native tools.
- Provider-specific broker authorization, retention, quota, pricing, and App
  Store purchase implications.

## `CURIOSITY_NO_GO`

- No model-owned tool loop for effects, including Foundation Models `Tool.call`
  or AI SDK `ToolLoopAgent` in the authority path.
- No XState snapshot, React state, Swift actor, model transcript, or provider
  thread as canonical run state.
- No downloaded executable plugins, arbitrary JavaScript graph nodes, WASM
  extensions, shell, process runner, or fake Git/worktree behavior.
- No promise of daemon-like unattended work on iPadOS.
- No automatic on-device, Apple private-cloud, or user-provider substitution.
- No child agent that widens authority or hides physical provider calls.
- No direct mutation from model text, tool output, memory proposal, or UI state.
- No JSI rewrite without a named measured bottleneck and parity suite.

## Adaptive bibliography

1. [Apple, “Deep dive into the Foundation Models framework,” WWDC25 session
   301](https://developer.apple.com/videos/play/wwdc2025/301/). Selected for
   Apple's direct explanation of session transcripts, context recovery,
   constrained generation, dynamic schemas, autonomous tools, repeated calls,
   and parallel tool execution. Preferable to third-party agent tutorials.
2. [Vercel AI SDK, “Agents”](https://ai-sdk.dev/docs/agents/overview). Selected
   for the current AI SDK 7 ownership contract: `ToolLoopAgent` manages context,
   stopping, and tools, while explicit workflows use core functions. This is
   current documentation, not evidence that the repository's installed AI SDK 6
   has identical APIs.
3. [Expo Modules API](https://docs.expo.dev/modules/module-api/). Selected for
   the exact SDK 57 native boundary used by Curiosity: JSI abstraction, async
   functions, typed records, events, and lifecycle hooks.
4. [XState, “Persistence”](https://stately.ai/docs/persistence). Selected to test
   the library-first alternative. It directly documents snapshot restoration,
   invocation restart, action non-reexecution, event sourcing, serialization,
   and compatibility caveats.
5. [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/),
   especially 2.5.1–2.5.4. Selected for public API, self-contained code, and
   background-service constraints governing an App Store harness.
6. Installed Xcode 27 iPhoneOS SDK, `BackgroundTasks.framework/Headers` and
   `UIKit.framework/Headers/UIApplication.h`. Selected as the exact public
   platform contract for interruption, expiration, system-selected scheduling,
   and lifecycle APIs on the development machine.
7. Installed Xcode 27 `FoundationModels.swiftinterface`, package version
   `2.0.55.1.102`. Selected as the exact public API evidence for `LanguageModel`,
   executor channels, sessions, tools, capabilities, and
   `PrivateCloudComputeLanguageModel`. It does not establish runtime quality or
   service policy.
8. Project-owned desktop sources: `workflow-engine.ts`, `workflow-journal.ts`,
   `workflow-transition-validation.ts`, `chat-tool-loop.ts`,
   `provider-gateway.ts`, and `child-scheduler.ts`. Selected because preserving
   existing Curiosity invariants is lower risk than designing from framework
   examples.

### Source limitations

- Apple's BackgroundTasks web reference returned no readable content; installed
  public SDK headers were used instead.
- An attempted WWDC20 background-session URL resolved to an index and was
  excluded.
- Apple's `PrivateCloudComputeLanguageModel` web page returned no readable
  content, and web search was rate-limited. Only the installed public interface
  supports claims about that route.

## Stop decision

**Coverage and saturation reached.** Every agent-loop responsibility now has one
owner, every model route has a common step seam, the existing desktop semantics
have a defined portable destination, and graph/tool/lifecycle recovery has a
bounded implementation path. The remaining high-value questions require code,
physical-device measurement, provider terms, or failure injection—not more
framework reading.
