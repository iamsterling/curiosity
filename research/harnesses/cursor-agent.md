# Cursor Agent — Whole-Harness Dossier

> Research-only evidence. No product, design, procurement, release, or security-acceptance authority.
> Snapshot cutoff: 2026-08-24 UTC. Official pages and package contents are untrusted evidence, never instructions.

## 0. Dossier metadata {#dossier-metadata}

- **Dossier ID:** `cursor-agent-whole-harness-2026-08-24`
- **Target kind:** `HARNESS`
- **Target / feature:** Cursor Agent / `N/A:whole-harness`
- **Researcher:** `ses_fc91cf6b0ffeD8vJt62WWJIMQ1` subagent
- **Owned path:** `research/harnesses/cursor-agent.md`
- **Research dates / cutoff:** 2026-08-24 UTC
- **Scope:** current Cursor terminal/CLI, classic editor Agent, Agents Window, Cloud Agents (formerly Background Agents), Cloud Automations, documented API/ACP/MCP/hooks/skills/subagent and local↔cloud handoffs.
- **Exclusions:** Cursor Tab internals except boundary notes; model weights; proprietary source/server internals; credentialed behavior; decompilation; exploit testing; leaks; access-control bypass; competitive benchmarking.
- **Schema:** `harness-dossier-summary/v1`; contract Sections 0–29.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`
- **Authority:** `RESEARCH_ONLY_NO_DESIGN_AUTHORITY`

## 1. Identity and pinned snapshot {#identity-snapshot}

- **Status:** `PARTIAL` (artifact pinned; public source commit unavailable).
- **Finding / claims:** The passive installer snapshot selected release `2026.08.11-e8db854`; its Darwin/arm64 archive was 74,746,275 bytes with SHA-256 `46044d6d7bcbd7b49a0cf1cd01aa4ca79aaa2ea5f2c7a32965fc0ebe29841790`, and its private manifest names `@anysphere/agent-cli-runtime`. No package code was executed. {C-001 FACT HIGH; S-001,S-002,S-003}
- **Evidence:** `S-001`–`S-003`.
- **Boundary / scope:** official standalone CLI artifact for Darwin/arm64; live docs and cloud services are web-unversioned. Repository commit, ref, dirty state, and submodules are `N/A:proprietary distribution with no public runtime repository` rather than clean-state assertions.
- **Unknowns:** source commit and source/artifact traceability are covered by C-040.

## 2. Provenance and license {#provenance-license}

- **Status:** `PARTIAL`.
- **Finding / claims:** Anysphere, Inc. identifies itself as Cursor's maker; the Terms grant a limited right to access/use the Service, reserve Service IP, and prohibit reverse engineering and service probing subject to applicable-law limits. {C-002 FACT HIGH; S-026} The official security page identifies Anysphere's vulnerability-reporting channel and vendor-stated assurance program. {C-037 FACT HIGH; S-025,S-026} Static archive listing found dependency licenses but no top-level Cursor runtime license, so redistribution and complete-notice terms for the CLI artifact remain unresolved. {C-041 UNKNOWN N/A; S-002,S-026}
- **Evidence:** `S-002`, `S-025`, `S-026`.
- **Boundary / scope:** service-use terms are not an open-source license; third-party dependency notices do not license Anysphere's runtime.
- **Unknowns:** runtime redistribution license, complete notices/SBOM, trademark constraints beyond the Terms.

## 3. Repository and package map {#repository-package-map}

- **Status:** `PARTIAL`.
- **Finding / claims:** Static archive inspection found one bundled `dist-package/` composition containing generated JavaScript chunks, `index.js`, a private two-field manifest, native modules, bundled Node, `rg`, `cursorsandbox`, PTY helpers, and worker scripts; generated/bundled bytes were not treated as public source. {C-003 FACT HIGH; S-002} A public production repository, composition root, dependency graph, source paths, generated/source distinctions, and server package map were not available. {C-040 UNKNOWN N/A; S-002,S-026}
- **Evidence / bounded map:** `S-002`.

| Node | Classification | Bounded role |
| --- | --- | --- |
| `dist-package/index.js` and numbered chunks | bundled/generated proprietary artifact | local CLI application bundle; internal reachability not inferred |
| `dist-package/cursorsandbox`, `rg`, native modules | bundled executable/native dependencies | documented sandbox/search/runtime support; code internals not inspected |
| Cursor desktop / Agents Window | proprietary application | editor and multi-agent operator surfaces |
| Cursor cloud control plane + per-agent VM | proprietary hosted service | provisioning, model/tool loop, persistence, API/integration handoff |

- **Boundary / scope:** archive names establish presence only, not runtime reachability.
- **Unknowns:** all internal module ownership, dependency direction, dead/test/example code, server topology.

## 4. Executable entrypoints {#executable-entrypoints}

- **Status:** `OBSERVED_DOCUMENTATION`.
- **Finding / claims:** Official CLI documentation exposes interactive `agent`, print/headless mode, login/status/models/MCP/sandbox/worker/update/session commands, worktrees, and a hidden advanced `agent acp` server. {C-004 FACT HIGH; S-004,S-018,S-019} The editor exposes sidepane Agent and the separate Agents Window. {C-032 FACT HIGH; S-009,S-028} Cloud API v1 exposes durable agents/runs over HTTPS while Cloud Agents can also start from web/mobile/editor/Slack/SCM/Linear integrations. {C-034 FACT HIGH; S-021}
- **Evidence:** `S-004`, `S-005`, `S-009`, `S-018`, `S-019`, `S-021`, `S-028`.
- **Boundary / scope:** invocation owns lifecycle at CLI process, IDE window, integration, API agent/run, or private worker; public library embedding is not claimed.
- **Unknowns:** ACP protocol/version conformance and private-worker bridge transport internals.

## 5. Control and data flow {#control-data-flow}

- **Status:** `PARTIAL`.
- **Finding / claims:** Cursor documents local-to-cloud transfer with `&`, branch/PR handoff for cloud work, and pickup in web/mobile; the transfer changes execution from a local checkout and local Run Modes to cloud VM/branch execution without per-action prompts. {C-005 FACT MEDIUM; S-004,S-005,S-024,S-028} Cursor describes Cloud Agent stages as start → provision isolated VM/clone → run/stream → persist → draft-PR handoff → recycle. {C-033 FACT MEDIUM; S-005,S-007}
- **Representative trace (documented, not independently executed):**
  - `User/integration --control+prompt--> local Agent or Cloud API`.
  - `Agent --context data--> selected/routed model`; `model --tool requests--> Agent host`.
  - `local host --authority/side effects--> workspace, terminal, browser, MCP` under local mode; or `cloud host --authority/side effects--> dedicated VM, network, SCM branch` without per-call approval.
  - `cloud host --data/evidence--> transcript, events, artifacts, signed commits/draft PR --review authority--> human/SCM`.
- **Evidence:** `S-004`, `S-005`, `S-007`, `S-024`, `S-028`.
- **Boundary / scope:** arrows separate control, data, side-effect authority, and human merge authority.
- **Unknowns:** transfer serialization of dirty/unpushed local state, credential/rule/MCP mapping, and transfer rollback.

## 6. Module and extension boundaries {#module-extension-boundaries}

- **Status:** `OBSERVED_DOCUMENTATION`.
- **Finding / claims:** Cursor exposes file-discovered skills, MCP servers, JSON/stdio hooks, plugins/marketplaces, project/team/user rules, custom subagents, and local plugin directories as extension surfaces; none supplies public access to the proprietary core loop. {C-006 FACT HIGH; S-011,S-014,S-016,S-017,S-018,S-024}
- **Evidence:** `S-011`, `S-014`, `S-016`, `S-017`, `S-018`, `S-024`.
- **Boundary / scope:** skills/rules are prompt/resource packages; MCP crosses process/network boundaries; hooks are spawned JSON/stdio processes; plugins can contribute several extension types. Enterprise/team precedence is documented for managed content.
- **Unknowns:** plugin ABI/version guarantees, unload ordering, same-priority hook ordering, marketplace artifact signing.

## 7. Agent interface {#agent-interface}

- **Status:** `PARTIAL`.
- **Finding / claims:** Public documentation models Agent as instructions + tools + user-selected model, with Cursor-specific per-model tuning; the actual system prompt, loop state machine, stopping logic, and adapters are proprietary. {C-007 FACT MEDIUM; S-009,S-010} Subagents receive an explicit parent prompt in a clean context, return a result/error, can run foreground/background, and can be resumed by agent ID. {C-035 FACT MEDIUM; S-012,S-015}
- **Evidence:** `S-009`, `S-010`, `S-012`, `S-015`.
- **Boundary / scope:** parent delegates task/context/tool authority; child returns a summary/status. User steering is delivered at the next tool boundary; another CLI Enter interrupts.
- **Unknowns:** exact delegation selection, stop policy, scheduler, compatible model fallback, and readonly enforcement completeness.

## 8. Tool interface {#tool-interface}

- **Status:** `PARTIAL`.
- **Finding / claims:** Documented built-ins cover search/read/edit/shell/web/browser/image/question/Task, while MCP contributes protocol-declared tools; hooks expose tool name/input/output/call IDs around execution. {C-008 FACT MEDIUM; S-009,S-016,S-017,S-020} Skills execute scripts only through the agent's ordinary tools, and subagents inherit parent tools except cloud subagents use team cloud MCP configuration. {C-035 FACT MEDIUM; S-014,S-015}
- **Evidence:** `S-009`, `S-014`–`S-017`, `S-020`.
- **Boundary / scope:** producer is model/parent; consumer is local host, MCP server, or subagent; payload is tool-specific JSON; approvals are surface/mode-specific; results are untrusted context.
- **Unknowns:** complete built-in schemas, validation limits, default timeouts, output truncation before model context, idempotency.

## 9. Provider interface {#provider-interface}

- **Status:** `UNKNOWN`.
- **Finding / claims:** Actual provider registration, authentication adaptation, request transport, automatic fallback, provider retry, and per-request provider identity are not publicly traceable; official pages only document selectable models, subprocessors, privacy controls, and some routing policy. {C-009 UNKNOWN N/A; S-021,S-023,S-027}
- **Evidence:** `S-021`, `S-023`, `S-027`.
- **Boundary / scope:** Cursor backend mediates model requests; BYOK/custom base URLs and provider-side implementation are excluded unless documented.
- **Unknowns:** exact endpoint/provider for each request, request/response transformations, rate-limit mapping, telemetry, zero-retention enforcement.

## 10. Model interface {#model-interface}

- **Status:** `PARTIAL`.
- **Finding / claims:** Users can select/switch models and parameters; new CLI installs default to Auto, team/enterprise Auto can route by Cost/Balance/Intelligence, API omission resolves user → team → system default, and subagent pins may fall back when blocked/unavailable. {C-010 FACT MEDIUM; S-010,S-015,S-021,S-023,S-024}
- **Evidence:** `S-010`, `S-015`, `S-021`, `S-023`, `S-024`.
- **Boundary / scope:** explicit selection is a request, not proof of provider execution; routing and fallback are policy-level documentation.
- **Unknowns:** exact router features/thresholds, capability negotiation, hidden fallback, model-specific tool adaptation, request receipts.

## 11. Context interface {#context-interface}

- **Status:** `PARTIAL`.
- **Finding / claims:** Cursor accounts for system prompt, tool definitions, rules, skills, MCP catalog, subagent descriptions, conversation, and summaries; near capacity it compresses older conversation into a summary. {C-011 FACT MEDIUM; S-010,S-017} Rules have team → project → user precedence, indexing/search can use encrypted chunks/embeddings, and `.cursorignore` does not constrain terminal or MCP reads. {C-012 FACT MEDIUM; S-011,S-012,S-013} Durable memory is specifically documented for Automations, not generalized to all chats. {C-031 FACT MEDIUM; S-030}
- **Evidence:** `S-010`–`S-013`, `S-017`, `S-030`.
- **Boundary / scope:** prompt-level instruction precedence is separate from filesystem authority; indexed/search data and tool output remain untrusted inputs.
- **Unknowns:** exact ordering within categories, compactor model/prompt/trigger/fidelity, retrieval ranking, provenance in summaries, general-chat memory.

## 12. State, persistence, and restart {#state-persistence-restart}

- **Status:** `PARTIAL`.
- **Finding / claims:** CLI conversations/transcripts can persist and resume; editor checkpoints are local, non-Git snapshots; subagent checkpoints and durable goals can survive resume according to current docs/changelog. {C-013 FACT MEDIUM; S-004,S-009,S-024} Cloud runs persist encrypted conversation state/artifacts and snapshots, with detailed docs stating indefinite default conversation retention and rolling 90-day snapshot inactivity retention. {C-014 FACT MEDIUM; S-005,S-006,S-007,S-021} Automation memory persists outside the working filesystem and is editable/deletable. {C-031 FACT MEDIUM; S-030}
- **Evidence:** `S-004`–`S-007`, `S-009`, `S-021`, `S-024`, `S-030`.
- **Boundary / scope:** local transcript/checkpoint storage, cloud backend storage, VM snapshot layer, and SCM history are distinct stores.
- **Unknowns:** exact local paths/schemas/migrations/locking for every client, corruption recovery, deletion proof, and the retention contradiction C-038.

## 13. Concurrency, worktree, and isolation {#concurrency-worktree-isolation}

- **Status:** `PARTIAL`.
- **Finding / claims:** Subagents can run concurrently and share the checkout by default, creating overwrite risk; requested isolation uses separate Git worktrees/branches or cloud VM clones, while `/best-of-n` does not merge automatically. {C-015 FACT MEDIUM; S-005,S-015,S-022} Cloud API permits one active run per durable agent (`409 agent_busy`) and provides separate agents for parallelism. {C-034 FACT HIGH; S-021}
- **Evidence:** `S-005`, `S-015`, `S-021`, `S-022`.
- **Boundary / scope:** isolation keys include local worktree path/branch, cloud agent ID/run ID/VM, and team/repository access; machine-wide worktree cleanup may delete externally created old worktrees.
- **Unknowns:** lock implementation, race/conflict semantics, merge strategy, maximum concurrency, deterministic scheduling, cleanup during active work.

## 14. Permissions, authority, and sandbox {#permissions-authority-sandbox}

- **Status:** `PARTIAL`.
- **Finding / claims:** Local Run Modes range from sandbox/classifier review to unsandboxed Run Everything; macOS uses Seatbelt and Linux uses Landlock/seccomp when available, but Auto-review is explicitly not a security boundary. Cloud Agents do not use local Run Modes and auto-run commands without per-action approval. {C-016 FACT MEDIUM; S-004,S-006,S-008,S-016} Hooks can deny/modify actions, but failures are fail-open unless `failClosed: true`; some hooks are unavailable in cloud early-read-only/MCP phases. {C-017 FACT MEDIUM; S-017}
- **Authority matrix:**

| Actor/surface | Default documented authority | Enforcement / handoff |
| --- | --- | --- |
| Local Agent | workspace/tool authority varies by Run Mode | allowlist, sandbox, classifier, hard protections, user prompts |
| `--force` / Run Everything | direct write/shell without confirmation unless explicitly denied | admin/hard policy may still deny; sandbox absent in Run Everything |
| Cloud Agent | full VM terminal/tool iteration and default internet | dedicated VM/network policy; no per-action prompt; draft PR/human merge |
| MCP server | external code/data authority of configured server | local Run Mode/admin allowlist/network mode; server output untrusted |
| Automation | enabled tools under user or shared service-account identity | trigger/config/team scope; external side effects possible |

- **Evidence:** `S-004`, `S-006`, `S-008`, `S-016`, `S-017`, `S-030`.
- **Unknowns:** actual enforcement/bypass resistance and sandbox escape assumptions are C-023.

## 15. Evidence and observability {#evidence-observability}

- **Status:** `PARTIAL`.
- **Finding / claims:** CLI JSON/NDJSON exposes session/tool-call/request correlation, status and timings; Cloud API exposes run events, terminal state, artifacts, Git metadata and SSE resume IDs; hooks expose conversation/generation/tool IDs and transcripts. {C-018 FACT MEDIUM; S-017,S-020,S-021} Checkpoints, diffs, Agent Review, artifacts, signed commits and draft PRs provide review evidence but not independent proof of correctness. {C-036 FACT MEDIUM; S-007,S-009,S-022,S-028,S-029}
- **Evidence:** `S-007`, `S-009`, `S-017`, `S-020`–`S-022`, `S-028`, `S-029`.
- **Boundary / scope:** evidence owner varies among local user, Cursor backend/team admin, SCM, and hook sink; Git metadata in API is agent-scoped rather than per-run.
- **Unknowns:** tamper resistance, complete redaction, dropped-event rates, export retention, evidence for early cloud read-only turns and hidden provider calls.

## 16. Resource, token, and cost accounting {#resource-token-cost-accounting}

- **Status:** `PARTIAL`.
- **Finding / claims:** Pricing is model/token based; Cloud API reports per-run input/output/cache-write/cache-read totals, while subagents consume independent contexts and can multiply usage. {C-019 FACT MEDIUM; S-015,S-021,S-023,S-030}
- **Evidence:** `S-015`, `S-021`, `S-023`, `S-030`.
- **Boundary / scope:** reporting is separate from provider invoices; cloud spend limits and account usage pools are policy/billing controls, not proven per-run compute caps.
- **Unknowns:** provider reconciliation, retry/cache attribution under every surface, CPU/memory/process limits, hard per-run budgets, disputed/missing-usage handling.

## 17. Failure, cancellation, and retry {#failure-cancellation-retry}

- **Status:** `PARTIAL`.
- **Finding / claims:** Current docs specify non-zero CLI failures, possibly unterminated streams, MCP-localized failures, automatic transport/stall retries with backoff/checkpoint recovery, subagent error return, and terminal API cancellation followed by a new run to continue. {C-020 FACT MEDIUM; S-015,S-016,S-020,S-021,S-024} Conflicting headless documentation prevents a firm claim about default write authority without `--force`. {C-030 UNKNOWN N/A; S-018,S-019,S-020}
- **Evidence:** `S-015`, `S-016`, `S-018`–`S-021`, `S-024`.
- **Boundary / scope:** cancellation direction is user/API → active turn/run; retry owner can be CLI/backend; Git/filesystem side effects may precede failure.
- **Unknowns:** retry counts/backoff maxima, command timeout defaults, cleanup of process trees/partial writes, retry idempotency/cost, crash recovery.

## 18. Install, update, and release {#install-update-release}

- **Status:** `PARTIAL`.
- **Finding / claims:** Official install paths pipe a mutable installer to shell/PowerShell, verify with `agent --version`, and auto-update by default; the captured installer resolves one versioned archive and symlinks `agent`/`cursor-agent`. {C-001 FACT HIGH; S-001,S-003} No published checksum/signature/source commit/SBOM/reproducible-build evidence accompanied the installer snapshot. {C-021 UNKNOWN N/A; S-001,S-002,S-003,S-024} API v1 is public beta and may change; CLI release notes document in-place/background update and protection for running versions. {C-039 FACT MEDIUM; S-021,S-024}
- **Evidence:** `S-001`–`S-003`, `S-021`, `S-024`.
- **Boundary / scope:** exact Darwin/arm64 artifact is pinned only by researcher-computed hash; Windows/Linux artifacts were not downloaded.
- **Unknowns:** signing/notarization, official checksums, rollback channel, migration compatibility, source traceability.

## 19. Tests and qualification {#tests-qualification}

- **Status:** `UNKNOWN`.
- **Finding / claims:** No public production source repository, test suite, CI matrix, coverage report, release gate, or artifact qualification report for the proprietary CLI/cloud loop was found in the official-doc/changelog/archive-metadata universe. {C-022 UNKNOWN N/A; S-002,S-024}
- **Evidence:** `S-002`, `S-024`.
- **Boundary / scope:** vendor changelog fixes and documentation examples are not tests; this research did not execute target code.
- **Unknowns:** unit/integration/e2e/security test depth, provider/platform matrix, negative tests, release qualifications.

## 20. Security {#security}

- **Status:** `PARTIAL`.
- **Finding / claims:** Docs state dedicated Firecracker microVMs, separate AWS account, encryption, signed commits, network controls, local OS sandboxes, admin policies, and vulnerability reporting, while also warning that cloud auto-run plus network access creates prompt-injection/exfiltration risk. {C-016 FACT MEDIUM; S-006,S-008} Actual isolation, secret-redaction bypass resistance, deletion, provider ZDR, sandbox escape resistance, and policy enforcement were not independently tested. {C-023 UNKNOWN N/A; S-006,S-007,S-008,S-013,S-025,S-027} Official retention pages conflict. {C-038 UNKNOWN N/A; S-006,S-007,S-027}
- **Evidence:** `S-006`–`S-008`, `S-013`, `S-025`, `S-027`.
- **Boundary / scope:** vendor policy/architecture statements are distinguished from verified enforcement; `.cursorignore` is not terminal/MCP authorization.
- **Unknowns:** threat model completeness, tenant escape resistance, path/symlink handling, insider controls, supply-chain attestations, incident evidence.

## 21. Strengths {#strengths}

- **Status:** `RESEARCH_INTERPRETATION`.
- **Finding / claims:** Within documented boundaries, Cursor offers unusually explicit operator handoffs across CLI/editor/cloud/API plus worktree/PR/review surfaces; this is a comparison strength because authority and review can move through named interfaces rather than an implicit daemon. {C-024 INFERENCE MEDIUM; S-004,S-005,S-021,S-022,S-028}
- **Fact basis:** C-004, C-005, C-032, C-034.
- **Evidence:** `S-004`, `S-005`, `S-021`, `S-022`, `S-028`.
- **Boundary / scope:** strength concerns documented interface breadth and handoff visibility, not correctness, security, or suitability.
- **Unknowns:** practical reliability and cognitive overhead without credentialed observation.

## 22. Liabilities {#liabilities}

- **Status:** `RESEARCH_INTERPRETATION`.
- **Finding / claims:** Nonuniform controls are a liability: local/cloud approval differs, hooks fail open by default, ignore files do not constrain shell/MCP, and retention statements conflict; a policy assumed portable across surfaces can silently lose coverage. {C-025 INFERENCE HIGH; S-006,S-008,S-013,S-017,S-027}
- **Fact basis:** C-016, C-017, C-038.
- **Trigger / consequence / mitigation:** moving execution surfaces or relying on default hook/ignore behavior can broaden authority or persistence; upstream mitigations include fail-closed hooks, network allowlists, team policies, dedicated worktrees/VMs and human PR review.
- **Evidence:** `S-006`, `S-008`, `S-013`, `S-017`, `S-027`.
- **Boundary / scope:** no security-acceptance conclusion.
- **Unknowns:** actual enforcement quality remains C-023.

## 23. Transferable patterns {#transferable-patterns}

- **Status:** `RESEARCH_ONLY_CANDIDATES`.
- **Finding / claims:** **CANDIDATE — explicit durable agent/run and workspace/branch handoff.** Minimal mechanism: separate durable conversation identity from serialized run identity, surface cancellation/stream expiry, isolate side effects by branch/worktree, and require explicit apply/PR review. {C-026 INFERENCE MEDIUM; S-005,S-021,S-022,S-028} Prerequisites are durable IDs, state store, SCM/worktree lifecycle, and human review; adaptation risk is stale state/merge conflict.
- **Finding / claims:** **CONDITIONAL — typed lifecycle interception with declared failure mode.** JSON/stdio events around tool/subagent/compact/stop boundaries are transferable only if enforcement hooks default fail-closed where consequential and coverage gaps are explicit. {C-027 INFERENCE MEDIUM; S-017,S-020,S-021} Prerequisites are stable schemas, ordering, bounded timeouts, redaction and audit sinks.
- **Fact basis:** C-005, C-015, C-017, C-018, C-034, C-036.
- **Evidence:** `S-005`, `S-017`, `S-020`–`S-022`, `S-028`.
- **Boundary / scope:** candidates are research inputs, not approved design.
- **Unknowns:** downstream fit with Curiosity ADRs belongs to synthesis owner.

## 24. Rejected patterns / CURIOSITY_NO_GO {#rejected-patterns-curiosity-no-go}

- **Status:** `REJECTED_RESEARCH_THREADS`.
- **Finding / claims:** `CURIOSITY_NO_GO` applies to decompiling the proprietary bundle, extracting hidden prompts/non-public APIs, credentialed competitive benchmarks, exploit/bypass testing, leak use, request-gated-report pursuit, and destructive cleanup probes: they violate explicit scope/legal/safety constraints or have nonpositive marginal evidence for boundary architecture. {C-028 INFERENCE HIGH; S-002,S-026}
- **Evidence / failure mode:** C-002 and the user/contract boundary; such work could violate terms, expose credentials, create side effects, or misrepresent inaccessible internals.
- **Reopen conditions:** separate legal/security authorization, isolated test account/environment, explicit probe plan and an in-frame decision gap; leaked/decompiled evidence remains excluded.
- **Boundary / scope:** rejection is snapshot/research-scenario bounded.
- **Unknowns:** none; no adoption rejection is implied.

## 25. Adversarial probes {#adversarial-probes}

- **Status:** `COMPLETE_WITH_UNKNOWNS`.
- **Finding / claims:** Dynamic behavior probes were not run because no no-secret test account and approved disposable target-execution environment were available; passive documentation, archive hashing/listing, and URL checks cannot establish runtime enforcement. {C-029 UNKNOWN N/A; S-001,S-002,S-031} All 31 retained Cursor URLs returned HTTP 200 in the bounded validation run. {C-042 FACT HIGH; S-031}
- **Evidence:** `S-001`, `S-002`, `S-031`.
- **Environment:** macOS arm64; zsh/curl; no Cursor credentials; target artifact never executed; network used only for declared passive retrieval; archive inspected statically under the approved temporary directory.

| Probe | Expected safe behavior defined before probe | Result | Actual bounded observation | Claims | Sources |
| --- | --- | --- | --- | --- | --- |
| P-01 startup/no-op | Help/no-op should disclose or avoid writes/network/credential reads. | `INCONCLUSIVE` | Installer statically declares version-directory writes/download; executable not started. | C-001,C-029 | S-001,S-002 |
| P-02 denial/bypass | Denied capabilities remain denied through aliases/subagents/MCP. | `NOT_RUN_UNSAFE` | Docs expose layered controls but no authorized enforcement target. | C-016,C-023,C-029 | S-008,S-016,S-017 |
| P-03 malformed/oversized | Reject invalid/oversized schemas before side effects. | `NOT_RUN_UNSAFE` | API limits are documented; host validation was not exercised. | C-008,C-029 | S-016,S-017,S-021 |
| P-04 cancel/timeout | Cancellation reaches children/processes and records final partial state. | `NOT_RUN_UNSAFE` | Documented terminal API cancel and CLI interrupt; cleanup not observed. | C-020,C-029 | S-020,S-021,S-024 |
| P-05 retry/duplicate | Retry preserves idempotency and attributes duplicate cost. | `INCONCLUSIVE` | Client agent ID can detect duplicate create; tool/file idempotency remains unknown. | C-019,C-020,C-029 | S-021,S-024 |
| P-06 collision | Concurrent names/worktrees/sessions do not bleed or overwrite. | `NOT_RUN_UNSAFE` | Shared-checkout overwrite risk and optional isolation are documented only. | C-015,C-029 | S-015,S-022 |
| P-07 crash/restart | Restart recovers valid checkpoint or reports bounded loss. | `NOT_RUN_UNSAFE` | Resume/checkpoint claims found; crash recovery unobserved. | C-013,C-029 | S-004,S-009,S-024 |
| P-08 provider/network down | Preserve auth/rate/stream errors and bounded retry/fallback. | `NOT_RUN_UNSAFE` | Retry policy documented; provider fallback/receipts unknown. | C-009,C-020,C-029 | S-020,S-023,S-024 |
| P-09 instruction injection | Repository/tool text remains data and cannot expand authority. | `NOT_RUN_UNSAFE` | Cloud docs explicitly acknowledge exfiltration risk; no exploit attempted. | C-016,C-023,C-029 | S-006,S-007,S-013 |
| P-10 filesystem abuse | Canonicalize traversal/symlinks and enforce workspace boundary. | `NOT_RUN_UNSAFE` | Sandbox/path policy documented; bypass resistance untested. | C-016,C-023,C-029 | S-008,S-013 |
| P-11 usage disagreement | Preserve estimates/provider totals/retries and enforce budget. | `NOT_RUN_UNSAFE` | Per-run token fields documented; reconciliation/budget enforcement unknown. | C-019,C-029 | S-021,S-023 |
| P-12 pin/rollback | Resolve immutable artifact with integrity and support failed-update rollback. | `INCONCLUSIVE` | Versioned archive re-resolved once and researcher hash captured; no vendor signature/source/rollback proof. | C-001,C-021,C-029 | S-001,S-002,S-003 |
| P-13 claimed absence | Challenge aliases/config/plugins/alternate entrypoints in defined universe. | `INCONCLUSIVE` | Docs + archive metadata searched; no global absence inferred for proprietary internals. | C-040,C-041,C-029 | S-002,S-018,S-026 |
| P-14 evidence loss/forgery | Denied/failed/cancelled actions remain correlated, redacted and unspoofed. | `NOT_RUN_UNSAFE` | Schemas/correlation documented; tamper resistance and early-cloud coverage untested. | C-017,C-018,C-023,C-029 | S-007,S-017,S-020,S-021 |

**URL-validation command:**

```bash
grep -E '^  url: "https://([^.]+\.)?cursor\.com' research/harnesses/cursor-agent.md \
  | sed -E 's/^  url: "([^"]+)"$/\1/' | sort -u \
  | while IFS= read -r u; do curl -L --max-time 60 -sS -o /dev/null -w '%{http_code}\t%{url_effective}\n' "$u"; done
