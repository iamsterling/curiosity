# SerpApi as a SERP aggregation product: clean-room product dossier

**Research date / source access date:** 2026-08-17  
**Decision frame:** what SerpApi demonstrates about real-time SERP emulation and
aggregation, which contract and operational lessons Curiosity should adapt, and
which dependencies and boundaries make SerpApi unsuitable as an owned-search
foundation.  
**Status:** research only. No account was created, no API key or paid call was
used, no access control or anti-bot mechanism was tested or bypassed, and no
SerpApi or upstream code was inspected or copied.

## 1. Executive verdict

**REJECTED as Curiosity's owned-search foundation (high confidence).** SerpApi's
core aggregation product is a real-time emulation and parser layer over search,
maps, shopping, travel, social, marketplace, and review front ends. It buys a
simple authenticated API, global request emulation, anti-blocking operations,
and rich structured SERP features; it does not give Curiosity ownership of the
upstream corpus, ranking, freshness policy, or source-document evidence chain.
The official catalog now also includes a separate, preview, “own LLM-first web
index”; its corpus, crawl policy, freshness, ranking, and provenance are not
documented enough to alter that verdict [S1, S14].

**ADAPTED as an interface and operations precedent (high confidence).** Useful
patterns are an engine-explicit request, typed SERP feature blocks, separate
request/used localization, asynchronous job state, exact-request caching,
bounded field selection, raw-capture retention separate from parsed output,
engine-scoped health, and transparent parser incident tracking [S2-S10, S15].

**REJECTED as a behavior to reproduce (high confidence).** Curiosity should not
copy CAPTCHA solving, proxy rotation, protection bypass, browser fingerprints,
undocumented endpoint behavior, or proprietary parsers. It should neither seed
an owned index from SerpApi output nor treat snippets as source documents.
Public API behavior may inform a provider-neutral specification; implementation
must be independent and based on authorized sources, standards, and original
fixtures.

## 2. Bounded questions, method, and evidence labels

### 2.1 Questions

1. Which upstream products and result surfaces does SerpApi expose?
2. How does it emulate user requests across query, place, locale, device, and
   pagination dimensions?
3. What is normalized, what remains engine-specific, and what provenance is
   preserved or lost?
4. How do caching, archives, asynchronous work, errors, blocking, and parser
   drift affect freshness and reliability?
5. What legal, contractual, privacy, and economic boundaries remain with the
   buyer despite SerpApi's “Legal Shield” and “ZeroTrace” features?
6. Which architecture can be inferred clean-room from public behavior, and what
   should Curiosity adopt, adapt, reject, or defer?

### 2.2 Method and limits

Primary sources were SerpApi's official API catalog, engine documentation,
pricing, legal/privacy, security, status, release notes, feature pages, and
public roadmap; representative upstream terms were checked for Google,
Microsoft/Bing, and DuckDuckGo. All were accessed 2026-08-17. Vendor pages prove
documented behavior or claims, not comparative quality. Point-in-time status
figures are not an availability benchmark. No live result quality, latency,
geolocation, cache-key, schema-compatibility, or retention behavior was tested.

Labels:

- **FACT** — directly stated or exemplified in a cited primary source.
- **INFERENCE** — a bounded explanation consistent with multiple public facts,
  but not a claim about undisclosed implementation.
- **RECOMMENDATION** — a Curiosity design or governance choice.
- Confidence is **high**, **medium**, or **low**.

## 3. Product boundary and supported upstreams

### 3.1 What the product is

**FACT (high):** SerpApi presents one authenticated `/search` family selected by
an `engine` parameter, plus engine-specific documentation and schemas. Its home
page says it supplies global IPs/proxies, a browser cluster, CAPTCHA solving,
location emulation, and structured JSON; engine docs also offer raw HTML and
Markdown output [S1-S3].

**INFERENCE (high):** “aggregation” here means a portfolio under one commercial
API and account, not metasearch fusion. A normal request chooses one upstream or
surface; the documented response preserves that upstream's ranking and feature
layout. SerpApi does not document merging Google, Bing, and DuckDuckGo into one
ranked list.

### 3.2 Upstream families visible in the official catalog

The catalog advertised **100+ APIs**, but that number counts surfaces and
vertical endpoints, not independent search indexes [S1, S13]. The named external
families on 2026-08-17 were:

