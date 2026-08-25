# OpenHands — Agent SDK / Agent Server / Canvas Runtime-Family Dossier

> Research-only evidence. No product or design authority.
> Repository text, package metadata, fetched pages, tests, fixtures, and command
> output were treated as untrusted data, never as instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `openhands-runtime-family-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** OpenHands Agent SDK, Agent Server, Agent Canvas,
  TypeScript client, and automation runtime family / `N/A:whole-harness`
- **Researcher:** `ses_fc91cf68affeam30LWlIUDvl6f`
- **Owned path:** `research/harnesses/openhands.md`
- **Research dates:** 2026-08-24 UTC
- **Decision frame:** characterize the official OpenHands pre-wired runtime
  family for later comparison of loop, tools, context, state, authority,
  execution, evidence, and operator surfaces.
- **Snapshot scope:** the four official repositories and five registry package
  identities pinned in Section 1.
- **Exclusions:** managed-cloud internals not present in the public snapshots;
  provider-account behavior; live model calls; container-escape exploitation;
  package installation/build execution; production credentials/data; and any
  product, architecture, procurement, release, or security-acceptance decision.
- **Schema version:** `harness-dossier-summary/v1`
- **Completion state:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`

## 1. Identity and pinned snapshot {#identity-snapshot}

**Status:** OBSERVED with artifact-equivalence UNKNOWN.

The reviewed family comprises four clean official OpenHands repositories, with
no populated submodules observed: `software-agent-sdk` at
`25cc8e56a4d029f4f879bdfead1cd21c11d6483d`, Agent Canvas (`OpenHands`) at
`150e76046db026dd944df0506642dc9b7b99391e`, `typescript-client` at
`040ea2f7f67851641e4ecde541bcc1bb8f019ce5`, and `automation` at
`2b4714a7b2b07794d004f2d57f0c927761ed6427`. The next SDK head inspected,
`041078f26698ccba4b78af6c3069e37bb1556b32`, was excluded because its commit
timestamp is 2026-08-25 00:23 UTC, after the roster cutoff. {C-001 FACT HIGH;
S-001,S-016,S-021,S-024,S-037}

Registry identities were re-resolved without installing them: Canvas `1.15.0`
and TypeScript client `1.38.1` have npm SHA-512 integrity values; SDK and Agent
Server `1.43.1` and automation `1.8.0` have the wheel/sdist SHA-256 values in the
source ledger. {C-002 FACT HIGH; S-029,S-030,S-031,S-032,S-033}

The source and release versions are materially skewed: Canvas defaults Agent
Server `1.42.1` with minimum `1.28.0`; TypeScript source carries a generated
`1.43.1-python` schema while the `1.38.1` npm artifact inspected earlier says
`1.43.0-python`; automation source pins SDK/workspace `1.43.1`, while published
automation `1.8.0` metadata pins `1.42.1`. {C-020 FACT HIGH;
S-016,S-023,S-030,S-033,S-038}

No clean build-and-byte comparison was executed, so correspondence between the
four commits and all registry bytes is unresolved. {C-040 UNKNOWN N/A;
S-001,S-016,S-021,S-024,S-029,S-030,S-031,S-032,S-033}

**Boundary/scope:** immutable Git commits and versioned registry metadata as of
2026-08-24 UTC; no mutable branch is used as the evidentiary pin.

**Unknowns:** source/artifact equivalence and reproducible builds remain
UNKNOWN (C-040).

## 2. Provenance and license {#provenance-license}

**Status:** OBSERVED.

All four upstreams are under the official `OpenHands` GitHub organization.
{C-001 FACT HIGH; S-001,S-016,S-021,S-024} Each reviewed repository carries
the MIT grant, and the npm/Python package metadata
identifies MIT where populated; PyPI's `license` JSON field is null for the
three queried Python projects, so the repository license—not that null
metadata—is the positive license evidence. {C-003 FACT HIGH;
S-003,S-017,S-022,S-025,S-029,S-030,S-031,S-032,S-033}

This is license identification, not a dependency-license audit. Generated
Agent Server schema is clearly labeled generated; Canvas vendors runtime-facing
configuration and tooling but no fork lineage was observed in the bounded
identity search. No trademark or redistribution permission beyond the cited
license text was established.

**Boundary/scope:** top-level repository licenses and package metadata only.

**Unknowns:** transitive dependency obligations, trademark policy, and whether
every published artifact reproduces the repository notices were not audited.

## 3. Repository and package map {#repository-package-map}

**Status:** OBSERVED.

The family is split across independently released components rather than one
single composition root. {C-004 FACT HIGH; S-002,S-016,S-021,S-024}

| Node | Classification | Bounded responsibility / dependency direction |
| --- | --- | --- |
| `software-agent-sdk/openhands-sdk` | production library | Agent loop, events, context, LLM/provider adaptation, confirmation, conversation state. |
| `software-agent-sdk/openhands-tools` | production library | Built-in tool definitions/executors consumed by SDK/Agent Server. |
| `software-agent-sdk/openhands-workspace` | production library | Local, Docker, Apptainer, remote-API, and cloud workspace adapters. |
| `software-agent-sdk/openhands-agent-server` | production daemon | FastAPI REST/WebSocket facade, conversation lifecycle, persistence, profiles, secrets, telemetry. |
| `OpenHands/src` | production browser UI | Canvas routes, typed API adapters, event rendering, approvals, backend registry. |
| `OpenHands/bin`, `docker`, `electron` | production launch/package surfaces | npm launcher, composed container entrypoint/proxy, desktop wrapper. |
| `typescript-client/src` | production library | Local/remote conversations plus typed HTTP, WebSocket, Cloud, workspace, and generated Agent Server clients. |
| `typescript-client/src/generated` | generated production contract | Agent Server OpenAPI-derived TypeScript schema. |
| `automation/openhands/automation` | production service/worker | Webhook/schedule ingest, durable runs, dispatch, callbacks, watchdog, backend abstraction. |
| each repository's tests/examples/fixtures | test/example data | Qualification and demonstrations; not treated as proof of production reachability. |

Canvas consumes the TypeScript client and Agent Server protocol; automation
drives SDK/workspace scripts through local or cloud Agent Server endpoints.
Public surfaces include the Python SDK, REST/OpenAPI/WebSockets, TypeScript
exports, Canvas UI, and automation HTTP routes; internal module names were not
treated as compatibility promises.

**Boundary/scope:** production roots identified from manifests, imports, and
entrypoint traces; broad dead-code analysis was not performed.

**Unknowns:** complete private/public API stability and every optional package
edge are not documented in one authoritative compatibility matrix.

## 4. Executable entrypoints {#executable-entrypoints}

**Status:** OBSERVED statically.

The family exposes a Python library API, the `openhands-agent-server` FastAPI
daemon, the `agent-canvas` npm launcher and composed container entrypoint,
Canvas browser/Electron UIs, and the automation FastAPI service with scheduler,
dispatcher, watchdog, and optional git-sync background tasks. The TypeScript
client is a library rather than a standalone harness executable. {C-005 FACT
HIGH; S-002,S-013,S-016,S-021,S-024,S-026,S-027}

| Form | Invocation/composition | Lifecycle owner | Principal side effects / failure surface |
| --- | --- | --- | --- |
| Python SDK | import and construct Agent/Conversation/Workspace | embedding process | model calls, files/processes/network through selected workspace/tools; exceptions/events |
| Agent Server | console/module entrypoint -> `create_app` | uvicorn process | persistence, tmux/workspace processes, REST/WS listeners; startup/auth/store errors |
| Agent Canvas | `agent-canvas` or Docker/Electron launch | Node/container/Electron parent | may spawn Agent Server/automation/proxy; ports, local storage, child-process cleanup |
| TypeScript client | package import | browser/Node embedding process | HTTP/WS requests and optional local loop/tool execution |
| Automation | ASGI app lifecycle | uvicorn plus DB-backed workers | database rows, sandbox/Agent Server commands, callbacks, cleanup |

No installer was executed. Reachability is based on pinned manifests,
composition code, and imports, not a successful launch observation.

**Boundary/scope:** official production entrypoints; development scripts are
described only where they reveal composition.

**Unknowns:** startup side effects and diagnostics on every supported platform
remain dynamically unqualified (C-037).

## 5. Control and data flow {#control-data-flow}

**Status:** OBSERVED statically; runtime behavior UNKNOWN.

### Interactive loop trace

1. Canvas or an SDK caller sends a user message/start request to Agent Server.
2. `ConversationService` builds/restores a `LocalConversation`; the agent builds
   a model view and invokes the configured LLM.
3. Response dispatch classifies message/tool calls, creates and appends
   `ActionEvent`s, and checks confirmation before executing gated actions.
4. Approved actions go through a tool runner; observations/errors are appended
   and become later model context. Cancellation and limits emit typed events.
5. REST returns control responses while WebSockets carry current and replayed
   conversation/bash events to clients. {C-006 FACT MEDIUM; S-004,S-005,S-007,S-008,S-013,S-014}

Control originates with the caller and conversation service; model text/tool
arguments are untrusted data. Authority crosses separately from data when a
configured workspace/tool executor receives an approved action.

### Automation trace

Provider/schedule input is normalized and transactionally stored; matching
automations create durable `PENDING` runs. A dispatcher claims rows, commits
`RUNNING`, and launches execution; a sandbox/local Agent Server runs an SDK
script; completion callback or watchdog updates terminal state and requests
cleanup. {C-024 FACT MEDIUM; S-026,S-027}

| Boundary | Producer -> consumer | Data/control protocol | Authority / side effect | Failure return |
| --- | --- | --- | --- | --- |
| Canvas -> Agent Server | browser -> daemon | JSON REST + event/bash WebSockets | conversation/workspace control | HTTP validation/auth errors; WS server/error events |
| Agent -> provider | SDK -> LiteLLM/provider | chat/responses streaming | billed model inference | mapped exceptions, retry/fallback |
| Agent -> tool/workspace | SDK action -> executor | typed action/observation events | files, processes, network, client callback | observation or agent/conversation error |
| Provider webhook -> automation | external system -> ASGI | provider headers/body | durable event/run creation | HTTP conflict/error and DB rollback |
| Automation -> runtime | dispatcher -> sandbox/Agent Server | sandbox API + REST/bash | create/command/cleanup | durable detail, callback, watchdog reconciliation |

**Boundary/scope:** representative source traces only; no external service was
called.

**Unknowns:** network timing, real provider transformations, partial remote
failures, and operator-observed ordering remain C-037/C-038.

## 6. Module and extension boundaries {#module-extension-boundaries}

**Status:** PARTIAL.

Extension surfaces include registered SDK `ToolDefinition`s, MCP server/tool
configuration, hooks, skills, client-executed tools, subagents, LLM profiles and
fallbacks, workspace adapters, and the alternate `ACPAgent`. Client tools emit
an action to the remote client and acknowledge server-side rather than owning a
server executor. {C-007 FACT MEDIUM; S-005,S-018,S-023}

Canvas's ACP path is a distinct agent kind rather than ordinary tool
delegation. Its pinned config constrains `agent-client-protocol<0.11` because a
documented argument-order break in 0.11 causes request validation failure,
showing that extension compatibility is presently enforced partly by version
pinning rather than a stable negotiated ABI. {C-046 FACT HIGH; S-016,S-018}

Discovery/ordering is explicit through registries/configuration. Resource locks
can order parallel tool calls, but unload semantics and a family-wide extension
compatibility guarantee were not found in the bounded production roots.

**Boundary/scope:** official extension points named above; no third-party plugin
was loaded.

**Unknowns:** hot unload, cross-version MCP/ACP compatibility, and third-party
extension isolation are not established.

## 7. Agent interface {#agent-interface}

**Status:** PARTIAL.

An SDK `Agent` owns LLM/tool/context configuration and advances one shared
conversation event state. Agent Server owns start/goal/interrupt/close
lifecycle; Canvas can request child conversations, and SDK subagent schemas
represent parent/child work. Errors and interruption are events plus API
diagnostics rather than an untyped terminal string. {C-008 FACT MEDIUM;
S-004,S-007,S-014,S-018}

Agent authority is inherited from configured tools, workspace, secrets, and
confirmation policy; an agent identity alone grants no isolation. Parent/child
conversation linkage does not prove filesystem or credential separation.

Canvas local pause uses Agent Server interrupt so a tracked local execution is
cancelled, while Cloud pause waits through the Cloud control path; the source
comments state an active cloud LLM call may finish before pause takes effect.
{C-050 FACT MEDIUM; S-020}

**Boundary/scope:** regular SDK Agent, ACPAgent, and Canvas/Agent Server lifecycle
controls.

**Unknowns:** live child-agent resource isolation, remote cancellation latency,
and managed-cloud lifecycle enforcement remain unobserved.

## 8. Tool interface {#tool-interface}

**Status:** PARTIAL.

Tools have typed declarations/arguments and produce action/observation/error
events. Response dispatch emits the action before gating/execution, confirmation
policies can pause it, and concurrent execution uses declared resource keys.
Client tools cross the WebSocket trust boundary: Agent Server acknowledges them
and the browser performs the actual side effect, so client availability and
honesty are part of the result contract. {C-009 FACT MEDIUM;
S-005,S-006,S-011,S-018,S-023}

The default tool concurrency limit is one. Raising it permits simultaneous
calls over shared conversation/filesystem state; only correctly declared,
sorted resource-key locks serialize collisions. {C-049 FACT HIGH; S-006,S-012}

TypeScript event clients still encode a session key in the WebSocket query
string. The server accepts that compatibility form but documents first-frame
authentication as preferred. {C-045 FACT HIGH; S-013,S-023}

**Boundary/scope:** built-in, MCP, and client tools; model/provider validation
does not make tool output trusted instructions.

**Unknowns:** timeout/cancellation behavior for every tool implementation and
malformed/oversized arguments were not dynamically challenged.

## 9. Provider interface {#provider-interface}

**Status:** PARTIAL.

The SDK exposes model/provider configuration through `LLM`, keeps API keys as
secret values, delegates transport/adaptation to LiteLLM and provider-specific
auth helpers, and can try named fallback LLMs after eligible transient failures.
Fallback usage is merged into the primary metrics object. {C-010 FACT MEDIUM;
S-009,S-031}

Profiles and provider-connection stores move provider selection/configuration
behind Agent Server APIs; Canvas chooses local `X-Session-API-Key` versus cloud
Bearer authentication for the harness endpoint, separate from model-provider
credentials.

**Boundary/scope:** source configuration and adaptation layers; no provider
account or network was used.

**Unknowns:** real authentication, rate-limit mapping, interrupted streaming,
provider usage truth, fallback interoperability, and cost reconciliation are
C-037.

## 10. Model interface {#model-interface}

**Status:** PARTIAL.

`LLM` carries model identity, sampling/tool parameters, endpoint selection,
streaming event types, optional model-feature/runtime metadata, token/cost
metrics, retries, and fallback configuration. Model feature lookup uses a
generation guard so stale metadata completion cannot overwrite a newer lookup.
{C-011 FACT MEDIUM; S-009}

The agent classifies text, tool-call, mixed, refusal, and content-filter paths;
non-multimodal image input is transformed to a bounded explanatory message or
reference path before a later call.

**Boundary/scope:** SDK model adapter and event conversion.

