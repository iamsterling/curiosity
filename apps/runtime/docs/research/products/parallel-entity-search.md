# Parallel Entity Search: clean-room product and architecture study

**Research date / source access:** 2026-08-17 for every source below  
**Product boundary:** Parallel **Entity Search** only. FindAll, Search, crawler,
pricing, and legal pages are used only where they establish Entity Search's
boundary, likely substrate, or governing constraints.  
**Authority boundary:** public first-party documentation, OpenAPI, product/blog,
crawler, pricing, status, privacy, and customer-terms pages. No account, API key,
paid/free call, playground use, package/source inspection, access-control bypass,
benchmark reproduction, or proprietary output collection was used.

## 1. Decision frame

**Decision:** what does Parallel's public Entity Search contract reveal about a
bounded people/company retrieval capability, and which ideas should Curiosity
adopt, adapt, reject, or defer without copying proprietary implementation or
confusing approximate entity retrieval with verified evidence?

### Bounded sub-questions

1. What are the exact request and response schemas, validation bounds, lifecycle,
   and cost envelope?
2. What does the public surface establish about entity identity, resolution,
   ambiguity, canonicalization, and deduplication?
3. Which filters, ranking signals, provenance, confidence, and freshness controls
   are observable—and which are absent?
4. Who appears to own the index and data pipeline, and what architecture can be
   inferred without reverse engineering private internals?
5. What failure, privacy, safety, retention, legal, and operational constraints
   matter for a Curiosity adapter or owned implementation?
6. Which clean-room lessons transfer, and what must be checked separately before
   any integration?

### Evidence labels

- **FACT** — stated by a cited first-party source or directly present in the
  public OpenAPI.
- **INFERENCE** — a bounded architecture interpretation of documented behavior,
  not an assertion about undisclosed internals.
- **RECOMMENDATION** — a Curiosity design or governance conclusion.
- **UNKNOWN / NEGATIVE RESULT** — not established in the public sources reviewed.
- Confidence is **high**, **medium**, or **low**.

Vendor pages establish advertised contracts and policies, not independent
quality, completeness, legality, or performance. Point-in-time prices and beta
contracts can change.

## 2. Executive verdict

**FACT (high):** Entity Search is a beta, synchronous `POST` endpoint for only
`people` and `companies`. It accepts a natural-language objective and a result
cap, then returns in one response a request-level `entity_set_id` and an ordered
array of `{name, url, description}` objects. The array is approximately ranked,
not candidate-by-candidate verified. There is no pagination, custom condition,
enrichment, citation, evidence, confidence, score, or freshness field. [S1][S2]

**Core interpretation (high):** this is **entity candidate retrieval**, not an
entity knowledge graph contract and not a verified list builder. It is useful as
a low-latency seed generator when downstream review is mandatory. It cannot, from
its response alone, prove that two records are the same real-world person or
company, explain why a record matched, support a factual description, establish
when the source was observed, or make a list exhaustive.

**Identity verdict (high):** despite the `EntityItem` name, no stable entity ID is
returned. `entity_set_id` identifies the request/set, while `url` is merely
described as the entity's canonical URL. A URL can be a useful provider-selected
identity hint, but the contract publishes no namespace, stability, merge/split,
alias, redirect, or source-origin semantics. [S2]

**Architecture verdict (medium):** Parallel demonstrably owns and operates a
proprietary web crawl/index substrate, and FindAll—the product family to which
Entity Search belongs—says candidate generation searches that proprietary web
index. Entity Search's fixed company/person projection, “standard attributes,”
and 1–3 second response target are consistent with a dedicated entity retrieval
or projection layer over indexed web data. Public sources do **not** prove the
physical index, entity-linking algorithm, third-party feeds, update path, or that
every Entity Search record comes only from Parallel's crawler. [S3–S8]

**Curiosity verdict:**

- **ADOPT:** explicit entity kind, synchronous candidate-search boundary, hard
  result-count cap, opaque provider request ID, and preservation of returned
  order without inventing scores.
- **ADAPT:** replace natural-language-only filtering with a provider-neutral
  query AST plus optional semantic objective; add stable/versioned identity,
  aliases, match reasons, evidence, retrieval time, freshness, ambiguity, and
  duplicate-cluster metadata.
- **REJECT:** treating `url` as sufficient identity, `description` as verified
  fact, rank as confidence, “real-time” as a freshness guarantee, or the response
  as exhaustive/safe for decisions about people.
- **DEFER:** provider integration, quality/identity benchmark, and people-search
  processing until retention/deletion, indexed-person privacy, terms, and
  authorized fixtures are reviewed.

## 3. Product boundary and contract

### 3.1 Endpoint, transport, and beta status

**FACT (high):** [S1][S2]

| Property | Public contract |
| --- | --- |
| Endpoint | `POST https://api.parallel.ai/v1beta/findall/entity-search` |
| Authentication | `x-api-key` header via global `ApiKeyAuth` |
| Request media type | `application/json` |
| Execution | synchronous; product pages advertise seconds / 1–3 seconds |
| Product state | public beta, within Parallel FindAll |
| Change notice | docs say 30 days before breaking request/response changes |
| Success | HTTP 200 with `FindAllEntitySearchResponse` |
| Endpoint-declared error | HTTP 422 with validation detail |

