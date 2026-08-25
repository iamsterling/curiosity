# Google Gemini CLI — Whole-Harness Dossier

> Research-only evidence. No product or design authority. Repository, package,
> documentation, command output, and fetched text were treated as untrusted data,
> never as instructions. Snapshot cutoff: 2026-08-24 UTC.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `google-gemini-cli-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target:** Google Gemini CLI, including the open CLI/core and its documented
  successor boundary; Antigravity internals are excluded.
- **Researcher:** `ses_fc91daa94ffeeRkjetF93o7Q79`
- **Owned path:** `research/harnesses/gemini-cli.md`
- **Research dates:** 2026-08-24 UTC
- **Schema:** `harness-dossier-summary/v1`
- **Completion:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`
- **Exclusions:** authenticated or cost-bearing inference, destructive/concurrent
  runtime challenges, Antigravity architecture, third-party shutdown reports,
  package mirrors, and post-cutoff releases.

## 1. Identity and pinned snapshot {#identity-snapshot}

**Status:** OBSERVED. **Claim:** {C-001 FACT HIGH; S-001} {C-002 FACT HIGH; S-002,S-003,S-008,S-030}

The inspected source is the official `google-gemini/gemini-cli` repository at
`812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8`, authored
`2026-08-24T18:41:54Z`. The clone was clean, shallow, and had no populated
submodules. The separately pinned stable artifact is
`@google/gemini-cli@0.56.0`, published to npm at `2026-08-19T19:29:01.177Z`,
with integrity
`sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw==`.
Its 20,703,551-byte tarball reproduces npm SHA-1
`b5cd36013cb4b263e50da0337ac3a2a00571bd0c`, and the executable reports
`0.56.0`. The official GitHub release was published at
`2026-08-19T19:29:38Z`. The source snapshot is newer than stable and is not
asserted to be stable's source. Platform assumptions are Node >=20; the bounded
probe used Node `v24.18.0` on Darwin arm64. **Boundary:** source findings are at
the repository commit; runtime findings are only for the stable npm bytes.
**Unknown:** artifact-wide source identity is C-003, not inferred from version.

## 2. Provenance and license {#provenance-license}

**Status:** PARTIAL. **Claims:** {C-003 UNKNOWN N/A; S-002,S-004,S-005,S-006,S-007} {C-004 FACT HIGH; S-003,S-009}

Google maintains the upstream repository and publishes the npm package. Both
repository license text and package metadata identify Apache License 2.0; this
does not clear dependency licenses, notices, trademarks, or redistribution of
Google service branding. No fork lineage was found in the bounded official
metadata. The package provenance is contradictory: tag `v0.56.0` and one bundled
CLI marker resolve to `b6e23a7dc29eb15fede4bbe646d91869e948b45a`, while
bundled core markers contain `8f0576950`, which the official commit API resolved
to `8f05769501133dc04797578dfb7a9f445d10e0db` (`chore(release):
v0.56.0-preview.1`). npm supplies no `gitHead`. A stale generated core output is
plausible, but package-wide provenance remains **UNKNOWN**. **Boundary:** exact
tarball only; no inference to binaries or sibling packages. **Unknown:** C-003.

## 3. Repository and package map {#repository-package-map}

**Status:** OBSERVED. **Claim:** {C-005 FACT HIGH; S-010}

The TypeScript ESM monorepo declares `packages/*` workspaces and composes these
bounded nodes:

```text
package.json                 private build/release composition root
packages/cli/                terminal UI, headless CLI, ACP client
packages/core/               loop, providers, tools, policy, state, telemetry
packages/a2a-server/         Express/A2A server executable
packages/sdk/                embeddable agent/tool API
packages/devtools/           WebSocket-backed development UI package
packages/vscode-ide-companion/ VS Code extension and MCP-facing IDE server
packages/test-utils/         test-only helpers
```

The root production bundle is `bundle/gemini.js`; generated bundle bytes are
package output, while `*.test.ts`, `integration-tests/`, `memory-tests/`, and
`perf-tests/` are qualification surfaces, not production reachability evidence.
CLI, A2A, SDK, devtools, and VS Code depend toward core or protocol SDKs; the
root scripts compose them. **Boundary:** package roles derive from pinned
manifests and paths, not runtime activation. **Unknown:** private/public API
stability beyond package metadata is not guaranteed.

## 4. Executable entrypoints {#executable-entrypoints}

**Status:** OBSERVED. **Claim:** {C-006 FACT HIGH; S-010,S-011,S-031}

`gemini` starts at `bundle/gemini.js`; source `packages/cli/index.ts` may spawn a
memory-sized child, then imports `main`. `main` parses settings/arguments,
optionally creates a worktree or relaunches in a sandbox, initializes storage,
then dispatches ACP, interactive React/Ink UI, or `runNonInteractive`. The
monorepo also declares `gemini-cli-a2a-server`, SDK library, devtools export, and
VS Code activation surfaces. There is no separately claimed always-on daemon;
the lightweight parent is a lifecycle owner for the CLI child, not a network
service. **Invocation/config:** CLI flags and settings select modes; A2A has its
own executable. **Failure:** fatal auth/input and child startup use nonzero exit
paths. **Unknown:** non-CLI entrypoints were not executed.

## 5. Control and data flow {#control-data-flow}

**Status:** OBSERVED STATICALLY. **Claim:** {C-007 FACT MEDIUM; S-011,S-012,S-014,S-016}

Representative headless trace: user/stdin text -> CLI config/auth ->
`GeminiClient.sendMessageStream` -> context management/token preflight/model
routing -> `Turn.run` -> provider `generateContentStream` -> typed content,
thought, citation, finish, or tool-call events -> scheduler validation, hooks,
policy/confirmation -> tool execution -> tool response returned to the model ->
formatter/stdout and recording/telemetry. Control originates at the operator;
model output may request but does not itself authorize tools. Data crosses the
workspace, provider network, subprocess/MCP, and persistence boundaries.
`AbortSignal` moves from CLI/client through turn and scheduler; structured errors
and cancellation events return in the opposite direction. **Unknown:** the full
trace was not executed because that requires credentials/network (C-013).

| Boundary | Producer -> consumer | Payload/protocol | Lifecycle/authority | Side effect/failure |
| --- | --- | --- | --- | --- |
| Operator | terminal -> CLI | argv, stdin, settings | operator starts/cancels | config and storage I/O; fatal diagnostics |
| Model | client -> provider -> turn | `GenerateContentParameters`, async chunks | provider generates; no tool authority | network, quota, malformed stream |
| Tool | turn -> scheduler -> invocation | `FunctionCall`, JSON schema, `ToolResult` | policy/operator authorizes | files/process/network; denial/error |
| State | loop -> recording/storage | JSONL records, snapshots | session owner | local writes; ENOSPC/corruption |
| Evidence | runtime -> exporters | logs, metrics, traces | configuration enables export | file/OTLP/GCP; flush/export failure |

## 6. Module and extension boundaries {#module-extension-boundaries}

**Status:** PARTIAL. **Claims:** {C-008 FACT MEDIUM; S-010,S-026} {C-009 UNKNOWN N/A; S-026}

Core owns loop/provider/tool/state primitives; CLI owns operator presentation;
A2A, SDK, devtools, and VS Code adapt other consumers. Official extension docs
package prompts, MCP servers, custom commands, themes, hooks, subagents, and
skills. MCP discovery creates namespaced tool declarations; hooks are synchronous
loop interception points; skills use discovery then consented activation. These
surfaces can inject context, register executable tools, or run scripts and thus
cross authority boundaries. **Discovery/registration:** installed extension and
configured MCP/skill locations. **Ordering:** built-in/discovered/MCP tool sort is
defined, but a complete cross-extension ordering, unload lifecycle, compatibility
versioning, and stability guarantee was not established. **Unknown:** C-009.

## 7. Agent interface {#agent-interface}

**Status:** OBSERVED STATICALLY. **Claim:** {C-010 FACT HIGH; S-015}

`AgentTool` accepts required `agent_name` and `prompt`, resolves a registered
definition, maps the input schema, and chooses local, local-session, remote, or
remote-session invocation. A local executor derives a subagent message bus,
creates isolated tool/prompt/resource registries, prevents nested agent-tool
recursion, records parent/session IDs, and combines caller cancellation with an
internal deadline. It returns result, termination reason, turn count, and
duration. Remote invocation uses A2A, keeps context/task IDs, and currently asks
for confirmation. **Authority:** child tools remain scheduler/policy mediated;
the model cannot expand its own registry. **Failures:** missing agent/schema,
timeout, max turns, protocol violation, remote auth, and abort. **Unknown:**
remote A2A execution was not exercised.

## 8. Tool interface {#tool-interface}

**Status:** OBSERVED STATICALLY. **Claim:** {C-011 FACT HIGH; S-013,S-014}

Tools expose an `@google/genai` `FunctionDeclaration`, JSON parameter schema,
kind/read-only metadata, `build`, confirmation, locations, execution, and
structured result/error fields. `BaseDeclarativeTool` validates model-supplied
arguments before invocation. The scheduler batches independent calls, validates
hooks and policy, resolves confirmation, propagates `AbortSignal`, and executes
ready calls concurrently. `wait_for_previous` lets a model request a dependency
barrier. Tool output is untrusted model context, not authority. **Side effects:**
tool-specific file/process/network actions occur only in `execute`; cancellation,
denial, invalid params, and execution failures are mapped to terminal call
states. **Unknown:** malformed/oversized dynamic boundaries were not run.

## 9. Provider interface {#provider-interface}

**Status:** PARTIAL. **Claims:** {C-012 FACT HIGH; S-016} {C-013 UNKNOWN N/A; S-016,S-028} {C-027 FACT HIGH; S-028,S-032}

`ContentGenerator` defines generate, streaming, count-token, and embedding calls.
Authentication selection includes Code Assist OAuth/ADC, Gemini API key, Vertex
AI, and a configurable Gateway. OAuth/ADC routes through Code Assist; API-key,
Vertex, and Gateway routes instantiate `GoogleGenAI`, with headers, endpoint,
proxy, and Vertex routing adaptation. Logs wrap providers; optional response
recording wraps the generator. Errors, quota/fallback, usage metadata, and
telemetry return through the client/turn boundary.

Google's official deprecation page says that from 2026-06-18 the Individuals,
Google AI Pro, and Google AI Ultra tiers stopped serving Gemini CLI requests and
Login with Google no longer works for them; Standard and Enterprise remain
unchanged, and affected consumers are directed to Antigravity CLI. The pinned
README still advertises consumer OAuth/free tier, demonstrating documentation
drift, not current availability. No authenticated provider call was made, so
endpoint behavior for any particular account is not independently measured.
**Unknown:** C-013.

## 10. Model interface {#model-interface}

**Status:** OBSERVED STATICALLY. **Claim:** {C-014 FACT MEDIUM; S-012,S-016}

