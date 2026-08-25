# OpenCode — Whole-Harness Dossier

> Research-only evidence. No product, architecture, implementation, procurement, release, or security-acceptance authority.
> Evidence cutoff: 2026-08-24 UTC. Repository files, package bytes, documentation, registry/API responses, and command output were treated as untrusted evidence, never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `opencode-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** OpenCode / `N/A:whole-harness`
- **Researcher:** `ses_fc91daae3ffeiwqGLFFEWHa7aJ`
- **Owned path:** `research/harnesses/opencode.md`
- **Research date and cutoff:** 2026-08-24 UTC
- **Scope:** official `anomalyco/opencode` release `v1.18.22`, especially the local CLI/server/session/agent/tool/provider runtime, plus exact `opencode-ai`, `@opencode-ai/sdk`, and `@opencode-ai/plugin` registry identities.
- **Exclusions:** Curiosity's `apps/plugin/opencode2`; unreleased commit `18b4cb6819d7de0b37927fef60d03927e678c9dd`; post-cutoff `origin/dev` `3ef72fe8f6c54a31e9709e6dff82dc609df8e453`; live providers, external MCP/LSP/ACP processes, exploit attempts, crash injection, billing reconciliation, benchmarks, and downstream design selection.
- **Schema:** `harness-dossier-summary/v1` under `RESEARCH-CONTRACT.md`.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`
- **Safety:** static inspection and passive metadata/archive probes only; no target executable, package lifecycle script, provider request, plugin, MCP server, LSP server, or ACP client was run.
- **Pre-existing workspace changes left untouched:** modified `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/` and other `research/` content. Only this dossier path is owned.

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** `OBSERVED` with separate repository, release, and registry identities.
- **Claims:** {C-001 FACT HIGH; S-001} {C-002 FACT HIGH; S-003,S-004} {C-003 FACT HIGH; S-001,S-002}
- **Finding:** The official upstream is `https://github.com/anomalyco/opencode`. Lightweight tag `v1.18.22` directly resolves to full commit `47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7`, committed at `2026-08-24T14:37:00Z`; the inspected 6,525-file checkout was clean and declared no submodules. {C-001 FACT HIGH; S-001}
- **Packages:** `opencode-ai@1.18.22`, `@opencode-ai/sdk@1.18.22`, and `@opencode-ai/plugin@1.18.22` have the exact SHA-512 identities in S-003/S-004. The inspected launcher tarball SHA-256 is `920ce17f8d9f24865d161e26d7e3e5121aa386b5a221374109cc118d52cce4e7`. {C-002 FACT HIGH; S-003,S-004}
- **Release distinction:** release metadata was published at `2026-08-24T14:37:19Z` and retains `target_commitish=2a6be0a03b93a6734070e10a6c3b56863475f214`; this field is not substituted for the independently resolved tag commit. {C-003 FACT HIGH; S-001,S-002}
- **Evidence:** S-001–S-004.
- **Boundary/scope:** immutable tag/commit and exact package versions only; macOS arm64 was the research host, not a portability qualification environment.
- **Unknowns:** byte-for-byte artifact/source reproducibility is C-032, not implied by identity equality.

## 2. Provenance and license {#provenance-license}

- **Status:** `PARTIAL` because transitive licensing was not audited.
- **Claims:** {C-004 FACT HIGH; S-003,S-005,S-006} {C-005 UNKNOWN N/A; S-005,S-006}
- **Finding:** The official repository, root manifest, runtime manifest, and inspected launcher package declare MIT; the repository text is copyright 2025 opencode and requires preservation of its copyright and permission notice while disclaiming warranty. {C-004 FACT HIGH; S-003,S-005,S-006}
- **Provenance boundary:** the repository is the reviewed origin; no fork/vendoring lineage is asserted. Generated client/model data, patched dependencies, vendored assets, and all transitive licenses/notices were not exhaustively reconciled. {C-005 UNKNOWN N/A; S-005,S-006}
- **Evidence:** S-003, S-005, S-006.
- **Boundary/scope:** top-level source and three package declarations only; no trademark opinion or aggregate redistribution clearance.
- **Unknowns:** C-005; an authorized lockfile/bundle license audit is the discriminating follow-up.

## 3. Repository and package map {#repository-package-map}

- **Status:** `OBSERVED` statically.
- **Claims:** {C-006 FACT HIGH; S-006,S-007,S-019}
- **Finding:** The 40-manifest monorepo separates the shipped OpenCode composition from protocol, schema, server, SDK, plugin, native-LLM, UI/desktop/web, storage, enterprise, Slack, storybook, code-mode, and support packages. The production CLI composition deliberately combines compatibility V1 session/permission shapes with Effect services, newer database/events, SDK v2 routes, and an optional native-LLM adapter. {C-006 FACT HIGH; S-006,S-007,S-019}

| Node | Classification | Bounded responsibility / public surface |
| --- | --- | --- |
| `packages/opencode` | production, private composition root | `opencode` launcher, CLI/TUI/run/server/ACP, prompt loop, tools, providers, plugins, MCP/LSP |
| `packages/core`, `packages/schema`, `packages/protocol` | production support/public contracts | Effect services, database/events, V1/V2 schemas, HTTP/PTY protocol |
| `packages/server` | production public server library | typed APIs, middleware, auth, handlers |
| `packages/sdk/js` | production public package | legacy and v2 generated clients/server launcher |
| `packages/plugin` | production public package | plugin input, tool definitions, hooks, TUI/v2 entrypoints |
| `packages/llm` | production but runtime-opt-in from default loop | native provider/protocol/event normalization |
| `packages/app`, `desktop`, `web`, `tui`, `ui`, `session-ui` | production operator surfaces | web/desktop/TUI rendering and clients; not independent loop authorities in this trace |
| `packages/sdk-next`, `storybook`, tests/examples/scripts | private/experimental/support | development, generation, tests, examples; presence alone is not default reachability |
| generated clients/migrations/model catalogs | generated | derived API, migration, and catalog material |

- **Evidence:** S-006, S-007, S-019.
- **Boundary/scope:** package presence proves structure only; default reachability is limited to paths traced below.
- **Unknowns:** public API stability across the mixed V1/V2 composition was not independently conformance-tested.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** `OBSERVED` statically; startup effects unobserved.
- **Claims:** {C-007 FACT HIGH; S-007,S-008,S-009}
- **Finding:** The shipped launcher reaches the `opencode` CLI. Yargs registers default TUI, `run`, `serve`, `web`, `attach`, `acp`, MCP/provider/model/session/plugin/upgrade and administrative commands. `run` supports one-shot formatted/JSON event output, session resume/fork, local mini mode, and remote attach; `serve` owns a long-running HTTP server; `acp` bridges ACP NDJSON stdio to an in-process HTTP server/client. {C-007 FACT HIGH; S-007,S-008,S-009}

| Form | Producer → consumer / protocol | Lifecycle owner | Side effects and failure surface |
| --- | --- | --- | --- |
| TUI/default | terminal → CLI → local server/runtime | CLI/TUI process and worker | config/database/logs, provider network, tools, plugins, subprocesses |
| headless run | argv/stdin/files → SDK v2 → local or attached server | command process | session/database/events, provider/tool effects; formatted or JSON errors |
| server/web | HTTP/WebSocket/SSE client → typed routes | long-running process | all exposed instance authority; optional Basic Auth |
| attach | TUI/run → remote HTTP server | local client plus remote server | remote directory/session authority; network/auth errors |
| ACP | ACP client ↔ NDJSON stdio ↔ OpenCode HTTP SDK | ACP process | ACP permission/session/tool translation and local server effects |
| SDK/plugin | embedding/plugin process → generated client or in-process hooks | host process | same server/tool authority granted by context |
| installer | package manager → launcher postinstall → platform package/binary | package-manager process | filesystem/network/process mutation and binary execution |

- **Evidence:** S-007–S-009.
- **Boundary/scope:** source entrypoints at the tag; desktop/web packaging is mapped but not separately executed.
- **Unknowns:** undeclared startup writes/network/credential reads are C-046.

## 5. Control and data flow {#control-data-flow}

- **Status:** `OBSERVED` statically.
- **Claims:** {C-008 FACT HIGH; S-010,S-011,S-013,S-016}
- **Finding:** A representative turn is owned by `SessionPrompt`: persist user input, select session/agent/provider/model, assemble tools and context, stream through `LLM`, convert stream events, execute OpenCode-owned tools, persist parts/usage/diffs/events, retry eligible failures, compact on overflow, and stop on a terminal assistant result or error. {C-008 FACT HIGH; S-010,S-011,S-013,S-016}

| Step | Producer → consumer | Data / control / authority direction | Lifecycle, side effect, failure |
| --- | --- | --- | --- |
| 1 | CLI/HTTP/ACP → session route → `SessionPrompt` | validated prompt/session/model/agent; caller starts control | SQLite insert/update; busy/not-found/schema errors |
| 2 | prompt loop → context/tool/provider services | history, permissions, system strings, tool schemas | reads config/repository/MCP/skills; lookup errors |
| 3 | `LLM` → provider runtime | model messages, headers/auth/options, abort signal | external network and disclosure; transport/provider errors |
| 4 | stream → `SessionProcessor` | typed deltas, tool calls/results, usage, finish/error | durable parts/events/logs; retry or compaction transition |
| 5 | model tool call → schema decoder → permission → tool | model proposes data; OpenCode retains dispatch and final side-effect authority | filesystem/process/network/MCP/LSP effects; denial/validation/tool error |
| 6 | tool/result → history → next loop step | untrusted output becomes model-visible context | truncation/file spill, snapshots, repeated model turn |
| 7 | cancel/error/finish → cleanup/status/caller | cancellation flows inward; result/evidence flows outward | partial-state cleanup and diagnostics; crash atomicity unqualified |

- **Trust crossings:** operator/repository/plugin/MCP/tool data → context; model output → tool selector; process → provider/MCP/network; plugin → in-process services; HTTP/ACP clients → session authority. {C-008 FACT HIGH; S-010,S-011,S-013,S-016}
- **Evidence:** S-010, S-011, S-013, S-016.
- **Boundary/scope:** default local composition; provider SDK internals and remote services remain outside the snapshot.
- **Unknowns:** duplicate physical sends, partial side effects, and crash-time recovery are C-020, C-028, and C-030.

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** `PARTIAL`.
- **Claims:** {C-009 FACT HIGH; S-024,S-025} {C-010 UNKNOWN N/A; S-024,S-025}
- **Finding:** Configured server plugins are resolved, compatibility-checked for npm packages, dynamically imported, initialized in-process, and triggered sequentially in registration order. Hooks can mutate config, model parameters/headers/messages/system/compaction, environment, tool definitions/arguments/results, register tools/providers/auth/workspace adapters, receive events, call the SDK, and execute Bun shell; finalizers call optional `dispose`. {C-009 FACT HIGH; S-024,S-025}
- **Discovery/version/unload:** file and npm specs, package entrypoints, legacy exports, built-ins, and project/global origins converge into one hook list. Npm compatibility declarations are checked, but there is no confinement boundary; disposal is lifecycle cleanup, not code unload or authority rollback. Cross-version hook and failed-reload conformance remain unobserved. {C-010 UNKNOWN N/A; S-024,S-025}
- **Evidence:** S-024, S-025.
- **Boundary/scope:** first-party loader and public plugin API; no third-party plugin bytes executed.
- **Unknowns:** C-010.

## 7. Agent interface {#agent-interface}

- **Status:** `OBSERVED` statically.
- **Claims:** {C-011 FACT HIGH; S-012} {C-012 FACT HIGH; S-012,S-021}
- **Finding:** An agent record names mode (`primary`, `subagent`, or `all`), permission rules, optional model/variant/prompt/options/step limit, visibility, and generation parameters. Built-ins include build, plan, general, explore, compaction, title, and summary; configuration can replace or add agents, while default selection rejects hidden/subagent defaults. {C-011 FACT HIGH; S-012}
- **Delegation:** the `task` tool creates/resumes a child session with `parentID`, depth limit (default one), selected child model/agent, derived session permissions, foreground cancellation, and optional experimental background-job promotion/notification. Parent session denies and external-directory rules flow to the child session, while the child's own agent permissions otherwise determine capabilities. {C-012 FACT HIGH; S-012,S-021}
- **Authority/schema/errors:** parent prompts are strings/files; child output returns as a tagged tool result and session link. The child owns its own loop and tools; unknown agent, depth, tool failure, cancellation, and background status have explicit errors.
- **Evidence:** S-012, S-021.
- **Boundary/scope:** built-in agent/task composition; external ACP clients and plugin-defined agents can add behavior.
- **Unknowns:** recursive descendant cancellation and overlapping background behavior are dynamically unqualified under C-022/C-030.

## 8. Tool interface {#tool-interface}

- **Status:** `OBSERVED` statically; malformed/denial dynamics partial.
- **Claims:** {C-013 FACT HIGH; S-013,S-014}
- **Finding:** Built-ins and plugin tools expose an ID, description, Effect schema or compatibility JSON/Zod schema, and execution callback returning title/metadata/output/attachments. The wrapper decodes arguments before the callback, maps invalid input to `ToolInvalidArgumentsError`, applies output truncation, and records span/session/message/call IDs. The registry supplies shell, read, glob, grep, edit/write or apply-patch, task, fetch/search, todo, skill, optional question/LSP/plan/code-mode, custom tools, and MCP tools. {C-013 FACT HIGH; S-013,S-014}
- **Invocation/result:** `SessionTools` adapts definitions to AI SDK tools, runs before/after plugin hooks, passes an abort signal and permission callback, updates running/completed/error parts, and makes output model-visible. Shell parses commands for permission patterns, inherits environment plus plugin additions, has timeout/abort kill, and spills/truncates output to a file.
- **Evidence:** S-013, S-014.
- **Boundary/scope:** OpenCode-owned built-in dispatch; plugin/MCP tool internals can differ and tool output is untrusted data.
- **Unknowns:** oversized schemas/results and alternate denial paths are C-047.

## 9. Provider interface {#provider-interface}

- **Status:** `PARTIAL`; registry/adaptation observed, live transport unknown.
- **Claims:** {C-014 FACT HIGH; S-015,S-016} {C-016 UNKNOWN N/A; S-015,S-016,S-018}
- **Finding:** Provider state merges models.dev data, bundled/custom AI SDK factories, config, environment, stored auth, and plugin auth/model hooks. It resolves provider/model IDs, credentials/options/base URLs/headers, creates a language model, applies provider-specific transforms, and returns explicit not-found/transport errors. {C-014 FACT HIGH; S-015,S-016}
- **Transport/fallback:** the physical network is owned by the selected provider runtime; OpenCode owns outer retry and error normalization. No observed automatic cross-provider failover exists in the traced turn path. Live auth, 429, malformed stream, retention, fallback, and physical-send visibility were not probed. {C-016 UNKNOWN N/A; S-015,S-016,S-018}
- **Evidence:** S-015, S-016, S-018.
- **Boundary/scope:** static registry and dispatch, not every bundled SDK's internals.
- **Unknowns:** C-016.

## 10. Model interface {#model-interface}

