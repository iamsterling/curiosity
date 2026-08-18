# Parallel Search API: clean-room product and architecture study

**Research and source-access date:** 2026-08-17  
**Scope:** Parallel Web Systems' synchronous GA `POST /v1/search` API only.  
**Explicit exclusions:** Extract, Task, Responses, Chat, FindAll, Entity Search,
and Monitor are not analyzed here. They are mentioned only to prevent contract
conflation.  
**Method:** public first-party documentation, OpenAPI, product and engineering
announcements, crawler disclosures, status/trust pages, privacy policy, and
customer terms. No account, key, paid request, playground test, SDK/package
inspection, private material, access-control bypass, benchmark reproduction, or
implementation inspection was used.

## 1. Decision frame

**Decision:** which externally observable Search API ideas should Curiosity
adopt, adapt, reject, or defer while retaining a provider-neutral, bounded, and
wholly auditable retrieval design?

### Bounded sub-questions

1. What is the current GA request/response contract, including defaults, soft
   adjustments, hard bounds, missing pagination, and errors?
2. How do keyword queries, semantic objective, source policy, location, mode,
   session context, and output-size controls interact?
3. What do first-party sources establish about Parallel's crawler/index
   ownership, corpus freshness, request-time fetching, ranking, and excerpt
   production?
4. What provenance is returned, and what evidence identity is absent?
5. What operational, economic, privacy, safety, legal, and data-governance
   constraints matter at a Curiosity boundary?
6. Which architecture conclusions are defensible clean-room inferences rather
   than claims about proprietary internals?

### Epistemic rules

- **FACT** — directly stated by a cited first-party source or public schema.
  Scale, quality, and performance statements remain vendor claims even when the
  fact that Parallel published them is certain.
- **INFERENCE** — a bounded interpretation of public behavior; not a statement
  that undisclosed internals were observed.
- **RECOMMENDATION** — a Curiosity design conclusion.
- **UNKNOWN / NEGATIVE RESULT** — not established in the reviewed public
  material. Unknowns are not resolved in the vendor's favor.
- Confidence is **high**, **medium**, or **low**.

## 2. Executive verdict

**ADAPT as a hosted retrieval adapter and contract reference; REJECT as the
foundation of an owned search plane (high confidence).** Parallel Search has a
clear narrow boundary: one synchronous authenticated request returns an ordered
top-k of public-web URLs with objective-conditioned Markdown excerpts. It does
not return an answer, full page bodies, people/company entities, research jobs,
or monitoring events [S1–S4].

Its strongest contract ideas are:

- separate keyword branches from a richer semantic objective;
- make source eligibility, publication time, cache age, stale fallback, locale,
  result count, and excerpt volume explicit;
- return warnings when inputs are reduced or ignored rather than silently
  pretending full compliance;
- expose stable request/session identifiers and SKU usage; and
- default to bounded evidence excerpts rather than full documents [S1][S3–S7].

Its decisive limitations for Curiosity are equally clear. Search exposes no
document score, query-to-result association, pagination/cursor, canonical or
capture identity, fetch/index time, cache age, acquisition outcome, content
hash, passage offsets, extractor/ranker version, policy trace, safety label,
coverage accounting, or partial per-result error. Result order and mutable URLs
are therefore useful retrieval hints, not reproducible provenance [S1][S4].

Parallel has strong first-party evidence of operating a proprietary crawler and
web-scale index: named `ShapBot`, published crawler IPs, explicit crawl/index
claims, billions-of-pages and daily-update claims, and a publisher-partnership
program [S12–S18]. That does **not** prove every result is first-party crawled,
every indexed use is licensed on identical terms, or every page is current.

Privacy is a procurement blocker for sensitive queries unless separately
contracted. Marketing and FAQ pages say “Zero data retention” and “No training”
or “Never,” but current Customer Terms grant Parallel a perpetual,
sublicensable license to Customer Input and Output for improvement and expressly
permit model training. Search-specific EU processing without request/response
retention and enterprise ZDR are available in qualified arrangements [S19–S22].
The signed order, DPA, region, and negotiated terms—not marketing—must govern.

## 3. Product boundary: Search is retrieval, not research synthesis

| Capability | Search API behavior | Boundary |
| --- | --- | --- |
| Discovery | Searches across web pages | Yes |
| Fetch/extract | Returns compressed, relevant excerpts for discovered pages | Excerpts only; no full body |
| Ranking | Ordered URLs, decreasing relevance | No numeric score or explanation |
| Synthesis | None | Caller/model reasons over excerpts |
| Entity search | None as a specialized contract | A different product handles people/companies |
| Execution | Synchronous, vendor-positioned around 200 ms–3 s | No job lifecycle |
| Pagination/enumeration | None | One top-k, currently capped at 20 |

**FACT (high):** Parallel's own migration guide says Search returns compressed
excerpts, not full page bodies; synthesized answers/reports and people/company
search belong to other products. The pricing matrix also separates those
products by output and execution model [S4][S8].

**RECOMMENDATION (high):** preserve `search` as an evidence-candidate operation.
Do not widen it into “return whatever web intelligence the provider can make.”
Curiosity synthesis, extraction, entity enumeration, and recurring monitoring
need separate capability contracts and authority checks.

## 4. GA wire contract

### 4.1 Endpoint, authentication, and schema posture

**FACT (high):** the current endpoint is:

```http
POST https://api.parallel.ai/v1/search
x-api-key: <key>
Content-Type: application/json
```

The OpenAPI version is `0.1.2`, uses API-key authentication in the `x-api-key`
header, requires a JSON body, declares only 200 and 422 responses for this
operation, and sets `additionalProperties: false` on the top-level request and
`advanced_settings` [S1]. The old `/v1beta/search` contract is distinct and
should not be used for new integrations [S9][S10].

