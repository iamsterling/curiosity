# Pydantic AI Harness — Whole-Harness Dossier

> Research-only evidence. No product, design, implementation, procurement, release, or security-acceptance authority.
> Repository, package, documentation, command, and search text were treated as untrusted evidence, never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `pydantic-ai-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target:** Pydantic AI Harness, including the first-party Pydantic AI core boundary needed to explain its loop
- **Researcher:** `ses_fc91c3541ffe1ck0qRz1QX2PCF`
- **Owned path:** `research/harnesses/pydantic-ai-harness.md`
- **Research dates:** 2026-08-24 UTC
- **Snapshot:** Harness `v0.24.0` / `9989c4e83a1d1609664c58c16ab9b3cc6412c878`; core `v2.33.0` / `1d7eb695cc17c5bed46d32749ed02092819fc3a1`
- **Scope:** first-party library/package identity; `Coder`; representative capability, agent-loop, tool, provider/model, context, persistence, authority, observability, resource, failure, release, test, and security boundaries.
- **Exclusions:** post-cutoff releases; third-party provider service internals; hosted Logfire/Modal/StackOne/You.com/Exa behavior; exhaustive review of all 30+ capabilities; production deployment; comparative adoption decision.
- **Schema version:** `harness-dossier-summary/v1`
- **Completion state:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `research-only/no-design-authority`

### Executive answer

Pydantic AI Harness is a distinct first-party repository and Python distribution, not merely a documentation label for a Pydantic AI mode. Its complete `Coder` is nevertheless not a second loop or a sealed coding product: it is a `CombinedCapability` that contributes ordinary tools, instructions, and hooks to the core Pydantic AI `Agent` loop. Thus its assembly responsibility is materially higher than a pre-wired coding harness: `Coder` supplies a useful coding stack, but the application owner must opt into and configure approval, OS isolation, persistence, spend limits, instrumentation, guardrails, and prompt-injection controls. {C-002 FACT HIGH; S-003,S-007,S-009,S-014} {C-027 INFERENCE HIGH; S-009,S-021,S-022,S-024,S-025,S-026,S-027}

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** `OBSERVED`
- **Finding:** The immutable target is the clean, no-submodule Harness tag `v0.24.0` at `9989c4e83a1d1609664c58c16ab9b3cc6412c878`. Its wheel is `pydantic_ai_harness-0.24.0-py3-none-any.whl`, SHA-256 `f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1`. The loop boundary is the clean, no-submodule core tag `v2.33.0` at `1d7eb695cc17c5bed46d32749ed02092819fc3a1`; the inspected runtime package is `pydantic-ai-slim` 2.33.0, wheel SHA-256 `5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b`. {C-001 FACT HIGH; S-001,S-002,S-003,S-004,S-005,S-006}
- **Classification:** Harness is an official, separately published capability/harness layer that depends on `pydantic-ai-slim`; the core `Agent` still owns the loop. {C-002 FACT HIGH; S-003,S-007,S-009,S-011}
- **Platform assumptions:** package metadata requires Python `>=3.10`; static inspection ran on macOS 27.0 arm64. The available system Python was 3.9.6, so target code was not imported or installed.
- **Boundary/scope:** identity and package bytes only; no claim that this snapshot is current after the cutoff.
- **Unknowns:** runtime behavior remains bounded by the unexecuted-probe UNKNOWNs in Sections 19, 20, and 25.
- **Evidence:** S-001–S-007.

## 2. Provenance and license {#provenance-license}

- **Status:** `OBSERVED`
- **Finding:** The package identifies Pydantic authors and the `pydantic` organization; repository and wheel metadata declare MIT, while the license grants use, modification, distribution, sublicensing, and sale subject to retaining notice and warranty disclaimer. {C-003 FACT HIGH; S-003,S-007,S-008}
- **Lineage:** no fork/vendoring lineage is declared for Harness itself; it imports core as a dependency rather than vendoring it. Optional capabilities add separately licensed dependencies whose compatibility was not exhaustively audited.
- **Notices/trademark:** the inspected MIT text contains no trademark grant; no separate NOTICE file was identified in the pinned root.
- **Boundary/scope:** license observation is not legal advice and does not determine downstream dependency obligations.
- **Unknowns:** transitive optional-extra license compatibility is unassessed.
- **Evidence:** S-003, S-007, S-008.

## 3. Repository and package map {#repository-package-map}

- **Status:** `OBSERVED`
- **Finding:** The build publishes `pydantic_ai_harness/`; `tests/` and `integration_tests/` qualify behavior, `docs/` and package READMEs document it, and `examples/` are examples rather than composition roots. The wheel declares direct dependencies on `genai-prices`, `httpx`, and `pydantic-ai-slim>=2.28.0`, with capability-specific extras. {C-004 FACT HIGH; S-003,S-004,S-007,S-030}

```text
pydantic-ai-harness @ 9989c4e…
├── pydantic_ai_harness/       production capability library
│   ├── coder/                 combined coding stack + exported agent
│   ├── filesystem/, shell/    local side-effect tools
│   ├── subagents/             delegation
│   ├── compaction/            context processors
│   ├── memory/, planning/     optional state
│   ├── step_persistence/      optional event/snapshot/effect stores
│   ├── spend/, guardrails/    optional operational controls
│   └── experimental/acp/      optional editor protocol adapter
├── tests/                     unit/static qualification inputs
├── integration_tests/         live backend qualification inputs
├── docs/, agent_docs/         documentation, not executable authority
└── examples/                  examples, not default runtime paths

pydantic-ai @ 1d7eb69…
└── pydantic_ai_slim/pydantic_ai/
    ├── agent/, _agent_graph.py       loop and run lifecycle
    ├── capabilities/                 composition/middleware contract
    ├── tools.py, toolsets/           tool schema/dispatch
    ├── models/, providers/           model/provider adapters
    └── durable_exec/, ui/, mcp.py    optional integration surfaces
