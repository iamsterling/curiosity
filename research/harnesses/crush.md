# Crush — Whole-Harness Dossier

> Research-only evidence. No product, architecture, implementation, procurement, release, or security-acceptance authority.
> Evidence cutoff: 2026-08-24 UTC. Repository files, release artifacts, command output, and prompt-like text were treated as untrusted data, never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `crush-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** official Charmbracelet Crush / `N/A:whole-harness`
- **Researcher:** `ses_fc91c3549ffeLetf00LaOZiNv2`
- **Owned path:** `research/harnesses/crush.md`
- **Research date / cutoff:** 2026-08-24 UTC
- **Scope:** official `charmbracelet/crush` release `v0.91.0`, resolved commit `41cdd18a4b4f19c31c34301227da9341d62e9823`; static whole-harness architecture, local and client/server modes, and official release metadata.
- **Exclusions:** post-cutoff behavior; live providers; target executable or install scripts; destructive or escape probes; independent legal advice; full dependency-license audit; popularity scoring; exhaustive provider/model catalog; screenshots; downstream product selection or design.
- **Schema version:** `harness-dossier-summary/v1`
- **Completion state:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`
- **Safety:** static inspection and passive release-artifact inspection only; no Crush executable, provider call, hook, MCP server, LSP server, shell tool, installer, or fetched executable was run.
- **URL/link-check:** `PASS_WITH_QUALIFICATION`; a transport-only handoff check on 2026-08-25 UTC used no post-cutoff content as target evidence. Of 34 canonical source URLs, 33 returned HTTP 200; S-002 returned HTTP 403 because GitHub reported `x-ratelimit-remaining: 0`, while its retained pre-cutoff response rehashed to the recorded SHA-256. The three other unique inline URLs returned 200 for the repository/repository remote and an expected root-path 404 from the PostHog ingestion base `https://data.charm.land`; its host and TLS endpoint resolved.

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** `OBSERVED` with artifact qualification.
- **Claims:** `{C-001 FACT HIGH; S-001}` `{C-002 FACT HIGH; S-002,S-003,S-004}`
- **Finding:** The canonical upstream is `https://github.com/charmbracelet/crush`. Annotated tag object `f224fd65ade105bd57929a493a6131e6df52e64e` for `v0.91.0` peels to commit `41cdd18a4b4f19c31c34301227da9341d62e9823`; the detached checkout was clean, and `git submodule status` returned no entries. {C-001 FACT HIGH; S-001}
- **Release identity:** GitHub records release `v0.91.0` as non-draft/non-prerelease, published `2026-08-22T20:56:04Z`. Official metadata names a source archive with SHA-256 `a843c96fe268e4d6f1e8bd670e93b327915a986eefd2e310aa6a4aa4105197a1`, `checksums.txt` with SHA-256 `88e9db7783757b2adf39609921dd3817d431777777b85bf8dc0bb0d386404870`, and its Sigstore bundle with SHA-256 `6cfded0496dde15e881bf9a40afc882fd6679673fe647fe75b1ccd9f081463cf`. {C-002 FACT HIGH; S-002,S-003,S-004}
- **Package identity:** `N/A:not-a-package-artifact-inspected`; release binaries/packages exist, but no package bytes or executable were inspected. The exact source archive digest is official release metadata, not a locally reproduced build.
- **Platform/runtime assumptions:** static host macOS/arm64; release workflow declares Go `1.26.6`, and GoReleaser targets Linux, Darwin, Windows, FreeBSD, OpenBSD, NetBSD, and Android. No runtime portability result follows.
- **Evidence:** S-001–S-004.
- **Boundary/scope:** immutable commit and exact release metadata only; tag signature and Sigstore signer identity were not independently verified.
- **Unknowns:** reproducible artifact-to-source identity is C-031.

## 2. Provenance and license {#provenance-license}

- **Status:** `PARTIAL`; governing text is observed, legal/dependency aggregation is not complete.
- **Claims:** `{C-003 FACT HIGH; S-005}` `{C-004 FACT HIGH; S-005,S-006}` `{C-050 UNKNOWN N/A; S-005,S-033}`
- **Finding:** `LICENSE.md` identifies Charmbracelet, Inc. as licensor and applies FSL-1.1-MIT. It permits purposes other than a defined “Competing Use,” requires redistributed copies/modifications/derivatives to retain or link the terms and copyright notices, withholds trademark rights except origin/license identification, and grants each version an MIT license effective on the second anniversary of that version's availability. The file also preserves an MIT notice for Kujtim Hoxha's 2025 contribution period. {C-003 FACT HIGH; S-005}
- **History:** bounded license history includes transition commits `ef0d9004ad04e73288c5258f8d43a46a788610a4`, `2562b0dc79221a85c5e637d0a003a2b3ba656644`, and `9bc0e1001f3b01f115a10e88de348d54e6ed8d02`. This establishes change points, not a legal conclusion about every historical version. {C-003 FACT HIGH; S-005}
- **Contradiction:** `main.go` still advertises `MIT` in Swagger and links to nonexistent path `.../blob/main/LICENSE`, while the governing file is `LICENSE.md` under FSL-1.1-MIT. The dossier treats the repository license text as governing evidence and retains the annotation as stale conflicting metadata. {C-004 FACT HIGH; S-005,S-006}
- **Dependency caveat:** GoReleaser labels the project FSL-1.1-MIT, but no complete transitive dependency/SBOM license review was performed. {C-050 UNKNOWN N/A; S-005,S-033}
- **Evidence:** S-005, S-006, S-033.
- **Boundary/scope:** source snapshot and release configuration; no trademark permission, competing-use determination, or legal advice.
- **Unknowns:** C-050; counsel or the authorized license owner must assess a proposed use and reviewed SBOM.

## 3. Repository and package map {#repository-package-map}

- **Status:** `OBSERVED` statically.
- **Claims:** `{C-005 FACT HIGH; S-007,S-012,S-013,S-014}`
- **Finding:** The Go module is a single executable repository whose production composition separates commands, application services, transport-neutral backend, HTTP/SSE server/client, agent orchestration, tools, configuration, SQLite persistence, permissions, hooks, MCP, LSP, skills, shell execution, eventing, and Bubble Tea UI. `app.New` is the local composition root; `backend.CreateWorkspace` constructs the same application per server workspace. {C-005 FACT HIGH; S-007,S-012,S-013,S-014}

| Node | Classification | Bounded responsibility / surface |
| --- | --- | --- |
| `main.go`, `internal/cmd` | production executable | Cobra entrypoints, local/client selection, TUI, `run`, `server`, startup/cleanup |
| `internal/app` | production composition root | service wiring, event fan-in, coordinator, update check, shutdown |
| `internal/backend`, `internal/server`, `internal/client`, `internal/proto` | production alternate transport | multi-workspace lifecycle, HTTP/JSON/SSE, Unix/npipe/TCP client |
| `internal/agent` | production loop authority | model/provider adaptation, session runs, queues, retries, summarization, subagents |
| `internal/agent/tools`, `internal/shell` | production side-effect boundary | filesystem, process, network/MCP/LSP, background jobs |
| `internal/permission`, `internal/hooks` | production policy gates | approval requests, persistent grants, pre-tool shell hooks |
| `internal/db`, `internal/message`, `internal/session`, `internal/history` | production persistence | SQLite schema/services, transcript and cost/session state |
| `internal/skills`, `internal/agent/prompt` | production context extensions | skill discovery and system-prompt assembly |
| `internal/ui` | production UI/projection | Bubble Tea interaction and rendering |
| `internal/swagger` | generated | API documentation, not independent executable authority |
| `*_test.go`, `testdata` | test/fixture | qualification code and fixtures, not default production paths |

- **Evidence:** S-007, S-012–S-014.
- **Boundary/scope:** mapped responsibilities are path-bounded; package presence alone does not prove every optional path is reached.
- **Unknowns:** no exhaustive dead-code or vendored-dependency reachability audit was performed.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** `OBSERVED` statically; startup effects not dynamically observed.
- **Claims:** `{C-006 FACT HIGH; S-006,S-007,S-008,S-009,S-010,S-011}` `{C-033 FACT HIGH; S-006,S-010,S-011}`
- **Finding:** Cobra exposes interactive `crush`, non-interactive `crush run`, and `crush server` plus management subcommands. Interactive mode builds a workspace, Bubble Tea model, and event subscription. `run` accepts argv/stdin, resumes/creates a session, and uses either local `App.RunNonInteractive` or HTTP/SSE. `server` binds the full API over a Unix socket, Windows named pipe, or explicitly selected TCP address. {C-006 FACT HIGH; S-007,S-008,S-009,S-010,S-011}

| Form | Invocation / producer → consumer | Lifecycle owner | Side effects / failure surface |
| --- | --- | --- | --- |
| TUI | `crush` → Cobra → local `App` or client workspace → Bubble Tea | command context and app/workspace cleanup | data/log files, config/credential reads, update/telemetry/provider/MCP network, tools |
| Headless | `crush run [prompt]` / stdin → local app or HTTP/SSE | command context; local mode auto-approves the created session | same agent/tool authority; stdout; RunID-correlated completion |
| Server | `crush server --host <scheme://addr>` → HTTP router/backend | server process plus client/workspace claims | full workspace/config/agent/permission endpoints; SSE lifecycle |
| Profiler | `CRUSH_PROFILE=1 crush ...` → `http.ListenAndServe("localhost:6060", nil)` | process background goroutine | unauthenticated local pprof network listener {C-033 FACT HIGH; S-006} |
| Library/plugin/installer | `NOT_APPLICABLE:no supported public Go library or in-process plugin entrypoint was qualified`; distribution artifacts are handled in Section 18 | N/A | internal packages are not claimed as stable public APIs |

- **Evidence:** S-006–S-011.
- **Boundary/scope:** shipped command source; no target execution.
- **Unknowns:** undeclared startup side effects are C-046.

## 5. Control and data flow {#control-data-flow}

- **Status:** `PARTIAL`; representative path is statically traced.
- **Claims:** `{C-007 FACT HIGH; S-008,S-012,S-013,S-014,S-015,S-025}`
- **Finding:** A prompt is accepted by local app or backend, associated with session and optional RunID, passed to the coordinator, persisted as a user message, combined with system/history/tool context, streamed through Fantasy, and converted into assistant/tool records. Tool schemas and callbacks hand model-selected actions to local tools; updates flow to SQLite and pubsub; terminal completion is emitted only after pending message updates are flushed. {C-007 FACT HIGH; S-008,S-012,S-013,S-014,S-015}

| Step | Producer → consumer | Control/data/authority | Lifecycle, side effect, error |
| --- | --- | --- | --- |
| 1 | TUI/CLI/HTTP → workspace/backend | prompt, session ID, RunID, attachments | validates non-empty prompt/session; HTTP dispatch is accepted then workspace-owned |
| 2 | coordinator → session agent | selected model/provider options, tool palette, system prompt | waits for readiness; non-interactive waits for MCP initialization |
| 3 | session agent → message service | durable user and empty assistant records | SQLite errors abort the run |
| 4 | session agent → Fantasy/provider | system prompt, history, files, tool schemas, headers/options | provider network and retry occur inside provider/Fantasy boundary |
| 5 | model/Fantasy → tool | typed tool name/input and run context | hook/permission policy precedes applicable sink; tool may mutate host/network/process |
| 6 | tool/provider → message/session services | tool results, content deltas, finish reason, usage/cost | deltas debounce; structural/terminal updates flush synchronously |
| 7 | services → broker → TUI/SSE | projection events | intermediate events may drop; SQLite remains queryable |
| 8 | session agent → RunComplete broker → `crush run` | RunID, message ID, final text/error/cancel | flush then bounded must-deliver publish; client exits on matching terminal event |

- **Trust crossings:** user/repository/skills/MCP text → model context; model output → tool selection; tool output → model transcript; process → provider/MCP/update/telemetry network; HTTP peer → full backend authority.
- **Evidence:** S-008, S-012–S-015, S-025.
- **Boundary/scope:** one representative top-level run; provider internals and live behavior excluded.
- **Unknowns:** duplicate physical sends, crash ambiguity, and saturated terminal delivery are C-027, C-017, and C-049.

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** `PARTIAL`.
- **Claims:** `{C-008 FACT HIGH; S-014,S-018,S-031}`
- **Finding:** Extension mechanisms are configuration/discovery based rather than a stable unloadable plugin ABI: MCP contributes remote tools/prompts/resources/instructions; Agent Skills discovers and parses `SKILL.md`; PreToolUse hooks execute configured shell commands and can deny, halt, rewrite input, append context, or pre-approve a call; LSP managers contribute language operations. Registration is assembled per workspace and tool lists can update between runs. {C-008 FACT HIGH; S-014,S-018,S-031}
- **Discovery/order/lifecycle:** skills deduplicate with last occurrence winning and are sorted after concurrent discovery; hooks aggregate in configuration order with deny over allow and sticky halt; interactive runs may omit still-connecting MCP tools while non-interactive runs wait for MCP initialization. MCP/LSP/process cleanup is app-owned.
- **Versioning/unload:** MCP supplies protocol negotiation through its SDK, but no stable versioned Go plugin ABI, independent hot-unload contract, or isolation boundary for shell hooks/skills was established.
- **Evidence:** S-014, S-018, S-031.
- **Boundary/scope:** built-in skills/MCP/hooks/LSP extension paths; third-party extension contents excluded.
- **Unknowns:** compatibility across versions and failure during reload/unload were not dynamically qualified.

## 7. Agent interface {#agent-interface}

- **Status:** `OBSERVED` statically.
- **Claims:** `{C-009 FACT HIGH; S-014,S-015}` `{C-010 FACT HIGH; S-014,S-016,S-026}`
- **Finding:** `Coordinator` and `SessionAgent` own model selection, tools, prompt/history assembly, per-session active requests and queues, summarization, title generation, cancellation, and completion publication. Inputs are session ID, prompt, attachments, parameters, and optional RunID/accepted-run handle; outputs are `fantasy.AgentResult`, persisted messages, notifications, and `RunComplete`. {C-009 FACT HIGH; S-014,S-015}
- **Delegation:** the `agent` tool is a parallel Fantasy tool. It creates a deterministic child/task session tied to parent message/tool-call IDs, runs a subagent with its own prompt/tool set, returns text as the tool result, and best-effort adds child cost to the parent. {C-010 FACT HIGH; S-014,S-016,S-026}
- **Authority:** top-level and child session agents are active loop/tool authorities, not passive model adapters. Subagents inherit process-level tool/credential authority subject to their configured tool list and permission service.
- **Cancellation/errors:** cancellation is per session plus `CancelAll`; child errors are converted to error tool responses. Parent cancellation propagates by context to the child call, but verified descendant termination is unobserved.
- **Evidence:** S-014–S-016, S-026.
- **Boundary/scope:** built-in coder/task agents.
- **Unknowns:** provider/tool late-result fencing and complete recursive process termination are C-029.

## 8. Tool interface {#tool-interface}