**FACT (high):** GA requires `search_queries`. Beta allowed either objective or
queries; GA's `objective` is optional. GA also moved filter/fetch/excerpt/result
controls under `advanced_settings`, promoted `max_chars_total` to the top level,
added `client_model`, and changed mode names/defaults [S9][S10].

### 4.2 Request fields and documented bounds

| Field | Type / default | Documented semantics and bound |
| --- | --- | --- |
| `search_queries` | required `string[]` | At least one non-empty query; 3–6 words recommended; 2–3 recommended; max 5; max 200 characters each. Items after five are dropped with `input_validation_warning` [S1][S3]. |
| `objective` | nullable string | Self-contained natural-language goal used with queries; may include source/freshness guidance; max 5,000 characters in the guide [S1][S3]. |
| `mode` | `turbo|fast|basic|advanced`; default `advanced` | Compound latency/cost/quality preset [S1][S5]. |
| `max_chars_total` | nullable integer | Upper bound over all returned excerpts; dynamic default based on queries, objective, and `client_model` [S1][S3]. |
| `session_id` | nullable string, max 1,000 chars | Correlates related calls; response always returns one. Reuse may improve contextual results [S1][S3]. |
| `client_model` | nullable string | Identifies generating/consuming model so Parallel can tailor optimization and defaults [S1][S3]. |
| `advanced_settings` | nullable object | Source policy, fetch policy, excerpt size, location, and result count [S1][S6]. |

**CONTRACT GAP (high confidence):** several guide constraints are not encoded in
the published OpenAPI schema. `search_queries` has no `minItems`, `maxItems`, or
item `maxLength`; `objective` has no `maxLength`; and the character controls
have no public minimum/maximum. Only `session_id.maxLength=1000` is mechanically
expressed among those text bounds [S1][S3]. Clients should validate the stricter
documented contract locally and preserve returned warnings.

### 4.3 Semantic objective versus keyword branches

**FACT (high):** Parallel recommends both a self-contained objective and two or
three concise keyword queries. The objective carries broader intent and soft
source/freshness guidance; queries are short retrieval formulations. Its sample
tool schema asks an LLM for exactly three diverse queries and explicitly tells
it not to use `site:` operators, but that is agent-tool guidance—not an API
schema prohibition [S3].

**FACT (high):** Parallel says multiple queries are searched in one call, yet
the response has one flat ordered `results` array with no query ID or query
association [S1][S4].

**UNKNOWN:** public material does not define:

- whether query branches execute independently or after joint rewriting;
- normalization, spell correction, supported operators, or maximum token count;
- branch-level candidate quotas, merge/fusion, deduplication, and diversity;
- whether one query can dominate the returned top-k;
- partial behavior when one query is invalid or has no hits; or
- whether objective guidance can override, expand, or merely rerank keyword
  candidates.

**RECOMMENDATION (high):** Curiosity should represent branches explicitly as
`{branch_id, text, intent, parent_id}` and retain both per-branch results and a
separate bounded merge. A provider adapter may send several strings to Parallel,
but it must map every returned branch association to `unknown`; it must not
invent one from excerpt text.

### 4.4 Advanced controls

#### Source policy

`advanced_settings.source_policy` contains [S1][S7]:

- `include_domains: string[]`: hard allowlist;
- `exclude_domains: string[]`: denylist;
- `after_date: YYYY-MM-DD`: content published on or after the date.

**FACT (high):** include plus exclude is capped at 200 entries. An apex domain
includes its subdomains; `www.` is normalized away; a leading-dot extension
such as `.gov` or `.co.uk` is supported. Schemes, paths, ports, and wildcard
syntax such as `*.org` are not. If include and exclude are both supplied,
include wins and exclude is redundant [S7].

**RECOMMENDATION (high):** model domain rules as normalized hostname/suffix
constraints, not arbitrary URL patterns. Post-validate returned URLs. A source
allowlist is an eligibility policy, not proof that a source is safe,
authoritative, independent, or factually correct.

#### Time and freshness policy

**FACT (high):** `after_date` is a publication-date lower bound. It is not a
fetch-time, crawl-time, modification-time, or index-time bound. There is no
before-date, relative-recency, sort-by-date, or returned date-provenance field
[S1][S7].

`advanced_settings.fetch_policy` contains [S1][S6]:

- `max_age_seconds`: age threshold that triggers live fetching; documented
  minimum 600 seconds;
- `timeout_seconds`: live-fetch timeout, number;
- `disable_cache_fallback`: default `false`; when false, an older cached copy may
  be returned after live-fetch failure/timeout; when true, documentation says
  an error is returned.

Default behavior is indexed/cached content with live fetch disabled. Live fetch
can materially increase latency [S1][S6].

**MATERIAL PROVENANCE GAP (high):** the response does not identify whether an
excerpt came from a qualifying cache entry, a live fetch, or stale fallback. It
also returns no cache age, fetch timestamp, or content version. The caller can
request a freshness policy but cannot audit its realized acquisition path from
the response [S1].

**UNKNOWN:**

- whether live fetching only refreshes excerpt content for already selected
  URLs or can add candidates and change ranking;
- what time reference and stored event defines cache “age”;
- whether a no-fallback live-fetch failure fails the whole request, drops an
  individual result, or returns another partial shape (Search has no per-result
  error array);
- valid minimum/maximum and default for `timeout_seconds`;
- whether fetch policy is supported identically by every mode; and
- publication-date extraction accuracy and boundary timezone.

#### Locale, result count, and excerpt volume

