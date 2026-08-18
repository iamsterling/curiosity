# Bright Data SERP API: clean-room reverse-engineering dossier

**Research and primary-source access date:** 2026-08-17  
**Scope:** Bright Data **SERP API as a standalone hosted search product**. The
Google SERP 100 Scraper and Fast SERP are considered only where Bright Data
places them on the product boundary. Answer-engine scrapers, MCP, Web Unlocker,
Browser API, and ordinary proxy products are not treated as SERP API features.
**Access boundary:** public Bright Data documentation, OpenAPI, published JSON
Schema, pricing, release notes, security materials, privacy policy, DPA, MSA,
AUP, SLA, and representative upstream terms. No account, API key, paid or free
request, target probe, traffic interception, CAPTCHA experiment, access-control
bypass, provider source inspection, or implementation was used.

## Executive verdict

Bright Data SERP API is a **managed observation and parsing layer over search-
engine front ends**, not an independent crawler, corpus, index, or ranker. A
caller describes an upstream page primarily by URL; Bright Data chooses access
infrastructure, proxy identity, headers/device profile, retries, CAPTCHA handling,
rendering, validation, and—on Google and Bing—proprietary parsing. It can return
raw HTML, rich JSON, reduced JSON, Markdown, or a screenshot. [S1-S7]

**Overall verdict: ADAPT / DEFER (high confidence).** Adapt the explicit upstream
engine and search context, typed SERP blocks, query-mismatch validation, separate
sync/async contracts, requested-versus-observed geo, output derivation, request
correlation, and bounded provider profiles. Defer any production adapter until
contract tests and procurement resolve cache/freshness, schema/version stability,
payload retention/reuse, webhook authenticity, hard limits, effective locale,
error/status layering, and upstream authorization.

**Reject as Curiosity's search foundation (high confidence).** Bright Data does
not provide ownership of candidate coverage, ranking, upstream crawl freshness,
or source-document evidence. Search snippets, AI Overviews, knowledge panels,
ads, reviews, prices, and parsed dates are untrusted upstream representations,
not capture-bound primary evidence. Do not seed an owned index from this feed,
treat `global_rank` as a portable relevance score, or reproduce the product's
proxy/CAPTCHA/fingerprinting behavior.

## 1. Decision frame and evidence policy

The decision is:

> Can Bright Data SERP API serve as an optional, bounded discovery adapter behind
> Curiosity's provider-neutral search contract, and which evidence, policy,
> freshness, security, legal, and cost responsibilities must remain Curiosity's?

Bounded sub-questions:

1. Which engines and search surfaces are actually supported, and at what output
   fidelity?
2. What are the authoritative synchronous, native-proxy, and asynchronous wire
   contracts?
3. How are location, language, device, browser, safe search, pagination, and
   session-like behavior expressed and evidenced?
4. What is parsed or normalized, and what provenance is preserved or lost?
5. What do “real-time,” success, freshness, retries, and billing mean externally?
6. Which errors, limits, prices, upstream dependencies, security/privacy terms,
   and upstream ToS constraints affect adoption?
7. What architecture can be inferred without inspecting proprietary internals?
8. Which lessons should Curiosity adopt, adapt, reject, or defer?

Labels used throughout:

- **FACT** — directly stated or exposed by a cited primary source.
- **INFERENCE** — clean-room explanation consistent with public behavior; not a
  claim about Bright Data's private implementation.
- **RECOMMENDATION** — a Curiosity design, operations, or procurement action.
- **UNKNOWN** — not established by the reviewed public sources.

Confidence is **high**, **medium**, or **low**. Vendor performance, coverage,
accuracy, consent, and compliance statements remain assertions unless the cited
artifact is an independent audit/certificate.

## 2. Product boundary, engines, and upstream dependence

### 2.1 Supported engines

**FACT (high):** the current product page and introduction advertise seven search
engines across 195 countries: **Google, Bing, DuckDuckGo, Yandex, Baidu, Yahoo,
and Naver**. The API-reference summary is narrower: Google, Bing, Yandex, and
DuckDuckGo. Public engine-specific parameter pages reviewed here exist for those
four. [S1][S2][S5-S8]

**FACT (high):** structured parsing is explicitly documented for **Google and
Bing**. Bright Data calls full Google JSON its interpretation of Google SERP HTML,
light JSON a subset, and Parsed Bing its interpretation of Bing HTML. The public
parsing guide does not promise equivalent typed JSON schemas for DuckDuckGo,
Yandex, Baidu, Yahoo, or Naver. [S4]

| Engine | Public request dialect | Public parsed-output evidence | Finding |
|---|---|---|---|
| Google | `q`; `gl`, `hl`, `uule`; `start`; `tbm`/`udm`/`ibp`; `safe`; Bright Data device/browser flags | Full and light JSON schemas; raw HTML, Markdown, screenshot | Deepest and best-documented adapter. |
| Bing | `q`; `setLang`, `location`+lat/lon, `cc`, `mkt`; `first`; `safesearch`; device/browser flags | “Parsed Bing” and Bing migration documentation | Structured, but public schema detail is less complete than Google. |
| DuckDuckGo | `q`; `kl`, `kad`, `kp`, `df`; device/browser flags | No reviewed product-wide typed schema | Access is documented; normalization depth is unknown. |
| Yandex | `text`; numeric `lr`, `lang`, one-based documented `p`, `within`; device/browser flags | No reviewed product-wide typed schema | Access is documented; normalization depth is unknown. |
| Baidu, Yahoo, Naver | Named on product page | No engine-specific request/schema page found in reviewed docs | Marketed support; exact endpoints, controls, and parsed fidelity remain unknown. |

**UNKNOWN (high importance):** for Baidu, Yahoo, and Naver, the accepted host/path
allowlist, verticals, request limits, response format, parser coverage, locale
defaults, and error semantics are not established by the reviewed public contract.
“Supported engine” must not be normalized to “same structured contract.”

### 2.2 Search surfaces are not one homogeneous API

**FACT (high):** Google documentation covers ordinary web search plus Maps/local,
Trends, Reviews, Images/Lens, Hotels, Flights, News, Videos, Shopping, Jobs, AI
Overview, and other SERP modules. Some are URL paths, some are query modes, and
some require browser-backed enrichment. Google Trends supports only specified
paths/tabs; Google Maps pagination was deprecated in December 2025. [S6][S19]

**FACT (high):** Google's `num` result-count parameter stopped controlling result
count in September 2025. Ordinary Google pages now return roughly ten results,
with variation; callers use `start` for another page. Bright Data's “Top 100”
replacement is dataset ID `gd_mfz5x93lmsjjjylob` on the **Web Scraper API
snapshot system**, not the standalone `/request` SERP API contract. It was
temporarily unavailable due to Google-side blocking in June 2026. [S6][S17][S19]

**INFERENCE (high):** the product is a portfolio of upstream adapters behind a
shared commercial gateway, not a metasearch system. One request observes one
engine/surface. There is no documented cross-engine query fan-out, fusion,
deduplication, or independently computed rank.

**RECOMMENDATION (high):** expose engine and surface as mandatory typed fields.
Approve web, news, images, maps/local, shopping, ads, reviews, travel, and AI-
generated answer surfaces separately. Never infer that web-search approval covers
personal reviews, prices, images, maps, ads, or AI answers.

