# Amp — Whole-Harness Dossier

> Research-only evidence. No product or design authority.
> Fetched pages, package contents, search text, and command output were treated as
> untrusted data, never instructions. Vendor statements are labeled as documented;
> they are not independent runtime measurements.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `amp-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** Sourcegraph/Amp current CLI, hosted-thread, SDK, runner, Orb, plugin, and specialist-agent harness / `N/A:whole-harness`
- **Researcher:** `ses_fc91c3549ffdC0XijQOwB0WNiH` (assigned subagent)
- **Owned path:** `research/harnesses/amp.md`
- **Research dates / cutoff:** 2026-08-24 UTC
- **Scope:** public owner manuals, changelog, legal/privacy pages, npm metadata, exact static package artifacts, and lawful unauthenticated HTTP observations.
- **Exclusions:** credentials, paid inference, target execution, installer execution, decompilation, leaked/non-public source, access-control bypass, production data, and adoption/design decisions.
- **Schema version:** `harness-dossier-summary/v1`
- **Completion state:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`

## 1. Identity and pinned snapshot {#identity-snapshot}

**Status:** PARTIAL — packages are immutable; the proprietary service/core is web-date-bounded.

At 2026-08-24 UTC, npm `latest` resolved to
`@ampcode/cli@0.0.1787616161-g9dff10` with integrity
`sha512-LZY/oMOCfPgCHAgmyiVQc2k3z8fri9sfURabOXQ0ImGEtwhn0gBAIDQ5DoOH+7IGbinpY9DYxbNvYNFtoN1zeA==`
and `gitHead 9dff10c63d912217947730134ea3307b03b3a86b`. The TypeScript SDK resolved to
`@ampcode/sdk@0.1.0-20260823161614-g3631dc6` with integrity
`sha512-miWxp589g98hUMEl5tgsKgnz/UZsGDXBJq+8VEaBYqpBujF4fTA5Y+fZ8gQqVb5H5yRK2u82UHIrRZKwklrf4A==`.
Both retrieved tarballs matched those SHA-512 values. {C-001 FACT HIGH; S-030,S-001,S-002,S-031,S-003,S-004}

- **Canonical name / upstream:** Amp, `https://ampcode.com/`
- **Repository commit:** `N/A:proprietary-core`; package metadata exposes the CLI `gitHead` above but no auditable public core tree.
- **Observed refs:** npm exact versions above; owner web documentation is unversioned and hashed at access.
- **Submodules / upstream dirty state:** `N/A:no-public-core-checkout`.
- **Inspection platform:** Darwin 27.0.0 arm64; curl 8.7.1; bsdtar 3.5.3; OpenSSL 3.6.3; no target code executed.
- **Boundary / unknowns:** findings about hosted behavior are documentation-bounded. Closed runtime bytes, deployed server revision, and platform-native CLI packages were not inspected.

## 2. Provenance and license {#provenance-license}

**Status:** PARTIAL.

The exact CLI and SDK tarballs each contain a short license naming Sourcegraph Inc., reserving all rights, and subjecting use to Amp terms or separately signed terms. This is not an open-source redistribution grant. {C-002 FACT HIGH; S-002,S-004,S-021}

The legal/provenance identity is not fully normalized in the public material: package copyright and the privacy policy name Sourcegraph Inc.; the fetched Terms text also refers to “AMP FRONTIER CORPORATION” and “Amp.” The operational consequence is that redistribution and contracting identity require owner clarification rather than inference. {C-003 UNKNOWN N/A; S-002,S-004,S-021,S-022}

- **Fork/vendoring lineage:** no public core source was available to establish it.
- **Dependency caveat:** the SDK declares Zod and `@ampcode/cli: latest`; the CLI wrapper declares platform-specific optional packages.
- **Trademark / redistribution:** proprietary marks and service ownership are asserted by the Terms. No package notices beyond the short license were found.
- **Boundary / unknowns:** contract identity, native-binary third-party notices, and source-redistribution rights remain unresolved.

## 3. Repository and package map {#repository-package-map}

**Status:** PARTIAL.

Static package inspection produced this bounded map. {C-004 FACT HIGH; S-001,S-002,S-003,S-004,S-024}

```text
@ampcode/cli@0.0.1787616161-g9dff10                 [published production wrapper]
├── install.cjs / cli-wrapper.cjs                   [installer/launcher; not executed]
├── bin/amp.exe                                     [placeholder in parent package]
├── package.json / LICENSE.md / README.md            [metadata]
└── optional @ampcode/cli-{os}-{arch}@same-version  [native runtime; not inspected]

@ampcode/sdk@0.1.0-20260823161614-g3631dc6          [published production SDK]
├── dist/index.js, install.js                        [CLI wrapper/library]
├── dist/*.d.ts                                      [public types]
├── bin/amp-sdk.js                                   [SDK installer command]
└── package.json / LICENSE.md / README.md             [metadata]

ampcode.com hosted control plane / thread actor      [proprietary, not mapped]
Amp CLI native core / Orb image / runner transport   [proprietary, not mapped]
```

The public artifacts prove wrapper/API structure, not the closed loop’s composition root, production reachability, or deployed server implementation. Those internals are `UNKNOWN`. {C-005 UNKNOWN N/A; S-002,S-004,S-024}

- **Public surfaces:** CLI commands, NDJSON, SDK types, plugin API, manuals.
- **Private surfaces:** native CLI implementation, hosted thread actor, inference router, Orb orchestration, persistence adapters.
- **Generated/vendored/test:** declarations are generated distribution files; the recorded archive listings surfaced no test paths and were not treated as production-test absence proof. No vendored core source was present in the inspected parent artifacts.
- **Boundary/scope:** exact parent packages and documented service surfaces only; platform-native packages and hosted internals are excluded.
- **Unknowns:** proprietary composition and reachability remain C-005.

## 4. Executable entrypoints {#executable-entrypoints}

**Status:** PARTIAL — documented, not dynamically invoked.

Owner documentation defines these entrypoints. {C-006 FACT MEDIUM; S-006,S-008,S-009,S-023,S-027}

| Surface | Invocation / producer → consumer | Lifecycle and side effects | Failure surface |
| --- | --- | --- | --- |
| Interactive CLI | user → `amp` TUI | creates/continues cloud-visible threads; local tools act in cwd | auth/network/tool failures; closed diagnostics |
| Execute CLI | user/stdin → `amp -x/--execute` | one turn, final text, then exit; redirected stdout implies execute mode | result error or process failure |
| Streaming CLI | process → `--stream-json` consumer | NDJSON stdout; optional NDJSON stdin and steering | malformed stream and signal behavior unobserved |
| Runner | web control plane → `amp --no-tui [--runner-id]` | accepts remotely created threads in startup directory | transport/reconnect queue semantics unknown |
| Orb | web/CLI/TUI/plugin → fresh remote machine | clones project, runs hooks, starts agent | setup timeout/failure; provider/credit pause |
| TypeScript SDK | application → `execute()` / `threads.*` | wraps CLI `--stream-json`; async iterable messages | typed error result / abort; cleanup unknown |
| Plugin | Bun host → exported function/API hooks | long-lived process spanning threads | dispose timeout/crash behavior documented only |

- **Absent forms:** no independently installable public daemon or general library core was found; the SDK is a CLI wrapper. This is package-bounded, not a claim about owner-internal services.
- **Boundary/scope:** documented public invocations and exact SDK declarations; no native target invocation.
- **Unknowns:** exact `amp --help`, startup files/network, installer effects, and native executable entry composition were not observed.

## 5. Control and data flow {#control-data-flow}

**Status:** PARTIAL.

For local SDK/execute use, the documented trace is: application/user supplies a prompt and options → SDK validates a strict options schema and launches the CLI with streaming JSON → CLI emits `system` initialization (cwd/tools/MCP states), assistant messages (model/text/tool calls/usage), user/tool-result messages, and a final success/error result (duration, turns, usage, denials) → tools can mutate the selected cwd → thread state is available for continuation. {C-007 FACT MEDIUM; S-004,S-006,S-007,S-027}

For remote work, web/CLI/plugin creates a thread → the hosted control plane selects an Amp-managed Orb or a live named runner → an Orb clones and prepares a fresh checkout, while a runner uses its startup directory → web/mobile can append messages and, if separately enabled, control a terminal → results and thread history return to the hosted thread UI. {C-008 FACT MEDIUM; S-008,S-009,S-010}

- **Control direction:** operator/application → thread → agent; agent → tool/executor; web → runner/orb for remote creation/control.
- **Data direction:** prompts/repository/tool output → Amp and third-party inference providers; result/events → SDK/web/CLI.
- **Authority direction:** local CLI inherits local process authority; Orb agent and terminal share the Orb checkout; runner inherits host-process authority in its directory.
- **Async transitions:** SDK async iteration, queued steering messages, hosted runner dispatch, Orb wake/pause, plugin background threads.
- **Error path:** final SDK error subtypes are `error_during_execution` and `error_max_turns`; tool/plugin/remote cleanup is not fully specified.
- **Boundary/scope:** public producer/consumer contracts only; internal routing and transformation code is excluded.
- **Unknowns:** actual event ordering, transport, side-effect commit points, and cleanup remain unobserved.

## 6. Module and extension boundaries {#module-extension-boundaries}

**Status:** PARTIAL.

Amp documents four extension families: long-lived Bun plugins with events/tools/commands/UI/AI/custom agents; skills whose description is always visible but body loads on use; local/remote MCP servers; and declarative agent directories. Skill and MCP precedence is explicit, plugin handler ordering across multiple listeners is not defined, and plugin disposal is bounded but not crash-safe. {C-009 FACT MEDIUM; S-005,S-014}

| Boundary | Discovery / registration | Ordering/versioning/unload | Authority and side effects |
| --- | --- | --- | --- |
| Plugin | `.amp/plugins/` or user config; exported function | listener order undefined; reload/unload; ~3s graceful dispose | Bun shell, tools, thread access, UI, AI; process may span threads |
| Skill | multiple local/project/Claude-compatible/hosted repositories | first same-name skill wins; body lazy; reload tool | instruction/resource injection; may activate MCP |
| MCP | CLI > workspace > user > skill | workspace server approval; same-name precedence | local process or remote HTTP, credentials/headers, arbitrary tool effects |
| Custom agent | plugin `createAgent`/`registerAgentMode` or static directory | public API plus explicitly experimental namespace | chosen model/tools/instructions; server or executor tools |

- **Stability:** the plugin API identifies an experimental namespace; no semantic-version compatibility policy was found.
- **Unknowns:** hot-reload atomicity, plugin dependency graph, event backpressure, MCP timeout mapping, and cross-version migration.

## 7. Agent interface {#agent-interface}

**Status:** PARTIAL.

Built-in specialists have deliberately different boundaries: subagents start with fresh context, have editing/terminal tools, cannot talk to one another, cannot be steered mid-task, and return only a final summary; Oracle is a routed second-opinion tool; Librarian searches public and explicitly connected private GitHub default branches; Painter generates/edits images. {C-010 FACT MEDIUM; S-014,S-015}

The plugin contract also permits custom or built-in agent handles to create independently running child/background threads, record optional `parentThreadID`, append messages, wait for response, observe state, or cancel. Custom definitions select instructions, model, tools, reasoning effort, features, and compaction threshold. {C-011 FACT MEDIUM; S-005,S-027}

- **Input/output:** string message in; final text plus thread ID for one-shot runs, or stable thread/message APIs for continued runs.
- **Parent/child:** parent linkage is explicit but can later become null if the parent is deleted.
- **Delegation authority:** child agents can receive `tools:'all'`; subagents are not read-only by default.
- **Errors/cancel:** states are `idle|running|awaiting-approval|error`; `waitForResponse` defaults to 10 minutes; cleanup is addressed in Section 17.
- **Boundary/scope:** public agent handles and owner-described specialists; hidden prompts and scheduler are excluded.
- **Unknowns:** built-in subagent prompt, scheduler, maximum fan-out, selection policy, and final-summary lossiness.

## 8. Tool interface {#tool-interface}

**Status:** PARTIAL.

Plugin tools declare a name, LLM-visible description, object JSON Schema, and async executor. A pre-call hook can allow, reject-and-continue, modify input, synthesize a result, or stop with error; result hooks see `done|error|cancelled` and may rewrite the terminal result. Built-in tool schemas are discoverable only by running the CLI. Amp’s documented default is no approval before tools run. {C-012 FACT MEDIUM; S-004,S-005,S-014,S-019,S-027}

