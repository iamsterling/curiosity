# Oxylabs Web Scraper API: clean-room contract and architecture dossier

**Research/source access date:** 2026-08-17  
**Scope:** Oxylabs **Web Scraper API only**. Web Unblocker, AI-Crawler, and
AI-Map are excluded. Proxy infrastructure is discussed only where the Web
Scraper API contract depends on proxy location or session behavior.  
**Status:** research evidence and design recommendations; not implementation,
procurement approval, legal advice, or a performance benchmark.

## Executive verdict

Web Scraper API is externally a managed **single-target acquisition job** with
three ingress styles, optional browser execution, several extraction layers,
durable asynchronous results, recurring schedules, aggregation, and outbound
storage delivery. It is not a crawl-frontier contract: `universal` fetches a
caller-supplied URL, while dedicated `source` values model target-specific
search or entity requests. The provider owns retries, proxy selection, browser
execution, and maintained parsers; the customer sees job/result states but not
enough attempt, cache, or execution evidence to establish freshness or replay a
result exactly [S1-S17].

**Overall Curiosity verdict: ADAPT / DEFER (high confidence).** Adapt the
separation between realtime and durable jobs, explicit artifact types, parser
warnings, schedules/runs/jobs, aggregation bounds, and acquisition/extraction/
delivery outcomes. Defer an Oxylabs adapter until procurement resolves a
consequential contract term allowing Oxylabs to retain Web Scraper API-gathered
data and use it at its sole discretion, plus payload retention, cache behavior,
callback authenticity, cloud-secret handling, schema/version drift, and
destination controls [S24-S25].

The clean-room lesson is stronger than the product fit: **managed access is an
execution capability, not evidence of permission, truth, freshness, or semantic
quality**. Curiosity must keep policy, budgets, provenance, quality, and crawl
orchestration provider-neutral and under its own control.

## 1. Decision frame and method

### 1.1 Bounded questions

1. What are the request, job, callback, schedule, aggregation, retrieval, and
   delivery contracts?
2. How are ordinary fetch, JavaScript rendering, browser actions, network
   capture, dedicated parsing, custom parsing, and generated parsing separated?
3. Which geo, proxy-session, header, cookie, method, and retry dependencies are
   exposed?
4. What output, provenance, timestamp, retention, and freshness evidence exists?
5. What limits, errors, billing units, privacy, security, and legal terms alter
   adoption?
6. What internal logical boundaries can be inferred without claiming access to
   private implementation?
7. Which patterns should Curiosity adopt, adapt, reject, or defer?

### 1.2 Evidence and clean-room boundary

- **FACT** — directly stated or shown in a cited first-party source.
- **INFERENCE** — a bounded explanation of observable behavior; not a claim
  about private code, topology, algorithms, or vendors.
- **RECOMMENDATION** — a proposed Curiosity design or procurement choice.
- **UNKNOWN / NEGATIVE RESULT** — not established in the public sources
  reviewed; absence is not proof of provider behavior.

Confidence is **high**, **medium**, or **low**. Official product, contract,
policy, and trust materials are primary evidence of Oxylabs' published contract
or representation, not independent proof of availability, security control
operation, parser quality, lawful target use, or proxy supply.

No account, credentials, free/paid API call, target request, browser session,
SDK/source inspection, packet interception, bypass experiment, or benchmark was
used. The review does not reconstruct anti-bot or CAPTCHA techniques. Public
examples were read, not executed. The public General Conditions prohibit
reverse engineering and competitive monitoring; this dossier therefore limits
itself to interoperability-relevant, externally documented behavior [S24].

## 2. Product boundary and contract map

**FACT (high):** the Web Scraper API documentation exposes three integration
methods using Basic authentication with API-user credentials [S1-S4].

| Surface | Observable unit/lifecycle | Important boundary |
|---|---|---|
| Realtime | `POST https://realtime.oxylabs.io/v1/queries`; connection remains open until result/error | Synchronous job response; rendered requests should allow a 180-second client timeout [S2][S5]. |
| Push-Pull | `POST https://data.oxylabs.io/v1/queries`; poll job and result URLs or receive callback | Durable `pending → done | faulted` job; results retained **at least 24 hours** [S3]. |
| Proxy Endpoint | Target URL sent through HTTPS proxy `realtime.oxylabs.io:60000`; options in `x-oxylabs-*` headers | URL-based sources only; narrow option set; raw open-connection response rather than canonical job envelope [S4]. |
| Scheduler | Schedule resource creates the same scraping/parsing jobs from item payloads | Recurrence/orchestration above jobs, not a discovered-URL crawl frontier [S18]. |
| Result Aggregator | Named buffer groups many results and closes on time/count/bytes | Delivery batching above jobs; supports JSON/JSONL and gzip variants, maximum 1 GB batch [S14]. |
| Parser preset service | CRUD/statistics/changelog resources for hosted custom parsing instructions | Provider-hosted mutable extraction program, optionally self-healing [S8]. |

**FACT (high):** common job input is a `source` plus either `url` or a
source-specific `query`, with optional `geo_location`, `render`, `parse`,
`markdown`, `xhr`, browser/parsing instructions, storage/callback, session, and
HTTP-context controls. `universal` addresses an explicitly supplied URL;
dedicated target sources model entities such as search, product, pricing, or
subtitles and may support provider-maintained parsers [S1][S9].

**INFERENCE (high):** this is a capability-oriented collection service, not one
uniform HTTP fetch API. `source` selects a target adapter and input/output
semantics; optional browser/parser/output stages then extend that plan.

**RECOMMENDATION (high):** do not expose the vendor payload as Curiosity's agent
ABI. Normalize into provider-neutral `FetchRequest`, `RenderRequest`,
`ExtractionRequest`, `RetrievalJob`, `Artifact`, and `DeliveryAttempt` contracts.
Keep `source`, preset names, and Oxylabs credentials inside the adapter.