The endpoint path and SDK placement under `beta.findall` are product-family
namespacing, not evidence that Entity Search executes a full asynchronous FindAll
run. The docs explicitly contrast the two. [S1][S2]

### 3.2 Request schema

```json
{
  "entity_type": "companies",
  "objective": "AI startups that raised Series A in 2024",
  "match_limit": 100
}
```

| Field | Required | Documented validation | Semantics |
| --- | ---: | --- | --- |
| `entity_type` | Yes | string enum: `people`, `companies` | real-world entity kind |
| `objective` | Yes | string; no public min/max length or format | natural-language target description |
| `match_limit` | No | integer, minimum 5, maximum 1,000; default 100 | maximum entities; fewer may return |

**FACT (high):** there are no request fields for structured filters, sort,
location, language, date, source/domain policy, exclusions, known IDs, aliases,
freshness, pagination, cursor, timeout, score threshold, duplicate policy, or
requested attributes. [S1][S2]

**NEGATIVE RESULT (high):** the OpenAPI does not state whether an empty/blank
objective is accepted, how long an objective may be, whether unknown JSON keys
are rejected, or whether duplicate keys and Unicode normalization receive
special handling. The schema does not declare `additionalProperties: false`.
These are contract-test questions, not permission to send unbounded input. [S2]

**RECOMMENDATION (high):** Curiosity should impose a local nonblank objective
limit, normalize only for validation/audit while retaining exact caller input,
reject unknown core fields, and model structured conditions separately from the
semantic objective. Provider-specific natural-language interpretation must not
be the sole authorization or filtering layer.

### 3.3 Response schema

```json
{
  "entity_set_id": "entity_set_cad0a6d2dec046bd95ae900527d880e7",
  "entities": [
    {
      "name": "Figure AI",
      "url": "https://www.figure.ai",
      "description": "AI robotics company building general purpose humanoid robots"
    }
  ]
}
```

**FACT (high):** all fields shown above are required by OpenAPI. `entities` is a
“ranked list”; `EntityItem.url` is documented as the “Canonical URL for the
entity.” No fields are nullable in the published schema. [S2]

**Important absences:**

- no stable per-entity ID or entity-type echo;
- no relevance/match score, rank number, threshold, or match explanation;
- no matched-condition breakdown or verification status;
- no source URL list, citation, passage, evidence, or confidence;
- no observed/published/fetched/indexed time or graph/index version;
- no aliases, external IDs, locations, roles, employer, funding, or other typed
  attributes—even when such properties occur in the objective;
- no duplicate cluster, same-as links, ambiguity candidates, or disambiguator;
- no warnings, query rewrite, coverage notice, usage/cost, or continuation token.
  [S1][S2]

**INFERENCE (high):** `description` is a compact provider-produced entity
projection. The public contract does not say whether it is extracted verbatim,
synthesized, cached, or generated at query time. It must be treated as an
unverified assertion, not evidence.

**RECOMMENDATION (high):** retain the exact provider response and order; namespace
`entity_set_id` as a provider request/set identifier; validate URLs defensively;
and never manufacture a numeric score, stable entity ID, citation, or confidence
from rank position.

### 3.4 One-shot result set, not enumeration

**FACT (high):** there is no pagination. One request yields at most
`match_limit`; Parallel recommends setting 1,000 to retrieve “as many results as
possible.” It also says the API may return fewer. [S1]

**INFERENCE (high):** “as many as possible” is not “all.” There is no cursor,
snapshot, total hit count, stable rank boundary, or partition contract. Reissuing
objectives or inventing geography/date partitions can overlap or miss entities
and can change as ranking/index state changes.

**RECOMMENDATION (high):** Curiosity should call this capability
`entity_candidate_search`, not `find_all` or `enumerate_entities`, and report
`is_exhaustive: false` / `continuation: unavailable` at the provider-neutral
boundary.

## 4. Query semantics, filters, and ranking

### 4.1 Natural-language predicate collapse

**FACT (high):** the entire target definition—other than coarse entity type—is
collapsed into `objective`. Parallel describes Entity Search as suitable for
standard attributes such as sector, funding stage, and geography, but exposes no
typed versions of those fields. Custom match conditions exist only in FindAll,
not Entity Search. [S1][S3]

Consequences:

1. **No syntax contract.** There is no documented Boolean, range, negation,
   geospatial, temporal, relationship, or null/missing-value grammar.
2. **No predicate audit.** The response does not identify which phrases were
   interpreted as filters versus ranking preferences.
3. **No hard/soft distinction.** A requirement such as “raised in 2024” may
   influence rank without being satisfied.
4. **No condition-level failure.** A caller cannot tell whether a company failed
   sector, geography, funding, or another part of a compound objective.

**RECOMMENDATION (high):** an agent may propose a semantic objective, but policy
and deterministic constraints must remain caller-visible, typed, and separately
enforced. If an adapter must flatten them into prose, record the lossy rewrite
and downgrade the result to approximate candidates.

