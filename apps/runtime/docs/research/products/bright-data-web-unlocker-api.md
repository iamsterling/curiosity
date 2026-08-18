# Bright Data Web Unlocker API: clean-room reverse engineering

**Research/access date:** 2026-08-17
**Scope:** Bright Data Web Unlocker API only, including the proxy, policy,
rendering, asynchronous-delivery, and account controls required to explain its
public behavior. Browser API, Web Scraper API, SERP API, and raw proxy products
are considered only where Bright Data uses them to define a boundary.
**Method:** public first-party documentation, OpenAPI pages, pricing, SLA,
security materials, privacy policy, DPA, MSA, and AUP. No account, credentials,
free or paid request, target test, traffic interception, access-control bypass,
provider-code inspection, or implementation was used. This is behavioral
clean-room analysis, not a benchmark or a reconstruction of evasion methods.

## Executive verdict

Web Unlocker is an **outcome-oriented, single-URL acquisition gateway**, not a
plain forwarding proxy and not a browser-automation API. A caller submits a
public URL; Bright Data can select an exit network/location, synthesize request
identity, manage cookies, solve CAPTCHAs, render JavaScript, reject block pages,
and retry alternative configurations before returning raw content, a JSON
envelope, Markdown, or a PNG screenshot. The provider calls the result a
success and normally charges once per successful request. [S1][S4][S7]

**Decision: ADAPT / DEFER (high confidence).** Adapt the explicit separation of
transport, provider, and origin outcomes; sync/async modes; typed error layers;
zone-scoped policy; bounded retained async results; and request-level debug
evidence. Defer provider adoption until contract tests and written procurement
answers resolve status semantics, retry/attempt evidence, output bounds,
caching, payload retention/reuse, webhook authentication, and session behavior.

**Do not adopt** Bright Data's success label as Curiosity's truth or permission
decision. A delivered page can still be stale, incomplete, semantically wrong,
an origin error page, transformed, or unlawful to collect. The public contract
does not provide a redirect chain, exact acquisition timestamp, attempt ledger,
content digest, cache declaration, transformation version, or stable customer-
controlled session. [S3][S5][S6]

## 1. Decision frame and evidence policy

The decision is:

> Can Web Unlocker safely serve as an optional bounded page-acquisition adapter
> behind Curiosity's provider-neutral retrieval contract, and which policy,
> evidence, freshness, security, and budget responsibilities must Curiosity
> retain?

Bounded sub-questions:

1. What are the synchronous, asynchronous, and native-proxy contracts?
2. Which target method, body, header, geo, render, and output controls exist?
3. What do “success,” retries, unblocking, and billing mean externally?
4. Is geo or session continuity controllable and observable?
5. What freshness, cache, provenance, and retention evidence is available?
6. Which limits, prices, security, privacy, legal, and target-rights constraints
   affect an adapter decision?
7. What architecture can be inferred without inspecting proprietary internals?
8. Which lessons should Curiosity adopt, adapt, reject, or defer?

Labels:

- **FACT** — stated or shown by a cited first-party source.
- **INFERENCE** — clean-room explanation consistent with public behavior, not a
  claim about Bright Data's private implementation.
- **RECOMMENDATION** — a Curiosity design, operations, or procurement action.
- **UNKNOWN** — not established by the reviewed public sources.

Confidence is **high**, **medium**, or **low**. Performance, scale, consent, and
compliance claims remain vendor assertions unless the cited artifact itself is
an independent certification or audit report.

## 2. Product and trust boundary

**FACT (high):** Web Unlocker accepts one URL and returns content from one
request. It does not expose clicking, scrolling, form filling, page navigation,
or a persistent browser; Bright Data directs those use cases to Browser API.
It directs search-engine result collection to SERP API. [S1][S8]

**FACT (high):** Bright Data describes five managed functions behind one call:
proxy-network selection, request headers/fingerprints, CAPTCHA and challenge
handling, retries with alternative configurations, and success-only charging.
The pricing page adds TLS, HTTP/2, cookie, browser/OS fingerprint, timing, and
response-content checks to its description of emulation and validation. These
are vendor descriptions, not independently verified performance facts. [S1][S7]

**INFERENCE (high):** The useful abstraction is `acquire(url, policy)`, with the
provider free to choose HTTP or browser-backed execution. It is not a byte-
transparent proxy contract because it may alter request identity, retry, render,
solve a challenge, validate content, and transform output.

**RECOMMENDATION (high):** Curiosity must keep target authorization, robots and
rights policy, freshness requirements, semantic validation, provenance, retry
budget, and final acceptance outside this provider. Provider unblocking is an
execution capability, never a policy authority.

## 3. Request contracts

### 3.1 Synchronous direct API

**FACT (high):** The documented endpoint is:

```text
POST https://api.brightdata.com/request
Authorization: Bearer <API key>
Content-Type: application/json
```

The OpenAPI schema requires `zone`, `url`, and `format`. [S2]

| Field | Public contract | Finding |
|---|---|---|
| `zone` | string, required | Logical product/configuration boundary; carries targeting rules, output preferences, permissions, premium-domain and custom-feature settings. |
| `url` | absolute public HTTP(S) URI, required | Direct validation rejects a missing protocol; private/reserved destinations are documented as blocked. |
| `format` | `raw \| json`, required | `raw` returns content directly; `json` wraps `status_code`, origin-like `headers`, and `body`. |
| `method` | string, optional; default shown as GET | Target method. The schema does not enumerate methods. |
| `country` | ISO 3166-1 alpha-2, optional | Requested proxy country; omission lets the zone/system choose. |
| `data_format` | `markdown \| screenshot`, optional | Transforms HTML to Markdown or returns PNG screenshot. |
| `render` | string enum `"true" \| "false"`, optional | Forces browser rendering when true; documented to increase latency materially. |
| `debug` | boolean, optional, default false | Requests `x-brd-debug` response evidence. |