Model selection resolves configured aliases, routing decisions, availability
fallbacks, and per-model tool descriptions before a turn. Streaming yields
content, thought, citation, model-info, retry, finish/usage, overflow, invalid
stream, block, and cancellation events. Context limit checks combine a model
token limit with prior prompt count and request estimation. Structured output is
used by tools/subagents; function calls are converted to scheduler requests.
**Fallback:** config can register runtime model overrides after failure.
**Unknown:** capability negotiation and provider-advertised limits were not
observed live; model-specific assumptions remain snapshot-bounded source intent.

## 11. Context interface {#context-interface}

**Status:** OBSERVED STATICALLY. **Claim:** {C-015 FACT HIGH; S-012,S-017,S-018}

Context is assembled from global, extension, project, user-project memory, MCP
instructions, conversation history, hooks, and the active request. Project
memory is withheld for untrusted folders. `GEMINI.md` variants are discovered
root-to-leaf within trusted/git ceilings, deduplicated by file identity, wrapped
with source-path delimiters, and JIT-loaded for accessed subdirectories.
Compaction triggers around a configurable token fraction, truncates to budget,
summarizes older turns, preserves recent history, verifies token reduction, and
records failure/no-op states. Instruction-like repository text remains data
within this research; in the target, project memory and hooks intentionally
influence prompts, so trust gating and provenance delimiters are important but
not a complete prompt-injection isolation proof. **Unknown:** no adversarial
contamination run was authorized.

## 12. State, persistence, and restart {#state-persistence-restart}

**Status:** OBSERVED STATICALLY. **Claim:** {C-016 FACT HIGH; S-019}

Global settings, policies, skills, tokens, project registry, and temp roots live
under `.gemini`; project/session identity keys chat paths. Main and subagent
conversation state is append-oriented JSONL with metadata, messages, tools,
thoughts, token summaries, and optional memory scratchpad. Resume can migrate
legacy JSON; corrupt/unreadable resumed state falls back to supplied in-memory
data and an atomic temp-file/rename rewrite that preserves old bytes where
possible. Session deletion also removes associated artifacts. Shadow-git
checkpointing is optional and separate from normal conversation resume.
**Crash/transactions:** individual rewrites are atomic by rename, but no
whole-session transaction or crash-injection result is claimed. **Unknown:**
crash/restart probe is included in C-036.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

**Status:** PARTIAL. **Claim:** {C-017 FACT MEDIUM; S-014,S-015,S-020}

The scheduler queues overlapping requests and executes contiguous independent
tool calls with `Promise.all`; `wait_for_previous` creates ordering. Subagents
get derived message buses, registries, prompt IDs, parent correlation, deadlines,
and nested recording paths. Experimental `--worktree` setup creates/switches to
a Git worktree before config loading, marks relaunch handling in the environment,
and leaves worktrees intact at exit for manual cleanup. These mechanisms reduce
file collisions but share process-level config/services and repository history;
they are not tenant isolation. **Locks/collisions/determinism:** no two-session
collision run was performed, so race behavior remains covered by C-036.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

**Status:** PARTIAL. **Claims:** {C-018 FACT HIGH; S-014,S-021,S-022} {C-019 UNKNOWN N/A; S-021,S-022}

| Actor | Default authority at inspected source | Enforcement boundary |
| --- | --- | --- |
| Operator/admin | choose auth, mode, policy, sandbox, extensions | CLI/settings and policy tiers |
| Model | request declared tools/subagents | schema + scheduler; no direct grant |
| Policy/hooks/checkers | allow, deny, ask, modify/block | before scheduler execution |
| Tool | declared side effect after authorization | invocation plus optional sandbox |
| Provider/MCP | return untrusted data and remote results | adapters; confirmation/policy |

Interactive default is ask-user; non-interactive default is deny; YOLO permits
unmatched calls. Deny is terminal, shell parsing/redirection/danger heuristics can
downgrade to ask, outside-workspace additional paths are downgraded, and checker
failure denies. Full-process sandbox options include macOS Seatbelt and
containers; tool sandbox code models filesystem/network grants, realpath/symlink
expansion, forbidden paths, protected governance files, secret masking, and Git
worktree metadata. Sandboxing is configurable, not an unconditional default
enforcement claim. **Unknown:** the policy/sandbox implementation was not
dynamically challenged for bypass or escape (C-019).

## 15. Evidence and observability {#evidence-observability}

**Status:** OBSERVED STATICALLY. **Claim:** {C-020 FACT HIGH; S-012,S-014,S-023}

The runtime has correlated session/prompt/call/scheduler/parent IDs, structured
stream events, tool-call events, JSONL conversations, and OpenTelemetry logs,
metrics, and traces. Exporters include OTLP HTTP/gRPC, Google Cloud, local file,
and console; flush and shutdown paths exist. API response telemetry includes
model, status, duration, input/output/cache/thought/tool/total tokens; prompt
logging is separately configurable. Tool execution and policy outcomes are
logged, but local files are mutable and no tamper-evident receipt or independent
audit sink was found. **Redaction:** telemetry configuration can omit prompts,
but comprehensive secret-redaction effectiveness was not dynamically tested.
**Unknown:** evidence-loss/forgery probe is C-036.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

**Status:** PARTIAL. **Claims:** {C-021 FACT MEDIUM; S-012,S-024} {C-022 UNKNOWN N/A; S-012,S-023,S-024,S-025}

The launcher can raise V8 heap allowance toward half of host memory; subagents
have turn/time limits; context uses local text/tool heuristics and provider
`countTokens` for media, with fallback estimates. Finished responses carry
provider usage metadata, which feeds context ground truth and telemetry. Retry
events include attempts/delay/model, and billing telemetry can report credits.
No universal CPU/process/network hard budget was established, local estimates
can disagree with provider totals, and exact monetary attribution across cache,
retry, fallback, tools, and subagents was not reconciled against a provider bill.
**Unknown:** C-022.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

**Status:** OBSERVED STATICALLY. **Claim:** {C-023 FACT HIGH; S-012,S-014,S-015,S-025}

Failures are classified across invalid tool params, policy denial, confirmation
cancel, provider/auth/quota/network/invalid stream, loop/max turns, timeout, and
persistence errors. `AbortSignal` flows through client, turn, scheduler, tool,
and subagent deadline composition; queued calls are removed and active batches
are cancelled. Retry recognizes network codes, 429/499/5xx, honors bounded
attempts and server delay, applies exponential backoff with jitter, and can
switch model through fallback. HTTP 400 is not retried. Idempotency is not a
generic tool contract, so retries/fallbacks around external side effects require
tool-specific reasoning. **Unknown:** induced partial failure and duplicate
delivery were not run.

## 18. Install, update, and release {#install-update-release}

**Status:** PARTIAL. **Claim:** {C-024 FACT HIGH; S-002,S-003,S-006,S-008,S-010,S-026}

Official install paths include npm/npx, Homebrew, MacPorts, source, and sandbox
images. Stable, preview, and nightly channels are promoted through documented
workflows; npm is the channel version source of truth, cross-checked against Git
tags and GitHub releases. Rollback/rollforward changes dist-tags. The stable npm
tarball has registry SHA-1/SHA-512 and an npm signature record, and the GitHub
release assets have digests. This dossier independently recomputed tarball
integrity but did not verify the registry signature chain, reproduce the build,
or run rollback/migration. Preview `0.57.0-preview.1` published
2026-08-24T23:23:38.130Z is within cutoff but not stable; nightly
`0.56.0-nightly.20260825.g812f7a2bc` is post-cutoff and excluded. Artifact-source
traceability remains C-003.

## 19. Tests and qualification {#tests-qualification}

**Status:** PARTIAL. **Claim:** {C-025 FACT HIGH; S-010,S-026,S-030,S-031}

The repository defines workspace unit tests, script tests, no-sandbox and
Docker/Podman integration tests, memory/performance suites, evals, lint,
typecheck, and bundle/installation smoke tests. CI spans Node 20/22/24 and Linux;
macOS jobs are present but marked continue-on-error in the inspected workflow.
Release verification targets Ubuntu, macOS, and Windows. This research did not
run upstream suites; it only ran stable artifact version/help smoke probes.
Passing upstream tests would qualify their declared paths, not live provider,
sandbox escape resistance, provenance, or consumer service availability.
**Unknown:** dynamic negative coverage is C-036.

## 20. Security {#security}

**Status:** PARTIAL. **Claim:** {C-026 FACT MEDIUM; S-013,S-021,S-022,S-027}

Security-relevant boundaries include untrusted workspace/context, model tool
arguments, hooks/extensions/skills, MCP/A2A subprocesses and networks,
credentials, filesystem paths, and package supply chain. Static controls include
schema validation before tool construction, trusted-folder gating, policy and
approval, shell parsing, environment sanitization, realpath-aware sandbox path
resolution, governance/secret masking, and optional process/container isolation.
Hooks and trusted MCP configurations can execute code with user authority;
YOLO explicitly broadens authority. The official vulnerability intake is
`g.co/vulnz`, coordinated through GitHub advisories. No penetration test,
advisory census, dependency audit, symlink exploit, or security acceptance was
performed. **Unknown:** actual enforcement is C-019/C-036.

## 21. Strengths {#strengths}

**Status:** INTERPRETATION. **Claim:** {C-028 INFERENCE MEDIUM; S-011,S-012,S-013,S-014,S-017,S-019,S-023}

Within this static snapshot, a notable strength is a comparatively explicit set
of typed seams: stream events, provider adapter, tool declaration/invocation,
policy-before-execution scheduler, context provenance delimiters, resumable
JSONL, and correlated telemetry. This can make control and evidence paths easier
to inspect than a monolithic loop. The inference assumes the composition paths
shown are production-reachable; an alternative is that feature breadth and
generated duplication increase operational complexity. This is not an adoption
recommendation.

## 22. Liabilities {#liabilities}

**Status:** INTERPRETATION. **Claim:** {C-029 INFERENCE HIGH; S-002,S-004,S-005,S-006,S-007,S-028,S-029,S-032}

Three bounded liabilities affect comparison: (1) stable-package source
provenance is mixed; (2) official consumer serving status conflicts with the
pinned README's OAuth/free-tier instructions; and (3) even version/help startup
attempts mutable home-directory cleanup/registry writes. Triggers are artifact
audit, consumer onboarding, and read-only automation respectively; consequences
are unverifiable source attribution, failed authentication expectations, and
surprising startup side effects. Mitigations are pin/hash bytes, follow the
deprecation page and account tier, and provide a disposable writable home.
Alternative explanation for mixed markers is harmless stale generated output,
but that remains unproved.

## 23. Transferable patterns {#transferable-patterns}

**Status:** RESEARCH CANDIDATES. **Claims:** {C-030 INFERENCE MEDIUM; S-012,S-013,S-014,S-023} {C-031 INFERENCE MEDIUM; S-013,S-014,S-021,S-022}