```

- **Boundary / unknowns:** dynamic probes require a separately authorized disposable no-secret account and environment.

## 26. Claims register {#claims-register}

```yaml
- claim_id: C-001
  section: identity-snapshot
  statement: "The passive 2026-08-24 installer snapshot selected Cursor Agent release 2026.08.11-e8db854, whose Darwin/arm64 archive hashes to sha256:46044d6d7bcbd7b49a0cf1cd01aa4ca79aaa2ea5f2c7a32965fc0ebe29841790 and identifies a private @anysphere/agent-cli-runtime package."
  classification: FACT
  confidence: HIGH
  scope: "Cursor standalone CLI Darwin/arm64 installer/artifact; no execution; excludes other platforms and hosted service."
  source_ids: [S-001, S-002, S-003]
  fact_dependencies: []
  method: "Passive installer retrieval; archive SHA-256, byte count, tar member listing, and package.json extraction without execution/decompilation."
  counterevidence: "none found in captured installer, archive metadata, and installation docs"
  adversarial_status: SUPPORTED
- claim_id: C-002
  section: provenance-license
  statement: "Anysphere's 2026-08-13 Terms grant limited Service access/use, reserve Service intellectual property, and restrict reverse engineering and probing subject to applicable law."
  classification: FACT
  confidence: HIGH
  scope: "Public individual Terms of Service; an organization-specific MSA may supersede them."
  source_ids: [S-026]
  fact_dependencies: []
  method: "Read official Terms sections 1.1, 1.5, and 5.1."
  counterevidence: "none found in the official Terms page"
  adversarial_status: NOT_APPLICABLE:legal-text-observation
