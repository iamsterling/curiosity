# Scale SERP hosted SERP API: clean-room research dossier

**Research date / source access date:** 2026-08-17  
**Decision frame:** whether Scale SERP is a useful transitional discovery
provider or architectural reference for Curiosity, and which ideas can be
learned without importing its provider dependence, proprietary behavior, legal
risk, or authority model.  
**Status:** research only. No account was created, no API was called, no paid
test or credential was used, and no implementation or bypass work was done.

## Executive verdict

**REJECTED as Curiosity's search foundation (high confidence).** Scale SERP is
a hosted, Google-dependent SERP extraction and normalization service, not an
independent crawl, corpus, or ranking system. Its breadth and ordering inherit
Google; its availability also inherits Google layout/access changes and hosted
infrastructure. Official incident records directly show disruptions caused by
changes in Google Search, a third-party search service, Cloudflare, AWS, and
Netlify [S10]. ScraperAPI acquired Traject Data and is integrating Traject's
products onto ScraperAPI infrastructure, adding a current platform-transition
dependency [S11].

**DEFERRED as a tightly bounded transitional adapter (medium confidence).** It
could be evaluated later, behind Curiosity's provider-neutral contract, when
Google-specific locality/device/SERP-feature fidelity is an explicit need. That
evaluation is blocked on legal/procurement, privacy/DPA, retention, security,
SLO, cost, and permitted-use review. It must not become the evidence system of
record or be presented as an owned index. No production recommendation can be
made from vendor documentation alone.

**ADAPTED as design evidence (high confidence).** Useful ideas are: requested
versus effective locale parameters; explicit device profiles; separate
real-time and batch lanes; request/processing timestamps; per-page billing;
bounded automatic pagination; result-page/source rank; field projection;
machine-readable incident refusal; webhook retries; and explicit result expiry.
Curiosity should strengthen these ideas with immutable capture provenance,
schema/parser versions, redacted credentials, bounded responses, partial-failure
objects, and independent evidence fetching.

## 1. Bounded questions and method

This dossier answers nine bounded questions:

1. What upstream systems determine Scale SERP coverage, rank, freshness, and
   availability?
2. What geography, language, and device controls are promised, and what do they
   actually establish?
3. What response shape and provenance are exposed, and what evidence lineage is
   absent?
4. Is data live or cached; what is retained and for how long?
5. How do pagination, batch limits, credit accounting, and failures behave?
6. What legal, contractual, privacy, and security constraints are visible?
7. What can be learned about anti-blocking operations without attempting to
   reproduce or bypass controls?
8. What are the public economics and architecture clues?
9. Which lessons should Curiosity adopt, adapt, reject, or defer?

**Depth budget:** official product/docs/status/legal materials, the current
Google Terms and robots file, and one official acquisition announcement. No
live API benchmark, account-only material, source code, endpoint probing,
reverse engineering of proprietary parsing, jurisdiction-specific legal
opinion, or comparison claim.

**Labels:**

- **FACT** — directly supported by a cited primary source.
- **INFERENCE** — reasoned interpretation, not directly measured here.
- **UNKNOWN** — material point not established by accessible primary sources.
- **RECOMMENDATION** — a Curiosity design or governance choice.
- Confidence is **high**, **medium**, or **low**.

Vendor documentation establishes documented behavior, not accuracy,
completeness, comparative superiority, or contractual guarantee. Marketing
claims are identified as such. Documentation contradictions and negative
results are retained rather than silently resolved.

## 2. Product and dependency model

### 2.1 What the service is

**FACT (high):** Scale SERP exposes a synchronous `/search` endpoint that takes
an API key and query and returns JSON by default; HTML and CSV are also
documented. The product covers Google Web plus Google News, Images, Videos,
Scholar, Autocomplete, Places/Maps, Shopping, Products, and related detail
requests [S1, S2]. It states that every real-time search is fetched from Google
without caching [S4].

**FACT (high):** the product page says Scale SERP is not affiliated with or
endorsed by Google and describes its output as web-scraped public-source data
[S3]. Its data-extraction page says every request is rendered in a full
in-memory browser with JavaScript execution, then parsed into structured JSON,
CSV, or HTML; some fields require subsequent panel/click-through requests
[S12].

**INFERENCE (high):** the system is best modeled as:

```text
client request
  -> Scale SERP API / validation / credit control
  -> locale + device request construction
  -> proxy/routing/access layer
  -> full browser render of Google SERP
  -> optional additional Google panel/click-through fetches
  -> proprietary visual/page parser
  -> normalized feature-specific response
  -> synchronous response OR batch result artifact/webhook/destination
```

