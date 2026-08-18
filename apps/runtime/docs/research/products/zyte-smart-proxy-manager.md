# Zyte Smart Proxy Manager: legacy product and clean-room contract dossier

**Research and source-access date:** 2026-08-17  
**Product names:** Zyte Smart Proxy Manager (SPM), formerly Crawlera  
**Scope:** SPM as a standalone managed-proxy product, its externally observable
request/session/rotation/ban-handling contract, operations and commercial model,
and its end-of-life migration boundary. Zyte API is covered only where it now
replaces or emulates SPM.  
**Method and boundary:** Public first-party Zyte documentation and current Zyte
legal pages. No account, credentials, trial, paid request, target probe, traffic
interception, access-control bypass, proprietary source inspection, or
implementation. Historical behavior is described only where still published by
Zyte; no archive was treated as a current contract.

## Decision frame

The decision is not whether to buy SPM: new sign-up is closed and Zyte calls the
product end-of-life. The decision for an owned crawler and Curiosity is:

> Which SPM contract patterns remain useful, what compatibility risk survives in
> legacy integrations, and which responsibilities must stay in an owned crawler
> rather than an opaque managed proxy?

Bounded sub-questions:

1. What did one proxy request mean, including retries, rotation, throttling,
   cookies, browser profiles, redirects, and success?
2. What did an SPM session preserve, when did it expire, and how did it interact
   with retries and geography?
3. What telemetry, errors, limits, pricing, and provenance were available?
4. What exactly was retired, what remains as a compatibility façade, and where
   do migration semantics diverge?
5. What security, privacy, rights, and operational constraints matter?
6. What minimum architecture follows from public behavior without claiming
   Zyte's private implementation?
7. Which lessons should Curiosity **adopt, adapt, reject, or defer**?

### Evidence labels

- **FACT** — directly stated in a cited first-party source.
- **INFERENCE** — a bounded clean-room explanation consistent with published
  behavior; not a claim about private implementation.
- **RECOMMENDATION** — an owned-crawler, Curiosity, or procurement choice.
- **UNKNOWN / NEGATIVE RESULT** — not established in the reviewed public
  sources; absence is not proof of absence.

Confidence is **high**, **medium**, or **low**. Vendor security, performance, and
compliance statements are vendor representations unless separately evidenced.
This is not legal advice.

## Executive verdict

**FACT (high):** SPM was a standard forward-proxy-shaped service that accepted a
target request, selected an outgoing address, applied a browser-like profile and
cookie policy, detected bans, retried with other addresses, throttled traffic,
and returned a target-like response or an SPM error. Datacenter plans charged
successful requests; optional residential access charged transferred bandwidth.
[S1-S7]

**FACT (high):** As of the access date, Zyte labels SPM **Legacy** and
**end-of-life**, permits no new sign-ups, and says Zyte API is replacing it. Zyte
planned a no-code migration of remaining SPM traffic on 2025-12-09: existing
hostnames and keys would resolve through a translation layer to Zyte API Proxy
Mode, while subscriptions became Zyte API Migration Plans. [S1][S8-S9]

**INFERENCE (high):** “SPM” can now mean two materially different things:

1. the retired execution platform described by the legacy contract; or
2. a legacy wire protocol and hostname translated onto Zyte API Proxy Mode.

The endpoint shape can survive while the implementation, billing system,
dashboard, retry behavior, and some defaults change. A successful unchanged
request is therefore not evidence that old operational semantics remain exact.

**RECOMMENDATION (high):** **REJECT SPM as a new dependency. ADAPT only its
bounded contract lessons. DEFER any legacy bridge until the actual account route
and agreement are verified.** For an existing integration, migrate deliberately
to a provider-neutral fetch adapter or explicit Zyte API interface; do not treat
DNS-level compatibility as a complete contract migration. Curiosity must retain
target authorization, frontier and politeness, retry/spend budgets, semantic
validation, evidence, and freshness authority.

The strongest transferable lessons are explicit attempt caps, typed transport
sessions, target-level pacing feedback, a clean/banned/failed distinction, and
separate compatibility façades. The strongest rejection criteria are opaque
multi-attempt “one request” provenance, suggestions to disable TLS verification,
side-effecting POST through hidden retries, provider-defined success as content
truth, and reliance on an EOL interface.

## 1. Lifecycle and current status

### 1.1 Product evolution

| Stage | First-party evidence | Current interpretation |
|---|---|---|
| Crawlera | SPM docs say Crawlera was the previous name and the terms are effectively interchangeable. [S1][S19] | Name lineage, not two products. |
| Legacy C plans | C10/C50/C100/C200 were discontinued at the beginning of 2020 and replaced by Starter, Basic, and Advanced. [S2] | Obsolete commercial generations can remain in configurations. |
| SPM plans | Published legacy docs name Starter, Basic, Advanced, and Enterprise. [S2] | Existing-account history, not a current offer. |
| Replacement | Every SPM legacy page warns that Zyte API is replacing SPM and new sign-up is impossible. [S1-S7] | Closed to new adoption. |
| EOL migration | Zyte says SPM is end-of-life and remaining traffic is moved to Zyte API Proxy Mode through DNS plus a semantics translation layer. [S8] | Product retirement with protocol compatibility. |

**FACT (high):** The EOL FAQ says the automigration was planned for Tuesday,
2025-12-09. It promises unchanged hostnames, request patterns, and existing SPM
keys; continued ban handling and rotation; dashboard migration; and no option to
remain on SPM for affected accounts. It says the old SPM plan maps to a Zyte API
Migration Plan with the same monthly commitment, a spending limit of twice that
commitment, and standard discounts. [S8]