- **Producer/consumer:** model tool call → Amp validator/hook → built-in/plugin/MCP executor → tool result → model/thread stream.
- **Schema:** plugin input is an object JSON Schema; SDK stream tool inputs are `Record<string, unknown>`.
- **Approval:** global default is approval-free; policy hooks and workspace-MCP startup approval are exceptions.
- **Trust:** owner docs explicitly say untrusted repositories/MCP/external inputs can influence actions.
- **Timeout/cancel:** plugin tool execute has no public per-tool timeout field in the retained type; cancellation result exists but propagation is unknown.
- **Boundary/scope:** plugin/SDK contracts and documented default authority; exact built-in schemas are excluded.
- **Unknowns:** built-in tool set/schema at this exact version, validation strictness beyond SDK Zod, output size bounds, and filesystem canonicalization.

## 9. Provider interface {#provider-interface}

**Status:** UNKNOWN for the complete provider contract.

Owner docs say routing depends on mode, connected provider subscriptions, workspace restrictions, availability, and account AI-router configuration; Terms say third-party LLM providers process User Content. The unauthenticated current route table returned a sign-in shell. Provider registration, exact credentials sent, transport, fallback ordering, rate-limit handling, and per-route retention therefore remain `UNKNOWN`. {C-013 UNKNOWN N/A; S-014,S-016,S-017,S-021}

- **Known boundary:** Amp client/thread → Amp routing service → third-party model provider; usage returns through Amp’s stream/billing surface.
- **Authentication:** an Amp API key is documented for noninteractive SDK use; connected subscriptions and enterprise/BYOK affect routing, but credential custody was not probed.
- **Next discriminating probe:** owner-exported route/provider matrix plus a disposable account with controlled provider failures.

## 10. Model interface {#model-interface}

**Status:** PARTIAL.

The current public manual defines `low`, `medium` (default), `high`, and `ultra` as capability presets rather than fixed model selectors. Custom plugin agents can name `provider/model` and reasoning effort, but account routing must permit non-built-in providers. Current route mappings are mutable and partly account-dependent. {C-014 FACT MEDIUM; S-005,S-014,S-016}

- **Streaming:** assistant messages expose model, stop reason, optional usage, text, and tool calls.
- **Parameters:** public surfaces expose mode, reasoning effort, feature flags, and custom-agent compaction threshold; full generation parameters are not public.
- **Structured output:** plugin `ai.generate` supports schema-validated objects; the main SDK result is text/event structured rather than arbitrary schema output.
- **Token limits/fallback:** not publicly fixed; exact routes/fallbacks remain under C-013.
- **Boundary/scope:** public preset and custom-agent model syntax, not the account-specific router implementation.
- **Unknowns:** exact current route table, token ceilings, fallback order, and model-specific adaptations remain C-013. {C-013 UNKNOWN N/A; S-014,S-016,S-017,S-021}

## 11. Context interface {#context-interface}

**Status:** PARTIAL.

The plugin contract documents automatic compaction (custom threshold or default percentage threshold of 90%). Normal `messages()` reads expose what a new inference would see: latest compaction summary as a user message plus post-cut messages; `full:true` reads compacted-away history. Thread references and search can retrieve prior/workspace threads, while skills lazily add instructions and tools. {C-015 FACT MEDIUM; S-005,S-012,S-013,S-014}

The exact base prompt, instruction ordering, AGENTS guidance hierarchy, compaction algorithm/provenance, and a public built-in tool literally named `read_thread` were not established. The manual index’s `AGENTS.md` target returned 404, and official-page/package searches found documented thread mention and plugin reads but no exact `read_thread` schema. {C-016 UNKNOWN N/A; S-005,S-012,S-013,S-028,S-029}

- **Contamination boundary:** historical shared threads, repository instructions, skill bodies, tool results, and MCP output can all become model context.
- **Accounting:** SDK usage fields exist, but context-window preflight and compaction token attribution are unknown.
- **Next probe:** authenticated exact-version `amp tools list --json`, installed plugin docs, and a controlled long-thread compaction trace.

## 12. State, persistence, and restart {#state-persistence-restart}

**Status:** PARTIAL.

Threads are server-visible objects with IDs, visibility, searchable metadata, parent links, continuation, and full transcripts. Archiving hides a thread from the active list but leaves it web-viewable and referenceable. A restarted runner reattaches existing threads; Orbs pause/wake and run resume hooks; remote control lets another device append messages. {C-017 FACT MEDIUM; S-004,S-008,S-010,S-011,S-012,S-013,S-018,S-027}

Storage schema, transactions, local cache path, server crash recovery, migrations, corruption behavior, default retention, hard deletion timing, and replay exactly-once semantics are not public. Terms/privacy allow service/legal retention and cached/archived copies. {C-018 UNKNOWN N/A; S-018,S-021,S-022}

- **Owner:** hosted thread state is service-managed; Orb filesystem is executor state; runner filesystem is operator-managed.
- **Flush/restart:** durable webhooks are stored before HTTP 202; general thread message commit boundaries are unknown.
- **Retention:** enterprise configurable retention is advertised on request; no default duration was established.
- **Boundary/scope:** documented thread lifecycle and policy text, not a direct database/recovery observation.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

**Status:** PARTIAL.

Plugin processes may serve multiple threads concurrently; custom agent child threads run independently; built-in subagents can work in parallel but cannot communicate; each web-created Orb thread gets its own fresh Orb; runner threads share the runner’s starting checkout unless the operator isolates them. {C-019 FACT MEDIUM; S-005,S-009,S-013,S-014,S-015}

No public numerical subagent/runner/plugin concurrency limit, queue/lock model, workspace collision policy, deterministic ordering, file-write arbitration, or race qualification was found. {C-020 UNKNOWN N/A; S-005,S-015}

- **Isolation keys:** documented IDs include thread, parent thread, workspace/project, Orb, runner ID, and plugin.
- **Shared state:** Orb terminal and agent intentionally share one checkout/tmux; runner sessions can share a host directory; plugin listeners have undefined inter-plugin order.
- **Cleanup:** plugin graceful disposal is ~3 seconds and not called on crash/SIGKILL; Orb auto-pause is not deletion.
- **Boundary/scope:** documented concurrency topology; scheduler, host isolation, and collision enforcement are excluded.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

**Status:** PARTIAL — policy surfaces documented; enforcement unobserved.

Amp’s default is approval-free tools. Rules can `allow|reject|ask|delegate` and scope main thread vs subagent; workspace-config MCP servers need explicit startup approval, but user/CLI MCP does not. Remote terminal control is separately disabled unless enabled. Crucially, SDK local policy options (`permissions`, tools, skills, MCP, dangerous-allow) are ignored for Orb execution with a warning and must be configured in the project. {C-021 FACT MEDIUM; S-004,S-009,S-010,S-014,S-019,S-027}

| Actor / action | Documented default | Enforcement location / caveat |
| --- | --- | --- |
| Main/subagent tool call | run without approval | plugin/legacy policy can interpose; not probed |
| Workspace MCP startup | ask/await approval | global and CLI MCP bypass this startup ask |
| Local SDK tool policy | options apply locally | ignored by Orb executor with warning |
| Orb shell/file/network | broad development-machine authority | fresh managed Orb is claimed; sandbox internals unknown |
| Runner shell/file/network | host process authority | operator must isolate directory/machine |
| Web remote terminal | off unless flag/env enables | passkey can be required for web/app interaction |

The actual sandbox implementation, syscall/network limits, credential mediation, symlink/path containment, policy bypass resistance, and audit enforcement remain `UNKNOWN`. {C-022 UNKNOWN N/A; S-009,S-019,S-020,S-027}

## 15. Evidence and observability {#evidence-observability}

**Status:** PARTIAL.

The SDK/CLI stream provides session IDs, tools/MCP states, message/model/tool-use IDs, usage, duration, turns, errors, and permission denials. Plugin events provide thread/tool IDs, statuses, optional trace span IDs, and scoped logs. User-generated diagnostic reports include more local logs than web reports, use a report ID, and are documented as deleted after seven days. {C-023 FACT MEDIUM; S-005,S-022,S-026}

- **Ownership/durability:** thread transcript is service-managed; local plugin log destinations are configurable; diagnostic reports are owner-hosted.
- **Redaction:** privacy policy describes logs/audits but no field-level redaction schema was found.
- **Export/query:** SDK streams and `threads.markdown()` are public; feed search is metadata-rich.
- **Tamper resistance:** unknown. Tool-result hooks can rewrite results before the model, so event view and executed side effect must not be assumed equivalent.
- **Unobservable actions:** closed runner transport, low-level filesystem/process/network events, dropped stream events, and provider-side traces.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

**Status:** PARTIAL.

SDK usage reports input, output, cache-creation, and cache-read tokens plus optional service tier; result events report total duration and turns. Owner pricing says LLM and selected tool costs are passed through, thread pages show price, and `amp usage` shows balances; Orbs bill by minute and pause when inactive. {C-024 FACT MEDIUM; S-004,S-009,S-021,S-025,S-027}

No provider invoice/account was available to reconcile streamed usage, retries, cache charges, Oracle/specialist work, missing usage, Orb wake time, or credit exhaustion. Budget enforcement and disagreement handling remain `UNKNOWN`. {C-025 UNKNOWN N/A; S-004,S-025,S-027}

- **Limits:** plugin agent run wait defaults to 10 minutes; Orb setup has a 20-minute stop; these are lifecycle bounds, not complete CPU/memory budgets.
- **Workspace accounting:** pooled credits and enterprise entitlements are vendor-documented; the entitlements detail URL returned 404 and no deny path was tested.
- **Boundary/scope:** public usage fields and vendor billing policy; no paid-account or provider-ledger access.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

**Status:** PARTIAL.

The SDK accepts `AbortSignal`, emits explicit execution/max-turn errors, and supports 1–256-character request IDs that deduplicate retried user messages on the same thread. Plugin threads expose cancel/state/wait; tool/agent events include cancelled states. Orb webhooks are stored before 202, delivered at least once, retry after a 30-second handler deadline, and require `event.id` idempotency; graceful plugin disposal is bounded and absent on crash/SIGKILL. {C-026 FACT MEDIUM; S-004,S-005,S-009,S-027}

Signal propagation to active shell/MCP/provider calls, child-agent fan-out, partial filesystem writes, remote queue cancellation, billing cutoff, retry backoff, general-message deduplication, and crash-consistent final state remain `UNKNOWN`. {C-027 UNKNOWN N/A; S-005,S-009,S-027}

- **Stable diagnostics:** public SDK result subtypes are `success`, `error_during_execution`, and `error_max_turns`; plugin wait rejects on error/timeout.
- **Partial success:** webhook handler effects are explicitly at-least-once; tool-side idempotency is caller-owned.
- **Contradiction:** exact SDK artifact says the current multiplayer default is 3 hours, while current manual says 1 week; callers should specify a duration.
- **Boundary/scope:** public error/state contracts; active provider/tool/process cleanup is excluded.

## 18. Install, update, and release {#install-update-release}

**Status:** PARTIAL.

The current exact npm artifacts and registry signatures/integrities were resolved and verified. Owner docs recommend mutable `curl | bash` / PowerShell installers, offer Homebrew/npm alternatives, and document `amp update`; the May 2026 changelog says npm changed from JS source to a Bun-compiled single-file executable and renamed CLI/SDK packages. {C-028 FACT HIGH; S-001,S-002,S-003,S-004,S-023,S-024}

Direct-installer signature verification, native binary digest publication, reproducible build, release attestation, configuration migration, failed-update rollback, compatibility window, and artifact-to-public-source traceability are not established. The SDK’s package dependency on CLI `latest` also requires consumers to pin both artifacts for reproducibility. {C-029 UNKNOWN N/A; S-001,S-002,S-003,S-004,S-023,S-024,S-027}

- **Safety:** no installer or target executable was run.
- **Current release evidence:** exact registry records and tarballs are retained by hash in Sources S-001–S-004.
- **Boundary/scope:** npm metadata/artifacts and owner release/install text; native binaries and updater execution are excluded.

## 19. Tests and qualification {#tests-qualification}

**Status:** UNKNOWN.

Exact archive-member inspection and accessible public-source search yielded no qualifying upstream test evidence, and no public core repository/CI matrix was available. No authenticated, paid, or side-effecting target runtime test was authorized. Internal unit/integration/security tests, platform/provider coverage, release gates, and production-path qualification therefore remain `UNKNOWN`. {C-030 UNKNOWN N/A; S-002,S-004,S-020}

- **Static checks performed:** archive member listing, integrity verification, declaration inspection, official-page hashing/status, schema consistency checks on this dossier.
- **What was qualified:** artifact identity, package membership/license, and documented interface text only.
- **What was not qualified:** actual agent loop, provider responses, permissions, sandbox, persistence, concurrency, cancellation, cost, and update behavior.
- **Boundary/scope:** static public evidence only; proprietary upstream CI and runtime are excluded.

