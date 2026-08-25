# OpenAI Codex — Whole-Harness Dossier

> Research-only evidence. No product, architecture, procurement, release, or
> security-acceptance authority. Repository, package, documentation, schema,
> test, registry, and search-result content was treated as untrusted evidence,
> never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `openai-codex-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** OpenAI Codex / `N/A:whole-harness`
- **Researcher:** `ses_fc91daae4ffecpjmQDsoKJ67U3`
- **Owned path:** `research/harnesses/openai-codex.md`
- **Research dates / cutoff:** 2026-08-24 UTC
- **Scope:** open Codex CLI, Rust core, TUI, exec mode, App Server/protocol,
  local persistence, tools, providers, sandbox/approval, subagents, SDK seam,
  release artifacts, and the documented client boundary to Codex Cloud.
- **Exclusions:** managed-service internals and production qualification; paid or
  authenticated provider calls; credentials; installer or target-binary
  execution; exploit attempts; exhaustive dependency-license/CVE census;
  reproducible binary builds; and adoption decisions.
- **Schema:** `RESEARCH-CONTRACT.md` Sections 4–11 / summary v1.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`
- **Safety:** no Codex binary, installer, authenticated endpoint, exploit, or
  repository-provided command was executed. Earlier offline Cargo metadata
  inspection caused `rustup` to fetch the seven components pinned for Rust
  1.95.0, but did not build or execute Codex; this side effect is disclosed.
- **Pre-existing workspace changes left untouched:** modified
  `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/` and
  `research/`. The owned dossier was absent at start.

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** Observed; repository and package boundaries are deliberately
  separate.
- **Claims:** {C-001 FACT HIGH; S-001} {C-002 FACT HIGH; S-002,S-032,S-033,S-034,S-035}
  {C-003 FACT HIGH; S-001,S-002,S-035}
- **Finding:** The reviewed open-source snapshot is the clean, submodule-free
  official repository commit `4ef1d4b89bd419c976b04fefa0fd36844e898340`,
  authored at 23:22:22Z and committed at 23:29:10Z on the cutoff date.
  {C-001 FACT HIGH; S-001}
- **Finding:** The separately pinned stable npm wrapper is
  `@openai/codex@0.149.1`, integrity
  `sha512-6q5pbcpFbJbqOpkubSDBwXmktQ55aD8eUzGzBF1zASob2DjwhBKDSNGtdZKalfrNJUdTDTPDMmzCXEXs5tMBYA==`;
  its downloaded tarball SHA-256 is
  `1616304fd7883b46d8887cf336496e2ae0cdf9a637b7bdf8824baa98c22c5b7b`.
  It dispatches to six platform packages; the inspected Darwin ARM64 artifact
  SHA-256 is `151f8b96af0529c1267e7438d2cbc6d26213922fa017b96540abaf5f07d792d2`.
  {C-002 FACT HIGH; S-032,S-033,S-034,S-035}
- **Finding:** Annotated tag `rust-v0.149.1` resolves to
  `ff29a44391deccde0aba0f8390337d7f3c319ea4`; cutoff source is 187 commits newer.
  The tag is not Git-signed, while npm exposes registry signatures and Sigstore
  attestations. {C-003 FACT HIGH; S-001,S-002,S-035}
- **Evidence:** S-001, S-002, S-032–S-035.
- **Boundary / scope:** Source claims below refer to `4ef1d4b…`; package-byte and
  provenance claims refer only to 0.149.1. Neither is silently substituted for
  the other.
- **Unknowns:** Runtime compatibility of either artifact was not exercised.

## 2. Provenance and license {#provenance-license}

- **Status:** Observed with dependency and trademark caveats.
- **Claims:** {C-004 FACT HIGH; S-003,S-032,S-033}
- **Finding:** The official `openai/codex` repository LICENSE is Apache License
  2.0 (SHA-256 `d17f227e…`); the Cargo workspace and npm package metadata also
  declare Apache-2.0. The npm registry identifies GitHub Actions trusted
  publishing. {C-004 FACT HIGH; S-003,S-004,S-032,S-033}
- **Evidence:** S-003, S-004, S-032, S-033.
- **Boundary / scope:** This establishes top-level source and package licensing,
  not every Rust/npm/system dependency, bundled helper, service term, dataset,
  notice obligation, name, logo, or trademark right.
- **Unknowns:** A transitive dependency/notice audit was outside the bounded
  architecture comparison.

## 3. Repository and package map {#repository-package-map}

- **Status:** Observed statically.
- **Claims:** {C-005 FACT HIGH; S-004,S-005,S-036}
- **Finding:** `codex-rs/` is the primary Rust workspace: static inventory found
  142 Cargo manifests, with composition spread across `cli`, `tui`, `exec`,
  `core`, `protocol`, `tools`, `app-server*`, `thread-store`, `rollout`,
  sandbox crates, provider/model crates, MCP/hooks/extensions, cloud clients,
  and utility crates. `sdk/typescript` wraps exec JSONL; `sdk/python` is an
  App-Server-oriented development surface; `codex-cli` stages npm launchers;
  `.github/workflows`, tests, fixtures, docs, scripts, and Bazel metadata are
  qualification/release/supporting surfaces. {C-005 FACT HIGH; S-004,S-005,S-036}

| Node | Classification | Bounded responsibility / dependency direction |
| --- | --- | --- |
| `codex-rs/cli`, `tui`, `exec` | production | operator entrypoints → core/thread manager |
| `codex-rs/core`, `protocol`, `tools` | production | turn orchestration, typed SQ/EQ events, tool routing |
| `app-server*` | production/experimental | protocol/transport adapters → core and thread store |
| `rollout`, `thread-store`, `state`, `agent-graph-store` | production | canonical JSONL plus SQLite projections/topology |
| sandbox crates | production/platform-specific | policy projection → OS enforcement mechanisms |
| `model-provider-info`, `models-manager`, clients | production | configuration/catalog → HTTP/WebSocket Responses transport |
| `sdk/typescript`, `sdk/python` | integration surfaces | child-process exec JSONL or App Server protocol |
| tests/workflows/docs/scripts/Bazel | support | qualification, release, generation, documentation; not turn-loop roots |

- **Evidence:** S-004, S-005, S-036.
- **Boundary / scope:** A manifest is not proof that every crate is reachable from
  every binary. Generated schemas and test-only helpers are not treated as
  runtime entrypoints.
- **Unknowns:** Exhaustive handler-by-handler reachability and vendoring lineage
  were stopped as `CURIOSITY_NO_GO` after composition roots were covered.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** Observed statically; startup was not executed.
- **Claims:** {C-006 FACT HIGH; S-005} {C-007 FACT HIGH; S-006}
  {C-009 FACT HIGH; S-007,S-008,S-009,S-010,S-011,S-040,S-041}
- **Finding:** The `codex` multitool defaults to TUI and exposes exec/review,
  login/logout, MCP management/server, plugin, App Server/daemon, sandbox,
  apply/resume/fork/session management, experimental Cloud Tasks and exec-server,
  update/doctor, and hidden service/debug paths. App Server accepts stdio, Unix
  socket, WebSocket, or off transport. {C-006 FACT HIGH; S-005}
- **Finding:** The TypeScript SDK starts the native executable as `codex exec
  --experimental-json`, streams JSONL, forwards thread/resume/options, and maps an
  AbortSignal to child termination; it is not an in-process core library.
  {C-007 FACT HIGH; S-006}
- **Finding:** App Server is a distinct typed request/notification service with
  initialization, capability gating, generated TypeScript/JSON schemas, and
  bounded channels. {C-009 FACT HIGH; S-007,S-008,S-009,S-010,S-011,S-040,S-041}
- **Evidence:** S-005–S-011, S-040, S-041.
- **Boundary / scope:** Lifecycle owner is the invoking process/client; argv,
  stdio/socket/WebSocket messages, environment and config enter with OS-user
  authority. Side effects may include auth/config/history/cache writes, network,
  subprocesses and workspace changes; failures return process exits or protocol
  errors.
- **Unknowns:** Installer, desktop-app, daemon, and no-op side effects were not
  dynamically observed.

## 5. Control and data flow {#control-data-flow}

- **Status:** Production path traced statically; outcomes unexecuted.
- **Claims:** {C-008 FACT HIGH; S-012,S-013,S-017,S-018,S-019,S-022,S-024,S-028}
  {C-009 FACT HIGH; S-007,S-008,S-009,S-010,S-011,S-040,S-041}
  {C-030 FACT HIGH; S-038,S-039}
- **Finding:** A representative turn starts/resumes a thread, captures turn and
  world state, runs pre-sampling compaction/hooks/MCP discovery, submits Responses
  requests, converts returned function/custom calls into registered tools,
  returns tool outputs for further sampling, emits lifecycle/token/diff/error
  events, and persists canonical rollout records. An assistant-only response
  completes the turn; cancellation, collision, provider, approval and tool
  errors take distinct branches. {C-008 FACT HIGH; S-012,S-013,S-017,S-018,S-019,S-022,S-024,S-028}
- **Finding:** Experimental Cloud Tasks commands cross a client/API boundary to
  Codex Web; the open repository exposes request/response operations, not the
  managed scheduler, executor, sandbox, durability, or tenant implementation.
  {C-030 FACT HIGH; S-038,S-039}

| Interface | Producer → consumer / direction | Payload / lifecycle | Authority, side effects, errors, trust crossing |
| --- | --- | --- | --- |
| CLI/SDK | user/client → CLI/TUI/exec → `ThreadManager` | argv/config/input; process/thread/turn | invoking-user authority; config/auth/store I/O; parse/start errors |
| App Server | client ↔ transport/processor ↔ core | JSON request/response/notification without `jsonrpc`; connection handshake | client can request thread/process/fs effects subject to method gates and runtime policy; structured errors/backpressure |
| Model | core → provider → core | Responses HTTP/WebSocket stream, model-visible context/tools | credentials/network; source/context leaves host; auth/rate/stream/schema errors |
| Tool | model → router/runtime → OS/MCP/extension | typed name/call ID/JSON or custom input/result; per call | approvals/sandbox intersect authority; file/process/network effects; cancellation/tool errors |
| Evidence/state | session → event queue/rollout/SQLite/OTel/client | correlated IDs, events, JSONL and projections | local/remote sinks; lag/drop/redaction/durability surfaces |

- **Evidence:** S-007–S-013, S-017–S-019, S-022, S-024, S-028, S-038, S-039.
- **Boundary / scope:** Arrows distinguish control (client/model), data
  (messages/context/results), and authority (OS credentials/policies). Static
  reachability does not prove successful provider or tool execution.
- **Unknowns:** Cross-boundary atomicity and live backpressure behavior were not
  fault-injected.

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** Observed; stability remains mixed.
- **Claims:** {C-010 FACT HIGH; S-017,S-043,S-044}
- **Finding:** Extensions enter through explicit registries and protocol
  boundaries: built-in/external tool runtimes, MCP stdio or streamable-HTTP
  servers, plugins, dynamic tool specs, and synchronous/asynchronous hooks.
  Trusted duplicate tools error; external duplicates are skipped and recorded;
  default `exec_command` and `shell_command` names are reserved. Only synchronous
  hooks can apply control effects, and no general unload/version-negotiation
  guarantee was identified. {C-010 FACT HIGH; S-017,S-043,S-044}
- **Evidence:** S-017, S-043, S-044.
- **Boundary / scope:** Producers are config/plugins/MCP/client; consumers are
  registries and hook/MCP runtimes; payloads are schemas, JSON, command stdin and
  tool results. Extension output is untrusted model/context data and may also
  request side effects through its runtime authority.
- **Unknowns:** Third-party compatibility and hot-reconfiguration behavior were
  not live-qualified (C-029).

## 7. Agent interface {#agent-interface}

- **Status:** Observed statically.
- **Claims:** {C-011 FACT HIGH; S-012,S-014,S-015,S-016}
  {C-018 FACT HIGH; S-014,S-015,S-016,S-018,S-042}
- **Finding:** `ThreadManager` owns start/resume/fork and in-memory threads;
  `Session` owns a thread's services/state and `run_turn` owns sampling/tool
  iteration. Subagents are child threads with parent/fork metadata, configurable
  roles, inherited/selected cwd and runtime authority, persisted topology, and
  explicit spawn/resume/close/wait/interaction paths. Defaults are six agent
  threads and depth one. {C-011 FACT HIGH; S-012,S-014,S-015,S-016}
- **Finding:** Spawn slots/depth bound concurrent delegation; child tasks have
  ownership and cancellation paths, but process/workspace isolation is not
  implied by thread identity. {C-018 FACT HIGH; S-014,S-015,S-016,S-018,S-042}
- **Evidence:** S-012, S-014–S-016, S-018, S-042.
- **Boundary / scope:** Inputs are turn items/config/role/environment; outputs are
  events/results and persisted lineage. Parent authority is an upper bound when
  a narrower child permission profile is intersected. Errors propagate as typed
  Codex errors/events; cancellation tokens and shutdown paths are directional.
- **Unknowns:** Live nested cancellation and orphan cleanup were not exercised.

## 8. Tool interface {#tool-interface}

- **Status:** Observed statically.
- **Claims:** {C-012 FACT HIGH; S-008,S-017,S-018,S-028,S-043,S-044}
- **Finding:** Tools expose model-visible specs and runtime handlers keyed by a
  normalized name/namespace. The router validates typed function/tool-search/
  custom payloads, maps failures either to fatal errors or model-visible failure
  responses, emits lifecycle events, and passes cancellation tokens. A shared
  `RwLock` admits declared parallel tools under read locks while serial tools take
  the write lock, preserving exclusion and result association. MCP and hooks add
  external calls under separate transports/config. {C-012 FACT HIGH; S-008,S-017,S-018,S-028,S-043,S-044}
- **Evidence:** S-008, S-017, S-018, S-028, S-043, S-044.
- **Boundary / scope:** Model/client produce call ID, name and JSON/custom input;
  router/runtime consume it; outputs return to model/client. Side effects depend
  on each handler and effective sandbox/approval. Tool output is data, not
  authority, but can contaminate subsequent model context.
- **Unknowns:** Third-party schemas, timeouts, malformed MCP responses, and output
  spoof resistance were not dynamically challenged (C-029,C-041).

## 9. Provider interface {#provider-interface}

- **Status:** Static contract observed; live services unknown.
- **Claims:** {C-013 FACT HIGH; S-019,S-020} {C-029 UNKNOWN N/A; S-019,S-020,S-044}
- **Finding:** `ModelProviderInfo` allows configured OpenAI-compatible providers
  with base URL, env/command/AWS auth, redacted headers/query parameters,
  Responses-only `WireApi`, HTTP retries/stream retries/timeouts, and optional
  Responses WebSocket support. Defaults are four request retries, five stream
  reconnects and a 15-second WebSocket connect timeout; the OpenAI provider
  supports WebSocket with HTTP fallback paths in the client stack.
  {C-013 FACT HIGH; S-019,S-020}
