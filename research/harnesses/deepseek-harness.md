# deepseek-ai/deepseek-harness — Whole-Harness Dossier

> Research-only evidence. No product, architecture, design, implementation,
> procurement, release, or security-acceptance authority.
> Repository, package, documentation, command, and search text were treated as
> untrusted evidence, never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `deepseek-harness-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target:** official `deepseek-ai/deepseek-harness` developer preview
- **Researcher:** API session `ses_fc91daa95ffeY5OjDszWXdSzIC`
- **Owned path:** `research/harnesses/deepseek-harness.md` (exclusive edit scope)
- **Research dates:** 2026-08-24 UTC
- **Snapshot:** tag `dsh-v0.1.1-rc.2`, commit `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`, npm `@deepseek-ai/dsh@0.1.1-rc.2`
- **Scope:** whole pre-wired runtime: composition, loop, tools, LLM adapters, context, state, delegation, authority, sandbox, credentials, protocols, observability, accounting, failures, release, and configured qualification.
- **Exclusions:** post-cutoff changes; live providers; target installation or execution; destructive denial, race, crash, traversal, or rollback probes; exhaustive transitive dependencies/licenses; comparative adoption decision.
- **Schema version:** `harness-dossier-summary/v1`
- **Completion:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`

### Executive answer

DeepSeek Harness is a large, first-party TypeScript/Cordis harness whose static
contracts emphasize typed capability seams, an append-only reconstructable
session log, per-agent scoped composition, fail-closed approval and filesystem
confinement, multiple automation/delegation protocols, and explicit release
gates. Those structures are unusually inspectable for a developer preview, but
this dossier does not qualify their runtime operation. Two material cautions
remain visible without execution: Cordis lineage is recorded with two different
version identities, and the `minimal` preset tells the model its shell has no
internet although the sandbox contract explicitly excludes network enforcement.
{C-004 FACT HIGH; S-002,S-006,S-007} {C-005 UNKNOWN N/A; S-006,S-007}
{C-027 FACT HIGH; S-012,S-021}

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** `OBSERVED`
- **Finding:** The clean, no-submodule official checkout is tag `dsh-v0.1.1-rc.2` at `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`; the root is private `@deepseek-ai/dsh-root@0.1.1-rc.2`, requires Node `^22.19.0 || >=24.0.0`, and pins pnpm `11.7.0`. {C-001 FACT HIGH; S-001,S-004}
- **Package/release:** npm records `@deepseek-ai/dsh@0.1.1-rc.2` with SHA-1 `1a5112369f1c46b13a6e6f21de8af5e6afd45074`, integrity `sha512-UP1UIh6q3Gme/yXRn/QL2P8IsVlv8Shpg22TRJIZPsCRWLm4CBiA1MUvXmJAfsOEETBMLAl+xWPtFw6ICsN3wg==`, and an npm signature. GitHub marks the 2026-08-21 release immutable and prerelease and lists no assets. {C-002 FACT HIGH; S-002,S-003}
- **Platform assumptions:** static inspection used macOS 27.0 arm64, Git 2.54.0, and Node 24.18.0; no target package was installed or executed.
- **Boundary/scope:** identity, registry, and release metadata only; “developer preview” does not imply runtime fitness.
- **Unknowns:** current runtime/test status remains C-037.
- **Evidence:** S-001–S-004.

## 2. Provenance and license {#provenance-license}

- **Status:** `PARTIAL`
- **Finding:** The official DeepSeek repository/root manifest and published CLI declare MIT; the license grants use, modification, publication, distribution, sublicensing, and sale subject to retaining notice and warranty disclaimer. {C-003 FACT HIGH; S-004,S-005}
- **Vendoring lineage:** the repository says it vendors and rescopes Cordis and foundation packages, retains upstream MIT files, and maintains an explicit local-modification log. The manifest calls the upstream Cordis snapshot `4.0.0-rc.7` at `56b3d4f725681cf4556c1a8695a709cc3b6eed74`, while the vendored package and published CLI dependency call the fork `@deepseek-ai/cordis@4.0.1`/`^4.0.1`. {C-004 FACT HIGH; S-002,S-006,S-007}
- **Contradiction:** the exact mapping from the recorded upstream rc snapshot and local changes to the fork’s `4.0.1` semantic version is not recoverable from the two manifests alone. {C-005 UNKNOWN N/A; S-006,S-007}
- **Notices/caveats:** this is not a transitive-license audit or legal/trademark opinion; third-party and optional-provider obligations remain outside scope.
- **Boundary/scope:** first-party root and named vendored Cordis lineage only.
- **Unknowns:** C-005; downstream redistribution obligations are not adjudicated.
- **Evidence:** S-002,S-004–S-007.

## 3. Repository and package map {#repository-package-map}

- **Status:** `OBSERVED_STATIC`
- **Finding:** The pinned tree contains 249 package manifests across two app packages, 234 `packages/` manifests, nine vendored packages, and four native manifests. Production composition is split across CLI/Web apps, host/client/capability package families, native sandbox support, vendored Cordis, and separate TypeScript/Python SDK surfaces; tests, docs, scripts, fixtures, and examples are support rather than default composition roots. {C-006 FACT HIGH; S-004,S-008}

```text
deepseek-harness @ b150a55…
├── apps/cli                    published dsh CLI and shipped profile/preset config
├── apps/web                    browser frontend application
├── packages/core              agent, loop, session, tools, prompt, scope
├── packages/{llm,session,...} capability definitions/providers/consumers
├── packages/{sdk,acp,mcp}     automation and extension protocols
├── vendor/*                   rescoped, modified Cordis framework layer
├── native/landlock-run        native Linux sandbox support
├── python/{sdk,sdk-runtime}   Python client and runtime carrier
├── examples/                  non-default demonstrations
├── docs/                      first-party subsystem contracts
└── **/{tests,.github}         qualification definitions, not runtime authority
```

- **Composition root/public surfaces:** root workspaces and `apps/cli/package.json` select published packages; package `exports`/`bin` fields define public artifacts, while source-only/test/example paths are not inferred reachable merely from presence.
- **Boundary/scope:** representative role map, not exhaustive dependency graph.
- **Unknowns:** exhaustive transitive package/license closure was intentionally not pursued.
- **Evidence:** S-004,S-008.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** `PARTIAL`
- **Finding:** npm exposes `dsh -> lib/bin.js`; the CLI boots named Web/headless profiles through the shared profile launcher. Additional statically reachable surfaces are the browser host, an automation-only ACP JSON-RPC stdio server, the TypeScript SDK’s explicitly named runtime subprocess, and the Python SDK’s bundled or selected newline-delimited JSON-RPC runtime. {C-007 FACT MEDIUM; S-002,S-010,S-025,S-026,S-027}
- **Invocation/config:** CLI arguments become an immutable `ctx.cmdlineArgs` snapshot; profile, patch files, launch environment, and mounted application plugins own subsequent behavior. SDK/ACP clients own their subprocess/connection lifetime.
- **Lifecycle/error:** profile boot installs fail-loud handling and bounded signal shutdown; ACP connection teardown drains its owned agents; SDK close escalates EOF → TERM → KILL.
- **Absent/bounded forms:** no release asset was attached to the pinned GitHub prerelease. The Web frontend is not treated as an independent harness loop, and examples are not entrypoints.
- **Boundary/scope:** static reachability only; startup side effects are UNKNOWN under C-037.
- **Unknowns:** C-037.
- **Evidence:** S-002,S-003,S-010,S-025–S-027.

## 5. Control and data flow {#control-data-flow}

- **Status:** `OBSERVED_STATIC`
- **Finding:** The core contract claims queued input into a turn, appends it to the session log, derives system/history/tool schemas, streams one registered adapter, dispatches validated tool calls through policy, and appends model-visible results before the next step or terminal turn. {C-008 FACT HIGH; S-013,S-014,S-015}

```text
operator/client --control--> CLI | ACP | SDK runtime
launcher --configuration data--> ordered Cordis profile tree
client --prompt/control--> Agent inbox --control--> AgentLoop
Session log --derived history data--> prompt/request assembly
AgentLoop --request data+network authority--> LLM adapter/provider
provider --chunks/usage/failure data--> BlockAssembler --data--> Session log
AgentLoop --validated args+call authority--> ToolRuntime
ToolRuntime --approval/sandbox authority--> capability implementation
capability --result/error data--> Session log --derived response data--> client
```

- **Trust crossings:** untrusted user/repository/tool/provider content enters model-visible messages; model arguments cross into tools; tool authority crosses approval/sandbox/process boundaries; provider calls cross network boundaries.
- **Error path:** adapter faults normalize to `LlmFailure`; tool faults normalize to frozen error results; unrecovered loop failures close the step/turn and emit diagnostics.
- **Boundary/scope:** arrows distinguish control, data, and authority; ordering is a static contract, not a timing measurement.
- **Unknowns:** provider faults and cancellation during effects are C-038.
- **Evidence:** S-013–S-015,S-020,S-021.

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** `OBSERVED_STATIC`
- **Finding:** Cordis services/plugins, typed capability seams, named adapter/provider registries, scoped tool/prompt registrations, ordered profile patch layers, and agent presets are the principal extension mechanisms. Bundle patches apply in declared order, then profile, home, CLI overlays, shipped-preset-root augmentation, and telemetry hard-disable. {C-009 FACT HIGH; S-009,S-010}
- **Preset isolation:** shipped roots contain `standard`, `code`, `minimal`, and `cordis`. Standard uses a standing agent-plane scope whose plugin state remains keyed per Session/Agent; service rows requiring private state mount in isolated realms, while host registries/policy stay outside. Minimal instead builds a complete fixed-prompt two-tool stack with isolated local filesystem and terminal services. {C-010 FACT HIGH; S-008,S-011,S-012}
- **Discovery/versioning/unload:** profiles resolve installation bundles first and profile-local plugins second; HMR re-reads user patches and preserves immutable lower/upper layers. Provider/registry removal blocks new work but accepted work remains owner-held where documented.
- **Protocol extensions:** MCP contributes tools only; ACP and SDK are transport adapters rather than hidden alternate loop implementations.
- **Boundary/scope:** source-private Cordis internals are not promoted to stable public API by this report.
- **Unknowns:** hot-reload behavior was not executed; Cordis lineage remains C-005.
- **Evidence:** S-006,S-009–S-012,S-024–S-028.

## 7. Agent interface {#agent-interface}

- **Status:** `PARTIAL`
- **Finding:** `Agent` exposes shared session identity, route/options, session/inbox, scoped context, `followup`/`steer`/`inject`, cooperative cancellation, maintenance, and whole-agent `whenIdle`; creation/resume return an owner-held handle whose disposal drains and unregisters the agent. {C-011 FACT HIGH; S-013}
- **Delegation:** named providers include spawn, fork, ACP, Codex, Claude Code, and DSH-SDK. Continuable children are durable sessions with at most one live activation, direct-parent authorization, FIFO inbox admission, cold resume, and child-first cleanup. Delegation depth is monotonic across durable/runtime fields; the model-facing tool defaults `maxDepth` to `3`. {C-012 FACT HIGH; S-028,S-029}

| Boundary | Producer → consumer | Payload/protocol | Lifecycle/authority | Failure/cancellation |
|---|---|---|---|---|
| Agent delivery | client/plugin → Agent inbox | identified `UserMessage` | explicit target/wakeup; owner handle controls disposal | first active cancel cause wins; idle cancel does not arm later work |
| One-shot child | parent tool → named provider | `SubagentStartRequest` | provider publishes; caller owns `SubagentRun` | signal before/after readiness; result carries stop reason |
| Continuable child | direct parent → activation manager | child/message ids + durable descriptor | exact parent/ancestry checks | interrupt preserves pending inbox; accepted work outlives caller signal |

- **Boundary/scope:** ambient initiator identity is attribution, not authorization; remote children may have no local Session.
- **Unknowns:** cross-provider practical cancellation and restart are C-038/C-039.
- **Evidence:** S-013,S-028,S-029.

## 8. Tool interface {#tool-interface}

- **Status:** `PARTIAL`
- **Finding:** a registered tool has an allowlisted model schema, mandatory validated canonical output, execution callback, optional cooperative timeout/concurrency metadata, and replay-safe presentation callbacks. Calls materialize/freeze JSON arguments and identity, then traverse pre-policy → monotonic guards → around-dispatch → post-policy → finalization → frozen result notification. Only `allowed-once` satisfies an approval ask. {C-013 FACT HIGH; S-014,S-020}

| Producer → consumer | Direction/payload | Authority/side effects | Error/cancel surface |
|---|---|---|---|
| Tool registry → model | name/description/JSON parameters | visibility only; callbacks never cross wire | unsupported schemas reject; advisory presence grants nothing |
| Model/loop → registry | call id/name/frozen JSON/signal | pre-policy and monotonic guards precede body | invalid args, unknown tools, denial, abort become structured errors |
| Registry → implementation | typed args + `ToolRunContext` | implementation owns effects; approval/sandbox are composed wrappers | same-process cancellation is cooperative; started work is drained |
| Implementation → log/model | validated value → content/meta/error | durable copy omits execution-local canonical intermediate value | observer failures contained |