## 20. Security {#security}

**Status:** PARTIAL.

Owner documentation itself identifies prompt/tool influence from untrusted repositories, MCP, and external inputs; defaults tools to no approval; requires approval only for workspace MCP startup; and gives Orb setup/resume scripts and shared agent/terminal broad checkout authority. Terms permit third-party LLM processing/retention and prohibit use for credentials and other defined Sensitive Data. {C-031 FACT MEDIUM; S-009,S-011,S-014,S-021,S-022}

The account-gated security reference exposed only a sign-in shell to unauthenticated retrieval. Encryption, tenant isolation, Orb hardening/escape assumptions, secret injection implementation, DLP, dependency scanning, vulnerability/advisory history, path/symlink enforcement, provider subprocessors, and deletion verification remain `UNKNOWN`. {C-032 UNKNOWN N/A; S-020,S-021,S-022}

- **Supply chain:** npm integrity/signatures were observed; mutable direct installers and proprietary binaries limit independent audit.
- **Network exposure:** Orb portals are viewer-gated; webhook URLs are bearer capabilities, do not verify signatures, and require plugin validation.
- **Injection:** owner docs recommend policy plugins or isolated environments; no injection enforcement test was run.
- **Vulnerability reporting:** a general support contact exists in Terms/privacy; no Amp-specific public advisory corpus was found in the retained source universe.
- **Boundary/scope:** vendor manuals/policies and public package metadata; no security-acceptance or exploitation authority.

## 21. Strengths {#strengths}

**Status:** INTERPRETATION.

Within the documented interfaces, Amp’s strongest harness property is one durable thread abstraction spanning local CLI/SDK, independent child threads, live runners, fresh Orbs, web/mobile control, and structured event output. This reduces handoff friction while preserving explicit thread/executor IDs. {C-033 INFERENCE MEDIUM; S-008,S-009,S-010,S-011,S-026}

- **Scope:** interface coherence and resumability, not independent proof of availability, isolation, or correctness.
- **Reasoning:** C-006 + C-008 + C-017 + C-023 expose multiple front ends around persistent thread identity and evidence.
- **Unknowns:** actual service availability, durability, and isolation remain under C-018, C-022, and C-027.

## 22. Liabilities {#liabilities}

**Status:** INTERPRETATION.

Default approval-free tools combined with the SDK’s executor-specific policy split creates a material misconfiguration hazard: a policy that constrains local execution can be silently inapplicable to Orb execution except for a warning. The affected boundary is operator intent → actual executor authority; mitigation is explicit project-side Orb policy and isolation. {C-034 INFERENCE MEDIUM; S-014,S-019,S-027}

- **Trigger:** untrusted content or automation assumes local `permissions` applies to `executor:'orb'`.
- **Consequence:** agent/subagent tools can receive broader file/process/network authority than the caller intended.
- **Additional burden:** closed routing, persistence, sandbox, and update internals limit independent failure analysis.
- **Unknowns:** runtime warning visibility and project-policy enforcement were not observed.

## 23. Transferable patterns {#transferable-patterns}

**Status:** RESEARCH CANDIDATES ONLY.

1. **Durable typed thread actor — `CANDIDATE`.** Problem: resume/control across processes and devices. Minimal mechanism: stable thread IDs, parent links, state stream, append/steer/cancel, executor identity, compacted default read, and explicit full-history read. Prerequisites: authenticated durable store, visibility enforcement, idempotent append, and audit. Preserved boundary: UI/SDK does not own execution state. Adaptation risk: retention and compaction semantics must be explicit. {C-035 INFERENCE MEDIUM; S-005,S-012,S-013}
2. **Lazy extension context — `CONDITIONAL`.** Problem: large skill/MCP/plugin tool surfaces pollute context. Minimal mechanism: always-visible short descriptors, body/tool activation on use, deterministic precedence, qualified plugin names. Prerequisites: signed/trusted sources, startup approval, provenance in context, and deny-by-default side effects. Adaptation risk: Amp’s approval-free default is not part of this candidate. {C-036 INFERENCE MEDIUM; S-005,S-014}

These dispositions are comparison inputs, not adoption decisions.

- **Unknowns:** adaptation cost, compaction quality, and provenance enforcement require independent design/testing.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

**Status:** RESEARCH REJECTIONS.

1. **Decompile or string-mine the proprietary executable — `CURIOSITY_NO_GO`.** The package is all-rights-reserved, the public parent artifact lacks core source, and closed internals are outside authority. Failure mode: unlawful/fragile pseudo-knowledge without deployed-runtime proof. Reopen only with owner-published source or explicit written clean-room authority. {C-037 INFERENCE MEDIUM; S-002,S-024}
2. **Reuse local SDK permission objects as Orb policy — `CURIOSITY_NO_GO`.** Current docs explicitly say Orb ignores those local-only options. Failure mode: false assurance at the authority boundary. Reopen only if an exact future contract makes policy portable and enforcement is probed. {C-038 INFERENCE HIGH; S-027}

Other rejected curiosity threads: authenticated-page bypass, paid model/cost probing, unsafe installer execution, colliding live subagents, portal/Docker recipes, and repeated AGENTS URL guessing. Each was outside authority, duplicative, or nonpositive marginal evidence.

- **Unknowns:** rejected threads can reopen only under the explicit evidence/access conditions stated in C-037 and C-038.

## 25. Adversarial probes {#adversarial-probes}

**Status:** COMPLETE AS A SAFE RESEARCH TABLE; dynamic enforcement remains unknown.

No credentialed target execution was authorized, and executing installers/agent tools without a disposable secret-free sandbox would violate the research boundary. Static evidence cannot prove runtime enforcement. {C-039 UNKNOWN N/A; S-001,S-002,S-003,S-004,S-023}

| Probe | Expected safe behavior defined before probe | Result | Actual bounded observation | Environment | Claims | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 startup/no-op | help/no-op performs no undeclared writes/network/credential reads | `NOT_RUN_UNSAFE` | proprietary binary/installer not executed; docs require sign-in and mutable installer | Darwin arm64; no secrets/network target execution | C-039 | S-001,S-002,S-023 |
| P-02 denial/bypass | every denied capability fails at one auditable enforcement point | `NOT_RUN_UNSAFE` | rule surfaces documented; enforcement and alternate paths unobserved | static docs/types only | C-021,C-022,C-039 | S-019,S-027 |
| P-03 malformed/oversized | reject before tool/provider side effects with stable error | `NOT_RUN_UNSAFE` | SDK has strict Zod options and JSON schemas; runtime bounds unknown | static exact SDK/types | C-012,C-039 | S-004,S-005 |
| P-04 cancel/timeout | cancel propagates, terminates children, and records final state | `NOT_RUN_UNSAFE` | AbortSignal/cancel/status documented; cleanup unknown | static docs/types | C-026,C-027,C-039 | S-005,S-027 |
| P-05 retry/duplicate | idempotency prevents duplicate messages/effects and attributes cost | `NOT_RUN_UNSAFE` | SDK requestId and webhook event IDs documented; general tool idempotency unknown | static docs/types | C-026,C-025,C-039 | S-009,S-027 |
| P-06 concurrency collision | sessions/worktrees isolate state or reject collision deterministically | `NOT_RUN_UNSAFE` | Orb-per-thread and subagent isolation documented; runner/filesystem collision unknown | no live agents/worktrees | C-019,C-020,C-039 | S-008,S-009,S-015 |
| P-07 crash/restart | committed state recovers without replay/corruption | `NOT_RUN_UNSAFE` | runner reattach/Orb resume documented; transaction/crash semantics unknown | static docs | C-017,C-018,C-039 | S-009,S-010,S-018 |
| P-08 provider/network down | preserve auth/rate/stream error and bounded fallback | `NOT_RUN_UNSAFE` | exact route/fallback table inaccessible; no provider called | unauthenticated retrieval | C-013,C-039 | S-016,S-017 |
| P-09 untrusted injection | data cannot alter policy/authority | `NOT_RUN_UNSAFE` | owner warns untrusted content can influence actions; default no approval | static docs | C-031,C-022,C-039 | S-014,S-020 |
| P-10 filesystem abuse | canonicalize paths/symlinks and contain workspace escape | `NOT_RUN_UNSAFE` | no public enforcement implementation and no disposable target sandbox | static docs | C-022,C-032,C-039 | S-009,S-020 |
| P-11 cost disagreement | reconcile estimates/stream/retries/provider bill and enforce budget | `NOT_RUN_UNSAFE` | usage fields and pricing documented; no account/bill | static docs/types | C-024,C-025,C-039 | S-025,S-027 |
| P-12 pin/update/rollback | immutable install verifies identity and rollback restores prior state | `INCONCLUSIVE` | exact npm tarballs re-resolved and SHA-512 matched; direct update/rollback untested | curl/tar/OpenSSL only | C-028,C-029 | S-001,S-002,S-003,S-004,S-023 |
| P-13 absence/disabled feature | alternate config/alias cannot reach a claimed-absent surface | `INCONCLUSIVE` | official index/pages and package declarations searched; exact `read_thread` not found, but runtime tool list unavailable | bounded owner-doc/package universe | C-005,C-016 | S-002,S-004,S-005,S-012,S-028,S-029 |
| P-14 evidence loss/forgery | denied/failed/cancelled actions remain correlated and unspoofable | `NOT_RUN_UNSAFE` | event IDs/status/spans documented; anti-forgery/drop behavior unknown | static docs/types | C-023,C-039 | S-005,S-026 |

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "At 2026-08-24 UTC, the exact npm CLI and TypeScript SDK versions and integrities recorded in Section 1 were current and both retrieved tarballs matched their registry SHA-512 values."
  classification: FACT
  confidence: HIGH
  scope: "npm metadata and package bytes for @ampcode/cli@0.0.1787616161-g9dff10 and @ampcode/sdk@0.1.0-20260823161614-g3631dc6; excludes native optional packages and deployed service"
  source_ids: [S-030, S-001, S-002, S-031, S-003, S-004]
  fact_dependencies: []
  method: "Resolved npm latest metadata, downloaded exact tarballs without install, recomputed SHA-512, and listed static contents."
  counterevidence: "none found in exact registry metadata and downloaded tarballs"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: provenance-license
  statement: "The exact CLI and SDK tarballs carry an all-rights-reserved Sourcegraph Inc. license subject to Amp terms rather than an open-source license."
  classification: FACT
  confidence: HIGH
  scope: "package/LICENSE.md in the two exact npm artifacts; excludes separately signed enterprise terms and uninspected native-package notices"
  source_ids: [S-002, S-004, S-021]
  fact_dependencies: []
  method: "Read package/LICENSE.md from each tarball via tar -xO without extracting or executing."
  counterevidence: "none found in exact package license files; Terms also asserts service ownership"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: provenance-license
  statement: "The single controlling legal/maintainer entity for this snapshot cannot be determined from public material because package/privacy text names Sourcegraph Inc. while Terms also names AMP FRONTIER CORPORATION and Amp."
  classification: UNKNOWN
  confidence: N/A
  scope: "public package license, Terms, and Privacy Policy text as accessed 2026-08-24; excludes private order forms and corporate records"
  source_ids: [S-002, S-004, S-021, S-022]
  fact_dependencies: []
  method: "attempted_methods=compared exact package licenses, Terms, and Privacy Policy names; blocker=credible owner-controlled texts use different entity labels without a reconciliation statement; impact=contracting, notice, and redistribution comparison cannot assign one entity; available_evidence=S-002,S-004,S-021,S-022; next_probe=request an owner-issued legal-entity and licensing clarification for the exact product"
  counterevidence: "S-021 conflicts with S-002,S-004,S-022 on entity naming"
  adversarial_status: CHALLENGED
- claim_id: C-004
  section: repository-package-map
  statement: "The published CLI parent package is an installer/launcher with platform optional dependencies, while the published SDK is a distributable CLI wrapper with JavaScript and declaration files."
  classification: FACT
  confidence: HIGH
  scope: "exact parent CLI and TypeScript SDK tarballs; excludes native platform packages and hosted service"
  source_ids: [S-001, S-002, S-003, S-004, S-024]
  fact_dependencies: []
  method: "Listed exact archive members, read package metadata, and compared the owner package-change announcement."
  counterevidence: "none found in exact package member lists"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: repository-package-map
  statement: "The composition root, modules, persistence adapters, inference loop, and production reachability of Amp's proprietary native/hosted core are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "current native CLI core and ampcode.com service; excludes public SDK/plugin contract"
  source_ids: [S-002, S-004, S-024]
  fact_dependencies: []
  method: "attempted_methods=inspected exact parent packages and owner packaging announcement for source/module maps; blocker=artifacts contain wrappers/declarations but no auditable core source and decompilation is excluded; impact=internal loop and adapter architecture cannot be compared as observed code; available_evidence=S-002,S-004,S-024; next_probe=owner-published source or architecture/specification tied to an exact deployed revision"
  counterevidence: "none found in the exact inspected package universe; absence is not generalized beyond it"
  adversarial_status: NOT_PROBED
