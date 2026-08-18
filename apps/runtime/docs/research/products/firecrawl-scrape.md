# Firecrawl Scrape: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Scope:** Firecrawl `POST /v2/scrape` only. Crawl, Map, Search, Extract, Agent,
Parse, and Interact are out of scope except where an official source distinguishes
Scrape's behavior, shared account controls, or pricing.  
**Pinned OSS release:** `v2.11.162`, commit
`7666c1f9ae8720a6bba271e0f60b6a217f8a5210`.  
**Status:** research only. No API key, keyless/paid call, live target scrape,
deployment, exploit test, proprietary-service inspection, or code transfer was
performed. This is not legal advice or an independent security/quality audit.

## Executive verdict

**ADAPT the single-resource fetch/render/transform boundary, but do not adopt
Firecrawl Scrape as Curiosity's evidence foundation (high confidence).** Scrape
has a strong product vocabulary: one caller-selected URL, selectable static or
render-dependent capabilities, explicit waits/actions, composable output views,
age-based cache controls, a synchronous result envelope, and useful operational
metadata. The best transferable lesson is to keep acquisition separate from
derived Markdown, links, screenshots, summaries, answers, and JSON [S1][S2].

The current response is nevertheless a weak chain of custody. It does not
guarantee a raw-response hash, immutable capture reference, redirect chain,
resolved-address record, robots verdict, renderer/extractor/model version,
transformation manifest, or span anchors. Even `rawHtml` is engine-relative:
in a browser lane it can be the rendered page serialization, not origin wire
bytes. Cache provenance improves to `cacheState` and `cachedAt` on eligible
hits, but remains insufficient to reproduce a citation [S2][S13][S14].

**REJECT actions, arbitrary headers/cookies, persistent profiles, default TLS
verification bypass, and model-derived formats from Curiosity's default
retrieval authority (high confidence).** They increase browser, credential,
network, privacy, prompt-injection, and denial-of-wallet exposure. Static HTTP
should be first; browser rendering should be a separately authorized,
sandboxed, quota-bound escalation [S2][S12][S15].

**DEFER a hosted adapter (high confidence)** until Firecrawl supplies or an
authorized pilot verifies cache isolation, exact retention and subprocessors,
universal SSRF/redirect enforcement across Cloud engines, one-off Scrape robots
behavior, response-size bounds, billing edge cases, and provenance. **REJECT
copying the OSS server implementation:** the server is AGPL-3.0; only identified
SDK/UI subtrees are MIT. Contract lessons may be independently re-authored, but
server types, transforms, prompts, tests, and orchestration must not be imported
into permissive Curiosity code [S17][S18].

## 1. Decision frame, bounded questions, and method

### 1.1 Decision and sub-questions

The decision is which observable Scrape concepts Curiosity should adopt, adapt,
reject, or defer without depending on proprietary behavior or transferring
AGPL implementation.

1. What URL, acquisition, render, format, action, wait, cache, and response
   contract is publicly exposed?
2. Which outputs are captures, deterministic transformations, selections, or
   generated claims?
3. What do `maxAge`, `minAge`, `storeInCache`, Lockdown, and ZDR establish about
   freshness, storage, and provenance?
4. What is evidenced for SSRF, redirects, hostile pages, robots, TLS, browser
   isolation, and credential handling?
5. What limits, failures, queues, costs, privacy terms, and license boundaries
   constrain use?
6. What architecture is reasonably inferable from the pinned source, and what
   remains Cloud-proprietary or unknown?
7. Which clean-room requirements should shape Curiosity's own retrieval plane?

### 1.2 Evidence and access boundary

Official documentation, OpenAPI, billing/rate-limit/legal pages, and the public
repository at the pinned commit were inspected. The checkout was read only in a
pre-approved temporary directory. Vendor docs establish advertised/current
contract, not comparative quality or effective Cloud security. Pinned source
establishes that release's visible OSS behavior, not exact Cloud parity.

- **FACT** — directly supported by a cited primary source or pinned source file.
- **INFERENCE** — bounded interpretation, not measured runtime behavior.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

**Coverage bound:** fetch/render/scrape contract; formats/actions/waits;
caching/freshness/provenance; hostile-page/SSRF/security; limits/errors/pricing;
privacy/legal/license; architecture inference; and Curiosity implications.
**Stop rule:** stop when every category has primary evidence or an explicit
unknown and further work requires calls, credentials, private material, or
repeats already-saturated evidence.

## 2. Observable Scrape contract

### 2.1 Operation and request shape

**FACT (high):** `POST https://api.firecrawl.dev/v2/scrape` accepts one absolute
HTTP(S) URL and returns a synchronous `{success,data}` envelope. Markdown is the
default format. Authentication is normally bearer-token based; current official
clients also advertise limited keyless Scrape, but no keyless request was made
[S1][S2][S8].

| Request concern | Public/current behavior | Qualification |
| --- | --- | --- |
| Target | One `url` | URL count is intrinsically bounded to one, but URL length, ports, credentials-in-URL, and redirect count have no useful public endpoint bound. |
| Content scope | `onlyMainContent=true`; `includeTags`; `excludeTags` | Main-content filtering is documented as deterministic HTML-level filtering. Empty main extraction falls back to full content in the pinned pipeline [S2][S14]. |
| Extra cleaning | `onlyCleanContent=false` | Beta LLM pass over generated Markdown; unsupported with ZDR and skipped with a warning when too long [S2][S14]. |
| Timing | `waitFor=0`; `timeout` documented 60 s default, 1–300 s | `waitFor` is additional to opaque smart wait. Pinned validation also requires `waitFor <= timeout/2` when timeout is explicit [S2][S12]. |
| Client context | `headers`, `mobile`, `location`, `blockAds=true` | Headers can carry cookies/user-agent; location selects proxy and emulates language/timezone. These change disclosure and cache behavior [S2][S7]. |
| Acquisition | `proxy=auto`; `skipTlsVerification=true` documented default | `auto` tries basic then enhanced on inadequacy. Default TLS bypass is unsafe for evidence-sensitive use [S2][S7]. |
| Files | PDF parser defaults on; fast/auto/OCR; optional `maxPages` 1–10,000 | Empty parser list returns base64 rather than parsing according to OpenAPI. PDF billing is per parsed page [S2][S6]. |
| Storage | `maxAge`, `minAge`, `storeInCache`, `lockdown`, Enterprise ZDR | These are preferences/modes, not a complete capture-retention contract [S1][S3][S4]. |
| Stateful browser | optional named `profile`, `saveChanges=true` | Same profile name shares cookies/localStorage/sessions; only one saving session is allowed. This is retained principal state, not ordinary stateless scraping [S2]. |

