# Brave Web Search API: clean-room product dossier

**Date and source access:** 2026-08-17  
**Scope:** Brave's core `GET|POST /res/v1/web/search` product, not LLM
Context, Answers, Summarizer, dedicated News, Image, Video, Place, Suggest, or
Spellcheck products. Web responses can contain optional non-web clusters; those
are described only where they affect the core contract.  
**Status:** research evidence and recommendations; not an implementation,
benchmark, purchase, legal opinion, or authorization to call the service.  
**Clean-room boundary:** public first-party documentation, public Brave pages,
and Brave's public repositories only. No credentials, subscribed endpoint calls,
traffic interception, bypass, decompilation, or proprietary implementation was
used.

## Executive verdict

**REJECTED as Curiosity's owned-search foundation; ADAPTED as an interface and
operational reference (high confidence).** Brave offers unusually broad,
sanctioned access to a genuinely independent general-Web index, useful locale,
freshness, SafeSearch, operator, reranking, structured-result, and pagination
controls, and a simple current price of **$5 per 1,000 successful requests**.
However, the hosted index, ranking, crawl lineage, document versions, and
snippet anchoring remain vendor-controlled and mostly opaque. The standard
terms also prohibit non-transient result storage, derivative works, reverse
engineering, model training/evaluation, and API replacement; an Order Form may
change rights, but must be reviewed before any Curiosity use [S1, S8].

The strongest clean-room lessons are architectural rather than algorithmic:

1. separate document age from fetch time;
2. expose query rewriting, pagination continuation, and reranking mutation;
3. make locale, safety, spelling, operators, and source policy explicit inputs;
4. retrieve several query-relative passages, not one generic summary;
5. use privacy-preserving, purpose-limited aggregate signals rather than user
   profiles; and
6. treat every result and schema enrichment as untrusted external evidence.

Brave is credible evidence that crawler + index + privacy-preserving discovery
signals can operate at global scale. It is not evidence that Curiosity can copy
Brave's proprietary ranking, economics, or scale. Brave's own current pages are
internally inconsistent on index size: the main product and comparison pages say
**over 30 billion** pages, while a July 2026 glossary says **over 40 billion**;
neither publishes an auditable counting method [S1, S10, S18]. Record the claim
as “30–40B vendor-reported indexed pages,” not a verified corpus measurement.

## 1. Decision frame and bounded questions

### 1.1 Decision

What should Curiosity learn from Brave Web Search API while preserving an owned,
provider-neutral retrieval architecture and avoiding contractual, provenance,
privacy, and epistemic dependence?

### 1.2 Bounded sub-questions

1. What evidence supports Brave's first-party crawl/index and scale claims?
2. What exactly can a Web Search request control, and what can its response
   prove?
3. What is known about candidate selection, ranking, snippets, pagination, and
   duplicate behavior?
4. What limits, errors, lifecycle, price, privacy, and legal constraints shape
   production economics?
5. Which public clues can be safely adapted without reconstructing proprietary
   code or behavior?

**Depth budget:** first-party public sources for every requested category and
triangulation of material claims. No live quality/latency test, paid plan,
contract negotiation, jurisdiction-specific legal analysis, or exhaustive
schema transcription. Coverage stops when sources repeat marketing claims or
would require access outside this authority.

Labels below:

- **FACT** — directly supported by cited first-party material.
- **INFERENCE** — reasoned conclusion, not directly verified.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Product boundary and lineage

**FACT (high):** the Web Search endpoint is explicitly described as results for
**human consumption**. Brave directs agents and chatbots to the separate LLM
Context endpoint. The Web endpoint returns ranked links, snippets, and metadata;
it is not the Answers product and does not itself synthesize an answer [S2].

**FACT (high):** Brave acquired Tailcat from the former Cliqz search team in
March 2021 and identified it as Brave Search's foundation. Brave launched Search
beta in June 2021, then removed remaining Bing API calls from default Web results
in April 2023. At removal, Brave said Bing had supplied about 7% of query results;
Brave also warned that some regional and language-specific quality might change
[S11-S13].