## 3. Request, job, callback, and orchestration contracts

### 3.1 Realtime and Proxy Endpoint

**FACT (high):** Realtime returns a JSON `results[]` array. A typical result has
`content`, `created_at`, `updated_at`, `page`, `url`, `job_id`, and target
`status_code`; multi-format results additionally identify `type` and can expose
`is_render_forced`, parser metadata, or browser warnings [S2][S12].

**FACT (high):** Proxy Endpoint accepts only URL-based sources and only the
documented user-agent type, geo, render, and parse controls as request headers.
It is expressly not designed as a Playwright/Selenium/Puppeteer endpoint [S4].
The documentation tells clients to ignore/accept the proxy certificate and its
samples disable TLS verification.

**RECOMMENDATION (high): REJECT** blanket certificate verification disabling.
If this compatibility surface were ever approved, use an explicitly reviewed
and narrowly trusted intercepting CA/pin, or do not use it. `verify=false` is not
a deployable trust model.

### 3.2 Push-Pull state and result retrieval

**FACT (high):** submission returns submitted parameters plus `id`,
`created_at`, `updated_at`, `status`, and `_links` for metadata and results.
Documented states are:

- `pending`: still processing;
- `done`: completed and result may be retrieved;
- `faulted`: provider gave up; faulted jobs are not charged.

`GET /v1/queries/{id}` reads job state. `GET
/v1/queries/{id}/results` reads the default result; `type=raw`, `parsed`, `png`,
`xhr`, `markdown`, or a comma-separated set chooses available artifacts. `204`
means result retrieval was attempted before completion, and `404` means the job
ID is no longer available [S3][S21].

**FACT (high):** `POST /v1/queries/batch` accepts up to **5,000** `url` or
`query` values. Each value becomes an independent job/ID; every other parameter
must be singular. A callback is emitted per job rather than once for the batch
[S3].

**UNKNOWN (high relevance):** public pages reviewed do not define cancellation,
client idempotency keys, deduplication windows, queue priority guarantees,
maximum URL/request/result bytes, hard job deadline, deletion API, maximum
retention beyond “at least 24 hours,” or consistency between job state and
result/storage availability.

### 3.3 Callback is a hint, not a transaction

**FACT (high):** when `callback_url` is supplied, Oxylabs POSTs job metadata and
result links after completion. `GET /v1/info/callbacker_ips` returns notifier IPs
for allowlisting [S3].

**NEGATIVE RESULT (high confidence):** the reviewed callback contract does not
publish a cryptographic signature, event ID, nonce, timestamp/replay window,
retry schedule, ordering guarantee, duplicate-delivery rule, or exactly-once
semantics. The examples follow callback-provided result links directly.

**INFERENCE (high):** callback delivery is a completion notification. A safe
consumer must deduplicate by provider job ID, reconstruct the canonical result
URL from trusted configuration rather than trust an arbitrary callback link,
authenticate result retrieval independently, and reconcile by polling.
Source-IP allowlisting is useful defense-in-depth, not message authenticity.

### 3.4 Scheduler

**FACT (high):** Scheduler creates a resource from required `cron`, `items[]`,
and inclusive `end_time`. It exposes schedule list/info, run metadata, generated
job IDs, and activation state. Runs expose `run_id`, per-job creation/result
states and timestamps, and aggregate success rate. A schedule can be deactivated
or reactivated with `PUT /v1/schedules/{id}/state`; the change returns `202`
with an empty body [S18].

**FACT (high):** the vendor explicitly warns that Scheduler can rapidly increase
the bill and recommends a small, repeat-limited test first [S18].

**RECOMMENDATION (high): ADAPT.** Curiosity's scheduler should own recurrence,
end date, total-run and per-run limits, missed-run policy, change detection,
spend circuit breakers, and target policy. A scheduled completion timestamp is
acquisition cadence, not source publication time or proof of change.

### 3.5 Aggregation and cloud delivery

**FACT (high):** Result Aggregator creates a named buffer with cloud destination
and any combination of `max_result_count`, `max_size_bytes` (maximum **1 GB**),
and cron `schedule` (documented maximum interval **1 hour**). A job refers to it
with `aggregate_name`. Any trigger closes and uploads the batch; manual trigger
is also available. Formats are JSON, JSONL, gzip JSON, and gzip JSONL [S14].

**FACT (high):** Push-Pull can upload directly to GCS, S3, BytePlus TOS, Alibaba
OSS, or another S3-compatible endpoint. GCS and S3 can authorize a named
Oxylabs principal; TOS/OSS/S3-compatible examples embed access key and secret in
`storage_url`. Cloud-uploader status codes distinguish success, generic failure,
missing path, and denied access [S15][S21].

**FACT (high):** default object naming is `{{ job_id }}.{{ extension }}`. Custom
templates may interpolate **any job input** and variables from `job_info` [S20].
`client_notes` is persisted in a database and S3 storage with job information
[S19].

**RECOMMENDATION (high):** prefer a write-only service principal/role scoped to
one prefix; reject long-lived secrets in URLs. Treat templates and notes as
injection/leakage surfaces: allowlist variables, sanitize path components, and
never place target URLs, queries, credentials, personal data, or tenant secrets
in object names/notes. Model collection and delivery as separate outcomes;
`done` must not imply successful upload.

## 4. Fetch context, geo, and proxy dependencies

### 4.1 HTTP context

**FACT (high):** Web Scraper API supplies provider-defined headers and cookies.
Caller headers/cookies are nested in `context`; they are sent only when
`force_headers`/`force_cookies` is true and are combined with provider defaults.
`universal` uses GET by default; target POST is represented by `http_method:
post` plus a Base64-encoded `content` value [S6].