- **Ordering/concurrency:** only exact `isConcurrencySafe() === true` allows overlap; all other cases are exclusive barriers.
- **Trust:** tool output is untrusted model context unless a composed policy transforms, blocks, prunes, or spills it.
- **Boundary/scope:** core ToolRuntime contract and composed policy seams; capability implementations and practical effects were not executed.
- **Unknowns:** malformed/oversized adapter cases and cancellation during real effects are C-038.
- **Evidence:** S-014,S-020,S-023.

## 9. Provider interface {#provider-interface}

- **Status:** `PARTIAL`
- **Finding:** `ctx.llm` registers provider route names atomically to adapter instances, resolves exact-model metadata separately from advisory catalogs, captures an immutable retry policy per route, and returns provider-neutral stream chunks/failures. Credentials resolve per operation; configurable pi-ai profiles may also send deployment-owned headers. {C-014 FACT HIGH; S-015,S-022,S-032,S-033}
- **Authentication:** normal key references use the credential seam; MCP stdio explicit env and Streamable HTTP headers are separate operator-configured channels. No provider credential was read or sent.
- **Transport/fallback/rate limits:** adapters own HTTP/SDK transport and context/error normalization. Retry is a separate listener/policy; there is no universal cross-provider fallback asserted here.
- **Telemetry/cost inputs:** normalized usage and failure facts return through stream events; no monetary-price contract is present in the core seam.
- **Boundary/scope:** provider services and third-party SDK internals are excluded; no network request was made.
- **Unknowns:** auth, rate-limit, malformed response, interrupted stream, and fallback behavior are C-038.
- **Evidence:** S-015,S-022,S-024,S-032,S-033.

## 10. Model interface {#model-interface}

- **Status:** `OBSERVED_STATIC`
- **Finding:** `GenerateOptions` carries provider, model, ordered messages, system text, tool schemas, sampling/output controls, cancellation, session id, and auxiliary-call purpose. Exact-route resolution can supply context window, output default, modalities, and reasoning efforts; explicit unsupported reasoning rejects rather than clamps. Streams interleave indexed content deltas, usage, and one terminal finish. {C-015 FACT HIGH; S-015}
- **Structured/rich output:** tool schemas and typed content blocks cover text, reasoning, images, calls, and results; structured tool output is validated by the tool layer. Catalog membership is advisory, not a request whitelist.
- **Streaming/error:** usage precedes finish; no chunks follow finish; adapter exceptions/in-band failures normalize to `LlmFailure`; transport idle defaults are finite in shipping adapters.
- **Routing/fallback:** provider name selects a registered adapter; one prepared call retains that registration through exact-model resolution and dispatch. Retry opens another durable attempt/turn rather than hiding adapter-level library retries.
- **Boundary/scope:** interface conformance only; actual model compatibility, context limits, quality, and billing are unverified.
- **Unknowns:** live model behavior is C-038.
- **Evidence:** S-015.

## 11. Context interface {#context-interface}

- **Status:** `PARTIAL`
- **Finding:** model context is derived from the append-only session surface plus a rendered system prompt, exact request header, scoped tool schemas, and plugin-sourced messages with source/form metadata. Optional compaction writes a log-bracketed summary replacement; standard/code presets enable it while minimal explicitly omits it. Defaults trigger at `0.8` of context and retain `0.16`; fallback estimation uses four JavaScript string code units per token plus fixed framing overhead. {C-016 FACT HIGH; S-011,S-012,S-013,S-015,S-017,S-018,S-019}
- **Ordering/provenance:** message identity, role, source, provider/model provenance, and replacement/shadow seqs remain explicit. Model-facing instructions and untrusted repository/tool content still share the model context; provenance is metadata, not an injection barrier.
- **Truncation/compaction:** max-token assembly drops unsafe truncated tool calls; tool-result pruning preserves head/tail and rich-block order; compaction requires balanced call/result boundaries.
- **Accounting:** provider usage is reused only against a matching conservative request anchor; otherwise the complete envelope and surface are estimated.
- **Boundary/scope:** summary quality, cache reuse, contamination resistance, and long-session behavior were not measured.
- **Unknowns:** adversarial injection and accounting disagreement are C-038.
- **Evidence:** S-011–S-019.

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** `PARTIAL`
- **Finding:** the in-memory source of truth is an append-only typed Session log with separate immutable header metadata. Persistence batches copied events asynchronously but `session/flush` drains through quiescence; JSONL and SQLite providers implement the same contiguous append/load/inspect contract. Cold load preserves a complete interrupted turn and adds synthetic closure; unknown versions are refused rather than migrated. {C-017 FACT HIGH; S-013,S-016}
- **Ownership/schema/path:** header records cwd, lineage, seed length, delegation depth, and preset. JSONL owns per-session artifacts; SQLite shares a database. Retention/deletion are consumer/provider concerns, not a universal policy.
- **Transactions/corruption:** append requires contiguous seqs. Torn final fragments may be discarded, committed-prefix corruption rejects, and unsupported formats use a distinct error.
- **Restart unknown:** these are source contracts, not observed hard-kill recovery; practical loss, repair, replay, and corrupted-artifact outcomes remain unqualified. {C-039 UNKNOWN N/A; S-016}
- **Boundary/scope:** no persistence backend was created or mutated.
- **Unknowns:** C-039.
- **Evidence:** S-013,S-016.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** `PARTIAL`
- **Finding:** presets separate host-plane registries from agent-plane scope layers; private service rows use isolated realms while mutable plugin state is keyed per Session/Agent. Tool scheduling defaults to exclusive unless explicitly safe, and sibling subagents may overlap in independent sessions. This is logical/process isolation, not a worktree allocator or OS tenant boundary. {C-018 FACT MEDIUM; S-010,S-011,S-014,S-028,S-029}
- **Queues/locks:** an Agent inbox is the turn FIFO; continuable activation admission enforces one live activation per durable child; credential records and persistence have provider-specific locks/coordination.
- **Collision/cleanup:** duplicate route, service, provider, and live agent ids fail. Profile and preset realm comments identify collision prevention, but same-workspace tool effects remain model/operator coordinated.
- **Determinism/races:** result commits retain model order for parallel-safe tools, but job ids/workspace writes can reflect dispatch races.
- **Boundary/scope:** no two-session/worktree/tenant collision was executed.
- **Unknowns:** practical collision, race, and teardown behavior are C-038.
- **Evidence:** S-010,S-011,S-014,S-022,S-028,S-029.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** `PARTIAL`
- **Finding:** approval outcomes are closed and fail closed; only `allowed-once` grants the asked action. Sandbox modes govern filesystem effects only: `read-only`, `workspace-write`, or unconfined `danger-full-access`. Confined providers must return an enforcing argv or fail closed, and report `full` versus `partial`; network and process visibility are outside this vocabulary. {C-019 FACT MEDIUM; S-020,S-021}

| Actor | Action/authority | Static enforcement | Residual boundary |
|---|---|---|---|
| Model/tool call | invoke visible tool | schema, pre-policy, monotonic guards, optional approval | tool visibility is not authority; implementation defines effects |
| Human/ACP answerer | decide one ask | closed outcome; missing/throwing answerer → unavailable | grant covers only asked action |
| Session policy | select approval/sandbox mode | durable policy event and per-call resolution | explicit approved sandbox retry outranks session mode |
| Sandbox provider | confine subprocess file effects | platform backend; fail-closed wrap; full/partial report | no network/process-visibility control |
| `minimal` preset | local file/process stack | isolated `fs-local`; host subprocess/sandbox services remain as composed | model text says no internet without corresponding enforcement |

- **Policy/enforcement contradiction:** `minimal`’s shell description says no internet, but its local filesystem override and the sandbox contract do not enforce network denial. {C-027 FACT HIGH; S-012,S-021}
- **Boundary/scope:** actual escape resistance and denial diagnostics were not executed. {C-038 UNKNOWN N/A; S-012,S-020,S-021,S-023}
- **Unknowns:** C-038.
- **Evidence:** S-012,S-014,S-020,S-021,S-023.

## 15. Evidence and observability {#evidence-observability}

- **Status:** `PARTIAL`
- **Finding:** durable Session events carry seq/time/type/data, with agent, tool, approval, compaction, and subagent lifecycle/correlation identities. Optional Session Telemetry copies ledger and ops records to a nonblocking backend; the OTel provider uses OTLP/HTTP, is `DISABLED` by default, and treats delivery as best-effort with possible loss/duplication. The seam ships no redaction rules. {C-020 FACT MEDIUM; S-013,S-016,S-017,S-030,S-031}
- **Ownership/durability:** the session log is canonical; telemetry cursor means handed-off, not delivered. Receiver dedupe uses `(session.id,event.seq)` for ledger records; ops records intentionally lack that identity.
- **Export/query/redaction:** full payload copies reach the redaction waterfall; without a listener they pass unchanged. OTel batching/retry/loss policy belongs to the SDK/collector.
- **Tamper resistance:** no cryptographic integrity or hostile-input spoof-resistance claim is established; subprocess internals and external side effects are not automatically receipted.
- **Unknown:** loss, duplicate, redaction, and forged-field behavior under failure was not executed. {C-040 UNKNOWN N/A; S-030,S-031}
- **Boundary/scope:** configured optional telemetry, not evidence that this research contacted a collector.
- **Unknowns:** C-040.
- **Evidence:** S-013,S-016,S-017,S-030,S-031.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** `PARTIAL`
- **Finding:** adapters report disjoint uncached input, cache-read/write, output, and optional reasoning token fields; the token meter reuses matching conservative provider usage or estimates the complete request/surface. `compaction-basic` defaults to pressure `0.8`, retained tail `0.16`, summary max tokens 8192, one compaction retry, and one overflow retry. No core monetary-pricing or global CPU/memory/network budget seam is asserted. {C-021 FACT HIGH; S-015,S-018,S-019}
- **Limits/enforcement:** agent/model `maxTokens`, tool/subprocess timeouts, bounded output/spill, and compaction pressure are local controls; they do not constitute host quotas.
- **Cache/retry attribution:** normalized usage can identify cache categories, but this dossier did not reconcile retries/estimates with provider invoices.
- **Estimation:** text length is JavaScript UTF-16 code units divided by four, rounded up, plus four-token block/role overheads; it is explicitly heuristic.
- **Boundary/scope:** token accounting only; price, CPU, memory, and network use remain external/unknown.
- **Unknowns:** provider/estimate disagreement and budget exhaustion are within C-038.
- **Evidence:** S-015,S-018,S-019,S-023.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** `PARTIAL`
- **Finding:** cancellation propagates through Agent activity, model requests, tool signals, managed process-tree termination, and subagent startup/run ownership. Adapter failures normalize to `LlmFailure`; retry policy defaults to five in normal mode and opens another durable attempt/turn; tool failures become structured results. Process cleanup escalates TERM → grace → KILL where applicable. {C-022 FACT MEDIUM; S-013,S-014,S-015,S-023,S-025,S-026,S-028}
- **Retry/idempotency:** provider retry owns model attempts; release publication owns registry retries; arbitrary tools have no universal idempotency key. Partial tool writes can precede cancellation.
- **Partial success/diagnostics:** interrupted provider chunks are not committed as a normal assistant result; subagent non-completed output is treated as partial/error; persistence records interrupted turns statically.
- **Crash/restart:** source defines repair, but hard interruption/restart remains C-039. Cancellation/provider fault practical behavior remains C-038. {C-038 UNKNOWN N/A; S-014,S-015,S-023,S-028} {C-039 UNKNOWN N/A; S-016}
- **Boundary/scope:** source propagation trace; no fault injection.
- **Unknowns:** C-038,C-039.
- **Evidence:** S-013–S-016,S-023,S-025,S-026,S-028,S-036.

## 18. Install, update, and release {#install-update-release}

- **Status:** `PARTIAL`
- **Finding:** the npm CLI requires the root’s Node range and publishes a signed prerelease tarball. Release automation uses frozen installs, verifies tag/version, builds an official profile, packs before publication, verifies clean packed installs, publishes the exact uploaded tarballs, compares registry/local integrity for idempotence, and retries only bounded transient registry failures. {C-023 FACT HIGH; S-002,S-003,S-004,S-035,S-036}
- **Artifact/source traceability:** the tag and package repository directory align; npm integrity/signature and immutable GitHub release metadata pin the artifact identity. Bit-for-bit local rebuild reproducibility was not attempted.
- **Update/compatibility:** prerelease semver and explicit profile/package pinning are observed; no runtime auto-updater is claimed.
- **Rollback unknown:** the inspected workflow/script publish sequentially and stop on an unrecoverable failure, but they do not define a compensating transaction for packages already published. Practical partial-publication rollback is UNKNOWN. {C-041 UNKNOWN N/A; S-035,S-036}
- **Boundary/scope:** configured automation, not proof the historical workflow run passed.
- **Unknowns:** C-041; artifact rebuild reproducibility.
- **Evidence:** S-002–S-004,S-035,S-036.

## 19. Tests and qualification {#tests-qualification}

