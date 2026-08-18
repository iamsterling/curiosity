# Oxylabs scraping, crawling, and unblocking: clean-room dossier

**Access date:** 2026-08-17  
**Scope:** public Oxylabs Web Scraper API, Web Unblocker, AI Studio AI-Crawler/
AI-Map, and the proxy layers that explain their observable behavior.  
**Status:** research evidence and recommendations; not implementation,
procurement approval, legal advice, or a service-quality benchmark.

## Executive verdict

Oxylabs exposes three materially different abstractions. **Web Scraper API** is
a managed fetch/render/parse job service with synchronous, asynchronous, and
proxy-shaped ingress. **Web Unblocker** is a stateful, proxy-shaped access layer
that chooses proxy, headers, cookies, fingerprints, retries, rendering, and
CAPTCHA handling behind one entry node. **AI-Crawler/AI-Map** add prompt-guided
within-site discovery and extraction, but publish a much thinner contract than
the scraper API. Beneath these are rotating residential/mobile pools and
static/rotating ISP and datacenter products [S1-S12].

**Decision for Curiosity — ADAPT observable contracts, DEFER the provider
(high confidence).** Adapt the separation of fetch, render, parse, scheduling,
and delivery; explicit job IDs/status; raw/parsed/Markdown alternatives;
timestamps; parser warning codes; bounded batch and source limits; and
result-level source URLs. Do not reproduce anti-bot evasion or make an
unblocking product the policy authority. Reject TLS-verification disabling,
opaque retries as provenance, treating a `2xx`/`4xx` as semantic success, and
passing arbitrary agent headers/cookies/URLs directly to a privileged proxy.
Defer an Oxylabs adapter until legal/procurement review, contractual payload
retention and subprocessors, endpoint egress controls, callback authenticity,
freshness/cache semantics, and empirical quality are resolved.

The strongest lesson is architectural rather than vendor-specific: a hosted
unblocker can improve *delivery*, but it cannot establish source truth,
permission, freshness, completeness, or evidence provenance. Curiosity should
retain those responsibilities in a provider-neutral control and evidence plane.

## 1. Frame, questions, and method

### 1.1 Bounded questions

1. What are the request, job, callback, retrieval, and output contracts?
2. How are rendering, browser actions, parsing, crawl discovery, and geo/session
   controls represented?
3. What do public sources disclose about proxy/unblocking layers and retries?
4. What is known about cache, freshness, timestamps, and provenance—and what is
   conspicuously absent?
5. What limits, billing units, privacy, legal, and safety constraints matter?
6. Which internal boundaries can be inferred without claiming undisclosed
   implementation?
7. Which patterns should Curiosity adopt, adapt, reject, or defer?

**Evidence policy.** Official documentation, pricing, policies, and trust pages
are primary evidence of what Oxylabs represents, not independent proof of
quality, consent, compliance, pool size, or certification scope. All web sources
were accessed 2026-08-17. No credentials, free trial, paid call, endpoint probe,
target bypass, source/SDK inspection, or benchmark was used. Public examples are
described, not executed. This is clean-room behavioral analysis; no vendor code,
schema, or data is imported.

Labels used below:

- **FACT** — directly stated or shown in a cited first-party source.
- **INFERENCE** — a bounded explanation consistent with facts, not a confirmed
  internal design.
- **RECOMMENDATION** — a proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

### 1.2 Product boundary

| Product | Observable abstraction | Boundary |
| --- | --- | --- |
| Web Scraper API | Managed jobs: acquire, optionally render, parse, schedule, and deliver | The richest auditable API contract; dedicated target parsers plus `universal` URL fetch [S1-S7]. |
| Web Unblocker | Forward-proxy interface with managed access logic | Returns target response/body and headers; parsing and durable job retrieval are not its core contract [S8-S11]. |
| AI-Crawler | Prompt-guided crawl and extraction | Returns Markdown or schema-shaped JSON from selected pages; operational job/error contract is sparsely documented [S12-S14]. |
| AI-Map | Prompt-guided URL discovery | Finds relevant URLs; does not itself extract page records [S13-S14]. |
| Proxy products | Network egress primitives | Residential/mobile rotate by default; ISP/datacenter emphasize stable or controlled IPs [S15-S19]. |

## 2. Web Scraper API contract

### 2.1 Three ingress modes

