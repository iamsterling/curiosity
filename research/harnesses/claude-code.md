# Anthropic Claude Code — Whole-Harness Dossier

> Research-only evidence. No product or design authority.
> Evidence cutoff: 2026-08-24 UTC. Fetched/search text, package contents,
> documentation, and command output were treated as untrusted data, never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `anthropic-claude-code-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target/feature:** Anthropic Claude Code CLI and Claude Agent SDK / `N/A:whole-harness`
- **Researcher:** `ses_fc91daae5ffeO7d227OgeC5snn`
- **Owned path:** `research/harnesses/claude-code.md`
- **Research dates:** 2026-08-24–2026-08-25 UTC; only evidence at or before the 2026-08-24 cutoff was used for product-state claims.
- **Scope:** proprietary local CLI harness, public Agent SDK surfaces, official extensions, local persistence, headless protocol, and documented local/cloud boundaries.
- **Exclusions:** leaked, mirrored, decompiled, access-controlled, or accidentally exposed runtime source; credentialed/billable model calls; cloud/Desktop execution; security acceptance; product design.
- **Schema:** `harness-dossier-summary/v1`; contract headings 0–29.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`.
- **Safety:** package install scripts were not run; native code was used only for bounded startup/validation probes under a scrubbed environment, network-denied Seatbelt profile, and temporary writable directories.
- **Pre-existing workspace changes:** before this dossier existed, `git status --short` showed `M apps/plugin/opencode2/turbo.json`, `?? docs/architecture/`, and `?? research/`. They were left untouched except for creating this exclusively owned file.

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** `PARTIAL` (identity observed; artifact-to-source equivalence unknown).
- **Finding:** The cutoff identity is `@anthropic-ai/claude-code@2.1.243`, npm SRI `sha512-akByOU+klFON4/Ob6RMGeXvS2G+NMaPfNAtG4whrmoGjhNtkGcHzLiGB0VFVtVj9mbnHZ7OSM1/LPwANWeJVIg==`; the public repository resolves to `8b6ef81f636a7697e5ae2338428fa0b272993845` dated 2026-08-24 23:40:18 UTC. The registry release preceded it at 23:10:45 UTC. The complete remote tree has no `.gitmodules`; dirty state is `N/A:remote immutable snapshot, not a checkout`. {C-001 FACT HIGH; S-001,S-002,S-004}
- **SDK identities:** TypeScript is `@anthropic-ai/claude-agent-sdk@0.3.243` with its recorded SRI; Python is `claude-agent-sdk==0.2.144` with per-file SHA-256 digests. Versions are language-specific, not interchangeable. {C-031 FACT HIGH; S-006,S-007}
- **Native artifact:** the Darwin ARM64 package is SRI-matched, a thin ARM64 Mach-O, and signed by `Developer ID Application: Anthropic PBC (Q6L2SF6YDW)`; bounded execution printed `2.1.243 (Claude Code)`. {C-035 FACT HIGH; S-009,S-010}
- **Boundary/scope:** npm registry, PyPI, public GitHub snapshot, and Darwin ARM64 bytes only.
- **Unknowns:** no official mapping proves that package `2.1.243` was built from public commit `8b6ef81…`; see C-030.

## 2. Provenance and license {#provenance-license}

- **Status:** `OBSERVED` for published notices; redistribution implications were not legally interpreted.
- **Finding:** Anthropic PBC is the named package author/maintainer. The CLI wrapper, native package, and TypeScript SDK state “© Anthropic PBC. All rights reserved” and make use subject to linked legal agreements; the Python SDK metadata says MIT. {C-002 FACT HIGH; S-003,S-007,S-008,S-012}
- **Lineage:** the public repository is upstream `anthropics/claude-code`, not a fork. It publishes examples/plugins and issue infrastructure, while the executable core remains proprietary. {C-003 FACT HIGH; S-003,S-004,S-008,S-009}
- **Boundary/scope:** notices actually shipped in reviewed artifacts. Dependencies and platform packages may have separate notices; this is not a license audit.
- **Unknowns:** trademark permissions, complete transitive dependency licensing, and platform-specific notice completeness were not resolved. {C-046 UNKNOWN N/A; S-003,S-007,S-008,S-009,S-012}

## 3. Repository and package map {#repository-package-map}

- **Status:** `OBSERVED` for public tree/artifact layout; proprietary composition root unknown.
- **Finding:** the complete 333-entry public tree consists chiefly of `plugins/` (231 entries), `examples/` (50), issue automation, and top-level documentation; no `src/`, `packages/`, `lib/`, `bin/`, or CLI core production tree appears. The CLI wrapper artifact has seven files and delegates platform delivery through eight exact-version optional dependencies. The TypeScript SDK artifact contains ESM/browser/bridge entrypoints, declarations, and manifests, while platform packages carry native binaries. This is a bounded absence in those complete public universes, not a global absence claim. {C-003 FACT HIGH; S-003,S-004,S-008,S-009}
- **Classification:** repository plugins/examples are public production extensions or examples, not evidence of proprietary core reachability; npm declarations are public API, not core implementation. {C-003 FACT HIGH; S-003,S-004,S-008,S-009}
- **Composition root:** the documented and packaged native Claude Code process is the public composition boundary; its internal module graph is unknown. {C-047 UNKNOWN N/A; S-003,S-004,S-005,S-009}
- **Boundary/scope:** official repository commit and three exact npm artifacts.
- **Unknowns:** private build repository, generated/vendored native components, and binary composition are covered by C-047; internal tests are covered by C-019. {C-047 UNKNOWN N/A; S-003,S-004,S-005,S-009} {C-019 UNKNOWN N/A; S-003,S-004,S-008,S-009,S-010}

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** `PARTIAL`.
- **Finding:** documented/public entrypoints include interactive `claude`, one-shot `claude -p`, resume/continue, `claude agents`, daemon/background controls, MCP/plugin/update/doctor commands, the TypeScript `query()` API, Python SDK APIs, and native package executables. `-p` offers text, JSON, and streaming JSON. {C-004 FACT HIGH; S-003,S-005,S-008,S-009,S-010}
- **Headless surface:** JSON/JSONL includes init, assistant/user/tool-related messages, retry events, final result, session ID, usage, and cost; SDK declarations expose query, mutation, fork/resume, and abort surfaces. {C-034 FACT MEDIUM; S-005,S-008}
- **Lifecycle owner:** the CLI/native subprocess owns the documented agent loop; embedding applications consume SDK streams and can supply approval callbacks/hooks. {C-004 FACT HIGH; S-003,S-005,S-008,S-009,S-010}
- **Absent forms:** no stable in-process core-runtime source/library entrypoint was found in the bounded public repository/package tree; browser and bridge SDK exports are public adapters, not proof of an open core. {C-003 FACT HIGH; S-003,S-004,S-008,S-009}
- **Boundary/scope:** local CLI and SDK. IDE, Desktop, web, mobile, CI, and remote-control surfaces are documented but not executed.
- **Unknowns:** proprietary startup sequence and daemon RPC internals are covered by C-047; installer/bootstrap provenance and rollback are covered by C-030. {C-047 UNKNOWN N/A; S-003,S-004,S-005,S-009} {C-030 UNKNOWN N/A; S-001,S-002,S-003,S-004,S-005,S-009}

## 5. Control and data flow {#control-data-flow}

- **Status:** `PARTIAL` (documented protocol; no credentialed end-to-end run).
- **Finding:** The documented request slice separates operator control, model data exchange, harness-owned permission/tool dispatch, external side effects, and terminal evidence; proprietary scheduling and transaction boundaries remain unknown. {C-005 FACT MEDIUM; S-005,S-008}
- **Representative trace:** an operator/SDK sends a prompt plus system prompt, tool definitions, and history; the model emits text and/or tool requests; the harness evaluates permissions/hooks, executes allowed tools, returns tool results as user messages, repeats until no tool call, then emits a result with status, session, usage, and estimated cost. {C-005 FACT MEDIUM; S-005,S-008}

```text
CONTROL: operator/SDK -> harness loop -> provider/model -> harness tool dispatcher -> tool
DATA:    prompt/context -> model; tool request -> dispatcher; tool result -> model; result/events -> consumer
AUTHORITY: policy/admin/user -> permission engine + hooks -> allow/ask/deny; OS sandbox -> Bash child effects
```

- **Interface map:**

| Boundary | Producer → consumer | Payload/protocol | Lifecycle/authority | Side effects/failure/evidence |
| --- | --- | --- | --- | --- |
| Operator/SDK | caller → Claude process | prompt, options, streaming input | caller starts/interrupts; harness owns turns | local session writes; init/result/error events |
| Model | harness ↔ configured provider | messages, tools, streamed blocks, usage | model chooses requests; no direct execution authority | network/cost; retry/rate/error events |
| Tool | model request → harness dispatcher → tool | named tool + structured input/result | deny/ask/allow/hooks precede dispatch | filesystem/process/network; tool IDs and results |
| Persistence | harness → local JSONL/snapshots | internal JSONL + file snapshots | harness continuous writer | resume/rewind; corruption semantics unknown |
| Extensions | config/plugin/MCP → harness | Markdown/YAML/JSON, MCP transports, hook JSON | source precedence/trust/permissions | subprocess/HTTP/MCP effects and diagnostics |

- **Error path:** denied tools return rejection to the model; SDK result subtypes distinguish success, turn/budget limits, structured-output retry exhaustion, and execution error. {C-017 FACT MEDIUM; S-005,S-008}
- **Boundary/scope:** documented CLI/SDK request slice.
- **Unknowns:** scheduling/deduplication and evidence behavior are covered by C-029, provider adaptation by C-038, persistence transaction boundaries by C-040, and tool-result authority isolation by C-028. {C-029 UNKNOWN N/A; S-005,S-008} {C-038 UNKNOWN N/A; S-005,S-008} {C-040 UNKNOWN N/A; S-005,S-008} {C-028 UNKNOWN N/A; S-003,S-004,S-005}

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** `PARTIAL`.
- **Finding:** documented extensions separate persistent instructions (`CLAUDE.md`/rules), on-demand skills, isolated subagents, lifecycle hooks, external MCP servers, and packaging via plugins. Plugins can bundle skills, agents, hooks, and MCP; source precedence and namespacing resolve conflicts. Hooks have defined events/JSON/exit semantics, but ordering/unload and compatibility guarantees vary by extension and version. {C-006 FACT MEDIUM; S-004,S-005}
- **Discovery/registration:** user/project/managed/plugin directories and CLI/SDK options; skills and agents are Markdown with frontmatter; MCP supports stdio/HTTP/SSE/WebSocket configurations; hooks may be command, HTTP, MCP-tool, prompt, or agent handlers. {C-006 FACT MEDIUM; S-004,S-005}
- **Authority:** skills/instructions influence the model; hooks can block; MCP/tool calls remain subject to permission rules; plugin-supplied agent fields have security restrictions. {C-006 FACT MEDIUM; S-004,S-005}
- **Failure surface:** malformed/duplicate agent definitions may be skipped with debug diagnostics; headless init exposes plugin/MCP load errors; hook timeout behavior is event/type dependent. {C-006 FACT MEDIUM; S-004,S-005}
- **Boundary/scope:** official extension contracts and public examples, not third-party extension quality.
- **Unknowns:** core plugin ABI stability, atomic reload, unload cleanup, and cross-version migration guarantees are unverified. {C-048 UNKNOWN N/A; S-004,S-005}

## 7. Agent interface {#agent-interface}

- **Status:** `PARTIAL`.
- **Finding:** built-in/custom subagents have identity/description, system prompt, model, tool and permission restrictions, optional skills/MCP/hooks/memory/turn limits/background/worktree isolation, and an independent context. Parent receives a summary; nested spawning is depth/tool constrained. {C-007 FACT MEDIUM; S-005,S-008}
- **Parent/child:** the `Agent` tool initiates; `parent_tool_use_id`, agent IDs, hook fields, and OTel parent IDs correlate work. Background subagents get a reduced built-in tool pool; plugin agents cannot set hooks, MCP servers, or permission mode. {C-007 FACT MEDIUM; S-005,S-008}
- **Authority:** parent permissions may dominate child settings; managed restrictions apply; denying `Agent` or a named agent removes delegation paths. {C-007 FACT MEDIUM; S-005,S-008}
- **Errors:** zero resolved tools, malformed definitions, blocked models/MCP, and missing agent types are documented diagnostics. {C-007 FACT MEDIUM; S-005,S-008}
- **Cancellation:** documented streams expose abort/interrupt controls, but exact cancellation propagation and cleanup across nested/background agents were not observed. {C-039 UNKNOWN N/A; S-005,S-008}
- **Boundary/scope:** local subagent/SDK definitions; experimental teams/workflows are contextual only.
- **Unknowns:** nested/background cancellation, orphan cleanup, and final-state guarantees are unverified; scheduler fairness is not claimed. {C-039 UNKNOWN N/A; S-005,S-008}

## 8. Tool interface {#tool-interface}

- **Status:** `PARTIAL`.
- **Finding:** built-ins cover Read/Edit/Write, Glob/Grep, Bash/PowerShell, WebFetch/WebSearch, ToolSearch, Agent/Skill, questions, tasks, worktrees, and other orchestration. Requests and results carry structured content/tool IDs; MCP adds external tools. Documented SDK scheduling may run read-only tools concurrently and state-modifying tools sequentially. {C-008 FACT MEDIUM; S-005,S-008}
- **Validation/approval:** tool name/input reaches documented deny/ask/allow rules and hooks before execution; bare tool deny removes it from model context. SDK `canUseTool` is only a prompt replacement, while `PreToolUse` can gate every call. {C-014 FACT MEDIUM; S-005}
- **Timeout/cancellation:** hooks and commands have type-specific timeouts; SDK approval callbacks receive `AbortSignal`; SIGTERM kills a running Bash process tree in `-p`. {C-017 FACT MEDIUM; S-005,S-008}
- **Trust:** tool output feeds the model as data, but no public runtime source or probe establishes complete instruction/data isolation. {C-028 UNKNOWN N/A; S-003,S-004,S-005}
- **Boundary/scope:** documented public contract.
- **Unknowns:** complete malformed/extra/wrong-type/oversized input validation and side-effect ordering are covered by C-053; deduplication/idempotency by C-029; enforcement bypass resistance by C-028. {C-053 UNKNOWN N/A; S-003,S-004,S-005,S-008,S-010} {C-029 UNKNOWN N/A; S-005,S-008} {C-028 UNKNOWN N/A; S-003,S-004,S-005}

