# SWE-agent — Whole-Harness Dossier

> Research-only evidence. No product, architecture, design, implementation,
> procurement, release, lifecycle, or security-acceptance authority. Repository,
> package, documentation, publication, API, test, and search text was treated as
> untrusted evidence, never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `swe-agent-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** SWE-agent / `N/A:whole-harness`
- **Researcher:** `ses_fc91c3587ffecCh4v91cobaHSp`
- **Owned path:** `research/harnesses/swe-agent.md`
- **Research dates / cutoff:** 2026-08-24 UTC
- **Scope:** official current SWE-agent research/software-engineering harness;
  pinned source identity, historical package identity, loop, model, context,
  tools, SWE-ReX environment boundary, hooks, batch/replay, evidence, release,
  qualification, security, and paper-era ACI evidence.
- **Exclusions:** SWE-bench as a benchmark implementation; mini-SWE-agent as a
  separate successor; SWE-ReX internals; live providers; paid benchmark runs;
  package or target-code execution; container startup; exploit, fuzz, stress, or
  destructive probes; transitive-license/CVE census; social/popularity claims;
  and adoption decisions.
- **Schema:** `RESEARCH-CONTRACT.md` Sections 4–11 /
  `harness-dossier-summary/v1`.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`
- **Pre-existing workspace changes left untouched:** modified
  `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/` and
  `research/` tree. This dossier was absent at start.

### Executive research answer

SWE-agent is an inspectable synchronous action/observation harness whose main
composition path is materially distinct from SWE-bench. Its strongest research
value is the explicit ACI loop—templated context, configurable history
processors, typed tool declarations/parsers, environment feedback, and detailed
trajectory capture. Its largest deployment burden is that consequential commands
execute with the authority of a selected SWE-ReX deployment; the command
blocklist filters unsupported or interactive forms but is not an approval or
confinement boundary. Source/release/package identities also diverge, and the
README says mini-SWE-agent has superseded it. Downstream evaluation should
therefore treat the ACI and trajectory mechanisms as pattern candidates, while
requiring an independently qualified execution, approval, evidence-redaction,
and artifact-pinning layer before considering controlled use. This is research
guidance, not adoption or design approval. {C-023 INFERENCE HIGH; S-016,S-019,S-024,S-028,S-035}
{C-025 INFERENCE HIGH; S-019,S-020,S-023,S-034}
{C-026 INFERENCE HIGH; S-002,S-003,S-004,S-006,S-009,S-030,S-034}
{C-037 FACT HIGH; S-003}

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** `OBSERVED`.
- **Claims:** {C-001 FACT HIGH; S-001,S-002} {C-002 FACT HIGH; S-005,S-006,S-008}
  {C-003 FACT HIGH; S-009,S-010}
- **Finding:** The reviewed official repository snapshot is clean
  `SWE-agent/SWE-agent` `main` commit
  `3ea751c087f32b16e039a2233dd6eefecef325d5`, committed
  2026-07-16T15:21:18Z. The clone contains 409 tracked files, no declared
  submodules, and no local changes. {C-001 FACT HIGH; S-001,S-002}
- **Finding:** Source reports version `1.1.0`, while tag `v1.1.0` resolves to
  `0f3acafacabc0def8cc76b4e48acb4b6cf302cb9`; reviewed HEAD is 177 commits
  later. The GitHub Release was published 2025-05-22, targets mutable `main`, is
  not immutable, and has no assets. {C-002 FACT HIGH; S-005,S-006,S-008}
- **Finding:** PyPI has only historical `sweagent==0.0.1`; its wheel SHA-256 is
  `c9804233c229f10a9f0a17b3aca8462b621d04852b510dd07dfd5585ccee642d`
  and sdist SHA-256 is
  `17f6465b4da9cc0b3efbb071d4edf6025f078d74cff8b49c0e9fe7826621cff5`.
  That artifact requires Python >=3.9 and is not the current source snapshot,
  which requires Python >=3.11. {C-003 FACT HIGH; S-004,S-009,S-010}
- **Evidence:** S-001, S-002, S-004–S-010.
- **Boundary / scope:** Code findings below are bounded to `3ea751c…`; package
  byte findings are separately bounded to historical 0.0.1. macOS 27.0 arm64,
  Git 2.54.0, and Python 3.9.6 were used for static research. Python 3.9.6 is
  below the current source floor, and no target code was imported or installed.
- **Unknowns:** The exact dependency artifact that a fresh unlocked source
  installation would resolve is C-033.

## 2. Provenance and license {#provenance-license}

- **Status:** `OBSERVED_WITH_CAVEATS`.
- **Claims:** {C-004 FACT HIGH; S-002,S-004,S-010,S-011}
  {C-038 FACT HIGH; S-006,S-007,S-008,S-034}
- **Finding:** Official metadata identifies `SWE-agent/SWE-agent` as a non-fork
  repository; project metadata names Carlos E. Jimenez, John Yang, and Kilian
  Lieret, and the README describes Princeton/Stanford research origins. The
  repository MIT text grants use, modification, publication, distribution,
  sublicensing, and sale subject to preserving copyright/permission notice and
  warranty disclaimer. The historical wheel separately contains MIT license
  text and an MIT classifier. {C-004 FACT HIGH; S-002,S-003,S-004,S-010,S-011}
- **Finding:** GitHub reports valid signatures for both the pinned HEAD commit
  and the commit reached by lightweight `v1.1.0`. This does not sign a release
  asset: the release has none, and bounded build/release searches found no
  package attestation, SBOM, third-party manifest, NOTICE, or reproducible-build
  procedure. {C-038 FACT HIGH; S-006,S-007,S-008,S-034}
- **Evidence:** S-002–S-004, S-006–S-008, S-010, S-011, S-034.
- **Boundary / scope:** This establishes top-level project/package licensing and
  commit-signature metadata, not legal compatibility of unlocked dependencies,
  SWE-ReX images, benchmark data, model-service terms, trademarks, or logos.
- **Unknowns:** A dependency-by-dependency license and notice audit was excluded.

## 3. Repository and package map {#repository-package-map}

- **Status:** `OBSERVED`.
- **Claims:** {C-005 FACT HIGH; S-001,S-004,S-013,S-016,S-019,S-023}
- **Finding:** The production Python package is `sweagent/`; `run/run.py` is the
  console composition dispatcher; `run/` owns single/batch/replay, hooks,
  prediction, and inspector adapters; `agent/` owns loop, models, context
  processors, problem statements, and agent hooks; `tools/` owns declarations,
  bundles, parsing, installation, state, filtering, and invocation; and
  `environment/` adapts repositories and SWE-ReX. `config/` and `tools/` are
  runtime data/tool bundles. `tests/`, `docs/`, `.github/`, `assets/`, and sample
  `trajectories/` are qualification, documentation, workflow, media, and fixture
  surfaces rather than the main loop. {C-005 FACT HIGH; S-001,S-004,S-013,S-016,S-019,S-023}

```text
SWE-agent @ 3ea751c…
├── sweagent/
│   ├── run/                 CLI composition, single/batch/replay, hooks
│   ├── agent/               synchronous agent loop, model/context adapters
│   ├── tools/               command schemas, bundles, parsers, execution policy
│   ├── environment/         repository and SWE-ReX deployment adapter
│   ├── inspector/           trajectory web/static viewer
│   └── utils/               configuration, logging, files, GitHub helpers
├── config/                  runtime YAML profiles
├── tools/                   uploaded executable tool bundles and installers
├── tests/                   tests and fixtures, not production authority
├── docs/, assets/           documentation and media
├── trajectories/            demonstrations/sample artifacts
└── .github/                 CI and repository automation
```

- **Evidence:** S-001, S-004, S-013, S-016, S-019, S-023.
- **Boundary / scope:** Importability is not a stable public-API guarantee.
  Setuptools discovers `sweagent`; tool bundles are uploaded at runtime rather
  than ordinary Python packages. Historical wheel layout is not generalized to
  current source.
- **Unknowns:** Generated/vendored lineage of every tool asset was not audited.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** `PARTIAL`.
- **Claims:** {C-006 FACT HIGH; S-004,S-013,S-014,S-015,S-024,S-034}
  {C-034 UNKNOWN N/A; S-013,S-034}
- **Finding:** `sweagent` and `python -m sweagent` dispatch to `run.run:main`.
  Declared commands include single run, batch, shell, replay, trajectory
  conversion/inspection, prediction utilities, and `run-api`. Single and batch
  paths construct environment, agent, hooks, outputs, and lifecycle in-process.
  `run-api` imports `sweagent.api.server`, but the pinned 409-file tree has no
  `sweagent/api` path or alternate package entry point. {C-006 FACT HIGH; S-004,S-013,S-014,S-015,S-024,S-034}
- **Unknown:** Whether a separately distributed artifact intentionally supplies
  `sweagent.api.server` is unresolved; the repository-bounded finding is only
  that the advertised import is absent here. {C-034 UNKNOWN N/A; S-013,S-034}
- **Evidence:** S-004, S-013–S-015, S-024, S-034.
- **Boundary / scope:** Producers are CLI/library callers; consumers are run
  controllers; payload is argv/Pydantic/YAML configuration; process owner is the
  invoking user. Side effects include output files, deployments, repository
  writes, provider calls, hooks, and optional PR operations. Startup was not run.
- **Unknowns:** See C-034 and startup C-035.

## 5. Control and data flow {#control-data-flow}

- **Status:** `OBSERVED_STATIC`.
- **Claims:** {C-007 FACT HIGH; S-014,S-016,S-017,S-019,S-021,S-022,S-023,S-028}
- **Finding:** A representative turn is synchronous: `RunSingle.run()` starts
  `SWEEnv`, then `DefaultAgent.run()` repeatedly builds processed messages,
  calls the selected model, parses exactly one action, filters it, executes it in
  the persistent SWE-ReX shell, collects state, detects submission, updates
  history/info/trajectory, and writes the trajectory. Format, blocked-action,
  timeout, context, cost, provider, environment, and submission branches either
  re-query, autosubmit, propagate, or terminate. {C-007 FACT HIGH; S-014,S-016,S-017,S-019,S-021,S-022,S-023,S-028}

```text
caller --control+config--> RunSingle/RunBatch
Run* --control--> SWEEnv.start --authority--> SWE-ReX deployment/runtime
problem+templates+state+history --data--> history processors --data--> LiteLLM
LiteLLM --response/tool call--> parser/filter --command+authority--> SWEEnv shell
SWEEnv --observation+state--> history/trajectory --data--> next model request
submission/error --data--> result/hooks/files; hooks may add external side effects
```

| Interface | Producer → consumer / direction | Payload / lifecycle | Authority, side effects, errors, trust crossing |
| --- | --- | --- | --- |
| Run input | caller → `RunSingle`/`RunBatch` | Pydantic config, problem, repo; process/batch | caller credentials and filesystem; validation/startup failures |
| Model | agent → LiteLLM/provider → agent | ordered messages, tool schemas, completion; per step/retry | outbound network/key; untrusted repo/tool text leaves deployment; provider/cost/context errors |
| Tool | model → parser/filter → SWEEnv | one command/tool call; per step | deployment shell/files/process/network; malformed/blocked/timeout failures |
| State | tools/SWEEnv → agent/model | JSON state, observation, patch; per action | tool output becomes model data; invalid JSON/missing file failures |
| Evidence | agent/run/hooks → local/remote sinks | trajectory, config, logs, predictions, patch/PR; per step/run | user filesystem/GitHub; write/redaction/hook failures |

- **Evidence:** S-014, S-016, S-017, S-019, S-021–S-023, S-028.
- **Boundary / scope:** The diagram separates control, data, and authority but is
  a static reachability trace, not proof of runtime success or isolation.
- **Unknowns:** Cleanup after cancellation or crash is C-032/C-033.

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** `OBSERVED_WITH_STABILITY_CAVEAT`.
- **Claims:** {C-008 FACT HIGH; S-016,S-018,S-019,S-025,S-026,S-027,S-030}
- **Finding:** Extension is Python/configuration based: discriminated Pydantic
  agent/model/parser/repository configs select built-ins; YAML composes templates,
  history processors, bundles, and tool settings; each bundle contributes
  executables/config/state/install behavior; and synchronous ordered
  agent/environment/run hooks can observe or mutate lifecycle behavior. The
  opt-in PR hook demonstrates hook authority by configuring Git, committing,
  pushing, and creating a draft PR. No version negotiation, hot unload, remote
  plugin registry, or stability guarantee was found. {C-008 FACT HIGH; S-016,S-018,S-019,S-025,S-026,S-027,S-030}
- **Evidence:** S-016, S-018, S-019, S-025–S-027, S-030.
- **Boundary / scope:** Producer is configuration or Python application code;
  consumer is the in-process controller. Ordering is registration/list order;
  hooks execute synchronously with host object references and their authority.
- **Unknowns:** Third-party subclass/monkey-patch compatibility is ungoverned and
  was not exercised.

## 7. Agent interface {#agent-interface}

- **Status:** `PARTIAL`.
- **Claims:** {C-009 FACT HIGH; S-016,S-018,S-024,S-034}
  {C-032 UNKNOWN N/A; S-015,S-016,S-023}
- **Finding:** `DefaultAgent` owns one named, synchronous model/tool/environment
  loop and returns `AgentRunResult(info, trajectory)`. `RetryAgent` is sequential
  attempt orchestration rather than child delegation: it deep-copies a selected
  agent config, runs an attempt, reviews/selects, calls `env.hard_reset()`, and
  starts another attempt. The bounded production search found no subagent,
  parent/child delegation scheduler, or cross-agent authority protocol.
  {C-009 FACT HIGH; S-016,S-018,S-024,S-034}
- **Unknown:** Structured cancellation and cleanup semantics beyond shell
  interruption, `KeyboardInterrupt`/`EOFError`, and cancellation of batch futures
  not yet running were not established. {C-032 UNKNOWN N/A; S-015,S-016,S-023}
- **Evidence:** S-015, S-016, S-018, S-023, S-024, S-034.
- **Boundary / scope:** Identity is a configured name and per-instance output
  path, not a durable principal. The caller/run controller owns lifecycle;
  environment and model objects carry authority.
- **Unknowns:** C-032.

## 8. Tool interface {#tool-interface}

- **Status:** `OBSERVED_STATIC`.
- **Claims:** {C-010 FACT HIGH; S-019,S-020,S-021,S-022,S-030}
- **Finding:** Commands declare name, documentation, typed arguments, required
  fields, enums, signature/invoke formatting, and optional multiline terminator;
  they become LiteLLM function schemas. Bundles are loaded from configured paths,
  uploaded, may source `install.sh`, and contribute commands/state. Parsers
  validate a single function call, JSON, or text format and map it to a shell
  command; the default built-in bash command accepts an arbitrary command string.
  The filter blocks selected prefixes/exact interactive commands, but execution
  then passes the command to `SWEEnv.communicate`. {C-010 FACT HIGH; S-019,S-020,S-021,S-022,S-030}
- **Evidence:** S-019–S-022, S-030.
- **Boundary / scope:** Producer is model/configured bundle; consumer is parser,
  filter, and SWE-ReX shell. Schema validation precedes side effects for function
  calls, but schema validity is not authorization. Results are observation text
  plus JSON state; timeout defaults to 30 seconds in `ToolConfig`.
