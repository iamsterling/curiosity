# Oxylabs Web Unblocker: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Scope:** Oxylabs **Web Unblocker only**: its public request/proxy/session/geo
contract, managed unblocking/retry/render behavior, output and evidence surface,
limits/errors/pricing, and security/privacy/legal implications. Other Oxylabs
products are mentioned only where the public contract points to them as a
boundary or alternative.  
**Method and boundary:** first-party public documentation, pricing, trust, AUP,
privacy, DPA, KYC, and General Conditions only. No account, credentials, trial,
paid call, target probe, bypass attempt, traffic interception, SDK/source-code
inspection, or implementation. This is observable-contract analysis, not a
claim about private code, service quality, legality of a particular collection,
or legal advice.

## Decision frame

The decision is not whether Web Unblocker can relay HTTP. The decision for
Curiosity is:

> Can a managed, retrying, TLS-intercepting, proxy-shaped page acquisition
> service be placed behind Curiosity's provider-neutral fetch boundary without
> delegating permission, evidence quality, freshness, security, or cost control?

Bounded sub-questions:

1. What exactly can the caller send, and what does a returned response mean?
2. Which state is caller-visible for sessions, geography, redirects, retries,
   rendering, browser actions, errors, usage, and billing?
3. Can the response support defensible freshness and acquisition provenance?
4. What security and legal obligations follow from TLS interception, arbitrary
   targets, custom headers/cookies, browser actions, and provider retention?
5. Which external patterns should Curiosity adopt, adapt, reject, or defer?

### Evidence labels

- **FACT** — directly stated or shown by a cited first-party source.
- **INFERENCE** — a bounded clean-room explanation consistent with observable
  behavior; not a claim about private implementation.
- **RECOMMENDATION** — a Curiosity design, safety, or procurement action.
- **UNKNOWN** — not established by the reviewed public sources.

Confidence is **high**, **medium**, or **low**. Vendor security, performance,
consent, and compliance statements remain vendor representations unless the
underlying evidence was publicly inspectable.

## Executive assessment

**FACT (high):** Web Unblocker is a forward-proxy-shaped managed acquisition
service at `unblock.oxylabs.io:60000`, authenticated with a product user name and
password. The target remains the request URL; product instructions are supplied
mostly through `X-Oxylabs-*` headers. Oxylabs says it selects proxy type and
proxy, supplies cookies/headers and a browser fingerprint, maintains sessions,
retries automatically, handles CAPTCHAs, and can run a remote browser [S1-S3].

**INFERENCE (high):** this is an outcome-oriented execution gateway, not a raw
network proxy. A nominally single caller request may represent several hidden
attempts, different provider-selected identities/configurations, and optionally
a browser run. The final body is therefore an acquired artifact selected by an
opaque success classifier—not a byte-for-byte record of one disclosed origin
exchange.

**RECOMMENDATION (high):** **ADAPT / DEFER.** Adapt the clean separation of
ordinary fetch, sticky session, render, screenshot, and bounded browser-action
capabilities. Defer a production provider adapter until contract, privacy,
security, and controlled-evaluation checks are complete. Reject vendor examples
that disable TLS verification, provider `2xx`/`4xx` as semantic success, opaque
retry state as provenance, and direct agent control over arbitrary targets,
headers, cookies, POST bodies, or browser instructions.

The most consequential contractual finding is that the General Conditions say
Oxylabs may retain data gathered through Web Unblocker and use it at its sole
discretion [S18, clause 4.3.9]. That is incompatible with sending confidential,
authenticated, personal, or otherwise restricted payloads without negotiated
superseding terms. The DPA's processor instructions and end-of-term
delete-or-return language create a material contract-interpretation question,
not a safe assumption that clause 4.3.9 is neutralized [S19].

## 1. Observable product boundary

| Dimension | Published Web Unblocker boundary | Consequence |
| --- | --- | --- |
| Ingress | Proxy endpoint only; no direct API endpoint is supported [S1][S20] | Client HTTP behavior and proxy/TLS trust become part of the adapter contract. |
| Work unit | One caller request held open until response/error | No documented durable submit/poll/cancel lifecycle despite `X-Job-Id` in sample output [S7]. |
| Methods | GET and POST are documented; POST body is relayed to a chosen target [S1][S9] | Do not infer support or semantics for PUT/PATCH/DELETE, streaming upload, or idempotency. |
| Default acquisition | Provider adds standard headers, chooses a “fastest” proxy, and returns a body [S2] | Exact request fingerprint and exit are not caller-evidenced. |
| Managed access | Proxy type/rotation, cookies, headers, fingerprints, sessions, retries, CAPTCHA handling [S1-S3] | Provider operational success is not source truth or legal permission. |
| Browser | HTML rendering, raw PNG screenshot, and beta action list [S5-S6] | This is hosted browser execution, but not an exposed Playwright/CDP session. |
| Parsing/storage | No documented parser, normalized record, durable result retrieval, callback, or customer storage contract | Treat output as a raw/rendered artifact requiring Curiosity-owned parsing and storage. |

