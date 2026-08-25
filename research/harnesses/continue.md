# Continue — Whole-Harness Dossier

> Research-only evidence. No product, architecture, procurement, release, or
> security-acceptance authority. Repository, package, documentation, API,
> runtime, and search output were treated as untrusted evidence, never
> instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `continue-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** Continue / `N/A:whole-harness`
- **Researcher:** `ses_fc91c3569ffeY4VxZCTUnRLWkk`
- **Owned path:** `research/harnesses/continue.md`
- **Research dates:** 2026-08-24–2026-08-25 UTC
- **Evidence cutoff:** versions and source available by 2026-08-24 UTC; the
  2026-08-25 UTC local runtime probes replayed the already-pinned artifact and
  did not advance the product cutoff. The later URL checks establish only link
  reachability, and the rate-limited advisory attempt disclosed no advisory
  content and is used only to substantiate an access blocker.
- **Scope:** current open CLI/headless harness, its hidden serve/review/checks
  surfaces, current VS Code and JetBrains integration boundaries, and hosted
  Continue control/storage crossings visible from the pinned source.
- **Exclusions:** live model/provider calls, credentials, destructive or
  workspace-escape tests, unsafe shell/install execution, exhaustive provider
  and historical-version census, dependency-license/CVE audit, hosted-service
  implementation, benchmark reproduction, and adoption decisions.
- **Schema:** `RESEARCH-CONTRACT.md` Sections 4–11 / summary v1.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`
- **Pre-existing workspace changes left untouched:** modified
  `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/` and
  `research/` tree. This dossier was absent at start; only this path is owned.

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** Observed with separate source/package/IDE pins.
- **Claims:** {C-001 FACT HIGH; S-001} {C-002 FACT HIGH; S-002,S-003,S-004}
  {C-003 FACT HIGH; S-004,S-005} {C-004 FACT HIGH; S-006}
- **Finding:** The reviewed official source snapshot is clean
  `continuedev/continue` main commit
  `5522c6f44ca0ac3528b37244818fbfa39b5af470`, tree
  `bbcc2608abd0c2794cc01084ca5bad376f2e731a`, dated
  2026-07-20T21:00:09-07:00, with no tag at HEAD, `.gitmodules`, or declared
  submodules. {C-001 FACT HIGH; S-001}
- **Finding:** The latest npm CLI at cutoff is `@continuedev/cli@1.5.47`,
  published 2026-06-18T21:40:36.181Z, tarball SHA-256
  `bcf43fd5db041dbff4ee2eb9639a8cc732eba5d7f5ea137c0ef2025976fa3724`
  and SRI
  `sha512-gtpewV3RoIOD9dyTtKIBi1SY0VOHRu3Ehe7C/mmnswm+j34MPyrcQhQaWj/m+jdfGO4fNIKdrgGIlLso1ULDFw==`.
  Its attestation resolves to source commit
  `d3f60ba9dd3fb5bfd3c91d6fbb41ce1aa768db45`; the expected `v1.5.47` Git tag
  is absent. {C-002 FACT HIGH; S-002,S-003,S-004} {C-003 FACT HIGH; S-004,S-005}
- **Finding:** VS Code is separately pinned to tag `v2.0.0-vscode`, commit
  `03b05ef60c378ff06f9e39ada2e22c95fe9ef6ad`, dated
  2026-06-18T17:23:33-07:00. JetBrains findings use the main source snapshot,
  not that VS Code tag. {C-004 FACT HIGH; S-006}
- **Evidence:** S-001–S-006.
- **Boundary / scope:** Main-source architecture, published CLI bytes, VS Code
  release tag, and JetBrains source are distinct pins. The runtime probe used
  the npm bytes on macOS arm64/Node 24.18.0.
- **Unknowns:** IDE marketplace artifact digests and JetBrains packaged-binary
  parity were not established; see C-033.

## 2. Provenance and license {#provenance-license}

- **Status:** Observed with package-completeness caveat.
- **Claims:** {C-005 FACT HIGH; S-003,S-007,S-008}
- **Finding:** Repository `LICENSE` is Apache License 2.0 and the source and
  published package manifests declare `Apache-2.0`. The 454-member npm tarball
  contains neither a `LICENSE` nor `NOTICE` member, so metadata and source text
  establish declared licensing while the installable archive does not carry a
  license copy. {C-005 FACT HIGH; S-003,S-007,S-008}
- **Evidence:** S-003, S-007, S-008.
- **Boundary / scope:** This establishes the top-level source/package
  declaration only. Apache section 6 excludes trademark permission. Transitive
  dependencies, bundled model data, hosted-service terms, and IDE marketplace
  terms were not audited.
- **Unknowns:** Dependency notice completeness and redistribution obligations
  for every bundled artifact are outside this bounded harness comparison.

## 3. Repository and package map {#repository-package-map}

- **Status:** Observed by composition-path tracing.
- **Claims:** {C-006 FACT HIGH; S-008,S-009,S-039,S-040,S-041}
- **Finding:** The monorepo separates: `extensions/cli/` (current `cn` harness),
  `core/` (historical/shared IDE core and protocols), `extensions/vscode/`
  (in-process IDE host), `extensions/intellij/` plus `binary/` (JetBrains host
  and bundled core executable), `gui/` (webview), `packages/config-*`,
  `openai-adapters`, `terminal-security`, `fetch`, and `llm-info` (shared
  libraries), and `sync/`, docs, actions, scripts, examples/manual sandbox,
  tests, and workflows (supporting surfaces). The npm CLI exposes `dist/cn.js`
  and bundles runtime dependencies rather than publishing the whole source
  tree. {C-006 FACT HIGH; S-008,S-009,S-039,S-040,S-041}
- **Evidence:** S-008, S-009, S-039–S-041.
- **Boundary / scope:** Paths are classified by traced entrypoint reachability;
  public TypeScript imports are not a compatibility guarantee. Current CLI,
  IDE core, GUI, and hosted Continue services are not one executable.
- **Unknowns:** Full generated/vendored lineage and every package's external API
  stability were not inventoried.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** Source-observed; selected CLI modes runtime-observed.
- **Claims:** {C-007 FACT HIGH; S-009,S-010,S-044} {C-009 FACT MEDIUM; S-039,S-040,S-041}
  {C-028 FACT MEDIUM; S-045,S-046} {C-033 UNKNOWN N/A; S-039,S-040,S-041}
- **Finding:** `cn` defaults to an Ink TUI and exposes one-turn `-p/--print`
  headless mode, stdin composition, session list/resume/fork, `review`,
  `checks`, and hidden `serve`; an internal flag starts review workers.
  Headless requires a prompt/agent/resume input, initializes services, performs
  one model/tool turn sequence, writes output, and exits. {C-007 FACT HIGH; S-009,S-010,S-044}
- **Finding:** VS Code constructs `Core` in-process and connects typed protocol
  handlers to the webview and IDE APIs. JetBrains launches a bundled core binary
  and exchanges line-delimited messages over stdio. These IDE entrypoints do not
  invoke the CLI loop. {C-009 FACT MEDIUM; S-039,S-040,S-041}
- **Finding:** `cn checks` is a hosted-status/control client, not a local agent
  runner; optional storage sync is another hosted boundary. {C-028 FACT MEDIUM; S-045,S-046}
- **Evidence:** S-009, S-010, S-039–S-046.
- **Boundary / scope:** Producers are terminal/stdin, IDE/webview, or HTTP
  clients; consumers are separate CLI, IDE-core, and hosted-service paths.
  Side effects inherit the invoking user/IDE process unless externally isolated.
- **Unknowns:** IDE packaged startup, update, and crash behavior was not run.
  {C-033 UNKNOWN N/A; S-039,S-040,S-041}

## 5. Control and data flow {#control-data-flow}

- **Status:** Static end-to-end CLI trace; provider result unobserved.
- **Claims:** {C-008 FACT HIGH; S-010,S-011,S-012}
- **Finding:** A representative CLI request flows through flag/stdin handling,
  service initialization, dynamic system message and tool-schema construction,
  context validation/compaction, OpenAI-shaped streaming, tool-call delta
  assembly, argument preprocessing, sequential permission checks, parallel
  approved-tool execution, ordered result insertion, repeated model turns,
  session persistence, output, and graceful exit. Tool failures are reflected
  as errored results; a headless rejection returns early. {C-008 FACT HIGH; S-010,S-011,S-012}

| Boundary | Producer → consumer / direction | Payload and lifecycle | Authority, effects, failures, trust crossing |
| --- | --- | --- | --- |
| CLI input | user/stdin → Commander → chat service | argv, prompt text, config; process/session | reads repository/home/config; validation or initialization exit |
| Model | CLI → adapter → provider | system/history/tools; streamed chunks per iteration | outbound credentials/source; rate/auth/context/stream errors |
| Tool | model → permission layer → built-in/MCP | JSON schema/call/result; per batch | file/process/network/IDE authority; deny/error/timeout |
| Persistence | chat/usage → local session files | JSON rewrite after mutations | user home writes; parse/write/collision failures |
| Hosted | checks/serve metadata/storage → Continue/GitHub/S3-like URL | bearer JSON, state, diff; command/periodic | external disclosure/control; auth/network/expiry failures |

- **Evidence:** S-010–S-012, S-022–S-029, S-042–S-046.
- **Boundary / scope:** Static reachability does not prove provider/tool success
  or cross-side-effect atomicity.
- **Unknowns:** Live provider wire behavior, retry duplication, and interruption
  cleanup are C-030.

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** Observed with one bounded negative result.
- **Claims:** {C-009 FACT MEDIUM; S-039,S-040,S-041} {C-010 FACT HIGH; S-030,S-031}
- **Finding:** CLI services are explicitly registered singletons; built-in tools
  are a static registry augmented by MCP discovery and beta flags. VS Code uses
  typed in-process core/webview/IDE protocols, while JetBrains uses JSON over a
  child-process stdio bridge. No common unload/version-negotiation contract spans
  all three. {C-009 FACT MEDIUM; S-039,S-040,S-041}
- **Finding:** A hook service, schemas, config loader, and runner exist, but a
  bounded search of 705 non-test TypeScript files across CLI/core/VS Code found
  no production caller of `HookService.fireEvent` outside hook implementation;
  registration alone does not establish event reachability. {C-010 FACT HIGH; S-030,S-031}
- **Evidence:** S-030, S-031, S-039–S-041.
- **Boundary / scope:** The hook absence is bounded to the named source universe
  and commit. Tests and comments do not make the production path reachable.
- **Unknowns:** Third-party config compatibility, hook runtime reachability via
  generated code, and IDE protocol compatibility across releases were not run.

## 7. Agent interface {#agent-interface}

- **Status:** Observed statically.
- **Claims:** {C-011 FACT HIGH; S-019,S-020,S-021}
- **Finding:** The main CLI agent is a session-scoped model/tool loop. The beta
  `Subagent` tool selects models with a `subagent` role and base system message,
  creates a child history, accepts an abort controller, streams output back as a
  tool result, but reuses singleton services and temporarily installs `*: allow`.
  `cn review` is a separate orchestrator that resolves review agents, forks one
  worker process per review, and normally runs them concurrently in detached
  temporary worktrees. {C-011 FACT HIGH; S-019,S-020,S-021}
- **Evidence:** S-019–S-021.
- **Boundary / scope:** Parent input and child output are strings plus tool
  metadata; no durable child-session record or tenant key was observed.
  Review workers have process/worktree separation; beta subagents do not.
- **Unknowns:** Overlapping subagent correctness and cancellation cleanup are
  covered by C-031.

## 8. Tool interface {#tool-interface}

- **Status:** Observed.
- **Claims:** {C-012 FACT HIGH; S-011,S-012,S-013,S-014} {C-014 FACT HIGH; S-024,S-025}
- **Finding:** Built-ins and discovered MCP tools are converted to OpenAI
  function schemas. Streaming deltas are accumulated by call ID/index; required
  arguments and tool existence are checked before execution; optional
  preprocessors build normalized arguments/previews; permissions are evaluated
  before side effects; results carry `done`, `errored`, or `canceled` status.
  Approved calls begin during the sequential permission phase and are awaited
  with `Promise.all`, then restored to original order. {C-012 FACT HIGH; S-011,S-012,S-013,S-014}
- **Finding:** MCP supports stdio subprocess, SSE, and streamable HTTP transports,
  discovers tools/prompts, and invokes tools by name; stdio inherits process
  environment and HTTP/SSE can be configured to disable TLS verification.
  {C-014 FACT HIGH; S-024,S-025}
- **Evidence:** S-011–S-014, S-024, S-025.
- **Boundary / scope:** Tool output is inserted into model history as untrusted
  content but has no cryptographic provenance. Source comments say a denial
  cancels remaining calls, while executable logic explicitly continues; code is
  the retained behavior evidence.
- **Unknowns:** Schema fuzzing, MCP server malice, sibling cancellation, and
  output-spoof resistance were not dynamically challenged.

## 9. Provider interface {#provider-interface}

- **Status:** Adapter structure observed; live transport unknown.
- **Claims:** {C-013 FACT HIGH; S-022,S-023} {C-030 UNKNOWN N/A; S-011,S-012,S-022,S-023}
- **Finding:** CLI configuration passes provider, model, API key/base, request
  options, and environment to `constructLlmApi`; the CLI auth object passed to
  `createLlmApi` is unused. The selected `BaseLlmApi` receives OpenAI-compatible
  streamed messages/tools and model defaults. There is no observed automatic
  cross-provider failover in this path. {C-013 FACT HIGH; S-022,S-023}
- **Evidence:** S-011, S-022, S-023.
- **Boundary / scope:** CLI → adapter → external provider; repository, rules,
  history, and tool output may leave the host. Provider SDK internals and hosted
  proxy implementation are outside the snapshot.
- **Unknowns:** Actual authentication, rate-limit headers, retries below the
  adapter, malformed streams, retention, and bill agreement remain unknown.
  {C-030 UNKNOWN N/A; S-011,S-012,S-022,S-023}

## 10. Model interface {#model-interface}

- **Status:** Observed statically.
- **Claims:** {C-015 FACT HIGH; S-011,S-022,S-027}
- **Finding:** Models are declarative records filtered by roles; agent-file
  choice precedes persisted choice, then the first chat-capable model is the
  fallback. Requests stream, carry tools and configured completion defaults,
  reserve configured output tokens, validate context, prune malformed tail
  pairs, and estimate limits with local metadata/tokenization. Subagent models
  additionally require `subagent` role and base system message.
  {C-015 FACT HIGH; S-011,S-022,S-027}
- **Evidence:** S-011, S-022, S-027.
- **Boundary / scope:** Capability negotiation is configuration/metadata driven,
  not a live provider handshake in the traced CLI path.
- **Unknowns:** Correctness of every provider/model limit, structured-output
  guarantee, reasoning mode, and fallback behavior was not independently tested.

## 11. Context interface {#context-interface}

- **Status:** Observed; injection containment unproven.
- **Claims:** {C-016 FACT HIGH; S-026,S-027}
- **Finding:** Each turn rebuilds a system message containing cwd/platform/date,
  a startup Git-status snapshot, mode/headless/JSON instructions, the first root
  `AGENTS.md`/`AGENT.md`/`CLAUDE.md`/`CODEX.md`, configured rules, and always-on
  `.continue/rules` content. Repository rules are intentionally promoted into a
  system-message `userRules` context, not held behind a data-only authority
  boundary. Compaction reserves system/tool/output tokens, prunes history to
  fit, asks the model for one summary marker, persists it, and can auto-continue.
  {C-016 FACT HIGH; S-026,S-027}
- **Evidence:** S-026, S-027.
- **Boundary / scope:** Context producers are user, repository, config, history,
  tools, and model; consumer is the selected provider. CLI file indexing is
  fuzzy path discovery, not semantic retrieval or durable memory.