**FACT (high):** A first-request guide additionally shows a `body` field for a
target POST payload; feature examples additionally show a `headers` object, but
neither appears in the synchronous OpenAPI `PostBody`. Custom headers/cookies
are ignored unless the corresponding zone feature is enabled and values are
pre-approved. [S2][S3][S4]

**UNKNOWN / CONTRACT DRIFT (high importance):** The accepted synchronous target
methods, maximum request/body/header counts and sizes, binary body encoding,
redirect behavior, supported URL schemes after redirects, and authoritative
schema for `body` and `headers` are not defined consistently. The OpenAPI also
exposes an `async` query boolean on `/request`, while the operational async guide
uses different endpoints and schemas. [S2][S5]

**RECOMMENDATION (high):** Treat current OpenAPI plus no-cost contract results as
the adapter authority, not examples. Reject unknown fields and methods locally;
permit GET initially; require separate policy for any other target method,
especially POST because it can create side effects. Never pass agent-supplied
cookies or headers through
without an allowlist and target-specific approval.

### 3.2 Synchronous response

**FACT (high):** `format=json` is shown as:

```json
{
  "status_code": 200,
  "headers": {"content-type": "text/plain; charset=utf-8"},
  "body": "..."
}
```

`format=raw` returns the target body directly. Markdown is text; screenshots are
PNG bytes. Native proxy access returns the target body directly. [S1][S2][S4]

**FACT (high):** Direct API status is layered. Once a request reaches Unlocker,
the outer HTTP response can be `200 OK` while `x-brd-status-code` carries the
unlocker/origin result such as 4xx or 5xx. Pre-unlock validation/auth failures
use real outer 400/401. Native proxy mode uses the outer status directly. [S6]

**FACT (high):** Absence of `x-brd-error` means a received response came from the
target, including target-origin 4xx/5xx pages delivered as-is. Unlocker errors
use `x-brd-error-code`; passed-through proxy-layer errors use `x-brd-err-code`
and `x-brd-err-msg`, with `Proxy-Status` for selected errors. [S6][S12]

**RECOMMENDATION (high):** Normalize at least:

```text
transport_outcome
provider_policy_or_execution_outcome
origin_http_outcome
artifact_outcome (raw | rendered | markdown | screenshot; complete | partial)
semantic_acceptance (Curiosity-owned)
```

Never use outer 200, absence of a provider error, or `billed=true` as the sole
success condition.

### 3.3 Asynchronous API

**FACT (high):** Async is a zone feature with this lifecycle: [S5][S9][S10]

1. `POST /unblocker/req?zone=<zone>` with bearer auth and required `url`.
2. Receive `{ "response_id": "..." }`.
3. Poll `GET /unblocker/get_result?response_id=<id>`; 202 means pending, 200
   returns the result, 401 means invalid authentication, and 404 means not found.
4. Optionally receive a completion notification at `webhook_url`, then pull the
   body by `response_id`.

The async submit OpenAPI also exposes free-form `method`, `headers`, string or
JSON-object `body`, two-letter `country`, `webhook_url`, `webhook_method`,
`webhook_data`, and `debug`. It does not expose synchronous `format`,
`data_format`, or `render`. [S9]

**FACT (high):** Bright Data recommends polling after 20 seconds, then 10, then
5-second intervals, and may rate-limit excessive polling. Typical processing is
stated as up to five minutes but may reach eight hours at peaks. Results are
retained for up to 48 hours from submission. [S5]

**FACT (high):** A webhook is only a readiness notification, not delivery of
the content. The shown POST body contains `status`, `response_id`, and
`request_url`; caller-provided `webhook_data` is echoed unchanged. [S10]

**UNKNOWN (high importance):** No reviewed public contract specifies:

- idempotency keys or duplicate submission detection;
- cancellation, priority, hard execution deadline, or explicit expired state;
- webhook signature, secret, event ID, replay protection, source IP list,
  retry/backoff schedule, ordering, or delivery guarantee;
- ownership checks if `zone`/`customer` are omitted during result retrieval;
- response deletion before the 48-hour retention ceiling;
- parity of output/render controls between sync and async.

**INFERENCE (high):** Async is a retained request/result queue, not a batch job
system. `response_id` is both correlation handle and retained-result locator;
the webhook is an unauthenticated hint under the public contract.

**RECOMMENDATION (high):** Assume at-least-once notification and duplicate
submission. Poll the authenticated result endpoint as source of truth; use an
unguessable caller nonce in `webhook_data`; authenticate callbacks at a Curiosity
gateway; deduplicate by internal job ID plus `response_id`; expire local waiting
state before provider retention; and do not place secrets in callback metadata.

### 3.4 Native proxy interface

**FACT (high):** Native access uses `brd.superproxy.io:44445` and a zone username
and password. Country and some control flags are encoded in the username; output
controls use `x-unblock-*` request headers. New setups use Bright Data's CA on
port 44445. Direct API access needs no Bright Data CA. [S3][S11][S20]

**FACT (high):** Bright Data says direct and native access return identical
results and are billed at the same rate. Yet their transport, authentication,
status placement, output envelope, TLS trust, and supported control expression
are observably different. [S1][S3][S11]