### 4.2 Recall-first approximate ranking

**FACT (high):** Parallel says Entity Search prioritizes recall and speed, and
that results are “ranked approximately rather than verified.” For narrow,
heavily qualified objectives, it may continue returning up to the requested
limit even when few entities satisfy the objective, so relevance declines toward
the end. Parallel recommends over-requesting and filtering/reviewing downstream.
[S1]

**INFERENCE (high):** `match_limit` is a truncation control, not a minimum quality
threshold. Increasing it can increase recall and cost, but explicitly increases
the opportunity for false positives in the tail. Rank is a retrieval ordering,
not a calibrated probability that all objective clauses hold.

**FACT / MARKETING TENSION (medium):** the launch article headings say “optimized
for precision” and describes a vendor benchmark of 250 difficult company queries,
top 10 results, and GPT-5.4-mini relevance judging. Current product docs instead
position Entity Search as recall/speed optimized and warn of unverified results.
These can coexist—a system can benchmark precision while selecting a recall-heavy
operating point—but the operational docs should govern integration behavior. The
benchmark is vendor-designed, company-only, LLM-judged, and was not reproduced.
[S1][S3]

**UNKNOWN:** candidate-generation depth, objective parsing, lexical/dense/graph
signals, field weights, reranking stages, score calibration, diversity handling,
tie-breaking, personalization, query history, and deterministic behavior.

### 4.3 No caller-visible filtering or ranking policy

**NEGATIVE RESULT (high):** Entity Search exposes none of Search API's source or
freshness controls and none of FindAll's explicit conditions or exclusions. The
reviewed contract has no allow/deny domains, jurisdiction filter, safe-search
mode, employer exclusion, known-entity exclusion, or sort selector. [S1][S2]

**RECOMMENDATION (high):** perform authorization-sensitive exclusions before
display/action where possible and deterministic post-filtering afterward. Never
assume a natural-language “exclude” phrase is a hard policy control.

## 5. Identity resolution, ambiguity, and deduplication

### 5.1 What “entity” guarantees—and does not

**FACT (high):** Parallel defines an Entity Search entity as a real-world company
or person and returns `name`, “canonical” `url`, and `description`. [S1][S9]

**INFERENCE (medium):** producing that projection probably requires some internal
page-to-entity selection or entity linking. It does **not** prove a persistent
knowledge-graph node, globally stable identity, or exposed resolution confidence.

The contract cannot answer:

- whether `Acme` and `Acme, Inc.` are aliases of one company;
- whether a parent and subsidiary are one record or two;
- whether an acquired/renamed company keeps its identity;
- whether a person changing employers keeps the same URL/record;
- which of two people with the same name was selected;
- whether a company website, professional profile, social account, directory
  page, or other page becomes the canonical URL;
- whether URL canonicalization follows redirects, publisher markup, an internal
  identity rule, or query-dependent selection.

### 5.2 `entity_set_id` is not an entity ID

**FACT (high):** OpenAPI calls `entity_set_id` the “Entity set request ID” and
shows it at response top level, not on each entity. [S2]

**RECOMMENDATION (high):** do not key a CRM/person/company table by
`entity_set_id`, entity rank, name, or raw URL alone. Curiosity needs its own
versioned entity identity with source assertions, alias history, and reversible
merge/split events. A provider URL should enter as one namespaced identity claim.

### 5.3 Duplicate and ambiguity behavior is undocumented

**UNKNOWN / NEGATIVE RESULT (high):** no reviewed Entity Search source promises:

- within-response deduplication;
- cross-query identity stability;
- canonical URL uniqueness;
- near-duplicate organization consolidation;
- homonym/person disambiguation;
- alias, DBA, subsidiary, franchise, branch, or parent handling;
- retired/dead/merged entity treatment;
- duplicate suppression against caller-owned records.

FindAll has an `exclude_list`, but importing that separate product behavior into
Entity Search would be incorrect. Entity Search has no exclusion input. [S1][S2]

**RECOMMENDATION (high):** retain all candidates first, then resolve with explicit
evidence. Use normalized URL/domain, legal/brand names, external IDs, location,
employment/time, and source passages as signals—not irreversible keys. Return
ambiguity sets when evidence is insufficient; do not silently merge people.

## 6. Provenance, confidence, and freshness

### 6.1 Provenance is absent

**FACT (high):** Entity Search explicitly provides no citations, while FindAll
can return per-field basis/citations. The Entity Search response has no source
field beyond the provider-designated entity URL. [S1]

**INFERENCE (high):** an entity URL is a destination or identity hint, not
provenance for every phrase in `description` and not evidence that every
objective condition is satisfied. The response cannot distinguish observed,
inferred, synthesized, or stale attributes.

**RECOMMENDATION (high):** downstream agents may use Entity Search only to seed
separate evidence acquisition. Before asserting a match, store claim-level
support with source/capture ID, passage, fetch time, publication/valid time where
available, extractor version, and observed-versus-inferred status.

### 6.2 No confidence or score

**FACT (high):** ranking order is returned without a score, confidence,
verification status, or explanation. [S1][S2]

