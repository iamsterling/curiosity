# ADR 0023: unified retrieval and validated memory evidence substrate

**Status:** Accepted 2026-08-18; not implementation authority

## Context

ADRs [0021](0021-owned-public-web-search.md) and
[0022](0022-installable-search-runtime.md) propose capture-anchored retrieval,
authoritative records, replaceable query projections, and a local-first runtime.
This ADR incorporates supplied cross-system research context, including a
reported 24-system comparison, plus the linked repository retrieval research.
The supplied comparison has no checked-in evidence artifact and is therefore an
input to this decision, not a repository-auditable study. Together these inputs
add a memory requirement: retrieved material must become durable evidence only
through an explicit, reviewable validation lifecycle. A URL, embedding neighbor,
cached answer, model statement, or duplicate hash is not validated memory.

The current plugin instead has a narrower, implemented Ledger authority and
deliberately disabled material publication where the host cannot prove fencing;
see the [current-state record](../../../opencode2-config/docs/architecture/current-state.md)
and [ADR 0012](../../../opencode2-config/docs/decisions/0012-ledger-native-product.md).
This decision must extend that doctrine rather than create a second lifecycle
authority or imply that the required publication guarantees exist today.

The recurring research lessons are that identity is layered, source custody and
query serving have different authority needs, authorization and deletion must
reach every projection, and stale or partial retrieval must remain visible. The
[cross-product synthesis](../research/cross-product-web-search-synthesis-2026-08-17.md)
and [owned-search dossier](../research/owned-public-web-search-architecture-2026-08-17.md)
provide the repository retrieval baseline. This ADR specifies a minimal
Curiosity-native substrate; it does not adopt OpenSpec or any other specification
framework.

## Decision

Curiosity will use one evidence substrate
for retrieval results and validated memory. Its canonical flow is:

```text
capture evidence → extract candidate → validate
  → ACTIVE | DISPUTED | PENDING | QUARANTINED | REJECTED
```

Capture makes an attributable observation durable; it does not make the content
true. Untrusted captured material may be extracted into a bounded candidate
assertion or relationship with exact evidence spans and extractor identity, then
validated. Validation applies a versioned policy and records the validator and
evidence used. Only `ACTIVE` records are ordinarily query-eligible. `DISPUTED`
records remain inspectable with their conflicting evidence but are excluded by
default. `PENDING`, `QUARANTINED`, and `REJECTED` assertions are excluded from
answer retrieval and serving-projection eligibility; an explicitly privileged
diagnostic workflow may separately authorize their inspection. No model,
retriever, projection, or cache may promote its own output.

### Authority and planes

The existing Ledger doctrine remains the sole lifecycle authority. A future
versioned Ledger schema owns source identities, ingest decisions, validation
transitions, relationship records, policy decisions, tombstones, and audit
history. The capture plane owns immutable acquired bytes and immutable derived
artifacts addressed by Ledger records. A capture object is not independently
query-authoritative, and a Ledger event that references absent or unverified
bytes is not committed evidence.

Lexical or vector indexes, chunk stores, snippets, answer caches, adjacency
indexes, and serving views are replaceable projections. They must be versioned,
rebuildable from committed authorized Ledger/capture records, and disposable
without losing custody, validation, or deletion truth. A graph projection is
deferred: Phase 1 records typed relationships but neither selects a graph engine
nor makes graph traversal a serving dependency.

### Identities that must not be collapsed

Every identifier is stable within a versioned namespace and has one meaning:

- **source object:** the logical external object, such as a page, file, message,
  repository artifact, or record; a mutable URL is only one locator;
- **revision:** a source-declared or system-observed revision of that object;
- **content:** exact acquired bytes or a separately identified normalized
  payload; equal content can occur in different sources and revisions;
- **occurrence:** content appearing in a source/revision at a place and valid or
  observed time;
- **capture:** one acquisition event, including method, policy, time, locator,
  and byte receipt; retries and recaptures remain distinct;
- **representation:** one media, parsing, extraction, or transformation output
  with producer and version; and
- **chunk/span:** a bounded address within one representation, including ordinal
  or offsets and a digest. A chunking change creates new chunk/span identities,
  not new source truth.

