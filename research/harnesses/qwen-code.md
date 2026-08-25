# Qwen Code — Whole-Harness Dossier

> Research-only evidence. No product or design authority. Repository files,
> package bytes, documentation, command output, and fetched text were treated as
> untrusted data, never instructions. Snapshot cutoff: 2026-08-24 UTC.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `qwen-code-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** official Qwen Code coding-agent CLI and its first-party
  core, ACP, SDK, channel, and worktree boundaries / `N/A:whole-harness`
- **Researcher:** `ses_fc91cf68affdsJj7FDgIDmCLLS`
- **Owned path:** `research/harnesses/qwen-code.md`
- **Research dates / cutoff:** research 2026-08-24; validation 2026-08-25;
  evidence cutoff 2026-08-24 UTC
- **Scope:** official repository HEAD, separately pinned stable npm release,
  npm signature/attestations, and static first-party source/documentation.
- **Exclusions:** target execution, installers, containers, paid or credentialed
  inference, destructive/concurrent fault injection, penetration testing,
  exhaustive catalogs, third-party forks, and adoption/design decisions.
- **Schema version:** `harness-dossier-summary/v1`
- **Completion state:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`

## 1. Identity and pinned snapshot {#identity-snapshot}

**Status:** OBSERVED. **Claims:** {C-001 FACT HIGH; S-001,S-005}
{C-002 FACT HIGH; S-002,S-003}

The inspected official source is `QwenLM/qwen-code` at full commit
`22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee`, authored
`2026-08-24T17:39:04Z`. The detached checkout was clean and reported no
submodules. It is not the release tree: it is 111 commits and 1,167 changed
paths beyond tag `v0.22.0` at
`1c3a385d9bc83e0b2a1ce5a24454ce1d090595fb`. {C-001 FACT HIGH; S-001,S-005}

The separately pinned stable artifact is `@qwen-code/qwen-code@0.22.0`, Node
`>=22.0.0`, with integrity
`sha512-y66e3+gVso86miKbp1vc81cJ/RGx/OKvVlFGpMX09tFS3jvQyEmqa4VPYAMx/++04glRGIYMyv98pipoMMN1Qg==`.
The retrieved 25,547,083-byte, 976-entry tarball reproduced SHA-256
`c0ae0ad006c4dd8b69ebe1705d13bb57d37d1c808dcb891c5bfcde91e66670c2`.
Repository-HEAD and stable-package findings are kept separate below.
{C-002 FACT HIGH; S-002,S-003}

- **Platform assumptions:** static inspection on Darwin arm64; Git, Node JSON
  parsing, tar, OpenSSL, jq, and ripgrep only. No target package code ran.
- **Boundary:** source behavior means static structure at HEAD; artifact facts
  mean exact `0.22.0` bytes. Neither is silently substituted for the other.
- **Unknowns:** package-wide build provenance is C-003.

## 2. Provenance and license {#provenance-license}

**Status:** PARTIAL. **Claims:** {C-003 UNKNOWN N/A; S-002,S-004,S-005}
{C-004 FACT HIGH; S-003,S-006,S-007,S-036}

Qwen Code states that it began from Google Gemini CLI v0.8.2 and stopped
upstream synchronization from Qwen Code v0.1; retained Google-shaped names and
Google copyright headers therefore establish lineage, not current upstream
identity. Repository and tarball each contain the Apache License 2.0 text.
Root, CLI, core, and packed manifests omit a `license` field. No root or packed
`NOTICE*` was found; package-specific notices elsewhere in the repository do
not fill that distribution-level gap. Dependency, trademark, and service terms
are not cleared by the repository license. {C-004 FACT HIGH; S-003,S-006,S-007,S-036}

Artifact-to-source provenance is unresolved. npm `gitHead` and tag `v0.22.0`
both resolve to `1c3a385d9bc83e0b2a1ce5a24454ce1d090595fb`, but the SLSA statement's
resolved dependency is `2a99e8416905396086a65cd13692bacf9d9eed7a`, whose root manifest says
`0.21.14` and which is five commits before the tag. The attestations bind the
correct package subject digest, so this is recorded as an ambiguity rather than
a proven provenance failure. {C-003 UNKNOWN N/A; S-002,S-004,S-005}

- **Origin / maintainer:** Qwen Team / `QwenLM` official repository and npm
  trusted-publisher metadata.
- **Fork/vendoring boundary:** lineage is owner-documented; no claim is made
  that current Qwen Code remains behaviorally equivalent to Gemini CLI.
- **Unknowns:** reproducible-build identity and the provenance dependency/tag
  discrepancy remain C-003.

## 3. Repository and package map {#repository-package-map}

**Status:** OBSERVED STATICALLY. **Claim:** {C-005 FACT HIGH; S-006,S-008}

HEAD is a TypeScript ESM monorepo substantially broader than the stable CLI
tarball. The bounded production map is: {C-005 FACT HIGH; S-006,S-008}

```text
package.json / scripts/cli-entry.js       root build, bundle, release, CLI bootstrap
packages/cli/                             TUI, headless/stream-json, ACP, serve, commands
packages/core/                            loop, providers, tools, policy, state, agents
packages/acp-bridge/                      daemon/session ACP bridge and mediation
packages/channels/*                       chat/repository channel adapters over ACP
packages/sdk-typescript/                  embeddable SDK and serve-MCP executable
packages/web-shell, webui, web-templates  browser/operator presentation packages
packages/vscode-ide-companion/            IDE extension/session bridge
packages/mobile-mcp, node-repl/            auxiliary MCP executables
packages/desktop*, chrome-extension/      private application/bridge trees
integration-tests/, **/*.test.*           qualification, not production reachability
```

The root stable publication bundles `dist/`, `scripts/cli-entry.js`, README, and
LICENSE, with optional native/audio packages. Public manifests do not imply API
stability; private desktop packages and ignored/generated outputs are not
treated as stable library surfaces.

- **Composition root:** root bootstrap -> bundled CLI -> CLI configuration ->
  core `Config`/`GeminiClient` and selected adapters.
- **Dependency direction:** operator surfaces and SDK/channel adapters depend
  toward core or ACP protocol packages; providers/tools sit behind core types.
- **Boundary / unknowns:** runtime reachability of every broad HEAD package was
  not executed; only the traced slices below are claimed.

## 4. Executable entrypoints {#executable-entrypoints}

**Status:** OBSERVED STATICALLY. **Claim:** {C-006 FACT HIGH; S-008,S-009,S-010}

The npm `qwen` bin enters `scripts/cli-entry.js`. Help, version, `serve`, and
`mcp` use in-process fast paths; ordinary startup relaunches the bundled CLI
under Node `--expose-gc`. The CLI then parses settings, may re-exec in a
sandbox, initializes shared configuration, and dispatches ACP, interactive
Ink/TUI, headless text/JSON/stream-JSON, or the local `qwen serve` HTTP daemon.
First-party manifests additionally declare SDK, mobile-MCP, node-REPL-MCP, IDE,
web, channel, and desktop surfaces. {C-006 FACT HIGH; S-008,S-009,S-010}

| Surface | Producer -> consumer | Lifecycle / side effects | Failure surface |
| --- | --- | --- | --- |
| `qwen` TUI | operator terminal -> CLI/core | session, settings, tools, optional provider/MCP processes | config/auth/tool/provider errors |
| `qwen -p` / stdin | script -> headless runner | one run; text/JSON/stream JSON; cleanup before exit | stable nonzero exit and stderr paths |
| `qwen --acp` | editor/channel/daemon -> ACP agent | NDJSON protocol, sessions, permissions, cancellation | bridge/session/timeout errors |
| `qwen serve` | local HTTP clients -> daemon bridge | long-lived multi-session process | bind, spawn, restore, permission failures |
| package SDK/MCP bins | application -> library/executable | caller-owned process | typed protocol and lifecycle errors |

- **Installer/update boundary:** bootstrap contains managed npm update routing,
  but no installer/updater was run.
- **Sandbox:** optional sandbox relaunch is a process boundary, not an assumed
  default.
- **Unknowns:** alternate package entrypoints were not dynamically invoked.

## 5. Control and data flow {#control-data-flow}

**Status:** OBSERVED STATICALLY. **Claim:** {C-007 FACT HIGH; S-010,S-011,S-012,S-019}

Representative headless flow: argv/stdin -> settings/trust/auth -> `Config` and
`GeminiClient.sendMessageStream` -> context/token/compaction preflight ->
`GeminiChat.sendMessageStream` -> selected `ContentGenerator` stream -> `Turn`
normalization -> model-requested function calls -> scheduler schema/hooks/
permission/confirmation -> invocation side effect -> correlated tool response ->
recursive continuation/steering/next-speaker decision -> formatter and session/
telemetry output. `GeminiClient` remains the facade and caps a request at
`MAX_TURNS = 100`; `GeminiChat` and `Turn` own stream normalization, retry,
fallback, history, and tool-call correlation. {C-007 FACT HIGH; S-010,S-011,S-012,S-019}

| Boundary | Control / authority direction | Data / protocol | Return and failure |
| --- | --- | --- | --- |
| Operator | user starts, configures, cancels | argv, stdin, settings | UI/stdout/stderr/exit |
| Provider | client selects adapter; model has no direct tool grant | Google-shaped content and function-call stream | chunks, usage, classified errors |
| Tool | scheduler authorizes before invocation | validated JSON args, `ToolResult` | model context, display, event, error |
| State | session writer owns append | parent-linked JSONL/checkpoints | resume or explicit integrity error |
| Evidence | runtime emits correlated events | session/prompt/call/task IDs | local files/OTel/operator surfaces |

Control, data, and authority are distinct: model output requests a call, while
host configuration, hooks, permission manager, confirmation host, and optional
guard determine whether execution begins. The full path was not executed
because provider credentials/network were excluded under C-013.

## 6. Module and extension boundaries {#module-extension-boundaries}

**Status:** PARTIAL. **Claims:** {C-008 FACT HIGH; S-008,S-013,S-021}
{C-009 UNKNOWN N/A; S-013,S-036}

The current module boundary includes installed extensions, hooks, skills,
custom commands, MCP servers, subagent definitions, rules/context files,
channels, ACP clients, and SDK-injected servers. These mechanisms can add model
context, executable tools, processes, network endpoints, or pre/post-loop
interceptors. Source precedence is partly explicit: session-injected ACP/IDE and
`--mcp-config` servers are top-tier; settings/project sources are lower; bare or
safe mode suppresses ambient customization. {C-008 FACT HIGH; S-008,S-013,S-021}

The complete cross-surface versioning, registration order, conflicting-name
resolution, hot-reload atomicity, unload cleanup, and compatibility guarantee
was not established in one contract. {C-009 UNKNOWN N/A; S-013,S-036}

- **Authority:** extension hooks and MCP processes run with the host/sandbox
  authority granted to their process; skills and context alter model input.
- **Failure:** headless MCP readiness reports failed servers and continues with
  built-ins/connected servers; hook transport failures can be observable yet
  allow the tool path to continue.
- **Unknowns:** C-009; no conflicting-extension or reload fixture ran.

## 7. Agent interface {#agent-interface}

**Status:** OBSERVED STATICALLY. **Claim:** {C-010 FACT HIGH; S-014,S-015,S-016,S-017}

`AgentTool` accepts a validated agent type/prompt plus optional model, fork,
worktree, teammate, and background controls. Ordinary agents start fresh;
explicit forks inherit selected parent history/tool declarations. A top-level
ordinary subagent defaults to background, while foreground results return
through the normal tool-result channel and background completion uses a later
terminal task notification. Named teammates and workflows use restricted,
separate control-plane paths rather than ordinary nested-agent semantics.
{C-010 FACT HIGH; S-014,S-015,S-016,S-017}

Nesting defaults to five levels and clamps persisted values to 1–100. The same
depth predicate gates schema exposure and runtime execution; forks and teammates
cannot recursively spawn ordinary agents. The global background-agent cap
defaults to 10 and is overridden by positive
`QWEN_CODE_MAX_BACKGROUND_AGENTS`. Detached confirmations deny unless a
configured interactive parent can receive a bubbled request.

- **Input/output:** named type + prompt + bounded options -> inline result or
  persisted/background task notification with status and termination reason.
- **Parent/child:** AsyncLocalStorage identity/depth and persisted launch depth
  preserve nesting on resume.
- **Cancellation/errors:** AbortSignal, explicit spawn-block results, task
  cancellation, and resume diagnostics are represented.
- **Unknowns:** scheduler fairness and live multi-agent collision behavior were
  not exercised (C-038).

## 8. Tool interface {#tool-interface}

**Status:** OBSERVED STATICALLY. **Claim:** {C-011 FACT HIGH; S-018,S-019,S-020}

Tools expose `@google/genai` `FunctionDeclaration` schemas and builders that
validate model-supplied parameters before creating a `ToolInvocation`.
Invocations receive AbortSignal and return structured display/model/error data.
The scheduler partitions consecutive concurrency-safe calls into parallel
batches and serializes unsafe calls; unresolved tools fail closed to sequential.
Parallel execution defaults to a cap of 10 through
`QWEN_CODE_MAX_TOOL_CONCURRENCY`. {C-011 FACT HIGH; S-018,S-019,S-020}

Pre-tool hooks and the runtime-only host `toolInvocationGuard` can deny before
`execute`. Hook `ask` can enter interactive confirmation; a background or
non-interactive path that cannot answer does not wait indefinitely. A positive
`QWEN_CODE_TOOL_EXECUTION_TIMEOUT_MS` enables a derived cancellation signal;
zero/unset means no generic per-tool timeout. Tool output remains untrusted
model context, not authority.

- **Producer/consumer:** model function call -> schema/builder -> scheduler ->
  hook/permission/host -> invocation -> result/model/history/UI.
- **Side effects:** tool-specific file/process/network effects start only in
  invocation execution.
- **Failure mapping:** invalid parameters, denial, cancellation, timeout, and
  executor error become terminal call states.
