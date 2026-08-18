# Jina Search: standalone clean-room product reconstruction

**Primary-source access date:** 2026-08-17  
**Scope:** hosted `s.jina.ai` Search. Reader is considered only where Search
uses its fetch/extract contract or infrastructure. Reader as a standalone
product is out of scope.  
**Status:** research and architecture recommendations only; not an
implementation, benchmark, procurement approval, legal opinion, or production
test.  
**Overall confidence:** high for the public API and pinned public source;
medium for the correspondence between that source and the hosted service; low
for hosted storage/index/ranking internals that Jina explicitly omits.

## Executive verdict

**REJECTED as Curiosity's owned public-web index or foundational discovery
plane (high confidence).** Jina's own architecture says Search "primarily
relies on external SERP providers." Its public source attempts Google/Bing
paths, stores SERPs, can race them against a hosted-only local index, and then
hydrates candidate URLs with the Reader crawler. No primary evidence supports
a Jina-owned, independently crawled broad-web corpus. The most supportable
description is **SERP orchestration + demand-shaped cache/index + page
hydration**, not an owned web search engine [S2][S3][S4].

**DEFERRED as an optional hosted search adapter (medium confidence).** The
surface is convenient and unusually controllable, but it fuses discovery with
multi-page fetch/extraction, does not expose provider/rank/cache lineage, can
silently fall back to stale SERP state, ignores its advertised token-budget
guard on Search, and gives incomplete per-result failure provenance. It also
sends queries and selected URLs across Jina and upstream-provider trust
boundaries. An adapter would require legal, privacy, reliability, cost, and
quality gates [S1][S4][S6].

**ADAPTED, not copied:** explicit result-type, locale, provider, count, cache,
format, and output controls are useful. Curiosity should instead separate
`discover` from `fetch/extract`, return lean candidates by default, expose every
freshness clock and supplier/rank transition, enforce aggregate budgets, and
make stale or partial outcomes explicit.

## 1. Decision frame and clean-room boundary

### 1.1 Bounded sub-questions

1. What request, response, streaming, authentication, pagination, error, and
   billing contracts are publicly observable?
2. Who appears to own candidate supply, crawling, index state, and ranking?
3. Which controls affect query matching, geography/language, result type,
   hydration, freshness, and output size?
4. What provenance, privacy, safety, and operational guarantees are present or
   absent?
5. What architecture is justified by primary evidence without claiming hidden
   hosted details?
6. Which ideas should Curiosity adopt, adapt, reject, or defer?

**Coverage threshold:** evidence for every requested category; explicit
fact/inference/unknown labels; hosted-versus-OSS distinction; concrete
Curiosity consequences. **Stop conditions:** coverage, repeated evidence, or a
remaining question that requires credentials, a paid call, restricted hosted
code, access-control bypass, or speculative inference.

### 1.2 Method and legal/access boundary

- Read Jina's live Search OpenAPI (`0.5.0+4e81fa5`), product/FAQ/pricing page,
  launch article, legal page, status page, and official public repository [S1]
  [S5-S8].
- Inspected only intentionally public Apache-2.0 source, pinned to the public
  `main` head `1574bfd380d249c86c82db4dace0d9c8fe17e2b1` (commit timestamp
  2026-05-22). The README says this is the OSS branch behind `r.jina.ai` and
  `s.jina.ai`, but the MongoDB-backed SaaS storage layer is removed [S2-S4].
- Made no Search-content request, used no API key or credential, incurred no
  paid call, accessed no private endpoint, and tested no blocked/private target.
- Jina's service terms prohibit reverse engineering of the Services and using
  Output to develop competing services. This report therefore reconstructs
  only published contracts and architecture from public documentation and
  licensed public source; it derives no hidden implementation and transfers no
  service Output, code, model, or data [S6].

Labels used below:

- **FACT** — directly stated by a cited first-party source or present in the
  pinned public source.
- **INFERENCE** — bounded interpretation of facts, not a hosted measurement.
- **RECOMMENDATION** — proposed Curiosity decision.
- **UNKNOWN** — public evidence is absent, conflicting, or hosted-only.

Vendor descriptions establish representations, not independently measured
coverage, relevance, freshness, security, latency, or uptime.

## 2. Product boundary and core contract

### 2.1 What Search is

**FACT (high):** Jina markets Search as web search whose result pages are also
fetched and converted into LLM-friendly content. The README is explicit:
Search obtains top candidates, visits each URL, and reuses the Reader stack.
Reader is therefore a runtime dependency of Search, but Search also decides
candidate supply and ordering [S2][S5].

**INFERENCE (high):** Search is not a conventional lean SERP API. One request
combines at least three epistemically different operations:

```text
candidate discovery/ranking
  -> page selection and fetch
  -> extraction/formatting
```