**Contract discrepancy (high):** OpenAPI documents a 300,000 ms maximum timeout,
while the pinned Zod request schema enforces only a 1,000 ms minimum. The engine
loop has a five-minute fallback only when no scrape timeout is present [S2][S12]
[S13]. A consumer must impose its own lower maximum and not depend on either
evolving limit.

**Contract discrepancy (high):** OpenAPI says `skipTlsVerification=true` by
default. Pinned code defaults it to true for ordinary requests but false when
custom headers or nonempty actions are present [S2][S12]. Curiosity should
always send `false`; omission is not an acceptable security policy.

### 2.2 Acquisition and rendering semantics

**FACT (high):** Scrape does not expose a simple `renderJavaScript` switch.
Requested capabilities—wait, screenshot, actions, mobile, location, files,
proxy class—and engine availability drive selection. The pinned registry has
index/cache, Fire-engine Chrome and TLS-client paths, Playwright, plain fetch,
PDF/document, Wikipedia, X/Twitter, and Exchange handlers with capability and
quality tables [S13].

**FACT (high):** the engine loop constructs an ordered fallback list, starts an
engine, and can waterfall another after an engine-specific “maximum reasonable
time”; active attempts are raced, and the first acceptable result wins. A
non-empty body or a non-good target status can count as successful processing.
On 401/403/429 with `proxy=auto`, the pinned path can add an enhanced/stealth
capability and retry [S13].

**FACT (high):** when Fire-engine is configured, the pinned general waterfall
removes plain fetch and TLS-client after the Chrome path for ordinary requests,
rather than returning likely bot-wall output. The default self-host stack lacks
Fire-engine, so hosted success behavior is not reproducible merely by running
the AGPL repository [S5][S13].

**INFERENCE (high):** Scrape is a capability-driven acquisition broker, not one
stable fetch algorithm. Two equivalent requests can differ because of cache
availability, engine availability, proxy escalation, location, site response,
and deployed engine policy. Reproducibility therefore requires the response to
name acquisition mode and versions; the public response does not.

**INFERENCE (high):** `rawHtml` means “unfiltered engine HTML,” not necessarily
the exact origin response body. In the pinned pipeline, `engineResult.html`
becomes `document.rawHtml`; Playwright uses `page.content()` for HTML responses.
Thus browser execution, DOM mutation, parser serialization, and encoding can
precede `rawHtml` [S2][S13][S15]. Curiosity must reserve “raw capture” for bytes
it can hash and replay.

### 2.3 Response and target-status semantics

**FACT (high):** useful fields include requested `metadata.sourceURL`, terminal
`metadata.url`, target `statusCode`, `contentType`, title/description/language and
page metadata, PDF `numPages`/`totalPages`, concurrency queue indicators, proxy
class in pinned source, and conditional cache fields. Requested representations
are returned as sibling fields [S2][S13].

**FACT (high):** a target 403 or 404 can still appear inside a successful API
response because Firecrawl successfully processed the target response. Billing
documentation explicitly says infrastructure-processed target errors can be
charged [S6]. Therefore API success, acquisition success, HTTP success, content
quality, and factual liveness are five different states.

**RECOMMENDATION (high):** Curiosity must normalize one Scrape response into:
`provider_transport`, `target_http`, `capture_quality`, `derivation`, and
`policy` outcomes. A top-level 200 or `success:true` must never imply acceptable
evidence.

## 3. Formats and transformation lineage

### 3.1 Format classes

| Class | Current examples | Evidence interpretation | Verdict |
| --- | --- | --- | --- |
| Acquisition-relative | `rawHtml`, screenshot, action scrape/PDF | Closest available page state, but not wire capture; signed artifacts expire | **ADAPT narrowly** |
| Deterministic transforms | cleaned `html`, `markdown`, `links`, `images`, attribute extraction, product claim | Parser/DOM-derived and potentially lossy; product is documented deterministic/fail-closed | **ADAPT with versions and anchors** |
| Model-derived | `summary`, custom `json`, `question`/legacy `query`, `highlights`, `onlyCleanContent`, some branding behavior | Generated or selected claims without model/prompt/version/span lineage | **REJECT as retrieval fact** |
| Specialized services | product, menu, audio, video, PII redaction | May require Cloud/external service; signed media URLs expire in one hour | **DEFER** |
| Stateful/differential | `changeTracking` | Compares provider-held versions; bypasses ordinary cache | **DEFER** until capture semantics are explicit |

**FACT (high):** current public formats include Markdown, summary, cleaned HTML,
raw HTML, screenshot, links, JSON, images, branding, product, audio, video,
question/query, and highlights. The pinned schema additionally exposes
attributes, change tracking, menu, and a `deterministicJson` path. Public docs
and pinned implementation are moving surfaces rather than one frozen contract
[S1][S2][S12].

**FACT (high):** cleaned HTML removes script/style/noscript/meta/head, resolves
relative URLs, chooses a responsive-image source, and applies content/tag
filters. Markdown is generated from that cleaned HTML unless an engine or
postprocessor supplied Markdown. Links and images are extracted from cleaned
HTML, not guaranteed raw DOM/network observations [S2][S14].

**FACT (high):** the pinned transformer order is roughly cleaned HTML → Markdown
→ optional LLM clean → PII redaction → links/images → metadata → specialized
product/menu → indexing → JSON/summary/query/attributes → base64 removal →
change tracking → media → output-field pruning [S14].

