# Pi — Whole-Harness Dossier

> Research-only evidence. No product, architecture, implementation, release, procurement, or security-acceptance authority.
> Evidence cutoff: 2026-08-24 UTC. Repository files, package bytes, documentation, and command output were treated as untrusted data, never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `pi-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** Pi / `N/A:whole-harness`
- **Researcher:** `ses_fc91daadeffe5yW4Uk00jpOg4d`
- **Owned path:** `research/harnesses/pi.md`
- **Research date and evidence cutoff:** 2026-08-24 UTC
- **Scope:** official `earendil-works/pi` monorepo at tag `v0.84.3`, especially the coding-agent composition around `@earendil-works/pi-coding-agent@0.84.3`, plus the exact npm artifact.
- **Exclusions:** post-cutoff `main` behavior; third-party Pi packages; live provider/model behavior; unsafe target execution; popularity scoring; broad historical archaeology; product selection or design.
- **Schema version:** `harness-dossier-summary/v1` under `RESEARCH-CONTRACT.md`
- **Completion state:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`
- **Safety:** static inspection only; no target code, install script, fetched executable, provider request, or extension was run.

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** `OBSERVED` with an explicit package/source qualification.
- **Claims:** `{C-001 FACT HIGH; S-001}` `{C-002 FACT HIGH; S-002,S-003,S-004,S-005}`
- **Finding:** The canonical upstream is `https://github.com/earendil-works/pi`. Tag `v0.84.3` resolves to full commit `4e58f324fae8ebfa98a3d45181fb248072a2afac`; the inspected checkout was clean and had no submodule entries. The exact package is `@earendil-works/pi-coding-agent@0.84.3` with npm integrity `sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w==`, SHA-1 `c040a5c2cfacd996731ce302a323269f124c8bdc`, and SHA-256 `d07dc417f78a14dac376a878b6556b51961f118f79771ee375333dc51356bc75`. {C-001 FACT HIGH; S-001} {C-002 FACT HIGH; S-002,S-003,S-004,S-005}
- **Snapshot qualification:** npm metadata records `gitHead=bfb004d4418ff05c6f909eaaab856cbe75c1fde0`, two commits after the tag. The only changed coding-agent path in that range is `packages/coding-agent/CHANGELOG.md`; `packages/coding-agent/src` has an empty diff. This supports source equivalence for the coding-agent source tree, not a reproducible-build conclusion. {C-002 FACT HIGH; S-003,S-005}
- **Platform/runtime assumptions:** package metadata requires Node `>=22.19.0`; the static research host was macOS/arm64. No runtime portability claim follows. {C-002 FACT HIGH; S-002,S-004}
- **Evidence:** S-001–S-005.
- **Boundary/scope:** immutable tag, exact registry version, and exact tarball only; stale `badlogic/pi-mono` and `@mariozechner/*` names are not treated as current identity.
- **Unknowns:** full build reproducibility is handled by C-028; exact rename chronology is handled by C-004.

## 2. Provenance and license {#provenance-license}

- **Status:** `PARTIAL`.
- **Claims:** `{C-003 FACT HIGH; S-002,S-003,S-006}` `{C-004 UNKNOWN N/A; S-003,S-006,S-015}`
- **Finding:** The repository license is MIT, copyright 2025 Mario Zechner, and the coding-agent manifest separately declares author Mario Zechner and license MIT. The npm record identifies a GitHub Actions trusted publisher and three package maintainers. Redistribution must retain the copyright and permission notice; the license disclaims warranties. {C-003 FACT HIGH; S-002,S-003,S-006}
- **Lineage:** compatibility aliases for the old `@mariozechner/*` namespace remain in the extension loader, but bounded official evidence did not establish the exact transfer/rename chronology or a complete fork lineage. A complete dependency-license aggregate was also not audited. These are `UNKNOWN`, not negative findings. {C-004 UNKNOWN N/A; S-003,S-006,S-015}
- **Evidence:** S-002, S-003, S-006, S-015.
- **Boundary/scope:** repository and inspected coding-agent package; no trademark opinion and no license conclusion for all transitive dependencies.
- **Unknowns:** C-004; next discriminating work is an official release/organization-history record plus a lockfile license scan reviewed by counsel or the authorized license owner.

## 3. Repository and package map {#repository-package-map}

- **Status:** `OBSERVED` statically.
- **Claims:** `{C-005 FACT HIGH; S-002,S-008,S-026}`
- **Finding:** The private workspace composes version-aligned public packages for AI/provider APIs (`packages/ai`), the generic loop (`packages/agent`), TUI, telemetry contracts, remote protocol/client, experimental server, SQLite session backend, and the coding-agent product; `packages/evals` and extension examples are non-production/private workspace nodes. The coding-agent package depends on the agent, AI, client, protocol, and TUI packages and exposes the CLI, root SDK library, RPC entry, and client library. {C-005 FACT HIGH; S-002,S-008,S-026}

| Node | Classification | Bounded responsibility / surface |
| --- | --- | --- |
| `packages/ai` | production, public | provider/model/auth/stream contracts and implementations |
| `packages/agent` | production, public | stateful agent and low-level model/tool loop |
| `packages/coding-agent` | production, public composition root | CLI, SDK, modes, tools, sessions, resources, extensions |
| `packages/tui` | production, public | terminal rendering/input components |
| `packages/telemetry` | production, public | telemetry schema/contracts |
| `packages/protocol`, `packages/client` | production, public | framed CBOR protocol and transport-neutral remote client |
| `packages/server` | production-labelled but experimental | remote server surface; not the default coding-agent CLI path |
| `packages/session-backends/sqlite-node` | production, public | SQLite backend for the newer generic agent-harness sessions |
| `packages/evals` | private/evaluation | evaluations, not a shipped runtime authority surface |
| `packages/coding-agent/examples` | examples/test-support | optional extension and SDK demonstrations, not defaults |
| `packages/ai/src/models.generated.ts` | generated | generated model catalog data |
| `packages/coding-agent/src/core/export-html/vendor` | vendored asset | export rendering dependency, not loop authority |
| package `dist/` | generated artifact | compiled/bundled npm output |

- **Evidence:** S-002, S-008, S-026.
- **Boundary/scope:** package presence shows structure, not reachability; reachability claims are limited to traced composition paths in later sections.
- **Unknowns:** the experimental server's production maturity and compatibility guarantees were not dynamically qualified.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** `OBSERVED` statically; startup effects not dynamically observed.
- **Claims:** `{C-006 FACT HIGH; S-002,S-009,S-010,S-011}`
- **Finding:** npm maps `pi` to `dist/bundle/cli.js`; source `cli.ts` configures process identity/HTTP dispatch and calls `main(argv)`. `main.ts` selects interactive, print/text, JSON-event, or strict JSONL RPC behavior and composes session services. The package root exports the SDK (`createAgentSession`), with separate `./rpc-entry` and `./client` exports. {C-006 FACT HIGH; S-002,S-009,S-010,S-011}

| Form | Invocation / producer → consumer | Lifecycle owner | Side effects / failure surface |
| --- | --- | --- | --- |
| CLI/TUI | `pi [options]` → `main` → `AgentSession` → interactive mode | CLI process | settings/resources/session files, provider network, tools; diagnostics and process exit |
| print/JSON | `pi -p` or `--mode json` → same session → stdout | CLI process | same authority as interactive unless tools/resources disabled |
| RPC | `pi --mode rpc` / `./rpc-entry` ↔ JSONL stdin/stdout client | RPC process | strict LF framing; commands can reach session/tool authority |
| SDK | import package root → `createAgentSession()` | embedding process | host supplies or receives model/runtime/session/tool objects |
| client/protocol/server | package exports / sibling packages ↔ framed transport | embedding/server process | separate experimental remote boundary, not default daemon startup |
| installer/update | npm global install or documented shell installer; package subcommands | invoking user/process | package/network/filesystem mutation |

- **Evidence:** S-002, S-009–S-011.
- **Boundary/scope:** shipped coding-agent entrypoints and documented modes; no default background daemon or worker is asserted.
- **Unknowns:** no startup mode was run; C-042 covers undeclared startup writes/network/credential reads.

## 5. Control and data flow {#control-data-flow}

- **Status:** `OBSERVED` statically.
- **Claims:** `{C-007 FACT HIGH; S-011,S-012,S-013}`
- **Finding:** A representative request flows from CLI/SDK prompt to `Agent`, through context conversion and provider streaming, then through model-produced tool calls, schema validation, optional hooks, host tool execution, tool-result insertion, and the next turn; steering is polled after a turn's tool batch and follow-ups after the loop would otherwise stop. {C-007 FACT HIGH; S-011,S-012,S-013}

| Step | Producer → consumer | Data/control/authority | Lifecycle, side effect, error |
| --- | --- | --- | --- |
| 1 | operator/SDK → `Agent.prompt` | `AgentMessage[]`; caller starts control | rejects a second active prompt |
| 2 | `Agent` → `runAgentLoop` | transcript snapshot, tools, model, `AbortSignal` | emits agent/turn/message start events |
| 3 | loop → provider stream | system prompt, converted messages, tool schemas, auth/options | network authority belongs to provider implementation; error/aborted stop reasons terminate loop |
| 4 | model stream → loop | partial/final assistant content and tool calls | stream events become lifecycle events |
| 5 | loop → validator/hooks | tool name and arguments | unknown tool or invalid/truncated arguments become error tool results before execution |
| 6 | loop → tool | validated arguments and signal | filesystem/process/network side effects depend on tool; exceptions map to error results |
| 7 | tool → transcript/provider | `ToolResultMessage` plus usage/details | result is emitted, persisted by session listeners, and becomes model-visible data |
| 8 | queues → loop | steering after tool batch; follow-up after quiescence | may start another provider turn |

- **Trust crossings:** user/repository content → system/context; model output → tool selector; tool output → model context; process → provider network; extension code → in-process loop hooks. {C-007 FACT HIGH; S-011,S-012,S-013}
- **Evidence:** S-011–S-013.
- **Boundary/scope:** static default composition; no claim that every provider or extension follows identical internal behavior.
- **Unknowns:** delivery ambiguity, duplicate side effects, and crash-time state are covered by C-045.

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** `PARTIAL`.
- **Claims:** `{C-008 FACT HIGH; S-015,S-017}` `{C-009 UNKNOWN N/A; S-009,S-015,S-017}`
- **Finding:** Extensions are TypeScript/JavaScript factories imported in-process with `jiti`. They can register/replace tools, commands, shortcuts, handlers, providers, renderers, and flags; execute subprocesses; send messages; mutate active tools/models; and hook context, tool, and provider boundaries. Loading is ordered, errors are collected, name conflicts are diagnosed, and reload invalidates stale contexts. {C-008 FACT HIGH; S-015,S-017}
- **Discovery/registration:** user/global, CLI, package, and trusted project paths are resolved by the resource loader; factories are awaited before startup, and project trust gates project-local loading. Payloads are JavaScript objects; no process boundary exists. {C-008 FACT HIGH; S-009,S-015,S-017}
- **Versioning/unload:** compatibility aliases exist for the old package namespace, but no stable extension ABI version negotiation or independently verified unload/rollback contract was established. {C-009 UNKNOWN N/A; S-009,S-015,S-017}
- **Evidence:** S-009, S-015, S-017.
- **Boundary/scope:** built-in extension loader only; third-party packages were excluded.
- **Unknowns:** C-009; a conformance probe across reload, conflicts, stale contexts, and version mismatch is required.

## 7. Agent interface {#agent-interface}

- **Status:** `OBSERVED` statically.
- **Claims:** `{C-010 FACT HIGH; S-011,S-013}` `{C-011 FACT HIGH; S-009,S-021,S-022}`
- **Finding:** `Agent` is a stateful in-process object that owns the current transcript, one active run, lifecycle events, model dispatch, tool execution, and steering/follow-up queues. It accepts text/images or `AgentMessage` objects, produces event-driven assistant/tool-result messages, rejects concurrent prompts on the same instance, and exposes cooperative abort/wait-for-idle. {C-010 FACT HIGH; S-011,S-013}
- **Delegation/parent-child:** in the bounded production source and built-in tool registry, no named built-in subagent or plan-mode control path was found; the README explicitly positions these as extension/package choices. This is a bounded absence, not a global statement about extensions or spawned Pi processes. {C-011 FACT HIGH; S-009,S-021,S-022}
- **Authority:** the agent itself is the model-loop and tool-dispatch authority; an embedding host can replace stream/runtime/session/tools but does not make the default agent a passive data object. {C-010 FACT HIGH; S-011,S-013}
- **Evidence:** S-009, S-011, S-013, S-021, S-022.
- **Boundary/scope:** one `Agent` instance and default coding-agent composition.
- **Unknowns:** recursive cancellation of externally spawned descendant agents is not applicable to a built-in subagent path, but extensions/spawned processes remain unqualified under C-026.

## 8. Tool interface {#tool-interface}

- **Status:** `OBSERVED` statically; denial paths not dynamically probed.
- **Claims:** `{C-012 FACT HIGH; S-011,S-012,S-014,S-021}`
- **Finding:** The default active tools are `read`, `bash`, `edit`, and `write`; the built-in registry additionally exposes platform/selection-dependent `powershell`, `grep`, `find`, and `ls`. Tool declarations carry names, descriptions, TypeBox parameter schemas, execution callbacks, and optional execution mode. The loop resolves by name, validates arguments before side effects, permits an optional `beforeToolCall` block, executes sequentially or in parallel, maps exceptions to error results, and emits start/update/end plus result-message events. {C-012 FACT HIGH; S-011,S-012,S-021}
- **Timeout/cancellation:** shell timeout is optional with no default timeout; finite positive values are validated. The same `AbortSignal` is passed to hooks and tools. {C-012 FACT HIGH; S-012,S-014}
- **Approval:** there is no default user approval call in the built-in shell execution path. Optional extension hooks can block, but optional hooks are not a default enforcement boundary. {C-012 FACT HIGH; S-012,S-014}
- **Tool-output trust:** tool output is normalized into `ToolResultMessage` and becomes transcript/provider input; it is data but carries no built-in provenance/taint authority type. {C-012 FACT HIGH; S-012}
- **Evidence:** S-011, S-012, S-014, S-021.
- **Boundary/scope:** built-in tool registry and generic agent loop; custom tools can differ.
- **Unknowns:** oversized input limits and alternate bypass behavior are covered by C-043 and C-044.

