# Parallel FindAll: clean-room reverse-engineering dossier

**Research date:** 2026-08-17  
**Source access date:** 2026-08-17 for every source below  
**Scope:** Parallel FindAll V1 only. Entity Search, Search, Task, Monitor, and
Memory are discussed only where FindAll's published contract directly depends on
or contrasts with them.  
**Method:** clean-room analysis of public first-party documentation, OpenAPI
descriptions, product/benchmark pages, crawler disclosures, and legal terms. No
account, credential, API call, paid request, traffic interception, package or
service implementation inspection, access-control bypass, or benchmark was used.

## Decision frame

**Decision:** Which externally observable FindAll patterns should Curiosity
adopt, adapt, reject, or defer for bounded entity-set discovery without inheriting
an unverifiable claim of exhaustiveness, opaque stopping, or provider-specific
authority?

Bounded sub-questions:

1. What exactly is the query/job contract, and how does a candidate become a
   match?
2. What evidence supports “FindAll,” “web-scale,” “complete,” and recall claims?
3. What planning, coverage, stopping, deduplication, and entity-resolution
   behavior is observable—and what is not?
4. How are evidence, provenance, asynchronous state, bounds, errors, and price
   represented?
5. What safety, privacy, retention, contractual, and clean-room constraints apply?
6. What architecture can be inferred without claiming proprietary internals, and
   what are the exact implications for Curiosity?

Labels used below:

- **FACT** — directly supported by cited first-party material.
- **INFERENCE** — behavior-level interpretation, not a claim about private code.
- **RECOMMENDATION** — a Curiosity design conclusion.
- **UNKNOWN / NEGATIVE RESULT** — not established in the reviewed public sources.

## Executive verdict

FindAll is a **stateful asynchronous entity-discovery and per-candidate
verification pipeline**, not a normal web-search endpoint. A caller supplies an
objective, entity type, explicit boolean match conditions, a generator tier, and
a match limit. The service generates entity candidates from Parallel's index,
evaluates every condition, optionally runs Task-powered structured enrichments on
matches, and exposes snapshots, resumable events, webhooks, cancellation, and
extension. [S1-S8]

The name and marketing language must not be read as a completeness guarantee.
Parallel says FindAll can discover a “complete long tail,” “any set,” or “all”
entities, but its own reported Pro recall is **61.3%** on a vendor-created
40-query benchmark whose ground truth is the union of correct matches found by
the compared systems. The public runtime contract reports neither a recall
estimate nor a coverage denominator, search plan, query trace, unexplored region,
or completeness certificate. A run can stop because match rate is low, the
provider's candidates are exhausted, a timeout occurs, funds run out, or a match
limit is met. [S5][S9-S11]

The strongest transferable patterns are the separation of discovery,
verification, and enrichment; explicit condition-level outputs; candidate state;
durable snapshots plus resumable events; preview/extend/cancel controls; and
machine-readable termination reasons. Curiosity should strengthen all of them
with explicit work budgets, visible branch plans, measurable coverage, entity
merge lineage, quote-level immutable provenance, typed partial failures, and a
truthful `best_effort` completeness status.

**Overall confidence:** high for the public V1 request/result/lifecycle and price
contracts; medium for clean-room architecture inferences; low for candidate
generation, entity resolution, coverage, internal budgets, and stopping
algorithms. Production quality and fitness remain untested.

## 1. Product boundary and contract

### 1.1 FindAll versus ordinary search

**FACT (high).** FindAll is in public beta, with a stated 30-day notice before
breaking changes. It is the asynchronous, verification-oriented product.
Parallel's separate Entity Search returns people/companies synchronously in
seconds without FindAll's verification, enrichment, or citations. [S1][S12]

**RECOMMENDATION.** Curiosity must not expose FindAll as provider-neutral
`web_search`. Its primary artifact is a mutable entity-set job with generated,
matched, and unmatched candidates—not an ordered page-result list.

### 1.2 Ingest is a proposal, not the authoritative query

`POST /v1beta/findall/ingest` accepts only an `objective` and returns a suggested
`objective`, `entity_type`, `match_conditions`, optional enrichments, generator
(default `core`), and optional limit. Parallel calls this a starting point and
explicitly recommends human review/editing; its troubleshooting guide warns that
temporal language can be interpreted too strictly or unexpectedly. The caller
may skip ingest and construct the run schema directly. [S1][S13]

**INFERENCE (high).** Ingest is a natural-language-to-policy compiler. Treating
its output as executable without review silently transfers scope and boolean
decision semantics to a heuristic parser.

**RECOMMENDATION.** Curiosity should preserve the original request, generated
proposal, reviewer edits, and final approved criteria as separate immutable
artifacts. Generated criteria cannot expand caller authority.

### 1.3 Create contract

`POST /v1beta/findall/runs` requires: [S2]

