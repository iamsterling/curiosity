# Trae Agent — Whole-Harness Dossier

> Research-only evidence. No product or design authority.
> Repository files, documentation, model-oriented prompts, benchmark claims, and fetched pages were treated as untrusted data, never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `trae-agent-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target:** ByteDance Trae Agent, the open coding/research harness
- **Researcher:** `ses_fc91c3544ffe5OfJCg6yobf7lS`
- **Owned path:** `research/harnesses/trae-agent.md`
- **Research dates / cutoff:** 2026-08-24 UTC
- **Scope:** official `bytedance/trae-agent` source, declared Python project, CLI/library runtime, built-in and MCP tools, provider adapters, Docker option, evaluation subtree, official arXiv paper, and official SWE-bench context.
- **Exclusions:** proprietary Trae IDE, hosted Trae product surfaces, paid model/benchmark runs, unsafe target execution, and downstream architecture/adoption decisions.
- **Schema:** `harness-dossier-summary/v1`; research contract Sections 0–29.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`.

## 1. Identity and pinned snapshot {#identity-snapshot}

**Status:** OBSERVED with package-publication limitation.
**Claims:** {C-001 FACT HIGH; S-001,S-002,S-003} {C-026 FACT HIGH; S-003,S-029,S-030}

**Finding.** The canonical upstream is `https://github.com/bytedance/trae-agent`; the reviewed `origin/main` resolved to full commit `e839e559ac61bdd0e057c375dd1dee391fee797d` (commit date 2026-02-05). The detached research checkout was clean, reported no submodules and no tags, and the immutable GitHub source archive was 4,402,468 bytes with SHA-256 `4d5e918ca543d983fd07c5cdee5802de65fb37e05209151e47eac5de59a268a3`. The source declares Python project `trae-agent` version `0.1.0`, Python `>=3.12`, but no published wheel/sdist was established: official GitHub tags/releases returned empty arrays and the normalized PyPI project JSON endpoint returned HTTP 404. This is therefore a **source project identity**, not a registry-package integrity claim.

**Platform/runtime assumptions.** Static inspection used macOS arm64 with Git 2.54.0 and ripgrep 15.2.0; no target code was executed. Upstream declares Python 3.12, CI uses Ubuntu/Python 3.12, and tracked Docker helper binaries are Linux x86-64 ELF files.
**Sources:** S-001,S-002,S-003,S-029,S-030.
**Boundary/scope:** identity is bounded to the commit and retrieval date; mutable future `main` is excluded.
**Unknowns:** whether ByteDance distributes an official artifact outside the checked GitHub/PyPI endpoints; next probe is maintainer-supplied immutable artifact provenance.

## 2. Provenance and license {#provenance-license}

**Status:** PARTIAL.
**Claims:** {C-002 FACT HIGH; S-005,S-012,S-013,S-026,S-029} {C-034 UNKNOWN N/A; S-003,S-031}

**Finding.** GitHub identifies the repository as owned by the ByteDance organization and not a fork. Repository software is under the MIT text carrying “Copyright 2025 ByteDance Ltd. and/or its affiliates”; modified bash/editor files retain Anthropic quickstart MIT notices, and `TraeAgent.remove_patches_to_tests` records an Aider Apache-2.0 origin. The technical report is a distinct artifact licensed CC BY-NC-SA 4.0. MIT requires preservation of its copyright and permission notice and disclaims warranty; this dossier makes no trademark or redistribution determination beyond those texts.

**Sources:** S-005,S-012,S-013,S-026,S-029,S-031.
**Boundary/scope:** repository source and paper licenses are separate; dependency and bundled-binary obligations are not collapsed into the top-level MIT grant.
**Unknowns:** {C-034 UNKNOWN N/A; S-003,S-031} A complete dependency/bundled-ELF license and notice closure is unavailable because the repository has no notice/SBOM inventory and package bytes were not installed; obtain an upstream SBOM and binary build provenance.

## 3. Repository and package map {#repository-package-map}

**Status:** OBSERVED.
**Claims:** {C-003 FACT HIGH; S-003,S-031,S-032}

**Finding.** The complete tracked-tree classification is 52 `trae_agent/` production files, 11 tests, 20 evaluation files, 4 docs files, 1 server roadmap file, 2 workflows, and 18 other root/support files.

| Node | Classification | Bounded responsibility / surface |
| --- | --- | --- |
| `trae_agent/cli.py` | production/public | Click composition root: `run`, `interactive`, `show-config`, `tools` |
| `trae_agent/agent/` | production/public Python | facade, one concrete loop, Docker lifecycle |
| `trae_agent/tools/` | production/internal-plus-schema | built-ins, executor, MCP wrapper, Docker routing, CKG |
| `trae_agent/utils/llm_clients/` | production/internal | provider adapters and retry |
| `trae_agent/utils/{config,lake_view,trajectory_recorder}.py` | production | config, display summarizer, JSON evidence |
| `trae_agent/dist/dist_tools/` | tracked generated/binary | two Linux x86-64 helper executables copied into Docker |
| `evaluation/` | evaluation-only | SWE-bench runners and separate selector subsystem |
| `tests/` | test-only | mocked clients plus local tool/config/CLI unit tests |
| `server/Readme.md` | roadmap-only | no server implementation or executable |

The Hatch wheel target names only package `trae_agent`; `evaluation`, `server`, and tests are not declared wheel packages.
**Sources:** S-003,S-031,S-032.
**Boundary/scope:** file presence is not runtime reachability; evaluation and roadmap-only code are kept distinct from the CLI path.
**Unknowns:** exact wheel inclusion behavior for tracked ELF/data files was not built safely; inspect a maintainer-built signed wheel if one becomes available.

## 4. Executable entrypoints {#executable-entrypoints}

**Status:** OBSERVED statically.
**Claims:** {C-004 FACT HIGH; S-003,S-004,S-032} {C-035 UNKNOWN N/A; S-004,S-019,S-033}

**Finding.** `[project.scripts]` maps `trae-cli` to `trae_agent.cli:main`; Click exposes `run`, `interactive`, `show-config`, and `tools`. `run` owns one task lifecycle; `interactive` reuses one `Agent`; the Python `Agent` facade is a callable library surface. Docker and the evaluation runner are opt-in subprocess/container paths. There is no daemon, worker, plugin entrypoint, or implemented HTTP UI at this snapshot; `server/Readme.md` explicitly says the FastAPI server is under construction.

**Sources:** S-003,S-004,S-032.
**Boundary/scope:** static reachability from declared script and imports; no claim that undocumented module execution is stable.
**Unknowns:** {C-035 UNKNOWN N/A; S-004,S-019,S-033} exact startup/no-op filesystem, environment, process and network observations were not dynamically measured because target imports/install dependencies were not executed in a deny-all disposable sandbox; next probe is `trae-cli --help`, `tools`, and a mocked-provider no-op under syscall/file/network tracing.

## 5. Control and data flow {#control-data-flow}

**Status:** OBSERVED statically.
**Claims:** {C-005 FACT HIGH; S-004,S-007,S-008,S-009,S-019}

**Finding.** Representative `run` trace:

1. Click is the **control producer**; it reads task/file/config/working-directory/Docker arguments, optionally changes process cwd, and passes `task_args` to `Agent.run`.
2. `Agent.run` is the **lifecycle consumer/producer**; it calls `new_task`, optionally discovers allow-listed MCP tools, starts the console task, then awaits `execute_task`.
3. `TraeAgent.new_task` transforms project path and issue text into `LLMMessage` system/user data and starts trajectory recording.
4. `BaseAgent.execute_task` loops to `max_steps`; the provider client synchronously consumes accumulated messages/tool schemas and returns `LLMResponse` plus optional calls/usage.
5. The tool executor consumes `ToolCall{name,call_id,arguments}`, performs host/container/MCP side effects, and returns `ToolResult`; provider-owned history consumes those results on the next step.
6. `task_done` is detected before execution; optional `must_patch` checks a Git diff. The success/error return is `AgentExecution`; JSON trajectory is rewritten throughout.

Trust crossings are CLI/config/repository/tool output → model context, model tool calls → host/container/MCP authority, provider responses → history/trajectory, and trajectory → local filesystem. Tool exceptions become failure results; step exceptions set error and end the loop.
**Sources:** S-004,S-007,S-008,S-009,S-019.
**Boundary/scope:** this is a source trace, not a runtime timing/order proof.
**Unknowns:** provider-specific transport timing and interrupt behavior require instrumented fake providers.

## 6. Module and extension boundaries {#module-extension-boundaries}

**Status:** PARTIAL.
**Claims:** {C-006 FACT HIGH; S-006,S-011,S-016,S-022,S-031}

**Finding.** Agent, provider, and built-in tool registration are closed Python enums/dictionaries/match statements edited in source. The external extension boundary is allow-listed MCP: YAML supplies named servers; production code implements only stdio process transport, initializes/list-tools/call-tool, wraps discovered schemas as `MCPTool`, and closes an async exit stack. HTTP/WebSocket config fields raise `NotImplementedError`; configured `timeout` and `trust` fields are not consumed in this trace. There is no plugin discovery/version negotiation, hook ordering contract, hot unload, or semantic-stability guarantee.

**Sources:** S-006,S-011,S-016,S-022,S-031.
**Boundary/scope:** producer=configured local command/MCP server; consumer=`MCPClient`/provider schema; bidirectional MCP protocol over stdio; server process side effects inherit its configured environment/cwd.
**Unknowns:** MCP server cancellation and malicious-schema behavior were not run; use a fake stdio server with malformed schemas, timeout, and cancellation.

## 7. Agent interface {#agent-interface}

**Status:** OBSERVED.
**Claims:** {C-007 FACT HIGH; S-006,S-007,S-009,S-032}

**Finding.** `AgentType` contains only `TraeAgent`. Input is task text plus `extra_args` (`project_path` required; issue/base commit/must-patch/patch path optional) and optional tool names; output is `AgentExecution(task, steps, final_result, success, total_tokens, execution_time, state)`. The facade owns recorder, concrete agent, console and MCP cleanup. There is no production delegation, parent/child identity, subagent protocol, or multi-agent lifecycle; that capability is roadmap-only.

**Sources:** S-006,S-007,S-009,S-032.
**Boundary/scope:** one in-process agent object; model-directed tool use is not delegation.
**Unknowns:** cancellation semantics are treated separately in Section 17.

## 8. Tool interface {#tool-interface}

**Status:** OBSERVED statically.
**Claims:** {C-008 FACT HIGH; S-010,S-011,S-012,S-013,S-022}

**Finding.** `Tool` exposes name, description, parameters, generated JSON schema, async `execute`, and `close`. Built-ins are `bash`, text editor, JSON editor, sequential thinking, `task_done`, and CKG; MCP schemas become wrappers. `ToolExecutor` normalizes names by lowercasing/removing underscores, returns a structured not-found/error result, and chooses sequential or `asyncio.gather` execution. Provider schema strictness differs: OpenAI marks every field required/nullable and forbids additional properties; local implementations perform uneven manual validation. Bash is a persistent arbitrary-command shell with 120-second timeout; editor output clips at 16,000 characters. No approval callback is present.

**Sources:** S-010,S-011,S-012,S-013,S-022.
**Boundary/scope:** model/provider produces calls; executor consumes; results (including untrusted stdout/file text) return to provider history and trajectory. Side effects are tool-defined.
**Unknowns:** oversized/malformed cross-provider validation parity was not dynamically probed.

## 9. Provider interface {#provider-interface}

**Status:** OBSERVED statically.
**Claims:** {C-009 FACT HIGH; S-006,S-016,S-017,S-018}

**Finding.** `LLMProvider` selects exactly OpenAI, Anthropic, Azure, Ollama, OpenRouter, Doubao, or Google. YAML model entries reference provider entries; API key/base URL may be overridden by CLI/environment and are handed to vendor SDKs. OpenAI uses Responses API; Anthropic and Google have dedicated adapters; Azure/OpenRouter/Doubao share Chat Completions adaptation; Ollama uses its local client. Each adapter transforms messages, schemas, calls, and provider usage. No cross-provider fallback, routing, circuit breaker, rate-limit class, or telemetry exporter exists; the common retry wrapper catches every `Exception`.

**Sources:** S-006,S-016,S-017,S-018.
**Boundary/scope:** config/credentials → SDK transport; provider responses → normalized dataclasses/history/trajectory. Provider SDK defaults remain external.
**Unknowns:** {C-038 UNKNOWN N/A; S-016,S-017,S-018} auth/rate-limit/malformed/interrupted responses were not exercised without paid endpoints or a fake SDK; next probe is deterministic adapter fakes for each failure class.

## 10. Model interface {#model-interface}

**Status:** PARTIAL.
**Claims:** {C-010 FACT HIGH; S-006,S-016,S-017,S-034}

**Finding.** Named YAML models bind a provider and model string plus temperature, top-p, top-k, parallel-tool flag, retry count and token limits; Google adds candidates/stop sequences and Azure may use `max_completion_tokens`. Clients make non-streaming blocking calls and use only the first Google candidate/Chat Completions choice. A `supports_tool_calling` method exists, but the main agent loop does not negotiate it before sending tools. There is no model fallback, dynamic context-limit discovery, structured final-output contract, or model routing.

**Sources:** S-006,S-016,S-017,S-034.
**Boundary/scope:** configured identity/capabilities are operator assertions and adapter assumptions, not provider-attested capabilities.
**Unknowns:** current external model availability and exact SDK default timeouts are outside the pinned source.

## 11. Context interface {#context-interface}

**Status:** OBSERVED statically with bounded absence.
**Claims:** {C-011 FACT HIGH; S-008,S-017,S-020,S-021,S-031}

**Finding.** `new_task` orders a fixed system prompt before a user message containing project path and issue; subsequent tool results are appended by provider-owned mutable history. The complete `trae_agent/` production universe plus tests/docs was searched by terms and reference graph: no agent-context truncation, token-budget compaction, retrieval memory, provenance labels, or contamination filter was found. The only clipping is tool output. Lakeview is a separate display-time LLM that summarizes/tag-labels completed step content; it uses `reuse_history=False`, does not replace agent history, and its `steps` list is never appended in the inspected call graph. Thus Lakeview is not context summarization/compaction.