**FACT (high):** all documented API examples use HTTP Basic authentication with
API-user credentials distinct from the dashboard login [S1-S4].

| Mode | Submission and lifecycle | Output / important bound |
| --- | --- | --- |
| Realtime | `POST https://realtime.oxylabs.io/v1/queries`; JSON body; caller holds connection open | Synchronous JSON `results[]`. Rendering guidance says allow a 180-second client timeout [S2][S5]. |
| Push-Pull | `POST https://data.oxylabs.io/v1/queries`; optional callback/cloud storage; poll `GET /v1/queries/{id}` | Async metadata then `GET /{id}/results[?type=...]`. Results remain retrievable for **at least 24 hours** after completion [S3]. |
| Proxy Endpoint | HTTPS proxy at `realtime.oxylabs.io:60000`; URL is the target and options are `x-oxylabs-*` headers | Open-connection target content. URL-based sources only; fewer parameters; docs tell clients to accept/ignore the proxy certificate [S4]. |

**FACT (high):** the common input includes required `source`, then `url` or
source-specific `query`; optional `geo_location`, `render`, `parse`, session and
HTTP-context controls. `universal` targets a supplied public URL. Dedicated
sources model search/e-commerce entities and can supply provider-maintained
parsers [S1][S6]. Custom headers/cookies are nested in `context`, with
`force_headers`/`force_cookies`; `universal` defaults to GET and represents a
target POST body as Base64 content [S20].

**RECOMMENDATION (high):** Curiosity should never expose this vendor payload as
its agent ABI. Normalize to a provider-neutral fetch request, reject private/
link-local/control-plane destinations before adapter selection, cap redirects,
body, render time, browser actions, and callback/storage destinations, and keep
credentials entirely in the adapter.

### 2.2 Async job and callback contract

**FACT (high):** a Push-Pull submission returns the submitted parameters plus
`id`, `created_at`, `updated_at`, status, and hypermedia-like `_links` for job
metadata and results. Documented states are `pending`, `done`, and `faulted`.
`GET /v1/queries/{id}` checks state; `GET /{id}/results` retrieves content.
Callbacks are POSTed after completion and contain job metadata/result links.
Oxylabs exposes `GET /v1/info/callbacker_ips` so clients can obtain notifier IPs
for allowlisting [S3].

**FACT (high):** batch submission is `POST /v1/queries/batch`, accepts up to
**5,000** `url` or `query` values, creates one independent job/ID per value, and
requires all non-list parameters to be singular. A callback is emitted per job,
not once for the batch [S3].

**INFERENCE (high):** callbacks are completion hints, not result delivery or an
exactly-once transaction. The public page documents source-IP discovery but not
a callback signature, nonce, replay window, delivery retry schedule, ordering,
or idempotency key. Consumers therefore must authenticate result retrieval,
deduplicate by job ID, distrust callback URLs from the payload, and reconcile by
polling after missed/duplicate callbacks.

**Unknown:** cancellation, client idempotency, queue priority guarantees,
callback retry semantics, maximum result bytes, hard job deadline, job deletion
API, and whether “at least 24 hours” has a maximum retention period.

### 2.3 Output and status semantics

**FACT (high):** a result record normally includes `content`, `created_at`,
`updated_at`, `page`, final/result `url`, `job_id`, and target `status_code`.
Other observed fields include `type`, parser metadata, forced-render flag, and
browser warnings. Content can be raw/rendered HTML, structured JSON, Base64 PNG,
captured Fetch/XHR, or Markdown. Push-Pull supports `type=raw`, `parsed`, `png`,
`xhr`, `markdown`, and comma-separated multi-format retrieval; Realtime always
returns a default form but supports selected multi-format retrieval [S2-S3][S21].

**FACT (high):** API transport/job codes and target result codes are distinct.
API `202` means accepted and `204` means a requested job is unfinished. `612`
and `613` represent internal/final-retry faults. Parser status `12000` means
success; `12004`/`12005` partial success; `12002`, `12006`, and `12008` failure;
`12007` explicitly has unknown quality. A Custom Parser selector miss can return
billable `12005` with null fields and `_warnings` [S6-S7].

**RECOMMENDATION (high):** preserve four separate outcomes:
`transport_outcome`, `provider_job_outcome`, `origin_http_outcome`, and
`extraction_outcome`. A provider “done,” origin `200`, and parser `12000` are
different claims. Store warnings and null/missing distinction; never collapse
them into one success boolean.