- **Status:** `UNKNOWN_RUNTIME_RESULT`
- **Finding:** the pinned tree contains 889 test files: 752 `*.spec.ts`, 136 `*.e2e.ts`/`*.e2e.mts`, and one `*.perf.ts`, plus 18 workflow files. Configured lanes cover Node 22.19/24/26, Python 3.10 SDK/runtime, Linux, Wine-based Windows blocking checks, and observational native Windows; frozen installs and telemetry disablement are explicit. {C-024 FACT HIGH; S-004,S-034,S-037}
- **Layers:** static/lint/type/coverage, snapshots/artifacts/consumers, E2E/provider-specific workflows, Python, sandbox/native, and release verification are represented. Tests and examples are not treated as production reachability.
- **Qualification limit:** no target tests or built artifacts were run locally; therefore current pass/fail, platform behavior, coverage, and live-provider compatibility remain UNKNOWN. {C-037 UNKNOWN N/A; S-004,S-034,S-037}
- **Claims directly qualified here:** identity, hashes, static composition, source contracts, configured matrices, and inventory counts only.
- **Boundary/scope:** test presence/configuration is not a passing test result.
- **Unknowns:** C-037 plus dynamic C-038–C-040.
- **Evidence:** S-004,S-034,S-037.

## 20. Security {#security}

- **Status:** `PARTIAL`
- **Finding — credentials:** resolution precedence is inherited environment → `$DSH_HOME/.credentials.yaml` → invocation-cwd `.env` → `$DSH_HOME/.env`. The managed file is owner-only and not loaded into child env, but upstream explicitly states that same-UID model/tool processes can deliberately read it because filesystem policy confines writes, not reads. Ambient child env scrubbing removes names matching `KEY|PASSWORD|SECRET|TOKEN` and `DSH_*`; explicit overrides merge later and survive. {C-025 FACT HIGH; S-022,S-023}
- **Finding — extension secret surfaces:** MCP supports explicit stdio env and Streamable HTTP headers. pi-ai accepts arbitrary string headers, removes only case-insensitive harness-attribution collisions, and forwards the remainder. These paths can place secrets in ordinary configuration outside the credential seam. {C-026 FACT HIGH; S-024,S-032,S-033}
- **Finding — enforcement mismatch:** the `minimal` no-internet statement exceeds the filesystem-only sandbox’s enforcement vocabulary. {C-027 FACT HIGH; S-012,S-021}
- **Threat boundaries:** untrusted prompts/repository/tool/provider/MCP data; model-generated tool args; host filesystem/process/network; same-UID credential storage; arbitrary provider endpoints/headers; package/vendor supply chain; optional telemetry export.
- **Input/path/network:** JSON/schema validation, scoped tools, approval, and platform sandbox backends are present statically; network denial, path/symlink abuse, injection resistance, and process escape remain C-038. Telemetry spoof/loss is C-040. {C-038 UNKNOWN N/A; S-014,S-015,S-021,S-023,S-024} {C-040 UNKNOWN N/A; S-030,S-031}
- **Boundary/scope:** no security acceptance, vulnerability absence, exploitability, or live secret exposure claim.
- **Unknowns:** C-038,C-040; no exhaustive advisory/dependency audit.
- **Evidence:** S-012,S-014,S-015,S-021–S-024,S-030–S-033.

## 21. Strengths {#strengths}

- **Status:** `INTERPRETATION`
- **Composable inspectability:** capability seams, named registries, scoped presets, and deterministic profile overlays make static ownership and omission more visible than a monolithic hidden loop. This is an inspectability strength at the pinned snapshot, not a runtime-fitness finding. {C-028 INFERENCE HIGH; S-009,S-010,S-013,S-014,S-015}
- **Reconstructable evidence model:** append-only typed events, immutable request headers, sourced context replacements, and explicit interrupted-turn repair provide a strong static basis for replay/audit without pretending telemetry delivery is canonical. {C-029 INFERENCE HIGH; S-013,S-015,S-016,S-017,S-030}
- **Boundary/scope:** strengths concern architecture legibility and evidence structure only.
- **Unknowns:** operational reliability, latency, developer effort, and semantic replay fidelity were not measured.
- **Evidence:** S-009,S-010,S-013–S-017,S-030.

## 22. Liabilities {#liabilities}

- **Status:** `INTERPRETATION`
- **Filesystem-only confinement:** when users or model-facing text interpret a sandbox mode as broader isolation, network/process visibility and same-UID reads remain available; `minimal` demonstrates this exact mismatch. Trigger: selecting a confined mode or preset while assuming internet/secret isolation. Consequence: false authority expectations. Upstream mitigation is to report full/partial file enforcement and fail closed when a confined runner is unavailable, but it does not add the missing boundaries. {C-030 INFERENCE HIGH; S-012,S-021,S-022}
- **Secret-bearing alternate channels:** custom provider/MCP headers and explicit child env can intentionally bypass credential indirection and ambient scrubbing. Trigger: embedding secrets in those fields. Consequence: secrets reside in configuration or reach spawned/external processes; same-UID tools can also read the managed file. {C-031 INFERENCE HIGH; S-022,S-023,S-024,S-032,S-033}
- **Boundary/scope:** liabilities identify responsibility transfer; they are not a project rejection.
- **Unknowns:** actual exploitability and prevalence were not measured.
- **Evidence:** S-012,S-021–S-024,S-032,S-033.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** `INTERPRETATION`
- **Ordered overlays with hard final policy (`CANDIDATE`):** compose immutable bundles, user layers, invocation overlays, then a non-displaceable policy patch; preserve one patch implementation for boot/dump/HMR. Prerequisites: unique row ids, transactional recomposition, immutable cloning, loud conflicts. Risk: order complexity and trusted code expressions. {C-032 INFERENCE HIGH; S-009,S-010}
- **Standing composition plus per-subject scope (`CONDITIONAL`):** mount capability definitions once, bind agents by scope, and key mutable state by explicit Session/Agent identity. Prerequisites: collision checks, lifecycle-owned disposal, and explicit separation from authorization. Risk: scope isolation can be mistaken for security isolation. {C-033 INFERENCE HIGH; S-011,S-013,S-014,S-028}
- **Append-only interrupted-operation evidence (`CONDITIONAL`):** retain committed prefixes, bracket maintenance operations, and add synthetic interruption closure only on cold recovery. Prerequisites: contiguous ids, explicit commit/flush points, idempotency policy, corruption refusal. Risk: practical crash semantics remain unverified here. {C-034 INFERENCE MEDIUM; S-016,S-017}
- **Preserved boundary:** all patterns keep policy/authority outside model prose and retain explicit ownership.
- **Boundary/scope:** research dispositions only; none is adopted or approved.
- **Unknowns:** fit with downstream decisions and runtime proof remains separate work.
- **Evidence:** S-009–S-011,S-013,S-014,S-016,S-017,S-028.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** `INTERPRETATION`
- **Model-facing “no internet” text as enforcement — `CURIOSITY_NO_GO`:** rejected because the `minimal` statement has no corresponding network control in the sandbox vocabulary. Failure mode: a model/operator relies on prose while the process retains network visibility. Reopen only with an executable deny boundary and denial-path evidence. {C-035 INFERENCE HIGH; S-012,S-021}
- **Environment-name scrubbing as a secret boundary — `CURIOSITY_NO_GO`:** rejected because the regex is heuristic, explicit overrides survive, and same-UID reads remain. Failure mode: unnamed or deliberately forwarded credentials reach child/external processes. Reopen only with capability-scoped secret handles and process/read isolation. {C-036 INFERENCE HIGH; S-022,S-023,S-024}
- **Runtime installation/qualification in this dossier — `CURIOSITY_NO_GO`:** rejected under the declared static-only boundary; no passing result is manufactured from source/test presence. Reopen with an authorized disposable environment, no secrets, denied network except the tested boundary, and captured outputs. {C-037 UNKNOWN N/A; S-003,S-004,S-034,S-037}
- **Other rejected curiosity threads:** live providers/MCP/OTel, broad history, exhaustive transitive enumeration, destructive traversal/race/crash probes, post-cutoff changes, and competitor synthesis. Each exceeded authority/budget or had nonpositive marginal evidence after static saturation.
- **Boundary/scope:** rejections are snapshot and research-scenario bounded.
- **Unknowns:** C-037–C-041 state reopen conditions.
- **Evidence:** S-003,S-004,S-012,S-021–S-024,S-034,S-037.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** `COMPLETE_WITH_UNKNOWNS`
- **Probe policy:** expected behavior was declared before challenge. Only static source/metadata/inventory probes were used; target code, providers, credentials, and side effects were not executed. Skips remain UNKNOWN, never passes. {C-037 UNKNOWN N/A; S-001,S-004,S-034,S-037}

| Probe | Expected safe behavior | Actual result | Result | Environment | Claims | Sources |
|---|---|---|---|---|---|---|
| P-01 Startup/no-op | Help/startup declares and confines writes, network, processes, telemetry, and credential reads. | Entrypoints and telemetry default were traced; startup was not executed and profile preparation statically writes/maintains home files. | `NOT_RUN_UNSAFE` | macOS 27 arm64; static only | C-007,C-020,C-037 | S-004,S-010,S-030,S-034 |
| P-02 Permission denial/bypass | Every consequential denial is enforced, alternate paths cannot bypass it, and diagnostics preserve cause. | Approval and confined filesystem paths fail closed statically; minimal local fs and network/process exclusions prevent a general bypass result. | `INCONCLUSIVE` | static source trace | C-019,C-027,C-038 | S-012,S-020,S-021,S-023 |
| P-03 Malformed/oversized input | Boundary schemas reject before effects and oversized values are bounded. | Tool/LLM/MCP schemas and output limits exist; adapter-specific malformed/oversized cases were not executed. | `INCONCLUSIVE` | static source trace | C-013,C-015,C-038 | S-014,S-015,S-024 |
| P-04 Cancellation/timeout | Cancel propagates, owned work quiesces, and partial state remains explicit. | Agent/tool/process/subagent cancellation contracts were traced; no live side effect or stream was cancelled. | `INCONCLUSIVE` | static source trace | C-011,C-022,C-038 | S-013,S-014,S-023,S-025,S-028 |
| P-05 Retry/duplication/partial failure | Retry ownership/backoff are bounded; duplicate effects and partial writes are not silently replayed. | LLM and release retry owners are explicit; arbitrary tools lack universal idempotency and duplicate delivery was not induced. | `INCONCLUSIVE` | static source trace | C-022,C-038 | S-014,S-015,S-016,S-036 |
| P-06 Concurrency/isolation collision | Colliding sessions/worktrees do not share mutable state or silently overwrite. | Scope/id collision checks and exclusive-by-default tools were found; same-workspace races and cross-process collisions were not run. | `INCONCLUSIVE` | static source trace | C-018,C-038 | S-011,S-014,S-028,S-029 |
| P-07 Crash/restart | Hard interruption yields bounded repair without corruption or unsafe effect replay. | Cold interrupted-turn repair is defined; hard kill/restart against JSONL/SQLite was not performed. | `NOT_RUN_UNSAFE` | no disposable target runtime/store | C-017,C-039 | S-016 |
| P-08 Provider/model/network unavailable | Auth/rate-limit/malformed/interrupted errors preserve cause and do not retry/spend forever. | Normalized errors, idle timeout, and bounded retry are defined; network/provider simulation was excluded. | `NOT_RUN_UNSAFE` | no credentials; target network not used | C-014,C-022,C-038 | S-015,S-022,S-032,S-033 |
| P-09 Instruction injection | Untrusted repository/tool/provider text cannot change executable authority. | Provenance/policy seams separate data from authority, but minimal model text misstates network capability and no injection efficacy test ran. | `INCONCLUSIVE` | static source trace | C-027,C-030,C-038 | S-012,S-014,S-021 |
| P-10 Filesystem abuse | Traversal, absolute paths, symlinks, case collisions, and escape remain confined. | Per-call canonical roots and backend enforcement are documented; platform/TOCTOU behavior was not challenged. | `INCONCLUSIVE` | static source trace; no escape execution | C-019,C-038 | S-021,S-023 |
| P-11 Resource/cost disagreement | Missing/contradictory usage and budget exhaustion are explicit. | Provider usage and heuristic fallback are distinguishable; no provider reconciliation, price, or host quota test ran. | `INCONCLUSIVE` | static source trace | C-021,C-038 | S-015,S-018,S-019 |
| P-12 Install pin/rollback | Immutable artifacts map to source; failed update/partial publish has a defined rollback. | Tag, npm integrity/signature, packed verification, and integrity idempotence are present; rebuild and partial-publication rollback remain unknown. | `INCONCLUSIVE` | passive metadata/static release trace | C-002,C-023,C-041 | S-002,S-003,S-035,S-036 |
| P-13 Claimed absence/disabled feature | Disabled/absent claims survive alternate configuration and entrypoint tracing. | `minimal` says its shell has no internet while the sandbox contract excludes network enforcement. | `FAIL` | bounded static contradiction | C-027,C-035 | S-012,S-021 |
| P-14 Evidence loss/forgery | Denied/failed/cancelled actions correlate, redact, survive shutdown, and resist spoofed fields. | Durable ids and telemetry dedupe guidance exist; telemetry is best-effort, ships no redaction, and loss/spoof resistance was not executed. | `INCONCLUSIVE` | static source trace | C-020,C-040 | S-030,S-031 |