**FACT (high):** API-user credentials are separate from dashboard credentials.
Oxylabs' examples use HTTP Basic proxy authentication and use an HTTPS proxy URL
for both HTTP and HTTPS target mappings [S2-S3].

**UNKNOWN:** normative supported protocols (for example HTTP/1.1 versus HTTP/2
to the target), connection reuse behavior, streaming/chunking guarantees,
compression transformations, maximum URL/header/body/result sizes, supported
content types, and methods other than GET/POST.

## 2. Request, proxy, and response contract

### 2.1 Caller controls

| Control | Published semantics | Evidence/risk note |
| --- | --- | --- |
| Target URL | The ordinary client URL sent through the proxy [S2] | Arbitrary egress is a potential SSRF/confused-deputy surface for Curiosity. |
| `X-Oxylabs-Geo-Location` | Country/city generally; target-specific forms include Amazon postcode/country and Google country/state/city/coordinates+radius [S4] | Requested localization may combine exit geography with site delivery/search settings; it is not proof of physical observation point. |
| `X-Oxylabs-Session-Id` | Caller-chosen random string maps to one proxy for following requests for up to 10 minutes, then a new proxy is assigned [S3] | Sticky **proxy**, not a documented durable browser/profile transaction. |
| `x-oxylabs-force-headers: 1` | Caller headers are merged into the provider's predefined header set [S8] | “Merge” conflict precedence and forbidden headers are undocumented. |
| `x-oxylabs-force-cookies: 1` | Caller cookies are merged into predefined cookies [S8] | Cookie collision precedence, isolation, persistence, and deletion are undocumented. |
| `X-Oxylabs-Successful-Status-Codes` | Adds codes that should be accepted without retry; default `2xx` and `4xx` remain successful [S10] | Caller can widen provider/billing success but cannot narrow the default success classes. |
| `X-Oxylabs-Render` | `html` returns rendered HTML; `png` returns raw PNG bytes; an empty value disables provider-forced rendering [S5] | Mode can otherwise be silently escalated on listed pages, increasing latency/traffic. |
| `X-Oxylabs-Browser-Instructions` | JSON-escaped action list used with `render: html` [S6][S20] | Documentation has inconsistent spelling (`browser-instructions` in examples versus `browser_instructions` in prose); contract test required. |
| POST body | Relayed by making a POST to the target [S9] | No stated replay/idempotency behavior despite hidden retries; unsafe for side-effecting endpoints. |

**FACT (high):** Oxylabs explicitly recommends *not* forcing accessibility-
oriented custom parameters because they may interfere with its predefined
cookies, headers, and sessions [S2-S3]. This confirms that a default request is
provider-authored beyond proxy routing.

**RECOMMENDATION (high):** Curiosity should expose a much smaller typed request:
public HTTP(S) URL, GET by default, optional approved geo, explicit render mode,
and a policy-issued session handle. Provider headers must be adapter-private.
Custom origin headers, cookies, POST, and browser actions should require separate
capabilities, allowlists, secret scanning, purpose binding, and tighter budgets.

### 2.2 Returned data and identifiers

**FACT (high):** the sample successful response includes `X-Job-Id`,
`X-Session-Id`, origin/CDN-like response headers, `Set-Cookie`, and the HTML body.
When redirects occur, Web Unblocker may add `X-Oxylabs-Final-Url` [S7]. Rendered
HTML is returned as HTML; PNG rendering returns raw image bytes [S5].

**INFERENCE (high):** `X-Job-Id` is an operational correlation identifier, not a
durable job contract. No reviewed Web Unblocker page provides retrieval by that
ID, status polling, cancellation, idempotency, or retention semantics.

**RECOMMENDATION (high):** retain the provider job/session IDs as untrusted
correlation metadata, but generate Curiosity's own immutable request ID. Separate:

1. client-to-provider transport outcome;
2. provider acquisition outcome;
3. returned target HTTP status;
4. content validation/extraction outcome; and
5. evidence/freshness quality.

Never let returned `Set-Cookie`, reflected headers, or final URL automatically
influence another fetch. Re-run destination policy on every redirect, partition
cookies by task and origin, strip hop-by-hop/vendor headers, and cap redirect
count and response bytes.

## 3. Session and geography semantics

### 3.1 Sessions

**FACT (high):** a caller-supplied session ID causes Oxylabs to assign one proxy
and reuse it for following requests for **up to 10 minutes**. After that, the
same session ID receives a new proxy [S3].