**RECOMMENDATION (high):** preserve ordinal position and label it
`provider_rank`; do not derive `1/rank`, percentage confidence, or pass/fail.
Any downstream confidence must identify its independent evidence and calibration.

### 6.3 “Real-time” describes interaction latency, not proven data age

**FACT (high):** Parallel calls the product “real-time,” “fast,” and synchronous,
with results in seconds / a published 1–3 second latency range. Entity Search has
no request freshness control and returns no fetch, crawl, publication, update, or
index timestamp. [S1][S3][S10]

**INFERENCE (high):** in the Entity Search materials, “real-time” is supported as
a response-latency claim. It is **not** a documented guarantee of live crawling,
current-day data, or maximum record age. Task's current-day/live-link statements
and Search's fetch policy belong to other APIs and must not be imported here.

**UNKNOWN:** index refresh cadence, company/person attribute age, live-fetch use,
deletion propagation, stale URL handling, time-zone/date interpretation, and
whether ranking prefers recently observed entities.

**RECOMMENDATION (high):** mark every Entity Search candidate's freshness
`unknown`; require a separate bounded retrieval/verification step for temporal
criteria; and expose stale/unknown as a result state rather than silently
accepting the description.

## 7. Index and data ownership

### 7.1 Established ownership facts

First-party sources triangulate a substantial Parallel-operated substrate:

1. Parallel says every layer—crawl, index, query processing, and ranking—was
   built for AI and that Search is built on its proprietary index. [S7]
2. `ShapBot` collects public web content to build and maintain Parallel's search
   index; Parallel publishes its user agent and IP list. [S5][S6]
3. Parallel's glossary says its indexer covers 30+ countries and specialized
   coding, company, and finance verticals. [S9]
4. FindAll says candidate generation searches Parallel's proprietary web index;
   Entity Search is documented as part of FindAll and its real-time counterpart.
   [S1][S4]

**VERDICT — FACT (high):** Parallel owns and operates a proprietary crawler/index
used by its product family.

**VERDICT — INFERENCE (medium):** Entity Search likely consumes Parallel-owned
indexed and entity-oriented representations rather than simply relaying a live
third-party SERP. The family relationship, fixed company/person schema, company
specialization, and latency target support this interpretation, but no source
explicitly describes Entity Search's physical data path.

### 7.2 Ownership and coverage limits

**UNKNOWN / NEGATIVE RESULT:** public sources reviewed do not disclose:

- Entity Search corpus size, company/person counts, country/language coverage, or
  recall distribution;
- whether all records originate in ShapBot crawl data;
- third-party/licensed feeds, public registries, partnerships, or model-generated
  attributes used by Entity Search;
- crawl-to-entity indexing delay, recrawl policy, deletion/suppression SLA, or
  source-level licensing;
- index snapshot/version, historical access, content hashes, or entity graph
  version;
- training data, models, storage engine, vector/lexical indexes, or ranking
  weights.

Parallel's Customer Terms define underlying datasets as Parallel IP. This states
contractual control, not that Parallel owns the copyright or unrestricted rights
to every underlying public-web fact/page. [S11]

**RECOMMENDATION (high):** “owned provider index” must not become “owned by
Curiosity,” “only first-party crawled,” or “licensed for every reuse.” Provider
API rights, underlying source rights, personal-data duties, and Curiosity's own
evidence retention each require separate review.

## 8. Bounded architecture inference

The smallest functional decomposition consistent with public behavior is:

```text
public web
  -> ShapBot crawl / possible other undisclosed sources
  -> page processing + proprietary web index
  -> company/person extraction or entity projection       [inferred]
  -> alias/canonical-URL/entity resolution                 [inferred]
  -> entity-oriented candidate index                       [inferred]

request(entity_type, objective, match_limit)
  -> validate coarse type and bounds
  -> interpret semantic objective                          [inferred]
  -> retrieve candidates of requested type                 [inferred]
  -> approximate ranking for recall/latency                [documented outcome]
  -> select up to match_limit
  -> project fixed {name, url, description}
  -> entity_set_id + ordered entities
```

**Confidence:** high for the public-web/index, request-validation, ordered-output,
and approximate-ranking boundaries; medium for an entity-oriented projection;
low for any specific entity-resolution, embedding, graph, storage, or model
implementation.

Why a specialized projection is plausible:

- only two entity classes are accepted, unlike FindAll's broader entity types;
- only three fixed fields return;
- marketing says “standard attributes” can influence company/person matching even
  though those attributes are not returned;
- company/finance specialized indexing is publicly acknowledged;
- the service targets one synchronous 1–3 second round trip. [S1][S3][S9][S10]

Alternative explanations remain possible: query-time extraction, a shared
specialized Search index, licensed entity data, or a hybrid. Public evidence does
not select among them.

**Clean-room boundary:** this dossier describes observable contracts and generic
functional seams. It does not derive algorithms, inspect SDKs, probe outputs,
reconstruct schemas from traffic, or reproduce proprietary datasets/ranking.

## 9. Bounds, errors, pricing, and operations

### 9.1 Hard and missing bounds