**FACT (high):** `advanced_settings.location` accepts a documented subset of
ISO 3166-1 alpha-2 country codes, is case-insensitive, and is normalized to
lowercase. Unsupported/invalid values are ignored with an input warning. The
list contains 37 countries/regions, including US, GB, China, Hong Kong, Taiwan,
Japan, India, major European markets, and selected Americas/APAC markets [S6].
It is described as geo-targeting, not a hard source-country filter.

**FACT (high):** `advanced_settings.max_results` must be greater than zero,
defaults to 10, and is currently capped at 20 for public Search modes. Higher
values are reduced to 20 with a warning; fewer than requested may be returned
[S6]. There is no cursor, offset, page, `has_more`, total-hit count, or snapshot
identifier in the request or response [S1].

**FACT (high):** `advanced_settings.excerpt_settings.max_chars_per_result` and
top-level `max_chars_total` are upper bounds. Excerpts may be shorter to improve
relevance/token efficiency. Defaults are intentionally dynamic [S1][S3][S6].

**UNKNOWN:** public docs expose no numeric ceiling/floor for either character
field, no maximum number of excerpts per result, no total response-byte limit,
and no character-count definition (Unicode scalar, code unit, byte, or other).

## 5. Search modes are opaque compound retrieval policies

| Mode | Vendor positioning | Published latency | List price / 1,000 default requests | Language note |
| --- | --- | ---: | ---: | --- |
| `turbo` | grounding/simple high-volume lookup | ~200 ms p50 | $1 | English and Japanese currently documented |
| `fast` | high-quality search within one second | <1 s | $1 | Not separately documented |
| `basic` | quick retrieval; deeper context than Turbo | ~1 s | $5 | broader multilingual coverage than Turbo |
| `advanced` (default) | highest-quality multi-hop retrieval/compression | ~3 s | $5 | broader multilingual coverage than Turbo |

Sources: [S5][S8][S17]. These are vendor targets/positioning, not an SLA or
independent latency measurement.

**FACT (high):** Parallel says Advanced spends more time querying, reranking,
and compressing across general-purpose and specialized indexes. It says Turbo
is the first product on a “new search architecture” spanning hardware, model
training, and index design [S13][S17].

**INFERENCE (high):** `mode` selects a compound serving plan, not a portable
scalar quality value. Candidate depth, index routes, models, reranking,
compression, freshness, and race/timeout policy may all vary. Turbo's separate
next-generation-stack statement also means one should not assume all modes
share a single serving implementation.

**UNKNOWN:** exact per-mode query/candidate budgets, models, index routes,
ranking features, compressor, stopping rule, freshness behavior, and Fast-mode
language coverage.

**DOCUMENTATION TENSION:** the April global-search announcement says queries in
any language are handled without configuration, while the current mode page
limits Turbo to English/Japanese and directs broader multilingual use to Basic
or Advanced; it says nothing about Fast [S5][S13]. Treat multilingual support as
mode-specific and capability-tested, not universal.

**RECOMMENDATION (high):** keep Parallel's labels inside its adapter. Curiosity's
portable budget should independently specify deadline, maximum branches,
candidates/results, excerpt bytes/tokens, freshness requirement, stale-fallback
permission, and spend ceiling. Returned metadata should record both requested
and resolved provider mode.

## 6. Response, ranking, content, and provenance

### 6.1 Response shape

The required success core is [S1]:

```json
{
  "search_id": "search_...",
  "results": [
    {
      "url": "https://example.test/page",
      "title": "nullable title",
      "publish_date": "2026-08-17",
      "excerpts": ["Markdown excerpt"]
    }
  ],
  "session_id": "session_..."
}
```

Top-level `warnings` and `usage` are optional/nullable. Each warning has a
forward-extensible type (`spec_validation_warning`, `input_validation_warning`,
or `warning` today), message, and optional object detail. Each usage item has a
SKU `name` and integer `count` [S1].

For each result, `url` and `excerpts` are required; `title` and `publish_date`
are nullable. `publish_date` is described as `YYYY-MM-DD`, but the response
schema does not apply JSON Schema `format: date`. The excerpt array has no
minimum item count. URL likewise has no URI format constraint in the public
schema [S1].

### 6.2 Ranking semantics

**FACT (high):** results are ordered by decreasing relevance. Marketing calls
the objective “semantic” and says pages and excerpts are ranked for token or
reasoning utility rather than human engagement. Advanced mode is explicitly
said to perform more querying, reranking, and compression [S1][S3][S13][S16].

**FACT (high):** no document score, rank number, score scale, retrieval lane,
feature contribution, confidence, or rank explanation is returned. Parallel's
migration guide explicitly instructs consumers to preserve order because there
is no per-result relevance score [S4].

**INFERENCE (medium-high):** public language supports a multi-stage retrieval
and reranking system with objective-aware passage/excerpt selection. It does
not establish dense-only retrieval, a particular lexical formula, vector model,
fusion algorithm, reranker, click feature, or authority/freshness weight.

**RECOMMENDATION (high):** preserve provider order; assign local ordinal rank;
never synthesize a numeric relevance score. Provider order may be one feature
for local fusion, but not calibrated evidence strength or factual confidence.

### 6.3 Excerpt semantics and evidence limits

**FACT (high):** excerpts are relevant webpage content formatted as Markdown,
compressed/densified for model context. Search does not return full page text,
images, an answer, citations-to-claims, or a research “Basis” object [S1][S4]
[S16].

**INFERENCE (high):** an excerpt is a derived retrieval artifact. Without page
version, offsets, hash, extraction time, or transformation version, the caller
cannot prove which source bytes produced it, reproduce it later, or distinguish
publisher text from generated/transformed formatting.