**UNKNOWN:** when the ten-minute clock starts or refreshes; whether concurrent
requests serialize; whether geo changes invalidate a session; whether retries
stay on the assigned proxy; whether cookies, fingerprints, TLS state, browser
storage, or CAPTCHA state persist; collision scope across users/accounts; and
whether expiry is idle or absolute.

**INFERENCE (medium):** because the contract promises only “the same proxy,” the
safe portable abstraction is **exit affinity**, not user identity, login state,
or full browser continuity.

**RECOMMENDATION (high):** Curiosity should mint opaque, task-scoped session IDs,
never accept arbitrary agent strings, cap lifetime below the provider maximum,
bind them to account/target/geo/policy, and record requested versus observed
affinity. Do not use sessions to simulate a person or preserve authenticated
state by default.

### 3.2 Geography

**FACT (high):** for general targets, a country name requests content localized
to that country's geographic center. Amazon and Google have target-specific
localization rules; Google accepts state, city, and coordinate/radius forms,
while Amazon may interpret a postcode as delivery preference [S4].

**INFERENCE (high):** `geo_location` is not a single uniform “exit IP country”
field. Depending on target, it may control proxy selection, target cookies,
delivery preference, query localization, or some combination. Calling it source
geography without qualification would overstate evidence.

**UNKNOWN:** fallback when no matching exit exists; accuracy/SLA; actual exit IP
or proxy class; whether city/coordinate inputs select a nearby exit, merely
configure target localization, or both; and how provider-selected retries vary
geography.

**RECOMMENDATION (high):** model `requested_localization` separately from
`observed_exit_geo` and `target_reported_locale`; leave unavailable observations
null. Avoid precise coordinates unless required and approved because they raise
privacy and identity-simulation concerns.

## 4. Unblocking, retries, and success classification

**FACT (high):** Oxylabs says Web Unblocker automatically manages proxy type,
proxy rotation, browser fingerprints, retries, sessions, JavaScript rendering,
and CAPTCHA handling [S1-S3]. The caller can add accepted status codes so that
the service does not retry those responses. A `550` means the service faulted
after too many retries [S10-S11].

**FACT (high):** billing documentation gives an example where three attempts are
needed and only traffic from the final successful attempt is billed. It defines
all target `2xx` and `4xx` responses as successful, even if expected information
is absent; provider `5xx` failures are not billed, while caller-caused failures
may be billed [S12].

**INFERENCE (high):** a hidden success classifier drives both retry termination
and charging. Status is definitely an input, but public material does not define
block-page detection, CAPTCHA success validation, empty-page handling, or
content-quality checks. “Success-based” billing is therefore not quality-based.

**UNKNOWN:** retry maximum, total deadline, backoff, attempt methods, IP/proxy
class changes, fingerprint changes, cookie reuse, session adherence, target
rate/politeness, redirect limits, POST replay safeguards, CAPTCHA provider/data
handling, and whether failed attempts are retained or exposed internally.

**RECOMMENDATION (high):** do not send side-effecting POSTs through an opaque
retry system without a written no-replay/idempotency contract. Curiosity should
apply an outer deadline and spend/byte cap, perform independent block/empty/body
validation, and represent `provider_success` separately from `content_usable`.
No autonomous escalation from ordinary fetch to render/browser actions should
occur outside an approved policy and budget.

## 5. Rendering and browser behavior

### 5.1 Render modes

**FACT (high):** `X-Oxylabs-Render: html` runs JavaScript and returns rendered
HTML; `png` returns raw PNG bytes. Oxylabs recommends a **180-second client
timeout**, states rendering takes longer, and does not load “unnecessary assets”
to reduce traffic [S5]. Rendering traffic includes page subresource calls [S12].

**FACT (high):** some provider-maintained page types are force-rendered even
without a render request; the caller can disable this with an empty render
header. This qualifies migration material that describes Oxylabs rendering as
“manual”: ordinary behavior is caller-selected, but automatic forcing exists for
some pages [S5][S20].

**INFERENCE (high):** rendered output is intentionally not a byte-faithful normal
browser capture because assets may be suppressed and provider configuration is
undisclosed. It is a derived acquisition artifact.

### 5.2 Browser instructions (beta)

**FACT (high):** the beta supports `click`, `input`, `scroll`,
`scroll_to_bottom`, `wait`, `wait_for_element`, and terminal `fetch_resource`.
Selectors may be XPath, CSS, or text. Per-action `timeout_s` is `1..60` seconds
with default 5; `wait_time_s` is documented as `0..60` in prose despite a stated
restriction of `0 < wait_time_s <= 60`; `on_error` is `error` or `skip`.
Malformed instructions produce `400` [S6].

**FACT (high):** `fetch_resource` returns the **first** matching Fetch/XHR body
instead of page HTML and must be final. Its filter is a regular expression [S6].

