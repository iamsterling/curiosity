# Zyte API proxy mode: standalone clean-room dossier

**Research and primary-source access date:** 2026-08-17  
**Decision frame:** Can Zyte API proxy mode serve as a bounded Curiosity web-
acquisition adapter without making a proxy-shaped compatibility surface the
provider-neutral contract, or delegating permission, evidence, freshness,
security, retry, and spend authority to Zyte?  
**Scope:** Zyte API **proxy mode only**. The JSON/HTTP API, browser automation,
automatic extraction, Stats API, and legacy Smart Proxy Manager (SPM) are
covered only where they define proxy-mode behavior, omissions, pricing,
telemetry, or migration.  
**Method and access boundary:** public first-party documentation, migration and
sunset notices, pricing, Terms, AUP, DPA, Privacy Policy, plus IETF HTTP
standards. No account, key, free or paid call, target request, certificate
installation, traffic capture, protected endpoint, bypass experiment, SDK or
source inspection, or implementation. This is observable-contract analysis,
not a claim about private code, target-specific success, or legal advice.

## Executive verdict

**ADAPT only as a narrow legacy-ingress adapter; otherwise DEFER (high
confidence).** Proxy mode is a synchronous authenticated forward-proxy façade
at `api.zyte.com:8011`, with an HTTPS-proxy interface at port `8014`. It maps the
ordinary client URL, method, body, cookies, and most headers into Zyte API,
returns a direct body rather than a JSON/Base64 envelope, and exposes a small
control vocabulary through `Zyte-*` headers. It now supports raw HTTP and
serialized browser HTML, but not screenshots, actions, network capture,
JavaScript control, extraction, server-managed sessions, or echo data. [S1-S3]

The façade is useful precisely because it is **lossy**: existing proxy clients
can migrate with small changes, and remaining SPM traffic was routed through a
translation layer in December 2025. That convenience is not a sound neutral
architecture. Header interpretation, direct-body response rewriting, automatic
redirects, target-adaptive IP/geo/header/cookie choices, hidden ban handling,
and sparse per-item metadata collapse several acquisition layers into one
HTTP-looking exchange. [S1-S7]

The security boundary is material. Zyte documents installation of its own CA,
which is logically necessary for an intermediary that can inspect and rewrite
HTTPS target requests/responses. The common port-8011 examples use Basic proxy
authentication over an **HTTP proxy interface**; Basic credentials have no
confidentiality without an external secure transport. Port 8014 provides an
HTTPS proxy interface, but public docs do not provide a narrow proxy-only trust
store/rotation/pinning contract or explain every TLS leg and validation outcome.
This report therefore rejects port 8011 for credentials and rejects installing
the Zyte CA into a broad system/global trust store. [S1][S8][S17][S18]

**Curiosity verdict:**

- **ADOPT** the idea of a versioned compatibility ingress and explicit transport
  session, geo, IP-class, redirect, cookie, and render controls.
- **ADAPT** direct proxy responses into a Curiosity-owned evidence envelope with
  separate provider/origin/content outcomes, hashes, timestamps, policy and
  retry lineage, and explicit unknowns.
- **REJECT** proxy mode as the core contract, plaintext proxy authentication,
  broad CA trust, implicit residential/CAPTCHA escalation, indefinite retries,
  direct agent control of arbitrary methods/headers/cookies/bodies, and treating
  provider success or a target-looking status as source truth.
- **DEFER** any provider selection or sensitive/authenticated use until
  retention, training, TLS, egress, item provenance, status translation, and
  contractual checks are closed.

## 1. Bounded questions and evidence rules

1. What proxy protocols, authentication, methods, bodies, headers, cookies, and
   render controls are actually promised?
2. How are redirects, header rewriting, geo/IP choice, cookies, sessions, ban
   detection, CAPTCHA handling, and retries selected or surfaced?
3. What does a direct response prove about origin status, final URL, time,
   attempt, cache, TLS, and derivation?
4. Which limits, errors, prices, and migration translations affect bounded use?
5. What security, privacy, acceptable-use, and data-rights constraints follow?
6. What minimum architecture can be inferred from public behavior without
   reconstructing proprietary anti-ban methods?
7. Which lessons transfer cleanly into Curiosity?

Labels used below:

- **FACT** — directly supported by the cited primary source.
- **INFERENCE** — clean-room reasoning consistent with public behavior; not a
  statement about Zyte's private implementation.
- **RECOMMENDATION** — a Curiosity architecture, safety, or procurement choice.
- **UNKNOWN / NEGATIVE RESULT** — not established in reviewed public sources;
  absence from documentation is not proof of absence in production.

Confidence is **high**, **medium**, or **low**. Vendor security, performance,
consent, and compliance statements remain vendor representations.

## 2. Product boundary and compatibility contract

### 2.1 Endpoint, authentication, and work unit

**FACT (high):** The ordinary interface is `api.zyte.com:8011`; examples
configure it as an HTTP proxy and authenticate with the Zyte API key as the
Basic-auth username and an empty password. The main interface handles both HTTP
and HTTPS target URLs. Port `8014` is an optional HTTPS proxy interface for
stacks that support HTTPS proxies. It also requires the Zyte CA. [S1]

**FACT (high):** The client still addresses the target URL. Proxy mode takes the
client request method and text or binary body automatically, and always returns
a body. Unlike the JSON API, it does not Base64-wrap the body or require JSON
decoding; Zyte describes its only additional overhead as response headers.
[S1][S2]

**INFERENCE (high):** The observable unit is one synchronous caller request held
open until a direct artifact or Zyte error is returned. No reviewed proxy-mode
source defines submit/poll/cancel, durable job retrieval, idempotency keys, or a
result-retention lifecycle. `Zyte-Request-ID` is correlation, not a durable job.