Hashes can support content identity and integrity but cannot substitute for
source, occurrence, capture, authorization, or assertion identity. Redirects,
canonical hints, duplicate detection, and same-entity judgments are explicit
relationships and never destructive identity merges.

### Relationship and assertion records

Phase 1 persists first-class typed relationship records for:

`supports`, `contradicts`, `supersedes`, `derived_from`, `duplicate_of`,
`same_entity_as`, temporal ordering (`precedes`), `decision_based_on`, and
`invalidated_by`.

Each record contains its own ID and revision, typed subject and object refs,
direction, evidence span refs, method/producer and version, asserted and observed
times, optional valid-time interval, validator/policy refs, and assertion state.
Symmetry or transitivity is not inferred unless a later versioned policy says so.
In particular, `duplicate_of` is not `same_entity_as`, temporal order is not
causation, `supports` is not truth, and `supersedes` does not erase history.
`decision_based_on` preserves why a decision was made; `invalidated_by` records
later disqualifying evidence without rewriting that historical basis.

### Orthogonal lifecycle dimensions

One overloaded status is prohibited. At minimum, records expose these separate
dimensions, whose exact enum spellings remain a schema decision:

| Dimension               | Minimum meaning                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Custody                 | provisional, durably captured, access-restricted/quarantined, or released from ordinary custody              |
| Derivation              | raw, derived with producer/version, stale, or failed; derivation never implies validation                    |
| Assertion               | `PENDING`, `ACTIVE`, `DISPUTED`, `QUARANTINED`, or `REJECTED`                                                |
| Query eligibility       | eligible, suppressed, or not projected, always with reason                                                   |
| Authorization freshness | current for a policy snapshot, stale, unknown, or revoked                                                    |
| Deletion                | live, tombstoned, erasure pending, primary-store erased, and retained-copy/backup expiry pending or verified |

A record may therefore be durably captured, correctly derived, disputed,
query-suppressed, authorization-current, and live at the same time. Logical
suppression, physical erasure, and backup expiry are separate claims with
separate evidence and clocks.

### Authorization, freshness, and query semantics

Authorization is evaluated before cache lookup, candidate generation, embedding
or query-feature generation, index access, or existence-revealing diagnostics.
The authorization decision binds principal/tenant scope, purpose, policy version,
requested corpus, and a freshness deadline. Cache and projection keys must bind
that decision or an equivalent non-forgeable scope; stale, unknown, or revoked
authorization fails closed.

A second last-mile authorization and tombstone check runs after hydration and
immediately before serialization. Revocation racing a query therefore removes
the item or fails the response; it cannot return data merely because candidate
generation began under an older decision. Query credentials cannot capture,
validate, change policy, restore, or erase evidence.

Every response identifies the Ledger cursor, projection snapshot, authorization
policy snapshot, and `as_of` time. It reports requested scope, known eligible
scope, excluded-reason counts, freshness watermarks, and whether coverage is
measured, estimated, or unknown. Empty means no eligible result in the disclosed
view, never exhaustive absence. Stage, partition, source, timeout, and stale-view
failures are bounded typed partial failures. A response is complete only for its
declared scope and snapshots; otherwise `partial=true`. Missing freshness or
coverage metadata is `unknown`, not zero or current.

### Capture commit and reconciliation

Capture and Ledger publication use a restartable protocol because separate
durable stores cannot be assumed atomic:

1. The caller supplies a deterministic idempotent `ingest_id`. After capture
   authorization, the substrate's first durable record is a Ledger `PREPARED`
   record binding that ID, expected source/capture metadata, payload digest,
   policy decision, and schema version.
2. Durably write and verify the immutable capture receipt and any authorized
   representation receipts.
3. Append `COMMITTED` with those receipts. Only `COMMITTED` records can feed
   extraction, validation, or projections.