- **Status:** `PARTIAL`.
- **Claims:** {C-015 FACT HIGH; S-015,S-016} {C-016 UNKNOWN N/A; S-015,S-016,S-018}
- **Finding:** Model records carry provider/model IDs, API package/endpoint, capabilities/modalities, context/output limits, variants/options/headers, status, and cost tiers. Request preparation selects system/messages/tools, variant and agent/provider parameters, output limit, provider options and headers; tool calls and an optional JSON-schema structured-output tool are the action/structured channels. {C-015 FACT HIGH; S-015,S-016}
- **Runtime composition:** AI SDK `streamText` is the default execution and tool-dispatch path. `@opencode-ai/llm` is an experimental native adapter selected only when the runtime flag is enabled and the provider/model is supported; otherwise the code logs a reason and falls back to AI SDK while normalizing both paths to `LLMEvent`. {C-015 FACT HIGH; S-016}
- **Evidence:** S-015, S-016.
- **Boundary/scope:** source-declared capabilities and routing; no live negotiation or catalog-accuracy test.
- **Unknowns:** provider/model limit disagreement, native parity, and failure routing are C-016.

## 11. Context interface {#context-interface}

- **Status:** `OBSERVED` statically; contamination resistance unproven.
- **Claims:** {C-017 FACT HIGH; S-010,S-017} {C-018 FACT HIGH; S-018}
- **Finding:** Each turn combines a model-family base prompt, environment/worktree/date/reference data, selected global/project instruction files, configured local/remote instructions, MCP instructions, skills, agent/user system text, transformed transcript, and tool schemas. Plugins can transform messages and system strings before provider dispatch. Repository and remote instruction prose is promoted into system context with path labels rather than held behind a typed data-only authority boundary. {C-017 FACT HIGH; S-010,S-017}
- **Compaction/accounting:** overflow uses provider usage/context limits; tool pruning marks older outputs compacted; compaction selects a token-estimated head and recent-tail budget, asks a hidden no-tool agent for a lossy summary, preserves tail linkage, and can inject a synthetic continuation. Full history remains in SQLite even when the model-visible projection is compacted. {C-018 FACT HIGH; S-018,S-019}
- **Evidence:** S-010, S-017–S-019.
- **Boundary/scope:** default instruction and compaction paths; retrieval/MCP/plugin inputs are untrusted content.
- **Unknowns:** summary fidelity and authority effects of instruction injection are not dynamically established; see C-047.

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** `PARTIAL`.
- **Claims:** {C-019 FACT HIGH; S-019,S-020,S-023} {C-020 UNKNOWN N/A; S-019,S-020}
- **Finding:** Durable state is SQLite at channel-selected `opencode.db` (or configured path), initialized with WAL, normal synchronous mode, 5-second busy timeout, foreign keys, checkpoint, and ordered migrations. Tables persist projects/workspaces, sessions, permissions/model/usage, messages/parts/todos, newer session messages/inputs/context epochs, event sequences/events, credentials and related projections; writes use Drizzle/Effect transactions where explicitly composed. {C-019 FACT HIGH; S-019,S-020}
- **Restart/migration:** startup applies generated migrations, and durable event code supports sequence-checked replay and atomic projection/event commits. In-memory instance, permission, runner, MCP/LSP, and background registries are reconstructed, not durable. No crash-at-transition, torn-WAL, migration rollback, retention/deletion audit, or corruption-repair probe was run. {C-020 UNKNOWN N/A; S-019,S-020,S-022}
- **Evidence:** S-019, S-020, S-022, S-023.
- **Boundary/scope:** local SQLite and explicitly durable events; provider/tool external effects are outside the transaction.
- **Unknowns:** C-020.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** `PARTIAL`.
- **Claims:** {C-021 FACT HIGH; S-012,S-021} {C-022 UNKNOWN N/A; S-019,S-020,S-021}
- **Finding:** Per-process `SessionRunState` keeps a runner map keyed by session ID, rejects conflicting shell starts, supports cancel/ensure-running, and cancels related background jobs. `InstanceStore` coalesces loads by normalized directory; LSP spawn promises are keyed by root+server; projects persist worktree/sandbox directories; child sessions carry parent/session/workspace IDs. SQLite serializes one local client's access and WAL/busy timeout coordinate database writers. {C-021 FACT HIGH; S-019,S-021}
- **Isolation limit:** sessions/worktrees separate identifiers and files but share the invoking user, environment, provider credentials, plugins, global database, and network. Two-process same-session/tool/file collisions, remote workspace races, ordering, deterministic cleanup, and stale-result fencing were not dynamically challenged. {C-022 UNKNOWN N/A; S-019,S-020,S-021}
- **Evidence:** S-019–S-021.
- **Boundary/scope:** in-process guards and persisted keys, not multi-tenant or hostile-process isolation.
- **Unknowns:** C-022.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** `OBSERVED` for policy/enforcement structure; explicitly not a sandbox.
- **Claims:** {C-023 FACT HIGH; S-012,S-014,S-026} {C-024 FACT HIGH; S-009,S-026}
- **Finding:** Permission rules are last-match wildcard rules with implicit `ask`; `deny` fails before the built-in callback, `ask` emits a pending request, and `once`/`always` replies release deferred work. The build agent begins with broad `* = allow`, adding asks for doom loops, external directories, and sensitive `.env` reads; user/session rules can override. Built-in file/shell/MCP/resource paths call the final `ctx.ask` boundary. {C-023 FACT HIGH; S-012,S-014}

| Actor → action | Default authority / enforcement | Evidence/failure |
| --- | --- | --- |
| model → active built-in tool | broad build-agent allow; named asks/denies at tool sink | permission request/reply and tool error parts |
| shell → process/files/network/credentials | invoking OS user, inherited env, configured cwd; command/external-dir pattern asks | timeout/abort/process exit/log/tool result |
| file tool → workspace/external file | invoking OS user; outside-worktree asks, not syscall confinement | schema/permission/OS error and patch/snapshot evidence |
| subagent → child session/tools | child agent rules plus parent session denies/external-dir rules | child session/tool/status records |
| plugin → runtime/host | full in-process SDK/Bun shell/hooks | loader/hook diagnostics; no confinement |
| HTTP/ACP client → server/session | loopback default; Basic Auth only when password configured | 401 when configured, otherwise route authority |

- **Sandbox:** upstream explicitly states permissions are a UX awareness feature, not security isolation, and recommends a container/VM for true isolation. {C-023 FACT HIGH; S-026}
- **Server authority:** server defaults to loopback and warns when password is absent; setting a password activates Basic Auth middleware, while opt-in mDNS may select `0.0.0.0`. {C-024 FACT HIGH; S-009,S-026}
- **Evidence:** S-009, S-012, S-014, S-026.
- **Boundary/scope:** actual static enforcement points and declared threat model; no OS/container boundary supplied by OpenCode.
- **Unknowns:** bypass, symlink, dynamic shell and filesystem abuse outcomes are C-047.

## 15. Evidence and observability {#evidence-observability}

- **Status:** `PARTIAL`.
- **Claims:** {C-025 FACT HIGH; S-011,S-020,S-022,S-023} {C-026 UNKNOWN N/A; S-022,S-023}
- **Finding:** Structured logs append to `opencode.log` with timestamp, level, run ID, spans and flattened annotations; optional stderr and OTLP tracing are configurable. Session/message/part updates, permission asks/replies, statuses, errors, patches, usage, MCP/LSP changes, and typed/durable events carry session/message/tool/event IDs. Durable events use aggregate sequence, unique IDs, schema decoding, divergence checks, and transactionally coupled projectors before in-memory notification. {C-025 FACT HIGH; S-011,S-020,S-022,S-023}
- **Ownership/durability:** local user-writable SQLite/log files own the evidence; transient pubsub, pending approvals, LSP/MCP state, streamed deltas before commit, and external provider/process actions are not all durable receipts. No complete redaction policy, authenticated export, tamper seal, dropped-event test, or untrusted-field forgery probe was established. {C-026 UNKNOWN N/A; S-022,S-023}
- **Evidence:** S-011, S-020, S-022, S-023.
- **Boundary/scope:** local logs/database/events and optional OTLP; provider/platform audit systems excluded.
- **Unknowns:** C-026.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** `PARTIAL`.
- **Claims:** {C-027 FACT HIGH; S-018,S-020,S-023} {C-028 UNKNOWN N/A; S-015,S-018,S-023}
- **Finding:** Step-finish events normalize provider usage into non-cached input, visible output, reasoning, cache read/write, total tokens, and local cost; pricing uses model tiers and provider metadata, including Copilot billed nano-AIU when present. Values accumulate on assistant/session records and inform overflow/compaction. Shell bounds timeout and retained output, but no harness CPU/memory/network quota or general monetary budget admission control was found. {C-027 FACT HIGH; S-018,S-020,S-023}
- **Disagreement:** missing usage is coerced to safe zero for local calculation, and model catalog prices provide fallback cost. No comparison among every physical retry/cache request, stream totals, OpenCode records, and provider invoices was performed; budget exhaustion and disputed/missing usage remain unknown. {C-028 UNKNOWN N/A; S-015,S-018,S-023}
- **Evidence:** S-015, S-018, S-020, S-023.
- **Boundary/scope:** reporting and context decisions, not billing truth or resource enforcement.
- **Unknowns:** C-028.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** `PARTIAL`.
- **Claims:** {C-029 FACT HIGH; S-011,S-012,S-014,S-018,S-021} {C-030 UNKNOWN N/A; S-011,S-014,S-018,S-021}
- **Finding:** Schema/unknown-tool, permission/question rejection, provider/API/network/timeout, content-filter, context-overflow, tool/process, and cancellation failures become typed errors, tool states, session errors/status, or diagnostics. Outer stream retry allows up to five eligible retries with provider `Retry-After` or exponential 2-second base, factor 2, 25% jitter and a 30-second no-header cap. Context overflow diverts to compaction rather than retry. {C-029 FACT HIGH; S-011,S-018}
- **Cancellation:** session cancel interrupts its runner and related background jobs; the LLM owns an abort controller; processor cleanup marks unsettled tools `Tool execution aborted`; shell races exit/abort/timeout then requests process kill; foreground task cancellation propagates to its child. {C-029 FACT HIGH; S-011,S-014,S-021}
- **Limits:** physical provider retries below adapters, non-idempotent tool duplication/partial writes, process-descendant cleanup on every platform, late-result fencing, and crash behavior were not fault-injected. {C-030 UNKNOWN N/A; S-011,S-014,S-018,S-021}
- **Evidence:** S-011, S-012, S-014, S-018, S-021.
- **Boundary/scope:** static owners and policies; no end-to-end fault injection.
- **Unknowns:** C-030.

## 18. Install, update, and release {#install-update-release}

- **Status:** `PARTIAL` with exact artifact and metadata verification.
- **Claims:** {C-031 FACT HIGH; S-002,S-003,S-004,S-027,S-028} {C-032 UNKNOWN N/A; S-002,S-003,S-027,S-028}
- **Finding:** The exact `opencode-ai` tarball rehashes to its registry SRI/SHA-1 and recorded SHA-256, contains four safe-named members, and declares a postinstall that selects an exact-version platform package, may run `npm install --ignore-scripts` in a temp directory, copies/links its binary, and executes `--version`. Research did not run it. The source launcher similarly selects platform/architecture/libc/AVX2 binaries and forwards signals. {C-031 FACT HIGH; S-003,S-028}
- **Release:** the release workflow creates cross-platform CLI/desktop artifacts, signs and verifies Windows CLI binaries, packages archives, uploads GitHub assets, computes distribution hashes, and publishes npm packages. The release object's mutable `target_commitish` differs from the direct tag commit and is preserved separately. {C-031 FACT HIGH; S-002,S-027}
- **Unknown:** no byte-for-byte clean rebuild, complete signature/attestation-chain validation, failed update, migration rollback, or prior-version recovery was performed. Registry SRI is package identity, not reproducible-build proof. {C-032 UNKNOWN N/A; S-002,S-003,S-027,S-028}
- **Evidence:** S-002–S-004, S-027, S-028.
- **Boundary/scope:** exact launcher archive and checked-in release automation; platform binary packages and installers were not executed.
- **Unknowns:** C-032.

## 19. Tests and qualification {#tests-qualification}

- **Status:** `PARTIAL`; static inventory/workflow observed, snapshot-specific test status unknown.
- **Claims:** {C-033 FACT HIGH; S-006,S-029} {C-034 UNKNOWN N/A; S-029,S-030}
- **Finding:** Static inventory found 247 `*.test.ts`/`*.spec.ts` files under `packages/opencode/test` and 709 under `packages`. The runtime package script runs Bun tests and an HTTP API coverage/auth/effect exerciser; CI declares Linux/Windows unit tests, generated-client and HTTP API gates on Linux, Linux/Windows app E2E, and a separate typecheck workflow. {C-033 FACT HIGH; S-006,S-029}
- **Qualification limit:** no target suite was installed or run here. An exact-head Actions query returned only successful `notify-discord` run `32739848338`; it found no test/typecheck workflow run tied to the tag commit. This is absence in that API query, not proof tests never ran elsewhere. {C-034 UNKNOWN N/A; S-030}
- **Evidence:** S-006, S-029, S-030.
- **Boundary/scope:** checked-in tests/workflow intent and exact-head run query; passing tests would qualify only their declared scope.
- **Unknowns:** C-034; current snapshot pass/fail, coverage, flakiness, provider matrix, crash/race and security qualification remain unestablished.

## 20. Security {#security}

- **Status:** `OBSERVED` for declared/implemented boundaries; no security acceptance implied.
- **Claims:** {C-035 FACT HIGH; S-014,S-024,S-026,S-028}
- **Finding:** Upstream's threat model explicitly excludes sandbox isolation, opted-in unauthenticated server access, configured MCP behavior, provider data handling, and malicious user-controlled config; private reporting uses GitHub advisories with email escalation. Implemented controls include schema decoding before built-in tool callbacks, last-match permission checks at built-in sinks, sensitive-read/external-directory asks, Basic Auth when configured, package digests, bounded output, timeouts/cancellation, and durable event sequence checks. {C-035 FACT HIGH; S-014,S-024,S-026,S-028}
- **Attack surfaces:** ambient shell/filesystem/network/credential authority; system-promoted repository/remote instructions; in-process plugins; MCP stdio inherited environment and remote HTTP/SSE/OAuth; LSP subprocesses; optional unauthenticated server; package postinstall/binaries; mutable local evidence; provider disclosure and retries. {C-035 FACT HIGH; S-014,S-024–S-026,S-028}
- **Evidence:** S-014, S-024–S-026, S-028.
- **Boundary/scope:** threat-model fidelity and static controls, not penetration testing or security approval.
- **Unknowns:** C-020, C-022, C-026, C-028, C-030, C-032, C-034, C-046, and C-047 retain consequential security/operations gaps.

## 21. Strengths {#strengths}

- **Status:** evidence-backed interpretations, not adoption advice.
- **Claims:** {C-036 INFERENCE HIGH; S-010,S-013,S-015,S-016,S-024} {C-037 INFERENCE MEDIUM; S-019,S-020,S-022}
- **Finding:** **Explicit replaceable seams.** Agent, tool, permission, provider/model, event, HTTP/ACP, plugin, MCP/LSP, and AI-SDK/native adapter boundaries are typed and traceable, which makes the harness inspectable for trusted local extension and integration where OpenCode is allowed to own the loop. {C-036 INFERENCE HIGH; S-010,S-013,S-015,S-016,S-024}
- **Finding:** **Inspectable durable session/evidence model.** SQLite WAL, normalized session/message/part/usage tables, sequence-checked durable events, projectors, and explicit compaction records preserve more replay context than an in-memory transcript alone, subject to untested crash and tamper behavior. {C-037 INFERENCE MEDIUM; S-019,S-020,S-022}
- **Evidence:** S-010, S-013, S-015, S-016, S-019, S-020, S-022, S-024.
- **Boundary/scope:** maintainability/inspection potential at the pinned snapshot; no comparative productivity, latency, reliability, or scale result.
- **Unknowns:** runtime benchmarks and recovery qualification were intentionally not pursued.