There is no evidence of a Scale SERP-owned public-web corpus, independent
ranking model, crawl frontier, or document index. Google determines candidate
coverage and rank; Scale SERP determines retrieval conditions, parsing, and
normalization.

### 2.2 Upstream and corporate dependence

**FACT (high):** Scale SERP's own status history reports:

- a January 2025 Google Web disruption caused by adjustments in how Google
  processed queries, requiring a corrective adaptation;
- a September–October 2025 incident attributed to Google-side changes and a
  “3rd party search service provider,” during which all Google data-service
  connections were temporarily disabled;
- Google SERP disruptions in June and July 2026;
- dashboard/site incidents tied to Cloudflare, AWS, and Netlify; and
- historical parser incidents tied to changed page layouts [S10].

**FACT (high):** ScraperAPI announced on 2026-04-30 that it had acquired Traject
Data “a few months” earlier. It said Traject's structured APIs would be moved
onto ScraperAPI infrastructure over coming months, while current service,
pricing, and keys would not change immediately [S11]. The current Traject terms
and privacy policy identify ScraperAPI, LLC as service operator [S14, S15].

**INFERENCE (high):** Scale SERP has at least four independent change domains:
Google output/access, proprietary parser behavior, hosted access/infrastructure,
and acquisition-driven product migration. A single nominal API endpoint does
not remove upstream concentration risk.

**UNKNOWN:** whether Scale SERP currently uses only ScraperAPI proxy capacity,
multiple search-access suppliers, or a mixed legacy/new platform; the status
history supports dependencies but not the current complete topology.

## 3. Geography, language, and device emulation

### 3.1 Geography and language controls

**FACT (high):** `location` accepts free text, a built-in location returned by
the free Locations API, or `lat:<latitude>,lon:<longitude>`. For a built-in
location, `location_auto=true` (the default) updates `google_domain`, `gl`, and
`hl` and Scale SERP generates Google's `uule`; callers may disable this or pass
their own `uule`. Latitude/longitude input does **not** automatically update
`gl` or `hl`. Additional controls include Google domain, UI language (`hl`),
country (`gl`), result-language restriction (`lr`), result-country restriction
(`cr`), safe search, and time filtering [S2].

**FACT (high):** the Locations API returns IDs, names, location type,
fully-qualified names, parent IDs, country codes, and a `reach` estimate. It is
free but limited to 120 requests/minute [S5]. The product markets location
selection down to postal-code level [S3].

**INFERENCE (medium):** a built-in location is a bundle of Google request
signals, not proof that a human physically located there would see the same
SERP. The docs establish UULE/domain/country/language shaping and claim global
routing, but do not document exit-IP selection, IP class, precise egress city,
cookie state, consent state, account history, experiment cohort, or repeated-run
variance.

**RECOMMENDATION (high):** Curiosity should preserve both:

- `requested_context`: caller's location, coordinates, language, country,
  domain, safe-search, and device intent; and
- `effective_context`: provider-resolved location ID/name, actual domain,
  country/language parameters, device profile, and any warnings.

Never collapse “requested Paris” into “observed by a typical user in Paris.”

### 3.2 Device controls

**FACT (high):** `device` supports desktop (default), tablet, and mobile;
`mobile_type` supports iPhone or Android and `tablet_type` supports iPad or
Android. Documentation warns that not every search type is parsed on every
device [S1]. The status page separately tracks desktop and mobile/tablet parser
components [S10].

**INFERENCE (medium):** these are browser/rendering profiles and parser lanes,
not demonstrated hardware devices. Separate status components and historical
mobile-only field failures show that device choice affects both upstream layout
and parser reliability.

**RECOMMENDATION (high):** device must be typed provenance, not a transparent
query option. A normalized hit should retain provider device, profile family,
and feature-support warning; results from different device profiles should not
be assumed rank-comparable.

## 4. Schema, normalization, and provenance

### 4.1 Documented response model

**FACT (high):** official example output includes:

- `request_info`: success and credits used/remaining/reset time;
- `search_metadata`: created/processed timestamps, total processing time,
  Google `engine_url`, API HTML/JSON URLs, and locale-auto messages;
- `search_parameters`: the interpreted query parameters;
- `search_information`: displayed query, Google's displayed total/time, and
  result tabs;