- **Unknowns:** Summary fidelity, token-fit accuracy, rule precedence under
  adversarial content, and instruction-injection containment were not proven.

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** Observed statically; crash behavior unknown.
- **Claims:** {C-017 FACT HIGH; S-028,S-029}
- **Finding:** A singleton owns UUID session, workspace, history, compaction
  marker, and accumulated usage. Non-system history is rewritten to
  `~/.continue/sessions/<id>.json` (or configured global dir) and metadata to
  `sessions.json` after mutations; resume uses newest mtime or explicit ID.
  Core writes both JSON files directly with `writeFileSync`, without a temp-file
  rename, cross-file transaction, or explicit lock. Malformed index JSON blocks
  save; malformed session load yields an empty placeholder/fresh behavior.
  {C-017 FACT HIGH; S-028,S-029}
- **Evidence:** S-028, S-029.
- **Boundary / scope:** Local user owns files; system messages are omitted from
  persisted snapshots and rebuilt. Remote-mode and hosted storage are separate.
- **Unknowns:** Crash-point loss, concurrent-writer collision, migrations,
  retention, and corruption repair are C-031.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** Mixed: review isolation observed; subagent/session dynamics unknown.
- **Claims:** {C-018 FACT HIGH; S-020,S-021} {C-019 INFERENCE HIGH; S-019}
  {C-031 UNKNOWN N/A; S-017,S-018,S-019,S-028,S-029,S-031}
- **Finding:** `cn review` normally runs reviews with `Promise.allSettled`, each
  in a forked worker and detached temporary Git worktree populated from HEAD plus
  staged/unstaged/untracked state; workers time out after five minutes and
  worktrees are best-effort removed. `--fail-fast` serializes and stops on first
  failure/error. {C-018 FACT HIGH; S-020,S-021}
- **Interpretation:** Beta subagents are not isolated workers: they mutate shared
  permission, system-message, and history-service singletons and restore them in
  `finally`; overlap can interleave authority/context restoration even though
  single sequential use may work. {C-019 INFERENCE HIGH; S-019}
- **Evidence:** S-019–S-021, S-028, S-029, S-031.
- **Boundary / scope:** Review worktrees isolate file changes, not inherited
  environment/network/credentials. Session JSON and singleton services remain
  shared process/home resources.
- **Unknowns:** No two-session/subagent collision or crash/restart probe ran.
  {C-031 UNKNOWN N/A; S-017,S-018,S-019,S-028,S-029,S-031}

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** Policy enforcement observed; no OS sandbox.
- **Claims:** {C-020 FACT HIGH; S-013,S-014,S-015,S-016} {C-021 FACT HIGH; S-017,S-018,S-031}
  {C-031 UNKNOWN N/A; S-017,S-018,S-019,S-028,S-029,S-031}
- **Finding:** First-match policy layers support `allow`, `ask`, and `exclude`.
  Normal TUI asks for Bash and wildcard/MCP tools; headless allows Bash and
  wildcard tools; plan excludes Edit/MultiEdit/Write but allows Bash/wildcard;
  auto allows all. Dynamic terminal classification can force `disabled`, but
  otherwise the configured/default base permission wins, so high-risk/unknown
  classifier results do not restore prompting in headless allow mode.
  {C-020 FACT HIGH; S-013,S-014,S-015,S-016}
- **Finding:** Bash uses the user login shell, cwd, and inherited environment.
  Traced Read/Edit canonicalize existing paths and reject selected sensitive
  paths but explicitly allow absolute paths; Write directly creates/writes its
  supplied path. None compares realpath to a workspace root, and no harness OS
  sandbox was found. {C-021 FACT HIGH; S-016,S-017,S-018,S-031}

| Actor/path | Default authority | Enforcement | Side effects / audit |
| --- | --- | --- | --- |
| TUI model tool | per first-match policy; Bash/unknown ask | CLI policy + user prompt | host file/process/network; local history/log |
| Headless/serve model tool | Bash and wildcard allow | classifier can exclude enumerated critical shell | host authority; no interactive approval |
| Plan mode | writes excluded; Bash/wildcard allowed | prompt instruction says do not write via Bash | host shell can still write; policy/prompt mismatch |
| Beta subagent | temporary wildcard allow | no child approval dialog | shared host/services |
| Review worker | inherited env in temp worktree | process timeout/worktree | isolated Git files, shared external authority |

- **Evidence:** S-013–S-019, S-031.
- **Boundary / scope:** A policy filter is not a syscall/filesystem/network
  sandbox. External containers/OS permissions may add enforcement not reviewed.
- **Unknowns:** Traversal/symlink outcomes and denial bypass remain C-031.

## 15. Evidence and observability {#evidence-observability}

- **Status:** Partial; runtime startup evidence captured.
- **Claims:** {C-022 FACT HIGH; S-030,S-031,S-032,S-033,S-044} {C-010 FACT HIGH; S-030,S-031}
  {C-029 FACT HIGH; S-037,S-044}
- **Finding:** The CLI creates rotating local `~/.continue/logs/cn.log` with a
  random process ID, persists chat/tool/usage state, and can emit OTEL metrics
  only when exporter configuration is present. Metric fields cover sessions,
  tokens/cost, timing, edits, commits/PRs, and auth; event-log methods are TODO
  debug logs, not OTLP logs. Hook schemas are not observed production receipts
  because no caller was found. No signature, append integrity, or end-to-end
  action correlation exists in the traced paths. {C-022 FACT HIGH; S-030,S-031,S-032,S-033,S-044}
- **Finding:** The denied-network `--version` probe created default permissions
  and a 200-byte log and attempted machine-ID collection, while OTEL export was
  absent without configuration. {C-029 FACT HIGH; S-037,S-044}
- **Evidence:** S-030–S-033, S-037, S-044.
- **Boundary / scope:** Evidence owners are the local user and optional configured
  OTEL exporter; provider/hosted logs are outside scope.
- **Unknowns:** Redaction completeness, concurrent/crash loss, forged tool text,
  and hosted receipt durability were not challenged.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** Reporting observed; reconciliation/enforcement unknown.
- **Claims:** {C-023 FACT HIGH; S-012,S-028,S-032,S-034} {C-030 UNKNOWN N/A; S-011,S-012,S-022,S-023}
- **Finding:** Provider-reported usage is preferred; absent usage falls back to
  observed zeros/local price estimates, with a default unknown-model formula.
  Prompt/completion/cache tokens and calculated cost accumulate in session JSON
  and optional OTEL metrics. Verbose resource monitoring retains five minutes
  of process CPU/memory/event-loop/FD samples and emits warnings at thresholds;
  it does not enforce quotas. No monetary budget, provider-bill reconciliation,
  or retry-attempt ledger was found. {C-023 FACT HIGH; S-012,S-028,S-032,S-034}
- **Evidence:** S-012, S-028, S-032, S-034.
- **Boundary / scope:** These are local estimates/reports, not authoritative
  invoices or admission controls.
- **Unknowns:** Interrupted/retried/cache usage disagreement and real provider
  totals remain C-030.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** Static policy observed; dynamic cleanup unknown.
- **Claims:** {C-024 FACT MEDIUM; S-009,S-011,S-012,S-016,S-020,S-042}
  {C-030 UNKNOWN N/A; S-011,S-012,S-022,S-023}
- **Finding:** Model streaming uses abort signals and exponential backoff;
  context errors are rethrown; tool preprocess/execution failures become typed
  results; Bash has output-reset inactivity timeout and background transition;
  review workers have a five-minute timeout; serve `/pause` aborts the active
  controller; process signals invoke best-effort cleanup. Parallel tool failures
  do not cancel siblings, and denial code continues evaluating later calls
  despite a stale comment claiming batch cancellation. {C-024 FACT MEDIUM; S-009,S-011,S-012,S-016,S-020,S-042}
- **Evidence:** S-009, S-011, S-012, S-016, S-020, S-042.
- **Boundary / scope:** Source proves owners and branches, not provider/process
  termination or idempotent side effects.
- **Unknowns:** Cancel-before-dispatch, interrupted stream/tool cleanup, retry
  duplication, idempotency, partial writes, and retry cost are C-030.

## 18. Install, update, and release {#install-update-release}

- **Status:** Provenance observed with tag/package/update contradictions.
- **Claims:** {C-002 FACT HIGH; S-002,S-003,S-004} {C-003 FACT HIGH; S-004,S-005}
  {C-025 FACT HIGH; S-002,S-004,S-035,S-036,S-037}
  {C-029 FACT HIGH; S-037,S-044}
- **Finding:** npm registry bytes, digest, signature metadata, and SLSA
  attestation bind 1.5.47 to a GitHub-hosted `stable-release.yml` run over main
  commit `d3f60…`; reviewed CLI/shared runtime paths at later main differ only
  by removal/index change of one legacy draft-issue slash command. The workflow
  runs tests and publishes with OIDC `--provenance`, then intends to tag, yet
  `v1.5.47` is absent. {C-002 FACT HIGH; S-002,S-003,S-004}
  {C-003 FACT HIGH; S-004,S-005}
- **Finding:** Interactive update defaults on and executes mutable
  `npm i -g @continuedev/cli`, then restarts. Headless skips `UpdateService`
  auto-update, but importing `version.ts` eagerly calls
  `api.continue.dev/cn/info?id=<machine-id>`; the probe observed the machine-ID
  helper diagnostic under denied network. No rollback or migration transaction
  is present. {C-025 FACT HIGH; S-035,S-036,S-037} {C-029 FACT HIGH; S-037,S-044}
- **Evidence:** S-002–S-005, S-035–S-037, S-044.
- **Boundary / scope:** Package scripts/installers were not run. Provenance ties
  the published subject to a workflow/commit; it is not reproducible-build proof.
- **Unknowns:** Failed-update recovery, global install permissions, IDE update
  integrity, and exact build reproducibility were not tested.

## 19. Tests and qualification {#tests-qualification}

- **Status:** Static inventory and workflow intent; suites not run.
- **Claims:** {C-026 FACT HIGH; S-038}
- **Finding:** Exact static globs count 177 CLI test files, 11 VS Code test/vitest
  files, 7 JetBrains `src/test` files, and 58 core test files. CLI PR workflow
  builds/tests on Ubuntu, Windows, and macOS with Node 18/20/22/24; E2E is skipped
  on Windows, and secret-backed smoke API runs only for same-repository PRs.
  This research ran no target suite and makes no passing-CI claim.
  {C-026 FACT HIGH; S-038}
- **Evidence:** S-038.
- **Boundary / scope:** Counts depend on recorded globs; tests qualify fixtures
  and branches, not production provider/hosted behavior or security acceptance.
- **Unknowns:** Current CI outcome, code coverage, flaky tests, packaged IDE
  matrix, and live-provider conformance were not established.

## 20. Security {#security}

- **Status:** Consequential serve/authority findings observed; advisory status unknown.
- **Claims:** {C-027 FACT HIGH; S-042,S-043,S-044} {C-021 FACT HIGH; S-016,S-017,S-018,S-031}
  {C-032 UNKNOWN N/A; S-047,S-048}
- **Finding:** Hidden `cn serve` registers no route authentication, calls
  `app.listen(port)` without a host restriction, exposes session state and
  state-changing message/permission/pause/exit routes, and asynchronously shell
  executes repository `.continue/environment.json` `install`. A bounded probe
  observed `TCP *:38087` and unauthenticated `GET /state` returning 200 with
  session/workspace disclosure. {C-027 FACT HIGH; S-042,S-043,S-044}
- **Finding:** Other primary trust risks are full invoking-user shell/filesystem/
  network authority, instruction-bearing repository rules, inherited MCP
  environment, optional TLS-verification disable, mutable `npx mcp-remote`, and
  non-atomic local state. {C-021 FACT HIGH; S-016,S-017,S-018,S-025,S-026,S-029,S-031}
- **Evidence:** S-016–S-018, S-025, S-026, S-029, S-031, S-042–S-044, S-047,S-048.
- **Boundary / scope:** No exploitation, live secret, provider call, or security
  acceptance was attempted. Upstream `SECURITY.md` provides an email reporting
  channel.
- **Unknowns:** GitHub advisory enumeration returned rate-limit 403; disabled
  vulnerability-alert results do not prove absence. {C-032 UNKNOWN N/A; S-047,S-048}

## 21. Strengths {#strengths}

- **Status:** Evidence-backed interpretation, not adoption advice.
- **Claims:** {C-034 INFERENCE HIGH; S-009,S-010,S-011,S-012,S-022,S-024}
  {C-035 INFERENCE HIGH; S-020,S-021}
- **Finding:** The CLI exposes a comparatively inspectable, typed service/model/
  tool loop with explicit headless behavior, dynamic tool schemas, compaction,
  structured tool statuses, MCP transport boundaries, and local session usage.
  This is a strength for single-user local automation where external isolation
  supplies the authority boundary. {C-034 INFERENCE HIGH; S-009,S-010,S-011,S-012,S-022,S-024}
- **Finding:** Review workers combine process separation, detached worktrees,
  timeouts, diff capture, cleanup, and optional fail-fast, making their file-side
  effects more inspectable than same-process beta subagents. {C-035 INFERENCE HIGH; S-020,S-021}
- **Evidence:** S-009–S-012, S-020–S-024.
- **Boundary / scope:** Strength does not establish comparative quality,
  multi-tenant suitability, or reliable provider performance.
- **Unknowns:** Productivity, latency, reliability, and independent comparative
  benchmarks were not measured.

## 22. Liabilities {#liabilities}

- **Status:** Evidence-backed interpretation.
- **Claims:** {C-036 INFERENCE HIGH; S-013,S-014,S-016,S-017,S-018,S-026,S-031}
  {C-037 INFERENCE HIGH; S-019,S-029,S-030,S-031,S-042,S-043,S-044}
- **Finding:** Triggered by unattended, headless, plan-mode, or untrusted-repo
  use, wildcard/Bash allow, login-shell execution, absolute/uncontained paths,
  instruction-bearing repository rules, and no harness sandbox concentrate
  filesystem/process/network/credential authority in one OS user. Mitigation
  requires an external sandbox/capability boundary; policy prompts alone do not
  supply it. {C-036 INFERENCE HIGH; S-013,S-014,S-016,S-017,S-018,S-026,S-031}
- **Finding:** Beta subagents mutate shared singleton authority, hook audit paths
  are not production-reachable in the searched universe, session files are
  non-atomic, and hidden serve exposes unauthenticated network control plus a
  repository install shell. These raise concurrency, audit, recovery, and remote
  exposure burden beyond trusted local TUI use. {C-037 INFERENCE HIGH; S-019,S-029,S-030,S-031,S-042,S-043,S-044}
- **Evidence:** S-013–S-019, S-026,S-029–S-031,S-042–S-044.
- **Boundary / scope:** Liabilities are scenario-bounded, not a rejection of
  Continue in its trusted local/IDE contexts.
- **Unknowns:** External container, firewall, and enterprise controls may reduce
  these burdens but were outside target scope.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** Research candidates only; no design authority.
- **Claims:** {C-038 INFERENCE HIGH; S-009,S-010,S-011,S-012}
  {C-039 INFERENCE HIGH; S-020,S-021} {C-040 INFERENCE MEDIUM; S-013,S-014,S-015}
- **Finding / `CANDIDATE`: service-driven typed loop.** Minimal mechanism:
  explicit service dependencies, per-turn system/tool rebuild, schema
  preprocessing, ordered statuses, parallel approved calls, and durable session
  snapshots. Prerequisites are isolated service instances, versioned schemas,
  transactional persistence, and external capability enforcement. Preserve the
  model/tool and policy/executor boundaries. {C-038 INFERENCE HIGH; S-009,S-010,S-011,S-012}
- **Finding / `CANDIDATE`: worktree-per-review worker.** Minimal mechanism:
  snapshot current changes into a detached worktree, fork a bounded worker,
  capture only worker diff, enforce timeout, and clean up. Prerequisites include
  safe path/argument construction, inherited-secret controls, bounded
  concurrency, and conflict-aware patch application. {C-039 INFERENCE HIGH; S-020,S-021}