## 3. Rendering, interaction, and extraction

### 3.1 Rendering and browser instructions

**FACT (high):** `render: html` returns a browser-rendered DOM; `render: png`
returns a Base64 screenshot. Oxylabs warns rendering is slower, consumes more
traffic, and may be forced automatically for certain pages unless the caller
sets an empty render value. It says unnecessary assets are not loaded to reduce
traffic [S5].

**FACT (high):** Web Scraper API browser instructions require rendering and
support `click`, `input`, `scroll`, `scroll_to_bottom`, `wait`,
`wait_for_element`, and terminal `fetch_resource`. Selectors can be XPath, CSS,
or text. Per-action `timeout_s` and `wait_time_s` are bounded above at 60 seconds;
`on_error` is `error` or `skip`; malformed instructions return `400`. Execution
problems appear as `browser_instructions_error` or warnings [S5].

**INFERENCE (medium):** “does not load unnecessary assets” means rendered output
is not a byte-faithful browser capture and could differ from an ordinary browser.
`fetch_resource` returning the first regex-matching network resource also makes
selection order-sensitive. Neither should be called canonical evidence without
the original URL, acquisition parameters, timestamps, and content digest.

### 3.2 Extraction layers

**FACT (high):** three parser paths are observable: dedicated parsers enabled by
`parse: true` on supported targets; client-authored CSS/XPath function pipelines;
and generated instructions/presets produced by OxyCopilot or a prompt endpoint.
Preset outputs identify `parser_type` and `parser_preset`. Custom pipelines are
ordered transformations and can expose field-level warnings [S1][S6].

**FACT (high):** Markdown is an optional transformed representation, enabled by
`markdown: true`; it is described for LLM/RAG ingestion and returns a Markdown
string, not original HTML [S21]. XHR capture and `fetch_resource` expose network
responses observed during render [S2][S5].

**RECOMMENDATION (high):** keep immutable acquisition bytes (where policy
allows), normalized document, Markdown, parser output, screenshot, and network
capture as separate artifacts linked by derivation edges. Record parser kind,
preset/instruction version or digest, render mode, warning codes, and schema.
Generated parser output is untrusted external data, not validated fact.

## 4. AI-Crawler and AI-Map

**FACT (high):** AI-Crawler takes starting `url` and `user_prompt`; optional
`output_format` (`markdown` default or `json`), OpenAPI-style schema required for
JSON, `render_javascript` (default false), `return_sources_limit` (documented
default 25), and ISO2 `geo_location`. The shown JSON output is a list of
`{data, src}` records. AI-Map takes a URL/domain and prompt and returns matching
URLs; public docs distinguish Map (find pages) from Crawler (extract pages)
[S12-S14].

**FACT (high):** AI Studio pricing starts at $12/month for 3,000 credits and 1
request/s. Crawl accounting lists one credit per non-JS scrape, four per JS
scrape, free Markdown output, four for parsed JSON, ten for prompt processing,
and one for schema generation. Credits do not roll over and access pauses when
they are exhausted [S14].

**Unknown (high relevance):** the public crawler page does not define crawl
depth, page/byte/time ceilings, same-origin/subdomain rules, URL canonicalization,
robots behavior, sitemap use, link frontier ordering, deduplication, retries,
job IDs, partial failure records, crawl timestamps, content hashes, cache policy,
or how `return_sources_limit` constrains pages explored versus records returned.
The AI-Map page says users can configure mapping depth but its parameter table
does not expose a depth field—an unresolved documentation contradiction [S12-S13].

**RECOMMENDATION (high):** do not make prompt-guided crawling Curiosity's crawl
foundation. A crawler contract needs deterministic policy bounds and a per-URL
ledger before semantic prioritization. AI selection can rank an already bounded
frontier, but it must not decide scope, robots/legal permission, or silent
omission.

## 5. Proxy and unblocking infrastructure

### 5.1 Observable proxy layers