**UNKNOWN:** maximum action count/header bytes/total browser duration; browser
engine/version/viewport/device/locale; download/dialog/popup behavior; navigation
and cross-domain restrictions; screenshot dimensions/full-page semantics;
network-idle criterion; browser isolation; browser warnings; and versioning or
stability commitments for this beta surface.

**RECOMMENDATION (high):** treat browser actions as a distinct, high-risk
capability—not a retry tier. Permit only a bounded declarative subset, validate
selectors and regex complexity/length, cap action count and cumulative wait,
forbid secrets and form submission by default, and policy-check every navigation
and fetched resource. Store action-plan digest, returned media type, and artifact
digest; label browser/version evidence unavailable unless supplied.

## 6. Errors, limits, usage, and economics

### 6.1 Status and error ambiguity

| Code | Published meaning [S11] | Curiosity interpretation |
| --- | --- | --- |
| `200` | Request succeeded | Provider success only; content still needs validation. |
| `400` | Invalid request/parameter; body gives detail | Caller/config failure; do not retry unchanged. |
| `401` | Missing/invalid auth or client not found | Credential/account failure; redact response details. |
| `403` | Account lacks target-resource access | Provider/account policy or target authorization is ambiguous. |
| `404` | Labelled “Not Found,” but description says target refuses authorization | Documentation is internally inconsistent; preserve raw status/body. |
| `408` | Timeout | Retry ownership and billing are not specified. |
| `429` | Account rate limit exceeded | Respect response rate headers/backoff; do not fan out. |
| `500/502/503` | Provider-side issue | Provider failure per table, but origin/provider status separation is not normatively defined. |
| `550` | Faulted after too many retries; not charged | Definitive provider acquisition failure, with attempts hidden. |

**INFERENCE (high):** the response-code page mixes provider and target semantics,
while billing separately refers to target statuses. Public docs do not define a
reliable envelope or header that always distinguishes provider transport status
from final origin status. A Curiosity adapter cannot safely infer ownership from
the number alone.

### 6.2 Rate and size limits

**FACT (high):** published submission limits are:

| Plan label | Included traffic | Total requests/s | Render requests/s |
| --- | ---: | ---: | ---: |
| Free trial | 1 GB | 10 | 3 |
| Micro | 8 GB | 50 | 13 |
| Starter | 38 GB | 50 | 13 |
| Advanced | 88 GB | 50 | 13 |
| Venture | 128 GB | 50 | 13 |
| Business | 333 GB | 100 | 25 |
| Corporate | 700 GB | 100 | 25 |
| Custom+ | Custom | Custom | Custom |

Responses expose one or more
`x-ratelimit-<limit_name>-limit`/`remaining` pairs [S13].

**UNKNOWN:** reset time/header, burst window, concurrency, queueing, per-target
throttle, retry contribution to rate limits, maximum response bytes, monthly
overage behavior beyond plan-specific top-ups, and whether beta browser actions
have separate quotas.

### 6.3 Usage and price snapshot

**FACT (high):** both request and response bytes are metered for successful data;
rendering includes subresource traffic. A free statistics endpoint reports
all-time or day/month/target-grouped counters, average response time, request and
response traffic in bytes, and render/geo counts; access requires a `WU__`
username prefix [S12][S14].

**FACT (high, time-sensitive):** on 2026-08-17 the regular pricing page showed a
1 GB free trial (“up to 10k results”), Micro 8 GB at **$9.40/GB** ($75/month),
Starter 38 GB at **$8.60/GB** ($325/month), and Advanced 88 GB at **$7.50/GB**
($660/month), before a temporary six-month promotion. VAT may apply; top-up
limits are plan-specific [S15]. These are a snapshot, not a quote or durable TCO.

**INFERENCE (high):** a “result” is not the durable meter; bytes are. The trial's
“up to 10k results” is illustrative. Cost varies materially with response size,
POST body size, redirects/provider behavior, and especially rendered subresources.

**RECOMMENDATION (high):** budget per task by maximum calls, request bytes,
response bytes, render calls, wall time, and dollars. Reconcile Curiosity counters
against provider statistics, but do not use target-grouped provider analytics as
fine-grained provenance.

## 7. Caching, freshness, and provenance

**FACT (high):** the sample response contains origin/CDN-like `date`,
`last-modified`, cache headers, cookies, `X-Job-Id`, `X-Session-Id`, and possibly
`X-Oxylabs-Final-Url` [S7]. It is an example, not a normative freshness promise.

