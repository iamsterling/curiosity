# GitHub Copilot CLI — Whole-Harness Dossier

> Research-only evidence. No product, design, implementation, procurement,
> release, or security-acceptance authority.
>
> Snapshot cutoff: 2026-08-24 UTC. Search snippets were treated as untrusted
> discovery evidence and are not cited as support.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `github-copilot-cli-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target:** GitHub Copilot CLI (standalone `copilot` coding-agent harness)
- **Researcher:** `ses_fc91daa8affevHDJgQCdbA7cyx`
- **Owned path:** `research/harnesses/github-copilot-cli.md`
- **Research date/cutoff:** 2026-08-24 UTC
- **Scope:** stable CLI 1.0.80; its public release repository at tag `v1.0.80`;
  the matching npm umbrella and Darwin arm64 metadata; documented CLI, ACP,
  SDK/headless, local/cloud sandbox, extension, session, and GitHub boundaries.
- **Exclusions:** deprecated `gh-copilot`; IDE Copilot Agent mode except to
  disambiguate/trace a bridge; cloud-agent internals; native-binary
  decompilation; credentials; write-capable target execution; adoption.
- **Schema:** `harness-dossier-summary/v1`
- **Completion:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`

## 1. Identity and pinned snapshot {#identity-snapshot}

**Status:** OBSERVED.

The reviewed stable identity is `@github/copilot@1.0.80`, npm SRI
`sha512-6tf93ZF56KOiTTAjK/UhLZkl1W543IzaTQly288kockJZFswpRTnQEI00Yvacpb39DTvTYu3/ha9SeKpo/pgZQ==`;
the public release tag resolves to
`ef627e1baad937d3c8da45f8a5541c6fc3c97b6a`, and registry dist-tags at cutoff
were `latest=1.0.80`, `prerelease=1.0.81-9`. The matching host artifact metadata
is `@github/copilot-darwin-arm64@1.0.80`, SRI
`sha512-fzn4PnSx3+O/a3ip72KVsjnzORsEygK+0i21bFAnFBYS+0Wi1Pk+o/CmNsJ7aRbf1enSJrcH8UDVkyc9pMGEBg==`.
{C-001 FACT HIGH; S-001,S-002,S-003,S-006,S-034,S-047}

This is the standalone `copilot` product. The archived `gh copilot` extension
was deprecated in its favor, while IDE Agent mode is an IDE-owned Chat mode;
an IDE may host/bridge the CLI without making those runtimes identical.
{C-002 FACT HIGH; S-007,S-029,S-030,S-031}

- **Public repository:** `https://github.com/github/copilot-cli`
- **Observed ref:** `v1.0.80`; remote immutable tree treated as clean;
  submodules absent from the complete public tree.
- **Platform assumption:** Darwin arm64 27.0; Node 24.18.0/npm 11.16.0 for the
  static wrapper probe; product docs support macOS, Linux, and Windows.
- **Unknown:** private build state is addressed in Section 2.

## 2. Provenance and license {#provenance-license}

**Status:** PARTIAL.

GitHub publishes and maintains the package. Its bespoke license permits
installation/running and limited redistribution of unmodified copies only as a
non-primary part of a materially functional application; it prohibits
modification and derivative works. It is not an open-source runtime license.
{C-004 FACT HIGH; S-001,S-005,S-006}

The npm wrapper records private build commit `a3a2697`, while the public release
repository tag is `ef627e...`; no lawful public evidence mapped these histories
or established reproducible native builds. Runtime-source provenance is
therefore UNKNOWN. {C-036 UNKNOWN N/A; S-001,S-002,S-003,S-006}

- **Boundary:** public packaging/docs repository versus proprietary native
  runtime and GitHub services.
- **Notices/trademark:** license requires retention of notices and grants no
  branding rights beyond identification.
- **Dependency caveat:** umbrella metadata directly declares `detect-libc` and
  exact platform optional packages; transitive/native dependency licenses were
  not enumerable without prohibited runtime inspection.

## 3. Repository and package map {#repository-package-map}

**Status:** OBSERVED_WITH_CLOSED_INTERNALS.

The complete pinned public tree contains issue workflows, `README.md`,
`LICENSE.md`, `changelog.md`, and `install.sh`, but no production agent-loop
source or runtime tests; the npm umbrella tarball independently contains only
`npm-loader.js`, `package.json`, `README.md`, and `LICENSE.md`.
{C-003 FACT HIGH; S-003,S-006}

```text
github/copilot-cli@ef627e...       public docs/release shell
├── README.md / changelog.md       documentation
├── LICENSE.md                     proprietary runtime license
├── install.sh                     downloader/installer
└── .github/*                      issue automation and WinGet publishing

@github/copilot@1.0.80             npm umbrella
├── npm-loader.js                  OS/libc/arch resolver and process launcher
└── optional @github/copilot-*     native platform package
    └── copilot                    closed production executable
```

The wrapper resolves the platform package and synchronously spawns its native
binary with inherited stdio; the platform package also advertises a `./sdk`
export, whose proprietary implementation was not inspected. {C-005 FACT HIGH;
S-001,S-006,S-034}

- **Composition root:** native `copilot`; closed internals UNKNOWN.
- **Classification:** public files are documentation/installer/release support;
  wrapper is production launcher; native package is production/proprietary.

## 4. Executable entrypoints {#executable-entrypoints}

**Status:** OBSERVED_DOCUMENTED.

Documented entrypoints are interactive `copilot`, one-shot `copilot -p`, shell
completion/login/configuration/update subcommands, ACP via `--acp`, and SDK
JSON-RPC server via `--headless`; no public in-process runtime library was found.
{C-006 FACT HIGH; S-007,S-008,S-014,S-017,S-024}

The supported automation protocols are ACP NDJSON over stdio/TCP and SDK
JSON-RPC v2–v3; SDKs normally own a CLI child process or attach to a separately
owned loopback-by-default headless server, and the pinned JavaScript SDK 1.0.11
declares CLI dependency `^1.0.79`. {C-026 FACT HIGH;
S-014,S-015,S-016,S-017}

| Entrypoint | Lifecycle owner | Input/output | Authority and side effects | Failure surface |
| --- | --- | --- | --- | --- |
| `copilot` | user/TTY | prompts, slash commands, timeline | local tools/files/network under approvals | interactive diagnostics/cancel |
| `copilot -p` | calling process | prompt/flags/stdin; response/stdout | explicit allow/deny flags; exits after task | exit/diagnostic; exact codes UNKNOWN |
| `copilot --acp` | parent pipe or TCP server operator | ACP NDJSON | client permission callback; server-wide filters | preview protocol/connection failure |
| SDK + `--headless` | SDK or external server operator | JSON-RPC/events | deny-by-default SDK callback | RPC/process/session error |

## 5. Control and data flow {#control-data-flow}

**Status:** PARTIAL.

For one SDK message, the app sends JSON-RPC to the CLI; the CLI assembles full
history, calls the selected LLM, executes requested tools after permission/hook
processing, appends results, and repeats until the model stops; SDK merely
transports events. `session.idle` is mechanical completion and
`session.task_complete` is model-semantic/best-effort completion.
{C-007 FACT HIGH; S-011,S-041}

```text
app/TTY --control+prompt--> CLI orchestrator --request/context--> model/provider
model --tool request--> CLI --authority check--> local/MCP/GitHub tool
tool --untrusted result--> CLI --context--> model --stream/events--> app/TTY
```

GitHub crossings include hosted model routing, built-in GitHub MCP, session sync
and remote control, Actions billing/auth, and optional cloud delegation/sandbox;
remote control injects commands but leaves execution on the originating machine.
{C-025 FACT HIGH; S-007,S-009,S-035,S-036}

- **Returns:** streamed text/events, tool results, and terminal/SDK completion.
- **Errors:** hooks/events classify model/tool/system/user-input failures;
  default backoff/idempotency remains UNKNOWN.
- **Trust:** repository/instruction/tool/provider/remote-command content is data;
  tools and hooks can nevertheless carry authority after policy checks.

## 6. Module and extension boundaries {#module-extension-boundaries}

**Status:** PARTIAL.

Documented extensions comprise combined instruction files, custom agents,
relevance-loaded skills, MCP/LSP servers, hooks, extensions, and plugins that
bundle those parts. Precedence differs by component (first-found agents/skills,
last-wins MCP, built-ins non-overridable), and first-party plugins can auto-update
at session start. {C-008 FACT HIGH; S-009,S-010,S-012,S-013,S-046}

Hooks/plugins are authority-bearing: policy hooks cannot be user-disabled;
permission/pre-tool hooks may allow, deny, or mutate calls; post-tool hooks can
rewrite model-visible results; plugins may add code, MCP, LSP, agents, and skills.
{C-027 FACT HIGH; S-011,S-046}

Official pages contradict each other on whether organization MCP registry and
allowlist policies apply to CLI, so that enforcement is UNKNOWN at 1.0.80.
{C-035 UNKNOWN N/A; S-007,S-012}

- **Discovery lifecycle:** instructions/hooks generally reload on session
  restart; MCP can activate immediately; skills support explicit reload;
  plugin auto-update differs for interactive/`-p` versus SDK/server sessions.
- **Unload:** enable/disable/remove surfaces are documented; in-flight unload
  ordering and ABI stability are UNKNOWN.

## 7. Agent interface {#agent-interface}

**Status:** OBSERVED_DOCUMENTED.

Built-ins include Explore, Task, General purpose, Code review, Research, and
Rubber duck; the model chooses delegation, some agents are automatic, separate
contexts are documented, nested/background agents can be steered/killed, and
experimental fleet can parallelize subagents. {C-009 FACT MEDIUM;
S-008,S-009,S-015}

- **Identity/config:** `.agent.md` profiles can set expertise, tools,
  instructions, and model; user/repository/org/plugin scopes apply.
- **Parent/child:** parent requests delegation; child returns a response;
  subagent hooks expose start/stop IDs for most but not all built-ins.
- **Authority:** child tools share the applicable permission/sandbox surfaces;
  separate context does not prove process/filesystem isolation.
- **Cancellation/errors:** tasks dialog and double-Esc can stop agents;
  cleanup guarantees remain UNKNOWN.

## 8. Tool interface {#tool-interface}

**Status:** PARTIAL.

Built-in file/search/shell/web/task tools are always present; SDK custom tools
use JSON Schema handlers; MCP tools are discovered over stdio/HTTP/SSE; tool
calls pass permission and hook boundaries, and outputs are untrusted context.
{C-010 FACT MEDIUM; S-011,S-012,S-013,S-015,S-017,S-044}

- **Declaration/discovery:** built-ins, agent tool filters, plugin manifests,
  skill instructions, MCP capability listing, and SDK `registerTools()`.
- **Invocation/result:** model tool request -> validation/permission/hook ->
  handler/process -> success/failure result -> event/context.
- **Timeout/cancel:** MCP and hooks accept timeouts; shell/agent cancellation is
  documented, but uniform cancellation propagation is UNKNOWN.
- **Errors:** tool failures reach failure hooks/events; default retry ownership
  is UNKNOWN.

## 9. Provider interface {#provider-interface}

**Status:** PARTIAL.