**INFERENCE (high):** output fields from one call do not all describe the same
representation stage. For example, PII redaction changes Markdown before JSON,
summary, or query derivations, while metadata is extracted later from raw HTML;
links/images come from cleaned HTML. A flat `data` object hides this lineage.

### 3.2 Generated and selected outputs

**FACT (high):** custom JSON accepts a JSON Schema and/or a prompt; question and
highlights accept up to 10,000 characters. The docs price JSON, question, and
highlights as model-backed premium work. `onlyCleanContent` is explicitly an LLM
pass. No response field identifies model, prompt template, extraction version,
validation retries, source offsets, or confidence [S1][S2][S6].

**FACT (high):** product extraction is documented as deterministic, merging
on-page sources by priority (JSON-LD, microdata, RDFa, embedded state, selected
platform/analytics forms, then OpenGraph/meta) and failing closed on ambiguity.
In self-hosting it requires a separate product-extraction service [S1][S5].

**INFERENCE (high):** “deterministic” does not mean authoritative. It can select
among stale/conflicting structured fields, and no returned field-level source
map proves which page element supported a value.

**RECOMMENDATION (high):** Curiosity should preserve immutable capture →
versioned document transform → anchored passage/field extraction → optional
generated synthesis as distinct objects. Summary/answer/JSON values remain
`derived_unverified` unless every material field points to a capture-bound span.

### 3.3 Screenshots and media

**FACT (high):** screenshots are URLs expiring after 24 hours. Audio/video
formats return signed Google Cloud Storage URLs expiring after one hour. ZDR is
incompatible with screenshot because persistent upload is required [S1][S2].

**INFERENCE (high):** an expiring provider URL is delivery, not evidence
retention. It also creates a second network fetch and storage trust boundary.
Curiosity should not auto-fetch it in a privileged context.

## 4. Actions and waits

### 4.1 Contract and bounds

**FACT (high):** action types are wait by milliseconds or CSS selector, click
(one/all), screenshot, write, key press, scroll, scrape current page HTML,
execute arbitrary page JavaScript, and generate PDF. Action results are grouped
by output type—not one cardinality-complete result per action—into screenshots,
scrapes, JavaScript returns, and PDFs [S1][S2][S12].

**FACT (high):** the pinned schema caps actions at 50. `waitFor` is capped at
60,000 ms; total `waitFor` plus explicit wait actions is capped at 60 seconds,
with selector waits counted as one second for this admission calculation.
Actual click/selector/navigation work still consumes the overall timeout
[S12].

**FACT (high):** Firecrawl recommends explicit waits before/after actions and
now recommends the separate stateful Interact product for richer workflows.
Actions require Fire-engine and are unavailable in default self-host Fetch and
Playwright paths [S1][S2][S5].

### 4.2 Authority and determinism

**INFERENCE (high):** action arrays are not merely rendering options. Clicks,
keypresses, writes, and arbitrary JavaScript can submit forms, mutate server
state, disclose entered values, navigate to new origins, trigger downloads, and
exercise ambient page credentials. CSS selectors and timing also make replay
fragile.

**INFERENCE (high):** grouping results by type loses a simple action-index →
outcome relation for actions that do not return artifacts. The response lacks a
typed terminal result, duration, URL before/after, side-effect classification,
or failure/retryability for every action.

**RECOMMENDATION (high):** Curiosity's retrieval primitive must expose no
arbitrary action or JavaScript authority. If a future operator-approved browser
workflow is required, every step needs a stable ID, expected origin, selector or
script digest, pre/post URL, timeout, output hash, side-effect class, and terminal
status. Credentials require a separate secret broker and must never be supplied
by scraped content or an autonomous researcher.

## 5. Cache, freshness, retention, and provenance

### 5.1 Cache behavior

**FACT (high):** hosted Scrape's default cache eligibility window is two days.
`maxAge=0` bypasses lookup; a positive value accepts a cached copy no older than
that value and otherwise attempts a fresh scrape. Cache hits still cost the base
credit. Firecrawl itself warns that freshness is not liveness [S1][S4][S16].

**FACT (high):** `minAge` is cache-only despite its counterintuitive name. It
requires cached data at least that old; `1` accepts any age. Misses return 404
`SCRAPE_NO_CACHED_DATA`. Lockdown is a stricter cache-only/ZDR mode, defaults
eligibility to two years, never contacts target/robots/media paths, returns 404
`SCRAPE_LOCKDOWN_CACHE_MISS`, costs five credits on hit and one on miss, and says
the URL is not logged on miss [S1][S2][S3].

**FACT (high):** custom headers, actions, profiles, change tracking, and custom
screenshot viewport/quality bypass cache lookup. Cache matching includes URL,
mobile, location, wait, ad blocking, screenshot presence/full-page state, and
enhanced-proxy mode. `storeInCache=false` prevents storing a new result [S4].

**FACT (high):** pinned write logic additionally excludes ZDR, actions, headers,
profiles, custom screenshots, certain PDF configurations, Exchange, and some
fetch/TLS winners from index writes [S20]. This is release implementation
evidence, not a contractual statement about every Cloud store or log.

### 5.2 Freshness outcome

**FACT (high):** `metadata.cacheState` is `hit` or `miss` when cache was
considered, and `cachedAt` accompanies a hit. `maxAge=0` omits cache state because
lookup was bypassed. Requested URL, terminal URL, status code, and page content
are available for application-specific liveness interpretation [S2][S16].

**INFERENCE (high):** `maxAge=0` proves only that Firecrawl skipped its normal
index/cache route for this request. It does not prove origin truth, no intermediary
cache, no site CDN cache, byte fidelity, or the real-world state represented by
the page.

**UNKNOWN:** whether `cachedAt` means initial network capture, transformation,
or index insertion across every Cloud engine; whether cache entries are tenant-
isolated; how auth/vary/canonical/redirect identity is keyed; whether stale or
negative entries exist outside the documented route; and whether all derivatives
are regenerated or replayed from cache.

### 5.3 ZDR and retention

