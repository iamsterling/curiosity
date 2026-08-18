# Google Programmable Search Element: standalone UI/search surface

**Research date / primary-source access date:** 2026-08-17  
**Product boundary:** Google's browser-side **Programmable Search Element**
(`cse.js`), its hosted-result option, UI configuration, callbacks, result and
promotion objects, advertising variants, and operational envelope. The wider
Programmable Search Engine (PSE) control plane and Custom Search JSON API are
covered only where they determine this surface.  
**Method:** clean-room review of public Google documentation, Help Center
material, product announcements, terms, and privacy policy. No Google account,
engine, API key, billing project, browser execution, query, packet capture,
script download/decompilation, private material, or live deployment was used.
No Google result content was retained.

## Executive verdict

**REJECTED as Curiosity's UI or retrieval foundation; ADAPTED as a product-
surface precedent (high confidence).** The Element is a polished, low-code site
search appliance: one asynchronous remote script plus semantic placeholder
elements can provide a box, web/image results, refinements, promotions,
pagination, autocomplete, mobile styling, ads, and optional custom rendering.
It is not a local component library or neutral result API. Google owns the
script, serving path, crawl/index, base ranking, result markup, advertising,
privacy path, and lifecycle [S1-S5].

The surviving Standard Element is free, ad-supported, and documented with no
daily query limit. New engines are limited to 5,000 URL patterns across at most
50 domains. Existing whole-web Element engines may continue only through
**2027-01-01**, and disabling whole-web mode is irreversible. The ads-free Paid
Element costs **US$5 per 1,000 queries** but is closed to new customers;
qualifying nonprofit, education, and government sites can obtain an ads-free
client Element [S6-S10].

The transferable lessons are architectural:

1. offer a declarative default before an imperative API;
2. separate stable product concepts—query, corpus policy, presentation,
   promotions, and result classes—even when one widget renders them;
3. support explicit initialization and lifecycle hooks, but keep immutable
   request/result traces outside the UI;
4. distinguish operator promotions, organic results, and paid ads;
5. make URL-driven auto-execution, remote configuration, and third-party script
   loading visible security/privacy decisions; and
6. never make a remotely mutable provider widget the trust boundary for an
   evidence system or agent.

## 1. Decision frame and bounded questions

**Decision:** What should Curiosity learn from the Search Element as a
standalone user-facing search product while retaining an owned corpus,
provider-neutral contracts, evidence provenance, secure rendering, and bounded
agent authority?

Bounded sub-questions:

1. What is the embed, initialization, component, and page-override contract?
2. What UI, result, promotion, ad, pagination, and navigation behavior is
   documented?
3. How much control do callbacks and custom rendering actually provide?
4. How does the Element relate to the configured PSE, Google index, hosted
   results, Paid Element, and JSON API?
5. What privacy, browser-security, CSP, rights, terms, lifecycle, capacity, and
   support boundaries follow from embedding it?
6. Which ideas are adopted, adapted, rejected, or deferred for Curiosity?

Out of scope: proprietary ranking reconstruction, source-code analysis, live
quality/accessibility/latency testing, account-only Control Panel behavior,
advertiser economics, legal conclusions, procurement, or implementation.

Labels:

- **FACT** — directly stated by a cited primary source.
- **INFERENCE** — bounded architectural/security conclusion from cited facts.
- **RECOMMENDATION** — a Curiosity disposition.
- **UNKNOWN** — not established by the public sources reviewed.

Confidence is **high**, **medium**, or **low**. Documentation establishes an
offered contract, not measured runtime behavior or quality.

## 2. Product reconstruction

### 2.1 The Element is a remotely served product, not a local library

**FACT (high):** the minimal embedded form loads an asynchronous script from
`https://cse.google.com/cse.js?cx=<engine-id>` and places a
`<div class="gcse-search">` where Google renders a combined box and result area.
Google says components are rendered from settings stored on PSE servers, with
optional client-side overrides; server-side setting changes require no new
snippet [S1, S11].

```text
operator Control Panel / XML configuration
  -> PSE engine identity (`cx`) and server-side settings
  -> Google's crawl, index, rank, safety, ads, and serving systems
  -> remote `cse.js` executes in the publisher page
  -> placeholder discovery or explicit render
  -> query from input, URL, or JavaScript
  -> Google response -> promotions/results/ads -> Google or custom DOM
```

**INFERENCE (high):** `cx` is a public routing/configuration identifier, not a
secret credential. The script URL exposes it to every browser. Standard Element
access therefore cannot rely on secrecy of the engine ID. Paid Element is
different: existing customers associate a Cloud API key through the Control
Panel, but the reviewed public docs do not describe the browser transport or
key-protection mechanism [S1, S8].

**INFERENCE (high):** remote configuration and remote script delivery create two
independent change channels outside the publisher's application release. An
engine setting can change output without a code deploy, and Google can change
`cse.js` at a stable URL. That is convenient operationally but weakens release
reproducibility.

### 2.2 Component grammar

**FACT (high):** the declarative API recognizes four component forms [S1]:

| Element class | Product role |
| --- | --- |
| `gcse-search` | Combined search box and result block. |
| `gcse-searchbox` + `gcse-searchresults` | Paired two-column components. |
| `gcse-searchbox-only` | Standalone box, often forwarding to another page or Google-hosted results. |
| `gcse-searchresults-only` | Standalone result block driven by URL query or programmatic execution. |