## 9. Provider interface {#provider-interface}

- **Status:** `PARTIAL` because no live provider was called.
- **Claims:** `{C-013 FACT HIGH; S-011,S-020}` `{C-046 UNKNOWN N/A; S-011,S-019,S-020}`
- **Finding:** A provider owns a unique ID, auth semantics, model catalog, API stream implementation, and optional deferred-response methods. `Models` resolves provider-scoped auth, applies request headers/base URL/environment, and delegates streaming to the provider selected by `model.provider`; custom providers can be registered by extensions. {C-013 FACT HIGH; S-011,S-020}
- **Transport/retry/telemetry:** the coding SDK forwards transport, timeout, maximum retries/delay, session ID, and attribution/header hooks. Provider code owns the physical transport and retry implementation, so source-level delegation does not prove one visible physical send per logical call. {C-013 FACT HIGH; S-011,S-020}
- **Failure/fallback:** unknown provider, missing auth, unsupported API, and unsupported deferred cancellation have explicit errors. No live rate-limit/auth/malformed-stream/network-denial behavior or cross-provider failover was observed. {C-046 UNKNOWN N/A; S-011,S-020}
- **Evidence:** S-011, S-020.
- **Boundary/scope:** provider collection/dispatch contracts and default SDK adaptation, not every provider SDK internals.
- **Unknowns:** C-046 covers physical-call visibility, retry/cache attribution, network failure, and provider usage disagreement.

## 10. Model interface {#model-interface}

- **Status:** `PARTIAL`.
- **Claims:** `{C-014 FACT HIGH; S-011,S-020}` `{C-046 UNKNOWN N/A; S-011,S-019,S-020}`
- **Finding:** Models are selected by provider plus model ID and carry API, reasoning/capability, context-window, token-limit, headers/base URL, and cost-rate metadata. The SDK restores a saved model when available, otherwise resolves configured/default models, clamps requested thinking level to declared capability, and streams assistant content/tool calls through the selected provider. {C-014 FACT HIGH; S-011,S-020}
- **Parameters/structured output:** reasoning, transport, timeouts, retries, tool schemas, and maximum-token options are passed through typed contracts; tool calls are the traced structured-action channel. Runtime catalog accuracy and provider-specific structured-output behavior were not tested. {C-014 FACT HIGH; S-011,S-020}
- **Fallback:** a missing restored model can produce a user-facing model-fallback message and choose an available initial model; this is configuration recovery, not evidence of per-request provider failover. {C-014 FACT HIGH; S-011}
- **Evidence:** S-011, S-020.
- **Boundary/scope:** static model/provider contracts.
- **Unknowns:** live capability negotiation, token-limit disagreement, and routing/fallback under failure remain within C-046.

## 11. Context interface {#context-interface}

- **Status:** `OBSERVED` statically; contamination resistance is limited by the documented threat model.
- **Claims:** `{C-015 FACT HIGH; S-009,S-016,S-017,S-019}` `{C-035 INFERENCE HIGH; S-007,S-016,S-017}`
- **Finding:** The system prompt is assembled from a fixed coding-assistant prompt, active tool snippets/guidelines, optional replacement/append text, discovered context files, skills, and the current working directory. `AGENTS.override.md`, `AGENTS.md`, or `CLAUDE.md` are loaded from global and ancestor/current scopes and concatenated with path-labelled XML-like wrappers. Extensions can transform context before provider dispatch. {C-015 FACT HIGH; S-009,S-016,S-017}
- **Adversarial correction — “minimal prompt”:** the default prompt is compact relative to feature-heavy agents but is not merely a one-line tool list; it contains fixed role, tool, response, path, documentation, and self-help instructions, then concatenates project instructions and skills. “Minimal” is therefore product positioning, not a measured security or token property. {C-015 FACT HIGH; S-009,S-016}
- **Compaction/accounting:** the most recent valid provider usage anchors context estimation; trailing messages use an approximate characters/4 estimate. Automatic compaction triggers near the context window, retains recent turns, summarizes older material with a separate model call, and leaves full history in session JSONL. The summary is lossy. {C-015 FACT HIGH; S-009,S-019}
- **Instruction/data separation:** path wrappers preserve some origin labels, but repository instructions are inserted into the system prompt and the security policy says prompt injection cannot be protected against under this model; no typed taint/authority separation was found. {C-035 INFERENCE HIGH; S-007,S-016,S-017}
- **Evidence:** S-007, S-009, S-016, S-017, S-019.
- **Boundary/scope:** default context/resource/compaction paths.
- **Unknowns:** dynamic injection effects are covered by C-043; exact summary fidelity is not established.

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** `PARTIAL`.
- **Claims:** `{C-016 FACT HIGH; S-009,S-018}` `{C-017 UNKNOWN N/A; S-018}`
- **Finding:** The coding-agent session manager maintains an in-memory index and optionally persists an append-only JSONL tree. Entries have IDs and parent IDs; the leaf selects the active branch. It records messages, model/thinking changes, labels, custom entries, compaction and branch summaries, and summary usage. `--no-session` uses in-memory state; normal sessions are organized by working directory and can be resumed, forked, cloned, imported/exported, or migrated on open. {C-016 FACT HIGH; S-009,S-018}
- **Flush/transactions:** initial creation uses exclusive `wx`, later entries use synchronous append; migration/rewrite opens the file with `w` and rewrites entries. This is transcript persistence, not a transactional domain/event store. {C-016 FACT HIGH; S-018}
- **Restart/corruption:** parsing rejects a non-empty invalid explicit session, and migrations can rewrite older formats, but no crash-at-each-write or torn-write recovery probe was run. {C-017 UNKNOWN N/A; S-018}
- **Retention/deletion:** ordinary files under the session directory are the durable owner; no retention policy or authenticated deletion audit was established. {C-017 UNKNOWN N/A; S-018}
- **Evidence:** S-009, S-018.
- **Boundary/scope:** legacy coding-agent JSONL sessions, not the sibling generic SQLite session backend.
- **Unknowns:** C-017.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** `PARTIAL`.
- **Claims:** `{C-018 FACT HIGH; S-011,S-012,S-013,S-018}` `{C-019 UNKNOWN N/A; S-013,S-018}`
- **Finding:** One `Agent` rejects a second prompt while a run is active; steering/follow-up queues serialize message injection around turns. A tool batch defaults to parallel execution unless globally or per-tool sequential, while result messages are restored to assistant source order. Sessions are keyed by session ID/file and cwd; multiple processes can exist, but the traced JSONL writer has no cross-process transaction or session fencing mechanism. {C-018 FACT HIGH; S-011,S-012,S-013,S-018}
- **Worktrees/tenants:** context discovery recognizes Git/worktree ancestry for instruction loading, but no built-in worktree lifecycle owner, tenant capability boundary, or race-resistant root containment was traced in the coding-agent session/tool authority. {C-018 FACT HIGH; S-017,S-018}
- **Collision/race behavior:** two processes targeting the same session/workspace, parallel edits to one file, and cleanup after cancellation were not dynamically challenged. {C-019 UNKNOWN N/A; S-013,S-018}
- **Evidence:** S-011–S-013, S-017, S-018.
- **Boundary/scope:** one process/agent and coding-agent JSONL/session/tools.
- **Unknowns:** C-019 and the combined fault-injection C-045.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** `OBSERVED` for default enforcement posture.
- **Claims:** `{C-020 FACT HIGH; S-007,S-009,S-012,S-014,S-015,S-017,S-023}`
- **Finding:** Pi intentionally has no built-in sandbox or permission-popup boundary. The default model receives shell and file-mutation tools; the local shell backend spawns the host shell as the invoking user with inherited environment, and file tools resolve relative, `~`, and absolute paths rather than enforce workspace containment. In-process extensions execute arbitrary code and can spawn commands. {C-020 FACT HIGH; S-007,S-009,S-014,S-015,S-023}

| Actor → action | Default authority / enforcement point | Audit/failure |
| --- | --- | --- |
| operator → choose tools/resources | CLI allow/deny flags and project trust | configuration-level selection; not action-time approval |
| model → built-in tool | allowed if tool is active and schema validates | optional extension `beforeToolCall` may block; no default human gate |
| shell tool → process/network/credentials | invoking OS user; host shell/environment | process exit/error and tool events; external containment is user's responsibility |
| file tool → filesystem | invoking OS user; absolute paths accepted | OS errors/tool events; no root-anchored workspace policy |
| project resource → process | ignored until project trust, then loaded/executed | trust decision controls loading, not reduced post-load authority |
| extension → runtime/host | full in-process authority | loader errors/conflict diagnostics; no sandbox |

- **Adversarial correction — project trust:** project trust is a resource-loading gate. It does not authorize each model action, narrow shell/filesystem/network capabilities, or confine an extension after load. {C-020 FACT HIGH; S-007,S-017}
- **Evidence:** S-007, S-009, S-012, S-014, S-015, S-017, S-023.
- **Boundary/scope:** default local coding-agent. External containers/VMs and example sandbox extensions are outside the built-in enforcement boundary.
- **Unknowns:** alternate-path denial and filesystem abuse were not run; see C-043.

## 15. Evidence and observability {#evidence-observability}

- **Status:** `PARTIAL`.
- **Claims:** `{C-021 FACT HIGH; S-009,S-012,S-013,S-018}` `{C-022 INFERENCE HIGH; S-007,S-018}` `{C-048 UNKNOWN N/A; S-012,S-018}`
- **Finding:** The agent emits ordered lifecycle events for agent/turn/message/tool start, update, end, and errors; JSON mode exports events, and JSONL sessions persist model-visible messages plus changes, summaries, and usage. Tool call IDs and session IDs provide local correlation. {C-021 FACT HIGH; S-009,S-012,S-013,S-018}
- **Durability/ownership:** session evidence is owned by ordinary user-writable files. Some transient updates/UI state and external process descendants are not durable facts, and provider header/payload hooks may expose or alter request observations. {C-021 FACT HIGH; S-011,S-018}
- **Tamper resistance:** because the invoking user and writable home/workspace are inside Pi's trust boundary and JSONL is rewritten/appended without signatures, session/event evidence is inspectable but not tamper-resistant against that user or in-process extensions. {C-022 INFERENCE HIGH; S-007,S-018}
- **Redaction/export:** HTML/JSONL export exists; a complete secret-redaction schema and forgery-resistant receipt format were not established. {C-048 UNKNOWN N/A; S-012,S-018}
- **Evidence:** S-007, S-009, S-011–S-013, S-018.
- **Boundary/scope:** coding-agent events and JSONL sessions; no claim about an external OpenTelemetry collector.
- **Unknowns:** C-048.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** `PARTIAL`.
- **Claims:** `{C-023 FACT HIGH; S-009,S-019,S-020,S-028}` `{C-024 UNKNOWN N/A; S-019,S-020,S-028}`
- **Finding:** Provider-reported usage supplies input/output/cache token counts; local model rate metadata calculates cost, including tier and cache-write handling. Session totals include assistant, tool-result, compaction, and branch-summary usage, while context estimation falls back to characters/4 only for trailing/unreported content. The TUI reports totals and context use. {C-023 FACT HIGH; S-009,S-019,S-020,S-028}
- **Limits/budgets:** shell supports an optional timeout and output truncation/temp-file spill, while HTTP settings provide timeout/retry controls. No built-in CPU/memory/network quota or cost-budget enforcement was established. {C-023 FACT HIGH; S-014,S-019,S-020}
- **Disagreement:** no comparison was made among preflight estimates, every physical retry/cache request, streamed provider usage, and provider billing totals; missing or contradictory usage behavior is unknown. {C-024 UNKNOWN N/A; S-019,S-020,S-028}
- **Evidence:** S-009, S-014, S-019, S-020, S-028.
- **Boundary/scope:** static accounting paths, not billing accuracy.
- **Unknowns:** C-024 and live-provider C-046.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** `PARTIAL`.
- **Claims:** `{C-025 FACT HIGH; S-011,S-012,S-013,S-014,S-019,S-020}` `{C-026 UNKNOWN N/A; S-012,S-013,S-014,S-018}`
- **Finding:** Unknown tools, invalid arguments, hook denial, tool exceptions, provider stream errors, and aborts become explicit error/tool/assistant outcomes. An output-token-limit stop denies all potentially truncated tool calls before side effects. The SDK forwards provider retry limits/timeouts; compaction uses a retry choke point for transient failures; shell timeout/abort calls process-tree termination and preserves partial output in diagnostics. {C-025 FACT HIGH; S-011,S-012,S-013,S-014,S-019,S-020}
- **Cancellation direction:** `Agent.abort()` aborts one run controller; the signal flows to provider, hooks, and tools. Shell code attempts to kill the process tree. This is cooperative cancellation plus a platform helper, not proof of verified descendant termination or late-result fencing. {C-025 FACT HIGH; S-012,S-013,S-014}
- **Retry/idempotency/crash:** physical retry ownership is provider-specific, and no end-to-end duplicate-delivery, partial-write, crash, or all-platform descendant cleanup probe was run. {C-026 UNKNOWN N/A; S-012,S-013,S-014,S-018}
- **Evidence:** S-011–S-014, S-018–S-020.
- **Boundary/scope:** generic loop, coding-agent SDK/shell, compaction, and provider contracts.
- **Unknowns:** C-026 and C-045.

## 18. Install, update, and release {#install-update-release}

