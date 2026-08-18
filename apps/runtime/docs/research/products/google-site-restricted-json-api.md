# Retired Google Custom Search Site Restricted JSON API

**Research date / primary-source access date:** 2026-08-17  
**Lifecycle studied:** public launch on 2018-07-16; closed to new customers on
2023-10-05; retirement announced on 2023-12-18; final traffic stop on
2025-01-08 [S1-S5].  
**Method and boundary:** clean-room reconstruction from public Google product
documentation, official product posts and feeds, archived Google pages, current
migration documentation, pricing, terms, and privacy policy. No account,
credential, request, billing action, endpoint probe, private response, ranking
reconstruction, or implementation was used. The only file produced is this
report.

## Decision frame

**Decision:** What should Curiosity learn from the complete lifecycle of a
high-volume, site-bounded hosted search API whose wire contract closely matched
a surviving sibling, but whose eligibility rule, quota model, and product
lifecycle did not?

Bounded sub-questions:

1. What exactly made an engine eligible, and what happened if configuration
   drifted out of eligibility?
2. What request, response, depth, safety, localization, and evidence contract
   did the endpoint publish?
3. What did “no daily query limit” mean—and not mean—for economics and capacity?
4. How did launch, new-customer closure, deadline revision, and shutdown unfold?
5. Was Vertex AI Search (now Agent Search) a compatible migration or a
   replatforming?
6. What privacy, retention, rights, and contractual boundaries constrained use?
7. Which ideas are **ADOPTED**, **ADAPTED**, **REJECTED**, or **DEFERRED** for
   Curiosity?

Labels used below:

- **FACT** — directly supported by a cited primary source or first-party archive.
- **INFERENCE** — a bounded conclusion from cited facts, not an observed runtime
  property.
- **RECOMMENDATION** — a proposed Curiosity design or operational choice.
- **UNKNOWN** — not established by the reviewed public sources.
- Confidence is **high**, **medium**, or **low** for the claim as written.

Vendor documentation establishes published behavior, not measured quality,
coverage, latency, reliability, or legal advice.

## Executive verdict

**REJECTED as a Curiosity dependency (high confidence).** The product is retired:
Google says its endpoints ceased serving traffic on **2025-01-08** [S3-S5]. Even
while available, it was a policy view over Google's index rather than an owned
corpus, returned at most the first 100 results, exposed no immutable capture or
rank provenance, and was governed by standard terms that prohibit using returned
content to build databases or permanent copies absent content-owner permission
or legal authorization [S6-S10]. Its distinctive capacity promise—no daily query
limit—did not create corpus ownership, an SLA, an unbounded result window, or
portable serving state.

**ADAPTED as a lifecycle and contract case (high confidence).** The useful lesson
is the explicit pairing of a narrow eligibility invariant with a separate,
high-volume endpoint. Curiosity should adapt this into capability-gated routes
whose eligibility is validated on immutable configuration versions, with
fail-closed errors rather than “unexpected results.” It should also retain the
good separation between engine configuration and query serving, explicit query
filters, query metadata, organic results versus promotions, and bounded page
sizes—but in an owned, provider-neutral evidence contract.

**The central lifecycle lesson:** near wire compatibility did not imply lifecycle
or migration compatibility. The site-restricted and general JSON operations
shared parameters and response type, yet Google closed the high-volume route
first and directed users to a differently priced Cloud product with new apps,
data stores, editions, indexing modes, methods, authentication choices, and
terms [S3, S11-S13]. An endpoint alias is not a portability strategy.

## 1. Product reconstruction

### 1.1 What was sold

**FACT (high):** Google announced Site Restricted JSON API on 2018-07-16 as a
fourth Custom Search Engine implementation option. It was similar to the general
JSON API, but removed the 10,000-query/day cap for engines searching ten sites
or fewer. The announcement contrasted it with the ad-supported Element, the
nonprofit Element, and the capped general JSON API [S1].

**FACT (high):** the dedicated product page imposed three simultaneous engine
conditions [S3]:

1. the Control Panel showed **10 or fewer sites to search**;
2. there were **no global top-level-domain patterns**; and
3. **Search the entire web** was OFF.

The documented route was:

```text
GET https://customsearch.googleapis.com/customsearch/v1/siterestrict
```

An older equivalent host appeared in the guide:

```text
GET https://www.googleapis.com/customsearch/v1/siterestrict
```

The endpoint used the same query parameters and `Search` response type as the
general Custom Search JSON API [S3, S6-S8].

**FACT (high):** PSE was built on the Google index. A page absent from Google's
index could not appear; sitemap submission could help discovery but was not
instantaneous, and PSE terms did not warrant inclusion of every configured
domain [S9, S15].

**INFERENCE (high):** “site restricted” described a serving/configuration policy,
not a tenant-owned index. The effective corpus was approximately:

```text
configured URL patterns
  intersect Google crawl/index/policy state
  filtered by query-time controls
  ranked by opaque Google relevance + owner configuration
```