| Layer | Public behavior | Curiosity significance |
| --- | --- | --- |
| Residential | Real ISP-addressed devices; backconnect endpoint; new IP by default; country/city and finer geo controls; HTTP/HTTPS/HTTP3/SOCKS5 [S15-S16]. | Broad/localized exit supply, but dynamic identity and third-party device path increase governance and evidence variance. |
| Mobile | Real mobile ISP/device addresses on 3G/4G/5G; same rotating backconnect pattern [S17]. | Highest-cost/specialized path; no default Curiosity need. |
| ISP | ASN-provider addresses, advertised stable/unlimited-duration sessions and bandwidth [S18]. | Stability layer between residential identity and datacenter operation. |
| Datacenter | Oxylabs-hosted/allocated proxy users; rotating endpoint and specific-IP controls [S19]. | Cheaper/stabler baseline when target permits. |
| Web Unblocker | One HTTPS proxy endpoint that manages proxy choice, headers, cookies, sessions, fingerprinting, retries, CAPTCHA and optional render [S8-S11]. | Managed policy-and-execution bundle; opaque choices must be surfaced as uncertainty. |

**FACT (high):** residential sessions use a session ID in credentials. Default
life is 10 minutes or 60 seconds idle; `sesstime` can request up to 1,440 minutes
but the dynamic exit may disappear earlier. Ordinary `sessid` rotates to a new
exit if one disappears; `sessid_oneip` fails with `502` instead. Web Unblocker
session IDs retain an assigned proxy for up to 10 minutes [S9][S16].

**FACT (high):** Web Scraper API and Unblocker expose geo intent separately from
content/search localization. Scraper `geo_location` selects proxy location but
SERP and e-commerce localization can behave differently. Residential/mobile
products encode country, city, state, ZIP, coordinates, ASN, OS, and IP-version
filters in credentials or headers depending on product [S8][S15].

**INFERENCE (medium):** a plausible clean-room decomposition is:

```text
authenticated ingress
  -> validation/account quota
  -> target policy + restricted-target gate
  -> acquisition planner
       -> exit-pool/geo/session selector
       -> request fingerprint/cookie/header policy
       -> retry and success classifier
       -> optional remote browser/action runner
  -> raw result store
  -> optional parser/format transformer
  -> realtime response | job store/callback | customer cloud upload
```

This follows separate endpoints, statuses, rate classes, storage delivery, and
output stages; it does **not** establish service topology, algorithms, vendors,
or that “AI-powered” denotes a particular model [S2-S11].

### 5.2 Unblocker wire behavior and hazards

**FACT (high):** Web Unblocker is used as `unblock.oxylabs.io:60000`. By default
it chooses standard headers and a fast proxy. Headers control geo, session,
forced caller headers/cookies, accepted origin status codes, and HTML/PNG render.
It may retry until it considers a response successful; `550` means it faulted
after multiple retries. Responses can include `X-Job-Id`, `X-Session-Id`, origin
headers/cookies/body, and `X-Oxylabs-Final-Url` after redirects [S8][S10][S22].

**FACT (high):** vendor examples use `-k`/disabled TLS verification because the
proxy presents its certificate [S4][S8]. **RECOMMENDATION (high):** reject that
pattern in production. Install and pin an explicitly reviewed trust anchor if a
TLS-intercepting proxy is approved; otherwise use a non-intercepting contract.
Disabling verification converts target and credential traffic into a trivial
machine-in-the-middle risk.

**RECOMMENDATION (high):** never let origin `Set-Cookie`, final URL, or reflected
headers automatically influence another fetch. Strip hop-by-hop/vendor headers,
bound redirect chains, re-run destination policy on every redirect, partition
cookies by origin and task, and do not send secrets or authenticated sessions to
a hosted unblocker absent explicit authority.

## 6. Freshness, caching, and provenance

**FACT (high):** Scraper result records expose job/result timestamps and URL;
scheduled runs expose job creation and result creation times. Push-Pull keeps
completed results for at least 24 hours and can upload results to GCS, S3, OSS,
TOS, or S3-compatible storage [S2-S3][S23-S24]. Web Unblocker passes origin-like
headers and may show cache headers, but its sample is illustrative and does not
promise cache behavior [S22].

**Negative result / UNKNOWN (high confidence):** reviewed public sources expose
no request control or guarantee for cache bypass, cache age, cache key,
revalidation, `Age`, stale-if-error, point-of-presence, origin contact, or
freshness SLA. They do not say whether retries share cache/session state. No
result-level exit IP, retry count, chosen proxy class, origin connection time,
redirect chain, rendered browser version, response-byte digest, parser version,
or robots/policy decision is guaranteed. `created_at` and `updated_at` are job
timestamps, not source publication or origin observation proof.