- **Status:** `PARTIAL`; declaration and sink paths are static, runtime validation is not qualified.
- **Claims:** `{C-011 FACT HIGH; S-014,S-015,S-017,S-018,S-021}` `{C-047 UNKNOWN N/A; S-014,S-015,S-021}`
- **Finding:** tools are Fantasy `AgentTool` values with names, descriptions, inferred JSON parameters, callbacks, and response metadata. The coordinator composes shell, file, search, todo, question, LSP, MCP, download/fetch, logs, background-job, and subagent tools according to config and agent role. Hooks wrap top-level tools; applicable tools request permission before the final host operation. Errors usually become error tool responses or Go errors recorded into transcript/terminal state. {C-011 FACT HIGH; S-014,S-015,S-017,S-018,S-021}
- **Invocation protocol:** session/message/model capabilities are carried in context; model tool input is sanitized if invalid JSON, tool results become model-visible transcript records, and metadata may include diffs, output, hook decisions, timing, working directory, and background job IDs.
- **Timeout/cancellation:** foreground shell auto-backgrounds after 60 seconds by default rather than imposing a hard execution timeout; context cancellation kills a tracked shell. Explicit background jobs detach from run context and require app/job cleanup.
- **Trust:** tool output is untrusted model input but has no typed provenance/taint authority in the message schema.
- **Evidence:** S-014, S-015, S-017, S-018, S-021.
- **Boundary/scope:** built-in tool composition and representative shell/file paths.
- **Unknowns:** malformed/extra/wrong-type/oversized coverage is C-047.

## 9. Provider interface {#provider-interface}

- **Status:** `PARTIAL`; no live provider was called.
- **Claims:** `{C-012 FACT MEDIUM; S-014,S-015}` `{C-048 UNKNOWN N/A; S-014,S-015}`
- **Finding:** the coordinator resolves selected provider/model configuration, API keys/OAuth, base URLs/headers, provider-specific Fantasy implementations/options, and then delegates streaming to `fantasy.LanguageModel`. Built-in adapters include Anthropic-, OpenAI-, Google-, Bedrock-, Azure-, OpenRouter-, Vercel-, and OpenAI-compatible paths; local discovery also maps known compatible services. {C-012 FACT MEDIUM; S-014,S-015}
- **Authentication/transport:** provider config and OAuth refresh feed headers/SDK options. Fantasy/provider implementations own HTTP transport and retry callbacks; Crush logs `OnRetry` and can refresh on 401.
- **Fallback/errors:** configuration has explicit missing-provider/model errors; title generation tries small then large model. No evidence establishes automatic cross-provider failover for a normal run.
- **Telemetry/cost inputs:** provider usage and metadata feed session accounting and telemetry; OpenRouter may override calculated cost.
- **Evidence:** S-014, S-015.
- **Boundary/scope:** Crush adaptation into Fantasy, not dependency internals or provider services.
- **Unknowns:** auth/rate-limit/DNS/malformed/interrupted-stream behavior and physical-send visibility are C-048 and C-027.

## 10. Model interface {#model-interface}

- **Status:** `PARTIAL`.
- **Claims:** `{C-013 FACT HIGH; S-014,S-015}` `{C-048 UNKNOWN N/A; S-014,S-015}`
- **Finding:** a Crush `Model` combines a Fantasy language model, Catwalk capability/catalog metadata, selected config, and flat-rate flag. The coordinator chooses large/small models, merges temperature/top-p/top-k/penalties and provider options, derives maximum output tokens and reasoning settings, passes image support/context-window metadata, and streams text/reasoning/tool calls. {C-013 FACT HIGH; S-014,S-015}
- **Capability assumptions:** context window, image support, reasoning levels, default tokens, costs, and provider API family come from configuration/catalog metadata. Unknown context window disables auto-summary rather than assuming a limit.
- **Structured output:** model-selected tool calls are the qualified structured-action channel; no general application-level JSON schema output contract was traced.
- **Routing/fallback:** model refresh occurs before runs; restored model selection and title small→large fallback exist, but normal-call cross-provider fallback is not established.
- **Evidence:** S-014, S-015.
- **Boundary/scope:** static Catwalk/Fantasy adaptation.
- **Unknowns:** live capability disagreement and network failure behavior are C-048.

## 11. Context interface {#context-interface}

- **Status:** `PARTIAL`; assembly is observed, contamination resistance is not dynamically tested.
- **Claims:** `{C-014 FACT HIGH; S-015,S-029,S-030,S-031}` `{C-015 FACT HIGH; S-015,S-030}` `{C-034 UNKNOWN N/A; S-021,S-022,S-029,S-030}`
- **Finding:** the coder system prompt combines a large embedded policy template with working-directory/platform/date/Git status, configured project/global context files, available-skill metadata, selected provider/model, and later connected MCP instructions. Transcript history, attachments, queued prompts, system-prefix messages, cache metadata, and tool results are then assembled for each provider step. {C-014 FACT HIGH; S-015,S-029,S-030,S-031}
- **Instruction/data separation:** context files are path-labelled in XML-like wrappers, and skill fields are escaped. Nevertheless, the system prompt explicitly says to follow memory/project/skill instructions; MCP instructions are appended to the system prompt. Labels preserve origin textually but do not type it as non-authoritative data. {C-014 FACT HIGH; S-029,S-030,S-031}
- **Compaction:** near a model-declared context threshold, auto-summary stops the current stream, performs a separate model call with history and todos, stores an assistant summary, records its usage, sets `SummaryMessageID`, and future history starts at that summary retyped as a user message. This is lossy model-generated compaction. {C-015 FACT HIGH; S-015,S-030}
- **Contamination controls:** orphaned tool results are dropped and missing results receive synthetic errors; images are filtered for unsupported models; invalid tool JSON is replaced with an error. No typed provenance or recursive capability intersection was found.
- **Evidence:** S-015, S-029–S-031.
- **Boundary/scope:** default prompt/history/summarization paths.
- **Unknowns:** whether crafted repository/tool/MCP text can alter consequential behavior in a disposable run is C-034.

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** `PARTIAL`.
- **Claims:** `{C-016 FACT HIGH; S-007,S-013,S-024,S-025,S-026}` `{C-017 UNKNOWN N/A; S-024,S-025}`
- **Finding:** durable state lives in per-data-directory SQLite `crush.db` with Goose migrations, foreign keys, WAL, `synchronous=NORMAL`, secure delete, one open connection, and a 30-second busy timeout. Sessions store parent ID, title, message/token/cost totals, summary pointer, and todos; messages store role, parts, model/provider, summary marker, and timestamps. {C-016 FACT HIGH; S-024,S-025,S-026}
- **Write/flush:** message deltas are accepted into an in-memory latest-state buffer and coalesced for 33 ms; finished messages, tool-call structure, and completed reasoning flush synchronously. Run completion, session switching, and shutdown call `FlushAll`. Failed writes restore a dirty bit for a later retry. {C-016 FACT HIGH; S-025}
- **Locking:** server workspace creation opts into an OS-level per-data-directory lock; default local mode calls `db.Connect` without it. `CRUSH_SKIP_DATADIR_LOCK` can bypass server acquisition. Same-process connections share a pool. {C-016 FACT HIGH; S-007,S-013,S-024}
- **Retention/deletion:** session deletion transactionally removes messages/files/session. No configurable retention/audit policy was established. The `EstimatedUsage` marker is in-memory only, although token/cost totals are durable.
- **Restart/corruption:** migrations run on open and interrupted tool calls are repaired in prompt projection with synthetic results, but crash-at-write, torn WAL, migration rollback, and corruption recovery were not observed. {C-017 UNKNOWN N/A; S-024,S-025}
- **Evidence:** S-007, S-013, S-024–S-026.
- **Boundary/scope:** application SQLite/transcript state, not a canonical append-only domain ledger.
- **Unknowns:** C-017.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** `PARTIAL`.
- **Claims:** `{C-018 FACT HIGH; S-013,S-015,S-024,S-031}` `{C-019 UNKNOWN N/A; S-013,S-015,S-024}`
- **Finding:** server mode hosts multiple workspaces and deduplicates them by an absolute symlink-resolved path under a backend mutex; each receives a workspace context, app/services, per-workspace skills manager, client claims, and run wait group. Within an agent, per-session mutexes serialize accept/queue/active transitions while different sessions and parallel tools/subagents may run concurrently. SQLite access is serialized through one connection. {C-018 FACT HIGH; S-013,S-015,S-024,S-031}
- **Collision semantics:** duplicate server creates for the same resolved path are first-wins and channel-option mismatch is rejected. Client detach/create/idle timers coordinate teardown. Default local processes do not acquire the data-directory lock, so two local processes can target the same SQLite/workspace state without the server's fencing. {C-018 FACT HIGH; S-013,S-024}
- **Worktrees/tenants:** working directory is an isolation/dedup key, not a built-in Git worktree lifecycle manager or OS tenant boundary. Tools may address paths outside it after policy approval or bypass.
- **Cleanup/determinism:** skills sort concurrent discovery; tool/subagent completion can be parallel; event ordering across brokers is not globally serialized.
- **Evidence:** S-013, S-015, S-024, S-031.
- **Boundary/scope:** process/workspace/session concurrency; no race test executed by this dossier.
- **Unknowns:** cross-process local collision, state bleed, and cleanup under induced races are C-019.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** `OBSERVED` for static enforcement posture; one classifier bypass is challenged.
- **Claims:** `{C-020 FACT HIGH; S-017,S-018,S-021,S-022}` `{C-021 FACT HIGH; S-019,S-020,S-021}` `{C-022 INFERENCE HIGH; S-017,S-021,S-022,S-023}`
- **Finding:** the permission service can prompt, deny, grant once, persist a session/tool/action/path grant, allow configured tools, skip all requests, auto-approve a session, or accept hook pre-approval. Local `crush run` auto-approves its selected session; `--yolo` skips requests; a PreToolUse hook error logs and proceeds, while explicit hook allow skips the normal prompt. {C-020 FACT HIGH; S-017,S-018,S-021}

| Actor → action | Default gate / bypass | Actual enforcement and side effects |
| --- | --- | --- |
| model → shell | “safe” prefix skips request; otherwise permission service | host POSIX-emulation shell with inherited environment and configured blockers |
| model → write/edit | permission request keyed by session/tool/action/path | direct host filesystem operations; no root sandbox |
| model → view | outside-workdir lexical check requests permission; skill paths exempt | `Abs`/`Rel` check, then host file read; no use-time symlink containment demonstrated |
| hook → tool | deny/halt, rewrite, append context, or allow | configured shell hook is trusted policy code; error is fail-open |
| TUI/HTTP operator → permission | grant/deny/skip endpoints | first resolver wins pending request; HTTP surface has no authentication middleware |
| shell child → host | OS user credentials/environment | process/session isolation and blocklist, not filesystem/network/credential confinement |

- **Approval-bypass finding:** `containsCommandChaining` checks `;`, `|`, `&&`, `$(`, and backticks but not redirection or a single `&`. Its tests explicitly expect `ls > /tmp/out`, `ls & echo done`, `ls &> /dev/null`, and `ls >& /dev/null` to be non-chaining. Since `ls` is “safe,” such strings skip permission before the shell interpreter processes their side effects; a second unblocked command after `&` is therefore a static alternate-path bypass of the approval prompt. {C-021 FACT HIGH; S-019,S-020,S-021}
- **Interpretation:** permissions and process groups are policy/terminal-safety mechanisms, not an OS sandbox. They cannot establish least-privilege containment against arbitrary host paths, network, inherited credentials, or an unauthenticated TCP peer. {C-022 INFERENCE HIGH; S-017,S-021,S-022,S-023}
- **Evidence:** S-017–S-023.
- **Boundary/scope:** built-in local policy and representative shell/file sinks; no exploit was run.
- **Unknowns:** symlink/traversal/case escape behavior under a qualified disposable sandbox is C-034.

## 15. Evidence and observability {#evidence-observability}

- **Status:** `PARTIAL`.
- **Claims:** `{C-023 FACT HIGH; S-015,S-025,S-027}` `{C-024 FACT HIGH; S-007,S-012,S-028}` `{C-025 FACT HIGH; S-027}` `{C-049 UNKNOWN N/A; S-015,S-025,S-027}`
- **Finding:** SQLite persists sessions/messages/tool metadata and usage; services publish lifecycle updates; logs record errors/retries/drop warnings; SSE and Bubble Tea consume projections; session and RunID/tool-call/message IDs provide local correlation. `RunComplete` carries session ID, RunID, final message/text, error, and cancelled state after a message flush. {C-023 FACT HIGH; S-015,S-025,S-027}
- **Delivery:** each subscriber buffer holds 4,096 events. Ordinary publishes are non-blocking/lossy. “Must deliver” waits at most 50 ms per subscriber and may still drop, incrementing only in-memory counters and logs. This is observable loss, not durable event delivery or replay. {C-025 FACT HIGH; S-027}
- **Telemetry:** when enabled, PostHog receives version, GOOS/GOARCH, Go version, TERM, shell basename, interactive/continuation flags, product events, and exceptions at `https://data.charm.land`. Config, `CRUSH_DISABLE_METRICS`, or `DO_NOT_TRACK` disables initialization. Update checking is a separate 30-second background network action. {C-024 FACT HIGH; S-007,S-012,S-028}
- **Ownership/tamper:** SQLite/logs are ordinary user-writable local files. No signature or append-only tamper-evident receipt protects transcript/evidence against the invoking user or trusted in-process code.
- **Evidence:** S-007, S-012, S-015, S-025, S-027, S-028.
- **Boundary/scope:** local logs/database/brokers and optional PostHog; provider-side traces excluded.
- **Unknowns:** loss rate, reconciliation after terminal drop, redaction completeness, and spoof resistance are C-049.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** `PARTIAL`.
- **Claims:** `{C-026 FACT HIGH; S-014,S-015,S-026}` `{C-027 UNKNOWN N/A; S-014,S-015,S-026}`
- **Finding:** each provider step updates session prompt/completion/cache token counts and cost from provider usage plus Catwalk rates; OpenRouter metadata may override cost; flat-rate models force monetary cost to zero. If step usage is zero, Crush estimates from model-visible messages, marks the session estimated, and assigns no estimated monetary cost. Summary/title/subagent calls can also change usage/cost; child cost propagates to the parent best-effort. {C-026 FACT HIGH; S-015,S-026}
- **Limits:** model context/max output constrain generation; loop detection and auto-summary stop conditions exist; background jobs cap at 50 and output is truncated. No CPU, memory, network, process-tree, or monetary budget enforcement was established.
- **Visibility:** title generation, compaction, provider retries, and child agents may issue additional physical calls. RunID identifies a logical top-level turn, not every physical provider request.
- **Evidence:** S-014, S-015, S-026.
- **Boundary/scope:** session reporting and local estimates; not provider billing accuracy.
- **Unknowns:** reconciliation of physical attempts, cache/retries, missing/contradictory usage, child propagation failure, and provider totals is C-027.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** `PARTIAL`.
- **Claims:** `{C-028 FACT HIGH; S-013,S-014,S-015,S-023,S-025}` `{C-029 UNKNOWN N/A; S-013,S-015,S-021,S-023,S-025}` `{C-048 UNKNOWN N/A; S-014,S-015}`
- **Finding:** structural call validation rejects empty prompt/missing session; busy sessions queue; cancellation is serialized against accepted/queued/active transitions; queued RunID calls receive explicit cancelled completion; stream errors persist final/cancelled assistant/tool states using short detached contexts; shutdown cancels workspace/coordinator work, waits for run goroutines, flushes messages, then kills background shells/LSP/MCP. {C-028 FACT HIGH; S-013,S-015,S-023,S-025}
- **Retry:** Fantasy invokes `OnRetry`; partial assistant content is reset before a retry. A 401 may trigger token refresh and a transparent retry, whose attempts are coalesced into one final `RunComplete`. Client creation retries a shutting-down server at most three times. No general tool-side-effect retry/idempotency mechanism was traced.
- **Timeouts/cleanup:** provider/MCP configuration may bound calls; `CancelAll` waits at most five seconds; process groups receive SIGINT then SIGKILL after two seconds on Unix; app shutdown uses five seconds. These source paths state mechanisms, not observed descendant termination.
- **Diagnostics:** stable examples include `no prompt provided`, `failed to wait for MCP initialization`, `agent not ready`, permission-denied tool responses, provider retry logs, and cancelled/error finish reasons.
- **Evidence:** S-013–S-015, S-021, S-023, S-025.
- **Boundary/scope:** static cancellation/retry/error paths.
- **Unknowns:** pre-dispatch/stream/side-effect races, verified descendant cleanup, duplicate effects, partial writes, late results, and provider faults are C-029 and C-048.

