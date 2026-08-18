# Bright Data Deep Lookup: clean-room reverse-engineering dossier

**Research and primary-source access date:** 2026-08-17  
**Decision frame:** Can Bright Data Deep Lookup safely serve as a bounded,
provider-isolated entity-research input to Curiosity, and which externally
observable patterns should Curiosity adopt, adapt, reject, or defer?  
**Exclusive product scope:** Deep Lookup as a standalone web application and
`/datasets/deep_lookup/v1` API. Bright Data Dataset Marketplace, scrapers,
proxies, SERP, Browser API, Web Archive, and the generic “Deep Research” guide
are considered only where an official source establishes a boundary or possible
dependency. They are not treated as Deep Lookup behavior.

**Access and clean-room boundary:** Public Bright Data product pages,
documentation, OpenAPI excerpts, pricing, MSA, AUP, privacy, security, and SLA
only. No account, API key, free or paid query, preview, download, personal-data
sample, browser control-panel access, packet capture, private interface, or
provider code was used. This describes public contracts and the least-assumptive
logical architecture; it does not claim knowledge of Bright Data's private
models, prompts, indexes, crawlers, datasets, source list, or infrastructure.

## 1. Bounded questions and evidence rules

1. Is Deep Lookup a current product, beta, API, UI, dataset, search engine, or
   agent?
2. What task, query, schema, filter, result, and refinement contract is public?
3. What does the product reveal about planning, discovery, reading, extraction,
   validation, dependencies, and post-run enrichment?
4. What is the asynchronous lifecycle, including preview, progress, completion,
   cancellation, download, callback, and failure behavior?
5. What bounds coverage, cost, latency, and work, and what makes it stop?
6. Are rows and fields supported by inspectable evidence, source provenance,
   freshness, and confidence?
7. What price, trial, rate, size, retention, privacy, safety, rights, and legal
   limits apply?
8. Which clean-room lessons matter to Curiosity?

Claim labels:

- **FACT** — directly stated or exposed by a cited first-party source.
- **INFERENCE** — the least-assumptive explanation of public behavior, never a
  claim about private implementation.
- **RECOMMENDATION** — a Curiosity design, evaluation, governance, or
  procurement action.
- **UNKNOWN / NEGATIVE RESULT** — not established in reviewed public sources.
- Confidence is **high**, **medium**, or **low**. Accuracy, source-count,
  freshness, speed, ROI, security, and compliance assertions remain vendor
  claims unless independently substantiated by the cited material.

## 2. Executive synthesis and verdict

**FACT (high):** Deep Lookup is a publicly documented, API-addressable Bright
Data product for turning natural-language “Find all …” objectives into tables of
entities and requested attributes. Its advertised entity envelope includes
companies, professionals, products, news/articles, locations, and events. The
API supports free preview, optional query rewriting, either preview-derived or
direct specification execution, polling, cancellation, structured retrieval,
JSON/CSV download, and post-run column enrichment [S1][S3-S12].

**Status finding (medium-high):** it is a real commercial surface, but its general
availability is not established. Current documentation and a versioned `v1`
endpoint are public, while the official landing page routes login/signup to
`/cp/deep_lookup?beta=true`, is `noindex,nofollow`, and describes the product as
an AI-powered search engine. The public OpenAPI says version `1.0.0`, but neither
OpenAPI versioning nor public pricing proves GA or a stability SLA [S2][S3-S12].
Treat Deep Lookup as **publicly documented, beta-signaled/early commercial**
until Bright Data gives a written lifecycle and compatibility commitment.

**INFERENCE (high):** Deep Lookup is closer to an asynchronous **entity-set
research and extraction agent** than to ordinary ranked web search. The user
defines an entity population, natural-language constraints, and desired columns;
the service discovers candidates, considers and reads pages, evaluates all
constraints, emits matched rows, counts rejected candidates, and can enrich the
materialized rows later. It does not return a normal SERP or narrative research
report [S1][S6-S10].

Material strengths:

1. preview is a distinct resource before a full run;
2. the objective, row schema, constraints, enrichments, and result cap are at
   least logically distinct;
3. the asynchronous run exposes progress, pages considered/read, matched count,
   terminal states, cancellation, processed-record charge, and current cost;
4. constraints and enrichment columns are explicitly different;
5. post-run enrichment is an explicit mutation with a maximum added-cost signal;
6. matched and skipped counts expose some funnel attrition; and
7. structured output and file export make the product operationally useful
   [S3-S12].

Material blockers and uncertainties:

1. the normative request schemas conflict with first-party examples over array
   versus object request bodies, and several lifecycle enums contradict their
   prose;
2. natural-language constraints have no typed operator/value/unit/temporal
   semantics, and duplicated top-level/spec queries have no precedence rule;
3. no public branch plan, source-selection policy, candidate identity, query
   expansion, deduplication, model/version, or reproducibility contract exists;
4. “Find all,” “1,000+ sources,” “95%+ accuracy,” “real-time,” and full
   field-source transparency are marketing claims without public methodology or
   a corresponding evidence schema;
5. `result_limit` is the only caller-visible work/output bound, has no documented
   general min/max, and is not a coverage guarantee;
6. no deadline, page/search/token/dollar budget input, stop reason, saturation or
   completeness measure, per-run idempotency key, retry contract, or partial-
   result disposition is public;
7. the API's arbitrary row objects do not normatively expose source URLs, quoted
   evidence, observation times, content hashes, field confidence, validation
   votes, or derivation lineage;
8. webhook configuration is mentioned but is absent from the trigger schema and
   has no delivery security/retry contract;
9. pricing is high for broad enumeration and the API does not expose a clearly
   pre-commit hard cost cap; and
10. the product explicitly supports personal/professional contact discovery,
    while Deep Lookup-specific retention, correction/deletion propagation,
    output rights, controller roles, and model-training terms are not public
    [S1-S18].

### Verdict

**DEFER provider adoption; ADAPT the observable workflow; REJECT Deep Lookup as
Curiosity's search, provenance, or completeness foundation (high confidence).**

Deep Lookup could later be evaluated as a narrow, optional **entity discovery or
enrichment adapter** for approved business-data uses. It must not define
Curiosity's provider-neutral task ABI, source truth, “find all” semantics,
confidence, evidence graph, freshness, rights decision, or curiosity/stopping
policy. A procurement trial requires written GA/status, contract/schema,
retention, source evidence, personal-data, rights, cost-cap, and deletion terms,
plus a separately authorized non-sensitive benchmark.

## 3. Product identity, modes, and status

