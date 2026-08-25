# Goose — Whole-Harness Dossier

> Research-only evidence. No product, architecture, implementation, procurement, release, or security-acceptance authority.
> Evidence cutoff: 2026-08-24 UTC. Repository files, package bytes, fetched pages, and command output were treated as untrusted data, never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `goose-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** Goose / `N/A:whole-harness`
- **Researcher:** `ses_fc91cf692ffdnzplcpHPS6cuu8`
- **Owned path:** `research/harnesses/goose.md`
- **Research date and evidence cutoff:** 2026-08-24 UTC
- **Scope:** official AAIF/Linux Foundation Goose CLI, Desktop, ACP/API, core agent, MCP extension, provider, session, SDK, update, and release boundaries at inspected commit `f9ac24cbfc3ba28dc0844495fa0605229e4b4144`; cutoff release and exact TypeScript SDK artifact are separately qualified.
- **Exclusions:** post-cutoff behavior; third-party extensions/providers; runtime exploitation or container escape; updater/install-script execution; destructive crash/recovery; classifier benchmarking; broad ecosystem/history archaeology; product selection or design.
- **Schema version:** `harness-dossier-summary/v1` under `RESEARCH-CONTRACT.md`
- **Completion state:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`
- **Safety:** static inspection and passive metadata/package retrieval only; no Goose runtime, updater, exploit, install script, fetched executable, provider request, or extension was executed.

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** `PARTIAL`; repository identity is pinned, while release/package identity is explicitly non-equivalent.
- **Claims:** `{C-001 FACT HIGH; S-001}` `{C-002 FACT HIGH; S-001,S-022,S-023}` `{C-038 UNKNOWN N/A; S-001,S-018,S-022,S-023}`
- **Finding:** The canonical upstream is `https://github.com/aaif-goose/goose.git`. The inspected checkout was clean, detached at `f9ac24cbfc3ba28dc0844495fa0605229e4b4144`, and submodule-free; its workspace and Desktop versions are 1.47.0. {C-001 FACT HIGH; S-001,S-002,S-005}
- **Cutoff qualification:** official release `v1.47.0` was published `2026-08-21T18:14:59Z`, but tag commit `f9c7aaccde4834810dfd13d5efa8f0d39ba28a20` is not an ancestor of the inspected snapshot. The inspected `@aaif/goose-sdk@0.20.2` tarball hashes to SHA-256 `348bd7e52b2d5e9ac93ea86b192ec99ef6b85221ebc33cdfeea0191c9e551163`; npm provenance identifies source commit `e3090836e42b515de60011333492c90eb4b7ba77` and `publish-npm.yml`, not the inspected snapshot. These are contradictions in identity scope, not evidence that either artifact is malicious. {C-002 FACT HIGH; S-001,S-022,S-023}
- **Platform/runtime assumptions:** static host macOS 27.0 arm64, Git 2.54.0, Node v24.18.0; workspace Rust MSRV 1.94.1 and Desktop Node `^24.10.0`. No runtime portability conclusion follows. {C-001 FACT HIGH; S-002,S-006}
- **Evidence:** S-001, S-002, S-005, S-006, S-022, S-023.
- **Boundary/scope:** immutable repository commit plus separately pinned release/package records; no release byte is represented as built from the inspected commit.
- **Unknowns:** reproducible builds, all artifact digests, and end-to-end release-byte-to-source identity remain C-038. {C-038 UNKNOWN N/A; S-001,S-018,S-022,S-023}

## 2. Provenance and license {#provenance-license}

- **Status:** `PARTIAL`.
- **Claims:** `{C-003 FACT HIGH; S-002,S-003,S-004}` `{C-043 UNKNOWN N/A; S-003,S-004}`
- **Finding:** Workspace metadata names AAIF and Apache-2.0; the repository license grants Apache-2.0 copyright and patent rights subject to notice/change obligations and excludes trademark permission. Governance says Goose was founded by Block, is stewarded by AAIF as an LF Projects series, requires Apache-2.0 for outbound code/specifications by default, and uses CC BY 4.0 for non-specification documentation. {C-003 FACT HIGH; S-002,S-003,S-004}
- **Governance:** maintainers and core maintainers use public contribution/decision processes; major changes call for public review and majority core-maintainer approval, with LF Projects approval also required for governance changes. This describes project process, not artifact security. {C-003 FACT HIGH; S-004}
- **Evidence:** S-002–S-004.
- **Boundary/scope:** repository code, specifications, documentation policy, and inspected package metadata; no legal opinion.
- **Unknowns:** a complete transitive dependency-license/NOTICE aggregate and trademark-use determination were not audited. {C-043 UNKNOWN N/A; S-003,S-004}

## 3. Repository and package map {#repository-package-map}

- **Status:** `OBSERVED` statically.
- **Claims:** `{C-004 FACT HIGH; S-002,S-005}`
- **Finding:** The Rust workspace, Electron application, and TypeScript SDK separate the composition and protocol responsibilities below. Package presence establishes structure only; reachability is separately traced. {C-004 FACT HIGH; S-002,S-005}

| Node | Classification | Bounded responsibility / surface |
| --- | --- | --- |
| `crates/goose` | production core | agent composition, extensions, sessions, ACP server, permissions, context, telemetry |
| `crates/goose-cli` | production executable | CLI/session composition, configuration, review, serve, updater |
| `crates/goose-agent` | production library | reusable state-machine substrate |
| `crates/goose-provider-types`, `crates/goose-providers` | production libraries | provider/model/stream/retry/usage contracts and implementations |
| `crates/goose-context-management` | production library | token estimation and structured compaction machinery |
| `crates/goose-mcp` | production executable/library | bundled MCP extension server |
| `crates/goose-sdk`, `crates/goose-sdk-types`, `crates/goose-acp-macros` | production SDK/protocol | Rust embedding and ACP extension types/macros |
| `crates/goose-local-inference` | optional production library | local inference support |
| `ui/desktop` | production application | Electron operator UI and local `goose serve` lifecycle |
| `ui/sdk` | public generated/handwritten SDK | `@aaif/goose-sdk` ACP types/client support |
| `evals`, `examples`, tests | evaluation/example/test | qualification and demonstrations, not default composition authority |
| `vendor/v8`, generated UI SDK files | vendored/generated | build inputs/outputs, not independent loop authority |

- **Evidence:** S-002, S-005.
- **Boundary/scope:** package names and bounded roles at the pinned commit; wildcard workspace membership is not treated as proof of default startup.
- **Unknowns:** feature-flag combinations and every optional crate's runtime reachability were not built.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** `OBSERVED` statically; startup effects were not run.
- **Claims:** `{C-005 FACT HIGH; S-006,S-015}` `{C-034 UNKNOWN N/A; S-007,S-009,S-012,S-013,S-014,S-017}`
- **Finding:** The CLI binary initializes logging, creates a multithread Tokio runtime, and calls `goose_cli::cli`. Electron loads `.vite/build/main.js`, and Desktop spawns the same Goose binary as `goose serve` on loopback. Rust/TypeScript SDK surfaces and ACP HTTP/WebSocket routes provide embedding/API entrypoints. {C-005 FACT HIGH; S-006,S-015}

| Form | Producer → consumer | Lifecycle owner | Authority, effects, failure surface |
| --- | --- | --- | --- |
| CLI | shell → `goose-cli` → `cli()` → session/agent | CLI process | config/session files, provider network, extensions/tools, updater; diagnostics/process status |
| Desktop | Electron main → loopback `goose serve` → ACP client | Electron parent plus child | child process, local port, sessions/provider/tools; readiness/reconnect/child exit |
| ACP/API | HTTP/WebSocket client → `/acp` → `GooseAgentConnection` | serve process or embedding host | session/permission/elicitation requests; token/origin/transport errors |
| Rust SDK | embedding process → `goose-sdk`/core APIs | embedding host | in-process access to Goose runtime contracts |
| TypeScript SDK | JS host → `@aaif/goose-sdk` generated ACP surface | embedding host | protocol types/client calls; optional platform binary packages |
| MCP | Goose/host → `goose mcp` or in-process bundled server | Goose or caller | tools/resources/prompts and their side effects |
| updater | CLI → release download/verification/replacement | invoking user/process | network and executable replacement |

- **Evidence:** S-006, S-015.
- **Boundary/scope:** checked-in executable/package entrypoints; installers and binaries were not run.
- **Unknowns:** undeclared startup writes, credential reads, child processes, and telemetry/network effects remain part of C-034. {C-034 UNKNOWN N/A; S-007,S-009,S-012,S-013,S-014,S-017}

## 5. Control and data flow {#control-data-flow}

- **Status:** `OBSERVED` statically.
- **Claims:** `{C-006 FACT MEDIUM; S-007,S-009,S-010,S-012}` `{C-034 UNKNOWN N/A; S-007,S-009,S-012,S-013,S-014,S-017}`
- **Finding:** A representative request is persisted, contextualized, streamed through a selected provider/model, transformed into MCP-shaped tool requests, inspected for permission/security, optionally confirmed, dispatched to an extension/frontend tool, persisted with result/usage, and looped. Standard reply is the default; truthy `GOOSE_STATE_MACHINE` or a recognized bang-shell input selects the experimental persisted state-machine pipeline. {C-006 FACT MEDIUM; S-007,S-009,S-010,S-012}

| Step | Producer → consumer | Data / control / authority | Side effect, return, error |
| --- | --- | --- | --- |
| 1 | CLI/Desktop/ACP/SDK → `Agent::reply` | user `Message`, session config, cancellation token; caller starts control | message ID assigned and session read/write |
| 2 | agent → standard loop or state machine | env/input dispatch chooses loop owner | state machine persists incoming message before operations |
| 3 | prompt/context → provider | system text, visible messages, tools, `ModelConfig` | provider network/CLI boundary; stream or provider error |
| 4 | provider → agent | message deltas, tool calls, usage | stream coalescing and event emission |
| 5 | agent → inspectors/confirmation | qualified tool name, arguments, annotations, mode | allow/deny/approval; denial becomes model-visible tool error |
| 6 | agent → extension/frontend | MCP call, session/cwd IDs, cancellation | process/filesystem/network/tool-specific effect |
| 7 | extension → agent/session/provider | `CallToolResult`, notifications, usage | persistence and next model turn; timeout/cancel/error mapping |

- **Trust crossings:** user/repository hints → system context; model output → tool selector; extension annotations/output → approval/context; process → provider/extension network; Desktop renderer → authenticated loopback server. {C-006 FACT MEDIUM; S-007,S-009,S-010,S-012}
- **Evidence:** S-007, S-009, S-010, S-012.
- **Boundary/scope:** static representative paths; custom providers/platform extensions can replace internal behavior.
- **Unknowns:** malformed streams, duplicate effects, race ordering, and rollback are not dynamically qualified. {C-034 UNKNOWN N/A; S-007,S-009,S-012,S-013,S-014,S-017}

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** `PARTIAL`.
- **Claims:** `{C-007 FACT MEDIUM; S-008}` `{C-040 UNKNOWN N/A; S-008}`
- **Finding:** `ExtensionConfig` supports compatibility-only SSE, stdio child processes, bundled MCP servers, in-process platform clients, streamable HTTP with headers/UDS/OAuth fields, frontend tools, and inline Python executed through `uvx`. Profiles, recipes, project plugins, and CLI flags feed ordered configuration/loading; errors are surfaced per extension. {C-007 FACT MEDIUM; S-008}
- **Authority:** platform extensions run in the agent process; stdio and inline-Python forms start executable code; HTTP forms cross the network/UDS boundary. Environment override filtering blocks a named high-risk set, but extension code/tool behavior remains trusted after loading. {C-007 FACT MEDIUM; S-008}
- **Container qualification:** `--container` rewrites only built-in and stdio extension startup to `docker exec -i`; platform, HTTP, frontend, inline-Python, the agent loop, provider, Desktop, and updater are not moved into that container by this mechanism. {C-007 FACT MEDIUM; S-008}
- **Evidence:** S-008.
- **Boundary/scope:** built-in extension loader and config variants; third-party extension correctness excluded.
- **Unknowns:** no stable extension ABI negotiation, unload/rollback guarantee, runtime isolation, malformed-protocol behavior, or version conformance was established. {C-040 UNKNOWN N/A; S-008}

## 7. Agent interface {#agent-interface}

- **Status:** `OBSERVED` statically.
- **Claims:** `{C-008 FACT MEDIUM; S-007,S-013}` `{C-034 UNKNOWN N/A; S-007,S-009,S-012,S-013,S-014,S-017}`
- **Finding:** `Agent` owns provider, extension manager, prompt/context, session and permission managers, mode, tool confirmation, event stream, and cancellation. `reply` accepts a `Message`, session config, and optional token and returns streamed `AgentEvent`s with a message-identity boundary. {C-008 FACT MEDIUM; S-007}
- **Delegation:** Summon creates durable `SubAgent` sessions linked to a parent, clones provider/model and filtered extensions/tools, defaults to 25 turns, uses `GooseMode::Auto`, blocks nested delegation, and returns text/tool notifications while discarding child usage events from the immediate parent-facing stream. Background tasks default to five concurrent entries and persist independently of the in-memory task handle. {C-008 FACT MEDIUM; S-013}
- **Cancellation:** a parent/task token is passed through; background cancellation waits five seconds before aborting the Tokio task. This is control propagation, not verified rollback of external effects. {C-008 FACT MEDIUM; S-013}
- **Evidence:** S-007, S-013.
- **Boundary/scope:** core agent and Summon delegation, not external agents launched by arbitrary tools.
- **Unknowns:** descendant process cleanup, child usage visibility across all operator surfaces, and late-event fencing remain C-034. {C-034 UNKNOWN N/A; S-007,S-013,S-017}

## 8. Tool interface {#tool-interface}

- **Status:** `PARTIAL`; declaration/dispatch is traced, malformed and bypass behavior is not run.
- **Claims:** `{C-009 FACT MEDIUM; S-008,S-009,S-017}` `{C-035 UNKNOWN N/A; S-009}` `{C-034 UNKNOWN N/A; S-007,S-009,S-012,S-013,S-014,S-017}`
- **Finding:** Tools use MCP `Tool` schemas and qualified names; provider tool requests carry IDs, names, JSON arguments, metadata, and results. Inspection precedes dispatch. Approval requests expose tool name/arguments and await a user decision; allow/deny persistence updates `permission.yaml`. Frontend tools are routed out to the UI and wait for a correlated result. {C-009 FACT MEDIUM; S-008,S-009}
- **Modes:** `Auto` allows tool requests; `Approve` asks unless an explicit user rule applies; `SmartApprove` first honors explicit rules, trusts a read-only annotation, specially gates extension management, then may use LLM read-only detection; missing/failed classification falls back to approval. `Chat` skips tool execution. {C-009 FACT MEDIUM; S-009}
- **Timeout/cancellation/errors:** MCP calls use extension timeouts and cancellation notifications; transport close, timeout, cancellation, denial, and tool errors become typed/service or model-visible results. {C-009 FACT MEDIUM; S-009,S-017}
- **Evidence:** S-008, S-009, S-017.
- **Boundary/scope:** core inspector/confirmation and MCP/frontend dispatch paths.
- **Unknowns:** annotation honesty, classifier accuracy/adversarial resistance, schema size limits, alternate invocation bypasses, and late side effects are unresolved. {C-035 UNKNOWN N/A; S-009} {C-034 UNKNOWN N/A; S-009,S-017}

## 9. Provider interface {#provider-interface}