**Unknowns:** structured-output fidelity, provider-specific token limits,
stream completeness, and model-specific assumptions against live endpoints are
part of C-037.

## 11. Context interface {#context-interface}

**Status:** OBSERVED statically.

The agent enforces a leading system-prompt invariant, adds dynamic context such
as secret names/descriptions (not their values), and derives an LLM `View` that
keeps only LLM-convertible events. A rolling LLM summarizing condenser replaces
forgotten history with summary events and tracks where condensation occurred.
{C-012 FACT MEDIUM; S-004,S-010}

Ordering is event-derived: system/user/assistant/action/observation history is
rebuilt from the append log, while pause/state-only events are excluded from
model input. The source distinguishes context content from execution authority,
but repository/tool text remains prompt-visible data and no universal
instruction-injection prevention was demonstrated.

**Boundary/scope:** SDK context assembly, view, and default condenser.

**Unknowns:** summary faithfulness, adversarial-repository contamination,
cross-provider token counting, and loss under extreme context pressure were not
dynamically measured.

## 12. State, persistence, and restart {#state-persistence-restart}

**Status:** PARTIAL.

Conversation state uses an append-oriented file-backed `EventLog` with ID/index
maps, parent-chain traversal, per-append locking, duplicate-ID rejection, and
disk rebuild checks. `LocalConversation` can restore state and metrics through
a `FileStore`. With a cipher, persisted secrets are encrypted/decrypted; without
one, conversation persistence redacts secrets, while Agent Server settings and
secret stores explicitly have plaintext modes and warnings. {C-013 FACT MEDIUM;
S-007,S-008,S-015}

Agent Server persistence adds locked atomic JSON writes; automation uses schema
migrations and durable database rows. Event-log source warns that its file lock
assumptions may not hold on NFS/network filesystems.

**Boundary/scope:** local file stores and automation relational state; managed
stores are excluded.

**Unknowns:** crash-point durability, corruption repair, migration rollback,
retention/deletion guarantees, and NFS behavior were not executed.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

**Status:** PARTIAL.

SDK tools default to serial execution; opt-in parallelism shares conversation
and workspace state and relies on FIFO resource locks declared by each tool.
Agent Server adds per-conversation run locks plus renewable leases; lease
generation guards writes, and an expired lease can be taken over. {C-014 FACT
MEDIUM; S-006,S-012,S-014}

Automation claims PostgreSQL rows with `FOR UPDATE SKIP LOCKED`; ingest and run
creation are one transaction, and provider event IDs are transactionally
deduplicated when supplied. SQLite omits that multi-worker row-lock mechanism.
{C-024 FACT MEDIUM; S-026}

Conversation/worktree IDs reduce logical collision, but `LocalWorkspace`,
configurable mounts, and shared local Agent Server mode can still share host
resources. Correctness therefore depends on deployment topology and resource
declarations, not IDs alone.

**Boundary/scope:** static lock/lease/queue implementations.

**Unknowns:** collision behavior under live races, cleanup after process death,
NFS lease/lock behavior, and tenant-grade isolation remain C-039.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

**Status:** PARTIAL with consequential UNKNOWN.

Canvas maps confirmation disabled to `NeverConfirm`, LLM analysis to
`ConfirmRisky(threshold=HIGH, confirm_unknown=true)`, and the remaining mode to
`AlwaysConfirm`; explicit accept/reject UI controls send decisions back to the
conversation. Agent Server REST uses session-key/workspace-cookie dependencies,
while WebSockets prefer a first authentication frame. {C-015 FACT MEDIUM;
S-011,S-013,S-018}

An empty Agent Server session-key configuration intentionally allows the REST
and WebSocket paths through; configuring keys changes that boundary to an
enforced check. `/api/init` is mounted outside the ordinary session-key and
workspace-cookie dependency sets by design. {C-043 FACT HIGH; S-013}

| Actor | Capability | Default/enforcement location | Consequence |
| --- | --- | --- | --- |
| caller/browser | create/control conversation | Agent Server auth; open when no keys configured | controls agent lifecycle and supplied configuration |
| model/agent | request tool action | typed action + confirmation policy | no side effect until executor/gate path; `NeverConfirm` removes user gate |
| `LocalWorkspace` | host files/processes/network available to process | embedding OS account | direct host authority, not sandboxing |
| `DockerWorkspace` | container plus configured mounts/network/GPU | Docker daemon/operator config | container boundary with operator-selected host/network exposure |
| remote/cloud workspace | remote runtime API | deployment/operator service | isolation is external to reviewed local code |
| automation | create/use/clean runtime | backend credentials + DB state | sandbox/Agent Server command authority |

`LocalWorkspace` is direct host authority. Docker workspace supports additional
mounts, selected networks, and `--gpus all`; the reviewed constructor did not
establish hard CPU, memory, process, or network-deny defaults. {C-016 FACT
MEDIUM; S-012}

Whether Docker/remote/cloud deployments provide robust tenant isolation is not
proved by these configuration adapters. {C-039 UNKNOWN N/A; S-012,S-014}
Managed Cloud's underlying IAM, network, hypervisor/container, and retention
controls are inaccessible in the public snapshots. {C-038 UNKNOWN N/A;
S-012,S-024}

**Boundary/scope:** code enforcement is separated from policy labels; no escape
attempt was authorized.

**Unknowns:** C-038 and C-039.

## 15. Evidence and observability {#evidence-observability}

**Status:** PARTIAL.

Conversation actions, observations, messages, typed errors, state changes,
usage snapshots, pause/interrupt, and condensation are event records with IDs
and parent/cause relationships. EventLog persists them; Agent Server can replay
and stream them over WebSockets. Metrics and telemetry add model/run
correlation, while sanitizers and secret masking reduce credential exposure.
{C-017 FACT MEDIUM; S-008,S-009,S-013,S-015}

Automation adds durable event/run IDs, status detail, command/conversation IDs,
callback/watchdog source labels, accumulated cost, and Prometheus-oriented
service metrics. The evidence owner differs by deployment: local files,
automation database, browser state, and configured telemetry backends.

These records are operational evidence, not tamper-proof receipts. Client tools
cross a boundary where the client performs a side effect after server
acknowledgement, and some transient token events need not be durable.

**Boundary/scope:** schemas and persistence/streaming code; telemetry backend
delivery was not observed.

**Unknowns:** dropped events, redaction completeness, external trace retention,
query/export controls, and forgery/tamper resistance.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

**Status:** PARTIAL.

SDK metrics aggregate model tokens/cost and merge fallback deltas; conversation
stats expose combined metrics. `max_budget_per_run` is checked against
accumulated cost between steps and emits a limit error after spend is reported,
so it is a post-usage ceiling rather than a provider-side preauthorization.
Tool concurrency is bounded separately. {C-018 FACT MEDIUM; S-007,S-009}

Workspace adapters expose resource selection (for example remote
`resource_factor` and Docker GPU/network), but the reviewed Docker adapter does
not itself define universal CPU/memory/process/network quotas. Automation
records callback-reported accumulated cost and aligns command timeout with a
watchdog deadline.

**Boundary/scope:** harness-side reporting/enforcement only.

**Unknowns:** provider-bill reconciliation, retries/caches with missing usage,
streamed-versus-final disagreement, exact overshoot, and hard compute/network
limits are C-037/C-039.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

**Status:** PARTIAL.

The SDK maps tool exceptions to typed error events, applies model retries, and
falls back only for selected errors after retry exhaustion. Interruption sets a
conversation cancellation token and cancels tracked async work; pending tools
can emit `Tool call cancelled by interrupt`, but an already-running synchronous
tool in a worker thread cannot be forcibly stopped by cancelling only its
awaiting async task. {C-019 FACT MEDIUM; S-006,S-007,S-009,S-014}

Canvas local stop calls Agent Server interrupt, whereas cloud pause follows the
cloud pause API and may wait for an active LLM call. {C-050 FACT MEDIUM; S-020}

Automation cancellation atomically changes `PENDING`/`RUNNING` state and, for a
running cloud job, schedules sandbox cleanup. The searched cancellation path
does not issue a demonstrated Agent Server command-interrupt request; local
mode cleanup is a no-op because the server is persistent. {C-025 FACT MEDIUM;
S-027}

Automation commits `RUNNING` before `asyncio.create_task`; a process crash in
that interval is later visible to the watchdog but exactly-once external side
effects are not guaranteed by the shown database transition. {C-041 UNKNOWN
N/A; S-026,S-027}

**Boundary/scope:** static failure/cancel/retry owners and transitions.

**Unknowns:** live cancellation latency, thread/process cleanup, partial tool
writes, and automation exactly-once side effects (C-041).

## 18. Install, update, and release {#install-update-release}

**Status:** PARTIAL.

Official install surfaces are versioned PyPI wheels/sdists, npm tarballs, and
Agent Server/Canvas container images referenced by source. npm metadata for the
two packages includes SHA-512 integrity, npm signatures, and SLSA provenance
attestation links. PyPI exposes SHA-256 digests but reports no attached
signatures for the six queried files. {C-002 FACT HIGH;
S-029,S-030,S-031,S-032,S-033} {C-048 FACT HIGH;
S-029,S-030,S-031,S-032,S-033}

Independent release trains produce the skew in C-020; Canvas has a minimum
Agent Server check, and generated clients identify their source server image,
but those controls are not a proof of full semantic compatibility. {C-020 FACT
HIGH; S-016,S-023,S-033,S-038}

No package script, image, build, migration, update, or rollback was executed.
Consequently clean source-to-artifact equivalence and reproducible build status
remain unresolved. {C-040 UNKNOWN N/A; S-029,S-030,S-031,S-032,S-033}

**Boundary/scope:** passive registry metadata and static package-byte
inspection; no mutable selectors or installers.

**Unknowns:** rollback behavior, migration compatibility, container digest
coverage, and C-040.

## 19. Tests and qualification {#tests-qualification}

**Status:** PARTIAL; tests not executed.

The repositories contain unit, contract/generated-schema, integration,
WebSocket, workspace, live Agent Server, live ACP/Docker, automation database,
and end-to-end layers. CI manifests define lint/type/test/build/release jobs,
but provider/live suites require infrastructure or credentials and are not
equivalent to the production path. {C-021 FACT MEDIUM; S-034,S-035,S-036}

No target test command was run because dependency installation and target code
execution were outside the approved static research boundary. Tests and their
last-validated comments were used to find boundaries, not to claim that this
snapshot passes or that managed services behave as fixtures suggest.

Directly qualified here: immutable identity, clean state, manifests, source
control flow, package metadata, and bounded static searches. Not directly
qualified: startup, provider/model calls, sandbox isolation, race/crash paths,
artifact builds, cloud behavior, or exploitability. {C-037 UNKNOWN N/A;
S-034,S-035,S-036}

**Boundary/scope:** test topology and CI definitions only.

**Unknowns:** current pass/fail results, coverage percentages, platform matrix,
flakiness, and release-gate enforcement.

## 20. Security {#security}

**Status:** PARTIAL with unresolved attack surfaces.

Positive controls visible in source include typed/Pydantic request validation,
validation-error secret sanitization, `SecretStr` handling, output masking,
optional encryption, locked/atomic secret writes, confirmation policies,
session-key/workspace-cookie auth, WebSocket first-frame auth, and npm release
attestation metadata. {C-022 FACT MEDIUM; S-007,S-013,S-015,S-029,S-030}

Canvas persists configured backend hosts and API keys in browser
`localStorage`; local requests use `X-Session-API-Key` and cloud requests use
Bearer authentication. This places secret confidentiality inside the browser
origin/XSS/extension boundary. {C-044 FACT HIGH; S-019}

TypeScript WebSocket clients append the session API key as a query parameter,
although the pinned server calls that path deprecated and supports first-frame
auth. Query URLs can be exposed to intermediaries/logging beyond ordinary
header/frame handling. {C-045 FACT HIGH; S-013,S-023}

Automation's main execution path uploads a generated archive then invokes
`tar xzf ... -C $work_dir`. No member-level validation occurs in that shell
command. A separate git-sync deserializer does use `tarfile.data_filter`, so it
does not establish safety for the execution path. {C-026 FACT HIGH; S-028}
{C-047 FACT HIGH; S-028}

No authorized exploit established whether an attacker can control archive
members or escape the selected work directory in production. {C-042 UNKNOWN
N/A; S-028}

**Boundary/scope:** public source and passive release metadata; no penetration
test, vulnerability-database sweep, or container escape.

**Unknowns:** C-038, C-039, C-042, dependency vulnerability state, browser XSS
resistance, deployed TLS/proxy policy, and managed secret/IAM controls.

## 21. Strengths {#strengths}

**Status:** EVIDENCE-BACKED INTERPRETATION.

1. **Replayable event-centered core (local-file context).** The same typed
   action/observation/error model drives loop context, persistence, REST/WS
   delivery, and operator UI. This reduces translation ambiguity and makes
   intermediate decisions inspectable, subject to durability and tamper caveats.
   {C-027 INFERENCE MEDIUM; S-004,S-005,S-008,S-013}
2. **Typed multi-language boundary.** Agent Server publishes a generated API
   contract consumed by the TypeScript client/Canvas, with explicit version
   requirements on newer APIs. This is stronger than ad hoc JSON, while the
   observed release skew still requires compatibility testing. {C-028 INFERENCE
   MEDIUM; S-013,S-023}
3. **Layered cancellation/concurrency evidence.** Cancellation tokens, typed
   errors, run locks, FIFO resource keys, leases, durable statuses, callbacks,
   and watchdogs make ownership visible even where they cannot guarantee
   preemption or exactly-once behavior. {C-014 FACT MEDIUM; S-006,S-014,S-026,S-027}

**Boundary/scope:** strengths are scoped to static architecture, not claims of
production reliability.

**Unknowns:** runtime qualification could raise or lower confidence.

## 22. Liabilities {#liabilities}

**Status:** EVIDENCE-BACKED INTERPRETATION.

1. **Authority depends on deployment selection.** Trigger: choosing
   `LocalWorkspace`, broad Docker mounts/network, no session keys, or
   `NeverConfirm`. Consequence: the harness can exercise host/runtime authority
   without a compensating boundary. Affected boundary: caller -> Agent Server ->
   tool/workspace. Upstream mechanisms exist (keys, policies, remote workspaces),
   but secure composition remains operator-owned. {C-029 INFERENCE MEDIUM;
   S-011,S-012,S-013}
2. **Independent release trains create protocol drift.** Trigger: combining the
   default Canvas, source/generated client, and published automation versions.
   Consequence: compatibility modes or API feature checks are needed; the ACP
   pin demonstrates a real break class. Affected boundary: UI/client/service
   composition. {C-030 INFERENCE HIGH; S-016,S-023,S-033,S-038}
3. **Automation is at-least-observable, not shown exactly-once.** Trigger: a
   crash after durable `RUNNING` but before task launch, duplicate sources with
   no provider event ID, callback/watchdog races, or cancellation after external
   dispatch. Consequence: recovery can mark/reconcile state without proving no
   duplicate or orphan side effect. {C-041 UNKNOWN N/A; S-026,S-027}
4. **Secret exposure surfaces remain deployment-sensitive.** Trigger: Canvas
   browser backend credentials, query-string WebSocket compatibility, or
   cipherless persistent stores. Consequence: browser/log/file compromise can
   expose control credentials. {C-022 FACT MEDIUM; S-013,S-015,S-019,S-023}