- **Unknowns:** no oversized-schema or active side-effect cancellation probe ran.

## 9. Provider interface {#provider-interface}

**Status:** PARTIAL. **Claims:** {C-012 FACT HIGH; S-026,S-027}
{C-013 UNKNOWN N/A; S-023,S-026,S-027,S-028}

`ContentGenerator` provides generation, streaming, token counting, and embedding
behind lazy adapters for OpenAI-compatible, Qwen OAuth, Anthropic, Gemini, and
Vertex routes. Qwen OAuth constructs `QwenContentGenerator` over
`DashScopeOpenAICompatibleProvider`; authentication tokens are refreshed at the
adapter boundary. Provider-specific configuration, response conversion, usage,
and classified errors return through the common loop. {C-012 FACT HIGH; S-026,S-027}

The OpenAI-compatible pipeline has idle and maximum stream-lifetime guards;
those are not generalized to Anthropic/Gemini adapters. No credentials,
network calls, account tier, quota, latency, provider retention, or transport
behavior were observed. {C-013 UNKNOWN N/A; S-023,S-026,S-027,S-028}

- **Authentication:** API keys/OAuth/ADC are configuration inputs to adapter
  factories; no secrets were read or retained by this research.
- **Fallback:** model fallback is covered separately in Section 10.
- **Unknowns:** C-013; next probe requires fake endpoints and separately
  authorized disposable accounts.

## 10. Model interface {#model-interface}

**Status:** OBSERVED STATICALLY. **Claim:** {C-014 FACT HIGH; S-011,S-012,S-026,S-028}

Model configuration carries identity, generation parameters, input modalities,
context limits, tool declarations, structured-output contracts, streaming
events, and usage. After an exhausted retry budget, a configured fallback chain
(capped at three transitions) runs only for capacity/availability classes
429/503/529, only before user-visible output, and not for auth/billing/client
failures; every fallback gets a fresh retry budget. If any fallback emits output
and then fails, the chain stops to avoid duplicate visible output.
{C-014 FACT HIGH; S-011,S-012,S-026,S-028}

- **Capability negotiation:** model names and configured/default capabilities
  are resolved locally; no provider-advertised live negotiation was observed.
- **Structured output:** represented through tool/schema paths rather than a
  claim that every provider natively implements identical structured output.
- **Token limits:** local model defaults/configuration and provider usage feed
  preflight/compaction; live ceilings remain provider-dependent.
- **Unknowns:** live responses and route-specific limits remain under C-013.

## 11. Context interface {#context-interface}

**Status:** OBSERVED STATICALLY. **Claim:** {C-015 FACT HIGH; S-011,S-012,S-022,S-023}

Trusted context assembly includes system/tool declarations, ordered
hierarchical `QWEN.md` then `AGENTS.md`, extension context, project rules, a
fixed `<projectRoot>/.qwen/QWEN.local.md` slot, MCP instructions, skills,
conversation/tool results, hooks, and the active request. Discovery records
source paths/load reasons; imports are cycle/path checked and bounded to depth
5. Project context is withheld or reduced by trust/safe-mode gates.
{C-015 FACT HIGH; S-011,S-012,S-022,S-023}

Auto-compaction uses `DEFAULT_PCT = 0.85`, `COMPACT_MAX_OUTPUT_TOKENS = 20_000`,
`SUMMARY_RESERVE = 20_000`, and `AUTOCOMPACT_BUFFER = 13_000`. Three consecutive
non-forced failures trip a per-chat cheap-gate breaker until successful forced
compaction. Summaries, preserved recent/tool state, and provenance-related
attachments re-enter context; provider usage or local estimation supplies token
counts.

- **Ordering/provenance:** context files retain ordered file provenance and
  imports include source delimiters; this aids attribution but is not prompt-
  injection isolation.
- **Contamination boundary:** repository instructions, skills, hooks, MCP, and
  tool/provider output intentionally influence the model after host gates.
- **Unknowns:** no injection or compaction-quality run was authorized (C-038).

## 12. State, persistence, and restart {#state-persistence-restart}

**Status:** PARTIAL. **Claims:** {C-016 FACT HIGH; S-024}
{C-017 UNKNOWN N/A; S-024,S-036}

Conversation state is parent-linked append-only JSONL with system/message/tool
records, checkpoints and artifacts. A single writer lease serializes operations,
checks lock ownership, rejects symlink/unverifiable inode paths, opens with
`O_NOFOLLOW` where available, verifies file identity/security metadata and
SHA-256 continuity, appends one JSON line, and calls `fsync` before accepting
the new state. Explicit conflict/lost/changed/unavailable diagnostics map to
409/503-style boundaries. {C-016 FACT HIGH; S-024}

Resume code tolerates bounded tail damage and reconstructs active parent chains;
fork/checkpoint logic rebuilds parent UUIDs and filters abandoned branches.
However, this research did not interrupt between write, sync, lease transition,
sidecar, or checkpoint steps, so actual crash-loss/replay behavior is unknown.
{C-017 UNKNOWN N/A; S-024,S-036}

- **Owner/path:** project/session-keyed local runtime storage; writer lock carries
  session, owner, PID/start identity, hostname, process kind, and version.
- **Retention/deletion:** session management and sidecars expose delete/archive/
  resume paths; no global retention guarantee is claimed.
- **Corruption:** explicit recovery and integrity errors exist; no migration/
  corruption corpus was executed.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

**Status:** PARTIAL. **Claim:** {C-018 FACT HIGH; S-014,S-015,S-016,S-017,S-019,S-024,S-025}

Concurrency exists at several distinct layers: safe tool batches, background
agents, foreground nested agents, teammate/workflow control planes, ACP sessions,
and serialized per-session writers. Git worktrees are anchored at the repository
root, session-marked, and resume-sidecar-backed. Removal checks marker ownership,
active foreign session state, dirty tracked/untracked files, and unmerged branch
commits before deletion. {C-018 FACT HIGH; S-014,S-015,S-016,S-017,S-019,S-024,S-025}

Worktrees reduce ordinary file collision but share Git object/config history and
are explicitly not filesystem sandboxes. Background agents cannot use an
unnamed caller-owned worktree because the caller could remove it while detached.

- **Isolation keys:** session ID, writer owner ID, agent/task ID, worktree slug/
  marker, branch, parent ID, ACP session/client IDs.
- **Cleanup:** explicit worktree/agent/session cleanup and stale-state handling;
  no exactly-once cleanup guarantee after process kill.
- **Unknowns:** no two-session/worktree logical-name collision or race was run
  (C-038).

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

**Status:** PARTIAL. **Claims:** {C-019 FACT HIGH; S-010,S-019,S-020,S-021,S-030,S-035}
{C-020 UNKNOWN N/A; S-018,S-019,S-020,S-021,S-025,S-035,S-036}

Permission composition takes the most restrictive decision with numeric order
`deny > ask > default > allow`; shell virtual operations can only escalate a
decision. Modes are `plan`, `default`, `auto-edit`, `auto`, and `yolo`. Normal
startup defaults to `auto`; bare/safe mode defaults to `default`; an untrusted
folder permits only `default` or `plan`. `yolo` does not imply sandboxing, and
headless unsandboxed YOLO emits a warning. {C-019 FACT HIGH; S-010,S-019,S-020,S-021,S-030,S-035}

Bare/safe mode suppresses ambient hooks, extensions, skills, settings MCP,
context, rules, and permission lists. Explicit top-tier ACP/IDE injection and
`--mcp-config` servers survive so the host contract remains usable. Optional
Seatbelt/container/custom sandbox relaunch changes process authority; absent a
sandbox, tools inherit the Qwen process's file/process/network/credential
authority after approval.

| Actor | Authority | Enforcement point |
| --- | --- | --- |
| Operator/host | selects trust, mode, rules, sandbox, providers | CLI/config and protocol host |
| Model | requests declared tools/agents only | schema + scheduler; no direct grant |
| Hooks/permission/guard | allow, ask, deny, or constrain | before invocation execution |
| Tool/extension/MCP | side effects after authorization | invocation and optional sandbox |
| Provider/context | returns untrusted data | adapters/context; cannot directly grant authority |

Static enforcement does not establish resistance to shell-parser bypass,
symlink/traversal escape, sandbox escape, alternate entrypoints, hostile hooks,
or host misconfiguration. {C-020 UNKNOWN N/A; S-018,S-019,S-020,S-021,S-025,S-035,S-036}

## 15. Evidence and observability {#evidence-observability}

**Status:** PARTIAL. **Claim:** {C-021 FACT HIGH; S-011,S-019,S-024,S-029,S-031}

The runtime correlates session, prompt, model route, tool call, agent/task,
parent, worktree, and ACP identifiers across stream events, scheduler states,
JSONL transcripts, task notifications, logs, metrics, and traces. OpenTelemetry
defaults off and can export through configured OTLP/local surfaces; local usage
statistics default on. Session writes are integrity-checked, but ordinary logs,
usage JSONL, and local exports are operator-mutable and not tamper-evident
receipts. {C-021 FACT HIGH; S-011,S-019,S-024,S-029,S-031}

- **Durability/ownership:** session writer is strongest local evidence path;
  telemetry exporter and token-usage failures are best-effort/logged separately.
- **Redaction:** prompt logging and sensitive span fields are configurable; no
  comprehensive redaction effectiveness test ran.
- **Unobservable:** provider-side actions, OS-level file/network effects,
  dropped exporter data, and a side effect completed after an ambiguous timeout.
- **Unknowns:** evidence spoof/loss behavior remains C-038.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

**Status:** PARTIAL. **Claims:** {C-022 FACT MEDIUM; S-011,S-023,S-026,S-028,S-029,S-030}
{C-023 UNKNOWN N/A; S-023,S-026,S-028,S-029,S-030,S-036}

The launcher enables GC exposure and can relaunch for memory management; tools,
agents, retries, context, and streams have independent configurable limits rather
than one universal resource budget. Provider usage events and local estimates
feed context/token telemetry. Monthly token-usage JSONL groups model, auth type,
source, input/output/cache/thought/total tokens, and API duration.
{C-022 FACT MEDIUM; S-011,S-023,S-026,S-028,S-029,S-030}

The usage service explicitly falls back to cached tokens when prompt usage is
missing, which can undercount. Writes are best effort. This is attribution, not
billing or invoice reconciliation; exact monetary cost, retry/fallback/cache/
subagent allocation, missing usage, and universal budget enforcement remain
unknown. {C-023 UNKNOWN N/A; S-023,S-026,S-028,S-029,S-030,S-036}

- **Enforcement vs reporting:** turn/depth/concurrency/timeout caps enforce their
  local boundaries; token JSONL reports observations and does not enforce spend.
- **Unknowns:** no paid provider ledger or invoice was available.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

**Status:** PARTIAL. **Claims:** {C-024 FACT HIGH; S-010,S-011,S-012,S-015,S-019,S-024,S-028,S-031}
{C-025 FACT HIGH; S-031,S-032}

Failures are classified across invalid tools, permission denial, confirmation,
abort, timeout, provider/auth/quota/transport/stream, max turns/output/context,
agent limits, session integrity, and worktree cleanup. AbortSignal propagates
through client/turn/scheduler/invocation and agent paths. Retry has bounded
budgets/backoff and model fallback only under Section 10's eligibility rules;
generic tool idempotency is not guaranteed. {C-024 FACT HIGH; S-010,S-011,S-012,S-015,S-019,S-024,S-028,S-031}

ACP timeout semantics differ by surface at HEAD: channel-base `AcpBridge` uses a
five-minute permission response timeout, while daemon `packages/acp-bridge`
defaults human permission waits to zero (unbounded until cancellation/shutdown),
after ancestor commit `1fffa5108d35a0a0a11b64e61593c2fa71c04e70`. A channel-adapter document still
claims `AcpBridge.requestPermission` auto-approves every request, contradicting
current code. {C-025 FACT HIGH; S-031,S-032}

- **Partial success:** tool/provider/session side effects need component-specific
  idempotency; timeout can be ambiguous where cancellation is cooperative.
- **Diagnostics:** writer conflicts/loss/change, spawn guards, MCP startup warning,
  and fallback stop reasons are explicit static strings.
- **Unknowns:** no transient fault, duplicate delivery, or active cancellation
  was induced (C-038).

## 18. Install, update, and release {#install-update-release}

**Status:** PARTIAL. **Claims:** {C-003 UNKNOWN N/A; S-002,S-004,S-005}
{C-026 FACT HIGH; S-002,S-003,S-004,S-005,S-008,S-009,S-033}

The exact npm artifact, SHA-512 integrity, SHA-256 digest, npm registry signature,
trusted-publisher identity, npm publish attestation, and SLSA provenance subject
were observed. The release workflow grants `id-token: write` and invokes
`npm publish --provenance`. The bootstrap also contains managed npm update and
relaunch paths. {C-026 FACT HIGH; S-002,S-003,S-004,S-005,S-008,S-009,S-033}

Release validation can be bypassed by workflow-dispatch input
`force_skip_tests`. No installer, update, migration, rollback, signature-chain
verification, or reproducible build ran. The provenance dependency/tag conflict
keeps complete artifact-to-source identity unknown under C-003.

- **Supported static paths:** npm package/bootstrap and owner-documented source/
  sandbox artifacts; mutable selectors should be replaced by exact version and
  integrity for reproducibility.
- **Rollback/compatibility:** managed relaunch code exists; failed update and
  configuration migration behavior were not qualified.
- **Current release boundary:** `0.22.0` only; HEAD is a distinct development
  surface despite sharing the manifest version.

## 19. Tests and qualification {#tests-qualification}

**Status:** PARTIAL. **Claim:** {C-027 FACT HIGH; S-008,S-029,S-033,S-034,S-036}

The repository declares workspace unit tests, script tests, fake-provider and
SDK integration tests, no-sandbox/container matrices, CLI/interactive suites,
typecheck, lint, release checks, and selected desktop/web qualification. CI
runs on pull requests and merge queue, not post-merge pushes; macOS and Windows
test jobs are merge-group paths. Release jobs can skip test dependencies through
the explicit dispatch input. {C-027 FACT HIGH; S-008,S-029,S-033,S-034,S-036}