| Dimension | Documented bound | Missing/unsafe assumption |
| --- | --- | --- |
| Entity types | exactly `people` or `companies` | no custom type/ontology |
| Results | requested 5–1,000; default 100; may return fewer | no minimum returned, total hits, or completeness |
| Pagination | none | cannot continue or snapshot |
| Objective | required string | no length/nonblank bound published |
| Output size | at most 1,000 objects | no name/URL/description byte or character cap |
| Latency | advertised 1–3 seconds | no endpoint deadline/SLO/p95/p99 or partial-result contract |
| Rate | 600 POSTs/minute default [S18] | burst/concurrency/header semantics unpublished |
| Cost | deterministic formula by request/results above default | failed/fewer-returned billing detail unpublished |

**RECOMMENDATION (high):** use stricter local request/response byte limits,
deadline, concurrency, and spend admission; truncate only at safe field
boundaries while preserving the raw provider artifact where policy permits; and
treat over-limit responses as provider-contract errors.

### 9.2 Errors and retries

**FACT (high):** endpoint OpenAPI explicitly lists 200 and 422. The 422 schema is
an array of `{loc, msg, type}` validation errors. Parallel's shared error page
(whose prose is Task-oriented) also documents 401, 402, 403, 404, 408, 422, 429,
500, 502, and 503, with retries recommended for 408/429/5xx and not for the
listed authentication, payment, permission, not-found, or validation failures.
Its canonical error envelope is `{"error":{"message", "detail"}}`. [S2][S12]

**CONTRACT DISCREPANCY (medium):** the endpoint-specific 422 schema is a bare
`detail` validation object, while the general error page says all errors use the
nested `error` envelope. This was not tested. Clients should parse defensively
without discarding the HTTP status or raw body.

**UNKNOWN:** idempotency semantics, request timeout behavior, retry headers,
whether a timed-out synchronous request remains billable, duplicate charging on
retries, partial responses, malformed upstream records, and whether an
`entity_set_id` can later be retrieved.

**RECOMMENDATION (high):** assign a Curiosity operation ID and bounded retry
budget. Retry only transient classes with jitter and local spend accounting. Do
not assume POST replay is free or idempotent merely because search is read-like.

### 9.3 Point-in-time price envelope

**FACT (high, 2026-08-17):** Entity Search costs $5 per 1,000 requests including
100 results by default, plus $0.05 per 1,000 additional results. Parallel gives:

```text
request cost = $0.005 + ($0.00005 × additional results)
```

Thus a default/up-to-100 request is $0.005; requesting 1,000 implies 900
additional result units and a nominal maximum documented request cost of
`$0.005 + 900×$0.00005 = $0.05`. [S10]

**UNKNOWN:** whether “additional results” means requested or actually returned;
how requests below 100 are billed; whether failures/timeouts are charged; and
whether beta, enterprise, marketplace, free-credit, or negotiated terms differ.

Parallel's monthly organization/app spend limits are notify-only and never block
requests. [S13] Therefore they are not a hard denial-of-wallet control.

**RECOMMENDATION (high):** snapshot prices operationally, estimate worst case
from requested limit, reserve locally before submission, and enforce a hard
Curiosity budget below vendor limits. Do not encode point-in-time price in the
provider-neutral contract.

### 9.4 Service and version risk

**FACT (high):** the beta notice promises 30 days before breaking request/response
changes. Customer Terms otherwise allow service changes so long as they do not
materially limit/adversely affect contracted services, and offer only
commercially reasonable 24×7 availability—not an endpoint SLO. The public status
page reports operational state/history but does not establish an Entity Search
SLA. [S1][S11][S14]

**RECOMMENDATION (high):** pin adapter contract fixtures, monitor schema drift,
preserve unknown fields, and fail closed on incompatible semantic changes.

## 10. Privacy, safety, retention, and legal boundaries

### 10.1 People search is a personal-data system

**FACT (high):** results draw on the public web and cover companies and people in
a **professional context**. Parallel explicitly says the product is not for
consumer profiling and not for employment, credit, or housing decisions. [S1]

**FACT / SCOPE TENSION (medium):** the same docs describe hiring interfaces and
the launch article mentions recruiting workflows, while barring employment
decisions. A defensible product reading is that candidate discovery/sourcing with
human review is distinguished from making employment decisions; the boundary is
not technically enforced by any request field. [S1][S3]

**RECOMMENDATION (high):** Curiosity should default-disable people search. If
separately approved, require purpose declaration, professional-context scope,
role-based access, minimal fields, human review, audit, suppression/deletion
propagation, and an explicit prohibition on employment/credit/housing decisioning
and consumer profiling. “Public” is not synonymous with unrestricted processing.

### 10.2 Indexed-person transparency is incomplete

**FACT (high):** Parallel's general Privacy Policy describes personal data from
service/site users, retention based on operational need, security measures, US
processing, European rights, and business-customer processor arrangements. Its
enumerated data sources are users and vendors. It does not separately describe
Entity Search's indexed professional people, categories, crawl-derived profiles,
resolution, data-subject suppression, or index-deletion SLA. [S15]