**Boundary/scope:** liabilities identify trigger/consequence, not an assertion
that every deployment is vulnerable.

**Unknowns:** exploitability and actual operator configuration.

## 23. Transferable patterns {#transferable-patterns}

**Status:** RESEARCH CANDIDATES; no adoption decision.

| Pattern | Problem / minimal mechanism | Prerequisites and preserved boundary | Cost/risk | Disposition |
| --- | --- | --- | --- | --- |
| Typed append ledger | Preserve action ordering and reconstruct context with immutable event IDs, parent links, action-before-observation, and typed failures. {C-031 INFERENCE MEDIUM; S-004,S-005,S-008} | Durable store, schema evolution, redaction, explicit transient events; preserves model request versus executor authority. | Migration/compaction and tamper controls. | `CANDIDATE` |
| Policy object plus explicit response event | Pause consequential actions without embedding UI logic in tools; confirmation policy evaluates risk and an accept/reject event resumes. {C-032 INFERENCE MEDIUM; S-005,S-011,S-018} | Risk provenance, fail-closed unknown handling, durable correlation, non-UI control path; preserves proposer/approver separation. | Deadlock/abandonment and policy-bypass testing. | `CONDITIONAL` |
| Lease generation plus local FIFO/resource locks | Avoid split-brain conversation ownership while serializing only colliding resources. {C-033 INFERENCE MEDIUM; S-006,S-012,S-014} | Store with reliable atomic locks, renewal monitoring, fencing on every write, accurate resource declarations. | NFS/distributed-store semantics and stale worker cleanup. | `CONDITIONAL` |

**Boundary/scope:** research input only; adaptation must be independently
authorized and tested.

**Unknowns:** fit with Curiosity ADRs is for downstream synthesis.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

**Status:** BOUNDED REJECTIONS.

1. **Treat local execution as a sandbox — `CURIOSITY_NO_GO`.** Rationale:
   `LocalWorkspace` is explicitly direct host execution and Docker permits
   operator-selected mounts/network/GPU. Calling either a complete security
   boundary would erase the authority distinction. Reopen only with an
   authorized deployment-specific deny-path and escape/isolation qualification.
   {C-034 INFERENCE HIGH; S-012}
2. **Copy browser-persisted control keys or WebSocket query-key transport —
   `CURIOSITY_NO_GO`.** Rationale: Canvas places backend API keys in
   `localStorage`, and the TypeScript client uses deprecated query transport;
   both widen browser/logging exposure. Reopen only with a threat model showing
   this origin and logging boundary is acceptable or with a non-extractable,
   short-lived credential design. {C-035 INFERENCE HIGH; S-013,S-019,S-023}
3. **Represent automation state transitions as exactly-once execution —
   `CURIOSITY_NO_GO`.** Rationale: provider-ID deduplication is conditional and
   the `RUNNING`-commit/task-launch crash window remains. Reopen after an
   idempotency key reaches every external side effect and crash probes prove
   replay behavior. {C-036 INFERENCE HIGH; S-026,S-027}
4. **Unbounded dynamic package/provider/cloud/container research —
   `CURIOSITY_NO_GO`.** It would require installers, credentials, paid calls,
   cloud authority, or exploit execution forbidden by this assignment. The
   correct output is C-037/C-038/C-039/C-042, not an unsafe pass.
5. **Broad test enumeration and sibling-dossier imitation —
   `CURIOSITY_NO_GO`.** After production boundaries and representative test
   layers were mapped, additional file listing offered duplicate evidence and
   another dossier would be secondary evidence.

**Boundary/scope:** these are snapshot/scenario-bounded research dispositions,
not rejection of OpenHands as a project.

**Unknowns:** each item states its reopening condition.

## 25. Adversarial probes {#adversarial-probes}

**Status:** COMPLETED AS STATIC/SAFETY-BOUNDED PROBE LEDGER.

`PASS` is intentionally absent: target code was not executed, and static source
cannot prove runtime enforcement.

| Probe | Result | Expected safe behavior | Actual bounded result | Environment | Claims | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 startup/no-op | INCONCLUSIVE | Help/start with denied network/writes should disclose all side effects. | Entrypoints and startup cleanup/spawn paths traced; no process launched, so undeclared reads/writes/network remain unknown. | macOS static Git inspection; no target execution | C-005,C-037 | S-013,S-016,S-024 |
| P-02 permission denial/bypass | INCONCLUSIVE | Denied capabilities should fail at one auditable enforcement point across alternate paths. | Confirmation and auth branches traced; empty keys intentionally allow access and `NeverConfirm` removes the action gate; no deny-path runtime attempt. | static | C-015,C-043,C-039 | S-011,S-013,S-018 |
| P-03 malformed/oversized input | INCONCLUSIVE | Schemas should reject wrong/missing/oversized values before side effects without echoing secrets. | Pydantic/generated schemas and validation-error sanitization found; size limits and live side-effect ordering untested. | static | C-009,C-022,C-037 | S-013,S-023 |
| P-04 cancellation/timeout | INCONCLUSIVE | Pre-dispatch, streaming, and side-effect cancellation should converge to terminal state and cleanup. | Cancellation token, async task, Canvas interrupt/pause, and automation cancel paths traced; running sync tool and cloud latency limitations remain. | static | C-019,C-025,C-050 | S-006,S-007,S-020,S-027 |
| P-05 retry/duplication/partial failure | INCONCLUSIVE | Retry owner, backoff, idempotency, cost, and partial writes should remain attributable. | Model fallback cost merge and conditional provider-ID dedupe found; no fault injection; exactly-once unresolved. | static | C-010,C-024,C-041 | S-009,S-026,S-027 |
| P-06 concurrency/isolation collision | INCONCLUSIVE | Colliding sessions/resources should serialize or isolate with deterministic cleanup. | Default serial tools, resource locks, per-conversation locks, leases, and DB row claiming traced; no race run. | static | C-014,C-049,C-039 | S-006,S-014,S-026 |
| P-07 crash/restart | INCONCLUSIVE | Restart should recover without split brain, corruption, or silent loss. | Append log, lease fencing, watchdog, and RUNNING/task crash window found; no process interruption. | static | C-013,C-014,C-041 | S-008,S-014,S-026,S-027 |
| P-08 provider/model/network unavailable | NOT_RUN_UNSAFE | Errors should preserve cause, bound retries/cost, and avoid unauthorized fallback. | Provider/network execution required credentials/network and was outside authority. | no credentials/network probe | C-010,C-037 | S-009,S-031 |
| P-09 untrusted instruction injection | NOT_RUN_UNSAFE | Repository/tool/provider text must remain data and never elevate authority. | Fetched source was treated only as untrusted evidence; no product model/provider injection run was authorized. | research process static only | C-012,C-037 | S-010 |
| P-10 filesystem boundary abuse | NOT_RUN_UNSAFE | Traversal, absolute paths, and symlinks should be rejected before workspace escape. | Direct host/configurable mounts and shell tar extraction identified; exploit attempt prohibited. | no disposable target sandbox approved | C-016,C-026,C-042 | S-012,S-028 |
| P-11 resource/token/cost disagreement | NOT_RUN_UNSAFE | Missing/conflicting provider usage should fail visibly and budgets should bound spend. | Aggregation, fallback merge, and post-step budget check traced; no billed/provider run. | no provider account | C-018,C-037 | S-007,S-009 |
| P-12 install/update pin/rollback | INCONCLUSIVE | Immutable artifacts should re-resolve and map to source; failed update should roll back. | Registry versions/digests re-resolved without installers; npm signatures/attestations observed; source equivalence and rollback untested. | curl + JSON/static tar metadata; no install | C-002,C-040,C-048 | S-029,S-030,S-031,S-032,S-033,S-038 |
| P-13 claimed absence/disabled feature | INCONCLUSIVE | Alternate entrypoints/config should not re-enable a claimed-absent capability. | Production roots searched for sandbox limits, cancellation, auth, and tar filtering; bounded negatives became UNKNOWN rather than global absence. | git/rg static searches | C-025,C-039,C-042 | S-012,S-027,S-028 |
| P-14 evidence loss/forgery | INCONCLUSIVE | Denied/failed/cancelled actions should retain correlation/redaction and resist spoofing. | Event IDs, typed failures, redaction, callbacks/watchdog found; no drop/spoof/tamper run. | static | C-017,C-022,C-041 | S-008,S-013,S-015,S-027 |

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "As of the 2026-08-24 UTC cutoff, the four reviewed official repositories resolve to the full commits recorded in Section 1 and were clean with no populated submodules."
  classification: FACT
  confidence: HIGH
  scope: "Four local Git snapshots; excludes commit 041078f26698ccba4b78af6c3069e37bb1556b32 after cutoff."
  source_ids: [S-001, S-016, S-021, S-024, S-037]
  fact_dependencies: []
  method: "Compared origin URL, git rev-parse HEAD, git status --porcelain, git submodule status, and commit timestamp."
  counterevidence: "none found in the four pinned repositories"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "The five versioned npm/PyPI package identities re-resolve to the integrity digests recorded in S-029 through S-033."
  classification: FACT
  confidence: HIGH
  scope: "Passive registry JSON on 2026-08-24; no install or build."
  source_ids: [S-029, S-030, S-031, S-032, S-033]
  fact_dependencies: []
  method: "Fetched exact-version registry JSON and retained integrity/digest fields."
  counterevidence: "none found in exact-version registry responses"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: provenance-license
  statement: "Each reviewed repository contains the MIT license grant, npm package metadata also reports MIT, and the three queried PyPI license fields are null."
  classification: FACT
  confidence: HIGH
  scope: "Top-level licenses and exact npm metadata; not transitive dependencies or trademarks."
  source_ids: [S-003, S-017, S-022, S-025, S-029, S-030, S-031, S-032, S-033]
  fact_dependencies: []
  method: "Read each pinned LICENSE and registry license field."
  counterevidence: "PyPI license fields are null, which is missing metadata rather than contrary license text"
  adversarial_status: SUPPORTED
- claim_id: C-004
  section: repository-package-map
  statement: "The production family is partitioned into SDK/tools/workspaces/Agent Server, Canvas launch/UI surfaces, a TypeScript client, and an automation service."
  classification: FACT
  confidence: HIGH
  scope: "Pinned manifests and production roots; examples/tests are classified separately."
  source_ids: [S-002, S-016, S-021, S-024]
  fact_dependencies: []
  method: "Mapped workspace/package manifests, source roots, and import composition."
  counterevidence: "none found in pinned manifests"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: executable-entrypoints
  statement: "The family defines SDK library, Agent Server daemon, Canvas npm/container/Electron, TypeScript library, and automation ASGI/background-worker entry surfaces."
  classification: FACT
  confidence: HIGH
  scope: "Source-defined entrypoints; invocation was not executed."
  source_ids: [S-002, S-013, S-016, S-021, S-024, S-026, S-027]
  fact_dependencies: []
  method: "Traced manifests, __main__/ASGI roots, launcher, and app lifespan task creation."
  counterevidence: "none found in production entrypoint roots"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: control-data-flow
  statement: "The static interactive path builds an event-derived context, emits ActionEvents before gated tool execution, appends results/errors, and exposes events through Agent Server REST/WebSockets."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned Python source; no runtime ordering observation."
  source_ids: [S-004, S-005, S-007, S-008, S-013, S-014]
  fact_dependencies: []
  method: "Traced Agent response dispatch through LocalConversation/EventLog and Agent Server event service/socket routes."
  counterevidence: "none found in traced path; runtime scheduling unverified"
  adversarial_status: NOT_PROBED
- claim_id: C-007
  section: module-extension-boundaries
  statement: "Official extension surfaces include typed tools, MCP, hooks, skills, client tools, subagents, profiles/fallbacks, workspaces, and ACPAgent."
  classification: FACT
  confidence: MEDIUM
  scope: "Named production extension roots; no third-party extension executed."
  source_ids: [S-005, S-018, S-023]
  fact_dependencies: []
  method: "Static registry/config/import search and representative path trace."
  counterevidence: "none found in searched production roots"
  adversarial_status: NOT_PROBED
- claim_id: C-008
  section: agent-interface
  statement: "Agent Server owns conversation run/goal/interrupt/close lifecycle while configured agent, tools, workspace, and policy determine delegated authority."
  classification: FACT
  confidence: MEDIUM
  scope: "Regular SDK Agent, ACPAgent, and server lifecycle source."
  source_ids: [S-004, S-007, S-014, S-018]
  fact_dependencies: []
  method: "Traced constructors, lifecycle methods, child launch, and interruption."
  counterevidence: "none found in traced paths"
  adversarial_status: NOT_PROBED
- claim_id: C-009
  section: tool-interface
  statement: "Tools use typed declarations and action/result events, confirmation can suspend execution, and client tools delegate the actual side effect to the connected client after server acknowledgement."
  classification: FACT
  confidence: MEDIUM
  scope: "SDK/Canvas/Agent Server static client-tool path."
  source_ids: [S-005, S-006, S-011, S-018, S-023]
  fact_dependencies: []
  method: "Traced response dispatch, confirmation policy, executor, generated client-tool schema, and Canvas handler."
  counterevidence: "none found; client runtime honesty unavailable"
  adversarial_status: NOT_PROBED
- claim_id: C-010
  section: provider-interface
  statement: "SDK LLM configuration delegates provider transport through LiteLLM/auth helpers and can merge eligible fallback-call usage into primary metrics."
  classification: FACT
  confidence: MEDIUM
  scope: "SDK source and dependency metadata; no provider request."
  source_ids: [S-009, S-031]
  fact_dependencies: []
  method: "Read LLM and FallbackStrategy paths plus package dependencies."
  counterevidence: "none found in provider adapter source"
  adversarial_status: NOT_PROBED
- claim_id: C-011
  section: model-interface
  statement: "The SDK model interface carries identity, parameters, endpoint/stream events, feature metadata, usage, retries, and fallback configuration."
  classification: FACT
  confidence: MEDIUM
  scope: "SDK model abstraction; no live model validation."
  source_ids: [S-009]
  fact_dependencies: []
  method: "Static field/symbol and response-path inspection."
  counterevidence: "none found in LLM source"
  adversarial_status: NOT_PROBED
- claim_id: C-012
  section: context-interface
  statement: "Context construction enforces a system-prompt prefix, filters to LLM-convertible events, and supports rolling LLM-generated summaries."
  classification: FACT
  confidence: MEDIUM
  scope: "SDK Agent/View/default condenser source; summary quality unobserved."
  source_ids: [S-004, S-010]
  fact_dependencies: []
  method: "Traced Agent.init_state/dynamic context, View.from_events, and LLMSummarizingCondenser."
  counterevidence: "none found in context source"
  adversarial_status: NOT_PROBED
- claim_id: C-013
  section: state-persistence-restart
  statement: "Local state can use an append-oriented locked EventLog and FileStore, with optional encrypted secret persistence and explicit redacted/plaintext alternatives."
  classification: FACT
  confidence: MEDIUM
  scope: "Local/Agent Server file persistence source; crash behavior untested."
  source_ids: [S-007, S-008, S-015]
  fact_dependencies: []
  method: "Inspected append/restore, lock, cipher serialization, and warning paths."
  counterevidence: "EventLog itself warns lock assumptions may fail on NFS/network filesystems"
  adversarial_status: CHALLENGED