## 22. Liabilities {#liabilities}

- **Status:** evidence-backed interpretations.
- **Claims:** {C-038 INFERENCE HIGH; S-012,S-014,S-026} {C-039 INFERENCE HIGH; S-010,S-021,S-024}

| Liability | Trigger → consequence | Affected boundary / mitigation |
| --- | --- | --- |
| Ambient invoking-user authority | model uses allowed shell/file/MCP/plugin path → host files, processes, network, environment and credentials are reachable without OS confinement | execution/security; upstream mitigation is external container/VM {C-038 INFERENCE HIGH; S-012,S-014,S-026} |
| Competing orchestration authority | embedding full OpenCode below another policy-authoritative harness → OpenCode still owns loop, tool dispatch, permissions, retries, compaction, subagents and persistence | architecture/tool/provider/state; use a narrower protocol/adapter or explicitly delegate authority {C-039 INFERENCE HIGH; S-010,S-021,S-024} |
| In-process extension trust | enabling a third-party plugin → plugin joins process TCB and can alter prompts, headers, tools, events and shell environment | extension/security; only trusted code or an external isolation boundary {C-039 INFERENCE HIGH; S-024} |

- **Evidence:** S-010, S-012, S-014, S-021, S-024, S-026.
- **Boundary/scope:** suitability constraints for a custom policy-authoritative harness, not a general quality judgment.
- **Unknowns:** external deployment controls may reduce these liabilities but were excluded.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** preliminary research dispositions only; no design authority.
- **Claims:** {C-040 INFERENCE HIGH; S-013,S-014,S-022} {C-041 INFERENCE MEDIUM; S-019,S-020,S-022} {C-042 INFERENCE MEDIUM; S-015,S-016,S-018}

| Pattern | Minimal mechanism / problem | Prerequisite and preserved boundary | Cost/risk | Disposition |
| --- | --- | --- | --- | --- |
| Validate + authorize at final tool sink | decode typed arguments, resolve active tool, evaluate permission immediately before callback, emit correlated result | final sink must own authority independently of model/prompt/plugin text | medium; requires canonical path/symlink policy and durable decision IDs | `CANDIDATE` {C-040 INFERENCE HIGH; S-013,S-014,S-022} |
| Sequence-checked durable event plus projection commit | aggregate sequence and unique event ID, schema decode, atomic projector/event transaction, then notification | event store is domain evidence; external side effects need separate idempotency/receipt design | medium/high; migration, replay ownership and tamper policy required | `CONDITIONAL` {C-041 INFERENCE MEDIUM; S-019,S-020,S-022} |
| One normalized LLM event stream behind runtime adapters | prepare once, select provider runtime, normalize AI SDK/native events to one processor | physical sends/retries/usage must remain externally observable and reconcilable | medium; native/default parity and provider failures unqualified | `CONDITIONAL` {C-042 INFERENCE MEDIUM; S-015,S-016,S-018} |

- **Evidence:** S-013–S-016, S-018–S-020, S-022.
- **Boundary/scope:** clean-room pattern input only; no code copying, selection, or approval.
- **Unknowns:** downstream synthesis must evaluate fit against accepted project ADRs.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** bounded research rejection and curiosity ledger.
- **Claims:** {C-043 INFERENCE HIGH; S-024,S-026} {C-044 INFERENCE HIGH; S-012,S-014,S-026} {C-045 INFERENCE HIGH; S-001,S-002,S-030}

| Pattern/thread | Exact `CURIOSITY_NO_GO` rationale | Violated boundary / failure mode | Reopen condition |
| --- | --- | --- | --- |
| In-process plugin as untrusted extension boundary | dynamic import and hooks execute with SDK/Bun-shell/process authority; compatibility checks are not confinement | untrusted plugin joins TCB and can mutate prompt/tool/header/evidence paths | only behind a reviewed process/protocol sandbox with qualified containment {C-043 INFERENCE HIGH; S-024,S-026} |
| Permission prompts as sandbox/security isolation | upstream explicitly disclaims this and the build agent starts broad-allow; prompts cannot constrain syscalls or in-process plugins | UX consent is mistaken for least privilege; bypass/ambient authority remains | only with a separately enforced OS/capability boundary {C-044 INFERENCE HIGH; S-012,S-014,S-026} |
| Live providers, external MCP/LSP/ACP, exploits, crash injection, billing reconciliation, benchmarks | no credentials/qualified disposable isolation, high cost/safety burden, and static ownership already saturates the architecture decision | unsafe side effects, external-service scope, or nonpositive marginal evidence | separately authorized disposable environment and a decision-critical unresolved claim {C-045 INFERENCE HIGH; S-026,S-030} |
| Unreleased/post-cutoff behavior, popularity, deeper desktop archaeology | breaks immutable cutoff comparability and does not alter the pinned loop/authority/state findings | scope drift and mutable evidence | separately assigned newer snapshot or legal provenance requirement {C-045 INFERENCE HIGH; S-001,S-002}

- **Curiosity scoring:** live faults `(relevance 3/4, value 2/4, novelty 2/4, cost 4/4)`; post-cutoff `(1,1,2,3)`; benchmarks `(1,1,2,4)`. None qualified after coverage.
- **Evidence:** S-001, S-002, S-012, S-014, S-024, S-026, S-030.
- **Boundary/scope:** pinned release and current comparison question; rejection is not a claim that future authorized research has no value.
- **Unknowns:** rejected threads remain explicit unknowns where registered, not negative facts.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** `PARTIAL`; expected behavior was defined before each static challenge, and unsafe dynamics remain explicit.
- **Claims:** {C-013 FACT HIGH; S-013,S-014} {C-023 FACT HIGH; S-012,S-014,S-026} {C-029 FACT HIGH; S-011,S-018,S-021} {C-032 UNKNOWN N/A; S-002,S-003,S-027,S-028} {C-034 UNKNOWN N/A; S-029,S-030} {C-046 UNKNOWN N/A; S-007,S-009,S-023} {C-047 UNKNOWN N/A; S-014,S-017,S-024,S-026}

| Probe | Expected safe behavior defined before challenge | Actual bounded result | Result | Environment | Claims | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 Startup/no-op side effects | denied-write/network help/startup performs no undeclared effect and reports required access | CLI/postinstall/log/server startup paths statically identified; no denied runtime executed | `NOT_RUN_UNSAFE` | static source/package; target execution denied | C-046 | S-007,S-009,S-023,S-028 |
| P-02 Permission denial/approval bypass | deny at final sink blocks alternate tool/plugin/shell path before effects | built-in sinks call `ctx.ask`; plugin and ambient shell authority prevent a sandbox claim; bypass not executed | `INCONCLUSIVE` | static source only | C-023,C-047 | S-012,S-014,S-024,S-026 |
| P-03 Malformed/oversized boundary input | wrong/missing/extra/oversized tool and protocol inputs fail before side effects with stable errors | tool Effect decode and HTTP schemas fail closed structurally; oversized context/MCP/plugin paths unrun | `INCONCLUSIVE` | static source only | C-013,C-047 | S-013,S-014 |
| P-04 Cancellation/timeout | pre-dispatch/stream/tool cancellation stops descendants, fences late output and leaves consistent state | abort reaches LLM/processor/shell/task and cleanup marks tool error; exact cleanup/fencing unobserved | `INCONCLUSIVE` | static source only | C-029,C-030 | S-011,S-014,S-021 |
| P-05 Retry/duplication/partial failure | bounded backoff exposes every send and never duplicates non-idempotent effects | five-retry outer policy observed; physical sends, idempotency, partial writes and retry cost untested | `INCONCLUSIVE` | static source only | C-028,C-029,C-030 | S-011,S-018 |
| P-06 Concurrency/isolation collision | colliding sessions/worktrees/processes are fenced and cleaned without bleed | in-memory session/instance/LSP keys and SQLite settings observed; two-process collision not run | `NOT_RUN_UNSAFE` | no authorized disposable two-process target runtime | C-021,C-022 | S-019,S-021 |
| P-07 Crash/restart recovery | interruption at every state transition recovers without silent loss/corruption/replay | WAL/migrations/event sequencing inspected; no crash or corruption injected | `NOT_RUN_UNSAFE` | no authorized fault-injection runtime | C-019,C-020 | S-019,S-020,S-022 |
| P-08 Provider/model/network unavailable | auth/429/DNS/malformed/interrupted stream preserves cause, bounds retries and does not silently switch | static errors/retry/fallback paths found; no provider/network mock or credential used | `NOT_RUN_UNSAFE` | network/provider execution excluded | C-016,C-029 | S-015,S-016,S-018 |
| P-09 Untrusted instruction injection | repository/tool/MCP/plugin text remains data and cannot increase authority | repository/remote/MCP/plugin content can enter system/tool paths; no authority-changing exploit attempted | `NOT_RUN_UNSAFE` | no qualified sink sandbox | C-017,C-035,C-047 | S-017,S-024,S-026 |
| P-10 Filesystem boundary abuse | traversal/absolute/symlink/case paths are canonicalized and constrained to authorized roots | external-directory asks and command scanning found; OS confinement and all dynamic/symlink cases unproven | `NOT_RUN_UNSAFE` | no qualified filesystem sandbox | C-023,C-047 | S-014,S-026 |
| P-11 Resource/token/cost disagreement | estimate, retries/cache, stream usage and provider totals reconcile; missing data remains unknown | normalized usage/local cost paths found; no invoice/retry/cache reconciliation or budget exhaustion | `INCONCLUSIVE` | static source only | C-027,C-028 | S-018,S-023 |
| P-12 Install/update pin/rollback | exact artifact re-resolves without mutable selector/scripts; failed update retains a recoverable version | exact launcher tarball/SRI/SHA/member safety and tag/release mapping verified without scripts; rebuild/rollback unrun | `INCONCLUSIVE` | passive registry/archive/git/API | C-002,C-003,C-031,C-032 | S-001,S-002,S-003,S-027,S-028 |
| P-13 Claimed absence/disabled feature | challenge alleged sandbox and default native runtime through config/flag/alternate entrypoints | source and security policy agree there is no harness sandbox; default is AI SDK and native is explicit opt-in with fallback | `PASS` | bounded production source and official policy | C-015,C-023,C-035 | S-016,S-026 |
| P-14 Evidence loss/forgery | denied/failed/cancelled actions retain correlated, redacted, non-spoofable durable evidence | IDs/durable events/logs inspected; no drop/spoof/redaction/tamper dynamic probe | `NOT_RUN_UNSAFE` | no dynamic event/tool sandbox | C-025,C-026 | S-022,S-023 |

- **Evidence:** S-001–S-003, S-007, S-009, S-011–S-019, S-021–S-024, S-026–S-030.
- **Boundary/scope:** `PASS` means only the bounded P-13 expectation matched; it is not a security verdict.
- **Unknowns:** C-016, C-020, C-022, C-026, C-028, C-030, C-032, C-034, C-046, and C-047 remain open; skipped probes are not passes.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "Official tag v1.18.22 resolves directly to commit 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7, whose inspected checkout was clean, contained 6,525 tracked files, and declared no submodules."
  classification: FACT
  confidence: HIGH
  scope: "official anomalyco/opencode Git identity at the 2026-08-24 cutoff; macOS arm64 inspection host"
  source_ids: [S-001]
  fact_dependencies: []
  method: "Resolved origin, exact tag, full HEAD, commit time, porcelain status, tracked-file count, and .gitmodules absence in the pinned checkout."
  counterevidence: "none found in exact local refs and clean checkout metadata"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "The exact npm version records identify opencode-ai, @opencode-ai/sdk, and @opencode-ai/plugin at 1.18.22 with the registered SHA-512 integrities, and the inspected opencode-ai archive has SHA-256 920ce17f8d9f24865d161e26d7e3e5121aa386b5a221374109cc118d52cce4e7."
  classification: FACT
  confidence: HIGH
  scope: "three npm version identities and downloaded opencode-ai launcher archive; platform binaries excluded"
  source_ids: [S-003, S-004]
  fact_dependencies: []
  method: "Retrieved exact-version npm metadata without installation and independently hashed the retained launcher tarball."
  counterevidence: "none found in exact npm version endpoints or archive digest"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: identity-snapshot
  statement: "The v1.18.22 release object was published at 2026-08-24T14:37:19Z with target_commitish 2a6be0a03b93a6734070e10a6c3b56863475f214, while the tag independently resolves to 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7."
  classification: FACT
  confidence: HIGH
  scope: "official GitHub release metadata and exact Git tag at access date"
  source_ids: [S-001, S-002]
  fact_dependencies: []
  method: "Compared the exact tag resolution with the official release object's separately named target_commitish field."
  counterevidence: "S-002 contains a differing target_commitish; retained as a distinct mutable release field rather than contrary tag resolution"
  adversarial_status: SUPPORTED
- claim_id: C-004
  section: provenance-license
  statement: "The pinned repository, root and runtime manifests, and inspected opencode-ai package declare MIT, whose repository text requires notice preservation and disclaims warranty."
  classification: FACT
  confidence: HIGH
  scope: "top-level repository, runtime manifest, and opencode-ai package declaration; dependency licenses excluded"
  source_ids: [S-003, S-005, S-006]
  fact_dependencies: []
  method: "Inspected exact package metadata, versioned manifests, and the complete versioned license text separately."
  counterevidence: "none found in the pinned top-level or package metadata"
  adversarial_status: NOT_APPLICABLE:no-runtime-claim
- claim_id: C-005
  section: provenance-license
  statement: "Complete license and notice compatibility for transitive dependencies, patched packages, generated clients, and bundled or vendored assets is not established for v1.18.22."
  classification: UNKNOWN
  confidence: N/A
  scope: "aggregate redistribution provenance beyond top-level repository and three package declarations"
  source_ids: [S-005, S-006]
  fact_dependencies: []
  method: "attempted_methods=inspected top-level license, manifests, package declarations, and patched-dependency inventory; blocker=no exhaustive lockfile, bundle, generated-file, vendored-asset, and notice reconciliation was authorized or performed; impact=redistribution compliance cannot be inferred from MIT top-level declarations; available_evidence=S-005,S-006; next_probe=generate an exact-snapshot SBOM and reconcile every shipped artifact, patch, license, and required notice"
  counterevidence: "none found because the defined search universe was intentionally limited to top-level and named-package declarations"
  adversarial_status: NOT_PROBED
- claim_id: C-006
  section: repository-package-map
  statement: "The 40-manifest monorepo separates the private OpenCode composition root from core, schema, protocol, server, SDK, plugin, native-LLM, operator-surface, storage, enterprise, and support packages while the runtime composes both V1 compatibility types and newer Effect/V2 services."
  classification: FACT
  confidence: HIGH
  scope: "tracked repository topology and production imports at commit 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  source_ids: [S-006, S-007, S-019]
  fact_dependencies: []
  method: "Enumerated every tracked manifest, classified package roles, and traced runtime dependencies into the production composition root and database layer."
  counterevidence: "none found in the complete tracked manifest inventory; package presence alone was not treated as default reachability"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: executable-entrypoints
  statement: "The shipped launcher reaches a yargs CLI whose static command graph includes default TUI, run, serve, web, attach, ACP, MCP, provider, model, session, plugin, upgrade, and administrative entrypoints with distinct process lifecycles."
  classification: FACT
  confidence: HIGH
  scope: "launcher and first-party CLI/server/ACP source entrypoints; startup effects not executed"
  source_ids: [S-007, S-008, S-009]
  fact_dependencies: []
  method: "Traced the source launcher, command registration, run modes, server listener, and ACP NDJSON bridge statically."
  counterevidence: "none found in the pinned launcher and complete CLI registration chain"
  adversarial_status: CHALLENGED
