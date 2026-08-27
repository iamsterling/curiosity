# Curiosity-native OpenCode2 behavioral parity specification

**Status:** Qualified bounded implementation contract — 2026-08-27
**Scope:** behavior Curiosity currently obtains from the OpenCode2 host and
`@iamsterling/opencode2-config`, and the native replacement in
`apps/custom-harness`  
**Authority:** this specification does not amend ADR-001 through ADR-011,
authorize release, or qualify a capability  
**Relationship:** refines the
[plugin-native kernel specification](PLUGIN-NATIVE-SPEC.md); where wording
conflicts, the accepted ADRs and sealed-kernel invariants prevail

## 1. Decision and parity rule

Curiosity will replace the behavior it receives from OpenCode2 with
project-owned, provider-neutral capabilities. It will not reproduce OpenCode's
implementation, prompts, hook ABI, persistence layout, permission language,
plugin loader, or session protocol.

Parity is established only when an operator-reachable behavior passes an
end-to-end acceptance check through the native authority boundary. A catalog
entry, type, prompt, workflow row, tool schema, projection, or unit test of an
isolated reducer is not behavioral parity by itself.

The following terms are normative:

- **ESSENTIAL:** losing the behavior prevents or materially degrades a shipped
  Curiosity objective. Its native contract MUST be implemented before a full
  parity claim.
- **REPLACEABLE:** the outcome is required, but the OpenCode mechanism is not.
  A cleaner native primitive MUST replace it.
- **INCIDENTAL:** it is present in the host or repository but no reachable
  Curiosity behavior depends on it. It MUST NOT become a migration requirement.
- **OBSOLETE:** Curiosity intentionally retired or disabled it. Compatibility
  may require an explicit stable denial, but not reimplementation.

An item can be `REPLACEABLE` even when its product outcome is essential. This
classification means “replace the mechanism while preserving the contract.”

### 1.1 Current verdict

**Full behavioral parity is GO for the bounded trusted-local, single-user,
Darwin-arm64 development profile.** `PAR-AC01..PAR-AC30` and all 32 dependency
rows are closed by the machine-readable qualification ledger and verification
record. Native roles, commands, tools, child execution, persistence, clients,
migration, and experimental cutover/rollback are operator-reachable through the
sealed authority boundary.

This verdict is deliberately narrower than product or release readiness. Commit,
merge, push, force, arbitrary-ref mutation, automatic stale cleanup, hard-reset
storage, generic operator search credentials, live provider delivery, production,
publication, deployment, signing, notarization, automatic update, remote,
multi-user, sandbox, non-Darwin, and stochastic model-quality equivalence remain
unqualified or unavailable. The post-cutover Retrieval v3 benchmark is a separate
product-quality measurement and is not an authority or parity oracle.

## 2. Evidence boundary and method

### 2.1 Interoperability question

What behavior does Curiosity rely on OpenCode2 to provide, what product
guarantee does each behavior supply, and what is the smallest Curiosity-native
contract that preserves or improves that guarantee without creating a second
authority?

### 2.2 Permitted evidence

This specification uses only:

- the current repository's OpenCode2 composition root, active source, assets,
  tests, package declarations, and machine-readable manifest;
- the current custom harness source, tests, status, and accepted ADRs;
- the exact local `@opencode-ai/plugin@0.0.0-beta-18138` type declarations as
  current implementation evidence, not accepted qualification authority; and
- the existing research-only OpenCode dossier at the pinned upstream
  `v1.18.22` commit as corroborating host evidence.

The upstream `v1.18.22` task implementation is not treated as exact dynamic
proof of the beta-18138 binary. Exact beta task scheduling, provider delivery,
and crash behavior remain unknown. The native contract below is deliberately
explicit and is not copied from either source.

The beta-18138 implementation pin conflicts with the accepted beta-17595 host
decisions. This specification treats both as evidence of a version-governance
gap and treats neither host as currently qualified for new parity claims. Native
host independence in PAR-I12 makes that conflict removable; it does not make the
source contradiction disappear.

No credentials, live provider, external search endpoint, consequential tool,
OpenCode plugin, or unsafe fault target was invoked for this specification.

### 2.3 Coverage criterion

Coverage is sufficient only when all of these source universes are accounted
for:

1. the three actively composed OpenCode2 features;
2. all 64 manifested assets: 41 commands, 12 config assets, eight skills, and
   three skill resources;
3. all 20 plugin-owned runtime tool names;
4. the host capabilities needed to make those assets operational;
5. the custom harness's current agents, context, tools, provider path,
   workflows, clients, persistence, and qualification status; and
6. every intentionally disabled, deferred, and uncomposed surface that could be
   mistaken for a current dependency.

## 3. Controlling invariants

The native replacement MUST preserve these invariants in addition to
PNS-I01 through PNS-I12:

1. **PAR-I01 — Reachability over inventory:** a behavior is available only when
   its complete command-to-terminal path executes under the kernel. Names and
   schemas alone never establish availability.
2. **PAR-I02 — Independent child context:** every delegated child has a distinct
   durable session and run identity, prompt snapshot, provider calls, tool
   snapshot, usage record, and terminal result.
3. **PAR-I03 — No authority expansion:** child effective authority is an
   intersection and can never exceed the parent, selected agent, operator
   profile, qualified platform, or delegation request.
4. **PAR-I04 — Durable lineage first:** parent, root, depth, delegation group,
   child ordinal, and capability ceiling are committed before child dispatch.
5. **PAR-I05 — Parent suspension, not call-stack waiting:** a parent awaiting
   children is durably suspended. Restart resumes scheduling from records, not
   an in-memory promise.
6. **PAR-I06 — Deterministic fan-in:** concurrent child completion order cannot
   alter the order or digest of results delivered to the parent.
7. **PAR-I07 — Terminal results only:** partial model text, stream deltas, stale
   generations, uncommitted tool output, or a child's assertion of success
   cannot become a successful child result.
8. **PAR-I08 — Descendant cancellation:** cancelling a parent fences new child
   work, propagates cancellation to every descendant and active call, and
   quarantines late receipts.
9. **PAR-I09 — Collision-aware concurrency:** parallel work with overlapping or
   unknown mutation scope is serialized or denied; prompt claims of exclusive
   ownership are not enforcement.
10. **PAR-I10 — Explicit uncertainty:** unknown provider usage, delivery,
    descendant state, migration provenance, or compaction continuity remains
    unknown and blocks any dependent terminal claim.
11. **PAR-I11 — User authority is not text:** child, model, tool, imported,
    synthetic, or background output cannot approve a gate or establish root-user
    identity.
12. **PAR-I12 — OpenCode independence:** removing OpenCode2 packages, config,
    cache, state, and executable cannot change native build or behavior.

## 4. Dependency and disposition matrix

The “native status” column describes the repository at this specification's
baseline, not the target.

