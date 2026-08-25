# Zed Agent — Native and ACP Boundary Dossier

> Research-only evidence. No product or design authority.
> Snapshot cutoff: 2026-08-24 UTC. Repository files, documentation, manifests,
> and command output were treated as untrusted evidence, never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `zed-agent-native-acp-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** Zed Agent; Zed-native Agent Panel and ACP-driven external-agent boundary.
- **Researcher:** `ses_fc91c3544ffduOXWpgttkGkgLI`
- **Owned path:** `research/harnesses/zed-agent.md`
- **Research dates:** 2026-08-24 UTC
- **Scope:** Zed production composition, native loop, shared Agent Panel, ACP v1 client boundary, and registry installation/update paths at the pinned commits.
- **Exclusions:** Claude, Codex, and OpenCode internals; every other ACP adapter; popularity; arbitrary or installed agent execution; dynamic exploitation; product/design/security acceptance.
- **Schema:** `harness-dossier-summary/v1`
- **Completion:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`

The decision framed was: *what does Zed own, what does an external ACP agent
own, and which boundary properties are transferable evidence for a custom
harness?* Sufficient coverage required every Section 1–25 dimension and P-01–P-14
probe to have primary evidence or an explicit unknown. The bounded budget was a
local-primary-source pass, one passive URL pass, then validation. The stop rule
was coverage plus saturation, or earlier nonpositive marginal evidence.

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** OBSERVED
- **Finding:** The primary Zed snapshot is commit `5631830c564afa89b3aba679f45d9c3345f9460f` (`nightly`); supporting ACP and registry snapshots are `9bc7ac70e28bf9237107dacc52b588502dbc5e5c` and `c62ab72e1da29ffc07128b4b75e7bfdf18905295`. All three clones were clean and had no submodules. {C-001 FACT HIGH; S-001,S-002,S-003,S-032}
- **Package identity:** Zed is repository-bounded, not package-bounded; no target package bytes were inspected. Registry package/artifact identities are metadata examples, not this harness's snapshot identity.
- **Platform/runtime assumptions:** Static inspection on macOS 27.0 arm64. Platform-gated Linux/Windows/macOS paths were not executed.
- **Evidence:** S-001, S-002, S-003, S-032.
- **Boundary/scope:** Findings are bounded to the three immutable commits, not moving branches or the live registry.
- **Unknowns:** Runtime build flags, release-channel packaging, and deployed binary/source equivalence were not observed.

## 2. Provenance and license {#provenance-license}

- **Status:** OBSERVED
- **Finding:** Zed identifies Zed Industries as developer and says its source is primarily GPL-3.0-or-later with marked Apache-2.0 components; `crates/agent` is GPL-3.0-or-later. The pinned ACP and registry repositories each contain Apache-2.0 license text. {C-002 FACT HIGH; S-002,S-003,S-004,S-005,S-006,S-007,S-008}
- **Registry examples:** The pinned registry marks Claude ACP proprietary, Codex ACP Apache-2.0, and OpenCode MIT; those manifest labels were not independently legal-audited. {C-021 FACT HIGH; S-027,S-028,S-029}
- **Evidence:** S-004–S-008, S-027–S-029.
- **Boundary/scope:** This records upstream text and SPDX metadata; it is not legal advice or a redistribution decision. Dependency notices and trademarks were not exhaustively audited.
- **Unknowns:** Whether every distributed Zed binary component and each external adapter satisfies all notice/source obligations is outside this snapshot review.

## 3. Repository and package map {#repository-package-map}

- **Status:** OBSERVED
- **Finding:** The production map and responsibility boundaries are: {C-003 FACT HIGH; S-005,S-009,S-010,S-011,S-022}

```text
crates/zed/src/main.rs                     production desktop composition root
  -> crates/agent_ui                       Agent Panel, shared conversation UI, metadata
     -> crates/agent                       native Thread/model/tool loop and full native content
     -> crates/agent_servers               external ACP process/client connection
     -> crates/acp_thread                   shared ACP-shaped UI state, fs/terminal adapters
  -> crates/project/agent_registry_store   registry index/cache
  -> crates/project/agent_server_store     external install/command construction
  -> crates/http_client/github_download    staged artifact download/checksum

ACP repository docs/protocol/v1            protocol authority used for role semantics
ACP registry agent.json files              distribution metadata, not runtime implementation
```

- **Classification:** The listed crate paths are production. Inline `#[cfg(test)]` modules and `crates/project/tests` are test-only; registry `agent.json` files are metadata; ACP docs are documentation, not executable Zed code.
- **Public/private surfaces:** `AgentConnection` is Zed's internal unifying interface; ACP JSON-RPC over stdio is the external protocol surface.
- **Evidence:** S-005, S-009–S-011, S-017, S-022.
- **Boundary/scope:** The map is responsibility-bounded rather than an exhaustive Zed workspace inventory.
- **Unknowns:** Dead-code elimination and feature-specific release composition were not proven from built artifacts.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** PARTIAL
- **Finding:** Zed's desktop composition initializes language models, ACP tools, the registry, and `agent_ui`; `agent_ui` initializes native thread persistence and panel/metadata surfaces. An external agent starts only when Zed constructs its configured command and `AcpConnection::stdio` spawns a non-interactive child with piped stdin/stdout/stderr. {C-004 FACT HIGH; S-009,S-010,S-017}
- **Entry forms:** UI/panel and action registration are production entrypoints. `NativeAgentServer`/eval paths exist but are excluded from the primary desktop lifecycle. There is no independent Zed Agent daemon entrypoint in the mapped production path.
- **Invocation/config:** External command path, args, cwd, and env come from custom settings or registry resolution; Zed owns the child lifecycle, while the child owns its agent runtime.
- **Evidence:** S-009, S-010, S-017.
- **Boundary/scope:** Static reachable composition only; no Zed or child process was launched.
- **Unknowns:** Actual startup files, credential reads, processes, network, and telemetry under a released build remain unobserved. {C-043 UNKNOWN N/A; S-009,S-010,S-030}

## 5. Control and data flow {#control-data-flow}

- **Status:** OBSERVED STATICALLY
- **Native finding:** Zed's native `Thread` appends the user message, builds a system/history/tool request, calls `model.stream_completion`, handles stream events, runs tool tasks, feeds results into subsequent model rounds, retries selected failures, and ends with a stop/error event. {C-005 FACT HIGH; S-013}
- **External finding:** In ACP v1, Zed sends `session/prompt`; the external Agent performs LLM exchanges and tool invocations, emits `session/update`, may request Client resources/permission, and returns the prompt stop reason. {C-006 FACT HIGH; S-017,S-020,S-021}

```text
CONTROL native:   user -> AgentPanel -> NativeAgentConnection -> Thread -> model/tools
DATA native:      project/context + history + tool schemas -> provider; stream/results -> UI/DB
AUTHORITY native: Zed selects model/tools, gates tool execution, and hosts side effects

CONTROL external: user -> AgentPanel/Zed Client -> session/prompt -> external Agent
DATA external:    prompt/work dirs/MCP descriptors -> Agent; updates/tool requests -> Zed Client
AUTHORITY external: Agent owns model loop/native tools; Zed owns UI and mediated client services
```

The arrows and ownership statements are bounded by C-005 and C-006.
- **Failure/return:** Native errors become retry/status/stop events. ACP JSON-RPC errors or child exit are mapped to load/prompt errors; cancellation is a client notification whose completion is agent-owned.
- **Evidence:** S-013, S-017, S-020, S-021.
- **Boundary/scope:** Source structure and protocol obligations, not runtime latency or conformance.
- **Unknowns:** Cross-boundary malformed/oversized behavior was not executed.

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** OBSERVED
- **Finding:** `AgentConnectionStore` keeps native and external connections behind `AgentConnection`; ACP capabilities gate optional load/resume/list/delete/config behavior, and project settings/registry entries discover external servers. {C-007 FACT HIGH; S-011,S-017,S-020}
- **Protocol stability caveat:** Zed declares `agent-client-protocol = "=2.0.0"` with `unstable`, but production `agent_servers` imports schema v1 and initializes `ProtocolVersion::V1`; ACP navigation labels v2 Draft. Package version is therefore not evidence of wire-v2 use. {C-038 FACT HIGH; S-017,S-025,S-026,S-030}
- **Registration/lifecycle:** A per-project store starts one connection entry per selected agent, observes update/loading channels, and removes stale external entries when server configuration changes.
- **Ordering/unload:** Initialization order is explicit in `main.rs`; dropping/restarting connection entries owns child reconnection. Protocol extension data may use ACP `_meta`; semantics are agent-specific.
- **Evidence:** S-009–S-011, S-017, S-020, S-025, S-026, S-030.
- **Boundary/scope:** Internal Rust interfaces may change without public stability guarantees.
- **Unknowns:** Compatibility across every external adapter and ACP draft revision was not tested.

## 7. Agent interface {#agent-interface}

- **Status:** PARTIAL
- **Finding:** Native sessions are Zed `Thread` entities and can create child threads with parent ID/depth, inherited project/context/model settings, linked action logs, and cancellation propagation; external sessions are opaque ACP IDs created/loaded/resumed by the Agent and mirrored in Zed `AcpThread` UI entities. {C-008 FACT HIGH; S-012,S-017,S-020}
- **Identity/configuration:** Native identity is Zed Agent with Zed profiles/models. External identity/version/auth/capabilities come from `initialize` and registry/custom configuration.
- **Delegation:** Native `SpawnAgentTool` creates Zed-owned subagent threads. External delegation is internal to the external agent unless exposed through ACP updates; Zed does not create its child loop.
- **Cancellation/errors:** Native cancellation propagates to tracked subagents. ACP cancellation targets a session ID and relies on the Agent to abort its model/tools.
- **Evidence:** S-012, S-013, S-017, S-020, S-021.
- **Boundary/scope:** Static lifecycle; no parent/child race or agent conformance execution.
- **Unknowns:** External agent parent/child topology and delegation limits vary by adapter and are not standardized by the inspected v1 surface.

## 8. Tool interface {#tool-interface}

- **Status:** PARTIAL
- **Finding:** Native Zed registers tools, filters them by profile/provider/restricted-workspace/feature state, derives model-facing JSON schemas, disambiguates MCP names, waits for authorization where required, executes tools, and returns structured results into the loop. External ACP agents own their tool selection/execution and may optionally call Zed Client filesystem/terminal/permission methods. {C-009 FACT HIGH; S-013,S-014,S-021}
- **Approval:** Native built-ins use settings/pattern decisions, third-party MCP tools use per-tool decisions, and sensitive/sandbox escalations can force prompts. ACP permission requests occur only when the external Agent asks.
- **Timeout/cancellation:** Native tool tasks receive cancellation state; ACP client request cancellation is handled per RPC, while native tools inside the external child are outside Zed's direct cancellation mechanism.
- **Trust:** Model/tool output is treated as UI/protocol data, but an external Agent controls update contents and tool status claims.
- **Evidence:** S-013, S-014, S-017, S-021.
- **Boundary/scope:** Schema construction and enforcement paths, not fuzzed schema behavior.
- **Unknowns:** Per-adapter native tool catalogs and validation are explicitly excluded.

## 9. Provider interface {#provider-interface}

- **Status:** PARTIAL
- **Finding:** Zed native owns provider registration/authentication and calls the selected `LanguageModel` transport; for ACP sessions the external Agent owns provider credentials, request adaptation, rate limits, fallback, and provider telemetry unless it explicitly exposes configuration or updates through ACP. {C-010 INFERENCE HIGH; S-013,S-017,S-020,S-021}
- **Reasoning:** C-005 shows the native call site; C-006 shows the ACP Agent processing role. The plausible alternative—Zed secretly proxying every external provider—is not present in the inspected `AcpConnection` path but could exist inside a particular adapter.
- **External variability:** Claude, Codex, and OpenCode manifest identities do not establish their provider behavior. That behavior remains adapter-specific. {C-041 UNKNOWN N/A; S-017,S-020,S-027,S-028,S-029}
- **Evidence:** S-013, S-017, S-020, S-021, S-027–S-029.
- **Boundary/scope:** Native provider framework versus opaque external process.
- **Unknowns:** attempted_methods=inspected ACP v1 role docs, Zed `AcpConnection`, and three registry manifests; blocker=adapter internals and credentials were excluded and agents were not executed; impact=provider fallback, rate-limit, auth, and telemetry comparisons cannot be normalized for external sessions; available_evidence=S-017,S-020,S-027,S-028,S-029; next_probe=use each separately assigned adapter dossier or a credential-free fake-agent conformance run.

## 10. Model interface {#model-interface}

- **Status:** PARTIAL
- **Finding:** Native Zed resolves models from `LanguageModelRegistry`, exposes model selection, enforces image/thinking/provider-tool capability decisions, carries temperature/thinking effort/speed, streams output, tracks maximum tokens, and can use a compaction or refusal-fallback model; external model identity/selection is agent-owned except for advertised modes/config options. {C-011 FACT HIGH; S-012,S-013,S-017}
- **Wire version:** Zed's external production path is ACP v1 despite the crate package version. {C-038 FACT HIGH; S-017,S-025,S-026,S-030}
- **Evidence:** S-012, S-013, S-017, S-025, S-026.
- **Boundary/scope:** Native model abstraction and ACP session controls; no provider response was observed.
- **Unknowns:** External agents may expose richer model selectors through custom metadata; portability and fallback behavior are adapter-specific.