It was not a complete manifest of the configured sites, a frozen snapshot, or a
coverage guarantee.

### 1.2 The eligibility invariant was mutable

**FACT (high):** Google warned that if an engine configuration changed so it no
longer met the site-restriction rules, the endpoint “may not return the expected
results” [S3]. The public page did not promise a stable machine-readable
eligibility error.

**INFERENCE (high):** billing/project eligibility and engine configuration were
separate state machines. A previously valid caller could be made semantically
invalid by a Control Panel change without changing its API key, route, or client
code. The documented consequence was ambiguous result behavior, not a declared
fail-closed contract.

**RECOMMENDATION (high):** Curiosity capability routes should bind to an immutable
configuration version and validate eligibility at activation and request time.
If a policy no longer satisfies a route invariant, return a typed
`configuration_ineligible` error with violated rule IDs; never silently broaden,
narrow, or alter retrieval.

### 1.3 What “10 sites” did not establish

**UNKNOWN:** the reviewed official page did not define how all Control Panel URL
patterns, subdomains, path patterns, excludes, or overlapping annotations were
counted toward the ten-site test beyond the displayed “Sites to Search” count
and ban on global TLD patterns [S3]. It also did not expose a request-time
eligibility object.

**INFERENCE (high):** a small number of configured sites can still represent a
very large, rapidly changing corpus. Domain count is not a proxy for pages,
bytes, crawl cost, freshness burden, policy complexity, or query load.

## 2. Historical wire contract

### 2.1 Transport, identity, and authentication

**FACT (high):** the method was a bodyless HTTP `GET`; successful responses used
the shared `Search` JSON type [S6]. General REST documentation—which the
site-restricted page incorporated for parameters—required `key`, `cx`, and `q`,
required URL encoding, and limited a request URL to 2,048 characters [S3, S8].

**FACT (medium):** authentication documentation drifted. The migration guide
states the retired product authenticated using an API key, and the usage guide
required `key`; the method reference also listed the OAuth scope
`https://www.googleapis.com/auth/cse`, while the discovery document treated a
key as unnecessary when OAuth was supplied [S6, S8, S11, S14]. No live test was
authorized, so universal OAuth acceptance for historical customers is
**UNKNOWN**.

**RECOMMENDATION (high):** authentication, project/billing identity, tenant,
corpus-policy identity, and end-user context must be separate fields. Never put
credentials in logs or canonical cache keys. A provider adapter may map legacy
wire details; provider key names must not enter Curiosity's public ABI.

### 2.2 Query controls

The operation published the same semantic control families as the general API
[S6]:

| Family | Historical controls | Clean-room implication |
| --- | --- | --- |
| Query | `q`, required/forbidden/exact/OR terms, appended AND terms, link target, numeric range | Preserve original, normalized, and derived queries with rule provenance. |
| Paging | `num` 1–10; one-based `start`; `start + num` no greater than 100 | Make depth and item/byte budgets explicit; use snapshot-bound cursors when the index is owned. |
| Corpus/type | per-request site include/exclude, file type, web or image | Request narrowing must not mutate the underlying corpus policy. |
| Time/order | relative date restriction and structured sort expression | Name the time clock and expose every value that materially filters/orders results. |
| Locale | interface language, document-language restriction, country boost, country restriction, Chinese variant expansion | Keep UI locale, language filter, geographic intent, and jurisdiction separate. |
| Quality/safety | duplicate filter and multi-site host crowding; SafeSearch on/off; asserted-license filter | Treat each as one policy signal, not proof of safety, uniqueness, or rights. |
| Image | size, type, color class, dominant color | Keep modality-specific fields in typed extensions. |

**FACT (high):** `gl` boosted results associated with a country, while `cr`
restricted them. Google inferred document country from URL TLD and server IP.
`hl` was an interface-language/quality hint, while `lr` restricted document
language [S6].

**INFERENCE (high):** these were search heuristics, not reliable declarations of
publisher nationality, legal jurisdiction, user consent, or content language.

**FACT (high):** SafeSearch accepted `active` and `off`, with `off` documented as
the method default. The 2026 discovery document also retains deprecated
`high`/`medium` aliases and says an unspecified value falls back to engine
configuration [S6, S14]. This is documentation drift, not evidence of a stable
historical default for every engine.

**RECOMMENDATION (high):** set security-sensitive policy explicitly and return
requested versus effective policy. Search result text, HTML fragments, PageMap,
URLs, promotions, and spelling suggestions are untrusted external data and
cannot grant tools, change policy, or authorize follow-up.

### 2.3 Response and evidence boundary

**FACT (high):** the shared response contained [S7, S8]:

- OpenSearch-shaped URL and query metadata, including current request and
  optional previous/next page;
- engine context and optional refinement facets;
- server search time and total-result strings;
- optional spelling correction;
- optional operator-configured promotions, separate from ordinary items; and
- result items with URL, title, snippets, optional cache ID, MIME/file format,
  PageMap structured metadata, labels, and image/thumbnail metadata.