**FACT (high, scoped):** Brave says current Brave Search Web results are served
solely from its independent index [S12, S17]. This does **not** prove every
optional enrichment in a Web API response is first-party. Brave documents
third-party providers for real-time rich data and presents Local and Rich fetches
as separate workflows [S2]. Dedicated News and Image products are outside this
report.

**INFERENCE (high):** core Web Search is best modeled as a hosted ranked-index
API with optional heterogeneous result clusters—not as raw crawl access, page
content extraction, or a stable evidence archive.

## 3. Crawl, discovery, index, and scale

### 3.1 First-party evidence

**FACT (high):** Brave documents a crawler that discovers pages and indexes
their content. It does not advertise a differentiated user agent, saying this
avoids discrimination by sites that permit only Google; it says it will not
crawl a domain/page that Googlebot cannot crawl. Brave also says `robots.txt`
does not itself prevent indexing and directs publishers to a `noindex` directive
for delisting, which takes effect after a re-fetch [S14]. This unusual policy
needs independent legal and publisher-expectation review before being imitated.

**FACT (high):** discovery is hybrid. In addition to the conventional crawler,
the opt-in Web Discovery Project (WDP) contributes anonymous search-result,
visit, engagement, and page-metadata signals. Its support page says WDP can also
process a small, preselected set of innocuous crawler fetch jobs in a private,
cookie-free browser fetch [S15].

**FACT (high):** Brave's security page states that it knows more than 100B URLs
but indexes a subset. Eligibility examples include pages visited by real people,
pages linked from multiple indexed pages (“reputation transfer”), and curated RSS
feeds. It also documents real-time phishing/malware lists, CSAM scanning, and
RTBF handling. That page says “20B+” indexed pages, apparently an older snapshot
[S9].

**FACT (medium):** current scale statements conflict:

| First-party statement | Value | Interpretation |
| --- | ---: | --- |
| Product and Oct 2025 comparison pages [S1, S10] | >30B pages; >100M new/refreshed page updates/day | current prominent marketing claim |
| July 2026 glossary [S18] | >40B pages | newer but isolated claim |
| Security page [S9] | >100B known URLs; 20B+ indexed | useful selection clue; stale size floor |
| Oct 2025 comparison page [S10] | >50M searches/day; 95% under 1 second | vendor production claim, not API SLO |

No source defines whether “pages” means canonical URLs, documents, versions, or
language variants; how removals are counted; or whether the daily number is
unique pages versus processing events. No public first-party audit found in this
bounded pass validates these figures.

**INFERENCE (medium):** the architecture likely has at least discovery/frontier,
fetch, eligibility/safety, canonicalization/indexing, query/ranking, snippet, and
presentation layers, with WDP supplying discovery and aggregate quality labels.
Exact storage, sharding, indexing, and ranking designs remain unknown.

### 3.2 WDP signals and privacy architecture

**FACT (high):** WDP is off by default and purpose-limits collection through
client-side aggregation. Public documentation names query/result clicks, visited
URLs, dwell/engagement, page title and metadata, popularity/novelty, exact or
synonym matching, and result relevance as useful signals. It claims records
cannot be grouped into a user session [S15, S16].

**FACT (high):** public WDP design material describes URL/query sanitization,
credential-free “double fetch,” public/private signature comparison, capability-
URL heuristics, private-address rejection, random single-message transport,
anti-replay credentials, and threshold recovery using STAR/Shamir-style shares.
The support page states that a URL must be observed by at least 20 people and WDP
data is erased after one year [S15, S16].

**CAUTION (high):** WDP's public repository is evidence, not a code source for
Curiosity. Concepts may be independently specified; code, protocol choices, and
licenses need separate review. Brave itself says the privacy design has no formal
proof and acknowledges rare heuristic leakage in historical design notes [S16].

## 4. Request contract

**FACT (high):** both GET and POST target
`https://api.search.brave.com/res/v1/web/search`; POST carries the same controls
as JSON. Authentication is the required `X-Subscription-Token` header. Queries
are non-empty, at most 400 characters and 50 words [S3, S4, S5].