**SECURITY FACT (high):** Native HTTPS interception requires the client to trust
Bright Data's root CA so Bright Data can decrypt, inspect/rule-process, and
re-encrypt target traffic. Documentation also offers examples that disable TLS
verification. [S20]

**RECOMMENDATION — REJECT NATIVE MODE (high):** Prefer bearer-authenticated
direct API. Do not install a provider root CA globally and never disable TLS
verification. Native mode enlarges credential-leak, certificate-trust, status-
normalization, and observability risks without a demonstrated Curiosity need.

## 4. Proxy selection, geo, identity, and sessions

### 4.1 Managed routing and identity

**FACT (high, vendor description):** Web Unlocker selects the “most effective”
proxy network for a target and manages IP rotation, TLS/network fingerprints,
HTTP headers/user agents, HTTP/2, cookies, browser/OS fingerprint emulation,
CAPTCHAs, retries, and content verification. [S1][S7]

**INFERENCE (high):** The customer requests an outcome, not an exit class.
Datacenter/residential/ISP/mobile choice, peer rotation, challenge workflow, and
possibly HTTP-versus-browser execution are internal planning decisions unless a
contractual zone feature constrains them. This prevents an adapter from claiming
a specific peer class or ordinary-browser equivalence.

### 4.2 Geolocation

**FACT (high):** Direct sync accepts `country`; async accepts `country`; native
access uses `-country-<lowercase ISO2>` in the username. `country-eu` asks for a
random peer from a provider-defined “EU” pool. That pool's published list
includes non-EU countries and territories, so it is not a reliable legal-EU
constraint. If no location is supplied, the system/zone selects an
optimal/default location. `x-brd-debug.peer_country` reports the used peer
country. [S2][S4][S13][S21]

**FACT (medium):** The generic geo page documents country, city, state, ASN, and
ZIP controls for proxy products, but the Web Unlocker direct schemas expose only
country. Feature docs mention Amazon-specific city/ZIP headers that simulate a
user-selected locality and require custom controls; they are not general exit-
location guarantees. [S4][S13]

**RECOMMENDATION (high):** Model geo as `requested_country` plus
`provider_observed_country`, not verified location. Preserve the debug country
when enabled, sample independently if jurisdiction/location is consequential,
never use `country-eu` as a data-residency or EU-jurisdiction guarantee, and do
not infer city/ZIP from target-site personalization controls.

### 4.3 Session behavior

**FACT (high):** Web Unlocker manages cookies as part of unblocking. Default
caller-supplied headers/cookies are disregarded; custom ones require a zone
feature and compliance pre-approval, and login/authentication cookies are
forbidden. [S4]

**FACT / CONTRADICTION (medium):** The Web Unlocker error page says country and
“session options” move into native username flags. However, the current direct
sync and async OpenAPI schemas expose no session ID; generic Residential proxy
session guidance says caller session pinning is a proxy-product feature and does
not work for scraping-automation products such as Web Unlocker. [S2][S6][S21]

**UNKNOWN (high importance):** Public sources do not establish a stable,
customer-controlled Web Unlocker session contract: what state is retained, its
scope (domain/zone/account/source IP), TTL, rotation/failover behavior, cookie
jar rules, concurrency ordering, or whether native `-session-*` is supported.
No persistent browser state should be inferred.

**RECOMMENDATION — DEFER (high):** Treat each call as logically stateless. Do not
use Web Unlocker for pagination or flows requiring identity/cookie continuity
until Bright Data supplies a written current contract and a no-cost test confirms
it. Never emulate account login through custom cookies.

## 5. Rendering and transformations

**FACT (high):** `render="true"` forces JavaScript rendering using a browser and
can substantially increase response time. `x-brd-debug.render` reveals whether
the returned page was browser-rendered or came from a single HTTP request. [S2][S4]

**FACT (high):** `data_format=markdown` live-converts HTML to Markdown.
`data_format=screenshot` returns PNG. A custom `x-unblock-expect` can wait for a
CSS selector, text, or body criterion; observed provider waits range from 30 to
150 seconds, and docs recommend a client timeout of at least 180 seconds. [S4][S6]

**FACT (high):** Fragment-bearing URLs can be submitted directly; native mode
also exposes `x-unblock-url-fragment`. [S4]

**INFERENCE (high):** Because URL fragments are not sent in ordinary HTTP
requests, fulfillment requires provider-side fragment interpretation or
browser-like handling. The exact execution rule is not specified.

**UNKNOWN (high importance):** The public contract does not define:

- whether screenshot or Markdown always forces rendering;
- viewport, device pixel ratio, full-page extent, image dimensions/byte cap;
- DOM serialization point, iframe/shadow-DOM inclusion, resource blocking,
  network-idle criterion, or maximum render/navigation duration;
- Markdown converter, version, options, links/images/table handling, or truncation;
- response/body size caps and truncation markers;
- legal/semantic combinations of `format`, `data_format`, and `render`;
- whether origin response headers remain meaningful after rendering/transformation.

**INFERENCE (high):** Raw HTTP bytes, serialized rendered DOM, Markdown, and
screenshot are different artifacts. A rendered or transformed body cannot be
represented faithfully as the target's original HTTP response even if the JSON
envelope contains target-like headers.

**RECOMMENDATION (high):** Preserve artifact type and derivation explicitly:
`origin_body? -> rendered_dom? -> markdown?` and `rendered_page -> screenshot`.
Store raw HTML as evidence where policy permits; hash every received artifact;
mark transformation version `provider-unknown`; never call Markdown “raw.”