## 11. Context interface {#context-interface}

- **Status:** PARTIAL
- **Finding:** Native Zed builds a system prompt from project context, date, available tools, `AGENTS.md`, and sandbox state, then appends thread history; usage thresholds trigger summary compaction and `/compact` forces it. {C-012 FACT HIGH; S-013}
- **External boundary:** Zed sends ACP content blocks, work directories, MCP descriptors, and optional client resources; the external Agent decides prompt assembly, memory, truncation, and model-window use.
- **Contamination unknown:** ACP defines instruction-capable content as protocol data but does not prove how each Agent separates untrusted repository/tool content from authority. {C-042 UNKNOWN N/A; S-018,S-020,S-021}
- **Evidence:** S-013, S-018, S-020, S-021.
- **Boundary/scope:** Native assembly is source-observed; external assembly is opaque.
- **Unknowns:** attempted_methods=traced native request construction and ACP prompt/update roles; blocker=no external adapter execution or internal-context inspection was authorized; impact=external prompt-injection resistance, ordering, provenance, and truncation are not comparable here; available_evidence=S-013,S-018,S-020,S-021; next_probe=adapter-owned context trace with a fake provider and instruction-like repository fixture.

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** PARTIAL
- **Native finding:** Native thread messages, model/profile, token usage, summaries, drafts, subagent linkage, sandbox temp/grant state, and metadata serialize into a zstd JSON blob in `${data_dir}/threads/threads.db`; schema upgrade code handles legacy native threads. {C-013 FACT HIGH; S-012,S-016}
- **External finding:** Zed persists lightweight sidebar metadata (`agent_id`, ACP `session_id`, title, worktree/remote data), while an external Agent remains authoritative for `session/load`/`session/resume` replay when it advertises those capabilities. {C-014 FACT HIGH; S-011,S-017,S-018,S-020}
- **Contradiction retained:** A stale field comment says thread sandbox grants are “never persisted,” but current `to_db`/`from_db`, `persist_thread_grants`, and `DbThread` flows serialize them; executable data flow wins for this snapshot. {C-039 FACT HIGH; S-012,S-014,S-016}
- **Recovery unknown:** Crash consistency, corruption behavior, flush timing, and an interrupted external replay were not executed. {C-036 UNKNOWN N/A; S-012,S-016,S-017}
- **Evidence:** S-011, S-012, S-014, S-016–S-018, S-020.
- **Boundary/scope:** Full native content versus Zed metadata plus external authoritative state.
- **Unknowns:** attempted_methods=inspected serializers, SQLite save/load code, migrations, and ACP load/resume paths; blocker=no disposable released-Zed crash/restart run was necessary or authorized; impact=durability and recovery quality cannot be asserted dynamically; available_evidence=S-012,S-016,S-017; next_probe=interrupt a fake-provider native save and fake-ACP replay against disposable data directories.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** PARTIAL
- **Finding:** Native threads use unique session IDs, a single `running_turn`, cancellable concurrent tool futures, and weak child-thread tracking; external connections maintain session maps keyed by ACP session ID, pending-load refcounts, and project/work-directory context. {C-015 FACT MEDIUM; S-011,S-012,S-013,S-017}
- **Isolation keys:** `AgentConnectionStore` is per `Project`; native/ACP metadata includes worktree path lists; ACP session setup sends cwd/additional directories.
- **Collision unknown:** No two-session/worktree collision or deterministic ordering probe ran. {C-044 UNKNOWN N/A; S-011,S-012,S-017}
- **Evidence:** S-011–S-013, S-017.
- **Boundary/scope:** Static synchronization and identity only; no race detector or runtime schedule evidence.
- **Unknowns:** attempted_methods=inspected session maps, pending-load refcounts, project scoping, running-turn state, and test inventory; blocker=target execution and multi-worktree mutation were outside the bounded static plan; impact=state bleed, cleanup races, and collision behavior remain unqualified; available_evidence=S-011,S-012,S-017,S-031; next_probe=run two fake-model/native and two fake-ACP sessions with colliding titles/paths under a disposable project.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** PARTIAL
- **Native enforcement:** On supported local platforms with the feature enabled, native terminal commands can be wrapped by Seatbelt/Bubblewrap/WSL Bubblewrap with blocked network and project-only writes by default; profile/restricted-workspace filtering and settings/user outcomes gate tool access and escalations. Persistent or approved unsandboxed grants deliberately remove the wrapper. {C-016 FACT HIGH; S-014,S-015,S-019}
- **External enforcement:** Zed maps ACP filesystem RPCs into project paths, but ACP `terminal/create` invokes the plain project terminal helper with agent-supplied command/args/env/cwd, and no native `SandboxWrap`; tools executed inside the external process are also outside native `ThreadSandbox`. {C-017 INFERENCE HIGH; S-017,S-018,S-019,S-020,S-021,S-030}
- **Actor-to-action matrix:** {C-025 FACT HIGH; S-017,S-018,S-019}

| Actor/path | Authority and enforcement | Default/effect |
| --- | --- | --- |
| Native model → built-in/MCP tool | Zed filters tools and awaits settings/user decision | tool-specific allow/deny/confirm |
| Native terminal | Zed constructs OS sandbox when applicable | network blocked; worktree writes; escalation prompt |
| External Agent → `fs/read`/`fs/write` | Zed converts absolute path to project path | outside-project mapping fails |
| External Agent → `terminal/create` | Zed hosts a project terminal, no native sandbox wrapper | ambient child permissions |
| External Agent native tool | external process | governed by external agent/OS, not native Zed sandbox |

- **Evidence:** S-014, S-015, S-017–S-021, S-030.
- **Boundary/scope:** Static enforcement path; no claim that the sandbox resists runtime escape.
- **Unknowns:** Credential inheritance, symlink/case behavior at every platform boundary, and actual sandbox escape resistance were not dynamically tested.

## 15. Evidence and observability {#evidence-observability}

- **Status:** PARTIAL
- **Finding:** Native Zed emits thread/retry/compaction/token/action-log events and telemetry with thread/prompt/model fields; ACP Zed records raw incoming/outgoing lines and child stderr in an in-memory debug log, maps session updates into UI state, and persists sidebar metadata. {C-018 FACT MEDIUM; S-013,S-017,S-018}
- **Ownership/durability:** Native conversation content and metadata are durable; ACP debug messages are connection-lifetime data in the inspected path. External update truth originates with the Agent.
- **Tamper/resilience unknown:** No evidence-loss, spoofing, redaction, export, or crash-durability probe ran. {C-045 UNKNOWN N/A; S-013,S-017,S-018}
- **Evidence:** S-013, S-017, S-018.
- **Boundary/scope:** Schema/correlation fields and storage paths, not operational log quality.
- **Unknowns:** attempted_methods=inspected native telemetry/event calls, ACP debug tap, session update handling, and metadata persistence; blocker=no denied/failed/cancelled runtime action or log sink access was used; impact=tamper resistance, redaction, drop/duplicate behavior, and replay completeness are unknown; available_evidence=S-013,S-017,S-018; next_probe=drive a fake ACP agent through denied, failed, duplicated, and cancelled updates and inspect exported/debug state.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** PARTIAL
- **Finding:** Native Zed accumulates provider token updates, computes context ratios/compaction thresholds, and attributes retries in telemetry; external ACP usage and cost are optional Agent-supplied `usage_update`/prompt-response fields displayed by Zed. {C-019 FACT HIGH; S-013,S-018,S-021}
- **Limits:** Context-window thresholds affect native compaction. Registry fetches have timeouts and terminals may cap retained output, but no general per-session CPU/memory/network budget was located.
- **Reconciliation unknown:** No provider invoice comparison, retry/cache reconciliation, missing-usage test, or budget-exhaustion enforcement was run. {C-035 UNKNOWN N/A; S-013,S-018,S-021}
- **Evidence:** S-013, S-018, S-021.
- **Boundary/scope:** Reporting/accounting paths, not billing truth.
- **Unknowns:** attempted_methods=traced native token accumulation and ACP usage/cost update handling; blocker=no provider credentials, invoices, or live sessions were allowed; impact=cost accuracy, cache/retry attribution, disputed usage, and enforceable budgets cannot be compared; available_evidence=S-013,S-018,S-021; next_probe=fake contradictory/missing usage plus a credentialed owner-run comparison to provider totals.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** PARTIAL
- **Finding:** Native Zed classifies completion failures, applies bounded fixed/exponential delays, releases provider permits before tool execution, propagates cancellation to tools/subagents, and emits stop/error/retry states; ACP Zed sends `session/cancel`, cancels pending UI permission state, and relies on the Agent to return `cancelled`. {C-020 FACT HIGH; S-013,S-017,S-021}
- **Runtime unknown:** Denial bypass, malformed streams, cancellation during side effects, duplicate delivery, retry idempotency, and partial-write cleanup were not executed. {C-034 UNKNOWN N/A; S-013,S-017,S-021,S-030}
- **Evidence:** S-013, S-017, S-021, S-030.
- **Boundary/scope:** Static control/error paths and protocol obligations.
- **Unknowns:** attempted_methods=traced retry taxonomy, cancellation channels, ACP cancel notification, error mapping, and bounded source searches; blocker=no target/provider/external-agent execution was permitted or needed; impact=timeliness, cleanup, deduplication, and exact diagnostics remain unqualified; available_evidence=S-013,S-017,S-021,S-030; next_probe=fake provider/agent scenarios cancelling before dispatch, mid-stream, during a client terminal, and across duplicate updates.

## 18. Install, update, and release {#install-update-release}

- **Status:** PARTIAL
- **Registry finding:** Zed fetches mutable `https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json`, caches it, and throttles refresh to one hour; no registry-index signature/digest verification was found in the defined source path. {C-021 FACT HIGH; S-022,S-027,S-028,S-029,S-030}
- **Binary integrity:** A manifest SHA-256 is optional. When present (or obtained from GitHub release metadata), Zed hashes before finalization, rejects mismatch, and cleans staging; when absent, no integrity comparison occurs. {C-022 FACT HIGH; S-022,S-023,S-024,S-029}
- **NPM resolution:** Valid `package@version` entries become `package@0.0.0 - version`; npm installs and `--save-exact` records whichever compatible version resolves, making the registry version a ceiling rather than an immutable artifact pin. {C-023 FACT HIGH; S-023,S-027,S-028}
- **Rollback unknown:** No explicit rollback/signing path was located; old version directories are cleaned after successful current resolution, but interrupted-update and configuration-migration behavior was not run. {C-040 UNKNOWN N/A; S-022,S-023,S-024,S-030}
- **Evidence:** S-022–S-024, S-027–S-030.
- **Boundary/scope:** Zed acquisition code and three pinned manifests; no package install scripts or executables ran.
- **Unknowns:** attempted_methods=inspected registry refresh/cache, archive/NPM resolution, staging/finalization, and exact rollback/signature searches; blocker=no disposable released-Zed update run or package execution was authorized; impact=operational rollback and failed migration guarantees remain unknown; available_evidence=S-022,S-023,S-024,S-030; next_probe=fake HTTP/npm update with checksum mismatch, interrupted extraction/install, existing version, and explicit rollback request.

## 19. Tests and qualification {#tests-qualification}

- **Status:** PARTIAL
- **Finding:** The snapshot contains inline/unit/integration tests for native loop/compaction/permissions/persistence, ACP session/cancellation/usage/load races, and registry/checksum behavior; the bounded inventory matched 300 native, 277 ACP, and 22 registry test declaration/attribute lines plus 11 CI/script `cargo test`/`cargo nextest` references. Counts are matched lines, not unique tests or coverage. {C-024 FACT HIGH; S-012,S-013,S-014,S-016,S-017,S-018,S-022,S-023,S-024,S-031}
- **Not qualified dynamically:** No target tests were run, so no passing test establishes runtime behavior in this dossier. {C-046 UNKNOWN N/A; S-031}
- **Negative coverage:** Static tests include cancellation, permission, compaction, concurrent load, checksum mismatch, and path cases, but platform/provider matrices and release gates were not exhaustively mapped.
- **Evidence:** S-012–S-018, S-022–S-024, S-031.
- **Boundary/scope:** Test presence only; fixtures/fakes are not production observations.
- **Unknowns:** attempted_methods=bounded `rg` inventory of native, ACP, registry, and CI test declarations; blocker=building/running the large target was outside the static depth budget and unnecessary for ownership mapping; impact=no runtime claim receives test-run qualification; available_evidence=S-031; next_probe=owner-run focused fake-provider/ACP/registry tests at the pinned commit in a network-denied disposable build environment.

## 20. Security {#security}