1. **Typed event/tool seam — `CANDIDATE`.** Problem: keep model streaming,
   authorization, execution, UI, and evidence separable. Minimal mechanism:
   typed stream events plus validate/build/confirm/execute tool lifecycle and
   correlation IDs. Prerequisites: exhaustive state handling and trusted
   serialization. Preserved boundary: model requests are data, scheduler owns
   execution. Adaptation cost is medium; static evidence does not prove runtime
   completeness.
2. **Policy-before-side-effect with downgrade semantics — `CONDITIONAL`.**
   Problem: compose admin/user defaults, per-tool confirmation, and sandbox
   grants. Minimal mechanism: deny/ask/allow ordering, fail-closed parsing/checker
   behavior, path canonicalization, and explicit permissive mode. Prerequisite:
   independent bypass tests and no implicit YOLO. Preserved boundary: authority
   remains outside model output. Adaptation cost/risk is high because policy and
   sandbox must agree across platforms.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

**Status:** BOUNDED REJECTIONS. **Claims:** {C-032 INFERENCE HIGH; S-028} {C-033 INFERENCE HIGH; S-028}

- **Authenticated/cost-bearing live inference — `CURIOSITY_NO_GO`.** It would
  require credentials, network authority, quota/cost, and potentially personal
  data merely to refine provider behavior. Failure modes include secret exposure
  and spend. Reopen only with disposable credentials, explicit network/cost
  authorization, and a provider-specific test plan.
- **Broader Antigravity reverse engineering — `CURIOSITY_NO_GO`.** The roster
  bounds this target to Gemini CLI and a documented successor boundary;
  Antigravity is separately deferred. Expanding would violate target ownership
  and dilute the architecture decision. Reopen only through a separately owned
  dossier.
- **Destructive/concurrent escape, crash, evidence-forgery, and package-mirror
  threads — `CURIOSITY_NO_GO`.** They exceeded safe-isolation or provenance
  value for this pass. Reopen only in disposable VMs with explicit adversarial
  authority. Third-party shutdown claims and workflow-log archaeology were also
  rejected because official first-party status and local immutable artifacts
  were preferable.

## 25. Adversarial probes {#adversarial-probes}

**Status:** PARTIAL. **Claims:** {C-034 FACT HIGH; S-029,S-030} {C-035 FACT HIGH; S-031} {C-036 UNKNOWN N/A; S-013,S-014,S-019,S-021,S-022,S-024,S-025,S-029,S-031}

Expected behavior was fixed before probing. Target execution used extracted npm
bytes, no install scripts, no secrets, no repository write access, a disposable
home/work directory, and denied network. `NOT_RUN_UNSAFE` is not a pass.

| Probe | Expected safe behavior | Result | Actual observation | Environment | Claims | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 startup/no-op | version/help should disclose required startup writes and not need network | FAIL | denied-write runs still returned output but emitted `EPERM` for `.gemini`; writable-home version created `.gemini` plus two empty registry temp files | sandbox-exec, network denied, Darwin arm64, Node 24.18.0 | C-034,C-035 | S-029,S-030,S-031 |
| P-02 denial/bypass | every consequential path remains denied without approval | NOT_RUN_UNSAFE | static policy has deny/ask enforcement; alternate live side-effect paths were not invoked | static + no credentials | C-019,C-036 | S-014,S-021,S-022 |
| P-03 malformed/oversized | reject before side effects with bounded diagnostic | INCONCLUSIVE | schema validation is before build, but no target process received malformed/oversized calls | static | C-011,C-036 | S-013 |
| P-04 cancellation/timeout | abort queue, stream, and side effect; clean final state | INCONCLUSIVE | propagation and queue cancellation traced; no in-flight side effect interrupted | static | C-023,C-036 | S-012,S-014 |
| P-05 retry/duplicate/partial | bounded retry; no duplicate unsafe write | INCONCLUSIVE | backoff/fallback traced; generic tool idempotency not established | static | C-023,C-036 | S-025 |
| P-06 collision/isolation | separate sessions/worktrees do not bleed | NOT_RUN_UNSAFE | two-session mutation was outside authority | static | C-017,C-036 | S-015,S-020 |
| P-07 crash/restart | recover or preserve corrupt bytes without silent loss | NOT_RUN_UNSAFE | recovery code traced; process interruption would mutate disposable state and was not run | static | C-016,C-036 | S-019 |
| P-08 provider unavailable | preserve auth/rate/stream errors and bound fallback | NOT_RUN_UNSAFE | network and credentials intentionally denied | static | C-013,C-036 | S-016,S-025 |
| P-09 instruction injection | untrusted data cannot change execution/research authority | INCONCLUSIVE | research ignored embedded instructions; target context intentionally imports project/hook data, but no exploit was attempted | static | C-015,C-036 | S-017 |
| P-10 filesystem abuse | canonicalize and deny escapes/symlinks | NOT_RUN_UNSAFE | realpath-aware design traced; exploit challenge requires dedicated sandbox authorization | static | C-019,C-036 | S-021,S-022 |
| P-11 cost disagreement | preserve estimate/provider/retry discrepancies and enforce budget | NOT_RUN_UNSAFE | no bill or paid request; exact cost remains unknown | static | C-022,C-036 | S-012,S-024,S-025 |
| P-12 pin/rollback | resolve immutable bytes and verify rollback | INCONCLUSIVE | package digest/version reproduced; source marker contradiction and rollback remain unresolved/unrun | local artifact | C-002,C-003,C-036 | S-002,S-003,S-004,S-005,S-006 |
| P-13 absence/disabled | challenge claimed disabled service through all bounded paths | INCONCLUSIVE | official consumer serving stop conflicts with static OAuth path/README; no account used | official docs + static | C-027,C-036 | S-028,S-032 |
| P-14 evidence forgery/loss | denied/failed action remains correlated and unspoofable | NOT_RUN_UNSAFE | schemas/log paths traced; spoofing and tamper challenge not authorized | static | C-020,C-036 | S-014,S-023 |

Retained negative result: the first sandbox command could not locate Node and
returned `sandbox-exec: execvp() of 'node' failed: No such file or directory`;
the repeat used Node's absolute path. This is an environment failure, not target
evidence.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "The inspected official repository snapshot is commit 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8, authored on 2026-08-24, with a clean shallow checkout and no populated submodules."
  classification: FACT
  confidence: HIGH
  scope: "google-gemini/gemini-cli source checkout; excludes later commits and package identity"
  source_ids: [S-001]
  fact_dependencies: []
  method: "Recorded remote, HEAD, author timestamp, porcelain status, shallow marker, and submodule output."
  counterevidence: "none found in pinned checkout metadata"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: identity-snapshot
  statement: "The pinned stable npm artifact is @google/gemini-cli@0.56.0 with the recorded SHA-512 integrity, and its extracted executable reports 0.56.0."
  classification: FACT
  confidence: HIGH
  scope: "npm tarball retrieved 2026-08-24; Darwin arm64 version probe; excludes sibling packages"
  source_ids: [S-002, S-003, S-008, S-030]
  fact_dependencies: []
  method: "Compared npm packument, recomputed SHA-1/SHA-512 and size, inspected manifest, and ran --version without network."
  counterevidence: "repository HEAD manifest is a nightly version and is explicitly a different snapshot"
  adversarial_status: SUPPORTED
- claim_id: C-003
  section: provenance-license
  statement: "The complete source commit corresponding to every bundled component in @google/gemini-cli@0.56.0 is unknown because npm omits gitHead and the tarball contains conflicting generated commit markers."
  classification: UNKNOWN
  confidence: N/A
  scope: "@google/gemini-cli@0.56.0 tarball; package-wide provenance only"
  source_ids: [S-002, S-004, S-005, S-006, S-007]
  fact_dependencies: []
  method: "attempted_methods=npm metadata inspection, tarball-wide marker search, official tag resolution, official short-commit resolution; blocker=npm has no gitHead and CLI/core generated markers resolve to different commits; impact=artifact-to-source findings cannot be attributed package-wide; available_evidence=S-002,S-004,S-005,S-006,S-007; next_probe=reproduce the official release build at b6e23a7dc29eb15fede4bbe646d91869e948b45a and byte-diff generated bundles"
  counterevidence: "S-004/S-006 indicate the stable tag while S-005/S-007 indicate preview.1 core output"
  adversarial_status: CHALLENGED
- claim_id: C-004
  section: provenance-license
  statement: "The repository license text and stable package manifest identify Apache License 2.0."
  classification: FACT
  confidence: HIGH
  scope: "first-party repository and CLI package; excludes dependency, trademark, and service terms"
  source_ids: [S-003, S-009]
  fact_dependencies: []
  method: "Inspected LICENSE and extracted package manifest independently."
  counterevidence: "none found in those two artifacts"
  adversarial_status: SUPPORTED
- claim_id: C-005
  section: repository-package-map
  statement: "The pinned source is a TypeScript ESM workspaces monorepo whose production surfaces include CLI, core, A2A server, SDK, devtools, and VS Code companion packages."
  classification: FACT
  confidence: HIGH
  scope: "pinned manifests and tree; roles are static, not runtime activation"
  source_ids: [S-010]
  fact_dependencies: []
  method: "Inspected root and package manifests plus package tree."
  counterevidence: "none found in packages/* manifests"
  adversarial_status: SUPPORTED
- claim_id: C-006
  section: executable-entrypoints
  statement: "The CLI composition path can dispatch ACP, interactive Ink UI, or headless execution after shared startup and optional worktree/sandbox setup."
  classification: FACT
  confidence: HIGH
  scope: "pinned source entrypoint and stable help surface; excludes execution of A2A/SDK/VS Code"
  source_ids: [S-010, S-011, S-031]
  fact_dependencies: []
  method: "Traced package bin through index.ts and gemini.tsx dispatch and compared stable --help."
  counterevidence: "none found in traced composition path"
  adversarial_status: SUPPORTED
- claim_id: C-007
  section: control-data-flow
  statement: "The static headless path carries operator input through context/model/provider streaming and mediates model-requested tools through scheduler policy before returning output and evidence."
  classification: FACT
  confidence: MEDIUM
  scope: "pinned source; static reachability only; no authenticated end-to-end execution"
  source_ids: [S-011, S-012, S-014, S-016]
  fact_dependencies: []
  method: "Traced runNonInteractive dispatch, client/turn, provider, and scheduler symbols."
  counterevidence: "no dynamic trace; C-013 limits runtime confidence"
  adversarial_status: NOT_PROBED
- claim_id: C-008
  section: module-extension-boundaries
  statement: "The documented extension surface can package prompts, MCP servers, commands, themes, hooks, subagents, and skills around the core runtime."
  classification: FACT
  confidence: MEDIUM
  scope: "pinned first-party documentation and manifests; documented capability, not executed extension"
  source_ids: [S-010, S-026]
  fact_dependencies: []
  method: "Inspected official extension overview and package composition."
  counterevidence: "none found in pinned extension overview"
  adversarial_status: NOT_PROBED