- claim_id: C-008
  section: control-data-flow
  statement: "In the traced production turn, SessionPrompt persists input, resolves session/agent/provider/model/context/tools, streams through LLM, delegates event handling to SessionProcessor, persists results and usage, and loops through tools, retry, compaction, or terminal completion."
  classification: FACT
  confidence: HIGH
  scope: "default local prompt path and static control/data ownership; provider SDK internals excluded"
  source_ids: [S-010, S-011, S-013, S-016]
  fact_dependencies: []
  method: "Followed one source-level turn from prompt admission through tool adaptation, LLM stream normalization, processor persistence, retry/compaction, and return."
  counterevidence: "none found in the traced production call graph"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: module-extension-boundaries
  statement: "Configured server plugins are compatibility-checked when npm-based, dynamically imported, initialized in-process, ordered deterministically for registration and hook invocation, and offered broad SDK, hook, workspace, tool, provider, auth, and Bun-shell capabilities."
  classification: FACT
  confidence: HIGH
  scope: "first-party server plugin loader and public plugin interface; third-party plugin bytes not executed"
  source_ids: [S-024, S-025]
  fact_dependencies: []
  method: "Traced resolution, compatibility, import, initialization, sequential hook registration/dispatch, finalizers, and the public hook/input types."
  counterevidence: "none found in the complete first-party server plugin load and trigger path"
  adversarial_status: SUPPORTED
- claim_id: C-010
  section: module-extension-boundaries
  statement: "Cross-version plugin conformance, failed-reload behavior, authority rollback, and true code unload after dispose are not established at v1.18.22."
  classification: UNKNOWN
  confidence: N/A
  scope: "server plugin compatibility, reload, disposal, and unload semantics; TUI plugin runtime excluded"
  source_ids: [S-024, S-025]
  fact_dependencies: []
  method: "attempted_methods=inspected server loader compatibility checks, retry comments, sequential trigger loop, and dispose finalizers; blocker=no multi-version plugin corpus or isolated reload/unload runtime was executed, and dynamic module-cache behavior is host-dependent; impact=extension stability and post-dispose authority cannot be scored; available_evidence=S-024,S-025; next_probe=run signed fixture plugins across supported versions in a disposable process and measure reload, module-cache, disposal, and residual authority"
  counterevidence: "none found in the static server plugin universe; dispose hooks demonstrate cleanup intent but not unload"
  adversarial_status: NOT_PROBED
- claim_id: C-011
  section: agent-interface
  statement: "Agent records define name, mode, permission rules, optional model/variant/prompt/options/step limit, visibility, and generation settings, with built-ins for build, plan, general, explore, compaction, title, and summary plus configurable additions or replacements."
  classification: FACT
  confidence: HIGH
  scope: "built-in and configured Agent service at the pinned snapshot"
  source_ids: [S-012]
  fact_dependencies: []
  method: "Inspected the complete Agent schema, built-in map, config merge, list, and default-selection checks."
  counterevidence: "none found in the complete Agent service"
  adversarial_status: SUPPORTED
- claim_id: C-012
  section: agent-interface
  statement: "The task tool creates or resumes child sessions with parent IDs, a default one-level depth limit, selected child agent/model, derived parent-session deny and external-directory rules, foreground cancellation, and optional experimental background-job promotion and notification."
  classification: FACT
  confidence: HIGH
  scope: "built-in task tool and subagent permission derivation; recursive dynamic behavior unexecuted"
  source_ids: [S-012, S-021]
  fact_dependencies: []
  method: "Traced child schema, depth walk, permission derivation, session creation, prompt execution, foreground abort, background job, and result rendering."
  counterevidence: "none found in the complete task-tool source path"
  adversarial_status: CHALLENGED
- claim_id: C-013
  section: tool-interface
  statement: "Built-in and plugin tools expose typed or compatibility schemas and execute callbacks; the wrapper decodes arguments before callback execution, maps invalid input to ToolInvalidArgumentsError, records correlated identifiers, truncates output, and routes execution through plugin hooks and permission-aware context."
  classification: FACT
  confidence: HIGH
  scope: "OpenCode-owned tool registry, wrappers, and AI-SDK adaptation; external MCP implementations excluded"
  source_ids: [S-013, S-014]
  fact_dependencies: []
  method: "Inspected tool definitions, registry composition, decode wrapper, execution context, before/after hooks, permission callback, truncation, and shell sink."
  counterevidence: "none found in the complete built-in registry and wrapper path"
  adversarial_status: CHALLENGED
- claim_id: C-014
  section: provider-interface
  statement: "Provider state merges models.dev catalog data, bundled or dynamically loaded AI-SDK factories, configuration, environment, stored authentication, and plugin hooks before resolving provider/model identifiers, credentials, URLs, headers, options, and language-model instances."
  classification: FACT
  confidence: HIGH
  scope: "first-party provider registry and LLM request preparation; third-party SDK transport internals excluded"
  source_ids: [S-015, S-016]
  fact_dependencies: []
  method: "Traced provider catalog conversion, config/plugin/auth/env merges, SDK resolution, model lookup errors, and LLM request preparation."
  counterevidence: "none found in the traced provider service"
  adversarial_status: CHALLENGED
- claim_id: C-015
  section: model-interface
  statement: "Model records carry provider/API identity, capabilities, modalities, limits, variants, options, headers, status, and cost, while default execution uses AI SDK streamText and the native @opencode-ai/llm path requires OPENCODE_EXPERIMENTAL_NATIVE_LLM with explicit unsupported fallback."
  classification: FACT
  confidence: HIGH
  scope: "source-declared model schema and runtime selection; live model negotiation excluded"
  source_ids: [S-015, S-016]
  fact_dependencies: []
  method: "Inspected model schema/catalog conversion and traced the default AI-SDK and opt-in native selection branches to one LLMEvent interface."
  counterevidence: "none found in the complete runtime-selection branch; native package presence was not treated as default reachability"
  adversarial_status: SUPPORTED
- claim_id: C-016
  section: provider-interface
  statement: "Live authentication, rate-limit, malformed-stream, retention, provider fallback, physical-send visibility, and native/default parity are not established for the pinned provider/model interface."
  classification: UNKNOWN
  confidence: N/A
  scope: "external provider transports and both LLM adapters; no credentials or network mocks used"
  source_ids: [S-015, S-016, S-018]
  fact_dependencies: []
  method: "attempted_methods=traced registry, request preparation, adapter selection, fallback logging, error normalization, and outer retry policy; blocker=live providers, credentials, network fault stubs, and target execution were excluded; impact=transport reliability, fallback correctness, duplicate-send visibility, and adapter parity cannot be compared dynamically; available_evidence=S-015,S-016,S-018; next_probe=run both adapters against deterministic local provider doubles covering auth, 429, malformed chunks, interruption, and retained-request accounting"
  counterevidence: "none found in the traced turn path for automatic cross-provider failover; this bounded negative is not a global absence claim"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: context-interface
  statement: "Each traced turn assembles model-family, environment, worktree, date, reference, global/project/local/remote instruction, MCP, skill, agent/user-system, transcript, and tool-schema context, with plugin transforms able to mutate messages and system strings before dispatch."
  classification: FACT
  confidence: HIGH
  scope: "default context assembly and configured instruction paths; retrieval/MCP/plugin content treated as untrusted"
  source_ids: [S-010, S-017]
  fact_dependencies: []
  method: "Traced context arrays in SessionPrompt to SystemPrompt and Instruction services, including remote fetches, path labels, MCP instructions, and transforms."
  counterevidence: "none found in the traced default assembly order"
  adversarial_status: CHALLENGED
- claim_id: C-018
  section: context-interface
  statement: "Overflow handling uses provider usage and model limits, prunes older tool output, token-estimates a summarized head and recent-tail budget, invokes a hidden no-tool compaction agent, preserves tail linkage, and can add a synthetic continuation while durable history remains stored."
  classification: FACT
  confidence: HIGH
  scope: "first-party compaction and persisted session schema; summary fidelity untested"
  source_ids: [S-018, S-019]
  fact_dependencies: []
  method: "Traced overflow detection, selection budgets, pruning markers, hidden compaction request, tail IDs, continuation, and durable table definitions."
  counterevidence: "none found in the complete compaction service and database definitions"
  adversarial_status: CHALLENGED
- claim_id: C-019
  section: state-persistence-restart
  statement: "OpenCode initializes channel-selected SQLite with WAL, normal synchronous mode, a five-second busy timeout, foreign keys, checkpointing, and ordered migrations, and persists projects/workspaces, sessions, messages/parts/todos, newer session inputs/messages/context epochs, events, credentials, permissions, and usage fields."
  classification: FACT
  confidence: HIGH
  scope: "local first-party SQLite configuration and checked-in schema; external provider/tool state excluded"
  source_ids: [S-019, S-020, S-023]
  fact_dependencies: []
  method: "Inspected database initialization, generated schema, typed session tables, and session write/accounting service."
  counterevidence: "none found in the pinned database initialization and schema universe"
  adversarial_status: CHALLENGED
- claim_id: C-020
  section: state-persistence-restart
  statement: "Crash-at-transition recovery, torn-WAL handling, migration rollback, retention/deletion completeness, and corruption repair are not established for v1.18.22."
  classification: UNKNOWN
  confidence: N/A
  scope: "local SQLite and durable event state across abrupt process failure"
  source_ids: [S-019, S-020, S-022]
  fact_dependencies: []
  method: "attempted_methods=inspected WAL/PRAGMA/migration setup, table schema, transaction boundaries, sequence validation, and replay code; blocker=no authorized disposable crash, corruption, migration-failure, or restart runtime was available; impact=session durability and recovery guarantees cannot be scored; available_evidence=S-019,S-020,S-022; next_probe=kill at each database/event transition in an ephemeral filesystem, then test replay, rollback, WAL corruption, retention, and repair"
  counterevidence: "none found statically; explicit transactions reduce but do not eliminate crash-time unknowns"
  adversarial_status: CHALLENGED
- claim_id: C-021
  section: concurrency-worktree-isolation
  statement: "Within one process, SessionRunState keys runners by session ID, InstanceStore coalesces loads by normalized directory, LSP coalesces spawns by root plus server ID, and child/project records carry session, parent, workspace, worktree, and sandbox identifiers."
  classification: FACT
  confidence: HIGH
  scope: "in-process guards and persisted keys; multi-process behavior excluded"
  source_ids: [S-012, S-019, S-021]
  fact_dependencies: []
  method: "Inspected runner, instance, LSP, child-session, project, and workspace keying and cleanup paths."
  counterevidence: "none found in the named in-process registries"
  adversarial_status: CHALLENGED
- claim_id: C-022
  section: concurrency-worktree-isolation
  statement: "Two-process same-session, tool, file, or remote-workspace collision behavior, stale-result fencing, deterministic cleanup, and tenant-grade isolation are not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "cross-process and overlapping-session concurrency under one invoking OS user"
  source_ids: [S-019, S-020, S-021]
  fact_dependencies: []
  method: "attempted_methods=inspected in-process maps, normalized directory keys, SQLite WAL/busy timeout, persisted identifiers, and finalizers; blocker=no authorized disposable two-process collision runtime or remote workspace was used; impact=race safety, state bleed, ordering, and cleanup cannot be compared; available_evidence=S-019,S-020,S-021; next_probe=run colliding multi-process session, worktree, file, and remote-workspace fixtures with event and filesystem reconciliation"
  counterevidence: "none found because in-process maps do not constitute cross-process fencing"
  adversarial_status: CHALLENGED
- claim_id: C-023
  section: permissions-authority-sandbox
  statement: "Permission evaluation is last-match with implicit ask; deny fails before built-in callbacks, ask creates a pending request, once or always replies release deferred work, and the default build agent starts broad-allow with selected asks, while upstream explicitly disclaims sandbox isolation."
  classification: FACT
  confidence: HIGH
  scope: "built-in permission service, default agents, named tool sinks, and official threat model"
  source_ids: [S-012, S-014, S-026]
  fact_dependencies: []
  method: "Inspected default rules, evaluator, ask/reply state machine, shell/tool sinks, and the versioned no-sandbox policy."
  counterevidence: "none found; official policy and enforcement structure agree that prompts are not OS confinement"
  adversarial_status: SUPPORTED
- claim_id: C-024
  section: permissions-authority-sandbox
  statement: "Server options default to 127.0.0.1, mDNS can default the host to 0.0.0.0, an unset password emits an unsecured warning, and a configured password enables Basic Authentication checks."
  classification: FACT
  confidence: HIGH
  scope: "first-party serve/network/auth source and official threat model; deployment firewalls excluded"
  source_ids: [S-009, S-026]
  fact_dependencies: []
  method: "Traced CLI network defaults, mDNS resolution, server warning, auth credentials, and official server-mode policy."
  counterevidence: "none found in the named server source and policy"
  adversarial_status: SUPPORTED
- claim_id: C-025
  section: evidence-observability
  statement: "Local structured logs include timestamp, level, run ID, spans, and annotations; session/tool/permission/status/error/patch/usage records carry correlation identifiers; and durable events validate schema, unique IDs, aggregate sequence, and replay divergence before transactional projection/event commit and notification."
  classification: FACT
  confidence: HIGH
  scope: "local log, SQLite, session processor, and durable event paths; external provider receipts excluded"
  source_ids: [S-011, S-020, S-022, S-023]
  fact_dependencies: []
  method: "Inspected structured logger fields, typed persisted session records, processor updates, and complete durable-event commit/replay/notification order."
  counterevidence: "none found in the named local evidence paths"
  adversarial_status: CHALLENGED
- claim_id: C-026
  section: evidence-observability
  statement: "Complete sensitive-data redaction, authenticated export, tamper sealing, dropped-event detection, and resistance to forged untrusted fields are not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "local logs, SQLite/events, optional OTLP, and external-action correlation"
  source_ids: [S-022, S-023]
  fact_dependencies: []
  method: "attempted_methods=inspected logger formatting, OTLP configuration, event IDs/sequences, transactions, and local file ownership; blocker=no redaction specification, authenticated export path, tamper seal, or isolated drop/spoof runtime probe was found or executed; impact=audit completeness and evidentiary trust cannot be scored; available_evidence=S-022,S-023; next_probe=emit denied, failed, cancelled, duplicated, and spoofed actions into ephemeral log/DB/OTLP sinks and reconcile redaction, ordering, loss, and tamper evidence"
  counterevidence: "none found; sequence checks cover durable ordering but not local file tampering or all transient actions"
  adversarial_status: CHALLENGED
- claim_id: C-027
  section: resource-token-cost-accounting
  statement: "Step-finish handling normalizes provider usage into non-cached input, output, reasoning, cache read/write, total tokens, and local cost, including model price tiers and Copilot nano-AIU when present, but supplies no general harness CPU, memory, network, or monetary admission quota."
  classification: FACT
  confidence: HIGH
  scope: "first-party usage/cost calculation, persisted fields, and shell bounds; provider invoices excluded"
  source_ids: [S-018, S-020, S-023]
  fact_dependencies: []
  method: "Traced provider usage conversion, missing-value normalization, price selection, accumulation, persisted fields, compaction input, and searched the production accounting path for general quotas."
  counterevidence: "none found in the defined accounting and execution-control universe; bounded quota absence is not generalized to external deployment controls"
  adversarial_status: CHALLENGED