| ID  | Evidenced OpenCode2 behavior                                                                                  | Disposition | Actual Curiosity contract                                                                                                                | Native owner                                                | Native status                                                     |
| --- | ------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| D01 | Primary conversation turn, streamed response, multi-turn transcript                                           | ESSENTIAL   | Admit one user turn, stream non-authoritative deltas, commit one terminal assistant result or typed failure, and resume a durable thread | `stock.chat`, `ProviderGateway`, thread projection          | QUALIFIED — scripted adapter and durable replay profile           |
| D02 | Agent definitions, modes, default agent, role instructions                                                    | ESSENTIAL   | Eight stable role policies, valid primary/subagent selection, deterministic default, immutable policy digest                             | `stock.agents` plus prompt assembler                        | QUALIFIED — closed eight-role policy                              |
| D03 | Per-role model route and generation settings                                                                  | ESSENTIAL   | Operator-selected, policy-allowed route per role; exact route captured per call; no silent substitution                                  | provider routing policy plus gateway                        | QUALIFIED — exact enabled-role route coverage                     |
| D04 | Host task/subagent tool                                                                                       | REPLACEABLE | Governed `agent.delegate` proposal producing an independently executed child result                                                      | `stock.delegation`, child scheduler, provider/tool gateways | QUALIFIED — bounded read-only child profile                       |
| D05 | Child parent/root lineage, depth, resume by task identity                                                     | ESSENTIAL   | Durable lineage, bounded depth, one active run per child session, revision-bound continuation                                            | kernel child ledger                                         | QUALIFIED — depth one and exact revision continuation             |
| D06 | Sequential and parallel delegated work with result return                                                     | ESSENTIAL   | Bounded fan-out, concurrent independent dispatch, durable all-settled barrier, deterministic fan-in                                      | child scheduler and delegation workflow                     | QUALIFIED — default two-member turns; four-member configured failure profile; at most two active children |
| D07 | Parent/child cancellation                                                                                     | ESSENTIAL   | Authenticated ancestry cancellation, active-call abort, terminal reconciliation, stale-result fencing                                    | cancellation service and gateways                           | QUALIFIED — bounded descendant and stale-receipt matrix           |
| D08 | Built-in read, glob, grep, and listing tools                                                                  | ESSENTIAL   | Root-confined, symlink-safe, bounded workspace discovery and reads                                                                       | `stock.workspace`, Rust supervisor                          | QUALIFIED — bounded root-confined profile                         |
| D09 | Edit, write, and patch tools used by implementation commands                                                  | ESSENTIAL   | Precondition-bound, path-confined, auditable file mutation with rollback/reconciliation evidence                                         | mutation plugin and Rust supervisor                         | QUALIFIED — opt-in preconditioned atomic profile                  |
| D10 | Shell/process execution used to build and verify                                                              | ESSENTIAL   | Reviewed executable profile, closed argv/env/cwd, deadline, output bound, process-tree cancellation, receipt                             | process plugin and Rust supervisor                          | QUALIFIED — exact closed process profiles                         |
| D11 | Git operations reachable through host tools                                                                   | REPLACEABLE | Typed read/mutation operations, worktree ownership, exact repository identity, gates for consequential writes                            | Git plugin, ADR-007 services, Rust supervisor               | QUALIFIED — reads, gated worktrees, and Curiosity ref CAS         |
| D12 | Web search and fetch for research                                                                             | ESSENTIAL   | Qualified bounded search/fetch, URL and redirect policy, taint labels, source metadata, no search-result authority                       | `stock.search` plus qualified adapters                      | QUALIFIED — explicit bounded adapters; absent configuration denies |
| D13 | Question/permission interaction                                                                               | REPLACEABLE | Typed blocking question distinct from binding gate; authenticated answer correlated to exact pending request                             | question plugin and gate service                            | QUALIFIED — signed correlated answer profile                     |
| D14 | Tool schema, call IDs, result/error continuation                                                              | ESSENTIAL   | Exact visible-tool snapshot, closed input, pre-dispatch authorization, durable receipt, bounded model-visible result                     | tool contributions and `ToolGateway`                        | QUALIFIED — current native tool set                               |
| D15 | Skills and slash commands                                                                                     | ESSENTIAL   | Authenticated activation of versioned project-owned content in a bounded prompt slot                                                     | `stock.skills`                                              | QUALIFIED — 11 active command activations                         |
| D16 | Project/global instructions and references                                                                    | REPLACEABLE | Explicit, provenance-labelled, precedence-defined context sources selected at a fixed revision                                           | context/reference plugins                                   | QUALIFIED — explicit bounded context sources                      |
| D17 | Context compaction and continuation                                                                           | REPLACEABLE | Explicit accounted compaction attempt, immutable summary artifact, continuity references, deterministic reassembly                       | compaction workflow plus provider gateway                   | QUALIFIED — explicit immutable accounting                         |
| D18 | Session persistence, list/resume, and restart                                                                 | ESSENTIAL   | Durable threads, turns, child sessions, pending gates/actions, replayable projections, explicit ambiguous external effects               | kernel journal and clients                                  | QUALIFIED — local event-journal profile                           |
| D19 | Permission evaluation at host tool sinks                                                                      | REPLACEABLE | Default-deny capability intersection and final-sink checks with binding gates where required                                             | sealed kernel policy and gateways                           | QUALIFIED — enabled native sink profile                           |
| D20 | Event and tool hooks used for observation                                                                     | REPLACEABLE | Canonical kernel events plus redacted observation reactors; no parallel capture authority                                                | journal and `stock.observations`                            | QUALIFIED — bounded canonical observations                        |
| D21 | Ledger intent/criteria/work/evidence/resolution semantics                                                     | ESSENTIAL   | Versioned durable proposals and reducers; only kernel predicates and authenticated gates can resolve                                     | `stock.ledger`, `stock.evidence`                            | QUALIFIED — native reducers and stable proposal diagnostics       |
| D22 | Native loop controls and continuation                                                                         | REPLACEABLE | Finite durable workflows, explicit budgets, no-progress stop, cancellation, terminal predicates                                          | `stock.loop`, workflow engine                               | QUALIFIED — finite workflows; unavailable controls deny stably    |
| D23 | 30 `/loop-*` compatibility names                                                                              | OBSOLETE    | Preserve each reviewed native mapping, manual guidance, or stable unsupported diagnostic until explicit removal                          | `stock.skills`, compatibility tools                         | RETIRED — preserved only as mapped guidance or stable denial      |
| D24 | OpenCode plugin setup, duplicate-root suppression, reverse cleanup, ABI pin                                   | REPLACEABLE | Sealed static catalog, deterministic construction, exact adapter versions, reverse scoped cleanup                                        | kernel composition                                          | QUALIFIED — native static composition; source host retired        |
| D25 | OpenCode TUI/CLI command entry and stream rendering                                                           | REPLACEABLE | Native signed-command client, transcript, streaming, errors, selection, cancellation, session controls                                   | `client.tui` and CLI                                        | QUALIFIED — signed local client profile                           |
| D26 | Bundle overlay, model mapping, depth setting, doctor                                                          | REPLACEABLE | Strict native config schema, per-agent routes, authority profile, capability truth, catalog/config digest                                | config and status services                                  | QUALIFIED — closed role, route, depth, and status policy          |
| D27 | OpenCode package installation, cache, plugin discovery, update                                                | REPLACEABLE | Immutable native artifact installation, integrity receipt, explicit rollback, separately authorized update                               | distribution tooling                                        | QUALIFIED — experimental Darwin artifact install and rollback     |
| D28 | Disabled host `build` and `plan` agents                                                                       | OBSOLETE    | They remain absent; no compatibility alias silently selects them                                                                         | agent catalog validation                                    | RETIRED — absent and mechanically rejected                        |
| D29 | Imported daemon, polling, marker, mutable loop state, direct shell aliases                                    | OBSOLETE    | Remain unreachable and return reviewed denials                                                                                           | compatibility policy                                        | RETIRED — unreachable with stable diagnostics                     |
| D30 | Uncomposed engineering-intent, local-effect, GitHub, evidence-development, and handoff internals              | INCIDENTAL  | No production parity requirement merely from source presence; adopt separately only through native contracts                             | none by default                                             | EXCLUDED — uncomposed source internals                             |
| D31 | MCP, LSP, ACP, server mode, dynamic third-party plugins, provider breadth, warming, hidden host helper agents | INCIDENTAL  | No current Curiosity dependency; require separate intent and qualification                                                               | none by default                                             | EXCLUDED — absent by design                                       |
| D32 | Exact OpenCode prompts, schemas, callbacks, storage files, permission grammar, and task output tags           | INCIDENTAL  | Preserve no implementation identity; only the behavioral contracts in this document matter                                               | none                                                        | EXCLUDED — implementation identity rejected                       |

### 4.1 Asset and tool coverage index

This index binds every manifested asset and plugin-owned runtime tool to the
dependency rows above. The manifest remains authoritative for identity and
status; this index supplies behavioral classification. PAR-AC01 MUST compare
the two mechanically.

#### Active commands

| Command IDs                | Manifest content dependency | Dependency rows                                                     |
| -------------------------- | --------------------------- | ------------------------------------------------------------------- |
| `bug`, `feature`, `secure` | `engineering-pursuit`       | D15 plus D08–D10 when the command requests implementation or checks |
| `compile-handoff`          | none declared               | D15–D16                                                             |
| `goal`                     | `goal-loop`                 | D15, D21–D22                                                        |
| `landscape`                | `competitive-analysis`      | D12, D15                                                            |
| `research`                 | `deep-research`             | D12, D15                                                            |
| `review`                   | `review`                    | D08, D15, D21                                                       |
| `task`                     | `verify`                    | D08–D10, D15                                                        |
| `teardown`                 | `reverse-engineering`       | D08, D15, D18                                                       |
| `verify`                   | `verify`                    | D08, D10, D15, D21                                                  |

The operational rows are requirements, not grants. For example, invoking
`feature` while mutation or process execution is unavailable MUST report that
unavailability rather than presenting the command prompt as execution parity.

#### Compatibility-deprecated commands

All 30 rows map first to D23 and then to the behavior named by their manifest
disposition:

- `native-tool:native_loop_start`: `loop-goal`, `loop-now`, `loop` → D22;
- `native-tool:native_loop_pause`: `loop-goal-pause`, `loop-pause` → D22;
- `native-tool:native_loop_resume`: `loop-goal-resume`, `loop-resume` → D22;
- `native-tool:native_loop_status`: `loop-goal-status`, `loop-status` → D22;
- `native-tool:native_loop_stop`: `loop-stop` → D22;
- `ledger-proposal:ledger_progress_propose`: `loop-goal-blocked`,
  `loop-progress` → D21;