**Returned provenance:** URL, optional title, optional claimed/detected
publication date, excerpt text, provider search/session IDs, warnings, usage,
and result order [S1].

**Not returned / negative result:**

- original/final/canonical URL distinction, redirect chain, or duplicate cluster;
- source owner/publisher, MIME type, language, geographic origin, or license;
- crawl/fetch/index/excerpt timestamps and first/last seen;
- cache age, live-fetch success, or stale-fallback indicator;
- document/capture/passage ID, content hash, excerpt offsets, or surrounding
  source text;
- extractor/index/ranker/model version;
- query-branch association, rank score, stage trace, or exclusion reason;
- robots/directive decision, safety/moderation label, or malware status; and
- coverage, total hits, truncation rationale, partial failure, or reproducible
  snapshot [S1].

**RECOMMENDATION (high):** map absent fields to explicit `unknown`, not guessed
values. If Curiosity lawfully fetches a selected URL itself, create its own
immutable capture/version and passage anchors; never falsely attach those to the
provider excerpt as if Parallel supplied them.

## 7. Bounds, errors, rate limits, and price

### 7.1 Boundedness

**FACT (high):** one request has at most five accepted query strings and at most
20 results under current public modes; excerpts can be bounded per result and
globally; execution is synchronous [S3][S6][S8]. No pagination means ordinary
Search cannot enumerate an unbounded corpus [S1].

**LIMITATION:** there is no caller-declared wall-clock deadline in the Search
body, no hard provider-side dollar cap per request, and no disclosed response
byte ceiling. `fetch_policy.timeout_seconds` controls live fetching, not
necessarily total Search execution [S1]. Monthly platform spend limits are
notify-only and never block requests [S19].

### 7.2 Warnings and errors

**FACT (high):** current Search OpenAPI documents:

- `200` success;
- `422` validation failure in `{type:"error", error:{ref_id,message,detail?}}`
  form [S1].

Migration guidance says the wrong Bearer-style authentication returns 401.
Central documentation also lists 402, 403, 408, 429, 500, 502, and 503 classes
with retry advice, but that page is written primarily around Task and these
statuses are not enumerated on the Search operation [S4][S11]. The safe
conclusion is that 401/429/5xx are operationally plausible, not that every
generic description is a Search-specific wire guarantee.

**CONTRADICTION:** the generic error page's sample omits top-level
`type:"error"`, while the reusable OpenAPI `ErrorResponse` requires it [S1]
[S11]. Parse defensively while retaining `ref_id`, HTTP status, message, and
bounded detail.

**UNKNOWN:** Search-specific timeout status, `Retry-After` behavior, failed-call
billing, idempotency semantics, request-ID response headers, partial result
behavior, per-result live-fetch failure semantics, and whether transient errors
always use the published envelope.

**RECOMMENDATION (high):** normalize errors into typed local classes, redact
keys and potentially sensitive query detail, retry only explicit transient/rate
classes with bounded backoff/jitter, and never retry an uncertain billable POST
without a local duplicate budget.

### 7.3 Throughput and service commitment

**FACT (high):** default quota is 600 POSTs per minute to `/v1/search`; higher
limits require contacting support [S15]. The public status page showed the
aggregate API group operational at access time, but does not provide a
Search-specific SLA. Customer Terms promise only commercially reasonable 24x7
availability [S21][S23].

### 7.4 Pricing

**FACT (high, point-in-time):** default ten-result requests cost:

- `turbo` or `fast`: $1 / 1,000 requests ($0.001 each);
- `basic` or `advanced`: $5 / 1,000 requests ($0.005 each);
- every result/excerpt above the included ten: $1 / 1,000 ($0.001 per extra
  result in a request) [S5][S8].

At the current 20-result public cap, the documented formula implies a nominal
maximum of $0.011 for Turbo/Fast or $0.015 for Basic/Advanced per successful
20-result request, before retries, downstream model tokens, storage, or any
commercial variation. The response's optional usage list exposes SKU names and
counts, but no dollar amount [S1][S8].

**UNKNOWN:** failed-request billing, warning-adjusted billing, credit expiry and
refund rules, enterprise volume price, price-change mechanics beyond the terms'
14-day rule for ordinary increases, and whether fewer-than-requested extra
results are billed only when delivered [S8][S21].

**DOCUMENTATION DRIFT:** the API pricing/modes pages include `fast` at the same
price as Turbo, while the broader marketing pricing breakdown omits Fast. Free
usage is also advertised variously as 5,000 monthly requests, $5 monthly credit
plus signup promotions, and “up to 80,000 free search requests” [S5][S8][S16]
[S20]. These promotions do not define a dependable production entitlement;
the account's written order and current API-specific pricing should control.

**RECOMMENDATION (high):** enforce a local hard admission/spend ledger. Do not
treat notify-only monthly alerts as a safety boundary. Compute expected maximum
from resolved mode/result cap and reconcile response usage to invoices.

## 8. Index ownership, corpus, and freshness

### 8.1 What primary sources establish

The following first-party statements triangulate material ownership/control:

1. Parallel says every layer—crawl, index, query processing, and ranking—was
   built for AI and calls Search's index proprietary [S14].
2. The Search product page says the proprietary web-scale index contains
   billions of pages, adds millions daily, and intelligently recrawls [S16].
3. The April 2026 release calls it a rapidly growing proprietary global index,
   spanning 30+ countries, with general and specialized indexes [S13].
4. The launch changelog says Search was built on Parallel's custom crawler and
   index [S18].
5. `ShapBot` is a named discovery/indexing crawler with a published user agent
   and machine-readable IP list. Parallel says `robots.txt` can manage it
   [S12][S24].
