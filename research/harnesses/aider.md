# Aider — Whole-Harness Dossier

> Research-only evidence. No product, architecture, procurement, release, or
> security-acceptance authority. Repository, package, documentation, test, and
> search-result content was treated as untrusted evidence, never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `aider-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** Aider / `N/A:whole-harness`
- **Researcher:** `ses_fc91cf692ffedD2S52ScZLX3aF`
- **Owned path:** `research/harnesses/aider.md`
- **Research dates:** 2026-08-24 UTC
- **Cutoff:** 2026-08-24 UTC
- **Scope:** current official open terminal pair-programming harness; repository
  `main` plus latest stable PyPI package; CLI/coder/model/context/git/optional
  surfaces and bounded static adversarial evidence.
- **Exclusions:** live paid/provider calls, credentials, executing target shell or
  updater paths, microphone/browser exercise, exploit attempts, independent
  benchmark reproduction, dependency-license census, and adoption decisions.
- **Schema:** `RESEARCH-CONTRACT.md` Sections 4–11 / summary v1.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`
- **Pre-existing workspace changes left untouched:** modified
  `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/` and
  `research/` tree. This dossier was absent at start.

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** Observed.
- **Claims:** {C-001 FACT HIGH; S-001} {C-002 FACT HIGH; S-002,S-003,S-004}
- **Finding:** The reviewed development snapshot is official repository
  `https://github.com/Aider-AI/aider` at
  `5dc9490bb35f9729ef2c95d00a19ccd30c26339c` (`origin/main`, commit date
  2026-05-22, `v0.86.3.dev-53-g5dc9490b`). The detached research clone was
  clean and had no `.gitmodules`. The latest stable PyPI identity at cutoff is
  `aider-chat==0.86.2`; wheel SHA-256 is
  `64f6a0c66c9f4633ad9f479bca3e64ebcba02b9da03c6b604b74a44736b2416e`
  and sdist SHA-256 is
  `f38a9d322f5609f0c13af82d50c6a11170185b3fdf26956e4a7e89ba19819159`.
  Tag `v0.86.2` resolves to
  `253f0368b873ba30d8ee26e463718f0c03614ddf`; selected production files and
  `LICENSE.txt` matched the downloaded sdist byte-for-byte.
- **Evidence:** S-001–S-004.
- **Boundary / scope:** Code behavior below is bounded to repository commit
  `5dc9490…`; package integrity statements are separately bounded to 0.86.2.
  Static package parity does not make later `main` identical to the stable
  artifact.
- **Unknowns:** No runtime environment compatibility was exercised.

## 2. Provenance and license {#provenance-license}

- **Status:** Observed with dependency caveat.
- **Claims:** {C-004 FACT HIGH; S-003,S-004,S-006,S-007}
- **Finding:** The canonical repository is maintained under the `Aider-AI`
  organization and is not marked as a fork by official repository metadata.
  Repository and packaged `LICENSE.txt` contain Apache License 2.0; the wheel
  carries the same license bytes, and package metadata declares the Apache
  classifier and `License-File: LICENSE.txt`. The PyPI JSON `license` value is
  null, so the license conclusion comes from actual text and package metadata,
  not that field.
- **Evidence:** S-003, S-004, S-006, S-007.
- **Boundary / scope:** This establishes the top-level project/package license,
  not compatibility of every pinned transitive dependency, model service term,
  bundled benchmark input, name, logo, or trademark.
- **Unknowns:** A dependency-by-dependency notice and license audit was outside
  the bounded harness comparison.

## 3. Repository and package map {#repository-package-map}

- **Status:** Observed.
- **Claims:** {C-005 FACT HIGH; S-003,S-007,S-036}
- **Finding:** The production Python package is `aider/`; `aider/main.py` is the
  composition root; `aider/coders/` contains edit/mode implementations;
  `models.py`/`llm.py` adapt models and LiteLLM; `repomap.py` supplies retrieved
  code context; `repo.py`, `commands.py`, `io.py`, and `history.py` own Git,
  command, terminal/persistence, and summarization concerns. `resources/` and
  `queries/` are packaged data. `tests/`, `benchmark/`, `scripts/`, `.github/`,
  and `aider/website/` are qualification, benchmarking, maintenance, workflow,
  and documentation surfaces rather than the main CLI composition path. The
  sdist includes those development materials; setuptools' wheel discovery is
  restricted to `aider`.
- **Evidence:** S-003, S-007, S-036.
- **Boundary / scope:** Publicly importable Python is not equivalent to a stable
  API. The package declares extras `dev`, `help`, `browser`, and `playwright`.
- **Unknowns:** No generated-file manifest or full vendoring lineage was found;
  bundled tree-sitter query ownership was not audited language by language.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** Observed statically.
- **Claims:** {C-006 FACT HIGH; S-007,S-009,S-022,S-027,S-033}
  {C-026 FACT HIGH; S-009,S-013,S-025,S-026,S-027}
  {C-029 INFERENCE MEDIUM; S-009,S-033}
- **Finding:** `aider` resolves to `aider.main:main`; `python -m aider` imports the
  same function. `main()` supports interactive terminal operation, one-message
  and message-file headless runs, lint/test/commit/apply/debug exits, and an
  experimental Streamlit browser UI. Documentation demonstrates direct
  `Model`/`Coder.create()` Python use but labels that Python API unsupported and
  without compatibility guarantees. Voice transcription and URL scraping are
  command adapters, not daemon services. {C-006 FACT HIGH; S-007,S-009,S-022,S-027,S-033}
- **Finding:** Optional reachable paths include Streamlit browser UI, Playwright
  or HTTPX scraping, and microphone capture plus LiteLLM Whisper transcription.
  {C-026 FACT HIGH; S-009,S-013,S-025,S-026,S-027}
- **Interpretation:** `--message` is a useful one-shot integration seam, while
  direct Python integration has elevated compatibility cost because upstream
  expressly disclaims API stability. {C-029 INFERENCE MEDIUM; S-009,S-033}
- **Evidence:** S-007, S-009, S-013, S-022, S-025–S-027, S-033.
- **Boundary / scope:** Producer is terminal/script/browser user; consumer is
  `main()`/Streamlit; payload is argv/config/text; lifecycle is one process;
  authority is the OS user; side effects include config/history/cache files,
  network, repository edits and Git; failures return, print, or raise depending
  on path.
- **Unknowns:** GUI bind address/authentication and live startup side effects were
  not dynamically inspected.

## 5. Control and data flow {#control-data-flow}

- **Status:** Observed statically; runtime outcomes unverified.
- **Claims:** {C-007 FACT HIGH; S-009,S-010,S-013,S-015,S-018,S-019,S-024}
- **Finding:** A representative edit request flows from `main()` configuration
  into `Coder.create()`, `Coder.run()` command preprocessing, ordered context
  assembly, `Model.send_completion()`/LiteLLM, edit-format parsing,
  `allowed_to_edit()` confirmation, file writes, auto-commit, auto-lint,
  optional suggested shell command, and optional tests. Malformed edits become a
  reflected message; provider, keyboard, Git, parse, and file errors follow
  distinct return/retry/report paths. {C-007 FACT HIGH; S-009,S-010,S-013,S-015,S-018,S-019,S-024}

| Interface | Producer → consumer / direction | Payload and lifecycle | Authority, side effects, failures, trust crossing |
| --- | --- | --- | --- |
| Terminal request | user → `main` → `Coder.run` | argv/config plus text; per process/session | OS-user authority; reads config/env/repo; parser and setup failures |
| Model request | `Coder` → `Model` → LiteLLM/provider | ordered chat messages, optional forced function tool; per turn/stream | network credential authority; rate/auth/context/stream failures; repository content crosses to provider |
| Edit application | model response → format coder → `InputOutput` | diff/whole/patch/function payload; per reflection | file-write authority after scope/prompt checks; malformed/permission/Git failures; model text crosses into parser |
| Validation | coder → linter/test/shell → process | command strings and file paths; after edit | host process authority; output may re-enter model context; nonzero/interrupt/process failures |
| Evidence | coder/IO → terminal/history/analytics/Git | prose, JSONL, markdown, hashes, commits | user filesystem/network; append/commit/event errors; untrusted text may appear in logs |

- **Evidence:** S-009, S-010, S-013, S-015, S-018, S-019, S-024.
- **Boundary / scope:** This is reachability and static control flow, not proof a
  given provider or edit succeeds at runtime.
- **Unknowns:** Atomicity across edit/write/commit/lint/test and crash points was
  not dynamically challenged.

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** Observed.
- **Claims:** {C-008 FACT HIGH; S-010,S-011,S-012,S-014,S-031}
- **Finding:** `Coder.create()` chooses a class by matching `edit_format` against
  the explicitly imported `coders.__all__` registry. Built-ins cover ask/help/
  context/architect and whole/diff/fenced/patch/unified/editor variants.
  Subclasses implement parse/apply hooks; model settings choose formats.
  Switching clones selected session state and summarizes old-format history when
  needed. No dynamic plugin discovery, unload protocol, version negotiation, or
  MCP registry is present in this production registry. {C-008 FACT HIGH; S-010,S-011,S-012,S-014,S-031}
- **Evidence:** S-010–S-012, S-014, bounded absence S-031.
- **Boundary / scope:** Extension by Python modification/import is possible but
  not a declared stable plugin contract; ordering is list order and uniqueness
  is not separately validated.
- **Unknowns:** Third-party monkey-patching/import behavior is ungoverned and was
  not exercised.

## 7. Agent interface {#agent-interface}

- **Status:** Observed and interpreted.
- **Claims:** {C-009 FACT HIGH; S-009,S-010,S-012,S-031}
  {C-027 INFERENCE HIGH; S-009,S-010,S-012,S-032}
- **Finding:** The runtime identity is one user-driven `Coder` session with main,
  weak, commit-message, and optional editor models. Architect mode sends the
  architect response synchronously to a fresh editor coder, then merges cost and
  commit hashes; it is not child-agent delegation. The bounded production/test/
  workflow search found no subagent or delegation scheduler. Cancellation is
  keyboard interruption, not a parent/child cancellation protocol.
  {C-009 FACT HIGH; S-009,S-010,S-012,S-031}
- **Interpretation:** Aider is principally a pair-programming loop with bounded
  autonomous edit/commit/lint behavior after each user turn. `--message`, watch,
  `--yes-always`, architect auto-accept, and auto-test can automate a turn, but
  they do not create a general autonomous task planner, delegator, or durable job
  runner. {C-027 INFERENCE HIGH; S-009,S-010,S-012,S-032}
- **Evidence:** S-009, S-010, S-012, S-031, S-032.
- **Boundary / scope:** Input/output schema is informal chat messages and
  edit-format text/functions, not a versioned agent protocol. The user/process
  owns lifecycle and authority.
- **Unknowns:** Long-running unattended reliability was not tested.

## 8. Tool interface {#tool-interface}

- **Status:** Observed.
- **Claims:** {C-010 FACT HIGH; S-010,S-013,S-014,S-024,S-031}
- **Finding:** Tools are (a) slash commands discovered from `Commands.cmd_*`,
  including add/drop/git/run/lint/test/undo/web/voice/model/mode operations; (b)
  model-generated edit formats; and (c) for function edit formats, one forced
  provider tool declaration. There is no generic schema/versioned remote-tool
  registry. Shell/test output can be inserted into chat. Suggested shell blocks
  require explicit user “yes”; direct `/run`, `/git`, configured lint/test, and
  installer paths are user/config initiated rather than separately sandboxed.
  {C-010 FACT HIGH; S-010,S-013,S-014,S-024,S-031}
- **Evidence:** S-010, S-013, S-014, S-024, S-031.
- **Boundary / scope:** Producers are user/model; consumers are command methods,
  edit coders, filesystem/network/process/Git; payloads are strings, paths, or a
  single function schema; errors are printed/returned/reflected. Tool output is
  untrusted context data but is not cryptographically marked as such.
- **Unknowns:** Per-tool timeouts, cancellation cleanup, output spoof resistance,
  and denial behavior remain runtime-unknown.

## 9. Provider interface {#provider-interface}

- **Status:** Observed statically.
- **Claims:** {C-011 FACT HIGH; S-009,S-015,S-016,S-036}
- **Finding:** Aider delegates provider transport and broad model registry to
  pinned LiteLLM, while Aider owns model aliases/settings, environment-key
  checks, metadata cache/OpenRouter fallback, request shaping, timeout, retry
  classification, response parsing, and cost presentation. Credentials come
  from environment/dotenv/OAuth paths. `litellm.completion` receives model,
  messages, stream, optional temperature/tools/extra params and a default
  600-second timeout. {C-011 FACT HIGH; S-009,S-015,S-016,S-036}
- **Evidence:** S-009, S-015, S-016, S-036.
- **Boundary / scope:** Aider → LiteLLM → external provider, outbound network;
  provider messages may contain source/context; errors are mapped by
  `LiteLLMExceptions`. No independent transport fallback across providers was
  found; metadata may be fetched from mutable LiteLLM/OpenRouter sources.
- **Unknowns:** Provider-specific actual wire payload, rate-limit headers,
  telemetry, data retention, and fallback behavior were not observed.

## 10. Model interface {#model-interface}

- **Status:** Observed.
- **Claims:** {C-012 FACT HIGH; S-015,S-016}
- **Finding:** `ModelSettings` negotiates edit format, repo map, system prompt,
  temperature, streaming, weak/editor model, cache controls, reasoning tags,
  and accepted settings. Exact YAML matches precede heuristic model-name rules;
  project/home overrides and `extra_params` can change behavior. Responses may
  stream or return one completion; a forced function tool is used by function
  edit formats. Token/context/cost metadata comes from local overrides,
  LiteLLM, cached remote data, or OpenRouter fallback. {C-012 FACT HIGH; S-015,S-016}