**FACT (high):** The same FAQ says traffic to shared `proxy.crawlera.com` and
`proxy.zyte.com` endpoints would route through Zyte API Proxy Mode from December
9. It also told Enterprise customers they could avoid that automigration by
switching to a dedicated Enterprise hostname. Historical SPM usage would remain
available only for a limited period. [S8]

**CONTRADICTION / CURRENT-STATUS GAP (high):** The FAQ broadly says “all
remaining SPM traffic” is moving and “SPM Platform will then be retired,” but its
Enterprise answer permits continued dedicated-endpoint routing outside the
shared-endpoint migration. The reviewed public pages do not state a final
retirement date for dedicated Enterprise endpoints or confirm, with a dated
completion notice, that every planned migration completed. [S8]

**Conclusion (high confidence):** SPM is not a purchasable standalone product and
must be treated as retired/EOL. **UNKNOWN:** whether any dedicated Enterprise
execution path still runs old SPM infrastructure on 2026-08-17. For a specific
legacy account, DNS, dashboard labels, invoices, and written Zyte confirmation
are required; public docs do not settle the physical route.

### 1.2 Migration is compatibility, not equivalence

**FACT (high):** The deliberate migration guide identifies these differences:

- SPM is proxy-only; Zyte API has HTTP and proxy modes.
- SPM does not follow redirects; Zyte API follows them by default unless
  disabled.
- SPM uses concurrency throttling; Zyte API uses request-rate limits.
- SPM offers client-managed sessions; Zyte API adds server-managed sessions.
- SPM manually selects geo; Zyte API can select it automatically.
- Zyte API can use browser acquisition and offers rendering, screenshot,
  actions, capture, and extraction that SPM itself did not provide. [S9]

**FACT (high):** The explicit header map says six SPM controls have backward
compatibility in Zyte API Proxy Mode: cookies, job ID, profile,
profile-pass-through, region, and session. SPM's maximum-retries and timeout
controls are **not planned** there; no-ban-check is only marked planned. Error
compatibility covers only a listed subset of SPM errors. [S9]

**FACT (high):** The EOL automigration FAQ nevertheless says a translation layer
will map SPM behavior so calls “succeed as before.” It later warns that some
Scrapy 2.7.x plus `scrapy-crawlera` 1.6.x setups showed changed retry behavior or
higher request counts after automigration and recommends the current
`scrapy-zyte-smartproxy` library. [S8]

**INFERENCE (high):** These statements are reconcilable only as best-effort
compatibility, not a durable field-for-field guarantee. The special EOL
translation layer may emulate controls that direct Proxy Mode does not expose,
but observed post-migration request-count drift proves that compatibility can
depend on client behavior.

**RECOMMENDATION:** Pin the integration path explicitly:

```text
legacy_hostname + legacy_key + translation_layer
    != direct_Zyte_API_proxy_mode
    != Zyte_API_REST
```

Record which path produced every artifact. Never infer it solely from an old
hostname. Run migration acceptance only on an owned benign fixture under
separate authority, checking redirect, status, retry, cookie, session, geo,
header, latency, and billing semantics.

## 2. Observable proxy and request contract

### 2.1 Ingress and authentication

**FACT (high):** The standard proxy was `proxy.zyte.com:8011`, authenticated by
an API key as HTTP Basic proxy credentials with an empty password. Proxy
authorization was mandatory on ports 8010, 8011, and 8014; missing credentials
returned 407. Port 8014 provided an HTTPS-proxy interface that encrypted the
client-to-proxy connection. Total request-header size was capped at 100 KiB.
[S1]

**FACT (high):** SPM processed GET and POST, with a POST counted as one request
like GET. The published error contract capped responses at 500 MB, returning 541
`data_error` above that size. [S4][S12]

**UNKNOWN:** A normative list of every supported HTTP method, upload/body limit,
streaming semantics, HTTP/2 behavior, decompression transformations, connection
reuse, cancellation, idempotency, and redirect-body handling was not found.

**RECOMMENDATION:** An owned crawler should expose only GET/HEAD by default.
POST or any non-idempotent method must require a separate capability and must not
pass through a retrying proxy absent a written replay contract.

### 2.2 Browser profiles, headers, and cookies

**FACT (high):** `X-Crawlera-Profile` selected:

- `desktop` — random desktop browser profile and replacement of browser-specific
  caller headers; default on Starter, Basic, and Advanced;
- `mobile` — random mobile profile with the same replacement behavior; or
- `pass` — no profile and use all request headers. [S1]

`X-Crawlera-Profile-Pass` allowed named caller headers, such as
`Accept-Language`, to override a profile default. Profile superseded the older,
deprecated `X-Crawlera-UA`. [S1][S4]

**FACT (high):** `X-Crawlera-Cookies` controlled provider-side cookie tracking:
`enable` made internal cookies win, `disable` made caller cookies win, and
`discard` dropped all cookies; `discard` was the default on Starter, Basic, and
Advanced. Residential mode performed no internal cookie tracking and passed
cookies as-is. [S1][S5]

**INFERENCE (high):** SPM was not a transparent byte relay. The outgoing request
could differ in user agent, browser headers, cookies, source address, timing, and
attempt count. Returned content is therefore a provider-mediated acquisition
artifact, not evidence of one caller-defined HTTP exchange.

**RECOMMENDATION:** Curiosity should preserve requested versus effective request
metadata separately. If the effective profile/header/cookie set is not exposed,
mark it unknown. Never let provider-returned cookies flow into another task
without origin, purpose, tenant, and expiry binding.