Any number of valid elements may be placed on a page. A two-column instance
requires both components. `data-gname` gives a logical instance name and pairs
box/results components; absent a name, the script generates one based on DOM
order. If several components share a name, lookup returns the last one [S1].

**INFERENCE (high):** generated, order-derived names are suitable for simple
pages but brittle for automation, telemetry, and long-lived application state.
Curiosity UI instances should receive application-owned stable IDs.

### 2.3 Layout/product modes

**FACT (high):** the Control Panel and Element compose overlay, full-width,
compact/mobile, two-column, two-page, results-only, and Google-hosted experiences.
Two-page mode separates box and result pages through a configured result URL and
query parameter. Google-hosted mode leaves the box on the publisher site while
Google hosts results in the same or a new window. The earlier iframe-hosting
option is no longer supported [S1, S2].

**FACT (high):** compact is positioned for smartphones; `mobileLayout` can be
`enabled` for mobile devices, `disabled`, or `forced` for all devices. Current
and previous Chrome, Firefox, and Safari versions plus current Edge are the
documented browser envelope, and JavaScript must be enabled [S1, S12].

**UNKNOWN:** the public sources reviewed provide no accessibility conformance
report, WCAG claim, keyboard/screen-reader test matrix, no-JavaScript fallback,
print contract, or long-term DOM/CSS compatibility promise.

## 3. Configuration and execution contract

### 3.1 Server defaults, page attributes, and runtime API

**FACT (high):** configuration has three effective layers [S1, S2]:

1. engine-side Control Panel/XML settings;
2. per-component HTML `data-*` attributes that override those settings; and
3. imperative render-time `attributes` passed to the JavaScript API.

The reviewed docs do not define a serializable “effective configuration” export,
configuration version, or conflict diagnostic. The element object's `uiOptions`
exposes final render attributes at runtime, but not a server policy version [S1].

**RECOMMENDATION (high):** Curiosity should compute and retain one immutable,
schema-validated effective UI/search policy per request, including origin of
each override. Runtime introspection is not a substitute for an audit record.

### 3.2 Material attribute families

The complete spelling/value matrix belongs to Google's reference [S1]. The
product semantics are:

| Family | Documented controls | Architectural significance |
| --- | --- | --- |
| Identity/routing | `gname`, result URL, query-parameter name, new-window behavior | Binds components and transfers query state across pages. |
| Automatic behavior | auto-search on load (default `true`), browser history | A URL can trigger a provider query and change history without an explicit submit click. |
| Autocomplete | enablement, maximum suggestions/promotions, valid languages | Depends on engine enablement and can include promotions. |
| Refinement | default label, tabs versus links | Applies configured PSE labels; Google-hosted and image combinations have restrictions. |
| Modality | image enable/default/layout/result-set size; web disable | Web and image are separate callback and presentation channels. |
| Query shaping | site, file type, OR terms, rights, country/language, duplicate filter, sort | Page authors can narrow or bias the configured engine at render time. |
| Safety | web-only or web+image SafeSearch `off`/`active` | Explicit-content control, not a general trust verdict. |
| Result presentation | set size, order-by UI, link target, no-results text, mobile layout | Changes depth/navigation and visible representation. |
| Consent/ads | `ivt` | Controls invalid-traffic-only cookie/local-storage behavior by consent state. |

**FACT (high):** `webSearchResultSetSize` accepts integers from 1 through 20.
Named profiles include small (typically four), large (typically eight), and
`filtered_cse`, which requests up to ten per page and at most ten pages/100
results [S1]. This does not establish that every layout or engine can reliably
reach 100 results.

**FACT (high):** `linkTarget` defaults to `_blank` for result components. A
searchbox-only component's `newWindow` default is false. Those are distinct
navigation layers: where the result page opens versus where clicked hits open
[S1].

**FACT (high):** `autoSearchOnLoad` defaults to true, but only executes if the
configured query parameter appears in the current URL. Query input can otherwise
come from a user field or programmatic execution [S1].

**INFERENCE (high):** URL-driven execution can leak sensitive query text into
browser history, referrers, copied links, analytics, and server logs. It also
turns navigation into billable work for Paid Element. An evidence application
should default to explicit, bounded execution and deliberately choose whether a
query is shareable URL state.

### 3.3 Initialization modes and imperative object API

**FACT (high):** callbacks are registered in the global `window.__gcse` object
before `cse.js` starts. Later changes are ignored. `parsetags: "onload"` lets the
script parse/render automatically; `parsetags: "explicit"` leaves rendering to
the initialization callback [S1].

The static `google.search.cse.element` API provides [S1]:

- `render(config, optionalSecondConfig)` for one component or a paired
  two-column box/result set;
- `go(container?)` to render declarative tags in a container or page body;
- `getElement(gname)` to retrieve one object; and
- `getAllElements()` to retrieve a map keyed by `gname`.

An element object exposes `execute(query)`, `prefillQuery(query)`,
`getInputQuery()`, and `clearAllResults()`, plus `gname`, type, and `uiOptions`
[S1].

**INFERENCE (high):** the API cleanly separates prefill from execution and
supports deferred hydration. It does not expose cancellation, request IDs,
deadlines, retries, abort signals, pending state, response metadata, or a stable
cursor. Those omissions matter for bounded multi-request applications.

## 4. Search lifecycle and callback contract

### 4.1 Lifecycle

**FACT (high):** one initialization callback and three search-time callback
stages exist independently for web and image search [S1]:

```text
load cse.js
  -> initialization callback
  -> render element(s)
  -> starting(gname, query)
  -> Google request
  -> ready(gname, query, promotions, results, destinationDiv)
  -> standard rendering OR callback-owned rendering
  -> rendered(gname, query, promotionElements, resultElements)
  -> page-footer work
```

The `gname` joins callbacks to the page instance. The starting callback may
return a replacement query. An empty return is ignored and the prior query is
used. Mutating arguments themselves does not alter Element behavior [S1].

**RECOMMENDATION (high):** query rewrites should never be an invisible string
replacement. Curiosity should retain original input, normalized query, each
rewrite rule/version, resulting query plan, authorizer, and branch cost.

### 4.2 Results-ready: custom rendering boundary

**FACT (high):** immediately before standard rendering, `ready` receives arrays
of matched operator promotions and ordinary results plus an empty destination
`div`. Returning `true` tells the Element to display the callback-populated tree
and skip to footer work; otherwise Google performs normal result rendering [S1,
S13]. Google examples use this to build a simple table or replace the list with
a word cloud.

**FACT (high):** modifications to the callback's query, result, or promotion
arguments do not change the Element's own behavior. The callback must render its
own transformed view into the provided DOM node [S1].

**INFERENCE (high):** `ready` is a presentation escape hatch, not a documented
raw search transport. It provides the current visible batch, not pagination
metadata, an index snapshot, total count guarantee, rank score, request ID,
failure classification, or permission to store results.

### 4.3 Results-rendered: DOM augmentation boundary

**FACT (high):** `rendered` runs before footer rendering and receives DOM nodes
that the Element itself rendered for promotions and results. It can mutate those
nodes and has no return value. If `ready` performed all rendering, its custom
nodes are not passed as Google-rendered nodes [S1]. Google examples add controls,
change page labels/styles, alter link targets, and combine data saved from
`ready` with later DOM nodes [S1, S13].

**INFERENCE (high):** consumers that depend on undocumented `.gsc-*`/`.gs-*`
CSS classes or exact DOM trees are coupled to implementation details, even where
Google examples demonstrate them. The callback stage is documented; DOM shape
stability is not.

### 4.4 Callback result model

**FACT (high):** promotion objects can contain title, URL, visible URL, content,
and optional image dimensions/URL. Result objects may contain [S1]:

- formatted and no-format title/content;
- destination and visible URLs;
- file format;
- thumbnail information;
- image URL/dimensions and context page for image results;
- per-result refinement labels; and
- open-shaped `richSnippet` publisher structured data for web results.

No property is guaranteed present merely because it appears in the union-like
reference. Promotions and ordinary results are separate arrays [S1]. Paid ads
are **not** represented in the documented promotion/result callback schemas.

**FACT (high):** the callback result contract does not document a rank score,
rank reason, crawl/index time, canonicalization/redirect lineage, immutable
document version, content hash, snippet offset, parser version, rights proof,
policy reason, duplicate cluster, or index snapshot [S1].

**INFERENCE (high):** formatted title/content and `richSnippet` values cross a
publisher/provider trust boundary. Google examples use `innerHTML`, but the
reference does not state a sanitization guarantee suitable for Curiosity's
threat model. No-format fields reduce markup exposure but do not make URLs or
text trusted.

**RECOMMENDATION (high):** use plain text insertion, validate destination scheme
and host, sanitize any deliberately supported markup, attach `noopener`-style
navigation protections, and treat every title, snippet, URL, image, label, and
structured field as untrusted external data. Returned content cannot grant tool
authority or initiate a follow-up branch.

### 4.5 Missing lifecycle hooks

**UNKNOWN:** no official Element hook or schema was found for script-load
failure, request start/completion metadata, timeout, cancellation, retry,
transport status, quota denial, consent denial, ad failure, partial response,
zero-results-versus-error distinction, or unmount/disposal. No callback is
documented for pagination intent or autocomplete selection.

**RECOMMENDATION (high):** Curiosity UI state must make `idle`, `pending`,
`partial`, `empty`, `failed`, `cancelled`, and `budget_exhausted` distinct and
must use request IDs to suppress stale completion races.

## 5. Result, promotion, ad, and UI behavior

### 5.1 Organic results and pagination

**FACT (high):** the standard UI can render web and image tabs, refinements,
sorting options, result snippets, thumbnails/rich snippets where available, and
page-navigation “cursor” controls. The result set size depends on layout and
engine mode [S1-S3, S13].

**INFERENCE (high):** “result set size” is presentation/request depth, not a
coverage statement. The provider can return fewer results, and PSE can only
serve pages present in Google's index [S4]. No per-engine recall denominator or
missing-page reason is exposed.

### 5.2 Refinements and autocomplete

**FACT (high):** configured PSE refinement labels appear as tabs by default or,
for supported web/image combinations, links. A default refinement may be chosen,
except in Google-hosted layout [S1, S2]. Refinements are broader PSE policy
objects that can boost, filter, eliminate, or rewrite configured scopes; the
Element is their user-facing control [S14].

**FACT (high):** autocomplete must first be enabled server-side. Per-page
attributes can enable it, cap completions and autocomplete promotions, and limit
valid languages. Google says suggestions draw from covered-site phrases and
queries to the engine and can take hours to appear [S1, S2].

**RECOMMENDATION (high):** treat refinement, rewrite, rank preference, and
redirect as different typed actions. Autocomplete entries need origin, safety
review, version, and fan-out limits. Selecting either is user intent, not agent
authority to continue indefinitely.

### 5.3 Operator promotions