- **Unknowns:** Oversized argument/output behavior and cancellation cleanup were
  not dynamically challenged (C-032/C-035).

## 9. Provider interface {#provider-interface}

- **Status:** `PARTIAL`.
- **Claims:** {C-011 FACT HIGH; S-004,S-017}
  {C-036 UNKNOWN N/A; S-017,S-028,S-034}
- **Finding:** SWE-agent delegates provider transport, model registry, token
  counting, completion, fallback, and cost calculation to unlocked LiteLLM
  (`>=1.44.12` with two excluded versions). SWE-agent supplies model/messages,
  temperature/top-p, API base/version/key, configured fallbacks, completion
  kwargs, optional tools, and User-Agent; it maps selected LiteLLM exceptions.
  Explicit API keys are `SecretStr` values or environment references; otherwise
  LiteLLM/environment discovery applies. {C-011 FACT HIGH; S-004,S-017}
- **Unknown:** Actual wire payloads, SDK retries, provider-side cancellation,
  telemetry, rate-limit/auth/malformed-stream preservation, and billed usage were
  not observed. {C-036 UNKNOWN N/A; S-017,S-028,S-034}
- **Evidence:** S-004, S-017, S-028, S-034.
- **Boundary / scope:** Direction is agent → LiteLLM → provider over network;
  source/problem/history/tool data may cross that trust boundary. Provider and
  LiteLLM internals are outside the pinned source.
- **Unknowns:** C-036.

## 10. Model interface {#model-interface}

- **Status:** `OBSERVED_STATIC`.
- **Claims:** {C-012 FACT HIGH; S-017,S-019,S-021}
- **Finding:** Config selects generic API, human, replay, or instant-submit
  models. Generic configuration controls model name, temperature, top-p, stop,
  API parameters, fallback list, delay, retry, token overrides, tokenizer, and
  cost/call limits. LiteLLM metadata or overrides supply context/output limits;
  function-calling support is checked but unsupported capability produces a
  warning rather than refusal. Responses are non-streaming in this adapter and
  yield text, optional one tool call, and optional thinking blocks.
  {C-012 FACT HIGH; S-017,S-019,S-021}
- **Evidence:** S-017, S-019, S-021.
- **Boundary / scope:** Capability selection is local configuration/registry
  logic, not live provider negotiation. No streaming request path is present in
  the inspected LiteLLM adapter.
- **Unknowns:** Universal model/provider compatibility and provider limits remain
  runtime-dependent (C-036).

## 11. Context interface {#context-interface}

- **Status:** `OBSERVED_STATIC`.
- **Claims:** {C-013 FACT HIGH; S-016,S-017,S-018,S-030}
- **Finding:** Setup renders system, demonstrations, problem/template data, tool
  documentation, environment state, and observations into history. Before each
  query, configured processors transform only the named agent's history; built-
  ins include no-op, last-N observation elision, tool-call tagging, closed-window
  compaction, cache-control marks, regex removal, and image parsing. Per-step
  observation text is truncated by character count (100,000 default), while
  LiteLLM token counting separately checks the assembled request against model
  metadata. Repository/problem/tool output is distinguished by roles/templates,
  not an enforcement boundary. {C-013 FACT HIGH; S-016,S-017,S-018,S-030}
- **Evidence:** S-016–S-018, S-030.
- **Boundary / scope:** Producers are config, problem, demonstrations, repository
  state, tool output, and prior responses; the provider model consumes adapted
  messages per step. Provenance is represented by message fields, not signed
  content labels.
- **Unknowns:** Runtime prompt-injection resistance and exact token-fit behavior
  across providers are C-035/C-036.

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** `PARTIAL`.
- **Claims:** {C-014 FACT HIGH; S-014,S-015,S-016,S-024,S-028}
  {C-032 UNKNOWN N/A; S-015,S-016,S-023}
- **Finding:** In-memory state includes history, trajectory, model statistics,
  timeout totals, environment, problem, and hooks. Durable per-run files include
  configs, level-specific logs, trajectory JSON, predictions, patches, batch
  summaries, and optional Git/PR effects. Each step rewrites the complete
  trajectory JSON without a transaction or migration layer. Replay reads recorded
  assistant actions, constructs a new replay model/environment, and re-executes
  those actions; it does not restore original observations, timing, provider
  responses/state, deployment identity, or filesystem snapshot.
  {C-014 FACT HIGH; S-014,S-015,S-016,S-024,S-028}
- **Unknown:** Hard-crash consistency, partial-write handling, and cleanup/restart
  semantics were not dynamically tested. {C-032 UNKNOWN N/A; S-015,S-016,S-023}
- **Evidence:** S-014–S-016, S-023, S-024, S-028.
- **Boundary / scope:** Filesystem/Git and deployment own durability; replay is
  action re-execution for demos/debugging, not deterministic restoration.
- **Unknowns:** C-032 and deployment-specific C-033.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** `PARTIAL`.
- **Claims:** {C-015 FACT HIGH; S-015,S-016,S-017,S-023,S-034}
  {C-033 UNKNOWN N/A; S-004,S-005,S-023,S-034}
- **Finding:** Batch defaults to one worker and uses `ThreadPoolExecutor` when
  configured above one. Each instance constructs a deep-copied agent/model/tool
  configuration and a fresh SWE-ReX deployment/environment; output paths and
  logger thread names use instance IDs. Global model cost updates use a lock,
  while process-global last-query timing and the thread/API-key registry are not
  uniformly covered by the same critical section. No harness worktree allocator,
  tenant isolation key, or cross-instance filesystem lock was found.
  {C-015 FACT HIGH; S-015,S-016,S-017,S-023,S-034}
- **Unknown:** Exact isolation, network, privilege, filesystem collision, and
  cleanup guarantees depend on the unresolved SWE-ReX artifact/deployment and
  were not executed. {C-033 UNKNOWN N/A; S-004,S-005,S-023,S-034}
- **Evidence:** S-004, S-005, S-015–S-017, S-023, S-034.
- **Boundary / scope:** Thread-level object freshness is harness structure; it is
  not proof of OS/container isolation or race freedom.
- **Unknowns:** C-033.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** `PARTIAL_CONSEQUENTIAL_UNKNOWN`.
- **Claims:** {C-016 FACT MEDIUM; S-019,S-020,S-023,S-024,S-026,S-030,S-034}
  {C-033 UNKNOWN N/A; S-004,S-005,S-023,S-034}
  {C-035 UNKNOWN N/A; S-016,S-019,S-023,S-034}
- **Finding:** The default bash tool renders an arbitrary command string and
  executes it in a persistent SWE-ReX shell. Tool setup can upload bundles,
  source their installers, write root-owned state files, propagate configured
  environment variables, and execute commands; repository adapters can clone,
  upload, reset, clean, and change ownership. The blocklist rejects selected
  interactive/unsupported command prefixes or exact forms, but provides no
  per-action approval, capability grant, path policy, network policy, or shell
  confinement. Opt-in hooks can add local patch or remote GitHub effects.
  {C-016 FACT MEDIUM; S-019,S-020,S-023,S-024,S-026,S-030,S-034}

| Actor | Action | Harness enforcement | Residual authority |
| --- | --- | --- | --- |
| model | issue a declared tool/bash command | parser, one-call rule, prefix/exact blocklist, timeout | selected deployment shell, filesystem, process, network, inherited env |
| tool bundle | install executable/state logic | configured path, duplicate-name checks | uploaded code and `install.sh` run in deployment |
| caller | choose deployment/repo/env/hooks | Pydantic shape checks | deployment credentials, images, Git, provider, local output paths |
| PR hook | commit/push/create draft PR | opt-in and issue-state checks | GitHub token and repository write authority |

- **Unknown:** Exact deployment confinement and dynamic denial/escape behavior
  are unresolved (C-033/C-035). No approval-bypass, symlink/traversal, network-
  denial, or instruction-injection execution was authorized.
- **Evidence:** S-004, S-005, S-016, S-019, S-020, S-023, S-024, S-026, S-030,
  S-034.
- **Boundary / scope:** The blocklist is usability policy, not security
  acceptance. Actual enforcement is delegated to SWE-ReX and its configured
  deployment.
- **Unknowns:** C-033 and C-035.

## 15. Evidence and observability {#evidence-observability}

- **Status:** `PARTIAL`.
- **Claims:** {C-017 FACT MEDIUM; S-016,S-017,S-019,S-026,S-028,S-034}
  {C-036 UNKNOWN N/A; S-017,S-028,S-034}
- **Finding:** Trajectories include exact model query history, responses,
  thoughts, parsed actions, observations, state, execution time, extra info,
  replay config, environment name, model statistics, versions/hashes, exit, and
  submission. Runs also produce configs, logs, predictions, status summaries,
  patches, and optional PR bodies containing truncated trajectories. Source logs
  model inputs, responses, commands, outputs, state, and submissions; tool config
  warns propagated environment values can appear in debug logs. The bounded
  production search found no redaction pipeline, correlation/span protocol,
  artifact signature, or tamper-evident receipt path. {C-017 FACT MEDIUM; S-016,S-017,S-019,S-026,S-028,S-034}
- **Unknown:** Log/trajectory loss, duplicate events, secret-redaction
  completeness, spoof resistance, and sink durability under failure or
  concurrency were not challenged. {C-036 UNKNOWN N/A; S-017,S-028,S-034}
- **Evidence:** S-016, S-017, S-019, S-026, S-028, S-034.
- **Boundary / scope:** Evidence owners are the local output filesystem/Git and
  optional GitHub. Untrusted model/tool/repository text can appear in evidence;
  no claim of confidentiality or forensic integrity is made.
- **Unknowns:** C-036.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** `PARTIAL`.
- **Claims:** {C-018 FACT HIGH; S-016,S-017,S-019}
  {C-036 UNKNOWN N/A; S-017,S-028,S-034}
- **Finding:** Generic model defaults are $3 per instance, unlimited total cost,
  unlimited per-instance calls, 20 API attempts with random exponential 10–120s
  waits, and no query delay. LiteLLM estimates input/output tokens and completion
  cost; after a response it increments instance/global counters, then raises if
  limits are exceeded. Thus one response can overshoot a cost or call limit.
  Total cost uses a lock, but counters are not a reservation ledger. Tool limits
  bound per-command and cumulative observed execution time, not CPU, memory,
  process count, disk, or network. {C-018 FACT HIGH; S-016,S-017,S-019}
- **Unknown:** Retry/cache/provider usage reconciliation, missing or disputed
  cost, interrupted responses, concurrent overshoot, and provider-bill agreement
  were not observed. {C-036 UNKNOWN N/A; S-017,S-028,S-034}
- **Evidence:** S-016, S-017, S-019, S-028, S-034.
- **Boundary / scope:** Accounting is process-local and LiteLLM metadata-
  dependent. Paper-era $4 budget results are separately scoped in C-031 and do
  not describe current defaults.
- **Unknowns:** C-036.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** `PARTIAL`.
- **Claims:** {C-019 FACT HIGH; S-015,S-016,S-017,S-019,S-023}
  {C-032 UNKNOWN N/A; S-015,S-016,S-023}
  {C-036 UNKNOWN N/A; S-017,S-028,S-034}
- **Finding:** Three layers retry: LiteLLM calls default to 20 attempts with
  random exponential waits and a named non-retryable exception set; malformed,
  blocked, policy, or shell-syntax actions default to three model re-queries; and
  optional `RetryAgent` hard-resets the environment between sequential attempts.
  Command timeout tries a shell-session interrupt and exits after configured
  consecutive timeouts. Cost/context/environment/unknown failures can trigger
  patch autosubmission. Batch catches per-instance failures; on interrupt it
  cancels futures not yet running while waiting semantics for active instances
  are only described in code/log text. {C-019 FACT HIGH; S-015,S-016,S-017,S-019,S-023}
- **Unknown:** Cancellation before dispatch, during provider work, or during
  filesystem/process effects; active-worker cleanup; duplicate delivery;
  idempotency; and crash partial state remain unobserved. {C-032 UNKNOWN N/A; S-015,S-016,S-023}
  {C-036 UNKNOWN N/A; S-017,S-028,S-034}
- **Evidence:** S-015–S-017, S-019, S-023, S-028, S-034.
- **Boundary / scope:** Retry ownership is split across harness, LiteLLM/provider,
  and optional reviewer loop. No universal idempotency key or rollback transaction
  spans model, shell, files, Git, and hooks.
- **Unknowns:** C-032 and C-036.

## 18. Install, update, and release {#install-update-release}

- **Status:** `PARTIAL_WITH_SUPPLY_CHAIN_LIMITS`.
- **Claims:** {C-002 FACT HIGH; S-005,S-006,S-008}
  {C-003 FACT HIGH; S-009,S-010}
  {C-020 FACT HIGH; S-004,S-005,S-006,S-007,S-008,S-009,S-029,S-034}
  {C-037 FACT HIGH; S-003}
  {C-038 FACT HIGH; S-006,S-007,S-008,S-034}
- **Finding:** Official docs prefer cloning the repository and running editable
  `pip install`, then advise periodic `git pull`; this is a mutable update channel
  unless an operator pins the commit. The source has one `pyproject.toml`, no
  lock/constraints file, and broad unlocked dependencies including
  `swe-rex>=1.4.0`; `sweagent.__init__` still names SWE-ReX 1.2.0/1.2.1 bounds.
  PyPI's only artifact is historical 0.0.1, not source version 1.1.0.
  {C-020 FACT HIGH; S-003,S-004,S-005,S-009,S-010,S-029,S-034}
- **Finding:** The signed commits improve source-commit provenance, but the
  lightweight tag has no separate tag object, the mutable-target release is not
  immutable and has no assets, and no package signing/attestation/SBOM,
  or reproducible-build procedure was found.
  {C-038 FACT HIGH; S-006,S-007,S-008,S-034}
- **Finding:** A manual 1.0 migration guide documents historical CLI/
  configuration changes, but no automatic migration or rollback mechanism was
  found. {C-020 FACT HIGH; S-004,S-005,S-006,S-007,S-008,S-009,S-029,S-034}
- **Finding:** The pinned README says mini-SWE-agent has superseded SWE-agent
  and recommends the former going forward. {C-037 FACT HIGH; S-003}
- **Evidence:** S-003–S-010, S-029, S-034.
- **Boundary / scope:** No installer or target package was executed. Artifact
  hashes establish downloaded historical bytes, not a current release artifact
  or bit-for-bit rebuild.
- **Unknowns:** Exact fresh dependency resolution and rollback behavior are C-033.

## 19. Tests and qualification {#tests-qualification}

- **Status:** `OBSERVED_OFFICIAL_CI`; local target tests not run.
- **Claims:** {C-021 FACT HIGH; S-031,S-032,S-033,S-036}
- **Finding:** The pinned tree contains 31 Python files under `tests/`, including
  21 `test_*.py` files, and 130 test functions. The official Pytest workflow
  installs editable dev dependencies and runs pytest with coverage and xdist on
  Ubuntu for Python 3.11 and 3.12. Push run `29510763135` at the exact pinned SHA
  completed successfully; both `test (3.11)` and `test (3.12)` jobs succeeded.
  {C-021 FACT HIGH; S-031,S-032,S-033,S-036}