### 3.1 Observable identity

**FACT (high):** the official documentation calls Deep Lookup both an
“AI-powered research tool” and a way to “search the public web like a database.”
The landing page calls it an “AI-powered search engine.” Output is table-ready
structured data rather than links or a generated prose answer [S1][S2].

**FACT (high):** API identity is:

```text
Base: https://api.brightdata.com/datasets/deep_lookup/v1
Auth: Authorization: Bearer <Bright Data API key>
Spec document version: 1.0.0
```

The namespace places the API under `datasets`, but no public source explicitly
states that Deep Lookup reads Dataset Marketplace, shares its corpus, or is
legally the MSA “Dataset Service” [S3][S16].

**UNKNOWN:** no public release notes, deprecation policy, semantic API versioning
policy, planner/model version, schema revision, or announced GA date was found.
The `beta=true` control-panel route is a material status signal, not proof that
every endpoint has identical beta terms [S2].

### 3.2 UI modes versus API operations

The product guide names three modes [S1]:

| Product mode | Vendor description | Public API analogue | Contract status |
|---|---|---|---|
| Preview | Up to 10 free samples; refine query/columns; runtime and cost estimates | `POST /preview`, then `GET /preview/{id}` | Documented, but API preview response does not expose the advertised runtime/cost estimates [S1][S4-S5]. |
| Instant | Fast one-shot run for a known query | Direct `POST /trigger` with query/spec | Analogue only; no `mode=instant` field [S1][S7]. |
| Advanced | Complex, multi-step research, refinements, relationships | Possibly preview/refine/trigger/enrich composition | **UNKNOWN:** no API `advanced` mode, plan resource, relationship schema, or multi-step contract [S1][S3-S12]. |

**INFERENCE (high):** these are user-experience workflow labels, not three
normative execution tiers. Curiosity must not map them to latency, quality,
compute, or billing classes without a written contract.

## 4. Task, query, and result contract

### 4.1 Query grammar

**FACT (high):** documentation directs every query to begin with `Find all`; the
error catalog shows `INVALID_QUERY` when it does not. Guidance favors measurable
comparisons, geography, size/revenue, and 2–4 criteria, warns against vague or
overly broad searches, and warns against more than 5–6 constraints [S1][S13].

**FACT (high):** `POST /enhance_query` accepts a query and returns one
`enhanced_query`, illustrated by adding geography and funding-stage criteria.
This is provider-generated query rewriting, not a structured diff or user-
approved patch [S6].

**UNKNOWN / NEGATIVE RESULT:** the public query contract provides no:

- maximum characters/tokens, supported languages, locale, timezone, or currency;
- formal Boolean precedence, negation, interval inclusivity, unit conversion,
  “current”/“founded” time semantics, or missing-value behavior;
- source/domain allowlist or denylist, geographic acquisition control, source
  authority policy, required corroboration count, freshness interval, or cutoff;
- taxonomy/ontology identifier, entity type enum, entity-resolution key, or
  relation type;
- safe-query/moderation class, personal-data flag, purpose code, rights policy,
  or restricted-field control; or
- planner instruction, branch seed, follow-up budget, reproducibility seed, or
  model version [S1][S3-S13].

### 4.2 Direct specification

The documented direct-trigger shape contains [S7]:

| Field | Meaning | Material gap |
|---|---|---|
| top-level `query` | High-level research objective | A second `spec.query` can diverge; no precedence/conflict rule. |
| `spec.name` | Result-set name, e.g. `companies` | No identifier syntax, uniqueness, or stable ontology. |
| `spec.query` | More detailed entity-set query | Same untyped language as top-level query. |
| `spec.title` | Human title | No semantic role defined. |
| `spec.columns[]` | Named output/filter instructions | Only name, natural-language description, and two-way type are required. |
| column `type=enrichment` | Add an attribute; does not filter | No scalar/object datatype, cardinality, nullability, format, source, or confidence. |
| column `type=constraint` | Filter candidates; all constraints must pass | No predicate operator, expected value, evidence threshold, or reject reason schema. |
| `result_limit` | Limits returned results | No documented general minimum/maximum or relation to candidates/pages/cost ceiling. |

**FACT (high):** preview-derived trigger instead supplies `preview_id` plus an
optional `result_limit`. The published schema does not permit overriding the
preview query or columns in that call [S7].

**INFERENCE (high):** schema generation converts a broad natural-language task
into provider-defined columns, while direct specification lets the caller bypass
at least part of that step. The progress API can still expose
`generating_schema`; whether a direct specification skips that internal stage is
unknown [S3][S7-S9].

### 4.3 Result object

`GET /request/{id}` publicly exposes [S9]:

```text
request_id, query, status, title, step
matched_records, skipped_records
pages_read, pages_considered
total_cost
columns[] { name, description, type }
data[] { arbitrary provider-generated row object }
```

**FACT (high):** `total_cost` is current-to-date for a running request. Skipped
records are entities that did not match filter criteria. JSON and CSV are the
currently enumerated download formats [S9][S10].

**NEGATIVE RESULT (high confidence):** the schema does not define a stable row ID,
canonical entity ID, ordering, rank, score, duplicate key, pagination cursor,
row state, skip reason, per-constraint decision, null/error representation,
field datatype, source/evidence object, or charge per row. An arbitrary object
can happen to contain provider-generated fields, but that is not a normative
cross-query contract [S9].

### 4.4 Contract contradictions and drift

1. **Object versus array bodies:** the OpenAPI for preview, enhance, both trigger
   variants, and enrich wraps the body in an array; official Python/Node examples
   send a single object [S4][S6-S7][S11][S14]. The batch meaning, response
   correlation, and accepted canonical shape are unresolved.
2. **Preview status:** prose says `queued`/`running`; the actual enum says
   `pending`/`processing`, then `completed`/`failed` [S5].
3. **Run step versus run status:** step is `identifying`, `generating_schema`,
   `generating`, or `done`; status separately uses queued/running/completed/
   failed/cancelled. No valid state-pair matrix is published [S3][S8-S9].
4. **Preview response `columns`:** its example contains an Anthropic data row,
   while the full-run `columns` schema contains definitions. The preview field's
   semantic shape is therefore unclear [S4-S5][S9].
5. **Downloads:** page prose offers JSON, CSV, or Excel; query-parameter text also
   says Excel, but OpenAPI explicitly says Excel is unavailable and enumerates
   only JSON/CSV. Treat Excel as unavailable [S10].
6. **Webhook:** API overview shows a webhook object, but no endpoint accepts it in
   the published trigger schemas and no callback OpenAPI exists [S3][S7].