## 9. Provider interface {#provider-interface}

- **Status:** `PARTIAL`.
- **Finding:** Claude Code documents direct Anthropic access plus Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry, Claude Platform on AWS, and gateway/custom-base-URL routes. Authentication and billing boundaries vary; headless bare mode avoids OAuth/keychain and requires explicit Anthropic API credentials while third-party providers use their own credentials. {C-009 FACT MEDIUM; S-005}
- **Protocol:** the documented harness sends message/context/tool schemas and receives streaming content/usage; gateway protocol and OTel attributes expose model/request IDs, attempts, status, and token fields. {C-009 FACT MEDIUM; S-005}
- **Authority/side effects:** provider credentials authorize inference; requests incur usage; admin/model allowlists and gateway policy may constrain routing. {C-009 FACT MEDIUM; S-005}
- **Errors:** documented retry events classify auth, billing, rate limit, overload, invalid request, model-not-found, server, output-limit, and unknown errors. {C-009 FACT MEDIUM; S-005}
- **Boundary/scope:** official documentation only; no provider credentials were used.
- **Unknowns:** exact fallback/routing order, retry count/backoff by error, malformed/interrupted-stream preservation, and provider usage reconciliation at 2.1.243. {C-038 UNKNOWN N/A; S-005,S-008}

## 10. Model interface {#model-interface}

- **Status:** `PARTIAL`.
- **Finding:** model selection accepts aliases/full IDs, session/subagent overrides, allowlists, effort levels, extended thinking, large-context variants, and optional fallback configuration. Init/result/OTel expose the resolved model and stop reason; unsupported/blocked choices may substitute or warn. {C-010 FACT MEDIUM; S-005,S-008}
- **Capability negotiation:** `system/init.capabilities` supports protocol feature detection; model-dependent tool search/task-tool/context behavior is documented. {C-010 FACT MEDIUM; S-005,S-008}
- **Streaming/structured output:** partial API events are optional; JSON Schema output has bounded validation retries and a terminal error subtype. {C-010 FACT MEDIUM; S-005,S-008}
- **Boundary/scope:** documented behavior, not model-quality evaluation.
- **Unknowns:** exact default system prompt, hidden model parameters, model-specific adapters, fallback decision algorithm, and compactor prompt. {C-043 UNKNOWN N/A; S-003,S-004,S-005}

## 11. Context interface {#context-interface}

- **Status:** `PARTIAL`.
- **Finding:** context accumulates system prompt, tools, history, tool I/O, CLAUDE.md/rules, auto memory, skill descriptions/bodies, and MCP metadata. Skills and MCP schemas are lazy by default; subagents isolate verbose work. Near limits, older tool outputs are cleared and history summarized; compaction re-injects root instructions/memory and capped invoked skills while nested/path-scoped instructions reload only on a matching read. {C-011 FACT MEDIUM; S-005}
- **Ordering/provenance:** docs distinguish system prompt, startup-loaded files, dynamically loaded rules/skills, hook output, and tool results; `/context` reports contributors. Exact serialization/order remains proprietary. {C-011 FACT MEDIUM; S-005} {C-043 UNKNOWN N/A; S-003,S-004,S-005}
- **Contamination boundary:** normal `-p` can execute project hooks/connect MCP before trust prompts; `--bare` skips most discovery and keychain/OAuth, though explicitly added skills remain a partial exception. {C-037 FACT MEDIUM; S-005,S-010}
- **Accounting:** prompt caching applies to stable prefixes; `/context`, usage, and OTel expose estimates/categories, not a complete provenance ledger. {C-011 FACT MEDIUM; S-005}
- **Boundary/scope:** documented local/SDK context behavior.
- **Unknowns:** exact prompts, truncation heuristics, contamination classifier, summary fidelity, and all prompt-injection resistance. {C-043 UNKNOWN N/A; S-003,S-004,S-005}

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** `PARTIAL`.
- **Finding:** CLI sessions continuously write plaintext JSONL under `~/.claude/projects/<project>/<session>.jsonl`; resume appends to the same ID, fork copies history to a new ID, retention defaults to 30 days, and storage can move/disable. Checkpoints snapshot file-tool edits and persist with the conversation. {C-012 FACT MEDIUM; S-005,S-008}
- **Checkpoint boundary:** up to 100 recent checkpoints are documented, but Bash changes, most subagent/external edits, symlinks, and hard links are not restored; checkpoints are explicitly not version control. {C-033 FACT MEDIUM; S-005}
- **Schema:** transcript JSONL is explicitly internal and unstable; supported scripted interfaces are export/headless/SDK. External SDK session stores dual-write from local disk. {C-012 FACT MEDIUM; S-005,S-008}
- **Restart:** resumes restore history and selected model/agent/mode state with listed exceptions; missing worktrees/config may alter or abort restoration. {C-012 FACT MEDIUM; S-005,S-008}
- **Boundary/scope:** documented lifecycle, not crash injection.
- **Unknowns:** fsync/atomicity, crash-between-write recovery, corruption detection/repair, schema migration, concurrent-writer locking, and deletion completeness. {C-040 UNKNOWN N/A; S-005,S-008}

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** `PARTIAL`.
- **Finding:** concurrency surfaces include same-turn read-only tool parallelism, background subagents/sessions, agent teams/workflows, and separate worktrees. Worktree isolation checks edit paths, command cwd, git redirects, and command shapes; locks and retention sweeps guard cleanup. {C-013 FACT MEDIUM; S-005}
- **Collision behavior:** opening the same session in two terminals without forking interleaves both writers into one transcript; duplicate live names are generally renamed, with documented exceptions. {C-041 FACT MEDIUM; S-005}
- **Shared state:** worktrees still share the main `.git`, project plugins, and saved repository permission approvals; file isolation is therefore not repository-metadata or policy isolation. {C-013 FACT MEDIUM; S-005}
- **Cleanup/determinism:** clean subagent worktrees can auto-remove; changed worktrees persist; stale locks sweep later. Mutating tools are documented sequential within a turn, but cross-session ordering is not deterministic. {C-013 FACT MEDIUM; S-005}
- **Boundary/scope:** documented worktrees/subagents; no two-session race probe.
- **Unknowns:** same-file races, lock implementation, queue fairness, task deduplication, and hard-crash orphan recovery are unverified. {C-049 UNKNOWN N/A; S-005}

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** `PARTIAL`; policy documented, enforcement not independently verified.
- **Finding:** The documented authority boundary separates model influence from deny/ask/allow policy, blocking hooks, and a Bash-child OS sandbox; actual enforcement and bypass resistance remain unknown. {C-014 FACT MEDIUM; S-005}
- **Authority matrix:** {C-014 FACT MEDIUM; S-005}

| Actor/source | Can shape requests | Can grant/deny execution | Enforcement boundary |
| --- | --- | --- | --- |
| Model/prompt/CLAUDE.md/skill | Yes | No documented grant authority | model behavior only |
| User/CLI/settings | Yes | allow/ask/deny and modes | Claude Code permission engine |
| Managed settings | Yes | highest-tier policy/disable bypass | client plus endpoint/server delivery |
| PreToolUse hook | inspect/modify/block; limited allow | can tighten; cannot override deny/ask | hook result before permission flow |
| OS sandbox | No | filesystem/network confinement for Bash children | Seatbelt or bubblewrap/proxy |
| Provider/MCP | returns data/tool contracts | connector interaction policies | remote service plus harness rules |

- **Precedence:** deny → ask → allow; bare denials can remove tools from context. Modes include Manual/default, acceptEdits, plan, auto classifier, dontAsk, and bypassPermissions. `bypassPermissions` remains dangerous and is intended only for external isolation. {C-014 FACT MEDIUM; S-005}
- **Sandbox:** applies only to Bash/children, not every tool. macOS uses Seatbelt; Linux/WSL2 use bubblewrap and a proxy. Settings can merge path/domain restrictions and protect selected credentials. {C-014 FACT MEDIUM; S-005}
- **Critical caveats:** sandbox failure runs unsandboxed by default unless `failIfUnavailable`; unsandboxed retry is allowed unless disabled; default sandbox reads most of the host, including credential files unless explicitly denied; auto-allow can run sandboxed writes without a Manual prompt. {C-036 FACT MEDIUM; S-005}
- **Boundary/scope:** documented local policy and bounded host Seatbelt used for research; not a target sandbox escape test.
- **Unknowns:** proprietary matcher/parser completeness, managed-policy race windows, symlink/path edge enforcement, hook/MCP bypass resistance, and actual sandbox conformance. {C-028 UNKNOWN N/A; S-003,S-004,S-005}

## 15. Evidence and observability {#evidence-observability}

- **Status:** `PARTIAL`.
- **Finding:** observability spans terminal transcript, JSON/stream-JSON messages, local JSONL, debug logs, hooks, usage UI, plugin/MCP load errors, and opt-in OTel metrics/events/traces. IDs include session, request, tool-use, agent/parent, workflow run, trace/span, and API request IDs. Content capture is redacted by default and separately gated. {C-015 FACT MEDIUM; S-005,S-008}
- **Lifecycle:** OTel can correlate interaction → model request → permission wait → tool execution and nested agents; `system/init` announces loaded surfaces; result messages expose terminal status. {C-015 FACT MEDIUM; S-005,S-008}
- **Ownership/durability:** local transcripts/debug are user-owned and retention-bound; exported telemetry goes to a configured collector. Cloud audit claims are vendor-documented only. {C-015 FACT MEDIUM; S-005,S-008}
- **Tamper/redaction:** managed settings can lock destinations; prompts/tool details/content/raw bodies require opt-in. No evidence establishes tamper resistance; untrusted tool text may appear in logs/content when enabled. {C-015 FACT MEDIUM; S-005,S-008} {C-029 UNKNOWN N/A; S-005,S-008}
- **Unobservable consequential actions:** external subprocess descendants and remote side effects may outlive checkpoint coverage; helper model calls are not fully represented in main-loop usage. {C-033 FACT MEDIUM; S-005} {C-016 FACT HIGH; S-005,S-008}
- **Boundary/scope:** official schema/documentation, no collector probe.
- **Unknowns:** event loss under crash/backpressure, spoofed fields, durable ordering, and end-to-end audit completeness are unverified. {C-029 UNKNOWN N/A; S-005,S-008}

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** `PARTIAL`.
- **Finding:** SDK limits include `maxTurns` and `maxBudgetUsd`; result/usage and OTel provide per-model input/output/cache tokens and estimated cost. Whole-tree `modelUsage` includes main loop, subagents, compaction/workflows, but excludes helper calls such as permission classifiers/token probes; crash/startup totals may be zero. Local dollar totals are estimates, not billing statements. {C-016 FACT HIGH; S-005,S-008}
- **Attribution:** `/usage` attributes recent usage approximately to skills, subagents, plugins, and MCP servers; OTel records attempts and token fields. Provider console/cloud billing is authoritative for charge. {C-016 FACT HIGH; S-005,S-008}
- **Budgets:** the documented budget cap stops background subagents and prevents new ones after threshold, but enforcement was not observed. {C-016 FACT HIGH; S-005,S-008} {C-042 UNKNOWN N/A; S-005,S-008}
- **Cache/retry:** cache read/write and attempt counts are exposed; reconciliation with provider totals was not tested. {C-016 FACT HIGH; S-005,S-008} {C-042 UNKNOWN N/A; S-005,S-008}
- **Boundary/scope:** token/cost fields only.
- **Unknowns:** hard CPU/RAM/process/network quotas for local CLI, exact preflight estimation, missing-usage behavior, billing reconciliation, and budget overshoot under concurrency. {C-042 UNKNOWN N/A; S-005,S-008}

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** `PARTIAL`.
- **Finding:** SDK results distinguish success, max-turn, max-budget, structured-output retry exhaustion, and execution error. `system/api_retry` exposes attempt, maximum, delay, status, category, UUID, and session ID. In `-p`, SIGTERM kills the Bash process tree, runs only SessionEnd hooks, exits 143, and leaves the turn unfinished; SIGINT/SDK interrupt ends a turn instead. {C-017 FACT MEDIUM; S-005,S-008}
- **Propagation:** single-shot SDK yields an error result then raises; streaming sessions may remain alive except after process crash. Denied tools feed rejection back to the model. {C-017 FACT MEDIUM; S-005,S-008}
- **Partial success:** checkpoints and transcripts can preserve some state, but external/Bash effects are not transactional. {C-033 FACT MEDIUM; S-005} {C-029 UNKNOWN N/A; S-005,S-008}
- **Runtime evidence:** malformed schema and unknown flags failed nonzero before a model call; malformed schema still initialized local config. {C-027 FACT HIGH; S-010}
- **Boundary/scope:** documented behavior plus startup validation only.
- **Unknowns:** retry ownership/backoff in every provider case, cancellation at all phases, duplicate delivery/idempotency, nested-agent cleanup, crash replay, and partial-write recovery. {C-029 UNKNOWN N/A; S-005,S-008}

## 18. Install, update, and release {#install-update-release}