- **Evidence:** S-031–S-033, S-036.
- **Boundary / scope:** The official CI result qualifies its declared test suite
  and environment, not live providers, every SWE-ReX deployment, release
  reproducibility, security confinement, concurrency stress, or benchmark
  performance. Research did not execute package/tests because the system Python
  was below the floor and dependency/package execution was excluded.
- **Unknowns:** Coverage percentage, flakiness, provider matrix, hard-crash
  recovery, and deployment-specific isolation remain unqualified.

## 20. Security {#security}

- **Status:** `PARTIAL_NO_SECURITY_ACCEPTANCE`.
- **Claims:** {C-022 FACT MEDIUM; S-012,S-016,S-017,S-019,S-020,S-023,S-024,S-026,S-034}
  {C-033 UNKNOWN N/A; S-004,S-005,S-023,S-034}
  {C-035 UNKNOWN N/A; S-016,S-019,S-023,S-034}
  {C-036 UNKNOWN N/A; S-017,S-028,S-034}
- **Finding:** Trust crossings include problem/repository/demonstration/tool text
  into model context; prompts/source to providers; model output into parsers and
  shell commands; configured environment values into deployment and logs; GitHub
  tokens into cloning/PR operations; tool bundles/installers into deployment;
  and untrusted observations into trajectories/PR descriptions. Pydantic and
  parser validation constrain shapes, and the project publishes a contact-only
  vulnerability policy, but no harness approval system, production redactor,
  capability confinement, path/network policy, or evidence integrity mechanism
  was found. {C-022 FACT MEDIUM; S-012,S-016,S-017,S-019,S-020,S-023,S-024,S-026,S-034}
- **Unknown:** Dynamic injection, traversal/symlink, denial bypass, secret
  exposure, provider behavior, and deployment escape resistance were not tested.
  {C-033 UNKNOWN N/A; S-004,S-005,S-023,S-034}
  {C-035 UNKNOWN N/A; S-016,S-019,S-023,S-034}
  {C-036 UNKNOWN N/A; S-017,S-028,S-034}
- **Evidence:** S-004, S-005, S-012, S-016, S-017, S-019, S-020, S-023, S-024,
  S-026, S-028, S-034.
- **Boundary / scope:** Static controls are not runtime security proof. No
  advisory/CVE enumeration or exploitation occurred; this dossier grants no
  security acceptance.
- **Unknowns:** C-033, C-035, and C-036.

## 21. Strengths {#strengths}

- **Status:** `INTERPRETATION`; research comparison input only.
- **Claims:** {C-023 INFERENCE HIGH; S-016,S-019,S-024,S-028,S-035}
  {C-024 INFERENCE HIGH; S-015,S-016,S-017,S-023}
- **Finding:** The loop is unusually explicit and inspectable: message
  construction, history transformation, tool schema/parsing, action execution,
  observation feedback, submission, and trajectory serialization have named
  seams. The paper's ACI principles triangulate why concise actions, feedback,
  history management, and guardrails were selected, but paper-era performance is
  not generalized to current HEAD. {C-023 INFERENCE HIGH; S-016,S-019,S-024,S-028,S-035}
- **Finding:** Deep-copied agent/tool/model configuration, a newly constructed
  environment per batch instance, thread-scoped outputs, and hard reset between
  retry attempts reduce accidental in-process state reuse compared with sharing
  one mutable agent/environment object. This does not establish OS isolation.
  {C-024 INFERENCE HIGH; S-015,S-016,S-017,S-023}
- **Evidence:** S-015–S-019, S-023, S-024, S-028, S-035.
- **Boundary / scope:** Strengths concern inspectability and object lifecycle at
  the pinned source, not comparative productivity, benchmark validity, or
  unattended operational fitness.
- **Unknowns:** Runtime reliability and isolation were not independently measured.

## 22. Liabilities {#liabilities}

- **Status:** `INTERPRETATION`.
- **Claims:** {C-025 INFERENCE HIGH; S-019,S-020,S-023,S-034}
  {C-026 INFERENCE HIGH; S-002,S-003,S-004,S-006,S-009,S-029,S-034}
- **Finding:** Triggered by untrusted repositories or unattended/multi-tenant use,
  arbitrary shell commands, installable bundles, propagated environment values,
  and optional Git/PR hooks place substantial responsibility on an external
  execution, approval, credential, and network boundary. Consequence: model-
  influenced actions can exercise the selected deployment's filesystem,
  process, network, and secret authority; the blocklist does not mitigate that
  class of risk. {C-025 INFERENCE HIGH; S-019,S-020,S-023,S-034}
- **Finding:** Triggered by audited/pinned deployment, source version/tag/release/
  package divergence, mutable source updates, unlocked dependencies, stale
  SWE-ReX constants, absent current artifacts/attestations/rollback, and a
  superseding project increase reproducibility and lifecycle burden. Mitigation
  requires operator pinning and external artifact/deployment governance not
  supplied end-to-end here. {C-026 INFERENCE HIGH; S-002,S-003,S-004,S-005,S-006,S-009,S-029,S-034}
- **Evidence:** S-002–S-006, S-009, S-019, S-020, S-023, S-029, S-034.
- **Boundary / scope:** These are scenario-bounded constraints, not a rejection
  of SWE-agent for research experimentation.
- **Unknowns:** External controls may mitigate them but were not target evidence.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** `INTERPRETATION`; candidates only, no design authority.
- **Claims:** {C-027 INFERENCE HIGH; S-016,S-024,S-028}
  {C-028 INFERENCE MEDIUM; S-018,S-019,S-020,S-021}
- **Finding / `CANDIDATE`: action/observation evidence envelope.** Problem:
  debugging an agent turn requires both what the model saw and what happened.
  Minimal mechanism: persist ordered query, raw response, parsed thought/action,
  observation, extracted state, execution time, result, and version/config
  identity after every step. Prerequisites are redaction, stable schemas,
  correlation IDs, atomic writes, and retention controls not complete here.
  Preserve the distinction between untrusted content and authority. Adaptation
  cost is medium. {C-027 INFERENCE HIGH; S-016,S-024,S-028}
- **Finding / `CONDITIONAL`: schema-to-command bundle boundary.** Problem: expose
  concise model-facing tools while retaining executable adapters. Minimal
  mechanism: declarative command schema → strict one-call parser → quoting/render
  → state feedback, with duplicate-name checks and bundle lifecycle. Prerequisites
  are independently enforced authorization/sandboxing, signed bundles, no
  implicit installers, versioning, output schemas, and denial tests. Without
  those prerequisites, shell rendering remains high risk. {C-028 INFERENCE MEDIUM; S-018,S-019,S-020,S-021}
- **Evidence:** S-016, S-018–S-021, S-024, S-028.
- **Boundary / scope:** `CANDIDATE`/`CONDITIONAL` mean worthy of separate
  evaluation; neither is adopted, selected, approved, or designed here.
- **Unknowns:** Fit with accepted Curiosity ADRs belongs to authorized synthesis.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** `INTERPRETATION`; snapshot/scenario-bounded rejections.
- **Claims:** {C-029 INFERENCE HIGH; S-019,S-020,S-023,S-034}
  {C-030 INFERENCE HIGH; S-014,S-016,S-024,S-028}
  {C-031 FACT HIGH; S-028,S-035}
- **Finding / `CURIOSITY_NO_GO`: blocklisted host-authority shell as a security
  tool boundary.** The mechanism rejects selected command strings but then
  executes arbitrary accepted shell text with deployment authority. Transferring
  it as an approval or confinement mechanism would violate process/filesystem/
  network/credential boundaries; failure mode is false assurance. Reopen only
  with independently enforced capabilities, containment, approvals, timeouts,
  cancellation, and receipts. {C-029 INFERENCE HIGH; S-019,S-020,S-023,S-034}
- **Finding / `CURIOSITY_NO_GO`: trajectory action replay as deterministic restart
  or audit reproduction.** Replay re-executes selected recorded actions in a new
  environment and does not restore original state, observations, provider
  responses, timing, or side-effect identities. Using it as recovery can duplicate
  effects; using it as proof can produce a different record. Reopen with immutable
  snapshots, effect IDs, observation/provider capture, and explicit replay policy.
  {C-030 INFERENCE HIGH; S-014,S-016,S-024,S-028}
- **Finding:** SWE-bench is an optional instance/evaluation integration and the
  paper is a historical ACI/model experiment using GPT-4 Turbo
  `gpt-4-1106-preview`, Claude 3 Opus, and a $4 per-instance budget; neither is the
  current harness itself nor general current-HEAD qualification.
  {C-031 FACT HIGH; S-028,S-035}
- **Rejected research threads:**
  - broad repository/web rediscovery — `CURIOSITY_NO_GO`: duplicate saturation;
  - paid benchmarks or current-provider reproduction — `CURIOSITY_NO_GO`: cost,
    credentials, and model/provider confounding; C-031/C-036;
  - live providers, packages, installers, SWE-ReX, or containers —
    `CURIOSITY_NO_GO`: outside static authority and safe isolation; C-033/C-036;
  - GUI/browser exercise, including advertised `run-api` — `CURIOSITY_NO_GO`:
    repository import is missing and external artifact is unknown; C-034;
  - fuzzing, stress, filesystem escape, injection, or denial bypass —
    `CURIOSITY_NO_GO`: no authorized disposable target runtime; C-035;
  - popularity/social/community narratives — `CURIOSITY_NO_GO`: no material
    architecture relevance once primary evidence saturated;
  - exhaustive transitive license/CVE or dependency archaeology —
    `CURIOSITY_NO_GO`: outside bounded harness decision and unlocked resolution
    is already explicit; C-004/C-033.
- **Evidence:** S-014, S-016, S-019, S-020, S-023, S-024, S-028, S-034, S-035.
- **Boundary / scope:** Rejections concern direct pattern transfer or research
  thread value, not project use in its documented research context.
- **Unknowns:** Reopen conditions are named above; no rejected thread was pursued.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** `COMPLETE_WITH_UNKNOWNS`; static/API/artifact probes only.
- **Claims:** {C-001 FACT HIGH; S-001,S-002} {C-003 FACT HIGH; S-009,S-010}
  {C-006 FACT HIGH; S-004,S-013,S-014,S-015,S-024,S-034}
  {C-010 FACT HIGH; S-019,S-020,S-021,S-022,S-030}
  {C-014 FACT HIGH; S-014,S-015,S-016,S-024,S-028}
  {C-015 FACT HIGH; S-015,S-016,S-017,S-023,S-034}
  {C-016 FACT MEDIUM; S-019,S-020,S-023,S-024,S-026,S-030,S-034}
  {C-017 FACT MEDIUM; S-016,S-017,S-019,S-026,S-028,S-034}
  {C-018 FACT HIGH; S-016,S-017,S-019}
  {C-019 FACT HIGH; S-015,S-016,S-017,S-019,S-023}
  {C-020 FACT HIGH; S-004,S-005,S-006,S-007,S-008,S-009,S-029,S-034}
  {C-032 UNKNOWN N/A; S-015,S-016,S-023}
  {C-033 UNKNOWN N/A; S-004,S-005,S-023,S-034}
  {C-035 UNKNOWN N/A; S-016,S-019,S-023,S-034}
  {C-036 UNKNOWN N/A; S-017,S-028,S-034}
- **Probe policy:** Expected safe behavior was declared before challenge. No
  target package, provider, container, shell, benchmark, or installer executed;
  skipped unsafe dynamics remain UNKNOWN rather than passes.

| Probe | Expected safe behavior | Result | Actual bounded observation | Environment | Claim IDs | Source IDs |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 Startup/no-op | no undeclared writes, process, network, telemetry, or credential read | `NOT_RUN_UNSAFE` | Static startup reaches deployment, repo reset, tool upload/install/state, env and output setup; no startup executed | macOS 27 arm64; static clone; no secrets | C-035 | S-014,S-016,S-019,S-023,S-034 |
| P-02 Permission denial/bypass | denied capability remains denied across alternate parser/tool/hook paths | `INCONCLUSIVE` | Prefix/exact blocklist is executable code, but bash, bundles, repo and hooks retain broad authority; no denial matrix ran | static source trace | C-016,C-035 | S-019,S-020,S-023,S-026,S-034 |
| P-03 Malformed/oversized input | reject malformed schemas before effects; bound oversized data | `INCONCLUSIVE` | Function parser validates one call/name/JSON/required/extra args; observation truncation exists; wrong-type/oversize matrix not run | static source trace | C-010,C-013,C-035 | S-016,S-018,S-019,S-020,S-021 |
| P-04 Cancellation/timeout | cancel before dispatch/during provider/during effect; clean active resources | `NOT_RUN_UNSAFE` | Timeout interruption, KeyboardInterrupt and future cancellation paths traced; active cleanup/provider cancellation unresolved | no provider/process execution | C-019,C-032 | S-015,S-016,S-017,S-023 |
| P-05 Retry/duplication/partial failure | bounded retry with dedupe, idempotency, cost/effect attribution | `NOT_RUN_UNSAFE` | Three retry layers traced; no universal idempotency/effect ID and no transient fault injected | static; no paid/provider fault | C-018,C-019,C-036 | S-016,S-017,S-024,S-034 |
| P-06 Concurrency/isolation collision | two colliding sessions do not bleed state/files/credentials | `INCONCLUSIVE` | Fresh per-instance objects/outputs and cost lock exist; no worktree/tenant lock; SWE-ReX isolation unresolved | static named universe | C-015,C-033 | S-015,S-016,S-017,S-023,S-034 |
| P-07 Crash/restart | explicit recoverable frontier without unsafe effect replay | `NOT_RUN_UNSAFE` | Full trajectory rewrites and action re-execution traced; no hard interruption/store corruption test | no disposable target runtime | C-014,C-032,C-033 | S-016,S-024,S-028 |
| P-08 Provider/network unavailable | preserve auth/rate/malformed/interrupt cause; bounded fallback/retry | `NOT_RUN_UNSAFE` | Adapter exception/retry/fallback paths traced; no network/provider simulation | credentials absent; target network unused | C-011,C-012,C-036 | S-017,S-034 |
| P-09 Instruction injection | repository/tool/provider text remains data and cannot grant authority | `NOT_RUN_UNSAFE` | Role/template separation exists, but untrusted text shares model context and command authority is external; no efficacy test | static; exploitation unauthorized | C-013,C-016,C-035 | S-016,S-018,S-019,S-023 |
| P-10 Filesystem abuse | traversal/absolute/symlink/case attacks stay within disposable root | `NOT_RUN_UNSAFE` | Harness passes paths/commands to deployment and repo adapters; deployment-specific canonicalization not in scope | no target writes/container | C-016,C-033,C-035 | S-019,S-023,S-024,S-034 |
| P-11 Resource/cost disagreement | reconcile estimates, retries/cache, provider totals; fail before excess | `NOT_RUN_UNSAFE` | Post-response enforcement permits one-response overshoot; no provider bill or concurrent race observation | static; no paid provider | C-018,C-036 | S-017,S-034 |
| P-12 Install pin/rollback | immutable source/artifacts resolve without scripts; rollback documented | `INCONCLUSIVE` | Source commit and historical artifacts hash reproducibly, but preferred install/update is mutable/unlocked and no current rollback artifact exists | Git/HTTPS metadata only; no install | C-001,C-003,C-020 | S-001,S-006,S-009,S-010,S-029,S-034 |
| P-13 Claimed absence/disabled | two-method bounded search challenges aliases/config/alternate entrypoint | `PASS` | Path inventory plus content/import search found advertised `run-api` import but no `sweagent/api` tree or alternate package entry | deterministic static search | C-006 | S-013,S-034 |
| P-14 Evidence loss/forgery | denied/failed/cancelled action remains correlated, redacted, tamper-evident | `NOT_RUN_UNSAFE` | Rich local evidence fields exist; no redactor/correlation/signature path found and no failure injected | static; no remote sink | C-017,C-036 | S-016,S-026,S-028,S-034 |