### 2.3 Geography and address class

**FACT (high):** Datacenter addresses were the standard. Country could be set by
a region-specific SPM account/key or `X-Crawlera-Region`; an account could carry
multiple regions. Sessions and `X-Crawlera-Region` were incompatible. [S3][S13]

**FACT (high):** Residential was a separately enabled user/add-on, charged by GB.
It supported country, US state, and city headers, did not retry automatically,
and did not perform internal cookie tracking. Some peers might report `0.0.0.0`
instead of revealing their origin address. [S5]

**UNKNOWN:** Pool size, address ownership/supply chain, consent records,
requested-versus-actual exit evidence, fallback behavior, ASN/carrier, address
reuse, exact regions, and whether an auto-migrated legacy request can select a
different address class than old SPM.

**RECOMMENDATION:** Treat `requested_geo`, `provider_selected_geo`,
`observed_exit_geo`, and `target_localization` as different fields. Reject
residential as an automatic retry tier; require explicit use-case, supply-chain,
privacy, target, and cost approval.

### 2.4 Redirect and browser boundary

**FACT (high):** Zyte's migration comparison says SPM did **not** follow HTTP
redirects. [S9]

**FACT (high):** SPM did not natively return browser HTML, screenshots, actions,
or network captures. Zyte documented a separate open-source Headless Proxy that
sat between a caller browser and SPM, managed SPM sessions, blocked ads, and
downloaded static assets directly to reduce request cost and latency. Standard
SPM introduced artificial delays and often performed poorly when connected
directly to a headless browser. [S19]

**INFERENCE (high):** A page loaded through that helper had split provenance:
some requests traveled through SPM and some static assets connected directly.
Its rendered page was not an all-SPM observation. This is a client-side
composition layer, not a native browser capability of the standalone product.

**RECOMMENDATION:** Keep `fetch`, `render`, and `interact` separate. If a browser
uses mixed direct/proxied paths, record a subresource manifest or reject the
artifact for evidentiary use. Do not inherit Headless Proxy behavior into a
provider-neutral fetch contract.

## 3. Rotation, ban handling, retries, and pacing

### 3.1 Default rotation and success selection

**FACT (high):** Zyte described SPM as routing requests through an address pool,
introducing delays, discarding addresses when necessary, detecting bans, and
retrying from another proxy address. `X-Crawlera-No-Bancheck` disabled ban-rule
checking and passed through the received response. [S1-S2][S6]

**FACT (high):** The API reference says the default was three attempts and that
`X-Crawlera-Max-Retries` accepted 0-5, with 0 and 1 both producing one attempt.
The ban troubleshooting page instead says SPM retried five times by default
before returning 503. [S1][S6]

**CONTRADICTION (high):** Public first-party pages disagree on default attempt
count. Possible target, plan, or documentation-version differences are not
defined. No single numeric default is safe to encode.

**FACT (high):** After exhaustion, 503 `banned` meant all attempts failed and 503
`noslaves` meant no proxies were available. Banned and failed requests did not
count against the monthly successful quota; Zyte recommended client-side retry
of 503 up to five times. [S4][S6-S7]

**INFERENCE (high):** One caller request could cause multiple origin attempts,
followed by up to five additional caller retries if guidance was followed. With
the documented maxima, amplification could be substantial, while only the last
selected response was returned. Exact attempt timing, addresses, statuses, and
bodies were not exposed.

**RECOMMENDATION:** Curiosity should own a single cross-layer budget:

```text
max_provider_calls
max_total_origin_attempts_if_known
max_wall_time
max_request_and_response_bytes
max_cost
absolute_deadline
```

If provider attempts are hidden, set conservative provider-call limits and label
attempt provenance incomplete. Never stack library, scheduler, adapter, and
provider retries without a shared ledger.

### 3.2 Timeouts and target pacing

**FACT (high):** `X-Crawlera-Timeout` controlled each target attempt's response
timeout from 30,000 to 180,000 ms, default 30,000 ms; streaming applied the value
per chunk. Zyte separately recommended a 600-second client timeout because SPM
could throttle internally. [S1][S7]

**FACT (high):** SPM documented a soft delay limit of 120 seconds and a hard
limit of 1,000 seconds. At the soft limit it returned
`X-Crawlera-Next-Request-In`; ignoring it could lead to 503 with `Retry-After` at
the hard limit. [S1]

**FACT (high):** Standard plans were concurrency-limited and returned 429 when
the plan limit was exceeded. Enterprise was documented as having no concurrency
limit. [S4][S14]

**INFERENCE (medium-high):** SPM combined per-account capacity control with
target-aware pacing. The soft-delay feedback is a useful backpressure signal,
but a 1,000-second queue/delay is unsuitable for an interactive retrieval worker.

**RECOMMENDATION:** Adopt explicit target-level `not_before` feedback, but return
deferred work to the scheduler rather than hold a worker. Provider concurrency is
a ceiling, never permission to exceed the owned crawler's per-origin politeness
budget.

### 3.3 Success is not semantic quality

**FACT (high):** Dashboard and error docs classified outcomes as **clean**,
**banned**, or **failed**. Only clean requests counted against standard quotas.
[S4][S11]

**UNKNOWN:** The public sources do not define the complete ban signature set,
false-positive/negative policy, CAPTCHA-page classification, empty/partial-page
handling, target-specific rule versions, or whether every origin 2xx/3xx/4xx is
clean. `X-Crawlera-No-Bancheck` proves classification could be bypassed, but not
how it worked.