### 4.1 Core controls

| Input | Documented behavior and bounds |
| --- | --- |
| `q` | required; 400 characters / 50 words maximum |
| `country` | result market; default `US`; documented finite enum |
| `search_lang` | preferred result language; default `en`; 2+ character enum |
| `ui_lang` | response/UI language; default `en-US` |
| `count` | Web results only; 1–20, default 20; actual count may be lower |
| `offset` | **page** offset, not row offset; 0–9, default 0 |
| `safesearch` | `off`, `moderate` (default), `strict` |
| `spellcheck` | default true; altered query is always searched and returned as `query.altered` |
| `freshness` | `pd` (24h), `pw` (7d), `pm` (31d), `py` (365d), or `YYYY-MM-DDtoYYYY-MM-DD` |
| `text_decorations` | default true; allows highlight markers in display strings |
| `operators` | default true; controls query-operator parsing |
| `result_filter` | comma-delimited cluster selection; use `web` to constrain the response to this report's core product |
| `extra_snippets` | up to five alternate excerpts per Web result |
| `goggles` | one or up to three hosted/inline reranking definitions |
| `include_fetch_metadata` | adds fetch metadata; Brave's official skill names `fetched_content_timestamp` |
| `Cache-Control: no-cache` | asks Brave not to return cached content, documented only as best effort |
| `Api-Version` | date version (`YYYY-MM-DD`); omission selects latest |

Sources: [S2-S7]. `summary`, `enable_rich_callback`, `units`, geographic device
headers, and non-web `result_filter` values exist but cross into optional
summarizer, rich, local, or mixed presentation behavior and should not enter a
minimal Web-only adapter by default.

### 4.2 Locale and device context

**FACT (high):** market (`country`), content language (`search_lang`), and UI
language (`ui_lang`) are independent. Optional headers can carry latitude,
longitude, timezone, city, state, country, and postal code; `User-Agent` may also
change device experience [S3, S4].

**RECOMMENDATION (high):** do not forward precise end-user location or raw user
agent by default. Make market/language explicit, minimize location precision,
obtain authority/consent, and include those choices in the retrieval trace.

### 4.3 Freshness and safety semantics

**FACT (high):** freshness is based on the “most relevant date reported by the
content,” such as publication or last-modified date—not necessarily crawl time.
`page_age` can expose an ISO publication-like date, while
`fetched_content_timestamp` is separately optional [S3, S4].

**FACT (high):** moderate SafeSearch filters explicit images/video but permits
adult domains in Web results; strict drops all adult content. `web.family_friendly`
and `query.show_strict_warning` can report output/query state [S3, S4].

**INFERENCE (high):** freshness and SafeSearch are fallible classifications, not
proof. Curiosity must preserve claimed page date, observed fetch time, and policy
decision separately and must not infer that `moderate` makes Web results safe.

### 4.4 Operators and Goggles

**FACT (high):** operators live in `q`: `ext:`, `filetype:`, `intitle:`,
`inbody:`, `inpage:`, `lang:`, `loc:`, `site:`, unary `+`/`-`, quoted exact
phrases, and uppercase `AND|OR|NOT`. Brave labels operators experimental; strict
combinations may produce no results and behavior may change [S6].

**FACT (high):** Goggles are post-index custom ranking/filter rules. They can
boost, downrank, or discard URL/domain patterns; up to three values can be sent.
Hosted definitions require prior Brave registration; inline definitions do not.
The response can expose `web.mutated_by_goggles` [S4, S7].

**INFERENCE (high):** operators affect matching/candidate formation, while
Goggles are described as reranking/filtering on top of Brave's index. Neither
guarantees corpus completeness. Curiosity should model query constraints and
source-policy reranking as different stages.

## 5. Response, ranking, snippets, and provenance

### 5.1 Web-only shape

**FACT (high):** the top-level type is `search`; `query` reports original and
possibly altered/cleaned forms, continuation, spelling/safety state, and applied
operators. `web.results[]` is ranked order. The official Brave skill documents
the following principal fields [S3, S4]:

| Area | Fields |
| --- | --- |
| Identity/display | `title`, `url`, `description`, `meta_url`, optional `profile`, `thumbnail` |
| Time/language | `age`, `page_age`, `language`, optional `fetched_content_timestamp` |
| Passages | `description`, optional `extra_snippets[]` (up to five) |
| Navigation | optional `deep_results.buttons/links` |
| Structured metadata | `schemas` and optional typed projections for article, product, recipe, book, software, rating, FAQ, movie, video, location, QA, organization, review, and other creative works |
| Set state | `web.type`, `web.family_friendly`, `web.mutated_by_goggles` |

Mixed responses can additionally contain result clusters and a `mixed` object
whose `main`, `top`, and `side` arrays reference indexes in those clusters. That
is a presentation ordering, not a universal scalar rank across result types
[S4].

### 5.2 Ranking evidence

**FACT (medium):** Brave says its ranking is informed by real queries/clicks and
WDP aggregate relevance, popularity, novelty, dwell, and interaction signals;
it also says the index is tuned to reduce SEO spam. Goggles transparently mutate
the base ordering [S7, S10, S15, S16].

**UNKNOWN:** candidate-generation algorithms, lexical/semantic features,
link-graph scoring, freshness weights, host diversity, learning-to-rank model,
spam classifiers, training sets, per-result score, rank explanation, and quality
by language/query class. Marketing assertions of parity or superiority are not
accepted as independent benchmarks.

### 5.3 Snippets

**FACT (high):** Brave says snippets are selected from page content; extra
snippets provide up to five query-relative alternate excerpts and the product
page says they are picked in real time to maximize contextual relevance [S1-S4].
Decorations can insert highlighting markup.

**INFERENCE (high):** snippets are lossy, query-dependent display artifacts.
The contract exposes no passage offset, DOM path, extraction version, content
hash, immutable capture ID, or guarantee that a snippet remains at the URL.
Schema projections are similarly untrusted page/provider metadata.

### 5.4 Provenance sufficiency

| Question | Brave Web response | Curiosity requirement |
| --- | --- | --- |
| Where did it come from? | URL/host/profile | preserve URL plus resolved/final URL and publisher/owner evidence |
| When was it published? | `page_age`/`age`, optional | preserve as claimed date with derivation/uncertainty |
| When did Brave fetch it? | optional fetch timestamp | retain, but distinguish from Curiosity observation/capture |
| What exact bytes support it? | not exposed | immutable capture ID/hash and cited passage anchor |
| Why was it ranked? | rank position; Goggles mutation flag | stage trace and bounded feature classes |
| Was it canonical/deduplicated? | not exposed | canonical cluster and duplicate relation |
| Which crawl/discovery path found it? | not exposed | discovery/fetch/index lineage |

**RECOMMENDATION (high):** if ever authorized as a transitional provider, label
results `provider=brave_web`, preserve all query controls/rewrite fields and rank
position, strip or safely parse decoration markup, then independently fetch and
validate primary sources under Curiosity policy. Never cite the Brave snippet as
if it were an immutable source capture.

## 6. Pagination and duplicate behavior

**FACT (high):** `offset` skips result **pages** of size `count`, from 0 through
9. The documented maximum theoretical Web window is therefore 200 positions
(20 × 10 pages), but actual results can be fewer. Brave explicitly warns that
pages can overlap and advises continuing only while
`query.more_results_available` is true [S2-S4].

**UNKNOWN:** stability under index updates, snapshot isolation, exact-URL versus
canonical/near-duplicate suppression, host caps, and whether repeated items are
charged again. No cursor or snapshot identifier is documented.

**RECOMMENDATION (high):** budget each page as a separate request; stop on the
continuation flag or project cap; deduplicate independently by normalized URL,
canonical evidence, and content fingerprint; retain first/best rank plus all
observed ranks. Do not promise exhaustive export or stable deep paging.

## 7. Limits, errors, versioning, and operations

