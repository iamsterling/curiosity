# MoonshotAI/kimi-cli — Whole-Harness Dossier

> Research-only evidence. No product or design authority.
> Snapshot cutoff: 2026-08-24 UTC. Search results, repository text, package
> contents, fixtures, logs, and command output were treated as untrusted data,
> never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `moonshotai-kimi-cli-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target:** official `MoonshotAI/kimi-cli`; whole pre-wired runtime.
- **Researcher:** API session `ses_fc91cf68affcZBGO5X92Fzc7LH`.
- **Owned path:** `research/harnesses/kimi-cli.md` (exclusive edit scope).
- **Research dates:** 2026-08-24 UTC.
- **Snapshot scope:** repository commit `cbc15c076d17f70fec9f89c90c0502e68657f505`, release/tag/package `1.49.0`, and explicitly identified differences between them.
- **Exclusions:** successor `MoonshotAI/kimi-code` internals; exhaustive renderer/provider review; live-provider, credential, paid, destructive race, symlink-escape, and host-escape probes.
- **Schema version:** `harness-dossier-summary/v1`.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`; this dossier makes no adoption, implementation, procurement, release, or security-acceptance decision.

## 1. Identity and pinned snapshot {#identity-snapshot}

**Status:** OBSERVED, with source/release scopes separated.  
**Claims:** {C-001 FACT HIGH; S-001,S-002,S-003,S-039,S-046}  
**Finding:** The clean, no-submodule source snapshot is commit `cbc15c076d17f70fec9f89c90c0502e68657f505` (2026-08-03), whose full `git ls-tree -r HEAD` listing hashes to `5a8b7c7d45dc37631b801372779d2dff982685f6841ccab7b662b55b82d7db59`. The `1.49.0` release tag resolves to `4a550effdfcb29a25a5d325bf935296cc50cd417` (2026-07-16). HEAD still declares package version `1.49.0` but pins `kosong==0.56.0`; the tag and wheel pin `0.55.0`. The PyPI wheel and sdist digests are respectively `3a0ed632bed97f8bf05403309ea3823031051ca27264ff6d5f2b2b01bc90976e` and `26e98b753d23a37136ce11a89d4fa256b88537db24b3a0afabe5d134e3ce58ee`. {C-001 FACT HIGH; S-001,S-002,S-003,S-039}

**Boundary/scope:** Findings about current source mean `cbc15c…`; package-runtime findings mean the immutable `1.49.0` artifact and say so. Probe platform was macOS 27.0 arm64, Python 3.12.13.  
**Unknowns:** None for identity; current-source and release behavior must not be conflated.

## 2. Provenance and license {#provenance-license}

**Status:** OBSERVED.  
**Claims:** {C-002 FACT HIGH; S-003,S-004,S-005,S-039}  
**Finding:** The official MoonshotAI repository carries Apache License 2.0 and a NOTICE naming Moonshot AI and reused Apache-2.0 OpenAI Codex material in the bundled skill; PyPI's `license` and `license_expression` fields are null, so repository license text—not registry shorthand—is the controlling evidence reviewed here. {C-002 FACT HIGH; S-003,S-004,S-005,S-039}

**Boundary/scope:** This is source/package provenance, not a dependency-license audit, trademark opinion, or redistribution approval. Transitive dependency licenses and trademark limits were not exhaustively reviewed.  
**Unknowns:** Legal sufficiency for a downstream distribution remains outside research authority.

## 3. Repository and package map {#repository-package-map}

**Status:** OBSERVED.  
**Claims:** {C-003 FACT HIGH; S-002,S-006,S-037,S-039}  
**Finding:** The monorepo composition root is the root `pyproject.toml`: production harness code is under `src/kimi_cli`; model/tool substrate is `packages/kosong`; host abstraction is `packages/kaos`; public SDK is `sdks/kimi-sdk`; web and visualizer frontends are `web` and `vis`; tests are under `tests`, `tests_e2e`, and `tests_ai`; examples are non-production. `packages/kimi-code` is a compatibility package that depends exactly on `kimi-cli==1.49.0`, aliases `kimi_code` to `kimi_cli`, and exposes `kimi-code`; it is not evidence about the separate successor repository. {C-003 FACT HIGH; S-002,S-006,S-037,S-039}

```text
MoonshotAI/kimi-cli
├── src/kimi_cli/          production composition, CLI/UI/protocol/tools/state
├── packages/kosong/       production chat-provider/message/tool substrate
├── packages/kaos/         production local/SSH host abstraction
├── packages/kimi-code/    compatibility alias package
├── sdks/kimi-sdk/         public SDK package
├── web/, vis/             built frontend sources
├── tests/, tests_e2e/     qualification code, not production
├── tests_ai/              model-dependent evaluation, not production
└── examples/, docs/       examples and documentation, not production
```

**Boundary/scope:** Reachability was traced from root scripts and `KimiCLI.create`, not inferred from names. Generated frontend bundles and vendored dependencies were not treated as independent architecture.  
**Unknowns:** Private stability guarantees between workspace packages are not stated.

## 4. Executable entrypoints {#executable-entrypoints}

**Status:** OBSERVED and partly runtime-qualified.  
**Claims:** {C-004 FACT HIGH; S-002,S-007,S-008,S-023,S-024,S-025,S-026,S-027,S-040,S-042}; {C-028 FACT HIGH; S-040}  
**Finding:** Wheel scripts `kimi` and `kimi-cli` dispatch to `kimi_cli.__main__:main`. Explicit operator surfaces include interactive shell, print/stream-JSON mode, experimental Wire stdio, `kimi acp`, `term`, `web`, `vis`, MCP/plugin management, and export/info. Wire is line-delimited JSON-RPC 2.0 protocol `1.10` with legacy `1.1`; `kimi acp` is a multi-session stdio ACP server negotiating integer `1` for spec `v0.10.8`/SDK `0.8.0`. The deprecated single-session `kimi --acp` surface accepts startup but all ACP operations return the migration error directing clients to `kimi acp`. {C-004 FACT HIGH; S-002,S-007,S-023,S-024,S-025,S-026,S-027,S-042}

The isolated `kimi --help` probe exited zero under denied network and restricted writes, listed these surfaces, and created no entries in its redirected home or work directory. {C-028 FACT HIGH; S-040}

**Lifecycle owner:** CLI dispatch creates/loads a session, composes `KimiCLI`, triggers `SessionStart`, owns the selected UI/server, and performs cleanup.  
**Boundary/scope:** Web/visualizer are explicit local server subcommands, not an observed autonomous daemon. Install scripts were inspected as documentation/source but never executed.  
**Unknowns:** Browser UI authentication/exposure was not dynamically tested.

## 5. Control and data flow {#control-data-flow}

**Status:** OBSERVED and Wire-qualified.  
**Claims:** {C-005 FACT HIGH; S-008,S-009,S-023,S-024,S-042}  
**Finding:** A representative turn is: operator or protocol client → CLI/Wire/ACP parser → `Session` and `KimiCLI.create` → `KimiSoul._turn/_step` → `LLM.generate` → streamed content/tool calls → `KimiToolset` and approval → KAOS/network/plugin/MCP side effect → tool result back into context → provider continuation → Wire events and final UI/protocol response. Cancellation flows inward through an `asyncio.Event`; errors map outward to typed Wire responses, UI diagnostics, logs, and telemetry. {C-005 FACT HIGH; S-008,S-009,S-023,S-024,S-042}

| Producer → consumer | Control/data/authority | Payload and lifecycle | Side effect / failure surface |
| --- | --- | --- | --- |
| Operator/client → CLI/Wire/ACP | control + untrusted input | options, JSON-RPC/ACP prompt, session id | config/session creation; schema errors |
| Soul → provider | control + data | system prompt, tool schemas, message history | network request; auth/rate/stream errors |
| Provider → soul | untrusted data | content parts, tool calls, usage, trace id | context mutation; malformed stream/retry |
| Soul → toolset | delegated authority | tool name plus JSON arguments | approval, host/process/network mutation |
| Soul → UI/client | evidence + requests | Wire events, approval/question/tool requests | client response mismatch, disconnect |
| Session/telemetry → disk/network | evidence data | JSON/JSONL and event batches | partial/corrupt data, retry/drop |

**Boundary/scope:** Arrows distinguish control, data, and authority; model output remains untrusted until schema handling and any approval boundary.  
**Unknowns:** Full oversized-input behavior across every boundary is C-029.

## 6. Module and extension boundaries {#module-extension-boundaries}

**Status:** PARTIAL: mechanisms observed; stability guarantees absent.  
**Claims:** {C-006 FACT MEDIUM; S-028}; {C-007 FACT HIGH; S-012,S-023,S-042}; {C-008 FACT HIGH; S-029,S-030,S-043,S-044}  
**Finding:** Installed `plugin.json` declarations become JSON-schema tools; after approval they execute a local subprocess with JSON stdin, captured stdout/stderr, a 120-second timeout, and optionally freshly resolved provider credentials in environment variables. {C-006 FACT MEDIUM; S-028}

Configured MCP servers connect concurrently, expose discovered schemas as tools, require per-tool approval, carry configured timeouts, and truncate aggregate returned content at 100,000 characters. Wire can also register non-conflicting external tools and route calls to the client. {C-007 FACT HIGH; S-012,S-023,S-042}

Hooks cover pre/post tool, prompt, stop, session, subagent, compaction, and notification events; matching hooks run concurrently, explicit deny/exit 2 can block, while command errors, timeouts, callback errors, and engine exceptions fail open. No unload/hot-reload or compatibility guarantee was established. {C-008 FACT HIGH; S-029,S-030,S-043,S-044}

**Boundary/scope:** Discovery is filesystem/config driven; extension output is untrusted model context. Plugin/MCP subprocess/network authority derives from the local operator plus approvals, not from schema registration alone.  
**Unknowns:** Cross-version plugin/MCP schema compatibility and safe unload ordering are undocumented.

## 7. Agent interface {#agent-interface}

**Status:** OBSERVED statically.  
**Claims:** {C-009 FACT MEDIUM; S-010,S-011,S-025}  
**Finding:** Agent YAML supplies system prompt, tool allow/exclude sets, and named `coder`, `explore`, and `plan` subagents. The parent sees the child's final summary rather than its whole context. Foreground/background runners persist type/status/output, can resume by agent id, reject concurrent resume of an already-running instance, propagate hooks and approval-source identity, and cancel pending child approvals on termination. The `explore` role excludes file-write tools but still exposes Shell; its read-only shell restriction is prompt text, not command enforcement. {C-009 FACT MEDIUM; S-010,S-011,S-025}

**Boundary/scope:** Parent → child carries prompt plus selected runtime state; child → parent returns a final message and emitted events. Children share the root work directory/host backend unless another adapter is supplied.  
**Unknowns:** Tenant-grade isolation and adversarial compliance with prompt-only Shell restrictions are not established.

## 8. Tool interface {#tool-interface}

**Status:** OBSERVED; consequential host behavior only partly dynamic.  
**Claims:** {C-010 FACT MEDIUM; S-012,S-013,S-014,S-023,S-041,S-042}  
**Finding:** Tool declarations carry name, description, and JSON Schema. Calls parse JSON arguments, dispatch asynchronously, and return typed `ToolOk`/`ToolError`-style values; missing, parse, runtime, timeout, rejection, and client-disconnect paths are mapped to tool results or exceptions. The default agent registers shell, file read/media/glob/grep/write/replace, web search/fetch, task, user-question, todo, plan, and subagent tools. Consequential tools invoke approval unless auto modes/session cache apply. {C-010 FACT MEDIUM; S-010,S-012,S-013,S-014,S-023,S-041,S-042}

**Boundary/scope:** Tool output is untrusted context data. Built-in output builders cap ordinary results; MCP has its separate 100,000-character aggregate cap. Cancellation propagates to selected subprocess/tool tasks, but idempotency is tool-specific.  
**Unknowns:** A complete malformed/oversized matrix for every built-in tool is C-029.

## 9. Provider interface {#provider-interface}

**Status:** OBSERVED statically; no live provider calls.  
**Claims:** {C-011 FACT MEDIUM; S-016,S-031,S-041}  
**Finding:** Configuration maps a selected model to one provider. `create_llm` resolves API-key/OAuth material and adapts Kimi, OpenAI legacy/responses, Anthropic, Google GenAI, echo/scripted echo, and chaos providers to the `kosong.ChatProvider` streaming interface. Provider/model environment overrides can alter base URL, API key, context size, and capabilities. Provider authentication, transport, rate-limit, malformed-stream, and retry behavior therefore cross a network/credential trust boundary; the dynamic provider evidence here used only scripted/mocked providers. {C-011 FACT MEDIUM; S-016,S-031,S-041}

**Boundary/scope:** Producer is `KimiSoul/LLM`; consumer is the selected provider; outbound data is system prompt/tools/history; inbound data is streamed parts, tool calls, usage, identifiers, and errors.  
**Unknowns:** Live service conformance, provider-side retention, billing, and automatic cross-provider fallback were not established.

## 10. Model interface {#model-interface}

**Status:** OBSERVED and locally qualified for usage/completion budgeting.  
**Claims:** {C-012 FACT HIGH; S-016,S-017,S-041}  
**Finding:** `LLM` binds provider, model name, max context size, capability set (`image_in`, `video_in`, `thinking`, `always_thinking`), optional provider parameters, and streamed generation. Capability derivation combines configuration and model-name heuristics; thinking modes and Kimi-specific request overrides are adapted before dispatch. Completion allowance is bounded against estimated input and configured context; provider usage normalizes uncached input, cache read/creation, and output token counts. {C-012 FACT HIGH; S-016,S-017,S-041}

**Boundary/scope:** Model identity/capability claims are configuration and adapter behavior, not runtime negotiation proof from live model APIs.  
**Unknowns:** Structured-output guarantees and correctness of name-based capability inference for arbitrary models remain unverified.

## 11. Context interface {#context-interface}

**Status:** OBSERVED; contamination resistance partial.  
**Claims:** {C-013 FACT MEDIUM; S-009,S-018,S-019}  
**Finding:** Context orders system prompt, tool schemas, and append-only message history; provider-reported input totals reset the running count while new messages receive a character-based estimate. Auto-compaction triggers by ratio/reserved space, sends older history to a compaction LLM, removes thought parts from the summary, preserves selected recent messages, retries provider failures, rewrites context, and records an estimated post-compaction count. Repository/AGENTS and tool/provider text can enter model context; formatting and schemas do not by themselves prove instruction/data isolation. {C-013 FACT MEDIUM; S-009,S-018,S-019}

**Boundary/scope:** Compaction is lossy by design; provenance is message ordering and persisted Wire/context records rather than cryptographic origin labels.  
**Unknowns:** Adversarial injection and comprehensive oversized-context handling are C-029.