No upstream suite was run. A reproducible filename probe found 2,408 tracked
`*.test|spec.{ts,tsx,js,mjs,cjs}` files repository-wide and 1,480 under core +
CLI; other retained formulas produced nearby totals, so counts are method labels,
not quality scores. Static package integrity and source traces were the only
direct qualification performed here.

- **Qualified:** identity, archive membership/digest, static reachability,
  constants, guards, and declared CI/release topology.
- **Not qualified:** live loop/provider, bypass/escape, crash recovery,
  concurrency, cancellation cleanup, cost, update, and evidence tamper resistance.
- **Negative results:** failed exploratory commands are retained in Section 25
  and S-036, not interpreted as target failures.

## 20. Security {#security}

**Status:** PARTIAL. **Claims:** {C-028 FACT HIGH; S-018,S-019,S-020,S-021,S-022,S-024,S-025,S-030,S-035}
{C-020 UNKNOWN N/A; S-018,S-019,S-020,S-021,S-025,S-035,S-036}

Relevant trust boundaries are workspace/context, model arguments, tool results,
hooks/extensions/skills, MCP/ACP/channel peers, provider credentials/networks,
filesystem paths, worktrees, local session state, and package supply chain.
Static controls include schema validation, trusted-folder restrictions,
most-restrictive permission matching, pre-execution hooks/guard, safe mode,
optional process sandboxing, worktree ownership/dirty guards, and session
symlink/inode/hash checks. The owner provides a vulnerability-reporting portal.
{C-028 FACT HIGH; S-018,S-019,S-020,S-021,S-022,S-024,S-025,S-030,S-035}

These are source structures, not a penetration result. YOLO broadens authority,
sandbox is opt-in, explicit top-tier servers survive safe mode, hook transport
failure can allow continuation, and channel/daemon permission contracts differ.
Actual injection resistance, parser bypass, secret exposure, path/symlink escape,
sandbox escape, network containment, tenant isolation, and advisory completeness
remain unknown. {C-020 UNKNOWN N/A; S-018,S-019,S-020,S-021,S-025,S-035,S-036}

- **Supply chain:** exact npm digest/signature/attestation observed; reproducible
  source identity remains C-003.
- **Security acceptance:** explicitly outside this dossier's authority.

## 21. Strengths {#strengths}

**Status:** INTERPRETATION. **Claim:** {C-029 INFERENCE HIGH; S-010,S-011,S-014,S-015,S-018,S-019,S-020,S-022,S-023,S-024,S-025,S-026,S-029}

Within the inspected static snapshot, Qwen Code's strongest comparative property
is explicit separation of model request, host authority, execution, durable
state, and evidence: typed streams/tools, pre-execution permission/guard seams,
provenanced context, bounded agent identities, worktree ownership, integrity-
checked append, and correlation/export surfaces are individually traceable.
{C-029 INFERENCE HIGH; S-010,S-011,S-014,S-015,S-018,S-019,S-020,S-022,S-023,S-024,S-025,S-026,S-029}

- **Reasoning:** C-007 + C-010 + C-011 + C-015 + C-016 + C-018 + C-019 +
  C-021 expose separate contracts and stable enforcement/evidence points.
- **Assumptions:** traced composition paths are production-reachable at HEAD.
- **Alternative:** breadth, duplicated interactive/headless/ACP paths, and rapid
  post-release change can make those seams harder to keep behaviorally aligned.
- **Unknowns:** runtime completeness and security remain C-038/C-020.

## 22. Liabilities {#liabilities}

**Status:** INTERPRETATION. **Claim:** {C-030 INFERENCE HIGH; S-002,S-003,S-004,S-005,S-031,S-032,S-033,S-034}

Independent operational audit is materially burdened by three forms of drift:
stable artifact provenance names two nearby source commits, ACP permission and
documentation contracts diverge by bridge, and release validation is explicitly
skippable while main CI has no post-merge push trigger. Triggers are artifact
reconstruction, channel/daemon deployment, and emergency release; consequences
are source-attribution uncertainty, mistaken approval expectations, and a weaker
final-tree qualification signal. {C-030 INFERENCE HIGH; S-002,S-003,S-004,S-005,S-031,S-032,S-033,S-034}

- **Mitigation in evidence:** pin/hash package bytes; treat each ACP topology as
  a separate contract; avoid `force_skip_tests`; require an independently
  verified release commit.
- **Alternative explanations:** the provenance dependency may be a harmless
  workflow checkout timing issue, and merge queue may already test the exact
  landed tree; neither resolves the artifact statement or bypass capability.
- **Unknowns:** live release and deployment enforcement were not observed.

## 23. Transferable patterns {#transferable-patterns}

**Status:** RESEARCH CANDIDATES ONLY. **Claims:**
{C-031 INFERENCE HIGH; S-011,S-018,S-019,S-020,S-029}
{C-032 INFERENCE HIGH; S-024}
{C-033 INFERENCE MEDIUM; S-013,S-020,S-021,S-030,S-035}

1. **Typed request-authority-execution-evidence seam — `CANDIDATE`.** Problem:
   prevent model output from directly becoming authority. Minimal mechanism:
   schema/build, most-restrictive policy, optional host guard, invocation, typed
   terminal result, and correlated event. Prerequisites: exhaustive state
   handling and deny-path tests. Preserved boundary: model requests remain data.
   Adaptation cost: medium. {C-031 INFERENCE HIGH; S-011,S-018,S-019,S-020,S-029}
2. **Integrity-checked single-writer JSONL — `CANDIDATE`.** Problem: resumable
   local sessions with detectable concurrent/foreign mutation. Minimal mechanism:
   owner lease, no-follow/inode identity, hash continuity, serialized append,
   fsync, parent chain, and explicit conflict diagnostics. Prerequisites:
   supported filesystem identity and crash-injection qualification. Adaptation
   cost: high. {C-032 INFERENCE HIGH; S-024}
3. **Ambient-customization quiescence — `CONDITIONAL`.** Problem: obtain a
   troubleshooting/hosted baseline without hooks, context, skills, extensions,
   settings MCP, or user permission rules. Minimal mechanism: one safe/bare
   switch while explicitly preserving host-supplied top-tier protocol servers.
   Prerequisites: the preserved channel is authenticated and separately guarded;
   name the exception so “safe” is not read as “no external authority.”
   Adaptation cost: medium. {C-033 INFERENCE MEDIUM; S-013,S-020,S-021,S-030,S-035}

These are comparison inputs, not adoption decisions. Runtime and security
qualification would be required independently.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

**Status:** BOUNDED REJECTIONS. **Claims:** {C-034 INFERENCE HIGH; S-002,S-023,S-026,S-027,S-028}
{C-035 INFERENCE HIGH; S-030,S-035,S-036}

- **Credentialed/paid live inference — `CURIOSITY_NO_GO`.** Marginal evidence
  would require credentials, external network authority, quota/spend, and
  provider data processing. Reopen only with disposable accounts, fake-first
  endpoints, explicit network/spend caps, and a provider-specific plan.
  {C-034 INFERENCE HIGH; S-002,S-023,S-026,S-027,S-028}
- **Target execution, installers/containers, destructive crash/concurrency/
  escape probes — `CURIOSITY_NO_GO`.** Current authority forbids the effects and
  no dedicated no-secret VM/container fixture was approved. Failure mode:
  mutation, process/network escape, or false confidence from an incomplete
  platform run. Reopen only with explicit exploitation/fault-injection authority
  and disposable multi-platform fixtures. {C-035 INFERENCE HIGH; S-030,S-035,S-036}
- **Exhaustive tool catalogs, broad ACP archaeology, deeper shell-parser
  analysis, and repeated test-count formulas — `CURIOSITY_NO_GO`.** They were
  lower-value, duplicative, or saturated relative to the architecture decision.
  Reopen only if synthesis identifies a specific discriminating interface.
  {C-035 INFERENCE HIGH; S-030,S-035,S-036}

## 25. Adversarial probes {#adversarial-probes}

**Status:** COMPLETE AS A SAFE STATIC TABLE; dynamic outcomes remain unknown.
**Claims:** {C-036 FACT HIGH; S-002,S-003,S-004,S-005,S-007,S-036}
{C-037 FACT HIGH; S-009,S-010,S-018,S-019,S-020,S-021,S-022,S-023,S-024,S-025,S-026,S-028,S-029,S-030,S-031,S-032,S-033,S-034,S-035,S-036}
{C-038 UNKNOWN N/A; S-009,S-010,S-018,S-019,S-020,S-021,S-022,S-023,S-024,S-025,S-026,S-028,S-029,S-030,S-031,S-032,S-033,S-034,S-035,S-036}

Expected safe behavior was fixed before each challenge. Static inspection and
artifact hashing ran without target execution, installation, credentials, or
provider calls. `INCONCLUSIVE` and `NOT_RUN_UNSAFE` are not passes.

| Probe | Expected safe behavior | Result | Actual bounded observation | Environment | Claims | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 startup/no-op | help/version declare or avoid writes, network, credentials, and child processes | INCONCLUSIVE | bootstrap fast paths and ordinary `--expose-gc` relaunch traced; startup settings/home/cleanup paths exist; target not run | static HEAD + tar listing | C-006,C-037,C-038 | S-009,S-010,S-036 |
| P-02 denial/bypass | every consequential alternate path reaches a deny/ask enforcement point | INCONCLUSIVE | deny/ask priority, hook, guard, safe mode, and untrusted-folder gates traced; alternate invocation not executed | static core/CLI | C-019,C-020,C-037,C-038 | S-019,S-020,S-021,S-030,S-035 |
| P-03 malformed/oversized | reject before side effects with bounded diagnostic | INCONCLUSIVE | tool schemas/build validation and bounded config parsers precede execution; malformed runtime inputs not sent | static source | C-011,C-037,C-038 | S-018,S-019 |
| P-04 cancel/timeout | abort propagates, cleans children, and records one final state | INCONCLUSIVE | AbortSignal and opt-in tool/ACP timeouts traced; no active side effect interrupted | static source | C-024,C-025,C-038 | S-010,S-015,S-019,S-031,S-032 |
| P-05 retry/duplicate/partial | bounded retry avoids duplicate visible output/effects and attributes usage | INCONCLUSIVE | retry/fallback stops after output; generic tool idempotency and side-effect dedupe absent | static source | C-014,C-023,C-024,C-038 | S-012,S-028,S-030 |
| P-06 concurrency collision | sessions/worktrees/tasks isolate or reject collision deterministically | INCONCLUSIVE | writer leases, worktree ownership, depth and concurrency caps traced; no two-session mutation | static source | C-010,C-016,C-018,C-038 | S-014,S-015,S-017,S-019,S-024,S-025 |
| P-07 crash/restart | committed state recovers without silent corruption, loss, or replay | NOT_RUN_UNSAFE | append/recovery source traced; interruption between transitions not authorized | no target execution | C-016,C-017,C-038 | S-024,S-036 |
| P-08 provider/network down | preserve auth/rate/stream errors and bound fallback before output | NOT_RUN_UNSAFE | adapters and 429/503/529 fallback traced; credentials/network denied | static providers only | C-013,C-014,C-024,C-038 | S-026,S-027,S-028 |
| P-09 instruction injection | untrusted content cannot alter host/research authority | INCONCLUSIVE | research ignored embedded instructions; target imports trusted project/tool/provider data intentionally; no exploit | static context/policy | C-015,C-020,C-028,C-038 | S-020,S-021,S-022,S-035 |
| P-10 filesystem abuse | traversal/symlink/case/absolute paths are contained or denied | NOT_RUN_UNSAFE | session no-follow/inode and worktree guards traced; end-to-end tool/sandbox escape not attempted | static source | C-018,C-020,C-028,C-038 | S-024,S-025,S-035 |
| P-11 cost disagreement | estimates, usage, retries/cache and provider total remain distinguishable; budget fails closed | NOT_RUN_UNSAFE | usage can undercount and is not billing; no provider ledger/spend | static accounting | C-022,C-023,C-038 | S-029,S-030,S-036 |
| P-12 pin/update/rollback | exact bytes verify; failed update can restore prior state and source identity | INCONCLUSIVE | tarball digest/signature/attestation subject verified; provenance commits differ; update/rollback unrun | local artifact + registry metadata | C-002,C-003,C-026,C-036,C-038 | S-002,S-003,S-004,S-005,S-033 |
| P-13 absence/disabled | bounded absence survives config/alias/alternate entrypoint challenge | INCONCLUSIVE | root/packed NOTICE and manifest license fields searched; safe mode exclusions/top-tier exceptions traced; no global absence claimed | bounded repo/tar/config universe | C-004,C-008,C-019,C-036,C-037,C-038 | S-003,S-007,S-013,S-021,S-036 |
| P-14 evidence loss/forgery | denied/failed/cancelled actions correlate once and untrusted fields cannot spoof evidence | INCONCLUSIVE | IDs, writer integrity, task notifications and OTel paths traced; exporter loss/spoof not induced | static source | C-021,C-024,C-037,C-038 | S-019,S-024,S-029,S-031 |