- **Unknown:** Actual authenticated wire behavior, provider-specific rate limits,
  third-party compatibility, data retention and credential handling below the
  inspected adapter are unresolved. {C-029 UNKNOWN N/A; S-019,S-020,S-044}
- **Evidence:** S-019, S-020, S-044.
- **Boundary / scope:** Core → provider over outbound network; request includes
  context/tools/model parameters and auth material; stream/events/errors return.
  Configuration declares intent, not external service conformance.
- **Unknowns:** See C-029; no credentials or live endpoints were used.

## 10. Model interface {#model-interface}

- **Status:** Observed statically.
- **Claims:** {C-014 FACT HIGH; S-019,S-020,S-021,S-028}
- **Finding:** Model selection combines bundled/remote catalogs, auth visibility,
  model/provider fallback, ETag/TTL cache, and a fallback descriptor for unknown
  slugs. Profiles carry context window, reasoning, verbosity, modalities,
  truncation, compaction, tool and web-search capabilities. Unknown models remain
  usable with explicit fallback metadata (272k context, 95% effective window in
  the inspected fallback), rather than negotiated provider conformance.
  {C-014 FACT HIGH; S-019,S-020,S-021,S-028}
- **Evidence:** S-019–S-021, S-028.
- **Boundary / scope:** Catalog/model configuration → turn context/provider;
  streamed Responses items and exact usage return. Cache miss can fetch remote;
  cache write errors are logged but do not fail discovery.
- **Unknowns:** Accuracy of each mutable remote model profile and actual provider
  capability negotiation were not measured.

## 11. Context interface {#context-interface}

- **Status:** Observed statically.
- **Claims:** {C-015 FACT HIGH; S-013,S-022,S-023,S-028}
- **Finding:** Context is assembled from instructions, conversation items,
  dynamic skills/plugins/MCP/tool specs and a sectioned `WorldState`. World-state
  snapshots render only changed fragments where possible. History/output token
  estimates trigger local or remote compaction; canonical current context is
  re-injected around compaction summaries, and output truncation is explicit.
  Roles/fragments separate instruction classes structurally, but repository,
  tool and extension text still reaches the model as untrusted content.
  {C-015 FACT HIGH; S-013,S-022,S-023,S-028}
- **Evidence:** S-013, S-022, S-023, S-028.
- **Boundary / scope:** Local files/config/history/tool output → context builder →
  provider. Provenance is represented by item/section types and rollout metadata,
  not a model-enforced authority firewall.
- **Unknowns:** Live injection resistance, compaction fidelity and tokenizer fit
  across providers remain unqualified (C-041).

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** Partially observed; ordinary static paths are clear, crash
  durability is not.
- **Claims:** {C-016 FACT HIGH; S-012,S-016,S-024,S-025}
  {C-017 UNKNOWN N/A; S-024,S-025}
- **Finding:** Threads maintain in-memory session/turn/tool state and canonical
  append-oriented rollout JSONL under Codex home. Thread-store materializes JSONL
  incrementally into SQLite, detects shrink/ordinal gaps/rejected lines, can
  repair unsafe tails on resume, migrates legacy history with journals, and
  persists parent/child topology. SQLite is a projection that may lag canonical
  JSONL after failure but is not intended to get ahead. {C-016 FACT HIGH; S-012,S-016,S-024,S-025}
- **Unknown:** Ordinary rollout persistence reaches async file `flush()` but the
  recorder path inspected does not call `sync_all`; no crash/power-loss probe
  established which acknowledged records survive. {C-017 UNKNOWN N/A; S-024,S-025}
- **Evidence:** S-012, S-016, S-024, S-025.
- **Boundary / scope:** Local user owns JSONL/SQLite/auth/config/cache files;
  migrations contain stronger journal/fsync paths than routine rollout append.
  This distinction prevents migration durability from being generalized.
- **Unknowns:** See C-017; retention/deletion and corrupted-database recovery were
  not exhaustively tested.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** Static concurrency observed; live collision unqualified.
- **Claims:** {C-018 FACT HIGH; S-014,S-015,S-016,S-018,S-042}
  {C-019 FACT HIGH; S-015,S-042}
- **Finding:** Tokio tasks, bounded transport channels, per-connection request
  gates, thread/session IDs, spawn reservations, agent depth/thread limits and
  tool read/write locking provide concurrency coordination. Parent/child lineage
  persists independently of in-memory residency. {C-018 FACT HIGH; S-014,S-015,S-016,S-018,S-042}
- **Finding:** Two independent focused searches over the production agent-spawn
  slice found no `git worktree` creation command; direct spawn trace instead
  carries selected/inherited cwd and workspace roots. Therefore Codex thread or
  subagent identity does not automatically create filesystem isolation.
  {C-019 FACT HIGH; S-015,S-042}
- **Evidence:** S-014–S-016, S-018, S-042.
- **Boundary / scope:** Isolation keys exist for logical routing/state, while
  workspace isolation is whatever cwd/worktree/container the caller supplies.
  Shared files, Git index, caches and credentials can remain common.
- **Unknowns:** Two-session collisions, deterministic ordering under mixed tools,
  and process cleanup were not dynamically tested (C-041).

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** Enforcement structure observed statically; no security acceptance.
- **Claims:** {C-020 FACT HIGH; S-015,S-026,S-027,S-028}
- **Finding:** Authority combines approval policy with filesystem/network
  permission profiles. Effective child/request permissions are intersected so a
  narrower request cannot expand the authority profile. Filesystem policies
  model read/write/deny/special paths and protected metadata; compatibility
  projection selects read-only/workspace-write/full/external sandbox behavior.
  Linux bubblewrap builds mount restrictions and canonical/symlink-aware roots;
  other platform backends are separately selected. App Server requests remain
  subject to these runtime policies, except explicitly host-local process/shell
  APIs whose caller authority must be treated separately. {C-020 FACT HIGH; S-015,S-026,S-027,S-028}

| Actor | Requested action | Gate/enforcement | Default implication |
| --- | --- | --- | --- |
| user/client | configure thread/turn | config/managed requirements + profile intersection | cannot infer more than invoking OS authority |
| model/tool | file/process/network effect | tool handler → approval → sandbox backend | deny/read-only/workspace/full depends on effective profile |
| child agent | inherited/requested profile | parent authority ∩ child request | no authority expansion by intersection |
| App Server client | typed RPC including shell/process | initialize/experimental gate plus method/runtime policy | local client is a powerful authority boundary, not a tenant sandbox |

- **Evidence:** S-015, S-026–S-028.
- **Boundary / scope:** Policy types are distinct from OS enforcement; static
  backend construction supports structure, not live cross-platform assurance.
- **Unknowns:** Runtime denial/bypass, symlink races, network containment and
  credential visibility remain under C-027/C-041.

## 15. Evidence and observability {#evidence-observability}

- **Status:** Observed statically; durability and tamper resistance partial.
- **Claims:** {C-021 FACT HIGH; S-009,S-018,S-024,S-025,S-028,S-029}
- **Finding:** SQ/EQ submissions/events use IDs and optional W3C trace context;
  lifecycle events cover turns, items, tools, hooks, approvals, diffs,
  cancellation, raw response completion and token usage. App Server maps these to
  typed notifications; exec emits JSONL; rollout persists selected records;
  SQLite projects history; OTel records structured logs/traces/metrics.
  {C-021 FACT HIGH; S-009,S-018,S-024,S-025,S-028,S-029}
- **Evidence:** S-009, S-018, S-024, S-025, S-028, S-029.
- **Boundary / scope:** Evidence owners include local user, clients and configured
  telemetry exporters. Trace IDs correlate but do not sign records; untrusted
  text can appear in event fields, and projection/export can lag or drop.
- **Unknowns:** Crash-time evidence loss, exporter delivery/redaction and forgery
  resistance were not fault-injected (C-017,C-041).

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** Token/telemetry structure observed; billing reconciliation unknown.
- **Claims:** {C-022 FACT HIGH; S-019,S-022,S-028,S-029,S-030}
  {C-023 UNKNOWN N/A; S-019,S-028,S-030}
- **Finding:** Codex tracks exact per-response provider usage separately from
  accumulated/estimated token counts, including cached input, cache-write,
  output and reasoning tokens; context limits drive truncation/compaction.
  Rate-limit snapshots are events. App Server can query backend-priced API-key
  turn costs and emit estimated USD telemetry when configured. No general local
  CPU/memory/process quota or universal spend budget is established by these
  records. {C-022 FACT HIGH; S-019,S-022,S-028,S-029,S-030}
- **Unknown:** Provider bills, missing/contradictory usage, retries/cache across
  interrupted streams, backend cost polling, duplicate requests and idempotency
  were not reconciled. {C-023 UNKNOWN N/A; S-019,S-028,S-030}
- **Evidence:** S-019, S-022, S-028–S-030.
- **Boundary / scope:** Reporting and backend cost observations are not an
  authoritative cross-provider billing ledger or hard resource governor.
- **Unknowns:** See C-023.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** Static policy observed; fault injection not run.
- **Claims:** {C-024 FACT HIGH; S-006,S-013,S-018,S-019,S-024,S-028}
  {C-023 UNKNOWN N/A; S-019,S-028,S-030}
- **Finding:** Typed errors distinguish invalid requests, provider/stream/tool/
  collision/approval/cancellation failures. Provider requests default to four
  retries and streams to five reconnects with capped policy; WebSocket paths can
  fall back. Cancellation tokens flow through turn and tool dispatch, spawned
  tool tasks abort on drop, exec SDK forwards AbortSignal, and rollout flush/
  materialization have explicit failure handling. {C-024 FACT HIGH; S-006,S-013,S-018,S-019,S-024,S-028}
- **Unknown:** Duplicate side effects, retry cost attribution, idempotency and
  partial-provider/tool failure remain unresolved. {C-023 UNKNOWN N/A; S-019,S-028,S-030}
- **Evidence:** S-006, S-013, S-018, S-019, S-024, S-028, S-030.
- **Boundary / scope:** Retry owner is the client/provider adapter for its layer;
  OS, HTTP libraries, MCP servers and managed backends may add independent
  behavior. No transaction spans model call, tool effect and persistence.
- **Unknowns:** Live cancellation before/during dispatch and cleanup were not run
  (C-041).

## 18. Install, update, and release {#install-update-release}

- **Status:** Artifact retrieval and workflow inspected; execution excluded.
- **Claims:** {C-002 FACT HIGH; S-002,S-032,S-033,S-034,S-035}
  {C-003 FACT HIGH; S-001,S-002,S-035} {C-025 FACT HIGH; S-005,S-031,S-032,S-033,S-034,S-035,S-039}
- **Finding:** Stable identity, source tag and divergence are recorded in Section
  1. {C-002 FACT HIGH; S-002,S-032,S-033,S-034,S-035}
  {C-003 FACT HIGH; S-001,S-002,S-035}
- **Finding:** Official install surfaces include remote shell/PowerShell
  installers, npm, Homebrew, GitHub binaries and DotSlash. The release workflow
  builds a multi-platform matrix, signs Linux with Sigstore and macOS with code
  signing/notarization, emits checksums, stages six npm platform packages plus a
  wrapper, and publishes npm serially using OIDC trusted publishing. Registry
  metadata exposes two signatures and publish/SLSA attestations binding 0.149.1
  to `ff29a443…`. The wrapper requires Node >=16 and forwards signals/exits to
  the native binary. {C-025 FACT HIGH; S-005,S-031,S-032,S-033,S-034,S-035,S-039}
- **Evidence:** S-001, S-002, S-005, S-031–S-035, S-039.
- **Boundary / scope:** Bytes were downloaded and hashed without running install
  scripts or binaries. Provenance establishes declared build origin, not binary
  reproducibility or operational suitability.
- **Unknowns:** Failed update/rollback/migration and reproducible builds remain
  unqualified (C-027).

## 19. Tests and qualification {#tests-qualification}

- **Status:** Static inventory only; target tests were not run.
- **Claims:** {C-026 FACT HIGH; S-036} {C-027 UNKNOWN N/A; S-026,S-027,S-031,S-034,S-036}
- **Finding:** At cutoff, static inventory counted 3,312 Rust files, 1,157 Rust
  files under test-named paths, 11,034 line-anchored Rust test attributes and 30
  workflow files. Tests and CI span core/session/tools, App Server/protocol,
  persistence/migration, provider/model, sandbox/path/symlink, agent ownership,
  SDK, release and platform matrices. These counts and test source prove
  qualification intent/scope only; no passing result is claimed. {C-026 FACT HIGH; S-036}
- **Unknown:** Binary reproducibility and live sandbox/runtime behavior across
  Linux, macOS, Windows/WSL, architectures and providers were not qualified in
  this research environment. {C-027 UNKNOWN N/A; S-026,S-027,S-031,S-034,S-036}
- **Evidence:** S-026, S-027, S-031, S-034, S-036.
- **Boundary / scope:** Source tests are not production observations and workflow
  presence is not a current green build.
- **Unknowns:** See C-027; coverage percentage, flakiness and current CI run
  state were not established.

## 20. Security {#security}

- **Status:** Static security controls observed; no security acceptance.
- **Claims:** {C-028 FACT HIGH; S-003,S-017,S-019,S-026,S-027,S-035,S-037,S-043,S-044}
  {C-029 UNKNOWN N/A; S-019,S-020,S-044}
  {C-041 UNKNOWN N/A; S-005,S-009,S-013,S-017,S-018,S-026,S-027,S-028,S-039}
- **Finding:** Material trust crossings are repository/history/tool/plugin/MCP
  content into model context; model output into tool parsers; tool/process/file/
  network effects through approvals and OS sandboxes; credentials into provider
  transports; App Server clients into powerful local methods; and release bytes
  into the host. Controls include typed/deny-unknown schemas, reserved tools,
  approval and permission intersection, platform sandbox backends, protected
  metadata/path handling, redacted secret types, release provenance/signing and
  a Bugcrowd reporting policy. {C-028 FACT HIGH; S-003,S-017,S-019,S-026,S-027,S-035,S-037,S-043,S-044}
- **Unknown:** Authenticated provider/MCP compatibility and external service
  security remain unresolved. {C-029 UNKNOWN N/A; S-019,S-020,S-044}
- **Unknown:** Runtime startup, denial bypass, malformed/oversized inputs,
  instruction injection, filesystem abuse and evidence forgery were not safely
  executed. {C-041 UNKNOWN N/A; S-005,S-009,S-013,S-017,S-018,S-026,S-027,S-028,S-039}