### 2.3 Upstream and anti-blocking dependencies

**FACT (high, vendor description):** Bright Data says SERP API manages proxy
selection, IP rotation, headers, browser/device fingerprinting, CAPTCHA solving,
retries, rendering, response validation, and parsing. It advertises residential
coverage and says each request is normally sent from a different IP. Automatic
retries are included in one billable delivered response. [S1][S3][S14][S16]

**FACT (high):** ordinary Bright Data proxies may block or “super-proxy bypass”
Google, Bing, YouTube, and selected domains; Bright Data directs search-engine
traffic to SERP API. This makes SERP API a policy-controlled search access lane,
not merely a convenience wrapper over a caller-selected residential peer. [S20]

**FACT (high):** provider validation detects Google query mismatch/truncation,
verification pages, and repeated/failed query conditions. By default, a mismatched
query without a genuine spelling-correction object fails as `unexpected_q` and
is not billed. [S10]

**INFERENCE (high):** availability depends jointly on Bright Data's gateway,
account/zone control plane, proxy reputation and geography, browser workers,
CAPTCHA/challenge handling, upstream front-end behavior, parser correctness, and
the upstream index. A single API does not remove these failure domains.

**RECOMMENDATION (high):** treat every engine/surface as a separate external
dependency with health, deadline, cost, and circuit-breaker state. Never broaden
agent authority to “fix” a soft block, vary queries to evade a block, or trigger
CAPTCHA/protection bypass outside a separately approved policy.

## 3. Request and delivery contracts

### 3.1 Synchronous direct API

**FACT (high):** the recommended direct endpoint is:

```text
POST https://api.brightdata.com/request
Authorization: Bearer <API key>
Content-Type: application/json
```

The published OpenAPI requires `zone`, `url`, and `format`. [S2][S3]

| Field | Published contract | Decision significance |
|---|---|---|
| `zone` | string, required | Provider policy/configuration boundary for output, access, target behavior, billing, and permissions. |
| `url` | absolute public HTTP(S) URL, required | Carries engine, surface, query, locale, pagination, and many provider-specific controls. It is not merely a destination URL. |
| `format` | `raw \| json`, required | OpenAPI says raw returns HTML and JSON returns structured data. Other guides commonly use `format:"raw"` plus a parser control. |
| `method` | optional string, default GET | Description says GET; enum is absent. Search-by-image docs show a target POST/upload through native mode. |
| `country` | optional ISO-2 | Requested proxy country; omission lets system/zone choose. Distinct from engine result-country parameters such as Google `gl`. |
| `data_format` | `markdown \| screenshot` in OpenAPI | Guides additionally use `parsed_light`, which is absent from this enum. |
| `data_options` | shown in debugging guide, absent from OpenAPI | `return_mismatch:true` opts into receiving and paying for query-mismatched results. |

**FACT / CONTRACT DRIFT (high):** output controls are inconsistent across current
sources: `format:"json"`; `format:"raw"` plus `brd_json=1` embedded in the target
URL; `data_format:"parsed_light"`; native `x-unblock-data-format`; and zone-level
defaults are all documented. The configuration page says a screenshot default is
currently broken unless overridden by header. Direct OpenAPI has no `headers`
object even though custom headers/cookies and parser headers are documented in
configuration/native guides. [S2-S5][S9]

**UNKNOWN (high importance):** maximum URL/query/body/header sizes, accepted
target methods, binary upload encoding in direct mode, redirect rules, maximum
response bytes, decompression limits, hard wall time, and authoritative legal
combinations of `format`, `data_format`, `brd_json`, zone default, and headers.

**RECOMMENDATION (high):** treat current OpenAPI plus approved no-cost contract
tests as authority. Initially allow only GET and allowlisted engine hosts/paths.
Construct URLs locally from typed engine parameters; do not accept arbitrary
agent-supplied target URLs or headers. Pin one output mode per zone and reject
ambiguous combinations.

### 3.2 Native proxy interface

**FACT (high):** native access sends target requests through
`brd.superproxy.io:44445` with zone username/password and Bright Data's TLS root
certificate. Native controls use target URL parameters and `x-brd-*` or
`x-unblock-*` headers. Documentation also gives examples that disable certificate
verification. [S3][S5][S12]

**FACT (high):** native mode can request output format, custom validation, URL
fragment handling, same-peer attempts via `x-brd-session`, request priority, and
rate-limit metadata. Custom cookies/headers require zone allowlisting and change
billing from success-only to all attempts. [S5][S9][S14]

**SECURITY INFERENCE (high):** installing the provider root lets Bright Data
terminate, inspect, modify/rule-process, and re-encrypt HTTPS requests. “Identical
results” between direct and native access does not make the authentication, TLS,
status, control, or credential surfaces identical.

**RECOMMENDATION — REJECT NATIVE MODE (high):** use bearer-authenticated direct
API if the product is evaluated. Do not install a provider CA globally and never
disable TLS validation. Native mode adds certificate trust, credential leakage,
and response-normalization risk without a demonstrated Curiosity requirement.

### 3.3 Asynchronous API

**FACT (high):** the intended SERP lifecycle is: [S11-S13]

1. Enable async on the zone.
2. `POST /serp/req?zone=<zone>` with bearer auth and an object such as
   `{"query":{"q":"pizza"},"brd_json":"json"}`.
3. Receive a `response_id`; pending retrieval returns HTTP 202.
4. Pull the completed result by response ID.
5. Results are retained up to 48 hours from submission; usual completion is up
   to five minutes but may reach eight hours at peak.

The generic async guide documents `query` as the mandatory SERP object and
`brd_json` as `1` or `"html"`; it also documents `country`, per-request webhook
URL/method/data, and generic URL/method/header/body fields. Sending is billable;
collection is not and can be repeated within retention. [S11][S14]

**FACT / CONTRACT DRIFT (high):** current pages disagree on material details:

- response ID appears as an `x-response-id` header in one guide and a JSON
  `response_id` body in another;
- SERP-specific references name `/serp/req` and `/serp/get_result`, while examples
  submit or retrieve through `/unblocker/*`;
- one OpenAPI page says async endpoints return 200 JSON but does not expose the
  full schema in its rendered summary;
- one guide supports webhook notification and stable source-IP allowlisting,
  while the SERP first-async guide says SERP async requires pull and cannot send
  the response to a caller target. The webhook, where present, is a readiness
  notification rather than documented result-body delivery. [S11-S13]

**UNKNOWN (high importance):** idempotency keys, duplicate-submission handling,
cancellation, priority, hard execution deadline, explicit expired state,
response deletion, ownership checks, webhook signatures/secrets, event IDs,
replay protection, retries/backoff, ordering, delivery guarantee, and output-
mode parity with synchronous requests.

**INFERENCE (high):** async is a retained request/result queue, not a transparent
batch abstraction. `response_id` is both correlation handle and temporary result
locator. IP allowlisting alone authenticates neither payload nor event.

