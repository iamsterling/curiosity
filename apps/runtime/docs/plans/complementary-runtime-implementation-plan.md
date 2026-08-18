# Complementary runtime implementation plan

**Status:** Initial planning artifact, 2026-08-17. This document is not an
ADR, implementation authorization, dependency approval, corpus approval,
deployment approval, or production change record.

**M1 closure, 2026-08-17:** [ADR 0023](../decisions/0023-stateless-m1-runtime.md)
authorized the stateless slice and
[ADR 0024](../decisions/0024-m1-verification-and-go.md) records its bounded
verification and `GO`. Statements below that the repository is
documentation-only or that M1 language/contract are unresolved are historical
planning context. M1 closure grants no adapter, corpus, network, persistence,
publishing or deployment authority. On 2026-08-18 ADRs
[0025](../decisions/0025-m2-initial-local-test-snapshot.md),
[0026](../decisions/0026-m2-foundational-durable-state-boundary.md), and
[0027](../decisions/0027-m2-contract-abi-and-authority.md) accepted D4/D5 and
authorized bounded M2 only. They grant no M3–M7 authority.

## 1. Purpose and fixed framing

This plan sequences the decisions and work that would be needed to build a
bounded domain runtime beside an existing agent harness. The runtime
**complements the existing harness; it does not replace, embed, drive, or
orchestrate it**. The harness continues to own agents, models, turns, prompts,
approvals, tools, user interaction, and agent/workflow scheduling. The runtime
owns only separately authorized domain capabilities and their state.

Retrieval is the first capability because it has the accepted compatibility
contract and the deepest local research. **Retrieval is not the product
identity.** Any later non-retrieval capability must receive its own product
frame and authority and must fit the same domain-runtime boundary; this plan
does not invent that catalog.

The plan converts the current intent into binary gates. A `GO` permits only the
next named phase under separately recorded authority. A `STOP` prevents that
phase and all dependent phases. Completing this planning document grants no
`GO` by itself.

## 2. Current authorization status

| Item | Current authority | Consequence for this plan |
| --- | --- | --- |
| Provider-neutral bounded `web_search` contract, deprecated `formerhuman_search` alias, hard bounds, researcher-only intent, untrusted results, and stable redacted adapter failures | **Accepted for repository implementation; production deployment pending** in ADR 0020 | Compatibility authority that every retrieval-facing milestone must preserve. It does not authorize this runtime's packaging or deployment. |
| Owned public-web search plane, corpus custody, crawler, owned index/ranking, and capture pipeline | **Proposed only** in ADR 0021 | No implementation, crawl, corpus acquisition, dependency exception, or operations work may rely on it until accepted or replaced. |
| Installable local-first search runtime, native OpenCode-first adapter, and distribution profile | **Proposed only** in ADR 0022 | Useful input, not authority. Transport, first adapter, packaging, and deployment remain undecided here. |
| Broader complementary domain-runtime identity | Research inference only | Requires an accepted decision before it can become a product or implementation commitment. |
| Stateless M1 runtime | **Accepted for the ADR 0023 boundary; M1 `GO` recorded in ADR 0024** | M1 is closed at ADR 0024's source-manifest digest and limitations. It does not authorize a later milestone. |
| D4 initial local test snapshot | **Accepted for exact v1.0.0 fixture** in ADR 0025 | No other corpus, crawl, or production claim is authorized. |
| D5 foundational durable-state boundary | **Accepted for bounded dependency-free M2** in ADR 0026 | Events, dependencies, migrations, and production durability remain unauthorized. |
| D5A / M4 | **Accepted for one operation; GO** in ADRs 0034/0037 | No generic scheduler, daemon, or additional operation is authorized. |
| Repository-only D6 and D7 / M6 cell | **Accepted for exact local synthetic cell; repository GO** in ADRs 0035/0036/0038 | Public/production crawl remains NO-GO; ADR 0021 remains proposed for any broader plane. |
| This implementation plan | Planning artifact only | May be reviewed and revised; authorizes no code, manifests, packages, network calls, corpus work, or deployment. |

WP0/M1–M4 are closed under their recorded ADRs; M5 and the exact repository M6
cell have repository GO. Broader/public M6 and all M7 remain blocked.

## 3. Planning acceptance checks

This initial plan is acceptable only if all checks are true:

- [x] It states that it is planning, not implementation authority.
- [x] It preserves ADR 0020 as compatibility authority and labels ADRs 0021
  and 0022 as proposals.
- [x] It assigns harness lifecycle/orchestration to the harness and domain
  semantics/state to the runtime, with a stateless thin adapter between them.
- [x] It identifies retrieval as the first capability without defining the
  product as search-only.
- [x] M1 is stateless, corpus-free, and unable to make network calls.
- [x] No durable authoritative state begins until its lifecycle/event boundary,
  data classification, authentication/authorization, custody, and minimum
  observability/redaction controls are approved.