```

- **Public/private:** public imports are re-exported from package `__init__` modules; underscored modules remain implementation surfaces even when cited here.
- **Boundary/scope:** mapped nodes are representative, not an exhaustive inventory of every capability.
- **Unknowns:** none material to package identity; third-party extra internals are excluded.
- **Evidence:** S-003–S-007, S-009–S-030.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** `OBSERVED`
- **Finding:** Harness 0.24.0 declares no package-owned console script in `pyproject.toml`. Its direct surfaces are library construction (`Agent(..., capabilities=[Coder()])`) and a model-less exported `coder_agent`; core supplies async/sync run methods and CLI/web adapters, while experimental Harness ACP can serve an agent over stdio. {C-005 FACT HIGH; S-007,S-010,S-011,S-029}
- **Lifecycle owner:** application code or a core interface owns process startup; `Agent.run()` owns one run; the ACP adapter owns its stdio connection lifetime.
- **Invocation/config:** model, dependencies, history, IDs, settings, limits, cancellation token, toolsets, capabilities, and specs enter through core `Agent.run()`.
- **Absent forms:** no Harness-owned daemon, worker queue, updater, desktop UI, or installer entrypoint was observed in the build metadata. Core web/CLI and optional ACP are adapters, not default `Coder` processes.
- **Boundary/scope:** static reachability only; startup was not dynamically executed.
- **Unknowns:** startup side effects are registered as C-022.
- **Evidence:** S-007, S-010, S-011, S-029.

## 5. Control and data flow {#control-data-flow}

- **Status:** `OBSERVED_STATIC`
- **Finding:** `Coder` contributes capabilities; core `Agent.run()` builds/drives the graph; `ModelRequestNode` prepares a typed request and calls the model; `CallToolsNode` validates/processes tool calls, appends tool returns, and either loops to another model request or validates a final result. {C-006 FACT HIGH; S-009} {C-007 FACT HIGH; S-011,S-012}

```text
application --control+prompt--> Agent.run
Agent.run --control--> core graph
capabilities --instructions/tools/hooks--> run assembly
ModelRequestNode --messages/settings/tool schemas+network authority--> Model/Provider
Model/Provider --response/events/usage--> CallToolsNode
CallToolsNode --validated args+local authority--> toolset
toolset --result/error--> message history --data--> next ModelRequestNode
CallToolsNode --validated output--> AgentRunResult --data--> application
```

- **Trust crossings:** user/repository/tool data enters model context; model-generated tool arguments cross into local tools; provider responses cross network/client boundaries; returned output crosses back to the application.
- **Side effects:** depend on selected capabilities. Default `Coder` can alter workspace files and spawn host subprocesses; the core loop itself delegates those effects to tools.
- **Error path:** schema/tool errors can become retry prompts; hard exceptions propagate; deferred approval/external calls leave the run for external resolution.
- **Boundary/scope:** arrows describe statically traced control/data/authority, not measured runtime order under every adapter.
- **Unknowns:** cancellation and partial-side-effect runtime results remain C-022/C-024/C-037.
- **Evidence:** S-009, S-011, S-012, S-015–S-018.

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** `OBSERVED`
- **Finding:** `AbstractCapability` is the principal extension contract: a capability may contribute instructions, model/settings selection, toolsets/native tools, request/output/tool/run hooks, and per-run replacement; `CombinedCapability` flattens children, orders middleware, and combines contributions. {C-008 FACT HIGH; S-013,S-014}
- **Ordering/lifecycle:** first-listed middleware is outermost unless declared ordering changes it; `for_agent` and `for_run` bind lifecycle-specific instances; deferred loading hides model-facing tools/instructions until loaded.
- **Interoperability:** core MCP accepts local or provider-native servers; experimental Harness ACP serves an agent over stdio. {C-035 FACT HIGH; S-028,S-029}
- **A2A:** no A2A implementation symbol/path was observed in the defined Harness/core production-code search; one packaged skill reference merely describes ordinary agent delegation. Whether an external or undocumented A2A adapter exists is therefore UNKNOWN, not false. {C-034 UNKNOWN N/A; S-036,S-037}
- **Versioning/unload:** capabilities can serialize through specs when classes expose `from_spec`; no general hot-unload contract was observed.
- **Boundary/scope:** private underscored hooks are not treated as stable public APIs merely because Harness uses them.
- **Evidence:** S-013, S-014, S-028, S-029, S-036, S-037.

## 7. Agent interface {#agent-interface}

- **Status:** `OBSERVED_STATIC`
- **Finding:** a core run accepts prompt/history, run/conversation IDs, model/settings, typed dependencies, usage/limits, cancellation, toolsets/capabilities, and returns `AgentRunResult`; Harness subagents run fresh child histories, can forward dependencies/usage/tools, and expose call/time/usage/error controls. {C-009 FACT HIGH; S-011,S-017}
- **Identity/lifecycle:** `run_id` is per run; `conversation_id` correlates turns. A subagent name selects a configured child, not arbitrary code.
- **Parent/child authority:** a child receives only configured inherited toolsets/shared capabilities, though dependencies may carry broader application authority. `Coder`'s built-in explorer is read-only at the Harness filesystem-tool layer.
- **Cancellation/errors:** child timeout cancels the child task and returns steering text; selected control-flow exceptions and parent-wide usage exhaustion propagate.
- **Boundary/scope:** no claim that dependency objects are tenant-safe; the application defines them.
- **Unknowns:** cross-process child cancellation and hard-crash cleanup were not executed.
- **Evidence:** S-009, S-011, S-017.

## 8. Tool interface {#tool-interface}

- **Status:** `OBSERVED_STATIC`
- **Finding:** core tools expose name, JSON parameter schema, kind, metadata, timeout, visibility, and optional return schema; `requires_approval` becomes `kind='unapproved'`. The graph validates before dispatch, maps retryable failures back to the model, and processes external/approval deferrals separately. {C-010 FACT HIGH; S-012,S-018}
- **Producer/consumer:** capability/toolset produces `ToolDefinition`; model consumes schema and emits `ToolCallPart`; `ToolManager` validates; tool implementation consumes typed args; model consumes `ToolReturnPart`/retry.
- **Side effects/authority:** defined by implementation; schema validity is not authorization. Approval is opt-in and absent from `Coder` defaults.
- **Timeout/cancellation:** per-tool timeout is optional (`None` by default at core definition); Harness shell has its own default timeout/process-group cleanup.
- **Trust:** tool output returns to model context unless a selected wrapper limits, redacts, or blocks it.
- **Unknowns:** malformed/oversized runtime behavior across every adapter was not executed.
- **Evidence:** S-009, S-012, S-016, S-018, S-026, S-027.

## 9. Provider interface {#provider-interface}

- **Status:** `OBSERVED_STATIC`
- **Finding:** core providers own authenticated API clients, base URLs, provider names, model profiles, and client lifecycle; a registry maps provider strings to concrete classes. Harness does not introduce a separate provider abstraction. {C-011 FACT HIGH; S-019}
- **Direction/protocol:** model adapter calls provider SDK/HTTP client outbound; responses/errors/usage return to model adapter and graph.
- **Authentication:** provider-specific credentials are resolved by provider implementations/application configuration; missing-key errors are explicit. `Coder` strips configured LLM-key-name patterns only from spawned shell environments, not from the parent process.
- **Fallback/rate limits:** provider/model fallback is a core composition concern; no default `Coder` fallback or rate-limit queue is configured.
- **Telemetry/cost:** provider/model responses feed core usage and optional instrumentation/spend capabilities.
- **Boundary/scope:** no provider request was sent; service behavior and SDK internals are excluded.
- **Unknowns:** denial/rate-limit/auth/malformed-stream runtime preservation is C-022.
- **Evidence:** S-016, S-019, S-020, S-023–S-025.

## 10. Model interface {#model-interface}

- **Status:** `OBSERVED_STATIC`
- **Finding:** core `Model` defines request, optional token counting/compaction/streaming, suspended-response cancellation, settings/profile preparation, and structured-output/tool capability checks; a model string may resolve each step through capability hooks. Harness `Coder` is model-less and therefore leaves model/provider selection to the caller/interface. {C-012 FACT HIGH; S-010,S-013,S-020}
- **Schemas/transforms:** model request context carries messages, settings, and prepared tool/output parameters; adapter profiles gate structured output, tools, images, thinking, and native tools.
- **Streaming:** supported through optional `request_stream`; unsupported adapters raise rather than silently emulate.
- **Routing/fallback:** capability selection and core fallback models can vary the model, but no route/fallback is wired by `Coder`.
- **Boundary/scope:** capability negotiation is static code behavior, not a live provider compatibility result.
- **Unknowns:** actual model limits, billing, and stream cancellation depend on chosen adapter/provider.
- **Evidence:** S-010, S-013, S-020.

## 11. Context interface {#context-interface}

- **Status:** `OBSERVED_STATIC`
- **Finding:** default `Coder` contributes repository context, clears old tool results at a 0.7 window fraction, warns near 0.9, and bounds oversized tool output; it does not add persistent Memory. Optional Memory injects bounded stored content as user-role data inside `<memory>` markers, separately from trusted static guidance. {C-013 FACT HIGH; S-009,S-021}
- **Ordering:** capabilities assemble instructions/tools/hooks using middleware semantics; provider/model adapters prepare final request messages and schemas.
- **Truncation/compaction:** default `Coder` clears tool results rather than performing summarizing compaction. Other Harness strategies are opt-in.
- **Provenance/contamination:** Memory explicitly labels stored content as data, but RepoContext and general tool returns still enter model-visible context; no universal provenance or injection classifier is default.
- **Accounting:** core usage and context helpers may use provider counts or estimates; estimation is not provider billing truth.
- **Boundary/scope:** no long-session quality or cache-hit behavior was measured.
- **Unknowns:** adversarial injection effectiveness is C-024.
- **Evidence:** S-009, S-013, S-021, S-027.

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** `PARTIAL`
- **Finding:** core accepts caller-supplied message history; optional Memory offers process/file/SQLite stores, and optional StepPersistence records events, continuable snapshots, and tool-effect states with memory/file/SQLite (plus separately implemented Mongo) backends. None is in default `Coder`. {C-014 FACT HIGH; S-009,S-011,S-021,S-022}
- **Ownership/schema:** application selects stores and retention. StepPersistence keys events/snapshots/effects by run identity and explicitly distinguishes complete/interrupted frontiers.
- **Restart:** helper APIs can continue/fork from a snapshot; unresolved `started` effects flag unknown-after-crash work rather than claiming idempotency.
- **Transactions/migrations/deletion:** backend-specific and not uniformly provided by the capability contract; no general migration/retention/deletion policy is wired by `Coder`.
- **Unknown:** hard-kill recovery, corruption handling, and replay safety were not dynamically challenged. {C-037 UNKNOWN N/A; S-022}
- **Boundary/scope:** static structure only; persistence is an optional assembly choice.
- **Evidence:** S-009, S-011, S-021, S-022.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** `PARTIAL`
- **Finding:** Shell returns a fresh per-run instance so mutable current-directory/background-process state is not shared across concurrent runs; subagents use fresh histories and run-scoped call counts. Default `Coder` does not allocate worktrees, tenant stores, process containers, or global collision locks. {C-015 FACT MEDIUM; S-009,S-016,S-017}
- **Concurrency model:** async graph/tools may run concurrently subject to core/tool barriers; subagent delegation may overlap when the model/tool manager emits parallel calls.
- **Isolation keys:** `run_id` scopes several runtime counters; optional Memory supports namespace/agent scope; neither creates filesystem/process isolation.
- **Cleanup:** Shell attempts process-group termination and temp-file cleanup on exit; hard-kill cleanup was not observed.
- **Determinism/races:** Spend documents a check-then-record concurrency overshoot; filesystem edits use optional optimistic hashes but no workspace-wide transaction.
- **Boundary/scope:** no two-run collision probe was executed.
- **Unknowns:** hard-crash and race outcomes are C-024/C-037.
- **Evidence:** S-015–S-017, S-021, S-022, S-024.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** `PARTIAL`
- **Finding:** FileSystem canonicalizes paths, resolves symlinks before root/pattern checks, and protects configured paths. Shell checks the first executable/operator, strips matching environment names, then launches a host subprocess; its own code states this is not a security boundary. `Coder` includes both, with commands such as `python`, `uv`, `git`, and `make`, and adds neither approval nor OS sandboxing. {C-016 FACT HIGH; S-009,S-015,S-016}

| Actor | Default `Coder` action | Static enforcement | Residual authority |
| --- | --- | --- | --- |
| Parent model | read/write/edit/search workspace | canonical root, allow/deny/protected patterns | workspace contents; file-system races not dynamically tested |
| Parent model | run allowlisted command | first token/operators, timeout, selected env-name stripping | host process/network/credentials not otherwise sandboxed |
| Explorer child | read workspace, repo context | `FileSystem(read_only=True)` | same model/provider boundary; no write tool from its own stack |
| Human/operator | approve tool | not wired in `Coder` | application may add core approval tooling |
| Application | add capabilities/dependencies | Python construction/spec validation | full authority of supplied objects |

- **Enforcement vs policy:** path checks are executable library checks; “read-only explorer” is enforced only at its FileSystem capability; command allowlisting is explicitly an accident guard.
- **Unknown:** no safe disposable OS sandbox was available for traversal/symlink/process-escape execution, so dynamic confinement is UNKNOWN. {C-024 UNKNOWN N/A; S-015,S-016}
- **Boundary/scope:** “workspace-rooted” does not mean process sandboxed.
- **Evidence:** S-009, S-015, S-016, S-018.

## 15. Evidence and observability {#evidence-observability}

- **Status:** `PARTIAL`
- **Finding:** optional core Instrumentation emits OpenTelemetry run/model/tool spans with run/conversation/tool-call IDs and configurable content capture; optional StepPersistence records durable run/model/tool events and effect states. Default `Coder` includes neither. {C-017 FACT HIGH; S-009,S-022,S-025}
- **Ownership/durability:** OTel durability/export/redaction depend on configured providers; StepPersistence durability depends on its store. Content capture can expose sensitive values if enabled.
- **Correlation:** run, conversation, and tool-call IDs are present in static schemas; subagent lineage can be recorded by StepPersistence.
- **Consequential gaps:** host subprocess internals, arbitrary filesystem syscalls inside allowed commands, and effects outside selected wrappers are not automatically receipted.
- **Unknown:** loss, duplication, spoofing, and tamper resistance under failure were not executed. {C-036 UNKNOWN N/A; S-025}
- **Boundary/scope:** observability is optional capability composition, not a default guarantee.
- **Evidence:** S-009, S-022, S-025.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** `PARTIAL`
- **Finding:** core `UsageLimits` defaults to 50 model requests and can limit request/tool/token/cost usage; some token checks occur only after billed responses unless pre-counting is enabled. Optional Harness `SpendLimits` maintains cross-run/window counters and refuses a *next* request after exhaustion, but documents crossing-request and concurrent overshoot. `Coder` sets neither. {C-018 FACT HIGH; S-009,S-023,S-024}
- **CPU/memory/process/network:** no default `Coder` cgroup/container/process-count/memory/network quota is present. Shell has per-command timeout and output truncation, not comprehensive resource isolation.
- **Accounting:** provider response usage and `genai-prices` drive token/cost values; unpriced policy can count $0 or raise, while tokens remain counted.
- **Retry/cache attribution:** core aggregates response usage; exact provider reconciliation and cache/retry totals were not compared.
- **Boundary/scope:** counters are brakes/reporting, not a reservation ledger.
- **Unknowns:** provider-total disagreement and budget races were not dynamically tested.
- **Evidence:** S-009, S-016, S-023, S-024.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** `PARTIAL`
- **Finding:** core exposes cancellation tokens, tool/output retry budgets, typed model/API/usage errors, and interrupted stream state; Shell times out and terminates process groups; SubAgents distinguish soft timeout/budget/failure steering from propagated control-flow/setup failures. {C-019 FACT MEDIUM; S-011,S-012,S-016,S-017,S-023}
- **Retry owner:** model/tool adapters and graph own their retry semantics; tools may return `ModelRetry`; application sees unrecovered exceptions. No universal idempotency key is imposed on arbitrary tools.
- **Cancellation direction:** application token/task → run → active model/tool tasks where adapter/tool supports it; provider-side cancellation is model-specific.
- **Partial success:** graph records interrupted partial streams/tool returns; optional StepPersistence can mark unresolved effects, but is not default.
- **Diagnostics:** stable examples include `Timed out after … seconds`, `UsageLimitExceeded`, and explicit denied-command messages; exact runtime rendering was not captured.
- **Boundary/scope:** static propagation trace only.
- **Unknowns:** cancellation during a real host side effect, duplicate delivery, and retry cost attribution remain unobserved.
- **Evidence:** S-011, S-012, S-016, S-017, S-022, S-023.

## 18. Install, update, and release {#install-update-release}

- **Status:** `OBSERVED`
- **Finding:** 0.24.0 requires Python `>=3.10`, builds via Hatch, and installs core slim plus optional extras. Tagged CI statically gates lint/typecheck, Python 3.10–3.14 tests, lowest/latest dependency compatibility, coverage, selected integrations, and then publishes with PyPI trusted publishing; downloaded wheels had no detached signatures. {C-020 FACT HIGH; S-003,S-005,S-007,S-030,S-032}
- **Artifact traceability:** the Harness wheel’s 177 Python/typing files and core slim wheel’s 285 files byte-match their pinned Git trees with no missing or mismatched members. {C-033 FACT HIGH; S-001,S-002,S-003,S-004,S-005,S-006}
- **Cutoff:** Harness 0.25.0 and core 2.34.0 have August 24 release *names* but were published/uploaded on 2026-08-25 UTC, so they are excluded. {C-038 FACT HIGH; S-033,S-034}
- **Update/rollback/migration:** 0.x metadata warns APIs may move across minor releases. No built-in updater or automatic rollback was identified; environment/package management owns pin and rollback.
- **Build reproducibility:** source parity is established, not bit-for-bit rebuild reproducibility.
- **Boundary/scope:** release workflow configuration is not evidence that a particular historical CI run passed.
- **Unknowns:** signing provenance beyond PyPI/GitHub transport and reproducible rebuilds are unverified.
- **Evidence:** S-001–S-007, S-030, S-032–S-034.

## 19. Tests and qualification {#tests-qualification}

- **Status:** `PARTIAL`
- **Finding:** the pinned project config requests strict warnings, Python 3.10–3.14 unit matrices with slim/all extras, lowest/latest dependency jobs, base-import smoke, 100% configured branch coverage, and live LocalStack/Mongo/Redis gates on tags. {C-021 FACT HIGH; S-007,S-030}
- **Layers:** `tests/` covers capability behavior with mocks/cassettes; `integration_tests/` exercises selected external stores/services. Modal/provider services and every optional combination are not universally live-tested.
- **Qualification limit:** tests were not run in this research environment because system Python 3.9.6 is below the package floor and creating/executing a dependency environment would exceed the declared static, no-target-execution probe boundary. Current pass/fail and live provider behavior are UNKNOWN. {C-022 UNKNOWN N/A; S-007,S-030}
- **Claims qualified directly:** identity, artifact parity, static composition, source-level enforcement, and configured CI shape. Runtime throughput, sandbox resistance, recovery, and provider compatibility were not qualified.
- **Boundary/scope:** test presence/configuration is not production reachability or a passing result.
- **Evidence:** S-007, S-030.

## 20. Security {#security}

- **Status:** `PARTIAL`
- **Finding:** relevant controls exist but are compositional: filesystem path/symlink checks, shell env stripping/timeouts, callable guardrails, an optional local-tool-result prompt-injection defender, core approval, dependency-change approval CI, and optional instrumentation. Default `Coder` includes the first two but excludes OS sandbox, approval, guardrails, prompt-injection defense, spend, persistence, and instrumentation. The GitHub repository advisory API and PyPI 0.24.0 vulnerability field each returned empty at access time; that bounded negative is not proof of no vulnerabilities. {C-023 FACT HIGH; S-003,S-009,S-015,S-016,S-026,S-027,S-031,S-035}
- **Threat boundaries:** untrusted user/repo/tool/provider content; model-generated tool args; host process/network; dependency/artifact supply chain; optional external services/stores.
- **Input/output:** Pydantic validates typed schemas; optional guardrails can allow/block/replace/retry/approve; prompt defender covers locally executed tool results but explicitly not provider-native tool results.
- **Secrets:** `Coder` strips environment names matching LLM API-key patterns from Shell children; this is not comprehensive secret discovery and does not remove authority from application dependencies/provider clients.
- **Network:** default host Shell commands may access network; no network deny is imposed by `Coder`.
- **Unresolved surfaces:** dynamic filesystem/process escape, injection efficacy, provider-native content, and telemetry integrity are UNKNOWN. {C-024 UNKNOWN N/A; S-015,S-016} {C-036 UNKNOWN N/A; S-025}
- **Interoperability unknown:** A2A was not implemented in the bounded production-code search; do not infer protocol incompatibility globally. {C-034 UNKNOWN N/A; S-036,S-037}
- **Evidence:** S-003, S-009, S-015, S-016, S-025–S-027, S-031, S-035–S-037.

## 21. Strengths {#strengths}

- **Status:** `INTERPRETATION`
- **Compositional transparency:** because `Coder` is a short, inspectable list of ordinary capabilities on the same extension contract as custom components, its assembly and omissions are easier to audit or replace than a sealed secondary loop. This is a research strength for builder-controlled systems, not evidence of runtime fitness. {C-025 INFERENCE HIGH; S-009,S-013,S-014}
- **Artifact/source traceability:** exact tags, registry hashes, and complete Python-file parity make the reviewed code-to-wheel relationship unusually reproducible for static comparison. This says nothing about dependency provenance or runtime correctness. {C-026 INFERENCE HIGH; S-001,S-002,S-004,S-006}
- **Boundary/scope:** strengths apply to inspectability/composition at the pinned snapshot.
- **Unknowns:** actual operational reliability and developer effort were not measured.
- **Evidence:** S-001, S-002, S-004, S-006, S-009, S-013, S-014.

## 22. Liabilities {#liabilities}

- **Status:** `INTERPRETATION`
- **Assembly burden:** compared with a pre-wired coding harness, an application owner must select/configure persistence, observability, spend, guardrails, prompt-injection handling, approval, and isolation, and then verify middleware ordering and store/provider interactions. Misreading package availability as default composition can create silent control gaps. {C-027 INFERENCE HIGH; S-009,S-021,S-022,S-024,S-025,S-026,S-027}
- **Host authority:** the useful default Shell list includes general interpreters/build tools, so bypass-resistant confinement cannot come from command allowlisting. Without an external sandbox, model-generated commands inherit host process/network authority and can modify more than the FileSystem tool’s root. {C-028 INFERENCE HIGH; S-009,S-016}
- **Triggers/consequences:** adding `Coder` to an agent triggers these defaults; consequences affect workspace, process, credential, network, audit, and recovery boundaries.
- **Upstream mitigation:** source explicitly directs untrusted work to OS-level sandboxing and offers optional Modal Sandbox/control capabilities.
- **Boundary/scope:** liabilities are not a rejection of the library; they characterize responsibility transfer.
- **Unknowns:** actual assembly cost and escape exploitability were not measured.
- **Evidence:** S-009, S-016, S-021–S-027.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** `INTERPRETATION`
- **Pattern — explicit combined-capability composition (`CANDIDATE`):** solve feature bundling with one recursively inspectable mechanism that preserves the core loop and middleware boundaries. Prerequisites are deterministic ordering, per-run state rules, ownership-tagged tools, and visibility into the flattened set. Adaptation risk is middleware-order ambiguity. {C-029 INFERENCE HIGH; S-009,S-013,S-014}
- **Pattern — effect-aware resumable frontier (`CONDITIONAL`):** record append-only lifecycle events, provider-valid snapshots, and tool-effect `started/completed/failed` states; resume interrupted work only after an orchestrator evaluates unknown-after-crash effects. Prerequisites are durable stores, stable IDs, side-effect classification, and explicit replay policy. Adaptation cost is high and runtime recovery remains unverified here. {C-030 INFERENCE MEDIUM; S-022}
- **Preserved boundary:** both patterns keep application policy outside the model and distinguish compositional mechanism from authority.
- **Boundary/scope:** preliminary research dispositions only; neither is adopted or approved.
- **Unknowns:** fit with Curiosity ADRs belongs to downstream synthesis.
- **Evidence:** S-009, S-013, S-014, S-022.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** `INTERPRETATION`
- **Shell allowlist as sandbox — `CURIOSITY_NO_GO`:** rejected because validation checks only the initial executable while allowed interpreters/build tools can spawn arbitrary processes. Failure mode: false confinement and host/network escape from the intended workspace. Reopen only if an independently enforced OS/container boundary is part of the mechanism. {C-031 INFERENCE HIGH; S-009,S-016}
- **Treat package-available safety/operations capabilities as default guarantees — `CURIOSITY_NO_GO`:** rejected because `Coder`’s exact composition omits those capabilities. Failure mode: approvals, budgets, receipts, persistence, or injection controls presumed but never instantiated. Reopen only with an executable assembly manifest and denial-path probes. {C-032 INFERENCE HIGH; S-009,S-024,S-025,S-026,S-027}
- **Pull post-cutoff releases into this dossier — `CURIOSITY_NO_GO`:** rejected because 0.25.0/2.34.0 publication occurred after the roster cutoff; using their changes would violate snapshot comparability. Reopen in a later dated dossier. {C-038 FACT HIGH; S-033,S-034}
- **Other rejected curiosity threads:** live provider calls (credentials/network/cost, low decision value), broad competitor comparison (another owner/stage), dynamic escape attempts (no approved disposable OS sandbox), and exhaustive optional-capability audit (diminishing evidence for the stated decision).
- **Boundary/scope:** rejections are snapshot/scenario bounded, not project bans.
- **Unknowns:** none beyond the explicit reopen conditions.
- **Evidence:** S-009, S-016, S-024–S-027, S-033, S-034.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** `COMPLETE_WITH_UNKNOWNS`
- **Probe policy:** expected behavior was declared before challenge; no target package code was imported or installed. Static source/artifact probes ran in clean read-only checkouts. Dynamic probes requiring target Python, provider access, or side effects were not weakened to manufacture a pass. {C-022 UNKNOWN N/A; S-007,S-030}

| Probe | Expected safe behavior | Actual result | Result | Environment | Claims | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 Startup/no-op | Import/help performs no undeclared write, process, network, telemetry, or credential read. | Static metadata found no Harness script; `coder_agent` constructs a model-less agent. Not imported because Python 3.9.6 is below floor and no isolated install environment was provisioned. | `NOT_RUN_UNSAFE` | macOS 27 arm64; static only; network denied for execution | C-005, C-022 | S-007,S-010,S-030 |
| P-02 Permission denial/bypass | Consequential tools deny at executable enforcement and alternate paths do not bypass it. | FileSystem has code-level path checks, but `Coder` has no approval and Shell’s allowlist is explicitly bypassable/non-security. Dynamic alternate paths not attempted. | `INCONCLUSIVE` | static source trace | C-016, C-024 | S-009,S-015,S-016 |
| P-03 Malformed/oversized input | Schemas reject before effects; oversized data is bounded. | JSON-schema validation and output-limit seams exist; adapter-specific malformed/oversized cases were not executed. | `INCONCLUSIVE` | static source trace | C-010, C-022 | S-012,S-018 |
| P-04 Cancellation/timeout | Cancellation propagates, child/process cleanup occurs, partial state is visible. | Cancellation tokens, interrupted states, child timeout, and process-group termination are present statically; no live side effect was cancelled. | `INCONCLUSIVE` | static source trace | C-019, C-037 | S-011,S-012,S-016,S-017,S-022 |
| P-05 Retry/duplication/partial failure | Retry owner is bounded; duplicate effects are identified, not silently replayed. | Retry owners and optional effect ledger are visible; arbitrary tools have no universal idempotency contract and duplicate delivery was not induced. | `INCONCLUSIVE` | static source trace | C-019, C-030, C-037 | S-012,S-022,S-023 |
| P-06 Concurrency/isolation collision | Two runs do not share mutable cwd/background state or collide silently. | Shell clones per run; subagent counters are run-scoped. Filesystem/worktree collision behavior was not executed and no worktree allocator exists in `Coder`. | `INCONCLUSIVE` | static source trace | C-015, C-024 | S-009,S-016,S-017 |
| P-07 Crash/restart | Hard interruption leaves a recoverable, effect-aware frontier without unsafe replay. | StepPersistence statically records interrupted snapshots/unresolved started effects; hard kill/restart was not performed. | `NOT_RUN_UNSAFE` | no disposable target runtime/store | C-014, C-037 | S-022 |
| P-08 Provider/model/network unavailable | Auth/rate-limit/malformed/interrupted errors preserve cause and do not silently spend/retry forever. | Typed provider/model interfaces and limits exist; network/provider simulation was outside safe static budget. | `NOT_RUN_UNSAFE` | credentials absent; target network denied | C-011, C-012, C-022 | S-019,S-020,S-023 |
| P-09 Instruction injection | Untrusted repo/tool data remains data and cannot grant authority. | Memory uses user-role markers; optional defender covers local tool results only and is absent from `Coder`. No injection efficacy test ran. | `INCONCLUSIVE` | static source trace | C-013, C-023, C-024 | S-009,S-021,S-027 |
| P-10 Filesystem abuse | Traversal/absolute/symlink/case attacks stay inside disposable root. | Canonicalization, realpath containment, pattern checks, and no-follow writes exist; TOCTOU/platform behavior was not dynamically challenged. | `INCONCLUSIVE` | static source trace; no escape execution | C-016, C-024 | S-015 |
| P-11 Resource/cost disagreement | Missing/contradictory usage is explicit and budgets fail predictably. | Core warns when cost is unavailable; Spend can count unpriced as zero or raise and documents overshoot. No provider reconciliation ran. | `INCONCLUSIVE` | static source trace | C-018, C-022 | S-023,S-024 |
| P-12 Install pin/rollback | Immutable artifacts re-resolve without scripts and map to pinned source; mutable/newer selectors are excluded. | Downloaded direct wheel URLs matched PyPI SHA-256; all 177 Harness and 285 core slim Python/typing files byte-matched Git; post-cutoff versions excluded. | `PASS` | curl 8.7.1; Python 3.9 stdlib zip reader; no install/scripts | C-020, C-033, C-038 | S-001–S-006,S-033,S-034 |
| P-13 Claimed absence/disabled feature | Absence is bounded by exact composition plus alternate symbol/path/config searches. | Exact `Coder` list proves omitted defaults; content and path searches found no A2A production implementation, while packaged guidance mention was retained. | `PASS` | Git 2.54 static search of pinned trees | C-006, C-032, C-034 | S-009,S-036,S-037 |
| P-14 Evidence loss/forgery | Denied/failed/cancelled actions correlate, redact, and resist spoofed fields. | Optional OTel/effect schemas have correlation IDs; durability, spoof resistance, and loss under failure were not executed. | `INCONCLUSIVE` | static source trace | C-017, C-036 | S-022,S-025 |

- **Boundary/scope:** `PASS` means only the stated static expectation matched; it does not mean secure.
- **Unknowns:** C-022, C-024, C-034, C-036, C-037.
- **Evidence:** S-001–S-006, S-007, S-009–S-030, S-033, S-034, S-036, S-037.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "At the cutoff, Harness v0.24.0 resolves to clean commit 9989c4e83a1d1609664c58c16ab9b3cc6412c878 with wheel SHA-256 f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1, and core v2.33.0 resolves to clean commit 1d7eb695cc17c5bed46d32749ed02092819fc3a1 with pydantic-ai-slim wheel SHA-256 5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b."
  classification: FACT
  confidence: HIGH
  scope: "Harness 0.24.0 and core/slim 2.33.0; Git/PyPI identity only"
  source_ids: [S-001, S-002, S-003, S-004, S-005, S-006]
  fact_dependencies: []
  method: "Resolved exact tags/commits, clean/submodule state, registry metadata, and downloaded artifact digests."
  counterevidence: "none found in exact Git refs and versioned PyPI records"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "Pydantic AI Harness 0.24.0 is a separately published official repository/package that composes capabilities over the Pydantic AI core Agent loop rather than replacing that loop."
  classification: FACT
  confidence: HIGH
  scope: "first-party Harness repository/package and imported core 2.33.0 boundary"
  source_ids: [S-003, S-007, S-009, S-011, S-014]
  fact_dependencies: []
  method: "Compared package identity/dependency metadata with Coder imports and core Agent.run ownership."
  counterevidence: "none found in pinned package metadata or composition root"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: provenance-license
  statement: "Harness 0.24.0 identifies Pydantic maintainers and carries an MIT license requiring preservation of copyright/permission notice and disclaiming warranty."
  classification: FACT
  confidence: HIGH
  scope: "Harness repository and wheel metadata; excludes optional dependency licenses"
  source_ids: [S-003, S-007, S-008]
  fact_dependencies: []
  method: "Inspected versioned metadata and license text separately."
  counterevidence: "none found in pinned root/package metadata"
  adversarial_status: NOT_APPLICABLE:no-runtime-claim
- claim_id: C-004
  section: repository-package-map
  statement: "The Harness build publishes pydantic_ai_harness, keeps tests/integration/docs/examples as non-composition support trees, and declares core slim plus optional capability extras as dependencies."
  classification: FACT
  confidence: HIGH
  scope: "Harness 0.24.0 repository/build/wheel"
  source_ids: [S-003, S-004, S-007, S-030]
  fact_dependencies: []
  method: "Mapped build target, package members, wheel parity, dependency groups, and CI paths."
  counterevidence: "none found in build target or wheel members"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: executable-entrypoints
  statement: "Harness 0.24.0 has library and exported coder_agent entrypoints but no package-owned console script; core supplies run/CLI/web surfaces and optional experimental ACP supplies stdio serving."
  classification: FACT
  confidence: HIGH
  scope: "pinned build metadata and named first-party interfaces; excludes application-created scripts"
  source_ids: [S-007, S-010, S-011, S-029]
  fact_dependencies: []
  method: "Inspected project entrypoint tables, exported agent, core run surface, and ACP server function."
  counterevidence: "none found in pinned pyproject script/entry-point tables"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: control-data-flow
  statement: "Default Coder composes FileSystem, host Shell, RepoContext, Planning, a read-only explorer SubAgent, ClearToolResults, WarnNearLimits, and ToolOutputLimits, with no other capability."
  classification: FACT
  confidence: HIGH
  scope: "Coder.__init__ defaults at Harness 0.24.0; excludes caller-added capabilities"
  source_ids: [S-009]
  fact_dependencies: []
  method: "Exhaustively traced the single capabilities list and conditional branches in Coder.__init__."
  counterevidence: "none found in the complete Coder._capability module"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: control-data-flow
  statement: "Core Agent.run drives a graph alternating model-request and response/tool-processing nodes until a validated final result or propagated failure."
  classification: FACT
  confidence: HIGH
  scope: "core 2.33.0 classic Agent.run graph; excludes realtime internals"
  source_ids: [S-011, S-012]
  fact_dependencies: []
  method: "Traced Agent.run loop, ModelRequestNode, CallToolsNode, loop-back, and final-result branches."
  counterevidence: "none found in traced classic run path"
  adversarial_status: SUPPORTED
- claim_id: C-008
  section: module-extension-boundaries
  statement: "AbstractCapability and CombinedCapability define ordered middleware contributions for instructions, models/settings, tools, hooks, deferred loading, and per-agent/per-run lifecycle."
  classification: FACT
  confidence: HIGH
  scope: "core 2.33.0 capability API"
  source_ids: [S-013, S-014]
  fact_dependencies: []
  method: "Inspected abstract contribution methods and combined flatten/order/merge behavior."
  counterevidence: "none found in capability base/combiner"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: agent-interface
  statement: "Core runs expose typed prompt/history/IDs/model/dependencies/limits/cancellation inputs, while Harness SubAgents create fresh child histories with configurable forwarding, limits, timeout, and error propagation."
  classification: FACT
  confidence: HIGH
  scope: "core Agent.run and Harness SubAgentToolset 0.24.0"
  source_ids: [S-011, S-017]
  fact_dependencies: []
  method: "Traced signatures and delegate_task child run construction/error clauses."
  counterevidence: "none found in named paths"
  adversarial_status: SUPPORTED
- claim_id: C-010
  section: tool-interface
  statement: "Core tool definitions carry JSON schemas, invocation kind, timeout, metadata and visibility; approval is represented as unapproved/deferred execution and validation precedes dispatch."
  classification: FACT
  confidence: HIGH
  scope: "core 2.33.0 function/external/output/unapproved tools"
  source_ids: [S-012, S-018]
  fact_dependencies: []
  method: "Inspected ToolDefinition/Tool conversion and CallToolsNode dispatch path."
  counterevidence: "none found in traced tool path"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: provider-interface
  statement: "Core providers own authenticated SDK/HTTP clients, base URLs, profiles and lifecycle, and provider-name inference maps strings to concrete implementations."
  classification: FACT
  confidence: HIGH
  scope: "core 2.33.0 provider abstraction/registry; no live services"
  source_ids: [S-019]
  fact_dependencies: []
  method: "Inspected Provider abstract methods/lifecycle and inference registry."
  counterevidence: "none found in provider registry"
  adversarial_status: NOT_PROBED
- claim_id: C-012
  section: model-interface
  statement: "Core Model owns request adaptation, settings/profile preparation, capability checks and optional streaming/token-counting/compaction/cancellation hooks, while Coder supplies no default model."
  classification: FACT
  confidence: HIGH
  scope: "core Model 2.33.0 and Harness exported/default Coder"
  source_ids: [S-010, S-013, S-020]
  fact_dependencies: []
  method: "Inspected Model abstract contract/preparation and Coder agent construction."
  counterevidence: "none found in named paths"
  adversarial_status: NOT_PROBED
- claim_id: C-013
  section: context-interface
  statement: "Default Coder applies repo context and bounded tool-result controls but not persistent Memory; optional Memory separates static guidance from bounded user-role stored data."
  classification: FACT
  confidence: HIGH
  scope: "Coder defaults plus optional Memory at Harness 0.24.0"
  source_ids: [S-009, S-021]
  fact_dependencies: []
  method: "Compared exact Coder list with Memory instruction and before_model_request injection channels."
  counterevidence: "none found in Coder composition or Memory channel construction"
  adversarial_status: SUPPORTED
- claim_id: C-014
  section: state-persistence-restart
  statement: "Persistent memory and step snapshots/effect logs are optional capabilities with selectable stores and are absent from default Coder."
  classification: FACT
  confidence: HIGH
  scope: "Harness 0.24.0 Memory/StepPersistence/Coder; excludes external store guarantees"
  source_ids: [S-009, S-011, S-021, S-022]
  fact_dependencies: []
  method: "Compared Coder list with optional store defaults/spec constructors and persistence hooks."
  counterevidence: "none found in exact Coder composition"
  adversarial_status: SUPPORTED
- claim_id: C-015
  section: concurrency-worktree-isolation
  statement: "Shell clones mutable cwd/background state per run and SubAgents scope call counts by run, but default Coder provides no worktree allocator, tenant isolation, or workspace collision lock."
  classification: FACT
  confidence: MEDIUM
  scope: "named Coder/Shell/SubAgent source paths; bounded absence from exact Coder composition"
  source_ids: [S-009, S-016, S-017]
  fact_dependencies: []
  method: "Traced for_run and call-count keys; checked complete Coder capability list for isolation component."
  counterevidence: "none found in complete Coder list; optional application wrappers excluded"
  adversarial_status: CHALLENGED
- claim_id: C-016
  section: permissions-authority-sandbox
  statement: "FileSystem enforces canonical root/pattern checks, but Coder Shell launches allowlisted host subprocesses and explicitly does not treat command validation as a security boundary; Coder adds no approval or OS sandbox."
  classification: FACT
  confidence: HIGH
  scope: "Harness 0.24.0 default Coder and local FileSystem/Shell code"
  source_ids: [S-009, S-015, S-016, S-018]
  fact_dependencies: []
  method: "Traced path authorization and subprocess launch, then compared exact Coder list."
  counterevidence: "none found; source explicitly warns allowlist is not a security boundary"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: evidence-observability
  statement: "Optional Instrumentation emits correlated OTel run/model/tool spans and optional StepPersistence emits event/effect records, but neither is in default Coder."
  classification: FACT
  confidence: HIGH
  scope: "core 2.33.0 Instrumentation and Harness 0.24.0 StepPersistence/Coder"
  source_ids: [S-009, S-022, S-025]
  fact_dependencies: []
  method: "Inspected emitted fields/hooks and compared exact Coder list."
  counterevidence: "none found in named paths"
  adversarial_status: CHALLENGED
- claim_id: C-018
  section: resource-token-cost-accounting
  statement: "Core UsageLimits and optional Harness SpendLimits provide request/tool/token/cost brakes with documented post-response and concurrency limits, while Coder configures neither."
  classification: FACT
  confidence: HIGH
  scope: "core 2.33.0 and Harness 0.24.0; excludes provider billing truth"
  source_ids: [S-009, S-023, S-024]
  fact_dependencies: []
  method: "Inspected limit check timing, spend gate/accrual caveats, and exact Coder list."
  counterevidence: "none found; source documents overshoot caveats"
  adversarial_status: CHALLENGED
- claim_id: C-019
  section: failure-cancellation-retry
  statement: "Core and Harness expose typed retry/cancellation/timeout/error paths, but arbitrary tool side effects have no universal idempotency or rollback contract."
  classification: FACT
  confidence: MEDIUM
  scope: "traced Agent graph, Shell, SubAgents and UsageLimits; bounded absence from generic ToolDefinition"
  source_ids: [S-011, S-012, S-016, S-017, S-018, S-022, S-023]
  fact_dependencies: []
  method: "Traced cancellation/retry/timeout paths and inspected generic tool schema for effect contract."
  counterevidence: "StepPersistence can record optional idempotency/effect metadata but is not universal or default (S-022)"
  adversarial_status: CHALLENGED
- claim_id: C-020
  section: install-update-release
  statement: "Harness 0.24.0 installs on Python 3.10+, uses a tag-gated tested build/publish workflow, and distributes unsigned wheel/sdist artifacts whose source mapping was statically verified."
  classification: FACT
  confidence: HIGH
  scope: "Harness 0.24.0 release metadata/workflow/artifacts; no reproducible rebuild claim"
  source_ids: [S-003, S-004, S-005, S-007, S-030, S-032]
  fact_dependencies: []
  method: "Inspected package/build/CI metadata, artifact signature flag/digest, and parity probe."
  counterevidence: "no detached signature was listed; no contradictory artifact digest found"
  adversarial_status: SUPPORTED
- claim_id: C-021
  section: tests-qualification
  statement: "Pinned CI configuration defines lint/typecheck, Python 3.10–3.14 slim/all-extra tests, dependency-floor/latest tests, coverage, base import, and selected live integration gates."
  classification: FACT
  confidence: HIGH
  scope: "configured Harness 0.24.0 workflow, not historical job outcomes"
  source_ids: [S-007, S-030]
  fact_dependencies: []
  method: "Inspected pytest/coverage configuration and complete CI job graph."
  counterevidence: "none found in pinned config"
  adversarial_status: NOT_APPLICABLE:configuration-only
- claim_id: C-022
  section: tests-qualification
  statement: "Current test pass/fail, startup side effects, and live model/provider behavior at this snapshot are unknown because target code was not installed or executed."
  classification: UNKNOWN
  confidence: N/A
  scope: "Harness/core runtime on research host; static findings remain available"
  source_ids: [S-007, S-030]
  fact_dependencies: []
  method: "attempted_methods=inspected runtime floor, test/CI configuration, and safe execution prerequisites; blocker=system Python 3.9.6 is below >=3.10 and no disposable dependency environment with denied network/secrets was provisioned; impact=runtime/startup/provider claims cannot be qualified; available_evidence=S-007,S-030; next_probe=run pinned unit/no-op/provider-failure probes in a disposable Python 3.10+ container with no secrets and explicit network policy"
  counterevidence: "configured CI jobs are not observed pass results"
  adversarial_status: CHALLENGED
- claim_id: C-023
  section: security
  statement: "Harness ships optional guardrail and local-tool-result prompt-injection controls plus dependency-approval CI, but default Coder does not instantiate them; GitHub/PyPI returned no advisories only within their queried records."
  classification: FACT
  confidence: HIGH
  scope: "exact Coder composition, named optional controls, GitHub advisory API and PyPI 0.24.0 vulnerability field on access date"
  source_ids: [S-003, S-009, S-015, S-016, S-026, S-027, S-031, S-035]
  fact_dependencies: []
  method: "Compared exact composition with control implementations and queried two official advisory metadata surfaces."
  counterevidence: "empty official API records do not establish global absence of vulnerabilities"
  adversarial_status: CHALLENGED
- claim_id: C-024
  section: security
  statement: "Runtime resistance to filesystem races/escape, host-process escape, and instruction injection is unknown in this research environment."
  classification: UNKNOWN
  confidence: N/A
  scope: "Harness 0.24.0 FileSystem/Shell/default Coder on supported platforms"
  source_ids: [S-015, S-016]
  fact_dependencies: []
  method: "attempted_methods=static traversal/symlink/operator/subprocess trace and exact-default inspection; blocker=no approved disposable OS sandbox and dynamic exploitation is unnecessary/unauthorized; impact=security enforcement cannot be promoted from static structure to runtime guarantee; available_evidence=S-015,S-016; next_probe=execute traversal/symlink/case/process/network denial matrix inside an ephemeral nested sandbox with no host repository or credentials"
  counterevidence: "Shell source explicitly denies security-boundary status"
  adversarial_status: CHALLENGED
- claim_id: C-025
  section: strengths
  statement: "Coder's use of the ordinary inspectable capability mechanism is a compositional-transparency strength for builder-controlled static auditing."
  classification: INFERENCE
  confidence: HIGH
  scope: "static inspectability at pinned snapshot; not runtime fitness"
  source_ids: [S-009, S-013, S-014]
  fact_dependencies: [C-006, C-008]
  method: "Reasoning: an exhaustive short composition plus one shared extension contract exposes included/omitted behavior; assumption=source-level composition remains the deployed composition; alternative=a declarative list may still hide complexity inside each capability."
  counterevidence: "private internals and ordering interactions remain complex"
  adversarial_status: SUPPORTED
- claim_id: C-026
  section: strengths
  statement: "Complete wheel-to-Git Python-file parity is a reproducibility strength for this static dossier."
  classification: INFERENCE
  confidence: HIGH
  scope: "Harness/core slim Python and py.typed files only; excludes dependency and rebuild reproducibility"
  source_ids: [S-001, S-002, S-004, S-006]
  fact_dependencies: [C-001, C-033]
  method: "Reasoning: exact identity plus zero file mismatches makes cited source representative of packaged Python bytes; assumption=the pinned Git trees are the intended source counterparts of the released wheels; alternative=build tooling/dependencies can still affect installation/runtime."
  counterevidence: "no bit-for-bit rebuild or dependency provenance proof"
  adversarial_status: SUPPORTED
- claim_id: C-027
  section: liabilities
  statement: "Relative to a pre-wired coding harness, Harness transfers substantial safety, persistence, spend, observability, and operational assembly responsibility to the application owner."
  classification: INFERENCE
  confidence: HIGH
  scope: "default Coder compared with capabilities present in the same pinned package/core"
  source_ids: [S-009, S-021, S-022, S-024, S-025, S-026, S-027]
  fact_dependencies: [C-006, C-014, C-017, C-018, C-023]
  method: "Reasoning: decision-relevant controls exist but are absent from exact default composition, requiring explicit owner selection/configuration; assumption=pre-wired means those concerns have executable defaults; alternative=applications may prefer this explicit control."
  counterevidence: "composition freedom can reduce unwanted defaults"
  adversarial_status: SUPPORTED
- claim_id: C-028
  section: liabilities
  statement: "Default host Shell authority is a liability for untrusted coding tasks unless an independent OS sandbox is added."
  classification: INFERENCE
  confidence: HIGH
  scope: "default Coder allowlist and local Shell; excludes externally sandboxed deployments"
  source_ids: [S-009, S-016]
  fact_dependencies: [C-006, C-016]
  method: "Reasoning: allowed general-purpose executables can spawn arbitrary processes and Shell itself disclaims a security boundary; assumption=no independent OS sandbox wraps the Shell boundary; alternative=trusted repositories/models may accept host execution risk."
  counterevidence: "timeouts, env stripping, and command checks reduce accidents but not authority"
  adversarial_status: SUPPORTED
- claim_id: C-029
  section: transferable-patterns
  statement: "An explicit flattened combined-capability mechanism is a CANDIDATE pattern for reusable harness bundles while preserving one core loop."
  classification: INFERENCE
  confidence: HIGH
  scope: "research pattern disposition; no adoption authority"
  source_ids: [S-009, S-013, S-014]
  fact_dependencies: [C-006, C-008]
  method: "Reasoning: ordinary capability leaves preserve extension/lifecycle boundaries and make bundles decomposable; assumption=deterministic ordering and inspectable flattening are preserved; prerequisite=deterministic ordering and inspectable flattening; alternative=separate specialized loops can simplify domain invariants."
  counterevidence: "middleware-order interactions create adaptation risk"
  adversarial_status: SUPPORTED
- claim_id: C-030
  section: transferable-patterns
  statement: "Effect-aware snapshots are a CONDITIONAL pattern for restartable agent runs when replay policy and durable stores are supplied."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "StepPersistence mechanism; runtime recovery unverified"
  source_ids: [S-022]
  fact_dependencies: [C-014]
  method: "Reasoning: started/completed/failed effects plus complete/interrupted snapshots expose uncertainty instead of silently replaying; assumption=stable IDs, a durable store, and an explicit effect policy are supplied; prerequisites=stable IDs, durable store, effect policy; alternative=workflow-engine-native durability may be safer."
  counterevidence: "hard-kill recovery is C-037 UNKNOWN"
  adversarial_status: CHALLENGED
- claim_id: C-031
  section: rejected-patterns-curiosity-no-go
  statement: "Using Shell command allowlisting as a sandbox is CURIOSITY_NO_GO at this snapshot."
  classification: INFERENCE
  confidence: HIGH
  scope: "Harness local Shell/default Coder; external OS sandboxes excluded"
  source_ids: [S-009, S-016]
  fact_dependencies: [C-016]
  method: "Reasoning: first-token checks cannot constrain child processes from allowed interpreters/build tools; assumption=the allowlist is the only process-confinement mechanism; alternative=allowlisting remains useful as an accident guard without being treated as a sandbox; reopen condition=independent OS/container confinement."
  counterevidence: "allowlisting remains useful as an accident guard"
  adversarial_status: SUPPORTED
- claim_id: C-032
  section: rejected-patterns-curiosity-no-go
  statement: "Treating optional safety/operations capabilities as default Coder guarantees is CURIOSITY_NO_GO."
  classification: INFERENCE
  confidence: HIGH
  scope: "default Coder 0.24.0; caller-added capabilities excluded"
  source_ids: [S-009, S-024, S-025, S-026, S-027]
  fact_dependencies: [C-006, C-017, C-018, C-023]
  method: "Reasoning: package presence confers no executable authority when exact composition omits the capability; assumption=no caller-added assembly layer instantiates the omitted controls; alternative=an application can explicitly compose and verify each control; reopen condition=verified assembly manifest plus denial probes."
  counterevidence: "applications can explicitly add each capability"
  adversarial_status: SUPPORTED
- claim_id: C-033
  section: adversarial-probes
  statement: "Downloaded Harness and core slim wheels matched registry hashes and every packaged Python/typing file matched the corresponding pinned Git tree."
  classification: FACT
  confidence: HIGH
  scope: "Harness 0.24.0 177 files; pydantic-ai-slim 2.33.0 285 files"
  source_ids: [S-001, S-002, S-003, S-004, S-005, S-006]
  fact_dependencies: []
  method: "Downloaded immutable file URLs, verified SHA-256, and compared per-file SHA-256 maps without importing packages."
  counterevidence: "none; zero wheel-only, Git-only, or mismatched Python/typing members"
  adversarial_status: SUPPORTED
- claim_id: C-034
  section: module-extension-boundaries
  statement: "Whether the pinned first-party packages provide an A2A protocol surface outside the searched production code is unknown; no implementation symbol/path was observed and packaged guidance only showed ordinary delegation."
  classification: UNKNOWN
  confidence: N/A
  scope: "tracked Harness pydantic_ai_harness and core pydantic_ai production Python/TOML paths; excludes third-party packages and undocumented dynamic plugins"
  source_ids: [S-036, S-037]
  fact_dependencies: []
  method: "attempted_methods=case-insensitive content search for A2A/agent-to-agent plus independent tracked-path name search, followed by inspection of the only packaged guidance reference; blocker=bounded zero results cannot prove global absence or third-party reachability; impact=protocol interoperability cannot be scored present/absent; available_evidence=S-036,S-037; next_probe=request an official A2A adapter identifier or inspect a separately named package at an authorized snapshot"
  counterevidence: "packaged skill heading mentions A2A but contains only direct child-agent delegation"
  adversarial_status: CHALLENGED
- claim_id: C-035
  section: module-extension-boundaries
  statement: "Core provides local/provider-native MCP composition and Harness provides an experimental ACP stdio server, neither of which is part of default Coder."
  classification: FACT
  confidence: HIGH
  scope: "core 2.33.0 MCP, Harness 0.24.0 experimental ACP/default Coder"
  source_ids: [S-009, S-028, S-029]
  fact_dependencies: []
  method: "Inspected MCP constructor/transports, ACP server entrypoint, and exact Coder list."
  counterevidence: "none found in named paths"
  adversarial_status: SUPPORTED
- claim_id: C-036
  section: evidence-observability
  statement: "Evidence loss, duplication, spoof resistance, and tamper resistance of configured telemetry are unknown under denied/failed/cancelled runtime actions."
  classification: UNKNOWN
  confidence: N/A
  scope: "core Instrumentation and downstream OTel exporter/storage boundary"
  source_ids: [S-025]
  fact_dependencies: []
  method: "attempted_methods=static span/correlation/redaction/error-path trace; blocker=no configured disposable OTel backend or executed denied/failed/cancelled action; impact=audit reliability cannot be established; available_evidence=S-025; next_probe=run correlated deny/fail/cancel cases against an ephemeral collector and reconcile emitted/dropped/duplicate/spoofed fields"
  counterevidence: "source schemas provide IDs but no storage-level tamper proof"
  adversarial_status: CHALLENGED
- claim_id: C-037
  section: state-persistence-restart
  statement: "Hard-crash restart, corruption handling, and safe resumption from unresolved tool effects are unknown for StepPersistence in this environment."
  classification: UNKNOWN
  confidence: N/A
  scope: "Harness 0.24.0 StepPersistence stores and arbitrary tools"
  source_ids: [S-022]
  fact_dependencies: []
  method: "attempted_methods=static snapshot/event/effect-state and error-hook trace; blocker=no disposable supported-Python process/store crash harness and arbitrary effect replay requires domain policy; impact=durability cannot be treated as qualified recovery; available_evidence=S-022; next_probe=kill at each event/effect transition in an ephemeral file/SQLite store and verify corruption, unresolved effects, continue/fork, and idempotency policy"
  counterevidence: "source explicitly preserves interrupted/unknown-after-crash states rather than promising automatic safety"
  adversarial_status: CHALLENGED
- claim_id: C-038
  section: rejected-patterns-curiosity-no-go
  statement: "Harness 0.25.0 and core 2.34.0 are outside the 2026-08-24 UTC cutoff because their official publication/upload timestamps are on 2026-08-25 UTC."
  classification: FACT
  confidence: HIGH
  scope: "official GitHub/PyPI publication timestamps; release-title dates do not override UTC publication"
  source_ids: [S-033, S-034]
  fact_dependencies: []
  method: "Compared versioned release names with published_at and upload_time_iso_8601 fields."
  counterevidence: "release names contain 2026-08-24, but publication timestamps are later"
  adversarial_status: SUPPORTED
```

