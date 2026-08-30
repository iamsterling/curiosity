# iPadOS intelligence architecture

Date: 2026-08-29; primary/sidecar boundary amended 2026-08-30
Status: **Accepted implementation architecture; not provider deployment, memory-retention, or release qualification.**  
Decisions: [ADR-019](decisions/ADR-019-ipados-explicit-generation-routes.md),
[ADR-020](decisions/ADR-020-ipados-governed-memory-curation.md)

The complete loop, graph, child-agent, native-tool, and lifecycle design is in
the [iPadOS native agent harness](IPADOS-NATIVE-AGENT-HARNESS.md) under accepted
[ADR-021](decisions/ADR-021-ipados-durable-agent-graph-kernel.md).

## Decision

Curiosity owns orchestration, durable state, policy, and context assembly. Apple
Intelligence is Curiosity's private semantic coprocessor: it may classify,
extract, summarize, curate, and rerank bounded local material, but it cannot
write memory, choose an unapproved provider, execute a tool, or declare work
complete.

Advanced generation remains an optional frontier capability. It is reached
through an explicit Curiosity account broker whose provider adapters use Vercel
AI SDK. The iPad stores only a broker session in native Keychain custody; it
does not store provider API keys, and the Curiosity app process never receives
them. The local product remains usable when that broker is absent.

```text
React Native
route/model chooser, connection status, memory review
                         |
                  LocalCuriosityClient
                         |
PortableAuthority (Hermes; one serialized semantic authority)
commands, policy, route selection, context plans, memory admission
       |                    |                         |
AuthorityJournal      GenerationGateway         MemoryQueryPort
Rust/SQLite           exact-route dispatch      bounded local retrieval
                            |          |
                 OnDeviceRoute     FrontierRoute
                 Swift Foundation  native HTTPS host
                 Models hosts      + Keychain broker session
                                         |
                              Curiosity account broker
                              AI SDK provider adapters
                              provider credentials
```

## Ownership boundaries

| Concern | Owner | Explicitly not owner |
| --- | --- | --- |
| Commands, events, policy, route selection | `PortableAuthority` | React, Swift, model, broker |
| Journal transaction and recovery | mobile Rust/SQLite journal | model, provider adapter |
| Local semantic proposal | Foundation Models host | journal or memory projection |
| Memory acceptance, supersession, retirement | `PortableAuthority` memory policy | Foundation Models host |
| Memory retrieval | bounded local query port, then optional local reranker | frontier provider by default |
| Provider catalog and connection metadata | portable catalog/projection | credential store |
| Broker session credential | native Keychain host | Hermes, events, logs |
| Provider credential | account broker | iPad app |
| Provider request encoding and stream parsing | broker-side AI SDK adapter | authority, tools, retries |
| Tool effects | separately governed capability ports | either generation route |

## Route model

Connection, model, role, and route are different identities:

- an **agent role** describes behavior such as `generalist` or `researcher`;
- a **provider connection** describes user authorization to one provider;
- a **model selection** names a model exposed by that connection; and
- a **route selection** names the exact local or frontier adapter used for one
  operation.

`agentId` must never carry provider routing. A route preference is resolved by
authority policy before physical dispatch. `auto` is a policy input, not a
runtime route and not permission to fall back.

```ts
type GenerationPurpose =
  | "agent.step"
  | "intent.classify"
  | "turn.answer"
  | "memory.curate"
  | "memory.rerank"
  | "memory.compact"
  | "retrieval.query"
  | "title.generate";

type RoutePreference =
  | { readonly kind: "exact"; readonly routeId: string }
  | { readonly kind: "auto"; readonly policyId: string };

interface GenerationSelection {
  readonly adapterVersion: string;
  readonly locality: "device" | "frontier";
  readonly modelId: string;
  readonly providerId: string;
  readonly purpose: GenerationPurpose;
  readonly requestedRouteId: string;
  readonly routeId: string;
  readonly selectionPolicyId: string;
}
```