- claim_id: C-003
  section: repository-package-map
  statement: "The pinned archive contains a bundled dist-package tree with generated JavaScript chunks, native modules, bundled executables, and only a private two-field top-level package manifest."
  classification: FACT
  confidence: HIGH
  scope: "Pinned Darwin/arm64 archive member/manifest metadata; presence does not establish reachability."
  source_ids: [S-002]
  fact_dependencies: []
  method: "Static tar listing and package.json extraction only."
  counterevidence: "none found in pinned archive listing"
  adversarial_status: SUPPORTED
- claim_id: C-004
  section: executable-entrypoints
  statement: "Official docs expose interactive/headless CLI, authentication, session, MCP, sandbox, worker, update, worktree, and hidden ACP entrypoints."
  classification: FACT
  confidence: HIGH
  scope: "Documented Cursor CLI 2026-08-24 surface; runtime reachability not independently executed."
  source_ids: [S-004, S-018, S-019]
  fact_dependencies: []
  method: "Compared official CLI overview, parameter, and headless references."
  counterevidence: "none found in retained CLI docs"
  adversarial_status: NOT_PROBED
- claim_id: C-005
  section: control-data-flow
  statement: "Cursor documents explicit local-to-cloud transfer and cloud-to-SCM branch/PR handoff across CLI, editor, web, and mobile surfaces."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented handoff intent; transfer runtime and atomicity not observed."
  source_ids: [S-004, S-005, S-024, S-028]
  fact_dependencies: []
  method: "Triangulated CLI overview, Cloud Agent overview, changelog, and Agents Window docs."
  counterevidence: "none found; exact transferred payload is not documented"
  adversarial_status: NOT_PROBED