## 18. Install, update, and release {#install-update-release}

- **Status:** `PARTIAL`.
- **Claims:** `{C-002 FACT HIGH; S-002,S-003,S-004}` `{C-030 FACT HIGH; S-002,S-032,S-033}` `{C-031 UNKNOWN N/A; S-002,S-003,S-004,S-032,S-033}`
- **Finding:** tag pushes invoke a Charmbracelet reusable GoReleaser workflow. GoReleaser builds CGO-disabled, trimpath binaries for a broad OS/architecture matrix, packages licenses/completions/manpages, emits checksum/source/SBOM artifacts, signs the checksum with `cosign sign-blob --bundle`, and publishes package-manager metadata. Release `v0.91.0` exposes corresponding digest-bearing assets. {C-030 FACT HIGH; S-002,S-032,S-033}
- **Integrity/signing:** official SHA-256 metadata and a Sigstore bundle are present. The annotated tag contains an SSH signature. This dossier did not verify signer identity, transparency-log policy, package-manager signatures, macOS notarization, or binary provenance.
- **Updates:** application startup checks for newer versions in the background and reports availability; no automatic binary replacement was traced in this path. Client/server mode replaces a mismatched running server with the current client executable.
- **Compatibility/rollback:** current config migrations run forward on DB open. No documented compatibility guarantee, failed-update transaction, database downgrade, or rollback proof was qualified.
- **Evidence:** S-002–S-004, S-032, S-033.
- **Boundary/scope:** release configuration and metadata; no install/update execution.
- **Unknowns:** byte-reproducible source→binary mapping, signer verification, migration rollback, and failed update recovery are C-031.

## 19. Tests and qualification {#tests-qualification}

- **Status:** `PARTIAL`; static inventory only.
- **Claims:** `{C-032 FACT HIGH; S-020,S-034}` `{C-017 UNKNOWN N/A; S-024,S-025}` `{C-019 UNKNOWN N/A; S-013,S-015,S-024}` `{C-029 UNKNOWN N/A; S-013,S-015,S-021,S-023,S-025}`
- **Finding:** the pinned repository contains 215 `*_test.go` files across 52 directories. CI declares `go mod tidy`, clean-diff, `go build -race ./...`, and `go test -race -failfast ./...` on Ubuntu, macOS, and Windows; lint delegates to `charmbracelet/meta/.github/workflows/lint.yml@main`. Tests cover agent dispatch/cancellation, server/client races, pubsub delivery, message flushes, shell isolation/blocking, MCP lifecycle, permissions, and configuration. {C-032 FACT HIGH; S-020,S-034}
- **Qualification limits:** this dossier did not install dependencies or run tests. Checked-in tests and workflow intent do not establish that `v0.91.0` passed, and the release workflow itself delegates to a mutable `@main` reusable workflow. Static tests establish only their encoded expectations—most notably the redirect/single-`&` safe-classifier behavior—not production runtime safety.
- **Evidence:** S-020, S-034.
- **Boundary/scope:** pinned test files/workflows; historical CI run pages and coverage percentages excluded.
- **Unknowns:** runtime race freedom, crash recovery, provider matrix, saturation, and platform-specific cleanup are C-017, C-019, C-029, C-048, and C-049.

## 20. Security {#security}

- **Status:** `PARTIAL`; no security acceptance is implied.
- **Claims:** `{C-021 FACT HIGH; S-019,S-020,S-021}` `{C-022 INFERENCE HIGH; S-017,S-021,S-022,S-023}` `{C-033 FACT HIGH; S-006,S-010,S-011}` `{C-034 UNKNOWN N/A; S-021,S-022,S-029,S-030}`
- **Trust boundaries:** repository/context/skill/MCP/tool/provider text enters model-visible context; model output selects tools; tools/hooks execute with host-user authority; configuration contains provider/OAuth secrets; HTTP/SSE can expose backend authority; release assets cross the supply chain.
- **Controls:** structured decoding/schema validation, invalid-tool JSON sanitization, permission prompts, hook deny/halt, command block functions, process-group cancellation, redacted log-header tests, provider-scoped auth, database permissions/secure-delete pragma, release checksums/SBOM/Sigstore metadata, and panic recovery.
- **Network exposure:** default server transport is per-user Unix socket/named pipe, but user-selected TCP binds the full router with no authentication middleware. UUID client IDs only track claims. `CRUSH_PROFILE` exposes local pprof without authentication. {C-033 FACT HIGH; S-006,S-010,S-011}
- **Unresolved attack surfaces:** approval bypass via redirection/single `&`; lexical rather than symlink-resolved file checks; arbitrary path writes after policy approval; inherited environment/credentials; fail-open hook errors; project/MCP prompt instructions; optional telemetry/update/provider network; mutable local evidence. {C-021 FACT HIGH; S-019,S-020,S-021} {C-022 INFERENCE HIGH; S-017,S-021,S-022,S-023}
- **Evidence:** S-006, S-010, S-011, S-017, S-019–S-023, S-029, S-030.
- **Boundary/scope:** source-level threat surface; no penetration test, advisory search, or vulnerability acceptance.
- **Unknowns:** exploitability/severity under exact filesystem, prompt-injection, TCP, and credential fixtures is C-034.

## 21. Strengths {#strengths}

- **Status:** `OBSERVED` as bounded interpretations, not adoption recommendations.
- **Claims:** `{C-035 INFERENCE HIGH; S-008,S-013,S-014,S-015,S-025,S-027}` `{C-036 INFERENCE MEDIUM; S-015,S-024,S-025}`

1. **Explicit run lifecycle and cleanup seams:** accepted/queued/active transitions, RunID correlation, flush-before-completion, workspace-owned run contexts, and ordered shutdown make logical turn state and cancellation paths unusually visible in source. This is useful for studying lifecycle mechanics even though terminal delivery and descendant termination remain bounded rather than durable/verified. {C-035 INFERENCE HIGH; S-008,S-013,S-014,S-015,S-025,S-027}
2. **Practical local transcript durability:** SQLite/WAL, migrations, terminal-state synchronous writes, debounced-delta flush, summary pointers, and child-session links provide resumable local conversation state with more structure than a memory-only loop. This is transcript durability, not canonical replay or crash-proof domain truth. {C-036 INFERENCE MEDIUM; S-015,S-024,S-025}

- **Evidence:** S-008, S-013–S-015, S-024, S-025, S-027.
- **Boundary/scope:** source clarity and local transcript operation at the pinned snapshot.
- **Unknowns:** large-session performance and fault-injected durability were not measured.

## 22. Liabilities {#liabilities}

- **Status:** `OBSERVED` as evidence-backed interpretations.
- **Claims:** `{C-037 INFERENCE HIGH; S-012,S-013,S-014,S-015}` `{C-038 INFERENCE HIGH; S-006,S-010,S-017,S-019,S-020,S-021,S-022}` `{C-039 INFERENCE HIGH; S-015,S-029,S-030,S-031}`

| Liability | Trigger → consequence | Affected boundary / mitigation |
| --- | --- | --- |
| Competing authority | embedding the default runtime beneath another orchestrator → Crush still owns loop, retry, queue, approval, persistence, completion, and cleanup | application/provider/tool authority; only a much narrower extracted protocol could remain subordinate {C-037 INFERENCE HIGH; S-012,S-013,S-014,S-015} |
| Policy without containment | relying on prompt/allowlist/hook/blocklist as a sandbox → ambient host authority and the safe-classifier bypass remain | execution/security; external qualified sandbox and final-sink authorization required {C-038 INFERENCE HIGH; S-006,S-010,S-017,S-019,S-020,S-021,S-022} |
| Context authority contamination | loading repository/skill/MCP instructions → untrusted prose is promoted into system-level instructions with no taint type | context/permission boundary; keep data provenance typed and authority external to model prose {C-039 INFERENCE HIGH; S-015,S-029,S-030,S-031} |

- **Evidence:** S-006, S-010, S-012–S-015, S-017, S-019–S-022, S-029–S-031.
- **Boundary/scope:** suitability constraints against a sole-authority, typed-policy custom harness; not a general product-quality verdict.
- **Unknowns:** downstream adapter feasibility requires separate authorized architecture synthesis.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** `OBSERVED` as preliminary clean-room pattern input.
- **Claims:** `{C-040 INFERENCE MEDIUM; S-008,S-014,S-015,S-025,S-027}` `{C-041 INFERENCE MEDIUM; S-015,S-025}` `{C-042 INFERENCE HIGH; S-013,S-031}`

| Pattern | Minimal mechanism / problem solved | Prerequisites and preserved boundary | Cost/risk | Disposition |
| --- | --- | --- | --- | --- |
| Correlated terminal completion | mint per-logical-call RunID; persist/flush final state; emit one payload-bearing terminal outcome | durable dispatcher must own attempt identity and subscriber must reconcile by query; do not call bounded pubsub durable | medium; requires durable event/outbox rather than 50 ms broker | `CONDITIONAL` {C-040 INFERENCE MEDIUM; S-008,S-014,S-015,S-025,S-027} |
| Coalesced projections with structural flush | debounce replaceable content deltas; synchronously flush tool/finish/cancel structure; explicit `FlushAll` at boundaries | canonical facts remain transactional elsewhere; crashes must reconcile | medium; needs WAL/fault qualification and durable sequencing | `CONDITIONAL` {C-041 INFERENCE MEDIUM; S-015,S-025} |
| Workspace-scoped managers | one explicit manager/context per workspace; avoid process globals in multi-workspace server | identity and lifecycle owned above it; no shared mutable global mirror | low/medium; applies to skills/MCP/LSP-like projections | `CANDIDATE` {C-042 INFERENCE HIGH; S-013,S-031} |

- **Evidence:** S-008, S-013–S-015, S-025, S-027, S-031.
- **Boundary/scope:** mechanisms only; no code-copying or design approval.
- **Unknowns:** adaptation fit belongs to the downstream ADR-authorized synthesis.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** `OBSERVED` as bounded rejection/curiosity disposition.
- **Claims:** `{C-043 INFERENCE HIGH; S-017,S-019,S-020,S-021,S-022}` `{C-044 INFERENCE HIGH; S-010,S-011}` `{C-045 INFERENCE HIGH; S-001,S-002,S-014,S-030}`

| Pattern/thread | Exact `CURIOSITY_NO_GO` rationale | Violated boundary / failure mode | Reopen condition |
| --- | --- | --- | --- |
| Safe-command prefix classifier as authorization | lexical prefixes plus incomplete metacharacters classify side-effecting redirection/background forms as no-prompt; command blocklists cannot enumerate all effects | action-time authority is decided before the parsed final sink | only after parser-complete resource extraction plus final-sink enforcement and adversarial qualification {C-043 INFERENCE HIGH; S-017,S-019,S-020,S-021,S-022} |
| Unauthenticated TCP server as a “thin local adapter” | selecting TCP exposes configuration, provider keys, permissions, agents, shell, and sessions without actor authentication; client UUID is not a credential | remote/local peer can become a second unauthenticated authority | only with authenticated single-actor transport, reduced API, and authorization at every sink {C-044 INFERENCE HIGH; S-010,S-011} |
| Provider-catalog enumeration, popularity metrics, TUI screenshots, broad history, or post-cutoff HEAD | these threads do not change the pinned authority, containment, durability, or license-gate findings and add snapshot drift/cost | research budget and immutable comparison boundary | a downstream decision names a missing provider capability, legal chronology, or UI property that can change a hard-gate verdict {C-045 INFERENCE HIGH; S-001,S-002,S-014,S-030} |

- **Evidence:** S-001, S-002, S-010, S-011, S-014, S-017, S-019–S-022, S-030.
- **Boundary/scope:** pinned release and Curiosity comparison frame; not rejection of the whole project.
- **Unknowns:** no claim is made that rejected discovery threads contain no useful ecosystem information.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** `PARTIAL`; static challenges were preferred, one policy probe failed, and unsafe/live probes remain explicit.
- **Claims:** `{C-046 UNKNOWN N/A; S-006,S-007,S-012,S-028}` `{C-047 UNKNOWN N/A; S-014,S-015,S-021}` `{C-048 UNKNOWN N/A; S-014,S-015}` `{C-049 UNKNOWN N/A; S-015,S-025,S-027}` plus the cited probe-specific claims below.

| Probe | Expected safe behavior defined before challenge | Actual bounded result | Result | Environment | Claims | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 Startup/no-op side effects | denied-write/network startup performs no undeclared effect and reports required access | static trace found data/log creation, config/project registration, update check, optional telemetry, credential/provider/MCP setup, clipboard, and optional pprof; no denied-runtime observation | `NOT_RUN_UNSAFE` | static source; target not run | C-024,C-046 | S-006,S-007,S-012,S-028 |
| P-02 Permission denial/approval bypass | every consequential shell action reaches final approval and alternate syntax cannot bypass denial | classifier omits redirection and single `&`; tests encode these as non-chaining, so safe-prefix inputs skip request before shell parsing | `FAIL` | static source plus pinned unit-test expectation; no exploit | C-020,C-021,C-022 | S-017,S-019,S-020,S-021,S-022 |
| P-03 Malformed/oversized input | missing/extra/wrong-type/oversized data fails before effects with stable errors | empty command/path/session and invalid JSON paths exist; no complete schema/oversize matrix or side-effect observation | `INCONCLUSIVE` | static source only | C-011,C-047 | S-014,S-015,S-021 |
| P-04 Cancellation/timeout | cancel before dispatch, during stream, and during side effect; fence late output and verify descendants stopped | source covers cancel marks, active contexts, terminal cancelled records, and Unix process-group signals; runtime cleanup/fencing unobserved | `INCONCLUSIVE` | static source only | C-028,C-029 | S-013,S-015,S-021,S-023,S-025 |
| P-05 Retry/duplication/partial failure | finite retry exposes every physical send, avoids duplicate non-idempotent effects, and attributes cost | provider/auth/server retries exist, but physical-send identity, tool idempotency, partial writes, and billing attribution are unqualified | `INCONCLUSIVE` | static source only | C-027,C-028,C-029,C-048 | S-013,S-014,S-015,S-025,S-026 |
| P-06 Concurrency/isolation collision | colliding sessions/workspaces/processes are fenced and clean without bleed | server dedup/locks and session mutexes are static facts; local mode lacks data-dir lock; two-process collision not run | `NOT_RUN_UNSAFE` | no disposable two-process database/worktree fixture | C-018,C-019 | S-013,S-015,S-024 |
| P-07 Crash/restart recovery | interruption between writes/migrations recovers without silent loss, replay, or corruption | WAL/migrations/debounce/flush inspected; no crash injected | `NOT_RUN_UNSAFE` | no disposable fault-injection database | C-016,C-017 | S-024,S-025 |
| P-08 Provider/model/network unavailable | DNS/auth/429/malformed/interrupted responses preserve cause, bound retries, and expose attempts without silent failover | explicit config errors and retry callbacks found; no provider/network mock or credentials used | `NOT_RUN_UNSAFE` | network/provider execution denied | C-012,C-013,C-048 | S-014,S-015 |
| P-09 Untrusted-content instruction injection | repository/tool/MCP text remains provenance-labelled data and cannot increase authority | prompt labels paths but instructs model to follow project/skill text; no authority-changing exploit run | `NOT_RUN_UNSAFE` | no exact sink sandbox/provider fixture | C-014,C-034,C-039 | S-015,S-029,S-030,S-031 |
| P-10 Filesystem boundary abuse | traversal/absolute/symlink/case paths are canonicalized and contained at use time | shell/write retain host authority and view uses lexical `Abs`/`Rel`; no disposable traversal/symlink probe run | `NOT_RUN_UNSAFE` | no qualified filesystem sandbox | C-020,C-022,C-034 | S-017,S-021,S-022 |
| P-11 Resource/token/cost disagreement | estimates, retries/cache, child calls, provider usage, and totals reconcile; missing data stays explicit | source distinguishes estimated usage and costs but can zero estimated cost and best-effort child propagation; no provider-bill comparison | `INCONCLUSIVE` | static source only | C-026,C-027 | S-014,S-015,S-026 |
| P-12 Install/update pin/rollback | exact signed artifact maps to source; failed update/migration preserves recoverable prior state | tag/release/checksums/bundle/workflow inspected; signer/rebuild/update failure/rollback not verified | `INCONCLUSIVE` | passive metadata; no install | C-002,C-030,C-031 | S-001,S-002,S-003,S-004,S-032,S-033 |
| P-13 Claimed absence/disabled feature | both metric-disable env paths prevent every production `event.Init` call despite alternate entrypoints | bounded search of production `event.Init` call sites and callers found all gated by `shouldEnableMetrics`, which checks config, `CRUSH_DISABLE_METRICS`, and `DO_NOT_TRACK` | `PASS` | bounded static universe: production Go files at pinned commit, excluding tests/generated Swagger | C-024 | S-007,S-028 |
| P-14 Evidence loss/forgery | denied/failed/cancelled actions retain correlated, redacted, non-spoofable durable evidence | source documents lossy and timeout-droppable brokers plus durable final message state; saturation, spoof, redaction, and recovery were not triggered | `NOT_RUN_UNSAFE` | no dynamic event-sink/tool sandbox | C-023,C-025,C-049 | S-015,S-025,S-027 |