**FACT (high):** only the first 100 results were reachable, ten per response at
most. Query `totalResults` was explicitly estimated and might be inaccurate
[S6-S8].

**FACT (high):** the documented result did **not** provide a relevance score,
rank explanation, crawl/fetch time, immutable document version, index snapshot,
canonicalization decision, content hash, snippet offsets, parser version,
publisher identity, duplicate cluster, policy decision, or rights verification
[S7].

**INFERENCE (high):** this was a discovery/display contract, not a reproducible
evidence contract. Echoed query metadata supported navigation but not replay:
the same request could address a changed Google index, engine configuration,
ranker, or safety policy.

**RECOMMENDATION (high):** a Curiosity result must identify an immutable capture
and anchored passage, preserve fetched/terminal/canonical URL lineage, carry
hashes and timestamps, identify corpus/index/ranker/safety versions, and return
bounded reason and coverage warnings. A mutable search snippet is not the final
citation artifact.

### 2.4 Error and operational contract

**FACT (high):** Google documented that new customers attempting requests from
2023-10-05 would receive HTTP 403 [S2, S4].

**UNKNOWN:** reviewed public product sources did not establish a complete
site-restricted status/error schema, eligibility-drift status, per-second or
burst limits, retry headers, reset boundaries, SLA/SLO, or final post-retirement
status/body. The retired endpoint was not called.

**RECOMMENDATION (high):** Curiosity should distinguish valid empty results from
configuration ineligibility, unsupported capability, policy filtering, budget
exhaustion, throttling, partial upstream failure, and shutdown. Each error needs
machine-readable retryability and a correlation ID; HTTP status alone is not
enough.

## 3. Quotas, pricing, and capacity

### 3.1 Published economics

**FACT (high):** Site Restricted JSON API cost **US$5 per 1,000 queries** and had
**no daily query limit** [S1, S3]. The additional terms allowed a free quota to
be absent, said successful requests could be charged, based usage charges on
Google's measurements, prohibited fee avoidance, and allowed fee/payment-policy
changes with 90 days' notice [S16].

**FACT (high):** one request returned at most ten items, so retrieving the full
documented 100-result window could require ten charged requests: **US$0.05** at
list price. This is arithmetic, not a Google price quote for a user question.

**INFERENCE (high):** “no daily query limit” removed one quota dimension; it did
not mean infinite QPS, free traffic, unlimited results, guaranteed capacity, or
an SLA. Pagination, retries, evaluations, query expansion, and agent branches
each multiplied billed calls.

### 3.2 Successor economics are not directly comparable

**FACT (high, current):** the current migration path requires Agent Search
Enterprise Edition for website search. On 2026-08-17, General Pricing listed
Enterprise Search at **US$4 per 1,000 queries**, 10,000 free queries per account
per month for exploration, plus index storage; website storage is estimated as
500 KiB times page count. Advanced generative answers add US$4/1,000 inputs,
while configurable pricing uses subscribed query/storage capacity and add-ons
[S11-S13].

**FACT (high):** Google's 2023 retirement post claimed Vertex AI Search would
generally be more cost-effective and offer better value [S5].

**INFERENCE (high):** that was a vendor positioning claim, not a workload proof.
The nominal query price fell from $5 to $4 per 1,000, but the meter and system
boundary changed: website search requires Enterprise Edition, indexed storage
is billable, advanced indexing and generative functions add cost, and app/data
store operations replace a thin endpoint. A valid comparison needs query volume,
page count, indexing mode, retention, optional features, migration labor, and
egress/operations—not request price alone.

**RECOMMENDATION (high):** meter Curiosity by research frame and stage: query
plans, provider calls, candidates, fetched bytes, extraction, index work,
reranking, synthesis, and retries. Enforce per-tenant/per-branch deadlines and
hard limits; return partial results and explicit stop reasons.

## 4. Lifecycle and retirement chronology

| Date | Official event | Lifecycle meaning |
| --- | --- | --- |
| 2018-07-16 | Google launched Site Restricted JSON API as the uncapped-daily option for engines searching <=10 sites [S1]. | Product lifetime from public launch to final stop was about 6.5 years. |
| 2023-10-05 | Product page recorded that new customers would receive HTTP 403; 2023-10-09 blog said Google was no longer receiving new customers [S2, S4]. | Intake closed before the retirement announcement; existing customers initially remained unaffected. |
| 2023-12-18 | Google announced retirement and Vertex AI Search migration [S5]. | The high-volume sibling was selected for migration before the general JSON API's later 2027 closure. |
| 2023-12-19 archived page | Product docs originally said traffic would stop **2024-12-18** [S17]. | Initial public deadline gave about one year. |
| 2024-09-12 archived/current revision | Product docs changed the traffic-stop date to **2025-01-08** [S3, S18]. | Deadline moved 21 days later; no reason was found in reviewed sources. |
| 2025-01-08 | Current docs and updated official post say endpoints ceased serving traffic [S3, S5]. | Final retirement; about 13 months after announcement and about 15 months after intake closure. |
| 2026-08-17 | The retired method remains in current human/machine-readable reference and navigation [S3, S6, S14]. | Discoverability of a schema is not evidence that a product still serves traffic. |