**UNKNOWN / NEGATIVE RESULT (high):** no reviewed first-party page specified an
Entity Search person-record access/correction/deletion workflow, retention period,
legal basis by jurisdiction, minors policy for indexed web subjects, sensitive
attribute exclusion, or source-level suppression propagation.

This is an evidence gap, not proof that controls do not exist.

**RECOMMENDATION (high):** indexed-person governance is a blocking procurement
question. Obtain the applicable DPA/terms and written answers on controller/
processor roles, lawful purpose, data-subject channels, deletion/suppression,
retention, regions, subprocessors, sensitive traits, minors, and logs before any
people-search use.

### 10.3 Customer query/output data

**FACT (high):** Parallel says TLS 1.2+ in transit, encryption at rest in US data
centers, SOC 2 Type I/II, and enterprise ZDR/DPA options. The specific EU
no-retention statement in the Privacy Policy is for the **Search API** EU
endpoint, not Entity Search. ZDR scope for Entity Search is not publicly
specified. Organization members can view runs from their own active keys and
admins can view runs across the organization. [S13][S15][S16][S17]

**MATERIAL CONTRADICTION (high):** FAQ says Parallel will “Never” train models on
customer data, but current Customer Terms grant a perpetual improvement license
and expressly say Parallel may use Customer IP—including queries and outputs—to
train/improve ML and AI models, de-linked from individuals during training.
[S11][S13]

**RECOMMENDATION (high):** do not send private person identifiers, confidential
target lists, or sensitive objectives under self-serve assumptions. Resolve
training, retention, deletion, ZDR product coverage, run-history visibility, and
regional processing in signed terms.

### 10.4 Output and decision safety

Risks are amplified by the product's contract:

- false positive people/companies because matching is explicitly approximate;
- homonym or stale-employer misidentification without disambiguation evidence;
- sensitive or defamatory inference compressed into an uncited description;
- discriminatory targeting via natural-language proxies;
- automated adverse action from an unverified rank;
- prompt/query injection if objectives are composed from untrusted text;
- malicious or unexpected URLs delivered to downstream fetchers;
- denial of wallet through 1,000-result/high-rate agent loops.

**FACT (high):** Customer Terms say AI outputs are not tested, verified, endorsed,
or guaranteed accurate, complete, or current and require independent review. They
prohibit automated significant adverse-impact decisions without human oversight
in employment, healthcare, finance, legal, housing, insurance, and benefits. [S11]

The Entity Search product restriction is stricter for employment, credit, and
housing decisions and should govern this capability. [S1]

**RECOMMENDATION (high):** search results remain untrusted external data. Render
descriptions inertly; validate URL scheme/DNS/redirect policy before any fetch;
separate discovery from action; and require independent evidence plus accountable
human judgment for consequential workflows.

### 10.5 Rights and clean-room constraints

**FACT (high):** Customer Terms restrict reverse engineering, probing/model
extraction, competitive use, scraping outside the APIs, building/reselling data
products, using outputs to create synthetic model-training data, cross-customer
output reuse, and publishing benchmarks without consent. Customer Output may be
incorporated into customer applications subject to per-end-customer and
anti-database/resale conditions. [S11]

**RECOMMENDATION (high):** a paid API response would not grant Curiosity ownership
of Parallel's index or blanket rights in underlying web content/person data. Any
adapter must review intended caching, multi-tenant reuse, output retention,
training, and database-building against negotiated terms. This report is not
legal advice.

## 11. Clean-room lessons for Curiosity

### 11.1 Provider-neutral contract shape

Entity candidate search should be distinct from page search and verified entity
research:

```text
EntityCandidateQuery
  entity_kinds: bounded enum
  semantic_objective?: string
  predicates?: typed boolean/range/time/location/relationship AST
  exclusions?: stable IDs + namespaced external identity claims
  limit: hard bounded integer
  deadline, max_response_bytes, max_cost
  freshness_requirement
  source_policy
  ambiguity_policy, duplicate_policy

EntityCandidateResult
  operation_id, provider_request_id
  candidates[]:
    curiosity_entity_id?          # only after Curiosity resolution
    provider_identity_claims[]
    name, aliases, entity_kind
    provider_rank, provider_score?
    description_claim?
    matched_predicates[] / unknown_predicates[]
    evidence_refs[]
    observed_at, valid_at?, index_snapshot?
    ambiguity_set?, duplicate_cluster?
  warnings, usage, completeness="non_exhaustive"
```

An adapter may degrade a typed query into Parallel's objective, but must expose
that predicates became soft/approximate and that provenance/freshness are absent.

### 11.2 Adopt / adapt / reject / defer ledger