| Field | Published meaning | Material bound/gap |
|---|---|---|
| `objective` | Natural-language overall goal | No public length bound in the reviewed schema |
| `entity_type` | Free-text entity class | Not limited to people/companies |
| `match_conditions[]` | Named, described boolean requirements | No public count/name/description length or uniqueness bound |
| `generator` | `preview`, `base`, `core`, or `pro` | Opaque quality/thoroughness preset |
| `match_limit` | Full runs: maximum matches; preview: candidates evaluated | 5–1,000 full; 5–10 preview |
| `exclude_list?` | `{name,url}` entities not to generate/evaluate | Maximum 10,000 |
| `metadata?` | String/number/boolean map | No documented idempotency semantics |
| `webhook?` | Delivery URL and event types | Documentation/OpenAPI discrepancy; see §7 |
| `memory_scope_key?` | Application memory partition | 1–128 characters, restricted alphabet |

The endpoint returns HTTP **200**, not 202, with a durable `findall_id` already in
`queued`. There is no documented client idempotency key. [S2]

**UNKNOWN / NEGATIVE RESULT.** Public V1 contracts expose no request-level source
policy, publication window, geographic/locale constraint, freshness requirement,
deadline, maximum generated candidates, maximum searches/fetches/tokens, minimum
recall, source-diversity rule, or hard dollar ceiling. Source Policy is documented
for Task and Search—not FindAll. [S2][S14]

### 1.4 Match semantics and candidate output

**FACT (high).** A candidate progresses through `generated`, `matched`,
`unmatched`, or `discarded`. A match requires **all** match conditions to be
satisfied. `output` is keyed by condition/enrichment name; a match-condition
entry carries `value`, `type: "match_condition"`, and `is_matched`, whereas an
enrichment lacks `is_matched`. Optional `basis` associates evidence with fields.
[S3][S4]

The result endpoint returns the current snapshot, including run state,
`candidates[]`, and an optional `last_event_id`. Active snapshots can contain
still-`generated` candidates. Candidate order/rank semantics are not documented.
[S1][S4]

**CONTRACT DISCREPANCY.** The current OpenAPI types `output` only as an arbitrary
object and its result example still shows condition values as plain strings,
while the candidate guide and quickstart show the newer nested
`{value,type,is_matched}` representation. Consumers must validate/feature-detect
beta responses rather than depend on examples. [S3][S4]

**RECOMMENDATION.** Use stable condition IDs separate from human names, define
three-valued outcomes (`satisfied`, `not_satisfied`, `unknown`) instead of forcing
absence of evidence into false, and version the approved condition schema.

### 1.5 Enrichment is downstream and non-filtering

`POST .../{findall_id}/enrich` adds a Task processor, restricted JSON output
schema, and optionally up to the Task-side MCP configuration. It runs once per
matched candidate, including existing and future matches; it can be called more
than once. Adding enrichment to a terminal run requeues it. FindAll supplies
candidate name, URL, and optional description to each Task. Enrichment never
changes match status. [S7][S15]

This filter-first/enrich-second separation avoids spending enrichment compute on
known nonmatches. However, adding an enrichment is a new asynchronous work order,
not a cosmetic schema edit.

## 2. “Find all” and exhaustive-discovery claims

### 2.1 What Parallel claims

First-party pages describe FindAll as:

- “web-scale” entity discovery that creates databases from the web; [S1]
- able to find “any set” or “virtually any type” of web-visible entity; [S9]
- a way to discover the “complete long tail”; [S10]
- optimized for precision relative to fast Entity Search; [S1]
- a system whose Pro tier achieved about 61% recall, roughly 3x selected
  alternatives, on Parallel's benchmark. [S9-S11]

These are product and benchmark claims, not contractual completeness guarantees.

### 2.2 What the benchmark actually establishes

**FACT (high).** Parallel says its FindAll benchmark contains 40 complex,
multi-criteria queries spanning public companies, startups, SMBs, specialized
entities, and people; testing occurred November 13–17, 2025. Reported recall is
30.3% Base, 52.5% Core, and 61.3% Pro. “Ground truth” was built from the **union
of correct matches across the competitor set**, and cost was average cost to find
1,000 correct matches. [S9-S11]

**ASSESSMENT (high).** This benchmark demonstrates relative performance on its
tested competitor-discovered universe, not recall against all entities in the
world. A union-of-systems ground truth can omit entities missed by every system;
it is endogenous to the compared systems. The reviewed pages do not publish the
40 prompts, complete labels, adjudication procedure, duplicate-resolution rules,
precision/false-positive results, confidence intervals, raw outputs, or a
reproducible harness. The numbers are self-reported and were not independently
reproduced here.

**NEGATIVE RESULT.** No reviewed source provides a contractual recall floor,
domain/language coverage table, index-size denominator, entity-universe
definition, or completeness probability for a particular run.

### 2.3 Runtime stopping disproves a literal reading

Terminal reasons are `match_limit_met`, `low_match_rate`,
`candidates_exhausted`, `error_occurred`, `timeout`, `user_cancelled`, and
`insufficient_funds`. Only `match_limit_met` completion can be extended. [S5]

- `match_limit_met` proves only that the requested count was reached.
- `low_match_rate` is an efficiency stop, not evidence that no more matches
  exist.
- `candidates_exhausted` means all **available candidates** were processed under
  the provider run; the contract does not equate that pool with the web.
- `timeout`, insufficient funds, cancellation, and errors are explicitly
  incomplete work.

**VERDICT — REJECT literal exhaustiveness (high confidence).** A truthful adapter
may report `provider_termination_reason`, but never translate it into “all
entities found.” Even Pro's published point estimate misses about 39% of the
benchmark union.