**UNKNOWN:** Normative proxy protocol versions; HTTP/2 or HTTP/3 behavior on
either leg; connection pooling/reuse; streaming and trailer behavior; request
and response size limits specific to direct proxy mode; supported methods as a
closed enum; upload replay rules; and whether the JSON API's 10 MB raw-body
truncation limit applies identically to proxy mode. The FAQ states that limit
for `httpResponseBody` and `browserHtml`, but does not expressly scope direct
proxy bodies. [S1][S2][S16]

### 2.2 Controls visible in the proxy request

| Input | Published proxy-mode meaning | Contract consequence |
|---|---|---|
| Target URL/method/body | Taken from the client request; docs demonstrate GET and POST with text/binary body | Proxy shape preserves broad HTTP authority; side-effect and replay policy remain caller concerns [S2] |
| `Zyte-Browser-Html: true` | Returns serialized browser HTML | Distinct derived representation; incompatible with disabling redirect follow [S1] |
| `Zyte-Cookie-Management` | Maps to shared `cookieManagement` | `discard` suppresses Zyte automatic cookies, while explicit caller cookies still apply under documented shared semantics [S1][S3] |
| `Zyte-Device` | Maps to device emulation | Device affects request profile; exact effective headers remain undisclosed [S1][S2] |
| `Zyte-Disable-Follow-Redirect: true` | Disables default redirect following | Needed for caller-owned per-hop authorization; unavailable with browser HTML [S1] |
| `Zyte-Geolocation` | Requests a country of origin | Omission lets Zyte choose; extended locations can change price [S1][S3][S10] |
| `Zyte-IPType` | Requests `datacenter` or `residential` | Omission lets Zyte choose; explicit residential requires KYC and changes price [S1][S3][S10] |
| `Zyte-Override-Headers` | Comma-separated exceptions for otherwise protected headers | Lets caller override `Accept`, `Accept-Encoding`, or `User-Agent`, with a ban-risk warning [S1] |
| `Zyte-Session-ID` | Maps to client-managed `session.id` | Caller UUIDv4 transport identity; not browser persistence [S1][S3] |
| `Zyte-Tags` | ASCII JSON object below 512 bytes | Useful for aggregate Stats correlation; not echo or item evidence [S1][S9] |
| `Zyte-JobId` | Scrapy Cloud job ID | External workload correlation only [S1] |
| `Zyte-Client` | User-Agent-like client-software report | Provider telemetry, not target request identity [S1] |

**FACT (high):** Proxy mode rejects requests containing any of fifteen listed
client/IP-forwarding headers, including `Forwarded-For`, `Via`, and common
`X-Forwarded-*`, `X-Remote-*`, and `X-Client-*` variants, with HTTP 400. [S1]

**FACT (high):** Zyte automatically supplies headers for ban avoidance. Caller
headers override most automatic headers, but not `Accept`, `Accept-Encoding`, or
`User-Agent` unless named in `Zyte-Override-Headers`; Zyte warns that overriding
them can break ban avoidance. Separately, the FAQ says even a requested
User-Agent may be overridden for certain websites. [S1][S2][S16]

**INFERENCE (high):** The client request is an instruction, not a faithful wire
image. An input header may be preserved, overridden, combined with provider
state, or rejected. Proxy compatibility therefore does not establish
request-byte equivalence with a direct client.

**RECOMMENDATION (high):** Curiosity's neutral request must be smaller: public
HTTP(S) URL, GET/HEAD by default, explicit representation, datacenter/no-CAPTCHA
policy, redirect mode, optional approved country, and a policy-issued session
handle. Origin headers, cookies, unsafe methods, bodies, and browser HTML must be
separate capabilities. Keep all `Zyte-*`/`X-Crawlera-*` names adapter-private.

### 2.3 Cookies and representation modes

**FACT (high):** The ordinary `Cookie` header supplies cookies for the target
URL's domain. Proxy mode cannot set cookies for additional domains that might be
reached through redirects, unlike the JSON API's structured multi-domain cookie
input. If no caller cookie is supplied, Zyte may add cookies to reduce bans;
`cookieManagement: discard` disables automatic cookies. [S1][S3]

**FACT (high):** Raw mode returns the target body directly. Browser-HTML mode
returns serialized DOM after browser rendering rather than origin bytes. Proxy
mode provides no screenshot, browser actions, network capture, JavaScript
enable/disable control, automatic extraction, server-managed session contexts,
or echo data. Zyte says proxy mode is not optimized for local browser-automation
tools and directs those users to the richer browser API. [S1]

**CONTRACT DRIFT (high):** The current proxy page labels browser HTML “new” and
supports it, while the SPM migration page still says proxy-mode browser HTML is
“planned.” The current surface page is stronger evidence of availability; the
migration comparison is stale. [S1][S5]

**RECOMMENDATION (high):** Preserve `raw_http` and `serialized_dom` as different
artifact types. Never let a direct `text/html` body obscure whether a browser
produced it. Hash, size, validate, and store them separately, with requested and
reported mode plus an explicit derivation edge.

## 3. Routing, unblocking, redirects, and sessions

### 3.1 Target-adaptive routing and ban handling

**FACT (high):** Unless overridden, Zyte chooses a fitting country and IP type
for the target. Published anti-ban behavior includes browser-like headers and
ordering, cookies, IP/network-stack continuity, retries, CAPTCHA management,
residential IPs, and target-specific handling. Zyte defines a ban as a response
different from what anyone would get in a browser and says it transparently
handles bans where possible. It does not automatically log in and cannot
automatically obtain data always locked behind login. [S3][S4]

**FACT (high):** CAPTCHA management and device-residential IP use are account
permissions enabled by default according to the shared-features documentation;
they can be disabled. Explicit residential selection requires KYC. A target can
also be blocked with 451 `/download/domain-forbidden`. [S3][S4]

**INFERENCE (high):** Proxy mode is a managed acquisition gateway, not a neutral
packet relay. One caller request may involve opaque provider-selected identity,
headers, cookies, browser execution, and attempts before a final artifact or
error. The final response is selected by a provider success/ban classifier.

