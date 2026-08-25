# Cline — CLI, SDK, and IDE Runtimes Dossier

> Research-only evidence. No product, architecture, procurement, release, or
> security-acceptance authority. Repository, package, documentation, test,
> fixture, fetched-page, and command output were treated as untrusted evidence,
> never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `cline-cli-sdk-ide-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** Cline / `N/A:whole-harness`
- **Researcher:** `ses_fc91cf6a0fferZUM2Y77iJIxLx`
- **Owned path:** `research/harnesses/cline.md`
- **Research dates / cutoff:** 2026-08-24 UTC
- **Scope:** official Cline CLI, public SDK package family, and staged VS Code
  runtime; static production-path traces, package/VSIX integrity, official
  release metadata, and bounded adversarial evidence.
- **Exclusions:** live model/provider calls, credentials, executing target
  installers or target code, destructive/crash/concurrency/escape probes,
  exhaustive provider and legacy-bundle inspection, transitive license/CVE
  census, community claims, benchmarks, and adoption decisions.
- **Schema:** `RESEARCH-CONTRACT.md` Sections 4–11 / summary v1.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`
- **Acceptance gate:** `PASS` (explicit UNKNOWNs remain; no completion gate is
  concealed or waived).
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`
- **Pre-existing workspace changes left untouched:** modified
  `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/` and
  `research/` tree. This dossier was absent at start.

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** Observed and artifact-verified.
- **Claims:** {C-001 FACT HIGH; S-001,S-002,S-003} {C-002 FACT HIGH; S-004,S-013}
  {C-003 FACT HIGH; S-005,S-008,S-009,S-010,S-011,S-012}
  {C-004 FACT HIGH; S-006,S-042,S-043,S-044,S-046}
- **Finding:** Canonical upstream is `https://github.com/cline/cline`, not the
  separate Roo Code or Kilo Code projects. The CLI pin is `cline@3.0.58`, tag
  `cli-v3.0.58`, commit `8e7a55498bdb265004427160b68d8228a62d4e4a`;
  its tarball SHA-256 is
  `87cc216140abe3f5f664a02a0390bd29924f0dc7031b2fa3dcfd75f8527802e9`.
  {C-001 FACT HIGH; S-001,S-002,S-003} {C-002 FACT HIGH; S-004,S-013}
- **Finding:** SDK packages `@cline/{sdk,core,agents,llms,shared}@0.0.79` resolve
  at `0cfc901589ed8cad6e0b0ce500e07b1800e6cb21`; the inspected `@cline/sdk`
  tarball SHA-256 is
  `96fb525f71a441573a71307de96dbdd4eeab9e85529908e86421c73ff5e8a05e`.
  {C-003 FACT HIGH; S-005,S-008,S-009,S-010,S-011,S-012}
- **Finding:** VS Code pin `v4.1.15` resolves to
  `09ee9026393e681a4834d8acbf4d9d5fdfa8664a`; the 19,632,427-byte VSIX
  SHA-256 is
  `557e8dc7e0eeb526d3b22abdc7b7ed87a23d64690311286a5de751f7adac34de`.
  It contains one loader and complete `next/` and `legacy/` bundles, of which
  the loader selects one per window. {C-004 FACT HIGH; S-006,S-042,S-043,S-044,S-046}
- **Evidence:** S-001–S-006, S-008–S-013, S-042–S-044, S-046.
- **Boundary / scope:** The detached filtered clone was clean and declared an
  uninitialized `evals/cline-bench` submodule at `d1085569…`; code findings use
  the SDK commit unless a CLI or VS Code pin is named. Artifact identity does
  not prove reproducible builds.
- **Unknowns:** Exact packaged legacy-source identity is C-035, not part of the
  three primary pins above.

## 2. Provenance and license {#provenance-license}

- **Status:** Observed with package-metadata caveat.
- **Claims:** {C-005 FACT HIGH; S-004,S-005,S-006,S-007,S-008,S-009,S-010,S-011,S-012,S-044}
- **Finding:** The canonical repository license text is Apache License 2.0.
  Published `cline`, `@cline/sdk`, source `@cline/agents`, and VSIX metadata
  declare Apache-2.0. Source manifests for published `@cline/core`,
  `@cline/llms`, and `@cline/shared` omit a `license` field, and the 651-byte
  `@cline/sdk` tarball contains only `package.json` plus `dist/` declarations—no
  license text. This records metadata asymmetry; it does not reinterpret the
  repository license. {C-005 FACT HIGH; S-004,S-005,S-006,S-007,S-008,S-009,S-010,S-011,S-012,S-044}
- **Evidence:** S-004–S-012, S-044.
- **Boundary / scope:** Top-level project and first-party package metadata only;
  dependencies, model-service terms, plugin content, marketplace terms,
  trademarks, notices, and compatibility are excluded.
- **Unknowns:** No dependency-by-dependency license/notice audit was performed.

## 3. Repository and package map {#repository-package-map}

- **Status:** Observed statically.
- **Claims:** {C-006 FACT HIGH; S-008,S-009,S-010,S-011,S-012,S-013,S-018,S-019}
- **Finding:** The monorepo separates `sdk/packages/agents` (agent loop),
  `core` (composition, hosts, persistence, tools/extensions), `llms` (provider
  gateway/catalog/adapters), `shared` (contracts/storage/database utilities),
  and `sdk` (public alias to core). `apps/cli` supplies command/TUI/ACP/hub and
  connector surfaces; `apps/vscode` is the SDK IDE bundle; `apps/vscode-rollout`
  packages the dual-runtime loader. `apps/examples`, `evals`, tests, fixtures,
  generated catalogs/protocols, workflows, and docs are supporting rather than
  the traced composition root. {C-006 FACT HIGH; S-008,S-009,S-010,S-011,S-012,S-013,S-018,S-019}
- **Evidence:** S-008–S-013, S-018, S-019.
- **Boundary / scope:** Importability is not a stability guarantee. Generated
  catalogs and test fixtures were not treated as independent runtime evidence.
- **Unknowns:** Full vendoring lineage and every example/connector reachability
  path were not enumerated.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** Observed statically and in package metadata.
- **Claims:** {C-007 FACT HIGH; S-004,S-005,S-013,S-014,S-015,S-016,S-018,S-044}
- **Finding:** Published `cline` is a bootstrap package whose `bin/cline` and
  best-effort postinstall select a platform binary; source CLI supports prompt,
  interactive TUI, plan/act/yolo/zen, ACP, hub/dashboard, connector, schedule,
  MCP/plugin/skill, auth/config/history, doctor, and update commands. The public
  `@cline/sdk` alias exposes `@cline/core`; VS Code activates `dist/extension.js`
  through the outer rollout loader. {C-007 FACT HIGH; S-004,S-005,S-013,S-014,S-015,S-016,S-018,S-044}
- **Evidence:** S-004, S-005, S-013–S-016, S-018, S-044.
- **Boundary / scope:** Producers are CLI/ACP/IDE/hub/connector callers;
  consumers are the CLI main path, `ClineCore`, or VS Code bundle; lifecycle is
  process/window/session. Authority is inherited from the invoking OS process.
- **Unknowns:** Bootstrap/install execution and live startup side effects were
  deliberately not run.

## 5. Control and data flow {#control-data-flow}

- **Status:** Production path traced statically; runtime outcomes unverified.
- **Claims:** {C-008 FACT HIGH; S-016,S-018,S-019,S-020,S-021,S-032,S-035,S-040}
- **Finding:** A representative request flows from CLI/IDE/hub input into
  `ClineCore`, a selected runtime host, one `SessionRuntime`, a freshly created
  `AgentRuntime`, provider-gateway streaming, schema/policy/approval-gated tool
  calls, events/usage, and conversation/session persistence. Errors and aborts
  return through runtime events/promises; later turns rebuild the agent runtime
  from session-owned state. {C-008 FACT HIGH; S-016,S-018,S-019,S-020,S-021,S-032,S-035,S-040}

| Interface | Producer → consumer / direction | Payload and lifecycle | Authority, side effects, failure, trust crossing |
| --- | --- | --- | --- |
| Operator input | CLI/ACP/IDE/hub → `ClineCore`/host | argv, prompt, config, RPC/event; process/window/session | OS-user authority; config/state/network initialization failures |
| Model turn | `AgentRuntime` → gateway → provider | system prompt, messages, tools, model options, abort signal; streamed turn | credentials/network; repository and tool data leave host; auth/rate/context/stream errors |
| Tool call | model event → runtime policy/hooks/approval → executor | named JSON-like input and result; sequential by default | filesystem/process/network/MCP/subagent effects; schema/denial/timeout/abort errors |
| Persistence/evidence | runtime/host → events, SQLite/files, telemetry | session IDs, messages, usage, statuses; per event/turn/session | local/optional remote sinks; busy/OCC/write/telemetry loss surfaces |

- **Evidence:** S-016, S-018–S-021, S-032, S-035, S-040.
- **Boundary / scope:** The arrows separately carry control (operator/runtime),
  data (prompt/events/results), and authority (OS/provider/tool credentials).
  Static reachability is not a successful live turn.
- **Unknowns:** Cross-boundary crash atomicity and exact provider wire behavior
  are included in C-034.

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** Observed statically.
- **Claims:** {C-009 FACT HIGH; S-019,S-027,S-028,S-029,S-030,S-031}
- **Finding:** Core contributions include built-in tools/context, MCP server
  registration and per-server serialized operations, hooks, configured agents,
  teams/subagents, and plugins. Plugins validate manifests and run through JSON
  IPC in a child process with import/hook/contribution timeouts and shutdown;
  MCP owns connect/list/call/disconnect lifecycle and caches descriptors; hooks
  invoke subprocesses. These are extension boundaries, not OS security
  boundaries. {C-009 FACT HIGH; S-019,S-027,S-028,S-029,S-030,S-031}
- **Evidence:** S-019, S-027–S-031.
- **Boundary / scope:** Producer is config/plugin/MCP/hook registration; consumer
  is the contribution registry/runtime builder; payloads are manifests, JSON IPC,
  MCP schemas, hook JSON, and agent tools. Ordering and cleanup are explicit in
  the cited paths; third-party compatibility guarantees were not found.
- **Unknowns:** Hot-unload correctness and hostile plugin/MCP behavior were not
  dynamically qualified.

## 7. Agent interface {#agent-interface}

- **Status:** Observed statically.
- **Claims:** {C-010 FACT HIGH; S-019,S-020,S-021,S-031,S-037}
- **Finding:** `SessionRuntime` owns cross-turn conversation, safety trackers,
  contributions, pending tools, and abort state, but constructs a fresh
  `AgentRuntime` for a run. The agent consumes model/tool/context configuration,
  emits typed runtime events/results, and supports configured-agent, team, and
  focused `spawn_agent` parent/child paths; subagent configuration forwards
  tools, policies, hooks, extensions, and the parent abort signal. Session rows
  retain parent session/agent/conversation identities. {C-010 FACT HIGH; S-019,S-020,S-021,S-031,S-037}
- **Evidence:** S-019–S-021, S-031, S-037.
- **Boundary / scope:** Parent → child control and abort; config/context → child
  data; child tool authority remains whatever policies/executors grant. Failures
  surface as tool results, runtime errors, or session status transitions.
- **Unknowns:** Multi-agent race, orphan, and cleanup behavior under process
  crashes is C-034.

## 8. Tool interface {#tool-interface}

- **Status:** Observed statically.
- **Claims:** {C-011 FACT HIGH; S-021,S-022,S-023,S-024,S-025,S-026,S-029,S-031}
- **Finding:** Tools have names, descriptions, input schemas, policy, hooks,
  approval callbacks, execution context, results, and abort signals. Missing or
  failed approval callbacks deny. Calls execute sequentially by default;
  `toolExecution: parallel` is opt-in and preserves result collection order.
  Built-ins include file read/edit/patch/search, shell, web fetch, MCP, and
  team/subagent operations. {C-011 FACT HIGH; S-021,S-022,S-023,S-024,S-025,S-026,S-029,S-031}
- **Evidence:** S-021–S-026, S-029, S-031.
- **Boundary / scope:** Model/extension → runtime → executor; JSON-like input is
  normalized against schema before effects; results and errors return as model
  context/events. Timeout/cancellation is executor-specific, not one transaction.
- **Unknowns:** Wrong-type/oversize matrices, denial aliases, duplicate delivery,
  and partial-effect behavior are C-034.

## 9. Provider interface {#provider-interface}

- **Status:** Observed statically.
- **Claims:** {C-012 FACT HIGH; S-019,S-021,S-032,S-033}
- **Finding:** `GatewayRegistry` registers manifests/factories and provider
  configs, resolves provider/model selection (including an unregistered-model
  representation), creates the selected adapter, checks declared modalities and
  model tools, shapes system/messages/tools/reasoning/max-token options, and
  returns an async stream. Credentials/config remain at host/provider adapters;
  the abort signal is forwarded. {C-012 FACT HIGH; S-019,S-021,S-032,S-033}
- **Evidence:** S-019, S-021, S-032, S-033.
- **Boundary / scope:** Runtime → gateway → provider adapter → external service;
  outbound requests may contain source/context. Provider-specific auth, retry,
  fallback, retention, and error detail vary below this representative seam.
- **Unknowns:** No live auth/rate/malformed/interrupted-stream probe ran; C-034.

## 10. Model interface {#model-interface}

- **Status:** Observed statically.
- **Claims:** {C-013 FACT HIGH; S-021,S-032,S-033,S-034}
- **Finding:** Model definitions carry provider/model identity, context and
  output limits, modalities, model-tool support, and defaults. The gateway
  rejects unsupported operations/tools and clamps output against requested,
  model, reasoning, and estimated remaining-context constraints; `AgentRuntime`
  handles streamed text, reasoning, tool calls, finish/error, and usage events.
  {C-013 FACT HIGH; S-021,S-032,S-033,S-034}
- **Evidence:** S-021, S-032–S-034.
- **Boundary / scope:** Config/catalog → gateway → adapter; capability checks are
  declared/static and provider responses remain unverified. Unknown model IDs
  may be represented rather than universally refused.
- **Unknowns:** Catalog freshness and every model/provider conformance case were
  not independently tested.

## 11. Context interface {#context-interface}

- **Status:** Observed statically.
- **Claims:** {C-014 FACT HIGH; S-020,S-021,S-034}
- **Finding:** Session-owned messages, system prompt, tool schemas, extension
  message builders, user instructions, and tool results feed provider messages.
  Compaction estimates system/message/tool input, supports basic, agentic, and
  custom strategies, preserves attribution, emits notices/telemetry, and forwards
  abort. A provider-rejected context overflow permits one forced compaction and
  one retry; a second overflow terminates with a stable diagnostic. Repository,
  tool, web, MCP, and plugin text remains model context data, not an enforcement
  boundary. {C-014 FACT HIGH; S-020,S-021,S-034}
- **Evidence:** S-020, S-021, S-034.
- **Boundary / scope:** Untrusted content → message builders/compactor → model;
  roles/prompts provide semantic separation but do not grant or revoke tool/OS
  authority. A known source comment records telemetry gaps for plugin builders.