**FACT (high):** Enterprise ZDR promises no page content or extracted data is
persisted beyond the request, adds one credit/page, and rejects screenshots.
Lockdown implies ZDR. `storeInCache=false` is narrower: it prevents the Scrape
result from being cached/indexed but does not itself define logs, traces,
temporary work, backups, model-provider handling, or deletion SLA [S1][S3].

**FACT (high):** Firecrawl's privacy policy says PII is used for caching and
indexing, U.S. servers store data, and PII is retained until written deletion
request because no recurring deletion policy currently exists. It names several
business analytics/payment/support vendors but does not provide a complete
Scrape-content subprocessor and retention matrix [S9].

### 5.4 Provenance gap

| Needed evidence | Public Scrape response | Assessment |
| --- | --- | --- |
| Requested and terminal URL | `sourceURL`, `url` | Useful, but no hop-by-hop redirect chain |
| Observation time | cache hit may have `cachedAt` | Fresh miss has no guaranteed fetch timestamp |
| Target response | status and content type | No selected headers, remote IP, transfer sizes, encoding decision, or body hash |
| Capture identity | provider request/scrape identifiers vary by surface | No guaranteed immutable capture reference |
| Acquisition | proxy class may appear in implementation | No stable static/rendered/engine/version contract |
| Transformation | requested fields and warning | No extractor/model/prompt/version/options digest or field/span lineage |
| Policy | optional threat error; page robots meta | No guaranteed SSRF/robots/publisher-policy decision record |
| Integrity | absent | No artifact hashes or signed capture manifest |

**RECOMMENDATION (high):** represent Firecrawl output as
`provider_transformed_untrusted`, not a Curiosity capture. Never substitute the
API receive time for fetch time or a URL for an immutable version.

## 6. Hostile-page, SSRF, and security analysis

### 6.1 Network/SSRF evidence

**FACT (high):** public input is constrained to HTTP(S). The pinned safe-fetch
dispatcher checks the connected socket's remote address and destroys connections
whose `ipaddr.js` range is not unicast unless `ALLOW_LOCAL_WEBHOOKS=true`. It
uses an Undici redirect interceptor configured for up to 5,000 redirects
[S11].

**FACT (high):** the default Playwright service performs more layers: initial
URL scheme and DNS/all-address checks; a check on every browser request;
service-worker blocking; and a local proxy that independently re-resolves and
blocks private/internal hosts. It creates a fresh browser context per request
but shares one long-lived browser process, launches Chromium with `--no-sandbox`,
and exposes a configuration switch that allows local targets [S15].

**FACT (medium):** Enterprise Threat Protection is off by default. When enabled
it applies organization policy and Google Web Risk or a customer Zscaler tenant,
can fail closed, rechecks redirect destinations, and returns a stable 403. Normal
mode costs +2 credits per URL scan. It is threat classification, not SSRF or
prompt-injection control [S10].

**INFERENCE (medium):** these OSS checks are meaningful defenses against obvious
private-address access and browser subresource SSRF, but they are not proof of
Cloud-wide enforcement. Fire-engine, Exchange, specialty media/document paths,
proxies, DNS rebinding timing, alternate IP forms, redirects, and profile/action
navigations were not independently tested. A 5,000 redirect ceiling is far too
high for a bounded retrieval service.

**RECOMMENDATION (high):** Curiosity must own egress policy outside any provider:
normalize URL; reject userinfo, non-HTTP schemes, non-approved ports, loopback,
private, link-local, multicast, metadata, and service-network ranges; resolve and
recheck/pin safely for every connection and redirect; cap redirects near 5–10;
and meter compressed/decompressed bytes and subrequests.

### 6.2 Robots contradiction retained

**FACT (high):** the public README says Firecrawl respects robots.txt by default,
but one-off Scrape checking in the pinned release is gated by the internal team
flag `checkRobotsOnScrape`; Lockdown intentionally skips it to preserve no
egress [S17][S19]. Whether every Cloud team has the flag is unknown.

**FACT (high, source-level anomaly):** when the conditional one-off check finds
a disallow, pinned code throws `CrawlDenialError`; the immediately attached
`.catch` converts it to `{success:false,error}` but the caller discards that
value and proceeds into engine selection [S13]. No end-to-end test establishing
blocked Scrape termination was found in the bounded checkout.

**INFERENCE (medium-high):** the pinned implementation appears not to enforce a
one-off Scrape robots denial even when the team flag is on. This is a static
source conclusion, not a live Cloud finding; a wrapper, patch, or deployed
revision could differ. At minimum, the general “respects robots by default”
claim is not established for Scrape.

**RECOMMENDATION (high):** Curiosity must perform and record its own robots and
publisher-policy decision before calling any adapter. Fail policy must be
explicit; agent content cannot request an override. A successful provider
scrape is never evidence of permission.

### 6.3 TLS, credentials, profiles, and active content

**FACT (high):** default TLS verification bypass is documented. Custom headers
can carry cookies and authorization; named profiles retain cookies/localStorage/
session state; actions can write credentials and execute page JavaScript
[S2][S12].

**INFERENCE (high):** these features can disclose secrets to the target, a
redirect destination, Firecrawl, its logs/storage, proxies, and optional
processors. PII redaction occurs after acquisition and only changes returned
Markdown, so it neither prevents collection nor protects headers, HTML,
screenshots, action artifacts, or provider telemetry [S2][S14].

**RECOMMENDATION (high):** no authenticated/private pages, signed URLs, session
cookies, API keys, or personal datasets may enter hosted Scrape without a
separately approved purpose, DPA/subprocessor/retention review, ZDR, and secret
handling design. PII redaction is output defense in depth, not collection
authority.

### 6.4 Hostile content and prompt injection

**NEGATIVE RESULT (high):** no Scrape contract guarantee was found for prompt-
injection neutralization, trustworthy Markdown sanitization, malware scanning,
Unicode/confusable normalization, download isolation, or safe returned URLs.
Ad/cookie-popup blocking and boilerplate cleaning are not security controls.

**RECOMMENDATION (high):** all page text, metadata, links, images, HTML, JSON,
screenshots, JavaScript returns, PDFs, warnings, and provider error text remain
untrusted external data. They cannot alter policy, request credentials, invoke
tools, expand the URL set, authorize actions, or cause privileged auto-fetches.