GitHub-hosted routing uses GitHub auth; BYOK supports OpenAI-compatible, Azure,
and Anthropic endpoints configured by environment, and requires streaming plus
tool calling. Offline mode disables GitHub auth/telemetry but still contacts a
remote BYOK endpoint if configured. {C-011 FACT HIGH; S-007,S-027,S-028}

- **Auth precedence:** `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`,
  keychain OAuth, then `gh`; provider key is separate.
- **Transport/adaptation:** closed implementation; OpenAI Chat Completions,
  Azure, Anthropic documented at configuration level.
- **Fallback/rate/error:** unsupported BYOK capability returns an error; silent
  fallback, default retries/backoff, rate-limit ownership, and malformed-stream
  preservation are UNKNOWN. {C-038 UNKNOWN N/A; S-027,S-040}

## 10. Model interface {#model-interface}

**Status:** PARTIAL.

Model precedence is custom-agent profile, CLI flag, environment, settings, then
default. Auto routing combines task complexity with live health/availability,
respects plan/policy restrictions, routes at cache boundaries, and displays the
selected model per response unless silent output suppresses it.
{C-012 FACT HIGH; S-007,S-024,S-025}

- **Capabilities:** streaming/tool calling mandatory for BYOK; context size and
  reasoning effort are selectable where model-supported.
- **Structured output:** tool schemas/events documented; general response schema
  enforcement UNKNOWN.
- **Limits/fallback:** model-specific context varies; internal router thresholds,
  health data, fallback chain, and decision trace are UNKNOWN.

## 11. Context interface {#context-interface}

**Status:** PARTIAL.

Context contains system instructions/tool schemas, combined custom instructions,
messages, tool calls/results, memory, and selected skill content. Outputs over
20 KiB spill to a temporary file by default. Background compaction starts near
80%, blocks near 95%, uses a model summary, persists a checkpoint, and is lossy
and irreversible. {C-013 FACT HIGH; S-009,S-010,S-013,S-044}

Copilot Memory stores cited repository facts and user preferences, validates
repository citations, scopes retrieval by repo/user/billing entity, and expires
unused entries after 28 days; it is preview and can cross Copilot surfaces.
{C-028 FACT HIGH; S-045}

- **Ordering/provenance:** instructions combine without general precedence;
  memory carries citations; exact system-prompt order and contamination controls
  are closed.
- **Accounting tension:** loop docs say turn pairs count all LLM calls while
  context docs add a background compaction model call; event/accounting treatment
  of that call is UNKNOWN.

## 12. State, persistence, and restart {#state-persistence-restart}

**Status:** PARTIAL.

CLI writes per-session `events.jsonl`, plans/checkpoints/tracked files and a
derived SQLite index under `~/.copilot`, incrementally/periodically/end-of-session;
resume reloads history, reindex can recover the index, and session sync is on by
default subject to policy. SDK disconnect preserves disk state while delete
removes it; BYOK credentials and in-memory tool state are not persisted.
{C-014 FACT HIGH; S-020,S-021,S-022,S-023}

- **Deletion:** local deletion does not delete synced copies; delete-all/prune
  are local-only; single delete can offer remote deletion.
- **Restart:** local files support resume; cloud sandboxes snapshot stopped
  sessions; API/provider settings may need re-supply.
- **Unknown:** atomicity/fsync, migrations, retention for ordinary local
  sessions, partial-JSONL handling, and sync conflict resolution.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

**Status:** PARTIAL.

SDK same-session concurrency has no built-in lock and is undefined; linked
worktrees share saved permissions because keys resolve to the main repository
root. {C-015 FACT HIGH; S-020,S-021,S-023}

Process topology, tool scheduling, shared mutable caches, session collision
handling, per-subagent filesystem/process isolation, and race cleanup are
UNKNOWN in the closed 1.0.80 runtime. {C-037 UNKNOWN N/A;
S-003,S-015,S-023}

- **Isolation keys:** documented session ID; repository-root permission key;
  plugin data directory; no proven tenant boundary in a shared headless server.
- **Determinism:** model/tool scheduling and Auto routing are nondeterministic by
  design; no deterministic replay contract found.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

**Status:** PARTIAL.

Interactive tool approval can be once or running-session-wide; deny flags win
over allow flags. Path/URL gates are heuristic and document gaps for complex
shell syntax, custom variables, future symlink targets, config/env-derived URLs,
and obfuscation. Trusted-directory scoping is also explicitly heuristic.
{C-016 FACT HIGH; S-007,S-039}

Local sandbox is off by default and preview. When enabled, MXC applies
OS-specific child-process containment, while built-in file tools enforce the
same policy only in-process/best-effort. Defaults permit bypass prompts,
outbound/local network, git/`gh` credential injection, and dev-tool/cache access.
Cloud sandbox moves the full interactive session to isolated hosted Linux but is
not available with `-p`/`-i`. {C-017 FACT HIGH; S-018,S-019,S-020}

| Actor | Default authority | Escalation/denial | Enforcement |
| --- | --- | --- | --- |
| interactive agent | reads plus prompted consequential tools | user/session/flags/hooks | heuristic gates; optional sandbox |
| autopilot | gated calls auto-denied with limited permissions | `--allow-all`; continuation cap | same tool/sandbox layer |
| SDK app | permission requests denied absent handler | callback/pre-tool hook | application + closed CLI |
| policy hook/admin | machine-wide policy authority | user cannot disable policy hooks | hook result; timeout caveats |

## 15. Evidence and observability {#evidence-observability}

**Status:** PARTIAL.

Surfaces include per-process logs, persistent event JSONL, checkpoints,
transcripts/share, `/session`, `/env`, `/diagnose`, `/usage`, hook events, SDK
40+ event subscriptions, and opt-in OTLP/file traces with W3C propagation.
{C-018 FACT HIGH; S-008,S-021,S-038,S-041}

- **Correlation:** session IDs, turn start/end, tool and hook event IDs, trace
  context; no evidence of cryptographic receipts.
- **Durability:** session events persist; `session.idle` is explicitly ephemeral.
- **Redaction:** GitHub token values are redacted by default and extra secret env
  vars can be named; completeness against derived/encoded secrets is UNKNOWN.
- **Tamper resistance:** local logs/hooks/session files are user-writable and not
  established as tamper-resistant.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

**Status:** PARTIAL.

GitHub-hosted usage prices input/cached/cache-write/output tokens by selected
model and converts at one AI credit = USD $0.01; paid Auto receives a 10%
discount. `/usage` and `assistant.usage` expose session/model tokens, while
`--max-ai-credits` is a preview soft limit that may overshoot for an in-flight
response. Cloud sandbox adds compute, memory, and snapshot-storage meters.
{C-019 FACT HIGH; S-009,S-018,S-026,S-037,S-038,S-043}

- **Limits:** autopilot continuation cap and soft credit cap; no documented hard
  CPU/memory/process limit for local execution.
- **Attribution gaps:** retries, compaction, cache writes, subagents, provider
  invoices, and missing/contradictory usage were not reconciled in a live probe.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

**Status:** PARTIAL_WITH_UNKNOWNS.

Interactive Esc/Ctrl-C semantics prioritize queued items before active work;
already-started file writes complete. SDK exposes `abort`, error events, and
hooks that may request retry/skip/abort with a count. Loader diagnostics preserve
native signal termination and missing-platform-package failures.
{C-020 FACT MEDIUM; S-006,S-008,S-040,S-042}

Default retry owner, backoff, idempotency/deduplication, partial GitHub/tool
write handling, cancellation propagation into every tool/MCP/provider, and
retry cost attribution remain UNKNOWN. {C-038 UNKNOWN N/A; S-040,S-041}

Official rollback documentation conflicts about whether post-snapshot manual
workspace changes/new files are reverted versus mismatched user-edited files
being skipped; exact 1.0.80 rollback scope is UNKNOWN. {C-021 UNKNOWN N/A;
S-042}

## 18. Install, update, and release {#install-update-release}

**Status:** OBSERVED_WITH_GAPS.

Install paths are npm/Homebrew/WinGet/script/direct assets. npm/release metadata
provides SRI/signatures/SHA-256; the pinned installer verifies checksums only
when both checksum download and hash utility succeed, and mutable `latest` plus
default auto-update can change the runtime between sessions. Exact `VERSION`
plus independently checked digest is reproducible; rollback/migration contracts
are not documented. {C-022 FACT HIGH; S-001,S-002,S-006,S-032,S-033,S-034}

- **Release:** 1.0.80 stable; public release record is itself marked
  `immutable:false`; 1.0.81-9 was prerelease at cutoff.
- **Source traceability:** UNKNOWN under C-036.
- **Build/reproducibility:** native build system and CI gates are closed.

## 19. Tests and qualification {#tests-qualification}

**Status:** UNKNOWN.

No target runtime tests or CI/release qualification suite are public at the
pinned repository/package snapshot, and target execution was not safe without
installing/running proprietary code in a credential-capable host. Platform,
provider, negative, coverage, and release-gate results are therefore UNKNOWN.
{C-023 UNKNOWN N/A; S-003,S-006,S-034}

The only direct qualification performed was the read-only package identity/list
probe and URL/static consistency checks; these establish packaging, not runtime
behavior.

## 20. Security {#security}

**Status:** PARTIAL.

Security-relevant controls include token precedence/keychain storage, optional
plaintext fallback, permission/hook gates, managed policies, sandboxing, secret
redaction, offline mode, checksums/signatures, and symlink resolution for
existing allowed paths. Material limitations include heuristic path/URL checks,
unsandboxed built-in file operations, fail-open hook timeouts/HTTP errors,
third-party plugin/skill/MCP code, remote-session event export, and broad Actions
environment access. {C-024 FACT HIGH; S-011,S-020,S-028,S-035,S-036,S-039,S-046}

- **Prompt/instruction injection:** files, MCP/tool/provider results, skills, and
  memory enter model context; authority remains separately permissioned, but no
  public implementation-level injection test was available.
- **Supply chain:** plugin sources can pin a full SHA; first-party auto-update and
  mutable CLI channels trade reproducibility for freshness.
- **Reporting/advisories:** no target-specific security policy/advisory process
  was established from the bounded public tree; GitHub-wide channels were not
  treated as runtime assurance.

## 21. Strengths {#strengths}

**Status:** INTERPRETATION.

Within the documented surface, the combination of interactive and one-shot use,
two protocols, typed SDK events/tools, lifecycle hooks, resumable evidence, and
multiple isolation choices is a strong integration/observability capability;
this does not validate closed enforcement. {C-029 INFERENCE MEDIUM;
S-007,S-014,S-015,S-018,S-038}

- Multiple frontends can share one documented orchestrator boundary.
- Permission, event, context, and cost controls are operator-visible rather than
  only prompt conventions.
- Explicit caveats (heuristic gates, soft budgets, no SDK lock) improve the
  accuracy of downstream risk comparison.

## 22. Liabilities {#liabilities}

**Status:** INTERPRETATION.

Closed runtime internals, mutable auto-updates, permissive/off-by-default local
sandbox settings, heuristic path/URL gates, shared worktree permission keys, and
undefined same-session concurrency limit independent verification and make
policy text insufficient as an enforcement claim. {C-030 INFERENCE HIGH;
S-003,S-018,S-020,S-022,S-023,S-032,S-039}