- **Status:** `PARTIAL`.
- **Claims:** `{C-027 FACT HIGH; S-002,S-003,S-004,S-005,S-009,S-024,S-025}` `{C-028 UNKNOWN N/A; S-003,S-004,S-005,S-024,S-025}`
- **Finding:** The documented safe npm path is `npm install -g --ignore-scripts @earendil-works/pi-coding-agent`; package metadata has no install lifecycle requirement. The exact tarball rehashed to the registry SHA-1/SHA-512 and contained 1,044 members with no absolute/`..` member and no symlink entry. Registry metadata exposes signatures and an npm provenance attestation URL; this research did not independently validate their cryptographic chain. {C-027 FACT HIGH; S-003,S-004,S-009}
- **Release path:** CI statically defines build/check/test before npm publish, a Linux/macOS/Windows binary matrix, release SHA-256 files, trusted npm publishing, and a staged GitHub release. Startup version checks and explicit `pi update` commands exist; `--offline`/`PI_OFFLINE=1` disables startup network operations. {C-027 FACT HIGH; S-009,S-024,S-025}
- **Source traceability:** tag/package `gitHead` differ as described in Section 1, but coding source is unchanged between them. A byte-for-byte rebuild and failed-update rollback were not performed. {C-028 UNKNOWN N/A; S-003,S-004,S-005,S-024,S-025}
- **Evidence:** S-002–S-005, S-009, S-024, S-025.
- **Boundary/scope:** npm artifact and repository release workflow; shell installer and binaries were not fetched or executed.
- **Unknowns:** C-028 and adversarial release probe C-047.

## 19. Tests and qualification {#tests-qualification}

- **Status:** `PARTIAL`.
- **Claims:** `{C-029 FACT HIGH; S-002,S-008,S-024,S-027}` `{C-045 UNKNOWN N/A; S-012,S-013,S-014,S-018}`
- **Finding:** The static inventory found 400 `*.test.ts`/`*.spec.ts` files across the AI, agent, and coding-agent packages (136/23/241). Root and package scripts run Vitest/workspace tests plus build, formatting/static checks, shrinkwrap/install-lock checks, TypeScript, and a browser smoke check; CI invokes build/check/test on Ubuntu, while release binaries are built on Linux/macOS/Windows. {C-029 FACT HIGH; S-002,S-008,S-024,S-027}
- **Qualification limits:** this dossier did not install dependencies or execute target tests. Static test presence and CI configuration do not prove the reviewed runtime behavior, platform matrix, provider integrations, sandboxing, crash recovery, or race freedom. Dynamic fault/collision qualification remains C-045. {C-029 FACT HIGH; S-008,S-024,S-027} {C-045 UNKNOWN N/A; S-012,S-013,S-014,S-018}
- **Evidence:** S-002, S-008, S-024, S-027.
- **Boundary/scope:** checked-in tests and workflows at the pinned commit, not historical CI run results.
- **Unknowns:** test pass/fail at this snapshot and adversarial runtime behavior were not observed.

## 20. Security {#security}

- **Status:** `OBSERVED` for declared and implemented trust boundaries; no security acceptance is implied.
- **Claims:** `{C-030 FACT HIGH; S-007,S-009,S-014,S-015,S-017,S-023}`
- **Finding:** The official policy defines the invoking local user, user-writable home/workspace/configuration, and Pi process as one trust boundary; explicitly excludes built-in sandbox behavior, prompt injection, malicious model output, untrusted repositories, and user-installed extensions/skills from its vulnerability model. Private reporting is available by email or GitHub Security Advisories. {C-030 FACT HIGH; S-007}
- **Controls:** TypeBox tool validation and denial of truncated tool arguments reduce malformed-action risk; project trust delays project-local settings/resources/extensions; auth is provider-scoped; package hashes/provenance metadata aid supply-chain review. These controls do not create action-time least privilege. {C-030 FACT HIGH; S-003,S-012,S-017,S-020}
- **Attack surfaces:** full-user shell/filesystem authority, absolute paths, in-process extensions, context instruction injection, credentials/environment, package installation, provider network, and ordinary mutable session evidence. {C-030 FACT HIGH; S-007,S-014,S-015,S-017,S-023}
- **Evidence:** S-003, S-007, S-009, S-012, S-014, S-015, S-017, S-020, S-023.
- **Boundary/scope:** threat-model fidelity, not a penetration test or security approval.
- **Unknowns:** filesystem abuse, injection effects, and evidence spoofing were not dynamically exploited; C-043 and C-048 remain open.

## 21. Strengths {#strengths}

- **Status:** `OBSERVED` as research interpretations, not adoption recommendations.
- **Claims:** `{C-031 INFERENCE HIGH; S-011,S-012,S-015,S-020}` `{C-032 INFERENCE MEDIUM; S-009,S-018,S-019}`

1. **Composable explicit seams:** provider, model, stream, tool, lifecycle-event, SDK, and extension contracts are visible and replaceable in TypeScript. This is useful for experimentation and embedding where the embedding process accepts Pi's loop authority. {C-031 INFERENCE HIGH; S-011,S-012,S-015,S-020}
2. **Inspectable conversation history:** append-only parent-linked JSONL, branching, compaction entries, and recorded summary usage preserve more inspectable transcript history than a mutable flat message array. This is scoped to conversation state, not transactional domain truth. {C-032 INFERENCE MEDIUM; S-009,S-018,S-019}

- **Evidence:** S-009, S-011, S-012, S-015, S-018–S-020.
- **Boundary/scope:** developer ergonomics and transcript inspection at the pinned snapshot.
- **Unknowns:** runtime reliability and large-session performance were not measured.

## 22. Liabilities {#liabilities}

- **Status:** `OBSERVED` as evidence-backed interpretations.
- **Claims:** `{C-033 INFERENCE HIGH; S-007,S-014,S-015,S-023}` `{C-034 INFERENCE HIGH; S-011,S-012,S-018,S-020}` `{C-035 INFERENCE HIGH; S-007,S-016,S-017}`

| Liability | Trigger → consequence | Affected boundary / upstream mitigation |
| --- | --- | --- |
| Ambient user authority | activating shell/file tools or extensions → model/extension can exercise invoking-user authority beyond a workspace | execution/security; upstream says use a container/VM or custom gate {C-033 INFERENCE HIGH; S-007,S-014,S-015,S-023} |
| Competing loop/state/retry authority | embedding default `AgentSession` below another orchestrator → Pi still owns turns, tool dispatch, queues, retry settings, and transcript persistence | application/provider/tool authority; replace many SDK components or use a narrower extracted contract {C-034 INFERENCE HIGH; S-011,S-012,S-018,S-020} |
| Context contamination | trusted project instructions/skills enter system context → untrusted repository prose can influence tool selection with no typed taint | context/permission boundary; disable resources or externally constrain tools {C-035 INFERENCE HIGH; S-007,S-016,S-017} |

- **Evidence:** S-007, S-011, S-012, S-014–S-018, S-020, S-023.
- **Boundary/scope:** suitability constraints for a policy-authoritative custom harness; not a general quality judgment.
- **Unknowns:** whether a small adapter can remove all competing authority requires downstream architecture analysis, not this dossier.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** `OBSERVED` as preliminary pattern dispositions only.
- **Claims:** `{C-036 INFERENCE HIGH; S-012,S-021}` `{C-037 INFERENCE MEDIUM; S-018,S-019}` `{C-038 INFERENCE MEDIUM; S-011,S-020}`

| Pattern | Minimal mechanism / problem solved | Prerequisites and preserved boundary | Cost/risk | Disposition |
| --- | --- | --- | --- | --- |
| Validate and fail closed before tool side effects | resolve tool, validate schema, deny unknown/truncated calls, emit typed result events | final sink still needs independent policy/authority enforcement | low adaptation; event fields need durable identities | `CANDIDATE` {C-036 INFERENCE HIGH; S-012,S-021} |
| Parent-linked transcript with explicit compaction entries | append immutable message/change/summary nodes and move only a branch leaf | treat as model transcript/projection, not canonical domain facts | medium; needs transactional writer, corruption handling, provenance | `CONDITIONAL` {C-037 INFERENCE MEDIUM; S-018,S-019} |
| Provider-owned typed streaming behind a registry | provider owns auth/catalog/stream while collection performs lookup/adaptation | every physical send/retry/usage event must remain externally visible | medium/high; current retry internals require qualification | `CONDITIONAL` {C-038 INFERENCE MEDIUM; S-011,S-020} |

- **Evidence:** S-011, S-012, S-018–S-021.
- **Boundary/scope:** clean-room pattern input only; no code copying or design approval.
- **Unknowns:** adaptation fit must be decided against accepted project ADRs by an authorized synthesis owner.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** `OBSERVED` as bounded research rejection, not project rejection.
- **Claims:** `{C-039 INFERENCE HIGH; S-007,S-015}` `{C-040 INFERENCE HIGH; S-007,S-009,S-015,S-016}` `{C-041 INFERENCE HIGH; S-001,S-003,S-005,S-022}`

| Pattern/thread | Exact `CURIOSITY_NO_GO` rationale | Violated boundary / failure mode | Reopen condition |
| --- | --- | --- | --- |
| In-process extension as an untrusted plugin boundary | extensions import and execute with process authority; registration convenience is not confinement | untrusted code joins the TCB and can spawn/mutate runtime | only if moved behind a reviewed process/protocol boundary with qualified containment {C-039 INFERENCE HIGH; S-007,S-015} |
| “Self-extension” as a permission/security substitute | model-authored skills/extensions can add behavior but cannot grant legitimate authority or enforce a human decision; skills can themselves instruct consequential actions | model/tool output would become authorization; prompt injection remains in scope operationally even if excluded as vulnerability | only with external authenticated policy/gate ownership {C-040 INFERENCE HIGH; S-007,S-009,S-015,S-016} |
| Popularity, broad rename archaeology, or post-cutoff HEAD behavior | these threads do not change the pinned loop/sandbox/state hard-boundary findings and would break snapshot comparability | decision budget and immutable-snapshot constraint | an official chronology required for legal provenance, or a separately assigned newer snapshot {C-041 INFERENCE HIGH; S-001,S-003,S-005,S-022} |

- **Evidence:** S-001, S-003, S-005, S-007, S-009, S-015, S-016, S-022.
- **Boundary/scope:** pinned release and Curiosity's comparison frame.
- **Unknowns:** rejected curiosity threads are not claims that no useful historical or ecosystem information exists.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** `PARTIAL`; static challenges were preferred, and unsafe dynamic work remains explicit.
- **Claims:** `{C-042 UNKNOWN N/A; S-009,S-010,S-011}` `{C-043 UNKNOWN N/A; S-007,S-012,S-014,S-015,S-016,S-017,S-023}` `{C-044 UNKNOWN N/A; S-012,S-014,S-021}` `{C-045 UNKNOWN N/A; S-012,S-013,S-014,S-018}` `{C-046 UNKNOWN N/A; S-011,S-019,S-020}` `{C-047 UNKNOWN N/A; S-003,S-004,S-005,S-024,S-025}` `{C-048 UNKNOWN N/A; S-012,S-018}`

| Probe | Expected safe behavior defined before challenge | Actual bounded result | Result | Environment | Claims | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 Startup/no-op side effects | denied writes/network startup performs no undeclared effect and reports any required access | static trace found documented update-check and install-telemetry paths plus `--offline`; no denied-runtime trace | `NOT_RUN_UNSAFE` | no isolated empty HOME/network namespace available; target not run | C-042 | S-009,S-010,S-011 |
| P-02 Permission denial/approval bypass | every consequential capability is denied at a final enforcement point and alternate tool/extension/shell paths cannot bypass it | static paths show no default action-time approval and full-user shell/extension authority; invoking them on host would be unsafe | `NOT_RUN_UNSAFE` | static source only | C-020,C-043 | S-007,S-012,S-014,S-015 |
| P-03 Malformed/oversized input | missing/extra/wrong types and truncated/oversized calls fail before side effects with stable diagnostics | schema validation and token-truncated calls fail before execution; extra/oversized provider/context cases not run | `INCONCLUSIVE` | static source only | C-012,C-044 | S-012,S-014,S-021 |
| P-04 Cancellation/timeout | pre-dispatch/stream/tool cancellation stops work, kills descendants, fences late output, and leaves consistent state | signals propagate and shell attempts process-tree kill; exact cleanup/fencing/state not observed | `INCONCLUSIVE` | static source only | C-025,C-026,C-045 | S-012,S-013,S-014,S-018 |
| P-05 Retry/duplication/partial failure | finite backoff never duplicates non-idempotent effects and attributes every physical call | provider retry knobs and compaction retry exist; delivery ambiguity/idempotency/partial writes untested | `INCONCLUSIVE` | static source only | C-025,C-045,C-046 | S-011,S-019,S-020 |
| P-06 Concurrency/isolation collision | colliding sessions/workspaces are fenced, ordered, and cleaned without state bleed | one-agent prompt exclusion and parallel tool batches are static facts; cross-process collision not run | `NOT_RUN_UNSAFE` | no disposable two-process workspace | C-018,C-019,C-045 | S-012,S-013,S-018 |
| P-07 Crash/restart | interruption between writes recovers without silent loss/corruption/replay | direct append/rewrite and invalid-file rejection inspected; no interruption injected | `NOT_RUN_UNSAFE` | no disposable fault-injection runtime | C-017,C-045 | S-018 |
| P-08 Provider/model/network unavailable | DNS/auth/429/malformed/interrupted responses preserve cause, bound retry, expose sends, and do not silently switch provider | static explicit errors found; no provider/network mock executed | `NOT_RUN_UNSAFE` | no credentials; network/provider execution denied | C-046 | S-011,S-020 |
| P-09 Untrusted instruction injection | repository/tool/provider text remains data and cannot increase authority | project text is placed in system context; policy acknowledges prompt injection; no authority-changing exploit run | `NOT_RUN_UNSAFE` | unsafe without exact sink sandbox | C-030,C-035,C-043 | S-007,S-016,S-017 |
| P-10 Filesystem boundary abuse | traversal/absolute/symlink/case paths are contained at use time to an authorized root | static path utilities accept absolute/tilde paths and no workspace root policy was found; exploit not run | `NOT_RUN_UNSAFE` | no qualified filesystem sandbox | C-020,C-043 | S-007,S-014,S-023 |
| P-11 Resource/token/cost disagreement | estimates, all retries/cache usage, provider totals, and missing usage reconcile without coercing unknown to zero | source distinguishes provider usage and estimates but no provider-bill reconciliation or budget exhaustion occurred | `INCONCLUSIVE` | static source only | C-023,C-024,C-046 | S-019,S-020,S-028 |
| P-12 Install/update pin/rollback | exact artifact re-resolves without scripts; failed update leaves recoverable prior version with source mapping | exact tarball/hash/member safety and source diff verified; rebuild/update failure/rollback not run | `INCONCLUSIVE` | static tar/registry/git; no install | C-002,C-027,C-028,C-047 | S-003,S-004,S-005,S-024,S-025 |
| P-13 Claimed absence/disabled feature | production registry/search does not expose a built-in subagent, plan mode, MCP server, permission popup, or background-bash feature through aliases/config | README claim was challenged with production-source term search and exact built-in tool registry; only extension/comment references remained | `PASS` | bounded static universe: `packages/coding-agent/src`, `packages/agent/src`, excluding tests/examples/vendor noise where identified | C-011 | S-009,S-021,S-022 |
| P-14 Evidence loss/forgery | denied/failed/cancelled actions retain correlated, redacted, non-spoofable durable evidence | event/session schemas inspected; no injected collision/spoof/drop probe and no authentication found | `NOT_RUN_UNSAFE` | no dynamic event sink/tool sandbox | C-021,C-022,C-048 | S-012,S-018 |