Retained negative results: one exploratory helper probe returned
`Error: Cannot find module 'sh'`; an npm command returned
`npm error code EBADDEVENGINES`; and an unquoted shell glob returned
`zsh:1: no matches found: NOTICE*`. They are method/environment failures, not
Qwen runtime evidence. Static filename formulas also disagreed slightly (for
example, retained 2,405/1,482 and current 2,408/1,480 totals); no quality claim
depends on the count. {C-037 FACT HIGH; S-036}

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "The inspected official repository snapshot is commit 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee, authored 2026-08-24T17:39:04Z, in a clean detached checkout with no reported submodules, and is 111 commits beyond v0.22.0."
  classification: FACT
  confidence: HIGH
  scope: "QwenLM/qwen-code source checkout; excludes later commits and stable package bytes"
  source_ids: [S-001, S-005]
  fact_dependencies: []
  method: "Recorded origin, HEAD, author time, status, submodules, exact tag commit, rev count, and changed-path count."
  counterevidence: "root manifest still says 0.22.0, but version text is not release-tree identity"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "The exact stable artifact is @qwen-code/qwen-code@0.22.0 with the recorded SHA-512 integrity, SHA-256 digest, 25,547,083-byte size, 976 entries, and Node >=22 requirement."
  classification: FACT
  confidence: HIGH
  scope: "exact npm metadata and retrieved tarball; excludes optional dependency bytes"
  source_ids: [S-002, S-003]
  fact_dependencies: []
  method: "Retrieved exact-version registry JSON, recomputed artifact digest/size, listed members, and read manifest without installation."
  counterevidence: "none found in registry metadata or exact bytes"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: provenance-license
  statement: "Complete artifact-to-source provenance for 0.22.0 is unknown because npm gitHead/tag resolve to the release commit while SLSA resolvedDependencies names a five-commit-earlier source whose manifest is 0.21.14."
  classification: UNKNOWN
  confidence: N/A
  scope: "@qwen-code/qwen-code@0.22.0 package, npm attestations, v0.22.0 tag; does not allege a provenance failure"
  source_ids: [S-002, S-004, S-005]
  fact_dependencies: []
  method: "attempted_methods=compared npm gitHead, tag resolution, attestation subject, SLSA resolved dependency, source manifests, and commit distance; blocker=owner-controlled provenance surfaces identify two nearby commits without a reconciliation or reproducible build; impact=package-wide source attribution remains incomplete; available_evidence=S-002,S-004,S-005; next_probe=reproduce release workflow at both commits with immutable dependencies and byte-diff the packed artifact"
  counterevidence: "S-002/S-005 identify 1c3a385d while S-004 identifies 2a99e841; subject digest itself matches"
  adversarial_status: CHALLENGED
- claim_id: C-004
  section: provenance-license
  statement: "Qwen Code documents Gemini CLI v0.8.2 lineage and independent development from Qwen Code v0.1; repository and tarball contain Apache-2.0 text, while root/CLI/core/packed manifests omit license and root/packed NOTICE files were not found."
  classification: FACT
  confidence: HIGH
  scope: "first-party README, repository/tarball license, named manifests, root NOTICE search; excludes dependencies and package-specific notices"
  source_ids: [S-003, S-006, S-007, S-036]
  fact_dependencies: []
  method: "Read owner lineage statement and license text; inspected exact manifests; searched repository root and tarball root for NOTICE."
  counterevidence: "package-specific NOTICE files exist elsewhere in the repository but are outside the claimed root/packed universe"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: repository-package-map
  statement: "HEAD is a TypeScript ESM monorepo whose mapped production surfaces include CLI, core, ACP bridge, channels, SDK, web/UI, IDE, auxiliary MCP, and private desktop/extension packages."
  classification: FACT
  confidence: HIGH
  scope: "pinned manifests/tree; roles are static and do not prove every runtime path"
  source_ids: [S-006, S-008]
  fact_dependencies: []
  method: "Inspected root workspaces, package manifests, names, bins, main/exports, and tree."
  counterevidence: "stable tarball contains a narrower bundled publication and is separately scoped"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: executable-entrypoints
  statement: "The production bootstrap has in-process help/version/serve/mcp paths, ordinary --expose-gc relaunch, optional sandbox re-exec, and CLI dispatch to ACP, TUI, headless, stream-JSON, and serve surfaces."
  classification: FACT
  confidence: HIGH
  scope: "pinned source and manifests; alternate entrypoints not executed"
  source_ids: [S-008, S-009, S-010]
  fact_dependencies: []
  method: "Traced root bin through cli-entry.js, cli.ts bootstrap routing, and gemini.tsx dispatch."
  counterevidence: "none found in traced source; reachability remains static"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: control-data-flow
  statement: "The static request path carries operator input through context/provider streaming and mediates model-requested tools through validation and host authority before recursive continuation, output, state, and telemetry."
  classification: FACT
  confidence: HIGH
  scope: "pinned client/chat/turn/scheduler source; no authenticated end-to-end run"
  source_ids: [S-010, S-011, S-012, S-019]
  fact_dependencies: []
  method: "Traced main/headless dispatch, GeminiClient.sendMessageStream, GeminiChat, Turn, and scheduler transitions."
  counterevidence: "C-013/C-038 preserve unobserved runtime behavior"
  adversarial_status: SUPPORTED
- claim_id: C-008
  section: module-extension-boundaries
  statement: "Current extension boundaries can inject context, tools, commands, hooks, skills, MCP servers, agents, rules, or channel/SDK protocol inputs, with partly explicit source precedence and safe-mode suppression."
  classification: FACT
  confidence: HIGH
  scope: "pinned extension/config/package source; no third-party extension execution"
  source_ids: [S-008, S-013, S-021]
  fact_dependencies: []
  method: "Mapped first-party extension documentation, workspace packages, and configuration assembly/suppression."
  counterevidence: "explicit top-tier host MCP sources survive safe mode and are stated as an exception"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: module-extension-boundaries
  statement: "A complete cross-extension versioning, ordering, collision, reload, unload, and compatibility contract is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "extensions, hooks, skills, MCP, agents, rules, channels, and SDK injection at pinned HEAD"
  source_ids: [S-013, S-036]
  fact_dependencies: []
  method: "attempted_methods=searched first-party extension/config documentation and loaders for lifecycle guarantees; blocker=no single complete contract covers all extension families and no conflict/reload fixture ran; impact=portability and dynamic lifecycle comparison remain partial; available_evidence=S-013,S-036; next_probe=run two conflicting disposable extensions/MCP/hooks through install, reload, disable, version mismatch, and shutdown"
  counterevidence: "some source precedence and individual cleanup paths exist but do not answer the cross-surface contract"
  adversarial_status: CHALLENGED
- claim_id: C-010
  section: agent-interface
  statement: "The agent interface statically enforces bounded depth, fresh or explicit-fork context, separate foreground/background results, top-level-only background completion, and restricted teammate/fork spawning."
  classification: FACT
  confidence: HIGH
  scope: "pinned ordinary agent/fork/background/team routing source; no live multi-agent run"
  source_ids: [S-014, S-015, S-016, S-017]
  fact_dependencies: []
  method: "Traced depth normalization/context, AgentTool guards/dispatch, and BackgroundTaskRegistry limits/notifications."
  counterevidence: "teammates/workflows have separate control planes rather than identical ordinary-agent semantics"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: tool-interface
  statement: "Tools use FunctionDeclaration schemas and validated ToolInvocations; the scheduler runs consecutive safe calls concurrently with default cap 10, serializes unsafe calls, and supports pre-execution hooks, host guard, AbortSignal, and opt-in timeout."
  classification: FACT
  confidence: HIGH
  scope: "pinned generic tool/scheduler/permission source; tool-specific side effects unexecuted"
  source_ids: [S-018, S-019, S-020]
  fact_dependencies: []
  method: "Inspected tool build/validation contract, concurrency partition/run, hook/guard, cancellation, and timeout branches."
  counterevidence: "hook transport errors allow continuation; generic timeout is disabled unless positively configured"
  adversarial_status: SUPPORTED
- claim_id: C-012
  section: provider-interface
  statement: "Lazy ContentGenerator adapters cover OpenAI-compatible, Qwen OAuth, Anthropic, Gemini, and Vertex routes, with Qwen OAuth using QwenContentGenerator over DashScopeOpenAICompatibleProvider."
  classification: FACT
  confidence: HIGH
  scope: "pinned provider factory/Qwen adapter source; configuration presence, not service reachability"
  source_ids: [S-026, S-027]
  fact_dependencies: []
  method: "Inspected ContentGenerator interface, lazy factory branches, OAuth client, and Qwen adapter construction."
  counterevidence: "none found in provider factory"
  adversarial_status: SUPPORTED
- claim_id: C-013
  section: provider-interface
  statement: "Live provider authentication, account availability, quotas, latency, retention, network errors, and billed usage are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "all configured provider routes; excludes static adapters/fallback predicates"
  source_ids: [S-023, S-026, S-027, S-028]
  fact_dependencies: []
  method: "attempted_methods=static provider/stream/retry trace and exact package metadata inspection; blocker=no credentials, provider network, spend authority, or fake-endpoint execution; impact=runtime provider and cost comparison remains incomplete; available_evidence=S-023,S-026,S-027,S-028; next_probe=authorized fake-provider matrix followed by capped disposable accounts per route"
  counterevidence: "adapter code and owner metadata establish supported configuration, not live behavior"
  adversarial_status: NOT_PROBED
- claim_id: C-014
  section: model-interface
  statement: "Model fallback is capped, receives a fresh retry budget per model, and occurs only before output after exhausted 429/503/529 capacity or availability failures rather than auth/billing/client failures."
  classification: FACT
  confidence: HIGH
  scope: "pinned GeminiChat/provider routing source; live model capability negotiation excluded"
  source_ids: [S-011, S-012, S-026, S-028]
  fact_dependencies: []
  method: "Inspected model stream events, retry classification, output gate, and fallback loop."
  counterevidence: "persistent unattended retry intentionally suppresses fallback"
  adversarial_status: SUPPORTED
- claim_id: C-015
  section: context-interface
  statement: "Trusted hierarchical QWEN.md/AGENTS.md context retains ordered provenance and depth-5 imports, QWEN.local.md occupies one project-root slot, and auto-compaction uses the recorded thresholds and three-failure breaker."
  classification: FACT
  confidence: HIGH
  scope: "pinned context discovery/import/compression source; no compaction-quality or injection run"
  source_ids: [S-011, S-012, S-022, S-023]
  fact_dependencies: []
  method: "Traced context constants/discovery/import provenance and ChatCompressionService/GeminiChat breaker."
  counterevidence: "provenance delimiters and trust gates do not prove prompt-injection isolation"
  adversarial_status: SUPPORTED
- claim_id: C-016
  section: state-persistence-restart
  statement: "Session persistence uses parent-linked append-only JSONL and a serialized writer lease with ownership, no-follow/inode, identity/hash-continuity, per-append fsync, and explicit conflict/change errors."
  classification: FACT
  confidence: HIGH
  scope: "pinned session/writer source; static behavior only"
  source_ids: [S-024]
  fact_dependencies: []
  method: "Inspected lock schema/acquisition, transcript snapshot, appendJsonLine, sync, parent reconstruction, and error mappings."
  counterevidence: "crash timing remains C-017"
  adversarial_status: SUPPORTED
- claim_id: C-017
  section: state-persistence-restart
  statement: "Crash consistency, loss, duplication, and replay behavior across every session append/checkpoint/lease/sidecar transition are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "local session, checkpoint, and worktree sidecar state at pinned HEAD"
  source_ids: [S-024, S-036]
  fact_dependencies: []
  method: "attempted_methods=static write/recovery trace and bounded tail-recovery inspection; blocker=process interruption and mutable-state fault injection were outside authority; impact=restart durability cannot be accepted from source intent; available_evidence=S-024,S-036; next_probe=crash at each write/sync/rename/lease transition in a disposable filesystem with byte-level before/after capture"
  counterevidence: "strong static checks exist but are not crash observations"
  adversarial_status: NOT_PROBED
- claim_id: C-018
  section: concurrency-worktree-isolation
  statement: "The static runtime combines safe-tool concurrency, bounded background agents, serialized session writers, and repository-root/session-owned worktrees whose removal checks foreign activity, dirtiness, and unmerged commits."
  classification: FACT
  confidence: HIGH
  scope: "pinned scheduler/agent/session/worktree source; not tenant isolation and no collision run"
  source_ids: [S-014, S-015, S-016, S-017, S-019, S-024, S-025]
  fact_dependencies: []
  method: "Traced concurrency caps/partition, agent topology, writer serialization, worktree provisioning/sidecar/removal."
  counterevidence: "worktrees share repository history/config and explicit absolute paths are not sandbox-contained"
  adversarial_status: SUPPORTED
- claim_id: C-019
  section: permissions-authority-sandbox
  statement: "Permission priority is deny > ask > default > allow; normal mode defaults to auto, bare/safe to default, untrusted folders restrict to default/plan, and optional sandboxing is separate from YOLO."
  classification: FACT
  confidence: HIGH
  scope: "pinned CLI/core permission and sandbox configuration; structure, not bypass resistance"
  source_ids: [S-010, S-019, S-020, S-021, S-030, S-035]
  fact_dependencies: []
  method: "Inspected decision priority/evaluation, startup mode resolution/trust gate, safe-mode source suppression, sandbox re-exec, and YOLO warning docs/source."
  counterevidence: "explicit top-tier host MCP/ACP sources intentionally survive safe mode"
  adversarial_status: SUPPORTED
- claim_id: C-020
  section: permissions-authority-sandbox
  statement: "Actual permission bypass, parser evasion, filesystem/symlink escape, sandbox escape, and cross-entrypoint enforcement resistance are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "supported CLI/headless/ACP/serve and sandbox/platform paths; no security acceptance"
  source_ids: [S-018, S-019, S-020, S-021, S-025, S-035, S-036]
  fact_dependencies: []
  method: "attempted_methods=static schema, permission, shell semantics, trust, guard, worktree, and sandbox review; blocker=no explicit exploitation authority or disposable cross-platform execution matrix; impact=security enforcement cannot be accepted; available_evidence=S-018,S-019,S-020,S-021,S-025,S-035,S-036; next_probe=authorized alternate-entry, traversal, symlink, shell-wrapper, environment, network, and sandbox-escape suite"
  counterevidence: "YOLO, opt-in sandbox, and safe-mode top-tier exceptions show controls are configuration-dependent"
  adversarial_status: CHALLENGED