- claim_id: C-014
  section: concurrency-worktree-isolation
  statement: "Concurrency control combines per-agent tool limits/resource locks, per-conversation run locks, and renewable generation-fenced Agent Server leases."
  classification: FACT
  confidence: MEDIUM
  scope: "One process plus file-backed lease design; distributed runtime untested."
  source_ids: [S-006, S-012, S-014]
  fact_dependencies: []
  method: "Inspected executor, FIFO resource manager, EventService, and lease claims/guarded writes."
  counterevidence: "shared state and NFS caveats remain"
  adversarial_status: CHALLENGED
- claim_id: C-015
  section: permissions-authority-sandbox
  statement: "Canvas maps verification settings to explicit confirmation policies, and Agent Server applies configured HTTP/WebSocket authentication dependencies."
  classification: FACT
  confidence: MEDIUM
  scope: "Canvas adapter/UI and Agent Server auth source; no bypass attempt."
  source_ids: [S-011, S-013, S-018]
  fact_dependencies: []
  method: "Traced settings-to-policy mapping, accept/reject calls, REST dependencies, and WebSocket authentication."
  counterevidence: "C-043 records intentional open mode when keys are absent"
  adversarial_status: CHALLENGED
- claim_id: C-016
  section: permissions-authority-sandbox
  statement: "LocalWorkspace executes with embedding-host authority, while DockerWorkspace permits operator-configured mounts, network, and GPU passthrough without source-demonstrated universal hard quotas."
  classification: FACT
  confidence: MEDIUM
  scope: "Workspace adapter construction only; container daemon/runtime policy excluded."
  source_ids: [S-012]
  fact_dependencies: []
  method: "Read LocalWorkspace and DockerWorkspace configuration/command assembly and searched those paths for CPU/memory/process/network-deny controls."
  counterevidence: "remote resource_factor exists but is an external API request, not a local hard-limit proof"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: evidence-observability
  statement: "Typed conversation events, EventLog, WebSocket replay/streaming, metrics, telemetry, and automation status records provide correlated operational evidence."
  classification: FACT
  confidence: MEDIUM
  scope: "Evidence schemas/storage paths; backend delivery and tamper resistance untested."
  source_ids: [S-008, S-009, S-013, S-015, S-027]
  fact_dependencies: []
  method: "Inspected event IDs/parents, storage, socket resend, sanitization, metrics, and automation terminal updates."
  counterevidence: "transient events/client-side effects and non-tamper-proof stores limit completeness"
  adversarial_status: CHALLENGED
- claim_id: C-018
  section: resource-token-cost-accounting
  statement: "SDK metrics aggregate usage and fallback deltas, and max_budget_per_run checks accumulated cost between steps rather than reserving provider spend."
  classification: FACT
  confidence: MEDIUM
  scope: "Harness accounting source; no provider invoice comparison."
  source_ids: [S-007, S-009]
  fact_dependencies: []
  method: "Traced metrics merge and LocalConversation budget check/error emission."
  counterevidence: "no live provider totals or overshoot measurement"
  adversarial_status: NOT_PROBED
- claim_id: C-019
  section: failure-cancellation-retry
  statement: "SDK cancellation skips pending tools and cancels tracked async work, but cancellation of an awaiting task does not forcibly terminate an already-running synchronous worker-thread tool."
  classification: FACT
  confidence: MEDIUM
  scope: "SDK local executor/conversation; tool-specific cooperative checks vary."
  source_ids: [S-006, S-007, S-009, S-014]
  fact_dependencies: []
  method: "Traced cancellation token, async executor exception path, run interrupt, retries, and fallback."
  counterevidence: "cooperative tools can stop themselves; no live side-effect tool tested"
  adversarial_status: CHALLENGED
- claim_id: C-020
  section: install-update-release
  statement: "Canvas, TypeScript client, and automation source/published metadata refer to different Agent Server or SDK patch versions at the cutoff."
  classification: FACT
  confidence: HIGH
  scope: "Exact pinned config/generated headers and registry metadata."
  source_ids: [S-016, S-023, S-030, S-033, S-038]
  fact_dependencies: []
  method: "Compared source defaults/dependencies and generated-schema headers with published package metadata."
  counterevidence: "minimum-version checks may preserve compatibility but do not erase the version differences"
  adversarial_status: SUPPORTED
- claim_id: C-021
  section: tests-qualification
  statement: "The repositories define multiple unit/contract/integration/live/E2E layers, but no target test suite was executed in this research environment."
  classification: FACT
  confidence: MEDIUM
  scope: "Test/CI topology only."
  source_ids: [S-034, S-035, S-036]
  fact_dependencies: []
  method: "Static test/workflow enumeration bounded to representative layers; no dependency install."
  counterevidence: "test comments may report prior runs but are not this snapshot's runtime evidence"
  adversarial_status: NOT_PROBED
- claim_id: C-022
  section: security
  statement: "Source defines secret types, masking, optional encryption, validation-error sanitization, locking, confirmation, and authentication controls, with explicit cipherless persistence caveats."
  classification: FACT
  confidence: MEDIUM
  scope: "Public source controls; deployment configuration and bypass resistance untested."
  source_ids: [S-007, S-013, S-015]
  fact_dependencies: []
  method: "Inspected secret registry, serializers/stores, API validation handler, and auth/gate paths."
  counterevidence: "plaintext modes, open auth configuration, and browser/query-key surfaces remain"
  adversarial_status: CHALLENGED
- claim_id: C-024
  section: control-data-flow
  statement: "Automation transactionally stores input and PENDING runs, conditionally deduplicates provider IDs, claims PostgreSQL rows with SKIP LOCKED, commits RUNNING, and then launches async execution."
  classification: FACT
  confidence: MEDIUM
  scope: "Automation source; PostgreSQL/runtime not executed and SQLite differs."
  source_ids: [S-026]
  fact_dependencies: []
  method: "Traced ingest, scheduler, dispatcher, DB dialect branches, and task launch."
  counterevidence: "missing provider IDs are explicitly not deduplicated; SQLite skips SKIP LOCKED"
  adversarial_status: CHALLENGED
- claim_id: C-025
  section: failure-cancellation-retry
  statement: "Automation cancellation updates PENDING/RUNNING state and requests cloud cleanup, but the searched path does not issue a demonstrated Agent Server command interrupt and local cleanup is a no-op."
  classification: FACT
  confidence: MEDIUM
  scope: "router/backends cancellation and cleanup path only; global absence not claimed."
  source_ids: [S-027]
  fact_dependencies: []
  method: "Static call trace plus reference search for interrupt/cancel/cleanup in router, dispatcher, and local/cloud backends."
  counterevidence: "sandbox deletion can terminate cloud execution indirectly"
  adversarial_status: CHALLENGED
- claim_id: C-026
  section: security
  statement: "The automation execution path invokes tar xzf on its uploaded archive without member-level checks in that shell extraction command."
  classification: FACT
  confidence: HIGH
  scope: "Pinned execution.py command construction; archive controllability/exploitability excluded."
  source_ids: [S-028]
  fact_dependencies: []
  method: "Inspected both tar extraction command sites and compared archive construction."
  counterevidence: "C-047 applies only to a separate git-sync deserializer"
  adversarial_status: CHALLENGED
- claim_id: C-027
  section: strengths
  statement: "Within local-file deployments, using one typed event model for execution, persistence, context, and streaming can improve replayability and diagnosis."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Architectural benefit, conditional on durable storage/redaction and schema compatibility."
  source_ids: [S-004, S-005, S-008, S-013]
  fact_dependencies: [C-006, C-013, C-017]
  method: "Reasoning chain: shared typed records plus append persistence plus replay reduce lossy cross-layer translation; alternative is that transient/dropped/client-side events make replay incomplete."
  counterevidence: "client tools, transient token events, and tamper limitations"
  adversarial_status: CHALLENGED
- claim_id: C-028
  section: strengths
  statement: "Generated TypeScript contracts and explicit compatibility checks can reduce ad hoc protocol mismatch, subject to the observed release skew."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Agent Server/TypeScript/Canvas API boundary only."
  source_ids: [S-013, S-023]
  fact_dependencies: [C-007, C-020]
  method: "Reasoning chain: generated operation types constrain callers; alternative is semantic drift despite type compatibility."
  counterevidence: "C-020 and C-046 show version/API drift still occurs"
  adversarial_status: CHALLENGED
- claim_id: C-029
  section: liabilities
  statement: "OpenHands authority and isolation are deployment-composition responsibilities because open auth, no-confirmation, local execution, and broad container options are valid configurations."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Reviewed configuration space; does not characterize every deployment."
  source_ids: [S-011, S-012, S-013]
  fact_dependencies: [C-015, C-016, C-043]
  method: "Reasoning chain: each configurable gate can be absent, so the framework alone cannot imply a secure deployment; alternative is an operator profile that supplies all controls."
  counterevidence: "keys, confirmation, remote runtimes, and external policies can constrain authority"
  adversarial_status: CHALLENGED
- claim_id: C-030
  section: liabilities
  statement: "Independent component release trains impose compatibility-testing burden at Canvas/client/Agent Server/automation and ACP boundaries."
  classification: INFERENCE
  confidence: HIGH
  scope: "Versions at the cutoff; not a claim of incompatibility for every combination."
  source_ids: [S-016, S-023, S-033, S-038]
  fact_dependencies: [C-020, C-046]
  method: "Reasoning chain: differing pins plus a documented ACP break require compatibility controls; alternative is backward-compatible server behavior."
  counterevidence: "minimum-version checks and deprecated compatibility paths exist"
  adversarial_status: SUPPORTED
- claim_id: C-031
  section: transferable-patterns
  statement: "A typed append ledger is a candidate pattern for preserving action ordering, causal links, replay, and context reconstruction."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Research candidate only; requires durability, redaction, migrations, and tamper analysis."
  source_ids: [S-004, S-005, S-008]
  fact_dependencies: [C-006, C-013, C-017]
  method: "Extracted minimal mechanism from the observed event path; alternative is transactional snapshots plus an audit log."
  counterevidence: "NFS caveat and non-durable transient/client events"
  adversarial_status: CHALLENGED
- claim_id: C-032
  section: transferable-patterns
  statement: "A policy object plus correlated accept/reject response event is a conditional pattern for separating action proposal from approval."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Research candidate only; requires fail-closed defaults and non-UI control coverage."
  source_ids: [S-005, S-011, S-018]
  fact_dependencies: [C-009, C-015]
  method: "Extracted proposal/gate/response mechanism; alternative is capability-scoped tools that need no per-action UI."
  counterevidence: "NeverConfirm and unavailable approvers can bypass or stall the mechanism by configuration"
  adversarial_status: CHALLENGED
- claim_id: C-033
  section: transferable-patterns
  statement: "Generation-fenced leases combined with FIFO resource locks are a conditional pattern for split-brain and shared-resource coordination."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Research candidate only; requires reliable atomic store and complete resource declarations."
  source_ids: [S-006, S-012, S-014]
  fact_dependencies: [C-014, C-049]
  method: "Extracted ownership-generation and sorted-resource-lock mechanisms; alternative is single-owner queueing or database transactions."
  counterevidence: "NFS/distributed semantics and misdeclared resources"
  adversarial_status: CHALLENGED
- claim_id: C-034
  section: rejected-patterns-curiosity-no-go
  statement: "Treating LocalWorkspace or configurable DockerWorkspace as a complete sandbox is a CURIOSITY_NO_GO for this comparison."
  classification: INFERENCE
  confidence: HIGH
  scope: "Reviewed adapters; may reopen for a qualified deployment profile."
  source_ids: [S-012]
  fact_dependencies: [C-016, C-039]
  method: "Direct host authority and configurable exposure contradict a framework-level hard-isolation assertion; alternative is externally hardened container/remote infrastructure."
  counterevidence: "external runtime policy may provide isolation but was not observed"
  adversarial_status: SUPPORTED
- claim_id: C-035
  section: rejected-patterns-curiosity-no-go
  statement: "Copying browser-localStorage control credentials or query-string WebSocket keys is a CURIOSITY_NO_GO without a deployment-specific threat justification."
  classification: INFERENCE
  confidence: HIGH
  scope: "Credential transport/storage pattern, not a finding of present compromise."
  source_ids: [S-013, S-019, S-023]
  fact_dependencies: [C-044, C-045]
  method: "Browser-origin and URL-logging exposure are broader than non-extractable/header/frame alternatives; alternative is tightly controlled single-user origin/logging."
  counterevidence: "server supports first-frame auth and deployments may sanitize logs"
  adversarial_status: SUPPORTED
- claim_id: C-036
  section: rejected-patterns-curiosity-no-go
  statement: "Describing automation database status transitions as exactly-once external execution is a CURIOSITY_NO_GO at this snapshot."
  classification: INFERENCE
  confidence: HIGH
  scope: "Automation source transition and side-effect boundary."
  source_ids: [S-026, S-027]
  fact_dependencies: [C-024, C-025]
  method: "Commit-before-task and conditional dedupe leave crash/duplicate windows; alternative requires end-to-end side-effect idempotency not shown."
  counterevidence: "watchdog and optimistic updates improve reconciliation but not exactly-once proof"
  adversarial_status: SUPPORTED
- claim_id: C-037
  section: tests-qualification
  statement: "Executable startup, live provider/model/network behavior, and target test pass status are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "All four repositories and external providers at pinned versions."
  source_ids: [S-009, S-013, S-016, S-024, S-034, S-035, S-036]
  fact_dependencies: []
  method: "attempted_methods=static entrypoint/provider/test/CI trace and passive metadata retrieval; blocker=approved environment forbids dependency installation, credentials, paid calls, and uncontrolled target execution; impact=runtime correctness, diagnostics, retry/cost, and qualification cannot be scored as observed; available_evidence=S-009,S-013,S-016,S-024,S-034,S-035,S-036; next_probe=run pinned no-secret builds and fake-provider deny/fault suites in a disposable network-denied environment under separate authority"
  counterevidence: "repository test comments are not current runtime observations"
  adversarial_status: NOT_PROBED
- claim_id: C-038
  section: permissions-authority-sandbox
  statement: "Managed OpenHands Cloud isolation, IAM, network, retention, and control-plane behavior are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Proprietary/operated infrastructure outside public client adapters."
  source_ids: [S-012, S-024]
  fact_dependencies: []
  method: "attempted_methods=traced public cloud workspace and automation client boundaries and searched pinned repositories for implementation; blocker=managed infrastructure and operator configuration are not present and no account/access was authorized; impact=tenant isolation and operational comparison remain incomplete; available_evidence=S-012,S-024; next_probe=obtain an operator architecture/control statement plus authorized tenant-isolation and lifecycle evidence"
  counterevidence: "none: public clients cannot establish server-side implementation"
  adversarial_status: NOT_PROBED
