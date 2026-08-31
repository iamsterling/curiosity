# Canonical durable agent lifecycle synthesis

> Research synthesis only. This record recommends lifecycle semantics; it does
> not grant implementation, release, security-acceptance, provider, retention,
> or deployment authority. Vendor documentation is evidence of documented
> product behavior, not independent qualification.

- **Decision:** Which durable lifecycle should Curiosity use for conversational
  and tool-using agent runs while preserving one project-owned authority?
- **Research date:** 2026-08-30
- **Coding-harness evidence cutoff:** 2026-08-24 UTC
- **Repository implementation point:** commit `4d43cde` plus the uncommitted
  Apple-platform slice
- **Prior architecture:**
  `BUILD_DIRECTLY_SHARED_KERNEL_SEPARATE_HOSTS`; frontier agent primary; Apple
  Intelligence a bounded on-device sidecar
- **Depth budget:** four primary-source passes of at most two sources each,
  plus the pinned 21-dossier corpus
- **Coverage gate:** admission, model steps, tools, clarification, approvals,
  children, recovery, context, memory, and terminal projection each have
  documented evidence and a Curiosity disposition; consequential unknowns and
  rejected follow-ups are explicit.
- **Result:** `ADOPT_CANONICAL_DURABLE_TURN_LIFECYCLE_V1`

## 1. Executive synthesis

The market converges on several useful shapes but not on one authority-safe
runtime. Agent SDKs own a model/tool loop; graph runtimes checkpoint resumable
state; durable-execution systems journal nondeterministic steps; protocols
separate working, interrupted, and terminal states; memory systems separate
thread checkpoints from cross-thread memory and distinguish foreground from
background formation. Complete coding harnesses additionally own permissions,
provider retries, persistence, and terminal projection. Embedding any complete
runtime would therefore recreate the competing-authority problem already found
across the 21 dossiers.

Curiosity should adapt the shapes, not adopt another loop:

1. The canonical user message and turn admission become durable before any
   model, sidecar, retrieval, child, or tool work.
2. Every model call is one exact, journaled step against an immutable context
   plan and route receipt. Streaming deltas are presentation only.
3. Structured model output is a proposal. The project-owned kernel validates
   current revision, policy, capability, budget, and identity before allocating
   work or requesting completion.
4. Questions are non-authoritative assistant turns that interrupt a run.
   Answers resume the exact question and never approve an action. Binding gates
   remain explicit revision/digest-bound approval controls.
5. Tool and provider attempts are allocated before dispatch, terminal receipts
   are durable, and relaunch reconciles uncertain attempts before permitting an
   overlap. Curiosity makes no blanket exactly-once claim.
6. Children receive bounded tasks and narrower capability ceilings. Their
   results return as evidence; their loops, questions, failures, and
   cancellation remain visible in parent lineage.
7. Context is rebuilt deterministically from typed, provenance-bearing blocks.
   Conversation continuity is not durable effect state, and memory is not a
   transcript alias.
8. Apple Intelligence may propose pre-turn context assistance and post-turn
   memory curation. It cannot alter the canonical user message, perform
   retrieval, execute tools, write memory, select providers, or complete a run.
9. Only durable journal state establishes waiting or terminal status. A run is
   `waiting-for-input` only while an exact question or gate remains pending;
   otherwise it ends with one assistant result or one typed failure.

## 2. Evidence map

`DOCUMENTED` means the cited source states or the pinned dossier establishes the
behavior. `INFERENCE` is the Curiosity design conclusion. `UNKNOWN` marks a
claim the evidence does not qualify.