| Lesson | Verdict | Confidence / rationale |
| --- | --- | --- |
| Separate entity candidates from webpage results | **ADOPTED** | High; observable product boundary |
| Explicit coarse entity kind | **ADOPTED** | High; retain provider-neutral extensible enum |
| Synchronous bounded candidate set | **ADOPTED** | High; useful for interactive seed generation |
| Hard result cap | **ADOPTED** | High; Curiosity should choose a lower default/max |
| Preserve request/set ID and returned order | **ADOPTED** | High; namespace ID; never create scores |
| Natural-language objective | **ADAPTED** | High; optional semantic layer, never sole policy/filter contract |
| One-shot nonpaginated set | **ADAPTED** | High; explicitly mark non-exhaustive/no continuation |
| Fixed compact candidate projection | **ADAPTED** | High; useful hot path, but add identity/evidence metadata |
| Provider-selected canonical URL | **ADAPTED** | High; identity claim only, not primary key or provenance |
| Approximate recall-first ranking | **ADAPTED** | High; candidate generation only; verify downstream |
| `description` as a fact or evidence | **REJECTED** | High; no citation, time, or derivation |
| Rank as match confidence | **REJECTED** | High; no score/calibration contract |
| `entity_set_id` as stable entity identity | **REJECTED** | High; explicitly request/set scoped |
| “Real-time” as freshness | **REJECTED** | High; only interaction latency is supported |
| Provider response as exhaustive entity dataset | **REJECTED** | High; no pagination/total/snapshot and explicit approximation |
| Entity Search for consequential people decisions | **REJECTED** | High; product restriction and evidence deficits |
| Parallel as Curiosity-owned entity/index foundation | **REJECTED** | High; provider controls corpus, ranker, identity, terms, retention |
| Beta provider adapter | **DEFERRED** | High; drift, data governance, and contract checks unresolved |
| Live quality/identity/freshness benchmark | **DEFERRED** | High; needs consent, credentials, fixtures, budget, and legal/privacy review |

## 12. Unknowns and checks before any integration

### 12.1 Written provider/procurement checks

1. Is `entity_set_id` retained or retrievable, for how long, and can it be
   deleted? Does it identify a deterministic snapshot or only a request log?
2. What are request/output retention, logs, deletion, training, ZDR, and regional
   processing rules specifically for Entity Search?
3. What sources feed company/person records, and which are crawled, licensed,
   partnered, or generated? What rights flow to customers?
4. What is the indexed-person access/correction/deletion/suppression process and
   propagation SLA? How are minors and sensitive traits handled?
5. What does “canonical URL” mean for people and companies? Is it stable and
   unique? How are mergers, renames, subsidiaries, aliases, branches, and
   homonyms represented?
6. Are repeated/duplicate entities suppressed within a response and across runs?
7. What freshness/update policy applies? Does Entity Search ever live-fetch?
8. Are additional-result charges based on requested or returned count? Are
   validation errors, timeouts, 5xx responses, and client retries charged?
9. What are objective and response-field length limits, service timeouts,
   concurrency/burst limits, and availability/latency SLOs?
10. Which product restrictions govern recruiting sourcing versus employment
    decisioning, and how must downstream customers communicate them?

### 12.2 Contract tests requiring separate authorization

- empty/blank/very long/Unicode objective and unknown-property handling;
- exact 401/402/408/422/429/5xx envelopes and retry headers;
- returned count and charge at limits 5, 99, 100, 101, and 1,000;
- response byte/field lengths and malformed/unsafe URL handling;
- timeout, client disconnect, replay, and duplicate-charge behavior;
- schema drift/additive fields and beta notice channel.

### 12.3 Quality, identity, and safety evaluation requiring separate authority

- stratified company/person precision and recall with rights-approved ground
  truth—not the vendor's benchmark alone;
- rank-tail degradation as `match_limit` increases;
- compound predicate satisfaction and temporal interpretation;
- homonyms, aliases, name changes, mergers, subsidiaries, branches, franchises,
  redirects, and dead domains;
- within/cross-query duplicate rate and identity stability;
- source support, description entailment, freshness, and deletion propagation;
- demographic/geographic coverage and disparate error rates;
- professional-context, sensitive-trait, minor, and decision-use safeguards;
- adversarial objective injection and unsafe URL delivery.

None were executed because credentials, paid/free service calls, output
collection, benchmark publication, and personal-data testing were outside the
declared authority.

## 13. Bounded curiosity pass

After synthesis, gaps were scored 1–5 for relevance (R), decision value (V),
novelty (N), and investigation cost (C; lower is better).

| Thread | R | V | N | C | Action |
| --- | ---: | ---: | ---: | ---: | --- |
| Stable entity identity vs request-set ID | 5 | 5 | 4 | 1 | **Pursued:** OpenAPI field placement/descriptions and product docs establish absence of per-entity ID |
| Freshness meaning of “real-time” | 5 | 5 | 4 | 1 | **Pursued:** Entity pages, pricing, and other-product boundaries compared; only latency supported |
| Entity index ownership | 5 | 5 | 4 | 2 | **Pursued:** FindAll pipeline, crawler, glossary, and infrastructure sources triangulated; physical Entity Search path remains inferred |
| Indexed-person privacy/deletion | 5 | 5 | 5 | 2 | **Pursued:** Entity scope, Privacy Policy, FAQ, roles, and terms compared; product-specific controls remain unknown/blocking |
| Recall docs vs precision launch claim | 4 | 4 | 4 | 1 | **Pursued:** framed as metric/operating-point tension, not an unsupported contradiction |
| Exact entity-linking/dedup algorithm | 3 | 3 | 5 | 5 | **CURIOSITY_NO_GO:** proprietary, prohibited to probe/reverse engineer, and unnecessary for contract verdict |
| Reproduce vendor precision benchmark | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** needs credentials, paid calls, benchmark consent, dataset, judge audit, and publication approval |
| Inspect SDK internals/network traffic | 1 | 2 | 2 | 4 | **CURIOSITY_NO_GO:** public OpenAPI is sufficient and clean-room/access boundaries prohibit expansion |
| Build a corpus of returned people | 5 | 3 | 4 | 5 | **CURIOSITY_NO_GO:** personal-data collection and live calls lack purpose, privacy review, retention plan, and authority |
| Jurisdiction-by-jurisdiction legality | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** requires counsel and exact use/corpus facts; engineering gates are recorded instead |
| Infer hidden third-party feeds from result URLs | 3 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** requires prohibited black-box output collection and would not prove contractual data rights |