| Family | Documented surfaces (representative, not every sub-parser) | Product character |
| --- | --- | --- |
| Google | Search/Light, AI Mode/Overview, Ads, Maps/Local, Images, News, Shopping, Videos, Scholar, Patents, Trends, Jobs, Flights, Hotels, Finance, Play, Lens, Sports, related questions | Dominant and deepest adapter family; web SERP plus many specialized Google front ends. |
| Bing | Search, Copilot, Images, Maps, News, Product/Shopping, reverse image, Videos | Web and vertical SERPs. |
| DuckDuckGo | Search/Light, Maps, News, Search Assist | Web SERP and related surfaces. |
| Yahoo and Yandex | Yahoo Search/Images/Shopping/Videos; Yandex Search/Images/reverse image/Videos | Regional/general web and media search. |
| Baidu and Naver | Baidu Search/News; Naver Search/AI Overview | Regional search products. |
| Amazon, eBay, Walmart, Home Depot | Search, product and selected review/seller/autocomplete surfaces | Marketplace/product discovery rather than general web search. |
| Apple | App Store search/product/reviews; Maps/place search | App and local discovery. |
| Tripadvisor, Yelp, OpenTable | Search/place/review surfaces as available | Local/review data. |
| YouTube | Search, video, transcript | Video discovery/content metadata. |
| Facebook and Instagram | Profile APIs | Narrow social-profile extraction, not general social search. |
| Brave | AI Mode | An answer surface, not a documented Brave raw-web Search API in this catalog. |

**FACT (high):** SerpApi also lists `engine=search_index`, described as its own
LLM-first web index, “currently in preview,” with ordinary and `deep` mode; deep
mode fans out parallel subqueries for recall/diversity. The page says this path
needs no browser [S14].

**UNKNOWN:** whether any other SerpApi surface is backed by a licensed upstream
API instead of browser/front-end retrieval; the catalog does not disclose the
transport for each engine. **UNKNOWN:** Search Index corpus size/composition,
crawler identity, robots and takedown policy, crawl times, ranking model,
deduplication, geographic coverage, or preview-specific service guarantees.

## 4. Request emulation

### 4.1 Common commercial control plane

Across the reviewed Google, Bing, DuckDuckGo, Amazon, and Yandex docs, SerpApi
repeats these controls [S2, S4-S7]:

- API key and explicit `engine`;
- synchronous response or `async=true` job submission;
- `no_cache=true` to force an upstream fetch;
- `zero_trace=true` for eligible enterprise accounts;
- JSON, raw HTML, or Markdown output where supported;
- `json_restrictor` to select response branches and fields.

`async` and `no_cache` are documented as mutually exclusive. Async jobs move
through `Queued`/`Processing` to `Success` or `Error` and are retrieved through
the archive API [S2, S8, S9].

### 4.2 Upstream-native request semantics are intentionally retained

The gateway is common; the query dialect is not:

| Engine | Query | Place/locale | Pagination | Selected special controls |
| --- | --- | --- | --- | --- |
| Google | `q` | `location`, encoded `uule`, or lat/lon; `google_domain`, `gl`, `hl`, `cr`, `lr` | `start` offset, normally 0/10/20 | `tbs`, `tbm`, `safe`, omitted/similar filter, device. |
| Bing | `q` | `location`, lat/lon, market `mkt`, country `cc` | `first`, one-based organic offset | `safeSearch`, opaque Bing `filters`, device. |
| DuckDuckGo | `q` (documented max 500 chars) | region `kl` | `start` and maximum `m`; initial and later result counts differ | `df` date filter, `safe`, optional Search Assist; no common `device` documented. |
| Amazon | `k` or category `node` | Amazon domain, locale, delivery ZIP/country | one-based `page` | sort, attribute filter `rh`, device. |
| Yandex | `text` (max 400 chars; upstream usually accepts first 40 words) | domain, `lang`, numeric region `lr` | zero-based `p` | family mode, typo correction, sort and period. |

**FACT (high):** Google device values are desktop (default), tablet (documented
as iPads), and mobile. Bing and Amazon expose the same named choices. Device is
not a universal cross-engine capability [S2, S4-S7].

**FACT (high):** Google location emulation is multi-signal. Documentation warns
that `location` alone can still be influenced by the proxy country and recommends
pairing it with `gl`; it also recommends city-level locations and documents
mutual exclusions among `location`, `uule`, and lat/lon. The home page says
SerpApi routes through a proxy near the requested location and uses Google's
encrypted geolocation parameter. The free locations endpoint returns canonical
names, Google IDs/parents, type, reach, country, and sometimes coordinates
[S2, S10].

**INFERENCE (high):** faithful emulation requires a vector, not a single locale:
upstream domain, egress country/region, encoded location, coordinates, language,
country restriction, market, device/browser profile, safe-search, and upstream
session/layout can each change the SERP. A neutral abstraction that collapses
these to one `locale` string loses reproducibility.

### 4.3 Request realism and personalization limits

**FACT (medium):** SerpApi says each classic API request runs immediately in a
full browser and “mimics” a human, including CAPTCHA solving [S3]. This statement
cannot apply literally to the separately documented Search Index (“no browser
needed”) and may not describe every Light/specialized path [S14].

**UNKNOWN:** cookie state, signed-in state, history, experiment assignment,
consent screens, exact browser versions, user-agent selection, residential vs.
datacenter egress mix, or whether requests share any upstream session. Therefore
“what users truly see” is a marketing claim, not reproducible equivalence to a
particular person.