**RECOMMENDATION:** Map provider outcome separately from origin status and local
validation:

```text
transport_outcome
provider_outcome = clean | banned | failed | unknown
origin_status
content_validation = usable | blocked | empty | partial | wrong_type | unknown
policy_outcome
```

Provider “clean” does not prove completeness, truth, freshness, or permission.

## 4. Session contract

**FACT (high):** `X-Crawlera-Session: create` returned a server-generated ID in
the same header. Reusing the ID reused the same outgoing address. Sessions could
also be created, listed, and deleted at `/sessions`; listing returned a mapping
from session IDs to outgoing IPs. Invalid or expired IDs returned
`bad_session_id`. [S1][S3]

**FACT (high):** Sessions expired 30 minutes after the last request, with at most
5,000 active sessions. The same page documents a default 12-second delay between
requests on one address, possibly different on popular domains. Over-limit
requests could be delayed up to 15 minutes, and each excess request increased
delay. [S3]

**FACT (high):** Automatic retries were disabled inside a session because retry
on the same outgoing address was assumed unhelpful. Supplying
`X-Crawlera-Max-Retries` re-enabled them. Region selection could not be combined
with a session. [S3]

**INFERENCE (high):** The safe abstraction is **exit-address affinity**, not a
browser, user, login, TCP connection, or deterministic identity. Cookie state was
a separate control. The docs do not promise browser storage, TLS continuity,
header/profile continuity, concurrency serialization, or that a re-enabled retry
remains on the same address.

**RECOMMENDATION — ADOPT/ADAPT:** Model this as an opaque
`transport_session_handle` scoped to tenant, task, target, geo, provider, and
policy. Give it explicit idle and absolute expiry, concurrency rules, and
deletion. Do not expose provider IDs or outgoing addresses to an autonomous
agent, and do not use session affinity to emulate a person or retrieve
authenticated content by default.

## 5. Errors, bounds, and response evidence

### 5.1 Published error surface

| Class | Examples | Meaning / action |
|---|---|---|
| Caller/auth | 400 bad session; 401 bad URI/auth; 407 proxy auth; 413 >100 KiB headers; 470 unauthorized header | Do not retry unchanged. [S4] |
| Capacity/policy | 429 too many connections; 503 banned/no proxies/busy; 523 forbidden domain | Back off or stop; domain policy is not a network error. [S4] |
| Target/network | 502 DNS/unreachable/refused/reset; 504 response/message/connect timeout | Preserve raw class; retry only within owned bounds. [S4] |
| Output | 541 response >500 MB | Deterministic size failure for that representation. [S4] |
| Endpoint/config | 540 bad control-header value; 542 wrong endpoint | Configuration failure. [S4] |

**FACT (high):** Errors used `X-Crawlera-Error` plus a human-readable body, but
Zyte explicitly said internal error codes were subject to change and should only
be used for debugging. The error page itself contains defects such as a malformed
regions/sessions token and typographical descriptions. [S1][S4]

**RECOMMENDATION:** Preserve raw status/header/body safely but normalize into a
stable owned taxonomy. Unknown provider codes must not default to retryable.

### 5.2 Per-response debug evidence

**FACT (high):** `X-Crawlera-JobId` attached caller-defined tracking metadata.
`X-Crawlera-Debug` could return request time for only the **last retry** and the
actual user agent applied to that last attempt. [S1]

**NEGATIVE RESULT (high):** The reviewed response contract exposes no guaranteed
provider request ID, total attempt count, per-attempt timeline/address/status,
full effective headers/cookies, selected region, cache disposition, origin-contact
proof, acquisition timestamp, redirect chain, content digest, or billable cost.

**INFERENCE (high):** Last-attempt duration and user agent are debugging aids,
not a complete acquisition ledger. A caller job ID is correlation supplied by
the caller, not independent provider provenance.

**RECOMMENDATION:** Curiosity must create and retain its own immutable evidence
envelope:

```text
request_id, task_id, provider, adapter/path/version
requested_url, method, body_hash, request_policy_digest
requested_at, dispatched_at, received_at
requested/effective profile?, cookies?, geo?, address_class?
transport_session_scope, provider_session_id_secret_ref?
provider_job_id?, provider_outcome, origin_status?
attempt_count?, attempt_timeline?, retry_budget
headers/body byte_count and sha256, media_type, truncation
cache_policy and disposition=unknown unless evidenced
robots/terms/rights/purpose decision
estimated/actual cost?, provider_stats_reconciliation
```

Question marks are intentionally nullable. Unavailable evidence must remain
unknown rather than inferred from “clean.”

## 6. Observability and operations

### 6.1 Dashboard and Stats API

**FACT (high):** The SPM dashboard plotted clean/banned/failed requests,
concurrency, and average response time; could split by account or up to five
websites; and offered date ranges up to one year. Recent Requests held 14 days,
filtered by user/status, and allowed CSV export of the last 5,000 requests from
the prior two weeks. [S11]

**FACT (high):** The Basic-auth Stats API at
`crawlera-stats.scrapinghub.com/stats/` returned time-bucketed clean/failed
counts, p80 concurrency, p80 response time, traffic bytes, and optionally domain.
It supported account/domain filters, domain grouping, pagination, and granularity
down to five minutes. [S10]

**FACT (high):** The EOL migration moved reporting to the Zyte API dashboard;
legacy historical data was promised only for a limited period. The FAQ also says
stats could appear as SPM even when execution occurred through Zyte API Proxy
Mode. [S8]

**INFERENCE (high):** SPM observability was useful for capacity and target health
but not item provenance. Aggregated p80s hide tails; “stats appear as SPM” means
the reporting label does not identify the execution plane.