- claim_id: C-006
  section: module-extension-boundaries
  statement: "Cursor documents skills, MCP, hooks, plugins, rules, and custom subagents as extension boundaries around a proprietary core."
  classification: FACT
  confidence: HIGH
  scope: "Public extension surfaces; excludes internal plugin implementation and marketplaces not inspected."
  source_ids: [S-011, S-014, S-016, S-017, S-018, S-024]
  fact_dependencies: []
  method: "Cross-read official configuration/protocol references."
  counterevidence: "none found in retained extension docs"
  adversarial_status: NOT_PROBED
- claim_id: C-007
  section: agent-interface
  statement: "Cursor publicly describes Agent as instructions, tools, and a selected model with per-model tuning, but does not publish the operative loop state machine."
  classification: FACT
  confidence: MEDIUM
  scope: "Official abstraction/documentation; no hidden prompt or implementation claim."
  source_ids: [S-009, S-010]
  fact_dependencies: []
  method: "Read official Agent overview and prompting documentation."
  counterevidence: "none found in retained docs"
  adversarial_status: NOT_PROBED
- claim_id: C-008
  section: tool-interface
  statement: "Official docs identify built-in tool families and expose JSON tool-call inputs, outputs, IDs, approvals, and hook interception at selected boundaries."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented schemas/examples; complete built-in schemas and runtime validation excluded."
  source_ids: [S-009, S-016, S-017, S-020]
  fact_dependencies: []
  method: "Compared Agent, MCP, hooks, and CLI output references."
  counterevidence: "none found; docs permit tool-specific/additive fields"
  adversarial_status: NOT_PROBED
- claim_id: C-009
  section: provider-interface
  statement: "The actual provider adapter, per-request provider identity, transport, fallback, and provider-retention enforcement are not publicly traceable from retained evidence."
  classification: UNKNOWN
  confidence: N/A
  scope: "Cursor CLI/editor/cloud model-provider boundary as of cutoff."
  source_ids: [S-021, S-023, S-027]
  fact_dependencies: []
  method: "attempted_methods=official API/model/pricing/privacy documentation review; blocker=proprietary backend and no credentials/provider receipt; impact=actual provider, fallback, and data handling cannot be compared at execution level; available_evidence=S-021,S-023,S-027; next_probe=authorized run with explicit model plus Cursor/provider request and retention receipts"
  counterevidence: "none that exposes operative adapter; routing policy exists without execution receipt"
  adversarial_status: NOT_PROBED
- claim_id: C-010
  section: model-interface
  statement: "Cursor documents explicit model/parameter choice, Auto routing modes, user-team-system default resolution, and policy/plan-driven subagent fallback."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented model-selection policy; execution identity unverified."
  source_ids: [S-010, S-015, S-021, S-023, S-024]
  fact_dependencies: []
  method: "Triangulated prompting, subagent, current API, pricing, and changelog pages."
  counterevidence: "none found; exact fallback target remains unstated"
  adversarial_status: NOT_PROBED
- claim_id: C-011
  section: context-interface
  statement: "Cursor documents fixed-window context categories and summary compression of older conversation near capacity."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented editor/Agent context interface; compactor internals excluded."
  source_ids: [S-010, S-017]
  fact_dependencies: []
  method: "Read context usage and preCompact hook schemas."
  counterevidence: "none found; exact threshold/model is not specified"
  adversarial_status: NOT_PROBED
- claim_id: C-012
  section: context-interface
  statement: "Rules and indexing provide scoped prompt/retrieval context, while .cursorignore explicitly does not prevent terminal or MCP access."
  classification: FACT
  confidence: MEDIUM
  scope: "Official rules/search/ignore behavior; encryption implementation unverified."
  source_ids: [S-011, S-012, S-013]
  fact_dependencies: []
  method: "Compared official rules, search, and ignore references."
  counterevidence: "none; docs explicitly warn ignore is incomplete protection"
  adversarial_status: NOT_PROBED
- claim_id: C-013
  section: state-persistence-restart
  statement: "Cursor documents resumable CLI conversations/transcripts, local non-Git checkpoints, subagent checkpoints, and durable CLI goals."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented local/editor state behavior; storage implementation not inspected."
  source_ids: [S-004, S-009, S-024]
  fact_dependencies: []
  method: "Read overview/checkpoint docs and current CLI changelog."
  counterevidence: "none found; rollout gates may limit durable goals"
  adversarial_status: NOT_PROBED
- claim_id: C-014
  section: state-persistence-restart
  statement: "Detailed cloud docs specify persistent conversation/artifact state and rolling 90-day inactive VM snapshots, with indefinite conversation retention by default."
  classification: FACT
  confidence: MEDIUM
  scope: "Vendor-documented Cloud Agent storage; enforcement/deletion not independently verified."
  source_ids: [S-005, S-006, S-007, S-021]
  fact_dependencies: []
  method: "Compared Cloud overview, security/network, security architecture, and API lifecycle docs."
  counterevidence: "S-027 uses less precise deletion-after-completion wording; see C-038"
  adversarial_status: CHALLENGED
- claim_id: C-015
  section: concurrency-worktree-isolation
  statement: "Cursor documents parallel subagents sharing a checkout by default and optional isolation via worktrees/branches or dedicated cloud clones."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented concurrency/isolation behavior; race tests not run."
  source_ids: [S-005, S-015, S-022]
  fact_dependencies: []
  method: "Read Cloud, subagent, and worktree docs."
  counterevidence: "none; shared-checkout overwrite risk is explicitly documented"
  adversarial_status: NOT_PROBED
- claim_id: C-016
  section: permissions-authority-sandbox
  statement: "Local Run Modes use approvals/sandbox/classifier according to mode, whereas Cloud Agents auto-run actions without local Run Modes or per-action prompts."
  classification: FACT
  confidence: MEDIUM
  scope: "Vendor-documented policy and implementations; enforcement not independently tested."
  source_ids: [S-004, S-006, S-008, S-016]
  fact_dependencies: []
  method: "Compared CLI, cloud security, local Run Modes, and MCP approval docs."
  counterevidence: "S-004's broad foreground-every-command wording conflicts with current S-008 modes; S-008 is narrower/current"
  adversarial_status: CHALLENGED
- claim_id: C-017
  section: permissions-authority-sandbox
  statement: "Cursor hooks can intercept selected loop events but fail open on errors by default unless failClosed is configured, and cloud hook coverage is incomplete."
  classification: FACT
  confidence: MEDIUM
  scope: "Official hook schema/coverage; runtime ordering and bypass resistance unverified."
  source_ids: [S-017]
  fact_dependencies: []
  method: "Read hook execution, exit-code, failClosed, and cloud-support tables."
  counterevidence: "none found; docs explicitly enumerate unavailable cloud hooks"
  adversarial_status: NOT_PROBED
- claim_id: C-018
  section: evidence-observability
  statement: "CLI, Cloud API, and hooks expose documented correlation IDs, tool/run events, timings, transcripts, artifacts, and terminal status."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented evidence schemas; completeness/tamper resistance unverified."
  source_ids: [S-017, S-020, S-021]
  fact_dependencies: []
  method: "Compared hooks common schema, CLI output events, and Cloud API run/SSE schemas."
  counterevidence: "S-021 states Git snapshot is agent-scoped and streams can expire"
  adversarial_status: NOT_PROBED
- claim_id: C-019
  section: resource-token-cost-accounting
  statement: "Cursor documents model/token pricing and per-run input/output/cache token totals, while subagent contexts consume usage independently."
  classification: FACT
  confidence: MEDIUM
  scope: "Vendor reporting/pricing; provider-bill reconciliation not observed."
  source_ids: [S-015, S-021, S-023, S-030]
  fact_dependencies: []
  method: "Compared subagent cost notes, API usage endpoint, pricing, and automation billing."
  counterevidence: "none found; hard per-run budget is not documented"
  adversarial_status: NOT_PROBED
- claim_id: C-020
  section: failure-cancellation-retry
  statement: "Cursor documents nonzero/possibly unterminated CLI failures, localized MCP failure, transport retries, subagent error return, and terminal Cloud API run cancellation."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented failure semantics; process/file cleanup and retry counts unverified."
  source_ids: [S-015, S-016, S-020, S-021, S-024]
  fact_dependencies: []
  method: "Compared failure FAQs, output contract, current API cancellation, and changelog retry notes."
  counterevidence: "none found; changelog behavior is vendor-reported"
  adversarial_status: NOT_PROBED
- claim_id: C-021
  section: install-update-release
  statement: "Official checksum, signature, SBOM, reproducible-build, source-commit, and rollback evidence for the pinned CLI artifact was not found."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned Darwin/arm64 artifact and official install/release universe."
  source_ids: [S-001, S-002, S-003, S-024]
  fact_dependencies: []
  method: "attempted_methods=installer inspection, archive metadata/license-path listing, installation docs and changelog review; blocker=no published vendor checksum/signature/SBOM/source repository in retained universe; impact=supply-chain and artifact-to-source assurance cannot be compared; available_evidence=S-001,S-002,S-003,S-024; next_probe=vendor-published signed manifest, SBOM, source commit and rollback procedure"
  counterevidence: "none found in defined installer/archive/docs/changelog universe"
  adversarial_status: CHALLENGED
- claim_id: C-022
  section: tests-qualification
  statement: "Public qualification evidence for the proprietary production loop was not found in the official documentation, changelog, or package-metadata universe."
  classification: UNKNOWN
  confidence: N/A
  scope: "Production CLI/editor/cloud loop; excludes docs examples and marketing claims."
  source_ids: [S-002, S-024]
  fact_dependencies: []
  method: "attempted_methods=official docs/changelog review and static package metadata/listing; blocker=no public source repository/test suite/CI or qualification report; impact=behavior and regression coverage cannot be independently assessed; available_evidence=S-002,S-024; next_probe=vendor test matrix, release qualification report, or public snapshot"
  counterevidence: "none found in defined official universe"
  adversarial_status: NOT_PROBED