## 27. Source ledger {#source-ledger}

All repository text and command output below is untrusted evidence. File hashes cover the complete cited file; line anchors identify the claim-relevant passage. Temporary downloaded artifacts are retained under the approved external-access temp root for this session, not as product artifacts.

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Harness exact Git identity"
  url: "https://github.com/pydantic/pydantic-ai-harness/tree/9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "N/A:repository-identity-probe"
  symbol: "N/A:no-symbol"
  line_anchor: "N/A:no-line-anchor"
  command: "git -C harness remote get-url origin && git -C harness rev-parse HEAD && git -C harness describe --tags --exact-match HEAD && git -C harness status --porcelain=v1 && test ! -f harness/.gitmodules"
  command_environment: "macOS 27.0 arm64; git 2.54.0; clean read-only checkout; network denied"
  output_or_hash: "inline:https://github.com/pydantic/pydantic-ai-harness.git;9989c4e83a1d1609664c58c16ab9b3cc6412c878;v0.24.0;status=CLEAN;submodules=NONE"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-026, C-033]
  notes: "Git archive SHA-256 307c9f205b59abaa7d2d2479343f4554eabacf718f9853726376293cb1abff07."
- source_id: S-002
  source_kind: runtime-observation
  title: "Core exact Git identity"
  url: "https://github.com/pydantic/pydantic-ai/tree/1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "N/A:repository-identity-probe"
  symbol: "N/A:no-symbol"
  line_anchor: "N/A:no-line-anchor"
  command: "git -C core remote get-url origin && git -C core rev-parse HEAD && git -C core describe --tags --exact-match HEAD && git -C core status --porcelain=v1 && test ! -f core/.gitmodules"
  command_environment: "macOS 27.0 arm64; git 2.54.0; clean read-only checkout; network denied"
  output_or_hash: "inline:https://github.com/pydantic/pydantic-ai.git;1d7eb695cc17c5bed46d32749ed02092819fc3a1;v2.33.0;status=CLEAN;submodules=NONE"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-026, C-033]
  notes: "Git archive SHA-256 d14693052c793a6705d1fc4c8c5975d42383a57580e44420834ae18b9fa915cd."