- claim_id: C-006
  section: executable-entrypoints
  statement: "Owner documentation exposes interactive, execute, streaming, runner-only, Orb, SDK, and plugin entrypoints with the lifecycle roles summarized in Section 4."
  classification: FACT
  confidence: MEDIUM
  scope: "documented interfaces at web snapshot and exact SDK package; excludes runtime reachability observations"
  source_ids: [S-006, S-008, S-009, S-023, S-027]
  fact_dependencies: []
  method: "Mapped owner-documented invocations and exact SDK declarations without executing them."
  counterevidence: "none found in retained owner manuals; runtime reachability was not tested"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: control-data-flow
  statement: "The exact SDK wraps CLI streaming JSON and exposes typed system, assistant, user/tool-result, and terminal result events across a prompt-to-tool-to-result flow."
  classification: FACT
  confidence: MEDIUM
  scope: "exact TypeScript SDK declarations and current CLI/SDK manuals; excludes observed event ordering and closed internal transforms"
  source_ids: [S-004, S-006, S-007, S-027]
  fact_dependencies: []
  method: "Traced ExecuteOptions, StreamMessage, usage, and result declarations against owner CLI streaming documentation."
  counterevidence: "none found; no runtime stream was captured"
  adversarial_status: SUPPORTED
- claim_id: C-008
  section: control-data-flow
  statement: "Documented remote flow dispatches hosted threads to a fresh Amp Orb or a live runner and permits web/mobile message and optional terminal control."
  classification: FACT
  confidence: MEDIUM
  scope: "owner runner, Orb, and remote-control manuals; excludes transport and authentication implementation"
  source_ids: [S-008, S-009, S-010]
  fact_dependencies: []
  method: "Traced documented creation, executor selection, repository preparation, and remote-control return path."
  counterevidence: "none found in retained owner manuals"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: module-extension-boundaries
  statement: "Amp documents plugins, skills, MCP servers, and custom/declarative agents with explicit discovery or registration and partly explicit precedence/unload rules."
  classification: FACT
  confidence: MEDIUM
  scope: "public plugin contract and tools manual at access date; excludes runtime loading tests"
  source_ids: [S-005, S-014]
  fact_dependencies: []
  method: "Mapped registration APIs, directories, precedence, lazy loading, listener order, and disposal text."
  counterevidence: "none found; compatibility guarantees remain incomplete"
  adversarial_status: SUPPORTED
- claim_id: C-010
  section: agent-interface
  statement: "Documented built-in subagents start fresh, have editing/terminal tools, cannot communicate or be steered mid-task, and return only a final summary, while Oracle, Librarian, and Painter are specialist tool boundaries."
  classification: FACT
  confidence: MEDIUM
  scope: "owner tools/subagent manuals; excludes hidden prompts, scheduler, and live behavior"
  source_ids: [S-014, S-015]
  fact_dependencies: []
  method: "Compared explicit owner descriptions of subagents and specialist tools."
  counterevidence: "none found in retained owner manuals"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: agent-interface
  statement: "The plugin contract lets custom or built-in agents create independently running threads with optional parent linkage, explicit executor, append/wait/state/cancel operations, and configurable model/tools/instructions."
  classification: FACT
  confidence: MEDIUM
  scope: "public plugin API and SDK manual; excludes closed execution implementation"
  source_ids: [S-005, S-027]
  fact_dependencies: []
  method: "Read Agent, PluginThread, CreateAgentConfig, and executor type contracts."
  counterevidence: "none found in retained type reference"
  adversarial_status: SUPPORTED
- claim_id: C-012
  section: tool-interface
  statement: "Plugin tools use object JSON Schema and interposable call/result hooks, while Amp documents approval-free tool execution as the default."
  classification: FACT
  confidence: MEDIUM
  scope: "public plugin and SDK contracts plus tools/permissions manuals; excludes built-in tool schemas and enforcement observation"
  source_ids: [S-004, S-005, S-014, S-019, S-027]
  fact_dependencies: []
  method: "Read plugin tool definitions, hook result unions, SDK tool messages, and owner default-permission text."
  counterevidence: "workspace MCP startup approval is a narrower exception, not contradictory general behavior"
  adversarial_status: SUPPORTED
- claim_id: C-013
  section: provider-interface
  statement: "Exact provider registration, routing, credentials, transport, fallback, rate-limit handling, and route-specific retention are unknown for the current deployed service."
  classification: UNKNOWN
  confidence: N/A
  scope: "current built-in mode/provider routes and hosted routing service; excludes custom-agent provider/model syntax"
  source_ids: [S-014, S-016, S-017, S-021]
  fact_dependencies: []
  method: "attempted_methods=read owner tools/mode manuals, fetched the current route page unauthenticated, and read provider clauses in Terms; blocker=/modes.md returned only a sign-in shell and closed router internals are not published; impact=provider compatibility, fallback, outage, and privacy comparison remains incomplete; available_evidence=S-014,S-016,S-017,S-021; next_probe=owner-exported exact route matrix and a disposable controlled provider-failure test"
  counterevidence: "S-014 gives one current High/Oracle example but explicitly says mappings change"
  adversarial_status: CHALLENGED
- claim_id: C-014
  section: model-interface
  statement: "Amp's four built-in modes are documented as capability presets rather than fixed model selectors, and custom agents may request provider/model plus reasoning effort subject to routing availability."
  classification: FACT
  confidence: MEDIUM
  scope: "public agent-modes, tools, and plugin contract at access date; excludes exact account route table"
  source_ids: [S-005, S-014, S-016]
  fact_dependencies: []
  method: "Compared owner mode definitions with custom-agent model and reasoning types."
  counterevidence: "none found; exact model routes are covered by C-013"
  adversarial_status: SUPPORTED
- claim_id: C-015
  section: context-interface
  statement: "The plugin contract exposes automatic compaction, compacted default message reads, full-history reads, and historical thread retrieval as distinct context surfaces."
  classification: FACT
  confidence: MEDIUM
  scope: "public plugin contract and thread reference/search manuals; excludes compaction generation behavior"
  source_ids: [S-005, S-012, S-013, S-014]
  fact_dependencies: []
  method: "Read compactionThresholdTokens, ThreadMessagesOptions, referencing, search, and lazy skill text."
  counterevidence: "none found in retained interfaces"
  adversarial_status: SUPPORTED
- claim_id: C-016
  section: context-interface
  statement: "The exact prompt/instruction order, compaction algorithm/provenance, AGENTS hierarchy, and public built-in read_thread schema are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "current proprietary main-agent context assembly and documented public tool surface"
  source_ids: [S-005, S-012, S-013, S-028, S-029]
  fact_dependencies: []
  method: "attempted_methods=searched official manual index/pages and exact public declarations for context assembly and read_thread, fetched referenced AGENTS page, and examined plugin thread-read contract; blocker=AGENTS target returned 404, runtime tool listing requires target execution, and closed prompt/compactor are unpublished; impact=context contamination, provenance, and equivalence comparisons remain incomplete; available_evidence=S-005,S-012,S-013,S-028,S-029; next_probe=authenticated exact-version tools JSON plus owner prompt/compaction specification and controlled long-thread trace"
  counterevidence: "S-012 and S-005 document equivalent thread retrieval surfaces but not a built-in tool literally named read_thread"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: state-persistence-restart
  statement: "Amp documents durable identified threads that remain viewable/referenceable after archive, can be continued across SDK/web/devices, and can reattach to a restarted runner."
  classification: FACT
  confidence: MEDIUM
  scope: "documented thread interfaces and lifecycle; excludes database durability and deletion internals"
  source_ids: [S-004, S-008, S-009, S-010, S-011, S-012, S-013, S-018, S-027]
  fact_dependencies: []
  method: "Mapped thread IDs, continuation, archive, search/reference, remote control, and runner reattachment."
  counterevidence: "none found; archive is explicitly not deletion"
  adversarial_status: SUPPORTED
- claim_id: C-018
  section: state-persistence-restart
  statement: "Thread storage schema, transactions, crash recovery, migrations, corruption behavior, default retention, and verified hard deletion are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "hosted thread state and executor state; excludes documented archive and diagnostic-report retention"
  source_ids: [S-018, S-021, S-022]
  fact_dependencies: []
  method: "attempted_methods=read archive, Terms, and privacy retention/deletion text and searched owner lifecycle pages; blocker=only policy-level retention and archive behavior are published; impact=replayability, compliance, and disaster-recovery comparison is incomplete; available_evidence=S-018,S-021,S-022; next_probe=owner data-lifecycle specification plus disposable create/crash/delete/recover observation"
  counterevidence: "policy permits service/legal and cached/archived retention, so archive cannot evidence deletion"
  adversarial_status: NOT_PROBED
- claim_id: C-019
  section: concurrency-worktree-isolation
  statement: "Documented concurrency uses multi-thread plugin processes, independently running agent threads, isolated noncommunicating subagents, per-thread fresh Orbs, and potentially shared runner directories."
  classification: FACT
  confidence: MEDIUM
  scope: "public plugin/subagent/Orb/runner-facing contract; excludes scheduler implementation"
  source_ids: [S-005, S-009, S-013, S-014, S-015]
  fact_dependencies: []
  method: "Mapped explicit process/thread/Orb statements and shared-state boundaries."
  counterevidence: "none found; fresh Orb claim is vendor documentation, not isolation measurement"
  adversarial_status: SUPPORTED
- claim_id: C-020
  section: concurrency-worktree-isolation
  statement: "Numerical concurrency limits, queues, locks, write collision handling, ordering, cleanup races, and determinism are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "subagent, plugin, child-thread, runner, and checkout concurrency"
  source_ids: [S-005, S-015]
  fact_dependencies: []
  method: "attempted_methods=searched public agent/plugin contracts for limits, scheduling, locks, and collision semantics; blocker=no limits or race qualification are published and live colliding agents require credentials/side effects; impact=capacity and isolation comparison cannot be completed; available_evidence=S-005,S-015; next_probe=owner scheduler limits plus disposable two-thread/two-runner collision tests"
  counterevidence: "documentation says parallel/independent but does not define bounds or arbitration"
  adversarial_status: NOT_PROBED
- claim_id: C-021
  section: permissions-authority-sandbox
  statement: "Amp documents approval-free tools by default, configurable main/subagent policy, workspace-MCP startup approval, opt-in remote terminal control, and non-portability of local SDK policy options to Orbs."
  classification: FACT
  confidence: MEDIUM
  scope: "owner manuals and exact SDK option schema; excludes enforcement observation"
  source_ids: [S-004, S-009, S-010, S-014, S-019, S-027]
  fact_dependencies: []
  method: "Compared default permission text, policy schemas, MCP trust, remote-terminal flags, and Orb option warning."
  counterevidence: "workspace MCP approval is a scoped exception and does not contradict default tool-call authority"
  adversarial_status: SUPPORTED
- claim_id: C-022
  section: permissions-authority-sandbox
  statement: "Sandbox implementation, path/process/network containment, credential mediation, approval bypass resistance, and actual audit enforcement are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "local CLI, runner host, and managed Orb execution boundaries"
  source_ids: [S-009, S-019, S-020, S-027]
  fact_dependencies: []
  method: "attempted_methods=read Orb, permissions, SDK, and unauthenticated security pages for enforcement details; blocker=security page returned sign-in shell and no safe disposable target runtime was authorized; impact=consequential authority/isolation claims cannot receive runtime confidence; available_evidence=S-009,S-019,S-020,S-027; next_probe=owner sandbox threat model and disposable deny/bypass/path/network suite"
  counterevidence: "broad Orb/runner development authority means policy text alone cannot establish containment"
  adversarial_status: NOT_PROBED
- claim_id: C-023
  section: evidence-observability
  statement: "Public streams, plugin events/logs, searchable threads, and seven-day user-generated diagnostic reports provide documented evidence surfaces with thread/session/tool/status correlation fields."
  classification: FACT
  confidence: MEDIUM
  scope: "SDK/plugin/manual and privacy-policy interfaces; excludes completeness and tamper resistance"
  source_ids: [S-005, S-022, S-026]
  fact_dependencies: []
  method: "Mapped stream fields, plugin span/log/event fields, privacy audit categories, and diagnostic workflow."
  counterevidence: "tool-result hooks can rewrite model-visible results; no anti-forgery guarantee was found"
  adversarial_status: SUPPORTED