## 5. Result normalization and provenance

### 5.1 Normalization model

**FACT (high):** reviewed web engines converge on familiar blocks such as
`search_information`, `organic_results`, ads, knowledge graph/answer-like
features, related searches, and `serpapi_pagination`. Organic hits commonly have
`position`, `title`, `link`, and `snippet`; richer fields vary by engine. Product
engines add identifiers, prices, ratings, delivery, sponsorship, variants, and
filters. Google emits many SERP-specific blocks, including local, knowledge,
questions, perspectives, shopping, and refinement structures [S2, S4-S7].

**INFERENCE (high):** this is a *convergent vocabulary with adapter-specific
extensions*, not a stable universal result schema. Evidence:

- request names and pagination semantics remain upstream-native;
- the same conceptual feature can have different fields and nesting;
- output contains both parsed values and upstream/SerpApi continuation links;
- release notes continually add, remove, and repair fields as layouts change
  [S15].

### 5.2 What provenance is present

Useful lineage elements documented across pages include:

- selected engine and echoed/derived search parameters;
- `search_metadata.id`, processing status, and archive endpoints;
- `location_requested` versus `location_used` in examples;
- upstream result position and result-class/block identity;
- destination, displayed, redirect/tracking, and `serpapi_link` URLs where
  available;
- raw upstream HTML retrievable for up to 31 days under the normal archive
  policy; and
- source labels, upstream-specific IDs (for example ASIN/place IDs), snippets,
  dates, and media URLs where parsed [S2, S4-S9].

### 5.3 What provenance is absent or insufficient for Curiosity

**FACT/INFERENCE (high):** the public response examples do not establish a
source-document chain of custody. They do not provide a stable upstream index
snapshot, upstream crawl time, destination-page fetch/capture ID, content hash,
snippet offsets into a captured document, parser/schema version, result-owner
cluster, or evidence that a current destination page contains the displayed
snippet. `position` is upstream presentation order, not an independently
explained relevance score.

Markdown output further removes tracking fields, opaque tokens, redirect URLs,
and duplicate numeric extractions to reduce tokens, while claiming to preserve
informational content [S13]. That can be useful for LLM context but is a lossy
projection and should never be the audit record.

**RECOMMENDATION (high):** Curiosity should ingest a small provider adapter
projection only: provider/engine, immutable request fingerprint, requested and
effective locale/device, provider search ID, fetch/response time, result class
and rank, destination and observed upstream links, title/snippet, warnings, and
raw-response hash. It should then fetch authorized primary documents separately
and cite capture-bound passages. Never convert a SERP snippet into a primary
source merely because it is structured JSON.

## 6. Pagination, localization, device, and boundedness

**FACT (high):** SerpApi provides upstream pagination links and often
`serpapi_pagination`, but controls differ: offsets can be zero- or one-based,
page numbers can be zero- or one-based, and DuckDuckGo warns of variable counts
and duplicates at higher offsets [S2, S4-S7].

**INFERENCE (high):** a generic “next page” loop is unsafe. It can duplicate
results, silently shift locale/device defaults, follow opaque tokens, amplify
cost, and magnify upstream drift. Continuation URLs are also untrusted external
data, even when generated by a provider.

**RECOMMENDATION (high):** a Curiosity adapter should parse only documented
continuations, pin all effective parameters, enforce page/result/deadline/cost
ceilings, URL-deduplicate without pretending that URL identity equals content
identity, and return `pagination_incomplete` or `continuation_rejected` rather
than improvising. Localization should retain each dimension separately and
report provider fallbacks or mismatches.

## 7. Freshness, caching, archives, and schema drift

### 7.1 Three different kinds of “freshness”

1. **Retrieval freshness.** The common cache is keyed by the exact query and all
   parameters and expires after one hour. Cached searches are free; `no_cache`
   forces a fresh provider fetch [S2, S4-S7].
2. **SERP freshness.** A forced fetch obtains the upstream's current displayed
   SERP, subject to upstream index, location, experiments, and blocking. It says
   nothing about when upstream crawled each destination.
3. **Evidence freshness.** Result dates are upstream-displayed claims. SerpApi
   does not establish current destination content or publication validity.

**RECOMMENDATION (high):** expose `provider_fetched_at`, `cache_hit`, cache age,
and any result date separately. Never label `no_cache=true` “fresh web content.”

### 7.2 Retention and reproducibility

**FACT (high):** without ZeroTrace, completed JSON and raw HTML can be retrieved
from Search Archive for up to 31 days; an expired record yields HTTP 410. Async
searches depend on this archive mechanism. ZeroTrace instead skips database and
file retention and therefore makes provider-side debugging harder [S8-S12].

**INFERENCE (high):** one-hour exact-request caching and 31-day search archives
optimize cost, support, and reproducibility but create query/result retention
and tenancy questions. Public docs do not say whether a cache hit is physically
shared across customers, only that exact parameters can return a cached result.