**FACT (high):** operator-authored promotions are a special result type and are
returned separately to `ready`. They may contain title, description/content,
link, visible URL, and image [S1, S2, S15]. They are distinct from paid ads.

**RECOMMENDATION (high):** Curiosity should retain explicit source classes:
`organic`, `operator_promotion`, `paid_ad`, `sponsored`, and `answer`. Promotions
must not enter organic relevance/evidence metrics and their links cannot be
followed automatically by an agent.

### 5.4 Advertising and branding

**FACT (high):** Standard Element is free and displays ads. PSE terms require the
operator to display advertising that Google includes on the result page or
associated elements. The Search Element supplies “Enhanced by Google” branding
automatically; Google's supplied Element/Attribution API are the only permitted
Google-branding mechanisms for this purpose [S5, S7, S16].

**FACT (high):** a publisher can create a new PSE search-engine ad unit in
AdSense and receive a share of revenue from contextually relevant ads clicked in
an Element deployed on the publisher's own site. Revenue is not shared for the
public engine URL, Google-hosted layout, or after users leave through “Search on
Google.” Monetization cannot be enabled on an existing PSE; a new AdSense search
engine must be created [S9].

**FACT (high):** callback schemas expose operator promotions and results, not ad
objects [S1]. **UNKNOWN:** the reviewed docs do not define callback ordering
relative to each ad unit, ad DOM stability, ad-blocker behavior, or whether a
custom `ready` renderer changes ad placement. Custom rendering must not be
interpreted as permission to suppress required ads, attribution, or notices
[S5].

**RECOMMENDATION (high):** paid placement is incompatible with Curiosity's
evidence ranking surface. Ads must remain outside evidence, citations,
evaluation, and automatic navigation.

## 6. Underlying engine, index, hosted page, and JSON API

### 6.1 Shared engine and provider-owned index

**FACT (high):** both Search Element and Custom Search JSON API address a
configured PSE. The engine controls sites/patterns, exclusions, labels, rank
preferences, refinements, promotions, structured-data conventions, image
search, and look-and-feel. PSE itself is built on Google's index; a configured
page absent from that index cannot appear [S3, S4].

**INFERENCE (high):** Element-side filters and callbacks do not move corpus or
ranking ownership to the publisher. They select and present a logical view over
Google's current provider state.

### 6.2 Element is not a wrapper contract for JSON API

**FACT (high):** Google documents these as separate surfaces [S3]:

| Dimension | Search Element | Custom Search JSON API |
| --- | --- | --- |
| Primary contract | Remote browser JavaScript + DOM components/callback objects | REST request/JSON response |
| Ordinary access | Engine ID in script URL; no Standard API key documented | API key/legacy customer access |
| Rendering | Google UI or callback-owned current batch | Consumer-owned UI |
| Ads | Standard Element displays ads | No ads in JSON result contract |
| Limits | No documented daily limit; UI result-set controls | 10,000 requests/day and first-100-result window for existing customers |
| Lifecycle | Sites-only Element survives | Closed to new customers and discontinues 2027-01-01 |

The Element callback object is not the JSON API `Search` schema: it lacks query
role metadata, estimated totals, timing, OpenSearch template, API pagination
objects, and several REST fields; it also exposes DOM lifecycle hooks [S1, S3].

**RECOMMENDATION (high):** never leak `cx`, Google callback objects, or Element
DOM classes into Curiosity's provider-neutral contract. A UI consumes typed
Curiosity results; it does not become the provider adapter.

### 6.3 Google-hosted result page

**FACT (high):** a box-only Element can route to a Google-hosted page or a
publisher result page. Google-hosted pages may include an operator logo; embedded
layouts cannot use that logo feature [S1, S2].

**INFERENCE (high):** Google-hosted mode minimizes publisher rendering work but
maximizes UX/navigation discontinuity and makes the result page wholly provider
controlled. It also does not qualify for AdSense revenue share [S9].

## 7. Privacy, security, and CSP

### 7.1 Query and browser-data path

**FACT (high):** PSE terms say end-user queries are forwarded to Google and
processed by Google's search engine. Google and subsidiaries may retain and use
information collected through the service under Google's Privacy Policy; the
terms incorporate Google's Ads Controller-Controller Data Protection Terms and
EU User Consent Policy [S5].

**FACT (high):** Google's policy says collected data can include search terms,
content/ad interactions, IP address, browser/device identifiers and settings,
request date/time and referrer, activity on third-party sites using Google
services, and location signals depending on product/settings. Uses include
service delivery, improvement/development, personalization, measurement,
advertising, security, and communication. Retention varies by data, purpose, and
settings; Google says information may be processed on servers worldwide [S17].

**INFERENCE (high):** merely embedding/loading a third-party Google script and
executing a query crosses a vendor boundary. Standard Element's zero direct
query fee does not make it privacy-neutral or first-party.

**UNKNOWN / review required:** no PSE-specific public source reviewed gives a
query-log retention period, processing region, deletion/export control,
tenant-isolation model, end-user account/browser linkage for every state, or a
complete controller allocation for a particular operator.

### 7.2 Consent and IVT storage

**FACT (high):** Google requires Standard Element partners serving EEA/UK users
to use a Google-certified CMP integrated with IAB Europe's TCF. Google says it
stopped personalized ads in that region from November 2023, with rollout through
February 2024 [S18].