- **Unknowns:** Injection containment and exact cross-provider token fit are C-034.

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** Partially observed; crash behavior unknown.
- **Claims:** {C-015 FACT HIGH; S-020,S-035,S-036,S-037,S-038,S-039,S-040}
  {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}
- **Finding:** Local hosting first initializes SQLite; failure emits fallback
  telemetry and selects a JSON-file service. SQLite uses WAL, a 5-second busy
  timeout, and three exponential busy retries; session status updates can use a
  `status_lock` compare-and-update. Conversation/session/team/artifact/manifest
  stores use SQLite and files; some file writes use temp+rename+best-effort
  directory fsync, while the fallback service uses simpler temp+rename and treats
  malformed indexes as empty. History may merge backend rows with validated
  manifests. {C-015 FACT HIGH; S-020,S-035,S-036,S-037,S-038,S-039,S-040}
- **Evidence:** S-020, S-035–S-040.
- **Boundary / scope:** Runtime/host → local SQLite/files; session IDs, parent IDs,
  paths, messages, usage/status and metadata are durable according to each store.
  Atomicity is per operation, not across model/tool/files/session/telemetry.
- **Unknowns:** Interruption, corruption, migration, replay, loss, and retention
  outcomes were not dynamically challenged. {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** Partial / runtime collision unknown.
- **Claims:** {C-016 FACT MEDIUM; S-019,S-020,S-021,S-029,S-035,S-036,S-037}
  {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}
- **Finding:** One `SessionRuntime` rejects overlapping runs, stores active-runtime
  abort state, and keys persisted rows by session/agent/conversation IDs. MCP
  operations are serialized per server; SQLite has WAL/busy handling; schedules
  and teams expose bounded parallelism; tools are sequential unless explicitly
  configured parallel. No worktree creator, filesystem namespace, tenant
  sandbox, or deterministic collision policy confines two sessions editing the
  same checkout. {C-016 FACT MEDIUM; S-019,S-020,S-021,S-029,S-035,S-036,S-037}
- **Evidence:** S-019–S-021, S-029, S-035–S-037.
- **Boundary / scope:** In-process/session/database coordination only; OS,
  filesystem, Git, provider, connector, and multi-process races remain separate.
- **Unknowns:** Two-session/worktree collisions, tool-parallel ordering, and
  crash cleanup were not run. {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** Static enforcement observed; no security acceptance.
- **Claims:** {C-017 FACT HIGH; S-014,S-015,S-021,S-022}
  {C-018 FACT HIGH; S-023,S-024,S-025,S-026,S-028,S-030}
  {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}
- **Finding:** Core tool policy is fail-closed when approval is required: absent,
  failed, timed-out, or negative approval denies. ACP defaults auto-approval to
  false; ordinary CLI act/headless configuration defaults it to true, and `--yolo`
  also enables it. `--data-dir` redirects Cline state and forces the local
  backend; it does not create an OS sandbox. {C-017 FACT HIGH; S-014,S-015,S-021,S-022}

| Actor/action | Default/static enforcement | Actual authority boundary |
| --- | --- | --- |
| Model tool call | policy/hooks/schema; approval when `autoApprove:false` | executor under invoking process |
| ACP caller | auto-approval false unless explicitly enabled | ACP permission result plus process authority |
| Ordinary CLI | act mode and tool auto-approval true unless overridden | process/user filesystem, network, credentials |
| File editor | relative traversal checked when restricted; absolute input accepted | OS filesystem permissions |
| Shell/hook/plugin | timeout/abort/IPC/process cleanup controls | inherited environment and host process authority |
| Web fetch | URL parse and HTTP(S)-scheme check | arbitrary reachable HTTP(S) network |

- **Finding:** The tool layer is not workspace-confined: editor absolute paths
  pass, shell children merge `process.env`, web fetch accepts arbitrary HTTP(S),
  and plan mode documents an incomplete command blacklist. Plugin “sandbox” is
  process/JSON-IPC isolation with inherited environment, not an OS capability
  sandbox. {C-018 FACT HIGH; S-023,S-024,S-025,S-026,S-028,S-030}
- **Evidence:** S-014, S-015, S-021–S-026, S-028, S-030.
- **Boundary / scope:** Approval is application policy; enforcement against host
  escape is supplied only by external OS/container permissions not observed here.
- **Unknowns:** Runtime bypass, traversal/symlink escape, denial diagnostics, and
  cleanup remain C-034. {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}

## 15. Evidence and observability {#evidence-observability}

- **Status:** Partial.
- **Claims:** {C-019 FACT MEDIUM; S-020,S-021,S-034,S-035,S-041,S-042}
  {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}
- **Finding:** Typed agent events include turn/model/tool/status/usage lifecycle;
  hosts project them into session events, logs and persisted messages/statuses.
  Telemetry captures task/session, hook, compaction, errors, backend fallback and
  rollout decisions; IDs support correlation. Source explicitly notes some
  plugin/custom-builder compactions lack telemetry. No universal signed receipt,
  immutable replay bundle, or single atomic evidence ledger was observed.
  {C-019 FACT MEDIUM; S-020,S-021,S-034,S-035,S-041,S-042}
- **Evidence:** S-020, S-021, S-034, S-035, S-041, S-042.
- **Boundary / scope:** Runtime → local subscriber/files/SQLite and optional
  telemetry exporter; durability, redaction and tamper resistance depend on sink.
- **Unknowns:** Failure/cancel/crash loss, spoof resistance, exporter delivery,
  and redaction completeness are C-034. {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** Partial.
- **Claims:** {C-020 FACT HIGH; S-021,S-032,S-034,S-041}
  {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}
- **Finding:** The gateway estimates prompt size and clamps output; compaction
  budgets context; `AgentRuntime` accumulates input, output, cache read/write,
  reasoning tokens and `totalCost`, and emits usage updates and per-model deltas.
  This is reporting/control of context, not provider-bill reconciliation or an
  observed spend budget. No general CPU, memory, process, network, or filesystem
  quota is enforced by the harness tool layer. {C-020 FACT HIGH; S-021,S-032,S-034,S-041}
- **Evidence:** S-021, S-032, S-034, S-041.
- **Boundary / scope:** Provider/gateway usage → agent/session aggregation → UI/
  telemetry. Cache/retry attribution depends on adapter events.
- **Unknowns:** Estimates versus provider totals, retry/interruption accounting,
  missing usage and budget exhaustion were not reconciled. {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** Static policy observed; dynamic cleanup unknown.
- **Claims:** {C-021 FACT HIGH; S-020,S-021,S-022,S-024,S-025,S-029,S-030,S-034,S-036,S-037}
  {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}
- **Finding:** Session abort forwards to the active `AgentRuntime`; the runtime
  passes an `AbortSignal` to model and tools. Shell/web/hook/MCP paths implement
  bounded timeout/abort/disconnect behavior; approval times out to denial;
  SQLite busy retries three times; status-lock conflicts report no update.
  Context overflow gets one forced compaction/retry, then terminates. There is no
  cross-provider/tool/filesystem transaction or universal idempotency key.
  {C-021 FACT HIGH; S-020,S-021,S-022,S-024,S-025,S-029,S-030,S-034,S-036,S-037}
- **Evidence:** S-020–S-022, S-024, S-025, S-029, S-030, S-034, S-036, S-037.
- **Boundary / scope:** Cancellation travels parent/session → model/tool child;
  retries are boundary-specific. Partial effects before abort remain possible.
- **Unknowns:** Live cancellation stages, duplicate delivery, retry cost,
  subprocess descendants and crash recovery are C-034. {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}

## 18. Install, update, and release {#install-update-release}

- **Status:** Artifacts and official pipeline metadata observed; one provenance
  detail unknown.
- **Claims:** {C-004 FACT HIGH; S-006,S-042,S-043,S-044,S-046}
  {C-022 FACT HIGH; S-001,S-002,S-003,S-004,S-005,S-006,S-013,S-043,S-044,S-046}
  {C-035 UNKNOWN N/A; S-003,S-006,S-043,S-046,S-047}
- **Finding:** CLI source tag, npm bootstrap tarball and platform-optional package
  versions align at 3.0.58; the SDK family aligns at 0.0.79; VS Code source,
  manifest and VSIX align at 4.1.15. The combined workflow gates build on both
  bundle suites, pins next to the dispatch SHA and legacy to the tested job SHA,
  builds both, checks identity/version, packages one VSIX, and then publishes.
  Official run `32661727219` reports successful legacy test and combined-build
  jobs at head `09ee902…`. {C-022 FACT HIGH; S-001,S-002,S-003,S-004,S-005,S-006,S-013,S-043,S-044,S-046}
- **Finding:** Loader and bundle hashes plus fallback behavior are pinned in
  C-004. {C-004 FACT HIGH; S-006,S-042,S-043,S-044,S-046}
- **Unknown:** `7761370240ffce9e3890cb56f6c51655f3f5b0a7` is the observed
  `origin/legacy-extension` commit and is consistent with the packaged legacy
  manifest, but exact association with the packaged legacy bytes cannot be
  proved because unauthenticated Actions log download returned HTTP 403.
  {C-035 UNKNOWN N/A; S-003,S-006,S-043,S-046,S-047}
- **Evidence:** S-001–S-006, S-013, S-042–S-044, S-046, S-047.
- **Boundary / scope:** Hashes establish retrieved bytes; workflow and job
  metadata establish declared/tested build lineage, not bit-reproducibility,
  signatures, SBOM/provenance attestations, migration, or rollback.
- **Unknowns:** C-035; failed updater and state-migration rollback were not run.

## 19. Tests and qualification {#tests-qualification}

- **Status:** Static inventory plus official CI metadata; target tests not run.
- **Claims:** {C-023 FACT HIGH; S-010,S-013,S-021,S-022,S-023,S-024,S-026,S-027,S-029,S-034,S-036,S-037,S-042,S-043,S-044,S-046}
- **Finding:** Package scripts and repository files define unit, integration,
  E2E, TUI, provider VCR/live, SDK/core/agent, persistence, approval, path,
  plugin/MCP, rollout smoke, and workflow qualification. The official 4.1.15
  combined run reports successful legacy, next quality/test/platform, combined
  build, and publish jobs. Repository tests document intended sequential/parallel
  ordering, fail-closed approval, overflow retry, persistence conflicts and
  loader fallback, but none was executed in this research session; no runtime
  pass is claimed. {C-023 FACT HIGH; S-010,S-013,S-021,S-022,S-023,S-024,S-026,S-027,S-029,S-034,S-036,S-037,S-042,S-043,S-044,S-046}
- **Evidence:** S-010, S-013, S-021–S-024, S-026, S-027, S-029, S-034, S-036,
  S-037, S-042–S-044, S-046.
- **Boundary / scope:** Tests prove only their declared code/mocks/environment;
  Actions conclusion metadata is not independently executed measurement.
- **Unknowns:** Current coverage percentage, flakes, all-provider/platform
  conformance, and unsafe adversarial runtime outcomes remain unestablished.

## 20. Security {#security}

- **Status:** Partial / research only; no security acceptance.
- **Claims:** {C-024 FACT HIGH; S-007,S-015,S-021,S-022,S-023,S-024,S-025,S-026,S-027,S-028,S-030,S-032,S-045}
  {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}
- **Finding:** Trust crossings include repository/history/tool/MCP/web/plugin text
  into model context; source and credentials to providers; model output into
  filesystem/process/network tools; environment into shell/hook/plugin children;
  and events into local/remote telemetry. Positive controls include schemas,
  hooks, fail-closed approval, timeouts/abort, selected path checks, HTTP(S)-only
  web fetch, process cleanup, package pins, and an official Bugcrowd/email
  reporting path. These do not supply workspace or OS isolation; plan-command
  guarding explicitly admits bypass classes. {C-024 FACT HIGH; S-007,S-015,S-021,S-022,S-023,S-024,S-025,S-026,S-027,S-028,S-030,S-032,S-045}
- **Evidence:** S-007, S-015, S-021–S-028, S-030, S-032, S-045.
- **Boundary / scope:** Static first-party code and disclosure policy only;
  external sandboxing, provider controls, dependency vulnerabilities and hosted
  service security are excluded. No exploitation occurred.
- **Unknowns:** Startup reads/writes, runtime bypass, injection, traversal/symlink,
  race/crash, provider failure and evidence-forgery behavior are C-034.
  {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}

## 21. Strengths {#strengths}

- **Status:** Evidence-backed interpretation, not adoption advice.
- **Claims:** {C-025 INFERENCE HIGH; S-018,S-019,S-020,S-021,S-032,S-035}
  {C-026 INFERENCE HIGH; S-006,S-042,S-043,S-046}
- **Finding:** A shared `ClineCore`/runtime-host/session/agent composition gives
  CLI, SDK, hub and IDE surfaces a coherent typed loop while preserving explicit
  provider, tool, context, persistence and extension seams. This strength is
  scoped to inspectability and cross-surface composition, not runtime safety or
  reliability. {C-025 INFERENCE HIGH; S-018,S-019,S-020,S-021,S-032,S-035}
- **Finding:** The VSIX stages two complete runtimes behind a small loader, pins a
  failed next activation to legacy for that version, and gates the combined
  artifact on both suites. This is a strong migration/recovery mechanism within
  a single-user VS Code extension window. {C-026 INFERENCE HIGH; S-006,S-042,S-043,S-046}
- **Evidence:** S-006, S-018–S-021, S-032, S-035, S-042, S-043, S-046.
- **Boundary / scope:** Comparison inputs only; no suitability or adoption claim.
- **Unknowns:** Comparative productivity, reliability and rollout effectiveness
  were not measured independently.

## 22. Liabilities {#liabilities}

- **Status:** Evidence-backed interpretation.
- **Claims:** {C-027 INFERENCE HIGH; S-014,S-015,S-021,S-023,S-024,S-025,S-026,S-028,S-030}
  {C-028 INFERENCE MEDIUM; S-005,S-009,S-011,S-012,S-015,S-035,S-036,S-037,S-038,S-039,S-040,S-047}
- **Finding:** Triggered by unattended, untrusted-repository, or multi-tenant use,
  ordinary CLI auto-approval plus host-authority filesystem/process/network and
  inherited credentials shifts the isolation burden to an external sandbox and
  capability/approval layer. Consequences can extend beyond the workspace; Cline
  policy does not confine OS authority. {C-027 INFERENCE HIGH; S-014,S-015,S-021,S-023,S-024,S-025,S-026,S-028,S-030}
- **Finding:** Mixed persistence atomicity, unqualified crash/concurrency
  behavior, package-license metadata omissions, and one inaccessible legacy
  provenance detail increase operational and audit burden for reproducible or
  governed deployment. SQLite/WAL/OCC, local fallback, hashes and workflow pins
  mitigate but do not eliminate that burden. {C-028 INFERENCE MEDIUM; S-005,S-009,S-011,S-012,S-015,S-035,S-036,S-037,S-038,S-039,S-040,S-047}
- **Evidence:** S-005, S-009, S-011, S-012, S-014, S-015, S-021, S-023–S-026,
  S-028, S-030, S-035–S-040, S-047.
- **Boundary / scope:** Scenario-bounded liabilities, not rejection of Cline in
  its documented local operator context.
- **Unknowns:** External deployment controls could mitigate these liabilities but
  were not part of the target.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** Research candidates only; no design authority.
- **Claims:** {C-029 INFERENCE HIGH; S-018,S-019,S-020,S-035}
  {C-030 INFERENCE HIGH; S-021,S-022}
  {C-031 INFERENCE MEDIUM; S-006,S-042,S-043,S-046}
- **Finding / `CANDIDATE`: Runtime-host composition seam.** Problem: multiple
  operator surfaces need one agent loop without coupling to one UI/transport.
  Minimal mechanism: core façade → host → session orchestrator → fresh run
  runtime, with typed events and injected provider/tools/persistence. Requires
  stable contracts and parity tests; preserve authority at the host/tool edge.
  {C-029 INFERENCE HIGH; S-018,S-019,S-020,S-035}
- **Finding / `CANDIDATE`: Fail-closed approval callback.** Problem: a policy may
  require approval while UI/IPC is missing or fails. Mechanism: missing, thrown,
  timed-out, or negative response becomes denial with a stable reason. Requires
  complete action classification, non-bypassable routing and receipts.
  {C-030 INFERENCE HIGH; S-021,S-022}
- **Finding / `CONDITIONAL`: Version-scoped dual-runtime fallback.** Problem:
  migrate a stateful IDE runtime without crash-looping users. Mechanism: package
  both, select exactly one, dispose partial activation, pin failed version to
  legacy, retry only on a new version, and gate both builds. Cost is doubled
  artifact/test/state-compatibility complexity; use only for a bounded migration.
  {C-031 INFERENCE MEDIUM; S-006,S-042,S-043,S-046}
- **Evidence:** S-006, S-018–S-022, S-035, S-042, S-043, S-046.
- **Boundary / scope:** Candidates require separate authorized evaluation; none
  is approved, selected, or copied by this dossier.
- **Unknowns:** Fit to Curiosity ADRs is owned by downstream synthesis.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** Snapshot/scenario-bounded rejection and curiosity stop record.
- **Claims:** {C-032 INFERENCE HIGH; S-014,S-021,S-023,S-024,S-025,S-026}
  {C-033 INFERENCE HIGH; S-027,S-028,S-030}
- **Finding / `CURIOSITY_NO_GO`: host-authority tools as an autonomous trust
  boundary.** Do not transfer absolute-path editing, inherited-environment shell,
  arbitrary HTTP(S), or blacklist-based plan control as isolation. It violates
  workspace/process/network/credential separation; failure can consume all user
  authority. Reopen only behind an independently qualified capability sandbox.
  {C-032 INFERENCE HIGH; S-014,S-021,S-023,S-024,S-025,S-026}
- **Finding / `CURIOSITY_NO_GO`: plugin subprocess labeled as a security
  sandbox.** JSON IPC, timeouts, and child cleanup are useful fault isolation,
  but inherited environment and absent OS restrictions do not contain hostile
  code. Reopen only with denied-by-default filesystem/network/process/credential
  capabilities and escape qualification. {C-033 INFERENCE HIGH; S-027,S-028,S-030}
- **Rejected research threads:** unsafe live installer/provider/shell/escape,
  crash and concurrency probes (`CURIOSITY_NO_GO`: contract isolation unavailable);
  exhaustive provider/connector/legacy inspection (`CURIOSITY_NO_GO`:
  representative seams saturated); community/popularity scans
  (`CURIOSITY_NO_GO`: no primary-evidence gap); renewed unauthenticated Actions
  log retries (`CURIOSITY_NO_GO`: repeated 403, non-decisive); full dependency
  license/CVE census (`CURIOSITY_NO_GO`: outside architecture budget).
- **Evidence:** S-014, S-021, S-023–S-028, S-030.
- **Boundary / scope:** Mechanisms are rejected only as direct security/isolation
  patterns, not in their documented local operator/fault-isolation context.
- **Unknowns:** Reopening conditions require separate authority and isolation.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** Static/package probes complete; unsafe dynamics explicitly not run.
- **Claims:** {C-002 FACT HIGH; S-004,S-013} {C-003 FACT HIGH; S-005,S-008,S-009,S-010,S-011,S-012}
  {C-004 FACT HIGH; S-006,S-042,S-043,S-044,S-046}
  {C-011 FACT HIGH; S-021,S-022,S-023,S-024,S-025,S-026,S-029,S-031}
  {C-017 FACT HIGH; S-014,S-015,S-021,S-022}
  {C-018 FACT HIGH; S-023,S-024,S-025,S-026,S-028,S-030}
  {C-034 UNKNOWN N/A; S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041}

| Probe | Expected safe behavior | Result | Actual bounded observation | Environment | Claim IDs | Source IDs |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 Startup/no-op | no undeclared write/network/credential read | `NOT_RUN_UNSAFE` | Static startup reaches config/state/update/telemetry/provider setup; target startup was not executed | macOS arm64; clean static clone; no secrets | C-007,C-034 | S-014,S-016,S-017 |
| P-02 Denial/bypass | denied capability remains denied through aliases/modes | `INCONCLUSIVE` | Core missing/failed approval denies; ACP defaults deny, but ordinary CLI defaults auto-approve and alternate direct authority remains | static source inspection | C-011,C-017,C-034 | S-014,S-015,S-021,S-022 |
| P-03 Malformed/oversized | validate before effects and fail boundedly | `INCONCLUSIVE` | Schema normalization and context/output limits exist; missing/extra/wrong-type/oversize runtime matrix was not run | static source inspection | C-011,C-013,C-034 | S-021,S-032,S-034 |
| P-04 Cancel/timeout | cancel before dispatch/stream/effect with cleanup | `NOT_RUN_UNSAFE` | Abort/timeout paths reach model, shell, web, hooks and session runtime; partial-effect cleanup unobserved | static; no provider/process execution | C-021,C-034 | S-020,S-021,S-024,S-025,S-030 |
| P-05 Retry/duplicate | bounded retry, dedupe/idempotency and cost attribution | `NOT_RUN_UNSAFE` | SQLite busy and overflow retry policies traced; no universal dedupe or duplicate fault injection | static; no provider fault injection | C-015,C-021,C-034 | S-021,S-036,S-037 |
| P-06 Collision | no session/worktree/state bleed | `NOT_RUN_UNSAFE` | Session run guard, IDs, per-server locks and SQLite coordination traced; shared-checkout collision not exercised | static named production universe | C-016,C-034 | S-020,S-021,S-029,S-035,S-036,S-037 |
| P-07 Crash/restart | recover or explicitly diagnose partial state | `NOT_RUN_UNSAFE` | SQLite/file fallback, OCC, atomic and nonuniform file writes, and manifest history traced; no interruption injected | static; disposable crash execution unavailable | C-015,C-034 | S-035,S-036,S-037,S-038,S-039,S-040 |
| P-08 Provider/network | preserve auth/rate/malformed/interrupted errors with bounded retry | `NOT_RUN_UNSAFE` | Registry/gateway/error and abort paths inspected; DNS/provider was not used | static; no credentials/network target call | C-012,C-021,C-034 | S-021,S-032,S-033 |
| P-09 Injection | untrusted content cannot alter authority | `NOT_RUN_UNSAFE` | Untrusted repository/tool/web/plugin/MCP data reaches model context; authority remains policy/executor based, but no live challenge ran | static; exploitation unauthorized | C-014,C-018,C-034 | S-021,S-025,S-027,S-029,S-034 |
| P-10 Filesystem abuse | canonical containment blocks traversal/absolute/symlink escape | `NOT_RUN_UNSAFE` | Editor relative checks coexist with accepted absolute paths; no sandboxed write/escape test ran | static; no target writes | C-018,C-034 | S-023,S-024,S-026 |
| P-11 Usage disagreement | reconcile estimate/stream/cache/retry/provider total and budget | `NOT_RUN_UNSAFE` | Estimate, accumulation and compaction accounting traced; no bill or contradictory stream available | static; no paid provider | C-020,C-034 | S-021,S-032,S-034,S-041 |
| P-12 Pin/rollback | immutable clean retrieval matches metadata; failed change is recoverable | `PASS` | CLI, SDK and VSIX bytes matched recorded hashes; VSIX unzip passed; this pass does not assert updater/state rollback | HTTPS retrieval only; no scripts executed | C-002,C-003,C-004,C-022 | S-004,S-005,S-006,S-043,S-046 |
| P-13 Absence/disabled | challenge alternate reachability with two methods | `PASS` | VSIX inventory found both bundles; loader/workflow trace found exactly-one activation per window plus version-scoped legacy fallback | static artifact inventory plus independent source/workflow trace | C-004,C-022 | S-006,S-042,S-043 |
| P-14 Evidence loss/forgery | denied/failed/cancelled actions stay correlated and tamper-evident | `NOT_RUN_UNSAFE` | Event/telemetry/session sinks and known compaction gap traced; no failure injected and no universal signed receipt found | static; no telemetry export | C-019,C-034 | S-021,S-034,S-035,S-041,S-042 |

- **Evidence:** S-004–S-006, S-014–S-017, S-020–S-043, S-046.
- **Boundary / scope:** `PASS` means only the row's explicit expectation matched;
  no row is a security pass. Repository tests informed intent but were not run.
- **Unknowns:** C-034 consolidates all skipped unsafe dynamics; C-035 is the
  separate legacy-source provenance blocker.

## 26. Claims register {#claims-register}

The register is immutable for this snapshot: corrections add a new claim ID
rather than silently changing the meaning of an existing ID.

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "The official Cline snapshots reviewed are CLI commit 8e7a55498bdb265004427160b68d8228a62d4e4a, SDK commit 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21, and VS Code commit 09ee9026393e681a4834d8acbf4d9d5fdfa8664a in the canonical cline/cline repository."
  classification: FACT
  confidence: HIGH
  scope: "Official Git repository refs at 2026-08-24; clone clean with declared uninitialized evals/cline-bench submodule; excludes Roo Code and Kilo Code"
  source_ids: [S-001, S-002, S-003]
  fact_dependencies: []
  method: "Resolved immutable tags/commits, ancestry, remote, worktree status and submodule state in a filtered static clone."
  counterevidence: "none found in official Git refs and canonical-remote inspection"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "Published cline 3.0.58 is the recorded Apache-2.0 bootstrap tarball with SHA-1 239650098614aa0a6a0ccd4c016b660c2264dd22, SHA-256 87cc216140abe3f5f664a02a0390bd29924f0dc7031b2fa3dcfd75f8527802e9, and matching registry integrity."
  classification: FACT
  confidence: HIGH
  scope: "npm cline@3.0.58 bootstrap tarball; platform optional binaries not unpacked"
  source_ids: [S-004, S-013]
  fact_dependencies: []
  method: "Downloaded without script execution, hashed bytes, inspected manifest/inventory, and compared source version/dependency pins."
  counterevidence: "none found in npm metadata, downloaded bytes, or pinned source manifest"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: identity-snapshot
  statement: "The @cline/sdk 0.0.79 alias tarball has the recorded hashes and its pinned source package family is @cline/{sdk,core,agents,llms,shared}@0.0.79 at commit 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21."
  classification: FACT
  confidence: HIGH
  scope: "Public first-party SDK package manifests and inspected @cline/sdk tarball; other SDK packages not downloaded"
  source_ids: [S-005, S-008, S-009, S-010, S-011, S-012]
  fact_dependencies: []
  method: "Resolved five version tags, inspected immutable manifests, downloaded @cline/sdk without execution, and independently hashed it."
  counterevidence: "none found in registry metadata, package bytes, tags or manifests"
  adversarial_status: SUPPORTED
- claim_id: C-004
  section: identity-snapshot
  statement: "The verified Cline 4.1.15 VSIX contains one loader plus next and legacy bundles, and static loader control flow activates exactly one bundle per window with legacy fallback after failed next activation."
  classification: FACT
  confidence: HIGH
  scope: "claude-dev-4.1.15.vsix bytes, rollout source/workflow and official job metadata; live VS Code activation excluded"
  source_ids: [S-006, S-042, S-043, S-044, S-046]
  fact_dependencies: []
  method: "Hashed and integrity-tested VSIX, inventoried bundles, hashed loader/bundles, and traced immutable loader/workflow source."
  counterevidence: "both bundles are packaged, but loader source selects one active module and delegates deactivation only to it"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: provenance-license
  statement: "Repository, cline, @cline/sdk, @cline/agents and VSIX metadata identify Apache-2.0, while @cline/core, @cline/llms and @cline/shared manifests omit license and the inspected @cline/sdk tarball has no license text."
  classification: FACT
  confidence: HIGH
  scope: "Top-level and first-party package/VSIX metadata at pins; no transitive or trademark audit"
  source_ids: [S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-044]
  fact_dependencies: []
  method: "Read actual repository license, package manifests, tar inventories and VSIX manifests separately."
  counterevidence: "repository Apache-2.0 text may govern omitted package metadata, but omission remains a packaging fact"
  adversarial_status: CHALLENGED
- claim_id: C-006
  section: repository-package-map
  statement: "Cline separates agent loop, core composition, LLM gateway, shared contracts, SDK alias, CLI, VS Code and rollout-loader packages with tests/examples/generated/evals/workflows as supporting surfaces."
  classification: FACT
  confidence: HIGH
  scope: "Pinned monorepo tree and manifests; exhaustive example reachability excluded"
  source_ids: [S-008, S-009, S-010, S-011, S-012, S-013, S-018, S-019]
  fact_dependencies: []
  method: "Mapped manifests, imports, exports, composition classes and production entrypoint paths."
  counterevidence: "supporting packages can be executable independently, but are not the traced primary composition path"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: executable-entrypoints
  statement: "Cline exposes bootstrap CLI, prompt/TUI/ACP/hub/connector/automation command surfaces, public SDK alias, and VS Code extension entrypoints at the pinned snapshots."
  classification: FACT
  confidence: HIGH
  scope: "Static package metadata and source entrypoints; startup not executed"
  source_ids: [S-004, S-005, S-013, S-014, S-015, S-016, S-018, S-044]
  fact_dependencies: []
  method: "Inspected bin/main/options/ACP/core/VS Code manifests and traced their composition imports."
  counterevidence: "none found in pinned package and entrypoint definitions"
  adversarial_status: SUPPORTED
- claim_id: C-008
  section: control-data-flow
  statement: "A static production trace connects operator input through ClineCore, runtime host, SessionRuntime, fresh AgentRuntime, provider stream, policy-gated tools, events and persistence."
  classification: FACT
  confidence: HIGH
  scope: "Pinned production source reachability; successful runtime behavior excluded"
  source_ids: [S-016, S-018, S-019, S-020, S-021, S-032, S-035, S-040]
  fact_dependencies: []
  method: "Followed representative CLI/core/session/agent/gateway/tool/store call chain including errors and returns."
  counterevidence: "none found in traced source path"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: module-extension-boundaries
  statement: "Cline core has explicit plugin JSON-IPC subprocess, MCP lifecycle, hook subprocess and configured-agent/team/subagent extension boundaries."
  classification: FACT
  confidence: HIGH
  scope: "Pinned extension/runtime-builder production source; third-party compatibility excluded"
  source_ids: [S-019, S-027, S-028, S-029, S-030, S-031]
  fact_dependencies: []
  method: "Traced registration, initialization, timeout, call, disconnect/shutdown and contribution paths."
  counterevidence: "process isolation exists for plugins but no OS capability restriction is implemented there"
  adversarial_status: SUPPORTED
- claim_id: C-010
  section: agent-interface
  statement: "SessionRuntime preserves cross-turn state but constructs a fresh AgentRuntime for a run, and configured-agent/team/spawn_agent paths retain parent-child identities and forward policies and abort."
  classification: FACT
  confidence: HIGH
  scope: "Pinned session/agent/team source; crash lifecycle excluded"
  source_ids: [S-019, S-020, S-021, S-031, S-037]
  fact_dependencies: []
  method: "Traced session orchestration, runtime construction, spawn tool configuration and persisted parent fields."
  counterevidence: "team runtime state can outlive one AgentRuntime, consistent with session-owned rather than run-owned lifecycle"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: tool-interface
  statement: "Cline tools use named schemas, hooks, policies, fail-closed approval, results and abort context, executing sequentially by default and in parallel only when configured."
  classification: FACT
  confidence: HIGH
  scope: "Pinned agent/core built-in, MCP and subagent tool source; dynamic effects excluded"
  source_ids: [S-021, S-022, S-023, S-024, S-025, S-026, S-029, S-031]
  fact_dependencies: []
  method: "Inspected AgentRuntime preparation/execution branches and representative executor contracts."
  counterevidence: "opt-in parallel execution exists; claim is only about the default"
  adversarial_status: SUPPORTED
- claim_id: C-012
  section: provider-interface
  statement: "GatewayRegistry and Gateway register/configure providers, resolve provider/model, check declared capabilities, create an adapter, shape a request and return an abortable async stream."
  classification: FACT
  confidence: HIGH
  scope: "Pinned representative gateway/registry source; provider wire and hosted routing excluded"
  source_ids: [S-019, S-021, S-032, S-033]
  fact_dependencies: []
  method: "Traced runtime builder through gateway selection, adapter creation, stream request and errors."
  counterevidence: "provider-specific adapters add behavior below the representative gateway seam"
  adversarial_status: SUPPORTED
- claim_id: C-013
  section: model-interface
  statement: "Cline model handling statically represents identity, limits, modalities and model-tool support, validates declared compatibility, clamps output budget and consumes typed stream events."
  classification: FACT
  confidence: HIGH
  scope: "Pinned gateway/agent/context source; catalog freshness and provider conformance excluded"
  source_ids: [S-021, S-032, S-033, S-034]
  fact_dependencies: []
  method: "Inspected selection, capability checks, token clamping and AgentRuntime event handling."
  counterevidence: "unregistered model IDs can be represented, so validation is not universal catalog membership enforcement"
  adversarial_status: CHALLENGED
- claim_id: C-014
  section: context-interface
  statement: "Cline assembles session and extension context for the provider, supports basic/agentic/custom compaction, and permits one forced compaction retry after context overflow."
  classification: FACT
  confidence: HIGH
  scope: "Pinned session/agent/compaction source; live token fit and injection containment excluded"
  source_ids: [S-020, S-021, S-034]
  fact_dependencies: []
  method: "Traced message builders, token estimates, compaction strategies, overflow flag and one-attempt guard."
  counterevidence: "source records a telemetry gap for plugin/custom message builders; role separation is not authority enforcement"
  adversarial_status: SUPPORTED
- claim_id: C-015
  section: state-persistence-restart
  statement: "Local Cline prefers SQLite then falls back to files, uses WAL/busy retries and optional status-lock compare-and-update, and combines atomic and weaker file persistence with manifest history recovery."
  classification: FACT
  confidence: HIGH
  scope: "Pinned local host/session/database source; crash and filesystem guarantees excluded"
  source_ids: [S-020, S-035, S-036, S-037, S-038, S-039, S-040]
  fact_dependencies: []
  method: "Traced backend factory, SQLite pragmas/retry, status_lock SQL, atomic helpers, file adapter and manifest merge."
  counterevidence: "some writes use fsync-capable unique temp files while file fallback uses fixed temp+rename and invalid-data-to-empty behavior"
  adversarial_status: CHALLENGED
- claim_id: C-016
  section: concurrency-worktree-isolation
  statement: "Cline has per-session run guards, identity keys, selected per-resource locks and opt-in parallelism, but no static worktree or filesystem namespace that isolates sessions sharing a checkout."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned production session/tool/MCP/database paths; external OS/Git locks and runtime races excluded"
  source_ids: [S-019, S-020, S-021, S-029, S-035, S-036, S-037]
  fact_dependencies: []
  method: "Traced explicit concurrency controls and searched the mapped production composition for worktree/filesystem isolation."
  counterevidence: "session IDs, MCP locks and SQLite coordination limit selected collisions but do not isolate shared files"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: permissions-authority-sandbox
  statement: "Core required approvals fail closed, ACP defaults tool auto-approval false, ordinary CLI defaults it true, and --data-dir redirects state while requiring a local backend rather than an OS sandbox."
  classification: FACT
  confidence: HIGH
  scope: "Pinned CLI/ACP/AgentRuntime approval and data-directory source; runtime bypass excluded"
  source_ids: [S-014, S-015, S-021, S-022]
  fact_dependencies: []
  method: "Compared CLI and ACP defaults, followed approval failure branches, and traced data-dir environment setup."
  counterevidence: "different frontends intentionally have different defaults; neither changes inherited OS authority"
  adversarial_status: CHALLENGED
- claim_id: C-018
  section: permissions-authority-sandbox
  statement: "The inspected tool layer is not workspace-confined because absolute editor paths pass, shell and plugin children inherit environment, HTTP(S) fetch is arbitrary, and plan command control is an admitted incomplete blacklist."
  classification: FACT
  confidence: HIGH
  scope: "Pinned editor/shell/web/guard/plugin/hook source; external OS container policy excluded"
  source_ids: [S-023, S-024, S-025, S-026, S-028, S-030]
  fact_dependencies: []
  method: "Inspected actual enforcement branches and child-process/fetch construction rather than policy text alone."
  counterevidence: "relative traversal checks, schemes, timeout and approval reduce risk but do not establish workspace/OS confinement"
  adversarial_status: CHALLENGED
- claim_id: C-019
  section: evidence-observability
  statement: "Cline exposes typed runtime events, persisted session/message/status evidence and optional telemetry with correlation IDs, but no universal signed replay receipt and a documented compaction telemetry gap."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned event/session/telemetry/rollout source; exporter delivery and tamper tests excluded"
  source_ids: [S-020, S-021, S-034, S-035, S-041, S-042]
  fact_dependencies: []
  method: "Traced event emission, host projection, persistence and representative telemetry capture sites; retained explicit gap comment."
  counterevidence: "individual stores and Git/tool outputs can provide evidence, but not one atomic tamper-evident ledger"
  adversarial_status: CHALLENGED
- claim_id: C-020
  section: resource-token-cost-accounting
  statement: "Cline estimates context, clamps output and accumulates token/cache/reasoning/cost usage, but the inspected harness layer has no general OS-resource quota or authoritative provider-bill reconciliation."
  classification: FACT
  confidence: HIGH
  scope: "Pinned agent/gateway/context/telemetry source; hosted billing internals excluded"
  source_ids: [S-021, S-032, S-034, S-041]
  fact_dependencies: []
  method: "Inspected usage accumulation, token estimation/clamping, compaction budgets and emitted fields."
  counterevidence: "tool-specific timeout and automation concurrency limits exist but are not general CPU/memory/network/spend quotas"
  adversarial_status: CHALLENGED
- claim_id: C-021
  section: failure-cancellation-retry
  statement: "Session abort propagates to model/tool signals, representative executors enforce timeout/cleanup, approval fails closed, SQLite retries busy errors and context overflow retries once."
  classification: FACT
  confidence: HIGH
  scope: "Pinned static source policy; live cancellation, descendants and partial effects excluded"
  source_ids: [S-020, S-021, S-022, S-024, S-025, S-029, S-030, S-034, S-036, S-037]
  fact_dependencies: []
  method: "Traced abort and error paths across session, agent, tool, MCP, hook, database and context boundaries."
  counterevidence: "boundary-specific controls do not provide cross-boundary rollback or universal idempotency"
  adversarial_status: SUPPORTED
- claim_id: C-022
  section: install-update-release
  statement: "Pinned CLI, SDK and VS Code source/artifact versions align, and the official combined VSIX workflow gates both bundles, pins tested revisions, validates identity and reports a successful 4.1.15 run."
  classification: FACT
  confidence: HIGH
  scope: "Official tags, manifests, downloaded artifacts, workflow source and Actions metadata; reproducible build/signing excluded"
  source_ids: [S-001, S-002, S-003, S-004, S-005, S-006, S-013, S-043, S-044, S-046]
  fact_dependencies: []
  method: "Triangulated immutable refs, package bytes, workflow code and official job/run conclusions."
  counterevidence: "exact legacy tested SHA is inaccessible in logs and is separated as C-035"
  adversarial_status: SUPPORTED
- claim_id: C-023
  section: tests-qualification
  statement: "Cline defines broad unit/integration/E2E/VCR/rollout suites and official 4.1.15 jobs succeeded, but this research session executed no target tests."
  classification: FACT
  confidence: HIGH
  scope: "Pinned test/scripts/workflow inventory and official conclusions; no independent test result"
  source_ids: [S-010, S-013, S-021, S-022, S-023, S-024, S-026, S-027, S-029, S-034, S-036, S-037, S-042, S-043, S-044, S-046]
  fact_dependencies: []
  method: "Inventoried declared suites and test files, read selected tests as intent evidence, and retrieved official job metadata without running target code."
  counterevidence: "passing official jobs do not independently prove every production path or adversarial case"
  adversarial_status: NOT_PROBED
- claim_id: C-024
  section: security
  statement: "Cline implements schemas, approval, selected path checks, timeout/abort and disclosure reporting, while model/tool/plugin/provider crossings retain unresolved host-authority attack surfaces."
  classification: FACT
  confidence: HIGH
  scope: "Pinned first-party static code and SECURITY.md; exploitation, dependencies and hosted services excluded"
  source_ids: [S-007, S-015, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-030, S-032, S-045]
  fact_dependencies: []
  method: "Mapped trust crossings and actual controls, and read the official reporting policy."
  counterevidence: "controls mitigate selected paths but do not establish OS/workspace sandboxing or security acceptance"
  adversarial_status: CHALLENGED
- claim_id: C-025
  section: strengths
  statement: "The shared core-host-session-agent composition is a coherent inspectable cross-surface runtime seam within the pinned architecture."
  classification: INFERENCE
  confidence: HIGH
  scope: "Architecture inspectability and composition only; safety, reliability and adoption excluded"
  source_ids: [S-018, S-019, S-020, S-021, S-032, S-035]
  fact_dependencies: [C-006, C-008, C-010, C-011, C-012, C-015]
  method: "Reasoning chain: explicit package responsibilities plus traced composition and injected boundaries reduce UI-specific loop duplication; alternative is hidden coupling not observed in the traced path."
  counterevidence: "large core breadth and untested runtime parity may still create operational coupling"
  adversarial_status: SUPPORTED
- claim_id: C-026
  section: strengths
  statement: "The dual-bundle VSIX is a strong version-scoped IDE migration and activation-recovery mechanism within its stated single-window scope."
  classification: INFERENCE
  confidence: HIGH
  scope: "Pinned 4.1.15 loader/artifact/workflow; live effectiveness and state compatibility excluded"
  source_ids: [S-006, S-042, S-043, S-046]
  fact_dependencies: [C-004, C-022]
  method: "Reasoning chain: package both tested implementations, activate one, dispose partial next activation and persist legacy pin; alternative is that untested state incompatibility still harms recovery."
  counterevidence: "two complete runtimes double artifact/test/state-compatibility burden"
  adversarial_status: SUPPORTED
- claim_id: C-027
  section: liabilities
  statement: "For unattended or multi-tenant use, default ordinary-CLI auto-approval and host-authority tools impose an external sandbox and capability-governance burden."
  classification: INFERENCE
  confidence: HIGH
  scope: "Untrusted or unattended scenario; documented local operator use is not rejected"
  source_ids: [S-014, S-015, S-021, S-023, S-024, S-025, S-026, S-028, S-030]
  fact_dependencies: [C-017, C-018, C-024]
  method: "Reasoning chain: approval default plus absolute filesystem/process/network/environment authority expands blast radius; alternative external OS sandbox is outside target."
  counterevidence: "ACP defaults deny and external containers can reduce exposure"
  adversarial_status: SUPPORTED
- claim_id: C-028
  section: liabilities
  statement: "Mixed persistence guarantees, unresolved crash/concurrency behavior, license-metadata omissions and one legacy provenance gap increase audited-deployment burden."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Governed/reproducible deployment scenario; not a legal or security conclusion"
  source_ids: [S-005, S-009, S-011, S-012, S-015, S-035, S-036, S-037, S-038, S-039, S-040, S-047]
  fact_dependencies: [C-005, C-015, C-016, C-035]
  method: "Reasoning chain: heterogeneous metadata/stores plus unverified failures require extra controls and evidence; alternative is operator acceptance of lower assurance."
  counterevidence: "hashes, WAL/OCC, fallback and workflow pins mitigate selected concerns"
  adversarial_status: CHALLENGED
- claim_id: C-029
  section: transferable-patterns
  statement: "A façade-to-host-to-session-to-run composition seam is a candidate for sharing one typed agent loop across operator surfaces."
  classification: INFERENCE
  confidence: HIGH
  scope: "Research pattern candidate; no adoption or direct-copy authority"
  source_ids: [S-018, S-019, S-020, S-035]
  fact_dependencies: [C-008, C-010, C-025]
  method: "Abstracted the minimal composition mechanism while preserving host/tool authority boundaries."
  counterevidence: "requires stable contracts, parity tests and explicit lifecycle ownership"
  adversarial_status: SUPPORTED
- claim_id: C-030
  section: transferable-patterns
  statement: "A missing-or-failed-approval-means-deny callback is a candidate permission-boundary pattern."
  classification: INFERENCE
  confidence: HIGH
  scope: "Research pattern candidate; assumes all consequential paths route through it"
  source_ids: [S-021, S-022]
  fact_dependencies: [C-011, C-017]
  method: "Abstracted fail-closed branches and timeout behavior from the core approval protocol."
  counterevidence: "ordinary CLI can configure auto-approval and direct/unclassified paths can bypass an incomplete action taxonomy"
  adversarial_status: SUPPORTED
- claim_id: C-031
  section: transferable-patterns
  statement: "Packaging old and new IDE runtimes behind a version-scoped exactly-one loader is a conditional migration pattern."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Bounded stateful IDE migration; not a general runtime architecture"
  source_ids: [S-006, S-042, S-043, S-046]
  fact_dependencies: [C-004, C-022, C-026]
  method: "Abstracted bundle selection, partial-disposal, local pin and both-suite gate; retained doubled complexity as prerequisite cost."
  counterevidence: "state and credential compatibility across bundles remains only documented, not independently qualified"
  adversarial_status: CHALLENGED
- claim_id: C-032
  section: rejected-patterns-curiosity-no-go
  statement: "Host-authority file, shell and network tools are CURIOSITY_NO_GO as an autonomous security boundary without external capability isolation."
  classification: INFERENCE
  confidence: HIGH
  scope: "Direct transfer into autonomous/untrusted/multi-tenant harness; local operator use not rejected"
  source_ids: [S-014, S-021, S-023, S-024, S-025, S-026]
  fact_dependencies: [C-017, C-018, C-024, C-027]
  method: "Compared actual authority with workspace/process/network isolation requirements and rejected the mechanism for that scenario."
  counterevidence: "approvals, checks and timeouts mitigate but do not contain host authority"
  adversarial_status: SUPPORTED
- claim_id: C-033
  section: rejected-patterns-curiosity-no-go
  statement: "Plugin subprocess JSON-IPC is CURIOSITY_NO_GO as a security sandbox because it inherits environment and applies no observed OS capability restrictions."
  classification: INFERENCE
  confidence: HIGH
  scope: "Security-boundary transfer; fault isolation value retained"
  source_ids: [S-027, S-028, S-030]
  fact_dependencies: [C-009, C-018, C-024]
  method: "Contrasted process/IPC lifecycle controls with hostile-code containment prerequisites."
  counterevidence: "timeouts, serialization and process cleanup are meaningful reliability controls"
  adversarial_status: SUPPORTED
- claim_id: C-034
  section: security
  statement: "Dynamic startup, denial-bypass, malformed-input, cancellation, retry, collision, crash, provider-failure, injection, filesystem-abuse, accounting-disagreement and evidence-forgery behavior remains unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned CLI/SDK/VS Code runtime under adversarial dynamic conditions; static policies remain available evidence"
  source_ids: [S-020, S-021, S-023, S-024, S-025, S-035, S-036, S-037, S-038, S-039, S-040, S-041]
  fact_dependencies: []
  method: "attempted_methods=static production traces, bounded source/test search, artifact inspection, and predeclared probe expectations; blocker=contract requires disposable least-privilege isolation and no such authorized target-execution environment or credentials were available; impact=runtime enforcement, cleanup, durability, isolation, security and cost comparisons remain partial; available_evidence=S-020,S-021,S-023,S-024,S-025,S-035,S-036,S-037,S-038,S-039,S-040,S-041; next_probe=run P-01 through P-11 and P-14 in a disposable no-secret VM/container with denied-by-default network/filesystem/process authority and fault injection"
  counterevidence: "repository tests document intended outcomes but were not run and cannot replace adversarial runtime observation"
  adversarial_status: NOT_PROBED
- claim_id: C-035
  section: install-update-release
  statement: "The exact legacy-extension commit used to produce the packaged 4.1.15 legacy bundle remains unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Combined VSIX legacy bundle source association only; bundle bytes and next/head SHA remain verified"
  source_ids: [S-003, S-006, S-043, S-046, S-047]
  fact_dependencies: []
  method: "attempted_methods=inspected workflow tested-sha data flow, official job metadata, origin/legacy-extension ref, packaged legacy manifest and unauthenticated job-log endpoint; blocker=Actions log download requires repository admin and returned HTTP 403, while public job metadata omits tested-sha; impact=legacy byte-to-source traceability is medium-confidence rather than exact, without changing loader or next-runtime conclusions; available_evidence=S-003,S-006,S-043,S-046,S-047; next_probe=authorized maintainer retrieves job 97248819422 logs/artifacts and compares emitted tested-sha plus rebuilt legacy bundle hash"
  counterevidence: "observed origin/legacy-extension commit 7761370240ffce9e3890cb56f6c51655f3f5b0a7 is consistent but not definitive"
  adversarial_status: CHALLENGED
```

## 27. Source ledger {#source-ledger}

The ledger is immutable for this snapshot: corrections add a new source ID
rather than silently changing an existing record. Hash-only records identify
the retaining research session and the decision-relevant result in `notes`.

```yaml
- source_id: S-001
  source_kind: release-metadata
  title: "CLI tag, commit, remote, worktree, and submodule identity"
  url: "https://github.com/cline/cline/tree/8e7a55498bdb265004427160b68d8228a62d4e4a"
  commit_or_ref: "cli-v3.0.58"
  resolved_commit: "8e7a55498bdb265004427160b68d8228a62d4e4a"
  package_identity: "cline@3.0.58; artifact-integrity=S-004"
  code_path: "N/A:no-code-path"
  symbol: "refs/tags/cli-v3.0.58"
  line_anchor: "N/A:no-line-anchor"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline remote get-url origin && git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline rev-list -n1 cli-v3.0.58 && git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline status --porcelain && git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline submodule status"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; filtered blobless clone; network used only to fetch official Git objects"
  output_or_hash: "inline:origin=https://github.com/cline/cline.git; tag-object=058c12803f10817cf95270fa1f85285f9cc92d91; commit=8e7a55498bdb265004427160b68d8228a62d4e4a; status=clean; submodule=-d1085569fb0ae3f9613957e6fc2706c6e2f7da9b evals/cline-bench"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-022]
  notes: "Primary Git identity was selected over mutable branch pages; uninitialized submodule content was excluded."
- source_id: S-002
  source_kind: release-metadata
  title: "SDK package-family tags and commit identity"
  url: "https://github.com/cline/cline/tree/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages"
  commit_or_ref: "sdk/agents/v0.0.79; sdk/core/v0.0.79; sdk/llms/v0.0.79; sdk/sdk/v0.0.79; sdk/shared/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/{agents,core,llms,sdk,shared}@0.0.79; sdk-artifact-integrity=S-005"
  code_path: "sdk/packages"
  symbol: "five sdk/*/v0.0.79 tags"
  line_anchor: "N/A:no-line-anchor"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline tag --points-at 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21 | sort"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static official clone; no target execution"
  output_or_hash: "inline:sdk/agents/v0.0.79,sdk/core/v0.0.79,sdk/llms/v0.0.79,sdk/sdk/v0.0.79,sdk/shared/v0.0.79"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-022]
  notes: "All first-party public SDK package tags converge on one commit; preferred to registry search text."
- source_id: S-003
  source_kind: release-metadata
  title: "VS Code tag and legacy-extension candidate ref identity"
  url: "https://github.com/cline/cline/tree/09ee9026393e681a4834d8acbf4d9d5fdfa8664a"
  commit_or_ref: "v4.1.15; origin/legacy-extension"
  resolved_commit: "09ee9026393e681a4834d8acbf4d9d5fdfa8664a; legacy-candidate=7761370240ffce9e3890cb56f6c51655f3f5b0a7"
  package_identity: "saoudrizwan.claude-dev@4.1.15; artifact-integrity=S-006"
  code_path: "N/A:no-code-path"
  symbol: "refs/tags/v4.1.15; refs/remotes/origin/legacy-extension"
  line_anchor: "N/A:no-line-anchor"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline rev-list -n1 v4.1.15 && git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline rev-parse refs/remotes/origin/legacy-extension"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static official clone; no target execution"
  output_or_hash: "inline:v4.1.15=09ee9026393e681a4834d8acbf4d9d5fdfa8664a; origin/legacy-extension=7761370240ffce9e3890cb56f6c51655f3f5b0a7"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-022, C-035]
  notes: "The legacy ref is only a candidate association; S-047 prevents promoting it to exact packaged provenance."
- source_id: S-004
  source_kind: package-artifact
  title: "npm cline 3.0.58 bootstrap tarball"
  url: "https://registry.npmjs.org/cline/-/cline-3.0.58.tgz"
  commit_or_ref: "cli-v3.0.58"
  resolved_commit: "8e7a55498bdb265004427160b68d8228a62d4e4a"
  package_identity: "cline@3.0.58+sha512-Nx5rWOkV5/qFynCp0wnneFuy/fVQbiipCdHr8J+jNrlZkbLjNxBIzTp0gtP0e5sLMAzZUvg2KBEmDFE4P5u9ew=="
  code_path: "package/package.json; package/bin/cline; package/postinstall.mjs"
  symbol: "bin.cline; optionalDependencies; scripts.postinstall"
  line_anchor: "JSON pointers /name,/version,/license,/bin,/optionalDependencies,/scripts/postinstall"
  command: "curl -fL https://registry.npmjs.org/cline/-/cline-3.0.58.tgz -o /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/artifacts/cline-3.0.58.tgz && shasum -a 1 /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/artifacts/cline-3.0.58.tgz && shasum -a 256 /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/artifacts/cline-3.0.58.tgz && tar -tzf /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/artifacts/cline-3.0.58.tgz | sort"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; bsdtar 3.5.3; HTTPS retrieval; package scripts not executed"
  output_or_hash: "sha256:87cc216140abe3f5f664a02a0390bd29924f0dc7031b2fa3dcfd75f8527802e9"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-005, C-007, C-022]
  notes: "Session ses_fc91cf6a0fferZUM2Y77iJIxLx retains the 16,986-byte tarball; SHA-1 is 239650098614aa0a6a0ccd4c016b660c2264dd22 and inventory contains six files. Official registry bytes were preferred to install documentation."