- **Evidence:** S-001–S-004, S-006–S-007, S-013–S-031.
- **Boundary/scope:** `FAIL` means the explicit P-02 safe expectation is contradicted statically; `PASS` means only the bounded P-13 source expectation matched. Neither is a general security verdict.
- **Unknowns:** C-017, C-019, C-027, C-029, C-031, C-034, C-046–C-050; skipped probes are not passes.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "Official tag v0.91.0 peels from annotated tag object f224fd65ade105bd57929a493a6131e6df52e64e to commit 41cdd18a4b4f19c31c34301227da9341d62e9823, whose inspected checkout was clean with no submodule entries."
  classification: FACT
  confidence: HIGH
  scope: "charmbracelet/crush v0.91.0 local static checkout; excludes later refs"
  source_ids: [S-001]
  fact_dependencies: []
  method: "Compared remote URL, detached HEAD, exact tag, tag object, porcelain status, and submodule status."
  counterevidence: "none found in the pinned identity command set"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "The official v0.91.0 release was published on 2026-08-22 and records the listed SHA-256 digests for its source archive, checksum file, and checksum Sigstore bundle."
  classification: FACT
  confidence: HIGH
  scope: "GitHub release metadata and retained checksum/bundle assets; no binary execution or signer verification"
  source_ids: [S-002, S-003, S-004]
  fact_dependencies: []
  method: "Parsed exact-tag release JSON and rehashed the retained checksum and Sigstore files."
  counterevidence: "none found in retained official release metadata; independent build identity remains C-031"
  adversarial_status: CHALLENGED
- claim_id: C-003
  section: provenance-license
  statement: "At the pinned commit, LICENSE.md applies FSL-1.1-MIT competing-use, redistribution-notice, trademark, warranty, and per-version two-year MIT future-license terms."
  classification: FACT
  confidence: HIGH
  scope: "repository LICENSE.md at pinned commit; no legal interpretation for a proposed use"
  source_ids: [S-005]
  fact_dependencies: []
  method: "Read the complete license text and bounded git history for LICENSE/LICENCE.md paths."
  counterevidence: "main.go has conflicting stale MIT metadata recorded as C-004"
  adversarial_status: CHALLENGED
- claim_id: C-004
  section: provenance-license
  statement: "The pinned main.go Swagger annotation says MIT and links to a nonexistent LICENSE path, conflicting with the FSL-1.1-MIT LICENSE.md text."
  classification: FACT
  confidence: HIGH
  scope: "main.go metadata versus repository root license files at the pinned commit"
  source_ids: [S-005, S-006]
  fact_dependencies: []
  method: "Compared annotation name/URL with the root tree and governing license text."
  counterevidence: "GoReleaser metadata correctly says FSL-1.1-MIT"
  adversarial_status: CHALLENGED
- claim_id: C-005
  section: repository-package-map
  statement: "The pinned repository composes commands, app services, backend/server transport, agent loop, tools, policy, SQLite state, context extensions, and UI as internal Go packages around app.New."
  classification: FACT
  confidence: HIGH
  scope: "production source paths at the pinned commit; tests/generated files classified separately"
  source_ids: [S-007, S-012, S-013, S-014]
  fact_dependencies: []
  method: "Mapped imports, constructors, and local/server composition roots rather than inferring reachability from names alone."
  counterevidence: "optional paths depend on configuration and mode"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: executable-entrypoints
  statement: "Crush exposes interactive TUI, non-interactive run, and HTTP/SSE server entrypoints, with local or CRUSH_CLIENT_SERVER-selected workspace composition and Unix/npipe/TCP transports."
  classification: FACT
  confidence: HIGH
  scope: "Cobra production entrypoints and server router; static source"
  source_ids: [S-006, S-007, S-008, S-009, S-010, S-011]
  fact_dependencies: []
  method: "Traced Cobra registration through local/client setup, Bubble Tea/run paths, and server listener/router."
  counterevidence: "no stable public library/plugin entrypoint was qualified"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: control-data-flow
  statement: "A representative prompt flows through workspace acceptance, coordinator/session agent, SQLite messages, Fantasy provider streaming, tool callbacks, flush, and RunID-correlated terminal completion."
  classification: FACT
  confidence: HIGH
  scope: "top-level coder run in local/client-server source; provider internals excluded"
  source_ids: [S-008, S-012, S-013, S-014, S-015, S-025]
  fact_dependencies: []
  method: "Traced one prompt from CLI/backend entry through Run, Stream callbacks, message updates, and RunComplete."
  counterevidence: "intermediate broker events may drop and live execution was not observed"
  adversarial_status: CHALLENGED
- claim_id: C-008
  section: module-extension-boundaries
  statement: "Built-in extension seams are per-workspace MCP, skills, hooks, and LSP/config integration rather than a versioned unloadable Go plugin ABI."
  classification: FACT
  confidence: HIGH
  scope: "production extension discovery/registration paths; third-party extension contents excluded"
  source_ids: [S-014, S-018, S-031]
  fact_dependencies: []
  method: "Traced skill discovery/dedup, hook wrappers, MCP tool assembly, and per-workspace managers."
  counterevidence: "MCP itself negotiates protocol capabilities, but that is not an in-process plugin ABI"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: agent-interface
  statement: "Coordinator and SessionAgent own model/tool selection, per-session dispatch/queue state, persistence callbacks, summarization, cancellation, and terminal completion."
  classification: FACT
  confidence: HIGH
  scope: "built-in coder/task agent source"
  source_ids: [S-014, S-015]
  fact_dependencies: []
  method: "Inspected interfaces, fields, constructors, Run, Summarize, Cancel, and completion paths."
  counterevidence: "embedding can select local versus server transport but does not remove agent authority"
  adversarial_status: SUPPORTED
- claim_id: C-010
  section: agent-interface
  statement: "The built-in parallel agent tool creates a child session, runs a subagent, returns its text as a tool result, and adds child cost to the parent best-effort."
  classification: FACT
  confidence: HIGH
  scope: "agent tool and child session source; runtime scheduling excluded"
  source_ids: [S-014, S-016, S-026]
  fact_dependencies: []
  method: "Traced agentTool through runSubAgent, CreateTaskSession, and updateParentSessionCost."
  counterevidence: "cost propagation failure only logs and does not discard output"
  adversarial_status: CHALLENGED
- claim_id: C-011
  section: tool-interface
  statement: "Crush tools use Fantasy declarations/callbacks, context-carried session identity, hook/permission gates, host side effects, response metadata, and transcript-visible results."
  classification: FACT
  confidence: HIGH
  scope: "built-in tool composition and representative bash/write paths"
  source_ids: [S-014, S-015, S-017, S-018, S-021]
  fact_dependencies: []
  method: "Inspected tool assembly, streaming callbacks, hook wrapper, permission request, and shell tool."
  counterevidence: "not every tool requests permission and custom/MCP tools may differ"
  adversarial_status: CHALLENGED
- claim_id: C-012
  section: provider-interface
  statement: "The coordinator adapts provider/model/auth/options into Fantasy language models while Fantasy/provider implementations own HTTP streaming and physical retry behavior."
  classification: FACT
  confidence: MEDIUM
  scope: "Crush-side provider adaptation only; dependency/provider internals and live service excluded"
  source_ids: [S-014, S-015]
  fact_dependencies: []
  method: "Inspected provider construction, option merging, Stream invocation, OnRetry, and auth-refresh callback."
  counterevidence: "physical sends and provider-specific retries are not allocated by Crush"
  adversarial_status: CHALLENGED
- claim_id: C-013
  section: model-interface
  statement: "A Crush model combines Fantasy, Catwalk capability/catalog metadata, selected configuration, and cost mode to drive parameters, images, reasoning, limits, and streaming tools."
  classification: FACT
  confidence: HIGH
  scope: "static model configuration/adaptation; catalog accuracy excluded"
  source_ids: [S-014, S-015]
  fact_dependencies: []
  method: "Read Model fields, option merging, model build/update, and Stream call."
  counterevidence: "live provider capability negotiation was not observed"
  adversarial_status: SUPPORTED
- claim_id: C-014
  section: context-interface
  statement: "The system context promotes embedded policy plus configured context files, skill metadata, workspace/Git facts, history, and connected MCP instructions into model-visible prompt content."
  classification: FACT
  confidence: HIGH
  scope: "default coder prompt and run preparation; user configuration can alter inputs"
  source_ids: [S-015, S-029, S-030, S-031]
  fact_dependencies: []
  method: "Traced promptData/template fields, skill XML, MCP instruction append, and PrepareStep history."
  counterevidence: "path/XML labels preserve textual origin but not non-authority"
  adversarial_status: CHALLENGED
- claim_id: C-015
  section: context-interface
  statement: "Automatic compaction performs a separate model summary call, stores a summary message and usage, and makes future effective history begin at that summary."
  classification: FACT
  confidence: HIGH
  scope: "sessionAgent auto-summary and Summarize source"
  source_ids: [S-015, S-030]
  fact_dependencies: []
  method: "Traced context threshold, summary stream, SummaryMessageID save, and getSessionMessages slicing."
  counterevidence: "full older messages remain in SQLite but are omitted from effective history"
  adversarial_status: SUPPORTED
- claim_id: C-016
  section: state-persistence-restart
  statement: "Crush persists sessions/messages in migrated SQLite/WAL, coalesces ordinary deltas for 33 ms, synchronously flushes structural/terminal updates and explicit boundaries, and applies a data-directory lock in server but not default local mode."
  classification: FACT
  confidence: HIGH
  scope: "db/message/session services at pinned commit; crash behavior excluded"
  source_ids: [S-007, S-013, S-024, S-025, S-026]
  fact_dependencies: []
  method: "Inspected pragmas/migrations, schema-facing services, debounce, terminal detection, FlushAll, and deletion transaction."
  counterevidence: "estimated-usage marker is memory-only and local mode omits data-dir lock"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: state-persistence-restart
  statement: "Crash-time loss, torn-write/WAL recovery, migration rollback, and corruption handling are not established for v0.91.0."
  classification: UNKNOWN
  confidence: N/A
  scope: "SQLite/message state under interruption; disposable data only"
  source_ids: [S-024, S-025]
  fact_dependencies: []
  method: "attempted_methods=static inspection of pragmas, migration-on-open, debounce and flush paths; blocker=no authorized disposable fault-injection runtime and target execution prohibited; impact=durability/restart comparison remains partial; available_evidence=S-024,S-025; next_probe=interrupt a sandboxed process at each message/migration transition and reopen against copied state"
  counterevidence: "graceful shutdown flush does not establish crash recovery"
  adversarial_status: CHALLENGED
- claim_id: C-018
  section: concurrency-worktree-isolation
  statement: "Server workspaces deduplicate by resolved path, session dispatch is mutex-serialized, SQLite uses one connection, and per-workspace skill state avoids global mirroring."
  classification: FACT
  confidence: HIGH
  scope: "server/backend/session/DB/skills source; default local process caveat included"
  source_ids: [S-013, S-015, S-024, S-031]
  fact_dependencies: []
  method: "Inspected resolved path index, locking order, dispatch mutexes, DB pool limits, and manager options."
  counterevidence: "different sessions/tools may run concurrently and local mode omits data-dir lock"
  adversarial_status: CHALLENGED
- claim_id: C-019
  section: concurrency-worktree-isolation
  statement: "Two-process local-mode collision, cross-workspace state bleed, race ordering, and cleanup under induced contention are not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "two local/server processes, colliding paths/session IDs, disposable workspace/database"
  source_ids: [S-013, S-015, S-024]
  fact_dependencies: []
  method: "attempted_methods=static lock/index/queue inspection and comparison of local versus server Connect calls; blocker=no disposable multi-process target runtime; impact=concurrency and isolation qualification remains incomplete; available_evidence=S-013,S-015,S-024; next_probe=run two least-privilege instances against colliding copied data/worktrees and inspect DB/events/process cleanup"
  counterevidence: "server lock/dedup mechanisms do not cover default local processes"
  adversarial_status: CHALLENGED
- claim_id: C-020
  section: permissions-authority-sandbox
  statement: "Permissions are bypassable by skip, allowlist, auto-approved session, persistent grant, hook approval, and selected safe-command paths before host side effects."
  classification: FACT
  confidence: HIGH
  scope: "built-in permission/hook/bash paths; external OS policy excluded"
  source_ids: [S-017, S-018, S-021, S-022]
  fact_dependencies: []
  method: "Traced Request decision order, hook wrapper, local non-interactive auto-approval, and shell invocation."
  counterevidence: "ordinary consequential tools can prompt and deny when no bypass applies"
  adversarial_status: CHALLENGED
- claim_id: C-021
  section: permissions-authority-sandbox
  statement: "The safe-shell classifier excludes redirects and single ampersands from chaining, causing safe-prefix forms with those operators to skip permission before shell parsing."
  classification: FACT
  confidence: HIGH
  scope: "safe.go, its pinned test expectations, and NewBashTool static path"
  source_ids: [S-019, S-020, S-021]
  fact_dependencies: []
  method: "Compared metacharacter list and prefix check with explicit test cases and the permission conditional; no command executed."
  counterevidence: "block functions still reject a bounded list of commands after parsing but do not remove redirection or all second-command effects"
  adversarial_status: CHALLENGED