**FACT (high):** the current Search plan advertises 50 requests/second. Rate
limits use a one-second sliding window per subscription and may also include a
monthly window. Responses expose `X-RateLimit-Limit`, `-Policy`, `-Remaining`,
and `-Reset`; 429 indicates excess. Brave says only successful/non-error
responses consume quota and are billed [S5, S8].

**FACT (high):** the Web reference documents 200 success and structured
`ErrorResponse` bodies for 404, 422, and 429, with top-level `type`, `error`, and
`time`. Public reference output inspected here does not fully expand the error
child schema and does not specify every authentication or 5xx response [S3].

**FACT (high):** URL major version `v1` is expected to change rarely. Date-based
`Api-Version` can pin backward-incompatible behavior; without it, latest is
selected. Brave treats added optional inputs, response properties, and resources
as backward compatible—including changes to string length/format [S19].

**FACT (medium):** Brave publishes a status page and lists historical API
interruptions from deployment, database migration, subsystem failure, and DDoS.
The public sources reviewed provide no general uptime/latency SLA for the
standard plan [S20].

**RECOMMENDATION (high):** pin a reviewed date version; parse additively; bound
body size/time; do not follow arbitrary redirects; honor rate headers with
jittered backoff; redact tokens/query PII from diagnostics; distinguish 422,
429, auth, timeout, 5xx, parse, and partial-result failures. These are clean-room
requirements, not claims about Brave's internal client.

## 8. Pricing and economics

**FACT (high):** as accessed, Search costs **$5 per 1,000 requests** ($0.005 per
successful request), includes **$5 monthly credit**, and advertises 50 requests
per second. The credit is therefore nominally 1,000 successful Search requests
per month at list price. Enterprise offers custom capacity, agreements, support,
invoicing, and Zero Data Retention [S1, S8]. Older comparison prose saying plans
start at $3 CPM or 2,000 free queries reflects an earlier catalog and should not
drive a 2026 estimate [S10].

**FACT (high):** pricing is per request, not per returned hit. At list price:

| Pattern | Requests | Search fee |
| --- | ---: | ---: |
| One query, one page | 1 | $0.005 |
| One query, maximum 10 pages | 10 | $0.05 |
| 1M one-page searches | 1M | $5,000 |
| 1M searches averaging 2.5 pages | 2.5M | $12,500 |

Taxes, retries, independent page fetch/extraction, storage, evaluation, gateway,
observability, and engineering are additional. Failed requests are documented as
unbilled, but a client should not assume retries are free when a timeout hides a
successful server response.

**INFERENCE (high):** `extra_snippets=true` is economically valuable if it
reduces paid pagination or downstream fetches, but cannot replace source
verification. Deep paging multiplies both cost and duplicate exposure.

## 9. Privacy, legal, and license boundary

### 9.1 API query privacy

**FACT (high):** the API privacy notice says query records are retained up to 90
days for billing and troubleshooting/legal obligations. Brave says it does not
collect identifiers linking a query to an end user/device, but the customer may
be able to do so and remains responsible for notices and consent. Enterprise ZDR
is optional and subject to legal obligations [S21]. Consumer Brave Search's
privacy promises are not the API contract [S17, S21].

**FACT (high):** account, billing, support, IP, and authentication-token data have
separate retention periods. The privacy notice says Search Query Data is excluded
from Brave's DPA because Brave takes the position it is not personal data in its
hands [S21]. That position does not remove Curiosity's obligations.

### 9.2 Standard terms

**FACT (high, not legal advice):** standard terms dated 2026-02-11 grant a
limited, revocable, non-exclusive API/result license for customer applications.
Unless an Order Form says otherwise, they prohibit:

- storage/cache/database creation beyond transient operation;
- derivative works, redistribution/resale/sublicensing;
- reverse engineering or bypassing service/rate limits;
- using results to replicate/replace the API; and
- using results to create, evaluate, train, retrain, fine-tune, benchmark, or
  improve AI models/services [S8].