**RECOMMENDATION (high):** poll authenticated retrieval as source of truth;
assume duplicate jobs and at-least-once notifications; bind response ID to an
internal job and request hash; enforce a local deadline shorter than 48 hours;
authenticate any callback at a Curiosity gateway; and never put secrets in query
or webhook metadata. Do not implement against the contradictory paths until a
current contract test and written clarification establish the canonical flow.

### 3.4 Fast SERP and Top-100 boundary

**FACT (high):** Fast SERP is enterprise-gated, optimized for at least roughly
50 QPS, and advertised around one-second p90 with regional deployments in US
East, US West, EU, and APAC. It prefers native proxy ingress at
`fserp.brd.superproxy.io`; REST may be provided. It supports Google web, news,
shopping, images, and maps with reduced schemas such as `parsed_fast` and
`parsed_light`. [S15][S16]

**FACT / DOC CONTRADICTION (high):** the Fast SERP web page first says both
`x-unblock-data-format: parsed_light` and `brd_json=1` are required, then its
organic-only example uses `parsed_fast`. This is not a sufficiently coherent
public wire contract for implementation. [S16]

**RECOMMENDATION — DEFER (high):** Fast SERP has no initial Curiosity need and
prefers the native mode rejected above. The Top-100 feature is a Web Scraper API
job with different IDs, state, retention, and output. Neither should be silently
selected as a performance or pagination tier for the standalone adapter.

## 4. Geo, localization, device, browser, and session behavior

### 4.1 Context is a vector, not one locale

**FACT (high):** at least three location layers can coexist:

1. outer request `country`: requested Bright Data proxy country;
2. upstream engine signals: Google `gl`/`hl`/`uule`, Bing `cc`/`mkt`/coordinates,
   DuckDuckGo `kl`/`kad`, Yandex `lr`/`lang`;
3. parsed/debug observations: Google `general.country(_code)` and language, plus
   `x-brd-debug.peer_country` when debug is enabled. [S2][S5-S8][S10]

**FACT (high):** Google now routes non-`google.com` TLDs through `google.com`; its
localization guidance says use `gl` and `hl`, with `uule` for finer location.
Bright Data accepts a canonical location or beta latitude/longitude/radius and
composes a closest `uule`. Bing has independent UI language, country, market,
and location/coordinate controls. [S6][S7]

**FACT (medium, vendor claim):** pricing/product pages advertise free city/ZIP
targeting and all 195 countries. The direct OpenAPI exposes only country; public
engine docs expose finer **search-origin signals**, not a verified exit-city or
ZIP receipt. [S1][S2][S14]

**INFERENCE (high):** “search from Paris” is an emulation claim formed from
egress, engine parameters, browser/device profile, cookies/consent, and upstream
experiments. It is not proof of what a representative human in Paris sees.

**RECOMMENDATION (high):** preserve every dimension separately:
`requested_proxy_country`, engine domain/path, result country/market, language,
encoded/canonical/coordinate location, provider-observed peer country, and parsed
effective country/language. Report conflicts and provider fallback; never collapse
them to a single `locale` or legal residency claim.

### 4.2 Device/browser and personalization

**FACT (high):** `brd_mobile` supports random desktop by default, generic mobile,
iPhone/iPad, Android phone, and Android tablet. `brd_browser` supports Chrome,
Safari, and Firefox with documented compatibility limits. Full Google JSON can
report `is_mobile`; `input.user_agent` can expose the used user agent. [S4-S8]

**FACT (high):** default browser and desktop user agents are random. Enhanced Ads
is described as an incognito-like, cookieless setting; custom cookies/headers are
approval-gated. [S5][S9]

**UNKNOWN:** exact browser versions, viewport/device pixel ratio (except optional
parsed rectangle viewport metadata), cookie/consent state, experiment cohort,
signed-in state, search history, cross-request state, and how retries vary these
signals. Therefore “real user results” and “100% accurate” are marketing claims,
not reproducible equivalence to a particular user.

**RECOMMENDATION (high):** require an explicit device/profile; do not use random
defaults for reproducibility. Record requested profile, parsed `is_mobile`, and
used user agent when returned. Never compare ranks across profiles as though the
observations came from one stable population.

### 4.3 Same-peer session is not a search session

**FACT (high):** native `x-brd-session` “attempts” to pin later requests to the
same proxy IP. Default guidance elsewhere says requests rotate and each normally
uses a different IP. [S5][S9]

**UNKNOWN (high importance):** whether a SERP session carries cookies or browser
state; its scope, TTL, failover, concurrency ordering, and relation to parser or
upstream experiment state. Same-IP attempt is not documented as a persistent
browser or stable upstream identity.

**RECOMMENDATION — DEFER (high):** treat calls as logically stateless. Pagination
must repeat all request context and tolerate drift. Do not rely on sessions for
rank tracking, personalization, consent, or identity continuity.

## 5. Parsing, normalization, and provenance

### 5.1 Output and parser model

**FACT (high):** six output concepts are documented: raw HTML, full Google JSON,
light Google JSON, Parsed Bing, Markdown, and screenshot. Full/light JSON and
Markdown are interpretations of upstream HTML; screenshot is the page as
interpreted by a browser. Light JSON focuses on roughly ten organic results plus
selected modules and is advertised as roughly twice as fast. [S4][S5]

**FACT (high):** full Google JSON has heterogeneous top-level blocks rather than
one flat hit list: `organic`, ads/PLAs, news/top stories, videos, images, shopping,
featured snippets, People Also Ask, knowledge/overview, AI Overview with indexed
references, local/map pack, jobs, flights, hotels, recipes, related searches,
pagination, and more. `global_rank` represents placement across the page; some
items also carry module-local `rank`. [S2][S4][S18]

**FACT (high):** useful request/provenance-like fields can include:

- `general.query` and `detected_query`, effective country/language, search type,
  mobile/empty/consent state, reported result count, and upstream search time;
- `input.original_url`, used user agent, and Bright Data `request_id`;
- per-item source module, local/global rank, destination/display/referral links,
  source label, snippet, date, image, and upstream IDs such as `kgmid` or `cid`;
- pagination links and request/result timestamps shown in examples; and
- debug `req_id`, byte counters, billed status, destination, opaque peer ID,
  peer country, relayed header names, and render flag. [S2][S4][S10][S18]

**FACT / SCHEMA WARNING (high):** the published Google JSON Schema describes many
properties but declares no top-level `required` list. The parsing prose says only
`organic` is guaranteed in light responses while also saying `general` is returned
in every light response. Examples and prose vary between `mobile`/`is_mobile`,
`location`/`country`, and `timestamp` presence. [S2][S4][S18]

**INFERENCE (high):** this is a provider parser vocabulary with engine/surface-
specific extensions, not a stable universal schema. Search-layout changes can
add, omit, or reinterpret fields without changing the endpoint. The separate
light/full schemas and release-note deprecations are direct drift evidence.

### 5.2 Provenance limits

**UNKNOWN / negative result (high confidence):** no reviewed public response
contract supplies all of:

- immutable raw-byte hash bound cryptographically to parsed fields;
- parser/schema version, compatibility window, or deprecation policy;
- upstream index snapshot or upstream crawl time per destination document;
- destination-page capture ID, final-page content hash, or snippet offsets;
- exact acquisition start/end, redirect chain, attempt ledger, or retry count;
- selected proxy class and verified exit location;
- browser build, experiment cohort, consent/cookie state, or transformation
  version; or