**Negative result / UNKNOWN (high confidence):** the reviewed Web Unblocker
sources publish no cache-control request, cache key, cache bypass/revalidation
guarantee, cache age, stale-if-error policy, point-of-presence, proof of origin
contact, or freshness SLA. They do not guarantee the complete redirect chain,
attempt count, attempt timestamps, exit IP/class, selected geo, target connection
time, final request headers/cookies/fingerprint, browser version, CAPTCHA event,
render decision reason, subresource manifest, or response digest.

**INFERENCE (high):** origin-like headers can be useful evidence but are
untrusted target/provider output. A final URL proves only what the provider
reports after redirects; it does not reveal intermediate policy-relevant hops.
`X-Job-Id` is correlation, not source-publication or origin-observation proof.

**RECOMMENDATION (high):** Curiosity should stamp and preserve at least:

```text
request_id, task_id, provider, adapter_version
requested_url, reported_final_url?, observed_redirect_chain?
requested_at, received_at, provider_job_id?, provider_session_id?
requested_localization, observed_exit_geo?, render_mode_requested
render_mode_observed?, browser_plan_digest?, browser_version?
transport_outcome, provider_outcome, returned_http_status, validation_outcome
origin_date?, etag?, last_modified?, age?, cache_status=freshness_unknown
artifact_media_type, byte_length, sha256, storage_reference
policy_decision_id, retention_class, metered_request_bytes?, metered_response_bytes?
provenance_completeness, untrusted_external_data=true
```

Question marks are intentional unavailable fields. Preserve trustworthy-looking
validators without upgrading them to verified truth. Content-address raw and
rendered artifacts separately; never call provider-rendered HTML canonical.

## 8. Security and privacy analysis

### 8.1 TLS interception and credentials

**FACT (high):** Oxylabs repeatedly instructs clients to use `curl -k`,
`verify=False`, trust-all certificate managers, disabled hostname verification,
or `NODE_TLS_REJECT_UNAUTHORIZED=0`; the product page says ignoring its SSL
certificate is required [S1-S6]. The Java example sometimes says to accept
Oxylabs' certificate but implements a trust-all strategy [S2-S3].

**INFERENCE (high):** because the service can inspect/merge HTTPS target headers
and cookies, classify status/content, render pages, and return modified response
headers, TLS is terminated/intercepted within the service path. Trusting *every*
certificate, as the examples do, is broader and more dangerous than trusting a
reviewed Oxylabs interception CA.

**RECOMMENDATION (high):** **REJECT blanket verification disabling.** Obtain the
documented certificate chain/rotation and hostname model; install only an
explicitly reviewed trust anchor in an isolated adapter; retain normal
verification for unrelated traffic; protect proxy credentials in a secret
manager; prohibit origin `Authorization`, session cookies, client certificates,
and confidential POST bodies by default. If a narrow verifiable trust model is
not available, do not integrate.

### 8.2 Hosted execution and untrusted output

**INFERENCE (high):** arbitrary targets plus POST, cookie/header forwarding,
redirect following, page JavaScript, clicks/input, regex-selected XHR, and large
binary output create SSRF, secret exfiltration, stored/DOM injection, malware,
decompression/size, replay, and cost-amplification risks. Provider KYC does not
constrain Curiosity agents or validate each destination.

**RECOMMENDATION (high):** validate DNS/IP before and after every redirect;
reject private, loopback, link-local, metadata, control-plane, and non-HTTP(S)
destinations; enforce domain and port allowlists; stream to bounded quarantine;
sniff/validate media type; scan downloaded artifacts; never execute returned
scripts; and keep provider output out of trusted prompts/control flow without
sanitization and provenance labels.

### 8.3 Provider data handling

**FACT (high):** the General Conditions incorporate documentation and AUP,
permit subcontractors, permit monitoring customer use, and specifically reserve
the right to retain data gathered through Web Unblocker and use it at Oxylabs'
sole discretion [S18, clauses 1.1, 2.2, 4.3.7, 4.3.9]. The public privacy policy
covers account/contact/usage data, service-provider disclosure, transfers, and
communication retention up to five years, but does not define Web Unblocker
payload/log retention [S17].

**FACT (high):** the DPA applies when the customer uses covered services to
process personal data. It frames Oxylabs as processor, requires processing on
documented instructions, makes the subprocessor list available **on written
request**, defines processing duration as long as service use, and requires
delete or return at expiry at the controller's choice [S19].

**UNKNOWN:** operational retention for URLs, headers, cookies, POST bodies,
responses, screenshots, browser actions, failed attempts, and proxy logs;
purposes allowed by GC 4.3.9; deletion during service; backup deletion; data
residency; current subprocessors; government-request practice; encryption/key
boundaries; whether payloads train models; and whether customer terms can disable
retention/use.

**RECOMMENDATION (high):** require a negotiated order/SoW and security addendum
that supersede GC 4.3.9 for customer data, specify no model training/secondary
use, payload/log retention and deletion, regions/subprocessors, encryption,
incident notice, audit evidence, and DPA precedence. Until then, send only
non-sensitive public-web requests and minimize exact URLs/query strings where
they reveal confidential interests or personal data.