- claim_id: C-009
  section: module-extension-boundaries
  statement: "A complete compatibility, ordering, unload, and stability contract across all extension types is unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "pinned extension/hook/MCP/skill documentation and production source"
  source_ids: [S-026]
  fact_dependencies: []
  method: "attempted_methods=searched pinned extension documentation and loaders for version, ordering, unload, and stability guarantees; blocker=no single complete cross-surface lifecycle contract was located; impact=extension portability and hot-reload comparison remain partial; available_evidence=S-026; next_probe=run two conflicting disposable extensions and inspect registration, precedence, disable, reload, and version mismatch behavior"
  counterevidence: "tool sorting and some tier precedence exist but do not answer the complete contract"
  adversarial_status: CHALLENGED
- claim_id: C-010
  section: agent-interface
  statement: "AgentTool delegates validated named prompts to local or remote agents, while local executors derive child registries, correlation, cancellation, and time/turn limits."
  classification: FACT
  confidence: HIGH
  scope: "pinned local/remote agent source; remote runtime unexecuted"
  source_ids: [S-015]
  fact_dependencies: []
  method: "Traced AgentTool and LocalAgentExecutor construction and run lifecycle."
  counterevidence: "none found in traced source"
  adversarial_status: SUPPORTED
- claim_id: C-011
  section: tool-interface
  statement: "Tools use FunctionDeclaration schemas, validate before invocation, expose confirmation and AbortSignal, and are policy-checked before concurrent scheduler execution."
  classification: FACT
  confidence: HIGH
  scope: "pinned core tool/scheduler source; tool-specific side effects not executed"
  source_ids: [S-013, S-014]
  fact_dependencies: []
  method: "Traced DeclarativeTool build/validation and Scheduler validation/execution states."
  counterevidence: "none found in traced source"
  adversarial_status: SUPPORTED
- claim_id: C-012
  section: provider-interface
  statement: "The provider adapter supports Code Assist OAuth/ADC, Gemini API key, Vertex AI, and Gateway routes behind a common streaming/content/token interface."
  classification: FACT
  confidence: HIGH
  scope: "pinned contentGenerator source; configuration/reachability only"
  source_ids: [S-016]
  fact_dependencies: []
  method: "Inspected AuthType, config creation, route selection, and GoogleGenAI construction."
  counterevidence: "none found in provider factory"
  adversarial_status: SUPPORTED
- claim_id: C-013
  section: provider-interface
  statement: "Live provider behavior, account-specific availability, quota, and transport errors are unknown for this research environment."
  classification: UNKNOWN
  confidence: N/A
  scope: "all configured providers; excludes static interface and official service-status claims"
  source_ids: [S-016, S-028]
  fact_dependencies: []
  method: "attempted_methods=static provider trace and official service-status retrieval; blocker=no credentials, network authority, or cost authorization; impact=runtime latency, fallback, quotas, and account-specific reachability cannot be compared; available_evidence=S-016,S-028; next_probe=use disposable tier-specific accounts in an authorized network-denied/then-allowlisted matrix with spend caps"
  counterevidence: "official status establishes tier policy but is not an independent account probe"
  adversarial_status: NOT_PROBED
- claim_id: C-014
  section: model-interface
  statement: "The client statically implements model routing and fallback, model-specific tool declarations, streaming events, token-limit checks, and usage capture."
  classification: FACT
  confidence: MEDIUM
  scope: "pinned client/turn/provider source; no live capability negotiation"
  source_ids: [S-012, S-016]
  fact_dependencies: []
  method: "Inspected model selection, event union, turn streaming, and usage paths."
  counterevidence: "live model limits and responses were not observed"
  adversarial_status: NOT_PROBED
- claim_id: C-015
  section: context-interface
  statement: "The runtime statically assembles trusted hierarchical and JIT memory with path provenance and compacts history using token thresholds, truncation, summarization, and result checks."
  classification: FACT
  confidence: HIGH
  scope: "pinned memory/context source; no injection challenge"
  source_ids: [S-012, S-017, S-018]
  fact_dependencies: []
  method: "Traced MemoryContextManager, discovery delimiters/JIT ceiling, and ChatCompressionService."
  counterevidence: "no dynamic contamination test"
  adversarial_status: SUPPORTED
- claim_id: C-016
  section: state-persistence-restart
  statement: "Conversation persistence uses project/session-keyed JSONL with resume migration, subagent nesting, deletion, and atomic recovery rewrite that attempts to preserve unreadable bytes."
  classification: FACT
  confidence: HIGH
  scope: "pinned ChatRecordingService; static persistence behavior"
  source_ids: [S-019]
  fact_dependencies: []
  method: "Inspected initialize, legacy migration, rewrite, delete, and resume paths."
  counterevidence: "crash timing was not dynamically challenged"
  adversarial_status: NOT_PROBED
- claim_id: C-017
  section: concurrency-worktree-isolation
  statement: "The runtime has parallel tool batches, child-agent registries and correlation, and optional per-session Git worktree setup, but these are not tenant isolation."
  classification: FACT
  confidence: MEDIUM
  scope: "pinned source; no collision test; tenant isolation explicitly excluded"
  source_ids: [S-014, S-015, S-020]
  fact_dependencies: []
  method: "Traced scheduler Promise.all, child execution context, and worktree setup."
  counterevidence: "shared process config/services remain"
  adversarial_status: NOT_PROBED
- claim_id: C-018
  section: permissions-authority-sandbox
  statement: "Static enforcement orders hooks and policy before tools and provides configurable approval modes plus sandbox path/network/environment controls."
  classification: FACT
  confidence: HIGH
  scope: "pinned scheduler, policy, and sandbox source/documentation; structure not escape resistance"
  source_ids: [S-014, S-021, S-022]
  fact_dependencies: []
  method: "Traced scheduler validation, policy decisions, and documented sandbox implementations."
  counterevidence: "YOLO intentionally allows unmatched calls and sandboxing is configurable"
  adversarial_status: SUPPORTED
- claim_id: C-019
  section: permissions-authority-sandbox
  statement: "Actual policy-bypass and sandbox-escape resistance is unknown across supported platforms."
  classification: UNKNOWN
  confidence: N/A
  scope: "stable npm/runtime and pinned source across macOS/Linux/Windows/container modes"
  source_ids: [S-021, S-022]
  fact_dependencies: []
  method: "attempted_methods=static deny, parsing, realpath, secret, and platform sandbox review; blocker=no explicit exploitation authority or disposable cross-platform VM matrix; impact=security enforcement cannot be accepted from source intent; available_evidence=S-021,S-022; next_probe=authorized traversal, symlink, wrapper, environment, network, and alternate-entrypoint suite in disposable VMs"
  counterevidence: "Noop/configurable modes show that presence of sandbox code is not universal enforcement"
  adversarial_status: CHALLENGED
- claim_id: C-020
  section: evidence-observability
  statement: "The static runtime emits correlated stream/tool/session evidence and can export OpenTelemetry logs, metrics, and traces to file, console, OTLP, or Google Cloud."
  classification: FACT
  confidence: HIGH
  scope: "pinned core/CLI evidence paths; tamper resistance excluded"
  source_ids: [S-012, S-014, S-023]
  fact_dependencies: []
  method: "Inspected event schemas, scheduler call IDs, SDK exporters, flush, and shutdown."
  counterevidence: "local evidence is mutable and exporter loss was not induced"
  adversarial_status: SUPPORTED
- claim_id: C-021
  section: resource-token-cost-accounting
  statement: "The runtime combines local token estimation, provider countTokens for media, provider usage metadata, and configured turn/time/memory limits."
  classification: FACT
  confidence: MEDIUM
  scope: "pinned source; accounting signals rather than monetary reconciliation"
  source_ids: [S-012, S-024]
  fact_dependencies: []
  method: "Inspected token preflight/ground truth and tokenCalculation heuristics/API fallback."
  counterevidence: "estimates can differ from provider usage"
  adversarial_status: NOT_PROBED
- claim_id: C-022
  section: resource-token-cost-accounting
  statement: "Exact cost attribution and enforceable budgets across retries, cache, fallback, tools, and subagents are unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "all providers and runtime surfaces; no paid requests"
  source_ids: [S-012, S-023, S-024, S-025]
  fact_dependencies: []
  method: "attempted_methods=traced usage metadata, token estimators, retry callbacks, and billing telemetry; blocker=no provider invoices or authorized cost-bearing matrix and no universal budget-enforcement path established; impact=cost predictability cannot be compared exactly; available_evidence=S-012,S-023,S-024,S-025; next_probe=reconcile a capped scripted workload against provider usage and invoice exports including retries/cache/subagents"
  counterevidence: "credits and token telemetry report values but do not establish universal cost enforcement"
  adversarial_status: CHALLENGED
- claim_id: C-023
  section: failure-cancellation-retry
  statement: "The source classifies major failures, propagates cancellation, and bounds retry with backoff, jitter, server delay, and model fallback while excluding HTTP 400."
  classification: FACT
  confidence: HIGH
  scope: "pinned client/turn/scheduler/subagent/retry source; no induced external side effect"
  source_ids: [S-012, S-014, S-015, S-025]
  fact_dependencies: []
  method: "Traced error events, queue cancellation, deadline composition, and retry predicate/loop."
  counterevidence: "generic tool idempotency is not established"
  adversarial_status: SUPPORTED
- claim_id: C-024
  section: install-update-release
  statement: "Stable, preview, and nightly release channels, npm/tag/release checks, dist-tag rollback, and artifact digests are documented or observed, but the stable artifact is not reproducibly tied to one source commit."
  classification: FACT
  confidence: HIGH
  scope: "official release docs/metadata and @google/gemini-cli@0.56.0; reproducible build excluded"
  source_ids: [S-002, S-003, S-006, S-008, S-010, S-026]
  fact_dependencies: []
  method: "Compared release documentation/workflows, npm metadata, GitHub release/tag, and local digest."
  counterevidence: "C-003 records the source-marker contradiction"
  adversarial_status: CHALLENGED
- claim_id: C-025
  section: tests-qualification
  statement: "The repository declares layered CI/test/eval/smoke matrices, while this dossier directly qualified only stable version/help startup."
  classification: FACT
  confidence: HIGH
  scope: "pinned scripts/workflows and bounded local probes; upstream suite results not claimed"
  source_ids: [S-010, S-026, S-030, S-031]
  fact_dependencies: []
  method: "Inspected test scripts and CI workflows; ran extracted stable --version and --help."
  counterevidence: "macOS CI is continue-on-error and no upstream test run was performed here"
  adversarial_status: SUPPORTED