7. **Pre-run price visibility:** UI/pricing says cost and runtime are visible
   before committing; public preview schema exposes neither. API `max_cost` is
   returned only after `/trigger` has initiated work [S1][S5][S7][S15].

**RECOMMENDATION (high):** no generated client should be built from these excerpts
without a vendor-supplied canonical OpenAPI and no-cost conformance authorization.
An adapter must pin observed schema, reject unknown state combinations, and never
silently switch array/object forms.

## 5. Planning, search, extraction, and data dependencies

### 5.1 What public behavior establishes

**FACT (medium-high; vendor description):** Bright Data says Deep Lookup searches
1,000+ public sources simultaneously, uses advanced AI models to validate across
multiple sources, extracts current public-web data, and gives source transparency
for every data point [S1]. The run metrics separately expose pages considered and
pages read, with examples where considered pages exceed read pages [S8-S9].

**FACT (high):** visible processing stages are query identification, schema
generation, generation/collection, and done. Candidates that fail any constraint
are skipped; matching rows receive enrichment columns. Existing results can later
receive an added enrichment column [S1][S3][S9][S11].

These facts support a logical funnel, but not a private implementation claim:

```text
objective + natural-language criteria
        -> intent/entity-set interpretation
        -> schema/constraint/enrichment definition
        -> candidate discovery across provider-selected public sources
        -> page consideration / selective reading
        -> extraction + entity resolution? + cross-source validation?
        -> all-constraint evaluation
             | fail -> skipped counter / UI cell? (reject evidence unspecified)
             ` pass -> structured row + enrichments
        -> materialized request result -> JSON/CSV
                                      `-> later enrichment mutation
```

Question marks are deliberate. “Validation” and entity consolidation are
necessary to explain the advertised behavior, but their algorithms and even the
exact unit of a candidate are not public.

### 5.2 Dependency findings

**FACT (high):** Deep Lookup's own contract exposes no selectable SERP provider,
index, Dataset Marketplace dataset, scraper, browser, proxy network, model,
archive, uploaded corpus, or customer data source [S3-S12]. The separate Bright
Data Deep Research guide presents SERP, Web Archive, Browser, and Deep Lookup as
distinct building blocks and links Deep Lookup specifically for cross-source
validation [S19].

**INFERENCE (medium):** the service depends on some Bright Data-controlled mix of
candidate discovery, web acquisition, extraction, and model inference because it
reports pages and promises current public-web fields. It may exploit broader
Bright Data capabilities, but the public evidence does **not** establish that it
calls the public SERP, Browser, proxy, scraper, archive, or Marketplace APIs, or
that “1,000+ sources” means one fixed index rather than an eligible source set.

**UNKNOWN / NEGATIVE RESULT:** no source inventory, coverage map, language/
geography distribution, crawl method, robots policy, cache, source licensing,
ranking formula, branch graph, extraction prompt, model family, corroboration
algorithm, source-independence test, or candidate deduplication method is public.

## 6. Async lifecycle, failure, and mutation

### 6.1 Preview lifecycle

```text
POST /preview
  -> preview_id (+ ambiguous `columns`)
GET /preview/{id}
  -> pending|processing -> completed|failed
  -> query, sample_data, columns, result_limit
```

**FACT (high):** preview results are not immediate and must be polled. Product
material promises up to 10 free sample rows [S1][S4-S5].

**UNKNOWN:** no preview cancellation, expiry/retention, error field, progress,
retry-after, poll interval, cost, runtime estimate, source evidence, sampling
method, or guarantee that preview rows appear in the full run is documented.

### 6.2 Full-run lifecycle

```text
POST /trigger (preview_id OR query+spec; result_limit?)
  -> request_id, queued|running, max_cost
GET /request/{id}/status
  -> queued|running|completed|failed|cancelled
  -> progress 0..100, pages_read, pages_considered,
     matched_records, is_trial, result_limit
GET /request/{id}
  -> lifecycle step + partial/current counters/cost/data
GET /request/{id}/download?format=json|csv
POST /request/{id}/cancel
  -> cancelled, records_processed, charge
```

**FACT (high):** cancellation is not free rollback: the response reports records
processed and a charge. The request-data endpoint is usable during execution in
official examples and describes current running cost [S9][S12][S14].

**INFERENCE (medium-high):** matched rows are materialized incrementally enough
to meter current cost and support charged cancellation. Public docs do not say
whether partial `data[]` is durable, downloadable, source-complete, or retained
after failure/cancellation.

### 6.3 Post-run enrichment

**FACT (high):** `POST /request/{id}/enrich` names a new column and supplies a
natural-language query. It returns the column name, `processing|completed`, and
`max_additional_cost`; final cost depends on matched rows [S11][S15].

**MATERIAL GAP:** no enrichment job ID, status endpoint, error state, cancel call,
idempotency key, duplicate-column rule, column version, update timestamp,
transactionality, old/new result revision, or concurrent-enrichment behavior is
specified. The official example explicitly says waiting “would depend on actual
API behavior,” confirming that the public example does not know the lifecycle
[S11][S14].

### 6.4 Errors, callbacks, and delivery

**FACT (high):** named API errors are `INVALID_API_KEY`, `RATE_LIMIT_EXCEEDED`,
`INVALID_QUERY`, `INSUFFICIENT_CREDITS`, `REQUEST_NOT_FOUND`, and
`PROCESSING_ERROR`, in an `{error:{code,message,details}}` envelope [S13].

**NEGATIVE RESULT:** endpoint OpenAPI excerpts declare only HTTP 200; no HTTP
status mapping, retryability, `Retry-After`, provider request ID distinct from the
job, validation-path errors, partial-failure structure, or rate number is public.
Webhook event names are shown, but callback authentication/signature, event ID,
payload, retries, timeout, ordering, duplicate delivery, replay, destination
validation, and disable/revocation are absent [S3-S13].

**RECOMMENDATION (high):** poll from a bounded operator-owned scheduler; classify
unknown failures as non-retryable until evidence says otherwise; preserve every
attempt; never automatically resubmit a non-idempotent paid trigger. Do not enable
webhooks until a signed, replay-safe, allowlisted callback contract exists.

## 7. Coverage, budgets, latency, and stopping

### 7.1 Observable bounds