- claim_id: C-024
  section: resource-token-cost-accounting
  statement: "Amp documents streamed token/cache usage, duration/turns, pass-through LLM/tool charging, per-thread price, balance reporting, and minute-billed Orbs."
  classification: FACT
  confidence: MEDIUM
  scope: "public SDK declarations, pricing/Terms, and Orb manual; excludes bill reconciliation"
  source_ids: [S-004, S-009, S-021, S-025, S-027]
  fact_dependencies: []
  method: "Mapped exact Usage/Result fields and owner pricing/billing descriptions."
  counterevidence: "no provider invoice was available; vendor prices/routes are mutable"
  adversarial_status: SUPPORTED
- claim_id: C-025
  section: resource-token-cost-accounting
  statement: "Retry/cache/specialist/Orb attribution, missing or contradictory usage handling, provider reconciliation, and budget-exhaustion enforcement are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "current account billing and SDK usage stream; excludes documented field presence"
  source_ids: [S-004, S-025, S-027]
  fact_dependencies: []
  method: "attempted_methods=compared exact usage types, pricing text, and SDK docs for retry/budget reconciliation; blocker=no disposable paid account/provider bill and no public accounting algorithm; impact=cost predictability and enforcement comparison is incomplete; available_evidence=S-004,S-025,S-027; next_probe=controlled account run with retries/cache/specialists and exported provider/Amp ledger"
  counterevidence: "none found because no independent bill was accessible"
  adversarial_status: NOT_PROBED
- claim_id: C-026
  section: failure-cancellation-retry
  statement: "Public contracts expose AbortSignal/cancel/error states, same-thread request-ID message deduplication, webhook at-least-once delivery with idempotency IDs, and bounded non-crash-safe plugin disposal."
  classification: FACT
  confidence: MEDIUM
  scope: "SDK/plugin/Orb documented interfaces; excludes observed cleanup and general retry policy"
  source_ids: [S-004, S-005, S-009, S-027]
  fact_dependencies: []
  method: "Read exact types and owner cancellation, request ID, webhook, and disposal descriptions."
  counterevidence: "none found; exact SDK artifact/manual conflict on multiplayer default is separately recorded"
  adversarial_status: SUPPORTED
- claim_id: C-027
  section: failure-cancellation-retry
  statement: "Cancellation propagation, partial-write cleanup, child fan-out, remote cancellation delivery, billing cutoff, general retry/backoff, and crash-consistent final state are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "local/Orb/runner tools, providers, plugins, and child agents"
  source_ids: [S-005, S-009, S-027]
  fact_dependencies: []
  method: "attempted_methods=searched plugin/SDK/Orb contracts for propagation, cleanup, backoff, and partial success; blocker=interfaces expose signals/status but not end-to-end implementation and live side effects were unsafe; impact=operational failure comparison is incomplete; available_evidence=S-005,S-009,S-027; next_probe=disposable cancellation at pre-dispatch, stream, tool-side-effect, child, and remote phases"
  counterevidence: "plugin disposal explicitly does not run on crash/SIGKILL"
  adversarial_status: NOT_PROBED
- claim_id: C-028
  section: install-update-release
  statement: "The exact npm artifacts were integrity-verified, while owner docs recommend direct mutable installers, offer Homebrew/npm, document amp update, and describe the May 2026 Bun executable packaging transition."
  classification: FACT
  confidence: HIGH
  scope: "exact npm packages and owner install/release text; excludes installer execution and native binary verification"
  source_ids: [S-001, S-002, S-003, S-004, S-023, S-024]
  fact_dependencies: []
  method: "Resolved/downloaded/hashed exact packages and read current owner install and package-change pages."
  counterevidence: "none found for package identities; direct installer content remains mutable"
  adversarial_status: SUPPORTED
- claim_id: C-029
  section: install-update-release
  statement: "Direct-installer signing, native binary digests, reproducible builds, attestations, migration, rollback, compatibility policy, and public source-to-artifact traceability are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "current direct/Homebrew/npm update and release pipeline"
  source_ids: [S-001, S-002, S-003, S-004, S-023, S-024, S-027]
  fact_dependencies: []
  method: "attempted_methods=inspected registry signatures/integrities, wrapper contents, install/update docs, package announcement, and SDK compatibility declarations; blocker=no public build provenance/rollback contract and target installers were not safely executed; impact=supply-chain and rollback comparison remains incomplete; available_evidence=S-001,S-002,S-003,S-004,S-023,S-024,S-027; next_probe=owner-signed manifest/SBOM/reproducible build plus disposable failed-update/rollback test"
  counterevidence: "npm integrity/signatures cover registry artifacts but not direct installer-to-native-binary provenance"
  adversarial_status: NOT_PROBED
- claim_id: C-030
  section: tests-qualification
  statement: "Internal test layers, platform/provider matrix, coverage, security tests, CI gates, and production-path qualification are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "proprietary CLI/service/Orb runtime and release process; published parent packages only as negative bounded evidence"
  source_ids: [S-002, S-004, S-020]
  fact_dependencies: []
  method: "attempted_methods=listed exact tarball members and searched accessible owner security/public material for test and CI evidence; blocker=packages contain no tests, core source/CI is private, and security page requires sign-in; impact=no dynamic behavior claim can be qualified by upstream tests; available_evidence=S-002,S-004,S-020; next_probe=owner test/CI qualification report tied to exact release plus safe acceptance suite"
  counterevidence: "none found in the exact published-package and unauthenticated owner-page universe"
  adversarial_status: NOT_PROBED
- claim_id: C-031
  section: security
  statement: "Owner documents untrusted-content influence, broad tool/executor authority, third-party LLM processing/retention, and a prohibition on storing credentials and other defined Sensitive Data."
  classification: FACT
  confidence: MEDIUM
  scope: "owner manuals, Terms, and Privacy Policy; vendor policy/claims rather than independent security measurement"
  source_ids: [S-009, S-011, S-014, S-021, S-022]
  fact_dependencies: []
  method: "Mapped documented trust boundaries, default authority, remote sharing, and legal data handling text."
  counterevidence: "none found; these sources do not prove enforcement"
  adversarial_status: SUPPORTED
- claim_id: C-032
  section: security
  statement: "Encryption, tenant isolation, Orb hardening, secret mediation, DLP, path enforcement, dependency controls, vulnerability history, subprocessor matrix, and deletion verification are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "current hosted Amp and executors; excludes owner policy statements"
  source_ids: [S-020, S-021, S-022]
  fact_dependencies: []
  method: "attempted_methods=fetched security page unauthenticated and reviewed Terms/privacy for technical controls and subprocessors; blocker=security page yielded only sign-in and policy pages lack implementation detail; impact=security architecture and acceptance cannot be assessed; available_evidence=S-020,S-021,S-022; next_probe=authorized Security Reference, threat model, subprocessor list, independent reports, and sandbox test evidence"
  counterevidence: "general safeguard language in S-022 is not implementation evidence"
  adversarial_status: NOT_PROBED
- claim_id: C-033
  section: strengths
  statement: "Amp's documented durable thread abstraction coherently spans local, SDK, runner, Orb, web/mobile, and evidence surfaces, which can reduce execution handoff friction."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "documented interface coherence; excludes availability, isolation, and correctness"
  source_ids: [S-008, S-009, S-010, S-011, S-026]
  fact_dependencies: [C-006, C-008, C-017, C-023]
  method: "Reasoning chain: multiple entrypoints and executors preserve thread identity and expose continued control/evidence; assumption=interfaces behave as documented; alternative=hidden coupling or outages may erase the operational benefit."
  counterevidence: "C-018 and C-027 leave durability and failure semantics unknown"
  adversarial_status: SUPPORTED
- claim_id: C-034
  section: liabilities
  statement: "Approval-free defaults plus Orb rejection of local SDK policy options create a material authority-misconfiguration hazard."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "automation that switches from local to Orb execution; excludes correctly configured project policy"
  source_ids: [S-014, S-019, S-027]
  fact_dependencies: [C-021]
  method: "Reasoning chain: caller supplies local rules, Orb ignores them with warning, and tools otherwise default to no approval; assumption=caller expects policy portability; alternative=project policy may already impose equivalent controls."
  counterevidence: "project-side Orb configuration can mitigate the hazard"
  adversarial_status: SUPPORTED
- claim_id: C-035
  section: transferable-patterns
  statement: "A durable typed thread actor with explicit compacted and full-history reads is a candidate pattern for cross-device agent control."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "research candidate mechanism only; not adoption authority"
  source_ids: [S-005, S-012, S-013]
  fact_dependencies: [C-015, C-017, C-023]
  method: "Reasoning chain: stable IDs plus append/state/cancel and explicit history views separate durable control from clients; assumption=visibility/idempotency/audit are enforceable; alternative=a simpler local session store may suffice."
  counterevidence: "C-018 leaves storage guarantees unknown"
  adversarial_status: SUPPORTED
- claim_id: C-036
  section: transferable-patterns
  statement: "Lazy skill and MCP/tool activation with deterministic precedence is a conditional pattern for controlling context size."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "research pattern with deny-by-default and provenance prerequisites; excludes Amp's approval-free default"
  source_ids: [S-005, S-014]
  fact_dependencies: [C-009, C-012]
  method: "Reasoning chain: descriptors remain visible while bodies/tools load only on use, reducing baseline context; assumption=activation is trustworthy and observable; alternative=lazy activation may hide needed capabilities or load malicious content."
  counterevidence: "untrusted skill/MCP content and precedence masking can undermine the benefit"
  adversarial_status: SUPPORTED
- claim_id: C-037
  section: rejected-patterns-curiosity-no-go
  statement: "Decompiling or string-mining Amp's proprietary executable is a CURIOSITY_NO_GO research path for this dossier."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "this assignment's lawful public-evidence boundary; not a general legal conclusion"
  source_ids: [S-002, S-024]
  fact_dependencies: [C-002, C-004]
  method: "Reasoning chain: all-rights-reserved package plus absent public core source makes reverse engineering both unauthorized here and weak deployed-runtime evidence; assumption=no separate written authority exists; alternative=owner-published source or explicit clean-room authorization would reopen it."
  counterevidence: "none within assignment authority"
  adversarial_status: NOT_APPLICABLE:probe-rejected-by-scope
- claim_id: C-038
  section: rejected-patterns-curiosity-no-go
  statement: "Treating local SDK permission/tool/MCP options as portable Orb policy is a CURIOSITY_NO_GO pattern at this snapshot."
  classification: INFERENCE
  confidence: HIGH
  scope: "@ampcode/sdk current manual executor='orb' behavior"
  source_ids: [S-027]
  fact_dependencies: [C-021]
  method: "Reasoning chain: the documented Orb executor ignores these options with a warning, so reuse cannot enforce caller intent; assumption=current docs match runtime; alternative=future explicit portability contract could reopen it."
  counterevidence: "none in current SDK manual"
  adversarial_status: SUPPORTED
- claim_id: C-039
  section: adversarial-probes
  statement: "Runtime enforcement outcomes for the required dynamic adversarial probes are unknown because no authorized credentialed disposable target environment was available."
  classification: UNKNOWN
  confidence: N/A
  scope: "required P-01 through P-14 dynamic portions; static package/doc observations retained separately"
  source_ids: [S-001, S-002, S-003, S-004, S-023]
  fact_dependencies: []
  method: "attempted_methods=performed static package integrity/member/type inspection and official-document retrieval, and assessed whether credential-free execution could answer each probe; blocker=agent use requires authentication/cost and installer or consequential tool execution lacked an authorized disposable secret-free sandbox; impact=runtime side effects, enforcement, cleanup, races, and accounting are not qualified; available_evidence=S-001,S-002,S-003,S-004,S-023; next_probe=vendor-provided disposable account, pinned binary, denied network/secrets, disposable repository, and captured event/billing outputs"
  counterevidence: "none because dynamic target execution was intentionally not performed"
  adversarial_status: NOT_PROBED
```

## 27. Source ledger {#source-ledger}

```yaml
- source_id: S-001
  source_kind: release-metadata
  title: "Exact npm metadata for @ampcode/cli 0.0.1787616161-g9dff10"
  url: "https://registry.npmjs.org/@ampcode%2fcli/0.0.1787616161-g9dff10"
  commit_or_ref: "0.0.1787616161-g9dff10"
  resolved_commit: "9dff10c63d912217947730134ea3307b03b3a86b"
  package_identity: "@ampcode/cli@0.0.1787616161-g9dff10+integrity=sha512-LZY/oMOCfPgCHAgmyiVQc2k3z8fri9sfURabOXQ0ImGEtwhn0gBAIDQ5DoOH+7IGbinpY9DYxbNvYNFtoN1zeA=="
  code_path: "package.json registry document"
  symbol: "version; gitHead; dist.integrity; dist.signatures; optionalDependencies"
  line_anchor: "/version,/gitHead,/dist/integrity,/dist/signatures,/optionalDependencies"
  command: "curl --fail --silent --show-error --location 'https://registry.npmjs.org/@ampcode%2fcli/0.0.1787616161-g9dff10' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; network allowed only for static registry retrieval; no npm scripts"
  output_or_hash: "sha256:3883139867f15f76882f735b7dcaa4bbf5aa3168d851adecda2601eba7eaf64c"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-004, C-028, C-029, C-039]
  notes: "Selected because exact registry metadata pins version, integrity, signature, and gitHead more reproducibly than /latest; no package script ran."