**FACT (high):** the current Blogger feed shows the retirement post was updated
on 2024-09-12 and now says 2025-01-08; an archived 2023-12-19 product page says
2024-12-18 [S5, S17, S18].

**INFERENCE (high):** lifecycle truth was distributed across the product page,
blog post, mutable feed entry, migration guide, and still-published REST schema.
A catalog based only on API discovery would have produced a false “available”
conclusion after retirement.

**RECOMMENDATION (high):** Curiosity's dependency register should separately
track launch, new-sales closure, deprecation announcement, deadline revisions,
serving stop, schema/documentation removal, contract end, and data/config export
windows. Preserve dated notices, diff material changes, and alert on sibling
product closures.

### Lifecycle risk conclusions

1. **RECOMMENDATION (high):** treat commercial eligibility, control-plane
   configuration, index/corpus, query endpoint, and documentation as separate
   dependencies.
2. **RECOMMENDATION (high):** require a provider-removal drill, shadow path, and
   frozen evaluation set before a hosted search route becomes critical.
3. **RECOMMENDATION (high):** own exportable corpus policy, captures, index
   manifests, ranking policy, rights ledger, and evaluation data. Exporting an
   engine configuration is not exporting Google's index or rank state.
4. **INFERENCE (high):** the shutdown of a specialized uncapped route before the
   general capped API shows that premium capacity characteristics can be less
   durable than shared schema characteristics.

## 5. Migration was a replatforming, not an endpoint swap

### 5.1 Required successor topology

**FACT (high):** Google's current migration guide directs a customer to [S11]:

- use/enable an Agent Search Cloud project;
- create a **search app** and a **website-content data store** in the `global`
  location;
- enable Enterprise Edition, which is required for website search;
- optionally turn off generative responses to approximate the retired API;
- choose basic website search or advanced website indexing;
- enter URL patterns rather than import a documented Site Restricted engine
  snapshot;
- choose a search widget or a new API; and
- select OAuth `search` (and optionally `answer`) or API-key `searchLite`.

**FACT (high):** advanced website indexing requires domain verification, creates
an index, is quota-bound and billable, and enables extractive content, summaries,
follow-ups, image-query search, sitemap/manual/automatic refresh, structured
metadata, lower documented latency, blending, and tuning. It cannot later be
turned off on the same data store; a new data store is required [S11, S12].

**INFERENCE (high):** the migration crossed at least seven boundaries:

| Boundary | Retired API | Agent Search migration |
| --- | --- | --- |
| Resource model | PSE engine ID | Cloud project + app/engine + data store + serving config |
| Route | `customsearch/v1/siterestrict` | `searchLite`, `search`, widget, and optional answer methods |
| Authentication | API key in ordinary guidance | API key only through `searchLite`; OAuth for broader methods/widget |
| Corpus setup | existing PSE sites/patterns over Google index | recreate website include patterns in a website data store |
| Edition | one specialized API | Enterprise Edition mandatory for website search |
| Index mode | provider Google index, opaque | basic website search or verified advanced website index |
| Meter | $5/1,000 successful queries, no daily cap | query edition + index storage + optional generative/indexing add-ons |

**FACT (high):** the guide recommends turning off generative responses and
advanced indexing only to obtain functionality “similar” to the retired API; it
does not claim wire compatibility or identical ranking/coverage [S11].

### 5.2 Migration checks that were materially required

**RECOMMENDATION (high):** a real migration should have compared, at minimum:

1. normalized include/exclude pattern expansion and effective corpus;
2. authentication and key-exposure model;
3. request filters, sorting, language, geography, safety, image, and promotions;
4. result schema, snippets, structured metadata, pagination, and depth;
5. ranking, deduplication, spelling, freshness, coverage, and empty-result cases;
6. price at actual query/page/index volume;
7. privacy/contract/data-processing terms and region requirements;
8. operational quotas, alerts, error mapping, rollback, and support; and
9. result retention, citation provenance, and independently acquired content.

**INFERENCE (high):** “same vendor” reduced neither semantic migration risk nor
adapter work. It may simplify commercial relationships, but the replacement
changed both control and data planes.

### 5.3 Migration unknowns

- No official automatic export/import mapping from PSE engine configuration to
  Agent Search was found in the reviewed guide.
- No official equivalence table for every retired query parameter/result field
  was found.
- No official relevance, coverage, freshness, or latency benchmark comparing
  the products was found; “improved” claims remain unverified vendor claims.
- No public rollback window, historical result export, or retained serving
  snapshot was found.
- The exact response served after final shutdown was not established.

## 6. Privacy, content rights, and terms