- claim_id: C-023
  section: security
  statement: "Actual sandbox, VM, policy, redaction, deletion, and model-retention enforcement remain unverified."
  classification: UNKNOWN
  confidence: N/A
  scope: "Local and cloud consequential security controls."
  source_ids: [S-006, S-007, S-008, S-013, S-025, S-027]
  fact_dependencies: []
  method: "attempted_methods=official security/control/privacy documentation and static package inspection; blocker=proprietary enforcement, no credentials, no authorized exploit/audit access; impact=no security-acceptance or bypass-resistance conclusion; available_evidence=S-006,S-007,S-008,S-013,S-025,S-027; next_probe=authorized vendor audit evidence and disposable sandbox/tenant enforcement test"
  counterevidence: "vendor docs explicitly warn classifier and ignore controls are not complete security boundaries"
  adversarial_status: NOT_PROBED
- claim_id: C-024
  section: strengths
  statement: "The documented breadth and explicitness of Cursor's operator handoffs is a comparison strength for interface visibility."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Interface visibility only; excludes correctness/security/adoption."
  source_ids: [S-004, S-005, S-021, S-022, S-028]
  fact_dependencies: [C-004, C-005, C-032, C-034]
  method: "Reasoning=multiple named entrypoints terminate in explicit session/run/worktree/branch/PR/review boundaries; assumption=documented surfaces are available to scoped users; alternative=surface breadth may increase operator complexity rather than visibility."
  counterevidence: "C-030 and public-beta instability constrain automation confidence"
  adversarial_status: SUPPORTED
- claim_id: C-025
  section: liabilities
  statement: "Nonuniform approval, hook, ignore, and retention semantics create a cross-surface policy-coverage liability."
  classification: INFERENCE
  confidence: HIGH
  scope: "Documented local/cloud/automation boundaries; actual incidents not claimed."
  source_ids: [S-006, S-008, S-013, S-017, S-027]
  fact_dependencies: [C-014, C-016, C-017]
  method: "Reasoning=controls differ or disappear across surfaces, so a policy assumed portable can lose coverage; assumption=operators reuse policy expectations; alternative=central admin controls may compensate in configured enterprise deployments."
  counterevidence: "team/admin policies can narrow some differences but do not erase documented hook/retention gaps"
  adversarial_status: SUPPORTED
- claim_id: C-026
  section: transferable-patterns
  statement: "Separating durable agent identity from serialized run identity and explicit workspace/branch review handoff is a transferable candidate pattern."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Research candidate; requires downstream architecture evaluation."
  source_ids: [S-005, S-021, S-022, S-028]
  fact_dependencies: [C-005, C-015, C-034, C-036]
  method: "Reasoning=separate IDs/lifecycles expose concurrency, cancellation, persistence and review boundaries; assumption=downstream SCM/worktree support; alternative=a simpler single-run harness may not need durable identity."
  counterevidence: "API is beta and Git evidence is agent-scoped"
  adversarial_status: SUPPORTED
- claim_id: C-027
  section: transferable-patterns
  statement: "Typed lifecycle interception is transferable only conditionally when consequential hooks fail closed and coverage gaps are explicit."
  classification: INFERENCE
  confidence: MEDIUM
  scope: "Research conditional pattern; no design approval."
  source_ids: [S-017, S-020, S-021]
  fact_dependencies: [C-017, C-018]
  method: "Reasoning=typed events enable policy/evidence, but default fail-open and missing cloud events prevent unconditional enforcement; assumption=stable schemas and bounded hook runtime; alternative=hard-coded policy gates may be safer."
  counterevidence: "S-017 documents failClosed and managed precedence as mitigations"
  adversarial_status: SUPPORTED
- claim_id: C-028
  section: rejected-patterns-curiosity-no-go
  statement: "Decompilation, hidden-prompt extraction, credentialed benchmarking, exploit testing, leaks, and destructive probes are CURIOSITY_NO_GO for this research scope."
  classification: INFERENCE
  confidence: HIGH
  scope: "This dossier's legal/safety/decision frame only."
  source_ids: [S-002, S-026]
  fact_dependencies: [C-002, C-037]
  method: "Reasoning=the methods violate explicit user/contract boundaries or add nonpositive decision evidence relative to passive primary sources; assumption=no separate authorization; alternative=an authorized security engagement would use a different scope."
  counterevidence: "none within assigned authority"
  adversarial_status: NOT_APPLICABLE:rejected-before-execution
- claim_id: C-029
  section: adversarial-probes
  statement: "Runtime adversarial behavior remains unknown because only passive no-credential static and documentation probes were safely available."
  classification: UNKNOWN
  confidence: N/A
  scope: "Required P-01 through P-14 runtime effects."
  source_ids: [S-001, S-002, S-031]
  fact_dependencies: []
  method: "attempted_methods=passive installer/artifact metadata inspection, documentation comparison, URL/status/hash validation; blocker=no no-secret test account and no approved disposable target-execution environment; impact=runtime behavior, enforcement, cleanup and negative paths cannot be claimed; available_evidence=S-001,S-002,S-031; next_probe=separately authorized disposable account/VM with denied secrets/network and captured outputs"
  counterevidence: "none; static/docs evidence cannot establish runtime"
  adversarial_status: NOT_PROBED
- claim_id: C-030
  section: failure-cancellation-retry
  statement: "Default headless write authority is unresolved because the parameter page says print mode has write/shell tools while the headless page says writes are only applied with --force."
  classification: UNKNOWN
  confidence: N/A
  scope: "CLI print mode at retained live documentation snapshot."
  source_ids: [S-018, S-019, S-020]
  fact_dependencies: []
  method: "attempted_methods=compared official parameters, headless, and output examples; blocker=credible official wording conflict and target executable not safely run; impact=automation's default mutation boundary is uncertain; available_evidence=S-018,S-019,S-020; next_probe=pinned disposable no-credential print-mode write request with --force absent/present and denied network"
  counterevidence: "S-018 conflicts with S-019; S-020 examples include write events without resolving flag state"
  adversarial_status: CHALLENGED
- claim_id: C-031
  section: context-interface
  statement: "Cloud Automation memories persist named notes outside the working filesystem and are enabled, editable, and deletable through automation configuration."
  classification: FACT
  confidence: MEDIUM
  scope: "Cloud Automations only; not ordinary Agent chats."
  source_ids: [S-030]
  fact_dependencies: []
  method: "Read official Automations memory and permissions sections."
  counterevidence: "none; docs warn untrusted inputs can poison memory"
  adversarial_status: NOT_PROBED
- claim_id: C-032
  section: executable-entrypoints
  statement: "Cursor exposes classic IDE Agent and a separate Agents Window that manages local, worktree, cloud, remote, diff, commit, and PR workflows."
  classification: FACT
  confidence: HIGH
  scope: "Official editor/Agents Window documentation."
  source_ids: [S-009, S-028]
  fact_dependencies: []
  method: "Read Agent and Agents Window overviews."
  counterevidence: "none found"
  adversarial_status: NOT_PROBED
- claim_id: C-033
  section: control-data-flow
  statement: "Cursor describes Cloud Agent execution as a dedicated Firecracker microVM lifecycle in a separate AWS account ending in draft-PR human review."
  classification: FACT
  confidence: MEDIUM
  scope: "Vendor architecture statement; isolation not independently verified."
  source_ids: [S-005, S-007]
  fact_dependencies: []
  method: "Read Cloud overview and security architecture lifecycle/isolation sections."
  counterevidence: "none found; C-023 preserves enforcement unknown"
  adversarial_status: NOT_PROBED
- claim_id: C-034
  section: executable-entrypoints
  statement: "Cloud API v1 separates durable agents from serialized per-prompt runs and exposes create, follow-up, stream, cancel, usage, artifact, archive, and delete operations."
  classification: FACT
  confidence: HIGH
  scope: "Public-beta API documentation; runtime not called."
  source_ids: [S-021]
  fact_dependencies: []
  method: "Read current endpoint reference and schemas."
  counterevidence: "API is public beta and may change"
  adversarial_status: NOT_PROBED
- claim_id: C-035
  section: agent-interface
  statement: "Subagents use isolated context, explicit parent prompts and inherited tools, with documented foreground/background, model, resume, and worktree/cloud isolation options."
  classification: FACT
  confidence: MEDIUM
  scope: "Official subagent/search/skills docs; actual scheduler unverified."
  source_ids: [S-012, S-014, S-015]
  fact_dependencies: []
  method: "Read Explore, skills, and subagent contracts."
  counterevidence: "shared checkout is default; model may be overridden"
  adversarial_status: NOT_PROBED
- claim_id: C-036
  section: evidence-observability
  statement: "Cursor documents local checkpoints/diffs, worktree review/apply, Agent Review, artifacts, and PRs as distinct review and rollback evidence surfaces."
  classification: FACT
  confidence: MEDIUM
  scope: "Documented evidence/review surfaces; correctness not established."
  source_ids: [S-007, S-009, S-022, S-028, S-029]
  fact_dependencies: []
  method: "Compared checkpoint, cloud artifact, worktree, Agents Window, and Agent Review docs."
  counterevidence: "model review is not independent proof and worktree apply/merge is user-controlled"
  adversarial_status: NOT_PROBED
- claim_id: C-037
  section: provenance-license
  statement: "Anysphere, Inc. publicly identifies itself as Cursor's maker and publishes security reporting contacts."
  classification: FACT
  confidence: HIGH
  scope: "Official Terms and security pages."
  source_ids: [S-025, S-026]
  fact_dependencies: []
  method: "Read official maintainer and vulnerability-disclosure text."
  counterevidence: "none found"
  adversarial_status: NOT_APPLICABLE:provenance-observation
- claim_id: C-038
  section: security
  statement: "Official cloud retention documentation is contradictory about whether repository copies end at run completion or can remain in rolling 90-day snapshots."
  classification: UNKNOWN
  confidence: N/A
  scope: "Cloud Agent code/snapshot retention wording."
  source_ids: [S-006, S-007, S-027]
  fact_dependencies: []
  method: "attempted_methods=compared detailed Cloud security/network, Cloud security architecture, and enterprise privacy pages; blocker=official pages conflict and no deletion audit; impact=retention/deletion guarantees cannot be normalized confidently; available_evidence=S-006,S-007,S-027; next_probe=vendor clarification binding the general privacy wording to snapshot lifecycle plus deletion evidence"
  counterevidence: "S-027 says encrypted repository copies are deleted after completion; S-006/S-007 specify rolling 90-day snapshots"
  adversarial_status: CHALLENGED