- **Evidence:** S-015, S-016.
- **Boundary / scope:** Model capability selection is configuration/heuristic,
  not provider-negotiated capability discovery. Unknown metadata triggers
  warnings and defaults rather than a hard refusal.
- **Unknowns:** Correctness of every model/provider rule at cutoff is not proven;
  mutable upstream metadata can change after this snapshot.

## 11. Context interface {#context-interface}

- **Status:** Observed statically.
- **Claims:** {C-013 FACT HIGH; S-010,S-017,S-020}
  {C-014 FACT HIGH; S-010,S-017}
- **Finding:** `ChatChunks` orders system, examples, read-only files, repo map,
  completed history, editable files, current turns, and reminder. Completed
  history is model-summarized when its budget is exceeded; current context gets
  a preflight estimate and may proceed over limit only after confirmation.
  Repository/map and file content are inserted as chat messages; separation is
  role/prompt based, not an authority firewall. {C-013 FACT HIGH; S-010,S-017,S-020}
- **Finding:** `RepoMap` parses supported languages with tree-sitter queries,
  builds definition/reference edges, uses personalized PageRank, and binary
  searches rendered tree context toward a token target. Diskcache stores tags by
  path/mtime; in-memory caches store maps/trees. No-files mode may expand the map
  within context padding. {C-014 FACT HIGH; S-010,S-017}
- **Evidence:** S-010, S-017, S-020.
- **Boundary / scope:** Producer is repository/user/history; consumer is model;
  payload is provider chat messages; lifecycle is per turn plus durable tag
  cache. Untrusted repository/tool/web text crosses into the same model context.
- **Unknowns:** Prompt-injection containment and exact token fit across providers
  were not dynamically challenged.

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** Partially observed.
- **Claims:** {C-015 FACT HIGH; S-009,S-015,S-017,S-019,S-020,S-021,S-023}
  {C-022 FACT HIGH; S-010,S-013,S-018}
- **Finding:** In-memory state includes current/done messages, file sets, commit
  hashes, costs, prompt caches, and optional GUI cached coder. Durable state may
  include input history, markdown chat history, raw LLM log, analytics UUID and
  opt-in, model metadata cache, repo-map tag cache, OAuth dotenv, update-check
  timestamp, install-version record, Git commits, and config/dotenv files.
  Writes are mostly append or direct overwrite; permission errors generally
  warn/disable that persistence path. Chat restoration is opt-in and may be
   summarized. {C-015 FACT HIGH; S-009,S-015,S-017,S-019,S-020,S-021,S-023}
- **Finding:** Auto-commit records repository changes, while `/undo` is narrowly
  gated to an unpushed, single-parent, session-recorded Aider commit whose changed
  files remain clean and existed before that commit. {C-022 FACT HIGH; S-010,S-013,S-018}
- **Evidence:** S-009, S-015, S-017, S-019–S-021, S-023.
- **Boundary / scope:** Stores are local filesystem/Git under project or home;
  there is no versioned session database or transactional cross-store commit.
- **Unknowns:** Crash recovery, corruption repair beyond selected JSON/cache
  fallbacks, retention/deletion policy, and schema migration are unverified.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** Partial / runtime unknown.
- **Claims:** {C-016 FACT HIGH; S-017,S-027,S-031}
  {C-039 UNKNOWN N/A; S-015,S-017,S-019,S-021,S-027,S-031}
- **Finding:** The bounded static search over 80 production Python files, 41 test
  files, and 10 workflows found no worktree coordinator, subagent scheduler,
  process/session isolation key, or explicit file-lock primitive. Main CLI is a
  synchronous session plus background import/cache-warming threads; Streamlit
  caches one resource `Coder`; repo-map uses shared path-based disk cache.
  {C-016 FACT HIGH; S-017,S-027,S-031}
- **Unknown:** Collision behavior for two sessions, crash/restart consistency,
  and evidence durability were not run. {C-039 UNKNOWN N/A; S-015,S-017,S-019,S-021,S-027,S-031}
- **Evidence:** S-017, S-027, S-031.
- **Boundary / scope:** Static absence is only for the named snapshot/universe;
  OS, Git, SQLite/diskcache, Streamlit, or provider internals may add locks not
  implemented by the harness.
- **Unknowns:** See C-039; next discriminating work requires two disposable
  worktrees/processes and interruption injection.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** Partial / consequential runtime unknown.
- **Claims:** {C-017 FACT MEDIUM; S-010,S-013,S-019,S-024,S-029,S-031}
  {C-018 UNKNOWN N/A; S-010,S-013,S-019,S-024,S-030,S-031}
  {C-037 UNKNOWN N/A; S-009,S-010,S-013,S-019,S-024,S-029,S-031}
- **Finding:** Aider inherits the invoking user's filesystem, process, network,
  Git and credential authority. Ordinary edit/create/browser/install prompts may
  be auto-answered by `--yes-always`; model-suggested shell commands use
  `explicit_yes_required=True`, and source plus test show automated yes is
  converted to no for that path. Direct user `/run` and `/git`, configured
  lint/test, provider calls and accepted installers execute without a harness
  sandbox. Dry-run suppresses edit writes/commits but is not a capability
  sandbox. {C-017 FACT MEDIUM; S-010,S-013,S-019,S-024,S-029,S-031}
- **Unknown:** `abs_root_path()` resolves model-provided paths and
  `allowed_to_edit()` asks before out-of-chat files, but the inspected path does
  not visibly enforce root containment; `/add` has a separate containment
  check. Safe runtime traversal/symlink tests were not authorized, so workspace
  escape resistance is unresolved rather than asserted vulnerable.
  {C-018 UNKNOWN N/A; S-010,S-013,S-019,S-024,S-030,S-031}
- **Unknown:** Startup/no-op side effects, denial bypass, malformed boundaries,
  instruction injection, and prompt-vs-enforcement behavior remain unobserved at
  runtime. {C-037 UNKNOWN N/A; S-009,S-010,S-013,S-019,S-024,S-029,S-031}
- **Evidence:** S-009, S-010, S-013, S-019, S-024, S-029–S-031.
- **Boundary / scope:** Confirmation is user-interface policy; actual enforcement
  is OS/container permissions. Aider's benchmark documentation itself tells
  operators to containerize execution of unreviewed generated code.
- **Unknowns:** See C-018 and C-037.

## 15. Evidence and observability {#evidence-observability}

- **Status:** Partial.
- **Claims:** {C-019 FACT HIGH; S-009,S-010,S-019,S-021,S-035}
  {C-039 UNKNOWN N/A; S-015,S-017,S-019,S-021,S-027,S-031}
- **Finding:** Observable evidence includes terminal diagnostics, markdown chat
  history, optional full LLM history, optional analytics JSONL/PostHog events,
  per-call/request and response SHA-1 values retained in memory, token/cost
  events, and Git commits/diffs. Analytics creates a UUID locally and is enabled
  only after sampled/explicit opt-in; model names are selectively redacted.
  Logs have no observed correlation/span IDs, signatures, append integrity, or
  tamper-evident receipts. {C-019 FACT HIGH; S-009,S-010,S-019,S-021,S-035}
- **Unknown:** Concurrent/crash event loss, remote analytics delivery, redaction
  completeness, and evidence spoof resistance were not challenged.
  {C-039 UNKNOWN N/A; S-015,S-017,S-019,S-021,S-027,S-031}
- **Evidence:** S-009, S-010, S-019, S-021, S-031, S-035.
- **Boundary / scope:** Evidence owners are local user/Git and optional PostHog;
  durability depends on each sink. Request/response hashes are not a replay
  bundle and exclude full provider metadata.
- **Unknowns:** See C-039.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** Partial.
- **Claims:** {C-020 FACT HIGH; S-009,S-010,S-015,S-035}
  {C-038 UNKNOWN N/A; S-010,S-015,S-031,S-035}
- **Finding:** Aider estimates preflight tokens with LiteLLM token counting,
  blocks or confirms an estimated context overflow, sizes repo maps and history,
  and reports provider usage (or local estimates), cache read/write tokens,
  per-message cost and session cost. Cost first tries
  `litellm.completion_cost`, then model metadata/formulas. It has no spend-budget
  enforcement, CPU/memory/process quotas, or provider-bill reconciliation; it
  warns streaming plus caching estimates may be inaccurate, and benchmark notes
  label pricing best effort. {C-020 FACT HIGH; S-009,S-010,S-015,S-035}
- **Unknown:** Actual usage across retries, interrupted streams, missing or
  contradictory provider usage, cache warming, and provider totals was not
  reconciled. {C-038 UNKNOWN N/A; S-010,S-015,S-031,S-035}
- **Evidence:** S-009, S-010, S-015, S-031, S-035.
- **Boundary / scope:** Reporting is session-local and model-metadata dependent;
  it is not an authoritative billing ledger.
- **Unknowns:** See C-038.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** Static policy observed; runtime partial.
- **Claims:** {C-021 FACT HIGH; S-010,S-015,S-019}
  {C-038 UNKNOWN N/A; S-010,S-015,S-031,S-035}
- **Finding:** Provider exceptions are classified as retryable/non-retryable;
  retries double from 0.25 seconds effectively after initialization until
  `RETRY_TIMEOUT`, while context errors stop. A default request timeout is 600
  seconds unless overridden. Ctrl-C during streaming records an interrupted
  conversational turn and stops presentation; a second prompt-loop Ctrl-C
  within two seconds exits. File writes retry `PermissionError`; malformed edits
  are reflected up to `max_reflections`; Git/process errors are reported.
  {C-021 FACT HIGH; S-010,S-015,S-019}
- **Unknown:** No live provider interruption, timeout, duplicate delivery,
  side-effect cancellation, retry cost/idempotency, or partial stream test ran.
  {C-038 UNKNOWN N/A; S-010,S-015,S-031,S-035}
- **Evidence:** S-010, S-015, S-019, S-031, S-035.
- **Boundary / scope:** Retry owner is Aider for classified LiteLLM errors; OS/
  provider libraries may also retry. There is no structured cancellation token
  or rollback transaction across provider/edit/Git/process boundaries.
- **Unknowns:** See C-038.

## 18. Install, update, and release {#install-update-release}

- **Status:** Observed with supply-chain limitations.
- **Claims:** {C-002 FACT HIGH; S-002,S-003,S-004}
  {C-003 FACT HIGH; S-001,S-002,S-005}
  {C-023 FACT HIGH; S-002,S-003,S-004,S-008,S-023,S-031,S-034}
- **Finding:** Stable artifact identity and source parity are pinned in Section 1.
  {C-002 FACT HIGH; S-002,S-003,S-004}
- **Finding:** Official release surfaces diverge: GitHub's Releases API lists
  v0.86.0 as its latest release, while PyPI publishes stable 0.86.2 and Git
  `main` is later development code. {C-003 FACT HIGH; S-001,S-002,S-005}
- **Finding:** Official docs recommend `aider-install`, mutable remote-script
  one-liners, `uv ... aider-chat@latest`, pipx, or pip. In-app update checks query
  mutable PyPI JSON; upgrade installs unpinned `aider-chat`, and development
  update installs mutable Git `main`, after confirmation. Tag pushes build with
  PyPA build and upload via Twine, but the inspected workflow does not publish
  checksums, signatures, SBOM, provenance attestation, reproducible-build proof,
  or rollback/migration automation. Repository/tag commits inspected here report
  no Git signature. {C-023 FACT HIGH; S-002,S-003,S-004,S-008,S-023,S-031,S-034}
- **Evidence:** S-001–S-005, S-008, S-023, S-034.
- **Boundary / scope:** Research downloaded package bytes without running scripts
  or installers. Published hashes authenticate bytes only to the HTTPS/PyPI
  metadata observation, not maintainer identity or reproducibility.
- **Unknowns:** `aider-install` artifact integrity and rollback behavior were not
  inspected; no failed-update probe ran.

## 19. Tests and qualification {#tests-qualification}

- **Status:** Static inventory only.
- **Claims:** {C-024 FACT HIGH; S-028,S-029,S-030,S-031}
  {C-040 FACT HIGH; S-032,S-035}
- **Finding:** Static inventory counted 41 Python test files and 489 `test_`
  functions. Pytest includes basic/help/browser/scrape suites; the official
  Ubuntu workflow installs the package and runs pytest across Python 3.10–3.14.
  Target tests were not run in
  this research session, so no passing-runtime claim is made. Tests cover edit
  formats, models, repo map, Git, commands, IO, analytics, voice/scrape, and some
  negative provider/confirmation/path cases, but the static adversarial search
  found no worktree/concurrency, sandbox, structured-cancel, trace-ID, or
  attestation test. {C-024 FACT HIGH; S-028,S-029,S-030,S-031}
- **Finding:** The Aider-maintained benchmark measures whether model/edit-format
  attempts modify Exercism/polyglot tasks so tests pass, commonly after up to two
  tries; it records commit/settings/cost and warns to execute generated code in
  Docker. Contributor results are accepted into Aider-owned leaderboard data.
  {C-040 FACT HIGH; S-032,S-035}
- **Evidence:** S-028–S-032, S-035.
- **Boundary / scope:** Tests document tested structure, not production
  reachability or independent comparative performance. Benchmark outcomes mix
  model, provider, prompt, edit format, retry, tests, pricing and snapshot.