The selection is journaled before dispatch. Completion, failure, cancellation,
and delivery ambiguity retain the same selection identity. A route adapter may
dispatch only the selected route. If it is unavailable, the operation fails
with a route-specific stable code; it cannot try another route.

### Initial routes

| Route | Intended work | Tools | Network |
| --- | --- | --- | --- |
| `on-device.apple` | intent classification, memory curation/reranking, query formulation, titles, and bounded summaries | none | no |
| `frontier.<connection>` | primary agent steps and advanced generation | proposals only through the authority loop | yes |
| `research.<connection>` | governed research workflow | governed research tools | yes |

Apple on-device generation is never a primary answer route. A primary turn
requires one explicit connected frontier route; when none is available the turn
fails `PROVIDER_ROUTE_UNAVAILABLE` while deterministic local features and Apple
sidecar hooks remain available. Research, coding, large-context synthesis, and
tool-bearing work are ineligible for the Apple route. Selecting a frontier route
is visible in the composer and in the completed-turn receipt.

## Frontier connection architecture

The app copies OpenCode's useful separation of catalog, connection, and model,
not its desktop environment-variable credential mechanism.

1. The signed app configuration names one exact HTTPS broker origin. An absent
   origin makes frontier routes unavailable without affecting local startup.
2. A native authentication host opens the broker connection flow using the
   system authentication session and PKCE.
3. Where a provider supports delegated third-party authorization, the broker
   uses that documented flow. Otherwise, API-key enrollment occurs only on a
   broker-hosted TLS page. It is labelled as key enrollment, not OAuth login.
4. The app receives a short-lived broker access credential and rotating broker
   refresh credential. Native code stores them with a
   `ThisDeviceOnly`/when-unlocked Keychain policy and never returns them to
   Hermes.
5. Hermes receives only non-secret provider status: provider ID, connection ID,
   display label, allowed model IDs, expiry/reauthorization state, and route
   availability.
6. A native `URLSession` host attaches the broker credential and streams events
   keyed by authority turn and provider-call identities.
7. The broker keeps provider credentials server-side and runs the existing AI
   SDK provider adapters with hidden retries and automatic tool loops disabled.
8. Disconnect revokes the broker-side provider grant and deletes the native
   broker session when no connections remain. Credential deletion makes the
   route unavailable immediately.

No consumer-account OAuth protocol is inferred from a desktop CLI, and no
OpenAI, Anthropic, Google, or compatible-provider secret enters JavaScript,
bundle resources, event bodies, prompts, logs, or crash reports.

## On-device memory subsystem

### Memory is a governed projection

Apple Intelligence may produce memory proposals. Only an admitted authority
command can change canonical memory state.

```ts
type MemoryKind =
  | "commitment"
  | "decision"
  | "fact"
  | "preference"
  | "project-summary";

type MemorySensitivity = "ordinary" | "private" | "restricted";
type MemoryRetention = "session" | "bounded" | "durable";

interface MemoryProposal {
  readonly confidence: number;
  readonly content: string;
  readonly kind: MemoryKind;
  readonly observedMemory?: {
    readonly memoryId: string;
    readonly version: number;
  };
  readonly operation: "create" | "retain" | "supersede" | "suggest-retire";
  readonly proposedRetention: MemoryRetention;
  readonly proposedSensitivity: MemorySensitivity;
  readonly sourceMessageIds: readonly string[];
}
```

The model cannot propose a physical delete. `suggest-retire` is advisory. User
commands and deterministic retention policy own logical forgetting. Because the
journal is append-only, logical forgetting removes a memory from active
projections and retrieval but does not claim physical or cryptographic erasure
of historical event bytes. An erasure claim requires a separate encrypted
content-vault and key-destruction decision.

### Curation flow