- completeness/truncation flags and hard payload limits.

**INFERENCE (high):** the result is evidence that Bright Data reports observing
and parsing an upstream SERP under some context. It is not evidence that the
linked publisher page currently contains the snippet, that a displayed date is
correct, or that the result is independently relevant. `global_rank` is observed
layout order, not a cross-engine score.

**RECOMMENDATION (high):** map provider output only into a bounded **discovery
observation**:

- provider/product/zone logical ID, engine and surface;
- exact normalized request fingerprint and all requested/effective context;
- caller start/end, provider request/response IDs, provider timestamp if present;
- output kind and transformation chain (`upstream_html -> provider_parser -> JSON`
  or `-> Markdown`; `rendered_page -> screenshot`);
- module type, page, local/global rank, title, snippet, source/destination and
  observed tracking links;
- raw received byte length and cryptographic hash;
- cache, redirect, truncation, attempt count, parser version, and destination
  freshness explicitly `unknown` unless proved; and
- warnings for query correction/mismatch, missing modules, partial parsing, and
  provider degradation.

Fetch authorized destination pages through a separate bounded evidence lane and
cite capture-bound passages. Never call Markdown raw, use screenshot as parse
truth, or cite a SERP snippet/AI Overview as the publisher.

### 5.3 Untrusted response handling

**FACT (high):** Bright Data's own security guidance says scraped content is
untrusted and should be validated/filtered before entering an LLM because of
prompt injection. SERP fields can contain publisher text, upstream-generated
answers, URLs, opaque continuations, Base64 images, and tracking links. [S25]

**RECOMMENDATION (high):** parse under byte/CPU/depth limits; cap inline Base64;
validate destination and continuation URLs; do not execute HTML/scripts; sanitize
display; keep retrieved text outside instruction channels; and never let result
content authorize tools, credentials, further engines, or capability escalation.

## 6. Freshness, caching, retention, and reproducibility

### 6.1 Three freshness layers

1. **Provider acquisition freshness.** Bright Data markets “real-time,” “fresh,”
   and sub-five/sub-one-second delivery. These describe service retrieval/latency
   claims, not a documented cache-bypass protocol. [S1][S15]
2. **Upstream SERP freshness.** A newly observed SERP is still determined by the
   upstream index, ranking, experiments, and displayed dates.
3. **Destination evidence freshness.** SERP API does not fetch and bind each
   destination page to each snippet.

**UNKNOWN (high importance):** no reviewed SERP contract exposes a cache enable,
bypass, hit/miss, age, key dimensions, TTL, revalidation, or shared-tenancy model.
No source establishes whether final SERP bodies, rendered pages, parser results,
DNS, challenge state, cookies, or failed-query state are cached/reused. The
documented 15-second failed/repeated-query block is control state, not a result-
freshness guarantee. [S10]

**FACT / LEGAL CONTEXT (high):** the MSA mentions an optional cache-proxy solution
for Proxy Services and warns cached data may be stale. This does not establish
that SERP API caches results. Current SERP docs expose no cache control. [S22]

**RECOMMENDATION (high):** represent provider cache state and age as `unknown`.
Do not translate “real-time” into `cache_bypass=true` or “fresh web.” Ask for an
explicit cache contract and per-response acquisition timestamp/hit evidence.

### 6.2 Retention and replay

**FACT (high):** async responses are retained for up to 48 hours from submission
and may be collected multiple times without another retrieval charge. This is
result availability, not source freshness or durable archival provenance. [S11]

**UNKNOWN (high importance):** retention for synchronous URLs, query text, HTML,
parsed payloads, screenshots, debug data, support logs, internal attempts, browser
state, backups, and failed requests; ability to delete an async result early; and
whether support can replay a request from retained artifacts.

**RECOMMENDATION (high):** never submit secrets, personal case narratives,
privileged text, private identifiers, or credential-bearing URLs as queries.
Store only authorized, encrypted, bounded responses under Curiosity retention;
record a hash immediately; and do not rely on provider retention as evidence.

## 7. Failures, limits, and operational semantics

### 7.1 Error model

**FACT (high):** documented status/error classes include: [S2][S10][S21]

| Status/code | Meaning in current docs | Retry implication |
|---|---|---|
| 400 | invalid/unsupported URL or request | Correct locally; do not blind-retry. |
| 401/407 | bearer or native-zone credential failure | Rotate/fix credentials; no target retry. |
| 403/404 | access forbidden or invalid/dead URL | Classify target/provider policy separately. |
| 502 `unexpected_q` | Google returned a different/truncated query | Fail closed by default; spelling correction is separately represented. |
| 502 `verifying` | verification page could not be solved/skipped | Wait at least 15 seconds; never escalate capability automatically. |
| 429 `sr_rate_limit` | dynamic per-host low-success throttle | Reduce rate/concurrency to stated limit. |
| 429 `bucket_rate_limit` | configured zone/account bucket | Wait stated `x-brd-rate-limit-period-ms`. |
| 429 `failed_query_rejected` / `repeat_query_rejected` | per-zone/query 15-second rejection | Do not send identical concurrent retries. |
| proxy `client_10110` | unverified-account rate ceiling | Account policy, not origin failure. |
| 503 | service/browser validation unavailable | Bounded backoff/circuit break. |
| async 202 | still pending | Poll according to schedule, not as failure. |

Errors use `x-brd-error-code`/`x-brd-error`; selected proxy-layer errors use
`x-brd-err-code`/`x-brd-err-msg`. Rate responses can carry
`x-brd-rate-limit` and period. None in the SERP error catalog is billed under
default configuration. [S10]

**UNKNOWN:** authoritative outer-versus-inner status behavior for direct API;
whether an upstream 4xx/5xx can be delivered as successful SERP output; a stable
machine-readable error schema; `Retry-After` guarantees; partial-parser warnings;
and whether empty organic results are billed or semantically “successful.”

**RECOMMENDATION (high):** normalize transport, provider policy/execution,
upstream page, parser/artifact, semantic acceptance, and billing separately.
Outer 200, `billed=true`, nonempty HTML, or absence of a provider error must not
alone mean useful search evidence.

### 7.2 Limits and boundedness

**FACT (high):** starting January 2026, SERP zones have fair-usage rate limits;
unfunded accounts default to 1,000 requests/minute. Product pricing simultaneously
advertises “unlimited concurrency.” Dynamic host and zone/account throttles still
apply. [S1][S10][S21]

**FACT (high):** Fast SERP documents queries under 8,000 characters. Google
ordinary result count varies at about ten/page; Google and Bing have different
offset conventions, Bing warns pages may overlap, and Yandex docs use a one-based
page parameter. [S6-S8][S16]

**UNKNOWN / negative result (high confidence):** no authoritative public standard
SERP limits were found for URL/query size, request/response body, Base64 images,
HTML, Markdown, screenshot dimensions/bytes, redirects, render duration, total
sync duration, queued async jobs, webhook attempts, pages, or per-origin
concurrency. Marketing “unlimited” is not a safe bound.