## 6. Retry, success, throttling, and error semantics

### 6.1 Provider retries

**FACT (high):** Bright Data retries failed attempts with alternative
configurations until it classifies a request as successful. It rejects detected
CAPTCHA/protection pages (`reject_block`), failed challenge solves
(`resolve_failed_*`), and blocking statuses (`http_status`) rather than silently
returning those as useful content. [S1][S6]

**FACT (high):** Documentation distinguishes retryable peer/unlock failures from
deterministic target/configuration failures. A caller retry may help for
`reject_block`, `resolve_failed_*`, and sometimes rejected origin status; it does
not help for invalid target TLS, DNS failure, unavailable constrained-country
peers, unsupported/policy-blocked configuration, or persistent expect failures.
[S6]

**UNKNOWN (high importance):** No attempt count, retry deadline, backoff,
alternative-selection policy, per-attempt peer/render choice, attempt statuses,
or accumulated target load is returned. “One request” can therefore represent
multiple target attempts.

**INFERENCE (high):** Success-only billing aligns incentives around provider
classification, but hides target-side request amplification. Curiosity cannot
derive politeness, exact target load, or evidentiary replay from the final result.

**RECOMMENDATION (high):** Put every provider call inside Curiosity-owned wall-
time, cost, URL, redirect, and concurrency budgets. Retry only typed transient
classes and only within a caller-level attempt ceiling. Ask Bright Data for an
aggregate internal attempt count and elapsed time; absent that, record target
load as unknown rather than “one fetch.”

### 6.2 Auto-throttling and rate limits

**FACT (high):** Web Unlocker monitors target success and begins throttling below
a default 70% threshold. With custom headers/cookies enabled, the threshold can
be configured. `sr_rate_limit`/429 indicates this control. Bright Data also
documents target-domain health throttles and an unfunded-account default limit
of 1,000 requests/minute. [S3][S6][S12][S19]

**FACT (medium):** The pricing page advertises unlimited concurrency. That does
not negate auto-throttling, account limits, target health controls, service
capacity, latency, or budget. [S7]

**RECOMMENDATION (high):** Interpret “unlimited concurrency” only as absence of a
listed plan cap. Enforce lower Curiosity per-origin and global concurrency, honor
provider throttles, add randomized backoff, and use circuit breaking. Never use
concurrency claims as permission to increase target pressure.

### 6.3 Debug and success-rate telemetry

**FACT (high):** Optional `x-brd-debug` can expose `req_id`, bytes up/down,
`billed`, destination IP, relayed request-header names, opaque peer identifier,
peer country, render flag, and, when applicable, CAPTCHA solved/type. Async
returns it on result collection only if requested at submission. [S4]

**FACT (high):** An authenticated endpoint returns a seven-day success-rate
statistic per domain or wildcard TLD. Bright Data's SLA defines success rate as
ability to access/process selected public page elements and excludes degradation
caused by client customization; it is not an accuracy/completeness SLA. [S4][S18]

**RECOMMENDATION (high):** Preserve `req_id`, billed flag, byte counts, render,
CAPTCHA state, and peer country in restricted telemetry. Redact destination IP,
peer identifier, custom-header names where sensitive, target query strings, and
credentials from ordinary logs. Treat aggregate success rate as routing health,
not document quality.

## 7. Caching, freshness, provenance, and retention

### 7.1 What the response can prove

**FACT (high):** JSON output can carry an origin-like status, headers, and body;
debug adds request correlation and execution metadata. Async adds `response_id`
and a 48-hour retained result. [S2][S4][S5]

**FACT (high):** The sample target response contains `cache-control: no-store`
and a `date` header, but these are properties of that sample origin response,
not a Web Unlocker freshness guarantee. [S2][S5]

**UNKNOWN (high importance):** No reviewed source establishes:

- whether Web Unlocker caches/reuses target bodies, challenge state, cookies,
  browser artifacts, DNS, or transformed Markdown;
- cache key dimensions, TTL, bypass/revalidation controls, `Age`, or hit/miss;
- exact fetch start/end time or provider clock;
- requested-to-final URL, redirect chain, canonical URL, or redirect policy;
- response completeness, truncation, content length after decoding, or digest;
- an attempt ledger, selected proxy class, or verified exit location;
- stable parser/render/Markdown versions.

**FACT / LEGAL CONTEXT (high):** The MSA mentions an optional “cache proxy” for
Proxy Services and warns cached data may not be current. Current Web Unlocker
docs expose no cache option, and this clause does not prove Web Unlocker caching.
[S14]

**INFERENCE (high):** Web Unlocker offers operational traceability, not complete
provenance. `req_id` lets Bright Data investigate; it does not let Curiosity
replay the hidden acquisition decisions. Async retention is result availability,
not source freshness or archival integrity.

### 7.2 Required Curiosity evidence envelope

**RECOMMENDATION (high):** Curiosity should add and own:

- normalized requested URL and policy-approved target;
- request start/end times from Curiosity's clock;
- provider/product/zone logical ID and sync/async/native mode;
- internal job ID, `response_id`, and provider `req_id`;
- transport, provider, origin, and semantic outcomes separately;
- requested geo and debug-observed country;
- provider-reported render/CAPTCHA/billed flags and byte counters;
- artifact kind, media type, received byte length, cryptographic digest;
- declared transformation chain and `provider-version-unknown` where needed;
- response headers after secret/hop-by-hop filtering;
- partial/truncated/redirect/cache fields explicitly `unknown` unless proven;
- acquisition retention class and provider 48-hour expiry for async results.