- `ledger-proposal:ledger_resolution_propose`: `loop-goal-done` → D21;
- manual guidance: `loop-compact` → D17, `loop-doctor` → D26, and
  `loop-help` → D14; and
- stable unsupported diagnostics: `loop-ask` →
  `OPENCODE2_COMPAT_LOOP_ASK_UNSUPPORTED`, `loop-clear` →
  `OPENCODE2_COMPAT_LOOP_CLEAR_UNSUPPORTED`, `loop-cmd` →
  `OPENCODE2_COMPAT_LOOP_CMD_UNSUPPORTED`, `loop-command` →
  `OPENCODE2_COMPAT_LOOP_COMMAND_UNSUPPORTED`, `loop-dev` →
  `OPENCODE2_COMPAT_LOOP_DEV_UNSUPPORTED`, `loop-export` →
  `OPENCODE2_COMPAT_LOOP_EXPORT_UNSUPPORTED`, `loop-goal-clear` →
  `OPENCODE2_COMPAT_LOOP_GOAL_CLEAR_UNSUPPORTED`, `loop-init` →
  `OPENCODE2_COMPAT_LOOP_INIT_UNSUPPORTED`, `loop-logs` →
  `OPENCODE2_COMPAT_LOOP_LOGS_UNSUPPORTED`, `loop-prompt` →
  `OPENCODE2_COMPAT_LOOP_PROMPT_UNSUPPORTED`, `loop-remove` →
  `OPENCODE2_COMPAT_LOOP_REMOVE_UNSUPPORTED`, `loop-safe-dev` →
  `OPENCODE2_COMPAT_LOOP_SAFE_DEV_UNSUPPORTED`, `loop-shell` →
  `OPENCODE2_COMPAT_SHELL_UNSUPPORTED`, and `loop-testfix` →
  `OPENCODE2_COMPAT_LOOP_TESTFIX_UNSUPPORTED` → D29.

#### Configuration, skills, and skill resources

| Manifest assets                                                                                                                                                  | Dependency rows |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `agents/analyst`, `agents/generalist`, `agents/implementer`, `agents/orchestrator`, `agents/researcher`, `agents/reviewer`, `agents/strategist`, `agents/worker` | D02–D06         |
| disabled `agents/build`, disabled `agents/plan`                                                                                                                  | D28             |
| `overlay.example`, `overlay.schema`                                                                                                                              | D03, D19, D26   |
| `competitive-analysis`, `deep-research`, `engineering-pursuit`, `goal-loop`, `handoff-compiler`, `reverse-engineering`, `review`, `verify`                       | D15–D16         |
| `handoff-compiler/ACCEPTANCE`, `handoff-compiler/DESIGN`, `handoff-compiler/documentation`                                                                       | D15–D16         |

#### Plugin-owned runtime tools

| Tool IDs                                                                                                                                                                                                                                                                                                                              | Dependency rows                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `web_search`, deprecated alias `formerhuman_search`                                                                                                                                                                                                                                                                                   | D12, D14; the alias also has D23 compatibility obligations |
| `ledger_intent_propose`, `ledger_intent_frame`, `ledger_intent_activate`, `ledger_claim_request`, `ledger_claim_release`, `ledger_fact_record`, `ledger_evidence_submit`, `ledger_work_propose`, `ledger_progress_propose`, `ledger_resolution_propose`, `ledger_review_propose`, `ledger_approval_request`, `ledger_approval_status` | D14, D21                                                   |
| `native_loop_start`, `native_loop_pause`, `native_loop_resume`, `native_loop_stop`, `native_loop_status`                                                                                                                                                                                                                              | D14, D22                                                   |

This accounts for 41 commands, 12 configuration assets, eight skills, three
skill resources, and 20 plugin-owned runtime tools. Host-owned operational
tools are covered separately by D08–D14.

### 4.2 Role contracts

The eight role names are compatibility identifiers. Their native definitions
MUST be project-owned and MUST express these behavioral contracts without
copying prompt text:

| Role           | Mode            | Required contract                                                                                                     | Default capability posture                                                          |
| -------------- | --------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `generalist`   | primary/default | Direct execution for ordinary work; delegate only on explicit request or a bounded exclusively owned subtask          | read; qualified mutation/process only when the task requires it; bounded delegation |
| `orchestrator` | primary         | Coordinate rather than implement; require deliverable, ownership, acceptance, and stop conditions; synthesize results | read and delegation; no implicit mutation                                           |
| `analyst`      | subagent        | Economical source-grounded analysis; distinguish fact, inference, and unknown                                         | read only                                                                           |
| `implementer`  | subagent        | One bounded change with a failing test, minimal fix, and raw checks                                                   | qualified read/mutation/process; no default delegation                              |
| `researcher`   | subagent        | Bounded primary-source research with explicit uncertainty and stopping                                                | read plus qualified search/fetch; no mutation                                       |
| `reviewer`     | subagent        | Independent adversarial review without editing                                                                        | read only; no delegation                                                            |
| `strategist`   | subagent        | Consequential trade-off and architecture analysis                                                                     | read only; no delegation                                                            |
| `worker`       | subagent        | One narrow mechanical unit with exact evidence                                                                        | task-specific qualified capabilities; no delegation by default                      |

Prompts guide behavior but grant nothing. The tool and capability columns are
enforced mechanically. A reviewer cannot edit merely because model text asks it
to, and a researcher cannot access network merely because its name matches.

### 4.3 Dependency-to-kernel traceability

Target owner names in this table are normative design names, not claims that the
corresponding implementation already exists. `P0` through `P6` refer to the
implementation phases in Section 17.