```text
turn.completed
    |
memory.curation.requested (turn/message identities + source digest)
    |
one bounded on-device structured-generation call
    |
MemoryProposal[]
    |
deterministic validation and policy
    |-- reject secret/invalid/stale candidate
    |-- require review for elevated sensitivity
    `-- admit memory.recorded / memory.superseded
```

The same boundary governs all Apple hooks. A hook receives one bounded,
revision-bound snapshot and returns a typed proposal. Intent classification may
suggest a role or workflow; deterministic policy decides. Memory retrieval first
queries active records locally; Apple may rerank at most the returned candidate
IDs and never scans SQLite directly. Curation may propose records; authority
alone appends admitted memory events.

The job identity is derived from the source turn and memory-policy version.
Re-execution is idempotent. Every proposal references exact source messages and,
for updates, the observed memory version. A stale proposal cannot overwrite a
newer memory.

Validation is independent of model claims:

- at most eight proposals per curation call;
- enum, identifier, content, and collection bounds;
- exact source-message membership and source digest;
- deterministic credential/secret detectors;
- a deterministic sensitivity floor that may raise, never lower, the model's
  proposed classification;
- optimistic version checks for supersession;
- canonical-content digest deduplication; and
- policy-controlled retention and review requirements.

A secret-detector hit is not persisted as a memory candidate. The authority
records only a rejection code and non-reversible job-local evidence where
needed. The original conversation follows its separately disclosed retention
policy.

### Retrieval and disclosure

The local model never scans the entire memory archive.

1. A deterministic local query port performs bounded lexical retrieval over
   active memories.
2. At most 12 compact candidates are passed to `memory.rerank`.
3. The model returns memory IDs and relevance labels, not rewritten facts.
4. Authority validates those IDs and constructs the final context plan.
5. Only the selected, still-active memory versions enter the prompt.

Local memory is never sent to a frontier route merely because that route was
selected. Frontier context requires a disclosure plan based on user settings,
memory sensitivity, purpose, and connection. The provider-call receipt records
the disclosed memory identities/digests and policy version. `restricted`
memories are denied by default.

### Foundation Models context envelope

Curiosity treats 4,096 tokens as the total on-device input-plus-output ceiling.
Until a qualified exact tokenizer is available, assembly uses a conservative
route-specific estimate and a hard UTF-8 bound; context overflow still fails
explicitly rather than retrying through a frontier provider.

Only 3,480 estimated tokens are allocatable, preserving roughly 15 percent for
tokenizer/model variance:

| Allocation | Maximum estimated tokens |
| --- | ---: |
| Instructions and structured schema | 420 |
| Current task or source conversation | 900 |
| Retrieved memories or nearby records | 1,100 |
| Response | 700 |
| Delimiters and metadata | 160 |
| Unallocated within usable envelope | 200 |

Each local call is one bounded semantic operation. There is no model-owned
recursive loop. Larger compaction is a deterministic chunk workflow: authority
selects each bounded chunk, records its provenance, validates the summary, and
decides whether another chunk is required.

## Canonical events

The proposed minimum event vocabulary is:

| Event | Purpose |
| --- | --- |
| `generation.route.selected` | freezes route, model, purpose, policy, and context-plan identity |
| `generation.dispatch.armed` | records the exact call identity before local or remote dispatch |
| `generation.completed` / `failed` / `cancelled` / `dispatch-unknown` | terminal or ambiguous attempt evidence |
| `memory.curation.requested` | durable idempotent curation job |
| `memory.curation.completed` | proposal digest, counts, model/route receipt, and policy result |
| `memory.recorded` | creates an admitted immutable memory version with provenance |
| `memory.superseded` | retires one exact version in favor of another |
| `memory.review.requested` | durable human gate for an allowed but elevated candidate |
| `memory.retired` | removes an exact version from active retrieval |
| `memory.disclosure.authorized` | freezes the memory set allowed into one frontier request |

Event names and bodies must enter the shared portable catalog and desktop/mobile
golden fixtures together. Neither native host may append these events directly.

## Failure and lifecycle behavior

| Condition | Required behavior |
| --- | --- |
| Apple model unavailable | local helper/curation job remains explicitly unavailable or pending; no frontier fallback |
| Broker absent or signed out | frontier routes unavailable; local authority and memory remain usable |
| Provider authorization expired | exact route fails `PROVIDER_REAUTHORIZATION_REQUIRED` |
| Context estimate exceeds local envelope | fail `FOUNDATION_MODEL_CONTEXT_EXCEEDED` before dispatch |
| Background during curation | cancel/fence call; retain resumable job identity |
| Background during frontier dispatch | reconcile to terminal evidence or `DISPATCH_UNKNOWN` |
| Stale curation proposal | reject by source or memory-version mismatch |
| Reranker emits unknown memory ID | reject complete rerank result; do not partially trust it |
| Secret-like memory candidate | reject candidate without durable candidate content |
| Selected route unavailable | fail selected operation; do not substitute another route |

## Implementation units

Each unit has one owner and a binary exit check.

### I1 — Portable contracts and receipts

Owner: `packages/curiosity-authority/`

- Add generation purpose, route preference/selection, context-plan, and route
  receipt types.
- Separate role identity from route identity in `chat.turn`.
- Persist requested and actual route/model on success and failure.

Exit: portable tests prove exact-route dispatch and no-fallback failure, and
desktop/mobile golden fixtures match.

### I2 — Memory domain and policy

Owner: `packages/curiosity-authority/`

- Add bounded proposal decoding, memory events, active-memory projections,
  version checks, deduplication, sensitivity floor, and retention policy.
- Add curation job idempotency and stale-result rejection.

Exit: malformed, stale, duplicate, restricted, and secret-like proposals cannot
mutate active memory; admitted records retain exact provenance.

### I3 — Structured on-device curator

Owner: `apps/mobile/modules/curiosity-runtime/ios/`

- Add a separate structured `MemoryCuratorHost`; do not overload free-text chat
  generation.
- Bound source bytes, candidate count, response schema, cancellation, and model
  availability.

Exit: physical-device fixtures cover create, supersede, rerank, overflow,
cancellation, guardrail failure, and stale-event isolation.

### I4 — Local memory query and UI

Owner: mobile Rust query adapter plus React projection UI.

- Publish a bounded active-memory query port.
- Add memory review, provenance, retention, retire, and sharing controls.
- Show route/model receipts on completed turns.

Exit: Mac-off lifecycle can curate, relaunch, retrieve, review, and retire a
memory without network access.

### I5 — Native broker session and provider catalog

Owner: mobile native runtime and portable connection projections.

- Add system authentication-session flow, native Keychain custody, connection
  status, revocation, and exact HTTPS origin policy.
- Expose metadata only to Hermes.

Exit: bundle/log/event scans find no session or provider credential; revocation
makes the route unavailable immediately.

### I6 — AI SDK frontier broker

Owner: separately deployed Curiosity account broker.

- Run provider adapters server-side with one physical-call identity per request.
- Disable hidden retries and tool loops; preserve cancellation, request IDs,
  usage uncertainty, and delivery ambiguity.

Exit: observed network calls all have prior durable call identities, and crash
injection preserves `DISPATCH_UNKNOWN` rather than fabricating success or zero
usage.

## Explicit non-goals

- Apple Intelligence as the application authority or an unbounded agent loop.
- Apple Intelligence as the primary conversational or agent-step provider.
- Direct model writes to SQLite, Craft documents, or provider connection state.
- Direct provider API keys or unofficial consumer-account OAuth in the app.
- Silent local/frontier fallback in either direction.
- Sending the entire journal, conversation archive, or memory archive to any
  model.
- Claiming physical erasure from append-only logical forgetting.
- Claiming memory quality, frontier security, cost control, or release readiness
  before the named physical and failure-injection checks pass.
