# Diffbot Extract APIs: clean-room product reverse engineering

**Research / primary-source access date:** 2026-08-17  
**Scope:** Diffbot Analyze, typed Extract endpoints, shared extraction controls,
and Custom APIs. Diffbot Crawl, Bulk Extract, Web Search, Natural Language as a
standalone API, and Knowledge Graph query/enrichment are out of scope. Entity
links and NLP-derived fields are discussed only where they are returned by
Extract.  
**Method boundary:** public first-party documentation, machine-readable OpenAPI,
pricing, privacy policy, and terms. No account, credential, paid or keyless API
call, dashboard session, traffic interception, bypass, proprietary code, or
third-party target was used. This is product research, not legal advice,
security certification, quality benchmark, or implementation.

## Executive verdict

**ADAPT, do not adopt wholesale (high confidence).** Diffbot exposes a mature
known-URL extraction boundary: fetch and JavaScript-render one page, optionally
classify it, project it into a typed schema, normalize selected values, and
return JSON. A direct endpoint forces a schema; Analyze adds classification;
Custom APIs permit URL-pattern-scoped CSS/XPath rules and pre-extraction
JavaScript. This is a valuable decomposition and a poor evidence boundary
[S1–S5][S13–S17].

The strongest lessons for Curiosity are typed extraction, a classifier that can
be bypassed, explicit redirect-terminal identity, structured partial ontology,
and the ability to separate acquisition from extraction by POSTing caller-held
HTML. The largest gaps are temporal and evidentiary: Extract may serve an
undisclosed cache entry, returns no fetch/cache timestamp, response/capture
hash, HTTP evidence, extractor/model/ruleset build, field-to-source anchor, or
general field confidence. `request.version: 3` identifies the public API family,
not a reproducible extraction build [S2][S3][S18][S22].

The highest-risk capabilities are equally explicit: caller-selected URL fetch,
redirects, browser JavaScript, forwarded cookies and headers, proxy credentials,
caller JavaScript that can read `document.cookie`, full console return, rendered
DOM return, and normalized HTML that may retain iframes, embeds, SVG subtrees,
and tweet subtrees [S11][S12][S19–S21]. “Clean” or normalized output is not a
security guarantee.

**Project disposition:**

- **ADOPTED:** known-URL extraction as a separate operation; forced typed
  schemas; explicit submitted/final URL distinction; versioned, bounded custom
  mappings as an internal capability.
- **ADAPTED:** Analyze-like classification with calibrated confidence and an
  explicit fallback reason; normalized fields with source anchors; static-first
  acquisition with separately authorized rendering.
- **REJECTED:** Diffbot's schema as Curiosity's domain model; URL-only evidence;
  query-string credentials; arbitrary agent-supplied JavaScript, cookies,
  proxies, or headers; active returned markup; hidden cache freshness.
- **REJECTED as foundation:** a hosted, opaque Extract service cannot be the
  owned reproducible retrieval plane.
- **DEFERRED:** any provider trial until approved fixtures, budget, procurement,
  privacy/legal review, and security controls exist.

## 1. Decision frame and bounded questions

### Decision

Which observable Diffbot Extract concepts should Curiosity adopt, adapt, reject,
or defer while keeping provider-neutral contracts, bounded authority, hostile
content isolation, and capture-level provenance?

### Bounded sub-questions

1. What are the request, response, type, pagination, error, and limit contracts?
2. How do Analyze, forced typed extraction, optional fields, normalization, and
   Custom APIs alter the ontology or derivation?
3. What does public evidence establish about fetching, rendering, redirects,
   supplied HTML, proxies, caching, and freshness?
4. What confidence and provenance are returned, and what is absent?
5. Which hostile-input, credential, privacy, legal, and cost boundaries apply?
6. What minimal architecture is inferable without claiming hidden internals?
7. Which clean-room lessons transfer to Curiosity?

### Evidence labels and stop rule

- **FACT** — stated or shown in a cited Diffbot primary source.
- **INFERENCE** — bounded interpretation of facts, not observation of private
  internals.
- **RECOMMENDATION** — proposed Curiosity decision.
- Confidence is **high**, **medium**, or **low**.

Vendor documentation proves only that Diffbot represents a contract or
capability as offered. It does not independently establish correctness,
completeness, freshness, security, or comparative quality. Research stopped
when every requested category had primary evidence or an explicit unknown and
remaining questions required an authenticated test, contractual disclosure, or
prohibited speculation.

## 2. Product boundary and observable pipeline

**FACT (high):** the standard surface comprises Analyze and eight typed
endpoints at `https://api.diffbot.com/v3`: Article, Product, Image, Video,
Discussion, Event (beta), List (beta), and Job (beta). The overview calls each a
single GET taking a query-string `token` and target `url`; each request has a
base price of one credit, or two when Diffbot's datacenter proxy is used [S1].

**FACT (high):** Extract renders the page, while Analyze classifies and routes a
supported page type. A typed endpoint forces the corresponding schema. Analyze
can restrict routing with `mode` and force an extractor for `other` pages with
`fallback`; Diffbot warns that classification can be wrong [S1][S2].

**INFERENCE (high):** the minimum functional pipeline consistent with the
contract is:

```text
request + account/custom policy
  -> URL fetch OR caller-supplied HTML/text
  -> redirects / optional proxy / cache decision
  -> JavaScript render (unless Article `norender` path)
  -> optional caller JavaScript / DOM mutation
  -> Analyze classification OR forced typed extractor
  -> typed field extraction + normalization
  -> optional comments/paging/NLP/meta/links/DOM
  -> request envelope + objects[]
```

This does not identify service topology, browser engine, models, schedulers,
storage, or cache implementation.

**RECOMMENDATION (high):** Curiosity should separate `AcquireCapture`,
`ClassifyDocument`, `ExtractTypedDocument`, and `DeriveFields`. Diffbot combines
them in one hosted request, but its options expose their conceptual seams.

## 3. Common wire contract

### 3.1 Request and response envelope