- **Status:** `PARTIAL`.
- **Finding:** official paths include native installer, npm wrapper/platform packages, Homebrew, WinGet, and signed Linux repositories. Native installs auto-update in background; stable/latest channels and managed min/max version controls exist. The exact reviewed wrapper/platform artifacts SRI-match registry metadata and the native binary passes Apple code-sign verification. {C-018 FACT MEDIUM; S-001,S-003,S-005,S-009,S-010}
- **Artifact pin:** package bytes can be re-resolved by exact version and SRI; scripts were not executed. {C-018 FACT MEDIUM; S-001,S-003,S-005,S-009,S-010}
- **Release cadence:** registry `2.1.243` was current at cutoff and the later pinned repository commit's `CHANGELOG.md` contains a `2.1.243` entry, while the earlier Last-Modified consolidated documentation corpus stopped at `2.1.241`. {C-045 FACT HIGH; S-001,S-005,S-013}
- **Rollback/migration:** channels and version floors/ceilings are documented, but a complete rollback transaction and config downgrade compatibility are not verified. {C-030 UNKNOWN N/A; S-001,S-002,S-003,S-004,S-005,S-009}
- **Boundary/scope:** registry and docs, Darwin signature only.
- **Unknowns:** artifact-to-public-commit provenance, reproducible build, SBOM, source attestation, updater failure atomicity, and rollback evidence remain unresolved; pinned `2.1.243` release notes are observed under C-045. {C-030 UNKNOWN N/A; S-001,S-002,S-003,S-004,S-005,S-009} {C-045 FACT HIGH; S-001,S-005,S-013}

## 19. Tests and qualification {#tests-qualification}

- **Status:** `UNKNOWN`.
- **Finding:** the complete public repository exposes extension/examples and automation but no proprietary core test suite or CI qualification matrix. Package startup probes qualify only version/help/CLI validation and signature, not the agent loop. {C-019 UNKNOWN N/A; S-003,S-004,S-008,S-009,S-010}
- **Observed checks:** SRI recomputation, complete artifact lists, `file`, `codesign --verify`, network-denied `--version`/`--help`, unknown option, and malformed JSON Schema. {C-026 FACT HIGH; S-010} {C-027 FACT HIGH; S-010} {C-035 FACT HIGH; S-009,S-010}
- **Negative testing documented upstream:** official docs/changelog describe edge-case fixes, but release prose is not an executable qualification result. {C-019 UNKNOWN N/A; S-003,S-004,S-008,S-009,S-010}
- **Boundary/scope:** no vendor credentials and no private CI access.
- **Unknowns:** core unit/integration/E2E coverage, platform/provider matrix, sandbox adversarial suite, release gates, flaky-test policy, and coverage metrics are inaccessible. {C-019 UNKNOWN N/A; S-003,S-004,S-008,S-009,S-010}

## 20. Security {#security}

- **Status:** `PARTIAL`; no security acceptance.
- **Finding:** documented controls include harness-side permissions, workspace trust, managed policy, protected paths, OS-level Bash isolation, network proxy, explicit credential deny/mask controls, headless bare mode, OTel redaction gates, and HackerOne reporting. {C-020 FACT MEDIUM; S-005,S-011}
- **Reporting:** pinned `SECURITY.md` routes validated vulnerabilities to Anthropic's HackerOne submission form and bounty page. {C-032 FACT HIGH; S-011}
- **Threat boundaries:** repository/prompts/tool/provider/MCP outputs are untrusted model context; host files/processes/network/credentials are consequential effects; extension hooks and MCP can execute/connect outside the model. {C-020 FACT MEDIUM; S-005,S-011}
- **Documented limitations:** normal `-p` skips trust prompts; sandbox covers Bash only; default sandbox can read most host files; selected deny rules are best-effort for arbitrary subprocesses; bypass mode and unsandboxed retries widen authority. {C-036 FACT MEDIUM; S-005}
- **Supply chain:** exact artifacts have registry integrity/signatures and Darwin Developer ID, but public source provenance and reproducible builds are unknown. {C-035 FACT HIGH; S-009,S-010} {C-030 UNKNOWN N/A; S-001,S-002,S-003,S-004,S-005,S-009}
- **Boundary/scope:** official claims and static/startup evidence only.
- **Unknowns:** independent penetration results, vulnerability/advisory history at this exact release, secret zeroization, parser/path escape resistance, dependency SBOM, and runtime policy bypass resistance. {C-028 UNKNOWN N/A; S-003,S-004,S-005}

## 21. Strengths {#strengths}

- **Status:** `PARTIAL` research interpretation.
- **Finding:** The documented headless/SDK stream is unusually explicit about init, tool, retry, result, usage, correlation, and capability messages, giving an embedding host named control/evidence boundaries rather than terminal scraping. This is a scoped strength of the public contract, not proof of lossless runtime telemetry. {C-021 INFERENCE MEDIUM; S-005,S-008}
- **Additional evidence-backed capabilities:** layered extension types distinguish instructions, deterministic hooks, external tools, delegation, and packaging {C-006 FACT MEDIUM; S-004,S-005}; lazy skills/MCP and subagent context isolation bound common context costs {C-011 FACT MEDIUM; S-005}; exact package integrity and platform signing support artifact pinning {C-035 FACT HIGH; S-009,S-010}.
- **Boundary/scope:** architecture comparison input only.
- **Unknowns:** runtime reliability remains bounded by inaccessible qualification, dynamic failure, provider, and concurrency evidence. {C-019 UNKNOWN N/A; S-003,S-004,S-008,S-009,S-010} {C-029 UNKNOWN N/A; S-005,S-008} {C-038 UNKNOWN N/A; S-005,S-008} {C-049 UNKNOWN N/A; S-005}

## 22. Liabilities {#liabilities}

- **Status:** `PARTIAL` research interpretation.
- **Finding:** The proprietary core prevents source-level verification of control, policy, persistence, and failure claims; at cutoff, the consolidated docs corpus lagged the package while the pinned repository changelog carried `2.1.243` notes. Consequence: release notes do not substitute for implementation evidence, so high-consequence behavior cannot receive HIGH confidence without safe runtime qualification. {C-022 INFERENCE HIGH; S-001,S-003,S-004,S-005,S-013}
- **Triggers/consequences:**
  - normal headless discovery in an untrusted checkout can run hooks/connect MCP without trust prompts; use documented bare mode and explicit configuration boundaries {C-037 FACT MEDIUM; S-005,S-010};
  - sandbox defaults can fail open and read broad host state unless hardened {C-036 FACT MEDIUM; S-005};
  - checkpoint rewind excludes Bash, most subagent/external, symlink, and hard-link effects, so recovery can be partial {C-033 FACT MEDIUM; S-005};
  - same-session multi-terminal use interleaves transcript writes {C-041 FACT MEDIUM; S-005}.
- **Boundary/scope:** constraints at the reviewed snapshot; no claim that all deployments are unsafe.
- **Unknowns:** operational incidence is not inferred; the decision-relevant unresolved mechanisms are enforcement, dynamic failure, persistence recovery, and resource/budget behavior. {C-028 UNKNOWN N/A; S-003,S-004,S-005} {C-029 UNKNOWN N/A; S-005,S-008} {C-040 UNKNOWN N/A; S-005,S-008} {C-042 UNKNOWN N/A; S-005,S-008}

## 23. Transferable patterns {#transferable-patterns}

- **Status:** `PARTIAL`; research candidates only.

| Pattern | Problem/minimal mechanism | Prerequisites and preserved boundary | Evidence / adaptation risk | Disposition |
| --- | --- | --- | --- | --- |
| Deny-first layered authority | Separate prompt influence from deterministic deny/ask/allow, blocking pre-tool hooks, and an OS effect boundary | canonical tool inputs, admin precedence, explicit fail-closed sandbox setting, audit IDs | {C-023 INFERENCE MEDIUM; S-005}; parser completeness and hook safety require independent validation | `CANDIDATE` |
| Lazy context + isolated delegation | Load descriptions/names first, bodies/schemas on demand, and return subagent summaries | provenance, token budgets, cancellation, bounded summaries, parent/child IDs | {C-024 INFERENCE MEDIUM; S-005,S-008}; summary loss and nested cleanup are risks | `CONDITIONAL` |
| Capability-negotiated event stream | Feature-detect protocol behavior and correlate session/request/tool/agent/result receipts | stable schemas, backpressure, redaction, durable ordering | {C-052 INFERENCE MEDIUM; S-005,S-008}; proprietary implementation remains unverified | `CONDITIONAL` |

- **Finding:** these mechanisms are comparison inputs, not selections or designs. {C-023 INFERENCE MEDIUM; S-005} {C-024 INFERENCE MEDIUM; S-005,S-008}
- **Boundary/scope:** minimal patterns abstracted from public interfaces; no code adoption authority.
- **Unknowns:** candidate prerequisites remain unverified for authority enforcement, nested cancellation, and context serialization; fit/cost is reserved to downstream authorized synthesis. {C-028 UNKNOWN N/A; S-003,S-004,S-005} {C-039 UNKNOWN N/A; S-005,S-008} {C-043 UNKNOWN N/A; S-003,S-004,S-005}

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** `OBSERVED/PARTIAL` research dispositions.

| Pattern/thread | `CURIOSITY_NO_GO` rationale | Evidence / violated boundary / failure mode | Reopen condition |
| --- | --- | --- | --- |
| Depend on or reverse-engineer proprietary Claude Code internals | Public packages/docs are usable evidence; decompilation, leaked/mirrored source, or private-runtime coupling violates the research trust boundary and produces unstable dependencies. {C-025 INFERENCE HIGH; S-002,S-003,S-004,S-009} | opaque build/control source; legal/maintenance/provenance risk | Anthropic publishes an appropriately licensed, versioned core or stable normative protocol |
| Treat checkpoints as a transaction/rollback layer | Bash, most subagent/external, symlink, and hard-link changes escape restore. {C-044 INFERENCE HIGH; S-005} | partial rollback can leave inconsistent local/remote state | a separately verified transactional effect journal covers all consequential tools |
| Credentialed/provider/cloud/Desktop adversarial runs in this task | Billing, external state, credentials, and broader surface exceed least-privilege scope. {C-050 INFERENCE HIGH; S-005} | unsafe or side-effectful evidence acquisition | disposable funded tenant, explicit authorization, provider fixture, and isolated host |
| Mine issues/third-party reverse engineering/release archaeology | Lower evidentiary quality or novelty after the retained official corpus; repeated patch history does not resolve enforcement. {C-051 INFERENCE MEDIUM; S-001,S-004,S-005,S-013} | anecdote/duplication and budget cost | a specific unresolved decision hinges on a reproducible incident or old-version transition |
- **Finding:** rejected research paths do not reject Claude Code as a product; they bound evidence collection and pattern transfer. {C-025 INFERENCE HIGH; S-002,S-003,S-004,S-009} {C-044 INFERENCE HIGH; S-005} {C-050 INFERENCE HIGH; S-005} {C-051 INFERENCE MEDIUM; S-001,S-004,S-005,S-013}
- **Boundary/scope:** this snapshot and research mandate only.
- **Unknowns:** none within the four registered rejection dispositions; each table row states its bounded reopen condition. {C-025 INFERENCE HIGH; S-002,S-003,S-004,S-009} {C-044 INFERENCE HIGH; S-005} {C-050 INFERENCE HIGH; S-005} {C-051 INFERENCE MEDIUM; S-001,S-004,S-005,S-013}

## 25. Adversarial probes {#adversarial-probes}

- **Status:** `COMPLETE_WITH_UNKNOWNS` for the required table.
- **Probe environment:** static package/repository inspection plus macOS ARM64 network-denied Seatbelt; scrubbed environment; temporary `HOME`, `CLAUDE_CONFIG_DIR`, and `TMPDIR`; no credentials; no target-repository write; no install scripts. {C-026 FACT HIGH; S-010} {C-027 FACT HIGH; S-010}

| Probe | Expected safe behavior defined before probe | Result | Actual observation | Environment | Claim IDs | Source IDs |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 Startup/no-op side effects | version/help should not read credentials, use network, or write outside temp | `PASS` | network denied; `--version` and `--help` exited 0 and created no files in isolated home/config | bounded runtime | C-026 | S-010 |
| P-02 Permission denial/bypass | denied consequential calls remain blocked across alternate paths | `NOT_RUN_UNSAFE` | needs a model/tool call and provider credential; static precedence only | docs/static | C-028 | S-005 |
| P-03 Malformed/oversized input | malformed schema fails before model/tool side effects | `INCONCLUSIVE` | malformed JSON Schema exited 1 before a model call but created first-start config plus backup; wrong/extra/oversized schemas not exercised | bounded runtime | C-027,C-053 | S-003,S-004,S-005,S-008,S-010 |
| P-04 Cancellation/timeout | cancellation propagates to model, tools, subagents, cleanup, final state | `NOT_RUN_UNSAFE` | docs/types reviewed; no provider-backed in-flight operation | docs/static | C-029,C-039 | S-005,S-008 |
| P-05 Retry/duplication/partial failure | retries are bounded/observable and effects are not duplicated | `NOT_RUN_UNSAFE` | inducing provider/tool failure requires billable calls or effects | docs/static | C-029 | S-005,S-008 |
| P-06 Concurrency/isolation collision | colliding sessions/worktrees do not bleed or silently overwrite | `NOT_RUN_UNSAFE` | static docs disclose same-session interleaving and worktree checks; no two-process race | docs/static | C-013,C-041,C-049 | S-005 |
| P-07 Crash/restart | interrupted writes recover or report corruption without unsafe replay | `NOT_RUN_UNSAFE` | no target crash injection; persistence internals proprietary | docs/static | C-040 | S-003,S-004,S-005 |
| P-08 Provider/model/network unavailable | preserve auth/rate/malformed/stream errors and bounded retry | `NOT_RUN_UNSAFE` | network was denied only for startup probes; no fake credential/request was sent | docs/static | C-038 | S-005,S-008 |
| P-09 Untrusted-content injection | content cannot change executable authority | `NOT_RUN_UNSAFE` | requires a live model/tool path; docs separate prompt influence from permissions | docs/static | C-028,C-037 | S-005 |
| P-10 Filesystem abuse | traversal/symlink/absolute/case escapes are blocked by canonical enforcement | `NOT_RUN_UNSAFE` | target sandbox/path engine was not attacked; official caveats retained | docs/static | C-028,C-036 | S-005 |
| P-11 Token/cost disagreement | estimates, retries/cache, whole-tree usage, and provider billing reconcile or flag gaps | `NOT_RUN_UNSAFE` | no billable request/provider ledger; declarations disclose exclusions/zeroed crash totals | docs/static | C-016,C-042 | S-005,S-008 |
| P-12 Install/update pin/rollback | exact artifact re-resolves with integrity/signature and failed update/rollback preserves a usable pinned state | `INCONCLUSIVE` | wrapper, SDK, and Darwin package SRIs recomputed and Darwin code signature verified; failed update, migration, and rollback were not exercised | static/runtime signature | C-001,C-030,C-031,C-035 | S-001,S-003,S-006,S-008,S-009,S-010 |
| P-13 Claimed absence/disabled feature | complete public production universes and alternate package surfaces should reveal core source if present | `PASS` | complete 333-entry repo tree plus complete wrapper/SDK/platform artifact lists contain no core runtime source; claim remains bounded to those universes | static, two methods | C-003 | S-003,S-004,S-008,S-009 |
| P-14 Evidence loss/forgery | denied/failed/cancelled action remains correlated/redacted and spoof-resistant | `NOT_RUN_UNSAFE` | schemas reviewed; no failed consequential action/collector and no tamper test | docs/static | C-015,C-029 | S-005,S-008 |