- claim_id: C-026
  section: security
  statement: "The source contains layered validation, trust, policy, environment/path, and optional sandbox controls, and Google publishes a vulnerability-reporting path."
  classification: FACT
  confidence: MEDIUM
  scope: "pinned static controls and SECURITY.md; no security acceptance or penetration result"
  source_ids: [S-013, S-021, S-022, S-027]
  fact_dependencies: []
  method: "Inspected pre-execution validation/enforcement structures and security reporting instructions."
  counterevidence: "C-019 and C-036 preserve untested enforcement"
  adversarial_status: NOT_PROBED
- claim_id: C-027
  section: provider-interface
  statement: "Google states that consumer, AI Pro, AI Ultra, and their Login-with-Google Gemini CLI access stopped on 2026-06-18, while Standard and Enterprise access remained unchanged."
  classification: FACT
  confidence: HIGH
  scope: "official service policy as updated 2026-06-23; account-specific behavior not independently tested"
  source_ids: [S-028, S-032]
  fact_dependencies: []
  method: "Retrieved official deprecation page and compared it with the pinned package README."
  counterevidence: "S-032 still advertises consumer OAuth/free tier; treated as stale contradiction"
  adversarial_status: CHALLENGED
- claim_id: C-028
  section: strengths
  statement: "The explicit typed event, tool, policy, context, state, and telemetry seams are a comparative architectural strength within the inspected static snapshot."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "architecture inspectability only; no adoption or runtime quality decision"
  source_ids: [S-011, S-012, S-013, S-014, S-017, S-019, S-023]
  fact_dependencies: [C-006, C-007, C-011, C-015, C-016, C-018, C-020]
  method: "Reasoning chain=separate typed contracts and correlation make control/evidence boundaries directly traceable; assumptions=production composition reaches inspected paths; alternative=surface breadth and generated duplication may offset inspectability."
  counterevidence: "C-003,C-009,C-019,C-036"
  adversarial_status: NOT_PROBED
- claim_id: C-029
  section: liabilities
  statement: "Mixed artifact provenance, stale consumer onboarding text, and startup home-directory writes are material comparison liabilities."
  classification: INFERENCE
  confidence: HIGH
  scope: "stable artifact audit, consumer onboarding, and read-only CLI automation"
  source_ids: [S-002, S-004, S-005, S-006, S-007, S-028, S-029, S-032]
  fact_dependencies: [C-003, C-027, C-034]
  method: "Reasoning chain=contradictory identity blocks source attribution, stale auth text missets operator expectations, and no-op writes violate read-only assumptions; assumptions=these dimensions matter to comparison; alternative=generated marker is stale but harmless."
  counterevidence: "hash pinning and disposable writable HOME mitigate but do not remove the findings"
  adversarial_status: SUPPORTED
- claim_id: C-030
  section: transferable-patterns
  statement: "A typed streaming-event plus validate-build-confirm-execute tool seam is a candidate research pattern for separating model requests from execution authority."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "research candidate only; requires independent implementation and qualification"
  source_ids: [S-012, S-013, S-014, S-023]
  fact_dependencies: [C-007, C-011, C-020]
  method: "Reasoning chain=typed transitions expose authority and evidence points; assumptions=exhaustive handling can be retained; alternative=a smaller loop may be easier to verify."
  counterevidence: "C-036 leaves runtime completeness unknown"
  adversarial_status: NOT_PROBED
- claim_id: C-031
  section: transferable-patterns
  statement: "Policy-before-side-effect with fail-closed downgrade and canonicalized sandbox grants is a conditional research pattern."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "research pattern only; conditional on bypass testing and aligned cross-platform enforcement"
  source_ids: [S-013, S-014, S-021, S-022]
  fact_dependencies: [C-011, C-018]
  method: "Reasoning chain=explicit deny/ask/allow and path grants preserve operator authority; assumptions=policy and sandbox cannot diverge; alternative=capability-based tools could reduce policy complexity."
  counterevidence: "C-019 and YOLO/configurable sandbox modes"
  adversarial_status: CHALLENGED
- claim_id: C-032
  section: rejected-patterns-curiosity-no-go
  statement: "Authenticated or cost-bearing provider execution is CURIOSITY_NO_GO without disposable credentials and explicit network and spend authority."
  classification: INFERENCE
  confidence: HIGH
  scope: "this research session only"
  source_ids: [S-028]
  fact_dependencies: [C-013, C-027]
  method: "Reasoning chain=the marginal runtime evidence would require secrets/cost while official status answers the tier boundary; assumptions=no hidden authorization; alternative=authorized disposable accounts could reopen."
  counterevidence: "none within current authority"
  adversarial_status: NOT_APPLICABLE:unsafe-without-separate-authorization
- claim_id: C-033
  section: rejected-patterns-curiosity-no-go
  statement: "Broader Antigravity architecture research is CURIOSITY_NO_GO because it is outside the assigned Gemini CLI successor boundary."
  classification: INFERENCE
  confidence: HIGH
  scope: "this dossier ownership and roster boundary"
  source_ids: [S-028]
  fact_dependencies: [C-027]
  method: "Reasoning chain=official migration establishes only the successor boundary and the roster defers a standalone Antigravity dossier; assumptions=scope ownership remains unchanged; alternative=a coordinator may assign a separate dossier."
  counterevidence: "none within assigned scope"
  adversarial_status: NOT_APPLICABLE:outside-owned-target
- claim_id: C-034
  section: adversarial-probes
  statement: "Stable --version and --help attempt .gemini startup writes even when their primary output does not require provider access."
  classification: FACT
  confidence: HIGH
  scope: "@google/gemini-cli@0.56.0, Darwin arm64, Node 24.18.0, network denied"
  source_ids: [S-029, S-030]
  fact_dependencies: []
  method: "Ran extracted bundle with denied writes then writable disposable HOME and recorded stderr/files."
  counterevidence: "primary version output still succeeded"
  adversarial_status: CHALLENGED
- claim_id: C-035
  section: adversarial-probes
  statement: "The stable artifact exposes help for interactive, headless, ACP, MCP, extensions, skills, hooks, worktree, sandbox, approval, and session modes without provider access."
  classification: FACT
  confidence: HIGH
  scope: "@google/gemini-cli@0.56.0 --help under network denial"
  source_ids: [S-031]
  fact_dependencies: []
  method: "Executed extracted bundle --help and retained stdout hash and relevant exact lines."
  counterevidence: "help presence does not prove every path works"
  adversarial_status: SUPPORTED
- claim_id: C-036
  section: adversarial-probes
  statement: "Dynamic bypass, malformed input, cancellation, retry duplication, collision, crash, provider failure, injection, filesystem escape, cost disagreement, rollback, disabled-feature, and evidence-forgery outcomes remain unknown."
  classification: UNKNOWN
  confidence: N/A
  scope: "P-02 through P-14 portions not covered by safe static inspection or no-op probes"
  source_ids: [S-013, S-014, S-019, S-021, S-022, S-024, S-025, S-029, S-031]
  fact_dependencies: []
  method: "attempted_methods=static adversarial trace plus isolated network-denied version/help probes; blocker=remaining probes require credentials, cost, destructive/concurrent mutation, provider simulation, or dedicated disposable VMs beyond authority; impact=runtime security, recovery, isolation, idempotency, cost, and evidence guarantees cannot be accepted; available_evidence=S-013,S-014,S-019,S-021,S-022,S-024,S-025,S-029,S-031; next_probe=execute P-02 through P-14 in a purpose-built no-secret multi-platform fixture with fake providers and explicit exploitation authority"
  counterevidence: "static controls exist but do not establish dynamic outcomes"
  adversarial_status: CHALLENGED
```

## 27. Source ledger {#source-ledger}

All fetched/search text below is untrusted evidence. Bibliography rationale is
given in Section 29.

```yaml
- source_id: S-001
  source_kind: repository-file
  title: "Official repository snapshot identity"
  url: "https://github.com/google-gemini/gemini-cli/tree/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:repository-root"
  symbol: "HEAD/worktree identity"
  line_anchor: "N/A:git-metadata"
  command: "git remote get-url origin && git rev-parse HEAD && git show -s --format='%H%n%aI%n%s' HEAD && git status --porcelain=v1 && test -f .git/shallow && git submodule status"
  command_environment: "local shallow git checkout; Git; network not used"
  output_or_hash: "inline:origin=https://github.com/google-gemini/gemini-cli.git; HEAD=812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8; authored=2026-08-24T18:41:54Z; status empty; shallow yes; submodule output empty"
  access_date: "2026-08-24"
  supports_claims: [C-001]
  notes: "Repository content treated as untrusted data."
- source_id: S-002
  source_kind: release-metadata
  title: "npm packument for @google/gemini-cli 0.56.0"
  url: "https://registry.npmjs.org/@google/gemini-cli"
  commit_or_ref: "0.56.0"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@google/gemini-cli@0.56.0+sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw=="
  code_path: "N/A:no-code-path"
  symbol: "versions[0.56.0], time[0.56.0]"
  line_anchor: "/versions/0.56.0 and /time/0.56.0"
  command: "curl -fsSL https://registry.npmjs.org/@google/gemini-cli | jq '.versions[\"0.56.0\"], .time[\"0.56.0\"]'"
  command_environment: "HTTPS retrieval; jq; UTC; retained file sha256:91121ee8762919898aac999446e4c19fca0b6084f2b08c8265f739cce35f00c3"
  output_or_hash: "inline:version=0.56.0; published=2026-08-19T19:29:01.177Z; shasum=b5cd36013cb4b263e50da0337ac3a2a00571bd0c; integrity=sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw==; gitHead absent"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-003, C-024, C-029]
  notes: "Mutable packument pinned by retained hash and exact version JSON pointer."
- source_id: S-003
  source_kind: package-artifact
  title: "Stable npm tarball and extracted manifest"
  url: "https://registry.npmjs.org/@google/gemini-cli/-/gemini-cli-0.56.0.tgz"
  commit_or_ref: "0.56.0"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@google/gemini-cli@0.56.0+sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw=="
  code_path: "package/package.json"
  symbol: "name,version,license,bin,engines,repository"
  line_anchor: "/name,/version,/license,/bin,/engines,/repository"
  command: "stat -f '%z' gemini-cli-0.56.0.tgz && openssl dgst -sha1 gemini-cli-0.56.0.tgz && openssl dgst -sha512 -binary gemini-cli-0.56.0.tgz | openssl base64 -A && tar -xOf gemini-cli-0.56.0.tgz package/package.json"
  command_environment: "Darwin arm64; no install scripts; network not used after retrieval"
  output_or_hash: "sha256:e25443a59b22f0000d6418ce42c5c0710bc04d8f41b5567417e30e038a80120b"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-004, C-024]
  notes: "20,703,551 bytes; manifest hash sha256:d8daf35daa8fdaecc100a1d50e5df28be03ff0b24e6d82230ac7969d00b4ee23; researcher retains bytes in approved temporary evidence directory."