**FACT (high):** `user_agent_type` selects a class rather than an exact string:
desktop, mobile, Android/iOS mobile, tablet, or Android/iOS tablet [S7]. The
result contract does not guarantee the actual user-agent value chosen.

**RECOMMENDATION (high):** reject arbitrary agent-provided headers, cookies, and
POST bodies by default. Enforce destination/port policy before dispatch and on
every redirect; strip secrets; partition cookies per tenant/task/origin; cap
body, redirects, response bytes, and decompression; prohibit authenticated or
side-effecting target actions absent explicit authority.

### 4.2 Geo and sessions

**FACT (high):** `geo_location` requests a proxy server location; the public
page lists country-level values and warns that SERP/e-commerce localization has
different semantics. `session_id` is any alphanumeric caller string and asks
multiple jobs to use the same proxy IP, commonly with custom cookies [S10].

**UNKNOWN:** the Web Scraper API page does not define session lifetime, idle
expiry, behavior when an exit disappears, cross-source scope, concurrency,
actual exit class/IP, or a response field proving the selected location.

**INFERENCE (high):** proxy routing/session state is a lower acquisition
dependency selected by the Web Scraper API planner. It should not leak into the
provider-neutral contract as an identity guarantee.

**RECOMMENDATION (high):** represent requested geo and session policy as
acquisition context, not source truth. Preserve requested versus observed geo
separately; use opaque Curiosity session handles; do not assume one `session_id`
means one durable browser, cookie jar, or guaranteed IP beyond what is evidenced.

### 4.3 Opaque retries

**FACT (high):** billing documentation gives an example where one job takes
three attempts and only the successful final result is billed. API code `613`
means the job faulted after too many retries. Domain success below 40% during a
five-minute window throttles that domain to 1 request/s [S22][S23][S21].

**INFERENCE (high):** access attempts and final delivery are intentionally
collapsed behind one result. That improves usability but means `job_id` is not a
complete retry lineage.

**RECOMMENDATION (high):** put provider execution inside a Curiosity deadline,
spend, bytes, and retry budget. Record retry count as `unknown` when unavailable;
never infer one origin contact from one billed result.

## 5. Rendering, browser actions, and network capture

### 5.1 Render artifacts

**FACT (high):** `render: html` returns the DOM after JavaScript execution;
`render: png` returns a Base64 PNG screenshot. Rendering takes longer, consumes
more traffic, and may be forced automatically for some page types. An empty
render value disables forced rendering. Oxylabs says unnecessary assets are not
loaded to reduce traffic [S5].

**INFERENCE (medium):** rendered HTML is serialized execution state, not the
origin response bytes. Asset suppression means it also need not equal a normal
browser load. `is_render_forced` is useful evidence but does not expose browser
engine/version, loaded-resource policy, viewport, or exact execution profile.

### 5.2 Bounded browser instruction language

**FACT (high):** browser instructions require rendering and execute an ordered
list of `click`, `input`, `scroll`, `scroll_to_bottom`, `wait`,
`wait_for_element`, and terminal `fetch_resource`. Selectors may be XPath, CSS,
or text. Common `timeout_s` and `wait_time_s` values are greater than zero and at
most **60 seconds**; `on_error` is `error` or `skip`. Malformed instructions
return `400`; execution issues appear as `browser_instructions_error` or
`browser_instructions_warnings` [S5].

**FACT (high):** `fetch_resource` must be last and substitutes the first
Fetch/XHR resource matching a regular expression for the page HTML [S5].

**UNKNOWN:** no reviewed public contract gives a maximum instruction count,
total browser wall time, navigation count, download policy, viewport/runtime
version, subresource byte cap, or side-effect policy.

**RECOMMENDATION (high): ADOPT the bounded DSL, strengthen the envelope.** Add
total wall time, action/navigation count, captured bytes, and output limits;
forbid side-effecting actions by default; preserve ordered per-action outcomes;
and expose `complete | partial | failed`. A warning-bearing origin `200` must not
silently become complete success.

### 5.3 Fetch/XHR capture

**FACT (high):** `xhr: true` with rendering returns observed Fetch/XHR records
containing URL, method, status, request headers (including cookies), response
headers (including cookies), request payload for write methods, and response
body [S11]. `fetch_resource` instead chooses the first regex match [S5].

**RECOMMENDATION (high):** network capture is highly sensitive untrusted data.
Redact authorization/cookies by policy, enforce per-origin and byte limits, and
store it as a separate derived artifact. Do not automatically replay captured
URLs, payloads, headers, or cookies. Selection order for “first match” must be
recorded as non-canonical.

## 6. Extraction and parser lifecycle

### 6.1 Three observable extraction paths

1. **Dedicated parser — FACT (high):** `parse: true` invokes an
   Oxylabs-maintained parser on supported Amazon, Google, YouTube, ChatGPT,
   Perplexity, Bing, Walmart, Best Buy, Etsy, and Target source families [S9].
2. **Custom parser — FACT (high):** caller supplies ordered CSS/XPath and
   transformation-function pipelines in `parsing_instructions`; output records
   identify `parser_type: custom` [S17].
3. **Generated/preset parser — FACT (high):** prompt or JSON-schema endpoints
   accept example URLs plus `render`, return parsing instructions, and may save
   them as hosted presets. Prompt generation recommends 3–5 same-page-type URLs
   [S16-S17].

**FACT (high):** preset resources support create/read/update/delete/list,
aggregate/path success statistics, and self-healing changelog retrieval.
Self-healing requires a schema and up to five example URLs and may modify
instructions in the background [S8].

### 6.2 Parser outcomes are not semantic truth