- **Trigger:** unattended/autopilot/Actions/headless use with broad permissions.
- **Consequence:** host, credential, network, GitHub, and cost side effects can
  exceed a repository-only mental model.
- **Upstream mitigations:** managed policies, exact pins, limited flags, local or
  cloud sandbox, per-user servers, hooks, and session limits; none erase the
  unknown closed implementation.

## 23. Transferable patterns {#transferable-patterns}

**Status:** RESEARCH_CANDIDATES_ONLY.

1. **Evented orchestrator/protocol split — CANDIDATE.** Keep the loop in one
   process and expose streaming events, typed tools, permission callbacks, and
   transport adapters; prerequisite is a versioned protocol and explicit
   lifecycle ownership. {C-031 INFERENCE MEDIUM; S-014,S-015,S-041}
2. **Event log plus derived index — CONDITIONAL.** Append session evidence and
   rebuild query indexes, but require atomicity, locking, retention, redaction,
   and remote-deletion semantics absent from this evidence. {C-032 INFERENCE
   MEDIUM; S-020,S-021,S-023}
3. **Separate mechanical and semantic completion — CONDITIONAL.** A reliable
   idle signal plus best-effort task-complete avoids conflation, but synthetic
   continuations need explicit turn/cost limits. {C-039 INFERENCE MEDIUM;
   S-026,S-037,S-041}

These are research inputs, not approved designs.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

**Status:** REJECTED_RESEARCH_THREADS.

Native-binary decompilation/string archaeology is `CURIOSITY_NO_GO`: internals
are proprietary, the user prohibited decompilation, and official interfaces
already establish the comparison boundary; it would violate trust/licensing
constraints for nonpositive marginal evidence.

Additional `CURIOSITY_NO_GO` threads:

- kernel/sandbox exploit testing — unsafe and unauthorized;
- plugin-marketplace popularity enumeration — feature count does not prove a
  harness property;
- every current model/price — mutable catalog, low architecture value;
- cloud-agent/Azure substrate internals — separate proprietary service target;
- model-quality and `/diagnose` judging — model-output evaluation, not harness
  architecture;
- Agentic Workflows comparison — distinct harness and outside assigned scope.

Together these seven threads are `CURIOSITY_NO_GO` because each is unsafe,
outside the assigned target, or non-discriminating for the architecture
decision. {C-033 INFERENCE HIGH;
S-003,S-004,S-005,S-006,S-018,S-026,S-035,S-046}

Reopen only with explicit scope, authority, isolation, and a discriminating
question not answerable through primary interfaces.

## 25. Adversarial probes {#adversarial-probes}

**Status:** ONE_STATIC_PASS, ONE_BOUNDED_ABSENCE_PASS, REMAINDER_NOT_RUN_UNSAFE.

Runtime adversarial behavior remains UNKNOWN because no preinstalled pinned
target or credential-free, disposable isolation boundary was available; package
execution/install was not justified merely to inspect closed code.
{C-034 UNKNOWN N/A; S-003,S-006,S-007}

| Probe | Expected safe behavior | Result | Actual/environment | Claims | Sources |
| --- | --- | --- | --- | --- | --- |
| P-01 startup/no-op | no undeclared writes/network/credential reads | `NOT_RUN_UNSAFE` | static tar listing only; no target execution | C-034 | S-006 |
| P-02 denial/bypass | every alternate path remains denied with diagnostic | `NOT_RUN_UNSAFE` | documented gates are heuristic; exploitation not authorized | C-016,C-034 | S-039 |
| P-03 malformed/oversized | validate before side effects with bounded memory | `NOT_RUN_UNSAFE` | hook 10 MiB/output and context spill docs do not qualify all schemas | C-013,C-034 | S-011,S-044 |
| P-04 cancel/timeout | propagate cancel, finish atomic write, clean children | `INCONCLUSIVE` | docs state writes finish; no child/provider cleanup observation | C-020,C-034 | S-042 |
| P-05 retry/duplicate | bounded backoff, idempotency, cost attribution | `NOT_RUN_UNSAFE` | defaults closed | C-034,C-038 | S-040 |
| P-06 concurrency collision | isolate sessions/worktrees and lock shared state | `NOT_RUN_UNSAFE` | docs say no SDK lock and worktrees share permissions | C-015,C-034,C-037 | S-020,S-023 |
| P-07 crash/restart | recover last durable state without corruption | `NOT_RUN_UNSAFE` | reindex documented; crash window unobserved | C-014,C-034 | S-021 |
| P-08 provider/network down | preserve auth/rate/stream error; no silent fallback | `NOT_RUN_UNSAFE` | default fallback/retry closed | C-034,C-038 | S-027,S-040 |
| P-09 instruction injection | content stays data and cannot expand authority | `NOT_RUN_UNSAFE` | no safe dynamic target; permission separation documented only | C-024,C-034 | S-007,S-011 |
| P-10 filesystem abuse | canonicalize traversal/symlink/case and stay in sandbox | `NOT_RUN_UNSAFE` | documented heuristic limitations; exploit not authorized | C-016,C-017,C-034 | S-019,S-039 |
| P-11 usage disagreement | reconcile turns/cache/retries/provider and enforce budget | `NOT_RUN_UNSAFE` | no credentials/provider bill; soft cap only | C-019,C-034 | S-026,S-037 |
| P-12 install pin/rollback | immutable artifact re-resolves and verifies without scripts | `PASS` | exact tarball SRI/SHA-256 matched; four files listed; no scripts run; rollback UNKNOWN | C-001,C-022 | S-001,S-006 |
| P-13 claimed absence | two methods bound absence to defined production universe | `PASS` | full public tree + umbrella tar list contain no runtime source/tests; no global claim | C-003 | S-003,S-006 |
| P-14 evidence loss/forgery | denied/failed/cancel events correlate, redact, resist spoofing | `NOT_RUN_UNSAFE` | local evidence is user-writable; no runtime event generated | C-018,C-034 | S-020,S-038 |

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "At the 2026-08-24 cutoff the reviewed stable CLI was @github/copilot@1.0.80 at public tag commit ef627e1baad937d3c8da45f8a5541c6fc3c97b6a with the recorded umbrella and Darwin-arm64 integrities."
  classification: FACT
  confidence: HIGH
  scope: "npm/release metadata and static umbrella bytes; no native execution"
  source_ids: [S-001, S-002, S-003, S-006, S-034, S-047]
  fact_dependencies: []
  method: "Correlated registry metadata, release API, tag tree, platform metadata, and exact tarball digest."
  counterevidence: "none found in official npm dist-tags and GitHub v1.0.80 release universe"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "Current standalone copilot is distinct from deprecated gh copilot and from IDE-owned Copilot Agent mode, even when an IDE bridges to the CLI."
  classification: FACT
  confidence: HIGH
  scope: "official product identities and documented VS Code/JetBrains bridges"
  source_ids: [S-007, S-029, S-030, S-031]
  fact_dependencies: []
  method: "Compared official archived extension README, CLI overview, IDE mode guide, and bridge guide."
  counterevidence: "none found in those four official surfaces"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: repository-package-map
  statement: "The complete public v1.0.80 repository tree and umbrella tarball contain no production agent-loop source or runtime test suite."
  classification: FACT
  confidence: HIGH
  scope: "github/copilot-cli tree at ef627e... and @github/copilot@1.0.80 only; not platform package or private repositories"
  source_ids: [S-003, S-006]
  fact_dependencies: []
  method: "Two-method bounded absence: complete recursive tree and exact tar member listing."
  counterevidence: "none found in the two explicitly bounded universes"
  adversarial_status: SUPPORTED
- claim_id: C-004
  section: provenance-license
  statement: "The reviewed CLI license forbids modification and derivative works and permits only conditioned redistribution of unmodified software."
  classification: FACT
  confidence: HIGH
  scope: "LICENSE.md in public tag and npm umbrella"
  source_ids: [S-001, S-005, S-006]
  fact_dependencies: []
  method: "Read exact license text from two matching artifact forms."
  counterevidence: "none found in package or pinned repository license"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: repository-package-map
  statement: "The npm umbrella loader resolves an exact platform package, synchronously spawns its native executable with inherited stdio, and the platform metadata advertises an SDK export."
  classification: FACT
  confidence: HIGH
  scope: "npm-loader.js in @github/copilot@1.0.80"
  source_ids: [S-001, S-006, S-034]
  fact_dependencies: []
  method: "Static inspection of non-proprietary launcher and platform metadata; native executable not inspected."
  counterevidence: "none found in exact wrapper bytes"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: executable-entrypoints
  statement: "CLI 1.0.80 documentation exposes interactive, one-shot, ACP, and SDK/headless entrypoints."
  classification: FACT
  confidence: HIGH
  scope: "documented public interfaces; reachability not dynamically probed"
  source_ids: [S-007, S-008, S-014, S-017, S-024]
  fact_dependencies: []
  method: "Cross-read official overview, command, ACP, SDK, and programmatic references."
  counterevidence: "none found in retained official interface docs"
  adversarial_status: NOT_PROBED
- claim_id: C-007
  section: control-data-flow
  statement: "The CLI, not the SDK, orchestrates repeated model-tool turns, while session.idle and session.task_complete represent mechanical and semantic completion respectively."
  classification: FACT
  confidence: HIGH
  scope: "official SDK/CLI loop contract"
  source_ids: [S-011, S-041]
  fact_dependencies: []
  method: "Traced documented send through turns, tool hooks, and completion events."
  counterevidence: "none found for the normal foreground loop; compaction accounting is separately noted"
  adversarial_status: NOT_PROBED
- claim_id: C-008
  section: module-extension-boundaries
  statement: "The documented extension system includes instructions, agents, skills, MCP/LSP, hooks, extensions, and plugins with component-specific precedence and reload behavior."
  classification: FACT
  confidence: HIGH
  scope: "documented discovery/configuration at cutoff"
  source_ids: [S-009, S-010, S-012, S-013, S-046]
  fact_dependencies: []
  method: "Mapped each official customization surface and its precedence/lifecycle."
  counterevidence: "none found except MCP policy contradiction registered as C-035"
  adversarial_status: NOT_PROBED
- claim_id: C-009
  section: agent-interface
  statement: "The CLI documents model-selected built-in/custom subagents, separate contexts, nested/background task control, and experimental parallel fleet execution."
  classification: FACT
  confidence: MEDIUM
  scope: "documented behavior; process and filesystem isolation excluded"
  source_ids: [S-008, S-009, S-015]
  fact_dependencies: []
  method: "Correlated use guide, task shortcuts, and SDK compatibility matrix."
  counterevidence: "none found in retained docs"
  adversarial_status: NOT_PROBED
- claim_id: C-010
  section: tool-interface
  statement: "Tool calls may target built-ins, SDK JSON-Schema handlers, or MCP servers and traverse permission/hook processing before results re-enter context."
  classification: FACT
  confidence: MEDIUM
  scope: "documented interfaces; internal validator implementation excluded"
  source_ids: [S-011, S-012, S-013, S-015, S-017, S-044]
  fact_dependencies: []
  method: "Mapped declaration, request, authority, result, and context boundaries."
  counterevidence: "none found in retained docs"
  adversarial_status: NOT_PROBED