Failure before `PREPARED` leaves no substrate record and is handled by caller
retry with the same deterministic `ingest_id`. Repeating that ID and canonical
request returns the same outcome; reusing it with different material fails with
a stable conflict diagnostic. From `PREPARED` onward, a crash leaves restartable
evidence, never an implicitly committed capture. Reconciliation starts at
`PREPARED`: it deterministically completes a verified preparation or leaves it
blocked with a reason; it does not invent missing bytes or silently discard an
ambiguous preparation.

Phase 0 and Phase 1 are synchronous-first. Startup and the explicit admin ingest,
reconcile, rebuild, and erase commands block until their bounded operation
finishes or returns a restart token and stable blocked reason. No daemon,
background queue, connector framework, or job system is required. In addition to
incremental checks, reconciliation performs a full deterministic traversal of
Ledger preparations/commits, capture receipts, projections, and tombstones. This
anti-entropy pass detects orphan captures, missing objects, dangling references,
stale projections, and deletion propagation gaps. Sampling alone cannot certify
consistency. Production-scale scheduling of full traversal is deferred.

Tombstone publication immediately makes an identity query-ineligible in the
authoritative view and all newly served results. Erasure then tracks primary
objects, derived representations, projections/caches, replicas, exports,
snapshots, and backups separately. Reconciliation blocks an erasure-complete
claim until every in-scope layer is verified or explicitly retained under a
versioned legal policy with expiry.

### Minimal serving envelope

Phase 1 returns no generated answer and no raw active document. The minimum
evidence envelope is:

- envelope/schema version, request ID, Ledger cursor, projection snapshot, and
  `as_of` time;
- source-object, revision (when known), content, occurrence, capture,
  representation, and chunk/span IDs;
- bounded inert text, span offsets/digest, media type, capture time, and source
  locator suitable for display;
- assertion ID/state and validation policy/decision refs;
- relevant relationship record refs;
- authorization snapshot, query-eligibility reason, tombstone/deletion state;
  and
- freshness, coverage, partial-failure, and untrusted-content warnings.

Unknown optional identities remain explicitly unknown. Internal object paths,
credentials, raw policy labels, hidden prompts, unrestricted content, and
portable absolute ranking scores are excluded.

## Phase 0–1 scope

**Phase 0 — semantics and fixtures:** approve the identity and state vocabularies,
minimal envelope, transition table, stable diagnostics, authorization threat
model, retention/erasure policy, and project-authored rights-cleared fixtures.
Resolve the Ledger schema/fencing and capture receipt contracts. No corpus
acquisition, connector, search vendor, graph engine, or deployment follows from
this phase.

**Phase 1 — minimal synchronous vertical slice:** support explicit local import
of one bounded fixture corpus; `PREPARED -> COMMITTED` capture; deterministic
candidate extraction; manual or deterministic-policy validation; typed
relationships; one transparent exact/lexical retrieval baseline; last-mile
authorization; tombstones; blocking restartable reconciliation; full-traversal
anti-entropy; and projection rebuild. It does not require crawling, rendering,
vectors, generated answers, graph projection, autonomous validation, background
work, server mode, or multi-tenancy.

## Required acceptance scenarios and evaluation baselines

Acceptance is binary and must include at least these project-owned tests:

1. Equal bytes across two occurrences preserve distinct source, occurrence, and
   capture IDs while sharing only the intended content identity; rechunking
   changes span IDs without changing capture identity.
2. A candidate cannot become `ACTIVE` without a committed capture, exact spans,
   validator authority, and current policy. Contradictory active evidence yields
   explicit `DISPUTED` state without deleting either side.
3. Every Phase 1 relationship type round-trips and retains direction/evidence;
   no graph database or inferred transitive edge is required.
4. An unauthorized query performs zero cache/projection/candidate reads and has
   an existence-independent diagnostic. Revocation between candidate selection
   and serialization returns no revoked evidence.
5. Failure before `PREPARED` is recovered by caller retry with the same
   deterministic `ingest_id`. Crashes after `PREPARED`, after capture write, and
   before or after `COMMITTED` converge under repeated reconciliation. Same-ID
   retries return the same outcome; conflicting retries are rejected.
6. Full traversal detects an orphan object, missing receipt, dangling relation,
   stale projection, and unpropagated tombstone. Repair is restartable and never
   upgrades absent evidence.