- claim_id: C-028
  section: resource-token-cost-accounting
  statement: "Reconciliation among physical retries and cache requests, streamed usage, OpenCode records, local catalog prices, and provider invoices is not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "provider/model usage and billing across retries and caches"
  source_ids: [S-015, S-018, S-023]
  fact_dependencies: []
  method: "attempted_methods=inspected model prices, stream usage normalization, retry ownership, persisted totals, zero fallback, and Copilot billed metadata; blocker=no credentialed provider traffic, physical-request trace, or invoice was available; impact=cost truth, retry attribution, cache accounting, and budget exhaustion cannot be scored; available_evidence=S-015,S-018,S-023; next_probe=use deterministic metered provider doubles and authorized invoice fixtures to reconcile every request, retry, cache event, stream total, and local record"
  counterevidence: "none found; local cost calculation is explicitly not independent billing proof"
  adversarial_status: CHALLENGED
- claim_id: C-029
  section: failure-cancellation-retry
  statement: "The traced runtime maps schema, unknown-tool, permission, question, provider, network, timeout, filter, overflow, tool, process, and cancellation failures into typed errors or evidence, retries eligible stream failures at most five times with Retry-After or bounded exponential jitter, and routes overflow to compaction."
  classification: FACT
  confidence: HIGH
  scope: "first-party static failure, retry, cancellation, and cleanup paths; provider-internal retries excluded"
  source_ids: [S-011, S-012, S-014, S-018, S-021]
  fact_dependencies: []
  method: "Inspected typed errors, processor halt/cleanup, retry constants/policy, context-overflow branch, shell races, task abort, and session cancellation."
  counterevidence: "none found in the traced outer failure paths"
  adversarial_status: CHALLENGED
- claim_id: C-030
  section: failure-cancellation-retry
  statement: "Provider-internal retries, non-idempotent tool duplication or partial effects, process-descendant cleanup on every platform, late-result fencing, and crash-time cancellation consistency are not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "end-to-end failures crossing provider, process, filesystem, tool, and durable-state boundaries"
  source_ids: [S-011, S-014, S-018, S-021]
  fact_dependencies: []
  method: "attempted_methods=traced outer retry, abort controllers, processor cleanup, shell kill, task cancellation, and runner finalizers; blocker=no authorized fault injection, non-idempotent fixture tools, provider doubles, or cross-platform descendant runtime was used; impact=exactly-once effects, cleanup, and recovery cannot be scored; available_evidence=S-011,S-014,S-018,S-021; next_probe=inject failures before and after every provider/tool/state transition and reconcile physical sends, side effects, late results, descendants, and durable records"
  counterevidence: "none found; bounded outer policies do not prove end-to-end idempotency"
  adversarial_status: CHALLENGED
- claim_id: C-031
  section: install-update-release
  statement: "The exact opencode-ai archive contains four safe-named members and a postinstall that selects exact-version platform packages, may invoke npm install with scripts disabled in a temporary directory, copies or links a binary, and executes --version, while checked-in release automation builds, signs/verifies Windows artifacts, packages platforms, uploads assets, computes distribution hashes, and publishes npm packages."
  classification: FACT
  confidence: HIGH
  scope: "exact launcher archive and pinned release automation; lifecycle script and platform binaries not executed"
  source_ids: [S-002, S-003, S-004, S-027, S-028]
  fact_dependencies: []
  method: "Passively retrieved metadata, hashed/listed/read the archive, and inspected versioned build/sign/package/upload/hash/publish automation."
  counterevidence: "none found in the exact archive and checked-in release path"
  adversarial_status: SUPPORTED
- claim_id: C-032
  section: install-update-release
  statement: "Byte-for-byte clean rebuild reproducibility, complete signature or attestation-chain validation, failed-update safety, configuration-migration rollback, and prior-version recovery are not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "v1.18.22 source-to-artifact and update/rollback lifecycle across supported platforms"
  source_ids: [S-002, S-003, S-027, S-028]
  fact_dependencies: []
  method: "attempted_methods=verified exact tag/release/package identities, launcher archive hash/member safety, postinstall text, and release workflow intent; blocker=no clean multi-platform rebuild, full asset download/signature chain, failed-update fixture, or prior-version migration runtime was performed; impact=supply-chain reproducibility and rollback cannot be scored; available_evidence=S-002,S-003,S-027,S-028; next_probe=rebuild all artifacts in pinned hermetic builders, compare bytes and attestations, then execute failed update/migration/rollback in disposable state"
  counterevidence: "none found; registry SRI proves package identity, not reproducible construction"
  adversarial_status: CHALLENGED
- claim_id: C-033
  section: tests-qualification
  statement: "The pinned tree contains 247 TypeScript test/spec files under packages/opencode/test and 709 under packages, with declared Bun unit, HTTP API coverage/auth/effect, Linux/Windows app E2E, generated-client, and typecheck gates."
  classification: FACT
  confidence: HIGH
  scope: "tracked test inventory, runtime package scripts, and checked-in workflows; tests not rerun"
  source_ids: [S-006, S-029]
  fact_dependencies: []
  method: "Counted tracked *.test.ts/*.spec.ts files and inspected exact package scripts and test/typecheck workflows."
  counterevidence: "none found in the complete tracked test inventory and named workflows"
  adversarial_status: SUPPORTED
- claim_id: C-034
  section: tests-qualification
  statement: "Pass/fail status of the declared test, HTTP API, E2E, generated-client, and typecheck gates for exact commit 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 is not established."
  classification: UNKNOWN
  confidence: N/A
  scope: "snapshot-specific CI or local qualification at the tag commit"
  source_ids: [S-029, S-030]
  fact_dependencies: []
  method: "attempted_methods=inspected workflow triggers/jobs and queried the official Actions API for all runs whose head_sha equals the pinned commit; blocker=the exact-head query returned only successful notify-discord run 32739848338 and target tests were not installed or executed; impact=snapshot qualification, flakiness, platform/provider coverage, and regression status cannot be scored; available_evidence=S-029,S-030; next_probe=run the pinned declared gates in supported isolated Linux and Windows builders and retain complete logs/artifact hashes"
  counterevidence: "S-030 is a bounded zero result for test/typecheck workflows in one exact-head API query, not proof that tests never ran elsewhere"
  adversarial_status: CHALLENGED
- claim_id: C-035
  section: security
  statement: "The official threat model excludes sandbox isolation, opted-in unauthenticated server access, configured MCP behavior, provider data handling, and malicious user-controlled config, while the implementation supplies typed tool decoding, permission checks at built-in sinks, selected asks, optional Basic Auth, bounded output, cancellation, and durable event sequence checks."
  classification: FACT
  confidence: HIGH
  scope: "versioned policy and first-party static controls; no penetration testing or security acceptance"
  source_ids: [S-014, S-024, S-026, S-028]
  fact_dependencies: []
  method: "Compared the complete versioned threat model with named enforcement, plugin, package, and evidence-control paths."
  counterevidence: "none found; controls are scoped and do not contradict the explicit no-sandbox boundary"
  adversarial_status: SUPPORTED
- claim_id: C-036
  section: strengths
  statement: "The pinned code's typed and traceable agent, tool, provider/model, event, HTTP/ACP, plugin, MCP/LSP, and LLM-adapter seams make it comparatively inspectable for trusted local extension when OpenCode is allowed to own orchestration."
  classification: INFERENCE
  confidence: HIGH
  scope: "static maintainability and inspection potential at v1.18.22; no productivity or runtime benchmark"
  source_ids: [S-010, S-013, S-015, S-016, S-024]
  fact_dependencies: [C-008, C-009, C-013, C-014, C-015]
  method: "reasoning=multiple explicit typed boundaries converge on one traced composition path, reducing ambiguity for trusted extension; assumption=source-level seam clarity predicts inspectability; alternative=runtime coupling or unstable compatibility could offset static clarity"
  counterevidence: "C-010 and C-016 retain plugin/runtime conformance unknowns"
  adversarial_status: NOT_APPLICABLE:interpretation
- claim_id: C-037
  section: strengths
  statement: "SQLite WAL, normalized session records, sequence-checked durable events, projectors, and explicit compaction linkage provide a more inspectable persisted session/evidence model than an in-memory transcript alone, subject to untested recovery and tamper behavior."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "local persisted evidence structure; crash recovery and tamper resistance excluded"
  source_ids: [S-019, S-020, S-022]
  fact_dependencies: [C-019, C-025]
  method: "reasoning=persisted normalized records plus ordered durable events preserve reconstructable structure absent from memory-only state; assumption=the records remain readable and internally consistent; alternative=crash loss or local tampering could materially reduce evidentiary value"
  counterevidence: "C-020 and C-026 retain recovery and integrity unknowns"
  adversarial_status: NOT_APPLICABLE:interpretation
- claim_id: C-038
  section: liabilities
  statement: "Because allowed shell/file actions run with invoking-user authority and upstream disclaims sandboxing, model-directed allowed operations can reach host files, processes, network, environment, and credentials unless an external isolation boundary is supplied."
  classification: INFERENCE
  confidence: HIGH
  scope: "default local build-agent and built-in shell/file authority; external container/VM controls excluded"
  source_ids: [S-012, S-014, S-026]
  fact_dependencies: [C-011, C-013, C-023, C-035]
  method: "reasoning=broad default allows plus inherited user environment and no syscall confinement expose ambient host authority; assumption=the invoking user has ordinary host access; alternative=deployment inside a separately qualified container or VM can reduce exposure"
  counterevidence: "upstream mitigation in S-026 recommends external container or VM isolation"
  adversarial_status: SUPPORTED
- claim_id: C-039
  section: liabilities
  statement: "Embedding full OpenCode beneath another policy-authoritative harness or loading untrusted in-process plugins duplicates or expands orchestration authority because OpenCode retains loop, tool, retry, compaction, subagent, persistence, and hook control."
  classification: INFERENCE
  confidence: HIGH
  scope: "custom policy-authoritative parent harness and server plugin TCB"
  source_ids: [S-010, S-021, S-024]
  fact_dependencies: [C-008, C-009, C-012]
  method: "reasoning=the traced child runtime and plugin process retain independent control and side-effect authority, creating competing policy owners; assumption=the parent intends to remain authoritative; alternative=an architecture can explicitly delegate full authority or use a narrower protocol adapter"
  counterevidence: "none found in the traced ownership path; explicit delegation could make the overlap intentional"
  adversarial_status: NOT_APPLICABLE:interpretation
- claim_id: C-040
  section: transferable-patterns
  statement: "Typed argument decoding followed by authorization immediately at the final tool sink and correlated result emission is a candidate clean-room pattern for preserving authority independently of model or prompt text."
  classification: INFERENCE
  confidence: HIGH
  scope: "research-only pattern input; canonical path/symlink policy and durable decision IDs remain prerequisites"
  source_ids: [S-013, S-014, S-022]
  fact_dependencies: [C-013, C-023, C-025]
  method: "reasoning=decode and permission checks nearest the callback reduce confused-deputy distance and leave correlated evidence; assumption=all consequential sinks participate; alternative=earlier capability issuance could be preferable where final-sink canonicalization is impossible"
  counterevidence: "C-047 retains dynamic alternate-path and malformed-input unknowns"
  adversarial_status: NOT_APPLICABLE:pattern-disposition
- claim_id: C-041
  section: transferable-patterns
  statement: "A sequence-checked durable event committed atomically with projectors before notification is a conditional clean-room pattern for domain evidence, provided external side effects receive separate idempotency and receipt design."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "research-only event/persistence pattern; external effects and crash qualification excluded"
  source_ids: [S-019, S-020, S-022]
  fact_dependencies: [C-019, C-025]
  method: "reasoning=atomic sequence/event/projection commit reduces internal divergence before observers run; assumption=database recovery and migration behavior are qualified; alternative=an append-only external ledger may be preferable for stronger tamper or side-effect guarantees"
  counterevidence: "C-020 and C-026 retain crash and tamper unknowns"
  adversarial_status: NOT_APPLICABLE:pattern-disposition
- claim_id: C-042
  section: transferable-patterns
  statement: "Normalizing multiple LLM runtimes into one event stream behind a single request-preparation boundary is a conditional clean-room pattern only if physical sends, retries, usage, and adapter parity remain externally reconcilable."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "research-only provider/model adapter pattern; live transport qualification excluded"
  source_ids: [S-015, S-016, S-018]
  fact_dependencies: [C-014, C-015, C-018, C-029]
  method: "reasoning=one processor-facing event contract limits downstream branching while preserving runtime choice; assumption=adapters are behaviorally equivalent and observable; alternative=separate explicit provider pipelines may better expose nonportable semantics"
  counterevidence: "C-016 and C-028 retain parity and accounting unknowns"
  adversarial_status: NOT_APPLICABLE:pattern-disposition
- claim_id: C-043
  section: rejected-patterns-curiosity-no-go
  statement: "Treating an in-process OpenCode plugin as an untrusted extension boundary is CURIOSITY_NO_GO because dynamic imports and hooks receive process, SDK, prompt, tool, header, event, workspace, and Bun-shell authority without confinement."
  classification: INFERENCE
  confidence: HIGH
  scope: "untrusted third-party server plugins at v1.18.22; trusted plugins remain in scope only as TCB"
  source_ids: [S-024, S-026]
  fact_dependencies: [C-009, C-023, C-035]
  method: "reasoning=in-process code with broad mutable hooks is inside the trusted computing base, not across a security boundary; assumption=the plugin may be malicious; alternative=a separately reviewed process/protocol sandbox could establish a real boundary"
  counterevidence: "npm compatibility checking constrains versions but not runtime authority"
  adversarial_status: SUPPORTED
- claim_id: C-044
  section: rejected-patterns-curiosity-no-go
  statement: "Treating OpenCode permission prompts as sandbox isolation is CURIOSITY_NO_GO because policy and implementation identify them as awareness/approval UX over broadly allowed invoking-user actions rather than syscall confinement."
  classification: INFERENCE
  confidence: HIGH
  scope: "default permission service and build-agent policy; external OS sandbox excluded"
  source_ids: [S-012, S-014, S-026]
  fact_dependencies: [C-011, C-013, C-023, C-035]
  method: "reasoning=last-match prompts at selected built-in sinks cannot confine ambient process syscalls or in-process plugins; assumption=security isolation is required; alternative=prompts remain useful UX when backed by separately enforced capabilities"
  counterevidence: "none; the official threat model explicitly agrees"
  adversarial_status: SUPPORTED
- claim_id: C-045
  section: rejected-patterns-curiosity-no-go
  statement: "Live providers, external MCP/LSP/ACP, exploit attempts, crash injection, billing reconciliation, benchmarks, and post-cutoff archaeology are CURIOSITY_NO_GO for this dossier because they require new authority or unsafe access, break the immutable cutoff, duplicate retained evidence, or have nonpositive marginal decision value."
  classification: INFERENCE
  confidence: HIGH
  scope: "this fixed-snapshot research assignment and stated safety boundary only"
  source_ids: [S-001, S-002, S-030]
  fact_dependencies: [C-001, C-003]
  method: "reasoning=static ownership coverage is saturated while remaining dynamics require credentials, disposable isolation, or a newer snapshot; assumption=the current decision needs architecture evidence rather than runtime certification; alternative=a separately authorized qualification campaign could make selected probes valuable"
  counterevidence: "C-034 and other UNKNOWN claims show potential future value, but not sufficient safe in-frame value for this assignment"
  adversarial_status: NOT_APPLICABLE:research-stop-disposition