**UNKNOWN:** Per-response effective egress IP/class/country; whether residential
or CAPTCHA handling was used; attempt count/timestamps; retry backoff; profile
changes; target politeness; CAPTCHA supplier/data flow; automatic browser
selection in raw proxy requests; and exact block-page classifier signals.

**RECOMMENDATION (high):** Require datacenter-only and CAPTCHA disabled at the
account and request policy layers. Any residential/challenge exception requires
target-specific lawful-purpose, peer-network, rights, provenance, and budget
approval. Provider “ban-free” is neither permission nor content correctness.

### 3.2 Redirects

**FACT (high):** Zyte API follows HTTP redirects by default. Proxy mode can
disable this with `Zyte-Disable-Follow-Redirect: true`; that control is
incompatible with browser HTML. SPM did not follow redirects, making this a
material migration difference. Proxy cookies can address only the seed target
domain, not additional redirected domains. [S1][S2][S5]

**UNKNOWN:** A normative proxy-mode final-URL response header; complete redirect
chain; hop limit; cross-scheme/method rewriting rules; DNS/IP checks on each
hop; forwarding of authorization/cookies across origins; and whether every hop
is separately represented in Stats. The canonical JSON API exposes final URL,
but the proxy page documents no equivalent final-URL header. [S1][S2]

**RECOMMENDATION (high):** Default Curiosity proxy calls to redirect-disabled,
then re-authorize each `Location` as a new bounded request. If browser HTML is
ever enabled, the inability to disable redirects is a separate high-authority
lane requiring provider egress guarantees and an owned-domain test. Never infer
the chain from the final body.

### 3.3 Client-managed transport sessions

**FACT (high):** `Zyte-Session-ID` maps to a client-managed session whose ID is a
caller-generated UUIDv4. Requests sharing it share IP address, network stack,
cookie jar, and related conditions. Sessions do **not** preserve a browser tab,
window, process, machine, DOM, storage, or JavaScript heap; browser persistence
is described as planned. Proxy mode does not support server-managed sessions.
[S1][S3]

**FACT (high):** Shared session documentation says a client-managed session can
expire 15 minutes after creation, two minutes after last use, or after three
consecutive bans; an expired ID can remain unusable for a 5–10 minute tombstone
period. [S3]

**INFERENCE (high):** The portable abstraction is `transport_session`, not
browser, login, or person. Connection reuse alone is not session identity, and
the session ID is provider-scoped secret-bearing state.

**UNKNOWN:** Concurrency serialization; geo/IP-type mutation behavior; retry
affinity; exact cookie isolation and deletion; session scope across domains,
keys, and organizations; whether expiration reason is surfaced; and whether a
proxy response identifies the accepted session ID.

**RECOMMENDATION (high):** Curiosity should mint opaque task-and-origin-bound
handles, bind target/geo/IP/purpose, cap lifetime below provider limits, forbid
cross-job reuse, encrypt at rest, redact logs, and destroy local state on task
end. Do not send authenticated sessions absent a separately approved contract.

## 4. Response, status, error, and provenance surface

### 4.1 Direct success body and provider headers

**FACT (high):** A successful proxy response returns the body directly and adds
response headers. `Zyte-Request-ID` is a unique request identifier. On errors,
`Zyte-Error-Type` and `Zyte-Error-Title` mirror the JSON problem fields. The body
of an unsuccessful proxy response is always the actual JSON error response from
the HTTP API. [S1]

**FACT (high):** Zyte's general success model considers a response successful
when requested ban-free data was provided, including when the target returned a
non-200 response for a non-ban reason. Unsuccessful/rate-limited responses use
typed statuses including 400, 401, 403, 421, 429, 451, 500, 503, 520, and 521;
those bodies are JSON in proxy mode. [S1][S4]

**NEGATIVE RESULT (high importance):** The reviewed proxy page does not
normatively state how a target non-200 status is projected into the outer proxy
status, nor expose a dedicated `origin_status` field. General JSON-API docs say
the outer API returns 200 with origin status in `statusCode`; proxy mode removes
that JSON envelope. Stats examples contain 404s, but do not disambiguate target
versus provider status. Do **not** assume status preservation or 200-wrapping
without written clarification or an authorized benign fixture test. [S1][S4][S9]

**INFERENCE (high):** `Zyte-Error-Type` is the strongest documented discriminator
for a provider error. Its absence does not prove the remaining status came
unaltered from one origin attempt, and a target-looking body/header set remains
untrusted intermediary output.

**RECOMMENDATION (high):** Normalize every call into distinct fields:

```text
client_proxy_transport_outcome
provider_acquisition_outcome
provider_problem_type?
returned_http_status
origin_status?                 # unknown unless normatively evidenced
content_validation_outcome
semantic_usefulness
policy_outcome
evidence_completeness
```

Preserve raw status, headers, JSON error body, and `Zyte-Request-ID`; never use
the request ID as proof of origin observation or durable retrieval.

### 4.2 Retry semantics

**FACT (high):** Zyte recommends randomized exponential backoff, automatic
retry of 429/503 rate limits and 520 ban errors, indefinite retry for rate
limiting, and bounded retry for other errors. It notes intermittent 521 errors
may be misclassified bans. Migration guidance tells Scrapy users to add 520 and
521 to retry codes; official clients may add another retry layer. [S4][S6]

**INFERENCE (high):** There can be at least three retry locations: hidden
provider acquisition attempts, client-library retries, and Curiosity scheduler
retries. Migration can change multiplicity: Zyte's SPM sunset FAQ reports higher
request volumes for some old Scrapy/client combinations due to retry behavior.
[S7]

**UNKNOWN:** Internal attempt limit/deadline, method replay policy, whether POST
bodies can be replayed, relationship between provider attempts and RPM, and
attempt-level billing/provenance.

**RECOMMENDATION (high):** Reject indefinite in-worker retry and side-effecting
methods. One Curiosity request gets a hard deadline, attempt count, byte and
dollar budget; retry only safe/idempotent operations under a central scheduler.
Record which layer retried. Return `deferred`, not a hung worker, on exhaustion.