- source_id: S-004
  source_kind: package-artifact
  title: "Stable tarball CLI generated commit marker"
  url: "https://registry.npmjs.org/@google/gemini-cli/-/gemini-cli-0.56.0.tgz"
  commit_or_ref: "0.56.0"
  resolved_commit: "b6e23a7dc29eb15fede4bbe646d91869e948b45a"
  package_identity: "@google/gemini-cli@0.56.0+sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw=="
  code_path: "bundle/chunk-CNSLGANE.js"
  symbol: "GIT_COMMIT_INFO"
  line_anchor: "L77179"
  command: "rg -n 'var GIT_COMMIT_INFO' package/bundle/chunk-CNSLGANE.js"
  command_environment: "extracted artifact; ripgrep; no execution/network"
  output_or_hash: "inline:77179:var GIT_COMMIT_INFO = \"b6e23a7dc\"; file sha256:0b1b5789c74329f21ff62a68fddc41b76bd1c0f5679feffb246c64fa114ab8fc"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-029]
  notes: "Generated bundled source, not independent source provenance."
- source_id: S-005
  source_kind: package-artifact
  title: "Stable tarball bundled core commit marker"
  url: "https://registry.npmjs.org/@google/gemini-cli/-/gemini-cli-0.56.0.tgz"
  commit_or_ref: "0.56.0"
  resolved_commit: "8f05769501133dc04797578dfb7a9f445d10e0db"
  package_identity: "@google/gemini-cli@0.56.0+sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw=="
  code_path: "bundle/chunk-LZUWGCRJ.js"
  symbol: "GIT_COMMIT_INFO"
  line_anchor: "L282562"
  command: "rg -n 'var GIT_COMMIT_INFO' package/bundle/chunk-LZUWGCRJ.js"
  command_environment: "extracted artifact; ripgrep; no execution/network"
  output_or_hash: "inline:282562:var GIT_COMMIT_INFO = \"8f0576950\"; file sha256:ea904ac8d0f8ccb1418f158be64583ea86ed46ac7b983f5b055f01ccb2a51ac6"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-029]
  notes: "Generated bundled core marker; package contains several duplicate 8f0576950 markers."
- source_id: S-006
  source_kind: release-metadata
  title: "Official v0.56.0 tag resolution"
  url: "https://api.github.com/repos/google-gemini/gemini-cli/git/ref/tags/v0.56.0"
  commit_or_ref: "refs/tags/v0.56.0"
  resolved_commit: "b6e23a7dc29eb15fede4bbe646d91869e948b45a"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "ref.object.sha"
  line_anchor: "/object/sha"
  command: "curl -fsSL https://api.github.com/repos/google-gemini/gemini-cli/git/ref/tags/v0.56.0 | jq -r '.object.sha,.object.type'"
  command_environment: "GitHub API HTTPS; UTC"
  output_or_hash: "inline:b6e23a7dc29eb15fede4bbe646d91869e948b45a; commit"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-024, C-029]
  notes: "Primary official tag API."
- source_id: S-007
  source_kind: release-metadata
  title: "Official resolution of bundled short commit 8f0576950"
  url: "https://api.github.com/repos/google-gemini/gemini-cli/commits/8f0576950"
  commit_or_ref: "8f0576950"
  resolved_commit: "8f05769501133dc04797578dfb7a9f445d10e0db"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "sha,commit.message"
  line_anchor: "/sha,/commit/message"
  command: "curl -fsSL https://api.github.com/repos/google-gemini/gemini-cli/commits/8f0576950 | jq -r '.sha,.commit.message'"
  command_environment: "GitHub API HTTPS; successful retained observation, followed by a later rate-limited 403"
  output_or_hash: "inline:8f05769501133dc04797578dfb7a9f445d10e0db; chore(release): v0.56.0-preview.1"
  access_date: "2026-08-24"
  supports_claims: [C-003, C-029]
  notes: "Negative result retained: a later repeat returned HTTP 403; the earlier successful exact result is recorded."
- source_id: S-008
  source_kind: release-metadata
  title: "Official GitHub v0.56.0 release metadata"
  url: "https://github.com/google-gemini/gemini-cli/releases/tag/v0.56.0"
  commit_or_ref: "v0.56.0"
  resolved_commit: "b6e23a7dc29eb15fede4bbe646d91869e948b45a"
  package_identity: "@google/gemini-cli@0.56.0+sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw=="
  code_path: "N/A:no-code-path"
  symbol: "tag_name,published_at,assets.digest"
  line_anchor: "N/A:GitHub-release-JSON"
  command: "jq 'map(select(.tag_name==\"v0.56.0\"))[0] | {tag_name,published_at,target_commitish,html_url,assets:[.assets[]?|{name,digest,size}]}' releases.json"
  command_environment: "retained GitHub releases API response; jq; sha256:d5b4dd7f031131222722148ac7ca30d53d723775b571b2ef6c5be5ec907cc1ec"
  output_or_hash: "inline:v0.56.0 published 2026-08-19T19:29:38Z; bundle asset digest sha256:b5b5fad36b8d1fd2162a9d14cb90a4398b65319dfa0a9dc09d10c11179a52667"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-024]
  notes: "Post-cutoff 2026-08-25 nightly excluded; 0.57.0-preview.1 noted separately."
- source_id: S-009
  source_kind: license
  title: "Repository Apache License 2.0 text"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/LICENSE#L2-L6"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "LICENSE"
  symbol: "Apache License Version 2.0"
  line_anchor: "L2-L6"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:LICENSE | sed -n '2,6p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:Apache License Version 2.0, January 2004; TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION"
  access_date: "2026-08-24"
  supports_claims: [C-004]
  notes: "Does not establish dependency or trademark rights."
- source_id: S-010
  source_kind: repository-file
  title: "Root workspace, build, test, and bundle manifest"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/package.json#L1-L98"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "package.json"
  symbol: "workspaces,scripts,bin,files"
  line_anchor: "L1-L98"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:package.json | sed -n '1,98p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:ESM workspaces packages/*; gemini=bundle/gemini.js; layered build/test/integration/memory/perf scripts"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-006, C-008, C-024, C-025]
  notes: "Root manifest version is a development nightly and not substituted for stable metadata."
- source_id: S-011
  source_kind: repository-file
  title: "CLI main dispatch and startup side effects"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/cli/src/gemini.tsx#L350-L450"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/cli/src/gemini.tsx"
  symbol: "main"
  line_anchor: "L350-L450,L580-L638,L749-L887"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/cli/src/gemini.tsx | sed -n '350,450p;580,638p;749,887p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:startup cleanup/settings/session; optional sandbox; ACP at 758-760; interactive at 787-805; headless at 808-887"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-007, C-028]
  notes: "Static source, not runtime proof."
- source_id: S-012
  source_kind: repository-file
  title: "Gemini client model, context, loop, usage, and event path"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/core/src/core/client.ts#L616-L845"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/core/client.ts"
  symbol: "GeminiClient.processTurn/sendMessageStream"
  line_anchor: "L616-L845,L910-L1050"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/core/src/core/client.ts | sed -n '616,845p;910,1050p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:context render/compress, token overflow check, routing, turn stream, usage ground truth, hooks, cancellation"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-014, C-015, C-020, C-021, C-022, C-023, C-028, C-030]
  notes: "Static source."
- source_id: S-013
  source_kind: repository-file
  title: "Declarative tool contract and validation"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/core/src/tools/tools.ts#L36-L106"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/tools/tools.ts"
  symbol: "ToolInvocation/ToolBuilder/BaseDeclarativeTool"
  line_anchor: "L36-L106,L388-L446,L517-L565,L679-L710"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/core/src/tools/tools.ts | sed -n '36,106p;388,446p;517,565p;679,710p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:FunctionDeclaration schema, untrusted params, confirmation, AbortSignal, schema validation before invocation"
  access_date: "2026-08-24"
  supports_claims: [C-011, C-026, C-028, C-030, C-031, C-036]
  notes: "Static generic contract; tool-specific behavior excluded."
- source_id: S-014
  source_kind: repository-file
  title: "Scheduler queue, policy, confirmation, parallel execution, cancellation"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/core/src/scheduler/scheduler.ts#L195-L270"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/scheduler/scheduler.ts"
  symbol: "Scheduler.schedule/_processNextItem/_processValidatingCall/_execute"
  line_anchor: "L195-L270,L429-L525,L614-L715,L730-L810"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/core/src/scheduler/scheduler.ts | sed -n '195,270p;429,525p;614,715p;730,810p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:abortable queue, Promise.all validation/execution, hooks then policy/confirmation, correlated executor call"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-011, C-017, C-018, C-020, C-023, C-028, C-030, C-031, C-036]
  notes: "Static source."
- source_id: S-015
  source_kind: repository-file
  title: "Local subagent isolation and lifecycle"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/core/src/agents/local-executor.ts#L120-L285"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/agents/local-executor.ts"
  symbol: "LocalAgentExecutor.create/runInternal"
  line_anchor: "L120-L285,L537-L625,L760-L885"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/core/src/agents/local-executor.ts | sed -n '120,285p;537,625p;760,885p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:derived message bus and registries, no nested Agent tool, parent IDs, deadline+AbortSignal, structured termination"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-017, C-023, C-036]
  notes: "Remote path additionally inspected but not executed."
- source_id: S-016
  source_kind: repository-file
  title: "Provider interface and authentication routing"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/core/src/core/contentGenerator.ts#L39-L110"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/core/contentGenerator.ts"
  symbol: "ContentGenerator/AuthType/createContentGenerator"
  line_anchor: "L39-L110,L141-L205,L210-L421"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/core/src/core/contentGenerator.ts | sed -n '39,110p;141,205p;210,421p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:OAuth/ADC via Code Assist; Gemini API/Vertex/Gateway via GoogleGenAI; generate/stream/count/embed interface"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-012, C-013, C-014, C-036]
  notes: "Static route presence is not service availability."
- source_id: S-017
  source_kind: repository-file
  title: "Hierarchical and JIT memory manager"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/core/src/context/memoryContextManager.ts#L22-L172"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/context/memoryContextManager.ts"
  symbol: "MemoryContextManager.refresh/discoverContext"
  line_anchor: "L22-L172"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/core/src/context/memoryContextManager.ts | sed -n '22,172p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:global/extension/project/user memory, trust gating, identity dedupe, MCP merge, JIT discovery"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-028, C-036]
  notes: "Path provenance delimiters additionally inspected in memoryDiscovery.ts L295-L309."
- source_id: S-018
  source_kind: repository-file
  title: "Chat compression service"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/core/src/context/chatCompressionService.ts#L38-L120"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/context/chatCompressionService.ts"
  symbol: "ChatCompressionService.compress"
  line_anchor: "L38-L120,L239-L330,L410-L480"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/core/src/context/chatCompressionService.ts | sed -n '38,120p;239,330p;410,480p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:0.5 default threshold, preserve recent 30%, truncate/summarize, compare token count, explicit failures"
  access_date: "2026-08-24"
  supports_claims: [C-015]
  notes: "Static source; summarization provider call not executed."