For replay/evidence use, store received raw bytes in Curiosity-controlled storage
subject to rights and retention policy. Do not rely on Bright Data's result
retention or support correlation as an archive.

## 8. Limits, pricing, availability, and cost model

Public prices are volatile list prices observed on 2026-08-17, not a quote.

**FACT (high):** [S3][S5][S7][S18][S19]

| Dimension | Public statement | Decision significance |
|---|---|---|
| Free tier | 5,000 shared credits/account/month; one Web Unlocker call consumes one credit; no card; unused credits do not roll over | Shared with SERP, Web Scraper, Scraper Studio, and MCP; not an isolated adapter budget. |
| PAYG | $1.50 per 1,000 successful requests | “Successful” is provider billing classification. |
| Scale | $499/month includes 383K requests; $1.30/1K additional | Commitment/list price; premium domains separate. |
| Premium domains | Predefined harder domains billed at a higher zone-displayed rate; list updated quarterly with stated 30-day email notice | Target mix can change unit economics. Public exact premium rate was not exposed in reviewed docs. |
| Custom features | Enabling manual headers/cookies or expect features bills 100% of attempts, success or failure | Zone-level toggle changes billing semantics. |
| Concurrency | Marketing says unlimited | Not a safe operational bound. |
| Unfunded rate | 1,000 requests/minute default | Removed after adding funds; other health throttles remain. |
| Async latency/retention | Typically ≤5 minutes, may reach 8 hours; retained up to 48 hours | Requires local deadline and timely collection. |
| Render timeout guidance | Client should allow at least 180 seconds for documented waits | Not a provider hard maximum. |
| Zone limits | Daily/monthly spend or traffic cap; action at cap is configurable | Provider control exists, but enforcement precision/lag is not specified on the Web Unlocker page. |
| SLA | Commercially reasonable 99.9% network uptime; 5% credit at 99.0–99.9%, 10% below 99%, capped at lower of percentage or $1K/$2K | Network uptime, not per-domain success or semantic quality; credits are sole remedy. |

**UNKNOWN (high importance):** No reviewed authoritative contract gives maximum
URL length, request body, response body, rendered DOM, screenshot, redirects,
sync duration, queued jobs, async submissions, webhook attempts, or target-domain
concurrency. Marketing also says “typically 100%” while docs headline 98%; neither
is a generally applicable SLA. [S1][S7]

**RECOMMENDATION (high):** Budget expected and worst-case values separately:
provider calls, provider-classified successes, customer retries, hidden target
attempts (unknown), premium-domain multiplier, render duration, received bytes,
and artifact storage. Use Curiosity hard caps below provider limits; isolate a
zone per environment/policy; disable auto-recharge in evaluation.

## 9. Security, privacy, and legal/ToS risk

This section identifies design and procurement risk, not legal advice.

### 9.1 Platform and credential security

**FACT (medium):** Bright Data states ISO/IEC 27001:2022, ISO 27017, ISO 27018,
SOC 2 Type II (under NDA), public SOC 3, TLS 1.3/minimum 1.2 in transit, AES-256
at rest, AWS multi-AZ, RBAC, employee MFA, annual penetration testing, and a
2025 test that included Web Unlocker. Certification/audit scope is stronger
evidence than product marketing but does not answer payload retention or every
adapter control. [S17]

**FACT (high):** API keys can have expiration and one of five broad permission
profiles; `User` permits API use without billing/configuration management. A key
is displayed once and refresh invalidates the old key. Zone passwords and API
keys are separate authentication surfaces. [S11]

**RECOMMENDATION (high):** Use direct API, a dedicated expiring `User` key, a
zone per environment, secret-manager storage, egress restricted to
`api.brightdata.com`, key rotation tests, and target allowlists. Never put keys,
zone passwords, target query secrets, `x-brd-debug`, or bodies in ordinary logs.

**FACT (high):** Bright Data documents blocking private/reserved addresses,
unsupported ports, and zone allow/denylists. [S6][S12]

**UNKNOWN (high importance):** The public contract does not define DNS-rebinding
protection, checks on every redirect hop/subresource, cloud-metadata blocking,
maximum redirects, regional processing, customer IP allowlisting for API keys,
or Web Unlocker request-log retention/deletion.

**RECOMMENDATION (high):** Curiosity must pre-resolve and policy-check target
hostnames, reject literal/private/link-local/reserved destinations and unsafe
ports, re-check redirects, and cap redirects and bytes even if the provider also
claims policy blocks. Rendering creates subrequests not visible in the public
contract; treat it as a materially larger SSRF/egress surface.

### 9.2 Privacy and payload use

**FACT (high):** Bright Data's privacy policy covers account/KYC identifiers,
IDs, payment details, IPs, and possibly recorded compliance calls. Retention is
purpose/legal-need based, not fixed. It states Bright Data does not rent or sell
User Data, while its California notice says it may have sold the category
“Identifiers” in the prior 12 months. [S15]

**FACT (high):** The public DPA provides processor obligations, confidentiality,
breach notice without undue delay, deletion on request/termination subject to
law, general subprocessor authorization and transfer safeguards. The reviewed
two-page DPA does not itself identify subprocessors/regions or give a fixed
product payload/log retention period. [S16]