**RECOMMENDATION (high):** enforce lower Curiosity ceilings for query length,
pages, results, response bytes, inline media, elapsed time, total provider calls,
per-engine concurrency, and cost. Preserve duplicates/ranks while deduplicating
discovery leads. Follow only allowlisted, reconstructed pagination state—not raw
provider continuation URLs—and fail as `pagination_incomplete` when bounded.

### 7.3 Hidden retries and target pressure

**FACT (high):** Bright Data retries internally and does not bill each hidden
attempt separately. Debug reports final request metadata but no attempt ledger.
[S10][S14]

**INFERENCE (high):** one paid “request” can represent multiple upstream attempts,
possibly with different proxies, headers, devices, or browser execution. Success-
only pricing hides upstream request amplification and prevents Curiosity from
proving politeness or replaying acquisition decisions.

**RECOMMENDATION (high):** bound provider calls by caller wall time and cost, ask
for internal attempt count/elapsed time, and record target load as unknown. “Failed
calls are free” must never justify retry storms or synthetic query variation.

## 8. Pricing and availability

Public prices below are volatile list prices observed 2026-08-17, not a quote.

**FACT (high):** [S1][S14][S21][S24]

| Dimension | Public statement | Decision significance |
|---|---|---|
| Free tier | 5,000 shared credits/month, no card | Shared with other Bright Data products; not an isolated SERP budget. |
| PAYG | $1.50/1,000 successful requests | Provider success classification controls billing. |
| Scale | $499/month includes 380K; $1.30/1K additional | Approximately $1.313/1K at full included use; commitment remains. |
| Default failures/retries | Failures and hidden retries unbilled | Custom headers/cookies change this to all attempts. |
| Parsing/unlocking/bandwidth | Included; no bandwidth fee | Payload/storage/token cost remains Curiosity's. |
| Async | Initial send billed; repeated collection free | 48-hour retention does not make duplicates free to store/process. |
| Geo/device | City/ZIP and desktop/mobile included | Claim needs effective-context evidence. |
| Concurrency | Marketing says unlimited | Fair-use, dynamic host, account, capacity, and budget limits remain. |
| Async SLO claim | 99.99% success; usually ≤5 minutes, peak ≤8 hours | Vendor claim, not semantic quality or destination evidence SLA. |
| Network SLA | commercially reasonable 99.9%; 5% credit at 99.0–99.9%, 10% below 99%, capped at $1K/$2K | Network uptime; success-rate incident bands are support severity, not a parser/relevance guarantee. |

**FACT (high):** the SLA defines SERP success rate as ability to access and process
selected public page elements. It excludes degradation caused by customer
customization and makes service credit the sole uptime remedy. The MSA separately
disclaims accuracy, completeness, non-infringement, security, and uninterrupted
operation and caps aggregate liability at one prior month of fees. [S22][S24]

**RECOMMENDATION (high):** price the full evidence flow, not provider hits:
engine/locale/device/page fan-out, provider-classified successes, hidden attempts,
empty/duplicate/partial rate, response bytes, parsing, destination capture,
storage, and downstream tokens. Isolate zones and spend caps by environment and
engine policy; keep auto-recharge disabled during evaluation.

## 9. Security, privacy, legal, and ToS boundaries

This section identifies engineering and procurement gates, not legal advice.

### 9.1 Platform and credential security

**FACT (medium):** Bright Data reports ISO/IEC 27001:2022, ISO 27017, ISO 27018,
SOC 2 Type II under NDA, public SOC 3, TLS 1.3/minimum 1.2, AES-256 at rest, AWS
multi-AZ, RBAC, employee MFA, annual penetration testing, and a 2025 test that
explicitly included SERP API. These support platform-control claims but do not
answer product payload retention or every adapter control. [S25]

**FACT (high):** API keys can expire and use broad permission profiles; native
mode adds zone password and provider-CA trust surfaces. [S3][S26]

**RECOMMENDATION (high):** direct API only; dedicated expiring least-privilege
`User` key; separate zone per environment/policy; secret manager; egress limited
to the direct endpoint; rotation tests; and no keys, full query URLs, bodies,
debug headers, peer IDs, or result payloads in ordinary logs.

**UNKNOWN:** API-key source-IP restrictions, fine-grained zone/resource scoping,
regional SERP processing/storage, tenant isolation for retained async results,
request-log deletion, support access, DNS/redirect/subresource SSRF controls, and
audit-log coverage.

### 9.2 Query/result privacy and data use

**FACT (high):** Bright Data's privacy policy covers account/KYC IDs, payment
data, IPs, usage, and possibly recorded compliance calls. Retention is based on
purpose/legal need, not a fixed SERP period. It says User Data is not rented or
sold while its California notice says Bright Data may have sold the category
“Identifiers” in the prior 12 months. [S23]

**FACT (high):** the public DPA provides processor obligations, confidentiality,
breach notice without undue delay, deletion on request/termination subject to
law, subprocessor authorization, and transfer safeguards, but does not itself
provide a SERP payload/log retention schedule or full region/subprocessor map.
[S27]

**FACT / CONTRACT RISK (high):** the MSA permits Bright Data to retain and use
data collected under “Proxy Services and Scraping Browser API” for its own
purposes. SERP API is not named in that heading, but Bright Data describes SERP
API as proxy/browser based and provides native proxy access. Applicability is
therefore materially ambiguous, not safely excluded. [S3][S22]

**RECOMMENDATION — PROCUREMENT BLOCKER (high):** require an order form/DPA that
names SERP API and establishes no independent reuse/model training; fixed URL,
query, header, cookie, HTML, JSON, screenshot, debug, attempt, and support-log
retention; deletion SLA; processing regions/subprocessors; incident deadline;
support controls; cache isolation; output ownership/license; and post-termination
handling. Sensitive queries remain deferred regardless of platform certificates.

### 9.3 Bright Data AUP and target rights

**FACT (high):** Bright Data's AUP forbids nonpublic/behind-login collection,
illegal/fraudulent/abusive use, spam, fake accounts/content/engagement, click/ad
fraud, SEO manipulation, and third-party-rights violations. Bright Data may block
content or suspend service at its discretion. [S28]

**FACT (high):** the MSA places law, privacy, intellectual-property, and intended-
use responsibility on the client; requires client indemnity for specified third-
party claims; prohibits reverse engineering, derivative work, and Bright Data IP
mapping; and may change by posting. [S22]

**INFERENCE (high):** payment, provider KYC, parsed output, CAPTCHA solving,
successful delivery, or public accessibility does not grant upstream permission
or downstream rights in snippets, images, reviews, ads, prices, or AI answers.

### 9.4 Upstream terms remain independent gates

**FACT (high):** Google's US Terms effective 2026-07-30 prohibit bypassing
protective measures, automated access contrary to machine-readable instructions,
rights violations, and reverse engineering for proprietary information, and list
scraping content not belonging to the user as possible suspension grounds. [S29]

**FACT (high):** Microsoft's consumer agreement prohibits circumventing access
or availability restrictions and identifies impermissible scraping; DuckDuckGo's
terms require compliance with its terms/AUP and reserve suspension. [S30][S31]