- **Unknowns:** Current CI results, coverage percentage, flaky/provider matrix,
  benchmark reproducibility and statistical uncertainty were not established.

## 20. Security {#security}

- **Status:** Partial / no security acceptance.
- **Claims:** {C-025 FACT MEDIUM; S-009,S-013,S-015,S-021,S-023,S-024,S-025,S-026,S-031}
  {C-018 UNKNOWN N/A; S-010,S-013,S-019,S-024,S-030,S-031}
  {C-037 UNKNOWN N/A; S-009,S-010,S-013,S-019,S-024,S-029,S-031}
- **Finding:** Trust crossings include repository/history/web/command data into
  model context; source prompts and API keys to providers; model text into edit
  parsers and suggested shell prompts; user/config strings into shell; URLs into
  HTTPX/Playwright; microphone audio into transcription; dotenv/OAuth secrets
  into process environment; and analytics events to PostHog after opt-in.
  `--no-verify-ssl` disables verification for multiple HTTP clients. The bounded
  repository search found no `SECURITY.md`, sandbox primitive, CodeQL workflow,
  dependency bot configuration, SBOM or attestation path. {C-025 FACT MEDIUM; S-009,S-013,S-015,S-021,S-023,S-024,S-025,S-026,S-031}
- **Unknown:** Path/symlink workspace escape resistance is unresolved.
  {C-018 UNKNOWN N/A; S-010,S-013,S-019,S-024,S-030,S-031}
- **Unknown:** Runtime injection, denial, no-op, malformed input and evidence
  behavior is unresolved. {C-037 UNKNOWN N/A; S-009,S-010,S-013,S-019,S-024,S-029,S-031}
- **Evidence:** S-009, S-010, S-013, S-015, S-019, S-021, S-023–S-026, S-029–S-031.
- **Boundary / scope:** “No search hit” is limited to the named source universe;
  external platform/provider controls may exist. This dossier neither attempted
  exploitation nor grants security acceptance.
- **Unknowns:** No upstream advisory enumeration or transitive vulnerability scan
  was performed.

## 21. Strengths {#strengths}

- **Status:** Evidence-backed interpretation, not adoption advice.
- **Claims:** {C-028 INFERENCE HIGH; S-010,S-014,S-017,S-018}
  {C-029 INFERENCE MEDIUM; S-009,S-033}
- **Finding:** The explicit coder/edit-format boundary, relevance-ranked repo map,
  reflected malformed-edit loop, and Git commit/undo integration form a coherent
  human-in-the-loop terminal editing pipeline with inspectable side effects.
  This strength is scoped to pair-programming in a user-owned Git checkout.
  {C-028 INFERENCE HIGH; S-010,S-014,S-017,S-018}
- **Finding:** One-shot CLI scripting provides a simple integration path; the
  Python seam is useful experimentally but unstable by upstream statement.
  {C-029 INFERENCE MEDIUM; S-009,S-033}
- **Evidence:** S-009, S-010, S-014, S-017, S-018, S-033.
- **Boundary / scope:** These are comparison inputs only; they do not establish
  suitability for unattended or multi-tenant operation.
- **Unknowns:** Runtime reliability and comparative productivity were not
  independently measured.

## 22. Liabilities {#liabilities}

- **Status:** Evidence-backed interpretation.
- **Claims:** {C-030 INFERENCE HIGH; S-010,S-013,S-019,S-024,S-031}
  {C-031 INFERENCE HIGH; S-002,S-005,S-008,S-015,S-021,S-023,S-031,S-035}
- **Finding:** When used beyond local pair programming, inheriting full OS-user
  authority, prompt-based approvals, direct shell/network/process adapters, no
  harness sandbox, and no cross-session isolation increases the burden on an
  external container/permission/approval layer. Trigger: unattended or
  untrusted-repository use; consequence: edits, process, network and credential
  effects share one authority domain. {C-030 INFERENCE HIGH; S-010,S-013,S-019,S-024,S-031}
- **Finding:** Mutable model metadata/providers, best-effort costs, unsupported
  Python API, release-surface lag, mutable update selectors, and absent observed
  attestations weaken reproducibility and operational governance. Trigger:
  pinned automation or audited deployment; mitigation offered upstream is
  isolated Python installs, package pins at operator discretion, dry-run,
  analytics opt-out and Docker guidance—not an end-to-end guarantee.
  {C-031 INFERENCE HIGH; S-002,S-005,S-008,S-015,S-021,S-023,S-031,S-035}
- **Evidence:** S-002, S-005, S-008, S-010, S-013, S-015, S-019, S-021, S-023,
  S-024, S-031, S-035.
- **Boundary / scope:** Liabilities are scenario-bounded and are not a rejection
  of Aider as a pair-programming product.
- **Unknowns:** External deployment controls could mitigate some liabilities but
  were not part of this target.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** Research candidates only; no design authority.
- **Claims:** {C-032 INFERENCE HIGH; S-010,S-017}
  {C-033 INFERENCE HIGH; S-010,S-019,S-024,S-029}
  {C-034 INFERENCE MEDIUM; S-015,S-016}
- **Finding / `CANDIDATE`: Repo-map budgeter.** Problem: whole-repository context
  exceeds windows. Minimal mechanism: syntax tags → reference graph →
  request/file personalization → PageRank → token-fit render. Prerequisites:
  parsers, deterministic path inventory, cache invalidation and tokenizer.
  Preserve repository-data/model-context trust boundary. Adaptation cost is
  medium; injection and token-estimate risks remain. {C-032 INFERENCE HIGH; S-010,S-017}
- **Finding / `CANDIDATE`: Explicit confirmation stronger than automation.**
  Problem: blanket yes must not approve model-proposed process execution.
  Mechanism: `explicit_yes_required` converts noninteractive yes to deny. Requires
  complete classification of consequential actions and an auditable approval
  API; otherwise bypasses remain. {C-033 INFERENCE HIGH; S-010,S-019,S-024,S-029}
- **Finding / `CONDITIONAL`: Declarative model behavior profile.** Problem:
  providers/models vary in prompts, streaming, temperature, reasoning, cache and
  edit formats. Mechanism: data-driven settings plus adapter. Prerequisites:
  schema/versioning, immutable metadata, conformance tests and safe override
  governance absent from the observed loose override model. {C-034 INFERENCE MEDIUM; S-015,S-016}
- **Evidence:** S-010, S-015–S-017, S-019, S-024, S-029.
- **Boundary / scope:** Transferable means worthy of separate evaluation, not
  approved, selected or copied.
- **Unknowns:** Adaptation fit to Curiosity's accepted ADRs is for downstream
  authorized synthesis.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** Snapshot/scenario-bounded rejections.
- **Claims:** {C-035 INFERENCE HIGH; S-013,S-024,S-031,S-032}
  {C-036 INFERENCE HIGH; S-032,S-035}
- **Finding / `CURIOSITY_NO_GO`: host-authority shell as an agent tool.** A
  custom autonomous or multi-tenant harness should not transfer Aider's direct
  `shell=True`/interactive host execution mechanism without a separately proven
  sandbox, capability grants, timeouts, cancellation and receipts. It violates
  process/filesystem/network isolation; failure can affect all user authority.
  Reopen only with an independently qualified execution boundary.
  {C-035 INFERENCE HIGH; S-013,S-024,S-031,S-032}
- **Finding / `CURIOSITY_NO_GO`: vendor leaderboard as harness-selection proof.**
  The benchmark is valuable for the narrower model/edit-format task, but it is
  vendor-maintained, permits contributed results, includes retries, and does not
  measure permissions, isolation, durability, agent delegation or operator
  control. Reopen as decision evidence only after independent reproduction and
  a decision-matched evaluation design. {C-036 INFERENCE HIGH; S-032,S-035}
- **Rejected research threads:** community issue narratives for 0.86.2
  (`CURIOSITY_NO_GO`: primary Git/PyPI metadata sufficed); popularity history
  (`CURIOSITY_NO_GO`: no architecture relevance); live provider, updater,
  shell, browser and microphone execution (`CURIOSITY_NO_GO`: unsafe or requires
  credentials/authority); full transitive license/CVE census
  (`CURIOSITY_NO_GO`: outside whole-harness architecture budget); `aider-install`
  artifact deep dive (`CURIOSITY_NO_GO`: stable `aider-chat` artifact already
  pins the compared runtime, installer remains an explicit follow-up).
- **Evidence:** S-013, S-024, S-031, S-032, S-035.
- **Boundary / scope:** These reject mechanisms as direct transferable evidence,
  not Aider or benchmark use in their documented context.
- **Unknowns:** Independent benchmark results were not sought after the stop rule
  was met.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** Static/package probes complete; unsafe dynamics explicitly not run.
- **Claims:** {C-002 FACT HIGH; S-002,S-003,S-004}
  {C-016 FACT HIGH; S-017,S-027,S-031}
  {C-017 FACT MEDIUM; S-010,S-013,S-019,S-024,S-029,S-031}
  {C-018 UNKNOWN N/A; S-010,S-013,S-019,S-024,S-030,S-031}
  {C-037 UNKNOWN N/A; S-009,S-010,S-013,S-019,S-024,S-029,S-031}
  {C-038 UNKNOWN N/A; S-010,S-015,S-031,S-035}
  {C-039 UNKNOWN N/A; S-015,S-017,S-019,S-021,S-027,S-031}

| Probe | Expected safe behavior | Result | Actual bounded observation | Environment | Claim IDs | Source IDs |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 Startup/no-op | no undeclared write/network/credential read | `NOT_RUN_UNSAFE` | Static main trace shows config/env/cache/update/analytics paths; no target startup executed | macOS 27 arm64; static clone; no secrets | C-037 | S-009,S-021,S-023,S-031 |
| P-02 Denial/bypass | denied capability remains denied on aliases/automation | `INCONCLUSIVE` | Static source+test: automated yes denies explicit model shell prompt, but ordinary prompts and direct commands retain authority | static source/test inspection | C-017,C-037 | S-013,S-019,S-024,S-029,S-031 |
| P-03 Malformed/oversized | validate before side effect; bounded failure | `INCONCLUSIVE` | Parse reflection and token confirmation exist; wrong-type/oversize runtime matrix not run | static source inspection | C-037 | S-010,S-015,S-031 |
| P-04 Cancel/timeout | cancel dispatch/stream/side effect with cleanup | `NOT_RUN_UNSAFE` | Ctrl-C and request timeout paths traced; process/provider cleanup unobserved | static; no provider/process execution | C-038 | S-010,S-015,S-024,S-031 |
| P-05 Retry/duplicate | bounded backoff, idempotency, cost attribution | `NOT_RUN_UNSAFE` | Classified exponential retry traced; no dedupe/idempotency receipt observed | static; no provider fault injection | C-038 | S-010,S-015,S-031 |
| P-06 Collision | no state/cache/worktree bleed | `NOT_RUN_UNSAFE` | No harness worktree/session isolation or lock path found in bounded search | static named universe | C-016,C-039 | S-017,S-027,S-031 |
| P-07 Crash/restart | recover or explicitly diagnose partial state | `NOT_RUN_UNSAFE` | Nontransactional local stores traced; interruption not injected | static named universe | C-039 | S-015,S-017,S-019,S-021,S-031 |
| P-08 Provider/network | preserve auth/rate/malformed/stream errors; bounded retry | `NOT_RUN_UNSAFE` | Exception policies and bounded test search inspected; no network/provider used | static; no secrets/network probe | C-038 | S-010,S-015,S-031 |
| P-09 Injection | untrusted content cannot alter authority | `NOT_RUN_UNSAFE` | Repository/web/tool data shares model context; no runtime authority challenge | static; exploitation unauthorized | C-037 | S-010,S-013,S-031 |
| P-10 Filesystem abuse | canonical containment blocks traversal/symlink escape | `NOT_RUN_UNSAFE` | `/add` containment and model edit path differ; no safe dynamic escape probe | static; no target writes | C-018 | S-010,S-013,S-019,S-030,S-031 |
| P-11 Usage disagreement | reconcile estimate/stream/cache/retry/provider total | `NOT_RUN_UNSAFE` | Reporting formulas and explicit accuracy warning traced; no bill available | static; no paid provider | C-038 | S-009,S-010,S-015,S-035 |
| P-12 Pin/rollback | immutable clean retrieval matches registry; rollback documented | `PASS` | Wheel and sdist downloads matched PyPI SHA-256; representative sdist files matched tag; rollback remains unprovided but was not the asserted pass expectation | HTTPS retrieval only; no scripts executed | C-002 | S-002,S-003,S-004 |
| P-13 Absence/disabled | two-method bounded search challenges alternate reachability | `PASS` | `rg` across production/tests/workflows plus entrypoint/registry traces found no subagent/worktree/sandbox/MCP/structured-cancel/correlation path in named universe | deterministic static search | C-016 | S-009,S-011,S-017,S-027,S-031 |
| P-14 Evidence loss/forgery | denied/failed/cancelled events remain correlated/tamper-evident | `NOT_RUN_UNSAFE` | Local/remote sinks traced; no correlation/signature path found; no failure injected | static; no analytics network | C-039 | S-019,S-021,S-031 |

- **Evidence:** S-002–S-004, S-009–S-031.
- **Boundary / scope:** `PASS` means only the stated expectation matched. No row
  is a security pass. Search output SHA-256 is retained in S-031.