- **Evidence:** S-003–S-005, S-007, S-009–S-025, S-028.
- **Boundary/scope:** no dynamic exploitation; `PASS` means only the explicit bounded P-13 expectation matched.
- **Unknowns:** C-042–C-048 remain open; skipped probes are not passes.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "At the 2026-08-24 cutoff, the official Pi repository tag v0.84.3 resolved to 4e58f324fae8ebfa98a3d45181fb248072a2afac, whose inspected checkout was clean and had no submodule entries."
  classification: FACT
  confidence: HIGH
  scope: "earendil-works/pi tag v0.84.3; local static checkout; excludes later refs"
  source_ids: [S-001]
  fact_dependencies: []
  method: "Compared git remote, full HEAD, exact tag, status, and submodule status in the pinned checkout."
  counterevidence: "none found in the pinned checkout identity commands"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "The inspected npm artifact is @earendil-works/pi-coding-agent@0.84.3 with the recorded SHA-512/SHA-1/SHA-256 digests, and its gitHead is two commits after the tag with no coding-agent source change."
  classification: FACT
  confidence: HIGH
  scope: "exact npm version and tarball; packages/coding-agent source diff only"
  source_ids: [S-002, S-003, S-004, S-005]
  fact_dependencies: []
  method: "Fetched exact registry metadata, rehashed the tarball, and compared tag..gitHead path/name diffs."
  counterevidence: "packages/coding-agent/CHANGELOG.md differs, but packages/coding-agent/src has an empty diff"
  adversarial_status: CHALLENGED
- claim_id: C-003
  section: provenance-license
  statement: "The pinned repository and coding-agent manifest declare MIT licensing, with repository copyright 2025 Mario Zechner and package author Mario Zechner."
  classification: FACT
  confidence: HIGH
  scope: "repository LICENSE and coding-agent/npm metadata; excludes dependency-license aggregate"
  source_ids: [S-002, S-003, S-006]
  fact_dependencies: []
  method: "Read license text and package metadata independently."
  counterevidence: "none found in LICENSE or exact package metadata"
  adversarial_status: SUPPORTED
- claim_id: C-004
  section: provenance-license
  statement: "The exact namespace/ownership/fork chronology and complete transitive dependency-license posture are not established for this dossier."
  classification: UNKNOWN
  confidence: N/A
  scope: "history before current earendil-works identity and all transitive package licenses"
  source_ids: [S-003, S-006, S-015]
  fact_dependencies: []
  method: "attempted_methods=current registry/repository/license inspection and compatibility-alias inspection; blocker=no bounded official chronology or full reviewed dependency-license report was located within budget; impact=legal provenance and aggregate redistribution conclusions remain incomplete; available_evidence=S-003,S-006,S-015; next_probe=obtain official organization/namespace transfer record and run an authorized lockfile license review"
  counterevidence: "old @mariozechner compatibility aliases remain in source"
  adversarial_status: CHALLENGED
- claim_id: C-005
  section: repository-package-map
  statement: "The pinned monorepo separates AI/provider, agent-loop, coding-agent, TUI, telemetry, protocol/client/server, SQLite session backend, and evaluation/example responsibilities into distinct workspace packages."
  classification: FACT
  confidence: HIGH
  scope: "workspace manifests at commit 4e58f324fae8ebfa98a3d45181fb248072a2afac"
  source_ids: [S-002, S-008, S-026]
  fact_dependencies: []
  method: "Enumerated workspace package manifests and traced root build order and coding-agent dependencies/exports."
  counterevidence: "presence does not prove each package is reached by the default CLI"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: executable-entrypoints
  statement: "The coding-agent package exposes a pi CLI, interactive/print/JSON/RPC modes, a root SDK library, an RPC entry, and a client library."
  classification: FACT
  confidence: HIGH
  scope: "coding-agent package and traced CLI source at v0.84.3"
  source_ids: [S-002, S-009, S-010, S-011]
  fact_dependencies: []
  method: "Matched package bin/exports to source CLI mode selection and SDK construction."
  counterevidence: "no default daemon invocation was found in these entrypoints"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: control-data-flow
  statement: "The default control flow converts prompts into provider streams, validates model tool calls, executes permitted tools, emits lifecycle events, appends results, and loops through steering/follow-up queues."
  classification: FACT
  confidence: HIGH
  scope: "generic Agent plus coding-agent SDK composition; static source"
  source_ids: [S-011, S-012, S-013]
  fact_dependencies: []
  method: "Traced prompt through Agent, runAgentLoop, streamFunction, prepare/execute/finalizeToolCall, and queue polling."
  counterevidence: "custom extensions/runtimes can alter hooks and context"
  adversarial_status: SUPPORTED
- claim_id: C-008
  section: module-extension-boundaries
  statement: "Pi extensions are imported in-process and can register or mutate tools, commands, handlers, providers, model/session behavior, UI, and subprocess execution."
  classification: FACT
  confidence: HIGH
  scope: "built-in extension/resource loader at v0.84.3"
  source_ids: [S-015, S-017]
  fact_dependencies: []
  method: "Inspected jiti module loading, ExtensionAPI methods, resource ordering, and conflict handling."
  counterevidence: "project trust can prevent project-local loading before trust, but does not sandbox loaded code"
  adversarial_status: CHALLENGED
- claim_id: C-009
  section: module-extension-boundaries
  statement: "Stable extension ABI version negotiation and independently verified unload/rollback semantics remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "built-in extension loader/reload across versions; third-party extensions excluded"
  source_ids: [S-009, S-015, S-017]
  fact_dependencies: []
  method: "attempted_methods=searched loader/resource/extension documentation for version negotiation, unload, reload, stale-context, and conflict behavior; blocker=no dynamic cross-version conformance probe and no stable ABI guarantee found; impact=extension upgrade/recovery compatibility cannot be assumed; available_evidence=S-009,S-015,S-017; next_probe=run a versioned extension conformance suite through load,reload,conflict,failure,and rollback"
  counterevidence: "source has old namespace aliases and stale-context invalidation, which are compatibility mechanisms but not an ABI guarantee"
  adversarial_status: CHALLENGED
- claim_id: C-010
  section: agent-interface
  statement: "One Agent object owns its transcript, model-loop lifecycle, tool dispatch, events, and steering/follow-up queues and permits only one active prompt run."
  classification: FACT
  confidence: HIGH
  scope: "one Agent instance in pi-agent-core v0.84.3"
  source_ids: [S-011, S-013]
  fact_dependencies: []
  method: "Inspected Agent state, prompt guard, loop configuration, event reduction, abort, and queue APIs."
  counterevidence: "multiple Agent/process instances remain possible"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: agent-interface
  statement: "No named built-in subagent or plan-mode control path exists in the bounded production source and built-in tool registry, while extensions can add such behavior."
  classification: FACT
  confidence: HIGH
  scope: "packages/coding-agent/src and packages/agent/src excluding tests/examples; exact built-in tool registry"
  source_ids: [S-009, S-021, S-022]
  fact_dependencies: []
  method: "Used documentation statement, production-source term search, and exact ToolName/registry enumeration as two independent static methods."
  counterevidence: "extension-oriented comments and documentation mention MCP/subagents as add-ons"
  adversarial_status: CHALLENGED
- claim_id: C-012
  section: tool-interface
  statement: "The loop validates registered tool arguments before execution, supports optional blocking hooks and sequential/parallel batches, and emits normalized tool lifecycle/results."
  classification: FACT
  confidence: HIGH
  scope: "agent loop and coding-agent built-in tools; custom tools may vary"
  source_ids: [S-011, S-012, S-014, S-021]
  fact_dependencies: []
  method: "Traced tool registry, prepareToolCall validation/hook, execution, exception mapping, and event/result emission."
  counterevidence: "blocking hook is optional and not a default approval gate"
  adversarial_status: CHALLENGED
- claim_id: C-013
  section: provider-interface
  statement: "Providers own auth, model catalog, and stream implementations while Models resolves auth/request adaptation and dispatches by model.provider."
  classification: FACT
  confidence: HIGH
  scope: "pi-ai provider collection and coding-agent SDK adaptation; no live provider"
  source_ids: [S-011, S-020]
  fact_dependencies: []
  method: "Inspected Provider/Models contracts, applyAuth, dispatch, and SDK stream wrapper."
  counterevidence: "provider-specific transport/retry internals are delegated and were not observed"
  adversarial_status: SUPPORTED
- claim_id: C-014
  section: model-interface
  statement: "Model selection uses provider/id plus API, capability, context/token, reasoning, and cost metadata, and requested thinking is clamped to declared capability."
  classification: FACT
  confidence: HIGH
  scope: "model contracts and coding-agent SDK at v0.84.3; static catalogs"
  source_ids: [S-011, S-020]
  fact_dependencies: []
  method: "Traced model restore/default resolution, capability clamp, provider lookup, and cost metadata functions."
  counterevidence: "live catalog accuracy and capability negotiation were not tested"
  adversarial_status: SUPPORTED
- claim_id: C-015
  section: context-interface
  statement: "The default model context combines a fixed system prompt, active tools, project/global instruction files, skills, extension transforms, and lossy usage-triggered compaction while retaining full JSONL history."
  classification: FACT
  confidence: HIGH
  scope: "default resource/system-prompt/compaction paths at v0.84.3"
  source_ids: [S-009, S-016, S-017, S-019]
  fact_dependencies: []
  method: "Inspected prompt construction/order, context discovery, SDK transform, token estimate/trigger, and summarization."
  counterevidence: "resources can be disabled/replaced and extensions can transform context"
  adversarial_status: CHALLENGED
- claim_id: C-016
  section: state-persistence-restart
  statement: "Coding-agent sessions are optional append-only parent-linked JSONL trees with synchronous creation/append/rewrite, branching, compaction entries, and migration on open."
  classification: FACT
  confidence: HIGH
  scope: "coding-agent SessionManager; excludes sibling generic SQLite backend"
  source_ids: [S-009, S-018]
  fact_dependencies: []
  method: "Inspected constructor/open/migrate, persistence writes, entry APIs, context traversal, and branch operations."
  counterevidence: "rewrite mutates the physical file and append-only describes logical entries, not immutable storage bytes"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: state-persistence-restart
  statement: "Crash consistency, torn-write recovery, retention, and deletion audit for coding-agent JSONL sessions remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "coding-agent JSONL sessions under interruption/restart"
  source_ids: [S-018]
  fact_dependencies: []
  method: "attempted_methods=inspected open/parse/migrate/rewrite/append code and invalid-file diagnostics; blocker=no authorized disposable crash-at-write execution and no transactional recovery specification; impact=session loss, corruption, or ambiguous replay cannot be qualified; available_evidence=S-018; next_probe=fault-inject before,during,and after exclusive create,append,rewrite,and migration then reopen"
  counterevidence: "invalid non-empty explicit files are rejected, but that does not prove torn-write recovery"
  adversarial_status: NOT_PROBED
- claim_id: C-018
  section: concurrency-worktree-isolation
  statement: "One Agent serializes prompt runs but tool calls may execute in parallel, and coding-agent session identity is based on cwd/session ID/file without a traced cross-process worktree or tenant fence."
  classification: FACT
  confidence: HIGH
  scope: "Agent and coding-agent SessionManager/resource paths; static source"
  source_ids: [S-011, S-012, S-013, S-017, S-018]
  fact_dependencies: []
  method: "Inspected active-run guard, tool execution mode, queue semantics, session keys, and context worktree handling; searched these paths for locking/fencing."
  counterevidence: "some package-install paths use proper-lockfile and generic SQLite backend has separate semantics, neither proves session/worktree isolation"
  adversarial_status: CHALLENGED
- claim_id: C-019
  section: concurrency-worktree-isolation
  statement: "Cross-process session collision, parallel file-edit ordering, and cancellation cleanup race behavior remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "two coding-agent processes/sessions sharing logical names/files/workspace"
  source_ids: [S-013, S-018]
  fact_dependencies: []
  method: "attempted_methods=static active-run/session persistence inspection and lock/fence reference search; blocker=no disposable two-process workspace and no dynamic race harness; impact=state bleed, lost updates, and nondeterministic cleanup cannot be excluded; available_evidence=S-013,S-018; next_probe=run two isolated processes against colliding session IDs/files and parallel same-file tools with deterministic barriers"
  counterevidence: "single-Agent prompt guard does not cover multiple processes"
  adversarial_status: NOT_PROBED
- claim_id: C-020
  section: permissions-authority-sandbox
  statement: "Default Pi runs shell, file tools, and loaded extensions with the invoking user's ambient authority and intentionally provides no built-in sandbox or action-time permission popup."
  classification: FACT
  confidence: HIGH
  scope: "default local coding-agent at v0.84.3; external container/VM excluded"
  source_ids: [S-007, S-009, S-012, S-014, S-015, S-017, S-023]
  fact_dependencies: []
  method: "Triangulated official security policy/README with shell spawn, absolute path resolution, extension import, project trust, and optional hook source."
  counterevidence: "tool allowlists/project trust/optional hooks can reduce selected paths but do not constitute default sandboxing"
  adversarial_status: CHALLENGED