- [x] Transport, authentication model, first harness adapter, initial corpus,
  M2 dependencies, and deployment topology remain visibly unresolved until
  their decision gates pass; M1 language and tooling were resolved by ADR 0023.
- [x] Every milestone has observable acceptance checks plus a `GO`/`STOP` gate.
- [x] No milestone silently authorizes crawling, provider calls, durable
  content custody, dependency adoption, packaging, or deployment.

## 4. Contradictions and ambiguities to resolve

These are decision inputs, not invitations to choose an answer in code.

| Tension | Current evidence | Required resolution |
| --- | --- | --- |
| Search runtime versus broader domain runtime | Proposed ADR 0022 is search-specific; the companion-runtime dossier deliberately broadens the frame; ADR 0023 authorizes only one bounded retrieval-shaped M1 slice. | Broader product identity remains blocking before scope beyond M1, without weakening retrieval-specific compatibility. |
| Named first adapter versus unresolved first adapter | ADR 0022 proposes native OpenCode first; the boundary dossier finds MCP plausible for DeepSeek and permits a narrow native adapter only when needed. Both remain proposals/research. | Select the first harness and adapter only after a contract-fit spike or evidence review. **Blocking before adapter work, not before a transport-neutral M1 contract.** |
| Leading local HTTP topology versus unresolved transport/deployment | The dossier calls supervised local HTTP the leading topology but leaves transport and supervision questions open; ADR 0022 is proposed. | Separate canonical API semantics from wire transport, then decide transport and deployment independently. **Transport is blocking before a wire implementation; deployment is blocking before packaging/release.** |
| Accepted transition ABI versus no-network M1 | ADR 0020 describes a networked SearXNG transition adapter; M1 must prove boundaries without external effects. | M1 implements only contract behavior with deterministic local outcomes. It neither removes nor calls the transition adapter. Later compatibility tests decide integration. |
| Researcher-only harness permission versus runtime authorization | ADR 0020 places an effective permission expectation at the harness boundary; the runtime must also enforce its own domain authorization without treating a session id as identity. | Define principal/capability propagation and fail-closed responsibility on both sides. **Blocking before any callable transport.** |
| Former documentation-only repository versus implementation sequence | ADR 0023 and the repository constitution now place the bounded M1 implementation in `apps/runtime`; ADR 0024 closes M1. | **Resolved for M1 only.** Every later implementation still requires its own authority. |
| Proposed owned semantics versus commodity components | ADR 0021 proposes project-owned search semantics while permitting reviewed commodity infrastructure. No dependency set is approved. | Record semantic-core boundaries and a dependency/license decision before adding any dependency. **Blocking at the first dependency.** |

The companion-runtime dossier's former `apps/retrieval/...` references have been
corrected to current `apps/runtime/...` paths and line ranges. Its dated
documentation-only baseline is preserved and qualified by its later M1 status
note.

## 5. Architecture and ownership boundaries

### 5.1 Required layers

1. **Canonical runtime domain contract:** versioned, harness-neutral semantics,
   capability discovery, operation bounds, result/evidence envelopes, coverage
   and provenance fields, and stable redacted diagnostics. It must not use
   harness, MCP, provider, or transport vocabulary as its domain model.
2. **Runtime domain services:** independently authorize and execute approved
   operations. Retrieval owns query semantics, result bounds, ranking when
   authorized, provenance, coverage/staleness disclosure, and runtime records.
3. **Replaceable infrastructure adapters:** transport, provider, index, storage,
   and observability mechanisms behind explicit boundaries. None is selected by
   this plan.
4. **Thin harness adapter:** harness-owned translation from an approved tool or
   capability call to the canonical contract. It owns no provider work, domain
   state, agent loop, retry policy for mutations, or shadow session database.

### 5.2 Single-owner matrix

| Concern | Owner |
| --- | --- |
| Agents, models, prompts, turns/steps, approvals, transcript, user experience, tool visibility, agent/subagent/workflow scheduling | Existing harness |
| Runtime capability semantics, validation, domain authorization, quotas, evidence/provenance, approved durable jobs and domain state | Complementary runtime |
| Argument/result translation, deadline/cancellation propagation, capability registration teardown, trace correlation | Harness adapter |
| Model-visible record of a result | Harness session store |
| Runtime operation, corpus/version, policy, audit, and index facts | Runtime store, only in a milestone that separately authorizes persistence |
| Provider/corpus administration | Separate runtime admin surface, never a query credential or model-facing result |

No cross-process transaction is assumed. Request, trace, harness session, and
runtime operation identifiers remain distinct and are not authorization proof.

## 6. Dependency-ordered delivery plan