**RECOMMENDATION (high):** Curiosity should stamp its own `requested_at`,
`received_at`, content digest, adapter/config version, requested geo/render, final
URL and redirect evidence, and preserve any trustworthy origin validators
(`Date`, `ETag`, `Last-Modified`, `Age`) without treating them as verified truth.
Use explicit `freshness_unknown` when provider cache/origin contact is unknown.
Scheduled re-fetch is an acquisition cadence, not proof that content changed.

## 7. Limits and economics (snapshot, not quote)

**FACT (high):** Web Scraper API's public plans on access date ranged from a
2,000-result free trial to Micro ($49/month, up to 98,000 Amazon non-JS results),
Starter ($99), Business ($999), and custom. Unit prices vary by target and JS:
Micro lists $0.50/1K Amazon, $1.00/1K Google, $1.15/1K other non-JS, and
$1.35/1K rendered results; media download is separate per GB [S25]. Documentation
lists 10 jobs/s and 3 rendered jobs/s for trial, 50/13 for most regular plans,
and 100/25 for Business/Corporate. A domain falling below 40% success over a
five-minute window is throttled to 1 request/s [S26].

**FACT (high):** Web Scraper API bills successful target `2xx` and most `4xx`
results even when expected information is absent; `429`, provider `5xx/6xx`, and
faulted jobs are not billed, while caller-caused failures can be [S27].

**FACT (high):** Web Unblocker regular pricing showed trial 1 GB, Micro 8 GB at
$9.40/GB ($75/month before a temporary promotion), Starter 38 GB at $8.60/GB,
and Advanced 88 GB at $7.50/GB. It meters both successful request and response
traffic; rendering includes page subresource traffic. Rate classes mirror
10/3, 50/13, and 100/25 total/rendered requests per second [S28-S30]. Promotions
are transient and must not be used for durable planning.

**INFERENCE (high):** “success-based” is an access/billing classifier, not data
quality. Curiosity cost controls need per-task maximum results/bytes/render
seconds/retries and a post-result semantic-quality gate. Cost comparison must use
the actual target/render mix, not headline minimum unit rates.

**FACT (high):** proxy primitives use different meters. Residential self-service
started at 5 GB for $30 ($6/GB) and mobile at 4 GB for $30 ($7.50/GB). ISP
started at 10 IPs for $16 ($1.60/IP), with unlimited bandwidth subject to fair
usage: up to 100 concurrent sessions per purchased IP below 50 GB/IP/month,
reduced to 10 after that threshold. Datacenter options included dedicated
$2.25/IP, shared $1.20/IP, or shared $0.59/GB, each with plan-specific pool,
location, and fair-usage qualifications [S37-S40]. These are 2026-08-17 list
prices, not total-cost or availability guarantees.

## 8. Privacy, legal, and safety

**FACT (high):** Oxylabs' AUP prohibits illegal/IP-infringing access, security
breaches, authentication circumvention, denial of service, ticket-buying bots,
invalid ad traffic, and other abuse. Its automated-gathering section requires
compliance with target terms/legal documents, restricts collection to public
data absent permission, and prohibits sensitive health/children's data [S31].
Product docs separately restrict categories including financial, government,
streaming, social, gaming, and ticketing targets, sometimes reviewable through
KYC [S32-S33].

**FACT (medium):** Oxylabs says every customer answers KYC questions, activity is
monitored, service may be refused/terminated, and at least one quarter of annual
inquiries are rejected. Its trust page says Web Scraper API and Web Unblocker
have SOC 2 Type 2 certification and main product areas are ISO/IEC 27001:2022
certified; it represents residential users as consenting, aware, and fairly
rewarded [S34-S35]. These are vendor claims; certificates, audit boundaries, and
residential acquisition records were not independently inspected here.

**FACT (high):** the general privacy policy covers account/contact/usage data,
service providers, international transfers, and GDPR rights, and says account
personal data is retained as necessary while communications can be retained up
to five years [S36]. **UNKNOWN:** reviewed public pages do not clearly state
retention/deletion for target URLs, request bodies, headers, cookies, screenshots,
page content, AI prompts, callbacks, or proxy logs; model-training use; per-product
subprocessors/regions; customer-controlled deletion; or whether credentials in
S3-compatible `storage_url` values are redacted from logs.