### 4.3 Freshness, cache, and evidence gaps

**NEGATIVE RESULT (medium-high):** No reviewed public proxy-mode source defines
an ordinary response cache, cache key, cache bypass, force-refresh, maximum age,
revalidation guarantee, cache hit/miss/age field, stale-if-error policy, or proof
of live origin contact. Neither “always live” nor “cached” is established.

**NEGATIVE RESULT (high):** The response contract does not guarantee a fetch
timestamp, requested/final URL pair, complete redirect chain, attempt ledger,
effective request headers/cookies, egress IP/class/geo, TLS verification result,
certificate identity, browser/runtime/profile version, CAPTCHA event, render
reason, source byte count/hash, truncation flag, per-response cost, robots/
rights decision, or subresource manifest.

**FACT (high):** Tags and API-key labels can support aggregate Stats filters.
Stats reports request count, statuses, billed traffic, average/p80 cost and
latency, time/domain groups, requested features, and three-hourly domain health.
It uses separate dashboard credentials and is limited to 20 RPM. This is
operations telemetry, not item provenance. [S1][S9]

**RECOMMENDATION (high):** Curiosity must create the evidence envelope at its
boundary:

```text
request_id, task_id, provider, adapter_version, provider_request_id?
requested_url, reported_final_url?, redirect_chain?
method, request_body_hash?, approved_header_policy, session_scope?
requested_at, proxy_connected_at?, response_started_at?, completed_at
requested/effective_mode?, requested/effective_geo?, requested/effective_ip_type?
tls_to_proxy, proxy_ca_scope, target_tls_verified?, certificate_evidence?
provider_outcome, returned_status, origin_status?, validation_outcome
cache_policy, cache_disposition=unknown, origin_contact=unknown
media_type, content_encoding, byte_length, sha256, truncated=unknown
retry_lineage, provider_attempts=unknown, captcha_used=unknown
policy_decision_id, robots_snapshot, rights/purpose class
estimated_cost, reconciled_cost?, retention_class
untrusted_external_data=true, provenance_completeness
```

Question marks are intentional. Missing provider evidence must remain missing.
Origin-like `Date`, `ETag`, `Last-Modified`, cache, cookie, and server headers may
be preserved as untrusted observations, never upgraded to verified origin facts.

## 5. Limits, rates, and economics

### 5.1 Published platform limits

**FACT (high):** Standard plans publish 3,000 requests/minute per API key;
Enterprise pricing displays 10,000 RPM while the rate-limit page says custom.
Additional website, account-website, temporary, and global limits may apply.
Limits are RPM, not concurrency; Zyte estimates concurrency as
`RPM / 60 * average response seconds`. [S10][S11]

**FACT (high):** Rate-limited requests return 429 or 503 and are not charged.
The HTTP API documents a 5 MiB JSON request limit and a 10 MB pre-Base64
`httpResponseBody`/`browserHtml` output limit, with longer output truncated; the
proxy-specific applicability and a direct-body truncation signal are not stated.
[S4][S16]

**RECOMMENDATION (high):** Provider RPM is an account ceiling, never permission
to apply it to one publisher. Enforce global, tenant, origin, tenant-origin,
session, and browser-render admission controls plus byte/wall/spend limits.

### 5.2 Price snapshot on 2026-08-17

**FACT (high, time-sensitive):** Zyte charges only “successful” responses. Base
cost depends on target website and request type (HTTP or browser) across five
automatically assigned tiers. New target/type combinations receive a temporary
tier; assignments are reviewed quarterly with two weeks' notice. Exact base
tier prices and distribution are delegated to a dynamic page/estimator. Browser
HTML therefore selects browser-type economics, not merely a response format.
[S10]

**FACT (high):** Device-residential or extended-geolocation requests have
different request-type base costs plus network-consumption cost. Proxy mode has
no extraction, screenshot, action, or capture add-ons because those features are
not exposed. [S1][S10]

**FACT (high):** Standard PAYG showed $5 first-month credit, 3,000 RPM, and a
$100/month plan spending limit. Commitment options pair $100/$200/$350/$500
monthly commitments with $200/$400/$700/$2,500 limits and 25%/40%/48%/52%
discounts. Defaults may allow overage up to the plan ceiling unless a blocking
organization or API-key spending limit is configured; domain alerts are
informational only. [S10]

**UNKNOWN:** A universal cost per 1,000 proxy requests, exact target tier,
render-selection rate, attempt cost attribution, response-size distribution,
price of a given target after the next review, and whether migration-plan terms
differ for the contemplated account.

**RECOMMENDATION (high):** Preflight expected and worst-case cost from target,
mode, geo/IP type, bytes, retries, and tier; assign a dedicated key with a hard
blocking limit; reconcile aggregate Stats; and preserve local request-level
estimates. A billed “success” is not necessarily useful content.

## 6. Migration and compatibility hazards

### 6.1 SPM migration surface

**FACT (high):** Manual migration from SPM can be as small as changing endpoint
and API key. Zyte also supports selected `X-Crawlera-*` headers in proxy mode:
cookies, job ID, profile/profile-pass, region, and session. It can emit legacy
`X-Crawlera-Error` for mapped errors when one of those headers is used; a no-op
legacy header can force that response header. Max retries and timeout have no
planned equivalent; no-ban-check was marked planned. [S5]

**FACT (high):** SPM differs materially: it did not follow redirects, was
concurrency-throttled, used server-generated session IDs, and required manual
geo/profile choices. Zyte API follows redirects, is RPM-limited, requires caller
UUIDv4 session IDs, and makes target-dependent geo/IP/profile choices. [S5]

**FACT (high):** Zyte announced SPM end-of-life and auto-routed remaining shared
SPM endpoints through DNS to a proxy-mode translation layer on 2025-12-09,
retaining old hostnames/keys and mapping behavior. The FAQ says historical SPM
usage would remain only for a limited period and notes some old Scrapy stacks
showed higher request counts after migration. [S7]