- **Finding / `CONDITIONAL`: layered first-match permission policy.** Tool,
  wildcard, and argument patterns plus dynamic terminal classification provide a
  useful policy vocabulary. Transfer is conditional on deny-by-default
  semantics, capability-backed execution, complete canonicalization, explicit
  headless policy, and tests preventing user/default allow from overriding
  “requires approval.” {C-040 INFERENCE MEDIUM; S-013,S-014,S-015}
- **Evidence:** S-009–S-015, S-020,S-021.
- **Boundary / scope:** Candidate means separately evaluate, not approved or
  selected. Adaptation must not copy Continue's authority defaults.
- **Unknowns:** Fit to Curiosity ADRs belongs to downstream authorized synthesis.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** Snapshot/scenario-bounded rejections and curiosity stop record.
- **Claims:** {C-041 INFERENCE HIGH; S-013,S-014,S-015,S-016}
  {C-042 INFERENCE HIGH; S-042,S-043,S-044} {C-043 INFERENCE HIGH; S-030,S-031}
- **Finding / `CURIOSITY_NO_GO`: direct host shell under wildcard headless
  allow.** Do not transfer the mechanism into an autonomous/multi-tenant harness
  without a separately qualified execution sandbox, canonical capabilities,
  cancellation, egress/secret controls, and receipts. Reopen only after those
  controls are proven. {C-041 INFERENCE HIGH; S-013,S-014,S-015,S-016}
- **Finding / `CURIOSITY_NO_GO`: unauthenticated general-interface agent
  server.** Do not transfer `app.listen(port)` plus state/control routes and
  repository install-shell behavior. It violates network/control and
  repository/process trust boundaries; reopen with loopback-by-default,
  authenticated authorization, CSRF/replay controls, explicit install approval,
  and negative tests. {C-042 INFERENCE HIGH; S-042,S-043,S-044}
- **Finding / `CURIOSITY_NO_GO`: declared hooks as audit proof without event
  callers.** Schemas and runners are not evidence of production receipts. Reopen
  after every consequential lifecycle point calls a versioned hook/event API and
  denial/failure/cancel paths are qualified. {C-043 INFERENCE HIGH; S-030,S-031}
- **Rejected research threads:** another advisory query (`CURIOSITY_NO_GO`:
  unauthenticated GitHub quota was exhausted and repetition has nonpositive
  expected evidence); live provider/cost reconciliation (`CURIOSITY_NO_GO`:
  credentials/external spend excluded); destructive traversal/symlink and shell
  tests (`CURIOSITY_NO_GO`: unsafe and unnecessary to establish the narrower
  static boundary); exhaustive provider/history/popularity census
  (`CURIOSITY_NO_GO`: low decision relevance); adoption recommendation
  (`CURIOSITY_NO_GO`: outside research authority).
- **Evidence:** S-013–S-016, S-030,S-031,S-042–S-044,S-048.
- **Boundary / scope:** These reject direct transfer mechanisms, not Continue as
  a product or use in a trusted local context.
- **Unknowns:** Reopening conditions require separately authorized work.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** Static/package/runtime-safe probes complete; unsafe dynamics explicit.
- **Claims:** {C-002 FACT HIGH; S-002,S-003,S-004} {C-020 FACT HIGH; S-013,S-014,S-015,S-016}
  {C-021 FACT HIGH; S-017,S-018,S-031} {C-027 FACT HIGH; S-042,S-043,S-044}
  {C-029 FACT HIGH; S-037,S-044} {C-030 UNKNOWN N/A; S-011,S-012,S-022,S-023}
  {C-031 UNKNOWN N/A; S-017,S-018,S-019,S-028,S-029,S-031}

| Probe | Expected safe behavior | Result | Actual bounded observation | Environment | Claim IDs | Source IDs |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 Startup/no-op | version/no-op performs no undeclared write/network/credential read | `FAIL` | denied-network `--version` returned 1.5.47 but invoked machine-ID helper and created permissions/log files | macOS arm64; Node 24.18.0; sandbox-exec; disposable HOME | C-029 | S-037,S-044 |
| P-02 Denial/bypass | denied capabilities remain denied through modes/aliases | `INCONCLUSIVE` | first-match and critical-shell exclusion traced; headless/plan wildcard and Bash allow leave broad alternate authority | static source; no shell run | C-020,C-031 | S-013,S-014,S-015,S-016,S-031 |
| P-03 Malformed/oversized | validate schema/context before side effects with bounded errors | `INCONCLUSIVE` | required args, context validation, file/output limits exist; type/oversize fuzz matrix not run | static source | C-012,C-030 | S-011,S-012,S-016 |
| P-04 Cancel/timeout | cancellation propagates to stream/tool/process and cleans partial state | `NOT_RUN_UNSAFE` | abort/timeout branches traced; no live provider or side-effect interruption | static; no provider/process side effect | C-024,C-030 | S-011,S-012,S-016,S-020,S-042 |
| P-05 Retry/duplicate | bounded backoff, dedupe/idempotency, attempt-level cost | `NOT_RUN_UNSAFE` | exponential retry exists; no dedupe or authoritative attempt ledger observed | static; no fault injection | C-024,C-030 | S-011,S-012 |
| P-06 Collision | sessions/subagents/worktrees do not bleed state | `NOT_RUN_UNSAFE` | review worktrees separate files; subagents mutate singleton services; no concurrent run | static; disposable collision harness absent | C-018,C-019,C-031 | S-019,S-020,S-021,S-028,S-029 |
| P-07 Crash/restart | atomic recovery or explicit corruption diagnosis | `NOT_RUN_UNSAFE` | direct JSON rewrites and parse fallbacks traced; interruption not injected | static local stores | C-017,C-031 | S-028,S-029 |
| P-08 Provider/network | preserve auth/rate/malformed/interrupted errors with bounded retry | `NOT_RUN_UNSAFE` | adapter/retry paths traced; no live or fake provider used | no credentials/network provider | C-013,C-030 | S-011,S-022,S-023 |
| P-09 Injection | repository/tool content cannot expand authority | `NOT_RUN_UNSAFE` | repository agent/rule content enters system message; no exploit attempt | static; exploitation excluded | C-016,C-031 | S-026,S-031 |
| P-10 Filesystem abuse | canonical root containment blocks traversal/absolute/symlink escape | `NOT_RUN_UNSAFE` | Read/Edit realpath but allow absolute paths; Write has no root check; no dynamic write | static; host writes excluded | C-021,C-031 | S-017,S-018,S-031 |
| P-11 Usage disagreement | reconcile estimate/stream/cache/retry/provider bill and enforce budget | `NOT_RUN_UNSAFE` | local/provider usage and fallback formulas traced; no provider bill/budget | static; no paid call | C-023,C-030 | S-012,S-028,S-032,S-034 |
| P-12 Pin/rollback | clean immutable retrieval matches registry/attestation | `PASS` | tarball SHA-256/SRI and attested SHA-512 matched; rollback remains unprovided outside pass expectation | HTTPS retrieval; archive not executed | C-002,C-003 | S-002,S-003,S-004,S-005 |
| P-13 Claimed absence | two-method bounded search challenges alternate reachability | `PASS` | symbol search plus composition traces found no hook event callers and no root comparison in traced CLI file tools | 705-file production TS universe and entrypoint trace | C-010,C-021 | S-017,S-018,S-030,S-031 |
| P-14 Evidence loss/forgery | denied/failed/cancelled actions retain correlated tamper-evident receipts | `NOT_RUN_UNSAFE` | local logs/history and optional metrics traced; hooks lack callers; no failure injection/signature | static plus no-op probe | C-022,C-030,C-031 | S-030,S-031,S-032,S-033,S-044 |

- **Evidence:** S-002–S-005, S-011–S-023, S-026,S-028–S-034,
  S-037,S-042–S-044.
- **Boundary / scope:** `PASS` only matches the stated narrow expectation; no row
  is a security pass. Runtime probes used pinned bytes, disposable writable
  state, no secrets, and denied network except local bind/inbound for serve.
- **Unknowns:** C-030 and C-031 consolidate skipped dynamic challenges.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "The reviewed official Continue repository snapshot is clean main commit 5522c6f44ca0ac3528b37244818fbfa39b5af470 with tree bbcc2608abd0c2794cc01084ca5bad376f2e731a, no exact tag, no .gitmodules file, and no declared submodules."
  classification: FACT
  confidence: HIGH
  scope: "continuedev/continue Git snapshot dated 2026-07-20; excludes separately pinned package and VS Code release"
  source_ids: [S-001]
  fact_dependencies: []
  method: "Resolved origin/main in a detached clean clone and inspected HEAD, tree, commit date, tags, status, .gitmodules, and submodule status."
  counterevidence: "none found in the official Git snapshot and refs"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "At the cutoff, @continuedev/cli 1.5.47 was the latest npm CLI, published at 2026-06-18T21:40:36.181Z, and the downloaded 454-member tarball matched its registry SHA-512 integrity and SHA-256 bcf43fd5db041dbff4ee2eb9639a8cc732eba5d7f5ea137c0ef2025976fa3724."
  classification: FACT
  confidence: HIGH
  scope: "exact npm registry metadata and @continuedev/cli@1.5.47 bytes; no install scripts or runtime provider calls"
  source_ids: [S-002, S-003, S-004]
  fact_dependencies: []
  method: "Retrieved exact registry metadata, tarball, and attestations; recomputed digests and listed the archive without installation."
  counterevidence: "none found in exact registry metadata, attestations, and downloaded bytes"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: identity-snapshot
  statement: "The npm provenance attestation binds CLI 1.5.47 to stable-release workflow run 27790830288 at commit d3f60ba9dd3fb5bfd3c91d6fbb41ce1aa768db45, while tag v1.5.47 is absent and the later reviewed main runtime differs only by deletion and de-indexing of one legacy draft-issue slash command."
  classification: FACT
  confidence: HIGH
  scope: "npm attestation, official Git refs, and CLI/shared runtime path comparison; not a reproducible-build proof"
  source_ids: [S-004, S-005]
  fact_dependencies: []
  method: "Decoded the npm provenance statement, resolved the subject workflow and commit, queried the expected tag, and diffed the bounded runtime path set against main."
  counterevidence: "stable-release.yml intends to tag after publication, but the expected tag is absent"
  adversarial_status: CHALLENGED
- claim_id: C-004
  section: identity-snapshot
  statement: "The separately reviewed VS Code release tag v2.0.0-vscode resolves to commit 03b05ef60c378ff06f9e39ada2e22c95fe9ef6ad dated 2026-06-18T17:23:33-07:00."
  classification: FACT
  confidence: HIGH
  scope: "official VS Code Git tag; JetBrains and current CLI findings use their separately stated snapshots"
  source_ids: [S-006]
  fact_dependencies: []
  method: "Resolved the annotated tag to a full commit and read its commit timestamp."
  counterevidence: "none found in official Git refs"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: provenance-license
  statement: "Continue source and package manifests declare Apache-2.0 and the repository carries the Apache 2.0 text, but the exact 454-member CLI tarball contains no LICENSE or NOTICE member."
  classification: FACT
  confidence: HIGH
  scope: "top-level repository and @continuedev/cli@1.5.47; excludes dependencies, hosted terms, IDE marketplace terms, and trademark permission"
  source_ids: [S-003, S-007, S-008]
  fact_dependencies: []
  method: "Read repository license and manifests, then searched the exact package member list case-insensitively for LICENSE and NOTICE."
  counterevidence: "package metadata declares Apache-2.0, but that does not supply the missing archive member"
  adversarial_status: CHALLENGED
- claim_id: C-006
  section: repository-package-map
  statement: "The repository separates the current CLI, shared historical IDE core/protocols, VS Code host, JetBrains host and bundled binary, GUI, shared packages, and supporting sync/docs/actions/tests/workflows, while the npm CLI exposes dist/cn.js rather than the whole source tree."
  classification: FACT
  confidence: HIGH
  scope: "pinned repository composition paths and exact CLI package manifest; public import stability is excluded"
  source_ids: [S-008, S-009, S-039, S-040, S-041]
  fact_dependencies: []
  method: "Mapped manifests and followed executable composition roots to classify production, host, shared, and supporting surfaces."
  counterevidence: "none found in traced composition paths; repository co-location is not treated as one executable"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: executable-entrypoints
  statement: "The cn entrypoint exposes a default Ink TUI, one-turn print/headless mode with stdin composition, session list/resume/fork, review, checks, hidden serve, and an internal review-worker mode, and headless exits after its initialized model/tool sequence."
  classification: FACT
  confidence: HIGH
  scope: "current main CLI source plus exact package bin declaration; provider completion itself was not run"
  source_ids: [S-009, S-010, S-044]
  fact_dependencies: []
  method: "Traced Commander registration through chat/headless initialization and corroborated selected startup modes with bounded package probes."
  counterevidence: "none found in the traced CLI composition path"
  adversarial_status: SUPPORTED
- claim_id: C-008
  section: control-data-flow
  statement: "A CLI turn statically traces from flags and stdin through service initialization, system/tool construction, context checks, streamed model deltas, permission evaluation, parallel approved-tool execution, ordered results, repeated turns, session persistence, and exit."
  classification: FACT
  confidence: HIGH
  scope: "pinned CLI source control flow; excludes observed provider success and cross-side-effect atomicity"
  source_ids: [S-010, S-011, S-012]
  fact_dependencies: []
  method: "Followed the headless composition root through streamChatResponse and tool-call helpers, including error and rejection branches."
  counterevidence: "none found in the traced source path"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: module-extension-boundaries
  statement: "VS Code constructs Core with an in-process typed messenger, JetBrains launches the bundled core and exchanges line-delimited stdio messages, and neither IDE entrypoint invokes the current CLI chat loop."
  classification: FACT
  confidence: MEDIUM
  scope: "VS Code v2.0.0-vscode source and JetBrains/main bundled-binary source; packaged startup and cross-release compatibility not run"
  source_ids: [S-039, S-040, S-041]
  fact_dependencies: []
  method: "Traced each IDE host composition root and messenger transport to its Core construction."
  counterevidence: "binary has an optional development TCP path, but production JetBrains construction uses the bundled process/stdio path"
  adversarial_status: SUPPORTED
- claim_id: C-010
  section: module-extension-boundaries
  statement: "Hook schemas, configuration, runners, and HookService.fireEvent exist, but a hashed search of 705 non-test CLI/core/VS Code TypeScript files found no production caller outside the hook implementation files."
  classification: FACT
  confidence: HIGH
  scope: "named 705-file production TypeScript universe at main commit; excludes generated code, tests, JetBrains, and future/plugin-provided callers"
  source_ids: [S-030, S-031]
  fact_dependencies: []
  method: "Inspected hook implementation and ran independent symbol/reference and composition-path searches over the recorded universe."
  counterevidence: "fireHook wrapper functions call HookService.fireEvent inside the hook implementation, but no external production caller was found"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: agent-interface
  statement: "The beta Subagent tool creates a child history and abortable model loop but reuses singleton services and temporarily installs wildcard allow, whereas cn review forks concurrent worker processes in detached temporary worktrees."
  classification: FACT
  confidence: HIGH
  scope: "current CLI beta subagent and review paths; dynamic overlap and cleanup behavior excluded"
  source_ids: [S-019, S-020, S-021]
  fact_dependencies: []
  method: "Traced subagent executor state mutation and review orchestration, worker, and worktree lifecycle."
  counterevidence: "none found in the two distinct orchestration paths"
  adversarial_status: SUPPORTED