- source_id: S-005
  source_kind: package-artifact
  title: "npm @cline/sdk 0.0.79 declaration alias tarball"
  url: "https://registry.npmjs.org/@cline/sdk/-/sdk-0.0.79.tgz"
  commit_or_ref: "sdk/sdk/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/sdk@0.0.79+sha512-nzAPXLN2vXl2P2CNOjdC7g7kO5l1+QLw5bay/oJmVOfyRSQsooSrYuQ1I7ZZ4EkW3PccoaDn9g8og0qcfZ0Ohw=="
  code_path: "package/package.json; package/dist/index.js; package/dist/index.d.ts"
  symbol: "exports; re-export of @cline/core"
  line_anchor: "JSON pointers /name,/version,/license,/exports,/dependencies"
  command: "curl -fL https://registry.npmjs.org/@cline/sdk/-/sdk-0.0.79.tgz -o /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/artifacts/_cline_sdk-0.0.79.tgz && shasum -a 1 /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/artifacts/_cline_sdk-0.0.79.tgz && shasum -a 256 /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/artifacts/_cline_sdk-0.0.79.tgz && tar -tzf /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/artifacts/_cline_sdk-0.0.79.tgz | sort"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; bsdtar 3.5.3; HTTPS retrieval; package code not executed"
  output_or_hash: "sha256:96fb525f71a441573a71307de96dbdd4eeab9e85529908e86421c73ff5e8a05e"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-005, C-007, C-022, C-028]
  notes: "Session ses_fc91cf6a0fferZUM2Y77iJIxLx retains the 651-byte four-file tarball; SHA-1 is c2ce717b7deb15992f19e07124c90ddb593c5db0. Package bytes were preferred to README API claims."