## 7. Limits, queues, failures, and pricing

### 7.1 Bounded behavior and missing bounds

**FACT (high):** documented/request-source bounds include one URL; 1–300 s
OpenAPI timeout; 60 s `waitFor`; 50 actions; 60 s admitted explicit waits;
10,000-character prompts/questions; screenshot quality 1–100 and viewport up to
7680×4320 in pinned schema; and PDF `maxPages` up to 10,000 [S2][S12].

**NEGATIVE RESULT (high):** no useful public maximum was found for fetched or
decompressed bytes, HTML/DOM/Markdown length, number of links/images, redirect
hops, browser requests, action script/text/selector length, generated JSON size,
signed media size, or total response bytes. No general truncation flag exists.

**FACT (high):** per-plan Scrape request limits are 10/100/500/5,000/10,000 RPM
for Free through Scale. Concurrent browsers are 2/5/50/100/150+, excess work is
queued, and queued jobs can wait up to 48 hours. Queue wait counts against the
Scrape timeout and responses can expose whether concurrency limited the request
and queue duration [S8].

**INFERENCE (high):** a synchronous HTTP endpoint can still hide queueing,
multiple engine attempts, proxy retries, browser work, and model transforms. URL
count alone does not bound time, network work, memory, cost, or hostile content.

### 7.2 Failure semantics

**FACT (high):** general documented statuses include 400 validation/URL, 401,
402, 403, 404, 408, 413, 422, 429, and 5xx. Retry guidance treats 408, 429,
500/502/503/504 as retryable with bounded backoff and `Retry-After`; the catalog
is explicitly non-exhaustive [S21].

**FACT (high):** pinned Scrape special cases include 404 cache misses; 400
actions-not-supported; 403 threat/media/policy failures; 408 timeout; and, oddly,
DNS resolution errors returned as HTTP 200 with `success:false` [S22]. Target
errors can instead appear under `success:true` in `metadata.statusCode`.

**RECOMMENDATION (high):** Curiosity should preserve provider status/reason but
normalize into stable stages: `input`, `policy`, `admission`, `dns`, `connect`,
`tls`, `redirect`, `target_http`, `render`, `parse`, `derive`, `too_large`,
`timeout`, `provider_limit`, `provider_internal`, `unknown`. Retry only typed,
idempotent acquisition failures under deadline/credit budgets; never retry
actions automatically.

### 7.3 Price as of access date

**FACT (high, time-sensitive):** annual-billing prices displayed were Free
(1,000 credits), Hobby $16/month (5,000), Standard $83 (100,000), Growth $333
(500,000), and Scale $599 (1,000,000); Enterprise is custom. Smart Upgrade can
automatically raise plan/tier when enabled [S6][S23].

**FACT (high):** base Scrape is one credit/page. Public Scrape docs add +4 each
for JSON, question, highlights, PII redaction, audio, or video; PDF parsing is
one credit per PDF page; ZDR +1; normal Threat Protection +2 per scanned URL.
Modifiers can stack [S1][S6][S10].

**Pricing contradiction retained (high):** billing says processed target 403/404
responses are charged, while pricing FAQ says only successful requests are
charged [S6][S23]. The likely distinction is successful infrastructure processing
versus provider-level failure, but customer-visible semantics remain ambiguous.
Pinned billing code further shows special cases and implementation-only costs;
an order form/invoice is authoritative [S24].

**RECOMMENDATION (high):** disable Smart Upgrade for any pilot; pre-admit a hard
local credit ceiling; record requested versus reported cost; cap retries, model
formats, PDF pages, and threat scans; and fail closed before automatic spend
escalation.

## 8. Privacy, legal use, and license boundary

### 8.1 Hosted privacy and lawful use

**FACT (high):** the privacy policy permits PII use for service provision,
caching/indexing, tailoring, improvement, analytics, and advertising; locates
servers in the U.S.; and lacks a recurring PII deletion schedule [S9]. This is
broader than a per-request no-store assumption.

**FACT (high):** terms place target/content risk on the customer, disclaim
third-party timeliness/accuracy/non-infringement, and prohibit unlawful use,
unauthorized dissemination of PII, hard background checks, debt collection,
FCRA uses, intelligence-agency people surveillance, and evidentiary law-
enforcement/criminal-prosecution uses [S25]. Public availability is not a
copyright or database-right license.

**RECOMMENDATION (high):** before hosted use, procurement/counsel must review
the current order form, DPA, subprocessor list, content/URL/header/prompt/log/
cache/backup retention, deletion SLA, data location, model-provider flows,
publisher rights, and intended corpus/jurisdiction. Robots compliance and legal
permission are separate decisions.

### 8.2 OSS and clean-room boundary

**FACT (high):** the repository root/server is AGPL-3.0. The README says SDKs
and some UI components have directory-specific MIT licenses. AGPL section 13
requires a modified version used through a computer network to offer its
corresponding source to remote users [S17][S18][S26].

**FACT (high):** Fire-engine and several Cloud/specialized capabilities are not
part of default self-hosting. Public server source therefore does not imply
Cloud implementation or feature parity [S5].

**RECOMMENDATION (high):** permitted clean-room lessons are requirements and
high-level behaviors independently restated here. Do not copy server schemas,
types, engine selection, transforms, prompts, tests, fixtures, or source text.
If later construction is authorized, an implementer should work from a neutral
contract and independent fixtures, not the upstream source. Any AGPL deployment,
modification, linking/combination, or redistribution requires counsel and a
separate licensing/compliance decision. Preserve the commit pin and attribution.

## 9. Bounded architecture inference

The following is **INFERENCE (medium-high)** from public contract plus pinned
source, not a claim of exact Cloud topology:

```text
one URL + formats + acquisition/storage/policy options
  -> request validation / account permissions / credit projection
  -> team concurrency admission (queue time consumes deadline)
  -> optional threat classification and conditional robots check
  -> cache/index eligibility and variant lookup
  -> capability calculation
  -> engine waterfall/race
       index | managed browser | Playwright | HTTP | PDF/document | specialty
       -> optional proxy/feature escalation
  -> engine-relative raw page result + target metadata
  -> ordered transformations and optional external/model services
  -> optional indexing/storage (unless excluded/ZDR)
  -> metering + synchronous response
```

Supporting facts are the controller semaphore/job path, feature-flag registry,
waterfall/race, cache/index engines, ordered transformer stack, and post-result
billing [S13][S14][S22][S24].

What this **does not prove:** Cloud worker/container isolation, browser process
sharing, exact engine order/configuration, proxy vendors, cross-tenant cache
keys, DNS pinning, Fire-engine SSRF behavior, model providers/regions, retry
counts, temporary storage, or production version correspondence.

## 10. Clean-room lessons and Curiosity implications

### 10.1 Adopt or adapt

1. **ADOPT — one known URL is a separate operation.** Discovery ends before
   retrieval begins; scraped links cannot grant themselves follow-up authority.
2. **ADOPT — explicit representation request.** Do not generate every expensive
   view by default.
3. **ADAPT — cache preference into verifiable freshness policy.** Inputs must be
   paired with outcome, capture/validation times, and explicit stale behavior.
4. **ADAPT — static-first capability escalation.** A typed content-quality
   failure may authorize isolated rendering; hidden engine escalation may not.
5. **ADAPT — main-content and tag filters.** Keep the full capture and version
   the deterministic transform; empty extraction is a typed warning, not silent
   full-content substitution.
6. **ADOPT — distinguish API/target/quality/liveness states.** HTTP 200 and
   nonempty content are evidence only.
7. **ADAPT — queue observability.** Report admission wait separately from fetch,
   render, transform, and delivery.

### 10.2 Reject by default

- Provider cache as the evidence store or URL-only citations.
- TLS verification bypass.
- Arbitrary headers, cookies, named profiles, actions, JavaScript, or PDFs
  initiated by an autonomous researcher.
- Model summaries/answers/JSON as retrieval facts.
- Auto-fetching returned links, images, screenshot/media URLs.
- Assuming provider robots, SSRF, threat classification, PII redaction, or ZDR
  replaces Curiosity-owned policy.
- Unbounded outputs, redirects, browser requests, PDF pages, retries, or spend.
- Copying AGPL server internals into Curiosity.

### 10.3 Provider-neutral target contract

Conceptual requirements, not implementation:

```text
FetchRequest
  input_url
  representation: capture | cleaned_html | markdown | anchored_passages
  acquisition: static_only | rendered_allowed
  freshness: cache_only | max_age | require_live
  stale_fallback: deny | allow
  policy_ref
  budgets:
    deadline, max_redirects, max_origin_bytes, max_decompressed_bytes,
    max_subrequests, max_output_bytes, max_render_seconds, max_cost

FetchOutcome
  request_item_id
  status: success | partial | failure
  stage_failure?: {category, retryable, redacted_reason, provider_trace_id}
  urls: {requested, fetched, terminal, canonical_claim?, redirects[]}
  acquisition: {static|rendered|provider_unknown, reason, versions}
  temporal: {requested_at, fetched_at?, validated_at?, cached_at?, received_at}
  http: {status, media_type, selected_headers, bytes, truncated}
  capture: {capture_id?, immutable_ref?, raw_hash?, artifact_hashes[]}
  transform: {name, version, options_digest, input_hash, output_hash}
  policy: {robots, egress, publisher, trust=external_untrusted}
  usage: {queue_ms, fetch_ms, transform_ms, reported_cost, local_cost}
```

**RECOMMENDATION (high):** unknown provider fields stay unknown. An adapter may
populate Firecrawl's returned URL/status/content/cache fields and hashes computed
locally over returned artifacts. It must not invent origin capture time, wire
hash, redirect chain, engine identity, or robots verdict.

### 10.4 Future evaluation gates (not performed)

Only organization-owned, public-domain, or explicitly licensed fixtures, with
separate caller authority:

1. Contract/version: defaults, strict bounds, output cardinality, error/status
   normalization, cache-only and lockdown behavior.
2. Acquisition: static HTML, deterministic JS fixture, redirect chain, bad TLS,
   PDF caps, MIME mismatch, malformed/oversize/decompression fixtures.
3. Freshness: controlled revisions across hit/miss/live/no-store/ZDR, without
   inferring policy from one observation.
4. Security: local pre-admission blocking; authorized isolated tests for private
   addresses, redirects, rebinding, subresources, proxy failure, and browser
   state. Never probe shared Cloud infrastructure without written permission.
5. Robots: owned fixture with allow/disallow/fetch failure and written vendor
   confirmation of Cloud Scrape configuration.
6. Quality: coverage, boilerplate ratio, table/code/link fidelity, dynamic DOM,
   extraction faithfulness, deterministic drift, and passage anchoring.
7. Governance/cost: DPA/subprocessors, retention/deletion, cache isolation,
   invoice reconciliation, failed-target charging, queue timeout, and hard spend
   controls.