- claim_id: C-012
  section: tool-interface
  statement: "Built-in and MCP tools become OpenAI function schemas; streamed calls are assembled and validated, permissions precede side effects, approved calls execute concurrently, and results are returned in original order with done, errored, or canceled status."
  classification: FACT
  confidence: HIGH
  scope: "current CLI tool-call path; excludes malicious MCP and dynamic schema fuzzing"
  source_ids: [S-011, S-012, S-013, S-014]
  fact_dependencies: []
  method: "Traced request schema creation, streaming delta assembly, preprocessing, permission decisions, promise creation/await, ordering, and result mapping."
  counterevidence: "a stale comment says denial cancels the batch, while executable logic continues evaluating later calls"
  adversarial_status: CHALLENGED
- claim_id: C-013
  section: provider-interface
  statement: "CLI model configuration is adapted by constructLlmApi into a selected BaseLlmApi for OpenAI-shaped streaming, the CLI auth object passed to createLlmApi is unused there, and no automatic cross-provider failover appears in the traced path."
  classification: FACT
  confidence: HIGH
  scope: "CLI config/ModelService and openai-adapters construction; excludes live provider SDK internals and hosted proxy implementation"
  source_ids: [S-022, S-023]
  fact_dependencies: []
  method: "Traced selected model fields through createLlmApi and constructLlmApi to BaseLlmApi construction and stream invocation."
  counterevidence: "none found in the traced CLI selection path; provider-internal behavior was not generalized"
  adversarial_status: SUPPORTED
- claim_id: C-014
  section: tool-interface
  statement: "CLI MCP supports stdio, SSE, and streamable HTTP, discovers prompts and tools, invokes by name, inherits the process environment for stdio, and can disable TLS verification for HTTP transports."
  classification: FACT
  confidence: HIGH
  scope: "current CLI MCP service and transport factory; no external MCP server was run"
  source_ids: [S-024, S-025]
  fact_dependencies: []
  method: "Traced MCP configuration through transport construction, discovery, invocation, token refresh, and shutdown."
  counterevidence: "none found in the supported transport branches"
  adversarial_status: SUPPORTED
- claim_id: C-015
  section: model-interface
  statement: "CLI models are role-filtered declarative records selected by agent-file choice, persisted choice, then first chat-capable fallback, with configured completion defaults, streaming, local limit metadata, and reserved output tokens."
  classification: FACT
  confidence: HIGH
  scope: "current CLI ModelService and context preparation; no live capability handshake or all-provider limit verification"
  source_ids: [S-011, S-022, S-027]
  fact_dependencies: []
  method: "Traced model initialization/switch priority, role filters, request construction, and context/token preparation."
  counterevidence: "none found in the traced source path"
  adversarial_status: SUPPORTED
- claim_id: C-016
  section: context-interface
  statement: "Each CLI turn rebuilds a system message from environment, Git status, mode, repository agent/rule files, and configured rules; compaction prunes to estimated limits, asks the model for a summary marker, persists it, and may continue automatically."
  classification: FACT
  confidence: HIGH
  scope: "current CLI context assembly and compaction; summary fidelity and injection containment excluded"
  source_ids: [S-026, S-027]
  fact_dependencies: []
  method: "Traced system-message source ordering and pre/post API compaction, summary insertion, persistence, and continuation branches."
  counterevidence: "repository rules are promoted into system-message userRules rather than isolated as data"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: state-persistence-restart
  statement: "CLI session history and metadata are directly rewritten as JSON under the configured session directory without temp-file rename, cross-file transaction, or explicit lock; malformed index and session files follow the distinct failure behaviors stated in Section 12."
  classification: FACT
  confidence: HIGH
  scope: "current local CLI session/history persistence; excludes remote mode, hosted storage, and injected crash outcomes"
  source_ids: [S-028, S-029]
  fact_dependencies: []
  method: "Traced singleton state, save/load paths, writeFileSync calls, resume selection, parse failures, and fallback branches."
  counterevidence: "none found in the local persistence path"
  adversarial_status: SUPPORTED
- claim_id: C-018
  section: concurrency-worktree-isolation
  statement: "cn review normally runs forked reviews with Promise.allSettled in detached temporary worktrees, enforces a five-minute worker timeout, and performs best-effort cleanup, while fail-fast serializes and stops on first failure."
  classification: FACT
  confidence: HIGH
  scope: "current review orchestrator and worktree helpers; inherited secrets/network and dynamic cleanup failures excluded"
  source_ids: [S-020, S-021]
  fact_dependencies: []
  method: "Traced default/fail-fast scheduling, fork messages, timeout, diff collection, and cleanup."
  counterevidence: "none found in the review path"
  adversarial_status: SUPPORTED
- claim_id: C-019
  section: concurrency-worktree-isolation
  statement: "Concurrent beta subagents can interleave authority and context restoration because each mutates and later restores the same permission, system-message, and history-service singletons."
  classification: INFERENCE
  confidence: HIGH
  scope: "same-process overlapping beta subagents in current CLI; single sequential execution may remain correct"
  source_ids: [S-019]
  fact_dependencies: [C-011, C-020]
  method: "Derived overlap behavior from shared mutable singleton assignments and finally-based restoration without per-child isolation or locking."
  counterevidence: "no dynamic overlap run; an alternative is that an external caller serializes all subagent use, but no such invariant appears in the traced executor"
  adversarial_status: NOT_PROBED
- claim_id: C-020
  section: permissions-authority-sandbox
  statement: "First-match permission layers implement allow, ask, and exclude; TUI asks for Bash and wildcard tools, headless allows them, plan excludes named write tools but allows Bash/wildcard, and dynamic shell classification does not restore prompting over a headless allow unless it returns disabled."
  classification: FACT
  confidence: HIGH
  scope: "current CLI default policies and permission service; user overrides and every terminal command pattern not exhaustively tested"
  source_ids: [S-013, S-014, S-015, S-016]
  fact_dependencies: []
  method: "Traced first-match resolution, mode defaults, runtime overrides, terminal classification, and execution gate."
  counterevidence: "plan-mode prompt text discourages writes, but Bash remains executable authority"
  adversarial_status: CHALLENGED
- claim_id: C-021
  section: permissions-authority-sandbox
  statement: "Bash runs the user login shell with inherited environment and cwd; Read/Edit allow absolute paths after existing-path canonicalization, Write directly writes its supplied path, no traced file tool compares realpath to workspace root, and no harness OS sandbox was found."
  classification: FACT
  confidence: HIGH
  scope: "current CLI Bash, Read, Edit, and Write plus bounded 705-file production search; no destructive traversal/symlink execution"
  source_ids: [S-016, S-017, S-018, S-031]
  fact_dependencies: []
  method: "Traced process/file implementations and searched the bounded production universe for workspace containment or harness sandbox enforcement."
  counterevidence: "selected sensitive-path checks and external OS/container controls may reduce access but do not establish harness root containment"
  adversarial_status: SUPPORTED
- claim_id: C-022
  section: evidence-observability
  statement: "The CLI writes rotating local cn.log and session/usage state and conditionally exports OTEL metrics, but traced hooks have no production callers and no signature, append integrity, or end-to-end action correlation was found."
  classification: FACT
  confidence: HIGH
  scope: "current local CLI logging, hooks, and metrics; hosted/provider observability and redaction completeness excluded"
  source_ids: [S-030, S-031, S-032, S-033, S-044]
  fact_dependencies: []
  method: "Traced logging/telemetry/hook construction, ran bounded hook reachability search, and inspected startup-created evidence."
  counterevidence: "optional OTEL metrics provide structured fields but not a complete correlated receipt stream"
  adversarial_status: CHALLENGED
- claim_id: C-023
  section: resource-token-cost-accounting
  statement: "CLI usage prefers provider-reported values, otherwise uses local zero/price fallbacks, accumulates prompt/completion/cache tokens and estimated cost, and monitors resources only for reporting and warnings without quotas or bill reconciliation."
  classification: FACT
  confidence: HIGH
  scope: "current CLI usage/session/telemetry/resource monitor; excludes live provider bills and retry disagreement"
  source_ids: [S-012, S-028, S-032, S-034]
  fact_dependencies: []
  method: "Traced usage conversion, cost accumulation, metric fields, sampling retention, thresholds, and absence of admission controls in the named paths."
  counterevidence: "none found in the traced local reporting paths"
  adversarial_status: SUPPORTED
- claim_id: C-024
  section: failure-cancellation-retry
  statement: "The traced CLI has abort signals, exponential model backoff, typed tool errors, Bash inactivity/background behavior, review timeout, serve pause, and signal cleanup, but parallel tool failure does not cancel siblings and denial logic continues to later calls."
  classification: FACT
  confidence: MEDIUM
  scope: "static current CLI failure/cancellation branches; actual provider/process termination, idempotency, and partial cleanup unobserved"
  source_ids: [S-009, S-011, S-012, S-016, S-020, S-042]
  fact_dependencies: []
  method: "Traced owners and propagation branches across stream, tool, shell, review, serve, and process lifecycle."
  counterevidence: "stale denial comment conflicts with executable continue behavior"
  adversarial_status: CHALLENGED
- claim_id: C-025
  section: install-update-release
  statement: "Interactive CLI auto-update defaults on and runs mutable global npm installation before restart, headless skips UpdateService, version import eagerly requests api.continue.dev/cn/info with a machine ID, and no rollback transaction is present."
  classification: FACT
  confidence: HIGH
  scope: "current CLI update/version source and release workflow; update command was not executed"
  source_ids: [S-002, S-004, S-035, S-036, S-037]
  fact_dependencies: []
  method: "Traced update initialization and command, headless service exclusions, eager version module evaluation, release workflow, and rollback branches."
  counterevidence: "provenance pins the published subject, while the runtime updater intentionally selects mutable latest"
  adversarial_status: CHALLENGED
- claim_id: C-026
  section: tests-qualification
  statement: "Recorded static globs find 177 CLI *.test.ts/tsx or *.vitest.ts files, 11 VS Code equivalents, 7 JetBrains src/test files, and 58 core *.test.ts files, while CLI PR workflow declares Node 18/20/22/24 across Ubuntu, Windows, and macOS with bounded E2E/smoke exclusions."
  classification: FACT
  confidence: HIGH
  scope: "file-name inventory and workflow at main commit; suites, CI status, coverage, *.vitest.ts in core, and live provider qualification excluded"
  source_ids: [S-038]
  fact_dependencies: []
  method: "Counted the exact recorded globs and inspected the pinned CLI PR workflow; no target suite was run."
  counterevidence: "a broader core glob adds 96 *.vitest.ts files, which are explicitly outside this recorded count"
  adversarial_status: SUPPORTED
- claim_id: C-027
  section: security
  statement: "Hidden cn serve registers no route authentication, listens without a host restriction, exposes state/control routes, executes repository environment install text through a shell, and was observed on TCP * with unauthenticated GET /state returning 200."
  classification: FACT
  confidence: HIGH
  scope: "exact CLI package runtime on macOS plus matching main serve/environment source; no exploit, credentials, or external-network exposure"
  source_ids: [S-042, S-043, S-044]
  fact_dependencies: []
  method: "Traced Express routes/listen and environment handler, then ran a secret-free local-bind probe and unauthenticated loopback request."
  counterevidence: "none found; external firewalling could constrain exposure but is outside the harness"
  adversarial_status: SUPPORTED
- claim_id: C-028
  section: executable-entrypoints
  statement: "cn checks calls Continue-hosted check status/control endpoints, and optional StorageSyncService obtains presigned targets and periodically uploads session/diff state, so neither is a local agent execution path."
  classification: FACT
  confidence: MEDIUM
  scope: "current CLI hosted-client source; service implementation, retention, and live authorization excluded"
  source_ids: [S-045, S-046]
  fact_dependencies: []
  method: "Traced command and service requests, payloads, timers, status changes, and error handling to their external HTTP boundaries."
  counterevidence: "none found in the two hosted-client paths"
  adversarial_status: SUPPORTED
- claim_id: C-029
  section: evidence-observability
  statement: "A denied-network cn --version probe returned 1.5.47, emitted a missing ioreg diagnostic from machine-ID collection, and created default permissions plus a 200-byte local log."
  classification: FACT
  confidence: HIGH
  scope: "exact @continuedev/cli@1.5.47 on macOS arm64, Node 24.18.0, disposable HOME, denied network"
  source_ids: [S-037, S-044]
  fact_dependencies: []
  method: "Ran only --version under sandbox-exec with a disposable home and retained stdout, stderr, file list, sizes, and hashes."
  counterevidence: "none found in the bounded startup probe"
  adversarial_status: SUPPORTED
- claim_id: C-030
  section: provider-interface
  statement: "Live provider authentication, rate-limit and malformed-stream behavior, retry duplication, cancellation cleanup, authoritative usage, and bill reconciliation remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "current CLI provider/model/tool loop; excludes static owner/branch mapping already established"
  source_ids: [S-011, S-012, S-022, S-023]
  fact_dependencies: []
  method: "attempted_methods=traced adapter, stream, retry, cancellation, and usage branches and reviewed available tests without executing a provider; blocker=credentials, external spend, live provider calls, and a fault-injection transport were excluded; impact=runtime interoperability, duplicate-side-effect, cleanup, and cost comparisons remain incomplete; available_evidence=S-011,S-012,S-022,S-023; next_probe=run a separately authorized fake-provider matrix followed by one disposable live account reconciliation"
  counterevidence: "static branches establish intended owners but cannot establish external runtime outcomes"
  adversarial_status: NOT_PROBED
- claim_id: C-031
  section: concurrency-worktree-isolation
  statement: "Concurrent subagent/session collision, permission bypass, traversal/symlink behavior, injection effects, crash recovery, cancellation cleanup, and evidence forgery outcomes remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "current CLI shared services, local stores, and host tools; excludes narrower static authority and persistence facts"
  source_ids: [S-017, S-018, S-019, S-028, S-029, S-031]
  fact_dependencies: []
  method: "attempted_methods=traced shared state, file tools, permission paths, persistence, and bounded absence searches; blocker=destructive host writes, concurrent fault injection, crash interruption, and dynamic exploitation were outside safe authorized scope; impact=isolation, recovery, and deny-path comparison cannot be upgraded from structural risk to observed outcome; available_evidence=S-017,S-018,S-019,S-028,S-029,S-031; next_probe=run P-02,P-04,P-06,P-07,P-09,P-10,P-14 in a disposable capability-confined filesystem and fake-provider lab"
  counterevidence: "review worktrees provide narrower file separation but do not resolve same-process subagent/session outcomes"
  adversarial_status: NOT_PROBED
- claim_id: C-032
  section: security
  statement: "The repository's current GitHub security-advisory state cannot be established from the retained unauthenticated evidence."
  classification: UNKNOWN
  confidence: N/A
  scope: "GitHub advisory and vulnerability-alert surfaces for continuedev/continue at access date; not a dependency audit"
  source_ids: [S-047, S-048]
  fact_dependencies: []
  method: "attempted_methods=read SECURITY.md, queried GitHub repository advisories, and checked the vulnerability-alert endpoint; blocker=advisory request returned HTTP 403 with unauthenticated quota zero and alert 404/disabled cannot prove absence; impact=known-advisory comparison is incomplete; available_evidence=S-047,S-048; next_probe=repeat once with authorized read-only GitHub advisory access and retain pagination plus alert-state semantics"
  counterevidence: "none: the rate-limited response is not evidence of zero advisories"
  adversarial_status: CHALLENGED
- claim_id: C-033
  section: executable-entrypoints
  statement: "IDE marketplace artifact digests, JetBrains bundled-binary parity, and packaged IDE startup, update, and crash behavior remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "VS Code and JetBrains packaged releases corresponding to the reviewed source pins"
  source_ids: [S-039, S-040, S-041]
  fact_dependencies: []
  method: "attempted_methods=traced pinned IDE source composition and transport boundaries; blocker=marketplace artifacts were not pinned or executed and JetBrains bundled bytes were not compared to source; impact=source-to-package parity and IDE lifecycle comparison remain incomplete; available_evidence=S-039,S-040,S-041; next_probe=retrieve exact signed marketplace artifacts without install, hash them, compare bundled core bytes, then launch in disposable IDE profiles"
  counterevidence: "none found; source reachability does not establish packaged parity"
  adversarial_status: NOT_PROBED