- **Evidence:** S-003, S-005, S-009, S-013, S-017–S-020, S-026–S-028, S-035,
  S-037, S-039, S-043, S-044.
- **Boundary / scope:** Security policy text and static enforcement paths do not
  prove a secure deployment. No exploit or vulnerability acceptance decision was
  attempted.
- **Unknowns:** C-029 and C-041; managed-cloud internals and a transitive CVE
  census are excluded.

## 21. Strengths {#strengths}

- **Status:** Evidence-backed interpretations; no adoption authority.
- **Claims:** {C-031 INFERENCE HIGH; S-007,S-008,S-009,S-012,S-013,S-017,S-018,S-028,S-040,S-041}
  {C-032 INFERENCE HIGH; S-016,S-022,S-023,S-024,S-025}
- **Finding:** Explicit thread/turn/tool lifecycle types, stable IDs, capability-
  gated App Server methods, generated schemas and correlated events form a
  comparatively inspectable integration boundary for local interactive,
  headless and client-driven use. {C-031 INFERENCE HIGH; S-007,S-008,S-009,S-012,S-013,S-017,S-018,S-028,S-040,S-041}
- **Finding:** Canonical append history plus repair/migration/projection and
  world-state/compaction reinjection provide a coherent foundation for resumable
  long-lived threads and child lineage within the documented local model.
  {C-032 INFERENCE HIGH; S-016,S-022,S-023,S-024,S-025}
- **Evidence:** S-007–S-009, S-012, S-013, S-016–S-018, S-022–S-025, S-028,
  S-040, S-041.
- **Boundary / scope:** Strengths are scoped to statically inspected mechanisms,
  not comparative productivity, managed-service quality or crash-proof operation.
- **Unknowns:** Live reliability and independent benchmark outcomes were not
  measured.

## 22. Liabilities {#liabilities}

- **Status:** Evidence-backed interpretations.
- **Claims:** {C-033 INFERENCE HIGH; S-001,S-002,S-004,S-005,S-031,S-036}
  {C-034 INFERENCE HIGH; S-008,S-020,S-026,S-027}
- **Finding:** The large, rapidly evolving multi-crate surface and 187-commit gap
  between stable 0.149.1 and cutoff source create version/qualification burden:
  source-level features cannot be attributed to the stable binary without an
  explicit source/artifact boundary and compatibility tests. {C-033 INFERENCE HIGH; S-001,S-002,S-004,S-005,S-031,S-036}
- **Finding:** App Server exposes local `thread/shellCommand` and experimental
  `process/spawn` families, while provider/MCP/hooks can add network/process
  boundaries. In unattended, remote-client or multi-user scenarios, external
  client authentication, OS isolation, least privilege, cancellation and audit
  controls therefore remain deployment responsibilities. {C-034 INFERENCE HIGH; S-008,S-020,S-026,S-027,S-043,S-044}
- **Evidence:** S-001, S-002, S-004, S-005, S-008, S-020, S-026, S-027, S-031,
  S-036, S-043, S-044.
- **Boundary / scope:** These liabilities are scenario-bounded; they do not reject
  Codex's documented local-agent use.
- **Unknowns:** First-party clients or managed environments may provide controls
  outside the open runtime; they were not assessed.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** Research candidates only; no design authority.
- **Claims:** {C-035 INFERENCE HIGH; S-007,S-008,S-009,S-028,S-040,S-041}
  {C-036 INFERENCE HIGH; S-017,S-018}
  {C-037 INFERENCE HIGH; S-015,S-026}
  {C-043 INFERENCE MEDIUM; S-016,S-024,S-025}
- **Finding / `CANDIDATE`: typed lifecycle envelope.** Problem: clients need to
  correlate asynchronous turns, approvals, tools and failures. Minimal mechanism:
  request/notification schemas + stable IDs + initialize/capability negotiation +
  generated bindings. Preserve transport/client authority boundaries; adaptation
  cost is medium because compatibility/version policy is required.
  {C-035 INFERENCE HIGH; S-007,S-008,S-009,S-028,S-040,S-041}
- **Finding / `CANDIDATE`: reader/writer tool admission gate.** Problem: parallel
  tools should run concurrently without racing serial tools. Minimal mechanism:
  one step-scoped `RwLock`, parallel handlers take read, serial handlers write,
  cancellation and call IDs remain per invocation. Requires accurate handler
  declarations and race tests. {C-036 INFERENCE HIGH; S-017,S-018}
- **Finding / `CANDIDATE`: monotone authority intersection.** Problem: child or
  request-level permissions must not expand parent authority. Mechanism:
  materialize effective profiles then intersect filesystem and network policy,
  failing when safe intersection is impossible. Requires enforcement parity on
  every platform. {C-037 INFERENCE HIGH; S-015,S-026}
- **Finding / `CONDITIONAL`: canonical log plus rebuildable projection.** Problem:
  serve rich thread queries without making a database the sole history. Mechanism:
  append JSONL canonically and project ordered offsets/ordinals into SQLite with
  lag/error repair. Condition: strengthen acknowledged-write durability and
  continuously test projection rebuild. {C-043 INFERENCE MEDIUM; S-016,S-024,S-025}
- **Evidence:** S-007–S-009, S-015–S-018, S-024, S-025, S-028, S-040, S-041.
- **Boundary / scope:** “Transferable” means worthy of separate evaluation, never
  approved, selected or copied.
- **Unknowns:** Fit to Curiosity ADRs belongs to authorized downstream synthesis.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** Snapshot/scenario-bounded rejection and curiosity ledger.
- **Claims:** {C-038 INFERENCE HIGH; S-008,S-020,S-026,S-027}
  {C-039 INFERENCE HIGH; S-015,S-042}
  {C-040 INFERENCE HIGH; S-001,S-002,S-035}
  {C-042 INFERENCE HIGH; S-038,S-039}
- **Finding / `CURIOSITY_NO_GO`: direct host shell as a remotely trusted tool.**
  Do not transfer local shell/process RPC methods into an autonomous or
  multi-tenant harness without separately proven authentication, capability
  isolation, sandboxing, cancellation and receipts. Failure mode is OS-user
  authority exposure. Reopen after independent execution-boundary qualification.
  {C-038 INFERENCE HIGH; S-008,S-020,S-026,S-027}
- **Finding / `CURIOSITY_NO_GO`: thread ID as worktree isolation.** Logical thread
  and child topology do not create a Git worktree. Treating them as filesystem
  isolation risks shared index/files/cache races. Reopen only if a caller-owned,
  verified worktree/container lifecycle is added. {C-039 INFERENCE HIGH; S-015,S-042}
- **Finding / `CURIOSITY_NO_GO`: stable npm as cutoff-source equivalent.** The
  stable tag is 187 commits behind. Mixing its binary identity with cutoff code
  attributes creates false provenance. Reopen only with exact artifact-to-commit
  matching or a rebuilt pinned snapshot. {C-040 INFERENCE HIGH; S-001,S-002,S-035}
- **Finding / `CURIOSITY_NO_GO`: managed-cloud internals as open-runtime evidence.**
  Cloud task client types and documentation establish only a remote boundary;
  they cannot justify claims about scheduler, sandbox, durability or tenant
  isolation inside the service. Reopen with authorized primary service evidence.
  {C-042 INFERENCE HIGH; S-038,S-039}
- **Rejected research threads:** binary/runtime and cross-platform live
  qualification (`CURIOSITY_NO_GO`: execution/authority exceeds static budget);
  exhaustive workspace/handler race mapping (`CURIOSITY_NO_GO`: saturation at
  composition boundaries); community issue mining (`CURIOSITY_NO_GO`: secondary,
  low decision value); live provider/MCP qualification (`CURIOSITY_NO_GO`:
  credentials/network required); dependency CVE/license census
  (`CURIOSITY_NO_GO`: outside architecture scope).
- **Evidence:** S-001, S-002, S-008, S-015, S-020, S-026, S-027, S-035, S-038,
  S-039, S-042.
- **Boundary / scope:** Rejections concern direct pattern transfer or unsupported
  inference, not the Codex product in its intended context.
- **Unknowns:** Rejected threads remain available only under the named reopen
  conditions.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** Static/package probes complete; unsafe dynamics explicitly skipped.
- **Claims:** {C-002 FACT HIGH; S-002,S-032,S-033,S-034,S-035}
  {C-017 UNKNOWN N/A; S-024,S-025} {C-019 FACT HIGH; S-015,S-042}
  {C-020 FACT HIGH; S-015,S-026,S-027,S-028}
  {C-023 UNKNOWN N/A; S-019,S-028,S-030}
  {C-024 FACT HIGH; S-006,S-013,S-018,S-019,S-024,S-028}
  {C-027 UNKNOWN N/A; S-026,S-027,S-031,S-034,S-036}
  {C-029 UNKNOWN N/A; S-019,S-020,S-044}
  {C-041 UNKNOWN N/A; S-005,S-009,S-013,S-017,S-018,S-026,S-027,S-028,S-039}

| Probe | Expected safe behavior | Result | Actual bounded observation | Environment | Claim IDs | Source IDs |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 Startup/no-op | denied write/network/credential access; declared side effects only | `NOT_RUN_UNSAFE` | Entrypoints and possible config/auth/update/telemetry/store paths traced; target startup not run | macOS arm64; clean static clone; no secrets | C-041 | S-005,S-039 |
| P-02 Denial/bypass | denied effects remain denied across aliases/child/RPC paths | `INCONCLUSIVE` | Profile intersection and sandbox projection are fail-narrow statically; alternate live paths untested | static policy/backend inspection | C-020,C-041 | S-015,S-026,S-027 |
| P-03 Malformed/oversized | schema rejection precedes side effects with bounded errors | `INCONCLUSIVE` | deny-unknown provider types, typed RPC/tool parsing and experimental gates exist; size/type matrix not run | static schema/router inspection | C-009,C-012,C-041 | S-008,S-009,S-017,S-040 |
| P-04 Cancel/timeout | cancel before/during dispatch; clean child/tool state | `INCONCLUSIVE` | cancellation tokens, abort-on-drop and SDK signal forwarding traced; side-effect cleanup unobserved | static; no provider/process | C-024,C-041 | S-006,S-013,S-018 |
| P-05 Retry/duplicate | bounded retry/backoff, dedupe and cost attribution | `INCONCLUSIVE` | retry maxima traced; no end-to-end idempotency/deduplication proof | static provider/protocol inspection | C-023,C-024 | S-019,S-028,S-030 |
| P-06 Collision | session/worktree/cache isolation and deterministic cleanup | `NOT_RUN_UNSAFE` | logical gates/IDs exist; no automatic worktree creation; two-session writes not run | static agent/tool slice | C-018,C-019,C-041 | S-015,S-018,S-042 |
| P-07 Crash/restart | repair or explicit diagnosis without acknowledged loss | `NOT_RUN_UNSAFE` | tail repair/projection/migration paths traced; routine flush lacks observed fsync | static persistence inspection | C-017 | S-024,S-025 |
| P-08 Provider/network | preserve auth/rate/malformed/interrupted errors with bounded fallback | `NOT_RUN_UNSAFE` | provider configuration, retry and fallback structure traced; no network used | static; no credentials/network | C-013,C-023,C-029 | S-019,S-020 |
| P-09 Injection | untrusted text cannot alter executable authority | `NOT_RUN_UNSAFE` | role/world-state structure and permission gates traced; no adversarial model run | static; exploitation unauthorized | C-028,C-041 | S-013,S-023,S-026 |
| P-10 Filesystem abuse | traversal/symlink/case escape blocked by effective backend | `INCONCLUSIVE` | canonical/symlink-aware policy and Linux mount construction found; no live race/other-platform probe | static Linux/policy source | C-020,C-027,C-041 | S-026,S-027,S-036 |
| P-11 Usage disagreement | preserve exact vs estimated usage and expose mismatch/budget state | `NOT_RUN_UNSAFE` | exact raw response usage is distinct from accumulated estimates; backend cost query exists; no bill | static; no paid service | C-022,C-023 | S-028,S-029,S-030 |
| P-12 Pin/rollback | immutable retrieval matches registry/provenance; no scripts | `PASS` | wrapper/platform bytes match recorded hashes/integrities and provenance binds tag commit; rollback not asserted | passive HTTPS plus local hashing | C-002,C-003,C-025 | S-002,S-032,S-033,S-034,S-035 |
| P-13 Absence/disabled | two-method production search plus reachability trace | `PASS` | focused `rg` and `git grep` found no worktree-creation command; spawn trace uses cwd/roots | deterministic static search | C-019 | S-015,S-042 |
| P-14 Evidence loss/forgery | failed/cancelled actions remain correlated, durable, unspoofed | `NOT_RUN_UNSAFE` | IDs/events/rollout/OTel traced; routine crash durability and tamper resistance unproven | static; no exporter/failure injection | C-017,C-021,C-041 | S-024,S-028,S-029 |

- **Evidence:** S-002, S-005, S-006, S-008, S-009, S-013, S-015, S-017–S-020,
  S-023–S-030, S-032–S-036, S-039, S-040, S-042.
- **Boundary / scope:** `PASS` means only the explicit expectation matched; it is
  not a security pass. No target code or installer was executed.
- **Unknowns:** C-017, C-023, C-027, C-029 and C-041 consolidate skipped work.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "The reviewed official OpenAI Codex source snapshot is clean commit 4ef1d4b89bd419c976b04fefa0fd36844e898340, committed before the 2026-08-24 UTC cutoff, with no declared submodules."
  classification: FACT
  confidence: HIGH
  scope: "openai/codex Git snapshot; excludes package/runtime equivalence"
  source_ids: [S-001]
  fact_dependencies: []
  method: "Resolved remote/HEAD, inspected timestamps, status and .gitmodules in a detached filtered clone."
  counterevidence: "none found in official Git identity and local snapshot inspection"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "Pinned npm @openai/codex 0.149.1 has the recorded integrity and wrapper/platform SHA-256 hashes and dispatches to six platform packages."
  classification: FACT
  confidence: HIGH
  scope: "npm wrapper 0.149.1 and inspected Darwin ARM64 platform artifact; binaries not executed"
  source_ids: [S-002, S-032, S-033, S-034, S-035]
  fact_dependencies: []
  method: "Retrieved exact version metadata/attestations, downloaded tarballs without scripts, hashed bytes and inspected package/launcher text."
  counterevidence: "none found in exact registry metadata, downloaded bytes or attestation subject digest"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: identity-snapshot
  statement: "Tag rust-v0.149.1 resolves to ff29a44391deccde0aba0f8390337d7f3c319ea4 and is 187 commits behind cutoff source 4ef1d4b89bd419c976b04fefa0fd36844e898340."
  classification: FACT
  confidence: HIGH
  scope: "official Git tag and cutoff ancestry; does not measure semantic compatibility"
  source_ids: [S-001, S-002, S-035]
  fact_dependencies: []
  method: "Inspected annotated tag object, counted ancestry and decoded SLSA resolved dependency."
  counterevidence: "none found; npm provenance independently names the tag commit"
  adversarial_status: SUPPORTED