**Stop reason: coverage and saturation.** Public sources answer the observable
schema, ranking posture, index-control evidence, bounds, price, and stated-use
policy. Material remaining questions require provider confirmation, contractual
materials, counsel, or separately authorized live evaluation.

## 14. Primary-source ledger

All sources were accessed **2026-08-17**.

- **[S1]** Parallel, “Entity Search” —
  https://docs.parallel.ai/findall-api/entity-search
- **[S2]** Parallel, “Fast Entity Search” OpenAPI reference (`public-openapi.json`
  operation `POST /v1beta/findall/entity-search`, API version shown as 0.1.2) —
  https://docs.parallel.ai/api-reference/findall/fast-entity-search
- **[S3]** Parallel, “Introducing real-time Entity Search,” 2026-06-05 —
  https://parallel.ai/blog/entity-search-company
- **[S4]** Parallel, “Introducing Parallel FindAll,” 2025-11-18 —
  https://parallel.ai/blog/introducing-findall-api
- **[S5]** Parallel, “Crawler” —
  https://docs.parallel.ai/resources/crawler
- **[S6]** Parallel, “Overview of Parallel Web Systems' Bots” —
  https://parallel.ai/parallel-web-systems-bots
- **[S7]** Parallel, “Introducing Parallel: Web Search Infrastructure for AIs,”
  2025-08-14 — https://parallel.ai/blog/introducing-parallel
- **[S8]** Parallel, “Parallel API Changelog” —
  https://docs.parallel.ai/resources/changelog
- **[S9]** Parallel, “Parallel API Glossary” —
  https://docs.parallel.ai/getting-started/glossary
- **[S10]** Parallel, “Parallel API Pricing” —
  https://docs.parallel.ai/getting-started/pricing
- **[S11]** Parallel Web Systems Inc., “Customer Terms and Conditions” —
  https://parallel.ai/customer-terms
- **[S12]** Parallel, “API Error Codes and Warnings” —
  https://docs.parallel.ai/resources/warnings-and-errors
- **[S13]** Parallel, “Parallel API FAQs” —
  https://docs.parallel.ai/resources/faqs
- **[S14]** Parallel, “Status Page” —
  https://status.parallel.ai/
- **[S15]** Parallel, “Privacy Policy” —
  https://parallel.ai/privacy-policy
- **[S16]** Parallel, “Organization roles and permissions” —
  https://docs.parallel.ai/resources/organization-roles-and-permissions
- **[S17]** Parallel, public pricing page —
  https://parallel.ai/pricing
- **[S18]** Parallel, “API Rate Limits” —
  https://docs.parallel.ai/getting-started/rate-limits

## 15. Confidence and negative-results summary

| Area | Confidence | Basis / limit |
| --- | --- | --- |
| Request/response schema and hard result bound | High | current endpoint OpenAPI plus product guide |
| Synchronous, beta, nonpaginated behavior | High | explicit product documentation |
| Approximate/unverified ranking posture | High | explicit guide warnings |
| No exposed provenance, score, freshness, or stable entity ID | High | schema-level absence and product comparison |
| Point-in-time price/rate limit | High | dedicated pricing and rate pages; billing edge cases unknown |
| Parallel ownership of a proprietary crawler/index | High | crawler, infrastructure, glossary, and FindAll sources agree |
| Entity Search's exact use of that index | Medium | strong family/behavior inference, no dedicated architecture disclosure |
| Internal identity resolution/dedup architecture | Low | only output projection supports inference; no algorithm disclosed |
| Privacy/legal suitability | Medium for stated policies; unknown for a use | public terms/policies are clear in parts, but indexed-person and negotiated terms are absent; counsel required |
| Quality, identity accuracy, freshness, and latency in practice | Unknown | no authorized independent calls or benchmark |

**Retained negative results:** no stable entity ID, identity namespace, aliases,
duplicate policy, ambiguity representation, scores, citations, source passages,
timestamps, freshness policy, query AST, hard filters, pagination, total count,
snapshot, exclusion list, output byte limits, idempotency, endpoint retention,
person-index deletion SLA, or product-specific ZDR scope was found in the reviewed
public Entity Search contract. Absence from public docs is not proof of absence in
private operations; it is sufficient reason not to rely on those properties.