## 3. Planning, candidate generation, coverage, and stopping

### 3.1 Observable pipeline

Parallel explicitly describes three stages: generate candidates from its
proprietary web index, evaluate each candidate with multi-hop reasoning across web
sources, and run Task enrichments only for matches. Generator tiers increase
candidate-pool size/thoroughness from “moderate” through “largest”; exact sizes
are absent. [S1][S6][S10]

Preview evaluates the requested 5–10 candidates. Full generators continue until
the match limit or another terminal reason, meaning full-run `match_limit` bounds
matches—not generated/evaluated candidates. [S6][S16]

### 3.2 What is not observable

No current request, snapshot, or event discloses:

- a decomposition/branch plan or generated search queries;
- branch parentage, branch/source contribution, or follow-up rationale;
- candidate-pool size, candidate rank/score, or estimated remaining pool;
- coverage by subtopic, geography, language, source family, or entity segment;
- marginal novelty/recall gain, saturation threshold, or low-match-rate formula;
- search/fetch/page/token/tool-call counts or budgets;
- exact timeout duration, generator-specific latency SLO, or retry work;
- false-negative audit samples or reasons an undiscovered entity was missed.

**INFERENCE (medium-high).** Fixed generator tiers plus differentiated candidate
pools imply server-owned discovery budgets. The `low_match_rate` stop implies an
internal yield/efficiency monitor; `candidates_exhausted` implies a finite
provider-constructed pool. Public evidence does not establish the formulas,
branching strategy, or whether generation and evaluation overlap.

**RECOMMENDATION.** Curiosity should expose a plan with branch IDs, entity-segment
hypotheses, query/source strategy, and per-branch budget. It should stop on an
explicit reason such as `coverage_target_met`, `marginal_gain_below_threshold`,
`deadline`, `budget_exhausted`, or `policy_blocked`, and report unresolved gaps.

## 4. Deduplication and entity resolution

### 4.1 Published behavior

**FACT (high).** `discarded` means invalid, irrelevant, or duplicated. Parallel
says exclusions use “intelligence” to deduplicate/disambiguate aliases and name
or URL variations, though official disambiguated names and URLs work best.
Excluded entities do not appear in results/events. [S3]

For recurring discovery, callers must retrieve an old schema, persist old
candidates, create a new run with up to 10,000 `{name,url}` exclusions, and replay
saved enrichment requests. The refresh guide warns not to silently truncate an
over-limit exclusion set and says excluding only prior matches allows old
nonmatches to be reconsidered. [S17]

### 4.2 Material gaps

**UNKNOWN / NEGATIVE RESULT:**

- canonical URL normalization and redirect policy;
- whether resolution uses domains, registry IDs, addresses, people/employment
  identities, or learned entity embeddings;
- alias, subsidiary, parent, renamed-company, and person-name collision rules;
- merge/split thresholds and whether they vary by generator/entity type;
- whether `candidate_id` is stable across runs (the contract guarantees only a
  candidate ID, not global identity);
- canonical entity ID, alias list, merge lineage, or reason for discard;
- whether a discarded duplicate's evidence is transferred to the survivor;
- deduplication guarantees across concurrent candidates/events;
- false-merge and false-split benchmark results.

The SSE contract includes `findall.candidate.discarded`, but the guide says
current processing does not produce that event. Thus duplicate suppression may
occur before externally visible candidate state, and consumers cannot audit it.
[S3][S18]

**RECOMMENDATION.** Curiosity needs an owned entity-resolution layer with stable
entity IDs; normalized identifiers and aliases; `same_as`, `possible_same_as`,
parent/subsidiary and successor edges; merge/split provenance; confidence; and
reversible decisions. Provider name/URL intelligence should be a namespaced hint,
never the canonical identity authority.

## 5. Evidence and provenance

### 5.1 Basis contract

For each evaluated field, `FieldBasis` can carry the field name, citations,
generated reasoning, and nullable confidence. A citation requires a URL and may
include title and supporting excerpts. Product pages describe low/medium/high as
calibrated confidence and encourage targeted human review. [S4][S19][S20]

Strengths:

- evidence is condition/field-scoped rather than one undifferentiated source
  list;
- multiple sources and exact excerpts may be supplied;
- match decision and extracted value remain separate;
- matched and unmatched candidates can preserve evaluation reasoning.

### 5.2 Limits and contradictions

**FACT/CONTRADICTION (high).** Product and Basis guides say every result/all
processors include citations, excerpts, reasoning, and confidence. The FindAll
OpenAPI makes `basis` optional, confidence nullable, and excerpts nullable, and
says only certain processors provide the latter two. The candidate guide says
Basis is present “when available.” Clients must follow the nullable wire
contract. [S3][S4][S9][S19]

An official unmatched-event example has no citations but `confidence: "high"`.
This shows that provider confidence can describe an evaluation despite an empty
citation list; it is not a proof object. [S18]

The contract supplies no:

- content hash, immutable capture ID, retrieval/fetch time, or page version;
- publication date, index-observation time, cache/live status, or freshness SLA;
- quoted offsets, DOM locator, extractor version, or excerpt checksum;
- source author/publisher identity, source role/authority, or rights metadata;
- explicit `supports`, `contradicts`, or `mentions` stance per citation;
- evidence trail for initial candidate generation;
- complete candidate/source pool or evidence-completeness flag;
- calibration version or FindAll-specific reliability curve.