- source_id: S-019
  source_kind: repository-file
  title: "JSONL chat recording, resume, recovery, and deletion"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/core/src/services/chatRecordingService.ts#L402-L540"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/services/chatRecordingService.ts"
  symbol: "ChatRecordingService.initialize/rewriteConversationFile/deleteCurrentSessionAsync"
  line_anchor: "L402-L540,L575-L635,L873-L924"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/core/src/services/chatRecordingService.ts | sed -n '402,540p;575,635p;873,924p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:project/session-keyed JSONL, legacy migration, subagent nesting, preserve unreadable file, temp+rename, artifact deletion"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-028, C-036]
  notes: "No crash injection."
- source_id: S-020
  source_kind: repository-file
  title: "Early Git worktree setup"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/cli/src/utils/worktreeSetup.ts#L14-L42"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/cli/src/utils/worktreeSetup.ts"
  symbol: "setupWorktree"
  line_anchor: "L14-L42"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/cli/src/utils/worktreeSetup.ts | sed -n '14,42p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:relaunch guard, project root/service setup, process.chdir, fatal diagnostic"
  access_date: "2026-08-24"
  supports_claims: [C-017, C-036]
  notes: "Experimental feature; collision behavior untested."
- source_id: S-021
  source_kind: repository-file
  title: "Policy engine decisions and fail-closed paths"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/core/src/policy/policy-engine.ts#L290-L404"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/policy/policy-engine.ts"
  symbol: "PolicyEngine.check"
  line_anchor: "L290-L404,L420-L559,L617-L820"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/core/src/policy/policy-engine.ts | sed -n '290,404p;420,559p;617,820p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:interactive ASK/noninteractive DENY default, YOLO allow, shell parse/redirection downgrade, outside-workspace ask, checker failure deny"
  access_date: "2026-08-24"
  supports_claims: [C-018, C-019, C-026, C-031, C-036]
  notes: "Static enforcement logic; no bypass test."
- source_id: S-022
  source_kind: repository-file
  title: "Official sandbox modes and limitations"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/docs/cli/sandbox.md#L20-L119"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "docs/cli/sandbox.md"
  symbol: "sandbox configuration/methods"
  line_anchor: "L20-L119,L181-L215,L267-L280"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:docs/cli/sandbox.md | sed -n '20,119p;181,215p;267,280p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:configurable Seatbelt/container/Windows/gVisor/tool sandbox modes and platform limitations"
  access_date: "2026-08-24"
  supports_claims: [C-018, C-019, C-026, C-031, C-036]
  notes: "Documentation is design intent; path-resolution source was also inspected."
- source_id: S-023
  source_kind: repository-file
  title: "OpenTelemetry exporters, flush, and shutdown"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/core/src/telemetry/sdk.ts#L270-L445"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/telemetry/sdk.ts"
  symbol: "initializeTelemetry/flushTelemetry/shutdownTelemetry"
  line_anchor: "L270-L445"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/core/src/telemetry/sdk.ts | sed -n '270,445p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:GCP, OTLP HTTP/gRPC, file, console exporters; NodeSDK; forceFlush; shutdown"
  access_date: "2026-08-24"
  supports_claims: [C-020, C-022, C-028, C-030, C-036]
  notes: "Exporters were not enabled during probe."
- source_id: S-024
  source_kind: repository-file
  title: "Token estimation and countTokens fallback"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/core/src/utils/tokenCalculation.ts#L11-L185"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/utils/tokenCalculation.ts"
  symbol: "estimateTokenCountSync/calculateRequestTokenCount"
  line_anchor: "L11-L185"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/core/src/utils/tokenCalculation.ts | sed -n '11,185p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:ASCII/non-ASCII/media heuristics, recursion cap, media countTokens API, local fallback"
  access_date: "2026-08-24"
  supports_claims: [C-021, C-022, C-036]
  notes: "Estimation is not billed usage."
- source_id: S-025
  source_kind: repository-file
  title: "Retry predicate, backoff, cancellation, and fallback"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/packages/core/src/utils/retry.ts#L22-L70"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "packages/core/src/utils/retry.ts"
  symbol: "isRetryableError/retryWithBackoff"
  line_anchor: "L22-L70,L164-L209,L252-L529"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:packages/core/src/utils/retry.ts | sed -n '22,70p;164,209p;252,529p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:network/429/499/5xx retry, HTTP 400 exclusion, attempts/delay caps, jitter, AbortSignal, model fallback"
  access_date: "2026-08-24"
  supports_claims: [C-022, C-023, C-036]
  notes: "No transient failure induced."
- source_id: S-026
  source_kind: repository-file
  title: "Official extension overview and repository qualification scripts"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/docs/extensions/index.md#L1-L60"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "docs/extensions/index.md"
  symbol: "extension package surface"
  line_anchor: "L1-L60"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:docs/extensions/index.md | sed -n '1,60p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:extensions package prompts, MCP, commands, themes, hooks, subagents, skills; install/manage commands"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-009, C-024, C-025]
  notes: "Release/test claims also use S-010; this source does not prove extension execution."
- source_id: S-027
  source_kind: security-advisory
  title: "Official vulnerability reporting policy"
  url: "https://github.com/google-gemini/gemini-cli/blob/812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8/SECURITY.md#L1-L9"
  commit_or_ref: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  package_identity: "N/A:not-a-package"
  code_path: "SECURITY.md"
  symbol: "security issue intake"
  line_anchor: "L1-L9"
  command: "git show 812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8:SECURITY.md | sed -n '1,9p'"
  command_environment: "local pinned checkout; no network"
  output_or_hash: "inline:report via https://g.co/vulnz; coordinate/disclose via GitHub Security Advisory; response target five working days"
  access_date: "2026-08-24"
  supports_claims: [C-026]
  notes: "No advisory census performed."
- source_id: S-028
  source_kind: official-documentation
  title: "Gemini Code Assist consumer accounts deprecation"
  url: "https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "consumer serving timeline and FAQ"
  line_anchor: "N/A:web-page; last updated 2026-06-23 UTC"
  command: "curl -fsSL https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals"
  command_environment: "passive HTTPS retrieval; UTC; no authentication"
  output_or_hash: "inline:from 2026-06-18 Individuals/AI Pro/AI Ultra stopped serving Gemini CLI and Login with Google; Standard/Enterprise unchanged; migrate consumers to Antigravity"
  access_date: "2026-08-24"
  supports_claims: [C-013, C-027, C-029, C-032, C-033]
  notes: "Vendor service-policy statement, not independent runtime measurement."
- source_id: S-029
  source_kind: runtime-observation
  title: "Denied-write stable version/help startup probe"
  url: "https://registry.npmjs.org/@google/gemini-cli/-/gemini-cli-0.56.0.tgz"
  commit_or_ref: "0.56.0"
  resolved_commit: "N/A:package-provenance-unknown-see-C-003"
  package_identity: "@google/gemini-cli@0.56.0+sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw=="
  code_path: "package/bundle/gemini.js"
  symbol: "gemini --version / --help startup"
  line_anchor: "N/A:generated-executable"
  command: "HOME=$PWD/home GEMINI_CLI_NO_RELAUNCH=true sandbox-exec -f deny-write-network.sb /absolute/path/to/node work/package/bundle/gemini.js --version"
  command_environment: "Darwin arm64; Node v24.18.0; disposable dirs; network and writes denied; no secrets"
  output_or_hash: "inline:stdout 0.56.0; stderr EPERM mkdir <disposable-home>/.gemini from ProjectRegistry.getShortId and cleanup; stdout sha256:3fea81d177087f5d3380893d95b86573a803b34ed45419ec381bdd776f526cee; stderr sha256:f3db76c19717a088f3aa8ccb10dadc81bd8d9dc14ccdf72e27270ff4f0d212e2"
  access_date: "2026-08-24"
  supports_claims: [C-029, C-034, C-036]
  notes: "Initial relative-node attempt failed with execvp No such file; repeated with absolute Node path."
- source_id: S-030
  source_kind: runtime-observation
  title: "Writable disposable-home stable version probe"
  url: "https://registry.npmjs.org/@google/gemini-cli/-/gemini-cli-0.56.0.tgz"
  commit_or_ref: "0.56.0"
  resolved_commit: "N/A:package-provenance-unknown-see-C-003"
  package_identity: "@google/gemini-cli@0.56.0+sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw=="
  code_path: "package/bundle/gemini.js"
  symbol: "gemini --version"
  line_anchor: "N/A:generated-executable"
  command: "HOME=$PWD/home GEMINI_CLI_NO_RELAUNCH=true sandbox-exec -f allow-disposable-home-deny-network.sb /absolute/path/to/node work/package/bundle/gemini.js --version"
  command_environment: "Darwin arm64; Node v24.18.0; only disposable home/work writable; network denied; no secrets"
  output_or_hash: "inline:stdout=0.56.0; stderr empty; created home/.gemini and two zero-byte projects.json.<UUID>.tmp files; stdout sha256:3fea81d177087f5d3380893d95b86573a803b34ed45419ec381bdd776f526cee"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-025, C-034]
  notes: "UUID filenames are nondeterministic; sizes and pattern retained."
- source_id: S-031
  source_kind: runtime-observation
  title: "Network-denied stable help probe"
  url: "https://registry.npmjs.org/@google/gemini-cli/-/gemini-cli-0.56.0.tgz"
  commit_or_ref: "0.56.0"
  resolved_commit: "N/A:package-provenance-unknown-see-C-003"
  package_identity: "@google/gemini-cli@0.56.0+sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw=="
  code_path: "package/bundle/gemini.js"
  symbol: "gemini --help"
  line_anchor: "N/A:generated-executable"
  command: "HOME=$PWD/home GEMINI_CLI_NO_RELAUNCH=true sandbox-exec -f allow-disposable-home-deny-network.sb /absolute/path/to/node work/package/bundle/gemini.js --help"
  command_environment: "Darwin arm64; Node v24.18.0; disposable home/work; network denied; no secrets"
  output_or_hash: "sha256:b5c6e1af180f48adb3700982e7b06e905f29d2965f047eaeebd0b5c4f676b632"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-025, C-035, C-036]
  notes: "3,989-byte stdout retained; includes interactive/headless, ACP, MCP, extensions, skills, hooks, worktree, sandbox, approval, and session flags."