**FACT (medium):** Oxylabs represents that Web Unblocker and Web Scraper API have
SOC 2 Type 2 certification and that principal product areas are ISO/IEC
27001:2022 certified; its Trust Center lists a Web Unblocker/Scraper API pentest
summary, some materials access-controlled [S16][S21]. Certificates, scope,
exceptions, and pentest details were not independently inspected here.

## 9. Legal, AUP, and terms risk

**FACT (high):** the AUP prohibits unlawful/IP-infringing access, security
breaches, authentication circumvention, denial of service, ticket-buying bots,
invalid ad traffic, and other abuse. Automated gathering must comply with target
terms/legal documents, is limited to public data absent permission, and must not
collect sensitive health or children's data [S22].

**FACT (high):** the General Conditions make the customer responsible for laws,
target terms, privacy/IP rights, credential security, and third-party claims;
prohibit resale absent agreement; disclaim warranties/results; cap many vendor
liabilities; and contain customer indemnity obligations. They also prohibit
using the service to monitor availability/performance for competitive purposes
and prohibit disassembly, decompilation, and reverse engineering of the service
[S18].

**Clean-room boundary (high confidence):** this dossier did not access the
service or inspect protected implementation. It analyzes public, documented
external behavior for Curiosity's internal procurement/architecture decision.
No bypass algorithm, fingerprint recipe, CAPTCHA technique, hidden endpoint, or
vendor code is reproduced. Any future service test must be separately authorized
and reviewed against the agreement; this document does not authorize it.

**FACT (medium):** Oxylabs says every customer completes KYC, customer activity
is regularly reviewed and monitored, suspicious use may be restricted, and at
least one quarter of annual inquiries are rejected. It represents residential
proxy users as consenting, aware, and fairly rewarded [S16][S23]. These are
vendor claims; underlying customer decisions and proxy-supply consent records
were not inspected.

**RECOMMENDATION (high):** provider reachability, CAPTCHA handling, KYC approval,
or a returned `200` never grants Curiosity legal authority. Keep purpose,
target/terms, robots, privacy, IP/licensing, data-subject, and sensitive-category
decisions in Curiosity's own policy gate, with human review for new high-risk
targets. Counsel must review the current SoW/GC/AUP/DPA and governing law before
adoption.

## 10. Bounded architecture inference

The smallest architecture consistent with the published behavior is:

```text
authenticated TLS-intercepting proxy ingress
  -> request/control-header validation + account/rate/policy gate
  -> target/session/localization planner
       -> predefined header/cookie/fingerprint policy
       -> proxy-class and exit selector
  -> attempt executor
       -> redirect handling
       -> status/content success classifier
       -> retry/configuration rotation loop
       -> optional browser + bounded instruction runner
  -> response selector/rewriter
       -> target-like status/headers/body or HTML/PNG/XHR artifact
       -> X-Job-Id / X-Session-Id / final-URL / rate headers
  -> traffic accounting + usage statistics
```

**INFERENCE (medium):** a short-lived session mapping store is required to bind a
caller session ID to an exit for up to ten minutes; distinct rate accounting is
required for total and render classes; and attempt accounting distinguishes
successful-final traffic from provider-failed attempts. These are logical roles,
not claims about processes, databases, network topology, vendors, or “AI” model
choice.

**UNKNOWN:** whether classification is rules-based, model-based, or both; proxy
pool composition per request; regional processing topology; internal cache;
browser fleet; queue system; CAPTCHA suppliers; data stores; and isolation
mechanisms. Marketing language such as “AI-powered” does not establish any of
them.

## 11. Clean-room lessons and Curiosity verdicts