**RECOMMENDATION (high):** legal permission belongs in Curiosity's policy gate,
not in provider reachability. Require public-web-only scope, purpose and target
allowlists, robots/terms/privacy review appropriate to the use case, PII/sensitive
data minimization, no authenticated content by default, egress SSRF controls,
secret stripping, short retention, deletion and incident terms, audit logs, and
human approval for new sensitive target classes. KYC and restricted-target gates
are useful defense-in-depth, not authorization for the caller.

## 9. Curiosity decision ledger

| Verdict | Pattern | Rationale / required adaptation |
| --- | --- | --- |
| **ADOPT** | Job ID plus explicit pending/done/faulted lifecycle | Durable reconciliation; add idempotency, cancellation, deadline, and typed failure ownership. |
| **ADOPT** | Separate raw/rendered/parsed/Markdown artifacts and parser warnings | Preserve derivation and uncertainty; content-address every artifact. |
| **ADOPT** | Strict batch/source/result/rate budgets | Keep smaller Curiosity defaults; budget bytes, redirects, render actions, and dollars too. |
| **ADAPT** | Realtime, async, callback, and customer-storage delivery | Provider-neutral internal contract; signed callbacks, destination allowlist, least-privilege bucket role, replay defense. |
| **ADAPT** | Geo and sticky sessions | Type as acquisition context, not source truth; record requested versus observed geo and avoid identity simulation by default. |
| **ADAPT** | Prompt/schema extraction and frontier prioritization | Run only after deterministic scope/policy; validate schema and retain source spans/URLs. |
| **ADAPT** | Scheduler | Convert to bounded recrawl policy with end date, total-run cap, change detection, and spend circuit breaker. |
| **REJECT** | TLS verification disabled | Use reviewed trust/pinning or do not integrate. |
| **REJECT** | Provider `2xx/4xx` = semantic success | Maintain separate transport, origin, extraction, and evidence-quality states. |
| **REJECT** | Opaque unblocking as policy authority | Reachability does not grant permission and retry/fingerprint choices are not provenance. |
| **REJECT** | Agent-controlled target, headers, cookies, callback, or storage URL | SSRF, secret exfiltration, replay, confused-deputy, and cost risks. |
| **DEFER** | Oxylabs production adapter | Needs legal/security/procurement review, DPA/retention answers, controlled evaluation, and explicit authority. |
| **DEFER** | AI-Crawler as broad discovery plane | Crawl bounds, cache, robots, failure, and provenance contracts are insufficiently disclosed. |

### Proposed provider-neutral evidence envelope

**RECOMMENDATION (high):** regardless of adapter, preserve at least:

```text
request_id, task_id, provider, adapter_version
requested_url, final_url, redirect_chain, source_url
requested_at, received_at, origin_date?, last_modified?, cache_age?
requested_geo, observed_geo?, render_mode, session_policy
transport_outcome, provider_job_outcome, origin_status, extraction_outcome
artifact_type, media_type, byte_length, sha256, storage_reference
parser_kind, parser_version_or_digest, schema_digest, warnings[]
policy_decision_id, robots_decision?, retention_class, cost_units
provenance_completeness, freshness_status, untrusted_external_data=true
```

Question marks are first-class unavailable fields, not permission to invent
values. Raw result bodies remain untrusted and bounded.

## 10. Unknowns and pre-adoption checks

1. Obtain current service terms, DPA, subprocessor list, regions, target-payload
   retention/deletion, training-use statement, breach terms, and audit scope.
2. Require normative schemas/OpenAPI for the chosen product, including maximum
   URL/body/result sizes, timeout, redirect, retry, cancellation, and idempotency.
3. Clarify provider cache/revalidation behavior and whether an origin fetch can
   be demanded and evidenced.
4. Clarify callback signing/replay/retry/order and cloud credential handling;
   prohibit credentials embedded in request URLs where possible.
5. Establish whether target robots directives and target terms are evaluated by
   Oxylabs; regardless, retain Curiosity's independent policy gate.
6. Validate certificates and the safe trust model for proxy TLS interception;
   never accept a blanket `verify=false` integration.