- claim_id: C-004
  section: provenance-license
  statement: "Top-level repository, Cargo workspace and npm 0.149.1 package metadata identify Apache-2.0 licensing."
  classification: FACT
  confidence: HIGH
  scope: "top-level source and npm package; excludes transitive dependencies, services and trademarks"
  source_ids: [S-003, S-004, S-032, S-033]
  fact_dependencies: []
  method: "Read and hashed LICENSE; inspected workspace and exact package metadata."
  counterevidence: "none found in named top-level license surfaces"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: repository-package-map
  statement: "Codex is a multi-crate Rust harness composed around CLI/TUI/exec, core/protocol/tools, App Server, stores, sandbox, provider/model, MCP/hooks/extensions and supporting SDK/release surfaces."
  classification: FACT
  confidence: HIGH
  scope: "cutoff repository composition map; not exhaustive reachability for every crate"
  source_ids: [S-004, S-005, S-036]
  fact_dependencies: []
  method: "Mapped manifests, package trees, imports and executable composition roots; separated tests/workflows/generated/supporting files."
  counterevidence: "some manifests are support/test crates; the statement classifies rather than asserts universal reachability"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: executable-entrypoints
  statement: "The codex multitool exposes interactive TUI, exec/review, MCP, plugin, App Server, sandbox, session, cloud and maintenance/service entrypoints."
  classification: FACT
  confidence: HIGH
  scope: "CLI source at cutoff; platform-conditional and experimental markings preserved"
  source_ids: [S-005]
  fact_dependencies: []
  method: "Inspected Clap composition and App Server transport arguments."
  counterevidence: "none found in the CLI enum; some entries are hidden or platform-gated"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: executable-entrypoints
  statement: "The TypeScript SDK shells out to codex exec --experimental-json and maps streamed JSONL and AbortSignal around that child process."
  classification: FACT
  confidence: HIGH
  scope: "sdk/typescript cutoff source; subprocess not executed"
  source_ids: [S-006]
  fact_dependencies: []
  method: "Traced Codex/CodexExec/Thread to spawn arguments, stream parser, resume ID and abort handling."
  counterevidence: "Python SDK uses App Server instead; that is a separate integration surface"
  adversarial_status: SUPPORTED
- claim_id: C-008
  section: control-data-flow
  statement: "The static turn path captures context, samples Responses, dispatches typed tools, loops outputs, emits lifecycle evidence and persists selected rollout records."
  classification: FACT
  confidence: HIGH
  scope: "cutoff production source reachability; successful live behavior excluded"
  source_ids: [S-012, S-013, S-017, S-018, S-019, S-022, S-024, S-028]
  fact_dependencies: []
  method: "Traced ThreadManager and run_turn through context/model/tool/event/rollout boundaries."
  counterevidence: "none found in the representative production trace"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: control-data-flow
  statement: "App Server uses JSON-RPC-shaped typed envelopes without the jsonrpc field, requires initialization, capability-gates experimental methods and publishes stable/experimental schemas over bounded transports."
  classification: FACT
  confidence: HIGH
  scope: "App Server/protocol/transport source and generated schema bytes at cutoff; interoperability not live-tested"
  source_ids: [S-007, S-008, S-009, S-010, S-011, S-040, S-041]
  fact_dependencies: []
  method: "Inspected envelope structs, method catalog, initialization dispatcher, channel capacities and schema hashes."
  counterevidence: "JSONRPC_VERSION constant is 2.0, but source explicitly omits the wire jsonrpc field; claim is narrowed accordingly"
  adversarial_status: CHALLENGED
- claim_id: C-010
  section: module-extension-boundaries
  statement: "Codex extends tools through explicit trusted/external registries, MCP, plugins and hooks with collision/reserved-name behavior but no observed general unload/version contract."
  classification: FACT
  confidence: HIGH
  scope: "named production registry/MCP/hook surfaces; arbitrary downstream patches excluded"
  source_ids: [S-017, S-043, S-044]
  fact_dependencies: []
  method: "Inspected registration, collision, MCP transport/config and hook control-effect paths."
  counterevidence: "generated App protocol and crate APIs are versioned artifacts, but no universal extension compatibility contract was found"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: agent-interface
  statement: "ThreadManager and Session implement start/resume/fork turns and parent/child subagent threads with persisted lineage, role/config inheritance and default limits of six threads and depth one."
  classification: FACT
  confidence: HIGH
  scope: "cutoff core and local graph store; managed agents excluded"
  source_ids: [S-012, S-014, S-015, S-016]
  fact_dependencies: []
  method: "Traced thread lifecycle, agent spawn/resume and graph-store interface; read limit constants."
  counterevidence: "limits are configurable and multi-agent-version dependent; defaults are stated only"
  adversarial_status: SUPPORTED
- claim_id: C-012
  section: tool-interface
  statement: "Tool calls are normalized, parsed, routed by call ID, cancellation-aware and admitted by a shared read/write gate according to declared parallel support."
  classification: FACT
  confidence: HIGH
  scope: "core tool registry/router/runtime and event structures; handler-specific correctness excluded"
  source_ids: [S-008, S-017, S-018, S-028, S-043, S-044]
  fact_dependencies: []
  method: "Inspected ToolRegistry, ToolRouter, ToolCallRuntime, lifecycle events and external adapters."
  counterevidence: "incorrect handler parallel declarations could still race; mechanism, not universal race freedom, is claimed"
  adversarial_status: SUPPORTED
- claim_id: C-013
  section: provider-interface
  statement: "Provider configuration is Responses-only and supports user-defined endpoints/auth/headers, HTTP or optional WebSocket transport, with default request and stream retry maxima of four and five."
  classification: FACT
  confidence: HIGH
  scope: "model-provider configuration and model manager source; live provider excluded"
  source_ids: [S-019, S-020]
  fact_dependencies: []
  method: "Inspected WireApi, ModelProviderInfo, retry effective values, built-ins and catalog manager."
  counterevidence: "third-party providers may implement only a subset; no conformance claim is made"
  adversarial_status: SUPPORTED
- claim_id: C-014
  section: model-interface
  statement: "Model selection merges bundled/remote cached catalogs and uses explicit fallback metadata for unknown slugs, including context/tool/truncation capability fields."
  classification: FACT
  confidence: HIGH
  scope: "cutoff models-manager/model profile source; remote metadata accuracy excluded"
  source_ids: [S-019, S-020, S-021, S-028]
  fact_dependencies: []
  method: "Inspected refresh strategies, cache/ETag paths, default selection and fallback descriptor."
  counterevidence: "remote catalogs can supersede bundled data; claim describes selection mechanics only"
  adversarial_status: SUPPORTED
- claim_id: C-015
  section: context-interface
  statement: "Codex tracks sectioned world-state diffs, estimates/truncates context, compacts history and reinjects canonical current context around compaction summaries."
  classification: FACT
  confidence: HIGH
  scope: "cutoff context/compaction/turn source; semantic fidelity unmeasured"
  source_ids: [S-013, S-022, S-023, S-028]
  fact_dependencies: []
  method: "Traced run_turn world-state capture and local/remote compaction reinjection helpers."
  counterevidence: "role/section typing does not itself prevent prompt injection"
  adversarial_status: SUPPORTED
- claim_id: C-016
  section: state-persistence-restart
  statement: "Codex uses canonical rollout JSONL with tail repair/migration and a lagging SQLite projection, and persists parent/child thread topology."
  classification: FACT
  confidence: HIGH
  scope: "local rollout/thread-store/agent graph source; live corruption not injected"
  source_ids: [S-012, S-016, S-024, S-025]
  fact_dependencies: []
  method: "Inspected recorder append/repair, projection offsets/ordinals, migration interfaces and graph store."
  counterevidence: "SQLite projection can lag; claim names JSONL, not SQLite, as canonical"
  adversarial_status: SUPPORTED
- claim_id: C-017
  section: state-persistence-restart
  statement: "Crash and power-loss durability of acknowledged ordinary rollout writes is unknown because static source reaches flush but no routine recorder sync_all and no interruption probe was observed."
  classification: UNKNOWN
  confidence: N/A
  scope: "ordinary local rollout recorder at cutoff; migration journal fsync paths excluded from generalization"
  source_ids: [S-024, S-025]
  fact_dependencies: []
  method: "attempted_methods=static recorder/projection/repair trace and sync_all search; blocker=target interruption and power-loss simulation were outside safe execution scope; impact=resume and evidence-loss guarantees cannot be compared as durable; available_evidence=S-024,S-025; next_probe=run fsync-aware crash injection against disposable Codex home at append/flush/projection boundaries"
  counterevidence: "migration publication uses stronger sync paths, but that does not prove routine append durability"
  adversarial_status: NOT_PROBED
- claim_id: C-018
  section: concurrency-worktree-isolation
  statement: "Codex coordinates concurrency with Tokio tasks, bounded channels, thread IDs, spawn reservations/limits and tool read/write admission, while lineage survives in a store."
  classification: FACT
  confidence: HIGH
  scope: "cutoff local source; handler-level race freedom and live scheduling excluded"
  source_ids: [S-014, S-015, S-016, S-018, S-042]
  fact_dependencies: []
  method: "Inspected limits, spawn control, graph storage, tool lock and static worktree trace."
  counterevidence: "logical coordination does not imply process or filesystem isolation"
  adversarial_status: SUPPORTED
- claim_id: C-019
  section: concurrency-worktree-isolation
  statement: "The bounded production agent-spawn slice contains no automatic git worktree creation and instead carries cwd and workspace roots into child configuration."
  classification: FACT
  confidence: HIGH
  scope: "codex-rs/core/src/agent and multi-agent handler source at cutoff; caller-created worktrees excluded"
  source_ids: [S-015, S-042]
  fact_dependencies: []
  method: "Used independent rg and git grep absence searches, then traced cwd/workspace-root handling in spawn.rs."
  counterevidence: "config detects existing Git worktrees elsewhere, but detection is not automatic creation"
  adversarial_status: SUPPORTED
- claim_id: C-020
  section: permissions-authority-sandbox
  statement: "Effective authority is modeled by approval plus filesystem/network profiles, child/request profiles are intersected, and platform sandbox backends project those policies to OS restrictions."
  classification: FACT
  confidence: HIGH
  scope: "cutoff permission/intersection/Linux backend and protocol paths; cross-platform live enforcement excluded"
  source_ids: [S-015, S-026, S-027, S-028]
  fact_dependencies: []
  method: "Inspected profile intersection, policy conversion, bubblewrap mount construction and approval/event types."
  counterevidence: "source identifies policies that legacy backends cannot enforce directly; claim does not assert complete parity"
  adversarial_status: SUPPORTED
- claim_id: C-021
  section: evidence-observability
  statement: "Codex emits correlated typed lifecycle/approval/tool/token/diff/error events to clients, rollout, projection and optional OTel sinks."
  classification: FACT
  confidence: HIGH
  scope: "cutoff event/persistence/telemetry structures; delivery and tamper resistance excluded"
  source_ids: [S-009, S-018, S-024, S-025, S-028, S-029]
  fact_dependencies: []
  method: "Mapped submission/event IDs and trace context through protocol, tool runtime, recorder, projection and telemetry."
  counterevidence: "not every transient event is necessarily persisted; sinks are distinguished"
  adversarial_status: SUPPORTED
- claim_id: C-022
  section: resource-token-cost-accounting
  statement: "Codex distinguishes exact per-response usage from accumulated/estimated tokens, records cache/reasoning/rate-limit fields and can emit backend-derived turn-cost telemetry."
  classification: FACT
  confidence: HIGH
  scope: "cutoff protocol/context/telemetry/cost-worker source; provider bill excluded"
  source_ids: [S-019, S-022, S-028, S-029, S-030]
  fact_dependencies: []
  method: "Inspected usage structs, compaction budgeting, OTel fields and cost polling worker."
  counterevidence: "cost worker is conditional and backend-derived; no universal ledger is claimed"
  adversarial_status: SUPPORTED
- claim_id: C-023
  section: resource-token-cost-accounting
  statement: "Billing reconciliation, missing or contradictory usage, retry/cache cost attribution, duplicate delivery and end-to-end idempotency are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "all configured providers and backend cost paths; no authenticated calls"
  source_ids: [S-019, S-028, S-030]
  fact_dependencies: []
  method: "attempted_methods=static usage/retry/cost-worker trace and schema inspection; blocker=no credentials, provider bill, fault-injection endpoint or authorization for paid calls; impact=cost control and duplicate-side-effect comparison remains partial; available_evidence=S-019,S-028,S-030; next_probe=use a disposable metered mock/provider to inject retries, missing usage and duplicate request IDs, then reconcile provider ledger"
  counterevidence: "exact raw response usage exists when supplied, but does not resolve missing/retried/billed cases"
  adversarial_status: NOT_PROBED
- claim_id: C-024
  section: failure-cancellation-retry
  statement: "Codex has typed failure branches, bounded provider retry/reconnect defaults, cancellation tokens through turn/tool dispatch and subprocess abort/signal paths."
  classification: FACT
  confidence: HIGH
  scope: "cutoff source; live cleanup/idempotency excluded"
  source_ids: [S-006, S-013, S-018, S-019, S-024, S-028]
  fact_dependencies: []
  method: "Traced provider retry settings, run_turn/tool cancellation, SDK child signals and persistence errors."
  counterevidence: "layered libraries/services may retry independently"
  adversarial_status: SUPPORTED
- claim_id: C-025
  section: install-update-release
  statement: "Codex release automation builds/signs/checksums multi-platform artifacts and uses OIDC trusted npm publishing with registry signatures and SLSA provenance."
  classification: FACT
  confidence: HIGH
  scope: "cutoff workflow and npm 0.149.1 metadata; reproducibility and installer execution excluded"
  source_ids: [S-005, S-031, S-032, S-033, S-034, S-035, S-039]
  fact_dependencies: []
  method: "Inspected release workflow, passive registry metadata/attestations and downloaded package bytes."
  counterevidence: "tag object itself is unsigned; npm/workflow signing is recorded separately"
  adversarial_status: CHALLENGED
- claim_id: C-026
  section: tests-qualification
  statement: "Static cutoff inventory contains 3312 Rust files, 1157 Rust files under test-named paths, 11034 line-anchored Rust test attributes and 30 workflow files, but no target tests were run for this dossier."
  classification: FACT
  confidence: HIGH
  scope: "deterministic repository inventory only; passing status and coverage excluded"
  source_ids: [S-036]
  fact_dependencies: []
  method: "Counted files/attributes/workflows with find and rg; retained exact output."
  counterevidence: "file/attribute counts do not establish runtime qualification"
  adversarial_status: SUPPORTED