| Bound/signal | Public behavior | What it does not establish |
|---|---|---|
| Preview rows | Up to 10 free samples [S1][S15] | Representative sampling, source diversity, or full-run recall. |
| Trial | Five free queries, up to 100 records each [S15] | API entitlement, exact definition of query, or ongoing production limit. |
| `result_limit` | Requested row cap; reflected in status [S7-S8] | Candidate/page/search cap, guaranteed row count, or general allowed range. |
| `pages_considered` | Count surfaced during/after run [S8-S9] | What counts as a page, duplicate scope, source universe, or evidence use. |
| `pages_read` | Count surfaced during/after run [S8-S9] | Complete fetch, cache/live status, bytes, tokens, or citation use. |
| `matched_records` | Passing rows found so far [S8-S9] | Stable order, exhaustive recall, unique entities, or accepted final rows. |
| `skipped_records` | Candidates failing at least one constraint [S1][S9] | Per-constraint reasons, all considered candidates, or rejected evidence. |
| `progress` | Integer 0–100 [S8] | Denominator, monotonicity, phase weighting, or ETA. |
| `max_cost` | Returned when full work is triggered [S7] | Caller-provided hard cap or pre-trigger API quote. |
| cancel | Stops an in-progress request and charges processed records [S12] | Cancellation latency, in-flight ceiling, or atomicity. |

### 7.2 Stopping is opaque

**UNKNOWN / NEGATIVE RESULT (high confidence):** no public request or response
defines:

- maximum candidate sources, searches, branches, pages, bytes, fetches, models,
  inference tokens, retries, or wall time;
- request deadline, inactivity timeout, per-source timeout, queue TTL, or maximum
  concurrency;
- hard dollar cap supplied by the caller, reservation amount, or overshoot rule;
- minimum matches, source diversity, independent corroboration, evidence quality,
  contradiction, novelty, marginal value, saturation, or coverage threshold;
- stop reason such as `result_limit`, `source_exhausted`, `saturated`, `timeout`,
  `cost_cap`, `cancelled`, or `policy`; or
- incomplete/partial flag and remaining candidate estimate [S3-S15].

**INFERENCE (high):** the provider owns an internal work envelope because runs
terminate and publish progress/cost, but its boundary is not the caller's
contract. A run may stop after reaching `result_limit`, exhausting a provider
candidate pool, meeting an internal confidence rule, hitting a hidden budget, or
some combination; public evidence cannot distinguish them.

**RECOMMENDATION (high):** Curiosity must never translate a completed Deep Lookup
job into “all entities found.” Normalize it as a **provider-projected, capped
entity set** with unknown recall and an opaque stop reason.

### 7.3 Latency and availability

**FACT (medium; vendor claim):** the guide says weeks of research become minutes
and elsewhere calls results “instantly”; Preview UI allegedly provides a runtime
estimate [S1][S15]. No API p50/p95/p99, maximum runtime, result-size curve, or
Deep Lookup-specific throughput is public.

**FACT (high):** the general SLA targets 99.9% Bright Data **network** uptime and
defines dataset/data-collection incident categories, but does not name Deep
Lookup, commit to job completion latency/accuracy, or provide Deep Lookup service
credits. Applicability depends on the Agreement [S20].

## 8. Evidence, attribution, validation, and provenance

### 8.1 Vendor representations

**FACT (high that stated; unverified):** Bright Data claims 95%+ accuracy, multiple-
source validation, “full source attribution,” source transparency for every data
point, and 1,000+ sources [S1][S15]. Use-case examples separately advertise
90–100% match rates without public benchmark design [S1].

**CONTRADICTION / ambiguity (high):** the same guide describes 1,000+ **public
sources overall**, says it searches 1,000+ simultaneously, and in a metrics table
says “1,000+ per result.” These are materially different coverage claims. No
source list or per-row count resolves them [S1].

### 8.2 Public wire contract does not carry the claim

**NEGATIVE RESULT (high confidence):** no typed API response requires:

- source URL, canonical/final URL, title, publisher, author, or source class;
- quote/snippet, selector, byte offsets, screenshot, raw page, or content hash;
- query/discovery time, origin observation time, fetch time, publication time,
  valid time, cache age, or retrieval mode;
- field-to-source mapping, direct/derived/inferred/enriched classification;
- number of supporting/contradicting sources, independence, authority, or vote;
- extraction/model/parser version, transformation, unit normalization, or entity
  merge lineage;
- model confidence, evidence score, calibration, validation result, or accuracy
  denominator; or
- branch/candidate lineage, rejected values, skipped-row evidence, or provenance
  completeness [S4-S11].

The arbitrary `data[]` object might include source columns in a particular run;
the public schema neither requires nor explains them. Marketing “transparency”
must not be promoted into an adapter guarantee.

**UNKNOWN:** “95% accuracy” has no published task set, sample size, field/row/
constraint unit, adjudication method, time window, error bars, source mix, or
independent evaluation. “Match rate” may mean records satisfying the generated
criteria, not real-world precision or recall.

### 8.3 Curiosity evidence requirement

**RECOMMENDATION (high):** accept a Deep Lookup field only as
`provider_asserted` unless it carries an exact retrievable source and Curiosity
independently validates the claim. Preserve:

```text
provider_job_id, provider_row_id?, provider_column
claim_value, claim_type, constraint_decision?
source_url?, quoted_span?, source_observed_at?, source_hash?
provider_validation_claim?, evidence_completeness=unknown
provider_pages_considered, provider_pages_read
provider_matched_count, provider_skipped_count
adapter_received_at, adapter_version, raw_response_hash
```

Question marks denote unavailable fields, not permission to infer them.

## 9. Freshness and time semantics

**FACT (medium; vendor representation):** Deep Lookup advertises “real-time data
extraction” and “the most current data available from the public web, not outdated
databases” [S1][S15]. A query may contain temporal criteria such as articles from
the last 30 days or funding within 18 months [S1].

**NEGATIVE RESULT (high confidence):** no Deep Lookup contract defines:

- live fetch versus cache/index/dataset lookup;
- cache age, revalidation, stale-on-error, or “most current” comparison rule;
- per-row/field/source observation or retrieval timestamp;
- source publication, event, effective, or validity time;
- temporal-query evaluation clock/timezone;
- source-change-to-result freshness SLO;
- refresh/re-run semantics or source correction/deletion propagation; or
- reproducible as-of queries and historical snapshots [S1][S3-S15].

**INFERENCE (high):** “real-time” is positioning, not auditable temporal
provenance. Even a live page read would establish only observation time, not that
the field is current or that discovery coverage is fresh.

**RECOMMENDATION (high):** keep `provider_freshness_claim`, `job_started_at`,
`job_completed_at`, `received_at`, `source_observed_at?`, `published_at?`, and
`valid_at?` distinct. Never invent a row timestamp from completion or download
time.