- **Boundary/scope:** `FAIL` is limited to the specific documented no-internet claim; `INCONCLUSIVE` is not a security verdict.
- **Unknowns:** C-005,C-037–C-041.
- **Evidence:** S-001–S-037.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "The official clean, no-submodule tag dsh-v0.1.1-rc.2 resolves to b150a551b8d465e31e418e1b2eaf5e79bbb7d28e, whose private root is version 0.1.1-rc.2 and requires Node ^22.19.0 or >=24.0.0 with pnpm 11.7.0."
  classification: FACT
  confidence: HIGH
  scope: "Git/root-manifest identity at the pinned snapshot; no runtime"
  source_ids: [S-001, S-004]
  fact_dependencies: []
  method: "Resolved exact tag/commit, remote, commit date, dirty/submodule state, and root manifest fields."
  counterevidence: "none found in exact Git ref and root manifest"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "The immutable prerelease and npm record identify @deepseek-ai/dsh@0.1.1-rc.2 with SHA-1 1a5112369f1c46b13a6e6f21de8af5e6afd45074, the recorded SHA-512 integrity, one npm signature, and no GitHub release assets."
  classification: FACT
  confidence: HIGH
  scope: "versioned GitHub release and npm metadata; package bytes not executed"
  source_ids: [S-002, S-003]
  fact_dependencies: []
  method: "Retrieved exact version/tag metadata from official registry and GitHub API."
  counterevidence: "none found in exact version/tag records"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: provenance-license
  statement: "The DeepSeek repository/root manifest and published CLI declare MIT, whose text requires retained notice and disclaims warranty."
  classification: FACT
  confidence: HIGH
  scope: "first-party root and CLI; excludes transitive dependencies"
  source_ids: [S-002, S-004, S-005]
  fact_dependencies: []
  method: "Compared registry/root license fields with the actual pinned license text."
  counterevidence: "none found in named first-party records"
  adversarial_status: "NOT_APPLICABLE:no-runtime-claim"
- claim_id: C-004
  section: provenance-license
  statement: "The vendor manifest records Cordis upstream 4.0.0-rc.7 at 56b3d4f725681cf4556c1a8695a709cc3b6eed74 while the modified fork declares @deepseek-ai/cordis 4.0.1 and the CLI depends on ^4.0.1."
  classification: FACT
  confidence: HIGH
  scope: "pinned vendor manifest, vendored package manifest, and npm CLI dependency"
  source_ids: [S-002, S-006, S-007]
  fact_dependencies: []
  method: "Compared the three exact version/provenance fields without reconciling them."
  counterevidence: "the version identities differ; preserved as stated"
  adversarial_status: CHALLENGED
- claim_id: C-005
  section: provenance-license
  statement: "The exact semantic mapping from the recorded upstream Cordis 4.0.0-rc.7 snapshot and local modifications to the fork version 4.0.1 is unresolved."
  classification: UNKNOWN
  confidence: N/A
  scope: "Cordis lineage at the pinned repository; broad Git history and external fork history excluded"
  source_ids: [S-006, S-007]
  fact_dependencies: []
  method: "attempted_methods=compared exhaustive vendor modification manifest with vendored package identity; blocker=the manifest records an upstream rc version while the fork manifest supplies a later semantic version without a one-to-one provenance mapping; impact=version-lineage and patch comparison cannot assume rc.7 equals fork 4.0.1; available_evidence=S-006,S-007; next_probe=obtain an upstream-to-fork commit/patch ledger for @deepseek-ai/cordis 4.0.1"
  counterevidence: "S-006 upstream version conflicts with S-007 fork version for a single unqualified lineage label"
  adversarial_status: CHALLENGED
- claim_id: C-006
  section: repository-package-map
  statement: "The pinned monorepo has 249 manifests across apps, capability/host/client packages, vendored framework packages, and native support, with CLI/Web, SDK, Python, docs, examples, and tests in distinct trees."
  classification: FACT
  confidence: HIGH
  scope: "bounded manifest/tree inventory; no exhaustive dependency edges"
  source_ids: [S-004, S-008]
  fact_dependencies: []
  method: "Enumerated versioned package manifests and top-level production/support trees."
  counterevidence: "none found in bounded inventory"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: executable-entrypoints
  statement: "Static entrypoints include the dsh CLI/profile launcher, Web/headless profile applications, ACP JSON-RPC stdio, a TypeScript runtime subprocess client, and a Python SDK/runtime carrier."
  classification: FACT
  confidence: MEDIUM
  scope: "declared first-party entrypoints; static reachability only"
  source_ids: [S-002, S-010, S-025, S-026, S-027]
  fact_dependencies: []
  method: "Traced package bin metadata, profile run function, and protocol/SDK package contracts."
  counterevidence: "none found in named surfaces; examples excluded"
  adversarial_status: NOT_PROBED
- claim_id: C-008
  section: control-data-flow
  statement: "The core static loop claims queued input, derives prompt/history/tools from the session state, streams the selected LLM adapter, dispatches validated tools, and appends model-visible results before continuing or closing the turn."
  classification: FACT
  confidence: HIGH
  scope: "documented/generated core contracts at the pinned snapshot; no timing assertion"
  source_ids: [S-013, S-014, S-015]
  fact_dependencies: []
  method: "Traced the first-party core spine, tool pipeline, and LLM request/stream contracts."
  counterevidence: "none found in the named static contracts"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: module-extension-boundaries
  statement: "Effective profile composition orders bundle patches, profile patches, home patches, CLI overlays, shipped-preset-root augmentation, and the final telemetry hard-disable."
  classification: FACT
  confidence: HIGH
  scope: "apps/cli shared profile boot at the pinned snapshot"
  source_ids: [S-009, S-010]
  fact_dependencies: []
  method: "Traced profile loading, allPatches/composeProfile, shipped-root append, and telemetry append order."
  counterevidence: "none found in the complete composition functions"
  adversarial_status: SUPPORTED
- claim_id: C-010
  section: module-extension-boundaries
  statement: "The four shipped presets use agent-plane scoped composition; standard retains Session/Agent-keyed state behind isolated services, while minimal mounts an isolated local filesystem and persistent terminal stack."
  classification: FACT
  confidence: HIGH
  scope: "shipped preset roots and standard/minimal compositions"
  source_ids: [S-008, S-011, S-012]
  fact_dependencies: []
  method: "Enumerated preset roots and inspected complete standard/minimal composition comments and rows."
  counterevidence: "none found in the bounded preset roots"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: agent-interface
  statement: "Agent exposes session identity, inbox routing, scoped context, cancellation, maintenance, and whole-agent idle observation, while create/resume return an owner-held disposal handle."
  classification: FACT
  confidence: HIGH
  scope: "core Agent and AgentRegistry static contract"
  source_ids: [S-013]
  fact_dependencies: []
  method: "Inspected the generated first-party Agent and ownership contracts."
  counterevidence: "none found in named contract"
  adversarial_status: NOT_PROBED
- claim_id: C-012
  section: agent-interface
  statement: "Subagent providers include spawn, fork, ACP, Codex, Claude Code, and DSH-SDK; durable depth is monotonic and the model-facing tool defaults its absolute maxDepth to 3."
  classification: FACT
  confidence: HIGH
  scope: "subagent registry/tool contracts; provider operation not executed"
  source_ids: [S-028, S-029]
  fact_dependencies: []
  method: "Inspected provider list, depth derivation, continuation lifecycle, and tool config default."
  counterevidence: "none found in named contracts"
  adversarial_status: SUPPORTED
- claim_id: C-013
  section: tool-interface
  statement: "Tool calls use allowlisted schemas and frozen identity/JSON arguments through pre-policy, monotonic guards, dispatch, post-policy, validation, finalization, and frozen result notification."
  classification: FACT
  confidence: HIGH
  scope: "core ToolRuntime static pipeline"
  source_ids: [S-014, S-020]
  fact_dependencies: []
  method: "Inspected tool definition/schema, execute pipeline, approval decision, and result contracts."
  counterevidence: "none found in named pipeline"
  adversarial_status: SUPPORTED
- claim_id: C-014
  section: provider-interface
  statement: "Provider routes register atomically to LLM adapters, credentials resolve per operation, and deployment profiles may also forward configured non-attribution headers."
  classification: FACT
  confidence: HIGH
  scope: "LLM registry, credential provider, and pi-ai configuration/adapter; no provider I/O"
  source_ids: [S-015, S-022, S-032, S-033]
  fact_dependencies: []
  method: "Traced route registration/exact-model resolution, credential precedence, and header merge."
  counterevidence: "none found in named code/contracts"
  adversarial_status: NOT_PROBED
- claim_id: C-015
  section: model-interface
  statement: "The model seam defines provider-neutral messages, tools, exact-route capabilities, indexed streaming chunks, disjoint token usage, and normalized terminal failures."
  classification: FACT
  confidence: HIGH
  scope: "dsh-llm static types/runtime contract; no live model"
  source_ids: [S-015]
  fact_dependencies: []
  method: "Inspected GenerateOptions, StreamChunk, TokenUsage, model resolution, and LlmRuntime contracts."
  counterevidence: "none found in named contract"
  adversarial_status: NOT_PROBED
- claim_id: C-016
  section: context-interface
  statement: "Context derives from logged history, prompt/tool assembly, and sourced plugin messages; optional compaction defaults to pressure 0.8 and retained tail 0.16, while fallback token estimation uses four JavaScript string code units plus fixed overhead."
  classification: FACT
  confidence: HIGH
  scope: "core/context/standard-minimal preset and compaction/token-meter static code"
  source_ids: [S-011, S-012, S-013, S-015, S-017, S-018, S-019]
  fact_dependencies: []
  method: "Traced request derivation, preset composition, compaction config, and estimator constants."
  counterevidence: "none found in named source; provider tokenization may differ by design"
  adversarial_status: SUPPORTED
- claim_id: C-017
  section: state-persistence-restart
  statement: "Session persistence appends contiguous event batches, flushes as the loop checkpoint, refuses unsupported formats, and cold-loads complete interrupted turns with synthetic closure through JSONL or SQLite providers."
  classification: FACT
  confidence: MEDIUM
  scope: "static persistence contract; hard crash not executed"
  source_ids: [S-013, S-016]
  fact_dependencies: []
  method: "Inspected session source-of-truth and persistence flush/load/recovery contracts."
  counterevidence: "none found in named static contracts"
  adversarial_status: CHALLENGED
- claim_id: C-018
  section: concurrency-worktree-isolation
  statement: "The harness provides logical scope/session isolation, exclusive-by-default tool scheduling, and independent subagent sessions, but no default worktree or OS tenant allocator is established by those mechanisms."
  classification: FACT
  confidence: MEDIUM
  scope: "preset/tool/subagent contracts; bounded absence from named mechanisms"
  source_ids: [S-010, S-011, S-014, S-028, S-029]
  fact_dependencies: []
  method: "Compared realm/session keys and tool/subagent scheduling with the complete named preset mechanisms."
  counterevidence: "no allocator found in named mechanisms; external plugins/deployments excluded"
  adversarial_status: CHALLENGED
- claim_id: C-019
  section: permissions-authority-sandbox
  statement: "Approval grants only allowed-once and otherwise fails closed, while sandbox modes govern filesystem effects only and explicitly exclude network and process visibility."
  classification: FACT
  confidence: MEDIUM
  scope: "approval and sandbox static contracts; enforcement not executed"
  source_ids: [S-020, S-021]
  fact_dependencies: []
  method: "Compared closed approval outcomes with sandbox modes/provider failure contract."
  counterevidence: "none found for scoped static statement"
  adversarial_status: CHALLENGED
- claim_id: C-020
  section: evidence-observability
  statement: "Durable Session events carry sequence, type, data, and lifecycle/correlation identities, while optional session telemetry is disabled by default, best-effort, OTLP/HTTP-capable, potentially lossy/duplicative, and ships no redaction rules."
  classification: FACT
  confidence: MEDIUM
  scope: "session telemetry seam and OTel backend static contract; no collector"
  source_ids: [S-013, S-016, S-017, S-030, S-031]
  fact_dependencies: []
  method: "Inspected coordinator delivery/redaction contract and OTel mode/export/shutdown implementation."
  counterevidence: "none found; deployment-provided redactors remain possible"
  adversarial_status: CHALLENGED
- claim_id: C-021
  section: resource-token-cost-accounting
  statement: "The harness distinguishes provider token categories from heuristic request/surface estimates, but the inspected core seam provides no universal monetary or host-resource budget."
  classification: FACT
  confidence: HIGH
  scope: "LLM token usage, token meter, and compaction config; external deployment quotas excluded"
  source_ids: [S-015, S-018, S-019]
  fact_dependencies: []
  method: "Compared TokenUsage fields, estimator implementation, and compaction budgets."
  counterevidence: "none found in named accounting seams"
  adversarial_status: NOT_PROBED
- claim_id: C-022
  section: failure-cancellation-retry
  statement: "Agent, LLM, tool, subprocess, ACP/SDK, and subagent contracts propagate cooperative cancellation and typed failures, with bounded process/retry cleanup owned by the relevant layer."
  classification: FACT
  confidence: MEDIUM
  scope: "static first-party contracts; no fault injection"
  source_ids: [S-013, S-014, S-015, S-023, S-025, S-026, S-028, S-036]
  fact_dependencies: []
  method: "Traced cancellation, failure normalization, retry ownership, and shutdown ladders across interfaces."
  counterevidence: "none found in static contracts; practical settlement unknown"
  adversarial_status: CHALLENGED
- claim_id: C-023
  section: install-update-release
  statement: "Release controls use frozen installs, tag/version verification, official build, pack-before-publish, clean packed-install verification, integrity-based idempotence, and four-attempt transient-registry retry."
  classification: FACT
  confidence: HIGH
  scope: "configured npm release workflow/scripts; historical run status excluded"
  source_ids: [S-002, S-003, S-004, S-035, S-036]
  fact_dependencies: []
  method: "Inspected versioned registry/release metadata and complete pack/publish workflow/script."
  counterevidence: "none found in named release path"
  adversarial_status: SUPPORTED