**FACT (high):** common GET parameters are required `url`; `token`; optional
comma-delimited `fields`; third-party fetch `timeout` in milliseconds (30,000 by
default); JSONP `callback`; `proxy`; `proxyAuth=username:password`; and
`useProxy=default|none`. The OpenAPI is version 1.1.0 and declares API server
`https://api.diffbot.com/v3` [S1][S2][S31].

**FACT (high):** successful responses use a `request` object with `pageUrl`,
`api`, and `version`, plus an `objects` array. Typed objects generally contain
lowercase `type`, `pageUrl`, optional `resolvedPageUrl` after redirects, and a
`diffbotUri`; fields vary by type [S2–S10][S20]. Custom API responses always
place one object in `objects` [S14]. Article currently says only one Article
object is returned, while Image can return multiple objects [S3][S5].

**FACT (high):** every standard endpoint also supports POSTing `text/html`; the
`url` remains required as the base for relative-link resolution. Plain-text POST
is documented only for Article. Extraction quality can depend on whether linked
images/CSS and layout assets remain accessible [S19].

**INFERENCE (high):** URL and content-body POST are two different acquisition
modes hidden behind one extractor family. The supplied `url` in POST mode is a
base/claimed origin, not proof Diffbot fetched that address.

### 3.2 Shared optional fields

**FACT (high):** `fields=` can request:

- visible page hyperlinks (`links`);
- header/footer hyperlinks, visible or not (`extlinks`);
- full page meta content including OpenGraph, Twitter Card, schema.org, and
  oEmbed (`meta`);
- URL query pairs (`querystring`);
- breadcrumb link text/URLs (`breadcrumb`);
- Article-like page text (`content`);
- all visible rendered body text (`allContent`); or
- rendered page source (`dom`) [S11].

The generated OpenAPI enumerations shown on endpoint pages list only a subset
(`links`, `extlinks`, `meta`, `querystring`, `breadcrumb`, plus type-specific
fields), while the shared optional-fields page advertises `content`,
`allContent`, and `dom` for all Extract APIs [S2–S11][S31].

**CONTRACT CONFLICT (high):** prose and generated OpenAPI disagree on accepted
optional fields. Treat the broad fields as documentation-supported but require
conformance tests before depending on them.

### 3.3 Redirect, duration, and paging boundaries

**FACT (high):** Extract follows at least HTTP 301 and meta-refresh redirects and
returns `resolvedPageUrl` for the final destination. If both original-URL and
resolved-URL custom rules exist, resolved-URL rules take precedence [S20].

**FACT (high):** a request has a maximum duration of 180 seconds. The default
third-party fetch/render timeout is 30 seconds per page and can be changed with
`timeout`. Diffbot says its post-render processing is normally milliseconds,
while multipage acquisition can make the total much longer [S24].

**FACT (high):** Article concatenates up to 20 pages by default; `paging=false`
disables it. Discussion does not concatenate by default; `maxPages` enables it
and `maxPages=all` requests all pages, each counted as a separate API call.
`numPages` and `nextPages` expose admitted pages. List explicitly extracts one
listing page and does not paginate automatically [S3][S6][S9][S25].

**RECOMMENDATION (high):** reject `maxPages=all` and implicit 20-page expansion
for agent-facing use. Every additional URL must be visible in the frontier,
policy-checked, and charged against URL, host, byte, time, and cost ceilings.

## 4. Extraction ontology and typed contracts

Diffbot uses “ontology” for standard page-type fields. This section describes
only fields returned by Extract; it does not inspect or adopt the separate
Knowledge Graph ontology.

| Endpoint | Contracted semantic shape | Material bounds / caveats |
| --- | --- | --- |
| **Analyze** | Top-level classification `type`/`title` and typed `objects[]`; unsupported is `other`; `mode`, `fallback`, and `discussion` controls [S2]. | Classifier can be wrong. Current `mode`/`fallback` enums list Article, Product, Discussion, Image, Video, List, Event—but not Job [S2][S31]. |
| **Article** | Title; clean text; normalized HTML; source/estimated date; author/profile; language; site and publisher geography; location; images/video; sentiment; categories; entity-like tags; comments; paging metadata; ID [S3]. | One object; up to 20 pages by default; tag/category threshold defaults 0.5; tags only for 13 named languages, categories for 100+; comments on by default. |
| **Product** | Title/description/brand; offer, regular, shipping, discount, structured price parts; GTIN/UPC/SKU/MPN/ISBN; specs and normalized specs; images; reviews; origin; availability/category/variants/ranges/quantity prices/size [S4][S23]. | Several fields are beta. Review extraction is default. `specs` keys are page-derived normalized names, while `normalizedSpecs` uses a fixed unit vocabulary only when a spec structure is detected. |
| **Image** | One or more image objects: direct URL, caption, intrinsic dimensions, page language, anchor URL, source/final URL, XPath, ID; optional displayed dimensions and embedded EXIF/XMP/ICC metadata [S5]. | “Primary image(s)” is product wording, but response can contain several. XPath is useful extraction location, not an immutable anchor across page revisions. |
| **Video** | Title/description, direct media URL if available, embeddable HTML/URL, author/date/duration/views, dimensions, thumbnails, MIME, language, provider, ID [S6]. | Direct media URLs may be transient/signed; returned embed HTML is active content if rendered. |
| **Discussion** | Thread title; post count; ordered posts with local ID/parent ID, text, normalized HTML, language, media, date, author/profile, page URL and ID; participants, paging, provider/RSS, tags and optional post sentiment [S7]. | Top-level sample has `confidence`, but prose does not define its meaning. Post IDs express a returned tree, not durable global identity. |
| **Event** *(beta)* | Single-day event title; GMT and local start/end; offset; description; venue; parsed/geocoded location and precision; images; language; tags/categories; ID [S8]. | Multi-day/multi-track events are explicitly unsupported. Missing time becomes midnight, which must not be treated as observed precision. |
| **List** *(beta)* | Page title and `items[]` containing item title, summary, date, permalink and image [S9]. | Broad repeated structures; one page only; no typed union for item variants and no published item-count/output-size cap. |
| **Job** *(beta)* | Posting date/title/text/salary/contact; employer entity reference; four-state remote status; skills with confidence/salience; requirements/tasks; parsed locations; ID [S10]. | One job per request. Endpoint prose says `datePosted`; generated response schema says `postedDate`, while its own example returns `datePosted` [S10]. |