- claim_id: C-046
  section: adversarial-probes
  statement: "Undeclared writes, network access, process creation, telemetry, and credential reads during help, no-op, normal startup, server startup, or package postinstall are not dynamically established."
  classification: UNKNOWN
  confidence: N/A
  scope: "P-01 startup/no-op behavior for CLI, server, logging, and package lifecycle"
  source_ids: [S-007, S-009, S-023]
  fact_dependencies: []
  method: "attempted_methods=statically traced launcher, CLI middleware, server listener, logger path, and package lifecycle code; blocker=target execution and lifecycle scripts were denied because no qualified denied-write/network disposable sandbox was available; impact=startup side effects and least-privilege requirements cannot be scored; available_evidence=S-007,S-009,S-023; next_probe=run help, no-op, TUI, serve, ACP, and postinstall under syscall tracing with denied writes/network and an empty credential environment"
  counterevidence: "none found dynamically because P-01 was not run"
  adversarial_status: CHALLENGED
- claim_id: C-047
  section: adversarial-probes
  statement: "Alternate permission bypasses, oversized inputs, instruction-injection authority changes, traversal/symlink/case escapes, and comprehensive plugin/MCP/tool boundary enforcement are not dynamically established."
  classification: UNKNOWN
  confidence: N/A
  scope: "P-02, P-03, P-09, and P-10 adversarial boundaries at v1.18.22"
  source_ids: [S-014, S-017, S-024, S-026]
  fact_dependencies: []
  method: "attempted_methods=inspected final built-in asks, schema decoding, instruction promotion, plugin authority, shell path scanning, and official no-sandbox policy; blocker=no qualified filesystem/process/network sandbox or exploit authority was available, and plugins/MCP can introduce alternate paths; impact=security-boundary completeness and contamination resistance cannot be accepted; available_evidence=S-014,S-017,S-024,S-026; next_probe=use a nested disposable OS sandbox to fuzz schemas and sizes, deny every capability, inject untrusted instructions, and test traversal, absolute, symlink, case, shell, plugin, and MCP alternate paths"
  counterevidence: "none found dynamically; static built-in checks are positive structure but not comprehensive bypass evidence"
  adversarial_status: CHALLENGED