- **Finding:** only P-01/P-13 passed their narrow expectations; P-03/P-12 are inconclusive; no skipped probe is represented as a pass. {C-026 FACT HIGH; S-010} {C-027 FACT HIGH; S-010} {C-003 FACT HIGH; S-003,S-004,S-008,S-009} {C-030 UNKNOWN N/A; S-001,S-002,S-003,S-004,S-005,S-009}
- **Boundary/scope:** safe startup/static challenges, not security testing.
- **Unknowns:** every `INCONCLUSIVE`/`NOT_RUN_UNSAFE` row is backed by a registered runtime UNKNOWN and requires its listed discriminating access. {C-028 UNKNOWN N/A; S-003,S-004,S-005} {C-029 UNKNOWN N/A; S-005,S-008} {C-038 UNKNOWN N/A; S-005,S-008} {C-039 UNKNOWN N/A; S-005,S-008} {C-040 UNKNOWN N/A; S-005,S-008} {C-042 UNKNOWN N/A; S-005,S-008} {C-049 UNKNOWN N/A; S-005} {C-053 UNKNOWN N/A; S-003,S-004,S-005,S-008,S-010}

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "At the 2026-08-24 cutoff, npm marked @anthropic-ai/claude-code 2.1.243 latest and the official public repository resolved to commit 8b6ef81f636a7697e5ae2338428fa0b272993845."
  classification: FACT
  confidence: HIGH
  scope: "Registry metadata and public repository commit; excludes build equivalence."
  source_ids: [S-001, S-002, S-004]
  fact_dependencies: []
  method: "Captured complete registry metadata, immutable commit API response, and complete recursive tree with hashes."
  counterevidence: "none found in official npm metadata and official GitHub commit/tree APIs"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: provenance-license
  statement: "Reviewed CLI and TypeScript SDK artifacts are Anthropic PBC all-rights-reserved distributions subject to linked legal agreements, while PyPI metadata labels the Python SDK MIT."
  classification: FACT
  confidence: HIGH
  scope: "Exact reviewed artifacts/metadata; no legal interpretation or transitive audit."
  source_ids: [S-003, S-007, S-008, S-012]
  fact_dependencies: []
  method: "Read package metadata and shipped LICENSE.md without executing packages."
  counterevidence: "none found in reviewed notices; differing Python metadata retained rather than averaged"
  adversarial_status: NOT_APPLICABLE:license-text-observation
- claim_id: C-003
  section: repository-package-map
  statement: "The complete pinned public repository and complete reviewed CLI/SDK/platform artifact lists expose extensions, examples, wrappers, declarations, and native binaries but no proprietary core runtime source tree."
  classification: FACT
  confidence: HIGH
  scope: "Official commit tree and exact artifacts only; not a global absence claim."
  source_ids: [S-003, S-004, S-008, S-009]
  fact_dependencies: []
  method: "Compared a non-truncated recursive tree with complete tar member lists using two independent static methods."
  counterevidence: "none found in the complete 333-entry repository tree and three complete package lists"
  adversarial_status: SUPPORTED
- claim_id: C-004
  section: executable-entrypoints
  statement: "Claude Code exposes interactive/headless CLI entrypoints and TypeScript/Python Agent SDK entrypoints around the same documented native loop."
  classification: FACT
  confidence: HIGH
  scope: "Published CLI 2.1.243, TS SDK 0.3.243, Python SDK 0.2.144; no internal entrypoints."
  source_ids: [S-003, S-005, S-008, S-009, S-010]
  fact_dependencies: []
  method: "Correlated official CLI/SDK documentation, package exports/declarations, artifact metadata, and bounded help output."
  counterevidence: "none found in reviewed official surfaces"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: control-data-flow
  statement: "Official SDK documentation defines a loop that sends prompt/context to the model, executes permitted requested tools, returns results, repeats until no tool call, and emits a terminal result."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented CLI/SDK protocol; no credentialed end-to-end observation."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "Traced the documented message lifecycle and declaration types from prompt through ResultMessage."
  counterevidence: "none found in official docs/types; proprietary implementation unavailable"
  adversarial_status: NOT_PROBED
- claim_id: C-006
  section: module-extension-boundaries
  statement: "Claude Code documents distinct CLAUDE.md/rules, skills, subagents, hooks, MCP, and plugin boundaries with source precedence and different authority semantics."
  classification: FACT
  confidence: MEDIUM
  scope: "Official extension contracts and public examples."
  source_ids: [S-004, S-005]
  fact_dependencies: []
  method: "Mapped extension producers, consumers, discovery locations, lifecycle, authority, and failure surfaces from official docs/tree."
  counterevidence: "none found in retained official corpus"
  adversarial_status: NOT_PROBED
- claim_id: C-007
  section: agent-interface
  statement: "Subagents have separate context, configurable prompt/model/tools/permissions/hooks/skills/memory/turn limits, parent-child identifiers, and optional background or worktree execution."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented subagent and SDK interfaces; no live agent run."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "Read official subagent contract and public declarations."
  counterevidence: "none found in retained official corpus/types"
  adversarial_status: NOT_PROBED
- claim_id: C-008
  section: tool-interface
  statement: "The documented tool dispatcher uses structured calls/results and may parallelize read-only calls while serializing mutating calls."
  classification: FACT
  confidence: MEDIUM
  scope: "Official built-in/SDK tool contract; custom and MCP annotations can alter classification."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "Read official agent-loop/tool docs and tool declarations."
  counterevidence: "none found; runtime scheduler unavailable"
  adversarial_status: NOT_PROBED
- claim_id: C-009
  section: provider-interface
  statement: "Claude Code documents Anthropic-direct, cloud-provider, and gateway routes with distinct authentication, billing, and transport configuration."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented provider interface; no authenticated request."
  source_ids: [S-005]
  fact_dependencies: []
  method: "Mapped documented provider/auth/gateway boundaries and error events."
  counterevidence: "none found in retained official corpus"
  adversarial_status: NOT_PROBED
- claim_id: C-010
  section: model-interface
  statement: "The public interfaces expose model selection, effort, thinking/context options, model allowlists, streaming, structured output, and capability negotiation."
  classification: FACT
  confidence: MEDIUM
  scope: "Official docs/types; model quality and hidden parameters excluded."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "Read model, headless, loop, and SDK type contracts."
  counterevidence: "none found in retained official sources"
  adversarial_status: NOT_PROBED
- claim_id: C-011
  section: context-interface
  statement: "Context is documented as cumulative with lazy skills/MCP schemas, isolated subagent context, prompt caching, and automatic tool-output clearing plus summarizing compaction."
  classification: FACT
  confidence: MEDIUM
  scope: "Official context behavior; exact serialization and algorithms excluded."
  source_ids: [S-005]
  fact_dependencies: []
  method: "Traced startup loads, on-demand loads, compaction survival, and accounting in official corpus."
  counterevidence: "none found; documentation explicitly records lossy cases"
  adversarial_status: NOT_PROBED
- claim_id: C-012
  section: state-persistence-restart
  statement: "CLI sessions continuously persist internal JSONL transcripts and file-tool checkpoints that support resume, fork, and bounded rewind."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented local CLI/SDK persistence; crash durability excluded."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "Read sessions/checkpoint/session-store docs and public declarations."
  counterevidence: "none found; limitations retained separately"
  adversarial_status: NOT_PROBED
- claim_id: C-013
  section: concurrency-worktree-isolation
  statement: "Claude Code documents background agents and worktree isolation with path/cwd/git-redirect/command-shape checks, locks, and cleanup sweeps."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented concurrency/worktree behavior; no collision run."
  source_ids: [S-005]
  fact_dependencies: []
  method: "Traced worktree creation, enforcement, sharing, cleanup, and refusal paths."
  counterevidence: "none found; shared .git/policy boundaries retained"
  adversarial_status: NOT_PROBED
- claim_id: C-014
  section: permissions-authority-sandbox
  statement: "Documented authority uses deny-before-ask-before-allow rules and hooks, with a separate OS sandbox applying only to Bash commands and descendants."
  classification: FACT
  confidence: MEDIUM
  scope: "Official policy contract; enforcement implementation unobserved."
  source_ids: [S-005]
  fact_dependencies: []
  method: "Mapped actors, precedence, modes, hooks, and sandbox boundary from official docs."
  counterevidence: "none found in docs; runtime source unavailable"
  adversarial_status: NOT_PROBED
- claim_id: C-015
  section: evidence-observability
  statement: "Claude Code exposes local transcripts/debug data, structured headless/SDK events, and opt-in OTel metrics/events/traces with session/request/tool/agent correlation IDs."
  classification: FACT
  confidence: MEDIUM
  scope: "Published schemas; no collector or crash-loss test."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "Mapped evidence producers, schemas, correlation, redaction gates, and destinations."
  counterevidence: "none found; tamper resistance not claimed"
  adversarial_status: NOT_PROBED
- claim_id: C-016
  section: resource-token-cost-accounting
  statement: "Result and modelUsage totals are client-side estimates with documented exclusions and possible zeroed crash/startup values, not authoritative billing."
  classification: FACT
  confidence: HIGH
  scope: "Official docs plus exact TS 0.3.243 declarations."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "Triangulated cost documentation with package declaration comments."
  counterevidence: "none found; provider billing explicitly named authoritative"
  adversarial_status: NOT_PROBED
- claim_id: C-017
  section: failure-cancellation-retry
  statement: "Public contracts define terminal result subtypes, API retry events, SIGTERM cleanup/exit behavior, and SDK interrupt/abort surfaces."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented/types; no in-flight provider/tool cancellation."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "Mapped documented failures, cancellation direction, retry evidence, and result propagation."
  counterevidence: "none found; dynamic semantics remain unknown"
  adversarial_status: NOT_PROBED
- claim_id: C-018
  section: install-update-release
  statement: "Official distribution supports multiple install paths, stable/latest channels, version constraints, registry integrity, and platform signing."
  classification: FACT
  confidence: MEDIUM
  scope: "Exact npm/Darwin artifact and official install docs; other platform signatures not checked."
  source_ids: [S-001, S-003, S-005, S-009, S-010]
  fact_dependencies: []
  method: "Read install/update docs and statically verified SRI/signature."
  counterevidence: "the consolidated docs corpus lagged the registry while pinned repository release notes were current; retained under C-045"
  adversarial_status: SUPPORTED
- claim_id: C-019
  section: tests-qualification
  statement: "Core runtime tests, CI gates, coverage, and provider/platform qualification for 2.1.243 are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Proprietary core; bounded public repo/packages only."
  source_ids: [S-003, S-004, S-008, S-009, S-010]
  fact_dependencies: []
  method: "attempted_methods=complete recursive repository tree, complete package lists, public docs, bounded startup probes; blocker=core source and CI are proprietary and credentials were unavailable; impact=runtime/release confidence cannot exceed documented/static boundaries; available_evidence=S-003,S-004,S-008,S-009,S-010; next_probe=vendor-published qualification matrix or authorized disposable end-to-end suite"
  counterevidence: "none: public changelog fixes are not test results"
  adversarial_status: CHALLENGED
- claim_id: C-020
  section: security
  statement: "Official security surfaces include permissions, trust, managed policy, protected paths, Bash sandboxing, credential controls, redaction gates, and HackerOne reporting."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented controls/reporting; no security acceptance or penetration test."
  source_ids: [S-005, S-011]
  fact_dependencies: []
  method: "Mapped official trust boundaries, safeguards, caveats, and reporting path."
  counterevidence: "docs explicitly state protections are incomplete"
  adversarial_status: NOT_PROBED
- claim_id: C-021
  section: strengths
  statement: "The capability-negotiated structured event contract is a scoped observability strength for embedding compared with terminal-only scraping."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Public protocol only; does not claim lossless implementation."
  source_ids: [S-005, S-008]
  fact_dependencies: [C-015, C-034]
  method: "reasoning=typed init/retry/tool/result/correlation fields give hosts machine-readable control and evidence; assumptions=schemas are implemented as documented; alternative=events may be lossy or unstable under untested failures"
  counterevidence: "C-029 and untested evidence-loss behavior"
  adversarial_status: NOT_APPLICABLE:comparative-interpretation