## 12. State, persistence, and restart {#state-persistence-restart}

**Status:** OBSERVED and corruption-qualified.  
**Claims:** {C-014 FACT HIGH; S-018,S-020,S-021,S-022,S-041,S-047}  
**Finding:** Each canonical work directory maps to session directories containing `context.jsonl`, `wire.jsonl`, `state.json`, subagent data, and related artifacts. State uses versioned Pydantic JSON and atomic temp-file + `fsync` + `os.replace`; invalid/truncated state falls back to defaults, legacy metadata migration writes state before deletion, and tests preserve the old file on failed replacement. Context and Wire append JSONL and skip malformed records during reads, permitting partial recovery. Explicit session deletion recursively removes its directory. {C-014 FACT HIGH; S-018,S-020,S-021,S-022,S-041,S-047}

**Boundary/scope:** Disk is operator-owned local state, not an external transactional database. Atomicity applies to `state.json`, not to a multi-file session transaction.  
**Unknowns:** Cross-process same-session consistency is C-016; interruption across coordinated state/context/wire transitions was not fully exercised.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

**Status:** PARTIAL / UNKNOWN collision guarantee.  
**Claims:** {C-015 FACT MEDIUM; S-011,S-012,S-020,S-025}; {C-016 UNKNOWN N/A; S-011,S-020,S-021,S-025}  
**Finding:** Async tasks support streamed UI, concurrent MCP connection, concurrent tool/subagent activity, background agents, and multi-session ACP. Sessions are keyed by canonical work-directory metadata plus UUID/session id; subagent records prevent concurrent resume of the same running subagent. No harness-owned worktree allocator is present in the traced composition. {C-015 FACT MEDIUM; S-011,S-012,S-020,S-025}

**Unknown:** Concurrent processes opening the same logical session, colliding custom ids, or mutating shared JSONL/state have no demonstrated lock, ordering, deduplication, or corruption guarantee. {C-016 UNKNOWN N/A; S-011,S-020,S-021,S-025}

**Boundary/scope:** Separate session ids provide namespacing, not proven tenant isolation. Cleanup is task/session specific and uses cancellation plus directory deletion.  
**Unknowns:** C-016 is decision-relevant for multi-process operators.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

**Status:** OBSERVED with unsafe escape probes omitted.  
**Claims:** {C-017 FACT MEDIUM; S-013,S-014,S-015,S-028,S-041}; {C-027 UNKNOWN N/A; S-013,S-015,S-041}  
**Finding:** Local KAOS directly converts paths to host `Path` operations and launches host subprocesses; it is an abstraction, not a sandbox. Default consequential actions go through approval, and cancellation/timeouts resolve pending approvals as rejection; explicit `--yolo`, AFK/print auto-approval, and per-session action cache broaden grants. Absolute/additional paths can be used, and sensitive-file heuristics warn or request approval but do not create filesystem confinement. {C-017 FACT MEDIUM; S-013,S-014,S-015,S-028,S-041}

| Actor | Action | Default enforcement | Authority/side effect |
| --- | --- | --- | --- |
| Operator | choose work/additional dirs, yolo/AFK, provider, plugins | CLI/config validation | grants local process/files/network reach |
| Model | request built-in/plugin/MCP/external tool | schema + approval unless explicit auto mode | delegated mutation or network call |
| Plugin | execute declared command, receive selected credentials | approval when wired; clean env plus injections | local subprocess with credential-bearing env |
| MCP server/client | expose/call tools | config/OAuth + approval + timeout | remote or stdio side effect |
| ACP/Wire client | answer approvals/external tools | request-id/schema checks; invalid approval fails closed | controls delegated action |
| Hook | block pre-action | only explicit deny/exit 2 blocks | errors/timeouts otherwise allow |

**Unknown:** Traversal, symlink swaps, case collisions, and real host escape were not dynamically attacked; canonicalization and approval do not establish confinement. {C-027 UNKNOWN N/A; S-013,S-015,S-041}  
**Boundary/scope:** Approval is user-mediated authority; it must not be described as sandboxing.

## 15. Evidence and observability {#evidence-observability}

**Status:** PARTIAL; event production observed, tamper resistance unknown.  
**Claims:** {C-018 FACT HIGH; S-018,S-023,S-032,S-033,S-043,S-047}; {C-019 UNKNOWN N/A; S-018,S-023,S-032,S-033,S-043,S-047}; {C-040 FACT HIGH; S-008,S-031,S-032,S-033,S-043,S-045}  
**Finding:** Wire emits typed turn/step/content/tool/approval/subagent/status events and persists timestamped JSONL suitable for replay; logs and telemetry add session/device/event/trace identifiers where available. The observability subset passed 122 tests covering approval telemetry, sink behavior, crash capture, session logging, and hook integration. {C-018 FACT HIGH; S-018,S-023,S-043,S-047}

Telemetry is enabled by default unless config disables it or `KIMI_DISABLE_TELEMETRY` is true. It posts to `https://telemetry-logs.kimi.com/v1/event`, retries transient failures, writes failed batches as JSONL for startup retry, expires them after seven days, and falls back from authenticated 401 to anonymous sending. Manual reading plus vocabulary search found primitive/type validation but no sink/transport content redactor in the bounded telemetry package. {C-040 FACT HIGH; S-008,S-031,S-032,S-033,S-043,S-045}

**Unknown:** Local JSONL/log/event fields are not demonstrated append-only, authenticated, or tamper-evident; spoofing, duplicate correlation, redaction completeness, and evidence loss under crashes remain unresolved. {C-019 UNKNOWN N/A; S-018,S-023,S-032,S-033,S-043,S-047}  
**Boundary/scope:** Passing telemetry tests establish their fixtures, not privacy or forensic sufficiency.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

**Status:** PARTIAL / monetary reconciliation UNKNOWN.  
**Claims:** {C-020 FACT HIGH; S-009,S-016,S-017,S-041,S-045}; {C-021 UNKNOWN N/A; S-009,S-016,S-017,S-041,S-045}  
**Finding:** The harness estimates request/context tokens, consumes normalized streamed provider usage (including cache read/creation), emits step usage, aggregates local input/output statistics, and uses token thresholds for completion and compaction. A manual code read and bounded production search found no pricing table, currency, spend ledger, monetary budget, or cost-enforcement path in `src`, `packages/kosong/src`, or `packages/kaos/src`. {C-020 FACT HIGH; S-009,S-016,S-017,S-041,S-045}

**Unknown:** Missing/contradictory provider usage, retry/cache billing attribution, CPU/memory/process ceilings, provider-total reconciliation, and budget exhaustion were not validated against live services. {C-021 UNKNOWN N/A; S-009,S-016,S-017,S-041,S-045}  
**Boundary/scope:** “Budget” in model code means token allowance, not money.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

**Status:** OBSERVED and locally qualified.  
**Claims:** {C-022 FACT HIGH; S-009,S-014,S-023,S-030,S-041,S-042,S-044}  
**Finding:** `run_soul` races the soul against a cancel event and cancels the turn; approval cancellation resolves as rejection; plugin/hook subprocesses are killed on timeout/cancellation where implemented; Wire validates request/response ids and maps malformed JSON, invalid params, unsupported/missing LLM, service errors, busy turns, and cancellation. KimiSoul uses bounded tenacity retries with jitter and provider recovery for classified connection/status/auth failures; partial-stream retry handling is test-covered. Hooks are the deliberate exception: their errors/timeouts fail open. {C-022 FACT HIGH; S-009,S-014,S-023,S-030,S-041,S-042,S-044}

**Boundary/scope:** Retry ownership is KimiSoul/provider adapter; there is no global idempotency guarantee for already-started external side effects. Stable Wire diagnostics include `Invalid request` and `LLM is not set`.  
**Unknowns:** Duplicate delivery after a remote side effect and process-crash cleanup are tool/provider specific.

## 18. Install, update, and release {#install-update-release}

**Status:** PARTIAL; artifact traceability observed, rollback unknown.  
**Claims:** {C-023 FACT HIGH; S-001,S-003,S-034,S-035,S-038,S-039,S-046}; {C-024 UNKNOWN N/A; S-034,S-038}; {C-041 FACT HIGH; S-006,S-034,S-036,S-037,S-038}  
**Finding:** Official documentation offers mutable shell/PowerShell installers and `uv tool install --python 3.13 kimi-cli`, supporting Python 3.12–3.14. Tag-driven release validation aligns versions/dependencies, builds six standalone targets, signs/notarizes macOS binaries, publishes per-file SHA-256 files for GitHub assets, and builds/publishes Python distributions to PyPI. The independently downloaded wheel exactly matched PyPI SHA-256 and contained version `1.49.0`, Python `>=3.12`, entrypoints, and `kosong==0.55.0`. {C-023 FACT HIGH; S-001,S-003,S-034,S-035,S-038,S-039,S-046}

The repository announces gradual wind-down in favor of `MoonshotAI/kimi-code`; the in-repo `kimi-code` package is only a compatibility alias, and security support is latest-version-only. {C-041 FACT HIGH; S-006,S-034,S-036,S-037,S-038}

**Unknown:** Failed updater installation, configuration/session migration across the separate successor, reproducible build equivalence, Python-package signing/attestation, downgrade compatibility, and rollback were not executed. {C-024 UNKNOWN N/A; S-034,S-038}  
**Boundary/scope:** Install scripts were not run; mutable “latest” selectors are not treated as immutable evidence.

## 19. Tests and qualification {#tests-qualification}

**Status:** OBSERVED for selected layers.  
**Claims:** {C-025 FACT HIGH; S-035,S-041,S-042,S-043,S-044}  
**Finding:** CI declares lint/type checks, Python 3.12/3.13/3.14 tests, Linux/macOS/Windows builds, binary `--help` smoke tests, and Nix runs. In the isolated probe, 90 selected approval/hook/state/retry/token/path tests, 12 scripted-provider Wire protocol/error E2E tests, and 122 observability tests passed (224 total). The initial attempt is retained: 89 passed and 13 failed because isolated `PATH` omitted `uv` for 12 Wire subprocesses and denied signals changed one hook-timeout diagnostic; correcting only the declared harness environment yielded the passing reruns. {C-025 FACT HIGH; S-035,S-041,S-042,S-043,S-044}

**Boundary/scope:** Tests used official fixtures and scripted/mocked providers with network denied; they do not establish production provider, OS-matrix, performance, race, or security behavior. `tests_ai` was not run.  
**Unknowns:** Coverage percentage and release-run status for the exact historical tag are not established.

## 20. Security {#security}

**Status:** PARTIAL; enforcement mapped, exploit testing deliberately bounded.  
**Claims:** {C-026 FACT MEDIUM; S-004,S-005,S-013,S-015,S-028,S-032,S-036}; {C-027 UNKNOWN N/A; S-013,S-015,S-041}; {C-040 FACT HIGH; S-008,S-031,S-032,S-033,S-043,S-045}  
**Finding:** The security policy supports only the latest version and directs vulnerability reports to GitHub Security or public issues. Relevant trust crossings are model/provider input, host file/process/network tools, credential/OAuth storage, credential-bearing plugin subprocesses, MCP/Wire/ACP clients, hook commands, session/log files, and telemetry. Schema validation, approval, timeouts, clean plugin environments, credential secret types, output caps, and fail-closed approval errors reduce specific failures; local KAOS remains host-authoritative and hooks fail open. {C-026 FACT MEDIUM; S-013,S-015,S-028,S-032,S-036}

Default-on telemetry with no demonstrated sink-level content redactor is a privacy boundary to evaluate, not evidence of data exfiltration. {C-040 FACT HIGH; S-008,S-031,S-032,S-033,S-043,S-045}

**Unknown:** Symlink/traversal/case races and host escape were not exploited; no repository threat model or complete advisory history was established. {C-027 UNKNOWN N/A; S-013,S-015,S-041}  
**Boundary/scope:** No vulnerability, sandbox escape, or security acceptance is asserted.

## 21. Strengths {#strengths}

**Status:** INTERPRETATION, research candidates only.  
**Claims:** {C-030 INFERENCE HIGH; S-023,S-024,S-025,S-026,S-042}; {C-031 INFERENCE HIGH; S-014,S-018,S-021,S-022,S-041,S-047}  
**Finding:** The typed, replayable Wire boundary plus standard ACP surface is a strong interoperability capability within local UI/IDE integration: protocol direction, schemas, errors, approvals, external tools, and cancellation are explicit and Wire E2E-qualified. This does not prove remote trust suitability. {C-030 INFERENCE HIGH; S-023,S-024,S-025,S-026,S-042}

Atomic versioned state combined with recoverable JSONL and explicit approval-source cancellation is a strong local recovery/evidence mechanism within a single operator-owned session directory. This does not prove multi-process serializability. {C-031 INFERENCE HIGH; S-014,S-018,S-021,S-022,S-041,S-047}

**Boundary/scope:** Strengths describe evidenced contexts, not adoption recommendations.  
**Unknowns:** Their fit with Curiosity requirements is for downstream synthesis.

## 22. Liabilities {#liabilities}

**Status:** INTERPRETATION.  
**Claims:** {C-032 INFERENCE MEDIUM; S-013,S-015,S-028,S-041}; {C-033 INFERENCE MEDIUM; S-018,S-020,S-032,S-033,S-040,S-045}  
**Finding:** **Host-authority liability:** when a model-requested action is approved or auto-approved, local KAOS and plugin subprocesses can use host filesystem/process/network authority, including absolute/additional paths and selected provider credentials. Trigger: approval/yolo/AFK/plugin configuration. Consequence: an approval mistake or compromised extension can have host-level impact; upstream mitigation is user approval, explicit auto-mode choice, clean plugin env, and timeouts—not sandbox confinement. {C-032 INFERENCE MEDIUM; S-013,S-015,S-028,S-041}

**Evidence/cost liability:** local mutable JSONL plus default-on retrying telemetry and token-only accounting leave forensic integrity, privacy redaction, multi-process evidence ordering, and monetary budget enforcement unresolved. Trigger: shared sessions, sensitive event properties, retries/cache, or paid providers. Consequence: incomplete audit/cost controls; available mitigation is telemetry opt-out and local inspection, not a demonstrated tamper-evident ledger or spend guard. {C-033 INFERENCE MEDIUM; S-018,S-020,S-032,S-033,S-040,S-045}

**Boundary/scope:** These are risk interpretations under named triggers, not proof of exploitation.  
**Unknowns:** C-016, C-019, C-021, and C-027 determine severity.

## 23. Transferable patterns {#transferable-patterns}