## 10. Pricing, trial, and operational limits

### 10.1 Public meter on 2026-08-17

**FACT (high):** list pricing is **$1.00 per matched record**, including the first
10 enrichment columns. Each additional enrichment column is **$0.05 per matched
record**; skipped/unmatched candidates are not charged. Public volume tiers are
$1.00 for 1–1,000 monthly rows, $0.80 for 1,001–5,000, $0.70 for 5,001–10,000,
and custom at 10,000+ [S15].

**FACT (high):** the pricing page says no setup fees or minimum commitment for
pay-as-you-go, and advertises five free queries of up to 100 records. Preview
offers 10 free samples. Enterprise lists API access, custom pricing, and dedicated
support [S1][S15]. These are mutable public prices, not a quote or purchase
authorization.

**CONTRACT DRIFT:** exactly 10,000 rows belongs to both “5,001–10,000” and
“10,000+” in the table. Discount application (marginal versus all-unit), billing
month timezone, taxes, rounding, duplicate/retry charging, cancelled/failed run
charging beyond the cancel example, and whether trial includes API calls are not
defined [S15].

### 10.2 Cost-control limits

**FACT (high):** `/trigger` returns a string `max_cost`; cancellation returns a
string charge; running request data returns current total cost; enrichment returns
maximum additional cost [S7][S9][S11-S12].

**INFERENCE (high):** `result_limit × per-row price` is likely the basis of the
initial maximum, with extra columns affecting cost, but no normative formula binds
the fields. At list price, broad 1,000-row enumeration is up to $1,000 before
extra columns, making accidental breadth consequential.

**MATERIAL GAP:** no request parameter sets `max_cost`, no quote ID/expiry is
bound to a trigger, no spend reservation or atomic preauthorization is described,
and API preview omits cost. Cancellation may occur only after billable work. A
returned `max_cost` is therefore observability, not a caller-enforced pre-run
budget [S5][S7][S12].

### 10.3 Missing limits

No documented Deep Lookup-specific request rate, concurrent-job cap, queue size,
query/column count, column-name/description size, full-run row maximum, result
retention, download size, export expiry, polling limit, webhook limit, page limit,
or enrichment count was found. `RATE_LIMIT_EXCEEDED` proves some limiter exists,
not its value [S3-S15].

## 11. Privacy, safety, rights, and legal boundary

This section is product/contract analysis, not legal advice.

### 11.1 Personal and professional data

**FACT (high):** official examples encourage finding named-role professionals,
verified email addresses, phone numbers, contact information, social profiles,
employment history, company attributes, and third-party-like funding/revenue
facts [S1][S15]. The Bright Data privacy policy says it collects publicly posted
personal data such as names, emails, and job titles, processes Public Data under
claimed legitimate interest subject to fundamental rights, and may share Public
Data with users to provide services [S18].

**FACT (high):** data subjects may request access, correction, restriction,
objection, or deletion. The CCPA notice says Bright Data may have sold
“Identifiers” in the prior 12 months and describes a 45-day response goal,
extendable [S18].

**MATERIAL UNKNOWN:** no Deep Lookup-specific API or term maps a correction,
objection, suppression, or deletion to request IDs, rows, columns, exports,
sources, enriched copies, or prior customers. No tombstone/correction feed,
stable subject key, notice to past recipients, or propagation SLA was found.

**RECOMMENDATION (high):** disallow person/contact enrichment by default. Any
exception needs purpose, lawful basis, jurisdiction, notice, minimization,
marketing/recruiting restrictions, subject lookup, retention, deletion, access,
recipient, and security review. “Public” and “verified” are not permission.

### 11.2 MSA, AUP, and output rights

**FACT (high):** the MSA makes the client responsible for lawful use, third-party
rights, intended use, and actions based on service output. It disclaims accuracy,
completeness, non-infringement, security, and uninterrupted/error-free service;
generally caps liability at one month of fees; and requires client indemnity for
third-party IP, privacy, or legal claims [S16].

**FACT (high):** the AUP prohibits nonpublic/behind-login collection, illegal,
fraudulent, abusive, spam, fake-account/engagement, and third-party-rights-
violating uses. Bright Data may block categories or otherwise limit service at its
discretion [S17].

**IMPORTANT CLASSIFICATION UNKNOWN:** the MSA does not name Deep Lookup. Its
general “Data Services” clause bars distributing, transmitting, reproducing,
publishing, licensing, transferring, or selling Data to offer a similar or
competitive product. The API's `datasets` path and table output suggest possible
Data Service treatment, but the public contract does not definitively allocate
Deep Lookup among Dataset Service, Web Scraper IDE, Data Insights, or another
service category [S3][S16]. Dataset review-period and Web Scraper data-retention
clauses must not be automatically imported into Deep Lookup without written
classification.

**UNKNOWN / NEGATIVE RESULT:** no Deep Lookup-specific public term clearly grants
rights for persistent storage, internal indexing, embeddings, model training,
evaluation fixtures, derived datasets, excerpts, redistribution, customer-facing
results, post-termination use, or source artifacts. No product-specific retention
or deletion horizon for query text, specifications, pages, evidence, rows,
exports, or model inputs was found [S16-S18].

**RECOMMENDATION (high):** require an order form to classify the service and
state output/source rights, no provider training or independent reuse, retention
and purge windows, source/license responsibility, correction/deletion notices,
post-termination rights, and approved uses. The general MSA is insufficient for a
Curiosity adapter.

### 11.3 Security and untrusted-data risks

**FACT (medium; vendor/security evidence scope):** Bright Data reports ISO
27001/27017/27018, SOC 2 Type II under NDA, public SOC 3, TLS 1.3/minimum 1.2,
AES-256 at rest, AWS multi-AZ, RBAC, MFA, and testing. Its 2025 penetration-test
list includes Control Panel/Public APIs and Dataset/Marketplace/API surfaces, but
does not name Deep Lookup [S21]. These are broad control claims, not proof of
Deep Lookup tenant isolation, model safety, or retention.

**NEGATIVE RESULT:** Deep Lookup docs expose no prompt-injection defense, source
trust tiers, malicious-content isolation, URL safety, content moderation,
sensitive-field classification, source-domain policy, secret/PII redaction,
spreadsheet-formula neutralization, model instruction hierarchy, or human-review
gate [S1][S3-S15].