- `pagination`: current/next/other-page links and API pagination links; and
- result-type arrays such as `organic_results`, with position, title, link,
  domain, displayed link, snippet, matched snippet terms, sitelinks, rich
  snippets, and “about this result” data where present [S6].

The schema is feature-rich and mirrors heterogeneous Google modules rather than
forcing everything into ten blue links. `flatten_results=true` can merge
selected modules into `organic_results` while adding a type discriminator;
`fields`, `include_fields`, and `exclude_fields` reduce response shape; raw HTML
can be returned alone or included with parsed JSON [S1, S2].

**FACT (high):** documentation/product updates show schema evolution: new fields
and structures are added as Google changes, and some device coverage arrives
later than desktop coverage [S13]. `skip_on_incident` can refuse results during
degraded or major parser incidents, yielding 503 instead of potentially unstable
data [S1, S8].

### 4.2 Provenance strengths and limits

**INFERENCE (high):** useful provenance includes request parameters, Google
engine URL, request/processing time, result-page position, source module, and
optional raw HTML. These can explain *which SERP view was requested* and *where
an item appeared*.

**UNKNOWN / absent from accessible docs (high confidence in the negative
result):** no documented immutable response/capture ID, raw-byte/content hash,
parser/schema version, browser build, exit region/IP class, retry/attempt trace,
Google experiment state, canonical document ID, publisher capture timestamp,
snippet passage offset/hash, rank-feature explanation, or cryptographic binding
between parsed fields and returned HTML. The examples' timestamps describe API
processing, not when a linked publisher document was crawled or published.

**INFERENCE (high):** Scale SERP returns a normalized observation of a Google
page, not primary-source evidence. Organic snippets, AI Overviews, answer boxes,
knowledge panels, and “People Also Ask” text are Google-mediated representations.
They can discover sources or characterize a SERP, but should not be cited as if
they were immutable publisher passages.

**RECOMMENDATION (high):** a Curiosity adapter should map Scale SERP only into a
provider-neutral *discovery observation*:

- preserve provider, endpoint/search type, request time, effective context,
  module type, page, position, and original provider payload reference;
- fetch allowed destination pages through a separate bounded evidence lane;
- assign Curiosity capture/passage IDs and hashes there;
- mark snippets and AI-generated SERP features as
  `untrusted_provider_representation`;
- retain unknown/omitted fields rather than silently converting them to null;
- version the adapter independently from Scale SERP's evolving schema.

### 4.3 Contract-quality warning

**FACT (high):** the current Scale SERP Google Search result example is labeled
fictitious and contains `api.serpwow.com/live/search` URLs and an `engine=google`
field, even though the surrounding page is Scale SERP documentation [S6]. The
quick-start calls `/search` a GET-only synchronous endpoint, while an April 2025
product update says field selection works with GET and POST [S1, S13].

**INFERENCE (medium):** shared/stale documentation and cross-product examples
suggest common internal concepts or documentation reuse, but they do not prove
runtime compatibility. They do reduce confidence that prose/examples form a
strict, versioned wire contract.

## 5. Freshness, caching, and retention

**FACT (high):** official fundamentals say real-time searches use no caching and
fetch fresh data directly from Google on every request [S4]. `created_at`,
`processed_at`, and total processing time appear in response metadata [S6].

**FACT (high):** batch searches are executed when a batch starts; schedules can
be hourly, daily, weekly, monthly, or on demand. Batch result sets are retained
for 14 days; inactive batches are deleted after two months. Result sets may be
downloaded as JSON, JSON Lines, or CSV, delivered by webhook metadata, or sent
to S3-compatible storage [S4, S7].

**INFERENCE (high):** “no caching” means no documented reuse of a prior SERP
response; it does not prove publisher-page freshness, Google index freshness,
or absence of retries/intermediate buffers. A live Google SERP can still contain
stale indexed content.

**UNKNOWN:** retention for synchronous API payloads, request parameters, raw
HTML, provider access logs, error logs, backups, or internal replay/debug data.
The public privacy policy says search terms and usage/log data are collected and
that cached/archived personal-information copies may be retained “for a certain
period,” but gives no product-specific duration [S15].

**RECOMMENDATION (high):** Curiosity should not infer freshness from “real-time.”
Record `provider_requested_at`, `provider_processed_at`, and separately
`destination_fetched_at`, claimed publication time, and capture hash. Contract
for explicit provider query-log and payload retention before any sensitive use.

## 6. Pagination, limits, batches, and errors

### 6.1 Pagination and limits