- source_id: S-006
  source_kind: package-artifact
  title: "Official Cline 4.1.15 combined VSIX"
  url: "https://github.com/cline/cline/releases/download/v4.1.15/claude-dev-4.1.15.vsix"
  commit_or_ref: "v4.1.15"
  resolved_commit: "09ee9026393e681a4834d8acbf4d9d5fdfa8664a"
  package_identity: "saoudrizwan.claude-dev@4.1.15+sha256:557e8dc7e0eeb526d3b22abdc7b7ed87a23d64690311286a5de751f7adac34de"
  code_path: "extension/extension.js; extension/next/**; extension/legacy/**; extension/package.json"
  symbol: "outer activate/deactivate loader and two packaged runtimes"
  line_anchor: "N/A:minified-and-binary-package-inventory"
  command: "curl -fL https://github.com/cline/cline/releases/download/v4.1.15/claude-dev-4.1.15.vsix -o /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/artifacts/claude-dev-4.1.15.vsix && shasum -a 256 /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/artifacts/claude-dev-4.1.15.vsix && unzip -t /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/artifacts/claude-dev-4.1.15.vsix && unzip -Z1 /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/artifacts/claude-dev-4.1.15.vsix | sort"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; Info-ZIP 6.00; HTTPS retrieval; extension not activated"
  output_or_hash: "sha256:557e8dc7e0eeb526d3b22abdc7b7ed87a23d64690311286a5de751f7adac34de"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005, C-022, C-026, C-031, C-035]
  notes: "Session retains the 19,632,427-byte VSIX; GitHub release metadata independently reports the same digest. Inventory proves both bundles exist but not their live activation behavior."