- claim_id: C-011
  section: provider-interface
  statement: "CLI supports GitHub-hosted routing and OpenAI-compatible, Azure, or Anthropic BYOK, with offline mode disabling GitHub auth and telemetry but not a remote provider connection."
  classification: FACT
  confidence: HIGH
  scope: "documented provider/auth configuration"
  source_ids: [S-007, S-027, S-028]
  fact_dependencies: []
  method: "Compared provider requirements with authentication/offline behavior."
  counterevidence: "none found in retained provider/auth pages"
  adversarial_status: NOT_PROBED
- claim_id: C-012
  section: model-interface
  statement: "Model selection precedence and Auto task/health routing are documented, but internal routing thresholds are not exposed."
  classification: FACT
  confidence: HIGH
  scope: "documented selector and Auto behavior; router internals excluded"
  source_ids: [S-007, S-024, S-025]
  fact_dependencies: []
  method: "Compared model precedence and Auto policy documentation."
  counterevidence: "pinned README's old default-model statement is stale and excluded from current behavior"
  adversarial_status: NOT_PROBED
- claim_id: C-013
  section: context-interface
  statement: "CLI context includes instructions, tool schemas, messages and tool results, spills large outputs, and uses lossy checkpointed model-based compaction near capacity."
  classification: FACT
  confidence: HIGH
  scope: "documented context management"
  source_ids: [S-009, S-010, S-013, S-044]
  fact_dependencies: []
  method: "Traced instruction/skill injection, output spilling, thresholds, summary, and checkpoint."
  counterevidence: "overview's shorthand 95 percent statement is narrower than detailed 80/95 behavior"
  adversarial_status: NOT_PROBED
- claim_id: C-014
  section: state-persistence-restart
  statement: "CLI persists local event/workspace state and a rebuildable SQLite index, while SDK disconnect preserves data and BYOK credentials/tool memory are not persisted."
  classification: FACT
  confidence: HIGH
  scope: "documented CLI and SDK state"
  source_ids: [S-020, S-021, S-022, S-023]
  fact_dependencies: []
  method: "Mapped stores, write lifecycle, resume, reindex, sync, disconnect, and delete."
  counterevidence: "none found; CLI and SDK random-ID resume semantics are scoped separately"
  adversarial_status: NOT_PROBED
- claim_id: C-015
  section: concurrency-worktree-isolation
  statement: "SDK same-session access has no built-in lock, and linked worktrees share persisted permission scope at the main repository root."
  classification: FACT
  confidence: HIGH
  scope: "SDK 1.0.11 docs and CLI permission configuration"
  source_ids: [S-020, S-021, S-023]
  fact_dependencies: []
  method: "Read explicit locking limitation and worktree key rule."
  counterevidence: "none found in retained persistence/config reference"
  adversarial_status: CHALLENGED
- claim_id: C-016
  section: permissions-authority-sandbox
  statement: "CLI deny rules precede allow rules, but trusted-directory, shell-path, and shell-URL controls are explicitly heuristic with documented blind spots."
  classification: FACT
  confidence: HIGH
  scope: "documented policy semantics, not runtime bypass exploitation"
  source_ids: [S-007, S-039]
  fact_dependencies: []
  method: "Compared precedence and official limitations."
  counterevidence: "none; limitations are first-party disclosures"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: permissions-authority-sandbox
  statement: "Local sandbox is preview/off by default and splits OS enforcement for children from software-only built-in file checks, while cloud sandbox isolates the whole interactive session."
  classification: FACT
  confidence: HIGH
  scope: "documented sandbox architecture/defaults"
  source_ids: [S-018, S-019, S-020]
  fact_dependencies: []
  method: "Mapped enforcement location, defaults, backends, bypass, and cloud lifecycle."
  counterevidence: "none found in retained sandbox docs"
  adversarial_status: CHALLENGED
- claim_id: C-018
  section: evidence-observability
  statement: "CLI/SDK expose local logs, persistent session events, hook/events, usage views, and opt-in OpenTelemetry propagation, without a documented tamper-resistant receipt."
  classification: FACT
  confidence: HIGH
  scope: "documented evidence surfaces; absence bounded to retained observability docs"
  source_ids: [S-008, S-021, S-038, S-041]
  fact_dependencies: []
  method: "Mapped event persistence, correlation, log controls, and trace export."
  counterevidence: "none found for cryptographic/tamper-resistant receipt in retained observability universe"
  adversarial_status: NOT_PROBED
- claim_id: C-019
  section: resource-token-cost-accounting
  statement: "Hosted model usage is token-priced in AI credits and session credit limits are soft, while local CPU/memory limits are undocumented."
  classification: FACT
  confidence: HIGH
  scope: "current hosted billing and documented limits"
  source_ids: [S-009, S-018, S-026, S-037, S-038, S-043]
  fact_dependencies: []
  method: "Correlated usage view/events, pricing, soft cap, and cloud meters."
  counterevidence: "pinned README/GA text used legacy premium requests and was treated as stale"
  adversarial_status: NOT_PROBED
- claim_id: C-020
  section: failure-cancellation-retry
  statement: "Documented cancellation removes queued work before active work, lets an in-progress file write finish, and offers SDK abort/error-hook controls."
  classification: FACT
  confidence: MEDIUM
  scope: "documented cancellation and SDK controls; cleanup not observed"
  source_ids: [S-006, S-008, S-040, S-042]
  fact_dependencies: []
  method: "Compared loader diagnostics, keyboard cancellation, task controls, abort, and error hooks."
  counterevidence: "none found; runtime propagation remains outside statement"
  adversarial_status: NOT_PROBED
- claim_id: C-021
  section: failure-cancellation-retry
  statement: "The exact 1.0.80 rollback effect on post-snapshot manual edits and new files is unknown because official documentation is internally contradictory."
  classification: UNKNOWN
  confidence: N/A
  scope: "interactive local rollback at CLI 1.0.80"
  source_ids: [S-042]
  fact_dependencies: []
  method: "attempted_methods=read complete official cancel/rollback page and compare restore statements; blocker=the page both promises mismatch skipping and warns all later manual edits/new files are reverted or deleted, while no safe runtime probe was available; impact=rollback safety cannot be compared reliably; available_evidence=S-042; next_probe=run a pinned disposable workspace matrix with Copilot edits, user edits, new files, and hash capture"
  counterevidence: "S-042 contains both sides of the contradiction"
  adversarial_status: CHALLENGED
- claim_id: C-022
  section: install-update-release
  statement: "CLI 1.0.80 has multiple install channels and digest metadata, but mutable selectors/default auto-update and conditional script verification can change or under-verify installs."
  classification: FACT
  confidence: HIGH
  scope: "official 1.0.80 package/release/installer"
  source_ids: [S-001, S-002, S-006, S-032, S-033, S-034]
  fact_dependencies: []
  method: "Inspected exact package, release assets, installer control flow, and install docs without executing scripts."
  counterevidence: "none found; installer does verify when prerequisites succeed"
  adversarial_status: SUPPORTED
- claim_id: C-023
  section: tests-qualification
  statement: "Runtime tests, coverage, CI qualification, and provider/platform negative results for proprietary CLI 1.0.80 are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "production native runtime, excluding open SDK tests"
  source_ids: [S-003, S-006, S-034]
  fact_dependencies: []
  method: "attempted_methods=search complete public tag tree and umbrella archive and inspect platform metadata; blocker=no runtime source/tests and unsafe/unnecessary native execution; impact=behavioral and release qualification cannot be independently assessed; available_evidence=S-003,S-006,S-034; next_probe=obtain vendor test attestation or authorized disposable runtime qualification matrix"
  counterevidence: "none found in bounded public tree/archive; not a global absence claim"
  adversarial_status: NOT_PROBED
- claim_id: C-024
  section: security
  statement: "The documented security model combines credentials, approvals, hooks, policies, sandbox, redaction, offline mode and artifact digests but retains explicit heuristic, fail-open, extension, and automation risks."
  classification: FACT
  confidence: HIGH
  scope: "documented security-relevant controls and limitations"
  source_ids: [S-011, S-020, S-028, S-035, S-036, S-039, S-046]
  fact_dependencies: []
  method: "Mapped trust boundaries and first-party limitation text."
  counterevidence: "none found; this is not a security acceptance claim"
  adversarial_status: CHALLENGED
- claim_id: C-025
  section: control-data-flow
  statement: "GitHub integration spans built-in MCP, Actions authentication/billing, session sync/remote steering, and optional cloud execution while remote-controlled local side effects remain local."
  classification: FACT
  confidence: HIGH
  scope: "documented GitHub service boundaries"
  source_ids: [S-007, S-009, S-035, S-036]
  fact_dependencies: []
  method: "Traced identity, event, command, billing, and side-effect direction."
  counterevidence: "none found in retained GitHub integration pages"
  adversarial_status: NOT_PROBED
- claim_id: C-026
  section: executable-entrypoints
  statement: "ACP uses NDJSON over stdio/TCP, while the pinned JavaScript SDK 1.0.11 declares CLI dependency ^1.0.79 and uses negotiated JSON-RPC v2-v3 to an out-of-process CLI."
  classification: FACT
  confidence: HIGH
  scope: "documented public protocol surfaces"
  source_ids: [S-014, S-015, S-016, S-017]
  fact_dependencies: []
  method: "Compared transports, protocol versions, process ownership, and session configuration."
  counterevidence: "none found; ACP remains preview"
  adversarial_status: NOT_PROBED
- claim_id: C-027
  section: module-extension-boundaries
  statement: "Hooks and plugins can change authority and model-visible data, and hook failure semantics include fail-open timeout/network paths."
  classification: FACT
  confidence: HIGH
  scope: "documented CLI hooks/plugin contracts"
  source_ids: [S-011, S-046]
  fact_dependencies: []
  method: "Traced hook merge/control/output semantics and plugin components."
  counterevidence: "none found in retained hook/plugin references"
  adversarial_status: CHALLENGED
- claim_id: C-028
  section: context-interface
  statement: "Preview Copilot Memory persists cited repository facts and user preferences with scoped reuse, validation, deletion controls, and 28-day unused expiry."
  classification: FACT
  confidence: HIGH
  scope: "documented hosted memory service"
  source_ids: [S-045]
  fact_dependencies: []
  method: "Read official memory storage, scope, validation, retention, and administration semantics."
  counterevidence: "none found in retained memory page"
  adversarial_status: NOT_PROBED
- claim_id: C-029
  section: strengths
  statement: "The documented multi-surface protocol, event, tool and isolation contracts are an integration and observability strength despite closed enforcement internals."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "architecture comparison only; no adoption implication"
  source_ids: [S-007, S-014, S-015, S-018, S-038]
  fact_dependencies: [C-006, C-017, C-018, C-026]
  method: "Reasoning=multiple independently documented operator surfaces reduce integration ambiguity; assumption=docs reflect 1.0.80 interfaces; alternative=closed runtime may diverge."
  counterevidence: "C-003 and C-036 limit verification"
  adversarial_status: NOT_APPLICABLE:interpretation