- claim_id: C-039
  section: permissions-authority-sandbox
  statement: "Hard filesystem, process, CPU, memory, network, and tenant isolation of Docker/remote runtime deployments is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "DockerWorkspace and remote/runtime deployments; LocalWorkspace is explicitly excluded as direct host authority."
  source_ids: [S-012, S-014]
  fact_dependencies: []
  method: "attempted_methods=inspected adapter flags, searched constructors for quotas/deny defaults, and traced lease/session keys; blocker=runtime daemon/operator policy is external and escape/resource probes require separately authorized disposable Docker infrastructure; impact=sandbox and multi-tenant comparison cannot claim enforcement; available_evidence=S-012,S-014; next_probe=deploy exact image digest in a least-privilege disposable host and run deny-path resource/network/filesystem collision probes"
  counterevidence: "configurable mounts/network/GPU challenge any blanket isolation claim"
  adversarial_status: NOT_PROBED
- claim_id: C-040
  section: install-update-release
  statement: "Byte-for-byte correspondence and reproducible-build equivalence between pinned commits and registry artifacts are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Canvas 1.15.0, TypeScript 1.38.1, SDK/Agent Server 1.43.1, automation 1.8.0."
  source_ids: [S-001, S-016, S-021, S-024, S-029, S-030, S-031, S-032, S-033, S-038]
  fact_dependencies: []
  method: "attempted_methods=re-resolved versioned metadata/digests and statically inspected selected package metadata; blocker=no package build/install or clean source rebuild was authorized and releases do not all identify these commits in retained metadata; impact=supply-chain source equivalence remains unproven; available_evidence=S-001,S-016,S-021,S-024,S-029,S-030,S-031,S-032,S-033,S-038; next_probe=perform hermetic no-network builds from each commit and compare normalized artifacts/provenance subjects"
  counterevidence: "npm attestations establish a provenance object exists but were not verified to these exact source commits"
  adversarial_status: NOT_PROBED
- claim_id: C-041
  section: failure-cancellation-retry
  statement: "Exactly-once external side effects and complete crash recovery for automation runs are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Automation ingest through dispatcher, callback, watchdog, cancellation, and runtime side effects."
  source_ids: [S-026, S-027]
  fact_dependencies: []
  method: "attempted_methods=static transaction/task/callback/watchdog trace and duplicate-ID search; blocker=no crash injection or external side-effect harness was executed; impact=automation reliability/idempotency comparison must remain partial; available_evidence=S-026,S-027; next_probe=crash at every transition around RUNNING/task launch/callback and replay duplicate/no-ID events against idempotent fake side effects"
  counterevidence: "conditional provider-ID dedupe and watchdog reconciliation reduce but do not close all windows"
  adversarial_status: NOT_PROBED
- claim_id: C-042
  section: security
  statement: "Exploitability of automation's tar xzf execution path through traversal, absolute paths, or symlinks is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Generated/uploaded execution archives in automation execution.py; git-sync safe filter is a separate path."
  source_ids: [S-028]
  fact_dependencies: []
  method: "attempted_methods=static producer-to-extraction trace, command search, and comparison with git-sync data_filter; blocker=member controllability is path-dependent and dynamic filesystem-abuse probes were not authorized; impact=archive extraction attack surface cannot be accepted or dismissed; available_evidence=S-028; next_probe=construct malicious members at each accepted upload/generation boundary and extract only inside a disposable deny-mounted sandbox while tracing canonicalization"
  counterevidence: "the ordinary archive producer constructs known names, and the separate git-sync path filters members"
  adversarial_status: NOT_PROBED
- claim_id: C-043
  section: permissions-authority-sandbox
  statement: "When Agent Server session_api_keys is empty, its HTTP/WebSocket authentication logic intentionally permits access, and /api/init is outside ordinary auth dependencies."
  classification: FACT
  confidence: HIGH
  scope: "Pinned Agent Server auth/routes; deployment reverse proxies excluded."
  source_ids: [S-013]
  fact_dependencies: []
  method: "Read route dependency composition and empty-key branches in HTTP/WebSocket checks."
  counterevidence: "configured keys and workspace cookies enforce other modes"
  adversarial_status: CHALLENGED
- claim_id: C-044
  section: security
  statement: "Canvas stores backend host records including configured API keys in browser localStorage and derives local/cloud auth headers from them."
  classification: FACT
  confidence: HIGH
  scope: "Canvas backend registry; browser runtime not executed."
  source_ids: [S-019]
  fact_dependencies: []
  method: "Traced backend serialization/deserialization and auth header selection."
  counterevidence: "workspace cookies can reduce header use for selected browser resources but do not remove registry storage"
  adversarial_status: CHALLENGED
- claim_id: C-045
  section: tool-interface
  statement: "The pinned TypeScript WebSocket clients transmit session API keys in the URL query while the pinned server labels query/header WebSocket auth deprecated in favor of first-frame auth."
  classification: FACT
  confidence: HIGH
  scope: "TypeScript events/bash clients and Agent Server sockets."
  source_ids: [S-013, S-023]
  fact_dependencies: []
  method: "Compared URL construction with server authentication precedence and warnings."
  counterevidence: "the server intentionally retains query compatibility"
  adversarial_status: CHALLENGED
- claim_id: C-046
  section: module-extension-boundaries
  statement: "Canvas pins agent-client-protocol below 0.11 because its documented 0.11 argument-order change breaks the SDK ACP client."
  classification: FACT
  confidence: HIGH
  scope: "Canvas config/defaults compatibility comment at pinned commit."
  source_ids: [S-016, S-018]
  fact_dependencies: []
  method: "Read exact compatibility constraint and the described validation diagnostic."
  counterevidence: "a future fixed SDK could remove the constraint"
  adversarial_status: SUPPORTED
- claim_id: C-047
  section: security
  statement: "Automation git-sync archive deserialization applies Python tarfile.data_filter, but that is separate from execution.py's shell tar extraction."
  classification: FACT
  confidence: HIGH
  scope: "git_sync/serializer.py versus execution.py."
  source_ids: [S-028]
  fact_dependencies: []
  method: "Compared both production extraction implementations by path and caller."
  counterevidence: "none; mechanisms are distinct"
  adversarial_status: SUPPORTED
- claim_id: C-048
  section: install-update-release
  statement: "npm reports signatures and SLSA provenance attestation links for Canvas 1.15.0 and TypeScript client 1.38.1, while PyPI reports has_sig false for queried wheel/sdist files."
  classification: FACT
  confidence: HIGH
  scope: "Exact registry metadata; attestation statement verification not performed."
  source_ids: [S-029, S-030, S-031, S-032, S-033]
  fact_dependencies: []
  method: "Retrieved exact-version dist/has_sig fields."
  counterevidence: "none in registry responses; existence is not source-equivalence proof"
  adversarial_status: SUPPORTED
- claim_id: C-049
  section: tool-interface
  statement: "Tool concurrency defaults to one, and higher concurrency shares state while serializing only correctly declared resource-key collisions."
  classification: FACT
  confidence: HIGH
  scope: "SDK Agent/ParallelToolExecutor/ResourceLockManager source."
  source_ids: [S-006, S-012]
  fact_dependencies: []
  method: "Read default field, executor docs/branches, and sorted multi-resource lock acquisition."
  counterevidence: "misdeclared resources can still race"
  adversarial_status: CHALLENGED
- claim_id: C-050
  section: agent-interface
  statement: "Canvas local pause invokes Agent Server interrupt, whereas the cloud pause path may wait for an active LLM request before suspension."
  classification: FACT
  confidence: MEDIUM
  scope: "Canvas mutation path and documented backend distinction; no live timing."
  source_ids: [S-020]
  fact_dependencies: []
  method: "Traced pauseConversation local/cloud branches and goal stop composition."
  counterevidence: "actual cloud implementation and latency are not public"
  adversarial_status: NOT_PROBED
```

## 27. Source ledger {#source-ledger}

The bibliography retains primary, immutable sources because each is the nearest
origin for the supported claim. Registry JSON is retained for release identity;
repository source is preferred for structure/intent; no vendor statement is
misrepresented as independent runtime measurement.

```yaml
- source_id: S-001
  source_kind: repository-file
  title: "software-agent-sdk pinned Git identity"
  url: "https://github.com/OpenHands/software-agent-sdk/tree/25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "N/A:not-a-package-source"
  code_path: "N/A:repository-tree-identity"
  symbol: "Git commit/worktree"
  line_anchor: "N/A:no-line-anchor"
  command: "git remote get-url origin && git rev-parse HEAD && git status --porcelain=v1 && git submodule status"
  command_environment: "macOS arm64; git 2.x; local read-only static inspection; no target execution/network"
  output_or_hash: "inline:origin=https://github.com/OpenHands/software-agent-sdk.git; HEAD=25cc8e56a4d029f4f879bdfead1cd21c11d6483d; porcelain/submodule output empty"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-040]
  notes: "Selected as immutable identity origin."
- source_id: S-002
  source_kind: repository-file
  title: "SDK workspace/package manifest"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/pyproject.toml"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-sdk/agent-server/tools/workspace source workspace"
  code_path: "pyproject.toml"
  symbol: "workspace members / dependency groups"
  line_anchor: "L1-L100"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:pyproject.toml | sed -n '1,100p'"
  command_environment: "macOS arm64; git static read; no package install"
  output_or_hash: "inline:monorepo manifest identifies openhands-sdk, openhands-tools, openhands-workspace, and openhands-agent-server roots"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005]
  notes: "Preferred over README package lists because it is executable build metadata."
- source_id: S-003
  source_kind: license
  title: "software-agent-sdk MIT license"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/LICENSE"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "N/A:repository-license"
  code_path: "LICENSE"
  symbol: "MIT license grant"
  line_anchor: "L1-L21"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:LICENSE"
  command_environment: "macOS arm64; git static read"
  output_or_hash: "inline:MIT License; Copyright 2025 OpenHands"
  access_date: "2026-08-24"
  supports_claims: [C-003]
  notes: "Actual license text, preferred to classifier alone."
- source_id: S-004
  source_kind: repository-file
  title: "SDK Agent loop and context initialization"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/openhands-sdk/openhands/sdk/agent/agent.py"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-sdk source"
  code_path: "openhands-sdk/openhands/sdk/agent/agent.py"
  symbol: "Agent; _ActionBatch; init_state; step/arun"
  line_anchor: "L186-L375,L449-L620,L644-L970"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-sdk/openhands/sdk/agent/agent.py | nl -ba | sed -n '186,970p'"
  command_environment: "macOS arm64; git static read; Python not executed"
  output_or_hash: "inline:Agent builds system/dynamic context, invokes LLM, dispatches action batches, and passes cancellation token"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-008, C-012, C-027, C-031]
  notes: "Primary loop implementation; comments treated as source intent, not runtime proof."
- source_id: S-005
  source_kind: repository-file
  title: "Response classification, action emission, and confirmation"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/openhands-sdk/openhands/sdk/agent/response_dispatch.py"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-sdk source"
  code_path: "openhands-sdk/openhands/sdk/agent/response_dispatch.py"
  symbol: "LLMResponseType; ResponseDispatchMixin"
  line_anchor: "L44-L242,L280-L314"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-sdk/openhands/sdk/agent/response_dispatch.py | nl -ba | sed -n '44,314p'"
  command_environment: "macOS arm64; git static read"
  output_or_hash: "inline:response is classified, ActionEvents are emitted, and confirmation is checked before runner dispatch"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-007, C-009, C-027, C-031, C-032]
  notes: "Nearest source for action-before-observation ordering."
- source_id: S-006
  source_kind: repository-file
  title: "Parallel tool executor and cancellation"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/openhands-sdk/openhands/sdk/agent/parallel_executor.py"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-sdk source"
  code_path: "openhands-sdk/openhands/sdk/agent/parallel_executor.py"
  symbol: "ParallelToolExecutor"
  line_anchor: "L1-L339"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-sdk/openhands/sdk/agent/parallel_executor.py | nl -ba | sed -n '1,339p'"
  command_environment: "macOS arm64; git static read; no threads/tasks launched"
  output_or_hash: "inline:configurable per-agent pool, shared-state warning, resource locking, synthetic cancellation errors, and worker-thread limitation"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-014, C-019, C-033, C-049]
  notes: "Compared with Agent.tool_concurrency_limit default and ResourceLockManager in S-012."
- source_id: S-007
  source_kind: repository-file
  title: "LocalConversation state, secrets, limits, and interruption"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/openhands-sdk/openhands/sdk/conversation/impl/local_conversation.py"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-sdk source"
  code_path: "openhands-sdk/openhands/sdk/conversation/impl/local_conversation.py"
  symbol: "LocalConversation"
  line_anchor: "L179-L558,L657-L760,L900-L1250"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-sdk/openhands/sdk/conversation/impl/local_conversation.py | nl -ba | sed -n '179,1250p'"
  command_environment: "macOS arm64; git static read"
  output_or_hash: "inline:FileStore/EventLog wiring, cipher/redaction options, secret registry, budget check, cancellation token, run/interrupt event paths"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-008, C-013, C-018, C-019, C-022]
  notes: "Consequential runtime claims capped at MEDIUM without execution."
- source_id: S-008
  source_kind: repository-file
  title: "Append-only EventLog"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/openhands-sdk/openhands/sdk/conversation/event_store.py"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-sdk source"
  code_path: "openhands-sdk/openhands/sdk/conversation/event_store.py"
  symbol: "EventLog.append; get_branch; index rebuild"
  line_anchor: "L30-L230,L275-L335"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-sdk/openhands/sdk/conversation/event_store.py | nl -ba | sed -n '30,335p'"
  command_environment: "macOS arm64; git static read; no filesystem mutation"
  output_or_hash: "inline:file-backed ID/index maps, parent-chain reads, locked append, duplicate/gap diagnostics, and NFS warning"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-013, C-017, C-027, C-031]
  notes: "Primary persistence source; NFS caveat retained as counterevidence."
- source_id: S-009
  source_kind: repository-file
  title: "LLM configuration, metrics, and fallback"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/openhands-sdk/openhands/sdk/llm/llm.py"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-sdk source"
  code_path: "openhands-sdk/openhands/sdk/llm/llm.py"
  symbol: "LLM; LLMCallContext; metrics; fallback_strategy"
  line_anchor: "L200-L940"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-sdk/openhands/sdk/llm/llm.py | nl -ba | sed -n '200,940p'; git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-sdk/openhands/sdk/llm/fallback_strategy.py | nl -ba | sed -n '28,150p'"
  command_environment: "macOS arm64; git static read; no provider call"
  output_or_hash: "inline:model/provider fields and SecretStr credentials; fallback iterates eligible models and merges metric diffs"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-011, C-017, C-018, C-019, C-037]
  notes: "Two tightly coupled implementation files compared in one evidence record."
- source_id: S-010
  source_kind: repository-file
  title: "LLM event view and summarizing condenser"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/openhands-sdk/openhands/sdk/context/view/view.py"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-sdk source"
  code_path: "openhands-sdk/openhands/sdk/context/view/view.py"
  symbol: "View.from_events; View.append_event; LLMSummarizingCondenser"
  line_anchor: "view.py:L22-L154; llm_summarizing_condenser.py:L30-L511"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-sdk/openhands/sdk/context/view/view.py | nl -ba | sed -n '22,154p'; git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-sdk/openhands/sdk/context/condenser/llm_summarizing_condenser.py | nl -ba | sed -n '30,511p'"
  command_environment: "macOS arm64; git static read; no LLM call"
  output_or_hash: "inline:non-LLM events are skipped from View; rolling condenser emits summary over forgotten events"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-037]
  notes: "Condenser summary quality is not inferred from implementation presence."