The rollout spine is WP0 → M1. From there, the governed local-state lane is D4
and D5 → M2 → D5A → M4, while the external-network lane is D1 and D6 plus M1
`GO` → M5. M6 is a convergence milestone and cannot begin until M2, M4, and M5
are each `GO` and D7 passes. M3 remains an adapter lane after M1 (and after M2
when real local results are exposed). M7 packages only the capabilities whose
own preceding gates have passed. Ordering in this document does not itself
authorize or require a lane. D8 precedes any lane's first external dependency;
it is not an additional prerequisite when a milestone adds no external
dependency or uses only dependencies already approved through D8.

### WP0 — authority and decision closure

**Closure:** `GO` for M1 only under ADR 0023. ADR 0024 verifies the resulting
slice. Transport, authentication, adapter, corpus, persistence, dependencies
outside the reviewed package, publishing, and deployment remain unresolved for
the milestones that require them.

**Objective:** make implementation legally and architecturally startable without
pretending the unresolved choices are already made.

Work:

1. Reconcile the broader complementary-runtime identity with proposed ADR 0022
   in an accepted or superseding ADR.
2. Record explicit implementation and repository/package ownership authority.
3. Decide, with separate rationale, the implementation language, canonical API
   transport, authentication/principal model, and initial dependency policy.
4. Define a transport-neutral v0 retrieval operation and result/error semantics
   that preserve ADR 0020 names, hard bounds, untrusted-data treatment, and
   stable redacted diagnostics. Do not select a corpus or provider in that
   contract.
5. Define measurable resource ceilings for M1 and the required no-network and
   no-persistence test controls.
6. Decide whether the first adapter is selected now or deferred until after M1;
   if selected, record the target harness and why its seam carries identity,
   bounds, cancellation, diagnostics, and result structure faithfully.

**Acceptance checks:**

- [x] ADR 0023 defines M1's bounded retrieval-shaped, non-orchestration boundary;
  broader product identity remains unresolved for later scope.
- [x] A reviewed authorization names `apps/runtime` as the M1 code location.
- [x] Language, v0 semantic contract, and test runner are recorded.
- [x] If M1 exposes a wire endpoint, transport and authentication are recorded;
  otherwise M1 is explicitly in-process and transport remains deferred.
- [x] Every proposed dependency has version, purpose, license, provenance,
  security review status, and removal path; or M1 is explicitly dependency-free.
- [x] ADR 0020 compatibility checks are enumerated and no text claims ADR 0021
  or ADR 0022 is accepted unless their status has actually changed.

**GO:** all checks pass and a separate implementation authorization names M1.

**STOP:** any authority is absent; any choice is only implied by a proposal; or
the design gives the runtime harness/session/orchestration ownership.

### M1 — stateless walking skeleton

**Depends on:** WP0 `GO`.

**Status:** `GO` on 2026-08-17 under
[ADR 0024](../decisions/0024-m1-verification-and-go.md), bound to its recorded
source-manifest digest and reopen conditions.

**Objective:** prove the domain boundary and stable behavior with the smallest
vertical slice. M1 is explicitly **no-network, no-corpus, stateless**.

The slice accepts one bounded retrieval-shaped request through the canonical
semantic boundary, validates it, and returns a deterministic bounded envelope.
With no corpus, it reports a stable explicit `corpus_absent` (or the exact code
approved in WP0), never an invented empty-search success. It performs no DNS,
socket, provider, telemetry, update, setup, or other network operation; reads or
writes no corpus, database, cache, log, credential, or runtime-state file; and
starts no durable/background job. Fixtures may exist only in tests and must not
be represented as a corpus.

**Acceptance checks:**

- [x] Valid bounded input returns the approved versioned no-corpus envelope.
- [x] Invalid, oversized, unsupported-version, and expired-deadline inputs fail
  with exact stable redacted diagnostics.
- [x] Returned external-content fields are absent; the response cannot grant
  action, fetch, credential, admin, or continuation authority.
- [x] The ADR-0023-approved effect-denial suite scans the complete runtime source
  and manifests, including dynamic import/require network-module probes, and
  exercises startup, capability discovery, request handling, and shutdown. It
  is not an OS socket sandbox; ADR 0024 records that limitation and reopen gate.
- [x] A clean temporary directory remains unchanged after the test, except for
  test-runner artifacts outside the runtime boundary explicitly allowlisted by
  the test.
- [x] Repeated identical reads are deterministic and remain within the approved
  byte, result-count, request, and concurrency bounds. M1 has no accepted or
  measured latency/RSS claim.
- [x] Unit, contract, type, lint, dependency-surface, and build checks pass using
  the documented package command. This run was in a dirty workspace, not a
  clean checkout; ADR 0024 binds the result to an explicit digest and limitation.

**GO:** all checks pass and the diff contains no adapter, corpus, provider,
persistence, packaging, deployment, or background-job implementation.

**STOP:** any network attempt, durable state, silent empty-result semantics,
unstable/raw diagnostic, ambient credential access, or harness lifecycle logic.

### M2 — authorized local read projection