Terms require key protection, end-user controls, compliance, and deletion of
results/documentation at termination. Attribution is permissive (“may”), but if
used must follow prescribed `POWERED BY BRAVE`/mark rules. Third-party content
rights remain with their owners; results are as-is with broad accuracy,
completeness, security, and non-infringement disclaimers. Brave can terminate for
convenience with 10 days' notice [S8].

**RECOMMENDATION (high):** legal/procurement must approve the exact plan and
Order Form before even a pilot. A research archive, durable citation store,
provider benchmark, or model-evaluation corpus appears incompatible with the
standard terms. Store only project-owned retrieval traces/results if expressly
authorized, and separately assess rights in each source page.

### 9.3 Index governance

**FACT (high):** Brave provides global RTBF/right-to-object review, re-fetch and
not-found channels, and a DMCA process. It treats itself as controller of index
personal data and cites legitimate interest under GDPR Article 6(1)(f) [S22,
S23]. These processes demonstrate governance needs; they do not settle the
legality of Curiosity's own crawler or index.

## 10. Clean-room architecture lessons

| Public clue | Safe lesson | Boundary |
| --- | --- | --- |
| >100B known URLs, smaller selected index [S9] | discovery corpus, eligible corpus, and searchable corpus are distinct | do not copy selection logic |
| crawler + WDP + RSS/link reputation [S9, S14-S16] | use multiple discovery lanes with explicit provenance | WDP code/protocol/license review is separate |
| client aggregation and unlinkable records [S15, S16] | collect purpose-specific aggregates, not user histories | claims need threat-model validation |
| `page_age` vs fetch timestamp [S4] | separate valid/published time from observed/fetch time | provider dates remain uncertain |
| query rewrite and operator state [S4, S6] | preserve original, normalized, altered, and constrained queries | do not infer ranking internals |
| `mixed` references typed result arrays [S4] | separate retrieval sets from presentation composition | non-web clusters stay outside core |
| Goggles mutation flag [S7] | source policy is a named reranking stage | do not import DSL/code without review |
| overlap warning + continuation [S2, S3] | continuation is advisory; dedupe belongs to consumer | no snapshot guarantee |
| extra snippets [S1-S4] | retrieve multiple query-relative passages | anchor to owned captures before citing |
| additive versioning [S19] | pin versions and tolerate unknown response fields | vendor latest is not a stable contract |

**REJECTED (high confidence):** hidden-UA imitation, result scraping, proprietary
ranking reconstruction, using Brave data to bootstrap a competing index/model,
or treating first-party marketing metrics as benchmarks. These are unnecessary
for interoperability and cross explicit contractual/ethical boundaries.

## 11. Curiosity implications and verdict ledger

| Verdict | Decision |
| --- | --- |
| **ADOPTED** | explicit query budget; continuation-aware stopping; separate publication/fetch times; version pinning; typed failure classes; multiple passages; privacy-minimized signals |
| **ADAPTED** | market/language/SafeSearch/freshness/operator controls; query rewrite trace; Goggles-like policy stage expressed in Curiosity's own provider-neutral contract; mixed presentation separated from retrieval |
| **REJECTED** | Brave as owned-search foundation; snippets as citation evidence; opaque ranking as Curiosity relevance; hidden crawler identity; default forwarding of exact location; deep-page export assumptions |
| **DEFERRED** | any API pilot, enterprise ZDR/retention terms, storage rights, comparative relevance/latency study, and contract-specific attribution until separately authorized |

### Minimum provider-neutral mapping if later authorized

**RECOMMENDATION (high):** a future adapter may map only bounded Web results and
must retain provider-specific extensions without polluting the core contract:

```text
request: query + market + content_language + ui_language + freshness
       + safety_policy + spelling_policy + operator_policy + page_budget
trace: original_query + altered/cleaned_query + applied_operators
     + provider/version + page/rank + goggles_mutated + requested filters
result: url + title + untrusted_snippets[] + claimed_published_at
      + provider_fetched_at? + language? + structured_metadata?
warnings: partial clusters omitted + overlap possible + provenance incomplete
```