**FACT (high):** parser status codes include `12000` success; `12004`/`12005`
partial success; `12002`, `12006`, `12008`, and `12009` failures; `12003` not
supported; and `12007` unknown quality. A Custom Parser selector miss can return
billable `12005`, null fields, and field-level `_warnings`; unexpected parser
exceptions are documented as unbilled [S17][S21].

**INFERENCE (high):** `12000` is a provider parser-completeness assertion. It
does not prove factual accuracy, current source state, schema stability, or that
all relevant content was acquired. A self-healed preset is a mutable extraction
program even when referenced by the same name.

**RECOMMENDATION (high):** pin/digest parser instructions, schema, and expected
field set. For self-healing, require explicit version/changelog capture and
quarantine changes before promotion. Store warning path/function/index and
null-versus-missing semantics. Validate types and quality independently.

### 6.3 Raw and derived artifact model

**FACT (high):** supported artifact types are:

- `raw`: content found at the URL, likely but not always HTML;
- `parsed`: structured JSON;
- `png`: Base64 screenshot;
- `markdown`: transformed Markdown string;
- `xhr`: observed Fetch/XHR records.

Realtime and Push-Pull can request multiple enabled types into one `results[]`
array. Binary JPEG/SVG/PNG fetched through JSON methods requires
`content_encoding: base64` [S12][S13].

**RECOMMENDATION (high):** keep acquisition bytes, rendered DOM, screenshot,
network capture, Markdown, and each parser output as distinct immutable
artifacts connected by derivation edges. Never let Markdown or parsed JSON be
the sole evidence where replay/audit matters. Content-address artifacts and
record media type, encoding, byte length, truncation, parser/schema digest, and
warnings.

## 7. Output, provenance, and freshness

### 7.1 Evidence actually present

**FACT (high):** job/result payloads expose provider job ID, requested/source URL
or generated result URL, result type, target status, job/result creation and
update times, page index, some parser metadata, forced-render indication, and
browser/parser warnings. Schedules add schedule/run/job linkage and timestamps.
XHR records may preserve origin-like request/response headers. Usage statistics
aggregate counts, mode, parsed/HTML, render, geo use, average response time, and
request/response traffic by time/source [S2-S3][S11-S12][S18][S27].

**FACT (high):** Push-Pull results remain available for **at least 24 hours**;
cloud delivery can move them to customer storage [S3][S15]. This is provider
result retention, not source freshness.

### 7.2 Freshness and replay gaps

**NEGATIVE RESULT (high confidence):** across the reviewed request, result,
output, scheduler, storage, usage, and legal pages, no public Web Scraper API
contract was found for:

- cache bypass, cache key, cache age, revalidation, stale-if-error, or proof of
  origin contact;
- exact fetch-start/origin-response timestamps distinct from job timestamps;
- complete redirect chain and every subresource;
- selected exit IP/proxy class or observed geo;
- retry count/configuration and per-attempt outcomes;
- browser/runtime version, viewport, or render-policy version;
- raw byte/content digest, truncation flag, or maximum result size;
- dedicated-parser version or field-level source selector/span;
- robots/terms/policy decision attached to the result;
- per-result billed amount; usage telemetry is aggregate.

`created_at`, `updated_at`, and `result_created_at` are provider job/result
timestamps. They are not source publication times, content observation proofs,
or cache dispositions.

**RECOMMENDATION (high):** Curiosity must add its own evidence envelope:

```text
request_id, task_id, tenant_id, provider, adapter_version
requested_url, canonical_url, final_url, redirect_chain?
requested_at, received_at, provider_created_at?, provider_updated_at?
origin_date?, etag?, last_modified?, age?, cache_disposition=unknown
requested_geo, observed_geo?, session_policy, fetch_mode, render_mode
transport_outcome, provider_job_outcome, origin_status, extraction_outcome
artifact_type, media_type, encoding, byte_length, sha256, storage_reference
parser_kind, parser_preset?, parser_instruction_digest?, schema_digest?, warnings[]
retry_count?, truncation?, cost_units?, retention_expiry?
policy_decision_id, robots_decision?, rights_basis?, untrusted_external_data=true
provenance_completeness, freshness_status
```

Question marks mean unavailable evidence, not permission to invent it. Preserve
origin validators as untrusted claims. Set `freshness_status=unknown` unless a
separate controlled policy can establish more.

## 8. Limits, errors, and economics

### 8.1 Rate and batch limits

**FACT (high):** published submission limits on the access date were 10 total/
3 rendered jobs per second for trial, 50/13 for Micro through Venture, and
100/25 for Business and Corporate; Custom is negotiated. Responses include one
or more `x-ratelimit-<limit_name>-limit` and `...-remaining` header pairs. A
domain below 40% success during the prior five minutes is throttled to 1 request
per second [S23]. Batch input is capped at 5,000 URLs/queries [S3]. Aggregated
files cap at 1 GB and close within at most one hour [S14].

**UNKNOWN:** public docs reviewed do not reconcile submission rate with maximum
concurrency, queue depth, response size, browser worker capacity, or hard
monthly spend cutoff. Plan “up to results” is target/render-mix dependent.

### 8.2 Layered error semantics

**FACT (high):** API codes distinguish accepted (`202`), unfinished result
(`204`), malformed/invalid input (`400`/`422`), authentication/authorization
(`401`/`403`), expired/unavailable ID (`404`), rate (`429`), internal/timeout
(`500`/`524`), and internal/final-retry faults (`612`/`613`). Separate namespaces
cover parser (`12xxx`), cloud uploader (`13xxx`), and session (`15xxx`) outcomes
[S21]. Result `status_code` represents the target result, not all those layers.

**RECOMMENDATION (high):** preserve at least:

```text
submission_outcome
provider_job_outcome
origin_http_outcome
browser_action_outcome
extraction_outcome
delivery_outcome
semantic_quality_outcome
```

Do not flatten provider `done`, target `200`, parser `12000`, and successful
cloud upload into one boolean.

### 8.3 Pricing snapshot, not a quote

**FACT (high):** public regular pricing observed 2026-08-17 showed a 2,000-result
free trial and:

| Plan | Monthly price / maximum headline result count | Listed per-1K successful result rates |
|---|---|---|
| Micro | $49 / up to 98,000 | Amazon non-JS $0.50; Google non-JS $1.00; other non-JS $1.15; JS $1.35; media $3/GB |
| Starter | $99 / up to 220,000 | $0.45; $0.90; $1.10; JS $1.30; media $2.50/GB |
| Advanced | $249 / up to 622,500 | $0.40; $0.80; $0.95; JS $1.25; media $2/GB |

The pricing page says cloud integration, batch, browser, Custom Parser,
OxyCopilot, and Scheduler have no separate feature fee, while rendering/traffic
still changes usage. Prices, promotions, VAT, top-ups, target classification,
and enterprise terms are volatile [S28].

**FACT (high):** target `2xx` and most `4xx` results are billable even when the
expected information is absent; `429`, provider `5xx/6xx`, and faulted jobs are
not billed, while caller-caused failures may be. Multiple provider attempts
that end in one successful result bill the final result once [S22].

**FACT (high):** the General Conditions permit Oxylabs to reclassify a Web
Scraper API site from Standard to Premium with at least 14 days' notice and
corresponding pricing; declining ends access for that site after the notice
period without refund of prior payment [S24].

**INFERENCE (high):** “success-based” is an access/billing classifier, not a
semantic quality guarantee. Cost depends on target class, JS use, media bytes,
and output yield rather than one headline rate.

**RECOMMENDATION (high):** budget attempted jobs, billable results, result bytes,
render seconds, media/storage bytes, parser yield, and useful records. Stop when
semantic yield falls even if provider success remains high. Revalidate prices
and target classification at procurement time.

## 9. Privacy, security, and legal boundaries

This section records published terms and claims; it is not legal advice.

### 9.1 Consequential data-use term

**FACT (high):** the General Conditions define Web Scraper API as an automatic
data-gathering tool and state that Oxylabs may retain data gathered through the
customer's use of Web Scraper API and **may use it at its sole discretion**, while
taking responsibility for its use. The agreement also disclaims warranties for
service results/content, assigns target-data legality and third-party-rights
responsibility to the customer, permits subcontractors, limits liability, and
prohibits reverse engineering/competitive use [S24].

**RECOMMENDATION (high): DEFER sensitive or confidential use.** Require a signed
SoW/order-form override prohibiting independent use/model training and defining
payload/log retention, deletion, regions, subprocessors, incident notice,
confidentiality, ownership/licenses, and audit rights. The public DPA alone does
not neutralize the explicit retention/use clause.

### 9.2 DPA and privacy

**FACT (high):** the public DPA treats Oxylabs as processor for SAPI personal
data, requires documented instructions, appropriate technical/organizational
measures, confidentiality, assistance, and security-incident notification
“immediately if possible.” It allows subprocessors, but the customer must
request the current list in writing. On expiry, personal data is returned or
deleted at controller choice [S25].

**FACT (high):** the public privacy policy primarily describes account/contact/
self-service/website data, categories of service providers, international
transfers, data-subject rights, purpose-based account retention, and up to five
years for communications [S26].

**UNKNOWN (high relevance):** public pages reviewed do not give a Web Scraper
API-specific duration/deletion path for target URLs, request bodies, custom
headers/cookies, screenshots, XHR payloads, HTML/Markdown/parsed output, parser
prompts/schemas/example URLs, callback payloads, job notes, or operational logs.
They do not publish the current subprocessor list/regions, data-use opt-out,
training policy, or whether credentials embedded in `storage_url` are redacted.

### 9.3 Security representations and integration risks

**FACT (medium; vendor representation):** Oxylabs says Web Scraper API and Web
Unblocker achieved SOC 2 Type 2 certification through independent auditing and
that main business areas are ISO/IEC 27001:2022 certified. The Trust Center lists
SOC 2 Type 2, SOC 3, ISO documents, a Scraper API/Web Unblocker penetration-test
summary, audit logging, MFA, and data-retention controls, but several detailed
documents require requested access [S29-S30]. Certification scope/evidence and
control operation were not independently inspected here.

**RECOMMENDATION (high):** use a dedicated least-privilege API identity per
environment; store Basic-auth secrets only in a secret manager; prevent URLs,
headers, callbacks, notes, templates, and logs from carrying credentials; allowlist
callback/storage egress; require HTTPS; and independently enforce private,
loopback, link-local, metadata, control-plane, unsafe-port, DNS-rebinding, and
redirect restrictions. Search/retrieval bodies remain untrusted external data.

### 9.4 Lawful use and provider gates

**FACT (high):** the AUP prohibits unlawful/IP-infringing access, security
breaches, authentication circumvention, denial of service, ticket bots, invalid
ad traffic, and other abuse. Automated gathering must comply with target terms/
legal documents, use public data absent permission, and avoid sensitive health
and children's data [S31]. Web Scraper API additionally restricts categories
including entertainment/streaming, finance/banking/crypto, government, gaming,
professional/social networks, and ticketing; some may be reviewed through KYC
[S32].

**FACT (medium; vendor representation):** Oxylabs says every customer answers a
KYC questionnaire, use is monitored/reviewed, service can be refused or removed,
and at least one quarter of annual inquiries are rejected [S33].

**INFERENCE (high):** KYC, target restrictions, and provider reachability are
defense-in-depth, not caller authorization or permission from the target.