- **Evidence:** S-001, S-006, S-009, S-010, S-013–S-024, S-026, S-028,
  S-029, S-034.
- **Boundary / scope:** `PASS` means only the stated repository-bounded
  expectation matched; no row is a security pass.
- **Unknowns:** C-032, C-033, C-035, and C-036 consolidate skipped dynamics;
  C-034 separately records the external `run-api` possibility.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "At the cutoff, the reviewed official SWE-agent repository snapshot is clean main commit 3ea751c087f32b16e039a2233dd6eefecef325d5 with 409 tracked files and no declared submodules."
  classification: FACT
  confidence: HIGH
  scope: "SWE-agent/SWE-agent Git snapshot; excludes dependencies and external artifacts"
  source_ids: [S-001, S-002]
  fact_dependencies: []
  method: "Resolved origin/main, commit date, remote, status, tracked count and .gitmodules state in the clean research clone; compared official repository metadata."
  counterevidence: "none found in exact Git state and official repository metadata"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "Pinned source reports version 1.1.0 even though v1.1.0 resolves 177 commits earlier, and the corresponding non-immutable GitHub Release targets main and has no assets."
  classification: FACT
  confidence: HIGH
  scope: "Pinned source, exact tag ref, Git history and official release object observed 2026-08-24"
  source_ids: [S-005, S-006, S-008]
  fact_dependencies: []
  method: "Read source version, resolved tag commit/distance, and inspected official release metadata."
  counterevidence: "the tag commit is signed, but this does not remove source/tag/release distance or create release assets"
  adversarial_status: CHALLENGED
- claim_id: C-003
  section: identity-snapshot
  statement: "PyPI exposes only historical sweagent 0.0.1 with the recorded wheel and sdist SHA-256 digests, while current source requires Python 3.11 and is not represented by those package bytes."
  classification: FACT
  confidence: HIGH
  scope: "Official PyPI project metadata/artifacts and pinned current pyproject; no package execution"
  source_ids: [S-004, S-009, S-010]
  fact_dependencies: []
  method: "Inspected PyPI releases/URLs, independently hashed and listed the wheel, and compared package/current metadata."
  counterevidence: "historical wheel is official but has version 0.0.1, Python >=3.9 and obsolete contents"
  adversarial_status: SUPPORTED
- claim_id: C-004
  section: provenance-license
  statement: "The official non-fork repository, pinned project metadata, repository license and historical wheel identify SWE-agent's top-level license as MIT and name its research maintainers/origins."
  classification: FACT
  confidence: HIGH
  scope: "Top-level project and historical package; excludes dependencies, services, data and trademarks"
  source_ids: [S-002, S-003, S-004, S-010, S-011]
  fact_dependencies: []
  method: "Compared official repository metadata, authorship statements, actual license text, project metadata and wheel metadata/license."
  counterevidence: "none found for the bounded top-level license; dependency obligations remain outside scope"
  adversarial_status: NOT_APPLICABLE:no-runtime-claim
- claim_id: C-005
  section: repository-package-map
  statement: "The pinned runtime is organized into run, agent, tools, environment, inspector and utility modules plus runtime config/tool bundles, while tests/docs/workflows/assets are supporting surfaces."
  classification: FACT
  confidence: HIGH
  scope: "Pinned 409-file repository tree and traced console composition path"
  source_ids: [S-001, S-004, S-013, S-016, S-019, S-023]
  fact_dependencies: []
  method: "Mapped tracked top-level paths, build discovery, imports and representative composition responsibilities."
  counterevidence: "some docs/tests/trajectories are packaged or runtime-readable, but they do not own the main production loop"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: executable-entrypoints
  statement: "SWE-agent exposes console/module CLI commands for single, batch, shell, replay, inspection and utilities, while advertised run-api imports a sweagent.api.server module absent from the pinned tree."
  classification: FACT
  confidence: HIGH
  scope: "Pinned source/build entrypoints; repository-bounded absence only; startup not executed"
  source_ids: [S-004, S-013, S-014, S-015, S-024, S-034]
  fact_dependencies: []
  method: "Traced pyproject and __main__/run dispatcher to controllers; used path inventory and reference search for sweagent.api."
  counterevidence: "an external artifact could supply the module, represented separately by C-034"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: control-data-flow
  statement: "The static main path is a synchronous loop from run controller through environment setup, processed model context, action parsing/filtering, SWE-ReX shell execution, observation/state capture, trajectory persistence and submission/termination."
  classification: FACT
  confidence: HIGH
  scope: "Pinned RunSingle/DefaultAgent/LiteLLM/tool/SWEEnv production path; runtime outcomes excluded"
  source_ids: [S-014, S-016, S-017, S-019, S-021, S-022, S-023, S-028]
  fact_dependencies: []
  method: "Traced one representative request from RunSingle.run through DefaultAgent.run/step/forward/handle_action and back to files/hooks."
  counterevidence: "batch adds thread scheduling and retry agent adds sequential attempts, but each attempt retains this loop"
  adversarial_status: SUPPORTED
- claim_id: C-008
  section: module-extension-boundaries
  statement: "SWE-agent extension uses in-process Pydantic/config unions, ordered history processors, tool bundles and synchronous hooks without general version negotiation or hot unload."
  classification: FACT
  confidence: HIGH
  scope: "Pinned built-in config, bundle and hook interfaces; third-party monkey-patching excluded"
  source_ids: [S-016, S-018, S-019, S-025, S-026, S-027, S-030]
  fact_dependencies: []
  method: "Inspected config discriminators, processor chaining, bundle loading and combined hook dispatch; traced opt-in PR hook authority."
  counterevidence: "Python applications can subclass or inject objects, but no declared compatibility/version/unload protocol was found"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: agent-interface
  statement: "DefaultAgent owns one named synchronous loop, while RetryAgent sequentially creates fresh attempts and hard-resets one environment rather than scheduling delegated child agents."
  classification: FACT
  confidence: HIGH
  scope: "Pinned agent/run/replay production universe; external orchestration excluded"
  source_ids: [S-016, S-017, S-024, S-034]
  fact_dependencies: []
  method: "Traced agent config dispatch, default and retry run loops, environment reset, result type and bounded delegation/subagent search."
  counterevidence: "reviewer/action-sampler model calls add model roles but not parent-child agent authority"
  adversarial_status: SUPPORTED
- claim_id: C-010
  section: tool-interface
  statement: "Tools are declarative command schemas and uploaded bundles parsed into one shell action, with function/JSON/text validation, selected command filtering, timeout and state feedback but no per-action approval."
  classification: FACT
  confidence: HIGH
  scope: "Pinned tool/command/parser/config path; bundle executable semantics sampled, not exhaustively audited"
  source_ids: [S-019, S-020, S-021, S-022, S-030]
  fact_dependencies: []
  method: "Inspected Command schema conversion, parser validation, ToolConfig/ToolHandler install/filter/state and shell dispatch integration."
  counterevidence: "schema and blocklist checks constrain form, not deployment authority"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: provider-interface
  statement: "SWE-agent delegates provider transport and broad registry behavior to unlocked LiteLLM while supplying credentials, request parameters, fallbacks, tools, headers and selected exception mapping."
  classification: FACT
  confidence: HIGH
  scope: "Pinned SWE-agent adapter and dependency declaration; LiteLLM/provider runtime excluded"
  source_ids: [S-004, S-017]
  fact_dependencies: []
  method: "Traced GenericAPIModelConfig and LiteLLMModel request/response path against pyproject dependency constraints."
  counterevidence: "provider and LiteLLM internals may add retries, telemetry or adaptation below this boundary"
  adversarial_status: NOT_PROBED
- claim_id: C-012
  section: model-interface
  statement: "The model interface supports generic API, human, replay and instant-submit models with configurable sampling, fallbacks, token overrides, cost/call limits and optional function calls, but its LiteLLM path is non-streaming."
  classification: FACT
  confidence: HIGH
  scope: "Pinned model/config/parser source; live model correctness excluded"
  source_ids: [S-017, S-019, S-021]
  fact_dependencies: []
  method: "Inspected model config union, LiteLLM completion kwargs/response shaping and parser coupling."
  counterevidence: "thinking blocks and tool calls are represented, but no streaming completion invocation is present"
  adversarial_status: SUPPORTED
- claim_id: C-013
  section: context-interface
  statement: "SWE-agent builds context from templates, problem data, demonstrations, tool docs, state and prior turns, then chains configurable processors and separately bounds observation characters and estimated model input tokens."
  classification: FACT
  confidence: HIGH
  scope: "Pinned DefaultAgent, history processors, model adapter and default config"
  source_ids: [S-016, S-017, S-018, S-030]
  fact_dependencies: []
  method: "Traced setup/history append, messages processor chain, observation templating/truncation and LiteLLM message/token conversion."
  counterevidence: "message roles/templates identify provenance but do not enforce an authority boundary"
  adversarial_status: SUPPORTED
- claim_id: C-014
  section: state-persistence-restart
  statement: "Runs rewrite trajectory/config/log/prediction artifacts to local files, and replay re-executes recorded assistant actions in a new environment rather than restoring original runtime state or observations."
  classification: FACT
  confidence: HIGH
  scope: "Pinned single/batch/default/replay paths and official trajectory schema documentation"
  source_ids: [S-014, S-015, S-016, S-024, S-028]
  fact_dependencies: []
  method: "Enumerated durable write sites and compared trajectory data with RunReplay action extraction/new RunSingle construction."
  counterevidence: "replay config preserves selected configuration, but not full external/provider/deployment state"
  adversarial_status: SUPPORTED
- claim_id: C-015
  section: concurrency-worktree-isolation
  statement: "Batch defaults to one worker and uses threads with fresh per-instance agent/environment objects and instance output paths, while only selected global model statistics are locked and no harness worktree/tenant lock is present."
  classification: FACT
  confidence: HIGH
  scope: "Pinned RunBatch/agent/model/SWEEnv and bounded production search; SWE-ReX internals excluded"
  source_ids: [S-015, S-016, S-017, S-023, S-034]
  fact_dependencies: []
  method: "Traced worker construction/deep copies/environment creation/global registries and searched worktree/tenant/lock terms."
  counterevidence: "SWE-ReX, OS, Git or storage layers may add locks/isolation outside the harness"
  adversarial_status: CHALLENGED
- claim_id: C-016
  section: permissions-authority-sandbox
  statement: "Accepted model commands, bundle installers, repository operations and opt-in hooks execute with selected deployment/caller authority; the harness blocklist is not an approval, path, network or confinement boundary."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned static authority path; actual SWE-ReX deployment enforcement and dynamic bypass excluded"
  source_ids: [S-019, S-020, S-023, S-024, S-026, S-030, S-034]
  fact_dependencies: []
  method: "Traced built-in bash schema through filter and SWEEnv, plus bundle install, repo reset/copy and PR hook; challenged approval/sandbox terms in bounded search."
  counterevidence: "configured SWE-ReX deployments may enforce external controls not present in this source"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: evidence-observability
  statement: "SWE-agent records rich query/response/action/observation/state/config/version/cost artifacts and logs, but the bounded production path contains no general redactor, correlation/span protocol, artifact signature or tamper-evident receipt."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned trajectory/log/hook production sources and bounded static search; sink runtime excluded"
  source_ids: [S-016, S-017, S-019, S-026, S-028, S-034]
  fact_dependencies: []
  method: "Enumerated trajectory/log/config/prediction/patch/PR fields and performed path/content searches for redaction, correlation and signing mechanisms."
  counterevidence: "SecretStr masks config representation and external sinks may add controls, but no end-to-end production mechanism was found"
  adversarial_status: CHALLENGED
- claim_id: C-018
  section: resource-token-cost-accounting
  statement: "SWE-agent estimates tokens/cost, updates counters after a completion, then enforces configured cost/call limits, allowing one-response overshoot; tool timeouts do not impose CPU, memory, process, disk or network quotas."
  classification: FACT
  confidence: HIGH
  scope: "Pinned model/agent/tool/default configuration; provider billing truth excluded"
  source_ids: [S-016, S-017, S-019]
  fact_dependencies: []
  method: "Traced default limits, token/cost calculation, _update_stats order, locks and tool time accounting."
  counterevidence: "provider/deployment may impose external quotas not represented by harness accounting"
  adversarial_status: SUPPORTED
- claim_id: C-019
  section: failure-cancellation-retry
  statement: "SWE-agent layers default 20-attempt model retry, three action re-queries and optional hard-reset retry attempts, while timeout interruption and batch future cancellation do not form a universal cancellation/idempotency protocol."
  classification: FACT
  confidence: HIGH
  scope: "Pinned model/default/retry/batch/tool/environment paths; dynamic cleanup excluded"
  source_ids: [S-015, S-016, S-017, S-019, S-023]
  fact_dependencies: []
  method: "Traced RetryConfig/Tenacity, forward_with_handling, RetryAgent, timeout interrupt and batch interrupt paths."
  counterevidence: "underlying providers/deployments may implement additional cancellation or retry behavior"
  adversarial_status: CHALLENGED
- claim_id: C-020
  section: install-update-release
  statement: "Preferred current installation is mutable editable source with unlocked dependencies and no lockfile/current package artifact, package attestation, SBOM, reproducible-build or automatic rollback procedure; only a manual historical 1.0 migration guide was found."
  classification: FACT
  confidence: HIGH
  scope: "Pinned source/docs/build/release/PyPI and bounded file/content search; external operator tooling excluded"
  source_ids: [S-004, S-005, S-006, S-007, S-008, S-009, S-029, S-034]
  fact_dependencies: []
  method: "Compared source-install and manual 1.0 migration docs, dependency/version constants, PyPI/release/commit metadata and two-method bounded path/content searches."
  counterevidence: "source commits are signed, but no current built release asset or end-to-end artifact provenance is supplied"
  adversarial_status: CHALLENGED
- claim_id: C-021
  section: tests-qualification
  statement: "The pinned tree contains 31 Python test files and 130 test functions, and official exact-SHA CI run 29510763135 succeeded for Python 3.11 and 3.12 jobs."
  classification: FACT
  confidence: HIGH
  scope: "Pinned repository static inventory and official GitHub Actions metadata; local test execution excluded"
  source_ids: [S-031, S-032, S-033, S-036]
  fact_dependencies: []
  method: "Counted Python test files/functions, inspected workflow command/matrix and retrieved exact run/jobs metadata."
  counterevidence: "passing CI does not qualify live providers, every deployment, benchmark accuracy or security isolation"
  adversarial_status: SUPPORTED