- source_id: S-007
  source_kind: license
  title: "Top-level Apache-2.0 license and disclosure-policy bundle"
  url: "https://github.com/cline/cline/tree/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  commit_or_ref: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE; SECURITY.md"
  symbol: "Apache License 2.0 text; vulnerability reporting policy"
  line_anchor: "LICENSE:L1-L201; SECURITY.md:L1-L25"
  command: "for p in LICENSE SECURITY.md; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable files; no target execution"
  output_or_hash: "sha256:2075e9fe3bcaad49d8601d03a31f5110e7900e884ab1c935e04f0db76b13b1dc"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-024]
  notes: "Actual license/policy text was selected over metadata labels; dependency and trademark terms remain excluded."
- source_id: S-008
  source_kind: repository-file
  title: "@cline/sdk source manifest"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/sdk/package.json"
  commit_or_ref: "sdk/sdk/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/sdk@0.0.79; artifact-integrity=S-005"
  code_path: "sdk/packages/sdk/package.json"
  symbol: "name/version/license/exports/dependencies"
  line_anchor: "L1-L37"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/sdk/package.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source"
  output_or_hash: "sha256:805f186977f2b1a86984f08b584f04eaf386f1b7ead13ebeb47c3da6a48f714d"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-005, C-006]
  notes: "Primary manifest establishes the public alias and Apache-2.0 field; package bytes independently appear in S-005."
- source_id: S-009
  source_kind: repository-file
  title: "@cline/core source manifest"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/package.json"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/package.json"
  symbol: "name/version/exports/scripts/dependencies; omitted license"
  line_anchor: "L1-L94"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/core/package.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source"
  output_or_hash: "sha256:580ef1d2a49109fc29aa67c8fb2121a9767780a30ad96122770af804697f17c8"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-005, C-006, C-028]
  notes: "Primary manifest was selected for package boundaries and the bounded license-field omission; registry bytes were not downloaded."
- source_id: S-010
  source_kind: repository-file
  title: "@cline/agents source manifest"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/agents/package.json"
  commit_or_ref: "sdk/agents/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/agents@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/agents/package.json"
  symbol: "name/version/license/exports/scripts/dependencies"
  line_anchor: "L1-L45"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/agents/package.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source"
  output_or_hash: "sha256:59a7bf664f5d4e8605004ed8fe6cd78f4cd38cce048de4a5ac00e668aac7ccf0"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-005, C-006, C-023]
  notes: "Primary manifest identifies the loop package and declared tests; test scripts were not executed."