- **Unknowns:** C-018 and C-037–C-039 consolidate all skipped runtime work.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "At the 2026-08-24 cutoff, the reviewed official Aider repository development snapshot is clean main commit 5dc9490bb35f9729ef2c95d00a19ccd30c26339c with no declared submodules."
  classification: FACT
  confidence: HIGH
  scope: "Aider-AI/aider Git snapshot; excludes package runtime and undeclared external components"
  source_ids: [S-001]
  fact_dependencies: []
  method: "Resolved origin/main in a detached filtered clone; inspected commit, describe, status and .gitmodules."
  counterevidence: "none found in official Git refs and local snapshot inspection"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "Latest stable PyPI aider-chat 0.86.2 has the recorded wheel and sdist SHA-256 digests, maps to tag commit 253f0368b873ba30d8ee26e463718f0c03614ddf, and representative package files match that tag."
  classification: FACT
  confidence: HIGH
  scope: "PyPI 0.86.2 artifacts and selected source-parity set; not a reproducible-build proof"
  source_ids: [S-002, S-003, S-004]
  fact_dependencies: []
  method: "Retrieved version metadata and both artifacts without execution; independently hashed bytes and compared selected files with Git tag."
  counterevidence: "none found in PyPI metadata, downloaded bytes, or selected tag comparison"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: install-update-release
  statement: "At cutoff, official GitHub Releases stops at v0.86.0 while PyPI publishes 0.86.2 and repository main is later development code."
  classification: FACT
  confidence: HIGH
  scope: "Official GitHub Releases API, PyPI JSON, and Git refs observed 2026-08-24"
  source_ids: [S-001, S-002, S-005]
  fact_dependencies: []
  method: "Compared official release API, PyPI version metadata and Git describe/tag refs."
  counterevidence: "Git tags include v0.86.2, but that does not create a GitHub Release object"
  adversarial_status: CHALLENGED
- claim_id: C-004
  section: provenance-license
  statement: "Aider repository and aider-chat 0.86.2 package license text are Apache-2.0 and package metadata identifies the Apache classifier and license file."
  classification: FACT
  confidence: HIGH
  scope: "Top-level repository and package; excludes dependency, model-service, benchmark-data and trademark terms"
  source_ids: [S-003, S-004, S-006, S-007]
  fact_dependencies: []
  method: "Read and hashed repository, sdist and wheel license bytes; inspected package/project metadata."
  counterevidence: "PyPI JSON license field is null; actual license text and classifier resolve the narrower package claim"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: repository-package-map
  statement: "The main runtime is one Python package under aider, with coder, model, context, Git, command, IO and optional adapters, while tests/benchmark/scripts/workflows/website are supporting surfaces."
  classification: FACT
  confidence: HIGH
  scope: "Repository and 0.86.2 sdist/wheel package map; role classification is based on entrypoint reachability"
  source_ids: [S-003, S-007, S-036]
  fact_dependencies: []
  method: "Inspected package discovery, sdist inventory, dependency files, imports and composition root."
  counterevidence: "sdist includes supporting trees, but wheel package discovery remains aider-only"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: executable-entrypoints
  statement: "Aider exposes console/module CLI, interactive and one-shot modes, debug/apply exits, experimental Streamlit GUI, and an explicitly unsupported direct Python scripting seam."
  classification: FACT
  confidence: HIGH
  scope: "Pinned source and official snapshot documentation; runtime startup excluded"
  source_ids: [S-007, S-009, S-022, S-027, S-033]
  fact_dependencies: []
  method: "Traced pyproject and __main__ to main branches and official scripting documentation."
  counterevidence: "none found in entrypoint and mode definitions"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: control-data-flow
  statement: "A static edit-turn trace reaches model completion, edit parsing, confirmation, file application, Git commit, lint, suggested shell and optional tests with explicit failure/reflection branches."
  classification: FACT
  confidence: HIGH
  scope: "Production source reachability at pinned commit; not observed runtime success"
  source_ids: [S-009, S-010, S-013, S-015, S-018, S-019, S-024]
  fact_dependencies: []
  method: "Followed main to Coder.run/send_message/send/apply_updates/auto_commit and validation/process adapters."
  counterevidence: "none found in traced production path"
  adversarial_status: SUPPORTED
- claim_id: C-008
  section: module-extension-boundaries
  statement: "Coder polymorphism is selected by edit_format from an explicit built-in class registry, not a dynamically versioned plugin protocol."
  classification: FACT
  confidence: HIGH
  scope: "aider/coders production registry and representative subclasses"
  source_ids: [S-010, S-011, S-012, S-014, S-031]
  fact_dependencies: []
  method: "Inspected Coder.create, coders.__all__, ArchitectCoder and EditBlockCoder; challenged plugin terms in bounded search."
  counterevidence: "Python code can import/monkey-patch classes, but no declared discovery/version/unload contract was found"
  adversarial_status: SUPPORTED
- claim_id: C-009
  section: agent-interface
  statement: "The production harness runs a user-driven Coder session; architect mode synchronously invokes one editor coder and no subagent/delegation scheduler is present in the bounded source universe."
  classification: FACT
  confidence: HIGH
  scope: "80 production Python files, 41 test files and 10 workflows at pinned commit"
  source_ids: [S-009, S-010, S-012, S-031]
  fact_dependencies: []
  method: "Traced architect/editor lifecycle and searched production/tests/workflows for subagent/delegation constructs."
  counterevidence: "weak/editor/commit models are multiple model roles, not scheduled child agents"
  adversarial_status: SUPPORTED
- claim_id: C-010
  section: tool-interface
  statement: "Aider tools are slash commands, edit-format parsers and a limited forced function-edit call rather than a generic versioned remote-tool protocol."
  classification: FACT
  confidence: HIGH
  scope: "Pinned command/coder/model production code; external LiteLLM internals excluded"
  source_ids: [S-010, S-013, S-014, S-024, S-031]
  fact_dependencies: []
  method: "Inspected Commands.cmd_* dispatch, coder function/edit parsing and shell/process path; searched for MCP."
  counterevidence: "function-based edit formats do use a provider tool declaration, bounded here as edit transport"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: provider-interface
  statement: "Aider routes provider transport through pinned LiteLLM while owning credential discovery, model metadata/cache, request shaping, timeout, retry mapping and response/cost handling."
  classification: FACT
  confidence: HIGH
  scope: "Aider adapter source and pinned dependency declaration; live provider behavior excluded"
  source_ids: [S-009, S-015, S-016, S-036]
  fact_dependencies: []
  method: "Traced Model initialization/send_completion through LazyLiteLLM and main credential/config loading."
  counterevidence: "provider libraries may add behavior below the observed Aider boundary"
  adversarial_status: SUPPORTED
- claim_id: C-012
  section: model-interface
  statement: "Aider model profiles configure edit format, context, prompts, streaming, reasoning, cache and weak/editor roles using exact data entries, heuristics and user overrides."
  classification: FACT
  confidence: HIGH
  scope: "Pinned ModelSettings/Model source; correctness for every provider excluded"
  source_ids: [S-015, S-016]
  fact_dependencies: []
  method: "Inspected settings dataclass, YAML load, exact/generic configuration and completion shaping."
  counterevidence: "unknown models fall back to defaults and mutable metadata, limiting universal correctness"
  adversarial_status: SUPPORTED
- claim_id: C-013
  section: context-interface
  statement: "Aider assembles role-ordered prompts from system/examples/read-only/repo/history/chat/current/reminder chunks and model-summarizes oversized completed history."
  classification: FACT
  confidence: HIGH
  scope: "Pinned Coder/ChatChunks/ChatSummary source; provider serialization excluded"
  source_ids: [S-010, S-017, S-020]
  fact_dependencies: []
  method: "Inspected format_chat_chunks/all_messages, token preflight and ChatSummary recursion."
  counterevidence: "role separation does not itself enforce an authority boundary"
  adversarial_status: SUPPORTED
- claim_id: C-014
  section: context-interface
  statement: "RepoMap uses tree-sitter tags, a personalized reference graph and PageRank, caches by file mtime, and fits rendered context toward a token budget."
  classification: FACT
  confidence: HIGH
  scope: "Pinned RepoMap source and Coder integration; runtime parse quality excluded"
  source_ids: [S-010, S-017]
  fact_dependencies: []
  method: "Traced get_tags_raw, get_ranked_tags, PageRank and binary token-fit rendering into Coder context."
  counterevidence: "unsupported/unparseable files fall back or omit symbol tags"
  adversarial_status: SUPPORTED
- claim_id: C-015
  section: state-persistence-restart
  statement: "Aider persists optional histories/logs, analytics choice, metadata/tag caches, install/update markers, OAuth/config data and Git commits using local files without a transactional session store."
  classification: FACT
  confidence: HIGH
  scope: "Pinned production persistence source; filesystem/library internals excluded"
  source_ids: [S-009, S-015, S-017, S-019, S-020, S-021, S-023]
  fact_dependencies: []
  method: "Enumerated path construction and read/write/append sites in production modules."
  counterevidence: "Git gives transactional commits for repository changes but not atomicity across all stores"
  adversarial_status: SUPPORTED
- claim_id: C-016
  section: concurrency-worktree-isolation
  statement: "The bounded Aider production/test/workflow universe contains no harness worktree coordinator, subagent scheduler, explicit cross-process lock or session isolation protocol."
  classification: FACT
  confidence: HIGH
  scope: "Static absence only across named 80 production files, 41 tests and 10 workflows"
  source_ids: [S-017, S-027, S-031]
  fact_dependencies: []
  method: "Used independent keyword/reference search plus composition/GUI/cache trace; retained zero results."
  counterevidence: "diskcache/SQLite, OS, Git, Streamlit or providers may lock internally; those are outside the harness-level claim"
  adversarial_status: SUPPORTED
- claim_id: C-017
  section: permissions-authority-sandbox
  statement: "Aider executes with OS-user authority and uses confirmations, including an explicit-yes shell guard, but implements no observed harness sandbox around file/network/process/Git actions."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned Aider source/tests; external container/OS enforcement and live bypass behavior excluded"
  source_ids: [S-010, S-013, S-019, S-024, S-029, S-031]
  fact_dependencies: []
  method: "Traced confirmation and process/file paths; corroborated explicit_yes_required behavior in a pinned test; searched sandbox primitives."
  counterevidence: "Docker documentation offers operator-supplied isolation, but no in-process sandbox was found"
  adversarial_status: CHALLENGED
- claim_id: C-018
  section: permissions-authority-sandbox
  statement: "Runtime resistance to model-originated path traversal, absolute-path and symlink workspace escape is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned model edit/application paths; excludes separately traced /add path and external OS sandbox"
  source_ids: [S-010, S-013, S-019, S-024, S-030, S-031]
  fact_dependencies: []
  method: "attempted_methods=static trace of abs_root_path, allowed_to_edit, /add containment, edit parsers and targeted test search; blocker=dynamic traversal/symlink writes require a purpose-built disposable sandbox and were not authorized; impact=workspace-containment comparison cannot be resolved; available_evidence=S-010,S-013,S-019,S-024,S-030,S-031; next_probe=run each edit format against traversal, absolute, symlink and prefix-collision paths in a denied-mount disposable container"
  counterevidence: "S-013 /add path checks containment while S-010 model edit path does not visibly share that check"
  adversarial_status: CHALLENGED
- claim_id: C-019
  section: evidence-observability
  statement: "Aider emits terminal/history/optional LLM and analytics logs, in-memory request/response hashes, usage events and Git evidence without observed correlation IDs or tamper-evident receipts."
  classification: FACT
  confidence: HIGH
  scope: "Pinned Aider evidence sinks; provider-side logs and delivery excluded"
  source_ids: [S-009, S-010, S-019, S-021, S-035]
  fact_dependencies: []
  method: "Traced IO logging, coder hashes/events, analytics capture/redaction and Git outputs; searched correlation/signature terms."
  counterevidence: "Git object hashes and call hashes provide integrity cues but not a complete correlated receipt chain"
  adversarial_status: SUPPORTED
- claim_id: C-020
  section: resource-token-cost-accounting
  statement: "Aider reports estimated/provider tokens, cache tokens and session/message costs but enforces no spend or compute budget and warns some streaming/cache estimates are inaccurate."
  classification: FACT
  confidence: HIGH
  scope: "Pinned accounting source and official benchmark note; actual provider bill excluded"
  source_ids: [S-009, S-010, S-015, S-035]
  fact_dependencies: []
  method: "Inspected preflight, usage extraction, fallback cost formulas, event totals and accuracy warnings."
  counterevidence: "context-window preflight is a token limit guard, not a monetary/session resource budget"
  adversarial_status: SUPPORTED
- claim_id: C-021
  section: failure-cancellation-retry
  statement: "Aider classifies LiteLLM errors for bounded exponential retry, applies request timeout, handles keyboard interruption and reflects malformed edits, but has no structured cancellation token."
  classification: FACT
  confidence: HIGH
  scope: "Pinned production source; runtime provider/process cleanup excluded"
  source_ids: [S-010, S-015, S-019]
  fact_dependencies: []
  method: "Traced send_message, send_completion, write and keyboard-interrupt control paths."
  counterevidence: "provider, subprocess and library internals may add cancellation behavior below Aider"
  adversarial_status: SUPPORTED
- claim_id: C-022
  section: state-persistence-restart
  statement: "Aider auto-commits selected edits and /undo only rewinds an unpushed, single-parent, session-recorded Aider commit whose changed files are clean and existed previously."
  classification: FACT
  confidence: HIGH
  scope: "Pinned GitRepo/Coder/Commands source; runtime Git edge cases excluded"
  source_ids: [S-010, S-013, S-018]
  fact_dependencies: []
  method: "Traced auto_commit, GitRepo.commit and Commands.raw_cmd_undo preconditions and reset sequence."
  counterevidence: "manual Git commands can bypass /undo safeguards but are a separate user-authorized path"
  adversarial_status: SUPPORTED