**RECOMMENDATION (high):** treat queries, generated schemas, every row/value,
source reference, filename, error, webhook, JSON, and CSV cell as untrusted. Apply
strict schema/size/nesting limits; neutralize CSV formulas; forbid data-driven
tool calls; isolate retrieved text from instructions; scan URLs; minimize logs;
use a least-privilege expiring `User` API key; and prevent agents from selecting
personal fields, row limits, paid execution, enrichment, cancellation, export,
or callback destinations without operator policy [S22].

## 12. Clean-room logical architecture inference

The following is **INFERENCE**, not a claim about Bright Data source code,
models, prompts, databases, crawlers, indexes, storage engines, queues, or cloud
topology.

```text
UI / API caller
  | Bearer key + query OR preview/spec + result_limit
  v
account, entitlement, trial, policy, and billing admission
  |
  +--> query enhancer / preview workflow
  |      -> intent + generated schema -> sample rows -> preview_id
  |
  `--> full-run coordinator -> request_id + maximum-cost projection
           |
           +--> identify entity set and normalize column instructions
           +--> discover candidate entities/pages from provider source universe
           +--> consider pages -> select/read a subset
           +--> extract/merge/validate candidate fields (methods unknown)
           +--> evaluate all constraints
           |      | reject -> skipped count
           |      ` accept -> matched row + included enrichments
           +--> progress/counter/cost projection
           `--> materialized result object
                   | GET/poll + JSON/CSV export
                   ` POST enrichment -> revised/additional column (revision unknown)
```

Evidence for these **logical** boundaries:

- separate preview and request IDs [S4-S9];
- identification/schema/generation steps [S3][S9];
- considered/read/matched/skipped counters [S8-S9];
- two column roles and all-constraint matching [S1][S3][S7];
- cost projection/current cost/cancel charge [S7][S9][S12]; and
- post-run enrichment and downloadable materialized results [S10-S11].

**Confidence:** high for the external resources and funnel; medium for separate
candidate discovery, selective acquisition, materialization, and billing planes;
low for any particular search/index, model, validation, merge, queue, cache,
database, or physical service decomposition.

## 13. Curiosity verdict ledger

### ADOPT

1. **ADOPT — preview as a non-equivalent resource (high).** A sample/proposed
   schema should have its own identity and must not masquerade as the full run.
2. **ADOPT — separate constraints from enrichments (high).** A field that decides
   inclusion is semantically different from a field merely requested for output.
3. **ADOPT — expose funnel telemetry (high).** Preserve candidates considered,
   evidence fetched, matched, rejected, accepted, and billed as distinct counts.
4. **ADOPT — cancellation with explicit consumed work/cost (high).** Cancellation
   is a terminal outcome, not rollback.
5. **ADOPT — post-run enrichment as a separately metered operation (medium-high).**
   It needs its own job/revision/provenance, not silent row mutation.

### ADAPT

1. **ADAPT — natural-language objective into typed policy (high).** Parse an
   objective into an operator-reviewable entity type, predicates, units, time,
   source policy, and output schema; never execute generated scope silently.
2. **ADAPT — preview to a dry-run plan (high).** Return proposed branches,
   predicates, fields, sources/classes, privacy/rights flags, expected work,
   maximum spend, and uncertainty before any paid acquisition.
3. **ADAPT — two-level lifecycle to one valid state machine (high).** Use admitted,
   queued, planning, retrieving, extracting, validating, partial, completed,
   failed, cancelled, timed_out, and policy_blocked with valid transitions.
4. **ADAPT — page counters to inspectable evidence accounting (high).** Every
   considered/fetched/used source needs lineage and a reason; counts alone are
   not provenance.
5. **ADAPT — `result_limit` to shared budgets (high).** Cap branches, searches,
   fetches, pages, bytes, tokens, rows, dollars, concurrency, and deadline.
6. **ADAPT — source transparency to claim-level grounding (high).** Bind each
   field/predicate to exact spans, URLs, hashes, observation times, and support or
   contradiction role.
7. **ADAPT — provider enrichment to immutable revisions (high).** Added columns
   create a new result revision and evidence lineage with separate cost.

### REJECT

1. **REJECT — “Find all” as a completeness claim (high).** No denominator,
   coverage method, or stop reason supports it.
2. **REJECT — arbitrary provider row objects as Curiosity's ABI (high).** They are
   mutable, untyped, and provenance-poor.
3. **REJECT — prompt-only constraints as authoritative filtering (high).** Units,
   evidence thresholds, missing values, and time semantics are ambiguous.
4. **REJECT — marketing accuracy/source/freshness as evidence (high).** Retain as
   provider claims only.
5. **REJECT — completed status as complete/correct/fresh (high).** It means the
   provider workflow ended successfully, nothing more.
6. **REJECT — automatic retry of paid trigger/enrichment (high).** No idempotency
   or duplicate-charge contract exists.
7. **REJECT — personal/contact discovery by default (high).** It creates purpose,
   privacy, marketing, deletion, and security obligations.
8. **REJECT — agent authority to trigger spend or broaden scope (high).** Query
   enhancement, row limits, added columns, callbacks, and paid execution require
   policy/operator authority.

### DEFER

1. **DEFER — provider integration (high).** Status, schema contradictions,
   limits, evidence, retention, rights, privacy, and cost controls are unresolved.
2. **DEFER — API client generation (high).** Obtain canonical OpenAPI and reconcile
   object/array, enum, export, and webhook contradictions.
3. **DEFER — business-entity benchmark (medium-high).** Requires approved public
   non-personal truth sets, trial authority, cost cap, and evidence capture.
4. **DEFER — webhook use (high).** Signature, replay, retry, payload, and
   destination-security contracts are missing.
5. **DEFER — post-run enrichment (medium-high).** No job/revision/failure/cancel
   lifecycle is public.
6. **DEFER — any people/contact use (high).** Requires a specific purpose,
   jurisdiction, controller/processor allocation, source/right basis, and deletion
   protocol.

## 14. Proposed provider-neutral research envelope

**RECOMMENDATION (high):** any later adapter should map a strict subset into the
provider and preserve at least:

```text
research_job_id, tenant_id, objective, entity_type
predicate_ast[], projection_schema[], enrichment_requests[]
source_policy, freshness_policy, privacy_policy_id, rights_policy_id
max_branches, max_searches, max_fetches, max_pages, max_bytes
max_rows, max_tokens, max_cost, deadline, max_concurrency
plan_revision, approval_id, adapter_version, provider_request_id?
provider_query, provider_spec, provider_preview_id?, provider_result_limit
provider_status, provider_step?, progress_claim?
pages_considered?, pages_read?, matched?, skipped?
row_id, canonical_entity_id?, provider_row_hash, result_revision
claim_id, field_path, value, datatype, unit?, valid_time?
evidence_url?, quote?, observed_at?, content_hash?, source_role?
support_relation?, contradiction_relation?, provenance_completeness
provider_cost_claim, reconciled_cost, started_at, completed_at
stop_reason, partial, truncation_flags[], unresolved_gaps[], errors[]
untrusted_external_data=true
```