**FACT (high):** the `ivt` Element attribute controls whether an invalid-
traffic-only cookie/local storage may be used on unconsented traffic. The
current reference says `true` limits that storage to consented traffic, while
`false` allows it on consented and unconsented traffic; default is `false`
[S1, S18]. The prose introducing the attribute is confusing, so operators should
follow the enumerated semantics and obtain legal/privacy review rather than
infer “true means more storage.”

**RECOMMENDATION (high):** consent state must be an explicit policy input, not a
UI afterthought. Curiosity should not use search widgets with ads/cross-site
storage on evidence surfaces. Any external provider query needs documented
purpose, data classes, region/retention, deletion, and no-sensitive-query policy.

### 7.3 Remote-script and DOM trust boundary

**FACT (high):** the documented embed executes remotely hosted JavaScript in the
publisher page and lets that script render and mutate page DOM. Callback code can
also mutate Google-rendered nodes and navigate to provider-returned URLs [S1].

**INFERENCE (high):** unlike a sandboxed cross-origin iframe, an ordinary
third-party `<script>` runs in the embedding document's JavaScript realm. It is
therefore a supply-chain dependency with access comparable to application code,
subject to browser/page controls. The now-retired iframe option is not an
available isolation boundary [S2].

**RECOMMENDATION (high):** do not load a remotely mutable provider script into
Curiosity's privileged agent, account, or evidence application. If a legacy
business site must use it, isolate it on a low-privilege origin with no secrets,
action credentials, sensitive DOM, service-worker scope over privileged apps,
or ambient authority; apply strict navigation and data-classification rules.

### 7.4 CSP, SRI, and documented security controls

**FACT (high):** Google's canonical snippet uses HTTPS and `async`; it does not
show a nonce, Content Security Policy, Subresource Integrity `integrity` value,
`crossorigin`, sandbox, Trusted Types integration, or a pinned script version
[S1].

**NEGATIVE RESULT:** no PSE-specific Google page was found in this bounded pass
that publishes a complete CSP directive/source allowlist, nonce/hash procedure,
SRI-supported immutable artifact, Trusted Types contract, resource-host
inventory, or security-update/change-notice policy for `cse.js`.

**INFERENCE (high):** a strict CSP integration cannot be safely specified from
the one-line snippet alone because the runtime may fetch additional scripts,
styles, images, frames, ads, or endpoints. A hash for a mutable remote script
would also not be a stable product contract unless Google published immutable
bytes. Exact runtime origins remain **UNKNOWN** because live execution/traffic
inspection was outside authority.

**RECOMMENDATION (high):** never weaken a privileged application's CSP with
broad Google wildcards or `unsafe-inline` merely to admit a widget. Require a
vendor-published resource inventory or isolate the widget. Preserve CSP
violation reporting, egress allowlists, URL sanitization, and an immediate kill
switch.

### 7.5 Safety is narrower than application trust

**FACT (high):** Element attributes can set SafeSearch to `off` or `active` for
web and image results [S1]. PSE documentation describes this as explicit-content
filtering, not malware, prompt injection, PII, hate/violence, legal, or general
agent safety [S19].

**RECOMMENDATION (high):** Curiosity requires independently versioned fetch,
index, retrieval, and render safety layers. Provider SafeSearch can be one input,
never a universal `safe=true` claim.

## 8. Lifecycle, limits, economics, support, and terms

### 8.1 Availability ledger on 2026-08-17

| Surface | Status | Material boundary |
| --- | --- | --- |
| Standard Search Element | **Available** | Free, ads, no documented daily limit, new engines limited to ≤50 domains [S6, S7]. |
| Qualifying nonprofit/education/government Element | **Available after verification** | Free, ads can be disabled, client Element only [S10]. |
| Paid Element | **Existing customers only** | Ads-free, $5/1,000 Element queries, Cloud billing/key/quota [S8]. |
| Existing whole-web Element | **Sunsetting** | Through 2027-01-01; turning it off is irreversible [S6]. |
| JSON API | **Separate and retiring** | Closed to new customers; discontinuation 2027-01-01 [S3, S20]. |

**CONTRADICTION / documentation drift:** the older general overview and Help
Center versions table still label Paid Element and JSON API available to
“Everyone.” Later product-specific notices say Paid Element and JSON API are
closed to new customers. The later, narrower pages control this report's status
ledger [S3, S7, S8, S20].

### 8.2 Limits and operational unknowns

| Boundary | Documented value |
| --- | ---: |
| Domains for a new sites-only engine | 50 [S6] |
| URL patterns / annotations per engine | 5,000 [S4, S6] |
| Web results requested per page | 1-20 [S1] |
| `filtered_cse` reachable profile | Up to 10/page × 10 pages = 100 [S1] |
| Standard/Nonprofit/Paid daily queries | No documented daily limit [S7] |
| Paid Element price | $5/1,000 queries [S8] |

**FACT (high):** Paid Element projects default to unlimited daily quota; Google
strongly recommends setting a daily limit. Per-minute and per-user-per-minute
quotas are available, with IP address distinguishing users. When the daily quota
is reached, engine queries are denied for the rest of the day. Dashboard and
Cloud Operations monitoring can expose QPS/error metrics and alerts [S8].

**FACT (high):** the PSE Control Panel also reports web/image query volume and
popular queries for selectable date ranges [S23]. The reviewed docs do not
describe a query-level export, callback correlation ID, configuration revision,
or privacy-preserving aggregation threshold for those statistics.

**UNKNOWN:** Standard Element QPS/burst limits, fair-use enforcement, timeout,
retry/backoff, free-tier monitoring, configuration propagation SLO, uptime SLA,
regional serving, total depth for every layout, and exact query-count definition
(for example retries, autocomplete, image tab, or repeated URL load) were not
established. Public support documentation points only to Help Center and
community, not a service SLA [S21].