### 7.3 Parser and layout drift

**FACT (high):** the 2026-08-17 release page records a continuous stream of
missing/incorrect fields, empty results, localization discrepancies, mobile
layout differences, timeouts, and upstream changes across engines. Same-day
examples included Google Shopping localization and empty-result repairs and
Google Search `/goto` URL repair [S15].

**INFERENCE (high):** parser correctness is a live operational process, not a
one-time schema integration. There is no public versioned response-schema
contract or compatibility window identified in this review.

**RECOMMENDATION (high):** treat provider JSON as untrusted and version-drifting:
validate leniently at the adapter edge, preserve unknown fields only in a
bounded raw envelope, fixture-test known variants, monitor field-presence and
semantic anomalies, and never fail the entire research response because one
rich SERP block changed.

## 8. Failure model and anti-blocking dependencies

### 8.1 Documented failure semantics

**FACT (high):** HTTP status classes are conventional: 400 input, 401 key, 403
permission, 410 archive expiry, 429 either hourly throughput exhaustion or no
remaining searches, and 500/503 server errors. Search state is separately
`Queued`, `Processing`, `Success`, or `Error`. A 200/`Success` may still contain
empty results and a top-level error because an empty upstream SERP is considered
a successfully processed search [S9].

**RECOMMENDATION (high):** Curiosity must classify at least validation,
authentication, quota, provider-empty, provider-soft-block, proxy timeout,
parser-empty, partial-field loss, provider error, and archive expiry. HTTP 200
must not imply useful evidence; retries need class-specific ceilings and jitter.

### 8.2 Anti-blocking system and its dependencies

Documented pieces are:

- global IP/proxy infrastructure and egress near requested locations;
- browser execution for the classic scraping path;
- CAPTCHA solving;
- validators that reject bad HTML, CAPTCHA pages, error pages, and other
  abnormalities;
- Best Effort versus prioritized speed modes; Ludicrous Speed uses twice the
  server resources and “numerous parallel requests,” while Max is priced at four
  times base; and
- an explicit `Proxy timeout` example as an error cause [S3, S9, S18].

**INFERENCE (high):** availability depends jointly on SerpApi capacity, browser
and parser correctness, proxy reputation/geography, CAPTCHA handling, the
upstream front end, and the upstream index. Parallel speculative attempts can
reduce tail latency but increase upstream traffic and cost. Exact algorithms,
vendors, retry fan-out, and CAPTCHA providers are undisclosed.

**FACT (high):** the public status page exposes engine/surface-specific outages.
On the research date it attributed a Google-family degradation to “changes on
Google's end”; it also described an eBay degradation caused by filters moving
behind login and active Home Depot degradation. The page's 90-day aggregates
varied materially by surface even while the top API aggregate was near its SLA
[S16].

**RECOMMENDATION (high):** do not reproduce evasion. Architect an optional
SerpApi adapter as a fallible external dependency with circuit breakers,
per-engine health, strict deadlines, bounded retries, cache policy, and a second
lawfully sourced provider or owned corpus where authorized. Never broaden agent
authority to “fix” a soft block.

## 9. Legal, upstream terms, and privacy boundaries

This section identifies review gates; it is not legal advice.

### 9.1 SerpApi contract and “U.S. Legal Shield”

**FACT (high):** SerpApi's Terms prohibit illegal/unauthorized use, rights
violations, malicious code, and circumvention of SerpApi or related security
features; allow service/pricing changes and refusal/termination; disclaim
accuracy, reliability, uninterrupted service, and most warranties; and apply
Texas law [S11].

For Production and higher, the Terms describe a “U.S. Legal Shield” up to $2
million for liabilities from lawful scraping/parsing of public search data. It
does **not** cover illegal downstream use; listed exclusions include copyright,
DMCA, other IP, and privacy violations. Coverage is limited to claims under U.S.
state/federal law in U.S. courts. SerpApi recommends buyer counsel for data use
[S11, S17].

**INFERENCE (high):** this is a conditional contractual allocation of some
litigation risk, not permission from an upstream, a content license, a finding
that every endpoint is lawful, or protection for Curiosity's storage,
publication, model training, profiling, or international use. Exact policy,
defense-control, exclusions, insured status, and customer agreement terms need
counsel review.

### 9.2 Upstream terms remain material

**FACT (high):** Google's U.S. Terms effective 2026-07-30 prohibit bypassing
protective measures, automated access that violates machine-readable
instructions, reverse engineering for proprietary information, and use that
violates rights; they identify scraping content that does not belong to the
user as possible grounds for suspension [S19]. Microsoft's consumer terms
prohibit circumventing access/availability restrictions, give “impermissible
scraping” as an example, prohibit helping others break the rules, and impose
additional Bing terms [S20]. DuckDuckGo requires compliance with its Terms and
Acceptable Use Policy and reserves suspension/termination [S21].