7. Run only a separately authorized, non-sensitive public sandbox evaluation:
   destination/redirect SSRF tests, size/time caps, duplicate callbacks,
   parser-warning preservation, geo variance, cache evidence, cancellation, and
   billed-unit reconciliation. No live target bypass test is authorized here.
8. For AI-Crawler, obtain depth/frontier/domain/robots/dedupe/error/provenance
   semantics before even an optional adapter evaluation.

## 11. Bounded curiosity pass

After synthesis, four gaps were scored 1–5 on relevance/value/novelty and
reverse-scored cost (higher is cheaper):

| Thread | R | V | N | Cheap | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Does the crawler publish deterministic depth/frontier bounds? | 5 | 5 | 4 | 5 | **Pursued** via AI-Crawler, AI-Map, FAQ, and pricing pages; negative result retained. |
| Are freshness/cache guarantees documented? | 5 | 5 | 4 | 4 | **Pursued** across output, sample response, storage, and scheduler pages; no guarantee found. |
| Can callback authenticity be established beyond IP allowlisting? | 5 | 4 | 3 | 4 | **Pursued** in Push-Pull docs; no signature/replay contract found. |
| Independently verify residential end-user consent records | 3 | 5 | 5 | 1 | **CURIOSITY_NO_GO:** requires non-public supplier/audit evidence; vendor claim retained with medium confidence. |
| Infer CAPTCHA/fingerprint algorithms or test target bypass | 2 | 1 | 3 | 1 | **CURIOSITY_NO_GO:** outside decision need and explicit clean-room/safety boundary. |
| Inspect SDK/package internals for hidden endpoints | 2 | 2 | 3 | 2 | **CURIOSITY_NO_GO:** public contract is the relevant integration surface; source/license review was not authorized. |

**Stop reason:** requested categories are covered; the highest-value public
documentation gaps saturated into explicit unknowns. Further resolution needs
contractual disclosure or separately authorized testing, not more speculative
reverse engineering.

## Sources

All sources accessed 2026-08-17. First-party vendor material is authoritative
only for the published contract or representation attributed to it.