**Depends on:** M1 `GO`; D4 approval of the exact initial corpus/snapshot,
rights, custody, and storage/index dependencies; and D5 approval of the
foundational durable-state lifecycle/event boundary, data classification,
authentication/authorization, custody, backup/deletion/restore, and minimum
observability/redaction controls; plus D8 before introducing the first external
dependency for storage/index, observability, or otherwise. D8 is not
additionally required if M2 adds no external dependency or uses only
dependencies already approved through D8. This milestone does not authorize
crawling.

**Status:** `GO` on 2026-08-18 under ADRs 0025–0028. The
exact repository fixture and dependency-free canonical-file mechanism satisfy
D4/D5 for M2 only; D8 is not required because no dependency was introduced.

**Objective:** query an explicitly imported, immutable, local test snapshot
through a read-only projection while keeping authoritative records distinct from
rebuildable indexes/caches.

**Acceptance checks:**

- [x] Import is an explicit admin act unavailable to query credentials.
- [x] Authoritative records and rebuildable projections follow the approved
  lifecycle, classification, access, custody, backup, deletion, and restore
  controls; no durable write occurs outside those controls.
- [x] Every fixture/document has approved rights, provenance, version, hash,
  custody, retention, and deletion metadata.
- [x] Results identify snapshot/corpus/analyzer versions and bounded passage
  evidence and disclose staleness, omissions, and coverage limits.
- [x] Empty valid results, absent snapshot, corrupt projection, and partial work
  have distinct stable outcomes.
- [x] Projection rebuild is deterministic from authoritative approved records;
  deletion/tombstones survive rebuild and restore tests.
- [x] Minimum audit and operational test evidence plus canonical commits prove import, read, denial,
  deletion, restore, and corruption outcomes while redacting document bodies,
  credentials, sensitive principal data, and raw failures.
- [x] Offline operation causes no provider, crawl, telemetry, or setup network
  calls.

**GO:** all checks pass and legal/privacy/security owners approve the exact test
snapshot and custody path.

**STOP:** rights are unknown; query and admin authority merge; an index becomes
the only provenance truth; or absence is presented as exhaustive coverage.

### M3 — first harness adapter and ADR 0020 compatibility

**Depends on:** M1 `GO` (M2 only if real local results are in scope); an accepted
first-adapter decision; approved transport and authentication; target-harness
characterization tests before edits.

**Objective:** expose only the approved bounded retrieval operation through one
thin adapter without changing harness lifecycle or runtime semantics.

**Acceptance checks:**

- [x] Pre-change characterization captures tool registration, effective
  permission composition, cancellation/deadline, result logging, teardown, and
  diagnostics in the target harness.
- [x] `web_search` remains provider-neutral and `formerhuman_search` remains a
  deprecated identical-execution alias unless a later accepted ADR removes it.
- [x] Effective researcher-only access fails closed at execute time after harness
  composition. Under the owner-approved pinned-host limitation, duplicate defense
  is a controlled plugin inventory plus exact definition/host attestation; no
  host-enforced global uniqueness is claimed.
- [x] Runtime revalidates identity, capabilities, bounds, version, and deadline;
  a session id or trace id is never accepted as authentication.
- [x] Adapter owns no domain state/provider work and does not open turns, invoke
  models, schedule agents, inject follow-ups, or reinterpret cancellation.
- [x] Transport unavailable, authorization rejected, incompatible schema,
  absent corpus, partial result, deadline, cancellation, and runtime failure
  remain distinguishable and redacted.
- [x] Adapter unload removes its capability surface and leaves no orphan work.

**GO (2026-08-18):** contract, security, characterization, exact-host, teardown,
network-denied, and workspace suites pass at ADR 0030's source digest. Review of
the query-only package and adapter boundary found no orchestration, mutation, or
admin-authority surface. This closes M3 only under ADRs 0029 and 0021.

**STOP:** the chosen seam cannot faithfully carry auth, bounds, cancellation,
structured outcomes, or stable diagnostics; or it requires runtime semantics to
be expressed in harness/MCP vocabulary.

### M4 — advanced durable jobs, events, and observability

**Depends on:** M2 `GO` and D5A approval of the exact advanced job/event
semantics and additional observability dependencies; plus D8 before introducing
the first external dependency for observability or otherwise. D8 is not
additionally required if M4 adds no external dependency or uses only
dependencies already approved through D8. M3 is required only when the advanced
operation is exposed through a harness adapter.

**Objective:** build only the later durable jobs, event delivery, and advanced
observability required by an approved operation, on M2's already governed state
foundation and without mirroring harness sessions. M4 is not the gate that
first authorizes authoritative state.

**Acceptance checks:**

- [x] New job records, event projections, caches, quarantine, and progress
  events preserve D5's approved classification and custody controls.
- [x] Mutation retries require approved idempotency semantics; cancellation and
  terminal settlement remain distinct.
- [x] Event ordering, delivery, retention, cursor, replay, and deduplication
  semantics are contract-tested.