- claim_id: C-027
  section: tests-qualification
  statement: "Binary reproducibility and live sandbox/runtime qualification across supported platforms, architectures and providers are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "npm/release binaries, Linux/macOS/Windows-WSL and provider matrix"
  source_ids: [S-026, S-027, S-031, S-034, S-036]
  fact_dependencies: []
  method: "attempted_methods=static workflow/test/backend/package inspection; blocker=only macOS arm64 research host, no isolated multi-platform runners, target execution or reproducible build; impact=portability and enforcement parity cannot be production-qualified; available_evidence=S-026,S-027,S-031,S-034,S-036; next_probe=rebuild pinned tag hermetically and run denial/path/cancel matrix on every advertised platform in disposable CI"
  counterevidence: "upstream tests/workflows cover platforms, but were not run or independently observed here"
  adversarial_status: NOT_PROBED
- claim_id: C-028
  section: security
  statement: "Codex statically exposes typed validation, tool-name controls, permission intersection, platform sandboxes, secret redaction types, signed provenance and a vulnerability-reporting channel across its trust boundaries."
  classification: FACT
  confidence: HIGH
  scope: "named cutoff source/package/security surfaces; no security acceptance"
  source_ids: [S-003, S-017, S-019, S-026, S-027, S-035, S-037, S-043, S-044]
  fact_dependencies: []
  method: "Mapped trust crossings and inspected controls/release/security policy."
  counterevidence: "local host shell/process and extension boundaries remain powerful; controls are not generalized beyond their paths"
  adversarial_status: CHALLENGED
- claim_id: C-029
  section: security
  statement: "Authenticated provider behavior, third-party provider/MCP compatibility and external service security are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "nonlocal providers, MCP servers and managed authentication boundaries"
  source_ids: [S-019, S-020, S-044]
  fact_dependencies: []
  method: "attempted_methods=static provider/MCP configuration and adapter inspection; blocker=no credentials, approved endpoints or authority to exercise third-party services; impact=authentication, retention, rate-limit and interoperability comparisons remain partial; available_evidence=S-019,S-020,S-044; next_probe=run contract fixtures against explicitly authorized disposable providers/MCP servers with redacted traffic capture"
  counterevidence: "config and tests document intended shapes but are not independent service observations"
  adversarial_status: NOT_PROBED
- claim_id: C-030
  section: control-data-flow
  statement: "Open source exposes a Cloud Tasks client/CLI boundary, while Codex Web and managed execution internals remain a separate remote service."
  classification: FACT
  confidence: HIGH
  scope: "README and cloud client API at cutoff; managed implementation excluded"
  source_ids: [S-038, S-039]
  fact_dependencies: []
  method: "Inspected official boundary statement, CloudBackend trait and CLI operations."
  counterevidence: "client includes create/list/apply operations but does not reveal server internals"
  adversarial_status: SUPPORTED
- claim_id: C-031
  section: strengths
  statement: "Typed thread/turn/tool lifecycles, capability-gated App Server schemas and correlated events form an inspectable local integration boundary."
  classification: INFERENCE
  confidence: HIGH
  scope: "local open runtime integration; reliability and suitability excluded"
  source_ids: [S-007, S-008, S-009, S-012, S-013, S-017, S-018, S-028, S-040, S-041]
  fact_dependencies: [C-008, C-009, C-011, C-012, C-021]
  method: "Synthesized independent static facts about lifecycle, schema and event correlation."
  counterevidence: "protocol churn and unrun compatibility tests could reduce practical inspectability"
  adversarial_status: SUPPORTED
- claim_id: C-032
  section: strengths
  statement: "Canonical append history plus repair/projection, world-state compaction and persisted lineage is a coherent resumable-thread mechanism."
  classification: INFERENCE
  confidence: HIGH
  scope: "logical restart/resume design; power-loss guarantee excluded"
  source_ids: [S-016, S-022, S-023, S-024, S-025]
  fact_dependencies: [C-015, C-016]
  method: "Related context checkpoint and persistence mechanisms through their shared thread IDs/history."
  counterevidence: "C-017 leaves acknowledged-write durability unknown"
  adversarial_status: CHALLENGED
- claim_id: C-033
  section: liabilities
  statement: "The large evolving workspace and source/package version gap impose material qualification and provenance burden on downstream integrators."
  classification: INFERENCE
  confidence: HIGH
  scope: "integrators comparing cutoff source with stable 0.149.1"
  source_ids: [S-001, S-002, S-004, S-005, S-031, S-036]
  fact_dependencies: [C-003, C-005, C-025]
  method: "Derived integration burden from measured ancestry gap, surface size and release separation."
  counterevidence: "generated schemas and release automation mitigate but do not remove version qualification"
  adversarial_status: SUPPORTED
- claim_id: C-034
  section: liabilities
  statement: "Local shell/process and extension/network APIs shift substantial authentication, isolation and audit responsibility to unattended or multi-user deployments."
  classification: INFERENCE
  confidence: HIGH
  scope: "remote-client, unattended or multi-user scenarios; local trusted-user use not rejected"
  source_ids: [S-008, S-020, S-026, S-027, S-043, S-044]
  fact_dependencies: [C-009, C-020, C-028]
  method: "Mapped powerful methods and external boundaries to enforcement ownership."
  counterevidence: "first-party clients or external containers may supply controls outside this target"
  adversarial_status: SUPPORTED
- claim_id: C-035
  section: transferable-patterns
  statement: "A typed, capability-negotiated lifecycle envelope with generated bindings is a candidate pattern for correlated asynchronous harness clients."
  classification: INFERENCE
  confidence: HIGH
  scope: "pattern evaluation only; no adoption authority"
  source_ids: [S-007, S-008, S-009, S-028, S-040, S-041]
  fact_dependencies: [C-009, C-021]
  method: "Extracted minimal protocol mechanism and prerequisites from observed App Server facts."
  counterevidence: "Codex intentionally deviates from true JSON-RPC 2.0 and needs explicit compatibility policy"
  adversarial_status: SUPPORTED
- claim_id: C-036
  section: transferable-patterns
  statement: "A read/write tool admission gate is a candidate pattern for parallel-safe tools coexisting with serial tools."
  classification: INFERENCE
  confidence: HIGH
  scope: "pattern evaluation; depends on accurate handler declarations"
  source_ids: [S-017, S-018]
  fact_dependencies: [C-012, C-018]
  method: "Abstracted the step-scoped RwLock mechanism and cancellation/call-ID prerequisites."
  counterevidence: "handler-internal shared state can still race"
  adversarial_status: SUPPORTED
- claim_id: C-037
  section: transferable-patterns
  statement: "Fail-narrow intersection of materialized parent and requested authority is a candidate child-agent permission pattern."
  classification: INFERENCE
  confidence: HIGH
  scope: "pattern evaluation; platform enforcement parity required"
  source_ids: [S-015, S-026]
  fact_dependencies: [C-020]
  method: "Abstracted monotone authority rule from agent spawn and permission-profile intersection."
  counterevidence: "source identifies profiles that cannot be safely intersected and must error"
  adversarial_status: SUPPORTED
- claim_id: C-038
  section: rejected-patterns-curiosity-no-go
  statement: "Direct host shell/process RPC is CURIOSITY_NO_GO for autonomous or multi-tenant transfer without an independently qualified execution boundary."
  classification: INFERENCE
  confidence: HIGH
  scope: "direct pattern transfer; not trusted local Codex operation"
  source_ids: [S-008, S-020, S-026, S-027]
  fact_dependencies: [C-009, C-020, C-028]
  method: "Compared method authority with required authentication/sandbox/cancellation/audit boundaries."
  counterevidence: "Codex runtime policies can constrain agent tools, but local RPC client trust remains scenario-specific"
  adversarial_status: SUPPORTED
- claim_id: C-039
  section: rejected-patterns-curiosity-no-go
  statement: "Treating thread or subagent identity as automatic worktree isolation is CURIOSITY_NO_GO."
  classification: INFERENCE
  confidence: HIGH
  scope: "cutoff production agent-spawn mechanism"
  source_ids: [S-015, S-042]
  fact_dependencies: [C-019]
  method: "Applied bounded absence and direct cwd/root trace to filesystem-isolation assumption."
  counterevidence: "callers may start Codex inside independently created worktrees"
  adversarial_status: SUPPORTED
- claim_id: C-040
  section: rejected-patterns-curiosity-no-go
  statement: "Treating npm 0.149.1 behavior as equivalent to cutoff commit 4ef1d4b is CURIOSITY_NO_GO."
  classification: INFERENCE
  confidence: HIGH
  scope: "cross-boundary source/artifact attribution"
  source_ids: [S-001, S-002, S-035]
  fact_dependencies: [C-001, C-002, C-003]
  method: "Compared immutable source and provenance commits and measured ancestry gap."
  counterevidence: "some files may be unchanged, but equivalence requires file/behavior-specific proof"
  adversarial_status: SUPPORTED
- claim_id: C-041
  section: adversarial-probes
  statement: "Live startup, denial bypass, malformed/oversized input, injection, filesystem collision/escape, cancellation cleanup and evidence forgery behavior is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "CLI/core/App Server runtime and all advertised platforms; exploit attempts excluded"
  source_ids: [S-005, S-009, S-013, S-017, S-018, S-026, S-027, S-028, S-039]
  fact_dependencies: []
  method: "attempted_methods=static entrypoint/schema/router/permission/cancellation/event trace and bounded absence searches; blocker=no disposable multi-platform target-execution authorization and no safe exploit/fault-injection environment; impact=runtime security, cleanup, isolation and evidence claims cannot be accepted; available_evidence=S-005,S-009,S-013,S-017,S-018,S-026,S-027,S-028,S-039; next_probe=run P-01 through P-14 in a disposable no-secret sandbox with denied network, mock providers and syscall/filesystem observation"
  counterevidence: "extensive upstream source tests exist, but no target tests or production path were observed here"
  adversarial_status: NOT_PROBED
- claim_id: C-042
  section: rejected-patterns-curiosity-no-go
  statement: "Inferring managed Codex Cloud internals from the open client boundary is CURIOSITY_NO_GO."
  classification: INFERENCE
  confidence: HIGH
  scope: "managed scheduler/executor/sandbox/tenant internals"
  source_ids: [S-038, S-039]
  fact_dependencies: [C-030]
  method: "Compared documented remote boundary with evidence required for internal runtime claims."
  counterevidence: "client types reveal operations and payloads, not server enforcement"
  adversarial_status: SUPPORTED
- claim_id: C-043
  section: transferable-patterns
  statement: "Canonical append history with a rebuildable ordered query projection is a conditional transferable persistence pattern."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "pattern evaluation; acknowledged-write durability must be strengthened or proven"
  source_ids: [S-016, S-024, S-025]
  fact_dependencies: [C-016]
  method: "Abstracted JSONL/projection/repair roles and conditioned transfer on C-017."
  counterevidence: "projection complexity, migration and ordinary flush durability add operational risk"
  adversarial_status: CHALLENGED