**FACT (high):** `page` is one-based. Responses expose a pagination object;
infinite-scroll request types instead use `next_page_token` and cannot start at
an arbitrary page. `max_page` automatically fetches and concatenates pages,
adding `page`, per-page `position`, and `position_overall` to main-array items.
Each successfully retrieved page costs one credit [S8].

**FACT (high):** the pagination page states a real-time `max_page` ceiling of 5
and a batch ceiling of 100 [S8]. The separate Batch Limits page instead states a
batch `max_page` ceiling of 20 [S7]. This contradiction was not resolved.

**FACT (high):** a batch can contain up to 15,000 searches, or 100 if
`include_html=true`; up to 1,000 searches can be added per API request and
10,000 batches can exist per account. The Batch Limits page says at most five
batches of up to 250 searches or one larger batch run concurrently by default,
with all searches inside a batch run concurrently; it gives 2–3 minutes as a
guide for 15,000 searches [S7]. These are documented limits/guides, not measured
SLOs.

**FACT (high):** the Locations API is limited to 120 calls/minute. Public docs
say a 429 is returned when a plan/endpoint rate limit is exceeded, but the
current plan-specific synchronous search rate/concurrency limits were not found
in accessible public pages [S5, S9].

### 6.2 Error model

**FACT (high):** documented HTTP statuses are 200 success, 400 invalid request,
401 invalid key, 402 credits/payment problem, 404 bad path/verb, 429 rate limit,
500 internal failure, and 503 active parser incident when incident refusal is
used. Non-200 requests are not charged. 500 responses should be retried after a
delay; 503 may include `message` and `retry_after` [S9].

**FACT (high):** batch webhooks have a five-second timeout and are retried up to
five times with exponential backoff; after exhaustion, the vendor sends at most
one failure email per 24 hours. Webhook bodies include batch/result-set IDs,
start/end times, completed/failed counts, and result download links [S7].

**INFERENCE (high):** a 200 only proves the provider accepted and parsed a
response; it does not prove completeness. Parser degradation can be field- or
device-specific, and `skip_on_incident` relies on the provider detecting and
declaring the incident.

**RECOMMENDATION (high):** Curiosity should:

- cap pages/results/bytes/time and never expose provider `max_page` directly;
- use cursor objects carrying provider/page/context/schema state, not raw URLs;
- retry only bounded 429/500/503 classes with total deadline and jitter;
- surface `provider_degraded`, `partial`, omitted module, and parser-incident
  warnings even on HTTP 200 when detectable;
- deduplicate across pages by normalized URL plus content/entity keys while
  preserving every observed rank;
- reconcile invoices from returned per-request/page credit metadata.

## 7. Anti-blocking operations and architecture clues

This section describes public operational evidence only. It is not a recipe for
bypassing Google controls.

**FACT (high):** Scale SERP says each request runs in a full in-memory browser,
executes JavaScript, loads dynamic content, parses visual/page structure, and
may perform multiple subsequent panel/click-through requests [S12]. Its product
page claims a global routing network, up to 15,000 parallel searches, and 99.95%
uptime [S3].

**FACT (high):** ScraperAPI describes its own infrastructure as handling
proxies, headers, scale, headless browsers, and CAPTCHAs, and says Traject APIs
will run on that infrastructure [S11]. Status history records adaptations after
Google query-processing/layout changes, a new headless-Chrome-based path for
Google Ads, core data-center routing, Cloudflare DDoS mitigation, and distinct
parser health components [S10].

**INFERENCE (medium):** likely architectural layers include geographically
distributed request routing/proxy capacity, browser workers, parser families by
Google feature/device, synchronous orchestration, a durable batch queue, result
object storage, account/credit metering, and incident feature gates. Browser
rendering and extra interactions explain why HTML batches are much smaller and
why multi-page/AI/ads features consume extra credits.

**FACT (high):** the public status page showed only 98.39% API uptime over its
displayed prior 90-day window when accessed, while the product page advertised
99.95% uptime [S3, S10]. These may use different windows/definitions; no public
SLA language tying the marketing figure to credits or remedies was found.

**RECOMMENDATION (high):** learn the operational separation—worker pools,
queues, parser health by feature, fail-closed incident modes, and measured cost
per retrieval step—but do not reproduce proprietary anti-blocking behavior.
Owned Curiosity crawling should identify itself, follow policy/robots, use
politeness and backoff, and avoid account simulation or protective-control
bypass.

## 8. Pricing and economics

### 8.1 Public plan economics

**FACT (high):** annual-billing prices displayed on 2026-08-17 were [S16]:

| Included searches/month | Displayed monthly equivalent | Annual commitment | Included unit cost | Overage/search |
| ---: | ---: | ---: | ---: | ---: |
| 1,000 | $23 | $276 | $0.023000 | $0.038000 |
| 10,000 | $66 | $792 | $0.006600 | $0.011800 |
| 50,000 | $199 | $2,388 | $0.003980 | $0.007960 |
| 250,000 | $599 | $7,188 | $0.002396 | $0.004792 |
| 1,000,000 | $1,699 | $20,388 | $0.001699 | $0.003398 |
| 5,000,000 | $4,999 | $59,988 | $0.001000 | $0.001999 |

Annual commitment is the displayed monthly equivalent multiplied by twelve;
tax, payment terms, unused-credit treatment, and enterprise negotiation are not
included. The product page also offered 125 free searches/month without a card
[S3].

**FACT (high):** one successful page normally costs one credit. AI Overview
content adds one credit when returned; AI Overview answers inside each related
question add one credit each; `ads_optimized=true` adds three credits; and
`order_online=true` costs two credits total. Automatic pagination charges actual
pages returned [S2, S8]. Batch management API calls are free, but searches run
inside batches are charged like Search API requests [S7].

**DOCUMENTATION CONTRADICTION:** the “Real Time vs. Batches” page says batches
are processed “without impacting your monthly search quota,” but the detailed
Batch Overview says starting 200 searches costs 200 credits [S4, S7]. Budgeting
should use the explicit per-search rule unless contractually clarified.

### 8.2 Cost implications

**INFERENCE (high):** nominal “searches” are not a stable unit of useful work.
Cost is approximately:

```text
base retrieved pages
+ AI Overview instances returned
+ AI-PAA answers returned
+ ads optimization surcharge
+ other feature-specific internal-request surcharge
+ overage premium
```

A five-page real-time request consumes up to five base credits before feature
surcharges. At low volume, unused annual capacity dominates; at high volume,
overage is roughly twice included unit price on most listed tiers. Query mix,
not request count alone, determines cost.

**RECOMMENDATION (high):** if ever evaluated, predeclare per-request and monthly
credit ceilings; disable AI/ads/multi-step features by default; meter successful
pages and feature surcharges from response metadata; and benchmark *unique
relevant primary-source discoveries per dollar*, not raw calls. Do not place a
high-volume annual commitment before legal and quality gates.

## 9. Legal, terms, privacy, and security

This is risk identification, not legal advice.

### 9.1 Google/source rights

**FACT (high):** Google’s Terms effective 2026-07-30 prohibit automated access
in violation of machine-readable instructions and prohibit scraping content
that does not belong to the user as an example of conduct that may cause access
suspension. They also say third-party content in Google services may not be used
without the owner’s permission or another legal basis [S17]. Google's current
`robots.txt` disallows `/search` for the general user-agent group [S18].

**FACT (high):** Scale SERP says it is not Google-affiliated and labels its
sources “public domain” while also acknowledging third-party trademarks and
copyright [S3]. Public accessibility does not itself place a webpage, snippet,
image, review, or compilation in the public domain.

**INFERENCE (high):** buying a normalized response does not transfer publisher
copyright, database, privacy, trademark, or Google contractual rights to
Curiosity. Robots and Google terms are material risk signals, but their precise
application, enforceability, exceptions, and jurisdictional effect require
counsel.

**RECOMMENDATION (high):** require written legal review of Google terms,
machine-readable restrictions, permitted API use, result storage/display,
snippets/images/reviews, AI Overview content, database rights, and downstream
model use before any adoption. Do not seed an owned index from Scale SERP
results or retain raw SERPs merely because the vendor calls them public-domain
data.

### 9.2 Scale SERP / ScraperAPI terms

**FACT (high):** current general terms grant a limited personal,
non-transferable, non-sublicensable license; prohibit reverse engineering,
copying, resale, unapproved applications interacting with the service, and
various automated collection from the service; disclaim accuracy,
completeness, uptime, and support; make purchases generally nonrefundable; allow
service/price changes and termination; impose indemnity; cap liability in many
cases at the greater of fees paid in the preceding 30 days or $100; and require
individual arbitration under Delaware law, subject to stated exceptions [S14].

**INFERENCE (high):** several boilerplate provisions sit awkwardly beside an
API marketed for business application integration. Public marketing/docs are
not a substitute for an enterprise agreement explicitly permitting Curiosity's
use, internal redistribution, automation, retention, and security controls.