- source_id: S-002
  source_kind: package-artifact
  title: "Exact @ampcode/cli npm tarball static inspection"
  url: "https://registry.npmjs.org/@ampcode/cli/-/cli-0.0.1787616161-g9dff10.tgz"
  commit_or_ref: "0.0.1787616161-g9dff10"
  resolved_commit: "9dff10c63d912217947730134ea3307b03b3a86b"
  package_identity: "@ampcode/cli@0.0.1787616161-g9dff10+integrity=sha512-LZY/oMOCfPgCHAgmyiVQc2k3z8fri9sfURabOXQ0ImGEtwhn0gBAIDQ5DoOH+7IGbinpY9DYxbNvYNFtoN1zeA=="
  code_path: "package/LICENSE.md; package/package.json; package/install.cjs; package/cli-wrapper.cjs; package/bin/amp.exe"
  symbol: "package license and archive member list"
  line_anchor: "N/A:archive-members-not-line-addressed"
  command: "curl --fail --silent --show-error --location 'https://registry.npmjs.org/@ampcode/cli/-/cli-0.0.1787616161-g9dff10.tgz' -o cli.tgz && openssl dgst -sha512 -binary cli.tgz | openssl base64 -A && tar -tzf cli.tgz && tar -xOzf cli.tgz package/LICENSE.md"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; bsdtar 3.5.3; OpenSSL 3.6.3; static listing/stdout only; no extraction to workspace and no scripts"
  output_or_hash: "sha256:f68068d8de1272e4a16dd8f6291c044187933533633e37e596c71831fa212d45"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-002, C-003, C-004, C-005, C-028, C-029, C-030, C-037, C-039]
  notes: "Tarball SHA-512 matched S-001; selected for exact package bytes, license, and member listing; native optional packages not inspected."
- source_id: S-003
  source_kind: release-metadata
  title: "Exact npm metadata for @ampcode/sdk 0.1.0-20260823161614-g3631dc6"
  url: "https://registry.npmjs.org/@ampcode%2fsdk/0.1.0-20260823161614-g3631dc6"
  commit_or_ref: "0.1.0-20260823161614-g3631dc6"
  resolved_commit: "N/A:package-metadata-omits-full-resolved-commit"
  package_identity: "@ampcode/sdk@0.1.0-20260823161614-g3631dc6+integrity=sha512-miWxp589g98hUMEl5tgsKgnz/UZsGDXBJq+8VEaBYqpBujF4fTA5Y+fZ8gQqVb5H5yRK2u82UHIrRZKwklrf4A=="
  code_path: "package.json registry document"
  symbol: "version; dist.integrity; dist.signatures; dependencies; repository"
  line_anchor: "/version,/dist/integrity,/dist/signatures,/dependencies,/repository"
  command: "curl --fail --silent --show-error --location 'https://registry.npmjs.org/@ampcode%2fsdk/0.1.0-20260823161614-g3631dc6' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; static registry retrieval; no npm scripts"
  output_or_hash: "sha256:e7e5c71bdd68ce35ded498d03494041e94525661d74365c35bc3239fb25dadf3"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-004, C-028, C-029, C-039]
  notes: "Selected to pin the SDK, dependency on @ampcode/cli latest, commercial license metadata, and registry signature; metadata has no full gitHead."
- source_id: S-004
  source_kind: package-artifact
  title: "Exact @ampcode/sdk tarball declarations and license"
  url: "https://registry.npmjs.org/@ampcode/sdk/-/sdk-0.1.0-20260823161614-g3631dc6.tgz"
  commit_or_ref: "0.1.0-20260823161614-g3631dc6"
  resolved_commit: "N/A:package-metadata-omits-full-resolved-commit"
  package_identity: "@ampcode/sdk@0.1.0-20260823161614-g3631dc6+integrity=sha512-miWxp589g98hUMEl5tgsKgnz/UZsGDXBJq+8VEaBYqpBujF4fTA5Y+fZ8gQqVb5H5yRK2u82UHIrRZKwklrf4A=="
  code_path: "package/dist/index.d.ts; package/dist/types.d.ts; package/dist/version-compatibility.d.ts; package/LICENSE.md; package/package.json"
  symbol: "execute; StreamMessage; AmpOptionsSchema; ExecuteOptions; Permission; threads; Usage"
  line_anchor: "N/A:generated-declarations-in-package-artifact"
  command: "curl --fail --silent --show-error --location 'https://registry.npmjs.org/@ampcode/sdk/-/sdk-0.1.0-20260823161614-g3631dc6.tgz' -o sdk.tgz && openssl dgst -sha512 -binary sdk.tgz | openssl base64 -A && tar -tzf sdk.tgz && tar -xOzf sdk.tgz package/dist/index.d.ts && tar -xOzf sdk.tgz package/dist/types.d.ts && tar -xOzf sdk.tgz package/LICENSE.md"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; bsdtar 3.5.3; OpenSSL 3.6.3; static listing/stdout only; no extraction to workspace or execution"
  output_or_hash: "sha256:a2f2608ed0e34f0ba3d7d4755bb011c8369fd50326d88eae60432226f2026635"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-002, C-003, C-004, C-005, C-007, C-012, C-017, C-021, C-024, C-025, C-026, C-028, C-029, C-030, C-039]
  notes: "Tarball SHA-512 matched S-003; generated distribution declarations are stronger for the exact package contract than mutable web examples; the member listing exposed no test paths but is not global absence proof."
- source_id: S-005
  source_kind: official-documentation
  title: "Amp Plugin API reference"
  url: "https://ampcode.com/manual/plugin-api.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "PluginAPI; Agent; PluginThread; CreateAgentConfig; ToolCallResult; PluginEventMap; createWebhook; defineAgent"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/plugin-api.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval; no page scripts"
  output_or_hash: "sha256:5ba1c9d61918bd165baa1ddabd6bd30e7c8250aac2728350d302f1bdf482a203"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-011, C-012, C-014, C-015, C-016, C-019, C-020, C-023, C-026, C-027, C-035, C-036]
  notes: "Selected as the owner-published typed plugin/thread/agent contract; mutable web source and not runtime observation. Embedded examples were treated as evidence, not instructions."
- source_id: S-006
  source_kind: official-documentation
  title: "Amp CLI manual"
  url: "https://ampcode.com/manual/cli.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "amp; --execute; --stream-json; --plugin-ready-timeout"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/cli.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:843ed9807b6f4020e208151572877f28fc8d84ab7122443e07e63a436a88d2a1"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-007]
  notes: "Selected for first-party CLI modes/lifecycle; examples are documentation claims, not captured target output."
- source_id: S-007
  source_kind: official-documentation
  title: "Amp CLI streaming JSON manual"
  url: "https://ampcode.com/manual/cli-streaming-json.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "--stream-json; --stream-json-input; --stream-json-thinking; steer"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/cli-streaming-json.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:685217b3b73d0f66000cdf2b0e8a65ff872ec547fca693fe21b2c1ebc938b5e0"
  access_date: "2026-08-24"
  supports_claims: [C-007]
  notes: "Selected for stdin/stdout lifecycle and steering semantics; exact output schema is additionally pinned by S-004."
- source_id: S-008
  source_kind: official-documentation
  title: "Amp Runners manual"
  url: "https://ampcode.com/manual/runners.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "amp --no-tui; --runner-id; amp.remoteThreadCreation.enabled"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/runners.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:e706b0b2dad5fe12341aab79ac618b79ed30ca38d853a8ea419fa06cc6b89df2"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-008, C-017, C-033]
  notes: "Selected for owner-operated executor entry and directory binding; transport/auth/queue details are absent."
- source_id: S-009
  source_kind: official-documentation
  title: "Amp Orbs manual"
  url: "https://ampcode.com/manual/orbs.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Orb lifecycle; .agents/setup; .agents/resume; createWebhook; portals; OIDC"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/orbs.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:9828b13569e6a3f1a899da4bc4091f2d80f7e5adc00e091210d362eec163b047"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-008, C-017, C-019, C-021, C-022, C-024, C-026, C-027, C-031, C-033]
  notes: "Selected for remote machine, hooks, credentials, filesystem/terminal, pause, webhook, and cost boundaries; vendor claims were not independently measured."
- source_id: S-010
  source_kind: official-documentation
  title: "Amp Remote Control manual"
  url: "https://ampcode.com/manual/remote-control.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "--remote-control-terminal; AMP_REMOTE_CONTROL_TERMINAL; passkey policy"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/remote-control.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:8fd75c1a9c21f57b36de05d468742143899e09dc675f4b2eee1ea3493c42070d"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-017, C-021, C-033]
  notes: "Selected for cross-device message/terminal control and runner reattachment; enforcement not tested."
- source_id: S-011
  source_kind: official-documentation
  title: "Amp Thread Sharing manual"
  url: "https://ampcode.com/manual/thread-sharing.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "thread visibility levels and defaults"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/thread-sharing.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:600ae731588036b5b4e549b8a6c6fad03535877690478a285dd48b3d0b5d728e"
  access_date: "2026-08-24"
  supports_claims: [C-017, C-031, C-033]
  notes: "Selected for visibility/admin/default trust boundary; no access-control bypass probe."
- source_id: S-012
  source_kind: official-documentation
  title: "Amp Referencing Other Threads manual"
  url: "https://ampcode.com/manual/referencing-threads.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "thread ID/URL reference and relevant extraction"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/referencing-threads.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:8ec892332c2b282013105c449909da8991eb86ebd26e4429ca982c8689cab9e5"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-016, C-017, C-035]
  notes: "Selected for documented cross-thread context retrieval; extraction algorithm/schema is absent."
- source_id: S-013
  source_kind: official-documentation
  title: "Amp Finding Threads manual"
  url: "https://ampcode.com/manual/finding-threads.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "feed query filters; parent thread search"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/finding-threads.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:216546eed43d9daa1122e28aeb40831ccd91e1f8d2e1b60d82e7a9c2f6a8e365"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-016, C-017, C-019, C-035]
  notes: "Selected for searchable durable-thread metadata and parent/child discovery."
- source_id: S-014
  source_kind: official-documentation
  title: "Amp Tools and Subagents manual"
  url: "https://ampcode.com/manual/tools.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "tools; skills; MCP; subagents; Oracle; Librarian; Painter; permissions"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/tools.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:121170f11feb3455a225972318ce92dd3b3bbf8471414cb03532b27f4cba5fb4"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-010, C-012, C-013, C-014, C-015, C-019, C-021, C-031, C-034, C-036]
  notes: "Decision-critical owner source for default authority, extension precedence, specialists, and isolated subagents; model mappings are explicitly mutable."
- source_id: S-015
  source_kind: official-documentation
  title: "Amp Subagents manual"
  url: "https://ampcode.com/manual/subagents.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "subagent context, tools, communication, steering, summary"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/subagents.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:7d80eadfdf112c9353c170b182e5a3863ae231710ddfbb4d32fe5ebcd4065adc"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-019, C-020]
  notes: "Selected as the focused owner specialist-boundary statement; duplicates part of S-014 but makes the communication limits explicit."
- source_id: S-016
  source_kind: official-documentation
  title: "Amp Agent Modes manual"
  url: "https://ampcode.com/manual/agent-modes.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "low; medium; high; ultra"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/agent-modes.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:00b5d1c82f60483e6cf6ef8f5a7a31e37ff0c84d24c8a92b65451f18918e1c42"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-014]
  notes: "Selected for owner definition of modes as presets and account-dependent routing."
- source_id: S-017
  source_kind: runtime-observation
  title: "Unauthenticated public-body observation of Amp current model-routes page"
  url: "https://ampcode.com/modes.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "unauthenticated response body"
  line_anchor: "N/A:no-line-anchor"
  command: "p=$(mktemp); curl --silent --show-error --location --output \"$p\" --write-out 'http=%{http_code}\\n' 'https://ampcode.com/modes.md'; grep -o 'Sign in to Amp' \"$p\" | head -1; shasum -a 256 \"$p\"; rm -f \"$p\""
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; no credentials; public response only; no scripts or access bypass"
  output_or_hash: "sha256:0233157e361f8a5bbdb292d30831df3c6c3a21b24468006e4048e0fa123f7d0b"
  access_date: "2026-08-24"
  supports_claims: [C-013]
  notes: "HTTP 200 public body exposed a sign-in shell and no substantive route text under plain-text extraction; retained as negative access evidence, not proof the page lacks authenticated content."