- claim_id: C-024
  section: tests-qualification
  statement: "The pinned tree has 889 test files and 18 workflows, with configured Node 22.19/24/26, Python 3.10/runtime, Linux, Wine Windows, and observational native Windows lanes."
  classification: FACT
  confidence: HIGH
  scope: "static file/config inventory; no run result"
  source_ids: [S-004, S-034, S-037]
  fact_dependencies: []
  method: "Counted bounded filename classes and inspected the complete primary PR workflow matrix."
  counterevidence: "none found in bounded inventory"
  adversarial_status: SUPPORTED
- claim_id: C-025
  section: security
  statement: "Credential precedence is inherited environment, managed credentials file, project .env, then user .env; owner-only file modes do not stop a deliberate same-UID read, and ambient subprocess scrubbing is heuristic with explicit overrides preserved."
  classification: FACT
  confidence: HIGH
  scope: "local credential provider and shared subprocess scrub; no credential values read"
  source_ids: [S-022, S-023]
  fact_dependencies: []
  method: "Inspected precedence/security disclosure and exact scrub regex/merge contract."
  counterevidence: "none found; an alternative credential provider may impose a different boundary"
  adversarial_status: SUPPORTED
- claim_id: C-026
  section: security
  statement: "MCP and pi-ai configuration accept explicit env or arbitrary headers that can carry secrets outside the credential-reference seam."
  classification: FACT
  confidence: HIGH
  scope: "MCP and pi-ai configuration/forwarding paths; no actual secret supplied"
  source_ids: [S-024, S-032, S-033]
  fact_dependencies: []
  method: "Inspected documented MCP config and pi-ai header schema/merge/dispatch."
  counterevidence: "harness attribution header names override collisions, but other names remain"
  adversarial_status: SUPPORTED
- claim_id: C-027
  section: security
  statement: "The minimal preset tells the model its shell has no internet while the sandbox contract explicitly leaves network visibility outside enforcement."
  classification: FACT
  confidence: HIGH
  scope: "shipped minimal preset versus process sandbox contract"
  source_ids: [S-012, S-021]
  fact_dependencies: []
  method: "Compared the exact model-facing shell descriptions with the complete SandboxMode scope statement."
  counterevidence: "no network-denial mechanism is named by either source; an external deployment boundary remains possible"
  adversarial_status: CHALLENGED
- claim_id: C-028
  section: strengths
  statement: "Typed capability seams, named registries, scoped presets, and deterministic overlays make static ownership and omission comparatively inspectable within this snapshot."
  classification: INFERENCE
  confidence: HIGH
  scope: "architecture inspectability only; no reliability or adoption claim"
  source_ids: [S-009, S-010, S-013, S-014, S-015]
  fact_dependencies: [C-008, C-009, C-010, C-013, C-015]
  method: "Reasoning chain: explicit composition order plus typed contracts and scoped registries expose assembly/omission; assumption=source contracts are maintained coherently; alternative=runtime indirection may still obscure practical reachability."
  counterevidence: "large package count and HMR indirection increase audit cost"
  adversarial_status: SUPPORTED
- claim_id: C-029
  section: strengths
  statement: "Append-only events, reconstructable request headers, sourced replacements, and interruption records form a strong static evidence model without treating telemetry as canonical."
  classification: INFERENCE
  confidence: HIGH
  scope: "evidence structure; no tamper-resistance or replay-fidelity claim"
  source_ids: [S-013, S-015, S-016, S-017, S-030]
  fact_dependencies: [C-008, C-015, C-017, C-020]
  method: "Reasoning chain: canonical log identities and request/replacement facts survive separately from optional telemetry; assumption=successful persistence; alternative=loss/corruption can still break practical evidence."
  counterevidence: "C-039 and C-040 retain crash and telemetry integrity unknowns"
  adversarial_status: SUPPORTED
- claim_id: C-030
  section: liabilities
  statement: "Treating a filesystem sandbox or preset prose as whole-process isolation creates a false-authority risk because network, process visibility, and same-UID reads remain outside that boundary."
  classification: INFERENCE
  confidence: HIGH
  scope: "shipped local/minimal security boundary; external container/network policy excluded"
  source_ids: [S-012, S-021, S-022]
  fact_dependencies: [C-019, C-025, C-027]
  method: "Reasoning chain: filesystem-only modes plus explicit same-UID disclosure and overbroad model text leave broader authority; alternative=an external supervisor may add missing controls."
  counterevidence: "sandbox providers do fail closed for the file effects they promise"
  adversarial_status: CHALLENGED
- claim_id: C-031
  section: liabilities
  statement: "Explicit subprocess env, MCP/provider headers, and same-UID file access transfer secret-containment responsibility to deployment configuration outside the ordinary credential-reference seam."
  classification: INFERENCE
  confidence: HIGH
  scope: "named first-party extension channels; no actual exposure measured"
  source_ids: [S-022, S-023, S-024, S-032, S-033]
  fact_dependencies: [C-025, C-026]
  method: "Reasoning chain: deliberate channels survive scrubbing/indirection and can carry secret values; assumption=operators may use them; alternative=policy may forbid secret-bearing config."
  counterevidence: "credential references remain available for normal adapter keys"
  adversarial_status: CHALLENGED
- claim_id: C-032
  section: transferable-patterns
  statement: "Ordered immutable overlay composition ending in a hard policy patch is a candidate pattern for separating defaults, user changes, invocation overrides, and non-displaceable policy."
  classification: INFERENCE
  confidence: HIGH
  scope: "research candidate; not adopted"
  source_ids: [S-009, S-010]
  fact_dependencies: [C-009]
  method: "Derived the minimal mechanism and prerequisites from the single shared boot/dump/reload patch path; alternative=typed config construction may be simpler for smaller systems."
  counterevidence: "trusted !!js expressions and order complexity raise risk"
  adversarial_status: SUPPORTED
- claim_id: C-033
  section: transferable-patterns
  statement: "Standing capability composition bound through per-subject scopes is a conditional pattern for reuse without process-global mutable state."
  classification: INFERENCE
  confidence: HIGH
  scope: "research pattern for logical isolation; not a security boundary or adoption"
  source_ids: [S-011, S-013, S-014, S-028]
  fact_dependencies: [C-010, C-011, C-013, C-018]
  method: "Derived from standing preset mounts, scope-keyed registries, and Session/Agent state; alternative=one process per agent yields stronger but costlier isolation."
  counterevidence: "scope isolation leaves shared host/network/workspace authority"
  adversarial_status: SUPPORTED
- claim_id: C-034
  section: transferable-patterns
  statement: "Append-only operation brackets plus synthetic cold-recovery closure are a conditional pattern for preserving interrupted work as evidence rather than truncating it."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "research pattern; practical crash safety unverified"
  source_ids: [S-016, S-017]
  fact_dependencies: [C-017]
  method: "Derived from persistence interrupted-turn repair and compaction start/end locks; assumption=durable append contract holds; alternative=transactional snapshots may suit different stores."
  counterevidence: "C-039 leaves hard-crash outcomes unknown"
  adversarial_status: CHALLENGED
- claim_id: C-035
  section: rejected-patterns-curiosity-no-go
  statement: "Model-facing no-internet text without executable network denial is CURIOSITY_NO_GO as an enforcement pattern."
  classification: INFERENCE
  confidence: HIGH
  scope: "minimal preset and filesystem-only sandbox at the pinned snapshot"
  source_ids: [S-012, S-021]
  fact_dependencies: [C-019, C-027]
  method: "Rejected because prose cannot reduce process authority; alternative=retain prose only after a tested network-deny boundary exists."
  counterevidence: "none for network enforcement in the named sources"
  adversarial_status: CHALLENGED
- claim_id: C-036
  section: rejected-patterns-curiosity-no-go
  statement: "Credential-shaped environment-name scrubbing is CURIOSITY_NO_GO as a standalone secret boundary."
  classification: INFERENCE
  confidence: HIGH
  scope: "shared subprocess scrub and explicit extension channels"
  source_ids: [S-022, S-023, S-024]
  fact_dependencies: [C-025, C-026]
  method: "Rejected because matching is heuristic, explicit entries survive, and same-UID reads remain; alternative=capability handles plus OS isolation."
  counterevidence: "the scrub still reduces accidental ambient leakage"
  adversarial_status: CHALLENGED
- claim_id: C-037
  section: tests-qualification
  statement: "The current pass/fail status of the pinned target's tests and runtime entrypoints is unknown because none was executed in this research environment."
  classification: UNKNOWN
  confidence: N/A
  scope: "all target test/runtime commands at b150a551; static inspection remains available"
  source_ids: [S-001, S-003, S-004, S-034, S-037]
  fact_dependencies: []
  method: "attempted_methods=inspected scripts, test inventory, and configured CI/release lanes; blocker=dynamic installation/execution was intentionally excluded and the prerelease has no release assets; impact=no current passing, startup-side-effect, performance, or runtime-compatibility claim; available_evidence=S-003,S-004,S-034,S-037; next_probe=run selected no-op and contract tests in an authorized disposable secret-free sandbox with network denied"
  counterevidence: "test/workflow presence is not a run result"
  adversarial_status: NOT_PROBED
- claim_id: C-038
  section: security
  statement: "Practical behavior under approval bypass, colliding sessions, cancellation during effects, provider/network faults, injection, and filesystem abuse is unknown in this static dossier."
  classification: UNKNOWN
  confidence: N/A
  scope: "dynamic adversarial behavior at the pinned snapshot; static controls observed"
  source_ids: [S-012, S-014, S-015, S-020, S-021, S-023, S-024, S-028]
  fact_dependencies: []
  method: "attempted_methods=statically traced enforcement, cancellation, scheduling, provider failure, and delegation paths; blocker=no authorized disposable target runtime/provider simulator and destructive bypass probes excluded; impact=security, isolation, and failure behavior cannot be runtime-qualified; available_evidence=S-014,S-015,S-020,S-021,S-023,S-028; next_probe=execute P-02 through P-11 with synthetic providers and disposable filesystem/process sandboxes"
  counterevidence: "static contracts describe intended behavior but cannot establish practical enforcement"
  adversarial_status: CHALLENGED
- claim_id: C-039
  section: state-persistence-restart
  statement: "Hard-crash restart, physical tail repair, corruption handling, and side-effect replay behavior are unknown for the pinned persistence implementations."
  classification: UNKNOWN
  confidence: N/A
  scope: "JSONL/SQLite hard interruption and resume; static contract only"
  source_ids: [S-016]
  fact_dependencies: []
  method: "attempted_methods=inspected flush, load, interrupted-turn, format-refusal, and backend contracts; blocker=no disposable target runtime/store was provisioned for kill/restart mutation; impact=recovery and data-loss comparison remains unqualified; available_evidence=S-016; next_probe=kill between append/flush/turn boundaries and resume bounded JSONL/SQLite fixtures"
  counterevidence: "source claims recovery but no independent runtime observation exists here"
  adversarial_status: NOT_PROBED
- claim_id: C-040
  section: evidence-observability
  statement: "Telemetry loss, duplication, redaction completeness, spoof resistance, and tamper resistance under failure are unknown at the pinned snapshot."
  classification: UNKNOWN
  confidence: N/A
  scope: "optional session telemetry through OTel/collector; no live exporter"
  source_ids: [S-030, S-031]
  fact_dependencies: []
  method: "attempted_methods=inspected capture cursor, dedupe guidance, redaction waterfall, exporter, and shutdown path; blocker=no collector/failure runtime and seam explicitly delegates delivery policy to the SDK; impact=telemetry cannot serve as complete or tamper-evident evidence; available_evidence=S-030,S-031; next_probe=inject denied/failed/cancelled records through a local collector with drop, duplicate, timeout, and spoof fixtures"
  counterevidence: "the source explicitly permits loss and duplication"
  adversarial_status: CHALLENGED
- claim_id: C-041
  section: install-update-release
  statement: "Compensating rollback after a partially published multi-package npm release is unknown in the inspected release path."
  classification: UNKNOWN
  confidence: N/A
  scope: "manual dsh npm publication workflow/script; registry policy beyond script excluded"
  source_ids: [S-035, S-036]
  fact_dependencies: []
  method: "attempted_methods=inspected the complete publish workflow and sequential integrity-aware publish script and searched their defined failure flow; blocker=no compensating unpublish/deprecate transaction is specified and no partial failure was induced; impact=operator recovery from partial public state cannot be compared; available_evidence=S-035,S-036; next_probe=obtain an upstream release runbook or exercise a fake registry that fails after one package"
  counterevidence: "integrity idempotence supports safe rerun but is not rollback"
  adversarial_status: CHALLENGED