- claim_id: C-022
  section: permissions-authority-sandbox
  statement: "Crush's approval and process-isolation mechanisms do not constitute filesystem, network, credential, or OS-user sandbox containment."
  classification: INFERENCE
  confidence: HIGH
  scope: "built-in host execution; excludes external containers/VMs/MAC policy"
  source_ids: [S-017, S-021, S-022, S-023]
  fact_dependencies: [C-020, C-021]
  method: "Reasoning=permissions decide policy while Shell inherits environment and executes host paths; Setsid/process-group kill changes terminal/signal behavior only; assumptions=ordinary OS user authority and no external sandbox; alternative=an operator may independently launch Crush inside a container, but that is outside this mechanism."
  counterevidence: "process groups improve cancellation and terminal integrity"
  adversarial_status: CHALLENGED
- claim_id: C-023
  section: evidence-observability
  statement: "SQLite messages/sessions, logs, pubsub/SSE lifecycle events, and RunID/message/tool/session identifiers provide local observable state and correlation."
  classification: FACT
  confidence: HIGH
  scope: "local application evidence surfaces; provider-side traces excluded"
  source_ids: [S-015, S-025, S-027]
  fact_dependencies: []
  method: "Traced persisted fields, event payloads, IDs, and flush-before-completion."
  counterevidence: "brokers are not durable and local files are user-mutable"
  adversarial_status: CHALLENGED
- claim_id: C-024
  section: evidence-observability
  statement: "Optional PostHog telemetry targets data.charm.land and is disabled by config, CRUSH_DISABLE_METRICS, or DO_NOT_TRACK, while update checking is separate."
  classification: FACT
  confidence: HIGH
  scope: "production telemetry initialization/update source; no network observation"
  source_ids: [S-007, S-012, S-028]
  fact_dependencies: []
  method: "Inspected all production event.Init call sites, shouldEnableMetrics, event endpoint/properties, and app update goroutine."
  counterevidence: "disable-metrics does not disable update checks or provider/MCP network"
  adversarial_status: CHALLENGED
- claim_id: C-025
  section: evidence-observability
  statement: "Pubsub uses 4,096-entry subscriber buffers; intermediate delivery is lossy and terminal delivery may still drop after a 50 ms bounded wait."
  classification: FACT
  confidence: HIGH
  scope: "in-process Broker implementation"
  source_ids: [S-027]
  fact_dependencies: []
  method: "Read buffer constants and Publish/PublishMustDeliver branches and counters."
  counterevidence: "terminal message state is usually persisted before completion publication"
  adversarial_status: CHALLENGED
- claim_id: C-026
  section: resource-token-cost-accounting
  statement: "Session accounting uses provider or fallback usage, Catwalk rates/OpenRouter override, flat-rate handling, and best-effort child-cost propagation."
  classification: FACT
  confidence: HIGH
  scope: "local session totals; provider invoice accuracy excluded"
  source_ids: [S-014, S-015, S-026]
  fact_dependencies: []
  method: "Inspected fallbackStepUsage call, updateSessionUsage, title/summary cost, Session fields, and parent cost update."
  counterevidence: "estimated usage assigns zero monetary cost and EstimatedUsage is memory-only"
  adversarial_status: CHALLENGED
- claim_id: C-027
  section: resource-token-cost-accounting
  statement: "Per-physical-call, retry/cache, child-propagation-failure, missing-usage, and provider-billing reconciliation are not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "all provider calls caused by a logical turn, including title, summary, retry, and subagent"
  source_ids: [S-014, S-015, S-026]
  fact_dependencies: []
  method: "attempted_methods=static trace of RunID, OnRetry, usage fallback, title/summary and parent cost paths; blocker=no live/mock provider billing fixture and Fantasy physical dispatch is outside inspected source; impact=complete provider-call visibility and budget enforcement cannot be compared as observed; available_evidence=S-014,S-015,S-026; next_probe=instrument a deterministic fake provider to enumerate every request/usage/cache/retry and reconcile persisted totals"
  counterevidence: "logical session totals do not identify physical attempts"
  adversarial_status: CHALLENGED
- claim_id: C-028
  section: failure-cancellation-retry
  statement: "Source implements per-session cancel/queue serialization, cancelled records/completions, auth/server retries, detached cleanup writes, and process-group shutdown."
  classification: FACT
  confidence: HIGH
  scope: "static agent/backend/Unix shell paths; live cleanup excluded"
  source_ids: [S-013, S-014, S-015, S-023, S-025]
  fact_dependencies: []
  method: "Traced accepted-run marks, queue drain, stream error defer, retry callbacks, workspace shutdown, and Unix signal handling."
  counterevidence: "CancelAll and cleanup have finite timeouts and physical retries lack attempt IDs"
  adversarial_status: CHALLENGED
- claim_id: C-029
  section: failure-cancellation-retry
  statement: "Cancellation races, verified descendant termination, late-result fencing, duplicate effects, and partial-write outcomes are not dynamically established."
  classification: UNKNOWN
  confidence: N/A
  scope: "pre-dispatch, provider stream, tool side effect, background process, and shutdown races"
  source_ids: [S-013, S-015, S-021, S-023, S-025]
  fact_dependencies: []
  method: "attempted_methods=static trace of cancel marks, contexts, process groups, background manager, message cleanup and flush; blocker=no disposable process-tree/provider/filesystem fault fixture and target execution prohibited; impact=attempt/cancellation and duplicate-effect guarantees remain unqualified; available_evidence=S-013,S-015,S-021,S-023,S-025; next_probe=run deterministic blocking provider/tool/child-process fixtures and cancel at each handoff while checking PIDs, DB and late events"
  counterevidence: "source comments/mechanisms are not runtime proof"
  adversarial_status: CHALLENGED
- claim_id: C-030
  section: install-update-release
  statement: "Tag-triggered release configuration builds multi-platform artifacts, checksums, source/SBOMs, and a cosign checksum bundle, matching the v0.91.0 release asset classes."
  classification: FACT
  confidence: HIGH
  scope: "pinned workflow/GoReleaser configuration and official release metadata"
  source_ids: [S-002, S-032, S-033]
  fact_dependencies: []
  method: "Compared release assets with workflow trigger and GoReleaser build/checksum/sign/source/SBOM declarations."
  counterevidence: "reusable release workflow is referenced at mutable @main"
  adversarial_status: CHALLENGED
- claim_id: C-031
  section: install-update-release
  statement: "Signer identity/policy, reproducible binary-to-source mapping, failed update recovery, migration downgrade, and rollback are not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "v0.91.0 tag/source/checksum/bundle and update/migration lifecycle"
  source_ids: [S-002, S-003, S-004, S-032, S-033]
  fact_dependencies: []
  method: "attempted_methods=release metadata/hash/config inspection and annotated-tag inspection; blocker=no independent signature policy verification, artifact rebuild, install/update execution, or downgrade fixture; impact=source identity, update, and rollback qualification remains partial; available_evidence=S-002,S-003,S-004,S-032,S-033; next_probe=verify Sigstore/tag identities, rebuild exact source in hermetic builders, compare binaries, then inject failed update/migration and roll back copied state"
  counterevidence: "published digests/signature bundle establish metadata presence, not reproduction or rollback"
  adversarial_status: CHALLENGED
- claim_id: C-032
  section: tests-qualification
  statement: "The pinned tree has 215 Go test files in 52 directories and CI declares race build/test on Ubuntu, macOS, and Windows."
  classification: FACT
  confidence: HIGH
  scope: "static file inventory and build workflow; no test execution/result claim"
  source_ids: [S-020, S-034]
  fact_dependencies: []
  method: "Counted *_test.go files/directories and read pinned CI commands/matrix."
  counterevidence: "this dossier did not run tests or inspect a release-specific CI attestation"
  adversarial_status: SUPPORTED
- claim_id: C-033
  section: security
  statement: "User-selected TCP serves the full HTTP/SSE router without authentication middleware, and CRUSH_PROFILE starts unauthenticated pprof on localhost:6060."
  classification: FACT
  confidence: HIGH
  scope: "production server/main source; external firewall/OS ACLs excluded"
  source_ids: [S-006, S-010, S-011]
  fact_dependencies: []
  method: "Inspected listener schemes, complete router handler chain, client_id validation, and pprof startup; searched server production files for auth middleware."
  counterevidence: "default Unix socket/named pipe reduces exposure; UUID client_id is lifecycle identity but not a secret"
  adversarial_status: CHALLENGED
- claim_id: C-034
  section: security
  statement: "Dynamic filesystem escape, instruction-injection effects, credential reachability, and exact TCP exploitability are not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "disposable workspace/symlink/provider/tool/server fixtures only"
  source_ids: [S-021, S-022, S-029, S-030]
  fact_dependencies: []
  method: "attempted_methods=static path/prompt/shell/server trust-boundary inspection; blocker=no qualified disposable sandbox, fake provider, or isolated TCP network and exploitation not authorized; impact=security consequence/severity remains scenario-dependent; available_evidence=S-021,S-022,S-029,S-030; next_probe=use a no-secret VM with exact path/symlink/case fixtures, fake model outputs, denied network, and authenticated observer to test final sinks"
  counterevidence: "static authority paths show exposure but not exploit success in every environment"
  adversarial_status: CHALLENGED
- claim_id: C-035
  section: strengths
  statement: "Crush exposes unusually explicit logical-run lifecycle seams through accepted/queued/active states, RunID completion, flush ordering, workspace contexts, and shutdown."
  classification: INFERENCE
  confidence: HIGH
  scope: "source inspectability and logical lifecycle, not runtime reliability"
  source_ids: [S-008, S-013, S-014, S-015, S-025, S-027]
  fact_dependencies: [C-007, C-009, C-023, C-025, C-028]
  method: "Reasoning=independent named structures make handoffs and cleanup reviewable; assumptions=source paths are reachable as traced; alternative=complexity may still obscure provider/tool internals and terminal events can drop."
  counterevidence: "physical provider attempts and durable completion are not explicit"
  adversarial_status: CHALLENGED
- claim_id: C-036
  section: strengths
  statement: "Migrated SQLite plus explicit message flush and summary/child-session links provide inspectable local transcript durability beyond an in-memory loop."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "graceful local transcript operation; excludes crash-proof canonical facts"
  source_ids: [S-015, S-024, S-025]
  fact_dependencies: [C-010, C-015, C-016]
  method: "Reasoning=durable rows and boundary flushes support resume/inspection; assumptions=graceful writes succeed; alternative=crash/corruption can lose or damage unflushed state."
  counterevidence: "C-017 remains unknown and SQLite rows are mutable projections"
  adversarial_status: CHALLENGED
- claim_id: C-037
  section: liabilities
  statement: "Using the default Crush runtime as a subordinate substrate retains competing loop, retry, approval, persistence, completion, and cleanup authority."
  classification: INFERENCE
  confidence: HIGH
  scope: "default local/server application composition; excludes a future narrow extracted adapter"
  source_ids: [S-012, S-013, S-014, S-015]
  fact_dependencies: [C-005, C-007, C-009, C-012, C-016]
  method: "Reasoning=the same App/Coordinator owns all listed decisions in both modes; assumptions=substrate uses these paths; alternative=a separately reviewed narrow protocol could bypass most runtime authority."
  counterevidence: "client/server separates process location but not authority ownership"
  adversarial_status: CHALLENGED
- claim_id: C-038
  section: liabilities
  statement: "Relying on Crush policy gates as confinement leaves ambient host and unauthenticated-server authority, amplified by the safe-classifier bypass."
  classification: INFERENCE
  confidence: HIGH
  scope: "built-in policy/server/execution without external sandbox/authentication"
  source_ids: [S-006, S-010, S-017, S-019, S-020, S-021, S-022]
  fact_dependencies: [C-020, C-021, C-033]
  method: "Reasoning=policy bypasses and host execution remain outside OS containment, while TCP lacks actor authentication; assumptions=no external control; alternative=external sandbox/firewall can reduce exposure but is not Crush enforcement."
  counterevidence: "default socket transport and permission prompts reduce ordinary accidental exposure"
  adversarial_status: CHALLENGED
- claim_id: C-039
  section: liabilities
  statement: "Promoting project, skill, and MCP text into instruction-bearing system context creates an authority-contamination risk without typed provenance enforcement."
  classification: INFERENCE
  confidence: HIGH
  scope: "default context composition and consequential tool authority"
  source_ids: [S-015, S-029, S-030, S-031]
  fact_dependencies: [C-014, C-020]
  method: "Reasoning=system text commands obedience to content whose origin may be repository/extension controlled; assumptions=model behavior is influenced by prompt; alternative=model may ignore a malicious instruction, but no enforcement guarantees that."
  counterevidence: "XML/path labels and escaping preserve some textual provenance"
  adversarial_status: CHALLENGED
- claim_id: C-040
  section: transferable-patterns
  statement: "RunID-correlated flush-before-terminal completion is a conditional pattern for disambiguating queued logical calls, provided delivery and attempts become durable."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "clean-room lifecycle pattern, not current broker adoption"
  source_ids: [S-008, S-014, S-015, S-025, S-027]
  fact_dependencies: [C-007, C-023, C-025, C-028]
  method: "Reasoning=caller-minted correlation plus final payload prevents same-session completion confusion; assumptions=durable outbox/query reconciliation added; alternative=without durability the 50ms drop path can still hang/lose evidence."
  counterevidence: "current physical attempts lack IDs and must-deliver can drop"
  adversarial_status: CHALLENGED
- claim_id: C-041
  section: transferable-patterns
  statement: "Debouncing replaceable deltas while synchronously flushing structural/terminal state is a conditional projection-optimization pattern."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "clean-room projection writes; canonical facts require separate authority"
  source_ids: [S-015, S-025]
  fact_dependencies: [C-016, C-023]
  method: "Reasoning=coalescing reduces write load while explicit structural boundaries retain important state; assumptions=canonical events and crash reconciliation exist elsewhere; alternative=debounce alone loses state on crash."
  counterevidence: "C-017 is unqualified"
  adversarial_status: CHALLENGED
- claim_id: C-042
  section: transferable-patterns
  statement: "Per-workspace managers with no server-side global mirror are a candidate pattern for preventing extension-state cross-talk."
  classification: INFERENCE
  confidence: HIGH
  scope: "clean-room manager/lifecycle pattern"
  source_ids: [S-013, S-031]
  fact_dependencies: [C-005, C-008, C-018]
  method: "Reasoning=state and broker are explicitly scoped to workspace and the global mirror is limited to single-workspace mode; assumptions=all consumers receive the manager; alternative=other package globals could still create unrelated cross-talk."
  counterevidence: "no dynamic state-bleed probe was run"
  adversarial_status: CHALLENGED
- claim_id: C-043
  section: rejected-patterns-curiosity-no-go
  statement: "The safe-command prefix classifier is unsuitable as an authorization boundary because it decides before complete shell resource/effect parsing."
  classification: INFERENCE
  confidence: HIGH
  scope: "classifier mechanism only, not rejection of all shell tooling"
  source_ids: [S-017, S-019, S-020, S-021, S-022]
  fact_dependencies: [C-020, C-021]
  method: "Reasoning=explicit redirect/single-& cases bypass approval and blocklists cannot enumerate effects; assumptions=shell parser executes accepted syntax; alternative=a complete parser plus sink checks could form a different qualified design."
  counterevidence: "some chaining forms and banned commands are detected"
  adversarial_status: CHALLENGED