- claim_id: C-021
  section: evidence-observability
  statement: "Agent lifecycle/tool events and coding-agent JSONL entries expose session-local correlation, transcript changes, errors, and usage for inspection/export."
  classification: FACT
  confidence: HIGH
  scope: "generic Agent events and coding-agent JSONL/JSON mode"
  source_ids: [S-009, S-012, S-013, S-018]
  fact_dependencies: []
  method: "Inspected event union/emission/reduction, session entry persistence, and documented JSON/export surfaces."
  counterevidence: "not every transient/external side effect is a durable event"
  adversarial_status: SUPPORTED
- claim_id: C-022
  section: evidence-observability
  statement: "Pi's local session evidence is inspectable but not tamper-resistant against the invoking user or in-process extensions."
  classification: INFERENCE
  confidence: HIGH
  scope: "ordinary JSONL/session files and declared local-user trust boundary"
  source_ids: [S-007, S-018]
  fact_dependencies: [C-016, C-020, C-021]
  method: "reasoning=plain user-writable append/rewrite plus same-user/in-process trust implies those actors can alter evidence; assumptions=no external immutable collector wraps files; alternative=an embedding host could export events to a tamper-resistant store"
  counterevidence: "no built-in signature/hash chain was found in the inspected session manager"
  adversarial_status: CHALLENGED
- claim_id: C-023
  section: resource-token-cost-accounting
  statement: "Pi aggregates provider-reported assistant/tool/summary token usage and computes model-rate costs while using estimates for trailing context without valid usage."
  classification: FACT
  confidence: HIGH
  scope: "static usage/cost/context code and TUI documentation"
  source_ids: [S-009, S-019, S-020, S-028]
  fact_dependencies: []
  method: "Inspected context usage fallback, cost formula, session usage grouping, and documented footer totals."
  counterevidence: "local estimates are not provider billing measurements"
  adversarial_status: CHALLENGED
- claim_id: C-024
  section: resource-token-cost-accounting
  statement: "Agreement among estimates, physical retries/cache traffic, streamed usage, provider billing, and missing-usage handling remains unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "live provider requests, retries, caching, summaries, and tool-reported usage"
  source_ids: [S-019, S-020, S-028]
  fact_dependencies: []
  method: "attempted_methods=inspected usage aggregation,cost calculation,context estimate,and retry option paths; blocker=no live/mock provider transcript with independent physical-request and billing totals; impact=complete cost allocation and budget enforcement cannot be asserted; available_evidence=S-019,S-020,S-028; next_probe=use a deterministic mock provider that records every retry/cache request and emits missing/contradictory usage"
  counterevidence: "source distinguishes estimates and reported usage but does not independently reconcile bills"
  adversarial_status: NOT_PROBED
- claim_id: C-025
  section: failure-cancellation-retry
  statement: "Static failure paths preserve validation/tool/provider errors, deny truncated tool calls, propagate one abort signal, attempt shell process-tree kill, and configure bounded provider/summary retries."
  classification: FACT
  confidence: HIGH
  scope: "generic loop plus coding-agent SDK/shell/compaction/provider contracts"
  source_ids: [S-011, S-012, S-013, S-014, S-019, S-020]
  fact_dependencies: []
  method: "Traced error branches, abort controller/signal, shell kill/timeout, retry option forwarding, and compaction retry choke point."
  counterevidence: "source propagation is not runtime proof of descendant termination or delivery semantics"
  adversarial_status: CHALLENGED
- claim_id: C-026
  section: failure-cancellation-retry
  statement: "Verified descendant termination, late-result fencing, retry idempotency, partial-write recovery, and all-platform cancellation behavior remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "provider, tool, descendant process, and session side effects under cancellation/retry"
  source_ids: [S-012, S-013, S-014, S-018]
  fact_dependencies: []
  method: "attempted_methods=static signal,process-tree,parallel-tool,event,and session-write tracing; blocker=no disposable cross-platform fault-injection environment; impact=late effects,duplicates,and ambiguous completion cannot be excluded; available_evidence=S-012,S-013,S-014,S-018; next_probe=barrier-controlled cancellation before dispatch,during stream,during child/grandchild execution,and between session writes on each supported OS"
  counterevidence: "killProcessTree is called, but successful verified cleanup was not observed"
  adversarial_status: NOT_PROBED
- claim_id: C-027
  section: install-update-release
  statement: "The exact npm artifact re-resolves with matching registry hashes and safe member names, while checked-in release workflows require build/check/test and stage signed/provenance-described npm and multi-platform release outputs."
  classification: FACT
  confidence: HIGH
  scope: "npm tarball 0.84.3 and pinned workflow definitions; signatures/attestation not independently verified"
  source_ids: [S-002, S-003, S-004, S-005, S-009, S-024, S-025]
  fact_dependencies: []
  method: "Rehashed/listed exact tarball and inspected package scripts, CI, release workflow, and install documentation."
  counterevidence: "registry gitHead differs from tag and no local rebuild was performed"
  adversarial_status: CHALLENGED
- claim_id: C-028
  section: install-update-release
  statement: "Byte-for-byte reproducible build, signature/attestation verification, failed-update behavior, migration, and rollback remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "source-to-npm/binary build and updater failure/rollback at v0.84.3"
  source_ids: [S-003, S-004, S-005, S-024, S-025]
  fact_dependencies: []
  method: "attempted_methods=registry metadata/tarball hash/member inspection,tag-to-gitHead source diff,and release-workflow review; blocker=no authorized hermetic rebuild,signature-chain validation,or disposable failed update; impact=full source-byte identity and rollback safety cannot be asserted; available_evidence=S-003,S-004,S-005,S-024,S-025; next_probe=hermetically rebuild exact gitHead/tag inputs,verify npm attestations,and fault-inject updater with a retained prior installation"
  counterevidence: "coding source is unchanged but CHANGELOG and commit identity differ"
  adversarial_status: NOT_PROBED
- claim_id: C-029
  section: tests-qualification
  statement: "The pinned tree contains broad AI/agent/coding-agent tests and CI definitions that run build, check, and tests, but this dossier did not execute them."
  classification: FACT
  confidence: HIGH
  scope: "checked-in tests/scripts/workflows; no CI-run-result claim"
  source_ids: [S-002, S-008, S-024, S-027]
  fact_dependencies: []
  method: "Counted test/spec files and inspected root/package scripts and CI workflow commands/matrices."
  counterevidence: "test presence/configuration does not establish pass status or production reachability"
  adversarial_status: CHALLENGED
- claim_id: C-030
  section: security
  statement: "Pi's official and implemented security posture trusts the local user/repository/resources, excludes built-in sandbox and prompt-injection protection, and relies on external containment and source review for risky extensions/packages."
  classification: FACT
  confidence: HIGH
  scope: "official SECURITY.md plus default local execution/resource code"
  source_ids: [S-007, S-009, S-014, S-015, S-017, S-023]
  fact_dependencies: []
  method: "Compared policy text to shell,path,extension,and trust implementations."
  counterevidence: "schema validation and project trust are controls but do not contradict the declared boundary"
  adversarial_status: CHALLENGED
- claim_id: C-031
  section: strengths
  statement: "Pi's explicit TypeScript provider, model, stream, tool, event, SDK, and extension seams provide strong experimentation and embedding leverage when Pi may own the loop."
  classification: INFERENCE
  confidence: HIGH
  scope: "developer leverage, not policy/sandbox suitability"
  source_ids: [S-011, S-012, S-015, S-020]
  fact_dependencies: [C-007, C-008, C-012, C-013]
  method: "reasoning=replaceable typed contracts and factories reduce integration surface; assumptions=embedding accepts in-process TypeScript and Pi loop authority; alternative=a narrower protocol-only integration may offer less coupling"
  counterevidence: "extension ABI/runtime behavior is partly unknown under C-009"
  adversarial_status: SUPPORTED
- claim_id: C-032
  section: strengths
  statement: "Parent-linked append-only session entries with explicit compaction and usage provide inspectable conversation history within Pi's transcript scope."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "conversation transcript inspection; excludes canonical domain facts and crash guarantees"
  source_ids: [S-009, S-018, S-019]
  fact_dependencies: [C-015, C-016, C-023]
  method: "reasoning=preserved entries/branches/summaries expose how active context was derived; assumptions=session file remains intact; alternative=corruption/tampering can reduce trustworthiness"
  counterevidence: "C-017 and C-022 limit durability/tamper claims"
  adversarial_status: SUPPORTED
- claim_id: C-033
  section: liabilities
  statement: "Ambient user authority and in-process extensions make default Pi unsuitable as an enforcement or sandbox boundary for untrusted actions."
  classification: INFERENCE
  confidence: HIGH
  scope: "default local configuration; external qualified sandbox excluded"
  source_ids: [S-007, S-014, S-015, S-023]
  fact_dependencies: [C-008, C-020, C-030]
  method: "reasoning=an enforcement boundary cannot rely on code/actions holding the same ambient authority it must constrain; assumptions=actions may be untrusted; alternative=all inputs/extensions are trusted or an external sandbox contains the process"
  counterevidence: "upstream recommends external containment, which mitigates rather than contradicts the liability"
  adversarial_status: CHALLENGED
- claim_id: C-034
  section: liabilities
  statement: "Using the default AgentSession below another authoritative orchestrator would preserve competing loop, tool, retry, and transcript-state ownership unless those mechanisms were replaced."
  classification: INFERENCE
  confidence: HIGH
  scope: "default SDK composition as a substrate, not extracted low-level utilities"
  source_ids: [S-011, S-012, S-018, S-020]
  fact_dependencies: [C-007, C-010, C-013, C-016, C-025]
  method: "reasoning=the default session directly owns each listed lifecycle decision; assumptions=the outer orchestrator requires sole authority; alternative=use only narrow extracted provider/tool types and not AgentSession"
  counterevidence: "SDK permits component replacement, but removal completeness was not designed here"
  adversarial_status: CHALLENGED
- claim_id: C-035
  section: context-interface
  statement: "Concatenating project instructions into system context without typed taint makes context contamination a material authority-selection risk when tools have ambient authority."
  classification: INFERENCE
  confidence: HIGH
  scope: "trusted-resource loading followed by model tool selection; no claim of deterministic exploit"
  source_ids: [S-007, S-016, S-017]
  fact_dependencies: [C-015, C-020, C-030]
  method: "reasoning=repository prose can influence model decisions while tools remain powerful and no typed authority separation exists; assumptions=model may follow injected text; alternative=disable context resources or externally enforce every sink"
  counterevidence: "XML-like path labels preserve human-readable provenance but not authority"
  adversarial_status: CHALLENGED
- claim_id: C-036
  section: transferable-patterns
  statement: "Validate-before-execute, fail-closed truncated tool calls, and typed lifecycle events are a CANDIDATE pattern if final policy remains external."
  classification: INFERENCE
  confidence: HIGH
  scope: "clean-room pattern; no adoption authority"
  source_ids: [S-012, S-021]
  fact_dependencies: [C-007, C-012, C-025]
  method: "reasoning=early structural denial reduces malformed side effects and events expose outcomes; assumptions=separate sink policy adds authorization; alternative=without sink policy the pattern is validation only"
  counterevidence: "optional hooks/default ambient authority prevent treating it as complete enforcement"
  adversarial_status: SUPPORTED
- claim_id: C-037
  section: transferable-patterns
  statement: "Parent-linked transcript entries with explicit compaction records are a CONDITIONAL pattern when separated from canonical domain facts and strengthened transactionally."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "clean-room transcript/projection pattern"
  source_ids: [S-018, S-019]
  fact_dependencies: [C-015, C-016, C-017, C-022]
  method: "reasoning=tree/summary records preserve context evolution; assumptions=a durable writer and provenance are added; alternative=a database event ledger may subsume this mechanism"
  counterevidence: "current JSONL crash/tamper guarantees are insufficient"
  adversarial_status: CHALLENGED
- claim_id: C-038
  section: transferable-patterns
  statement: "Provider-owned typed streaming behind a registry is a CONDITIONAL pattern because physical-call retry and accounting visibility must be added or proven."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "clean-room provider abstraction"
  source_ids: [S-011, S-020]
  fact_dependencies: [C-013, C-023, C-024, C-025]
  method: "reasoning=typed dispatch centralizes adaptation but delegated retries can hide physical sends; assumptions=complete call visibility is required; alternative=one lower-level transport adapter per provider"
  counterevidence: "static hooks expose some payload/response data but live completeness is unknown"
  adversarial_status: CHALLENGED
- claim_id: C-039
  section: rejected-patterns-curiosity-no-go
  statement: "Using Pi's in-process extension loader as an untrusted plugin boundary is CURIOSITY_NO_GO for the pinned architecture scenario."
  classification: INFERENCE
  confidence: HIGH
  scope: "untrusted extensions under a least-authority requirement"
  source_ids: [S-007, S-015]
  fact_dependencies: [C-008, C-020, C-030, C-033]
  method: "reasoning=in-process arbitrary execution joins the trusted computing base; assumptions=plugin is untrusted; alternative=reviewed trusted extensions remain usable as TCB code"
  counterevidence: "project trust gates loading but does not confine execution"
  adversarial_status: CHALLENGED
- claim_id: C-040
  section: rejected-patterns-curiosity-no-go
  statement: "Treating model-driven self-extension as a permission, human-approval, or sandbox substitute is CURIOSITY_NO_GO."
  classification: INFERENCE
  confidence: HIGH
  scope: "skills/extensions authored or selected through model interaction"
  source_ids: [S-007, S-009, S-015, S-016]
  fact_dependencies: [C-008, C-015, C-020, C-030, C-035]
  method: "reasoning=model-influenced content cannot legitimately authorize itself and loaded code has ambient authority; assumptions=binding approval must be external; alternative=self-extension remains useful for non-authoritative workflow customization"
  counterevidence: "README advertises building/installing missing features, which is capability positioning rather than authorization evidence"
  adversarial_status: CHALLENGED