**RECOMMENDATION (high):** “no daily limit” is not a capacity guarantee. Use
tenant/frame/branch budgets, deadline and retry caps, circuit breakers, and
explicit partial/failure states. Paid projects must fail bounded, not inherit an
unlimited spend default.

### 8.3 Terms and rights boundary

**FACT (high):** public PSE terms [S5]:

- require queries to originate from the configured site and permit Google to
  modify or terminate the service;
- prohibit modifying, truncating, filtering, reordering, or commingling results
  except as permitted by service documentation;
- prohibit automated/invalid query generation, reverse engineering, crawling,
  indexing, and non-transitory result storage/cache;
- prohibit constructing a substitute/similar service through access;
- require attribution and display of included advertising;
- disclaim completeness, uninterrupted/error-free operation, and inclusion of
  every configured domain; and
- grant Google a broad irrevocable, perpetual, worldwide, royalty-free license
  to operator-supplied metadata such as labels, attributes, URL associations,
  and display content through Google services.

**INFERENCE (high):** documented callbacks are the permissioned customization
surface, but they do not erase the surrounding restrictions. In particular,
custom rendering is not permission to remove ads/attribution, build a permanent
result database, or commingle provider hits into an unmarked meta-search list.

**UNKNOWN / legal review required:** application of automation language to a
specific interactive or agent workflow, legacy Paid Element contract terms,
and whether a particular custom renderer remains within all branding/ad rules.
This report is not legal advice.

## 9. Curiosity clean-room implications

### 9.1 Verdict ledger

| Element observation | Verdict | Curiosity disposition |
| --- | --- | --- |
| One semantic placeholder gives a complete search experience [S1] | **ADAPTED** | Provide a first-party declarative search component backed by neutral typed contracts. |
| Server defaults plus page overrides [S1] | **ADAPTED** | Layer policy deliberately, but emit one immutable effective configuration and override trace. |
| Explicit/onload initialization [S1] | **ADOPTED** | Support deferred, deterministic initialization without remote global queues. |
| `gname` pairs distributed components [S1] | **ADAPTED** | Stable application-owned instance IDs; never DOM-order-generated operational identity. |
| Prefill and execute are separate [S1] | **ADOPTED** | Draft query state must not spend budget until explicit execution. |
| URL query can auto-run on load [S1] | **REJECTED as default** | Explicit opt-in with privacy, replay, and cost semantics. |
| Starting/ready/rendered lifecycle [S1] | **ADAPTED** | Typed pre-query, result-transform, and post-render hooks with request IDs, cancellation, and bounded authority. |
| Ready callback can replace result presentation [S1, S13] | **ADAPTED** | First-party renderers consume sanitized plain typed data; transformations are versioned and auditable. |
| Promotions are separate objects [S1] | **ADOPTED** | Preserve organic/operator/paid/answer source classes. |
| Ads finance free serving [S7, S9] | **REJECTED** | No ads in evidence ranking or agent navigation. |
| Remote script and server config can change independently [S1] | **REJECTED as core** | Pin first-party releases and policy versions; providers remain behind adapters. |
| Callback data omits evidence/rank provenance [S1] | **REJECTED schema** | Return capture/passage identity, hashes, offsets, policy/rank versions, reasons, and warnings. |
| PSE is a view over Google's index [S4] | **REJECTED foundation** | Own crawl/index state and measurable coverage. |
| Standard Element has no documented daily cap [S7] | **ADAPTED lesson** | Advertised limit absence never replaces explicit internal budgets/capacity evidence. |
| Whole-web/Paid/API lifecycle contraction [S6, S8, S20] | **ADOPTED risk lesson** | Lifecycle ledger, shadow path, exportability, and provider-removal drills. |
| Terms bar non-transitory result storage/indexing [S5] | **REJECTED data source** | Acquire source content independently under explicit rights/policy. |
| CSP/resource contract is unpublished | **REJECTED for privileged origin** | No broad CSP weakening; isolate or do not embed. |
| Legacy Paid Element integration | **DEFERRED** | Only for an authorized existing customer with contract/security/procurement review. |

### 9.2 Provider-neutral UI contract

Do not reproduce Google field names, DOM classes, callback globals, examples, or
proprietary behavior. Independently model:

```text
search_surface_id + request_id + caller/frame budget
original_query + visible rewrite trace + corpus_policy_version
locale/document language/geographic intent + safety_policy_version
pending|partial|empty|failed|cancelled|complete
organic hits + operator promotions + ads (normally prohibited)
immutable evidence lineage + bounded rank reasons
coverage/freshness/policy/partial-failure warnings
render_policy_version + accessibility telemetry
```

A hit should point to an owned immutable capture and passage, not a mutable
provider snippet. UI rendering, sanitization, accessibility, cancellation,
telemetry, and error handling stay first-party.

### 9.3 Bounded agent authority

Search output is untrusted evidence. It cannot:

- create a new research frame;
- execute a refinement, rewrite, promotion, or result link automatically;
- spend beyond caller and branch budgets;
- grant action tools or credentials;
- alter corpus/rank/safety policy; or
- approve its own policy exception.

A post-synthesis curiosity pass may score only in-frame gaps. Execution requires
declared caller authority; rejected branches remain recorded as
`CURIOSITY_NO_GO`.

## 10. Unknowns, contradictions, and negative results