- claim_id: C-022
  section: security
  statement: "The pinned harness validates configuration/action shapes and publishes vulnerability contacts, but model-influenced shell, bundle, provider, repository, credential and evidence trust crossings lack an in-harness approval/confinement/redaction/integrity layer."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned static trust boundaries and bounded production search; no exploitation or advisory census"
  source_ids: [S-012, S-016, S-017, S-019, S-020, S-023, S-024, S-026, S-034]
  fact_dependencies: []
  method: "Mapped trust/authority crossings, inspected validation/contact controls and challenged security mechanism terms across production/build/workflows."
  counterevidence: "external SWE-ReX/provider/OS/GitHub controls may mitigate risks outside the harness"
  adversarial_status: CHALLENGED
- claim_id: C-023
  section: strengths
  statement: "The explicit message/history/tool/action/observation/trajectory seams make the pinned SWE-agent loop highly inspectable for ACI research."
  classification: INFERENCE
  confidence: HIGH
  scope: "Inspectability for research at pinned source; excludes runtime fitness and current benchmark performance"
  source_ids: [S-016, S-019, S-024, S-028, S-035]
  fact_dependencies: [C-007, C-010, C-013, C-014]
  method: "Reasoning chain: named static seams plus complete turn evidence expose the ACI transformations that the paper motivates; assumption=source remains representative when run; alternative=runtime adapters obscure behavior."
  counterevidence: "SWE-ReX/LiteLLM internals and runtime effects remain outside direct inspection"
  adversarial_status: SUPPORTED
- claim_id: C-024
  section: strengths
  statement: "Fresh per-instance objects/outputs and hard-reset retry attempts reduce accidental in-process state reuse relative to sharing one mutable agent/environment."
  classification: INFERENCE
  confidence: HIGH
  scope: "Object lifecycle and local paths only; no OS/tenant isolation claim"
  source_ids: [S-015, S-016, S-017, S-023]
  fact_dependencies: [C-009, C-015]
  method: "Reasoning chain: deep copies and fresh constructors avoid direct shared references; assumption=constructors are honored; alternative=process globals/external stores still collide."
  counterevidence: "global registries and deployment internals can remain shared"
  adversarial_status: CHALLENGED
- claim_id: C-025
  section: liabilities
  statement: "Untrusted or unattended use transfers substantial confinement, approval, credential and network responsibility to an external layer because accepted shell and bundle actions inherit deployment authority."
  classification: INFERENCE
  confidence: HIGH
  scope: "Untrusted-repository, unattended or multi-tenant scenarios; not ordinary isolated research use"
  source_ids: [S-019, S-020, S-023, S-034]
  fact_dependencies: [C-010, C-016, C-022]
  method: "Reasoning chain: broad executable authority plus no in-harness approval/confinement means an external boundary must carry those controls; alternative=selected SWE-ReX deployment supplies all controls."
  counterevidence: "deployment-specific enforcement could mitigate the liability but is C-033"
  adversarial_status: SUPPORTED
- claim_id: C-026
  section: liabilities
  statement: "Source/tag/release/package divergence, mutable unlocked installation, absent current artifacts/rollback and a declared successor increase lifecycle and reproducibility burden for audited deployment."
  classification: INFERENCE
  confidence: HIGH
  scope: "Audited/pinned deployment scenario at cutoff; not a claim about research usability"
  source_ids: [S-002, S-003, S-004, S-006, S-009, S-029, S-034]
  fact_dependencies: [C-002, C-003, C-020, C-037, C-038]
  method: "Reasoning chain: multiple non-equivalent identities and missing artifact lifecycle controls require operator governance; alternative=downstream packaging fully freezes and maintains the stack."
  counterevidence: "signed commits improve source identity but do not eliminate package/dependency/update burden"
  adversarial_status: SUPPORTED
- claim_id: C-027
  section: transferable-patterns
  statement: "A per-step envelope containing exact query, raw response, parsed action, observation, state, timing, result and version/config identity is a candidate debugging evidence pattern when redaction and integrity prerequisites are added."
  classification: INFERENCE
  confidence: HIGH
  scope: "Pattern research only; no direct reuse or approval"
  source_ids: [S-016, S-024, S-028]
  fact_dependencies: [C-007, C-014, C-017]
  method: "Reasoning chain: co-located pre/post-turn fields aid causal debugging; assumption=fields are correlated accurately; alternative=event-based receipts may be superior."
  counterevidence: "current artifacts lack full redaction, correlation and tamper resistance"
  adversarial_status: SUPPORTED
- claim_id: C-028
  section: transferable-patterns
  statement: "Declarative command schemas feeding a strict one-call parser and state feedback are a conditional tool-boundary pattern only with independent authorization, sandboxing, signed/versioned bundles and denial tests."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Pattern research only; excludes current shell authority mechanism"
  source_ids: [S-018, S-019, S-020, S-021]
  fact_dependencies: [C-008, C-010, C-013]
  method: "Reasoning chain: schema/parser/state seams simplify model interaction; assumption=external enforcement blocks unsafe effects; alternative=typed RPC avoids shell rendering."
  counterevidence: "current built-in bash tool and bundle installers bypass any claim of schema-level confinement"
  adversarial_status: CHALLENGED
- claim_id: C-029
  section: rejected-patterns-curiosity-no-go
  statement: "A command-string blocklist followed by deployment-authority shell execution is not transferable as a security or approval boundary."
  classification: INFERENCE
  confidence: HIGH
  scope: "Direct transfer into security-sensitive autonomous/multi-tenant harnesses"
  source_ids: [S-019, S-020, S-023, S-034]
  fact_dependencies: [C-016, C-022]
  method: "Reasoning chain: enumerating disallowed strings cannot constrain the authority of accepted general shell commands; alternative=OS capability boundary with explicit grants."
  counterevidence: "none found that turns the inspected blocklist into confinement"
  adversarial_status: SUPPORTED
- claim_id: C-030
  section: rejected-patterns-curiosity-no-go
  statement: "SWE-agent action replay is not transferable as deterministic restart or audit reproduction because it re-executes effects without restoring the original environment/provider state and observations."
  classification: INFERENCE
  confidence: HIGH
  scope: "Recovery/audit use of pinned replay path; demo/debug action re-execution remains valid"
  source_ids: [S-014, S-016, S-024, S-028]
  fact_dependencies: [C-014]
  method: "Reasoning chain: replay inputs recorded actions into a new RunSingle, so external nondeterminism and duplicate effects remain; alternative=immutable snapshots plus effect IDs."
  counterevidence: "replay config and actions preserve part of the experiment but not deterministic state"
  adversarial_status: SUPPORTED
- claim_id: C-031
  section: rejected-patterns-curiosity-no-go
  statement: "SWE-bench is an optional input/evaluation integration, while the v3 paper evaluates a historical ACI with gpt-4-1106-preview, Claude 3 Opus and a $4 per-instance budget rather than qualifying current HEAD generally."
  classification: FACT
  confidence: HIGH
  scope: "Pinned current docs/source and arXiv 2405.15793v3; no benchmark reproduction"
  source_ids: [S-028, S-035]
  fact_dependencies: []
  method: "Compared current batch/output boundary with versioned paper experimental setup and models/budget."
  counterevidence: "paper establishes historical ACI evidence, not current release equivalence"
  adversarial_status: SUPPORTED
- claim_id: C-032
  section: failure-cancellation-retry
  statement: "Cancellation and cleanup semantics beyond command interruption, KeyboardInterrupt/EOFError and cancellation of not-yet-running batch futures are unresolved."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned harness plus unspecified SWE-ReX/provider; before/during dispatch, streaming and side effects"
  source_ids: [S-015, S-016, S-023]
  fact_dependencies: []
  method: "attempted_methods=static trace of batch interrupt, agent exception and SWEEnv interrupt/close paths; blocker=no authorized disposable target runtime/provider and lower-layer behavior is external; impact=cannot compare cleanup, partial effects or cancellation latency; available_evidence=S-015,S-016,S-023; next_probe=inject cancellation before dispatch, during provider work and during a reversible side effect in a pinned disposable deployment"
  counterevidence: "static paths show partial mechanisms but not complete runtime semantics"
  adversarial_status: NOT_PROBED
- claim_id: C-033
  section: concurrency-worktree-isolation
  statement: "The exact SWE-ReX artifact resolved by source installation and deployment-specific filesystem, network, privilege, isolation and cleanup guarantees are unresolved."
  classification: UNKNOWN
  confidence: N/A
  scope: "Current source dependency swe-rex>=1.4.0 and all selectable deployments; SWE-ReX internals excluded"
  source_ids: [S-004, S-005, S-023, S-034]
  fact_dependencies: []
  method: "attempted_methods=compared unlocked dependency, stale source constants, environment adapter and bounded isolation search; blocker=no lockfile/resolved environment and target package/container execution prohibited; impact=confinement, collision and reproducibility cannot be compared end-to-end; available_evidence=S-004,S-005,S-023,S-034; next_probe=freeze exact SWE-ReX wheel/image digests and run denial/collision/cleanup probes in an authorized least-privilege sandbox"
  counterevidence: "documentation describes Docker default, but documentation is not deployment enforcement proof"
  adversarial_status: NOT_PROBED
- claim_id: C-034
  section: executable-entrypoints
  statement: "Whether a separately distributed artifact intentionally supplies the missing sweagent.api.server imported by run-api is unresolved."
  classification: UNKNOWN
  confidence: N/A
  scope: "Advertised run-api at pinned source; official external artifacts not exhaustively enumerated"
  source_ids: [S-013, S-034]
  fact_dependencies: []
  method: "attempted_methods=path inventory and reference/entrypoint search across all 409 tracked files; blocker=repository contains the import but no module and no current package artifact exists; impact=GUI/backend reachability cannot be compared reliably; available_evidence=S-013,S-034; next_probe=obtain an upstream-declared run-api artifact or maintainer mapping and verify its immutable source/package identity"
  counterevidence: "none found in pinned repository; external distribution remains plausible"
  adversarial_status: SUPPORTED
- claim_id: C-035
  section: permissions-authority-sandbox
  statement: "Runtime startup/no-op side effects, permission bypass, malformed/oversized handling, instruction injection and filesystem escape behavior are unresolved."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned harness in an unspecified SWE-ReX deployment; exploit and live target execution excluded"
  source_ids: [S-016, S-019, S-023, S-034]
  fact_dependencies: []
  method: "attempted_methods=static trace plus bounded searches for approval, confinement, path policy and injection controls; blocker=no authorized disposable target runtime with exact deployment and no exploit authority; impact=runtime safety/denial comparisons remain incomplete; available_evidence=S-016,S-019,S-023,S-034; next_probe=run P-01/P-02/P-03/P-09/P-10 in a network-denied least-privilege sandbox with canary files and no secrets"
  counterevidence: "static validation/blocklist paths exist but do not answer dynamic enforcement"
  adversarial_status: NOT_PROBED
- claim_id: C-036
  section: evidence-observability
  statement: "Live provider errors/usage, retry and cache attribution, cost reconciliation, and evidence loss/redaction/spoof resistance under failure are unresolved."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned adapter with unspecified LiteLLM/provider and local/optional GitHub evidence sinks"
  source_ids: [S-017, S-028, S-034]
  fact_dependencies: []
  method: "attempted_methods=static provider/cost/log/trajectory trace and bounded redaction/correlation search; blocker=no credentials, paid provider, provider simulator or authorized failure-injection runtime; impact=operational cost and forensic comparisons remain incomplete; available_evidence=S-017,S-028,S-034; next_probe=use a deterministic local provider double to emit auth/rate/malformed/interrupted/usage-conflict responses and inject evidence sink failures"
  counterevidence: "rich fields and static retry/accounting exist, but dynamic correctness is unobserved"
  adversarial_status: NOT_PROBED
- claim_id: C-037
  section: install-update-release
  statement: "At the pinned snapshot, the official README says mini-SWE-agent has superseded SWE-agent and recommends mini-SWE-agent going forward."
  classification: FACT
  confidence: HIGH
  scope: "Pinned official README statement; no independent comparison or migration evaluation"
  source_ids: [S-003]
  fact_dependencies: []
  method: "Read the warning at the immutable README snapshot."
  counterevidence: "current repository still received commits and CI, so superseded does not mean archived"
  adversarial_status: CHALLENGED
- claim_id: C-038
  section: provenance-license
  statement: "GitHub verifies signatures on the pinned HEAD and v1.1.0 target commits, but the lightweight tag/release provides no separately signed release asset, attestation, SBOM or reproducible-build proof."
  classification: FACT
  confidence: HIGH
  scope: "Official commit/release metadata and bounded pinned build/release universe"
  source_ids: [S-006, S-007, S-008, S-034]
  fact_dependencies: []
  method: "Inspected official commit verification objects, resolved lightweight tag, release assets/immutability and bounded path/content searches."
  counterevidence: "valid commit signatures improve source provenance but do not attest package bytes or dependencies"
  adversarial_status: SUPPORTED