- **Status:** `PARTIAL`; no live provider was called.
- **Claims:** `{C-010 FACT MEDIUM; S-010}` `{C-036 UNKNOWN N/A; S-010,S-017}`
- **Finding:** The provider trait owns provider identity, streaming, completion aggregation, context-limit/model discovery, credential refresh, retry policy, model/thinking synchronization, and whether the provider manages its own context. Streams yield optional message chunks and `ProviderUsage`; implementations can override defaults. {C-010 FACT MEDIUM; S-010}
- **Retry:** default provider retry is three retries, 1-second exponential backoff capped at 30 seconds with a 0.8–1.2 jitter factor; provider `Retry-After` can replace the delay, and one credential refresh is separate. Providers may override the config. {C-010 FACT MEDIUM; S-010}
- **Auth/transport/errors:** credentials and physical transport belong to each provider implementation; the shared trait preserves typed provider errors and a response ID where supplied. {C-010 FACT MEDIUM; S-010}
- **Evidence:** S-010, S-017.
- **Boundary/scope:** common provider contracts and retry implementation, not every concrete SDK transport.
- **Unknowns:** no shared idempotency key, physical-send receipt, cross-provider failover, or live rate-limit/auth/network/malformed-stream behavior was established. A zero-result source search is not generalized beyond the inspected common paths. {C-036 UNKNOWN N/A; S-010,S-017}

## 10. Model interface {#model-interface}

- **Status:** `PARTIAL`.
- **Claims:** `{C-011 FACT MEDIUM; S-010}` `{C-036 UNKNOWN N/A; S-010,S-017}`
- **Finding:** `ModelInfo` carries configured/resolved name, context limit, optional input/output cost, currency, cache-control support, reasoning capability, thinking-preservation format, and static request parameters. `ModelConfig` and provider methods select limits/capabilities; streaming carries complete tool calls while text/reasoning can be incremental. {C-011 FACT MEDIUM; S-010}
- **Routing/fallback:** the common trait selects one provider instance per call; fast-model helpers may fall back to the main model for bounded helper completions, but this is not evidence of cross-provider failover for the main turn. {C-011 FACT MEDIUM; S-010}
- **Evidence:** S-010.
- **Boundary/scope:** static model/provider contract and canonical catalog path.
- **Unknowns:** live model inventory accuracy, structured-output compatibility, context-limit disagreement, capability negotiation, and failure routing remain C-036. {C-036 UNKNOWN N/A; S-010,S-017}

## 11. Context interface {#context-interface}

- **Status:** `PARTIAL`.
- **Claims:** `{C-012 FACT MEDIUM; S-011,S-012}` `{C-034 UNKNOWN N/A; S-007,S-009,S-012,S-013,S-014,S-017}`
- **Finding:** The system prompt combines a rendered base/override, sorted extension descriptions, frontend instructions, mode/subagent/code-execution state, discovered hint files, and named prompt extras; control-tag-like Unicode is sanitized, but repository/extension text remains instruction-bearing model input. {C-012 FACT MEDIUM; S-011}
- **Compaction:** when provider-owned context is false and usage/estimated tokens exceed the configured threshold, Goose makes a summarization call, keeps original messages as user-visible but agent-invisible, appends an agent-only summary/continuation and selected latest user/turn context, replaces the persisted conversation, and records billable and retained-context usage. {C-012 FACT MEDIUM; S-007,S-011,S-012}
- **Provenance/contamination:** visibility metadata and hint/extension grouping preserve some source shape, but there is no typed authority/taint separation between trusted system policy and untrusted repository/tool prose. {C-012 FACT MEDIUM; S-011}
- **Evidence:** S-007, S-011, S-012.
- **Boundary/scope:** default prompt and Goose-managed context; provider-managed-context implementations can differ.
- **Unknowns:** summary fidelity, injection resistance, oversized context behavior, and provider-visible ordering were not dynamically challenged. {C-034 UNKNOWN N/A; S-007,S-011,S-012}

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** `PARTIAL`.
- **Claims:** `{C-013 FACT MEDIUM; S-012}` `{C-034 UNKNOWN N/A; S-007,S-009,S-012,S-013,S-014,S-017}`
- **Finding:** Goose stores sessions in `sessions/sessions.db` with schema version 16. SQLite uses foreign keys, WAL, a 30-second busy timeout, lazy initialization, and `BEGIN IMMEDIATE` for schema creation, migration, and traced writes. Sessions persist cwd, type, parent, mode, extensions, recipe/provider/model, messages, usage totals, accumulated cost, and a per-call usage ledger including compaction and cost source. {C-013 FACT MEDIUM; S-012}
- **Compaction retention:** conversation replacement persists agent-invisible originals alongside the agent-visible summary rather than deleting the original records from the replacement projection. This improves transcript inspection but is not an immutable audit log. {C-013 FACT MEDIUM; S-007,S-011,S-012}
- **Restart/migration:** schema creation is serialized across processes; migrations advance version-by-version in one immediate transaction; legacy import failures are warned and can be partial. {C-013 FACT MEDIUM; S-012}
- **Evidence:** S-012.
- **Boundary/scope:** SQLite session store at schema 16, not arbitrary extension/provider state.
- **Unknowns:** torn writes, disk-full, corruption, process-kill points, migration downgrade, retention/deletion audit, and destructive recovery were not run. {C-034 UNKNOWN N/A; S-012}

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** `PARTIAL`.
- **Claims:** `{C-014 FACT MEDIUM; S-012,S-013}` `{C-034 UNKNOWN N/A; S-007,S-009,S-012,S-013,S-014,S-017}`
- **Finding:** Agent/provider/extension work uses Tokio tasks, channels, locks, and cancellation tokens; SQLite serializes traced writers with immediate transactions. Summon permits five background tasks by default, stores completed in-memory results for ten minutes, and creates a separate persistent child session per task. {C-014 FACT MEDIUM; S-012,S-013}
- **Isolation key:** child sessions have unique IDs and parent linkage; requested child working directories are canonicalized and must stay under the parent's canonical directory. Children inherit the parent workspace and do not receive automatic Git worktrees. The built-in prompt warns that same-file delegate work conflicts. {C-014 FACT MEDIUM; S-013}
- **Collision/cleanup:** nested delegation is blocked, but task-count checking and insertion are separate lock acquisitions, and external file/process side effects are outside the session database transaction. {C-014 FACT MEDIUM; S-013}
- **Evidence:** S-012, S-013.
- **Boundary/scope:** one Goose process/session database and built-in Summon; no tenant-security claim.
- **Unknowns:** simultaneous task-limit races, same-file edits, two-process/session collisions, deterministic ordering, task recovery after process restart, and cleanup are unobserved. {C-034 UNKNOWN N/A; S-012,S-013}

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** `OBSERVED` statically for policy/enforcement shape; containment is unverified.
- **Claims:** `{C-015 FACT MEDIUM; S-008,S-009,S-020}` `{C-035 UNKNOWN N/A; S-009}` `{C-034 UNKNOWN N/A; S-007,S-009,S-012,S-013,S-014,S-017}`
- **Finding:** `GooseMode::default()` is `Auto`, which approves all tool requests. Qualified user rules persist as always/ask/never in `permission.yaml`; malformed YAML panics rather than silently resetting. `Approve`, `SmartApprove`, and `Chat` provide narrower postures, but policy is enforced in the agent inspector/router, not by an OS sandbox. {C-015 FACT MEDIUM; S-009}

| Actor → action | Default authority / enforcement point | Audit/failure |
| --- | --- | --- |
| operator → mode/config/extensions | config/CLI/Desktop choices | config/session records; corrupt permission file refuses startup |
| model → tool | `Auto` allows; other modes inspect and may ask/deny | inspection result, confirmation event, tool response |
| SmartApprove → allow | explicit rule, extension read-only annotation, or classifier | unknown/failure returns to approval; annotation/classifier trust remains C-035 |
| extension → host/process/network | extension transport plus invoking user/container/remote server authority | MCP errors/notifications; no general least-privilege capability wrapper |
| `--container` → built-in/stdio startup | `docker exec -i` only | Docker daemon/container boundary external to Goose; not whole-agent containment |
| subagent → tools/workspace | `Auto`, inherited/filtered tools, cwd under parent | durable child session; no automatic worktree |
| ACP client → agent | optional token + origin checks on full serve router | bare `create_acp_router` intentionally has no token auth |

- **Security guidance:** upstream recommends an externally limited VM/container and human confirmation for significant systems, confirming that full containment is an operator/deployment responsibility. {C-015 FACT MEDIUM; S-020}
- **Evidence:** S-008, S-009, S-020.
- **Boundary/scope:** default local CLI/Desktop/Summon and built-in router; external OS/container policy excluded.
- **Unknowns:** final-sink bypass, annotation honesty, classifier quality, filesystem escape, credentials/network access, and actual container isolation remain unverified. {C-035 UNKNOWN N/A; S-009} {C-034 UNKNOWN N/A; S-008,S-009,S-020}

## 15. Evidence and observability {#evidence-observability}

- **Status:** `PARTIAL`.
- **Claims:** `{C-017 FACT MEDIUM; S-012,S-016}` `{C-039 UNKNOWN N/A; S-012,S-016}`
- **Finding:** Agent streams messages, usage, history replacement, MCP notifications, tool confirmations, and tracing spans with session/tool/message IDs. SQLite persists messages, modes/configuration, usage totals, cost source, and a usage ledger. OTLP GenAI fields include model, request parameters, finish reasons, response ID, and token/cache usage; content/tool arguments/results are captured only when `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true`. {C-017 FACT MEDIUM; S-012,S-016}
- **Telemetry:** backend PostHog is explicit opt-in and currently sends the ordinary `session_started` event with installation/session/platform/provider/model/extension/database aggregates; error and custom-command emission paths return early. Desktop analytics functions are intentional no-ops during ACP migration. {C-017 FACT MEDIUM; S-016}
- **Ownership/tamper:** session evidence is ordinary user-writable SQLite and logs/traces are deployment-owned; no signature or append-only external receipt was found in these paths. This limits evidentiary strength against the invoking user or in-process code. {C-017 FACT MEDIUM; S-012,S-016}
- **Evidence:** S-012, S-016.
- **Boundary/scope:** built-in session, tracing, backend telemetry, and Desktop analytics paths.
- **Unknowns:** runtime event loss/duplication, redaction completeness, collector durability, forged IDs/fields, child-usage surfacing, and cancellation evidence remain C-039. {C-039 UNKNOWN N/A; S-012,S-016}

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** `PARTIAL`.
- **Claims:** `{C-018 FACT MEDIUM; S-010,S-012}` `{C-037 UNKNOWN N/A; S-010,S-012}`
- **Finding:** `ProviderUsage` distinguishes provider-reported and estimated cost, records input/output/total and cache-read/cache-write token subsets, model, response ID, finish reasons, and provider stats. When cost is absent, canonical model rates may estimate it. Each call can be inserted into `usage_ledger`; session totals include descendants in the traced aggregate query. {C-018 FACT MEDIUM; S-010,S-012}
- **Limits:** provider retries/timeouts, extension timeouts, main/subagent turn limits, task concurrency, and compaction thresholds bound selected paths. No common CPU, memory, disk, process, network, monetary hard-budget, or provider-billing reconciliation enforcement was established. {C-018 FACT MEDIUM; S-007,S-008,S-010,S-013}
- **Child visibility:** child usage is persisted, but `subagent_handler` discards usage events from its immediate result stream; database totals and parent-facing live events therefore have different observability scopes. {C-018 FACT MEDIUM; S-012,S-013}
- **Evidence:** S-010, S-012, S-013.
- **Boundary/scope:** static provider/session accounting, not billing accuracy.
- **Unknowns:** physical retry/cache attribution, missing or contradictory provider usage, estimates versus invoices, resource exhaustion, and budget behavior remain C-037. {C-037 UNKNOWN N/A; S-010,S-012}

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** `PARTIAL`.
- **Claims:** `{C-019 FACT MEDIUM; S-010,S-013,S-017}` `{C-034 UNKNOWN N/A; S-007,S-009,S-012,S-013,S-014,S-017}` `{C-036 UNKNOWN N/A; S-010,S-017}`
- **Finding:** Provider errors are typed; shared retries use bounded backoff and preserve the terminal error. MCP request timeout/cancellation sends a cancellation notification and returns typed timeout/cancelled errors. Tool denial becomes a stable model-visible result. Subagent cancellation is cooperative for five seconds, then aborts the task. {C-019 FACT MEDIUM; S-009,S-010,S-013,S-017}
- **Direction:** caller/parent token → agent → MCP/tool/subagent; server notifications and stream errors return toward the caller. SQLite transactions cover individual persistence operations, not external tool effects. {C-019 FACT MEDIUM; S-012,S-017}
- **Retry/idempotency:** retry ownership is split among provider transport, recipe retry, ACP reconnect, and operator retry. The shared provider retry does not supply an end-to-end idempotency or deduplication key. {C-019 FACT MEDIUM; S-010,S-017}
- **Evidence:** S-009, S-010, S-012, S-013, S-017.
- **Boundary/scope:** common provider/MCP/subagent paths; custom transports and tools can differ.
- **Unknowns:** partial writes, duplicate non-idempotent effects, descendant cleanup, late responses, crash consistency, and live provider failures remain C-034/C-036. {C-034 UNKNOWN N/A; S-012,S-013,S-017} {C-036 UNKNOWN N/A; S-010,S-017}

## 18. Install, update, and release {#install-update-release}

- **Status:** `PARTIAL`.
- **Claims:** `{C-020 FACT MEDIUM; S-018,S-022}` `{C-038 UNKNOWN N/A; S-001,S-018,S-022,S-023}`
- **Finding:** The release workflow uses commit-pinned actions, platform CLI/Desktop builds, signing gates, source archives, OIDC build-provenance attestations, and versioned plus mutable `stable` releases. The CLI updater downloads an exact platform asset from `stable`/`canary`, computes SHA-256, fails closed unless a Sigstore bundle verifies the artifact digest, GitHub issuer, and expected workflow, then uses hardened extraction. {C-020 FACT MEDIUM; S-018,S-022}
- **Replacement/rollback:** update replacement renames the prior executable, restores it if copying the new binary fails, and rejects absolute/parent traversal plus escaping link targets. After successful copy it removes the backup; no post-install health check or automatic rollback on launch failure appears in the traced updater. {C-020 FACT MEDIUM; S-018}
- **Current release:** `v1.47.0` is the cutoff release, but the release-tag/snapshot and npm-provenance/snapshot mismatches prevent claiming complete artifact-to-source identity. {C-002 FACT HIGH; S-001,S-022,S-023}
- **Evidence:** S-001, S-018, S-022, S-023.
- **Boundary/scope:** static workflow/updater and passive release/package metadata; no installer/updater was executed.
- **Unknowns:** signature-chain execution, reproducible rebuild, all assets, migration compatibility, failed update under fault injection, post-install health rollback, and release-byte identity remain C-038. {C-038 UNKNOWN N/A; S-001,S-018,S-022,S-023}

## 19. Tests and qualification {#tests-qualification}

- **Status:** `PARTIAL`.
- **Claims:** `{C-021 FACT HIGH; S-019}` `{C-041 UNKNOWN N/A; S-019}`
- **Finding:** CI statically defines Rust formatting, workspace tests plus serialized scenario tests, Rustls/native-TLS matrices, UniFFI checks, Windows builds, MSRV checks, Clippy, generated ACP/SDK schema checks, Desktop lint/typecheck/Vitest, and commit-pinned checkout/setup actions. Release builds are separate reusable workflows. {C-021 FACT HIGH; S-019}
- **Qualification limit:** this dossier did not install dependencies or run target tests. Workflow and test presence establish intended gates only; they do not prove this commit passed, nor qualify provider integrations, updater behavior, sandboxing, crashes, races, or adversarial inputs. {C-041 UNKNOWN N/A; S-019}
- **Evidence:** S-019.
- **Boundary/scope:** checked-in CI at the pinned commit, not historical run results.
- **Unknowns:** exact pass/fail, flaky/quarantined tests, coverage, and environment equivalence remain C-041. {C-041 UNKNOWN N/A; S-019}