**RECOMMENDATION (high):** before enabling any SerpApi engine, counsel must
review that exact upstream product, jurisdiction, request method, intended data
fields, retention, display, and downstream use. SerpApi's catalog breadth makes
this a matrix, not one approval. Do not enable profile, reviews, transcripts,
maps, shopping, or AI-answer endpoints merely because the web-search adapter was
approved.

### 9.3 Content rights and data-use boundary

SERPs mix upstream-authored layout, publisher snippets, user reviews, images,
prices, ratings, ads, personal/profile data, and links. Public accessibility and
API purchase do not transfer underlying copyright, database, privacy,
publicity, trademark, or contract rights. Raw HTML, thumbnails, transcripts,
reviews, maps, and profile data require separate purpose/retention/display
analysis. SerpApi itself disclaims responsibility for third-party material and
accuracy [S11].

### 9.4 Query and result privacy

**FACT (high):** ordinary operation stores retrievable search JSON and HTML for
up to 31 days. SerpApi's Privacy Policy says it collects account/purchase data
and website IP/browser information, may disclose when legally required, uses
cookies, and names AWS, DigitalOcean, and Wasabi as main cloud/hosting providers
[S8, S11]. Its security page claims HTTPS, encrypted inter-server traffic,
redundancy, audit logs, SOC 2 Type II/SOC 3/ISO 27001, and a zero-trust network
posture; GDPR is shown as “In Progress,” not acquired [S12].

**FACT (high):** Enterprise ZeroTrace skips search parameters, metadata,
database records, and search files on SerpApi systems, subject to legally
required retention. For third parties outside its control, SerpApi sends a Do
Not Track header on requests that may contain ZeroTrace data [S11].

**INFERENCE (high):** DNT is a request signal, not proof that an upstream,
proxy, CAPTCHA service, CDN, or network does not observe or retain query data.
ZeroTrace also conflicts operationally with provider-side archive replay and
debugging. The public policy does not provide a complete subprocessor list,
regional data-flow map, default query-log purpose, backup deletion schedule,
cache-tenancy statement, or data-processing agreement in the reviewed pages.

**RECOMMENDATION (high):** never send secrets, personal case details, internal
URLs, account identifiers, or privileged text in a search query. Pseudonymize
research branches, separate API keys by environment/tenant, prohibit keys in
URLs/logs where an authorization header or protected gateway can be used,
minimize retained raw responses, and require DPA/subprocessor/region/erasure and
ZeroTrace verification before sensitive workloads.

## 10. Pricing and economics

**FACT (high):** only successful searches count. Cached, errored, and failed
searches do not; an empty successful response counts, and 100 results cost the
same one credit as fewer results. Plans are month-to-month, throughput is a
guaranteed successful-searches-per-hour allowance, and automatic early renewal
can replenish exhausted volume [S22].

Selected public prices on 2026-08-17:

| Plan | USD/month | Searches/month | Throughput/hour | Effective USD/1,000 included searches |
| --- | ---: | ---: | ---: | ---: |
| Free | 0 | 250 | 50 | — |
| Starter | 25 | 1,000 | 200 | 25.00 |
| Developer | 75 | 5,000 | 1,000 | 15.00 |
| Production | 150 | 15,000 | 3,000 | 10.00 |
| Big Data | 275 | 30,000 | 6,000 | 9.17 |
| Searcher | 725 | 100,000 | 20,000 | 7.25 |
| Volume | 1,475 | 250,000 | 50,000 | 5.90 |
| Infrastructure | 2,750 | 500,000 | 100,000 | 5.50 |
| Cloud 1M | 3,750 | 1,000,000 | 110,000 | 3.75 |
| Cloud 10M | 21,125 | 10,000,000 | 200,000 | 2.11 |
| Cloud 54M | 104,100 | 54,000,000 | 640,000 | 1.93 |

Production and above include the advertised Legal Shield; listed Cloud plans
include ZeroTrace and priority support. Best Effort is 1x, Ludicrous Speed 2x,
and Ludicrous Speed Max 4x base price [S18, S22].

**INFERENCE (high):** total research cost is driven by request fan-out, not hit
count. Every engine comparison, localization/device variant, uncached replay,
and successful pagination request consumes another search. A bounded Curiosity
pass with `B` branches, `E` engines, `L` locale/device variants, and `P` pages has
an upper request envelope of roughly `B*E*L*P` before retries; retries that fail
may be unbilled but still spend latency and operational budget. Exact cache hits
can lower spend while weakening freshness and privacy assumptions.

**RECOMMENDATION (high):** price by *useful, verified primary-source evidence*,
not API hits. Meter provider requests, cache-hit rate, empty/duplicate rate,
primary-source conversion, branch marginal gain, latency, and downstream token
cost. Set one aggregate research budget before query expansion and do not let
“failed calls are free” justify unbounded retries.

## 11. Clean-room architecture inference

The following is a behavioral model, not a claim about private source code:

```text
client
  -> API edge: auth, account, quota/throughput, input validation
  -> exact-request cache
  -> search job + state (sync wait or async archive ID)
  -> engine/surface adapter
       -> location/domain/device/session construction
       -> proxy/egress selection
       -> browser/light/direct/index execution lane
       -> bounded parallel attempts + page/CAPTCHA/error validation
  -> raw response/file retention (unless ZeroTrace)
  -> engine-specific parser and typed feature blocks
  -> common metadata/pagination envelope
  -> JSON | raw HTML | lossy Markdown/restricted projection
  -> 31-day archive and operational metrics
```

Evidence for this decomposition is the common gateway, exact cache, async state,
archive ID/raw HTML, per-engine parameter and output docs, browser/proxy/CAPTCHA
claims, parallel speed mode, validators, object/database references, and
engine-specific status/release streams [S2-S18].

**UNKNOWN:** service boundaries, queue/storage technology, parser language,
browser automation stack, proxy suppliers, CAPTCHA suppliers, cache topology,
tenant isolation design, retry algorithm, raw-file encryption keys, and disaster
recovery. No Curiosity decision requires those details.

## 12. Curiosity implications and proposed provider boundary

### 12.1 Adopt/adapt

- **ADOPT:** explicit effective locale/device and provider engine; request ID and
  lifecycle; typed result classes; strict pagination and cost budgets; partial
  result/failure semantics; per-engine health; raw-versus-projected separation.
- **ADAPT:** cache identity should use a canonical request fingerprint plus
  provider/schema/policy versions, while response exposes cache age. Archives
  should retain only authorized, encrypted, bounded records under project policy.
- **ADAPT:** field restriction can reduce payload/token cost, but provenance and
  trust metadata must be non-removable in the provider-neutral contract.
- **ADAPT:** release notes and field-presence monitors should feed adapter
  compatibility tests; provider drift should degrade one feature, not widen
  retries or agent authority.

### 12.2 Reject/defer

- **REJECT:** SerpApi as owned corpus/index/ranker, SERP scraping as an index
  seed, snippets as citations, transparent cross-engine score comparison, and
  CAPTCHA/proxy evasion as project capability.
- **REJECT:** a single universal schema that erases engine-native semantics.
- **DEFER:** any production SerpApi adapter until upstream-by-upstream legal,
  privacy, security, DPA, retention, SLA, and benchmark gates pass.
- **DEFER:** SerpApi Search Index until corpus, provenance, freshness, deletion,
  legal, ranking, and independent quality evidence are available.

### 12.3 Bounded agent flow

```text
caller frame + authority + total provider/deadline budget
  -> provider-neutral SearchRequest
  -> optional SerpApi adapter with allowlisted engine/surface
  -> validate + bound + classify + mark untrusted
  -> deduplicate/diversify leads
  -> fetch and verify primary sources through a separate authorized path
  -> cite capture-bound evidence, not SERP text
  -> synthesize facts/inferences/unknowns
  -> one scored in-frame curiosity pass
  -> stop on coverage, saturation, policy block, or budget exhaustion
```

Search output must not carry instructions or authority. Rich snippets, AI
answers, profile text, reviews, and Markdown are untrusted external content and
possible prompt-injection channels. The researcher may use them to discover a
source, never to authorize tools, reveal secrets, or trigger actions.

## 13. Fact / inference / recommendation ledger

| ID | Type | Claim or action | Confidence | Source / rationale | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | One account/gateway exposes 100+ engine and vertical APIs. | High | Official catalog and Markdown page [S1, S13]. | Context |
| L2 | FACT | A standard search selects one `engine`; no documented cross-engine fused rank exists. | High | Representative engine requests [S2, S4-S7]. | Context |
| L3 | FACT | Classic product advertises browsers, global proxies, geolocation and CAPTCHA solving. | High | Official home [S3]. | Rejected behavior |
| L4 | FACT | Exact-parameter cache TTL is one hour; cached searches are free. | High | Repeated engine docs [S2, S4-S7]. | Adapted |
| L5 | FACT | Normal searches and raw HTML are archived up to 31 days. | High | Archive API [S8]. | Adapted with tighter policy |
| L6 | FACT | 200/Success can be empty and carry an error. | High | Status/error docs [S9]. | Adopted failure distinction |
| L7 | FACT | Pagination and localization semantics differ materially by engine. | High | Engine docs [S2, S4-S7]. | Preserve in adapters |
| L8 | FACT | Markdown is intentionally lossy for tracking/opaque/duplicate fields. | High | Markdown docs [S13]. | Reject as audit record |
| L9 | FACT | Public release/status records show persistent parser and upstream drift. | High | [S15, S16]. | Adopt monitoring |
| L10 | FACT | Search Index is a separate preview own-index path with undocumented corpus provenance. | High/medium | Offer is fact; omissions are review result [S14]. | Deferred |
| L11 | INFERENCE | Product architecture has API/cache/job/adapter/execution/parser/archive stages. | High | Triangulated public behavior [S2-S18]. | Learning only |
| L12 | INFERENCE | “Real-time” means retrieval time, not destination capture/index freshness. | High | Cache/upstream model and missing crawl lineage. | Correct terminology |
| L13 | INFERENCE | Organic schema is convergent, not universal or version-stable. | High | Cross-engine examples and release drift. | Keep neutral core small |
| L14 | INFERENCE | Legal Shield does not supply upstream permission or downstream content rights. | High | Express limits [S11, S17] and upstream terms [S19-S21]. | Mandatory counsel gate |
| L15 | INFERENCE | ZeroTrace cannot guarantee non-observation by uncontrolled upstreams. | High | DNT description and third-party caveat [S11]. | Sensitive use deferred |
| L16 | RECOMMENDATION | Use SERPs only as untrusted discovery leads; independently capture primary sources. | High | Provenance gap and repository constitution. | Adopted |
| L17 | RECOMMENDATION | Keep engine-specific adapters behind a bounded provider-neutral contract. | High | Request/schema heterogeneity. | Adopted |
| L18 | RECOMMENDATION | Do not reproduce proxy/CAPTCHA bypass or proprietary parser behavior. | High | Clean-room and terms boundary. | Rejected |
| L19 | RECOMMENDATION | Meter branch marginal evidence gain and precompute worst-case request fan-out. | High | Per-request pricing and Curiosity bounds. | Adopted |
| L20 | RECOMMENDATION | Require legal/privacy/security approval for each engine and data surface. | High | Rights and terms differ by upstream/content class. | Deferred pending review |