- claim_id: C-023
  section: install-update-release
  statement: "Official install/update paths use mutable selectors or scripts by default, while tag release automation builds/uploads without observed signature, SBOM, attestation, reproducibility or rollback steps."
  classification: FACT
  confidence: HIGH
  scope: "Pinned docs/source/workflow and observed package/repository metadata; external PyPI/GitHub platform controls excluded"
  source_ids: [S-002, S-003, S-004, S-008, S-023, S-031, S-034]
  fact_dependencies: []
  method: "Inspected official install docs, updater arguments, release workflow, artifact metadata and Git signature status; searched attestation terms."
  counterevidence: "PyPI publishes SHA-256 digests, which pin bytes but are not maintainer signatures or reproducible-build proof"
  adversarial_status: CHALLENGED
- claim_id: C-024
  section: tests-qualification
  statement: "The pinned tree has 41 Python test files and 489 statically counted test functions plus an Ubuntu pytest CI matrix, but no target tests were run in this research session."
  classification: FACT
  confidence: HIGH
  scope: "Static snapshot inventory and workflow intent; excludes CI outcome and runtime pass status"
  source_ids: [S-028, S-029, S-030, S-031]
  fact_dependencies: []
  method: "Counted files/test definitions and inspected pytest/CI configuration plus selected negative tests."
  counterevidence: "test presence and workflow definition do not prove passing current CI"
  adversarial_status: SUPPORTED
- claim_id: C-025
  section: security
  statement: "Aider crosses repository/model/provider/shell/web/audio/analytics trust boundaries and the bounded repository search found no in-harness sandbox, security policy, CodeQL, SBOM or attestation mechanism."
  classification: FACT
  confidence: MEDIUM
  scope: "Pinned Aider repository; external OS/container/provider/platform controls excluded"
  source_ids: [S-009, S-013, S-015, S-021, S-023, S-024, S-025, S-026, S-031]
  fact_dependencies: []
  method: "Mapped production trust crossings and ran bounded source/workflow filename/reference searches."
  counterevidence: "benchmark and Docker docs recommend external containers for generated code, outside in-harness enforcement"
  adversarial_status: CHALLENGED
- claim_id: C-026
  section: executable-entrypoints
  statement: "Reachable optional surfaces include Streamlit browser UI, HTTPX/Playwright page scraping and microphone capture with LiteLLM Whisper transcription."
  classification: FACT
  confidence: HIGH
  scope: "Pinned optional adapter source; optional dependency installation and runtime hardware/network excluded"
  source_ids: [S-009, S-013, S-025, S-026, S-027]
  fact_dependencies: []
  method: "Traced main/Commands into GUI, Scraper and Voice implementations."
  counterevidence: "extras/hardware may be absent, preventing runtime reachability in a given installation"
  adversarial_status: SUPPORTED
- claim_id: C-027
  section: agent-interface
  statement: "Aider is best compared as a turn-driven pair programmer with bounded automated edit loops, not as a general autonomous delegated-agent harness."
  classification: INFERENCE
  confidence: HIGH
  scope: "Pinned default architecture and documented benchmark/CLI behavior; excludes bespoke wrappers"
  source_ids: [S-009, S-010, S-012, S-032]
  fact_dependencies: [C-006, C-007, C-009]
  method: "Reasoning chain: user/one-shot entrypoints plus one Coder loop plus synchronous architect-editor and absence of delegation scheduler imply bounded turn automation; alternative=watch/yes/auto-test can look autonomous for repeated local edits."
  counterevidence: "watch mode, --message, auto-accept and reflection can automate work without continuous prompts"
  adversarial_status: SUPPORTED
- claim_id: C-028
  section: strengths
  statement: "For local Git pair programming, explicit edit coders, ranked context, reflection and commit/undo form a coherent inspectable editing pipeline."
  classification: INFERENCE
  confidence: HIGH
  scope: "Local single-user Git scenario; excludes unattended/multi-tenant use"
  source_ids: [S-010, S-014, S-017, S-018]
  fact_dependencies: [C-007, C-008, C-014, C-022]
  method: "Combined traced modular boundaries and evidence-bearing Git lifecycle; alternative=runtime model quality or failures could reduce practical coherence."
  counterevidence: "runtime reliability and productivity were not measured"
  adversarial_status: NOT_APPLICABLE:interpretive-strength
- claim_id: C-029
  section: strengths
  statement: "One-shot CLI is a practical automation seam, whereas direct Python integration is conditional because upstream disclaims stability."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Headless integration at pinned snapshot; excludes API compatibility testing"
  source_ids: [S-009, S-033]
  fact_dependencies: [C-006]
  method: "Derived from explicit one-turn exit behavior and documentation's unsupported-API warning; alternative=a wrapper can pin a version and absorb churn."
  counterevidence: "direct API is documented by example despite disclaimer"
  adversarial_status: NOT_APPLICABLE:interpretive-strength
- claim_id: C-030
  section: liabilities
  statement: "Using Aider beyond local pair programming requires an external authority/isolation layer because consequential actions share invoking-user privileges."
  classification: INFERENCE
  confidence: HIGH
  scope: "Unattended, untrusted-repository or multi-tenant scenario"
  source_ids: [S-010, S-013, S-019, S-024, S-031]
  fact_dependencies: [C-016, C-017, C-025]
  method: "Reasoning chain: no harness isolation plus direct host capabilities plus shared-state absence makes external enforcement prerequisite; alternative=single trusted local user may accept this boundary."
  counterevidence: "explicit shell confirmation and operator Docker can reduce exposure in documented use"
  adversarial_status: SUPPORTED
- claim_id: C-031
  section: liabilities
  statement: "Mutable provider metadata, best-effort costs, unstable Python API and un-attested mutable update paths increase reproducibility and governance burden."
  classification: INFERENCE
  confidence: HIGH
  scope: "Pinned/audited automation scenario; excludes external pinning/attestation systems"
  source_ids: [S-002, S-005, S-008, S-015, S-021, S-023, S-031, S-035]
  fact_dependencies: [C-003, C-011, C-019, C-020, C-023]
  method: "Combined source-surface divergence, mutable metadata/update selectors and non-authoritative accounting; alternative=operators can impose lockfiles, egress controls and artifact verification."
  counterevidence: "PyPI hashes and tag/source parity support manual pinning"
  adversarial_status: SUPPORTED
- claim_id: C-032
  section: transferable-patterns
  statement: "Syntax-tag graph ranking followed by token-fit rendering is a candidate pattern for bounded repository context selection."
  classification: INFERENCE
  confidence: HIGH
  scope: "Research candidate only; requires separate injection, parser and performance evaluation"
  source_ids: [S-010, S-017]
  fact_dependencies: [C-014]
  method: "Abstracted minimal mechanism from RepoMap while preserving repository-to-model trust boundary; alternative=embedding retrieval or compiler indexes may fit other constraints."
  counterevidence: "unsupported languages and approximate token estimates limit universality"
  adversarial_status: NOT_APPLICABLE:research-pattern
- claim_id: C-033
  section: transferable-patterns
  statement: "A noninteractive blanket-yes mode that still denies explicitly classified shell prompts is a candidate approval-safety pattern."
  classification: INFERENCE
  confidence: HIGH
  scope: "Approval primitive only; not a complete capability system"
  source_ids: [S-010, S-019, S-024, S-029]
  fact_dependencies: [C-017]
  method: "Abstracted explicit_yes_required source behavior corroborated by pinned test; alternative=a deny-by-default capability token is stronger."
  counterevidence: "other consequential actions do not all use explicit_yes_required"
  adversarial_status: SUPPORTED
- claim_id: C-034
  section: transferable-patterns
  statement: "Declarative model behavior profiles behind one adapter are conditional because safe transfer requires stronger schema/version/conformance governance than observed."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Research pattern for heterogeneous providers; no adoption authority"
  source_ids: [S-015, S-016]
  fact_dependencies: [C-011, C-012]
  method: "Abstracted settings/adapter mechanism and bounded risks from mutable metadata/heuristics; alternative=provider-specific typed adapters offer stronger guarantees at higher cost."
  counterevidence: "loose overrides are operationally flexible for local users"
  adversarial_status: NOT_APPLICABLE:research-pattern
- claim_id: C-035
  section: rejected-patterns-curiosity-no-go
  statement: "Direct host-authority shell execution is CURIOSITY_NO_GO for transfer into an autonomous or multi-tenant harness without a separately proven execution boundary."
  classification: INFERENCE
  confidence: HIGH
  scope: "Transfer scenario only; does not reject user-invoked local /run"
  source_ids: [S-013, S-024, S-031, S-032]
  fact_dependencies: [C-010, C-017, C-025]
  method: "Compared direct shell/process authority with absent sandbox/cancel/receipt controls; alternative=isolated disposable executor could reopen."
  counterevidence: "model-suggested shell requires explicit yes and benchmark docs prescribe Docker"
  adversarial_status: SUPPORTED
- claim_id: C-036
  section: rejected-patterns-curiosity-no-go
  statement: "Aider's vendor-maintained leaderboard is CURIOSITY_NO_GO as standalone proof for selecting a harness architecture."
  classification: INFERENCE
  confidence: HIGH
  scope: "Harness-selection evidence; benchmark remains relevant to model/edit-format performance"
  source_ids: [S-032, S-035]
  fact_dependencies: [C-040]
  method: "Compared measured task/ownership/retry dimensions against harness decision dimensions; alternative=independent reproduction with matched operational metrics could reopen."
  counterevidence: "benchmark records source commit/settings and end-to-end test outcomes, useful within its narrower scope"
  adversarial_status: SUPPORTED
- claim_id: C-037
  section: permissions-authority-sandbox
  statement: "Runtime startup side effects, capability-denial bypass, malformed boundary handling and instruction-injection containment remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned CLI/coder/tool/context paths; no live target/provider/process execution"
  source_ids: [S-009, S-010, S-013, S-019, S-024, S-029, S-031]
  fact_dependencies: []
  method: "attempted_methods=static entrypoint/authority/context trace, selected negative-test inspection and bounded absence search; blocker=safe dynamic proof needs disposable denied filesystem/network/process fixtures and provider stubs not available within authority; impact=enforcement and injection comparison remains partial; available_evidence=S-009,S-010,S-013,S-019,S-024,S-029,S-031; next_probe=run no-op, malformed, deny-path and repository/tool injection matrix in a network-denied read-only disposable container with syscall/file/network capture"
  counterevidence: "source has confirmations, token checks and parse reflection, but these are not dynamic enforcement proof"
  adversarial_status: NOT_PROBED
- claim_id: C-038
  section: failure-cancellation-retry
  statement: "Runtime provider cancellation, timeout cleanup, retry duplication/idempotency and authoritative usage/cost reconciliation remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned model/coder retry and accounting paths; external provider and bill excluded"
  source_ids: [S-010, S-015, S-031, S-035]
  fact_dependencies: []
  method: "attempted_methods=static retry/cancel/accounting trace and bounded test search; blocker=requires deterministic fake provider streams plus live-style usage and process cancellation harness not safely provisioned; impact=reliability and cost-governance comparison remains partial; available_evidence=S-010,S-015,S-031,S-035; next_probe=inject auth/rate/timeout/interrupted stream/duplicate usage responses into a fake LiteLLM boundary and reconcile attempts, writes, events and totals"
  counterevidence: "bounded retry classes, timeout and accounting formulas exist but do not prove runtime cleanup or bill agreement"
  adversarial_status: NOT_PROBED
- claim_id: C-039
  section: concurrency-worktree-isolation
  statement: "Runtime session collisions, crash/restart recovery and evidence loss or forgery behavior remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned local stores, GUI/shared cache and evidence sinks"
  source_ids: [S-015, S-017, S-019, S-021, S-027, S-031]
  fact_dependencies: []
  method: "attempted_methods=static store/cache/concurrency/evidence trace and lock/correlation search; blocker=requires two isolated concurrent processes, crash injection and sink capture against disposable worktrees; impact=multi-session, restart and audit comparisons remain unresolved; available_evidence=S-015,S-017,S-019,S-021,S-027,S-031; next_probe=run colliding sessions against two worktrees/shared HOME, interrupt at write/commit/cache/event boundaries, then inspect recovery and receipts"
  counterevidence: "SQLite/diskcache, Git and OS may provide partial lower-level atomicity not characterized here"
  adversarial_status: NOT_PROBED
- claim_id: C-040
  section: tests-qualification
  statement: "Aider's benchmark is an Aider-maintained edit-and-test evaluation over Exercism/polyglot tasks with retries, recorded settings/commit/cost and Docker guidance for generated-code execution."
  classification: FACT
  confidence: HIGH
  scope: "Pinned benchmark README and official benchmark notes; excludes independent reproduction and leaderboard result validity"
  source_ids: [S-032, S-035]
  fact_dependencies: []
  method: "Inspected benchmark design, report fields, tries semantics, contribution path, pricing caveat and safety guidance."
  counterevidence: "none for methodology description; comparative claims remain unverified"
  adversarial_status: SUPPORTED