## 20. Security {#security}

- **Status:** `PARTIAL`; this is boundary research, not security acceptance.
- **Claims:** `{C-015 FACT MEDIUM; S-008,S-009,S-020}` `{C-016 FACT MEDIUM; S-014,S-015}` `{C-022 FACT HIGH; S-002,S-020,S-021,S-022}` `{C-035 UNKNOWN N/A; S-009}` `{C-038 UNKNOWN N/A; S-001,S-018,S-022,S-023}` `{C-042 UNKNOWN N/A; S-024}`
- **Local/API controls:** full `goose serve` optionally applies constant-time header/query token comparison to `/acp`; default tokened local policy permits loopback plus `file://`/opaque origins, and custom origins can be exact. `/health` and `/status` are unauthenticated; the MCP-app proxy uses the secret. Bare `create_acp_router` is intentionally unauthenticated. Desktop binds `127.0.0.1`, propagates the secret, can pin an emitted TLS fingerprint, times initialization out after ten seconds, and generation-fences full-jitter reconnection. {C-016 FACT MEDIUM; S-014,S-015}
- **Host/tool controls:** permission rules, read-only annotations/classifier, environment-key filtering, extension malware checks, canonical child cwd containment, update provenance, and extraction checks reduce named risks but do not create general least privilege or whole-agent containment. {C-015 FACT MEDIUM; S-008,S-009,S-018,S-020}
- **Advisory evidence:** official `GHSA-r5pp-p5r8-466r` / `CVE-2026-72718` records high-severity arbitrary command execution before model contact through attacker-controlled `git core.fsmonitor` in `goose review`, affecting versions `<1.44.0` and fixed in 1.44.0. The cutoff 1.47.0 is outside that affected range. This demonstrates that non-model subprocess paths belong in the threat boundary. {C-022 FACT HIGH; S-002,S-021,S-022}
- **Threat guidance:** upstream explicitly warns about code execution, prompt injection, internet/untrusted data, secrets, and unreviewed MCP extensions and recommends external containment and human confirmation. {C-022 FACT HIGH; S-020}
- **Evidence:** S-001, S-002, S-008, S-009, S-014, S-015, S-018, S-020–S-024.
- **Boundary/scope:** static current source plus official advisory/release metadata; no penetration test.
- **Unknowns:** runtime CORS/TLS/token behavior, classifier/annotation integrity, sandbox escape, supply-chain closure, and Dependabot alert state remain unresolved. {C-035 UNKNOWN N/A; S-009} {C-038 UNKNOWN N/A; S-018,S-022,S-023} {C-042 UNKNOWN N/A; S-024}

## 21. Strengths {#strengths}

- **Status:** `OBSERVED` as research interpretations, not adoption recommendations.
- **Claims:** `{C-023 INFERENCE MEDIUM; S-009,S-012}` `{C-024 INFERENCE MEDIUM; S-010,S-011,S-012}` `{C-025 INFERENCE MEDIUM; S-014,S-015,S-018,S-022}`

1. **Explicit, durable approval vocabulary:** qualified always/ask/never rules, refusal to start with corrupt permission YAML, typed confirmation, and model-visible denial create inspectable control points when a non-`Auto` mode is selected. Runtime bypass remains unqualified. {C-023 INFERENCE MEDIUM; S-009,S-012}
2. **Transactional conversation/accounting projection:** WAL, foreign keys, immediate writer transactions, versioned migrations, per-call usage, and retained agent-invisible originals make session state more inspectable than a transient message array. It is still user-mutable operational state, not tamper-proof evidence. {C-024 INFERENCE MEDIUM; S-010,S-011,S-012}
3. **Layered local transport and release controls:** loopback binding, token/origin checks, optional fingerprint pinning, generation fencing, pinned actions, OIDC provenance, and hardened extraction expose multiple reviewable failure points. End-to-end runtime/release identity remains incomplete. {C-025 INFERENCE MEDIUM; S-014,S-015,S-018,S-022}

- **Evidence:** S-009–S-012, S-014, S-015, S-018, S-022.
- **Boundary/scope:** inspectability and control structure at the pinned source, not reliability/security certification.
- **Unknowns:** operational effectiveness is bounded by C-034–C-041.

## 22. Liabilities {#liabilities}

- **Status:** `OBSERVED` as evidence-backed interpretations.
- **Claims:** `{C-026 INFERENCE MEDIUM; S-009,S-011}` `{C-027 INFERENCE MEDIUM; S-008,S-020,S-021}` `{C-028 INFERENCE MEDIUM; S-001,S-018,S-019,S-022,S-023}`

| Liability | Trigger → consequence | Affected boundary / mitigation |
| --- | --- | --- |
| Permissive default and inferred trust | default `Auto`, or SmartApprove trusting a read-only annotation/classifier → consequential tool calls can proceed without per-action human confirmation | tool/authority; select Approve/Chat, explicit never/ask rules, and external containment {C-026 INFERENCE MEDIUM; S-009,S-011} |
| Extension/container ambiguity | loading platform/inline/stdio extensions or treating `--container` as whole-agent isolation → host/process/network authority exceeds the apparent boundary | extension/security; review extensions and contain the entire Goose deployment externally {C-027 INFERENCE MEDIUM; S-008,S-020,S-021} |
| Qualification and identity debt | relying on static CI/release policy while snapshot, release tag, and npm provenance differ → runtime and artifact claims can be attributed to the wrong bytes | release/operations; require exact asset attestations, source mapping, rebuild/runtime qualification {C-028 INFERENCE MEDIUM; S-001,S-018,S-019,S-022,S-023} |

- **Evidence:** S-001, S-008, S-009, S-011, S-018–S-023.
- **Boundary/scope:** comparison constraints for a policy-authoritative harness; not a general quality judgment.
- **Unknowns:** downstream fit and acceptable risk require separately authorized synthesis.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** `OBSERVED` as preliminary dispositions only.
- **Claims:** `{C-029 INFERENCE MEDIUM; S-009,S-012}` `{C-030 INFERENCE MEDIUM; S-010,S-011,S-012}` `{C-031 INFERENCE MEDIUM; S-014,S-015}`

| Pattern | Minimal mechanism / problem solved | Prerequisites and preserved boundary | Cost/risk | Disposition |
| --- | --- | --- | --- | --- |
| Final-sink qualified permissions with fail-closed config | persist qualified always/ask/never rules; inspect immediately before dispatch; reject corrupt policy | default must be non-permissive; annotations/classifier cannot be sole authority; OS sandbox remains separate | medium; requires bypass, race, and receipt qualification | `CONDITIONAL` {C-029 INFERENCE MEDIUM; S-009,S-012} |
| Versioned transactional transcript plus usage ledger | WAL/foreign keys/immediate writers; immutable message identities/visibility; per-call usage/cost-source rows | transcript is a projection, not canonical domain authority; add integrity/retention policy | medium/high; migrations and crash recovery need fault testing | `CONDITIONAL` {C-030 INFERENCE MEDIUM; S-010,S-011,S-012} |
| Generation-fenced local child transport | loopback child, explicit secret, readiness/initialize timeout, optional cert fingerprint, full-jitter reconnect fenced by generation | unauthenticated health scope must be intentional; secret lifecycle and process ownership explicit | medium; platform lifecycle and live CORS/TLS tests required | `CANDIDATE` {C-031 INFERENCE MEDIUM; S-014,S-015} |

- **Evidence:** S-009–S-012, S-014, S-015.
- **Boundary/scope:** clean-room research input; no code copying, adoption, or design approval.
- **Unknowns:** adaptation fit must be decided against accepted Curiosity ADRs by an authorized synthesis owner.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** `OBSERVED` as bounded research rejection.
- **Claims:** `{C-032 INFERENCE MEDIUM; S-008,S-020}` `{C-033 INFERENCE HIGH; S-018,S-020,S-021}` `{C-038 UNKNOWN N/A; S-001,S-018,S-022,S-023}`

| Pattern/thread | Exact `CURIOSITY_NO_GO` rationale | Violated boundary / failure mode | Reopen condition |
| --- | --- | --- | --- |
| In-process/platform extension or `--container` as a sandbox | `CURIOSITY_NO_GO`: platform code stays in-process and `--container` rewrites only built-in/stdio startup; convenience is not whole-agent confinement | untrusted code joins the TCB or ambient agent/provider/updater authority remains outside container | reviewed external process/capability boundary plus runtime containment evidence {C-032 INFERENCE MEDIUM; S-008,S-020} |
| Runtime exploitation, container escape, malicious updater execution, destructive recovery | `CURIOSITY_NO_GO`: unsafe and outside research authority; static UNKNOWN is the contract-compliant result | host compromise, fetched-code execution, destructive state, unauthorized security testing | explicit authorization and disposable least-privilege lab with no secrets/host mounts/network except the tested boundary {C-033 INFERENCE HIGH; S-018,S-020,S-021} |
| Broad ecosystem/history archaeology or post-cutoff behavior | `CURIOSITY_NO_GO`: low decision relevance and breaks immutable snapshot comparability | budget dilution and mutable evidence | separately assigned newer snapshot or a specific legal/provenance discriminator {C-033 INFERENCE HIGH; S-001,S-004} |
| SmartApprove classifier benchmark | `CURIOSITY_NO_GO`: requires an authorized dataset, threat model, provider calls, and statistical protocol; source inspection cannot establish accuracy | misleading security score and provider/data exposure | separate evaluation authority, fixed corpus, controls, and acceptance criteria {C-033 INFERENCE HIGH; S-009,S-020} |
| Exhaustive release-asset execution/rebuild in this dossier | `CURIOSITY_NO_GO`: high cost and unsafe install/update execution exceed the remaining depth budget; preserve identity as UNKNOWN | false artifact equivalence or host mutation | isolated release-verification assignment with all assets, attestations, toolchains, and rebuild criteria {C-038 UNKNOWN N/A; S-001,S-018,S-022,S-023} |

- **Evidence:** S-001, S-004, S-008, S-009, S-018, S-020–S-023.
- **Boundary/scope:** research methods and pattern claims at the cutoff, not rejection of Goose as a project.
- **Unknowns:** rejected curiosity threads are not evidence that no additional findings exist.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** `PARTIAL`; static challenges were bounded and unsafe dynamic probes remain explicit.
- **Claims:** `{C-015 FACT MEDIUM; S-008,S-009,S-020}` `{C-034 UNKNOWN N/A; S-007,S-009,S-012,S-013,S-014,S-017}` `{C-035 UNKNOWN N/A; S-009}` `{C-036 UNKNOWN N/A; S-010,S-017}` `{C-037 UNKNOWN N/A; S-010,S-012}` `{C-038 UNKNOWN N/A; S-001,S-018,S-022,S-023}` `{C-039 UNKNOWN N/A; S-012,S-016}` `{C-040 UNKNOWN N/A; S-008}` `{C-041 UNKNOWN N/A; S-019}`

| Probe | Expected safe behavior defined before challenge | Actual bounded result | Result | Environment | Claims | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 Startup/no-op side effects | denied writes/network startup has no undeclared effects and reports required access | entrypoints/config/telemetry paths traced; no denied runtime with empty HOME/network namespace | `NOT_RUN_UNSAFE` | static source; no qualified sandbox | C-034,C-039 | S-006,S-007,S-012,S-016 |
| P-02 Permission denial/approval bypass | every consequential path reaches final deny/approval and alternate transports cannot bypass | inspector/router and persistence traced; Auto/platform/frontend/subagent alternatives identified; no action invoked | `NOT_RUN_UNSAFE` | static source only | C-015,C-034,C-035 | S-008,S-009,S-013 |
| P-03 Malformed/oversized input | wrong/missing/extra/oversized schema data fails before side effects with stable diagnostics | typed/MCP parsing and corrupt permission fail-closed paths found; size and alternate boundaries not challenged | `INCONCLUSIVE` | static source only | C-009,C-034,C-040 | S-008,S-009,S-017 |
| P-04 Cancellation/timeout | cancellation before dispatch/during stream/effect stops descendants, fences late output, and preserves consistent state | MCP cancel notification and five-second subagent abort traced; cleanup/rollback not observed | `INCONCLUSIVE` | static source only | C-019,C-034 | S-013,S-017 |
| P-05 Retry/duplication/partial failure | bounded retries expose every send/cost and never duplicate non-idempotent effects | retry owner/backoff traced; no idempotency receipt or induced partial failure | `INCONCLUSIVE` | static source only | C-019,C-036,C-037 | S-010,S-017 |
| P-06 Concurrency/isolation collision | colliding sessions/tasks/workspaces are fenced, ordered, and cleaned without bleed | SQLite writer serialization and child IDs/cwd containment traced; same-file/task-limit/two-process collision not run | `NOT_RUN_UNSAFE` | no disposable multi-process lab | C-014,C-034 | S-012,S-013 |
| P-07 Crash/restart | interruption at each transition recovers without silent corruption/replay/loss | WAL/immediate migrations inspected; no process kill or disk fault injected | `NOT_RUN_UNSAFE` | destructive fault injection excluded | C-013,C-034 | S-012 |
| P-08 Provider/model/network unavailable | DNS/auth/429/malformed/interrupted responses preserve cause, bound retry, expose sends, and avoid silent switching | typed errors/backoff inspected; no provider mock, credentials, or network request | `NOT_RUN_UNSAFE` | provider/network execution denied | C-010,C-036 | S-010,S-017 |
| P-09 Untrusted instruction injection | repository/tool/provider text stays data and cannot increase authority | hints/extensions enter system instructions and security guidance acknowledges prompt injection; no exploit attempted | `NOT_RUN_UNSAFE` | exact sink sandbox unavailable | C-012,C-034,C-035 | S-011,S-020 |
| P-10 Filesystem boundary abuse | traversal/absolute/symlink/case paths stay within authorized root at every sink | child cwd and archive extraction canonicalization traced; general tools/extensions and symlink races not exercised | `NOT_RUN_UNSAFE` | no qualified filesystem sandbox | C-015,C-034,C-038 | S-008,S-013,S-018 |
| P-11 Resource/token/cost disagreement | estimates, retries/cache, provider totals, and invoices reconcile; exhaustion fails closed | usage/cost-source ledger traced; no billing comparison or budget exhaustion | `INCONCLUSIVE` | static source only | C-018,C-037 | S-010,S-012 |
| P-12 Install/update pin/rollback | exact assets map to source; unverifiable/failed/post-health update restores prior version | source enforces Sigstore and copy-failure restore, but snapshot/tag/package mismatch remains; updater/rebuild not run | `INCONCLUSIVE` | passive metadata/package plus static source | C-002,C-020,C-038 | S-001,S-018,S-022,S-023 |
| P-13 Claimed absence/disabled feature | `--container` reaches only built-in/stdio extension startup and cannot be mistaken for whole-agent sandboxing | CLI flag, enum dispatch, and both `docker exec -i` branches traced; other extension/agent/provider/updater branches remain outside | `PASS` | bounded static universe: CLI session, extension enum/manager, agent container field | C-007,C-015 | S-008 |
| P-14 Evidence loss/forgery | denied/failed/cancelled actions remain correlated, redacted, durable, and non-spoofable | event/session/trace schemas inspected; child usage drop and user-writable evidence found; no spoof/drop runtime | `NOT_RUN_UNSAFE` | no dynamic sink/tool sandbox | C-017,C-039 | S-012,S-016 |