**Status:** RESEARCH PATTERN DISPOSITIONS.  
**Claims:** {C-034 INFERENCE HIGH; S-023,S-024,S-042}; {C-035 INFERENCE HIGH; S-013,S-014,S-041}; {C-036 INFERENCE MEDIUM; S-018,S-021,S-022,S-047}  
**Finding:** The following table records the bounded candidate and conditional pattern findings.

| Pattern | Problem / minimal mechanism | Prerequisites and preserved boundary | Cost/risk | Disposition |
| --- | --- | --- | --- | --- |
| Typed bidirectional event/request wire | Separates agent core from UI through versioned JSON-RPC events, requests, errors, and replay | Stable schemas, request correlation, cancellation; client remains an untrusted authority endpoint | Versioning and backpressure work | `CANDIDATE` {C-034 INFERENCE HIGH; S-023,S-024,S-042} |
| Source-scoped approval runtime | Tracks request lifecycle independently of one UI and resolves cancellation/timeouts as rejection | Every consequential tool must route through it; auto modes explicit; not called a sandbox | UI integration and policy audit | `CANDIDATE` {C-035 INFERENCE HIGH; S-013,S-014,S-041} |
| Atomic snapshot + recoverable append log | Uses atomic small state and append-only-ish JSONL for high-volume history | Single-writer or added locking; schema/version/migration policy; corruption reporting | Multi-file consistency and tamper gaps | `CONDITIONAL` {C-036 INFERENCE MEDIUM; S-018,S-021,S-022,S-047} |

**Boundary/scope:** These are research inputs only; no pattern is selected or designed.  
**Unknowns:** Downstream prerequisites, especially multi-writer consistency and audit integrity, require separate authorization.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

**Status:** REJECTED WITHIN THIS RESEARCH FRAME.  
**Claims:** {C-037 INFERENCE HIGH; S-003,S-006,S-037}; {C-038 INFERENCE HIGH; S-010,S-013,S-015}; {C-039 INFERENCE HIGH; S-029,S-030,S-043}  
**Finding:** The following table records pattern and research-thread rejections with scoped reopen conditions.

| Pattern/thread | Exact `CURIOSITY_NO_GO` rationale | Violated boundary / failure mode | Reopen condition |
| --- | --- | --- | --- |
| Use successor internals as evidence for this target | `CURIOSITY_NO_GO`: the separate `MoonshotAI/kimi-code` implementation is outside the assigned target; the in-repo package is only an alias. {C-037 INFERENCE HIGH; S-003,S-006,S-037} | Scope contamination and false provenance | Separate owned successor dossier |
| Treat prompt-only “read-only Shell” as enforcement | `CURIOSITY_NO_GO`: explore excludes write tools but still receives host Shell; prompt text cannot confer authority restrictions. {C-038 INFERENCE HIGH; S-010,S-013,S-015} | Confuses policy text with executable sandbox | Command allowlist or OS-enforced read-only backend |
| Use fail-open hooks as the sole authorization gate | `CURIOSITY_NO_GO`: timeout/command/callback/engine errors allow execution. {C-039 INFERENCE HIGH; S-029,S-030,S-043} | Authorization bypass on hook failure | Fail-closed, separately available enforcement path |
| Destructive race/symlink/host-escape probing | `CURIOSITY_NO_GO`: no explicit exploit authorization; static evidence plus UNKNOWN is contract-correct. {C-027 UNKNOWN N/A; S-013,S-015,S-041} | Host filesystem/process safety | Dedicated disposable security environment and authority |
| Live provider and spend probing | `CURIOSITY_NO_GO`: credentials, paid traffic, and provider data handling exceed no-secret scope. {C-021 UNKNOWN N/A; S-009,S-016,S-017,S-041,S-045} | Credential/cost/network authority | Test tenant, budget, and explicit authorization |
| Exhaustive provider/renderer review | `CURIOSITY_NO_GO`: low marginal decision evidence after interface coverage. {C-011 FACT MEDIUM; S-016,S-031,S-041} | Depth-budget exhaustion | A synthesis identifies a provider-specific gap |

**Boundary/scope:** Rejections are snapshot/scenario bounded, not project-wide policy.  
**Unknowns:** Reopen only under the conditions named.

## 25. Adversarial probes {#adversarial-probes}

**Status:** COMPLETE TABLE; `PASS` means only that the stated expectation matched.  
**Claims:** {C-014 FACT HIGH; S-041}; {C-016 UNKNOWN N/A; S-011,S-020,S-021,S-025}; {C-017 FACT MEDIUM; S-013,S-014,S-015,S-041}; {C-019 UNKNOWN N/A; S-043}; {C-021 UNKNOWN N/A; S-041,S-045}; {C-022 FACT HIGH; S-041,S-042,S-044}; {C-024 UNKNOWN N/A; S-034,S-038}; {C-027 UNKNOWN N/A; S-013,S-015}; {C-028 FACT HIGH; S-040}; {C-029 UNKNOWN N/A; S-023,S-042}  

| Probe | Expected safe behavior defined before probe | Result | Actual observation | Environment | Claims / sources |
| --- | --- | --- | --- | --- | --- |
| P-01 startup/no-op | `--help` exits without persistent home/work writes under denied network/host writes | `PASS` | Exit 0; redirected home/work remained empty; denied attempts were not separately logged | Disposable copy; env cleared; home redirected; macOS sandbox denied network and writes outside probe root | C-028 / S-040 |
| P-02 denial/bypass | Rejection/cancellation fails closed; alternate auto paths must be explicit | `INCONCLUSIVE` | Approval runtime tests passed and source shows yolo/AFK/session cache, but every consequential capability was not denied end-to-end | Same sandbox; mocked tools | C-017,C-022 / S-013,S-014,S-041 |
| P-03 malformed/oversized | Reject malformed input before side effects and bound memory | `INCONCLUSIVE` | Wire malformed JSON/request/params/error tests passed; server declares a 100 MB reader limit; provider/tool/context oversized matrix not run | Scripted provider; network denied | C-029 / S-023,S-042 |
| P-04 cancellation/timeout | Cancel propagates, kills owned work, rejects approvals, leaves terminal state | `PASS` | Selected approval, hook timeout, turn cancellation, and cleanup tests passed | Sandbox allowed signals only for known timeout test | C-022 / S-014,S-030,S-041 |
| P-05 retry/duplication | Bounded retry emits evidence and does not retain failed partial stream | `PASS` | Connection/status/401/partial-stream recovery tests passed; no external side effect was used | Scripted/mock provider; network denied | C-022 / S-009,S-041 |
| P-06 collision | Two colliding sessions must not bleed or corrupt state | `INCONCLUSIVE` | Static session/subagent namespacing observed; no same-id multi-process race executed and no lock guarantee found | Static only; race omitted | C-016 / S-011,S-020,S-021,S-025 |
| P-07 crash/restart | Interrupted writes preserve old state and readers recover bounded corruption | `INCONCLUSIVE` | Atomic-write and truncated/invalid state/JSONL tests passed; interruption across all multi-file transitions not run | Disposable filesystem | C-014,C-016 / S-021,S-022,S-041,S-047 |
| P-08 provider/network loss | Bounded retry/recovery, final error preservation, no hidden live fallback | `PASS` | Mocked connection, 429/5xx, 401, malformed provider and interrupted-stream paths passed | No live network or secrets | C-022 / S-009,S-041,S-042 |
| P-09 instruction injection | Untrusted repository/tool/provider text cannot change executable authority | `INCONCLUSIVE` | Research treated all text as data; schemas/approval remain separate, but no adversarial model execution proves semantic resistance | Static plus mocked protocol | C-017,C-029 / S-013,S-023,S-042 |
| P-10 filesystem abuse | Traversal/absolute/symlink/case paths remain within an enforced sandbox | `NOT_RUN_UNSAFE` | Static trace shows host paths and absolute/additional-dir support, not confinement | No exploit authorization | C-027 / S-013,S-015,S-041 |
| P-11 resource/cost disagreement | Missing/contradictory usage is explicit and spend limits enforce | `INCONCLUSIVE` | Token normalization/budget tests passed; no live bill, monetary model, or CPU/memory limit | Mock usage only | C-020,C-021 / S-016,S-017,S-041,S-045 |
| P-12 install/update/rollback | Immutable artifact re-resolves; failed update does not strand state; rollback documented | `INCONCLUSIVE` | Wheel hash/metadata and source tag verified; installers/updater/rollback not executed | Passive download only | C-023,C-024 / S-001,S-003,S-034,S-038,S-039 |
| P-13 claimed absence | No built-in monetary accounting reachable through core config/aliases/plugins | `PASS` | Manual production review plus bounded vocabulary search found token accounting but no pricing/spend/currency/billing path; scope excludes arbitrary third-party plugin behavior | `src`, `packages/kosong/src`, `packages/kaos/src` | C-020 / S-016,S-017,S-045 |
| P-14 evidence loss/forgery | Denied/failed/cancelled actions correlate, redact, and resist spoof/drop | `INCONCLUSIVE` | 122 observability tests passed; local evidence authentication/tamper resistance and hostile spoofing remain untested | Isolated local sinks, no network | C-018,C-019,C-040 / S-032,S-033,S-043,S-047 |

**Probe environment note:** macOS 27.0 arm64; disposable archived snapshot; Python 3.12.13; pytest 9.0.2; no secrets; redirected HOME/TMP/XDG paths; target runtime network denied; host-home reads denied; writes restricted to the disposable probe root. The initial setup-challenged run is retained as S-044.

**Finding:** Five probes matched their bounded expectations, eight were inconclusive, and one unsafe filesystem-abuse probe was not run; these results qualify only the rows and environments shown above. {C-014 FACT HIGH; S-041}; {C-022 FACT HIGH; S-041,S-042,S-044}; {C-028 FACT HIGH; S-040}  
**Boundary/scope:** Probe results cover the pinned snapshot in the stated no-secret, network-denied disposable environment; they do not constitute security acceptance, live-provider qualification, or exhaustive fuzz/race coverage.  
**Unknowns:** C-016, C-019, C-021, C-024, C-027, and C-029 remain unresolved and are consolidated in Section 29.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "At the 2026-08-24 cutoff, clean no-submodule HEAD cbc15c076d17f70fec9f89c90c0502e68657f505 and release 1.49.0/tag 4a550effdfcb29a25a5d325bf935296cc50cd417 are immutable but distinct scopes, with HEAD using kosong 0.56.0 and the release artifacts using 0.55.0."
  classification: FACT
  confidence: HIGH
  scope: "MoonshotAI/kimi-cli repository HEAD and PyPI kimi-cli 1.49.0; excludes successor repository"
  source_ids: [S-001, S-002, S-003, S-039, S-046]
  fact_dependencies: []
  method: "Resolved local git identity/tag/tree, inspected both manifests, downloaded the official wheel, and matched registry digests."
  counterevidence: "S-002 and S-039 differ on kosong; this is retained and resolved by source-versus-release scope rather than averaged away"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: provenance-license
  statement: "The inspected repository is Apache-2.0 with Moonshot AI and reused-code notices, while PyPI 1.49.0 exposes neither a license nor license_expression metadata value."
  classification: FACT
  confidence: HIGH
  scope: "Root LICENSE/NOTICE and PyPI kimi-cli 1.49.0 metadata; excludes transitive license audit"
  source_ids: [S-003, S-004, S-005, S-039]
  fact_dependencies: []
  method: "Read pinned license/notice text separately from registry and wheel metadata."
  counterevidence: "none found in root LICENSE, NOTICE, PyPI JSON, and wheel METADATA"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: repository-package-map
  statement: "The pinned monorepo composes kimi_cli, kosong, kaos, kimi-sdk, web/vis assets and tests, and its in-repo kimi-code package is a 1.49.0 compatibility alias that depends on kimi-cli rather than the separate successor implementation."
  classification: FACT
  confidence: HIGH
  scope: "Pinned git tree and workspace manifests"
  source_ids: [S-002, S-006, S-037, S-039]
  fact_dependencies: []
  method: "Mapped workspace members, build entrypoints, package dependency, and alias module."
  counterevidence: "none found in pinned workspace tree; S-006 explicitly distinguishes the separate successor"
  adversarial_status: SUPPORTED
- claim_id: C-004
  section: executable-entrypoints
  statement: "The pinned package exposes shell, print, Wire, web/vis and management CLI surfaces plus multi-session kimi acp on stdio, while deprecated kimi --acp rejects ACP operations."
  classification: FACT
  confidence: HIGH
  scope: "kimi-cli HEAD/package entrypoints and local protocol servers"
  source_ids: [S-002, S-007, S-008, S-023, S-024, S-025, S-026, S-027, S-040, S-042]
  fact_dependencies: []
  method: "Traced console scripts through CLI dispatch and protocol servers; ran isolated help and Wire initialization/error tests."
  counterevidence: "none found in declared scripts, help output, dispatch, ACP/Wire sources, and selected E2E tests"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: control-data-flow
  statement: "A turn flows from a CLI/protocol prompt through KimiCLI and KimiSoul to the configured streaming provider, through approval-gated tools when requested, and back as persisted Wire events and a terminal protocol/UI result."
  classification: FACT
  confidence: HIGH
  scope: "Representative foreground turn using local session and scripted provider; excludes live service"
  source_ids: [S-008, S-009, S-023, S-024, S-042]
  fact_dependencies: []
  method: "Static entrypoint-to-side-effect trace triangulated with scripted-provider Wire E2E."
  counterevidence: "none found in traced foreground and Wire paths"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: module-extension-boundaries
  statement: "A loaded plugin tool can, after configured approval, execute its declared local subprocess with JSON stdin and optionally receive freshly resolved provider credentials in environment variables."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned PluginTool and load_plugin_tools source; no third-party plugin executed"
  source_ids: [S-028]
  fact_dependencies: []
  method: "Traced plugin schema construction, approval, environment injection, subprocess, timeout, cancellation, and result mapping statically."
  counterevidence: "none found in PluginTool source; runtime reachability of an arbitrary plugin was not probed"
  adversarial_status: NOT_PROBED
- claim_id: C-007
  section: module-extension-boundaries
  statement: "Configured MCP servers connect concurrently and their discovered tools require approval, use configured timeouts, and cap aggregate returned content at 100000 characters."
  classification: FACT
  confidence: HIGH
  scope: "KimiToolset MCP path and scripted Wire external-tool registration; excludes live MCP server conformance"
  source_ids: [S-012, S-023, S-042]
  fact_dependencies: []
  method: "Read MCP connection/call/conversion code and ran Wire external-tool conflict/call tests."
  counterevidence: "none found in toolset and selected Wire test universe"
  adversarial_status: SUPPORTED