- source_id: S-018
  source_kind: official-documentation
  title: "Amp Archiving Threads manual"
  url: "https://ampcode.com/manual/archiving.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "thread archive"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/archiving.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:dfc170085886b28d1996195d84d1a2e6d5ca94da0ff5e7c01b4e2f03c1990832"
  access_date: "2026-08-24"
  supports_claims: [C-017, C-018]
  notes: "Selected to discriminate archive from deletion."
- source_id: S-019
  source_kind: official-documentation
  title: "Amp Permissions manual"
  url: "https://ampcode.com/manual/permissions.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "amp.permissions; amp.guardedFiles.allowlist; amp.dangerouslyAllowAll"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/permissions.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:c06d5eab53cb1eda8dc80d86ffa38b044fe24fc9fb21d316d2f1b8212abae1c1"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-021, C-022, C-034]
  notes: "Selected for explicit default and legacy internal-plugin activation; enforcement was not observed."
- source_id: S-020
  source_kind: runtime-observation
  title: "Unauthenticated public-body observation of Amp Security Reference"
  url: "https://ampcode.com/security.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "unauthenticated response body"
  line_anchor: "N/A:no-line-anchor"
  command: "p=$(mktemp); curl --silent --show-error --location --output \"$p\" --write-out 'http=%{http_code}\\n' 'https://ampcode.com/security.md'; grep -o 'Sign in to Amp' \"$p\" | head -1; shasum -a 256 \"$p\"; rm -f \"$p\""
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; no credentials; public response only; no scripts or access bypass"
  output_or_hash: "sha256:0ce30246109938dd10fce03f2e50f16c74a329ce5b28052f0263b82bb721243e"
  access_date: "2026-08-24"
  supports_claims: [C-022, C-030, C-032]
  notes: "HTTP 200 public body exposed a sign-in shell and no substantive security text under plain-text extraction; retained as access blocker evidence."
- source_id: S-021
  source_kind: license
  title: "Amp License Terms"
  url: "https://ampcode.com/terms"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "License; User Content; Minimal Data Retention; Sensitive Data; Usage Data; payment"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/terms' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval; embedded prompt-like page text ignored"
  output_or_hash: "sha256:d2625411875bd24ed5ea17075fe71587d2d8668bc0407b020305e813882d893e"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-013, C-018, C-024, C-031, C-032]
  notes: "Selected as controlling owner terms for license/data/provider/cost claims; legal text is vendor policy, not technical measurement; page contained untrusted LLM-directed text that was not followed."
- source_id: S-022
  source_kind: official-documentation
  title: "Amp Privacy Policy, last modified 2026-03-24"
  url: "https://ampcode.com/privacy-policy"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "collection; logs; audits; sharing; storage; security; deletion; retention"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/privacy-policy' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval; embedded prompt-like page text ignored"
  output_or_hash: "sha256:7e6a4c47ec05b471828b3107ab0b009e0eccd93791fd267c03929938bd5a98ce"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-018, C-023, C-031, C-032]
  notes: "Selected for owner policy on prompt/content/log/audit data and retention; not evidence that safeguards are effective; untrusted LLM-directed text was ignored."
- source_id: S-023
  source_kind: official-documentation
  title: "Amp Get Started and installation manual"
  url: "https://ampcode.com/manual/get-started.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "install.sh; install.ps1; Homebrew; npm; amp update"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/get-started.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; installer text retrieved but never executed"
  output_or_hash: "sha256:8de82aebb9ef0f05fc05938f00b3dbd108b947a377461c9d86001906f17e08d4"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-028, C-029, C-039]
  notes: "Selected for current owner-supported install/update paths; mutable pipe-to-shell commands are documented risk and were not run."
- source_id: S-024
  source_kind: release-metadata
  title: "Owner changelog: npm Package Changes, 2026-05-14"
  url: "https://ampcode.com/news/npm-package-changes"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@ampcode/cli and @ampcode/sdk naming/packaging announcement"
  code_path: "N/A:no-code-path"
  symbol: "Bun single-file executable; package renames"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/news/npm-package-changes' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:591f4afcd11bf16caa2aea9da3d14ae3492c4b6cb900a969f0ea078a79abe4f5"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005, C-028, C-029, C-037]
  notes: "Selected as first-party dated provenance for binary packaging and package renames; announcement is not build reproducibility evidence."
- source_id: S-025
  source_kind: official-documentation
  title: "Amp Pricing manual"
  url: "https://ampcode.com/manual/pricing.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "pass-through pricing; amp usage; thread price; enterprise controls"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/pricing.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval; no paid account"
  output_or_hash: "sha256:ae45ebf748834070ba0eb68726e0f9ad5e5890f5fcbbb30012f3222593a02868"
  access_date: "2026-08-24"
  supports_claims: [C-024, C-025]
  notes: "Selected for owner billing/accounting policy; prices are mutable and were not reconciled to provider invoices."
- source_id: S-026
  source_kind: official-documentation
  title: "Amp diagnostic report manual"
  url: "https://ampcode.com/manual/appendix/report.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "feedback diagnostic report; amp threads report; seven-day deletion"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/appendix/report.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval; no report generated"
  output_or_hash: "sha256:48a73a86121558e98b218d0ab3ab79a69925dbe9326fe498882391a49eb3bdf5"
  access_date: "2026-08-24"
  supports_claims: [C-023, C-033]
  notes: "Selected for owner diagnostic ownership/retention/access workflow; no report contents or deletion were observed."
- source_id: S-027
  source_kind: official-documentation
  title: "Amp TypeScript SDK current manual"
  url: "https://ampcode.com/manual/sdk/typescript"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "documents @ampcode/sdk current API; exact package separately pinned as S-003,S-004"
  code_path: "N/A:no-code-path"
  symbol: "execute; createUserMessage; createPermission; threads; AmpOptions; StreamMessage; Usage"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual/sdk/typescript' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval; embedded prompt-like page text ignored"
  output_or_hash: "sha256:0a5140c4f91515eacde09b037b61e6ac054a21e83e3aa89acc7a3f9f6d0fd779"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-007, C-011, C-012, C-017, C-021, C-022, C-024, C-025, C-026, C-027, C-029, C-034, C-038]
  notes: "Selected for live SDK semantics including AbortSignal, request-ID dedup, Orb-local option split, and current one-week multiplayer default; conflicts with exact S-004 declaration's three-hour default."
- source_id: S-028
  source_kind: runtime-observation
  title: "Amp manual AGENTS.md link retrieval failure"
  url: "https://ampcode.com/manual/AGENTS.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "HTTP response"
  line_anchor: "N/A:no-line-anchor"
  command: "p=$(mktemp); curl --silent --show-error --location --output \"$p\" --write-out 'http=%{http_code}\\n' 'https://ampcode.com/manual/AGENTS.md'; shasum -a 256 \"$p\"; rm -f \"$p\""
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; public unauthenticated GET; no retries after exact/lower-case 404 results"
  output_or_hash: "sha256:a527f315850b5d4c492af4d2a437ed0a7a4f179e0ecc842245f0b26eb77cbe82"
  access_date: "2026-08-24"
  supports_claims: [C-016]
  notes: "HTTP 404 with 48-byte body; negative access result only, not evidence that AGENTS support is absent."
- source_id: S-029
  source_kind: official-documentation
  title: "Amp Owner's Manual index"
  url: "https://ampcode.com/manual.md"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "manual table of contents"
  line_anchor: "N/A:no-stable-line-anchor"
  command: "curl --fail --silent --show-error --location 'https://ampcode.com/manual.md' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; passive unauthenticated retrieval"
  output_or_hash: "sha256:6e20ee2eb46b2f1509f2a90d3d79c4b0b3b96ed752b2d0e34194cc0c649b7929"
  access_date: "2026-08-24"
  supports_claims: [C-016]
  notes: "Selected only to preserve the advertised AGENTS.md target and bound S-028; detailed claims rely on focused owner pages or exact packages."
- source_id: S-030
  source_kind: release-metadata
  title: "Dated npm latest resolution for @ampcode/cli"
  url: "https://registry.npmjs.org/@ampcode%2fcli/latest"
  commit_or_ref: "latest resolved to 0.0.1787616161-g9dff10 on 2026-08-24 UTC"
  resolved_commit: "9dff10c63d912217947730134ea3307b03b3a86b"
  package_identity: "@ampcode/cli@0.0.1787616161-g9dff10+integrity=sha512-LZY/oMOCfPgCHAgmyiVQc2k3z8fri9sfURabOXQ0ImGEtwhn0gBAIDQ5DoOH+7IGbinpY9DYxbNvYNFtoN1zeA=="
  code_path: "package.json registry document"
  symbol: "version; gitHead; dist.integrity"
  line_anchor: "/version,/gitHead,/dist/integrity"
  command: "curl --fail --silent --show-error --location 'https://registry.npmjs.org/@ampcode%2fcli/latest' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; static registry retrieval on 2026-08-24; mutable selector paired with immutable S-001,S-002"
  output_or_hash: "sha256:3883139867f15f76882f735b7dcaa4bbf5aa3168d851adecda2601eba7eaf64c"
  access_date: "2026-08-24"
  supports_claims: [C-001]
  notes: "Retained only to prove the dated latest resolution; exact bytes and repeatability come from S-001,S-002."
- source_id: S-031
  source_kind: release-metadata
  title: "Dated npm latest resolution for @ampcode/sdk"
  url: "https://registry.npmjs.org/@ampcode%2fsdk/latest"
  commit_or_ref: "latest resolved to 0.1.0-20260823161614-g3631dc6 on 2026-08-24 UTC"
  resolved_commit: "N/A:package-metadata-omits-full-resolved-commit"
  package_identity: "@ampcode/sdk@0.1.0-20260823161614-g3631dc6+integrity=sha512-miWxp589g98hUMEl5tgsKgnz/UZsGDXBJq+8VEaBYqpBujF4fTA5Y+fZ8gQqVb5H5yRK2u82UHIrRZKwklrf4A=="
  code_path: "package.json registry document"
  symbol: "version; dist.integrity; dependencies"
  line_anchor: "/version,/dist/integrity,/dependencies"
  command: "curl --fail --silent --show-error --location 'https://registry.npmjs.org/@ampcode%2fsdk/latest' | shasum -a 256"
  command_environment: "Darwin 27.0.0 arm64; curl 8.7.1; static registry retrieval on 2026-08-24; mutable selector paired with immutable S-003,S-004"
  output_or_hash: "sha256:e7e5c71bdd68ce35ded498d03494041e94525661d74365c35bc3239fb25dadf3"
  access_date: "2026-08-24"
  supports_claims: [C-001]
  notes: "Retained only to prove the dated latest resolution; exact bytes and repeatability come from S-003,S-004."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "amp-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "Amp"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://ampcode.com/"
  resolved_commit: "N/A:package-only-proprietary-core"
  observed_ref: "@ampcode/cli@0.0.1787616161-g9dff10 and @ampcode/sdk@0.1.0-20260823161614-g3631dc6"
  package_identity: "@ampcode/cli@0.0.1787616161-g9dff10+sha512-LZY/oMOCfPgCHAgmyiVQc2k3z8fri9sfURabOXQ0ImGEtwhn0gBAIDQ5DoOH+7IGbinpY9DYxbNvYNFtoN1zeA==; @ampcode/sdk@0.1.0-20260823161614-g3631dc6+sha512-miWxp589g98hUMEl5tgsKgnz/UZsGDXBJq+8VEaBYqpBujF4fTA5Y+fZ8gQqVb5H5yRK2u82UHIrRZKwklrf4A=="