| Verdict | Pattern | Rationale / required adaptation |
| --- | --- | --- |
| **ADOPT** | Separate fetch, render, screenshot, and browser-action capabilities | Make escalation explicit, policy-bound, observable, and budgeted. |
| **ADOPT** | Sticky exit affinity with a short documented lifetime | Use opaque task-scoped handles; do not imply browser/user continuity. |
| **ADOPT** | Explicit rate-limit headers and request/response byte accounting | Normalize to provider-neutral quota/cost telemetry. |
| **ADAPT** | Geo localization | Type requested proxy geo separately from target locale/delivery preference and observed evidence. |
| **ADAPT** | Provider success-code hints | Use only to influence retry; retain independent semantic validation and never widen billing silently. |
| **ADAPT** | Final URL and job/session correlation headers | Preserve as provider-reported metadata, not complete provenance. |
| **ADAPT** | Bounded declarative browser instructions | Smaller allowlisted DSL, cumulative deadline/action cap, no secrets/submission by default. |
| **REJECT** | `verify=False`, `-k`, trust-all TLS | Use a reviewed narrow interception trust anchor or do not integrate. |
| **REJECT** | `2xx` and all `4xx` as Curiosity success | Separate transport, provider, origin, content, and evidence outcomes. |
| **REJECT** | Opaque retries as one origin observation | Mark attempt details unavailable; do not claim exact source path or timing. |
| **REJECT** | Direct agent control of arbitrary URL/header/cookie/POST/action fields | Prevent SSRF, secret disclosure, side effects, replay, and spend amplification. |
| **REJECT** | Provider reachability/KYC as policy authorization | Curiosity remains responsible for permission, terms, privacy, robots, and purpose. |
| **DEFER** | Production Web Unblocker adapter | Contractual data use, retention, subprocessor/region, TLS trust, error provenance, and controlled tests remain unresolved. |
| **DEFER** | Side-effecting POST or authenticated retrieval | Hidden retry/replay and provider retention make these unsafe without explicit written guarantees. |

## 12. Unknowns and pre-adoption checks

1. Obtain the applicable self-service or enterprise SoW, current GC/AUP/DPA,
   subprocessor list, regions, and order of precedence; contractually override GC
   4.3.9 for customer content.
2. Obtain exact payload/log/failed-attempt/browser/session retention, deletion,
   backup, training/secondary-use, and government-request terms.
3. Obtain the supported proxy certificate chain, hostname validation and rotation
   procedure; verify an isolated narrow trust store without trust-all behavior.
4. Obtain a normative method/status/error envelope that separates provider from
   target failures, plus timeout, redirect, retry, POST replay/idempotency, and
   cancellation semantics.
5. Obtain maximum URL/header/request/result sizes, decompression behavior, total
   and per-target concurrency, rate windows/resets, and browser action/total-time
   bounds.
6. Clarify session clock/expiry, concurrency, cookie/fingerprint state, geo
   changes, retry affinity, and collision/account scope.
7. Clarify geo fallback and provide requested-versus-actual exit evidence.
8. Clarify cache/origin-contact/revalidation behavior and whether a fresh origin
   request can be required and evidenced.
9. Obtain browser engine/version, isolation, navigation/download/pop-up policy,
   screenshot semantics, subresource policy, and beta compatibility/versioning.
10. Review current SOC 2 scope, ISO certificate, pentest summary, exceptions, and
    incident/breach commitments rather than relying on trust-page labels.
11. If legal and procurement reviews pass, run only a separately authorized,
    non-sensitive public sandbox contract evaluation: status-layer separation,
    redirect policy, size/time limits, rate headers, session expiry, geo evidence,
    cache signals, forced render visibility, byte reconciliation, certificate
    validation, and artifact hashing. No target bypass test is authorized here.

## 13. Bounded curiosity pass

Gaps were scored 1–5 on relevance (**R**), decision value (**V**), novelty
(**N**), and reverse-scored cost (**Cheap**, where 5 is cheapest). Only the
highest-value public-source threads were pursued.

| Thread | R | V | N | Cheap | Decision/result |
| --- | ---: | ---: | ---: | ---: | --- |
| Contractual target-data retention/use | 5 | 5 | 5 | 5 | **Pursued:** GC 4.3.9 expressly permits retention and sole-discretion use; DPA creates an unresolved precedence/scope tension [S18-S19]. |
| Can provider and origin status always be separated? | 5 | 5 | 4 | 4 | **Pursued:** response and billing docs were triangulated; no normative separation field found, and `404` prose is inconsistent [S11-S12]. |
| Does proxy TLS have a safe documented trust path? | 5 | 5 | 4 | 4 | **Pursued:** examples consistently disable all verification; no reviewed page published a narrow CA/pinning/rotation procedure. |
| Are freshness/cache and complete retry provenance exposed? | 5 | 5 | 4 | 4 | **Pursued:** sample, request, render, billing, and usage pages reviewed; negative result retained. |
| Resolve exact beta header spelling and zero-wait contradiction | 3 | 3 | 3 | 3 | **DEFER:** public docs conflict; requires authorized contract test or vendor clarification, not speculation. |
| Inspect SDK/GitHub integration code for hidden behavior | 2 | 2 | 3 | 2 | **CURIOSITY_NO_GO:** public contractual surface is the decision boundary; source/license review was not authorized. |
| Infer fingerprint/CAPTCHA/retry algorithms or test bypass success | 1 | 1 | 3 | 1 | **CURIOSITY_NO_GO:** outside decision need and clean-room/safety boundary. |
| Independently audit residential end-user consent | 3 | 5 | 5 | 1 | **CURIOSITY_NO_GO:** requires non-public supplier/audit evidence; vendor representation remains medium confidence. |
| Open an account/free trial to inspect dashboard or certificates | 3 | 4 | 2 | 1 | **CURIOSITY_NO_GO:** explicitly outside caller authority; no credentials or service access permitted. |