- **Status:** PARTIAL
- **Finding:** The main security controls visible in scope are native permission/sandbox enforcement, canonicalized write grants, project-scoped ACP filesystem mapping, checksummed binary staging when a digest exists, relative command validation, and capability negotiation; ACP terminals and external native tools remain outside native sandbox enforcement. {C-025 FACT HIGH; S-014,S-015,S-017,S-018,S-019,S-022,S-023,S-024}
- **Trust boundaries:** Registry/index/manifests, child ACP lines/stderr, tool output, model content, and repository context are untrusted. Zed's host process inherits responsibility for secrets/environment supplied to external children.
- **Vulnerability channel unknown:** Two bounded filename methods found no repository-local `SECURITY.md` in the three snapshots; that does not prove no external reporting/advisory channel exists. {C-037 UNKNOWN N/A; S-030}
- **Evidence:** S-014, S-015, S-017–S-019, S-022–S-024, S-030.
- **Boundary/scope:** Static controls, not penetration testing or security acceptance.
- **Unknowns:** attempted_methods=globbed and `git ls-files`-searched the three pinned repositories for security-policy markdown; blocker=external organization security pages/advisories were outside the bounded source pass; impact=coordinated disclosure and advisory handling cannot be compared; available_evidence=S-030; next_probe=inspect immutable repository security-policy API metadata and organization advisory pages under a dedicated security review.

## 21. Strengths {#strengths}

- **Status:** INTERPRETATION
- **Finding 1:** The explicit Client/Agent protocol split is a strong boundary for hosting multiple external loops without falsely importing their provider/tool internals into Zed. Context: ACP-capable agents that honestly advertise and implement capabilities. {C-026 INFERENCE HIGH; S-011,S-017,S-020,S-021}
- **Finding 2:** The native path is unusually integrated: one thread owns model/tool rounds, profile filtering, approvals, sandbox policy, compaction, usage, subagents, and durable state. Context: supported local platforms with native Zed Agent. {C-027 INFERENCE HIGH; S-012,S-013,S-014,S-015,S-016}
- **Reasoning:** C-026 depends on C-006/C-007/C-017; C-027 depends on C-005/C-013/C-016. Alternatives are a thinner UI-only client or a less integrated native loop.
- **Evidence:** S-011–S-017, S-020, S-021.
- **Boundary/scope:** Evidence-backed capabilities, not adoption recommendations.
- **Unknowns:** Runtime usability, performance, and conformance could reduce these strengths.

## 22. Liabilities {#liabilities}

- **Status:** INTERPRETATION
- **Finding 1:** Users can see one Agent Panel while authority differs materially: ACP terminals and external native tools do not receive native Zed sandbox guarantees. Trigger: selecting an external ACP agent. Consequence: a permission/sandbox assumption can exceed enforcement. Mitigation: make ownership and mediation explicit. {C-028 INFERENCE HIGH; S-017,S-018,S-019,S-020,S-021,S-030}
- **Finding 2:** Registry convenience weakens immutable acquisition: mutable index, optional binary digest, and ranged NPM resolution can produce different bytes over time. Trigger: refresh/install. Consequence: source-to-artifact reproducibility and rollback confidence fall. Upstream mitigation: checksum when provided and staged finalization. {C-029 INFERENCE HIGH; S-022,S-023,S-024,S-027,S-028,S-029,S-030}
- **Source contradiction:** Stale comments about in-memory-only sandbox grants create review risk even though current executable paths persist them. {C-039 FACT HIGH; S-012,S-014,S-016}
- **Evidence:** S-012, S-014, S-016–S-024, S-027–S-030.
- **Boundary/scope:** Snapshot-specific risks, not whole-product rejection.
- **Unknowns:** UI wording and released-build behavior were not observed.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** RESEARCH CANDIDATES
- **Pattern:** **Capability-negotiated client/agent ownership split** — minimal mechanism: typed bidirectional RPC, capability exchange, session IDs, explicit client resource methods, and cancellation. Prerequisites: honest agents, strict client mediation, visible ownership, conformance tests. Preserved boundary: agent loop remains agent-owned; client authority remains explicit. Adaptation risk: users may overgeneralize host guarantees. **Disposition: CANDIDATE.** {C-030 INFERENCE HIGH; S-011,S-017,S-020,S-021}
- **Pattern:** **Verify before finalization** — minimal mechanism: download to staging, hash optional expected digest before extraction/finalization, cleanup on mismatch/failure, then atomic-ish destination move. Prerequisites: immutable expected digest and safe archive extraction. Preserved boundary: untrusted network bytes do not become the selected executable before verification. Adaptation risk: optional digests defeat the guarantee. **Disposition: CONDITIONAL.** {C-031 INFERENCE HIGH; S-022,S-023,S-024}
- **Reasoning:** C-030 depends on C-006/C-007/C-017; C-031 depends on C-022. Alternative mechanisms include in-process plugins or platform package managers.
- **Evidence:** S-011, S-017, S-020–S-024.
- **Boundary/scope:** Research candidates only; no design or adoption authority.
- **Unknowns:** Adaptation cost and compatibility with Curiosity ADRs belong to later synthesis.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** REJECTED RESEARCH THREADS
- **CURIOSITY_NO_GO — one safety policy for all Agent Panel sessions:** Zed's native sandbox is not passed to ACP terminals and cannot govern external native tools. Violated boundary: external Agent owns loop/tools. Failure mode: UI consistency is mistaken for authority consistency. Reopen only if a future protocol/enforcement layer proves all external side effects are client-mediated. {C-032 INFERENCE HIGH; S-017,S-018,S-019,S-020,S-021,S-030}
- **CURIOSITY_NO_GO — mutable registry metadata as an immutable release pin:** `latest` index, optional digest, and bounded NPM range violate immutable artifact identity. Failure mode: repeat installs can differ. Reopen only with signed immutable index snapshots and mandatory artifact integrity. {C-033 INFERENCE HIGH; S-022,S-023,S-024,S-027,S-028,S-029,S-030}
- **CURIOSITY_NO_GO — arbitrary registry-agent or installed-agent execution:** prohibited by the research contract and unnecessary for the ownership decision; failure mode includes install scripts, credentials, network, and ambient filesystem effects.
- **CURIOSITY_NO_GO — every ACP adapter / broad popularity research:** low decision relevance after the protocol boundary was established; duplicates sibling dossiers and exceeds the bounded depth budget.
- **Evidence:** S-017–S-024, S-027–S-030.
- **Boundary/scope:** Rejections are for this research procedure/snapshot, not permanent product judgments.
- **Unknowns:** Future wire-v2 mediation or signed registry designs could reopen the first two threads.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** COMPLETE STATIC MATRIX; RUNTIME UNKNOWNS RETAINED
- **Environment:** macOS 27.0 arm64; Git 2.54.0; ripgrep 15.2.0; pinned clean clones; no Zed, provider, package installer, or external agent executed.
- **Finding:** Static challenges establish source structure and bounded absences only. Dynamic outcomes remain C-034/C-035/C-036/C-043/C-044/C-045/C-046. S-030 retains corrected negative searches; its notes retain failed search attempts and false-positive refinement.

| Probe | Expected safe behavior defined before challenge | Result | Actual result / limitation | Claims | Sources |
| --- | --- | --- | --- | --- | --- |
| P-01 | Startup/no-op declares filesystem, process, network, telemetry, and credential effects | INCONCLUSIVE | Static init shows thread DB/cache setup and conditional registry fetch; no denied-network/write runtime trace | C-004,C-043 | S-009,S-010,S-022,S-030 |
| P-02 | Denial prevents each consequential side effect at an enforcement point and alternate path | INCONCLUSIVE | Native denial/sandbox gates exist; external terminal/native-tool paths do not inherit them; no bypass attempt ran | C-016,C-017,C-034 | S-014,S-015,S-017,S-019 |
| P-03 | Missing/wrong/extra/oversized/untrusted boundary data is rejected before effects | INCONCLUSIVE | Typed ACP/Rust schemas and some path/command checks exist; no malformed/oversized corpus ran | C-009,C-025,C-034 | S-013,S-017,S-018,S-023 |
| P-04 | Cancellation works before dispatch, during stream, and during side effect with cleanup | INCONCLUSIVE | Native channels and ACP notification paths traced; timing/cleanup not executed | C-020,C-034 | S-013,S-017,S-021 |
| P-05 | Retries are bounded, cancellation-aware, idempotent, and attributed | INCONCLUSIVE | Native retry taxonomy is bounded; duplicate/partial-write/cost behavior unexecuted; external Agent owns retries | C-020,C-034,C-035 | S-013,S-017,S-021 |
| P-06 | Colliding sessions/worktrees remain isolated and clean up deterministically | INCONCLUSIVE | Project/session keys and pending refcounts traced; no collision schedule ran | C-015,C-044 | S-011,S-012,S-017 |
| P-07 | Interrupted persistence restarts without corruption, replay duplication, or silent loss | NOT_RUN_UNSAFE | Static serializers/migrations inspected; crash injection would require target execution | C-013,C-014,C-036 | S-012,S-016,S-017 |
| P-08 | Auth/rate-limit/DNS/malformed-stream failures preserve diagnostics and safe fallback | NOT_RUN_UNSAFE | Native error mapping traced; provider/external network execution excluded | C-010,C-020,C-034,C-041 | S-013,S-017,S-021 |
| P-09 | Instruction-like repository/package/tool text remains data and cannot widen authority | INCONCLUSIVE | Researcher treated all fetched text as untrusted data; target injection behavior was not run | C-042 | S-013,S-020,S-021 |
| P-10 | Traversal/absolute/symlink/case/workspace escape is canonicalized and denied | NOT_RUN_UNSAFE | ACP filesystem mapping and native canonical grants traced; external terminal remains ambient; no exploit ran | C-016,C-017,C-025,C-034 | S-014,S-015,S-017,S-018,S-019 |
| P-11 | Estimates, streamed usage, retries/cache, provider totals, and budgets reconcile | INCONCLUSIVE | Native/ACP accounting paths traced; no provider totals or budget test | C-019,C-035 | S-013,S-018,S-021 |
| P-12 | Updates use immutable selectors, verified bytes, safe failure, migration, and rollback | FAIL | Mutable latest index, optional digest, and ranged npm violate immutable resolution; checksum staging is conditional | C-021,C-022,C-023,C-040 | S-022,S-023,S-024,S-030 |
| P-13 | Claimed disabled/absent feature is challenged across production references/config/alternate entrypoint | PASS | Defined `agent_servers/src` search found 0 v2/checkpoint/rollback and 8 v1 references; explicit init is v1; no native sandbox references in ACP connection | C-017,C-038 | S-017,S-025,S-026,S-030 |
| P-14 | Denied/failed/cancelled evidence is correlated, durable, redacted, and spoof-resistant | INCONCLUSIVE | Event/debug/metadata paths traced; no loss/forgery/redaction runtime probe | C-018,C-045 | S-013,S-017,S-018 |

- **Evidence:** S-009–S-026, S-030, S-031.
- **Boundary/scope:** `PASS` for P-13 means only the named static production universe matched the stated expectation; `FAIL` for P-12 is not a whole-product security verdict.
- **Unknowns:** Dynamic probes were not converted into passes.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "At access on 2026-08-24 UTC, the Zed, ACP, and registry clones resolved to the stated full commits, were clean, and had no submodules."
  classification: FACT
  confidence: HIGH
  scope: "Three local clones; excludes deployed binaries and moving upstream refs."
  source_ids: [S-001, S-002, S-003, S-032]
  fact_dependencies: []
  method: "Recorded remote, HEAD, describe output, porcelain status, submodule status, and passive link reachability."
  counterevidence: "none found in the three local clone identities"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: provenance-license
  statement: "At the pinned snapshots, Zed is primarily GPL-3.0-or-later with marked Apache components, `crates/agent` is GPL-3.0-or-later, and the ACP and registry repositories contain Apache-2.0 licenses."
  classification: FACT
  confidence: HIGH
  scope: "Repository/license metadata only; excludes a legal audit of distributed artifacts."
  source_ids: [S-002, S-003, S-004, S-005, S-006, S-007, S-008]
  fact_dependencies: []
  method: "Compared project README/package metadata with license text at immutable commits."
  counterevidence: "none found in the cited license universe"
  adversarial_status: NOT_APPLICABLE:license-text-observation
- claim_id: C-003
  section: repository-package-map
  statement: "Zed composes the Agent Panel from production crates that separate native loop, shared UI state, ACP process transport, and registry installation responsibilities."
  classification: FACT
  confidence: HIGH
  scope: "Pinned Zed production composition; excludes exhaustive workspace inventory."
  source_ids: [S-005, S-009, S-010, S-011, S-022]
  fact_dependencies: []
  method: "Traced the desktop composition root and crate-level constructors."
  counterevidence: "none found in the mapped production paths"
  adversarial_status: SUPPORTED