- source_id: S-011
  source_kind: repository-file
  title: "@cline/llms source manifest"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/llms/package.json"
  commit_or_ref: "sdk/llms/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/llms@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/llms/package.json"
  symbol: "name/version/exports/scripts/dependencies; omitted license"
  line_anchor: "L1-L90"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/llms/package.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source"
  output_or_hash: "sha256:d3742e0ea8fe5bde3167bf24092827b416dd8d121b7fcbfe1b730f5dbef51818"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-005, C-006, C-028]
  notes: "Primary manifest was selected for provider-package boundaries and the bounded license-field omission."
- source_id: S-012
  source_kind: repository-file
  title: "@cline/shared source manifest"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/shared/package.json"
  commit_or_ref: "sdk/shared/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/shared@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/shared/package.json"
  symbol: "name/version/exports/scripts/dependencies; omitted license"
  line_anchor: "L1-L67"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/shared/package.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source"
  output_or_hash: "sha256:43575a4a4e2eb86460e8c2f0683779a0613b92f036682851f8150a92a3429553"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-005, C-006, C-028]
  notes: "Primary manifest was selected for shared-contract/storage boundaries and the bounded license-field omission."
- source_id: S-013
  source_kind: repository-file
  title: "CLI source manifest and test/build surface"
  url: "https://github.com/cline/cline/blob/8e7a55498bdb265004427160b68d8228a62d4e4a/apps/cli/package.json"
  commit_or_ref: "cli-v3.0.58"
  resolved_commit: "8e7a55498bdb265004427160b68d8228a62d4e4a"
  package_identity: "cline@3.0.58; artifact-integrity=S-004"
  code_path: "apps/cli/package.json"
  symbol: "bin/scripts/optionalDependencies/workspace dependencies"
  line_anchor: "L1-L108"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 8e7a55498bdb265004427160b68d8228a62d4e4a:apps/cli/package.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source"
  output_or_hash: "sha256:92e8809fd1bfc494d0a582306c262e5c9d7f224105c77abff7951eaa089ead26"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-006, C-007, C-022, C-023]
  notes: "Manifest ties source version, entry binary, first-party packages and declared tests to the CLI pin; artifact bytes independently appear in S-004."
- source_id: S-014
  source_kind: repository-file
  title: "CLI command parser, modes, and authority-affecting options"
  url: "https://github.com/cline/cline/blob/8e7a55498bdb265004427160b68d8228a62d4e4a/apps/cli/src/commands/program.ts"
  commit_or_ref: "cli-v3.0.58"
  resolved_commit: "8e7a55498bdb265004427160b68d8228a62d4e4a"
  package_identity: "cline@3.0.58; artifact-integrity=S-004"
  code_path: "apps/cli/src/commands/program.ts"
  symbol: "createProgram; parseProgramOptions; --yolo; --auto-approve; --data-dir"
  line_anchor: "L1-L238"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 8e7a55498bdb265004427160b68d8228a62d4e4a:apps/cli/src/commands/program.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source; CLI not run"
  output_or_hash: "sha256:392401e42a77120d80b852eed43b81a8f24f1b2fe1d399a2a952181583692aec"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-017, C-027, C-032]
  notes: "Actual parser/default code was preferred to help prose; the option named sandbox only redirects state and does not prove OS confinement."
- source_id: S-015
  source_kind: repository-file
  title: "CLI main dispatch and ACP auto-approval defaults"
  url: "https://github.com/cline/cline/tree/8e7a55498bdb265004427160b68d8228a62d4e4a/apps/cli/src"
  commit_or_ref: "cli-v3.0.58"
  resolved_commit: "8e7a55498bdb265004427160b68d8228a62d4e4a"
  package_identity: "cline@3.0.58; artifact-integrity=S-004"
  code_path: "apps/cli/src/main.ts; apps/cli/src/acp/acpAgent.ts"
  symbol: "main; ClineAcpAgent.constructor; ordinary headless/act tool policies"
  line_anchor: "apps/cli/src/main.ts:L1-L1244; apps/cli/src/acp/acpAgent.ts:L1-L957"
  command: "for p in apps/cli/src/main.ts apps/cli/src/acp/acpAgent.ts; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 8e7a55498bdb265004427160b68d8228a62d4e4a:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source; CLI/ACP not run"
  output_or_hash: "sha256:3792e9cfd2a1486c0b114fa6a59d0f26b01e7551d77fce2389b08512ead8ad75"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-017, C-024, C-027, C-028]
  notes: "Grouped because frontend-default comparison is the material observation; ACP false and ordinary CLI true are intentionally distinct."
- source_id: S-016
  source_kind: repository-file
  title: "CLI executable dispatch to core composition"
  url: "https://github.com/cline/cline/tree/8e7a55498bdb265004427160b68d8228a62d4e4a/apps/cli/src"
  commit_or_ref: "cli-v3.0.58"
  resolved_commit: "8e7a55498bdb265004427160b68d8228a62d4e4a"
  package_identity: "cline@3.0.58; artifact-integrity=S-004"
  code_path: "apps/cli/src/index.ts; apps/cli/src/main.ts"
  symbol: "CLI bootstrap; main dispatch; ClineCore construction paths"
  line_anchor: "apps/cli/src/index.ts:L1-L111; apps/cli/src/main.ts:L1-L1244"
  command: "for p in apps/cli/src/index.ts apps/cli/src/main.ts; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 8e7a55498bdb265004427160b68d8228a62d4e4a:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source; no target execution"
  output_or_hash: "sha256:c81b4d620e34d77e5c29dc65eb1ce955609b83734b2f6bb0b9195f0a314e5699"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-008]
  notes: "Selected to prove source reachability from executable entrypoint, not successful startup."
- source_id: S-017
  source_kind: test-output
  title: "Static startup/no-op side-effect challenge"
  url: "https://github.com/cline/cline/tree/8e7a55498bdb265004427160b68d8228a62d4e4a/apps/cli/src"
  commit_or_ref: "cli-v3.0.58"
  resolved_commit: "8e7a55498bdb265004427160b68d8228a62d4e4a"
  package_identity: "cline@3.0.58; artifact-integrity=S-004"
  code_path: "apps/cli/src/index.ts; apps/cli/src/main.ts; imported startup services"
  symbol: "P-01 static startup trace"
  line_anchor: "N/A:cross-file-static-probe"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline grep -n -E 'config|state|update|telemetry|provider|credential|network' 8e7a55498bdb265004427160b68d8228a62d4e4a -- apps/cli/src/index.ts apps/cli/src/main.ts"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static grep and import trace only; no secrets; target deliberately not executed"
  output_or_hash: "inline:startup source references configuration/state, update, telemetry, provider and credential setup; denied-write/network runtime behavior not observed"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-034]
  notes: "Negative result retained: static reachability cannot establish undeclared live side effects, so P-01 remains NOT_RUN_UNSAFE."
- source_id: S-018
  source_kind: repository-file
  title: "ClineCore façade and host delegation"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/ClineCore.ts"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/ClineCore.ts"
  symbol: "ClineCore"
  line_anchor: "L1-L669"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/core/src/ClineCore.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source"
  output_or_hash: "sha256:1c272a6a3d501180abba07f795964eceed5f0124320baaee01c10dc6e6b2ecc5"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-007, C-008, C-025, C-029]
  notes: "Primary composition façade selected over public API prose; establishes delegation structure, not runtime parity."
- source_id: S-019
  source_kind: repository-file
  title: "Runtime builder and contribution composition"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/runtime/orchestration/runtime-builder.ts"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/runtime/orchestration/runtime-builder.ts"
  symbol: "buildAgentRuntime; contribution/tool/provider/plugin/MCP assembly"
  line_anchor: "L1-L808"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/core/src/runtime/orchestration/runtime-builder.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source"
  output_or_hash: "sha256:9271e674210d0598c9c37848195cf2358bffaf7044997f007f710e6d30708672"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-008, C-009, C-010, C-012, C-016, C-025, C-029]
  notes: "Chosen as the production composition root; tests/examples were used only as intent evidence elsewhere."
- source_id: S-020
  source_kind: repository-file
  title: "SessionRuntime cross-turn orchestration"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/runtime/orchestration/session-runtime-orchestrator.ts"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/runtime/orchestration/session-runtime-orchestrator.ts"
  symbol: "SessionRuntime"
  line_anchor: "L1-L1480"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/core/src/runtime/orchestration/session-runtime-orchestrator.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source"
  output_or_hash: "sha256:bff60f7b117d6750551163fa3c7a99ac4dd382435c65dda839c02e358396afc6"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-010, C-014, C-015, C-016, C-019, C-021, C-025, C-029, C-034]
  notes: "Primary session lifecycle source establishes run guard, abort, state and fresh-runtime construction; crash behavior remains unobserved."
- source_id: S-021
  source_kind: repository-file
  title: "AgentRuntime model/tool/event loop"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/agents/src/agent-runtime.ts"
  commit_or_ref: "sdk/agents/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/agents@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/agents/src/agent-runtime.ts"
  symbol: "AgentRuntime; requestToolApproval; updateUsage; overflow retry"
  line_anchor: "L1-L2187"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/agents/src/agent-runtime.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable source; no model or tool execution"
  output_or_hash: "sha256:7edeca74cf3ffd5c4db7e85f8a0d83fc397e31304eb9d51a401a20dc4f3271ec"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-010, C-011, C-012, C-013, C-014, C-016, C-017, C-019, C-020, C-021, C-023, C-024, C-025, C-027, C-030, C-032, C-034]
  notes: "Decision-critical primary loop source; static branches establish structure and policy, while runtime enforcement remains C-034."
- source_id: S-022
  source_kind: repository-file
  title: "AgentRuntime approval and ordering tests"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/agents/src/agent-runtime.test.ts"
  commit_or_ref: "sdk/agents/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/agents@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/agents/src/agent-runtime.test.ts"
  symbol: "approval failure/timeout tests; sequential and parallel tool tests"
  line_anchor: "L1-L2927"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/agents/src/agent-runtime.test.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; test source inspected but not executed"
  output_or_hash: "sha256:27cd81d7d1840af76a86909feb2232cd4fea50e2ae2d76c52d083fb8d5cfa6c3"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-017, C-021, C-023, C-024, C-030]
  notes: "Retained as an independent intent evidence form for fail-closed approval and ordering; it is not a research-session runtime pass."
- source_id: S-023
  source_kind: repository-file
  title: "Editor executor path resolution and file effects"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/extensions/tools/executors/editor.ts"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/extensions/tools/executors/editor.ts"
  symbol: "resolveToolPath; createEditorToolExecutor"
  line_anchor: "L1-L271"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/core/src/extensions/tools/executors/editor.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no filesystem effects executed"
  output_or_hash: "sha256:64deddbb5762270eb2d73bc8aa9135205b3c7d82eff7082a8d74885efc8f0676"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-018, C-023, C-024, C-027, C-032, C-034]
  notes: "Actual path branch proves accepted absolute input statically; traversal/symlink behavior was not executed."
- source_id: S-024
  source_kind: repository-file
  title: "Shell executor process, environment, timeout, and cleanup"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/extensions/tools/executors/bash.ts"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/extensions/tools/executors/bash.ts"
  symbol: "createShellExecutor; child process environment; abort/timeout cleanup"
  line_anchor: "L1-L1044"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/core/src/extensions/tools/executors/bash.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no subprocess launched"
  output_or_hash: "sha256:c1cd873ab1b4329feef8ef4eeac25b623fbd9526a24700172acfaab0ad56e4ed"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-018, C-021, C-023, C-024, C-027, C-032, C-034]
  notes: "Primary executor was selected over tool descriptions; environment inheritance is direct source evidence, descendant cleanup is runtime-unknown."
- source_id: S-025
  source_kind: repository-file
  title: "Web-fetch executor network boundary"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/extensions/tools/executors/web-fetch.ts"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/extensions/tools/executors/web-fetch.ts"
  symbol: "createWebFetchExecutor; URL protocol check; fetch timeout"
  line_anchor: "L1-L259"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/core/src/extensions/tools/executors/web-fetch.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no target network request"
  output_or_hash: "sha256:a494a6bf8421540cf5a65d79ad0616904242ac4722e6dd0bb32630654ca927fa"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-018, C-021, C-024, C-027, C-032, C-034]
  notes: "Primary URL enforcement shows HTTP(S)-scheme validation without destination confinement; live SSRF/network behavior was not probed."
- source_id: S-026
  source_kind: repository-file
  title: "Plan-mode command guard"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/extensions/tools/command-guard.ts"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/extensions/tools/command-guard.ts"
  symbol: "isCommandAllowedInPlanMode; blacklist and bypass caveats"
  line_anchor: "L1-L521"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/core/src/extensions/tools/command-guard.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; commands not executed"
  output_or_hash: "sha256:f56d4deb3e5ba8ea0def770c50ebfa2387d70fe36087765153238746da527132"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-018, C-023, C-024, C-027, C-032]
  notes: "The implementation's own bounded caveats are retained; this is not generalized into proof of every bypass."
- source_id: S-027
  source_kind: repository-file
  title: "Plugin discovery, manifest validation, and loading"
  url: "https://github.com/cline/cline/tree/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/extensions/plugin"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/extensions/plugin/plugin-config-loader.ts; sdk/packages/core/src/extensions/plugin/plugin-loader.ts"
  symbol: "discoverPluginModulePaths; loadAgentPluginFromPath"
  line_anchor: "plugin-config-loader.ts:L1-L318; plugin-loader.ts:L1-L214"
  command: "for p in sdk/packages/core/src/extensions/plugin/plugin-config-loader.ts sdk/packages/core/src/extensions/plugin/plugin-loader.ts; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no plugin imported"
  output_or_hash: "sha256:d87b5d1a97e3559462c489fdfb7b661d631786a6c3a9f00ce1b73bd5d7ce2d80"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-023, C-024, C-033]
  notes: "Primary loader sources establish registration and validation; hostile plugin behavior remains unexecuted."
- source_id: S-028
  source_kind: repository-file
  title: "Plugin child-process JSON-IPC sandbox implementation"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/extensions/plugin/plugin-sandbox.ts"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/extensions/plugin/plugin-sandbox.ts"
  symbol: "PluginSandbox; child IPC; timeout; shutdown; inherited environment"
  line_anchor: "L1-L842"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/core/src/extensions/plugin/plugin-sandbox.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; child process not launched"
  output_or_hash: "sha256:63a3142acd6b9e42712f5a27d61b36ab95337dae9fa85c515669adac0f386ad0"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-018, C-024, C-027, C-033]
  notes: "Actual process boundary was preferred to the sandbox label; no OS capability restriction is implemented in this source."
- source_id: S-029
  source_kind: repository-file
  title: "MCP manager and client lifecycle"
  url: "https://github.com/cline/cline/tree/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/extensions/mcp"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/extensions/mcp/manager.ts; sdk/packages/core/src/extensions/mcp/client.ts"
  symbol: "McpManager; McpClient; per-server operation serialization; connect/call/disconnect"
  line_anchor: "manager.ts:L1-L276; client.ts:L1-L815"
  command: "for p in sdk/packages/core/src/extensions/mcp/manager.ts sdk/packages/core/src/extensions/mcp/client.ts; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no MCP server connected"
  output_or_hash: "sha256:511c1696ca3a21585d24b70d77d049f4fa842f305503b9b45f3452352cdee2bf"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-011, C-016, C-021, C-023]
  notes: "Representative MCP lifecycle source selected over exhaustive transport/provider inspection; timeout and serialization are static policies."