### 6.1 Queries and operational data crossed to Google

**FACT (high):** the incorporated PSE terms say Google and subsidiaries may
retain and use information collected through use of the service under Google's
Privacy Policy [S15, S16]. Google API terms allow monitoring API use to assure
quality, improve Google products/services, and verify compliance, and require a
client privacy policy that accurately explains information collection and
sharing with Google and third parties [S10].

**FACT (high, general policy):** Google's current Privacy Policy says collected
data can include search terms, IP address, browser/device identifiers and
settings, request time and referrer, interactions with content/ads, activity on
third-party sites using Google services, and location signals depending on
product/settings. Uses include service delivery, maintenance, improvement,
development, personalization, measurement, advertising, security, and
communications; retention varies by data, purpose, and controls [S19].

**INFERENCE (high):** an API client forwarded user query text and request
metadata into Google's service boundary. A site allow-list did not make
sensitive queries private or tenant-local.

**UNKNOWN / legal review required:** no product-specific public source reviewed
specified Site Restricted query-log retention, processing region, end-user
account/browser linkage, deletion/export controls, subprocessors, or exact
controller/processor allocation for every customer configuration. The general
Privacy Policy is not a product-specific retention schedule.

**RECOMMENDATION (high):** Curiosity should minimize query data, classify and
redact secrets/PII where compatible with the task, make provider transfer
explicit, avoid stable end-user identifiers by default, and record purpose,
region, retention, and deletion basis per provider route.

### 6.2 Returned content was not an owned-index feed

**FACT (high):** Google API terms state that returned third-party content can be
subject to intellectual-property rights. Unless permitted by the owner or law,
clients may not scrape/build databases/create permanent copies, retain cache
beyond cache headers, redistribute, misrepresent source, or remove notices
[S10]. On termination, permitted cached/stored content must be deleted.

**FACT (high):** PSE terms separately prohibited crawling, indexing, or
non-transitory storage/cache of results; creating a substitute or similar
service; reverse engineering; and various modifications, reordering, or
commingling of results. They granted Google broad perpetual rights in
operator-supplied metadata such as labels and URL associations and disclaimed
complete domain coverage and uninterrupted/error-free operation [S15].

**INFERENCE (high):** neither a result URL, snippet, PageMap, `cacheId`, nor the
`rights` query filter established permission to crawl, retain, train on, or
redistribute underlying content. Configuration portability was not content,
index, rank-state, or rights portability.

**RECOMMENDATION (high):** Curiosity must independently acquire authorized
source content and retain acquisition basis, robots/policy decisions, asserted
license evidence, verification state, attribution obligations, deletion state,
and immutable capture lineage. Unknown rights remain unknown.

### 6.3 Clean-room boundary

Permissible lessons, subject to counsel and independent authorship, include
capability gating, hard-filter/soft-rank separation, bounded paging, typed query
metadata, promotions separated from organic results, explicit safety/locale
controls, and lifecycle controls. This report does not transfer Google code,
documentation prose, XML, branding, private outputs, or ranking behavior.

**REJECTED:** bypassing retirement, new-customer 403, quotas, billing, access
controls, result-depth limits, cache/retention limits, or terms.  
**REJECTED:** using Google results as an owned corpus, hidden ranking oracle, or
evaluation/training dataset.  
**DEFERRED:** any legal conclusion about a specific legacy customer's agreement;
private amendments and complete facts were not available.

## 7. Architectural lessons and Curiosity verdicts

| Observation | Classification | Verdict and Curiosity treatment |
| --- | --- | --- |
| Query endpoint and engine configuration were separate [S3, S6] | FACT | **ADOPTED:** separate provider-neutral serving from versioned corpus/rank/policy control planes. |
| Route eligibility depended on <=10 sites, no global TLD, whole-web off [S3] | FACT | **ADAPTED:** explicit capability predicates over immutable policy versions with typed fail-closed errors. |
| Invalid configuration could yield “unexpected results” [S3] | FACT | **REJECTED:** never silently alter semantics when a capability invariant fails. |
| “No daily limit” distinguished the product [S1, S3] | FACT | **ADAPTED:** multidimensional capacity budgets; never equate absence of one quota with guaranteed/unbounded service. |
| Same parameters/schema as capped general API [S3, S6-S8] | FACT | **ADOPTED lesson:** wire similarity is not lifecycle, quota, entitlement, or migration equivalence. |
| At most 10 items/page and first 100 results [S6-S8] | FACT | **REJECTED as canonical depth:** bounded cursor/snapshot retrieval sized to evaluated tasks. |
| Google index controlled actual availability [S9, S15] | FACT | **REJECTED foundation:** own crawl/index manifests and measure corpus-cell coverage/freshness. |
| Query metadata echoed filters and page navigation [S7] | FACT | **ADAPTED:** execution trace plus normalized/effective controls and immutable snapshot, not offset alone. |
| Promotions were separate from organic items [S7] | FACT | **ADOPTED:** typed result classes; promotions never count as organic evidence. |
| SafeSearch and rights filters were simple query controls [S6] | FACT | **ADAPTED:** narrow signals in layered policy/rights systems, never universal safety or license bits. |
| No capture/rank provenance [S7] | FACT | **REJECTED schema:** citations require immutable captures, anchored passages, versions, and bounded reasons. |
| Intake closed before retirement notice [S2, S4, S5] | FACT | **ADOPTED risk signal:** sales/eligibility closure triggers dependency review before shutdown notice. |
| Deadline changed from 2024-12-18 to 2025-01-08 [S17, S18] | FACT | **ADOPTED operations:** retain and diff notices; deadlines are versioned facts. |
| Retired route remains in current discovery/reference [S6, S14] | FACT | **REJECTED availability heuristic:** schema presence alone cannot mark a provider healthy/available. |
| Successor required app/data store/edition/index/auth choices [S11-S13] | FACT | **REJECTED as “drop-in”:** migration equivalence must be proven by capability, semantics, economics, terms, and evaluation. |
| Standard terms barred permanent result databases [S10, S15] | FACT | **REJECTED data source:** independently acquire authorized content. |