- [x] Redacted audit correlation excludes prompts, reasoning,
  document bodies, credentials, provider payloads, and sensitive session data.
- [x] Crash recovery, quiescent shutdown, backup/restore, migration rollback,
  deletion, and corruption tests pass.

**GO (2026-08-18):** owner approval and evidence are recorded in ADRs 0034 and
0037 for exactly `build_owned_crawl_snapshot`.

**STOP:** harness and runtime co-own records, progress becomes authoritative,
or recovery requires fabricating harness events.

### M5 — provider or fetch integration

**Depends on:** M1 `GO`; D1 canonical semantic contract approval; and D6
approval of the exact provider/fetch capability, egress and SSRF policy,
credentials, terms/rights, dependency ledger, budgets, failure policy, and
operator ownership; plus D8 before introducing the first external dependency
for provider/fetch integration or otherwise. D8 is not additionally required if
M5 adds no external dependency or uses only dependencies already approved
through D8. ADR 0020 remains the compatibility floor.

**Objective:** add one replaceable, least-privilege external adapter without
granting arbitrary fetch or action authority.

**Acceptance checks:**

- [ ] Contract tests use deterministic fakes; default and setup test paths never
  contact production.
- [ ] Egress, redirects, DNS rebinding, private/link-local/metadata ranges,
  response size/media, timeout, concurrency, and cost are bounded and tested.
- [ ] Credentials are audience-bound, runtime-owned, redacted, revocable, and
  never passed through from model output or retrieved content.
- [ ] Provider output is normalized as untrusted evidence; raw failures and
  secrets cannot cross the diagnostic or telemetry boundary.
- [ ] Rollback disables the adapter and returns to the prior local/no-corpus
  behavior without ABI removal or data loss.

**GO:** security/legal/operations approval and all tests pass for the named
adapter only.

**STOP:** arbitrary model URLs become fetch authority, provider semantics leak
into the canonical API, or opt-in network tests cannot be isolated.

### M6 — owned corpus/crawl/search semantics (conditional)

**Depends on:** M2 `GO` and its D4/D5 durable-state and custody gates; M4 `GO`
and D5A for the crawl's durable jobs/events; M5 `GO` and D6 for its approved
fetch/egress path; and D7 acceptance or supersession of ADR 0021 plus every
legal/privacy/security/funding/operations gate it lists.

**Objective:** only if authorized, expand cell by cell from static fetch and
capture policy to extraction, immutable versions, lexical retrieval, ranking,
and measured later enhancements. “Global web” is never an initial claim.

**Acceptance checks:**

- [x] Initial language/region/vertical cell, corpus policy, jurisdictions,
  capacity, staffing, SLOs, retention, abuse controls, and complaint/takedown
  owners are explicit and approved.
- [x] Synthetic safeguard plumbing fails closed before durable capture;
  escalation, deletion, and audit are operational and exercised.
- [x] Capture/version/policy records are authoritative and citations are
  capture-anchored; transition evidence is visibly weaker.
- [x] Crawl etiquette, deletion propagation, backup/restore,
  relevance judgments, coverage limits, and rollback pass measured gates.
- [x] Lexical baseline precedes vectors or learned ranking; later complexity
  requires measured incremental gain and a new gate.

**GO (2026-08-18):** ADRs 0035, 0036, and 0038 accept only the exact repository
synthetic cell. Production/public crawling remains NO-GO.

**STOP:** ADR 0021 remains proposed; any safeguard or recurring owner is absent;
or expansion outruns measured quality, rights, capacity, deletion, or rollback.

### M7 — packaging, release, and deployment profile

**Depends on:** an accepted deployment ADR selecting a topology; approved
artifacts/dependencies; threat model; operations owner; completed rollback and
restore rehearsals. A local, remote, stdio, socket, or HTTP profile is not chosen
by this plan.

**Acceptance checks:**

- [ ] Signed/versioned artifacts and complete dependency/platform manifests are
  reproducible and verified.
- [ ] Process/port/socket owner, paths, least privilege, credential lifecycle,
  readiness, compatibility probes, resource limits, patching, and supervision
  are explicit.
- [ ] Upgrade preflight, schema/API/adapter compatibility, rollback,
  backup/restore, projection rebuild, and credential revocation are rehearsed.
- [ ] Install and uninstall never silently fetch, crawl, retain, migrate, or
  delete corpus, quarantine, backups, logs, credentials, or configuration.
- [ ] Production smoke tests are opt-in, authenticated, bounded, and separated
  from deterministic CI.

**GO:** release and deployment approvals identify the exact profile, immutable
before-state, artifact digests, owner, and rollback target.

**STOP:** deployment is inferred from local development, rollback is untested,
or any production mutation lacks separately reviewed authority.

## 7. Test strategy

Tests are evidence for gates, not substitutes for decisions.