```

## 27. Source ledger {#source-ledger}

```yaml
- source_id: S-001
  source_kind: runtime-observation
  title: "Official Git snapshot identity and clean-state observation"
  url: "https://github.com/Aider-AI/aider/commit/5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  commit_or_ref: "origin/main"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-snapshot"
  symbol: "Git remote, HEAD, refs, date, status, signature and submodule declaration"
  line_anchor: "N/A:no-line-anchor"
  command: "git clone --filter=blob:none --no-checkout https://github.com/Aider-AI/aider.git repo && git -C repo remote get-url origin && git -C repo checkout --detach origin/main && git -C repo rev-parse HEAD && git -C repo describe --tags --always --dirty && git -C repo show -s --format='%cI' HEAD && git -C repo status --porcelain=v1 && git -C repo show -s --format='%G?' HEAD && { if test -f repo/.gitmodules; then cat repo/.gitmodules; else echo .gitmodules=absent; fi; }"
  command_environment: "macOS 27 arm64; git 2.54.0; disposable approved temp directory; network only for clone; no target code executed"
  output_or_hash: "inline:origin=https://github.com/Aider-AI/aider.git; HEAD=5dc9490bb35f9729ef2c95d00a19ccd30c26339c; describe=v0.86.3.dev-53-g5dc9490b; commit_date=2026-05-22T07:02:20-07:00; status=clean; signature_check_stderr=error: cannot run gpg: No such file or directory; commit_signature_status=N; .gitmodules=absent"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-001, C-003]
  notes: "Selected because Git is the primary immutable identity source; preferable to search snippets. GPG executable was unavailable, while Git reported N (no signature)."
- source_id: S-002
  source_kind: release-metadata
  title: "PyPI aider-chat 0.86.2 metadata"
  url: "https://pypi.org/pypi/aider-chat/0.86.2/json"
  commit_or_ref: "0.86.2"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "aider-chat@0.86.2+sha256:64f6a0c66c9f4633ad9f479bca3e64ebcba02b9da03c6b604b74a44736b2416e(wheel),sha256:f38a9d322f5609f0c13af82d50c6a11170185b3fdf26956e4a7e89ba19819159(sdist)"
  code_path: "N/A:no-code-path"
  symbol: "info.version; urls[].digests.sha256; upload_time_iso_8601"
  line_anchor: "N/A:JSON-document"
  command: "curl -fsSL https://pypi.org/pypi/aider-chat/0.86.2/json"
  command_environment: "macOS 27 arm64; curl 8.7.1; HTTPS; passive metadata retrieval"
  output_or_hash: "inline:version=0.86.2; wheel_uploaded=2026-02-12T00:42:52.678771Z; sdist_uploaded=2026-02-12T00:42:54.835777Z; license=null; requires_python=<3.13,>=3.10"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-002, C-003, C-023, C-031]
  notes: "Primary registry metadata selected for exact artifact identity; latest project JSON was also checked."
- source_id: S-003
  source_kind: package-artifact
  title: "aider-chat 0.86.2 source distribution"
  url: "https://files.pythonhosted.org/packages/39/45/71111a018c653b7e743216188fb73cd640a86abbda56b7e430f65cd45d23/aider_chat-0.86.2.tar.gz"
  commit_or_ref: "v0.86.2"
  resolved_commit: "253f0368b873ba30d8ee26e463718f0c03614ddf"
  package_identity: "aider-chat@0.86.2+sha256:f38a9d322f5609f0c13af82d50c6a11170185b3fdf26956e4a7e89ba19819159"
  code_path: "aider_chat-0.86.2/"
  symbol: "sdist archive, PKG-INFO, LICENSE.txt, representative production files"
  line_anchor: "N/A:archive-members"
  command: >-
    rm -rf sdist-check && mkdir sdist-check && curl -fsSL 'https://files.pythonhosted.org/packages/39/45/71111a018c653b7e743216188fb73cd640a86abbda56b7e430f65cd45d23/aider_chat-0.86.2.tar.gz' -o sdist-check/aider-chat-0.86.2.tar.gz && shasum -a 256 sdist-check/aider-chat-0.86.2.tar.gz && tar -xzf sdist-check/aider-chat-0.86.2.tar.gz -C sdist-check && for file in LICENSE.txt pyproject.toml aider/main.py aider/models.py aider/coders/base_coder.py; do git -C repo show '253f0368b873ba30d8ee26e463718f0c03614ddf:'"$file" | cmp - "sdist-check/aider_chat-0.86.2/$file" && printf 'MATCH %s\n' "$file"; done
  command_environment: "macOS 27 arm64; git 2.54.0; static archive inspection beside detached repo clone in disposable temp; package/install scripts not run"
  output_or_hash: "sha256:f38a9d322f5609f0c13af82d50c6a11170185b3fdf26956e4a7e89ba19819159"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-002, C-004, C-005, C-023]
  notes: "Primary published bytes selected; LICENSE.txt, pyproject.toml, aider/main.py, aider/models.py and aider/coders/base_coder.py matched tag commit v0.86.2 byte-for-byte. This is not full reproducible-build proof. An initial validation loop used zsh-special variable name path, shadowed PATH, and failed command lookup; the retained command uses file and passed."
- source_id: S-004
  source_kind: package-artifact
  title: "aider-chat 0.86.2 universal wheel"
  url: "https://files.pythonhosted.org/packages/75/f7/e20749d9a510673e7adf910b005e3efe4ceaf9c194f1dd40d6931a3f34b9/aider_chat-0.86.2-py3-none-any.whl"
  commit_or_ref: "v0.86.2"
  resolved_commit: "253f0368b873ba30d8ee26e463718f0c03614ddf"
  package_identity: "aider-chat@0.86.2+sha256:64f6a0c66c9f4633ad9f479bca3e64ebcba02b9da03c6b604b74a44736b2416e"
  code_path: "aider_chat-0.86.2.dist-info/"
  symbol: "METADATA; entry_points.txt; licenses/LICENSE.txt"
  line_anchor: "N/A:zip-members"
  command: "curl -fsSL 'https://files.pythonhosted.org/packages/75/f7/e20749d9a510673e7adf910b005e3efe4ceaf9c194f1dd40d6931a3f34b9/aider_chat-0.86.2-py3-none-any.whl' -o aider_chat-0.86.2-py3-none-any.whl && shasum -a 256 aider_chat-0.86.2-py3-none-any.whl && unzip -p aider_chat-0.86.2-py3-none-any.whl 'aider_chat-0.86.2.dist-info/METADATA' | grep -E '^(Name|Version|Classifier: License|License-File):' && unzip -p aider_chat-0.86.2-py3-none-any.whl 'aider_chat-0.86.2.dist-info/entry_points.txt' && unzip -p aider_chat-0.86.2-py3-none-any.whl 'aider_chat-0.86.2.dist-info/licenses/LICENSE.txt' | shasum -a 256"
  command_environment: "macOS 27 arm64; curl 8.7.1; unzip 6.00; static archive inspection; no imports or target code execution"
  output_or_hash: "sha256:64f6a0c66c9f4633ad9f479bca3e64ebcba02b9da03c6b604b74a44736b2416e"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-002, C-004, C-023]
  notes: "Installable artifact selected to corroborate sdist metadata; entry point is aider=aider.main:main and license hash is cfc7749b...."
- source_id: S-005
  source_kind: release-metadata
  title: "Official GitHub Releases API listing"
  url: "https://api.github.com/repos/Aider-AI/aider/releases?per_page=5"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "releases[].tag_name; published_at"
  line_anchor: "N/A:JSON-document"
  command: "curl -fsSL 'https://api.github.com/repos/Aider-AI/aider/releases?per_page=5' -o releases.json && shasum -a 256 releases.json"
  command_environment: "macOS 27 arm64; curl 8.7.1; unauthenticated GitHub API"
  output_or_hash: "sha256:a76d77c94fafd1f410d79671e3f800517a57fb7be529ac82eb5ff3e142886ec2"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-003, C-031]
  notes: "Primary release-object source retained to document negative result: no v0.86.1/v0.86.2 Release object in first five, latest v0.86.0. Initial unquoted zsh URL failed glob expansion; quoted retry succeeded."
- source_id: S-006
  source_kind: license
  title: "Repository Apache License 2.0 text"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/LICENSE.txt#L1-L202"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE.txt"
  symbol: "Apache License Version 2.0"
  line_anchor: "L1-L202"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:LICENSE.txt | shasum -a 256"
  command_environment: "macOS 27 arm64; git 2.54.0; static text inspection"
  output_or_hash: "sha256:cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-004]
  notes: "Actual license text selected over repository/PyPI labels."
- source_id: S-007
  source_kind: repository-file
  title: "Project package metadata and console entrypoint"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/pyproject.toml#L2-L49"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "pyproject.toml"
  symbol: "project; project.scripts.aider; tool.setuptools.packages.find"
  line_anchor: "L2-L49"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:pyproject.toml | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:1faaea506c1d42f5e9db0d7152cea43920596b901e281e27c2655e791284c9ef"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-004, C-005, C-006]
  notes: "Composition/package metadata selected as primary over generated PKG-INFO for main snapshot."
- source_id: S-008
  source_kind: repository-file
  title: "Tag-triggered PyPI release workflow"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/.github/workflows/release.yml#L1-L34"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/release.yml"
  symbol: "build_and_publish"
  line_anchor: "L1-L34"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:.github/workflows/release.yml | shasum -a 256"
  command_environment: "macOS 27 arm64; static workflow inspection; actions not executed"
  output_or_hash: "sha256:8f96e704d75ed47aa1fafd8d4276a7907a3204f1c908bf11ed7b957eb2002e32"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-023, C-031]
  notes: "Primary release automation selected; absence claims are bounded with S-031 search."
- source_id: S-009
  source_kind: repository-file
  title: "CLI composition root"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/main.py#L451-L1180"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/main.py"
  symbol: "main; register_models; load_dotenv_files; is_first_run_of_new_version"
  line_anchor: "L451-L1180"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/main.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:a93787156610c3f03cdcc0c9c096a7140dfa208986bd739b64a745533bee9c71"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-006, C-007, C-009, C-011, C-015, C-019, C-020, C-025, C-026, C-027, C-029, C-037]
  notes: "Primary composition root selected for reachability; source proves structure, not runtime behavior."
- source_id: S-010
  source_kind: repository-file
  title: "Core Coder loop, context, edits, cost and shell handling"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/coders/base_coder.py#L124-L2485"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/coders/base_coder.py"
  symbol: "Coder.create; run; send_message; send; apply_updates; allowed_to_edit; auto_commit; handle_shell_commands"
  line_anchor: "L124-L2485"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/coders/base_coder.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:04a7b38c4f1d2b1684ac958f40bcd81a28b00139eae88afed59d2c970bef1ee1"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-007, C-008, C-009, C-010, C-013, C-014, C-017, C-018, C-019, C-020, C-021, C-022, C-027, C-028, C-030, C-032, C-033, C-037, C-038]
  notes: "Decision-critical core selected; broad anchor is intentional because claims trace multiple named symbols."
- source_id: S-011
  source_kind: repository-file
  title: "Built-in coder registry"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/coders/__init__.py#L1-L34"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/coders/__init__.py"
  symbol: "__all__"
  line_anchor: "L1-L34"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/coders/__init__.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:a48ae22b11cd652bf4bc0c5f2b602508ac3c5d065d48c442921ccc1acf81776a"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-008]
  notes: "Small authoritative registry selected over filename inference."
- source_id: S-012
  source_kind: repository-file
  title: "Architect/editor sequential mode"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/coders/architect_coder.py#L6-L48"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/coders/architect_coder.py"
  symbol: "ArchitectCoder.reply_completed"
  line_anchor: "L6-L48"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/coders/architect_coder.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:6fb2aab62be79653ddc8c7f16e711477d1b40b56456a26a9a55db9473d0390cb"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-008, C-009, C-027]
  notes: "Selected to distinguish multi-model pair flow from delegated agents."
- source_id: S-013
  source_kind: repository-file
  title: "In-chat commands, Git/undo/process/web/voice adapters"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/commands.py#L30-L1280"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/commands.py"
  symbol: "Commands; raw_cmd_undo; cmd_git; cmd_run; cmd_web; cmd_voice; cmd_add"
  line_anchor: "L30-L1280"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/commands.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:4457e9da5ac3d89003648d68f596aa9857a7e76e36dcff8ebd10f4b59ccd77e7"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-007, C-010, C-017, C-018, C-022, C-025, C-026, C-030, C-035, C-037]
  notes: "Primary command boundary selected; direct shell code is corroborated in S-024."
- source_id: S-014
  source_kind: repository-file
  title: "Representative search/replace edit coder"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/coders/editblock_coder.py#L15-L95"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/coders/editblock_coder.py"
  symbol: "EditBlockCoder.get_edits; apply_edits"
  line_anchor: "L15-L95"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/coders/editblock_coder.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:244df08f5ccd19928bcdac1901ae591a7a786d12a6f70d31400baaefb5a136a3"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-008, C-010, C-028]
  notes: "Representative concrete parser/applicator selected; not generalized to every format without base/registry evidence."
- source_id: S-015
  source_kind: repository-file
  title: "Model settings, metadata, transport and retry adapter"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/models.py#L128-L1080"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/models.py"
  symbol: "ModelSettings; ModelInfoManager; Model.configure_model_settings; token_count; send_completion; simple_send_with_retries"
  line_anchor: "L128-L1080"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/models.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:37784de662eeafacf17cbc4eb656246aadee20477b8ad43768caf7d373ab6e0d"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-007, C-011, C-012, C-015, C-020, C-021, C-025, C-031, C-034, C-038, C-039]
  notes: "Primary provider/model boundary selected; mutable external metadata is recorded as a limitation."