- **Evidence:** S-001, S-006–S-020, S-022, S-023.
- **Boundary/scope:** no dynamic exploitation; `PASS` means only the explicit bounded P-13 source expectation matched.
- **Unknowns:** C-034–C-041 remain open; skipped probes are not passes.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "The canonical AAIF Goose repository was inspected as a clean detached, submodule-free checkout at f9ac24cbfc3ba28dc0844495fa0605229e4b4144, whose workspace and Desktop versions are 1.47.0 and whose TypeScript SDK manifest is 0.20.2."
  classification: FACT
  confidence: HIGH
  scope: "AAIF Goose repository snapshot; static macOS 27.0 arm64 checkout; excludes release-byte equivalence and runtime portability"
  source_ids: [S-001, S-002, S-005, S-006]
  fact_dependencies: []
  method: "Compared canonical remote, full HEAD, exact-tag result, status, submodule state, workspace/package manifests, and checked-in entrypoints."
  counterevidence: "no exact tag names the inspected commit; release and npm identities are separately qualified by C-002/C-038"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "Cutoff release v1.47.0 and npm package @aaif/goose-sdk@0.20.2 are official records, but their source commits differ from the inspected repository snapshot."
  classification: FACT
  confidence: HIGH
  scope: "GitHub release 374587883, exact npm version/tarball/provenance, and inspected snapshot ancestry; no malicious-artifact inference"
  source_ids: [S-001, S-022, S-023]
  fact_dependencies: []
  method: "Compared release tag commit ancestry and npm provenance source commit against the inspected full SHA, and rehashed the exact npm tarball."
  counterevidence: "all three records carry compatible version labels, but version-label agreement does not erase commit-identity disagreement"
  adversarial_status: CHALLENGED
- claim_id: C-003
  section: provenance-license
  statement: "The pinned workspace and official governance identify Apache-2.0 code/specification licensing under AAIF/LF Projects stewardship, with CC BY 4.0 as the default for non-specification documentation."
  classification: FACT
  confidence: HIGH
  scope: "repository metadata, LICENSE, and GOVERNANCE.md at the inspected commit; excludes legal advice and dependency aggregation"
  source_ids: [S-002, S-003, S-004]
  fact_dependencies: []
  method: "Read workspace metadata, controlling license text, and governance/licensing policy as separate primary records."
  counterevidence: "none found in the three bounded first-party records"
  adversarial_status: SUPPORTED
- claim_id: C-004
  section: repository-package-map
  statement: "The pinned workspace separates core agent, CLI, provider, context, MCP, SDK/protocol, local-inference, Desktop, generated SDK, evaluation, example, test, and vendored responsibilities into identifiable nodes."
  classification: FACT
  confidence: HIGH
  scope: "checked-in workspace and package tree at f9ac24cbfc3ba28dc0844495fa0605229e4b4144; presence is not default reachability"
  source_ids: [S-002, S-005]
  fact_dependencies: []
  method: "Enumerated workspace members and package manifests, then classified production, generated, test, example, and vendored nodes."
  counterevidence: "wildcard membership and optional features do not establish every node's runtime reachability"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: executable-entrypoints
  statement: "Checked-in Goose entrypoints include the Tokio CLI, Electron Desktop, loopback goose serve child, ACP HTTP/WebSocket server, Rust and TypeScript SDKs, MCP server, and CLI updater."
  classification: FACT
  confidence: HIGH
  scope: "static entrypoint and package surfaces at the inspected commit; installers and binaries were not executed"
  source_ids: [S-006, S-015]
  fact_dependencies: []
  method: "Matched binary/package declarations to CLI main/cli, Desktop main/gooseServe, ACP, SDK, MCP, and updater composition paths."
  counterevidence: "startup side effects and every optional entrypoint remain dynamically unqualified"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: control-data-flow
  statement: "The representative static turn path persists and contextualizes a message, selects standard reply by default or the experimental state machine by environment/bang-shell trigger, streams one provider, inspects and dispatches tools, persists result/usage, and loops."
  classification: FACT
  confidence: MEDIUM
  scope: "core Agent standard/state-machine paths and common tool/provider/session contracts; custom implementations can differ"
  source_ids: [S-007, S-009, S-010, S-012]
  fact_dependencies: []
  method: "Traced Agent::reply through dispatch, persistence, provider stream, inspection, tool result, accounting, and return events."
  counterevidence: "no runtime trace established ordering under malformed streams, cancellation, or duplicate effects"
  adversarial_status: CHALLENGED
- claim_id: C-007
  section: module-extension-boundaries
  statement: "ExtensionConfig and ExtensionManager support SSE compatibility, stdio, bundled, in-process platform, streamable HTTP/UDS/OAuth, frontend, and inline-Python forms, while --container rewrites only bundled and stdio startup through docker exec -i."
  classification: FACT
  confidence: MEDIUM
  scope: "built-in extension enum/manager and CLI container field; third-party behavior and runtime containment excluded"
  source_ids: [S-008]
  fact_dependencies: []
  method: "Enumerated ExtensionConfig variants and traced each manager branch, including both docker-exec rewrite sites."
  counterevidence: "platform, HTTP, frontend, inline-Python, agent, provider, Desktop, and updater paths remain outside this rewrite"
  adversarial_status: CHALLENGED
- claim_id: C-008
  section: agent-interface
  statement: "Agent owns the reply lifecycle, while Summon creates durable Auto-mode SubAgent sessions with parent links, inherited provider/model and filtered tools, a 25-turn default, blocked nesting, parent-contained cwd, and five background tasks by default."
  classification: FACT
  confidence: MEDIUM
  scope: "core Agent and built-in Summon at the inspected commit; arbitrary external-agent tools excluded"
  source_ids: [S-007, S-013]
  fact_dependencies: []
  method: "Inspected Agent state/reply and Summon TaskConfig, session creation, tool filtering, cwd validation, limits, cancellation, and stream handling."
  counterevidence: "children share the parent workspace without automatic worktrees, and child usage is not forwarded in the immediate result stream"
  adversarial_status: CHALLENGED
- claim_id: C-009
  section: tool-interface
  statement: "MCP-shaped tool requests are qualified and inspected before dispatch; Auto allows, Approve asks absent explicit rules, SmartApprove prioritizes explicit rules then annotation/classifier logic, Chat skips execution, and user decisions persist in permission.yaml."
  classification: FACT
  confidence: MEDIUM
  scope: "core inspector/confirmation and MCP/frontend dispatch paths; runtime bypass and classifier accuracy excluded"
  source_ids: [S-008, S-009, S-017]
  fact_dependencies: []
  method: "Traced tool schema/request/result types through permission inspection, confirmation, persistence, dispatch, timeout, cancellation, and error mapping."
  counterevidence: "read-only annotations and classifier output are trust inputs rather than independently verified capabilities"
  adversarial_status: CHALLENGED
- claim_id: C-010
  section: provider-interface
  statement: "The common Provider contract owns identity, streaming, completion, model/context discovery, refresh, retry policy, and usage, with a default of three retries and one-second exponential backoff capped at 30 seconds with plus-or-minus 20 percent jitter."
  classification: FACT
  confidence: MEDIUM
  scope: "shared provider types/retry and common reply wrapper; no live provider and not every concrete transport"
  source_ids: [S-010]
  fact_dependencies: []
  method: "Inspected Provider, MessageStream, RetryConfig, should_retry, retry-delay override, and ProviderUsage contracts."
  counterevidence: "providers may override retry configuration and own physical auth/transport behavior"
  adversarial_status: CHALLENGED
- claim_id: C-011
  section: model-interface
  statement: "ModelInfo and ModelConfig carry configured/resolved identity, context limits, cost/currency, cache, reasoning, thinking-preservation, request parameters, and streaming capability assumptions for one selected provider per main call."
  classification: FACT
  confidence: MEDIUM
  scope: "shared provider/model contracts and canonical catalog path; no live catalog or capability negotiation"
  source_ids: [S-010]
  fact_dependencies: []
  method: "Inspected model structs, catalog fallback, stream semantics, and main/fast-model selection helpers."
  counterevidence: "fast helper calls can fall back to the main model, but no common cross-provider failover was observed for the main turn"
  adversarial_status: CHALLENGED
- claim_id: C-012
  section: context-interface
  statement: "Goose builds system context from templates, sorted extension/frontend information, mode/subagent/code-execution state, hint files, and extras, and performs lossy summarization while preserving visibility-qualified original messages."
  classification: FACT
  confidence: MEDIUM
  scope: "default prompt manager, hints, Goose-managed context, and session projection; provider-managed context can differ"
  source_ids: [S-007, S-011, S-012]
  fact_dependencies: []
  method: "Traced prompt construction/sanitization, hint discovery, compaction threshold/call, visibility transforms, replacement, and usage persistence."
  counterevidence: "source grouping and Unicode-tag sanitization preserve shape but do not create typed instruction-authority separation"
  adversarial_status: CHALLENGED
- claim_id: C-013
  section: state-persistence-restart
  statement: "Goose session schema 16 uses SQLite foreign keys, WAL, a 30-second busy timeout, BEGIN IMMEDIATE writes/migrations, durable messages/configuration/usage, and retained agent-invisible originals after compaction."
  classification: FACT
  confidence: MEDIUM
  scope: "sessions/sessions.db and Goose-managed conversation/accounting state; extension/provider state excluded"
  source_ids: [S-007, S-011, S-012]
  fact_dependencies: []
  method: "Inspected database options, schema/migrations, update methods, conversation replacement, usage ledger, and compaction visibility."
  counterevidence: "legacy import can be partial and ordinary SQLite state is neither immutable nor dynamically crash-qualified"
  adversarial_status: CHALLENGED
- claim_id: C-014
  section: concurrency-worktree-isolation
  statement: "Goose combines Tokio tasks/channels/locks with serialized SQLite writers and durable child-session IDs, but built-in Summon shares the parent workspace and provides no automatic Git worktree."
  classification: FACT
  confidence: MEDIUM
  scope: "one Goose process/session database and built-in Summon; no tenant-security conclusion"
  source_ids: [S-012, S-013]
  fact_dependencies: []
  method: "Inspected task maps, locks, cancellation tokens, SQLite immediate transactions, child IDs/parent links, and cwd containment."
  counterevidence: "task-count check and insertion are separate lock acquisitions, and external side effects are outside database transactions"
  adversarial_status: CHALLENGED
- claim_id: C-015
  section: permissions-authority-sandbox
  statement: "GooseMode defaults to Auto, persisted qualified rules and narrower modes are enforced in the agent inspector/router, and neither those controls nor --container constitute a general OS sandbox."
  classification: FACT
  confidence: MEDIUM
  scope: "default local CLI/Desktop/Summon permissions and built-in extension container rewrite; external VM/container policy excluded"
  source_ids: [S-008, S-009, S-020]
  fact_dependencies: []
  method: "Compared mode defaults, permission persistence/inspection, extension launch branches, and first-party containment guidance."
  counterevidence: "Approve, SmartApprove, Chat, explicit never/ask rules, and external containment can narrow authority but do not contradict the default or enforcement location"
  adversarial_status: CHALLENGED
- claim_id: C-016
  section: security
  statement: "Full goose serve applies optional constant-time ACP token checks and loopback/file-origin policy while leaving health/status unauthenticated; Desktop uses a loopback child, propagated secret, readiness checks, optional TLS fingerprint pinning, timed initialization, and generation-fenced full-jitter reconnection."
  classification: FACT
  confidence: MEDIUM
  scope: "built-in full serve router and Desktop main/ACP lifecycle; bare create_acp_router intentionally excludes token auth"
  source_ids: [S-014, S-015]
  fact_dependencies: []
  method: "Traced auth/origin/router composition and Desktop child spawn, secret, readiness, certificate, initialization, close, and reconnect paths."
  counterevidence: "bare create_acp_router has no token layer, and live CORS/TLS/process behavior was not exercised"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: evidence-observability
  statement: "Goose emits correlated agent/tool/usage/history/tracing evidence, persists session and usage records, requires explicit backend PostHog opt-in, disables Desktop analytics, and gates OTLP message content on an environment variable."
  classification: FACT
  confidence: MEDIUM
  scope: "built-in session, tracing, backend telemetry, and Desktop analytics paths; collector behavior excluded"
  source_ids: [S-012, S-016]
  fact_dependencies: []
  method: "Inspected event types, SQLite fields, GenAI span attributes/content gate, backend opt-in/event returns, and Desktop no-op sender."
  counterevidence: "local evidence is user-writable and no built-in signature or append-only external receipt was found in these paths"
  adversarial_status: CHALLENGED
- claim_id: C-018
  section: resource-token-cost-accounting
  statement: "Goose records provider/estimated usage, token/cache subsets, model/response/finish metadata, cost source, per-call ledger rows, and descendant-inclusive totals, but immediate subagent result handling discards child usage events."
  classification: FACT
  confidence: MEDIUM
  scope: "common provider usage and session ledger/aggregate plus built-in subagent stream; no billing-reconciliation claim"
  source_ids: [S-010, S-012, S-013]
  fact_dependencies: []
  method: "Traced ProviderUsage, canonical cost fallback, ledger insertion/aggregation, compaction accounting, and subagent event matching."
  counterevidence: "no common CPU, memory, disk, process, network, monetary hard budget, or invoice oracle was established"
  adversarial_status: CHALLENGED
- claim_id: C-019
  section: failure-cancellation-retry
  statement: "Common paths preserve typed provider/tool errors, bounded provider retry, MCP timeout/cancel notifications, model-visible denial, and five-second cooperative subagent cancellation before task abort."
  classification: FACT
  confidence: MEDIUM
  scope: "common provider, MCP, permission, session, and Summon paths; custom tools/transports can differ"
  source_ids: [S-009, S-010, S-012, S-013, S-017]
  fact_dependencies: []
  method: "Traced error variants, retry terminal return, cancellation direction, timeout notification, denial conversion, task abort, and transaction scope."
  counterevidence: "no end-to-end idempotency key, physical-send receipt, or external-effect rollback guarantee was found"
  adversarial_status: CHALLENGED
- claim_id: C-020
  section: install-update-release
  statement: "Static release/update paths use pinned actions, signing gates, OIDC provenance, source archives, SHA-256/Sigstore verification, hardened extraction, and prior-binary restoration on copy failure, without a traced post-install health rollback."
  classification: FACT
  confidence: MEDIUM
  scope: "checked-in release/canary workflows and CLI updater; no workflow, installer, updater, or rebuilt artifact execution"
  source_ids: [S-018, S-022]
  fact_dependencies: []
  method: "Inspected immutable workflow references, signing/provenance jobs, mutable release channels, updater verification/extraction/replacement, and official cutoff release metadata."
  counterevidence: "snapshot/tag/npm commit mismatches prevent end-to-end artifact-to-source closure"
  adversarial_status: CHALLENGED
- claim_id: C-021
  section: tests-qualification
  statement: "Checked-in CI defines formatting, Rust/unit/scenario/TLS/UniFFI/Windows/MSRV/Clippy/schema/SDK/Desktop checks, but this dossier executed none of the target tests."
  classification: FACT
  confidence: HIGH
  scope: "CI workflow definitions at the inspected commit; no historical pass, coverage, or runtime-qualification claim"
  source_ids: [S-019]
  fact_dependencies: []
  method: "Enumerated CI jobs, matrices, pinned actions, and commands, distinguishing workflow presence from execution result."
  counterevidence: "workflow definitions do not establish that the inspected commit passed or that unlisted faults are covered"
  adversarial_status: CHALLENGED