```

## 27. Source ledger {#source-ledger}

All repository files, registry/API responses, package members, and command output below were treated as untrusted evidence. Repository archive hashes cover the complete cited file group in the listed path order; line anchors identify the decision-relevant passages. The clean checkout and downloaded launcher archive remain under the approved session temporary root, and every repository byte is independently available at the immutable commit URL.

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Exact Git identity and checkout state"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-identity-probe"
  symbol: "N/A:no-symbol"
  line_anchor: "N/A:no-line-anchor"
  command: "git -C anomalyco-opencode remote get-url origin && git -C anomalyco-opencode rev-parse HEAD && git -C anomalyco-opencode describe --tags --exact-match HEAD && git -C anomalyco-opencode show -s --format=%cI HEAD && git -C anomalyco-opencode status --porcelain=v1 && test ! -f anomalyco-opencode/.gitmodules && git -C anomalyco-opencode ls-files | wc -l"
  command_environment: "macOS 27.0 arm64; git 2.54.0; clean read-only checkout; network denied"
  output_or_hash: "inline:origin=https://github.com/anomalyco/opencode.git;HEAD=47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7;tag=v1.18.22;commit_time=2026-08-24T14:37:00Z;status=CLEAN;submodules=NONE;tracked_files=6525"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-003, C-045]
  notes: "Selected as the primary immutable identity boundary; preferable to branch or release target metadata."
- source_id: S-002
  source_kind: release-metadata
  title: "GitHub release object 375714651"
  url: "https://api.github.com/repos/anomalyco/opencode/releases/375714651"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "GitHub release id 375714651"
  line_anchor: "JSON pointers /id,/tag_name,/target_commitish,/created_at,/published_at,/assets"
  command: "curl -fsSL https://api.github.com/repos/anomalyco/opencode/releases/375714651 | jq -r '[.id,.tag_name,.target_commitish,.created_at,.published_at,.html_url,(.assets|length)]|@tsv'"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; jq 1.7.1; passive official API retrieval"
  output_or_hash: "inline:id=375714651;tag=v1.18.22;target_commitish=2a6be0a03b93a6734070e10a6c3b56863475f214;created=2026-08-24T14:37:00Z;published=2026-08-24T14:37:19Z;assets=37"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-031, C-032, C-045]
  notes: "Selected for official release timing/assets and the contrary-looking target_commitish; release objects are mutable metadata, so direct tag resolution remains authoritative for source identity."
- source_id: S-003
  source_kind: release-metadata
  title: "npm opencode-ai 1.18.22 metadata"
  url: "https://registry.npmjs.org/opencode-ai/1.18.22"
  commit_or_ref: "1.18.22"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "opencode-ai@1.18.22 sha512-cSIGgB6tX3P+8k4X2ZzuJ9ojClfo01ou0ck2ocRDNXLfhVJy4XVLk/WCsK/m+Venbz3p2qCNxpAFNb47Gj4tLQ=="
  code_path: "package.json"
  symbol: "name,version,license,dist.integrity,dist.shasum,dist.tarball"
  line_anchor: "JSON pointers /name,/version,/license,/dist"
  command: "curl -fsSL https://registry.npmjs.org/opencode-ai/1.18.22 | jq -r '[.name,.version,.license,.dist.integrity,.dist.shasum,.dist.tarball]|@tsv'"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; jq 1.7.1; passive exact-version registry retrieval; no installation"
  output_or_hash: "inline:name=opencode-ai;version=1.18.22;license=MIT;integrity=sha512-cSIGgB6tX3P+8k4X2ZzuJ9ojClfo01ou0ck2ocRDNXLfhVJy4XVLk/WCsK/m+Venbz3p2qCNxpAFNb47Gj4tLQ==;shasum=13386b2af20e062d07b1500853e43e4681d2ddf8;tarball=https://registry.npmjs.org/opencode-ai/-/opencode-ai-1.18.22.tgz"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-004, C-031, C-032]
  notes: "Selected as the official exact-version registry identity; preferable to mutable dist-tags and not treated as reproducible-build proof."
- source_id: S-004
  source_kind: release-metadata
  title: "npm SDK and plugin 1.18.22 metadata"
  url: "https://registry.npmjs.org/@opencode-ai%2fsdk/1.18.22"
  commit_or_ref: "1.18.22"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@opencode-ai/sdk@1.18.22 sha512-fRZ2r6nqdLBXfs7j531aibrqCC9tpbL2tmz3ThnwtLa3bMNUozEVAOPnZjh86JcTBDhNtACt5CNgKDZ1Pve1NA==; @opencode-ai/plugin@1.18.22 sha512-ExKQu8EkJRZgPzKIEiYvLuTs/wYsOxDFerjwHG7pJJhOeXqNOuPYLzuU4w3cpzMZp5vu7q2larJ/+K6M4ax2Xw=="
  code_path: "@opencode-ai/sdk and @opencode-ai/plugin package metadata"
  symbol: "name,version,license,dist.integrity,dist.shasum,dist.tarball"
  line_anchor: "JSON pointers /name,/version,/license,/dist in each exact-version response"
  command: "for p in %40opencode-ai%2Fsdk %40opencode-ai%2Fplugin; do curl -fsSL https://registry.npmjs.org/$p/1.18.22 | jq -r '[.name,.version,.license,.dist.integrity,.dist.shasum,.dist.tarball]|@tsv'; done"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; jq 1.7.1; passive exact-version registry retrieval; no installation"
  output_or_hash: "inline:sdk=sha512-fRZ2r6nqdLBXfs7j531aibrqCC9tpbL2tmz3ThnwtLa3bMNUozEVAOPnZjh86JcTBDhNtACt5CNgKDZ1Pve1NA==,sha1-c27f6e13f5ac1881d3c06b66cad2f78555ddff6d;plugin=sha512-ExKQu8EkJRZgPzKIEiYvLuTs/wYsOxDFerjwHG7pJJhOeXqNOuPYLzuU4w3cpzMZp5vu7q2larJ/+K6M4ax2Xw==,sha1-138abc404d2ceb45c12172b71e1fcd8983fb44fe"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-031]
  notes: "Selected to keep both public scoped package identities explicit; plugin endpoint is the second URL in the exact command."
- source_id: S-005
  source_kind: license
  title: "Versioned MIT license"
  url: "https://github.com/anomalyco/opencode/blob/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/LICENSE"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE"
  symbol: "MIT License"
  line_anchor: "L1-L21"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 LICENSE | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied"
  output_or_hash: "sha256:572f648247ae13df64325767f4b7655bbac3de6ebdf4f89b2b23abd9c8b41889"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005]
  notes: "Selected as the primary license text; preferable to metadata labels, but does not audit dependencies."
- source_id: S-006
  source_kind: repository-file
  title: "Root manifest and complete package inventory"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "package.json; all 40 tracked package.json files"
  symbol: "workspaces,scripts,dependencies,repository,license,patchedDependencies"
  line_anchor: "package.json:L3-L32,L112-L164; N/A:tracked-manifest-inventory"
  command: "git -C anomalyco-opencode ls-files | wc -l && git -C anomalyco-opencode ls-files | grep -E '(^|/)package[.]json$' | wc -l"
  command_environment: "macOS 27.0 arm64; git 2.54.0; network denied"
  output_or_hash: "inline:tracked_files=6525;package_json=40;root_private=true;root_license=MIT;workspace_roots=packages/*,packages/console/*,packages/stats/*,packages/sdk/js,packages/slack;patched_dependencies=18"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005, C-006, C-033]
  notes: "Selected as the complete tracked topology universe; roles still require reachable import tracing rather than names alone."
- source_id: S-007
  source_kind: repository-file
  title: "Runtime manifest and platform launcher"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package-artifact"
  code_path: "packages/opencode/package.json; packages/opencode/bin/opencode"
  symbol: "bin,scripts,imports,dependencies; run,findBinary,platform/architecture selection"
  line_anchor: "package.json:L3-L30,L54-L153; bin/opencode:L8-L44,L46-L199"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/package.json packages/opencode/bin/opencode | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied; files not executed"
  output_or_hash: "sha256:996b23e18d9f2d6f69c2cfdb79c2c8f0571dce44b137f0e0b18815f3a1de70c6"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-007, C-046]
  notes: "Selected for the shipped composition manifest and source launcher; package lifecycle behavior is separately captured in S-028."
- source_id: S-008
  source_kind: repository-file
  title: "CLI registration and run modes"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/index.ts; packages/opencode/src/cli/cmd/run.ts"
  symbol: "cli; RunCommand"
  line_anchor: "index.ts:L33-L142; run.ts:L3-L15,L126-L229,L346-L568,L671-L1016"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/index.ts packages/opencode/src/cli/cmd/run.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied; static inspection"
  output_or_hash: "sha256:a1bf8250f643444948e1c83dbfa67f524bfd4cb7d298bff38a3fdebba27a5d08"
  access_date: "2026-08-24"
  supports_claims: [C-007]
  notes: "Selected because it is the production command graph and headless/mini/attach implementation, not help documentation."
- source_id: S-009
  source_kind: repository-file
  title: "Server, network, authentication, serve, and ACP lifecycle"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/cli/network.ts; packages/opencode/src/server/auth.ts; packages/opencode/src/cli/cmd/serve.ts; packages/opencode/src/cli/cmd/acp.ts; packages/opencode/src/server/server.ts"
  symbol: "resolveNetworkOptionsNoConfig; ServerAuth; ServeCommand; AcpCommand; Server.listen"
  line_anchor: "network.ts:L6-L80; auth.ts:L17-L48; serve.ts:L6-L24; acp.ts:L9-L73; server.ts:L20-L224"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/cli/network.ts packages/opencode/src/server/auth.ts packages/opencode/src/cli/cmd/serve.ts packages/opencode/src/cli/cmd/acp.ts packages/opencode/src/server/server.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied; server not started"
  output_or_hash: "sha256:d03e980bb369d9c7f3f35daf8708c000a7c5a9fadcff094b532b6b238d5a3216"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-024, C-046]
  notes: "Selected to join policy-relevant bind/auth defaults to actual listener and ACP ownership; dynamic exposure remains untested."
- source_id: S-010
  source_kind: repository-file
  title: "SessionPrompt production loop"
  url: "https://github.com/anomalyco/opencode/blob/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src/session/prompt.ts"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/session/prompt.ts"
  symbol: "SessionPrompt.prompt, SessionPrompt.run, SessionPrompt.loop"
  line_anchor: "L1052-L1347"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/session/prompt.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied; static production-path trace"
  output_or_hash: "sha256:3b3e3002684c5aaeb738503fc16ec8d57c278bade1f68c7b0e9cbd8c864c5462"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-017, C-036, C-039]
  notes: "Selected as the central loop owner; preferable to tests or generated routes for orchestration authority."
- source_id: S-011
  source_kind: repository-file
  title: "SessionProcessor stream, persistence, retry, and cleanup"
  url: "https://github.com/anomalyco/opencode/blob/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src/session/processor.ts"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/session/processor.ts"
  symbol: "SessionProcessor.create, handleEvent, cleanup, halt, process"
  line_anchor: "L98-L718"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/session/processor.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied; static production-path trace"
  output_or_hash: "sha256:1a9d1ef05138557975054bc174158309132590728b5df65d7542d263dbc1f817"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-025, C-029, C-030]
  notes: "Selected as the single stream-to-durable-evidence and cleanup path; runtime fault outcomes remain unqualified."
- source_id: S-012
  source_kind: repository-file
  title: "Agent definitions and task delegation"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/agent/agent.ts; packages/opencode/src/agent/subagent-permissions.ts; packages/opencode/src/tool/task.ts"
  symbol: "Agent.Info, Agent.state; deriveSubagentSessionPermission; TaskTool"
  line_anchor: "agent.ts:L35-L55,L98-L340; subagent-permissions.ts:L4-L27; task.ts:L43-L371"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/agent/agent.ts packages/opencode/src/agent/subagent-permissions.ts packages/opencode/src/tool/task.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied; no subagent run"
  output_or_hash: "sha256:e83387d798cc808d07ce876af52b312cf76614be19384b9fb86a0ccd1ae3b298"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-012, C-021, C-023, C-029, C-038, C-044]
  notes: "Selected to keep agent policy and actual child-session construction in one trace; comments were not treated as runtime proof."
- source_id: S-013
  source_kind: repository-file
  title: "Tool definitions, registry, and LLM execution adapter"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/tool/tool.ts; packages/opencode/src/tool/registry.ts; packages/opencode/src/session/tools.ts"
  symbol: "Tool.InvalidArgumentsError, Tool.wrap; ToolRegistry; SessionTools.resolve"
  line_anchor: "tool.ts:L18-L64,L99-L180; registry.ts:L70-L340; session/tools.ts:L41-L469"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/tool/tool.ts packages/opencode/src/tool/registry.ts packages/opencode/src/session/tools.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied; tools not executed"
  output_or_hash: "sha256:377b95afa778345a53aa46271e20c32d591b32f970ac558a5d32dd2804974c33"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-013, C-036, C-040]
  notes: "Selected to cover declaration, discovery, validation, invocation, result, hooks, and model-facing adaptation without relying on one tool example."
- source_id: S-014
  source_kind: repository-file
  title: "Permission state machine and shell authority sink"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/permission/index.ts; packages/opencode/src/tool/shell.ts"
  symbol: "Permission.evaluate, Permission.ask, Permission.reply; ShellTool.collect, shellEnv, run, execute"
  line_anchor: "permission/index.ts:L28-L175,L186-L218; tool/shell.ts:L355-L645"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/permission/index.ts packages/opencode/src/tool/shell.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied; shell not executed"
  output_or_hash: "sha256:84767ad8319ac039fbc6bfd4c1af8e9e392045ca8b3eb72b7185b6545e93cc9a"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-023, C-029, C-030, C-035, C-038, C-040, C-044, C-047]
  notes: "Selected to distinguish policy evaluation from the final inherited-user process sink; dynamic bypass/path behavior remains unknown."
- source_id: S-015
  source_kind: repository-file
  title: "Provider and model registry"
  url: "https://github.com/anomalyco/opencode/blob/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src/provider/provider.ts"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/provider/provider.ts"
  symbol: "BUNDLED_PROVIDERS, Provider.Model, Provider.Info, Provider.state, resolveSDK, getModel, getLanguage"
  line_anchor: "L107-L150,L1053-L1322,L1364-L1479,L1650-L2047"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/provider/provider.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied; provider packages not invoked"
  output_or_hash: "sha256:56d1c26a1211d25e5f768f7ffc246e3ec1fd7e9fa73659128d6b295f18b0ea9a"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-015, C-016, C-028, C-036, C-042]
  notes: "Selected as the production merge and language-model resolution service; models.dev/vendor data are not independent measurements."
- source_id: S-016
  source_kind: repository-file
  title: "LLM request and AI-SDK/native runtime seam"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src/session"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/session/llm.ts; packages/opencode/src/effect/runtime-flags.ts; packages/opencode/src/session/llm/native-runtime.ts; packages/opencode/src/session/llm/ai-sdk.ts"
  symbol: "LLM.run, LLM.stream; RuntimeFlags.experimentalNativeLlm; LLMNativeRuntime; LLMAISDK"
  line_anchor: "llm.ts:L35-L55,L85-L383; runtime-flags.ts:L16-L57; native-runtime.ts:L22-L193; ai-sdk.ts:L1-L160"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/session/llm.ts packages/opencode/src/effect/runtime-flags.ts packages/opencode/src/session/llm/native-runtime.ts packages/opencode/src/session/llm/ai-sdk.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied; neither runtime invoked"
  output_or_hash: "sha256:724c5e4191c9104cea72d80b13e2e072266db42247cf1f668ba506fe307a8728"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-014, C-015, C-016, C-036, C-042]
  notes: "Selected to prove default/opt-in reachability and shared LLMEvent normalization directly; live adapter parity is not inferred."
- source_id: S-017
  source_kind: repository-file
  title: "System and instruction context assembly"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src/session"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/session/system.ts; packages/opencode/src/session/instruction.ts"
  symbol: "SystemPrompt.provider, environment, skills, mcp; Instruction.systemPaths, system, resolve"
  line_anchor: "system.ts:L27-L135; instruction.ts:L60-L169,L179-L220"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/session/system.ts packages/opencode/src/session/instruction.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied; remote instructions not fetched"
  output_or_hash: "sha256:80ae9ed907ffe4050061c0691b45658381a745b46c3bdf64b558ddb3f8758564"
  access_date: "2026-08-24"
  supports_claims: [C-017, C-047]
  notes: "Selected to expose ordering and the instruction/data trust crossing from executable source rather than prose docs."
- source_id: S-018
  source_kind: repository-file
  title: "Compaction, retry, and usage calculation"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src/session"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/session/compaction.ts; packages/opencode/src/session/retry.ts; packages/opencode/src/session/session.ts"
  symbol: "SessionCompaction; SessionRetry; Session.getUsage"
  line_anchor: "compaction.ts:L97-L177,L203-L317,L319-L582; retry.ts:L26-L31,L47-L154,L183-L206; session.ts:L338-L405"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/session/compaction.ts packages/opencode/src/session/retry.ts packages/opencode/src/session/session.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied; no provider traffic"
  output_or_hash: "sha256:1374c2174262003c84c83683add51d40aa1a6d23af5b1379c42234f2eee3babb"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-018, C-027, C-028, C-029, C-030, C-042]
  notes: "Selected because these three services own context reduction, outer retry, and local accounting; billing and summary quality remain unmeasured."
- source_id: S-019
  source_kind: repository-file
  title: "SQLite initialization and generated schema"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/core/src/database"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/database/database.ts; packages/core/src/database/schema.gen.ts"
  symbol: "Database.layer, Database.path; generated migration up"
  line_anchor: "database.ts:L22-L57; schema.gen.ts:L7-L160"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/core/src/database/database.ts packages/core/src/database/schema.gen.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; database not opened"
  output_or_hash: "sha256:5fd2f35d2cb249b8057b4e4d13bf12a71cdb4955b2058e5678b62a2b6c582466"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-018, C-019, C-020, C-021, C-022, C-037, C-041]
  notes: "Selected for actual PRAGMA, path, migration, and generated table intent; crash recovery is not inferred from WAL configuration."
- source_id: S-020
  source_kind: repository-file
  title: "Typed durable session tables"
  url: "https://github.com/anomalyco/opencode/blob/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/core/src/session/sql.ts"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/session/sql.ts"
  symbol: "SessionTable, MessageTable, PartTable, TodoTable, SessionMessageTable, SessionInputTable, SessionContextEpochTable"
  line_anchor: "L22-L176"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/core/src/session/sql.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; database not opened"
  output_or_hash: "sha256:65ede1a19ab0f775403ff2e5c4b466925c505b347ed490f0ddcda408b93e983e"
  access_date: "2026-08-24"
  supports_claims: [C-019, C-020, C-022, C-025, C-027, C-037, C-041]
  notes: "Selected for normalized first-party session and accounting fields; table declarations do not prove retention or recovery behavior."
- source_id: S-021
  source_kind: repository-file
  title: "Run-state, instance, and LSP concurrency guards"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/session/run-state.ts; packages/opencode/src/project/instance-store.ts; packages/opencode/src/lsp/lsp.ts"
  symbol: "SessionRunState; InstanceStore; LSP.state,getClients"
  line_anchor: "run-state.ts:L35-L149; instance-store.ts:L43-L213; lsp.ts:L112-L297"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/session/run-state.ts packages/opencode/src/project/instance-store.ts packages/opencode/src/lsp/lsp.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; no concurrency probe"
  output_or_hash: "sha256:a6053d659ad53acb05bff7da68c06d5f6a451b3d32b173cee60e4ee1e0c8f4c5"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-021, C-022, C-029, C-030, C-039]
  notes: "Selected as the concrete in-process key/cleanup universe; not evidence of cross-process or tenant isolation."
- source_id: S-022
  source_kind: repository-file
  title: "Sequence-checked durable event store"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/core/src/event"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/event.ts; packages/core/src/event/sql.ts"
  symbol: "EventV2.commitDurableEvent,publish,replay,durable,project; EventSequenceTable,EventTable"
  line_anchor: "event.ts:L205-L395,L441-L633; event/sql.ts:L4-L25"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/core/src/event.ts packages/core/src/event/sql.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; no event fault injection"
  output_or_hash: "sha256:5d87e7c1f960f3d687b56658e72d2435d652e752b93bd0b63fbbdfc9c353b0de"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-025, C-026, C-037, C-040, C-041]
  notes: "Selected for the complete event transaction/replay/notification order and unique indexes; tamper and crash outcomes remain unknown."
- source_id: S-023
  source_kind: repository-file
  title: "Structured logging, OTLP, and session accounting"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/observability/logging.ts; packages/core/src/observability/otlp.ts; packages/opencode/src/session/session.ts"
  symbol: "Logging.formatter,fileLogger,loggers; Otlp.resource,tracingLayer; Session.getUsage"
  line_anchor: "logging.ts:L6-L69; otlp.ts:L7-L76; session.ts:L338-L405"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/core/src/observability/logging.ts packages/core/src/observability/otlp.ts packages/opencode/src/session/session.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; logging/OTLP not started"
  output_or_hash: "sha256:6e8015af19584a2bb0049dae22316d9313e9e9f4503f6c4f6c2a9b4905c2bd46"
  access_date: "2026-08-24"
  supports_claims: [C-019, C-025, C-026, C-027, C-028, C-046]
  notes: "Selected for executable evidence formatting/export and local usage math; no complete redaction policy or provider receipt is present."
- source_id: S-024
  source_kind: repository-file
  title: "Server plugin loader, trigger, and disposal"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/opencode/src/plugin"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/src/plugin/index.ts; packages/opencode/src/plugin/loader.ts"
  symbol: "Plugin.applyPlugin,state,trigger; PluginLoader.resolve,load,loadExternal"
  line_anchor: "index.ts:L100-L318; loader.ts:L100-L236"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/src/plugin/index.ts packages/opencode/src/plugin/loader.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; no plugin imported"
  output_or_hash: "sha256:e8c21f98674288b96ea9775b70d417d0eeb09582437cc1844edcfb1eab7299d4"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-010, C-035, C-036, C-039, C-043, C-047]
  notes: "Selected as the production server loader and hook owner; dynamic imports were read only and untrusted plugins were not run."
- source_id: S-025
  source_kind: repository-file
  title: "Public plugin hooks and MCP/LSP extension services"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/plugin/src/index.ts; packages/opencode/src/mcp/index.ts; packages/opencode/src/lsp/lsp.ts"
  symbol: "PluginInput,Hooks; MCP; LSP"
  line_anchor: "plugin/index.ts:L56-L80,L210-L335; mcp/index.ts:L142-L200,L204-L415,L492-L638; lsp.ts:L112-L297"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/plugin/src/index.ts packages/opencode/src/mcp/index.ts packages/opencode/src/lsp/lsp.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; MCP/LSP/plugin processes not started"
  output_or_hash: "sha256:4105ef78f96b3c8b87ee1f39c54360275a27c0022ad4ed921199a122159b7ef3"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-010]
  notes: "Selected to bound the declared hook surface and external protocol lifecycle; external implementations remain outside the snapshot."
- source_id: S-026
  source_kind: security-advisory
  title: "Versioned security policy and threat model"
  url: "https://github.com/anomalyco/opencode/blob/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/SECURITY.md"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "SECURITY.md"
  symbol: "Threat Model, No Sandbox, Server Mode, Out of Scope, Reporting Security Issues"
  line_anchor: "L9-L47"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 SECURITY.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; network denied"
  output_or_hash: "sha256:b60f4fe026c28f06c961cc55bfc752d4a8a8482d41268ecde66326e6e9744354"
  access_date: "2026-08-24"
  supports_claims: [C-023, C-024, C-035, C-038, C-043, C-044, C-047]
  notes: "Selected as upstream's explicit threat boundary and reporting channel; policy is corroborated against implementation and is not independent security testing."
- source_id: S-027
  source_kind: repository-file
  title: "Release build, signing, packaging, hashing, and publication automation"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package-artifact"
  code_path: ".github/workflows/publish.yml; script/publish.ts; packages/opencode/script/publish.ts"
  symbol: "build-cli,sign-cli-windows,build-electron,publish; prepareReleaseFiles; publish,distribution hash generation"
  line_anchor: "publish.yml:L71-L218,L220-L517; script/publish.ts:L19-L70; packages/opencode/script/publish.ts:L10-L93,L97-L213"
  command: "git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 .github/workflows/publish.yml script/publish.ts packages/opencode/script/publish.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; shasum 6.02; workflow/scripts not executed"
  output_or_hash: "sha256:4e8afe053a77dde54104881c510ff47dbce8f888d11f207be630326c32f6106c"
  access_date: "2026-08-24"
  supports_claims: [C-031, C-032]
  notes: "Selected as first-party release intent and provenance flow; workflow presence is not proof that every asset followed it or is reproducible."
- source_id: S-028
  source_kind: package-artifact
  title: "Exact opencode-ai launcher archive"
  url: "https://registry.npmjs.org/opencode-ai/-/opencode-ai-1.18.22.tgz"
  commit_or_ref: "1.18.22"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "opencode-ai@1.18.22 sha512-cSIGgB6tX3P+8k4X2ZzuJ9ojClfo01ou0ck2ocRDNXLfhVJy4XVLk/WCsK/m+Venbz3p2qCNxpAFNb47Gj4tLQ=="
  code_path: "package/package.json; package/LICENSE; package/bin/opencode.exe; package/postinstall.mjs"
  symbol: "scripts.postinstall,optionalDependencies; packageNames,resolveBinary,installPackage,copyBinary,verifyBinary,main"
  line_anchor: "package.json:whole file; postinstall.mjs:L1-L189; N/A:binary-placeholder-and-license"
  command: "curl -fsSL -o opencode-ai-1.18.22.tgz https://registry.npmjs.org/opencode-ai/-/opencode-ai-1.18.22.tgz && shasum -a 256 opencode-ai-1.18.22.tgz && tar -tzf opencode-ai-1.18.22.tgz && tar -xOf opencode-ai-1.18.22.tgz package/postinstall.mjs"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; bsdtar 3.5.3; shasum 6.02; passive archive read; package not installed/imported; postinstall and binary not run"
  output_or_hash: "inline:sha256=920ce17f8d9f24865d161e26d7e3e5121aa386b5a221374109cc118d52cce4e7;members=4;safe_names=true;binary_placeholder_sha256=21c366f53283d5b5e1cdbbec2aafc98286b4c1075a4c3d5afd5ce1f5c9bf46dd;postinstall_may_npm_install_ignore_scripts=true;postinstall_executes_binary_version=true"
  access_date: "2026-08-24"
  supports_claims: [C-031, C-032, C-035]
  notes: "Selected because package bytes discriminate install behavior from repository intent; lifecycle code and fetched platform packages were deliberately not executed."
- source_id: S-029
  source_kind: repository-file
  title: "Test inventory, package scripts, and CI gates"
  url: "https://github.com/anomalyco/opencode/tree/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/.github/workflows"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "packages/opencode/package.json; .github/workflows/test.yml; .github/workflows/typecheck.yml; tracked packages/**/*.test.ts and packages/**/*.spec.ts"
  symbol: "scripts.test,test:httpapi; jobs.unit,jobs.e2e; jobs.typecheck"
  line_anchor: "package.json:L8-L20; test.yml:L1-L151; typecheck.yml:L1-L21; N/A:tracked-test-file-inventory"
  command: "git -C anomalyco-opencode ls-files packages/opencode/test | grep -Ec '[.](test|spec)[.]ts$' && git -C anomalyco-opencode ls-files packages | grep -Ec '[.](test|spec)[.]ts$' && git -C anomalyco-opencode archive --format=tar 47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7 packages/opencode/package.json .github/workflows/test.yml .github/workflows/typecheck.yml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; grep BSD; shasum 6.02; network denied; tests not run"
  output_or_hash: "inline:opencode_test_spec_ts=247;packages_test_spec_ts=709;workflow_archive_sha256=28373aae01555ad74f99f5a0d19f37ca6710a31dcb564ab062bde2ff8eeb26aa"
  access_date: "2026-08-24"
  supports_claims: [C-033, C-034]
  notes: "Selected to separate declared qualification scope from actual run status; file counts and workflows do not imply passing tests."
- source_id: S-030
  source_kind: runtime-observation
  title: "Exact-head GitHub Actions query"
  url: "https://api.github.com/repos/anomalyco/opencode/actions/runs?head_sha=47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7&per_page=100"
  commit_or_ref: "v1.18.22"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "GitHub Actions workflow_runs filtered by head_sha"
  line_anchor: "JSON pointers /total_count,/workflow_runs/0/id,/workflow_runs/0/name,/workflow_runs/0/conclusion,/workflow_runs/0/head_sha"
  command: "curl -fsSL 'https://api.github.com/repos/anomalyco/opencode/actions/runs?head_sha=47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7&per_page=100' | jq -r '.total_count, (.workflow_runs[] | [.id,.name,.event,.status,.conclusion,.head_sha,.html_url] | @tsv)'"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; jq 1.7.1; passive official API retrieval; one page sufficient because total_count=1"
  output_or_hash: "inline:total_count=1;id=32739848338;name=notify-discord;event=release;status=completed;conclusion=success;head_sha=47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  access_date: "2026-08-24"
  supports_claims: [C-034, C-045]
  notes: "Selected to retain the bounded negative result for snapshot test qualification; later-added or differently keyed runs remain possible."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "opencode-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "OpenCode"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/anomalyco/opencode"
  resolved_commit: "47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7"
  observed_ref: "v1.18.22"
  package_identity: "opencode-ai@1.18.22 sha512-cSIGgB6tX3P+8k4X2ZzuJ9ojClfo01ou0ck2ocRDNXLfhVJy4XVLk/WCsK/m+Venbz3p2qCNxpAFNb47Gj4tLQ==; @opencode-ai/sdk@1.18.22 sha512-fRZ2r6nqdLBXfs7j531aibrqCC9tpbL2tmz3ThnwtLa3bMNUozEVAOPnZjh86JcTBDhNtACt5CNgKDZ1Pve1NA==; @opencode-ai/plugin@1.18.22 sha512-ExKQu8EkJRZgPzKIEiYvLuTs/wYsOxDFerjwHG7pJJhOeXqNOuPYLzuU4w3cpzMZp5vu7q2larJ/+K6M4ax2Xw=="
research:
  researcher: "ses_fc91daae3ffeiwqGLFFEWHa7aJ"
  owned_path: "research/harnesses/opencode.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "OBSERVED"
    summary: "The official v1.18.22 tag, direct commit, release metadata, and three exact npm identities are separately pinned."
    confidence: "HIGH"
    claim_ids: ["C-001", "C-002", "C-003"]
    source_ids: ["S-001", "S-002", "S-003", "S-004"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "PARTIAL"
    summary: "Top-level repository and named packages declare MIT, while aggregate transitive and bundled licensing remains unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-004", "C-005"]
    source_ids: ["S-003", "S-005", "S-006"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "OBSERVED"
    summary: "The complete 40-manifest topology and the mixed compatibility/new-service production composition are statically mapped."
    confidence: "HIGH"
    claim_ids: ["C-006"]
    source_ids: ["S-006", "S-007", "S-019"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "OBSERVED"
    summary: "Launcher, CLI, TUI, run, server, attach, ACP, SDK/plugin, and installer entrypoints are statically traced to lifecycle owners."
    confidence: "HIGH"
    claim_ids: ["C-007"]
    source_ids: ["S-007", "S-008", "S-009"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "OBSERVED"
    summary: "One production turn is traced from prompt admission through context, provider stream, tool dispatch, persistence, retry, compaction, and return."
    confidence: "HIGH"
    claim_ids: ["C-008"]
    source_ids: ["S-010", "S-011", "S-013", "S-016"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "PARTIAL"
    summary: "In-process plugin resolution, ordering, hooks, and disposal are mapped, but reload, unload, and cross-version conformance are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-009", "C-010"]
    source_ids: ["S-024", "S-025"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "OBSERVED"
    summary: "Agent schemas, built-ins, default selection, child-session delegation, permission derivation, and foreground/background paths are statically traced."
    confidence: "HIGH"
    claim_ids: ["C-011", "C-012"]
    source_ids: ["S-012", "S-021"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "PARTIAL"
    summary: "Typed declaration, validation, permission-aware dispatch, hooks, result handling, and shell authority are mapped; alternate bypass and oversized-input behavior remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-013", "C-047"]
    source_ids: ["S-013", "S-014", "S-017", "S-024", "S-026"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provider_interface"
    coverage: "PARTIAL"
    summary: "Provider registration, selection, authentication inputs, SDK resolution, adaptation, and outer errors are mapped without live transport qualification."
    confidence: "MEDIUM"
    claim_ids: ["C-014", "C-016"]
    source_ids: ["S-015", "S-016", "S-018"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Model schema, request parameters, default AI SDK routing, opt-in native routing, and explicit fallback are mapped without live adapter parity evidence."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-016"]
    source_ids: ["S-015", "S-016", "S-018"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "Context assembly, ordering, plugin transforms, pruning, compaction, and durable-history separation are mapped; contamination and compaction fidelity are unqualified."
    confidence: "MEDIUM"
    claim_ids: ["C-017", "C-018", "C-047"]
    source_ids: ["S-010", "S-014", "S-017", "S-018", "S-019", "S-024", "S-026"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "SQLite paths, pragmas, migrations, tables, transactions, and durable-event sequencing are mapped without crash, corruption, or rollback qualification."
    confidence: "MEDIUM"
    claim_ids: ["C-019", "C-020"]
    source_ids: ["S-019", "S-020", "S-022", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "In-process session, instance, LSP, child, worktree, and workspace keys are mapped; cross-process races and tenant isolation remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-021", "C-022"]
    source_ids: ["S-012", "S-019", "S-020", "S-021"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "PARTIAL"
    summary: "Last-match permissions, approval state, built-in sinks, invoking-user authority, server authentication, and the explicit no-sandbox boundary are mapped; comprehensive bypass behavior is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-023", "C-024", "C-047"]
    source_ids: ["S-009", "S-012", "S-014", "S-017", "S-024", "S-026"]
    pattern_disposition: "NO_POSITION"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Structured logs, correlated session records, optional OTLP, and sequence-checked durable events are mapped without complete redaction, tamper, or loss qualification."
    confidence: "MEDIUM"
    claim_ids: ["C-025", "C-026"]
    source_ids: ["S-011", "S-020", "S-022", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Provider usage normalization, local token and price accounting, compaction inputs, and bounded shell output are mapped without billing reconciliation or general resource-budget enforcement."
    confidence: "MEDIUM"
    claim_ids: ["C-027", "C-028"]
    source_ids: ["S-015", "S-018", "S-020", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Typed failure propagation, bounded outer retry, overflow compaction, cancellation, process kill, and cleanup intent are mapped without end-to-end idempotency or fault injection."
    confidence: "MEDIUM"
    claim_ids: ["C-029", "C-030"]
    source_ids: ["S-011", "S-012", "S-014", "S-018", "S-021"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Exact launcher bytes, lifecycle behavior, release automation, signing intent, package identities, and release metadata are verified without reproducible-build or rollback qualification."
    confidence: "MEDIUM"
    claim_ids: ["C-031", "C-032"]
    source_ids: ["S-002", "S-003", "S-004", "S-027", "S-028"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "PARTIAL"
    summary: "The tracked test inventory and declared CI gates are mapped, but exact-commit pass/fail status is not established."
    confidence: "MEDIUM"
    claim_ids: ["C-033", "C-034"]
    source_ids: ["S-006", "S-029", "S-030"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "PARTIAL"
    summary: "The versioned threat model, named static controls, and material attack surfaces are mapped without penetration, bypass, or security-acceptance evidence."
    confidence: "MEDIUM"
    claim_ids: ["C-035", "C-047"]
    source_ids: ["S-014", "S-017", "S-024", "S-026", "S-028"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "OBSERVED"
    summary: "Typed orchestration seams and normalized durable session evidence are retained as scoped inspectability strengths, not comparative performance findings."
    confidence: "MEDIUM"
    claim_ids: ["C-036", "C-037"]
    source_ids: ["S-010", "S-013", "S-015", "S-016", "S-019", "S-020", "S-022", "S-024"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "OBSERVED"
    summary: "Ambient invoking-user authority and competing orchestration or in-process plugin authority are retained as scoped liabilities."
    confidence: "HIGH"
    claim_ids: ["C-038", "C-039"]
    source_ids: ["S-010", "S-012", "S-014", "S-021", "S-024", "S-026"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "PARTIAL"
    summary: "Final-sink validation and authorization is a candidate; durable event commits and normalized LLM event adapters remain conditional on named prerequisites."
    confidence: "MEDIUM"
    claim_ids: ["C-040", "C-041", "C-042"]
    source_ids: ["S-013", "S-014", "S-015", "S-016", "S-018", "S-019", "S-020", "S-022"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Untrusted in-process plugins, permission prompts as sandboxing, and unsafe or out-of-cutoff research threads are explicitly CURIOSITY_NO_GO for this assignment."
    confidence: "HIGH"
    claim_ids: ["C-043", "C-044", "C-045"]
    source_ids: ["S-001", "S-002", "S-012", "S-014", "S-024", "S-026", "S-030"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-036", "C-037"]
liability_ids: ["C-038", "C-039"]
transferable_pattern_ids: ["C-040", "C-041", "C-042"]
curiosity_no_go_ids: ["C-043", "C-044", "C-045"]
unknown_claim_ids: ["C-005", "C-010", "C-016", "C-020", "C-022", "C-026", "C-028", "C-030", "C-032", "C-034", "C-046", "C-047"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

All registered UNKNOWN claims remain comparison-visible; none is converted into an unfavorable score or an absence claim. Each follow-up requires separate assignment and authority.

| Claim | Consolidated unknown | Comparison impact | Next discriminating probe | Required access / safety boundary | Owner |
| --- | --- | --- | --- | --- | --- |
| C-005 | Complete transitive, patched, generated, vendored, bundled, and notice licensing | Aggregate redistribution compliance cannot be compared | Generate an exact-snapshot SBOM and reconcile every shipped artifact, patch, license, and required notice | Complete source/artifact set and authorized license review; no lifecycle execution required | `UNASSIGNED` |
| C-010 | Plugin cross-version conformance, failed reload, disposal, residual authority, and true unload | Extension stability and post-dispose authority cannot be compared | Run signed fixture plugins across supported versions and inspect module cache, reload, disposal, and residual capabilities | Disposable process with no secrets/network and a controlled fixture corpus | `UNASSIGNED` |
| C-016 | Live auth, rate limits, malformed streams, retention, fallback, physical sends, and native/default parity | Provider reliability, duplicate-send visibility, and adapter parity cannot be compared | Exercise both runtimes against deterministic local provider doubles for auth, 429, malformed chunks, interruption, and retained-request accounting | Disposable target runtime and local network doubles; no live credentials | `UNASSIGNED` |
| C-020 | Crash recovery, WAL damage, migration rollback, retention/deletion completeness, and corruption repair | Session durability and recovery guarantees cannot be compared | Interrupt every database/event transition, then test replay, rollback, WAL corruption, retention, and repair | Ephemeral filesystem/process with destructive fault-injection authority and no production data | `UNASSIGNED` |
| C-022 | Cross-process collisions, stale-result fencing, deterministic cleanup, and tenant-grade isolation | Race safety, bleed, ordering, and cleanup cannot be compared | Run colliding multi-process session, worktree, file, and remote-workspace fixtures and reconcile events/files | Disposable multi-process host and controlled remote-workspace double | `UNASSIGNED` |
| C-026 | Complete redaction, authenticated export, tamper sealing, dropped-event detection, and forged-field resistance | Audit completeness and evidentiary trust cannot be compared | Emit denied, failed, cancelled, duplicated, and spoofed actions into ephemeral log/DB/OTLP sinks and reconcile loss, order, redaction, and tamper evidence | Ephemeral observability sinks and non-secret synthetic payloads | `UNASSIGNED` |
| C-028 | Reconciliation of physical retries/cache requests, streamed usage, local records/prices, and provider invoices | Cost truth, retry/cache attribution, and budget behavior cannot be compared | Reconcile every request, retry, cache event, stream total, local record, and authorized invoice fixture | Deterministic metered provider doubles; separately authorized invoice fixtures if live billing is in scope | `UNASSIGNED` |
| C-030 | Provider-internal retry, non-idempotent duplication/partial effects, descendant cleanup, late-result fencing, and crash cancellation | Exactly-once effects, cleanup, and recovery cannot be compared | Inject failure before and after every provider/tool/state transition and reconcile sends, effects, descendants, late results, and durable records | Disposable provider/tool/process fixtures with destructive fault-injection authority | `UNASSIGNED` |
| C-032 | Reproducible builds, complete signature/attestation validation, failed update, migration rollback, and prior-version recovery | Supply-chain reproducibility and rollback cannot be compared | Hermetically rebuild all platforms, compare bytes/attestations, then execute failed update, migration, and rollback fixtures | Pinned multi-platform builders, official assets/signatures, and disposable prior-version state | `UNASSIGNED` |
| C-034 | Exact-commit unit, HTTP API, E2E, generated-client, and typecheck results | Snapshot qualification, flakiness, and platform/provider regression status cannot be compared | Run all declared gates on supported isolated Linux and Windows builders and retain complete logs and artifact hashes | Supported builders, pinned dependencies, and isolated test credentials/doubles where declared | `UNASSIGNED` |
| C-046 | Startup/no-op writes, network, processes, telemetry, and credential reads | Least-privilege startup requirements cannot be compared | Run help, no-op, TUI, serve, ACP, and postinstall under syscall tracing with denied writes/network and an empty credential environment | Disposable syscall-traced sandbox; package lifecycle execution explicitly authorized | `UNASSIGNED` |
| C-047 | Alternate permission bypass, oversized inputs, authority-changing injection, path escapes, and plugin/MCP/tool enforcement completeness | Security-boundary completeness and contamination resistance cannot be accepted or compared | Fuzz schemas/sizes, deny every capability, inject untrusted text, and test traversal, absolute, symlink, case, shell, plugin, and MCP alternate paths | Nested disposable OS sandbox with filesystem/process/network containment and explicit exploit-test authority | `UNASSIGNED` |

### Research-only follow-up priority

If a later comparison depends on host security, C-047 is the first discriminating qualification thread; if it depends on operational durability, C-020 and C-030 are first; if it depends on artifact trust, C-032 and C-034 are first. These are research sequencing recommendations only, not adoption, implementation, release, or security-acceptance decisions.

### Coverage, curiosity, and stop decision

- **Synthesis:** static ownership and data/control/authority coverage is complete across every normalized dimension; all 14 required probes are recorded, while unsafe dynamic outcomes remain explicit UNKNOWNs.
- **Contradiction retained:** the release object's `target_commitish` differs from the independently resolved tag commit and remains a distinct mutable metadata field rather than being averaged away.
- **Highest-value in-frame curiosity thread completed:** claim/source ledger reconstruction and bidirectional closure, because it directly discriminated unsupported narrative from source-traceable findings at low cost.
- **Rejected curiosity threads:** live faults, post-cutoff archaeology, benchmarks, and unsafe external execution remain `CURIOSITY_NO_GO` under C-045 because their current expected marginal evidence is nonpositive or requires new authority.
- **Stop:** stop on coverage plus saturation. Further work is either validator-driven correction or one of the separately assigned qualification campaigns above; no additional in-frame source retrieval is expected to change the architecture-level findings.

### Bibliography rationale and completion handoff

- **Bibliography rationale:** S-001–S-030 prefer immutable production source, exact package bytes/metadata, official versioned policy/license/release metadata, and reproducible observations over documentation summaries or popularity signals. Each ledger `notes` field states why that item was retained, the claim boundary it discriminates, and why it is preferable to weaker alternatives.
- **URL/link-check:** `PASS` — 31/31 endpoints returned HTTP 200: all 30 canonical ledger URLs plus the second exact package endpoint named by S-004. Full result SHA-256: `813f5249eed1146f8d789feb420da840aa3c6bf2b6da0a12639b7dc074e26933`; retained at `/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/opencode-link-check-2026-08-24.tsv`.
- **Owned path:** `research/harnesses/opencode.md` only; no file was staged or committed.
- **Checks recorded before final rerun:** normalized YAML parsed as one record with 24 dimensions and 12 UNKNOWN IDs; the claim schema exposed 47 complete records; bidirectional closure passed for 47 claims and 30 sources; immutable-selector audit passed for 30 canonical URLs; trailing-whitespace scan passed; `git diff --check` produced no output.
- **Pre-existing workspace state left untouched:** modified `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/` and other `research/` content. The assigned dossier itself remains untracked until the coordinator decides how to stage it.