- claim_id: C-030
  section: liabilities
  statement: "Closed internals plus permissive mutable defaults, heuristic gates and shared/undefined concurrency materially limit independent assurance."
  classification: INFERENCE
  confidence: HIGH
  scope: "assurance comparison, not a vulnerability finding"
  source_ids: [S-003, S-018, S-020, S-022, S-023, S-032, S-039]
  fact_dependencies: [C-003, C-015, C-016, C-017, C-022]
  method: "Reasoning=each named fact weakens reproducibility or enforced isolation; assumption=no undisclosed compensating control can be credited; alternative=private tests may be strong."
  counterevidence: "documented managed policy, digest, and cloud sandbox mitigations"
  adversarial_status: CHALLENGED
- claim_id: C-031
  section: transferable-patterns
  statement: "An evented orchestrator behind versioned transport adapters is a candidate transferable integration pattern."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "research candidate; requires independent implementation authority"
  source_ids: [S-014, S-015, S-041]
  fact_dependencies: [C-007, C-018, C-026]
  method: "Reasoning=one loop with typed event/protocol adapters separates frontend lifecycle from orchestration; assumption=versioning is maintained; alternative=protocol coupling may dominate."
  counterevidence: "ACP preview status and SDK-only/CLI-only gaps"
  adversarial_status: NOT_APPLICABLE:pattern-disposition
- claim_id: C-032
  section: transferable-patterns
  statement: "An append-only session record with a rebuildable derived index is conditionally transferable only with explicit locking, atomicity, retention and redaction."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "research pattern, not approval"
  source_ids: [S-020, S-021, S-022, S-023]
  fact_dependencies: [C-014, C-015]
  method: "Reasoning=reindex aids recovery but no locking/atomicity prevents unconditional transfer; assumption=event log remains canonical; alternative=database could be primary internally."
  counterevidence: "same-session access is undefined and crash durability is unproven"
  adversarial_status: NOT_APPLICABLE:pattern-disposition
- claim_id: C-033
  section: rejected-patterns-curiosity-no-go
  statement: "The seven methods and adjacent topics listed in Section 24 are rejected within this dossier as unsafe, outside the assigned target, or non-discriminating."
  classification: INFERENCE
  confidence: HIGH
  scope: "research method at this snapshot"
  source_ids: [S-003, S-004, S-005, S-006, S-018, S-026, S-035, S-046]
  fact_dependencies: [C-003, C-004, C-005, C-017, C-019, C-024, C-025, C-027]
  method: "Reasoning=closed licensed runtime and unsafe exploit work exceed authority, while popularity, mutable catalogs, adjacent services, model-output judging, and distinct harnesses do not discriminate this target's architecture; assumption=the assigned comparison remains whole-harness architecture; alternative=separately authorized security, market, cost, quality, cloud, or Agentic Workflows research could reopen the corresponding thread."
  counterevidence: "none within assigned authority"
  adversarial_status: NOT_APPLICABLE:method-rejection
- claim_id: C-034
  section: adversarial-probes
  statement: "Dynamic adversarial behavior of native CLI 1.0.80 is unknown because a safe credential-free disposable execution boundary was not available."
  classification: UNKNOWN
  confidence: N/A
  scope: "P-01 through P-11 and P-14 native/runtime behavior"
  source_ids: [S-003, S-006, S-007]
  fact_dependencies: []
  method: "attempted_methods=static tree/package inspection and official behavior documentation; blocker=target was not preinstalled and installing/running proprietary code on the credential-capable host would violate least-privilege probe conditions; impact=enforcement, cancellation, races, retries and evidence behavior are unqualified; available_evidence=S-003,S-006,S-007; next_probe=run exact signed artifact in a disposable secret-free VM with denied network and instrumented filesystem/process boundaries"
  counterevidence: "none; documentation is not runtime observation"
  adversarial_status: NOT_PROBED
- claim_id: C-035
  section: module-extension-boundaries
  statement: "Organization MCP registry and allowlist enforcement in CLI 1.0.80 is unknown because official pages contradict each other."
  classification: UNKNOWN
  confidence: N/A
  scope: "organization-level MCP policy only"
  source_ids: [S-007, S-012]
  fact_dependencies: []
  method: "attempted_methods=compare current CLI overview and dedicated MCP configuration page; blocker=overview says policies unsupported while MCP page says configured registry/allowlist apply; impact=enterprise extension governance cannot be scored; available_evidence=S-007,S-012; next_probe=policy-controlled organization account test against exact 1.0.80"
  counterevidence: "S-007 contradicts S-012"
  adversarial_status: CHALLENGED
- claim_id: C-036
  section: provenance-license
  statement: "Artifact-to-runtime-source traceability for native CLI 1.0.80 is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "private build a3a2697 versus public tag ef627e..."
  source_ids: [S-001, S-002, S-003, S-006]
  fact_dependencies: []
  method: "attempted_methods=correlate package buildMetadata, public tag, release assets, and repository tree; blocker=short private build commit does not resolve in public documentation repository and native source is closed; impact=reproducible build and source audit unavailable; available_evidence=S-001,S-002,S-003,S-006; next_probe=vendor provenance attestation mapping asset digest to immutable runtime source/build"
  counterevidence: "public tag and private build identifiers differ"
  adversarial_status: CHALLENGED
- claim_id: C-037
  section: concurrency-worktree-isolation
  statement: "Subagent process/filesystem isolation and shared-runtime race behavior are unknown for native CLI 1.0.80."
  classification: UNKNOWN
  confidence: N/A
  scope: "nested/background/fleet agents, sessions and worktrees"
  source_ids: [S-003, S-015, S-023]
  fact_dependencies: []
  method: "attempted_methods=review public tree, SDK feature matrix, and persistence limitations; blocker=closed scheduler/runtime and unsafe concurrent dynamic probe; impact=tenant, worktree and race isolation cannot be compared; available_evidence=S-003,S-015,S-023; next_probe=instrument two colliding sessions/worktrees in a disposable VM and inspect locks/processes/files"
  counterevidence: "C-015 establishes shared permission scope and absent SDK lock, not internal scheduler behavior"
  adversarial_status: NOT_PROBED
- claim_id: C-038
  section: failure-cancellation-retry
  statement: "Default provider/tool retry, backoff, deduplication, partial-success and retry-cost behavior is unknown for CLI 1.0.80."
  classification: UNKNOWN
  confidence: N/A
  scope: "native default behavior excluding caller-supplied SDK error hook"
  source_ids: [S-027, S-040, S-041]
  fact_dependencies: []
  method: "attempted_methods=review provider requirements, error-hook controls, and loop events; blocker=docs specify override controls but not defaults and no safe fault-injection target existed; impact=reliability and cost comparison incomplete; available_evidence=S-027,S-040,S-041; next_probe=fault-inject auth, 429, interrupted stream, tool partial write and duplicate response in an authorized proxy sandbox"
  counterevidence: "none found in retained default-behavior documentation"
  adversarial_status: NOT_PROBED
- claim_id: C-039
  section: transferable-patterns
  statement: "Separating mechanical idle from best-effort semantic completion is conditionally transferable when synthetic continuation also has explicit turn and cost limits."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "research pattern for evented agent loops; no design approval"
  source_ids: [S-026, S-037, S-041]
  fact_dependencies: [C-007, C-019]
  method: "Reasoning=distinct completion signals avoid treating transport quiescence as task success, while continuation limits bound best-effort semantic nudges; assumption=consumers handle both events; alternative=a single terminal state machine could be sufficient for non-agentic tasks."
  counterevidence: "task_complete is best-effort and credit limits may overshoot an in-flight response"
  adversarial_status: NOT_APPLICABLE:pattern-disposition
```

## 27. Source ledger {#source-ledger}

Bibliography rationale: retained sources are first-party, decision-relevant, and
nonduplicative. Mutable documentation is bounded by access date; repository and
package sources are immutable where available. No search snippet is retained as
evidence.

```yaml
- source_id: S-001
  source_kind: package-artifact
  title: "npm registry metadata for @github/copilot 1.0.80"
  url: "https://registry.npmjs.org/%40github%2Fcopilot/1.0.80"
  commit_or_ref: "1.0.80"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@github/copilot@1.0.80 sha512-6tf93ZF56KOiTTAjK/UhLZkl1W543IzaTQly288kockJZFswpRTnQEI00Yvacpb39DTvTYu3/ha9SeKpo/pgZQ=="
  code_path: "package.json"
  symbol: "bin.copilot; optionalDependencies; buildMetadata.gitCommit"
  line_anchor: "JSON pointers /bin/copilot, /optionalDependencies, /buildMetadata/gitCommit"
  command: "curl -fsSL 'https://registry.npmjs.org/%40github%2Fcopilot/1.0.80'"
  command_environment: "network read only; no credentials; 2026-08-24 UTC"
  output_or_hash: "inline:version=1.0.80; integrity=sha512-6tf93...; buildMetadata.gitCommit=a3a2697; fileCount=4"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-004, C-005, C-022, C-036]
  notes: "Official npm registry metadata; package scripts not run."
- source_id: S-002
  source_kind: release-metadata
  title: "GitHub release v1.0.80"
  url: "https://github.com/github/copilot-cli/releases/tag/v1.0.80"
  commit_or_ref: "v1.0.80"
  resolved_commit: "ef627e1baad937d3c8da45f8a5541c6fc3c97b6a"
  package_identity: "@github/copilot@1.0.80 sha256:799457937f8f87de6fdc95599380de5f5a0f761ab2fdfbba7f8d1c82d2988892"
  code_path: "N/A:no-code-path"
  symbol: "release 370313255 assets"
  line_anchor: "JSON fields /tag_name,/prerelease,/published_at,/assets"
  command: "curl -fsSL 'https://api.github.com/repos/github/copilot-cli/releases/tags/v1.0.80'"
  command_environment: "network read only; no credentials; 2026-08-24 UTC"
  output_or_hash: "inline:published_at=2026-08-14T02:28:39Z; prerelease=false; immutable=false; SHA256SUMS asset present"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-022, C-036]
  notes: "Canonical browser URL revalidated HTTP 200; exact anonymous API command is quota-dependent and returned HTTP 403 when the shared core quota was exhausted; assets not executed."
- source_id: S-003
  source_kind: repository-file
  title: "Complete public repository tree at v1.0.80"
  url: "https://github.com/github/copilot-cli/tree/ef627e1baad937d3c8da45f8a5541c6fc3c97b6a"
  commit_or_ref: "v1.0.80"
  resolved_commit: "ef627e1baad937d3c8da45f8a5541c6fc3c97b6a"
  package_identity: "N/A:not-a-package"
  code_path: "/"
  symbol: "recursive git tree"
  line_anchor: "JSON /tree; truncated=false"
  command: "curl -fsSL 'https://api.github.com/repos/github/copilot-cli/git/trees/ef627e1baad937d3c8da45f8a5541c6fc3c97b6a?recursive=1'"
  command_environment: "network read only; no credentials; 2026-08-24 UTC"
  output_or_hash: "inline:truncated=false; only workflows, LICENSE.md, README.md, changelog.md, install.sh"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-003, C-023, C-030, C-033, C-034, C-036, C-037]
  notes: "Primary bounded-absence source; canonical immutable tree URL revalidated HTTP 200; exact anonymous recursive-tree API command is quota-dependent and returned HTTP 403 when the shared core quota was exhausted."