### 6.2 Migration interpretation

**INFERENCE (high):** “No code change” is not “no semantic change.” DNS routing,
header translation, changed redirect defaults, changed rate/retry behavior,
automatic browser/residential/geo selection, and a new billing model can alter
the request graph, evidence, and cost even when the client call site is stable.

**RECOMMENDATION (high):** If Curiosity ever inherits proxy-mode traffic:

1. inventory all endpoint, CA, key, `Zyte-*`, and `X-Crawlera-*` use;
2. freeze expected redirect, method, cookie, session, geo/IP, and retry behavior;
3. remove legacy headers rather than depending on translation;
4. separate client and provider retry counters;
5. compare body/status/header semantics on owned benign fixtures only after
   separate approval;
6. monitor request multiplicity and spend before widening traffic; and
7. migrate toward the provider-neutral Curiosity contract, not toward direct
   dependence on Zyte's JSON field vocabulary.

**RECOMMENDATION (high):** Do not introduce proxy mode into a greenfield system.
Its justified role is a time-bounded compatibility shim with an exit plan.

## 7. Security and privacy boundary

### 7.1 Two proxy interfaces and Basic credential exposure

**FACT (high):** Zyte's standard examples use the `http://api.zyte.com:8011`
proxy with the API key as Basic proxy username. The alternative
`https://api.zyte.com:8014` encrypts the proxy interface for supporting stacks.
RFC 7617 states that Basic authentication is not secure without an external
secure system such as TLS because Base64-encoded credentials otherwise cross
the network as cleartext. [S1][S17]

**INFERENCE (high):** Port 8011 does not provide TLS on the client-to-proxy leg,
even when the target URL is HTTPS; the CONNECT/Proxy-Authorization exchange must
reach that HTTP proxy before the target tunnel/inspection path exists. Thus a
network observer on that leg can recover the reusable API key. This follows from
the documented interface and Basic/CONNECT standards, not packet inspection.
[S1][S17][S18]

**RECOMMENDATION — REJECT (high):** Never use port 8011 with credentials.
Require a verified HTTPS-proxy interface and narrow secret scope/rotation. If a
runtime cannot support port 8014 without weakening validation, do not integrate.

### 7.2 CA trust and HTTPS interception

**FACT (high):** Zyte tells some stacks to install its `Crawlera CA` as a trusted
root, including system/browser instructions and global “Always Trust”; port
8014 and Python `requests` examples require that CA or a bundle containing it.
[S1][S8]

**INFERENCE (high):** A service that can read and alter target headers/cookies,
classify target content, render target pages, and return rewritten HTTPS
responses must terminate or inspect target TLS. The custom trusted CA is
consistent with certificates presented on that intercepted leg. This makes
Zyte, not merely the target, a confidentiality and integrity principal.

**UNKNOWN:** Exact certificate names/constraints; target-host certificate
validation before reissuance; revocation/rotation; private-key protection;
whether the CA is technically constrained; TLS versions/ciphers per leg;
certificate transparency behavior; mTLS; and how target TLS failures map into
proxy errors. The JSON HTTP API's `verifyCertificate` default is not a safe
proxy-mode answer because proxy mode exposes no equivalent header. [S1][S2]

**RECOMMENDATION — REJECT broad trust (high):** Do not install Zyte's CA into a
global OS, browser, language, or shared container trust store. If procurement
ever proceeds, use an isolated adapter process/network namespace and a dedicated
CA bundle containing ordinary public roots plus only the reviewed Zyte anchor;
validate the 8014 proxy hostname; constrain key egress; and obtain written
certificate, rotation, target-validation, and incident details. Never send
origin `Authorization`, private cookies, client certificates, or confidential
bodies by default.

### 7.3 Arbitrary egress and untrusted content

**INFERENCE (high):** Arbitrary targets, redirects, caller methods/bodies,
cookies/headers, provider-managed identities, browser rendering, and unbounded
binary output form an SSRF/confused-deputy, secret-exfiltration, replay,
decompression/size, malware, prompt-injection, and cost-amplification surface.
Rejecting spoofed forwarding headers is useful but not an SSRF control.

**UNKNOWN (critical):** Public proxy-mode docs do not establish private,
loopback, link-local, metadata, internal DNS, unsafe-port, DNS-rebinding, or
redirect destination controls. They also do not define browser-subrequest
egress isolation.

**RECOMMENDATION (high):** Resolve and policy-check destinations before and
after redirects; deny private/reserved/link-local/metadata/control-plane ranges
and unsafe schemes/ports; use explicit domain allowlists; prohibit credentials;
stream into bounded quarantine; sniff media type; hash and scan artifacts; never
execute returned code; and keep all content out of trusted control flow unless
sanitized and provenance-labelled.

### 7.4 Provider custody, retention, and training

**FACT (high):** Zyte Terms define Service Data broadly, including extracted
data and screenshots, and permit use of Service Data, Data Feeds, code, content,
and other service data for product development and product training unless an
applicable agreement changes that position. [S12]

**FACT (high):** For Service Personal Data, the DPA makes the customer
controller and Zyte processor; the customer warrants lawful instructions,
notices/consent, and compliant collection/use. The DPA describes Article 32-
oriented controls, subprocessors, transfer mechanisms, incident notice without
undue delay and within 72 hours, and retention “as specified in the Agreement.”
[S12][S14]

**FACT (high):** The public Privacy Policy gives purpose-based retention for
support, billing, and usage logs but no single duration for proxy request/
response payloads. International processing/transfers may occur. [S14][S15]

**UNKNOWN:** URL/header/cookie/body/response/failed-attempt/session/debug-log
retention; cache isolation; backup purge; exact regions/subprocessors; payload
encryption/key boundaries; support access; API-key scopes/RBAC; and the account-
specific no-training/no-secondary-use position.