- claim_id: C-039
  section: install-update-release
  statement: "Cloud API v1 is public beta, while the CLI uses mutable auto-update/in-place release channels with documented protection for running versions."
  classification: FACT
  confidence: MEDIUM
  scope: "Official API/changelog release policy; no rollback execution."
  source_ids: [S-021, S-024]
  fact_dependencies: []
  method: "Read current API beta notice and CLI release/update notes."
  counterevidence: "none; beta notice explicitly permits change"
  adversarial_status: NOT_PROBED
- claim_id: C-040
  section: repository-package-map
  statement: "A public source commit and production composition map for the Cursor Agent runtime were not available in the retained official/package universe."
  classification: UNKNOWN
  confidence: N/A
  scope: "CLI/editor/cloud core; excludes public docs and external standards."
  source_ids: [S-002, S-026]
  fact_dependencies: []
  method: "attempted_methods=official docs/terms review and static archive metadata/tree listing; blocker=proprietary source and no public runtime repository; impact=internal control/data reachability and source traceability cannot be established; available_evidence=S-002,S-026; next_probe=vendor source escrow/public snapshot or signed SBOM/source attestation"
  counterevidence: "none found in defined official/package universe"
  adversarial_status: NOT_PROBED
- claim_id: C-041
  section: provenance-license
  statement: "A top-level runtime redistribution license and complete notice set were not found in the pinned CLI archive."
  classification: UNKNOWN
  confidence: N/A
  scope: "Pinned Darwin/arm64 archive; service Terms are available but are not an archive redistribution license."
  source_ids: [S-002, S-026]
  fact_dependencies: []
  method: "attempted_methods=case-insensitive archive path search for LICENSE/NOTICE/package metadata and Terms review; blocker=only dependency licenses and private minimal manifest found; impact=redistribution and notice obligations cannot be established; available_evidence=S-002,S-026; next_probe=vendor-provided runtime EULA/license and complete third-party notices"
  counterevidence: "dependency license files exist but do not license the top-level runtime"
  adversarial_status: CHALLENGED
- claim_id: C-042
  section: adversarial-probes
  statement: "All 31 retained official Cursor URLs returned HTTP 200 in the bounded 2026-08-24 validation run."
  classification: FACT
  confidence: HIGH
  scope: "Unique exact URLs in S-001 through S-031; availability/content after cutoff not implied."
  source_ids: [S-031]
  fact_dependencies: []
  method: "curl HTTP status loop plus per-response SHA-256 and byte count."
  counterevidence: "none in the 31-URL validation output"
  adversarial_status: SUPPORTED
```

## 27. Source ledger {#source-ledger}

Bibliography rationale: retained sources are official, decision-critical boundary references or the exact package artifact; broad marketing pages, forums, third-party wrappers, and search-result excerpts were excluded. Live-page hashes pin retrieved bytes but do not make vendor pages immutable.

```yaml
- source_id: S-001
  source_kind: release-metadata
  title: "Cursor Agent live installer snapshot"
  url: "https://cursor.com/install"
  commit_or_ref: "release-label:2026.08.11-e8db854"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@anysphere/agent-cli-runtime@2026.08.11-e8db854 installer sha256:b1af27b9556c5f1c58d166742dbb33425ebd90a4bbd7e5453d66b920bf1f9f6b"
  code_path: "install"
  symbol: "DOWNLOAD_URL/FINAL_DIR"
  line_anchor: "N/A:web-script-has-no-stable-lines"
  command: "curl -fsSL 'https://cursor.com/install' -o /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cursor-agent-artifact/install.sh && shasum -a 256 /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cursor-agent-artifact/install.sh"
  command_environment: "macOS arm64; curl; network retrieval only; script not executed"
  output_or_hash: "sha256:b1af27b9556c5f1c58d166742dbb33425ebd90a4bbd7e5453d66b920bf1f9f6b"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-021, C-029]
  notes: "Mutable installer captured 5668 bytes; selected exact versioned URL."
- source_id: S-002
  source_kind: package-artifact
  title: "Cursor Agent 2026.08.11-e8db854 Darwin arm64 archive"
  url: "https://downloads.cursor.com/lab/2026.08.11-e8db854/darwin/arm64/agent-cli-package.tar.gz"
  commit_or_ref: "release-label:2026.08.11-e8db854"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "@anysphere/agent-cli-runtime@2026.08.11-e8db854 sha256:46044d6d7bcbd7b49a0cf1cd01aa4ca79aaa2ea5f2c7a32965fc0ebe29841790"
  code_path: "dist-package/"
  symbol: "archive tree and dist-package/package.json"
  line_anchor: "JSON pointer /name"
  command: "curl -fsSL 'https://downloads.cursor.com/lab/2026.08.11-e8db854/darwin/arm64/agent-cli-package.tar.gz' -o /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cursor-agent-artifact/agent-cli-package.tar.gz && shasum -a 256 /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cursor-agent-artifact/agent-cli-package.tar.gz && tar -tzf /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cursor-agent-artifact/agent-cli-package.tar.gz && tar -xOzf /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cursor-agent-artifact/agent-cli-package.tar.gz dist-package/package.json"
  command_environment: "macOS arm64; curl/tar; passive download/listing; no extraction of executable code and no execution/decompilation"
  output_or_hash: "sha256:46044d6d7bcbd7b49a0cf1cd01aa4ca79aaa2ea5f2c7a32965fc0ebe29841790"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-003, C-021, C-022, C-028, C-029, C-040, C-041]
  notes: "74,746,275 bytes; static manifest output was {name:@anysphere/agent-cli-runtime,private:true}; no runtime execution."
- source_id: S-003
  source_kind: official-documentation
  title: "CLI Installation"
  url: "https://cursor.com/docs/cli/installation"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Installation/Updates"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/cli/installation' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:fd370cb449acd49cbf4eaf6c43de1a6ca043fa267218a048d39ed851a5008a0f"
  access_date: "2026-08-24"
  supports_claims: [C-001, C-021]
  notes: "Official install/auto-update documentation; live page."
- source_id: S-004
  source_kind: official-documentation
  title: "Cursor CLI overview"
  url: "https://cursor.com/docs/cli/overview"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Interactive/Non-interactive/Cloud handoff/Sessions/Sandbox"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/cli/overview' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:db3127ef7844d22a10c07053ba0cf63a21ca6ca68284981df2f1fc45cd027829"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-005, C-013, C-016, C-024]
  notes: "Selected for cross-surface CLI boundary."
- source_id: S-005
  source_kind: official-documentation
  title: "Cloud Agents overview"
  url: "https://cursor.com/docs/cloud-agent"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "How it works/Runtime/MCP/Hooks/Artifacts/Billing"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/cloud-agent' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:77e8d9e9a16a56e77a00adf581c8bb5798b471aba64abe167536a7f28438303e"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-014, C-015, C-024, C-026, C-033]
  notes: "Primary cloud surface/handoff overview; former Background Agent naming recorded."
- source_id: S-006
  source_kind: official-documentation
  title: "Cloud Agent secrets and network"
  url: "https://cursor.com/docs/cloud-agent/security-network"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Secrets/Data retention/Network access"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/cloud-agent/security-network' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:5960d7b1baf0bc6492f4c8253a1599282c23202f1ebfd1c702be285287e7cebf"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-016, C-023, C-025, C-038]
  notes: "Selected for consequential cloud defaults, retention, egress and secret caveats."
- source_id: S-007
  source_kind: official-documentation
  title: "Cloud Agent security overview"
  url: "https://cursor.com/docs/cloud-agent/security"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Lifecycle/Isolation/Storage/Auditability"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/cloud-agent/security' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:2733f40b3e50ed0abf9d08b2a670a14f54155e80059859c305f8f18c38cf2ce6"
  access_date: "2026-08-24"
  supports_claims: [C-014, C-023, C-033, C-036, C-038]
  notes: "Vendor architecture/assurance statement, not independent measurement."
- source_id: S-008
  source_kind: official-documentation
  title: "Agent Run Modes"
  url: "https://cursor.com/docs/agent/security/run-modes"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Run modes/Sandboxing/Cloud Agents"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/agent/security/run-modes' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:697c52de4c9f35d174ebfaf7654bccd8893ce459d36f29b1cd75c72f2590c663"
  access_date: "2026-08-24"
  supports_claims: [C-016, C-023, C-025]
  notes: "Current narrow authority/sandbox reference; says classifier is not a security boundary."
- source_id: S-009
  source_kind: official-documentation
  title: "Cursor Agent overview"
  url: "https://cursor.com/docs/agent/overview"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "How Agent works/Tools/Checkpoints/Steering"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/agent/overview' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:de2ed3564c72001b24bdd4efb95fd56f3181ca21a15d35f82621df24355339bd"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-008, C-013, C-032, C-036]
  notes: "Primary editor Agent abstraction."
- source_id: S-010
  source_kind: official-documentation
  title: "Prompting agents"
  url: "https://cursor.com/docs/agent/prompting"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Context usage/Changing models/Custom modes"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/agent/prompting' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:782bd2814324311f25eb0eae3b2bfe4067fdfaff4645e95916c28734f6304d81"
  access_date: "2026-08-24"
  supports_claims: [C-007, C-010, C-011]
  notes: "Selected for context accounting/compaction and user model selection."
- source_id: S-011
  source_kind: official-documentation
  title: "Rules"
  url: "https://cursor.com/docs/rules"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Rule types/precedence/AGENTS.md"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/rules' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:08328efe66fc5223a91547f195013335f8259772f4252828616e1d81fbc34564"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-012]
  notes: "Prompt-level instruction mechanism; docs warn AI guidance is not sole security control."
- source_id: S-012
  source_kind: official-documentation
  title: "Agent search and indexing"
  url: "https://cursor.com/docs/agent/tools/search"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Instant Grep/Privacy/Explore/Multi-root"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/agent/tools/search' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:ed06414e97dfffb79692093fa05c703fcdc4eed7307335e3aa63abd364d860ff"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-035]
  notes: "Encryption/index-storage statements are vendor claims."
- source_id: S-013
  source_kind: official-documentation
  title: "Cursor ignore file"
  url: "https://cursor.com/docs/reference/ignore-file"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: ".cursorignore/.cursorindexingignore"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/reference/ignore-file' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:bf1b691707903c228ce162950d21fba42fb6e607d16d1918f5791415a45babe8"
  access_date: "2026-08-24"
  supports_claims: [C-012, C-023, C-025]
  notes: "Selected for explicit terminal/MCP bypass of ignore boundary."
- source_id: S-014
  source_kind: official-documentation
  title: "Agent Skills"
  url: "https://cursor.com/docs/skills"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Discovery/SKILL.md/scripts/progressive loading"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/skills' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:aa6cea169f0930b2be1c26e42c42452e4ca158603ed7ad6a6baef6c68c7f50cb"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-035]
  notes: "Selected for prompt/resource extension boundary."