**Stop reason:** all requested categories are covered, high-value public-source
gaps saturated into explicit unknowns, and further resolution requires
contractual disclosure, counsel, audit access, or separately authorized testing.

## Sources

All sources were accessed **2026-08-17**. First-party material is authoritative
for the published interface or attributed vendor representation, not independent
proof of implementation, quality, compliance, or legality.

- **[S1]** Oxylabs, “Web Unblocker.” <https://developers.oxylabs.io/products/web-unblocker.md>
- **[S2]** Oxylabs, “Making Requests.” <https://developers.oxylabs.io/products/web-unblocker/making-requests.md>
- **[S3]** Oxylabs, “Session.” <https://developers.oxylabs.io/products/web-unblocker/making-requests/session.md>
- **[S4]** Oxylabs, “Geo-location.” <https://developers.oxylabs.io/products/web-unblocker/making-requests/geo-location.md>
- **[S5]** Oxylabs, “JavaScript rendering.” <https://developers.oxylabs.io/products/web-unblocker/custom-browser-instructions/javascript-rendering.md>
- **[S6]** Oxylabs, “Browser instructions (Beta).” <https://developers.oxylabs.io/products/web-unblocker/custom-browser-instructions/browser-instructions-beta.md>
- **[S7]** Oxylabs, “Sample Responses.” <https://developers.oxylabs.io/products/web-unblocker/sample-responses.md>
- **[S8]** Oxylabs, “Headers & Cookies.” <https://developers.oxylabs.io/products/web-unblocker/making-requests/headers.md>
- **[S9]** Oxylabs, “POST requests.” <https://developers.oxylabs.io/products/web-unblocker/making-requests/post-requests.md>
- **[S10]** Oxylabs, “Custom status code.” <https://developers.oxylabs.io/products/web-unblocker/making-requests/custom-status-code.md>
- **[S11]** Oxylabs, “Response Codes.” <https://developers.oxylabs.io/products/web-unblocker/response-codes.md>
- **[S12]** Oxylabs, “Billing Information.” <https://developers.oxylabs.io/products/web-unblocker/billing-information.md>
- **[S13]** Oxylabs, “Rate Limits.” <https://developers.oxylabs.io/products/web-unblocker/rate-limits.md>
- **[S14]** Oxylabs, “Usage Statistics.” <https://developers.oxylabs.io/products/web-unblocker/usage-statistics.md>
- **[S15]** Oxylabs, “Web Unblocker Pricing.” <https://oxylabs.io/products/web-unblocker/pricing>
- **[S16]** Oxylabs, “Risk and Legal Compliance.” <https://oxylabs.io/risk-and-legal-compliance>
- **[S17]** Oxylabs, “Privacy Policy,” updated 2024-10-14. <https://oxylabs.io/legal/privacy>
- **[S18]** Oxylabs, “General Conditions of oxylabs, UAB Services Agreement,” updated 2024-12-12. <https://oxylabs.io/legal/general-conditions-of-oxylabs-services-agreement>
- **[S19]** Oxylabs, “Data Processing Agreement,” updated 2022-12-01. <https://oxylabs.io/legal/oxylabs-data-processing-agreement>
- **[S20]** Oxylabs, “From Bright Data Web Unlocker.” <https://developers.oxylabs.io/products/web-unblocker/migration-guides/from-bright-data-web-unlocker.md>
- **[S21]** Oxylabs Trust Center. <https://trust.oxylabs.io/>
- **[S22]** Oxylabs, “Acceptable Use Policy,” updated 2024-06-25. <https://oxylabs.io/legal/oxylabs-acceptable-use-policy>
- **[S23]** Oxylabs, “Know Your Customer Policy.” <https://oxylabs.io/kyc-and-safety>
- **[S24]** Oxylabs, “Quick Start: Web Unblocker.” <https://developers.oxylabs.io/get-started/quick-start-web-unblocker.md>

## Confidence summary

- **High:** proxy endpoint/auth shape; documented headers; ten-minute proxy
  affinity; GET/POST; render outputs; beta action grammar; published status,
  rate, traffic-meter, pricing, AUP, GC, and DPA text.
- **Medium:** bounded execution-plane decomposition; TLS-termination inference;
  contractual tension between GC 4.3.9 and DPA; vendor KYC/security/consent
  representations not independently audited.
- **Low/unknown:** cache and origin contact; retry and success algorithms;
  provider/origin status separation in every case; exact exit/proxy class;
  payload/log retention and secondary use in practice; browser fleet/isolation;
  CAPTCHA suppliers; empirical quality, latency, and success rate.