- claim_id: C-041
  section: rejected-patterns-curiosity-no-go
  statement: "Popularity research, broad rename archaeology, and post-cutoff HEAD analysis are CURIOSITY_NO_GO because they cannot change the pinned decision-critical authority findings within budget."
  classification: INFERENCE
  confidence: HIGH
  scope: "this snapshot-bounded dossier and current comparison decision"
  source_ids: [S-001, S-003, S-005, S-022]
  fact_dependencies: [C-001, C-002, C-011, C-020]
  method: "reasoning=identity/authority/source equivalence are already pinned and social/newer history would not discriminate them; assumptions=decision remains snapshot-specific; alternative=a separately assigned legal-history or newer-release study could justify the work"
  counterevidence: "exact rename chronology remains unknown but is not needed for runtime boundary findings"
  adversarial_status: NOT_APPLICABLE:research-thread-disposition
- claim_id: C-042
  section: adversarial-probes
  statement: "Denied-network/denied-write startup and no-op side effects remain unknown because no safely isolated target process was run."
  classification: UNKNOWN
  confidence: N/A
  scope: "CLI help/no-op/interactive startup across empty HOME and offline/online settings"
  source_ids: [S-009, S-010, S-011]
  fact_dependencies: []
  method: "attempted_methods=static CLI/startup/settings trace and documentation review for update,telemetry,and offline switches; blocker=no disposable empty-HOME filesystem plus denied-network syscall tracing environment was authorized/available; impact=undeclared startup reads,writes,processes,or network cannot be excluded; available_evidence=S-009,S-010,S-011; next_probe=run exact package in a no-secrets container with read-only workspace,empty HOME,network namespace denial,and syscall/process tracing"
  counterevidence: "documentation declares startup update/telemetry calls unless disabled"
  adversarial_status: NOT_PROBED
- claim_id: C-043
  section: adversarial-probes
  statement: "Runtime permission bypass, instruction-injection authority change, and filesystem escape behavior remain unknown because exploitation without qualified containment was unsafe."
  classification: UNKNOWN
  confidence: N/A
  scope: "built-in/custom tools,project resources,extensions,absolute/traversal/symlink paths"
  source_ids: [S-007, S-012, S-014, S-015, S-016, S-017, S-023]
  fact_dependencies: []
  method: "attempted_methods=static security-policy,tool-hook,shell,path,extension,prompt,and trust tracing plus bounded reference searches; blocker=no exact disposable sandbox with fake credentials and monitored sinks; impact=alternate-path enforcement and exploit consequences are unqualified; available_evidence=S-007,S-012,S-014,S-015,S-016,S-017,S-023; next_probe=use a qualified sandbox to deny each sink and challenge tool aliases,extensions,absolute/traversal/symlink/case paths,and instruction-like content"
  counterevidence: "static evidence shows ambient authority/no root containment, making host execution inappropriate"
  adversarial_status: NOT_PROBED
- claim_id: C-044
  section: adversarial-probes
  statement: "Dynamic malformed, extra, wrong-type, and oversized agent/tool/provider/model/context boundary behavior remains partly unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "all external and model-produced schemas at v0.84.3"
  source_ids: [S-012, S-014, S-021]
  fact_dependencies: []
  method: "attempted_methods=inspected TypeBox tool schemas,validateToolArguments,timeout bounds,and truncated-tool denial; blocker=no isolated provider/tool fuzz harness and no documented global size ceilings; impact=diagnostic stability,memory pressure,and pre-side-effect rejection are incomplete; available_evidence=S-012,S-014,S-021; next_probe=fuzz each boundary with missing,extra,wrong-type,deep,numeric-edge,and oversized payloads using side-effect sentinels"
  counterevidence: "static tool validation and truncation denial cover only part of the challenge"
  adversarial_status: CHALLENGED
- claim_id: C-045
  section: adversarial-probes
  statement: "Dynamic cancellation, retry duplication, concurrency collision, and crash/restart outcomes remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "provider streams,parallel tools,process trees,JSONL writes,and two sessions/processes"
  source_ids: [S-012, S-013, S-014, S-018]
  fact_dependencies: []
  method: "attempted_methods=static lifecycle/signal/parallel-execution/process-kill/session-write tracing; blocker=no disposable barrier-controlled multi-process fault environment; impact=late effects,duplicates,state bleed,corruption,and cleanup cannot be qualified; available_evidence=S-012,S-013,S-014,S-018; next_probe=inject deterministic barriers/failures at dispatch,stream,tool child/grandchild,and every session write with colliding sessions"
  counterevidence: "single-run guards and process-tree kill attempts address but do not prove outcomes"
  adversarial_status: NOT_PROBED
- claim_id: C-046
  section: adversarial-probes
  statement: "Provider/network failure preservation, physical-request retry visibility, and usage/cost reconciliation remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "auth,DNS,429,malformed/interrupted streams,retries,cache,and billing"
  source_ids: [S-011, S-019, S-020]
  fact_dependencies: []
  method: "attempted_methods=static provider dispatch,error,retry-option,usage,and cost inspection; blocker=no deterministic mock/live provider run and no independent billing ledger; impact=delivery ambiguity,hidden sends,fallback,and cost completeness cannot be asserted; available_evidence=S-011,S-019,S-020; next_probe=route through a local scripted provider recording each request and injecting auth,rate-limit,malformed,drop,missing-usage,and contradictory-usage responses"
  counterevidence: "typed errors/options exist but are not runtime observations"
  adversarial_status: NOT_PROBED
- claim_id: C-047
  section: adversarial-probes
  statement: "Reproducible build, failed update, migration, and rollback behavior remain unknown despite exact artifact re-resolution."
  classification: UNKNOWN
  confidence: N/A
  scope: "npm/binary build and package/self updater at 0.84.3"
  source_ids: [S-003, S-004, S-005, S-024, S-025]
  fact_dependencies: []
  method: "attempted_methods=exact registry/tarball hash/member check,tag-to-gitHead diff,and release workflow inspection; blocker=no hermetic build or disposable prior-version updater execution; impact=source-byte reproducibility and recoverable update failure remain unqualified; available_evidence=S-003,S-004,S-005,S-024,S-025; next_probe=rebuild in pinned hermetic toolchain then interrupt update before download,replace,migration,and announcement while retaining prior bytes"
  counterevidence: "coding source equality narrows but does not eliminate build-input/output uncertainty"
  adversarial_status: CHALLENGED
- claim_id: C-048
  section: adversarial-probes
  statement: "Event/session evidence loss, redaction failure, correlation collision, and untrusted-field forgery behavior remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "failed,denied,cancelled,and malicious tool/provider/session event inputs"
  source_ids: [S-012, S-018]
  fact_dependencies: []
  method: "attempted_methods=static event/result/session schema and plain JSONL persistence inspection; blocker=no dynamic event sink with malicious IDs/fields,secrets,duplicates,and dropped listeners; impact=audit completeness and spoof resistance cannot be established; available_evidence=S-012,S-018; next_probe=inject denied,failed,cancelled,duplicate,and spoofed events/tool outputs and compare stream,JSONL,export,and external sink"
  counterevidence: "event IDs and ordered emission aid correlation but do not authenticate records"
  adversarial_status: NOT_PROBED