A failure or stale state in any stage can alter the final list, while the
public result does not fully identify which stage produced the change.

### 2.2 Endpoint, authentication, and transport

**FACT (high):** the live OpenAPI exposes `GET` and `POST` on both `/search` and
`/{q}`. A query may be path-encoded or supplied as `q`. Supported response
media are `text/plain`, `application/json`/`text/json`, and
`text/event-stream`. Current source requires `Authorization: Bearer <token>`
for an actual search; requesting the root/index without a query can return an
informational response [S1][S4].

**Documentation drift (high confidence):** the 2024 launch article advertised
anonymous Search at 5 RPM; the 2026 product table leaves unauthenticated Search
blank and the current source rejects anonymous searches. Treat the launch
article as historical, not current contract [S4][S5].

### 2.3 Search-specific request fields

| Field | Public/source contract | Important qualification |
| --- | --- | --- |
| `q` or path | Search query | No documented max length or normalization trace. |
| `type` | `web` default, `images`, `news` | Non-web modes have different providers/output fields and higher source-level charge scalar. |
| `count` / `num` | validated 0–20; public source default 10 | Product copy still says top five. Zero is accepted, but source behavior is not a reliable zero-result contract. |
| `provider` / `engine` | `google`, `bing`, `reader` | `reader` means the hosted local index, not the Reader URL-fetch API. Provider actually used is not returned. |
| `gl` | validated country code | Passed as an upstream geography/market hint; hard-filter semantics are not promised. |
| `hl` | validated language/interface code | Not equivalent to guaranteed result-language filtering. |
| `location` | free-form string | Forwarded only on paths that support it; public semantics and validation are absent. |
| `page` | number, no published bound/default | Provider-specific page steering; no cursor or snapshot identity. |
| `fallback` | boolean, source default false | If the selected path yields no results, may use local-index results already prepared. |
| `nfpr` | boolean | Passed into Google-style search; public docs do not normatively explain it. |
| `site`, `ext`, `filetype`, `intitle`, `loc` | repeatable explicit operators | Appended to the query using Google-style syntax and Boolean grouping. |

[S1][S4]

**FACT (high):** repeated explicit-operator values are joined with `OR`; groups
for different operator names are joined with `AND`. The local index parser
implements only `site:` and `-site:` specially. Thus the same public query can
have materially different filter semantics when external SERP and local-index
paths race [S4].

**UNKNOWN (medium):** behavior for empty query, very long query, negative or
fractional `page`, conflicting `count`/`num`, conflicting `engine`/`provider`,
unsupported operator syntax, duplicate operators, and whether `gl`, `hl`, or
`location` are hard filters versus ranking hints for every provider. OpenAPI
describes parsing, not cross-provider semantic equivalence.

### 2.4 Inherited fetch/output controls

Search inherits a large Reader-oriented surface because each candidate may be
fetched. Search-relevant groups include [S1][S2][S4]:

- **cache/freshness:** `X-No-Cache`, `X-Cache-Tolerance`, `DNT`;
- **page representation:** content/Markdown/HTML/text, screenshot/pageshot,
  frontmatter, chunks, links/images/media, and VLM/ReaderLM modes;
- **rendering:** engine, timeout/readiness, locale, selectors, iframe/shadow
  inclusion, user agent, referer, viewport, scripts, cookies, and proxies;
- **bounds:** `X-Max-Tokens` (minimum 500) trims; `X-Token-Budget` rejects Reader
  overages but the live Search docs explicitly say it is ignored by Search.

**RECOMMENDATION (high):** do not expose this cross-product as Curiosity's
provider-neutral discovery ABI. Most are document-fetch policies, not search
policies. A discovery call should return bounded candidates; a later selected
fetch should carry render/extraction controls.

## 3. Response, ranking, and result semantics

### 3.1 JSON and text shape

**FACT (high):** JSON success is an envelope with HTTP-like `code` (default
200), application `status` (default 20000), `data`, and optional `meta`.
`data` is an array of formatted pages. Only each result's `url` is schema-
required. Optional fields include `title`, `description`, `content`, `chunks`,
`publishedTime`, `html`, `text`, screenshot/pageshot URLs, page count, links,
images, warning, metadata, external relations, and—in the live schema—target
HTTP status/text and browser storage state [S1].

**FACT (high):** plain text numbers each result and may include title, source,
URL, image URL/dimensions, description, date/published time, favicon, followed
by hydrated content and optional image/link sections. SSE emits progressive
`data` events containing evolving arrays; failures during collection are sent
as an `error` event before stream end [S4].

**INFERENCE (high):** SSE snapshots are mutable progress views, not independent
ranked pages. Consumers need deduplication/version rules and must not treat an
early event as final merely because its transport succeeded.

### 3.2 Candidate order and qualification