- claim_id: C-022
  section: liabilities
  statement: "Proprietary core opacity and time-skewed official documentation surfaces materially constrain independent verification of consequential behavior at 2.1.243."
  classification: INFERENCE
  confidence: HIGH
  scope: "Reviewed public snapshot and exact package release."
  source_ids: [S-001, S-003, S-004, S-005, S-013]
  fact_dependencies: [C-003, C-045]
  method: "reasoning=no public core source plus a consolidated docs corpus older than the package means contemporaneous repository release notes cannot establish implementation behavior; assumptions=the complete official tree, pinned changelog, and captured docs corpus bound public evidence at cutoff; alternative=private vendor qualification may be strong but inaccessible"
  counterevidence: "S-010 directly verifies only startup/version/validation"
  adversarial_status: NOT_APPLICABLE:research-liability
- claim_id: C-023
  section: transferable-patterns
  statement: "Separating prompt influence, deny-first policy, blocking pre-tool hooks, and OS effect isolation is a candidate harness pattern."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Minimal mechanism; no adoption authority."
  source_ids: [S-005]
  fact_dependencies: [C-014, C-036]
  method: "reasoning=separate layers preserve authority when model instructions are untrusted; assumptions=canonical inputs and fail-closed enforcement; alternative=a capability-secure tool host could solve the same problem without Claude-style modes"
  counterevidence: "C-028 enforcement remains unknown"
  adversarial_status: NOT_APPLICABLE:pattern-candidate
- claim_id: C-024
  section: transferable-patterns
  statement: "Lazy extension loading plus isolated subagent context is a conditional pattern for reducing main-context growth."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Context-cost mechanism; summary fidelity/cancellation prerequisites."
  source_ids: [S-005, S-008]
  fact_dependencies: [C-007, C-011]
  method: "reasoning=descriptions/names cost less until use and subtask transcripts stay out of parent context; assumptions=summaries preserve needed evidence; alternative=retrieval or explicit context partitions may outperform delegation"
  counterevidence: "C-039 and C-043"
  adversarial_status: NOT_APPLICABLE:pattern-candidate
- claim_id: C-025
  section: rejected-patterns-curiosity-no-go
  statement: "Depending on reverse-engineered or non-public Claude Code core internals is CURIOSITY_NO_GO for this dossier."
  classification: INFERENCE
  confidence: HIGH
  scope: "Research/evidence boundary, not product rejection."
  source_ids: [S-002, S-003, S-004, S-009]
  fact_dependencies: [C-002, C-003]
  method: "reasoning=the public contract is usable while core implementation is proprietary and untraceable; assumptions=stable lawful evidence is required; alternative=an official licensed core publication could reopen"
  counterevidence: "none within authorized evidence boundary"
  adversarial_status: NOT_APPLICABLE:research-boundary
- claim_id: C-026
  section: adversarial-probes
  statement: "Under a network-denied write-restricted probe, the 2.1.243 binary's version and help paths exited zero and created no files in isolated home/config directories."
  classification: FACT
  confidence: HIGH
  scope: "macOS ARM64 startup paths only; no model/tool execution."
  source_ids: [S-010]
  fact_dependencies: []
  method: "Executed --version and --help with scrubbed env, denied network, and temp-only writes; compared isolated directories."
  counterevidence: "none in repeated isolated probe"
  adversarial_status: SUPPORTED
- claim_id: C-027
  section: adversarial-probes
  statement: "Malformed --json-schema input exited one before a model call but created a first-start config and backup in the temporary config directory."
  classification: FACT
  confidence: HIGH
  scope: "One malformed JSON case under --bare; not all schema/input classes."
  source_ids: [S-010]
  fact_dependencies: []
  method: "Ran malformed JSON under network denial and inspected per-command isolated config tree and diagnostic."
  counterevidence: "unknown-option path wrote nothing; difference retained"
  adversarial_status: CHALLENGED
- claim_id: C-028
  section: permissions-authority-sandbox
  statement: "Actual 2.1.243 permission, hook, MCP, path, and sandbox enforcement and bypass resistance are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Proprietary runtime enforcement; docs/static startup only."
  source_ids: [S-003, S-004, S-005]
  fact_dependencies: []
  method: "attempted_methods=official policy/sandbox docs, complete public tree/package inspection, safe startup probe; blocker=no core source and live adversarial tool execution requires credentials/side effects; impact=security/authority claims remain MEDIUM and no security acceptance is possible; available_evidence=S-003,S-004,S-005; next_probe=authorized disposable host with fake secrets, deny-path fixtures, filesystem/network monitors, and no production access"
  counterevidence: "official docs disclose fail-open and best-effort cases"
  adversarial_status: NOT_PROBED
- claim_id: C-029
  section: failure-cancellation-retry
  statement: "Dynamic cancellation, retry, deduplication, partial-failure, and evidence-loss or spoofing behavior across tools/providers/subagents is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "2.1.243 live loop; no credentials/model calls."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "attempted_methods=official failure/headless/SDK docs and declarations plus startup validation; blocker=discriminating probes require controlled provider/tool failures and billed execution; impact=replayability/idempotency/cleanup and evidence integrity cannot be compared as observed behavior; available_evidence=S-005,S-008; next_probe=fault-injecting provider/tool proxy with deterministic side-effect ledger, nested agents, and spoofed evidence-field inputs"
  counterevidence: "none: documented fixes/history do not prove current all-path behavior"
  adversarial_status: NOT_PROBED
- claim_id: C-030
  section: install-update-release
  statement: "Build provenance, reproducibility, and updater rollback atomicity are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Official public commit/packages/docs at cutoff."
  source_ids: [S-001, S-002, S-003, S-004, S-005, S-009]
  fact_dependencies: []
  method: "attempted_methods=registry/package integrity, immutable repo commit/tree, signed Darwin artifact, and official update documentation; blocker=no build attestation/core source or failed-update/rollback observation; impact=artifact-to-source and rollback qualification cannot be compared; available_evidence=S-001,S-002,S-003,S-004,S-005,S-009; next_probe=vendor SBOM/provenance attestation and disposable failed-update/rollback test"
  counterevidence: "package and signature integrity establish bytes/producer, not reproducible source equivalence"
  adversarial_status: CHALLENGED
- claim_id: C-031
  section: identity-snapshot
  statement: "At the cutoff the TypeScript Agent SDK was 0.3.243 and the Python Agent SDK was 0.2.144 with pinned registry digests."
  classification: FACT
  confidence: HIGH
  scope: "Official npm/PyPI metadata; language-specific versions."
  source_ids: [S-006, S-007]
  fact_dependencies: []
  method: "Captured complete registry JSON and extracted exact versions/digests/publication times."
  counterevidence: "none found in official registries"
  adversarial_status: SUPPORTED
- claim_id: C-032
  section: security
  statement: "The pinned official SECURITY.md directs validated vulnerability reports to Anthropic's HackerOne program."
  classification: FACT
  confidence: HIGH
  scope: "Repository policy at commit 8b6ef81."
  source_ids: [S-011]
  fact_dependencies: []
  method: "Fetched immutable raw SECURITY.md and recorded lines 4-12/hash."
  counterevidence: "none found in pinned policy"
  adversarial_status: NOT_APPLICABLE:reporting-policy
- claim_id: C-033
  section: state-persistence-restart
  statement: "Checkpoint restore excludes Bash modifications, most subagent/external edits, and symlinked or hard-linked files."
  classification: FACT
  confidence: MEDIUM
  scope: "Official checkpoint contract; no restore run."
  source_ids: [S-005]
  fact_dependencies: []
  method: "Read explicit checkpoint limitations and retention semantics."
  counterevidence: "foreground forked skill exception retained"
  adversarial_status: NOT_PROBED
- claim_id: C-034
  section: executable-entrypoints
  statement: "Headless and SDK protocols expose structured init, assistant/user, retry, tool-related, and terminal result messages with session and usage metadata."
  classification: FACT
  confidence: MEDIUM
  scope: "Official protocol docs and TS declarations; no provider stream."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "Mapped documented/types message unions and stream ordering caveats."
  counterevidence: "some trailing events can follow ResultMessage; retained"
  adversarial_status: NOT_PROBED
- claim_id: C-035
  section: install-update-release
  statement: "The exact Darwin ARM64 2.1.243 artifact matches registry SRI, passes Apple code-sign verification, and reports version 2.1.243."
  classification: FACT
  confidence: HIGH
  scope: "Darwin ARM64 package only."
  source_ids: [S-009, S-010]
  fact_dependencies: []
  method: "Recomputed SHA-512, inspected package/file identity, codesign-verified, and ran --version under isolation."
  counterevidence: "none found in artifact verification"
  adversarial_status: SUPPORTED
- claim_id: C-036
  section: security
  statement: "Documented sandbox defaults may run unsandboxed if unavailable, allow unsandboxed retries, and permit broad host reads unless operators harden settings."
  classification: FACT
  confidence: MEDIUM
  scope: "Official sandbox contract; exact enforcement untested."
  source_ids: [S-005]
  fact_dependencies: []
  method: "Read sandbox startup, retry escape hatch, filesystem defaults, and credential controls."
  counterevidence: "failIfUnavailable, strict sandbox, denyRead, and credential settings mitigate when configured"
  adversarial_status: NOT_PROBED
- claim_id: C-037
  section: context-interface
  statement: "Normal -p skips workspace/server trust prompts and may load project hooks/MCP, whereas --bare skips most discovery and OAuth/keychain reads."
  classification: FACT
  confidence: MEDIUM
  scope: "Official headless contract plus help output; no project hook execution."
  source_ids: [S-005, S-010]
  fact_dependencies: []
  method: "Triangulated headless documentation with bounded 2.1.243 help text."
  counterevidence: "explicit --add-dir skills are a documented bare-mode exception"
  adversarial_status: NOT_PROBED
- claim_id: C-038
  section: provider-interface
  statement: "Exact provider fallback, retry/backoff, rate-limit, malformed-response, and interrupted-stream behavior at 2.1.243 is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "All configured providers/gateways; no credentialed calls."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "attempted_methods=official provider/headless/retry docs and SDK types; blocker=no authorized provider fixture or credentials; impact=provider reliability and duplicate-cost behavior cannot be runtime-qualified; available_evidence=S-005,S-008; next_probe=local fault-injecting gateway implementing auth, 429, 5xx, malformed and interrupted streams with a dummy funded tenant"
  counterevidence: "official changelog records historical duplicate-billing and reconnect fixes"
  adversarial_status: NOT_PROBED
- claim_id: C-039
  section: agent-interface
  statement: "Nested/background subagent cancellation propagation, orphan cleanup, and final-state guarantees are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Agent tool/SDK 2.1.243 runtime."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "attempted_methods=subagent/headless/SDK docs and AbortSignal declarations; blocker=no safe live nested-agent call without credentials and process effects; impact=delegation reliability and cleanup are unqualified; available_evidence=S-005,S-008; next_probe=authorized nested-agent fixture with foreground/background cancellation and process/worktree leak monitors"
  counterevidence: "none found; documented wait ceilings do not cover every cancellation path"
  adversarial_status: NOT_PROBED
- claim_id: C-040
  section: state-persistence-restart
  statement: "Transcript/checkpoint atomicity, concurrent-writer locking, corruption handling, and crash recovery are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Local persistence at 2.1.243."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "attempted_methods=session/checkpoint/store docs and declarations; blocker=proprietary writer and crash injection outside safe no-side-effect scope; impact=durability/replay comparisons remain unknown; available_evidence=S-005,S-008; next_probe=disposable filesystem with kill-at-transition matrix, concurrent writers, truncation, corruption, and resume checks"
  counterevidence: "same-session multi-terminal interleaving is documented under C-041"
  adversarial_status: NOT_PROBED
- claim_id: C-041
  section: concurrency-worktree-isolation
  statement: "Two terminals resuming the same unforked session are documented to interleave messages into one transcript."
  classification: FACT
  confidence: MEDIUM
  scope: "Official CLI session behavior; not dynamically reproduced."
  source_ids: [S-005]
  fact_dependencies: []
  method: "Read explicit same-session concurrency statement and related naming/worktree behavior."
  counterevidence: "forking creates a distinct session and avoids this specific collision"
  adversarial_status: NOT_PROBED
- claim_id: C-042
  section: resource-token-cost-accounting
  statement: "Local hard CPU, memory, process, network, and concurrency quotas, provider usage reconciliation, and budget overshoot behavior are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Local CLI/SDK runtime; excludes external container/OS limits."
  source_ids: [S-005, S-008]
  fact_dependencies: []
  method: "attempted_methods=resource/cost/hosting docs and SDK declarations; blocker=no documented local hard quota contract or authorized stress run; impact=capacity/isolation and budget-enforcement comparison is incomplete; available_evidence=S-005,S-008; next_probe=authorized cgroup/container stress suite with concurrent subagents, tool processes, token budget, and provider ledger"
  counterevidence: "maxTurns/maxBudget and background wait ceilings are logical limits, not general host resource quotas"
  adversarial_status: NOT_PROBED
- claim_id: C-043
  section: context-interface
  statement: "Exact system/subagent/compaction prompts, context serialization order, and contamination classifier implementation are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Proprietary prompt/context internals at 2.1.243."
  source_ids: [S-003, S-004, S-005]
  fact_dependencies: []
  method: "attempted_methods=official context/system-prompt docs, public tree, public package list; blocker=prompt internals are proprietary and extracting compiled internals is forbidden; impact=prompt-order and contamination guarantees cannot be independently compared; available_evidence=S-003,S-004,S-005; next_probe=official normative prompt/context specification or vendor-provided redacted trace with ordering/provenance"
  counterevidence: "public flags allow append/replace but do not reveal defaults"
  adversarial_status: NOT_PROBED