### Material unknowns

1. Exact runtime network/resource origin inventory, headers, cookies, frames,
   cache behavior, and CSP requirements.
2. Script versioning, rollout rings, backward-compatibility window, rollback,
   security advisory, and release-notice process.
3. Failure, cancellation, timeout, stale-response, retry, and quota-denial
   semantics in the browser API.
4. Accessibility conformance and measured keyboard/screen-reader/mobile behavior.
5. Standard Element QPS/burst/fair-use limits, uptime/latency SLO, and support SLA.
6. Exact result depth and pagination behavior across every layout/engine mode.
7. Ad lifecycle relative to callbacks and custom rendering; ad-blocker behavior.
8. PSE-specific query retention, account/browser linkage, deletion/export, and
   data-region controls.
9. Configuration propagation time, immutable revision identity, audit history,
   and rollback in the live Control Panel.
10. Runtime sanitization guarantees for formatted callback fields and structured
    data.

### Documentation contradictions/drift

- General offering tables say Paid Element and JSON API are available to
  everyone; later product-specific pages close both to new customers [S3, S7,
  S8, S20].
- The `ivt` prose is easy to misread: the enumerated contract makes `true` the
  consented-traffic-only setting and default `false` the consented-plus-
  unconsented setting [S1, S18].
- Terms broadly prohibit result modification, while the Control API expressly
  provides custom-render and DOM-mutation callbacks. Treat only documented
  callbacks as the permitted customization channel and retain all ad/branding/
  storage restrictions [S1, S5].

### Negative results retained

- No official PSE-specific CSP/SRI/Trusted Types integration guide or immutable
  `cse.js` artifact was found.
- No load/error/cancel/dispose callback or typed browser error schema was found.
- No documented result-level score, rank reason, crawl/index time, document
  version/hash, snippet offset, canonical lineage, or index snapshot was found.
- No callback ad-object schema was found.
- No public Element relevance, recall, freshness, latency, availability,
  accessibility, or safety benchmark for Curiosity workloads was found.
- No public source established permission to persist Element results into an
  owned index; standard terms prohibit it.
- No live engine or script was executed, so undocumented DOM, requests, origins,
  cookies, headers, errors, and rendering behavior were not inferred.

## 11. Verification checks

| Check | Primary-source triangulation | Outcome |
| --- | --- | --- |
| Embed/component contract | Control API + add-to-site + UI guide [S1, S2, S11] | Confirmed async script, placeholders, layouts, server settings, overrides. |
| Callback/result contract | Control API + callback examples [S1, S13] | Confirmed stages, custom rendering, DOM mutation, result/promotion fields and omissions. |
| Underlying engine/index | overview + annotations [S3, S4] | Confirmed shared PSE configuration and Google-index dependence. |
| Ads/branding | versions, terms, AdSense, branding [S5, S7, S9, S16] | Confirmed Standard ads, separate promotions, revenue scope, attribution obligations. |
| Current lifecycle | sites page, Paid page, JSON overview, announcement [S6, S8, S20, S22] | Confirmed surviving sites-only Element, Paid closure, whole-web/API 2027 transition. |
| Privacy/consent | terms, privacy policy, consent page, Element `ivt` [S1, S5, S17, S18] | Confirmed query transfer and broad processing; retained product-specific unknowns. |
| Security/CSP | canonical snippets + UI/Element docs [S1, S2, S11] | Confirmed remote script/no iframe; no official CSP/SRI contract found. |
| Support/capacity | Paid quotas + support page + versions [S7, S8, S21] | Confirmed stated limits/monitoring; no free SLA/QPS contract. |
| Access boundary | research log | Public pages only; no account, credentials, calls, download, execution, or private data. |

## 12. Bounded curiosity pass and stop decision

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Rel. | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Distinguish Element callback objects from JSON API | 5 | 5 | 4 | 1 | **Pursued:** official pages establish separate DOM and REST contracts [S1, S3]. |
| Verify custom-render boundary versus terms | 5 | 5 | 4 | 2 | **Pursued:** callbacks explicitly permit replacement rendering, but terms retain ads/branding/storage restrictions [S1, S5]. |
| Find PSE-specific CSP/SRI guidance | 5 | 5 | 4 | 2 | **Pursued, negative:** no official guide/artifact found; exact runtime resource set remains unknown. |
| Resolve `ivt` semantics | 5 | 4 | 4 | 1 | **Pursued:** Element reference and consent page agree on enumerated behavior despite confusing prose [S1, S18]. |
| Execute widget and capture network/DOM/cookies | 5 | 4 | 4 | 5 | `CURIOSITY_NO_GO`: user prohibited live execution; would require engine/account and a security test protocol. |
| Download/minify/decompile `cse.js` | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: terms and clean-room boundary prohibit reverse engineering; unnecessary for product lessons. |
| Test accessibility across browsers | 4 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: requires live engine, assistive-tech matrix, and separate benchmark authority. |
| Determine whether custom rendering can remove ads | 4 | 3 | 3 | 5 | `CURIOSITY_NO_GO`: contractual interpretation plus live ad behavior; docs do not grant this permission. |
| Create Paid project to inspect key transport/quota errors | 3 | 3 | 4 | 5 | `CURIOSITY_NO_GO`: closed to new customers and credentials/billing prohibited. |
| Give definitive agent-use legal opinion | 4 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: requires counsel and complete customer agreement. |