**RECOMMENDATION (high):** procurement must obtain controlling written terms,
including commercial API rights, data/output rights, subprocessor list, DPA,
security schedule, confidentiality, change/deprecation notice, SLA/remedies,
breach notification, deletion/return, audit evidence, and termination export.

### 9.3 Privacy and query confidentiality

**FACT (high):** Traject's privacy policy says it collects search terms, usage,
IP, browser, device, account, commercial, and payment information; uses data to
provide/improve services, research and analyze usage, personalize and market,
prevent abuse, and comply with law; shares with vendors, affiliates, legal
recipients, and acquirers; and processes/stores in the United States with
possible transfers to other jurisdictions. It states it does not sell personal
information and lists EEA/UK/Swiss and California rights [S15].

**FACT (high):** API authentication is documented as the `api_key` query
parameter on GET requests. Example response metadata/API pagination URLs also
contain API URL forms [S1, S6]. Query-string credentials are exposed to more
logging, tracing, proxy, browser-history, and accidental-sharing surfaces than
authorization headers.

**UNKNOWN:** product-specific query/payload retention, encryption/key-management
details, tenant isolation, employee access, subprocessors, deletion latency,
backup expiry, data-residency options, whether queries are used for model/parser
training, and independent SOC 2/ISO 27001 or penetration-test evidence. No
current public Scale-SERP-specific DPA or subprocessor schedule was found.

**RECOMMENDATION (high):** never send secrets, personal/sensitive investigations,
embargoed topics, or internal identifiers without approved data classification
and contract. If used, place a fixed-origin server-side gateway in front of the
provider; keep the API key out of client tools and all logs; redact query strings
from telemetry; minimize query retention; and prohibit raw provider URLs
containing credentials from crossing the adapter boundary.

### 9.4 Security posture

**FACT (medium):** Traject publishes a vulnerability-reporting policy and asks
researchers to use test accounts, but it offers no bounty and prohibits harmful,
cross-account, destructive, social-engineering, and non-test-account activity
[S19]. This is a disclosure process, not independent assurance.

**RECOMMENDATION (high):** treat every title, snippet, link, AI Overview, HTML
document, webhook field, and CSV cell as untrusted. Enforce media/size/time/URL
bounds, JSON depth and array caps, redirect and SSRF controls, CSV formula
neutralization, webhook authentication/replay protection (not documented in the
public webhook page), malware/content sanitization, and prompt-injection
separation. Scale SERP results must never carry authority to invoke further
tools.

## 10. Clean-room lessons for Curiosity

No Scale SERP source code, private interface, credentialed behavior, or
proprietary parsing method was inspected. Public docs describe observable
functionality; they do not authorize copying documentation, branding, response
text, proprietary parser logic, or restricted content.

| Lesson | Verdict | Curiosity treatment |
| --- | --- | --- |
| Google SERP as core corpus/ranker | **REJECTED** | It preserves upstream concentration and opaque ranking rather than ownership. |
| Hosted Scale SERP adapter | **DEFERRED** | Only for a later, legally approved Google-specific benchmark or transition lane. |
| Requested/effective geo context | **ADOPTED** | Preserve both; include resolution warnings and location identity. |
| Device-specific observations | **ADAPTED** | Treat device as provenance and quality slice, not an accuracy guarantee. |
| Rich SERP module taxonomy | **ADAPTED** | Use neutral typed discovery features; do not clone vendor names/schema wholesale. |
| Full browser for every search | **REJECTED** for owned default | Expensive and broad attack surface; static fetch first, isolated rendering only when justified. |
| Real-time and durable batch lanes | **ADOPTED** conceptually | Separate deadlines, quotas, storage, delivery, and observability. |
| Automatic multi-page concatenation | **ADAPTED** | Preserve page/rank lineage, hard caps, dedupe, partial failures, and cost budget. |
| Raw HTML option | **DEFERRED** | Useful audit evidence only under rights, retention, byte-limit, and sandbox controls. |
| `skip_on_incident` | **ADOPTED/strengthened** | Fail closed on known degradation; add independent validators and partial-warning schema. |
| Per-step credit metering | **ADOPTED** | Expose bounded cost classes and actual usage without vendor billing fields in core ABI. |
| Query-string API key | **REJECTED** | Secret belongs only in a redacting server-side adapter; prefer header auth in neutral contracts. |
| Vendor snippets as citations | **REJECTED** | Use for discovery; cite separately captured primary passages. |
| Provider result retention as evidence store | **REJECTED** | Curiosity owns immutable authorized captures and deletion policy. |
| Proprietary anti-blocking imitation | **REJECTED** | Learn operational separation only; do not copy or bypass controls. |