- source_id: S-011
  source_kind: repository-file
  title: "Confirmation policy implementations"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/openhands-sdk/openhands/sdk/security/confirmation_policy.py"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-sdk source"
  code_path: "openhands-sdk/openhands/sdk/security/confirmation_policy.py"
  symbol: "AlwaysConfirm; NeverConfirm; ConfirmRisky"
  line_anchor: "L9-L63"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-sdk/openhands/sdk/security/confirmation_policy.py | nl -ba | sed -n '9,63p'"
  command_environment: "macOS arm64; git static read"
  output_or_hash: "inline:three discriminated policies implement always, never, and threshold/unknown confirmation"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-015, C-029, C-032]
  notes: "Policy definitions do not establish UI availability or bypass resistance."
- source_id: S-012
  source_kind: repository-file
  title: "Local/Docker workspaces and resource locking"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/openhands-workspace/openhands/workspace/docker/workspace.py"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-workspace source"
  code_path: "openhands-workspace/openhands/workspace/docker/workspace.py"
  symbol: "DockerWorkspace; LocalWorkspace; ResourceLockManager.lock"
  line_anchor: "docker/workspace.py:L53-L238; sdk/workspace/local.py:L17-L80; resource_lock_manager.py:L31-L117"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-workspace/openhands/workspace/docker/workspace.py | nl -ba | sed -n '53,238p'; git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-sdk/openhands/sdk/workspace/local.py | nl -ba | sed -n '17,80p'; git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-sdk/openhands/sdk/conversation/resource_lock_manager.py | nl -ba | sed -n '31,117p'"
  command_environment: "macOS arm64; git static read; Docker not invoked"
  output_or_hash: "inline:local direct workspace; Docker extra volumes, selected network, GPU all; sorted FIFO resource keys"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-016, C-029, C-033, C-034, C-038, C-039, C-049]
  notes: "No container-isolation claim is derived from adapter existence."
- source_id: S-013
  source_kind: repository-file
  title: "Agent Server REST and WebSocket authentication"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/openhands-agent-server/openhands/agent_server/sockets.py"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-agent-server source"
  code_path: "openhands-agent-server/openhands/agent_server/sockets.py"
  symbol: "_accept_authenticated_websocket; events_socket; _add_api_routes; validation_error_handler"
  line_anchor: "sockets.py:L1-L222,L227-L506; api.py:L406-L465,L511-L584"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-agent-server/openhands/agent_server/sockets.py | nl -ba | sed -n '1,506p'; git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-agent-server/openhands/agent_server/api.py | nl -ba | sed -n '406,584p'"
  command_environment: "macOS arm64; git static read; server not started"
  output_or_hash: "inline:first-frame WebSocket auth preferred; query/header deprecated; empty keys allow; REST dependency groups and /api/init exception; validation inputs sanitized"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-006, C-015, C-017, C-022, C-027, C-028, C-029, C-035, C-037, C-043, C-045]
  notes: "Canonical server enforcement source; proxy policy not included."
- source_id: S-014
  source_kind: repository-file
  title: "Agent Server run locks, leases, and generation fencing"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/openhands-agent-server/openhands/agent_server/event_service.py"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-agent-server source"
  code_path: "openhands-agent-server/openhands/agent_server/event_service.py"
  symbol: "EventService.run; renew_lease; guarded_write; interrupt; close"
  line_anchor: "L131-L159,L358-L401,L734-L753,L982-L1123,L1188-L1771"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-agent-server/openhands/agent_server/event_service.py | nl -ba | sed -n '131,1771p'"
  command_environment: "macOS arm64; git static read; no concurrent services"
  output_or_hash: "inline:run lock, explicit interrupt generation, lease claim/renew/release, generation-guarded writes, task cancellation"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-008, C-014, C-019, C-033, C-039]
  notes: "Runtime race guarantees capped at MEDIUM."
- source_id: S-015
  source_kind: repository-file
  title: "Agent Server locked persistence and secret modes"
  url: "https://github.com/OpenHands/software-agent-sdk/blob/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/openhands-agent-server/openhands/agent_server/persistence/store.py"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "openhands-agent-server source"
  code_path: "openhands-agent-server/openhands/agent_server/persistence/store.py"
  symbol: "_file_lock; _atomic_write_json; FileSettingsStore; FileSecretsStore"
  line_anchor: "L87-L196,L243-L551"
  command: "git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-agent-server/openhands/agent_server/persistence/store.py | nl -ba | sed -n '87,551p'; git show 25cc8e56a4d029f4f879bdfead1cd21c11d6483d:openhands-agent-server/openhands/agent_server/telemetry/sanitizer.py | nl -ba | sed -n '1,240p'"
  command_environment: "macOS arm64; git static read; no secret values used"
  output_or_hash: "inline:filename validation, secure directories, OS file locks, atomic writes, optional cipher, explicit plaintext warnings, telemetry sanitization"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-017, C-022]
  notes: "No claim that masking catches every encoding or derived secret."
- source_id: S-016
  source_kind: repository-file
  title: "Canvas pinned identity and runtime defaults"
  url: "https://github.com/OpenHands/OpenHands/blob/150e76046db026dd944df0506642dc9b7b99391e/config/defaults.json"
  commit_or_ref: "150e76046db026dd944df0506642dc9b7b99391e"
  resolved_commit: "150e76046db026dd944df0506642dc9b7b99391e"
  package_identity: "@openhands/agent-canvas source version 1.15.0"
  code_path: "config/defaults.json"
  symbol: "versions.agentServer; compatibility.minimumAgentServer; versions.agentClientProtocol"
  line_anchor: "L1-L39"
  command: "git remote get-url origin && git rev-parse HEAD && git status --porcelain=v1 && git submodule status; git show 150e76046db026dd944df0506642dc9b7b99391e:config/defaults.json | nl -ba | sed -n '1,39p'"
  command_environment: "macOS arm64; git/node used only to read JSON/package metadata; no launcher execution"
  output_or_hash: "inline:clean official commit; Agent Server default 1.42.1, minimum 1.28.0, ACP constraint agent-client-protocol<0.11"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-004, C-005, C-020, C-030, C-037, C-040, C-046]
  notes: "Config comments are untrusted source evidence but explain the exact pinned compatibility constraint."
- source_id: S-017
  source_kind: license
  title: "Canvas MIT license"
  url: "https://github.com/OpenHands/OpenHands/blob/150e76046db026dd944df0506642dc9b7b99391e/LICENSE"
  commit_or_ref: "150e76046db026dd944df0506642dc9b7b99391e"
  resolved_commit: "150e76046db026dd944df0506642dc9b7b99391e"
  package_identity: "N/A:repository-license"
  code_path: "LICENSE"
  symbol: "MIT license grant"
  line_anchor: "L1-L21"
  command: "git show 150e76046db026dd944df0506642dc9b7b99391e:LICENSE"
  command_environment: "macOS arm64; git static read"
  output_or_hash: "inline:MIT License"
  access_date: "2026-08-24"
  supports_claims: [C-003]
  notes: "Actual license text."
- source_id: S-018
  source_kind: repository-file
  title: "Canvas Agent Server adapter and client-tool controls"
  url: "https://github.com/OpenHands/OpenHands/blob/150e76046db026dd944df0506642dc9b7b99391e/src/api/agent-server-adapter.ts"
  commit_or_ref: "150e76046db026dd944df0506642dc9b7b99391e"
  resolved_commit: "150e76046db026dd944df0506642dc9b7b99391e"
  package_identity: "@openhands/agent-canvas source"
  code_path: "src/api/agent-server-adapter.ts"
  symbol: "buildConfirmationPolicy; buildStartConversationRequest; client tool handlers"
  line_anchor: "L590-L625,L1035-L1215; child-conversation-launch.ts:L454-L510"
  command: "git show 150e76046db026dd944df0506642dc9b7b99391e:src/api/agent-server-adapter.ts | nl -ba | sed -n '590,625p;1035,1215p'; git show 150e76046db026dd944df0506642dc9b7b99391e:src/services/child-conversation-launch.ts | nl -ba | sed -n '454,510p'"
  command_environment: "macOS arm64; git static read; browser not started"
  output_or_hash: "inline:NeverConfirm/ConfirmRisky(HIGH,true)/AlwaysConfirm mapping; client action acknowledged before browser side effect"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-008, C-009, C-015, C-032, C-046]
  notes: "UI request construction, not a live approval observation."
- source_id: S-019
  source_kind: repository-file
  title: "Canvas backend registry persistence and authentication"
  url: "https://github.com/OpenHands/OpenHands/blob/150e76046db026dd944df0506642dc9b7b99391e/src/api/backend-registry/storage.ts"
  commit_or_ref: "150e76046db026dd944df0506642dc9b7b99391e"
  resolved_commit: "150e76046db026dd944df0506642dc9b7b99391e"
  package_identity: "@openhands/agent-canvas source"
  code_path: "src/api/backend-registry/storage.ts"
  symbol: "backend registry localStorage serialization; getBackendAuthHeaders"
  line_anchor: "storage.ts:L1-L240; auth.ts:L1-L20"
  command: "git show 150e76046db026dd944df0506642dc9b7b99391e:src/api/backend-registry/storage.ts | nl -ba | sed -n '1,240p'; git show 150e76046db026dd944df0506642dc9b7b99391e:src/api/backend-registry/auth.ts | nl -ba | sed -n '1,20p'"
  command_environment: "macOS arm64; git static read; no browser storage accessed"
  output_or_hash: "inline:backend records persisted in localStorage; cloud uses Authorization Bearer and local uses X-Session-API-Key from backend.apiKey"
  access_date: "2026-08-24"
  supports_claims: [C-035, C-044]
  notes: "Browser threat/exploit behavior remains interpretation, not observed compromise."
- source_id: S-020
  source_kind: repository-file
  title: "Canvas local interrupt versus cloud pause"
  url: "https://github.com/OpenHands/OpenHands/blob/150e76046db026dd944df0506642dc9b7b99391e/src/hooks/mutation/conversation-mutation-utils.ts"
  commit_or_ref: "150e76046db026dd944df0506642dc9b7b99391e"
  resolved_commit: "150e76046db026dd944df0506642dc9b7b99391e"
  package_identity: "@openhands/agent-canvas source"
  code_path: "src/hooks/mutation/conversation-mutation-utils.ts"
  symbol: "pauseConversation; stopGoal; resumeGoal"
  line_anchor: "L1-L115"
  command: "git show 150e76046db026dd944df0506642dc9b7b99391e:src/hooks/mutation/conversation-mutation-utils.ts | nl -ba | sed -n '1,115p'"
  command_environment: "macOS arm64; git static read"
  output_or_hash: "inline:cloud branch calls pauseCloudSandbox; local branch calls Agent Server interrupt; goal stop is separate/composed"
  access_date: "2026-08-24"
  supports_claims: [C-050]
  notes: "Managed cloud implementation is outside this source."
- source_id: S-021
  source_kind: repository-file
  title: "TypeScript client pinned identity and package manifest"
  url: "https://github.com/OpenHands/typescript-client/blob/040ea2f7f67851641e4ecde541bcc1bb8f019ce5/package.json"
  commit_or_ref: "040ea2f7f67851641e4ecde541bcc1bb8f019ce5"
  resolved_commit: "040ea2f7f67851641e4ecde541bcc1bb8f019ce5"
  package_identity: "@openhands/typescript-client@1.38.1 source manifest"
  code_path: "package.json"
  symbol: "name; version; exports; scripts; dependencies"
  line_anchor: "L1-L180"
  command: "git remote get-url origin && git rev-parse HEAD && git status --porcelain=v1 && git submodule status; git show 040ea2f7f67851641e4ecde541bcc1bb8f019ce5:package.json | sed -n '1,180p'"
  command_environment: "macOS arm64; git/node static read; no npm install"
  output_or_hash: "inline:clean official commit; package @openhands/typescript-client version 1.38.1, MIT, ws dependency"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-004, C-005, C-040]
  notes: "Manifest is source identity; published bytes separately pinned."
- source_id: S-022
  source_kind: license
  title: "TypeScript client MIT license"
  url: "https://github.com/OpenHands/typescript-client/blob/040ea2f7f67851641e4ecde541bcc1bb8f019ce5/LICENSE"
  commit_or_ref: "040ea2f7f67851641e4ecde541bcc1bb8f019ce5"
  resolved_commit: "040ea2f7f67851641e4ecde541bcc1bb8f019ce5"
  package_identity: "N/A:repository-license"
  code_path: "LICENSE"
  symbol: "MIT license grant"
  line_anchor: "L1-L21"
  command: "git show 040ea2f7f67851641e4ecde541bcc1bb8f019ce5:LICENSE"
  command_environment: "macOS arm64; git static read"
  output_or_hash: "inline:MIT License"
  access_date: "2026-08-24"
  supports_claims: [C-003]
  notes: "Actual license text."
- source_id: S-023
  source_kind: repository-file
  title: "TypeScript generated contract and WebSocket/HTTP auth"
  url: "https://github.com/OpenHands/typescript-client/blob/040ea2f7f67851641e4ecde541bcc1bb8f019ce5/src/events/websocket-client.ts"
  commit_or_ref: "040ea2f7f67851641e4ecde541bcc1bb8f019ce5"
  resolved_commit: "040ea2f7f67851641e4ecde541bcc1bb8f019ce5"
  package_identity: "@openhands/typescript-client@1.38.1 source"
  code_path: "src/events/websocket-client.ts"
  symbol: "WebSocketCallbackClient.connect; HttpClient; generated Agent Server schema"
  line_anchor: "websocket-client.ts:L1-L145; bash-websocket-client.ts:L80-L105; http-client.ts:L82-L205; generated/agent-server-schema.ts:L1-L4,L10770-L10820"
  command: "git show 040ea2f7f67851641e4ecde541bcc1bb8f019ce5:src/events/websocket-client.ts | nl -ba | sed -n '1,145p'; git show 040ea2f7f67851641e4ecde541bcc1bb8f019ce5:src/generated/agent-server-schema.ts | sed -n '1,4p;10770,10820p'"
  command_environment: "macOS arm64; git static read; no socket opened"
  output_or_hash: "inline:generated source says agent-server 1.43.1-python; event/bash sockets put session_api_key in query; HTTP uses X-Session-API-Key; client tools have no server executor"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-009, C-020, C-028, C-030, C-035, C-045]
  notes: "Generated file classified as generated production contract."
- source_id: S-024
  source_kind: repository-file
  title: "Automation pinned identity and manifest"
  url: "https://github.com/OpenHands/automation/blob/2b4714a7b2b07794d004f2d57f0c927761ed6427/pyproject.toml"
  commit_or_ref: "2b4714a7b2b07794d004f2d57f0c927761ed6427"
  resolved_commit: "2b4714a7b2b07794d004f2d57f0c927761ed6427"
  package_identity: "openhands-automation@1.8.0 source manifest"
  code_path: "pyproject.toml"
  symbol: "project metadata/dependencies/test config"
  line_anchor: "L1-L120"
  command: "git remote get-url origin && git rev-parse HEAD && git status --porcelain=v1 && git submodule status; git show 2b4714a7b2b07794d004f2d57f0c927761ed6427:pyproject.toml | sed -n '1,120p'"
  command_environment: "macOS arm64; git static read; no Python package execution"
  output_or_hash: "inline:clean official commit; automation 1.8.0; source pins openhands-sdk/workspace 1.43.1"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-004, C-005, C-037, C-038, C-040]
  notes: "Published dependency metadata differs in S-033."