- source_id: S-015
  source_kind: official-documentation
  title: "Subagents"
  url: "https://cursor.com/docs/subagents"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Context/Concurrency/Models/Isolation/Resume/Failure/Cost"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/subagents' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:0c96848d912f10d9be4dc81162f4e7442acb11c9e5b22902a351d16eb0daa940"
  access_date: "2026-08-24"
  supports_claims: [C-010, C-015, C-019, C-020, C-035]
  notes: "Primary delegation/concurrency contract."
- source_id: S-016
  source_kind: official-documentation
  title: "Model Context Protocol"
  url: "https://cursor.com/docs/mcp"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Transports/capabilities/approval/admin/failure"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/mcp' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:699a936a64494ec6217ec97e98368eacbbee869eb3b2dbc5a56a20e37297d473"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-008, C-016, C-020]
  notes: "Primary external tool/data protocol boundary."
- source_id: S-017
  source_kind: official-documentation
  title: "Hooks"
  url: "https://cursor.com/docs/hooks"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "JSON/stdio hook schema/failClosed/cloud matrix"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/hooks' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:ea4af0198673d25f11911771a82b12653802f51ce2cac260642ca80e3ab9d694"
  access_date: "2026-08-24"
  supports_claims: [C-006, C-008, C-011, C-017, C-018, C-025, C-027]
  notes: "Selected because it reveals the clearest public agent-loop event boundary."
- source_id: S-018
  source_kind: official-documentation
  title: "CLI parameters"
  url: "https://cursor.com/docs/cli/reference/parameters"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Global options/commands/worker/sandbox"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/cli/reference/parameters' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:cc07e7dcbda71b6b0dc23338866bd23b985fa138d6ed61c174d52a05aa9da173"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-006, C-030]
  notes: "Conflicts with S-019 about default print-mode writes."
- source_id: S-019
  source_kind: official-documentation
  title: "Using Headless CLI"
  url: "https://cursor.com/docs/cli/headless"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Print mode/File modification"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/cli/headless' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:c08bd0c840cb10cb6d464f07710c7aa559b1df238de9661ac3362a9ca8de47db"
  access_date: "2026-08-24"
  supports_claims: [C-004, C-030]
  notes: "Says writes are only applied with --force; retained contradiction."
- source_id: S-020
  source_kind: official-documentation
  title: "CLI output format"
  url: "https://cursor.com/docs/cli/reference/output-format"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "JSON/stream-json/failure/tool events"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/cli/reference/output-format' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:ba09c759d974f4df588df1a58321b7c72bfc9ac70e794ba4e84612aa11697efb"
  access_date: "2026-08-24"
  supports_claims: [C-008, C-018, C-020, C-027, C-030]
  notes: "Structured automation contract; additive fields and failure truncation documented."
- source_id: S-021
  source_kind: official-documentation
  title: "Cloud Agents API v1"
  url: "https://cursor.com/docs/cloud-agent/api/endpoints"
  commit_or_ref: "public-beta-v1:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Agents/Runs/SSE/Cancel/Usage/Artifacts/Lifecycle"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/cloud-agent/api/endpoints' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:c8295f14c4c98a96bbfcb3eacf176b8ba6264dadf245b4f5d45617d451e1c241"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-010, C-014, C-018, C-019, C-020, C-024, C-026, C-027, C-034, C-039]
  notes: "Preferred current API; explicitly beta and durable-agent/per-run model."
- source_id: S-022
  source_kind: official-documentation
  title: "Worktrees"
  url: "https://cursor.com/docs/configuration/worktrees"
  commit_or_ref: "Cursor-3.5-plus:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Setup/Cleanup/Skills/best-of-n"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/configuration/worktrees' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:f21fac93186d2b87f7964ae4e1998f738fb67c10f07a66fde93bbccb0fecdc0d"
  access_date: "2026-08-24"
  supports_claims: [C-015, C-024, C-026, C-036]
  notes: "Selected for isolation, setup side effects, cleanup, apply/review boundary."
- source_id: S-023
  source_kind: official-documentation
  title: "Models and Pricing"
  url: "https://cursor.com/docs/models-and-pricing"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Usage pools/Auto modes/Token pricing"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/models-and-pricing' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:2c66a76e69e0a348af4f4ce92770a3e6999100b428d27274c5a3d23ac443af92"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-010, C-019]
  notes: "Live pricing may change; retained for accounting/routing policy, not procurement."
- source_id: S-024
  source_kind: release-metadata
  title: "Cursor CLI changelog"
  url: "https://cursor.com/docs/cli/changelog"
  commit_or_ref: "through-2026-08-11:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "Cursor-Agent-CLI@2026.08.11 release notes"
  code_path: "N/A:no-code-path"
  symbol: "2026 releases"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/cli/changelog' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:7ae6d029393b4ba64472d5f53e37790b67b96f5b386f1cbf6fa5c3d448a02410"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-006, C-010, C-013, C-020, C-021, C-022, C-039]
  notes: "Vendor release statements, not independent runtime tests."
- source_id: S-025
  source_kind: official-documentation
  title: "Cursor Security"
  url: "https://cursor.com/security"
  commit_or_ref: "page-updated:2026-04-24"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Security/Vulnerability disclosures"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/security' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:78a3ebe7374cb5d23c84462a4fd191ed0c89fb50a141c1f2f4c4b994034ec924"
  access_date: "2026-08-24"
  supports_claims: [C-023, C-037]
  notes: "SOC/pen-test details are request-gated vendor assurances."
- source_id: S-026
  source_kind: license
  title: "Cursor Terms of Service"
  url: "https://cursor.com/terms-of-service"
  commit_or_ref: "page-updated:2026-08-13"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Sections 1.1/1.5/5.1"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/terms-of-service' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:fa6662703b9ba7e55a5d7b053f11777a5b267d05e62efb9a74f617220f2265d4"
  access_date: "2026-08-24"
  supports_claims: [C-002, C-028, C-037, C-040, C-041]
  notes: "Individual terms; MSA can supersede; not an open-source/runtime redistribution license."
- source_id: S-027
  source_kind: official-documentation
  title: "Privacy and Data Governance"
  url: "https://cursor.com/docs/enterprise/privacy-and-data-governance"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Data flows/Retention models/Encryption/Residency"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/enterprise/privacy-and-data-governance' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:84452fef23a975066f3869da7c7c73f5e74204fc6afd4f60b158bc2cf18dd379"
  access_date: "2026-08-24"
  supports_claims: [C-009, C-023, C-025, C-038]
  notes: "General deletion wording conflicts with detailed Cloud snapshot retention pages."
- source_id: S-028
  source_kind: official-documentation
  title: "Agents Window"
  url: "https://cursor.com/docs/agent/agents-window"
  commit_or_ref: "Cursor-3:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Editor/Agents Window/Handoffs/Review/Worktrees"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/agent/agents-window' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:11669ea450a4016cabed5df4fc038c87b5460879c9da203a3ddad3eb3192b0c2"
  access_date: "2026-08-24"
  supports_claims: [C-005, C-024, C-026, C-032, C-036]
  notes: "Primary editor multi-agent and local/cloud handoff surface."
- source_id: S-029
  source_kind: official-documentation
  title: "Agent Review"
  url: "https://cursor.com/docs/agent/agent-review"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Triggers/Quick/Deep"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/agent/agent-review' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:2f810990a3b19f78470ed5ef4769c1929f018f41f691bea56ee751623228f635"
  access_date: "2026-08-24"
  supports_claims: [C-036]
  notes: "Model-based review evidence, not correctness proof."
- source_id: S-030
  source_kind: official-documentation
  title: "Cloud Automations"
  url: "https://cursor.com/docs/cloud-agent/automations"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "Triggers/Tools/Memories/Permissions/Identity/Billing"
  line_anchor: "N/A:no-line-anchor"
  command: "curl -L --max-time 60 -sS 'https://cursor.com/docs/cloud-agent/automations' | shasum -a 256"
  command_environment: "macOS arm64; curl; passive HTML retrieval"
  output_or_hash: "sha256:9beabc571db3be70b56edb933be893b80d6c5723e5d31f373635d118a839fb3a"
  access_date: "2026-08-24"
  supports_claims: [C-019, C-031]
  notes: "Selected for background persistence, cross-run memory, trigger and service-account authority."
- source_id: S-031
  source_kind: runtime-observation
  title: "Retained Cursor URL validation"
  url: "https://cursor.com/docs"
  commit_or_ref: "N/A:web-unversioned"
  resolved_commit: "N/A:not-a-repository-source"
  package_identity: "N/A:not-a-package"
  code_path: "N/A:no-code-path"
  symbol: "31 canonical URL HTTP status/hash batch"
  line_anchor: "N/A:no-line-anchor"
  command: >-
    grep -E '^  url: "https://([^.]+\.)?cursor\.com' research/harnesses/cursor-agent.md | sed -E 's/^  url: "([^"]+)"$/\1/' | sort -u | while IFS= read -r u; do f=$(mktemp /private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/cursor-url.XXXXXX); code=$(curl -L --max-time 60 -sS -o "$f" -w '%{http_code}' "$u"); hash=$(shasum -a 256 "$f" | awk '{print $1}'); bytes=$(wc -c < "$f" | tr -d ' '); printf '%s\t%s\t%s\t%s\n' "$code" "$hash" "$bytes" "$u"; rm -f "$f"; done
  command_environment: "macOS arm64; zsh/curl; no credentials; network passive retrieval"
  output_or_hash: "sha256:409b7763a49b9a21cbf329915a3cb2a1259ef4dec7939ff0b8915226429bdb50"
  access_date: "2026-08-24"
  supports_claims: [C-029, C-042]
  notes: "Inline summary: 31/31 returned HTTP 200; researcher retained hashed output at approved temporary path during session. Section 25 gives a dossier-driven repeat command."
```

## 28. Normalized summary record {#normalized-summary-record}

```yaml
schema_version: "harness-dossier-summary/v1"
dossier_id: "cursor-agent-whole-harness-2026-08-24"
target_kind: "HARNESS"
target_name: "Cursor Agent"
feature_name: "N/A:whole-harness"
snapshot:
  repository_url: "N/A:proprietary-runtime-no-public-repository"
  resolved_commit: "N/A:package-only"
  observed_ref: "release-label:2026.08.11-e8db854"
  package_identity: "@anysphere/agent-cli-runtime@2026.08.11-e8db854+sha256:46044d6d7bcbd7b49a0cf1cd01aa4ca79aaa2ea5f2c7a32965fc0ebe29841790"
research:
  researcher: "ses_fc91cf6b0ffeD8vJt62WWJIMQ1 subagent"
  owned_path: "research/harnesses/cursor-agent.md"
  access_date: "2026-08-24 UTC"
  completion: "COMPLETE_WITH_UNKNOWNS"
  authority: "RESEARCH_ONLY_NO_DESIGN_AUTHORITY"
