# DeepSeek Harness lessons for a complementary runtime

**Date:** 2026-08-17
**Decision frame:** what integration boundary and operational lessons should inform a complementary runtime that sits beside an existing agent harness?
**Status:** research dossier only. It is not an ADR, implementation authorization, dependency approval, deployment record, or recommendation to adopt DeepSeek Harness.
**Scope correction:** the target runtime is **not a harness**. Retrieval is its initial service, not its complete or permanent identity. Harness replacement, harness-like modularity, and duplicate orchestration are out of scope.
**Later status note:** ADR 0023 subsequently authorized only the stateless M1
implementation in `apps/runtime`; documentation-only observations in this dated
dossier describe its research baseline, not the current repository contents.

## Executive conclusion

**IDENTIFICATION — FACT (high confidence):** “DeepSeek's brand-new harness” almost certainly refers to the official [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness) project, named **DeepSeek Harness** and distributed as the `dsh` CLI. DeepSeek calls it an open-source agent harness in developer preview; the official repository was created on 2026-08-13, and the official launch page calls it the “DeepSeek Harness developer preview” [S1][S2][S3].

**RELEASE IDENTITY — FACT (high confidence):** in the official GitHub releases and tags enumeration API responses retrieved on the requested cutoff, 2026-08-17, each response contained one item: the prerelease **`dsh-v0.1.0-rc.7` / `v0.1.0-rc.7`**, published 2026-08-17 at commit [`99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`](https://github.com/deepseek-ai/deepseek-harness/commit/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca) [S4][S26][S27]. The root package at that commit reports `0.1.0-rc.7` [S5]. The **artifact** is the project; `rc.7` is the exact release snapshot observed at the cutoff. It would be imprecise to use the release name and project name interchangeably.

**BOUNDARY CONCLUSION — INFERENCE (high confidence):** the useful lesson is not “make the complementary runtime another plugin harness.” DeepSeek Harness already owns agent composition, model/tool exposure, session/turn/step lifecycle, prompt assembly, approvals, sandbox selection, subagents, and user experience. The companion should own independent domain capabilities and their durable state. A thin harness-owned adapter should translate between the harness's tool/event vocabulary and a versioned, provider-neutral runtime API. DeepSeek's shipped MCP client makes an out-of-process tools boundary immediately plausible, but its MCP bridge currently covers tools only, so MCP is not evidence that it can carry every future runtime control, event, or administration need [S6][S7].

**INITIAL INTEGRATION VERDICT — ADAPT (medium-high confidence):** preserve one canonical runtime domain API, then project only bounded end-user operations into the harness. For DeepSeek Harness specifically, a Streamable HTTP or stdio MCP tool projection is the least coupled documented seam for retrieval-style calls; use a small native plugin adapter only if exact harness lifecycle interception, richer event correlation, or presentation behavior is truly required. Do not make Cordis, DeepSeek session events, MCP tool names, or any harness SDK protocol the runtime's domain model.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. Which official DeepSeek artifact and release does the phrase identify at the cutoff?
2. What does that harness verifiably own, and what are its public extension and lifecycle seams?
3. Where should a separate complementary runtime begin and end?
4. Which contracts can connect the two without recreating the harness?
5. What security, failure, state, observability, and deployment consequences follow?

### 1.2 Method and limits

Primary evidence was preferred: DeepSeek's official organization, repository, pinned release, launch page, repository architecture and subsystem documentation, package READMEs, the Cordis paper repository, MCP specifications, and W3C Trace Context. The official repository was inspected read-only in a temporary clone at exact commit `99f6f02...`; no source was copied into this repository and no package was executed. Stable citations below use the release tag or commit where possible.

This is architecture-level, clean-room boundary research. It is not a code audit, penetration test, performance benchmark, package installation, license opinion, or compatibility certification. DeepSeek explicitly warns that the developer preview will have compatibility-breaking changes [S1]. All web sources were accessed 2026-08-17 unless a source date is separately stated.

Labels:

- **FACT** — directly supported by a cited source or exact local path.
- **INFERENCE** — a reasoned consequence, not directly promised by a source.
- **UNKNOWN** — evidence was absent, inaccessible, or insufficient.
- **ADOPT / ADAPT / REJECT / DEFER** — research disposition only; never implementation authority.

## 2. Exact artifact identification

### 2.1 Facts

- **FACT (high):** DeepSeek's official GitHub organization owns `deepseek-ai/deepseek-harness`; its description is “DeepSeek Harness: Everything is a Plugin,” and its homepage points to `deepseek.com/harness` [S2].
- **FACT (high):** the project README calls `dsh` an open-source agent harness developed by DeepSeek AI, built on Cordis, and in developer preview with compatibility-breaking changes expected [S1].
- **FACT (high):** the official launch page says model, tools, skills, sessions, sandbox, storage, loop, scheduling, and UI are plugin-composed harness capabilities [S3].
- **FACT (high):** GitHub metadata reports repository creation at `2026-08-13T11:56:32Z`; the Cordis paper draft is dated 2026-08-13 [S2][S8].
- **FACT (high):** the 2026-08-17 prerelease `rc.7` adds plugin-owned settings cards, Job Panel integration for Codex and Claude Code subagents, and durable MCP/ACP image attachments, among fixes and refinements [S4].
- **FACT (high):** the repository is MIT-licensed, with copyright 2026 DeepSeek; third-party notices are separately disclosed by the project [S1][S9]. This permits learning from documented behavior but does not remove dependency, attribution, or transitive-license review for any future adoption.

### 2.2 Likely referent and candidates

| Candidate | Classification | Evidence and verdict |
| --- | --- | --- |
| `deepseek-ai/deepseek-harness` project / developer preview | **Likely referent (high)** | Exact official name, brand-new repository date, official launch page, and direct use of “Harness” all align. **ADOPT as the research referent.** |
| `dsh-v0.1.0-rc.7` | **Exact release snapshot (high)** | Sole item in both official GitHub enumeration API responses retrieved at the cutoff, published the same day [S26][S27]. **ADOPT as the pinned evidence baseline**, not as a separate product. |
| Cordis | **Underlying candidate, rejected as referent** | Cordis is the kernel/meta-framework and linked paper, not the DeepSeek-branded harness [S3][S8]. **REJECT as phrase referent; ADAPT lifecycle lessons only.** |
| DeepSpec or earlier DeepSeek agent repositories | **Rejected candidates** | They do not match the explicit harness name or launch material. **REJECT.** |

### 2.3 Unknowns and timing caveat

- **UNKNOWN:** the precise public-launch timestamp is not stated in the retrieved launch-page body. Repository creation establishes 2026-08-13; `rc.7` publication establishes 2026-08-17, but neither alone proves when DeepSeek first announced the preview.
- **UNKNOWN:** whether package registry metadata exposed earlier release candidates that GitHub's enumeration API responses retrieved at the cutoff did not contain. This does not affect the exact GitHub release observed in those responses.
- **UNKNOWN:** whether DeepSeek intends any current TypeScript/Cordis interface to become stable. The explicit preview warning argues against assuming this.

## 3. Verified harness architecture, interfaces, and lifecycle

### 3.1 Composition and ownership

**FACT (high):** Cordis is the composition kernel. Plugins contribute services, typed events, and reversible effects to a shared context. Registrations unwind when their plugin unloads. A running `dsh` is a plugin tree assembled at boot from profile bundles and patch layers; service dependencies determine activation, and loss of a required service unloads dependents [S10][S11][S12]. The Cordis paper describes these goals as reversible effects and reactive dependency management [S8].

**FACT (high):** “everything is a plugin” does not mean “nothing owns behavior.” DeepSeek's architecture assigns concrete ownership to core services:

| Harness concern | Verified owner/interface |
| --- | --- |
| Session truth | Append-only typed `SessionEvent` log, `ctx.sessions` |
| Prompt and tool schema assembly | `ctx.systemPrompt` |
| Tool discovery/execution | Guarded `ctx.tools` registry and `tools/*` waterfall |
| Live agents | `ctx.agents`; agent-scoped contexts and lifecycle events |
| Default agent driver | `ctx.agentLoop` |
| Model routing/streaming | `ctx.llm` adapter seam |
| Files, subprocesses, sandbox, approval, subagents, jobs, UI | Separate harness services and consumers in the composed profile |

These assignments are documented in the official architecture and generated capability graph [S10][S13].

### 3.2 Turn and step lifecycle

**FACT (high):** one **step** is one model request plus its tool calls; one **turn** contains zero or more steps. The documented order is: open turn, claim inbox input, run `agent/pre-step`, append entered input, assemble prompt/tool schemas, stream the model request, append chunks and assistant message, execute calls through `tools/pre-execute` → `tools/execute` → `tools/post-execute`, append tool results, and close step/turn. Durable turn/step/message/tool facts are separate from live interception events [S10][S14].

**FACT (high):** `agent/pre-step`, `agent/request`, `llm/stream`, and the three `tools/*` events are waterfall chains whose listeners must delegate with `next()` unless intentionally intercepting. `agent/turn-stopping` is serial [S10].

**Boundary lesson — ADAPT (high):** a companion call should appear to the harness as an ordinary bounded tool/capability invocation. The companion must not open or close harness turns, drive the model, inject autonomous follow-ups, or reinterpret harness cancellation. A harness adapter may translate a call-scoped abort/deadline to the runtime, but the harness remains the lifecycle authority.

### 3.3 Durable session log and live events

**FACT (high):** the session is an append-only event log and the source of model history. “Model-visible means logged”: the model request must be reconstructable from session events. Session event envelopes carry contiguous sequence numbers, timestamps, typed data, and optional source links; unknown required event types make readers refuse reconstruction rather than silently omit semantics [S10][S15].

**FACT (high):** durable session events and live `agent/*` events have different purposes. DeepSeek tells replay consumers to use `session/event`; live coordination uses `agent/*` [S14].

**Boundary lesson — ADAPT (high):** the runtime must not treat the harness session log as its database or event bus. It should return a bounded evidence/result envelope that the harness can log as the tool result. Runtime-internal source versions, job transitions, index mutations, policy decisions, and audit events remain runtime-owned. Correlation references can link the two without dual ownership.

### 3.4 External interfaces

#### MCP tool bridge

**FACT (high):** DeepSeek's MCP client connects to external servers over stdio or Streamable HTTP and exposes discovered tools as `mcp__<serverName>__<rawName>`. It supports startup discovery, `tools/list_changed`, bounded tool calls, cancellation, reconnect/backoff, deterministic names, and generation replacement. Current limitations explicitly say **tools are the only bridged MCP capability**; resources and prompts are deferred [S6].

**FACT (high):** during an outage, the last good tool generation stays registered and calls fail until recovery; after the reconnect budget is exhausted, tools are unregistered. A Streamable HTTP endpoint may be configured with headers; stdio receives configured environment values on top of a scrubbed ambient environment [S6].

**Boundary lesson — ADAPT (medium-high):** MCP is a credible harness-to-runtime call projection for retrieval and similar request/response services. It is not the canonical runtime API and should not be stretched into administration, durable runtime event streaming, or harness control merely because it is available.

#### DeepSeek SDK JSON-RPC

**FACT (high):** DeepSeek also defines a newline-delimited JSON-RPC 2.0 protocol over stdio for **clients driving a complete harness runtime**. It exposes initialize, session prompt, shutdown, session-event/status notifications, and subagent notifications. It has no protocol-version negotiation, per-session close, per-prompt result, or prompt cancellation [S16][S17][S18].

**Verdict — REJECT (high):** this protocol faces the wrong direction for the complementary runtime. Using it would make the runtime a harness client or would encourage the runtime to own session/agent activity. It is evidence about lifecycle discipline, not the sidecar integration contract.

#### ACP

**FACT (high):** the ACP package is an automation-only adapter that creates and drives harness agents. It explicitly omits UI, transcript replay, commands, modes, configuration pickers, reasoning, plans, and titles, and its sessions are connection-owned [S19].

**Verdict — REJECT (high):** ACP is also the wrong abstraction for a domain companion. It controls agents rather than supplying runtime services to an existing harness.

#### Native Cordis plugin

**FACT (high):** a plugin can register tools, listen to typed events, consume services, and unwind registrations on unload [S10][S12].

**Verdict — DEFER / narrowly ADAPT (medium-high):** a thin plugin adapter is justified only for harness-native interception, rich presentation, or lifecycle/event correlation unavailable through MCP. Embedding domain state, indexing, scheduler logic, or a second plugin framework in that adapter would violate the corrected scope.

## 4. Clean ownership split

### 4.1 Ownership matrix

| Concern | Existing external harness owns | Complementary runtime owns | Adapter owns |
| --- | --- | --- | --- |
| Agent/model loop | Turns, steps, model requests, continuation, stopping | Nothing | No loop logic |
| Agent composition | Agents, presets, plugins, tool visibility, model-facing schemas | Service capability catalog only | Maps approved runtime operations to harness capabilities |
| User interaction | Prompt admission, approvals, questions, UI, transcript | Domain results and warnings only | Presentation mapping where needed |
| Tool execution policy | Whether/when a model may invoke a tool; harness cancellation | Domain authorization and quotas inside runtime | Propagates identity, deadline, cancellation, and policy context |
| Retrieval | Exposes a bounded retrieval tool and records returned evidence | Query planning/execution, ranking, corpus/version/provenance, provider adapters, bounds, coverage/staleness | Request/response translation only |
| Future runtime services | Selects and invokes approved services | Additional domain capabilities under the same runtime governance; exact catalog unresolved | Adds narrow projections, not orchestration |
| Durable state | Agent session/event history and model-visible results | Runtime domain records, indexes, source custody, policy/audit records, jobs | Correlation ids; no shadow database |
| Scheduling | Agent/subagent/job/workflow scheduling | Only domain-internal work scheduling needed to fulfill explicit runtime operations | Never duplicates agent scheduling |
| Sandbox/processes | Harness tool and subprocess confinement | Runtime's own process/network/filesystem confinement | Does not weaken either side |
| Secrets | Harness-side references needed to call runtime | Provider/admin credentials needed by runtime | Uses least-privilege runtime credential; never forwards ambient secrets |
| Observability | Agent/session/tool spans and events | Runtime request, provider, index, policy, and job telemetry | Correlates traces without merging authorities |
| Deployment | Harness process/profile and plugin lifecycle | Independently versioned service/process and data lifecycle | Compatibility negotiation and health reporting |

### 4.2 Retrieval is initial, not exclusive

**FACT (high, at the research baseline):** this repository independently housed retrieval architecture and was split so retrieval decisions could evolve without coupling to the OpenCode plugin, Ledger, or Loop (`apps/runtime/README.md:3-13`). The accepted/proposed status of each decision remains explicit, and ADRs 0021/0022 do not authorize crawling, corpus acquisition, or deployment (`apps/runtime/README.md:32-35`). See the later status note above for the subsequently authorized M1 implementation.

**FACT (high):** proposed ADR 0022 currently describes an installable local-first **search runtime**, one canonical provider-neutral domain API, separation of read-only query from administration, and runtime ownership of retrieval semantics and provenance (`apps/runtime/docs/decisions/0022-installable-search-runtime.md:12-42`). Its status is Proposed and not implementation authority (`:1-4,56-60`).

**SCOPE CORRECTION — INFERENCE (high):** this new frame is broader than that proposed search-specific description. Retrieval can be the first service while the companion runtime's identity remains a bounded domain runtime. Future non-retrieval services must earn their place by sharing runtime-grade concerns—state, policy, evidence, long-lived jobs, provider isolation—not merely by being “plugins.” This dossier does not amend ADR 0022 or authorize that broader product definition.

### 4.3 What must remain out

The companion runtime does **not** own:

- agents, model adapters, prompts, skills, turns, steps, or context windows;
- subagent delegation, goals, plans, approval UX, user questions, or workflows;
- harness plugin discovery/composition or a Cordis analogue;
- transcript/session replay or a mirror of `SessionEventMap`;
- general shell, editor, filesystem, terminal, or browser control;
- deciding which model may call which harness tool;
- autonomous model invocation or unsolicited context injection.

## 5. Integration contracts, events, and protocols

### 5.1 Contract layers

**Layer A — canonical runtime domain API (ADOPT as a requirement; high confidence):** a versioned API independent of DeepSeek Harness, Cordis, MCP, and any one provider. It owns runtime semantics, including stable operation names, request bounds, result/evidence envelopes, errors, capability discovery, health, and compatibility.

**Layer B — harness adapter (ADOPT as a boundary; high confidence):** the smallest harness-owned component that converts model-facing tool arguments to Layer A and converts Layer A's bounded results to the harness's tool-result format. It owns no domain state and performs no provider work.

**Layer C — optional protocol projection (ADAPT; medium-high confidence):** MCP can project selected read/execute operations as model-callable tools. An administrative API and high-volume event stream remain separate even if they share authentication or transport infrastructure.

### 5.2 Minimal operation envelope

This is a research-level contract inventory, not a schema:

| Field/class | Purpose and ownership |
| --- | --- |
| `api_version`, `capability`, `operation` | Runtime compatibility and explicit dispatch; runtime-owned |
| `request_id`, `idempotency_key` where mutation is possible | Retry/deduplication; generated or forwarded by adapter, enforced by runtime |
| `principal`, `tenant/workspace scope`, granted capabilities | Authorization context; authenticated, never inferred from a harness session id |
| `deadline`, cancellation handle | Bounds work; cancellation is advisory until runtime confirms settlement |
| operation-specific bounds | Result count, bytes, time, provider/corpus scope; runtime validates independently |
| `traceparent` / correlation id | Cross-process observability, not authentication or authorization [S23] |
| result status | `completed`, `partial`, `rejected`, `failed`, `cancelled`; do not collapse orthogonal facts |
| evidence/result payload | Bounded, versioned, explicitly untrusted where externally sourced |
| provenance and coverage | Source/version/capture identity, staleness, omissions, warnings |
| retry metadata | Stable error class, retryability, backoff hint; never raw secret-bearing failures |

**INFERENCE (high):** `request_id`, harness session id, trace id, and runtime job id are distinct identities. None proves authorization; none should be overloaded as another.

### 5.3 Runtime events

The runtime may need its own event stream for long-running work. Keep it domain-oriented:

- `operation.accepted`
- `operation.progress` (bounded/coalescible and non-authoritative)
- `operation.completed | partial | failed | cancelled`
- `capabilities.changed`
- `dataset.version.published | retired`
- `provider.degraded | recovered`
- `policy.decision` (audit stream, access-controlled)

Each event should carry runtime operation/job identity, monotonic per-stream sequence or cursor, timestamp, compatibility version, and trace correlation. Delivery semantics—at-most-once, at-least-once, resumable cursor, retention, and deduplication—remain **UNKNOWN** and must be chosen before such a stream is contractual.

**REJECT:** copying DeepSeek's `turn/*`, `step/*`, `agent/*`, `tool/*`, or `session.event` vocabulary into the runtime. Those are harness facts [S10][S14].

### 5.4 MCP projection

The MCP specification requires initialization/version and capability negotiation before normal operation, defines request timeouts and cancellation guidance, and standardizes stdio and Streamable HTTP transports [S20][S21]. Tool servers expose discovery and call operations; servers must validate inputs, enforce access control and rate limits, sanitize output, and clients should validate tool results and apply timeouts [S22].

For a DeepSeek adapter:

1. Harness MCP client initializes and discovers the runtime's **selected tool projection**.
2. Stable public operations such as bounded retrieval are exposed as tools; administrative operations are absent.
3. The adapter/runtime validates every argument and caller capability again.
4. Runtime returns structured result plus a bounded text fallback where interoperability requires it.
5. Harness records the model-visible result in its own session log.
6. Cancellation/deadline propagates; runtime reports final settlement independently.

**KNOWN DEEPSEEK LIMITS:** only MCP tools are bridged; unsupported output-schema vocabulary may be treated as unconstrained JSON; startup discovery inherits a 60-second SDK default; Streamable HTTP outage behavior differs from stdio reconnect behavior [S6]. These make health, schema compatibility, and deployment probes mandatory research questions rather than assumptions.

### 5.5 Native plugin adapter

Use only if the integration needs one of these harness-native properties:

- exact `tools/*` interception or custom guarded execution behavior;
- agent-scoped capability registration;
- richer tool-result presentation than MCP mapping provides;
- precise association with durable session events;
- lifecycle-aware unload that unregisters capability surfaces immediately.

Even then, the plugin should be a protocol client. DeepSeek's reversible registrations are a useful adapter lifecycle model, not a reason to move the runtime in-process [S10][S12].

### 5.6 Compatibility and negotiation

**FACT (high):** DeepSeek's preview promises breaking changes, and its SDK protocol currently has no protocol-version negotiation [S1][S16]. MCP does negotiate protocol versions and capabilities [S20].

**ADOPT (high):** the runtime boundary needs explicit semantic/API version negotiation, capability discovery, and a compatibility matrix independent of package versions. On incompatibility, fail closed with a stable diagnostic; never silently reinterpret fields or downgrade authorization.

## 6. Security and trust boundaries

### 6.1 Trust map

```text
untrusted user/model/tool arguments
  -> harness policy + model-facing schema
  -> thin adapter (authenticated principal, bounds, deadline)
  -> runtime authorization and validation
  -> provider/index/network adapters
  -> untrusted external documents/provider output
  -> runtime normalization, provenance, bounds, redaction
  -> adapter result mapping
  -> harness durable tool result and model context
```

Every arrow is a validation boundary. The adapter's acceptance does not waive runtime checks, and a successful runtime call does not make retrieved content trusted instructions.

### 6.2 Required separations

- Query/read capability is separate from corpus/provider/admin mutation. This follows the local constitution's provider-neutral and untrusted-result requirements (`apps/runtime/AGENTS.md:7-10`) and proposed ADR 0022's read/admin separation (`apps/runtime/docs/decisions/0022-installable-search-runtime.md:22-29`).
- Runtime credentials are audience-bound and least privilege. Do not pass harness/model/provider tokens through to downstream systems. Current MCP security guidance explicitly rejects token passthrough and warns about confused-deputy and SSRF risks [S24].
- Session ids are not authentication. MCP security guidance says sessions must not be used for authentication and recommends secure unpredictable ids [S24].
- A local HTTP service binds to loopback by default, validates `Origin`, and authenticates requests; these are explicit MCP Streamable HTTP security requirements/recommendations [S21].
- A stdio sidecar receives a scrubbed, allowlisted environment and dedicated working/data directories. DeepSeek documents scrubbed ambient env for its MCP stdio bridge and separately warns against handing untrusted output ambient credentials or predictable files [S6][S25].
- External URLs, redirects, DNS resolution, private/link-local ranges, and cloud metadata access need egress policy. Retrieval's fetch authority must never be inferred from arbitrary model-provided URLs [S24].
- Results, logs, traces, and errors are bounded and redacted. No raw credential, authorization header, full prompt, private document, or provider response is telemetry by default.

### 6.3 Approval and action authority

**FACT (high):** MCP tools are model-controlled, but the MCP tool specification recommends human visibility and confirmation for sensitive operations [S22].

**INFERENCE (high):** the companion should not implement a second approval UI. The harness owns user interaction and decides whether a model-facing invocation may proceed. The runtime independently enforces authorization and policy; it may return “approval/elevation required,” but the adapter maps that to the harness's existing approval mechanism. Runtime completion never grants the model new action authority.

## 7. Failure isolation, observability, state, and deployment

### 7.1 Failure isolation

**ADAPT (high):** use a process boundary so runtime crashes, provider failures, memory pressure, and index corruption cannot directly corrupt the harness event loop or session store. A sidecar/process can be restarted independently, but “sidecar” must not imply same lifecycle, same privileges, or shared filesystem.

Required behavioral distinctions:

- transport unavailable vs runtime rejected vs provider unavailable vs partial result;
- deadline elapsed vs caller cancelled vs runtime completed after cancellation;
- stale capability discovery vs operation/schema incompatibility;
- empty valid result vs absent corpus/index vs coverage-limited result;
- transient provider degradation vs authoritative domain-state corruption.

DeepSeek's own defensive guidance says orthogonal outcomes should be reported independently and teardown must await quiescence, not merely request cancellation [S25]. The MCP lifecycle similarly recommends request timeouts and stdio close → TERM → KILL shutdown [S20].

**REJECT:** automatic retries of non-idempotent operations, infinite reconnect, fail-open authorization, or turning runtime failure into a harness/model-loop crash.

### 7.2 Observability

The harness should record one adapter/tool span and its harness events; the runtime should record server/worker/provider/index spans and domain events. Propagate W3C `traceparent`/`tracestate` over HTTP; W3C standardizes these headers for cross-service trace correlation and warns they are not for PII or sensitive data [S23].

Minimum correlation set:

- trace id and adapter span id;
- runtime request/operation/job id;
- harness-neutral caller/workspace pseudonymous scope;
- operation and capability version;
- bounded latency, bytes, result count, cache/staleness, provider class;
- terminal/partial/cancelled/retry facts;
- redacted policy decision code.

**REJECT:** copying complete harness prompts, chain-of-thought/reasoning, session logs, document bodies, query credentials, or provider secrets into runtime telemetry. Trace context is correlation, not a data transport or identity token.

### 7.3 State ownership and consistency

- Harness session log: authoritative for what the agent/model saw and did.
- Runtime domain store: authoritative for corpus/source versions, provider records, indexes, operations/jobs, policy/audit facts, and future domain services.
- Query indexes/caches: rebuildable projections, not the sole source of custody/provenance truth.
- Adapter: stateless apart from bounded connection/discovery state; no shadow session or result database.

**INFERENCE (high):** there is no cross-process transaction spanning harness append and runtime completion. Use stable operation/result identity and idempotent replay-safe reads. If a runtime call completes but the harness cannot log the result, the runtime record remains valid but not model-visible; the harness may retry a safe read by operation id. Do not fabricate a session event retrospectively without harness authority.

### 7.4 Deployment implications

| Profile | Benefits | Risks / conditions | Verdict |
| --- | --- | --- | --- |
| Harness-spawned stdio service | Private point-to-point channel, simple local ownership, no listening port | Harness process may inherit lifecycle/privilege burden; stdout purity; one process per client unless designed otherwise | **ADAPT for narrow local tool projection** |
| Independently supervised local HTTP runtime | Reusable across harnesses/clients; independent restart/data lifecycle | Auth, Origin validation, loopback binding, port/version discovery, multi-client quotas | **ADOPT as leading companion topology, pending decisions** |
| In-process plugin | Deep lifecycle integration, no network hop | Shared crash/memory/privilege/upgrade domain; encourages harness coupling | **REJECT for runtime; allow thin adapter only** |
| Remote shared service | Central operations and scale | Tenant isolation, auth, data residency, egress, availability, cost, incident response | **DEFER** |

Runtime and harness release cadences must be independent. Installation must declare ports/socket/process ownership, data paths, schema migration and rollback, backup/restore, compatibility probes, health/readiness, credential revocation, and uninstall retention. None is authorized here.

## 8. Anti-goals

1. **No harness replacement.** Do not recreate model loops, prompts, agents, skills, tools registry, session replay, UI, or approvals.
2. **No orchestration duplication.** Do not add agent DAGs, subagent scheduling, goals, planning, workflow engines, or background-agent control.
3. **No harness-like modularity goal.** A stable runtime service boundary is necessary; “everything is a plugin” is not a target requirement.
4. **No DeepSeek lock-in.** DeepSeek/Cordis events and package types do not enter the runtime domain API.
5. **No MCP-as-domain-model.** MCP is an optional projection for selected operations, not runtime semantics or administration.
6. **No search-only product claim.** Retrieval is the initial capability; future services require a separately declared frame and authority.
7. **No shared authoritative state.** Harness sessions and runtime domain records link by identity but do not mirror or co-own each other.
8. **No ambient authority.** Neither model output nor retrieved content gains credentials, filesystem/network scope, or admin rights.
9. **No silent autonomy.** The runtime does not initiate agent turns or inject context without a caller request and explicit harness authority.
10. **No implementation implication.** This dossier changes no ADR status and authorizes no code, package, corpus, provider call, or deployment.

## 9. Lessons and dispositions

| DeepSeek observation | Companion-runtime verdict | Rationale |
| --- | --- | --- |
| Explicit service/event ownership | **ADOPT conceptually** | Forces one authority per concern without copying Cordis. |
| Reversible plugin effects and dependency-aware unload | **ADAPT in thin adapter lifecycle** | Useful for clean registration teardown; not a runtime architecture mandate. |
| Append-only reconstructable model-visible log | **ADAPT at boundary** | Harness logs what model sees; runtime keeps separate domain audit/provenance. |
| Durable vs live event distinction | **ADOPT conceptually** | Prevents progress notifications from becoming authoritative facts. |
| Guarded tool pipeline | **ADOPT as harness responsibility** | Runtime independently authorizes domain operations; no second model-tool registry. |
| MCP stdio/HTTP bridge | **ADAPT for selected runtime operations** | Existing documented seam, but tools-only and preview-unstable. |
| SDK JSON-RPC and ACP agent-driving protocols | **REJECT for sidecar integration** | Wrong ownership direction; they drive harness agents. |
| Cordis “everything is a plugin” | **REJECT as target runtime principle** | User explicitly excludes harness-like modularity; stable service contracts suffice. |
| Session/agent event vocabulary | **REJECT outside adapter** | Harness-specific lifecycle must not contaminate runtime semantics. |
| Independent process and quiescent teardown discipline | **ADOPT conceptually** | Bounds blast radius and orphan work. |
| DeepSeek package/code adoption | **DEFER** | Preview churn, fit, dependency, security, and license review remain undone. |

## 10. Unresolved research questions

### Artifact and DeepSeek integration

1. Which DeepSeek interfaces are intended to stabilize after developer preview, and on what timeline?
2. Does `dsh-mcp-client` expose enough error, cancellation, identity, trace, and presentation metadata for the desired retrieval contract?
3. How does DeepSeek authenticate Streamable HTTP MCP endpoints in real deployments beyond static configured headers?
4. Can a DeepSeek native adapter project runtime trace context without modifying harness session semantics?
5. What exact schema subset does DeepSeek's MCP output validation support, and how are unsupported schemas surfaced to operators?

### Companion runtime

6. What is the runtime's product-level capability taxonomy beyond retrieval? **Unknown by design; requires caller authority and a new frame.**
7. Which operations are synchronous request/response, which become durable jobs, and what are their cancellation and idempotency contracts?
8. What is the canonical domain API transport: local HTTP, Unix socket/named pipe, or another IPC? MCP must remain a projection.
9. What principal, tenant/workspace, and capability model crosses from each supported harness?
10. What is the event delivery/retention model, and which events are authoritative versus progress-only?
11. How are runtime operation records linked to harness tool results without storing sensitive session content?
12. Which data is authoritative, rebuildable, cached, quarantined, or deletable, and what are backup/restore obligations?
13. What local supervisor owns runtime startup, readiness, upgrades, rollback, and uninstall when multiple harnesses share it?
14. What are the hard request/result/job/storage/resource bounds and degradation policy?
15. Which non-MCP adapter is required for harnesses whose MCP support cannot carry the contract faithfully?

## 11. Bounded curiosity pass

After initial synthesis, candidate gaps were scored 1–5 for relevance (R), decision value (V), novelty (N), and research cost (C); priority is `(R + V + N) - C`.

| Thread | R | V | N | C | Score | Action |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Verify exact release/tag/commit and project creation | 5 | 5 | 4 | 1 | 13 | **Pursued:** GitHub repo, release and tag enumeration APIs, release page, and package version triangulated. |
| Check MCP bridge lifecycle and limitations | 5 | 5 | 4 | 2 | 12 | **Pursued:** official package README plus MCP specification. |
| Distinguish agent-driving SDK/ACP from service-supplying boundary | 5 | 5 | 3 | 2 | 11 | **Pursued:** protocol/client/server/ACP primary docs. |
| Read Cordis paper for the “everything is a plugin” rationale | 3 | 3 | 3 | 1 | 8 | **Pursued:** enough to separate transferable lifecycle ideas from rejected modularity. |
| Benchmark DeepSeek Harness or run it locally | 2 | 2 | 2 | 5 | 1 | **CURIOSITY_NO_GO:** outside architecture boundary and would add execution/dependency risk. |
| Inspect all source implementation paths | 2 | 2 | 2 | 5 | 1 | **CURIOSITY_NO_GO:** official architecture and package contracts reached saturation; no code-audit mandate. |
| Design the complete future non-retrieval service catalog | 3 | 4 | 4 | 5 | 6 | **CURIOSITY_NO_GO:** scope and caller authority absent; would invent product requirements. |
| Compare every agent harness | 1 | 2 | 2 | 5 | 0 | **CURIOSITY_NO_GO:** frame is DeepSeek boundary lessons, not market comparison. |
| Draft ADR or implementation plan | 1 | 1 | 1 | 3 | 0 | **CURIOSITY_NO_GO:** explicitly unauthorized. |

**Stop condition:** coverage and saturation. The official architecture, lifecycle, durable/live events, MCP, SDK, ACP, security, and exact release identity answer the bounded questions. Remaining gaps require product decisions, implementation experiments, or post-preview evidence rather than more same-frame browsing.

## 12. Source ledger

All sources accessed 2026-08-17.

| ID | Publisher | Date | Source type | Claim supported |
| --- | --- | --- | --- | --- |
| S1 | DeepSeek AI | repository state at `rc.7` | [Official README, pinned tag](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/README.md) | Product identity, developer preview, Cordis basis, run/distribution, MIT notice. |
| S2 | DeepSeek AI / GitHub | metadata current at access | [Official repository API](https://api.github.com/repos/deepseek-ai/deepseek-harness) | Ownership, creation/push times, description, homepage, default branch, license metadata. |
| S3 | DeepSeek AI | 2026 | [Official launch page](https://deepseek.com/harness/) | Developer preview; harness owns plugin-composed model/tool/skill/session/sandbox/storage/loop/scheduling/UI capabilities; run modes. |
| S4 | DeepSeek AI / GitHub | 2026-08-17 | [Official `rc.7` release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.0-rc.7) | Exact release/tag/commit and release contents. |
| S5 | DeepSeek AI | commit 2026-08-17 | [Pinned root package](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/package.json) | Root version `0.1.0-rc.7`, package manager/engine and repository scripts. |
| S6 | DeepSeek AI | `rc.7` | [MCP client README](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/packages/mcp/mcp-client/README.md) | stdio/HTTP transport, naming, discovery, reconnect, cancellation, security/environment behavior, tools-only limitations. |
| S7 | DeepSeek AI | `rc.7` | [Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/docs/architecture.md) | Composition, core services, events, turn flow, session log, extension points. |
| S8 | Cordis authors / cordiverse | draft 2026-08-13 | [Paper repository](https://github.com/cordiverse/paper) | Reversible effects, reactive dependencies, dynamic composition, active-revision caveat. |
| S9 | DeepSeek AI | 2026 | [MIT license](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/LICENSE) | License text and copyright. |
| S10 | DeepSeek AI | `rc.7` | [Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/docs/architecture.md) | Plugin tree, profiles/bundles, event taxonomy, waterfall flow, ownership. |
| S11 | DeepSeek AI | `rc.7` | [Cordis services tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/docs/cordis-tutorial/03-services.md) | Service dependency activation, unload/reload, provider replacement. |
| S12 | DeepSeek AI | `rc.7` | [Cordis lifecycle tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/docs/cordis-tutorial/02-lifecycle-and-effects.md) | Reversible registrations, plugin unload, async disposal. |
| S13 | DeepSeek AI | `rc.7` | [Generated capability graph](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/docs/capability-seams.md) | Service definitions/providers/consumers and major harness capability ownership. |
| S14 | DeepSeek AI | `rc.7` | [Agent lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/docs/agent-lifecycle.md) | Exact turn/step/tool sequence and durable-vs-live consumer guidance. |
| S15 | DeepSeek AI | `rc.7` | [Session subsystem](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/docs/subsystems/session.md) | Append-only source of truth, event envelope, required unknown-event behavior. |
| S16 | DeepSeek AI | `rc.7` | [SDK protocol README](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/packages/sdk/protocol/README.md) | JSON-RPC methods/notifications and missing version/cancel/session-close capabilities. |
| S17 | DeepSeek AI | `rc.7` | [SDK client README](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/packages/sdk/client/README.md) | SDK drives a complete harness subprocess; activity interval and teardown semantics. |
| S18 | DeepSeek AI | `rc.7` | [SDK server README](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/packages/sdk/server/README.md) | Agent-driving server direction, stdout protocol, shutdown, no per-prompt result. |
| S19 | DeepSeek AI | `rc.7` | [ACP README](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/packages/acp/acp/README.md) | ACP is automation transport driving agents, deliberately limited, connection-owned lifecycle. |
| S20 | Model Context Protocol project | protocol 2025-06-18 | [Lifecycle specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle) | Initialization/capability/version negotiation, shutdown, timeout and cancellation guidance. |
| S21 | Model Context Protocol project | protocol 2025-06-18 | [Transport specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports) | stdio and Streamable HTTP, stdout purity, Origin/loopback/auth requirements, sessions and redelivery. |
| S22 | Model Context Protocol project | protocol 2025-06-18 | [Tools specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) | Tool discovery/call/result schemas, untrusted annotations, validation/access/rate-limit/output requirements. |
| S23 | W3C | Recommendation 2021-11-23 | [Trace Context](https://www.w3.org/TR/trace-context/) | Cross-service trace propagation, identifiers, privacy/security constraints. |
| S24 | Model Context Protocol project | current page at access | [Security best practices](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices) | Confused deputy, token passthrough, SSRF, session hijacking, local-server and stdio risks. |
| S25 | DeepSeek AI | `rc.7` | [Defensive patterns](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/docs/defensive-patterns.md) | Orthogonal outcomes, async lifecycle interpretation, quiescent teardown, callback isolation, scrubbed env/private files. |
| S26 | DeepSeek AI / GitHub | response at 2026-08-17 access | [Official releases enumeration API (`per_page=100`)](https://api.github.com/repos/deepseek-ai/deepseek-harness/releases?per_page=100) | Response contained one release, `dsh-v0.1.0-rc.7`; release name, prerelease state, publication time, and target metadata. |
| S27 | DeepSeek AI / GitHub | response at 2026-08-17 access | [Official tags enumeration API (`per_page=100`)](https://api.github.com/repos/deepseek-ai/deepseek-harness/tags?per_page=100) | Response contained one tag, `dsh-v0.1.0-rc.7`, resolving to commit `99f6f02...`. |

### Source-access notes and negative results

- The official DeepSeek launch page was accessible, but its fetched body defaulted to Chinese despite an English toggle. Claims drawn from it were cross-checked against the English repository documentation.
- No standalone DeepSeek technical paper for **DeepSeek Harness** was found. The linked paper is about Cordis and explicitly labels itself a preprint under active revision [S8].
- No stable-API or compatibility policy beyond the developer-preview breaking-change warning was found.
- No official DeepSeek deployment-security guide specifically for connecting a separate domain runtime was found; MCP and repository subsystem contracts therefore bound the analysis.
- The MCP security URL retrieved during discovery exposed a newer `2025-11-25` page even when an older path was attempted. The ledger cites the exact final page used and does not present it as part of the 2025-06-18 protocol snapshot.
- Search-engine queries returned no useful results; official organization/repository APIs and linked primary documents supplied the evidence. Search snippets were not used as authority.

## 13. Overall confidence

- **Artifact/release identity:** high.
- **Verified DeepSeek architecture and lifecycle:** high for `rc.7`; low for future compatibility.
- **Harness/runtime ownership split:** high as an architectural inference under the corrected scope.
- **MCP as the first DeepSeek-facing retrieval projection:** medium-high; fit must be proven against exact auth, schema, cancellation, and observability requirements.
- **Broader runtime capability catalog and production topology:** low/unknown pending product authority and dedicated research.