- source_id: S-004
  source_kind: repository-file
  title: "Pinned Copilot CLI README"
  url: "https://github.com/github/copilot-cli/blob/ef627e1baad937d3c8da45f8a5541c6fc3c97b6a/README.md"
  commit_or_ref: "v1.0.80"
  resolved_commit: "ef627e1baad937d3c8da45f8a5541c6fc3c97b6a"
  package_identity: "N/A:not-a-package"
  code_path: "README.md"
  symbol: "product overview/install/LSP"
  line_anchor: "L1-L108"
  command: "curl -fsSL 'https://raw.githubusercontent.com/github/copilot-cli/ef627e1baad937d3c8da45f8a5541c6fc3c97b6a/README.md'"
  command_environment: "network read only; no credentials; 2026-08-24 UTC"
  output_or_hash: "inline:standalone terminal agent; built-in GitHub MCP; package/install overview"
  access_date: "2026-08-24"
  supports_claims: [C-033]
  notes: "Some model/billing/approval prose is stale versus current docs; retained for identity only."
- source_id: S-005
  source_kind: license
  title: "Pinned GitHub Copilot CLI License"
  url: "https://github.com/github/copilot-cli/blob/ef627e1baad937d3c8da45f8a5541c6fc3c97b6a/LICENSE.md"
  commit_or_ref: "v1.0.80"
  resolved_commit: "ef627e1baad937d3c8da45f8a5541c6fc3c97b6a"
  package_identity: "@github/copilot@1.0.80"
  code_path: "LICENSE.md"
  symbol: "Sections 1-8"
  line_anchor: "L1-L37"
  command: "curl -fsSL 'https://raw.githubusercontent.com/github/copilot-cli/ef627e1baad937d3c8da45f8a5541c6fc3c97b6a/LICENSE.md'"
  command_environment: "network read only; no credentials; 2026-08-24 UTC"
  output_or_hash: "inline:modification/derivative works prohibited; conditioned unmodified redistribution"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-033]
  notes: "Actual license text, preferable to package label."
- source_id: S-006
  source_kind: package-artifact
  title: "Read-only umbrella tarball identity and member probe"
  url: "https://registry.npmjs.org/@github/copilot/-/copilot-1.0.80.tgz"
  commit_or_ref: "1.0.80"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@github/copilot@1.0.80 sha256:799457937f8f87de6fdc95599380de5f5a0f761ab2fdfbba7f8d1c82d2988892"
  code_path: "package/npm-loader.js; package/package.json; package/LICENSE.md"
  symbol: "handleSpawnResult; platform resolver"
  line_anchor: "npm-loader.js L1-L5; package.json JSON root; LICENSE.md L1-L37"
  command: "T=$(mktemp -d \"${TMPDIR%/}/copilot-cli-probe.XXXXXX\") && trap 'rm -rf \"$T\"' EXIT && curl -fsSLo \"$T/copilot-1.0.80.tgz\" 'https://registry.npmjs.org/@github/copilot/-/copilot-1.0.80.tgz' && shasum -a 256 \"$T/copilot-1.0.80.tgz\" && tar -tzf \"$T/copilot-1.0.80.tgz\" && tar -xOf \"$T/copilot-1.0.80.tgz\" package/npm-loader.js"
  command_environment: "Darwin arm64 27.0; approved disposable temp; no scripts/binary execution; network only for exact tarball"
  output_or_hash: "inline:sha256=799457937f8f87de6fdc95599380de5f5a0f761ab2fdfbba7f8d1c82d2988892; four members; sha512 matched registry"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-003, C-004, C-005, C-020, C-022, C-023, C-033, C-034, C-036]
  notes: "Researcher retained command output in session; proprietary platform bytes not downloaded."
- source_id: S-007
  source_kind: official-documentation
  title: "About GitHub Copilot CLI"
  url: "https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "modes, security, context, customization, models, ACP"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:interactive/programmatic; approvals; heuristic trusted dirs; compaction; BYOK; ACP"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-006, C-011, C-012, C-016, C-025, C-029, C-034, C-035]
  notes: "Canonical product overview; changing documentation bounded by access date."
- source_id: S-008
  source_kind: official-documentation
  title: "GitHub Copilot CLI command reference"
  url: "https://docs.github.com/en/copilot/reference/cli-command-reference"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "commands, shortcuts, tasks, sessions"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/reference/cli-command-reference'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:entrypoints; nested tasks; cancellation; resume; logging/help surfaces"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-009, C-018, C-020]
  notes: "Large mutable reference; only decision-relevant fields retained."
- source_id: S-009
  source_kind: official-documentation
  title: "Using GitHub Copilot CLI"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/overview"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "approvals, subagents, MCP, usage, sandbox"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/overview'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:built-in agents, context/usage commands, sync/resume, GitHub MCP"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-009, C-013, C-019, C-025]
  notes: "Primary operator workflow source."
- source_id: S-010
  source_kind: official-documentation
  title: "Adding custom instructions for Copilot CLI"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "AGENTS.md and instruction discovery"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:AGENTS.md/CLAUDE.md/GEMINI.md; combine/no general precedence; restart to reload"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-013]
  notes: "Selected for exact discovery and combination rules."
- source_id: S-011
  source_kind: official-documentation
  title: "GitHub Copilot hooks reference"
  url: "https://docs.github.com/en/copilot/reference/hooks-reference"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "hook v1 events and decisions"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/reference/hooks-reference'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:permission/pre/post/stop/subagent hooks; command timeout fail-open; HTTP errors fail-open"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-010, C-024, C-027]
  notes: "Primary authority/failure schema source."
- source_id: S-012
  source_kind: official-documentation
  title: "Adding MCP servers for Copilot CLI"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "MCP transports/config/preference/trust"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:stdio/http/sse; project precedence; trust skip; page says registry/allowlist applies"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-010, C-035]
  notes: "Contradicts S-007 on organization MCP policy support."
- source_id: S-013
  source_kind: official-documentation
  title: "Adding agent skills for Copilot CLI"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "SKILL.md discovery/injection/allowed-tools"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:model relevance selects SKILL.md; resources available; allowed-tools can preapprove shell"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-010, C-013]
  notes: "Primary skill/context/authority source."
- source_id: S-014
  source_kind: official-documentation
  title: "Copilot CLI ACP server"
  url: "https://docs.github.com/en/copilot/reference/copilot-cli-reference/acp-server"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "--acp stdio/TCP NDJSON"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/reference/copilot-cli-reference/acp-server'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:preview; NDJSON; stdio one client; TCP loopback/multiple connections; server-wide filters"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-026, C-029, C-031]
  notes: "Canonical ACP lifecycle/protocol source."
- source_id: S-015
  source_kind: official-documentation
  title: "SDK and CLI compatibility"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-sdk/troubleshooting/compatibility"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@github/copilot-sdk@1.0.11"
  code_path: "N/A:no-code-path"
  symbol: "JSON-RPC v2-v3 compatibility matrix"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-sdk/troubleshooting/compatibility'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:SDK deny-by-default; sessions/tools/events/fleet; JSON-RPC v2-v3 negotiation"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-010, C-026, C-029, C-031, C-037]
  notes: "Selected to separate SDK and TUI capabilities."
- source_id: S-016
  source_kind: package-artifact
  title: "npm metadata for @github/copilot-sdk 1.0.11"
  url: "https://registry.npmjs.org/%40github%2Fcopilot-sdk/1.0.11"
  commit_or_ref: "v1.0.11"
  resolved_commit: "a550258d5c37bd662197536992a23d633bfe5804"
  package_identity: "@github/copilot-sdk@1.0.11 sha512-ngrnfa9052fLTOMoY0iiQS2B6pFDYJpWNj3syCdjzdje0R5mWoij9b8exJZciLvX7BbJjKz2/lIdwo24av3e3A=="
  code_path: "package.json"
  symbol: "dependencies.@github/copilot"
  line_anchor: "JSON pointers /version,/dependencies/@github~1copilot"
  command: "curl -fsSL 'https://registry.npmjs.org/%40github%2Fcopilot-sdk/1.0.11'"
  command_environment: "network read only; no install/scripts; 2026-08-24 UTC"
  output_or_hash: "inline:version=1.0.11; dependency @github/copilot=^1.0.79; MIT; provenance attestation present"
  access_date: "2026-08-24"
  supports_claims: [C-026]
  notes: "Ancillary SDK pinned because it controls the documented headless surface; no execution."
- source_id: S-017
  source_kind: official-documentation
  title: "Build your first Copilot-powered app"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-sdk/getting-started"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@github/copilot-sdk@1.0.11 scope"
  code_path: "N/A:no-code-path"
  symbol: "CopilotClient; --headless; telemetry"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-sdk/getting-started'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:SDK manages CLI process or external headless; loopback default; custom tools and streaming"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-010, C-026]
  notes: "Warning requires caller-provided controls for non-loopback headless exposure."
- source_id: S-018
  source_kind: official-documentation
  title: "About cloud and local sandboxes"
  url: "https://docs.github.com/en/copilot/concepts/about-cloud-and-local-sandboxes"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "MXC/local and Azure cloud sandbox"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/concepts/about-cloud-and-local-sandboxes'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:preview; local off/lightweight; built-in file checks best-effort; cloud interactive isolation/meters"
  access_date: "2026-08-24"
  supports_claims: [C-017, C-019, C-029, C-030, C-033]
  notes: "Primary sandbox architecture source."
- source_id: S-019
  source_kind: official-documentation
  title: "Understanding local sandbox filesystem policies"
  url: "https://docs.github.com/en/copilot/concepts/agents/copilot-cli/understanding-local-sandboxing"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "filesystem policy resolution"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/concepts/agents/copilot-cli/understanding-local-sandboxing'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:deny-default policy; automatic grants; specific/user rules; subprocess versus in-process enforcement"
  access_date: "2026-08-24"
  supports_claims: [C-017]
  notes: "Selected for enforcement location and overlap rules."
- source_id: S-020
  source_kind: official-documentation
  title: "Configuring local sandbox settings"
  url: "https://docs.github.com/en/copilot/how-tos/cloud-and-local-sandboxes/configuring-local-sandbox-settings"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "sandbox defaults/bypass/auth/network/filesystem"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/cloud-and-local-sandboxes/configuring-local-sandbox-settings'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:bypass/network/auth/dev-tool access on by default; cooperative proxy on macOS/Linux"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-015, C-017, C-024, C-030, C-032]
  notes: "Also supports worktree-related permission context through linked config reference."
- source_id: S-021
  source_kind: official-documentation
  title: "GitHub Copilot CLI configuration directory"
  url: "https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "session-state, permissions-config, logs, session-store.db"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:events.jsonl/workspace, SQLite, logs, worktree permission key, settings failures/migrations"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-015, C-018, C-032]
  notes: "Primary local state/package map source."
- source_id: S-022
  source_kind: official-documentation
  title: "About Copilot CLI session data"
  url: "https://docs.github.com/en/copilot/concepts/agents/copilot-cli/chronicle"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "local session persistence/sync/reindex/deletion"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/concepts/agents/copilot-cli/chronicle'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:local complete record; default GitHub sync; periodic writes; separate local/remote deletion"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-030, C-032]
  notes: "Primary sync/privacy/recovery source."