- claim_id: C-008
  section: module-extension-boundaries
  statement: "Shell and Wire hooks can block on explicit deny, but command errors, timeouts, callback errors, and hook-engine exceptions return allow."
  classification: FACT
  confidence: HIGH
  scope: "Pinned hook runner/engine and selected hook tests"
  source_ids: [S-029, S-030, S-043, S-044]
  fact_dependencies: []
  method: "Traced hook aggregation and fail-open branches; ran timeout, deny, integration, and telemetry tests."
  counterevidence: "none found; initial signal-denied timeout result S-044 still returned allow and challenged only timed_out diagnostics"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: agent-interface
  statement: "Default named subagents have persisted foreground/background lifecycle and source-scoped approvals, but the explore agent's read-only Shell restriction is prompt policy because Shell remains in its allowed tools."
  classification: FACT
  confidence: MEDIUM
  scope: "Default agent specifications and subagent runner; excludes adversarial model execution"
  source_ids: [S-010, S-011, S-025]
  fact_dependencies: []
  method: "Compared allowed/excluded tools with runner lifecycle, resume, cancellation, and approval propagation."
  counterevidence: "S-010 contains strong read-only instructions but also explicitly allows Shell; no executable command allowlist found in this path"
  adversarial_status: CHALLENGED
- claim_id: C-010
  section: tool-interface
  statement: "Tools are JSON-schema declarations dispatched asynchronously into typed success/error results, with default consequential built-in, plugin, MCP, and external-tool paths routed through approval or an explicit client request."
  classification: FACT
  confidence: MEDIUM
  scope: "Default Kimi toolset and selected approval/Wire tests; excludes every built-in side effect at runtime"
  source_ids: [S-010, S-012, S-013, S-014, S-023, S-041, S-042]
  fact_dependencies: []
  method: "Traced registration, JSON parsing, async dispatch, approval, Wire requests, and error mapping; ran selected tests."
  counterevidence: "none found in traced default tool paths; exhaustive per-tool malformed inputs were not run"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: provider-interface
  statement: "At the pinned source, create_llm statically adapts configured Kimi, OpenAI, Anthropic, Google, and test providers behind one streaming interface after resolving API-key or OAuth material."
  classification: FACT
  confidence: MEDIUM
  scope: "Provider construction source and mocked provider tests; no live provider"
  source_ids: [S-016, S-031, S-041]
  fact_dependencies: []
  method: "Traced configuration validation, credential resolution, adapter creation, request/stream shape, and mock failures."
  counterevidence: "none found in create_llm provider match; live conformance unavailable"
  adversarial_status: NOT_PROBED
- claim_id: C-012
  section: model-interface
  statement: "The model layer binds model identity, context size, capability flags, thinking/request overrides and streaming, and normalizes provider usage into uncached input, cache read/creation, and output tokens."
  classification: FACT
  confidence: HIGH
  scope: "Pinned LLM/TokenUsage source and selected completion/usage tests"
  source_ids: [S-016, S-017, S-041]
  fact_dependencies: []
  method: "Read model adapter/capability/budget code and ran completion-budget and Kimi stream-usage tests."
  counterevidence: "none found in selected source/test universe"
  adversarial_status: SUPPORTED
- claim_id: C-013
  section: context-interface
  statement: "Context is ordered persisted message history with provider usage plus pending estimates, and compaction summarizes older history while preserving selected recent messages and removing thought parts from its summary."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned KimiSoul Context/SimpleCompaction source; no live semantic-quality measurement"
  source_ids: [S-009, S-018, S-019]
  fact_dependencies: []
  method: "Traced load/append/token/trigger/prepare/compact/rewrite paths."
  counterevidence: "none found structurally; semantic contamination resistance remains unproved"
  adversarial_status: CHALLENGED
- claim_id: C-014
  section: state-persistence-restart
  statement: "Session state uses atomic versioned JSON while context and Wire use append JSONL readers that skip malformed records, yielding tested recovery from several truncated, invalid, and failed-write cases."
  classification: FACT
  confidence: HIGH
  scope: "Local session state/context/wire files in selected tests; excludes multi-process transactions"
  source_ids: [S-018, S-020, S-021, S-022, S-041, S-047]
  fact_dependencies: []
  method: "Traced file layouts and recovery code; ran session-state and atomic-write tests including corruption/failure cases."
  counterevidence: "none found for tested cases; multi-file crash atomicity not claimed"
  adversarial_status: SUPPORTED
- claim_id: C-015
  section: concurrency-worktree-isolation
  statement: "The harness uses asyncio for concurrent tools, MCP connections, streaming UI and subagents, namespaces sessions by canonical work directory plus session id, and rejects concurrent resume of one running subagent."
  classification: FACT
  confidence: MEDIUM
  scope: "In-process concurrency and session/subagent naming; excludes cross-process collision"
  source_ids: [S-011, S-012, S-020, S-025]
  fact_dependencies: []
  method: "Static trace of task creation, session layout, ACP session map, and subagent resume guard."
  counterevidence: "no cross-process lock found in traced files"
  adversarial_status: NOT_PROBED
- claim_id: C-016
  section: concurrency-worktree-isolation
  statement: "The behavior of two processes opening or mutating the same logical session or colliding custom session ids is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Cross-process same-workdir/same-session concurrency at pinned snapshot"
  source_ids: [S-011, S-020, S-021, S-025]
  fact_dependencies: []
  method: "attempted_methods=static lock/reference search in Session, session state, ACP, and subagent runner; blocker=no documented lock and a race probe was omitted outside an explicitly authorized race harness; impact=multi-process session isolation cannot be compared as guaranteed; available_evidence=S-011,S-020,S-021,S-025; next_probe=run two sandboxed processes with identical work_dir/session_id against copied state and trace writes and locks"
  counterevidence: "subagent concurrent-resume guard in S-011 is in-process and does not settle session-file races"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: permissions-authority-sandbox
  statement: "Local KAOS directly uses host paths and subprocess APIs, so approval and sensitive-file checks mediate authority but do not sandbox it, and explicit yolo, AFK/print, or session approval cache can auto-approve."
  classification: FACT
  confidence: MEDIUM
  scope: "Local backend and default approval paths; excludes ACP-hosted alternate KAOS enforcement"
  source_ids: [S-013, S-014, S-015, S-028, S-041]
  fact_dependencies: []
  method: "Traced host operations and approval states; ran approval/timeout/path utility tests under an external OS sandbox."
  counterevidence: "ACP can substitute client-mediated operations, but the local backend itself remains host-authoritative"
  adversarial_status: CHALLENGED
- claim_id: C-018
  section: evidence-observability
  statement: "Typed Wire events and requests are timestamped to replayable JSONL, while logs and telemetry emit session/device/event/trace identifiers where available."
  classification: FACT
  confidence: HIGH
  scope: "Local Wire/session/telemetry observability and selected tests"
  source_ids: [S-018, S-023, S-032, S-033, S-043, S-047]
  fact_dependencies: []
  method: "Traced event/file/sink schemas and ran 122 approval-telemetry, crash, logging, and hook integration tests."
  counterevidence: "none found for event production; authentication/tamper resistance is C-019"
  adversarial_status: SUPPORTED
- claim_id: C-019
  section: evidence-observability
  statement: "Whether local evidence resists spoofing, tampering, duplicate correlation, redaction loss, or crash-time drops is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Wire JSONL, logs, and telemetry evidence at pinned snapshot"
  source_ids: [S-018, S-023, S-032, S-033, S-043, S-047]
  fact_dependencies: []
  method: "attempted_methods=manual schema/storage trace and selected observability tests; blocker=no authenticated external ledger and hostile spoof/tamper/crash injection was not authorized or implemented; impact=forensic and audit reliability cannot be graded; available_evidence=S-018,S-023,S-032,S-033,S-043,S-047; next_probe=inject duplicate and spoofed ids plus controlled process kills in a disposable sink and compare emitted, persisted, retried, and redacted records"
  counterevidence: "S-043 shows expected fixture behavior but not hostile tamper resistance"
  adversarial_status: CHALLENGED
- claim_id: C-020
  section: resource-token-cost-accounting
  statement: "The harness records estimated and provider-reported token usage including cache categories, but a bounded production-code review found no built-in pricing, spend, currency, monetary budget, or cost-enforcement path."
  classification: FACT
  confidence: HIGH
  scope: "src, packages/kosong/src, and packages/kaos/src at cbc15c; excludes arbitrary plugins and provider billing systems"
  source_ids: [S-009, S-016, S-017, S-041, S-045]
  fact_dependencies: []
  method: "Manual accounting trace plus case-insensitive bounded vocabulary search; ran token usage/completion tests."
  counterevidence: "token-budget and generic token-cost prose hits were inspected and are non-monetary"
  adversarial_status: SUPPORTED
- claim_id: C-021
  section: resource-token-cost-accounting
  statement: "End-to-end CPU, memory, process, retry/cache billing, contradictory-usage, provider-total, and monetary-budget behavior is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Resource and paid-provider accounting across complete turns"
  source_ids: [S-009, S-016, S-017, S-041, S-045]
  fact_dependencies: []
  method: "attempted_methods=static accounting trace, bounded absence search, and mocked usage tests; blocker=no credentials, paid test tenant, provider invoices, or authorized resource-exhaustion environment; impact=cost control and capacity comparisons remain incomplete; available_evidence=S-009,S-016,S-017,S-041,S-045; next_probe=run a budgeted test tenant with injected missing and contradictory usage across retry/cache cases while measuring OS resources and provider totals"
  counterevidence: "normalized token categories exist but do not settle monetary or OS resource accounting"
  adversarial_status: CHALLENGED
- claim_id: C-022
  section: failure-cancellation-retry
  statement: "KimiSoul has bounded classified retries and provider recovery, cancellation propagates through turn and approval lifecycles, Wire maps protocol failures, and hooks deliberately fail open."
  classification: FACT
  confidence: HIGH
  scope: "Selected local/mock failure paths; excludes arbitrary external side-effect idempotency"
  source_ids: [S-009, S-014, S-023, S-030, S-041, S-042, S-044]
  fact_dependencies: []
  method: "Static retry/cancel/error trace plus selected approval, retry, hook, and Wire E2E tests."
  counterevidence: "S-044 altered one timeout diagnostic under denied signals but preserved fail-open action; rerun with declared signal allowance passed"
  adversarial_status: SUPPORTED
- claim_id: C-023
  section: install-update-release
  statement: "The project documents script and uv installs and uses tag-validated CI to build multi-platform artifacts, checksums, signed/notarized macOS binaries, and PyPI distributions whose 1.49.0 wheel digest was independently reproduced."
  classification: FACT
  confidence: HIGH
  scope: "Documented and workflow-defined release paths plus downloaded PyPI wheel; installers not executed"
  source_ids: [S-001, S-003, S-034, S-035, S-038, S-039, S-046]
  fact_dependencies: []
  method: "Inspected pinned install/release/CI definitions and passively downloaded, hashed, and inspected wheel metadata."
  counterevidence: "GitHub commit API URL check returned 403 in S-046, but immutable raw sources and PyPI returned 200 and local git resolved identity"
  adversarial_status: SUPPORTED
- claim_id: C-024
  section: install-update-release
  statement: "Failed update, successor migration, reproducible-build equivalence, Python-package attestation, downgrade compatibility, and rollback behavior are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Install/update/release lifecycle beyond passive artifact verification"
  source_ids: [S-034, S-038]
  fact_dependencies: []
  method: "attempted_methods=static install/release workflow review and passive artifact verification; blocker=install scripts and updater were not executed and no isolated historical migration/rollback fixture was available; impact=operational reversibility and supply-chain assurance remain incomplete; available_evidence=S-034,S-038; next_probe=exercise pinned install, forced download/install failure, state migration, downgrade, and rollback in a disposable VM with captured artifact attestations"
  counterevidence: "GitHub asset checksums and macOS signing exist but do not settle Python-package rollback or reproducibility"
  adversarial_status: CHALLENGED
- claim_id: C-025
  section: tests-qualification
  statement: "CI defines Python 3.12-3.14, lint/type, platform-build and smoke layers, and the bounded isolated probe ultimately passed 224 selected tests after retaining and explaining an initial 13 environment-induced failures."
  classification: FACT
  confidence: HIGH
  scope: "Declared HEAD CI and selected macOS arm64 local tests; excludes full suite and historical release CI status"
  source_ids: [S-035, S-041, S-042, S-043, S-044]
  fact_dependencies: []
  method: "Read CI matrix and ran three named isolated subsets with exact outputs; preserved first failed attempt."
  counterevidence: "S-044 records setup-induced failures; corrected reruns S-041 and S-042 discriminate the environment issue"
  adversarial_status: SUPPORTED
- claim_id: C-026
  section: security
  statement: "The repository supports security fixes only for the latest version and exposes model, host, credential-bearing plugin, MCP/protocol, local-state, hook, and telemetry trust boundaries with partial validation and approval controls."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned SECURITY policy and traced production boundaries; no penetration test"
  source_ids: [S-004, S-005, S-013, S-015, S-028, S-032, S-036]
  fact_dependencies: []
  method: "Read official policy and traced credential, host, extension, protocol, state, and telemetry crossings."
  counterevidence: "no repository threat model found in inspected security policy and production boundary sources"
  adversarial_status: NOT_PROBED
- claim_id: C-027
  section: security
  statement: "Resistance to traversal, symlink swaps, case collisions, filesystem races, and host escape is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Local KAOS and built-in file/shell operations at pinned snapshot"
  source_ids: [S-013, S-015, S-041]
  fact_dependencies: []
  method: "attempted_methods=static path/approval trace and selected path-utility tests; blocker=dynamic exploitation lacked explicit authorization and a dedicated least-privilege filesystem race harness; impact=filesystem confinement and TOCTOU security cannot be compared as proven; available_evidence=S-013,S-015,S-041; next_probe=run traversal, absolute, symlink-swap, case-collision, and race matrix entirely inside an authorized disposable OS sandbox"
  counterevidence: "canonicalization and sensitive checks exist but local KAOS still performs host operations"
  adversarial_status: CHALLENGED
- claim_id: C-028
  section: executable-entrypoints
  statement: "In the isolated probe, kimi --help exited zero and left redirected home and work directories empty while network and out-of-root writes were denied."
  classification: FACT
  confidence: HIGH
  scope: "HEAD-built kimi 1.49.0 help path on macOS 27.0 arm64"
  source_ids: [S-040]
  fact_dependencies: []
  method: "Compared filesystem trees before/after a sandboxed no-secret help invocation."
  counterevidence: "denied access attempts were not separately logged, so the claim is limited to exit and persistent directories"
  adversarial_status: SUPPORTED