### 4.1 Analyze contract drift

**FACT (high):** Analyze's introductory prose says automatic supported types are
articles, discussions, images, products, and videos, then says “and more coming
soon.” Its current mode/fallback enums also include List and Event. The Extract
overview includes Job, but Job is absent from those enums [S1][S2][S31].

**UNKNOWN:** whether current Analyze can classify/route Job, and whether the
enum or prose is stale. No call was made. Provider adapters must not infer that
every direct extractor is automatically routable by Analyze.

### 4.2 Normalization is derivation, not source truth

**FACT (high):** Article `html` is a normalized representation. It standardizes
the allowed element/attribute set, removes layout specifics, preserves selected
structure, and may preserve all SVG-descendant attributes and tweet subtrees.
Product `normalizedSpecs` sanitizes text and converts selected numeric units to
canonical units/values [S21][S23].

**INFERENCE (high):** normalized HTML, text, date, geocode, category, price
parts, and unit conversions are independent derived claims. None is a raw
capture. A conversion can be deterministic yet wrong because source parsing or
unit recognition was wrong.

**RECOMMENDATION (high):** retain source literal, normalized value, unit,
normalizer version, and source anchor separately. Never overwrite evidence with
the normalized value.

## 5. Confidence, identity, provenance, and freshness

### 5.1 Confidence is sparse and semantically heterogeneous

**FACT (high):** Article tag and category scores range from 0 to 1 and default
minimum thresholds are 0.5; Article sentiment ranges from -1 to 1. Job skills
carry `confidence` and `salience`. Discussion examples include a top-level
`confidence`, but the field table does not define it. Event locations expose
geographic `precision`, not extraction confidence [S3][S7][S8][S10].

**NEGATIVE RESULT (high):** no general page-classification probability,
per-field extraction confidence, calibration definition, abstention reason, or
source precedence was found. Score meanings must not be conflated.

### 5.2 Identity and minimal lineage

**FACT (high):** typed outputs can provide submitted `pageUrl`, final
`resolvedPageUrl`, object `type`, and `diffbotUri`. Diffbot says several typed
`diffbotUri` values are generated from object fields and can be used for
deduplication. Article/Discussion paging returns admitted next-page URLs; Image
objects can include XPath [S3][S5–S7][S20][S25].

**INFERENCE (high):** a field-derived `diffbotUri` is a content/object identity
hint, not a capture ID. If contributing fields or extractor behavior changes,
stability is not publicly guaranteed.

**NEGATIVE RESULT (high):** reviewed Extract responses expose no:

- provider request/trace ID distinct from the returned object ID;
- fetch/cache/validation timestamp or cache age/status;
- HTTP status, response headers, redirect chain, robots/publisher-policy record,
  raw body size/hash, screenshot, rendered DOM hash, or truncation flag;
- extractor/classifier/model/custom-ruleset build ID;
- field-level source selector/offset/hash, derivation explanation, or confidence;
- immutable historical response/capture reference.

### 5.3 Cache and freshness

**FACT (high):** Diffbot says Extract caches “sometimes” using factors including
site reliability/responsiveness, update frequency, popularity, and content type.
The public remedy for stale data is to contact support to discuss possible
bypass methods; no request-level cache bypass or TTL is documented [S22].

**FACT (high):** Article and Product warn that cached comments/reviews may still
be returned even when `discussion=false` is requested [S3][S4]. Dates in typed
objects describe source content (and Article `estimatedDate` is inferred), not
the acquisition time [S3][S6][S8][S10].

**INFERENCE (high):** a successful response cannot prove that its page was
fetched for this request or establish age at response. A caller also cannot
distinguish changed source content from changed extraction logic.

**RECOMMENDATION (high):** mark Diffbot output `provider_transformed` and
`observed_at=unknown`; never substitute local request time. Curiosity citations
need owned or equivalently evidenced captures with immutable ID, acquisition
time, hashes, and passage anchors.

## 6. Rendering and fetch dependencies

### 6.1 Render-first behavior and static escape hatch

**FACT (high):** Extract executes page JavaScript at render time and generally
accesses Ajax-delivered content. Custom APIs use Diffbot's cloud renderer and
execute most page-level JavaScript. Diffbot says most request latency comes from
third-party acquisition [S1][S13][S18][S26].

**FACT (high):** Article accepts an undocumented-in-OpenAPI advanced `norender`
argument that disables full rendering for speed at reduced extraction quality.
Documented degradations include image-caption misses and excess sharing/other
elements [S26]. POSTing source HTML can bypass Diffbot's renderer, though linked
assets and layout availability still affect quality [S19][S26].

**FACT (high):** direct Extract calls can process PDFs, but Diffbot says quality
varies materially with document structure [S42]. The public contract does not
specify OCR, page limits, embedded-file handling, password behavior, or PDF
malware controls.

**INFERENCE (medium):** render and extraction are coupled but not inseparable.
The Article-only `norender` documentation does not establish a generic static
lane for every endpoint.

### 6.2 Fetch controls and authority expansion

**FACT (high):** requests may forward User-Agent, Referer, Cookie,
Accept-Language, and X-Evaluate headers using `X-Forward-*`; one-call headers are
discarded afterward. URL-pattern rules may persist them, and a User-Agent array
causes random selection. Diffbot explicitly presents cookies for login sessions,
pop-up removal, and ad suppression [S12][S27].

**FACT (high):** callers may select Diffbot's default proxy or submit third-party
proxy address and credentials. Diffbot can also globally enable a proxy for a
domain, increasing a call from one to two credits unless `useProxy=none` is
specified. Dynamic proxies are separately priced for higher tiers [S17].

**FACT (high):** troubleshooting docs expose additional non-OpenAPI arguments
such as `renderDelay`; they recommend proxy rotation or supplied HTML after
blocks and acknowledge that third-party proxy connectivity is not reported in
the Extract response [S17][S33].

**RECOMMENDATION (high):** no page, model, or agent may choose headers, cookies,
proxy credentials, render delay, or retry escalation. These are privileged
operator policy with per-destination authorization and cost disclosure.

## 7. Custom APIs: contract and governance consequences