```

## 27. Source ledger {#source-ledger}

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Pinned repository identity and checkout state"
  url: "https://github.com/earendil-works/pi/tree/4e58f324fae8ebfa98a3d45181fb248072a2afac"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "N/A:not-a-package-artifact"
  code_path: "N/A:repository-state"
  symbol: "git remote/rev-parse/describe/status/submodule"
  line_anchor: "N/A:command-output"
  command: "git remote -v && git rev-parse HEAD && git describe --tags --exact-match && git status --short && git submodule status"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static partial clone checkout; no target execution; network not required"
  output_or_hash: "inline:origin=https://github.com/earendil-works/pi.git; HEAD=4e58f324fae8ebfa98a3d45181fb248072a2afac; tag=v0.84.3; status=<empty>; submodules=<empty>"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-041]
  notes: "Selected as direct immutable identity evidence; preferable to repository landing-page labels."
- source_id: S-002
  source_kind: repository-file
  title: "Coding-agent package manifest"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/package.json#L1-L106"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/package.json"
  symbol: "name/version/bin/exports/files/scripts/dependencies/license/repository/engines"
  line_anchor: "L1-L106"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/package.json"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; network not required"
  output_or_hash: "inline:name=@earendil-works/pi-coding-agent; version=0.84.3; bin.pi=dist/bundle/cli.js; license=MIT; node>=22.19.0"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-005, C-006, C-027, C-029]
  notes: "Selected for exact package surface/build metadata; repository source is preferable to a mutable npm landing page."
- source_id: S-003
  source_kind: release-metadata
  title: "Exact npm registry version metadata"
  url: "https://registry.npmjs.org/@earendil-works%2fpi-coding-agent/0.84.3"
  commit_or_ref: "npm:0.84.3"
  resolved_commit: "bfb004d4418ff05c6f909eaaab856cbe75c1fde0"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "N/A:registry-document"
  symbol: "dist/gitHead/signatures/attestations/_npmUser/maintainers"
  line_anchor: "N/A:JSON-document"
  command: "curl -fsSL https://registry.npmjs.org/@earendil-works%2fpi-coding-agent/0.84.3"
  command_environment: "passive HTTPS retrieval; exact immutable version endpoint; network required; no package execution"
  output_or_hash: "inline:version=0.84.3; gitHead=bfb004d4418ff05c6f909eaaab856cbe75c1fde0; fileCount=1044; shasum=c040a5c2cfacd996731ce302a323269f124c8bdc; integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-004, C-027, C-028, C-041, C-047]
  notes: "Selected as registry origin for digest/gitHead/publisher claims; signatures and attestation URL were recorded but not cryptographically verified."
- source_id: S-004
  source_kind: package-artifact
  title: "Static npm tarball integrity and member-safety probe"
  url: "https://registry.npmjs.org/@earendil-works/pi-coding-agent/-/pi-coding-agent-0.84.3.tgz"
  commit_or_ref: "npm:0.84.3"
  resolved_commit: "bfb004d4418ff05c6f909eaaab856cbe75c1fde0"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "pi-coding-agent-0.84.3.tgz"
  symbol: "tar members and cryptographic digests"
  line_anchor: "N/A:binary-artifact"
  command: "shasum -a 1 pi-coding-agent-0.84.3.tgz && shasum -a 256 pi-coding-agent-0.84.3.tgz && openssl dgst -sha512 -binary pi-coding-agent-0.84.3.tgz | openssl base64 -A && tar -tzf pi-coding-agent-0.84.3.tgz"
  command_environment: "macOS 27.0 arm64; bsdtar 3.5.3/libarchive 3.7.4; OpenSSL 3.6.3; static inspection; scripts not run"
  output_or_hash: "inline:members=1044; unsafe absolute-or-dotdot members=none; symlinks=none; sha1=c040a5c2cfacd996731ce302a323269f124c8bdc; sha256=d07dc417f78a14dac376a878b6556b51961f118f79771ee375333dc51356bc75; sha512-base64=Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  access_date: "2026-08-24"
  supports_claims: [C-002, C-027, C-028, C-047]
  notes: "Selected as exact distributed bytes; retained locally only for this research session, so all decision-relevant outputs are inline."
- source_id: S-005
  source_kind: runtime-observation
  title: "Tag-to-npm-gitHead source comparison"
  url: "https://github.com/earendil-works/pi/compare/4e58f324fae8ebfa98a3d45181fb248072a2afac...bfb004d4418ff05c6f909eaaab856cbe75c1fde0"
  commit_or_ref: "4e58f324fae8ebfa98a3d45181fb248072a2afac..bfb004d4418ff05c6f909eaaab856cbe75c1fde0"
  resolved_commit: "bfb004d4418ff05c6f909eaaab856cbe75c1fde0"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent"
  symbol: "git rev-list/log/diff --name-status"
  line_anchor: "N/A:command-output"
  command: "git rev-list --count 4e58f324fae8ebfa98a3d45181fb248072a2afac..bfb004d4418ff05c6f909eaaab856cbe75c1fde0 && git diff --name-status 4e58f324fae8ebfa98a3d45181fb248072a2afac bfb004d4418ff05c6f909eaaab856cbe75c1fde0 -- packages/coding-agent && git diff --name-status 4e58f324fae8ebfa98a3d45181fb248072a2afac bfb004d4418ff05c6f909eaaab856cbe75c1fde0 -- packages/coding-agent/src"
  command_environment: "macOS 27.0 arm64; git 2.54.0; local object database; target not executed"
  output_or_hash: "inline:commit_count=2; commits=31d4ed58,bfb004d4; changed coding path=M packages/coding-agent/CHANGELOG.md; changed coding src=<empty>"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-027, C-028, C-041, C-047]
  notes: "Selected to discriminate an apparent tag/gitHead contradiction; exact source path diff is preferable to assuming tag equality."
- source_id: S-006
  source_kind: license
  title: "Repository MIT license"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/LICENSE#L1-L20"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "N/A:repository-license"
  code_path: "LICENSE"
  symbol: "MIT License"
  line_anchor: "L1-L20"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:LICENSE"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source"
  output_or_hash: "inline:MIT License; Copyright (c) 2025 Mario Zechner; notice retention and AS-IS disclaimer"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-004]
  notes: "Selected as controlling repository license text; preferable to manifest shorthand alone."
- source_id: S-007
  source_kind: official-documentation
  title: "Official security policy and trust boundary"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/SECURITY.md#L1-L87"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "N/A:repository-policy"
  code_path: "SECURITY.md"
  symbol: "security boundary/reporting/scope"
  line_anchor: "L1-L87"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:SECURITY.md"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source"
  output_or_hash: "inline:local user and writable files are one boundary; no intentional sandbox; prompt injection and untrusted resources are out of vulnerability scope; private reporting documented"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-022, C-030, C-033, C-035, C-039, C-040, C-043]
  notes: "Selected as first-party policy, then checked against code; policy alone is not runtime enforcement evidence."
- source_id: S-008
  source_kind: repository-file
  title: "Root workspace/build/test manifest"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/package.json#L1-L73"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "N/A:private-workspace-root"
  code_path: "package.json"
  symbol: "workspaces/scripts/engines"
  line_anchor: "L1-L73"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:package.json"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source"
  output_or_hash: "inline:private workspace; packages/* and session backend/example workspaces; build order; check/test/release scripts; node>=22.19.0"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-029]
  notes: "Selected for authoritative workspace and command topology."
- source_id: S-009
  source_kind: official-documentation
  title: "Coding-agent README"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/README.md#L15-L705"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/README.md"
  symbol: "quick start/modes/sessions/trust/telemetry/context/customization/philosophy/CLI"
  line_anchor: "L15-L705"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/README.md"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source"
  output_or_hash: "inline:four modes; four default tools/eight available built-ins; JSONL sessions; project trust; update/telemetry/offline; context/extensions/skills; documented absent built-ins"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-009, C-011, C-015, C-016, C-020, C-021, C-023, C-027, C-030, C-032, C-040, C-042]
  notes: "Selected as first-party user contract; marketing terms such as minimal were challenged against source."
- source_id: S-010
  source_kind: repository-file
  title: "CLI composition and mode selection"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/src/main.ts#L1-L124"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/src/main.ts"
  symbol: "main/resolveAppMode"
  line_anchor: "L1-L124"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/src/main.ts | nl -ba | sed -n '1,124p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; target not run"
  output_or_hash: "inline:main translates CLI args to session services; mode resolves rpc,json,print,interactive; imports interactive/print/rpc runners"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-042]
  notes: "Selected to establish reachable composition rather than infer it from README mode names."
- source_id: S-011
  source_kind: repository-file
  title: "SDK session construction, tools, model, provider adaptation"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/src/core/sdk.ts#L45-L372"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/src/core/sdk.ts"
  symbol: "CreateAgentSessionOptions/createAgentSession"
  line_anchor: "L45-L372"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/src/core/sdk.ts | nl -ba | sed -n '45,372p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source"
  output_or_hash: "inline:default tools read/bash/edit/write; default session/resource/model runtimes; model restore/clamp; provider timeout/retry/header hooks; Agent construction"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-007, C-010, C-012, C-013, C-014, C-018, C-021, C-025, C-031, C-034, C-038, C-042, C-046]
  notes: "Selected as coding-agent composition root, preferable to isolated factory names."
- source_id: S-012
  source_kind: repository-file
  title: "Agent loop and tool execution pipeline"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/agent/src/agent-loop.ts#L95-L796"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "N/A:repository-source-for-sibling-package"
  code_path: "packages/agent/src/agent-loop.ts"
  symbol: "runLoop/streamAssistantResponse/executeToolCalls/prepareToolCall/executePreparedToolCall"
  line_anchor: "L95-L796"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/agent/src/agent-loop.ts | nl -ba | sed -n '95,796p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source"
  output_or_hash: "inline:provider loop and queues; truncated tool calls denied; sequential/parallel execution; schema validation; optional block; signal; lifecycle/result events"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-012, C-018, C-020, C-021, C-025, C-026, C-031, C-034, C-036, C-043, C-044, C-045, C-048]
  notes: "Selected as primary executable control-flow origin."
- source_id: S-013
  source_kind: repository-file
  title: "Stateful Agent lifecycle and queues"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/agent/src/agent.ts#L167-L589"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "N/A:repository-source-for-sibling-package"
  code_path: "packages/agent/src/agent.ts"
  symbol: "Agent"
  line_anchor: "L167-L589"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/agent/src/agent.ts | nl -ba | sed -n '167,589p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source"
  output_or_hash: "inline:Agent owns transcript/events/tools/queues; one active run; abort controller; prompt/continue errors; listener settlement"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-010, C-018, C-019, C-021, C-025, C-026, C-045]
  notes: "Selected to distinguish object-level lifecycle authority from low-level loop functions."
- source_id: S-014
  source_kind: repository-file
  title: "Default local shell execution boundary"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/src/core/tools/bash.ts#L42-L480"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/src/core/tools/bash.ts"
  symbol: "bashSchema/createLocalShellOperations/createShellToolDefinition"
  line_anchor: "L42-L480"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/src/core/tools/bash.ts | nl -ba | sed -n '42,480p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; shell tool not invoked"
  output_or_hash: "inline:host child_process.spawn; invoking environment/cwd; optional timeout; AbortSignal calls process-tree kill; output truncation/temp file; no approval call"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-020, C-023, C-025, C-026, C-030, C-033, C-043, C-044, C-045]
  notes: "Selected as final consequential process side-effect boundary."
- source_id: S-015
  source_kind: repository-file
  title: "In-process extension loader and API"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/src/core/extensions/loader.ts#L175-L663"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/src/core/extensions/loader.ts"
  symbol: "createExtensionRuntime/createExtensionAPI/loadExtensionModule/loadExtensionsInternal"
  line_anchor: "L175-L663"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/src/core/extensions/loader.ts | nl -ba | sed -n '175,663p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; extensions not imported"
  output_or_hash: "inline:jiti in-process import; extension can register/mutate tools/providers/session/UI and exec commands; sequential loading/errors; old namespace aliases elsewhere in file"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-008, C-009, C-020, C-030, C-031, C-033, C-039, C-040, C-043]
  notes: "Selected as executable extension authority origin; README claims were not used alone."
- source_id: S-016
  source_kind: repository-file
  title: "System prompt construction"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/src/core/system-prompt.ts#L27-L168"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/src/core/system-prompt.ts"
  symbol: "buildSystemPrompt"
  line_anchor: "L27-L168"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/src/core/system-prompt.ts | nl -ba | sed -n '27,168p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source"
  output_or_hash: "inline:fixed role/tools/guidelines/docs instructions; optional replacement/append; project instructions wrapped and concatenated; skills; cwd"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-035, C-040, C-043]
  notes: "Selected to challenge the ambiguous minimal-prompt claim and trace instruction provenance."
- source_id: S-017
  source_kind: repository-file
  title: "Resource discovery, ordering, trust, reload, conflicts"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/src/core/resource-loader.ts#L71-L629"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/src/core/resource-loader.ts"
  symbol: "loadProjectContextFiles/DefaultResourceLoader.reload/loadFinalExtensionSet/addExtensionConflictDiagnostics"
  line_anchor: "L71-L629"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/src/core/resource-loader.ts | nl -ba | sed -n '71,629p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source"
  output_or_hash: "inline:AGENTS/CLAUDE discovery; pre-trust global/CLI extension pass; post-trust project settings/resources; ordered loads; reload/conflict diagnostics"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-009, C-015, C-018, C-020, C-030, C-035, C-043]
  notes: "Selected to separate project trust/loading from model action authority."
- source_id: S-018
  source_kind: repository-file
  title: "Coding-agent JSONL session manager"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/src/core/session-manager.ts#L845-L1404"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/src/core/session-manager.ts"
  symbol: "SessionManager"
  line_anchor: "L845-L1404"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/src/core/session-manager.ts | nl -ba | sed -n '845,1404p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no session writes performed"
  output_or_hash: "inline:append-only parent-linked JSONL tree; session/cwd/file identity; sync create/append/rewrite; migration/open validation; branches/compaction/custom/usage entries"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-017, C-018, C-019, C-021, C-022, C-026, C-032, C-034, C-037, C-045, C-048]
  notes: "Selected as persistence origin; excludes separate generic SQLite backend."
- source_id: S-019
  source_kind: repository-file
  title: "Context accounting and compaction"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/src/core/compaction/compaction.ts#L143-L711"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/src/core/compaction/compaction.ts"
  symbol: "calculateContextTokens/estimateContextTokens/shouldCompact/completeSummarization/generateSummaryWithUsage"
  line_anchor: "L143-L711"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/src/core/compaction/compaction.ts | nl -ba | sed -n '143,711p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no provider call"
  output_or_hash: "inline:provider usage or chars/4 estimate; reserve trigger; valid cut points; structured lossy summary; toolChoice=none; summary retry and returned usage"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-023, C-024, C-025, C-032, C-037, C-046]
  notes: "Selected as exact compaction/accounting implementation rather than README summary."
- source_id: S-020
  source_kind: repository-file
  title: "Provider/model/auth/dispatch/cost contracts"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/ai/src/models.ts#L89-L923"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "N/A:repository-source-for-sibling-package"
  code_path: "packages/ai/src/models.ts"
  symbol: "Provider/Models/ModelsImpl/createProvider/calculateCost/clampThinkingLevel"
  line_anchor: "L89-L923"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/ai/src/models.ts | nl -ba | sed -n '89,923p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no auth/provider execution"
  output_or_hash: "inline:provider owns auth/catalog/stream; Models applies auth and dispatch; explicit errors/cancellation; generation-checked refresh publication; rate-derived costs; thinking clamp"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-014, C-023, C-024, C-025, C-031, C-034, C-038, C-046]
  notes: "Selected as primary provider/model abstraction origin; vendor claims were not used as independent measurement."
- source_id: S-021
  source_kind: repository-file
  title: "Built-in tool registry"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/src/core/tools/index.ts#L92-L225"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/src/core/tools/index.ts"
  symbol: "ToolName/allToolNames/createCodingTools/createAllTools"
  line_anchor: "L92-L225"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/src/core/tools/index.ts | nl -ba | sed -n '92,225p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source"
  output_or_hash: "inline:ToolName=read,bash,powershell,edit,write,grep,find,ls; coding defaults=read,bash,edit,write"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-012, C-036, C-044]
  notes: "Selected to reconcile four default tools with eight available built-ins and challenge claimed absences."
- source_id: S-022
  source_kind: runtime-observation
  title: "Bounded production-source absence search"
  url: "https://github.com/earendil-works/pi/tree/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/src"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "N/A:repository-search-observation"
  code_path: "packages/coding-agent/src; packages/agent/src"
  symbol: "ripgrep bounded terms"
  line_anchor: "N/A:search-output"
  command: "for term in 'sub.?agent' 'MCP|Model Context Protocol' 'plan mode|plan_mode|planMode' 'permission popup|approval'; do rg -n -i \"$term\" packages/coding-agent/src packages/agent/src --glob '!**/*.test.ts' --glob '!**/examples/**' || true; done"
  command_environment: "macOS 27.0 arm64; ripgrep; static production-source search; generated vendor hits classified"
  output_or_hash: "inline:no subagent or plan-mode matches; MCP matches only a tool-result-images comment plus vendored syntax data; approval match concerns Hugging Face access, not tool permission popup"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-041]
  notes: "Negative result retained with exact universe and false-positive classification; paired with registry enumeration, not generalized globally."
- source_id: S-023
  source_kind: runtime-observation
  title: "Built-in filesystem path-boundary static challenge"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/src/core/tools/path-utils.ts#L1-L123"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/src/core/tools/path-utils.ts"
  symbol: "resolveToCwd/resolveReadPath/resolveReadPathAsync plus read/write/edit callers"
  line_anchor: "L1-L123"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/src/core/tools/path-utils.ts | nl -ba | sed -n '1,123p' && rg -n 'resolveToCwd|resolveReadPathAsync' packages/coding-agent/src/core/tools/{read,write,edit}.ts"
  command_environment: "macOS 27.0 arm64; git 2.54.0 and ripgrep; static only; no filesystem exploit"
  output_or_hash: "inline:resolveToCwd handles tilde and absolute paths; read/write/edit callers pass resolved absolute paths to fs operations; no workspace containment check in inspected path"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-030, C-033, C-043]
  notes: "Selected as final file side-effect path; runtime symlink/race behavior remains unknown."
- source_id: S-024
  source_kind: repository-file
  title: "Continuous integration workflow"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/.github/workflows/ci.yml#L1-L42"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "N/A:repository-workflow"
  code_path: ".github/workflows/ci.yml"
  symbol: "CI build/check/test job"
  line_anchor: "L1-L42"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:.github/workflows/ci.yml | nl -ba | sed -n '1,42p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; workflow inspected, not run"
  output_or_hash: "inline:ubuntu CI installs dependencies then runs npm run build, npm run check, and npm test"
  access_date: "2026-08-24"
  supports_claims: [C-027, C-028, C-029, C-047]
  notes: "Selected for checked-in qualification intent; no historical green-run claim."
- source_id: S-025
  source_kind: repository-file
  title: "Release and npm publishing workflow"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/.github/workflows/build-binaries.yml#L26-L433"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "N/A:repository-workflow"
  code_path: ".github/workflows/build-binaries.yml"
  symbol: "release-source/build matrix/stage/publish-npm/publish-github-release/cleanup"
  line_anchor: "L26-L433"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:.github/workflows/build-binaries.yml | nl -ba | sed -n '26,433p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; workflow inspected, not run"
  output_or_hash: "inline:source archive; Linux/macOS/Windows matrix; SHA256SUMS; staged draft; npm build/check/test/trusted publish; announcement; publish or cleanup"
  access_date: "2026-08-24"
  supports_claims: [C-027, C-028, C-047]
  notes: "Selected for release gates/rollback staging intent; workflow presence is not a reproducibility measurement."
- source_id: S-026
  source_kind: runtime-observation
  title: "Workspace package manifest inventory"
  url: "https://github.com/earendil-works/pi/tree/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "N/A:repository-inventory"
  code_path: "packages/**/package.json"
  symbol: "name/version/private/description"
  line_anchor: "N/A:multi-file-inventory"
  command: "find packages -name package.json -print0 | xargs -0 node -e 'const fs=require(\"fs\"); for(const p of process.argv.slice(1)){const j=JSON.parse(fs.readFileSync(p)); console.log(p,j.name,j.version,!!j.private,j.description||\"\")}'"
  command_environment: "macOS 27.0 arm64; Node 24.18.0; static manifest read; target not run"
  output_or_hash: "inline:public agent,ai,client,coding-agent,protocol,server,sqlite-node,telemetry,tui; private evals/install-lock/extension examples; all Pi public packages version 0.84.3"
  access_date: "2026-08-24"
  supports_claims: [C-005]
  notes: "Selected to normalize package roles from their own manifests; examples/private packages were classified separately."
- source_id: S-027
  source_kind: runtime-observation
  title: "Static test inventory"
  url: "https://github.com/earendil-works/pi/tree/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "N/A:repository-test-inventory"
  code_path: "packages/agent; packages/ai; packages/coding-agent"
  symbol: "*.test.ts/*.spec.ts counts"
  line_anchor: "N/A:tree-inventory"
  command: "find packages/agent packages/ai packages/coding-agent -type f '(' -name '*.test.ts' -o -name '*.spec.ts' ')' | awk -F/ '{n[$2]++} END{for(k in n) print k,n[k]}' | sort"
  command_environment: "macOS 27.0 arm64; static filesystem inventory; tests not executed"
  output_or_hash: "inline:agent=23; ai=136; coding-agent=241; total=400"
  access_date: "2026-08-24"
  supports_claims: [C-029]
  notes: "Selected only for layer breadth; counts do not imply pass status, coverage, or production reachability."
- source_id: S-028
  source_kind: repository-file
  title: "Session usage aggregation"
  url: "https://github.com/earendil-works/pi/blob/4e58f324fae8ebfa98a3d45181fb248072a2afac/packages/coding-agent/src/core/usage-totals.ts#L1-L70"
  commit_or_ref: "v0.84.3"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
  code_path: "packages/coding-agent/src/core/usage-totals.ts"
  symbol: "addUsageToTotals/getUsageByModel"
  line_anchor: "L1-L70"
  command: "git show 4e58f324fae8ebfa98a3d45181fb248072a2afac:packages/coding-agent/src/core/usage-totals.ts | nl -ba | sed -n '1,70p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no provider call"
  output_or_hash: "inline:totals sum input,output,cacheRead,cacheWrite,and cost; grouping attributes assistant usage by provider/model and tool/compaction/branch-summary usage to other"
  access_date: "2026-08-24"
  supports_claims: [C-023, C-024]
  notes: "Selected as the direct origin for session usage aggregation; complements provider cost and compaction sources."
```