- claim_id: C-029
  section: tool-interface
  statement: "Comprehensive behavior for malformed and oversized agent, tool, provider, model, and context inputs is unknown despite passing bounded Wire malformed-input tests."
  classification: UNKNOWN
  confidence: N/A
  scope: "All external schemas and content-size boundaries at pinned snapshot"
  source_ids: [S-023, S-042]
  fact_dependencies: []
  method: "attempted_methods=Wire invalid JSON/request/params tests and static reader/schema/size-limit review; blocker=full cross-boundary fuzzing and memory-pressure tests exceeded the safe depth budget; impact=robustness and denial-of-service comparisons remain partial; available_evidence=S-023,S-042; next_probe=resource-limit a disposable process and fuzz missing, extra, wrong-type, instruction-like, and boundary-size inputs for each producer-consumer interface"
  counterevidence: "Wire handles selected malformed inputs and declares a 100 MB reader limit, but this does not cover all interfaces"
  adversarial_status: CHALLENGED
- claim_id: C-030
  section: strengths
  statement: "Within local UI and IDE integration, typed replayable Wire plus standard ACP is a strong interoperability capability because schemas, direction, requests, errors, approvals, and cancellation are explicit and partly E2E-qualified."
  classification: INFERENCE
  confidence: HIGH
  scope: "Local trusted operator integration; excludes public remote exposure"
  source_ids: [S-023, S-024, S-025, S-026, S-042]
  fact_dependencies: [C-004, C-005, C-007]
  method: "Reasoning chain: explicit versioned protocol facts plus passing E2E imply comparatively inspectable integration; assumption=clients implement the declared trust boundary; alternative=a simpler one-way interface may be cheaper."
  counterevidence: "C-019 and C-029 limit audit and malformed-input confidence"
  adversarial_status: NOT_APPLICABLE:interpretive strength
- claim_id: C-031
  section: strengths
  statement: "Within a single operator-owned session, atomic state, recoverable JSONL, and source-scoped approval cancellation form a strong local recovery mechanism."
  classification: INFERENCE
  confidence: HIGH
  scope: "Single-writer local session; excludes multi-process collision"
  source_ids: [S-014, S-018, S-021, S-022, S-041, S-047]
  fact_dependencies: [C-014, C-022]
  method: "Reasoning chain: tested atomic/recovery facts plus cancellation rejection reduce common local crash/cancel loss; assumption=single writer; alternative=a transactional store would give stronger guarantees."
  counterevidence: "C-016 leaves cross-process consistency unknown"
  adversarial_status: NOT_APPLICABLE:interpretive strength
- claim_id: C-032
  section: liabilities
  statement: "Approved or auto-approved local and plugin actions create a host-authority liability because they can reach host files, processes, network, and selected credentials without harness sandbox confinement."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Local KAOS/plugin operation after grant; excludes ACP client sandboxing"
  source_ids: [S-013, S-015, S-028, S-041]
  fact_dependencies: [C-006, C-017]
  method: "Reasoning chain: direct host APIs plus credential-bearing subprocess and explicit auto grants imply host impact after mistaken grant; assumptions=tool/plugin can request consequential action; alternative=external OS sandbox can constrain the process."
  counterevidence: "approval, clean env, and timeout controls reduce but do not remove host authority"
  adversarial_status: NOT_APPLICABLE:interpretive liability
- claim_id: C-033
  section: liabilities
  statement: "Mutable local evidence, default-on retrying telemetry, and token-only accounting create an evidence, privacy, and monetary-control liability under sensitive or paid workloads."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Sensitive local sessions and paid provider use; no claim that sensitive content is actually transmitted"
  source_ids: [S-018, S-020, S-032, S-033, S-040, S-045]
  fact_dependencies: [C-018, C-020, C-040]
  method: "Reasoning chain: unauthenticated local records plus default telemetry and absent monetary accounting leave controls incomplete; assumptions=events may contain decision-relevant properties and providers may bill; alternative=downstream wrappers can add redaction/ledger/budgets."
  counterevidence: "telemetry is opt-out and typed primitive validation exists"
  adversarial_status: NOT_APPLICABLE:interpretive liability
- claim_id: C-034
  section: transferable-patterns
  statement: "A versioned typed event/request protocol with replay and explicit client authority is a CANDIDATE transferable pattern."
  classification: INFERENCE
  confidence: HIGH
  scope: "Research pattern for harness-core/UI separation; no adoption authority"
  source_ids: [S-023, S-024, S-042]
  fact_dependencies: [C-004, C-005]
  method: "Reasoning chain: explicit tested protocol boundaries solve UI coupling while preserving client trust; assumptions=version maintenance accepted; alternative=direct library callbacks."
  counterevidence: "C-019 and C-029 require stronger integrity and fuzzing"
  adversarial_status: NOT_APPLICABLE:pattern disposition
- claim_id: C-035
  section: transferable-patterns
  statement: "A source-scoped approval runtime that fails closed on cancellation independently of UI transport is a CANDIDATE transferable pattern."
  classification: INFERENCE
  confidence: HIGH
  scope: "Research pattern for consequential tool authorization; not a sandbox"
  source_ids: [S-013, S-014, S-041]
  fact_dependencies: [C-017, C-022]
  method: "Reasoning chain: explicit pending lifecycle and rejection on timeout/cancel solve orphan approvals; assumptions=all consequential paths use it; alternative=transport-local prompts risk orphaning."
  counterevidence: "explicit yolo/AFK/cache grants must remain visible"
  adversarial_status: NOT_APPLICABLE:pattern disposition
- claim_id: C-036
  section: transferable-patterns
  statement: "Atomic small-state snapshots plus recoverable JSONL history are a CONDITIONAL transferable pattern only with an explicit single-writer or locking rule."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Research pattern for local sessions; no multi-writer guarantee"
  source_ids: [S-018, S-021, S-022, S-047]
  fact_dependencies: [C-014]
  method: "Reasoning chain: tested local recovery is useful, but absent cross-file transaction/lock requires a prerequisite; assumption=append recovery tolerates partial tail; alternative=transactional database/event store."
  counterevidence: "C-016 and C-019 remain unresolved"
  adversarial_status: NOT_APPLICABLE:pattern disposition
- claim_id: C-037
  section: rejected-patterns-curiosity-no-go
  statement: "Using separate successor internals as evidence for this dossier is CURIOSITY_NO_GO because the assigned target is kimi-cli and the in-repo kimi-code package is only an alias."
  classification: INFERENCE
  confidence: HIGH
  scope: "Research scope boundary only"
  source_ids: [S-003, S-006, S-037]
  fact_dependencies: [C-003, C-041]
  method: "Reasoning chain: official wind-down notice identifies a separate repository while local package aliases current runtime; assumption=one-target ownership contract; alternative=a separately assigned successor dossier."
  counterevidence: "none; successor relevance does not change source provenance"
  adversarial_status: NOT_APPLICABLE:scope rejection
- claim_id: C-038
  section: rejected-patterns-curiosity-no-go
  statement: "Treating prompt-only read-only Shell guidance as executable enforcement is CURIOSITY_NO_GO."
  classification: INFERENCE
  confidence: HIGH
  scope: "Explore subagent at pinned snapshot"
  source_ids: [S-010, S-013, S-015]
  fact_dependencies: [C-009, C-017]
  method: "Reasoning chain: Shell remains allowed and local KAOS is host-authoritative, so instruction text cannot remove authority; assumption=adversarial or mistaken commands are possible; alternative=command allowlist/read-only backend."
  counterevidence: "the prompt strongly instructs read-only behavior but is not an enforcement point"
  adversarial_status: NOT_APPLICABLE:pattern rejection
- claim_id: C-039
  section: rejected-patterns-curiosity-no-go
  statement: "Using fail-open hooks as the sole authorization boundary is CURIOSITY_NO_GO."
  classification: INFERENCE
  confidence: HIGH
  scope: "Shell/Wire hooks at pinned snapshot"
  source_ids: [S-029, S-030, S-043]
  fact_dependencies: [C-008]
  method: "Reasoning chain: errors and timeouts explicitly allow, so sole-gate authorization can bypass on failure; assumption=availability failures occur; alternative=separate fail-closed approval/policy enforcement."
  counterevidence: "explicit deny can block when hook execution succeeds"
  adversarial_status: NOT_APPLICABLE:pattern rejection
- claim_id: C-040
  section: evidence-observability
  statement: "Telemetry is default-on unless disabled, sends to telemetry-logs.kimi.com, retries and persists failures for up to seven days, and has no content-redaction function in the bounded sink/transport package."
  classification: FACT
  confidence: HIGH
  scope: "Pinned config/app/telemetry package; absence bounded to telemetry source, not all callers"
  source_ids: [S-008, S-031, S-032, S-033, S-043, S-045]
  fact_dependencies: []
  method: "Read default/attach/endpoint/retry/disk-expiry code, ran telemetry tests, and manually inspected plus searched telemetry source for redaction vocabulary."
  counterevidence: "primitive type validation exists and telemetry can be disabled; neither is a sink-level content redactor"
  adversarial_status: SUPPORTED
- claim_id: C-041
  section: install-update-release
  statement: "Official repository text says kimi-cli will be gradually wound down for the separate kimi-code successor, while the security policy supports only the latest kimi-cli version."
  classification: FACT
  confidence: HIGH
  scope: "Pinned README/getting-started/security/release/package text at cutoff"
  source_ids: [S-006, S-034, S-036, S-037, S-038]
  fact_dependencies: []
  method: "Read official lifecycle notice, compatibility package, security policy, and release alignment checks."
  counterevidence: "docs and existing installation instructions remain available, so wind-down is not represented as immediate removal"
  adversarial_status: SUPPORTED