| ID  | Controlling invariants                   | Plugins and kernel ports                                        | Events and lifecycle                                                      | Policy / failure contract                                                                              | Migration gate | Acceptance evidence            |
| --- | ---------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------- | ------------------------------ |
| D01 | PNS-I01, I05, I07–I08; PAR-I01, I07, I10 | `stock.chat`, `ProviderGateway`, thread projection              | admitted turn → provider/tool rounds → `turn.completed` or `turn.failed`  | one terminal result; stale/partial streams never complete                                              | P0, P5         | PAR-AC02, AC08, AC25, AC27     |
| D02 | PNS-I03, I06, I08; PAR-I01, I03          | `stock.agents`, catalog compiler, `PromptAssembler`             | startup validation; immutable policy in attempt snapshot                  | invalid role/default/allowlist fails closed                                                            | P0, P2         | PAR-AC04–AC05, AC08            |
| D03 | PNS-I05–I06, I08; PAR-I03, I10           | target `ProviderRoutingPolicy`, `ProviderGateway`               | route resolution → attempt allocation → physical call                     | no silent route fallback; unavailable route dispatches zero calls                                      | P2, P5         | PAR-AC04, AC08, AC15, AC24     |
| D04 | PNS-I02, I05–I06, I11; PAR-I02–I05       | `stock.delegation`, `ToolGateway`, target `ChildScheduler`      | `delegation.requested/denied`, `child.*` lifecycle                        | model proposes only; authority/depth/budget denial creates no child                                    | P1–P2          | PAR-AC15–AC16, AC20, AC23      |
| D05 | PNS-I05, I07; PAR-I02, I04–I05, I08      | target child ledger/session repository                          | allocation, revision-bound continuation, terminal child result            | wrong lineage/revision conflicts; one active run per child session                                     | P1–P2          | PAR-AC16, AC20–AC23            |
| D06 | PNS-I05, I11; PAR-I04–I06, I09           | target durable scheduler and delegation-group barrier           | group allocation → concurrent runs → `group-ready` → result delivery      | bounded all-settled fan-in ordered by proposal ordinal                                                 | P3             | PAR-AC17–AC19, AC21, AC23      |
| D07 | PNS-I01, I05–I06; PAR-I08, I10           | target `CancellationService`, provider/tool/execution gateways  | cancelling fence → descendant propagation → terminal reconciliation       | late receipts quarantined; cancellation is not rollback                                                | P3             | PAR-AC22–AC23                  |
| D08 | PNS-I05–I06, I12; PAR-I01, I10           | `stock.workspace`, `ToolGateway`, `ExecutionGateway`            | action/attempt/call/receipt; read terminal result                         | root confinement, use-time path check, bounded output                                                  | P4             | PAR-AC03, AC09                 |
| D09 | PNS-I05–I06, I12; PAR-I09–I10            | target mutation plugin, `ExecutionGateway`                      | allocated mutation → precondition check → receipt/reconciliation          | digest/scope/path mismatch denies; partial effect never reported clean                                 | P4             | PAR-AC10                       |
| D10 | PNS-I05–I06, I12; PAR-I08, I10           | target process plugin, `ExecutionGateway`                       | allocated process → spawn marker → exit/cancel/reconcile                  | closed executable profile, deadline/output/process-tree bounds                                         | P4             | PAR-AC11                       |
| D11 | PNS-I01, I05–I06, I12; PAR-I09–I10       | target Git plugin, ADR-007 worktree/repository ports            | typed read/mutation with repository/worktree receipt                      | exact repo identity, ownership, precondition, and gate; no shell bypass                                | P4             | PAR-AC12                       |
| D12 | PNS-I05–I06, I12; PAR-I01, I10           | `stock.search`, target search/fetch adapters, `ToolGateway`     | request → adapter call → provenance-labelled result/partial failure       | researcher/network ceiling, URL/SSRF/redirect/size policy                                              | P4             | PAR-AC13                       |
| D13 | PNS-I01–I02, I07; PAR-I05, I11           | target question plugin/port, existing gate service              | waiting-question → authenticated answer → exact run resume                | question answer is not gate approval; wrong actor/request denied                                       | P4–P5          | PAR-AC14, AC27                 |
| D14 | PNS-I02, I05–I06, I08; PAR-I01, I07      | tool contributions, `ToolGateway`, prompt tool snapshot         | tool call allocation → dispatch → result/error continuation               | tool must be visible, closed-schema valid, granted, current, bounded                                   | P0–P4          | PAR-AC05, AC09–AC14            |
| D15 | PNS-I02–I03, I08; PAR-I01                | `stock.skills`, command decider, `PromptAssembler`              | authenticated activation → versioned prompt block                         | content activates no authority; missing operational dependency is explicit                             | P0, P4         | PAR-AC06–AC07                  |
| D16 | PNS-I07–I09; PAR-I07, I10                | context/reference plugins, bounded context query port           | source revision → provenance block → prompt snapshot                      | precedence and taint fixed; unknown/stale source excluded or denied                                    | P1, P5         | PAR-AC08, AC25–AC26            |
| D17 | PNS-I05, I07–I08; PAR-I05, I07, I10      | target compaction workflow, `ProviderGateway`, artifact custody | overflow → compaction attempt → immutable summary/tail references         | failed/stale/unknown compaction cannot claim continuity                                                | P5             | PAR-AC25                       |
| D18 | PNS-I01, I05, I07; PAR-I04–I05, I08, I10 | journal, session repositories, projection engine                | admitted records → restart reconciliation → resumed or ambiguous work     | no in-memory promise is authority; unknown external delivery remains unknown                           | P1–P3, P5      | PAR-AC23, AC26–AC27            |
| D19 | PNS-I01–I02, I06; PAR-I03, I09, I11      | kernel policy evaluator, gates, all final gateways              | grant snapshot plus use-time re-evaluation; gate lifecycle where required | default deny and set intersection; text cannot grant or approve                                        | P0–P4          | PAR-AC05, AC10–AC14, AC20–AC22 |
| D20 | PNS-I02, I07, I09; PAR-I10               | `stock.observations`, canonical journal, projections            | canonical event → redacted observation proposal/projection                | capture/projection cannot become lifecycle truth; gaps remain explicit                                 | P1             | PAR-AC26                       |
| D21 | PNS-I01–I02, I07, I09; PAR-I10–I11       | `stock.ledger`, `stock.evidence`, gate/lease services           | proposal → reducer predicates → gate/fence → accepted domain event        | stale/gap/insufficient evidence blocks; proposals do not self-resolve                                  | P1, P4         | PAR-AC07, AC26, AC28           |
| D22 | PNS-I01–I02, I05, I11; PAR-I05, I07–I08  | `stock.loop`, workflow engine, scheduler                        | requested → finite transitions/actions/children → terminal predicate      | no-progress/budget stop; pause/resume unavailable until durable                                        | P2–P3          | PAR-AC07, AC19–AC24            |
| D23 | PNS-I03, I10; PAR-I01                    | compatibility command contributions and target mappings         | authenticated invocation → mapped proposal/guidance/typed denial          | manifest disposition is exact; generic model prose is not execution                                    | P0, P4–P5      | PAR-AC07                       |
| D24 | PNS-I03, I10–I12; PAR-I12                | static catalog/compiler, scoped adapter construction            | startup validate/construct; reverse cleanup on failure/shutdown           | exact accepted/source pin reconciliation, duplicate rejection/dedup policy, primary-error preservation | P0             | PAR-AC01, AC03, AC30           |
| D25 | PNS-I01, I09; PAR-I01, I05, I11          | `client.tui`, CLI, signed command/question/gate ports           | submit/stream/project/resume/cancel; terminal state from journal          | client has no writer; display cannot manufacture completion                                            | P5             | PAR-AC27                       |
| D26 | PNS-I03, I06, I08, I10; PAR-I03, I10     | target strict config loader, status/doctor service              | config decode → effective config/catalog digests → attempt snapshot       | unknown/invalid field or unavailable adapter fails closed and reports truth                            | P0, P5         | PAR-AC02, AC04, AC08, AC30     |
| D27 | PNS-I03, I12; PAR-I12                    | distribution builder/installer and supervisor materializer      | verify manifest → stage → atomic select → rollback receipt                | no auto-update; exact artifact/platform qualification; prior version retained                          | P6             | PAR-AC03, AC29–AC30            |
| D28 | PNS-I03, I10; PAR-I01                    | agent catalog validation                                        | startup/config selection                                                  | `build` and `plan` remain disabled and cannot be selected by alias                                     | P0             | PAR-AC04                       |
| D29 | PNS-I01–I03, I10; PAR-I01                | compatibility policy                                            | authenticated invocation → stable denial                                  | no daemon/polling/marker/direct-shell fallback                                                         | P0             | PAR-AC07                       |
| D30 | PNS-I02–I03, I10; PAR-I01, I12           | no owner until separately adopted                               | none; source presence creates no lifecycle                                | unreachable by default; separate intent and acceptance required                                        | P0             | PAR-AC01, AC03                 |
| D31 | PNS-I03, I06, I10, I12; PAR-I01, I12     | no owner until separately adopted                               | none                                                                      | absent by design; no hidden host dependency                                                            | P0             | PAR-AC01, AC03                 |
| D32 | PNS-I03, I12; PAR-I12                    | none; native contracts only                                     | none                                                                      | implementation identity rejected; behavioral evidence only                                             | P0             | PAR-AC03, AC30                 |

## 5. Native execution vocabulary

The implementation MUST distinguish these identities:

- **ThreadId:** a top-level human conversation.
- **TurnExecutionId:** one admitted user turn and its model/tool continuations.
- **AgentSessionId:** durable independent context for a primary or child agent.
- **AgentRunId:** one invocation or continuation within an agent session.
- **DelegationGroupId:** the complete child call set emitted by one parent
  provider result.
- **ChildExecutionId:** one kernel execution descended from a parent turn/run.
- **ActionId / AttemptId / PhysicalCallId:** existing governed action identities.
- **ModelToolCallId:** untrusted provider-supplied call identity bound to the
  exact provider attempt and visible-tool snapshot.

Thread, agent session, and execution are not synonyms. Resuming a child reuses
its `AgentSessionId` but allocates a new `AgentRunId`, attempt generation, and
physical calls.

## 6. `agent.delegate` tool contract

`curiosity.stock.delegation` owns one model-visible tool named
`agent.delegate`. `task` MAY exist temporarily as a compatibility alias, but
MUST map to the same proposal and MUST NOT implement a second child path.

### 6.1 Input

The closed v1 input has this semantic shape:

```ts
interface AgentDelegateInputV1 {
  readonly schemaVersion: 1;
  readonly agentId: string;
  readonly description: string;
  readonly task: {
    readonly objective: string;
    readonly deliverable: string;
    readonly acceptanceChecks: readonly string[];
    readonly nonGoals: readonly string[];
    readonly contextRefs: readonly string[];
  };
  readonly ownership: {
    readonly readOnly: boolean;
    readonly resources: readonly string[];
  };
  readonly requested: {
    readonly capabilities: readonly string[];
    readonly tools: readonly string[];
    readonly maximumProviderCalls: number;
    readonly maximumToolCalls: number;
  };
  readonly continuation?: {
    readonly agentSessionId: string;
    readonly expectedRevision: number;
  };
}
```

Bounds are kernel policy, not caller choice. Initial maxima are:

- description: 120 Unicode scalar values;
- objective and deliverable: 8 KiB each;
- at most 16 acceptance checks, 16 non-goals, 32 context references, 32
  resources, 32 capabilities, and 64 tools;
- total canonical input: 64 KiB; and
- all identifiers: 256 bytes or less using a closed identifier grammar.

The model cannot supply parent/root IDs, depth, group ID, child/run IDs,
provider route, agent policy version, catalog digest, grant, gate decision,
timestamps, usage, or terminal status. The kernel derives those fields.

`requested` can only narrow authority. An empty resource set means unknown
write scope, not unrestricted scope. Unknown or overlapping mutation scope is
serialized or denied.

### 6.2 Proposal and allocation

The tool returns an `agent.delegate` action proposal. Before allocation the
kernel MUST verify:

1. the tool version was visible in the parent provider snapshot;
2. the parent agent allows the selected child agent;
3. the selected agent exists, is a subagent, and is not disabled;
4. global, operator, parent-agent, workflow, and run depth ceilings all permit
   the next depth;
5. child count, concurrency, provider-call, tool-call, byte, and deadline
   budgets remain;
6. continuation identity belongs to the same root and permitted parent lineage,
   has the expected revision, and has no active run;
7. effective capabilities and tools are nonempty where required and do not
   exceed any ancestor ceiling; and
8. resource claims do not violate a current exclusive lease.

A failed check commits a typed denied receipt against the proposal. It creates
no child session and dispatches no provider.

Allocation is one transaction that commits the child session/run, ancestry,
delegation group membership and ordinal, budget snapshot, capability/tool
ceiling, resource-claim state, and pending child-start action before external
dispatch.

### 6.3 Effective child authority

For each capability and tool:

```text
effective child authority =
  qualified platform capabilities
  ∩ active runtime profile
  ∩ authenticated root grant
  ∩ parent effective authority
  ∩ parent agent child policy
  ∩ selected child agent request
  ∩ delegation request
  − current revocations
```

Every consequential sink re-evaluates the result immediately before dispatch.
Parent denials and revocations always propagate. A child role may narrow but
never replace parent restrictions.

The default profile permits at most two children per parent turn, two active
children per delegation group, and one delegation level. A separately reviewed
operator profile MAY raise the hard depth ceiling to three. No prompt or model
request can raise it.

### 6.4 Child prompt and context

A new child receives a fresh conversation containing only:

1. the selected versioned agent policy;
2. the normalized task contract;
3. kernel-selected context blocks resolved from admitted `contextRefs`;
4. applicable workflow and capability notices; and
5. no prior assistant/user exchange unless this is an authorized continuation.

The complete parent transcript is not inherited implicitly. Tool output,
remote text, imported state, and parent/model summaries retain untrusted
provenance. Reviewer context excludes private worker rationale and receives only
criteria, artifacts, diffs, receipts, and evidence references selected by
policy.

A continuation reuses the committed child transcript at an exact revision and
adds one new normalized task message. It cannot change the child agent identity
or widen its ceiling. Concurrent continuation of one child session fails with
`CHILD_SESSION_BUSY`.

### 6.5 Result

The parent-visible terminal result has this semantic shape:

```ts
interface ChildResultV1 {
  readonly schemaVersion: 1;
  readonly agentSessionId: string;
  readonly agentRunId: string;
  readonly childExecutionId: string;
  readonly agentId: string;
  readonly status: "completed" | "failed" | "cancelled" | "delivery-unknown";
  readonly text?: string;
  readonly artifactRefs: readonly string[];
  readonly evidenceEventIds: readonly string[];
  readonly errorCode?: string;
  readonly usage: {
    readonly state: "REPORTED" | "ESTIMATED" | "UNKNOWN";
    readonly inputTokens?: number;
    readonly outputTokens?: number;
    readonly cachedInputTokens?: number;
    readonly estimatedCost?: string;
  };
  readonly terminalDigest: string;
}
```

Large text is placed in immutable artifact custody; the inline result contains
a bounded excerpt and digest. Child output is untrusted model/tool-derived
content and is delimited when returned to the parent. `completed` means the
child run reached its mechanical terminal predicates; it does not approve,
merge, deploy, resolve Ledger work, or prove the task's semantic correctness.

## 7. Child lifecycle and events

The kernel owns the authoritative transition table:

```text
proposed -> allocated -> runnable -> running
running  -> waiting-tool | waiting-child | waiting-gate
waiting-* -> runnable
runnable/running/waiting-* -> cancelling
running/cancelling -> completed | failed | cancelled | delivery-unknown
```

Plugins propose semantic next work. Only the kernel changes these control
states.

At minimum, canonical v1 events MUST cover:

| Event                          | Required meaning                                                           |
| ------------------------------ | -------------------------------------------------------------------------- |
| `delegation.requested`         | Validated model proposal with parent call identity; no child authority yet |
| `delegation.denied`            | Stable policy/budget/depth/agent/resource denial; no dispatch              |
| `child.allocated`              | Durable lineage, ceilings, budgets, route policy, and group ordinal        |
| `child.run-started`            | Exact agent session revision and prompt source revision selected           |
| `child.waiting`                | Typed wait reason: tool, descendants, or binding gate                      |
| `child.completed`              | Terminal result digest and custody refs passed kernel predicates           |
| `child.failed`                 | Typed failure with delivery and usage state preserved                      |
| `child.cancelled`              | Cancellation became terminal; it does not claim external rollback          |
| `delegation.group-ready`       | Every expected ordinal is terminal at one committed revision               |
| `delegation.results-delivered` | One parent continuation consumed the exact ordered result set              |

The stored event envelope MUST also carry event schema version, aggregate
version, causation, correlation, root/parent/child execution IDs, plugin and
contribution version, catalog digest, actor, timestamp, and hash-chain fields.
The current global event shape lacks several of these fields and requires a
versioned migration rather than ad hoc child body fields.

## 8. Scheduling, fan-out, and fan-in

### 8.1 Sequential delegation

One child action is allocated, run to a terminal child result, and returned as a
tool result before the parent provider continuation is proposed. No in-memory
stack owns correctness. A restart between any two transitions rehydrates the
pending state and either continues from the last certain boundary or records
delivery uncertainty.

### 8.2 Concurrent fan-out

Multiple `agent.delegate` calls emitted by one parent provider result form one
delegation group. The kernel commits the complete expected call-ID and ordinal
set before dispatching any member. It may run eligible members concurrently up
to all inherited limits.

The current global run semaphore and serial action loop MUST NOT be held across
provider or tool I/O in the target scheduler. SQLite still has one writer;
external calls may overlap only after their independent call allocations have
committed.

Read-only children may overlap. Mutating children may overlap only when
canonical resource leases are disjoint and every actual sink path is contained
by the lease. Unknown, broad, or later-expanded scope is queued or denied.

### 8.3 Deterministic fan-in

Fan-in is all-settled. A failed child does not erase a successful sibling or
fabricate parent failure. Once every expected ordinal is terminal, the kernel
builds one result set ordered by proposal ordinal, not completion time, and
commits its digest. Exactly one parent continuation may consume that digest.

The parent receives one tool result per original model tool call. A semantic
plugin may add a compact group summary, but it cannot omit failure, cancellation,
delivery uncertainty, usage uncertainty, or artifact references.

Background fire-and-notify execution is not required for the first parity
release. If added later, it MUST use the same child records, cancellation,
budgets, and authenticated notification path. It cannot be an in-memory fork or
synthetic message that bypasses command admission.

## 9. Budgets and accounting

Every parent turn and child run snapshots finite limits for:

- total children and concurrent children;
- delegation depth;
- provider calls and retries;
- tool calls;
- input, output, context, and artifact bytes;
- provider-reported or estimated tokens;
- wall deadline and no-progress transitions; and
- resource claims.

Child consumption rolls up to every ancestor without rewriting child records.
Unknown usage remains `UNKNOWN`, not zero. The harness MAY enforce token or call
limits, but MUST NOT claim a hard currency ceiling until provider invoices and
all hidden/retry/compaction calls are reconciled under ADR-004.

Every retry is a new physical call with a new ID and retained relation to the
same logical run. Delivery-unknown calls are not automatically retried unless an
exact idempotent policy permits it.

## 10. Cancellation and failure semantics

The following diagnostics are stable contract families; exact suffixes may be
extended without changing their meaning:

| Condition                                   | Required outcome                                                    |
| ------------------------------------------- | ------------------------------------------------------------------- |
| Unknown/disabled child agent                | `CHILD_AGENT_UNAVAILABLE`; no allocation                            |
| Agent not in parent allowlist               | `CHILD_AGENT_DENIED`; no allocation                                 |
| Depth limit                                 | `CHILD_DEPTH_EXCEEDED`; no allocation                               |
| Child/count/call/tool/deadline budget       | `CHILD_BUDGET_EXCEEDED`; no over-budget dispatch                    |
| Requested authority exceeds ceiling         | `CHILD_CAPABILITY_DENIED`; no widening fallback                     |
| Continuation wrong lineage/revision         | `CHILD_CONTINUATION_CONFLICT`; no new run                           |
| Concurrent continuation                     | `CHILD_SESSION_BUSY`                                                |
| Resource overlap                            | `CHILD_RESOURCE_CONFLICT` or deterministic queue                    |
| Crash before dispatch marker                | terminal not-dispatched failure; safe scheduler retry MAY occur     |
| Crash after dispatch marker without receipt | `CHILD_DELIVERY_UNKNOWN`; no success or blind retry                 |
| Provider/tool error                         | typed child failure or tool result; partial text is not completion  |
| Parent cancellation                         | fence allocation, cancel descendants/calls, terminal reconciliation |
| Late/stale receipt                          | quarantine; cannot alter active generation or trigger fan-in twice  |
| Malformed/oversized child output            | fail child with bounded diagnostic; retain safe digest metadata     |
| One fan-out member fails                    | retain all siblings; all-settled ordered result set                 |
| Gate pending                                | child remains waiting; only eligible authenticated actor may decide |

Cancellation is not rollback. Receipts and reconciliation must describe any
known partial filesystem, process, Git, network, or provider effect.

## 11. Required native tool capability set

Full parity requires more than the 20 plugin-owned tool names. The native model
tool catalog MUST provide these capability classes through one governed path:

| Class               | Minimum behavior                                                                              | Initial policy                        |
| ------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- |
| Workspace discovery | list/glob/literal or reviewed pattern search with bounds                                      | enabled after read qualification      |
| Workspace read      | line/byte-bounded UTF-8 and binary metadata reads                                             | enabled after read qualification      |
| Workspace mutation  | create/patch/write/delete with expected digest and owned scope                                | disabled until mutation qualification |
| Process             | closed executable profiles for build/test/check, bounded output/deadline, process-tree cancel | disabled until process qualification  |
| Git                 | status/diff first; typed worktree and mutation separately gated                               | configured qualified subset only      |
| Search              | bounded query/results, exact adapter, taint and partial failures                              | disabled until network qualification  |
| Fetch               | HTTP(S), redirect/size/type/SSRF policy, source capture                                       | disabled until network qualification  |
| Question            | bounded choices/free text, authenticated response, no approval implication                    | enabled when client lifecycle exists  |
| Skill               | list and activate exact versioned content                                                     | enabled                               |
| Delegation          | `agent.delegate` only                                                                         | disabled until Sections 6–10 qualify  |
| Ledger/evidence     | proposal-first domain commands and read projections                                           | enabled per exact sub-capability      |

Generic shell is not the target architecture for Git, network, or arbitrary
mutation. A reviewed process profile may run repository-prescribed checks, but
it cannot silently become an unbounded transport around denied capabilities.

## 12. Provider, context, and compaction requirements

### 12.1 Role-aware routing

Native configuration MUST bind each enabled role to a provider/model policy or
an explicit shared route. Route resolution occurs before attempt allocation and
the selected provider, model, effort/variant, adapter version, and policy digest
enter the immutable attempt snapshot.

Unavailable or forbidden routes fail with a typed diagnostic. There is no
cross-provider or cross-model fallback unless a separately versioned policy
names the exact ordered alternatives and each physical call remains visible.

### 12.2 Context

The existing fixed prompt slots, provenance labels, exact source revision,
whole-block overflow, and prompt digest are retained. Whole-journal reads in
command/reaction contexts MUST be replaced with bounded query capabilities.

Child context adds task-contract and lineage blocks but follows the same global
budget. User, assistant, tool, and system roles remain distinct. A model or
client cannot inject system/tool execution history as fact.

### 12.3 Compaction

Dropping old messages silently is not parity. When history cannot fit, the
kernel either denies the provider call or starts an explicit `compaction`
provider purpose with its own action, attempt, physical call, usage, cancellation,
and receipt.

The resulting summary is an immutable, provenance-labelled artifact linked to
the exact covered message range and a retained tail. Replay must produce the
same visible range and references. Missing, failed, stale, or delivery-unknown
compaction cannot claim continuity.

## 13. Ledger, evidence, loop, and compatibility behavior

The OpenCode2 implementation intentionally fails closed for several material
Ledger and loop transitions because host fencing, lineage, interrupt, and
authoritative persistence were unproved. Native migration MUST preserve the
safety contract, not the host limitation:

- intent, criteria, work, fact, evidence, progress, review, and resolution
  inputs remain proposals until native reducers and predicates accept them;
- root activation and binding approval require authenticated gate commands;
- claims require qualified leases/fences before becoming available;
- capture gaps, stale revisions, missing event custody, and insufficient
  evidence block resolution;
- finite workflows may replace prompt-based loop continuation only after their
  real actions and descendants are terminal;
- pause/resume remain unavailable until durable pause state and current fencing
  are implemented; and
- every deprecated command retains its reviewed disposition. One generic
  unsupported prompt is insufficient when the manifest promises a native
  mapping or manual guidance.

Compatibility tool names MAY be retained, but an implementation that returns a
diagnostic where the OpenCode2 surface performs a currently usable operation is
not parity. Diagnostics count as parity only for a source behavior that was
itself deliberately disabled or proposal-only.

## 14. Configuration, client, and distribution contracts

### 14.1 Native configuration

The closed configuration schema MUST include:

- enabled primary and subagent roles and one valid default primary;
- exact role-to-model routing policy;
- global and per-role capability/tool ceilings;
- global and per-role delegation depth, child, and concurrency limits;
- qualified adapter identities and endpoint policy;
- workspace/repository identity;
- context, history, and compaction limits; and
- platform/profile qualification identity.

Unknown fields fail closed. The effective config and catalog have separate
canonical digests, both captured in attempts. Doctor reports catalog presence,
end-to-end reachability, adapter readiness, and qualification separately.

### 14.2 TUI/CLI

The native client MUST support thread list/new/resume, agent selection among
valid primary roles, prompt-command activation, streaming projection, typed
questions/gates, cancellation, and clear terminal status for parent and child
work. It submits authenticated commands and never writes canonical state.

Child inspection is a read-only projection. Displaying “completed” requires a
committed terminal child result, not an ended animation or provider stream.

### 14.3 Distribution

The current Darwin arm64 Bun-compiled artifact is experimental. It does not
replace OpenCode installation, update, rollback, signing, notarization, or
production guarantees. Native cutover requires an immutable version, manifest
and supervisor digests, install receipt, atomic current-version selection,
rollback test, and separately authorized platform qualification. Automatic
update remains forbidden.

## 15. Migration requirements

### 15.1 Content and configuration

1. Freeze the source inventory and record digests for the eight role
   definitions, eight skills, 41 commands, and 20 plugin-owned tool names.
2. Author native behavior contracts independently; do not copy source prompt
   prose.
3. Map each active command to its required native capability classes. A command
   is unavailable if a mandatory class is unavailable.
4. Translate model routes, enabled agents, default agent, and requested depth
   only through an operator-reviewed native config. Do not infer grants from
   OpenCode permission syntax.
5. Keep the 30 deprecated command dispositions until a separately approved
   removal migration.

### 15.2 State

No OpenCode or `.opencode/opencode2-config` file becomes native canonical state
by copying it.

An optional importer MAY:

- decode exact supported source versions;
- verify source digests and preserve source path/version provenance;
- import transcript text, facts, and evidence references as untrusted or
  non-authoritative imported observations; and
- produce a reconciliation report with accepted, rejected, and ambiguous rows.

It MUST NOT import an approval, active claim, gate decision, completed intent,
running loop, provider delivery fact, child terminal fact, or capability grant
as current authority. Pending/running source work becomes stopped or ambiguous
and requires an authenticated native restart. Unknown versions and malformed
records fail without partial import.

### 15.3 Cutover and rollback

1. Run native and OpenCode paths only against separate state roots; never use
   dual writers.
2. Complete the acceptance dossier in Section 16 with deterministic fake
   providers/tools before any live-provider qualification.
3. Perform a read-only export/import rehearsal and compare user-visible threads,
   command availability, role routing, and non-authoritative Ledger views.
4. Require explicit operator choice of the native artifact and preserve the
   prior OpenCode installation unchanged for rollback.
5. Do not uninstall or mutate global OpenCode config as part of native startup.
6. Declare cutover only when every `ESSENTIAL` row is `PASS`, every
   `REPLACEABLE` row has a passing native contract, and every other row is
   explicitly unavailable or rejected.