**RECOMMENDATION:** Adopt clean/banned/failed and target-level pressure telemetry,
but collect request-level local traces before sending. Export legacy history
before account retirement. Do not put target URLs, API keys, cookies, or response
bodies in ordinary logs; use redaction and restricted evidence storage.

### 6.2 Operational unknowns

No reviewed public SPM source establishes an availability SLA, status-history
retention, maintenance policy after EOL, metric freshness, dashboard/API
decommission date, per-target concurrency policy, retry contribution to
concurrency, or support sunset for old hostnames and keys.

## 7. Pricing and commercial model

**FACT (high):** SPM's published product generations were Starter, Basic,
Advanced, and Enterprise after the older C plans were discontinued. Standard
datacenter billing used successful/clean-request quota: banned and failed
requests did not count. Concurrency varied by plan; Enterprise was described as
unlimited by concurrency. Headless documentation explicitly says SPM was priced
per request. [S2][S4][S11][S14][S19]

**FACT (high):** Residential was a separately enabled user, incurred extra
charges, and was metered by GB transferred rather than successful requests.
Retries were off by default to reduce accidental bandwidth cost. [S5]

**FACT (high, current migration terms):** The EOL FAQ says an affected SPM
monthly commitment maps 1:1 into a Zyte API commitment, with a 2x spending
limit, standard discounts, domain-based pricing under the hood, and discounted
overage above commitment. Existing positive Zyte API and SPM commitments are
consolidated. [S8]

**NEGATIVE RESULT (high):** No current public standalone SPM list-price table was
found. The legacy account pages explain how an existing subscriber viewed or
modified a plan but publish no dollar amounts, quotas, or concurrency by tier.
Because sign-up is closed and SPM plans are converted, a current universal SPM
price per 1,000 requests does not exist in the reviewed public offer. [S17-S18]

**RECOMMENDATION:** For a legacy account, use the actual order form, final SPM
invoice, Migration Plan, discounts, domain-tier estimator, and hard spending
limit. Budget by provider calls, possible hidden attempts, bytes, wall time, and
usable artifacts—not “clean” requests alone. A 2x provider spending limit is not
an owned-crawler budget.

## 8. Security, privacy, and legal boundary

### 8.1 Transport security and CA trust

**FACT (high):** Port 8011 was an HTTP proxy endpoint; port 8014 offered an HTTPS
proxy to protect client-to-proxy traffic. Zyte says HTTPS targets use CONNECT and
calls the tunnel transparent, yet it also says clients may need to trust the Zyte
CA certificate. Its setup page offers disabling certificate verification as an
alternative. [S1][S15-S16]

**CONTRADICTION / UNKNOWN (medium-high):** The public wording does not precisely
explain when the private Zyte CA signs the proxy connection versus target
certificates, whether TLS is intercepted for ban inspection, or which flows are
byte tunnels. Requiring a private CA is a material trust expansion even without
asserting the exact internal termination topology.

**RECOMMENDATION — REJECT:** Never disable TLS or hostname verification. Use a
dedicated isolated trust bundle containing the reviewed Zyte CA only if a legacy
bridge is unavoidable; do not install it globally. Obtain certificate scope,
hostname constraints, key protection, rotation, revocation, and post-migration
behavior in writing. Keep proxy keys in a secret manager, and prohibit origin
Authorization, client certificates, and confidential cookies by default.

### 8.2 Credentials, arbitrary targets, and untrusted data

**INFERENCE (high):** A proxy accepting arbitrary URLs, caller headers/cookies,
POST bodies, redirects at the client layer, and up to 500 MB responses creates
SSRF/confused-deputy, secret disclosure, replay, decompression/size, malware,
prompt-injection, and cost-amplification risks. Provider domain restrictions are
not a substitute for Curiosity policy.

**RECOMMENDATION:** Resolve and revalidate destinations; reject private,
loopback, link-local, metadata, control-plane, and non-HTTP(S) addresses; bind
allowed ports and domains; cap bytes and decompression; quarantine binary
artifacts; sanitize active content; and treat every body/header as untrusted
external data. Retrieved content must never directly trigger tools or alter
policy.

### 8.3 Public legal and privacy terms

**FACT (high):** Current Zyte Terms define Service Data broadly as data extracted
through the services and permit use of Service Data and other service material
for product development and product training unless an applicable agreement
changes that position. Terms limit services to scraping publicly accessible
websites, place legality/ethical-use responsibility on the customer, permit Zyte
to stop target activity after complaints or legal/operational/business risk, and
do not grant copyright permission or warrant non-infringement. [S20]

**FACT (high):** The AUP prohibits unlawful or rights-violating collection,
unauthorized access, security testing, certain target-term violations, LinkedIn
scraping, and material interference. It also prohibits attempts to decipher,
decompile, reverse engineer, or discover service/software source. [S21]

**FACT (high):** The DPA describes the customer as controller and Zyte as
processor for Service Personal Data, requires lawful instructions/notices,
provides subprocessor and transfer terms, and says Security Event notice is
without undue delay and within 72 hours. Its public technical/organizational
measures include TLS 1.2 in transit, least privilege, centralized event logs,
daily vulnerability scans, incident management, ISO-27001-oriented risk
management, and ISO-27001-certified cloud providers. [S22]

**FACT (high):** The Privacy Policy gives purpose-based periods for ordinary
business data—support tickets typically four years, billing details seven years,
and service-usage logs as long as needed for security/integrity—but does not give
a single SPM request/response-content retention period. [S23]