| Concern                         | Representative market evidence                                                                                                                                                                                                                                                                                                             | Curiosity disposition                                                                                                                                                                                       | Classification                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Admission and identity          | A2A defines stateful tasks with stable IDs and distinguishes a direct message from tracked task processing [A2A]. Codex exposes lifecycle RPC and reader/writer admission patterns (`openai-codex.md` C-033–C-037).                                                                                                                        | Atomically append immutable user content, `turn.requested`, root-run identity, exact role, limits, and capability ceiling before sidecars or dispatch.                                                      | Market behavior **DOCUMENTED**; atomic Curiosity boundary **INFERENCE**.                                   |
| Model steps                     | Restate documents journaling LLM results so recovery replays completed calls rather than refetching them [RESTATE]. Apple documents guided structured generation and snapshot streaming [APPLE-FM].                                                                                                                                        | Allocate one provider attempt for one revision/digest-bound `AgentStepRequest`; validate one closed proposal; treat deltas as non-authoritative.                                                            | Pattern **DOCUMENTED**; exact envelope **INFERENCE**.                                                      |
| Tools and effects               | OpenCode validates/authorizes at the final tool sink and uses correlated event/projection mechanics (`opencode.md` C-040–C-041). Pi fails closed on unknown/invalid calls (`pi.md` C-036). Restate wraps tools as durable steps [RESTATE].                                                                                                 | Validate schema and exact tool identity, re-evaluate policy at the sink, allocate before dispatch, and persist typed evidence before replanning. Do not infer exactly-once effects from a journal alone.    | Validation/durable-step patterns **DOCUMENTED**; exactly-once qualification **UNKNOWN**.                   |
| Clarification                   | MCP elicitation supports nested structured input, leaves presentation to the client, and distinguishes accept, decline, and cancel [MCP-ELICIT]. Claude Agent SDK documents `AskUserQuestion` as in-loop session work [CLAUDE-SESSIONS].                                                                                                   | Emit `question.asked`, project it as a normal assistant message, put the normal composer in answer mode, and submit through correlated `answerQuestion`. Answers retain `untrusted-user-answer` provenance. | Interaction shape **DOCUMENTED**; Curiosity UI and provenance rule **INFERENCE**.                          |
| Binding approval                | OpenAI Agents SDK pauses on tool-call-scoped interruptions, serializes `RunState`, and resumes the original outer run even for nested agents [OAI-HITL]. OpenHands exposes an explicit approval-response event pattern (`openhands.md` C-032).                                                                                             | Keep gates separate from chat: authenticated actor, exact action, payload digest, proposal revision, expiry, approve/deny, and fail-closed resume. A question answer can never satisfy a gate.              | Pause/resume pattern **DOCUMENTED**; strict authority split **INFERENCE**.                                 |
| Children and delegation         | OpenAI surfaces nested-agent approvals on the outer run [OAI-HITL]. A2A supports opaque agent collaboration without sharing internal state, memory, or tools [A2A]. Complete harnesses retain competing child-loop authority (`opencode.md` C-039; `pi.md` C-034).                                                                         | Parent allocates exact child identity, task, limits, depth, and narrowed capabilities. Child results are bounded evidence. Parent owns integration and terminal status; cancellation follows lineage.       | Market behaviors **DOCUMENTED**; ownership model **INFERENCE**.                                            |
| Interruption and recovery       | LangGraph separates thread checkpoints from cross-thread stores and uses durable checkpointers for restart persistence [LANGGRAPH]. Restate records step results and resumes at the first incomplete step [RESTATE]. DeepSeek retains interrupted-operation prefixes but leaves crash semantics unqualified (`deepseek-harness.md` C-034). | On launch, close undispatched allocations, mark dispatched/nonterminal work delivery-unknown, and prohibit overlap until reconciliation. Retry is a new governed attempt, not silent replay.                | Replay patterns **DOCUMENTED**; external-effect safety remains **UNKNOWN** without sink-specific evidence. |
| Context planning                | Claude sessions retain prompts, tool calls/results, and responses but explicitly do not snapshot filesystem state [CLAUDE-SESSIONS]. LangGraph distinguishes thread checkpoints from long-term stores [LANGGRAPH]. Pi warns that repository instructions placed into system context can contaminate authority (`pi.md` C-035).             | Rebuild each step from bounded typed blocks with source IDs, provenance, byte/token budgets, and a context-plan digest. Instructions, conversation, evidence, child results, and memory remain distinct.    | Separation risks **DOCUMENTED**; deterministic plan **INFERENCE**.                                         |
| Memory formation                | LangMem distinguishes semantic, episodic, and procedural memory; profiles versus collections; active versus background formation; and consolidation/invalidation [LANGMEM].                                                                                                                                                                | Post-turn sidecar output is only a source-bound proposal to create, retain, supersede, relate, or suggest retirement. Curiosity policy owns sensitivity, scope, duplication, retention, and every mutation. | Taxonomy/timing **DOCUMENTED**; governed proposal boundary **INFERENCE**.                                  |
| Waiting and terminal projection | A2A distinguishes `INPUT_REQUIRED`/`AUTH_REQUIRED` interruptions from completed, failed, cancelled, and rejected terminal states [A2A]. OpenCode’s sequence-checked event/projection pattern makes the event store domain evidence while external effects require separate receipts (`opencode.md` C-041).                                 | Project status exclusively from the durable journal. Partial streams never complete a turn. Commit one terminal assistant message plus `turn.completed`, or exact `turn.failed`/cancellation evidence.      | State distinction **DOCUMENTED**; Curiosity transaction shape **INFERENCE**.                               |