### 7.1 Provider-neutral contract implication

Do not expose `cx`, `siterestrict`, `PageMap`, Google country codes, or provider
cache IDs in Curiosity's domain contract. Independently model:

```text
corpus_policy_version + capability_predicates
original/normalized/executed query + derived constraints
document languages + geographic intent + safety policy
page/candidate/byte/deadline budgets
channel statuses + organic/promotion distinctions
index snapshot + capture/passage provenance + rights/policy decisions
coverage/freshness/partial-failure warnings
```

Provider wire objects remain adapter-private. A provider's source order should be
retained as observed metadata; any Curiosity rerank is a separate, versioned
derivation.

### 7.2 Bounded agent authority

Search results are untrusted evidence. They cannot create a new research frame,
spend beyond the caller's total/branch budget, follow a promotion or suggested
query automatically, grant action tools, mutate corpus policy, or approve a
safety/legal exception. After synthesis, a curiosity pass may only score
in-frame gaps. Follow-up execution requires caller-declared authority.

### 7.3 Provider-dependency controls

**RECOMMENDATION (high):** maintain for every external search provider:

- a lifecycle register with dated, archived evidence and notice diffs;
- an entitlement/capability matrix distinct from API schema discovery;
- contract tests over neutral semantics, not provider field presence;
- a provider-removal runbook, shadow/fallback path, and global kill switch;
- frozen authorized evaluation captures and acceptance thresholds;
- exportability inventory for policies, source manifests, captures, indexes,
  rights state, logs, and metrics; and
- cost models that include migration and reacquisition, not only request price.

## 8. Unknowns, contradictions, and negative results

### Material unknowns

1. Exact QPS/burst limits, concurrency, quota reset behavior, retry headers, and
   SLA for the retired service.
2. Exact runtime behavior for an engine that drifted beyond the site rules.
3. Exact post-2025-01-08 HTTP status/body and whether any private contract
   exceptions existed.
4. Product-specific query retention, processing location, linkage, deletion,
   and export behavior.
5. Proprietary crawl, ranking, freshness, deduplication, spam, and safety
   behavior; effective coverage of any engine.
6. Whether OAuth worked for every historical customer despite key-centric
   product guidance.
7. A complete historical support/SLA and quota table; “no daily limit” is the
   only capacity claim established here.
8. Exact automated migration coverage, if any, beyond the public manual guide.

### Contradictions and documentation drift

- **Deadline revision:** the 2023-12-19 archived product page says 2024-12-18;
  the 2024-09-12 revision and current post/page say 2025-01-08 [S3, S5, S17,
  S18]. Final date is high confidence; the reason for extension is unknown.
- **Authentication:** usage/migration docs say API key, while the method
  reference lists OAuth and discovery allows OAuth instead of a key [S6, S8,
  S11, S14].
- **SafeSearch:** method docs expose `active|off` and call `off` default;
  discovery retains deprecated values and engine fallback when unspecified
  [S6, S14]. Set policy explicitly.
- **Availability signal:** current reference/discovery still advertise the
  operation even though current product docs say traffic stopped [S3, S6, S14].

### Negative results retained

- No official evidence was found for a raw, wire-compatible replacement.
- No official benchmark established successor equivalence or superiority for
  Curiosity workloads.
- No result-level relevance score, rank explanation, capture timestamp,
  immutable document version, index snapshot, content hash, or passage anchor
  was found.
- No official guarantee of complete indexing for configured sites was found;
  terms expressly disclaim it.
- No public product-specific privacy retention schedule was found.
- No live or retired endpoint call was made; runtime errors and headers were not
  inferred from third-party reports.
- No credentials, billing account, support contact, migration app, or Cloud
  resource was created.

## 9. Verification checks