**INFERENCE (high).** Basis is useful claim-adjacent evidence, not full lineage.
Generated `reasoning` explains the provider's selection/reconciliation; it is not
a reproducible execution trace. Mutable URLs and excerpts cannot alone prove
what content was observed at decision time.

**RECOMMENDATION.** Curiosity should bind every condition decision and enrichment
claim to retained lawful source captures or exact passages with canonical URL,
observed time, content digest, acquisition mode, extractor version, source role,
branch lineage, and stance. Keep provider confidence namespaced and distinct from
source quality, evidence strength, entailment, and Curiosity verification.

## 6. Bounds, pricing, latency, and errors

### 6.1 Published price envelope

| Generator | Fixed/run | Per matched entity | Published positioning |
|---|---:|---:|---|
| `preview` | $0.10 | $0 | Evaluate 5–10 candidates |
| `base` | $0.25 | $0.03 | Broad/common queries |
| `core` | $2.00 | $0.15 | Specific/moderate-match queries |
| `pro` | $10.00 | $1.00 | Rare/high-specificity queries |

Price is fixed cost plus actual matches. Each enrichment adds the selected Task
processor's per-run price for every match on which it runs. Extend does not
repeat FindAll's fixed charge; it charges additional matches and their
enrichments. Work completed before cancellation remains billable. [S6-S8][S21]

**INFERENCE (high).** For a create request without later mutation, a caller can
compute a conservative FindAll-only ceiling from `fixed + per_match ×
match_limit`; enrichments add `sum(processor_price) × match_limit`. This is a
commercial arithmetic bound, not a server-enforced caller-provided spend field.
Concurrent enrichment, extend, retries/duplicate creates, and in-flight work
must be controlled separately.

**UNKNOWN.** The reviewed FindAll pages do not clearly state fixed/per-match
billing for failed/timeout/insufficient-funds runs, when a match becomes
billable, whether duplicate match events can bill twice, or when cancellation's
in-flight enrichments stop. Obtain written billing semantics.

### 6.2 Operational bounds and discrepancies

- Full `match_limit` is 5–1,000; preview is 5–10 candidates. Exclusions cap at
  10,000. [S2][S16]
- Default dedicated-doc quota is 300 create POSTs/hour; GET polling is excluded.
  The marketing pricing page instead says **25/hour**. [S22][S23]
- Central pricing summarizes FindAll latency as 10 seconds–2 hours, while the
  marketing page says 10 minutes–1 hour. Neither is a FindAll SLO. [S21][S23]
- Organization/app monthly spend limits are notify-only and do not block work.
  [S24]
- Create explicitly documents 402, 422, and 429. Shared errors include 401,
  404, 408, 500, 502, and 503 with retry guidance, but the generic warning page
  is Task-oriented rather than a complete FindAll error contract. [S2][S25]
- Status can terminate with `error_occurred`, `timeout`, or
  `insufficient_funds`, but exposes no typed cause, retryability, failed branch,
  partial-work ledger, or usage/cost object. [S5]

**RECOMMENDATION.** Curiosity must enforce local hard admission, deadline,
generated-candidate/fetch/token/concurrency/output-byte/spend limits. Preserve
attempt lineage and partial candidates; never automatically replay a create
after an ambiguous transport failure because no idempotency contract is exposed.

## 7. Asynchronous lifecycle and delivery

### 7.1 State machine and mutation

```text
create -> queued -> running -> completed | failed | cancelled
                     |          ^
                     +-> cancel-+
terminal + enrich -> queued/running again
match_limit_met + extend -> running again
```

The shared schema also contains `action_required` and `cancelling`, but current
FindAll cancellation moves directly to `cancelled`; `cancelling` is not emitted.
Only active runs can be cancelled. Cancellation returns 204, preserves persisted
candidates, and may allow already in-flight work to finish. [S5][S26]

**UNKNOWN.** No public create idempotency key, list-runs endpoint, result expiry,
delete/purge endpoint, run revision/ETag, or immutable completion snapshot is
documented.

### 7.2 Polling, snapshots, and SSE

Status and result are separate GETs. `/result` is nonblocking and returns the
snapshot available at request time. SSE events are chronological and carry
`event_id`, timestamp, type, and data; `last_event_id` resumes a disconnected
stream from a persisted cursor. A result snapshot returns its latest persisted
event ID. In-memory heartbeat status arrives every 10 seconds and is excluded
from that result cursor. Streams stay open while active or for caller timeout
0–6,000 seconds. [S4][S18]

This snapshot-plus-cursor contract is strong, but:

- event IDs are opaque, not documented monotonic sequence numbers;
- error events have no event ID/timestamp and therefore no resumable position;
- replay delivery/duplicate semantics and event retention are not stated;
- snapshot atomicity relative to its cursor is described operationally, not with
  transaction/isolation guarantees;
- schema mutation and candidate updates can make a terminal run active again.

### 7.3 Webhooks

FindAll webhooks can announce generated, matched, enriched, completed,
cancelled, and failed events. Standard Webhooks-compatible HMAC-SHA256 headers
are used; delivery may duplicate, should be deduplicated by `webhook-id`, and is
retried with exponential backoff for multiple attempts over 48 hours. [S27][S28]