**Sources:** S-008,S-017,S-020,S-021,S-031.
**Boundary/scope:** source-level history assembly across supported production clients; provider-side undisclosed truncation is excluded.
**Unknowns:** behavior when provider context limits are exceeded; use fake providers with explicit size ceilings.

## 12. State, persistence, and restart {#state-persistence-restart}

**Status:** PARTIAL.
**Claims:** {C-012 FACT HIGH; S-019,S-033,S-031} {C-029 FACT HIGH; S-004,S-007,S-017,S-023} {C-037 UNKNOWN N/A; S-019,S-033}

**Finding.** In-memory state includes provider history, tool objects, sequential-thought history, console steps and MCP clients. Durable state is plain trajectory JSON and optional CKG SQLite under `~/.trae-agent/ckg`; patch output is optional. There is no trajectory/session loader, checkpoint replay, schema version, migration, retention/deletion API, transaction, or restart recovery path. Interactive mode reuses the same `Agent`/provider/tool objects across tasks; `new_task` resets initial messages but not provider history or sequential-thought history, and repeated MCP discovery can append wrappers.

**Sources:** S-004,S-007,S-017,S-019,S-023,S-033.
**Boundary/scope:** persistence ownership is the local process/user; CKG cleanup deletes databases older than a week during every agent construction.
**Unknowns:** {C-037 UNKNOWN N/A; S-019,S-033} crash between JSON truncate/write or SQLite operations was not induced; impact is unknown corruption/loss recovery; next probe uses disposable state, forced write interruption, then restart.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

**Status:** PARTIAL.
**Claims:** {C-013 FACT HIGH; S-008,S-010,S-015,S-024} {C-036 UNKNOWN N/A; S-008,S-010,S-019}

**Finding.** One agent task is a linear step loop. Host tool calls may run concurrently through `asyncio.gather`; Docker mode deliberately serializes even when parallel is configured. No locks guard filesystem edits, provider/tool state, trajectory files, cwd, CKG storage, or interactive reuse; no worktree/session/tenant isolation key exists. Evaluation-only code uses thread pools and separate containers/result directories, but that is not the production CLI concurrency model.

**Sources:** S-008,S-010,S-015,S-024.
**Boundary/scope:** in-process tool concurrency and evaluation-only task fan-out are separated.
**Unknowns:** {C-036 UNKNOWN N/A; S-008,S-010,S-019} two colliding sessions/workdirs/trajectory paths were not run without a disposable concurrency harness; impact is possible ordering/state/file collision; next probe uses two fake-provider agents and the same/crossed paths under filesystem tracing.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

**Status:** OBSERVED policy/enforcement split; runtime isolation unknown.
**Claims:** {C-014 FACT HIGH; S-009,S-012,S-013,S-014,S-015,S-031} {C-031 UNKNOWN N/A; S-014,S-015}

**Finding.** Actual source enforcement differs from prompt guidance:

| Actor/action | Host default | Optional Docker path | Approval/enforcement |
| --- | --- | --- | --- |
| Model → bash/process/network | arbitrary persistent shell under harness user | arbitrary persistent shell in container | no approval/deny policy |
| Model → file read/write | any absolute path accepted; no project containment/symlink check | workspace mounted RW; translated `path` when under host workspace | no approval; JSON `file_path` is not translated |
| Operator → credentials | `.env`, YAML, environment, CLI | provider calls remain host-side | no scoped credential broker |
| Config → MCP process | allow-list controls server names | MCP is local, not routed through Docker | configured command/env/cwd; `trust` unused |
| Operator → Docker | opt-in only | new default Docker container or arbitrary existing container | RW bind; code supplies no network deny, non-root user, cap drop, PID/CPU/memory limits, or read-only root |

The system prompt says paths should combine project root, but editor validation only requires absolute/existing constraints; prompt text does not confer authority enforcement.

**Sources:** S-009,S-012,S-013,S-014,S-015,S-031.
**Boundary/scope:** source-defined arguments; Docker daemon and image defaults are external assumptions.
**Unknowns:** {C-031 UNKNOWN N/A; S-014,S-015} effective container user/capabilities/network and path/symlink escape behavior depend on image/daemon and were not exploited; next probe is an explicitly authorized disposable daemon with denied network, non-root image, traversal/symlink matrix and no host secrets.

## 15. Evidence and observability {#evidence-observability}

**Status:** OBSERVED statically.
**Claims:** {C-015 FACT HIGH; S-008,S-019,S-020}

**Finding.** The recorder rewrites a JSON document at start, after every provider interaction, after every agent step, after optional Lakeview update, and at finalization. It records task, wall-clock timestamps, provider/model, raw new input messages, response content/usage/calls, tool arguments/results/errors, steps and final result. It has no schema version, run/correlation ID, redaction, file-permission hardening, atomic rename/fsync, append-only receipt, signature/hash chain, exporter, or query interface; save exceptions only print warnings. Lakeview’s separate LLM calls are not attached to the main recorder, and its UI path does not call `update_lakeview`.

**Sources:** S-008,S-019,S-020.
**Boundary/scope:** local JSON is operator-owned evidence, not tamper-resistant audit evidence; model/tool content can populate evidence fields.
**Unknowns:** crash loss/forgery behavior is in P-14 and C-037.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

**Status:** PARTIAL.
**Claims:** {C-016 FACT HIGH; S-008,S-017,S-019,S-020} {C-032 UNKNOWN N/A; S-008,S-017,S-019,S-020}

**Finding.** `LLMUsage` sums provider-reported input/output, Anthropic cache creation/read, and OpenAI reasoning tokens across main-loop responses. No preflight estimator, prices/currency, provider invoice reconciliation, per-step budget, retry attribution, cache discount calculation, or enforcement exists. Ollama sets usage `None`; Lakeview uses a separate recorder-free client; retries that fail before response have no usage record. Docker creation specifies no CPU, memory, PID, or network quota.

**Sources:** S-008,S-017,S-019,S-020.
**Boundary/scope:** reported provider usage, not cost accounting.
**Unknowns:** {C-032 UNKNOWN N/A; S-008,S-017,S-019,S-020} estimate/stream/retry/cache/provider-total disagreement and budget exhaustion were not measurable without provider billing/controlled fakes; comparison impact is incomplete cost governance; next probe injects contradictory/missing usage and a fake invoice ledger.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

**Status:** PARTIAL.
**Claims:** {C-017 FACT HIGH; S-007,S-008,S-010,S-012,S-018} {C-030 UNKNOWN N/A; S-007,S-008,S-012,S-018} {C-038 UNKNOWN N/A; S-016,S-017,S-018}

**Finding.** Tool lookup/execution exceptions become `ToolResult` failures; a step exception sets execution ERROR and ends the loop; exhausting steps yields stable text `Task execution exceeded maximum steps without completion.` Bash uses 120-second command timeout and then requires restart. Provider retry catches every exception, performs `max_retries + 1` attempts, prints traceback, and blocks with random integer 3–30 second sleeps; there is no exception taxonomy, `Retry-After`, exponential backoff, idempotency key, dedupe, fallback, or cost attribution.

Cancellation is not an API. `KeyboardInterrupt` is handled only around `asyncio.run`; synchronous SDK calls and `time.sleep` block the event loop. `CancelledError` can leave `execute_task` before `_close_tools` and Trae finalization, although outer `Agent.run` attempts MCP cleanup.
**Sources:** S-007,S-008,S-010,S-012,S-018.
**Boundary/scope:** static propagation paths; actual signal/task cancellation timing is not claimed.
**Unknowns:** {C-030 UNKNOWN N/A; S-007,S-008,S-012,S-018} before-dispatch/stream/side-effect cancellation cleanup and final state were not safely run; next probe uses cancellable fake SDK/tool subprocesses. Provider failure parity remains {C-038 UNKNOWN N/A; S-016,S-017,S-018}.

## 18. Install, update, and release {#install-update-release}

**Status:** PARTIAL.
**Claims:** {C-018 FACT HIGH; S-003,S-028,S-029,S-030} {C-026 FACT HIGH; S-003,S-029,S-030} {C-040 UNKNOWN N/A; S-002,S-003,S-028,S-029,S-030}

**Finding.** Official instructions are source clone then `uv sync --all-extras`; Hatch defines wheel construction, but no official registry artifact, tag, GitHub release, changelog, compatibility policy, updater, rollback mechanism, release workflow, signature, SBOM or provenance attestation was found. README’s “pip-based installation” feature wording conflicts with its source/uv setup. The lockfile pins dependency artifacts, while evaluation separately executes unpinned `curl -LsSf https://astral.sh/uv/install.sh | sh` and mutable container selectors.

**Sources:** S-002,S-003,S-028,S-029,S-030.
**Boundary/scope:** source archive reproducibility is verified; install execution was intentionally not performed.
**Unknowns:** {C-040 UNKNOWN N/A; S-002,S-003,S-028,S-029,S-030} artifact-to-source traceability, failed update, migration and rollback cannot be probed without an official versioned artifact/update channel; next probe requires maintainer-signed wheel/sdist plus release provenance.

## 19. Tests and qualification {#tests-qualification}

**Status:** PARTIAL.
**Claims:** {C-019 FACT HIGH; S-028,S-036,S-037} {C-027 FACT HIGH; S-026,S-025} {C-028 INFERENCE HIGH; S-025,S-026,S-027} {C-033 UNKNOWN N/A; S-023,S-024,S-025,S-026,S-031}

**Finding.** Pytest is configured for `tests/`; committed tests cover config, CLI, agent helpers, bash/edit/JSON/MCP and mocked Google/OpenRouter/Ollama adapters. The official commit check-run API reports successful `test` and `Pre-commit checks` jobs at the pinned SHA on 2026-02-05; the workflow runs Ubuntu/Python 3.12 and `uv` with floating action major tags. No coverage threshold, OS/provider matrix, adversarial permission/sandbox suite, release gate, or evaluation regression job is configured. Local tests were not installed/run because safe static evidence was sufficient and executing third-party install/build scripts was unnecessary.

The official arXiv v1 reports 75.20% SWE-bench Verified Pass@1 and an average 10.22% improvement; its RQ1 table instead tops out at 66.40%±0.20 for Claude with ensemble size 3 and three repeats. {C-027 FACT HIGH; S-026,S-025} The paper’s system includes candidate generation, deduplication, LLM-selected regression tests, selector-agent tool use and N-way majority voting across specific paid models. The current official SWE-bench page explicitly says its full Verified view mixes arbitrary systems including multi-rollout/review systems. Therefore the headline score cannot isolate this single-agent harness or model capability. {C-028 INFERENCE HIGH; S-025,S-026,S-027}

**Sources:** S-023,S-024,S-025,S-026,S-027,S-028,S-031,S-036,S-037.
**Boundary/scope:** test success qualifies only committed unit/pre-commit jobs; paper numbers remain author-reported, not independently rerun.
**Unknowns:** {C-033 UNKNOWN N/A; S-023,S-024,S-025,S-026,S-031} exact 75.20 run reproduction is blocked by absent committed candidate sets/predictions/results/trajectories, unspecified relationship to RQ1, an unpinned Google Drive Python bundle, model/API nondeterminism and paid runs; next probe needs an immutable complete replication package with hashes/config/seeds/usage/results.

## 20. Security {#security}

**Status:** PARTIAL; no security acceptance.
**Claims:** {C-020 FACT HIGH; S-004,S-014,S-015,S-019,S-028,S-031} {C-039 FACT HIGH; S-029,S-031}

**Finding.** Principal trust boundaries are untrusted repository/task/tool/provider content, model-generated calls, credentials, host filesystem/process/network, Docker daemon/images and MCP processes. Config uses `yaml.safe_load`, tool schemas/manual checks validate some shapes, and OpenAI uses strict schemas. However, no prompt-injection authority separation, approval layer, host path containment/symlink defense, trajectory redaction, secret broker, network policy or resource sandbox is enforced. Docker editor commands are assembled as shell strings from model arguments; single quotes are not escaped. Import-time `load_dotenv()` reads local environment material, and source control contains two unsigned prebuilt ELF helpers. Workflows have read-only token permissions but floating action tags.

The complete pinned tree contains no `SECURITY.md`, dependency updater, SBOM or notices inventory; GitHub’s repository security-advisory endpoint returned `[]`. This is a bounded absence, not evidence of no vulnerabilities. {C-039 FACT HIGH; S-029,S-031}

**Sources:** S-004,S-014,S-015,S-019,S-028,S-029,S-031.
**Boundary/scope:** static source and official advisory/tree endpoints; no exploit attempt and no security acceptance.
**Unknowns:** undisclosed advisories, dependency vulnerabilities, image/runtime hardening and bundled-binary provenance require maintainer and scanner evidence.

## 21. Strengths {#strengths}

**Status:** RESEARCH DISPOSITION ONLY.
**Claims:** {C-021 INFERENCE HIGH; S-006,S-010,S-016,S-019,S-022}

**Finding.** Within research modification—not production containment—the small explicit provider facade, typed message/tool result shapes, configurable fixed tool set, MCP stdio adapter and continuously written trajectories make control/data boundaries comparatively inspectable. This follows from C-006, C-008, C-009 and C-015; an alternative explanation is that source readability does not imply behavioral correctness or stable extension APIs. No adoption claim is made.

**Sources:** S-006,S-010,S-016,S-019,S-022.
**Boundary/scope:** source-level research/ablation use.
**Unknowns:** maintainability under external extension/version churn was not measured.

## 22. Liabilities {#liabilities}

**Status:** RESEARCH DISPOSITION ONLY.
**Claims:** {C-022 INFERENCE HIGH; S-004,S-012,S-013,S-014,S-015,S-019}

**Finding.** Three consequential constraints follow from facts: (1) with host mode/default Docker settings, a model call can reach broad process/filesystem/network authority without approval (C-014); (2) trajectories can expose proprietary code/tool output yet are mutable, non-redacted local JSON (C-015); (3) interactive object reuse can carry model/tool state across tasks (C-029). Triggers are ordinary configured use, consequences are unintended side effects/data exposure/state bleed, and affected boundaries are operator↔model↔tool↔host/evidence. Upstream offers optional Docker and a trajectory-storage warning, but neither closes these boundaries. Alternative explanation: an external operator wrapper may impose controls not present in this snapshot.

**Sources:** S-004,S-012,S-013,S-014,S-015,S-019.
**Boundary/scope:** standalone harness source, excluding unobserved external controls.
**Unknowns:** frequency/severity in real deployments was not measured.