**RECOMMENDATION — PROCUREMENT BLOCKER (high):** Require a signed override for
no training/independent use, exact payload/log/cache/failed-attempt retention,
deletion and backup SLA, regions/subprocessors, encryption, key/RBAC controls,
incident terms, and assurance evidence. Until then, proxy only non-sensitive
public resources; query URLs can themselves disclose confidential interests.

## 8. Legal, AUP, and access boundary

**FACT (high):** Zyte Terms limit the Services to scraping publicly accessible
websites, place legality and ethical use on the customer, allow Zyte to stop
target activity after complaints or legal/operational/business risk, and provide
no copyright permission or non-infringement warranty for Service Data. [S12]

**FACT (high):** The AUP prohibits unlawful/fraudulent collection, privacy/IP or
other rights violations, access where the customer accepted target terms that
forbid it, LinkedIn scraping, security testing, unauthorized access, material
site interference, and specified harmful content. It restricts screenshots and
EU AI Act prohibited/high-risk uses. [S13]

**FACT (high):** Terms/AUP prohibit attempts to decipher, decompile, reverse
engineer, or discover Zyte service/software source. Automated service use by an
AI agent or scripted process constitutes acceptance by its developer, deployer,
or operator. [S12][S13]

**NEGATIVE RESULT (high):** No reviewed proxy contract promises automatic
enforcement of `robots.txt`, crawl delay, target terms, copyright/data rights,
privacy purpose limitation, or Curiosity policy. A 451 blocklist is provider
policy, not complete target authorization. [S1][S4]

**RECOMMENDATION (high):** Curiosity must authorize first: public-access status,
target/terms, robots snapshot, politeness, purpose, data category, IP/privacy
rights, complaint/cease path, artifact-use rights, and budget. Provider KYC,
residential consent claims, CAPTCHA handling, or technical success never grants
target rights. Counsel must review the current order form/Terms/AUP/DPA for the
specific entity, jurisdiction, targets, and use.

**Clean-room boundary:** This dossier transfers only documented interface facts
and independently derived requirements. It contains no private implementation,
fingerprint recipe, CAPTCHA method, target playbook, hidden endpoint, credential,
or service output. Future access or testing requires a new approved frame.

## 9. Bounded architecture inference

The smallest logical system consistent with the published surface is below. It
is **INFERENCE**, not disclosure of Zyte's processes, topology, algorithms, or
vendors.

```text
HTTP proxy :8011 / HTTPS proxy :8014 / legacy SPM DNS+translation ingress
        |
  Basic auth + account/rate/policy + header validation
        |
  proxy-to-canonical request translator
        |-- URL / method / body / caller headers / target-domain cookies
        |-- Zyte controls / legacy X-Crawlera mapping
        |
  target-aware capability and cost planner
        |-- raw HTTP or browser-HTML execution
        |-- device / geo / IP class / cookie / transport-session selection
        |
  acquisition attempt loop
        |-- redirect handling
        |-- ban/content classifier
        |-- retry / profile or route adaptation / CAPTCHA capability
        |
  selected raw or serialized-DOM artifact
        |
  proxy response translator
        |-- direct body and target-like metadata
        |-- Zyte request/error headers or JSON problem body
        |
  asynchronous usage, tiering, billing, domain-health, and Stats path
```

### A. Proxy/canonical translation layer — **high confidence**

Evidence: request headers map to canonical fields, direct bodies replace
JSON/Base64 output, JSON errors are passed through, and legacy SPM headers/DNS
are translated. Exact internal representation is unknown. [S1][S5][S7]

### B. Capability/cost planner — **medium-high confidence**

Evidence: one proxy request can select raw HTTP or browser HTML; target/type
determines one of five price tiers; geo/IP defaults are target-dependent; invalid
combinations are rejected. [S1][S3][S10]

### C. Target-adaptive acquisition controller — **medium confidence**

Evidence: automatic geo/IP/header/cookie choices, global and account-domain
limits, ban handling, quarterly target tiers, and domain health. Whether control
is rules, models, operator configuration, or a mix is unknown. [S3][S4][S9-S11]

### D. Session mapping store — **medium-high confidence**

Evidence: UUIDv4 IDs bind IP/network/cookie conditions across requests, expire
on time or bans, and are tombstoned. Physical storage and isolation are unknown.
[S3]

### E. Response/error translator — **high confidence**

Evidence: direct artifacts plus injected request/error headers on proxy mode,
versus JSON/Base64 and typed fields on the canonical API. The exact target-status
projection remains unknown. [S1][S2][S4]

### F. Asynchronous accounting path — **medium-high confidence**

Evidence: separate Stats credentials/host, aggregate percentiles and costs,
three-hour domain-health refresh, target/request-type tiering, and tags/labels.
This path cannot repair missing item-level evidence. [S9][S10]

## 10. Clean-room lessons and Curiosity verdict ledger