- claim_id: C-044
  section: rejected-patterns-curiosity-no-go
  statement: "The unauthenticated full-authority TCP server is unsuitable as a thin local adapter boundary."
  classification: INFERENCE
  confidence: HIGH
  scope: "v0.91.0 TCP router; default Unix/npipe transport separately scoped"
  source_ids: [S-010, S-011]
  fact_dependencies: [C-006, C-033]
  method: "Reasoning=transport exposes broad second authority without actor authentication; assumptions=peer can reach bind address; alternative=an authenticated reduced API could be separately evaluated."
  counterevidence: "TCP requires explicit selection"
  adversarial_status: CHALLENGED
- claim_id: C-045
  section: rejected-patterns-curiosity-no-go
  statement: "Provider enumeration, popularity, screenshots, broad history, and post-cutoff HEAD have nonpositive marginal value for the pinned architecture decision."
  classification: INFERENCE
  confidence: HIGH
  scope: "this dossier's bounded curiosity budget"
  source_ids: [S-001, S-002, S-014, S-030]
  fact_dependencies: [C-001, C-005, C-012]
  method: "Reasoning=these threads cannot change current authority/license/containment gates and would add drift/cost; assumptions=no downstream named gap; alternative=a later decision-specific provider/legal/UI question may reopen one thread."
  counterevidence: "ecosystem/popularity information may be useful for other decisions"
  adversarial_status: NOT_APPLICABLE:curiosity-triage
- claim_id: C-046
  section: executable-entrypoints
  statement: "Actual startup/no-op filesystem, network, process, telemetry, and credential-read effects under denied capabilities are not observed."
  classification: UNKNOWN
  confidence: N/A
  scope: "all CLI modes in empty HOME/workspace with denied network/writes"
  source_ids: [S-006, S-007, S-012, S-028]
  fact_dependencies: []
  method: "attempted_methods=static startup trace of main/root/app/telemetry; blocker=no disposable denied-write/network runtime and target execution prohibited; impact=startup side-effect and privacy qualification remains incomplete; available_evidence=S-006,S-007,S-012,S-028; next_probe=run help/no-op/TUI/run/server in a no-secret VM with empty HOME, read-only workspace, syscall/file/network/process tracing"
  counterevidence: "source declares multiple startup effects but does not reveal environment-dependent observations"
  adversarial_status: CHALLENGED
- claim_id: C-047
  section: tool-interface
  statement: "Complete missing/extra/wrong-type/oversized validation and pre-side-effect behavior across tool/provider/context/HTTP boundaries are not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "built-in tool schemas, attachments/context files, HTTP JSON, provider responses"
  source_ids: [S-014, S-015, S-021]
  fact_dependencies: []
  method: "attempted_methods=static inspection of explicit empty-field checks, invalid tool JSON sanitization, and representative structs; blocker=no generated boundary matrix/fuzz execution and target runtime prohibited; impact=input validation/resource-exhaustion comparison remains partial; available_evidence=S-014,S-015,S-021; next_probe=fuzz every decoded schema with missing/extra/wrong/oversized values against fake sinks that assert no side effect"
  counterevidence: "representative validation exists but does not establish complete coverage"
  adversarial_status: CHALLENGED
- claim_id: C-048
  section: provider-interface
  statement: "Rate-limit, auth, DNS, malformed response, interrupted stream, fallback, and retry preservation behavior are not observed with a provider fixture."
  classification: UNKNOWN
  confidence: N/A
  scope: "normal, title, summary, and subagent provider calls"
  source_ids: [S-014, S-015]
  fact_dependencies: []
  method: "attempted_methods=static provider/error/retry/auth-refresh trace; blocker=no credentials or deterministic fake Fantasy provider fixture and network execution denied; impact=provider failure, retry, completion, and accounting comparison remains incomplete; available_evidence=S-014,S-015; next_probe=inject deterministic 401/429/5xx/DNS/malformed/interrupted streams and record attempts, DB, RunComplete, fallback and usage"
  counterevidence: "source callbacks document intended retry/error handling but are not runtime outcomes"
  adversarial_status: CHALLENGED
- claim_id: C-049
  section: evidence-observability
  statement: "Runtime saturation loss, terminal-event recovery, redaction completeness, duplicate evidence, and spoof resistance are not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "pubsub/SSE/log/SQLite evidence under slow/malicious subscribers and untrusted payloads"
  source_ids: [S-015, S-025, S-027]
  fact_dependencies: []
  method: "attempted_methods=static broker/drop-counter, flush and payload trace; blocker=no isolated saturation/spoof fixture and target execution prohibited; impact=evidence completeness and tamper-resistance comparison remains partial; available_evidence=S-015,S-025,S-027; next_probe=saturate each subscriber, inject colliding IDs/secret-like payloads, trigger deny/error/cancel, and reconcile SSE/log/SQLite/drop counters"
  counterevidence: "SQLite final state can support re-fetch but no durable event outbox is present"
  adversarial_status: CHALLENGED
- claim_id: C-050
  section: provenance-license
  statement: "The complete transitive dependency and SBOM license/notice obligations for v0.91.0 are not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "all source/build/runtime dependencies and released SBOM components"
  source_ids: [S-005, S-033]
  fact_dependencies: []
  method: "attempted_methods=repository license and GoReleaser license/SBOM configuration inspection; blocker=released SBOM was not fully parsed and no authorized legal/license audit was performed; impact=redistribution/fork obligations remain incomplete; available_evidence=S-005,S-033; next_probe=retrieve exact source and binary SBOMs, generate a locked dependency inventory, and obtain authorized license review"
  counterevidence: "project-level license label does not aggregate dependency terms"
  adversarial_status: NOT_PROBED