**FACT (high):** external SERP entries are mapped to title, URL, snippet and
selected date/image/source fields. Search then fetches all candidate URLs. A
page is considered qualified if it has a title plus content, or if a screenshot,
pageshot, text, or HTML representation exists. Reorganization prefers qualified
pages but preserves their original array order; no public-source document-level
reranker is applied [S4].

**INFERENCE (high):** for external results, rank is principally inherited from
the winning Google/Bing/Serper path. Hydration behaves as a qualification and
availability filter, not an explained relevance reranker. Local-index results
instead inherit an undisclosed hosted score/order. Because an entire local or
external path can win a race, two equivalent requests need not share either
candidate universe or ranking function.

**FACT (high):** neither the public result schema nor formatted text returns
the upstream provider, original position, local-index score, race winner,
reason for qualification, or removal reason [S1][S4].

**UNKNOWN (high impact):** relevance features, local score formula, score
calibration, personalization, authority/spam/safety signals, commercial
influence, deduplication/canonicalization, host diversity, and result stability.
No public evidence establishes a Jina reranker in this Search path merely
because Jina separately sells reranking models.

### 3.3 Result-count contradiction

- **FACT:** product and README copy repeatedly say top five [S2][S5].
- **FACT:** live OpenAPI and source accept 0–20; source default is 10 [S1][S4].
- **FACT:** a helper has an internal fallback target of six, but normal request
  flow passes the caller/default count, so six is not a safe public default [S4].

**Verdict:** the durable contract is unresolved. An adapter must always send an
explicit count and accept fewer/partial results. It must not assume five, six,
or ten from marketing/history.

### 3.4 Partial-result behavior

**FACT (high, public source):** individual candidate fetch/format failures can
be caught and mapped to empty objects during fan-out. If the desired qualified
set is never reached, non-streaming flow can still return the last available
array. The public response has only optional `warning`; there is no required
per-hit status, failure stage, retryability, or completeness marker [S4].

**INFERENCE (high):** HTTP 200 does not prove that every requested result was
fetched, content-complete, or from the same freshness state. Empty content may
mean a genuinely sparse page, extraction failure, policy block, timeout, cache
artifact, or requested no-content mode.

## 4. Upstream supply and index ownership

### 4.1 Direct ownership evidence

**FACT (high):** Jina's architecture states that Reader/Search "primarily
relies on external SERP providers for web search results" [S3].

**FACT (high):** the pinned source has the following provider order [S4]:

- default: Serper Google when configured, native Google path, native Bing path,
  then another common Google SERP path;
- Google preference: native Google, Serper Google when configured, common
  Google path;
- Bing preference: Serper Bing when configured, then native Bing.

Provider errors are tried sequentially until one path returns. Serper code
targets `google.serper.dev` and `bing.serper.dev`; native paths retrieve and
parse public Google/Bing result pages [S4].

**INFERENCE (high):** the candidate corpus, first-stage ranking, geographic
coverage, safe-search defaults, and deletion latency are largely upstream
properties on these paths. Jina owns orchestration, caching, hydration, and
formatting, but that is not ownership of the underlying broad-web index.

### 4.2 What the local index is

**FACT (high):** public models define `IndexedPage` fields for URL digest,
domain/TLD, language, geolocation, title, description, text, semantic text, and
created/published/scraped/expiry times. The storage interface exposes
`indexWebSearchEntry`, `indexSnapshot`, and `searchLocalIndex`; local search
results model a score, highlights, and sequence [S4].

**FACT (high):** successful external web SERP entries are submitted to
`indexWebSearchEntry`. Search-hydrated snapshots are marked eligible for page
indexing. Explicit `provider=reader` searches this local index. Ordinary cached
web search can race the external/cached-SERP generator against local search;
the faster usable path may become the response [S4].

**FACT (high):** all these indexing/search methods are no-ops in the OSS
`StorageLayer`. The README and architecture say the MongoDB-backed SaaS storage
and indexing layer is removed from the public branch [S2-S4].

**INFERENCE (high):** public evidence supports a **demand-shaped derivative
index** populated by previously observed upstream SERPs and Search/internal
page fetches. It can improve latency, resilience, and accumulated coverage, but
is not evidence of independent crawl discovery or broad-web completeness.

**UNKNOWN (low confidence):** hosted index engine, analyzer/tokenization,
whether `semanticText` is populated, embedding/ranking model, update/delete
policy, corpus size, language coverage, spam controls, source proportions,
retention, and percentage of queries won by local search. MongoDB Atlas is
described as metadata indexing/storage, but that does not disclose the search
index implementation or ranking algorithm [S3].

### 4.3 Supported architecture reconstruction