| Verdict | Pattern | Curiosity implication |
|---|---|---|
| **ADOPTED** | Compatibility façade as a distinct surface | Version, constrain, monitor, and retire it; never make it the neutral core. |
| **ADOPTED** | Explicit raw versus rendered representation | Separate authority, artifact type, validation, hashes, budgets, and derivation. |
| **ADOPTED** | Client-managed transport session | Opaque task/origin-bound handle with expiry; never call it browser persistence. |
| **ADOPTED** | Typed provider problem identifier and correlation ID | Preserve raw problem type/request ID while generating Curiosity IDs and outcomes. |
| **ADOPTED** | Request tags and aggregate cost/domain telemetry | Use for reconciliation and operations, not item provenance. |
| **ADAPTED** | Proxy method/body/header compatibility | Default GET/HEAD; gate bodies, unsafe methods, headers, cookies, and secrets by capability. |
| **ADAPTED** | Geo/IP/device controls | Record requested and observed separately; explicit datacenter default; no silent escalation. |
| **ADAPTED** | Redirect toggle | Disable and re-authorize each hop; browser mode needs a separate egress contract. |
| **ADAPTED** | Direct response | Wrap in evidence envelope; keep origin status, freshness, route, attempts, and TLS unknown unless evidenced. |
| **ADAPTED** | Successful-response pricing and RPM | Add origin politeness, hard job/key/tenant budgets, local estimate, and reconciliation. |
| **REJECTED** | Proxy mode as provider-neutral acquisition contract | Header names and response collapsing leak provider behavior and erase evidence layers. |
| **REJECTED** | Port 8011 Basic proxy authentication | API key lacks transport confidentiality on the client-proxy leg. |
| **REJECTED** | Global/system trust for Zyte CA | Gives a broad interception anchor; isolate and scope or do not integrate. |
| **REJECTED** | Default residential/CAPTCHA/provider-selected escalation | Requires separate rights, ethics, peer-network, provenance, and spend authority. |
| **REJECTED** | Provider success/ban-free as semantic truth | Validate content and keep provider, returned, origin, semantic, and policy states distinct. |
| **REJECTED** | Indefinite retry or opaque multi-layer retries | Central bounded scheduler; safe methods only; explicit retry lineage. |
| **REJECTED** | Technical access as legal authorization | Curiosity owns target, robots, rights, privacy, purpose, and complaint controls. |
| **DEFERRED** | Production proxy adapter | TLS, egress, status, retention/training, provenance, and contract checks remain open. |
| **DEFERRED** | Browser HTML | Redirect disable is unavailable; browser egress/version/isolation evidence is sparse. |
| **DEFERRED** | Authenticated, personal, confidential, or regulated targets | Provider custody, hidden retry, CA interception, and public training terms are blockers. |
| **DEFERRED** | Residential or CAPTCHA handling | Separate approval and target-specific legal/ethical review required. |

### Minimum provider-neutral acquisition contract

```text
AcquireRequest {
  request_id, tenant_id, url,
  method: GET|HEAD,
  representation: raw_http|serialized_dom,
  redirect_policy: deny|reauthorize,
  max_redirects, wall_deadline_ms, max_response_bytes,
  geo_request?, ip_class: datacenter,
  session_handle?, captcha_policy: deny,
  credential_policy: none, body_policy: none,
  egress_policy_id, rights_policy_id, retention_class,
  attempt_budget, dollar_budget
}

AcquireEvidence {
  request_id, provider_ref?, adapter_version,
  requested_url, reported_final_url?, redirect_chain?,
  started_at, completed_at,
  provider_outcome, provider_problem_type?, returned_status,
  origin_status?, semantic_outcome, policy_outcome,
  requested_mode, effective_mode?, requested_geo?, observed_geo?,
  requested_ip_class, observed_ip_class?, session_scope?,
  tls_to_proxy, target_tls_verified?, cache_disposition?,
  retry_summary?, provider_attempts?, captcha_events?,
  media_type, bytes, sha256, truncated,
  content_ref, cost_estimate, cost_actual?, warnings[],
  provenance_completeness, untrusted_external_data: true
}
```

## 11. Unknowns and pre-adoption checks

| Unknown / risk | Confidence now | Required check before reliance |
|---|---:|---|
| Target non-200 versus provider status projection | Low | Written normative response contract; owned benign fixture only under new authority |
| Port-8014 TLS and proxy-auth model | Medium that interface is TLS; low on details | Certificate/hostname/rotation contract and isolated verification plan |
| Zyte CA constraints and target-certificate validation | Low | Security architecture, CA profile, rotation/revocation, failure mapping, audit evidence |
| Proxy body limit/truncation/decompression | Low | Normative proxy limit and truncation flag; bounded fixture after approval |
| Cache, origin contact, revalidation, freshness | Low | Written cache/freshness contract; explicit bypass and disposition fields |
| Redirect chain and per-hop egress controls | Low | SSRF architecture and owned redirect matrix under security-test authority |
| Private/reserved/metadata/unsafe-port blocking | Low | Written egress controls including DNS rebinding, redirects, and browser subrequests |
| Effective geo/IP/header/cookie/CAPTCHA/attempts | Low | Item response/telemetry fields or vendor confirmation |
| Session isolation, concurrency, and deletion | Low | Account/domain/key scope, expiry reason, cookie deletion, collision guarantees |
| POST/unsafe-method replay | Low | No-replay/idempotency contract; otherwise keep prohibited |
| Browser HTML engine/version/isolation/subrequests | Low | Browser security/change contract; keep mode deferred |
| Payload/log/cache/failed-attempt retention | Low | Order form, DPA annex, deletion/backup SLA |
| Training/secondary use | High that public Terms permit; low on exceptions | Signed no-training/no-independent-use override |
| Regions, subprocessors, assurance scope | Low | Current Trust Center/procurement package and DPA schedule |
| Item-level actual price | Low/time-sensitive | Current estimator, negotiated schedule, request reconciliation |
| Enterprise 10k versus custom RPM | Medium | Applicable order form/SLA |
| Robots/terms/rights enforcement | High that no promise was found | Curiosity enforces independently regardless of vendor answer |
| Current behavior of legacy SPM translation | Medium | Inventory actual endpoints/headers; do not assume old semantics |

Any later check involving a service call, account, certificate installation,
traffic inspection, target, or mutation requires a separately declared and
approved frame. This report grants no execution authority.

## 12. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for **relevance (R)**,
**decision value (V)**, **novelty (N)**, and **cost (C, lower is better)**.
Only public-source, no-account checks were eligible; priority was approximately
`R + V + N - C`.