- claim_id: C-022
  section: security
  statement: "Official guidance places code execution, prompt injection, untrusted data, secrets, and MCP extensions inside Goose's risk boundary, and official GHSA-r5pp-p5r8-466r records pre-model goose review command execution fixed in 1.44.0."
  classification: FACT
  confidence: HIGH
  scope: "first-party policy, official advisory, workspace version, and cutoff release; no claim that 1.47.0 is vulnerability-free"
  source_ids: [S-002, S-020, S-021, S-022]
  fact_dependencies: []
  method: "Compared security guidance with the official advisory affected/fixed ranges and the pinned/cutoff versions."
  counterevidence: "the cutoff 1.47.0 version is outside this advisory's affected range, but other advisory/dependency state is incomplete"
  adversarial_status: CHALLENGED
- claim_id: C-023
  section: strengths
  statement: "Qualified persistent rules, corrupt-policy refusal, confirmation events, and model-visible denial provide an inspectable approval vocabulary when operators select a non-Auto mode."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "non-Auto local operation and static enforcement path; not runtime bypass or security certification"
  source_ids: [S-009, S-012]
  fact_dependencies: [C-009, C-013, C-015]
  method: "reasoning=durable qualified rules plus fail-closed parsing and explicit confirmation/denial create reviewable policy points; assumptions=all consequential calls traverse the inspected router and a narrower mode is selected; alternative=alternate paths or races could bypass or weaken the control"
  counterevidence: "default Auto is permissive and dynamic final-sink bypass remains C-034"
  adversarial_status: CHALLENGED
- claim_id: C-024
  section: strengths
  statement: "Versioned transactional conversation and usage projections make Goose session state comparatively inspectable within its local operational scope."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Goose-managed transcript/accounting projection; excludes immutable audit, provider billing, and crash guarantees"
  source_ids: [S-010, S-011, S-012]
  fact_dependencies: [C-010, C-012, C-013, C-018]
  method: "reasoning=WAL, foreign keys, serialized writes, migrations, visibility, and per-call usage preserve derivation detail; assumptions=database remains readable and untampered; alternative=an external event ledger could offer stronger evidence"
  counterevidence: "C-034/C-037/C-039 limit crash, accounting, and tamper conclusions"
  adversarial_status: CHALLENGED
- claim_id: C-025
  section: strengths
  statement: "Layered loopback transport and release controls expose multiple independently reviewable failure points despite incomplete runtime and artifact identity."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "built-in Desktop/serve and checked-in release/updater paths; no end-to-end security acceptance"
  source_ids: [S-014, S-015, S-018, S-022]
  fact_dependencies: [C-016, C-020]
  method: "reasoning=loopback, secret, origin, fingerprint, generation, pinned action, provenance, and extraction checks are layered rather than singular; assumptions=each traced path is used as configured; alternative=runtime/configuration or artifact mismatch can nullify layers"
  counterevidence: "C-038 and live transport gaps prevent a high-confidence operational conclusion"
  adversarial_status: CHALLENGED
- claim_id: C-026
  section: liabilities
  statement: "Default Auto and SmartApprove's annotation/classifier trust can allow consequential tool calls without per-action human confirmation."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "default and SmartApprove modes at the inspected commit; explicit rules and external policy can narrow the condition"
  source_ids: [S-009, S-011]
  fact_dependencies: [C-009, C-012, C-015]
  method: "reasoning=permissive default or inferred read-only classification removes an action-time human gate while model context can contain untrusted prose; assumptions=the tool has consequential authority; alternative=Approve/Chat, explicit ask/never, or an external sink guard can prevent execution"
  counterevidence: "missing/failed SmartApprove classification returns to approval rather than allow"
  adversarial_status: CHALLENGED
- claim_id: C-027
  section: liabilities
  statement: "In-process/platform/inline/stdio extension authority and partial --container rewriting create a material risk of mistaking extension convenience for whole-agent isolation."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "untrusted or insufficiently reviewed extensions under a containment requirement"
  source_ids: [S-008, S-020, S-021]
  fact_dependencies: [C-007, C-015, C-022]
  method: "reasoning=code that remains in-process or ambient while only selected child startup is rewritten cannot be the whole-agent confinement boundary; assumptions=extension input may be untrusted; alternative=reviewed extensions can remain trusted TCB code inside externally contained Goose"
  counterevidence: "environment filtering and external containers can reduce risk but do not expand the --container mechanism's traced scope"
  adversarial_status: CHALLENGED
- claim_id: C-028
  section: liabilities
  statement: "Snapshot, release-tag, and npm-provenance disagreement creates qualification debt because static source and release controls can otherwise be attributed to the wrong bytes."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "inspected snapshot, v1.47.0 release, and @aaif/goose-sdk@0.20.2; no malicious-artifact inference"
  source_ids: [S-001, S-018, S-019, S-022, S-023]
  fact_dependencies: [C-002, C-020, C-021]
  method: "reasoning=control and CI claims are commit-bounded while distributed artifacts identify different source commits; assumptions=exact byte provenance matters to comparison; alternative=separate exact-source dossiers could qualify each artifact independently"
  counterevidence: "version labels agree, but labels are weaker than commit and digest identity"
  adversarial_status: CHALLENGED
- claim_id: C-029
  section: transferable-patterns
  statement: "Final-sink qualified permissions with fail-closed policy parsing are a CONDITIONAL pattern when the default is non-permissive and annotations/classifiers are not sole authority."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "clean-room research pattern; no adoption or implementation authority"
  source_ids: [S-009, S-012]
  fact_dependencies: [C-009, C-013, C-015]
  method: "reasoning=persistent explicit rules and immediate pre-dispatch checks can centralize authorization; assumptions=bypass/races are qualified and OS containment remains separate; alternative=capability handles or an external policy engine may better own the sink"
  counterevidence: "Goose defaults to Auto and runtime bypass remains unknown"
  adversarial_status: CHALLENGED
- claim_id: C-030
  section: transferable-patterns
  statement: "A versioned transactional transcript plus per-call usage ledger is a CONDITIONAL pattern when treated as a projection and strengthened with integrity, retention, and crash policy."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "clean-room transcript/accounting pattern; canonical domain facts and billing authority excluded"
  source_ids: [S-010, S-011, S-012]
  fact_dependencies: [C-010, C-012, C-013, C-018]
  method: "reasoning=serialized versioned persistence, visibility, and cost-source rows preserve useful derivation; assumptions=projection semantics are explicit and integrity/recovery are added; alternative=an event-sourced external ledger may subsume the mechanism"
  counterevidence: "current user-writable SQLite and untested crash/accounting behavior are insufficient for an authoritative receipt"
  adversarial_status: CHALLENGED
- claim_id: C-031
  section: transferable-patterns
  statement: "Generation-fenced local child transport is a CANDIDATE pattern when secret lifecycle, unauthenticated health scope, process ownership, and live TLS/CORS tests are explicit."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "clean-room local parent/child transport pattern; no design approval"
  source_ids: [S-014, S-015]
  fact_dependencies: [C-016]
  method: "reasoning=loopback child ownership, readiness/initialize bounds, optional certificate pin, and generation fencing address distinct stale/reconnect risks; assumptions=live platform behavior is qualified; alternative=an in-process protocol could avoid child lifecycle complexity"
  counterevidence: "runtime transport behavior and secret/process cleanup remain C-034"
  adversarial_status: CHALLENGED
- claim_id: C-032
  section: rejected-patterns-curiosity-no-go
  statement: "Using an in-process/platform extension or Goose --container as an untrusted whole-agent sandbox is CURIOSITY_NO_GO for this snapshot."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "untrusted extension scenario requiring whole-agent least authority"
  source_ids: [S-008, S-020]
  fact_dependencies: [C-007, C-015, C-022]
  method: "reasoning=in-process code joins the TCB and the flag rewrites only selected extension startup; assumptions=the extension is untrusted and ambient boundaries matter; alternative=reviewed code inside an independently qualified external sandbox remains viable"
  counterevidence: "the mechanism can isolate selected built-in/stdio child processes but not the whole enumerated harness"
  adversarial_status: CHALLENGED
- claim_id: C-033
  section: rejected-patterns-curiosity-no-go
  statement: "Unsafe runtime exploitation, classifier benchmarking without a protocol, broad archaeology, repeated inaccessible-alert retrieval, and post-cutoff behavior are CURIOSITY_NO_GO within this dossier's authority and depth budget."
  classification: INFERENCE
  confidence: HIGH
  scope: "research-method disposition for the 2026-08-24 snapshot-bounded dossier; not a project rejection"
  source_ids: [S-001, S-004, S-009, S-018, S-020, S-021]
  fact_dependencies: [C-001, C-003, C-009, C-020, C-022]
  method: "reasoning=these threads are unsafe, mutable, inaccessible, statistically underspecified, or non-discriminating for the static comparison; assumptions=decision remains cutoff-bounded and no separate authorization exists; alternative=a separately assigned disposable-lab, evaluation, legal-history, or newer-snapshot study could reopen them"
  counterevidence: "additional findings may exist, but existence alone does not provide positive marginal evidence within scope"
  adversarial_status: NOT_APPLICABLE:research-thread-disposition
- claim_id: C-034
  section: adversarial-probes
  statement: "Runtime startup effects, malformed-input handling, permission bypass, cancellation cleanup, concurrency, crash recovery, injection resistance, filesystem containment, and external-effect rollback remain unqualified."
  classification: UNKNOWN
  confidence: N/A
  scope: "CLI/Desktop/ACP/agent/tool/context/session boundaries under dynamic faults and adversarial inputs"
  source_ids: [S-007, S-009, S-012, S-013, S-014, S-017]
  fact_dependencies: []
  method: "attempted_methods=static entrypoint,reply,permission,persistence,subagent,ACP,and MCP failure tracing plus all fourteen bounded probes; blocker=no authorized disposable least-privilege multi-process sandbox with fake credentials,denied sinks,and deterministic fault barriers; impact=runtime enforcement,cleanup,isolation,recovery,and rollback cannot be accepted; available_evidence=S-007,S-009,S-012,S-013,S-014,S-017; next_probe=run the declared probe matrix in a no-secrets disposable Linux/macOS/Windows lab with read-only host inputs,network denied except scripted endpoints,and side-effect sentinels"
  counterevidence: "static controls address selected paths but are not runtime observations"
  adversarial_status: NOT_PROBED
- claim_id: C-035
  section: tool-interface
  statement: "Read-only annotation honesty, SmartApprove classifier accuracy, adversarial resistance, and alternate tool-invocation bypass remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "SmartApprove and consequential tool dispatch across built-in, MCP, frontend, and subagent paths"
  source_ids: [S-009]
  fact_dependencies: []
  method: "attempted_methods=static precedence,annotation,classifier-failure,confirmation,and persistence tracing; blocker=no authorized labeled corpus,provider protocol,malicious extension fixture,or final-sink deny harness; impact=SmartApprove cannot be treated as a security boundary or assigned an accuracy score; available_evidence=S-009; next_probe=pre-register a threat model and corpus,deny each sink,inject dishonest annotations and classifier failures,and test every alternate invocation path"
  counterevidence: "missing or failed classification falls back to approval, but successful false read-only classification remains unmeasured"
  adversarial_status: NOT_PROBED
- claim_id: C-036
  section: provider-interface
  statement: "Live provider/model inventory, auth/network/rate-limit/malformed-stream behavior, physical retry visibility, idempotency, and failure routing remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "common and concrete provider/model calls under auth,DNS,429,drop,malformed,timeout,and retry conditions"
  source_ids: [S-010, S-017]
  fact_dependencies: []
  method: "attempted_methods=static provider,model,error,retry,Retry-After,stream,and cancellation inspection plus bounded common-path idempotency/failover searches; blocker=no deterministic mock/live provider execution or independent physical-request receipt; impact=delivery duplication,fallback,catalog accuracy,and error preservation cannot be asserted; available_evidence=S-010,S-017; next_probe=route each provider adapter through a scripted local transport that records sends and injects auth,429,DNS,drop,malformed,and interrupted streams"
  counterevidence: "typed errors and bounded retry exist, but no shared idempotency key or cross-provider failover was evidenced in the searched common paths"
  adversarial_status: NOT_PROBED
- claim_id: C-037
  section: resource-token-cost-accounting
  statement: "Agreement among estimates, retries, cache traffic, child streams, provider totals, invoices, and resource-budget behavior remains unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "token/cost/resource accounting across main,compaction,helper,and subagent calls"
  source_ids: [S-010, S-012]
  fact_dependencies: []
  method: "attempted_methods=static ProviderUsage,cost-source,usage-ledger,aggregate,compaction,and child-event inspection; blocker=no independent request/cache/retry/billing oracle or controlled exhaustion run; impact=complete cost allocation,reconciliation,and hard-budget enforcement cannot be claimed; available_evidence=S-010,S-012; next_probe=use a deterministic metered provider and resource monitor with missing/contradictory usage,retries,cache,children,and exhaustion"
  counterevidence: "the ledger distinguishes reported and estimated cost but does not independently reconcile provider billing"
  adversarial_status: NOT_PROBED
- claim_id: C-038
  section: install-update-release
  statement: "Reproducible builds, updater execution, signature-chain execution, post-install health rollback, all-asset verification, and release-byte-to-source identity remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "v1.47.0 release assets, CLI/Desktop update paths, and @aaif/goose-sdk@0.20.2"
  source_ids: [S-001, S-018, S-022, S-023]
  fact_dependencies: []
  method: "attempted_methods=pinned workflow/updater inspection,official release metadata,exact npm metadata/provenance/tarball hashing,and commit ancestry comparison; blocker=no authorized hermetic rebuild,all-asset attestation verification,or disposable prior-version update fault lab and source identities contradict; impact=artifact/source equivalence and recoverable post-install operation cannot be asserted; available_evidence=S-001,S-018,S-022,S-023; next_probe=verify every asset attestation against its exact source commit,rebuild in pinned toolchains,and interrupt install/copy/launch/migration with retained prior bytes"
  counterevidence: "copy-failure restoration and exact npm digests narrow selected risks but do not resolve end-to-end identity or post-launch rollback"
  adversarial_status: CHALLENGED
- claim_id: C-039
  section: evidence-observability
  statement: "Runtime evidence loss, duplication, redaction completeness, tamper resistance, child-usage surfacing, cancellation receipts, and field forgery remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "agent events,SQLite,logs,OTLP,PostHog,and Desktop surfaces for denied,failed,cancelled,and malicious inputs"
  source_ids: [S-012, S-016]
  fact_dependencies: []
  method: "attempted_methods=static event,identifier,visibility,usage,telemetry,content-gate,and persistence inspection; blocker=no isolated sink/collector with drop,duplicate,spoof,secret,and cancellation injection; impact=audit completeness,privacy,and nonrepudiation cannot be established; available_evidence=S-012,S-016; next_probe=compare emitted,persisted,exported,and collected records under denied,failed,cancelled,duplicate,spoofed,and secret-bearing events"
  counterevidence: "message/tool/session IDs and ledger rows aid correlation but do not authenticate records"
  adversarial_status: NOT_PROBED
- claim_id: C-040
  section: module-extension-boundaries
  statement: "Stable extension ABI negotiation, unload/rollback, malformed-protocol behavior, runtime isolation, and cross-version conformance remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "built-in ExtensionConfig/ExtensionManager forms and lifecycle; third-party correctness excluded"
  source_ids: [S-008]
  fact_dependencies: []
  method: "attempted_methods=static enum,registration,ordered-loading,error,timeout,container,and removal-path inspection; blocker=no cross-version extension fixture matrix or isolated malformed transport run and no stable ABI guarantee located; impact=upgrade,recovery,and isolation compatibility cannot be assumed; available_evidence=S-008; next_probe=run versioned stdio,HTTP,platform,frontend,and inline fixtures through load,conflict,timeout,cancel,malformed,unload,and rollback"
  counterevidence: "typed variants and errors provide structure but not a stable ABI or isolation guarantee"
  adversarial_status: NOT_PROBED