**UNKNOWN:** this report did not establish a single authorization theory covering
every Google vertical or the Bing, DuckDuckGo, Yandex, Baidu, Yahoo, and Naver
front ends in every jurisdiction. Upstream paths and terms can differ by surface,
country, content class, and use.

**RECOMMENDATION (high):** counsel must review each enabled engine/surface,
jurisdiction, access method, machine-readable policy, retained fields, display,
and downstream use. Curiosity must make its own allow/deny decision before the
provider call and must not use Bright Data to override that decision.

## 10. Clean-room architecture inference

The following is **INFERENCE**, not a description of Bright Data private source
code and not a guide to reproduce anti-blocking behavior.

```text
Curiosity caller
   |-- direct bearer request -------------------------------|
   |-- native zone credential + provider TLS CA (rejected) -|
                                                            v
                  API / superproxy ingress
                 auth + URL/schema validation
                              |
                    zone/account control plane
      engine allowlist | output | custom controls | rate | cost | KYC
                              |
                     SERP request planner
      engine/surface dialect + locale/device/browser context
                              |
      +-----------------------+--------------------------+
      |                       |                          |
 route/peer planner     HTTP/browser workers      Fast SERP lane
 proxy geography       rendering/challenge       compact parser
      |                 headers/cookies/CAPTCHA         |
      +---------------- validate / retry ---------------+
                              |
                    upstream search front end
                              |
                  raw/rendered SERP observation
                              |
             engine/surface parser + mismatch checks
                              |
          HTML | full/light JSON | Markdown | screenshot
                              |
             sync response OR 48-hour async result store
                                      |           |
                                    poll      webhook hint?
```

Evidence:

- zone-bound output, custom controls, permissions, rates, and billing [S2][S9];
- direct/native ingress and different auth/TLS/control surfaces [S3][S5];
- explicit proxy, IP rotation, headers, fingerprints, browser, CAPTCHA, retries,
  and validation [S1][S9][S14];
- parser-specific Google/Bing formats and published Google schemas [S4][S18];
- query mismatch, verification, rate, failed-query, and debug signals crossing
  routing/parser/billing layers [S10];
- separate response ID, pending state, retained result, and notification/pull
  behavior [S11-S13]; and
- Fast SERP's separate hostname, regions, volume gate, and compact parser [S15-S16].

**INFERENCE (high):** zone is the customer-visible policy/billing profile. A
planner composes an engine request and execution recipe; a validator accepts,
retries, or rejects the observed page; engine/surface parser families generate
output; sync and async are delivery façades over similar acquisition work.

**INFERENCE (medium):** separate browser and fast-parser worker pools are likely,
but technologies, isolation, reuse, vendors, retry fan-out, CAPTCHA suppliers,
and service boundaries are undisclosed. No stronger claim is warranted.

**Clean-room boundary:** Curiosity may learn from request/context typing,
validation, parser health, and evidence separation. It must not reconstruct
fingerprints, map peers, copy proprietary schemas/parser logic verbatim, solve
CAPTCHAs, or test protection bypass. [S22]

## 11. Curiosity implications and verdict ledger

### ADOPT

1. **Engine and surface explicitness** — a search observation must name its
   upstream and vertical.
2. **Context vector** — requested and effective country, language, location,
   device, browser, safe-search, and page state remain separate.
3. **Typed SERP modules** — organic, ad, local, news, image, shopping, answer,
   AI-generated, and continuation types retain their source class.
4. **Query-integrity check** — submitted, corrected, and detected/truncated query
   are distinct outcomes.
5. **Layered failure** — transport, provider policy/execution, upstream page,
   parser/artifact, semantic acceptance, and billing.
6. **Separate sync and retained async lifecycle** — response ID and pending/result
   state are explicit.
7. **Raw versus derivative artifact distinction** — HTML, provider JSON, Markdown,
   and screenshot are not interchangeable.

### ADAPT

1. Bright Data `zone` → adapter-owned provider profile, never core ABI.
2. Provider rank → observed engine/module/page/layout position, never portable
   relevance score.
3. Internal retries → only inside Curiosity wall-time, cost, and origin-pressure
   budgets; attempt count unknown unless reported.
4. Success-only billing → cost event, not evidence-quality event.
5. Async 48-hour retention → collection deadline, never archive policy.
6. Debug fields → restricted provenance with peer/destination/header redaction.
7. Light parsing → explicit lossy projection; required provenance cannot be
   projected away.
8. Parser/schema drift → lenient adapter edge, bounded raw envelope, fixtures,
   field-presence monitoring, and per-feature degradation.

### REJECT

1. SERP API as owned corpus, crawler, index, ranker, or source of primary evidence.
2. SERP snippets, AI Overviews, knowledge panels, ads, or reviews as verified facts.
3. Native proxy mode, provider root-CA installation, or disabled TLS validation.
4. Automatic escalation to CAPTCHA solving, custom cookies/headers, rendering,
   Fast SERP, Top-100 Scraper, or another engine/surface.
5. Reproducing fingerprints, proxy rotation, CAPTCHA handling, target-specific
   evasion, parser code, or peer/IP mapping.
6. Arbitrary target URLs, raw continuation links, cookies, headers, or webhook
   destinations supplied by an agent.
7. Random device/browser defaults for reproducibility-sensitive work.

### DEFER

1. Production provider adoption pending the checks below.
2. Baidu/Yahoo/Naver until exact contracts and output fidelity are documented.
3. Sensitive/personal queries pending explicit no-reuse and retention terms.
4. Async webhooks pending coherent endpoint and authenticity semantics.
5. Screenshot/Markdown and inline-media paths pending hard byte/time bounds.
6. Fast SERP and Google SERP 100 because they are distinct gated products/lanes.
7. Every engine/vertical pending upstream-specific legal and policy approval.

## 12. Unknowns and pre-adoption checks

Only later, separately authorized no-cost tests against approved public test
queries are contemplated. This report authorizes no execution.

### Contract and procurement

- Obtain a SERP-specific order form defining the product under MSA service terms
  and overriding any payload reuse right.
- Obtain current DPA, subprocessor/region map, transfer mechanism, deletion and
  incident SLAs, SOC 2, penetration-test scope, and support-access controls.
- Clarify output ownership/license, cache tenancy, query/payload/debug/attempt/log
  retention, backups, training/reuse, and post-termination handling.
- Obtain a versioning/deprecation policy for wire schemas, parsed fields, engine
  surfaces, and error codes.

### Request/response contract

- Resolve `format`/`data_format`/`brd_json`/zone-default precedence and invalid
  combinations; confirm direct custom-header expression without native proxy.
- Confirm accepted engines, exact host/path allowlist, methods, body/upload paths,
  redirect behavior, and Baidu/Yahoo/Naver output fidelity.
- Measure maximum query/URL/header/body/response/inline-media/screenshot/HTML sizes,
  redirect count, decompression, and wall time; verify truncation signaling.
- Verify full/light/Bing schema requiredness, parser version, additive/breaking
  changes, timestamp meaning, rank semantics, and raw-to-parsed binding.

### Context and provenance

- Verify requested versus used proxy country, engine country/language/location,
  user agent/device, consent state, and provider fallback evidence.