**RECOMMENDATION (high):** Curiosity must decide public-access scope, purpose,
robots/terms/privacy/rights policy, target allow/deny status, sensitive-data
handling, and spend **before** adapter dispatch. No authenticated, paywalled,
private, regulated, or personal-account content should enter this integration by
default.

## 10. Clean-room logical architecture inference

The following is an **INFERENCE**, not a description of Oxylabs private code:

```text
Customer
  |-- Basic-auth JSON: realtime.oxylabs.io | data.oxylabs.io
  |-- HTTPS proxy compatibility: realtime.oxylabs.io:60000
  v
account / entitlement / validation / rate / target-policy plane
  |
  +--> schedule controller ------> job submissions
  +--> parser-preset controller --> preset versions, stats, healing log
  |
  v
acquisition planner (source, URL/query, geo, context, outputs)
  |
  +--> proxy/geo/session selector
  +--> HTTP acquisition + retry/success classifier
  +--> ephemeral render/action worker + XHR observation
  |
  v
acquired artifact fan-out
  +--> raw / screenshot / XHR / markdown transformation
  +--> dedicated parser | custom instruction VM | hosted preset
  |
  v
result/job store ----> realtime response | poll/callback
  |
  +--> result aggregator ----> cloud uploader
  +--> usage/billing statistics
```

**Evidence and confidence:**

- Separate realtime/data/proxy ingress and a shared job/result shape support an
  ingress façade over common acquisition/result logic (**high**) [S2-S4].
- Explicit source, geo/session, render, retry-fault, and low-domain-success
  behavior support a target-aware planner/router (**medium-high**) [S5][S10]
  [S21-S23].
- Render/actions/XHR versus raw retrieval and forced-render metadata support a
  distinct browser execution path (**high at logical level**) [S5][S11-S12].
- Dedicated/custom/preset parser metadata and independently managed presets
  support separable extraction services (**high**) [S8-S9][S16-S17].
- Jobs, schedules, aggregators, uploader codes, and usage stats support separate
  durable orchestration, delivery, and telemetry paths (**high**) [S14-S15]
  [S18][S21][S27].

**UNKNOWN:** service topology, cloud/region, queue/storage technology, proxy
class-selection logic, browser engine pool, retry algorithm, block/CAPTCHA
classifier, parser implementation, self-healing model, and cache design. No
architecture decision should depend on guesses about them.

## 11. Curiosity decision ledger

### ADOPT

1. **Explicit durable job lifecycle** with job ID and pending/terminal states;
   add cancellation, deadline, idempotency, and expiry.
2. **Separate artifact types** for raw, rendered, screenshot, network, Markdown,
   and parsed output, with hashes and derivation links.
3. **Typed extraction warnings and partial outcomes**, preserving path/function
   detail and null/missing distinction.
4. **Bounded browser action language** rather than arbitrary remote scripts;
   strengthen with total resource limits and an action ledger.
5. **Schedule → run → job linkage** and explicit recurrence end time.
6. **Bounded aggregation by time/count/bytes** and manual flush.
7. **Layered error namespaces** for job, origin, parser, session, and delivery.

### ADAPT

1. **Realtime, async, callback, and cloud delivery** behind one provider-neutral
   lifecycle; callbacks must be signed/replay-safe or treated only as hints.
2. **`source` and parser preset** as adapter-specific capability/version
   references, not core contract values.
3. **Provider retries** only inside Curiosity's deadline, spend, and byte budget;
   unavailable attempt evidence remains unknown.
4. **Geo and sticky session** as requested acquisition context, never identity
   or location truth.
5. **Self-healing parsers** only with immutable changelog/version capture,
   canary validation, and explicit promotion.
6. **Success-based billing** as cost metadata separate from semantic yield.
7. **Usage statistics** for operations, never as item-level provenance.

### REJECT

1. Disabling TLS certificate verification for Proxy Endpoint.
2. Treating provider `done`, origin `2xx/4xx`, or parser `12000` as semantic
   success, freshness, or permission.
3. Agent-controlled arbitrary target URLs, redirect destinations, headers,
   cookies, POST bodies, callback URLs, storage URLs, templates, or notes.
4. Long-lived cloud credentials embedded in `storage_url`.
5. Silent automatic rendering or parser mutation without provenance.
6. Depending on provider result retention as Curiosity's archive.
7. Using managed scraping as Curiosity's crawler frontier or rights-policy
   authority.

### DEFER

1. **Oxylabs production adapter** pending the data-retention/use override, DPA/
   security/procurement review, and controlled contract validation.
2. **Sensitive/confidential/personal data** pending explicit retention,
   training/use, deletion, region, and subprocessor terms.
3. **Proxy Endpoint** unless a narrowly trusted TLS-interception model and real
   migration need exist; canonical JSON APIs are safer and richer.
4. **Self-healing in production** until immutable versioning and rollback can be
   proven.
5. **Target POST/browser interaction** until an approved side-effect threat
   model and destination policy exist.

## 12. Unknowns and pre-adoption checks

### Contract and privacy

1. Obtain a signed override of GC §4.3.9: no retention, independent use, model
   training, or derivative use of customer requests/results beyond defined
   service delivery and short operational retention.
2. Obtain current DPA, subprocessor list/regions, transfer mechanism, per-artifact
   and log retention, deletion SLA, breach deadline, audit evidence, backup
   deletion, and post-termination certificate terms.
3. Clarify collected-output ownership/license, target-rights allocation,
   confidentiality precedence, and limits/indemnity in the applicable SoW.

### API contract (only a separately approved no-cost benign fixture test)

4. Obtain normative OpenAPI/JSON schemas and maximum URL/body/result/XHR/action/
   batch limits; validate unknown enums/fields defensively.