### 7.1 Two customization modes

**FACT (high):** a Custom API is either (a) an extension of a reserved typed API,
which can override/add/delete fields, or (b) a blank custom endpoint returning
only manually defined fields. `api` plus URL-regex `urlPattern` uniquely
identifies a ruleset for a token; POSTing the same pair replaces the ruleset
completely and takes immediate effect [S13][S15].

**FACT (high):** a ruleset contains `rules[]` with field `name`, CSS/XPath
`selector` or hard-coded `value`, optional nested collection rules, and filters:
`attribute`, `exclude`, and regex `replace`. `prefilters` delete matching DOM
subtrees before all processing. A `delete:true` rule removes an output field.
Multiple selector matches concatenate unless modeled as a nested collection
[S15][S16].

**FACT (high):** Custom extraction runs at `GET /v3/{api}` and returns one
object. Management supports create/update, retrieve, and delete. Creation
returns a `hashes` value that docs say is safe to ignore and unused by public
APIs [S13][S14].

**INFERENCE (high):** customization is a tenant-scoped extraction policy plane,
not merely an extra response field. It can change ontology, DOM visibility,
network identity, authentication context, execution, and training feedback.

### 7.2 JavaScript customization

**FACT (high):** `X-Forward-X-Evaluate` executes caller JavaScript before
extraction. Scripts use `start()`/`end()`; omission of `end()` times out. They
can modify the DOM or call `save(name,value)` to add JSON fields. The official
example saves `document.cookie`. `xevalDebug` returns the entire rendered page
console, not merely caller logs [S28].

**FACT (high):** an X-Evaluate script attached to an Article rule does not run
when Analyze happens to classify that page as Article; the caller must use the
API where the rule resides [S28].

**RECOMMENDATION (high):** reject arbitrary JavaScript in Curiosity's agent ABI.
If an owned operator-only transformation language is later necessary, prefer a
declarative, versioned, total, resource-bounded selector/normalizer DSL over
browser code. Store rules immutably and return the exact ruleset version used.

### 7.3 Rule lifecycle and learning boundary

**FACT (high):** Diffbot says correcting an Extract field takes immediate effect
for that account and “also serves to train our system” over the long run [S14].
The public response does not say whether a value came from base AI, a manual
override, or later model behavior.

**UNKNOWN:** training scope, review, isolation, retention, opt-out, and whether
customer-supplied rule examples or outputs affect shared models. Procurement
must obtain written answers before sensitive customization.

**RECOMMENDATION (high):** Curiosity must encode derivation origin per field:
`model`, `declared_metadata`, `selector_rule`, `normalizer`, or `human_override`,
plus immutable version. Never silently blend them.

## 8. Errors, limits, and bounded behavior

### 8.1 Documented errors

| Status/code | Published meaning | Contract concern |
| --- | --- | --- |
| `401` | token not authorized [S32] | Token is in URL query, increasing log/referrer exposure risk. |
| `404` | page could not be downloaded; slow/down/blocking are conflated [S33] | Not the origin HTTP status; retryability and stage are ambiguous. |
| `429` | docs title says target site too many requests, but body says caller exceeded plan calls/second and recommends one-second/backoff behavior [S34] | Provider quota and origin throttling wording conflict. |
| `457` | endpoint is neither a standard type nor token-defined Custom API [S35] | Nonstandard HTTP status; adapter normalization required. |
| `500` “site too many requests” | Diffbot deliberately throttles a popular target to avoid blocking [S36] | Operational origin limit is encoded as internal error. |
| `500` “unable to apply rules” | Custom selectors matched nothing and no other valid field was extracted [S37] | No failing rule ID or partial-field contract. |
| concatenation timeout | automatic article paging exceeded time; disable with `paging=false` [S38] | Error page does not state stable machine code. |
| generic `500` | endpoint OpenAPI examples use `{errorCode,error}` [S4–S10][S31] | No published comprehensive taxonomy or retry flag. |

**NEGATIVE RESULT (high):** no complete stable taxonomy was found for invalid
URL/scheme, DNS, TLS, redirect loop, unsupported media, robots/publisher denial,
private address, size/decompression, malformed DOM/PDF, malware, browser crash,
script timeout, cache failure, or output truncation. The OpenAPI generally
declares only 200 and generic 500 despite separate troubleshooting pages.

### 8.2 Hard and missing limits

**FACT (high):** plan rates are 5 calls/minute (Free), 5/second (Startup), and
25/second (Plus); Free has 10,000 Extract calls/month. Enterprise is custom
[S29][S30]. A synchronous request tops out at 180 seconds; default per-page
fetch/render timeout is 30 seconds [S24].

**NEGATIVE RESULT (high):** no public hard maximum was found for URL length,
redirect count, origin bytes, decompressed bytes, DOM nodes, rendered network
requests, POST body size, output bytes, links/media/meta count, List items,
custom rules/selectors, console bytes, or JavaScript CPU/memory. Article's
implicit 20 pages and Discussion's `all` are not adequate resource bounds.

**RECOMMENDATION (high):** enforce Curiosity-owned URL, redirect, byte,
decompression, MIME, DOM, execution, output, object-count, media-count, deadline,
retry, and credit ceilings before and after provider calls. Normalize provider
errors into stage, category, retryability, and redacted evidence.

## 9. Hostile-input and security analysis

### 9.1 Observable attack surface

**INFERENCE (high):** the documented features necessarily create:

- SSRF, redirect escape, DNS rebinding, private-network and metadata-service
  risks from caller-selected URL acquisition;
- browser/parser/PDF exploit, decompression, resource exhaustion, and
  denial-of-wallet risks;
- credential leakage from query tokens, proxy auth, cookies, referrers,
  permanent custom rules, console output, and `document.cookie` access;
- cross-origin/cross-tenant leakage risk if renderer, cache, cookies, or custom
  rules are not strongly isolated;
- prompt injection and malicious links in text, metadata, comments, lists,
  job descriptions, and custom fields;
- active-content risk from DOM, normalized HTML, iframes, embeds, video HTML,
  SVG, tweets, base64 data URIs, and returned external media URLs;