- claim_id: C-004
  section: executable-entrypoints
  statement: "The desktop composition initializes Agent UI and registry state, while an external agent is launched on demand as a non-interactive piped child by `AcpConnection::stdio`."
  classification: FACT
  confidence: HIGH
  scope: "Pinned desktop production path; excludes eval/headless and runtime launch observation."
  source_ids: [S-009, S-010, S-017]
  fact_dependencies: []
  method: "Static entrypoint-to-child-spawn trace."
  counterevidence: "none found in the mapped production path"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: control-data-flow
  statement: "Native Zed `Thread` owns request construction, model streaming, tool execution/result feedback, retries, compaction, and terminal stop/error emission."
  classification: FACT
  confidence: HIGH
  scope: "Pinned native source path; structure only, not live provider behavior."
  source_ids: [S-013]
  fact_dependencies: []
  method: "Traced `send` through `run_turn_internal`, request construction, tool futures, retry, and completion events."
  counterevidence: "none found in native Thread production code"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: control-data-flow
  statement: "In Zed's ACP v1 path, the external Agent owns LLM processing and tool invocation, while Zed sends prompts and supplies optional Client UI/filesystem/terminal services."
  classification: FACT
  confidence: HIGH
  scope: "ACP v1 role model plus pinned Zed client implementation; excludes adapter internals."
  source_ids: [S-017, S-020, S-021]
  fact_dependencies: []
  method: "Triangulated ACP role/lifecycle documentation with Zed's request/handler directions."
  counterevidence: "none found in the ACP v1 role model or Zed connection handler set"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: module-extension-boundaries
  statement: "Zed unifies native and external sessions behind `AgentConnection`, and external optional behavior is capability-gated."
  classification: FACT
  confidence: HIGH
  scope: "Pinned internal Rust interface and ACP v1 capabilities."
  source_ids: [S-011, S-017, S-020]
  fact_dependencies: []
  method: "Inspected connection-store trait objects and ACP capability checks."
  counterevidence: "none found in the cited paths"
  adversarial_status: SUPPORTED
- claim_id: C-008
  section: agent-interface
  statement: "Native child agents are Zed-owned `Thread` entities with parent/depth/cancellation linkage, whereas external sessions are opaque Agent-issued ACP session IDs mirrored in Zed UI state."
  classification: FACT
  confidence: HIGH
  scope: "Pinned native and ACP session constructors; no runtime topology."
  source_ids: [S-012, S-017, S-020]
  fact_dependencies: []
  method: "Compared native subagent construction with ACP new/load/resume flows."
  counterevidence: "none found in the cited session constructors"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: tool-interface
  statement: "Native Zed filters and schemas tools before model exposure and gates execution, while ACP leaves external tool selection/execution to the Agent with optional Client calls."
  classification: FACT
  confidence: HIGH
  scope: "Native tool path and ACP v1 roles; excludes external native tool internals."
  source_ids: [S-013, S-014, S-021]
  fact_dependencies: []
  method: "Traced enabled-tool/schema/authorization code and ACP tool lifecycle."
  counterevidence: "none found in the defined native/ACP paths"
  adversarial_status: SUPPORTED
- claim_id: C-010
  section: provider-interface
  statement: "Provider transport authority is Zed-owned for native sessions and external-Agent-owned for ACP sessions."
  classification: INFERENCE
  confidence: HIGH
  scope: "Pinned Zed native/ACP architecture; a specific adapter may internally proxy another service."
  source_ids: [S-013, S-017, S-020, S-021]
  fact_dependencies: [C-005, C-006]
  method: "Reasoned from the native model call site and ACP Agent processing role; alternative adapter-internal proxying does not change boundary ownership."
  counterevidence: "none found in Zed `AcpConnection`; adapter internals excluded"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: model-interface
  statement: "Native Zed owns model selection and request parameters, while external model selection is limited to controls the Agent advertises."
  classification: FACT
  confidence: HIGH
  scope: "Pinned native model registry and ACP session modes/config; no live model."
  source_ids: [S-012, S-013, S-017]
  fact_dependencies: []
  method: "Inspected model resolution/request fields and external session capability state."
  counterevidence: "none found in the cited paths"
  adversarial_status: SUPPORTED
- claim_id: C-012
  section: context-interface
  statement: "Native Zed assembles system prompt plus history and performs threshold/manual summary compaction."
  classification: FACT
  confidence: HIGH
  scope: "Pinned native request/compaction code; no semantic-quality claim."
  source_ids: [S-013]
  fact_dependencies: []
  method: "Traced `build_request_messages` and compaction threshold/request paths."
  counterevidence: "none found in native Thread production code"
  adversarial_status: SUPPORTED
- claim_id: C-013
  section: state-persistence-restart
  statement: "Zed persists full native thread state as versioned compressed JSON blobs in a SQLite database at the data directory's `threads/threads.db`."
  classification: FACT
  confidence: HIGH
  scope: "Pinned native serialization and database code; excludes runtime flush/crash observation."
  source_ids: [S-012, S-016]
  fact_dependencies: []
  method: "Traced `Thread::to_db/from_db` and `ThreadsDatabase` save/load/path code."
  counterevidence: "none found in the native persistence path"
  adversarial_status: SUPPORTED
- claim_id: C-014
  section: state-persistence-restart
  statement: "For external ACP sessions Zed persists sidebar metadata, while the external Agent is authoritative for load/resume replay when supported."
  classification: FACT
  confidence: HIGH
  scope: "Pinned Zed metadata and ACP session code; excludes each Agent's backing store."
  source_ids: [S-011, S-017, S-018, S-020]
  fact_dependencies: []
  method: "Compared sidebar schema/session IDs with outbound ACP load/resume RPCs."
  counterevidence: "none found in the cited state paths"
  adversarial_status: SUPPORTED
- claim_id: C-015
  section: concurrency-worktree-isolation
  statement: "Zed statically keys native/ACP work by projects and session IDs and uses running-turn, pending-load, and refcount state to coordinate concurrent work."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned static synchronization; excludes runtime race/collision outcomes."
  source_ids: [S-011, S-012, S-013, S-017]
  fact_dependencies: []
  method: "Inspected project-scoped stores, session maps, running turns, tool futures, and pending-load refcounts."
  counterevidence: "none found statically; no scheduler probe"
  adversarial_status: CHALLENGED
- claim_id: C-016
  section: permissions-authority-sandbox
  statement: "Native Zed enforces tool decisions and can apply a local platform OS sandbox with blocked network and worktree-scoped writes unless explicitly relaxed."
  classification: FACT
  confidence: HIGH
  scope: "Pinned native supported-platform source; no sandbox escape claim."
  source_ids: [S-014, S-015, S-019]
  fact_dependencies: []
  method: "Traced authorization outcomes into effective sandbox policy and command wrapping."
  counterevidence: "explicit persistent/thread unsandboxed settings and unsupported/remote cases narrow the claim"
  adversarial_status: SUPPORTED
- claim_id: C-017
  section: permissions-authority-sandbox
  statement: "Zed's native `ThreadSandbox` does not govern ACP-created terminals or tools executed natively by an external Agent."
  classification: INFERENCE
  confidence: HIGH
  scope: "Pinned `AcpConnection::stdio` handler set and ACP v1 tool role; excludes future protocol versions."
  source_ids: [S-017, S-018, S-019, S-020, S-021, S-030]
  fact_dependencies: [C-006, C-016, C-025]
  method: "Combined ACP Agent tool ownership, unsandboxed `create_terminal_entity` call, and zero native-sandbox references in `AcpConnection`. Alternative hidden wrapping is contradicted by the direct helper call."
  counterevidence: "shared terminal layer supports an optional native SandboxWrap, but ACP handler does not pass it"
  adversarial_status: SUPPORTED
- claim_id: C-018
  section: evidence-observability
  statement: "Zed emits native thread/action/telemetry events and records ACP lines, stderr, session updates, and sidebar metadata, with different durability by channel."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned event/log/storage code; excludes sink behavior and runtime loss."
  source_ids: [S-013, S-017, S-018]
  fact_dependencies: []
  method: "Inspected native telemetry calls, ACP debug taps, update handling, and metadata persistence."
  counterevidence: "ACP debug log is in-memory in the inspected connection path"
  adversarial_status: CHALLENGED
- claim_id: C-019
  section: resource-token-cost-accounting
  statement: "Native Zed accumulates provider token usage, whereas ACP session usage and cost displayed by Zed are optional external-Agent reports."
  classification: FACT
  confidence: HIGH
  scope: "Pinned accounting code and ACP v1 schema/docs; excludes billing reconciliation."
  source_ids: [S-013, S-018, S-021]
  fact_dependencies: []
  method: "Traced native usage accumulation/compaction and ACP `usage_update` handling."
  counterevidence: "none found; cost is explicitly optional"
  adversarial_status: SUPPORTED
- claim_id: C-020
  section: failure-cancellation-retry
  statement: "Native Zed owns bounded retry and cancellation propagation, while ACP cancellation is sent by Zed but completed by the external Agent."
  classification: FACT
  confidence: HIGH
  scope: "Pinned control paths/protocol obligations; excludes runtime timeliness."
  source_ids: [S-013, S-017, S-021]
  fact_dependencies: []
  method: "Traced retry classification/cancellation channels and ACP cancel request/response semantics."
  counterevidence: "ACP docs allow late updates before cancelled response"
  adversarial_status: CHALLENGED
- claim_id: C-021
  section: install-update-release
  statement: "Zed refreshes and caches a mutable latest ACP registry index at most once per hour, and the pinned registry identifies the named Claude, Codex, and OpenCode distributions."
  classification: FACT
  confidence: HIGH
  scope: "Pinned Zed acquisition code and registry manifests; live index content not pinned."
  source_ids: [S-022, S-027, S-028, S-029, S-030]
  fact_dependencies: []
  method: "Inspected URL/throttle/cache parser, manifest metadata, and bounded index-verification search."
  counterevidence: "none found; mutable selector is explicit"
  adversarial_status: CHALLENGED
- claim_id: C-022
  section: install-update-release
  statement: "Binary SHA-256 is optional, but when available Zed verifies it before finalization and removes staging data on mismatch/failure."
  classification: FACT
  confidence: HIGH
  scope: "Pinned binary install/download code; no archive executed."
  source_ids: [S-022, S-023, S-024, S-029]
  fact_dependencies: []
  method: "Traced optional manifest digest through hashing, ensure, cleanup, and finalization."
  counterevidence: "digest-absent branch performs no comparison"
  adversarial_status: SUPPORTED
- claim_id: C-023
  section: install-update-release
  statement: "Zed converts valid registry NPM versions into a `0.0.0 - version` compatibility ceiling and exact-saves the version npm resolves."
  classification: FACT
  confidence: HIGH
  scope: "Pinned NPM command construction; package bytes/install scripts not run."
  source_ids: [S-023, S-027, S-028]
  fact_dependencies: []
  method: "Inspected `bounded_npm_package_spec` and npm install arguments."
  counterevidence: "invalid/non-version package specs are passed through unchanged"
  adversarial_status: CHALLENGED
- claim_id: C-024
  section: tests-qualification
  statement: "The snapshot contains native, ACP, registry, negative, and race-oriented tests, but inventory counts are source matches rather than executed qualification."
  classification: FACT
  confidence: HIGH
  scope: "Pinned test/source inventory; excludes pass/fail and coverage."
  source_ids: [S-012, S-013, S-014, S-016, S-017, S-018, S-022, S-023, S-024, S-031]
  fact_dependencies: []
  method: "Counted test declaration/attribute and CI command references and inspected representative tests."
  counterevidence: "none found; no tests executed"
  adversarial_status: SUPPORTED
- claim_id: C-025
  section: security
  statement: "ACP filesystem RPCs map absolute paths through the Zed project, while ACP terminal creation passes agent-controlled process parameters to Zed's plain project terminal infrastructure."
  classification: FACT
  confidence: HIGH
  scope: "Pinned ACP Client handlers; excludes runtime path/shell exploitation."
  source_ids: [S-017, S-018, S-019]
  fact_dependencies: []
  method: "Traced read/write handlers into project path mapping and terminal handler into the plain helper."
  counterevidence: "none found; native terminal path has a separate optional wrapper"
  adversarial_status: SUPPORTED
- claim_id: C-026
  section: strengths
  statement: "Capability-negotiated ACP roles make loop and resource authority unusually explicit when agents conform."
  classification: INFERENCE
  confidence: HIGH
  scope: "ACP v1 and pinned Zed client; conditioned on honest capability implementation."
  source_ids: [S-011, S-017, S-020, S-021]
  fact_dependencies: [C-006, C-007, C-025]
  method: "Interpreted typed directional methods and capability gates; alternative implicit plugin authority is less explicit."
  counterevidence: "UI uniformity can obscure the split"
  adversarial_status: SUPPORTED
- claim_id: C-027
  section: strengths
  statement: "Native Zed integrates loop, context, permissions, sandbox, accounting, subagents, and persistence in one thread-owned lifecycle."
  classification: INFERENCE
  confidence: HIGH
  scope: "Pinned native source on supported configured platforms."
  source_ids: [S-012, S-013, S-014, S-015, S-016]
  fact_dependencies: [C-005, C-013, C-016]
  method: "Synthesized directly connected native control/data paths; alternative is that runtime defects prevent them, which was not tested."
  counterevidence: "platform/feature/unsandboxed gates narrow sandbox coverage"
  adversarial_status: SUPPORTED