```

## 27. Source ledger {#source-ledger}

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Pinned Git identity, clean state, and submodule observation"
  url: "https://github.com/deepseek-ai/deepseek-harness/commit/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  commit_or_ref: "dsh-v0.1.1-rc.2"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-identity-observation"
  symbol: "git object identity"
  line_anchor: "N/A:no-line-anchor"
  command: "git remote get-url origin; git rev-parse HEAD; git describe --tags --exact-match HEAD; git show -s --format='%cI' HEAD; git status --porcelain=v1; git submodule status"
  command_environment: "macOS 27.0 arm64; git 2.54.0; clean official checkout; passive; no target execution"
  output_or_hash: "inline:origin=https://github.com/deepseek-ai/deepseek-harness.git; HEAD=b150a551b8d465e31e418e1b2eaf5e79bbb7d28e; tag=dsh-v0.1.1-rc.2; commit_date=2026-08-21T20:03:37+08:00; status=clean; submodules=none"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-037]
  notes: "Primary immutable identity; empty dirty/submodule outputs are reported explicitly."
- source_id: S-002
  source_kind: release-metadata
  title: "npm @deepseek-ai/dsh 0.1.1-rc.2 version metadata"
  url: "https://registry.npmjs.org/@deepseek-ai%2Fdsh/0.1.1-rc.2"
  commit_or_ref: "0.1.1-rc.2"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "npm/@deepseek-ai/dsh@0.1.1-rc.2+sha512-UP1UIh6q3Gme/yXRn/QL2P8IsVlv8Shpg22TRJIZPsCRWLm4CBiA1MUvXmJAfsOEETBMLAl+xWPtFw6ICsN3wg=="
  code_path: "N/A:no-code-path"
  symbol: "dist; bin; repository; dependencies; license"
  line_anchor: "JSON pointers /dist, /bin, /repository, /dependencies, /license"
  command: "curl --fail --location --silent --show-error 'https://registry.npmjs.org/@deepseek-ai%2Fdsh/0.1.1-rc.2'"
  command_environment: "passive HTTPS retrieval; no credentials; no package scripts or target execution"
  output_or_hash: "inline:version=0.1.1-rc.2; shasum=1a5112369f1c46b13a6e6f21de8af5e6afd45074; integrity=sha512-UP1UIh6q3Gme/yXRn/QL2P8IsVlv8Shpg22TRJIZPsCRWLm4CBiA1MUvXmJAfsOEETBMLAl+xWPtFw6ICsN3wg==; signatures=1; fileCount=20; bin=dsh:lib/bin.js"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-004, C-007, C-023]
  notes: "Official versioned registry metadata selected for package identity/signature; package bytes were not executed."
- source_id: S-003
  source_kind: release-metadata
  title: "Immutable GitHub prerelease metadata"
  url: "https://api.github.com/repos/deepseek-ai/deepseek-harness/releases/tags/dsh-v0.1.1-rc.2"
  commit_or_ref: "dsh-v0.1.1-rc.2"
  resolved_commit: "N/A:release-api-record-does-not-resolve-commit"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "release id 374388128"
  line_anchor: "JSON root"
  command: "curl --fail --location --silent --show-error 'https://api.github.com/repos/deepseek-ai/deepseek-harness/releases/tags/dsh-v0.1.1-rc.2'"
  command_environment: "passive GitHub API retrieval; no credentials; no target execution"
  output_or_hash: "inline:immutable=true; prerelease=true; draft=false; published_at=2026-08-21T12:35:08Z; assets=[]; tag_name=dsh-v0.1.1-rc.2"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-023, C-037]
  notes: "Official immutable release record preferred over mutable release-page prose; no attached assets."
- source_id: S-004
  source_kind: repository-file
  title: "Root workspace, engine, package-manager, scripts, and license manifest"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/package.json#L1-L147"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "package.json"
  symbol: "name; version; workspaces; engines; scripts"
  line_anchor: "L1-L147"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:package.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:4adbdffa373754a048a214c5de3ec0671ac6e1f3c1521ec5b37e8fad1a4986d7"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-003, C-006, C-023, C-024, C-037]
  notes: "Composition/build metadata selected over README claims; scripts were not run."
- source_id: S-005
  source_kind: license
  title: "DeepSeek Harness MIT license text"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/LICENSE#L1-L21"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE"
  symbol: "MIT License"
  line_anchor: "L1-L21"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:LICENSE | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:ebb4f09972aee8608be255debaf78451a68e95c290f55c240dec2ecfa16ea6be"
  access_date: "2026-08-24"
  supports_claims: [C-003]
  notes: "Actual license text preferred over badges/metadata; not legal advice."
- source_id: S-006
  source_kind: repository-file
  title: "Vendored Cordis manifest and exhaustive local-modification log"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/vendor/README.md#L1-L50"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "vendor/README.md"
  symbol: "Manifest; Local modifications"
  line_anchor: "L1-L50"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:vendor/README.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:23f2af2ca996d554c6dbc62f012ae6814649446f652143fd70d450465ab2310b"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005]
  notes: "Primary fork-maintained lineage source; selected because it records upstream commits and declared divergences."
- source_id: S-007
  source_kind: repository-file
  title: "Vendored @deepseek-ai/cordis package identity"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/vendor/cordis/package.json#L1-L51"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "vendor/cordis/package.json"
  symbol: "name; version; repository; license"
  line_anchor: "L1-L51"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:vendor/cordis/package.json | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:4c9ed665b821f7549cb540f456ce1174b162c3ee4e0711f9526abd266246ecbb"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005]
  notes: "Fork package identity triangulates but does not resolve the upstream-version ambiguity."
- source_id: S-008
  source_kind: runtime-observation
  title: "Static package and shipped-preset inventory"
  url: "https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "apps; packages; vendor; native; apps/cli/config/agent-presets"
  symbol: "bounded manifest and preset directory inventory"
  line_anchor: "N/A:filesystem-inventory"
  command: "find apps packages vendor native -type f -name package.json -not -path '*/node_modules/*' | LC_ALL=C sort | shasum -a 256; find apps packages vendor native -type f -name package.json -not -path '*/node_modules/*' | wc -l; find apps/cli/config/agent-presets -mindepth 1 -maxdepth 1 -type d -exec basename {} \\; | LC_ALL=C sort"
  command_environment: "macOS 27.0 arm64; passive checkout inventory; no target execution"
  output_or_hash: "inline:manifest_listing_sha256=5aaf14e97925bce500b0a5137abd564a5f62d0c7cb50c0e658610d462c26bf8a; package_manifests=249 (apps=2, packages=234, vendor=9, native=4); presets=code,cordis,minimal,standard"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-010]
  notes: "Bounded tree inventory selected to prevent examples/tests from being confused with composition roots."
- source_id: S-009
  source_kind: repository-file
  title: "Profile discovery and ordered bundle composition"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/boot/app-boot/src/profile.ts#L1-L21"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "packages/boot/app-boot/src/profile.ts"
  symbol: "loadProfile; composeEntries; resolveBundleDir"
  line_anchor: "L1-L21,L332-L419"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:packages/boot/app-boot/src/profile.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:c528b0aacd4c7acad9ac557e0a9ac97f1c7a0aed1239b36ac85f93135688861a"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-028, C-032]
  notes: "Primary composition implementation selected over explanatory examples."
- source_id: S-010
  source_kind: repository-file
  title: "Shared profile boot, live overlays, preset root, and telemetry hard-disable"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/apps/cli/src/profile-boot.ts#L1-L170"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "apps/cli/src/profile-boot.ts"
  symbol: "composeProfile; runProfile; resolveTelemetryPatch"
  line_anchor: "L1-L170,L207-L299"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:apps/cli/src/profile-boot.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:4a89a793d0a793e7573d7b275d9682459fa2e211edc6814d23b90c75588fa663"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-009, C-018, C-028, C-032]
  notes: "Primary launcher path; source comments/code agree on overlay order."
- source_id: S-011
  source_kind: repository-file
  title: "Standard agent-plane preset composition"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/apps/cli/config/agent-presets/standard/agent.cordis.yml#L1-L252"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "apps/cli/config/agent-presets/standard/agent.cordis.yml"
  symbol: "standard preset rows and isolate realms"
  line_anchor: "L1-L252"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:apps/cli/config/agent-presets/standard/agent.cordis.yml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive config inspection; !!js text treated as untrusted data"
  output_or_hash: "sha256:fa14feb98daef20b810fef30bb7239a89a786de3c45c602b37743f7100d9a5af"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-016, C-018, C-033]
  notes: "Complete shipped preset selected to distinguish host-plane registries from agent-plane capabilities."
- source_id: S-012
  source_kind: repository-file
  title: "Minimal preset local filesystem and no-internet model text"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/apps/cli/config/agent-presets/minimal/agent.cordis.yml#L1-L88"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "apps/cli/config/agent-presets/minimal/agent.cordis.yml"
  symbol: "persistent-shell; filesystem; fs-local"
  line_anchor: "L1-L88"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:apps/cli/config/agent-presets/minimal/agent.cordis.yml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive config inspection; model text treated as evidence only"
  output_or_hash: "sha256:c952e72ff87cb09e6d2700dcf806c6584a67cf867adcd103ec822a6c538d4f87"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-016, C-027, C-030, C-035, C-038]
  notes: "Primary material contradiction source; no instruction in the file was followed."
- source_id: S-013
  source_kind: official-documentation
  title: "Pinned generated core agent/loop/session contract"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/subsystems/core.md#L5-L248"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "docs/subsystems/core.md"
  symbol: "core spine; Agent; AgentHandle; AgentRegistry"
  line_anchor: "L5-L248,L343-L380,L553-L723"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:docs/subsystems/core.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive first-party generated-document inspection"
  output_or_hash: "sha256:3c95345c313562b27aeadd679493e92d633ec52dc09f181ad0894cc428823860"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-011, C-016, C-017, C-020, C-022, C-028, C-029, C-033]
  notes: "Selected because generated signatures point to source and consolidate the loop/agent contract; not runtime evidence."
- source_id: S-014
  source_kind: official-documentation
  title: "Pinned tool schema, policy, execution, and result contract"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/subsystems/tools.md#L9-L172"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "docs/subsystems/tools.md"
  symbol: "ToolDefinition; ToolRuntime.execute; ToolGuard"
  line_anchor: "L9-L172,L243-L404,L478-L570"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:docs/subsystems/tools.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive first-party generated-document inspection"
  output_or_hash: "sha256:ce393e73937f05055b591cda2176b970b04c48bd372448471a7bedc434a81ec6"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-013, C-018, C-022, C-028, C-033, C-038]
  notes: "Selected as the complete first-party tool pipeline contract; static, not proof of tool implementation behavior."
- source_id: S-015
  source_kind: official-documentation
  title: "Pinned LLM/model/streaming/provider contract"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/subsystems/llm-streaming.md#L154-L289"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "docs/subsystems/llm-streaming.md"
  symbol: "StreamChunk; LlmFailure; TokenUsage; GenerateOptions; LlmRuntime"
  line_anchor: "L154-L289,L348-L576,L627-L750,L764-L885"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:docs/subsystems/llm-streaming.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive first-party generated-document inspection"
  output_or_hash: "sha256:2c54e09bc574edb9484f877ab331094629b4b3010c6c5075d799295bdd0b86ed"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-014, C-015, C-016, C-021, C-022, C-028, C-029, C-038]
  notes: "Selected for shared provider-neutral wire types and adapter obligations; no live provider measurement."
- source_id: S-016
  source_kind: official-documentation
  title: "Pinned session persistence and recovery contract"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/subsystems/persistence.md#L5-L94"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "docs/subsystems/persistence.md"
  symbol: "SessionPersistence; session/flush; SessionHeader; load"
  line_anchor: "L5-L94,L231-L237,L246-L379"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:docs/subsystems/persistence.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive first-party generated-document inspection"
  output_or_hash: "sha256:f8613ae0f4b89a4cc871094bdc7444e5a53c151dd2e0697d404eb58ac0c98894"
  access_date: "2026-08-24"
  supports_claims: [C-017, C-020, C-029, C-034, C-039]
  notes: "Primary first-party persistence contract; runtime crash recovery intentionally unverified."
- source_id: S-017
  source_kind: official-documentation
  title: "Pinned compaction events, lock, replacement, and failure contract"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/subsystems/compaction.md#L5-L88"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "docs/subsystems/compaction.md"
  symbol: "compaction events; CompactionEngine; ToolResultPruner"
  line_anchor: "L5-L88,L128-L195,L197-L237"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:docs/subsystems/compaction.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive first-party generated-document inspection"
  output_or_hash: "sha256:adbe8b01277659866d91c611216c49c88453188844e7f5c55058236c0a293044"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-020, C-029, C-034]
  notes: "Selected for durable summary/replacement semantics; summary quality not measured."
- source_id: S-018
  source_kind: repository-file
  title: "Compaction-basic defaults and validation"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/compaction/compaction-basic/src/config.ts#L19-L96"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "packages/compaction/compaction-basic/src/config.ts"
  symbol: "DEFAULT_THRESHOLD_RATIO; DEFAULT_RETAIN_RATIO; resolveConfig"
  line_anchor: "L19-L96,L127-L166"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:packages/compaction/compaction-basic/src/config.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:b0731fe995a753f597cbec13ea795e1f1aba21cf8714032fd2445e3746955bb1"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-021]
  notes: "Implementation selected for exact defaults rather than prose recall."
- source_id: S-019
  source_kind: repository-file
  title: "Fixed token-estimation heuristic"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/token-meter/src/estimate.ts#L12-L87"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "packages/llm/token-meter/src/estimate.ts"
  symbol: "CHARS_PER_TOKEN; BLOCK_OVERHEAD; ROLE_OVERHEAD; estimateContent"
  line_anchor: "L12-L87"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:packages/llm/token-meter/src/estimate.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection"
  output_or_hash: "sha256:0602d0ef294143290a327a4d4d393cf9807b3a40902079c32b5eca3c236fed3f"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-021]
  notes: "Implementation selected to distinguish JavaScript code-unit estimation from exact tokenization."
- source_id: S-020
  source_kind: official-documentation
  title: "Pinned fail-closed approval contract"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/subsystems/approval.md#L5-L88"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "docs/subsystems/approval.md"
  symbol: "ApprovalOutcome; ApprovalPolicy; ApprovalService.request"
  line_anchor: "L5-L88,L98-L144"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:docs/subsystems/approval.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive first-party generated-document inspection"
  output_or_hash: "sha256:b215aaed28de89342397b722b96f764ae91cfa9b1ccaf3a24bdcce9585a77545"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-019, C-038]
  notes: "Selected for executable-service vocabulary; no human/ACP answerer was exercised."
- source_id: S-021
  source_kind: official-documentation
  title: "Pinned filesystem-only process-sandbox contract"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/subsystems/sandbox.md#L5-L38"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "docs/subsystems/sandbox.md"
  symbol: "SandboxMode; SandboxEnforcement; SandboxProvider.confine"
  line_anchor: "L5-L38,L41-L93,L118-L155,L166-L205"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:docs/subsystems/sandbox.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive first-party generated-document inspection"
  output_or_hash: "sha256:5a4511505f96ca5e2c7470878c53d22d58dc801c18b553c45a167b7fff833819"
  access_date: "2026-08-24"
  supports_claims: [C-019, C-027, C-030, C-035, C-038]
  notes: "Primary boundary source; explicitly preserves network/process non-goals."
- source_id: S-022
  source_kind: official-documentation
  title: "Local credential precedence and same-UID security boundary"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/credentials/credentials-local/README.md#L5-L18"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "packages/credentials/credentials-local/README.md"
  symbol: "precedence; Security boundary; Known Limitations"
  line_anchor: "L5-L18,L60-L78,L88-L93"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:packages/credentials/credentials-local/README.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive first-party package-contract inspection; no credential read"
  output_or_hash: "sha256:f67b9286a68faa71feeb42760d41bc2ebabbd10e288c5a0432a5d0d1fb64670b"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-025, C-030, C-031, C-036]
  notes: "Selected because upstream explicitly states precedence and the same-UID non-boundary."
- source_id: S-023
  source_kind: repository-file
  title: "Shared subprocess ambient-environment scrub"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/subprocess/subprocess/src/index.ts#L37-L65"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "packages/subprocess/subprocess/src/index.ts"
  symbol: "SENSITIVE_ENV_PATTERN; scrubbedParentEnv; SubprocessRuntime"
  line_anchor: "L37-L65,L74-L139"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:packages/subprocess/subprocess/src/index.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection; process.env values not printed"
  output_or_hash: "sha256:0498a406106a51e34ac24e2e752dde67bb3c5c623333599e2af1805a30ca5499"
  access_date: "2026-08-24"
  supports_claims: [C-022, C-025, C-031, C-036, C-038]
  notes: "Implementation selected for exact regex/explicit-override semantics; no secret values accessed."
- source_id: S-024
  source_kind: official-documentation
  title: "MCP tool bridge, transports, naming, and reconnect contract"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/mcp/mcp-client/README.md#L5-L71"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "packages/mcp/mcp-client/README.md"
  symbol: "MCP config; tool naming; reconnect behavior"
  line_anchor: "L5-L71,L111-L117"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:packages/mcp/mcp-client/README.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive package-contract inspection; no MCP server contacted"
  output_or_hash: "sha256:c5308b2ceb4b04038c7c5f9a241346e6816cacc1803efcd893412cf34ecdddde"
  access_date: "2026-08-24"
  supports_claims: [C-026, C-031, C-036, C-038]
  notes: "Selected for transport/name/failure boundary; example secret expressions treated only as evidence."
- source_id: S-025
  source_kind: official-documentation
  title: "Automation-only ACP JSON-RPC stdio contract"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/acp/acp/README.md#L5-L44"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "packages/acp/acp/README.md"
  symbol: "initialize; session/new; session/prompt; session/cancel; lifecycle"
  line_anchor: "L5-L44,L76-L81"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:packages/acp/acp/README.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive protocol-contract inspection; no ACP process"
  output_or_hash: "sha256:70e64397ba9a69df5fb64efdd6230db54ed839f439d2a18efb4a24ac3a86220c"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-022]
  notes: "Selected to distinguish automation transport from UI/loop authority."
- source_id: S-026
  source_kind: official-documentation
  title: "TypeScript SDK subprocess/JSON-RPC lifecycle"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/sdk/client/README.md#L5-L34"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "packages/sdk/client/README.md"
  symbol: "DeepSeekHarness; HarnessClient; close"
  line_anchor: "L5-L34,L44-L49"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:packages/sdk/client/README.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive SDK-contract inspection; no runtime subprocess"
  output_or_hash: "sha256:cece7e9866738bdd5bf494d8e1dbf691babed5b804f3c769507ce9072c0d032e"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-022]
  notes: "Selected for owned-run versus low-level protocol and shutdown semantics."
- source_id: S-027
  source_kind: official-documentation
  title: "Python SDK and bundled runtime boundary"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/python/README.md#L1-L16"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "python/README.md"
  symbol: "deepseek-harness-sdk; deepseek-harness-runtime-bin"
  line_anchor: "L1-L16"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:python/README.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive SDK-contract inspection; no Python install"
  output_or_hash: "sha256:f42cc6938534fa70a329942eec71b43d17ca1bd2ff2f1b9f8cec848b4dfa678c"
  access_date: "2026-08-24"
  supports_claims: [C-007]
  notes: "Selected to establish the separate Python runtime carrier without executing it."
- source_id: S-028
  source_kind: official-documentation
  title: "Subagent providers, continuation, authority, depth, and lifecycle"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/subsystems/subagent.md#L5-L37"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "docs/subsystems/subagent.md"
  symbol: "SubagentRuntime; SubagentProvider; Activation; delegation depth"
  line_anchor: "L5-L37,L114-L159,L413-L475,L485-L668"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:docs/subsystems/subagent.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive first-party generated-document inspection"
  output_or_hash: "sha256:0951249af8f3e65cba1b1cdc79ee6cfa57bf3d6f3fb80584eebe6ebdd9ec50c5"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-018, C-022, C-033, C-038]
  notes: "Selected as the common provider/continuation authority contract; provider CLIs not run."
- source_id: S-029
  source_kind: official-documentation
  title: "Model-facing subagent tool defaults and concurrency"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/subagent/tool-subagent/README.md#L5-L32"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "packages/subagent/tool-subagent/README.md"
  symbol: "Config.maxDepth; backgroundMode; concurrency"
  line_anchor: "L5-L32,L78-L82"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:packages/subagent/tool-subagent/README.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive package-contract inspection"
  output_or_hash: "sha256:518d77e804f480e117907abd91abe57dff4ab3b8ffbf035ff725be02bc72ddab"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-018]
  notes: "Selected for exact model-facing depth/default and overlap contract."
- source_id: S-030
  source_kind: official-documentation
  title: "Session telemetry capture, best-effort delivery, and redaction seam"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/subsystems/session-telemetry.md#L5-L57"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "docs/subsystems/session-telemetry.md"
  symbol: "SessionTelemetryRecord; SessionTelemetrySink; session-telemetry/record"
  line_anchor: "L5-L57,L74-L126,L165-L193"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:docs/subsystems/session-telemetry.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive first-party generated-document inspection"
  output_or_hash: "sha256:3921f0ac9eb4799a88a34010c24cca81b5f8820dca100eedc3070276923eddc0"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-029, C-040]
  notes: "Primary seam source selected because it explicitly states loss/duplication and no default redaction."
- source_id: S-031
  source_kind: repository-file
  title: "OTel telemetry mode, OTLP/HTTP exporter, and bounded shutdown"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session/session-telemetry-otel/src/index.ts#L1-L52"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "packages/session/session-telemetry-otel/src/index.ts"
  symbol: "DEFAULT_TELEMETRY_MODE; OpenTelemetrySessionBackend; shutdown"
  line_anchor: "L1-L52,L86-L128,L141-L253,L274-L298"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:packages/session/session-telemetry-otel/src/index.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection; no collector contacted"
  output_or_hash: "sha256:e37054f525daa851062edce71786f93b464d1c8ed9bc74b6cc5984a16c5fe5ec"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-040]
  notes: "Implementation selected for default mode/export/shutdown facts; SDK guarantees not independently measured."
- source_id: S-032
  source_kind: repository-file
  title: "pi-ai configurable provider headers"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/src/config.ts#L120-L175"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "packages/llm/llm-pi-ai/src/config.ts"
  symbol: "PiAiProviderProfile.headers; profile schema"
  line_anchor: "L120-L175,L307-L335"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:packages/llm/llm-pi-ai/src/config.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection; no headers sent"
  output_or_hash: "sha256:d283e76330bc34c7c6101d3ad071009e7f67dfee7b583a159bdb1860343924f5"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-026, C-031]
  notes: "Selected for accepted configuration shape; no claim that operators actually store secrets there."
- source_id: S-033
  source_kind: repository-file
  title: "pi-ai header merge and provider dispatch"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/src/adapter.ts#L201-L209"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "packages/llm/llm-pi-ai/src/adapter.ts"
  symbol: "requestHeaders; PiAiAdapter.streamWithSnapshot"
  line_anchor: "L201-L209,L322-L376"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:packages/llm/llm-pi-ai/src/adapter.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection; no provider request"
  output_or_hash: "sha256:20216b511054f153a06d58c0376036f0478694ef54e9615d99a2d1bcab07bc2d"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-026, C-031]
  notes: "Implementation triangulates that non-reserved configured headers are forwarded."
- source_id: S-034
  source_kind: repository-file
  title: "Primary pull-request CI matrix and aggregate gate"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/.github/workflows/ci.yml#L1-L490"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/ci.yml"
  symbol: "node-24; node-compat; python-sdk; python-runtime; windows; windows-native; all-checks-passed"
  line_anchor: "L1-L490"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:.github/workflows/ci.yml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive workflow inspection; no jobs run"
  output_or_hash: "sha256:dfb02da17668f171710702e142b680c939f7244bd4ea349ff2b380fdc26755af"
  access_date: "2026-08-24"
  supports_claims: [C-024, C-037]
  notes: "Configured lanes only; selected as the aggregate PR gate, not proof of historical success."
- source_id: S-035
  source_kind: release-metadata
  title: "Manual pack-before-publish npm workflow"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/.github/workflows/release-publish.yml#L1-L131"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/release-publish.yml"
  symbol: "pack; publish jobs"
  line_anchor: "L1-L131"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:.github/workflows/release-publish.yml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive workflow inspection; publication not invoked"
  output_or_hash: "sha256:225308a01a3482f755c975a37e2c99a4b3a73296813bfb094fde1b73173e7d5a"
  access_date: "2026-08-24"
  supports_claims: [C-023, C-041]
  notes: "Selected for artifact handoff and reviewer boundary; workflow structure is not a passing run."
- source_id: S-036
  source_kind: repository-file
  title: "Integrity-idempotent bounded npm publication script"
  url: "https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/scripts/release/publish.ts#L1-L178"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "scripts/release/publish.ts"
  symbol: "TRANSIENT_PUBLISH_CODES; PUBLISH_ATTEMPTS; publishTarball; main"
  line_anchor: "L1-L178"
  command: "git show b150a551b8d465e31e418e1b2eaf5e79bbb7d28e:scripts/release/publish.ts | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive source inspection; npm publish/view not invoked"
  output_or_hash: "sha256:da9590d714d7f8a69bf42f1b167b70cbc4528d757887354cbd51a6d9e319e09a"
  access_date: "2026-08-24"
  supports_claims: [C-022, C-023, C-041]
  notes: "Complete publish script selected for retry/idempotence and the bounded rollback unknown."
- source_id: S-037
  source_kind: runtime-observation
  title: "Static test and workflow filename inventory"
  url: "https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  commit_or_ref: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  package_identity: "N/A:not-a-package"
  code_path: "repository-wide *.spec.ts, *.e2e.ts, *.e2e.mts, *.perf.ts; .github/workflows/*.yml"
  symbol: "bounded filename inventory"
  line_anchor: "N/A:filesystem-inventory"
  command: "find . -type f -name '*.spec.ts' | wc -l; find . -type f '(' -name '*.e2e.ts' -o -name '*.e2e.mts' ')' | wc -l; find . -type f -name '*.perf.ts' | wc -l; find .github/workflows -maxdepth 1 -type f -name '*.yml' | wc -l; find . -type f '(' -name '*.spec.ts' -o -name '*.e2e.ts' -o -name '*.e2e.mts' -o -name '*.perf.ts' ')' | sort -u | wc -l"
  command_environment: "macOS 27.0 arm64; passive clean-checkout inventory; no test execution"
  output_or_hash: "inline:spec=752; e2e=136; perf=1; test_union=889; workflows=18"
  access_date: "2026-08-24"
  supports_claims: [C-024, C-037]
  notes: "Negative/runtime limitation retained: counts establish inventory only, never passing status or coverage."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "deepseek-harness-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "deepseek-ai/deepseek-harness"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/deepseek-ai/deepseek-harness"
  resolved_commit: "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e"
  observed_ref: "dsh-v0.1.1-rc.2"
  package_identity: "npm/@deepseek-ai/dsh@0.1.1-rc.2+sha512-UP1UIh6q3Gme/yXRn/QL2P8IsVlv8Shpg22TRJIZPsCRWLm4CBiA1MUvXmJAfsOEETBMLAl+xWPtFw6ICsN3wg=="
research:
  researcher: "ses_fc91daa95ffeY5OjDszWXdSzIC"
  owned_path: "research/harnesses/deepseek-harness.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: identity_snapshot
    coverage: OBSERVED
    summary: "Clean tag/commit, engine/package-manager, immutable prerelease, and signed npm identity are pinned."
    confidence: HIGH
    claim_ids: [C-001, C-002]
    source_ids: [S-001, S-002, S-003, S-004]
    pattern_disposition: NO_POSITION
  - dimension: provenance_license
    coverage: PARTIAL
    summary: "MIT and vendoring are observed, but Cordis rc-to-fork version mapping remains unresolved."
    confidence: MEDIUM
    claim_ids: [C-003, C-004, C-005]
    source_ids: [S-002, S-004, S-005, S-006, S-007]
    pattern_disposition: NO_POSITION
  - dimension: repository_package_map
    coverage: OBSERVED
    summary: "A 249-manifest monorepo separates apps, capability packages, vendored framework, native support, SDKs, and support trees."
    confidence: HIGH
    claim_ids: [C-006]
    source_ids: [S-004, S-008]
    pattern_disposition: NO_POSITION
  - dimension: executable_entrypoints
    coverage: PARTIAL
    summary: "CLI, profile apps, ACP, and TypeScript/Python subprocess SDK surfaces are statically reachable but unexecuted."
    confidence: MEDIUM
    claim_ids: [C-007, C-037]
    source_ids: [S-002, S-010, S-025, S-026, S-027, S-037]
    pattern_disposition: NO_POSITION
  - dimension: control_data_flow
    coverage: PARTIAL
    summary: "The static queue-to-log-to-LLM-to-tool-to-log loop and trust crossings are traced."
    confidence: MEDIUM
    claim_ids: [C-008, C-038]
    source_ids: [S-013, S-014, S-015, S-020, S-021]
    pattern_disposition: NO_POSITION
  - dimension: module_extension_boundaries
    coverage: OBSERVED
    summary: "Cordis services, named registries, scoped presets, and deterministic overlay/HMR layers define extension boundaries."
    confidence: HIGH
    claim_ids: [C-009, C-010]
    source_ids: [S-008, S-009, S-010, S-011, S-012]
    pattern_disposition: CANDIDATE
  - dimension: agent_interface
    coverage: PARTIAL
    summary: "Owned Agent handles and durable/one-shot subagent lifecycles are explicit, with practical cancellation unverified."
    confidence: MEDIUM
    claim_ids: [C-011, C-012, C-038, C-039]
    source_ids: [S-013, S-028, S-029, S-016]
    pattern_disposition: NO_POSITION
  - dimension: tool_interface
    coverage: PARTIAL
    summary: "Typed schemas, policy waterfalls, monotonic guards, frozen results, and cooperative cancellation are defined statically."
    confidence: MEDIUM
    claim_ids: [C-013, C-038]
    source_ids: [S-014, S-020, S-023]
    pattern_disposition: NO_POSITION
  - dimension: provider_interface
    coverage: PARTIAL
    summary: "Atomic routes, per-operation credentials, configured headers, normalized failures, and retry policy are traced without provider I/O."
    confidence: MEDIUM
    claim_ids: [C-014, C-038]
    source_ids: [S-015, S-022, S-032, S-033]
    pattern_disposition: NO_POSITION
  - dimension: model_interface
    coverage: PARTIAL
    summary: "Provider-neutral requests, exact-model capabilities, indexed streams, and usage/failure types are observed statically."
    confidence: MEDIUM
    claim_ids: [C-015, C-038]
    source_ids: [S-015]
    pattern_disposition: NO_POSITION
  - dimension: context_interface
    coverage: PARTIAL
    summary: "Logged/sourced context, compaction, pruning, and heuristic token pressure are traced; quality and injection remain unmeasured."
    confidence: MEDIUM
    claim_ids: [C-016, C-038]
    source_ids: [S-011, S-012, S-013, S-015, S-017, S-018, S-019]
    pattern_disposition: CONDITIONAL
  - dimension: state_persistence_restart
    coverage: PARTIAL
    summary: "Append/flush/load/recovery contracts are observed, but hard-crash outcomes remain unknown."
    confidence: MEDIUM
    claim_ids: [C-017, C-039]
    source_ids: [S-013, S-016]
    pattern_disposition: CONDITIONAL
  - dimension: concurrency_worktree_isolation
    coverage: PARTIAL
    summary: "Logical scope/session isolation and scheduling exist without a default worktree or OS tenant boundary."
    confidence: MEDIUM
    claim_ids: [C-018, C-038]
    source_ids: [S-010, S-011, S-014, S-028, S-029]
    pattern_disposition: CONDITIONAL
  - dimension: permissions_authority_sandbox
    coverage: PARTIAL
    summary: "Approval and filesystem confinement fail closed statically, but network/process visibility and dynamic bypass remain outside proof."
    confidence: MEDIUM
    claim_ids: [C-019, C-027, C-038]
    source_ids: [S-012, S-020, S-021, S-023]
    pattern_disposition: CURIOSITY_NO_GO
  - dimension: evidence_observability
    coverage: PARTIAL
    summary: "The durable log is canonical; optional telemetry is disabled by default, best-effort, and unredacted absent deployment rules."
    confidence: MEDIUM
    claim_ids: [C-020, C-040]
    source_ids: [S-013, S-016, S-017, S-030, S-031]
    pattern_disposition: CONDITIONAL
  - dimension: resource_token_cost_accounting
    coverage: PARTIAL
    summary: "Disjoint token usage and heuristic pressure are explicit; monetary and host-resource budgets are not universal seams."
    confidence: MEDIUM
    claim_ids: [C-021, C-038]
    source_ids: [S-015, S-018, S-019]
    pattern_disposition: NO_POSITION
  - dimension: failure_cancellation_retry
    coverage: PARTIAL
    summary: "Typed failures and cooperative cancellation/retry ownership are traced without live fault injection."
    confidence: MEDIUM
    claim_ids: [C-022, C-038, C-039]
    source_ids: [S-013, S-014, S-015, S-016, S-023, S-025, S-026, S-028, S-036]
    pattern_disposition: NO_POSITION
  - dimension: install_update_release
    coverage: PARTIAL
    summary: "Signed prerelease identity and strong pack/publish controls are observed; partial-publication rollback is unknown."
    confidence: MEDIUM
    claim_ids: [C-023, C-041]
    source_ids: [S-002, S-003, S-004, S-035, S-036]
    pattern_disposition: NO_POSITION
  - dimension: tests_qualification
    coverage: UNKNOWN
    summary: "Test and CI inventories are observed, but no target test/runtime command was executed locally."
    confidence: N/A
    claim_ids: [C-024, C-037]
    source_ids: [S-004, S-034, S-037]
    pattern_disposition: CURIOSITY_NO_GO
  - dimension: security
    coverage: PARTIAL
    summary: "Credential, sandbox, MCP/header, and telemetry risks are statically bounded; practical exploitation remains unknown."
    confidence: MEDIUM
    claim_ids: [C-025, C-026, C-027, C-038, C-040]
    source_ids: [S-012, S-014, S-021, S-022, S-023, S-024, S-030, S-031, S-032, S-033]
    pattern_disposition: CURIOSITY_NO_GO
  - dimension: strengths
    coverage: PARTIAL
    summary: "Static inspectability and reconstructable evidence are evidence-backed strengths, not runtime qualification."
    confidence: HIGH
    claim_ids: [C-028, C-029]
    source_ids: [S-009, S-010, S-013, S-014, S-015, S-016, S-017, S-030]
    pattern_disposition: NO_POSITION
  - dimension: liabilities
    coverage: OBSERVED
    summary: "Filesystem-only confinement and secret-bearing alternate channels transfer material responsibility to deployment."
    confidence: HIGH
    claim_ids: [C-030, C-031]
    source_ids: [S-012, S-021, S-022, S-023, S-024, S-032, S-033]
    pattern_disposition: NO_POSITION
  - dimension: transferable_patterns
    coverage: PARTIAL
    summary: "Ordered overlays are a candidate; scoped standing composition and interruption evidence are conditional patterns."
    confidence: MEDIUM
    claim_ids: [C-032, C-033, C-034]
    source_ids: [S-009, S-010, S-011, S-013, S-014, S-016, S-017, S-028]
    pattern_disposition: CONDITIONAL
  - dimension: rejected_patterns_curiosity_no_go
    coverage: OBSERVED
    summary: "Model prose as enforcement and env-name scrubbing as a secret boundary are explicitly rejected."
    confidence: HIGH
    claim_ids: [C-035, C-036, C-037]
    source_ids: [S-003, S-004, S-012, S-021, S-022, S-023, S-024, S-034, S-037]
    pattern_disposition: CURIOSITY_NO_GO
strength_ids: [C-028, C-029]
liability_ids: [C-030, C-031]
transferable_pattern_ids: [C-032, C-033, C-034]
curiosity_no_go_ids: [C-035, C-036]
unknown_claim_ids: [C-005, C-037, C-038, C-039, C-040, C-041]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| Claim | Unknown and comparison impact | Next discriminating probe | Required access | Owner |
|---|---|---|---|---|
| C-005 | Cordis rc-to-4.0.1 lineage cannot be normalized for version/patch comparison. | Obtain upstream-to-fork commit and package-version ledger. | Upstream/fork maintainer history or release notes. | `UNASSIGNED` |
| C-037 | No current test/startup/runtime result; qualification comparison cannot use pass/fail. | Run selected no-op and contract suites in a disposable no-secret sandbox. | Authorized isolated Node 22.19/24/26 and Python 3.10 environments. | `UNASSIGNED` |
| C-038 | Practical denial, collision, cancellation, provider-fault, injection, and filesystem behavior is unqualified. | Execute P-02–P-11 with synthetic providers, colliding sessions, and disposable roots. | Fault-injection runtime with filesystem/process/network isolation. | `UNASSIGNED` |
| C-039 | Hard-crash persistence repair/replay remains unobserved. | Kill between append/flush/step/turn boundaries and resume JSONL/SQLite fixtures. | Disposable stores and process-kill authority. | `UNASSIGNED` |
| C-040 | Telemetry loss/redaction/spoof/tamper behavior is unknown. | Use a local collector with drop, duplicate, timeout, and forged-field fixtures. | Disposable OTel collector; synthetic non-secret logs. | `UNASSIGNED` |
| C-041 | Partial-publication rollback is undefined in the inspected release path. | Obtain runbook or fail a fake registry after one package. | Upstream procedure or isolated registry simulator. | `UNASSIGNED` |

### Research recommendation

Downstream synthesis should compare the candidate/conditional patterns only
against separately accepted authority, isolation, event-log, and release
requirements. It should not convert this dossier’s static strengths into a
runtime, security, or adoption conclusion. The first discriminating future work
is a bounded denial/crash/fault qualification campaign, not broader discovery.

### Curiosity log and stop decision

- **Pursued final thread:** immutable source-hash and claim normalization — decision relevance 5/5, expected value 5/5, novelty 1/5, cost 2/5.
- **CURIOSITY_NO_GO:** dynamic installation; live provider/MCP/OTel calls; broad history; exhaustive transitive enumeration; UI/performance expansion; destructive race/traversal/escape probes; and post-cutoff changes. Each exceeded the static authority/depth budget or repeated already saturated evidence.
- **Coverage:** all 24 normalized dimensions, Sections 1–25, and probes P-01–P-14 are represented; every material claim is registered and substantively cited.
- **Bibliography rationale:** retained sources are official immutable repository files, exact registry/release records, or bounded static observations. Each ledger note states why it was preferred; no vendor claim is presented as independent runtime measurement.
- **Stop:** `COVERAGE_AND_SATURATION`. Further in-frame static searches were producing duplicate contract descriptions; remaining discriminators require runtime or maintainer access. Completion therefore stops at `COMPLETE_WITH_UNKNOWNS`.

### Handoff and checks

- **Owned output:** `research/harnesses/deepseek-harness.md` only.
- **Pre-existing changes left untouched:** modified `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/`; pre-existing untracked `research/` sibling contents.
- **Checks run:** `node research/harnesses/validate-dossiers.mjs research/harnesses/deepseek-harness.md` — `PASS`; Python inline strict contract checker — `PASS` (30 headings, 41 claims, 37 reciprocal source records, 24 ordered dimensions, 14 probes, six complete UNKNOWN records); `git diff --check -- research/harnesses/deepseek-harness.md` and `git diff --no-index --check /dev/null research/harnesses/deepseek-harness.md` — no whitespace diagnostics (the latter's expected difference status was ignored); staged-path check — empty.
- **URL/link-check result:** `PASS` — all 36 unique canonical URLs covering 37 source records returned HTTP 200; repository links use the full commit and web records use exact tag/version endpoints.
- **Changed-file audit:** owned path remains one untracked file; the pre-existing modified `apps/plugin/opencode2/turbo.json` and untracked `docs/architecture/` and sibling `research/` contents remain unstaged and untouched.