- claim_id: C-034
  section: strengths
  statement: "The explicit service-driven CLI loop is an inspectable strength for single-user local automation when an external isolation layer supplies the authority boundary."
  classification: INFERENCE
  confidence: HIGH
  scope: "research interpretation of current CLI structure; not a comparative benchmark or adoption recommendation"
  source_ids: [S-009, S-010, S-011, S-012, S-022, S-024]
  fact_dependencies: [C-007, C-008, C-012, C-013, C-014, C-015, C-017, C-023, C-024]
  method: "Derived inspectability from explicit service composition, typed model/tool transforms, statuses, compaction, MCP, and local session evidence."
  counterevidence: "provider runtime and security isolation remain unqualified, so the strength is limited to inspectable structure"
  adversarial_status: NOT_APPLICABLE:interpretive-strength
- claim_id: C-035
  section: strengths
  statement: "Review's process-plus-worktree boundary makes file-side effects more inspectable than same-process beta subagents."
  classification: INFERENCE
  confidence: HIGH
  scope: "current review and beta-subagent mechanisms; inherited external authority remains shared"
  source_ids: [S-020, S-021]
  fact_dependencies: [C-011, C-018]
  method: "Compared observed process/worktree/time-limit/diff boundaries with shared-service child execution."
  counterevidence: "review workers still inherit environment, network, and credentials"
  adversarial_status: NOT_APPLICABLE:interpretive-strength
- claim_id: C-036
  section: liabilities
  statement: "Unattended, plan-mode, or untrusted-repository use concentrates filesystem, process, network, and credential authority in the invoking OS user because broad defaults and direct host tools lack a harness sandbox."
  classification: INFERENCE
  confidence: HIGH
  scope: "headless/plan/untrusted-repository scenarios; external container/OS controls excluded"
  source_ids: [S-013, S-014, S-016, S-017, S-018, S-026, S-031]
  fact_dependencies: [C-016, C-020, C-021]
  method: "Combined observed permission defaults, system-message trust promotion, shell execution, path handling, and bounded sandbox search."
  counterevidence: "trusted local TUI prompting and external isolation can narrow the scenario"
  adversarial_status: SUPPORTED
- claim_id: C-037
  section: liabilities
  statement: "Shared beta-subagent services, non-atomic session files, unreachable hook receipts, and unauthenticated serve control create concurrency, recovery, audit, and remote-exposure burdens beyond trusted local TUI use."
  classification: INFERENCE
  confidence: HIGH
  scope: "current beta subagent, local persistence, hooks, and hidden serve; not a rejection of Continue as a product"
  source_ids: [S-019, S-029, S-030, S-031, S-042, S-043, S-044]
  fact_dependencies: [C-010, C-017, C-019, C-022, C-027]
  method: "Combined the named observed boundaries and shared-state inference under unattended/concurrent/remote scenarios."
  counterevidence: "external firewalling, serialization, and trusted repositories may reduce but do not remove the underlying mechanisms"
  adversarial_status: SUPPORTED
- claim_id: C-038
  section: transferable-patterns
  statement: "A typed service-driven model/tool loop with explicit preprocessing, ordered statuses, parallel approved calls, and durable snapshots is a transferable candidate if isolation, versioning, transactions, and capability enforcement are added."
  classification: INFERENCE
  confidence: HIGH
  scope: "research pattern candidate only; Continue authority defaults are excluded from transfer"
  source_ids: [S-009, S-010, S-011, S-012]
  fact_dependencies: [C-007, C-008, C-012, C-017]
  method: "Abstracted the minimal mechanism from the traced loop while making missing enforcement/persistence prerequisites explicit."
  counterevidence: "current singleton and non-atomic implementations require adaptation rather than direct copying"
  adversarial_status: NOT_APPLICABLE:research-pattern
- claim_id: C-039
  section: transferable-patterns
  statement: "A bounded worker in a detached worktree with timeout, diff capture, and cleanup is a transferable review candidate subject to secret, argument, concurrency, and conflict controls."
  classification: INFERENCE
  confidence: HIGH
  scope: "review-worker pattern only; not an approval to adopt"
  source_ids: [S-020, S-021]
  fact_dependencies: [C-018]
  method: "Abstracted the review lifecycle and preserved its file/process boundary and stated prerequisites."
  counterevidence: "inherited credentials/network and shell-built Git commands require additional controls"
  adversarial_status: NOT_APPLICABLE:research-pattern
- claim_id: C-040
  section: transferable-patterns
  statement: "Layered first-match permission matching is conditionally transferable only with deny-by-default semantics, canonical capabilities, complete path normalization, explicit headless policy, and override tests."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "policy vocabulary, not current Continue defaults or executor authority"
  source_ids: [S-013, S-014, S-015]
  fact_dependencies: [C-020, C-021]
  method: "Separated reusable matching vocabulary from observed allow/default and enforcement weaknesses."
  counterevidence: "current high-risk classification can be overridden by a headless allow default"
  adversarial_status: CHALLENGED
- claim_id: C-041
  section: rejected-patterns-curiosity-no-go
  statement: "Direct host-shell execution under wildcard headless allow is CURIOSITY_NO_GO for autonomous or multi-tenant transfer without separately qualified capability isolation and receipts."
  classification: INFERENCE
  confidence: HIGH
  scope: "direct mechanism transfer into autonomous/multi-tenant harnesses; trusted local Continue use is not rejected"
  source_ids: [S-013, S-014, S-015, S-016]
  fact_dependencies: [C-020, C-021]
  method: "Compared observed default authority and host execution against the preserved process/filesystem/network trust boundary."
  counterevidence: "reopen only if sandbox, canonical capability, cancellation, egress/secret, and receipt controls are proven"
  adversarial_status: SUPPORTED
- claim_id: C-042
  section: rejected-patterns-curiosity-no-go
  statement: "An unauthenticated general-interface agent server with state/control routes and repository-supplied install shell is CURIOSITY_NO_GO for transfer."
  classification: INFERENCE
  confidence: HIGH
  scope: "cn serve mechanism as observed; not a rejection of a redesigned authenticated loopback service"
  source_ids: [S-042, S-043, S-044]
  fact_dependencies: [C-027]
  method: "Applied the network/control and repository/process trust boundaries to source and runtime facts."
  counterevidence: "reopen with loopback default, authenticated authorization, CSRF/replay controls, explicit install approval, and negative tests"
  adversarial_status: SUPPORTED
- claim_id: C-043
  section: rejected-patterns-curiosity-no-go
  statement: "Treating declared hook schemas and runners as production audit proof without reachable lifecycle callers is CURIOSITY_NO_GO."
  classification: INFERENCE
  confidence: HIGH
  scope: "bounded current hook implementation/search universe; future reachable event wiring may reopen"
  source_ids: [S-030, S-031]
  fact_dependencies: [C-010, C-022]
  method: "Compared declared hook surfaces with the two-method bounded production-call search."
  counterevidence: "reopen after consequential lifecycle paths emit versioned events and denial/failure/cancel paths are qualified"
  adversarial_status: SUPPORTED