7. Tombstoning removes an item from new query responses immediately. Reports do
   not claim physical erasure while any primary, derived, snapshot, export, or
   backup state remains pending.
8. Projection deletion and rebuild from the same authorized Ledger/capture
   snapshot reproduce eligible IDs and stable diagnostics; ranking order may
   change only with an identified algorithm/snapshot version.
9. Partition timeout, stale authorization, unknown coverage, and mixed fresh/
   stale sources produce exact partial/freshness/coverage disclosures; no empty
   result is described as exhaustive.
10. Untrusted captured material can be chunked, extracted into candidates, and
    validated. `QUARANTINED` and `REJECTED` assertions cannot enter answer
    retrieval, serving projections, snippets, answer caches, or ordinary query
    output; only an explicitly privileged diagnostic workflow can authorize
    their inspection.

The fixed evaluation baseline is a versioned, rights-cleared fixture set with
exact-match, paraphrase, contradiction, supersession, duplicate/same-entity,
temporal, authorization, deletion, and stale-source cases. Report retrieval
Recall@k, MRR or nDCG where judgments support them, relationship/assertion
precision and recall, provenance-span exactness, authorization leakage,
tombstone leakage, reconciliation convergence, and freshness/coverage disclosure
accuracy. Required safety baselines are zero unauthorized or tombstoned returns,
zero citation spans not reproduced from the identified representation, and 100%
detection of seeded reconciliation faults. Public benchmark reports may inform
methods, but no dataset is used until its payload rights are approved.

## Own, adapt, reject, and defer

- **OWN:** identity and relationship semantics; validation transitions; Ledger/
  capture commit protocol; authorization, freshness, coverage, deletion, stable
  diagnostics, and the evidence envelope.
- **ADAPT:** public content-addressing, append-only journal, tombstone,
  transactional-outbox, lexical-evaluation, and anti-entropy patterns through
  independently authored contracts and tests; these patterns grant no authority.
- **REJECT:** OpenSpec assets; a second memory/search authority; URL, vector,
  provider result, cache entry, or model output as truth; authorization after
  candidate generation; silent partial results; destructive identity merging;
  and soft delete as an erasure claim.
- **DEFER:** search/storage vendors, graph engine and graph projection, connector
  framework, crawler/rendering, vector/ANN retrieval, learned ranking, generated
  answers, autonomous validation, background-job system, server/cluster modes,
  and multi-tenancy.

## Consequences

Retrieval and memory share provenance, authorization, validation, contradiction,
freshness, and deletion semantics without sharing mutable projection state.
Historical evidence and decisions remain explainable, while ordinary queries see
only current eligible material. The price is more identities, explicit unknowns,
cross-store reconciliation, and slower synchronous Phase 1 operations. Search
quality cannot hide custody or policy failures, and a cache or index outage can be
repaired without becoming an authority migration.

This decision does not alter accepted ADR 0020, accept ADR 0021 or 0022, modify
Ledger v1, authorize implementation, add a corpus, select a dependency, deploy a
service, or claim that the current host can safely publish these records.

## Unresolved blocking decisions

Implementation remains blocked until separate review resolves:

1. whether this requires Ledger v2 or a compatible Ledger v1 extension, including
   migration, event vocabulary, cross-process lock/CAS, and material fencing;
2. the exact identity canonicalization rules, relationship cardinalities,
   transition table, validator authority, dispute-resolution policy, and stable
   diagnostic codes;
3. principal/tenant/purpose policy, authorization snapshot format, revocation and
   freshness deadlines, and whether the local profile can prove last-mile state;
4. capture receipt/storage boundary, encryption and key custody, provisional and
   quarantine handling, retention, legal holds, erasure scope, and backup expiry;
5. the first rights-cleared corpus cell and fixture license, sensitive-data and
   illegal-content policy, and named security/privacy/legal operators;
6. bounded full-traversal size, restart-token semantics, repair authority, and
   acceptable startup/admin blocking time;
7. minimum freshness and coverage vocabulary/SLOs and partial-response policy;
   and
8. the Phase 1 transparent lexical baseline and quantitative release thresholds.