- selector/regex/script resource abuse and silent schema poisoning from custom
  overrides [S5–S16][S19–S21][S27][S28].

These are risk deductions, not claims that Diffbot lacks mitigations.

### 9.2 Public security unknowns

**NEGATIVE RESULT (high):** reviewed public Extract sources do not specify
private/link-local address blocking, per-redirect DNS/IP checks, DNS rebinding
defense, renderer sandboxing, cookie-jar isolation, egress allowlists, origin
byte/decompression limits, download blocking, malware scanning, MIME sniffing,
prompt-injection treatment, secret detection/redaction, cache tenant isolation,
or custom-script CPU/memory/network restrictions.

The privacy policy states reasonable controls, secure encrypted US services,
and HTTPS where personal data is handled **except API calls that rely on HTTP
without encryption**; this is not an Extract threat model or security guarantee
[S39].

### 9.3 Curiosity boundary

**RECOMMENDATION (high):**

1. accept only normalized policy-approved public HTTP(S) URLs; reject embedded
   credentials and sensitive/signed URLs before provider disclosure;
2. resolve and re-check address policy at every redirect; block loopback,
   private, link-local, multicast, and metadata ranges;
3. never forward ambient cookies, authorization, user identity, or proxy
   credentials; do not put API secrets in persisted/logged URLs;
4. static capture first; render only in a disposable no-intranet environment
   under explicit reason and budget;
5. treat text, metadata, HTML, media, links, errors, and console as
   `untrusted-external-evidence`; never execute or trust returned markup;
6. sanitize display while retaining an inert immutable capture; do not auto-fetch
   returned media/embed URLs from a privileged context; and
7. extraction output cannot change policy, request secrets, authorize tools, or
   trigger another fetch.

## 10. Pricing and operational economics

**FACT (high, point-in-time):** on 2026-08-17 Free included 10,000 monthly
credits and 5 requests/minute; Startup was $299/month with 250,000 credits,
$0.001 overage, and 5 requests/second; Plus was $899/month with 1,000,000
credits, $0.0009 overage, and 25 requests/second; Enterprise was custom [S29].

**FACT (high):** one extracted page costs one credit and one page through
Diffbot's datacenter proxy costs two. Credits refresh monthly and do not roll
over. The proxy page says a backend-global proxy may make a domain cost two
credits even when the caller did not request one; `useProxy=none` disables it
[S17][S29][S30]. Multipage Discussion charges each page as a separate call
[S7][S25].

**INFERENCE (high):** cost is not a pure function of the submitted root URL. It
can expand through Article/Discussion pagination, retries, and
provider-selected proxying. The public response does not expose request-local
billed credits.

**RECOMMENDATION (high):** snapshot commercial terms outside the domain model;
preflight worst-case pages/proxy/retries; set a lower local budget; record root
and expanded URL attempts separately; reconcile account usage; and make hidden
proxy or pagination cost divergence alertable.

## 11. Privacy and legal boundaries

### 11.1 Data disclosed and retained

**FACT (high):** Diffbot associates Subscriber query history and API calls with
the API key and tracks request time/date and access method. Its privacy policy
describes US processing/services and service providers, and says public-web
extraction can include personal data. It distinguishes Subscribers from Search
Subjects and provides privacy/data-rights channels [S39][S41].

**INFERENCE (high):** an Extract request can disclose the target URL, supplied
HTML/text, forwarded headers/cookies, custom rules/selectors/scripts, and the
meaning of the extraction to Diffbot. URL and content can contain customer or
personal data even when no explicit person name is typed into the API.

**UNKNOWN:** Extract-specific retention for target URLs, supplied bodies,
rendered pages, outputs, cookies, proxy credentials, custom rules, and console
logs; whether each category is used for service/model improvement; regional
residency; deletion SLO; and self-serve versus enterprise differences. The
general “necessary”/30-days-after-verified-wish wording is not a dataset-specific
retention schedule [S39].

### 11.2 Terms and rights

**FACT (high):** Diffbot's terms allow facts generated by the Service to be used
and displayed in a commercial application, but prohibit reselling/making the
Service available to third parties, unlawful or rights-infringing use,
unauthorized access, reverse engineering, and scraping/crawling the Diffbot
Site/Service. Diffbot disclaims accuracy, completeness, usefulness, uptime,
security, and non-infringement warranties [S40].

**FACT (high):** the terms preserve Diffbot/licensor service IP while excluding
user content, third-party content, and public-domain content from that service-IP
claim. User-submitted queries or Enhance data receive a broad processing
license; the narrower earlier clause says confidential materials/data may be
used as necessary to provide the subscription service. These provisions should
be reconciled contractually for the contemplated input [S40].

**RECOMMENDATION (high):** successful extraction is not permission to access,
retain, republish, train on, or redistribute origin content. Review separately:
vendor service rights, target-site authorization/terms, copyright/database
rights, privacy purpose, credentials/cookies, and output retention. Do not use
Diffbot to bypass access controls or publisher restrictions.

### 11.3 Clean-room boundary

**RECOMMENDATION (high):** transfer only generic ideas: typed contracts,
classifier bypass, immutable rule versions, normalization lineage, and bounded
fetch/render stages. Do not copy Diffbot documentation prose, ontology text,
selectors, examples as fixtures, proprietary outputs, caches, model behavior,
or undocumented algorithms. No service response should seed an owned corpus or
serve as training truth without separate rights and provenance review.

## 12. Architecture inference and Curiosity target contract

### 12.1 Supported functional decomposition

```text
CONTROL: token/account limits + URL-pattern custom policy
ACQUIRE: cache decision -> direct/proxy fetch -> redirects -> render
PREPARE: supplied HTML OR DOM + prefilters + optional X-Evaluate
ROUTE: Analyze classifier OR forced type/custom endpoint
EXTRACT: typed model and/or selector collections
DERIVE: normalized HTML/specs, dates, geocodes, NLP/tags, paging/comments
RETURN: request metadata + one/many objects OR coarse error
```

**Confidence:** high for these functional seams; low for any physical topology,
ordering not forced by the contract, model, browser, cache key, or isolation
mechanism.

### 12.2 Provider-neutral contract implications

Conceptual request:

```text
input:
  capture_id OR approved_url       # extraction should prefer a capture
requested_type: auto | article | product | image | video | discussion |
                event | list | job | custom_schema_id
classification_policy:
  min_confidence, allowed_types, on_abstain
acquisition_policy:
  static_only | rendered_allowed
  cache_policy, redirect_limit, deadline_ms
expansion_budget:
  max_pages, max_hosts, max_bytes, max_objects, max_cost
derivations:
  comments, metadata, links, normalized_view, selectors
```

Conceptual response:

```text
capture:
  capture_id, requested_url, terminal_url, redirects, fetched_at
  http_status, selected_headers, media_type, byte_hash, render_mode
classification:
  selected_type, confidence?, classifier_version, fallback_reason?
document:
  schema_id, schema_version, extractor_version, object_id
claims[]:
  field, source_literal?, normalized_value?, confidence?
  source_anchor, derivation_type, derivation_version
outcome:
  status, stage, failure_code?, retryable, truncated
usage:
  pages, rendered_pages, bytes, objects, estimated_cost, provider_reported_cost
trust:
  untrusted_external_evidence = true
  retrieval_only = true
```

**RECOMMENDATION (high):** a Diffbot adapter could truthfully populate returned
typed data, submitted/final URL where present, provider object ID, and API
version. It must leave capture time/hash, cache age, extractor version, field
anchors, general confidence, and policy evidence unknown—not fabricate them.

## 13. Adopt/adapt/reject/defer ledger

| Observable idea | Verdict | Curiosity treatment / confidence |
| --- | --- | --- |
| Known-URL extraction separate from discovery | **ADOPTED** | High; explicit operation with no ambient frontier authority. |
| Auto-classify plus forced typed endpoints | **ADAPTED** | High; return calibrated confidence/version and allow abstention. |
| Typed Article/Product/media/discussion/event/list/job shapes | **ADAPTED** | High; author a neutral schema; beta/provider fields stay adapter-local. |
| Submitted and resolved URL distinction | **ADOPTED and extended** | High; preserve every redirect and canonical candidate. |
| Normalized text/HTML/specs | **ADAPTED** | High; retain literals, anchors, and derivation versions. |
| Multipage concatenation | **ADAPTED** | High; explicit bounded child frontier, never silent or `all`. |
| POST caller-held HTML | **ADOPTED conceptually** | High; extraction may consume an immutable capture without network authority. |
| Optional DOM/meta/links | **ADAPTED** | High; privileged internal evidence, inert and hard-bounded. |
| Tenant custom selectors/collections | **ADAPTED** | High; declarative, reviewed, immutable versions with per-field provenance. |
| Custom JavaScript/cookies/proxies/user-agent rotation | **REJECTED for agents** | High; excessive egress, credential, execution, and evasion authority. |
| Provider cache without observable age | **REJECTED as fresh evidence** | High; mark freshness unknown. |
| `diffbotUri`/URL as sufficient citation | **REJECTED** | High; require capture + passage identity. |
| Diffbot schema/service as owned foundation | **REJECTED** | High; opaque acquisition, cache, extraction, changes, and terms. |
| Hosted adapter benchmark | **DEFERRED** | High; requires approved fixtures and governance gates. |

## 14. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Evidence / disposition |
| --- | --- | --- | --- | --- |
| L1 | FACT | Extract offers Analyze plus eight typed endpoints; Event/List/Job are beta. | High | [S1–S10]; product boundary. |
| L2 | FACT | Standard calls fetch/render one target URL and return `request` + `objects[]`; supplied HTML is also accepted. | High | [S1–S10][S19]. |
| L3 | FACT | Analyze can misclassify; direct endpoints force schemas. | High | [S2]; **ADAPTED**. |
| L4 | FACT | Analyze's current enums omit Job despite a direct Job endpoint. | High | [S1][S2][S10][S31]; unresolved drift. |
| L5 | FACT | Extract sometimes caches based on opaque adaptive factors and returns no cache age/status. | High | [S22] plus negative contract inspection; provenance gap. |
| L6 | FACT | Article defaults to up to 20 pages; Discussion supports `maxPages=all`. | High | [S3][S7][S25]; unbounded mode **REJECTED**. |
| L7 | FACT | Custom APIs can override/delete fields, prefilter DOM, forward cookies/headers, and execute caller JavaScript. | High | [S13–S16][S27][S28]. |
| L8 | FACT | X-Evaluate can save `document.cookie`, and debug returns the full page console. | High | [S28]; privileged-risk finding. |
| L9 | FACT | One extraction costs one credit or two through the datacenter proxy; backend-global proxying can change cost. | High | [S17][S29][S30]. |
| L10 | FACT | Public errors conflate provider quota, origin access, rule failure, and generic internal failure. | High | [S32–S38]. |
| L11 | FACT | General field confidence, capture timestamps/hashes, extraction builds, and field anchors are absent. | High | Negative inspection of [S2–S16][S31]. |
| L12 | INFERENCE | Returned JSON is a semantic derivative, not an archival capture. | High | L2, L5, L11. |
| L13 | INFERENCE | Custom API is a tenant policy/execution plane, not only schema configuration. | High | L7–L8. |
| L14 | INFERENCE | Successful output cannot prove freshness or reproducibility. | High | L5, L11–L12. |
| L15 | RECOMMENDATION | Separate capture, classify, extract, normalize, and select evidence. | High | **ADOPTED** architecture. |
| L16 | RECOMMENDATION | Treat all outputs and URLs as inert untrusted evidence. | High | **ADOPTED** safety rule. |
| L17 | RECOMMENDATION | Hosted Diffbot may be a bounded comparator, never the owned foundation. | High | Foundation **REJECTED**; trial **DEFERRED**. |

## 15. Unknowns and future checks

### Material unknowns retained

1. Cache key, TTL, bypass, capture age, revalidation, cross-tenant reuse, and
   whether raw or derived artifacts are cached.
2. Browser/runtime, geographic fetch location, waits, subresource policy,
   cookies, renderer isolation, and actual `norender` behavior.
3. URL scheme/length, redirects, origin/decompressed/DOM/output limits, and
   private-address defenses.