## 16. Binary acceptance checks

### Inventory and truth

- [x] **PAR-AC01 — Complete inventory:** a generated check reconciles the
      OpenCode2 manifest, composition root, accepted/current host-version pins,
      host validation contract, and native parity matrix; there are zero
      unclassified active assets/tools/features or unexplained pin conflicts.
- [x] **PAR-AC02 — No name-only claim:** status and tests distinguish
      `catalogued`, `scaffolded`, `available`, and `qualified`; catalog equality
      alone cannot emit “behavioral parity.”
- [x] **PAR-AC03 — Host independence:** with OpenCode packages/config/cache/state
      absent and network denied, the native build, focused tests, startup, and
      catalog projection are unchanged.

### Roles, commands, and context

- [x] **PAR-AC04 — Role policy:** all eight roles have exact versioned policy,
      tool/capability request, child allowlist, model route, and digest; invalid
      primary/default selections fail closed.
- [x] **PAR-AC05 — Mechanical role limits:** reviewer mutation, researcher
      mutation, non-researcher network, and unauthorized delegation are denied
      at the final sink regardless of prompt text.
- [x] **PAR-AC06 — Command behavior:** each of the 11 active commands is invoked
      through the authenticated path and receives its required skill/context
      and executable capability set, or reports an accurate unavailable code.
- [x] **PAR-AC07 — Compatibility behavior:** each of the 30 deprecated commands
      executes its individual native mapping, guidance, or stable denial; no
      model response can fabricate a mapped operation.
- [x] **PAR-AC08 — Context/replay:** identical catalog, config, source revision,
      and child/session revision produce identical ordered blocks, tools, route,
      and prompt digest.

### Tools and execution

- [x] **PAR-AC09 — Read tools:** traversal, absolute escape, symlink swap,
      binary/UTF-8, oversized input/output, and cancellation cases preserve root
      confinement and bounded receipts.
- [x] **PAR-AC10 — Mutation:** digest/precondition mismatch, scope overlap,
      symlink/ancestor swap, partial write, cancellation, and restart never
      produce an unrecorded successful mutation.
- [x] **PAR-AC11 — Process:** executable/argv/env/cwd allowlists, timeout,
      output cap, signal escalation, process descendants, and delivery ambiguity
      pass on each claimed platform.
- [x] **PAR-AC12 — Git:** repository/worktree identity, clean/dirty
      preconditions, ownership collision, ref race, path escape, cancellation,
      and partial mutation preserve exact receipts and required gates; denied
      Git operations cannot execute through a generic process profile.
- [x] **PAR-AC13 — Search/fetch:** URL, redirect, SSRF, credential, timeout,
      response-size, partial-result, and prompt-injection fixtures remain bounded
      and provenance-labelled.
- [x] **PAR-AC14 — Question versus approval:** a correlated user answer resumes
      the exact waiting run but cannot approve a binding gate unless submitted
      through the distinct eligible-actor gate command.

### Real subagents

- [x] **PAR-AC15 — Sequential child:** a scripted parent delegates once; an
      independently routed child gets a fresh context, makes its own physical
      provider call, returns one durable result, and the parent continues once.
- [x] **PAR-AC16 — Child continuation:** a second delegation with the exact
      child session and revision retains child history, allocates a new run/call,
      rejects changed lineage/agent/ceiling, and prevents concurrent resume.
- [x] **PAR-AC17 — Parallel fan-out:** two independent children pass controlled
      barriers proving overlap after both allocations commit; peak concurrency
      never exceeds the inherited limit.
- [x] **PAR-AC18 — Deterministic fan-in:** reversed child completion order yields
      the same ordinal result order and fan-in digest, and exactly one parent
      continuation consumes it.
- [x] **PAR-AC19 — Partial fan-out failure:** success, failure, cancellation, and
      delivery-unknown siblings all remain visible in one all-settled result;
      no sibling evidence is lost.
- [x] **PAR-AC20 — Ceiling and depth:** unknown agent, disallowed child, excessive
      depth, child count, provider/tool budget, capability, and tool requests
      dispatch zero external calls with their stable diagnostics.
- [x] **PAR-AC21 — Resource collision:** disjoint read-only children overlap;
      overlapping/unknown mutators queue or fail deterministically, and use-time
      sink paths cannot escape their committed claims.
- [x] **PAR-AC22 — Descendant cancellation:** cancellation before allocation,
      before dispatch, during provider, during tool, while waiting, and after a
      stale receipt leaves every descendant terminal or explicitly ambiguous and
      triggers no second parent continuation.
- [x] **PAR-AC23 — Child restart:** process termination at every allocation,
      dispatch, receipt, child terminal, group-ready, and result-delivery
      boundary recovers without lost work, duplicate logical child, duplicate
      result delivery, or fabricated success.
- [x] **PAR-AC24 — Child accounting:** every child, retry, tool, and compaction
      physical call is attributable to child and root; unknown usage stays
      unknown and ancestor totals include descendants without double count.

### Persistence, compaction, clients, and migration

- [x] **PAR-AC25 — Compaction:** a deterministic overflow fixture creates one
      explicit accounted compaction attempt and replay preserves covered range,
      tail, summary digest, and failure/uncertainty semantics.
- [x] **PAR-AC26 — Projection rebuild:** thread, child, Ledger, evidence, and
      workflow views replay from canonical records after reopening with no
      materialized projection tables, or fail on an unknown schema.
- [x] **PAR-AC27 — Client lifecycle:** new/resume/select-agent/command/question/
      gate/cancel/child-inspect flows operate only through signed commands and
      show terminal status from committed events.
- [x] **PAR-AC28 — Import safety:** exact-version fixtures import only allowed
      observation data; approvals, active claims, running loops, grants, and
      completion assertions remain non-authoritative; malformed import is atomic.
- [x] **PAR-AC29 — Cutover rollback:** staged native selection, forced failure,
      and explicit receipt-bound rollback retain/select one startable prior
      version and do not modify OpenCode global config or source state.
- [x] **PAR-AC30 — Full verification:** focused suites, architecture checks,
      capability truth, package verification, root verification, diff review,
      and a no-Critical/Major adversarial review pass with raw evidence linked.

The full parity verdict is mechanically:

```text
PARITY =
  all PAR-AC01..PAR-AC30 PASS
  AND zero unclassified inventory rows
  AND every ESSENTIAL dependency available
  AND every REPLACEABLE dependency has a native passing contract
  AND no unavailable capability is represented as enabled
```

## 17. Implementation sequence

### Phase 0 — Correct capability truth

1. Replace the name-only parity claim with inventory terminology in tests and
   status.
2. Generate the source-to-native disposition artifact and fail on drift.
3. Keep child execution, mutation, process, Git, network, and compaction
   unavailable.

### Phase 1 — Child contracts and persistence

1. Add versioned agent-session, agent-run, delegation-group, resource-claim,
   budget, and child-result domains.
2. Add schema migrations, immutable snapshots, ancestry constraints, and
   projection reducers.
3. Extend event envelopes with schema/aggregate/causation identities rather
   than hiding authority fields in bodies.

### Phase 2 — Native delegation semantics

1. Add the `curiosity.stock.delegation` tool and agent-run workflow.
2. Reuse `ProviderGateway`, `ToolGateway`, prompt assembly, attempts, gates, and
   receipts; do not create a child-only bypass.
3. Add role-aware routes, child prompt/context policy, terminal result custody,
   and revision-bound continuation.

### Phase 3 — Scheduler and fan-in

1. Replace external-I/O serialization with bounded durable runnable queues while
   retaining one writer.
2. Implement complete-group allocation, concurrency permits, resource leases,
   all-settled reconciliation, ordinal fan-in, and parent result-delivery CAS.
3. Implement ancestry cancellation and crash reconciliation at every boundary.

### Phase 4 — Operational tool parity

1. Complete workspace discovery/read.
2. Qualify mutation, reviewed process profiles, and Git capabilities separately
   through the Rust supervisor.
3. Qualify exact search and fetch adapters with taint and SSRF controls.
4. Add typed user questions without conflating them with gates.

### Phase 5 — Long-session and client parity

1. Implement explicit compaction and continuity.
2. Complete thread/child resume, cancellation, selection, and inspection in the
   TUI/CLI.
3. Add strict config/doctor behavior and role-aware provider routing.

### Phase 6 — Migration and cutover qualification

1. Implement the non-authoritative importer and reconciliation report.
2. Run the full fake-provider/fake-tool fault and concurrency matrix.
3. Qualify the exact native artifact, install, and rollback profile.
4. Remove OpenCode only after the computed parity verdict is true.