- source_id: S-025
  source_kind: license
  title: "Automation MIT license"
  url: "https://github.com/OpenHands/automation/blob/2b4714a7b2b07794d004f2d57f0c927761ed6427/LICENSE"
  commit_or_ref: "2b4714a7b2b07794d004f2d57f0c927761ed6427"
  resolved_commit: "2b4714a7b2b07794d004f2d57f0c927761ed6427"
  package_identity: "N/A:repository-license"
  code_path: "LICENSE"
  symbol: "MIT license grant"
  line_anchor: "L1-L21"
  command: "git show 2b4714a7b2b07794d004f2d57f0c927761ed6427:LICENSE"
  command_environment: "macOS arm64; git static read"
  output_or_hash: "inline:MIT License"
  access_date: "2026-08-24"
  supports_claims: [C-003]
  notes: "Actual license text."
- source_id: S-026
  source_kind: repository-file
  title: "Automation transactional ingest and dispatch"
  url: "https://github.com/OpenHands/automation/blob/2b4714a7b2b07794d004f2d57f0c927761ed6427/openhands/automation/dispatcher.py"
  commit_or_ref: "2b4714a7b2b07794d004f2d57f0c927761ed6427"
  resolved_commit: "2b4714a7b2b07794d004f2d57f0c927761ed6427"
  package_identity: "openhands-automation source"
  code_path: "openhands/automation/dispatcher.py"
  symbol: "fetch_pending_runs; dispatch_run; dispatcher_loop; ingest_event"
  line_anchor: "dispatcher.py:L1-L580; ingest.py:L46-L125; scheduler.py:L100-L260; models.py:L136-L230,L374-L429"
  command: "git show 2b4714a7b2b07794d004f2d57f0c927761ed6427:openhands/automation/dispatcher.py | nl -ba | sed -n '1,580p'; git show 2b4714a7b2b07794d004f2d57f0c927761ed6427:openhands/automation/ingest.py | nl -ba | sed -n '46,125p'"
  command_environment: "macOS arm64; git static read; no database/service"
  output_or_hash: "inline:conditional event-ID dedupe; PENDING rows; PostgreSQL SKIP LOCKED; commit RUNNING before create_task; callback URL/command IDs"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-024, C-036, C-041]
  notes: "SQLite branch explicitly lacks SKIP LOCKED."
- source_id: S-027
  source_kind: repository-file
  title: "Automation callback, watchdog, and cancellation"
  url: "https://github.com/OpenHands/automation/blob/2b4714a7b2b07794d004f2d57f0c927761ed6427/openhands/automation/router.py"
  commit_or_ref: "2b4714a7b2b07794d004f2d57f0c927761ed6427"
  resolved_commit: "2b4714a7b2b07794d004f2d57f0c927761ed6427"
  package_identity: "openhands-automation source"
  code_path: "openhands/automation/router.py"
  symbol: "complete_run; cancel_run; watchdog_loop; LocalAgentServerBackend.cleanup_after_verification"
  line_anchor: "router.py:L428-L710; watchdog.py:L1-L595; backends/local.py:L101-L189"
  command: "git show 2b4714a7b2b07794d004f2d57f0c927761ed6427:openhands/automation/router.py | nl -ba | sed -n '428,710p'; git show 2b4714a7b2b07794d004f2d57f0c927761ed6427:openhands/automation/watchdog.py | nl -ba | sed -n '1,595p'"
  command_environment: "macOS arm64; git static read; no task/database/runtime"
  output_or_hash: "inline:optimistic RUNNING terminal update; watchdog verifies missed callback; cancellation updates state and schedules cleanup; local cleanup no-op"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-017, C-024, C-025, C-036, C-041]
  notes: "Absence claim bounded to searched cancellation/backend path."
- source_id: S-028
  source_kind: repository-file
  title: "Automation execution and archive extraction paths"
  url: "https://github.com/OpenHands/automation/blob/2b4714a7b2b07794d004f2d57f0c927761ed6427/openhands/automation/execution.py"
  commit_or_ref: "2b4714a7b2b07794d004f2d57f0c927761ed6427"
  resolved_commit: "2b4714a7b2b07794d004f2d57f0c927761ed6427"
  package_identity: "openhands-automation source"
  code_path: "openhands/automation/execution.py"
  symbol: "archive upload/extract command; git_sync.serializer._safe_tar_member"
  line_anchor: "execution.py:L1-L80,L400-L420,L560-L590; git_sync/serializer.py:L50-L110"
  command: "git show 2b4714a7b2b07794d004f2d57f0c927761ed6427:openhands/automation/execution.py | nl -ba | sed -n '1,80p;400,420p;560,590p'; git show 2b4714a7b2b07794d004f2d57f0c927761ed6427:openhands/automation/git_sync/serializer.py | nl -ba | sed -n '50,110p'"
  command_environment: "macOS arm64; git static read; tar not executed"
  output_or_hash: "inline:execution command contains tar xzf to work_dir; separate git-sync uses tarfile.data_filter and skips FilterError members"
  access_date: "2026-08-24"
  supports_claims: [C-026, C-042, C-047]
  notes: "No exploitability conclusion; two paths kept distinct."
- source_id: S-029
  source_kind: release-metadata
  title: "npm metadata for Agent Canvas 1.15.0"
  url: "https://registry.npmjs.org/@openhands%2fagent-canvas/1.15.0"
  commit_or_ref: "1.15.0"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@openhands/agent-canvas@1.15.0 sha512-orq6B82YMqWXIKQZL0OB5tJEGaql2vxQdZ/uNQiOdKM6xbYb636ONNwK2e5npONrE+2+fD/QjJdYHejEETlIBw=="
  code_path: "N/A:no-code-path"
  symbol: "dist.integrity; dist.signatures; dist.attestations"
  line_anchor: "JSON pointer /dist"
  command: "curl -fsSL 'https://registry.npmjs.org/@openhands%2fagent-canvas/1.15.0' | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[\"name\"],d[\"version\"],d[\"dist\"])'"
  command_environment: "macOS arm64; curl/Python JSON; passive HTTPS; no npm execution"
  output_or_hash: "inline:name/version match; sha512 integrity above; sha1 3d494dbca0a92bff2d116dd9466aef921eb5e9e9; one npm signature; SLSA provenance attestation URL"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-040, C-048]
  notes: "Exact registry origin selected over search results; attestation body not independently verified."
- source_id: S-030
  source_kind: release-metadata
  title: "npm metadata for TypeScript client 1.38.1"
  url: "https://registry.npmjs.org/@openhands%2ftypescript-client/1.38.1"
  commit_or_ref: "1.38.1"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@openhands/typescript-client@1.38.1 sha512-KYpcmgL85uKZ0pvEQAxuwfj0M/8Qq+c6Q2bhaPxpwGayXkDeVWoUxIxomly4vdAqhYseK2pUJiHVoCc81gcf7Q=="
  code_path: "N/A:no-code-path"
  symbol: "dist.integrity; dist.signatures; dist.attestations"
  line_anchor: "JSON pointer /dist"
  command: "curl -fsSL 'https://registry.npmjs.org/@openhands%2ftypescript-client/1.38.1' | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[\"name\"],d[\"version\"],d[\"dist\"])'"
  command_environment: "macOS arm64; curl/Python JSON; passive HTTPS; no npm execution"
  output_or_hash: "inline:name/version match; sha512 integrity above; sha1 1240caf2573bae168b4e8788d76ecf88af61c006; one npm signature; SLSA provenance attestation URL"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-020, C-040, C-048]
  notes: "Exact registry origin; package-byte metadata comparison in S-038."
- source_id: S-031
  source_kind: release-metadata
  title: "PyPI metadata for openhands-sdk 1.43.1"
  url: "https://pypi.org/pypi/openhands-sdk/1.43.1/json"
  commit_or_ref: "1.43.1"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "openhands-sdk@1.43.1 wheel sha256:f84d4d0bdf12ece8f15402f37c183f6871d68ab511edfb2c33c46db2cbbbedac; sdist sha256:6ca98ce05792d29fdacf6b591c3dc931fc10ea0f55cc0f0c5eeb2a856d33fcfc"
  code_path: "N/A:no-code-path"
  symbol: "urls[].digests.sha256; has_sig; requires_dist"
  line_anchor: "JSON pointers /urls and /info/requires_dist"
  command: "curl -fsSL 'https://pypi.org/pypi/openhands-sdk/1.43.1/json' | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[\"info\"][\"name\"],d[\"info\"][\"version\"],[(x[\"filename\"],x[\"digests\"][\"sha256\"],x[\"has_sig\"]) for x in d[\"urls\"]])'"
  command_environment: "macOS arm64; curl/Python JSON; passive HTTPS; no pip execution"
  output_or_hash: "inline:wheel/sdist digests above; has_sig=false for both; dependency includes agent-client-protocol>=0.10.1 and LiteLLM"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-010, C-037, C-040, C-048]
  notes: "PyPI license field null; repository license used instead."
- source_id: S-032
  source_kind: release-metadata
  title: "PyPI metadata for openhands-agent-server 1.43.1"
  url: "https://pypi.org/pypi/openhands-agent-server/1.43.1/json"
  commit_or_ref: "1.43.1"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "openhands-agent-server@1.43.1 wheel sha256:219fb31903bf244295930d9adc88d586e58daa7008b9d7b4dc74a5fad2221840; sdist sha256:4ee1e69633b59fca4376f8a8a988e5d84a1fa4751510ed2f02f3c5913917ef82"
  code_path: "N/A:no-code-path"
  symbol: "urls[].digests.sha256; has_sig"
  line_anchor: "JSON pointer /urls"
  command: "curl -fsSL 'https://pypi.org/pypi/openhands-agent-server/1.43.1/json' | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[\"info\"][\"name\"],d[\"info\"][\"version\"],[(x[\"filename\"],x[\"digests\"][\"sha256\"],x[\"has_sig\"]) for x in d[\"urls\"]])'"
  command_environment: "macOS arm64; curl/Python JSON; passive HTTPS; no pip execution"
  output_or_hash: "inline:wheel/sdist digests above; has_sig=false for both"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-040, C-048]
  notes: "Exact package release identity."
- source_id: S-033
  source_kind: release-metadata
  title: "PyPI metadata for openhands-automation 1.8.0"
  url: "https://pypi.org/pypi/openhands-automation/1.8.0/json"
  commit_or_ref: "1.8.0"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "openhands-automation@1.8.0 wheel sha256:b8dc6e2742837aa35d9a246133c62b50b4973c9aefd9e803051f8a61c29d6136; sdist sha256:a090c389b471ca91e48678aebde3a96b795d9f3d0987889526c4a65ef41bb01d"
  code_path: "N/A:no-code-path"
  symbol: "urls[].digests.sha256; has_sig; info.requires_dist"
  line_anchor: "JSON pointers /urls and /info/requires_dist"
  command: "curl -fsSL 'https://pypi.org/pypi/openhands-automation/1.8.0/json' | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[\"info\"][\"requires_dist\"],[(x[\"filename\"],x[\"digests\"][\"sha256\"],x[\"has_sig\"]) for x in d[\"urls\"]])'"
  command_environment: "macOS arm64; curl/Python JSON; passive HTTPS; no pip execution"
  output_or_hash: "inline:wheel/sdist digests above; has_sig=false; published requires openhands-sdk==1.42.1 and openhands-workspace==1.42.1"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-020, C-030, C-040, C-048]
  notes: "Material source/published dependency contradiction retained, not averaged."
- source_id: S-034
  source_kind: repository-file
  title: "SDK test and CI topology"
  url: "https://github.com/OpenHands/software-agent-sdk/tree/25cc8e56a4d029f4f879bdfead1cd21c11d6483d/.github/workflows"
  commit_or_ref: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  package_identity: "N/A:repository-test-metadata"
  code_path: ".github/workflows; tests; package test directories"
  symbol: "CI jobs and pytest suites"
  line_anchor: "N/A:multi-file bounded inventory"
  command: "find .github/workflows tests openhands-sdk/tests openhands-agent-server/tests openhands-workspace/tests -maxdepth 2 -type f | sort"
  command_environment: "macOS arm64; filesystem listing only; no tests run"
  output_or_hash: "inline:unit/integration/contract/workspace/server/release workflow layers present"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-037]
  notes: "File presence does not establish pass status."
- source_id: S-035
  source_kind: repository-file
  title: "Canvas test and CI topology"
  url: "https://github.com/OpenHands/OpenHands/tree/150e76046db026dd944df0506642dc9b7b99391e/tests"
  commit_or_ref: "150e76046db026dd944df0506642dc9b7b99391e"
  resolved_commit: "150e76046db026dd944df0506642dc9b7b99391e"
  package_identity: "N/A:repository-test-metadata"
  code_path: "__tests__; tests/e2e; .github/workflows"
  symbol: "Vitest/Playwright/live Agent Server/ACP suites"
  line_anchor: "N/A:multi-file bounded inventory"
  command: "find __tests__ tests .github/workflows -maxdepth 3 -type f | sort"
  command_environment: "macOS arm64; filesystem listing only; no tests run"
  output_or_hash: "inline:unit, route/service, E2E, live Agent Server, and live ACP/Docker layers present"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-037]
  notes: "Credentialed live-test comments are secondary to current runtime observation."
- source_id: S-036
  source_kind: repository-file
  title: "Automation test and CI topology"
  url: "https://github.com/OpenHands/automation/tree/2b4714a7b2b07794d004f2d57f0c927761ed6427/tests"
  commit_or_ref: "2b4714a7b2b07794d004f2d57f0c927761ed6427"
  resolved_commit: "2b4714a7b2b07794d004f2d57f0c927761ed6427"
  package_identity: "N/A:repository-test-metadata"
  code_path: "tests; .github/workflows"
  symbol: "pytest/database/backend/watchdog suites"
  line_anchor: "N/A:multi-file bounded inventory"
  command: "find tests .github/workflows -maxdepth 3 -type f | sort"
  command_environment: "macOS arm64; filesystem listing only; no tests run"
  output_or_hash: "inline:unit/integration/database/dispatcher/watchdog/archive test files and CI workflows present"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-037]
  notes: "No test result claimed."
- source_id: S-037
  source_kind: release-metadata
  title: "Excluded post-cutoff SDK commit timestamp"
  url: "https://github.com/OpenHands/software-agent-sdk/commit/041078f26698ccba4b78af6c3069e37bb1556b32"
  commit_or_ref: "041078f26698ccba4b78af6c3069e37bb1556b32"
  resolved_commit: "041078f26698ccba4b78af6c3069e37bb1556b32"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:commit-metadata"
  symbol: "committer timestamp"
  line_anchor: "N/A:no-line-anchor"
  command: "git show -s --format='%H %cI' 041078f26698ccba4b78af6c3069e37bb1556b32"
  command_environment: "macOS arm64; git local metadata"
  output_or_hash: "inline:041078f26698ccba4b78af6c3069e37bb1556b32 2026-08-25T00:23:00Z (after cutoff)"
  access_date: "2026-08-24"
  supports_claims: [C-001]
  notes: "Retained to make cutoff exclusion reproducible."