- claim_id: C-028
  section: liabilities
  statement: "A uniform Agent Panel can cause operators to overestimate sandbox authority for external ACP sessions."
  classification: INFERENCE
  confidence: HIGH
  scope: "Pinned UI/ACP boundary; operator cognition not measured."
  source_ids: [S-017, S-018, S-019, S-020, S-021, S-030]
  fact_dependencies: [C-007, C-016, C-025]
  method: "Reasoned from common UI plus materially different enforcement; alternative clear UI warnings were not runtime-observed."
  counterevidence: "source exposes agent identity and permission UI, but released wording was not inspected"
  adversarial_status: SUPPORTED
- claim_id: C-029
  section: liabilities
  statement: "Mutable registry selection, optional binary digest, and ranged NPM resolution weaken repeatable artifact identity."
  classification: INFERENCE
  confidence: HIGH
  scope: "Pinned Zed acquisition paths and three registry examples."
  source_ids: [S-022, S-023, S-024, S-027, S-028, S-029, S-030]
  fact_dependencies: [C-021, C-022, C-023]
  method: "Compared acquisition selectors and verification coverage against immutable reproducibility requirements."
  counterevidence: "OpenCode manifests provide digests and successful installs exact-save resolved NPM versions"
  adversarial_status: SUPPORTED
- claim_id: C-030
  section: transferable-patterns
  statement: "A capability-negotiated client/agent split is a candidate pattern if authority differences remain explicit and client mediation is enforced."
  classification: INFERENCE
  confidence: HIGH
  scope: "Research candidate; no Curiosity design authority."
  source_ids: [S-011, S-017, S-020, S-021]
  fact_dependencies: [C-006, C-007, C-025]
  method: "Abstracted the minimal protocol mechanism and retained its external-authority precondition."
  counterevidence: "nonconforming agents and unsandboxed external tools increase adaptation risk"
  adversarial_status: SUPPORTED
- claim_id: C-031
  section: transferable-patterns
  statement: "Staged download verification is a conditional pattern only when an immutable expected digest is mandatory."
  classification: INFERENCE
  confidence: HIGH
  scope: "Research candidate for artifact acquisition, not adoption."
  source_ids: [S-022, S-023, S-024]
  fact_dependencies: [C-022]
  method: "Abstracted hash-before-finalize/cleanup and conditioned it on digest availability."
  counterevidence: "current digest-absent branch lacks integrity comparison"
  adversarial_status: SUPPORTED
- claim_id: C-032
  section: rejected-patterns-curiosity-no-go
  statement: "Treating native and external Agent Panel sessions as governed by one Zed sandbox policy is rejected for this snapshot."
  classification: INFERENCE
  confidence: HIGH
  scope: "CURIOSITY_NO_GO for the pinned ACP v1 path; future mediation may reopen."
  source_ids: [S-017, S-018, S-019, S-020, S-021, S-030]
  fact_dependencies: [C-006, C-016, C-025]
  method: "Rejected because direct ACP terminal/native-tool paths cross outside native sandbox enforcement."
  counterevidence: "Zed does mediate ACP filesystem calls and permission requests"
  adversarial_status: SUPPORTED
- claim_id: C-033
  section: rejected-patterns-curiosity-no-go
  statement: "Treating the mutable ACP registry path as an immutable release pin is rejected for this snapshot."
  classification: INFERENCE
  confidence: HIGH
  scope: "CURIOSITY_NO_GO for immutable release identity; not rejection of registry UX."
  source_ids: [S-022, S-023, S-024, S-027, S-028, S-029, S-030]
  fact_dependencies: [C-021, C-022, C-023]
  method: "Rejected because selector mutability and optional/ranged identity cannot guarantee repeated bytes."
  counterevidence: "per-binary digests can make individual OpenCode artifacts reproducible"
  adversarial_status: SUPPORTED
- claim_id: C-034
  section: failure-cancellation-retry
  statement: "Runtime denial bypass, malformed input, cancellation cleanup, retry duplication, and partial failure behavior are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Native and ACP runtime probes at pinned source; static evidence only."
  source_ids: [S-013, S-017, S-021, S-030]
  fact_dependencies: []
  method: "attempted_methods=static control/error trace and bounded negative searches; blocker=target/provider/external-agent execution was excluded; impact=runtime safety and idempotency cannot be qualified; available_evidence=S-013,S-017,S-021,S-030; next_probe=fake-provider and fake-ACP fault matrix in disposable isolation"
  counterevidence: "source tests exist but were not run"
  adversarial_status: CHALLENGED
- claim_id: C-035
  section: resource-token-cost-accounting
  statement: "Runtime CPU/memory budgets and reconciliation of Zed or Agent usage against provider totals are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned native/ACP accounting; no credentials or provider totals."
  source_ids: [S-013, S-018, S-021]
  fact_dependencies: []
  method: "attempted_methods=static usage/cost/limit trace; blocker=no live provider, invoice, or credentialed session; impact=budget enforcement and billing accuracy cannot be compared; available_evidence=S-013,S-018,S-021; next_probe=fake contradictory usage plus owner-run provider reconciliation"
  counterevidence: "native context compaction and output/fetch limits are narrower controls"
  adversarial_status: CHALLENGED
- claim_id: C-036
  section: state-persistence-restart
  statement: "Crash consistency, corruption handling, and interrupted native or ACP replay outcomes are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned persistence code; no crash/restart execution."
  source_ids: [S-012, S-016, S-017]
  fact_dependencies: []
  method: "attempted_methods=serializer/database/migration/load trace; blocker=no disposable released-target crash injection; impact=durability and recovery cannot be asserted; available_evidence=S-012,S-016,S-017; next_probe=interrupt saves and ACP replay against disposable state"
  counterevidence: "migrations and load-race tests exist statically"
  adversarial_status: CHALLENGED
- claim_id: C-037
  section: security
  statement: "The coordinated vulnerability-reporting and advisory channel for the three upstream projects is unknown from the bounded repository snapshots."
  classification: UNKNOWN
  confidence: N/A
  scope: "Repository-local policy files only; excludes organization/web security pages."
  source_ids: [S-030]
  fact_dependencies: []
  method: "attempted_methods=glob and git-ls-files searches for repository security markdown; blocker=external organization security/advisory pages not retrieved; impact=disclosure handling cannot be compared; available_evidence=S-030; next_probe=dedicated immutable security-policy API and advisory review"
  counterevidence: "absence in the bounded filenames is not global absence"
  adversarial_status: NOT_PROBED
- claim_id: C-038
  section: module-extension-boundaries
  statement: "Zed's production external-agent path uses ACP schema/protocol v1 despite depending on ACP crate version 2.0.0, while ACP labels v2 documentation Draft."
  classification: FACT
  confidence: HIGH
  scope: "Pinned Cargo manifest, `agent_servers/src`, and ACP docs navigation."
  source_ids: [S-017, S-025, S-026, S-030]
  fact_dependencies: []
  method: "Compared dependency metadata, explicit imports/initialize calls, and bounded v2/v1 reference counts."
  counterevidence: "crate version could be mistaken for wire version; code and docs narrow the claim"
  adversarial_status: SUPPORTED
- claim_id: C-039
  section: state-persistence-restart
  statement: "Current executable native paths persist thread sandbox grants despite stale comments describing them as in-memory-only."
  classification: FACT
  confidence: HIGH
  scope: "Pinned native `Thread`, authorization, and database serialization code."
  source_ids: [S-012, S-014, S-016]
  fact_dependencies: []
  method: "Followed `AllowThread` to `persist_thread_grants` and `to_db/from_db` fields; retained contradictory comments."
  counterevidence: "stale comments at Thread and ThreadSandboxGrants describe in-memory lifetime"
  adversarial_status: CHALLENGED
- claim_id: C-040
  section: install-update-release
  statement: "Operational rollback, failed-update recovery, and configuration migration behavior for external agents are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned registry/archive/NPM install paths; no update execution."
  source_ids: [S-022, S-023, S-024, S-030]
  fact_dependencies: []
  method: "attempted_methods=static update/finalization/cleanup trace and exact rollback/signature search; blocker=no disposable update/install run; impact=operational recovery cannot be asserted; available_evidence=S-022,S-023,S-024,S-030; next_probe=fake interrupted HTTP/npm update with existing prior version and migration fixtures"
  counterevidence: "staging cleanup protects failed binary finalization, but is not a user rollback feature"
  adversarial_status: CHALLENGED
- claim_id: C-041
  section: provider-interface
  statement: "Provider authentication, fallback, rate-limit, and telemetry behavior inside Claude, Codex, and OpenCode ACP agents is unknown in this dossier."
  classification: UNKNOWN
  confidence: N/A
  scope: "Three registry identities only; adapter internals excluded."
  source_ids: [S-017, S-020, S-027, S-028, S-029]
  fact_dependencies: []
  method: "attempted_methods=ACP role trace and manifest inspection; blocker=adapter internals/credentials assigned elsewhere and execution prohibited; impact=external provider comparison unavailable; available_evidence=S-017,S-020,S-027,S-028,S-029; next_probe=use sibling adapter dossiers or credential-free owner-run fakes"
  counterevidence: "manifest names/licenses do not establish provider behavior"
  adversarial_status: NOT_PROBED
- claim_id: C-042
  section: context-interface
  statement: "External agents' context ordering, provenance, truncation, memory, and prompt-injection controls are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "ACP v1 messages and Zed client only; external internals excluded."
  source_ids: [S-018, S-020, S-021]
  fact_dependencies: []
  method: "attempted_methods=ACP content/turn trace and Zed UI-state inspection; blocker=external context assembly is Agent-internal and agents were not run; impact=context safety/quality cannot be normalized; available_evidence=S-018,S-020,S-021; next_probe=adapter-owned fake-provider prompt capture with instruction-like data"
  counterevidence: "ACP types content but does not mandate internal prompt separation"
  adversarial_status: CHALLENGED
- claim_id: C-043
  section: executable-entrypoints
  statement: "Released-build startup and no-op filesystem, process, network, telemetry, and credential side effects are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned static desktop initialization; no target launch."
  source_ids: [S-009, S-010, S-022, S-030]
  fact_dependencies: []
  method: "attempted_methods=static initialization trace; blocker=no released Zed run with denied writes/network; impact=startup operational footprint cannot be qualified; available_evidence=S-009,S-010,S-022,S-030; next_probe=launch a pinned disposable build with empty data dir, denied network, and syscall/process observation"
  counterevidence: "source declares conditional registry fetch and database/cache paths"
  adversarial_status: CHALLENGED
- claim_id: C-044
  section: concurrency-worktree-isolation
  statement: "Runtime race, collision, state-bleed, cleanup, and determinism behavior across sessions/worktrees is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned synchronization/source tests; no concurrent target run."
  source_ids: [S-011, S-012, S-017, S-031]
  fact_dependencies: []
  method: "attempted_methods=static identity/refcount/concurrency trace and test inventory; blocker=no multi-session/worktree execution; impact=isolation quality cannot be asserted; available_evidence=S-011,S-012,S-017,S-031; next_probe=colliding fake native/ACP sessions under deterministic scheduler or race tooling"
  counterevidence: "dedicated regression tests exist but were not run"
  adversarial_status: CHALLENGED
- claim_id: C-045
  section: evidence-observability
  statement: "Evidence loss, redaction, forgery resistance, exportability, and crash durability are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned event/debug/storage code; no sink/runtime probe."
  source_ids: [S-013, S-017, S-018]
  fact_dependencies: []
  method: "attempted_methods=static event/debug/metadata trace; blocker=no runtime failed/denied/cancelled action or export sink; impact=audit reliability cannot be compared; available_evidence=S-013,S-017,S-018; next_probe=fake spoofed/duplicate/dropped ACP updates and native failures with sink inspection"
  counterevidence: "raw ACP lines aid diagnosis but are Agent-controlled and in-memory in scope"
  adversarial_status: CHALLENGED
- claim_id: C-046
  section: tests-qualification
  statement: "The pinned tests' pass/fail results and coverage are unknown because no target tests were executed."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned native/ACP/registry tests; source inventory only."
  source_ids: [S-031]
  fact_dependencies: []
  method: "attempted_methods=bounded static test/CI inventory; blocker=target build/execution exceeded the static depth budget; impact=no runtime claim is qualified by a passing test; available_evidence=S-031; next_probe=focused network-denied fake-provider/ACP/registry test run at the pinned commit"
  counterevidence: "test source presence is not a pass result"
  adversarial_status: NOT_PROBED