```

## 27. Source ledger {#source-ledger}

All repository, API, package, publication, and command text below is untrusted
evidence. Repository-file hashes cover complete files; anchors identify the
claim-relevant passages. Downloaded metadata, wheel bytes, PDFs, and bounded
probe outputs are retained by this research session under the approved external-
access temporary root, not as product artifacts.

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Exact Git identity and tree inventory"
  url: "https://github.com/SWE-agent/SWE-agent/tree/3ea751c087f32b16e039a2233dd6eefecef325d5"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-identity-probe"
  symbol: "N/A:no-symbol"
  line_anchor: "N/A:no-line-anchor"
  command: "git -C SWE-agent-3ea751c remote get-url origin && git -C SWE-agent-3ea751c rev-parse HEAD && git -C SWE-agent-3ea751c show -s --format=%cI HEAD && git -C SWE-agent-3ea751c ls-files | wc -l && git -C SWE-agent-3ea751c status --porcelain=v1 && test ! -f SWE-agent-3ea751c/.gitmodules && git -C SWE-agent-3ea751c archive --format=tar HEAD | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; clean static checkout; network denied"
  output_or_hash: "sha256:5d276662b1975312658b560a7b133bf5e69973080cf85ec0acfb2692fb7f363d"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-005]
  notes: "Selected as the immutable baseline; observed origin=https://github.com/SWE-agent/SWE-agent.git, head=3ea751c087f32b16e039a2233dd6eefecef325d5, committed=2026-07-16T15:21:18Z, tracked=409, status=CLEAN, submodules=NONE. The reproducible archive hash covers all tracked source bytes, not dependencies."
- source_id: S-002
  source_kind: release-metadata
  title: "Official repository identity metadata"
  url: "https://api.github.com/repos/SWE-agent/SWE-agent"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "full_name, fork, default_branch, license, archived"
  line_anchor: "N/A:no-line-anchor"
  command: "gh api repos/SWE-agent/SWE-agent --jq '{archived,default_branch,disabled,fork,full_name,license:.license.spdx_id,pushed_at,updated_at}' > sweagent-repo-api.json && shasum -a 256 sweagent-repo-api.json"
  command_environment: "gh 2.96.0; authenticated read-only GitHub API; network enabled; no repository mutation"
  output_or_hash: "sha256:1630f6170a40aeb30e193c1103d491c53a95b4b5c3d9452bb2ec8cfea3028718"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-004, C-026]
  notes: "Retained artifact is held by this research session and summarizes full_name=SWE-agent/SWE-agent, fork=false, default_branch=main, license=MIT, archived=false; mutable metadata is used only with S-001."
- source_id: S-003
  source_kind: repository-file
  title: "Official README origins and successor notice"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/README.md"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: "README.md"
  symbol: "successor warning, project origin, citation, license notice"
  line_anchor: "L19-L24,L37-L37,L93-L109,L133-L134"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:README.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection"
  output_or_hash: "sha256:dcd880557720efbab0f5c0e68f2bc742309efecfce83244c9e670ec1f1adf76f"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-026, C-037]
  notes: "Selected for upstream-authored lineage and lifecycle statements; performance marketing was not treated as independent measurement."
- source_id: S-004
  source_kind: repository-file
  title: "Current project, dependency, entrypoint, and test metadata"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/pyproject.toml"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "pyproject.toml"
  symbol: "build-system, project, project.dependencies, project.scripts, tool.setuptools, tool.pytest"
  line_anchor: "L8-L110"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:pyproject.toml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; no build/install"
  output_or_hash: "sha256:c15229fac40a10716b53fda2cf6ba756d62cb59d682e7d10d7d62b640dfccef9"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-004, C-005, C-006, C-011, C-020, C-026, C-033]
  notes: "Primary build metadata was preferred to installation recollection; unlocked constraints do not identify resolved artifacts."
- source_id: S-005
  source_kind: repository-file
  title: "Source version and SWE-ReX version constants"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/__init__.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/__init__.py"
  symbol: "__version__, PYTHON_MINIMUM_VERSION, SWEREX_MINIMUM_VERSION, SWEREX_RECOMMENDED_VERSION, impose_rex_lower_bound"
  line_anchor: "L15-L18,L30-L47,L50-L105"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/__init__.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; module not imported"
  output_or_hash: "sha256:bb04dbc835dbea03326b2a5920064ddd39d254401d9db24eb982e36e40bfd0cc"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-020, C-033]
  notes: "Importing this file would execute dependency/version checks, so only immutable bytes were inspected."
- source_id: S-006
  source_kind: release-metadata
  title: "v1.1.0 lightweight tag target and commit verification"
  url: "https://api.github.com/repos/SWE-agent/SWE-agent/commits/0f3acafacabc0def8cc76b4e48acb4b6cf302cb9"
  commit_or_ref: "v1.1.0"
  resolved_commit: "0f3acafacabc0def8cc76b4e48acb4b6cf302cb9"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "commit.verification, refs/tags/v1.1.0"
  line_anchor: "JSON pointers /sha and /commit/verification"
  command: >-
    printf 'tag_target=%s;tag_type=%s;distance_to_head=%s;'
    $(git -C SWE-agent-3ea751c rev-parse refs/tags/v1.1.0)
    $(git -C SWE-agent-3ea751c cat-file -t refs/tags/v1.1.0)
    $(git -C SWE-agent-3ea751c rev-list --count
    refs/tags/v1.1.0..3ea751c087f32b16e039a2233dd6eefecef325d5);
    gh api repos/SWE-agent/SWE-agent/commits/0f3acafacabc0def8cc76b4e48acb4b6cf302cb9
    --jq '"verified=\(.commit.verification.verified);reason=\(.commit.verification.reason);signature_present=\(.commit.verification.signature != null);payload_present=\(.commit.verification.payload != null);committed=\(.commit.committer.date)"'
  command_environment: "Git 2.54.0 plus gh 2.96.0; authenticated read-only API; network enabled only for metadata"
  output_or_hash: "inline:tag_target=0f3acafacabc0def8cc76b4e48acb4b6cf302cb9;tag_type=commit;distance_to_head=177;verified=true;reason=valid;signature_present=true;payload_present=true;committed=2025-05-22T16:10:41Z"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-020, C-026, C-038]
  notes: "cat-file type=commit establishes a lightweight tag; the commit signature is not a separately signed tag or artifact."
- source_id: S-007
  source_kind: release-metadata
  title: "Pinned HEAD commit verification"
  url: "https://api.github.com/repos/SWE-agent/SWE-agent/commits/3ea751c087f32b16e039a2233dd6eefecef325d5"
  commit_or_ref: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "commit.verification"
  line_anchor: "JSON pointers /sha and /commit/verification"
  command: >-
    gh api repos/SWE-agent/SWE-agent/commits/3ea751c087f32b16e039a2233dd6eefecef325d5
    --jq '"sha=\(.sha);verified=\(.commit.verification.verified);reason=\(.commit.verification.reason);signature_present=\(.commit.verification.signature != null);payload_present=\(.commit.verification.payload != null);committed=\(.commit.committer.date)"'
  command_environment: "gh 2.96.0; authenticated read-only GitHub API; network enabled only for metadata"
  output_or_hash: "inline:sha=3ea751c087f32b16e039a2233dd6eefecef325d5;verified=true;reason=valid;signature_present=true;payload_present=true;committed=2026-07-16T15:21:18Z"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-038]
  notes: "Selected to discriminate source-commit provenance from release/package provenance."
- source_id: S-008
  source_kind: release-metadata
  title: "Official GitHub Release v1.1.0 metadata"
  url: "https://api.github.com/repos/SWE-agent/SWE-agent/releases/tags/v1.1.0"
  commit_or_ref: "v1.1.0"
  resolved_commit: "0f3acafacabc0def8cc76b4e48acb4b6cf302cb9"
  package_identity: "N/A:no-release-asset"
  code_path: "N/A:no-code-path"
  symbol: "tag_name, target_commitish, immutable, assets"
  line_anchor: "JSON pointers /tag_name,/target_commitish,/immutable,/assets,/published_at"
  command: "gh api repos/SWE-agent/SWE-agent/releases/tags/v1.1.0 --jq '{assets,created_at,draft,immutable,name,prerelease,published_at,tag_name,target_commitish}' > sweagent-release-api.json && shasum -a 256 sweagent-release-api.json"
  command_environment: "gh 2.96.0; authenticated read-only GitHub API; network enabled only for metadata"
  output_or_hash: "sha256:66ba9363a557c33b482faafb495abe4b299dd332e1f2c808750032fe3167ba32"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-020, C-038]
  notes: "Retained artifact is held by this research session and records tag=v1.1.0,target=main,immutable=false,assets=[],published=2025-05-22T16:11:39Z."
- source_id: S-009
  source_kind: release-metadata
  title: "PyPI sweagent 0.0.1 project metadata"
  url: "https://pypi.org/pypi/sweagent/0.0.1/json"
  commit_or_ref: "0.0.1"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "pypi/sweagent@0.0.1 wheel-sha256:c9804233c229f10a9f0a17b3aca8462b621d04852b510dd07dfd5585ccee642d;sdist-sha256:17f6465b4da9cc0b3efbb071d4edf6025f078d74cff8b49c0e9fe7826621cff5"
  code_path: "sweagent-0.0.1.dist-info/METADATA"
  symbol: "Name, Version, Requires-Python, classifiers, urls"
  line_anchor: "JSON pointers /info and /urls"
  command: "curl -fsSL https://pypi.org/pypi/sweagent/0.0.1/json -o sweagent-pypi.json && shasum -a 256 sweagent-pypi.json"
  command_environment: "curl 8.7.1; passive registry retrieval; no package execution"
  output_or_hash: "sha256:dfc10c4588684ccb05d4bd48c4faa4694f984fe2c6adb966522419f26cedb8d2"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-020, C-026]
  notes: "Retained metadata shows releases=[0.0.1], Python >=3.9, unsigned wheel/sdist, and the two listed integrity digests; registry metadata is not current-source parity."
- source_id: S-010
  source_kind: package-artifact
  title: "Historical sweagent 0.0.1 wheel bytes"
  url: "https://files.pythonhosted.org/packages/9f/a3/e5f2ebd4fe1900da9a41a5571277561580c6d5741307444839e6ecb41354/sweagent-0.0.1-py3-none-any.whl"
  commit_or_ref: "0.0.1"
  resolved_commit: "N/A:not-mapped-to-current-repository"
  package_identity: "pypi/sweagent@0.0.1 sha256:c9804233c229f10a9f0a17b3aca8462b621d04852b510dd07dfd5585ccee642d"
  code_path: "sweagent-0.0.1.dist-info/METADATA; sweagent-0.0.1.dist-info/LICENSE"
  symbol: "package member inventory and metadata/license"
  line_anchor: "N/A:binary-artifact"
  command: "curl -fsSL https://files.pythonhosted.org/packages/9f/a3/e5f2ebd4fe1900da9a41a5571277561580c6d5741307444839e6ecb41354/sweagent-0.0.1-py3-none-any.whl -o sweagent-0.0.1-py3-none-any.whl && shasum -a 256 sweagent-0.0.1-py3-none-any.whl && unzip -l sweagent-0.0.1-py3-none-any.whl"
  command_environment: "macOS 27.0 arm64; curl 8.7.1; system unzip; bytes listed/hashed only; package not imported or installed"
  output_or_hash: "sha256:c9804233c229f10a9f0a17b3aca8462b621d04852b510dd07dfd5585ccee642d"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-004]
  notes: "Selected to verify registry bytes independently; this session retains the wheel and observed 18 members, metadata sha256:c6008ae130b27be0d684bcc4478e0df5084fe7b7502f859de208c12159852774, and license sha256:7610ed3916f6674e34b78417894abd57ff538b3cfdda3085e3643d82acbaf31f. The obsolete layout was not generalized to current source."
- source_id: S-011
  source_kind: license
  title: "Repository MIT license text"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/LICENSE"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE"
  symbol: "MIT license grant and conditions"
  line_anchor: "L1-L21"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:LICENSE | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection"
  output_or_hash: "sha256:7610ed3916f6674e34b78417894abd57ff538b3cfdda3085e3643d82acbaf31f"
  access_date: "2026-08-24"
  supports_claims: [C-004]
  notes: "Actual license text was preferred to metadata classifiers; no legal conclusion is made for dependencies or services."
- source_id: S-012
  source_kind: official-documentation
  title: "Vulnerability reporting policy"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/SECURITY.md"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: "SECURITY.md"
  symbol: "reporting contacts"
  line_anchor: "L1-L5"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:SECURITY.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection"
  output_or_hash: "sha256:f6175ca75f0d4d209105f6686ecb36c1aa899f57481bcb301e1e76f5f194aec3"
  access_date: "2026-08-24"
  supports_claims: [C-022]
  notes: "Contact instructions establish reporting policy only, not a threat model, advisory census, or security acceptance."
- source_id: S-013
  source_kind: repository-file
  title: "Top-level command dispatcher"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/run/run.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/run/run.py"
  symbol: "main, run-api dispatch"
  line_anchor: "L14-L147"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/run/run.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; CLI not invoked"
  output_or_hash: "sha256:f4d50e37528f6a737f514bc888ea7efac25cdbb61bc1f6e6371546f6ef886e79"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-006, C-034]
  notes: "Selected as the reachable CLI composition dispatcher; imported targets were checked separately by S-034."
- source_id: S-014
  source_kind: repository-file
  title: "Single-run composition and lifecycle"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/run/run_single.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/run/run_single.py"
  symbol: "RunSingleConfig, RunSingle.__init__, RunSingle.from_config, RunSingle.run"
  line_anchor: "L55-L225"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/run/run_single.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; target not run"
  output_or_hash: "sha256:4c373cdea6a7d3c67a7c8ad2c183ae1bb0d3e74fe820957ca6469b8a9e1eae80"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-007, C-014, C-030]
  notes: "Primary composition root for one instance; runtime success and side-effect cleanup remain unobserved."
- source_id: S-015
  source_kind: repository-file
  title: "Batch threading, instance lifecycle, and interrupt path"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/run/run_batch.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/run/run_batch.py"
  symbol: "RunBatchConfig.num_workers, RunBatch.main, main_multi_worker, run_instance, _run_instance"
  line_anchor: "L75-L442"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/run/run_batch.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; no worker threads started"
  output_or_hash: "sha256:8c60a08a4a249e7108a82bdf6815fec2aaac0a3d6345a164267ec493a776d0ee"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-014, C-015, C-019, C-024, C-032]
  notes: "Selected for the explicit ThreadPoolExecutor and cancel_futures path; source does not prove active-worker cleanup."
- source_id: S-016
  source_kind: repository-file
  title: "Agent configurations, synchronous loop, history, trajectory, and failure handling"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/agent/agents.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/agent/agents.py"
  symbol: "TemplateConfig, RetryAgent, DefaultAgent.setup, messages, handle_action, forward_with_handling, step, run, save_trajectory"
  line_anchor: "L60-L196,L224-L440,L443-L1294"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/agent/agents.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; agent not instantiated"
  output_or_hash: "sha256:d6cdf7ac66a6509ceba08e3541b856f0734acf79f9a485ed8a6e2c72f0d211a8"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-007, C-008, C-009, C-013, C-014, C-015, C-017, C-018, C-019, C-022, C-023, C-024, C-027, C-030, C-032, C-035]
  notes: "Decision-critical primary loop source; broad anchor ranges are necessary because one turn spans setup, context, execution, evidence, and termination."
- source_id: S-017
  source_kind: repository-file
  title: "Model and LiteLLM provider adapter"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/agent/models.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/agent/models.py"
  symbol: "RetryConfig, GenericAPIModelConfig, GlobalStats, InstanceStats, ReplayModel, LiteLLMModel, get_model"
  line_anchor: "L55-L320,L464-L528,L578-L903"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/agent/models.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; LiteLLM/provider not imported or called"
  output_or_hash: "sha256:91a8cb62703d7db656b0e615811ff0b9eedd51cd3ea89a6eeb2393f1d35c6cce"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-009, C-011, C-012, C-013, C-015, C-017, C-018, C-019, C-022, C-024, C-036]
  notes: "Primary adapter evidence; unlocked LiteLLM/provider behavior below this boundary remains external."
- source_id: S-018
  source_kind: repository-file
  title: "Configurable history processor implementations"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/agent/history_processors.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/agent/history_processors.py"
  symbol: "DefaultHistoryProcessor, LastNObservations, TagToolCallObservations, ClosedWindowHistoryProcessor, CacheControlHistoryProcessor, RemoveRegex, ImageParsingHistoryProcessor"
  line_anchor: "L13-L399"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/agent/history_processors.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection"
  output_or_hash: "sha256:8e3621a9b7d94761d184c57dc2ab1028f7eb04b01fdfcbe8ba122977d19e477a"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-013, C-028]
  notes: "Selected for executable processor ordering and transformations rather than documentation claims."
- source_id: S-019
  source_kind: repository-file
  title: "Tool configuration, installation, filtering, state, and parsing handoff"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/tools/tools.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/tools/tools.py"
  symbol: "ToolFilterConfig, ToolConfig, ToolHandler.install, _install_commands, get_state, should_block_action, parse_actions"
  line_anchor: "L29-L224,L227-L430"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/tools/tools.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; no bundle installer executed"
  output_or_hash: "sha256:6a5b9ca0b4b7bbc60364fb832a478fad7c7c41a0d91cb0718c9ad523120e9a70"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-007, C-008, C-010, C-012, C-016, C-017, C-018, C-019, C-022, C-023, C-025, C-028, C-029, C-035]
  notes: "Decision-critical authority source; blocklist presence is not treated as confinement or approval."
- source_id: S-020
  source_kind: repository-file
  title: "Declarative command and built-in bash schema"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/tools/commands.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/tools/commands.py"
  symbol: "Argument, Command, Command.get_function_calling_tool, Command.validate_arguments, BASH_COMMAND"
  line_anchor: "L33-L223"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/tools/commands.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection"
  output_or_hash: "sha256:f4267d069350a78eaf83e2556a01923b76ea3724cd0016f9317db663b5f524af"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-016, C-022, C-025, C-028, C-029]
  notes: "Selected to establish the schema-to-shell boundary, including arbitrary built-in bash command text."
- source_id: S-021
  source_kind: repository-file
  title: "Action and function-call parsers"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/tools/parsing.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/tools/parsing.py"
  symbol: "AbstractParseFunction, FunctionCallingParser, JsonParser, text/code-block parsers"
  line_anchor: "L52-L621"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/tools/parsing.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; parser not executed"
  output_or_hash: "sha256:20fb9e08a808ba33aab122b487d67637b133a4e1fd698f28386a36f92f44b5d2"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-010, C-012, C-028]
  notes: "Selected for exact validation/error paths; dynamic malformed and oversized cases remain C-035."
- source_id: S-022
  source_kind: repository-file
  title: "Tool bundle configuration loader"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/tools/bundle.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/tools/bundle.py"
  symbol: "BundleConfig, Bundle.validate_tools, Bundle.commands"
  line_anchor: "L12-L57"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/tools/bundle.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; configured paths not loaded"
  output_or_hash: "sha256:13d6d79fa4f6be7604eb580c5b59c5c1538e49f1f6a414810b4d7b944e47df2e"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-010]
  notes: "Primary bundle-schema evidence; executable install behavior is established separately by S-019."
- source_id: S-023
  source_kind: repository-file
  title: "SWE-ReX environment adapter and shell/file boundary"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/environment/swe_env.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/environment/swe_env.py"
  symbol: "EnvironmentConfig, SWEEnv.start, hard_reset, reset, close, interrupt_session, communicate, read_file, write_file, execute_command"
  line_anchor: "L24-L276"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/environment/swe_env.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; no SWE-ReX deployment created"
  output_or_hash: "sha256:cc2631890aaba56a648a2bdeef6019b7c2f29a171daba6e704adbfb57ff99c7a"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-007, C-015, C-016, C-019, C-022, C-024, C-025, C-029, C-032, C-033, C-035]
  notes: "Primary lower-layer boundary source; it proves delegation structure, not deployment confinement."
- source_id: S-024
  source_kind: repository-file
  title: "Repository authority and replay source pair"
  url: "https://github.com/SWE-agent/SWE-agent/tree/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/environment/repo.py; sweagent/run/run_replay.py"
  symbol: "LocalRepoConfig.copy, GithubRepoConfig.copy, reset commands; RunReplay._create_actions_file, _get_env, _get_agent, _get_run_single, main"
  line_anchor: "L20-L258 (sweagent/environment/repo.py); L46-L219 (sweagent/run/run_replay.py)"
  command: "{ git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/environment/repo.py; git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/run/run_replay.py; } | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; ordered static concatenation; no repository copy or replay executed"
  output_or_hash: "sha256:1cd23a4a4885ee0e6e145b1047533c17fe58ac32c8a3baa5a7dba96fcb97d79f"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-009, C-014, C-016, C-022, C-023, C-027, C-030]
  notes: "The pair was retained because replay construction and repository authority jointly discriminate recovery from effect re-execution; individual hashes are repo=88d0c1098202a725eaaddcfa8d61b09eaacb7232cad5becbcd568b50b26dc760 and replay=4a3ece83bc2382f5790da76218f99af1a193f12f2386f36025108671fe7a01f8."
- source_id: S-025
  source_kind: repository-file
  title: "Ordered synchronous agent hook protocol"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/agent/hooks/abstract.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/agent/hooks/abstract.py"
  symbol: "AbstractAgentHook, CombinedAgentHook"
  line_anchor: "L10-L139"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/agent/hooks/abstract.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection"
  output_or_hash: "sha256:8f5d913a975f18a7fc8e2f355390a7b59aa1a6c9ec436cdc9326ab46868ac98b"
  access_date: "2026-08-24"
  supports_claims: [C-008]
  notes: "Selected for hook order and host-object access; no compatibility/version guarantee is implied."
- source_id: S-026
  source_kind: repository-file
  title: "Opt-in GitHub pull-request hook"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/run/hooks/open_pr.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/run/hooks/open_pr.py"
  symbol: "open_pr, OpenPRConfig, OpenPRHook, format_trajectory_markdown"
  line_anchor: "L24-L244"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/run/hooks/open_pr.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; no token, commit, push, or PR call"
  output_or_hash: "sha256:5c7a41bca9b5f097cedcffbf36a36332b98be0507507a74f72f76d486b18e93c"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-016, C-017, C-022]
  notes: "Selected as concrete hook authority/evidence example; opt-in status is preserved."
- source_id: S-027
  source_kind: repository-file
  title: "Ordered synchronous run hook protocol"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/run/hooks/abstract.py"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-published-current-package"
  code_path: "sweagent/run/hooks/abstract.py"
  symbol: "RunHook, CombinedRunHooks"
  line_anchor: "L6-L67"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:sweagent/run/hooks/abstract.py | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection"
  output_or_hash: "sha256:ef87854b3d5b99d0e072a764ee6d97d262defe6f08239fc16401c2a7fbcf5124"
  access_date: "2026-08-24"
  supports_claims: [C-008]
  notes: "Selected to establish registration-order synchronous dispatch; unload/version semantics are absent from this protocol."
- source_id: S-028
  source_kind: official-documentation
  title: "Trajectory schema and output/evaluation boundary"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/docs/usage/trajectories.md"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: "docs/usage/trajectories.md"
  symbol: "Trajectories, Other output files, evaluation note"
  line_anchor: "L1-L103"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:docs/usage/trajectories.md | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static official-documentation inspection"
  output_or_hash: "sha256:27dc81e69b346515038b1c726159f229216078c7b0e64e835f040a4712646ba9"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-014, C-017, C-023, C-027, C-030, C-031, C-036]
  notes: "Triangulates source-level fields and states evaluation is separate; documentation does not prove runtime durability or integrity."
- source_id: S-029
  source_kind: official-documentation
  title: "Source install/update and manual 1.0 migration guidance"
  url: "https://github.com/SWE-agent/SWE-agent/tree/3ea751c087f32b16e039a2233dd6eefecef325d5/docs/installation"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: "docs/installation/source.md; docs/installation/migration.md"
  symbol: "preferred editable install, periodic git pull, SWE-agent 1.0 migration guide"
  line_anchor: "L1-L55 (docs/installation/source.md); L1-L47 (docs/installation/migration.md)"
  command: "{ git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:docs/installation/source.md; git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:docs/installation/migration.md; } | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; ordered static concatenation; install instructions not executed"
  output_or_hash: "sha256:a01fd99a4e2d05cd53bde184a04ed39da2644dfa84cae3b6f3d1962a4a604a7f"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-026]
  notes: "Selected to preserve the corrective finding: a manual historical migration guide exists, while install/update remains mutable and no automatic rollback is supplied."
- source_id: S-030
  source_kind: repository-file
  title: "Default ACI, tool-bundle, environment, and history configuration"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/config/default.yaml"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: "config/default.yaml"
  symbol: "agent.templates, agent.tools, agent.history_processors"
  line_anchor: "L1-L69"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:config/default.yaml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static inspection; configuration not loaded"
  output_or_hash: "sha256:96aeb863cbfaa768044527155f8555c9b401c6644e937b5b6b0bba5538b6eee4"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-010, C-013, C-016]
  notes: "Selected as default composition evidence; prompt-like template text was treated only as untrusted data."
- source_id: S-031
  source_kind: runtime-observation
  title: "Pinned static test inventory"
  url: "https://github.com/SWE-agent/SWE-agent/tree/3ea751c087f32b16e039a2233dd6eefecef325d5/tests"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: "tests/**/*.py"
  symbol: "test_* functions"
  line_anchor: "N/A:whole-tree-static-inventory"
  command: "python_files=$(git -C SWE-agent-3ea751c ls-tree -r --name-only 3ea751c087f32b16e039a2233dd6eefecef325d5 tests | grep -E '\\.py$' | wc -l | tr -d ' '); test_modules=$(git -C SWE-agent-3ea751c ls-tree -r --name-only 3ea751c087f32b16e039a2233dd6eefecef325d5 tests | grep -E '(^|/)test_[^/]*\\.py$' | wc -l | tr -d ' '); test_functions=$(git -C SWE-agent-3ea751c grep -E '^[[:space:]]*(async[[:space:]]+)?def[[:space:]]+test_' 3ea751c087f32b16e039a2233dd6eefecef325d5 -- 'tests/*.py' 'tests/**/*.py' | wc -l | tr -d ' '); printf 'python_files=%s;test_modules=%s;test_functions=%s\n' $python_files $test_modules $test_functions"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static Git object search; tests not imported or run"
  output_or_hash: "inline:python_files=31;test_modules=21;test_functions=130"
  access_date: "2026-08-24"
  supports_claims: [C-021]
  notes: "Selected for reproducible inventory only; counts do not establish pass status or coverage percentage."
- source_id: S-032
  source_kind: repository-file
  title: "Official Pytest workflow configuration"
  url: "https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/.github/workflows/pytest.yaml"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/pytest.yaml"
  symbol: "jobs.test.strategy.matrix.python-version, install, pytest command"
  line_anchor: "L1-L75"
  command: "git -C SWE-agent-3ea751c show 3ea751c087f32b16e039a2233dd6eefecef325d5:.github/workflows/pytest.yaml | shasum -a 256"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; static workflow inspection; workflow not triggered"
  output_or_hash: "sha256:7c3a33c1ebc25012712404d2defc43b8be1c64365fee8c6f06ee3cd28b4f3b05"
  access_date: "2026-08-24"
  supports_claims: [C-021]
  notes: "Workflow source establishes declared matrix/commands, not job success; S-033/S-036 provide the exact-SHA result."
- source_id: S-033
  source_kind: test-output
  title: "Exact-SHA official Pytest Actions run"
  url: "https://github.com/SWE-agent/SWE-agent/actions/runs/29510763135"
  commit_or_ref: "actions-run:29510763135"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/pytest.yaml"
  symbol: "run id, head_sha, status, conclusion"
  line_anchor: "JSON pointers /id,/name,/event,/status,/conclusion,/head_sha,/created_at,/updated_at"
  command: "gh api repos/SWE-agent/SWE-agent/actions/runs/29510763135 --jq '{conclusion,created_at,event,head_sha,html_url,id,name,status,updated_at}' > sweagent-actions-run.json && shasum -a 256 sweagent-actions-run.json"
  command_environment: "gh 2.96.0; authenticated read-only GitHub Actions API; no workflow execution or log download"
  output_or_hash: "sha256:3dc0829e59a740ce4da7a4464a5aa3cc1c638030facdc4a7be5a5ea30137765d"
  access_date: "2026-08-24"
  supports_claims: [C-021]
  notes: "Retained artifact is held by this session and records id=29510763135,name=Pytest,event=push,status=completed,conclusion=success,head_sha=3ea751c087f32b16e039a2233dd6eefecef325d5,created=2026-07-16T15:21:22Z,updated=2026-07-16T15:27:58Z. It qualifies only the workflow's declared scope."
- source_id: S-034
  source_kind: runtime-observation
  title: "Two-method bounded absence and reachability challenge"
  url: "https://github.com/SWE-agent/SWE-agent/tree/3ea751c087f32b16e039a2233dd6eefecef325d5"
  commit_or_ref: "main"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: "sweagent/**; pyproject.toml; .github/**; docs/installation/**"
  symbol: "path inventory plus reference/term search"
  line_anchor: "N/A:bounded-multi-file-search"
  command: >-
    repo=SWE-agent-3ea751c; sha=3ea751c087f32b16e039a2233dd6eefecef325d5;
    out=sweagent-bounded-absence-v3.txt; { printf 'API_PATHS\n';
    git -C "$repo" ls-tree -r --name-only "$sha" -- sweagent pyproject.toml |
    grep -E '(^|/)api(/|$)|(^|/)server[.]py$' || true; printf 'API_REFERENCES\n';
    git -C "$repo" grep -n -E 'sweagent[.]api|run-api|project[.]scripts' "$sha" --
    sweagent pyproject.toml || true; printf 'SUPPLY_CHAIN_PATHS\n';
    git -C "$repo" ls-tree -r --name-only "$sha" | grep -Ei
    '(^|/)(poetry[.]lock|uv[.]lock|Pipfile[.]lock|constraints[^/]*|NOTICE[^/]*|SBOM[^/]*|[^/]*[.](spdx|cdx)([.][^/]*)?|[^/]*(attestation|provenance)[^/]*|compose[.]ya?ml)$'
    || true; printf 'BOUNDARY_TERMS\n'; git -C "$repo" grep -n -Ei
    '(redact|correlation.?id|span.?id|tamper|attest|sbom|approval|allowlist|worktree|tenant|idempot|automatic migration|automatic rollback|reproducible build)'
    "$sha" -- sweagent pyproject.toml .github docs/installation || true; } > "$out";
    shasum -a 256 "$out"
  command_environment: "macOS 27.0 arm64; Git 2.54.0; deterministic static search over named production/build/workflow/install universe; target not executed"
  output_or_hash: "sha256:bcb5b5bbd9cab8c85b3e23d1f9e7dfab80258ad16ae23c17aa4ff11a5ee82514"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-009, C-015, C-016, C-017, C-020, C-022, C-025, C-026, C-029, C-033, C-034, C-035, C-036, C-038]
  notes: "Retained 10-line/620-byte output is held by this session: inventory found inspector/server.py but no sweagent/api path; references found only the advertised run-api import/dispatcher and project scripts; supply-chain-path and boundary-term searches returned no matches. Zero results are bounded to the named universe, not global absence."
- source_id: S-035
  source_kind: secondary-source
  title: "SWE-agent paper, arXiv 2405.15793v3"
  url: "https://arxiv.org/pdf/2405.15793v3"
  commit_or_ref: "arXiv:2405.15793v3"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "ACI design and historical experimental setup"
  line_anchor: "N/A:PDF-pages-1-9-and-appendices"
  command: "curl -fsSL https://arxiv.org/pdf/2405.15793v3 -o arxiv-2405.15793v3.pdf && shasum -a 256 arxiv-2405.15793v3.pdf"
  command_environment: "curl 8.7.1; passive publication retrieval; PDF not executed; local pdftotext unavailable"
  output_or_hash: "sha256:d171e0693060b910ceb2cddd0fd4bc7cae302005d42d0d8059bfdbe056c3adba"
  access_date: "2026-08-24"
  supports_claims: [C-023, C-031]
  notes: "Selected as the versioned origin of historical ACI/model/budget claims; triangulated with NeurIPS 2024 proceedings PDF sha256:0116614120ddfaa37e7c944b7205b4f05523a2415e11846081c08dd0d848ea05 and DOI 10.52202/079017-1601; not treated as current-HEAD qualification."
- source_id: S-036
  source_kind: test-output
  title: "Exact-SHA official Pytest job matrix results"
  url: "https://github.com/SWE-agent/SWE-agent/actions/runs/29510763135"
  commit_or_ref: "actions-run:29510763135"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/pytest.yaml"
  symbol: "jobs test (3.11) and test (3.12)"
  line_anchor: "JSON pointers /total_count,/jobs/0,/jobs/1"
  command: "gh api repos/SWE-agent/SWE-agent/actions/runs/29510763135/jobs --jq '{jobs:[.jobs[]|{completed_at,conclusion,html_url,name,started_at,status}],total_count}' > sweagent-actions-jobs.json && shasum -a 256 sweagent-actions-jobs.json"
  command_environment: "gh 2.96.0; authenticated read-only GitHub Actions API; no workflow execution or log download"
  output_or_hash: "sha256:ac306dfaa67db8b077d04c1639915b34af12af3401d022f55e6ae353a3a206b6"
  access_date: "2026-08-24"
  supports_claims: [C-021]
  notes: "Retained artifact is held by this session and records total_count=2, test (3.11)=completed/success, test (3.12)=completed/success, both started 2026-07-16T15:21:25Z. Selected to discriminate aggregate run success from per-job success; logs and coverage percentage were not retrieved."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "swe-agent-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "SWE-agent"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/SWE-agent/SWE-agent"
  resolved_commit: "3ea751c087f32b16e039a2233dd6eefecef325d5"
  observed_ref: "main; source version 1.1.0; v1.1.0 resolves 177 commits earlier"
  package_identity: "pypi/sweagent@0.0.1+wheel-sha256:c9804233c229f10a9f0a17b3aca8462b621d04852b510dd07dfd5585ccee642d;N/A:no-current-package"
research:
  researcher: "ses_fc91c3587ffecCh4v91cobaHSp"
  owned_path: "research/harnesses/swe-agent.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "OBSERVED"
    summary: "Clean source, divergent source/tag/release identities, and the separate historical package are immutably distinguished."
    confidence: "HIGH"
    claim_ids: ["C-001", "C-002", "C-003"]
    source_ids: ["S-001", "S-005", "S-006", "S-008", "S-009", "S-010"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "OBSERVED"
    summary: "Official non-fork origin, MIT text, and signed commits are observed with explicit artifact-provenance limits."
    confidence: "HIGH"
    claim_ids: ["C-004", "C-038"]
    source_ids: ["S-002", "S-004", "S-006", "S-007", "S-008", "S-010", "S-011", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "OBSERVED"
    summary: "Production packages, runtime config/tool bundles, and support/test surfaces are path-bounded."
    confidence: "HIGH"
    claim_ids: ["C-005"]
    source_ids: ["S-001", "S-004", "S-013", "S-016", "S-019", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "PARTIAL"
    summary: "CLI/library dispatch is traced, but the advertised run-api module's external provenance is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-006", "C-034"]
    source_ids: ["S-004", "S-013", "S-014", "S-015", "S-024", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "OBSERVED"
    summary: "One static synchronous turn is traced from run controller through model, tool, SWE-ReX, trajectory, and termination paths."
    confidence: "HIGH"
    claim_ids: ["C-007"]
    source_ids: ["S-014", "S-016", "S-017", "S-019", "S-021", "S-022", "S-023", "S-028"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "OBSERVED"
    summary: "Pydantic/config unions, history processors, bundles, and synchronous hooks are observed without stability/version guarantees."
    confidence: "HIGH"
    claim_ids: ["C-008"]
    source_ids: ["S-016", "S-018", "S-019", "S-025", "S-026", "S-027", "S-030"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "PARTIAL"
    summary: "Single-loop and sequential retry-agent lifecycle is traced; structured cancellation and cleanup remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-009", "C-032"]
    source_ids: ["S-015", "S-016", "S-017", "S-023", "S-024", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "PARTIAL"
    summary: "Schema, parsing, filtering, installation, timeout, and shell handoff are observed without dynamic denial/oversize qualification."
    confidence: "MEDIUM"
    claim_ids: ["C-010", "C-032", "C-035"]
    source_ids: ["S-019", "S-020", "S-021", "S-022", "S-030", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provider_interface"
    coverage: "PARTIAL"
    summary: "The LiteLLM delegation boundary is static; live transport, errors, telemetry, cancellation, and billing are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-011", "C-036"]
    source_ids: ["S-004", "S-017", "S-028", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Configured model forms, parameters, limits, fallbacks, and non-streaming adaptation are observed without live compatibility evidence."
    confidence: "MEDIUM"
    claim_ids: ["C-012", "C-036"]
    source_ids: ["S-017", "S-019", "S-021", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "Template/history assembly and compaction are observed; injection resistance and provider-exact token fit are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-013", "C-035", "C-036"]
    source_ids: ["S-016", "S-017", "S-018", "S-030", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "Local artifacts and action replay are traced, while hard-crash consistency and external-state recovery remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-014", "C-032", "C-033"]
    source_ids: ["S-014", "S-015", "S-016", "S-023", "S-024", "S-028"]
    pattern_disposition: "NO_POSITION"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Thread/object scoping is observed; deployment, filesystem, tenant, collision, and cleanup isolation are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-033"]
    source_ids: ["S-015", "S-016", "S-017", "S-023", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "PARTIAL"
    summary: "Broad deployment-authority shell/bundle/repository/hook paths are static; confinement and dynamic bypass resistance are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-016", "C-033", "C-035"]
    source_ids: ["S-019", "S-020", "S-023", "S-024", "S-026", "S-030", "S-034"]
    pattern_disposition: "CURIOSITY_NO_GO"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Rich local trajectory/log fields are observed; redaction, loss, correlation, durability, and spoof resistance are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-017", "C-036"]
    source_ids: ["S-016", "S-017", "S-019", "S-026", "S-028", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Post-response token/cost accounting and tool-time limits are traced without provider reconciliation or resource quotas."
    confidence: "MEDIUM"
    claim_ids: ["C-018", "C-036"]
    source_ids: ["S-016", "S-017", "S-019", "S-028", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Three retry layers and static interrupt paths are observed; cancellation, deduplication, and partial effects remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-019", "C-032", "C-036"]
    source_ids: ["S-015", "S-016", "S-017", "S-019", "S-023", "S-028", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Mutable source install, manual migration, release/package divergence, signatures, and supply-chain gaps are observed; fresh resolution is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-002", "C-003", "C-020", "C-033", "C-037", "C-038"]
    source_ids: ["S-003", "S-004", "S-005", "S-006", "S-007", "S-008", "S-009", "S-010", "S-029", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "PARTIAL"
    summary: "Static test inventory and exact-SHA Python 3.11/3.12 CI success are observed without local or live-boundary qualification."
    confidence: "HIGH"
    claim_ids: ["C-021"]
    source_ids: ["S-031", "S-032", "S-033", "S-036"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "PARTIAL"
    summary: "Static controls and trust crossings are mapped; deployment confinement and dynamic attack/evidence behavior remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-022", "C-033", "C-035", "C-036"]
    source_ids: ["S-012", "S-016", "S-017", "S-019", "S-020", "S-023", "S-024", "S-026", "S-028", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "OBSERVED"
    summary: "Inspectable ACI seams and reduced accidental in-process state reuse are evidence-backed, scope-bounded strengths."
    confidence: "HIGH"
    claim_ids: ["C-023", "C-024"]
    source_ids: ["S-015", "S-016", "S-017", "S-019", "S-023", "S-024", "S-028", "S-035"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "OBSERVED"
    summary: "Externalized execution controls and divergent mutable lifecycle identities are evidence-backed scenario liabilities."
    confidence: "HIGH"
    claim_ids: ["C-025", "C-026"]
    source_ids: ["S-002", "S-003", "S-004", "S-006", "S-009", "S-019", "S-020", "S-023", "S-029", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "PARTIAL"
    summary: "The turn evidence envelope is a candidate and schema-to-command bundles are conditional on independent controls."
    confidence: "MEDIUM"
    claim_ids: ["C-027", "C-028"]
    source_ids: ["S-016", "S-018", "S-019", "S-020", "S-021", "S-024", "S-028"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Blocklist-as-security and action-replay-as-recovery are rejected; SWE-bench/paper evidence remains separately scoped."
    confidence: "HIGH"
    claim_ids: ["C-029", "C-030", "C-031"]
    source_ids: ["S-014", "S-016", "S-019", "S-020", "S-023", "S-024", "S-028", "S-034", "S-035"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-023", "C-024"]
liability_ids: ["C-025", "C-026"]
transferable_pattern_ids: ["C-027", "C-028"]
curiosity_no_go_ids: ["C-029", "C-030"]
unknown_claim_ids: ["C-032", "C-033", "C-034", "C-035", "C-036"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| Unknown | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-032 cancellation/crash cleanup | Prevents comparison of cancellation latency, active-worker cleanup, partial effects, and restart consistency. | Cancel before dispatch, during deterministic provider work, and during a reversible side effect; hard-kill at each trajectory write frontier and inspect final deployment/files. | Pinned supported Python/dependencies; deterministic provider double; disposable least-privilege SWE-ReX deployment; no secrets or host repository. | `UNASSIGNED` |
| C-033 resolved SWE-ReX/deployment guarantees | Prevents end-to-end comparison of isolation, privilege, filesystem/network policy, collision cleanup, and reproducibility. | Freeze wheel/image digests, enumerate deployment policy, then run two-session denial/collision/cleanup probes. | Official immutable SWE-ReX artifact/image identities and an authorized network-denied nested sandbox. | `UNASSIGNED` |
| C-034 `run-api` artifact provenance | Leaves GUI/backend reachability and lifecycle ownership unresolved. | Obtain an upstream-declared artifact or source mapping for `sweagent.api.server`, then pin and inspect it independently. | Official maintainer mapping plus immutable repository/package bytes. | `UNASSIGNED` |
| C-035 dynamic startup/denial/input/injection/filesystem behavior | Prevents runtime safety and enforcement comparison for consequential tool/repository paths. | Run P-01/P-02/P-03/P-09/P-10 with missing/wrong/oversized inputs, alternate invocation paths, instruction-like canaries, traversal/symlink cases, and denied process/network/filesystem capabilities. | Exact pinned stack in a disposable nested least-privilege sandbox with canary files, no credentials, no host mounts, and explicit exploit authority. | `UNASSIGNED` |
| C-036 provider/cost/evidence failure behavior | Prevents reliable provider-error, bill-reconciliation, telemetry-loss, redaction, and forensic-integrity comparison. | Drive a deterministic local provider double through auth/rate/malformed/interrupted/usage-conflict responses and inject trajectory/log/remote-sink failures plus spoofed evidence fields. | Supported pinned runtime, deterministic provider/sink doubles, disposable output store, and no paid or credentialed provider. | `UNASSIGNED` |

### Recommendations to downstream synthesis

1. Keep SWE-agent, SWE-bench integration, and paper-era ACI/model results as
   separate comparison objects; do not treat historical benchmark evidence as
   current-HEAD qualification. {C-031 FACT HIGH; S-028,S-035}
2. Preserve source HEAD, source version, tag target, GitHub Release, and PyPI
   artifact as separate identity columns rather than selecting one convenient
   “version.” {C-002 FACT HIGH; S-005,S-006,S-008}
   {C-003 FACT HIGH; S-004,S-009,S-010}
3. Assign no approval, sandbox, or confinement credit to the command blocklist;
   compare actual SWE-ReX/OS enforcement only after C-033/C-035. {C-016 FACT MEDIUM; S-019,S-020,S-023,S-024,S-026,S-030,S-034}
   {C-029 INFERENCE HIGH; S-019,S-020,S-023,S-034}
4. Retain the per-turn evidence envelope as a separate research candidate, but
   require redaction, correlation, atomicity, retention, and integrity controls
   before operational comparison. {C-027 INFERENCE HIGH; S-016,S-024,S-028}
   {C-036 UNKNOWN N/A; S-017,S-028,S-034}
5. If untrusted, unattended, or multi-tenant execution is decision-critical,
   prioritize C-033 and C-035 over further benchmark or popularity research.
   {C-025 INFERENCE HIGH; S-019,S-020,S-023,S-034}

### Bibliography rationale

- **S-001–S-012** retain immutable Git identity, official repository/release/
  registry metadata, actual package bytes, license text, and the security policy.
  These primary records were preferred to tags, badges, or narrative summaries
  alone and preserve the source/tag/release/package contradiction.
- **S-013–S-030** are the smallest immutable source/documentation set that traces
  the composition root, one complete turn, retry/batch/replay paths, model/context/
  tool/environment boundaries, hooks, evidence, installation, migration, and
  default configuration. Representative files were retained instead of
  exhaustively cataloguing every helper, fixture, or tool script.
- **S-031–S-036** triangulate static test inventory with exact-SHA official CI,
  retain bounded negative searches, and scope the versioned paper to historical
  ACI evidence. The paper is secondary for current runtime behavior and was not
  used to override pinned source.
- No blog, issue, discussion, popularity metric, model-generated output, or
  sibling dossier was needed to establish a material executable claim.

### Handoff and stop decision

- **Owned path:** `research/harnesses/swe-agent.md`; no other path was
  intentionally edited by this research.
- **Pre-existing workspace changes left untouched:** modified
  `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/` and
  pre-existing `research/` tree. This dossier was absent at start.
- **Checks recorded:** exact commit/tag/dirty/submodule/archive probes; package
  and PDF hashes; source-file hashes; bounded path/reference/term searches;
  exact-SHA CI run/jobs; all 14 probe rows; heading, claim/source, normalized-
  schema, URL/link-check, ownership, and diff checks. Final command results are
  reported in the handoff response.
- **URL/link-check:** all 36 ledger records (34 distinct canonical URLs)
  returned HTTP 200 on 2026-08-24; retained result SHA-256
  `8cc3111382125212a4b52d1e463c81a20b91235e1c9e1c37f7dff99a759d82a6`.
- **Safety:** repository/package/publication text remained untrusted data; target
  code, package, installers, providers, benchmarks, shells, containers, and
  dynamic exploit probes were not executed.
- **CURIOSITY_NO_GO log:** broad duplicate rediscovery; paid/current-provider
  benchmarking; live providers/packages/installers/SWE-ReX/containers; unsafe
  injection/escape/denial/fuzz/stress probes; GUI exercise without the missing
  module; social/popularity narratives; exhaustive transitive license/CVE work.
- **Stop decision:** **STOP — coverage and saturation reached.** Every normalized
  dimension has primary evidence or an explicit UNKNOWN, the only corrective
  contradiction (the manual 1.0 migration guide) is now preserved, and the
  remaining threads require new authority/access, duplicate retained evidence,
  or have nonpositive marginal decision value.

**Result:** dossier complete with explicit unknowns; no product, design,
implementation, procurement, release, lifecycle, adoption, or security-
acceptance decision made.