```

## 27. Source ledger {#source-ledger}

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Pinned repository, tree, tag, dirty, and submodule identity"
  url: "https://github.com/MoonshotAI/kimi-cli/commit/cbc15c076d17f70fec9f89c90c0502e68657f505"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505 and tag 1.49.0"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-identity-observation"
  symbol: "git object identity"
  line_anchor: "N/A:no-line-anchor"
  command: "git remote get-url origin; git rev-parse HEAD; git show -s --format='%cI' HEAD; git status --porcelain=v1; git submodule status; git ls-tree -r HEAD | shasum -a 256; git rev-parse '1.49.0^{commit}'; git show -s --format='%cI' 1.49.0"
  command_environment: "macOS 27.0 arm64; git 2.54.0; official partial clone; passive, no target execution"
  output_or_hash: "inline:origin=https://github.com/MoonshotAI/kimi-cli.git; HEAD=cbc15c076d17f70fec9f89c90c0502e68657f505; HEAD_date=2026-08-03T07:58:11Z; status=clean; submodules=none; tree_listing_sha256=5a8b7c7d45dc37631b801372779d2dff982685f6841ccab7b662b55b82d7db59; tag_commit=4a550effdfcb29a25a5d325bf935296cc50cd417; tag_date=2026-07-16T10:03:00Z"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-023]
  notes: "Primary immutable identity; empty dirty/submodule outputs are reported explicitly."
- source_id: S-002
  source_kind: repository-file
  title: "Root package and workspace manifest"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/pyproject.toml#L1-L75"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "pyproject.toml"
  symbol: "project; tool.uv.workspace; project.scripts"
  line_anchor: "L1-L75"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:pyproject.toml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:b2740ff71ac92e3aad9c255623abd7e670b8bb8e3152ea44a3b977b0bcdfb5e6"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-003, C-004]
  notes: "HEAD manifest; its kosong 0.56.0 pin is not attributed to release wheel 1.49.0."
- source_id: S-003
  source_kind: release-metadata
  title: "PyPI kimi-cli 1.49.0 release JSON"
  url: "https://pypi.org/pypi/kimi-cli/1.49.0/json"
  commit_or_ref: "1.49.0"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "pypi/kimi-cli@1.49.0 wheel-sha256:3a0ed632bed97f8bf05403309ea3823031051ca27264ff6d5f2b2b01bc90976e; sdist-sha256:26e98b753d23a37136ce11a89d4fa256b88537db24b3a0afabe5d134e3ce58ee"
  code_path: "N/A:no-code-path"
  symbol: "PyPI JSON info and urls"
  line_anchor: "JSON pointers /info and /urls"
  command: "curl --fail --location --silent --show-error https://pypi.org/pypi/kimi-cli/1.49.0/json -o pypi.json && shasum -a 256 pypi.json"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; passive HTTPS retrieval; no credentials"
  output_or_hash: "sha256:746debcd5ba3fa14610d38435de66e0f2cc6806c12dbce9bd9773c3853eabdab"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-002, C-023, C-037]
  notes: "Official registry metadata; license and license_expression are null."
- source_id: S-004
  source_kind: license
  title: "Root Apache License 2.0 text"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/LICENSE#L1-L202"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE"
  symbol: "Apache License Version 2.0"
  line_anchor: "L1-L202"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:LICENSE | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:58d1e17ffe5109a7ae296caafcadfdbe6a7d176f0bc4ab01e12a689b0499d8bd"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-026]
  notes: "Actual license text preferred over badges or registry metadata."
- source_id: S-005
  source_kind: license
  title: "Root NOTICE provenance"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/NOTICE#L1-L14"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "NOTICE"
  symbol: "Kimi Code CLI notices"
  line_anchor: "L1-L14"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:NOTICE | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:6bdd9ca6fd120dcd6ba5e16bf2bacc01f42781fd2d9754ec934c5db05fcdc395"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-026]
  notes: "Names Moonshot AI and the specific reused Codex skill."
- source_id: S-006
  source_kind: official-documentation
  title: "README lifecycle and successor notice"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/README.md#L9-L18"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "README.md"
  symbol: "wind-down notice"
  line_anchor: "L9-L18"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:README.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:dc8992517be50091b4119410bd31bc53c1cb93e2b905868698ce98ec613b36a7"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-037, C-041]
  notes: "Official vendor lifecycle statement, not independent proof of migration behavior."
- source_id: S-007
  source_kind: repository-file
  title: "CLI option, mode, session, and subcommand dispatch"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/cli/__init__.py#L50-L1022"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/cli/__init__.py"
  symbol: "cli; _run; acp"
  line_anchor: "L50-L1022"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/cli/__init__.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:00c5c276a24039e275a4a52e372214355f8b6f1751626b53e030beba660f60e1"
  access_date: "2026-08-24"
  supports_claims: [C-004]
  notes: "Broad anchor covers declarations, validation, session setup, KimiCLI.create, and UI dispatch."
- source_id: S-008
  source_kind: repository-file
  title: "KimiCLI composition and run orchestration"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/app.py#L120-L823"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/app.py"
  symbol: "KimiCLI.create; KimiCLI.run; run_print; run_acp; run_wire_stdio"
  line_anchor: "L120-L823"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/app.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:5fbbef5db403f323552bf37e930d5c579747faab6b0b0466b72af6584521c1e9"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005, C-040]
  notes: "Composition root; includes telemetry attach/disable branch at L330-L352."
- source_id: S-009
  source_kind: repository-file
  title: "KimiSoul turn, retry, token, cancellation, and compaction loop"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/soul/kimisoul.py#L841-L1746"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/soul/kimisoul.py"
  symbol: "KimiSoul._turn; _step; compact_context; _is_retryable_error"
  line_anchor: "L841-L1746"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/soul/kimisoul.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:779e722966727741df2994dae7036aff877431cdfe6d27ce075816a12ae3240f"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-013, C-020, C-021, C-022]
  notes: "Primary loop source; runtime behavior is separately bounded by S-041."
- source_id: S-010
  source_kind: repository-file
  title: "Default agent and subagent registry"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/agents/default/agent.yaml#L1-L36"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/agents/default/agent.yaml (with explore.yaml compared)"
  symbol: "agent.tools; agent.subagents; explore.allowed_tools"
  line_anchor: "agent.yaml L1-L36; explore.yaml L1-L46"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/agents/default/agent.yaml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:115c3d9cfacc506dc5f5ab10ddcec8cae40c27f691738b0ce38515ea10b72078"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-010, C-038]
  notes: "Hash covers agent.yaml; explore.yaml was manually compared at the same commit and is identified in code_path/anchor."
- source_id: S-011
  source_kind: repository-file
  title: "Subagent execution, resume, hooks, and approval lifecycle"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/subagents/runner.py#L187-L423"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/subagents/runner.py"
  symbol: "ForegroundSubagentRunner.run; resolve_launch_spec"
  line_anchor: "L187-L423"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/subagents/runner.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:35884f0562a290171bf1720ffabf6a34cdc2640df5dfdb2e1d092d373a921aee"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-015, C-016]
  notes: "In-process subagent guard does not imply cross-process session locking."
- source_id: S-012
  source_kind: repository-file
  title: "Kimi toolset MCP and Wire external-tool boundary"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/soul/toolset.py#L615-L1104"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/soul/toolset.py"
  symbol: "KimiToolset.load_mcp_tools; MCPTool; WireExternalTool; convert_mcp_tool_result"
  line_anchor: "L615-L1104"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/soul/toolset.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:98de589911934f2786a64ecb22eee4b56c8044d714fc3244948d668cfc91bf11"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-010, C-015]
  notes: "Production MCP and external-tool path; live servers were not contacted."
- source_id: S-013
  source_kind: repository-file
  title: "Approval states, auto modes, rejection, and session cache"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/soul/approval.py#L70-L413"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/soul/approval.py"
  symbol: "ApprovalResult; ApprovalState; Approval.request"
  line_anchor: "L70-L413"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/soul/approval.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:3c144c203589be4f5ec491d8691e095410bc847ece7c62201333a8fc8f4c6db5"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-017, C-026, C-027, C-032, C-035, C-038]
  notes: "Approval policy is not described as sandbox enforcement."
- source_id: S-014
  source_kind: repository-file
  title: "Transport-independent approval runtime"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/approval_runtime/runtime.py#L48-L189"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/approval_runtime/runtime.py"
  symbol: "ApprovalRuntime.create_request; wait_for_response; resolve; cancel_by_source"
  line_anchor: "L48-L189"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/approval_runtime/runtime.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:bff091967a907497f1475e26cecdd94c46af726b5ed20d92f927ae04b225e0fb"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-017, C-022, C-031, C-035]
  notes: "Cancellation records reject; selected runtime tests are S-041."
- source_id: S-015
  source_kind: repository-file
  title: "Local KAOS host filesystem and process backend"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/packages/kaos/src/kaos/local.py#L31-L179"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "packages/kaos/src/kaos/local.py"
  symbol: "LocalKaos"
  line_anchor: "L31-L179"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:packages/kaos/src/kaos/local.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:578eef49c6be6234e214b1b7b7854cacfc775917e2fea94159ee02c3702d1648"
  access_date: "2026-08-24"
  supports_claims: [C-017, C-026, C-027, C-032, C-038]
  notes: "Direct host API structure; no unsafe host-escape execution performed."
- source_id: S-016
  source_kind: repository-file
  title: "LLM provider/model adaptation and token estimation"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/llm.py#L45-L540"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/llm.py"
  symbol: "LLM; compute_max_completion_tokens; estimate_request_tokens; create_llm; derive_model_capabilities"
  line_anchor: "L45-L540"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/llm.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:2a99e4240da182d6536976df6283602d729912a5da6ab8a498cd45ec3e50ea1a"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-012, C-020, C-021]
  notes: "Static multi-provider interface; only scripted/mocked runtime evidence retained."
- source_id: S-017
  source_kind: repository-file
  title: "Normalized provider TokenUsage schema"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/packages/kosong/src/kosong/chat_provider/__init__.py#L88-L120"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "packages/kosong/src/kosong/chat_provider/__init__.py"
  symbol: "StreamedMessage.usage; TokenUsage"
  line_anchor: "L88-L120"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:packages/kosong/src/kosong/chat_provider/__init__.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:de5a1744665f06c47c77df2d26eaaa63e1e9fcec91418495c9d1ff34c081dd82"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-020, C-021]
  notes: "Token categories are usage units, not monetary fields."
- source_id: S-018
  source_kind: repository-file
  title: "Context JSONL loading, token state, append, and malformed-line recovery"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/soul/context.py#L20-L338"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/soul/context.py"
  symbol: "Context"
  line_anchor: "L20-L338"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/soul/context.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:e4a66fcf0ea4b5fd463210d059d7cd5e67a813c47d2c6a40cb2dc5da7480733f"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-014, C-018, C-019, C-031, C-033, C-036]
  notes: "Append/recovery structure; not a cryptographically append-only ledger."
- source_id: S-019
  source_kind: repository-file
  title: "Compaction preparation, token estimate, and provider call"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/soul/compaction.py#L17-L198"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/soul/compaction.py"
  symbol: "CompactionResult; should_auto_compact; SimpleCompaction"
  line_anchor: "L17-L198"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/soul/compaction.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:9cee31d8bbfdf5d0043f2461e98902b32e64666f39c9bf62a4d30e0189a38645"
  access_date: "2026-08-24"
  supports_claims: [C-013]
  notes: "Documents structure and intent; semantic summary quality not measured."
- source_id: S-020
  source_kind: repository-file
  title: "Session directory identity, create/find/list, and deletion"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/session.py#L24-L318"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/session.py"
  symbol: "Session"
  line_anchor: "L24-L318"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/session.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:e5b437148f6c33744a7dd3d1af7d9354ec30e9fe32d8c14f71d493da33923d57"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-015, C-016, C-033]
  notes: "No cross-process lock guarantee inferred from directory naming."
- source_id: S-021
  source_kind: repository-file
  title: "Versioned session state, corruption fallback, and migration"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/session_state.py#L12-L132"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/session_state.py"
  symbol: "SessionState; load_session_state; save_session_state"
  line_anchor: "L12-L132"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/session_state.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:847fcc579a8074b5194b165486c853a0c7f199ebe5d20f40007583344fad696a"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-016, C-031, C-036]
  notes: "Corruption falls back to defaults and emits telemetry; selected tests S-041."
- source_id: S-022
  source_kind: repository-file
  title: "Atomic JSON write implementation"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/utils/io.py#L11-L27"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/utils/io.py"
  symbol: "atomic_json_write"
  line_anchor: "L11-L27"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/utils/io.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:353a77dfe844a84cdf398986c87c19bef6ca77bc66c4b0f12ee74c65f7a7645e"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-031, C-036]
  notes: "Atomic replacement of one JSON file, not a multi-file transaction."
- source_id: S-023
  source_kind: repository-file
  title: "Wire stdio JSON-RPC server"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/wire/server.py#L62-L1060"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/wire/server.py"
  symbol: "WireServer"
  line_anchor: "L62-L1060"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/wire/server.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:b4fd717cf0be3def0f47ad6a777e65466ed24627a23cb0266a229a3a087cce59"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005, C-007, C-010, C-018, C-019, C-022, C-029, C-030, C-034]
  notes: "Broad anchor includes reader limit, validation, initialize, prompt/replay/cancel, request correlation, and cleanup."
- source_id: S-024
  source_kind: official-documentation
  title: "Pinned Wire protocol documentation"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/docs/en/customization/wire-mode.md#L27-L246"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "docs/en/customization/wire-mode.md"
  symbol: "Wire protocol; initialize; prompt; replay"
  line_anchor: "L27-L246"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:docs/en/customization/wire-mode.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:a3fa27645c01c1e112014e9eaf386dfa15b451969fbe78c0460b26556f654e3b"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005, C-030, C-034]
  notes: "Official documentation triangulates direction/schema; runtime claims rely on S-042."
- source_id: S-025
  source_kind: repository-file
  title: "Multi-session ACP server"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/acp/server.py#L30-L416"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/acp/server.py"
  symbol: "ACPServer"
  line_anchor: "L30-L416"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/acp/server.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:1d640f85080ff422b4bf4774b4b6d4f2e5d2d15abbc83226adc37053b1c66476"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-009, C-015, C-016, C-030]
  notes: "Maps per-session objects in one stdio server; docs do not prove cross-process isolation."
- source_id: S-026
  source_kind: repository-file
  title: "ACP protocol/spec/SDK version mapping"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/acp/version.py#L6-L45"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/acp/version.py"
  symbol: "ACPVersionSpec; CURRENT_VERSION; negotiate_version"
  line_anchor: "L6-L45"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/acp/version.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:b6db681d6e9dc51a1514687ecf6207cac4cab38fdd40feaf1e0b4101d0519f04"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-030]
  notes: "Protocol integer is not the same value as the ACP spec tag or SDK package version."
- source_id: S-027
  source_kind: repository-file
  title: "Deprecated single-session ACP rejection surface"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/ui/acp/__init__.py#L11-L99"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/ui/acp/__init__.py"
  symbol: "ACPServerSingleSession._raise; ACP.run"
  line_anchor: "L11-L99"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/ui/acp/__init__.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:b0204d5f22a0ad4575c3f665a7dc444d2abd254b94dfc86b0883dde19e580de9"
  access_date: "2026-08-24"
  supports_claims: [C-004]
  notes: "The deprecated flag starts a server whose operations deliberately reject; it is not an alternate functional ACP server."
- source_id: S-028
  source_kind: repository-file
  title: "Plugin subprocess, approval, and credential injection"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/plugin/tool.py#L24-L173"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/plugin/tool.py"
  symbol: "PluginTool; load_plugin_tools"
  line_anchor: "L24-L173"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/plugin/tool.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:4c1a23f9a3b350ca1ddd39c558046502466dd88fb1ae1101cf567ca679d2bd65"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-017, C-026, C-032]
  notes: "No untrusted plugin was executed; credential values were never read or exposed."
- source_id: S-029
  source_kind: repository-file
  title: "Hook matching, concurrency, blocking, and fail-open engine"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/hooks/engine.py#L65-L371"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/hooks/engine.py"
  symbol: "HookEngine.trigger; _trigger_impl; _run_wire_hook"
  line_anchor: "L65-L371"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/hooks/engine.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:3b208bc8d8470f2e72546b9b0840e40e6a49ac6caedb42bc9470f2b0196dc117"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-039]
  notes: "Both shell and Wire hook failures are represented."
- source_id: S-030
  source_kind: repository-file
  title: "Hook subprocess runner"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/hooks/runner.py#L23-L89"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/hooks/runner.py"
  symbol: "run_hook"
  line_anchor: "L23-L89"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/hooks/runner.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:4fbb10eb5b54af4242c6c92c4e21a5ea2d6b02052eabe8bfd587668d98d7c377"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-022, C-039]
  notes: "Exit 2 and structured deny block; other exit/error/timeout paths allow."
- source_id: S-031
  source_kind: repository-file
  title: "Provider/model configuration and telemetry default"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/config.py#L35-L272"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/config.py"
  symbol: "LLMProvider; LLMModel; Config.telemetry; Config validation"
  line_anchor: "L35-L272"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/config.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:77802fce6b65addf061e1607e04de0646ffa06d1d4c38d807a4cff6635a791c9"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-040]
  notes: "SecretStr serialization and model/provider references are structural controls, not live secret-storage proof."
- source_id: S-032
  source_kind: repository-file
  title: "Telemetry endpoint, retry, anonymous fallback, disk retention"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/telemetry/transport.py#L22-L314"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/telemetry/transport.py"
  symbol: "TELEMETRY_ENDPOINT; AsyncTransport"
  line_anchor: "L22-L314"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/telemetry/transport.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:a0ba0d93295ef838730849e0a4b0fc02906bbef955769af1d1c85785a9fdc3e9"
  access_date: "2026-08-24"
  supports_claims: [C-018, C-019, C-026, C-033, C-040]
  notes: "Endpoint was not contacted; runtime tests used local/mocked transports."
- source_id: S-033
  source_kind: repository-file
  title: "Telemetry event sink buffering and flush"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/telemetry/sink.py#L19-L142"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/telemetry/sink.py"
  symbol: "EventSink"
  line_anchor: "L19-L142"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/telemetry/sink.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:b1e1a11a146b6ce68c42643f4b0dddb794dcfda71013cab6323941e244a8bf4f"
  access_date: "2026-08-24"
  supports_claims: [C-018, C-019, C-033, C-040]
  notes: "Manual complete-file read found enrichment/buffering but no sink-level content redactor."
- source_id: S-034
  source_kind: release-metadata
  title: "Pinned kimi-cli release workflow"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/.github/workflows/release-kimi-cli.yml#L1-L510"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/release-kimi-cli.yml"
  symbol: "validate; build; release; publish-python jobs"
  line_anchor: "L1-L510"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:.github/workflows/release-kimi-cli.yml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive workflow inspection"
  output_or_hash: "sha256:76c2802baf2309f14843b679108bbf977d444d46098558314b19f0eda7f43ebc"
  access_date: "2026-08-24"
  supports_claims: [C-023, C-024, C-041]
  notes: "Workflow structure is not proof that every historical job succeeded."
- source_id: S-035
  source_kind: repository-file
  title: "Pinned kimi-cli CI workflow"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/.github/workflows/ci-kimi-cli.yml#L1-L282"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/ci-kimi-cli.yml"
  symbol: "check; test; build; release-validate; nix-test jobs"
  line_anchor: "L1-L282"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:.github/workflows/ci-kimi-cli.yml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive workflow inspection"
  output_or_hash: "sha256:5d9c151e7aab62ea6644a5324ede0462fe10dce5d3d85f90c06d5bab1ef42bc6"
  access_date: "2026-08-24"
  supports_claims: [C-023, C-025]
  notes: "Declared matrix only; exact run status was not fetched."
- source_id: S-036
  source_kind: security-advisory
  title: "Official security policy"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/SECURITY.md#L1-L9"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "SECURITY.md"
  symbol: "Supported Versions; Reporting a Vulnerability"
  line_anchor: "L1-L9"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:SECURITY.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:fceec52b5f9a9712c0a1a7b3e3858c5cb24e4eb654e2800a0b0367ee0753806b"
  access_date: "2026-08-24"
  supports_claims: [C-026, C-041]
  notes: "Policy is brief and contains no threat model."
- source_id: S-037
  source_kind: repository-file
  title: "In-repo kimi-code compatibility package manifest"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/packages/kimi-code/pyproject.toml#L1-L17"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "packages/kimi-code/pyproject.toml"
  symbol: "project.dependencies; project.scripts"
  line_anchor: "L1-L17"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:packages/kimi-code/pyproject.toml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:a79e2177dcd3b9e2b5ae7500f098a2f7718551735f5a2d0e02fc48495be2dbec"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-037, C-041]
  notes: "The seven-line alias module was also read; this manifest independently pins kimi-cli==1.49.0."
- source_id: S-038
  source_kind: official-documentation
  title: "Pinned installation, upgrade, uninstall, and migration guidance"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/docs/en/guides/getting-started.md#L25-L75"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "docs/en/guides/getting-started.md"
  symbol: "Installation; Upgrade and uninstall"
  line_anchor: "L25-L75"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:docs/en/guides/getting-started.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection; install commands not run"
  output_or_hash: "sha256:63b451ed682fd80f2fcf40e5b416206c653bb456d6da3dda58745d1cf59e59da"
  access_date: "2026-08-24"
  supports_claims: [C-023, C-024, C-041]
  notes: "Mutable curl/uv examples are documentation, not immutable retrieval commands used by this research."
- source_id: S-039
  source_kind: package-artifact
  title: "Downloaded kimi-cli 1.49.0 wheel and embedded metadata"
  url: "https://files.pythonhosted.org/packages/31/44/677c07fcefb99bf28eefed1248fddc4880801576dd5aee911c9e6492c265/kimi_cli-1.49.0-py3-none-any.whl"
  commit_or_ref: "1.49.0"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "pypi/kimi-cli@1.49.0 wheel-sha256:3a0ed632bed97f8bf05403309ea3823031051ca27264ff6d5f2b2b01bc90976e"
  code_path: "kimi_cli-1.49.0.dist-info/METADATA; WHEEL; entry_points.txt"
  symbol: "package metadata and console scripts"
  line_anchor: "N/A:archive-members-not-line-addressed"
  command: "curl --fail --location --silent --show-error 'https://files.pythonhosted.org/packages/31/44/677c07fcefb99bf28eefed1248fddc4880801576dd5aee911c9e6492c265/kimi_cli-1.49.0-py3-none-any.whl' -o kimi_cli-1.49.0-py3-none-any.whl && shasum -a 256 kimi_cli-1.49.0-py3-none-any.whl"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; passive download; archive inspected with Python 3.9 zipfile; no package code executed"
  output_or_hash: "sha256:3a0ed632bed97f8bf05403309ea3823031051ca27264ff6d5f2b2b01bc90976e"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-002, C-003, C-023]
  notes: "5,607,009 bytes; METADATA says Python >=3.12 and kosong==0.55.0; Root-Is-Purelib true; py3-none-any."
- source_id: S-040
  source_kind: runtime-observation
  title: "Sandboxed kimi --help startup/no-op probe"
  url: "https://github.com/MoonshotAI/kimi-cli/commit/cbc15c076d17f70fec9f89c90c0502e68657f505"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "local-head-build/kimi-cli@1.49.0 from cbc15c076d17f70fec9f89c90c0502e68657f505"
  code_path: "src/kimi_cli/cli/__init__.py"
  symbol: "kimi --help"
  line_anchor: "N/A:runtime-output"
  command: "env -i HOME=$PROBE/runhome TMPDIR=$PROBE/tmp PATH=$PROBE/src/.venv/bin:/usr/bin:/bin XDG_CONFIG_HOME=$PROBE/runhome/.config XDG_DATA_HOME=$PROBE/runhome/.local/share sandbox-exec -f $PROBE/no-network.sb $PROBE/src/.venv/bin/kimi --help; find $PROBE/runhome $PROBE/work -mindepth 1 -print"
  command_environment: "macOS 27.0 arm64; Python 3.12.13; disposable git archive; no secrets; network denied; host-home reads denied; writes restricted to probe root"
  output_or_hash: "inline:exit=0; help listed shell options plus login/logout/term/acp/info/export/mcp/plugin/vis/web; before_entries=[]; after_entries=[]"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-028, C-033]
  notes: "No sandbox violation log was retained; claim is limited to exit and persistent redirected directories."
- source_id: S-041
  source_kind: test-output
  title: "Isolated core approval, hook, state, retry, token, atomic-write, and path tests"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/tests/core/test_approval_runtime.py#L27-L340"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "local-head-build/kimi-cli@1.49.0 from cbc15c076d17f70fec9f89c90c0502e68657f505"
  code_path: "tests/core/test_approval_runtime.py; tests/hooks/test_runner.py; tests/core/test_session_state.py; tests/core/test_kimisoul_retry_recovery.py; tests/core/test_kimisoul_completion_budget.py; packages/kosong/tests/test_kimi_stream_usage.py; tests/utils/test_atomic_json_write.py; tests/utils/test_is_within_workspace.py"
  symbol: "selected pytest tests"
  line_anchor: "N/A:multi-file selected test run"
  command: "sandbox-exec -f $PROBE/no-network-signal.sb $PROBE/src/.venv/bin/pytest -q tests/core/test_approval_runtime.py tests/hooks/test_runner.py tests/core/test_session_state.py tests/core/test_kimisoul_retry_recovery.py tests/core/test_kimisoul_completion_budget.py packages/kosong/tests/test_kimi_stream_usage.py tests/utils/test_atomic_json_write.py tests/utils/test_is_within_workspace.py"
  command_environment: "macOS 27.0 arm64; Python 3.12.13; pytest 9.0.2; disposable snapshot; env cleared; no secrets; network denied; host-home reads denied; writes restricted to probe root; signals allowed for known timeout cleanup"
  output_or_hash: "inline:90 passed in 5.51s; exit=0; output_sha256=f6f58b2bf3be2b9cf4fb20952c5545ef7f3d7e9f156bb3695bfdf7ce8c68c223"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-011, C-012, C-014, C-017, C-020, C-021, C-022, C-025, C-027, C-031, C-032, C-035]
  notes: "Tests establish only named fixture behavior; redirected HOME received expected test-created session state."
- source_id: S-042
  source_kind: test-output
  title: "Isolated Wire protocol and error E2E tests"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/tests_e2e/test_wire_protocol.py#L24-L411"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "local-head-build/kimi-cli@1.49.0 from cbc15c076d17f70fec9f89c90c0502e68657f505"
  code_path: "tests_e2e/test_wire_errors.py; tests_e2e/test_wire_protocol.py"
  symbol: "Wire initialize, external tool, malformed/error, and legacy-no-initialize cases"
  line_anchor: "N/A:multi-file selected test run"
  command: "UV_OFFLINE=1 UV_PYTHON=$PROBE/src/.venv/bin/python sandbox-exec -f $PROBE/no-network-signal.sb $PROBE/src/.venv/bin/pytest -q tests_e2e/test_wire_errors.py tests_e2e/test_wire_protocol.py"
  command_environment: "macOS 27.0 arm64; Python 3.12.13; pytest 9.0.2; uv 0.11.27 copied into disposable PATH; scripted provider; env cleared; no secrets; network denied; writes restricted"
  output_or_hash: "inline:12 passed in 10.49s; exit=0; output_sha256=c89889e390890599d4daecbf7b6f312c83296580b9e5ba1e70e038fbf9d552d0"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005, C-007, C-010, C-022, C-025, C-029, C-030, C-034]
  notes: "No live provider/network; subprocess used already-synced local environment in offline mode."
- source_id: S-043
  source_kind: test-output
  title: "Isolated observability, telemetry, crash, logging, and hook tests"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/tests/telemetry/test_telemetry.py#L1-L500"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "local-head-build/kimi-cli@1.49.0 from cbc15c076d17f70fec9f89c90c0502e68657f505"
  code_path: "tests/core/test_approval_telemetry.py; tests/telemetry/test_telemetry.py; tests/telemetry/test_crash.py; tests/core/test_session_logging.py; tests/hooks/test_integration.py"
  symbol: "selected pytest observability tests"
  line_anchor: "N/A:multi-file selected test run"
  command: "sandbox-exec -f $PROBE/no-network-signal.sb $PROBE/src/.venv/bin/pytest -q tests/core/test_approval_telemetry.py tests/telemetry/test_telemetry.py tests/telemetry/test_crash.py tests/core/test_session_logging.py tests/hooks/test_integration.py"
  command_environment: "macOS 27.0 arm64; Python 3.12.13; pytest 9.0.2; disposable snapshot; env cleared; no secrets; network denied; writes restricted"
  output_or_hash: "inline:122 passed in 0.72s; exit=0; output_sha256=3aa7bf18f29aaf542e2b488fcf1e40c1203a04e2ff2eb42b78f136cb752ea6ae"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-018, C-019, C-025, C-039, C-040]
  notes: "Passing fixtures do not establish privacy or tamper evidence."
- source_id: S-044
  source_kind: test-output
  title: "Retained initial isolation/setup-challenged test result"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/tests_e2e/wire_helpers.py#L248-L285"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "local-head-build/kimi-cli@1.49.0 from cbc15c076d17f70fec9f89c90c0502e68657f505"
  code_path: "same selection as S-041 plus tests_e2e/test_wire_errors.py and test_wire_protocol.py"
  symbol: "initial pytest run before disposable PATH/signal correction"
  line_anchor: "N/A:multi-file test output"
  command: "sandbox-exec -f $PROBE/no-network.sb $PROBE/src/.venv/bin/pytest -q <selected core and Wire paths>"
  command_environment: "macOS 27.0 arm64; Python 3.12.13; pytest 9.0.2; disposable snapshot; PATH lacked uv; signals denied; no secrets; network denied"
  output_or_hash: "inline:13 failed, 89 passed in 5.87s; 12 failures=FileNotFoundError for uv in Wire subprocess helper; 1 failure=hook returned allow with stderr '[Errno 1] Operation not permitted' but timed_out=False because sandbox denied kill signal; output_sha256=6d71ffd14f5afde75344a75c0aa5da7cf8e8c5035986b3d1c61924da2fc7f2a7"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-022, C-025]
  notes: "Negative result retained; S-041/S-042 changed only declared test harness PATH/interpreter/signal permissions and then passed."
- source_id: S-045
  source_kind: runtime-observation
  title: "Bounded monetary-accounting and telemetry-redactor absence search"
  url: "https://github.com/MoonshotAI/kimi-cli/tree/cbc15c076d17f70fec9f89c90c0502e68657f505/src"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src; packages/kosong/src; packages/kaos/src; src/kimi_cli/telemetry"
  symbol: "bounded vocabulary/reference search plus manual source reads S-009,S-016,S-017,S-032,S-033"
  line_anchor: "N/A:defined multi-file search universe"
  command: "rg -n -i '\\b(price|pricing|spend|currency|usd|billing|monetary|cost[_ -]?limit|cost[_ -]?budget)\\b' src packages/kosong/src packages/kaos/src; rg -n -i '\\bcost\\b' src packages/kosong/src packages/kaos/src; rg -n -i 'redact|scrub|saniti[sz]e|secret|prompt|content' src/kimi_cli/telemetry"
  command_environment: "macOS 27.0 arm64; ripgrep; clean pinned tree; passive static search; manually triaged all returned lines"
  output_or_hash: "inline:monetary vocabulary returned only bundled skill prose about billing metrics; generic cost returned two token/prose uses; telemetry search returned prompt_toolkit comment and HTTP Content-Type, with no redactor symbol; zero results are bounded to the named universe and triangulated by manual reads"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-021, C-033, C-040]
  notes: "Negative search is not generalized to arbitrary plugins, providers, successor code, or callers outside the universe."
- source_id: S-046
  source_kind: runtime-observation
  title: "Decision-critical canonical URL status check"
  url: "https://raw.githubusercontent.com/MoonshotAI/kimi-cli/cbc15c076d17f70fec9f89c90c0502e68657f505/pyproject.toml"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505 and PyPI 1.49.0"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "pypi/kimi-cli@1.49.0 wheel-sha256:3a0ed632bed97f8bf05403309ea3823031051ca27264ff6d5f2b2b01bc90976e"
  code_path: "pyproject.toml; LICENSE; SECURITY.md; N/A:PyPI JSON"
  symbol: "HTTP reachability"
  line_anchor: "N/A:transport-status-observation"
  command: "for U in <immutable raw pyproject, LICENSE, SECURITY, GitHub commit API, PyPI 1.49.0 JSON>; do curl --location --silent --show-error --output /dev/null --write-out '%{http_code} %{url_effective}\\n' $U; done"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; no credentials; passive HTTPS"
  output_or_hash: "inline:200 raw pyproject; 200 raw LICENSE; 200 raw SECURITY; 403 unauthenticated GitHub commit API; 200 PyPI 1.49.0 JSON"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-023]
  notes: "403 retained as negative transport result; no retry because local git and immutable raw sources already establish identity."
- source_id: S-047
  source_kind: repository-file
  title: "Wire JSONL metadata, append, parsing, and malformed-line recovery"
  url: "https://github.com/MoonshotAI/kimi-cli/blob/cbc15c076d17f70fec9f89c90c0502e68657f505/src/kimi_cli/wire/file.py#L19-L150"
  commit_or_ref: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  package_identity: "N/A:not-a-package"
  code_path: "src/kimi_cli/wire/file.py"
  symbol: "WireFileMetadata; WireMessageRecord; WireFile"
  line_anchor: "L19-L150"
  command: "git show cbc15c076d17f70fec9f89c90c0502e68657f505:src/kimi_cli/wire/file.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:2414b6914c0c1ca1ba109636b56560975fb2d426b978d3c3367acdb21b594025"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-018, C-019, C-031, C-036]
  notes: "Malformed record skip supports partial recovery, not authenticated append-only evidence."
```