| Thread | R/V/N/C | Result |
|---|---:|---|
| Client-to-proxy credential confidentiality | 5/5/5/1 | **Pursued.** Port 8011 is documented as HTTP proxy plus Basic auth; RFC 7617 establishes cleartext-equivalent exposure without TLS. Port 8014 is the only documented encrypted proxy interface. [S1][S17] |
| CA/interception trust boundary | 5/5/5/2 | **Pursued.** Zyte requires its trusted CA for affected stacks and documents global installation; exact constraints/target validation remain unknown. [S1][S8] |
| Proxy target-status projection | 5/5/4/2 | **Pursued to saturation.** Proxy errors are JSON with Zyte problem headers; no normative origin-status field or mapping for target non-200 was found. [S1][S4][S9] |
| Browser HTML availability drift | 4/4/4/1 | **Pursued.** Current proxy reference supports it; older migration table still says planned. Current surface wins, contradiction retained. [S1][S5] |
| SPM no-code migration semantics | 5/4/4/1 | **Pursued.** DNS/translation cutover and retry-volume warning confirm that compatibility can hide changed execution. [S7] |
| Proxy-specific body limit/truncation | 4/5/3/2 | **Pursued to saturation.** General 10 MB fields found; direct proxy applicability/indicator remain unknown. [S16] |
| Cache/freshness contract | 5/5/4/2 | **Pursued to saturation.** No proxy cache disposition, force-refresh, or origin-contact guarantee found. |
| Exact anti-ban fingerprints/CAPTCHA algorithms | 1/1/4/5 | **CURIOSITY_NO_GO:** proprietary, bypass-adjacent, prohibited by clean-room need, and irrelevant to the adapter contract. |
| Paid/free proxy calls or certificate capture | 3/4/3/5 | **CURIOSITY_NO_GO:** caller prohibited calls/credentials; no approved fixture, trust-store mutation, or security-test authority. |
| Inspect official SDK/plugin source | 2/3/3/4 | **CURIOSITY_NO_GO:** source/license review was not authorized and cannot establish the normative managed-service contract. |
| Probe private/metadata targets, redirects, or TLS failures | 5/5/4/5 | **CURIOSITY_NO_GO:** active security testing and unsafe egress lack isolated fixture and explicit authority. |
| Account-only Trust Center/SOC materials | 4/4/2/5 | **CURIOSITY_NO_GO:** unavailable under public no-account access; retained as procurement gate. |
| Jurisdiction-specific scraping legality | 5/5/3/5 | **CURIOSITY_NO_GO:** requires exact targets, data, purpose, entities, jurisdictions, and counsel. |
| Competitor quality/cost benchmark | 1/2/2/5 | **CURIOSITY_NO_GO:** outside standalone product frame and no licensed corpus/budget authority. |

**Stop reason:** coverage plus saturation. Every caller-requested category has
primary evidence, bounded inference, or an explicit negative result. Remaining
material questions require vendor contracting, assurance access, counsel, or a
separately authorized controlled test. No autonomous follow-up is authorized.

## 13. Sources

All sources were accessed **2026-08-17**. Zyte sources are authoritative for
their published interface or attributed vendor representation, not independent
proof of implementation, performance, compliance, consent, or legality.

- **[S1]** Zyte API proxy mode.  
  <https://docs.zyte.com/zyte-api/usage/proxy-mode.html>
- **[S2]** Zyte API HTTP requests.  
  <https://docs.zyte.com/zyte-api/usage/http.html>
- **[S3]** Zyte API shared features: geo, IP type, cookies, sessions,
  permissions.  
  <https://docs.zyte.com/zyte-api/usage/features.html>
- **[S4]** Zyte API error handling, retries, and ban handling.  
  <https://docs.zyte.com/zyte-api/usage/errors.html>
- **[S5]** Migrating from Smart Proxy Manager to Zyte API.  
  <https://docs.zyte.com/zyte-api/migration/zyte/smartproxy.html>
- **[S6]** Migrating from `scrapy-zyte-smartproxy` to `scrapy-zyte-api`.  
  <https://docs.zyte.com/zyte-api/migration/zyte/scrapy-zyte-smartproxy.html>
- **[S7]** SPM to Zyte API via Proxy Mode — Customer FAQ / sunset notice.  
  <https://docs.zyte.com/smart-proxy-manager/sunset.html>
- **[S8]** Installing the Zyte CA certificate.  
  <https://docs.zyte.com/misc/ca.html>
- **[S9]** Zyte API Stats API.  
  <https://docs.zyte.com/zyte-api/usage/stats/index.html>
- **[S10]** Zyte API pricing.  
  <https://docs.zyte.com/zyte-api/pricing.html>
- **[S11]** Zyte API rate limits.  
  <https://docs.zyte.com/zyte-api/usage/rate-limit.html>
- **[S12]** Zyte Terms of Service.  
  <https://www.zyte.com/terms-policies/terms-of-service/>
- **[S13]** Zyte Acceptable Use Policy.  
  <https://www.zyte.com/terms-policies/acceptable-use-policy/>
- **[S14]** Zyte Data Processing Agreement.  
  <https://www.zyte.com/terms-policies/dpa/>
- **[S15]** Zyte Privacy Policy.  
  <https://www.zyte.com/terms-policies/privacy-policy/>
- **[S16]** Zyte API frequently asked questions.  
  <https://docs.zyte.com/zyte-api/faq.html>
- **[S17]** IETF RFC 7617, “The 'Basic' HTTP Authentication Scheme.”  
  <https://www.rfc-editor.org/rfc/rfc7617.html>
- **[S18]** IETF RFC 9110, “HTTP Semantics” (proxy, CONNECT, authentication,
  intermediary and security semantics).  
  <https://www.rfc-editor.org/rfc/rfc9110.html>

## 14. Confidence summary

- **High:** proxy endpoints and Basic-auth shape; direct-body behavior;
  documented `Zyte-*` controls and rejected headers; browser-HTML feature and
  omissions; redirect default; target-domain cookie limit; client-managed
  transport sessions; typed error/request headers; current migration mappings;
  public rate/pricing/Terms/AUP/DPA language; Basic-without-TLS risk.
- **Medium:** translation/planner/acquisition/session/accounting decomposition;
  HTTPS interception inference; completeness of negative searches across a
  changing documentation set; interpretation of Terms/DPA interaction.
- **Low / unknown:** target-status projection, cache and origin contact,
  proxy-specific size/truncation, TLS/CA internals, private-address defenses,
  exact retries and effective routing, payload retention/regions, browser fleet,
  item cost, and empirical target-specific quality.