**UNKNOWN:** Exact URL/header/body/cookie/failed-attempt/session/debug retention,
backup deletion, post-EOL deletion, processing regions, current subprocessors,
tenant isolation, whether old SPM data was used for training, and account-order
form overrides.

**RECOMMENDATION — PROCUREMENT BLOCKER:** Do not send credentials, private pages,
personal/confidential/unpublished data, or side-effecting payloads. For any
legacy bridge, obtain no-training/no-independent-use terms, exact content/log
retention and deletion, regions/subprocessors, assurance evidence, incident
terms, key controls, and post-retirement data-disposal commitments.

### 8.4 Target authorization

**NEGATIVE RESULT (high):** No reviewed SPM contract says the proxy automatically
enforced `robots.txt`, target crawl-delay, target terms, copyright/database
rights, personal-data purpose limits, or the owned crawler's request budget.

**RECOMMENDATION:** Curiosity must authorize before dispatch: public-access
status, target and purpose, robots snapshot/rule, per-origin pacing, target terms,
data category, rights/license, complaint/cease handling, retention, and budget.
An unblocked address or provider “clean” response confers no legal permission.

## 9. Clean-room architecture inference

The smallest logical architecture consistent with published behavior is:

```text
client crawler / browser helper
  -> HTTP or HTTPS proxy ingress
       auth + account/plan/header/concurrency gate
  -> target policy and pacing controller
       domain restrictions + delay / next-request feedback
  -> request composer
       browser profile + caller overrides + cookie policy + geo
  -> session/address allocator
       rotating datacenter pool | optional residential pool
       session ID -> sticky outgoing address
  -> attempt executor
       target timeout + status/content ban classifier
       bounded retry / address discard-and-rotate
  -> response/error selector
       target-like bytes or X-Crawlera-Error
       optional last-attempt time/user-agent debug
  -> usage and reporting pipeline
       clean/banned/failed + bytes + concurrency + latency + domain
```

These are roles, not claims about processes, data stores, vendors, algorithms,
or topology.

### A. Target-aware pacing controller — **medium-high confidence**

Evidence: popular-domain-specific session delays, soft/hard delay thresholds,
`Next-Request-In`, domain dashboards, and explicit polite-crawling explanation.
[S1][S3][S7][S11]

### B. Ban classifier and retry orchestrator — **high confidence logically**

Evidence: no-ban-check override, automatic multi-address retries, banned versus
failed outcomes, attempt limit, and final banned error. Classifier inputs and
rule updates remain unknown. [S1][S4][S6]

### C. Session mapping store — **high confidence logically**

Evidence: create/list/delete API, session-to-address mapping, idle expiry, 5,000
limit, and bad-ID errors. Storage technology and isolation are unknown. [S3]

### D. Separate reporting pipeline — **medium-high confidence**

Evidence: Stats API host, time aggregation, p80 values, dashboard retention, and
post-migration ability to label Zyte API execution as SPM. Reporting is not
synchronous item evidence. [S8][S10-S11]

### E. EOL compatibility gateway — **high confidence as a logical role**

Evidence: DNS rerouting, old-key authentication, SPM-to-Zyte header/behavior
translation, old stats appearance, and Zyte API billing migration. Exact routing
and implementation are unknown. [S8-S9]

**UNKNOWN / deliberately not inferred:** address-pool suppliers, ban signatures,
fingerprints, classifier/model type, CAPTCHA suppliers, private endpoints,
datacenter regions, queue/storage technologies, encryption boundaries, and
translation-layer source code.

## 10. Owned-crawler and Curiosity implications

### ADOPT

1. **Typed outcomes:** clean, banned, failed, policy-denied, and locally invalid
   are separate states.
2. **Explicit target pacing feedback:** turn `not_before` into scheduler state,
   not worker sleep.
3. **Bounded retry controls:** expose attempt, wall-time, byte, and cost limits.
4. **Transport session as a distinct resource:** short-lived affinity is not a
   browser or user.
5. **Requested/effective request distinction:** profile, cookies, geo, address
   class, and retries belong in provenance.
6. **Target and account operations views:** concurrency, latency distributions,
   failure class, and traffic are useful fleet signals.
7. **Compatibility façades are explicitly legacy:** migration fields must not
   become the provider-neutral core.

### ADAPT

1. SPM's one proxy call -> an owned acquisition record that acknowledges hidden
   attempts and hashes the selected artifact.
2. Last-attempt debug -> complete local timing plus nullable provider-attempt
   fields; never fabricate unavailable history.
3. Provider job/session IDs -> secret-bearing correlation metadata behind local
   stable IDs.
4. Browser profile -> typed `device_profile_requested` plus
   `effective_profile_unknown` unless evidenced.
5. Geo selection -> requested, provider-selected, observed-exit, and
   target-localized fields.
6. Clean-request billing -> cost per **usable, policy-approved artifact**, with
   provider reconciliation.
7. Error headers -> stable owned taxonomy plus raw provider diagnostics.

### REJECT

1. SPM as a new product or canonical interface: it is EOL and closed to sign-up.
2. DNS/translation compatibility as proof of semantic equivalence.
3. TLS verification disabling or a globally trusted private provider CA.
4. Opaque provider retries as one precisely evidenced origin observation.
5. Side-effecting POST through hidden retry/replay behavior.
6. Provider “clean” as content truth, freshness, completeness, or authorization.
7. Residential or changed profile/geo as silent escalation.
8. Holding workers through multi-minute provider throttling.
9. Aggregate dashboard/Stats records as item provenance.
10. Sending credentials, private pages, or sensitive payloads through this
    legacy boundary.