## 18. Evidence crosswalk and qualification boundary

| Contract area               | Source evidence                                              | Qualified native evidence                                      | Qualification conclusion                                                   |
| --------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Active composition          | `src/plugin/plugin.ts` composes config, hooks, search, tools | generated manifest/composition/catalog reconciliation            | Mechanism replaced; every manifested asset and composed feature classified |
| Roles/default/search policy | OpenCode2 role configuration and host validation contract    | sealed eight-role policy, exact route snapshots, final-sink tests | Closed role and route policy qualified                                     |
| Host subagents              | bundle depth, subagent modes, host task/session evidence     | durable child sessions, independent calls, bounded scheduler      | Sequential, continuation, parallel, fan-in, failure, cancellation qualified |
| Tools                       | host validation inventory and plugin tool registration       | classified native tool catalog and sink-specific acceptance tests | Native bounded contracts qualify; absent capabilities deny explicitly      |
| Context/observation         | session/tool/event hooks and bounded projection              | deterministic context replay and canonical observation reducers   | Ordered context, taint, prompt digest, and rebuild qualified                |
| Ledger/evidence             | strict source reducers plus intentional disabled transitions | native reducers, gates, evidence, and compatibility dispositions  | Native authority boundary and stable denials qualified                     |
| Loop                        | source finite budgets plus host continuation disabled        | finite workflow engine, budgets, cancellation, terminal checks    | Bounded workflow replacement qualifies; daemon behavior remains retired    |
| Persistence/cancellation    | host behavior partly unqualified                             | SQLite attempts, ancestry, restart boundaries, stale receipts     | Local event-journal recovery profile qualified                             |
| Distribution                | OpenCode package/installer contract                          | immutable experimental Darwin binary and rollback precondition    | Development artifact cutover/rollback qualified; release remains forbidden |

No essential dependency is silently dropped: each is `QUALIFIED`; each
`REPLACEABLE` row has a passing bounded native contract; obsolete rows are
`RETIRED`; incidental rows are `EXCLUDED`. This verdict is limited to the
trusted-local, single-user, Darwin-arm64 development profile. It grants no
production, publication, deployment, signing, automatic-update, broader Git,
sandbox, remote-service, or release authority.

## 19. Findings, unknowns, and stop decision

### 19.1 Findings

- **Documented:** the OpenCode2 plugin actively configures eight roles, injects
  context, observes host/tool events, and registers 20 domain/search/loop tools.
- **Documented:** its manifest installs 41 commands and eight skills; 30 command
  names are deliberately deprecated compatibility surfaces.
- **Documented:** the exact host ABI exposes session, agent, tool, event, skill,
  command, provider-facing, storage, and search domains; Curiosity uses only a
  bounded subset directly from its plugin.
- **Documented:** the generic bundle expects subagent modes and configurable
  nesting, while the plugin's own capability report refuses to treat host child
  lineage as authoritative.
- **Verified:** native delegation allocates durable child sessions and physical
  provider calls, enforces a maximum of four group members and two active
  children, and delivers one deterministic all-settled result to the parent.
- **Verified:** native tools include bounded workspace read/mutation, reviewed
  process, governed Git, search/fetch, question, child, Ledger, evidence, and
  finite-workflow contracts, each subject to role and capability sinks.
- **Documented contradiction:** accepted ADR-0025 and ADR-0027 constrain the
  OpenCode host to beta-17595, while current package, host guard, tests, and
  container validation use beta-18138. The latter is implementation state, not
  accepted qualification authority in this specification.
- **Inference (high confidence):** implementation-oriented roles and commands
  materially rely on host mutation and process tools even though those tools are
  not plugin-owned.
- **Verified:** the native scheduler permits concurrent external calls while
  retaining one SQLite authority writer and deterministic result ordering.
- **Verified:** the source host-version conflict is explicitly disposed as
  `SOURCE_HOST_RETIRED_NATIVE_INDEPENDENT`; no beta-18138 authority is inferred.

### 19.2 Unknowns

- Exact beta-18138 dynamic task scheduling, cancellation, and crash behavior was
  not executed.
- Any authorization for the beta-18138 replacement outside the inspected plugin
  decision set is unknown; none may be inferred from package or test bytes.
- Live provider delivery, retries below SDK adapters, usage accuracy, and cost
  reconciliation remain unqualified.
- The effective operator overlay and historical user permission/model choices
  at any installation are unknown.
- Hard-reset SQLite storage remains scaffolded rather than qualified. The local
  transactional restart profile does not claim hard-reset durability.
- Linux and Windows are not part of this qualification record; no cross-platform
  result is inferred from inventory declarations or portable source.
- Model quality equivalence across different system content is not mechanically
  provable; parity checks therefore enforce policy/context/tool contracts and
  observable outcomes, not identical prose or stochastic text.

### 19.3 Adaptive bibliography

| Source                                                                              | Why retained                                                                 | Claim supported                                                                            | Why preferable                                                                                |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `apps/plugin/opencode2/assets/manifest.json`                                        | Complete authored asset ledger                                               | Exact command/config/skill inventory and dispositions                                      | Machine-readable project source outranks prose counts                                         |
| `apps/plugin/opencode2/src/plugin/plugin.ts` and active feature imports             | Runtime reachability root                                                    | Exactly four composed feature groups and lifecycle/version behavior                        | Composition root distinguishes active behavior from scaffolding                               |
| `apps/plugin/opencode2/src/features/{config,hooks,tools,ledger,loop-engine,search}` | Primary Curiosity-on-OpenCode behavior                                       | Roles, hooks, tool contracts, failure semantics, disabled authority                        | Executed project source is stronger than intended design docs                                 |
| local `@opencode-ai/plugin@0.0.0-beta-18138` declarations and validation contract   | Current implementation seam, explicitly not accepted qualification authority | Agent/session/tool/event domains and built-in host capability inventory                    | Exact current bytes are preferable to generic OpenCode documentation for implementation facts |
| OpenCode2 ADR-0025 and ADR-0027                                                     | Accepted host-version and qualification boundary                             | beta-17595 exact pin; test-only authority; no inferred composition/release authority       | Accepted decisions govern authority and expose the beta-18138 source conflict                 |
| `research/harnesses/opencode.md` at upstream `v1.18.22`                             | Existing bounded host trace                                                  | Corroborating task child-session, permission, loop, persistence, and cancellation behavior | Evidence-labelled dossier preserves source identity and unknowns                              |
| `apps/custom-harness/src` kernel/plugins/storage and focused tests                  | Current native implementation truth                                          | What is implemented, scaffolded, serial, unavailable, or unqualified                       | Source and behavioral tests outrank status language                                           |
| ADR-001 through ADR-011 and `PLUGIN-NATIVE-SPEC.md`                                 | Accepted Curiosity authority                                                 | One authority, proposal boundary, final-sink checks, static plugins, qualification         | Project decisions govern the replacement architecture                                         |

### 19.4 Qualification close

The first high-value thread was whether child execution, restart, cancellation,
and fan-in were operator-reachable rather than projection-only. Scripted parent,
child, fault, and restart fixtures established independent physical calls,
durable lineage, bounded concurrency, ordinal fan-in, and one parent resume.

The second thread was whether catalog equality had been mistaken for behavior.
The four-state maturity model, signed active-command matrix, compatibility
disposition events, sink tests, and generated inventory prevent that inference.

The final material thread was the beta-17595/beta-18138 contradiction. The native
harness imports neither host package and passes an isolated host-free build,
focused test, startup, and catalog check. The conflict is therefore retained as
source history and disposed only by retiring the source host dependency.

`CURIOSITY_NO_GO`:

- copying OpenCode task code, prompts, output tags, permission grammar, hooks, or
  session schema — no decision value and contrary to the clean-room objective;
- dynamically probing live subagents/providers — unnecessary for defining the
  minimum native contract and not authorized by a qualified disposable profile;
- adopting MCP/LSP/ACP/server/plugin-marketplace features — no current Curiosity
  dependency;
- implementing experimental background child notification before durable
  foreground fan-out/fan-in — lower value and avoidable complexity; and
- treating exact stochastic model output as a parity oracle — non-deterministic
  and weaker than mechanical policy/action/receipt checks.

Coverage is complete for the bounded native parity decision and saturated across
the manifest, composition root, host seam, native catalog, authority sinks,
fault matrices, clients, migration, and distribution rollback. PAR-AC01 through
PAR-AC30 are closed by `PARITY-QUALIFICATION.json` and
`PARITY-VERIFICATION.md`; any future source, inventory, ledger, or evidence drift
fails the required `parity:check` entrypoint.