**FACT / CONTRACT RISK (high):** The MSA's “Proxy Services and Scraping Browser
API” terms say Bright Data may retain data the client collected and use it for
its own purposes in its sole discretion. Web Unlocker is not named in that
heading, but Bright Data describes it as using proxy infrastructure and offers a
native proxy mode. Applicability to Web Unlocker is therefore **legally material
and publicly ambiguous**, not safely dismissible. [S1][S3][S14]

**RECOMMENDATION — PROCUREMENT BLOCKER (high):** Before sensitive or production
use, require an order-form/DPA statement that explicitly covers Web Unlocker and
sets: no independent reuse/model training; purpose limitation; payload, URL,
header, cookie, debug and request-log retention; deletion SLA; regions and
subprocessors; incident deadline; support-access controls; output ownership; and
post-termination handling.

### 9.3 Target rights, access controls, and acceptable use

**FACT (high):** The AUP forbids collection of nonpublic/behind-login data,
illegal/fraudulent/abusive activity, account/content fakery, ticket bots, spam,
click fraud, and violation of law or third-party rights. Bright Data may block
adult, government, harmful, and other content at its discretion. [S22]

**FACT (high):** Immediate/no-KYC mode can enforce target `robots.txt`; the error
guide says full access/KYC can remove that provider check. Custom cookies cannot
be for login/authentication. Social-account management is unsupported. [S1][S4][S6]

**FACT (high):** The MSA puts legal/privacy/third-party-rights responsibility on
the client, disclaims accuracy, completeness, non-infringement, security and
uninterrupted service, limits liability to one prior month of fees, and requires
client indemnity for specified third-party claims. It also prohibits reverse
engineering, decompilation, derivative work, and mapping Bright Data IPs. [S14]

**INFERENCE (high):** Provider willingness, CAPTCHA solving, premium-domain
access, KYC, or absence of a provider policy error is not target permission and
does not resolve robots, contract, copyright, database right, privacy, or purpose
limits.

**RECOMMENDATION (high):** Curiosity must make a target-policy decision before
the provider call and must never use KYC or an unblocking feature to override a
deny. Prohibit login, paywall/access-control material, personal-account state,
and side-effecting methods. Counsel should review each production use category.

### 9.4 Untrusted output

**FACT (high):** Bright Data's own security guidance says scraped web content
must be treated as untrusted before entering an LLM because of prompt injection.
[S17]

**RECOMMENDATION (high):** Isolate retrieved bytes from instructions and tools;
sanitize active content for display; parse under CPU/memory/size limits; disable
automatic execution; label source boundaries; and require downstream factual
validation. A provider-unblocked page is still hostile external input.

## 10. Clean-room architecture inference

The following is **INFERENCE**, not a claim about Bright Data private source code
or a guide to reproducing anti-bot behavior.

```text
Customer
  |-- direct bearer request ------------------------------|
  |-- native zone credentials / intercepted TLS ----------|
                                                          v
                API / superproxy ingress
                   auth + validation
                          |
                 zone policy/control plane
       permissions | geo | premium | custom | budget | billing
                          |
                acquisition orchestrator
         target policy / health / success classifier
                          |
       +------------------+-------------------+
       |                  |                   |
  route/peer planner  request identity   optional browser worker
  network + country   headers/cookies    JS/challenge/screenshot
       |                  |                   |
       +---------- retries / validation -----+
                          |
                     target web
                          |
              raw/rendered/transformed body
                          |
             sync response OR async result store
                                |       |
                              poll   webhook hint
```

Evidence:

- common direct/native outcomes but different ingress/auth/status surfaces [S1-S3][S6];
- zone-bound options, budgets, custom controls, premium permission and billing [S3][S4];
- explicit network, identity, browser, CAPTCHA, retry and content checks [S1][S7];
- debug fields crossing routing, rendering, billing and challenge layers [S4];
- typed proxy versus unlocker error families [S6][S12];
- separate queued `response_id`, retained result, and callback notification [S5][S9][S10].

**INFERENCE (high):** A zone is the central policy/billing profile. A planner
chooses an acquisition recipe; a classifier decides whether to accept, retry, or
reject; sync and async place different delivery façades over substantially the
same acquisition outcome.

**INFERENCE (medium):** Rendering likely uses an internal browser-worker pool,
but worker implementation, isolation, browser version, and reuse are undisclosed.
No stronger claim is warranted.

**Clean-room boundary:** Curiosity should learn from the externally visible
control/evidence split, not reproduce fingerprinting, CAPTCHA, target-specific
evasion, or provider IP mapping. Those are out of scope and contractually
restricted. [S14]

## 11. Curiosity implications and verdict ledger

### ADOPT

1. **Layered outcomes** — transport, provider, origin, artifact, semantic result.
2. **Explicit artifact intent** — raw, rendered, transformed text, screenshot.
3. **Typed stable errors** — policy/configuration, authentication, target,
   transient peer, challenge, render, throttle.
4. **Async retained-result handle** — submission and retrieval are separate.
5. **Webhook as hint** — authenticated pull remains source of truth.
6. **Logical provider profiles** — isolate credentials, features, and budgets.
7. **Request correlation and cost evidence** — ID, bytes, billed, render/CAPTCHA.

### ADAPT

1. **Zone** → adapter-owned provider profile; never leak into Curiosity's core ABI.
2. **Provider retries** → only inside Curiosity wall-time, cost and origin budgets.
3. **Success-only billing** → cost outcome, never evidence-quality outcome.
4. **Geo targeting** → requested and observed claims, not verified location.
5. **Markdown/screenshot** → derivative artifacts linked to raw evidence.
6. **Async 48-hour retention** → ingestion deadline, not archival policy.
7. **Debug header** → restricted provenance metadata with redaction.
8. **Auto-throttling** → an additional signal beneath owned per-origin pacing.