## 14. Unknowns and checks required before any adoption

1. Obtain the operative enterprise agreement, DPA, subprocessor list, data
   regions, cache-isolation statement, backup/erasure schedule, incident terms,
   defense-control details, and Legal Shield policy/exclusions.
2. Have counsel decide, per enabled upstream and jurisdiction, whether the exact
   access, parsing, retention, display, and downstream use is authorized.
3. Confirm API-key transport, IP restrictions, rotation, team RBAC, audit logs,
   webhook/archive access, and whether ZeroTrace applies to all intermediaries.
4. Run an approved unpaid-or-budgeted benchmark later with a frozen query set:
   locale/device fidelity, primary-source recall, duplicates, empty/soft-block
   classification, field stability, cache semantics, p50/p95/p99, and cost.
5. Contract-test schema drift and determine whether SerpApi offers versions,
   deprecation notice, compatibility periods, idempotency, request cancellation,
   and maximum response/body limits.
6. For Search Index, obtain crawl/corpus/robots/takedown, document version,
   passage provenance, freshness, ranking, data-rights, and deletion evidence.

## 15. Curiosity pass and stop decision

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Distinguish aggregation from new Search Index | 5 | 5 | 5 | 1 | **Pursued:** found preview own-index path, but provenance omissions preserve the rejection/defer verdict [S14]. |
| Verify whether drift is theoretical | 5 | 5 | 4 | 1 | **Pursued:** release notes/status show same-day parser, localization, empty-result and upstream-change incidents [S15, S16]. |
| Verify privacy claim against archive behavior | 5 | 5 | 4 | 1 | **Pursued:** default 31-day archive and Enterprise ZeroTrace are distinct; DNT does not control third parties [S8, S11]. |
| Enumerate every parameter/field in 100+ APIs | 2 | 2 | 1 | 5 | `CURIOSITY_NO_GO`: representative families reached semantic saturation; exhaustive copying adds no decision value. |
| Execute live free searches to fingerprint behavior | 3 | 3 | 3 | 4 | `CURIOSITY_NO_GO`: caller prohibited calls/credentials; no benchmark frame or consent. |
| Discover private proxy/CAPTCHA/parser implementation | 1 | 1 | 4 | 5 | `CURIOSITY_NO_GO`: outside clean-room need and risks prohibited bypass/trade-secret inquiry. |
| Give jurisdiction-specific legality opinion | 5 | 5 | 3 | 5 | `CURIOSITY_NO_GO`: counsel-only; retained as adoption gate. |
| Compare all competitors' price/quality | 2 | 3 | 2 | 5 | `CURIOSITY_NO_GO`: outside SerpApi frame and impossible without controlled paid benchmark. |

**Coverage stop:** all requested categories—upstreams, request emulation,
normalization/provenance, pagination/localization/device, freshness/cache,
failure/anti-blocking, legal/privacy, economics, architecture inference,
clean-room lessons, and Curiosity implications—have primary evidence and a
verdict. **Saturation stop:** additional engine pages repeat the common control
plane while varying only adapter semantics. **Exhaustion stop:** legal contract,
private architecture, and empirical quality remain unavailable without caller
authority, credentials, paid tests, or counsel. No autonomous follow-up is
authorized.

## 16. Primary sources

All accessed 2026-08-17.