### DEFER

1. Any existing-account compatibility adapter until routing, terms, retirement,
   and actual Migration Plan are confirmed in writing.
2. Zyte API adoption itself to its separate product assessment; SPM's retirement
   does not automatically select the successor.
3. Residential access pending supply-chain, privacy, target, and cost review.
4. Browser/rendering use pending a distinct threat model; SPM's historical
   Headless Proxy pattern is not sufficient.
5. Controlled migration tests until separately authorized on owned benign
   fixtures with hard no-cost/spend bounds.

## 11. Unknowns and required checks

| Unknown / risk | Confidence now | Required check before reliance |
|---|---:|---|
| Whether all 2025-12-09 automigrations completed | Medium | Dated Zyte completion notice and account-specific written confirmation |
| Dedicated Enterprise old-platform retirement | Low | Contract/support answer and endpoint inventory |
| Whether a legacy hostname executes translation or old SPM | Low per account | DNS alone is insufficient; dashboard/billing/support evidence |
| Translation of retry and timeout controls | Low-medium | Written compatibility matrix; owned-fixture contract test if authorized |
| Redirect behavior after transparent migration | Medium risk | Confirm legacy translation preserves no-follow semantics |
| Default origin-attempt count | Low | Resolve conflict between three attempts and five retries |
| POST replay across provider/client retries | Low | Written no-replay/idempotency contract; otherwise prohibit |
| Complete attempt provenance | Low | Response/telemetry contract; assume unavailable |
| Cache and origin-contact/freshness behavior | Low | Written guarantee and explicit cache disposition |
| TLS interception and Zyte CA scope | Low-medium | Certificate architecture, names, rotation, revocation, isolation |
| Exact payload/log/session retention and EOL deletion | Low | DPA/order form, Trust Center, deletion schedule |
| Training/secondary use under the actual agreement | High that public Terms permit; low on override | Written no-training/no-independent-use amendment |
| Current subprocessors/regions/assurance scope | Low | Procurement package and current audit reports |
| Standalone SPM price | Not applicable publicly | Legacy invoice/order form; current Migration Plan governs |
| Historical dashboard and Stats API shutdown | Low | Export now; obtain decommission schedule |
| Effective profile, geo, address class, and outgoing headers | Low | Provider evidence fields or leave unknown |
| Robots/terms/rights enforcement | Low and non-authoritative anyway | Curiosity-owned policy gate regardless of provider answer |

## 12. Clean-room transfer rules

1. Transfer behavioral requirements and tests, not Zyte's private ban rules,
   fingerprints, pool knowledge, target recipes, or implementation.
2. Keep provider-neutral `FetchRequest`, `TransportSession`, `AttemptBudget`, and
   `EvidenceEnvelope` independent of `X-Crawlera-*` and `Zyte-*`; legacy headers
   belong only in an adapter specification.
3. Do not inspect service binaries, private interfaces, proprietary source, or
   protected traffic. The AUP/Terms prohibit service reverse engineering.
   [S20-S21]
4. The public Headless Proxy is a separate open-source dependency; no source or
   license review was performed, and no code was transferred here. [S19]
5. Do not probe protected targets, CAPTCHAs, residential peers, private networks,
   or old account-only surfaces. Future tests require a declared owned fixture,
   authority, budget, and legal/security review.
6. Re-check legal pages, EOL notices, compatibility map, CA, pricing plan, and
   account route immediately before any migration decision.

## 13. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1-5 for **relevance (R)**,
**decision value (V)**, **novelty (N)**, and **cost (C, lower is better)**.
Only public first-party, no-account checks were eligible. Priority was
approximately `R + V + N - C`.

| Thread | R/V/N/C | Result |
|---|---:|---|
| Is SPM merely deprecated or actually retired? | 5/5/4/1 | **Pursued.** Current docs establish EOL/no sign-up and planned 2025-12-09 translation; universal completion remains unconfirmed. [S1][S8] |
| Does unchanged wire protocol mean unchanged semantics? | 5/5/5/1 | **Pursued.** Header map, rate-model differences, and post-migration retry-volume warning disprove strict equivalence. [S8-S9] |
| Default attempt count contradiction | 5/5/4/1 | **Pursued to saturation.** API page says three attempts; troubleshooting says five retries. No governing qualifier found. [S1][S6] |
| Session meaning and retry interaction | 5/5/3/1 | **Pursued.** Exit affinity, idle expiry, delay, limit, CRUD, and retry-disable behavior established. [S3] |
| TLS/CA trust model | 5/5/4/2 | **Pursued.** CONNECT/tunnel and private-CA/disable-verification wording remain insufficiently reconciled; safe rejection retained. [S15-S16] |
| Current standalone price | 4/4/3/2 | **Pursued to negative result.** No public price table; product is closed and migration-plan economics supersede it. |
| Freshness/cache/per-attempt provenance | 5/5/4/2 | **Pursued to saturation.** Stats/debug/response docs expose no complete contract; unknown retained. |
| Exact dedicated Enterprise retirement date | 4/4/4/4 | **DEFER:** no public completion/decommission source found; requires account/vendor answer. |
| Inspect DNS or connect to legacy endpoints | 2/3/3/5 | **CURIOSITY_NO_GO:** would not prove account routing, and caller prohibited service testing/credentials. |
| Inspect Headless Proxy source for hidden behavior | 2/2/3/4 | **CURIOSITY_NO_GO:** separate software/license task; not needed to characterize documented SPM contract. |
| Infer ban signatures, address pools, or fingerprints | 1/1/4/5 | **CURIOSITY_NO_GO:** proprietary, bypass-adjacent, contract-irrelevant, and prohibited by clean-room purpose. |
| Trial/live ban or residential test | 1/2/3/5 | **CURIOSITY_NO_GO:** SPM sign-up closed; no credentials/paid tests/bypass authorized. |
| Account-only Trust Center and data deletion proof | 4/5/2/5 | **CURIOSITY_NO_GO:** unavailable in public no-account budget; retained as procurement gate. |
| Jurisdiction-specific scraping legality | 5/5/3/5 | **CURIOSITY_NO_GO:** counsel task beyond research authority; technical policy boundary retained. |