## 3. Canonical lifecycle v1

### 3.1 State vocabulary

The semantic kernel uses these observable phases; hosts may render them
differently but may not redefine them:

```text
admitted -> runnable -> waiting-generation -> proposal-admission
                                      |-> waiting-actions  -> runnable
                                      |-> waiting-children -> runnable
                                      |-> waiting-question -> runnable
                                      |-> waiting-gate     -> runnable
                                      |-> completion-requested

any nonterminal -> paused | cancelled | failed
completion-requested -> completed | failed | cancelled
```

`waiting-question` and `waiting-gate` are interrupted, not terminal. Provider
or tool delivery uncertainty is a recovery classification, never success.

### 3.2 Admission transaction

The authority MUST commit, as one coarse journal operation:

- canonical user text and immutable `userMessageId`;
- thread, turn, project, root run, execution, and source-event identities;
- exact operator-selected primary role and policy/catalog versions;
- initial limits and capability ceiling; and
- `turn.requested` plus runnable root state.

Apple pre-turn work starts only after this commit. Its input references the
durable message ID/digest. Its output is a separately typed proposal and never a
rewrite or append to the user message.

### 3.3 Optional pre-turn sidecar sequence

```text
durable user input
  -> bounded Apple intent/query/recall proposal (optional, fail-soft)
  -> Curiosity validates proposal and chooses deterministic retrieval
  -> bounded candidates
  -> optional Apple rerank/deduplicate/compress proposal
  -> Curiosity selects IDs and builds ContextPlan
```

The second local call may rank only the supplied candidate IDs. It cannot decide
which stores are eligible, widen scope, perform retrieval, or author durable
content. Sidecar unavailability or malformed output skips the enhancement; it
does not select a backup chatbot.

### 3.4 Model-step sequence

For every model step the authority MUST:

1. load the current run projection;
2. construct bounded, provenance-bearing context blocks;
3. select the exact configured frontier route or fail
   `PROVIDER_ROUTE_UNAVAILABLE` without substitution;
4. create context-plan and route-receipt digests;
5. allocate and authorize one provider attempt before physical send;
6. publish correlated streaming deltas as ephemeral UI state only;
7. durably settle success, typed failure, cancellation, or delivery uncertainty;
8. decode and authority-validate the proposal against the observed revision and
   state digest; and
9. atomically commit the next transition or discard the stale result.

The frontier proposal vocabulary is `final`, `actions`, and `question`.
`no-go` is not a frontier-model output: trusted Curiosity policy may produce a
closed internal no-go transition before or after a model step, but a model
cannot author policy or terminal error identity. Ordinary informational,
creative, conversational, or ambiguous-but-useful requests MUST default to a
bounded final response. A question is permitted only when specific missing
operator input prevents useful progress.

### 3.5 Actions and gates

A proposed action does not authorize itself. The kernel resolves the exact
registered tool/version, validates its schema, intersects capabilities, and
allocates the action. The final sink then revalidates current policy and either:

- denies before dispatch;
- emits a durable binding gate and waits;
- or allocates/authorizes one effect attempt.

Gate approval binds actor, gate ID, action ID, payload digest, proposal revision,
expiry, and decision. Revision or digest drift invalidates it. Tool output is
untrusted evidence with a receipt; it can inform the next model step but cannot
grant authority.

### 3.6 Questions as conversation

The question event remains its own durable control object, but the conversation
host projects its prompt with the ordinary assistant visual treatment. While it
is pending, the existing composer becomes answer mode:

- send targets the exact `questionId` via `answerQuestion`;
- role and route selection are disabled;
- the answer is bounded and durably recorded as `untrusted-user-answer`;
- the run resumes only after that commit; and
- the answer cannot approve a gate or expand capabilities.

Binding approvals retain explicit cards because their digest, revision,
resource, capabilities, expiry, and approve/deny semantics must remain visible.

### 3.7 Children

A child allocation includes parent/run/execution IDs, deterministic child key,
role/version, bounded objective and deliverable, acceptance checks, non-goals,
limits, and a narrowed capability ceiling. Mobile policy remains at most two
depth-one children. Only `generalist` and `orchestrator` are operator-selectable;
child-only roles cannot be promoted by prompt text.