6. Parallel distinguishes scheduled/index-building `ShapBot` from user-directed
   `Shap-User` requests [S12].
7. Index by Parallel provides publisher participation and contribution-based
   compensation; “no full corpus transfer required” implies that connected or
   partner-supplied access can complement ordinary crawling [S25][S26].

**VERDICT — FACT (high confidence):** Parallel owns and operates at least a
substantial crawler, index, query-processing, and ranking stack used by Search.
These are first-party claims about its system; corpus scale and performance were
not independently audited here.

### 8.2 What ownership does not prove

**UNKNOWN / NEGATIVE RESULT:** no reviewed primary source establishes:

- that every Search candidate is crawled solely by `ShapBot`;
- exact unique-canonical-page count, language/region/host coverage, or overlap;
- source feeds, licensed partner contribution, public-crawl contribution, and
  request-time fetch proportions;
- frontier discovery, sitemap/feed use, revisit scheduler, change detection,
  deduplication, canonicalization, spam policy, or deletion/takedown SLA;
- robots/noindex decision evidence for a returned capture;
- index-to-query lag distribution or freshness SLA; or
- rights/licensing status at the per-result or per-use level.

**RECOMMENDATION (high):** “proprietary index” must not be normalized to “all
content owned,” “all content exclusively first-party crawled,” or “all content
licensed for arbitrary reuse.” Curiosity should preserve source-level rights
and policy lineage in its owned corpus.

### 8.3 Five freshness dimensions that must stay separate

| Dimension | Parallel Search visibility |
| --- | --- |
| Publisher publication time | Optional `publish_date`; lower-bound filter available |
| Origin fetch time | Not returned |
| Index observation/update time | Not returned |
| Excerpt-generation time/version | Not returned |
| Request-time live/stale acquisition outcome | Policy selectable, outcome not returned |

**INFERENCE (high):** live-fetch policy can improve the content representation
used for excerpts, but it does not prove fresh discovery or immediate index
mutation. Publication filtering similarly does not prove a fresh capture.

**RECOMMENDATION (high):** Curiosity must expose all freshness clocks it owns,
plus requested policy, actual acquisition route, and fallback. For strict
currentness, a stale fallback should become a visible partial failure, not a
transparent success.

## 9. Clean-room architecture inference

The following is an independent conceptual model consistent with public
contracts. It is **not** a claim about Parallel source code or permission to
reproduce proprietary implementation:

```text
public web / publisher connections
  ├─ ShapBot scheduled discovery + recrawl
  ├─ partner/Index access paths (exact Search contribution unknown)
  └─ Shap-User request-directed fetch
          │
          v
  proprietary indexed/cache representations
  + broad and specialized retrieval indexes
          │
request: keyword branches + semantic objective + policies
          │
          ├─ validate / warn / cap
          ├─ interpret objective and query branches
          ├─ route by mode, locale, and source policy
          ├─ bounded candidate retrieval and merge/dedup (inferred)
          ├─ relevance/token-utility reranking
          ├─ cache-age decision and optional live refresh
          ├─ objective-conditioned excerpt selection/compression
          └─ ordered URLs + excerpts + IDs/warnings/usage
```

Supporting facts are the flat multi-query contract, source/index routing claims,
Advanced's extra querying/reranking/compression, Turbo's separate new stack,
cache/live controls, and token-relevance excerpt output [S1][S4][S13][S16]
[S17].

### Confidence by inferred component

| Inference | Confidence | Why |
| --- | --- | --- |
| Multi-stage retrieval then excerpt production | High | Ranked pages plus page-local objective-conditioned excerpts and explicit reranking/compression claims |
| Multiple index routes | High | General and specialized indexes are directly stated |
| Query fan-out then flat merge | Medium | Multiple query strings in one call and one result list; mechanics undisclosed |
| Mode-specific pipelines/budgets | High | Different latency/cost/depth and Turbo's next-generation stack |
| Dense/neural retrieval | Medium | Semantic/objective language and model-training claim; no exact candidate algorithm disclosed |
| Lexical retrieval | Medium | Keyword queries and index terminology support it, but no formula/path is stated |
| Live fetch occurs after initial candidates | Low | Plausible, but public docs do not define stage order |
| Per-result safety stage | Low | No public Search safety control, label, or architecture disclosure |

**UNKNOWN:** model vendors/topology, embeddings, lexical formula, candidate
depths, fusion, reranker inputs/weights, authority/link graph, freshness score,
personalization, location mechanics, dedup/diversity, compressor type, and exact
mode stopping/cancellation logic.

## 10. Privacy, safety, legal, and trust boundaries

### 10.1 Query privacy, retention, and training

**FACT (high):** Customer Terms define queries as Customer Input and returned
material as Customer Output. Customer retains title to Customer IP, but grants
Parallel a nonexclusive, worldwide, royalty-free, perpetual, sublicensable
license for service performance, development/improvement, QA/correction, and
aggregated/de-identified business use. The terms expressly say Parallel may use
Customer IP to train and improve ML/AI models [S21 §1, §4].

**MATERIAL CONTRADICTION (high):**

- FAQ: “Never. Inputs and outputs remain yours. We do not use customer data to
  train any models” [S19].
- Search product page: “Zero data retention” and “No training” [S16].
- Pricing: ZDR is an Enterprise feature [S20].
- Customer Terms: training and perpetual improvement rights are expressly
  permitted [S21 §4(b)].

The contractual text is the conservative self-serve interpretation unless a
signed order/DPA/ZDR amendment supersedes it.