**Stop:** coverage and saturation reached for embed/configuration, layouts,
results/ads/UI, callbacks/custom rendering, PSE/index/API relationship,
privacy/security/CSP, lifecycle/limits/pricing/terms, and Curiosity transfer.
Remaining high-value gaps require prohibited runtime, credentials, commercial
access, accessibility testing, or legal authority. Follow-up execution requires
a new caller-declared frame.

## 13. Primary-source ledger

All sources are Google primary sources accessed 2026-08-17. Update dates are
included where shown and material.

| ID | Primary source | Use / confidence |
| --- | --- | --- |
| **S1** | Google, **Programmable Search Element Control API**, updated 2026-02-10. https://developers.google.com/custom-search/docs/element | Embed, attributes, callbacks, object API, result/promotion schemas. **High** for documented contract; runtime untested. |
| **S2** | Google, **Search UI Components**, updated 2026-01-20. https://developers.google.com/custom-search/docs/ui | Layouts, styling, hosted mode, iframe retirement. **High**. |
| **S3** | Google, **Programmable Search Engine overview**, updated 2024-08-21. https://developers.google.com/custom-search/docs/overview | Product/API relationship and capabilities. **Medium-high**; availability table is stale. |
| **S4** | Google, **Annotations: Defining Sites to Search**, updated 2024-08-21. https://developers.google.com/custom-search/docs/annotations | Google-index dependence and configuration bounds. **High**. |
| **S5** | Google, **PSE Terms of Service**. https://support.google.com/programmable-search/answer/1714300 | Query path, ads/attribution, restrictions, metadata license, privacy, lifecycle. **High** as public terms; interpretation requires counsel. |
| **S6** | Google, **Update sites in your search engine**. https://support.google.com/programmable-search/answer/12397162 | 50 domains, 5,000 patterns, whole-web sunset and irreversible opt-out. **High**. |
| **S7** | Google, **PSE Versions**. https://support.google.com/programmable-search/answer/9069107 | Element price/ads/query-limit comparison. **Medium**; Paid/JSON availability rows are stale. |
| **S8** | Google, **Programmable Search Element Paid API**, updated 2026-01-30. https://developers.google.com/custom-search/docs/paid_element | Closure, price, key/billing, quotas, monitoring. **High**. |
| **S9** | Google, **PSE AdSense Monetization**. https://support.google.com/programmable-search/answer/13315956 | Ad behavior, revenue-sharing scope, new-engine requirement. **High**. |
| **S10** | Google, **Information for non-profits**. https://support.google.com/programmable-search/answer/12423873 | Qualifying ads-free client Element. **High**. |
| **S11** | Google, **Add PSE to your site**. https://support.google.com/programmable-search/answer/12423533 | Canonical placement/snippet workflow and layout implementation. **High**. |
| **S12** | Google, **Supported browsers**. https://support.google.com/programmable-search/answer/4542173 | Browser/JavaScript envelope. **High**, narrow. |
| **S13** | Google, **More Search Element Callback Examples**, updated 2024-08-21. https://developers.google.com/custom-search/docs/more_examples | Demonstrated callback mutation/custom rendering. **Medium-high**; examples do not guarantee DOM stability or security posture. |
| **S14** | Google, **Refining Searches**, updated 2024-08-21. https://developers.google.com/custom-search/docs/refinements | Refinement semantics behind UI controls. **High**. |
| **S15** | Google, **Promotions**, updated 2024-08-21. https://developers.google.com/custom-search/docs/promotions | Operator-promotion identity and behavior. **High**. |
| **S16** | Google, **PSE Branding Guidelines**. https://support.google.com/programmable-search/answer/10026723 | Automatic attribution and allowed branding mechanism. **High**. |
| **S17** | Google, **Privacy Policy**, effective 2026-05-26. https://policies.google.com/privacy | General collection, use, retention classes, global processing. **High** as general policy; not PSE-specific retention. |
| **S18** | Google, **Managing consent on sites linked to your engine**. https://support.google.com/programmable-search/answer/14545993 | EEA/UK CMP, IVT, personalized-ad transition. **High**. |
| **S19** | Google, **Enable SafeSearch**. https://support.google.com/programmable-search/answer/12423678 | Explicit-content scope. **High**, narrow. |
| **S20** | Google, **Custom Search JSON API overview**, updated 2026-02-18. https://developers.google.com/custom-search/v1/overview | Separate API closure/date/limits. **High**. |
| **S21** | Google, **PSE Support**, updated 2024-08-21. https://developers.google.com/custom-search/docs/support | Help Center/community path; no SLA claim. **High**, narrow. |
| **S22** | Google PSE Blog, **Updates to our Web Search Products & Programmable Search Engine Capabilities**, 2026-01-20. https://programmablesearchengine.googleblog.com/2026/01/updates-to-our-web-search-products.html | Original transition announcement and product-path distinction. **High**. |
| **S23** | Google, **Statistics**. https://support.google.com/programmable-search/answer/13595016 | Aggregate web/image volume and popular-query visibility. **High**, narrow. |

### Overall confidence

- **High:** embed grammar, initialization/callback stages, documented attribute
  families, result/promotion schema, Standard ads, Paid price/closure, current
  sites-only envelope, query transfer, and public terms.
- **Medium-high:** behavior of callbacks and older advanced features in every
  current layout; official docs are direct but no runtime test was authorized.
- **Low / unknown:** CSP resource inventory, runtime failures/cookies/DOM,
  accessibility, capacity/SLA, PSE-specific retention, ad/custom-render
  interaction, and post-2027 runtime mechanics.