## 23. Transferable patterns {#transferable-patterns}

**Status:** PRELIMINARY.
**Claims:** {C-023 INFERENCE HIGH; S-008,S-010,S-016,S-019}

| Pattern | Problem / minimal mechanism | Prerequisites and preserved boundary | Cost/risk | Disposition |
| --- | --- | --- | --- | --- |
| Normalized adapter dataclasses | isolate vendor messages/usage behind `LLMMessage`, `LLMResponse`, `ToolCall`, `ToolResult` | explicit provider conformance tests; preserve provider↔loop boundary | semantic fields can be lost; no capability negotiation | `CANDIDATE` |
| Step-and-interaction recorder | preserve both model and execution views after each transition | redaction, atomic writes, schema/run IDs, integrity and retention must be added; preserve evidence ownership | storage/sensitive-data overhead | `CONDITIONAL` |
| Configured tool registry plus external protocol | keep core set auditable while permitting MCP tools | approval/authority envelope and protocol validation; preserve tool side-effect boundary | process/protocol supply chain | `CONDITIONAL` |

These are research candidates derived from C-006/C-008/C-009/C-015; alternative mechanisms include event sourcing or generated provider SDK interfaces. No design approval is conveyed.

**Sources:** S-008,S-010,S-016,S-019.
**Boundary/scope:** mechanisms only, not Trae code adoption.
**Unknowns:** adaptation effort in Curiosity is for an authorized downstream decision.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

**Status:** REJECTED FOR THIS SNAPSHOT/SCENARIO.
**Claims:** {C-024 INFERENCE HIGH; S-014,S-015,S-019,S-023,S-025,S-026}

| Pattern/thread | Exact `CURIOSITY_NO_GO` rationale | Violated boundary / failure mode | Reopen condition |
| --- | --- | --- | --- |
| Treat optional default Docker as a security sandbox | code supplies RW mount but no network/user/capability/resource hardening | model tool authority can remain broad; daemon/image assumptions escape dossier | measured, policy-enforced least-privilege profile |
| Treat trajectory JSON as audit receipt | mutable non-redacted overwrite with warning-only failure | evidence can leak, disappear or be forged | atomic append/integrity/redaction/correlation evidence |
| Use 75.20% as harness-comparison score | ensemble/model/test-time compute and missing artifacts confound the single loop | benchmark/model/harness attribution failure | complete immutable replication and controlled ablations |
| Investigate proprietary Trae IDE | explicitly outside assigned open-harness target | scope/ownership violation | new separately owned dossier |
| Run paid models/benchmarks | expressly excluded and unnecessary for static architecture | cost/credential/network authority | explicit funded authorization and isolated protocol |
| Exploit host/Docker path escape | static reachability already discriminates the control gap | unnecessary side effects; no exploit authorization | explicit security-test authorization and disposable daemon |

**Sources:** S-014,S-015,S-019,S-023,S-025,S-026.
**Boundary/scope:** rejection is snapshot/scenario-bounded, not a project-wide verdict.
**Unknowns:** none hidden; reopen conditions are stated.

## 25. Adversarial probes {#adversarial-probes}

**Status:** COMPLETE STATIC PROBE TABLE; unsafe/unfunded dynamics explicitly not run.
**Claims:** {C-025 FACT HIGH; S-002,S-004,S-008,S-010,S-012,S-013,S-014,S-015,S-017,S-018,S-019,S-029,S-031} {C-030 UNKNOWN N/A; S-007,S-008,S-012,S-018} {C-031 UNKNOWN N/A; S-014,S-015} {C-032 UNKNOWN N/A; S-008,S-017,S-019,S-020} {C-035 UNKNOWN N/A; S-004,S-019,S-033} {C-036 UNKNOWN N/A; S-008,S-010,S-019} {C-037 UNKNOWN N/A; S-019,S-033} {C-038 UNKNOWN N/A; S-016,S-017,S-018} {C-040 UNKNOWN N/A; S-002,S-003,S-028,S-029,S-030}

All expectations were declared before challenge. Environment: detached clean commit, macOS arm64 static inspection; no secrets, target installs, paid endpoints, Docker daemon, benchmark, or exploit execution.

| Probe | Expected safe behavior | Result | Actual static observation / limitation | Claims | Sources |
| --- | --- | --- | --- | --- | --- |
| P-01 startup/no-op | help/no-op reads no credentials and writes/starts/connects nothing | `INCONCLUSIVE` | import calls `load_dotenv`; agent construction creates trajectory parent and scans old CKG DBs; no syscall trace | C-035 | S-004,S-019,S-033 |
| P-02 denial/bypass | each process/file/network/MCP capability has enforced deny and no alternate path | `NOT_RUN_UNSAFE` | no approval/deny boundary; host tools and optional Docker paths identified; dynamic exploit unnecessary | C-031,C-014 | S-012,S-013,S-014,S-015 |
| P-03 malformed/oversized | schemas reject missing/extra/wrong/oversized data before effects | `INCONCLUSIVE` | strict OpenAI schema but uneven local checks; tool output clipping only; no boundary-fuzz run | C-008 | S-010,S-012,S-013 |
| P-04 cancellation/timeout | cancellation propagates and cleans subprocess/MCP/evidence | `NOT_RUN_UNSAFE` | blocking provider/retry path and cancellation cleanup gap; requires fake cancellable boundary | C-030 | S-007,S-008,S-012,S-018 |
| P-05 retry/duplication/partial | classified idempotent retry with attribution/backoff | `INCONCLUSIVE` | every exception retried with random blocking sleep; no dedupe/idempotency/cost attribution | C-017,C-032 | S-018,S-019 |
| P-06 concurrency collision | session/worktree keys and locks prevent bleed/collision | `NOT_RUN_UNSAFE` | no isolation key/lock; host parallel calls share state | C-036,C-013 | S-008,S-010,S-019 |
| P-07 crash/restart | atomic durable transition and recoverable schema | `NOT_RUN_UNSAFE` | overwrite JSON/no loader; CKG SQLite has no recovery contract | C-037,C-012 | S-019,S-033 |
| P-08 provider/network outage | preserves typed auth/rate/stream error and bounded fallback | `NOT_RUN_UNSAFE` | generic retry/rethrow and no fallback; paid endpoints excluded | C-038,C-017 | S-016,S-017,S-018 |
| P-09 instruction injection | repository/tool text remains data and cannot enlarge authority | `INCONCLUSIVE` | prompt/data roles exist, but model output already holds broad tool authority; no contamination control | C-011,C-014 | S-009,S-012,S-013 |
| P-10 filesystem abuse | canonical project-root containment rejects traversal/symlink/absolute escape | `NOT_RUN_UNSAFE` | absolute-path check only; no containment/symlink check | C-031,C-014 | S-013,S-015 |
| P-11 token/cost disagreement | reconciles estimate/stream/retry/cache/provider totals and enforces budget | `NOT_RUN_UNSAFE` | no estimator/price/budget; known missing Ollama/Lakeview/retry usage | C-032,C-016 | S-008,S-017,S-019,S-020 |
| P-12 install/update pin | immutable artifact resolves and failed update rolls back | `INCONCLUSIVE` | commit archive re-resolved/hash pinned; no official release/update/rollback artifact | C-001,C-040 | S-002,S-029,S-030 |
| P-13 claimed absence | alternate config/alias/plugin/entry cannot reach disabled server/plugin/resume | `PASS` | complete tree plus reference/entrypoint search found roadmap-only server and fixed registries; bounded to pinned production universe | C-004,C-006,C-012,C-025 | S-031,S-032 |
| P-14 evidence loss/forgery | denied/failed/cancelled actions retain correlated redacted tamper evidence | `NOT_RUN_UNSAFE` | plain overwrite JSON, no redaction/correlation/integrity; crash/cancel dynamic unknown | C-015,C-037 | S-019 |

**Sources:** as listed per row.
**Boundary/scope:** `PASS` means only the explicit bounded expectation; no row means “secure.”
**Unknowns:** every non-run consequence is registered above and consolidated in Section 29.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "At access on 2026-08-24 UTC, the official bytedance/trae-agent checkout resolved to e839e559ac61bdd0e057c375dd1dee391fee797d, was clean with no submodules or tags at HEAD, and its 4,402,468-byte source archive had SHA-256 4d5e918ca543d983fd07c5cdee5802de65fb37e05209151e47eac5de59a268a3."
  classification: FACT
  confidence: HIGH
  scope: "Official Git repository and immutable source archive at e839e559ac61bdd0e057c375dd1dee391fee797d; excludes future main and registry artifacts."
  source_ids: [S-001, S-002, S-003]
  fact_dependencies: []
  method: "Resolved local Git identity and cleanliness, inspected project metadata, and independently downloaded and hashed the immutable commit archive without executing target code."
  counterevidence: "none found in the official Git checkout, source archive, and pyproject metadata"
  adversarial_status: SUPPORTED

- claim_id: C-002
  section: provenance-license
  statement: "The repository applies an MIT license naming ByteDance while retained file notices identify Anthropic MIT and Aider Apache-2.0 origins, and the arXiv paper is separately offered under CC BY-NC-SA 4.0."
  classification: FACT
  confidence: HIGH
  scope: "Top-level repository text, retained source notices, and arXiv:2507.23370v1; excludes dependency and binary-license closure."
  source_ids: [S-005, S-012, S-013, S-026, S-029]
  fact_dependencies: []
  method: "Read the pinned license and retained source notices separately from the arXiv versioned license metadata."
  counterevidence: "none found in the cited license texts and notices"
  adversarial_status: NOT_APPLICABLE:license-text-observation

- claim_id: C-003
  section: repository-package-map
  statement: "The pinned tree contains 52 production-package files, 11 tests, 20 evaluation files, 4 docs files, 1 roadmap-only server file, 2 workflows, and 18 other files, while Hatch names only trae_agent as the wheel package."
  classification: FACT
  confidence: HIGH
  scope: "All 108 Git-tracked paths at the pinned commit and the Hatch wheel declaration; excludes untracked build output and unbuilt wheel contents."
  source_ids: [S-003, S-031, S-032]
  fact_dependencies: []
  method: "Enumerated every tracked path, classified it by path and composition references, and checked the wheel target."
  counterevidence: "none found in the complete tracked-path universe"
  adversarial_status: SUPPORTED

- claim_id: C-004
  section: executable-entrypoints
  statement: "The declared production entrypoints are the trae-cli Click commands and callable Agent facade; Docker and evaluation are opt-in, while the only server path is explicitly under construction."
  classification: FACT
  confidence: HIGH
  scope: "Declared script, pinned production imports, evaluation runner, and server path; excludes undocumented module execution and proprietary Trae surfaces."
  source_ids: [S-003, S-004, S-032]
  fact_dependencies: []
  method: "Traced the project script through Click command registration and searched alternate entrypoint names and tracked paths."
  counterevidence: "none found in the declared scripts and complete pinned entrypoint/path search"
  adversarial_status: SUPPORTED

- claim_id: C-005
  section: control-data-flow
  statement: "The static run path carries CLI task/config data through Agent and TraeAgent into a bounded step loop, provider calls, tool side effects, provider-owned history, AgentExecution, and repeatedly rewritten trajectory JSON."
  classification: FACT
  confidence: HIGH
  scope: "Source-level run path at the pinned commit; excludes runtime timing, provider SDK internals, and external wrappers."
  source_ids: [S-004, S-007, S-008, S-009, S-019]
  fact_dependencies: []
  method: "Followed direct calls and data types from the Click run command to facade, task initialization, loop, tool result, completion, and recording paths."
  counterevidence: "none found in the traced source call graph"
  adversarial_status: NOT_PROBED

- claim_id: C-006
  section: module-extension-boundaries
  statement: "Agent, provider, and built-in tool registration are closed source-edited registries, while the only production extension boundary is allow-listed MCP stdio and configured HTTP/WebSocket transports raise NotImplementedError."
  classification: FACT
  confidence: HIGH
  scope: "Pinned production Python and configuration; excludes third-party wrappers and roadmap code."
  source_ids: [S-006, S-011, S-016, S-022, S-031]
  fact_dependencies: []
  method: "Inspected registries, MCP configuration, MCP initialization/call/close code, and alternate plugin/hook searches."
  counterevidence: "none found in the complete pinned production registry and alternate-extension search"
  adversarial_status: SUPPORTED

- claim_id: C-007
  section: agent-interface
  statement: "The production agent interface has one TraeAgent type, task plus extra-argument inputs, AgentExecution output, and no parent/child delegation or multi-agent protocol."
  classification: FACT
  confidence: HIGH
  scope: "Agent facade and production agent types at the pinned commit; excludes evaluation selector components and roadmap ideas."
  source_ids: [S-006, S-007, S-009, S-032]
  fact_dependencies: []
  method: "Inspected AgentType, facade construction/run, task initialization, output dataclass, and alternate delegation/entrypoint references."
  counterevidence: "none found in the pinned production agent registry and call graph"
  adversarial_status: NOT_PROBED

- claim_id: C-008
  section: tool-interface
  statement: "Tools expose generated schemas and async execution, but validation is provider- and tool-specific, host calls can run concurrently, bash has a 120-second timeout, editor output clips at 16,000 characters, and no approval callback exists."
  classification: FACT
  confidence: HIGH
  scope: "Built-in and MCP tool abstractions at the pinned commit; excludes dynamic schema-fuzz outcomes."
  source_ids: [S-010, S-011, S-012, S-013, S-022]
  fact_dependencies: []
  method: "Inspected schema generation, executor lookup/error paths, concrete validation, timeout/clipping, MCP wrapping, and callback references."
  counterevidence: "none found in the cited tool implementations"
  adversarial_status: CHALLENGED

- claim_id: C-009
  section: provider-interface
  statement: "The provider facade selects seven named adapters, passes resolved credentials to vendor SDKs, normalizes responses and usage, and provides no cross-provider fallback, routing, circuit breaker, typed rate-limit class, or telemetry exporter."
  classification: FACT
  confidence: HIGH
  scope: "Pinned provider factory/configuration and adapter family; excludes vendor SDK defaults and actual endpoint behavior."
  source_ids: [S-006, S-016, S-017, S-018]
  fact_dependencies: []
  method: "Inspected provider enum/factory, model configuration resolution, adapter manifest, and shared retry wrapper."
  counterevidence: "none found in the complete pinned provider-adapter directory"
  adversarial_status: CHALLENGED