**Stop reason:** coverage plus saturation. Every caller-requested category has
primary-source support or an explicit negative result. Remaining material gaps
require an account-specific agreement, Zyte confirmation, assurance access,
counsel, or separately authorized owned-fixture testing. No autonomous follow-up
is authorized.

## 14. Sources

All sources are first-party Zyte materials accessed **2026-08-17**. Legacy docs
are authoritative for the behavior Zyte publishes, not proof that the old
execution platform remains live or that every migrated account behaves
identically.

- **[S1]** Zyte, “Smart Proxy Manager API.”
  <https://docs.zyte.com/smart-proxy-manager.html>
- **[S2]** Zyte, “What is Smart Proxy Manager.”
  <https://docs.zyte.com/smart-proxy-manager-get-started.html>
- **[S3]** Zyte, “Sessions.”
  <https://docs.zyte.com/smart-proxy-manager/sessions.html>
- **[S4]** Zyte, “Errors Reference.”
  <https://docs.zyte.com/smart-proxy-manager/errors.html>
- **[S5]** Zyte, “Residential.”
  <https://docs.zyte.com/smart-proxy-manager/residential.html>
- **[S6]** Zyte, “How to deal with bans or 503 response from Zyte Smart Proxy
  Manager?”
  <https://docs.zyte.com/smart-proxy-manager/troubleshooting/bans-or-503-response.html>
- **[S7]** Zyte, “Smart Proxy Manager Next Steps.”
  <https://docs.zyte.com/smart-proxy-manager-next-steps.html>
- **[S8]** Zyte, “SPM to Zyte API via Proxy Mode — Customer FAQ.”
  <https://docs.zyte.com/smart-proxy-manager/sunset.html>
- **[S9]** Zyte, “Migrating from Smart Proxy Manager to Zyte API.”
  <https://docs.zyte.com/zyte-api/migration/zyte/smartproxy.html>
- **[S10]** Zyte, “Smart Proxy Manager Stats API.”
  <https://docs.zyte.com/smart-proxy-manager/stats.html>
- **[S11]** Zyte, “Smart Proxy Manager Usage & Recent Requests.”
  <https://docs.zyte.com/smart-proxy-manager/account-and-billing/usage-stats-and-recent-requests.html>
- **[S12]** Zyte, “Sending POST request with Smart Proxy Manager.”
  <https://docs.zyte.com/smart-proxy-manager/next-steps/sending-POST-request-with-smart-proxy.html>
- **[S13]** Zyte, “Restricting Smart Proxy Manager IPs to a specific region.”
  <https://docs.zyte.com/smart-proxy-manager/next-steps/restricting-smart-proxy-ips.html>
- **[S14]** Zyte, “How to fix concurrency issues?”
  <https://docs.zyte.com/smart-proxy-manager/troubleshooting/concurrency.html>
- **[S15]** Zyte, “Fetching HTTPS pages with Smart Proxy Manager.”
  <https://docs.zyte.com/smart-proxy-manager/next-steps/fetching-https-pages-with-smart-proxy.html>
- **[S16]** Zyte, “Installing the Zyte CA certificate.”
  <https://docs.zyte.com/misc/ca.html>
- **[S17]** Zyte, “Smart Proxy Manager Account & Billing.”
  <https://docs.zyte.com/smart-proxy-manager-account-and-billing.html>
- **[S18]** Zyte, “Smart Proxy Manager FAQ.”
  <https://docs.zyte.com/smart-proxy-manager-faq.html>
- **[S19]** Zyte, “Using Headless Browsers with Smart Proxy Manager.”
  <https://docs.zyte.com/smart-proxy-manager/headless.html>
- **[S20]** Zyte, “Terms of Service.”
  <https://www.zyte.com/terms-policies/terms-of-service/>
- **[S21]** Zyte, “Acceptable Use Policy.”
  <https://www.zyte.com/terms-policies/acceptable-use-policy/>
- **[S22]** Zyte, “Data Processing Agreement.”
  <https://www.zyte.com/terms-policies/dpa/>
- **[S23]** Zyte, “Privacy Policy” (page states effective 2024-08-30).
  <https://www.zyte.com/terms-policies/privacy-policy/>

## 15. Confidence summary

- **High:** EOL/no-sign-up status; planned automigration shape; legacy proxy,
  header, session, error, stats, quota-meter, residential-meter, and migration
  contracts; public Terms/AUP/DPA language.
- **Medium:** logical control-plane decomposition; TLS trust-risk interpretation;
  completeness of negative searches over changing legacy docs; inference that
  old hostname identity no longer identifies the execution plane.
- **Low / unknown:** universal migration completion, dedicated Enterprise
  retirement, account-specific translation behavior, default attempt count,
  cache/freshness, full attempt provenance, exact TLS termination path,
  payload/log retention and deletion, effective geo/profile/address class,
  empirical quality, and current account-specific pricing or legal overrides.