```text
query + search controls
  -> authentication / rate / balance checks
  -> query-operator normalization
  -> for ordinary cached web search:
       external/cached-SERP path  <race>  hosted local-index path
     otherwise:
       explicitly selected path/provider
  -> external provider fallback order (Serper/Google/Bing variants)
  -> SERP cache and derivative indexing
  -> candidate URL hydration through Reader crawler
  -> extraction / formatting / qualification
  -> plain text | JSON envelope | progressive SSE
  -> usage report / token charge
```

**FACT (high):** Jina describes the shared application as multi-threaded
Node.js on GCP Cloud Run. SaaS uses MongoDB Atlas for metadata indexing and
rate limits, Google Cloud Storage for cache data, and private VPC links for
billing/model dependencies. It reports independent US and EU clusters [S3].

**INFERENCE (high):** Search's separate failure domains include auth/billing,
external provider supply, SERP parser drift, local index/storage, page egress,
browser/curl extraction, and response formatting. A 2.5-second vendor average
cannot characterize this multi-stage tail [S5].

## 5. Query controls, pagination, freshness, and temporal meaning

### 5.1 Filter and locale semantics

**FACT (high):** Search exposes web/image/news type, country (`gl`), interface
language (`hl`), free-form location, provider, page, and Google-style explicit
operators. It does **not** expose a typed publication date range, crawl-date
range, freshness boost, sort-by-date, domain exclusion list, license filter,
safe-search control, source-quality control, or diversity control [S1].

**INFERENCE (high):** `site`/file/title operators are query syntax delegated to
heterogeneous providers, not provider-neutral verified filters. Local Search
only parses site inclusion/exclusion. Curiosity must type a control as `filter`,
`boost`, or `hint` and verify postconditions rather than assume names imply hard
constraints.

### 5.2 Pagination is page steering, not stable continuation

**FACT (high):** `page` is an unbounded numeric request parameter. Native
Google turns it into `start=(page-1)*num`; native Bing turns it into its own
`first`/`FORM` parameters. The local-index search interface receives no page or
offset. The response has no next-page token, total count, result-set ID, index
generation, or snapshot timestamp [S1][S4].

**INFERENCE (high):** pagination is neither stable nor semantically uniform.
With `provider=reader`, `page` is effectively unsupported by the public local
interface. In normal web mode, a local-index race can answer a page request
without using its page number. Across external pages, upstream index/ranking
changes can create duplicates or omissions. Curiosity should not map this to a
strong cursor abstraction.

### 5.3 Three independent freshness clocks

**FACT (high, pinned source):** Search has at least these distinct states [S4]:

1. **SERP cache:** records retained seven days, considered fresh for one hour.
2. **Stale SERP fallback:** if live provider retrieval fails and an older record
   exists, source flow silently yields that record, potentially up to retention.
3. **Hydrated page cache:** Search declares a 24-hour default constant. However,
   it passes that millisecond value back through a request parser that multiplies
   cache tolerances (documented in seconds) by 1,000. On the inspected path this
   appears to turn the intended 24 hours into 1,000 days; because snapshots are
   retained for seven days, the practical source behavior could accept any
   retained snapshot. This is a public-source unit mismatch, not a hosted
   measurement; the actual hosted default is therefore unknown.

These source defaults differ from the product FAQ's Reader-specific statement
that the same URL within five minutes is cached. That FAQ is not a reliable
Search freshness specification [S4][S5].

**FACT (high):** `publishedTime` can be derived from parsed page metadata,
`article:published_time`, or HTTP `Last-Modified`; the result does not identify
which source supplied it. SERP-level `date` may also be separately formatted in
plain text [S4].

**INFERENCE (high):** one response can combine a fresh query time, stale SERP
candidates, independently cached pages (possibly older than the intended
24-hour tolerance in the public branch), and heterogeneous publisher/HTTP
dates. "Latest world knowledge" is marketing intent, not a freshness or
temporal-provenance guarantee [S5].

**RECOMMENDATION (high):** Curiosity must return separate
`query_observed_at`, `supplier_observed_at`, `serp_cache_created_at/age`,
`document_fetched_at/cache_age`, `source_claimed_published_at`, and
`source_claimed_modified_at`, each with source and confidence. Stale fallback
must be opt-in or clearly labeled.

## 6. Errors, limits, pricing, and operations

### 6.1 Typed endpoint errors

The live OpenAPI declares [S1]:

| HTTP | Application status | Meaning/schema |
| ---: | ---: | --- |
| 400 | 40001 | parameter validation |
| 401 | 40102 / 40103 | authentication failed / required |
| 402 | 40203 | insufficient balance |
| 403 | 40305 | abuse alleviation / forbidden |
| 422 | 42206 | assertion failure, including no usable search/content |
| 429 | 42903 | rate limit; optional retry seconds/date |
| 500 | 50002 | downstream service failure |
| 503 | 50304 | service bad attempt/unavailable |