- source_id: S-032
  source_kind: package-artifact
  title: "Pinned stable package README authentication claims"
  url: "https://registry.npmjs.org/@google/gemini-cli/-/gemini-cli-0.56.0.tgz"
  commit_or_ref: "0.56.0"
  resolved_commit: "N/A:package-provenance-unknown-see-C-003"
  package_identity: "@google/gemini-cli@0.56.0+sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw=="
  code_path: "package/README.md"
  symbol: "Why Gemini CLI?/Authentication Options"
  line_anchor: "L17-L28,L146-L168"
  command: "tar -xOf gemini-cli-0.56.0.tgz package/README.md | sed -n '17,28p;146,168p'"
  command_environment: "local extracted package; no execution/network"
  output_or_hash: "inline:advertises 60 requests/minute, 1000/day, and Sign in with Google for individual developers"
  access_date: "2026-08-24"
  supports_claims: [C-027, C-029]
  notes: "Contradicted by later official service deprecation S-028; retained as stale package documentation evidence."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "google-gemini-cli-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "Google Gemini CLI"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "https://github.com/google-gemini/gemini-cli"
  resolved_commit: "812f7a2bcf20b6e80e2e50c3c8fa8e26567bc1e8"
  observed_ref: "HEAD detached/shallow; stable tag v0.56.0 separately resolved to b6e23a7dc29eb15fede4bbe646d91869e948b45a"
  package_identity: "@google/gemini-cli@0.56.0+sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw=="
research:
  researcher: "ses_fc91daa94ffeeRkjetF93o7Q79"
  owned_path: "research/harnesses/gemini-cli.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "OBSERVED"
    summary: "Source HEAD and stable npm bytes are independently pinned."
    confidence: "HIGH"
    claim_ids: ["C-001", "C-002"]
    source_ids: ["S-001", "S-002", "S-003", "S-030"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "UNKNOWN"
    summary: "Apache-2.0 is observed, but mixed generated markers prevent package-wide source attribution."
    confidence: "N/A"
    claim_ids: ["C-003", "C-004"]
    source_ids: ["S-002", "S-004", "S-005", "S-006", "S-007", "S-009"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "OBSERVED"
    summary: "CLI, core, A2A, SDK, devtools, VS Code, and test packages are mapped."
    confidence: "HIGH"
    claim_ids: ["C-005"]
    source_ids: ["S-010"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "OBSERVED"
    summary: "CLI dispatch and declared alternate surfaces are statically traced."
    confidence: "HIGH"
    claim_ids: ["C-006"]
    source_ids: ["S-010", "S-011", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "PARTIAL"
    summary: "One headless request path is statically traced without authenticated execution."
    confidence: "MEDIUM"
    claim_ids: ["C-007", "C-013"]
    source_ids: ["S-011", "S-012", "S-014", "S-016"]
    pattern_disposition: "NO_POSITION"
  - dimension: "module_extension_boundaries"
    coverage: "UNKNOWN"
    summary: "Extension capabilities are documented but the complete lifecycle contract is unknown."
    confidence: "N/A"
    claim_ids: ["C-008", "C-009"]
    source_ids: ["S-010", "S-026"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "OBSERVED"
    summary: "Local/remote delegation, child registries, limits, and cancellation are statically mapped."
    confidence: "HIGH"
    claim_ids: ["C-010"]
    source_ids: ["S-015"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "OBSERVED"
    summary: "Typed schema, validation, confirmation, scheduling, and execution seams are explicit."
    confidence: "HIGH"
    claim_ids: ["C-011"]
    source_ids: ["S-013", "S-014"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provider_interface"
    coverage: "UNKNOWN"
    summary: "Provider routes and official tier status are known; live behavior is not."
    confidence: "N/A"
    claim_ids: ["C-012", "C-013", "C-027"]
    source_ids: ["S-016", "S-028", "S-032"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Routing, fallback, events, tools, and token limits are static findings."
    confidence: "MEDIUM"
    claim_ids: ["C-014"]
    source_ids: ["S-012", "S-016"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "OBSERVED"
    summary: "Hierarchical/JIT memory and compaction are statically traced."
    confidence: "HIGH"
    claim_ids: ["C-015"]
    source_ids: ["S-012", "S-017", "S-018"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "JSONL resume/recovery is static; crash timing is untested."
    confidence: "HIGH"
    claim_ids: ["C-016", "C-036"]
    source_ids: ["S-019"]
    pattern_disposition: "NO_POSITION"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Parallel batches, subagent scopes, and worktrees exist without collision evidence."
    confidence: "MEDIUM"
    claim_ids: ["C-017", "C-036"]
    source_ids: ["S-014", "S-015", "S-020"]
    pattern_disposition: "NO_POSITION"
  - dimension: "permissions_authority_sandbox"
    coverage: "UNKNOWN"
    summary: "Enforcement structure is explicit but bypass/escape resistance is unknown."
    confidence: "N/A"
    claim_ids: ["C-018", "C-019"]
    source_ids: ["S-014", "S-021", "S-022"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Correlated JSONL and OpenTelemetry exist without tamper/loss qualification."
    confidence: "HIGH"
    claim_ids: ["C-020", "C-036"]
    source_ids: ["S-012", "S-014", "S-023"]
    pattern_disposition: "CANDIDATE"
  - dimension: "resource_token_cost_accounting"
    coverage: "UNKNOWN"
    summary: "Token and usage signals exist, but exact cost attribution and budgets are unknown."
    confidence: "N/A"
    claim_ids: ["C-021", "C-022"]
    source_ids: ["S-012", "S-023", "S-024", "S-025"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Failure, cancellation, and retry paths are static and not fault-injected."
    confidence: "HIGH"
    claim_ids: ["C-023", "C-036"]
    source_ids: ["S-012", "S-014", "S-015", "S-025"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Channels and digests are observed; reproducibility and source identity remain incomplete."
    confidence: "HIGH"
    claim_ids: ["C-003", "C-024"]
    source_ids: ["S-002", "S-003", "S-006", "S-008", "S-010"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "PARTIAL"
    summary: "Upstream test layers are declared; only local version/help probes were run."
    confidence: "HIGH"
    claim_ids: ["C-025", "C-036"]
    source_ids: ["S-010", "S-030", "S-031"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "UNKNOWN"
    summary: "Layered controls are static findings, not penetration or security acceptance."
    confidence: "N/A"
    claim_ids: ["C-019", "C-026", "C-036"]
    source_ids: ["S-013", "S-021", "S-022", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "PARTIAL"
    summary: "Explicit typed seams improve static inspectability."
    confidence: "MEDIUM"
    claim_ids: ["C-028"]
    source_ids: ["S-011", "S-012", "S-013", "S-014", "S-017", "S-019", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "OBSERVED"
    summary: "Mixed provenance, service-doc drift, and startup writes are material bounded liabilities."
    confidence: "HIGH"
    claim_ids: ["C-029"]
    source_ids: ["S-002", "S-004", "S-005", "S-006", "S-007", "S-028", "S-029", "S-032"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "PARTIAL"
    summary: "Typed event/tool seams are candidates; policy/sandbox transfer is conditional."
    confidence: "MEDIUM"
    claim_ids: ["C-030", "C-031"]
    source_ids: ["S-012", "S-013", "S-014", "S-021", "S-022", "S-023"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Live authenticated execution and broader Antigravity research are rejected in this scope."
    confidence: "HIGH"
    claim_ids: ["C-032", "C-033"]
    source_ids: ["S-028"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-028"]
liability_ids: ["C-029"]
transferable_pattern_ids: ["C-030", "C-031"]
curiosity_no_go_ids: ["C-032", "C-033"]
unknown_claim_ids: ["C-003", "C-009", "C-013", "C-019", "C-022", "C-036"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| Unknown | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-003 package-wide source provenance | Blocks exact artifact-to-source attribution | Rebuild at stable tag and byte-diff all generated chunks | release toolchain and immutable dependencies | UNASSIGNED |
| C-009 extension lifecycle contract | Limits extension portability comparison | Conflicting extension install/reload/disable/version fixture | disposable CLI home and local extensions | UNASSIGNED |
| C-013 live providers | Limits latency/quota/fallback comparison | Tier-specific fake/real provider matrix with capped spend | explicit credentials/network/cost authority | UNASSIGNED |
| C-019 enforcement | Blocks sandbox/security acceptance | Multi-platform bypass/escape suite | disposable VMs and exploitation authority | UNASSIGNED |
| C-022 exact cost | Limits budget/accounting comparison | Reconcile capped workload to provider invoice/usage | paid disposable account and billing export | UNASSIGNED |
| C-036 adversarial outcomes | Limits runtime/recovery/isolation confidence | Purpose-built fake-provider P-02..P-14 suite | destructive/concurrent test authority | UNASSIGNED |

### Curiosity scoring and rejected threads

Scores are 0–3 for decision relevance (R), expected value (V), novelty (N), and
cost (C, where 3 is costly). Only a positive, in-frame marginal-evidence thread
qualified.

| Thread | R/V/N/C | Decision |
| --- | --- | --- |
| Resolve mixed `8f0576950` marker | 3/3/3/1 | Pursued; resolved to preview.1 but contradiction remained |
| Live consumer OAuth/provider call | 2/1/1/3 | `CURIOSITY_NO_GO`: credentials/cost; official status sufficient |
| Full Antigravity architecture | 1/2/3/3 | `CURIOSITY_NO_GO`: separately deferred target |
| Destructive sandbox/concurrency/crash suite | 3/3/2/3 | `CURIOSITY_NO_GO`: requires dedicated authorized environment |
| Third-party shutdown reports | 1/0/0/1 | `CURIOSITY_NO_GO`: inferior to first-party status |
| Workflow-log archaeology/package mirrors | 1/1/1/2 | `CURIOSITY_NO_GO`: lower value than immutable tag/tarball evidence |

### Bibliography rationale

Primary immutable repository blobs were selected for architecture because they
show exact symbols at the cutoff. npm packument/tarball and GitHub tag/release
APIs were retained independently for package identity. The official Google
deprecation page was selected over commentary because service policy is a vendor
fact; it is explicitly not treated as independent performance measurement. The
stable package README is retained only as counterevidence showing documentation
drift. Runtime observations are limited to no-provider version/help startup and
are not generalized.

**URL/link-check result:** PASS — the retained URL syntax and immutable-blob-pin audit found no defects.

### Stop decision and handoff

**STOP — coverage and saturation reached.** All canonical sections and probes
are present; each comparison dimension has evidence or an explicit UNKNOWN.
Further in-frame retrieval repeated known sources or had nonpositive marginal
evidence. The only high-value curiosity thread was pursued and left an honest
provenance UNKNOWN; later API repetition hit HTTP 403 and was retained as a
negative result. Recommended downstream treatment: compare the typed seams and
policy model as research inputs, keep service tier and package provenance as
hard caveats, and do not infer security or cost acceptance.

Handoff path: `research/harnesses/gemini-cli.md`. Pre-existing workspace changes
were left untouched: `M apps/plugin/opencode2/turbo.json`, `?? docs/architecture/`,
and the pre-existing untracked `research/` tree containing the contract/roster.
No files were staged or committed.