- **[S1]** Oxylabs, “Quick Start: Web Scraper API.” <https://developers.oxylabs.io/get-started/quick-start-web-scraper-api.md>
- **[S2]** Oxylabs, “Web Scraper API — Realtime.” <https://developers.oxylabs.io/products/web-scraper-api/integration-methods/realtime.md>
- **[S3]** Oxylabs, “Web Scraper API — Push-Pull.” <https://developers.oxylabs.io/products/web-scraper-api/integration-methods/push-pull.md>
- **[S4]** Oxylabs, “Web Scraper API — Proxy Endpoint.” <https://developers.oxylabs.io/products/web-scraper-api/integration-methods/proxy-endpoint.md>
- **[S5]** Oxylabs, “JS Rendering & Browser Control.” <https://developers.oxylabs.io/products/web-scraper-api/features/js-rendering-and-browser-control.md>
- **[S6]** Oxylabs, “Custom Parser — Getting started.” <https://developers.oxylabs.io/products/web-scraper-api/features/custom-parser/getting-started.md>
- **[S7]** Oxylabs, “Web Scraper API Response Codes.” <https://developers.oxylabs.io/products/web-scraper-api/response-codes.md>
- **[S8]** Oxylabs, “Web Unblocker — Making Requests.” <https://developers.oxylabs.io/products/web-unblocker/making-requests.md>
- **[S9]** Oxylabs, “Web Unblocker — Session.” <https://developers.oxylabs.io/products/web-unblocker/making-requests/session.md>
- **[S10]** Oxylabs, “Quick Start: Web Unblocker.” <https://developers.oxylabs.io/get-started/quick-start-web-unblocker.md>
- **[S11]** Oxylabs, “Web Unblocker Response Codes.” <https://developers.oxylabs.io/products/web-unblocker/response-codes.md>
- **[S12]** Oxylabs, “AI-Crawler.” <https://developers.oxylabs.io/products/ai-studio/ai-crawler.md>
- **[S13]** Oxylabs, “AI-Map.” <https://developers.oxylabs.io/products/ai-studio/ai-map.md>
- **[S14]** Oxylabs, “AI Studio FAQ” and pricing. <https://developers.oxylabs.io/products/ai-studio/faq.md>, <https://aistudio.oxylabs.io/pricing>
- **[S15]** Oxylabs, “Residential Proxies.” <https://developers.oxylabs.io/products/proxies/residential-proxies.md>
- **[S16]** Oxylabs, “Residential Proxies — Session Control.” <https://developers.oxylabs.io/products/proxies/residential-proxies/session-control.md>
- **[S17]** Oxylabs, “Mobile Proxies.” <https://developers.oxylabs.io/products/proxies/mobile-proxies.md>
- **[S18]** Oxylabs, “ISP Proxies.” <https://developers.oxylabs.io/products/proxies/isp-proxies.md>
- **[S19]** Oxylabs, “Datacenter Proxies.” <https://developers.oxylabs.io/products/proxies/datacenter-proxies.md>
- **[S20]** Oxylabs, “Headers, Cookies, Method.” <https://developers.oxylabs.io/products/web-scraper-api/features/http-context-and-job-management/headers-cookies-method.md>
- **[S21]** Oxylabs, “Markdown Output.” <https://developers.oxylabs.io/products/web-scraper-api/features/result-processing-and-storage/output-types/markdown-output.md>
- **[S22]** Oxylabs, “Web Unblocker Sample Responses.” <https://developers.oxylabs.io/products/web-unblocker/sample-responses.md>
- **[S23]** Oxylabs, “Scheduler.” <https://developers.oxylabs.io/products/web-scraper-api/features/scheduler.md>
- **[S24]** Oxylabs, “Cloud Storage.” <https://developers.oxylabs.io/products/web-scraper-api/features/result-processing-and-storage/cloud-storage.md>
- **[S25]** Oxylabs, “Web Scraper API Pricing.” <https://oxylabs.io/products/scraper-api/web/pricing>
- **[S26]** Oxylabs, “Web Scraper API Rate Limits.” <https://developers.oxylabs.io/products/web-scraper-api/usage-and-billing/rate-limits.md>
- **[S27]** Oxylabs, “Web Scraper API Traffic and Billing.” <https://developers.oxylabs.io/products/web-scraper-api/usage-and-billing/billing-information.md>
- **[S28]** Oxylabs, “Web Unblocker Pricing.” <https://oxylabs.io/products/web-unblocker/pricing>
- **[S29]** Oxylabs, “Web Unblocker Rate Limits.” <https://developers.oxylabs.io/products/web-unblocker/rate-limits.md>
- **[S30]** Oxylabs, “Web Unblocker Billing Information.” <https://developers.oxylabs.io/products/web-unblocker/billing-information.md>
- **[S31]** Oxylabs, “Acceptable Use Policy,” updated 2024-06-25. <https://oxylabs.io/legal/oxylabs-acceptable-use-policy>
- **[S32]** Oxylabs, “Web Scraper API Restricted Targets.” <https://developers.oxylabs.io/products/web-scraper-api/restricted-targets.md>
- **[S33]** Oxylabs, “Residential Proxies Restricted Targets.” <https://developers.oxylabs.io/products/proxies/residential-proxies/restricted-targets.md>
- **[S34]** Oxylabs, “Know Your Customer Policy.” <https://oxylabs.io/kyc-and-safety>
- **[S35]** Oxylabs, “Risk and Legal Compliance.” <https://oxylabs.io/risk-and-legal-compliance>
- **[S36]** Oxylabs, “Privacy Policy,” updated 2024-10-14. <https://oxylabs.io/legal/privacy>
- **[S37]** Oxylabs, “Residential Proxies Pricing.” <https://oxylabs.io/pricing/residential-proxy-pool>
- **[S38]** Oxylabs, “Mobile Proxies Pricing.” <https://oxylabs.io/products/mobile-proxies/pricing>
- **[S39]** Oxylabs, “ISP Proxies Pricing.” <https://oxylabs.io/pricing/isp-proxies>
- **[S40]** Oxylabs, “Datacenter Proxies Pricing.” <https://oxylabs.io/pricing/datacenter-proxies>

## Confidence summary

- **High:** documented endpoints, fields, state values, output forms, published
  limits/rates/prices, billing classification, and policy text.
- **Medium:** inferred execution-plane decomposition; vendor trust, consent, and
  certification claims not independently audited here.
- **Low/unknown:** cache/origin-contact behavior, crawler frontier semantics,
  comparative success/quality, undisclosed retry/fingerprint logic, payload
  retention/training, callback delivery guarantees, and actual proxy supply.