**CONTRACT DISCREPANCIES:**

- the create OpenAPI's reused `Webhook` schema enumerates only
  `task_run.status`, while the FindAll guide documents FindAll-specific types;
- the webhook schema accepts unmatched and `candidate.cancelled` compatibility
  values, but current FindAll emits neither; SSE does emit unmatched;
- webhook payload bodies lack the SSE `event_id`; the delivery ID exists only in
  the signed header.

**RECOMMENDATION.** Curiosity should define one durable event envelope with run
revision, monotonic sequence, event ID, entity ID, schema version, attempt, and
snapshot cursor across polling/SSE/webhooks. Delivery is at-least-once unless a
provider contract proves otherwise.

## 8. Safety, privacy, retention, and legal constraints

### 8.1 Retrieval and entity risk

Parallel says FindAll generation searches its proprietary index. Named
`ShapBot` gathers public content for that index and honors a published robots.txt
identity; `Shap-User` is used for user-directed retrieval. This corroborates an
owned crawl/index dependency, but not exclusive sourcing, per-run freshness, or
complete coverage. [S10][S29]

FindAll has no typed source allow/deny or freshness policy. It can discover
people and is promoted for recruiting/lead generation, making personal-data,
profiling, discrimination, and stale-identity harms first-order concerns.
[S1][S9][S14]

The AUP prohibits unauthorized collection/use of private information,
surveillance, discriminatory practices, and automated employment/financial/
housing and other high-stakes decisions without required human review. Customer
Terms likewise require human oversight for high-impact decisions and independent
verification of AI output. [S30][S31]

**RECOMMENDATION.** Treat every page, candidate description, condition value,
enrichment, citation, and provider reason as untrusted external data. Apply
purpose limitation, URL/network policy, malware/active-content isolation,
prompt-injection controls, sensitive-attribute rules, retention limits, and human
review independently of FindAll confidence.

### 8.2 MCP enrichment expands the boundary

Enrichment can include remote MCP server URLs, headers, and allowed tools. The
Customer Terms place responsibility for third-party rights, credentials, data,
actions, and terms on the customer. [S15][S31]

**RECOMMENDATION.** REJECT MCP-enabled enrichment by default. If separately
authorized, isolate it as a higher-risk mode with explicit tool allowlists,
scoped credentials, no side-effecting tools, egress controls, redaction, and a
separate cost/action budget. Web content cannot authorize tool use.

### 8.3 Data use, memory, region, and retention

Material facts and contradictions:

- API data is described as encrypted in transit and at rest in US data centers;
  SOC 2 Type I/II is claimed. [S24]
- Enterprise advertises ZDR and DPAs, but the EU non-retention statement is
  expressly for the **Search API endpoint**, not FindAll. [S23][S32]
- `memory_scope_key` opt-in stores an application run into isolated Memory;
  personal Memory may be enabled by default for some new organizations. Turning
  Memory off retains existing memories until permanent deletion. [S2][S33]
- The FAQ says customer data is “Never” used to train models. Current Customer
  Terms grant a perpetual improvement license and explicitly say Parallel **may
  use Customer IP to train and improve** ML/AI models. [S24][S31 §4(b)]
- The Privacy Policy gives purpose-based—not product-specific numeric—retention.
  Public FindAll docs expose no result deletion/expiry endpoint or default run
  retention duration. [S32]

**ASSESSMENT (high).** Do not send sensitive/private data under self-serve
assumptions. Before evaluation, obtain the governing order/DPA, ZDR scope for
FindAll and webhooks/logs/backups, subprocessors/regions, deletion SLA, Memory
defaults, and written resolution of the training contradiction.

### 8.4 Output/database rights require procurement review

Customer Terms allow integration into customer applications but restrict
cross-end-customer copying/caching and prohibit using output to create database,
data-brokerage, or data-selling services, as defined there. They also prohibit
reverse engineering, competitive use, model extraction/probing, and sharing
benchmark results without written consent. [S31 §§2(b)-2(c)]

This is particularly material because FindAll is marketed as creating custom
databases. **UNKNOWN:** whether Curiosity's intended storage, reuse, multi-user
evidence cache, or evaluation falls within a negotiated permitted use. This is a
contract/counsel question, not an engineering inference.

## 9. Clean-room architecture inference

The following diagram is inferred only from published behavior:

```text
natural-language objective
    -> optional ingest/schema proposal -> caller review/approval
    -> generator tier / server-owned discovery budget
    -> proprietary-index candidate retrieval/generation
    -> candidate normalization + deduplication/disambiguation
    -> per-candidate, all-condition multi-source evaluation
         -> matched | unmatched | internally discarded
         -> field Basis (URL/excerpt/reason/confidence)
    -> matched-only Task enrichment workers [optional MCP]
    -> durable run/candidate/schema store + event log
         -> status/result snapshots
         -> resumable SSE
         -> signed webhook projection
    -> stop controller (limit/yield/pool/timeout/funds/cancel/error)
```

Supporting observations are the explicit three-stage product description,
generator-specific candidate pools, alias-aware exclusions, Task-backed
per-match enrichments, asynchronous candidate events, persisted result cursor,
and typed stop reasons. [S3][S5-S7][S10][S17-S18]