- claim_id: C-021
  section: evidence-observability
  statement: "The static runtime exposes correlated session/prompt/tool/agent/worktree/ACP evidence through stream events, integrity-checked JSONL, task notifications, logs, metrics, and optional OpenTelemetry."
  classification: FACT
  confidence: HIGH
  scope: "pinned local evidence/export paths; tamper-evident external receipt excluded"
  source_ids: [S-011, S-019, S-024, S-029, S-031]
  fact_dependencies: []
  method: "Inspected event IDs, scheduler/task/session records, writer continuity, and telemetry defaults/exporters."
  counterevidence: "local exports remain operator-mutable and exporter loss was not induced"
  adversarial_status: SUPPORTED
- claim_id: C-022
  section: resource-token-cost-accounting
  statement: "The runtime combines provider usage/local estimates with model/auth/source token-usage JSONL and independent memory, turn, depth, concurrency, timeout, and stream limits."
  classification: FACT
  confidence: MEDIUM
  scope: "pinned accounting/limit source; monetary reconciliation excluded"
  source_ids: [S-011, S-023, S-026, S-028, S-029, S-030]
  fact_dependencies: []
  method: "Inspected usage event conversion, token files, compaction/stream/tool/agent limits, and config defaults."
  counterevidence: "usage fallback can undercount and limits are not one universal resource budget"
  adversarial_status: CHALLENGED
- claim_id: C-023
  section: resource-token-cost-accounting
  statement: "Exact monetary cost and enforceable budget attribution across missing usage, cache, retry, fallback, tools, and agents are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "all providers and runtime work; no paid requests or invoices"
  source_ids: [S-023, S-026, S-028, S-029, S-030, S-036]
  fact_dependencies: []
  method: "attempted_methods=traced token estimates, provider usage, retry/fallback, local usage JSONL, and configured limits; blocker=no provider invoice/account and usage writer is best effort with documented undercount path; impact=cost predictability and budget enforcement cannot be compared exactly; available_evidence=S-023,S-026,S-028,S-029,S-030,S-036; next_probe=reconcile a capped fake-then-paid workload against provider and invoice exports including retries/cache/agents"
  counterevidence: "token reports provide attribution signals but not invoice reconciliation"
  adversarial_status: CHALLENGED
- claim_id: C-024
  section: failure-cancellation-retry
  statement: "The static runtime classifies major errors, propagates cancellation, applies bounded retry/fallback, and exposes explicit writer, agent, MCP, and worktree failure diagnostics, without a generic side-effect idempotency contract."
  classification: FACT
  confidence: HIGH
  scope: "pinned loop/tool/agent/session/worktree/ACP source; no induced partial failure"
  source_ids: [S-010, S-011, S-012, S-015, S-019, S-024, S-028, S-031]
  fact_dependencies: []
  method: "Traced error enums/strings, AbortSignal paths, retry/fallback, and cleanup/error mapping."
  counterevidence: "cooperative cancellation and external side effects can remain ambiguous"
  adversarial_status: SUPPORTED
- claim_id: C-025
  section: failure-cancellation-retry
  statement: "At HEAD, channel-base ACP permissions time out after five minutes, daemon ACP permissions default to no wall-clock timeout after commit 1fffa510, and channel documentation still claims obsolete unconditional auto-approval."
  classification: FACT
  confidence: HIGH
  scope: "named ACP implementations and pinned channel-adapter documentation; does not generalize to all hosts"
  source_ids: [S-031, S-032]
  fact_dependencies: []
  method: "Compared constants/permission implementations, verified the disabling commit is an ancestor, and read the contradictory first-party document."
  counterevidence: "the documentation conflicts with current channel-base requestPermission code and is retained as stale text"
  adversarial_status: CHALLENGED
- claim_id: C-026
  section: install-update-release
  statement: "The stable package exposes registry integrity/signature and npm/SLSA attestations, while the release workflow grants id-token write and publishes with --provenance but can skip validation through force_skip_tests."
  classification: FACT
  confidence: HIGH
  scope: "@qwen-code/qwen-code@0.22.0 metadata/artifact and pinned release workflow; signature chain/build/rollback unexecuted"
  source_ids: [S-002, S-003, S-004, S-005, S-008, S-009, S-033]
  fact_dependencies: []
  method: "Compared exact registry/artifact/attestation/tag records with bootstrap and release workflow."
  counterevidence: "C-003 records unresolved source dependency; force_skip_tests is an explicit bypass"
  adversarial_status: CHALLENGED
- claim_id: C-027
  section: tests-qualification
  statement: "The repository declares layered unit/integration/SDK/sandbox/release/desktop/CI qualification, but this dossier ran no target suite and main CI has no post-merge push trigger."
  classification: FACT
  confidence: HIGH
  scope: "pinned scripts/workflows and static filename probes; no claim that upstream tests passed"
  source_ids: [S-008, S-029, S-033, S-034, S-036]
  fact_dependencies: []
  method: "Inspected package scripts and workflows; counted test filenames by an exact rg formula; did not execute tests."
  counterevidence: "merge queue tests can qualify the merged candidate before landing, but no post-merge push run exists in ci.yml"
  adversarial_status: CHALLENGED
- claim_id: C-028
  section: security
  statement: "Static security controls include schema validation, trust/mode restrictions, most-restrictive permission matching, hooks/guard, optional sandbox, worktree guards, session identity/hash checks, and an owner vulnerability intake."
  classification: FACT
  confidence: HIGH
  scope: "pinned source/security documentation; no exploitation or security acceptance"
  source_ids: [S-018, S-019, S-020, S-021, S-022, S-024, S-025, S-030, S-035]
  fact_dependencies: []
  method: "Mapped controls at each trust boundary and read SECURITY.md."
  counterevidence: "C-020/C-038 preserve dynamic enforcement unknowns"
  adversarial_status: NOT_PROBED
- claim_id: C-029
  section: strengths
  statement: "Explicit typed seams between model requests, host authority, execution, durable state, isolation identity, and correlated evidence are a comparative architectural strength of the static snapshot."
  classification: INFERENCE
  confidence: HIGH
  scope: "architecture inspectability only; no adoption or runtime-quality decision"
  source_ids: [S-010, S-011, S-014, S-015, S-018, S-019, S-020, S-022, S-023, S-024, S-025, S-026, S-029]
  fact_dependencies: [C-007, C-010, C-011, C-015, C-016, C-018, C-019, C-021]
  method: "Reasoning chain=separate typed contracts and IDs expose authority/state/evidence transitions; assumptions=traced production paths are reachable; alternative=surface breadth and duplicated paths increase drift."
  counterevidence: "C-009,C-020,C-025,C-038"
  adversarial_status: NOT_PROBED
- claim_id: C-030
  section: liabilities
  statement: "Provenance ambiguity, ACP permission/documentation drift, skippable release validation, and absent post-merge push CI materially increase independent audit burden."
  classification: INFERENCE
  confidence: HIGH
  scope: "artifact reconstruction, ACP deployment, and release qualification; no claim of compromise"
  source_ids: [S-002, S-003, S-004, S-005, S-031, S-032, S-033, S-034]
  fact_dependencies: [C-003, C-025, C-026, C-027]
  method: "Reasoning chain=conflicting source identity and contract/gate drift require topology-specific verification; assumptions=independent reproducibility matters; alternative=merge queue/workflow timing may be operationally sufficient."
  counterevidence: "artifact digest/subject match and merge-queue coverage mitigate but do not erase the caveats"
  adversarial_status: SUPPORTED
- claim_id: C-031
  section: transferable-patterns
  statement: "A typed request-policy-guard-invocation-result-event seam is a candidate research pattern for preserving host authority over model-requested side effects."
  classification: INFERENCE
  confidence: HIGH
  scope: "research candidate only; requires independent implementation and qualification"
  source_ids: [S-011, S-018, S-019, S-020, S-029]
  fact_dependencies: [C-007, C-011, C-019, C-021]
  method: "Reasoning chain=typed transitions keep model requests as data and expose denial/execution/evidence points; assumptions=state handling is exhaustive; alternative=capability-specific tools may be simpler."
  counterevidence: "C-020,C-038"
  adversarial_status: NOT_PROBED
- claim_id: C-032
  section: transferable-patterns
  statement: "An integrity-checked single-writer append-only JSONL session is a candidate research pattern for resumability with detectable foreign mutation."
  classification: INFERENCE
  confidence: HIGH
  scope: "research candidate only; depends on filesystem identity and crash qualification"
  source_ids: [S-024]
  fact_dependencies: [C-016]
  method: "Reasoning chain=lease+identity+hash+fsync detect competing writers and retain replayable records; assumptions=filesystem semantics hold; alternative=transactional database storage may be simpler operationally."
  counterevidence: "C-017 leaves crash timing unknown"
  adversarial_status: NOT_PROBED
- claim_id: C-033
  section: transferable-patterns
  statement: "Ambient-customization quiescence that preserves only explicit host protocol sources is a conditional research pattern."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "research pattern only; safe/bare semantics and explicit top-tier exception"
  source_ids: [S-013, S-020, S-021, S-030, S-035]
  fact_dependencies: [C-008, C-019]
  method: "Reasoning chain=suppressing ambient hooks/context/MCP reduces unknown startup influence while preserving caller contract; assumptions=preserved host channel is separately authenticated/guarded; alternative=a truly zero-extension mode may be easier to reason about."
  counterevidence: "C-020 and the top-tier exception"
  adversarial_status: CHALLENGED
- claim_id: C-034
  section: rejected-patterns-curiosity-no-go
  statement: "Credentialed or paid live provider execution is CURIOSITY_NO_GO in this research session without disposable credentials and explicit network/spend authority."
  classification: INFERENCE
  confidence: HIGH
  scope: "current research authority only"
  source_ids: [S-002, S-023, S-026, S-027, S-028]
  fact_dependencies: [C-013, C-023]
  method: "Reasoning chain=remaining evidence requires secrets/network/cost while static interfaces answer architecture; assumptions=no hidden authorization; alternative=authorized fake/disposable accounts can reopen."
  counterevidence: "none within current authority"
  adversarial_status: NOT_APPLICABLE:unsafe-without-separate-authorization
- claim_id: C-035
  section: rejected-patterns-curiosity-no-go
  statement: "Target execution, installer/container use, destructive crash/concurrency/escape tests, exhaustive catalogs, and broad ACP archaeology are CURIOSITY_NO_GO for this bounded pass."
  classification: INFERENCE
  confidence: HIGH
  scope: "current ownership, safety authority, and depth budget"
  source_ids: [S-030, S-035, S-036]
  fact_dependencies: [C-009, C-017, C-020, C-038]
  method: "Reasoning chain=dynamic threads exceed authority and broad catalog/history threads have low marginal decision evidence; assumptions=scope remains unchanged; alternative=coordinator-authorized focused fixtures may reopen one discriminating thread."
  counterevidence: "none within current authority and budget"
  adversarial_status: NOT_APPLICABLE:outside-authority-or-nonpositive-marginal-evidence
- claim_id: C-036
  section: adversarial-probes
  statement: "Static artifact probes reproduced package digest/size/entries and attestation subject while retaining the provenance and license/NOTICE discrepancies."
  classification: FACT
  confidence: HIGH
  scope: "exact 0.22.0 bytes, registry metadata, attestations, tag, and bounded root searches"
  source_ids: [S-002, S-003, S-004, S-005, S-007, S-036]
  fact_dependencies: []
  method: "Hashed/listed/read the package, decoded attestations, resolved commits, and searched bounded manifest/NOTICE universes."
  counterevidence: "package-specific repository notices do not contradict root/packed absence"
  adversarial_status: CHALLENGED
- claim_id: C-037
  section: adversarial-probes
  statement: "Static adversarial traces found declared validation/authority/recovery/evidence controls and retained method failures/count disagreement without treating them as dynamic target results."
  classification: FACT
  confidence: HIGH
  scope: "P-01 through P-14 static portions and research-command diagnostics"
  source_ids: [S-009, S-010, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035, S-036]
  fact_dependencies: []
  method: "Traced each required probe to pinned source/artifact evidence and retained negative command outputs verbatim."
  counterevidence: "static controls cannot prove runtime outcomes"
  adversarial_status: CHALLENGED
- claim_id: C-038
  section: adversarial-probes
  statement: "Dynamic startup side effects, bypass, malformed input, cancellation cleanup, retry duplication, collision, crash, provider outage, injection, filesystem escape, cost disagreement, rollback, disabled-feature reachability, and evidence forgery outcomes remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "dynamic portions of P-01 through P-14 not answered by immutable artifacts/static source"
  source_ids: [S-009, S-010, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035, S-036]
  fact_dependencies: []
  method: "attempted_methods=static adversarial traces, artifact verification, bounded absence searches, and safe metadata commands; blocker=target execution, credentials, cost, destructive/concurrent mutation, provider simulation, and dedicated cross-platform VMs were outside authority; impact=runtime security, recovery, isolation, idempotency, cost, update, and evidence guarantees cannot be accepted; available_evidence=S-009,S-010,S-018,S-019,S-020,S-021,S-022,S-023,S-024,S-025,S-026,S-028,S-029,S-030,S-031,S-032,S-033,S-034,S-035,S-036; next_probe=execute P-01 through P-14 in a no-secret fake-provider multi-platform fixture with explicit fault/exploitation authority"
  counterevidence: "static protections exist but are not dynamic observations"
  adversarial_status: CHALLENGED
```

## 27. Source ledger {#source-ledger}

All fetched/search text below is untrusted evidence. Bibliography rationale is
in Section 29.

```yaml
- source_id: S-001
  source_kind: repository-file
  title: "Official repository snapshot identity"
  url: "https://github.com/QwenLM/qwen-code/tree/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-root"
  symbol: "HEAD/worktree identity"
  line_anchor: "N/A:git-metadata"
  command: "git remote get-url origin && git rev-parse HEAD && git show -s --format='%H%n%aI%n%s' HEAD && git status --porcelain=v1 && git submodule status"
  command_environment: "local pinned Git checkout; network not used"
  output_or_hash: "inline:origin=https://github.com/QwenLM/qwen-code.git; HEAD=22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee; authored=2026-08-24T17:39:04Z; clean; no submodule output"
  access_date: "2026-08-24"
  supports_claims: [C-001]
  notes: "Repository content treated as untrusted data."