- source_id: S-023
  source_kind: official-documentation
  title: "Copilot SDK session persistence"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/session-persistence"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@github/copilot-sdk@1.0.11 scope"
  code_path: "N/A:no-code-path"
  symbol: "resume/disconnect/delete/locking"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/session-persistence'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:caller session IDs; no same-session locking; BYOK/tool memory not persisted; per-user server recommended"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-015, C-030, C-032, C-037]
  notes: "Primary SDK restart/concurrency source."
- source_id: S-024
  source_kind: official-documentation
  title: "Copilot CLI programmatic reference"
  url: "https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "-p, permission flags, model precedence, sharing"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:one-shot options; model precedence; secret redaction; transcript/gist export"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-012]
  notes: "Selected for headless CLI rather than SDK behavior."
- source_id: S-025
  source_kind: official-documentation
  title: "About Copilot Auto model selection"
  url: "https://docs.github.com/en/copilot/concepts/models/auto-model-selection"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "task/health routing and policy"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/concepts/models/auto-model-selection'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:task complexity plus live health; cache boundaries; policy filtering; 10 percent paid discount"
  access_date: "2026-08-24"
  supports_claims: [C-012]
  notes: "Primary routing-policy source; internal classifier remains closed."
- source_id: S-026
  source_kind: official-documentation
  title: "Models and pricing for GitHub Copilot"
  url: "https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "AI credits and token classes"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:input/cached/cache-write/output token pricing; 1 AI credit=$0.01"
  access_date: "2026-08-24"
  supports_claims: [C-019, C-033, C-039]
  notes: "Mutable prices not copied; mechanism retained."
- source_id: S-027
  source_kind: official-documentation
  title: "Using BYOK models in Copilot CLI"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-byok-models"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "COPILOT_PROVIDER_* and COPILOT_OFFLINE"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-byok-models'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:openai/azure/anthropic; streaming/tool-call requirement; offline provider caveat"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-038]
  notes: "Primary BYOK adapter contract source."
- source_id: S-028
  source_kind: official-documentation
  title: "Authenticating GitHub Copilot CLI"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "credential precedence/storage/offline"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:token precedence; keychain/plaintext fallback; BYOK unauthenticated limits; offline telemetry off"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-024]
  notes: "Primary credential boundary source."
- source_id: S-029
  source_kind: repository-file
  title: "Archived gh-copilot README"
  url: "https://github.com/github/gh-copilot/blob/98ba986c2ca3a606f47e081a97316523bf0ef473/README.md"
  commit_or_ref: "main archived"
  resolved_commit: "98ba986c2ca3a606f47e081a97316523bf0ef473"
  package_identity: "N/A:not-a-package"
  code_path: "README.md"
  symbol: "deprecation and gh copilot commands"
  line_anchor: "L1-L72"
  command: "curl -fsSL 'https://raw.githubusercontent.com/github/gh-copilot/98ba986c2ca3a606f47e081a97316523bf0ef473/README.md'"
  command_environment: "network read only; archived official repository; 2026-08-24 UTC"
  output_or_hash: "inline:deprecated 2025-10-25; gh extension; suggest/explain/alias/config"
  access_date: "2026-08-24"
  supports_claims: [C-002]
  notes: "Primary disambiguation source; historical product only."
- source_id: S-030
  source_kind: official-documentation
  title: "Asking GitHub Copilot questions in your IDE"
  url: "https://docs.github.com/en/copilot/how-tos/chat-with-copilot/chat-in-ide?tool=vscode"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "IDE Agent mode and Copilot CLI agent selection"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/chat-with-copilot/chat-in-ide?tool=vscode'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:IDE Agent mode edits/terminal; JetBrains lists Agent mode and Copilot CLI separately"
  access_date: "2026-08-24"
  supports_claims: [C-002]
  notes: "Used only to disambiguate IDE runtime."
- source_id: S-031
  source_kind: official-documentation
  title: "Connecting Copilot CLI to VS Code"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/connecting-vs-code"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "IDE bridge/context/diff/session"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/connecting-vs-code'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:one trusted VS Code workspace; selection/diagnostics/diff approval/transcript bridge"
  access_date: "2026-08-24"
  supports_claims: [C-002]
  notes: "Shows bridge without conflating IDE Agent mode."
- source_id: S-032
  source_kind: repository-file
  title: "Pinned Copilot CLI installer"
  url: "https://github.com/github/copilot-cli/blob/ef627e1baad937d3c8da45f8a5541c6fc3c97b6a/install.sh"
  commit_or_ref: "v1.0.80"
  resolved_commit: "ef627e1baad937d3c8da45f8a5541c6fc3c97b6a"
  package_identity: "N/A:not-a-package"
  code_path: "install.sh"
  symbol: "download/checksum/install control flow"
  line_anchor: "L1-L165"
  command: "curl -fsSL 'https://raw.githubusercontent.com/github/copilot-cli/ef627e1baad937d3c8da45f8a5541c6fc3c97b6a/install.sh'"
  command_environment: "static inspection only; script not executed; 2026-08-24 UTC"
  output_or_hash: "inline:VERSION pin supported; checksum conditional on download/tool; latest mutable; tar validated"
  access_date: "2026-08-24"
  supports_claims: [C-022, C-030]
  notes: "Preferred over executing curl-pipe-shell."
- source_id: S-033
  source_kind: official-documentation
  title: "Installing GitHub Copilot CLI"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "npm/Homebrew/WinGet/script/direct install"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:Node 22+ npm prerequisite; stable/prerelease channels; VERSION support"
  access_date: "2026-08-24"
  supports_claims: [C-022]
  notes: "Canonical supported install channels."
- source_id: S-034
  source_kind: package-artifact
  title: "Darwin arm64 platform package metadata"
  url: "https://registry.npmjs.org/%40github%2Fcopilot-darwin-arm64/1.0.80"
  commit_or_ref: "1.0.80"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@github/copilot-darwin-arm64@1.0.80 sha512-fzn4PnSx3+O/a3ip72KVsjnzORsEygK+0i21bFAnFBYS+0Wi1Pk+o/CmNsJ7aRbf1enSJrcH8UDVkyc9pMGEBg=="
  code_path: "package.json metadata only"
  symbol: "bin; exports; dist"
  line_anchor: "JSON pointers /bin,/exports,/dist"
  command: "curl -fsSL 'https://registry.npmjs.org/%40github%2Fcopilot-darwin-arm64/1.0.80'"
  command_environment: "Darwin arm64; metadata only; binary not downloaded/executed"
  output_or_hash: "inline:fileCount=241; unpackedSize=341538579; native copilot bin; ./sdk export"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-005, C-022, C-023]
  notes: "Closed platform contents deliberately not inspected."
- source_id: S-035
  source_kind: official-documentation
  title: "Using Copilot CLI in GitHub Actions with GITHUB_TOKEN"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli-in-actions"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "copilot-requests permission and Actions warning"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli-in-actions'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:GITHUB_TOKEN + copilot-requests:write; org billing policy; broad environment/fork warning"
  access_date: "2026-08-24"
  supports_claims: [C-024, C-025, C-033]
  notes: "Direct CLI workflow only; Agentic Workflows excluded."
- source_id: S-036
  source_kind: official-documentation
  title: "About remote control of Copilot CLI sessions"
  url: "https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-remote-control"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "remote event/command/permission bridge"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-remote-control'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:interactive only; same-account; first response wins; events sent and commands polled; execution local"
  access_date: "2026-08-24"
  supports_claims: [C-024, C-025]
  notes: "Primary remote authority/data-direction source."
- source_id: S-037
  source_kind: official-documentation
  title: "Setting an AI credit session limit"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/set-session-limit"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "--max-ai-credits and /limits"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/set-session-limit'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:preview soft limit; in-flight response may overshoot; noninteractive run ends"
  access_date: "2026-08-24"
  supports_claims: [C-019, C-039]
  notes: "Primary cost enforcement source."
- source_id: S-038
  source_kind: official-documentation
  title: "OpenTelemetry instrumentation for Copilot SDK"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-sdk/observability/opentelemetry"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@github/copilot-sdk@1.0.11 scope"
  code_path: "N/A:no-code-path"
  symbol: "TelemetryConfig and W3C propagation"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-sdk/observability/opentelemetry'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:OTLP/file exporter; captureContent; SDK-CLI and CLI-tool trace propagation; assistant.usage endpoint"
  access_date: "2026-08-24"
  supports_claims: [C-018, C-019, C-029]
  notes: "Primary trace/usage correlation source."
- source_id: S-039
  source_kind: official-documentation
  title: "Configuring GitHub Copilot CLI"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/configure-copilot-cli"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "tool/path/URL permissions"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/configure-copilot-cli'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:deny precedence; path/URL heuristic limitations; yolo composition; temp access"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-024, C-030]
  notes: "First-party limitation text; not a dynamic bypass test."
- source_id: S-040
  source_kind: official-documentation
  title: "Copilot SDK error handling hook"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-sdk/hooks/error-handling"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@github/copilot-sdk@1.0.11 scope"
  code_path: "N/A:no-code-path"
  symbol: "onErrorOccurred retry/skip/abort"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-sdk/hooks/error-handling'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:error context/recoverable; caller retry count/skip/abort/suppress; Java differs"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-038]
  notes: "Override capability does not establish native default policy."
- source_id: S-041
  source_kind: official-documentation
  title: "The Copilot SDK agent loop"
  url: "https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/agent-loop"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@github/copilot-sdk@1.0.11 scope"
  code_path: "N/A:no-code-path"
  symbol: "turn loop, idle, task_complete"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/agent-loop'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:CLI orchestrator; one API call per turn; idle ephemeral; task_complete persisted/best-effort; autopilot nudge"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-018, C-031, C-038, C-039]
  notes: "Tension with S-044 background compaction call retained."
- source_id: S-042
  source_kind: official-documentation
  title: "Canceling and rolling back Copilot CLI operations"
  url: "https://docs.github.com/en/copilot/concepts/agents/copilot-cli/cancel-and-roll-back"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Esc/Ctrl-C/rewind"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/concepts/agents/copilot-cli/cancel-and-roll-back'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:queue-first cancellation; writes complete; rollback limits; contradictory manual-edit scope"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-021]
  notes: "Contradiction preserved rather than averaged away."
- source_id: S-043
  source_kind: official-documentation
  title: "Allowing Copilot CLI to work autonomously"
  url: "https://docs.github.com/en/copilot/concepts/agents/copilot-cli/autopilot"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "autopilot permissions/continuations/cost"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/concepts/agents/copilot-cli/autopilot'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:continuation loop; limited mode auto-denies; max continues; sticky mode; programmatic use"
  access_date: "2026-08-24"
  supports_claims: [C-019]
  notes: "Selected to distinguish autonomy from permission bypass."