- source_id: S-016
  source_kind: repository-file
  title: "Lazy LiteLLM loading and global adapter settings"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/llm.py#L1-L47"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/llm.py"
  symbol: "LazyLiteLLM._load_litellm"
  line_anchor: "L1-L47"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/llm.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:7c609e98fd57f4c070ac37ec4ca189ff5b31fb22b3dc3ca83afc5960e92f19a9"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-011, C-012, C-034]
  notes: "Selected to identify the actual provider library boundary rather than infer it from requirements."
- source_id: S-017
  source_kind: repository-file
  title: "Repository map extraction, ranking, caches and token fit"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/repomap.py#L42-L748"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/repomap.py"
  symbol: "RepoMap.get_repo_map; get_tags_raw; get_ranked_tags; get_ranked_tags_map_uncached; render_tree"
  line_anchor: "L42-L748"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/repomap.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:a5d4befe70445114b9f62da47b0eeb2a5384f9e84a0c083c77a4b339caf61ecd"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-013, C-014, C-015, C-016, C-028, C-032, C-039]
  notes: "Primary implementation selected over marketing repo-map description."
- source_id: S-018
  source_kind: repository-file
  title: "Git repository and commit implementation"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/repo.py#L52-L325"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/repo.py"
  symbol: "GitRepo.__init__; commit"
  line_anchor: "L52-L325"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/repo.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:a49343d63d3faa684003f9e59306215e6f3d77b7b944a71b88b132e0c78c5df0"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-007, C-022, C-028]
  notes: "Primary Git side-effect source selected; undo implementation is in S-013."
- source_id: S-019
  source_kind: repository-file
  title: "IO files, writes, confirmations and logs"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/io.py#L230-L1136"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/io.py"
  symbol: "InputOutput.__init__; write_text; log_llm_history; confirm_ask; append_chat_history"
  line_anchor: "L230-L1136"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/io.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:7f62a79c8202f2a3793410bac4c983e417fb886513b90faf0e0579d5bb7d047b"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-007, C-015, C-017, C-018, C-019, C-021, C-030, C-033, C-037, C-039]
  notes: "Primary approval/persistence source; runtime permission behavior remains unproven."
- source_id: S-020
  source_kind: repository-file
  title: "Chat history summarization"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/history.py#L7-L123"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/history.py"
  symbol: "ChatSummary"
  line_anchor: "L7-L123"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/history.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:5c9377875d6c9268ba16ec6cfd3cc30c7d3d8c23d42ffb2a5c3bc375aefc7e79"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-013, C-015]
  notes: "Primary compaction source selected; no summary fidelity claim is made."
- source_id: S-021
  source_kind: repository-file
  title: "Analytics opt-in, local identity and event sinks"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/analytics.py#L55-L254"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/analytics.py"
  symbol: "Analytics.enable; need_to_ask; get_or_create_uuid; event"
  line_anchor: "L55-L254"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/analytics.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection; analytics not enabled"
  output_or_hash: "sha256:739ba368270c737c86fbdaf3ff4a12b2a070995411c499ee8ba884ff20f263f3"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-015, C-019, C-025, C-031, C-039]
  notes: "Implementation preferred over privacy prose for actual fields and control flow."
- source_id: S-022
  source_kind: repository-file
  title: "CLI options and defaults"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/args.py#L230-L830"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/args.py"
  symbol: "get_parser arguments: cache/map/git/lint/test/analytics/update/message/gui/voice/yes"
  line_anchor: "L230-L830"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/args.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection"
  output_or_hash: "sha256:bc38cb83d33435f7cfd8dc160cd4b1b3aeb607590334997e5ff90c26f0d41270"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-006]
  notes: "Parser source selected over generated options docs for cutoff defaults."
- source_id: S-023
  source_kind: repository-file
  title: "Mutable update check and self-install paths"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/versioncheck.py#L12-L113"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/versioncheck.py"
  symbol: "install_from_main_branch; install_upgrade; check_version"
  line_anchor: "L12-L113"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/versioncheck.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection; updater not run"
  output_or_hash: "sha256:47d47581425880eb6653272927862ac429023b2950052899fe9fc10271c9f07e"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-015, C-023, C-025, C-031]
  notes: "Primary updater code selected; no unsafe installer execution."
- source_id: S-024
  source_kind: repository-file
  title: "Host shell process execution"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/run_cmd.py#L11-L132"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/run_cmd.py"
  symbol: "run_cmd; run_cmd_subprocess; run_cmd_pexpect"
  line_anchor: "L11-L132"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/run_cmd.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection; commands not executed"
  output_or_hash: "sha256:f7e36948be2196a22775ffc43758e79967e35fbbc83db0e02a018f19102bd91c"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-007, C-010, C-017, C-018, C-025, C-030, C-033, C-035, C-037]
  notes: "Primary process side-effect source selected; pexpect/subprocess behavior not dynamically exercised."
- source_id: S-025
  source_kind: repository-file
  title: "HTTPX and Playwright web scraper"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/scrape.py#L17-L209"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/scrape.py"
  symbol: "install_playwright; Scraper.scrape; scrape_with_playwright; scrape_with_httpx"
  line_anchor: "L17-L209"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/scrape.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection; browser/network not run"
  output_or_hash: "sha256:3d22a70734de8b2a824d45580816430bca27437f46567c69074116c2fed006cf"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-025, C-026]
  notes: "Primary optional network/browser boundary selected."
- source_id: S-026
  source_kind: repository-file
  title: "Microphone and transcription implementation"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/voice.py#L33-L180"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/voice.py"
  symbol: "Voice.raw_record_and_transcribe"
  line_anchor: "L33-L180"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/voice.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection; microphone/provider not used"
  output_or_hash: "sha256:24a57e219ed9c0bef522d7d7e783a624eccf4aae593e51ad78122e9cd7149025"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-025, C-026]
  notes: "Primary optional audio boundary selected; tempfile/runtime cleanup not claimed."
- source_id: S-027
  source_kind: repository-file
  title: "Experimental Streamlit GUI state"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/gui.py#L17-L89"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/gui.py"
  symbol: "State; get_state; get_coder"
  line_anchor: "L17-L89"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/gui.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection; Streamlit not launched"
  output_or_hash: "sha256:2671ef962d494c2187020b0e67c1e401638a005c669e06f2be264825e62f8ecc"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-006, C-016, C-026, C-039]
  notes: "Selected to establish GUI reachability/shared cached state, not server security."
- source_id: S-028
  source_kind: repository-file
  title: "Ubuntu pytest CI matrix"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/.github/workflows/ubuntu-tests.yml#L1-L56"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: ".github/workflows/ubuntu-tests.yml"
  symbol: "jobs.build.strategy; Run tests"
  line_anchor: "L1-L56"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:.github/workflows/ubuntu-tests.yml | shasum -a 256"
  command_environment: "macOS 27 arm64; static workflow inspection; CI not executed"
  output_or_hash: "sha256:c0576896c9e22b19dbd11ebc122b4cdaa19e90d8139da4bc0b12f5282b1fb948"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-024]
  notes: "Primary Ubuntu CI definition selected; no current workflow run was fetched."
- source_id: S-029
  source_kind: repository-file
  title: "Explicit confirmation tests"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/tests/basic/test_io.py#L176-L206"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "tests/basic/test_io.py"
  symbol: "test_confirm_ask_explicit_yes_required"
  line_anchor: "L176-L206"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:tests/basic/test_io.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static test inspection; pytest not run"
  output_or_hash: "sha256:f5c41cb4b8df04ec6d575a1fdfe1f433ae04ef6501ac08f967dc6004e23d848a"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-017, C-024, C-033, C-037]
  notes: "Test corroborates intended explicit-yes behavior only; it is not production runtime evidence."
- source_id: S-030
  source_kind: repository-file
  title: "Outside-root add tests and command coverage"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/tests/basic/test_commands.py#L464-L507"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "tests/basic/test_commands.py"
  symbol: "test_cmd_add_from_outside_root; test_cmd_add_from_outside_git"
  line_anchor: "L464-L507"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:tests/basic/test_commands.py | shasum -a 256"
  command_environment: "macOS 27 arm64; static test inspection; pytest not run"
  output_or_hash: "sha256:e94a0b1293191a353dbcabbace9274c0c98d87726bf8e33e84a8da6c74656c02"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-018, C-024]
  notes: "Selected as counterevidence for /add only; it does not resolve model-originated edit traversal."
- source_id: S-031
  source_kind: test-output
  title: "Bounded static adversarial and absence probe"
  url: "https://github.com/Aider-AI/aider/tree/5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/**/*.py; tests/**/*.py; .github/workflows/*.{yml,yaml}"
  symbol: "bounded searches: worktree, subagent/delegation, sandbox primitives, MCP, locks, structured cancel, correlation IDs, attestations; test inventory"
  line_anchor: "N/A:multi-file-search"
  command: >-
    { echo 'SNAPSHOT 5dc9490bb35f9729ef2c95d00a19ccd30c26339c'; echo 'UNIVERSE production Python: aider/**/*.py excluding aider/website; tests: tests/**/*.py; workflows: .github/workflows/*.yml and *.yaml'; for pattern in 'worktree|git worktree' 'subagent|delegate|delegation' 'sandbox|seccomp|seatbelt|bubblewrap|firejail' 'MCP|model.context.protocol' 'filelock|fcntl|flock|portalocker' 'signal[.]signal|asyncio[.]CancelledError|cancel[(]' 'trace_id|span_id|correlation_id' 'checksum|sha256|sigstore|attestation|provenance'; do echo "--- PATTERN $pattern production ---"; rg -n -i "$pattern" aider -g '*.py' -g '!website/**' || true; echo "--- PATTERN $pattern tests/workflows ---"; rg -n -i "$pattern" tests .github/workflows -g '*.py' -g '*.yml' -g '*.yaml' || true; done; echo '--- PATH/DENIAL/MALFORMED TEST SEARCH ---'; rg -n -i 'traversal|absolute path|outside.root|outside_root|symlink|prefix.collision|path.escape|workspace.escape|malformed|oversiz|explicit_yes_required|permission|injection' tests -g '*.py' || true; echo '--- TEST FILE INVENTORY ---'; find tests -type f -name '*.py' -print | sort; echo '--- COUNTS ---'; echo "production_python=$(find aider -type f -name '*.py' ! -path 'aider/website/*' | wc -l | tr -d ' ')"; echo "test_python=$(find tests -type f -name '*.py' | wc -l | tr -d ' ')"; echo "workflow_yaml=$(find .github/workflows -type f -name '*.yml' -o -type f -name '*.yaml' | wc -l | tr -d ' ')"; echo "test_functions=$(rg -n '^[[:space:]]*(async[[:space:]]+)?def[[:space:]]+test_' tests -g '*.py' | wc -l | tr -d ' ')"; } > static-probes-v3.txt && shasum -a 256 static-probes-v3.txt
  command_environment: "macOS 27 arm64; ripgrep static inspection in clean detached clone; output retained in approved temp; no target execution"
  output_or_hash: "sha256:bddd366cfebe4b84dbf17644b3c706d006581c7c7970693146226cbb43efa937"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-008, C-009, C-010, C-016, C-017, C-018, C-023, C-024, C-025, C-030, C-031, C-035, C-037, C-038, C-039]
  notes: "Retains negative results and the complete test-file inventory. Search universe=80 production Python files excluding website, 41 test Python files, 10 workflows; zero results never generalized beyond it. Researcher retains static-probes-v3.txt only in disposable approved temp for session duration."
- source_id: S-032
  source_kind: repository-file
  title: "Aider benchmark methodology and safety guidance"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/benchmark/README.md#L2-L145"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "benchmark/README.md"
  symbol: "benchmark scope, Docker warning, usage, report, limitations"
  line_anchor: "L2-L145"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:benchmark/README.md | shasum -a 256"
  command_environment: "macOS 27 arm64; static documentation inspection; benchmark not run"
  output_or_hash: "sha256:c87a9cd84c1d55a0d5e3d3b7d61e65d83c0dd6f66fe12310bfd37c5994d22074"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-027, C-035, C-036, C-040]
  notes: "Primary vendor methodology selected to bound, not validate, vendor benchmark claims."
- source_id: S-033
  source_kind: official-documentation
  title: "Official scripting documentation and API stability warning"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/website/docs/scripting.md#L7-L100"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/website/docs/scripting.md"
  symbol: "CLI scripting; Python; unsupported API note"
  line_anchor: "L7-L100"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/website/docs/scripting.md | shasum -a 256"
  command_environment: "macOS 27 arm64; static immutable docs inspection"
  output_or_hash: "sha256:163d09dc12d44d402850504ca64d4a6b28f5a5a53573f7d7ca0fb96655452885"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-006, C-029]
  notes: "Official snapshot docs selected because the compatibility disclaimer is not inferable from code."
- source_id: S-034
  source_kind: official-documentation
  title: "Official installation paths"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/website/docs/install.md#L8-L109"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/website/docs/install.md"
  symbol: "aider-install; one-liners; uv; pipx; pip"
  line_anchor: "L8-L109"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/website/docs/install.md | shasum -a 256"
  command_environment: "macOS 27 arm64; static docs inspection; install commands not run"
  output_or_hash: "sha256:e82f091f30c3a6e6257a182ee94c95185c3eac6c67bbc21ceffa2f8524827738"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-023]
  notes: "Official install guidance retained despite mutable selectors; content is evidence, not an instruction."