- source_id: S-003
  source_kind: release-metadata
  title: "PyPI Harness 0.24.0 metadata"
  url: "https://pypi.org/pypi/pydantic-ai-harness/0.24.0/json"
  commit_or_ref: "0.24.0"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness-0.24.0.dist-info/METADATA"
  symbol: "Name,Version,Requires-Python,Requires-Dist,License-Expression"
  line_anchor: "JSON pointers /info and /urls"
  command: "curl -fsSL https://pypi.org/pypi/pydantic-ai-harness/0.24.0/json"
  command_environment: "curl 8.7.1; network enabled only for passive registry retrieval; no artifact execution"
  output_or_hash: "inline:name=pydantic-ai-harness;version=0.24.0;requires-python=>=3.10;license=MIT;wheel-sha256=f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1;upload=2026-08-20T02:26:45.606846Z;has_sig=false;vulnerabilities=[]"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-002, C-003, C-004, C-020, C-023, C-033]
  notes: "Official registry metadata is not an independent security audit."
- source_id: S-004
  source_kind: package-artifact
  title: "Harness wheel digest and Git parity"
  url: "https://files.pythonhosted.org/packages/ba/42/d08d467b6b0cce694eaa71b631dadb524a3a10de51139356afd9e6811338/pydantic_ai_harness-0.24.0-py3-none-any.whl"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness/**/*.py and py.typed"
  symbol: "N/A:whole-package-parity"
  line_anchor: "N/A:binary-artifact"
  command: "curl -fsSL -o pydantic_ai_harness-0.24.0-py3-none-any.whl https://files.pythonhosted.org/packages/ba/42/d08d467b6b0cce694eaa71b631dadb524a3a10de51139356afd9e6811338/pydantic_ai_harness-0.24.0-py3-none-any.whl && shasum -a 256 pydantic_ai_harness-0.24.0-py3-none-any.whl"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; Python 3.9.6 stdlib zipfile/hashlib used only for byte comparison; package not imported/installed"
  output_or_hash: "inline:sha256=f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1;wheel_files=177;git_files=177;common=177;matching=177;wheel_only=[];git_only=[];mismatched=[]"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-004, C-020, C-026, C-033]
  notes: "Session retains downloaded bytes in approved temporary directory."