Each child has normal durable model/action/question/failure semantics. Parent
integration waits for terminal child evidence, never raw child authority.
Cancellation traverses lineage and records every terminal state.

### 3.8 Completion and projection

`final` requests completion but does not let a stream or UI declare it. The
journal transaction must establish the terminal result and assistant message so
replay cannot show completion without its content. A `no-go`, provider failure,
budget exhaustion, no-progress result, or cancellation records one exact code.

Clients derive all of the following from journal projections:

- transcript messages;
- pending question or gate;
- run graph and child status;
- exact terminal error; and
- terminal assistant content and transport receipt.

### 3.9 Post-turn governed memory

After terminal projection, an optional fresh Apple session may inspect only the
bounded source messages and current scoped memory supplied by Curiosity. Every
job binds source IDs/digest, project/scope, policy version, route identity, and
an idempotency key. Apple returns proposals, never writes.

Curiosity validates sensitivity, scope, factual support, duplication,
supersession, relationship, retention, and retirement policy before appending a
memory event. Explicit “remember this” increases intent strength but remains a
proposal subject to the same checks. Procedural/system-policy memory is not
model-writable.

## 4. Direct-answer and question policy

The physical-iPad `UNSUPPORTED_REQUEST` result exposed a contract defect rather
than an unsupported topic: the frontier schema accepted any identifier as a
model-authored `reasonCode`. Closing the set to `POLICY_BLOCKED` was then
physically falsified: after the model asked “What would you like to know about
the Moon?” and the operator answered “Anything,” it selected the sole remaining
code. A closed enum therefore does not repair the authority error; the frontier
model must not author policy outcomes at all.

The lifecycle requires:

1. no `no-go` branch in the frontier structured-output schema;
2. `final` as the default for ordinary requests answerable from supplied
   context or bounded model knowledge;
3. `question` only for a concrete blocker, never as a generic invitation;
4. after a correlated question answer, no further question in the same run;
5. after a correlated question answer, a dynamic schema that excludes both
   `question` and `no-go` (and therefore requires `final` when no tools exist);
6. tool/capability absence to produce a bounded answer, a specific question, or
   a kernel-owned typed availability failure—not an invented model code; and
7. any model-emitted `no-go` to fail frontier validation without projecting its
   reason as terminal authority.

This does not force unsafe assistance. Trusted Curiosity policy may create an
exact closed `POLICY_BLOCKED` transition, and provider refusal remains a typed
provider outcome; the model cannot create policy or failure identities.

## 5. Findings, contradictions, and unknowns

### Documented findings

- Serializable pause/resume state and correlated interruptions are common in
  agent SDK and graph runtimes [OAI-HITL] [LANGGRAPH].
- Protocols distinguish requests for input/authentication from terminal task
  outcomes [A2A] [MCP-ELICIT].
- Conversation/session persistence is not the same as effect or filesystem
  state [CLAUDE-SESSIONS].
- Durable runtimes journal nondeterministic calls and replay completed results,
  but effect guarantees still depend on the sink and failure boundary
  [RESTATE].
- Long-term memory needs explicit type, formation time, storage, retrieval, and
  consolidation choices [LANGMEM].
- Apple’s device-scale model is optimized for bounded summarization,
  extraction, and classification rather than world knowledge or advanced
  reasoning [APPLE-FM].

### Design inferences

- The journal, not a transcript, model session, graph engine, or UI, must be the
  completion and recovery authority.
- Clarification and approval need different durable types even if another SDK
  represents both as interruptions.
- Apple’s documented automatic tool loop is unsuitable for Curiosity authority;
  Foundation Models should receive no authoritative tool executor and should
  return bounded proposals.
- Foreground memory formation may be useful for explicit remember intent, but
  durable admission should still be policy-owned and may complete after the
  conversational response.

### Consequential unknowns

- Physical-device crash windows around provider response receipt and journal
  settlement remain unqualified.
- Exactly-once behavior for remote provider sends and external side effects is
  not established; delivery uncertainty must remain explicit.
- Apple model availability, latency, context pressure, and output quality across
  supported hardware/OS/language combinations require a physical matrix.
- Cross-device journal synchronization and one-writer conflict ownership remain
  out of scope.
- The exact macOS distribution/capability profile remains unresolved.

## 6. Curiosity pass and stop decision