research:
  researcher: "ses_fc91c3549ffdC0XijQOwB0WNiH"
  owned_path: "research/harnesses/amp.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "OBSERVED"
    summary: "Exact current CLI and SDK registry artifacts were pinned and integrity-verified; deployed proprietary core was not."
    confidence: "HIGH"
    claim_ids: ["C-001"]
    source_ids: ["S-030", "S-001", "S-002", "S-031", "S-003", "S-004"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "PARTIAL"
    summary: "Exact packages are all-rights-reserved under Amp terms, while public entity naming is unresolved."
    confidence: "MEDIUM"
    claim_ids: ["C-002", "C-003"]
    source_ids: ["S-002", "S-004", "S-021", "S-022"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "PARTIAL"
    summary: "Published wrapper/SDK artifacts are mapped, but native and hosted core composition is closed."
    confidence: "MEDIUM"
    claim_ids: ["C-004", "C-005"]
    source_ids: ["S-001", "S-002", "S-003", "S-004", "S-024"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "PARTIAL"
    summary: "CLI, execute, stream, runner, Orb, SDK, and plugin entrypoints are documented but not run."
    confidence: "MEDIUM"
    claim_ids: ["C-006"]
    source_ids: ["S-006", "S-008", "S-009", "S-023", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "PARTIAL"
    summary: "Typed local SDK and documented hosted executor flows are traced; internal transforms and transports remain closed."
    confidence: "MEDIUM"
    claim_ids: ["C-007", "C-008"]
    source_ids: ["S-004", "S-006", "S-007", "S-008", "S-009", "S-010", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "PARTIAL"
    summary: "Plugin, skill, MCP, and custom-agent discovery and precedence are documented without runtime qualification."
    confidence: "MEDIUM"
    claim_ids: ["C-009"]
    source_ids: ["S-005", "S-014"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "PARTIAL"
    summary: "Custom child-thread and specialist boundaries are public; hidden prompts, fan-out, and scheduling are not."
    confidence: "MEDIUM"
    claim_ids: ["C-010", "C-011"]
    source_ids: ["S-005", "S-014", "S-015", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "PARTIAL"
    summary: "Plugin hook/schema contracts and approval-free default are documented; built-in tool schemas and enforcement are not observed."
    confidence: "MEDIUM"
    claim_ids: ["C-012"]
    source_ids: ["S-004", "S-005", "S-014", "S-019", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provider_interface"
    coverage: "UNKNOWN"
    summary: "Current provider route, transport, fallback, outage, credential, and retention details are unavailable without gated/owner evidence."
    confidence: "N/A"
    claim_ids: ["C-013"]
    source_ids: ["S-014", "S-016", "S-017", "S-021"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Modes and custom-agent model syntax are documented, but modes are mutable presets rather than pinned selectors."
    confidence: "MEDIUM"
    claim_ids: ["C-014"]
    source_ids: ["S-005", "S-014", "S-016"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "Compacted/full reads and cross-thread retrieval are documented; prompt ordering, compactor provenance, and exact read_thread are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-016"]
    source_ids: ["S-005", "S-012", "S-013", "S-014", "S-028", "S-029"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "Durable cross-device thread and archive/reattach surfaces are documented; storage, recovery, retention, and deletion internals are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-017", "C-018"]
    source_ids: ["S-004", "S-008", "S-010", "S-011", "S-012", "S-013", "S-018", "S-021", "S-022", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Thread/Orb/subagent isolation shapes are documented; limits, locks, collisions, and races are not."
    confidence: "MEDIUM"
    claim_ids: ["C-019", "C-020"]
    source_ids: ["S-005", "S-009", "S-013", "S-014", "S-015"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "PARTIAL"
    summary: "Default grants and policy locality are documented, while sandbox and enforcement implementation are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-021", "C-022"]
    source_ids: ["S-004", "S-009", "S-010", "S-014", "S-019", "S-020", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Structured stream/plugin/diagnostic evidence exists, but completeness, redaction, export durability, and anti-forgery are unverified."
    confidence: "MEDIUM"
    claim_ids: ["C-023"]
    source_ids: ["S-005", "S-022", "S-026"]
    pattern_disposition: "NO_POSITION"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Usage and price surfaces are documented without provider reconciliation, retry attribution, or budget deny-path evidence."
    confidence: "MEDIUM"
    claim_ids: ["C-024", "C-025"]
    source_ids: ["S-004", "S-009", "S-021", "S-025", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Signals, statuses, dedup IDs, and webhook retry are documented; end-to-end cancellation/cleanup/recovery are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-026", "C-027"]
    source_ids: ["S-004", "S-005", "S-009", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Exact npm artifacts are pinned, but direct-install provenance, reproducibility, compatibility, and rollback are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-028", "C-029"]
    source_ids: ["S-001", "S-002", "S-003", "S-004", "S-023", "S-024", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "UNKNOWN"
    summary: "Published-package inspection yielded no qualifying test evidence and proprietary internal qualification evidence was unavailable."
    confidence: "N/A"
    claim_ids: ["C-030"]
    source_ids: ["S-002", "S-004", "S-020"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "PARTIAL"
    summary: "Trust/data/supply-chain boundaries are documented, while gated implementation and independent security evidence remain unavailable."
    confidence: "MEDIUM"
    claim_ids: ["C-031", "C-032"]
    source_ids: ["S-009", "S-011", "S-014", "S-020", "S-021", "S-022"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "PARTIAL"
    summary: "Durable thread identity across clients/executors is an evidence-backed interface strength, not an availability claim."
    confidence: "MEDIUM"
    claim_ids: ["C-033"]
    source_ids: ["S-008", "S-009", "S-010", "S-011", "S-026"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "PARTIAL"
    summary: "Approval-free defaults and executor-local policy create a documented authority-misconfiguration hazard."
    confidence: "MEDIUM"
    claim_ids: ["C-034"]
    source_ids: ["S-014", "S-019", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "PARTIAL"
    summary: "Durable typed threads are a candidate and lazy extension context is conditional on stronger trust enforcement."
    confidence: "MEDIUM"
    claim_ids: ["C-035", "C-036"]
    source_ids: ["S-005", "S-012", "S-013", "S-014"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Proprietary reverse engineering and local-policy reuse for Orbs are explicitly rejected for this snapshot and authority."
    confidence: "HIGH"
    claim_ids: ["C-037", "C-038"]
    source_ids: ["S-002", "S-024", "S-027"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-033"]
liability_ids: ["C-034"]
transferable_pattern_ids: ["C-035", "C-036"]
curiosity_no_go_ids: ["C-037", "C-038"]
unknown_claim_ids: ["C-003", "C-005", "C-013", "C-016", "C-018", "C-020", "C-022", "C-025", "C-027", "C-029", "C-030", "C-032", "C-039"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

### Consolidated unknowns

| Claim | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-003 | legal/provenance entity and notice obligations | owner legal-entity/license clarification | owner legal response | UNASSIGNED |
| C-005 | internal loop/module/persistence architecture | exact-revision public source or owner architecture spec | owner publication | UNASSIGNED |
| C-013 | provider routing/fallback/privacy/outage behavior | exact route export plus controlled provider failures | authorized disposable account and owner route matrix | UNASSIGNED |
| C-016 | prompt order, compaction provenance, exact `read_thread` | tools JSON, installed plugin docs, controlled long-thread trace | pinned executable and disposable account | UNASSIGNED |
| C-018 | durability/recovery/retention/deletion | create/crash/restart/delete lifecycle with store receipts | disposable account plus owner lifecycle spec | UNASSIGNED |
| C-020 | concurrency limits/collisions/races | controlled parallel subagent/runner/plugin collision suite | disposable workspaces/executors | UNASSIGNED |
| C-022 | sandbox and authority enforcement | deny/bypass/path/symlink/network/credential suite | owner threat model and isolated target environment | UNASSIGNED |
| C-025 | cost attribution and budget enforcement | reconcile stream, retries, cache, specialists, Orb minutes, provider bill | paid disposable account and billing export | UNASSIGNED |
| C-027 | cancellation/retry/partial cleanup | cancel at pre-dispatch, stream, tool write, child, and remote phases | disposable account/executors | UNASSIGNED |
| C-029 | update provenance/compatibility/rollback | signed manifest/SBOM plus failed update and rollback | owner release evidence and isolated host | UNASSIGNED |
| C-030 | upstream tests/release qualification | exact-release CI/test/security qualification report | owner evidence | UNASSIGNED |
| C-032 | security architecture and independent assurance | authorized Security Reference, subprocessors, reports, advisories | authenticated/owner-provided materials | UNASSIGNED |
| C-039 | all dynamic adversarial outcomes | execute P-01–P-14 in a pinned secret-free lab | vendor-provided disposable account and sandbox | UNASSIGNED |

### Research recommendations (no adoption authority)

1. Compare Amp primarily at its public thread/executor/plugin contracts, not as an independently auditable loop implementation. {C-005 UNKNOWN N/A; S-002,S-004,S-024}
2. Any future reproducibility probe should pin both CLI and SDK, avoid mutable direct installers, and specify multiplayer duration rather than relying on the conflicting default. {C-028 FACT HIGH; S-001,S-002,S-003,S-004,S-023,S-027}
3. Treat local and Orb policy as separate enforcement domains; verify project-side Orb policy before consequential automation. {C-034 INFERENCE MEDIUM; S-014,S-019,S-027}
4. Require the gated security/provider/retention material and runtime deny-path evidence before any downstream security-acceptance decision. {C-013 UNKNOWN N/A; S-017,S-020,S-021,S-022}

### Curiosity ledger

Scores are 0–5 for decision relevance (`R`), expected evidence value (`V`), novelty (`N`), and cost (`C`, higher is more costly).

| Thread | R/V/N/C | Outcome |
| --- | --- | --- |
| Exact package metadata/artifacts | 5/5/4/1 | pursued; pinned S-001–S-004 |
| CLI/SDK stream and typed contract | 5/5/4/1 | pursued; saturation after exact declarations plus owner manual |
| Runners/Orbs/remote threads | 5/5/5/1 | pursued; closed transport retained as unknown |
| Specialists/subagent communication | 5/5/5/1 | pursued; owner boundary explicit, numerical scheduler unknown |
| Model/provider route table | 5/5/4/1 | pursued to public boundary; sign-in shell, then stopped |
| Security Reference | 5/5/4/2 | pursued to public boundary; sign-in shell, then stopped |
| Decompile/string-mine binary | 3/2/2/5 | `CURIOSITY_NO_GO`: unauthorized here and weak deployed-runtime evidence |
| Execute installer/agent without lab | 3/2/2/5 | `CURIOSITY_NO_GO`: secrets, cost, side effects, and inadequate isolation |
| Bypass account gates | 2/1/1/5 | `CURIOSITY_NO_GO`: violates access boundary |
| Repeat AGENTS URL guessing | 2/1/1/2 | `CURIOSITY_NO_GO`: repeated 404s and nonpositive marginal evidence |
| Portal/Docker recipe expansion | 1/1/1/2 | `CURIOSITY_NO_GO`: outside harness decision after boundary was captured |
| Secondary examples/guides | 2/2/1/2 | `CURIOSITY_NO_GO`: primary owner contracts were available and preferable |

### Bibliography rationale

- **S-001–S-004** were retained because exact registry metadata and bytes are the only immutable artifact identity available; they outrank mutable install/news text for version and API claims.
- **S-005–S-019, S-023, S-025–S-027, S-029** are focused first-party manuals selected for one decision boundary each; overlapping pages were retained only when they made a specialist/default/negative boundary explicit.
- **S-021–S-022** are the owner’s legal/privacy origins for data and license claims, explicitly treated as policy rather than independent measurement.
- **S-017, S-020, S-028** preserve negative access results so gated/404 evidence is not silently converted into absence.
- Secondary guides, search snippets, and owner marketing pages were not used for material runtime claims when package or manual origins were available.

### Stop decision

**STOP — coverage and saturation reached within the depth budget.** All required comparison dimensions and requested Amp surfaces have either owner/package evidence or an explicit UNKNOWN with next probe. Additional public searches were duplicating the same manuals; remaining high-value gaps require credentials, owner-only materials, unsafe execution, or prohibited reverse engineering. Marginal admissible evidence was therefore nonpositive.

### Handoff and binary gates

- **Owned path:** `research/harnesses/amp.md`
- **Schema/citation audit:** PASS — headings 0–29 in order; 39 exact-schema claims; 31 exact-schema sources; 40 substantive citations; 14 probe rows; 24 normalized dimensions; 13 UNKNOWN claims with all five method fields.
- **YAML/reference audit:** PASS — claims, sources, dependencies, normalized references, bidirectional support, and UNKNOWN set resolved.
- **URL check:** PASS — 31/31 reproduced expected status (`S-028` expected 404 negative result; all other source URLs 200).
- **Whitespace:** PASS — `git diff --check` and untracked-file `git diff --no-index --check` reported no whitespace errors.
- **Ownership:** PASS — no file was staged or committed; this session explicitly edited only the owned path.
- **Pre-existing workspace state left untouched:** initial status already showed `M apps/plugin/opencode2/turbo.json`, `?? docs/architecture/`, and `?? research/`; the broad untracked `research/` status means sibling untracked work cannot be attributed to this dossier and was not modified.
- **Final result:** `PASS (COMPLETE_WITH_UNKNOWNS)`.