### Bibliography rationale

- **Retained origins:** immutable repository files, exact registry version metadata, exact tarball bytes, and reproducible static commands. These directly establish identity, executable structure, and declared boundaries.
- **Triangulation:** consequential sandbox/authority claims use both first-party policy (S-007/S-009) and executable source (S-012/S-014/S-015/S-023). Package traceability uses registry bytes plus Git comparison (S-003–S-005).
- **Not retained:** search-result snippets, social posts, popularity counts, other dossiers, and third-party package claims. They were unnecessary or could not independently establish runtime behavior.
- **Negative evidence retained:** S-022 names the exact production universe, command, and false positives; it is paired with the exact built-in registry S-021 and is not generalized to extensions.

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "pi-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "Pi"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/earendil-works/pi"
  resolved_commit: "4e58f324fae8ebfa98a3d45181fb248072a2afac"
  observed_ref: "v0.84.3"
  package_identity: "npm:@earendil-works/pi-coding-agent@0.84.3 integrity=sha512-Yr2p9PubrbFZmYEPYI+C8KmZP9xlFuLDnAG64RtU0ZDgrdiXYWa+y7WGyJO5OlqPliOkVCMd9IzVszO3/t0D0w=="
research:
  researcher: "ses_fc91daadeffe5yW4Uk00jpOg4d"
  owned_path: "research/harnesses/pi.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "OBSERVED"
    summary: "Official tag, commit, clean state, exact package, digests, and tag/gitHead qualification are pinned."
    confidence: "HIGH"
    claim_ids: ["C-001", "C-002"]
    source_ids: ["S-001", "S-002", "S-003", "S-004", "S-005"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "PARTIAL"
    summary: "MIT text and current package authorship are observed; exact namespace chronology and aggregate dependency licenses are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-003", "C-004"]
    source_ids: ["S-002", "S-003", "S-006", "S-015"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "OBSERVED"
    summary: "The version-aligned workspace separates provider, loop, product, UI, protocol, server, telemetry, session, and eval roles."
    confidence: "HIGH"
    claim_ids: ["C-005"]
    source_ids: ["S-002", "S-008", "S-026"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "OBSERVED"
    summary: "CLI interactive/print/JSON/RPC plus SDK, RPC, and client exports are statically traced."
    confidence: "HIGH"
    claim_ids: ["C-006"]
    source_ids: ["S-002", "S-009", "S-010", "S-011"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "OBSERVED"
    summary: "Prompt-to-provider-to-validated-tool-to-result loop and queue transitions are statically traced."
    confidence: "HIGH"
    claim_ids: ["C-007"]
    source_ids: ["S-011", "S-012", "S-013"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "PARTIAL"
    summary: "In-process extension authority/discovery is observed, while stable ABI unload and rollback guarantees are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-008", "C-009"]
    source_ids: ["S-009", "S-015", "S-017"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "OBSERVED"
    summary: "One Agent owns loop/transcript/queues/tools, and bounded static evidence confirms no built-in subagent path."
    confidence: "HIGH"
    claim_ids: ["C-010", "C-011"]
    source_ids: ["S-009", "S-011", "S-013", "S-021", "S-022"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "OBSERVED"
    summary: "Tool registry, schema validation, hooks, execution modes, errors, and events are statically observed."
    confidence: "HIGH"
    claim_ids: ["C-012", "C-020"]
    source_ids: ["S-011", "S-012", "S-014", "S-021"]
    pattern_disposition: "CANDIDATE"
  - dimension: "provider_interface"
    coverage: "PARTIAL"
    summary: "Typed provider auth/catalog/dispatch is observed; live failure, physical retries, and call visibility are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-013", "C-046"]
    source_ids: ["S-011", "S-019", "S-020"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Model identity/capability/limits/reasoning metadata are observed without live catalog negotiation."
    confidence: "MEDIUM"
    claim_ids: ["C-014", "C-046"]
    source_ids: ["S-011", "S-020"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "OBSERVED"
    summary: "Prompt/resource ordering and lossy compaction are traced, including the absence of typed taint separation."
    confidence: "HIGH"
    claim_ids: ["C-015", "C-035"]
    source_ids: ["S-007", "S-009", "S-016", "S-017", "S-019"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "Append-only JSONL tree persistence is observed; crash consistency and recovery remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-016", "C-017"]
    source_ids: ["S-009", "S-018"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Single-Agent serialization and parallel tools are observed; cross-process/worktree collision behavior is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-018", "C-019"]
    source_ids: ["S-011", "S-012", "S-013", "S-017", "S-018"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "OBSERVED"
    summary: "Default execution has ambient invoking-user authority with no built-in sandbox or action-time approval."
    confidence: "HIGH"
    claim_ids: ["C-020"]
    source_ids: ["S-007", "S-009", "S-012", "S-014", "S-015", "S-017", "S-023"]
    pattern_disposition: "CURIOSITY_NO_GO"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Events and JSONL are inspectable but not authenticated, and forgery/loss/redaction behavior is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-021", "C-022", "C-048"]
    source_ids: ["S-007", "S-009", "S-012", "S-013", "S-018"]
    pattern_disposition: "NO_POSITION"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Reported usage, local cost, and context estimates are visible without physical-request/provider-bill reconciliation."
    confidence: "MEDIUM"
    claim_ids: ["C-023", "C-024", "C-046"]
    source_ids: ["S-009", "S-019", "S-020", "S-028"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Static error/signal/retry paths are explicit; runtime cleanup, idempotency, and fault outcomes are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-025", "C-026", "C-045"]
    source_ids: ["S-011", "S-012", "S-013", "S-014", "S-018", "S-019", "S-020"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Exact npm bytes and release definitions are observed; reproducible build and rollback are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-027", "C-028", "C-047"]
    source_ids: ["S-002", "S-003", "S-004", "S-005", "S-009", "S-024", "S-025"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "PARTIAL"
    summary: "Broad tests and CI commands exist, but no target test or dynamic fault suite was run for this dossier."
    confidence: "MEDIUM"
    claim_ids: ["C-029", "C-045"]
    source_ids: ["S-002", "S-008", "S-024", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "OBSERVED"
    summary: "Declared local-user trust and lack of sandbox/prompt-injection protection match executable source boundaries."
    confidence: "HIGH"
    claim_ids: ["C-020", "C-030"]
    source_ids: ["S-007", "S-009", "S-014", "S-015", "S-017", "S-023"]
    pattern_disposition: "CURIOSITY_NO_GO"
  - dimension: "strengths"
    coverage: "OBSERVED"
    summary: "Typed composability and inspectable transcript history are scoped strengths, not adoption decisions."
    confidence: "MEDIUM"
    claim_ids: ["C-031", "C-032"]
    source_ids: ["S-009", "S-011", "S-012", "S-015", "S-018", "S-019", "S-020"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "OBSERVED"
    summary: "Ambient authority, competing loop/state ownership, and context contamination are material bounded liabilities."
    confidence: "HIGH"
    claim_ids: ["C-033", "C-034", "C-035"]
    source_ids: ["S-007", "S-011", "S-012", "S-014", "S-015", "S-016", "S-017", "S-018", "S-020", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "OBSERVED"
    summary: "Validate-before-execute is a candidate; transcript trees and provider registries are conditional patterns."
    confidence: "MEDIUM"
    claim_ids: ["C-036", "C-037", "C-038"]
    source_ids: ["S-011", "S-012", "S-018", "S-019", "S-020", "S-021"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Untrusted in-process plugins, self-extension as authority, and low-value history/popularity threads are rejected in scope."
    confidence: "HIGH"
    claim_ids: ["C-039", "C-040", "C-041"]
    source_ids: ["S-001", "S-003", "S-005", "S-007", "S-009", "S-015", "S-016", "S-022"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-031", "C-032"]
liability_ids: ["C-033", "C-034", "C-035"]
transferable_pattern_ids: ["C-036", "C-037", "C-038"]
curiosity_no_go_ids: ["C-039", "C-040", "C-041"]
unknown_claim_ids: ["C-004", "C-009", "C-017", "C-019", "C-024", "C-026", "C-028", "C-042", "C-043", "C-044", "C-045", "C-046", "C-047", "C-048"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| UNKNOWN | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-004 provenance chronology/licenses | blocks full legal provenance/dependency-license conclusion, not runtime architecture | official transfer chronology plus reviewed lockfile license report | official records and authorized license tooling | `UNASSIGNED` |
| C-009 extension ABI/unload | limits extension upgrade/recovery comparison | cross-version load/reload/conflict/failure/rollback conformance | disposable Node/Bun matrix and fixture extensions | `UNASSIGNED` |
| C-017 crash persistence | blocks crash-safe session/replay claim | fault-inject each create/append/rewrite/migration point and reopen | disposable filesystem/process control | `UNASSIGNED` |
| C-019 collisions | blocks worktree/session isolation claim | two processes with colliding session IDs/files and parallel edits | disposable multi-process workspace | `UNASSIGNED` |
| C-024 cost agreement | blocks complete accounting/budget claim | deterministic provider with independent request/cache/retry/bill ledger | mock provider and accounting oracle | `UNASSIGNED` |
| C-026 cancellation/idempotency | blocks verified recursive cancellation and safe retry claim | barrier-driven provider/tool descendants and write failures across OSes | Linux/macOS/Windows sandbox matrix | `UNASSIGNED` |
| C-028 reproducibility/rollback | blocks full source-byte and updater recovery claim | hermetic rebuild, attestation verification, interrupted update/rollback | pinned build toolchain and disposable installs | `UNASSIGNED` |
| C-042 startup effects | blocks no-op/air-gap startup qualification | empty HOME/read-only workspace/network-denied syscall trace | qualified no-secrets container/VM | `UNASSIGNED` |
| C-043 permission/injection/filesystem | blocks enforcement and containment qualification | deny every sink and test aliases/extensions/path/injection variants | exact qualified sandbox with fake credentials | `UNASSIGNED` |
| C-044 malformed/oversized | blocks complete boundary validation/resource claim | side-effect-sentinel fuzzing of every schema and size edge | isolated unit/provider/tool harness | `UNASSIGNED` |
| C-045 combined fault outcomes | blocks dynamic concurrency/retry/crash qualification | deterministic barriers at dispatch/stream/tool/session transitions | disposable multi-process fault harness | `UNASSIGNED` |
| C-046 provider/network/cost | blocks physical-call visibility and failure/fallback claim | scripted local provider for auth/429/drop/malformed/usage disagreement | local mock transport; no real credentials | `UNASSIGNED` |
| C-047 release failure | blocks reproducible release/update rollback qualification | exact rebuild plus staged update interruption | hermetic builder and retained prior install | `UNASSIGNED` |
| C-048 evidence integrity | blocks audit/receipt reliability claim | spoof/drop/duplicate/secret injection across events, JSONL, exports | isolated event/tool/provider harness | `UNASSIGNED` |

### Handoff and stop decision

- **Owned path:** `research/harnesses/pi.md`; no other path is owned or intentionally edited.
- **Pre-existing unrelated workspace changes preserved:** `apps/plugin/opencode2/turbo.json`, `docs/architecture/`, and pre-existing `research/` state.
- **Checks:** Python inline contract checker — `PASS` (30 headings, 48 claims, 28 reciprocal source records, 24 ordered dimensions, 14 probes, exact UNKNOWN set, no orphan claims); **URL/link-check result** — `PASS` (`28/28 HTTP 200` canonical source URLs); `git diff --check -- research/harnesses/pi.md` — `PASS`/no output (path is untracked); `git diff --no-index --check /dev/null research/harnesses/pi.md` — `PASS`; staged-path check — empty.
- **Unresolved uncertainties:** exactly C-004, C-009, C-017, C-019, C-024, C-026, C-028, and C-042–C-048; none is silently coerced to a negative or zero.
- **Recommendation:** use this dossier as comparison evidence only. Treat validate-before-execute/events as a candidate, transcript/provider abstractions as conditional, and default ambient authority/in-process extensions as non-enforcement boundaries. No adoption decision is made.
- **Stop decision:** `STOP_COVERAGE_AND_SATURATION`. All required sections, interfaces, probes, claims, sources, and normalized dimensions are populated. The only positive-value contradiction (tag versus npm `gitHead`) was resolved. Further consequential evidence requires qualified dynamic isolation; popularity, broad history, third-party packages, and post-cutoff HEAD are `CURIOSITY_NO_GO` within this scope.