### Bibliography rationale

- **Identity/release:** S-001–S-003, S-039, and S-046 were retained because they independently bind git objects, registry metadata, downloaded bytes, and URL reachability; they are preferable to badges, mutable branches, or recalled version numbers.
- **Executable composition and interfaces:** S-007–S-019 and S-023–S-033 are the narrowest primary production files that trace each decision-relevant boundary from composition to side effect/failure. Documentation S-024 is retained only to clarify declared wire direction/schema and is triangulated by code and S-042.
- **Persistence/concurrency:** S-020–S-022 and S-047 were selected because they are the actual storage adapters and atomic-write implementation, preferable to session user guides.
- **Lifecycle/security:** S-034–S-038 are official pinned workflow, policy, compatibility, and install sources. They establish declared process and support scope, not successful execution or legal/security acceptance.
- **Dynamic evidence:** S-040–S-043 are isolated, no-secret runtime observations. S-044 is deliberately retained negative evidence to expose the initial harness contradiction and its discriminating correction rather than hide failed tests.
- **Bounded negatives:** S-045 records the exact search universe and manual triangulation for absent monetary accounting/redactor symbols; S-046 retains the GitHub API 403. Neither negative is generalized beyond its stated universe.
- **Rejected alternatives:** mutable documentation pages, search snippets, popularity, issues/comments, and third-party summaries were not needed to establish executable behavior and were therefore not retained as evidence.

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "moonshotai-kimi-cli-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "MoonshotAI/kimi-cli"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/MoonshotAI/kimi-cli"
  resolved_commit: "cbc15c076d17f70fec9f89c90c0502e68657f505"
  observed_ref: "HEAD@cbc15c076d17f70fec9f89c90c0502e68657f505; tag:1.49.0@4a550effdfcb29a25a5d325bf935296cc50cd417"
  package_identity: "pypi/kimi-cli@1.49.0+wheel-sha256:3a0ed632bed97f8bf05403309ea3823031051ca27264ff6d5f2b2b01bc90976e;sdist-sha256:26e98b753d23a37136ce11a89d4fa256b88537db24b3a0afabe5d134e3ce58ee"