### REJECT

1. Native proxy mode, provider root-CA installation, or disabled TLS validation.
2. Automatic policy escalation to CAPTCHA solving, premium domains, custom
   cookies/headers, POST, or forced rendering without explicit approval.
3. Treating outer 200, provider “success,” or billed status as valid content.
4. Login/authentication cookies, behind-login retrieval, and account automation.
5. Depending on undocumented stable sessions or hidden retries for pagination.
6. Depending on provider retention, support IDs, or transformations as evidence.
7. Passing arbitrary URLs/headers/cookies/webhooks from an agent to the adapter.

### DEFER

1. Provider adoption pending the checks below.
2. Render/screenshot capability pending hard byte/time/subrequest bounds.
3. Async webhooks pending authenticity and delivery semantics.
4. Sensitive/personal data pending explicit no-reuse and retention terms.
5. Session-dependent workflows pending a coherent current contract.
6. CAPTCHA-enabled use pending target-class legal/policy review.

## 12. Unknowns and pre-adoption checks

Only free/no-cost tests against approved public test domains are contemplated;
no test is authorized by this report.

### Contract and procurement

- Get an explicit definition of Web Unlocker under the MSA and override any
  retention/independent-reuse right.
- Obtain current DPA, subprocessor list/regions, transfer mechanism, deletion
  SLA, fixed incident deadline, SOC 2, and penetration-test scope/results.
- Clarify output ownership/license, target-right responsibilities, indemnity,
  support access to payloads, URL/header/body/debug log retention, and training.
- Obtain an authoritative premium-domain schedule/rate and change protection.

### Request/response contract

- Validate accepted sync fields against current schema: methods, `body`,
  `headers`, cookies, `async=true`, and invalid combinations.
- Measure/document maximum URL, request body, response body, header count/size,
  redirects, decompression, screenshot, rendered DOM, and wall time.
- Confirm final URL/redirect availability, header fidelity, content encoding,
  binary body handling, truncation signaling, and origin versus provider status.
- Confirm every error family and status location in direct mode; parse unknown
  codes and future `Proxy-Status` changes safely.

### Execution and provenance

- Ask for cache policy and per-request hit/miss/bypass/revalidation evidence.
- Ask for provider acquisition timestamp, elapsed time, internal attempt count,
  selected network class, and final URL/redirect chain.
- Verify debug-field stability, privacy classification, retention, and redaction.
- Verify render flag truth for auto-render, forced render, Markdown and screenshot.
- Record output hashes and compare repeated approved test fetches only to detect
  observable nondeterminism, not to fingerprint evasion systems.

### Async and operations

- Verify duplicate submission, result ownership, expiry boundary, 404 semantics,
  queue delay, eight-hour case, and whether deletion/cancellation exists.
- Obtain webhook signing, source authentication, retry schedule, timeout, replay,
  duplicate/order guarantees, URL validation, and redirect behavior.
- Confirm rate-limit headers, `Retry-After`, zone-limit enforcement lag, kill
  switch, usage export, and premium/custom billing transitions.

### Security and policy

- Confirm private/reserved/link-local/metadata and unsafe-port blocking at initial
  URL, DNS re-resolution, redirect, and render subrequest layers.
- Confirm API-key resource/zone scoping, source-IP allowlisting, audit logs, key
  rotation propagation, and request-log deletion.
- Test only policy-approved public URLs; do not solve a challenge, bypass robots,
  use login state, map peers, or probe provider internals.

## 13. Material contradictions and negative results

1. **Success rate:** docs claim 98%; pricing FAQ says “typically 100%”; SLA
   thresholds describe support severity, not a 98% or 100% guarantee. [S1][S7][S18]
2. **Identical access methods:** content may be equivalent, but auth, TLS trust,
   status placement, envelope, and controls differ materially. [S1][S3][S6]
3. **Sync schema:** `body` and `headers` appear in guides/examples but not the
   synchronous OpenAPI `PostBody`. [S2][S3][S4]
4. **Async entry:** `/request` advertises an `async` query parameter, while the
   async guide/reference uses `/unblocker/req` and `/unblocker/get_result`. [S2][S5][S9]
5. **Async parity:** async schema omits `format`, `data_format`, and `render` even
   though sync exposes them; retrieved examples are JSON envelopes. [S2][S9][S10]
6. **Session:** error docs mention native session options, but no direct schema
   exposes one and generic proxy docs exclude Web Unlocker from customer sticky
   session controls. Treat session continuity as unknown. [S2][S6][S21]
7. **Native port drift:** current setup and CA docs use 44445; error docs still
   show 33335. Old 33335 certificates expire 2026-09-25. [S3][S6][S20]
8. **Pricing-page scope drift:** pricing copy mentions batch/scheduled jobs,
   JSON/CSV parsing and delivery features not represented in the reviewed Web
   Unlocker API contract. Do not infer Web Scraper features from shared copy. [S7]
9. **Cache:** MSA mentions optional cache proxy for Proxy Services; Web Unlocker
   docs expose no cache contract. No cache behavior was established. [S14]
10. **“EU” geo pool:** docs call it EU targeting but list countries/territories
    outside the EU. It cannot enforce an EU-only legal boundary. [S13][S21]
11. **Hard limits:** no authoritative public body, output, redirect, concurrency,
    or total sync timeout cap was found. This negative result is retained.