- claim_id: C-041
  section: tests-qualification
  statement: "The inspected commit's actual test pass/fail, coverage, flakiness, quarantine state, and equivalence to release environments remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "checked-in Rust/SDK/Desktop workflows and tests at the inspected commit"
  source_ids: [S-019]
  fact_dependencies: []
  method: "attempted_methods=static CI job,command,matrix,and gate inspection; blocker=dependencies were not installed and no target test or authoritative historical run was executed/retained for this dossier; impact=source findings are not dynamically qualified and release-gate success cannot be inferred; available_evidence=S-019; next_probe=run the pinned workflow commands in matching isolated environments and retain raw outputs,versions,coverage,and quarantine results"
  counterevidence: "broad checked-in commands exist, but presence is not a pass result"
  adversarial_status: NOT_PROBED
- claim_id: C-042
  section: security
  statement: "The repository's current Dependabot-alert state is unknown because the authenticated endpoint returned HTTP 403 and retrying without additional authority would not discriminate the result."
  classification: UNKNOWN
  confidence: N/A
  scope: "GitHub Dependabot alerts for aaif-goose/goose as accessed on 2026-08-24; advisory GHSA-r5pp-p5r8-466r remains separately observed"
  source_ids: [S-024]
  fact_dependencies: []
  method: "attempted_methods=authenticated GitHub repository Dependabot alerts API request and public advisory lookup; blocker=API returned HTTP 403 Resource not accessible by integration and no higher-privilege authorization was available; impact=dependency-alert completeness cannot be compared; available_evidence=S-024; next_probe=an authorized repository security owner exports open/dismissed alerts with timestamps and affected manifests"
  counterevidence: "one public repository advisory was accessible, but it is not an alert inventory"
  adversarial_status: CHALLENGED
- claim_id: C-043
  section: provenance-license
  statement: "A complete transitive dependency-license/NOTICE aggregate and project trademark-use determination remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "all Rust/Node/transitive artifacts and Goose/AAIF marks; repository license and governance policy only"
  source_ids: [S-003, S-004]
  fact_dependencies: []
  method: "attempted_methods=repository LICENSE and governance/licensing-policy inspection plus manifest caveat review; blocker=no authorized complete lockfile artifact/license scan,NOTICE aggregation,or trademark counsel; impact=redistribution and mark-use conclusions remain incomplete; available_evidence=S-003,S-004; next_probe=run an approved dependency/license/NOTICE inventory against exact release inputs and obtain project-specific trademark guidance"
  counterevidence: "Apache-2.0 grants patent/copyright rights but expressly does not grant trademark permission"
  adversarial_status: NOT_PROBED