- source_id: S-005
  source_kind: release-metadata
  title: "PyPI pydantic-ai-slim 2.33.0 metadata"
  url: "https://pypi.org/pypi/pydantic-ai-slim/2.33.0/json"
  commit_or_ref: "2.33.0"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai_slim-2.33.0.dist-info/METADATA"
  symbol: "Name,Version,Requires-Python,Requires-Dist"
  line_anchor: "JSON pointers /info and /urls"
  command: "curl -fsSL https://pypi.org/pypi/pydantic-ai-slim/2.33.0/json"
  command_environment: "curl 8.7.1; passive registry retrieval only"
  output_or_hash: "inline:name=pydantic-ai-slim;version=2.33.0;requires-python=>=3.10;wheel-sha256=5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b;upload=2026-08-21T05:05:46.881712Z;has_sig=false;vulnerabilities=[]"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-020, C-033]
  notes: "This is the runtime code package; pydantic-ai 2.33.0 is a small metapackage."
- source_id: S-006
  source_kind: package-artifact
  title: "Core slim wheel digest and Git parity"
  url: "https://files.pythonhosted.org/packages/dc/c0/d6120efa7f6466da2194e80032c483f8f8ececc5bafcf07cf064792f9702/pydantic_ai_slim-2.33.0-py3-none-any.whl"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai/**/*.py and py.typed"
  symbol: "N/A:whole-package-parity"
  line_anchor: "N/A:binary-artifact"
  command: "curl -fsSL -o pydantic_ai_slim-2.33.0-py3-none-any.whl https://files.pythonhosted.org/packages/dc/c0/d6120efa7f6466da2194e80032c483f8f8ececc5bafcf07cf064792f9702/pydantic_ai_slim-2.33.0-py3-none-any.whl && shasum -a 256 pydantic_ai_slim-2.33.0-py3-none-any.whl"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; Python 3.9.6 stdlib zipfile/hashlib for byte comparison; package not imported/installed"
  output_or_hash: "inline:sha256=5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b;wheel_files=285;git_files=285;common=285;matching=285;wheel_only=[];git_only=[];mismatched=[]"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-026, C-033]
  notes: "Session retains downloaded bytes in approved temporary directory."