5. Clarify cancellation, idempotency, queue deadlines, duplicate submission,
   result deletion, and maximum retention.
6. Clarify callback signing, retries, duplicates, ordering, replay window, event
   IDs, and source-IP update behavior.
7. Verify each proposed output's `url`, final URL/redirect chain, timestamps,
   status, encoding/media type, truncation, and forced-render fields.
8. Verify parser preset immutability, self-heal activation/rollback/changelog,
   dedicated-parser versioning, schema-change notice, and warning preservation.

### Freshness, security, and operations

9. Obtain a written cache/revalidation contract and whether origin contact can
   be required and evidenced; otherwise retain `freshness_unknown`.
10. Confirm SSRF controls for submission URL, redirects, browser subrequests,
    callbacks, storage, parser-generation example URLs, and `fetch_resource`.
11. Confirm safe TLS trust for Proxy Endpoint, API credential scope/rotation,
    dashboard MFA/audit logs, and customer-visible security-report scope.
12. Require role/principal-based cloud delivery; verify secret redaction,
    object-ownership/encryption, duplicate upload, partial upload, retry, and
    callback versus upload outcome.
13. Reconcile per-job provider result, usage stats, invoice, render/media bytes,
    and domain throttling under strict dollar/result/byte kill switches.

No live target-bypass or paid quality test is authorized by this research.

## 13. Documentation drift and contradictions

These are contract-test inputs, not claims about runtime behavior:

1. **Realtime formats:** the Realtime page says it always returns the default
   output and directs callers to Push-Pull for other available outputs, while the
   Multi-format page documents Realtime query-parameter retrieval of multiple
   types. **UNKNOWN:** which combinations are authoritative [S2][S12].
2. **HTTP result links:** multiple Push-Pull examples return `http://` links even
   though documented endpoints and safe use are HTTPS. Never follow scheme/host
   from an untrusted callback; construct HTTPS URLs from trusted config [S3].
3. **Universal input examples:** Cloud Storage examples use `query` with a URL,
   while principal integration documentation describes URL-based universal
   requests with `url`. Validate the normative schema [S3][S15].
4. **Scheduler result vocabulary:** run documentation gives “failed” as an
   example `result_status`, while the job and schedule tables enumerate
   `pending`, `done`, and `faulted`. Parse unknown future states safely [S3][S18].
5. **Result Aggregator sample:** its info example shows `max_result_count:
   1048576` after a create example using 10,000, without documenting a count
   maximum. Only byte/time maxima are explicit [S14].
6. **Legal URL drift:** DPA cross-links refer to older General Conditions paths,
   while the current public GC page uses another URL. Preserve access dates and
   copies during procurement [S24-S25].

## 14. Bounded curiosity pass

Scoring: 1–5 for relevance (R), decision value (V), novelty (N), and cost (C;
higher means more costly). Only public, in-frame, clean-room threads were
eligible. The pass stopped on **coverage + saturation**: remaining material
questions need private contract evidence or separately authorized testing.

| Thread | R/V/N/C | Decision and result |
|---|---:|---|
| General Conditions data-retention/use rights | 5/5/5/2 | **Pursued.** Found GC §4.3.9 permitting retention and sole-discretion use; made it a procurement blocker [S24]. |
| Parser preset mutation/self-healing | 5/5/4/2 | **Pursued.** Found CRUD, stats, required schema/example URLs, and changelog, but no immutable execution-version field in result examples [S8]. |
| Freshness/cache/origin-contact evidence | 5/5/4/2 | **Pursued to saturation.** No public guarantee/control found; negative result retained. |
| Callback authenticity/exactly-once behavior | 5/4/3/2 | **Pursued.** Only callbacker IP discovery found; signature/replay/retry semantics remain unknown [S3]. |
| Cloud credential and object-name handling | 5/5/4/2 | **Pursued.** Found named principals for GCS/S3, credential-in-URL patterns for other stores, and arbitrary input template interpolation [S15][S20]. |
| Independently inspect SOC 2/pentest control evidence | 4/4/3/4 | **CURIOSITY_NO_GO:** detailed evidence is access-controlled and requires procurement authority; vendor representations retained as medium confidence. |
| Infer anti-bot/CAPTCHA/fingerprint algorithms | 1/1/3/5 | **CURIOSITY_NO_GO:** unnecessary, proprietary/bypass-adjacent, and outside the clean-room interoperability frame. |
| Live target success, geo, parser, or cache benchmark | 3/4/2/5 | **CURIOSITY_NO_GO:** credentials/requests/paid testing were prohibited; vendor claims are not treated as empirical evidence. |
| Inspect SDKs or hidden endpoints | 2/2/3/4 | **CURIOSITY_NO_GO:** public wire contract is the relevant boundary; source/license inspection was not authorized. |
| Survey Web Unblocker/AI-Crawler/AI-Map | 1/1/1/3 | **CURIOSITY_NO_GO:** explicitly excluded except dependencies; no dependency required their contracts. |
| Broad case-law or competitor comparison | 2/3/2/5 | **CURIOSITY_NO_GO:** outside the declared product-contract decision; counsel/market work is separate. |

## Sources

All sources are first-party Oxylabs materials accessed **2026-08-17**. Product,
security, scale, consent, and quality statements are vendor representations
unless the text expressly describes an independently examined certification.