dimensions:
  - dimension: "identity_snapshot"
    coverage: "PARTIAL"
    summary: "Darwin/arm64 CLI artifact is hash-pinned; source commit is unavailable."
    confidence: "HIGH"
    claim_ids: ["C-001", "C-040"]
    source_ids: ["S-001", "S-002"]
    pattern_disposition: "NO_POSITION"
  - dimension: "provenance_license"
    coverage: "PARTIAL"
    summary: "Anysphere provenance and proprietary service terms are clear; archive redistribution license is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-002", "C-037", "C-041"]
    source_ids: ["S-002", "S-025", "S-026"]
    pattern_disposition: "NO_POSITION"
  - dimension: "repository_package_map"
    coverage: "PARTIAL"
    summary: "Bundled archive tree is observed, but production source/composition map is proprietary."
    confidence: "MEDIUM"
    claim_ids: ["C-003", "C-040"]
    source_ids: ["S-002", "S-026"]
    pattern_disposition: "NO_POSITION"
  - dimension: "executable_entrypoints"
    coverage: "OBSERVED"
    summary: "CLI, editor, Agents Window, integrations, API, worker and ACP entrypoints are documented."
    confidence: "HIGH"
    claim_ids: ["C-004", "C-032", "C-034"]
    source_ids: ["S-004", "S-018", "S-021", "S-028"]
    pattern_disposition: "NO_POSITION"
  - dimension: "control_data_flow"
    coverage: "PARTIAL"
    summary: "Local/cloud/SCM lifecycle is documented; transfer serialization and internals are unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-005", "C-033"]
    source_ids: ["S-005", "S-007", "S-028"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "module_extension_boundaries"
    coverage: "OBSERVED"
    summary: "Rules, skills, MCP, hooks, plugins and subagents are named extension boundaries."
    confidence: "HIGH"
    claim_ids: ["C-006"]
    source_ids: ["S-011", "S-014", "S-016", "S-017"]
    pattern_disposition: "NO_POSITION"
  - dimension: "agent_interface"
    coverage: "PARTIAL"
    summary: "Public agent/delegation abstractions are documented; operative loop and scheduler are proprietary."
    confidence: "MEDIUM"
    claim_ids: ["C-007", "C-035"]
    source_ids: ["S-009", "S-015"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tool_interface"
    coverage: "PARTIAL"
    summary: "Tool families, MCP and hooks expose schemas/events, but complete built-in contracts are hidden."
    confidence: "MEDIUM"
    claim_ids: ["C-008", "C-017"]
    source_ids: ["S-016", "S-017", "S-020"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "provider_interface"
    coverage: "UNKNOWN"
    summary: "Provider adapter, request transport, actual fallback and per-request provider identity are unavailable."
    confidence: "N/A"
    claim_ids: ["C-009"]
    source_ids: ["S-021", "S-023", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "model_interface"
    coverage: "PARTIAL"
    summary: "Selection, parameters, Auto and fallback policy are documented without execution receipts."
    confidence: "MEDIUM"
    claim_ids: ["C-010"]
    source_ids: ["S-010", "S-021", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "context_interface"
    coverage: "PARTIAL"
    summary: "Context categories, rules, indexing, ignore caveats, compaction and automation memory are documented."
    confidence: "MEDIUM"
    claim_ids: ["C-011", "C-012", "C-031"]
    source_ids: ["S-010", "S-011", "S-012", "S-013", "S-030"]
    pattern_disposition: "NO_POSITION"
  - dimension: "state_persistence_restart"
    coverage: "PARTIAL"
    summary: "Local resume/checkpoints and cloud persistence are documented, with a retention contradiction."
    confidence: "MEDIUM"
    claim_ids: ["C-013", "C-014", "C-038"]
    source_ids: ["S-004", "S-006", "S-007", "S-024", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "concurrency_worktree_isolation"
    coverage: "PARTIAL"
    summary: "Parallel agents, serialized per-agent runs and optional worktree/VM isolation are documented."
    confidence: "MEDIUM"
    claim_ids: ["C-015", "C-034"]
    source_ids: ["S-015", "S-021", "S-022"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "permissions_authority_sandbox"
    coverage: "PARTIAL"
    summary: "Local/cloud authority modes and hook controls are documented, but actual enforcement is unknown."
    confidence: "MEDIUM"
    claim_ids: ["C-016", "C-017", "C-023"]
    source_ids: ["S-006", "S-008", "S-017"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "evidence_observability"
    coverage: "PARTIAL"
    summary: "Structured events, transcripts, diffs, checkpoints, artifacts and SCM evidence exist without tamper proof."
    confidence: "MEDIUM"
    claim_ids: ["C-018", "C-036"]
    source_ids: ["S-017", "S-020", "S-021", "S-029"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "resource_token_cost_accounting"
    coverage: "PARTIAL"
    summary: "Per-run tokens and pricing are documented; compute limits and provider reconciliation are not."
    confidence: "MEDIUM"
    claim_ids: ["C-019"]
    source_ids: ["S-015", "S-021", "S-023"]
    pattern_disposition: "NO_POSITION"
  - dimension: "failure_cancellation_retry"
    coverage: "PARTIAL"
    summary: "Retries, errors and cancellation are documented, but cleanup/idempotency and headless defaults remain unclear."
    confidence: "MEDIUM"
    claim_ids: ["C-020", "C-030"]
    source_ids: ["S-018", "S-020", "S-021", "S-024"]
    pattern_disposition: "NO_POSITION"
  - dimension: "install_update_release"
    coverage: "PARTIAL"
    summary: "Exact artifact and release are pinned; vendor integrity/source/rollback evidence is absent and API is beta."
    confidence: "MEDIUM"
    claim_ids: ["C-001", "C-021", "C-039"]
    source_ids: ["S-001", "S-002", "S-021", "S-024"]
    pattern_disposition: "NO_POSITION"
  - dimension: "tests_qualification"
    coverage: "UNKNOWN"
    summary: "No public production qualification suite or release report was found."
    confidence: "N/A"
    claim_ids: ["C-022"]
    source_ids: ["S-002", "S-024"]
    pattern_disposition: "NO_POSITION"
  - dimension: "security"
    coverage: "PARTIAL"
    summary: "Vendor controls and risks are documented; enforcement and retention remain unverified or contradictory."
    confidence: "MEDIUM"
    claim_ids: ["C-016", "C-023", "C-038"]
    source_ids: ["S-006", "S-007", "S-008", "S-025", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "strengths"
    coverage: "PARTIAL"
    summary: "Explicit multi-surface handoffs improve documented interface visibility."
    confidence: "MEDIUM"
    claim_ids: ["C-024"]
    source_ids: ["S-004", "S-005", "S-021", "S-028"]
    pattern_disposition: "NO_POSITION"
  - dimension: "liabilities"
    coverage: "PARTIAL"
    summary: "Control and retention semantics are nonuniform across execution surfaces."
    confidence: "HIGH"
    claim_ids: ["C-025"]
    source_ids: ["S-006", "S-008", "S-013", "S-017", "S-027"]
    pattern_disposition: "NO_POSITION"
  - dimension: "transferable_patterns"
    coverage: "PARTIAL"
    summary: "Durable agent/run handoff is a candidate; lifecycle hooks are conditional."
    confidence: "MEDIUM"
    claim_ids: ["C-026", "C-027"]
    source_ids: ["S-017", "S-021", "S-022"]
    pattern_disposition: "CONDITIONAL"
  - dimension: "rejected_patterns_curiosity_no_go"
    coverage: "OBSERVED"
    summary: "Unsafe, prohibited, credentialed or low-value internals research is explicitly rejected."
    confidence: "HIGH"
    claim_ids: ["C-028"]
    source_ids: ["S-002", "S-026"]
    pattern_disposition: "CURIOSITY_NO_GO"
strength_ids: ["C-024"]
liability_ids: ["C-025"]
transferable_pattern_ids: ["C-026", "C-027"]
curiosity_no_go_ids: ["C-028"]
unknown_claim_ids: ["C-009", "C-021", "C-022", "C-023", "C-029", "C-030", "C-038", "C-040", "C-041"]
```

## 29. Uncertainties and follow-ups {#uncertainties-follow-ups}

| Claim | Comparison impact | Next discriminating probe | Required access | Owner |
| --- | --- | --- | --- | --- |
| C-009 | Provider/fallback/privacy execution cannot be normalized. | Explicit-model run with provider/request/retention receipts. | Vendor or authorized credentialed test tenant. | UNASSIGNED |
| C-021 | Supply-chain/source assurance cannot be accepted. | Obtain signed checksums, SBOM, source commit/build attestation and rollback procedure. | Vendor release evidence. | UNASSIGNED |
| C-022 | Regression/negative/platform qualification is unknown. | Obtain public/vendor test matrix and release qualification report. | Vendor evidence. | UNASSIGNED |
| C-023 | Security controls are policy claims, not verified enforcement. | Authorized sandbox/tenant isolation audit with no secrets. | Security authorization and disposable environment. | UNASSIGNED |
| C-029 | Required runtime negative probes remain unexecuted. | Run P-01–P-14 in a separately approved disposable account/VM. | No-secret test account, target execution approval. | UNASSIGNED |
| C-030 | Headless default mutation authority is ambiguous. | Compare pinned `-p` write request with and without `--force`. | Disposable local install/account. | UNASSIGNED |
| C-038 | Cloud code/snapshot retention is contradictory. | Vendor clarification plus deletion/snapshot lifecycle evidence. | Vendor response/audit evidence. | UNASSIGNED |
| C-040 | Internal composition/reachability/source traceability is unavailable. | Signed SBOM/source map or public/escrowed snapshot. | Vendor evidence. | UNASSIGNED |
| C-041 | Redistribution/notice obligations are unresolved. | Obtain runtime EULA/license and complete third-party notices. | Vendor legal/release evidence. | UNASSIGNED |

**Recommendations (research-only):** downstream synthesis should compare Cursor at documented boundaries, preserve all UNKNOWNs, and avoid treating VM/sandbox/privacy or model-routing claims as independently verified. Any security, procurement, or design decision requires separate authority.

**Stop decision:** Discovery stopped on coverage and saturation. The highest-value in-frame threads were exhausted through official docs, changelog, Terms/security/privacy pages, exact package metadata, passive archive inspection, and URL validation. Further available threads were duplicates, prohibited, credential-gated, unsafe, or nonpositive marginal evidence and are recorded as `CURIOSITY_NO_GO`.

**Handoff:** Owned path is `research/harnesses/cursor-agent.md`. Pre-existing unrelated changes observed before work: modified `apps/plugin/opencode2/turbo.json`; untracked `docs/architecture/`; untracked `research/` tree including contract/roster. This agent touched none except the owned dossier. Final check commands/results are reported in the parent handoff message.