- source_id: S-030
  source_kind: repository-file
  title: "Hook subprocess execution and cleanup"
  url: "https://github.com/cline/cline/tree/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/hooks"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/hooks/subprocess.ts; sdk/packages/core/src/hooks/subprocess-runner.ts"
  symbol: "executeHookSubprocess; SubprocessRunner"
  line_anchor: "subprocess.ts:L1-L637; subprocess-runner.ts:L1-L221"
  command: "for p in sdk/packages/core/src/hooks/subprocess.ts sdk/packages/core/src/hooks/subprocess-runner.ts; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no hook launched"
  output_or_hash: "sha256:bccfe8b8d169787a5aaba57dd0c642e47b0a7e36a1f125abd8297ea480e3602d"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-018, C-021, C-024, C-027, C-033]
  notes: "Primary hook process path establishes timeout/abort/environment behavior; live descendant cleanup remains C-034."
- source_id: S-031
  source_kind: repository-file
  title: "Configured-agent and spawn-agent delegation tools"
  url: "https://github.com/cline/cline/tree/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/extensions/tools/team"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "spawn-agent-tool.ts; configured-agent-tool.ts; delegated-agent.ts"
  symbol: "createSpawnAgentTool; createConfiguredAgentTool; runDelegatedAgent"
  line_anchor: "spawn-agent-tool.ts:L1-L203; configured-agent-tool.ts:L1-L253; delegated-agent.ts:L1-L158"
  command: "for p in sdk/packages/core/src/extensions/tools/team/spawn-agent-tool.ts sdk/packages/core/src/extensions/tools/team/configured-agent-tool.ts sdk/packages/core/src/extensions/tools/team/delegated-agent.ts; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no child agent run"
  output_or_hash: "sha256:6b16c097c5c9890b182f63b1e4be089d11f1a81d59747cced63262b562167d77"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-010, C-011]
  notes: "Representative parent/child source selected for forwarded policies, tools and abort; crash/orphan behavior remains unobserved."
- source_id: S-032
  source_kind: repository-file
  title: "Gateway model adapter and request shaping"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/llms/src/providers/gateway.ts"
  commit_or_ref: "sdk/llms/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/llms@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/llms/src/providers/gateway.ts"
  symbol: "GatewayModelAdapter; stream; token clamping; capability checks"
  line_anchor: "L1-L383"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/llms/src/providers/gateway.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no provider request"
  output_or_hash: "sha256:b796438b12990c808ea0e72633746677e9f05406e13ec35e6b38bc6ca4f3acfd"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-012, C-013, C-020, C-024, C-025]
  notes: "Representative provider seam selected over exhaustive adapters; wire behavior and provider retention remain excluded."
- source_id: S-033
  source_kind: repository-file
  title: "Gateway provider and model registry"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/llms/src/providers/registry.ts"
  commit_or_ref: "sdk/llms/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/llms@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/llms/src/providers/registry.ts"
  symbol: "GatewayRegistry"
  line_anchor: "L1-L327"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/llms/src/providers/registry.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no credentials"
  output_or_hash: "sha256:0e1656b878b6728a8017a2a825df1d322798cc6ec8811db7df7e601bfd7e616f"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-013]
  notes: "Primary registry source establishes registration/selection and unknown-model representation; catalog freshness was not independently measured."
- source_id: S-034
  source_kind: repository-file
  title: "Context compaction strategies, budgets, and telemetry caveat"
  url: "https://github.com/cline/cline/tree/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/extensions/context"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "compaction.ts; basic-compaction.ts; agentic-compaction.ts"
  symbol: "createContextCompactionPrepareTurn; basic/agentic/custom strategies"
  line_anchor: "compaction.ts:L1-L710; basic-compaction.ts:L1-L711; agentic-compaction.ts:L1-L318"
  command: "for p in sdk/packages/core/src/extensions/context/compaction.ts sdk/packages/core/src/extensions/context/basic-compaction.ts sdk/packages/core/src/extensions/context/agentic-compaction.ts; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no provider-backed compaction"
  output_or_hash: "sha256:5b2800de91adbeb4eee96163307c837fa44c88b43ae06ac5fdd35e848ef1e64d"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-014, C-019, C-020, C-021, C-023]
  notes: "Primary strategy source retains the explicit plugin/custom-builder telemetry gap; live token fit is C-034."
- source_id: S-035
  source_kind: repository-file
  title: "Local host backend selection, lifecycle, usage, and persistence"
  url: "https://github.com/cline/cline/tree/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/runtime/host"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/runtime/host/host.ts; sdk/packages/core/src/runtime/host/local-runtime-host.ts"
  symbol: "createLocalBackend; LocalRuntimeHost"
  line_anchor: "host.ts:L1-L249; local-runtime-host.ts:L1-L2668"
  command: "for p in sdk/packages/core/src/runtime/host/host.ts sdk/packages/core/src/runtime/host/local-runtime-host.ts; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; storage/runtime not initialized"
  output_or_hash: "sha256:1db7b59956ed5cbc68e5b88d0e89f8a60fb524deb7ad23040e318f9c1f069b5b"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-015, C-016, C-019, C-025, C-028, C-029, C-034]
  notes: "Production host path proves SQLite-first/file-fallback selection and telemetry; restart/crash outcomes remain unexecuted."
- source_id: S-036
  source_kind: repository-file
  title: "Shared SQLite schema, WAL, busy timeout, and retry"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/shared/src/db/sqlite-db.ts"
  commit_or_ref: "sdk/shared/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/shared@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/shared/src/db/sqlite-db.ts"
  symbol: "loadSqliteDb; schema; withSqliteBusyRetry"
  line_anchor: "L1-L384"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/shared/src/db/sqlite-db.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; database not opened"
  output_or_hash: "sha256:e6f3b8ec830d370bb0cb757c721f6ebc29b17fec0e62bc71f2791885963802cf"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-016, C-021, C-023, C-028, C-034]
  notes: "Primary database source establishes declared pragmas/retries; contention and corruption were not injected."
- source_id: S-037
  source_kind: repository-file
  title: "Session SQL service and status-lock compare-and-update"
  url: "https://github.com/cline/cline/tree/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/session"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "session/services/session-service.ts; services/storage/sqlite-session-store.ts"
  symbol: "CoreSessionService; SqliteSessionStore; status_lock"
  line_anchor: "session-service.ts:L1-L327; sqlite-session-store.ts:L1-L292"
  command: "for p in sdk/packages/core/src/session/services/session-service.ts sdk/packages/core/src/services/storage/sqlite-session-store.ts; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; database not opened"
  output_or_hash: "sha256:cdd453eb3e93d2636fa06335e1648d7678febff6025f36d68cda63de9ea349d8"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-015, C-016, C-021, C-023, C-028, C-034]
  notes: "Selected for durable parent/session identities and OCC status updates; multi-process races remain C-034."
- source_id: S-038
  source_kind: repository-file
  title: "Unique-temp atomic file writer"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/session/stores/atomic-file.ts"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/session/stores/atomic-file.ts"
  symbol: "writeFileAtomic; fsyncBestEffort"
  line_anchor: "L1-L53"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/core/src/session/stores/atomic-file.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no writes"
  output_or_hash: "sha256:5a0387021c7a3e80b3548989b6956a9146ddfe67985b0df3498270448d871930"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-028, C-034]
  notes: "Primary helper establishes temp+rename and best-effort directory fsync only; filesystem crash guarantees are explicitly not inferred."
- source_id: S-039
  source_kind: repository-file
  title: "File fallback session service"
  url: "https://github.com/cline/cline/blob/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src/session/services/file-session-service.ts"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "sdk/packages/core/src/session/services/file-session-service.ts"
  symbol: "FileSessionService; file index read/write fallback"
  line_anchor: "L1-L284"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:sdk/packages/core/src/session/services/file-session-service.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no writes"
  output_or_hash: "sha256:8ba1abee238e1f21448eccc689fffba780e805de1ac6b1ea484c6bc1d1c1c9f3"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-028, C-034]
  notes: "Primary fallback source establishes weaker file semantics and malformed-index handling; restart loss was not induced."
- source_id: S-040
  source_kind: repository-file
  title: "Session manifests and history reconstruction"
  url: "https://github.com/cline/cline/tree/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "session/stores/session-manifest-store.ts; runtime/host/history.ts"
  symbol: "SessionManifestStore; listHistory; backend/manifest merge"
  line_anchor: "session-manifest-store.ts:L1-L320; history.ts:L1-L516"
  command: "for p in sdk/packages/core/src/session/stores/session-manifest-store.ts sdk/packages/core/src/runtime/host/history.ts; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no restart"
  output_or_hash: "sha256:c6294ffd226998b976f114f632655070ed9ddf7ae2571b0a7cc7e963a8aeaa7c"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-015, C-028, C-034]
  notes: "Selected for recovery-oriented manifest validation and merge logic; actual crash replay/corruption behavior remains C-034."
- source_id: S-041
  source_kind: repository-file
  title: "Agent event projection and session telemetry"
  url: "https://github.com/cline/cline/tree/0cfc901589ed8cad6e0b0ce500e07b1800e6cb21/sdk/packages/core/src"
  commit_or_ref: "sdk/core/v0.0.79"
  resolved_commit: "0cfc901589ed8cad6e0b0ce500e07b1800e6cb21"
  package_identity: "@cline/core@0.0.79; integrity=N/A:artifact-not-downloaded"
  code_path: "runtime/host/local/agent-event-bridge.ts; services/session-telemetry.ts"
  symbol: "AgentEventBridge; session telemetry capture helpers"
  line_anchor: "agent-event-bridge.ts:L1-L371; session-telemetry.ts:L1-L89"
  command: "for p in sdk/packages/core/src/runtime/host/local/agent-event-bridge.ts sdk/packages/core/src/services/session-telemetry.ts; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 0cfc901589ed8cad6e0b0ce500e07b1800e6cb21:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; no telemetry export"
  output_or_hash: "sha256:63dd5fb1b9a1db7bdae2898b5ff26f8c4e59ee09c9f3cb954e759ab5d121c281"
  access_date: "2026-08-24"
  supports_claims: [C-019, C-020, C-034]
  notes: "Representative local projection/capture seam selected; exporter delivery, redaction, loss and forgery remain untested."
- source_id: S-042
  source_kind: repository-file
  title: "Version-scoped dual-runtime VS Code loader"
  url: "https://github.com/cline/cline/tree/09ee9026393e681a4834d8acbf4d9d5fdfa8664a/apps/vscode-rollout/src"
  commit_or_ref: "v4.1.15"
  resolved_commit: "09ee9026393e681a4834d8acbf4d9d5fdfa8664a"
  package_identity: "saoudrizwan.claude-dev@4.1.15; artifact-integrity=S-006"
  code_path: "apps/vscode-rollout/src/extension.ts; apps/vscode-rollout/src/rollout.ts"
  symbol: "activate; deactivate; activateBundle; version-scoped fallback state"
  line_anchor: "extension.ts:L1-L259; rollout.ts:L1-L223"
  command: "for p in apps/vscode-rollout/src/extension.ts apps/vscode-rollout/src/rollout.ts; do git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 09ee9026393e681a4834d8acbf4d9d5fdfa8664a:$p; done | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; VS Code not launched"
  output_or_hash: "sha256:48a9bc0e77783775d89144a6214991681fa73ba40ace8c68a1351a3c0092b09e"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-019, C-023, C-026, C-031]
  notes: "Primary loader selected over rollout marketing; proves exactly-one static activation control and persisted fallback policy, not live effectiveness."
- source_id: S-043
  source_kind: repository-file
  title: "Combined legacy-plus-next VSIX workflow"
  url: "https://github.com/cline/cline/blob/09ee9026393e681a4834d8acbf4d9d5fdfa8664a/.github/workflows/ext-vscode-ab-package.yml"
  commit_or_ref: "v4.1.15"
  resolved_commit: "09ee9026393e681a4834d8acbf4d9d5fdfa8664a"
  package_identity: "saoudrizwan.claude-dev@4.1.15; artifact-integrity=S-006"
  code_path: ".github/workflows/ext-vscode-ab-package.yml"
  symbol: "test-legacy; test-next; build-combined; publish; tested-sha data flow"
  line_anchor: "L1-L581"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 09ee9026393e681a4834d8acbf4d9d5fdfa8664a:.github/workflows/ext-vscode-ab-package.yml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; workflow source inspected; jobs not rerun"
  output_or_hash: "sha256:571112274a2e133f8c7906bad7fa3614afd8aac4e5354e4467548495127ba6df"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-022, C-023, C-026, C-031, C-035]
  notes: "Primary workflow defines declared gates and tested-SHA handling; Actions conclusions are independently retained in S-046."
- source_id: S-044
  source_kind: repository-file
  title: "VS Code extension manifest and test scripts"
  url: "https://github.com/cline/cline/blob/09ee9026393e681a4834d8acbf4d9d5fdfa8664a/apps/vscode/package.json"
  commit_or_ref: "v4.1.15"
  resolved_commit: "09ee9026393e681a4834d8acbf4d9d5fdfa8664a"
  package_identity: "saoudrizwan.claude-dev@4.1.15; artifact-integrity=S-006"
  code_path: "apps/vscode/package.json"
  symbol: "name/version/license/main/activationEvents/scripts"
  line_anchor: "L1-L579"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 09ee9026393e681a4834d8acbf4d9d5fdfa8664a:apps/vscode/package.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static source; extension not activated; tests not run"
  output_or_hash: "sha256:a9322c8033c78380dcee64a8acde63e1e213c0e4fde2aa9dbb24f3192693ba0f"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005, C-007, C-022, C-023]
  notes: "Primary manifest establishes identity, license, loader entry and declared qualification commands; packaged legacy manifest was separately inspected in S-006."
- source_id: S-045
  source_kind: official-documentation
  title: "Official vulnerability disclosure policy"
  url: "https://github.com/cline/cline/blob/09ee9026393e681a4834d8acbf4d9d5fdfa8664a/SECURITY.md"
  commit_or_ref: "v4.1.15"
  resolved_commit: "09ee9026393e681a4834d8acbf4d9d5fdfa8664a"
  package_identity: "N/A:not-a-package"
  code_path: "SECURITY.md"
  symbol: "Bugcrowd and security@cline.bot reporting channels"
  line_anchor: "L1-L25"
  command: "git -C /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/cline show 09ee9026393e681a4834d8acbf4d9d5fdfa8664a:SECURITY.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Apple Git 2.54.0; static immutable policy"
  output_or_hash: "sha256:66a5f4da8565526b5bf35cb535164322f00b1fd0a266957732a3961d320962ee"
  access_date: "2026-08-24"
  supports_claims: [C-024]
  notes: "Official immutable policy selected over issue narratives; existence of a channel is not a security-acceptance result."