## 14. Bounded curiosity pass

Scoring is relevance/value/novelty/cost, each 1–5. The pass was authorized only
within the declared public-source, Web-Unlocker-only frame. It stopped at
**coverage + saturation**: every requested dimension had primary-source coverage,
and remaining high-value gaps require account access, contractual answers, or
prohibited active testing.

| Thread | R/V/N/C | Decision/result |
|---|---:|---|
| Async contract/webhook authenticity | 5/5/4/1 | **Pursued.** Found 48-hour retention, poll guidance, webhook-hint shape, and no public signing/retry contract. [S5][S9][S10] |
| Session continuity contradiction | 5/5/5/2 | **Pursued.** Direct schemas have no session; docs conflict on native behavior. Retained as unknown, not guessed. [S2][S6][S21] |
| Cache/freshness evidence | 5/5/4/2 | **Pursued.** No Web Unlocker cache contract found; MSA cache-proxy clause is insufficient. [S14] |
| MSA payload-retention applicability | 5/5/5/1 | **Pursued.** Consequential clause found, but Web Unlocker naming is ambiguous; elevated to procurement blocker rather than overstated. [S14] |
| “EU” geo-pool membership | 5/4/5/1 | **Pursued.** Published membership contradicts an EU-only interpretation; rejected as a residency control. [S13][S21] |
| Output/body/render hard limits | 5/5/3/2 | **Pursued.** Official docs remained silent; retained as a material negative result. |
| Paid success/latency/geo benchmark | 4/4/2/5 | **CURIOSITY_NO_GO:** prohibited paid/credentialed testing and would not establish legal permission. |
| CAPTCHA/protection bypass experiment | 2/2/2/5 | **CURIOSITY_NO_GO:** outside clean-room contract analysis and contrary to no-bypass boundary. |
| Peer/IP mapping or fingerprint reconstruction | 1/2/4/5 | **CURIOSITY_NO_GO:** unnecessary, invasive, and expressly restricted by MSA. [S14] |
| Provider SDK/source inspection | 2/2/3/4 | **CURIOSITY_NO_GO:** public API documents were sufficient; user prohibited implementation and reverse engineering beyond clean-room behavior. |
| Third-party benchmark/review survey | 2/2/2/3 | **CURIOSITY_NO_GO:** lower evidentiary value than primary contracts/docs after saturation. |
| Broad litigation/case-law survey | 3/4/3/5 | **CURIOSITY_NO_GO:** outside the bounded product-contract frame; counsel review deferred. |

## Sources

All sources are first-party Bright Data materials accessed **2026-08-17**.
Product and performance statements are vendor assertions unless the cited
artifact is an independent audit/certificate hosted by Bright Data.

- **[S1]** Web Unlocker API overview — https://docs.brightdata.com/scraping-automation/web-unlocker/introduction
- **[S2]** Synchronous Web Unlocker OpenAPI (`POST /request`) — https://docs.brightdata.com/api-reference/rest-api/unlocker/unlock-website
- **[S3]** Direct and native first request — https://docs.brightdata.com/scraping-automation/web-unlocker/send-your-first-request
- **[S4]** Web Unlocker features, custom controls, rendering, debug, statistics — https://docs.brightdata.com/scraping-automation/web-unlocker/features
- **[S5]** Asynchronous request guide — https://docs.brightdata.com/scraping-automation/web-unlocker/your-first-async-request
- **[S6]** Web Unlocker error catalog and layered statuses — https://docs.brightdata.com/scraping-automation/web-unlocker/error-codes
- **[S7]** Web Unlocker pricing/product claims — https://brightdata.com/pricing/web-unlocker
- **[S8]** Web Unlocker best practices/product boundary — https://docs.brightdata.com/scraping-automation/web-unlocker/bestpractices
- **[S9]** Async submit OpenAPI (`POST /unblocker/req`) — https://docs.brightdata.com/api-reference/rest-api/unlocker/request
- **[S10]** Async result OpenAPI and webhook setup — https://docs.brightdata.com/api-reference/rest-api/unlocker/get-results and https://docs.brightdata.com/scraping-automation/web-unlocker/setup-webhooks
- **[S11]** Authentication and key roles — https://docs.brightdata.com/api-reference/authentication
- **[S12]** Proxy errors, policy/rate limits, RFC 9209 migration — https://docs.brightdata.com/proxy-networks/errorCatalog
- **[S13]** Proxy geolocation targeting — https://docs.brightdata.com/api-reference/proxy/geolocation-targeting
- **[S14]** Master Service Agreement, updated 2026-06-16 — https://brightdata.com/license
- **[S15]** Privacy Policy, reviewed 2026-05-14 — https://brightdata.com/privacy
- **[S16]** Data Protection Addendum — https://brightdata.com/static/web/Bright-Data-Data-Protection-Agreement.pdf
- **[S17]** Security and compliance — https://docs.brightdata.com/general/security/security-overview
- **[S18]** Service Level Agreement, updated 2026-05-24 — https://brightdata.com/sla
- **[S19]** Free tier and unfunded rate limit — https://docs.brightdata.com/general/account/billing-and-pricing/free-tier
- **[S20]** Native-mode SSL certificate and interception model — https://docs.brightdata.com/general/account/ssl-certificate
- **[S21]** Residential proxy FAQ/session boundary — https://docs.brightdata.com/proxy-networks/residential/faqs
- **[S22]** Acceptable Use Policy — https://brightdata.com/acceptable-use-policy