**UNKNOWN:** physical services/stores; model vendors and prompts; branch topology;
retrieval/fetch parallelism; whether candidate generation streams while
evaluation runs; candidate ranking; index/cache/live-fetch mix; confidence
calibrator version; canonicalization algorithm; event-store consistency; and
exact stop thresholds. No Curiosity implementation should claim or reproduce
these internals.

## 10. Curiosity decision ledger

| ID | Finding / design choice | Type; confidence | Verdict |
|---|---|---|---|
| D1 | Separate candidate generation, boolean evaluation, and matched-only enrichment. | Fact + recommendation; high | **ADOPT** |
| D2 | Preserve proposed ingest policy separately from caller-approved executable policy. | Fact + recommendation; high | **ADAPT** |
| D3 | Candidate lifecycle and terminal reasons make partial/incomplete work visible. | Fact; high | **ADOPT**, add unknown/failed condition states |
| D4 | Snapshot plus resumable event cursor is useful for long entity jobs. | Fact; high | **ADAPT** with monotonic sequence/revision |
| D5 | Preview, extend, and cancel support progressive commitment. | Fact; high | **ADOPT** within one aggregate hard budget |
| D6 | Condition-level Basis improves reviewability. | Fact; high | **ADAPT** to immutable claim-evidence lineage |
| D7 | Generator tiers hide candidate pools, compute, and stopping. | Fact/negative result; high | **REJECT** as neutral budget contract |
| D8 | “FindAll” does not establish exhaustive discovery; Pro reports 61.3% recall on vendor-union ground truth. | Fact + assessment; high | **REJECT** completeness claim |
| D9 | `candidates_exhausted` describes provider-pool exhaustion, not universal coverage. | Inference; high | **ADAPT** as namespaced stop only |
| D10 | Provider alias-aware exclusion is useful but unauditable and capped. | Fact; high | **ADAPT** as hint; own entity resolution |
| D11 | Citation URLs/excerpts/reasons/confidence are not complete provenance or truth. | Fact + inference; high | **REJECT** equivalence |
| D12 | Per-match pricing enables a calculable outer envelope, but no request hard-spend field exists. | Fact + inference; high | **ADAPT** with local admission ledger |
| D13 | FindAll has no typed source/freshness policy. | Negative result; high | **REJECT** for freshness/compliance-critical claims without own controls |
| D14 | MCP enrichments and Memory expand secrets, actions, retention, and authority. | Fact; high | **DEFER/opt-in only** |
| D15 | Contract terms conflict with FAQ training language and constrain database/output reuse. | Fact; high | **DEFER provider use** pending legal resolution |
| D16 | Public beta schemas contain stale/reused examples and webhook discrepancies. | Fact; high | **ADAPT** via version pinning and contract tests |

## 11. Exact Curiosity implications

1. **Name the capability honestly.** Use `entity_set_discovery` with
   `completeness: best_effort|bounded_sample|unknown`, never a semantic promise of
   “all.”
2. **Separate intent from policy.** Store objective, entity ontology, condition
   IDs/descriptions, temporal validity, null semantics, source policy, and human
   approval independently.
3. **Expose one aggregate budget.** Include maximum branches, generated
   candidates, evaluations, fetches, bytes/tokens, concurrency, elapsed time,
   spend, and output entities. Every preview, extension, retry, and enrichment
   debits it.
4. **Make planning inspectable.** Emit bounded branch/segment plans with rationale,
   expected source/entity region, parent, and budget. Provider-hidden plans remain
   opaque adapter metadata.
5. **Measure coverage, do not assert it.** Report covered/uncovered segments,
   duplicate/new yield, source diversity, sample audits, marginal gain, and the
   basis of any saturation decision. No denominator means no recall claim.
6. **Own entity resolution.** Maintain stable IDs, canonical identifiers,
   aliases, relationships, merge/split history, conflict states, and reversible
   decisions across runs/providers.
7. **Use three-valued evaluation.** Distinguish negative evidence from no
   evidence. Preserve each condition's evidence, errors, and policy version.
8. **Strengthen provenance.** Record exact passage/capture, digest, observed and
   published time, acquisition mode, parser/model/provider version, source role,
   branch, and support/contradict relation.
9. **Return partials explicitly.** Every terminal response should include
   `stop_reason`, consumed/remaining budget, branch failures, unresolved
   conditions/contradictions, coverage statement, and whether in-flight work may
   still settle.
10. **Use one durable event model.** Require idempotency key, sequence, revision,
    replay cursor, delivery attempt, duplicate handling, cancellation barrier,
    retention, and deletion.
11. **Keep source and safety policy outside prompts.** Enforce allowed public
    networks/domains, freshness, sensitive-person rules, purpose/retention,
    prompt-injection isolation, and human review in Curiosity.
12. **Isolate a future adapter.** A Parallel adapter may map generator,
    condition, events, and Basis fields, but cannot supply Curiosity's coverage,
    identity, provenance, authority, or safety guarantees.

## 12. Unknowns and checks before any authorized evaluation

### Vendor/contract checks (no benchmark required)

1. Obtain exact objective/entity/condition count and byte limits, validation of
   duplicate condition names, and output-shape/version guarantees.