```

## 27. Source ledger {#source-ledger}

### Adaptive bibliography rationale

- **Identity/release/license (S-001–S-006):** retained because immutable identity, exact official release artifacts, and governing license can independently block fork/substrate options; preferred over README/marketing.
- **Composition/transport (S-007–S-013):** retained because they are reachable command/composition roots and expose lifecycle/authority, preferred over package names or generated Swagger.
- **Agent/policy/execution (S-014–S-023):** retained because they trace prompt→provider→tool→host and include the adversarial classifier test; preferred over tool descriptions.
- **State/evidence/context (S-024–S-031):** retained because they define persistence, delivery, telemetry, and prompt trust semantics; preferred over UI screenshots.
- **Release/qualification (S-032–S-034):** retained because they define build/sign/test intent and static inventory; they are not treated as runtime or release attestation.

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Pinned repository identity and checkout state"
  url: "https://github.com/charmbracelet/crush/tree/41cdd18a4b4f19c31c34301227da9341d62e9823"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-identity"
  symbol: "refs/tags/v0.91.0"
  line_anchor: "N/A:git-object"
  command: "git remote -v && git rev-parse HEAD && git describe --tags --exact-match HEAD && git status --porcelain=v1 && git submodule status && git show-ref --tags -d | grep 'refs/tags/v0.91.0' && git cat-file -p refs/tags/v0.91.0"
  command_environment: "macOS arm64; git; detached partial clone; no target execution; network not required"
  output_or_hash: "inline:redacted origin=https://github.com/charmbracelet/crush.git; HEAD=41cdd18a4b4f19c31c34301227da9341d62e9823; exact_tag=v0.91.0; porcelain=<empty>; submodules=<empty>; tag_object=f224fd65ade105bd57929a493a6131e6df52e64e; peeled=41cdd18a4b4f19c31c34301227da9341d62e9823"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-045]
  notes: "Primary identity source; annotated tag contains an SSH signature, but signer identity was not verified."
- source_id: S-002
  source_kind: release-metadata
  title: "GitHub release v0.91.0 metadata"
  url: "https://api.github.com/repos/charmbracelet/crush/releases/tags/v0.91.0"
  commit_or_ref: "v0.91.0"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "github-release/charmbracelet-crush@v0.91.0"
  code_path: "N/A:no-code-path"
  symbol: "release.tag_name=v0.91.0"
  line_anchor: "JSON pointers /tag_name,/published_at,/assets"
  command: "python3 -c 'import json; d=json.load(open(\"../release.json\")); print(d[\"tag_name\"],d[\"published_at\"],[(a[\"name\"],a.get(\"digest\")) for a in d[\"assets\"]])' && shasum -a 256 ../release.json"
  command_environment: "macOS arm64; Python 3; retained passive GitHub API response; no target execution"
  output_or_hash: "sha256:9dddd92d7e71ebfc9a1b45ca68aa933b30ae236a10a1e16c0e380442b5bd811b"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-030, C-031, C-045]
  notes: "Selected as official exact-tag release origin; parsed result says published_at=2026-08-22T20:56:04Z, draft=false, prerelease=false and records asset SHA-256 digests. Retained artifact is held in the approved temporary research directory."
- source_id: S-003
  source_kind: release-metadata
  title: "Official v0.91.0 checksums.txt"
  url: "https://github.com/charmbracelet/crush/releases/download/v0.91.0/checksums.txt"
  commit_or_ref: "v0.91.0"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "github-release/charmbracelet-crush@v0.91.0/checksums.txt+sha256:88e9db7783757b2adf39609921dd3817d431777777b85bf8dc0bb0d386404870"
  code_path: "N/A:no-code-path"
  symbol: "crush-0.91.0.tar.gz checksum"
  line_anchor: "N/A:line-oriented-checksum-asset"
  command: "shasum -a 256 ../checksums.txt && grep 'crush-0.91.0.tar.gz' ../checksums.txt"
  command_environment: "macOS arm64; retained official asset; no executable"
  output_or_hash: "sha256:88e9db7783757b2adf39609921dd3817d431777777b85bf8dc0bb0d386404870"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-031]
  notes: "Exact output includes source archive a843c96fe268e4d6f1e8bd670e93b327915a986eefd2e310aa6a4aa4105197a1; retained artifact held in approved temporary research directory."
- source_id: S-004
  source_kind: release-metadata
  title: "Official v0.91.0 checksum Sigstore bundle"
  url: "https://github.com/charmbracelet/crush/releases/download/v0.91.0/checksums.txt.sigstore.json"
  commit_or_ref: "v0.91.0"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "github-release/charmbracelet-crush@v0.91.0/checksums.txt.sigstore.json+sha256:6cfded0496dde15e881bf9a40afc882fd6679673fe647fe75b1ccd9f081463cf"
  code_path: "N/A:no-code-path"
  symbol: "application/vnd.dev.sigstore.bundle.v0.3+json"
  line_anchor: "JSON pointers /mediaType,/verificationMaterial,/messageSignature"
  command: "shasum -a 256 ../checksums.txt.sigstore.json && python3 -c 'import json; d=json.load(open(\"../checksums.txt.sigstore.json\")); print(d[\"mediaType\"], sorted(d[\"verificationMaterial\"]), sorted(d[\"messageSignature\"]))'"
  command_environment: "macOS arm64; retained official JSON; no cryptographic verification performed"
  output_or_hash: "sha256:6cfded0496dde15e881bf9a40afc882fd6679673fe647fe75b1ccd9f081463cf"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-031]
  notes: "Selected for signature-material presence; not independent signer or policy verification."
- source_id: S-005
  source_kind: license
  title: "FSL-1.1-MIT governing license and bounded history"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/LICENSE.md#L1-L134"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE.md"
  symbol: "Functional Source License Version 1.1 MIT Future License"
  line_anchor: "L1-L134"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:LICENSE.md | nl -ba && git log --format='%H %ad %s' --date=iso-strict --all -- LICENSE LICENSE.md && shasum -a 256 LICENSE.md"
  command_environment: "macOS arm64; git/static text; no target execution"
  output_or_hash: "sha256:3faa5d4f3a51f07e4963b993f27af4b9344d7c509fa20aa856dd878788ba5f18"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-004, C-050]
  notes: "Preferred over package/Swagger label because this is governing text; history command produced transition commits cited in Section 2."
- source_id: S-006
  source_kind: repository-file
  title: "Executable main and pprof/license annotations"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/main.go#L1-L35"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "main.go"
  symbol: "main"
  line_anchor: "L1-L35"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:main.go | nl -ba | sed -n '1,80p' && shasum -a 256 main.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:d663aec20bcfdf656edf417a515cc4faf4fa8d85796590a5c8449b462ab00c98"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-006, C-033, C-038, C-046]
  notes: "Primary entrypoint source; importing net/http/pprof registers handlers on the default mux."
- source_id: S-007
  source_kind: repository-file
  title: "Root command and local/client workspace composition"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/cmd/root.go#L54-L401"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/cmd/root.go"
  symbol: "rootCmd; setupWorkspace; setupLocalWorkspace; shouldEnableMetrics"
  line_anchor: "L54-L153,L294-L401,L966-L977"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/cmd/root.go | nl -ba | sed -n '54,401p;950,994p' && shasum -a 256 internal/cmd/root.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:2a7240c436337d3235002588bf18e5858be24794252531598201ed7943e7f538"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-006, C-016, C-024, C-046]
  notes: "Selected as default composition root; proves local db.Connect omits WithDataDirLock."
- source_id: S-008
  source_kind: repository-file
  title: "Non-interactive run and RunID event stream"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/cmd/run.go#L31-L340"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/cmd/run.go"
  symbol: "runCmd; runNonInteractive; runStream"
  line_anchor: "L31-L340"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/cmd/run.go | nl -ba | sed -n '31,340p' && shasum -a 256 internal/cmd/run.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:6c3674f1dbc567b525495b30b33d894aeb4c6a335aa4a99d75c402211962531a"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-007, C-035, C-040]
  notes: "Selected for caller-side terminal correlation and local/server branch."
- source_id: S-009
  source_kind: repository-file
  title: "Server Cobra entrypoint"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/cmd/server.go#L20-L98"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/cmd/server.go"
  symbol: "serverCmd"
  line_anchor: "L20-L98"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/cmd/server.go | nl -ba | sed -n '20,110p' && shasum -a 256 internal/cmd/server.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:674a11b3e698d4ca127b1cbe700cb998df65f62077bc6e8292056a88c7cfb6c1"
  access_date: "2026-08-24"
  supports_claims: [C-006]
  notes: "Selected for explicit TCP/Unix host option and five-second shutdown."
- source_id: S-010
  source_kind: repository-file
  title: "Server transports and full router"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/server/server.go#L22-L280"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/server/server.go"
  symbol: "DefaultHost; NewServer; installHandler"
  line_anchor: "L22-L280"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/server/server.go | nl -ba | sed -n '22,280p' && rg -n 'auth|middleware|Authorization' internal/server/*.go && shasum -a 256 internal/server/server.go"
  command_environment: "macOS arm64; static source search over production server files"
  output_or_hash: "sha256:c458dfae48ffdb8055eb248bdb1cd36e8db9b81b837495a36a58345ce73b591b"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-033, C-038, C-044]
  notes: "Router handler chain is recover(logging(mux)); bounded search found OAuth payload handlers but no server actor-auth middleware."
- source_id: S-011
  source_kind: repository-file
  title: "HTTP/SSE controller and client_id semantics"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/server/proto.go#L15-L337"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/server/proto.go"
  symbol: "requireClientID; handlePostWorkspaces; handleGetWorkspaceEvents"
  line_anchor: "L15-L337"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/server/proto.go | nl -ba | sed -n '15,337p' && shasum -a 256 internal/server/proto.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:28fd6863f2908724ea6d7a89ee09d30fac14ff4e00225dec6f2f634b6706aed6"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-033, C-044]
  notes: "Client UUID validation is retained as lifecycle evidence, not authentication."
- source_id: S-012
  source_kind: repository-file
  title: "Application composition, update check, and shutdown"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/app/app.go#L55-L188"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/app/app.go"
  symbol: "App; New; Shutdown; checkForUpdates"
  line_anchor: "L55-L188,L738-L810"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/app/app.go | nl -ba | sed -n '55,188p;738,810p' && shasum -a 256 internal/app/app.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:25f5608e7d40235b750c9408b562e6700d50d29fdd5c87022490ffc7ff1eb130"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-007, C-024, C-037, C-046]
  notes: "Selected as local composition/lifecycle origin."
- source_id: S-013
  source_kind: repository-file
  title: "Backend multi-workspace lifecycle and locking"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/backend/backend.go#L29-L460"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/backend/backend.go"
  symbol: "Backend; Workspace; Workspace.Shutdown; CreateWorkspace"
  line_anchor: "L29-L460"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/backend/backend.go | nl -ba | sed -n '29,460p' && shasum -a 256 internal/backend/backend.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:e415be028db81a114059cfd04c3c426e256cdb9d33fcb31f3ffff1ba94e694ea"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-007, C-016, C-018, C-019, C-028, C-029, C-035, C-037, C-042]
  notes: "Preferred over tests for production lock order, path dedup, workspace context, and shutdown."
- source_id: S-014
  source_kind: repository-file
  title: "Coordinator provider/tool/run and subagent composition"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/agent/coordinator.go#L88-L338"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/agent/coordinator.go"
  symbol: "Coordinator; coordinator.run; buildAgent; buildTools; runSubAgent"
  line_anchor: "L88-L338,L624-L759,L1400-L1500"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/agent/coordinator.go | nl -ba | sed -n '88,338p;624,759p;1400,1500p' && shasum -a 256 internal/agent/coordinator.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:b821b1cfd3290bedca295fce5a514e44f689d7b06c75428e78467f9cf42ace3a"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-007, C-008, C-009, C-010, C-011, C-012, C-013, C-026, C-027, C-028, C-035, C-037, C-040, C-045, C-047, C-048]
  notes: "Selected for coordinator-owned authority and provider boundary; exhaustive provider catalog intentionally not retained."
- source_id: S-015
  source_kind: repository-file
  title: "Session agent run, stream, compaction, accounting, and cancellation"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/agent/agent.go#L76-L2088"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/agent/agent.go"
  symbol: "SessionAgentCall; sessionAgent.Run; Summarize; preparePrompt; updateSessionUsage; Cancel; CancelAll"
  line_anchor: "L76-L223,L530-L1147,L1329-L1708,L1727-L2035"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/agent/agent.go | nl -ba | sed -n '76,223p;530,1147p;1329,1708p;1727,2035p' && shasum -a 256 internal/agent/agent.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:e1fa99f598b6f7c263c0622e814d288c1fc74a0b4577ec8f093159b9ad4f771f"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-009, C-011, C-012, C-013, C-014, C-015, C-018, C-019, C-023, C-026, C-027, C-028, C-029, C-035, C-036, C-037, C-039, C-040, C-041, C-047, C-048, C-049]
  notes: "Large primary source retained because it contains the authoritative run state machine; only cited ranges were inspected."
- source_id: S-016
  source_kind: repository-file
  title: "Parallel subagent tool"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/agent/agent_tool.go#L18-L68"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/agent/agent_tool.go"
  symbol: "agentTool"
  line_anchor: "L18-L68"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/agent/agent_tool.go | nl -ba | sed -n '18,80p' && shasum -a 256 internal/agent/agent_tool.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:97439828e787252484e3d9004fbcf2476607e55cb3cdd2b28e248ed4e5541900"
  access_date: "2026-08-24"
  supports_claims: [C-010]
  notes: "Selected to establish tool schema and parallel delegation entry."
- source_id: S-017
  source_kind: repository-file
  title: "Permission service decisions"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/permission/permission.go#L16-L310"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/permission/permission.go"
  symbol: "Service; permissionService.Request"
  line_anchor: "L16-L310"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/permission/permission.go | nl -ba | sed -n '16,310p' && shasum -a 256 internal/permission/permission.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:e7a34f650f81d9d5fbedb834170c20f688f3ee6f54f8b54aa2cbbc526c7ec6b0"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-020, C-022, C-038, C-043]
  notes: "Primary decision-order source; paths are grant keys, not containment roots."
- source_id: S-018
  source_kind: repository-file
  title: "PreToolUse hook wrapper"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/agent/hooked_tool.go#L16-L142"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/agent/hooked_tool.go"
  symbol: "hookedTool.Run"
  line_anchor: "L16-L142"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/agent/hooked_tool.go | nl -ba | sed -n '16,142p' && shasum -a 256 internal/agent/hooked_tool.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:c45e4fab2ea95c83dc61354104f27a03db980024e2db51c032c5843e0ecef881"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-011, C-020]
  notes: "Selected because hook errors proceed and explicit allow stamps permission context."
- source_id: S-019
  source_kind: repository-file
  title: "Safe-shell lexical classifier"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/agent/tools/safe.go#L9-L90"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/agent/tools/safe.go"
  symbol: "safeCommands; chainingMetacharacters; containsCommandChaining"
  line_anchor: "L9-L90"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/agent/tools/safe.go | nl -ba | sed -n '9,90p' && shasum -a 256 internal/agent/tools/safe.go"
  command_environment: "macOS arm64; static source; no shell payload executed"
  output_or_hash: "sha256:2aee8228bab1c4a5538a19205abe8e4dd34dfa5f9238662d15df0e8afda83c5e"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-038, C-043]
  notes: "Decision-critical source for P-02; preferred over documentation."
- source_id: S-020
  source_kind: repository-file
  title: "Safe-shell classifier adversarial test cases"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/agent/tools/safe_test.go#L9-L47"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/agent/tools/safe_test.go"
  symbol: "TestContainsCommandChaining"
  line_anchor: "L9-L47"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/agent/tools/safe_test.go | nl -ba | sed -n '9,47p' && shasum -a 256 internal/agent/tools/safe_test.go"
  command_environment: "macOS arm64; static test inspection; test not executed"
  output_or_hash: "sha256:a18cb38b6b214288fd03909191d86c9f7b41cb5704dbb16c35290b9ad0f82170"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-032, C-038, C-043]
  notes: "Tests are evidence of encoded expected classification only, not production runtime."
- source_id: S-021
  source_kind: repository-file
  title: "Bash tool permission and background execution"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/agent/tools/bash.go#L24-L387"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/agent/tools/bash.go"
  symbol: "NewBashTool"
  line_anchor: "L24-L387"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/agent/tools/bash.go | nl -ba | sed -n '24,387p' && shasum -a 256 internal/agent/tools/bash.go"
  command_environment: "macOS arm64; static source; no command executed"
  output_or_hash: "sha256:8d1b23f6604b5710119bbb7f81fdf21603cb70f92d09367c9900cece8e249617"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-020, C-021, C-022, C-029, C-034, C-038, C-043, C-047]
  notes: "Primary final-sink path for classifier/permission/background behavior."
- source_id: S-022
  source_kind: repository-file
  title: "Shell environment and interpreter"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/shell/shell.go#L28-L312"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/shell/shell.go"
  symbol: "Shell; NewShell; execCommon"
  line_anchor: "L28-L312"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/shell/shell.go | nl -ba | sed -n '28,312p' && shasum -a 256 internal/shell/shell.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:5a3d093174a3d9e9e5d91c366b64adc51f0ec25cca9c9b9d5e74447f9da33ec0"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-022, C-034, C-038, C-043]
  notes: "Shows inherited environment and POSIX interpreter; no containment primitive."
- source_id: S-023
  source_kind: repository-file
  title: "Unix process-session isolation and group cancellation"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/shell/exec_unix.go#L16-L108"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/shell/exec_unix.go"
  symbol: "isolateProcess; processGroupExecHandler"
  line_anchor: "L16-L108"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/shell/exec_unix.go | nl -ba | sed -n '16,108p' && shasum -a 256 internal/shell/exec_unix.go"
  command_environment: "macOS arm64; static Unix source; Windows path excluded"
  output_or_hash: "sha256:a5ce79e16db55b78b15c3966dc903fffd664f661df856e724356103c56c12ddf"
  access_date: "2026-08-24"
  supports_claims: [C-022, C-028, C-029]
  notes: "Selected to distinguish terminal/signal isolation from filesystem/network sandboxing."
- source_id: S-024
  source_kind: repository-file
  title: "SQLite connection, pragmas, migrations, and optional data-dir lock"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/db/connect.go#L17-L248"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/db/connect.go"
  symbol: "pragmas; WithDataDirLock; Connect; Release"
  line_anchor: "L17-L248"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/db/connect.go | nl -ba | sed -n '17,248p' && shasum -a 256 internal/db/connect.go"
  command_environment: "macOS arm64; static source; database not opened"
  output_or_hash: "sha256:c63dc46fc279f94a714b0bfea2bea1f95bc31cc048873c6918adbbdca2f81af7"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-017, C-018, C-019, C-036]
  notes: "Selected for actual persistence/lock implementation; comments explicitly limit lock opt-in."
- source_id: S-025
  source_kind: repository-file
  title: "Message debounce, flush, and durable update service"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/message/message.go#L16-L447"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/message/message.go"
  symbol: "Service; Update; FlushAll; flushOne; shouldFlushNow"
  line_anchor: "L16-L447"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/message/message.go | nl -ba | sed -n '16,447p' && shasum -a 256 internal/message/message.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:49266d91a969671b7f196edc90300bc8c43041e0b6ccc17278a2cfd860692fc8"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-016, C-017, C-023, C-028, C-029, C-035, C-036, C-040, C-041, C-049]
  notes: "Primary write-order source; 33 ms buffer is in memory until flush."
- source_id: S-026
  source_kind: repository-file
  title: "Session schema-facing service and accounting state"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/session/session.go#L19-L360"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/session/session.go"
  symbol: "Session; Service; CreateTaskSession; Save; UpdateTitleAndUsage"
  line_anchor: "L19-L360"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/session/session.go | nl -ba | sed -n '19,360p' && shasum -a 256 internal/session/session.go"
  command_environment: "macOS arm64; static source"
  output_or_hash: "sha256:6dd874dc36ee3a59ef12af9c1dc9e27f51d77ae881b255f19f653b6ebb5effdc"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-016, C-026, C-027]
  notes: "Selected for durable fields and the memory-only EstimatedUsage marker."
- source_id: S-027
  source_kind: repository-file
  title: "Pubsub loss and bounded terminal delivery"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/pubsub/broker.go#L1-L236"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/pubsub/broker.go"
  symbol: "Broker.Publish; Broker.PublishMustDeliver"
  line_anchor: "L1-L236"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/pubsub/broker.go | nl -ba | sed -n '1,236p' && shasum -a 256 internal/pubsub/broker.go"
  command_environment: "macOS arm64; static source; no saturation execution"
  output_or_hash: "sha256:46e7837b37fb33bca4ec3d4e47b1763166088789e498c755a231d94e90d75e09"
  access_date: "2026-08-24"
  supports_claims: [C-023, C-025, C-035, C-040, C-049]
  notes: "Preferred over comments at call sites because this is the delivery implementation."
- source_id: S-028
  source_kind: repository-file
  title: "PostHog telemetry endpoint and properties"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/event/event.go#L16-L129"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/event/event.go"
  symbol: "endpoint; baseProps; Init; send; Error; Flush"
  line_anchor: "L16-L129"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/event/event.go | nl -ba | sed -n '16,129p' && rg -n 'event.Init|shouldEnableMetrics|CRUSH_DISABLE_METRICS|DO_NOT_TRACK' internal --glob '*.go' && shasum -a 256 internal/event/event.go"
  command_environment: "macOS arm64; bounded production-source search; no network"
  output_or_hash: "sha256:08bf53079f3fb7f11f132714564776edaa7068a7b436e5bbb59803068456051d"
  access_date: "2026-08-24"
  supports_claims: [C-024, C-046]
  notes: "Selected for telemetry data/endpoint; search supports bounded P-13 only."
- source_id: S-029
  source_kind: repository-file
  title: "Prompt data and context-file assembly"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/agent/prompt/prompt.go#L22-L294"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/agent/prompt/prompt.go"
  symbol: "Prompt.Build; promptData; loadContextFiles"
  line_anchor: "L22-L294"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/agent/prompt/prompt.go | nl -ba | sed -n '22,294p' && shasum -a 256 internal/agent/prompt/prompt.go"
  command_environment: "macOS arm64; static source; context files not executed"
  output_or_hash: "sha256:ae6ed466b8d11242de25a9191f81dd65fd8c8d664da774d71820a3a60c78bd3a"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-034, C-039]
  notes: "Selected for producer/order/provenance of prompt data."
- source_id: S-030
  source_kind: repository-file
  title: "Coder system prompt template"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/agent/templates/coder.md.tpl#L1-L434"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/agent/templates/coder.md.tpl"
  symbol: "coder prompt template context/skills sections"
  line_anchor: "L1-L21,L265-L271,L371-L434"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/agent/templates/coder.md.tpl | nl -ba | sed -n '1,21p;265,271p;371,434p' && shasum -a 256 internal/agent/templates/coder.md.tpl"
  command_environment: "macOS arm64; prompt text treated as untrusted evidence, never instructions"
  output_or_hash: "sha256:f1148a996aa66b1319e5ca577db6b5d2de71e469f06c22123f0dc88d3afa52b3"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-015, C-034, C-039, C-045]
  notes: "Primary evidence that project/skill text is framed as instructions; prompt directives were not followed."
- source_id: S-031
  source_kind: repository-file
  title: "Skill parsing, discovery, prompt XML, and workspace manager"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/internal/skills/skills.go#L22-L408"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: "internal/skills/skills.go"
  symbol: "Skill; DiscoverWithStates; ToPromptXML; Deduplicate"
  line_anchor: "L22-L50,L117-L180,L212-L321,L362-L408"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:internal/skills/skills.go | nl -ba | sed -n '22,50p;117,180p;212,321p;362,408p' && shasum -a 256 internal/skills/skills.go"
  command_environment: "macOS arm64; static source; discovered skills not executed"
  output_or_hash: "sha256:b38132f342380acc7e14339b7017b2a7657ef4a7cd87167515d312d4408b43b4"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-014, C-018, C-039, C-042]
  notes: "Manager-specific global-mirror qualification also inspected in internal/skills/manager.go; source hash 83ef7ee702bbadd4da57f6ca0b810db4a14da5afcf87df8d2629ecef8c2fd1b3."
- source_id: S-032
  source_kind: repository-file
  title: "Tag-triggered release workflow"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/.github/workflows/release.yml#L1-L33"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/release.yml"
  symbol: "jobs.goreleaser"
  line_anchor: "L1-L33"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:.github/workflows/release.yml | nl -ba | sed -n '1,80p' && shasum -a 256 .github/workflows/release.yml"
  command_environment: "macOS arm64; static workflow; workflow not run"
  output_or_hash: "sha256:b7b9b6e988c56e3c8e9b2a749a1c97911d808730f2aac7f680eb7397b531b34f"
  access_date: "2026-08-24"
  supports_claims: [C-030, C-031]
  notes: "Delegates to charmbracelet/meta reusable workflow at mutable @main; retained as intent, not attestation."
- source_id: S-033
  source_kind: repository-file
  title: "GoReleaser build, package, sign, source, and SBOM configuration"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/.goreleaser.yml#L1-L350"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: ".goreleaser.yml"
  symbol: "metadata; builds; checksum; signs; source; sboms"
  line_anchor: "L1-L98,L212-L282,L346-L350"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:.goreleaser.yml | nl -ba | sed -n '1,98p;212,282p;346,350p' && shasum -a 256 .goreleaser.yml"
  command_environment: "macOS arm64; static release config; no build/install"
  output_or_hash: "sha256:aea79eb0a3cde8351a4d522e164c129026bd814ec8f99fab660778f64c1ba401"
  access_date: "2026-08-24"
  supports_claims: [C-030, C-031, C-050]
  notes: "Selected for exact build/sign/SBOM intent and correct FSL label; not proof jobs ran."
- source_id: S-034
  source_kind: test-output
  title: "Pinned CI commands and static Go test inventory"
  url: "https://github.com/charmbracelet/crush/blob/41cdd18a4b4f19c31c34301227da9341d62e9823/.github/workflows/build.yml#L1-L30"
  commit_or_ref: "v0.91.0"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/build.yml"
  symbol: "jobs.build.strategy; go build -race; go test -race"
  line_anchor: "L1-L30"
  command: "git show 41cdd18a4b4f19c31c34301227da9341d62e9823:.github/workflows/build.yml | nl -ba && printf 'go test files: ' && find . -name '*_test.go' -not -path './.git/*' | wc -l && printf 'packages with tests: ' && find . -name '*_test.go' -not -path './.git/*' -exec dirname {} \\; | sort -u | wc -l && shasum -a 256 .github/workflows/build.yml"
  command_environment: "macOS arm64; static inventory only; no Go tests or target code executed"
  output_or_hash: "inline:redacted go_test_files=215; directories_with_tests=52; build_workflow_sha256=e309e0f9c02bde0473a2f0e5930ae6c4a22d53eebc7ef3973d2a35a281561998"
  access_date: "2026-08-24"
  supports_claims: [C-032]
  notes: "Selected for qualification intent/inventory; explicitly not a passing test result."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "crush-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "Charmbracelet Crush"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/charmbracelet/crush"
  resolved_commit: "41cdd18a4b4f19c31c34301227da9341d62e9823"
  observed_ref: "v0.91.0"
  package_identity: "N/A:not-a-package-artifact-inspected"
research:
  researcher: "ses_fc91c3549ffeLetf00LaOZiNv2"
  owned_path: "research/harnesses/crush.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: identity_snapshot
    coverage: OBSERVED
    summary: "Exact tag, commit, clean state, release date, and official asset digests are pinned."
    confidence: HIGH
    claim_ids: [C-001, C-002]
    source_ids: [S-001, S-002, S-003, S-004]
    pattern_disposition: NO_POSITION
  - dimension: provenance_license
    coverage: PARTIAL
    summary: "FSL-1.1-MIT terms are explicit, stale MIT API metadata conflicts, and dependency obligations remain unknown."
    confidence: HIGH
    claim_ids: [C-003, C-004, C-050]
    source_ids: [S-005, S-006, S-033]
    pattern_disposition: NO_POSITION
  - dimension: repository_package_map
    coverage: OBSERVED
    summary: "A single Go executable composes explicit command, app, backend, agent, tool, state, policy, and UI packages."
    confidence: HIGH
    claim_ids: [C-005]
    source_ids: [S-007, S-012, S-013, S-014]
    pattern_disposition: NO_POSITION
  - dimension: executable_entrypoints
    coverage: PARTIAL
    summary: "TUI, run, server, local/client, and pprof entrypoints are static facts; startup effects are unobserved."
    confidence: HIGH
    claim_ids: [C-006, C-033, C-046]
    source_ids: [S-006, S-007, S-008, S-009, S-010, S-011]
    pattern_disposition: NO_POSITION
  - dimension: control_data_flow
    coverage: PARTIAL
    summary: "Prompt-to-provider/tool-to-SQLite-to-completion flow is traced statically, with physical delivery ambiguity retained."
    confidence: HIGH
    claim_ids: [C-007, C-027, C-049]
    source_ids: [S-008, S-012, S-013, S-014, S-015, S-027]
    pattern_disposition: NO_POSITION
  - dimension: module_extension_boundaries
    coverage: PARTIAL
    summary: "MCP, skills, hooks, and LSP are configurable per-workspace seams without a stable isolated plugin ABI."
    confidence: HIGH
    claim_ids: [C-008]
    source_ids: [S-014, S-018, S-031]
    pattern_disposition: NO_POSITION
  - dimension: agent_interface
    coverage: PARTIAL
    summary: "Coordinator/session agents own full run lifecycle and subagents use child sessions with best-effort parent cost."
    confidence: HIGH
    claim_ids: [C-009, C-010, C-029]
    source_ids: [S-014, S-015, S-016, S-026]
    pattern_disposition: NO_POSITION
  - dimension: tool_interface
    coverage: PARTIAL
    summary: "Fantasy tool schemas, hooks, permissions, metadata, and host sinks are traced; complete malformed/oversized validation is unknown."
    confidence: HIGH
    claim_ids: [C-011, C-047]
    source_ids: [S-014, S-015, S-017, S-018, S-021]
    pattern_disposition: NO_POSITION
  - dimension: provider_interface
    coverage: PARTIAL
    summary: "Crush adapts provider/auth/options into Fantasy, whose physical sends and failure behavior remain unqualified."
    confidence: MEDIUM
    claim_ids: [C-012, C-027, C-048]
    source_ids: [S-014, S-015, S-026]
    pattern_disposition: NO_POSITION
  - dimension: model_interface
    coverage: PARTIAL
    summary: "Model capabilities and parameters are explicit metadata, but live capability and failure behavior are unobserved."
    confidence: HIGH
    claim_ids: [C-013, C-048]
    source_ids: [S-014, S-015]
    pattern_disposition: NO_POSITION
  - dimension: context_interface
    coverage: PARTIAL
    summary: "Project, skill, MCP, history, and summary content are assembled with labels but without typed non-authority provenance."
    confidence: HIGH
    claim_ids: [C-014, C-015, C-034, C-039]
    source_ids: [S-015, S-029, S-030, S-031]
    pattern_disposition: NO_POSITION
  - dimension: state_persistence_restart
    coverage: PARTIAL
    summary: "SQLite/WAL and flush mechanics are explicit; crash, corruption, and migration rollback are unknown."
    confidence: HIGH
    claim_ids: [C-016, C-017]
    source_ids: [S-024, S-025, S-026]
    pattern_disposition: NO_POSITION
  - dimension: concurrency_worktree_isolation
    coverage: PARTIAL
    summary: "Server path dedup and session locks exist, while default local cross-process collision is unqualified."
    confidence: HIGH
    claim_ids: [C-018, C-019]
    source_ids: [S-013, S-015, S-024, S-031]
    pattern_disposition: NO_POSITION
  - dimension: permissions_authority_sandbox
    coverage: OBSERVED
    summary: "Policy prompts and process control are not sandboxing, and the safe-shell approval classifier has a static bypass."
    confidence: HIGH
    claim_ids: [C-020, C-021, C-022]
    source_ids: [S-017, S-018, S-019, S-020, S-021, S-022, S-023]
    pattern_disposition: CURIOSITY_NO_GO
  - dimension: evidence_observability
    coverage: PARTIAL
    summary: "SQLite/log/events provide correlation, but intermediate and even bounded terminal broker delivery may drop."
    confidence: HIGH
    claim_ids: [C-023, C-024, C-025, C-049]
    source_ids: [S-007, S-015, S-025, S-027, S-028]
    pattern_disposition: CONDITIONAL
  - dimension: resource_token_cost_accounting
    coverage: PARTIAL
    summary: "Session totals and fallback estimates exist without per-physical-call or billing reconciliation."
    confidence: HIGH
    claim_ids: [C-026, C-027]
    source_ids: [S-014, S-015, S-026]
    pattern_disposition: NO_POSITION
  - dimension: failure_cancellation_retry
    coverage: PARTIAL
    summary: "Source has detailed cancel/retry/cleanup paths, but fault-injected termination, duplication, and provider failures remain unknown."
    confidence: HIGH
    claim_ids: [C-028, C-029, C-048]
    source_ids: [S-013, S-014, S-015, S-021, S-023, S-025]
    pattern_disposition: CONDITIONAL
  - dimension: install_update_release
    coverage: PARTIAL
    summary: "Official checksums, bundle, SBOM and release automation exist without verified reproducibility or rollback."
    confidence: HIGH
    claim_ids: [C-002, C-030, C-031]
    source_ids: [S-002, S-003, S-004, S-032, S-033]
    pattern_disposition: NO_POSITION
  - dimension: tests_qualification
    coverage: PARTIAL
    summary: "A broad race-test CI matrix and static test inventory exist, but no test was run for this dossier."
    confidence: HIGH
    claim_ids: [C-032, C-017, C-019, C-029]
    source_ids: [S-020, S-034]
    pattern_disposition: NO_POSITION
  - dimension: security
    coverage: PARTIAL
    summary: "Host authority, prompt contamination, unauthenticated TCP/pprof, and approval bypass are material; dynamic exploitability remains unknown."
    confidence: HIGH
    claim_ids: [C-021, C-022, C-033, C-034]
    source_ids: [S-006, S-010, S-011, S-017, S-019, S-020, S-021, S-022, S-029, S-030]
    pattern_disposition: CURIOSITY_NO_GO
  - dimension: strengths
    coverage: PARTIAL
    summary: "Explicit logical-run lifecycle and structured local transcript persistence are evidence-backed strengths within their scope."
    confidence: HIGH
    claim_ids: [C-035, C-036]
    source_ids: [S-008, S-013, S-014, S-015, S-024, S-025, S-027]
    pattern_disposition: NO_POSITION
  - dimension: liabilities
    coverage: OBSERVED
    summary: "Competing authority, non-containment policy, and instruction contamination conflict with a sole typed authority."
    confidence: HIGH
    claim_ids: [C-037, C-038, C-039]
    source_ids: [S-006, S-010, S-012, S-013, S-014, S-015, S-017, S-019, S-020, S-021, S-022, S-029, S-030, S-031]
    pattern_disposition: NO_POSITION
  - dimension: transferable_patterns
    coverage: PARTIAL
    summary: "Correlated completion and structural flush are conditional; workspace-scoped managers are a candidate."
    confidence: MEDIUM
    claim_ids: [C-040, C-041, C-042]
    source_ids: [S-008, S-013, S-014, S-015, S-025, S-027, S-031]
    pattern_disposition: CANDIDATE
  - dimension: rejected_patterns_curiosity_no_go
    coverage: OBSERVED
    summary: "Safe-prefix authorization, unauthenticated TCP adaptation, and low-value discovery threads are bounded no-go findings."
    confidence: HIGH
    claim_ids: [C-043, C-044, C-045]
    source_ids: [S-001, S-002, S-010, S-011, S-017, S-019, S-020, S-021, S-022, S-030]
    pattern_disposition: CURIOSITY_NO_GO
strength_ids: [C-035, C-036]
liability_ids: [C-037, C-038, C-039]
transferable_pattern_ids: [C-040, C-041, C-042]
curiosity_no_go_ids: [C-043, C-044, C-045]
unknown_claim_ids: [C-017, C-019, C-027, C-029, C-031, C-034, C-046, C-047, C-048, C-049, C-050]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| Unknown | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-017 crash/restart/corruption | blocks strong durability/replay conclusion | crash at each buffered/terminal/migration transition and reopen copied DB | disposable VM, copied fixtures, process control | `UNASSIGNED` |
| C-019 collision/isolation | blocks local multi-process/worktree isolation claim | run colliding local/server instances and inspect DB/events/cleanup | disposable worktrees/data dirs | `UNASSIGNED` |
| C-027 accounting reconciliation | blocks complete physical-call visibility/cost conclusion | deterministic fake provider with retries/cache/title/summary/subagent accounting | instrumented Fantasy provider fixture | `UNASSIGNED` |
| C-029 cancellation/duplication | blocks verified descendant termination and fencing conclusion | deterministic blocking provider/tool/process tree, cancel at every handoff | disposable process sandbox and PID observer | `UNASSIGNED` |
| C-031 release/rollback | blocks reproducible source identity and rollback conclusion | verify tag/Sigstore identities, hermetic rebuild, failed update/migration rollback | release artifacts, trust policy, hermetic builders | `UNASSIGNED` |
| C-034 security exploitability | blocks exact consequence/severity for path/prompt/TCP risks | no-secret VM with symlink/case/traversal/fake-model/TCP fixtures | qualified sandbox and explicit authorization | `UNASSIGNED` |
| C-046 startup effects | blocks no-op/privacy/startup qualification | trace files/syscalls/processes/network in empty denied environment | disposable denied-write/network VM | `UNASSIGNED` |
| C-047 malformed/oversized input | blocks complete boundary-validation conclusion | schema/fuzz matrix with fake sinks asserting no effect | test harness and bounded resource limits | `UNASSIGNED` |
| C-048 provider faults | blocks provider failure/retry/fallback conclusion | inject 401/429/5xx/DNS/malformed/interrupted streams | deterministic provider/network proxy | `UNASSIGNED` |
| C-049 evidence loss/forgery | blocks complete/tamper-resistant evidence conclusion | saturate brokers, spoof IDs/payloads, reconcile SSE/log/SQLite/counters | isolated event/tool fixture | `UNASSIGNED` |
| C-050 dependency licenses | blocks complete redistribution/fork obligations | parse exact release SBOM and locked dependency license inventory | SBOMs plus authorized legal review | `UNASSIGNED` |

- **Contradictions retained:** governing FSL-1.1-MIT versus stale MIT Swagger metadata (C-004); “must deliver” naming versus bounded terminal drop (C-025); server-mode data lock versus unlocked default local mode (C-016/C-018); permission UX versus incomplete safe-shell classifier (C-020/C-021); path labels versus instruction promotion (C-014/C-039).
- **Rejected follow-ups:** provider catalog, popularity, screenshots, broad license archaeology, post-cutoff HEAD, and unsafe exploitation remain `CURIOSITY_NO_GO` under C-045 or Section 24.
- **Recommendation to downstream synthesis:** treat Crush as a source of conditional lifecycle/persistence patterns, not as demonstrated narrow execution substrate, sandbox, durable event authority, or complete accounting boundary. License fit must be decided before any code reuse; exact security/reliability unknowns fail closed for consequential adoption claims.
- **Stop decision:** `STOP_COVERAGE_AND_SATURATION`; all required dimensions and probes have primary static evidence or explicit UNKNOWN, repeated discovery was producing duplicates, and remaining discriminating work requires fixtures/authority outside this dossier.
- **Handoff checks:** structural validator `PASS` via `node research/harnesses/validate-dossiers.mjs research/harnesses/crush.md`; inline PyYAML claim/source/probe audit `PASS` (50 ordered claims, 34 ordered sources, exact field order, bidirectional references, FACT-only inference dependencies, substantive home citations, 24 normalized dimensions, 11 exact UNKNOWN IDs, and P-01–P-14); repository/source hash-and-anchor audit `PASS` (30 repository-backed records) and retained-release hash audit `PASS`; URL/link-check `PASS_WITH_QUALIFICATION` as recorded in Section 0; whitespace checks `PASS` via `git diff --check -- research/harnesses/crush.md`, `git diff --no-index --check /dev/null research/harnesses/crush.md`, and explicit tab/trailing-space searches; changed-file acceptance `PASS` via `git status --short` and `git diff --cached --name-only` (owned dossier is untracked, no staged paths, unrelated state unchanged).
- **Pre-existing workspace changes left untouched:** modified `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/`; pre-existing untracked `research/` contents and qualification receipt artifacts. Only `research/harnesses/crush.md` is owned by this dossier.