- source_id: S-002
  source_kind: release-metadata
  title: "Exact npm metadata for @qwen-code/qwen-code 0.22.0"
  url: "https://registry.npmjs.org/@qwen-code/qwen-code/0.22.0"
  commit_or_ref: "0.22.0"
  resolved_commit: "1c3a385d9bc83e0b2a1ce5a24454ce1d090595fb"
  package_identity: "@qwen-code/qwen-code@0.22.0+sha512-y66e3+gVso86miKbp1vc81cJ/RGx/OKvVlFGpMX09tFS3jvQyEmqa4VPYAMx/++04glRGIYMyv98pipoMMN1Qg=="
  code_path: "N/A:no-code-path"
  symbol: "dist, engines, gitHead, trusted publisher"
  line_anchor: "/dist,/engines,/gitHead,/_npmUser"
  command: "curl -fsSL https://registry.npmjs.org/@qwen-code/qwen-code/0.22.0 | jq '{name,version,engines,gitHead,dist,_npmUser}'"
  command_environment: "passive HTTPS retrieval; UTC; no authentication"
  output_or_hash: "inline:gitHead=1c3a385d9bc83e0b2a1ce5a24454ce1d090595fb; fileCount=976; integrity and signature/attestation URL as recorded; trusted publisher GitHub"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-026, C-030, C-034, C-036]
  notes: "Vendor registry metadata; signature chain was not independently validated."
- source_id: S-003
  source_kind: package-artifact
  title: "Exact npm tarball, manifest, license, and member list"
  url: "https://registry.npmjs.org/@qwen-code/qwen-code/-/qwen-code-0.22.0.tgz"
  commit_or_ref: "0.22.0"
  resolved_commit: "1c3a385d9bc83e0b2a1ce5a24454ce1d090595fb"
  package_identity: "@qwen-code/qwen-code@0.22.0+sha512-y66e3+gVso86miKbp1vc81cJ/RGx/OKvVlFGpMX09tFS3jvQyEmqa4VPYAMx/++04glRGIYMyv98pipoMMN1Qg=="
  code_path: "package/package.json; package/LICENSE"
  symbol: "manifest identity/bin/engines/license and archive members"
  line_anchor: "/name,/version,/bin,/engines,/license; LICENSE L2-L6"
  command: "stat -f '%z' qwen-code-0.22.0.tgz && shasum -a 256 qwen-code-0.22.0.tgz && openssl dgst -sha512 -binary qwen-code-0.22.0.tgz | openssl base64 -A && tar -tf qwen-code-0.22.0.tgz | wc -l && tar -xOf qwen-code-0.22.0.tgz package/package.json"
  command_environment: "Darwin arm64; no install scripts; network not used after retrieval"
  output_or_hash: "inline:25,547,083 bytes; sha256=c0ae0ad006c4dd8b69ebe1705d13bb57d37d1c808dcb891c5bfcde91e66670c2; sha512 matches registry; 976 entries; manifest license absent; package/LICENSE present; package/NOTICE* absent"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-004, C-026, C-030, C-036]
  notes: "Researcher retains exact bytes in the approved temporary evidence directory."
- source_id: S-004
  source_kind: release-metadata
  title: "npm publish and SLSA attestations"
  url: "https://registry.npmjs.org/-/npm/v1/attestations/@qwen-code%2fqwen-code@0.22.0"
  commit_or_ref: "0.22.0"
  resolved_commit: "2a99e8416905396086a65cd13692bacf9d9eed7a"
  package_identity: "@qwen-code/qwen-code@0.22.0+sha512-y66e3+gVso86miKbp1vc81cJ/RGx/OKvVlFGpMX09tFS3jvQyEmqa4VPYAMx/++04glRGIYMyv98pipoMMN1Qg=="
  code_path: "N/A:no-code-path"
  symbol: "DSSE subjects and SLSA resolvedDependencies"
  line_anchor: "/attestations/*/bundle/dsseEnvelope/payload"
  command: "jq '[.attestations[].bundle.dsseEnvelope.payload|@base64d|fromjson|{predicateType,subject,predicate}]' qwen-attestations-0.22.0.json"
  command_environment: "retained exact JSON; jq; no network; file sha256:44437b5163559b1539ff5bdbc8aabec03f09e3ab8230503085a62b7e2af3924f"
  output_or_hash: "inline:two attestations; package subject sha512=cbae9edf...c37542; SLSA workflow release.yml refs/heads/main; resolved gitCommit=2a99e8416905396086a65cd13692bacf9d9eed7a"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-026, C-030, C-036]
  notes: "Decoded vendor attestation; does not independently establish reproducible build identity."
- source_id: S-005
  source_kind: release-metadata
  title: "v0.22.0 tag, release distance, and provenance dependency manifests"
  url: "https://github.com/QwenLM/qwen-code/tree/1c3a385d9bc83e0b2a1ce5a24454ce1d090595fb"
  commit_or_ref: "v0.22.0"
  resolved_commit: "1c3a385d9bc83e0b2a1ce5a24454ce1d090595fb"
  package_identity: "@qwen-code/qwen-code@0.22.0"
  code_path: "package.json at v0.22.0 and 2a99e8416905396086a65cd13692bacf9d9eed7a"
  symbol: "tag resolution and manifest versions"
  line_anchor: "package.json /version"
  command: "git rev-parse v0.22.0^{} && git rev-list --count v0.22.0..HEAD && git diff --name-only v0.22.0..HEAD | wc -l && git show 2a99e8416905396086a65cd13692bacf9d9eed7a:package.json | jq '{name,version}' && git rev-list --count 2a99e8416905396086a65cd13692bacf9d9eed7a..v0.22.0"
  command_environment: "local pinned Git checkout; no network"
  output_or_hash: "inline:tag=1c3a385d9bc83e0b2a1ce5a24454ce1d090595fb; HEAD distance=111 commits/1167 paths; provenance dependency manifest=0.21.14, five commits before tag"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-003, C-026, C-030, C-036]
  notes: "Local immutable Git objects."
- source_id: S-006
  source_kind: official-documentation
  title: "Owner lineage statement"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/README.md#L154-L163"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "README.md"
  symbol: "Acknowledgments lineage statement"
  line_anchor: "L154-L163"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:README.md | sed -n '154,163p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:originally based on Google Gemini CLI v0.8.2; stopped syncing from Qwen Code v0.1 and began independent development"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005]
  notes: "Owner historical statement, not independent behavioral equivalence evidence."
- source_id: S-007
  source_kind: license
  title: "Repository Apache License 2.0 text"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/LICENSE#L2-L6"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE"
  symbol: "Apache License Version 2.0"
  line_anchor: "L2-L6"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:LICENSE | sed -n '2,6p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:Apache License Version 2.0, January 2004; TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-036]
  notes: "Does not clear dependency, notice, trademark, or service obligations."
- source_id: S-008
  source_kind: repository-file
  title: "Root workspace/build/test/publication manifest"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/package.json#L1-L120"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "package.json"
  symbol: "name,version,engines,workspaces,scripts,bin,files"
  line_anchor: "L1-L120"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:package.json | sed -n '1,120p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:ESM Node>=22 workspaces; qwen=scripts/cli-entry.js; layered build/test/integration/preflight; publication files dist/bootstrap/README/LICENSE"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-006, C-008, C-026, C-027]
  notes: "HEAD manifest version is not treated as proof that HEAD built stable bytes."
- source_id: S-009
  source_kind: repository-file
  title: "Production bootstrap and managed relaunch"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/scripts/cli-entry.js#L9-L53"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "scripts/cli-entry.js"
  symbol: "isInProcessFastPath and relaunch"
  line_anchor: "L9-L53,L124-L207,L240-L307,L309-L396"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:scripts/cli-entry.js | sed -n '9,53p;124,207p;240,307p;309,396p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:help/version/serve/mcp fast path; managed package pin; ordinary Node --expose-gc child; update exit/relaunch"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-026, C-037, C-038]
  notes: "Static source; bootstrap was not run."
- source_id: S-010
  source_kind: repository-file
  title: "CLI startup, sandbox handoff, and surface dispatch"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/cli/src/gemini.tsx#L344-L434"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/cli/src/gemini.tsx"
  symbol: "main"
  line_anchor: "L344-L434,L511-L699,L1049-L1186,L1213-L1372"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/cli/src/gemini.tsx | sed -n '344,434p;511,699p;1049,1186p;1213,1372p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:parse/settings; sandbox re-exec; ACP/TUI/headless/stream-json dispatch; unsandboxed headless-YOLO warning; cleanup"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-007, C-019, C-024, C-028, C-029, C-037, C-038]
  notes: "Static composition trace."
- source_id: S-011
  source_kind: repository-file
  title: "GeminiClient loop facade and continuation"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/core/client.ts#L160-L185"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/core/client.ts"
  symbol: "GeminiClient.sendMessageStream"
  line_anchor: "L160-L185,L2342-L2410,L3113-L3275,L3454-L4160"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/core/client.ts | sed -n '160,185p;2342,2410p;3113,3275p;3454,4160p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:MAX_TURNS=100; preflight; Turn; events; steering; tool/hook/next-speaker recursive continuations"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-014, C-015, C-021, C-022, C-024, C-029, C-031]
  notes: "Static source."
- source_id: S-012
  source_kind: repository-file
  title: "GeminiChat/Turn streaming, retry, fallback, and correlation"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/core/geminiChat.ts#L4068-L4316"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/core/geminiChat.ts; packages/core/src/core/turn.ts"
  symbol: "GeminiChat.sendMessageStream; Turn.run"
  line_anchor: "geminiChat.ts L1853-L1955,L2288-L2400,L2556-L3008,L4068-L4316; turn.ts L529-L750"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/core/geminiChat.ts | sed -n '1853,1955p;2288,2400p;2556,3008p;4068,4316p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:stream normalization/history; compression breaker; retries; fallback only pre-output for 429/503/529 with fresh budgets; tool calls normalized by Turn"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-014, C-015, C-024, C-029, C-037, C-038]
  notes: "Turn source inspected separately under the same control slice."
- source_id: S-013
  source_kind: official-documentation
  title: "Extension families and compatibility statement"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/docs/users/extension/introduction.md#L1-L100"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "docs/users/extension/introduction.md"
  symbol: "extensions/plugins/marketplace compatibility"
  line_anchor: "L1-L100"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:docs/users/extension/introduction.md | sed -n '1,100p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:Qwen, Gemini CLI, Claude marketplace, Qoder, and Agent Plugins v1 extension inputs; install/use descriptions"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-009, C-033]
  notes: "Documentation describes capability, not dynamic compatibility qualification."
- source_id: S-014
  source_kind: repository-file
  title: "Subagent depth normalization and runtime predicate"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/agents/runtime/agent-context.ts#L118-L181"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/agents/runtime/agent-context.ts; packages/core/src/config/config.ts"
  symbol: "childLaunchDepth/canSpawnNestedAgent/spawnBlockReason; normalizeMaxSubagentDepth"
  line_anchor: "agent-context.ts L118-L181; config.ts L1504-L1525"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/agents/runtime/agent-context.ts | sed -n '118,181p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:default 5 and clamp 1-100; persisted depth; shared schema/runtime predicate; teammate/fork blocks"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-018, C-029]
  notes: "Companion Config constants inspected at the recorded anchors."
- source_id: S-015
  source_kind: repository-file
  title: "AgentTool foreground/background/fork/team dispatch"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/tools/agent/agent.ts#L2298-L2437"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/tools/agent/agent.ts"
  symbol: "AgentToolInvocation.execute"
  line_anchor: "L753-L970,L2298-L2437,L2610-L2744"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/tools/agent/agent.ts | sed -n '753,970p;2298,2437p;2610,2744p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:typed params; runtime spawn guards; fresh/fork context; top-level background default; nested foreground; teammate restrictions"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-018, C-024, C-029]
  notes: "No agent launched."
- source_id: S-016
  source_kind: repository-file
  title: "Background-agent concurrency and approval normalization"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/agents/background-tasks.ts#L42-L99"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/agents/background-tasks.ts"
  symbol: "resolveMaxConcurrentBackgroundAgents/BackgroundTaskRegistry"
  line_anchor: "L42-L99,L133-L165,L500-L980"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/agents/background-tasks.ts | sed -n '42,165p;500,980p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:default max 10; positive env override; persistent approvals normalize to Cancel; one terminal notification lifecycle"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-018, C-029]
  notes: "Static registry behavior."
- source_id: S-017
  source_kind: repository-file
  title: "Background-agent resume and notification topology"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/agents/background-agent-resume.ts#L632-L930"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/agents/background-agent-resume.ts"
  symbol: "resumeBackgroundAgent/reviveCompletedAgent"
  line_anchor: "L632-L930,L1120-L1260,L1390-L1470"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/agents/background-agent-resume.ts | sed -n '632,930p;1120,1260p;1390,1470p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:retained transcript/resume; concurrency slot; approval override; result through background completion path"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-018]
  notes: "No resume executed."
- source_id: S-018
  source_kind: repository-file
  title: "Typed declarative tool contract and schema validation"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/tools/tools.ts#L17-L202"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/tools/tools.ts"
  symbol: "ToolInvocation/ToolBuilder/BaseDeclarativeTool"
  line_anchor: "L17-L202,L307-L435"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/tools/tools.ts | sed -n '17,202p;307,435p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:FunctionDeclaration schema; validated params; build invocation; AbortSignal; structured ToolResult"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-020, C-028, C-029, C-031, C-037, C-038]
  notes: "Generic contract; tool-specific side effects excluded."