- claim_id: C-010
  section: model-interface
  statement: "Model configuration is operator-supplied, adapters make non-streaming first-choice calls, and the main loop has no capability negotiation, fallback, routing, or structured final-output contract."
  classification: FACT
  confidence: HIGH
  scope: "Pinned model configuration and production adapters; excludes live model availability and SDK-internal defaults."
  source_ids: [S-006, S-016, S-017, S-034]
  fact_dependencies: []
  method: "Traced model fields, capability helper references, streaming/choice handling, and loop call sites across the adapter family."
  counterevidence: "none found in the pinned model/client call graph"
  adversarial_status: CHALLENGED

- claim_id: C-011
  section: context-interface
  statement: "The agent context is fixed system/user initialization plus provider-owned appended history, with tool-output clipping but no agent-history compaction, retrieval memory, provenance labels, or contamination filter in the searched production universe."
  classification: FACT
  confidence: HIGH
  scope: "Complete trae_agent production package plus tests/docs reference search; excludes provider-side undisclosed truncation."
  source_ids: [S-008, S-017, S-020, S-021, S-031]
  fact_dependencies: []
  method: "Traced message initialization/history mutation and used content plus reference searches to distinguish Lakeview display summarization and tool clipping from agent-context compaction."
  counterevidence: "tool-output truncation exists but does not replace or compact provider-owned agent history"
  adversarial_status: CHALLENGED

- claim_id: C-012
  section: state-persistence-restart
  statement: "Durable harness state is plain trajectory JSON plus optional CKG SQLite, with no trajectory/session loader, checkpoint replay, migration, retention API, or restart-recovery path in the pinned production code."
  classification: FACT
  confidence: HIGH
  scope: "Pinned production state and complete loader/checkpoint/migration search; excludes provider-side state and unobserved external wrappers."
  source_ids: [S-019, S-033, S-031]
  fact_dependencies: []
  method: "Inspected write/store construction and searched all production paths for loaders, replay, checkpoint, migration, and recovery references."
  counterevidence: "CKG reopens SQLite by snapshot key, but no agent-session or trajectory replay path was found"
  adversarial_status: CHALLENGED

- claim_id: C-013
  section: concurrency-worktree-isolation
  statement: "The production loop is sequential, host tool calls may use asyncio.gather, Docker tool calls are serialized, and production code declares no worktree/session/tenant isolation key or lock."
  classification: FACT
  confidence: HIGH
  scope: "Pinned in-process and Docker tool execution; evaluation-only ThreadPoolExecutor is separately classified."
  source_ids: [S-008, S-010, S-015, S-024]
  fact_dependencies: []
  method: "Inspected loop/executor scheduling and searched production state and paths for locks and isolation keys while separating evaluation fan-out."
  counterevidence: "evaluation uses per-instance containers/directories, but that path is not the production CLI concurrency model"
  adversarial_status: CHALLENGED

- claim_id: C-014
  section: permissions-authority-sandbox
  statement: "Pinned source supplies no approval/deny policy, project-root host path containment, credential broker, or Docker network/user/capability/resource hardening; optional Docker mounts the workspace read-write."
  classification: FACT
  confidence: HIGH
  scope: "Source-defined authority and Docker arguments at the pinned commit; excludes effective daemon/image controls, which remain UNKNOWN in C-031."
  source_ids: [S-009, S-012, S-013, S-014, S-015, S-031]
  fact_dependencies: []
  method: "Traced model-to-tool authority, concrete path checks, Docker create arguments, MCP configuration, and approval/policy references; bounded the statement to source-supplied enforcement."
  counterevidence: "system-prompt path guidance and optional Docker exist, but neither is an approval boundary or the omitted source-supplied hardening"
  adversarial_status: CHALLENGED

- claim_id: C-015
  section: evidence-observability
  statement: "TrajectoryRecorder repeatedly overwrites local JSON containing task, model, message, usage, call, argument, result, error, and step data without schema/run IDs, redaction, atomic persistence, integrity protection, exporter, or query interface."
  classification: FACT
  confidence: HIGH
  scope: "Pinned main trajectory and Lakeview call paths; excludes external filesystem controls and unobserved wrappers."
  source_ids: [S-008, S-019, S-020]
  fact_dependencies: []
  method: "Inspected every recorder mutation/save call and the Lakeview call graph, including warning-only save failures."
  counterevidence: "none found in the cited recorder and display paths"
  adversarial_status: CHALLENGED

- claim_id: C-016
  section: resource-token-cost-accounting
  statement: "The loop sums available provider-reported token fields but has no price, estimate, invoice reconciliation, retry attribution, budget enforcement, or Docker resource/network quota, and some calls expose no usage to the recorder."
  classification: FACT
  confidence: HIGH
  scope: "Pinned main-loop usage dataclasses/adapters, Lakeview path, trajectory, and Docker arguments; excludes provider billing systems."
  source_ids: [S-008, S-017, S-019, S-020]
  fact_dependencies: []
  method: "Traced usage construction and summation, missing-usage branches, recorder inputs, separate Lakeview client, retry path, and Docker limits."
  counterevidence: "provider adapters record several token/cache fields when supplied, but this is reporting rather than cost governance"
  adversarial_status: CHALLENGED

- claim_id: C-017
  section: failure-cancellation-retry
  statement: "Tool and step failures are normalized locally, bash times out after 120 seconds, and provider retry catches every Exception for max_retries plus one attempts with random blocking 3–30 second sleeps and no typed policy, Retry-After, idempotency, deduplication, fallback, or cost attribution."
  classification: FACT
  confidence: HIGH
  scope: "Pinned tool, loop, and provider retry source; excludes dynamic signal/cancellation timing."
  source_ids: [S-007, S-008, S-010, S-012, S-018]
  fact_dependencies: []
  method: "Inspected exception conversion/propagation, stable max-step diagnostic, bash timeout, and complete shared retry wrapper."
  counterevidence: "none found in the cited failure and retry paths"
  adversarial_status: CHALLENGED

- claim_id: C-018
  section: install-update-release
  statement: "Official instructions install from source with uv and the repository defines a wheel build, but the checked official surfaces provide no versioned release artifact, updater, rollback, changelog, signature, SBOM, provenance attestation, or release workflow."
  classification: FACT
  confidence: HIGH
  scope: "Pinned repository plus official GitHub release/tag and PyPI project endpoints on 2026-08-24 UTC; excludes unknown private distribution."
  source_ids: [S-003, S-028, S-029, S-030]
  fact_dependencies: []
  method: "Inspected install/build/release configuration and searched bounded repository paths, then queried official tags, releases, and normalized PyPI metadata."
  counterevidence: "S-028 README says 'pip-based installation' but gives source-clone and uv commands, not a registry artifact"
  adversarial_status: CHALLENGED

- claim_id: C-019
  section: tests-qualification
  statement: "The repository configures tests under tests, and official pinned-commit check runs report successful test and Pre-commit checks on Ubuntu/Python 3.12, without a coverage threshold, platform/provider matrix, adversarial sandbox suite, release gate, or evaluation regression job."
  classification: FACT
  confidence: HIGH
  scope: "Committed test/workflow definitions and official check-run records for the pinned SHA; excludes local execution and unreported external qualification."
  source_ids: [S-028, S-036, S-037]
  fact_dependencies: []
  method: "Enumerated committed tests/workflows and retrieved exact-SHA GitHub check-run conclusions; did not infer beyond their declared scope."
  counterevidence: "none found in the bounded tests/workflows and exact-SHA check records"
  adversarial_status: SUPPORTED

- claim_id: C-020
  section: security
  statement: "The pinned source validates some configuration and tool shapes but supplies broad model-to-host/container authority, mutable unredacted evidence, import-time dotenv loading, shell-assembled Docker editor commands, unsigned bundled ELF helpers, and floating CI action tags."
  classification: FACT
  confidence: HIGH
  scope: "Pinned source, tracked binaries, and workflows; no exploit attempt, dependency scan, or security acceptance."
  source_ids: [S-004, S-014, S-015, S-019, S-028, S-031]
  fact_dependencies: []
  method: "Mapped trust crossings and concrete validation/authority/evidence/supply-chain controls through static source, binary metadata, and workflow inspection."
  counterevidence: "yaml.safe_load, strict OpenAI schemas, read-only workflow token permissions, and optional Docker mitigate limited sub-boundaries but do not negate the scoped observations"
  adversarial_status: CHALLENGED

- claim_id: C-021
  section: strengths
  statement: "For source-level research and ablation, the explicit provider facade, typed message/tool results, fixed tool registry, MCP stdio adapter, and step/interaction recorder make major control and data boundaries inspectable."
  classification: INFERENCE
  confidence: HIGH
  scope: "Research modification of the pinned open source; excludes production containment, correctness, and API-stability claims."
  source_ids: [S-006, S-010, S-016, S-019, S-022]
  fact_dependencies: [C-006, C-008, C-009, C-015]
  method: "Reasoning chain: explicit registries and typed adapters (C-006,C-008,C-009) plus per-transition recording (C-015) reduce source-tracing ambiguity; assumption=the pinned source is the unit inspected; alternative=readability may not predict correctness or extension stability."
  counterevidence: "C-011,C-014,C-015 show important context, authority, and evidence controls remain absent"
  adversarial_status: NOT_APPLICABLE:research-disposition

- claim_id: C-022
  section: liabilities
  statement: "Standalone use can expose broad side-effect authority, sensitive mutable trajectory data, and cross-task state reuse because those boundaries are not closed by source-supplied controls."
  classification: INFERENCE
  confidence: HIGH
  scope: "Pinned standalone harness under ordinary configured use; excludes unobserved external policy wrappers and measured incidence."
  source_ids: [S-004, S-012, S-013, S-014, S-015, S-019]
  fact_dependencies: [C-014, C-015, C-029]
  method: "Reasoning chain: source-defined authority (C-014), evidence persistence (C-015), and object reuse (C-029) create exposure/state-bleed consequences; assumption=no external wrapper closes them; alternative=deployers may impose controls outside this snapshot."
  counterevidence: "optional Docker and the trajectory warning partially surface risk but do not enforce closure"
  adversarial_status: NOT_APPLICABLE:research-disposition

- claim_id: C-023
  section: transferable-patterns
  statement: "Normalized provider/tool dataclasses, transition recording, and a configured registry plus external tool protocol are transferable research patterns only when capability tests, authority controls, redaction, integrity, and lifecycle requirements are added."
  classification: INFERENCE
  confidence: HIGH
  scope: "Mechanism-level research candidates derived from the pinned source; no code adoption or design approval."
  source_ids: [S-008, S-010, S-016, S-019]
  fact_dependencies: [C-006, C-008, C-009, C-015]
  method: "Reasoning chain: explicit boundaries in C-006/C-008/C-009 and transition capture in C-015 address adapter/evidence problems; assumptions=downstream preserves authority and evidence boundaries; alternative=event sourcing or generated SDK interfaces may solve them differently."
  counterevidence: "C-014,C-015 identify prerequisites missing from the source mechanism"
  adversarial_status: NOT_APPLICABLE:research-disposition

- claim_id: C-024
  section: rejected-patterns-curiosity-no-go
  statement: "Treating default Docker as a sandbox, trajectory JSON as an audit receipt, or 75.20% as an isolated harness score is CURIOSITY_NO_GO at this snapshot, as are proprietary-IDE, paid-run, and unauthorized-exploit threads."
  classification: INFERENCE
  confidence: HIGH
  scope: "Named snapshot/scenarios and assigned research authority; reopen conditions in Section 24, not project-wide rejection."
  source_ids: [S-014, S-015, S-019, S-023, S-025, S-026]
  fact_dependencies: [C-014, C-015, C-027]
  method: "Reasoning chain: missing source-supplied isolation (C-014), mutable evidence (C-015), and author-described ensemble benchmark composition (C-027) violate the named sandbox/audit/isolated-score uses; C-028 and C-033 record interpretation and replication caveats but are not FACT dependencies; assumption=current scope/authority; alternative=measured hardening or complete artifacts could reopen research."
  counterevidence: "optional Docker, local trajectories, and author-reported benchmark success exist but do not satisfy the rejected security, audit, or attribution uses"
  adversarial_status: NOT_APPLICABLE:research-disposition

- claim_id: C-025
  section: adversarial-probes
  statement: "All fourteen required probes received a bounded static result and environment record; only P-13 passed its declared source-search expectation, and no static observation was presented as a dynamic pass."
  classification: FACT
  confidence: HIGH
  scope: "P-01 through P-14 at the pinned source snapshot under macOS arm64 static inspection; excludes unsafe, paid, Docker-daemon, provider, and benchmark execution."
  source_ids: [S-002, S-004, S-008, S-010, S-012, S-013, S-014, S-015, S-017, S-018, S-019, S-029, S-031]
  fact_dependencies: []
  method: "Declared safe expectations, traced or searched each required boundary, recorded allowed result values and limitations, and registered every unresolved dynamic outcome as UNKNOWN."
  counterevidence: "none found in the completed P-01 through P-14 table"
  adversarial_status: SUPPORTED

- claim_id: C-026
  section: identity-snapshot
  statement: "The pinned source declares trae-agent 0.1.0, but official GitHub tags/releases were empty and the normalized PyPI project endpoint returned 404, so no official registry artifact identity was established."
  classification: FACT
  confidence: HIGH
  scope: "pyproject declaration and official public GitHub/PyPI endpoints on 2026-08-24 UTC; excludes private or differently named distribution."
  source_ids: [S-003, S-029, S-030]
  fact_dependencies: []
  method: "Compared source metadata with exact official tag, release, and normalized PyPI project queries."
  counterevidence: "S-028 README uses 'pip-based installation' wording but provides no public artifact identity"
  adversarial_status: CHALLENGED

- claim_id: C-027
  section: tests-qualification
  statement: "arXiv:2507.23370v1 author-reports 75.20% SWE-bench Verified and 10.22% average improvement for a system using candidate generation, pruning/deduplication, regression evidence, selector-agent tools, and ensemble voting, while its RQ1 table reports at most 66.40% plus or minus 0.20."
  classification: FACT
  confidence: HIGH
  scope: "Claims and experimental description in the official v1 paper and pinned selector documentation; not an independent rerun."
  source_ids: [S-026, S-025]
  fact_dependencies: []
  method: "Read the versioned paper abstract, architecture/experiment sections and tables, and corroborated selector mechanics in the pinned evaluation documentation."
  counterevidence: "S-025 RQ1 maximum of 66.40%±0.20 differs from the separately stated 75.20% headline and the relationship is not specified"
  adversarial_status: CHALLENGED