## 11. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Evidence / verdict |
| --- | --- | --- | --- | --- |
| F1 | FACT | Scrape is a synchronous one-URL endpoint with composable representations. | High | [S1][S2]; **ADOPT boundary**. |
| F2 | FACT | Engine choice is capability/availability driven and may waterfall/race. | High for pinned OSS | [S13]; **ADAPT static-first explicitly**. |
| F3 | FACT | Main-content filtering precedes Markdown; empty main extraction falls back to full content in pinned source. | High | [S2][S14]; require warning/lineage. |
| F4 | FACT | `rawHtml` receives engine HTML; Playwright HTML comes from `page.content()`. | High for pinned OSS | [S13][S15]; **REJECT as wire capture**. |
| F5 | FACT | Actions include arbitrary page JavaScript and are capped at 50; admitted explicit waits total at most 60 s. | High | [S2][S12]; **REJECT default authority**. |
| F6 | FACT | Default hosted cache eligibility is two days; hit metadata can expose state/time. | High | [S1][S4][S16]; **ADAPT**. |
| F7 | FACT | No-store, ZDR, and Lockdown are materially different storage modes. | High | [S1][S3][S20]; preserve distinctions. |
| F8 | FACT | OSS static/browser paths have resolved-IP checks, but Playwright launches Chromium without sandbox. | High for pinned OSS | [S11][S15]; provider checks not sufficient. |
| F9 | FACT | One-off robots checking is team-flag gated; pinned denial result appears discarded. | High source fact / medium-high runtime inference | [S13][S19]; local robots mandatory. |
| F10 | FACT | Scrape pricing starts at one credit and stacks premium transforms; docs conflict on processed failures. | High | [S1][S6][S23][S24]. |
| F11 | FACT | Server/root license is AGPL-3.0; identified SDK/UI subtrees differ. | High | [S17][S18][S26]; no server code transfer. |
| I1 | INFERENCE | Scrape output is provider-transformed evidence, not reproducible capture. | High | F2–F7 and provenance gap. |
| I2 | INFERENCE | Hosted anti-bot/render behavior depends on a managed plane absent from default OSS. | High | [S5][S13]. |
| I3 | INFERENCE | Clean Markdown, JSON, and highlights remain prompt-injectable/untrusted. | High | No security guarantee; transformations do not establish trust. |
| R1 | RECOMMENDATION | Separate capture, document transform, passage extraction, and synthesis. | High | **ADOPTED** target principle. |
| R2 | RECOMMENDATION | Own egress, robots, byte/time/cost, TLS, and trust policy outside adapters. | High | **ADOPTED** safety boundary. |
| R3 | RECOMMENDATION | Reject actions/profiles/secrets and generated formats from default retrieval. | High | **REJECTED by default**. |
| R4 | RECOMMENDATION | Defer hosted adapter and rendering until controlled evaluation/governance gates pass. | High | **DEFERRED**. |
| R5 | RECOMMENDATION | Do not copy or deploy modified server code without AGPL review/compliance. | High | **REJECTED transfer**. |

## 12. Unknowns and negative results retained

1. **UNKNOWN:** exact correspondence between current Firecrawl Cloud and pinned
   OSS release/engine registry.
2. **UNKNOWN:** universal SSRF, redirect, DNS-rebinding, and policy behavior
   across Fire-engine, proxies, Exchange, PDF/document, media, X, and actions.
3. **UNKNOWN:** whether Cloud enables `checkRobotsOnScrape` for every team and
   whether deployed code fixes/avoids the pinned discarded-denial anomaly.
4. **UNKNOWN:** raw/compressed/decompressed/DOM/output/link/image/media limits
   and truncation behavior.
5. **UNKNOWN:** cache tenant isolation, complete variant key, auth/Vary handling,
   cache-entry encryption, retention/deletion, and backup behavior.
6. **UNKNOWN:** exact content, URL, header, cookie, prompt/schema, action,
   profile, trace, activity-log, and temporary-storage retention by plan.
7. **UNKNOWN:** model/provider/version/region and grounding for every LLM-backed
   transformation; product/menu service implementation and field provenance.
8. **UNKNOWN:** Cloud browser process/container/tenant isolation, patch cadence,
   sandbox configuration, profile encryption, and deletion proof.
9. **UNKNOWN:** exact billing of target errors, retries, cache misses, aborted
   requests, queue timeouts, stacked formats, and provider-internal escalation.
10. **UNKNOWN:** comparative success, fidelity, latency, freshness, and
    anti-bot quality; no benchmark was authorized.
11. **NEGATIVE RESULT:** no guaranteed raw-body hash, capture ID/time, redirect
    chain, renderer/extractor/model version, robots verdict, or source-span
    mapping was found in the public Scrape response.
12. **NEGATIVE RESULT:** no endpoint-specific prompt-injection or safe-Markdown
    guarantee was found.

Absence from public documentation is not proof that a Cloud control is absent;
it means Curiosity cannot treat it as an auditable contract.

## 13. Bounded curiosity pass

After synthesis, unresolved in-frame threads were scored 1–5 for relevance (R),
decision value (V), novelty (N), and cost (C, lower is better). Priority is
`R + V + N - C`; only public primary-source checks were authorized.

| Thread | R/V/N/C | Score | Action / result |
| --- | --- | ---: | --- |
| One-off Scrape robots claim vs implementation | 5/5/5/2 | 13 | **Pursued.** Found both internal team-flag gate and discarded denial result in pinned path. Material uncertainty retained; no live test. |
| `rawHtml` byte fidelity | 5/5/4/1 | 13 | **Pursued.** Engine-to-document and Playwright source show browser `page.content()` can underlie `rawHtml`; rejected as wire capture. |
| Cache bypass/write/lineage | 5/5/4/2 | 12 | **Pursued.** Triangulated public hit matching and pinned read/write exclusions; tenant/retention details remain unknown. |
| SSRF beyond URL validation | 5/5/4/2 | 12 | **Pursued.** Found connection-time socket check plus Playwright DNS/request/proxy layers and `--no-sandbox`; Cloud parity unknown. |
| TLS and timeout contract drift | 4/5/4/1 | 12 | **Pursued.** OpenAPI/source defaults and timeout maximum conflict; explicit local policy required. |
| Reverse engineer Fire-engine or Exchange | 2/2/4/5 | 3 | **CURIOSITY_NO_GO.** Proprietary/managed boundary, unnecessary for contract decision, and outside clean-room need. |
| Exercise keyless/paid Scrape on third-party sites | 3/3/2/5 | 3 | **CURIOSITY_NO_GO.** Calls were prohibited; one-off observations would not establish quality or security. |
| Probe SSRF/robots on shared Cloud | 5/5/3/5 | 8 | **CURIOSITY_NO_GO.** No written authorization; could affect shared infrastructure. |
| Benchmark formats and anti-bot success | 4/4/3/5 | 6 | **DEFERRED.** Requires permitted owned fixtures, rubric, credentials/budget, and caller authority. |
| Give definitive copyright/AGPL advice | 4/5/2/5 | 6 | **CURIOSITY_NO_GO.** Counsel decision; facts and review gates only. |