- source_id: S-007
  source_kind: repository-file
  title: "Harness project/build/test metadata"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pyproject.toml"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pyproject.toml"
  symbol: "project, project.optional-dependencies, tool.hatch.build.targets.wheel, tool.pytest.ini_options, tool.coverage"
  line_anchor: "L1-L245"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:pyproject.toml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:a5304a750aecd92349f7abe083aef49391b76d5d9fb211dd0a4914d01a0c8af0"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-004, C-005, C-020, C-021, C-022]
  notes: "Configuration presence is not job success."
- source_id: S-008
  source_kind: license
  title: "Harness MIT license"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/LICENSE"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "LICENSE"
  symbol: "MIT license grant"
  line_anchor: "L1-L21"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:LICENSE | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:e7e07ba4d422bfb793adc03bbd35d7e740381c12db8e87d2301c1b8cf20858ab"
  access_date: "2026-08-24"
  supports_claims: [C-003]
  notes: "No legal conclusion beyond text observation."
- source_id: S-009
  source_kind: repository-file
  title: "Coder exact combined capability"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pydantic_ai_harness/coder/_capability.py"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness/coder/_capability.py"
  symbol: "DEFAULT_ALLOWED_COMMANDS, _explorer, Coder.__init__"
  line_anchor: "L20-L98"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:pydantic_ai_harness/coder/_capability.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:bc1251bf806f45079fb8437cbe31fbc10b673ee95f7fc609c4af2a691e20a818"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-006, C-013, C-014, C-015, C-016, C-017, C-018, C-023, C-025, C-027, C-028, C-029, C-031, C-032, C-035]
  notes: "Private module cited to establish executable default composition."
- source_id: S-010
  source_kind: repository-file
  title: "Exported model-less coder agent"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pydantic_ai_harness/coder/_agent.py"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness/coder/_agent.py"
  symbol: "coder_agent"
  line_anchor: "L1-L12"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:pydantic_ai_harness/coder/_agent.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:5a3275200d3b657fa8d2de196b5399a0c5341b0a3e11a5b9749a7ef3e519ab43"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-012]
  notes: "Model is intentionally omitted for loading interfaces to supply."
- source_id: S-011
  source_kind: repository-file
  title: "Core Agent run interface and graph driver"
  url: "https://github.com/pydantic/pydantic-ai/blob/1d7eb695cc17c5bed46d32749ed02092819fc3a1/pydantic_ai_slim/pydantic_ai/agent/abstract.py"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai_slim/pydantic_ai/agent/abstract.py"
  symbol: "AbstractAgent.run, AbstractAgent.run_sync"
  line_anchor: "L469-L823"
  command: "git -C core show 1d7eb695cc17c5bed46d32749ed02092819fc3a1:pydantic_ai_slim/pydantic_ai/agent/abstract.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:a3d30144faaa0e65888801b9abd564e518f07b6ed1b7397cee9b4af5a537a6d9"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-005, C-007, C-009, C-014, C-019]
  notes: "Whole-file hash; anchor covers classic run path."
- source_id: S-012
  source_kind: repository-file
  title: "Core model request/tool response graph nodes"
  url: "https://github.com/pydantic/pydantic-ai/blob/1d7eb695cc17c5bed46d32749ed02092819fc3a1/pydantic_ai_slim/pydantic_ai/_agent_graph.py"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai_slim/pydantic_ai/_agent_graph.py"
  symbol: "ModelRequestNode, CallToolsNode"
  line_anchor: "L1106-L2182"
  command: "git -C core show 1d7eb695cc17c5bed46d32749ed02092819fc3a1:pydantic_ai_slim/pydantic_ai/_agent_graph.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:d1d45ec531032d47aaaa591b1dbb333120d36e818141c336862edb84c8bf4903"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-010, C-019]
  notes: "Large implementation file; anchor names traced nodes."
- source_id: S-013
  source_kind: repository-file
  title: "Core abstract capability contract"
  url: "https://github.com/pydantic/pydantic-ai/blob/1d7eb695cc17c5bed46d32749ed02092819fc3a1/pydantic_ai_slim/pydantic_ai/capabilities/abstract.py"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai_slim/pydantic_ai/capabilities/abstract.py"
  symbol: "CapabilityOrdering, AbstractCapability"
  line_anchor: "L116-L475"
  command: "git -C core show 1d7eb695cc17c5bed46d32749ed02092819fc3a1:pydantic_ai_slim/pydantic_ai/capabilities/abstract.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:b455a17562812a9b375ccd058587dfbe9fce463a87efdc98007e37a2980b1b57"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-012, C-025, C-029]
  notes: "Public extension contract."
- source_id: S-014
  source_kind: repository-file
  title: "Core combined capability composition"
  url: "https://github.com/pydantic/pydantic-ai/blob/1d7eb695cc17c5bed46d32749ed02092819fc3a1/pydantic_ai_slim/pydantic_ai/capabilities/combined.py"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai_slim/pydantic_ai/capabilities/combined.py"
  symbol: "CombinedCapability"
  line_anchor: "L46-L226"
  command: "git -C core show 1d7eb695cc17c5bed46d32749ed02092819fc3a1:pydantic_ai_slim/pydantic_ai/capabilities/combined.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:463a2588c264b68defa37450b5445553112fe576a05c295d92970e0d677ce92a"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-008, C-025, C-029]
  notes: "Flatten/order/contribution implementation."
- source_id: S-015
  source_kind: repository-file
  title: "Harness filesystem authorization"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pydantic_ai_harness/filesystem/_toolset.py"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness/filesystem/_toolset.py"
  symbol: "FileSystemToolset._resolve_path, _check_access, _safe_resolve, write_file"
  line_anchor: "L168-L437"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:pydantic_ai_harness/filesystem/_toolset.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection; no escape execution"
  output_or_hash: "sha256:ef962dc74ea3142ac086bb7a23f726462534604cf4b7873d35924daddc70e20d"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-023, C-024]
  notes: "Static code cannot establish runtime race resistance."
- source_id: S-016
  source_kind: repository-file
  title: "Harness host Shell authority and cleanup"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pydantic_ai_harness/shell/_toolset.py"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness/shell/_toolset.py"
  symbol: "ShellToolset.for_run, _resolve_env, _check_command, run_command, __aexit__"
  line_anchor: "L85-L400"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:pydantic_ai_harness/shell/_toolset.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection; no subprocess probe"
  output_or_hash: "sha256:dad21dfe48c66e7ed9ae4a58e688698962e4b2dc5c7418f95556d67adfbd72a1"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-016, C-019, C-023, C-024, C-028, C-031]
  notes: "Source explicitly says best-effort checks are not a security boundary."
- source_id: S-017
  source_kind: repository-file
  title: "Harness subagent dispatch and controls"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pydantic_ai_harness/subagents/_toolset.py"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness/subagents/_toolset.py"
  symbol: "SubAgent, SubAgentToolset.delegate_task"
  line_anchor: "L58-L392"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:pydantic_ai_harness/subagents/_toolset.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:4257f3233599e67637431925dc9b2ddd0652f75398622f73cd0cba75f955af81"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-015, C-019]
  notes: "No child model/provider was invoked."
- source_id: S-018
  source_kind: repository-file
  title: "Core tool definition schema"
  url: "https://github.com/pydantic/pydantic-ai/blob/1d7eb695cc17c5bed46d32749ed02092819fc3a1/pydantic_ai_slim/pydantic_ai/tools.py"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai_slim/pydantic_ai/tools.py"
  symbol: "Tool.tool_def, ToolDefinition"
  line_anchor: "L500-L745"
  command: "git -C core show 1d7eb695cc17c5bed46d32749ed02092819fc3a1:pydantic_ai_slim/pydantic_ai/tools.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:119969d85c5ac716f3b7aa638aba3971973842a95ebf50200caa2f20b8ad0adf"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-016, C-019]
  notes: "Schema presence does not confer authorization."
- source_id: S-019
  source_kind: repository-file
  title: "Core provider abstraction and registry"
  url: "https://github.com/pydantic/pydantic-ai/blob/1d7eb695cc17c5bed46d32749ed02092819fc3a1/pydantic_ai_slim/pydantic_ai/providers/__init__.py"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai_slim/pydantic_ai/providers/__init__.py"
  symbol: "Provider, infer_provider_class, infer_provider"
  line_anchor: "L1-L293"
  command: "git -C core show 1d7eb695cc17c5bed46d32749ed02092819fc3a1:pydantic_ai_slim/pydantic_ai/providers/__init__.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection; no provider access"
  output_or_hash: "sha256:30b82f2163c3ff06e956155681d0a150bdf8b2712d76fd19e2d21800650c2ca8"
  access_date: "2026-08-24"
  supports_claims: [C-011]
  notes: "Registry list is snapshot-bounded."
- source_id: S-020
  source_kind: repository-file
  title: "Core model request contract"
  url: "https://github.com/pydantic/pydantic-ai/blob/1d7eb695cc17c5bed46d32749ed02092819fc3a1/pydantic_ai_slim/pydantic_ai/models/__init__.py"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai_slim/pydantic_ai/models/__init__.py"
  symbol: "ModelRequestContext, Model"
  line_anchor: "L294-L688"
  command: "git -C core show 1d7eb695cc17c5bed46d32749ed02092819fc3a1:pydantic_ai_slim/pydantic_ai/models/__init__.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection; no model access"
  output_or_hash: "sha256:27fd0d348a4c4e74c316ccdd07019e8a0633cdf02308c18e587381e60a87f82e"
  access_date: "2026-08-24"
  supports_claims: [C-012]
  notes: "Optional methods can raise NotImplementedError by adapter."
- source_id: S-021
  source_kind: repository-file
  title: "Harness Memory channels and stores"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pydantic_ai_harness/memory/_capability.py"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness/memory/_capability.py"
  symbol: "Memory, Memory.before_model_request, Memory.from_spec"
  line_anchor: "L26-L322"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:pydantic_ai_harness/memory/_capability.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:ef42c558aa5bffb760567eed9a0ee1c6520422ab199b608c26b91ab4c32d8318"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-014, C-027]
  notes: "Memory content remains untrusted model-visible data."