4. Classifier and extractor accuracy/calibration by type, language, dynamic
   behavior, PDFs, malformed pages, and model update.
5. Field-level source precedence and confidence; semantics of Discussion's
   undocumented `confidence`.
6. `diffbotUri` stability under page changes, model changes, dedup merges, and
   custom overrides.
7. Analyze routing for Job and accepted `content`/`allContent`/`dom` fields when
   OpenAPI enums omit them.
8. Job `datePosted` versus `postedDate` runtime shape and other documentation
   drift.
9. Custom ruleset limits, version history, rollback/audit, rule-training use,
   secret storage, and output indication of manual overrides.
10. Comprehensive error taxonomy, retry safety, charge-on-failure, per-request
    billed credits, and proxy decision disclosure.
11. Extract-specific retention/deletion, model-improvement use, residency,
    security architecture, DPA/SLA, and enterprise controls.
12. Rights to retain or redistribute each contemplated field and origin payload
    for a specific corpus/use case.

### Approved future evaluation plan — not executed

Only after separate authority, use organization-owned/public-domain/explicitly
permitted fixtures and capped spend:

1. pin request/OpenAPI/adapter versions and test every endpoint, documented
   conflict, invalid input, and response cardinality;
2. compare static, rendered, delayed, supplied-HTML, redirect, PDF, and
   deterministic client-rendered fixtures without third-party probing;
3. revise fixtures over time to measure cache freshness and demand actual cache
   metadata rather than infer it from response content;
4. measure field precision/recall, classification calibration, normalized value
   fidelity, XPath/span reconstruction, and drift across versions;
5. test hard local rejection of private/signed URLs, oversize/decompression,
   malicious links/markup, prompt injection, and output limits before provider
   disclosure;
6. verify custom-rule versioning, conflicts, missing selectors, secret handling,
   and training/retention terms with vendor and legal owners; and
7. reconcile actual credits, proxying, paging, failures, latency, and retries.

## 16. Bounded curiosity pass

Scores are 1–5 for relevance (R), decision value (V), novelty (N), and cost (C,
lower is better); priority is `R + V + N - C`.

| Thread | R/V/N/C | Score | Action / result |
| --- | --- | ---: | --- |
| Cache freshness contract | 5/5/4/1 | 13 | **Pursued:** dedicated FAQ confirms adaptive caching but no request bypass, timestamp, or cache status [S22]. |
| Analyze/direct-endpoint drift | 5/4/4/1 | 12 | **Pursued:** overview, Analyze prose/enums, Job page, and OpenAPI conflict; Job routing remains unknown [S1][S2][S10][S31]. |
| Custom API as security/policy plane | 5/5/4/2 | 12 | **Pursued:** rules, headers, cookies, script, console, and training feedback materially expand authority [S13–S16][S27][S28]. |
| Active content retained in “normalized” output | 5/5/4/2 | 12 | **Pursued:** iframe/embed/SVG/tweet retention confirms normalization is not sanitization [S21]. |
| Stable comprehensive error/limit taxonomy | 5/4/3/2 | 10 | **Pursued:** official pages reveal overlapping/coarse errors and missing hard resource ceilings [S31–S38]. |
| Live free/testdrive extraction | 4/4/3/5 | 6 | **CURIOSITY_NO_GO:** caller prohibited calls; one-off output would not prove freshness, quality, or security. |
| Private-IP, redirect, login, anti-bot, or SSRF probing | 5/5/3/5 | 8 | **CURIOSITY_NO_GO:** unsafe and unauthorized; public unknowns retained. |
| Infer proprietary browser/model/cache vendors or algorithms | 2/2/3/5 | 2 | **CURIOSITY_NO_GO:** speculative, terms-sensitive, and irrelevant to transferable contracts. |
| Copy published ontology/rules into an implementation | 1/1/1/5 | -2 | **CURIOSITY_NO_GO:** violates clean-room purpose and no implementation authority exists. |
| Jurisdiction-specific legality of authenticated extraction | 4/5/3/5 | 7 | **CURIOSITY_NO_GO:** requires a corpus, authorization facts, jurisdiction, and counsel. |

**Stop condition reached:** coverage and saturation. Remaining high-value gaps
require authenticated fixture tests, vendor contractual disclosure, security
review, or legal authority. No autonomous follow-up is authorized by this
report.

## 17. Checks performed

- Read repository `AGENTS.md`; preserved provider-neutral and untrusted-data
  boundaries.
- Used Diffbot primary sources accessed 2026-08-17; no secondary claim is used
  as protocol evidence.
- Inspected public OpenAPI 1.1.0 without calling an API.
- Explicitly excluded Crawl, Bulk, and Knowledge Graph behavior; cross-product
  names appear only where a source itself distinguishes scope or returned IDs.
- Made no credentialed, paid, testdrive, dashboard, or target-page call.
- Retained contract contradictions and negative results instead of guessing.
- Wrote only `docs/research/products/diffbot-extract.md`.

## 18. Primary sources

All sources were accessed **2026-08-17**. Diffbot documentation is mutable;
prices and policies are point-in-time.