Curiosity's terminal reasons should include `coverage_satisfied`, `saturated`,
`result_cap`, `budget_exhausted`, `deadline`, `cancelled`, `provider_failed`, and
`policy_blocked`. When Deep Lookup supplies no reason, record
`provider_completed_stop_unknown`, not an invented explanation.

## 15. Unknowns and required checks before adoption

### Product and contract

1. Obtain written beta/GA status, roadmap, API compatibility/deprecation policy,
   regional availability, support tier, and Deep Lookup-specific SLA.
2. Obtain canonical downloadable OpenAPI: exact body cardinality, fields,
   min/max/length bounds, statuses, steps, transitions, error statuses, and
   download media types.
3. Define top-level versus spec query precedence, column naming/types/nulls,
   constraint semantics, units, missing data, conflict handling, duplicate rows,
   ordering, and stable entity identity.
4. Define preview sampling, representativeness, expiry, full-run relationship,
   estimate fields, and whether previews can contain personal data.

### Planning, coverage, and stopping

5. Disclose at a policy level source universe/classes, discovery method,
   language/geography/time coverage, candidate dedupe/entity resolution, and what
   “1,000+ sources” means.
6. Define pages considered/read, progress denominator, hidden work ceilings,
   `result_limit` behavior, source exhaustion, saturation, and every stop reason.
7. Provide hard request-side limits for cost, pages, wall time, rows, concurrency,
   fields, and source classes, including overshoot and cancellation latency.
8. Establish reproducibility, query/model/index versioning, retry/idempotency,
   duplicate-charge rules, and partial-result retention.

### Evidence, quality, and freshness

9. Require typed field-level sources, exact supporting passages, observation
   timestamps, hashes, extraction/validation versions, direct/derived labels,
   contradictions, and rejected-value history.
10. Obtain the full 95% accuracy and 90–100% match-rate methodology, error
    taxonomy, benchmark corpus, date, denominator, source mix, calibration, and
    independent evidence.
11. Define live/cache/index behavior, recency SLO, temporal predicate clock,
    source correction/update handling, and per-field validity.

### Cost and operations

12. Freeze list/volume discount semantics, exact 10,000-row tier, extra-column
    meter, trials/API entitlement, taxes, failed/cancelled/retried jobs, and
    post-run enrichment charges in a quote.
13. Require quote-before-trigger plus immutable quote ID and request-side hard
    spend cap; define reservations, insufficient-credit races, and reconciliation.
14. Obtain rate/concurrency/queue/runtime/retention/export limits and webhook
    signing, payload, retry, dedupe, replay, allowlist, and disable contracts.

### Privacy, security, and legal

15. Classify Deep Lookup under the MSA; negotiate output, source, storage,
    indexing, embedding, derivative, evaluation, redistribution, and post-
    termination rights.
16. Establish query/source/output/log/export retention, provider independent use
    and training, subprocessors, regions, support access, deletion and backup
    purge, breach deadline, and Deep Lookup-specific audit scope.
17. For any person data, define controller/processor roles, source/legal basis,
    notice, purpose/marketing restrictions, subject IDs, correction/deletion feed,
    prior-customer notice, and downstream propagation SLA.
18. Obtain prompt-injection/content-isolation, source safety, moderation,
    malicious-file/CSV, tenant isolation, webhook SSRF, and model data-leakage
    controls.

## 16. Retained negative results and contradictions

| Topic | Result | Safe treatment |
|---|---|---|
| GA status | Public docs/API coexist with `beta=true` dashboard route; no GA statement found. | Treat as beta-signaled until written otherwise. |
| Request cardinality | OpenAPI says arrays; official examples send objects. | No client generation or paid calls until reconciled. |
| Preview states | Prose says queued/running; enum says pending/processing. | Accept neither as universal without canonical schema. |
| Modes | Preview/Instant/Advanced are described; no mode enum exists. | Treat as UX labels, not execution guarantees. |
| Webhook | Overview shows config; trigger does not accept it. | Unsupported for adapter planning. |
| Excel | Prose says available; OpenAPI says not currently available. | Treat as unavailable. |
| Cost before run | UI promises estimate; API preview omits it and trigger returns max after initiation. | Require external quote/hard cap. |
| 1,000+ sources | Described as overall, simultaneous, and per result. | Coverage unit unknown; do not repeat as measured fact. |
| 95%+ accuracy | No methodology or result field. | Unverified vendor claim. |
| Source transparency | Marketing promises field sources; API has no source schema. | Mark evidence completeness unknown. |
| Real-time | No cache/live/timestamp contract. | Do not infer freshness. |
| “Find all” | Result cap and opaque source/stopping envelope. | Provider-projected set, unknown recall. |
| Enrichment lifecycle | Processing/completed response but no job/status/failure/cancel/revision. | Defer post-run mutation. |
| Rate/size/retention | Errors prove rate limiting; numbers and retention are absent. | Obtain written limits before evaluation. |
| MSA category | Deep Lookup not named. | Require service classification and specific terms. |
| Personal-data deletion | Privacy rights exist; no result/update propagation protocol. | Do not ingest person data by default. |

No independent quality, accuracy, coverage, freshness, latency, privacy, or cost
result was generated. No result row, preview, source citation, export, or account
behavior was observed. No public license was found making Deep Lookup output,
schemas, prompts, service behavior, or source artifacts open-source or freely
reusable.

## 17. Bounded curiosity pass

Scores are **relevance/value/novelty/cost**, 1 (low) to 5 (high). Only public,
first-party, in-frame work capable of changing the decision was eligible.