Error objects require `code`, `status`, and `message`, with optional readable
message and class-specific fields. There is no public idempotency key,
request ID, per-provider attempt trace, or guaranteed `Retry-After` HTTP header.

**RECOMMENDATION (high):** normalize transport and application status; preserve
retry timing; retry only bounded transient 429/500/503 failures; never retry
400/401/402/403/422 blindly; cap aggregate calls and charges; and represent
per-hit hydration failure separately from query failure.

### 6.2 Request/output bounds

- **FACT:** count is at most 20; fetch timeout is at most 180 seconds; per-page
  max-token trimming is minimum 500 [S1].
- **FACT:** Search ignores `X-Token-Budget`, so its own output/cost guard is not
  effective for this endpoint [S1][S2].
- **FACT (source, not hosted promise):** internal charge is capped at two
  million tokens, but no public aggregate response-byte, decompressed-byte,
  redirect, subresource, or total-hydration token bound is documented [S4].

**INFERENCE (high):** max 20 URLs is a fan-out bound, not an output bound. Up to
20 hydrated pages, optional links/images/HTML/screenshots, and progressive
copies can be very large. Search also starts expensive hydration before final
qualification, so output trimming does not bound upstream work.

### 6.3 Published limits and economics on access date

| Tier | Search RPM | Authentication | Published counting |
| --- | ---: | --- | --- |
| No key | not offered/blank | rejected by current source | n/a |
| Free key | 100 | bearer key | fixed, starting at 10,000 tokens/request |
| Paid key | 100 | bearer key | same published scheme |
| Premium key | 1,000 | bearer key | same published scheme |

**FACT (high):** Jina advertises ten million free tokens on a new key, average
Search latency of 2.5 seconds, shared key/balance across Search Foundation
products, and no token deduction for failed requests. Generic FAQ concurrency
figures are free 2, paid 50, premium 500, with a 10,000 requests/60-second IP
cap; these generic numbers coexist with product-specific RPM [S5].

**FACT (high, pinned source):** charge is the greater of hydrated-content
charge and a result floor: `ceil(returned_results/10) * 10,000 * scalar`, capped
at two million. The source uses scalar 3 for explicit Bing and 5 for image/news
(the latter assignment supersedes 3), and can distribute floor usage across
results. These are source observations, not a current commercial promise [S4].

**UNKNOWN (medium):** exact top-up package prices are key/checkout-gated; no
credential was supplied. Also unknown are taxes, refunds for partial success,
whether hosted billing exactly matches the public branch, and billable effects
of retries, cached pages, output modes, count zero, or progressive responses.
No responsible cost-per-answer follows from the token floor alone.

### 6.4 Reliability evidence

**FACT (medium):** the vendor status page showed 99.98% 90-day uptime for
`s.jina.ai` at access. Recent Search incidents included regional degraded
performance with P99 around 10.7–12.6 seconds and ~10–11% errors (US East), and
P99 around 61–70 seconds in US West. These are vendor telemetry and incident
thresholds, not a contractual SLA [S7].

**RECOMMENDATION (high):** treat Search as a fallible optional dependency:
deadline, circuit breaker, bounded jittered retry, region-aware health,
provider-level telemetry where available, and an owned fallback. Do not hide
staleness to improve apparent availability.

## 7. Provenance, privacy, and safety

### 7.1 Provenance retained versus missing

**FACT (high):** output can retain source URL, title, snippet/description,
content, links/images, page metadata, warnings, and date-like fields [S1][S4].

The mandatory public contract does not preserve [S1][S4]:

- actual upstream provider/local index and original rank or local score;
- query rewrite/operator interpretation and race/fallback path;
- query execution, SERP cache creation/age, or stale-fallback indicator;
- requested URL, redirects, final/canonical URL as separate identities;
- mandatory target HTTP result, fetch start/end, page-cache age, ETag, or
  distinct `Last-Modified` (live schema fields remain optional);
- capture/content hash, immutable version ID, renderer/extractor version;
- publication-time source/confidence;
- passage offsets/anchors back to captured bytes/DOM;
- complete per-result policy/fetch/extract failure state.

**INFERENCE (high):** a result URL supports attribution but not reproducible
chain of custody. Full Markdown is transformed, time-sensitive content, not an
immutable capture. A later fetch cannot prove which representation supported a
claim.

### 7.2 Query and content privacy

**FACT (high):** a Search request discloses the query and locale/geography
controls to Jina; external paths necessarily disclose a derived query to at
least one upstream SERP supplier. Hydration discloses selected target URLs and
Jina fetch infrastructure to target sites. Optional cookies, scripts, referers,
proxies, and browser state widen the data boundary [S1][S4].