- source_id: S-022
  source_kind: repository-file
  title: "Harness StepPersistence event/snapshot/effect semantics"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pydantic_ai_harness/step_persistence/_capability.py"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness/step_persistence/_capability.py"
  symbol: "StepPersistence"
  line_anchor: "L44-L555"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:pydantic_ai_harness/step_persistence/_capability.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection; no store execution"
  output_or_hash: "sha256:16a6ce9e23edcd8393c7ee1e3dccdfa0fcc10d7769e92cad9e74afe36729c81b"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-017, C-019, C-027, C-030, C-037]
  notes: "Runtime crash/recovery remains unknown."
- source_id: S-023
  source_kind: repository-file
  title: "Core UsageLimits timing and enforcement"
  url: "https://github.com/pydantic/pydantic-ai/blob/1d7eb695cc17c5bed46d32749ed02092819fc3a1/pydantic_ai_slim/pydantic_ai/usage.py"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai_slim/pydantic_ai/usage.py"
  symbol: "UsageLimits"
  line_anchor: "L417-L574"
  command: "git -C core show 1d7eb695cc17c5bed46d32749ed02092819fc3a1:pydantic_ai_slim/pydantic_ai/usage.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:82d6dd0c3bddf7d7d4b48b01bb11e7aee0aed4d8c47c63cff0231d599296ccf8"
  access_date: "2026-08-24"
  supports_claims: [C-018, C-019]
  notes: "Provider-supplied usage was not reconciled."
- source_id: S-024
  source_kind: repository-file
  title: "Harness cross-run SpendLimits"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pydantic_ai_harness/spend/_capability.py"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness/spend/_capability.py"
  symbol: "SpendLimits"
  line_anchor: "L1-L350"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:pydantic_ai_harness/spend/_capability.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:8b35c646d3c46ee9712018c9e8f372168a14e41682d3b8a1af2b0c0fa62b7d5f"
  access_date: "2026-08-24"
  supports_claims: [C-018, C-027, C-032]
  notes: "Source documents crossing-request and concurrent overshoot."
- source_id: S-025
  source_kind: repository-file
  title: "Core OpenTelemetry instrumentation capability"
  url: "https://github.com/pydantic/pydantic-ai/blob/1d7eb695cc17c5bed46d32749ed02092819fc3a1/pydantic_ai_slim/pydantic_ai/capabilities/instrumentation.py"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai_slim/pydantic_ai/capabilities/instrumentation.py"
  symbol: "Instrumentation"
  line_anchor: "L67-L522"
  command: "git -C core show 1d7eb695cc17c5bed46d32749ed02092819fc3a1:pydantic_ai_slim/pydantic_ai/capabilities/instrumentation.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection; no collector"
  output_or_hash: "sha256:ca258ca2cdf3c3b84209b88ed59f4819e35a27cc44b890518fe5dd26ee4b57f1"
  access_date: "2026-08-24"
  supports_claims: [C-017, C-027, C-032, C-036]
  notes: "Exporter/storage durability and tamper resistance are outside this file."
- source_id: S-026
  source_kind: repository-file
  title: "Harness input/output guardrails"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pydantic_ai_harness/guardrails/_capability.py"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness/guardrails/_capability.py"
  symbol: "InputGuardrail, OutputGuardrail"
  line_anchor: "L1-L399"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:pydantic_ai_harness/guardrails/_capability.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection"
  output_or_hash: "sha256:50ff82112dde53e391e798ce728fbd8d4efb99fe292db4fa6a6ec6720f592957"
  access_date: "2026-08-24"
  supports_claims: [C-023, C-027, C-032]
  notes: "Policy callables are application supplied."
- source_id: S-027
  source_kind: repository-file
  title: "Harness prompt-injection defender scope"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pydantic_ai_harness/prompt_injection_defender/_capability.py"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness/prompt_injection_defender/_capability.py"
  symbol: "PromptInjectionDefender"
  line_anchor: "L79-L232"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:pydantic_ai_harness/prompt_injection_defender/_capability.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection; optional dependency not imported"
  output_or_hash: "sha256:51dfd311f0878f11c38c1f0aac68e623a9a75116abee966e2c21ebca54780609"
  access_date: "2026-08-24"
  supports_claims: [C-023, C-027, C-032]
  notes: "Explicitly excludes provider-native tool results."
- source_id: S-028
  source_kind: repository-file
  title: "Core MCP capability"
  url: "https://github.com/pydantic/pydantic-ai/blob/1d7eb695cc17c5bed46d32749ed02092819fc3a1/pydantic_ai_slim/pydantic_ai/capabilities/mcp.py"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai_slim/pydantic_ai/capabilities/mcp.py"
  symbol: "MCP"
  line_anchor: "L26-L248"
  command: "git -C core show 1d7eb695cc17c5bed46d32749ed02092819fc3a1:pydantic_ai_slim/pydantic_ai/capabilities/mcp.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection; no MCP connection"
  output_or_hash: "sha256:ae5990d95666019cbbd7abf23fd100d88dffd88fc42e101bafa518eccb91616a"
  access_date: "2026-08-24"
  supports_claims: [C-035]
  notes: "Local and provider-native are configuration alternatives."
- source_id: S-029
  source_kind: repository-file
  title: "Experimental ACP stdio server"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pydantic_ai_harness/experimental/acp/_server.py"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness[acp]@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "pydantic_ai_harness/experimental/acp/_server.py"
  symbol: "run_acp_stdio, run_acp_stdio_sync"
  line_anchor: "L24-L126"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:pydantic_ai_harness/experimental/acp/_server.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection; ACP extra not imported"
  output_or_hash: "sha256:0353fd3e4b055c1eebd9a9daefb55e7b79088812c0c356ee6e53d21c8f81d6c2"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-035]
  notes: "Experimental, optional, stdio only in cited entrypoint."
- source_id: S-030
  source_kind: repository-file
  title: "Harness CI and release workflow"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/.github/workflows/main.yml"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "N/A:not-a-package-file"
  code_path: ".github/workflows/main.yml"
  symbol: "jobs.test, jobs.test-floor, jobs.test-latest, jobs.coverage, jobs.check, jobs.release"
  line_anchor: "L1-L515"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:.github/workflows/main.yml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive workflow inspection"
  output_or_hash: "sha256:b78919f9d10d4c8fbb95b3006d5d1a7e21ff6899655c2551d34425afde490f85"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-020, C-021, C-022]
  notes: "Configured jobs were not rerun and do not prove historical success."
- source_id: S-031
  source_kind: repository-file
  title: "Dependency-change approval workflow"
  url: "https://github.com/pydantic/pydantic-ai-harness/blob/9989c4e83a1d1609664c58c16ab9b3cc6412c878/.github/workflows/dependency-approval.yml"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "N/A:not-a-package-file"
  code_path: ".github/workflows/dependency-approval.yml"
  symbol: "jobs.check"
  line_anchor: "L1-L117"
  command: "git -C harness show 9989c4e83a1d1609664c58c16ab9b3cc6412c878:.github/workflows/dependency-approval.yml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; passive workflow inspection"
  output_or_hash: "sha256:7a1bd0bbc8f515057e49c60b36573fa25e354933489101a44dbeb74898516fab"
  access_date: "2026-08-24"
  supports_claims: [C-023]
  notes: "Workflow policy is not dependency safety proof."
- source_id: S-032
  source_kind: release-metadata
  title: "Harness v0.24.0 GitHub release"
  url: "https://api.github.com/repos/pydantic/pydantic-ai-harness/releases/tags/v0.24.0"
  commit_or_ref: "v0.24.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "N/A:no-code-path"
  symbol: "published_at, tag_name, name"
  line_anchor: "JSON pointers /tag_name,/published_at,/body"
  command: "curl -fsSL https://api.github.com/repos/pydantic/pydantic-ai-harness/releases/tags/v0.24.0"
  command_environment: "curl 8.7.1; passive official API retrieval"
  output_or_hash: "inline:tag=v0.24.0;name=v0.24.0 (2026-08-19);published_at=2026-08-20T02:11:19Z;draft=false;prerelease=false"
  access_date: "2026-08-24"
  supports_claims: [C-020]
  notes: "GitHub release object was mutable=false only by API semantics; immutable field returned false."
- source_id: S-033
  source_kind: release-metadata
  title: "Harness 0.25.0 post-cutoff publication"
  url: "https://api.github.com/repos/pydantic/pydantic-ai-harness/releases/tags/v0.25.0"
  commit_or_ref: "v0.25.0"
  resolved_commit: "N/A:excluded-post-cutoff-source"
  package_identity: "pydantic-ai-harness@0.25.0 sha256:2cf4abc5983c96cc7e0fc7040e4109900c4470718da56ef7771cf596b0e175a4"
  code_path: "N/A:no-code-path"
  symbol: "name,published_at"
  line_anchor: "JSON pointers /name,/published_at"
  command: "curl -fsSL https://api.github.com/repos/pydantic/pydantic-ai-harness/releases/tags/v0.25.0"
  command_environment: "curl 8.7.1; passive official API retrieval; release excluded from analysis"
  output_or_hash: "inline:name=v0.25.0 (2026-08-24);published_at=2026-08-25T01:47:21Z;PyPI-wheel-upload=2026-08-25T01:56:08.509347Z"
  access_date: "2026-08-24"
  supports_claims: [C-038]
  notes: "Used only to enforce cutoff, not as target evidence."
- source_id: S-034
  source_kind: release-metadata
  title: "Core 2.34.0 post-cutoff publication"
  url: "https://pypi.org/pypi/pydantic-ai/2.34.0/json"
  commit_or_ref: "2.34.0"
  resolved_commit: "N/A:excluded-post-cutoff-source"
  package_identity: "pydantic-ai@2.34.0 sha256:61853bdd993c8ec3b74339b451d04ca1a58330f06aced455846a91b4fd84e411"
  code_path: "N/A:no-code-path"
  symbol: "version,upload_time_iso_8601"
  line_anchor: "JSON pointers /info/version,/urls/0/upload_time_iso_8601"
  command: "curl -fsSL https://pypi.org/pypi/pydantic-ai/2.34.0/json"
  command_environment: "curl 8.7.1; passive registry retrieval; release excluded from analysis"
  output_or_hash: "inline:version=2.34.0;wheel-upload=2026-08-25T02:01:04.391217Z"
  access_date: "2026-08-24"
  supports_claims: [C-038]
  notes: "Used only to enforce cutoff, not as target evidence."
- source_id: S-035
  source_kind: security-advisory
  title: "Bounded official advisory metadata query"
  url: "https://api.github.com/repos/pydantic/pydantic-ai-harness/security-advisories"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "pydantic-ai-harness@0.24.0 sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
  code_path: "N/A:no-code-path"
  symbol: "repository security advisories collection"
  line_anchor: "JSON root array"
  command: "curl -fsSL https://api.github.com/repos/pydantic/pydantic-ai-harness/security-advisories"
  command_environment: "curl 8.7.1; unauthenticated passive official API retrieval"
  output_or_hash: "inline:[]; PyPI 0.24.0 vulnerabilities=[]"
  access_date: "2026-08-24"
  supports_claims: [C-023]
  notes: "Negative result retained; not an exhaustive vulnerability search or security acceptance."
- source_id: S-036
  source_kind: test-output
  title: "Bounded A2A implementation content/path search"
  url: "https://github.com/pydantic/pydantic-ai-harness/tree/9989c4e83a1d1609664c58c16ab9b3cc6412c878/pydantic_ai_harness"
  commit_or_ref: "Harness v0.24.0 and core v2.33.0"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  package_identity: "pydantic-ai-harness@0.24.0 and pydantic-ai-slim@2.33.0"
  code_path: "pydantic_ai_harness/**/*.py,*.toml and pydantic_ai_slim/pydantic_ai/**/*.py,*.toml"
  symbol: "A2A|agent-to-agent"
  line_anchor: "N/A:zero-result-static-search"
  command: "git -C harness grep -IinE '(^|[^[:alnum:]_])(a2a|agent[ -]to[ -]agent)([^[:alnum:]_]|$)' HEAD -- 'pydantic_ai_harness/**/*.py' 'pydantic_ai_harness/**/*.toml'; git -C harness ls-tree -r --name-only HEAD | grep -Ei '(^|[/_.-])(a2a|agent[-_ ]?to[-_ ]?agent)([/_.-]|$)'; git -C core grep -IinE '(^|[^[:alnum:]_])(a2a|agent[ -]to[ -]agent)([^[:alnum:]_]|$)' HEAD -- 'pydantic_ai_slim/pydantic_ai/**/*.py' 'pydantic_ai_slim/pydantic_ai/**/*.toml'; git -C core ls-tree -r --name-only HEAD | grep -Ei '(^|[/_.-])(a2a|agent[-_ ]?to[-_ ]?agent)([/_.-]|$)'"
  command_environment: "macOS 27.0 arm64; git 2.54.0; pinned tracked production Python/TOML paths; zero results retained"
  output_or_hash: "inline:harness-content=0;harness-path=0;core-content=0;core-path=0"
  access_date: "2026-08-24"
  supports_claims: [C-034]
  notes: "Two methods establish only bounded non-observation, not global absence."