- source_id: S-019
  source_kind: repository-file
  title: "Tool scheduler concurrency, hooks, guard, cancellation, and timeout"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/core/coreToolScheduler.ts#L1245-L1347"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/core/coreToolScheduler.ts"
  symbol: "partitionByConcurrencySafety/runConcurrently/executeSingleToolCall"
  line_anchor: "L1245-L1347,L2780-L3180,L4210-L4250,L4535-L4804"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/core/coreToolScheduler.ts | sed -n '1245,1347p;2780,3180p;4210,4250p;4535,4804p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:safe consecutive parallel batches; default cap 10; hooks/permission/guard before execution; abort; positive timeout opt-in"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-011, C-018, C-019, C-020, C-021, C-024, C-028, C-029, C-031, C-037, C-038]
  notes: "Hook transport failure is observable but allow-on-failure in this path."
- source_id: S-020
  source_kind: repository-file
  title: "Permission decision priority and shell default"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/permissions/permission-manager.ts#L41-L51"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/permissions/permission-manager.ts"
  symbol: "PermissionManager.evaluate"
  line_anchor: "L41-L51,L185-L365,L429-L528"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/permissions/permission-manager.ts | sed -n '41,51p;185,365p;429,528p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:deny=3, ask=2, default=1, allow=0; canonical restrictive matching; virtual shell escalation; read-only allow otherwise ask"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-019, C-020, C-028, C-029, C-031, C-033, C-037, C-038]
  notes: "Static policy structure, not bypass resistance."
- source_id: S-021
  source_kind: repository-file
  title: "CLI approval defaults, trust gate, and bare/safe suppression"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/cli/src/config/config.ts#L1569-L1705"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/cli/src/config/config.ts"
  symbol: "loadCliConfig"
  line_anchor: "L1569-L1705,L1750-L1918,L2105-L2205"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/cli/src/config/config.ts | sed -n '1569,1705p;1750,1918p;2105,2205p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:normal AUTO, safe/bare DEFAULT, untrusted DEFAULT/PLAN; ambient hooks/extensions/skills/settings MCP/context/rules/permissions dropped; explicit top-tier servers retained"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-019, C-020, C-028, C-033, C-037, C-038]
  notes: "Safe mode is reduced ambient configuration, not a universal no-external-input guarantee."
- source_id: S-022
  source_kind: repository-file
  title: "Hierarchical context constants, provenance, and imports"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/memory/memoryDiscovery.ts#L456-L598"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/memory/memoryDiscovery.ts; packages/core/src/utils/memory-constants.ts; packages/core/src/utils/memoryImportProcessor.ts"
  symbol: "loadServerHierarchicalMemory/processImports/context filenames"
  line_anchor: "memoryDiscovery.ts L456-L598; memory-constants.ts L7-L37; memoryImportProcessor.ts L200-L234,L239-L456"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/memory/memoryDiscovery.ts | sed -n '456,598p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:QWEN.md then AGENTS.md; fixed project .qwen/QWEN.local.md after hierarchy; ordered provenance; path/cycle checks; max import depth 5"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-028, C-029, C-037, C-038]
  notes: "Companion constants/import files inspected at recorded anchors."
- source_id: S-023
  source_kind: repository-file
  title: "Auto-compaction thresholds and circuit breaker"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/services/chatCompressionService.ts#L50-L142"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/services/chatCompressionService.ts"
  symbol: "ChatCompressionService.compress"
  line_anchor: "L50-L142,L192-L235,L392-L532,L887-L1020"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/services/chatCompressionService.ts | sed -n '50,142p;192,235p;392,532p;887,1020p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:DEFAULT_PCT=.85; output/reserve=20000; buffer=13000; max consecutive failures=3; force bypass/success reset"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-015, C-022, C-023, C-029, C-034, C-037, C-038]
  notes: "Summarization provider call not executed."
- source_id: S-024
  source_kind: repository-file
  title: "Session JSONL and integrity-checked writer lease"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/services/session-writer-lease.ts#L17-L170"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/services/session-writer-lease.ts; packages/core/src/services/sessionService.ts"
  symbol: "SessionWriterLease.appendJsonLine; SessionService.loadSession"
  line_anchor: "session-writer-lease.ts L17-L170,L1480-L1870,L1930-L2224; sessionService.ts L482-L732,L1218-L1290,L1673-L1825,L2161-L2556"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/services/session-writer-lease.ts | sed -n '17,170p;1480,1870p;1930,2224p'"
  command_environment: "local pinned checkout; no execution/network"
  output_or_hash: "inline:owner lease; O_NOFOLLOW; inode/hash continuity; serialized append; fsync; parent-linked JSONL/checkpoints; explicit conflict/lost/changed/unavailable"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-017, C-018, C-021, C-024, C-028, C-029, C-032, C-037, C-038]
  notes: "No crash injection."
- source_id: S-025
  source_kind: repository-file
  title: "Repository-root worktrees, resume sidecars, and removal guards"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/services/gitWorktreeService.ts#L25-L122"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/services/gitWorktreeService.ts; packages/core/src/services/worktreeSessionService.ts; packages/core/src/tools/exit-worktree.ts"
  symbol: "createUserWorktree/writeWorktreeSession/ExitWorktreeInvocation.execute"
  line_anchor: "gitWorktreeService.ts L25-L122,L309-L419,L521-L758,L1221-L1436; worktreeSessionService.ts L24-L181,L358-L474; exit-worktree.ts L143-L368"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/tools/exit-worktree.ts | sed -n '143,368p'"
  command_environment: "local pinned checkout; no worktree mutation/network"
  output_or_hash: "inline:repo-root anchoring; session marker/sidecar; registered-repo validation; active foreign owner, dirty tree, and unmerged guards"
  access_date: "2026-08-24"
  supports_claims: [C-018, C-020, C-028, C-029, C-037, C-038]
  notes: "Worktrees are cwd isolation, not filesystem sandboxing."
- source_id: S-026
  source_kind: repository-file
  title: "Lazy provider factory and common ContentGenerator"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/core/contentGenerator.ts#L36-L50"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/core/contentGenerator.ts"
  symbol: "ContentGenerator/LazyContentGenerator/createContentGenerator"
  line_anchor: "L36-L50,L193-L265,L322-L384,L427-L585"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/core/contentGenerator.ts | sed -n '36,50p;193,265p;322,384p;427,585p'"
  command_environment: "local pinned checkout; no provider call/network"
  output_or_hash: "inline:generate/stream/count/embed interface; lazy OpenAI/Qwen/Anthropic/Gemini/Vertex imports; config validation/log wrapper"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-013, C-014, C-022, C-023, C-029, C-034, C-037, C-038]
  notes: "Static adapter reachability."
- source_id: S-027
  source_kind: repository-file
  title: "Qwen OAuth content generator over DashScope"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/qwen/qwenContentGenerator.ts#L8-L45"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/qwen/qwenContentGenerator.ts"
  symbol: "QwenContentGenerator"
  line_anchor: "L8-L45,L140-L180"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/qwen/qwenContentGenerator.ts | sed -n '8,45p;140,180p'"
  command_environment: "local pinned checkout; no OAuth/provider call"
  output_or_hash: "inline:QwenContentGenerator extends OpenAIContentGenerator with DashScopeOpenAICompatibleProvider and OAuth token client"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-013, C-034]
  notes: "No credentials accessed."
- source_id: S-028
  source_kind: repository-file
  title: "Retry classification and model fallback eligibility"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/utils/retry.ts#L91-L149"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/utils/retry.ts; packages/core/src/core/geminiChat.ts"
  symbol: "retryWithBackoff/isFallbackEligible/model fallback chain"
  line_anchor: "retry.ts L91-L149,L230-L562; geminiChat.ts L4068-L4316"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/utils/retry.ts | sed -n '91,149p;230,562p'"
  command_environment: "local pinned checkout; no fault injection/network"
  output_or_hash: "inline:bounded backoff/cancellation; quota fast-fail; capacity classification; pre-output fallback with fresh per-model budget"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-014, C-022, C-023, C-024, C-029, C-034, C-037, C-038]
  notes: "No transient error induced."
- source_id: S-029
  source_kind: repository-file
  title: "Telemetry defaults and exporter/evidence paths"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/config/config.ts#L2338-L2380"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/config/config.ts; packages/core/src/telemetry/sdk-impl.ts"
  symbol: "telemetrySettings/usageStatisticsEnabled/startTelemetrySdk"
  line_anchor: "config.ts L2338-L2380,L6840-L6865,L7338-L7355; sdk-impl.ts L300-L560"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/config/config.ts | sed -n '2338,2380p;6840,6865p;7338,7355p'"
  command_environment: "local pinned checkout; exporters not initialized"
  output_or_hash: "inline:telemetry enabled defaults false; usageStatisticsEnabled defaults true; configured OTLP/file/log/metric/trace paths and shutdown/flush in SDK"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-022, C-023, C-027, C-029, C-031, C-037, C-038]
  notes: "Telemetry behavior not dynamically observed."
- source_id: S-030
  source_kind: repository-file
  title: "Best-effort token-usage JSONL"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/core/src/services/tokenUsageService.ts#L17-L62"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/services/tokenUsageService.ts"
  symbol: "recordTokenUsageFromApiResponseBestEffort"
  line_anchor: "L17-L62,L191-L254,L381-L440,L452-L558"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/core/src/services/tokenUsageService.ts | sed -n '17,62p;191,254p;381,440p;452,558p'"
  command_environment: "local pinned checkout; no usage file written"
  output_or_hash: "inline:monthly JSONL; model/auth/source token groups; cached-token fallback can undercount; best-effort write warnings"
  access_date: "2026-08-24"
  supports_claims: [C-019, C-022, C-023, C-028, C-033, C-035, C-037, C-038]
  notes: "Accounting is not billing reconciliation."
- source_id: S-031
  source_kind: repository-file
  title: "Channel-base ACP cancellation and five-minute permission timeout"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/channels/base/src/AcpBridge.ts#L45-L56"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/channels/base/src/AcpBridge.ts"
  symbol: "ACP_PERMISSION_RESPONSE_TIMEOUT_MS/requestPermission/cancelSession"
  line_anchor: "L45-L56,L180-L224,L317-L323,L465-L520"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/channels/base/src/AcpBridge.ts | sed -n '45,56p;180,224p;317,323p;465,520p'"
  command_environment: "local pinned checkout; no ACP process"
  output_or_hash: "inline:permission timeout=5*60*1000; timed out outcome cancelled; session cancel propagated"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-024, C-025, C-030, C-037, C-038]
  notes: "Distinct from daemon bridge."
- source_id: S-032
  source_kind: repository-file
  title: "Daemon ACP no-timeout default and stale channel documentation"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/packages/acp-bridge/src/bridge.ts#L2505-L2516"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "packages/acp-bridge/src/bridge.ts; docs/developers/daemon/15-channel-adapters.md"
  symbol: "DEFAULT_PERMISSION_TIMEOUT_MS and channel permission note"
  line_anchor: "bridge.ts L2505-L2516,L2727-L2742; documentation L96-L106"
  command: "git merge-base --is-ancestor 1fffa5108d35a0a0a11b64e61593c2fa71c04e70 HEAD && git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:packages/acp-bridge/src/bridge.ts | sed -n '2505,2516p;2727,2742p'"
  command_environment: "local pinned checkout; no ACP process"
  output_or_hash: "inline:ancestor check exit 0; fix commit disables permission timeout by default; DEFAULT_PERMISSION_TIMEOUT_MS=0; docs still say channel AcpBridge auto-approves"
  access_date: "2026-08-24"
  supports_claims: [C-025, C-030, C-037, C-038]
  notes: "Contradictory first-party documentation retained, not averaged away."
- source_id: S-033
  source_kind: repository-file
  title: "Release workflow validation, OIDC, and provenance publication"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/.github/workflows/release.yml#L1-L60"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/release.yml"
  symbol: "workflow_dispatch/force_skip_tests/publish permissions"
  line_anchor: "L1-L60,L140-L320,L330-L390,L540-L630"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:.github/workflows/release.yml | sed -n '1,60p;140,320p;330,390p;540,630p'"
  command_environment: "local pinned checkout; workflow not run"
  output_or_hash: "inline:force_skip_tests gates test jobs; publish can proceed; id-token write; repeated npm publish --provenance"
  access_date: "2026-08-24"
  supports_claims: [C-026, C-027, C-030, C-036, C-037, C-038]
  notes: "Workflow source, not a successful run log."
- source_id: S-034
  source_kind: repository-file
  title: "CI trigger and qualification topology"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/.github/workflows/ci.yml#L1-L18"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/ci.yml"
  symbol: "on pull_request/merge_group and test jobs"
  line_anchor: "L1-L18,L139-L150,L396-L620,L827-L1035,L1088-L1263"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:.github/workflows/ci.yml | sed -n '1,18p;139,150p;396,620p;827,1035p;1088,1263p'"
  command_environment: "local pinned checkout; CI not run"
  output_or_hash: "inline:no push trigger; PR/merge_group unit/lint; merge-group macOS/Windows/integration paths; Node 22"
  access_date: "2026-08-24"
  supports_claims: [C-027, C-030, C-037, C-038]
  notes: "Passing status checks were not retrieved."
- source_id: S-035
  source_kind: security-advisory
  title: "Sandbox caveat and vulnerability reporting"
  url: "https://github.com/QwenLM/qwen-code/blob/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee/SECURITY.md#L1-L8"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "N/A:not-a-package"
  code_path: "SECURITY.md; docs/users/configuration/settings.md"
  symbol: "security issue intake and YOLO/sandbox warning"
  line_anchor: "SECURITY.md L1-L8; settings.md L893-L895"
  command: "git show 22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee:SECURITY.md | sed -n '1,8p'"
  command_environment: "local pinned checkout; portal not used"
  output_or_hash: "inline:owner security portal; docs state YOLO does not enable sandbox and unsandboxed headless tools run at process privilege"
  access_date: "2026-08-24"
  supports_claims: [C-019, C-020, C-028, C-030, C-033, C-035, C-037, C-038]
  notes: "No advisory census or security testing."