| Check | Triangulation | Outcome |
| --- | --- | --- |
| Launch and original value proposition | 2018 official product post + archived 2018 docs [S1, S20] | Confirmed launch, <=10-site scope, $5/1,000, no daily cap. |
| Intake closure | 2023-10 official blog + archived product page [S2, S4] | Confirmed new customers received 403 from 2023-10-05; existing users initially unaffected. |
| Retirement and final date | current product page, updated official feed/post, archived date revisions [S3, S5, S17, S18] | Confirmed final 2025-01-08 stop and retained original 2024-12-18 notice. |
| Contract parity and bounds | dedicated page, method reference, response schema, REST guide, discovery [S3, S6-S8, S14] | Confirmed route difference, shared parameters/schema, 10/page, first 100. |
| Corpus ownership boundary | annotations docs + PSE terms [S9, S15] | Confirmed Google-index dependence and no complete-domain warranty. |
| Pricing | launch/current retired docs + additional terms [S1, S3, S16] | Confirmed $5/1,000 and no daily cap; no broader capacity promise inferred. |
| Migration non-equivalence | migration guide + advanced-features + pricing [S11-S13] | Confirmed new resources, methods, auth, edition, indexing modes, and meters. |
| Retention/rights/privacy | API terms, PSE terms, privacy policy [S10, S15, S19] | Confirmed conservative no-database boundary and general data-processing scope; product retention remains unknown. |
| Access boundary | research activity | Public GET documentation/archive/feed only; no API search request, account, credential, billing, or form submission. |

## 10. Bounded curiosity pass and stop decision

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Rel. | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Recover launch and complete lifecycle, not only retirement | 5 | 5 | 4 | 1 | **Pursued:** official Blogger feed recovered the 2018 launch and 2023 intake closure [S1, S2]. |
| Resolve retirement-date discrepancy | 5 | 5 | 5 | 2 | **Pursued:** archived pages proved initial 2024-12-18 and revised 2025-01-08 dates [S17, S18]. |
| Determine whether successor is wire compatible | 5 | 5 | 3 | 1 | **Pursued:** migration guide proved replatforming across resources, methods, auth, indexing, and pricing [S11-S13]. |
| Compare successor current economics | 4 | 4 | 3 | 1 | **Pursued:** current pricing established $4/1,000 Enterprise website search plus storage/add-ons; not treated as historical like-for-like [S12, S13]. |
| Probe retired endpoint for final status | 2 | 1 | 3 | 4 | `CURIOSITY_NO_GO`: no credentials/live calls authorized; post-retirement body would not change the architectural verdict. |
| Create an Agent Search migration app | 4 | 3 | 3 | 5 | `CURIOSITY_NO_GO`: would create resources, billing exposure, and implementation outside the frame. |
| Reconstruct ranking from output samples | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: terms-sensitive, unreliable, and unnecessary for clean-room lessons. |
| Conclude legal applicability to a legacy customer | 4 | 4 | 2 | 5 | `CURIOSITY_NO_GO`: private agreement and counsel required. |
| Infer a reason for the 21-day deadline extension | 2 | 1 | 3 | 4 | `CURIOSITY_NO_GO`: no primary evidence found; speculation would add no decision value. |

**Coverage:** contract/restrictions, result and evidence boundary, quotas/pricing,
launch/intake closure/deadline revision/retirement, successor migration,
privacy/terms, provider-dependency risks, and Curiosity dispositions are covered.
**Saturation:** additional official pages repeated the same product, migration,
and terms boundaries. **Stop:** remaining material gaps require prohibited live,
commercial, private-contract, or legal work. Follow-up execution requires a new
caller-declared frame and authority.

## 11. Primary-source ledger

All sources were accessed 2026-08-17. Google pages and official Google Blogger
feeds are primary sources for product claims. Internet Archive captures preserve
historical first-party Google pages; they are cited only for dated text no longer
present on the mutable current page.