### Proposed provider-neutral observation boundary

If caller authority later permits an adapter evaluation, the neutral response
should contain only bounded fields such as:

- request ID, provider ID, schema/adapter version, requested/effective context;
- provider request and processing times, search type, page and source-module;
- hit URL/title/snippet, per-page and overall rank, feature type;
- provider freshness claim (`live_uncached`) clearly marked as a claim;
- warnings for parser incident, omitted module, unsupported device, truncation,
  pagination exhaustion, partial failure, and cost;
- trust marker `untrusted_external_discovery`; and
- no API key, provider pagination URL, raw active HTML, or implied publisher
  provenance.

Curiosity's evidence fetcher—not the Scale SERP adapter—should create document,
capture, passage, hash, canonical, observed/published-time, and citation fields.

## 11. Unknowns and due-diligence gates

The following remain blockers, not assumptions:

1. Controlling commercial contract and explicit right to use the API in
   Curiosity, retain results, and expose bounded derived outputs internally.
2. Google's and publishers' rights/terms analysis for each intended result
   class and jurisdiction.
3. Product-specific DPA, subprocessors, retention/deletion, residency,
   confidentiality, and model-training posture.
4. Independent security evidence, incident/breach terms, webhook authenticity,
   and tenant isolation.
5. Current post-acquisition architecture, migration/deprecation roadmap, and
   whether Scale SERP remains a distinct long-term product.
6. Contractual SLA and definitions versus marketing uptime and observed status
   windows.
7. Current real-time concurrency/rate limits and reconciliation of batch
   `max_page` 20 versus 100.
8. Schema/versioning/deprecation guarantees and treatment of unknown/new fields.
9. Accuracy and variance by query class, location, language, device, feature,
   repeated run, and time.
10. Precise billing behavior for mixed pagination, retries, partial parses,
    AI-PAA multiplicity, and incident responses.

Any later trial must use independently authored, non-sensitive queries; free or
separately approved spend; no production credentials; frozen expected-output
classes rather than copied payloads; and predeclared quality, latency, cost,
privacy, and stop gates.

## 12. Bounded curiosity pass

Score: 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive). Follow-up was
limited to the declared frame and caller authority.

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Inspect first-party incident history for upstream clues | 5 | 5 | 5 | 1 | **Pursued:** exposed Google/layout, third-party search, Cloudflare, AWS/Netlify, browser, and parser dependencies [S10]. |
| Reconcile “real-time” with cache/retention claims | 5 | 5 | 3 | 1 | **Pursued:** no real-time response cache is claimed; batch results persist 14 days; synchronous/log retention remains unknown [S4, S7, S15]. |
| Check current Google machine-readable and contractual constraints | 5 | 5 | 4 | 1 | **Pursued:** `/search` is disallowed for general crawlers and current terms address automated access/scraping [S17, S18]. |
| Inspect acquisition ownership/platform transition | 5 | 4 | 4 | 1 | **Pursued:** ScraperAPI acquisition and planned infrastructure integration are first-party confirmed [S11]. |
| Resolve batch 20-versus-100 page limit with paid request | 3 | 3 | 2 | 4 | `CURIOSITY_NO_GO`: documentation contradiction is retained; paid/live testing prohibited and would not create a contractual guarantee. |
| Determine proxy vendors, IP pools, fingerprinting, or CAPTCHA methods | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: proprietary anti-blocking details are unnecessary and risk bypass-oriented reverse engineering. |
| Benchmark locality/device accuracy | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: requires credentials, spend, controlled physical baselines, repeated runs, and legal approval. |
| Give jurisdiction-specific legality opinion | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: outside authority; escalate to counsel. |
| Probe demo/error endpoints or webhook security | 3 | 4 | 4 | 4 | `CURIOSITY_NO_GO`: no probing or account access authorized; retain as procurement/security due diligence. |
| Search proprietary source or leaked internals | 1 | 1 | 4 | 5 | `CURIOSITY_NO_GO`: violates clean-room purpose and is unnecessary. |

**Coverage stop:** every requested category has primary-source evidence,
implications, confidence, and unknowns.  
**Saturation stop:** additional product pages repeated the same browser,
location, batch, and pricing claims without changing the decision.  
**Exhaustion stop:** contract-only security, retention, and SLA facts are not
publicly established; live testing and legal advice are outside authority.