- **[S1]** Diffbot, [Extract API overview](https://www.diffbot.com/docs/extract/)
  — surface, render/classify model, authentication, base cost.
- **[S2]** Diffbot, [Analyze API](https://www.diffbot.com/docs/extract/analyze)
  — classification, mode/fallback, request and envelope.
- **[S3]** Diffbot, [Article API](https://www.diffbot.com/docs/extract/article)
  — Article fields, confidence controls, comments, paging, POST.
- **[S4]** Diffbot, [Product API](https://www.diffbot.com/docs/extract/product)
  — commerce fields, reviews, beta fields, request controls.
- **[S5]** Diffbot, [Image API](https://www.diffbot.com/docs/extract/image) —
  image objects, XPath, dimensions, embedded metadata.
- **[S6]** Diffbot, [Video API](https://www.diffbot.com/docs/extract/video) —
  media URL/embed/metadata contract.
- **[S7]** Diffbot, [Discussion API](https://www.diffbot.com/docs/extract/discussion)
  — post tree, paging, tags, confidence example.
- **[S8]** Diffbot, [Event API](https://www.diffbot.com/docs/extract/event) —
  beta scope, temporal/location schema and limits.
- **[S9]** Diffbot, [List API](https://www.diffbot.com/docs/extract/list) — beta
  one-page list contract.
- **[S10]** Diffbot, [Job API](https://www.diffbot.com/docs/extract/job) — beta
  job schema, confidence/salience, date-field conflict.
- **[S11]** Diffbot, [Optional Fields](https://www.diffbot.com/docs/extract/optional-fields)
  — links, metadata, visible text, rendered DOM.
- **[S12]** Diffbot, [Custom Headers](https://www.diffbot.com/docs/extract/custom-headers)
  — forwarding and persistent headers/cookies.
- **[S13]** Diffbot, [Custom API overview](https://www.diffbot.com/docs/custom-api/)
  — extension versus blank API and URL-pattern scope.
- **[S14]** Diffbot, [Extract with Custom API](https://www.diffbot.com/docs/custom-api/extract)
  — custom endpoint/envelope and training statement.
- **[S15]** Diffbot, [Custom API Rulesets](https://www.diffbot.com/docs/custom-api/rulesets)
  — rules, filters, prefilters, deletion and collections.
- **[S16]** Diffbot, [Custom API Selectors and Filters](https://www.diffbot.com/docs/custom-api/selectors)
  — supported CSS/XPath selector vocabulary.
- **[S17]** Diffbot, [Using Proxies](https://www.diffbot.com/docs/extract/using-proxies)
  — proxy controls, global proxy behavior and metering.
- **[S18]** Diffbot, [JavaScript execution FAQ](https://www.diffbot.com/docs/extract/faq/execute-javascript)
  — page JavaScript/Ajax behavior.
- **[S19]** Diffbot, [Extract Raw HTML](https://www.diffbot.com/docs/extract/extract-raw-html)
  — supplied HTML/text contract and asset dependency.
- **[S20]** Diffbot, [Redirect FAQ](https://www.diffbot.com/docs/extract/faq/follow-redirects)
  — redirect behavior and custom-rule precedence.
- **[S21]** Diffbot, [Normalized HTML Fields](https://www.diffbot.com/docs/extract/normalized-html-fields)
  — Article derivative markup and retained active structures.
- **[S22]** Diffbot, [Caching FAQ](https://www.diffbot.com/docs/extract/faq/caching)
  — adaptive cache factors and support-mediated bypass discussion.
- **[S23]** Diffbot, [Normalized Product Specifications](https://www.diffbot.com/docs/extract/normalized-product-specifications)
  — unit/value normalization contract.
- **[S24]** Diffbot, [Request duration FAQ](https://www.diffbot.com/docs/extract/faq/request-duration)
  — 180-second request and per-page fetch limits.
- **[S25]** Diffbot, [Multipage handling](https://www.diffbot.com/docs/extract/faq/multi-page-articles)
  — Article/Discussion expansion semantics.
- **[S26]** Diffbot, [Response-time guidance](https://www.diffbot.com/docs/extract/faq/response-times)
  — latency dependencies, `norender`, comments and paging.
- **[S27]** Diffbot, [Content behind logins](https://www.diffbot.com/docs/extract/faq/content-behind-logins)
  — forwarded and stored session cookies.
- **[S28]** Diffbot, [Custom JavaScript](https://www.diffbot.com/docs/extract/custom-javascript)
  — X-Evaluate lifecycle, DOM/save, cookie and console behavior.
- **[S29]** Diffbot, [Plans & Pricing](https://www.diffbot.com/pricing) — current
  plans, rates, credits and Extract unit costs.
- **[S30]** Diffbot, [Credits](https://www.diffbot.com/docs/credits) and
  [Rate Limits](https://www.diffbot.com/docs/rate-limits) — metering and plan
  throughput.
- **[S31]** Diffbot, [Extract OpenAPI 1.1.0](https://www.diffbot.com/openapi/extract.json)
  — machine-readable parameters, schemas and documented responses.
- **[S32]** Diffbot, [401 Not Authorized](https://www.diffbot.com/docs/extract/errors/401).
- **[S33]** Diffbot, [404 Could Not Download Page](https://www.diffbot.com/docs/extract/errors/404-could-not-download-page).
- **[S34]** Diffbot, [429 Too Many Requests](https://www.diffbot.com/docs/extract/errors/429).
- **[S35]** Diffbot, [457 Invalid API](https://www.diffbot.com/docs/extract/errors/457).
- **[S36]** Diffbot, [500 Site Too Many Requests](https://www.diffbot.com/docs/extract/errors/500-too-many-requests).
- **[S37]** Diffbot, [500 Unable to Apply Rules](https://www.diffbot.com/docs/extract/errors/500-unable-to-apply-rules).
- **[S38]** Diffbot, [Automatic Page Concatenation Timeout](https://www.diffbot.com/docs/extract/errors/automatic-page-concatenation-timeout).
- **[S39]** Diffbot, [Privacy Policy](https://www.diffbot.com/company/privacy),
  updated 2025-08-29 — Subscriber/API logs, data subjects, processors,
  transfers, security and retention statements.
- **[S40]** Diffbot, [Terms of Use](https://www.diffbot.com/company/terms) —
  service/output rights, restrictions, IP, data license and disclaimers.
- **[S41]** Diffbot, [GDPR/EU Data Laws](https://www.diffbot.com/docs/account-billing/gdpr)
  — vendor processor position, DPA and rights support.
- **[S42]** Diffbot, [PDF/document extraction FAQ](https://www.diffbot.com/docs/extract/faq/pdfs-and-documents)
  — direct Extract PDF support and quality caveat.

### Negative source results retained

- No independent reproducible evidence was generated for extraction accuracy,
  classification calibration, latency, freshness, or security.
- No public capture manifest, request-level cache evidence, field anchors, or
  immutable extractor/model/ruleset build was found.
- No complete stable error taxonomy or origin/input/output resource ceiling was
  found.
- No Extract-specific public threat model or detailed renderer/network isolation
  contract was found.
- No Extract-specific data-category retention/training schedule was found.
- No license was found that makes Diffbot's proprietary service, ontology text,
  rules, models, cache, or outputs project-owned or freely cloneable.