**FACT (high):** Jina says API inputs/outputs are not used to train its models.
Its legal page, last modified 2026-05-04 after acquisition by Elastic, points to
Elastic's DPA/privacy terms. It permits storage needed to provide service and
retention of aggregated/anonymized operational, diagnostic, and usage metadata;
it gives no Search-specific query/URL/log deletion schedule [S5][S6].

**Material DNT gap (high confidence, public-source scope):** OpenAPI describes
`DNT: 1` as preventing caching; product copy says "Do Not Cache or Track."
However, pinned Search code uses `noCache`, not `doNotTrack`, to bypass SERP
cache/local race; successful external SERPs are still submitted for SERP
storage and web-entry indexing. `DNT` does mark candidate page crawls private,
which suppresses page snapshot caching/indexing, but the source still logs the
search query in an acceptance message. Hosted code may add controls, but public
evidence does **not** establish that DNT suppresses Search query caching,
indexing, or logs [S1][S4][S5].

**RECOMMENDATION (high):** never send secrets, personal identifiers, signed
URLs, internal project names, ambient cookies, or proxy credentials to hosted
Search by default. If evaluated, use only public-data queries, redaction,
regional/data-classification policy, and written retention/subprocessor terms.
`X-No-Cache` plus DNT may be requested as best effort, but public source shows
neither is sufficient to prove that a successful SERP will not be stored or
indexed. Treat DNT as unverified until Jina contractually clarifies
Search-specific behavior.

### 7.3 Content and agent safety

**FACT (high):** Search exposes no typed safe-search/moderation control. It can
return and hydrate page-controlled text, links, metadata, images, iframes,
shadow DOM, and model-generated image captions. Jina's terms disclaim that
Output is necessarily complete, accurate, or true and place review and
third-party-rights responsibility on the customer [S1][S6].

**INFERENCE (high):** every result is untrusted external data. Hydration
increases prompt-injection and malicious-content exposure relative to a lean
SERP because one query fans out into multiple pages and may render active web
content. Upstream search ranking is not a safety boundary.

**RECOMMENDATION (high):** quarantine provider output as evidence-only data;
never execute page instructions; validate every returned URL before later use;
separate content from authority/control messages; enforce MIME/size/decompression
bounds; scan and annotate policy classes; and preserve source boundaries rather
than concatenating result pages into one trusted prompt.

### 7.4 Fetch-policy dependency

Reader internals are out of scope, but Search cannot be risk-assessed without
noting that it server-fetches upstream-selected URLs. Jina documents suspicious-
address filtering, throttles, excessive-DOM fallback, and abuse blocks in SaaS
[S3]. Public source is not proof of complete hosted SSRF, redirect, DNS-rebinding,
browser-sandbox, or subresource controls.

**RECOMMENDATION (high):** a Curiosity implementation must revalidate public
IPv4/IPv6 destinations at every connection/redirect/subresource, deny private/
loopback/link-local/metadata networks and ambient credentials, isolate browsers,
restrict protocols/ports, and bound redirects, domains, requests, bytes, DOM,
render time, and output. This is a clean-room safety requirement, not a claim of
a Jina vulnerability.

## 8. Curiosity decision and transfer ledger

### 8.1 Provider-neutral contract implications

**ADOPT (high):** explicit result-type, result-count, locale/market, cache
tolerance, plain/JSON/stream transport, and typed errors as concepts.

**ADAPT (high):** split the fused call:

```text
discover(query, filters, max_candidates, freshness_policy, budget)
  -> lean ranked candidates + supplier/rank/freshness trace

fetch_extract(candidate_url, capture_policy, extraction_policy, budget)
  -> immutable capture + derived passages + complete provenance
```

Minimum discovery record:

```text
query_id, normalized_query, candidate_id, url, title, snippet,
supplier/index_id, supplier_rank, local_score_if_any, retrieved_at,
serp_cache_state/age, result_type, language/market,
published_hint{value, source, confidence}, selection_reason, warnings
```

Minimum fetched evidence record:

```text
requested_url, redirect_chain, final_url, canonical_url,
fetch_started_at, fetch_completed_at, http_status, content_type,
cache_state/age, byte_count, content_hash, capture_id,
renderer/extractor policy+version, passages+anchors,
truncated, policy_decision, warnings, partial_failures
```

### 8.2 Adopt/adapt/reject/defer verdicts