- source_id: S-044
  source_kind: official-documentation
  title: "Managing context in Copilot CLI"
  url: "https://docs.github.com/en/copilot/concepts/agents/copilot-cli/context-management"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "context components, output spill, compaction/checkpoints"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/concepts/agents/copilot-cli/context-management'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:20KiB spill; 80/95 compaction; model summary; concurrent messages; irreversible/lossy checkpoint"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-013]
  notes: "Primary context accounting source."
- source_id: S-045
  source_kind: official-documentation
  title: "About GitHub Copilot Memory"
  url: "https://docs.github.com/en/copilot/concepts/agents/copilot-memory"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "repository facts/user preferences"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/concepts/agents/copilot-memory'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:preview; citations/validation/scope; cross-surface; 28-day unused retention"
  access_date: "2026-08-24"
  supports_claims: [C-028]
  notes: "Hosted memory behavior; storage implementation closed."
- source_id: S-046
  source_kind: official-documentation
  title: "GitHub Copilot CLI plugin reference"
  url: "https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "plugin manifest, source pinning, precedence, auto-update"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -fsSL 'https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference'"
  command_environment: "passive web retrieval; 2026-08-24 UTC"
  output_or_hash: "inline:agents/skills/hooks/extensions/MCP/LSP bundle; SHA pin; precedence; first-party auto-update"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-024, C-027, C-033]
  notes: "Primary plugin packaging/supply-chain source."
- source_id: S-047
  source_kind: release-metadata
  title: "npm dist-tags for @github/copilot at cutoff"
  url: "https://registry.npmjs.org/-/package/%40github%2Fcopilot/dist-tags"
  commit_or_ref: "N/A:registry-dist-tags"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@github/copilot latest=1.0.80; prerelease=1.0.81-9"
  code_path: "N/A:no-code-path"
  symbol: "latest; prerelease"
  line_anchor: "JSON /latest,/prerelease"
  command: "curl -fsSL 'https://registry.npmjs.org/-/package/%40github%2Fcopilot/dist-tags'"
  command_environment: "network read only; no credentials; 2026-08-24 UTC"
  output_or_hash: "inline:{\"latest\":\"1.0.80\",\"prerelease\":\"1.0.81-9\"}"
  access_date: "2026-08-24"
  supports_claims: [C-001]
  notes: "Mutable registry result captured at cutoff; exact reviewed artifact remains immutable."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "github-copilot-cli-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "GitHub Copilot CLI"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/github/copilot-cli"
  resolved_commit: "ef627e1baad937d3c8da45f8a5541c6fc3c97b6a"
  observed_ref: "v1.0.80"
  package_identity: "@github/copilot@1.0.80+sha512-6tf93ZF56KOiTTAjK/UhLZkl1W543IzaTQly288kockJZFswpRTnQEI00Yvacpb39DTvTYu3/ha9SeKpo/pgZQ=="
research:
  researcher: "ses_fc91daa8affevHDJgQCdbA7cyx"
  owned_path: "research/harnesses/github-copilot-cli.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "OBSERVED"
    summary: "Stable package, public tag, platform metadata, and product exclusions are pinned."
    confidence: "HIGH"
    claim_ids: ["C-001", "C-002"]
    source_ids: ["S-001", "S-002", "S-003", "S-006", "S-029", "S-030", "S-034", "S-047"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "PARTIAL"
    summary: "License is exact, but native build-to-source provenance is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-004", "C-036"]
    source_ids: ["S-001", "S-005", "S-006"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "OBSERVED"
    summary: "Public documentation shell and npm launcher/native package boundary are mapped."
    confidence: "HIGH"
    claim_ids: ["C-003", "C-005"]
    source_ids: ["S-003", "S-006", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "OBSERVED"
    summary: "Interactive, one-shot, ACP, and SDK/headless surfaces are documented."
    confidence: "HIGH"
    claim_ids: ["C-006", "C-026"]
    source_ids: ["S-007", "S-014", "S-015", "S-016", "S-017", "S-024"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "PARTIAL"
    summary: "The model-tool loop and GitHub crossings are documented but closed internally."
    confidence: "MEDIUM"
    claim_ids: ["C-007", "C-025"]
    source_ids: ["S-009", "S-035", "S-036", "S-041"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "PARTIAL"
    summary: "Extension precedence and hook/plugin authority are mapped; MCP policy enforcement conflicts."
    confidence: "MEDIUM"
    claim_ids: ["C-008", "C-027", "C-035"]
    source_ids: ["S-007", "S-011", "S-012", "S-046"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "PARTIAL"
    summary: "Delegation and task controls are documented, but child isolation is not."
    confidence: "MEDIUM"
    claim_ids: ["C-009", "C-037"]
    source_ids: ["S-008", "S-009", "S-015", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "PARTIAL"
    summary: "Built-in, SDK, MCP, permission, hook, and result boundaries are documented."
    confidence: "MEDIUM"
    claim_ids: ["C-010"]
    source_ids: ["S-011", "S-012", "S-013", "S-015", "S-017"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provider_interface"
    coverage: "PARTIAL"
    summary: "Hosted/BYOK/offline auth is mapped; default retry and fallback remain unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-011", "C-038"]
    source_ids: ["S-027", "S-028", "S-040"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Selection precedence and Auto policy are documented; router internals are closed."
    confidence: "HIGH"
    claim_ids: ["C-012"]
    source_ids: ["S-024", "S-025"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "Assembly, spill, compaction, skills, instructions, and memory are documented."
    confidence: "HIGH"
    claim_ids: ["C-013", "C-028"]
    source_ids: ["S-009", "S-010", "S-013", "S-044", "S-045"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "Local/synced state and recovery are mapped; atomicity and conflicts remain unknown."
    confidence: "HIGH"
    claim_ids: ["C-014"]
    source_ids: ["S-020", "S-021", "S-022", "S-023"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Known shared permission/no-lock behavior is recorded; runtime races are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-037"]
    source_ids: ["S-020", "S-021", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "PARTIAL"
    summary: "Approval and sandbox policy is documented with explicit heuristic and split-enforcement limits."
    confidence: "HIGH"
    claim_ids: ["C-016", "C-017"]
    source_ids: ["S-007", "S-018", "S-019", "S-020", "S-039"]
    pattern_disposition: "NO_POSITION"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Logs, events, transcripts and OTel exist without proven tamper resistance."
    confidence: "HIGH"
    claim_ids: ["C-018"]
    source_ids: ["S-008", "S-021", "S-038", "S-041"]
    pattern_disposition: "CANDIDATE"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Token pricing, usage events and soft session budgets are exposed; reconciliation is untested."
    confidence: "HIGH"
    claim_ids: ["C-019"]
    source_ids: ["S-026", "S-037", "S-038", "S-043"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Cancellation and override hooks are documented; rollback/default retries are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-020", "C-021", "C-038"]
    source_ids: ["S-040", "S-041", "S-042"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Exact artifacts and channels are pinned; source traceability and rollback are missing."
    confidence: "HIGH"
    claim_ids: ["C-022", "C-036"]
    source_ids: ["S-001", "S-002", "S-006", "S-032", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "UNKNOWN"
    summary: "Closed runtime test and qualification evidence was unavailable."
    confidence: "N/A"
    claim_ids: ["C-023", "C-034"]
    source_ids: ["S-003", "S-006", "S-034"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "PARTIAL"
    summary: "Controls and disclosed limitations are mapped without security acceptance."
    confidence: "HIGH"
    claim_ids: ["C-024"]
    source_ids: ["S-011", "S-028", "S-035", "S-039", "S-046"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "PARTIAL"
    summary: "Multi-surface integration and observability are evidence-backed research strengths."
    confidence: "MEDIUM"
    claim_ids: ["C-029"]
    source_ids: ["S-014", "S-015", "S-018", "S-038"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "PARTIAL"
    summary: "Closed enforcement, mutable defaults, heuristics and shared state limit assurance."
    confidence: "HIGH"
    claim_ids: ["C-030"]
    source_ids: ["S-003", "S-018", "S-023", "S-032", "S-039"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "PARTIAL"
    summary: "Evented protocols and rebuildable session evidence are candidate/conditional patterns only."
    confidence: "MEDIUM"
    claim_ids: ["C-031", "C-032", "C-039"]
    source_ids: ["S-014", "S-015", "S-020", "S-021", "S-022", "S-026", "S-037", "S-041"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Binary reverse engineering and six low-value or unsafe threads are rejected in scope."
    confidence: "HIGH"
    claim_ids: ["C-033"]
    source_ids: ["S-003", "S-005", "S-006"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-029"]
liability_ids: ["C-030"]
transferable_pattern_ids: ["C-031", "C-032", "C-039"]
curiosity_no_go_ids: ["C-033"]
unknown_claim_ids: ["C-021", "C-023", "C-034", "C-035", "C-036", "C-037", "C-038"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| UNKNOWN | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-021 rollback scope | destructive recovery safety | hash-matrix disposable rollback probe | pinned binary in disposable VM | UNASSIGNED |
| C-023 qualification | runtime confidence/platform matrix | vendor test attestation or authorized qualification | vendor evidence or isolated credentials | UNASSIGNED |
| C-034 dynamic probes | enforcement/reliability behavior | execute P-01–P-11/P-14 in secret-free VM | signed artifact, disposable VM, controlled proxy | UNASSIGNED |
| C-035 MCP org policy | enterprise extension governance | allowlist deny-path test | policy-controlled org account | UNASSIGNED |
| C-036 source traceability | reproducibility/supply chain | vendor SLSA-style artifact-source attestation | vendor build provenance | UNASSIGNED |
| C-037 races/isolation | multi-user/worktree safety | colliding sessions/worktrees with instrumentation | disposable VM and two clients | UNASSIGNED |
| C-038 retries/idempotency | failure and cost semantics | fault-injection proxy/provider/tool matrix | authorized provider test account/proxy | UNASSIGNED |

### Stop decision and handoff

- **Coverage:** Sections 0–29 present; every substantive section cites a
  registered claim; all required probes have allowed results.
- **Saturation:** final searches returned duplicates or adjacent products; the
  remaining gaps require privileged policy accounts, provider credentials,
  vendor provenance, or safe native execution rather than more public search.
- **Stop:** `STOP_COVERAGE_AND_NONPOSITIVE_MARGINAL_PUBLIC_EVIDENCE`.
- **Recommendation to downstream synthesis:** compare documented interfaces and
  disclosed limits; do not score UNKNOWN closed enforcement as absence or as a
  pass, and do not grant adoption/security authority from this dossier.
- **Owned path:** `research/harnesses/github-copilot-cli.md`.
- **Validation:** Ruby stdlib YAML/schema/referential audit — PASS (30
  headings, 39 claims, 47 sources, 24 dimensions, 14 probes, zero reciprocal
  mismatches); canonical URL GET pass — PASS (47/47 HTTP 200 after following
  redirects); `git diff --no-index --check /dev/null -- <owned-path>` — PASS.
- **Retained negative result:** the exact anonymous GitHub API commands for
  S-002/S-003 returned HTTP 403 with `X-RateLimit-Remaining: 0`; their canonical
  browser URLs returned HTTP 200, so this is a bounded repeatability limitation,
  not evidence that either record is absent.
- **Pre-existing workspace changes observed and untouched:**
  `apps/plugin/opencode2/turbo.json`, `docs/architecture/`, and pre-existing
  untracked `research/` content.