- Ask for exact acquisition start/end, final upstream URL, redirect chain, cache
  hit/age/bypass, attempt count, selected network class, and render/browser state.
- Preserve raw response hashes and compare parsed fields to raw only to validate
  contract fidelity—not to reverse engineer proprietary parser logic.
- Validate query correction, truncation/mismatch, empty result, missing module,
  partial parser, upstream block, and soft-error cases.

### Async and operations

- Establish canonical `/serp/*` versus `/unblocker/*` endpoints and response-ID
  location; validate result ownership and 48-hour expiry boundary.
- Test duplicate submission, cancellation/deletion absence, pending/error/expired
  states, maximum queue delay, and safe poll schedule.
- Obtain webhook signing, event ID, retries, timeout, replay/order guarantees, and
  source-IP change process; treat webhook only as a hint.
- Confirm rate-limit headers, enforcement period/lag, zone/account/host scope,
  usage export, kill switch, spend-limit lag, and custom-control billing switch.

### Security and policy

- Confirm API-key zone/resource scoping, source-IP allowlisting, audit events,
  rotation propagation, and synchronous/async result authorization.
- Confirm private/reserved/metadata destinations and unsafe paths cannot be reached
  through URL, redirect, image upload, parser continuation, or rendered subrequest.
- Counsel-review each engine/surface, jurisdiction, policy, retained field, and
  downstream use; prohibit login/nonpublic/account-personalized material.

## 13. Material contradictions and negative results

1. **Seven engines versus four documented adapters:** marketing names Google,
   Bing, DuckDuckGo, Yandex, Baidu, Yahoo, and Naver; OpenAPI summary and detailed
   query pages establish only four, and structured parsing only Google/Bing. [S1-S8]
2. **Output control drift:** OpenAPI `format=json`; quickstarts use `format=raw`
   plus `brd_json`; light parsing is absent from the OpenAPI enum; screenshot zone
   default has a known override bug. [S2-S5][S9]
3. **Async path/ID drift:** `/serp/*` and `/unblocker/*`, header and JSON response
   IDs, webhook-capable and pull-only descriptions coexist. [S11-S13]
4. **Unlimited concurrency versus limits:** marketing says unlimited; fair-use,
   host-health, account/zone, failed-query, and verification limits return 429.
   [S1][S10][S21]
5. **Real-time/fresh versus no cache contract:** no result-cache bypass, hit, age,
   key, or TTL is documented. Provider acquisition freshness remains unknown.
6. **Accuracy claims versus contract:** product pages claim “100% accurate”; the
   MSA disclaims accuracy/completeness, and the API has explicit query mismatch,
   verification, empty, parser, and upstream-change failure modes. [S1][S10][S22]
7. **Stable Top-100 boundary:** promoted from SERP docs but implemented as Web
   Scraper API dataset/snapshot and suffered a Google-side blocking outage. [S17][S19]
8. **Default reproducibility:** docs promise real-user/device fidelity while
   default desktop/browser identity is random and personalization state is absent.
9. **Fast SERP format requirement:** prose requires `parsed_light`; the organic
   example requires `parsed_fast`. Public contract is internally inconsistent. [S16]
10. **Schema requiredness:** parsing prose guarantees fields that the published
    JSON Schema does not mark required; examples use variant metadata names. [S4][S18]
11. **Hard limits:** no standard SERP body/output/render/redirect/sync-time/queue
    caps were found. This negative result is retained.
12. **Provenance:** no source-document capture/hash, snippet offset, upstream crawl
    timestamp, parser version, or cryptographic raw/parsed binding was found.

## 14. Bounded curiosity pass

Scoring is relevance/value/novelty/cost, each 1–5. This pass stayed inside the
declared public-source, standalone-SERP frame and stopped on **coverage +
saturation + exhaustion**: every requested dimension has primary-source coverage;
remaining material gaps require credentials, paid/active testing, private
contracts, upstream legal analysis, or prohibited internal/bypass inquiry.

| Thread | R/V/N/C | Decision/result |
|---|---:|---|
| Engine support versus parser fidelity | 5/5/4/1 | **Pursued.** Seven are marketed, four have detailed adapters, only Google/Bing have explicit structured parsing. [S1-S8] |
| Async endpoint/authenticity contradiction | 5/5/5/1 | **Pursued.** Found conflicting paths, ID locations, and webhook/pull claims; retained as adoption blocker. [S11-S13] |
| Cache/freshness contract | 5/5/4/2 | **Pursued.** No SERP cache control/evidence found; generic MSA cache clause does not prove caching. [S22] |
| Query truncation as semantic failure | 5/5/5/1 | **Pursued.** Provider distinguishes correction from cloaking and fails closed by default; adopted as integrity pattern. [S10] |
| Top-100 product boundary and outage | 4/4/5/1 | **Pursued.** It is a Web Scraper dataset, not transparent SERP pagination, and had an upstream-block outage. [S17][S19] |
| MSA payload-reuse applicability | 5/5/5/1 | **Pursued.** SERP naming is ambiguous despite proxy/browser behavior; elevated to procurement blocker. [S22] |
| Schema requiredness/version | 5/5/3/2 | **Pursued.** Public schema lacks required declarations and version guarantees; parser drift must be assumed. [S4][S18] |
| Paid/free live quality and geo benchmark | 4/4/2/5 | **CURIOSITY_NO_GO:** credentials and active tests prohibited; no benchmark authorization. |
| CAPTCHA, verification, or blocked-query experiment | 1/2/3/5 | **CURIOSITY_NO_GO:** outside clean-room behavior analysis and no-bypass boundary. |
| Peer/IP mapping or fingerprint reconstruction | 1/1/4/5 | **CURIOSITY_NO_GO:** unnecessary, invasive, and contractually restricted. [S22] |
| Proprietary parser/source/SDK inspection | 2/2/3/4 | **CURIOSITY_NO_GO:** public contracts suffice for the decision; implementation and private reverse engineering prohibited. |
| Exhaust every Google vertical field | 2/2/1/5 | **CURIOSITY_NO_GO:** representative schema reached semantic saturation; copying all fields adds no decision value. |
| Jurisdiction-specific legality opinion | 5/5/3/5 | **CURIOSITY_NO_GO:** counsel-only; recorded as engine/surface adoption gate. |
| Competitor benchmark | 2/3/2/5 | **CURIOSITY_NO_GO:** outside product frame and cannot be substantiated without controlled tests. |

No autonomous follow-up is authorized.

## 15. Fact / inference / recommendation ledger