**FACT (high):** the privacy policy says business customers selecting the EU
data-residency option can send Search requests to an EU endpoint; request and
response content are processed/served in the EU and not retained [S22]. This is
a Search-specific qualified option, not evidence that the default endpoint is
ZDR. The FAQ otherwise says encrypted-at-rest data is in US data centers and
TLS 1.2+ protects transit [S19]. SOC 2 Type I and II certification is claimed
[S19][S27].

**RECOMMENDATION (high):** do not send secrets, credentials, unpublished plans,
customer identifiers, personal/sensitive data, or proprietary query context
under self-serve assumptions. Before production, obtain the applicable signed
terms/DPA, region endpoint, retention/deletion schedule, subprocessor list,
logging/backups/support scope, and written resolution of the training conflict.

### 10.2 Search-result and agent safety

**FACT (high):** Search focuses on public web content accessible without login;
images are not accepted or returned. `ShapBot` can be managed with robots.txt;
`Shap-User` is a user-directed identifier rather than the automated indexing
crawler [S12][S19].

**NEGATIVE RESULT:** the Search request/response exposes no SafeSearch,
moderation, malware, prompt-injection, PII, publisher-trust, source-ownership,
robots-decision, or content-warning control/label [S1]. Neither domain policy
nor relevance ranking supplies those guarantees.

**RECOMMENDATION (high):** every URL, title, date, Markdown excerpt, warning,
and error detail is untrusted external data. Enforce URL canonicalization and
scheme policy, output byte limits, control-character/markup handling, prompt-
injection isolation, malware-aware downstream fetching, and no automatic tool
authority. Retrieval text must never become instructions.

### 10.3 Output rights and clean-room limits

Customer Terms allow adaptation/use of output in customer applications but
restrict cross-end-customer reuse, significant-output caching for AI/data
selling services, model training/synthetic data, database/data brokerage,
competitive use, scraping outside APIs, probing/model extraction, reverse
engineering, and publication of benchmarks without prior written consent
[S21 §2]. They also require independent verification, disclaim accuracy,
completeness, currentness, and uninterrupted/error-free operation, and require
human oversight for automated high-impact decisions [S21 §5, §8].

**RECOMMENDATION (high):** learn interface patterns only. Do not ingest Parallel
results as a Curiosity corpus, train on excerpts, publish comparative claims,
probe hidden ranking, or imply rights in underlying third-party pages. Any SDK
dependency would require a separate license review; none was needed here.

## 11. Curiosity implications and verdict ledger

### Adopted

1. **ADOPT — retrieval-only boundary (high).** Search returns ranked evidence
   candidates; synthesis remains a separate bounded researcher action.
2. **ADOPT — dual query representation (high).** Keep explicit keyword branches
   plus a self-contained semantic intent, with branch identity preserved.
3. **ADOPT — hard top-k and output budgets (high).** Bound branches, results,
   per-result passages, total characters/tokens/bytes, wall time, and spend.
4. **ADOPT — first-class policy and warnings (high).** Domain, time, locale,
   cache age, and stale fallback need request echoes plus machine-readable
   adjustments.
5. **ADOPT — passage-first delivery (high).** Default to bounded relevant
   evidence passages; fetch full versions only under separate authority.
6. **ADOPT — request/session/usage traceability (high).** Preserve provider IDs,
   warnings, resolved options, and billable SKUs.

### Adapted

1. **ADAPT — provider modes (high).** Map Turbo/Fast/Basic/Advanced only inside
   the Parallel adapter; expose portable stage/deadline/cost budgets elsewhere.
2. **ADAPT — source policy (high).** Normalize hostname/suffix rules, reject
   ambiguous syntax, post-validate results, and separate eligibility from trust.
3. **ADAPT — freshness controls (high).** Separate publication, fetch, index,
   extraction, and query times; report actual cache/live/fallback outcome.
4. **ADAPT — excerpts (high).** Add owned capture/version/passage hashes and
   offsets when Curiosity fetches lawfully; keep provider excerpts namespaced.
5. **ADAPT — warnings (high).** Treat truncation/ignored settings as structured
   partial compliance, not log-only prose.
6. **ADAPT — session context (medium).** Allow opaque provider correlation but
   never let it replace explicit local task IDs, retention policy, or input
   minimization.

### Rejected

1. **REJECT — Parallel as the owned search foundation (high).** Corpus,
   versions, ranking, freshness, and policy evidence remain proprietary.
2. **REJECT — opaque mode as sufficient boundedness (high).** It does not expose
   candidates, stages, bytes, exact deadline, freshness outcome, or hard cost.
3. **REJECT — result order as evidence confidence (high).** Rank is relevance,
   not factual probability or source authority.
4. **REJECT — URL plus excerpt as complete provenance (high).** It lacks
   immutable content identity and acquisition/extraction history.
5. **REJECT — transparent stale fallback (high).** Current response cannot prove
   freshness realization.
6. **REJECT — notify-only spend limit as control (high).** Curiosity needs local
   hard admission and reconciliation.
7. **REJECT — marketing ZDR/no-training as procurement evidence (high).** Terms
   conflict and product/region scope matters.

### Deferred

1. **DEFER — production adapter (medium-high).** Await contract/privacy review
   and authorized schema/error/freshness checks.
2. **DEFER — multilingual suitability (medium).** Mode-specific coverage and
   quality require a judged, authorized evaluation.
3. **DEFER — quality/price-performance claims (high).** Vendor benchmarks were
   not reproduced, and terms restrict benchmark publication.
4. **DEFER — partner/Index content use (medium).** Per-result rights and Search
   contribution are not exposed.

### Provider-neutral contract delta

Parallel validates a compact public adapter shape, but Curiosity's internal
evidence record should be richer:

```text
request_id, task_id, session_scope
branch_id, parent_branch_id, original_query, normalized_query, objective
requested/resolved mode and every applied policy
hard budgets: branches, candidates, results, passages, bytes/tokens,
              deadline, fetches, retries, cost
per result:
  local rank + provider rank (no invented score)
  original/final/canonical URL and redirect lineage
  document_id, capture_id, passage_id, passage offsets/hash
  fetched_at, indexed_at, first_seen_at, last_seen_at
  publisher-date claim + extraction evidence
  cache/live/stale-fallback state
  MIME/language/source-owner/duplicate cluster
  robots/rights/policy/safety decisions
  extractor/index/ranker versions and bounded stage trace
coverage, adjustments, partial failures, usage/cost
untrusted=true
```

The Parallel adapter must populate unsupported fields as `unknown`. It must not
turn `publish_date` into `fetched_at`, infer a score from rank, or describe a
requested freshness policy as a realized freshness fact.

## 12. Unknowns and pre-integration checks

### Safe contract checks requiring an authorized credential, but not a quality benchmark

1. Confirm exact validation for empty/oversized queries and objective.
2. Confirm numeric bounds and counting semantics for character fields and live
   timeout.
3. Confirm multi-query merge/dedup/top-k and partial-failure behavior.
4. Confirm source-policy matching for IDNs, trailing dots, public suffixes,
   redirects, and simultaneous include/exclude.
5. Confirm date inclusivity, timezone, missing-date behavior, and whether every
   returned result actually satisfies `after_date`.
6. Confirm whether response metadata can distinguish cache, live, and stale
   fallback through an undocumented field/header.
7. Confirm no-cache-fallback behavior when only some selected pages fail.
8. Confirm Search-specific 401/402/408/429/5xx envelopes, `Retry-After`, timeout,
   idempotency, and failed-request billing.
9. Confirm `usage` SKU counts for 10 versus 20 results and fewer-than-requested
   responses.
10. Confirm Fast-mode and each location's language behavior.

### Quality/safety checks requiring separate authorization and legal review

- coverage and freshness by language, country, domain, MIME type, and source
  class;
- relevance, query-branch coverage, deduplication, diversity, and stability;
- excerpt entailment, truncation, Markdown fidelity, and source-version drift;
- publication-date precision and cache/live behavior;
- prompt injection, malicious Markdown/URLs, malware, PII, and adversarial SEO;
- comparative quality, latency distributions, and cost at matched evidence
  utility.

None was executed. No live autonomous follow-up is authorized by this report.

## 13. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for relevance (R), decision value
(V), novelty (N), and cost (C; lower is better). Priority heuristic:
`R + V + N - C`. Only public primary-source work that could change the decision
was eligible.

| Thread | R | V | N | C | Score | Action/result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Search-specific data retention versus no-training claims | 5 | 5 | 5 | 1 | 14 | **Pursued.** Customer Terms materially contradict FAQ/product marketing; EU Search ZDR is a qualified option [S16][S19–S22]. |
| Owned index versus upstream-only SERP | 5 | 5 | 4 | 1 | 13 | **Pursued.** Crawler, IP list, product, launch, changelog, and publisher program triangulate substantial ownership [S12–S18][S24–S26]. |
| Fresh content versus fresh discovery | 5 | 5 | 4 | 1 | 13 | **Pursued.** Fetch policy governs cache/live content, while response omits acquisition/index timestamps; fresh discovery remains unproven [S1][S6]. |
| GA schema versus prose bounds | 5 | 4 | 4 | 1 | 12 | **Pursued.** Several guide limits are not encoded in OpenAPI; retained as contract risk [S1][S3][S6]. |
| Exact ranker/models/fusion weights | 3 | 2 | 4 | 5 | 4 | **CURIOSITY_NO_GO:** proprietary, unnecessary for the contract decision, and not publicly disclosed. |
| Paid/live quality and freshness benchmark | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO:** credentials and paid tests were explicitly forbidden; terms also require consent to publish evaluations. |
| SDK/package reverse engineering | 2 | 2 | 2 | 4 | 2 | **CURIOSITY_NO_GO:** current public OpenAPI is sufficient; package inspection was excluded and would add license risk. |
| Adjacent API deep dive | 1 | 1 | 2 | 4 | 0 | **CURIOSITY_NO_GO:** explicitly outside the caller's Search-only frame. |
| Crawl every publisher partnership/contract | 3 | 3 | 4 | 5 | 5 | **CURIOSITY_NO_GO:** private agreements and per-result licensing are unavailable; requires provider/legal confirmation. |

**Stop reason:** coverage and saturation. Every requested category has a
primary-source finding or explicit negative result. Remaining high-value gaps
require provider disclosure, credentials/paid execution, or a separately
authorized legal/evaluation frame.

## 14. Primary-source ledger

All sources were accessed 2026-08-17.