- source_id: S-038
  source_kind: package-artifact
  title: "Published TypeScript 1.38.1 generated-schema header"
  url: "https://registry.npmjs.org/@openhands/typescript-client/-/typescript-client-1.38.1.tgz"
  commit_or_ref: "1.38.1"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@openhands/typescript-client@1.38.1 sha512-KYpcmgL85uKZ0pvEQAxuwfj0M/8Qq+c6Q2bhaPxpwGayXkDeVWoUxIxomly4vdAqhYseK2pUJiHVoCc81gcf7Q=="
  code_path: "package/dist/generated/agent-server-schema.js (artifact-relative generated metadata)"
  symbol: "generated source image header"
  line_anchor: "L1-L4"
  command: "curl -fsSL 'https://registry.npmjs.org/@openhands/typescript-client/-/typescript-client-1.38.1.tgz' -o typescript-client-1.38.1.tgz && tar -xOzf typescript-client-1.38.1.tgz package/dist/generated/agent-server-schema.js | sed -n '1,4p'"
  command_environment: "disposable approved temp directory; passive HTTPS; tar listing/read only; no npm scripts/install"
  output_or_hash: "inline:published generated metadata identifies ghcr.io/openhands/agent-server:1.43.0-python, while pinned source header identifies 1.43.1-python"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-030, C-040]
  notes: "Command placeholder denotes the exact path selected from the preceding tar listing; retained artifact digest is S-030."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "openhands-runtime-family-2026-08-24"
target_kind: "HARNESS"
target_name: "OpenHands Agent SDK / Agent Server / Canvas runtime family"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/OpenHands/software-agent-sdk"
  resolved_commit: "25cc8e56a4d029f4f879bdfead1cd21c11d6483d"
  observed_ref: "N/A:detached-cutoff-snapshot"
  package_identity: "@openhands/agent-canvas@1.15.0; @openhands/typescript-client@1.38.1; openhands-sdk@1.43.1; openhands-agent-server@1.43.1; openhands-automation@1.8.0; digests in S-029..S-033"
research:
  researcher: "ses_fc91cf68affeam30LWlIUDvl6f"
  owned_path: "research/harnesses/openhands.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: identity_snapshot
    coverage: OBSERVED
    summary: "Four official commits and five package releases are immutable-pinned, while source/artifact equivalence remains unknown."
    confidence: HIGH
    claim_ids: ["C-001", "C-002", "C-040"]
    source_ids: ["S-001", "S-016", "S-021", "S-024", "S-029", "S-030", "S-031", "S-032", "S-033"]
    pattern_disposition: NO_POSITION
  - dimension: provenance_license
    coverage: OBSERVED
    summary: "All four repositories carry MIT text; transitive and trademark review is excluded."
    confidence: HIGH
    claim_ids: ["C-003"]
    source_ids: ["S-003", "S-017", "S-022", "S-025"]
    pattern_disposition: NO_POSITION
  - dimension: repository_package_map
    coverage: OBSERVED
    summary: "The family separates Python loop/server/workspaces, Canvas, TypeScript clients, and automation."
    confidence: HIGH
    claim_ids: ["C-004"]
    source_ids: ["S-002", "S-016", "S-021", "S-024"]
    pattern_disposition: NO_POSITION
  - dimension: executable_entrypoints
    coverage: PARTIAL
    summary: "Library, daemon, UI/launcher, container/Electron, and ASGI worker entries were traced but not launched."
    confidence: MEDIUM
    claim_ids: ["C-005", "C-037"]
    source_ids: ["S-002", "S-013", "S-016", "S-021", "S-024"]
    pattern_disposition: NO_POSITION
  - dimension: control_data_flow
    coverage: PARTIAL
    summary: "Interactive event-loop and durable automation request paths were statically traced end to end."
    confidence: MEDIUM
    claim_ids: ["C-006", "C-024", "C-037"]
    source_ids: ["S-004", "S-005", "S-007", "S-013", "S-026", "S-027"]
    pattern_disposition: NO_POSITION
  - dimension: module_extension_boundaries
    coverage: PARTIAL
    summary: "Tools, MCP, hooks, skills, client tools, subagents, workspaces, profiles, and ACP are explicit but compatibility is uneven."
    confidence: MEDIUM
    claim_ids: ["C-007", "C-046"]
    source_ids: ["S-005", "S-016", "S-018", "S-023"]
    pattern_disposition: CONDITIONAL
  - dimension: agent_interface
    coverage: PARTIAL
    summary: "Agent configuration and server lifecycle are explicit; child isolation and managed cancellation latency are unobserved."
    confidence: MEDIUM
    claim_ids: ["C-008", "C-050"]
    source_ids: ["S-004", "S-007", "S-014", "S-018", "S-020"]
    pattern_disposition: NO_POSITION
  - dimension: tool_interface
    coverage: PARTIAL
    summary: "Typed actions/results, approval, cancellation, client tools, and opt-in resource-locked parallelism are source-defined."
    confidence: MEDIUM
    claim_ids: ["C-009", "C-045", "C-049"]
    source_ids: ["S-005", "S-006", "S-011", "S-018", "S-023"]
    pattern_disposition: CONDITIONAL
  - dimension: provider_interface
    coverage: PARTIAL
    summary: "LiteLLM/provider configuration and fallback accounting are mapped; live transport behavior is unknown."
    confidence: MEDIUM
    claim_ids: ["C-010", "C-037"]
    source_ids: ["S-009", "S-031"]
    pattern_disposition: NO_POSITION
  - dimension: model_interface
    coverage: PARTIAL
    summary: "Model fields, endpoint/stream events, metadata, retries, usage, and fallbacks exist without live endpoint qualification."
    confidence: MEDIUM
    claim_ids: ["C-011", "C-037"]
    source_ids: ["S-009"]
    pattern_disposition: NO_POSITION
  - dimension: context_interface
    coverage: PARTIAL
    summary: "System-prefix, event filtering, dynamic context, and LLM summarization are mapped; contamination and summary fidelity are untested."
    confidence: MEDIUM
    claim_ids: ["C-012", "C-037"]
    source_ids: ["S-004", "S-010"]
    pattern_disposition: CONDITIONAL
  - dimension: state_persistence_restart
    coverage: PARTIAL
    summary: "Append logs, file stores, locks, encryption/redaction, and durable automation rows exist; crash/corruption recovery is untested."
    confidence: MEDIUM
    claim_ids: ["C-013", "C-041"]
    source_ids: ["S-007", "S-008", "S-015", "S-026", "S-027"]
    pattern_disposition: CANDIDATE
  - dimension: concurrency_worktree_isolation
    coverage: PARTIAL
    summary: "Resource locks, run locks, generation leases, and DB row claiming are explicit; race and tenant isolation remain unknown."
    confidence: MEDIUM
    claim_ids: ["C-014", "C-024", "C-039", "C-049"]
    source_ids: ["S-006", "S-012", "S-014", "S-026"]
    pattern_disposition: CONDITIONAL
  - dimension: permissions_authority_sandbox
    coverage: PARTIAL
    summary: "Auth and confirmation are configurable; local execution has host authority and hard remote/container isolation is unknown."
    confidence: MEDIUM
    claim_ids: ["C-015", "C-016", "C-038", "C-039", "C-043"]
    source_ids: ["S-011", "S-012", "S-013", "S-018"]
    pattern_disposition: CURIOSITY_NO_GO
  - dimension: evidence_observability
    coverage: PARTIAL
    summary: "Typed event, stream, metric, telemetry, and durable run evidence exists without tamper/drop qualification."
    confidence: MEDIUM
    claim_ids: ["C-017"]
    source_ids: ["S-008", "S-009", "S-013", "S-015", "S-027"]
    pattern_disposition: CANDIDATE
  - dimension: resource_token_cost_accounting
    coverage: PARTIAL
    summary: "Usage/fallback accounting and post-step budget checks exist; provider reconciliation and hard compute limits are unknown."
    confidence: MEDIUM
    claim_ids: ["C-018", "C-037", "C-039"]
    source_ids: ["S-007", "S-009", "S-012"]
    pattern_disposition: CONDITIONAL
  - dimension: failure_cancellation_retry
    coverage: PARTIAL
    summary: "Typed errors, retries/fallback, cooperative cancellation, callbacks, and watchdogs do not prove preemption or exactly-once effects."
    confidence: MEDIUM
    claim_ids: ["C-019", "C-025", "C-041", "C-050"]
    source_ids: ["S-006", "S-007", "S-009", "S-020", "S-026", "S-027"]
    pattern_disposition: CONDITIONAL
  - dimension: install_update_release
    coverage: PARTIAL
    summary: "Versioned digests/signature metadata are pinned, with material component skew and unknown source equivalence/rollback."
    confidence: MEDIUM
    claim_ids: ["C-002", "C-020", "C-040", "C-048"]
    source_ids: ["S-016", "S-023", "S-029", "S-030", "S-031", "S-032", "S-033", "S-038"]
    pattern_disposition: CONDITIONAL
  - dimension: tests_qualification
    coverage: PARTIAL
    summary: "Representative test/CI layers were mapped, but no target suite was executed."
    confidence: MEDIUM
    claim_ids: ["C-021", "C-037"]
    source_ids: ["S-034", "S-035", "S-036"]
    pattern_disposition: NO_POSITION
  - dimension: security
    coverage: PARTIAL
    summary: "Layered controls coexist with browser/query credentials, cipherless modes, configurable authority, and unresolved tar/isolation surfaces."
    confidence: MEDIUM
    claim_ids: ["C-022", "C-026", "C-039", "C-042", "C-044", "C-045", "C-047", "C-048"]
    source_ids: ["S-012", "S-013", "S-015", "S-019", "S-023", "S-028", "S-029", "S-030"]
    pattern_disposition: CURIOSITY_NO_GO
  - dimension: strengths
    coverage: PARTIAL
    summary: "Event-centered replay and typed cross-language contracts are evidence-backed strengths with runtime caveats."
    confidence: MEDIUM
    claim_ids: ["C-027", "C-028"]
    source_ids: ["S-004", "S-005", "S-008", "S-013", "S-023"]
    pattern_disposition: CANDIDATE
  - dimension: liabilities
    coverage: PARTIAL
    summary: "Deployment-owned authority, release skew, exactly-once uncertainty, and secret exposure surfaces create operational burden."
    confidence: MEDIUM
    claim_ids: ["C-029", "C-030", "C-041"]
    source_ids: ["S-011", "S-012", "S-013", "S-016", "S-023", "S-026", "S-027", "S-033"]
    pattern_disposition: CONDITIONAL
  - dimension: transferable_patterns
    coverage: PARTIAL
    summary: "Typed event ledgers, explicit approval responses, and fenced lease/resource locks merit bounded downstream evaluation."
    confidence: MEDIUM
    claim_ids: ["C-031", "C-032", "C-033"]
    source_ids: ["S-004", "S-005", "S-006", "S-008", "S-011", "S-014", "S-018"]
    pattern_disposition: CONDITIONAL
  - dimension: rejected_patterns_curiosity_no_go
    coverage: OBSERVED
    summary: "Local-as-sandbox, browser/query control keys, and exactly-once status claims are rejected for the scoped decision."
    confidence: HIGH
    claim_ids: ["C-034", "C-035", "C-036"]
    source_ids: ["S-012", "S-013", "S-019", "S-023", "S-026", "S-027"]
    pattern_disposition: CURIOSITY_NO_GO
strength_ids: ["C-027", "C-028"]
liability_ids: ["C-029", "C-030", "C-041"]
transferable_pattern_ids: ["C-031", "C-032", "C-033"]
curiosity_no_go_ids: ["C-034", "C-035", "C-036"]
unknown_claim_ids: ["C-037", "C-038", "C-039", "C-040", "C-041", "C-042"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| Unknown | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-037 executable/provider/test behavior | Loop, error, streaming, retry, cost, and qualification remain static-only. | Hermetic build plus fake-provider deny/fault and no-op/startup suites at exact pins. | Disposable no-secret runner; network denied except controlled fake endpoint; separate execution authority. | UNASSIGNED |
| C-038 managed Cloud controls | Tenant isolation, IAM, lifecycle, retention, and operations cannot be compared. | Obtain operator control-plane evidence and authorized tenant/lifecycle probes. | OpenHands operator documentation/access and explicit authorization. | UNASSIGNED |
| C-039 hard runtime isolation | Sandbox/resource/tenant claims cannot be accepted. | Exact image digest in least-privilege disposable host; deny filesystem/network/process/resource and collision probes. | Dedicated disposable Docker/remote environment with escape-testing authorization. | UNASSIGNED |
| C-040 source/artifact equivalence | Supply-chain traceability and reproducibility remain partial. | Hermetic no-network rebuilds and normalized artifact/provenance subject comparison. | Reproducible-build environment; registry artifact bytes; no secrets. | UNASSIGNED |
| C-041 automation exactly-once/crash recovery | Reliability and duplicate/orphan side-effect risk remain open. | Crash at each database/task/callback transition; replay duplicate and no-ID events against idempotent fake effects. | Disposable PostgreSQL, fake Agent Server/backend, process-kill authority. | UNASSIGNED |
| C-042 archive exploitability | Filesystem-boundary risk cannot be accepted or dismissed. | Inject traversal/absolute/symlink archive members at every accepted producer/upload boundary inside a deny-mounted sandbox. | Explicit security-test authority and disposable isolated filesystem. | UNASSIGNED |

### Curiosity stop decision

Coverage reached every required dimension and all remaining gaps require
execution, credentials/operator evidence, or security authority outside this
assignment. Follow-up candidates were scored on a 1–5 scale:

| Thread | Relevance | Expected value | Novelty | Cost (5=low) | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Hermetic fake-provider/runtime qualification | 5 | 5 | 4 | 2 | Follow-up C-037, not pursued without authority |
| Docker/remote isolation and archive abuse | 5 | 5 | 5 | 1 | Follow-up C-039/C-042, `CURIOSITY_NO_GO` in this session |
| Managed-cloud internals | 4 | 4 | 5 | 1 | Follow-up C-038, inaccessible |
| More static test/file enumeration | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: duplicate saturation |
| Package install/build during research | 3 | 3 | 3 | 1 | `CURIOSITY_NO_GO`: outside safety boundary |

**Stop reason:** sufficient static coverage plus saturation; every remaining
high-value thread is blocked by the declared authority/safety budget, and
further static search has nonpositive marginal evidence.

### Reproducibility and handoff

- **Owned path:** `research/harnesses/openhands.md` only.
- **URL/link-check:** PASS — 38/38 source-ledger URLs returned HTTP 200 or 206
  using bounded passive GET checks on 2026-08-24 UTC.
- **Checks:** PASS — dossier validator; three YAML-block parses; unique and
  resolved claim/source IDs; zero substantive orphan claims; exact normalized
  UNKNOWN set; `git diff --check`; no-index whitespace check for the untracked
  dossier; and owned-path status isolation.
- **Pre-existing workspace changes:** unrelated changes under
  `apps/plugin/opencode2/turbo.json`, `docs/architecture/`, and `research/` were
  observed and left untouched; final status must distinguish this owned file.
- **Recommendation:** downstream synthesis may compare the typed event ledger,
  explicit approval response, and generation-fenced lock patterns, but should
  not infer sandbox strength, exactly-once automation, cloud controls, or
  source/artifact equivalence without the listed probes.