| Thread | R/V/N/C | Decision and result |
|---|---:|---|
| Public status and beta signal | 5/5/5/1 | **Pursued.** Public docs/v1 coexist with a beta-tagged control-panel URL; GA remains unknown [S2-S3]. |
| Full endpoint/lifecycle reconstruction | 5/5/4/2 | **Pursued.** Nine endpoint references establish resources, states, counters, cancellation, export, and enrichment [S4-S12]. |
| Object/array and state contradictions | 5/5/5/1 | **Pursued.** OpenAPI and examples conflict; retained rather than guessed [S4-S14]. |
| Evidence/source transparency schema | 5/5/5/1 | **Pursued to saturation.** Marketing promises attribution, but every public response schema lacks a typed evidence object [S1][S4-S11]. |
| Hard cost cap before trigger | 5/5/4/1 | **Pursued.** API exposes post-trigger maximum/current/cancel costs but no caller cap or preview quote [S5][S7][S9][S11-S12]. |
| “Find all” coverage and stopping | 5/5/5/1 | **Pursued.** Result cap and page counters exist; no denominator, source universe, budget, saturation, or stop reason exists. |
| MSA product classification | 5/5/4/2 | **Pursued.** Deep Lookup is unnamed; Dataset/Data Service provisions cannot safely be assumed [S16]. |
| Personal-data correction/deletion flow | 5/5/4/2 | **Pursued.** Privacy rights exist; no Deep Lookup row/export propagation contract was found [S18]. |
| Free preview/API probing | 5/5/3/5 | **CURIOSITY_NO_GO:** caller prohibited credentials and supplied no authorized account; previews may contain personal/licensed data and could trigger retention obligations. |
| Paid accuracy/latency/coverage benchmark | 5/5/4/5 | **CURIOSITY_NO_GO:** paid tests and purchase authority are expressly absent. |
| Reverse engineer prompts/models/index/source list | 2/2/5/5 | **CURIOSITY_NO_GO:** proprietary, unnecessary, unsupported by public evidence, and outside the clean-room boundary. |
| Download free samples or inspect contact rows | 4/4/3/5 | **CURIOSITY_NO_GO:** no download authority; contamination, personal-data, rights, and retention risks exceed value. |
| Audit every possible source site's terms | 3/4/3/5 | **CURIOSITY_NO_GO:** no disclosed source inventory or exact intended use; later source/use-specific counsel work. |
| Third-party reviews and SEO comparisons | 2/2/2/3 | **CURIOSITY_NO_GO:** lower authority and would not close contract/evidence/privacy gaps. |
| Deep Lookup private security assessment | 4/5/4/5 | **DEFERRED:** requires vendor NDA material, threat model, and procurement authority. |

**Stop condition:** coverage and saturation. Every requested dimension has a
public fact, bounded inference, or explicit negative result. Remaining material
questions require vendor disclosure, canonical contracts, a named use case,
counsel/procurement review, credentials, or authorized empirical work. No live
autonomous follow-up is authorized outside this declared frame.

## 18. Primary source ledger

All sources are first-party Bright Data materials accessed **2026-08-17**.

- **[S1]** [Deep Lookup documentation](https://docs.brightdata.com/datasets/deep-lookup/overview) — identity, entities, queries, modes, columns, skips, source/accuracy/freshness claims, preview, use cases.
- **[S2]** [Deep Lookup official landing page](https://brightdata.com/lp/deep-lookup) (also reached from `/products/deep-lookup`) — product description, page publication/modification metadata, `noindex,nofollow`, and beta-tagged dashboard destination.
- **[S3]** [Deep Lookup API overview](https://docs.brightdata.com/api-reference/deep-lookup/overview) — base URL, authentication, workflow, stages, webhook example.
- **[S4]** [Create Preview OpenAPI](https://docs.brightdata.com/api-reference/deep-lookup/create-preview) — asynchronous preview creation, body and response schema.
- **[S5]** [Get Preview Data OpenAPI](https://docs.brightdata.com/api-reference/deep-lookup/get-preview-data) — preview states, samples, columns, limit.
- **[S6]** [Enhance Query OpenAPI](https://docs.brightdata.com/api-reference/deep-lookup/enhance-query) — natural-language query rewriting.
- **[S7]** [Trigger Full Request OpenAPI](https://docs.brightdata.com/api-reference/deep-lookup/trigger-full-request) — preview/direct variants, specification, column roles, result limit, request ID, status, maximum cost.
- **[S8]** [Get Request Status OpenAPI](https://docs.brightdata.com/api-reference/deep-lookup/get-request-status) — terminal states, progress, page and match counters, trial flag.
- **[S9]** [Get Request Data OpenAPI](https://docs.brightdata.com/api-reference/deep-lookup/get-request-data) — steps, counters, current cost, columns, arbitrary result rows.
- **[S10]** [Download Results OpenAPI](https://docs.brightdata.com/api-reference/deep-lookup/download-results) — JSON/CSV export and Excel contradiction.
- **[S11]** [Enrich Column OpenAPI](https://docs.brightdata.com/api-reference/deep-lookup/enrich-column) — post-run column operation and maximum added cost.
- **[S12]** [Cancel Request OpenAPI](https://docs.brightdata.com/api-reference/deep-lookup/cancel-request) — cancellation, processed records, charge.
- **[S13]** [Deep Lookup error handling](https://docs.brightdata.com/datasets/deep-lookup/errors) — error envelope and named codes.
- **[S14]** [Deep Lookup official code examples](https://docs.brightdata.com/datasets/deep-lookup/code-examples) — polling, page/match progress, body-shape conflicts, enrichment-lifecycle uncertainty.
- **[S15]** [Deep Lookup pricing](https://docs.brightdata.com/datasets/deep-lookup/pricing) — list price, columns, volume discounts, skipped rows, examples, trial and commercial plans.
- **[S16]** [Bright Data Master Service Agreement](https://brightdata.com/license), updated 2026-06-16 — general duties, Data Services restriction, disclaimers, liability, termination, service-specific categories.
- **[S17]** [Bright Data Acceptable Use Policy](https://brightdata.com/acceptable-use-policy) — prohibited and provider-limited uses.
- **[S18]** [Bright Data Privacy Policy](https://brightdata.com/privacy), reviewed 2026-05-14 — User/Public Data, purposes, rights, retention, CCPA identifiers and response timing.
- **[S19]** [Bright Data “Deep Research” guide](https://docs.brightdata.com/ai/deep-research) — separation of Deep Lookup from SERP, Archive, and Browser building blocks; cross-source-validation positioning.
- **[S20]** [Bright Data Service Level Agreement](https://brightdata.com/sla), updated 2026-05-24 — general network uptime and dataset/data-collection incident terms.
- **[S21]** [Bright Data security and compliance overview](https://docs.brightdata.com/general/security/security-overview) — certification, audit, encryption, infrastructure, access, and penetration-test scope claims.
- **[S22]** [Bright Data authentication](https://docs.brightdata.com/api-reference/authentication) — API-key creation, expiry, and five permission levels.