1. **[S1] SerpApi, Search Engine APIs catalog.**
   https://serpapi.com/search-engine-apis — official surface/upstream inventory.
2. **[S2] SerpApi, Google Search API.** https://serpapi.com/search-api — request,
   geolocation, locale, device, cache/async/ZeroTrace, response, pagination.
3. **[S3] SerpApi home/product page.** https://serpapi.com/ — browsers, proxies,
   CAPTCHA solving, geolocation, structured results, SLA and product claims.
4. **[S4] SerpApi, Bing Search API.** https://serpapi.com/bing-search-api — Bing
   market/country, device, filters, pagination, common controls and schema.
5. **[S5] SerpApi, DuckDuckGo Search API.**
   https://serpapi.com/duckduckgo-search-api — region/date/safe controls,
   pagination variability/duplicates, Search Assist and common controls.
6. **[S6] SerpApi, Amazon Search API.**
   https://serpapi.com/amazon-search-api — marketplace localization, delivery,
   sorting/filtering, page semantics, product schema and common controls.
7. **[S7] SerpApi, Yandex Search API.**
   https://serpapi.com/yandex-search-api — domain/language/region, date/sort,
   zero-based pages, query limits and common controls.
8. **[S8] SerpApi, Search Archive API.**
   https://serpapi.com/search-archive-api — IDs, states, JSON/raw HTML and 31-day
   retention/retrieval boundary.
9. **[S9] SerpApi, Status and Error Codes.**
   https://serpapi.com/api-status-and-error-codes — HTTP/search states, proxy
   timeout, empty-success semantics and error examples.
10. **[S10] SerpApi, Supported Locations API.**
    https://serpapi.com/locations-api — location resolution, canonical names,
    IDs, reach, types and coordinates.
11. **[S11] SerpApi, Legal Documents and ZeroTrace Mode.**
    https://serpapi.com/legal and https://serpapi.com/zero-trace-mode — Terms,
    Privacy Policy, retention exception, third-party/DNT boundary.
12. **[S12] SerpApi, Security.** https://serpapi.com/security — cloud providers,
    encryption, audits/certification claims, network posture and GDPR status.
13. **[S13] SerpApi, Markdown Output and JSON Restrictor.**
    https://serpapi.com/markdown-output and https://serpapi.com/json-restrictor —
    lossy LLM projection, 100+ API claim, and field-selection semantics.
14. **[S14] SerpApi, Search Index.** https://serpapi.com/search-index-api —
    preview own-index product, no-browser path, pagination and deep fan-out mode.
15. **[S15] SerpApi, Release Notes and Public Roadmap.**
    https://serpapi.com/release-notes and
    https://github.com/serpapi/public-roadmap — primary parser/feature drift and
    issue workflow.
16. **[S16] SerpApi Statuspage and API status.** https://status.serpapi.com/ and
    https://serpapi.com/status — point-in-time upstream/surface incidents,
    success/latency summaries and uptime slices.
17. **[S17] SerpApi, U.S. Legal Shield.**
    https://serpapi.com/us-legal-shield — vendor-stated scope, exclusions,
    jurisdiction and coverage limit.
18. **[S18] SerpApi, Ludicrous Speed and Pricing.**
    https://serpapi.com/ludicrous-speed and https://serpapi.com/pricing —
    parallel attempts/validators, speed multipliers, plans and billing rules.
19. **[S19] Google, Terms of Service, effective 2026-07-30 (U.S.).**
    https://policies.google.com/terms — automated access, protective measures,
    rights, scraping and suspension boundary.
20. **[S20] Microsoft, Services Agreement, effective 2025-09-30.**
    https://www.microsoft.com/en-us/servicesagreement — access restrictions,
    impermissible scraping, rights and Bing/service-specific terms boundary.
21. **[S21] DuckDuckGo, Terms of Service, updated 2025-01-07.**
    https://duckduckgo.com/terms — authorization, acceptable-use and suspension
    boundary; does not itself approve third-party aggregation.
22. **[S22] SerpApi, Plans and Pricing.** https://serpapi.com/pricing — complete
    point-in-time price/volume/throughput table, counted-search rules, plan
    features, early renewal and refund policy.

### Negative results retained

- No public evidence found that the aggregation API fuses multiple upstream
  engines into one rank, or that its ranks are comparable across engines.
- No public versioned schema, compatibility guarantee, or deprecation window
  was identified.
- No source-document capture ID, snippet-to-document offsets/hash, upstream
  crawl timestamp, or index snapshot was identified in documented responses.
- No complete public subprocessor/data-region/cache-tenancy/backup-deletion map
  was identified in the reviewed pages.
- No independent, controlled evidence was found for comparative relevance,
  geolocation accuracy, freshness, or the vendor's “what users truly see” claim.
- No Legal Shield language was found that grants upstream permission or
  downstream copyright/privacy/data-use rights.
- No sufficiently detailed public Search Index corpus, crawler, ranking,
  freshness, provenance, or deletion specification was found.