research:
  researcher: "API session ses_fc91cf68affcZBGO5X92Fzc7LH"
  owned_path: "research/harnesses/kimi-cli.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "OBSERVED"
    summary: "The clean HEAD commit, distinct release tag, tree hash, package version, and wheel/sdist digests are pinned without conflating source and release dependency versions."
    confidence: "HIGH"
    claim_ids: ["C-001"]
    source_ids: ["S-001", "S-002", "S-003", "S-039", "S-046"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "OBSERVED"
    summary: "Repository Apache-2.0 and NOTICE text are pinned separately from null PyPI license metadata, without a transitive-license conclusion."
    confidence: "HIGH"
    claim_ids: ["C-002"]
    source_ids: ["S-003", "S-004", "S-005", "S-039"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "OBSERVED"
    summary: "Production, SDK, frontend, test, example, and compatibility packages are mapped to paths and bounded roles."
    confidence: "HIGH"
    claim_ids: ["C-003"]
    source_ids: ["S-002", "S-006", "S-037", "S-039"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "OBSERVED"
    summary: "CLI, print, Wire, ACP, web/visualizer, and management surfaces are traced, with help startup and selected Wire paths dynamically qualified."
    confidence: "HIGH"
    claim_ids: ["C-004", "C-028"]
    source_ids: ["S-002", "S-007", "S-023", "S-025", "S-040", "S-042"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "OBSERVED"
    summary: "A representative prompt-to-provider-to-approved-tool-to-persisted-response turn is traced across control, data, authority, error, and evidence directions."
    confidence: "HIGH"
    claim_ids: ["C-005"]
    source_ids: ["S-008", "S-009", "S-023", "S-024", "S-042"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "PARTIAL"
    summary: "Plugin, MCP, Wire external-tool, and hook mechanisms are mapped, but arbitrary extension runtime conformance and stability guarantees are not established."
    confidence: "MEDIUM"
    claim_ids: ["C-006", "C-007", "C-008"]
    source_ids: ["S-012", "S-023", "S-028", "S-029", "S-030", "S-042", "S-043", "S-044"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "PARTIAL"
    summary: "Named subagent lifecycle, persistence, resume, cancellation, tools, and parent/child data flow are mapped without tenant-isolation or prompt-compliance proof."
    confidence: "MEDIUM"
    claim_ids: ["C-009"]
    source_ids: ["S-010", "S-011", "S-025"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "PARTIAL"
    summary: "Tool schemas, asynchronous dispatch, approvals, results, and errors are mapped, while the complete malformed and oversized input matrix remains unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-010", "C-029"]
    source_ids: ["S-012", "S-013", "S-014", "S-023", "S-041", "S-042"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provider_interface"
    coverage: "PARTIAL"
    summary: "Provider selection, credential resolution, adapters, streaming, and error boundaries are statically traced and mock-qualified without live-provider conformance."
    confidence: "MEDIUM"
    claim_ids: ["C-011"]
    source_ids: ["S-016", "S-031", "S-041"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "OBSERVED"
    summary: "Model identity, capabilities, context size, thinking parameters, streaming, token allowance, and normalized usage are traced and locally qualified."
    confidence: "HIGH"
    claim_ids: ["C-012"]
    source_ids: ["S-016", "S-017", "S-041"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "Message ordering, token accounting, compaction, persistence, and contamination exposure are mapped without semantic injection resistance or exhaustive size testing."
    confidence: "MEDIUM"
    claim_ids: ["C-013", "C-029"]
    source_ids: ["S-009", "S-018", "S-019", "S-023", "S-042"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "OBSERVED"
    summary: "Atomic versioned state and recoverable context/Wire JSONL behavior are traced and qualified for bounded corruption and failed-write cases."
    confidence: "HIGH"
    claim_ids: ["C-014"]
    source_ids: ["S-018", "S-020", "S-021", "S-022", "S-041", "S-047"]
    pattern_disposition: "NO_POSITION"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "In-process concurrency and session/subagent namespacing are observed, but same-session cross-process collision behavior remains unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-016"]
    source_ids: ["S-011", "S-012", "S-020", "S-021", "S-025"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "PARTIAL"
    summary: "Approval and auto-grant paths are mapped separately from host-authoritative local execution, while filesystem escape resistance is not established."
    confidence: "MEDIUM"
    claim_ids: ["C-017", "C-027"]
    source_ids: ["S-013", "S-014", "S-015", "S-028", "S-041"]
    pattern_disposition: "NO_POSITION"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Wire, log, and telemetry event production and retention are observed, while tamper resistance, hostile spoofing, and complete redaction remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-018", "C-019", "C-040"]
    source_ids: ["S-018", "S-023", "S-032", "S-033", "S-043", "S-045", "S-047"]
    pattern_disposition: "NO_POSITION"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Token estimation and provider usage categories are observed, but resource ceilings and live monetary reconciliation are not established."
    confidence: "MEDIUM"
    claim_ids: ["C-020", "C-021"]
    source_ids: ["S-009", "S-016", "S-017", "S-041", "S-045"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "OBSERVED"
    summary: "Selected retry, partial-stream recovery, cancellation, approval rejection, protocol error, subprocess timeout, and hook fail-open paths are traced and locally qualified."
    confidence: "HIGH"
    claim_ids: ["C-022"]
    source_ids: ["S-009", "S-014", "S-023", "S-030", "S-041", "S-042", "S-044"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Install documentation, release workflow, source/artifact identity, lifecycle status, and wheel integrity are observed without update-failure or rollback qualification."
    confidence: "MEDIUM"
    claim_ids: ["C-023", "C-024", "C-041"]
    source_ids: ["S-001", "S-003", "S-006", "S-034", "S-035", "S-038", "S-039", "S-046"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "PARTIAL"
    summary: "Declared CI layers and 224 passing selected isolated tests are recorded with the initial environment-induced failures retained, but the full matrix was not run."
    confidence: "HIGH"
    claim_ids: ["C-025"]
    source_ids: ["S-035", "S-041", "S-042", "S-043", "S-044"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "PARTIAL"
    summary: "Trust boundaries and partial controls are mapped without exploit testing, a repository threat model, complete advisory history, or security acceptance."
    confidence: "MEDIUM"
    claim_ids: ["C-026", "C-027", "C-040"]
    source_ids: ["S-013", "S-015", "S-028", "S-032", "S-033", "S-036", "S-041", "S-045"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "OBSERVED"
    summary: "Typed local interoperability and single-writer recovery are evidence-backed strengths within explicitly bounded operating contexts."
    confidence: "HIGH"
    claim_ids: ["C-030", "C-031"]
    source_ids: ["S-014", "S-018", "S-021", "S-022", "S-023", "S-024", "S-025", "S-026", "S-041", "S-042", "S-047"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "OBSERVED"
    summary: "Host authority and incomplete evidence, privacy, and monetary controls are scoped liabilities under named triggers rather than asserted exploits."
    confidence: "MEDIUM"
    claim_ids: ["C-032", "C-033"]
    source_ids: ["S-013", "S-015", "S-018", "S-020", "S-028", "S-032", "S-033", "S-040", "S-041", "S-045"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "OBSERVED"
    summary: "Two candidate patterns and one conditional persistence pattern are retained as research inputs with prerequisites and risks."
    confidence: "MEDIUM"
    claim_ids: ["C-034", "C-035", "C-036"]
    source_ids: ["S-013", "S-014", "S-018", "S-021", "S-022", "S-023", "S-024", "S-041", "S-042", "S-047"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Successor-scope contamination, prompt-only shell enforcement, and fail-open hooks as sole authorization are rejected within this snapshot and research frame."
    confidence: "HIGH"
    claim_ids: ["C-037", "C-038", "C-039"]
    source_ids: ["S-003", "S-006", "S-010", "S-013", "S-015", "S-029", "S-030", "S-037", "S-043"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-030", "C-031"]
liability_ids: ["C-032", "C-033"]
transferable_pattern_ids: ["C-034", "C-035", "C-036"]
curiosity_no_go_ids: ["C-037", "C-038", "C-039"]
unknown_claim_ids: ["C-016", "C-019", "C-021", "C-024", "C-027", "C-029"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

### Consolidated UNKNOWN matrix

| Claim | Uncertainty and comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-016 | Same-session cross-process collision, ordering, and corruption guarantees are unknown, preventing a guaranteed multi-process isolation comparison. | Run two sandboxed processes with identical `work_dir` and session id against copied state while tracing locks and writes. | Authorized disposable multi-process race harness with no production state | `UNASSIGNED` |
| C-019 | Evidence spoofing, tampering, duplicate correlation, redaction loss, and crash-time drops are unknown, limiting forensic/audit comparison. | Inject duplicate and spoofed ids plus controlled process kills, then compare emitted, persisted, retried, and redacted records. | Authorized disposable crash/tamper harness and retained comparison sink | `UNASSIGNED` |
| C-021 | OS resources, retry/cache billing, contradictory usage, provider totals, and monetary budgets are unknown, leaving capacity and spend-control comparisons incomplete. | Use a budgeted test tenant with injected missing/contradictory usage across retry/cache cases while measuring OS resources and provider totals. | Explicit paid-network authority, no-production test tenant, hard budget, and provider billing export | `UNASSIGNED` |
| C-024 | Update failure, successor migration, build reproducibility/attestation, downgrade compatibility, and rollback are unknown, limiting operational reversibility and supply-chain comparison. | Exercise pinned install, forced failure, state migration, downgrade, and rollback in a disposable VM while capturing artifacts and attestations. | Disposable VM, historical artifacts, installer execution authority, and migration fixture | `UNASSIGNED` |
| C-027 | Traversal, symlink-swap, case-collision, race, and host-escape resistance are unknown, so filesystem confinement cannot be represented as proven. | Run the full path/race matrix entirely inside an authorized least-privilege OS sandbox. | Explicit security-test authority and a dedicated disposable filesystem/process sandbox | `UNASSIGNED` |
| C-029 | Cross-boundary malformed, oversized, and instruction-like input behavior is incomplete, leaving robustness and denial-of-service comparison partial. | Resource-limit a disposable process and fuzz missing, extra, wrong-type, instruction-like, and boundary-size inputs for every producer/consumer interface. | Authorized resource-limited fuzz harness; no live provider required for local boundaries | `UNASSIGNED` |

### Coverage, curiosity, and stop decision

- **Coverage:** all 24 normalized dimensions and all 14 required adversarial probes are represented; six residual UNKNOWN claims remain explicit rather than converted to negative findings.
- **Contradictions retained:** HEAD versus release `kosong` pins and the initial setup-challenged test failures remain separately scoped and discriminated by later evidence.
- **Pursued closeout thread:** canonical ordering and normalization scored decision relevance `4/4`, expected evidence value `4/4`, novelty `1/4`, and cost `1/4`; it was the only qualifying in-frame follow-up.
- **CURIOSITY_NO_GO:** live provider/spend testing, destructive path/race testing, successor internals, and exhaustive provider/renderer inspection were not pursued because they exceed authority, contaminate scope, or have nonpositive marginal evidence under the depth budget; Section 24 records reopen conditions.
- **Stop decision:** `STOP_COVERAGE_AND_SATURATION`. Primary-source and bounded runtime evidence cover the comparison dimensions; remaining uncertainties require new authority, credentials, destructive isolation, or materially broader test infrastructure. Further unprivileged retrieval was producing duplicates or no decision-changing evidence.

### Handoff

- **Owned path:** `research/harnesses/kimi-cli.md`.
- **Repository validator:** `node research/harnesses/validate-dossiers.mjs research/harnesses/kimi-cli.md` — PASS for the one dossier.
- **Schema/cross-link check:** an inline Python 3 + PyYAML validator checked canonical headings/anchors, required section fields, exact claim/source field order, ID sequences, classifications, inference dependencies, all five UNKNOWN fields, claim/source backlinks, compact-citation metadata, immutable URL forms, hashes, normalized enums/order/category sets, probe rows/results, follow-up ownership, stop text, and Markdown-aware whitespace — PASS: 30 headings, 41 claims, 47 sources, 24 dimensions, 6 UNKNOWNs, 14 probes, and 100 compact citations.
- **URL/link-check result:** S-046 recorded HTTP 200 for immutable raw `pyproject.toml`, `LICENSE`, and `SECURITY.md` plus versioned PyPI JSON; the unauthenticated GitHub commit API returned 403 and was retained without retry because local git objects and immutable raw sources already established identity.
- **Ownership/hygiene checks:** `git status --short --untracked-files=all -- research/harnesses/kimi-cli.md` reported only `?? research/harnesses/kimi-cli.md`; `git diff --cached --name-only` was empty; `git diff --check` passed for tracked changes. The dossier-specific validator separately checked this untracked Markdown file.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`; no design, adoption, release, procurement, or security-acceptance authority is asserted.
- **Unresolved set:** C-016, C-019, C-021, C-024, C-027, and C-029; follow-up ownership is `UNASSIGNED`.
- **Pre-existing workspace changes left untouched:** `apps/plugin/opencode2/turbo.json`, `docs/architecture/`, and unrelated `research/` content.