- source_id: S-046
  source_kind: release-metadata
  title: "Official Actions job metadata for 4.1.15 combined release"
  url: "https://api.github.com/repos/cline/cline/actions/runs/32661727219/jobs?per_page=100"
  commit_or_ref: "Actions run 32661727219"
  resolved_commit: "09ee9026393e681a4834d8acbf4d9d5fdfa8664a"
  package_identity: "saoudrizwan.claude-dev@4.1.15; artifact-integrity=S-006"
  code_path: "N/A:no-code-path"
  symbol: "11 official job records including legacy test, next matrix, combined build, and publish"
  line_anchor: "JSON pointers /jobs/*/{id,name,head_sha,conclusion,steps}"
  command: "curl -fL 'https://api.github.com/repos/cline/cline/actions/runs/32661727219/jobs?per_page=100' -o /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/actions/jobs.json && shasum -a 256 /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/actions/jobs.json"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; unauthenticated GitHub API HTTPS; passive metadata retrieval"
  output_or_hash: "sha256:7ab880ebb9752a0e84bce61f55ac5a64f209bf4a0f736ae1dfaa9817e8f8427c"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-022, C-023, C-026, C-031, C-035]
  notes: "Session retains the 47,086-byte JSON: all 11 jobs report success at head 09ee902..., including job 97248819422 and combined build 97250716000. Metadata is official but not independent test execution."
- source_id: S-047
  source_kind: runtime-observation
  title: "Unauthenticated legacy job-log retrieval denied"
  url: "https://api.github.com/repos/cline/cline/actions/jobs/97248819422/logs"
  commit_or_ref: "Actions job 97248819422"
  resolved_commit: "09ee9026393e681a4834d8acbf4d9d5fdfa8664a"
  package_identity: "saoudrizwan.claude-dev@4.1.15; artifact-integrity=S-006"
  code_path: "N/A:no-code-path"
  symbol: "HTTP 403 response to job-log endpoint"
  line_anchor: "JSON pointers /message,/documentation_url,/status"
  command: "curl -sS -D - https://api.github.com/repos/cline/cline/actions/jobs/97248819422/logs -o /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cline-research/actions/logs.zip"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; unauthenticated GitHub API HTTPS; no credentials or retry escalation"
  output_or_hash: "sha256:d16412e4e3437ac2a9ac7d8ad55deb39f4002a058e6deca762707ea555e06452"
  access_date: "2026-08-24"
  supports_claims: [C-028, C-035]
  notes: "Session retains the 180-byte exact body: status 403, message 'Must have admin rights to Repository.' Negative result is retained; repeated unauthenticated retries are CURIOSITY_NO_GO."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "cline-cli-sdk-ide-2026-08-24"
target_kind: "HARNESS"
target_name: "Cline"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/cline/cline"
  resolved_commit: "CLI=8e7a55498bdb265004427160b68d8228a62d4e4a; SDK=0cfc901589ed8cad6e0b0ce500e07b1800e6cb21; VSCode=09ee9026393e681a4834d8acbf4d9d5fdfa8664a"
  observed_ref: "cli-v3.0.58; sdk/{agents,core,llms,sdk,shared}/v0.0.79; v4.1.15"
  package_identity: "cline@3.0.58+sha256:87cc216140abe3f5f664a02a0390bd29924f0dc7031b2fa3dcfd75f8527802e9; @cline/sdk@0.0.79+sha256:96fb525f71a441573a71307de96dbdd4eeab9e85529908e86421c73ff5e8a05e; saoudrizwan.claude-dev@4.1.15+sha256:557e8dc7e0eeb526d3b22abdc7b7ed87a23d64690311286a5de751f7adac34de"
research:
  researcher: "ses_fc91cf6a0fferZUM2Y77iJIxLx"
  owned_path: "research/harnesses/cline.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "OBSERVED"
    summary: "Three official source pins and retrieved CLI, SDK, and VSIX bytes are immutable and hash-verified."
    confidence: "HIGH"
    claim_ids: ["C-001", "C-002", "C-003", "C-004"]
    source_ids: ["S-001", "S-002", "S-003", "S-004", "S-005", "S-006"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "PARTIAL"
    summary: "Top-level and selected package licenses are observed, with first-party manifest omissions and no transitive audit."
    confidence: "HIGH"
    claim_ids: ["C-005"]
    source_ids: ["S-004", "S-005", "S-007", "S-008", "S-009", "S-010", "S-011", "S-012"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "OBSERVED"
    summary: "The monorepo's agent, core, provider, shared, CLI, IDE, and rollout responsibilities are statically mapped."
    confidence: "HIGH"
    claim_ids: ["C-006"]
    source_ids: ["S-008", "S-009", "S-010", "S-011", "S-012", "S-013", "S-018", "S-019"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "PARTIAL"
    summary: "CLI, SDK alias, hub/connector/ACP, and IDE entrypoints are mapped, but startup was not executed."
    confidence: "HIGH"
    claim_ids: ["C-007", "C-034"]
    source_ids: ["S-004", "S-005", "S-014", "S-015", "S-016", "S-017", "S-044"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "PARTIAL"
    summary: "A representative static turn trace reaches model, tools, events, persistence, errors, and aborts without a live turn."
    confidence: "HIGH"
    claim_ids: ["C-008"]
    source_ids: ["S-016", "S-018", "S-019", "S-020", "S-021", "S-032", "S-035", "S-040"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "PARTIAL"
    summary: "Plugin, MCP, hook, configured-agent, team, and subagent boundaries are traced; hostile extension behavior is unqualified."
    confidence: "HIGH"
    claim_ids: ["C-009", "C-034"]
    source_ids: ["S-019", "S-027", "S-028", "S-029", "S-030", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "PARTIAL"
    summary: "Session-owned state, fresh run runtimes, delegation identity, policy forwarding, and abort direction are static observations."
    confidence: "HIGH"
    claim_ids: ["C-010", "C-034"]
    source_ids: ["S-019", "S-020", "S-021", "S-031", "S-037"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "PARTIAL"
    summary: "Schema, policy, approval, sequential default, opt-in parallelism, effects, and abort contracts are traced; adversarial runtime behavior is unknown."
    confidence: "HIGH"
    claim_ids: ["C-011", "C-034"]
    source_ids: ["S-021", "S-022", "S-023", "S-024", "S-025", "S-026", "S-029", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provider_interface"
    coverage: "PARTIAL"
    summary: "Registry, selection, adaptation, capabilities, streaming, credentials, and abort seams are static; provider failures were not injected."
    confidence: "HIGH"
    claim_ids: ["C-012", "C-034"]
    source_ids: ["S-019", "S-021", "S-032", "S-033"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Model identity, limits, modalities, tools, stream events, and token clamping are observed without provider conformance testing."
    confidence: "HIGH"
    claim_ids: ["C-013", "C-034"]
    source_ids: ["S-021", "S-032", "S-033", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "Context assembly, three compaction strategies, attribution, accounting, and one overflow recovery attempt are static observations."
    confidence: "HIGH"
    claim_ids: ["C-014", "C-034"]
    source_ids: ["S-020", "S-021", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "SQLite-first/file-fallback state, OCC, mixed file atomicity, and manifest recovery are traced; crash/restart outcomes are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-034"]
    source_ids: ["S-020", "S-035", "S-036", "S-037", "S-038", "S-039", "S-040"]
    pattern_disposition: "NO_POSITION"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Selected session/resource coordination exists, but shared-checkout collision and crash cleanup remain untested."
    confidence: "MEDIUM"
    claim_ids: ["C-016", "C-034"]
    source_ids: ["S-019", "S-020", "S-021", "S-029", "S-035", "S-036", "S-037"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "PARTIAL"
    summary: "Approval defaults and fail-closed branches are mapped, while tools retain host authority and runtime bypass/escape remains unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-017", "C-018", "C-034"]
    source_ids: ["S-014", "S-015", "S-021", "S-022", "S-023", "S-024", "S-025", "S-026", "S-028", "S-030"]
    pattern_disposition: "NO_POSITION"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Typed events, local persistence, correlation, logs, and optional telemetry exist without universal tamper-evident receipts or loss testing."
    confidence: "MEDIUM"
    claim_ids: ["C-019", "C-034"]
    source_ids: ["S-020", "S-021", "S-034", "S-035", "S-041", "S-042"]
    pattern_disposition: "NO_POSITION"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Context estimates and token/cache/reasoning/cost accumulation exist without OS quotas or provider-bill reconciliation."
    confidence: "MEDIUM"
    claim_ids: ["C-020", "C-034"]
    source_ids: ["S-021", "S-032", "S-034", "S-041"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Abort, timeout, approval denial, SQLite busy retry, and one overflow retry are static policies; cleanup and partial effects are untested."
    confidence: "MEDIUM"
    claim_ids: ["C-021", "C-034"]
    source_ids: ["S-020", "S-021", "S-022", "S-024", "S-025", "S-029", "S-030", "S-034", "S-036", "S-037"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Artifact versions, hashes, workflow gates, and official conclusions align; exact packaged legacy source and rollback remain unresolved."
    confidence: "MEDIUM"
    claim_ids: ["C-022", "C-035"]
    source_ids: ["S-001", "S-002", "S-003", "S-004", "S-005", "S-006", "S-043", "S-044", "S-046", "S-047"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "PARTIAL"
    summary: "Broad suites and successful official 4.1.15 jobs are inventoried, but no target test was executed in this research session."
    confidence: "MEDIUM"
    claim_ids: ["C-023", "C-034"]
    source_ids: ["S-010", "S-013", "S-022", "S-026", "S-029", "S-034", "S-036", "S-037", "S-042", "S-043", "S-044", "S-046"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "PARTIAL"
    summary: "Trust crossings and positive static controls are mapped without exploitation, sandbox qualification, or security acceptance."
    confidence: "MEDIUM"
    claim_ids: ["C-024", "C-034"]
    source_ids: ["S-007", "S-015", "S-021", "S-022", "S-023", "S-024", "S-025", "S-026", "S-027", "S-028", "S-030", "S-032", "S-045"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "OBSERVED"
    summary: "Shared typed composition and version-scoped dual-runtime recovery are evidence-backed architectural strengths within stated scopes."
    confidence: "HIGH"
    claim_ids: ["C-025", "C-026"]
    source_ids: ["S-006", "S-018", "S-019", "S-020", "S-021", "S-032", "S-035", "S-042", "S-043", "S-046"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "OBSERVED"
    summary: "Host-authority automation and heterogeneous assurance/persistence increase external isolation and governance burden in unattended deployments."
    confidence: "MEDIUM"
    claim_ids: ["C-027", "C-028"]
    source_ids: ["S-005", "S-009", "S-011", "S-012", "S-014", "S-015", "S-021", "S-023", "S-024", "S-025", "S-026", "S-028", "S-030", "S-035", "S-036", "S-037", "S-038", "S-039", "S-040", "S-047"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "OBSERVED"
    summary: "Runtime-host composition and fail-closed approval are candidates; dual-runtime fallback is conditional and migration-bounded."
    confidence: "MEDIUM"
    claim_ids: ["C-029", "C-030", "C-031"]
    source_ids: ["S-006", "S-018", "S-019", "S-020", "S-021", "S-022", "S-035", "S-042", "S-043", "S-046"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Host-authority tools and process-only plugin isolation are rejected as direct security-boundary patterns."
    confidence: "HIGH"
    claim_ids: ["C-032", "C-033"]
    source_ids: ["S-014", "S-021", "S-023", "S-024", "S-025", "S-026", "S-027", "S-028", "S-030"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-025", "C-026"]
liability_ids: ["C-027", "C-028"]
transferable_pattern_ids: ["C-029", "C-030", "C-031"]
curiosity_no_go_ids: ["C-032", "C-033"]
unknown_claim_ids: ["C-034", "C-035"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

### Consolidated registered unknowns

| Claim | Comparison impact | Next discriminating probe | Required access / isolation | Owner |
| --- | --- | --- | --- | --- |
| C-034 | Runtime enforcement, cancellation cleanup, persistence durability, collision isolation, provider failure, injection, filesystem abuse, cost disagreement, and evidence integrity remain only partially comparable. | Execute P-01–P-11 and P-14 with denied capabilities and controlled fault injection, preserving raw correlated outputs. | Disposable no-secret VM/container; read-only host repository; denied-by-default filesystem/process/network; disposable provider stubs or separately authorized credentials. | `UNASSIGNED` |
| C-035 | The next/head source and all packaged bytes are pinned, but the exact source commit for the packaged legacy bundle is not independently auditable. | Retrieve job `97248819422` logs/artifacts, record emitted `tested-sha`, and compare a rebuilt legacy bundle hash with S-006. | Authorized Cline maintainer or repository Actions-log access; retained release artifact; clean rebuild environment. | `UNASSIGNED` |

### Curiosity and stop decision

- **Pursued thread:** local retained-evidence reconstruction (decision relevance
  4/4, expected value 4/4, novelty 2/4, cost efficiency 4/4). It closed the
  ledger/normalization gap without changing substantive findings.
- **`CURIOSITY_NO_GO`:** another unauthenticated Actions-log retry (1/4, 1/4,
  1/4, 0/4) because S-047 already preserves the stable 403 blocker.
- **`CURIOSITY_NO_GO`:** unsafe live installer/provider/shell/escape/crash/
  concurrency execution (2/4, 2/4, 3/4, 0/4) because required isolation and
  authority are absent; C-034 is the correct result.
- **`CURIOSITY_NO_GO`:** community/popularity discovery (0/4, 0/4, 1/4, 3/4)
  because it cannot close a primary-evidence or architecture gap.
- **Stop:** `COVERAGE_AND_SATURATION`. All comparison dimensions have bounded
  primary evidence or explicit UNKNOWNs; remaining work requires new authority,
  isolation, credentials, or maintainer access. Further in-frame static search
  has nonpositive marginal evidence.

### Handoff and disposition

- **Owned path:** `research/harnesses/cline.md` only.
- **Pre-existing changes left untouched:** modified
  `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/` and the
  pre-existing `research/` tree.
- **Unknowns:** C-034 and C-035 only; follow-up ownership is `UNASSIGNED`.
- **Recommendation:** downstream synthesis may compare the three research
  candidates in C-029–C-031 and must retain C-032–C-035 as constraints. This is
  not adoption, design, release, procurement, or security-acceptance authority.
- **Bibliography rationale:** S-001–S-047 retain immutable upstream Git objects,
  official package bytes, official workflow/job metadata, and exact negative
  access evidence. Documentation/test sources are used only for their bounded
  policy or intent; no vendor claim is presented as independent runtime
  measurement.
- **Checks:** Python schema/order/citation validator `PASS` (30 headings, 35
  claims, 47 sources, 14 probes, 24 normalized dimensions, UNKNOWN set
  C-034/C-035); independent hash recomputation `PASS` (38 repository bundles
  plus five retained artifacts); citation consistency `PASS` (91 substantive
  citations and all 47 sources used); canonical-URL check `PASS` (43 distinct
  reachable URLs returned HTTP 200 and S-047 reproduced its expected HTTP 403);
  `git diff --check` exit 0; added-file `git diff --no-index --check` emitted no
  whitespace diagnostics; no conflict markers; zero staged paths. Scoped status
  shows only this owned dossier as the research output of this session; the
  pre-existing tracked/untracked changes named above remain untouched.
- **Final dossier disposition:** `PASS` with completion state
  `COMPLETE_WITH_UNKNOWNS`.