- claim_id: C-044
  section: rejected-patterns-curiosity-no-go
  statement: "Using Claude Code checkpointing as a general transaction or complete rollback pattern is CURIOSITY_NO_GO."
  classification: INFERENCE
  confidence: HIGH
  scope: "Documented checkpoint boundary; research disposition only."
  source_ids: [S-005]
  fact_dependencies: [C-033]
  method: "reasoning=multiple consequential effect paths are explicitly outside restore; assumptions=complete rollback is required for a transaction pattern; alternative=checkpointing remains useful as bounded file-tool undo"
  counterevidence: "foreground direct file-tool edits are restorable within documented limits"
  adversarial_status: NOT_APPLICABLE:pattern-rejection
- claim_id: C-045
  section: install-update-release
  statement: "At cutoff, npm recorded 2.1.243, the later pinned repository changelog contained 2.1.243 notes, and the earlier Last-Modified consolidated documentation corpus ended at 2.1.241."
  classification: FACT
  confidence: HIGH
  scope: "Hashed npm metadata, consolidated docs corpus, and immutable repository changelog at cutoff; post-cutoff updates excluded."
  source_ids: [S-001, S-005, S-013]
  fact_dependencies: []
  method: "Compared exact npm publication metadata, the hashed consolidated docs corpus and Last-Modified header, and immutable repository CHANGELOG.md."
  counterevidence: "the two official changelog surfaces differ because the consolidated corpus predates the package and pinned repository commit; both are retained"
  adversarial_status: NOT_APPLICABLE:cutoff-metadata-comparison
- claim_id: C-046
  section: provenance-license
  statement: "Trademark permissions, complete transitive dependency licensing, and platform-specific notice completeness for the reviewed distribution are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Exact reviewed notices and package metadata; excludes legal advice and an exhaustive software-composition audit."
  source_ids: [S-003, S-007, S-008, S-009, S-012]
  fact_dependencies: []
  method: "attempted_methods=reviewed shipped CLI and TypeScript SDK notices, Python registry metadata, platform package metadata, and exact package lists; blocker=transitive and all platform-specific distributions were not exhaustively collected and legal interpretation is excluded; impact=redistribution and complete license-compliance comparison cannot be concluded; available_evidence=S-003,S-007,S-008,S-009,S-012; next_probe=authorized cross-platform SBOM and notice audit by qualified licensing counsel"
  counterevidence: "differing Python MIT metadata is retained under C-002 but does not resolve distribution-wide completeness"
  adversarial_status: NOT_APPLICABLE:requires-license-audit
- claim_id: C-047
  section: repository-package-map
  statement: "The proprietary core module graph, generated or vendored native composition, startup sequence, and daemon RPC internals are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Claude Code 2.1.243 core internals; public extensions, declarations, and documented protocols excluded."
  source_ids: [S-003, S-004, S-005, S-009]
  fact_dependencies: []
  method: "attempted_methods=complete official repository tree, complete wrapper/platform package lists, and official entrypoint/protocol documentation; blocker=the executable core is proprietary and compiled-internal inspection is outside the authorized boundary; impact=internal composition, reachability, and daemon lifecycle cannot be source-traced; available_evidence=S-003,S-004,S-005,S-009; next_probe=vendor-published architecture/source map or stable normative daemon protocol"
  counterevidence: "none: public SDK declarations and examples do not expose the native core graph"
  adversarial_status: CHALLENGED
- claim_id: C-048
  section: module-extension-boundaries
  statement: "Core plugin ABI stability, atomic reload, unload cleanup, and complete cross-version migration guarantees are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Official plugin, hook, MCP, skill, and agent extension lifecycle at 2.1.243."
  source_ids: [S-004, S-005]
  fact_dependencies: []
  method: "attempted_methods=official extension documentation and complete public plugin/example tree; blocker=no stable core ABI specification or authorized multi-version lifecycle fixture was available; impact=extension upgrade and long-running reload risk cannot be compared as observed behavior; available_evidence=S-004,S-005; next_probe=vendor compatibility policy plus disposable N-1/N reload, failure, unload, and migration matrix"
  counterevidence: "documented source precedence and hook semantics cover registration but not every lifecycle guarantee"
  adversarial_status: NOT_PROBED
- claim_id: C-049
  section: concurrency-worktree-isolation
  statement: "Same-file races, lock implementation, queue fairness, task deduplication, and hard-crash orphan recovery across concurrent sessions or worktrees are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Claude Code 2.1.243 local concurrent sessions, agents, tasks, and worktrees."
  source_ids: [S-005]
  fact_dependencies: []
  method: "attempted_methods=official worktree, background-agent, task, and same-session concurrency documentation; blocker=no authorized two-process collision/crash fixture and live agent paths require credentials or broader process effects; impact=isolation, determinism, and cleanup cannot be runtime-qualified; available_evidence=S-005; next_probe=disposable two-process race matrix with colliding paths/names, filesystem and process monitors, forced crash, and deterministic cleanup assertions"
  counterevidence: "C-041 documents transcript interleaving for one collision case but does not resolve the broader race matrix"
  adversarial_status: NOT_PROBED
- claim_id: C-050
  section: rejected-patterns-curiosity-no-go
  statement: "Credentialed provider, cloud, or Desktop adversarial runs are CURIOSITY_NO_GO within this dossier's no-credentials and no-billing scope."
  classification: INFERENCE
  confidence: HIGH
  scope: "This research task only; does not reject a separately authorized funded evaluation."
  source_ids: [S-005]
  fact_dependencies: [C-009]
  method: "reasoning=provider credentials authorize inference, billing, and external effects that exceed the declared least-privilege scope; assumptions=no credentialed or funded tenant authority was granted; alternative=a disposable funded tenant with explicit authorization could safely discriminate runtime claims"
  counterevidence: "none within the assigned authority boundary"
  adversarial_status: NOT_APPLICABLE:research-boundary
- claim_id: C-051
  section: rejected-patterns-curiosity-no-go
  statement: "Broad issue mining, third-party reverse-engineering review, and release archaeology are CURIOSITY_NO_GO after saturation of the retained official cutoff corpus."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Unfocused discovery in this dossier; a specific reproducible incident may reopen a bounded thread."
  source_ids: [S-001, S-004, S-005, S-013]
  fact_dependencies: [C-003, C-045]
  method: "reasoning=the complete public tree, exact release metadata, and captured official corpus already bound public structure and documented behavior while lower-authority discovery cannot resolve proprietary enforcement; assumptions=no specific incident is decision-critical; alternative=a reproducible incident tied to an unresolved claim could justify targeted retrieval"
  counterevidence: "historical issue evidence could add value for a separately framed incident question"
  adversarial_status: NOT_APPLICABLE:bounded-curiosity-stop
- claim_id: C-052
  section: transferable-patterns
  statement: "A capability-negotiated, correlation-rich event stream is a conditional transferable harness pattern."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Public protocol mechanism only; no adoption authority or runtime-losslessness claim."
  source_ids: [S-005, S-008]
  fact_dependencies: [C-015, C-034]
  method: "reasoning=capability detection plus session/request/tool/agent/result IDs lets an embedding host adapt and correlate control/evidence without terminal scraping; assumptions=schemas, redaction, and backpressure are stable enough for consumers; alternative=a versioned append-only event API without negotiated capabilities could provide equivalent boundaries"
  counterevidence: "C-029 leaves loss, ordering, and spoof resistance unverified"
  adversarial_status: NOT_APPLICABLE:pattern-candidate
- claim_id: C-053
  section: tool-interface
  statement: "Complete validation and pre-side-effect rejection of malformed, extra, wrong-type, oversized, and instruction-like inputs across agent, tool, provider, model, and context boundaries are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Claude Code 2.1.243 public boundary validators; one malformed CLI JSON Schema case observed."
  source_ids: [S-003, S-004, S-005, S-008, S-010]
  fact_dependencies: []
  method: "attempted_methods=public repository/package inspection, official schema documentation, TypeScript declarations, and one network-denied malformed JSON Schema probe; blocker=core validators are proprietary and comprehensive live boundary cases require provider/tool execution beyond the authorized no-credential scope; impact=input-validation, side-effect-ordering, and injection-resistance comparisons remain incomplete; available_evidence=S-003,S-004,S-005,S-008,S-010; next_probe=authorized table-driven boundary fixture covering missing, extra, wrong-type, oversized, and instruction-like values with filesystem/network/process monitors"
  counterevidence: "C-027 establishes one malformed JSON case but also observed first-start config writes"
  adversarial_status: CHALLENGED
```

## 27. Source ledger {#source-ledger}

```yaml
- source_id: S-001
  source_kind: release-metadata
  title: "npm full metadata for @anthropic-ai/claude-code"
  url: "https://registry.npmjs.org/%40anthropic-ai%2Fclaude-code"
  commit_or_ref: "2.1.243"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@anthropic-ai/claude-code@2.1.243 sha512-akByOU+klFON4/Ob6RMGeXvS2G+NMaPfNAtG4whrmoGjhNtkGcHzLiGB0VFVtVj9mbnHZ7OSM1/LPwANWeJVIg=="
  code_path: "N/A:no-code-path"
  symbol: "dist-tags.latest; versions[2.1.243]; time[2.1.243]"
  line_anchor: "JSON pointers /dist-tags/latest, /versions/2.1.243, /time/2.1.243"
  command: "curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 'https://registry.npmjs.org/%40anthropic-ai%2Fclaude-code' -o npm-metadata.json && shasum -a 256 npm-metadata.json"
  command_environment: "Darwin arm64; curl 8.7.1; network retrieval only; no scripts"
  output_or_hash: "sha256:84f6c171af877bcdda542aad277a01af2be7ee1350b2b84396104bc45a94ac3c"
  access_date: "2026-08-25"
  supports_claims: [C-001, C-018, C-022, C-030, C-045, C-051]
  notes: "Metadata records latest=2.1.243, publication 2026-08-24T23:10:45.498Z, SRI and npm signatures; retained in approved temp evidence directory."
- source_id: S-002
  source_kind: release-metadata
  title: "Immutable official repository commit metadata"
  url: "https://github.com/anthropics/claude-code/commit/8b6ef81f636a7697e5ae2338428fa0b272993845"
  commit_or_ref: "8b6ef81f636a7697e5ae2338428fa0b272993845"
  resolved_commit: "8b6ef81f636a7697e5ae2338428fa0b272993845"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "commit and tree identity"
  line_anchor: "JSON pointers /sha, /commit/committer/date, /commit/tree/sha"
  command: "curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 'https://api.github.com/repos/anthropics/claude-code/commits/8b6ef81f636a7697e5ae2338428fa0b272993845' -o github-commit-pinned.json && shasum -a 256 github-commit-pinned.json"
  command_environment: "Darwin arm64; curl 8.7.1; GitHub public API; no authentication"
  output_or_hash: "sha256:2b8c313e3cff4781cdb926c1a359d793df132f05aa770ac7708f6b856f8beeb4"
  access_date: "2026-08-25"
  supports_claims: [C-001, C-025, C-030]
  notes: "Canonical immutable HTML URL; command hashes the equivalent GitHub API response. Commit date 2026-08-24T23:40:18Z; tree 8d335e41a1f206d888da261e791491c2a3dcb6be."
- source_id: S-003
  source_kind: package-artifact
  title: "Claude Code wrapper package 2.1.243"
  url: "https://registry.npmjs.org/@anthropic-ai/claude-code/-/claude-code-2.1.243.tgz"
  commit_or_ref: "2.1.243"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@anthropic-ai/claude-code@2.1.243 sha512-akByOU+klFON4/Ob6RMGeXvS2G+NMaPfNAtG4whrmoGjhNtkGcHzLiGB0VFVtVj9mbnHZ7OSM1/LPwANWeJVIg=="
  code_path: "package/package.json; package/README.md; package/LICENSE.md; complete tar list"
  symbol: "bin.claude; optionalDependencies; scripts.postinstall"
  line_anchor: "package.json JSON pointers /bin, /optionalDependencies, /scripts/postinstall"
  command: "curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 'https://registry.npmjs.org/@anthropic-ai/claude-code/-/claude-code-2.1.243.tgz' -o claude-code-2.1.243.tgz && openssl dgst -sha512 -binary claude-code-2.1.243.tgz | openssl base64 -A && tar -tzf claude-code-2.1.243.tgz"
  command_environment: "Darwin arm64; curl 8.7.1; bsdtar; static inspection only; install scripts not run"
  output_or_hash: "sha256:83ffa9c8e3244ce8cb5beb9eed004b6d3e5bdf84b19d5f26ccbcec2c7f657feb"
  access_date: "2026-08-25"
  supports_claims: [C-002, C-003, C-004, C-018, C-019, C-022, C-025, C-028, C-030, C-043, C-046, C-047, C-053]
  notes: "Seven-member artifact; SRI recomputation matched registry; compiled executable internals not inspected."
- source_id: S-004
  source_kind: repository-file
  title: "Complete recursive public repository tree"
  url: "https://github.com/anthropics/claude-code/tree/8b6ef81f636a7697e5ae2338428fa0b272993845"
  commit_or_ref: "8b6ef81f636a7697e5ae2338428fa0b272993845"
  resolved_commit: "8b6ef81f636a7697e5ae2338428fa0b272993845"
  package_identity: "N/A:not-a-package"
  code_path: "repository tree (333 entries)"
  symbol: "git tree listing"
  line_anchor: "JSON pointers /truncated=false, /tree"
  command: "curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 'https://api.github.com/repos/anthropics/claude-code/git/trees/8b6ef81f636a7697e5ae2338428fa0b272993845?recursive=1' -o github-tree.json && shasum -a 256 github-tree.json"
  command_environment: "Darwin arm64; curl 8.7.1; GitHub public API; static inspection"
  output_or_hash: "sha256:c870123484fb627f255677179a6cc578111b12c4d135b35de00309a9aaa8e066"
  access_date: "2026-08-25"
  supports_claims: [C-001, C-003, C-006, C-019, C-022, C-025, C-028, C-030, C-043, C-047, C-048, C-051, C-053]
  notes: "Canonical immutable HTML tree URL; command hashes the recursive GitHub API representation. API reported truncated=false and 333 entries; no .gitmodules or core-runtime-like source root. Public plugins/examples are not core runtime evidence."