```

## 27. Source ledger {#source-ledger}

Bibliography rationale: retained sources are immutable primary code, protocol,
license, or manifest records that directly determine ownership, enforcement, or
artifact identity. Mutable live pages, blogs, popularity, issues, and adapter
internals were rejected because they add less decision value or duplicate sibling
dossiers.

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Pinned Zed repository identity"
  url: "https://github.com/zed-industries/zed/tree/5631830c564afa89b3aba679f45d9c3345f9460f"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-identity"
  symbol: "N/A:no-symbol"
  line_anchor: "N/A:no-line-anchor"
  command: "git -C zed remote get-url origin; git -C zed rev-parse HEAD; git -C zed describe --tags --always; git -C zed status --porcelain; git -C zed submodule status"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; read-only identity inspection; network not used"
  output_or_hash: "inline:https://github.com/zed-industries/zed.git|5631830c564afa89b3aba679f45d9c3345f9460f|nightly|clean|no-submodules"
  access_date: "2026-08-24"
  supports_claims: [C-001]
  notes: "Local clone was clean; no package bytes inspected."
- source_id: S-002
  source_kind: runtime-observation
  title: "Pinned ACP repository identity"
  url: "https://github.com/agentclientprotocol/agent-client-protocol/tree/9bc7ac70e28bf9237107dacc52b588502dbc5e5c"
  commit_or_ref: "schema-v2.0.0-alpha.3-22-g9bc7ac7"
  resolved_commit: "9bc7ac70e28bf9237107dacc52b588502dbc5e5c"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-identity"
  symbol: "N/A:no-symbol"
  line_anchor: "N/A:no-line-anchor"
  command: "git -C acp remote get-url origin; git -C acp rev-parse HEAD; git -C acp describe --tags --always; git -C acp status --porcelain; git -C acp submodule status"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; read-only identity inspection; network not used"
  output_or_hash: "inline:https://github.com/agentclientprotocol/agent-client-protocol.git|9bc7ac70e28bf9237107dacc52b588502dbc5e5c|schema-v2.0.0-alpha.3-22-g9bc7ac7|clean|no-submodules"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-002]
  notes: "Supporting protocol snapshot, not the primary Zed target."
- source_id: S-003
  source_kind: runtime-observation
  title: "Pinned ACP registry repository identity"
  url: "https://github.com/agentclientprotocol/registry/tree/c62ab72e1da29ffc07128b4b75e7bfdf18905295"
  commit_or_ref: "v2026.08.24-c62ab72"
  resolved_commit: "c62ab72e1da29ffc07128b4b75e7bfdf18905295"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-identity"
  symbol: "N/A:no-symbol"
  line_anchor: "N/A:no-line-anchor"
  command: "git -C registry remote get-url origin; git -C registry rev-parse HEAD; git -C registry describe --tags --always; git -C registry status --porcelain; git -C registry submodule status"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; read-only identity inspection; network not used"
  output_or_hash: "inline:https://github.com/agentclientprotocol/registry.git|c62ab72e1da29ffc07128b4b75e7bfdf18905295|v2026.08.24-c62ab72|clean|no-submodules"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-002]
  notes: "Supporting immutable manifest snapshot; distinct from mutable CDN latest."
- source_id: S-004
  source_kind: license
  title: "Zed licensing and maintainer statement"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/README.md#L30-L44"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "README.md"
  symbol: "Licensing"
  line_anchor: "L30-L44"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:README.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; network not used"
  output_or_hash: "sha256:0a1b8417d31d53dfd6b4f1c5cc1a1a6f7ae6d3ac044bdb1938bd49cbd09d8198"
  access_date: "2026-08-24"
  supports_claims: [C-002]
  notes: "Project statement selected over secondary license summaries."
- source_id: S-005
  source_kind: release-metadata
  title: "Native agent crate metadata"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/agent/Cargo.toml#L1-L24"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "agent@0.1.0+repository-source-only"
  code_path: "crates/agent/Cargo.toml"
  symbol: "package agent"
  line_anchor: "L1-L24"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/agent/Cargo.toml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; network not used"
  output_or_hash: "sha256:e5920c51dc144b3f86a85b2a81d13435957393ba8216b1cb06191310ec7650b4"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003]
  notes: "No crate package bytes inspected; metadata records GPL-3.0-or-later."
- source_id: S-006
  source_kind: license
  title: "Zed GPL license text"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/LICENSE-GPL#L1-L30"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE-GPL"
  symbol: "GNU General Public License Version 3"
  line_anchor: "L1-L30"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:LICENSE-GPL | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; network not used"
  output_or_hash: "sha256:0aa0322ea494da441088e4d9144c6720bf99d9e2e1eefcd29d1f58b19b5c4246"
  access_date: "2026-08-24"
  supports_claims: [C-002]
  notes: "Actual license text retained separately from package metadata."
- source_id: S-007
  source_kind: license
  title: "ACP Apache-2.0 license"
  url: "https://github.com/agentclientprotocol/agent-client-protocol/blob/9bc7ac70e28bf9237107dacc52b588502dbc5e5c/LICENSE#L1-L5"
  commit_or_ref: "schema-v2.0.0-alpha.3-22-g9bc7ac7"
  resolved_commit: "9bc7ac70e28bf9237107dacc52b588502dbc5e5c"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE"
  symbol: "Apache License Version 2.0"
  line_anchor: "L1-L5"
  command: "git -C acp show 9bc7ac70e28bf9237107dacc52b588502dbc5e5c:LICENSE | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; network not used"
  output_or_hash: "sha256:f250d08cee4549b22b3b4aaaf3a743473336fd280316df5d0340717e5127a221"
  access_date: "2026-08-24"
  supports_claims: [C-002]
  notes: "Primary repository license text."
- source_id: S-008
  source_kind: license
  title: "ACP registry Apache-2.0 license"
  url: "https://github.com/agentclientprotocol/registry/blob/c62ab72e1da29ffc07128b4b75e7bfdf18905295/LICENSE#L1-L5"
  commit_or_ref: "v2026.08.24-c62ab72"
  resolved_commit: "c62ab72e1da29ffc07128b4b75e7bfdf18905295"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE"
  symbol: "Apache License Version 2.0"
  line_anchor: "L1-L5"
  command: "git -C registry show c62ab72e1da29ffc07128b4b75e7bfdf18905295:LICENSE | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; network not used"
  output_or_hash: "sha256:7f0f022815d9ffe57a2b9a717d49893f77bfed052f16af179dcb99dbbb6f6ab8"
  access_date: "2026-08-24"
  supports_claims: [C-002]
  notes: "Primary repository license text."
- source_id: S-009
  source_kind: repository-file
  title: "Zed desktop agent composition"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/zed/src/main.rs#L698-L727"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/zed/src/main.rs"
  symbol: "main application initialization closure"
  line_anchor: "L698-L727"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/zed/src/main.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection"
  output_or_hash: "sha256:ec5171b74c16b02620269717b8d7010caf0a13eb59367948ff3f8767f3d46da0"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-004, C-043]
  notes: "Production composition source; not executed."
- source_id: S-010
  source_kind: repository-file
  title: "Agent UI initialization"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/agent_ui/src/agent_ui.rs#L580-L650"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/agent_ui/src/agent_ui.rs"
  symbol: "agent_ui::init"
  line_anchor: "L580-L650"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/agent_ui/src/agent_ui.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection"
  output_or_hash: "sha256:b462110c63467f9a55354de3c140142c5eca3844c31a185fb07aff1b5c2e044f"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-004, C-043]
  notes: "Production initialization source; not executed."
- source_id: S-011
  source_kind: repository-file
  title: "Project-scoped agent connection store"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/agent_ui/src/agent_connection_store.rs#L69-L312"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/agent_ui/src/agent_connection_store.rs"
  symbol: "AgentConnectionStore"
  line_anchor: "L69-L312"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/agent_ui/src/agent_connection_store.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection"
  output_or_hash: "sha256:87c68918effbadf9e9922bc9572890d65eba79ab85c35be12111c0782c1f0a0e"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-007, C-014, C-015, C-026, C-030, C-044]
  notes: "Project lifecycle/trait-object source."
- source_id: S-012
  source_kind: repository-file
  title: "Native Thread state, subagents, and persistence conversion"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/agent/src/thread.rs#L1261-L1952"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/agent/src/thread.rs"
  symbol: "Thread; Thread::new_subagent; Thread::from_db; Thread::to_db"
  line_anchor: "L1261-L1952"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/agent/src/thread.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection"
  output_or_hash: "sha256:78f5dd80343f518e3207a1a7a0c70659a1078fd76b149996d7e140544cc4cde4"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-011, C-013, C-015, C-024, C-027, C-036, C-039, C-044]
  notes: "Same immutable file is split into focused source records S-012 through S-014."
- source_id: S-013
  source_kind: repository-file
  title: "Native model/tool loop, context, retry, and accounting"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/agent/src/thread.rs#L2521-L4568"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/agent/src/thread.rs"
  symbol: "Thread::send; run_turn_internal; build_completion_request; enabled_tools; retry_strategy_for"
  line_anchor: "L2521-L4568"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/agent/src/thread.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection"
  output_or_hash: "sha256:78f5dd80343f518e3207a1a7a0c70659a1078fd76b149996d7e140544cc4cde4"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-009, C-010, C-011, C-012, C-015, C-018, C-019, C-020, C-024, C-027, C-034, C-035, C-042, C-045]
  notes: "Static structure only; inline tests not executed."
- source_id: S-014
  source_kind: repository-file
  title: "Native tool and sandbox authorization"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/agent/src/thread.rs#L5631-L6128"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/agent/src/thread.rs"
  symbol: "ToolCallEventStream::authorize; authorize_sandbox; handle_sandbox_permission_outcome"
  line_anchor: "L5631-L6128"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/agent/src/thread.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection"
  output_or_hash: "sha256:78f5dd80343f518e3207a1a7a0c70659a1078fd76b149996d7e140544cc4cde4"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-016, C-024, C-025, C-027, C-039]
  notes: "Retains stale in-memory wording as counterevidence to current persistence calls."
- source_id: S-015
  source_kind: repository-file
  title: "Native terminal sandbox policy"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/agent/src/sandboxing.rs#L1-L430"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/agent/src/sandboxing.rs"
  symbol: "ThreadSandbox; sandboxing_enabled_for_project; SandboxRequest; ThreadSandboxGrants"
  line_anchor: "L1-L430"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/agent/src/sandboxing.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection"
  output_or_hash: "sha256:405e0fe1660130521e724191c7a7f0a9701a78da9e69512a01abb3b63fdc5a4f"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-024, C-025, C-027]
  notes: "Platform implementations not executed; comments explicitly preserve unsupported/unsandboxed cases."
- source_id: S-016
  source_kind: repository-file
  title: "Native thread SQLite storage"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/agent/src/db.rs#L188-L697"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/agent/src/db.rs"
  symbol: "DbThread; ThreadsDatabase"
  line_anchor: "L188-L697"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/agent/src/db.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection"
  output_or_hash: "sha256:b82b2560cd4823bd265ee5435c75c3516cdf8bef83e38370eb332fa4b35bc0fb"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-024, C-027, C-036, C-039]
  notes: "Database path/schema/serialization source; no database opened by this research."
- source_id: S-017
  source_kind: repository-file
  title: "Zed ACP stdio connection and Client handlers"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/agent_servers/src/acp.rs#L641-L2072"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/agent_servers/src/acp.rs"
  symbol: "connect_client_future; AcpConnection::stdio; impl AgentConnection for AcpConnection"
  line_anchor: "L641-L2072"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/agent_servers/src/acp.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection"
  output_or_hash: "sha256:5ddcbcd2e3d0729b992be3568ed979c7524ede1b71e6a1c9895ec0efeefbeb6b"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-006, C-007, C-008, C-010, C-011, C-014, C-015, C-017, C-018, C-020, C-025, C-026, C-028, C-030, C-032, C-034, C-036, C-038, C-041, C-043, C-044, C-045]
  notes: "Additional client filesystem/terminal handlers are at L4752-L5137 in the same hashed file. Tests are inline but unexecuted."
- source_id: S-018
  source_kind: repository-file
  title: "Shared ACP thread filesystem, usage, and UI state"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/acp_thread/src/acp_thread.rs#L2549-L2654"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/acp_thread/src/acp_thread.rs"
  symbol: "AcpThread::handle_session_update; read_text_file; write_text_file; create_terminal"
  line_anchor: "L2549-L4459"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/acp_thread/src/acp_thread.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection"
  output_or_hash: "sha256:a33abbee9c05347d935cfc4c3565ad832f2ee4d7ddda10d58d6f5e9eccd2d586"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-017, C-018, C-019, C-025, C-028, C-032, C-035, C-042, C-045]
  notes: "UI/shared adapter code; does not itself establish external Agent internals."
- source_id: S-019
  source_kind: repository-file
  title: "Sandbox wrapper and plain external terminal helper"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/acp_thread/src/terminal.rs#L24-L83"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/acp_thread/src/terminal.rs"
  symbol: "SandboxWrap; prepare_sandbox_wrap; create_terminal_entity"
  line_anchor: "L24-L664"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/acp_thread/src/terminal.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection"
  output_or_hash: "sha256:0055668f74c1850238b41ac0a39ec86cc78dd29022b0664663312a1fcd1c09ab"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-017, C-025, C-028, C-032]
  notes: "The optional native wrapper and plain helper are deliberately compared; neither was executed."
- source_id: S-020
  source_kind: official-documentation
  title: "ACP v1 overview and role directions"
  url: "https://github.com/agentclientprotocol/agent-client-protocol/blob/9bc7ac70e28bf9237107dacc52b588502dbc5e5c/docs/protocol/v1/overview.mdx#L6-L237"
  commit_or_ref: "schema-v2.0.0-alpha.3-22-g9bc7ac7"
  resolved_commit: "9bc7ac70e28bf9237107dacc52b588502dbc5e5c"
  package_identity: "N/A:not-a-package"
  code_path: "docs/protocol/v1/overview.mdx"
  symbol: "Communication Model; Agent; Client"
  line_anchor: "L6-L237"
  command: "git -C acp show 9bc7ac70e28bf9237107dacc52b588502dbc5e5c:docs/protocol/v1/overview.mdx | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static documentation inspection"
  output_or_hash: "sha256:371695a6aab3055b18e31b37d4e211ab311efebbc5f7d9a072bb881293504036"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-007, C-008, C-010, C-014, C-017, C-025, C-026, C-028, C-030, C-032, C-041, C-042]
  notes: "Primary protocol documentation; documents obligations, not independent conformance measurement."
- source_id: S-021
  source_kind: official-documentation
  title: "ACP v1 prompt turn, tool, usage, and cancellation lifecycle"
  url: "https://github.com/agentclientprotocol/agent-client-protocol/blob/9bc7ac70e28bf9237107dacc52b588502dbc5e5c/docs/protocol/v1/prompt-turn.mdx#L6-L345"
  commit_or_ref: "schema-v2.0.0-alpha.3-22-g9bc7ac7"
  resolved_commit: "9bc7ac70e28bf9237107dacc52b588502dbc5e5c"
  package_identity: "N/A:not-a-package"
  code_path: "docs/protocol/v1/prompt-turn.mdx"
  symbol: "Prompt Turn Lifecycle"
  line_anchor: "L6-L345"
  command: "git -C acp show 9bc7ac70e28bf9237107dacc52b588502dbc5e5c:docs/protocol/v1/prompt-turn.mdx | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static documentation inspection"
  output_or_hash: "sha256:ba14a6cf5379dbce857f1d954b48b5f2a9d0c1365bbf48592f59dad081aeb169"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-009, C-010, C-017, C-019, C-020, C-026, C-028, C-030, C-032, C-034, C-035, C-041, C-042]
  notes: "Primary protocol documentation; examples are not Zed runtime observations."
- source_id: S-022
  source_kind: repository-file
  title: "Zed ACP registry refresh, cache, and manifest parsing"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/project/src/agent_registry_store.rs#L20-L665"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/project/src/agent_registry_store.rs"
  symbol: "REGISTRY_URL; AgentRegistryStore; fetch_registry_index; RegistryBinaryTarget"
  line_anchor: "L20-L665"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/project/src/agent_registry_store.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection"
  output_or_hash: "sha256:a2900912848bf9ddd0d673b1e742419e6771497af85e890ac597594e0f853e78"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-021, C-022, C-029, C-031, C-033, C-040, C-043]
  notes: "The live CDN URL is mutable; code snapshot is immutable."
- source_id: S-023
  source_kind: repository-file
  title: "External archive and NPM agent command construction"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/project/src/agent_server_store.rs#L1023-L1468"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:package-bytes-not-inspected"
  code_path: "crates/project/src/agent_server_store.rs"
  symbol: "LocalRegistryArchiveAgent::get_command; LocalRegistryNpxAgent::get_command; bounded_npm_package_spec"
  line_anchor: "L1023-L1468"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/project/src/agent_server_store.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection; no npm/package execution"
  output_or_hash: "sha256:eaca8bd80d7767ab8ad6028b8db0faf1563fcfd15d7994a1abdb958eca6bafbf"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-022, C-023, C-024, C-025, C-029, C-031, C-033, C-040]
  notes: "Command construction only; install scripts and resolved package bytes were not inspected."
- source_id: S-024
  source_kind: repository-file
  title: "Staged download checksum and cleanup"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/crates/http_client/src/github_download.rs#L14-L206"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:download-helper-source"
  code_path: "crates/http_client/src/github_download.rs"
  symbol: "download_server_binary; download_server_raw_binary; extract_to_staging"
  line_anchor: "L14-L206"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:crates/http_client/src/github_download.rs | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static inspection; no artifact execution"
  output_or_hash: "sha256:092acf2b05eb78d83b891226246690542c2365b4b09b918fa6efc0d6fdf29a84"
  access_date: "2026-08-24"
  supports_claims: [C-022, C-024, C-025, C-029, C-031, C-033, C-040]
  notes: "Digest-absent branch retained as counterevidence."
- source_id: S-025
  source_kind: release-metadata
  title: "Zed ACP crate dependency version"
  url: "https://github.com/zed-industries/zed/blob/5631830c564afa89b3aba679f45d9c3345f9460f/Cargo.toml#L509-L519"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "agent-client-protocol@=2.0.0+Cargo-manifest-only"
  code_path: "Cargo.toml"
  symbol: "workspace.dependencies.agent-client-protocol"
  line_anchor: "L509-L519"
  command: "git -C zed show 5631830c564afa89b3aba679f45d9c3345f9460f:Cargo.toml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static manifest inspection"
  output_or_hash: "sha256:b968382a933d106d9322ea5f89dccdb3d11ef9f5ae5c9f3a4f5154a84b1fbbf3"
  access_date: "2026-08-24"
  supports_claims: [C-038]
  notes: "Package version is not interpreted as wire-protocol version."
- source_id: S-026
  source_kind: official-documentation
  title: "ACP documentation version navigation"
  url: "https://github.com/agentclientprotocol/agent-client-protocol/blob/9bc7ac70e28bf9237107dacc52b588502dbc5e5c/docs/docs.json#L76-L165"
  commit_or_ref: "schema-v2.0.0-alpha.3-22-g9bc7ac7"
  resolved_commit: "9bc7ac70e28bf9237107dacc52b588502dbc5e5c"
  package_identity: "N/A:not-a-package"
  code_path: "docs/docs.json"
  symbol: "navigation v1/v2 groups"
  line_anchor: "L76-L165"
  command: "git -C acp show 9bc7ac70e28bf9237107dacc52b588502dbc5e5c:docs/docs.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; static documentation config inspection"
  output_or_hash: "sha256:a72af0cef33cdc7ff15518114e0f590194ec2c845d15eb68c686404a5470f6bf"
  access_date: "2026-08-24"
  supports_claims: [C-038]
  notes: "v2 group is explicitly tagged Draft."
- source_id: S-027
  source_kind: release-metadata
  title: "Claude ACP registry manifest"
  url: "https://github.com/agentclientprotocol/registry/blob/c62ab72e1da29ffc07128b4b75e7bfdf18905295/claude-acp/agent.json#L1-L18"
  commit_or_ref: "v2026.08.24-c62ab72"
  resolved_commit: "c62ab72e1da29ffc07128b4b75e7bfdf18905295"
  package_identity: "@agentclientprotocol/claude-agent-acp@0.70.0+N/A:package-bytes-not-inspected"
  code_path: "claude-acp/agent.json"
  symbol: "JSON root"
  line_anchor: "L1-L18"
  command: "git -C registry show c62ab72e1da29ffc07128b4b75e7bfdf18905295:claude-acp/agent.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; metadata only; no npm execution"
  output_or_hash: "sha256:cb69f93014a5f0f3f5ffba7ecbc72dbddc7844604dabe024a3c5f3b7748fda62"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-023, C-029, C-033, C-041]
  notes: "Manifest marks proprietary; no runtime or package-byte claim."
- source_id: S-028
  source_kind: release-metadata
  title: "Codex ACP registry manifest"
  url: "https://github.com/agentclientprotocol/registry/blob/c62ab72e1da29ffc07128b4b75e7bfdf18905295/codex-acp/agent.json#L1-L18"
  commit_or_ref: "v2026.08.24-c62ab72"
  resolved_commit: "c62ab72e1da29ffc07128b4b75e7bfdf18905295"
  package_identity: "@agentclientprotocol/codex-acp@1.6.2+N/A:package-bytes-not-inspected"
  code_path: "codex-acp/agent.json"
  symbol: "JSON root"
  line_anchor: "L1-L18"
  command: "git -C registry show c62ab72e1da29ffc07128b4b75e7bfdf18905295:codex-acp/agent.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; metadata only; no npm execution"
  output_or_hash: "sha256:2da3c44c360f6c802167341fb7cc77745ba4fe7bb786d8c469a4f41b1e0526a2"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-023, C-029, C-033, C-041]
  notes: "Manifest marks Apache-2.0; no runtime or package-byte claim."
- source_id: S-029
  source_kind: release-metadata
  title: "OpenCode ACP registry manifest"
  url: "https://github.com/agentclientprotocol/registry/blob/c62ab72e1da29ffc07128b4b75e7bfdf18905295/opencode/agent.json#L1-L65"
  commit_or_ref: "v2026.08.24-c62ab72"
  resolved_commit: "c62ab72e1da29ffc07128b4b75e7bfdf18905295"
  package_identity: "opencode@1.18.22+six-manifest-sha256-values"
  code_path: "opencode/agent.json"
  symbol: "distribution.binary"
  line_anchor: "L1-L65"
  command: "git -C registry show c62ab72e1da29ffc07128b4b75e7bfdf18905295:opencode/agent.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; shasum 6.02; manifest only; binaries not executed"
  output_or_hash: "sha256:9116b5869b4897c8e80db293dacd84e2120d934da7e18a7458861a0403f61f16"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-022, C-029, C-033, C-041]
  notes: "Manifest marks MIT and gives six platform SHA-256 values; artifact bytes not inspected in this dossier."
- source_id: S-030
  source_kind: runtime-observation
  title: "Bounded negative and contradiction searches"
  url: "https://github.com/zed-industries/zed/tree/5631830c564afa89b3aba679f45d9c3345f9460f/crates"
  commit_or_ref: "nightly plus supporting pinned ACP and registry commits"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/agent_servers/src; crates/project/src/agent_registry_store.rs; crates/project/src/agent_server_store.rs; crates/http_client/src/github_download.rs"
  symbol: "bounded ripgrep probes"
  line_anchor: "N/A:cross-file-search"
  command: "printf 'agent_servers_v2_checkpoint_rollback='; rg -n 'schema::v2|ProtocolVersion::V2|checkpoint|rollback' zed/crates/agent_servers/src --glob '*.rs' | wc -l; printf 'acp_connection_native_sandbox='; rg -n 'ThreadSandbox|SandboxWrap|sandboxing_enabled|prepare_sandbox' zed/crates/agent_servers/src/acp.rs | wc -l; printf 'registry_index_signature_verification='; rg -n 'verify.{0,30}(registry|index)|signature|signed.{0,20}(registry|index)|(registry|index).{0,20}(digest|sha256)' zed/crates/project/src/agent_registry_store.rs | wc -l; printf 'repository_security_files='; for repo in zed acp registry; do git -C \"$repo\" ls-files | rg '(^|/)(SECURITY|security)\\.md$' || true; done | wc -l; printf 'agent_servers_v1_refs='; rg -n 'schema::v1|ProtocolVersion::V1' zed/crates/agent_servers/src --glob '*.rs' | wc -l"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; ripgrep 15.2.0; clean pinned clones; static searches only"
  output_or_hash: "inline:agent_servers_v2_checkpoint_rollback=0;acp_connection_native_sandbox=0;registry_index_signature_verification=0;repository_security_files=0;agent_servers_v1_refs=8"
  access_date: "2026-08-24"
  supports_claims: [C-017, C-021, C-028, C-029, C-032, C-033, C-034, C-037, C-038, C-040, C-043]
  notes: "Negative results are bounded, not global absence. First run used paths relative to the wrong parent and produced IO errors; it was rejected and rerun with `zed/` prefixes. A first rollback search matched Rust `downgrade()` identifiers; it was rejected and rerun with exact word boundaries, yielding 0 rollback and 0 signature references in the three install files. Separate glob and git-ls-files methods both found no repository-local SECURITY.md."
- source_id: S-031
  source_kind: runtime-observation
  title: "Static test and CI inventory"
  url: "https://github.com/zed-industries/zed/tree/5631830c564afa89b3aba679f45d9c3345f9460f/crates"
  commit_or_ref: "nightly"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "crates/agent; crates/agent_servers; crates/acp_thread; crates/project; .github/workflows; script"
  symbol: "test declaration and command inventory"
  line_anchor: "N/A:cross-file-search"
  command: "printf 'native_tests='; rg -n '^\\s*(async\\s+)?fn test_|#\\[(gpui::)?test' zed/crates/agent/src/thread.rs zed/crates/agent/src/tests --glob '*.rs' | wc -l; printf 'acp_tests='; rg -n '^\\s*(async\\s+)?fn test_|#\\[(gpui::)?test' zed/crates/agent_servers/src/acp.rs zed/crates/acp_thread/src --glob '*.rs' | wc -l; printf 'registry_tests='; rg -n '^\\s*(async\\s+)?fn test_|#\\[(gpui::)?test' zed/crates/project/src/agent_registry_store.rs zed/crates/project/src/agent_server_store.rs zed/crates/project/tests/integration/agent_registry_store.rs --glob '*.rs' | wc -l; printf 'ci_test_command_refs='; rg -n 'cargo (nextest|test)' zed/.github/workflows zed/script --glob '*.{yml,yaml,sh}' | wc -l"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; ripgrep 15.2.0; static inventory; no target tests run"
  output_or_hash: "inline:native_tests=300;acp_tests=277;registry_tests=22;ci_test_command_refs=11"
  access_date: "2026-08-24"
  supports_claims: [C-024, C-044, C-046]
  notes: "Counts are matching declaration/attribute lines, not unique test counts or coverage."
- source_id: S-032
  source_kind: runtime-observation
  title: "URL/link-check for retained primary sources"
  url: "https://github.com/zed-industries/zed/tree/5631830c564afa89b3aba679f45d9c3345f9460f"
  commit_or_ref: "three pinned commits plus N/A:web-unversioned CDN endpoint"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:cross-source-link-check"
  symbol: "URL-check"
  line_anchor: "N/A:no-line-anchor"
  command: "For the 26 unique immutable GitHub file URLs in S-004 through S-029 plus https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json, run: curl -L --max-time 20 --retry 1 -A 'curiosity-research-link-check/1.0' -s -o /dev/null -w '%{http_code}' URL; count 2xx/3xx as reachable."
  command_environment: "macOS 27.0 arm64; curl 8.7.1; passive public HTTPS; no credentials"
  output_or_hash: "inline:URL-check total=27 ok=27 failed=0"
  access_date: "2026-08-24"
  supports_claims: [C-001]
  notes: "First shell attempt used zsh read-only variable `status` and exited before checking; rejected and rerun with `http_code`. Reachability does not prove content correctness."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "zed-agent-native-acp-2026-08-24"
target_kind: "HARNESS"
target_name: "Zed Agent"
feature_name: "Zed-native Agent Panel and ACP external-agent boundary"
snapshot:
  repository_url: "https://github.com/zed-industries/zed"
  resolved_commit: "5631830c564afa89b3aba679f45d9c3345f9460f"
  observed_ref: "nightly"
  package_identity: "N/A:not-a-package"
research:
  researcher: "ses_fc91c3544ffduOXWpgttkGkgLI"
  owned_path: "research/harnesses/zed-agent.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: identity_snapshot
    coverage: OBSERVED
    summary: "Three clean immutable repository snapshots bound the analysis."
    confidence: HIGH
    claim_ids: [C-001]
    source_ids: [S-001, S-002, S-003, S-032]
    pattern_disposition: NO_POSITION
  - dimension: provenance_license
    coverage: OBSERVED
    summary: "Zed native code and supporting ACP/registry license texts were separately pinned."
    confidence: HIGH
    claim_ids: [C-002]
    source_ids: [S-004, S-005, S-006, S-007, S-008]
    pattern_disposition: NO_POSITION
  - dimension: repository_package_map
    coverage: OBSERVED
    summary: "Production native, UI, ACP, project, and download responsibilities were mapped."
    confidence: HIGH
    claim_ids: [C-003]
    source_ids: [S-009, S-010, S-011, S-022]
    pattern_disposition: NO_POSITION
  - dimension: executable_entrypoints
    coverage: PARTIAL
    summary: "Desktop initialization and external child spawn are traced, but startup effects are unexecuted."
    confidence: MEDIUM
    claim_ids: [C-004, C-043]
    source_ids: [S-009, S-010, S-017, S-030]
    pattern_disposition: NO_POSITION
  - dimension: control_data_flow
    coverage: OBSERVED
    summary: "Native Zed owns its loop; external ACP Agent owns its loop and native tools."
    confidence: HIGH
    claim_ids: [C-005, C-006]
    source_ids: [S-013, S-017, S-020, S-021]
    pattern_disposition: NO_POSITION
  - dimension: module_extension_boundaries
    coverage: OBSERVED
    summary: "AgentConnection and ACP capabilities define the extension boundary, which remains wire v1."
    confidence: HIGH
    claim_ids: [C-007, C-038]
    source_ids: [S-011, S-017, S-025, S-026, S-030]
    pattern_disposition: NO_POSITION
  - dimension: agent_interface
    coverage: PARTIAL
    summary: "Native child threads and opaque ACP sessions are structurally mapped without runtime topology."
    confidence: HIGH
    claim_ids: [C-008]
    source_ids: [S-012, S-017, S-020]
    pattern_disposition: NO_POSITION
  - dimension: tool_interface
    coverage: PARTIAL
    summary: "Native filtering/schema/approval is visible; external native tools remain adapter-owned."
    confidence: HIGH
    claim_ids: [C-009, C-017]
    source_ids: [S-013, S-014, S-017, S-021]
    pattern_disposition: NO_POSITION
  - dimension: provider_interface
    coverage: UNKNOWN
    summary: "Ownership split is clear, but named external agents' provider internals are excluded."
    confidence: N/A
    claim_ids: [C-010, C-041]
    source_ids: [S-013, S-017, S-020, S-027, S-028, S-029]
    pattern_disposition: NO_POSITION
  - dimension: model_interface
    coverage: PARTIAL
    summary: "Native model controls are observed; external controls depend on Agent-advertised state."
    confidence: HIGH
    claim_ids: [C-011, C-038]
    source_ids: [S-012, S-013, S-017, S-025, S-026]
    pattern_disposition: NO_POSITION
  - dimension: context_interface
    coverage: UNKNOWN
    summary: "Native context/compaction is visible; external context safety and memory are opaque."
    confidence: N/A
    claim_ids: [C-012, C-042]
    source_ids: [S-013, S-018, S-020, S-021]
    pattern_disposition: NO_POSITION
  - dimension: state_persistence_restart
    coverage: UNKNOWN
    summary: "Native and metadata stores are mapped, but crash/replay recovery is unexecuted."
    confidence: N/A
    claim_ids: [C-013, C-014, C-036, C-039]
    source_ids: [S-011, S-012, S-014, S-016, S-017, S-018]
    pattern_disposition: NO_POSITION
  - dimension: concurrency_worktree_isolation
    coverage: UNKNOWN
    summary: "Static keys/refcounts exist, but collision and race outcomes are unknown."
    confidence: N/A
    claim_ids: [C-015, C-044]
    source_ids: [S-011, S-012, S-013, S-017, S-031]
    pattern_disposition: NO_POSITION
  - dimension: permissions_authority_sandbox
    coverage: PARTIAL
    summary: "Native sandbox enforcement and external unsandboxed terminal boundary are statically explicit."
    confidence: HIGH
    claim_ids: [C-016, C-017, C-025]
    source_ids: [S-014, S-015, S-017, S-018, S-019, S-030]
    pattern_disposition: NO_POSITION
  - dimension: evidence_observability
    coverage: UNKNOWN
    summary: "Events/debug/metadata are mapped; loss, forgery, redaction, and durability are unknown."
    confidence: N/A
    claim_ids: [C-018, C-045]
    source_ids: [S-013, S-017, S-018]
    pattern_disposition: NO_POSITION
  - dimension: resource_token_cost_accounting
    coverage: UNKNOWN
    summary: "Token/cost paths exist, but budgets and provider reconciliation are unknown."
    confidence: N/A
    claim_ids: [C-019, C-035]
    source_ids: [S-013, S-018, S-021]
    pattern_disposition: NO_POSITION
  - dimension: failure_cancellation_retry
    coverage: UNKNOWN
    summary: "Static retry/cancel ownership is clear; runtime cleanup/idempotency is unknown."
    confidence: N/A
    claim_ids: [C-020, C-034]
    source_ids: [S-013, S-017, S-021, S-030]
    pattern_disposition: NO_POSITION
  - dimension: install_update_release
    coverage: UNKNOWN
    summary: "Mutable/ranged/optional-integrity acquisition is observed; rollback behavior is unknown."
    confidence: N/A
    claim_ids: [C-021, C-022, C-023, C-040]
    source_ids: [S-022, S-023, S-024, S-027, S-028, S-029, S-030]
    pattern_disposition: NO_POSITION
  - dimension: tests_qualification
    coverage: UNKNOWN
    summary: "Substantial test source exists, but no target test was executed."
    confidence: N/A
    claim_ids: [C-024, C-046]
    source_ids: [S-012, S-013, S-017, S-022, S-023, S-024, S-031]
    pattern_disposition: NO_POSITION
  - dimension: security
    coverage: UNKNOWN
    summary: "Static controls are mapped; runtime resistance and disclosure channels are not qualified."
    confidence: N/A
    claim_ids: [C-017, C-025, C-037]
    source_ids: [S-014, S-015, S-017, S-018, S-019, S-022, S-023, S-024, S-030]
    pattern_disposition: NO_POSITION
  - dimension: strengths
    coverage: OBSERVED
    summary: "Explicit ACP ownership and integrated native lifecycle are evidence-backed strengths."
    confidence: HIGH
    claim_ids: [C-026, C-027]
    source_ids: [S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-020, S-021]
    pattern_disposition: NO_POSITION
  - dimension: liabilities
    coverage: OBSERVED
    summary: "Safety-policy asymmetry and mutable acquisition are the principal liabilities."
    confidence: HIGH
    claim_ids: [C-028, C-029, C-039]
    source_ids: [S-012, S-014, S-016, S-017, S-018, S-019, S-022, S-023, S-024, S-030]
    pattern_disposition: NO_POSITION
  - dimension: transferable_patterns
    coverage: PARTIAL
    summary: "Capability split is a candidate; staged verification is conditional on mandatory digest."
    confidence: HIGH
    claim_ids: [C-030, C-031]
    source_ids: [S-011, S-017, S-020, S-021, S-022, S-023, S-024]
    pattern_disposition: CONDITIONAL
  - dimension: rejected_patterns_curiosity_no_go
    coverage: OBSERVED
    summary: "Unified sandbox assumptions and mutable registry pins are CURIOSITY_NO_GO."
    confidence: HIGH
    claim_ids: [C-032, C-033]
    source_ids: [S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-030]
    pattern_disposition: CURIOSITY_NO_GO
strength_ids: [C-026, C-027]
liability_ids: [C-028, C-029]
transferable_pattern_ids: [C-030, C-031]
curiosity_no_go_ids: [C-032, C-033]
unknown_claim_ids: [C-034, C-035, C-036, C-037, C-040, C-041, C-042, C-043, C-044, C-045, C-046]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| Claim | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-034 | Runtime denial/cancel/retry/idempotency cannot be scored | Fake-provider and fake-ACP fault matrix | Disposable build, no secrets/network | UNASSIGNED |
| C-035 | Cost/budget enforcement cannot be compared | Contradictory fake usage then provider-total reconciliation | Fake first; credentialed owner run second | UNASSIGNED |
| C-036 | Restart durability cannot be asserted | Interrupt native save and ACP replay | Disposable data/project directories | UNASSIGNED |
| C-037 | Disclosure process is absent from comparison | Immutable security-policy/advisory review | Public web/API only | UNASSIGNED |
| C-040 | Update rollback/recovery cannot be asserted | Fake interrupted HTTP/npm update with prior version | Disposable installer/cache, no scripts | UNASSIGNED |
| C-041 | Named external provider behavior is not normalized | Use sibling adapter dossiers or credential-free fakes | Separate assigned ownership | UNASSIGNED |
| C-042 | External context safety is opaque | Fake-provider prompt capture with instruction-like data | Adapter-owned isolated fixture | UNASSIGNED |
| C-043 | Startup footprint is unknown | Released-build denied-write/network startup trace | Disposable OS sandbox, no secrets | UNASSIGNED |
| C-044 | Isolation races are unknown | Colliding native/ACP sessions under race tooling | Disposable multi-worktree project | UNASSIGNED |
| C-045 | Audit/evidence reliability is unknown | Spoof/drop/duplicate/cancel update matrix | Fake ACP agent and observable sinks | UNASSIGNED |
| C-046 | Tests do not qualify runtime claims | Focused pinned fake-provider/ACP/registry tests | Network-denied disposable build | UNASSIGNED |

### Handoff and stop decision

- **Owned file:** `research/harnesses/zed-agent.md`; no other file was edited by this research.
- **URL/link-check:** 27/27 retained immutable-source/CDN URLs reachable; the first zsh command failed on read-only variable `status`, was retained as a limitation, and was rerun correctly.
- **Checks to run after writing:** dossier validator, `git diff --check`, exact path ownership/status, and final URL extraction check.
- **Pre-existing workspace changes left untouched:** `M apps/plugin/opencode2/turbo.json`, `?? docs/architecture/`, and pre-existing untracked `research/` content.
- **Recommendations to later synthesis:** compare native Zed and ACP external sessions as two authority models; keep external-agent native tools outside any Zed sandbox score; require immutable signed index/artifact identity before treating registry acquisition as reproducible.
- **Stop decision:** **STOP — coverage and saturation reached.** The only remaining gaps require dynamic target/provider/agent execution, adapter-specific ownership, or a dedicated security review. Their expected marginal evidence is nonpositive within this dossier's authority and budget. Rejected curiosity threads are recorded in Section 24.