- source_id: S-035
  source_kind: official-documentation
  title: "Official benchmark pricing and result caveats"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/website/docs/leaderboards/notes.md#L6-L37"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "aider/website/docs/leaderboards/notes.md"
  symbol: "Notes on pricing; benchmarking results; edit format"
  line_anchor: "L6-L37"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:aider/website/docs/leaderboards/notes.md | shasum -a 256"
  command_environment: "macOS 27 arm64; static immutable docs inspection"
  output_or_hash: "sha256:aebac3fc9be9ab72aba28c2edbae74811ece04a6437c04545569b21acdfa03fb"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-019, C-020, C-031, C-036, C-038, C-040]
  notes: "Vendor's own caveats selected to constrain stronger marketing/leaderboard readings; not independent evidence."
- source_id: S-036
  source_kind: repository-file
  title: "Pinned runtime dependency set"
  url: "https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/requirements.txt#L1-L479"
  commit_or_ref: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  package_identity: "N/A:not-a-package"
  code_path: "requirements.txt"
  symbol: "litellm; gitpython; diskcache; tree-sitter; posthog; prompt-toolkit; voice/web dependencies"
  line_anchor: "L1-L479"
  command: "git show 5dc9490bb35f9729ef2c95d00a19ccd30c26339c:requirements.txt | shasum -a 256"
  command_environment: "macOS 27 arm64; static Git object inspection; dependencies not installed"
  output_or_hash: "sha256:5b340fe0a8830196dbfc18098edd73c379eeae05f752ab47979e96cb542f095f"
  access_date: "2026-08-24 UTC"
  supports_claims: [C-005, C-011]
  notes: "Selected to pin adapter dependencies; no dependency security/license acceptance is implied."
```

### Bibliography rationale

The ledger prioritizes immutable official Git files, registry metadata and
downloaded artifact bytes. S-009/S-010/S-015/S-017 are retained as the four
decision-critical implementation traces; smaller sources discriminate specific
boundaries. Official docs are retained only for declared support/stability,
installation and vendor benchmark caveats. Search snippets, community issues,
testimonials, star/download badges and vendor performance percentages were not
used as executable-behavior evidence. Negative result S-031 is retained because
absence claims otherwise become irreproducible.

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "aider-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "Aider"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/Aider-AI/aider"
  resolved_commit: "5dc9490bb35f9729ef2c95d00a19ccd30c26339c"
  observed_ref: "origin/main; v0.86.3.dev-53-g5dc9490b"
  package_identity: "aider-chat@0.86.2+sha256:64f6a0c66c9f4633ad9f479bca3e64ebcba02b9da03c6b604b74a44736b2416e(wheel),sha256:f38a9d322f5609f0c13af82d50c6a11170185b3fdf26956e4a7e89ba19819159(sdist)"
research:
  researcher: "ses_fc91cf692ffedD2S52ScZLX3aF"
  owned_path: "research/harnesses/aider.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: identity_snapshot
    coverage: OBSERVED
    summary: "Main commit and latest stable PyPI artifacts are immutably pinned and separately scoped."
    confidence: HIGH
    claim_ids: [C-001, C-002, C-003]
    source_ids: [S-001, S-002, S-003, S-004, S-005]
    pattern_disposition: NO_POSITION
  - dimension: provenance_license
    coverage: OBSERVED
    summary: "Repository/package are Apache-2.0; dependency and service terms were excluded."
    confidence: HIGH
    claim_ids: [C-004]
    source_ids: [S-003, S-004, S-006, S-007]
    pattern_disposition: NO_POSITION
  - dimension: repository_package_map
    coverage: OBSERVED
    summary: "One Python runtime package composes coder/model/context/Git/IO adapters with supporting test/docs trees."
    confidence: HIGH
    claim_ids: [C-005]
    source_ids: [S-003, S-007, S-036]
    pattern_disposition: NO_POSITION
  - dimension: executable_entrypoints
    coverage: OBSERVED
    summary: "Console/module CLI supports interactive, one-shot and optional experimental browser/voice/web paths."
    confidence: HIGH
    claim_ids: [C-006, C-026, C-029]
    source_ids: [S-007, S-009, S-013, S-025, S-026, S-027, S-033]
    pattern_disposition: CONDITIONAL
  - dimension: control_data_flow
    coverage: PARTIAL
    summary: "A full static edit-turn trace is mapped; runtime atomicity remains unobserved."
    confidence: HIGH
    claim_ids: [C-007, C-037]
    source_ids: [S-009, S-010, S-013, S-015, S-018, S-019, S-024, S-031]
    pattern_disposition: NO_POSITION
  - dimension: module_extension_boundaries
    coverage: OBSERVED
    summary: "Explicit built-in edit-format registry provides polymorphism but no stable dynamic plugin protocol."
    confidence: HIGH
    claim_ids: [C-008]
    source_ids: [S-010, S-011, S-012, S-014, S-031]
    pattern_disposition: CONDITIONAL
  - dimension: agent_interface
    coverage: OBSERVED
    summary: "Aider is a turn-driven Coder pair-programming loop, not a delegated subagent scheduler."
    confidence: HIGH
    claim_ids: [C-009, C-027]
    source_ids: [S-009, S-010, S-012, S-031, S-032]
    pattern_disposition: NO_POSITION
  - dimension: tool_interface
    coverage: PARTIAL
    summary: "Slash/edit/process adapters are mapped; runtime denial and output trust remain partial."
    confidence: HIGH
    claim_ids: [C-010, C-037]
    source_ids: [S-010, S-013, S-014, S-024, S-031]
    pattern_disposition: CONDITIONAL
  - dimension: provider_interface
    coverage: PARTIAL
    summary: "LiteLLM adapter/configuration is traced but live provider behavior is unobserved."
    confidence: HIGH
    claim_ids: [C-011, C-038]
    source_ids: [S-009, S-010, S-015, S-016, S-031, S-036]
    pattern_disposition: CONDITIONAL
  - dimension: model_interface
    coverage: OBSERVED
    summary: "Data-driven and heuristic model profiles configure formats, prompts, stream, cache and reasoning."
    confidence: HIGH
    claim_ids: [C-012]
    source_ids: [S-015, S-016]
    pattern_disposition: CONDITIONAL
  - dimension: context_interface
    coverage: PARTIAL
    summary: "Ordered chunks, summarization and ranked repo-map retrieval are observed; injection containment is unknown."
    confidence: HIGH
    claim_ids: [C-013, C-014, C-037]
    source_ids: [S-010, S-017, S-020, S-031]
    pattern_disposition: CANDIDATE
  - dimension: state_persistence_restart
    coverage: PARTIAL
    summary: "Local stores and Git state are mapped; crash recovery and migrations are unknown."
    confidence: HIGH
    claim_ids: [C-015, C-022, C-039]
    source_ids: [S-009, S-015, S-017, S-018, S-019, S-020, S-021, S-023, S-031]
    pattern_disposition: NO_POSITION
  - dimension: concurrency_worktree_isolation
    coverage: PARTIAL
    summary: "No harness coordinator/isolation protocol was found; collision behavior was not run."
    confidence: HIGH
    claim_ids: [C-016, C-039]
    source_ids: [S-017, S-027, S-031]
    pattern_disposition: CURIOSITY_NO_GO
  - dimension: permissions_authority_sandbox
    coverage: PARTIAL
    summary: "Prompt guards exist, but actions inherit host authority and runtime containment is unresolved."
    confidence: MEDIUM
    claim_ids: [C-017, C-018, C-037]
    source_ids: [S-010, S-013, S-019, S-024, S-029, S-030, S-031]
    pattern_disposition: CURIOSITY_NO_GO
  - dimension: evidence_observability
    coverage: PARTIAL
    summary: "Logs/events/hashes/Git evidence exist without a correlated tamper-evident receipt chain."
    confidence: HIGH
    claim_ids: [C-019, C-039]
    source_ids: [S-009, S-010, S-019, S-021, S-031, S-035]
    pattern_disposition: CONDITIONAL
  - dimension: resource_token_cost_accounting
    coverage: PARTIAL
    summary: "Token/cache/cost reports are best effort, with no budget enforcement or bill reconciliation."
    confidence: HIGH
    claim_ids: [C-020, C-038]
    source_ids: [S-009, S-010, S-015, S-031, S-035]
    pattern_disposition: CONDITIONAL
  - dimension: failure_cancellation_retry
    coverage: PARTIAL
    summary: "Retry/timeout/interrupt policies are static-observed; cleanup and idempotency are unknown."
    confidence: HIGH
    claim_ids: [C-021, C-038]
    source_ids: [S-010, S-015, S-019, S-031, S-035]
    pattern_disposition: CONDITIONAL
  - dimension: install_update_release
    coverage: PARTIAL
    summary: "Artifacts are pinned, but default updates are mutable and no attestation/rollback path was observed."
    confidence: HIGH
    claim_ids: [C-002, C-003, C-023]
    source_ids: [S-001, S-002, S-003, S-004, S-005, S-008, S-023, S-031, S-034]
    pattern_disposition: CONDITIONAL
  - dimension: tests_qualification
    coverage: PARTIAL
    summary: "Tests and CI are inventoried but not executed; benchmark scope is vendor-maintained and narrow."
    confidence: HIGH
    claim_ids: [C-024, C-040]
    source_ids: [S-028, S-029, S-030, S-031, S-032, S-035]
    pattern_disposition: NO_POSITION
  - dimension: security
    coverage: PARTIAL
    summary: "Trust crossings are mapped; sandbox, runtime injection/containment and supply-chain controls remain gaps."
    confidence: MEDIUM
    claim_ids: [C-018, C-025, C-037]
    source_ids: [S-009, S-010, S-013, S-015, S-019, S-021, S-023, S-024, S-025, S-026, S-031]
    pattern_disposition: CURIOSITY_NO_GO
  - dimension: strengths
    coverage: OBSERVED
    summary: "The local Git pair-programming pipeline is modular and inspectable; one-shot CLI is a bounded seam."
    confidence: HIGH
    claim_ids: [C-028, C-029]
    source_ids: [S-009, S-010, S-014, S-017, S-018, S-033]
    pattern_disposition: NO_POSITION
  - dimension: liabilities
    coverage: OBSERVED
    summary: "Host authority and mutable/unsupported operational seams burden unattended or audited use."
    confidence: HIGH
    claim_ids: [C-030, C-031]
    source_ids: [S-002, S-005, S-008, S-010, S-013, S-015, S-019, S-021, S-023, S-024, S-031, S-035]
    pattern_disposition: NO_POSITION
  - dimension: transferable_patterns
    coverage: OBSERVED
    summary: "Repo-map ranking and explicit confirmation are candidates; model profiles are conditional."
    confidence: HIGH
    claim_ids: [C-032, C-033, C-034]
    source_ids: [S-010, S-015, S-016, S-017, S-019, S-024, S-029]
    pattern_disposition: CANDIDATE
  - dimension: rejected_patterns_curiosity_no_go
    coverage: OBSERVED
    summary: "Direct host shell transfer and vendor leaderboard selection proof are rejected in the stated scenarios."
    confidence: HIGH
    claim_ids: [C-035, C-036]
    source_ids: [S-013, S-024, S-031, S-032, S-035]
    pattern_disposition: CURIOSITY_NO_GO
strength_ids: [C-028, C-029]
liability_ids: [C-030, C-031]
transferable_pattern_ids: [C-032, C-033, C-034]
curiosity_no_go_ids: [C-035, C-036]
unknown_claim_ids: [C-018, C-037, C-038, C-039]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| Unknown | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-018 path/symlink containment | Cannot compare workspace escape enforcement | All edit formats against traversal/absolute/symlink/prefix collision in denied-mount disposable repo | Purpose-built disposable container; syscall/file capture; no secrets | UNASSIGNED |
| C-037 startup/denial/malformed/injection | Cannot distinguish prompt policy from runtime authority enforcement | No-op plus denied fs/network/process, malformed schemas and repository/tool injection matrix | Read-only/network-denied disposable container and fake provider | UNASSIGNED |
| C-038 cancellation/retry/cost | Cannot compare idempotency, cleanup or billing fidelity | Fake provider auth/rate/timeout/interrupted stream/duplicate usage matrix with attempt/event/write reconciliation | Deterministic provider stub and cancellable process harness | UNASSIGNED |
| C-039 collision/restart/evidence | Cannot compare multi-session isolation, recovery or audit durability | Two processes/worktrees with shared HOME; crash at write/commit/cache/event transitions | Disposable worktrees/processes, fault injection and sink capture | UNASSIGNED |

**Recommendations for authorized downstream research:** treat Aider as the
pair-programmer archetype, keep development and stable package evidence separate,
compare RepoMap and edit-format boundaries on their narrow merits, and require an
external execution/permission architecture before considering unattended
transfer. Do not use vendor leaderboard scores as a harness decision proxy.

**Stop decision:** `STOP_COVERAGE_SATURATION`. All required dimensions and
adversarial rows have primary static/package evidence or explicit UNKNOWNs. The
highest-value curiosity thread (authority/isolation negative search) was pursued;
remaining threads require unsafe target execution, credentials, stronger
isolation, or have nonpositive decision-relevant marginal evidence within budget.

**Handoff checks:** exact headings 0–29, claim/source resolution,
substantive-citation, normalized enum/order and UNKNOWN-set validation passed.
URL/link check returned HTTP 200 for all 36 canonical source URLs (retained
status-ledger SHA-256
`642c824146e96010af77219156e0cdcbe899e298d0ba63aad7617a07e3758b98`).
One intermediate unauthenticated GitHub API check returned 403; an immediate
diagnostic returned 200 with `x-ratelimit-remaining: 44`, and the final full pass
returned 36/36 HTTP 200, so the transient negative result is retained but does
not indicate a broken citation.
Owned-file status and `git diff --check` are reported in the final handoff.