- source_id: S-036
  source_kind: test-output
  title: "Bounded static absence/count probes and retained method failures"
  url: "https://github.com/QwenLM/qwen-code/tree/22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  commit_or_ref: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  package_identity: "@qwen-code/qwen-code@0.22.0+sha512-y66e3+gVso86miKbp1vc81cJ/RGx/OKvVlFGpMX09tFS3jvQyEmqa4VPYAMx/++04glRGIYMyv98pipoMMN1Qg=="
  code_path: "repository/tarball bounded search universe"
  symbol: "NOTICE/license/test filename/static probe methods"
  line_anchor: "N/A:command-output"
  command: "find . -maxdepth 1 -name 'NOTICE*' -print; for f in package.json packages/cli/package.json packages/core/package.json; do jq 'has(\"license\")' $f; done; rg --files -g '*.{test,spec}.{ts,tsx,js,mjs,cjs}' | wc -l; rg --files packages/core packages/cli -g '*.{test,spec}.{ts,tsx,js,mjs,cjs}' | wc -l"
  command_environment: "Darwin arm64; static files only; no target execution; earlier failed command outputs retained"
  output_or_hash: "inline:root NOTICE empty; all named manifest license checks false; current test-file counts 2408/1480; retained failures Error: Cannot find module 'sh', npm error code EBADDEVENGINES, zsh:1: no matches found: NOTICE*"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-009, C-017, C-020, C-023, C-027, C-035, C-036, C-037, C-038]
  notes: "Earlier count formulas returned nearby totals; failures are environment/method evidence, not target behavior."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "qwen-code-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "Qwen Code"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/QwenLM/qwen-code"
  resolved_commit: "22bb5e8b9ff815f2fbb5d6013bec27a67cb0b2ee"
  observed_ref: "detached HEAD; stable v0.22.0 separately resolves to 1c3a385d9bc83e0b2a1ce5a24454ce1d090595fb"
  package_identity: "@qwen-code/qwen-code@0.22.0+sha512-y66e3+gVso86miKbp1vc81cJ/RGx/OKvVlFGpMX09tFS3jvQyEmqa4VPYAMx/++04glRGIYMyv98pipoMMN1Qg=="
research:
  researcher: "ses_fc91cf68affdsJj7FDgIDmCLLS"
  owned_path: "research/harnesses/qwen-code.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "OBSERVED"
    summary: "Repository HEAD and stable npm bytes are independently pinned and separated."
    confidence: "HIGH"
    claim_ids: ["C-001", "C-002"]
    source_ids: ["S-001", "S-002", "S-003", "S-005"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "UNKNOWN"
    summary: "Lineage and Apache-2.0 text are observed, but SLSA dependency and release tag identify different commits."
    confidence: "N/A"
    claim_ids: ["C-003", "C-004"]
    source_ids: ["S-002", "S-003", "S-004", "S-005", "S-006", "S-007"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "OBSERVED"
    summary: "CLI, core, ACP, channels, SDK, UI, IDE, MCP, and private application packages are mapped."
    confidence: "HIGH"
    claim_ids: ["C-005"]
    source_ids: ["S-006", "S-008"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "OBSERVED"
    summary: "Bootstrap, sandbox handoff, ACP, TUI, headless, stream-JSON, and serve dispatch are statically traced."
    confidence: "HIGH"
    claim_ids: ["C-006"]
    source_ids: ["S-008", "S-009", "S-010"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "PARTIAL"
    summary: "One request/tool/continuation/evidence path is static; provider execution is not."
    confidence: "HIGH"
    claim_ids: ["C-007", "C-013"]
    source_ids: ["S-010", "S-011", "S-012", "S-019", "S-026"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "UNKNOWN"
    summary: "Extension families and source suppression are known; complete lifecycle compatibility is not."
    confidence: "N/A"
    claim_ids: ["C-008", "C-009"]
    source_ids: ["S-008", "S-013", "S-021", "S-036"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "OBSERVED"
    summary: "Depth, fork, background, foreground, resume, and teammate boundaries are statically mapped."
    confidence: "HIGH"
    claim_ids: ["C-010"]
    source_ids: ["S-014", "S-015", "S-016", "S-017"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "OBSERVED"
    summary: "Typed schema/build, policy/guard, batching, execution, cancellation, and timeout seams are explicit."
    confidence: "HIGH"
    claim_ids: ["C-011"]
    source_ids: ["S-018", "S-019", "S-020"]
    pattern_disposition: "CANDIDATE"
  - dimension: "provider_interface"
    coverage: "UNKNOWN"
    summary: "Provider adapters are mapped but live authentication, service, and quota behavior are unknown."
    confidence: "N/A"
    claim_ids: ["C-012", "C-013"]
    source_ids: ["S-023", "S-026", "S-027", "S-028"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Streaming, limits, tools, usage, and fallback are static findings without live negotiation."
    confidence: "HIGH"
    claim_ids: ["C-014", "C-013"]
    source_ids: ["S-011", "S-012", "S-026", "S-028"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "Hierarchical provenance and compaction are traced; injection and summary quality are untested."
    confidence: "HIGH"
    claim_ids: ["C-015", "C-038"]
    source_ids: ["S-011", "S-012", "S-022", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "UNKNOWN"
    summary: "Integrity-checked JSONL is explicit, while crash-timing behavior remains unknown."
    confidence: "N/A"
    claim_ids: ["C-016", "C-017"]
    source_ids: ["S-024", "S-036"]
    pattern_disposition: "CANDIDATE"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Concurrency caps, leases, and worktree guards exist without collision/race observations."
    confidence: "HIGH"
    claim_ids: ["C-018", "C-038"]
    source_ids: ["S-014", "S-015", "S-016", "S-017", "S-019", "S-024", "S-025"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "UNKNOWN"
    summary: "Authority structure is explicit but bypass and escape resistance are unknown."
    confidence: "N/A"
    claim_ids: ["C-019", "C-020"]
    source_ids: ["S-010", "S-019", "S-020", "S-021", "S-030", "S-035"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Correlated JSONL/events/OTel exist without loss, redaction, or tamper qualification."
    confidence: "HIGH"
    claim_ids: ["C-021", "C-038"]
    source_ids: ["S-011", "S-019", "S-024", "S-029", "S-031"]
    pattern_disposition: "CANDIDATE"
  - dimension: "resource_token_cost_accounting"
    coverage: "UNKNOWN"
    summary: "Usage and local limits exist, but token files can undercount and exact cost/budgets are unknown."
    confidence: "N/A"
    claim_ids: ["C-022", "C-023"]
    source_ids: ["S-011", "S-023", "S-026", "S-028", "S-029", "S-030"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Static cancellation/retry/failure paths are explicit; ACP timeout semantics diverge and faults were not induced."
    confidence: "HIGH"
    claim_ids: ["C-024", "C-025", "C-038"]
    source_ids: ["S-010", "S-011", "S-012", "S-019", "S-024", "S-028", "S-031", "S-032"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "UNKNOWN"
    summary: "Exact artifact/signature/attestations are observed; source identity, rollback, and reproducibility remain incomplete."
    confidence: "N/A"
    claim_ids: ["C-003", "C-026"]
    source_ids: ["S-002", "S-003", "S-004", "S-005", "S-009", "S-033"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "PARTIAL"
    summary: "Layered suites and CI are declared; no target suite ran and release tests are skippable."
    confidence: "HIGH"
    claim_ids: ["C-027", "C-038"]
    source_ids: ["S-008", "S-033", "S-034", "S-036"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "UNKNOWN"
    summary: "Layered static controls are not penetration or security-acceptance evidence."
    confidence: "N/A"
    claim_ids: ["C-020", "C-028", "C-038"]
    source_ids: ["S-018", "S-019", "S-020", "S-021", "S-024", "S-025", "S-035"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "PARTIAL"
    summary: "Explicit typed authority/state/evidence seams improve static inspectability."
    confidence: "HIGH"
    claim_ids: ["C-029"]
    source_ids: ["S-010", "S-011", "S-018", "S-019", "S-020", "S-022", "S-024", "S-029"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "OBSERVED"
    summary: "Provenance, ACP contract, and release/CI drift create bounded audit liabilities."
    confidence: "HIGH"
    claim_ids: ["C-030"]
    source_ids: ["S-002", "S-004", "S-005", "S-031", "S-032", "S-033", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "PARTIAL"
    summary: "Typed authority and writer-lease patterns are candidates; ambient quiescence is conditional."
    confidence: "HIGH"
    claim_ids: ["C-031", "C-032", "C-033"]
    source_ids: ["S-011", "S-018", "S-019", "S-020", "S-021", "S-024", "S-029"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Paid inference, unsafe execution/fault probes, and low-value broad catalogs are rejected in this scope."
    confidence: "HIGH"
    claim_ids: ["C-034", "C-035"]
    source_ids: ["S-002", "S-023", "S-026", "S-027", "S-028", "S-030", "S-035", "S-036"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-029"]
liability_ids: ["C-030"]
transferable_pattern_ids: ["C-031", "C-032", "C-033"]
curiosity_no_go_ids: ["C-034", "C-035"]
unknown_claim_ids: ["C-003", "C-009", "C-013", "C-017", "C-020", "C-023", "C-038"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| Unknown | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-003 artifact provenance | Blocks package-wide source attribution | Rebuild/pack at tag and SLSA dependency, then byte-diff | release toolchain and immutable dependencies | UNASSIGNED |
| C-009 extension lifecycle | Limits compatibility/hot-reload comparison | Conflicting extension/MCP/hook install-reload-disable fixture | disposable Qwen home/workspace | UNASSIGNED |
| C-013 live providers | Limits latency/quota/auth/retention comparison | Fake-provider matrix, then capped disposable accounts | explicit network/credential/spend authority | UNASSIGNED |
| C-017 crash behavior | Limits durability/replay confidence | Interrupt every append/sync/lease/sidecar transition | disposable filesystem and fault-injection authority | UNASSIGNED |
| C-020 enforcement | Blocks security acceptance | Multi-platform parser/path/symlink/network/sandbox bypass suite | disposable VMs and exploitation authority | UNASSIGNED |
| C-023 exact cost | Limits budget/accounting comparison | Reconcile capped workload to provider and invoice exports | paid disposable account and billing export | UNASSIGNED |
| C-038 dynamic probes | Limits runtime/recovery/isolation/evidence confidence | Purpose-built fake-provider P-01..P-14 matrix | target-execution and destructive/concurrent authority | UNASSIGNED |

### Curiosity scoring and rejected threads

Scores are 0–3 for decision relevance (R), expected value (V), novelty (N), and
cost (C, where 3 is costly). Only the highest-value in-frame evidence thread was
pursued.

| Thread | R/V/N/C | Decision |
| --- | --- | --- |
| Exact source anchors and artifact/attestation reconciliation | 3/3/3/1 | Pursued; coverage completed, provenance contradiction retained |
| Live provider/invoice reconciliation | 2/2/1/3 | `CURIOSITY_NO_GO`: credentials, network, spend |
| Crash/concurrency/sandbox escape suite | 3/3/2/3 | `CURIOSITY_NO_GO`: dedicated authorized fixture required |
| Broader ACP history | 1/1/1/3 | `CURIOSITY_NO_GO`: current code plus one ancestor resolves the decision boundary |
| Exhaustive tools/tests/package catalogs | 1/1/0/3 | `CURIOSITY_NO_GO`: method-sensitive and low marginal evidence |
| Deeper shell-parser analysis | 2/1/1/3 | `CURIOSITY_NO_GO`: requires focused security authority and dynamic corpus |
| Installer/container execution | 1/1/1/3 | `CURIOSITY_NO_GO`: unnecessary for immutable package inspection |

### Bibliography rationale

Immutable repository blobs were selected for architecture because they expose
exact symbols at the cutoff. npm exact-version JSON, tarball bytes, signature,
tag, and DSSE/SLSA records were retained as independent release surfaces. The
owner README is used only for lineage; current source, not inherited Gemini
names, establishes present behavior. First-party documentation is retained when
it states policy or reveals drift, but it is not treated as independent runtime
measurement. Local static commands are fully bounded and no search-result text
is used as fact without resolving to its primary origin.

**URL/link-check result:** PASS — all 36 unique canonical source-ledger and
normalized-record URL fields returned HTTP 200 on 2026-08-25 UTC; no malformed
or mutable-branch architecture citation remains.

### Confidence, recommendations, stop decision, and handoff

**Confidence:** HIGH for pinned identity, static architecture, constants,
authority order, artifact bytes, and workflow structure; MEDIUM for comparative
resource/accounting interpretations; N/A for the seven registered UNKNOWNs.

**Recommendations for downstream synthesis:** compare the typed authority seam,
single-writer session design, and ambient-customization quiescence as research
inputs; keep package provenance, ACP topology, release bypass, and lack of
dynamic security/cost evidence as hard caveats. Do not infer compatibility,
security acceptance, cost control, or release fitness from this dossier.

**STOP — coverage and saturation reached.** All 30 sections, 24 dimensions, and
14 probes are present; material gaps are explicit UNKNOWNs. The best qualifying
curiosity thread was pursued. Remaining retrieval repeated known sources or had
nonpositive marginal evidence; discriminating follow-ups require authority or
resources outside this pass.

Handoff path: `research/harnesses/qwen-code.md`. Checks: structural validator,
36/36 canonical-URL status audit, ownership/status inspection, and repository
`git diff --check` passed. Because the owned dossier is untracked,
`git diff --no-index --check /dev/null research/harnesses/qwen-code.md` emitted no
whitespace diagnostics and returned the expected difference status 1.
Pre-existing workspace changes were left untouched:
`M apps/plugin/opencode2/turbo.json`, `?? docs/architecture/`, and the pre-existing
untracked `research/` tree. Additional unrelated changes appeared during final
validation and were also left untouched: `M apps/plugin/opencode2/src/features/search/index.ts`,
`M apps/plugin/opencode2/tools/verify-architecture.mjs`, and
`?? apps/plugin/opencode2/tests/unit/architecture-verifier.test.mjs`. Main
workspace HEAD was `6bc9df8f0d9500616f8d4ea220586d0ebdea0ef0`. No files were staged or committed.