## 13. Primary sources

All sources accessed 2026-08-17. Page titles and URLs are retained so claims can
be rechecked after the current acquisition/documentation migration.

1. **[S1] Scale SERP, Common Parameters; Send Requests; Result Formats.**
   https://docs.trajectdata.com/scaleserp/search-api/searches/common  
   https://docs.trajectdata.com/scaleserp/search-api/getting-started/send-requests  
   https://docs.trajectdata.com/scaleserp/search-api/getting-started/result-formats
2. **[S2] Scale SERP, Google Search Parameters.**
   https://docs.trajectdata.com/scaleserp/search-api/searches/google/search
3. **[S3] Traject Data, Scale SERP product page.**
   https://trajectdata.com/serp/scale-serp-api/
4. **[S4] Scale SERP, Real Time vs. Batches.**
   https://docs.trajectdata.com/scaleserp/search-api/fundamentals/realtime-batches
5. **[S5] Scale SERP, Locations API Overview.**
   https://docs.trajectdata.com/scaleserp/locations-api/overview
6. **[S6] Scale SERP, Google Search Results.**
   https://docs.trajectdata.com/scaleserp/search-api/results/google/search
7. **[S7] Scale SERP, Batches Overview, Limits, and Webhook; Traject batch page.**
   https://docs.trajectdata.com/scaleserp/batches-api/overview  
   https://docs.trajectdata.com/scaleserp/batches-api/limits  
   https://docs.trajectdata.com/scaleserp/batches-api/batches/webhook  
   https://trajectdata.com/serp/scale-serp-api/batches/
8. **[S8] Scale SERP, Pagination.**
   https://docs.trajectdata.com/scaleserp/search-api/fundamentals/pagination
9. **[S9] Scale SERP, Error Handling / Response Codes.**
   https://docs.trajectdata.com/scaleserp/search-api/fundamentals/error-handling  
   https://docs.trajectdata.com/scaleserp/response-codes
10. **[S10] Scale SERP Status and incident-history feed.**
    https://scaleserp.statuspage.io/  
    https://scaleserp.statuspage.io/history.atom
11. **[S11] ScraperAPI, “ScraperAPI + Traject Data: From data extraction to
    insights,” 2026-04-30.**
    https://www.scraperapi.com/blog/scraperapi-traject-data-acquisition/
12. **[S12] Traject Data, Scale SERP Data Extraction.**
    https://trajectdata.com/serp/scale-serp-api/data-extraction/
13. **[S13] Scale SERP, Product Updates.**
    https://docs.trajectdata.com/scaleserp/product-updates
14. **[S14] ScraperAPI / Traject Data, Terms of Use, effective 2025-11-18.**
    https://trajectdata.com/traject-data-terms-of-service/
15. **[S15] Traject Data Privacy Policy, updated 2025-12-01.**
    https://trajectdata.com/privacy-policy/
16. **[S16] Traject Data, Scale SERP API Pricing.**
    https://trajectdata.com/serp/scale-serp-api/pricing/
17. **[S17] Google Terms of Service, effective 2026-07-30.**
    https://policies.google.com/terms?hl=en-US
18. **[S18] Google robots.txt.** https://www.google.com/robots.txt
19. **[S19] Traject Data Vulnerability Reporting Policy.**
    https://trajectdata.com/vulnerability-reporting-policy/

### Negative source results retained

- No public evidence established that Scale SERP owns a crawl corpus or ranking
  index; all accessible product evidence points to live Google page extraction.
- No independent benchmark established relevance, completeness, locality
  accuracy, device fidelity, freshness, or comparative superiority.
- No public current plan-specific real-time search concurrency/rate table was
  found; only generic 429 behavior and the Locations API limit were documented.
- No public product-specific synchronous payload/query retention schedule, DPA,
  subprocessor list, residency matrix, or model-training statement was found.
- No public independent SOC 2/ISO 27001 certification or penetration-test report
  specific to Scale SERP was found in the reviewed sources.
- No documented immutable capture hash, parser/schema version, or passage-level
  provenance was found in the response model.
- No public SLA/remedy terms were found that make the 99.95% marketing figure a
  contractual guarantee; the accessed status window displayed 98.39% API uptime.
- Batch documentation conflicts on `max_page` (20 versus 100) and whether batch
  work affects monthly quota; neither inconsistency was silently resolved.
- No paid, demo, or credentialed test was performed, so undocumented runtime
  behavior remains unknown.