After the first synthesis, the highest-value unresolved thread was whether
clarification should use a special card or the conversation surface. MCP leaves
presentation open but requires clear requester identity, review, decline, and
cancel semantics [MCP-ELICIT]; A2A and OpenAI separately establish interrupted
state [A2A] [OAI-HITL]. This supports a normal assistant message plus answer-mode
composer for non-binding questions, while preserving explicit cards for binding
gates.

Rejected follow-ups:

- `CURIOSITY_NO_GO` — adopt LangGraph, Restate, or an Agent SDK as the kernel:
  each would introduce another loop, state owner, retry owner, or writer.
- `CURIOSITY_NO_GO` — let Apple Foundation Models call Curiosity tools: Apple’s
  automatic tool execution is documented, but violates the accepted sidecar
  authority boundary.
- `CURIOSITY_NO_GO` — make all memory writes synchronous with the response:
  LangMem documents a useful background path, and no decision-relevant evidence
  requires hot-path latency.
- `CURIOSITY_NO_GO` — reopen all 21 harness snapshots: the lifecycle gaps were
  covered by newer framework/protocol classes; no contrary substrate evidence
  emerged.
- `CURIOSITY_NO_GO` — claim exactly-once effects from durable replay: vendor
  documentation is not a crash-boundary qualification for Curiosity’s sinks.

**Coverage:** all ten lifecycle concerns have representative coding-harness and
framework/protocol evidence. **Saturation:** the last pass reinforced the
frontier/sidecar and session/effect separations without changing the lifecycle.
**Stop:** `STOP_LIFECYCLE_SATURATION_IMPLEMENT_AND_QUALIFY`. Resume research only
for a failed fixture, a new exact sink guarantee, cross-device authority, or a
named macOS profile decision.

## 7. Adaptive bibliography and rationale

- **[A2A] Agent2Agent Protocol Specification 1.0.0.**
  <https://a2a-protocol.org/latest/specification/>. Selected as a normative,
  framework-neutral source for task identity, direct messages, streaming,
  interrupted states, terminal states, and opaque child-agent boundaries.
- **[MCP-ELICIT] MCP Elicitation, protocol version 2025-11-25.**
  <https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation>.
  Selected as the normative source for nested user input, structured schemas,
  requester visibility, accept/decline/cancel, and credential boundaries.
- **[OAI-HITL] OpenAI Agents SDK, Human-in-the-loop.**
  <https://openai.github.io/openai-agents-python/human_in_the_loop/>. Selected
  for serializable run interruption, call-scoped decisions, outer-run resume,
  nested-agent approvals, streaming, and pending-definition versioning.
- **[LANGGRAPH] LangGraph, Persistence.**
  <https://docs.langchain.com/oss/python/langgraph/durable-execution>. Selected
  for the explicit separation of thread checkpoints and cross-thread stores,
  and for restart/HITL persistence. The fetched page canonicalized to
  “Persistence”; only those displayed claims are retained.
- **[RESTATE] Restate, Durable Agents.**
  <https://docs.restate.dev/ai/patterns/durable-agents>. Selected for journaled
  LLM/tool steps and replay-to-first-incomplete-step. Its exactly-once language
  is retained as a vendor claim, not Curiosity qualification.
- **[LANGMEM] LangMem, Long-term Memory in LLM Applications.**
  <https://langchain-ai.github.io/langmem/concepts/conceptual_guide/>. Selected
  for memory types, profile/collection tradeoffs, consolidation, and active
  versus background formation.
- **[APPLE-FM] Apple WWDC25, Meet the Foundation Models framework.**
  <https://developer.apple.com/videos/play/wwdc2025/286/>. Selected as Apple’s
  primary source for device-scale limitations, guided output, streaming,
  automatic tool calling, stateful sessions, availability, and errors.
- **[CLAUDE-SESSIONS] Claude Agent SDK, Work with sessions.**
  <https://code.claude.com/docs/en/agent-sdk/sessions>. Selected for a major
  coding-agent SDK’s documented conversation/tool transcript, resume/fork
  behavior, in-loop questions, and explicit session/filesystem separation.
- **The 21 pinned dossiers under `research/harnesses/`.** Retained for inspected
  coding-harness behavior, claim-level citations, adversarial limits, and the
  already-established competing-authority result. Particularly relevant here:
  `openai-codex.md` C-033–C-037, `opencode.md` C-039–C-041, `pi.md` C-034–C-037,
  `deepseek-harness.md` C-032/C-034, and `openhands.md` C-031/C-032.

All web sources were accessed 2026-08-30. Mutable “latest” documentation should
be version-pinned before it becomes qualification evidence.