2. Confirm create idempotency, duplicate billing, run/event/result retention,
   deletion/export, and whether `candidate_id` is stable across runs.
3. Reconcile 300/hour versus 25/hour quotas and the conflicting latency ranges.
4. Reconcile FindAll webhook types with the reused OpenAPI `task_run.status`
   schema; establish delivery/replay/retention semantics.
5. Obtain precise fixed/per-match/enrichment billing for failures, timeouts,
   insufficient funds, cancellation races, duplicate events, and terminal-run
   requeue.
6. Confirm whether generated/unmatched/discarded entities count in billing and
   whether all persisted candidates are returned in one unpaginated snapshot.
7. Ask for generator candidate-work limits, timeout values, low-match-rate rule,
   and meaning of `candidates_exhausted`—without requesting proprietary code.
8. Confirm FindAll index/live-fetch/cache behavior and whether any third-party
   feeds/providers contribute candidates or evidence.
9. Obtain entity-resolution policy, global-ID guarantees, duplicate/discard
   auditability, and false-merge/split evaluation.
10. Resolve the Basis nullability versus “every result” claims and request
    FindAll-specific confidence calibration/evidence-completeness documentation.
11. Resolve FindAll ZDR, regions, subprocessors, Memory defaults, retention,
    deletion/backups, and Customer Terms versus FAQ training language.
12. Obtain written permission for intended result storage, multi-user reuse,
    database construction, and any internal evaluation/benchmark reporting.

### Checks requiring separate caller authority

- fixed public test universe with independently enumerated ground truth;
- recall, precision, false-merge/split, duplicate rate, and condition calibration;
- source/excerpt entailment, source diversity, contradiction and unknown handling;
- language/geography/entity-type coverage and temporal freshness;
- cancellation/idempotency/SSE/webhook race behavior and cost reconciliation;
- benign prompt-injection fixtures on an owned domain;
- drift checks across beta versions and repeated runs.

None was executed here because credentials, paid/live calls, implementation, and
service benchmarking were explicitly outside authority; published Customer Terms
also restrict benchmark disclosure without consent. [S31]

## 13. Clean-room and license boundary

This dossier uses public interface and policy descriptions only. Parallel's
server-side index, generator, models, entity resolver, prompts, ranker, and stop
logic are proprietary Parallel IP under its Customer Terms; public documentation
does not license their reproduction. [S31]

Curiosity may independently implement general patterns—typed jobs, entity
candidates, evidence edges, event logs, budget stops—without copying Parallel
branding, examples as schemas, private behavior, service outputs, SDK code, or
undisclosed algorithms. No Parallel code or service-generated data is included.
Any future compatibility claim requires separately authorized conformance tests
and contract review.

## 14. Bounded curiosity pass

Scoring is 1 (low) to 5 (high); investigation cost is 1 (cheap) to 5
(expensive). Only caller-authorized public-source research was pursued.

| Thread | R | V | N | C | Decision |
|---|---:|---:|---:|---:|---|
| Test “exhaustive” against benchmark/termination semantics | 5 | 5 | 5 | 1 | **Pursued:** 61.3% vendor-union recall and runtime stops bound the claim |
| Determine dedupe/entity-resolution observability | 5 | 5 | 4 | 2 | **Pursued:** exclusions/discard/refresh triangulated; merge logic remains unknown |
| Reconcile delivery contracts | 4 | 5 | 4 | 1 | **Pursued:** SSE is resumable; webhook/OpenAPI types materially diverge |
| Reconcile safety/privacy against entity-database use | 5 | 5 | 5 | 2 | **Pursued:** AUP, Memory, privacy, FAQ, and Customer Terms compared |
| Find exact generator pool sizes/stop formulas | 5 | 4 | 4 | 5 | **CURIOSITY_NO_GO:** no primary disclosure; proprietary internals unnecessary to interface verdict |
| Run FindAll to measure branch/pool behavior | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** credentials/paid calls and benchmark execution prohibited |
| Inspect SDK/service code or infer prompts/models | 2 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** outside clean-room/access boundary and not needed |
| Benchmark against competitors | 2 | 3 | 2 | 5 | **CURIOSITY_NO_GO:** FindAll-only frame, no approved corpus, and terms require consent |
| Give definitive legality of people/lead datasets | 4 | 5 | 3 | 5 | **CURIOSITY_NO_GO:** jurisdiction/use-specific counsel question |
| Obtain private DPA/Trust Center/enterprise terms | 4 | 5 | 3 | 4 | **DEFERRED:** requires organizational identity and procurement authority |

**Stop reason:** coverage and saturation. Every caller-requested dimension is
answered or explicitly bounded. Remaining high-value gaps require vendor
attestation, legal review, or prohibited/separately authorized empirical work.

## 15. Primary sources

All sources accessed 2026-08-17. Vendor documentation establishes published
behavior and claims, not undisclosed implementation or independent quality.