| ID | Type | Claim/action | Confidence | Source/rationale | Verdict |
|---|---|---|---|---|---|
| L1 | FACT | SERP API is an upstream SERP access/unlock/parse product, not a documented owned index. | High | Product and request model [S1-S4]. | Context |
| L2 | FACT | Seven engines are marketed; only four have detailed request docs and only Google/Bing explicit parsing. | High | [S1][S4][S6-S8]. | Adapt per engine |
| L3 | FACT | Direct sync requires zone, URL, and format; locale/surface controls largely live in the target URL. | High | OpenAPI [S2]. | Adopt typed construction |
| L4 | FACT | Async retains results up to 48 hours and separates billed submit from free retrieval. | High | [S11][S14]. | Adapt with deadline |
| L5 | FACT | Query mismatch/truncation fails closed by default and differs from spelling correction. | High | [S10]. | Adopt integrity check |
| L6 | FACT | Output can be raw, parsed, lossy Markdown, or screenshot; schema is heterogeneous. | High | [S4][S18]. | Preserve derivation |
| L7 | FACT | Provider performs hidden retries and anti-blocking; one billed response may involve multiple attempts. | High | [S9][S14]. | Bound and mark unknown |
| L8 | FACT | No public SERP result-cache control or hit/age evidence was found. | High in negative result | Reviewed docs/index and MSA [S22]. | Freshness unknown |
| L9 | FACT | “Unlimited concurrency” is constrained by explicit rate/throttle controls. | High | [S1][S10][S21]. | Enforce lower bounds |
| L10 | INFERENCE | Product likely separates ingress, zone control, request planning, workers, validation, parsers, and async storage. | High | Triangulated public behavior. | Learning only |
| L11 | INFERENCE | SERP rank/snippet is an upstream observation, not primary evidence or portable relevance. | High | Upstream/parser/provenance model. | Reject as citation |
| L12 | INFERENCE | Requested geo/device does not prove a representative human observation. | High | Multi-signal context and random defaults. | Report requested/effective |
| L13 | RECOMMENDATION | Keep each engine/surface behind a bounded provider-neutral adapter. | High | Contract heterogeneity. | Adopt |
| L14 | RECOMMENDATION | Fetch and hash authorized destination pages separately before factual citation. | High | Provenance gap and repository constitution. | Adopt |
| L15 | RECOMMENDATION | Do not reproduce anti-blocking or proprietary parser behavior. | High | Clean-room/access/terms boundary. | Reject behavior |
| L16 | RECOMMENDATION | Require SERP-specific no-reuse, retention, legal, and security terms before production. | High | Public ambiguity [S22-S31]. | Deferred |

## Sources

All sources were accessed **2026-08-17**. Unless noted, sources are first-party
Bright Data materials. Product/performance statements are vendor assertions.

- **[S1]** Bright Data, “SERP API” product page and FAQ —
  https://brightdata.com/products/serp-api
- **[S2]** Bright Data, SERP API OpenAPI, `POST /request` —
  https://docs.brightdata.com/api-reference/rest-api/serp/serp-api
- **[S3]** Bright Data, “Send your first SERP API request” —
  https://docs.brightdata.com/scraping-automation/serp-api/send-your-first-request
- **[S4]** Bright Data, “Parsed JSON results with SERP API” —
  https://docs.brightdata.com/scraping-automation/serp-api/parsed-json-results/parsing-search-results
- **[S5]** Bright Data, “Google SERP features” —
  https://docs.brightdata.com/scraping-automation/serp-api/features
- **[S6]** Bright Data, Google query parameters —
  https://docs.brightdata.com/scraping-automation/serp-api/query-parameters/google
- **[S7]** Bright Data, Bing query parameters —
  https://docs.brightdata.com/scraping-automation/serp-api/query-parameters/bing
- **[S8]** Bright Data, DuckDuckGo and Yandex query parameters —
  https://docs.brightdata.com/scraping-automation/serp-api/query-parameters/duckduckgo and
  https://docs.brightdata.com/scraping-automation/serp-api/query-parameters/yandex
- **[S9]** Bright Data, SERP API configuration —
  https://docs.brightdata.com/scraping-automation/serp-api/configuration
- **[S10]** Bright Data, SERP troubleshooting, errors, query mismatch, and debug —
  https://docs.brightdata.com/scraping-automation/serp-api/debugging
- **[S11]** Bright Data, SERP async requests —
  https://docs.brightdata.com/scraping-automation/serp-api/asynchronous-requests
- **[S12]** Bright Data, “Your first async SERP API request” —
  https://docs.brightdata.com/scraping-automation/serp-api/your-first-async-request
- **[S13]** Bright Data, async request/result OpenAPI —
  https://docs.brightdata.com/api-reference/rest-api/serp/request and
  https://docs.brightdata.com/api-reference/rest-api/serp/get-results
- **[S14]** Bright Data, SERP pricing and billing —
  https://docs.brightdata.com/scraping-automation/serp-api/pricing-and-billing
- **[S15]** Bright Data, Fast SERP quickstart —
  https://docs.brightdata.com/scraping-automation/serp-api/fast-serp/quickstart
- **[S16]** Bright Data, Fast SERP web search —
  https://docs.brightdata.com/scraping-automation/serp-api/fast-serp/web-search
- **[S17]** Bright Data, “Get top 100 Google results” —
  https://docs.brightdata.com/scraping-automation/serp-api/get-top-100-google-results
- **[S18]** Bright Data, published Google Search JSON Schema —
  https://api.brightdata.com/data_schemas/serp/google_search.schema.json
- **[S19]** Bright Data, release notes — https://docs.brightdata.com/release-notes
- **[S20]** Bright Data, proxy product/target FAQ boundary (SERP routing and
  super-proxy bypass) — https://docs.brightdata.com/proxy-networks/faqs
- **[S21]** Bright Data, SERP fair-usage rate limit —
  https://docs.brightdata.com/general/usage-monitoring/serp-rate-limit
- **[S22]** Bright Data, Master Service Agreement, updated 2026-06-16 —
  https://brightdata.com/license
- **[S23]** Bright Data, Privacy Policy, reviewed 2026-05-14 —
  https://brightdata.com/privacy
- **[S24]** Bright Data, Service Level Agreement, updated 2026-05-24 —
  https://brightdata.com/sla
- **[S25]** Bright Data, Security & compliance —
  https://docs.brightdata.com/general/security/security-overview
- **[S26]** Bright Data, authentication and API-key roles —
  https://docs.brightdata.com/api-reference/authentication
- **[S27]** Bright Data, public Data Protection Addendum —
  https://brightdata.com/static/web/Bright-Data-Data-Protection-Agreement.pdf
- **[S28]** Bright Data, Acceptable Use Policy —
  https://brightdata.com/acceptable-use-policy
- **[S29]** Google, Terms of Service, effective 2026-07-30 (US) —
  https://policies.google.com/terms
- **[S30]** Microsoft, Services Agreement, effective 2025-09-30 —
  https://www.microsoft.com/en-us/servicesagreement
- **[S31]** DuckDuckGo, Terms of Service, updated 2025-01-07 —
  https://duckduckgo.com/terms

### Negative results retained

- No documented Bright Data-owned crawl corpus, index, or ranking model under
  standalone SERP API was found.
- No cross-engine fused result list or comparable rank score was found.
- No complete, equivalent parsed schema for all seven marketed engines was found.
- No stable parser/schema version, compatibility guarantee, or deprecation window
  was found.
- No SERP cache bypass/hit/age/key/TTL contract was found.
- No source-document capture ID/hash, snippet offset, or upstream crawl timestamp
  was found.
- No complete request/payload/log/attempt/backup retention and region/subprocessor
  map was found.
- No authoritative standard-SERP body, output, redirect, render, or wall-time caps
  were found.
- No independent controlled evidence for relevance, location fidelity, freshness,
  comparative accuracy, latency, or “real user” equivalence was found.