**Stop condition reached:** requested coverage and primary-source saturation.
Remaining high-value questions require vendor contractual material or separately
authorized controlled tests. This report grants no autonomous follow-up.

## 14. Checks performed

- Read repository `AGENTS.md`; preserved provider-neutral and untrusted-data
  boundaries.
- Used primary sources accessed 2026-08-17 and a pinned public OSS release;
  search snippets/community claims were not evidence.
- Verified tag checkout commit locally; copied no upstream code or prose into
  implementation and made no deployment.
- Made no hosted/keyless/paid request, target crawl, exploit probe, credential
  use, traffic interception, or production mutation.
- Kept Scrape distinct from adjacent Firecrawl products.
- Retained contradictions, negative results, Cloud/OSS gaps, and inference
  labels.
- File-scope check: only `docs/research/products/firecrawl-scrape.md` was added.

## 15. Primary sources

All web sources accessed **2026-08-17**. Repository links are pinned to commit
`7666c1f9ae8720a6bba271e0f60b6a217f8a5210` unless stated otherwise.

- **[S1]** Firecrawl, “Scrape” feature documentation:
  <https://docs.firecrawl.dev/features/scrape>
- **[S2]** Firecrawl, v2 Scrape OpenAPI/reference:
  <https://docs.firecrawl.dev/api-reference/endpoint/scrape>
- **[S3]** Firecrawl, “Lockdown Mode”:
  <https://docs.firecrawl.dev/features/lockdown>
- **[S4]** Firecrawl, “Faster Scraping”:
  <https://docs.firecrawl.dev/features/fast-scraping>
- **[S5]** Firecrawl, self-hosting and Cloud/OSS comparison:
  <https://docs.firecrawl.dev/contributing/self-host> and
  <https://docs.firecrawl.dev/contributing/open-source-or-cloud>
- **[S6]** Firecrawl, billing and credits:
  <https://docs.firecrawl.dev/billing>
- **[S7]** Firecrawl, proxies and Enhanced Mode:
  <https://docs.firecrawl.dev/features/proxies> and
  <https://docs.firecrawl.dev/features/enhanced-mode>
- **[S8]** Firecrawl, rate limits:
  <https://docs.firecrawl.dev/rate-limits>
- **[S9]** SideGuide Technologies / Firecrawl, Privacy Policy, revision
  2024-12-26: <https://www.firecrawl.dev/privacy-policy>
- **[S10]** Firecrawl, Threat Protection:
  <https://docs.firecrawl.dev/features/threat-protection>
- **[S11]** Firecrawl pinned safe-fetch dispatcher,
  `apps/api/src/scraper/scrapeURL/engines/utils/safeFetch.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/engines/utils/safeFetch.ts>
- **[S12]** Firecrawl pinned v2 schemas,
  `apps/api/src/controllers/v2/types.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/types.ts>
- **[S13]** Firecrawl pinned Scrape pipeline and engine registry,
  `apps/api/src/scraper/scrapeURL/index.ts` and `engines/index.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/index.ts> and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/engines/index.ts>
- **[S14]** Firecrawl pinned transformer pipeline,
  `apps/api/src/scraper/scrapeURL/transformers/index.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/transformers/index.ts>
- **[S15]** Firecrawl pinned Playwright service,
  `apps/playwright-service-ts/api.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/playwright-service-ts/api.ts>
- **[S16]** Firecrawl, “Verifying Freshness and Liveness”:
  <https://docs.firecrawl.dev/developer-guides/usage-guides/verifying-freshness-and-liveness>
- **[S17]** Firecrawl pinned README:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/README.md>
- **[S18]** Firecrawl pinned root AGPL-3.0 license:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/LICENSE>
- **[S19]** Firecrawl pinned one-off robots gate,
  `apps/api/src/scraper/scrapeURL/shouldCheckRobots.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/shouldCheckRobots.ts>
- **[S20]** Firecrawl pinned index read/write logic,
  `apps/api/src/scraper/scrapeURL/engines/index/index.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/engines/index/index.ts>
- **[S21]** Firecrawl, API errors:
  <https://docs.firecrawl.dev/api-reference/errors>
- **[S22]** Firecrawl pinned v2 Scrape controller,
  `apps/api/src/controllers/v2/scrape.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/scrape.ts>
- **[S23]** Firecrawl, pricing page:
  <https://www.firecrawl.dev/pricing>
- **[S24]** Firecrawl pinned Scrape billing logic,
  `apps/api/src/lib/scrape-billing.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/scrape-billing.ts>
- **[S25]** SideGuide Technologies / Firecrawl, Terms of Use, revision
  2024-11-05: <https://www.firecrawl.dev/terms-of-service>
- **[S26]** GNU Project, GNU Affero General Public License v3, especially
  sections 2 and 13: <https://www.gnu.org/licenses/agpl-3.0.html>

## 16. Confidence summary and final disposition

- **High confidence:** current public request/response fields, formats, cache
  modes, plan limits/prices, legal text, root license, and pinned OSS control
  flow.
- **Medium confidence:** inferred hosted acquisition topology, one-off robots
  runtime consequence, and exact meaning of some cache/engine fields.
- **Low/unknown:** Cloud parity, comparative quality, full retention/subprocessor
  behavior, tenant/cache/browser isolation, all-engine SSRF behavior, and actual
  invoice edge cases.

**ADOPTED:** known-URL separation, explicit representations, typed freshness
request/outcome, separate queue timing, static-first escalation, and independent
target/API/quality states.  
**ADAPTED:** main-content extraction, cache modes, browser rendering, and
structured outputs only with immutable capture lineage, strict budgets, and
Curiosity-owned policy.  
**REJECTED:** Firecrawl as evidence foundation; provider cache as record;
default TLS bypass; actions/profiles/secrets; generated outputs as facts;
provider-only SSRF/robots; and AGPL server code transfer.  
**DEFERRED:** any hosted adapter, rendering lane, specialized/media/model
formats, and benchmark until governance and controlled-fixture gates pass.