- **[S1]** Parallel, [FindAll API Quickstart](https://docs.parallel.ai/findall-api/findall-quickstart).
- **[S2]** Parallel, [Create FindAll Run — OpenAPI](https://docs.parallel.ai/api-reference/findall/create-findall-run).
- **[S3]** Parallel, [Candidates](https://docs.parallel.ai/findall-api/core-concepts/findall-candidates).
- **[S4]** Parallel, [FindAll Run Result — OpenAPI](https://docs.parallel.ai/api-reference/findall/findall-run-result).
- **[S5]** Parallel, [Run Lifecycle](https://docs.parallel.ai/findall-api/core-concepts/findall-lifecycle).
- **[S6]** Parallel, [Generators](https://docs.parallel.ai/findall-api/core-concepts/findall-generator-pricing).
- **[S7]** Parallel, [Enrichments](https://docs.parallel.ai/findall-api/features/findall-enrich).
- **[S8]** Parallel, [Extend](https://docs.parallel.ai/findall-api/features/findall-extend).
- **[S9]** Parallel, [FindAll product page](https://parallel.ai/products/findall).
- **[S10]** Parallel, [“Introducing Parallel FindAll”](https://parallel.ai/blog/introducing-findall-api), announced 2025-11-18 per [changelog](https://docs.parallel.ai/resources/changelog).
- **[S11]** Parallel, [Quality Benchmarks](https://parallel.ai/benchmarks) and FindAll benchmark methodology reproduced on [product page](https://parallel.ai/products/findall).
- **[S12]** Parallel, [Fast Entity Search — OpenAPI](https://docs.parallel.ai/api-reference/findall/fast-entity-search).
- **[S13]** Parallel, [Ingest FindAll Run — OpenAPI](https://docs.parallel.ai/api-reference/findall/ingest-findall-run).
- **[S14]** Parallel, [Source Policy](https://docs.parallel.ai/resources/source-policy).
- **[S15]** Parallel, [Add Enrichment — OpenAPI](https://docs.parallel.ai/api-reference/findall/add-enrichment-to-findall-run).
- **[S16]** Parallel, [Preview](https://docs.parallel.ai/findall-api/features/findall-preview).
- **[S17]** Parallel, [Refresh Runs](https://docs.parallel.ai/findall-api/features/findall-refresh).
- **[S18]** Parallel, [FindAll Streaming Events](https://docs.parallel.ai/findall-api/features/findall-sse) and [SSE OpenAPI](https://docs.parallel.ai/api-reference/findall/stream-findall-events).
- **[S19]** Parallel, [Research Basis](https://docs.parallel.ai/task-api/guides/access-research-basis).
- **[S20]** Parallel, [“Introducing Basis with Calibrated Confidences”](https://parallel.ai/blog/introducing-basis-with-calibrated-confidences).
- **[S21]** Parallel, [API Pricing](https://docs.parallel.ai/getting-started/pricing).
- **[S22]** Parallel, [API Rate Limits](https://docs.parallel.ai/getting-started/rate-limits).
- **[S23]** Parallel, [Marketing pricing page](https://parallel.ai/pricing).
- **[S24]** Parallel, [API FAQs](https://docs.parallel.ai/resources/faqs).
- **[S25]** Parallel, [API Error Codes and Warnings](https://docs.parallel.ai/resources/warnings-and-errors).
- **[S26]** Parallel, [Cancel](https://docs.parallel.ai/findall-api/features/findall-cancel) and [Cancel OpenAPI](https://docs.parallel.ai/api-reference/findall/cancel-findall-run).
- **[S27]** Parallel, [FindAll Webhooks](https://docs.parallel.ai/findall-api/features/findall-webhook).
- **[S28]** Parallel, [Webhook Setup](https://docs.parallel.ai/resources/webhook-setup).
- **[S29]** Parallel, [Overview of Parallel Web Systems' Bots](https://parallel.ai/parallel-web-systems-bots).
- **[S30]** Parallel Web Systems, [Acceptable Use Policy](https://parallel.ai/acceptable-use-policy).
- **[S31]** Parallel Web Systems, [Customer Terms and Conditions](https://parallel.ai/customer-terms), especially §§2, 4, 5, and 8.
- **[S32]** Parallel Web Systems, [Privacy Policy](https://parallel.ai/privacy-policy).
- **[S33]** Parallel, [Memory](https://docs.parallel.ai/resources/memory).

## 16. Confidence summary

| Area | Confidence | Reason |
|---|---|---|
| V1 create/result/candidate contract | High | Current guides and OpenAPI agree on core shape; stale examples are identified |
| Lifecycle, SSE, extend, cancel | High | Dedicated first-party contracts; webhook discrepancies retained |
| Price arithmetic | High | Current central pricing and feature guides agree; failure billing remains unknown |
| Exhaustiveness assessment | High | Marketing claims, 61.3% benchmark result, methodology, and stop contract directly conflict with literal completeness |
| Candidate generation/planning/stopping internals | Low | Only staged product description, tier labels, metrics, and terminal reasons are public |
| Dedup/entity resolution | Low-medium | Alias-aware exclusion and discard semantics are public; identifiers/merge rules are not |
| Basis schema | High | Explicit schema and examples; empirical entailment/calibration for FindAll untested |
| Freshness/source provenance | High for absence | No FindAll controls or capture metadata in reviewed V1 contract |
| Privacy/legal posture | Medium-high | Primary terms are explicit but conflict with FAQ and negotiated enterprise terms are unknown |
| Curiosity production fit | Medium-low | Strong interface lessons; no authorized quality, drift, or operational tests |