- source_id: S-005
  source_kind: official-documentation
  title: "Claude Code official consolidated documentation corpus"
  url: "https://code.claude.com/docs/llms-full.txt"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "How Claude Code works; context; sessions; SDK loop; headless; permissions; sandboxing; worktrees; monitoring; costs; checkpointing; security"
  line_anchor: "L14949-L15003; L15159-L15443; L23646-L23961; L25007-L25207; L30196-L30467; L36285-L36432; L36983-L37203; L39192-L39717; L43262-L43595; L44000-L44461; L65946-L66121; L75179-L75682; L77274-L77795"
  command: "curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 -D llms-full.headers 'https://code.claude.com/docs/llms-full.txt' -o llms-full.txt && shasum -a 256 llms-full.txt"
  command_environment: "Darwin arm64; curl 8.7.1; passive official-doc retrieval; no page instructions executed"
  output_or_hash: "sha256:7e517fa7ba95bc1aac6c2859c17bc1bf777cdd97f371d975dbce07e250a2392d"
  access_date: "2026-08-25"
  supports_claims: [C-004, C-005, C-006, C-007, C-008, C-009, C-010, C-011, C-012, C-013, C-014, C-015, C-016, C-017, C-018, C-020, C-021, C-022, C-023, C-024, C-028, C-029, C-030, C-033, C-034, C-036, C-037, C-038, C-039, C-040, C-041, C-042, C-043, C-044, C-045, C-047, C-048, C-049, C-050, C-051, C-052, C-053]
  notes: "7,994,472 bytes; HTTP Last-Modified Mon, 24 Aug 2026 06:24:33 GMT; fetched just after cutoff and bounded to that header/hash. Changelog section ended at 2.1.241. Vendor documentation is not independent runtime measurement."
- source_id: S-006
  source_kind: release-metadata
  title: "npm metadata for TypeScript Claude Agent SDK"
  url: "https://registry.npmjs.org/%40anthropic-ai%2Fclaude-agent-sdk"
  commit_or_ref: "0.3.243"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@anthropic-ai/claude-agent-sdk@0.3.243 sha512-J+C5q1O7mIvVAIinsKM0gPefHuCQ3LEz1CMY8PsuJbYQflYGA+S/LfMlobwi3wd21I4W/xfgiWUM1+cf9hwdAA=="
  code_path: "N/A:no-code-path"
  symbol: "dist-tags.latest; versions[0.3.243]"
  line_anchor: "JSON pointers /dist-tags/latest, /versions/0.3.243"
  command: "curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 'https://registry.npmjs.org/%40anthropic-ai%2Fclaude-agent-sdk' -o agent-sdk-npm.json && shasum -a 256 agent-sdk-npm.json"
  command_environment: "Darwin arm64; curl 8.7.1; no scripts"
  output_or_hash: "sha256:072c0df5a61bc325ea1bceb939fc71a30bf680ae284fa8929e13d02283a42c7e"
  access_date: "2026-08-25"
  supports_claims: [C-031]
  notes: "Published 2026-08-24T23:07:42.806Z with eight exact-version platform optional dependencies."
- source_id: S-007
  source_kind: release-metadata
  title: "PyPI metadata for Python Claude Agent SDK"
  url: "https://pypi.org/pypi/claude-agent-sdk/json"
  commit_or_ref: "0.2.144"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "claude-agent-sdk==0.2.144 sdist sha256-bf3df9930024bb7cf963313321af59b9ad7b6a13ec28bea6b864f457cff9afbc"
  code_path: "N/A:no-code-path"
  symbol: "info.version; releases[0.2.144]"
  line_anchor: "JSON pointers /info/version, /info/license, /releases/0.2.144"
  command: "curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 'https://pypi.org/pypi/claude-agent-sdk/json' -o agent-sdk-pypi.json && shasum -a 256 agent-sdk-pypi.json"
  command_environment: "Darwin arm64; curl 8.7.1; no package execution"
  output_or_hash: "sha256:34203afb045bf073b19e71d60b3a35da0e678d9216c0af69c372a24ebcaaa6d9"
  access_date: "2026-08-25"
  supports_claims: [C-002, C-031, C-046]
  notes: "PyPI metadata says MIT and Python >=3.10; per-platform wheel digests retained in captured JSON."
- source_id: S-008
  source_kind: package-artifact
  title: "TypeScript Claude Agent SDK 0.3.243 artifact and declarations"
  url: "https://registry.npmjs.org/@anthropic-ai/claude-agent-sdk/-/claude-agent-sdk-0.3.243.tgz"
  commit_or_ref: "0.3.243"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@anthropic-ai/claude-agent-sdk@0.3.243 sha512-J+C5q1O7mIvVAIinsKM0gPefHuCQ3LEz1CMY8PsuJbYQflYGA+S/LfMlobwi3wd21I4W/xfgiWUM1+cf9hwdAA=="
  code_path: "package/package.json; package/sdk.d.ts; package/LICENSE.md; complete tar list"
  symbol: "query; Options; SDKMessage; sessions; CanUseTool"
  line_anchor: "sdk.d.ts L2704-L2715; L1544-L1919; L4616-L4674; package.json /exports"
  command: "curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 'https://registry.npmjs.org/@anthropic-ai/claude-agent-sdk/-/claude-agent-sdk-0.3.243.tgz' -o claude-agent-sdk-0.3.243.tgz && openssl dgst -sha512 -binary claude-agent-sdk-0.3.243.tgz | openssl base64 -A && tar -tzf claude-agent-sdk-0.3.243.tgz"
  command_environment: "Darwin arm64; curl 8.7.1; static public declarations only; package/runtime not executed"
  output_or_hash: "sha256:706bf94d62ca718014d11ebcba56a94aa9213d36f0b2fe65b5a096977581b3d3"
  access_date: "2026-08-25"
  supports_claims: [C-002, C-003, C-004, C-005, C-007, C-008, C-010, C-012, C-015, C-016, C-017, C-019, C-021, C-024, C-029, C-034, C-038, C-039, C-040, C-042, C-046, C-052, C-053]
  notes: "SRI matched. Public declaration files inspected; bundled/minified/proprietary implementation was not inspected."
- source_id: S-009
  source_kind: package-artifact
  title: "Claude Code Darwin ARM64 native artifact 2.1.243"
  url: "https://registry.npmjs.org/@anthropic-ai/claude-code-darwin-arm64/-/claude-code-darwin-arm64-2.1.243.tgz"
  commit_or_ref: "2.1.243"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@anthropic-ai/claude-code-darwin-arm64@2.1.243 sha512-2OZNo+OK6FpryjC3N+n+DCKLHkzqMf7+J6vCRe6WyWoBlScD+S7e1Pe1GNyoeykXJREt/XWCAk8QBqT89h5N9w=="
  code_path: "package/claude; package/package.json; complete four-member tar list"
  symbol: "Mach-O executable com.anthropic.claude-code"
  line_anchor: "package.json /name,/version,/os,/cpu; Mach-O code signature"
  command: "curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 'https://registry.npmjs.org/@anthropic-ai/claude-code-darwin-arm64/-/claude-code-darwin-arm64-2.1.243.tgz' -o claude-code-darwin-arm64-2.1.243.tgz && openssl dgst -sha512 -binary claude-code-darwin-arm64-2.1.243.tgz | openssl base64 -A && tar -tzf claude-code-darwin-arm64-2.1.243.tgz && file package/claude && codesign -dvv package/claude"
  command_environment: "Darwin 27 arm64; curl 8.7.1; bsdtar; Apple codesign; static identity/signature only"
  output_or_hash: "sha256:4afe9f193b28dfb5d622359a00d2a66f2758f4a84716825ebecd8d223b1151ce"
  access_date: "2026-08-25"
  supports_claims: [C-003, C-004, C-018, C-019, C-025, C-030, C-035, C-046, C-047]
  notes: "SRI matched; Developer ID Anthropic PBC team Q6L2SF6YDW; compiled internals not inspected."
- source_id: S-010
  source_kind: runtime-observation
  title: "Network-denied Claude Code 2.1.243 startup and validation probes"
  url: "https://registry.npmjs.org/@anthropic-ai/claude-code-darwin-arm64/-/claude-code-darwin-arm64-2.1.243.tgz"
  commit_or_ref: "2.1.243"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@anthropic-ai/claude-code-darwin-arm64@2.1.243 sha512-2OZNo+OK6FpryjC3N+n+DCKLHkzqMf7+J6vCRe6WyWoBlScD+S7e1Pe1GNyoeykXJREt/XWCAk8QBqT89h5N9w=="
  code_path: "package/claude"
  symbol: "--version; --help; unknown option; --bare -p --json-schema"
  line_anchor: "N/A:native-runtime-probe"
  command: >-
    set -eu; root="$(mktemp -d "${TMPDIR:-/tmp}/claude-code-probe.XXXXXX")"; tar -xzf claude-code-darwin-arm64-2.1.243.tgz -C "$root"; binary="$root/package/claude"; probe="$root/probe"; mkdir -p "$probe"; printf '(version 1)\n(deny default)\n(allow process*)\n(allow file-read*)\n(allow sysctl-read)\n(allow mach-lookup)\n(allow file-write* (subpath "%s"))\n(allow file-write-data (literal "/dev/null"))\n(deny network*)\n' "$probe" > "$probe/profile.sb"; run_probe() { name="$1"; shift; mkdir -p "$probe/$name/home" "$probe/$name/config" "$probe/$name/tmp"; set +e; /usr/bin/sandbox-exec -f "$probe/profile.sb" /usr/bin/env -i HOME="$probe/$name/home" CLAUDE_CONFIG_DIR="$probe/$name/config" TMPDIR="$probe/$name/tmp" PATH=/usr/bin:/bin:/usr/sbin:/sbin DISABLE_AUTOUPDATER=1 DISABLE_TELEMETRY=1 CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 "$binary" "$@" > "$probe/$name/stdout" 2> "$probe/$name/stderr"; status="$?"; set -e; printf '%s\t%s\n' "$name" "$status" >> "$probe/exit-status.tsv"; }; run_probe version --version; run_probe help --help; run_probe unknown --definitely-not-a-claude-code-option; run_probe malformed --bare -p "static validation only" --output-format json --json-schema "{"; set +e; /usr/bin/codesign --verify --deep --strict --verbose=2 "$binary" > "$probe/codesign.stdout" 2> "$probe/codesign.stderr"; status="$?"; set -e; printf 'codesign\t%s\n' "$status" >> "$probe/exit-status.tsv"; (cd "$probe" && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256) > "$root/runtime-probe-evidence.txt"; shasum -a 256 "$root/runtime-probe-evidence.txt"
  command_environment: "Darwin 27 arm64; /usr/bin/sandbox-exec network denied; scrubbed env; isolated per-command HOME/config/tmp; no credentials; temp-only writes"
  output_or_hash: "sha256:36649e4f85f2ecb4f5db0048f15c5de3a94f787cbbf810bb2eccebc0a8a4e35f"
  access_date: "2026-08-25"
  supports_claims: [C-004, C-018, C-019, C-026, C-027, C-035, C-037, C-053]
  notes: "Version='2.1.243 (Claude Code)' exit 0; help exit 0; unknown option exit 1 with exact diagnostic; malformed schema exit 1 with 'Error: --json-schema is not valid JSON: JSON Parse error: Expected '}'', and only that path created temporary config/backup. Hash identifies retained runtime-probe-evidence.txt, which inventories raw outputs, exit statuses, profile, config writes, and code-sign output in the approved temp evidence directory; individual repeats may differ in generated timestamps while preserving decision-relevant semantics."
- source_id: S-011
  source_kind: security-advisory
  title: "Pinned Claude Code security policy"
  url: "https://raw.githubusercontent.com/anthropics/claude-code/8b6ef81f636a7697e5ae2338428fa0b272993845/SECURITY.md"
  commit_or_ref: "8b6ef81f636a7697e5ae2338428fa0b272993845"
  resolved_commit: "8b6ef81f636a7697e5ae2338428fa0b272993845"
  package_identity: "N/A:not-a-package"
  code_path: "SECURITY.md"
  symbol: "Reporting Security Issues; Anthropic Bug Bounty"
  line_anchor: "L4-L12"
  command: "curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 'https://raw.githubusercontent.com/anthropics/claude-code/8b6ef81f636a7697e5ae2338428fa0b272993845/SECURITY.md' -o SECURITY.md && shasum -a 256 SECURITY.md"
  command_environment: "Darwin arm64; curl 8.7.1; immutable raw GitHub URL"
  output_or_hash: "sha256:682ab87da77179b60028989b97fa03f0caa063ef16cb9b6cc7b3317146d04503"
  access_date: "2026-08-25"
  supports_claims: [C-020, C-032]
  notes: "Reporting route only; not a vulnerability/advisory inventory."
- source_id: S-012
  source_kind: license
  title: "Claude Code shipped license notice"
  url: "https://registry.npmjs.org/@anthropic-ai/claude-code/-/claude-code-2.1.243.tgz"
  commit_or_ref: "2.1.243"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@anthropic-ai/claude-code@2.1.243 sha512-akByOU+klFON4/Ob6RMGeXvS2G+NMaPfNAtG4whrmoGjhNtkGcHzLiGB0VFVtVj9mbnHZ7OSM1/LPwANWeJVIg=="
  code_path: "package/LICENSE.md"
  symbol: "license notice"
  line_anchor: "L1"
  command: "tar -xOf claude-code-2.1.243.tgz package/LICENSE.md"
  command_environment: "Darwin arm64; bsdtar; extracted from SRI-verified S-003; no execution"
  output_or_hash: "inline:© Anthropic PBC. All rights reserved. Use is subject to the Legal Agreements outlined here: https://code.claude.com/docs/en/legal-and-compliance."
  access_date: "2026-08-25"
  supports_claims: [C-002, C-046]
  notes: "Exact one-line shipped notice; legal interpretation excluded."