1. **Characterize before changing existing behavior.** Before modifying an
   existing harness adapter or ADR 0020 implementation, add passing tests for
   current registration, aliases, permissions, diagnostics, cancellation, and
   result mapping. Then add the failing behavior test for the approved change.
2. **Contract-first fixtures.** Maintain implementation-independent request,
   result, error, compatibility, bounds, and redaction cases. Run the same cases
   against every in-process boundary, wire transport, and harness projection.
3. **Isolation and guardrail tests.** M1 verification runs in an isolated
   temporary directory and uses static runtime-source effect scanning plus
   manifest dependency checks; it is not an OS socket sandbox. Later
   deterministic tests keep production DNS, credentials, providers, telemetry,
   and deployment inaccessible.
4. **Security negatives.** Cover malformed/oversized input, confused deputy,
   token passthrough, session-id-as-auth, SSRF/DNS rebinding where network later
   exists, permission composition, admin/query separation, output injection,
   secret redaction, and resource exhaustion.
5. **Failure and lifecycle tests.** Distinguish rejection, outage, partial,
   stale, absent, corruption, timeout, cancellation, and late settlement. Test
   retry/idempotency, quiescent teardown, restart, and rollback only when those
   features exist.
6. **State tests.** For M2 onward, test migration, authoritative-record restore,
   projection rebuild, tombstone/deletion propagation, retention, custody, and
   corrupt/old snapshot handling.
7. **Quality gates.** For any corpus cell, use versioned judgments and disclose
   corpus/analyzer/index versions. Quality, freshness, diversity, and coverage
   gates are cell-specific; no score is compared across versions without an
   approved calibration method.
8. **Mechanical checks.** Each implementation phase documents and runs focused
   unit/contract/integration tests plus repository-required type, lint, format,
   dependency/license, and build checks. Reports include commands, exit codes,
   raw summaries, and changed paths.

## 8. Security and trust boundaries

Trust flows from untrusted caller arguments through harness policy, a thin
adapter, runtime authentication/authorization/validation, approved provider or
index adapters, untrusted external content, runtime normalization/redaction, and
back to a harness-recorded tool result. Every transition revalidates its own
contract.

Required invariants:

- Query/read and admin/mutation capabilities use separate least-privilege
  grants; model-facing calls never inherit admin authority.
- Harness session, request, trace, and runtime operation identifiers are
  correlation only, not identity or authorization.
- Retrieved text and provider output are untrusted data and cannot grant tools,
  credentials, policy changes, budget, arbitrary fetches, or continuation.
- No ambient secret, token passthrough, broad filesystem access, or shared
  authority is allowed. Transport-specific controls remain undecided until the
  transport decision.
- Errors, results, logs, traces, and events are bounded and redacted by default.
- Runtime failure is isolated from the harness loop; incompatibility and
  authorization fail closed.
- Corpus custody, quarantine, deletion, backup, and restore do not begin until
  exact rights, policy, paths, owners, and retention are approved.

## 9. Risks and rollback principles

| Risk | Control | Rollback/stop response |
| --- | --- | --- |
| Runtime grows into a second harness | Ownership tests/review and explicit anti-goals | Remove the offending adapter/service; return to prior harness behavior. |
| Proposal treated as authority | Gate checklist references actual ADR status | Stop before code/dependency/corpus/deployment work. |
| ABI or diagnostic drift | ADR 0020 characterization and cross-adapter contract tests | Disable new projection; retain `web_search` and alias behavior. |
| Transport or harness lock-in | Canonical harness-neutral semantic contract | Remove/replace the adapter without migrating domain semantics. |
| Untrusted content gains authority | Independent auth, strict result envelopes, injection tests | Quarantine/disable source; revoke credentials; preserve audit evidence. |
| Corpus rights/custody failure | Rights ledger, deletion and retention gates | Stop ingest, revoke access, tombstone/delete per policy, rebuild projections. |
| Provider outage/cost/terms change | Replaceable bounded adapter and explicit budgets | Disable provider and fall back to approved local/no-corpus behavior. |
| State corruption or incompatible upgrade | Authoritative records, backups, compatibility preflight | Quiesce, restore prior schema/artifact/snapshot, rebuild projections. |
| Operational burden exceeds ownership | Named capacity/on-call gates | Do not expand; stop the affected lane and retain only approved safe profile. |

Rollback is a release property at every stateful phase. A rollback must preserve
authoritative audit/deletion facts, avoid re-exposing revoked data or authority,
and never remove the ADR 0020 compatibility names without a separate accepted
decision.

## 10. Non-goals

- Replacing, embedding, or driving an agent harness.
- Agent/model loops, prompts, skills, approval UI, transcript replay, subagent
  delegation, workflow/DAG scheduling, or unsolicited model/context activity.
- Copying Cordis, DeepSeek session/events, MCP names, or provider schemas into
  the runtime domain model.