Then independently normalize/canonicalize, URL/content-deduplicate, fetch within
policy, create immutable capture/passage provenance, classify source type, and
evaluate contradiction/diversity. Provider rank must remain one signal, never a
truth or authority score.

## 12. Unknowns and verification plan

### Material unknowns

1. Auditable unique-document/index-size definition and language/region coverage.
2. Crawl frequency, canonicalization, duplicate clustering, and version history.
3. Exact ranking stages/features, diversity controls, spam-error rates, and
   snippet extraction/anchoring.
4. Complete error schema, auth/5xx behavior, timeout/SLA, response-size bounds,
   and retry idempotence.
5. Semantics/units of `fetched_content_timestamp` and interaction with cached
   responses.
6. Stable behavior under concurrent index updates and pagination overlap rate.
7. Exact rights under a purchasable Order Form for transient caches, citations,
   evaluation, and AI-assisted research.
8. Whether API core Web results always exactly match consumer Brave Search when
   optional consumer fallback/personal settings exist.

### Verification gates before any pilot

- **Legal:** reviewed Order Form, DPA/ZDR, storage/citation/evaluation rights,
  termination deletion, subprocessors, and source-content obligations.
- **Contract:** pinned date version and archived official schema; exact supported
  country/language enums; complete error body/headers obtained from Brave.
- **Offline fixture:** customer-supplied, license-safe response fixtures only;
  test unknown fields, absent/null clusters, decoration sanitization, malformed
  URLs, oversize strings, overlaps, and rewrite trace.
- **Authorized live test:** fixed multilingual/fresh/long-tail corpus; record
  latency, errors, duplicates, continuation accuracy, date accuracy, and primary-
  source recall without using results to train/evaluate an AI model unless the
  contract explicitly permits it.
- **Exit:** provider outage/termination drill and verified deletion workflow.

## 13. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1 (low) to 5 (high). Cost includes
access, legal, and clean-room risk.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Reconcile 30B vs 40B size claims | 5 | 4 | 4 | 1 | **Pursued:** found current first-party contradiction; report range, not false precision [S1, S18]. |
| Distinguish publication age from fetch time | 5 | 5 | 3 | 1 | **Pursued:** API reference + official skill establish separate fields [S3, S4]. |
| Determine dedupe/snapshot guarantees | 5 | 5 | 4 | 2 | **Pursued:** only overlap warning/continuation found; no snapshot or dedupe guarantee. Negative result retained. |
| Infer proprietary ranking weights/models | 2 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** contractually and ethically out of bounds; public aggregate signal classes are sufficient. |
| Call free/paid API for undocumented errors | 3 | 3 | 2 | 4 | **CURIOSITY_NO_GO:** no credentials or live-test authority; defer to a reviewed pilot. |
| Exhaustively transcribe every rich schema | 1 | 2 | 2 | 4 | **CURIOSITY_NO_GO:** outside core Web decision and likely to churn. |
| Jurisdiction-by-jurisdiction crawl opinion | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** requires counsel and Curiosity-specific crawl design. |
| Reverse engineer crawler identity | 1 | 1 | 3 | 5 | **CURIOSITY_NO_GO:** Brave intentionally withholds it; no legitimate interoperability need. |

**Stop condition:** coverage achieved for all requested categories; additional
public pages repeated product marketing, while remaining high-value unknowns
require contract documents or authorized live tests.

## 14. Source ledger

All sources are first-party Brave material and were accessed **2026-08-17**.
Vendor documentation proves documented behavior/claims, not comparative quality.