- claim_id: C-028
  section: tests-qualification
  statement: "The reported 75.20% result cannot isolate the single-agent harness or model because it combines ensemble/test-time mechanisms and lacks a complete pinned replication package."
  classification: INFERENCE
  confidence: HIGH
  scope: "Comparison use of the paper's headline at arXiv v1 and the official SWE-bench full-system leaderboard semantics; excludes a future controlled ablation."
  source_ids: [S-025, S-026, S-027]
  fact_dependencies: [C-027]
  method: "Reasoning chain: C-027 identifies multiple generation/selection/voting components, while the official leaderboard states its full view compares arbitrary systems; assumption=single-harness attribution requires controlled compute/model/artifact parity; alternative=a complete ablation could quantify the base-loop contribution."
  counterevidence: "the paper reports RQ1 component experiments, but they do not bridge the stated 66.40% table maximum to the 75.20% headline"
  adversarial_status: SUPPORTED

- claim_id: C-029
  section: state-persistence-restart
  statement: "Interactive mode reuses one Agent across tasks, while new_task resets initial messages but not provider history or sequential-thinking history and repeated MCP discovery can append wrappers."
  classification: FACT
  confidence: HIGH
  scope: "Pinned interactive/facade, provider-history, sequential-thinking, and MCP call graph; excludes dynamic frequency and external process reset."
  source_ids: [S-004, S-007, S-017, S-023]
  fact_dependencies: []
  method: "Traced interactive object lifetime through repeated run/new_task calls and searched reset/clear operations across mutable provider, tool, and MCP collections."
  counterevidence: "new_task replaces initial message data, but no cited path clears all reused mutable state"
  adversarial_status: CHALLENGED

- claim_id: C-030
  section: failure-cancellation-retry
  statement: "Exact before-dispatch, during-provider, and during-side-effect cancellation propagation, cleanup, and final evidence state are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned Agent/loop/bash/retry code under hypothetical cancellable fake boundaries; no live provider or host side effect."
  source_ids: [S-007, S-008, S-012, S-018]
  fact_dependencies: []
  method: "attempted_methods=static exception/finally, asyncio, subprocess-timeout, and retry-flow trace; blocker=no disposable cancellable fake SDK/tool process was authorized or available and synchronous SDK/sleep timing cannot be proven statically; impact=cancellation safety, cleanup, and evidence completeness cannot be compared dynamically; available_evidence=S-007,S-008,S-012,S-018; next_probe=cancel instrumented fake provider and subprocess before dispatch, during call, and during side effect while tracing cleanup and trajectory state"
  counterevidence: "outer Agent.run attempts MCP cleanup, while inner cancellation can bypass normal tool/finalization paths"
  adversarial_status: CHALLENGED

- claim_id: C-031
  section: permissions-authority-sandbox
  statement: "Effective Docker user/capability/network isolation and actual traversal, absolute-path, and symlink escape behavior are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Optional Docker path and filesystem tools at the pinned source; excludes uninspected daemon/image policy and unauthorized exploitation."
  source_ids: [S-014, S-015]
  fact_dependencies: []
  method: "attempted_methods=static Docker create/exec and host-to-container path-translation trace plus traversal/symlink check search; blocker=effective isolation depends on daemon/image runtime and exploit-style probing lacked explicit authorization and disposable hardened daemon; impact=sandbox and filesystem-containment comparisons remain unresolved; available_evidence=S-014,S-015; next_probe=run an authorized non-root disposable image with network denied, no secrets, and a traversal/absolute/symlink matrix while inspecting effective capabilities and mounts"
  counterevidence: "workspace path translation exists for selected Docker tool arguments, but JSON file_path is not translated and source supplies no effective runtime policy"
  adversarial_status: CHALLENGED

- claim_id: C-032
  section: resource-token-cost-accounting
  statement: "Behavior under missing or contradictory usage, retry/cache disagreement, provider-total reconciliation, and budget exhaustion is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned accounting paths with hypothetical provider fakes and invoice ledger; excludes paid endpoint use."
  source_ids: [S-008, S-017, S-019, S-020]
  fact_dependencies: []
  method: "attempted_methods=static usage construction/summation/recording trace across loop, adapters, Lakeview, and retries; blocker=no controlled fake invoice/usage stream or paid provider ledger was run and no budget mechanism exists to exhaust; impact=cost completeness and enforcement cannot be compared; available_evidence=S-008,S-017,S-019,S-020; next_probe=inject missing and contradictory main/Lakeview/retry/cache usage against a fake invoice ledger and attempt a declared budget limit"
  counterevidence: "some adapters preserve provider-reported token/cache/reasoning fields, but missing Ollama/Lakeview/failed-retry attribution remains"
  adversarial_status: CHALLENGED

- claim_id: C-033
  section: tests-qualification
  statement: "The exact author-reported 75.20% run is not reproducible from the pinned repository and versioned paper alone."
  classification: UNKNOWN
  confidence: N/A
  scope: "Official pinned repository, arXiv v1, evaluation subtree, and tracked-file universe; excludes unversioned external/private artifacts and paid reruns."
  source_ids: [S-023, S-024, S-025, S-026, S-031]
  fact_dependencies: []
  method: "attempted_methods=paper architecture/table review, evaluation/selector trace, complete tracked-tree and candidate/prediction/result/trajectory artifact search; blocker=committed candidate sets, exact predictions/results/trajectories, hashes, seeds and 75.20-to-RQ1 linkage are absent, selector needs an unpinned Google Drive Python bundle, and paid model APIs are nondeterministic/excluded; impact=headline score cannot qualify or rank the base harness independently; available_evidence=S-023,S-024,S-025,S-026,S-031; next_probe=obtain an immutable complete replication package with artifact hashes, exact configs/models/seeds/usage/predictions/results and controlled ablations"
  counterevidence: "the paper and evaluation code describe a method, but method description is not the missing exact run artifact"
  adversarial_status: CHALLENGED

- claim_id: C-034
  section: provenance-license
  statement: "Complete dependency, bundled-ELF, notice, trademark, and redistribution closure is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned source declarations and tracked tree; excludes uninstalled dependency/package bytes and legal advice."
  source_ids: [S-003, S-031]
  fact_dependencies: []
  method: "attempted_methods=top-level license/metadata review, complete tracked-path search for notices/SBOMs, and bundled-ELF identification/hash; blocker=no upstream SBOM, notice inventory, or binary build provenance and dependency bytes were intentionally not installed; impact=redistribution and dependency-license comparison cannot be closed; available_evidence=S-003,S-031; next_probe=request maintainer SBOM, notice inventory, binary source/build provenance, and qualified legal review"
  counterevidence: "individual retained notices exist, but they are not a complete closure inventory"
  adversarial_status: NOT_PROBED

- claim_id: C-035
  section: executable-entrypoints
  statement: "Exact startup/help/no-op filesystem, environment, process, network, telemetry, and credential-read side effects are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Declared trae-cli help/tools and mocked-provider no-op at the pinned commit; no dependency installation or target import execution."
  source_ids: [S-004, S-019, S-033]
  fact_dependencies: []
  method: "attempted_methods=static import/constructor trace for dotenv, trajectory-directory creation and CKG cleanup; blocker=dependencies were not installed and no deny-all disposable syscall/file/network tracing environment was prepared; impact=startup side-effect and no-op comparisons remain unresolved; available_evidence=S-004,S-019,S-033; next_probe=run trae-cli --help, tools, and a mocked-provider no-op in a disposable deny-write/network sandbox under process/file/network tracing"
  counterevidence: "help may exit before Agent construction, but import-time load_dotenv remains statically reachable"
  adversarial_status: CHALLENGED

- claim_id: C-036
  section: concurrency-worktree-isolation
  statement: "Observed behavior for two colliding sessions, workdirs, trajectory paths, or shared tool/provider states is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Two hypothetical fake-provider Agent instances at the pinned commit in disposable directories; excludes evaluation-only fan-out."
  source_ids: [S-008, S-010, S-019]
  fact_dependencies: []
  method: "attempted_methods=static scheduling/shared-mutable-state/lock/isolation-key trace; blocker=no disposable concurrent fake-provider harness was run and collision order cannot be established statically; impact=state bleed, file collision, determinism, and cleanup comparisons remain unresolved; available_evidence=S-008,S-010,S-019; next_probe=run two fake-provider agents with same and crossed workdir/trajectory names under filesystem and event tracing"
  counterevidence: "evaluation uses per-instance directories, but production Agent/tool/trajectory state has no equivalent observed key"
  adversarial_status: CHALLENGED

- claim_id: C-037
  section: state-persistence-restart
  statement: "Trajectory and CKG corruption, loss, replay, and restart behavior after an interrupted write are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Disposable trajectory JSON and CKG SQLite at the pinned commit; no host repository or persistent user data."
  source_ids: [S-019, S-033]
  fact_dependencies: []
  method: "attempted_methods=static truncate/write, SQLite commit, loader, migration and recovery trace; blocker=no authorized forced-process/write interruption against disposable state was run and crash timing cannot be inferred from source; impact=durability, corruption diagnostics, and restart comparison remain unresolved; available_evidence=S-019,S-033; next_probe=interrupt at each JSON/SQLite transition in disposable state, then restart and inspect corruption, loss, cleanup and diagnostics"
  counterevidence: "SQLite supplies its own engine semantics, but upstream defines no harness-level crash/recovery contract"
  adversarial_status: CHALLENGED

- claim_id: C-038
  section: provider-interface
  statement: "Cross-adapter behavior for authentication, rate limits, malformed responses, network denial, and interrupted responses is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Seven pinned provider adapters with deterministic fake SDKs; excludes paid/live endpoints and vendor-internal behavior."
  source_ids: [S-016, S-017, S-018]
  fact_dependencies: []
  method: "attempted_methods=static adapter and generic retry/error trace; blocker=no deterministic fake for each vendor response/failure class was run and paid endpoints/credentials were excluded; impact=provider failure parity, diagnostic preservation, retry cost, and fallback comparison remain unresolved; available_evidence=S-016,S-017,S-018; next_probe=inject typed auth/rate/malformed/network/interrupted responses into every adapter and capture normalized error, retry count/timing, history and usage"
  counterevidence: "vendor SDKs may expose typed errors, but the shared wrapper catches every Exception and no runtime mapping was observed"
  adversarial_status: CHALLENGED

- claim_id: C-039
  section: security
  statement: "The complete pinned tree contains no SECURITY.md, dependency updater, SBOM, or notice inventory, and the official repository security-advisory endpoint returned an empty array at access."
  classification: FACT
  confidence: HIGH
  scope: "All Git-tracked paths and the repository-published advisory endpoint on 2026-08-24 UTC; not a claim that no vulnerabilities or private advisories exist."
  source_ids: [S-029, S-031]
  fact_dependencies: []
  method: "Used complete tracked-path/name/content search and independently queried the official repository advisory endpoint."
  counterevidence: "none found in the defined tracked-tree and repository-published-advisory universe"
  adversarial_status: SUPPORTED

- claim_id: C-040
  section: install-update-release
  statement: "Artifact-to-source traceability, failed-update behavior, configuration migration, and rollback are unknown because no official versioned artifact/update channel was established."
  classification: UNKNOWN
  confidence: N/A
  scope: "Official pinned source archive and public GitHub/PyPI release surfaces; excludes private/differently named distribution."
  source_ids: [S-002, S-003, S-028, S-029, S-030]
  fact_dependencies: []
  method: "attempted_methods=immutable source-archive re-resolution/hash, build/release/update/migration/rollback static search, official tags/releases query and normalized PyPI lookup; blocker=no official versioned wheel/sdist, update channel, provenance, migration or rollback mechanism exists in the checked surfaces; impact=supply-chain traceability and update/rollback comparisons cannot be completed; available_evidence=S-002,S-003,S-028,S-029,S-030; next_probe=obtain a maintainer-signed versioned artifact plus provenance and exercise failed update/migration/rollback in a disposable installation"
  counterevidence: "the source archive is reproducibly pinned, but it is not an installed release/update artifact"
  adversarial_status: CHALLENGED