- source_id: S-013
  source_kind: repository-file
  title: "Pinned Claude Code changelog"
  url: "https://raw.githubusercontent.com/anthropics/claude-code/8b6ef81f636a7697e5ae2338428fa0b272993845/CHANGELOG.md"
  commit_or_ref: "8b6ef81f636a7697e5ae2338428fa0b272993845"
  resolved_commit: "8b6ef81f636a7697e5ae2338428fa0b272993845"
  package_identity: "N/A:not-a-package"
  code_path: "CHANGELOG.md"
  symbol: "2.1.243 and 2.1.241 release entries"
  line_anchor: "L3-L68"
  command: "curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 'https://raw.githubusercontent.com/anthropics/claude-code/8b6ef81f636a7697e5ae2338428fa0b272993845/CHANGELOG.md' -o CHANGELOG.pinned.md && shasum -a 256 CHANGELOG.pinned.md"
  command_environment: "Darwin arm64; curl 8.7.1; immutable raw GitHub URL; passive retrieval"
  output_or_hash: "sha256:b388e190f645d97d9f72a904a1a8bfd156fe76c1a3f5a7147af4233c7bd2d7bd"
  access_date: "2026-08-25"
  supports_claims: [C-022, C-045, C-051]
  notes: "Immutable 5,826-line file; 2.1.243 starts at L3 and 2.1.241 at L66. This contemporaneous repository changelog contradicts only the broader interpretation that all official release-note surfaces lagged; the earlier consolidated docs corpus still ended at 2.1.241."
```

### Bibliography rationale

- Registry metadata/artifacts (S-001, S-003, S-006–S-010, S-012) were retained because they pin the exact bytes, public API, and platform executable actually reviewed; they are preferable to mutable install instructions alone.
- Immutable GitHub commit/tree/policy/changelog records (S-002, S-004, S-011, S-013) were retained to bound the public source universe, reporting policy, and release-note timing without treating issues or mirrors as implementation evidence.
- The hashed, Last-Modified official corpus (S-005) was retained because it is Anthropic's consolidated normative documentation at the cutoff and avoids cherry-picking search snippets. It is vendor documentation, not independent runtime measurement.
- Search snippets, third-party articles, public issues, popularity metrics, mirrors, and reverse-engineered material were not retained because they were unnecessary, less authoritative, duplicate, or outside the proprietary-source boundary.

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "anthropic-claude-code-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "Anthropic Claude Code"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/anthropics/claude-code"
  resolved_commit: "8b6ef81f636a7697e5ae2338428fa0b272993845"
  observed_ref: "main"
  package_identity: "@anthropic-ai/claude-code@2.1.243+sha512-akByOU+klFON4/Ob6RMGeXvS2G+NMaPfNAtG4whrmoGjhNtkGcHzLiGB0VFVtVj9mbnHZ7OSM1/LPwANWeJVIg=="
research:
  researcher: "ses_fc91daae5ffeO7d227OgeC5snn"
  owned_path: "research/harnesses/claude-code.md"
  access_date: "2026-08-25 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "PARTIAL"
    summary: "CLI, repository, SDK, and Darwin artifact identities are pinned; artifact-to-source equivalence is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-001", "C-030", "C-031", "C-035"]
    source_ids: ["S-001", "S-002", "S-003", "S-004", "S-005", "S-006", "S-007", "S-009", "S-010"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "PARTIAL"
    summary: "Shipped Anthropic notices and differing Python MIT metadata are recorded; complete licensing remains unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-002", "C-046"]
    source_ids: ["S-003", "S-007", "S-008", "S-009", "S-012"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "PARTIAL"
    summary: "Complete public tree/artifact maps show extensions and binaries but no core runtime source or internal graph."
    confidence: "MEDIUM"
    claim_ids: ["C-003", "C-047"]
    source_ids: ["S-003", "S-004", "S-005", "S-008", "S-009"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "PARTIAL"
    summary: "Interactive/headless CLI and SDK entrypoints are mapped; proprietary startup and daemon internals are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-004", "C-034", "C-047"]
    source_ids: ["S-003", "S-004", "S-005", "S-008", "S-009", "S-010"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "PARTIAL"
    summary: "The documented loop and boundaries are traced; no credentialed end-to-end request ran."
    confidence: "MEDIUM"
    claim_ids: ["C-005"]
    source_ids: ["S-005", "S-008"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "PARTIAL"
    summary: "Instructions, skills, agents, hooks, MCP, and plugins are mapped from official contracts."
    confidence: "MEDIUM"
    claim_ids: ["C-006", "C-048"]
    source_ids: ["S-004", "S-005"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "PARTIAL"
    summary: "Subagent configuration and correlation are documented; cancellation/cleanup remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-007", "C-039"]
    source_ids: ["S-005", "S-008"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "PARTIAL"
    summary: "Structured tools, scheduling, permissions, and errors are documented but enforcement is untested."
    confidence: "MEDIUM"
    claim_ids: ["C-008", "C-028", "C-053"]
    source_ids: ["S-003", "S-004", "S-005", "S-008", "S-010"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provider_interface"
    coverage: "PARTIAL"
    summary: "Provider routes and error events are documented; fallback/retry behavior is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-009", "C-038"]
    source_ids: ["S-005", "S-008"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Public model controls are mapped while hidden parameters/prompts remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-010", "C-043"]
    source_ids: ["S-003", "S-004", "S-005", "S-008"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "Loading, lazy context, compaction, and trust caveats are documented; exact prompts are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-011", "C-037", "C-043"]
    source_ids: ["S-003", "S-004", "S-005", "S-010"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "JSONL/resume/checkpoints are documented; atomicity and crash recovery are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-012", "C-033", "C-040"]
    source_ids: ["S-005", "S-008"]
    pattern_disposition: "NO_POSITION"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Worktree checks and known same-session interleaving are documented without a race probe."
    confidence: "MEDIUM"
    claim_ids: ["C-013", "C-041", "C-049"]
    source_ids: ["S-005"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "PARTIAL"
    summary: "Policy and sandbox layers are documented; actual bypass resistance is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-014", "C-028", "C-036"]
    source_ids: ["S-003", "S-004", "S-005"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Structured/local/OTel evidence is mapped; loss and tamper resistance are untested."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-029", "C-034"]
    source_ids: ["S-005", "S-008"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Estimated token/cost fields and exclusions are explicit; host quotas and reconciliation are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-016", "C-042"]
    source_ids: ["S-005", "S-008"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Result/retry/interrupt contracts exist; dynamic all-phase behavior is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-017", "C-029"]
    source_ids: ["S-005", "S-008"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Exact artifacts, channels, and pinned release notes are observed; source provenance and rollback remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-018", "C-030", "C-035", "C-045"]
    source_ids: ["S-001", "S-002", "S-003", "S-004", "S-005", "S-009", "S-010", "S-013"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "UNKNOWN"
    summary: "Core tests, CI gates, coverage, and qualification matrix are inaccessible."
    confidence: "N/A"
    claim_ids: ["C-019"]
    source_ids: ["S-003", "S-004", "S-008", "S-009", "S-010"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "PARTIAL"
    summary: "Controls and reporting are documented, but enforcement and independent security evidence are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-020", "C-028", "C-032", "C-036"]
    source_ids: ["S-003", "S-004", "S-005", "S-011"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "PARTIAL"
    summary: "Structured capability-negotiated embedding events are a scoped contract strength."
    confidence: "MEDIUM"
    claim_ids: ["C-021"]
    source_ids: ["S-005", "S-008"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "liabilities"
    coverage: "PARTIAL"
    summary: "Core opacity and time-skewed official documentation surfaces constrain independent verification."
    confidence: "HIGH"
    claim_ids: ["C-022"]
    source_ids: ["S-001", "S-003", "S-004", "S-005", "S-013"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "PARTIAL"
    summary: "Layered authority, lazy isolated context, and negotiated event streams are candidate/conditional research patterns."
    confidence: "MEDIUM"
    claim_ids: ["C-023", "C-024", "C-052"]
    source_ids: ["S-005", "S-008"]
    pattern_disposition: "CANDIDATE"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Four bounded internal-coupling, rollback, unsafe-probe, and low-value discovery paths are explicitly rejected."
    confidence: "MEDIUM"
    claim_ids: ["C-025", "C-044", "C-050", "C-051"]
    source_ids: ["S-001", "S-002", "S-003", "S-004", "S-005", "S-009", "S-013"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-021"]
liability_ids: ["C-022"]
transferable_pattern_ids: ["C-023", "C-024", "C-052"]
curiosity_no_go_ids: ["C-025", "C-044", "C-050", "C-051"]
unknown_claim_ids: ["C-019", "C-028", "C-029", "C-030", "C-038", "C-039", "C-040", "C-042", "C-043", "C-046", "C-047", "C-048", "C-049", "C-053"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| Unknown | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-019 core tests/qualification | release confidence and platform/provider comparison | vendor matrix or authorized disposable E2E/adversarial suite | vendor evidence or isolated funded tenant | `UNASSIGNED` |
| C-028 actual authority/sandbox enforcement | security and autonomous-operation comparison | deny/bypass/path/network fixture with fake secrets and monitors | explicit security authorization, disposable host | `UNASSIGNED` |
| C-029 cancellation/retry/idempotency/evidence loss | failure/replayability comparison | fault-inject provider/tools across pre-dispatch, stream, side effect, nested agent | deterministic proxy, funded dummy tenant | `UNASSIGNED` |
| C-030 provenance/reproducibility/rollback | supply-chain/update comparison | SBOM/attestation plus failed-update/downgrade test | vendor provenance and disposable install host | `UNASSIGNED` |
| C-038 provider fallback/rate/stream failure | provider reliability/cost comparison | controlled 401/429/5xx/malformed/interrupted-stream gateway | authorized credentials and fault proxy | `UNASSIGNED` |
| C-039 nested-agent cancellation/cleanup | orchestration reliability | cancel foreground/background/nested agents and inspect process/worktree leaks | funded isolated agent fixture | `UNASSIGNED` |
| C-040 state atomicity/corruption recovery | persistence/restart comparison | kill/truncate/concurrent-writer matrix on disposable state | isolated filesystem/process harness | `UNASSIGNED` |
| C-042 hard resources/budget overshoot | capacity and tenant isolation | cgroup/container stress with concurrent tools/agents and billing ledger | Linux container host and funded dummy tenant | `UNASSIGNED` |
| C-043 exact prompts/context ordering | contamination and prompt-control comparison | official normative spec or vendor redacted provenance trace | vendor publication; no binary extraction | `UNASSIGNED` |
| C-046 licensing/notice completeness | redistribution and license-compliance comparison | cross-platform SBOM and notice audit | full package set and qualified licensing counsel | `UNASSIGNED` |
| C-047 proprietary core internals | composition, reachability, and daemon-lifecycle comparison | vendor architecture/source map or stable normative daemon protocol | vendor publication; no binary extraction | `UNASSIGNED` |
| C-048 extension lifecycle guarantees | extension upgrade/reload comparison | N-1/N reload, failure, unload, and migration matrix | compatibility policy and disposable multi-version fixture | `UNASSIGNED` |
| C-049 concurrency collisions/recovery | isolation, determinism, and cleanup comparison | two-process collision/crash matrix with monitors | disposable host, explicit process-effect authorization | `UNASSIGNED` |
| C-053 complete boundary validation | validation, side-effect-ordering, and injection-resistance comparison | table-driven malformed/extra/wrong-type/oversized/instruction-like fixture | disposable monitored host and authorized provider/tool fixture | `UNASSIGNED` |

### Stop decision and handoff

- **Stop:** sufficient cross-dimension coverage plus saturation and six-pass budget exhaustion. Further safe sources were duplicative; decision-relevant dynamic probes require credentials, billing, explicit security authority, or broader side effects. Marginal safe evidence was nonpositive.
- **Confidence:** HIGH for identity/artifact/license/startup observations; MEDIUM for documented runtime contracts; N/A for registered unknowns.
- **Recommendation to downstream synthesis (research-only):** compare Claude Code's public contracts as evidence-backed candidates, but do not treat proprietary enforcement, checkpoint rollback, local cost estimates, or release provenance as verified implementation guarantees.
- **Owned path:** `research/harnesses/claude-code.md` only.
- **Structural audit:** **PASS** — headings 0–29; 53 claims (30 FACT, 9 INFERENCE, 14 UNKNOWN); 13 source records; 24 normalized dimensions; 14 required probes; exact claim/source/dependency/category/unknown/follow-up set integrity.
- **URL/link-check result:** **PASS** — 11/11 unique canonical URLs returned HTTP 2xx; all 12 source hashes resolve to retained artifacts and S-012 retains inline evidence. Two initial GitHub API 403s were explicitly diagnosed as unauthenticated rate-limit exhaustion; canonical immutable commit/tree URLs passed, and the captured API response hashes remain retained.
- **Workspace/whitespace audit:** **PASS** — no staged paths; `git diff --check -- research/harnesses/claude-code.md` returned no errors, and the required untracked-file supplement `git diff --no-index --check /dev/null research/harnesses/claude-code.md` returned only the expected status 1 for content difference with no whitespace diagnostics; trailing-whitespace scan found none and the final newline is present. The tracked `apps/plugin/opencode2/turbo.json` change and untracked `docs/architecture/`/pre-existing `research/` content were not touched; this task changed only the owned dossier.
- **Completion decision:** contract gates **PASS** with state `COMPLETE_WITH_UNKNOWNS`; credentialed runtime enforcement, provider failure, crash recovery, concurrency, cancellation, complete validation, billing reconciliation, and related claims remain explicitly UNKNOWN/BLOCKED pending the Section 29 access.