| ID | Primary source | Material used |
| --- | --- | --- |
| S1 | [Brave Search API product/pricing](https://brave.com/search/api/) | current $5 CPM, $5 monthly credit, 50 QPS, >30B, >100M updates/day, snippets, enterprise/ZDR |
| S2 | [Web Search service guide](https://api-dashboard.search.brave.com/documentation/services/web-search) | human-consumption boundary, freshness, locale, snippets, operators, pagination, safety, enrichments |
| S3 | [GET Web Search reference](https://api-dashboard.search.brave.com/api-reference/web/search/get) | authoritative request limits/headers/response classes/errors |
| S4 | [Official Brave Web Search skill](https://github.com/brave/brave-search-skills/blob/main/skills/web-search/SKILL.md) | expanded first-party response fields, fetch timestamp, mixed ordering |
| S5 | [Rate limiting](https://api-dashboard.search.brave.com/documentation/guides/rate-limiting) | sliding window, headers, successful-request billing |
| S6 | [Search operators](https://api-dashboard.search.brave.com/documentation/resources/search-operators) | operator syntax and experimental warning |
| S7 | [Goggles](https://api-dashboard.search.brave.com/documentation/resources/goggles) | reranking stage, syntax concepts, limits |
| S8 | [Search API Terms of Use](https://api-dashboard.search.brave.com/documentation/resources/terms-of-service) | 2026-02-11 license, restrictions, third-party rights, termination |
| S9 | [Search API security](https://api-dashboard.search.brave.com/documentation/resources/security) | >100B known/20B+ indexed clue, eligibility, safety, SOC 2 |
| S10 | [API comparison guide](https://brave.com/search/api/guides/what-sets-brave-search-api-apart/) | own index, 30B/100M, query/click inputs, traffic/latency claims, historical pricing |
| S11 | [Tailcat acquisition](https://brave.com/blog/brave-search/) | technology/team lineage and stated independent-search goal |
| S12 | [Search independence](https://brave.com/blog/search-independence/) | 2023 removal of Bing Web calls and earlier dependency ratios |
| S13 | [Brave Search beta](https://brave.com/blog/brave-search-beta/) | launch architecture claims and historical independence scope |
| S14 | [Brave Search crawler](https://search.brave.com/help/brave-search-crawler) | crawler, user-agent/Googlebot policy, noindex/refetch, WDP role |
| S15 | [WDP support article](https://support.brave.app/hc/en-us/articles/4409406835469-What-is-the-Web-Discovery-Project-) | opt-in data/signals, 20-user threshold, retention, fetch jobs |
| S16 | [WDP public design overview](https://github.com/brave/web-discovery-project/blob/main/modules/web-discovery-project/sources/README.md) | client aggregation, unlinkability, sanitization, double fetch, quorum, ranking-data purpose |
| S17 | [Consumer Search privacy](https://search.brave.com/help/privacy-policy) | consumer/index boundary, sole-index statement, RTBF; contrasted with API privacy |
| S18 | [Web Search API glossary](https://brave.com/search/api/glossary/web-search-api/) | July 2026 >40B index claim |
| S19 | [API versioning](https://api-dashboard.search.brave.com/documentation/guides/versioning) | URL/date versions and compatibility policy |
| S20 | [Status updates](https://api-dashboard.search.brave.com/documentation/resources/status-updates) | public incident history and launch date |
| S21 | [API privacy notice](https://api-dashboard.search.brave.com/documentation/resources/privacy-notice) | 90-day query logs, account data, customer duties, enterprise ZDR |
| S22 | [Index and RTBF](https://search.brave.com/help/brave-search-index-right-to-be-forgotten) | controller/legal basis, global review and delisting process |
| S23 | [DMCA process](https://search.brave.com/help/copyright-dmca) | copyright takedown governance |

## 15. Verification record

- Confirmed repository constitution before research; only this dossier was
  created.
- Confirmed endpoint, GET/POST parity, request limits, response groups, current
  pricing, rate semantics, terms date, and privacy retention against separate
  first-party pages.
- Triangulated index independence through crawler help, API docs, launch/history,
  WDP documentation, and index privacy pages.
- Retained rather than reconciled unsupported contradictions: 20B+/30B+/40B
  index figures and historical versus current pricing.
- Retained negative findings: no public auditable corpus count, rank score/model,
  canonical/dedup contract, snapshot pagination, immutable snippet anchor,
  complete public error expansion, or standard-plan SLA found.
- No credentials, endpoint calls, paid tests, bypass, copied code, or changes
  outside `docs/research/products/brave-web-search-api.md`.