```

## 27. Source ledger {#source-ledger}

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Pinned repository identity, cleanliness, and release-tag ancestry"
  url: "https://github.com/aaif-goose/goose/tree/f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  commit_or_ref: "N/A:no-exact-tag-at-snapshot"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:not-a-package-artifact"
  code_path: "N/A:repository-state"
  symbol: "git remote/rev-parse/describe/status/submodule/merge-base"
  line_anchor: "N/A:command-output"
  command: "git remote -v && git rev-parse HEAD && (git describe --tags --exact-match 2>/dev/null || printf 'N/A:no-exact-tag\\n') && git status --short && git submodule status && (git merge-base --is-ancestor f9c7aaccde4834810dfd13d5efa8f0d39ba28a20 HEAD; printf 'release_tag_is_ancestor=%s\\n' \"$?\")"
  command_environment: "macOS 27.0 arm64; git 2.54.0; clean detached partial clone; local object database; target not executed"
  output_or_hash: "inline:origin=https://github.com/aaif-goose/goose.git; HEAD=f9ac24cbfc3ba28dc0844495fa0605229e4b4144; exact_tag=N/A; status=<empty>; submodules=<empty>; release_tag_is_ancestor=1"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-002, C-028, C-033, C-038]
  notes: "Selected as direct immutable identity evidence; ancestry exit 1 means the release-tag commit is not an ancestor, not that either record is invalid."
- source_id: S-002
  source_kind: repository-file
  title: "Workspace identity, version, MSRV, license, repository, and members"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/Cargo.toml#L1-L128"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-workspace-metadata"
  code_path: "Cargo.toml"
  symbol: "workspace.members/workspace.package/workspace.dependencies"
  line_anchor: "L1-L128"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:Cargo.toml"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; network not required"
  output_or_hash: "sha256:b83aebf38f2985589d2087f4dace5d4757bd7683cbbae3c4ab28dd060e7a0f67"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-003, C-004, C-022]
  notes: "Selected as authoritative workspace metadata; lines 9-16 record version 1.47.0, rust-version 1.94.1, AAIF, Apache-2.0, and canonical repository."
- source_id: S-003
  source_kind: license
  title: "Repository Apache License 2.0 text"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/LICENSE#L1-L201"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-license"
  code_path: "LICENSE"
  symbol: "Apache License Version 2.0"
  line_anchor: "L1-L201"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:LICENSE"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; network not required"
  output_or_hash: "sha256:44459b86c2e96fdbfd8a6b5c33d30d4b04b5293fcb2ec96fe4dcc4e0f90b8962"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-043]
  notes: "Selected as controlling repository license text; the complete dependency-license and trademark posture is not inferred from it."
- source_id: S-004
  source_kind: official-documentation
  title: "AAIF Goose governance and outbound licensing policy"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/GOVERNANCE.md#L1-L199"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-governance-policy"
  code_path: "GOVERNANCE.md"
  symbol: "project stewardship/decision process/licensing policy"
  line_anchor: "L1-L199"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:GOVERNANCE.md"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; network not required"
  output_or_hash: "sha256:abc55bd3bd1c7aa822ad3b89a6c8a2ada4b226a3b37311f0260ac46153fd68d0"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-033, C-043]
  notes: "Selected as first-party governance/licensing origin; governance process is not executable security evidence."
- source_id: S-005
  source_kind: runtime-observation
  title: "Static workspace and package inventory"
  url: "https://github.com/aaif-goose/goose/tree/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-inventory"
  code_path: "Cargo.toml; crates/*/Cargo.toml; ui/desktop/package.json; ui/sdk/package.json; evals; examples; vendor/v8"
  symbol: "workspace members and package name/version/role inventory"
  line_anchor: "Cargo.toml:L1-L16; package manifests:JSON name/version/description fields; N/A:tree entries"
  command: "git ls-tree -r --name-only f9ac24cbfc3ba28dc0844495fa0605229e4b4144 | grep -E '(^Cargo.toml$|^crates/[^/]+/Cargo.toml$|^ui/(desktop|sdk)/package.json$|^evals/|^examples/|^vendor/v8/)'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static tree inventory; target not executed"
  output_or_hash: "inline:production crates include goose,goose-cli,goose-agent,goose-provider-types,goose-providers,goose-context-management,goose-mcp,goose-sdk,goose-sdk-types,goose-acp-macros,goose-local-inference; Desktop and TypeScript SDK are separate; evals/examples/vendor classified separately"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-004]
  notes: "Selected to normalize package roles without treating wildcard membership as default reachability."
- source_id: S-006
  source_kind: repository-file
  title: "CLI, Desktop, and SDK entrypoint declarations"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates/goose-cli/src/main.rs#L1-L53"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source"
  code_path: "crates/goose-cli/src/main.rs; crates/goose-cli/src/cli.rs; ui/desktop/package.json; ui/sdk/package.json"
  symbol: "main/cli; package main/scripts; SDK exports/optional platform binaries"
  line_anchor: "main.rs:L1-L53; cli.rs:L2629-L2760; ui/desktop/package.json:L1-L22; ui/sdk/package.json:L1-L57"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose-cli/src/main.rs && git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose-cli/src/cli.rs | sed -n '2629,2760p' && git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:ui/desktop/package.json | sed -n '1,22p' && git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:ui/sdk/package.json | sed -n '1,57p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no package scripts or target code executed"
  output_or_hash: "inline:CLI builds multithread Tokio runtime and calls cli; Electron main=.vite/build/main.js; SDK exports root/node and optional platform binaries; retained_capture_sha256=f65216ee477d948a54feb075c7f7285723a58b8795aff70ef749d523b4320dea"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-005]
  notes: "Selected to establish declared/reachable entrypoints; the researcher session retains the grouped static capture identified by the digest."
- source_id: S-007
  source_kind: repository-file
  title: "Core Agent reply dispatch, standard loop, state machine, and compaction"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates/goose/src/agents/agent.rs#L1770-L2309"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source"
  code_path: "crates/goose/src/agents/agent.rs; crates/goose/src/agents/reply_parts.rs; crates/goose/src/agents/state_machine/mod.rs"
  symbol: "Agent::reply/reply_impl/reply_internal/reply_with_state_machine; provider stream/tool loop; state_machine::enabled/bang_shell_command"
  line_anchor: "agent.rs:L1770-L3300; reply_parts.rs:L350-L700,L1120-L1260; state_machine/mod.rs:L1-L67"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/agent.rs | sed -n '1770,3300p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/reply_parts.rs | sed -n '350,700p;1120,1260p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/state_machine/mod.rs"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; provider,tools,and agent not executed"
  output_or_hash: "inline:standard reply is default; truthy GOOSE_STATE_MACHINE or recognized bang-shell selects state machine; message IDs,persistence,compaction,provider/tool events traced; retained_capture_sha256=7ad8a419a84db1dab0d6031be368299c561cdc4a44a7e0c0da1855903a781648"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-008, C-012, C-013, C-034]
  notes: "Selected as primary control-flow origin; static source establishes structure, not runtime fault outcomes."
- source_id: S-008
  source_kind: repository-file
  title: "Extension variants, loading, transports, and container rewrite"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates/goose/src/agents/extension.rs#L162-L310"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source"
  code_path: "crates/goose/src/agents/extension.rs; crates/goose/src/agents/extension_manager.rs; crates/goose/src/config/extensions.rs"
  symbol: "ExtensionConfig; ExtensionManager::add_extension; built-in/stdio docker exec branches; environment filtering"
  line_anchor: "extension.rs:L162-L310,L420-L590; extension_manager.rs:L1450-L1720; config/extensions.rs:L230-L760"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/extension.rs | sed -n '162,310p;420,590p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/extension_manager.rs | sed -n '1450,1720p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/config/extensions.rs | sed -n '230,760p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no extension,inline Python,network,or docker command executed"
  output_or_hash: "inline:SSE,stdio,builtin,platform,streamable HTTP/UDS/OAuth,frontend,inline Python enumerated; docker exec -i only in builtin/stdio branches; retained_capture_sha256=68b0d958f75d7d9e0b6ae8868f8e4e0aaac12b4820db145fdaf102439719c077"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-009, C-015, C-027, C-032, C-040]
  notes: "Selected as executable extension authority origin; compatibility SSE and generated/test code were not treated as independent loop authority."
- source_id: S-009
  source_kind: repository-file
  title: "Goose modes, permission persistence, SmartApprove, and confirmation"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates/goose/src/permission/permission_inspector.rs#L134-L269"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source"
  code_path: "crates/goose-provider-types/src/goose_mode.rs; crates/goose/src/config/permission.rs; crates/goose/src/permission/permission_inspector.rs; crates/goose/src/agents/reply_parts.rs"
  symbol: "GooseMode::default; PermissionManager; PermissionInspector::inspect; tool confirmation/denial"
  line_anchor: "goose_mode.rs:L1-L32; permission.rs:L10-L249; permission_inspector.rs:L134-L269; reply_parts.rs:L1120-L1260"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose-provider-types/src/goose_mode.rs; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/config/permission.rs | sed -n '10,249p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/permission/permission_inspector.rs | sed -n '134,269p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/reply_parts.rs | sed -n '1120,1260p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no tool,permission prompt,or classifier executed"
  output_or_hash: "inline:Auto default; permission.yaml always/ask/never; corrupt YAML panic; SmartApprove explicit-rule,annotation,extension-management,classifier,fallback order; retained_capture_sha256=de4a7a959470be3e2583d82791c490d8c0342d9f3f19eb57fe631757d41993d6"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-009, C-015, C-019, C-023, C-026, C-029, C-033, C-034, C-035]
  notes: "Selected as final policy/confirmation path; annotations and classifier output were not treated as independent truth."
- source_id: S-010
  source_kind: repository-file
  title: "Provider, model, retry, stream, and usage contracts"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates/goose-provider-types/src/base.rs#L267-L540"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source"
  code_path: "crates/goose-provider-types/src/base.rs; crates/goose-provider-types/src/model.rs; crates/goose-provider-types/src/retry.rs; crates/goose-provider-types/src/conversation/token_usage.rs; crates/goose/src/agents/reply_parts.rs"
  symbol: "ModelInfo/Provider/MessageStream; ModelConfig; RetryConfig/retry_operation; ProviderUsage; first-item retry wrapper"
  line_anchor: "base.rs:L267-L540; model.rs:L1-L180; retry.rs:L1-L179; token_usage.rs:L1-L180; reply_parts.rs:L350-L445"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose-provider-types/src/base.rs | sed -n '267,540p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose-provider-types/src/model.rs | sed -n '1,180p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose-provider-types/src/retry.rs | sed -n '1,179p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose-provider-types/src/conversation/token_usage.rs | sed -n '1,180p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/reply_parts.rs | sed -n '350,445p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no credentials,provider,or network request"
  output_or_hash: "inline:one provider stream; model capability/cost/context metadata; three retries,1s exponential,30s cap,0.8-1.2 jitter; Retry-After override; usage/cost fields; retained_capture_sha256=f8edcc150fa5cbcd228007564c6d99eeafc2f7e7aa0323ec9ee67f7554b40e9b"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-010, C-011, C-018, C-019, C-024, C-030, C-036, C-037]
  notes: "Selected as common provider/model abstraction origin; concrete vendor behavior was not inferred from the trait."
- source_id: S-011
  source_kind: repository-file
  title: "Prompt assembly, hint loading, sanitization, and compaction"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates/goose/src/agents/prompt_manager.rs#L19-L287"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source"
  code_path: "crates/goose/src/agents/prompt_manager.rs; crates/goose/src/hints/load_hints.rs; crates/goose/src/context_mgmt/mod.rs; crates/goose/src/utils.rs"
  symbol: "SystemPromptBuilder::build/PromptManager::build_system_prompt; load_hint_files; compact_messages/check_if_compaction_needed; sanitize_unicode_tags"
  line_anchor: "prompt_manager.rs:L19-L287; load_hints.rs:L1-L220; context_mgmt/mod.rs:L54-L369; utils.rs:L1-L40"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/prompt_manager.rs | sed -n '19,287p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/hints/load_hints.rs | sed -n '1,220p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/context_mgmt/mod.rs | sed -n '54,369p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/utils.rs | sed -n '1,40p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no hint file loaded by target and no summarization call"
  output_or_hash: "inline:sorted/sanitized extension data,mode/subagent/code state,hints/extras compose prompt; compaction uses visibility-qualified originals and summary; retained_capture_sha256=c1ef97b2856142b0e802a6da1f55717d6e7d5928be25690c21fe41868e3e58e3"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-013, C-024, C-026, C-030]
  notes: "Selected to trace instruction provenance and context mutation; sanitization is not treated as prompt-injection prevention."
- source_id: S-012
  source_kind: repository-file
  title: "SQLite schema 16, transactions, sessions, and usage ledger"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates/goose/src/session/session_manager.rs#L1-L4641"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source"
  code_path: "crates/goose/src/session/session_manager.rs"
  symbol: "CURRENT_SCHEMA_VERSION/SessionManager/database_options/initialize/create_schema/migrate/replace_conversation/usage ledger/aggregate queries"
  line_anchor: "L1-L4641"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/session/session_manager.rs"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no database opened or mutated"
  output_or_hash: "sha256:5a52ead9db506cec3aaa89c75721bd34672c54e2dec9c71f93e9c5307b950dcf"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-012, C-013, C-014, C-017, C-018, C-019, C-023, C-024, C-029, C-030, C-034, C-037, C-039]
  notes: "Selected as persistence/accounting origin; schema presence and tests are not dynamic crash or tamper evidence."
- source_id: S-013
  source_kind: repository-file
  title: "Summon durable subagent lifecycle, limits, cwd, usage, and cancellation"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates/goose/src/agents/platform_extensions/summon.rs#L500-L2225"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source"
  code_path: "crates/goose/src/agents/platform_extensions/summon.rs; crates/goose/src/agents/subagent_handler.rs; crates/goose/src/agents/subagent_task_config.rs"
  symbol: "SummonClient/create_subagent_session/max_background_tasks/resolve_working_dir/cancel; run_subagent_task/get_agent_messages; TaskConfig"
  line_anchor: "summon.rs:L500-L2225; subagent_handler.rs:L1-L309; subagent_task_config.rs:L1-L62"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/platform_extensions/summon.rs | sed -n '500,2225p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/subagent_handler.rs | sed -n '1,309p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/subagent_task_config.rs"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no subagent or background task executed"
  output_or_hash: "inline:durable Auto SubAgent with parent link,25-turn default,filtered inherited tools/provider,contained canonical cwd,no nested summon,five tasks,5s abort; usage events discarded from immediate stream; retained_capture_sha256=84eb6e0a7e9e5f9bbde115299c605255cb46fadb1ea5031ab34120521c707014"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-014, C-018, C-019, C-034]
  notes: "Selected as built-in delegation origin; separate durable sessions do not imply workspace isolation."
- source_id: S-014
  source_kind: repository-file
  title: "ACP authentication, origin policy, router composition, and public health"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates/goose/src/acp/transport/mod.rs#L1-L248"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source"
  code_path: "crates/goose/src/acp/transport/mod.rs; crates/goose/src/acp/transport/auth.rs; crates/goose/src/acp/mcp_app_proxy.rs"
  symbol: "AcpOriginPolicy/create_acp_router/create_router/check_acp_token/token_matches/health/proxy routes"
  line_anchor: "transport/mod.rs:L1-L248; transport/auth.rs:L1-L36; mcp_app_proxy.rs:L220-L385"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/acp/transport/mod.rs; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/acp/transport/auth.rs; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/acp/mcp_app_proxy.rs | sed -n '220,385p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no server,token,CORS,TLS,or proxy request"
  output_or_hash: "inline:constant-time header/query token; loopback/file/null/exact origin policy; full router token optional; bare router unauthenticated; health/status unauthenticated; retained_capture_sha256=30bfd29d533f8b594cb87604d28040ce1f1f7579b0dbef20256714bfb425b71e"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-025, C-031, C-034]
  notes: "Selected as executable API-control origin; live browser/WebSocket semantics remain unobserved."
- source_id: S-015
  source_kind: repository-file
  title: "Desktop goose serve child, readiness, TLS pinning, and ACP reconnection"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/ui/desktop/src/gooseServe.ts#L100-L606"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source"
  code_path: "ui/desktop/src/gooseServe.ts; ui/desktop/src/acp/acpConnection.ts; ui/desktop/src/main.ts; ui/desktop/package.json"
  symbol: "startGooseServe/readiness/fingerprint/cleanup; openConnection/retryWithBackoff; certificate verifier/backend startup; Electron main"
  line_anchor: "gooseServe.ts:L100-L606; acpConnection.ts:L20-L230; main.ts:L316-L402,L919-L1240; package.json:L1-L22"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:ui/desktop/src/gooseServe.ts | sed -n '100,606p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:ui/desktop/src/acp/acpConnection.ts | sed -n '20,230p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:ui/desktop/src/main.ts | sed -n '316,402p;919,1240p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:ui/desktop/package.json | sed -n '1,22p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static TypeScript/package inspection; Electron and goose serve not executed"
  output_or_hash: "inline:127.0.0.1 child,secret env/readiness polling,optional emitted fingerprint pin,10s initialize,generation fence,500ms exponential 30s cap full jitter; retained_capture_sha256=748c48c91dae19b5b143e3010ac69cdd8bb394dd405dc53d69e81bb50c3bd466"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-016, C-025, C-031]
  notes: "Selected as parent/child lifecycle origin; platform cleanup and live certificate behavior were not inferred from tests."
- source_id: S-016
  source_kind: repository-file
  title: "Session evidence, PostHog opt-in, OTLP content gate, and Desktop analytics no-op"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates/goose/src/posthog.rs#L1-L604"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source"
  code_path: "crates/goose/src/posthog.rs; crates/goose/src/agents/gen_ai_telemetry.rs; ui/desktop/src/utils/analytics.ts"
  symbol: "is_telemetry_enabled/emit_session_started/emit_error; capture_message_content/GenAI attributes; sendEvent"
  line_anchor: "posthog.rs:L1-L604; gen_ai_telemetry.rs:L1-L300; analytics.ts:L1-L18,L198-L202"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/posthog.rs; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/gen_ai_telemetry.rs | sed -n '1,300p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:ui/desktop/src/utils/analytics.ts | sed -n '1,18p;198,202p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; telemetry/network/collector/Desktop not executed"
  output_or_hash: "inline:backend explicit opt-in and ordinary session_started; error/custom return early; Desktop sender no-op; OTLP message content only when named env is true; retained_capture_sha256=8dc58745a0df48abf3b731cab7e38eb07e1e0032775f8e59418c542e007e6c2a"
  access_date: "2026-08-24"
  supports_claims: [C-017, C-039]
  notes: "Selected to distinguish backend, Desktop, and OTLP channels; no network event was sent."
- source_id: S-017
  source_kind: repository-file
  title: "MCP cancellation/timeout and provider first-item retry failure paths"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates/goose/src/agents/mcp_client.rs#L720-L1019"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source"
  code_path: "crates/goose/src/agents/mcp_client.rs; crates/goose/src/agents/reply_parts.rs; crates/goose-provider-types/src/errors.rs"
  symbol: "call_tool/await_response/send_cancel_message; provider stream retry wrapper; ProviderError/ServiceError"
  line_anchor: "mcp_client.rs:L720-L1019; reply_parts.rs:L350-L445; errors.rs:L1-L220"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/mcp_client.rs | sed -n '720,1019p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose/src/agents/reply_parts.rs | sed -n '350,445p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose-provider-types/src/errors.rs | sed -n '1,220p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source; no MCP/provider request or induced fault"
  output_or_hash: "inline:MCP timeout/cancel sends cancellation notification and returns typed error; provider retries only transient first-item failures and returns terminal cause; retained_capture_sha256=338862819c3411c6bbf9dea337f6a51d9925b5411f59deb92e19d0da622b75cd"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-019, C-034, C-036]
  notes: "Selected for exact common failure choke points; static propagation is not verified external cleanup or idempotency."
- source_id: S-018
  source_kind: repository-file
  title: "CLI updater and release/canary provenance workflows"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/crates/goose-cli/src/commands/update.rs#L64-L570"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-source-and-workflows"
  code_path: "crates/goose-cli/src/commands/update.rs; .github/workflows/release.yml; .github/workflows/canary.yml; .github/workflows/publish-npm.yml"
  symbol: "verify_provenance/update/extract_zip/extract_tar_bz2/replace_binary; release/canary attest/sign/publish; npm trusted publishing"
  line_anchor: "update.rs:L64-L570; release.yml:L1-L204; canary.yml:L1-L181; publish-npm.yml:L1-L180"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:crates/goose-cli/src/commands/update.rs | sed -n '64,570p'; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:.github/workflows/release.yml; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:.github/workflows/canary.yml; git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:.github/workflows/publish-npm.yml | sed -n '1,180p'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static source/workflow inspection; no updater,installer,archive extraction,signature verification,or workflow executed"
  output_or_hash: "inline:pinned actions,signing/OIDC/source archives; updater SHA-256+Sigstore fail-closed verification,hardened extraction,copy-failure restore,no post-launch rollback; retained_capture_sha256=910c2c860415e4560da1f854c6d483c12dd6aa658d1494d23da74b8ca54cd3c6"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-025, C-028, C-033, C-038]
  notes: "Selected as release/update control origin; workflow presence and updater source are not execution or reproducibility evidence."
- source_id: S-019
  source_kind: repository-file
  title: "Continuous integration qualification definitions"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/.github/workflows/ci.yml#L1-L278"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-workflow"
  code_path: ".github/workflows/ci.yml"
  symbol: "format/test/scenario/UniFFI/TLS/Windows/MSRV/Clippy/schema/SDK/Desktop jobs"
  line_anchor: "L1-L278"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:.github/workflows/ci.yml"
  command_environment: "macOS 27.0 arm64; git 2.54.0; workflow inspected but not executed"
  output_or_hash: "sha256:848e1a82e1acf327345ecf93a1248fb08af2c1d1489c27591af02b1cd99e4db1"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-028, C-041]
  notes: "Selected for checked-in qualification intent; no green-run, coverage, or release-environment equivalence is claimed."
- source_id: S-020
  source_kind: official-documentation
  title: "Official Goose security guidance and threat precautions"
  url: "https://github.com/aaif-goose/goose/blob/f9ac24cbfc3ba28dc0844495fa0605229e4b4144/SECURITY.md#L1-L15"
  commit_or_ref: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  package_identity: "N/A:repository-policy"
  code_path: "SECURITY.md"
  symbol: "risk boundary/precautions/prompt injection/reporting"
  line_anchor: "L1-L15"
  command: "git show f9ac24cbfc3ba28dc0844495fa0605229e4b4144:SECURITY.md"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static first-party policy"
  output_or_hash: "sha256:e9b24f0a2ab5e6e1655cd178266d1afcb8f7b4e213f460cd643a1b986922e120"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-022, C-027, C-032, C-033]
  notes: "Selected as first-party threat guidance and checked against code; policy is not independent runtime measurement."
- source_id: S-021
  source_kind: security-advisory
  title: "GHSA-r5pp-p5r8-466r / CVE-2026-72718 goose review fsmonitor command execution"
  url: "https://github.com/aaif-goose/goose/security/advisories/GHSA-r5pp-p5r8-466r"
  commit_or_ref: "GHSA-r5pp-p5r8-466r"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:security-advisory"
  code_path: "N/A:advisory-record"
  symbol: "affected versions/severity/CVE/CWE/vulnerable goose review git core.fsmonitor path/patched version"
  line_anchor: "N/A:rendered-advisory-fields"
  command: "N/A:passive-browser-retrieval"
  command_environment: "passive HTTPS retrieval of official GitHub repository advisory; no exploit,repository,or target execution"
  output_or_hash: "inline:GHSA-r5pp-p5r8-466r; CVE-2026-72718; severity=High; affected=<1.44.0; patched=1.44.0; vector=attacker-controlled git core.fsmonitor executed by goose review before model contact"
  access_date: "2026-08-24"
  supports_claims: [C-022, C-027, C-033]
  notes: "Selected as the official vulnerability origin; a global advisory API/page returned 404, so the accessible repository advisory was retained instead."
- source_id: S-022
  source_kind: release-metadata
  title: "Official cutoff release v1.47.0 metadata"
  url: "https://api.github.com/repos/aaif-goose/goose/releases/374587883"
  commit_or_ref: "v1.47.0"
  resolved_commit: "f9c7aaccde4834810dfd13d5efa8f0d39ba28a20"
  package_identity: "N/A:GitHub-release-record"
  code_path: "N/A:release-API-document"
  symbol: "id/tag_name/name/draft/prerelease/published_at/assets/tarball_url/zipball_url"
  line_anchor: "JSON pointers /id,/tag_name,/published_at,/assets,/tarball_url,/zipball_url"
  command: "curl -fsSL 'https://api.github.com/repos/aaif-goose/goose/releases/374587883' && git rev-parse f9c7aaccde4834810dfd13d5efa8f0d39ba28a20^{commit}"
  command_environment: "passive exact GitHub API retrieval plus local git object resolution; network required for API; no asset executed"
  output_or_hash: "inline:id=374587883; tag=v1.47.0; draft=false; prerelease=false; published_at=2026-08-21T18:14:59Z; tag_commit=f9c7aaccde4834810dfd13d5efa8f0d39ba28a20"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-020, C-022, C-025, C-028, C-038]
  notes: "Selected as official cutoff-release origin; release mutable=false was not claimed because the API reports immutable=false."
- source_id: S-023
  source_kind: package-artifact
  title: "Exact @aaif/goose-sdk 0.20.2 metadata, tarball hashes, and npm provenance"
  url: "https://registry.npmjs.org/%40aaif%2Fgoose-sdk/0.20.2"
  commit_or_ref: "npm:0.20.2"
  resolved_commit: "e3090836e42b515de60011333492c90eb4b7ba77"
  package_identity: "npm:@aaif/goose-sdk@0.20.2 integrity=sha512-HhsspN1OycRqgKgnUBWC/5xOpJ8zuKWmABax0Br0ZfND94AKKZbsBlya8e+pSM+CvztWLXHRz2KxPQuXYoGyBQ=="
  code_path: "goose-sdk-0.20.2.tgz; package/package.json; provenance sourcePath=.github/workflows/publish-npm.yml"
  symbol: "dist.integrity/dist.shasum/dist.tarball/attestations/provenance sourceRepositoryDigest/sourcePath"
  line_anchor: "registry JSON pointers /version,/dist/integrity,/dist/shasum,/dist/tarball,/dist/attestations; provenance statement subject/predicate/buildDefinition"
  command: "curl -fsSL 'https://registry.npmjs.org/%40aaif%2Fgoose-sdk/0.20.2' -o goose-sdk-0.20.2.json && curl -fsSL 'https://registry.npmjs.org/@aaif/goose-sdk/-/goose-sdk-0.20.2.tgz' -o goose-sdk-0.20.2.tgz && shasum -a 1 goose-sdk-0.20.2.tgz && shasum -a 256 goose-sdk-0.20.2.tgz && openssl dgst -sha512 -binary goose-sdk-0.20.2.tgz | openssl base64 -A && curl -fsSL 'https://registry.npmjs.org/-/npm/v1/attestations/%40aaif%2Fgoose-sdk@0.20.2'"
  command_environment: "macOS 27.0 arm64; curl,shasum,OpenSSL,static tarball hashing; network required; package scripts and bytes not executed"
  output_or_hash: "inline:version=0.20.2; sha1=aacaaef991b9bd41068cfd6d71e45a77531223ef; sha256=348bd7e52b2d5e9ac93ea86b192ec99ef6b85221ebc33cdfeea0191c9e551163; sha512-base64=HhsspN1OycRqgKgnUBWC/5xOpJ8zuKWmABax0Br0ZfND94AKKZbsBlya8e+pSM+CvztWLXHRz2KxPQuXYoGyBQ==; provenance_commit=e3090836e42b515de60011333492c90eb4b7ba77; workflow=.github/workflows/publish-npm.yml"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-028, C-038]
  notes: "Selected as exact distributed bytes and registry provenance; the tarball was retained only for static session inspection, and all decision-relevant digests are inline."
- source_id: S-024
  source_kind: runtime-observation
  title: "Inaccessible repository Dependabot alert inventory"
  url: "https://api.github.com/repos/aaif-goose/goose/dependabot/alerts?per_page=1"
  commit_or_ref: "N/A:repository-security-API-state"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package-artifact"
  code_path: "N/A:GitHub-API-endpoint"
  symbol: "Dependabot alerts collection"
  line_anchor: "N/A:HTTP-response"
  command: "gh api -i 'repos/aaif-goose/goose/dependabot/alerts?per_page=1'"
  command_environment: "authenticated GitHub CLI request using existing integration permissions; token redacted/not printed; no repository mutation"
  output_or_hash: "inline:HTTP 403; Resource not accessible by integration"
  access_date: "2026-08-24"
  supports_claims: [C-042]
  notes: "Negative access result retained. An earlier unquoted zsh attempt glob-expanded '?' and failed locally; the quoted retry reached the API. Further retries without new authorization are CURIOSITY_NO_GO."
```