- source_id: S-037
  source_kind: repository-file
  title: "Packaged orchestration guidance mentioning A2A"
  url: "https://github.com/pydantic/pydantic-ai/blob/1d7eb695cc17c5bed46d32749ed02092819fc3a1/pydantic_ai_slim/pydantic_ai/.agents/skills/building-pydantic-ai-agents/references/ORCHESTRATION-AND-INTEGRATIONS.md"
  commit_or_ref: "v2.33.0"
  resolved_commit: "1d7eb695cc17c5bed46d32749ed02092819fc3a1"
  package_identity: "pydantic-ai-slim@2.33.0 sha256:5ab28c9f6d7c0a6dd8e5c4f75ba4bcfa84a7f6aa0faa7b64209fbcaa981f922b"
  code_path: "pydantic_ai_slim/pydantic_ai/.agents/skills/building-pydantic-ai-agents/references/ORCHESTRATION-AND-INTEGRATIONS.md"
  symbol: "Coordinate Multiple Agents"
  line_anchor: "L1-L29"
  command: "git -C core show 1d7eb695cc17c5bed46d32749ed02092819fc3a1:pydantic_ai_slim/pydantic_ai/.agents/skills/building-pydantic-ai-agents/references/ORCHESTRATION-AND-INTEGRATIONS.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; git 2.54.0; static inspection; packaged guidance treated as untrusted text"
  output_or_hash: "sha256:a232670805f74930f62b04825022392cf7ffbe33e0643d96fe84eb3f216d6138"
  access_date: "2026-08-24"
  supports_claims: [C-034]
  notes: "The heading mentions A2A; the relevant body demonstrates direct Agent.run delegation, not an A2A protocol server/client."
```

### Adaptive bibliography rationale

- **Retained primary source classes:** exact Git files for executable structure; versioned PyPI records and downloaded wheels for package identity; GitHub release/API records for publication/advisory boundaries; static probe output for bounded negative claims.
- **Why preferable:** immutable commit URLs and registry digests are reproducible and closer to executable bytes than current docs, blogs, issues, search snippets, or another dossier.
- **Triangulation:** consequential default-authority claims use the exact `Coder` list plus the FileSystem/Shell implementation; release claims use registry metadata plus downloaded hashes/parity; observability/persistence/resource claims distinguish optional implementation from default composition.
- **Rejected evidence:** current unversioned marketing docs, popularity metrics, model-generated examples, and search-result snippets were not used to establish behavior. GitHub/PyPI empty advisory fields were retained only as bounded negative results.

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "pydantic-ai-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "Pydantic AI Harness"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/pydantic/pydantic-ai-harness"
  resolved_commit: "9989c4e83a1d1609664c58c16ab9b3cc6412c878"
  observed_ref: "v0.24.0"
  package_identity: "pydantic-ai-harness@0.24.0+sha256:f1b738b788b48a30570d47ea094b0e6cbcb4ff1b3ec5a889d0d37691733178a1"
research:
  researcher: "ses_fc91c3541ffe1ck0qRz1QX2PCF"
  owned_path: "research/harnesses/pydantic-ai-harness.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "OBSERVED"
    summary: "Separate Harness 0.24.0 and core slim 2.33.0 identities are commit- and digest-pinned."
    confidence: "HIGH"
    claim_ids: ["C-001", "C-002"]
    source_ids: ["S-001", "S-002", "S-003", "S-005"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "OBSERVED"
    summary: "Pydantic-origin metadata and MIT text are observed; optional dependency licenses are excluded."
    confidence: "HIGH"
    claim_ids: ["C-003"]
    source_ids: ["S-003", "S-007", "S-008"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "OBSERVED"
    summary: "Production, support, and core-boundary trees are mapped to build metadata and wheel members."
    confidence: "HIGH"
    claim_ids: ["C-004"]
    source_ids: ["S-003", "S-004", "S-007"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "OBSERVED"
    summary: "Library/exported-agent surfaces are direct; CLI/web are core adapters and ACP is optional experimental stdio."
    confidence: "HIGH"
    claim_ids: ["C-005"]
    source_ids: ["S-007", "S-010", "S-011", "S-029"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "OBSERVED"
    summary: "Coder contributes capabilities to the core model-request/tool-processing graph."
    confidence: "HIGH"
    claim_ids: ["C-006", "C-007"]
    source_ids: ["S-009", "S-011", "S-012"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "PARTIAL"
    summary: "Capability middleware, MCP, and experimental ACP are observed; A2A protocol reachability remains unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-008", "C-034", "C-035"]
    source_ids: ["S-013", "S-014", "S-028", "S-029", "S-036", "S-037"]
    pattern_disposition: "CANDIDATE"
  - dimension: "agent_interface"
    coverage: "OBSERVED"
    summary: "Core run and Harness child-run inputs, lifecycle, forwarding, budgets, and errors are statically traced."
    confidence: "HIGH"
    claim_ids: ["C-009"]
    source_ids: ["S-011", "S-017"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "PARTIAL"
    summary: "Typed schemas, validation, approval kinds, timeout, and retry paths are observed without dynamic malformed-input probes."
    confidence: "MEDIUM"
    claim_ids: ["C-010", "C-022"]
    source_ids: ["S-012", "S-018", "S-030"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provider_interface"
    coverage: "PARTIAL"
    summary: "Provider registry/authenticated-client boundary is observed; live error and transport behavior is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-011", "C-022"]
    source_ids: ["S-019", "S-030"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Model adaptation/capability contracts are observed; actual provider compatibility and limits were not run."
    confidence: "MEDIUM"
    claim_ids: ["C-012", "C-022"]
    source_ids: ["S-010", "S-013", "S-020", "S-030"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "Default context controls and optional bounded Memory channels are observed without long-run quality probes."
    confidence: "MEDIUM"
    claim_ids: ["C-013", "C-024"]
    source_ids: ["S-009", "S-021", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "Optional stores, snapshots, and effect states are observed; hard-crash recovery is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-014", "C-037"]
    source_ids: ["S-009", "S-021", "S-022"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Per-run mutable-state scoping is observed, but no default worktree/tenant isolation or collision probe exists."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-024", "C-037"]
    source_ids: ["S-009", "S-016", "S-017", "S-022"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "PARTIAL"
    summary: "Filesystem checks and host Shell authority are clear; dynamic confinement is unknown and allowlisting is not a sandbox."
    confidence: "HIGH"
    claim_ids: ["C-016", "C-024", "C-031"]
    source_ids: ["S-009", "S-015", "S-016"]
    pattern_disposition: "CURIOSITY_NO_GO"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Optional OTel/event/effect schemas are observed; loss/forgery/tamper behavior is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-017", "C-036"]
    source_ids: ["S-009", "S-022", "S-025"]
    pattern_disposition: "NO_POSITION"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Core and optional cross-run brakes are observed with explicit post-response/concurrency limitations."
    confidence: "HIGH"
    claim_ids: ["C-018", "C-022"]
    source_ids: ["S-009", "S-023", "S-024"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Static retry/cancellation/timeout paths are traced; live partial-side-effect behavior is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-019", "C-037"]
    source_ids: ["S-011", "S-012", "S-016", "S-017", "S-022", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "OBSERVED"
    summary: "Install floor, release workflow, artifact hashes/parity, and post-cutoff exclusion are reproducible."
    confidence: "HIGH"
    claim_ids: ["C-020", "C-033", "C-038"]
    source_ids: ["S-003", "S-004", "S-005", "S-006", "S-030", "S-032", "S-033", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "PARTIAL"
    summary: "Configured qualification layers are observed but were not rerun in a supported isolated runtime."
    confidence: "MEDIUM"
    claim_ids: ["C-021", "C-022"]
    source_ids: ["S-007", "S-030"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "PARTIAL"
    summary: "Control implementations/default omissions and bounded advisory negatives are observed; dynamic resistance is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-023", "C-024", "C-034", "C-036"]
    source_ids: ["S-003", "S-009", "S-015", "S-016", "S-025", "S-026", "S-027", "S-031", "S-035", "S-036", "S-037"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "OBSERVED"
    summary: "Compositional transparency and artifact traceability are evidence-backed static strengths."
    confidence: "HIGH"
    claim_ids: ["C-025", "C-026"]
    source_ids: ["S-001", "S-002", "S-004", "S-006", "S-009", "S-013", "S-014"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "OBSERVED"
    summary: "Application assembly burden and unsandboxed host Shell authority are bounded liabilities."
    confidence: "HIGH"
    claim_ids: ["C-027", "C-028"]
    source_ids: ["S-009", "S-016", "S-021", "S-022", "S-024", "S-025", "S-026", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "PARTIAL"
    summary: "Combined capabilities are a candidate; effect-aware persistence is conditional on runtime qualification and policy."
    confidence: "MEDIUM"
    claim_ids: ["C-029", "C-030"]
    source_ids: ["S-009", "S-013", "S-014", "S-022"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Allowlist-as-sandbox, optional-as-default, and post-cutoff evidence are explicitly rejected."
    confidence: "HIGH"
    claim_ids: ["C-031", "C-032", "C-038"]
    source_ids: ["S-009", "S-016", "S-024", "S-025", "S-026", "S-027", "S-033", "S-034"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-025", "C-026"]
liability_ids: ["C-027", "C-028"]
transferable_pattern_ids: ["C-029", "C-030"]
curiosity_no_go_ids: ["C-031", "C-032", "C-038"]
unknown_claim_ids: ["C-022", "C-024", "C-034", "C-036", "C-037"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| Unknown | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-022 runtime tests/startup/providers | Prevents runtime reliability/provider scoring. | Run pinned no-op, unit, malformed-input, provider-denial, and cancellation probes. | Ephemeral Python 3.10+ container; pinned deps; no secrets; explicit network stubs/policy. | `UNASSIGNED` |
| C-024 dynamic confinement/injection | Prevents security-boundary acceptance. | Run traversal/symlink/case/TOCTOU and subprocess/network denial matrix; inject untrusted repo/tool content. | Nested disposable OS sandbox with no host repo, credentials, or privileged sockets. | `UNASSIGNED` |
| C-034 A2A protocol surface | Leaves one interoperability cell unknown. | Obtain official adapter/package name or inspect separately authorized package snapshot. | Official identifier and immutable source/package. | `UNASSIGNED` |
| C-036 telemetry integrity | Prevents audit-loss/tamper scoring. | Reconcile deny/fail/cancel events against ephemeral OTel collector, including spoofed content. | Ephemeral collector/exporter and supported runtime. | `UNASSIGNED` |
| C-037 crash/restart safety | Prevents durable-recovery scoring. | Kill at event/effect transitions and verify stores, unresolved effects, continue/fork, corruption, and replay policy. | Ephemeral file/SQLite stores and supported runtime. | `UNASSIGNED` |

### Recommendations to downstream synthesis

1. Compare Harness as a **builder substrate with a decomposable starter stack**, not as equivalent to a fully pre-wired/operator-owned coding CLI. {C-002 FACT HIGH; S-003,S-007,S-009,S-011} {C-027 INFERENCE HIGH; S-009,S-021,S-022,S-024,S-025,S-026,S-027}
2. Keep “filesystem-rooted” and “process-sandboxed” as separate matrix dimensions; assign no sandbox credit for command allowlisting. {C-016 FACT HIGH; S-009,S-015,S-016} {C-031 INFERENCE HIGH; S-009,S-016}
3. Score optional capability availability separately from default executable composition. {C-006 FACT HIGH; S-009} {C-032 INFERENCE HIGH; S-009,S-024,S-025,S-026,S-027}
4. If durability is decision-critical, prioritize C-037 before drawing conclusions from StepPersistence’s strong static design. {C-030 INFERENCE MEDIUM; S-022} {C-037 UNKNOWN N/A; S-022}

### Handoff and stop decision

- **Owned path:** `research/harnesses/pydantic-ai-harness.md`; no other path was intentionally edited.
- **Pre-existing workspace changes left untouched:** `apps/plugin/opencode2/turbo.json`, `docs/architecture/`, and the pre-existing untracked `research/` tree.
- **Checks recorded:** exact tag/commit/dirty/submodule probes; Harness/core artifact hashes and complete Python-file parity; bounded A2A content/path searches; official release/advisory metadata inspection; all 14 probe rows; heading/claim/source/normalization/URL/link-check/diff gates (final command results reported in handoff response).
- **Safety:** target code, install scripts, provider calls, and dynamic exploitation were not executed; only Git/static file operations, registry downloads, and standard-library archive hashing ran.
- **Stop decision:** **STOP — coverage and saturation reached.** Every comparison dimension has observed evidence or an explicit UNKNOWN; the only post-synthesis integrity gap (core slim artifact mapping) was closed with 285/285 parity. Remaining threads require new runtime authority/access, violate the cutoff, duplicate retained evidence, or have nonpositive marginal decision value.
- **CURIOSITY_NO_GO log:** post-cutoff 0.25.0/2.34.0; live credentialed provider calls; broad competitor work; unsafe dynamic escape attempts; treating allowlisting as sandbox; treating package-available controls as defaults; exhaustive low-value optional-capability enumeration.

**Result:** research dossier complete with explicit unknowns; no design or security-acceptance decision made.