```

## 27. Source ledger {#source-ledger}

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Pinned repository identity and clean state"
  url: "https://github.com/openai/codex/tree/4ef1d4b89bd419c976b04fefa0fd36844e898340"
  commit_or_ref: "origin/main"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-identity"
  symbol: "Git HEAD/status/submodules"
  line_anchor: "N/A:no-line-anchor"
  command: "git show -s --format='sha=%H%nauthor=%aI%ncommitter=%cI%nsubject=%s' HEAD && git status --porcelain=v1 && test ! -f .gitmodules && git rev-list --count ff29a44391deccde0aba0f8390337d7f3c319ea4..HEAD"
  command_environment: "macOS arm64; git; detached blob-filtered clone; static only; no target execution"
  output_or_hash: "inline:sha=4ef1d4b89bd419c976b04fefa0fd36844e898340; author=2026-08-24T23:22:22Z; committer=2026-08-24T23:29:10Z; status=clean; no .gitmodules; commits_since_0.149.1=187"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-003, C-033, C-040]
  notes: "Primary immutable identity; selected over mutable branch pages."
- source_id: S-002
  source_kind: release-metadata
  title: "Annotated rust-v0.149.1 tag"
  url: "https://github.com/openai/codex/tree/ff29a44391deccde0aba0f8390337d7f3c319ea4"
  commit_or_ref: "rust-v0.149.1"
  resolved_commit: "ff29a44391deccde0aba0f8390337d7f3c319ea4"
  package_identity: "@openai/codex@0.149.1+sha512-6q5pbcpFbJbqOpkubSDBwXmktQ55aD8eUzGzBF1zASob2DjwhBKDSNGtdZKalfrNJUdTDTPDMmzCXEXs5tMBYA=="
  code_path: "N/A:Git-tag-object"
  symbol: "refs/tags/rust-v0.149.1"
  line_anchor: "N/A:no-line-anchor"
  command: "git cat-file -p refs/tags/rust-v0.149.1 && git verify-tag refs/tags/rust-v0.149.1"
  command_environment: "macOS arm64; git; clean pinned clone; no target execution"
  output_or_hash: "inline:tag_object=980a6d12110b110d29ec13bdcbe14011100b3566; commit=ff29a44391deccde0aba0f8390337d7f3c319ea4; message=Release 0.149.1; verify-tag=no-signature"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-025, C-033, C-040]
  notes: "Primary Git release identity; unsigned tag is preserved as counterevidence."
- source_id: S-003
  source_kind: license
  title: "Apache License 2.0 text"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/LICENSE"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE"
  symbol: "Apache License Version 2.0"
  line_anchor: "L1-L202"
  command: "shasum -a 256 LICENSE && sed -n '1,202p' LICENSE"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:d17f227e4df5da1600391338865ce0f3055211760a36688f816941d58232d8dc"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-028]
  notes: "Actual license text is preferred to metadata alone."
- source_id: S-004
  source_kind: repository-file
  title: "Rust workspace manifest"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/Cargo.toml"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/Cargo.toml"
  symbol: "workspace.members/workspace.dependencies/workspace.package.license"
  line_anchor: "L1-L143"
  command: "sed -n '1,240p' codex-rs/Cargo.toml && shasum -a 256 codex-rs/Cargo.toml"
  command_environment: "macOS arm64; clean pinned clone; static read; Cargo not executed"
  output_or_hash: "sha256:d0a4ca0417ab95f3b581b7e4682085dec52d5c3ae07cfa0003cc8ffcb1750506"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005, C-033]
  notes: "Primary package map; manifest presence is not universal runtime reachability."
- source_id: S-005
  source_kind: repository-file
  title: "Codex multitool CLI composition"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/cli/src/main.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/cli/src/main.rs"
  symbol: "MultitoolCli/Subcommand/AppServerCommand"
  line_anchor: "L110-L230,L547-L596,L680-L765"
  command: "git show HEAD:codex-rs/cli/src/main.rs | sed -n '110,230p;547,596p;680,765p'"
  command_environment: "macOS arm64; git; clean pinned clone; static read"
  output_or_hash: "sha256:0e6db09fad1d9cac1de893820312097fd1066d030c975656c1b10565cdba485a"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-006, C-025, C-033, C-041]
  notes: "Composition-root source; platform/experimental annotations retained."
- source_id: S-006
  source_kind: repository-file
  title: "TypeScript SDK exec adapter"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/sdk/typescript/src/exec.ts"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:source-SDK-not-inspected-as-package"
  code_path: "sdk/typescript/src/exec.ts"
  symbol: "CodexExec.run"
  line_anchor: "L65-L242"
  command: "git show HEAD:sdk/typescript/src/exec.ts | sed -n '65,242p'"
  command_environment: "macOS arm64; clean pinned clone; static read; Node/SDK not executed"
  output_or_hash: "sha256:cac7c2ef4f834bc1cdca133d3950f229451460d9c495eb017dd931c63eaacc79"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-024]
  notes: "Primary integration seam; tests do not substitute for execution."
- source_id: S-007
  source_kind: repository-file
  title: "App Server RPC envelope"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/app-server-protocol/src/rpc.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/app-server-protocol/src/rpc.rs"
  symbol: "JSONRPCMessage/JSONRPCRequest/JSONRPCResponse/JSONRPCError"
  line_anchor: "L1-L88"
  command: "git show HEAD:codex-rs/app-server-protocol/src/rpc.rs | sed -n '1,100p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:78c516097c55b665e375807be6dcdceba232805c9ae9fa48420b0a537f0df705"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-031, C-035]
  notes: "Source explicitly says jsonrpc 2.0 field is neither sent nor expected."
- source_id: S-008
  source_kind: repository-file
  title: "App Server method catalog and experimental methods"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/app-server-protocol/src/protocol/common.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/app-server-protocol/src/protocol/common.rs"
  symbol: "ClientRequest method definitions"
  line_anchor: "L497-L662,L1281-L1303"
  command: "git show HEAD:codex-rs/app-server-protocol/src/protocol/common.rs | sed -n '497,662p;1281,1303p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:c1b459fd35b7a35535831025bef3d5b17d1582530429126d396db2cee338ad40"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-012, C-028, C-031, C-034, C-035, C-038]
  notes: "Includes stable thread/shellCommand and experimental process/spawn family."
- source_id: S-009
  source_kind: repository-file
  title: "App Server initialization and experimental gate"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/app-server/src/message_processor.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/app-server/src/message_processor.rs"
  symbol: "handle_client_request/dispatch_initialized_client_request"
  line_anchor: "L835-L910"
  command: "git show HEAD:codex-rs/app-server/src/message_processor.rs | sed -n '835,910p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:ca5c580a6c743412f269070ea365be30e308caa0057f2d4bd9b264baf3fb6ef5"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-021, C-031, C-035, C-041]
  notes: "Exact diagnostics include Not initialized and requires experimentalApi capability."
- source_id: S-010
  source_kind: repository-file
  title: "App Server transport channel bound"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/app-server-transport/src/transport/mod.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/app-server-transport/src/transport/mod.rs"
  symbol: "CHANNEL_CAPACITY"
  line_anchor: "L25"
  command: "git show HEAD:codex-rs/app-server-transport/src/transport/mod.rs | sed -n '1,45p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:62a3acdb675a7d36625d40665e25ada29052900eac6265a6616ac526355eb503"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-018]
  notes: "General transport channel capacity is 128."
- source_id: S-011
  source_kind: repository-file
  title: "App Server WebSocket outbound bound"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/app-server-transport/src/transport/websocket.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/app-server-transport/src/transport/websocket.rs"
  symbol: "WEBSOCKET_OUTBOUND_CHANNEL_CAPACITY"
  line_anchor: "L48-L49,L183-L199"
  command: "git show HEAD:codex-rs/app-server-transport/src/transport/websocket.rs | sed -n '40,55p;175,205p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:f6fa7047f1f75304c96c56d204df98b134e2fe4a7fd8271b55902d9eb6d4194c"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-018]
  notes: "WebSocket outbound capacity is 32*1024; runtime pressure not probed."
- source_id: S-012
  source_kind: repository-file
  title: "ThreadManager lifecycle"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/core/src/thread_manager.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/core/src/thread_manager.rs"
  symbol: "ThreadManager/start_thread/resume_thread_from_rollout/fork_thread"
  line_anchor: "L216-L256,L906-L1014,L1206-L1264"
  command: "git show HEAD:codex-rs/core/src/thread_manager.rs | sed -n '216,256p;906,1014p;1206,1264p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:36ad0806b9e1327f75ede9698bc366c11a2310f26c397026ffec1302ff27594b"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-011, C-016, C-031]
  notes: "Primary thread composition/lifecycle source."
- source_id: S-013
  source_kind: repository-file
  title: "Turn orchestration"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/core/src/session/turn.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/core/src/session/turn.rs"
  symbol: "run_turn"
  line_anchor: "L145-L270"
  command: "git show HEAD:codex-rs/core/src/session/turn.rs | sed -n '145,270p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:da46a849855bff5d46eaa02321429a893d182712d87f51515e4924081f97c8a2"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-015, C-024, C-031, C-041]
  notes: "Representative static turn slice; no provider/model output executed."
- source_id: S-014
  source_kind: repository-file
  title: "Agent limits and workspace configuration"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/core/src/config/mod.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/core/src/config/mod.rs"
  symbol: "DEFAULT_AGENT_MAX_THREADS/DEFAULT_AGENT_MAX_DEPTH/effective_workspace_roots"
  line_anchor: "L226-L236,L1537-L1575,L3742-L3757"
  command: "git show HEAD:codex-rs/core/src/config/mod.rs | sed -n '220,240p;1537,1575p;3742,3757p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:5fc5b1ee61999cda60742e8a265db6a2a1d6c6197ab13aeefc1dbdd561308593"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-018]
  notes: "Defaults are version/config dependent; no hard universal limit is inferred."
- source_id: S-015
  source_kind: repository-file
  title: "Subagent spawn ownership and authority"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/core/src/agent/control/spawn.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/core/src/agent/control/spawn.rs"
  symbol: "spawn_agent_internal/prepare_thread_spawn/resume_agent_from_rollout"
  line_anchor: "L380-L520,L581-L740,L1067-L1135"
  command: "git show HEAD:codex-rs/core/src/agent/control/spawn.rs | sed -n '380,520p;581,740p;1067,1135p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:f6f2eb19356e696230d2586057de1d6a7574667a17ab7a950763b5614a06f273"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-018, C-019, C-020, C-037, C-039]
  notes: "Direct spawn trace; caller-managed environments/worktrees remain outside."
- source_id: S-016
  source_kind: repository-file
  title: "Persisted agent graph interface"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/agent-graph-store/src/store.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/agent-graph-store/src/store.rs"
  symbol: "AgentGraphStore"
  line_anchor: "L13-L59"
  command: "git show HEAD:codex-rs/agent-graph-store/src/store.rs | sed -n '1,80p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:648ff983749a4f7f3c17c64795e765055f90aa45eda36c5e2a472617ef10633e"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-016, C-018, C-032, C-043]
  notes: "Storage-neutral contract; local implementation projects to state DB."
- source_id: S-017
  source_kind: repository-file
  title: "Tool registry collision and reservation behavior"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/core/src/tools/registry.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/core/src/tools/registry.rs"
  symbol: "ToolRegistry/register_trusted/register_external"
  line_anchor: "L264-L390"
  command: "git show HEAD:codex-rs/core/src/tools/registry.rs | sed -n '260,390p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:c1d108f40896dcbd92be553268b7163cd6e757b987b803d805ad87046f0ed995"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-010, C-012, C-028, C-031, C-036, C-041]
  notes: "Reserved names are bounded to default exec_command/shell_command."
- source_id: S-018
  source_kind: repository-file
  title: "Tool parallel admission and cancellation"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/core/src/tools/parallel.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/core/src/tools/parallel.rs"
  symbol: "ToolCallRuntime.handle_tool_call_with_source"
  line_anchor: "L40-L180"
  command: "git show HEAD:codex-rs/core/src/tools/parallel.rs | sed -n '40,210p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:48380e25abaf9c52e7a5de9cecf82cc4ddb84197683f73a11719de3b78c90e5a"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-012, C-018, C-021, C-024, C-031, C-036, C-041]
  notes: "Static mechanism does not prove handler-internal race freedom."
- source_id: S-019
  source_kind: repository-file
  title: "Provider contract and retry defaults"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/model-provider-info/src/lib.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/model-provider-info/src/lib.rs"
  symbol: "WireApi/ModelProviderInfo/merge_configured_model_providers"
  line_anchor: "L27-L151,L357-L420,L536-L623"
  command: "git show HEAD:codex-rs/model-provider-info/src/lib.rs | sed -n '27,151p;357,420p;536,623p'"
  command_environment: "macOS arm64; clean pinned clone; static read; no provider calls"
  output_or_hash: "sha256:2168b93576dff1d336f0c3d390b6ff8c38376340fc8ed2eea8da9857ddb1eeb7"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-013, C-014, C-022, C-023, C-024, C-028, C-029]
  notes: "Primary configurable provider boundary; external behavior unobserved."
- source_id: S-020
  source_kind: repository-file
  title: "Model catalog manager and cache fallback"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/models-manager/src/manager.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/models-manager/src/manager.rs"
  symbol: "ModelsManager/OpenAiModelsManager/RefreshStrategy"
  line_anchor: "L29-L110,L216-L268,L374-L515"
  command: "git show HEAD:codex-rs/models-manager/src/manager.rs | sed -n '29,110p;216,268p;374,515p'"
  command_environment: "macOS arm64; clean pinned clone; static read; no network"
  output_or_hash: "sha256:00a120284c6b1c6549fa39ae938a72cb6cfd40f683878fabdcc22f9216799f9c"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-014, C-029, C-034, C-038]
  notes: "Cache TODO about provider identity is retained as a limitation."
- source_id: S-021
  source_kind: repository-file
  title: "Unknown-model fallback descriptor"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/models-manager/src/model_info.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/models-manager/src/model_info.rs"
  symbol: "model_info_from_slug"
  line_anchor: "L139-L176"
  command: "git show HEAD:codex-rs/models-manager/src/model_info.rs | sed -n '139,185p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:28a38e487610a7a6710f5ebd4293f99cd2fba22abbc4ee6dc0cc07a42eb89021"
  access_date: "2026-08-24"
  supports_claims: [C-014]
  notes: "Fallback values are source defaults, not provider-negotiated facts."
- source_id: S-022
  source_kind: repository-file
  title: "Compaction and context reinjection"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/core/src/compact.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/core/src/compact.rs"
  symbol: "InitialContextInjection/build_compaction_initial_context/insert_initial_context_before_last_real_user_or_summary"
  line_anchor: "L64-L105,L581-L680"
  command: "git show HEAD:codex-rs/core/src/compact.rs | sed -n '64,105p;581,680p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:3234aa6812a5edce8ae3465a818d9a46c732e7a77907171ca8eaa5c59b369a52"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-015, C-022, C-032]
  notes: "Compaction intent/structure only; semantic preservation unmeasured."
- source_id: S-023
  source_kind: repository-file
  title: "Sectioned world-state snapshots and diffs"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/core/src/context/world_state/mod.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/core/src/context/world_state/mod.rs"
  symbol: "WorldState/WorldStateSnapshot/render_diff"
  line_anchor: "L285-L468"
  command: "git show HEAD:codex-rs/core/src/context/world_state/mod.rs | sed -n '285,468p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:ee1ea8b90a6d8f3f07bf82fc00c4c2ccdbbbb3eba8203c1dfc77e55de719534a"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-032]
  notes: "Extension contributions are included; model authority separation is not inferred."
- source_id: S-024
  source_kind: repository-file
  title: "Rollout recorder flush and tail repair"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/rollout/src/recorder.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/rollout/src/recorder.rs"
  symbol: "RolloutRecorder/RecorderState.flush/persist_items"
  line_anchor: "L992-L1000,L1655-L1784"
  command: "git show HEAD:codex-rs/rollout/src/recorder.rs | sed -n '980,1010p;1655,1790p' && rg -n 'sync_all|writer.file.flush' codex-rs/rollout/src/recorder.rs"
  command_environment: "macOS arm64; clean pinned clone; static read; no write/crash probe"
  output_or_hash: "sha256:0e201df879122f55ae536b307667471cc2746d05c5488206d3b167dddd0b42fd"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-016, C-017, C-021, C-024, C-032, C-041, C-043]
  notes: "Routine recorder reaches writer.file.flush().await; sync_all hits elsewhere are not generalized."
- source_id: S-025
  source_kind: repository-file
  title: "Durable rollout to SQLite projection"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/thread-store/src/local/thread_history_materialization.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/thread-store/src/local/thread_history_materialization.rs"
  symbol: "materialize_to_sqlite/materialize_rollout_append"
  line_anchor: "L18-L260"
  command: "git show HEAD:codex-rs/thread-store/src/local/thread_history_materialization.rs | sed -n '18,260p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:4904377c3fe8459985839848c1dbeb5601429b10acc4f6cda0eacf5d6722d586"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-017, C-021, C-032, C-043]
  notes: "Source states projection can lag JSONL after failure but cannot get ahead."
- source_id: S-026
  source_kind: repository-file
  title: "Permission-profile intersection"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/protocol/src/permission_profile_intersection.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/protocol/src/permission_profile_intersection.rs"
  symbol: "intersect_effective_permission_profiles"
  line_anchor: "L20-L112,L158-L269"
  command: "git show HEAD:codex-rs/protocol/src/permission_profile_intersection.rs | sed -n '20,112p;158,269p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:b30e2c959f3810555aa82a030524eb4031f25ed67d493b5093cd1196f270e935"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-027, C-028, C-034, C-037, C-038, C-041]
  notes: "Intersection explicitly errors when safe combination is unavailable."
- source_id: S-027
  source_kind: repository-file
  title: "Linux bubblewrap sandbox policy projection"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/linux-sandbox/src/bwrap.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/linux-sandbox/src/bwrap.rs"
  symbol: "create_bwrap_command/build policy mount arguments"
  line_anchor: "L382-L570"
  command: "git show HEAD:codex-rs/linux-sandbox/src/bwrap.rs | sed -n '382,570p'"
  command_environment: "macOS arm64; clean pinned clone; static cross-platform read; Linux binary not run"
  output_or_hash: "sha256:bfce8aa44048b2441a7c02b301fe7366ae1b8b9ddd8ff8518711cd874a9e749e"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-027, C-028, C-034, C-038, C-041]
  notes: "Platform-specific source; not evidence of this macOS host's runtime enforcement."
- source_id: S-028
  source_kind: repository-file
  title: "Submission/event and token usage protocol"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/protocol/src/protocol.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/protocol/src/protocol.rs"
  symbol: "Submission/Event/EventMsg/RawResponseCompletedEvent/TokenUsage"
  line_anchor: "L188-L209,L1276-L1505,L1843-L1850,L2035-L2170,L2243-L2332"
  command: "git show HEAD:codex-rs/protocol/src/protocol.rs | sed -n '188,209p;1276,1505p;1843,1850p;2035,2170p;2243,2332p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:d4ec22a03fc98822741f3daa729abb8f063f758949b5288d6f13e52ec5475fe1"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-012, C-014, C-020, C-021, C-022, C-023, C-024, C-028, C-031, C-035, C-041]
  notes: "Exact upstream usage is distinguished in source from accumulated/estimated events."
- source_id: S-029
  source_kind: repository-file
  title: "Session OTel usage and cost telemetry"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/otel/src/events/session_telemetry.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/otel/src/events/session_telemetry.rs"
  symbol: "SessionTelemetry.record_turn_cost/record_responses"
  line_anchor: "L93-L130,L277-L328,L517-L552"
  command: "git show HEAD:codex-rs/otel/src/events/session_telemetry.rs | sed -n '93,130p;277,328p;517,552p'"
  command_environment: "macOS arm64; clean pinned clone; static read; no exporter"
  output_or_hash: "sha256:4377d7b8c2f33541f7465cc0194750fd84f160b88b0bcb7114a99afd984ae6c8"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-022, C-041]
  notes: "Telemetry schema is not proof of export delivery or redaction completeness."
- source_id: S-030
  source_kind: repository-file
  title: "App Server turn-cost worker"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/app-server/src/turn_cost_worker.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/app-server/src/turn_cost_worker.rs"
  symbol: "TurnCostWorker/query_turn_costs/process_api_key_cost"
  line_anchor: "L98-L120,L162-L182,L353-L493"
  command: "git show HEAD:codex-rs/app-server/src/turn_cost_worker.rs | sed -n '98,120p;162,182p;353,493p'"
  command_environment: "macOS arm64; clean pinned clone; static read; no backend query"
  output_or_hash: "sha256:072a4c77c4705cd09e06e904912dc4ef5112c95efd33373f311902c5891f4874"
  access_date: "2026-08-24"
  supports_claims: [C-022, C-023]
  notes: "Conditional backend-priced API-key cost path; not a universal provider ledger."
- source_id: S-031
  source_kind: repository-file
  title: "Rust and npm release workflow"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/.github/workflows/rust-release.yml"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:workflow-not-package"
  code_path: ".github/workflows/rust-release.yml"
  symbol: "build/sign/release/publish-npm jobs"
  line_anchor: "L1-L15,L69-L77,L327-L380,L481-L668,L1186-L1279,L1414-L1574"
  command: "git show HEAD:.github/workflows/rust-release.yml | sed -n '1,15p;69,77p;327,380p;481,668p;1186,1279p;1414,1574p'"
  command_environment: "macOS arm64; clean pinned clone; static workflow read; Actions not run"
  output_or_hash: "sha256:8c617e18825d43d29d59af75419d9e7b40594256d3225c0cf39b7abde745a6c9"
  access_date: "2026-08-24"
  supports_claims: [C-025, C-027, C-033]
  notes: "Workflow intent is triangulated with registry attestations; presence alone is not a successful run."
- source_id: S-032
  source_kind: release-metadata
  title: "Exact npm wrapper metadata"
  url: "https://registry.npmjs.org/@openai%2fcodex/0.149.1"
  commit_or_ref: "0.149.1"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@openai/codex@0.149.1+sha512-6q5pbcpFbJbqOpkubSDBwXmktQ55aD8eUzGzBF1zASob2DjwhBKDSNGtdZKalfrNJUdTDTPDMmzCXEXs5tMBYA=="
  code_path: "package.json registry document"
  symbol: "dist/optionalDependencies/_npmUser/engines/license"
  line_anchor: "JSON pointers /dist,/optionalDependencies,/_npmUser,/engines,/license"
  command: "curl -fsSL 'https://registry.npmjs.org/@openai%2fcodex/0.149.1'"
  command_environment: "passive HTTPS GET; no auth; no scripts; UTC"
  output_or_hash: "inline:version=0.149.1; integrity=sha512-6q5pbcpFbJbqOpkubSDBwXmktQ55aD8eUzGzBF1zASob2DjwhBKDSNGtdZKalfrNJUdTDTPDMmzCXEXs5tMBYA==; signatures=2; trustedPublisher=github; optionalPlatformPackages=6; node>=16; license=Apache-2.0"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-004, C-025]
  notes: "Exact version endpoint is preferred to mutable npm search/tag text."
- source_id: S-033
  source_kind: package-artifact
  title: "Downloaded npm wrapper and launcher"
  url: "https://registry.npmjs.org/@openai/codex/-/codex-0.149.1.tgz"
  commit_or_ref: "0.149.1"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@openai/codex@0.149.1+sha512-6q5pbcpFbJbqOpkubSDBwXmktQ55aD8eUzGzBF1zASob2DjwhBKDSNGtdZKalfrNJUdTDTPDMmzCXEXs5tMBYA=="
  code_path: "package/bin/codex.js"
  symbol: "PLATFORM_PACKAGE_BY_TARGET/findCodexExecutable/signal forwarding"
  line_anchor: "L16-L23,L79-L116,L179-L248"
  command: "curl -fsSLo codex-0.149.1.tgz 'https://registry.npmjs.org/@openai/codex/-/codex-0.149.1.tgz' && shasum -a 256 codex-0.149.1.tgz && tar -xOf codex-0.149.1.tgz package/bin/codex.js | shasum -a 256"
  command_environment: "macOS arm64; passive download; package scripts and binary not run"
  output_or_hash: "sha256:1616304fd7883b46d8887cf336496e2ae0cdf9a637b7bdf8824baa98c22c5b7b"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-004, C-025]
  notes: "Launcher SHA-256 is 134063e133f0b4244fa3b251acf973d4fe4b4aeeacbdc135211bf480f59f1477; retained artifact is in approved research temp storage."
- source_id: S-034
  source_kind: package-artifact
  title: "Darwin ARM64 platform package metadata and bytes"
  url: "https://registry.npmjs.org/@openai/codex/-/codex-0.149.1-darwin-arm64.tgz"
  commit_or_ref: "0.149.1-darwin-arm64"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@openai/codex@0.149.1-darwin-arm64+sha512-6X84kTCbnTgPIJ2EdcPsrvwS0Wxsqpa+bCswGmRf4BjhcQ5nPMnBC6yCAaCMj+vrbXQHj+L6sa9FaR4QkmA1qw=="
  code_path: "platform package tarball"
  symbol: "dist integrity/signatures/attestations"
  line_anchor: "N/A:binary-package"
  command: "curl -fsSLo codex-0.149.1-darwin-arm64.tgz 'https://registry.npmjs.org/@openai/codex/-/codex-0.149.1-darwin-arm64.tgz' && shasum -a 256 codex-0.149.1-darwin-arm64.tgz"
  command_environment: "macOS arm64; passive download; binary not executed"
  output_or_hash: "sha256:151f8b96af0529c1267e7438d2cbc6d26213922fa017b96540abaf5f07d792d2"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-025, C-027]
  notes: "One of six platforms only; no live compatibility inference."
- source_id: S-035
  source_kind: release-metadata
  title: "npm publish and SLSA attestations"
  url: "https://registry.npmjs.org/-/npm/v1/attestations/@openai%2fcodex@0.149.1"
  commit_or_ref: "0.149.1"
  resolved_commit: "ff29a44391deccde0aba0f8390337d7f3c319ea4"
  package_identity: "@openai/codex@0.149.1+sha512-6q5pbcpFbJbqOpkubSDBwXmktQ55aD8eUzGzBF1zASob2DjwhBKDSNGtdZKalfrNJUdTDTPDMmzCXEXs5tMBYA=="
  code_path: "attestation DSSE envelopes"
  symbol: "publish/v0.1 and slsa.dev/provenance/v1 predicates"
  line_anchor: "JSON pointer /attestations"
  command: "curl -fsSL 'https://registry.npmjs.org/-/npm/v1/attestations/@openai%2fcodex@0.149.1'"
  command_environment: "passive HTTPS GET; no auth; UTC"
  output_or_hash: "inline:attestations=2; predicates=npm-publish-v0.1,SLSA-provenance-v1; subject_sha512=eaae696dca456c96ea3a992e6d20c1c179a4b50e79683f1e5331b3045d73012a1bd838f084128348d1ad75929a95facd2547530d33c3326cc25c45ece6d30160; gitCommit=ff29a44391deccde0aba0f8390337d7f3c319ea4; workflow=rust-release.yml"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-025, C-028, C-040]
  notes: "Primary provenance; vendor claim is not treated as independent runtime measurement."
- source_id: S-036
  source_kind: runtime-observation
  title: "Static test/workflow/package inventory"
  url: "https://github.com/openai/codex/tree/4ef1d4b89bd419c976b04fefa0fd36844e898340"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs and .github/workflows"
  symbol: "static inventory"
  line_anchor: "N/A:multi-file-count"
  command: "find codex-rs -type f -name '*.rs' | wc -l; find codex-rs -type f -path '*test*' -name '*.rs' | wc -l; rg -n '^#\\[(tokio::)?test' codex-rs -g '*.rs' | wc -l; find .github/workflows -type f | wc -l; git ls-tree -r --name-only HEAD | rg '^codex-rs/.+/Cargo.toml$' | wc -l"
  command_environment: "macOS arm64; find/rg/git; clean pinned clone; static only; tests not run"
  output_or_hash: "inline:rust_files=3312; test_path_rust_files=1157; line_anchored_test_attributes=11034; workflow_files=30; cargo_manifests=142"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-026, C-027, C-033]
  notes: "Negative result retained: no target test command was executed. Counts are inventory, not coverage."
- source_id: S-037
  source_kind: security-advisory
  title: "Codex security reporting policy"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/SECURITY.md"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "SECURITY.md"
  symbol: "Reporting Security Issues/How to operate CODEX safely"
  line_anchor: "L1-L17"
  command: "git show HEAD:SECURITY.md | sed -n '1,80p'"
  command_environment: "macOS arm64; clean pinned clone; static read"
  output_or_hash: "sha256:a71f3645c5438400bf803a210cae829a07b5319ac1babe289badad7d1091af3a"
  access_date: "2026-08-24"
  supports_claims: [C-028]
  notes: "Policy proves reporting route, not absence/presence of vulnerabilities."
- source_id: S-038
  source_kind: repository-file
  title: "Cloud Tasks client boundary"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/cloud-tasks-client/src/api.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/cloud-tasks-client/src/api.rs"
  symbol: "CloudBackend"
  line_anchor: "L12-L175"
  command: "git show HEAD:codex-rs/cloud-tasks-client/src/api.rs | sed -n '1,190p'"
  command_environment: "macOS arm64; clean pinned clone; static read; no cloud calls"
  output_or_hash: "sha256:3e7b5ca210975e1adc00156fa9c45232fe6272bc42cbebd102e21cba0aa991c9"
  access_date: "2026-08-24"
  supports_claims: [C-030, C-042]
  notes: "Client trait establishes boundary only; server internals remain excluded."
- source_id: S-039
  source_kind: official-documentation
  title: "Official README install and Codex Web boundary"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/README.md"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "README.md"
  symbol: "Codex Web boundary/Installation"
  line_anchor: "L6-L70"
  command: "git show HEAD:README.md | sed -n '1,80p'"
  command_environment: "macOS arm64; clean pinned clone; static read; installers not run"
  output_or_hash: "sha256:ba4e1f69ff48386e72a9c5e1edaf76aad64a475c2d51af79ccba6d1128261ba7"
  access_date: "2026-08-24"
  supports_claims: [C-025, C-030, C-041, C-042]
  notes: "Official documentation is used for supported boundary/install intent, not executable behavior."
- source_id: S-040
  source_kind: runtime-observation
  title: "Full stable App Server schema hash"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/app-server-protocol/schema/json/codex_app_server_protocol.schemas.json"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/app-server-protocol/schema/json/codex_app_server_protocol.schemas.json"
  symbol: "generated full stable schema bundle"
  line_anchor: "JSON schema root"
  command: "shasum -a 256 codex-rs/app-server-protocol/schema/json/codex_app_server_protocol.schemas.json"
  command_environment: "macOS arm64; clean pinned clone; static hash"
  output_or_hash: "sha256:7fb9101aae7868c60adcd5080d241e859e98cb61aeff40ace6721cd4b1948254"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-031, C-035, C-041]
  notes: "Generated source artifact; hash anchors exact bytes, not runtime conformance."
- source_id: S-041
  source_kind: runtime-observation
  title: "App Server v2 schema hash"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/app-server-protocol/schema/json/codex_app_server_protocol.v2.schemas.json"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/app-server-protocol/schema/json/codex_app_server_protocol.v2.schemas.json"
  symbol: "generated v2 schema bundle"
  line_anchor: "JSON schema root"
  command: "shasum -a 256 codex-rs/app-server-protocol/schema/json/codex_app_server_protocol.v2.schemas.json"
  command_environment: "macOS arm64; clean pinned clone; static hash"
  output_or_hash: "sha256:5fceb830eea600484aad5e45df10732bc004715fcb56c4d3d847dfa15c4d525b"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-031, C-035]
  notes: "Generated v2 schema retained separately from full bundle."
- source_id: S-042
  source_kind: runtime-observation
  title: "Bounded automatic-worktree absence challenge"
  url: "https://github.com/openai/codex/tree/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/core/src/agent"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/core/src/agent and codex-rs/core/src/tools/handlers/multi_agents.rs"
  symbol: "agent spawn production universe"
  line_anchor: "spawn.rs L380-L520"
  command: "rg -n 'git[[:space:]]+worktree|worktree[[:space:]]+add|Command::new\\(\"git\"\\).*worktree' codex-rs/core/src/agent codex-rs/core/src/tools/handlers/multi_agents.rs; git grep -n -E 'git[[:space:]]+worktree|worktree[[:space:]]+add' -- codex-rs/core/src/agent codex-rs/core/src/tools/handlers/multi_agents.rs; sed -n '380,520p' codex-rs/core/src/agent/control/spawn.rs | grep -n -E 'runtime_cwd|config.cwd|workspace_roots|intersect_effective_permission_profiles'"
  command_environment: "macOS arm64; rg/git/grep; clean pinned clone; deterministic static search"
  output_or_hash: "inline:method_A_rg_exit=1 no matches; method_B_git_grep_exit=1 no matches; direct trace hits runtime_cwd, config.cwd, workspace_roots and intersect_effective_permission_profiles"
  access_date: "2026-08-24"
  supports_claims: [C-018, C-019, C-039]
  notes: "Negative result is limited to named production universe; existing caller worktrees are not denied."
- source_id: S-043
  source_kind: repository-file
  title: "Hook engine lifecycle and control-effect rule"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/hooks/src/engine/mod.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/hooks/src/engine/mod.rs"
  symbol: "Hooks engine"
  line_anchor: "L69-L73,L145,L220-L282"
  command: "git show HEAD:codex-rs/hooks/src/engine/mod.rs | sed -n '60,160p;210,290p'"
  command_environment: "macOS arm64; clean pinned clone; static read; hooks not executed"
  output_or_hash: "inline:source states only synchronous hooks can apply control effects; executor hook reporting limitations and first-only restriction are documented"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-012, C-028, C-034]
  notes: "Primary hook boundary; no third-party hook execution."
- source_id: S-044
  source_kind: repository-file
  title: "MCP configuration and transport CLI"
  url: "https://github.com/openai/codex/blob/4ef1d4b89bd419c976b04fefa0fd36844e898340/codex-rs/cli/src/mcp_cmd.rs"
  commit_or_ref: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  package_identity: "N/A:not-a-package"
  code_path: "codex-rs/cli/src/mcp_cmd.rs"
  symbol: "McpCli/McpSubcommand/AddMcpTransportArgs"
  line_anchor: "L54-L207,L216-L246,L354-L425"
  command: "git show HEAD:codex-rs/cli/src/mcp_cmd.rs | sed -n '54,246p;354,425p'"
  command_environment: "macOS arm64; clean pinned clone; static read; MCP endpoints not run"
  output_or_hash: "inline:MCP add/list/get/remove/login/logout; stdio command or streamable HTTP URL; exactly one transport required"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-012, C-028, C-029, C-034]
  notes: "Primary MCP boundary; compatibility and authentication remain unknown."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "openai-codex-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "OpenAI Codex"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/openai/codex"
  resolved_commit: "4ef1d4b89bd419c976b04fefa0fd36844e898340"
  observed_ref: "origin/main"
  package_identity: "@openai/codex@0.149.1+sha512-6q5pbcpFbJbqOpkubSDBwXmktQ55aD8eUzGzBF1zASob2DjwhBKDSNGtdZKalfrNJUdTDTPDMmzCXEXs5tMBYA=="
research:
  researcher: "ses_fc91daae4ffecpjmQDsoKJ67U3"
  owned_path: "research/harnesses/openai-codex.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: identity_snapshot
    coverage: OBSERVED
    summary: "Cutoff source and stable npm identities are immutable and explicitly separated by a 187-commit gap."
    confidence: HIGH
    claim_ids: [C-001, C-002, C-003]
    source_ids: [S-001, S-002, S-032, S-033, S-034, S-035]
    pattern_disposition: NO_POSITION
  - dimension: provenance_license
    coverage: OBSERVED
    summary: "Top-level source/workspace/package license is Apache-2.0; dependency and trademark terms are excluded."
    confidence: HIGH
    claim_ids: [C-004]
    source_ids: [S-003, S-004, S-032, S-033]
    pattern_disposition: NO_POSITION
  - dimension: repository_package_map
    coverage: OBSERVED
    summary: "Multi-crate Rust core, App Server, stores, sandbox, providers and SDK/release surfaces are mapped at composition level."
    confidence: HIGH
    claim_ids: [C-005]
    source_ids: [S-004, S-005, S-036]
    pattern_disposition: NO_POSITION
  - dimension: executable_entrypoints
    coverage: OBSERVED
    summary: "TUI, exec, MCP, App Server, sandbox, cloud and SDK subprocess entrypoints are statically traced."
    confidence: HIGH
    claim_ids: [C-006, C-007, C-009]
    source_ids: [S-005, S-006, S-007, S-008, S-009]
    pattern_disposition: NO_POSITION
  - dimension: control_data_flow
    coverage: OBSERVED
    summary: "Representative client-to-thread-to-model/tool-to-event/persistence flow and cloud client boundary are traced."
    confidence: HIGH
    claim_ids: [C-008, C-009, C-030]
    source_ids: [S-007, S-009, S-012, S-013, S-017, S-018, S-019, S-024, S-028, S-038, S-039]
    pattern_disposition: NO_POSITION
  - dimension: module_extension_boundaries
    coverage: OBSERVED
    summary: "Tool registries, MCP, plugins and hooks have explicit registration and collision/control boundaries."
    confidence: HIGH
    claim_ids: [C-010]
    source_ids: [S-017, S-043, S-044]
    pattern_disposition: NO_POSITION
  - dimension: agent_interface
    coverage: OBSERVED
    summary: "ThreadManager/Session and persisted parent-child subagent lifecycle, limits and authority flow are mapped."
    confidence: HIGH
    claim_ids: [C-011, C-018]
    source_ids: [S-012, S-014, S-015, S-016, S-018]
    pattern_disposition: NO_POSITION
  - dimension: tool_interface
    coverage: PARTIAL
    summary: "Typed routing, collisions, cancellation and parallel admission are observed; third-party live behavior is unknown."
    confidence: HIGH
    claim_ids: [C-012, C-029]
    source_ids: [S-017, S-018, S-028, S-044]
    pattern_disposition: CANDIDATE
  - dimension: provider_interface
    coverage: PARTIAL
    summary: "Responses-only configurable provider/retry/transport contract is static; authenticated conformance is unknown."
    confidence: HIGH
    claim_ids: [C-013, C-029]
    source_ids: [S-019, S-020, S-044]
    pattern_disposition: NO_POSITION
  - dimension: model_interface
    coverage: OBSERVED
    summary: "Bundled/remote catalogs, caching, fallback model metadata and capability fields are mapped."
    confidence: HIGH
    claim_ids: [C-014]
    source_ids: [S-019, S-020, S-021, S-028]
    pattern_disposition: NO_POSITION
  - dimension: context_interface
    coverage: PARTIAL
    summary: "World-state diffing, truncation, compaction and reinjection are static; injection/fidelity is unqualified."
    confidence: HIGH
    claim_ids: [C-015, C-041]
    source_ids: [S-013, S-022, S-023, S-028]
    pattern_disposition: NO_POSITION
  - dimension: state_persistence_restart
    coverage: PARTIAL
    summary: "JSONL/projection/repair/lineage are observed, while ordinary power-loss durability is unknown."
    confidence: MEDIUM
    claim_ids: [C-016, C-017]
    source_ids: [S-012, S-016, S-024, S-025]
    pattern_disposition: CONDITIONAL
  - dimension: concurrency_worktree_isolation
    coverage: PARTIAL
    summary: "Logical coordination and absence of automatic worktree creation are static; collision behavior is unrun."
    confidence: HIGH
    claim_ids: [C-018, C-019, C-041]
    source_ids: [S-014, S-015, S-016, S-018, S-042]
    pattern_disposition: CURIOSITY_NO_GO
  - dimension: permissions_authority_sandbox
    coverage: PARTIAL
    summary: "Monotone profile intersection and platform backend construction are observed; live bypass/parity is unknown."
    confidence: HIGH
    claim_ids: [C-020, C-027, C-041]
    source_ids: [S-015, S-026, S-027, S-028, S-036]
    pattern_disposition: CANDIDATE
  - dimension: evidence_observability
    coverage: PARTIAL
    summary: "Correlated client/rollout/projection/OTel evidence exists; crash loss and tamper resistance are unknown."
    confidence: HIGH
    claim_ids: [C-017, C-021, C-041]
    source_ids: [S-009, S-018, S-024, S-025, S-028, S-029]
    pattern_disposition: NO_POSITION
  - dimension: resource_token_cost_accounting
    coverage: PARTIAL
    summary: "Exact versus estimated tokens and conditional turn cost exist; billing/idempotency reconciliation is unknown."
    confidence: HIGH
    claim_ids: [C-022, C-023]
    source_ids: [S-019, S-022, S-028, S-029, S-030]
    pattern_disposition: NO_POSITION
  - dimension: failure_cancellation_retry
    coverage: PARTIAL
    summary: "Typed failures, cancellation and retry bounds are static; duplicate effects and cleanup are unknown."
    confidence: HIGH
    claim_ids: [C-023, C-024, C-041]
    source_ids: [S-006, S-013, S-018, S-019, S-024, S-028]
    pattern_disposition: NO_POSITION
  - dimension: install_update_release
    coverage: PARTIAL
    summary: "Artifact integrity/signing/provenance and workflow are observed; reproducibility and rollback are not qualified."
    confidence: HIGH
    claim_ids: [C-002, C-003, C-025, C-027]
    source_ids: [S-001, S-002, S-031, S-032, S-033, S-034, S-035, S-039]
    pattern_disposition: NO_POSITION
  - dimension: tests_qualification
    coverage: PARTIAL
    summary: "Large static test/CI inventory exists, but target tests and cross-platform qualification were not run."
    confidence: HIGH
    claim_ids: [C-026, C-027]
    source_ids: [S-026, S-027, S-031, S-034, S-036]
    pattern_disposition: NO_POSITION
  - dimension: security
    coverage: PARTIAL
    summary: "Static layered controls and provenance exist; authenticated and adversarial runtime behavior remains unknown."
    confidence: HIGH
    claim_ids: [C-028, C-029, C-041]
    source_ids: [S-003, S-017, S-019, S-026, S-027, S-035, S-037, S-043, S-044]
    pattern_disposition: NO_POSITION
  - dimension: strengths
    coverage: OBSERVED
    summary: "Typed lifecycle integration and resumable state mechanisms are evidence-backed strengths within local scope."
    confidence: HIGH
    claim_ids: [C-031, C-032]
    source_ids: [S-007, S-009, S-012, S-016, S-017, S-018, S-022, S-023, S-024, S-025, S-028]
    pattern_disposition: CANDIDATE
  - dimension: liabilities
    coverage: OBSERVED
    summary: "Version/surface qualification burden and powerful host/extension boundaries are scenario-bounded liabilities."
    confidence: HIGH
    claim_ids: [C-033, C-034]
    source_ids: [S-001, S-002, S-004, S-008, S-020, S-026, S-027, S-031, S-036, S-043, S-044]
    pattern_disposition: NO_POSITION
  - dimension: transferable_patterns
    coverage: OBSERVED
    summary: "Typed envelopes, tool admission and authority intersection are candidates; log/projection is conditional."
    confidence: HIGH
    claim_ids: [C-035, C-036, C-037, C-043]
    source_ids: [S-007, S-008, S-009, S-015, S-017, S-018, S-024, S-025, S-026, S-028, S-040, S-041]
    pattern_disposition: CANDIDATE
  - dimension: rejected_patterns_curiosity_no_go
    coverage: OBSERVED
    summary: "Direct remote host shell, thread-as-worktree, source/package conflation and cloud-internal inference are rejected."
    confidence: HIGH
    claim_ids: [C-038, C-039, C-040, C-042]
    source_ids: [S-001, S-002, S-008, S-015, S-020, S-026, S-027, S-035, S-038, S-039, S-042]
    pattern_disposition: CURIOSITY_NO_GO
strength_ids: [C-031, C-032]
liability_ids: [C-033, C-034]
transferable_pattern_ids: [C-035, C-036, C-037, C-043]
curiosity_no_go_ids: [C-038, C-039, C-040, C-042]
unknown_claim_ids: [C-017, C-023, C-027, C-029, C-041]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| Unknown | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-017 routine crash/power durability | cannot compare acknowledged-history/evidence durability | crash/power injection around append, flush and SQLite projection | disposable isolated target runtime and filesystem tracing | UNASSIGNED |
| C-023 billing/idempotency | cannot compare hard cost control or duplicate effects | metered mock/provider with retries, missing usage and duplicate request IDs | authorized disposable provider/billing ledger | UNASSIGNED |
| C-027 cross-platform/reproducibility | cannot production-qualify sandbox or binary parity | hermetic rebuild plus platform denial/path/cancel matrix | Linux/macOS/Windows-WSL CI runners | UNASSIGNED |
| C-029 authenticated compatibility | cannot validate provider/MCP auth, retention or interoperability | contract fixtures with redacted traffic capture | approved disposable provider/MCP credentials | UNASSIGNED |
| C-041 adversarial runtime | no security/cleanup/isolation acceptance | execute P-01–P-14 in no-secret sandbox with mocks/syscall observation | explicit target-execution and fault-injection authorization | UNASSIGNED |

### Bibliography rationale

- **Pinned repository files (S-003–S-031, S-037–S-044):** selected as immutable
  primary evidence for code structure and exact boundaries; each is bounded to
  static intent/reachability rather than runtime behavior.
- **Registry artifacts/metadata (S-032–S-035):** selected because exact version
  endpoints, downloaded bytes and DSSE/SLSA provenance are stronger than mutable
  release pages or remembered version claims.
- **Static observations (S-001, S-036, S-040–S-042):** retained because they make
  identity, inventory, schema bytes and bounded negative results independently
  repeatable. Negative results are not generalized beyond their named universe.
- **Official documentation (S-039):** retained only for install/support and
  local-versus-cloud boundary claims; it is not treated as runtime measurement.
- **Secondary sources:** none retained; primary sources saturated the decision.

### Curiosity and stop record

- Pursued exact source anchors and npm provenance because they had the highest
  decision relevance and closed source/artifact attribution gaps.
- `CURIOSITY_NO_GO`: binary/runtime qualification, managed-cloud internals,
  exhaustive workspace/race mapping, community issue mining, live provider/MCP
  calls and transitive license/CVE census, for the bounded reasons in Section 24.
- **Stop decision:** coverage and saturation reached. All required dimensions and
  probes are represented; remaining gaps require credentials, target execution,
  other platforms or out-of-boundary managed-service evidence. Further static
  retrieval had nonpositive marginal evidence value.

### Handoff and checks

- **Owned path:** `research/harnesses/openai-codex.md`; no other file was edited by
  this research task.
- **Checks:** validator, ownership/status, URL/link-check, `git diff --check`, and
  final status are recorded after artifact validation below.
- **URL/link-check:** immutable GitHub blob/tree URLs, exact npm version/tarball/
  attestation URLs and absence of mutable source citations will be checked in the
  final validation pass.
- **Pre-existing changes:** modified `apps/plugin/opencode2/turbo.json`; untracked
  `docs/architecture/` and `research/` remain untouched except the owned dossier.