```

## 27. Source ledger {#source-ledger}

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Official Git snapshot identity and clean-state observation"
  url: "https://github.com/continuedev/continue/commit/5522c6f44ca0ac3528b37244818fbfa39b5af470"
  commit_or_ref: "origin/main"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-snapshot"
  symbol: "Git origin, HEAD, tree, date, tag, status, .gitmodules, and submodules"
  line_anchor: "N/A:no-line-anchor"
  command: "git remote get-url origin && git rev-parse HEAD && git rev-parse 'HEAD^{tree}' && git show -s --format='%cI' HEAD && git describe --exact-match --tags HEAD || true; git status --porcelain=v1; test -f .gitmodules && cat .gitmodules || echo .gitmodules=absent; git submodule status"
  command_environment: "macOS arm64; git 2.54.0; detached filtered clone in approved disposable temp; target code not executed"
  output_or_hash: "inline:origin=https://github.com/continuedev/continue.git; HEAD=5522c6f44ca0ac3528b37244818fbfa39b5af470; tree=bbcc2608abd0c2794cc01084ca5bad376f2e731a; date=2026-07-20T21:00:09-07:00; exact_tag=none; status=clean; .gitmodules=absent; submodules=none"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-001]
  notes: "Primary immutable identity source; no repository file was modified."
- source_id: S-002
  source_kind: release-metadata
  title: "Exact npm metadata for @continuedev/cli 1.5.47"
  url: "https://registry.npmjs.org/@continuedev%2fcli/1.5.47"
  commit_or_ref: "1.5.47"
  resolved_commit: "d3f60ba9dd3fb5bfd3c91d6fbb41ce1aa768db45"
  package_identity: "@continuedev/cli@1.5.47+integrity=sha512-gtpewV3RoIOD9dyTtKIBi1SY0VOHRu3Ehe7C/mmnswm+j34MPyrcQhQaWj/m+jdfGO4fNIKdrgGIlLso1ULDFw=="
  code_path: "package.json registry document"
  symbol: "version; time; dist.integrity; dist.shasum; dist.fileCount; dist.attestations; bin"
  line_anchor: "/version,/time/1.5.47,/dist/integrity,/dist/shasum,/dist/fileCount,/dist/attestations,/bin"
  command: "curl -fsSL 'https://registry.npmjs.org/@continuedev%2fcli' -o continue-cli-registry.json && shasum -a 256 continue-cli-registry.json"
  command_environment: "macOS arm64; curl 8.7.1; passive HTTPS registry retrieval; no npm scripts"
  output_or_hash: "sha256:39b14e01c2e4fbac04560ae38dc859458f88e21595afd5f0cb0e3fd4a3d723af"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-002, C-025]
  notes: "Retained full registry document establishes latest-at-cutoff and exact publication metadata; exact tarball bytes are S-003."
- source_id: S-003
  source_kind: package-artifact
  title: "Exact @continuedev/cli 1.5.47 tarball static inspection"
  url: "https://registry.npmjs.org/@continuedev/cli/-/cli-1.5.47.tgz"
  commit_or_ref: "1.5.47"
  resolved_commit: "d3f60ba9dd3fb5bfd3c91d6fbb41ce1aa768db45"
  package_identity: "@continuedev/cli@1.5.47+sha256:bcf43fd5db041dbff4ee2eb9639a8cc732eba5d7f5ea137c0ef2025976fa3724+integrity=sha512-gtpewV3RoIOD9dyTtKIBi1SY0VOHRu3Ehe7C/mmnswm+j34MPyrcQhQaWj/m+jdfGO4fNIKdrgGIlLso1ULDFw=="
  code_path: "package/package.json; package/dist/cn.js; 454-member archive"
  symbol: "package manifest, executable bin, member list, LICENSE/NOTICE absence"
  line_anchor: "N/A:archive-members-not-line-addressed"
  command: "curl -fsSL 'https://registry.npmjs.org/@continuedev/cli/-/cli-1.5.47.tgz' -o cli-1.5.47.tgz && shasum -a 256 cli-1.5.47.tgz && tar -tzf cli-1.5.47.tgz | tee members.txt | wc -l && ! grep -Ei '(^|/)(LICENSE|NOTICE)(\\.|$)' members.txt && tar -xOzf cli-1.5.47.tgz package/package.json"
  command_environment: "macOS arm64; curl 8.7.1; bsdtar 3.5.3; static listing/stdout only; no extraction into workspace, installation, or scripts"
  output_or_hash: "sha256:bcf43fd5db041dbff4ee2eb9639a8cc732eba5d7f5ea137c0ef2025976fa3724"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-002, C-005]
  notes: "Digest matched registry SRI; member count was 454; no LICENSE or NOTICE member matched."
- source_id: S-004
  source_kind: release-metadata
  title: "npm publish and SLSA attestations for CLI 1.5.47"
  url: "https://registry.npmjs.org/-/npm/v1/attestations/@continuedev%2fcli@1.5.47"
  commit_or_ref: "1.5.47"
  resolved_commit: "d3f60ba9dd3fb5bfd3c91d6fbb41ce1aa768db45"
  package_identity: "@continuedev/cli@1.5.47+integrity=sha512-gtpewV3RoIOD9dyTtKIBi1SY0VOHRu3Ehe7C/mmnswm+j34MPyrcQhQaWj/m+jdfGO4fNIKdrgGIlLso1ULDFw=="
  code_path: "in-toto statements in npm attestation JSON"
  symbol: "subject.digest.sha512; predicate.buildDefinition.externalParameters.workflow; runInvocationUri; resolvedDependencies"
  line_anchor: "N/A:JSON-document"
  command: "curl -fsSL 'https://registry.npmjs.org/-/npm/v1/attestations/@continuedev%2fcli@1.5.47' -o cli-1.5.47-attestations.json && shasum -a 256 cli-1.5.47-attestations.json"
  command_environment: "macOS arm64; curl 8.7.1; passive HTTPS registry retrieval; statements decoded as untrusted evidence"
  output_or_hash: "sha256:30942ace2484708a9e74292ef6dcaf06a9db6e7082479ab296ebff153874929e"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-002, C-003, C-025]
  notes: "Attestation names workflow run 27790830288, .github/workflows/stable-release.yml, and commit d3f60ba9dd3fb5bfd3c91d6fbb41ce1aa768db45; provenance is not reproducible-build proof."
- source_id: S-005
  source_kind: release-metadata
  title: "CLI provenance commit, missing tag, and bounded main parity"
  url: "https://github.com/continuedev/continue/commit/d3f60ba9dd3fb5bfd3c91d6fbb41ce1aa768db45"
  commit_or_ref: "d3f60ba9dd3fb5bfd3c91d6fbb41ce1aa768db45"
  resolved_commit: "d3f60ba9dd3fb5bfd3c91d6fbb41ce1aa768db45"
  package_identity: "@continuedev/cli@1.5.47+integrity=sha512-gtpewV3RoIOD9dyTtKIBi1SY0VOHRu3Ehe7C/mmnswm+j34MPyrcQhQaWj/m+jdfGO4fNIKdrgGIlLso1ULDFw=="
  code_path: "extensions/cli; core; named shared packages; Git refs"
  symbol: "v1.5.47 tag resolution and d3f60ba..5522c6f runtime diff"
  line_anchor: "N/A:Git-tree-comparison"
  command: "git rev-parse -q --verify refs/tags/v1.5.47; printf 'tag_exit=%s\\n' $?; git diff --name-status d3f60ba9dd3fb5bfd3c91d6fbb41ce1aa768db45..5522c6f44ca0ac3528b37244818fbfa39b5af470 -- extensions/cli core packages/openai-adapters packages/config-types packages/config-yaml packages/llm-info packages/terminal-security"
  command_environment: "macOS arm64; git 2.54.0; official detached clone; static ref/tree comparison"
  output_or_hash: "inline:tag_v1.5.47_exit=1; D core/commands/slash/built-in-legacy/draftIssue.ts; M core/commands/slash/built-in-legacy/index.ts"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-003]
  notes: "Negative tag result is bounded to fetched official refs; path comparison intentionally excludes unrelated repository surfaces."
- source_id: S-006
  source_kind: release-metadata
  title: "VS Code v2.0.0-vscode tag resolution"
  url: "https://github.com/continuedev/continue/commit/03b05ef60c378ff06f9e39ada2e22c95fe9ef6ad"
  commit_or_ref: "v2.0.0-vscode"
  resolved_commit: "03b05ef60c378ff06f9e39ada2e22c95fe9ef6ad"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:Git-tag-metadata"
  symbol: "v2.0.0-vscode resolved commit and date"
  line_anchor: "N/A:no-line-anchor"
  command: "git rev-parse 'v2.0.0-vscode^{}' && git show -s --format='%cI' 'v2.0.0-vscode^{}'"
  command_environment: "macOS arm64; git 2.54.0; official detached clone; static ref inspection"
  output_or_hash: "inline:commit=03b05ef60c378ff06f9e39ada2e22c95fe9ef6ad; date=2026-06-18T17:23:33-07:00"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-004]
  notes: "This pin is intentionally distinct from CLI package provenance and JetBrains/main source."
- source_id: S-007
  source_kind: license
  title: "Repository Apache License 2.0 text"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/LICENSE#L1-L201"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE"
  symbol: "Apache License Version 2.0"
  line_anchor: "L1-L201"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:LICENSE | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static text inspection"
  output_or_hash: "sha256:b14a17598cb08c4c7c82c070731126304e0a75d001ed59fb9ea3955a0b561802"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-005]
  notes: "Actual top-level license text selected over metadata labels; section 6 excludes trademark permission."
- source_id: S-008
  source_kind: repository-file
  title: "Repository and CLI package manifests"
  url: "https://github.com/continuedev/continue/tree/5522c6f44ca0ac3528b37244818fbfa39b5af470"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:not-a-package-artifact"
  code_path: "package.json; extensions/cli/package.json"
  symbol: "workspaces; license; CLI name/version/bin/scripts/dependencies/files"
  line_anchor: "package.json L1-L30; extensions/cli/package.json L1-L153"
  command: "(git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:package.json; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/package.json) | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static manifest inspection"
  output_or_hash: "sha256:0822801f6707b8e0047df06cdfb1d09028580c6b2894c88c2c3a46a5706888d5"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-005, C-006]
  notes: "Grouped because the root workspace and CLI package manifest jointly define the package/composition boundary."
- source_id: S-009
  source_kind: repository-file
  title: "CLI Commander composition root"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/index.ts#L1-L391"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/index.ts"
  symbol: "program command registration; runCli; signal/error handlers"
  line_anchor: "L1-L391"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/index.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:6da369c68bd8ef906385753d43616a8afebdd273250093cf34d28439e8ca59e3"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-006, C-007, C-024, C-034, C-038]
  notes: "Primary CLI entrypoint; hidden serve and internal review-worker registration are included."
- source_id: S-010
  source_kind: repository-file
  title: "CLI chat, headless, and service lifecycle"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/commands/chat.ts#L1-L641"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/commands/chat.ts"
  symbol: "chat; runHeadless; stdin/prompt/session/service initialization and exit"
  line_anchor: "L1-L641"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/commands/chat.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:01d62ed2617abdfc8be2389d13c3258cec92c246a2cbacfe93bfa60efab572a9"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-007, C-008, C-034, C-038]
  notes: "Selected as the common TUI/headless composition path; live model execution was excluded."
- source_id: S-011
  source_kind: repository-file
  title: "Streaming model/tool turn loop"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/stream/streamChatResponse.ts#L1-L591"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/stream/streamChatResponse.ts"
  symbol: "streamChatResponse; request construction; retries; tool iterations; usage; abort"
  line_anchor: "L1-L591"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/stream/streamChatResponse.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:67de037243ea2a29702e4405b85b4553aeb82ae4d640136f2a4cd398b48871de"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-008, C-012, C-015, C-024, C-030, C-034, C-038]
  notes: "Static control-flow evidence only; provider output and retries were not executed."
- source_id: S-012
  source_kind: repository-file
  title: "Streamed tool-call preprocessing, permission, execution, and usage helpers"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/stream/streamChatResponse.helpers.ts#L1-L649"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/stream/streamChatResponse.helpers.ts"
  symbol: "preprocessStreamedToolCalls; executeStreamedToolCalls; permission checks; usage conversion"
  line_anchor: "L1-L649"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/stream/streamChatResponse.helpers.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:abc32a1cfef723c9f3913024659a9f37737d2d83e3c3508bd63aedf1c630c139"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-008, C-012, C-023, C-024, C-030, C-034, C-038]
  notes: "Executable logic, rather than stale comments, determines the retained denial and sibling-execution findings."
- source_id: S-013
  source_kind: repository-file
  title: "ToolPermissionService enforcement"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/services/ToolPermissionService.ts#L1-L408"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/services/ToolPermissionService.ts"
  symbol: "ToolPermissionService; evaluateToolPermission; mode/base-policy resolution"
  line_anchor: "L1-L408"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/services/ToolPermissionService.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:82325a92515a4dc05601c05d8f7739034d091736329bc3f488181cbfdb7ee494"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-012, C-020, C-036, C-040, C-041]
  notes: "Policy evaluation is an application gate, not an OS sandbox."
- source_id: S-014
  source_kind: repository-file
  title: "Permission manager and first-match checker"
  url: "https://github.com/continuedev/continue/tree/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/permissions"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/permissions/permissionManager.ts; extensions/cli/src/permissions/permissionChecker.ts"
  symbol: "PermissionManager; checkPermission; matchesToolPattern; first matching policy"
  line_anchor: "permissionManager.ts L1-L98; permissionChecker.ts L1-L181"
  command: "(git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/permissions/permissionManager.ts; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/permissions/permissionChecker.ts) | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:f5407dafd7445a0baf871703e94ba5da044fb1143fa7d1598f0566802fd408eb"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-012, C-020, C-036, C-040, C-041]
  notes: "Grouped to preserve policy storage and matching semantics in one boundary record."
- source_id: S-015
  source_kind: repository-file
  title: "Default mode policies and runtime overrides"
  url: "https://github.com/continuedev/continue/tree/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/permissions"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/permissions/defaultPolicies.ts; extensions/cli/src/permissions/runtimeOverrides.ts"
  symbol: "normal/headless/plan/auto defaults; runtime policy overrides"
  line_anchor: "defaultPolicies.ts L1-L71; runtimeOverrides.ts L1-L49"
  command: "(git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/permissions/defaultPolicies.ts; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/permissions/runtimeOverrides.ts) | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:a8cd50d50470d004d9d8b5c49933f45fb7197d44694e967b5f23998d32161dc5"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-020, C-040, C-041]
  notes: "Selected to distinguish mode defaults from user and classifier layers."
- source_id: S-016
  source_kind: repository-file
  title: "Bash terminal tool implementation"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/tools/runTerminalCommand.ts#L1-L379"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/tools/runTerminalCommand.ts"
  symbol: "Bash tool preprocess/run; login shell; cwd/environment; inactivity/background behavior"
  line_anchor: "L1-L379"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/tools/runTerminalCommand.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; shell tool not executed"
  output_or_hash: "sha256:efdb705b615427503bb765d766028b97018d17eaba527e4bae3d274d9ab33d87"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-020, C-021, C-024, C-036, C-041]
  notes: "Consequential process authority was inspected statically to avoid unsafe command execution."
- source_id: S-017
  source_kind: repository-file
  title: "Read and Edit path handling"
  url: "https://github.com/continuedev/continue/tree/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/tools"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/tools/readFile.ts; extensions/cli/src/tools/edit.ts"
  symbol: "Read/Edit preprocessors, realpath, absolute paths, sensitive-path checks, writes"
  line_anchor: "readFile.ts L1-L125; edit.ts L1-L193"
  command: "(git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/tools/readFile.ts; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/tools/edit.ts) | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; no filesystem-abuse execution"
  output_or_hash: "sha256:813c85e3e27f74f8768a31c40f4326d8c72f7a01f12c49c9be965004a4f7cbce"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-021, C-031, C-036]
  notes: "Existing-path canonicalization does not establish workspace-root containment."
- source_id: S-018
  source_kind: repository-file
  title: "Write path handling"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/tools/writeFile.ts#L1-L184"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/tools/writeFile.ts"
  symbol: "Write tool schema, preprocessing, mkdir, writeFileSync"
  line_anchor: "L1-L184"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/tools/writeFile.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; no host write probe"
  output_or_hash: "sha256:e681b27ebd958b3d6d39e0afed93b25ea82a23c82f5ddcd19cd8857bb184aadd"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-021, C-031, C-036]
  notes: "No workspace-root comparison appears in this implementation; dynamic traversal/symlink outcomes remain unknown."
- source_id: S-019
  source_kind: repository-file
  title: "Beta subagent executor shared-service mutation"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/subagent/executor.ts#L1-L213"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/subagent/executor.ts"
  symbol: "executeSubAgent; child history; abort; wildcard permission; singleton save/restore"
  line_anchor: "L1-L213"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/subagent/executor.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; concurrent execution not run"
  output_or_hash: "sha256:c8c2ad8294c34be82098511ba35dd871265d89878acdb8e64aaa1062de36eab9"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-011, C-019, C-031, C-037]
  notes: "The overlap conclusion is an inference; assignments and finally restoration are direct facts."
- source_id: S-020
  source_kind: repository-file
  title: "Review orchestrator concurrency and worker lifecycle"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/commands/review.ts#L1-L417"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/commands/review.ts"
  symbol: "review; Promise.allSettled; fail-fast; fork; five-minute timeout; cleanup"
  line_anchor: "L1-L417"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/commands/review.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; workers not launched"
  output_or_hash: "sha256:9b7935e1541240a0806eb4b882197c803dfdde1d85e4e67733e88c4b2c3c72af"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-011, C-018, C-024, C-035, C-039]
  notes: "Static evidence establishes scheduling and timeout ownership, not runtime cleanup success."
- source_id: S-021
  source_kind: repository-file
  title: "Review detached-worktree and worker implementation"
  url: "https://github.com/continuedev/continue/tree/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/commands/review"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/commands/review/worktree.ts; extensions/cli/src/commands/review/reviewWorker.ts"
  symbol: "createWorktree; cleanupWorktree; runReviewWorker; diff/result protocol"
  line_anchor: "worktree.ts L1-L116; reviewWorker.ts L1-L206"
  command: "(git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/commands/review/worktree.ts; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/commands/review/reviewWorker.ts) | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; no worktree mutation performed"
  output_or_hash: "sha256:30be865db4ebe9097255d29101d6411e913fc39432366929456fb761b2c0ee63"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-011, C-018, C-035, C-039]
  notes: "Worktree isolation covers Git files, not inherited environment, network, or credentials."
- source_id: S-022
  source_kind: repository-file
  title: "CLI model selection and LLM adapter handoff"
  url: "https://github.com/continuedev/continue/tree/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/services/ModelService.ts; extensions/cli/src/config.ts"
  symbol: "ModelService initialization/switching; createLlmApi; role/default selection"
  line_anchor: "ModelService.ts L1-L329; config.ts L1-L99"
  command: "(git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/services/ModelService.ts; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/config.ts) | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:38513157bfc513f2450905bbf60b366b6df9d40fe51b80958cb977eddbf52764"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-013, C-015, C-030, C-034]
  notes: "CLI auth object behavior is bounded to createLlmApi at this snapshot."
- source_id: S-023
  source_kind: repository-file
  title: "OpenAI adapter provider construction and base streaming contract"
  url: "https://github.com/continuedev/continue/tree/5522c6f44ca0ac3528b37244818fbfa39b5af470/packages/openai-adapters/src"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "packages/openai-adapters/src/index.ts; packages/openai-adapters/src/apis/base.ts"
  symbol: "constructLlmApi; BaseLlmApi; provider map and stream methods"
  line_anchor: "index.ts L1-L245; apis/base.ts L1-L90"
  command: "(git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:packages/openai-adapters/src/index.ts; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:packages/openai-adapters/src/apis/base.ts) | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; no provider request"
  output_or_hash: "sha256:959f038ce5157ce866dd8709bb00727eac9d43e8e66cd5b86fecf0c39e5b23fb"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-013, C-030]
  notes: "Provider-specific SDK internals and hosted proxy implementation remain outside this source record."
- source_id: S-024
  source_kind: repository-file
  title: "CLI MCP discovery, invocation, and lifecycle"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/services/MCPService.ts#L1-L483"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/services/MCPService.ts"
  symbol: "MCPService initialize/discover/run/restart/shutdown"
  line_anchor: "L1-L483"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/services/MCPService.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; MCP servers not launched"
  output_or_hash: "sha256:6447599bac7e25822a2ff219b2f9183a3b4223fa2025ce42c79b0df4ec708da7"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-014, C-034]
  notes: "MCP server behavior and malicious output handling were not dynamically qualified."
- source_id: S-025
  source_kind: repository-file
  title: "MCP transport factory and TLS/process options"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/services/mcpTransports.ts#L1-L105"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/services/mcpTransports.ts"
  symbol: "stdio, SSE, and streamable HTTP transport construction"
  line_anchor: "L1-L105"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/services/mcpTransports.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; transports not connected"
  output_or_hash: "sha256:ee46a9bbc7b2995a3e62a31ea16212963ce38c7e8fe795457e8737df3186885e"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-014]
  notes: "The configured rejectUnauthorized=false and inherited stdio environment are source-observed, not runtime-tested."
- source_id: S-026
  source_kind: repository-file
  title: "CLI dynamic system-message and repository-rule assembly"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/systemMessage.ts#L1-L269"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/systemMessage.ts"
  symbol: "constructSystemMessage; agent files; rules; Git/platform/date/mode context"
  line_anchor: "L1-L269"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/systemMessage.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:dd44560c676b5c6df22d38baa9d2ca1b0dd88d03c960795e328e4b3f692a3e1d"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-016, C-036]
  notes: "Repository text was treated as untrusted evidence; no instruction embedded in it was followed."
- source_id: S-027
  source_kind: repository-file
  title: "Context fitting and compaction implementation"
  url: "https://github.com/continuedev/continue/tree/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/compaction.ts; extensions/cli/src/stream/streamChatResponse.compactionHelpers.ts"
  symbol: "compactChatHistory; prune/summary marker; pre/post API compaction; auto continuation"
  line_anchor: "compaction.ts L1-L315; streamChatResponse.compactionHelpers.ts L1-L221"
  command: "(git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/compaction.ts; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/stream/streamChatResponse.compactionHelpers.ts) | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; no live summary generation"
  output_or_hash: "sha256:6b9ef22d6924bc0432b65e4e5e88d576e3ed8989f93f68f5d3bbc558441469cb"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-015, C-016]
  notes: "Algorithm ownership and persistence are observed; summary fidelity and exact token agreement are not."
- source_id: S-028
  source_kind: repository-file
  title: "CLI session state, usage, save/load, resume, and fork"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/session.ts#L1-L603"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/session.ts"
  symbol: "Session; save/load/list/resume/fork; usage accumulation and migration"
  line_anchor: "L1-L603"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/session.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; crash not injected"
  output_or_hash: "sha256:08f9d93f804fed2b9cb6f153f931d2fbd470466de7ab5f4f040c78e3281e3e2b"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-017, C-023, C-031]
  notes: "Direct JSON write behavior is corroborated by ChatHistoryService in S-029."
- source_id: S-029
  source_kind: repository-file
  title: "ChatHistoryService local persistence and parse behavior"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/services/ChatHistoryService.ts#L1-L546"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/services/ChatHistoryService.ts"
  symbol: "ChatHistoryService; mutation saves; metadata/session JSON; malformed load paths"
  line_anchor: "L1-L546"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/services/ChatHistoryService.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; concurrent writers not run"
  output_or_hash: "sha256:a0538c91129d33f78ecf087bbff55f8ebbae29a4e29504d5a4c1c17e37d22d81"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-017, C-031, C-037]
  notes: "No temp-file rename, cross-file transaction, or explicit lock was found in the named persistence path."
- source_id: S-030
  source_kind: repository-file
  title: "Hook service, wrappers, configuration, and runner boundary"
  url: "https://github.com/continuedev/continue/tree/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/hooks"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/hooks/HookService.ts; extensions/cli/src/hooks/fireHook.ts"
  symbol: "HookService.fireEvent and typed fire* wrappers"
  line_anchor: "HookService.ts L1-L128; fireHook.ts L1-L231"
  command: "(git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/hooks/HookService.ts; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/hooks/fireHook.ts) | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:b6b7a824ba7079266fe043c0164f72c95675ac1837a38ac8ff012887539a8634"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-010, C-022, C-037, C-043]
  notes: "Presence establishes implementation only; production reachability is challenged by S-031."
- source_id: S-031
  source_kind: runtime-observation
  title: "Hashed 705-file production TypeScript absence search"
  url: "https://github.com/continuedev/continue/tree/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:not-a-package"
  code_path: "extensions/cli/src; core; extensions/vscode/src; retained artifact continue-static-search.txt"
  symbol: "HookService.fireEvent caller search and workspace/sandbox containment-term search"
  line_anchor: "N/A:multi-file-static-search"
  command: "shasum -a 256 continue-static-search.txt && sed -n '1,200p' continue-static-search.txt"
  command_environment: "macOS arm64; ripgrep 15.0.0; exact pinned clone; 705 retained non-test TypeScript files; no target execution"
  output_or_hash: "sha256:0191e0eea46f6cb46aaa7eb2f193a6fd88441ba210c5ffd7fe313c25c0e51c5b"
  access_date: "2026-08-25 UTC"
  supports_claims: [C-010, C-021, C-022, C-031, C-036, C-037, C-043]
  notes: "Retained by researcher session ses_fc91c3569ffeY4VxZCTUnRLWkk under the approved temp root; output states universe=705, no hook callers after the implementation boundary, and only the listed containment-term matches. This is bounded absence evidence, not global absence."
- source_id: S-032
  source_kind: repository-file
  title: "Optional OTEL metrics and usage/evidence fields"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/telemetry/telemetryService.ts#L1-L618"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/telemetry/telemetryService.ts"
  symbol: "TelemetryService initialization; metrics; token/cost/timing/edit/auth fields; TODO event logs"
  line_anchor: "L1-L618"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/telemetry/telemetryService.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; no exporter configured"
  output_or_hash: "sha256:fa79eaa63b851a73378de9b6e46602d3b5a8e3eb6d77235a51de457b2331dbc6"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-022, C-023]
  notes: "Metrics configuration gates export; source does not establish backend receipt or retention."
- source_id: S-033
  source_kind: repository-file
  title: "CLI rotating local logging"
  url: "https://github.com/continuedev/continue/tree/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/logging.ts; extensions/cli/src/util/logger.ts"
  symbol: "logger construction; random process ID; rotating cn.log path and levels"
  line_anchor: "logging.ts L1-L74; util/logger.ts L1-L181"
  command: "(git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/logging.ts; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/util/logger.ts) | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:dfe5f349b85c0d79e35196e90547e6ea0480889273d4f79e6ddbeb5932714d7b"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-022]
  notes: "Local log creation is independently observed in S-044."
- source_id: S-034
  source_kind: repository-file
  title: "Verbose process resource monitoring"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/services/ResourceMonitoringService.ts#L1-L330"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/services/ResourceMonitoringService.ts"
  symbol: "ResourceMonitoringService CPU/memory/event-loop/FD samples, retention, and warnings"
  line_anchor: "L1-L330"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/services/ResourceMonitoringService.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; verbose monitor not run"
  output_or_hash: "sha256:da3d531d03e1dcdc1e85febe316313ca96f45874dd169f4270cf962e71ccc494"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-023]
  notes: "The service reports/warns and does not enforce CPU, memory, FD, token, or monetary quotas."
- source_id: S-035
  source_kind: repository-file
  title: "Interactive mutable-latest update and restart"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/services/UpdateService.ts#L1-L238"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/services/UpdateService.ts"
  symbol: "UpdateService defaults/check/download via npm i -g @continuedev/cli and restart"
  line_anchor: "L1-L238"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/services/UpdateService.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; update command not executed"
  output_or_hash: "sha256:d926ed4a2804cbfb391b0386b037a19aa779a662772f42c46f3481f118184698"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-025]
  notes: "No mutable install, restart, rollback, or migration was run."
- source_id: S-036
  source_kind: repository-file
  title: "Stable CLI release workflow"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/.github/workflows/stable-release.yml#L1-L134"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: ".github/workflows/stable-release.yml"
  symbol: "stable-release test/build/npm publish --provenance/tag steps and OIDC permissions"
  line_anchor: "L1-L134"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:.github/workflows/stable-release.yml | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static workflow inspection; workflow not re-run"
  output_or_hash: "sha256:4ef11291d1f32ab5348948f29bef3cd9cd02b2d81abc64a180d66bce88d9eb48"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-003, C-025]
  notes: "Workflow intent is secondary to the S-004 attestation and S-005 observed missing tag."
- source_id: S-037
  source_kind: repository-file
  title: "Eager version-information and machine-ID request"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/version.ts#L1-L105"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/version.ts"
  symbol: "machineIdSync; api.continue.dev/cn/info; getVersionInfo eager promise"
  line_anchor: "L1-L105"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/version.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:fc4e04e861f90f20dac9d9fe32e71945d7545ef4d898cde8fea7f01cbd6699bf"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-025, C-029]
  notes: "Denied-network runtime corroboration is S-044."
- source_id: S-038
  source_kind: runtime-observation
  title: "Exact static test-file inventory and CLI PR workflow"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/.github/workflows/cli-pr-checks.yml#L1-L185"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/cli-pr-checks.yml; extensions/cli; extensions/vscode; extensions/intellij; core"
  symbol: "test globs and CLI PR operating-system/Node/E2E/smoke matrix"
  line_anchor: "cli-pr-checks.yml L1-L185; N/A:file-name inventory"
  command: "printf 'cli='; find extensions/cli -type f '(' -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.vitest.ts' -o -name '*.vitest.tsx' ')' | wc -l; printf 'vscode='; find extensions/vscode -type f '(' -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.vitest.ts' -o -name '*.vitest.tsx' ')' | wc -l; printf 'jetbrains='; find extensions/intellij -path '*/src/test/*' -type f | wc -l; printf 'core='; find core -type f -name '*.test.ts' | wc -l; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:.github/workflows/cli-pr-checks.yml | shasum -a 256"
  command_environment: "macOS arm64; find; git 2.54.0; pinned clean clone; static inventory only; no suite run"
  output_or_hash: "inline:cli=177; vscode=11; jetbrains=7; core=58; workflow_sha256=56b638abd00ef1536f29dc9afdc3249066c29345979f4bbfde90735fb3b15120"
  access_date: "2026-08-25 UTC"
  supports_claims: [C-026]
  notes: "Core count intentionally uses *.test.ts and excludes 96 *.vitest.ts files; counts qualify only the recorded globs."
- source_id: S-039
  source_kind: repository-file
  title: "VS Code in-process Core composition"
  url: "https://github.com/continuedev/continue/blob/03b05ef60c378ff06f9e39ada2e22c95fe9ef6ad/extensions/vscode/src/extension/VsCodeExtension.ts#L1-L649"
  commit_or_ref: "v2.0.0-vscode"
  resolved_commit: "03b05ef60c378ff06f9e39ada2e22c95fe9ef6ad"
  package_identity: "N/A:not-a-package"
  code_path: "extensions/vscode/src/extension/VsCodeExtension.ts"
  symbol: "VsCodeExtension; InProcessMessenger; new Core; webview/IDE wiring"
  line_anchor: "L1-L649"
  command: "git show 03b05ef60c378ff06f9e39ada2e22c95fe9ef6ad:extensions/vscode/src/extension/VsCodeExtension.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection at VS Code release tag"
  output_or_hash: "sha256:95a1bb20e0a831022d0f27ea00f3c6864c6ca5179233bf2339229bac8045a6ec"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-006, C-009, C-033]
  notes: "Source composition does not establish marketplace package parity or runtime startup."
- source_id: S-040
  source_kind: repository-file
  title: "VS Code typed webview/Core/IDE protocol bridge"
  url: "https://github.com/continuedev/continue/tree/03b05ef60c378ff06f9e39ada2e22c95fe9ef6ad/extensions/vscode/src"
  commit_or_ref: "v2.0.0-vscode"
  resolved_commit: "03b05ef60c378ff06f9e39ada2e22c95fe9ef6ad"
  package_identity: "N/A:not-a-package"
  code_path: "extensions/vscode/src/extension/VsCodeMessenger.ts; extensions/vscode/src/webviewProtocol.ts"
  symbol: "VsCodeMessenger typed handlers and VsCodeWebviewProtocol request/response"
  line_anchor: "VsCodeMessenger.ts L1-L426; webviewProtocol.ts L1-L172"
  command: "(git show 03b05ef60c378ff06f9e39ada2e22c95fe9ef6ad:extensions/vscode/src/extension/VsCodeMessenger.ts; git show 03b05ef60c378ff06f9e39ada2e22c95fe9ef6ad:extensions/vscode/src/webviewProtocol.ts) | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection at VS Code release tag"
  output_or_hash: "sha256:9129c3919ef7708c81ddd1250aca8c66c693a60e6b53e54b5d25b4b5faeb9f10"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-006, C-009, C-033]
  notes: "Protocol typing is source-level and not a cross-version compatibility guarantee."
- source_id: S-041
  source_kind: repository-file
  title: "JetBrains bundled core process and line-delimited stdio bridge"
  url: "https://github.com/continuedev/continue/tree/5522c6f44ca0ac3528b37244818fbfa39b5af470/binary/src"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:not-a-package"
  code_path: "binary/src/index.ts; binary/src/IpcMessenger.ts; extensions/intellij/src/main/kotlin/com/github/continuedev/continueintellijextension/continue/process/ContinueBinaryProcess.kt; ContinueProcessHandler.kt"
  symbol: "binary Core construction; IpcMessenger CRLF framing; ProcessBuilder; line reader"
  line_anchor: "binary index.ts L1-L48; IpcMessenger.ts L1-L293; ContinueBinaryProcess.kt L1-L82; ContinueProcessHandler.kt L1-L65"
  command: "(git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:binary/src/index.ts; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:binary/src/IpcMessenger.ts; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/intellij/src/main/kotlin/com/github/continuedev/continueintellijextension/continue/process/ContinueBinaryProcess.kt; git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/intellij/src/main/kotlin/com/github/continuedev/continueintellijextension/continue/process/ContinueProcessHandler.kt) | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; bundled binary not executed"
  output_or_hash: "sha256:e13b54a8737def5ad1891f55ac1da285527864ce8d1e71f74677db779861c14a"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-006, C-009, C-033]
  notes: "Main-source transport boundary is observed; built artifact parity remains unknown."
- source_id: S-042
  source_kind: repository-file
  title: "Hidden cn serve routes, listen, abort, and inactivity lifecycle"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/commands/serve.ts#L1-L605"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/commands/serve.ts"
  symbol: "serve; Express routes; app.listen(port); pause/exit; inactivity shutdown"
  line_anchor: "L1-L605"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/commands/serve.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection"
  output_or_hash: "sha256:870d0be86ca7a61ae5442d707206cb00ab3a0191638d56f91c860572ce3b5c0f"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-024, C-027, C-037, C-042]
  notes: "No authentication middleware or host argument appears in the route/listen construction."
- source_id: S-043
  source_kind: repository-file
  title: "Repository environment install-shell handler"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/environment/environmentHandler.ts#L1-L123"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/environment/environmentHandler.ts"
  symbol: "findEnvironmentConfig; runEnvironmentInstallScript; execAsync install"
  line_anchor: "L1-L123"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/environment/environmentHandler.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; install shell not executed"
  output_or_hash: "sha256:1ac52f5ec5c6a71cd7d6f86b75b9d87717757d6a173ab67bfcc12515b7726e79"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-027, C-037, C-042]
  notes: "Repository text was treated as untrusted data; no environment install was placed in the probe repository."
- source_id: S-044
  source_kind: runtime-observation
  title: "Denied-network version and local-bind serve probes of exact CLI 1.5.47"
  url: "https://registry.npmjs.org/@continuedev/cli/-/cli-1.5.47.tgz"
  commit_or_ref: "1.5.47"
  resolved_commit: "d3f60ba9dd3fb5bfd3c91d6fbb41ce1aa768db45"
  package_identity: "@continuedev/cli@1.5.47+sha256:bcf43fd5db041dbff4ee2eb9639a8cc732eba5d7f5ea137c0ef2025976fa3724"
  code_path: "package/dist/cn.js; disposable config.yaml; retained probe outputs"
  symbol: "cn --version; cn serve --port 38087/38088 --timeout 4; GET /state"
  line_anchor: "N/A:runtime-output"
  command: >-
    PROBE=/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/continue-probe; CLI="$PROBE/package/dist/cn.js"; HOME="$PROBE/home" sandbox-exec -f "$PROBE/no-network.sb" node "$CLI" --version >"$PROBE/version.stdout" 2>"$PROBE/version.stderr"; cd "$PROBE/cwd"; HOME="$PROBE/home2" sandbox-exec -f "$PROBE/bind-only.sb" node "$CLI" --config ./config.yaml serve --port 38087 --timeout 4 >"$PROBE/serve.stdout" 2>"$PROBE/serve.stderr" & pid=$!; sleep 1; lsof -nP -iTCP:38087 -sTCP:LISTEN >"$PROBE/serve.observation"; wait "$pid"; HOME="$PROBE/home3" sandbox-exec -f "$PROBE/bind-only.sb" node "$CLI" --config ./config.yaml serve --port 38088 --timeout 4 >"$PROBE/serve2.stdout" 2>"$PROBE/serve2.stderr" & pid=$!; sleep 1; { printf 'GET /state without credentials:\n'; curl -i --max-time 2 http://127.0.0.1:38088/state; } >"$PROBE/serve2.http"; wait "$pid"
  command_environment: "macOS arm64; Node 24.18.0; sandbox-exec; exact package bytes; disposable HOME/cwd; no secrets; outbound network denied; local bind/inbound only for serve"
  output_or_hash: "sha256:f402ab181eedf0b76f2d421f04622d83a8cfdd630c20e66b1332ae8da2fdba7a"
  access_date: "2026-08-25 UTC"
  supports_claims: [C-007, C-022, C-027, C-029, C-037, C-042]
  notes: "Retained by researcher in the approved temp root. Decision output: version=1.5.47; stderr=/bin/sh: ioreg: command not found; default permissions and 200-byte cn.log created; TCP *:38087 LISTEN; unauthenticated GET /state returned 200 and session/workspace JSON; inactivity exits were 0. The copied combined command abbreviates two identical serve runs; retained files preserve exact outputs."
- source_id: S-045
  source_kind: repository-file
  title: "Hosted checks status and control client"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/commands/checks.ts#L1-L319"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/commands/checks.ts"
  symbol: "checks; listChecks; acceptChecks; rejectChecks; api/checks/status"
  line_anchor: "L1-L319"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/commands/checks.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; hosted endpoint not called"
  output_or_hash: "sha256:0aea93633763589e5e57eea2ead64a7c9f54e57b592df26b19c28a1b8e2f54ac"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-028]
  notes: "This is a client boundary; hosted service implementation and authorization are outside the snapshot."
- source_id: S-046
  source_kind: repository-file
  title: "Optional Continue-managed storage synchronization"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/services/StorageSyncService.ts#L1-L415"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:repository-source"
  code_path: "extensions/cli/src/services/StorageSyncService.ts"
  symbol: "StorageSyncService presign, periodic session/diff upload, status, refresh, errors"
  line_anchor: "L1-L415"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:extensions/cli/src/services/StorageSyncService.ts | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static source inspection; no token or upload"
  output_or_hash: "sha256:bff465870fc4f68f010b084ee1d55f912821b1a4764f03929008f2c1ffcc2250"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-028]
  notes: "Presigned target issuer, object store, retention, and hosted authorization are not included."
- source_id: S-047
  source_kind: official-documentation
  title: "Continue security reporting policy"
  url: "https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/SECURITY.md#L1-L16"
  commit_or_ref: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  package_identity: "N/A:not-a-package"
  code_path: "SECURITY.md"
  symbol: "security reporting email and disclosure request"
  line_anchor: "L1-L16"
  command: "git show 5522c6f44ca0ac3528b37244818fbfa39b5af470:SECURITY.md | shasum -a 256"
  command_environment: "macOS arm64; git 2.54.0; static documentation inspection"
  output_or_hash: "sha256:6524c18d1ebd461a0ff5a5db2fd0bdbe04ae6c3205f54c2b810c8cf757439897"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-032]
  notes: "Reporting instructions do not enumerate advisories or establish vulnerability absence."
- source_id: S-048
  source_kind: security-advisory
  title: "Inconclusive GitHub repository-advisory query"
  url: "https://api.github.com/repos/continuedev/continue/security-advisories?per_page=100"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "HTTP status and X-RateLimit fields for repository security-advisory enumeration"
  line_anchor: "N/A:HTTP-response"
  command: "curl -sS -D continue-security-advisories.headers -o continue-security-advisories.json 'https://api.github.com/repos/continuedev/continue/security-advisories?per_page=100'; cat continue-security-advisories.headers continue-security-advisories.json | shasum -a 256"
  command_environment: "macOS arm64; curl 8.7.1; unauthenticated GitHub API; no credentials"
  output_or_hash: "sha256:a076a76347f73515badf035b6fe731d3d18666b2ba7658eccc6d43e258a8ae88"
  access_date: "2026-08-25 UTC"
  supports_claims: [C-032]
  notes: "Retained response was HTTP/2 403, X-RateLimit-Remaining: 0, and API rate limit exceeded; this is negative/inconclusive evidence, not zero advisories. A vulnerability-alert 404/disabled result was likewise not treated as absence. Repetition was CURIOSITY_NO_GO."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "continue-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "Continue"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/continuedev/continue"
  resolved_commit: "5522c6f44ca0ac3528b37244818fbfa39b5af470"
  observed_ref: "main; CLI provenance commit d3f60ba9dd3fb5bfd3c91d6fbb41ce1aa768db45; VS Code tag v2.0.0-vscode"
  package_identity: "@continuedev/cli@1.5.47+sha512-gtpewV3RoIOD9dyTtKIBi1SY0VOHRu3Ehe7C/mmnswm+j34MPyrcQhQaWj/m+jdfGO4fNIKdrgGIlLso1ULDFw=="
research:
  researcher: "ses_fc91c3569ffeY4VxZCTUnRLWkk"
  owned_path: "research/harnesses/continue.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "OBSERVED"
    summary: "Main source, exact CLI bytes/provenance, and VS Code tag are independently pinned; the expected CLI tag is absent."
    confidence: "HIGH"
    claim_ids: ["C-001", "C-002", "C-003", "C-004"]
    source_ids: ["S-001", "S-002", "S-003", "S-004", "S-005", "S-006"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "OBSERVED"
    summary: "Source and manifests declare Apache-2.0, while the exact CLI archive carries no LICENSE or NOTICE member."
    confidence: "HIGH"
    claim_ids: ["C-005"]
    source_ids: ["S-003", "S-007", "S-008"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "OBSERVED"
    summary: "Current CLI, IDE core/hosts, bundled binary, GUI, shared packages, and supporting surfaces are composition-path mapped as distinct executables."
    confidence: "HIGH"
    claim_ids: ["C-006"]
    source_ids: ["S-008", "S-009", "S-039", "S-040", "S-041"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "PARTIAL"
    summary: "CLI/headless/serve/review/checks and IDE entrypoints are traced, but packaged IDE lifecycle and parity remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-007", "C-009", "C-028", "C-033"]
    source_ids: ["S-009", "S-010", "S-039", "S-040", "S-041", "S-044", "S-045", "S-046"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "PARTIAL"
    summary: "The CLI turn is statically traced end to end, while provider outcomes, duplication, and cleanup are unobserved."
    confidence: "MEDIUM"
    claim_ids: ["C-008", "C-030"]
    source_ids: ["S-010", "S-011", "S-012", "S-022", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "PARTIAL"
    summary: "CLI services/MCP and distinct IDE protocols are mapped; hook declarations lack callers in the bounded production search."
    confidence: "HIGH"
    claim_ids: ["C-009", "C-010"]
    source_ids: ["S-030", "S-031", "S-039", "S-040", "S-041"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "PARTIAL"
    summary: "Beta subagent and review-worker mechanisms are traced, but overlapping child behavior and cancellation cleanup remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-011", "C-019", "C-031"]
    source_ids: ["S-019", "S-020", "S-021", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "PARTIAL"
    summary: "Schema, permission, parallel execution, status, and MCP transport paths are observed without dynamic fuzz or malicious-server qualification."
    confidence: "HIGH"
    claim_ids: ["C-012", "C-014", "C-031"]
    source_ids: ["S-011", "S-012", "S-013", "S-014", "S-024", "S-025", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provider_interface"
    coverage: "UNKNOWN"
    summary: "Adapter selection is observed, but live auth, errors, retries, cancellation, usage, and billing are unknown."
    confidence: "N/A"
    claim_ids: ["C-013", "C-030"]
    source_ids: ["S-011", "S-012", "S-022", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Role/default selection and local limit preparation are observed without live capability negotiation or provider-wide limit validation."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-030"]
    source_ids: ["S-011", "S-022", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "System/rule assembly and compaction are traced, while summary fidelity, token agreement, and injection containment remain unproven."
    confidence: "MEDIUM"
    claim_ids: ["C-016", "C-031"]
    source_ids: ["S-026", "S-027", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "Direct local JSON persistence and parse branches are observed without crash, collision, retention, or repair qualification."
    confidence: "MEDIUM"
    claim_ids: ["C-017", "C-031"]
    source_ids: ["S-028", "S-029", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Review process/worktree separation is observed; same-process subagent/session collisions and races remain unrun."
    confidence: "MEDIUM"
    claim_ids: ["C-018", "C-019", "C-031"]
    source_ids: ["S-019", "S-020", "S-021", "S-028", "S-029", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "PARTIAL"
    summary: "Application policy and broad host authority are observed, with no harness sandbox; dynamic bypass and escape outcomes remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-020", "C-021", "C-031"]
    source_ids: ["S-013", "S-014", "S-015", "S-016", "S-017", "S-018", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Local logs/session state and optional metrics exist, but receipts lack complete reachability, correlation, integrity, and forgery qualification."
    confidence: "MEDIUM"
    claim_ids: ["C-010", "C-022", "C-029", "C-031"]
    source_ids: ["S-030", "S-031", "S-032", "S-033", "S-037", "S-044"]
    pattern_disposition: "NO_POSITION"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Local usage, price fallback, metrics, and resource warnings are observed without budgets or provider-bill reconciliation."
    confidence: "MEDIUM"
    claim_ids: ["C-023", "C-030"]
    source_ids: ["S-012", "S-028", "S-032", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Static abort, retry, timeout, and error owners are mapped; cleanup, idempotency, duplication, and crash behavior remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-024", "C-030", "C-031"]
    source_ids: ["S-009", "S-011", "S-012", "S-016", "S-020", "S-042"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Exact CLI provenance and mutable update behavior are observed; expected tag, rollback, reproducibility, and IDE release parity are incomplete."
    confidence: "MEDIUM"
    claim_ids: ["C-002", "C-003", "C-025", "C-029", "C-033"]
    source_ids: ["S-002", "S-003", "S-004", "S-005", "S-035", "S-036", "S-037", "S-044"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "PARTIAL"
    summary: "Static test globs and CLI workflow intent are inventoried, but no suite, CI result, coverage, or live-provider matrix was run."
    confidence: "HIGH"
    claim_ids: ["C-026"]
    source_ids: ["S-038"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "PARTIAL"
    summary: "Serve exposure and host authority are evidenced, while advisory enumeration and dynamic exploit/deny paths remain unresolved."
    confidence: "MEDIUM"
    claim_ids: ["C-021", "C-027", "C-032"]
    source_ids: ["S-016", "S-017", "S-018", "S-031", "S-042", "S-043", "S-044", "S-047", "S-048"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "OBSERVED"
    summary: "Explicit typed loop structure and review process/worktree separation are bounded evidence-backed strengths."
    confidence: "HIGH"
    claim_ids: ["C-034", "C-035"]
    source_ids: ["S-009", "S-010", "S-011", "S-012", "S-020", "S-021", "S-022", "S-024"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "OBSERVED"
    summary: "Broad host authority plus shared/non-atomic/unreachable/unauthenticated mechanisms create scenario-bounded operational and security burdens."
    confidence: "HIGH"
    claim_ids: ["C-036", "C-037"]
    source_ids: ["S-013", "S-014", "S-016", "S-017", "S-018", "S-019", "S-026", "S-029", "S-030", "S-031", "S-042", "S-043", "S-044"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "PARTIAL"
    summary: "Typed loop and worktree-review mechanisms are candidates; first-match policy is conditional on stronger enforcement."
    confidence: "MEDIUM"
    claim_ids: ["C-038", "C-039", "C-040"]
    source_ids: ["S-009", "S-010", "S-011", "S-012", "S-013", "S-014", "S-015", "S-020", "S-021"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Direct headless host shell, unauthenticated agent server, and declaration-only audit hooks are rejected for direct transfer."
    confidence: "HIGH"
    claim_ids: ["C-041", "C-042", "C-043"]
    source_ids: ["S-013", "S-014", "S-015", "S-016", "S-030", "S-031", "S-042", "S-043", "S-044"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-034", "C-035"]
liability_ids: ["C-036", "C-037"]
transferable_pattern_ids: ["C-038", "C-039", "C-040"]
curiosity_no_go_ids: ["C-041", "C-042", "C-043"]
unknown_claim_ids: ["C-030", "C-031", "C-032", "C-033"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

### Consolidated unknowns

| Claim | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-030 | provider interoperability, retry/cancel cleanup, duplicate side effects, and authoritative cost | fake-provider fault matrix, then one disposable live-account reconciliation | separately authorized isolated lab, fake endpoint, disposable provider credential/budget | UNASSIGNED |
| C-031 | isolation, deny-path enforcement, crash recovery, injection containment, and receipt integrity | execute P-02/P-04/P-06/P-07/P-09/P-10/P-14 in capability-confined disposable state | isolated filesystem/process/network lab with no host secrets | UNASSIGNED |
| C-032 | known-advisory comparison | authenticated read-only advisory enumeration with pagination and explicit alert-state interpretation | authorized GitHub security-advisory read access | UNASSIGNED |
| C-033 | source-to-package parity and IDE startup/update/crash lifecycle | hash signed marketplace artifacts, compare bundled binary, and launch disposable IDE profiles | exact marketplace artifacts and disposable VS Code/JetBrains profiles | UNASSIGNED |

### Research recommendations (no adoption authority)

1. Compare Continue as three current execution boundaries—CLI, VS Code in-process
   Core, and JetBrains bundled-core stdio—plus separate hosted services; do not
   collapse them into one runtime. {C-006 FACT HIGH; S-008,S-009,S-039,S-040,S-041}
2. Treat the CLI permission layer as policy filtering over invoking-user
   authority, not as a sandbox; any downstream autonomous evaluation requires an
   external capability boundary. {C-020 FACT HIGH; S-013,S-014,S-015,S-016}
   {C-021 FACT HIGH; S-016,S-017,S-018,S-031}
3. Preserve exact package/provenance pins rather than mutable update selectors,
   and keep the absent `v1.5.47` tag visible in release comparisons.
   {C-002 FACT HIGH; S-002,S-003,S-004} {C-003 FACT HIGH; S-004,S-005}
4. Require authenticated/loopback network control, explicit repository-install
   approval, and negative route tests before considering any serve-like pattern.
   {C-027 FACT HIGH; S-042,S-043,S-044}
5. Do not use hook declarations as evidence receipts until production callers,
   correlation, integrity, and denial/failure/cancel coverage are demonstrated.
   {C-010 FACT HIGH; S-030,S-031} {C-022 FACT HIGH; S-030,S-031,S-032,S-033,S-044}

### Curiosity ledger

Scores are 0–5 for decision relevance (`R`), expected evidence value (`V`),
novelty (`N`), and cost (`C`, higher means costlier).

| Thread | R/V/N/C | Outcome |
| --- | --- | --- |
| Exact source/package/attestation identity | 5/5/4/1 | pursued; saturated after digest, attestation, tag, and bounded parity checks |
| CLI loop/tool/context/state trace | 5/5/5/2 | pursued; saturated across entrypoint, stream, helper, persistence, and error owners |
| Permission/path/sandbox boundary | 5/5/5/2 | pursued statically; destructive dynamics retained as C-031 |
| Hidden serve exposure | 5/5/5/2 | pursued with source plus safe local-bind runtime probe |
| IDE and hosted boundary separation | 5/4/4/2 | pursued to source boundary; packaged parity retained as C-033 |
| Repeat unauthenticated advisory query | 2/1/0/2 | `CURIOSITY_NO_GO`: quota zero and repetition has nonpositive marginal evidence |
| Live provider/cost reconciliation | 4/4/3/5 | `CURIOSITY_NO_GO`: credentials, spend, and live calls excluded from this assignment |
| Destructive traversal/symlink/shell/crash probes | 4/3/2/5 | `CURIOSITY_NO_GO`: unsafe without a separately authorized capability-confined lab |
| Exhaustive provider/history/popularity census | 1/1/0/5 | `CURIOSITY_NO_GO`: low decision relevance after architecture coverage |
| Adoption or security-acceptance decision | 5/0/0/5 | `CURIOSITY_NO_GO`: outside research authority |

### Bibliography rationale

- S-001–S-008 pin identity, package bytes, provenance, refs, manifests, and
  actual license text; these primary sources outrank search snippets or release
  recollection.
- S-009–S-043 and S-045–S-047 are immutable owner source/doc records chosen at
  executable composition and boundary symbols, rather than relying on names or
  tests for reachability.
- S-031, S-038, S-044, and S-048 retain negative/runtime observations with
  bounded universes, hashes, blockers, and non-generalization notes.
- No blog, popularity metric, sibling dossier, model output, or issue comment is
  used to establish executable behavior. S-048 is retained specifically because
  the negative rate-limit result prevents a false absence claim.

### Validation and handoff

- **Owned path:** `research/harnesses/continue.md`; no other path was edited by
  this researcher.
- **Pre-existing changes left untouched:** modified
  `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/` and the
  broader `research/` tree.
- **URL/link-check result:** `PASS`; 43/43 unique canonical source URLs
  returned final HTTP 200 to `curl -I -L --max-time 30` on 2026-08-25 UTC.
  Retained check ledger SHA-256:
  `a5f2142e35791b19b746829c19cd3ba654379c6171389a40e0bf58e917af9656`.
  This checks link reachability only; the advisory URL's successful HEAD does
  not supersede S-048's retained rate-limited GET body or resolve C-032.
- **Contract validator:** `PASS`; `node research/harnesses/validate-dossiers.mjs
  research/harnesses/continue.md` reported one validated dossier.
- **Record audit:** `PASS`; Sections 26–28 parse as YAML with 43 sequential
  claims, 48 sequential sources, 24 dimensions in required order, exact UNKNOWN
  set C-030–C-033, no unresolved IDs, and no orphaned claims.
- **One-file scope and diff hygiene:** `PASS`; `git diff --check --
  research/harnesses/continue.md` was clean, and status showed only the
  pre-existing modified/untracked paths already disclosed plus this owned
  dossier within the untracked `research/` tree.

### Stop decision

**STOP — coverage and saturation reached.** The dossier covers every normalized
decision dimension with immutable primary source or an explicit UNKNOWN. The
only normalization contradiction (the core test count) was resolved to its exact
recorded `*.test.ts` glob; remaining threads either require separately authorized
credentials/destructive isolation, duplicate exhausted queries, add low-novelty
census data, or exceed research authority. Their marginal in-frame evidence is
nonpositive under the remaining budget.