- Defining “everything is a plugin” or general extensibility as the product.
- Defining future non-retrieval capabilities without a separate frame.
- Selecting a language, transport, authentication scheme, first harness
  adapter, corpus, dependency set, or deployment topology in this plan.
- Crawling, corpus acquisition, provider cutover, packaging, deployment,
  multi-tenancy, clustering, or global-web claims without their gates.
- Fixing unrelated stale documentation references as part of implementation.

## 11. Decision and ADR gates

| Gate | Required decision | Blocks |
| --- | --- | --- |
| D0 | **Closed for bounded M1 only by ADRs 0023/0024:** accept product identity, complement-not-harness boundary, repository/code ownership, and implementation authority | Product identity and implementation beyond M1 |
| D1 | **Closed for bounded M1 only by ADRs 0023/0024:** approve canonical semantic contract, language, resource bounds, and test/tooling policy | Any later expansion or change to the M1 contract/effects boundary |
| D2 | Approve transport and authentication/principal/capability model | Any callable wire surface |
| D3 | Approve first target harness and adapter after fit evidence; reconcile ADR 0022's proposal | M3 |
| D4 | **Proposed in ADR 0025:** approve exact local corpus/snapshot, rights/custody, and storage/index dependencies | M2 |
| D5 | **Proposed in ADR 0026:** approve the foundational authoritative-state lifecycle and event boundary (including whether events exist yet), data classification, authentication/authorization, custody, retention/deletion/backup/restore, and minimum observability/redaction controls | M2 and any durable authoritative state |
| D5A | Approve exact advanced durable-job/event delivery semantics and additional observability dependencies | M4 |
| D6 | Approve exact provider/fetch adapter, egress, credentials, rights/terms, cost, and operations | M5 |
| D7 | Accept or supersede ADR 0021 and satisfy its corpus/crawl operations gates, after the applicable M2/D4/D5, M4/D5A, and M5/D6 prerequisites | M6 |
| D8 | Approve dependency versions/licenses/security and deployment topology, packaging, supervision, release, and rollback | First dependency and M7 as applicable |

Decisions may be split, but they may not be silently bundled into an
implementation diff. ADR 0020 remains authoritative throughout. ADRs 0021 and
0022 remain proposals unless their own status is changed by reviewed decisions.

## 12. Open questions

### Blocking

1. **Resolved for M1 only:** ADR 0023 places the non-orchestrating stateless M1
   slice in `apps/runtime`, with a dependency-free Rust core, Bun shim, v0
   contract, stable diagnostics, in-process boundary, and focused test runner.
   ADR 0024 records `GO`. Broader product identity remains undecided.
2. What principal, workspace/tenant scope, capability, credential, and
   revocation model crosses the chosen transport?
3. Which harness and adapter come first, and can that seam faithfully carry
   auth, bounds, cancellation, diagnostics, compatibility, and structured
   results without becoming the domain model?
4. Who owns the ADR-0025 decisions, and what exact AI-authored candidate with a
   presently missing license/rightsholder disposition, manifest, provenance,
   classification, custody, retention, withdrawal, and digest record, if any,
   is approved for M2?
5. Who owns the ADR-0026 decisions, and what foundational state lifecycle,
   authoritative/projection split, query/admin authorization, corruption and
   atomicity model, custody, tombstone/deletion, backup/restore, and audit policy
   must be approved before M2 writes authoritative state?
6. Files or SQLite: which persistence mechanism, schema/migration policy, and
   any dependency record pass D8?
7. Who can grant explicit M2 implementation authority after D4, D5, and any
   applicable D8 approvals, and what exact bounded M2 scope would it name?
8. Which deployment topology and supervisor, if any, are approved for M7?

### Nonblocking for M1, blocking when the named capability appears

1. Which future non-retrieval domain capabilities merit this runtime boundary?
2. Which operations become durable jobs, and what are their event delivery,
   cancellation, idempotency, replay, and retention semantics?
3. Which provider or owned-corpus path follows the local read skeleton?
4. Which language/region/vertical corpus cell could satisfy ADR 0021's gates?
5. When, if ever, are rendering, vectors, learned ranking, remote service,
   clustering, or multi-tenancy justified by measured need?
6. What additional clean-checkout, platform, OS effect-denial, latency, or RSS
   evidence would require reopening M1 rather than remaining a later release
   qualification?

## 13. Exact local source references

Paths and line ranges below refer to the repository state used to author this
plan:

- `apps/runtime/AGENTS.md:3-17` — M1 repository scope, provider-neutral and
  untrusted-result boundaries, prohibited state/deployment, package ownership,
  harness separation, and ADR practice.
- `apps/runtime/README.md:3-13` — independent retrieval scope, authorized M1,
  M1 `GO` limitation, and separation from the OpenCode plugin, Ledger, and Loop.
- `apps/runtime/README.md:29-42` — live research authority, ADR status, M1
  implementation boundary, and publication/deployment prohibition.