| Pattern/product role | Verdict | Confidence | Reason |
| --- | --- | --- | --- |
| Explicit max candidates | **ADOPT** | High | Necessary fan-out bound; Curiosity should disallow ambiguous zero and enforce aggregate budgets. |
| Search type and locale/market controls | **ADAPT** | High | Type controls as filters/boosts/hints and report actual provider semantics. |
| Provider selection | **ADAPT** | High | Useful operationally only if actual supplier and fallback trace are returned. |
| Progressive SSE | **DEFER** | Medium | Useful for latency, but needs stable event IDs, monotonic state, final marker, byte/event/deadline bounds. |
| Discovery + full page content in every result | **REJECT** as default | High | Hides stage failures, inflates authority/cost, and increases injection exposure. |
| External SERP/local-index race without lineage | **REJECT** | High | Changes corpus and ranker invisibly. |
| Silent stale SERP fallback | **REJECT** | High | Availability cannot erase temporal provenance. |
| Page-number pagination | **REJECT** as stable cursor | High | Provider-specific and ignored by local-index interface. |
| `publishedTime` without origin | **REJECT** | High | Conflates publisher metadata and HTTP modification time. |
| Reject-versus-truncate distinction | **ADOPT**, fix Search gap | High | Search needs a real aggregate reject budget plus explicit truncation. |
| Hosted Jina Search adapter | **DEFER** | Medium | Requires privacy, legal, quality, reliability, and economics checks. |
| Jina Search as owned-index foundation | **REJECT** | High | Primary evidence says external SERP; local implementation is omitted and demand-derived. |
| Public source/code transfer | **DEFER** to dependency review | High | Apache-2.0 source exists, but service terms, third-party assets/dependencies, attribution, and clean-room architecture need separate review. |

### 8.3 Checks required before any adapter

1. Obtain current order terms, DPA/subprocessor list, Search query/URL/log/cache
   retention, deletion/backup behavior, EU routing, and a written DNT definition.
2. Pin and diff live OpenAPI; reconcile top-five versus default-ten behavior,
   `count=0`, duplicate aliases, provider semantics, and response-size limits.
3. With explicit approval and a non-sensitive fixture set, measure top-k
   relevance, supplier/rank stability, duplicate/domain diversity, freshness,
   pagination overlap, partial hydration, p50/p95/p99 latency, regional errors,
   and actual token charges.
4. Confirm whether responses identify cache hits/stale fallback in headers not
   represented by OpenAPI, and whether SSE has a stable terminal protocol.
5. Obtain hosted security evidence for query isolation, browser sandboxing,
   SSRF/DNS/redirect/subresource controls, and abuse/safe-content handling.
6. Review target-site terms, robots policy, copyright/database rights, and Jina
   terms before any service use or performance evaluation.

## 9. Facts, inferences, unknowns, and confidence ledger

| ID | Statement | Type | Confidence | Decision/check |
| --- | --- | --- | --- | --- |
| J1 | Search primarily relies on external SERP providers. | FACT | High | **REJECTED** as owned-index evidence |
| J2 | Public source tries Serper/Google/Bing paths and hydrates candidates with Reader. | FACT | High | Model as orchestration, not one ranker |
| J3 | Hosted local index is populated from observed SERPs and eligible snapshots; implementation is omitted. | FACT | High | Treat as opaque demand-shaped derivative index |
| J4 | Ordinary web search can race local and external/cached paths. | FACT | High | **REJECTED** without returned lineage |
| J5 | External order is generally retained after qualification; no Search reranker is shown. | FACT/INFERENCE | High | Do not infer Jina relevance scoring |
| J6 | Count accepts 0–20; source default 10 conflicts with top-five copy. | FACT | High | Always send count; validate behavior |
| J7 | Page steering is provider-specific and absent from local search. | FACT | High | **REJECTED** as stable pagination |
| J8 | SERP is fresh for 1h/retained 7d; source declares a 24h page tolerance but appears to multiply it by 1,000. | FACT/INFERENCE (source) | High | Hosted default unknown; expose all clocks |
| J9 | Stale SERP can be returned silently after provider failure. | FACT (source) | High | **REJECTED** silent fallback |
| J10 | Public output omits provider, original rank, cache age, and capture identity. | FACT | High | Add provenance fields |
| J11 | Search token budget is documented as ignored. | FACT | High | Enforce adapter-side aggregate authority |
| J12 | DNT does not clearly suppress Search SERP cache/index/log behavior in public source. | FACT/INFERENCE | High for source, unknown hosted | Require written clarification |
| J13 | No typed safe-search/moderation control is exposed. | FACT | High | Treat all content as untrusted |
| J14 | 2.5s latency and 99.98% uptime are vendor figures, not SLA/measurement. | FACT | Medium | Independent approved validation |
| J15 | Hosted index backend, ranker, coverage, safety signals, and freshness distribution are unknown. | UNKNOWN | High | Do not speculate |

## 10. Bounded curiosity pass

The caller authorized follow-up research only inside the declared frame. After
initial synthesis, gaps were scored 0–3 for relevance (R), decision value (V),
novelty (N), and cost (C, lower is better); priority = R + V + N - C.

