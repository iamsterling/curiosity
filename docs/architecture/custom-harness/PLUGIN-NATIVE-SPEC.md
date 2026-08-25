# Curiosity plugin-native kernel specification

**Status:** Proposed for implementation review — 2026-08-25

**Scope:** Curiosity custom harness plugin substrate and native intelligence port

**Depends on:** [ADR-001 through ADR-011](README.md#adr-inventory)

**Supersedes:** no accepted ADR

**Source role:** project-owned specification; OpenCode2 is a behavioral input,
not a runtime, schema, persistence, or authority dependency

## 1. Decision

> **Core enforces reality. Plugins define Curiosity.**

Curiosity is a statically assembled plugin-native microkernel.

- The **kernel is not a plugin**. It exclusively owns authentication, command
  admission, ordering, durable commit, attempts, fencing, cancellation,
  capability and gate enforcement, physical dispatch, accounting, and terminal
  completion.
- Every replaceable product behavior is a **statically registered plugin
  contribution**: conversation semantics, agent policies, system instructions,
  context selection, tools, semantic ledger, observation reduction, search,
  skills, prompt commands, workflows, orchestration policy, evidence policy,
  provider protocol adaptation, projections, and clients.
- Semantic plugins return immutable **event proposals, action proposals,
  resolution proposals, context blocks, or projections**. They cannot commit,
  dispatch, approve, cancel, retry, or complete work directly.
- Effectful adapter plugins may perform only the exact transport or operating
  system operation delegated by a kernel gateway after durable allocation and
  action-time authorization. They receive no writer, policy mutation, gate, or
  completion port.
- There is no runtime plugin discovery, package installation, dynamic import,
  arbitrary in-process extension loading, or host-owned lifecycle authority.

This is the native meaning of “everything is a plugin”: all product semantics
and replaceable mechanisms are plugins, while the laws that make their outputs
real remain sealed kernel authority.

The terms **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative.

## 2. Scope and non-goals

This specification defines:

1. the plugin manifest and contribution model;
2. static composition, dependency, lifecycle, and version rules;
3. command, event-reaction, action, provider, tool, context, and projection
   flows;
4. ownership of each Curiosity intelligence capability;
5. the migration from the current chat-specialized authority; and
6. binary acceptance checks for each implementation tranche.

It does not qualify live providers, executable tools, Git mutation, sandboxing,
remote operation, multi-user operation, crash recovery, hard-reset durability,
cross-process fencing, production use, publication, deployment, or mobile
platform behavior. A contribution can exist in the catalog while its dependent
capability remains disabled.

## 3. Normative invariants

1. **PNS-I01 — One authority:** only the Effect kernel can admit a command,
   allocate an attempt or physical call, authorize a sink, append canonical
   events, resolve a gate, or make a lifecycle state terminal.
2. **PNS-I02 — Proposal boundary:** model, plugin, tool, provider, projection,
   client, and supervisor output is proposal or evidence data until the kernel
   validates and commits it.
3. **PNS-I03 — Static catalog:** every in-process plugin and adapter is imported
   statically, versioned, validated at startup, and included in one sealed
   catalog digest. Runtime code cannot add, remove, replace, or update one.
4. **PNS-I04 — No ambient semantic effects:** a semantic contribution cannot
   access SQLite, filesystem mutation, network, process creation, Git, provider
   SDKs, secrets, wall-clock time, randomness, the Rust supervisor, or a kernel
   completion port.
5. **PNS-I05 — Durable before external:** an action proposal is committed and a
   physical attempt/call is durably allocated before external dispatch.
6. **PNS-I06 — Final-sink enforcement:** the kernel re-evaluates exact effective
   authority, revocations, provenance, gate state, deadline, budget, and fencing
   generation immediately before every consequential dispatch and completion.
7. **PNS-I07 — Replayable semantics:** command decisions, event reactions, and
   projections use immutable versioned inputs and deterministic ordering.
8. **PNS-I08 — Bounded prompts:** every provider request uses a kernel-assembled,
   size-bounded, provenance-labelled, digest-bound prompt snapshot. Plugins do
   not concatenate the final provider request.
9. **PNS-I09 — Disposable projections:** no projection, context rendering,
   generated summary, receipt, or client state grants authority or replaces
   canonical events and authoritative control ledgers.
10. **PNS-I10 — Fail closed:** an unknown plugin, contribution, schema, adapter,
    dependency, capability, or artifact version makes only the dependent surface
    unavailable; it cannot select a less-safe fallback.
11. **PNS-I11 — Bounded reactions:** generic reactions have durable
    idempotency, finite output and causation limits, and no self-sustaining
    scheduler. Long-running behavior requires a kernel-interpreted workflow.
12. **PNS-I12 — Adapter independence:** `apps/custom-harness` has no OpenCode2
    imports, runtime dependency, state dependency, callback dependency, or ABI
    dependency.

## 4. Kernel law versus plugin behavior

| Concern     | Sealed kernel law                                                                             | Plugin-owned behavior                                                    |
| ----------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Identity    | Authenticate actor; allocate command, execution, attempt, action, call, and event identities  | Define domain identifiers inside validated payloads                      |
| Commands    | Verify envelope, idempotency, digest, readiness, owner, and commit                            | Decode domain payload and propose domain events/actions                  |
| Events      | Enforce schema ownership, expected versions, causation, transaction, hash/custody, and append | Define event schemas and semantic reducers                               |
| Reactions   | Schedule, deduplicate, bound, commit, retry, quarantine                                       | Map committed events to further proposals                                |
| Policy      | Intersect grants and revocations; enforce at final sink                                       | Define agent requests, tool requirements, and workflow policy            |
| Provider    | Allocate every physical call, select retry, account, cancel, fence, complete                  | Define prompt policy and adapt one provider protocol call                |
| Tools       | Validate proposal, authorize, gate, allocate, dispatch, account, cancel                       | Define tool schema/semantics or adapt one supervised operation           |
| Context     | Set global/provider limits, assemble order, label provenance, digest snapshot                 | Select and render bounded semantic blocks                                |
| Workflows   | Own attempts, leases, scheduler, cancellation, generation, terminal CAS                       | Define versioned states, transitions, budgets, and next-action proposals |
| Gates       | Create and resolve binding gate records from authenticated commands                           | Explain why a proposal needs a gate and define domain consequence        |
| Completion  | Verify required attempts, receipts, gates, evidence predicates, and CAS                       | Propose semantic resolution with cited evidence                          |
| Persistence | Own canonical writer, control ledgers, outbox, artifact custody, migrations                   | Define schemas/reducers; projection adapters perform read-only access    |
| UI/hosts    | Expose authenticated command and read-only projection ports                                   | Render state and translate user intent to signed commands                |

The kernel MAY contain generic machinery needed to enforce these laws. It MUST
NOT contain domain literals such as `chat.turn`, agent names, tool names, skill
names, Ledger states, or provider-specific request policy.

## 5. Plugin classes and trust

“Plugin” is a composition term, not a claim that every plugin has the same
effect privileges.

### 5.1 Semantic plugins

Semantic plugins define commands, events, reactions, agents, context, tool
descriptions, workflows, skills, or prompt commands. They are statically
compiled trusted code but execute through capability-free semantic interfaces.
They MUST only return proposal data or pure projections.

Examples: `curiosity.stock.chat`, `curiosity.stock.agents`,
`curiosity.stock.context`, `curiosity.stock.ledger`, and
`curiosity.stock.evidence`.

### 5.2 Reviewed adapter plugins

Reviewed adapters implement a narrow kernel-owned port. They may perform the
specific effect inherent to that port, but they cannot select whether the effect
is authorized or make its outcome terminal.

Examples: an OpenAI protocol adapter behind `ProviderGateway`, a SearXNG HTTP
adapter behind `ToolGateway`, the SQLite journal adapter behind the one writer,
and the versioned Rust IPC adapter behind `ExecutionGateway`.

The persistence adapter executes only a complete transaction plan constructed
by the kernel writer; it does not expose an append or control-row mutation port
to another plugin.

Each adapter MUST have an exact source/artifact identity, enabled-feature set,
license record, capability scope, and qualification record under ADR-006 and
ADR-010. A provider SDK remains an adapter implementation detail and cannot own
loops, retries, tools, context, persistence, policy, or completion.

### 5.3 Projection plugins

Projection plugins are pure reducers over canonical events or read-only storage
adapters that rebuild disposable views. They have no command, gate, or writer
port. A projection exposed to an untrusted client MUST sanitize control content
at the presentation boundary as the current TUI does.

### 5.4 Host/client plugins

CLI, TUI, web, OpenCode, MCP, or future host integrations live outside the
authority process. They can submit authenticated commands and read projections;
they cannot supply canonical events, provider deltas, approvals, or completion
as facts. OpenCode remains one replaceable copied adapter.

### 5.5 Untrusted extensions

Untrusted code is never loaded in-process. It remains unavailable unless a
separately qualified sandbox/platform combination can execute it through the
Rust supervisor. A subprocess boundary alone is not a sandbox claim.

## 6. Plugin ABI v2

The following TypeScript is illustrative and normative in shape, not a required
file split. Concrete implementation names may vary while preserving the
constraints.

```ts
interface PluginManifestV2 {
  readonly schemaVersion: 2;
  readonly id: `curiosity.${string}`;
  readonly version: string; // exact immutable version
  readonly kernelApi: string; // exact supported ABI range
  readonly class: "semantic" | "adapter" | "projection" | "client";
  readonly requires: readonly {
    readonly pluginId: string;
    readonly version: string; // exact for the sealed stock catalog
  }[];
  readonly capabilities: readonly string[]; // requests, never grants
  readonly provenance: {
    readonly source: string;
    readonly revision: string;
    readonly license: string;
  };
}

interface CuriosityPluginV2 {
  readonly manifest: PluginManifestV2;
  readonly commandDeciders?: readonly CommandDeciderContribution[];
  readonly eventSchemas?: readonly EventSchemaContribution[];
  readonly eventReactors?: readonly EventReactorContribution[];
  readonly projections?: readonly ProjectionContribution[];
  readonly agents?: readonly AgentContribution[];
  readonly context?: readonly ContextContribution[];
  readonly tools?: readonly ToolContribution[];
  readonly workflows?: readonly WorkflowContribution[];
  readonly skills?: readonly SkillContribution[];
  readonly promptCommands?: readonly PromptCommandContribution[];
  readonly adapters?: readonly AdapterContribution[];
}
```

Every contribution has a globally unique ID, its own schema version, and the
owning plugin ID. Contribution identifiers and versions become part of command,
attempt, action, and context snapshot digests.

The ABI MUST use separate contribution interfaces rather than a god object with
optional callbacks into kernel internals. A plugin receives only the immutable
input and narrow read model required by that contribution.

### 6.1 Static catalog compilation

Startup performs these steps before readiness can become true:

1. import the exact stock plugin modules through normal static imports;
2. validate manifest and contribution schemas;
3. reject duplicate plugin IDs, contribution IDs, command owners, event-schema
   owners, tool names, skill names, prompt-command names, or adapter routes;
4. reject missing dependencies, non-exact stock dependency versions, cycles,
   unsupported kernel APIs, and unqualified requested capabilities;
5. topologically order plugin construction, using plugin ID as the stable tie
   breaker for otherwise independent nodes;
6. construct scoped adapter resources with Effect Layers;
7. compute and expose one canonical catalog digest; and
8. freeze the catalog for the process lifetime.

Startup cleanup is reverse dependency order and exactly once. A required
adapter construction failure makes its capability unready. It does not silently
remove a policy, downgrade an adapter, or activate another backend.

There is no `load(path)`, dynamic `import()`, package scan, plugin directory,
remote registry, runtime enable/disable, or hot reload. Changing a plugin or
configuration requires a new catalog digest and process restart.

### 6.2 Determinism rules

Semantic contributions MUST NOT read ambient time, random values, environment,
filesystem, network, mutable module globals, or process state. The kernel
supplies any admitted timestamp, identity seed, configuration value, and bounded
read cursor as immutable input.

The kernel enforces:

- stable contribution order;
- canonical input and output encoding;
- maximum proposal count and encoded bytes;
- exact schema validation with unknown fields rejected;
- expected aggregate/control-ledger versions; and
- stable diagnostic codes with plugin/contribution identity.

Architecture checks and import boundaries enforce the absence of effectful
dependencies from semantic plugin directories. Because trusted in-process code
cannot be made adversarially safe by TypeScript types, source review remains a
cooperative-TCB obligation.

## 7. Canonical data contracts

### 7.1 Event proposal

An event proposal contains no callback or executable value:

```ts
interface EventProposal {
  readonly schemaVersion: 1;
  readonly eventType: string;
  readonly eventSchemaVersion: number;
  readonly aggregateId: string;
  readonly expectedAggregateVersion: number;
  readonly body: unknown;
}
```

The kernel adds event ID, global sequence, aggregate version, actor, command,
execution, attempt, causation, correlation, plugin/contribution identity,
catalog digest, timestamp, previous hash, and artifact custody references.
Plugins cannot supply or override those authority fields.

Existing `thread.opened`, `message.appended`, and `turn.failed` events require an
explicit migration to versioned schemas; this specification does not pretend
the current envelope already satisfies ADR-002.

### 7.2 Action proposal

An action proposal describes requested work, never an already authorized call:

```ts
interface ActionProposal {
  readonly schemaVersion: 1;
  readonly actionType: string;
  readonly actionSchemaVersion: number;
  readonly subject: { readonly executionId: string; readonly resource: string };
  readonly input: unknown;
  readonly requestedCapabilities: readonly string[];
  readonly gateClass: "none-requested" | "binding-human-requested";
  readonly deadlineClass: string;
}
```

The kernel validates that the owning contribution may propose the action type,
derives an `ActionId` from durable causation plus ordinal, records the proposal,
and intersects requested capabilities with effective authority. The proposal's
`gateClass` and capability list can only narrow or request authority; they can
never grant it.

### 7.3 Receipt

Provider, tool, search, child, and supervisor outputs enter through a
kernel-owned receipt schema bound to action, attempt, physical-call identity,
adapter version, fencing generation, dispatch digest, timestamps, disposition,
bounded output or artifact digest, usage state, and delivery certainty.

A receipt is evidence. The kernel validates and commits it before any plugin can
react. A late or stale-generation receipt is retained for reconciliation but
cannot complete or mutate the active attempt.

### 7.4 Resolution proposal

A plugin may propose a semantic verdict with exact criterion/evidence bindings.
Only the kernel completion service can validate current versions, terminal
descendants, receipts, gates, evidence policy, cancellation state, and fencing,
then perform terminal compare-and-swap.

## 8. Processing flows

### 8.1 Authenticated command flow

```text
signed client command
  -> kernel authentication and replay checks
  -> exact command-owner lookup
  -> readiness and immutable bounded read snapshot
  -> semantic decider
  -> proposal schema/size/version validation
  -> one writer transaction: admission + domain events + action proposals + outbox
  -> post-commit acknowledgement
```

There is exactly one owner for each authority command kind. A decider failure or
invalid proposal rejects the command without a partial commit. Reusing the same
actor-scoped idempotency identity and digest returns the original result; a
different digest conflicts.

Prompt commands are not an alternate path. A client invocation such as
`/research` becomes an authenticated `prompt.command.invoke` command. Its plugin
expands versioned content into further proposals that return through the same
admission path.

### 8.2 Event-reaction flow

```text
committed canonical event
  -> durable reaction outbox entries
  -> matching reactors in stable contribution order
  -> immutable bounded read snapshot
  -> event/action/resolution proposals
  -> one reaction transaction with deduplication marker
```

Reaction identity is derived from `(eventId, reactorContributionId,
reactorVersion)`. Reprocessing returns the prior reaction result. A reaction has
fixed count, byte, causation-depth, and CPU/deadline budgets. Cycle or budget
exhaustion records a kernel diagnostic and quarantines that reaction; it cannot
spin an in-memory loop.

Background reactor failure does not rewrite or roll back the source event.
Admission-critical semantics belong in the command decider, not in an eventual
reactor. Whether a failed reaction is retried is kernel policy and remains
bounded and durable.

### 8.3 Action flow

```text
committed action proposal
  -> attempt snapshot and immutable action envelope
  -> capability/provenance/gate/readiness validation
  -> physical call allocation and commit
  -> final-sink revalidation
  -> one selected adapter dispatch
  -> bounded receipt ingestion and commit
  -> reactors propose semantic consequences
  -> kernel completion CAS when all predicates hold
```

Plugins do not call adapters. Adapters do not call reactors. All transitions
cross committed kernel records so crash recovery can locate the last certain
boundary. Delivery ambiguity stays explicit; SQLite and an external side effect
are not claimed atomically exactly once.

### 8.4 Provider flow

`curiosity.stock.chat` or a workflow plugin proposes `provider.generate`. The
kernel `ProviderGateway` then:

1. selects the configured qualified adapter under policy;
2. projects conversation history at an exact revision;
3. resolves one versioned agent policy;
4. asks registered context contributors for bounded blocks;
5. assembles system and conversation messages in fixed slots;
6. commits an immutable attempt snapshot and `ProviderCallId` before dispatch;
7. streams through one adapter with SDK retries and automatic tool loops
   disabled;
8. treats deltas as ephemeral projection updates only;
9. commits terminal output, failure, cancellation, usage, and delivery certainty;
   and
10. lets the owning semantic reactor propose assistant/domain events.

Only the kernel consumes provider streams. A failed delta callback or TUI
projection cannot change provider or attempt completion. Retrying is a new
physical call with a new call ID under the same bounded attempt policy.

A provider response containing structured tool calls is committed as untrusted
model output. The owning chat/workflow reactor may map a call that exactly
matches the attempt's visible tool snapshot into a tool action proposal. It does
not dispatch the tool. A later tool receipt may cause that workflow to propose a
new provider call; no SDK or adapter runs the continuation automatically.

### 8.5 Tool flow

A tool contribution owns name, version, description, closed input schema,
closed output schema, requested capability template, provenance treatment, and
the pure mapping from validated input to an action proposal.

Model-generated tool calls are untrusted proposals. The kernel validates the
exact visible tool version from the attempt snapshot, commits the proposal,
applies default-deny policy and any binding human gate, allocates a call, and
dispatches through `ToolGateway`. Filesystem, process, Git, or sandbox-dependent
tools route through the Rust supervisor. A tool implementation cannot write the
journal, confirm approval, continue a model loop, or mark work complete.

Read-only does not mean implicitly authorized: file, search, evidence, and
projection reads still require typed grants and provenance handling.

## 9. Agents, system messages, and bounded context

This is the first native intelligence slice.

### 9.1 Agent policy plugin

`curiosity.stock.agents` owns immutable `AgentDefinition` records containing:

- stable agent ID and definition version;
- mode (`primary` or `subagent`);
- description;
- ordered system-instruction block references;
- requested tool selectors and capability ceilings;
- permitted child-agent selectors and maximum delegation depth requests;
- default workflow selector, if any; and
- provenance and content digest.

Agent permissions are requests. Effective authority is still the intersection
defined by ADR-005. Agent text, model output, or a selected agent cannot widen a
grant.

The initial clean-room policy content is translated from the intended Curiosity
roles—generalist, analyst, implementer, orchestrator, researcher, reviewer,
strategist, and worker—rather than imported as an OpenCode agent transform.
Disabled OpenCode defaults such as `build` and `plan` have no native identity
unless separately specified. `generalist` is the initial default; orchestrator
selection and delegation are explicit rather than inferred from task size.

### 9.2 System-message channel

The provider-neutral prompt contract MUST support at least:

```ts
type PromptRole = "system" | "user" | "assistant" | "tool";
```

System messages are assembled only by the kernel from registered blocks. The
provider adapter cannot add hidden product instructions. Client input cannot
self-declare the system role. Each system block retains plugin ID, contribution
ID/version, trust/provenance label, source event/artifact references, required
flag, encoded byte count, and digest.

System text guides model behavior but grants no authority. The `tool` role is a
kernel-created representation of committed, schema-validated tool receipts; a
model, client, or semantic plugin cannot inject one as already executed.

Fixed assembly slots are:

1. selected agent policy;
2. explicitly activated skills;
3. durable semantic context;
4. workflow state and constraints; and
5. kernel-generated capability/readiness notices that describe limits but do
   not contain product policy.

Within a slot, contributions sort by explicit rank and then contribution ID.
Rank ties are deterministic and cannot override another block. Conversation
`user` and `assistant` messages remain separate from system blocks.

### 9.3 Context contributors

`curiosity.stock.context` coordinates domain-specific context contributions from
chat, ledger, evidence, skills, and workflows. Each contributor declares:

- applicable agent/workflow selectors;
- event/read-model selectors;
- maximum requested bytes and number of blocks;
- required versus optional blocks;
- stable rank and slot; and
- a pure projector from a kernel-bounded read snapshot.

The kernel, not the contributor, enforces per-contributor and global limits.
The current whole-journal `PluginDecisionContext.events` is therefore temporary
and MUST be replaced with cursor-bound query/read models before context plugins
are considered complete.

Overflow handling is deterministic:

1. reject an individually invalid or oversized required block;
2. retain all required blocks or deny provider dispatch;
3. drop whole optional blocks from lowest rank, then stable ID, until within the
   byte budget;
4. never silently slice canonical JSON, UTF-8, or a cited artifact; and
5. record included and omitted block digests in the attempt snapshot.

Provider token estimation MAY further narrow the byte-bounded result, but an
unavailable estimator cannot claim a token guarantee. Conversation history uses
an exact revision and a separate bounded history/compaction policy. Compaction
is a physical provider purpose with its own call ID, not a hidden context hook.

Untrusted remote, tool, or model-derived text is explicitly labelled and
delimited as evidence candidate content. Rendering or summarizing it does not
declassify it.

## 10. Projections and observation

Projection contributions declare accepted event schemas, output schema,
initial state, reducer, and optional query indexes. Replay rejects unknown event
versions rather than skipping them. Deleting a projection and replaying all
canonical inputs must reproduce equivalent output.

`curiosity.stock.observations` replaces OpenCode2 host hooks. Because the native
kernel already owns canonical command, provider, tool, child, gate, and
completion events, observation is an event reactor—not a second event capture
database. It may propose redacted, classified, provenance-labelled semantic
observations. It cannot rewrite source events, inspect raw secrets by default,
or promote an observation into evidence authority.

Provider deltas and animation frames are transient presentation data. Durable
assistant output comes from the committed provider receipt and chat reaction,
not from text accumulated by the TUI.

## 11. Native stock plugin catalog

| Plugin                          | Contributions                                                             | Initial state                                        |
| ------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| `curiosity.stock.thread`        | thread commands, schemas, projection                                      | Existing; migrate to ABI v2                          |
| `curiosity.stock.chat`          | turn command, conversation projection, provider action/reaction           | Existing semantics; remove kernel specialization     |
| `curiosity.stock.agents`        | versioned agent definitions and policy blocks                             | First intelligence slice                             |
| `curiosity.stock.context`       | bounded prompt-context coordination                                       | First intelligence slice                             |
| `curiosity.stock.observations`  | canonical-event classification/redaction reactions                        | Planned                                              |
| `curiosity.stock.ledger`        | intent, criteria, work, claim, progress, resolution events/reducers/tools | Planned                                              |
| `curiosity.stock.evidence`      | evidence schemas, custody bindings, retrieval/reconciliation policy       | Planned                                              |
| `curiosity.stock.skills`        | immutable skill definitions and activation policy                         | Planned                                              |
| `curiosity.stock.commands`      | authenticated prompt-command expansion                                    | Planned                                              |
| `curiosity.stock.search`        | bounded search tool semantics and taint policy                            | Planned; network-disabled initially                  |
| `curiosity.stock.read-tools`    | projection/workspace read tool definitions                                | Planned; capability-gated                            |
| `curiosity.stock.loop`          | finite workflow definitions and transition reducers                       | Deferred until attempts/cancellation/fencing qualify |
| `curiosity.stock.orchestration` | child-work and delegation proposal policy                                 | Deferred until child ceilings/budgets qualify        |
| `curiosity.adapter.provider.*`  | one-call provider protocol encoding/stream decoding                       | Existing adapter to migrate behind gateway           |
| `curiosity.adapter.search.*`    | one authorized search transport                                           | Planned, exact backend qualification required        |
| `curiosity.adapter.sqlite`      | one-writer persistence port and read-only projection port                 | Existing mechanism; incomplete ADR-002 qualification |
| `curiosity.adapter.supervisor`  | private versioned Rust IPC                                                | Existing handshake; execution capabilities disabled  |
| `curiosity.client.tui`          | signed command client and projection renderer                             | Existing, non-authoritative                          |
| `curiosity.client.opencode`     | replaceable OpenCode host bridge                                          | Separate copied adapter only                         |

Plugins SHOULD stay single-purpose. Combining contributions is allowed only when
they share one cohesive domain and does not grant a semantic plugin adapter
privileges.

## 12. OpenCode2-to-native translation

The port is clean-room and behavior-oriented:

| OpenCode2 surface           | Native destination                                 | Translate                                                   | Reject                                                          |
| --------------------------- | -------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| `features/config/agents.ts` | `curiosity.stock.agents`                           | Roles, bounded policies, requested tool access              | Host agent mutation, host defaults as authority                 |
| context hook/projection     | `curiosity.stock.context` plus domain contributors | Closed schemas, byte bounds, provenance labels              | `input.system.push`, direct Ledger reads from a host callback   |
| event capture hooks         | `curiosity.stock.observations`                     | Redaction, correlation, taint, duplicate/collision concepts | Parallel capture authority and host event identity as canonical |
| structured tool definitions | domain tool contributions                          | Closed schemas, proposal language, stable diagnostics       | Direct `execute` calls to Ledger/loop/search                    |
| Ledger                      | `curiosity.stock.ledger`                           | Intent/criteria/work/claim/evidence/resolution domain model | Plugin-owned files, approval/completion authority               |
| evidence subsystem          | `curiosity.stock.evidence`                         | Identity, custody, anchors, reconciliation, bounded queries | Development-only surfaces as active capability                  |
| search                      | `curiosity.stock.search` plus adapter              | Provider-neutral request, bounds, untrusted-result label    | Ungated network calls or agent-name-only authorization          |
| skills                      | `curiosity.stock.skills`                           | Versioned project-owned instruction content                 | Installer-owned global files and implicit activation            |
| slash commands              | `curiosity.stock.commands`                         | Useful intent and compatibility aliases where justified     | Host prompt bypass and shell-like control paths                 |
| NativeLoopEngine            | `curiosity.stock.loop`                             | Explicit states, finite budgets, no-progress policy         | Host prompt/interrupt authority, plugin timers/daemon/polling   |
| orchestration               | `curiosity.stock.orchestration`                    | Explicit delegation policy and role routing                 | Unfenced child execution or authority widening                  |
| OpenCode plugin lifecycle   | OpenCode client adapter only                       | Ordered setup and reverse cleanup lessons                   | OpenCode ABI in kernel or Curiosity lifecycle authority         |

No OpenCode2 source file, schema, prompt, test, or protocol is copied merely
because it exists. ADR-010 provenance and license review applies to every
adopted artifact. This specification's contracts are project-owned expressions
derived from Curiosity's accepted authority model.

## 13. Failure isolation and diagnostics

- Catalog validation failure prevents readiness and names the stable manifest or
  contribution diagnostic without exposing secrets.
- Command-decider failure rejects that command with no partial domain commit.
- Background-reaction failure leaves its source event intact, records bounded
  diagnostic state, and cannot block unrelated reactors indefinitely.
- Projection failure makes that projection unavailable; it cannot corrupt
  canonical state or authorize a fallback.
- Adapter startup failure disables its dependent capability.
- Dispatch failure, cancellation, timeout, or delivery uncertainty produces a
  receipt/state transition under the same physical call identity.
- Cleanup preserves the primary failure and performs scoped releases in reverse
  dependency order exactly once.
- Unknown event, action, receipt, policy, context, or workflow versions fail
  closed for dependent replay/dispatch/completion.

Diagnostics use stable codes and include plugin ID, contribution ID/version,
catalog digest, and correlation identity where safe. Raw prompt, secret, tool
output, or remote content is not retained in diagnostics by default.

## 14. Migration plan

### Tranche A — ABI v2 and sealed catalog

1. Introduce manifests and narrow contribution registries.
2. Add schema, duplicate, dependency, cycle, ordering, and catalog-digest tests.
3. Port thread and chat deciders through a temporary compatibility contribution.
4. Add semantic-plugin import restrictions and adapter port tests.

### Tranche B — Generic action and reaction spine

1. Add versioned event/action/receipt envelopes and authoritative control rows.
2. Add durable reaction/outbox identity and bounded reaction processing.
3. Move provider allocation/streaming into a generic `ProviderGateway` action
   interpreter.
4. Move assistant completion/failure semantics into chat reactors.
5. Delete chat payload decoding, chat event literals, and `chat()` orchestration
   from `kernel/authority.ts`; retain only a generic command/action surface.

### Tranche C — First native intelligence slice

1. Add system role support to the provider-neutral prompt contract.
2. Add the versioned Curiosity agent policy plugin.
3. Replace whole-journal plugin context with bounded read models.
4. Add deterministic context assembly, overflow, provenance, and snapshot
   digests.
5. Prove the selected policy and context snapshot survive replay and are exactly
   the values sent to the provider adapter.

### Tranche D — Read-only intelligence

1. Port observation reducers and semantic Ledger schemas/reducers.
2. Add skills and authenticated prompt commands.
3. Add read-only structured tools and evidence queries.
4. Add search definitions with network capability disabled by default; qualify
   an exact adapter separately.

### Tranche E — Governed execution

1. Implement attempt snapshots, leases, fencing, cancellation, accounting, and
   gate services to the accepted ADR checks.
2. Qualify reviewed read/mutation tools individually through the Rust
   supervisor.
3. Add evidence reconciliation and kernel-owned completion predicates.

### Tranche F — Loops and orchestration

Only after Tranche E acceptance, add finite workflow and child-orchestration
plugins. No loop, scheduler, continuation, delegation, or subagent capability is
available merely because its definition exists.

## 15. Binary acceptance checks

### Catalog and boundary

- [ ] **PNS-AC01:** startup rejects duplicate owners, IDs, versions, missing
      dependencies, dependency cycles, unsupported kernel APIs, and unknown
      manifest fields with stable diagnostics.
- [ ] **PNS-AC02:** two boots over the same exact catalog/configuration produce
      the same catalog digest and contribution order.
- [ ] **PNS-AC03:** source and built-artifact checks prove there is no dynamic
      import, package scan, plugin directory, or runtime registration path.
- [ ] **PNS-AC04:** architecture checks prove semantic plugins do not import
      storage writers, provider SDKs, filesystem/network/process APIs,
      supervisor clients, gates, or completion services.
- [ ] **PNS-AC05:** only the kernel writer can append canonical events or mutate
      authoritative control ledgers.

### Command, reaction, and action

- [ ] **PNS-AC06:** every command kind has exactly one decider; invalid or empty
      required output commits nothing.
- [ ] **PNS-AC07:** same actor/id/digest replay returns the original result and
      does not rerun reactions/actions; a changed digest conflicts.
- [ ] **PNS-AC08:** crash/restart at each reaction boundary processes
      `(event, reactor, version)` at most once logically and never loses a
      committed pending reaction.
- [ ] **PNS-AC09:** reaction count, byte, depth, deadline, and cycle exhaustion
      stops with a durable diagnostic and no in-memory spin.
- [ ] **PNS-AC10:** no adapter dispatch occurs before committed action, attempt,
      and physical-call allocation plus final-sink authorization.
- [ ] **PNS-AC11:** stale-generation, late, duplicate, malformed, and
      delivery-uncertain receipts cannot complete the active attempt.

### Chat and providers

- [ ] **PNS-AC12:** `kernel/` contains no `chat.turn`, chat payload decoder,
      message event literal, or chat-specific provider workflow.
- [ ] **PNS-AC13:** only `ProviderGateway` consumes provider streams; provider
      adapters cannot retry, loop tools, write state, choose context, or
      complete attempts.
- [ ] **PNS-AC14:** every physical provider request, including retry,
      compaction, warmup, child, failure, and uncertain delivery, has a unique
      pre-dispatch call record and non-fabricated usage state.
- [ ] **PNS-AC15:** a throwing or disconnected stream projection leaves provider
      receipt and completion behavior unchanged.

### Agents and context

- [ ] **PNS-AC16:** provider requests support a system role; client/model input
      cannot inject a system-role message through a user payload.
- [ ] **PNS-AC17:** changing any agent policy, skill, context block, ordering,
      source revision, or catalog entry changes the attempt snapshot digest.
- [ ] **PNS-AC18:** required context overflow denies dispatch; optional overflow
      drops whole blocks in deterministic order and records omitted digests.
- [ ] **PNS-AC19:** context reads are cursor/revision and byte/count bounded by
      the kernel; no contribution receives the unbounded event journal.
- [ ] **PNS-AC20:** replay of the same canonical revision and catalog yields the
      same ordered prompt blocks and digest.
- [ ] **PNS-AC21:** untrusted tool/remote/model-derived context remains
      provenance-labelled after projection and summarization.

### Tools, projections, and deferred surfaces

- [ ] **PNS-AC22:** a model tool call can only create a durable proposal; without
      an exact grant and any required gate, no adapter invocation occurs.
- [ ] **PNS-AC23:** deleting every disposable projection and replaying canonical
      events reconstructs equivalent views; projections cannot resolve gates or
      completion.
- [ ] **PNS-AC24:** unknown event or projection schema versions fail closed
      rather than being skipped.
- [ ] **PNS-AC25:** OpenCode2 package removal or ABI break does not affect custom
      harness build, startup, tests, or native plugin behavior.
- [ ] **PNS-AC26:** loop, orchestration, mutation tool, Git, sandbox, remote,
      production, and mobile capabilities remain reported unavailable until
      their own prerequisite checks pass.

## 16. Current conformance gap

The Tranche A foundation was implemented on 2026-08-25: thread and chat now use
ABI v2 manifests and command-decider contributions; startup validates exact
manifest shape, kernel API, plugin/contribution/command ownership, dependencies,
versions, and cycles; and the sealed stock catalog exposes deterministic plugin
order and a canonical digest. Semantic-plugin import checks preserve the initial
capability-free boundary.

The remaining gaps are:

- ABI v2 currently implements only command-decider contributions, and each
  decider still receives the complete event journal;
- `kernel/authority.ts` imports the chat decoder and owns chat-specific provider
  streaming, lifecycle events, completion, and projections;
- `PromptMessage` supports only `user` and `assistant`;
- the catalog contains only thread and chat plugins;
- events lack the full versioned aggregate/causation envelope required by
  ADR-002;
- the journal has no attempts, action proposals, physical-call ledger,
  reaction/outbox ledger, gates, or fencing; and
- provider, cancellation, accounting, crash, and hard-reset behavior remains
  unqualified.

These are migration facts, not exceptions to the target invariants.

## 17. Research record

### 17.1 Findings

- **Documented:** ADR-001 through ADR-011 require one Effect authority, one
  writer, event-log truth, proposal-first autonomy, final-sink enforcement,
  static trusted extensions, exact adapter qualification, and replaceable host
  adapters.
- **Documented:** the custom harness currently has a safe static command-owner
  seam but hard-codes chat/provider behavior in the kernel.
- **Documented:** OpenCode2 actively composes agent configuration, host hooks,
  direct Ledger/loop/search tools, and bounded context against a host-owned
  lifecycle.
- **Inference (high confidence):** a manifest plus narrow typed contributions is
  the smallest design that can make product behavior plugin-owned without
  turning plugins into a second authority.
- **Inference (high confidence):** durable reactions and action proposals are
  required before chat/provider orchestration can leave the kernel without
  losing crash visibility or idempotency.
- **Unknown:** exact performance limits, token estimators, provider cancellation,
  SQLite hard-reset behavior, adapter delivery ambiguity, and cross-process
  fencing require implementation qualification.

### 17.2 Adaptive bibliography

| Source                                                                                               | Why retained                           | Claim supported                                                                                      | Why preferable                                                   |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `docs/architecture/custom-harness/decisions/ADR-001` through `ADR-011`                               | Accepted project authority             | Kernel ownership, persistence, capability, adapter, host, and qualification constraints              | Normative project decisions outrank external patterns            |
| `research/harnesses/SYNTHESIS.md`                                                                    | Existing 21-harness decision synthesis | Complete external harnesses retain competing authority; bounded patterns only                        | Already evidence-governed and specific to Curiosity              |
| `apps/custom-harness/src/kernel/{plugin,authority,runtime,text-generator}.ts` and storage/tests      | Current implementation truth           | Exact chat specialization and missing seams                                                          | Executed source is stronger than README claims                   |
| `apps/plugin/opencode2/src/features/` and `src/plugin/plugin.ts`                                     | Behavioral source to translate         | Agent, context, hook, tool, Ledger, search, and loop surfaces                                        | Primary local source at the pinned copied adapter revision       |
| [Effect documentation: Managing Layers](https://effect.website/docs/requirements-management/layers/) | Typed static construction pattern      | Layers construct dependency graphs without leaking construction dependencies into service interfaces | Official documentation for the selected runtime                  |
| [OpenTelemetry: Build a custom Collector](https://opentelemetry.io/docs/collector/extend/ocb/)       | Exact-component assembly comparison    | A reviewed distribution can statically assemble a known component set instead of runtime discovery   | Official project documentation; used as a pattern, not authority |

### 17.3 Curiosity pass and stop decision

The highest-value unresolved thread was how plugins can drive multi-step
behavior without acquiring provider, tool, retry, or completion authority. The
proposal/interpreter split in Sections 7 and 8 resolves that thread consistently
with ADR-001 through ADR-005.

`CURIOSITY_NO_GO`:

- dynamic plugin marketplaces and extension directories—contradict the accepted
  static trust boundary;
- UI extension systems—cannot change command or lifecycle authority;
- general event-bus products—would add a second runtime before the required
  local outbox/reaction semantics are implemented; and
- further harness surveys—the existing 21-harness synthesis is saturated for
  the substrate decision.

Coverage is sufficient: every requested intelligence capability has a plugin
owner, every consequential operation has a kernel owner, the current chat
exception has a migration, and target invariants have binary checks. Research
stops at coverage and saturation. The listed qualification unknowns remain
explicit implementation gates rather than reasons for unbounded discovery.