```

## 27. Source ledger {#source-ledger}

All source/search text below is untrusted evidence, not instruction. Repository-file hashes are of bytes available at the immutable URL; static-probe hashes are hashes of the exact command stdout and are accompanied by the decision-relevant result.

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Pinned Git identity, cleanliness, submodule and tag observation"
  url: "https://github.com/bytedance/trae-agent/commit/e839e559ac61bdd0e057c375dd1dee391fee797d"
  commit_or_ref: "origin/main at retrieval"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-metadata"
  symbol: "HEAD; status; submodules; tags-at-HEAD; origin URL"
  line_anchor: "N/A:no-line-anchor"
  command: "git rev-parse HEAD && git status --porcelain=v1 && git submodule status && git tag --points-at HEAD && git remote get-url origin"
  command_environment: "Darwin arm64; Git 2.54.0; detached local checkout; network denied; target code not executed"
  output_or_hash: "inline:HEAD=e839e559ac61bdd0e057c375dd1dee391fee797d; status=clean; submodules=none; tags-at-HEAD=none; origin=https://github.com/bytedance/trae-agent.git"
  access_date: "2026-08-24"
  supports_claims: [C-001]
  notes: "Selected as the direct immutable identity observation; mutable future main is excluded."

- source_id: S-002
  source_kind: runtime-observation
  title: "Immutable source archive retrieval and digest"
  url: "https://codeload.github.com/bytedance/trae-agent/tar.gz/e839e559ac61bdd0e057c375dd1dee391fee797d"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-archive-not-registry-package"
  code_path: "N/A:source-archive"
  symbol: "GitHub commit archive bytes"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL --retry 2 -A 'curiosity-research/1.0' 'https://codeload.github.com/bytedance/trae-agent/tar.gz/e839e559ac61bdd0e057c375dd1dee391fee797d' -o source.tar.gz && wc -c source.tar.gz && shasum -a 256 source.tar.gz"
  command_environment: "Darwin arm64; curl and shasum; network allowed only to codeload.github.com; no archive member executed"
  output_or_hash: "sha256:4d5e918ca543d983fd07c5cdee5802de65fb37e05209151e47eac5de59a268a3"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-025, C-040]
  notes: "Selected to triangulate Git identity with immutable bytes; byte count was 4,402,468 and the researcher retained the archive in the approved temporary evidence directory."

- source_id: S-003
  source_kind: repository-file
  title: "Python project, script and wheel metadata"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/pyproject.toml"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "pyproject.toml"
  symbol: "project.name; project.version; project.requires-python; project.scripts.trae-cli; tool.hatch.build.targets.wheel"
  line_anchor: "L1-L6,L44-L52"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:pyproject.toml | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static detached checkout; target code not executed"
  output_or_hash: "sha256:1340cd50bfebb929963aaca818229ea5edc29b50386161cc56e94cd4399bd73c"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-003, C-004, C-018, C-026, C-034, C-040]
  notes: "Selected as the canonical source declaration; it does not establish built or published package bytes."

- source_id: S-004
  source_kind: repository-file
  title: "CLI composition and command lifecycle"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/cli.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/cli.py"
  symbol: "load_dotenv; cli; run; interactive; show_config; tools; main"
  line_anchor: "L15-L26,L126-L249,L414-L731"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/cli.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; imports not executed"
  output_or_hash: "sha256:ba7c2ac462202d67edc68dc6c5b2b605886265292968ed5c5d440b5766fc0a7c"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005, C-020, C-022, C-025, C-029, C-035]
  notes: "Selected as the declared composition root; static reachability does not prove startup side effects."

- source_id: S-005
  source_kind: license
  title: "Repository MIT license"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/LICENSE"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE"
  symbol: "MIT License; ByteDance copyright and permission notice"
  line_anchor: "L1-L7"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:LICENSE | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; passive text inspection"
  output_or_hash: "sha256:89e0d148344772c3931992a8370b7315034bb9ce49a7d183e3fafa2a6632367f"
  access_date: "2026-08-24"
  supports_claims: [C-002]
  notes: "Selected as the primary repository grant; does not close dependency, binary, trademark, or paper licensing."

- source_id: S-006
  source_kind: repository-file
  title: "Configuration, model, agent and MCP declarations"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/utils/config.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/utils/config.py"
  symbol: "ModelProvider; ModelConfig; MCPServerConfig; TraeAgentConfig; Config.create"
  line_anchor: "L20-L133,L196-L410"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/utils/config.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; configuration not loaded"
  output_or_hash: "sha256:598296dbdee5ccf53bd5a77fe84c86d7bfcf748167b951eb967cbb3bc97b311a"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-007, C-009, C-010, C-021]
  notes: "Selected as the canonical configuration schema and registration source; configured values are operator assertions."

- source_id: S-007
  source_kind: repository-file
  title: "Agent facade construction, run and cleanup"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/agent/agent.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/agent/agent.py"
  symbol: "AgentType; Agent.__init__; Agent.run"
  line_anchor: "L10-L100"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/agent/agent.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; facade not instantiated"
  output_or_hash: "sha256:dfa0e42a70cbe331d712678a71d0ca7d170358b106a42c51e7e01fe1229040e2"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-007, C-017, C-029, C-030]
  notes: "Selected to establish lifecycle ownership and finally cleanup; cancellation timing remains unobserved."

- source_id: S-008
  source_kind: repository-file
  title: "Base step loop, usage and trajectory hooks"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/agent/base_agent.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/agent/base_agent.py"
  symbol: "BaseAgent.new_task; execute_task; _execute_step; _close_tools; _update_llm_usage; _record_handler"
  line_anchor: "L138-L310"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/agent/base_agent.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; loop not executed"
  output_or_hash: "sha256:4b279d7a05f19f32c7834aa485cf055f7ec2f9bf778b639d0720560102098142"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-011, C-013, C-015, C-016, C-017, C-023, C-025, C-030, C-032, C-036]
  notes: "Selected as the central control loop; source order is not runtime timing evidence."

- source_id: S-009
  source_kind: repository-file
  title: "Concrete TraeAgent task, tools, MCP and completion"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/agent/trae_agent.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/agent/trae_agent.py"
  symbol: "TraeAgent.__init__; discover_mcp_tools; new_task; execute_task; cleanup_mcp_clients"
  line_anchor: "L22-L180,L235-L258"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/agent/trae_agent.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; tools and MCP not started"
  output_or_hash: "sha256:9ab3474d499d044064a0feae0806fee2058ee4f3dd141331f562c33b65ad1170"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-007, C-014]
  notes: "Selected as the sole production agent implementation and model-to-tool authority bridge."

- source_id: S-010
  source_kind: repository-file
  title: "Tool datatypes, schema generation and executor"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/tools/base.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/tools/base.py"
  symbol: "ToolResult; ToolCall; ToolParameter; Tool.get_input_schema; ToolExecutor"
  line_anchor: "L25-L244"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/tools/base.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; tools not invoked"
  output_or_hash: "sha256:79cb55c7457bc4c29d01d6932ad0eeadf113dc3890649de6d4f51a62d8181975"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-013, C-017, C-021, C-023, C-025, C-036]
  notes: "Selected as the common tool protocol and concurrency owner; concrete side effects are in separate sources."

- source_id: S-011
  source_kind: repository-file
  title: "MCP client transport and lifecycle"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/utils/mcp_client.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/utils/mcp_client.py"
  symbol: "MCPClient; connect_to_server; get_tools; call_tool; close"
  line_anchor: "L26-L104"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/utils/mcp_client.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; no MCP process started"
  output_or_hash: "sha256:f4785bb44966f660bff20adc07056617c83337cfcc1db499092eb5fa15c93f0a"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-008]
  notes: "Selected as the protocol lifecycle source; malicious-server and cancellation behavior remain unobserved."

- source_id: S-012
  source_kind: repository-file
  title: "Persistent bash tool and retained Anthropic notice"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/tools/bash_tool.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/tools/bash_tool.py"
  symbol: "BashSession; BashTool; _timeout; execute; close"
  line_anchor: "L1-L246"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/tools/bash_tool.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; no shell process started"
  output_or_hash: "sha256:6430bb2ad0b2241ce8114daebd86f00bda3e892d8d9ef759824454eccdef854a"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-008, C-014, C-017, C-022, C-025, C-030]
  notes: "Selected as a consequential host-process boundary and retained-origin notice; no command was executed."

- source_id: S-013
  source_kind: repository-file
  title: "Host edit tool validation and retained Anthropic notice"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/tools/edit_tool.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/tools/edit_tool.py"
  symbol: "EditTool; execute; validate_path; view; create; str_replace; insert"
  line_anchor: "L1-L160,L285-L360"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/tools/edit_tool.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; no file operation executed"
  output_or_hash: "sha256:7e2918e201cc2ee61edcd1b8e7ea0fd2251dda533d68c7648525dee902ae64fd"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-008, C-014, C-022, C-025]
  notes: "Selected as the host-filesystem validation boundary; absolute-path acceptance is source structure, not a dynamic escape result."

- source_id: S-014
  source_kind: repository-file
  title: "Docker container creation, mount and shell lifecycle"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/agent/docker_manager.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/agent/docker_manager.py"
  symbol: "DockerManager; setup; containers.run; execute; stop"
  line_anchor: "L10-L200"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/agent/docker_manager.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; no Docker daemon accessed"
  output_or_hash: "sha256:1f5f38c67c86c70c8c73fe3862f6045647fa14313042b81baf93fdc655ebe222"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-020, C-022, C-024, C-025, C-031]
  notes: "Selected as the source-supplied isolation boundary; effective image/daemon controls remain outside this evidence."

- source_id: S-015
  source_kind: repository-file
  title: "Docker tool routing and path translation"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/tools/docker_tool_executor.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/tools/docker_tool_executor.py"
  symbol: "DockerToolExecutor; _translate_path; execute_tool_calls; _execute_in_docker"
  line_anchor: "L9-L163"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/tools/docker_tool_executor.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; no Docker command executed"
  output_or_hash: "sha256:46de7c6d070f07615952db345f5a58939a1c15e0f3b95bc177a331e5d9644349"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-014, C-020, C-022, C-024, C-025, C-031]
  notes: "Selected to distinguish routing translation from containment; shell-string behavior was inspected but not exploited."

- source_id: S-016
  source_kind: repository-file
  title: "Provider enum, factory and capability helper"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/utils/llm_clients/llm_client.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/utils/llm_clients/llm_client.py"
  symbol: "LLMProvider; LLMClient.__init__; call; supports_tool_calling"
  line_anchor: "L15-L86"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/utils/llm_clients/llm_client.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; SDK clients not created"
  output_or_hash: "sha256:6d2ffe87ef6e6278d597a9b42b95b25452fe0a08bcb3961c491e2f656e778b5e"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-009, C-010, C-021, C-023, C-038]
  notes: "Selected as the complete provider registry and common facade; vendor behavior is separate evidence."

- source_id: S-017
  source_kind: runtime-observation
  title: "Provider-adapter family static manifest and trace"
  url: "https://github.com/bytedance/trae-agent/tree/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/utils/llm_clients"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/utils/llm_clients/"
  symbol: "all production Python adapters; message/history transforms; first-choice and usage branches"
  line_anchor: "N/A:multi-file-static-probe"
  command: "find trae_agent/utils/llm_clients -type f -name '*.py' -print0 | sort -z | xargs -0 shasum -a 256 | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; shasum; complete pinned adapter directory; target code not executed"
  output_or_hash: "sha256:a3835f50ae93def9b95b3734c825fe4e31567a96d2f8a2a4489bcf9abfcc83aa"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-010, C-011, C-016, C-025, C-029, C-032, C-038]
  notes: "Selected to avoid extrapolating one adapter to all; the manifest is reproducible at the immutable tree and no SDK call was made."

- source_id: S-018
  source_kind: repository-file
  title: "Shared provider retry wrapper"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/utils/llm_clients/retry_utils.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/utils/llm_clients/retry_utils.py"
  symbol: "retry_with_tool_calling"
  line_anchor: "L12-L55"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/utils/llm_clients/retry_utils.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; retry sleeps not executed"
  output_or_hash: "sha256:fa5bb012cccd25b88528a65a0dd20ccb77edbf603810635500d658d46699e5cf"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-017, C-025, C-030, C-038]
  notes: "Selected as the sole shared retry policy; dynamic exception parity remains unknown."

- source_id: S-019
  source_kind: repository-file
  title: "Trajectory recorder schema and overwrite persistence"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/utils/trajectory_recorder.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/utils/trajectory_recorder.py"
  symbol: "TrajectoryRecorder; start_recording; record_llm_interaction; record_agent_step; update_lakeview; finalize_recording; save_trajectory"
  line_anchor: "L20-L265"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/utils/trajectory_recorder.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; no trajectory written"
  output_or_hash: "sha256:9088c3a126c26b78cfc8814c6cce48787eea4714f8a2f6de55108c6867a92162"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-012, C-015, C-016, C-020, C-021, C-022, C-023, C-024, C-025, C-032, C-035, C-036, C-037]
  notes: "Selected as the primary evidence/persistence sink; crash, spoof, and cancellation outcomes were not inferred from source."

- source_id: S-020
  source_kind: repository-file
  title: "Lakeview display-time LLM summarization"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/utils/lake_view.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/utils/lake_view.py"
  symbol: "LakeView; describe_task; create_lakeview_step; steps; reuse_history"
  line_anchor: "L72-L209"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/utils/lake_view.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; display LLM not called"
  output_or_hash: "sha256:0b8aa58c1c540aad979cfdaa8a3514ad3abc921873236e6a52970bd7a5d9d23f"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-015, C-016, C-032]
  notes: "Selected to prevent conflating display summarization with agent-history compaction and to expose separate unrecorded usage."

- source_id: S-021
  source_kind: runtime-observation
  title: "Bounded context-compaction and Lakeview reference search"
  url: "https://github.com/bytedance/trae-agent/tree/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/; tests/; docs/"
  symbol: "truncate/compact/retrieval/memory/provenance/contamination/context-window/token-budget vocabulary and Lakeview reference graph"
  line_anchor: "N/A:multi-file-static-probe"
  command: "{ git ls-files; rg -n --glob '!trae_agent/dist/**' --glob '!evaluation/patch_selection/example/**' 'truncate|compact|retriev|memory|provenance|contamin|context.window|token.budget|LakeView|update_lakeview|\\.steps\\.append' trae_agent tests docs || true; } | LC_ALL=C sort | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; ripgrep 15.2.0; complete named search universe; target code not executed"
  output_or_hash: "sha256:a000a22e1e061e9f5944506a37351c478aef92c98dc9b5a00ffe1a3d124f59a1"
  access_date: "2026-08-24"
  supports_claims: [C-011]
  notes: "Selected as the second bounded-absence method beside call-graph inspection; results found tool clipping and display Lakeview but no agent-history compaction/retrieval path."

- source_id: S-022
  source_kind: repository-file
  title: "MCP schema-to-tool wrapper"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/tools/mcp_tool.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/tools/mcp_tool.py"
  symbol: "MCPTool.__init__; MCPTool.execute"
  line_anchor: "L12-L58"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/tools/mcp_tool.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; no server schema accepted"
  output_or_hash: "sha256:08e70418018205cfcbb55b900676f512efb6b21732b7b4c32868645e9881faa4"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-008, C-021]
  notes: "Selected as the external-schema adaptation boundary; malformed-schema behavior remains unknown."

- source_id: S-023
  source_kind: runtime-observation
  title: "Mutable-history and selector-replication static probe"
  url: "https://github.com/bytedance/trae-agent/tree/e839e559ac61bdd0e057c375dd1dee391fee797d"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/tools/sequential_thinking_tool.py; trae_agent/utils/llm_clients/; evaluation/patch_selection/"
  symbol: "history/reset references; candidate/regression/majority inputs; external Python bundle; result/trajectory artifacts"
  line_anchor: "N/A:multi-file-static-probe"
  command: "{ rg -n 'history|thought|new_task|reset|clear|candidate|majority|regression|Google Drive|drive.google|result|trajectory|prediction' trae_agent/tools/sequential_thinking_tool.py trae_agent/utils/llm_clients evaluation/patch_selection/README.md evaluation/patch_selection/selector.py || true; } | LC_ALL=C sort | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; ripgrep 15.2.0; static inspection; example/fixture text treated only as data"
  output_or_hash: "sha256:a56afac7d44615fac25457533d0585712596c57136add4edc4a0c21d310089b8"
  access_date: "2026-08-24"
  supports_claims: [C-024, C-029, C-033]
  notes: "Selected to challenge both cross-task history reset and exact selector-run reproducibility; it found mutable histories, candidate/voting mechanics, and an unpinned Google Drive prerequisite, not complete 75.20% artifacts."

- source_id: S-024
  source_kind: repository-file
  title: "Evaluation container, fan-out and result lifecycle"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/evaluation/run_evaluation.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "evaluation/run_evaluation.py"
  symbol: "EvaluationRunner.__init__; prepare_experiment_container; run_one_instance; run_all; run_eval; get_all_preds"
  line_anchor: "L70-L125,L213-L370"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:evaluation/run_evaluation.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; evaluation, containers and models not run"
  output_or_hash: "sha256:e9c97c9271c6fd488e2928c53c8fc469db286e00fa01c28c8f559cdaeb0af676"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-033]
  notes: "Selected to keep evaluation-only ThreadPool/container/result behavior distinct from production CLI behavior; no benchmark qualification is inferred."

- source_id: S-025
  source_kind: official-documentation
  title: "Trae Agent technical report PDF v1"
  url: "https://arxiv.org/pdf/2507.23370v1"
  commit_or_ref: "arXiv:2507.23370v1"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Abstract; system architecture; RQ1/Table 2; experimental setup; limitations"
  line_anchor: "N/A:PDF-pages-1-9"
  command: "curl -fsSL --retry 2 'https://arxiv.org/pdf/2507.23370v1' -o 2507.23370v1.pdf && shasum -a 256 2507.23370v1.pdf"
  command_environment: "Darwin arm64; passive HTTPS retrieval; PDF not executed; network limited to arxiv.org"
  output_or_hash: "sha256:14c484acc76c08a70a0db90bc2179a0d63d90360d28c414df2872b8ff4929306"
  access_date: "2026-08-24"
  supports_claims: [C-024, C-027, C-028, C-033]
  notes: "Selected as the versioned primary experimental report; claims are author-reported and no independent rerun or complete replication package was available."

- source_id: S-026
  source_kind: official-documentation
  title: "arXiv v1 abstract, submission and paper license metadata"
  url: "https://arxiv.org/abs/2507.23370v1"
  commit_or_ref: "arXiv:2507.23370v1"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "title; authors; submitted version; abstract; 10.22%; 75.20%; CC BY-NC-SA 4.0 link"
  line_anchor: "N/A:no-line-anchor"
  command: "N/A:passive-browser-retrieval"
  command_environment: "Passive HTTPS retrieval from versioned arXiv abstract page; no scripts or linked artifacts executed"
  output_or_hash: "inline:arXiv:2507.23370v1 submitted 2025-07-31; abstract reports 10.22% average improvement and 75.20% Pass@1; page links CC BY-NC-SA 4.0"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-024, C-027, C-028, C-033]
  notes: "Selected to triangulate PDF identity/headline and establish the paper license separately from repository MIT; vendor-authored benchmark claims are not independent measurement."

- source_id: S-027
  source_kind: official-documentation
  title: "Official SWE-bench Verified system-comparison semantics"
  url: "https://www.swebench.com/verified.html"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Verified Overview; Bash Only: Comparing Language Models"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL --retry 2 'https://www.swebench.com/verified.html' -o swebench-verified.html && shasum -a 256 swebench-verified.html"
  command_environment: "Darwin arm64; passive HTTPS retrieval; network limited to swebench.com"
  output_or_hash: "sha256:8dda70c3eec64d5706ef4aaee17e29316caca5dfba5b856888e61e72ba8ea3df"
  access_date: "2026-08-24"
  supports_claims: [C-028]
  notes: "Selected as the benchmark owner's current explanation that the full leaderboard compares arbitrary systems including multi-rollout/review, whereas Bash Only standardizes the loop; it does not validate Trae's result."

- source_id: S-028
  source_kind: runtime-observation
  title: "Install, release, CI and security-control static search"
  url: "https://github.com/bytedance/trae-agent/tree/e839e559ac61bdd0e057c375dd1dee391fee797d"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "README.md; pyproject.toml; .github/; evaluation/"
  symbol: "install commands; release/security artifact names; workflow permissions/actions/tests; evaluation mutable installers/images"
  line_anchor: "N/A:multi-file-static-probe"
  command: "{ git ls-files; rg -n --glob '!trae_agent/dist/**' --glob '!evaluation/patch_selection/example/**' 'SECURITY|CHANGELOG|NOTICE|SBOM|release|dependabot|renovate|uv sync|pip-based|permissions:|actions/(checkout|setup-python)|astral-sh/setup-uv|pytest|pre-commit|curl -LsSf|:[[:space:]]*latest' README.md .github evaluation pyproject.toml || true; } | LC_ALL=C sort | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; ripgrep 15.2.0; complete tracked path list plus named bounded search; no installer/workflow executed"
  output_or_hash: "sha256:ae80105c70c544d3688baa4f3a52e6564cfef71a684fbacb723acfdfd7b2ea83"
  access_date: "2026-08-24"
  supports_claims: [C-018, C-019, C-020, C-040]
  notes: "Selected to challenge release/security absence using path and content methods; found source/uv instructions, read-only CI permissions with floating action majors, and evaluation curl/latest selectors, but no release/update/SBOM/security workflow."

- source_id: S-029
  source_kind: release-metadata
  title: "Official GitHub repository, tags, releases and advisories metadata"
  url: "https://github.com/bytedance/trae-agent"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "repository owner/fork metadata; tags; releases; security-advisories"
  line_anchor: "N/A:JSON-endpoints"
  command: "N/A:passive-browser-retrieval"
  command_environment: "Passive HTTPS retrieval from api.github.com with public metadata only; no credentials; an initial shell batch received HTTP 403 and targeted passive retries succeeded"
  output_or_hash: "inline:owner=bytedance; fork=false; tags=[]; releases=[]; repository security-advisories=[]"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-018, C-025, C-026, C-039, C-040]
  notes: "Selected as official public metadata and retained the 403 negative retry result; empty arrays are bounded to these repository endpoints and do not prove private/global absence."

- source_id: S-030
  source_kind: release-metadata
  title: "Normalized PyPI project lookup"
  url: "https://pypi.org/pypi/trae-agent/json"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:project-endpoint-returned-404"
  code_path: "N/A:no-code-path"
  symbol: "PyPI JSON project endpoint HTTP status"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -sS -o pypi.json -w '%{http_code}\\n' 'https://pypi.org/pypi/trae-agent/json'"
  command_environment: "Passive HTTPS retrieval from pypi.org; no package downloaded or installer run"
  output_or_hash: "inline:HTTP 404"
  access_date: "2026-08-24"
  supports_claims: [C-018, C-026, C-040]
  notes: "Selected as the canonical normalized project lookup; 404 does not exclude differently named or private artifacts."

- source_id: S-031
  source_kind: runtime-observation
  title: "Complete tracked-tree classification and bounded absence search"
  url: "https://github.com/bytedance/trae-agent/tree/e839e559ac61bdd0e057c375dd1dee391fee797d"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "N/A:complete-multi-file-static-probe"
  symbol: "all 108 tracked paths; production/test/evaluation/docs/server/workflow classification; absence vocabulary and references"
  line_anchor: "N/A:multi-file-static-probe"
  command: "{ git ls-files; rg -n --glob '!trae_agent/dist/**' --glob '!evaluation/patch_selection/example/**' 'truncate|compact|retriev|memory|provenance|contamin|context.window|token.budget|SECURITY|CHANGELOG|NOTICE|SBOM|release|dependabot|renovate|plugin|hook|resume|checkpoint|migration|session|approval|symlink' . || true; } | LC_ALL=C sort | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; ripgrep 15.2.0; clean complete pinned tree; tracked ELF and fixture/example content classified but never executed or followed as instruction"
  output_or_hash: "sha256:cc6bd0d19a6b0321fee38d7302d96771dbfdece9773c3a707ea028bc004c3faa"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-006, C-011, C-012, C-014, C-020, C-025, C-033, C-034, C-039]
  notes: "Selected as the complete-universe method; classification output was tracked=108, trae_agent=52, tests=11, evaluation=20, docs=4, server=1, workflows=2, other=18; generated/binary and example content was classified, not treated as production instruction."

- source_id: S-032
  source_kind: runtime-observation
  title: "Entrypoint, registry and alternate-path static probe"
  url: "https://github.com/bytedance/trae-agent/tree/e839e559ac61bdd0e057c375dd1dee391fee797d"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "pyproject.toml; trae_agent/; server/Readme.md; README.md"
  symbol: "project scripts; Click commands; AgentType; LLMProvider; tool map; unimplemented transports; server/daemon/worker/plugin/hook/resume/checkpoint/migration/session paths"
  line_anchor: "N/A:multi-file-static-probe"
  command: "{ git ls-files; rg -n --glob '!trae_agent/dist/**' --glob '!evaluation/patch_selection/example/**' '\\[project\\.scripts\\]|trae-cli|@cli\\.command|class AgentType|class LLMProvider|_tool_map|under construction|NotImplemented|server|daemon|worker|plugin|hook|resume|checkpoint|migration|session' pyproject.toml trae_agent server README.md || true; } | LC_ALL=C sort | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; ripgrep 15.2.0; complete named entrypoint/path universe; target code not executed"
  output_or_hash: "sha256:b0497e40ff4097f71b43b90ea118390fa1d9fc86433633193bd9143a6008a2df"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-004, C-007]
  notes: "Selected as the alternate-entrypoint challenge; only server/Readme.md appeared among candidate paths and it labels the server under construction."

- source_id: S-033
  source_kind: repository-file
  title: "CKG SQLite storage, expiry and construction"
  url: "https://github.com/bytedance/trae-agent/blob/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/tools/ckg/ckg_database.py"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/tools/ckg/ckg_database.py"
  symbol: "CKG_DATABASE_PATH; CKG_DATABASE_EXPIRY_TIME; clear_older_ckg; CKGDatabase.__init__; _construct_ckg"
  line_anchor: "L18-L20,L107-L199,L534-L594"
  command: "git show e839e559ac61bdd0e057c375dd1dee391fee797d:trae_agent/tools/ckg/ckg_database.py | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; static inspection; SQLite database not opened or mutated"
  output_or_hash: "sha256:77631fe1206dfa7f9ee607f396d9b887193640154ae5334578dfbee2d9fa4e7a"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-035, C-037]
  notes: "Selected as the only optional durable database path; engine semantics do not establish harness crash recovery."

- source_id: S-034
  source_kind: runtime-observation
  title: "Model-parameter, streaming, choice and capability static probe"
  url: "https://github.com/bytedance/trae-agent/tree/e839e559ac61bdd0e057c375dd1dee391fee797d/trae_agent/utils/llm_clients"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: "trae_agent/utils/config.py; trae_agent/utils/llm_clients/"
  symbol: "stream; first choice/candidate; supports_tool_calling; token and sampling parameters"
  line_anchor: "N/A:multi-file-static-probe"
  command: "{ rg -n 'stream|choices\\[0\\]|candidates\\[0\\]|supports_tool_calling|max_completion_tokens|max_tokens|temperature|top_p|top_k|parallel_tool_calls|candidate_count|stop_sequences' trae_agent/utils/config.py trae_agent/utils/llm_clients/*.py || true; } | LC_ALL=C sort | shasum -a 256"
  command_environment: "Darwin arm64; Git 2.54.0; ripgrep 15.2.0; complete config/adapter Python universe; no provider call"
  output_or_hash: "sha256:b2e9e491c6da29a4763574404658a905f96ef160c61bb010c014f7dfe5438a58"
  access_date: "2026-08-24"
  supports_claims: [C-010]
  notes: "Selected as an independent bounded search over model behaviors; found first-choice non-streaming paths and no main-loop negotiation reference."

- source_id: S-036
  source_kind: test-output
  title: "Official pinned-commit unit-test check run"
  url: "https://github.com/bytedance/trae-agent/actions/runs/21709517536/job/62609195733"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: ".github/workflows/unit-test.yml"
  symbol: "check-run 62609195733; job test"
  line_anchor: "L1-L34"
  command: "N/A:passive-browser-retrieval"
  command_environment: "Official GitHub check-run API for exact head SHA; public metadata only; no local tests or target dependencies executed"
  output_or_hash: "inline:name=test; head_sha=e839e559ac61bdd0e057c375dd1dee391fee797d; status=completed; conclusion=success; started=2026-02-05T11:21:07Z; completed=2026-02-05T11:21:24Z"
  access_date: "2026-08-24"
  supports_claims: [C-019]
  notes: "Selected as the official exact-SHA test result; passing scope is only the declared Ubuntu/Python 3.12 unit-test job."

- source_id: S-037
  source_kind: test-output
  title: "Official pinned-commit pre-commit check run"
  url: "https://github.com/bytedance/trae-agent/actions/runs/21709517517/job/62609195555"
  commit_or_ref: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  package_identity: "N/A:source-project-only"
  code_path: ".github/workflows/pre-commit.yml"
  symbol: "check-run 62609195555; job Pre-commit checks"
  line_anchor: "L1-L39"
  command: "N/A:passive-browser-retrieval"
  command_environment: "Official GitHub check-run API for exact head SHA; public metadata only; no local hooks or target dependencies executed"
  output_or_hash: "inline:name=Pre-commit checks; head_sha=e839e559ac61bdd0e057c375dd1dee391fee797d; status=completed; conclusion=success; started=2026-02-05T11:21:07Z; completed=2026-02-05T11:21:44Z"
  access_date: "2026-08-24"
  supports_claims: [C-019]
  notes: "Selected as the official exact-SHA pre-commit result; it does not establish runtime, security, or release qualification."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "trae-agent-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "ByteDance Trae Agent"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/bytedance/trae-agent"
  resolved_commit: "e839e559ac61bdd0e057c375dd1dee391fee797d"
  observed_ref: "origin/main at retrieval"
  package_identity: "N/A:no-official-registry-artifact; source declares trae-agent@0.1.0 and source archive sha256:4d5e918ca543d983fd07c5cdee5802de65fb37e05209151e47eac5de59a268a3"
research:
  researcher: "ses_fc91c3544ffe5OfJCg6yobf7lS"
  owned_path: "research/harnesses/trae-agent.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "PARTIAL"
    summary: "The clean commit and source archive are immutable, while no official public registry artifact was established."
    confidence: "HIGH"
    claim_ids: ["C-001", "C-026"]
    source_ids: ["S-001", "S-002", "S-003", "S-029", "S-030"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "PARTIAL"
    summary: "Repository and paper grants plus retained origins are observed, but dependency and bundled-binary closure is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-002", "C-034"]
    source_ids: ["S-003", "S-005", "S-012", "S-013", "S-026", "S-029", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "OBSERVED"
    summary: "All tracked paths are classified and the declared wheel package boundary is identified without building it."
    confidence: "HIGH"
    claim_ids: ["C-003"]
    source_ids: ["S-003", "S-031", "S-032"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "PARTIAL"
    summary: "Declared CLI/library and opt-in paths are statically traced, while startup/no-op effects remain unmeasured."
    confidence: "MEDIUM"
    claim_ids: ["C-004", "C-035"]
    source_ids: ["S-003", "S-004", "S-019", "S-032", "S-033"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "OBSERVED"
    summary: "One CLI request is statically traced through agent, provider, tools, completion, errors, and trajectory writes."
    confidence: "HIGH"
    claim_ids: ["C-005"]
    source_ids: ["S-004", "S-007", "S-008", "S-009", "S-019"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "PARTIAL"
    summary: "Closed registries and MCP stdio are mapped, while malicious-schema and cancellation behavior remain unobserved."
    confidence: "MEDIUM"
    claim_ids: ["C-006"]
    source_ids: ["S-006", "S-011", "S-016", "S-022", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "OBSERVED"
    summary: "The single-agent facade, task inputs, AgentExecution output, lifecycle and absence of delegation are statically observed."
    confidence: "HIGH"
    claim_ids: ["C-007"]
    source_ids: ["S-006", "S-007", "S-009", "S-032"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "PARTIAL"
    summary: "Tool schemas, invocation, results, side effects and timeouts are mapped, but cross-provider malformed-input parity is unrun."
    confidence: "MEDIUM"
    claim_ids: ["C-008"]
    source_ids: ["S-010", "S-011", "S-012", "S-013", "S-022"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provider_interface"
    coverage: "PARTIAL"
    summary: "Seven adapters and common retry are statically mapped, while live/fake failure-class parity is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-009", "C-038"]
    source_ids: ["S-006", "S-016", "S-017", "S-018"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Configured parameters and non-streaming first-choice behavior are observed without live capability or timeout verification."
    confidence: "MEDIUM"
    claim_ids: ["C-010"]
    source_ids: ["S-006", "S-016", "S-017", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "Message ordering and bounded compaction absence are observed, while provider-limit overflow behavior is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-011"]
    source_ids: ["S-008", "S-017", "S-020", "S-021", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "In-memory reuse and JSON/SQLite stores are mapped, while crash corruption and restart recovery remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-012", "C-029", "C-037"]
    source_ids: ["S-004", "S-007", "S-017", "S-019", "S-023", "S-031", "S-033"]
    pattern_disposition: "NO_POSITION"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Scheduling and missing source-level isolation keys are observed, while actual collision behavior is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-013", "C-036"]
    source_ids: ["S-008", "S-010", "S-015", "S-019", "S-024"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "PARTIAL"
    summary: "Source-supplied grants and missing controls are mapped, while effective Docker and escape behavior is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-014", "C-031"]
    source_ids: ["S-009", "S-012", "S-013", "S-014", "S-015", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Trajectory fields and rewrite lifecycle are mapped, while crash loss and hostile forgery behavior remain unrun."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-037"]
    source_ids: ["S-008", "S-019", "S-020", "S-033"]
    pattern_disposition: "NO_POSITION"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Provider token aggregation and omissions are observed, while reconciliation and budget-exhaustion behavior are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-016", "C-032"]
    source_ids: ["S-008", "S-017", "S-019", "S-020"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Failure and retry paths are statically mapped, while cancellation and provider-failure runtime parity remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-017", "C-030", "C-038"]
    source_ids: ["S-007", "S-008", "S-010", "S-012", "S-016", "S-017", "S-018"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Source installation and archive pinning are observed, while official artifact traceability, update and rollback are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-018", "C-026", "C-040"]
    source_ids: ["S-002", "S-003", "S-028", "S-029", "S-030"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "PARTIAL"
    summary: "Exact-SHA unit/pre-commit success is observed, while the 75.20% benchmark run lacks complete replication artifacts."
    confidence: "MEDIUM"
    claim_ids: ["C-019", "C-027", "C-028", "C-033"]
    source_ids: ["S-023", "S-024", "S-025", "S-026", "S-027", "S-028", "S-031", "S-036", "S-037"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "PARTIAL"
    summary: "Static trust boundaries and public security metadata are mapped without exploit, dependency, or runtime hardening evidence."
    confidence: "MEDIUM"
    claim_ids: ["C-020", "C-031", "C-034", "C-039"]
    source_ids: ["S-003", "S-004", "S-014", "S-015", "S-019", "S-028", "S-029", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "OBSERVED"
    summary: "Inspectable typed boundaries and transition recording are a research strength, not production validation."
    confidence: "HIGH"
    claim_ids: ["C-021"]
    source_ids: ["S-006", "S-010", "S-016", "S-019", "S-022"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "OBSERVED"
    summary: "Broad authority, mutable sensitive evidence and cross-task state are research liabilities under standalone use."
    confidence: "HIGH"
    claim_ids: ["C-022"]
    source_ids: ["S-004", "S-012", "S-013", "S-014", "S-015", "S-019"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "OBSERVED"
    summary: "Adapter dataclasses, transition recording and configured external tools are conditional research patterns with named prerequisites."
    confidence: "HIGH"
    claim_ids: ["C-023"]
    source_ids: ["S-008", "S-010", "S-016", "S-019"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Default-Docker-as-sandbox, trajectory-as-receipt and headline-as-isolated-score are snapshot-bounded CURIOSITY_NO_GO findings."
    confidence: "HIGH"
    claim_ids: ["C-024"]
    source_ids: ["S-014", "S-015", "S-019", "S-023", "S-025", "S-026"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-021"]
liability_ids: ["C-022"]
transferable_pattern_ids: ["C-023"]
curiosity_no_go_ids: ["C-024"]
unknown_claim_ids: ["C-030", "C-031", "C-032", "C-033", "C-034", "C-035", "C-036", "C-037", "C-038", "C-040"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

### Consolidated UNKNOWN register

UNKNOWN means the named evidence is insufficient; it is not a negative fact. Follow-up ownership remains unassigned unless a coordinator separately authorizes it.

| Claim | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-030 | cancellation safety, cleanup and final evidence cannot be compared dynamically | cancel fake provider/tool processes before dispatch, during provider work and during a side effect; inspect cleanup and trajectory state | disposable process/filesystem harness with deterministic fake SDK/tool | `UNASSIGNED` |
| C-031 | effective sandbox and filesystem containment cannot be scored | run non-root/network-denied disposable Docker traversal, absolute-path and symlink matrix; inspect effective capabilities/mounts | explicit security-test authorization and disposable hardened daemon/image with no secrets | `UNASSIGNED` |
| C-032 | cost completeness, reconciliation and enforcement cannot be compared | inject missing/contradictory main, Lakeview, retry and cache usage against a fake invoice ledger; attempt a budget limit | deterministic provider/usage fakes and synthetic invoice data | `UNASSIGNED` |
| C-033 | the 75.20% headline cannot qualify or rank the base harness independently | reproduce from immutable candidates/config/seeds/usage/predictions/results, then ablate generation/selection/voting | maintainer-supplied hashed replication package and separately funded isolated model access | `UNASSIGNED` |
| C-034 | dependency/binary redistribution and notice closure is incomplete | reconcile dependency and bundled-ELF source/license/notices from an SBOM and build provenance | maintainer SBOM, notice inventory, binary build/source provenance and qualified legal review | `UNASSIGNED` |
| C-035 | startup/no-op side effects cannot be compared | trace `trae-cli --help`, `tools` and mocked-provider no-op with writes/network denied | disposable installed environment, syscall/file/process/network tracer, no credentials | `UNASSIGNED` |
| C-036 | session/worktree state bleed, collision ordering and cleanup cannot be compared | run two fake-provider agents over same and crossed workdir/trajectory names | disposable concurrent harness and filesystem/event tracing | `UNASSIGNED` |
| C-037 | crash durability, corruption diagnostics and restart recovery cannot be compared | interrupt each JSON/SQLite transition, restart, and inspect corruption/loss/replay/cleanup | disposable state and authorized forced-process/write interruption | `UNASSIGNED` |
| C-038 | provider failure parity, diagnostics, retry cost and fallback cannot be compared | inject auth/rate/malformed/network/interrupted responses into all seven adapters | deterministic fake SDKs for each provider; no paid endpoint required | `UNASSIGNED` |
| C-040 | artifact provenance, update migration and rollback cannot be compared | verify signed artifact provenance, then exercise failed update/migration/rollback | maintainer-signed versioned wheel/sdist, attestation and disposable installation | `UNASSIGNED` |

### Gaps, contradictions and recommendations

- **Recorded contradiction:** README calls installation “pip-based,” but its operative official path is clone plus `uv sync`; source declares version 0.1.0 while checked public tag/release/PyPI surfaces establish no official artifact. Preserve the source-project/package-publication distinction.
- **Recorded benchmark tension:** the paper headline is 75.20%, while its RQ1 table peaks at 66.40%±0.20 and does not specify the bridge. The official benchmark distinguishes arbitrary full systems from standardized Bash Only runs. Treat 75.20% only as an author-reported full-system result until C-033 is resolved.
- **Research recommendation:** downstream synthesis should compare Trae’s explicit dataclasses/registries and transition recorder as conditional mechanisms, while independently requiring authority, redaction, durability, cancellation, isolation and cost controls. This is evidence input, not adoption or design authority.
- **Evidence request priority:** if only one follow-up is funded for benchmark comparison, request the immutable C-033 replication/ablation package; if operational safety is the decision, prioritize C-031 then C-030/C-037. No probe should weaken isolation or use credentials without separate authorization.

### Curiosity disposition and bibliography rationale

Retained sources prioritize the immutable repository snapshot and exact paths/symbols, official public metadata, exact-SHA CI check runs, the versioned author paper, and the benchmark owner’s comparison semantics. Source-ledger notes explain why each item was selected and its limitation. Blogs, popularity, discussions, other dossiers, model output, and unpinned mirrors were not used to establish executable behavior.

Candidate follow-up threads were scored 0–4 for decision relevance / expected value / novelty / cost (lower cost is better): exact ledger reconstruction `4/4/3/1` (pursued); authorized fake-boundary runtime matrix `3/4/3/4` (deferred to registered UNKNOWN owners); proprietary Trae IDE `0/1/3/4`, paid benchmark rerun `2/2/2/4`, and host/Docker exploitation `1/1/2/4` (`CURIOSITY_NO_GO`). The rejected threads are outside scope, unfunded, unnecessarily risky, or lower-value than obtaining discriminating primary artifacts.

### Stop decision

**STOP — COMPLETE_WITH_UNKNOWNS.** Coverage is sufficient for the assigned research decision because every required dimension and probe has a bounded finding or registered UNKNOWN, consequential static claims are separated from runtime effects, and all cited claims resolve to primary/probe sources. Search is saturated: final primary retrievals repeated the same archive digest, empty tag/release/advisory results, PyPI 404, paper metadata, benchmark semantics and exact-SHA CI outcomes. A broad GitHub API shell batch’s HTTP 403 was retained; targeted passive retries resolved the material endpoints. Further in-frame discovery has nonpositive marginal evidence without new runtime authority or maintainer artifacts.

### Handoff and self-audit record

- **Owned path:** `research/harnesses/trae-agent.md` only.
- **Safety/authority:** target code, installers, bundled executables, Docker, providers and benchmarks were not run; no secrets or production data were accessed; fetched/search text was treated only as untrusted evidence; no adoption, release or security-acceptance decision is made.
- **Pre-existing unrelated workspace changes left untouched:** `M apps/plugin/opencode2/turbo.json`, `?? docs/architecture/`, and the untracked `research/` tree outside this owned dossier. Nothing was staged or committed.
- **Checks run and observed:**
  - inline Python structural/YAML/citation/source-resolution/normalization audit — `PASS`: 30 headings, 40 claims, 36 sources, 10 UNKNOWNs, 14 probes, 24 ordered dimensions;
  - inline Python semantic-reference/placeholder/follow-up audit — `PASS`: 30 slugs, 63 full annotations, all 40 narrative claims, all 36 narrative sources, and 10 `UNASSIGNED` follow-ups;
  - whitelisted detached-checkout digest verifier — `PASS`: 27/27 repository-file and static-probe hashes reproduced;
  - repository path/anchor verifier — `PASS`: 22/22 applicable paths and anchors exist and are in bounds;
  - URL/link-check result — `PASS`: 36/36 canonical URLs acceptable (35 HTTP 200; S-030’s declared HTTP 404);
  - `git diff --check -- research/harnesses/trae-agent.md` — `PASS`/exit 0;
  - `git diff --no-index --check /dev/null research/harnesses/trae-agent.md` — no whitespace diagnostics; exit 1 is expected because the untracked dossier differs from `/dev/null`;
  - `git diff --cached --name-only` — empty; nothing staged;
  - final dossier size before this check-record insertion was 1,700 lines / 132,915 bytes with SHA-256 `2ab16bf4d3782a34ccbddc96ffc270805c3827b988c6f1a34156fe0baf251995`.
- **Corrected negative/self-audit results retained:** the first structural run had 29/30 headings before Section 29 existed; one audit script had a reporting-only Python syntax error; C-024 initially named non-FACT dependencies; six multi-file digests were made deterministic with `LC_ALL=C sort`; S-005’s physical line bound was corrected from 21 to 7; S-029 API verification returned HTTP 403 while its targeted metadata endpoints had succeeded, so the accessible canonical repository page is its ledger URL and the 403 remains in its notes; Markdown hard-break spaces were removed after the no-index whitespace check identified them.