| Thread | R | V | N | C | Score | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Prove or disprove owned-index interpretation | 3 | 3 | 3 | 1 | 8 | Pursued through architecture, provider order, storage model/interface; no owned broad-web evidence found. |
| Resolve pagination/local-race semantics | 3 | 3 | 3 | 1 | 8 | Pursued; local search receives no page, so continuation is not uniform. |
| Test Search-specific DNT path in public source | 3 | 3 | 3 | 1 | 8 | Pursued; found SERP cache/index/log gap distinct from private page hydration. |
| Reconcile result count, freshness, and pricing | 3 | 3 | 2 | 1 | 7 | Pursued across live schema, product copy, and pinned source; contradictions retained. |
| Infer hidden Mongo index/ranking formula | 2 | 2 | 3 | 3 | 4 | **CURIOSITY_NO_GO:** implementation intentionally omitted; further claims would be speculation. |
| Run live relevance/freshness/pagination benchmark | 3 | 3 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** user prohibited calls/credentials; repeated controlled fixtures required. |
| Determine exact paid top-up prices | 2 | 2 | 1 | 3 | 2 | **CURIOSITY_NO_GO:** checkout/key-gated and workload-dependent. |
| Probe unsafe, blocked, private, or paywalled targets | 1 | 1 | 1 | 3 | 0 | **CURIOSITY_NO_GO:** outside clean-room and access/safety boundary. |
| Audit all transitive dependencies/licenses | 1 | 2 | 1 | 3 | 1 | **CURIOSITY_NO_GO:** separate SBOM/legal review; unnecessary for product verdict. |

**Stop reason:** coverage and saturation. Remaining material unknowns require
vendor disclosure, legal review, credentials/paid evaluation, or hosted security
evidence—not more public-source inference.

## 11. Primary sources

All web sources were accessed 2026-08-17.

- **[S1] Jina AI, live Search OpenAPI, version `0.5.0+4e81fa5`.** Paths,
  request aliases/validation, inherited controls, response DTO/envelope, media
  types, and typed errors. <https://s.jina.ai/openapi.json>
- **[S2] Jina AI, public Reader repository README, pinned commit
  `1574bfd380d249c86c82db4dace0d9c8fe17e2b1`.** Search-to-Reader fan-out,
  top-five description, source/SaaS boundary, controls, and Apache branch.
  <https://github.com/jina-ai/reader/blob/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/README.md>
- **[S3] Jina AI, public architecture, pinned commit.** Explicit external-SERP
  dependency, SaaS storage omission, GCP/Mongo/GCS topology, abuse controls,
  regions, and shared Reader dependency.
  <https://github.com/jina-ai/reader/blob/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/architecture.md>
- **[S4] Jina AI, Apache-2.0 public source, pinned commit.** Principally
  `src/api/searcher.ts`, `src/api/crawler.ts`, `src/dto/crawler-options.ts`,
  `src/db/models.ts`, `src/db/noop-storage.ts`,
  `src/services/serp/{serper,google,bing}.ts`,
  `src/services/serper-search.ts`, `src/utils/search-query.ts`, and
  `src/services/snapshot-formatter.ts`.
  <https://github.com/jina-ai/reader/tree/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/src>
- **[S5] Jina AI, Reader/Search product page, FAQ, rate limits, and pricing
  mechanics.** Current hosted representations, authentication/rates, average
  latency, token floor, free balance, no-training/failed-charge statements,
  top-five Search copy, and DNT wording. <https://jina.ai/reader/>
- **[S6] Jina AI, legal information, last modified 2026-05-04.** Elastic
  acquisition/DPA notice, service/output disclaimers, third-party rights,
  storage/training language, and reverse-engineering/competitive-use limits.
  <https://jina.ai/legal/>
- **[S7] Jina AI official status page and incident history.** Vendor-reported
  90-day uptime and regional Search latency/error incidents.
  <https://status.jina.ai/> and <https://status.jina.ai/history>
- **[S8] Jina AI, Search launch article, 2024-05-14.** Historical top-five,
  anonymous rate, output-token pricing, latency, and grounding claims; used to
  identify drift, not as current contract.
  <https://jina.ai/news/jina-reader-for-search-grounding-to-improve-factuality-of-llms/>
- **[S9] Jina AI Reader Apache-2.0 license, pinned commit.** Public-source
  license boundary only; does not license third-party web data or omitted SaaS
  internals.
  <https://github.com/jina-ai/reader/blob/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/LICENSE>

## Final decision

Jina Search is best understood as a hosted, content-hydrating SERP orchestrator
with a hidden demand-derived local index—not as evidence for an independently
owned web corpus. Its ease of use comes from fusing discovery, fetching, and
extraction; that same fusion obscures supplier, rank, freshness, partial
failure, cost, and evidence lineage.

For Curiosity: **reject it as the owned-search foundation; adapt selected
contract ideas; defer a strictly bounded hosted adapter; and require owned,
provider-neutral discovery and capture contracts with explicit lineage,
freshness, partiality, safety, and authority budgets.**