### Bibliography rationale

- **Retained origins:** immutable repository files, exact repository state, official license/governance/security records, the official repository advisory, exact GitHub release metadata, and exact npm metadata/tarball/provenance. These are preferable to search snippets, blogs, popularity signals, or other dossiers for identity and executable-boundary claims.
- **Triangulation:** consequential authority claims combine executable permission/extension paths (S-008/S-009) with first-party security guidance (S-020). Local transport claims pair Rust router controls (S-014) with Electron child/client lifecycle (S-015). Release claims pair workflow/updater source (S-018) with release and package origins (S-022/S-023).
- **Negative results retained:** S-001 preserves no exact tag and failed release-tag ancestry; S-024 preserves the 403 alert-access blocker. Common-path searches for idempotency/failover are kept bounded in C-036 and are not generalized across every provider.
- **Not retained:** mutable search-result text, social discussion, stars/download counts, third-party extensions, broad commit archaeology, and post-cutoff pages. They were secondary, mutable, outside scope, or unable to establish executable behavior.

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "goose-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "Goose"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/aaif-goose/goose"
  resolved_commit: "f9ac24cbfc3ba28dc0844495fa0605229e4b4144"
  observed_ref: "N/A:no-exact-tag-at-snapshot"
  package_identity: "npm:@aaif/goose-sdk@0.20.2 integrity=sha512-HhsspN1OycRqgKgnUBWC/5xOpJ8zuKWmABax0Br0ZfND94AKKZbsBlya8e+pSM+CvztWLXHRz2KxPQuXYoGyBQ=="
research:
  researcher: "ses_fc91cf692ffdnzplcpHPS6cuu8"
  owned_path: "research/harnesses/goose.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "PARTIAL"
    summary: "The repository snapshot and exact package/release records are pinned, but their source commits are non-equivalent."
    confidence: "MEDIUM"
    claim_ids: ["C-001", "C-002", "C-038"]
    source_ids: ["S-001", "S-002", "S-005", "S-006", "S-018", "S-022", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "PARTIAL"
    summary: "Apache-2.0 and AAIF/LF governance are observed; aggregate dependency licensing and trademark use are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-003", "C-043"]
    source_ids: ["S-002", "S-003", "S-004"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "OBSERVED"
    summary: "Core, CLI, provider, context, MCP, SDK, Desktop, eval, example, test, generated, and vendored roles are statically classified."
    confidence: "HIGH"
    claim_ids: ["C-004"]
    source_ids: ["S-002", "S-005"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "OBSERVED"
    summary: "CLI, Desktop child, ACP/API, SDK, MCP, and updater entrypoints are statically traced without execution."
    confidence: "HIGH"
    claim_ids: ["C-005"]
    source_ids: ["S-006", "S-015"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "OBSERVED"
    summary: "A representative message-to-provider-to-inspected-tool-to-persistence loop is statically traced."
    confidence: "MEDIUM"
    claim_ids: ["C-006"]
    source_ids: ["S-007", "S-009", "S-010", "S-012"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "PARTIAL"
    summary: "Extension forms and partial container rewriting are observed; ABI, unload, malformed, and isolation behavior are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-007", "C-040"]
    source_ids: ["S-008"]
    pattern_disposition: "CURIOSITY_NO_GO"
  - dimension: "agent_interface"
    coverage: "OBSERVED"
    summary: "Agent lifecycle and durable built-in subagents are traced, including shared-workspace and usage-visibility limits."
    confidence: "MEDIUM"
    claim_ids: ["C-008"]
    source_ids: ["S-007", "S-013"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "PARTIAL"
    summary: "Tool schema, inspection, confirmation, dispatch, and errors are traced; annotation/classifier trust and bypass remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-009", "C-035"]
    source_ids: ["S-008", "S-009", "S-017"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "provider_interface"
    coverage: "PARTIAL"
    summary: "Common provider streaming and retry contracts are observed without live physical-call/failure qualification."
    confidence: "MEDIUM"
    claim_ids: ["C-010", "C-036"]
    source_ids: ["S-010", "S-017"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Model identity, capabilities, limits, streaming, and costs are statically represented without live negotiation or routing evidence."
    confidence: "MEDIUM"
    claim_ids: ["C-011", "C-036"]
    source_ids: ["S-010", "S-017"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "Prompt/hint assembly and visibility-qualified compaction are traced without dynamic fidelity or injection resistance."
    confidence: "MEDIUM"
    claim_ids: ["C-012", "C-034"]
    source_ids: ["S-007", "S-011", "S-012"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "SQLite schema, transactions, migrations, conversation replacement, and usage are observed; crash recovery is unqualified."
    confidence: "MEDIUM"
    claim_ids: ["C-013", "C-034"]
    source_ids: ["S-007", "S-011", "S-012"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Tokio/SQLite/subagent concurrency is mapped, but collisions and cleanup are untested and no automatic worktree exists."
    confidence: "MEDIUM"
    claim_ids: ["C-014", "C-034"]
    source_ids: ["S-012", "S-013"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "PARTIAL"
    summary: "Default Auto and inspector enforcement are observed; whole-agent containment and runtime bypass are not qualified."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-034", "C-035"]
    source_ids: ["S-008", "S-009", "S-020"]
    pattern_disposition: "CURIOSITY_NO_GO"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Events, SQLite, OTLP, and telemetry gates are visible while loss, forgery, redaction, and tamper behavior remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-017", "C-039"]
    source_ids: ["S-012", "S-016"]
    pattern_disposition: "NO_POSITION"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Usage and cost-source ledgers exist without provider-bill, physical-retry, child-stream, or resource-budget reconciliation."
    confidence: "MEDIUM"
    claim_ids: ["C-018", "C-037"]
    source_ids: ["S-010", "S-012", "S-013"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Typed failures, retry, MCP cancellation, denial, and task abort are explicit; dynamic cleanup/idempotency/rollback are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-019", "C-034", "C-036"]
    source_ids: ["S-009", "S-010", "S-012", "S-013", "S-017"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Static release and updater controls are strong but reproducibility, execution, rollback, and byte identity remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-020", "C-038"]
    source_ids: ["S-001", "S-018", "S-022", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "PARTIAL"
    summary: "Broad CI commands are defined, but no target test result, coverage, or release-environment equivalence was observed."
    confidence: "MEDIUM"
    claim_ids: ["C-021", "C-041"]
    source_ids: ["S-019"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "PARTIAL"
    summary: "Threat guidance, local controls, and one official advisory are observed; live containment, supply-chain closure, and alert inventory are incomplete."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-016", "C-022", "C-035", "C-038", "C-042"]
    source_ids: ["S-001", "S-002", "S-008", "S-009", "S-014", "S-015", "S-018", "S-020", "S-021", "S-022", "S-023", "S-024"]
    pattern_disposition: "CURIOSITY_NO_GO"
  - dimension: "strengths"
    coverage: "OBSERVED"
    summary: "Inspectable approvals, transactional projections, and layered local/release controls are bounded strengths only."
    confidence: "MEDIUM"
    claim_ids: ["C-023", "C-024", "C-025"]
    source_ids: ["S-009", "S-010", "S-011", "S-012", "S-014", "S-015", "S-018", "S-022"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "OBSERVED"
    summary: "Permissive/inferred approval, extension containment ambiguity, and artifact qualification debt are bounded liabilities."
    confidence: "MEDIUM"
    claim_ids: ["C-026", "C-027", "C-028"]
    source_ids: ["S-001", "S-008", "S-009", "S-011", "S-018", "S-019", "S-020", "S-021", "S-022", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "OBSERVED"
    summary: "Qualified sink permissions and transactional ledgers are conditional; generation-fenced child transport is a candidate."
    confidence: "MEDIUM"
    claim_ids: ["C-029", "C-030", "C-031"]
    source_ids: ["S-009", "S-010", "S-011", "S-012", "S-014", "S-015"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Whole-agent sandbox claims for in-process/partial-container mechanisms and unsafe or low-value research threads are rejected in scope."
    confidence: "MEDIUM"
    claim_ids: ["C-032", "C-033"]
    source_ids: ["S-001", "S-004", "S-008", "S-009", "S-018", "S-020", "S-021"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-023", "C-024", "C-025"]
liability_ids: ["C-026", "C-027", "C-028"]
transferable_pattern_ids: ["C-029", "C-030", "C-031"]
curiosity_no_go_ids: ["C-032", "C-033"]
unknown_claim_ids: ["C-034", "C-035", "C-036", "C-037", "C-038", "C-039", "C-040", "C-041", "C-042", "C-043"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| UNKNOWN | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-034 dynamic faults/boundaries | blocks runtime enforcement, isolation, recovery, cleanup, and rollback qualification | execute all declared dynamic probes with deterministic barriers and side-effect sentinels | disposable no-secrets Linux/macOS/Windows lab with denied-by-default sinks | `UNASSIGNED` |
| C-035 SmartApprove/bypass | blocks treating annotation/classifier approval as a security boundary | preregister corpus/threat model; inject dishonest annotations/failures and deny every alternate sink | approved evaluation protocol, local mock provider, malicious fixture extensions | `UNASSIGNED` |
| C-036 provider/model delivery | blocks live catalog, failure preservation, retry visibility, idempotency, and routing conclusions | scripted provider records every send while injecting auth/429/DNS/drop/malformed/interrupted responses | isolated local provider transport; no real credentials | `UNASSIGNED` |
| C-037 usage/cost/resources | blocks complete cost allocation, billing reconciliation, and hard-budget claims | compare independent request/cache/retry/billing/resource oracle with every ledger surface | deterministic metered provider and resource monitor | `UNASSIGNED` |
| C-038 release/update identity | blocks complete source-byte, signature, reproducibility, and post-install rollback claims | verify every asset attestation, hermetically rebuild, and fault-inject update/launch/migration | pinned toolchains, all assets/attestations, disposable prior installs | `UNASSIGNED` |
| C-039 evidence integrity | blocks audit completeness, privacy, redaction, and spoof-resistance conclusions | inject denied/failed/cancelled/duplicate/spoofed/secret events and compare all sinks | isolated event/tool/provider harness and controlled OTLP collector | `UNASSIGNED` |
| C-040 extension lifecycle | limits extension compatibility, recovery, malformed-input, and isolation comparison | cross-version conformance for every transport through load/conflict/cancel/malformed/unload/rollback | fixture extensions, transport fakes, disposable process/container lab | `UNASSIGNED` |
| C-041 test qualification | blocks claims that the snapshot passed gates or matches release environments | run exact pinned CI commands and retain raw environment/output/coverage/quarantine evidence | isolated CI-equivalent Linux/Windows/macOS resources | `UNASSIGNED` |
| C-042 Dependabot inventory | blocks complete dependency-alert posture comparison | authorized security owner exports open/dismissed alerts with manifests and timestamps | repository security permission | `UNASSIGNED` |
| C-043 aggregate licensing | blocks complete redistribution/NOTICE and trademark-use conclusion | exact release-input license/NOTICE inventory plus project-specific trademark guidance | approved license tooling and legal/project-owner review | `UNASSIGNED` |

### Curiosity pass and saturation

| Candidate thread | Decision relevance | Expected value | Novelty | Cost | Disposition |
| --- | ---: | ---: | ---: | ---: | --- |
| Complete reciprocal claims/sources, normalization, and validation | 4 | 4 | 2 | 2 | pursued; required completion discriminator |
| Run target/runtime fault and exploit matrix locally | 4 | 3 | 4 | 4 | `CURIOSITY_NO_GO`: unsafe without qualified disposable isolation; preserve C-034–C-040 |
| Retry Dependabot or seek broader credentials | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: repeated request cannot overcome the recorded authorization blocker |
| Broaden release/history/post-cutoff archaeology | 1 | 1 | 2 | 4 | `CURIOSITY_NO_GO`: mutable, budget-diluting, and unable to repair exact artifact identity |
| Benchmark SmartApprove classifier ad hoc | 3 | 1 | 3 | 4 | `CURIOSITY_NO_GO`: no authorized corpus, threat model, provider protocol, or acceptance criterion |

- **Gaps after synthesis:** runtime faults, containment, classifier/annotation integrity, provider delivery, accounting reconciliation, evidence integrity, extension conformance, test results, complete release identity, alert inventory, and aggregate licensing remain explicit UNKNOWNs.
- **Contradiction retained:** the inspected snapshot, v1.47.0 release tag, and npm provenance identify three different source commits. Version-label agreement is not substituted for byte/source equivalence.
- **Saturation result:** all static decision dimensions and fourteen probes are covered; remaining consequential threads require new authority, isolation, credentials, or a separately assigned evaluation protocol.

### Handoff and stop decision

- **Owned path:** `research/harnesses/goose.md`; no other path is owned or intentionally edited.
- **Pre-existing unrelated workspace changes preserved:** `apps/plugin/opencode2/turbo.json`, `docs/architecture/`, and pre-existing `research/` state.
- **Checks:** `node research/harnesses/validate-dossiers.mjs research/harnesses/goose.md` — `PASS`; YAML parse — `PASS` (43 claims, 24 sources, 24 dimensions); reciprocal contract checker — `PASS` (30 headings, 43 claims, 24 reciprocal sources, 24 ordered dimensions, 14 probes, 10 exact UNKNOWNs, home-section citations); **URL/link-check result** — `PASS` (`23/23 HTTP 200` retrievable canonical URLs, with S-024 excluded from retry and retained as the expected authorization-blocked HTTP 403 evidence); hash-retention check — `PASS` (18 expected SHA-256 values, all 64 hex characters); safety command scan — `PASS` (24 source commands, zero target-execution/credential-pattern hits); `git diff --check -- research/harnesses/goose.md` and untracked-file no-index diagnostic check — `PASS`/no output; staged-path check — empty; owned-file check — only `research/harnesses/goose.md` was intentionally edited for this task.
- **Unresolved uncertainties:** exactly C-034–C-043; none is silently converted to a negative, zero, pass, or security acceptance.
- **Recommendation:** use this dossier only as cutoff-bounded comparison evidence. Require a non-permissive policy, external whole-process containment, exact artifact/source verification, and separately authorized dynamic qualification before any downstream safety-sensitive decision. No adoption or design decision is made.
- **Stop decision:** `STOP_COVERAGE_AND_SATURATION`. All contract sections, interfaces, probes, reciprocal records, normalized dimensions, citations, URLs, safety gates, and repository-hygiene checks pass. Further consequential evidence requires new authority, isolation, credentials, or an evaluation protocol; unsafe runtime work, repeated inaccessible endpoints, classifier benchmarking, broad archaeology, and post-cutoff behavior are `CURIOSITY_NO_GO` within this scope.