| ID | Primary source | Use and confidence |
| --- | --- | --- |
| **S1** | Google PSE Blog, **Expanding our Custom Search Engine offerings**, 2018-07-16. https://programmablesearchengine.googleblog.com/2018/07/expanding-our-custom-search-engine.html (full post also in official Blogger feed) | Launch, <=10 sites, no daily cap, comparison to general API. **High.** |
| **S2** | Google PSE Blog, **Check out Vertex AI Search!**, 2023-10-09. https://programmablesearchengine.googleblog.com/2023/10/check-out-vertex-ai-search.html (full post in official Blogger feed) | New-customer closure and successor positioning. **High.** |
| **S3** | Google, **Custom Search Site Restricted JSON API**, updated 2025-08-28. https://developers.google.com/custom-search/v1/site_restricted_api | Final stop date, engine eligibility, route, shared parameters, price/no daily limit. **High** for final published state. |
| **S4** | Archived Google product page, captured 2023-11-27, page updated 2023-10-05. https://web.archive.org/web/20231127220837id_/https://developers.google.com/custom-search/v1/site_restricted_api | New-customer HTTP 403 and existing-customer boundary. **High** as archived first-party page. |
| **S5** | Google PSE Blog official Blogger feed entry, **Custom Search Site Restricted JSON API is transitioning to Vertex AI Search!**, published 2023-12-18, updated 2024-09-12. https://programmablesearchengine.googleblog.com/feeds/posts/default?alt=json&q=Site%20Restricted%20JSON%20API and canonical https://programmablesearchengine.googleblog.com/2023/12/custom-search-site-restricted-json-api.html | Final date, transition rationale/features, “more cost-effective” claim, migration. **High** for Google statements; value claims unbenchmarked. |
| **S6** | Google, **Method: cse.siterestrict.list**, updated 2024-08-21. https://developers.google.com/custom-search/v1/reference/rest/v1/cse.siterestrict/list | Route, request parameters, page/depth limits, body, OAuth scope. **High** for published schema; runtime retired. |
| **S7** | Google, **Search response type**, updated 2024-08-21. https://developers.google.com/custom-search/v1/reference/rest/v1/Search | Response, results, promotions, query metadata, absent provenance. **High** for documented schema. |
| **S8** | Google, **Use REST to Invoke the API**, updated 2025-08-28. https://developers.google.com/custom-search/v1/using_rest | Key/cx/q, URL length, OpenSearch roles, first-100 bound. **High** for shared contract. |
| **S9** | Google, **Annotations: Defining Sites to Search**, updated 2024-08-21. https://developers.google.com/custom-search/docs/annotations | Google-index dependency, coverage behavior, sitemap caveat. **High.** |
| **S10** | Google, **Google APIs Terms of Service**, modified 2021-11-09. https://developers.google.com/terms | Monitoring/privacy, credentials, limits, returned-content retention/reuse, termination. **High** as public standard terms; legal application requires counsel. |
| **S11** | Google Cloud, **Migrate from Custom Search Site Restricted JSON API**, updated 2026-08-11. https://cloud.google.com/generative-ai-app-builder/docs/migrate-from-cse | Apps/data stores, Enterprise Edition, indexing choices, methods/auth, “similar” configuration. **High** for current migration path. |
| **S12** | Google Cloud, **About advanced features**, updated 2026-08-11. https://docs.cloud.google.com/generative-ai-app-builder/docs/about-advanced-features | Website-search edition, verification, index features/cost, irreversible advanced-indexing choice. **High.** |
| **S13** | Google Cloud, **Agent Search pricing**. https://cloud.google.com/generative-ai-app-builder/pricing | Current query, storage, free-trial, configurable and add-on pricing. **High** for 2026 list price; not historical successor price. |
| **S14** | Google, **Custom Search v1 public discovery document**, revision observed 2026-08-13. https://customsearch.googleapis.com/$discovery/rest?version=v1 | Shared/site-restricted operation presence, system parameters, auth drift, SafeSearch drift. **High** as machine-readable publication; not proof of serving availability. |
| **S15** | Google, **Programmable Search Engine Terms of Service**. https://support.google.com/programmable-search/answer/1714300 | Service/query handling, retention/privacy, metadata rights, automation/storage/reverse-engineering limits, coverage/reliability disclaimer. **High** as public terms; interpretation requires counsel. |
| **S16** | Google, **Custom Search JSON API Additional Terms**, modified 2020-01-11. https://developers.google.com/custom-search/terms | Incorporated terms, charging, fee changes, fee avoidance, deprecation notice. **High** as public terms. |
| **S17** | Archived Google product page, captured 2024-01-22, page updated 2023-12-19. https://web.archive.org/web/20240122212218id_/https://developers.google.com/custom-search/v1/site_restricted_api | Original 2024-12-18 stop date. **High** as archived first-party page. |
| **S18** | Archived Google product page, captured 2024-09-13, page updated 2024-09-12. https://web.archive.org/web/20240913194242id_/https://developers.google.com/custom-search/v1/site_restricted_api | Revised 2025-01-08 stop date. **High** as archived first-party page. |
| **S19** | Google, **Privacy Policy**, effective 2026-05-26. https://policies.google.com/privacy | General collection, uses, controls, retention classes, transfers. **High** as general policy; not product-specific retention. |
| **S20** | Archived Google product page, captured 2019-01-05, page updated 2018-10-16. https://web.archive.org/web/20190105153026id_/https://developers.google.com/custom-search/v1/site_restricted_api | Early product contract and price cross-check. **High** as archived first-party page. |

### Overall confidence

- **High:** launch, three eligibility conditions, route/schema parity, $5/1,000
  and no daily cap, 403 intake closure, deadline revision, final retirement date,
  replatforming nature of migration, and standard retention restrictions.
- **Medium-high:** exact historical semantics of shared advanced query controls,
  because documentation remained mutable and no authorized runtime test occurred.
- **Low / unknown:** proprietary ranking/coverage, runtime capacity and errors,
  product-specific privacy retention, private-contract exceptions, and exact
  shutdown response.