- **[S1]** Oxylabs, [Quick Start: Web Scraper API](https://developers.oxylabs.io/get-started/quick-start-web-scraper-api.md).
- **[S2]** Oxylabs, [Web Scraper API — Realtime](https://developers.oxylabs.io/products/web-scraper-api/integration-methods/realtime.md).
- **[S3]** Oxylabs, [Web Scraper API — Push-Pull](https://developers.oxylabs.io/products/web-scraper-api/integration-methods/push-pull.md).
- **[S4]** Oxylabs, [Web Scraper API — Proxy Endpoint](https://developers.oxylabs.io/products/web-scraper-api/integration-methods/proxy-endpoint.md).
- **[S5]** Oxylabs, [JS Rendering & Browser Control](https://developers.oxylabs.io/products/web-scraper-api/features/js-rendering-and-browser-control.md).
- **[S6]** Oxylabs, [Headers, Cookies, Method](https://developers.oxylabs.io/products/web-scraper-api/features/http-context-and-job-management/headers-cookies-method.md).
- **[S7]** Oxylabs, [User Agent Type](https://developers.oxylabs.io/products/web-scraper-api/features/http-context-and-job-management/user-agent-type.md).
- **[S8]** Oxylabs, [Parser Presets](https://developers.oxylabs.io/products/web-scraper-api/features/custom-parser/parser-presets.md).
- **[S9]** Oxylabs, [Dedicated Parsers](https://developers.oxylabs.io/products/web-scraper-api/features/result-processing-and-storage/dedicated-parsers.md).
- **[S10]** Oxylabs, [Proxy Location](https://developers.oxylabs.io/products/web-scraper-api/features/localization/proxy-location.md).
- **[S11]** Oxylabs, [Capturing Network Requests (Fetch/XHR)](https://developers.oxylabs.io/products/web-scraper-api/features/result-processing-and-storage/output-types/capturing-network-requests-fetch-xhr.md).
- **[S12]** Oxylabs, [Multi-format Output](https://developers.oxylabs.io/products/web-scraper-api/features/result-processing-and-storage/output-types/multi-format-output.md).
- **[S13]** Oxylabs, [Markdown Output](https://developers.oxylabs.io/products/web-scraper-api/features/result-processing-and-storage/output-types/markdown-output.md) and [Download Images](https://developers.oxylabs.io/products/web-scraper-api/features/result-processing-and-storage/output-types/download-images.md).
- **[S14]** Oxylabs, [Result Aggregator](https://developers.oxylabs.io/products/web-scraper-api/features/result-processing-and-storage/result-aggregator.md).
- **[S15]** Oxylabs, [Cloud Storage](https://developers.oxylabs.io/products/web-scraper-api/features/result-processing-and-storage/cloud-storage.md).
- **[S16]** Oxylabs, [Generating parsing instructions via API](https://developers.oxylabs.io/products/web-scraper-api/features/custom-parser/generating-parsing-instructions-via-api.md).
- **[S17]** Oxylabs, [Custom Parser — Getting started](https://developers.oxylabs.io/products/web-scraper-api/features/custom-parser/getting-started.md).
- **[S18]** Oxylabs, [Scheduler](https://developers.oxylabs.io/products/web-scraper-api/features/scheduler.md).
- **[S19]** Oxylabs, [Client Notes](https://developers.oxylabs.io/products/web-scraper-api/features/http-context-and-job-management/client-notes.md).
- **[S20]** Oxylabs, [Cloud Storage — File name templating](https://developers.oxylabs.io/products/web-scraper-api/features/result-processing-and-storage/cloud-storage/file-name-templating.md).
- **[S21]** Oxylabs, [Web Scraper API Response Codes](https://developers.oxylabs.io/products/web-scraper-api/response-codes.md).
- **[S22]** Oxylabs, [Web Scraper API Traffic and Billing](https://developers.oxylabs.io/products/web-scraper-api/usage-and-billing/billing-information.md).
- **[S23]** Oxylabs, [Web Scraper API Rate Limits](https://developers.oxylabs.io/products/web-scraper-api/usage-and-billing/rate-limits.md).
- **[S24]** Oxylabs, [General Conditions of oxylabs, UAB Services Agreement](https://oxylabs.io/legal/general-conditions-of-oxylabs-services-agreement), updated 2024-12-12.
- **[S25]** Oxylabs, [Data Processing Agreement](https://oxylabs.io/legal/oxylabs-data-processing-agreement), updated 2022-12-01.
- **[S26]** Oxylabs, [Privacy Policy](https://oxylabs.io/legal/privacy), updated 2024-10-14.
- **[S27]** Oxylabs, [Web Scraper API Usage Statistics](https://developers.oxylabs.io/products/web-scraper-api/usage-and-billing/usage-statistics.md).
- **[S28]** Oxylabs, [Web Scraper API Pricing](https://oxylabs.io/products/scraper-api/web/pricing).
- **[S29]** Oxylabs, [Risk and Legal Compliance](https://oxylabs.io/risk-and-legal-compliance).
- **[S30]** Oxylabs, [Trust Center](https://trust.oxylabs.io/).
- **[S31]** Oxylabs, [Acceptable Use Policy](https://oxylabs.io/legal/oxylabs-acceptable-use-policy), updated 2024-06-25.
- **[S32]** Oxylabs, [Web Scraper API Restricted Targets](https://developers.oxylabs.io/products/web-scraper-api/restricted-targets.md).
- **[S33]** Oxylabs, [Know Your Customer Policy](https://oxylabs.io/kyc-and-safety).

## Confidence summary

- **High:** documented endpoints, state values, fields, browser instruction
  bounds, parser/output forms, batch/rate/aggregation limits, billing rules,
  public prices, and published contract/AUP/DPA language.
- **Medium:** logical architecture decomposition and uninspected vendor security/
  KYC/certification representations.
- **Low/unknown:** cache/origin-contact behavior, maximum payload/result/job
  bounds, attempt lineage, callback guarantees, exact payload/log retention,
  subprocessor regions, actual proxy choice/geo, parser/runtime versions,
  empirical quality/availability, and account-specific contractual exceptions.