- **[S1]** Parallel, [Search OpenAPI reference](https://docs.parallel.ai/api-reference/search/search)
  and [public OpenAPI](https://docs.parallel.ai/public-openapi.json) — GA endpoint,
  authentication, request/response schemas, IDs, warnings, usage, and 422.
- **[S2]** Parallel, [Search API Quickstart](https://docs.parallel.ai/search/search-quickstart)
  — retrieval boundary, default Advanced mode, sample response.
- **[S3]** Parallel, [Search API Best Practices](https://docs.parallel.ai/search/best-practices)
  — query/objective limits, dynamic output sizing, session semantics, tool schema.
- **[S4]** Parallel, [Migrate to Parallel Search](https://docs.parallel.ai/search/migrate-to-parallel)
  — product separation, absent score/full body/answer/images, migration auth note.
- **[S5]** Parallel, [Search Modes](https://docs.parallel.ai/search/modes) — mode
  positioning, price/latency, default, and Turbo language scope.
- **[S6]** Parallel, [Advanced Search Settings](https://docs.parallel.ai/search/advanced-search-settings)
  — result cap, warnings, supported locations, fetch/source/excerpt controls.
- **[S7]** Parallel, [Source Policy](https://docs.parallel.ai/resources/source-policy)
  — domain/date semantics, normalization, syntax, and 200-domain bound.
- **[S8]** Parallel, [Parallel API Pricing](https://docs.parallel.ai/getting-started/pricing)
  — Search request/additional-result prices and product boundary matrix.
- **[S9]** Parallel, [Upgrade from Beta to GA](https://docs.parallel.ai/search/search-migration-guide)
  — endpoint, required query, nesting, and mode/default migration.
- **[S10]** Parallel, [legacy Search OpenAPI](https://docs.parallel.ai/api-reference/legacy/search-beta/search)
  — historical beta contract used only to establish drift.
- **[S11]** Parallel, [API Error Codes and Warnings](https://docs.parallel.ai/resources/warnings-and-errors)
  — generic status/retry guidance and conflicting error example.
- **[S12]** Parallel, [Overview of Parallel Web Systems' Bots](https://parallel.ai/parallel-web-systems-bots)
  — `ShapBot`, `Shap-User`, robots distinction, publisher contact.
- **[S13]** Parallel, [Upgrades to the Parallel Search & Extract APIs](https://parallel.ai/blog/parallel-search-api),
  2026-04-21 — general/specialized indexes, Advanced pipeline, global coverage.
- **[S14]** Parallel, [Introducing Parallel](https://parallel.ai/blog/introducing-parallel),
  2025-08-14 — first-party crawl/index/query/ranking and proprietary-index claims.
- **[S15]** Parallel, [API Rate Limits](https://docs.parallel.ai/getting-started/rate-limits)
  — 600 Search POSTs/minute.
- **[S16]** Parallel, [Search API product page](https://parallel.ai/products/search)
  — index scale/update, crawler/robots, token relevance, product security claims.
- **[S17]** Parallel, [Introducing Parallel Search Turbo](https://parallel.ai/blog/parallel-search-turbo),
  2026-07-13 — Turbo price/latency and next-generation architecture claim.
- **[S18]** Parallel, [API Changelog](https://docs.parallel.ai/resources/changelog)
  — Search launch/GA, mode chronology, custom crawler/index statements.
- **[S19]** Parallel, [Parallel API FAQs](https://docs.parallel.ai/resources/faqs)
  — public-web scope, spend alerts, security/storage, SOC 2, no-training claim.
- **[S20]** Parallel, [Pricing](https://parallel.ai/pricing) — marketing matrix,
  free-credit statements, and Enterprise ZDR/DPA controls.
- **[S21]** Parallel Web Systems Inc., [Customer Terms and Conditions](https://parallel.ai/customer-terms)
  — rights, data license/training, output reuse, evaluation/reverse-engineering
  restrictions, service commitment, disclaimers, and high-impact decisions.
- **[S22]** Parallel, [Privacy Policy](https://parallel.ai/privacy-policy) — EU
  business-customer Search endpoint and request/response non-retention.
- **[S23]** Parallel, [Status page](https://status.parallel.ai/) — aggregate API
  operational view at access time.
- **[S24]** Parallel, [`shapbot.json`](https://docs.parallel.ai/resources/shapbot.json)
  — published crawler IP prefixes and creation timestamp.
- **[S25]** Parallel, [Introducing Index by Parallel](https://parallel.ai/blog/introducing-index-by-parallel),
  2026-05-19 — publisher participation and contribution compensation.
- **[S26]** Parallel, [Index by Parallel](https://index.parallel.ai/) — publisher
  connection model and “no full corpus transfer required.”
- **[S27]** Parallel, [Trust Center](https://trust.parallel.ai/) — public
  security/compliance portal description.

## 15. Confidence summary

| Area | Confidence | Basis |
| --- | --- | --- |
| GA endpoint and core schema | High | Current OpenAPI plus GA migration guide |
| Guide-level query/result/domain bounds | High | Current first-party guides; some are not schema-encoded |
| Mode price and published latency | High that published; low as an SLA | Current mode/pricing pages; no independent calls |
| Ranking/output semantics | High for order/no score; medium for pipeline inference | Explicit schema/migration text plus vendor architecture descriptions |
| Owned crawler/index | High | Multiple direct disclosures, named bots/IPs, product and publisher program |
| Actual corpus scale/coverage/freshness | Low-medium | Vendor claims only; no audit or live test |
| Live-fetch policy | High for requested semantics; low for realized behavior | Explicit fields but no acquisition metadata or experiment |
| Provenance gaps | High | Direct negative result from current schema |
| Privacy/training conflict | High | Current first-party FAQ/product/terms conflict is explicit |
| Search safety behavior | Low | No Search-specific public control, label, or detailed policy |
| Production fitness for Curiosity | Medium-low | Material unknowns and no authorized runtime/procurement verification |

**Final verdict:** **ADOPT** Parallel's narrow retrieval boundary, dual
query/intent shape, bounded excerpts, source/freshness policy, warnings, and
usage trace. **ADAPT** modes, sessions, filters, freshness, and excerpts into a
provider-neutral contract with immutable owned evidence. **REJECT** hosted
opacity as the owned foundation, rank as confidence, URL/excerpt as full
provenance, silent stale fallback, notify-only spend control, and marketing
privacy assurances without governing terms. **DEFER** production integration,
multilingual claims, comparative benchmarks, and publisher-partner assumptions
until separately authorized contract, legal, and empirical checks close the
listed gaps.
