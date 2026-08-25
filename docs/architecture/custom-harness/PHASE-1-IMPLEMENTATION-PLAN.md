# Custom harness Phase 1 implementation plan

**Status:** Superseded for tranche-entry sequencing by ADR-011 — 2026-08-25  
**Current use:** requirements, qualification backlog, and acceptance-test map;
implementation now proceeds directly under
[ADR-011](decisions/ADR-011-direct-build-and-host-decoupling.md). Capability
qualification, release, deployment, production, and security claims remain
separate decisions.  
**Decision history:** Proposed 2026-08-24; accepted by the user 2026-08-24.  
**Authority:** Documentation and implementation planning only. Acceptance of
this plan does not authorize Q1, any later tranche, or any code, dependency,
lockfile, CI, release, deployment, production, or security-acceptance change.
This plan records the bounded route from the accepted ADRs to a locally qualified
Phase 1 candidate. Every tranche, beginning with Q1, requires a later, separate,
explicit tranche-entry decision.  
**Decision basis:** [Accepted architecture package](README.md),
[ADR-001](decisions/ADR-001-effect-authority-rust-supervisor.md) through
[ADR-010](decisions/ADR-010-provenance-updates-licenses.md).  
**Plan owner:** Unassigned.

## 1. Binary outcome and hard boundary

Phase 1 has only two outcomes:

- **Qualified local candidate:** all required tranches exit with exact evidence
  for at least one selected non-Windows local profile; every enabled surface is
  within that profile and the cooperative trusted-computing base (TCB).
- **Stopped fail closed:** any required qualification is missing, contradictory,
  or fails. The affected capability remains unavailable; the plan does not
  substitute a weaker mechanism or silently narrow a test after failure.

The candidate is not a release or production system. It supports one
authenticated human on one trusted local host, reviewed tools only, default-deny
and propose-first authority, one Effect.ts application authority, and one narrow
mandatory Rust supervisor. Every physical provider request inside the qualified
cooperative TCB is durably accounted for, including ambiguous delivery and
unknown usage. No hard currency guarantee is made.

Windows, remote access, multi-user operation, untrusted execution, and every
unqualified process, sandbox, filesystem, path, Git, authentication, provider,
or durability profile are unavailable. Their operations deny rather than
degrade.

## 2. Verified starting point and evidence rule

The planning pass inspected repository source at
`8670d358f761003c49902db5f148baab0c2e6be4` plus the pre-existing untracked
architecture and research files. The following facts constrain placement but do
not qualify a runtime:

- root workspaces currently include `apps/*`, `apps/plugin/*`, and `packages/*`;
  no custom-harness workspace exists;
- `apps/runtime/AGENTS.md` assigns harness adapters and harness lifecycle
  elsewhere, while `apps/plugin/opencode2/AGENTS.md` preserves its own narrow
  plugin-first authority;
- the root, runtime, web, and docs manifests contain no Effect or Vercel AI SDK
  dependency; the plugin alone pins an Effect beta for its separately bounded
  plugin role; and
- the installed Darwin arm64 Git, SQLite, Rust, Bun, and Node versions are
  discovery inputs only. They are not selected or qualified by their presence.

Primary references were checked only to shape qualification questions:

- SQLite's official [WAL](https://www.sqlite.org/wal.html) and
  [PRAGMA](https://www.sqlite.org/pragma.html) references make WAL, sync, VFS,
  connection, and hard-reset behavior profile-sensitive. The WAL reference also
  records version-specific defects. Documentation alone is not a durability
  result.
- Git's official [`git worktree`](https://git-scm.com/docs/git-worktree)
  reference distinguishes worktree registration and administrative state from
  directory presence. It does not establish race-resistant path containment.
- Vercel's current
  [AI SDK Core text-generation documentation](https://ai-sdk.dev/docs/ai-sdk-core/generating-text)
  exposes multi-step/tool behavior and callbacks. The exact source revision and
  adapter must prove that automatic loops/retries are disabled and each physical
  send is observable.
- Effect's official [documentation](https://effect.website/docs/) currently
  exposes multiple major-version tracks. The plugin's existing Effect pin is not
  inherited as a custom-harness qualification.

These mutable pages are discovery references accessed 2026-08-24, not immutable
qualification evidence. Every consequential tranche must use exact source,
artifact, license, feature, build, and platform identities plus reproducible
runtime observations. Research dossiers remain inputs only; this plan does not
change or elevate `research/harnesses/RESEARCH-CONTRACT.md`.

## 3. Placement decision and smallest viable options

Under this accepted plan, the implementation target is a new isolated
`apps/custom-harness/` workspace, with its Rust child beneath that workspace.
Exact package names, versions, database binding, authentication mechanism, IPC
primitive, and selected platform remain qualification outputs, not facts in this
plan.

| Option                                           | Correctness and security                                                                                           | Operability and migration                                                                                               | Principal failure mode                                                            | Verdict                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------- |
| New `apps/custom-harness/` workspace             | Preserves one new Effect authority and keeps Rust subordinate; does not inherit existing component authority       | New verification wiring is required, but the unit is removable before durable use and can own its qualification records | A broad first change could accidentally create alternate transports or host calls | **Recommend**, with the narrow I1 slice below |
| Add harness lifecycle to `apps/runtime`          | Conflicts with the current repository constitution and risks mixing retrieval/runtime state with harness authority | Reuses Rust build machinery but creates difficult ownership and migration coupling                                      | Existing runtime boundaries become a second plausible authority                   | Reject                                        |
| Add harness lifecycle to `apps/plugin/opencode2` | Conflicts with the plugin's bounded host lifecycle and could make host/plugin output authoritative                 | Reuses Effect, but couples a standalone local harness to one plugin ABI                                                 | Plugin callbacks or Ledger state become an alternate command path                 | Reject                                        |

The recommended placement is reversible until durable schemas and external
effects are enabled. After that point rollback means quiesce, preserve evidence,
and use a reviewed migration or prior qualified binary; deleting state or
pretending an external effect rolled back is forbidden.

## 4. Authority, invariants, and execution rules

### 4.1 Authority boundaries

- Effect owns admission, identities, events, operational ledgers, attempts,
  policy, proposals, gates, provider orchestration, accounting, and completion.
- Rust owns only capability probes, exact-grant validation, supervised host
  mechanics, bounded output, descendant termination evidence, root-anchored Git
  mechanics, and invocation of a separately qualified sandbox adapter.
- SQLite and canonical artifacts hold durable facts; projections, UI, logs,
  telemetry, model/tool output, and Rust receipts are evidence only.
- One authenticated human may issue a binding gate decision. A model, tool,
  supervisor, transport, or UI cannot authenticate that human or resolve a gate.
- Reviewed external tools are cooperative TCB components. A grant validates the
  declared invocation; it is never described as complete same-user confinement.

### 4.2 Tranche protocol

1. Tranches execute in the order Q1-Q4, then I1-I10. Plan acceptance authorizes
   none of them. Each starts only after its own explicit tranche-entry decision.
   A tranche is one independently reviewable change set; it cannot borrow an
   unaccepted result from a later tranche.
2. Qualification tranches may create disposable probes and fixtures, but no
   product path may depend on them until their evidence record is accepted.
3. Each tranche-entry decision accepts a reviewed file/surface list, exact
   qualification inputs, and applicable canonical-root checks. Tests are written
   to fail before the smallest behavior change.
4. Exit requires all named tests, evidence artifacts, negative controls, and
   repository checks to pass. Expected skips are allowed only for explicitly
   documented platform-inapplicable or fail-closed cases with retained review
   and evidence; any unexplained or unreviewed skip fails tranche exit.
   `bun run verify` remains mandatory and may not be skipped. `UNKNOWN` is a
   stop, not a pass, for any capability the tranche would enable.
5. An accepted tranche may enable only its listed surface. Unrelated surfaces
   remain disabled and must report stable unavailable reasons.
6. A changed dependency, feature, artifact, platform, VFS, filesystem, tool,
   provider adapter, authentication mechanism, supervisor, or backend invalidates
   the dependent qualification before use.
7. No safety acceptance relies only on mocks. Unit and synthetic tests precede
   exact-profile host/fault observations; both are retained when the acceptance
   check requires runtime behavior.

### 4.3 Evidence and ID conventions

- Work IDs use `<tranche>-Wnn`; test/evidence IDs use `<tranche>-Tnn` and
  `<tranche>-Enn`. Pre-tranche documentation/audit evidence uses `PLAN-Enn`.
- Test evidence records the source commit, dirty state, exact artifacts and
  digests, command, environment/profile, result, retained output hash/location,
  and known exclusions.
- **PLAN-E01 — architecture-status audit:** a retained file-by-file scan of the
  package index and ADR-001 through ADR-010, including source commit, dirty state,
  command, output, and output hash, proving that each ADR is accepted or
  explicitly superseded and that this plan changed no accepted status.
- **PLAN-E02 — plan/tranche-entry audit:** retained, distinct review records for
  plan acceptance and every entered tranche (including Q1), plus the exact
  120-row trace-parser result and source identity proving no tranche began before
  its own entry decision. It remains `PENDING` until those decisions exist and is
  evidence only, never self-executing authorization.
- Every tranche retains `<tranche>-E02`, its canonical-root repository
  verification record. From the repository root it records exact commands,
  outputs, and hashes for changed-document format and local-link checks,
  `bun run inventory:check`, `bun run status:check`, and `bun run verify`. A
  tranche that changes source, package, build, or test surfaces also records
  `bun run check-types`, `bun run lint`, `bun run test`, and `bun run build`, plus
  any changed workspace's stricter normative check not reached by those root
  commands. The entry review may mark a command not applicable only with a
  retained untouched-surface rationale; package-local substitutes do not replace
  canonical-root checks.
- ADR invariant and acceptance-check IDs are durable identifiers added to the
  accepted ADRs. The traceability tables in Section 8 are a completeness gate.
- For compact trace rows, a tranche's first evidence reference anchors both its
  substantive `E01` and canonical-root `E02`; every row naming that tranche's
  work or tests requires the same `E02` by convention.
- Qualification evidence is not lifecycle authority. Only a later reviewed
  status decision may call a candidate current, released, or production-ready.

## 5. Qualification tranches

These tranches choose no mechanism in advance. Each compares the smallest viable
candidates by correctness, security, operability, migration risk, and failure
behavior, then records `QUALIFIED`, `REJECTED`, or `UNKNOWN`. `UNKNOWN` cannot be
used by an implementation tranche.

### Q1 — exact identities, dependency boundaries, and licenses

**Entry:** this plan has been accepted and a later, separate, explicit Q1
tranche-entry decision accepts Q1's reviewed file/surface list and canonical-root
checks. Plan acceptance alone does not authorize Q1; no package or tool is
adopted.  
**Scope:** candidate source/artifact identities only; no product workspace.  
**Work:**

- **Q1-W01:** inventory candidate Effect, Vercel AI SDK core/provider adapter,
  SQLite binding, Rust crates/toolchain, Git, and test-tool identities with
  immutable primary source and license records.
- **Q1-W02:** qualify the candidate Effect composition/runtime APIs needed for
  one application root; reject any version mismatch or duplicate runtime that
  makes authority ambiguous.
- **Q1-W03:** statically and dynamically challenge the exact AI SDK adapter for
  hidden retries, automatic steps/tool execution, eager network start, error
  suppression, abort behavior, and per-physical-call observability.
- **Q1-W04:** define source-to-artifact provenance, feature/build records,
  license/notice handling, change invalidation, and no-auto-update controls.

**Tests/evidence:** **Q1-T01** identity/license completeness; **Q1-T02** changed
pin, feature, digest, or artifact invalidates qualification; **Q1-T03** controlled
transport proves one explicit gateway send creates one physical request with SDK
loops/retries disabled or rejects the adapter; **Q1-T04** no auto-update and no
unclear-license copied material. Retain **Q1-E01**, the reviewed candidate matrix
and exact qualification records; and **Q1-E02**, Q1's canonical-root repository
verification record under Section 4.3.

**Exit:** at least Effect and build/test candidates are qualified for I1; AI SDK
may remain rejected without blocking I1, but blocks I7.  
**Rollback/stop:** discard disposable probes. Stop on unresolved license,
mutable-only identity, unobservable send, inseparable automatic loop/retry, or
ABI/runtime conflict.

### Q2 — SQLite, artifact filesystem, and hard-reset durability

**Entry:** Q1 accepted for the probe toolchain; candidate profiles are explicitly
non-production.  
**Scope:** disposable storage only; no acknowledged product command.  
**Work:**

- **Q2-W01:** enumerate candidate tuples of OS, architecture, SQLite build and
  compile options, binding, VFS, local filesystem, device/cache policy, and every
  required connection setting. Network filesystems are negative controls.
- **Q2-W02:** build an isolated process-kill and power-cut or equivalent
  filesystem-fault harness derived from primary behavior for the exact tuple.
- **Q2-W03:** qualify stage/write/sync/close/reopen/readback/digest/no-replace
  install/directory-sync primitives on one artifact-store filesystem tuple.
- **Q2-W04:** qualify a consistent-cut SQLite-plus-artifact backup and restore
  procedure, including WAL state and corrupt/missing artifact negatives.

**Tests/evidence:** **Q2-T01** every-connection settings, identity, integrity,
write-probe, network-filesystem, and unknown-schema readiness; **Q2-T02**
process-kill and hard-reset recovery; **Q2-T03** event/control/outbox transaction
fault atomicity in the probe; **Q2-T04** crash at every artifact boundary;
**Q2-T05** consistent-cut backup/restore; **Q2-T06** profile/setting mutation
invalidates readiness. Retain **Q2-E01**, exact profile records and fault outputs;
and **Q2-E02**, Q2's canonical-root repository verification record under Section
4.3.

**Exit:** one exact local durability profile is accepted, or durability remains
unavailable and the plan stops before I2.  
**Rollback/stop:** destroy disposable state. Stop if the fault method is not a
credible test of the claimed boundary, any acknowledged probe transaction is
lost/torn/duplicated, required sync cannot be verified, or immutable publication
cannot be established.

### Q3 — Rust IPC, process trees, paths, Git, tools, and platforms

**Entry:** Q1 accepted for candidate Rust/Git identities.  
**Scope:** disposable roots and synthetic executables only; no real repository or
user tool mutation.  
**Work:**

- **Q3-W01:** qualify private parent-child IPC framing/handshake, exact launch
  primitives, inherited descriptor/handle closure, deadlines, output bounds,
  process-tree observation, termination, and authority-loss behavior.
- **Q3-W02:** compare exact selected-platform root-handle, no-follow,
  stable-identity, use-time containment, and Git working-directory sequences.
  Do not select a sequence from documentation alone.
- **Q3-W03:** probe synthetic reviewed tools for environment, credentials,
  caller working directory, handles/descriptors, same-user filesystem, network,
  and child-process channels; record residual ambient authority.
- **Q3-W04:** create the capability allowlist keyed by exact platform and build.
  Windows and unlisted profiles are denied. No sandbox profile is created by
  implication; untrusted/strong-isolation requests remain unavailable.

**Tests/evidence:** **Q3-T01** malformed/expired/stale/overbroad grant and protocol
negatives; **Q3-T02** launch hygiene plus honest residual-authority report;
**Q3-T03** supervisor/authority loss terminates or quarantines descendants;
**Q3-T04** ancestor rename/reparent and component-symlink races during create,
mutate, and delete; **Q3-T05** missing primitive, Windows, and unlisted-platform
denials with no fallback; **Q3-T06** untrusted or stronger-isolation requests deny
without an exact sandbox, and no dynamic in-process loader exists. Retain
**Q3-E01**, the selected-platform capability manifest and raw negative evidence;
and **Q3-E02**, Q3's canonical-root repository verification record under Section
4.3.

**Exit:** IPC/supervision may qualify independently for I1; process, path, and Git
capabilities remain individually false unless their complete tests pass.  
**Rollback/stop:** terminate fixtures and remove disposable roots. Stop on a
surviving descendant, outside-root effect, inherited forbidden channel,
unverifiable Git working directory, or required weaker fallback.

### Q4 — trusted-local authentication and transport mechanism

**Entry:** Q1 accepted; the application still exposes no mutation transport.  
**Scope:** one human, one host, credential lifecycle and transport threat model;
no remote or multi-user design.  
**Work:**

- **Q4-W01:** compare the smallest local credential/agent mechanisms using exact
  primary sources and probes. Assess secret-at-rest handling, replay, process
  inheritance, rotation/revocation, unattended use, recovery, diagnostics, and
  migration.
- **Q4-W02:** define authentication envelopes for CLI first and for loopback HTTP
  or private MCP only if later enabled. Locality or OS username alone is not an
  approval identity.
- **Q4-W03:** record one exact mechanism and operator bootstrap/recovery
  procedure, or `UNKNOWN`. No mechanism is selected by this plan text.

**Tests/evidence:** **Q4-T01** exactly one configured actor, wrong actor, replay,
expiry, rotation, and revocation; **Q4-T02** anonymous and non-loopback mutation
denial; **Q4-T03** missing/corrupt credentials fail closed without secret leakage.
Retain **Q4-E01**, the option comparison and accepted exact mechanism record; and
**Q4-E02**, Q4's canonical-root repository verification record under Section 4.3.

**Exit:** one exact trusted-local mechanism is accepted for I5, or all user
mutation transports remain disabled.  
**Rollback/stop:** revoke test credentials and remove fixtures. Stop on anonymous
success, identity derived only from transport location/OS username, unrecoverable
secret exposure, or a mechanism requiring remote/multi-user scope.

## 6. Ordered implementation tranches

### I1 — authority seam with every consequential capability disabled

This is the first implementation tranche and is intentionally narrow.

**Entry:** Q1's exact Effect/build identities and Q3's private IPC/supervision
subset are accepted; the I1 file list and exact pins receive separate approval.  
**Independently reviewable scope:** create only `apps/custom-harness/`, its narrow
Rust child, focused tests, and repository inventory/build metadata mechanically
required to recognize that new workspace. Add one Effect composition root and
one versioned Command Port; add a Rust handshake/probe/receipt process. Use only
synthetic in-memory state in tests. Do not add SQLite, provider adapters, Git
operations, external tools, user transports, gates, or a sandbox. Process, Git,
provider, filesystem mutation, and sandbox readiness are hard-coded unavailable
through typed capability results, not left unimplemented behind permissive
defaults. No CI or status/lifecycle promotion occurs.

**Work:** **I1-W01** Effect composition root, Command Port, and deny-by-default
application transition seam; **I1-W02** versioned Rust child protocol with Rust
limited to probes and receipts; **I1-W03** dependency/import guards and the
capability registry initialized false.  
**Tests/evidence:** **I1-T01** only Effect can invoke the transition/write port;
**I1-T02** synthetic transport and internal reaction share one Command Port;
**I1-T03** stale/unmatched Rust output is inert evidence; **I1-T04** missing or
lost supervisor cannot fall back to direct process/Git execution; **I1-T05** Rust
has no domain database/provider/command listener and no dynamic plugin path.
Retain **I1-E01**, module/dependency graphs and focused test output; and
**I1-E02**, I1's canonical-root repository verification record under Section 4.3.

**Exit:** the isolated workspace builds/tests; no consequential capability can
report ready; Rust cannot advance application state; diff contains no later
tranche surface.  
**Rollback/stop:** remove the isolated workspace and mechanical inventory entries.
Stop if an existing plugin/runtime becomes a command authority, any host effect
is reachable, or the exact qualified pins would have to change.

### I2 — durable command admission, event log, ledgers, and projections

**Entry:** I1 and Q2 accepted.  
**Scope:** local database admission only; no artifact references or external
dispatch.  
**Work:** **I2-W01** event envelopes, canonical log, authoritative coordination
ledgers, and transactional outbox under one Effect writer; **I2-W02**
authenticated command IDs, actor-scoped idempotency, digest conflict, and
commit-before-ack admission; **I2-W03** disposable projections, schema/version
gates, per-connection profile verification, and startup recovery.  
**Tests/evidence:** **I2-T01** event/control/outbox all-or-nothing crash matrix;
**I2-T02** kill-after-ack recovery retains and reschedules accepted work;
**I2-T03** duplicate fake transports converge on one command/execution and digest
conflicts reject; **I2-T04** projection deletion/replay; **I2-T05** changed sync,
network filesystem, failed write probe, corrupt database, and unknown schema deny
readiness. Retain **I2-E01**, schema, migration, transaction, crash, and profile
evidence; and **I2-E02**, I2's canonical-root repository verification record under
Section 4.3.

**Exit:** durable no-side-effect commands satisfy Q2's exact profile and replay;
acknowledgment is impossible before commit.  
**Rollback/stop:** quiesce and restore only with Q2's consistent-cut process.
Stop on split event/control/outbox state, memory-only ack, or profile mismatch.

### I3 — artifact custody and immutable attempt snapshots

**Entry:** I2 accepted; Q2 artifact and backup subsets accepted.  
**Scope:** canonical local artifacts and snapshots; still no external dispatch.  
**Work:** **I3-W01** staged, synchronized, readback-verified, immutable
digest-derived publication; **I3-W02** custody/event commit validation, startup
checks, and orphan reconciliation; **I3-W03** immutable attempt snapshots and
consistent-cut backup/restore integration.  
**Tests/evidence:** **I3-T01** crash at each publication/ack boundary; **I3-T02**
missing or corrupt referenced artifact blocks replay, recovery, dispatch, and
completion; **I3-T03** staged/installed orphans cannot manufacture events;
**I3-T04** matching database/artifact backup and restore. Retain **I3-E01**,
boundary fault matrix and custody digests; and **I3-E02**, I3's canonical-root
repository verification record under Section 4.3.

**Exit:** no committed event can expose missing/mismatched bytes and snapshots
are immutable authority ceilings.  
**Rollback/stop:** preserve referenced bytes, quarantine orphans after reference
checks, and restore consistently. Stop on cross-device publication or unverifiable
directory durability.

### I4 — attempts, fencing, finite retry, and verified cancellation

**Entry:** I3 accepted; Q3 supervision subset accepted.  
**Scope:** serialized session scheduling and a synthetic reviewed executable only;
no real tool/provider/Git effect.  
**Work:** **I4-W01** attempt identities, leases, heartbeats, fencing, serialized
session claims, completion CAS, and finite delivery-aware retry; **I4-W02**
durable recursive cancellation/timeout graph; **I4-W03** synthetic supervised
execution, descendant receipts, uncertainty, and reconciliation states.  
**Tests/evidence:** **I4-T01** lease expiry fences stale completion and creates a
new attempt; **I4-T02** kill-after-ack recovery; **I4-T03** recursive cancellation
terminates descendants and rejects late output; **I4-T04** uncertain
non-idempotent dispatch cannot auto-retry; **I4-T05** authority loss terminates
or quarantines before recovery; **I4-T06** retries are finite and never reuse an
attempt/provider-call identity. Retain **I4-E01**, deterministic scheduler/fault
traces and process observations; and **I4-E02**, I4's canonical-root repository
verification record under Section 4.3.

**Exit:** no promise-only timeout, stale completion, infinite retry, or inferred
cancellation exists.  
**Rollback/stop:** disable dispatch, fence active attempts, terminate/quarantine,
and reconcile. Stop on any surviving descendant or duplicate uncertain effect.

### I5 — one-human authentication, thin transports, and readiness

**Entry:** I4 and Q4 accepted; Q2/Q3 capability records are current.  
**Scope:** implement the exact accepted credential mechanism and CLI first.
Loopback HTTP/private MCP are separate additions within I5 and remain disabled
unless each has an accepted sub-entry review.  
**Work:** **I5-W01** authenticated actor envelope, operator bootstrap, rotation,
revocation, and recovery; **I5-W02** thin adapters to the same Command Port with
loopback/private binding rules; **I5-W03** active capability readiness with
stable reasons and no readiness-by-configuration.  
**Tests/evidence:** **I5-T01** every enabled adapter resolves the same actor and
Command Port behavior; **I5-T02** anonymous/non-loopback mutation denial;
**I5-T03** failed auth/SQLite/Rust/Git/path/sandbox probes deny dependent
admission; **I5-T04** profile/primitive mutation makes readiness false;
**I5-T05** Windows and unselected platforms cannot report supported readiness;
**I5-T06** liveness cannot authorize work. Retain **I5-E01**, transport parity,
credential lifecycle, and readiness matrices; and **I5-E02**, I5's canonical-root
repository verification record under Section 4.3.

**Exit:** one authenticated human can submit durable commands; disabled surfaces
are unreachable and explicit.  
**Rollback/stop:** revoke credentials and disable adapters while preserving
events. Stop on anonymous success, alternate write path, remote bind, or unstable
diagnostic.

### I6 — capabilities, provenance, sink gates, proposals, and approvals

**Entry:** I5 accepted.  
**Scope:** synthetic sinks first; no provider, real tool, or Git mutation.  
**Work:** **I6-W01** typed recursive resource/action grants, intersections,
delegation ceilings, immutable attempt ceilings, and action-time revocation;
**I6-W02** trusted-ingress provenance, transitive taint, authenticated durable
declassification, and explicit non-authority handling for UI, projection,
telemetry, supervisor, model, and tool output; **I6-W03** durable proposal
revisions and one-human Gate Service CAS bound to exact action, target, payload,
revision, and actor; **I6-W04** exact Effect-issued action grants and Rust
validation.  
**Tests/evidence:** **I6-T01** nested targets/aliases reach the same sink denial;
**I6-T02** child ceiling and revocation/relaxation behavior; **I6-T03** relabeling
or model restatement cannot clear taint; **I6-T04** payload/target/fence/grant
substitution rejected by Rust; **I6-T05** Gate Service negatives deny model/tool
approval claims, payload-digest substitution, stale or mutated revision, wrong
actor, replay, and expiry; **I6-T06** unresolved binding gate blocks completion;
**I6-T07** UI, projection, telemetry, supervisor, model, and tool outputs each
attempt to grant authority and complete work but remain inert evidence or proposal
data; **I6-T08** Gate Service action-substitution negatives prove an approval
cannot resolve or dispatch a different action or action scope; **I6-T09** Gate
Service target-substitution negatives prove an approval cannot resolve or
dispatch a different target. Retain **I6-E01**, recursive schema corpus,
non-authority-source traces, and gate event evidence; and **I6-E02**, I6's
canonical-root repository verification record under Section 4.3.

**Exit:** every synthetic consequential path has exactly one action-time gate;
absence is denial and proposal data cannot execute itself.  
**Rollback/stop:** disable affected sink classes and preserve gate/proposal events.
Stop on authority widening, taint clearing by transformation, or gate transfer.

### I7 — Provider Gateway and physical-call accounting

**Entry:** I6, I3, and Q1's exact SDK/adapter subset accepted. A controlled
endpoint is used before any real provider; a real provider requires its own
exact adapter/credential sub-entry.  
**Scope:** Provider Gateway only; no provider selection or hard-money policy.  
**Work:** **I7-W01** sole Effect Provider Gateway, narrow SDK adapters, and
source/import/dependency enforcement excluding direct provider clients elsewhere;
**I7-W02** durable pre-dispatch call allocation, one-send arming, terminal facts,
and `DISPATCH_UNKNOWN` recovery; **I7-W03** raw/reported/estimated/reconciled usage
with explicit `UNKNOWN` and no hard currency pass; **I7-W04** credential and
network observation including reviewed-tool fixtures.  
**Tests/evidence:** **I7-T01** normal/warmup/retry/compaction/child/failed/cancelled/
unknown purpose coverage; **I7-T02** every observed request has a prior durable
call record; **I7-T03** reviewed-tool direct provider behavior disqualifies the
tool and stronger egress policy denies without confinement; **I7-T04** crash and
hard-reset matrix around allocation/socket send/response/result commit preserves
identity and unknown usage; **I7-T05** a missing or mismatched digest-bound
request artifact blocks both allocation acknowledgment and physical dispatch;
**I7-T06** hidden SDK retry/tool loop rejects the adapter; **I7-T07** absent or
contradictory usage is `UNKNOWN`; **I7-T08** decoded tool calls remain proposals
and provider success cannot complete an attempt; **I7-T09** source, import,
dependency, and controlled-network checks find no direct provider client outside
the Provider Gateway and its narrow adapters; **I7-T10** concurrent duplicate,
stale, and crash-restart dispatch attempts against one `ProviderCallId` produce at
most one physical send, and a consumed or unknown identity cannot be re-armed;
**I7-T11** packet/controlled-endpoint-to-ledger correlation proves each physical
send has exactly one unique prior durable `ProviderCallId` and exactly one durable
call record, rejecting missing or multiple mappings. Retain **I7-E01**, the
provider-exclusivity scan, call ledger, packet/controlled-endpoint one-to-one
correlation, fault traces, and adapter qualification; and **I7-E02**, I7's
canonical-root repository verification record under Section 4.3.

**Exit:** all observed physical requests in the qualified cooperative TCB map to
durable unique identities; no hard-currency guarantee is exposed.  
**Rollback/stop:** revoke provider credentials, disable gateway capability, mark
armed calls unknown, and reconcile. Stop on any unrecorded request, hidden send,
or zero-valued missing usage.

### I8 — real Git worktree lifecycle

**Entry:** I6, I4, and Q3's exact path/Git/platform subset accepted.  
**Scope:** disposable registered repositories under one configured retained root;
no push/merge by default.  
**Work:** **I8-W01** lifecycle events, registered repository identity, expected
HEAD, destination allocation, and receipts; **I8-W02** Rust root-anchored create,
verify, mutate, and cleanup using only Q3-qualified sequences; **I8-W03** actual
Git-state reconciliation and separate grants/gates for destructive sinks.  
**Tests/evidence:** **I8-T01** fake directory/wrong repo/wrong HEAD/traversal/
symlink negatives; **I8-T02** concurrent ancestor/component swaps for create,
mutation, and cleanup; **I8-T03** missing primitive denies the dependent action;
**I8-T04** crash at every lifecycle transition reconciles without duplicate
mutation; **I8-T05** push/merge/delete cannot reuse create grants; **I8-T06**
cleanup rejects outside-root or identity-changed targets. Retain **I8-E01**,
Git porcelain/object evidence, filesystem identities, and race/fault output; and
**I8-E02**, I8's canonical-root repository verification record under Section 4.3.

**Exit:** only matching actual Git registration, root identity, and HEAD may
produce `Ready`; uncertainty becomes reconciliation.  
**Rollback/stop:** fence lifecycle, inspect actual Git/filesystem state, and never
blindly delete. Stop on outside-root reach, mutable-path re-resolution, or a Git
backend that cannot retain qualified containment.

### I9 — first reviewed external tool

**Entry:** I6, I4, Q1, and Q3 accepted for one exact tool candidate; I7 evidence
is available for provider-network observation.  
**Scope:** one reviewed cooperative-TCB tool and one manifest only; no untrusted
extension or dynamic loader.  
**Work:** **I9-W01** exact source/artifact/license/provenance and ambient-channel
record; **I9-W02** versioned schemas, executable identity, absolute invocation,
neutral/anchored working directory, empty-by-default environment, exact handles,
and grants; **I9-W03** direct network/provider and residual-authority observation.  
**Tests/evidence:** **I9-T01** adversarial environment/credential/descriptor/
working-directory/filesystem/network/child probes; **I9-T02** stronger-isolation
request denies without exact OS confinement; **I9-T03** direct provider behavior
disqualifies the tool; **I9-T04** changed tool/digest/schema/profile invalidates
qualification; **I9-T05** only reviewed configured tools are discoverable and no
dynamic in-process/untrusted path exists. Retain **I9-E01**, exact tool record,
manifest, channel matrix, and supervisor receipts; and **I9-E02**, I9's
canonical-root repository verification record under Section 4.3.

**Exit:** one exact reviewed tool may be enabled only for its declared actions;
residual same-user authority is explicit.  
**Rollback/stop:** remove the tool from the allowlist and deny its actions. Stop
on undeclared behavior, hidden provider client, unclear license, or sandbox claim.

### I10 — integrated recovery and Phase 1 qualification closure

**Entry:** I1-I9 accepted; all exact identities still match.  
**Scope:** integration and closure only; no new capability, provider, tool,
platform, transport, publication, or deployment.  
**Work:** **I10-W01** end-to-end recovery/reconciliation matrix across commands,
artifacts, attempts, gates, provider calls, descendants, and worktrees;
**I10-W02** source/import/static checks for sole authority, sink coverage,
forbidden clients/loaders/fallbacks, and all no-go claims; **I10-W03** exact
qualification/provenance manifest, change invalidation, update disablement, and
operator recovery runbook; **I10-W04** close the traceability ledger and preserve
the lifecycle-authority boundary without changing any ADR check merely by
assertion.  
**Tests/evidence:** **I10-T01** every state-changing and consequential path enters
one Command Port and one action-time sink gate; **I10-T02** integrated crash/
hard-reset recovery preserves acknowledgments and explicit ambiguity;
**I10-T03** network observation finds complete provider accounting across enabled
surfaces; **I10-T04** exact profile/artifact mutation disables dependent
readiness; **I10-T05** license/provenance/no-auto-update closure; **I10-T06** text,
API, and readiness scans confirm no untrusted, Windows, remote/multi-user,
hard-money, release, or production claim; **I10-T07** generated reports,
manifests, qualification records, and supervisor/provider receipts cannot change
candidate, current, released, production, or security-accepted lifecycle status
without a separate reviewed status decision. Retain **I10-E01**, the complete
qualification index, lifecycle-authority audit, and review verdict; and
**I10-E02**, I10's canonical-root repository verification record under Section
4.3.

**Exit:** every traceability row has retained passing evidence on an exact
selected profile and all package checks except lifecycle/release non-goals are
satisfied. The result is only a qualified local candidate.  
**Rollback/stop:** disable all consequential readiness, preserve evidence and
state, and return to the last accepted tranche. External ambiguity requires
reconciliation, not rollback fiction. Stop on any missing row or changed identity.

## 7. Cross-tranche stop and rollback conditions

Stop the active tranche immediately when any of these occurs:

- Effect is not the sole application/domain writer or Rust acquires policy,
  identity, retry, database, provider, command-port, or completion authority;
- a missing supervisor, probe, credential, sync primitive, root/path primitive,
  Git fact, or required sandbox selects an unsupervised or weaker path;
- an acknowledged transaction/gate is lost, torn, duplicated, or exposed before
  required artifact durability;
- a provider request lacks a prior durable `ProviderCallId`, hidden retries cannot
  be disabled, or unknown usage is represented as zero;
- cancellation leaves an unquarantined descendant, a stale result advances state,
  or uncertain non-idempotent delivery retries automatically;
- a filesystem/Git operation reaches outside the retained root or relies only on
  earlier string canonicalization;
- a model/tool/UI/receipt authenticates a human, resolves a gate, clears taint,
  grants authority, or completes work by assertion;
- an untrusted or unreviewed executable becomes reachable, or a grant is called a
  sandbox without exact confinement evidence; or
- exact identity/license evidence changes, Windows appears supported, a listener
  binds remotely, or multi-user/hard-money/production claims appear.

Rollback is capability-first: disable admission and readiness, revoke credentials,
fence attempts, terminate or quarantine descendants, preserve canonical evidence,
and reconcile external facts. Database downgrade, artifact deletion, worktree
cleanup, and tool/provider retry are separate reviewed actions. No automated
rollback may erase evidence or claim reversal of an already possible external
effect.

## 8. ADR traceability

Every accepted invariant and acceptance check maps to named work, tests, and
retained evidence below. Qualification tests remain prerequisites even when an
implementation test repeats the boundary against product code.

### ADR-001

| ID           | Work                   | Test/evidence                   |
| ------------ | ---------------------- | ------------------------------- |
| ADR-001-I01  | Q1-W02, I1-W01, I2-W01 | I1-T01, I10-T01, I1-E01, I1-E02 |
| ADR-001-I02  | I1-W01, I5-W02         | I1-T02, I5-T01                  |
| ADR-001-I03  | I1-W02                 | I1-T03, I6-T04                  |
| ADR-001-I04  | Q3-W03, I9-W01         | Q3-T02, I9-T01, Q3-E01, Q3-E02  |
| ADR-001-I05  | I4-W02, I4-W03         | Q3-T03, I4-T05                  |
| ADR-001-I06  | I7-W01                 | I7-T09                          |
| ADR-001-AC01 | I1-W01                 | I1-T01, I10-T01                 |
| ADR-001-AC02 | Q3-W01, I6-W04         | Q3-T01, I6-T04                  |
| ADR-001-AC03 | Q3-W03, I9-W02         | Q3-T02, I9-T01                  |
| ADR-001-AC04 | Q3-W04, I9-W03         | Q3-T06, I9-T02                  |
| ADR-001-AC05 | I1-W02, I5-W03         | I1-T04, I5-T03                  |
| ADR-001-AC06 | Q3-W01, I4-W03         | Q3-T03, I4-T05                  |

### ADR-002

| ID           | Work            | Test/evidence                  |
| ------------ | --------------- | ------------------------------ |
| ADR-002-I01  | I2-W02          | I2-T01, I2-T02, I2-E01, I2-E02 |
| ADR-002-I02  | I2-W01          | Q2-T03, I2-T01                 |
| ADR-002-I03  | I2-W03          | I2-T04                         |
| ADR-002-I04  | I3-W01, I3-W02  | Q2-T04, I3-T01                 |
| ADR-002-I05  | I4-W01, I7-W02  | I4-T04, I7-T04                 |
| ADR-002-AC01 | I2-W01          | Q2-T03, I2-T01                 |
| ADR-002-AC02 | Q2-W01, I2-W03  | Q2-T01, I2-T05, Q2-E01, Q2-E02 |
| ADR-002-AC03 | Q2-W02, I10-W01 | Q2-T02, I10-T02                |
| ADR-002-AC04 | I2-W03          | I2-T04                         |
| ADR-002-AC05 | Q2-W01, I2-W03  | Q2-T01, I2-T05                 |
| ADR-002-AC06 | Q2-W03, I3-W01  | Q2-T04, I3-T01                 |
| ADR-002-AC07 | I3-W02          | I3-T02, I3-E01, I3-E02         |
| ADR-002-AC08 | Q2-W04, I3-W03  | Q2-T05, I3-T04                 |

### ADR-003

| ID           | Work           | Test/evidence                  |
| ------------ | -------------- | ------------------------------ |
| ADR-003-I01  | I4-W01, I7-W02 | I4-T06, I7-T04                 |
| ADR-003-I02  | I4-W01, I4-W03 | I4-T01, I4-T03, I4-E01, I4-E02 |
| ADR-003-I03  | I2-W02         | I2-T02                         |
| ADR-003-I04  | I4-W01, I4-W02 | I4-T04, I4-T06                 |
| ADR-003-AC01 | I2-W02         | I2-T03                         |
| ADR-003-AC02 | I2-W03, I4-W01 | I2-T02, I4-T02                 |
| ADR-003-AC03 | I4-W01         | I4-T01                         |
| ADR-003-AC04 | I3-W03         | I3-T02                         |
| ADR-003-AC05 | I4-W02, I4-W03 | I4-T03                         |
| ADR-003-AC06 | I4-W01         | I4-T04                         |

### ADR-004

| ID           | Work            | Test/evidence                   |
| ------------ | --------------- | ------------------------------- |
| ADR-004-I01  | I7-W01, I10-W02 | I7-T09, I10-T01, I7-E01, I7-E02 |
| ADR-004-I02  | I7-W02          | I7-T02, I7-T10, I7-T11          |
| ADR-004-I03  | I7-W02          | I7-T02, I7-T04, I7-T11          |
| ADR-004-I04  | I6-W03, I7-W01  | I6-T05, I7-T08                  |
| ADR-004-I05  | I4-W01, I7-W01  | I7-T08                          |
| ADR-004-AC01 | I7-W02, I7-W03  | I7-T01                          |
| ADR-004-AC02 | I7-W02, I10-W01 | I7-T02, I7-T11, I10-T03         |
| ADR-004-AC03 | I7-W04, I9-W03  | I7-T03, I9-T03                  |
| ADR-004-AC04 | I7-W02, I10-W01 | I7-T04, I7-T10, I7-T11, I10-T02 |
| ADR-004-AC05 | I3-W01, I7-W02  | I7-T05                          |
| ADR-004-AC06 | Q1-W03, I7-W01  | Q1-T03, I7-T06                  |
| ADR-004-AC07 | I7-W03          | I7-T07                          |

### ADR-005

| ID           | Work           | Test/evidence          |
| ------------ | -------------- | ---------------------- |
| ADR-005-I01  | I6-W01         | I6-T01, I6-E01, I6-E02 |
| ADR-005-I02  | I6-W01         | I6-T02                 |
| ADR-005-I03  | I6-W02         | I6-T03                 |
| ADR-005-I04  | I6-W03         | I6-T05, I6-T09         |
| ADR-005-I05  | Q3-W03, I9-W01 | Q3-T02, I9-T01         |
| ADR-005-AC01 | I6-W01         | I6-T01                 |
| ADR-005-AC02 | I6-W01         | I6-T02                 |
| ADR-005-AC03 | I6-W02         | I6-T03                 |
| ADR-005-AC04 | I6-W04         | I6-T04                 |
| ADR-005-AC05 | Q3-W03, I9-W03 | Q3-T02, I9-T01, I9-T02 |

### ADR-006

| ID           | Work           | Test/evidence                  |
| ------------ | -------------- | ------------------------------ |
| ADR-006-I01  | Q3-W04, I9-W03 | Q3-T06, I9-T05                 |
| ADR-006-I02  | Q3-W03, I9-W02 | Q3-T02, I9-T01, I9-E01, I9-E02 |
| ADR-006-I03  | Q3-W04, I5-W03 | Q3-T05, I5-T05                 |
| ADR-006-I04  | I1-W03, I5-W03 | I1-T04, I5-T03                 |
| ADR-006-AC01 | I1-W03, I9-W03 | I1-T05, I9-T05                 |
| ADR-006-AC02 | Q3-W04, I9-W03 | Q3-T06, I9-T05                 |
| ADR-006-AC03 | Q3-W03, I9-W03 | Q3-T02, I9-T01                 |
| ADR-006-AC04 | Q3-W04, I9-W03 | Q3-T06, I9-T02                 |
| ADR-006-AC05 | Q3-W04, I5-W03 | Q3-T05, I5-T05                 |
| ADR-006-AC06 | Q3-W04, I5-W03 | Q3-T05, I5-T03                 |

### ADR-007

| ID           | Work           | Test/evidence          |
| ------------ | -------------- | ---------------------- |
| ADR-007-I01  | I8-W01, I8-W03 | I8-T01, I8-E01, I8-E02 |
| ADR-007-I02  | I8-W01, I8-W02 | I8-T01, I10-T01        |
| ADR-007-I03  | I8-W01, I8-W02 | I8-T05                 |
| ADR-007-I04  | Q3-W02, I8-W02 | Q3-T04, I8-T02         |
| ADR-007-I05  | I8-W03         | I8-T04                 |
| ADR-007-AC01 | I8-W01, I8-W02 | I8-T01                 |
| ADR-007-AC02 | Q3-W02, I8-W02 | Q3-T04, I8-T02         |
| ADR-007-AC03 | Q3-W02, I8-W02 | Q3-T05, I8-T03         |
| ADR-007-AC04 | I8-W03         | I8-T04                 |
| ADR-007-AC05 | I6-W01, I8-W03 | I8-T05                 |
| ADR-007-AC06 | I8-W02, I8-W03 | I8-T06                 |

### ADR-008

| ID           | Work           | Test/evidence          |
| ------------ | -------------- | ---------------------- |
| ADR-008-I01  | I5-W01, I6-W03 | I6-T05                 |
| ADR-008-I02  | I6-W03         | I6-T05, I6-T08, I6-T09 |
| ADR-008-I03  | I6-W01         | I6-T02                 |
| ADR-008-I04  | I2-W01, I6-W03 | I6-T05, I6-T06, I6-T07 |
| ADR-008-AC01 | I6-W03         | I6-T05, I6-T07         |
| ADR-008-AC02 | I6-W03         | I6-T05                 |
| ADR-008-AC03 | I5-W01, I6-W03 | I6-T05                 |
| ADR-008-AC04 | I6-W03, I4-W01 | I6-T06                 |

### ADR-009

| ID           | Work                   | Test/evidence                          |
| ------------ | ---------------------- | -------------------------------------- |
| ADR-009-I01  | I1-W01, I5-W02         | I1-T02, I5-T01                         |
| ADR-009-I02  | Q4-W01, Q4-W03, I5-W01 | Q4-T01, Q4-T03, I5-T02, Q4-E01, Q4-E02 |
| ADR-009-I03  | I5-W03                 | I5-T06                                 |
| ADR-009-I04  | I5-W03                 | I5-T03, I5-T04                         |
| ADR-009-AC01 | I5-W01, I5-W02         | I5-T01, I5-E01, I5-E02                 |
| ADR-009-AC02 | Q4-W02, I5-W02         | Q4-T02, I5-T02                         |
| ADR-009-AC03 | I5-W03                 | Q4-T03, I5-T03                         |
| ADR-009-AC04 | I5-W03                 | Q2-T06, Q3-T05, I5-T04                 |
| ADR-009-AC05 | Q3-W04, I5-W03         | Q3-T05, I5-T05                         |

### ADR-010

| ID           | Work                    | Test/evidence                  |
| ------------ | ----------------------- | ------------------------------ |
| ADR-010-I01  | Q1-W01, Q1-W04          | Q1-T01, Q1-T02, Q1-E01, Q1-E02 |
| ADR-010-I02  | Q1-W04, I10-W03         | Q1-T02, I10-T04                |
| ADR-010-I03  | Q1-W04, I9-W01          | Q1-T01, I9-T04                 |
| ADR-010-I04  | I10-W04                 | I10-T07                        |
| ADR-010-AC01 | Q1-W01, I9-W01, I10-W03 | Q1-T01, I10-T05                |
| ADR-010-AC02 | Q1-W04, I10-W03         | Q1-T02, I9-T04, I10-T04        |
| ADR-010-AC03 | Q1-W04, I10-W03         | Q1-T04, I10-T05                |
| ADR-010-AC04 | Q1-W04, I9-W01          | Q1-T04, I10-T05                |

### Package-wide invariants and checks

| ID       | Work                   | Test/evidence                           |
| -------- | ---------------------- | --------------------------------------- |
| PKG-I01  | I1-W01, I2-W01         | I1-T01, I10-T01                         |
| PKG-I02  | I1-W02, I9-W02         | I6-T04, I9-T01                          |
| PKG-I03  | I6-W02, I6-W03         | I6-T03, I6-T05, I6-T07                  |
| PKG-I04  | Q2-W02, I10-W01        | Q2-T02, I10-T02                         |
| PKG-I05  | I7-W02, I7-W03         | I7-T02, I7-T07, I7-T10, I7-T11, I10-T03 |
| PKG-I06  | I5-W03                 | I5-T03, I5-T04, I5-T05                  |
| PKG-I07  | I4-W01, I7-W02         | I4-T04, I7-T04                          |
| PKG-I08  | I3-W01, I3-W02         | I3-T01, I3-T02, I3-T03                  |
| PKG-AC01 | I10-W04                | PLAN-E01                                |
| PKG-AC02 | I10-W02                | I10-T06, I10-E01, I10-E02               |
| PKG-AC03 | I6-W01, I10-W02        | I10-T01                                 |
| PKG-AC04 | I10-W02                | I10-T06                                 |
| PKG-AC05 | Q3-W03, I9-W03         | Q3-T02, I9-T01                          |
| PKG-AC06 | Q3-W02, I8-W02         | Q3-T04, I8-T02                          |
| PKG-AC07 | Q2-W01, Q2-W02, I7-W02 | Q2-T01, Q2-T02, I7-T04, I10-T02         |
| PKG-AC08 | Q2-W03, I3-W01         | Q2-T04, I3-T01                          |
| PKG-AC09 | I10-W04                | PLAN-E02                                |

## 9. Explicit non-goals

- Implementing anything in this documentation change or treating this accepted
  plan as implementation authority.
- Reusing the plugin's Effect pin, runtime Rust code, SQLite build, local machine
  versions, OS APIs, authentication storage, AI SDK version, provider, tool, or
  sandbox merely because it already exists or is documented.
- Remote workers/listeners, multi-user or multi-tenant identity, high
  availability, network filesystems, distributed scheduling, or parallel
  sessions by default.
- Untrusted extensions, dynamic in-process plugins, marketplace installation, or
  claims that reviewed-tool launch hygiene is a sandbox.
- Windows support or broad cross-platform support. Qualification of one selected
  non-Windows profile does not qualify another.
- Provider selection, pricing accuracy, invoice reconciliation, hard currency
  enforcement, or exactly-once external effects.
- Push/merge policy, automatic publication, package publication, deployment,
  production use, auto-update, signing/notarization, or security acceptance.
- PostgreSQL, dual write, zero-downtime migration, generic backup claims, or
  durability beyond an exact accepted profile.
- Performance budgets or scalability claims. None are invented by this plan;
  any later target requires measured evidence and separate acceptance.

## 10. Unresolved assumptions and reopening rules

| Assumption/unknown                                                                                   | Required discriminator                        | If unresolved                                                       |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| An exact Effect version can host one composition root without conflicting runtimes                   | Q1 source/API and runtime probe               | Stop before I1                                                      |
| An exact AI SDK adapter can expose one physical send with retries/loops disabled                     | Q1 controlled-transport probe                 | Provider capability remains disabled; stop before I7                |
| At least one non-Windows SQLite/VFS/filesystem/device tuple can meet the hard-reset claim            | Q2 fault qualification                        | No acknowledged durable operation; stop before I2                   |
| Artifact no-replace publication and directory durability can be established on the same profile      | Q2 primitive and fault qualification          | Artifact-referencing events remain unavailable; stop before I3      |
| A selected platform can meet descendant and root-anchored use-time containment requirements          | Q3 process/path race qualification            | Affected process/Git capability remains disabled; stop before I4/I8 |
| One local authentication mechanism can bind the configured human without localhost/OS-username trust | Q4 threat model and negative probes           | User mutation and gates remain disabled; stop before I5             |
| A first reviewed tool has clear license/provenance and no direct provider behavior                   | Q1/Q3/I9 exact review and runtime observation | Tool remains ineligible; stop before I9 and qualification closure   |

A new or superseding ADR is required before changing sole Effect authority,
omitting or broadening Rust, enabling untrusted execution/sandbox claims, adding
Windows/remote/multi-user support, changing canonical persistence semantics, or
claiming hard-money enforcement/exactly-once external effects. Exact mechanism,
revision, and platform qualification records do not need a new ADR when they
stay inside the accepted boundaries, but each requires the tranche acceptance
specified here. A material trust-boundary change found during a spike stops work
and requires an ADR before implementation.

## 11. Plan acceptance and next authorized boundary

Accepting this plan does **not** authorize Q1, any later tranche, or any
implementation. After plan acceptance, Q1 may begin only under a separate,
explicit Q1 tranche-entry decision accepting its reviewed file/surface list and
canonical-root checks. Each later tranche likewise receives authority only after
all dependencies and its own entry decision are accepted. The next currently
authorized action is review of Q1 entry, not Q1 work. There is no code,
dependency, provider, tool, platform, or deployment authority yet.