- `apps/runtime/docs/decisions/0020-provider-neutral-web-search.md:3-4` — accepted
  repository implementation status and pending production deployment.
- `apps/runtime/docs/decisions/0020-provider-neutral-web-search.md:14-35` —
  compatibility names, permission intent, bounded neutral contract, adapter
  isolation, diagnostics, and operational constraints.
- `apps/runtime/docs/decisions/0020-provider-neutral-web-search.md:37-43` — alias
  removal gate, deterministic tests, opt-in smoke test, and deployment mutation
  prohibition.
- `apps/runtime/docs/decisions/0021-owned-public-web-search.md:3-4` — proposed
  status and required independent approvals.
- `apps/runtime/docs/decisions/0021-owned-public-web-search.md:22-90` — proposed
  owned-search, no-action-authority, effective-permission, capture/projection,
  limitations, rights, reversibility, expansion, operations, safeguard, and
  curiosity gates.
- `apps/runtime/docs/decisions/0021-owned-public-web-search.md:92-104` — proposed
  consequences and explicit absence of implementation/corpus/deployment
  authority.
- `apps/runtime/docs/decisions/0022-installable-search-runtime.md:3-4` — proposed,
  non-authoritative status.
- `apps/runtime/docs/decisions/0022-installable-search-runtime.md:12-46` — proposed
  local-first shape, API/adapter/admin ownership, no-corpus/no-silent-network
  behavior, distribution requirements, and deferred topology.
- `apps/runtime/docs/decisions/0022-installable-search-runtime.md:48-60` — local
  profile trade-offs, adapter compatibility, and non-authorization statement.
- `apps/runtime/docs/decisions/0023-stateless-m1-runtime.md:3-53` — accepted M1
  authority, contract, effects boundary, test policy, and non-authorized scope.
- `apps/runtime/docs/decisions/0023-stateless-m1-runtime.md:55-71` — ABI caller
  obligation, admission-test boundary, and explicit later-scope exclusions.
- `apps/runtime/docs/decisions/0024-m1-verification-and-go.md:3-47` — M1-only
  accepted status, review context, dirty-workspace limitation, source-manifest
  digest, reproducible method, and exclusions.
- `apps/runtime/docs/decisions/0024-m1-verification-and-go.md:49-81` — acceptance
  evidence, no latency/RSS claim, reopen conditions, and non-authority for M2.
- `apps/runtime/docs/decisions/0025-m2-initial-local-test-snapshot.md:3-117` —
  proposed D4 snapshot metadata, candidate trade-offs, gates, STOP conditions,
  owner decisions, and corpus/M2 non-authorization.
- `apps/runtime/docs/decisions/0026-m2-foundational-durable-state-boundary.md:3-101`
  — proposed D5 records, lifecycle and authority split, state requirements,
  mechanism trade-offs, gates, owner decisions, and M2 non-authorization.
- `apps/runtime/package.json:6-17` — package verification command and the only
  declared development dependencies; there are no runtime dependencies.
- `apps/runtime/native/Cargo.toml:1-10` and
  `apps/runtime/native/src/lib.rs:1-248` — dependency-free Rust crate, stable
  statuses, bounded validation/admission, and panic-contained C ABI.
- `apps/runtime/src/index.ts:1-161` — Bun FFI shim, fixed diagnostics, validation,
  no-corpus envelope, close behavior, and static capability declaration.
- `apps/runtime/tests/boundaries.test.ts:7-80` — isolated-directory and complete
  source/manifest effect-denial checks, including dynamic network-module forms.
- `apps/runtime/tests/runtime.test.ts:26-135` — Bun contract, bounds,
  deterministic envelope, redaction, close, and capability evidence.
- `apps/runtime/docs/research/deepseek-harness-companion-runtime-boundary-2026-08-17.md:3-16`
  — research-only status, corrected companion boundary, retrieval-first identity,
  and canonical API/thin-adapter conclusion.
- `apps/runtime/docs/research/deepseek-harness-companion-runtime-boundary-2026-08-17.md:67-129`
  — verified harness ownership/lifecycle and integration seam limits.
- `apps/runtime/docs/research/deepseek-harness-companion-runtime-boundary-2026-08-17.md:131-168`
  — clean ownership matrix, broader runtime frame, and excluded concerns.
- `apps/runtime/docs/research/deepseek-harness-companion-runtime-boundary-2026-08-17.md:170-247`
  — contract layers, operation/event envelopes, MCP/native adapter limits, and
  compatibility negotiation.
- `apps/runtime/docs/research/deepseek-harness-companion-runtime-boundary-2026-08-17.md:248-334`
  — trust boundaries, authority, failure isolation, observability, state, and
  unresolved deployment profiles.
- `apps/runtime/docs/research/deepseek-harness-companion-runtime-boundary-2026-08-17.md:336-387`
  — anti-goals, research dispositions, and unresolved runtime questions.
