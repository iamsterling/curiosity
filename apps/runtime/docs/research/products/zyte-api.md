# Zyte API: clean-room contract and architecture dossier

**Research and source-access date:** 2026-08-17

**Decision frame:** Which externally observable Zyte API patterns should
Curiosity adopt, adapt, reject, or defer for bounded web acquisition and
derivation?

**Scope:** Zyte API only. Scrapy Cloud is excluded except where a Zyte API field
or official client explicitly depends on it.

**Method:** Public first-party documentation, OpenAPI-rendered reference,
pricing, Terms, AUP, DPA, and Privacy Policy. No account, credential, paid or
free API call, target request, bypass experiment, private report, source-code
inspection, or implementation was used.

## Executive verdict

**ADAPT as an optional retrieval adapter; do not delegate Curiosity's evidence,
freshness, policy, retry, or budget authority to it (high confidence).** Zyte API
has a strong bounded single-resource contract: one blocking endpoint selects raw
HTTP, rendered DOM, screenshot, browser actions, captured subresponses, and one
typed extraction. Its best lessons are explicit output selection, incompatible-
capability validation, transport-identity sessions, per-action outcomes, typed
provider errors, and feature-level metering. [S1-S12]

The most consequential weaknesses for Curiosity are:

1. an outer HTTP 200 can wrap an origin error, failed actions, or extraction
   mismatch; [S10]
2. raw HTTP certificate validation is documented as **off when omitted or
   false**, whereas browser requests always validate certificates; [S1]
3. anti-blocking choices, including CAPTCHA management and device-residential
   IPs, may be enabled automatically and are not fully disclosed in each
   response; [S6]
4. no reviewed public contract defines response-cache control, cache
   disposition, or live-fetch freshness for ordinary acquisition; and
5. public Terms permit Zyte to use Service Data for product development and
   product training unless an applicable agreement changes that position.
   [S14]

**Verdict:** adopt the capability vocabulary and bounded browser ledger; adapt
all outputs into a stronger Curiosity evidence envelope; reject silent TLS
downgrade, implicit residential/CAPTCHA escalation, infinite retries, and
provider-success semantics; defer sensitive or authenticated data and browser
actions pending contractual and security gates.

## 1. Frame, bounded questions, and evidence rules

Bounded questions:

1. What are the fetch, render, extract, and browser-action contracts?
2. Which anti-blocking, proxy, identity, and session decisions are observable?
3. What does the response prove about source, time, derivation, and freshness?
4. What limits, errors, rate controls, and prices shape safe operation?
5. What privacy, security, legal, and rights constraints affect adoption?
6. What architecture can be inferred without reconstructing private internals?
7. Which lessons transfer cleanly to Curiosity?

Labels:

- **FACT** — directly supported by a cited first-party source.
- **INFERENCE** — clean-room reasoning from public behavior, not a claim about
  Zyte's private implementation.
- **RECOMMENDATION** — a proposed Curiosity or procurement choice.
- **UNKNOWN / NEGATIVE RESULT** — not established in the reviewed public
  sources; absence is not proof of absence in the service.

Confidence is **high**, **medium**, or **low**. Vendor performance statements
remain vendor claims. This report does not provide legal advice.

## 2. Product boundary and unit of work

| Surface | Observable unit | Output | Boundary | Verdict |
|---|---|---|---|---|
| `POST /v1/extract` | One absolute URL; synchronous/blocking | Selected raw, browser, capture, or extraction fields | Short-running resource operation, not crawl scheduling | **ADAPT** |
| HTTP acquisition | One target HTTP exchange after redirects | Base64 body, selected headers, cookies, final URL/status | Provider may alter the browser-like request profile | **ADAPT** |
| Browser acquisition | One request-scoped browser run | Serialized DOM, screenshot, action ledger, captures | Not a persistent browser; 60-second action budget | **DEFER** actions |
| Automatic extraction | One standard data type | Typed object/list plus metadata | Derived data; at most one type/request | **ADAPT** |
| Proxy mode | Proxy-compatible request | Direct body plus response headers | Deliberately narrower, lower-overhead façade | **DEFER** |
| Stats API | Aggregated usage query | Count, cost, traffic, latency, status/domain health | Operations telemetry, not item provenance | **ADOPT** pattern |

**FACT (high):** The canonical endpoint requires Basic authentication, accepts
one absolute URL no longer than 8,192 characters, rejects an IP literal as the
host, limits the request body to 5 MiB, blocks until ready, and requires at least
one output field. [S1]

**INFERENCE (high):** Zyte API is an acquisition/derivation primitive, not a
frontier, revisit scheduler, archive, or crawl graph. The `jobId` field is only a
tracking bridge when a request originates from Scrapy Cloud; it does not turn
the endpoint into a crawl job. [S1]

**RECOMMENDATION (high):** Curiosity should schedule, deduplicate, revisit, and
apply per-origin policy above provider adapters. Provider concepts such as
`jobId`, API-key labels, and price tiers must not enter its neutral core.

## 3. Fetch and render contract

### 3.1 Explicit output selection and compatibility

**FACT (high):** Principal outputs are `httpResponseBody`,
`httpResponseHeaders`, `browserHtml`, `screenshot`, and one automatic extraction
field. `httpResponseBody` cannot be combined with browser-exclusive features;
`httpResponseHeaders` can accompany most valid combinations; SERP extraction is
more restrictive. Multiple standard extraction types cannot be requested
together. Invalid combinations return 422 `/request/unprocessable`. [S1][S10]

**FACT (high):** Raw body and browser HTML are each capped at 10 MB before
Base64 encoding; longer output is truncated. The FAQ does not document a
corresponding truncation flag. Request text/binary body fields are capped at
400,000 characters, and custom HTTP request headers at 200 entries. [S1][S13]

**RECOMMENDATION — ADOPT/STRENGTHEN:** Use explicit requested representations
and pre-dispatch capability validation. Add mandatory byte counts, hashes, and
`truncated: true|false|unknown`; a silently clipped document is not complete
evidence.

### 3.2 Raw HTTP acquisition

**FACT (high):** HTTP mode supports GET, POST, PUT, DELETE, OPTIONS, TRACE,
PATCH, and HEAD; UTF-8 or Base64 request bodies; custom headers; response body;
and response headers. The response body is Base64 and is already decompressed,
so an origin `Content-Encoding` header must not be applied again. [S1][S2]

**FACT (high):** Caller headers can be dropped or overridden for ban avoidance;
`Cookie` must use structured cookie fields. Zyte aims to return the response a
browser network stack would receive, which may differ from `curl`. [S1][S2][S10]

**FACT (high, security-critical):** `verifyCertificate` is HTTP-only. The
reference says that when omitted or false, target TLS certificates are **not
validated** for historical compatibility; setting it true makes certificate
failure an error. Browser requests always validate and silently ignore this
field. [S1]

**FACT (high):** HTTP redirects are followed unless configured otherwise; the
response `url` is the post-redirect URL and `statusCode` is the final origin
status. The reviewed response schema exposes no full redirect chain. [S1][S2]

**RECOMMENDATION — REJECT DEFAULT:** Curiosity must force certificate validation
and fail closed. It should deny TRACE by default, re-authorize every redirect,
cap redirect count, and separate caller headers from provider-effective headers.
Do not allow an adapter's historical compatibility default to weaken core TLS
policy.

### 3.3 Browser acquisition

**FACT (high):** `browserHtml` is serialized DOM after rendering and actions,
not origin response bytes. Iframes are empty unless `includeIframes` is enabled;
screenshots can still show them. Element selectors cannot enter iframe or shadow
DOM content; evaluate/scripts are the documented alternatives. [S1][S3]

**FACT (high):** The initial browser request supports neither arbitrary method,
body, nor headers (only Referer is documented). Redirects, page JavaScript, and
actions may issue later requests with unrestricted methods/bodies/headers, and
those can be observed through network capture. Browser redirects always follow.
[S1][S3]

**FACT (high):** Browser JavaScript is enabled by default for most websites but
may be disabled for some; a request can select it. Screenshots are Base64 PNG or
JPEG (JPEG default quality 75%). Full-page output is JPEG-only, at least
1920x1080, and clipped at 5000x10000 pixels. [S1][S3]

**INFERENCE (high):** A browser request is a broader network-authority unit than
its seed URL. Page code and actions can generate subrequests and navigations that
the initial request schema cannot express.

**RECOMMENDATION — DEFER:** Browser mode needs a separate policy lane: seed and
redirect allowlist, browser-subrequest egress controls, no credentials, no
downloads, strict time/byte/navigation budgets, and explicit artifact lineage.
Serialized DOM, screenshot, and captured response are separate artifacts.

## 4. Browser-action and capture contract

### 4.1 Action program

**FACT (high):** The public schema lists click, double-click, evaluate, goto,
hide, hover, interaction, key press, reload, scroll, search, select, location,
type, and multiple wait operations. CSS and XPath 1.0 selectors are supported.
Action-specific inputs are bounded; for example, selector values are 1-500
characters and click navigation wait is 0-20 seconds. [S1][S3]

**FACT (high):** Actions execute sequentially before artifacts and extraction
are produced. `onError` defaults to `return` (stop the sequence); `continue`
executes later actions. Even when a sequence ends prematurely, the service
returns artifacts reflecting state reached so far. [S1]

**FACT (high):** There is no documented action-count ceiling, but total browser
execution is capped at 60 seconds. At the cap, the active action is interrupted,
later actions do not run, and requested output is returned from the partial
state. The response action ledger includes status, error, and elapsed time.
[S3][S10]

**FACT (high):** Zyte distinguishes generic actions, website-specific special
actions, and browser scripts. Special-action availability is discovered by
sending a test request; unsupported use returns an error. Browser scripts depend
on Zyte IDE/Scripting surfaces outside the core endpoint and were not expanded
in this API-only study. [S3]

**RECOMMENDATION — ADOPT/STRENGTHEN:** Curiosity should use an ordered action
ledger, event-based waits, and explicit `complete | partial | failed` status.
Also cap action count, navigation count, per-action time, total wall time, and
output bytes. Do not discover capabilities through paid runtime failures; use a
versioned capability registry.

**RECOMMENDATION — REJECT/DEFER:** `goto`, evaluate, typing, form interaction,
location changes, and target-specific actions can cause side effects or broaden
access. They must be unavailable to an autonomous model by default and require a
separately authorized use case.

### 4.2 Network capture

**FACT (high):** Up to ten ordered filter sequences can match browser network
responses by case-sensitive URL or resource criteria. At most ten responses are
returned, and their combined bodies may not exceed 5 MiB; earlier matches win
when the body budget is exhausted. Regex and wildcard matching are not supported.
[S1][S3]

**RECOMMENDATION — ADOPT:** Treat capture as a bounded artifact collection with
per-item URL, status, headers/body selection, byte count, hash, truncation state,
and causal link to render/action. A missing later response can mean budget
exhaustion, not network absence.

## 5. Extraction and derivation

### 5.1 Standard extraction

**FACT (high):** Standard schemas cover products, product lists/navigation,
articles, article lists/navigation, forum threads, job postings/navigation,
generic page content, and SERP. All except SERP are described as AI-powered;
SERP is non-AI. Only one schema is allowed per request. [S1][S4]

**FACT (high):** Extraction can use raw HTTP, rendered browser material, or
caller-provided `userHtml`. Raw HTTP is usually faster/cheaper. Browser extraction
can use DOM only (`browserHtmlOnly`) or DOM plus visual features (`browserHtml`).
`userHtml` performs no download/render, is normally limited to 2.5 MiB, still
requires a URL for relative-link resolution, and incurs extraction-only cost.
[S4]

**CONTRADICTION / CONTRACT DRIFT (high):** The extraction guide documents
`browserHtmlOnly`, while the rendered top-level `extractFrom` enum observed in
the API reference lists only `httpResponseBody`, `browserHtml`, and `userHtml`.
Per-type schema generation or documentation may be out of sync. Do not assume
runtime acceptance from prose. [S1][S4]

**FACT (high):** A content/type mismatch remains outer HTTP 200. Single-item
metadata contains a probability in [0,1] and recommends 0.5 as a threshold;
list-item probabilities are explicitly not calibrated. Standard extraction
metadata includes required `dateDownloaded` in UTC ISO-8601 form. [S1][S10]

**FACT (high):** Some extraction types allow model pinning. Zyte says models are
retrained a few times per year, pinned versions remain for at least one year
after release, and users get at least three months' removal notice. [S4]

**RECOMMENDATION — ADAPT:** Preserve `dateDownloaded`, extraction source, model
pin, schema digest, and mismatch probability, but do not interpret probability
as field truth. Pinning controls change; it does not establish reproducibility
without retained source artifacts and a complete model/runtime identifier.

### 5.2 Custom attributes

**FACT (high):** Custom attributes require a standard AI extraction type (not
SERP), which scopes the text passed to a Zyte-operated LLM. `generate` supports
generative normalization, summary, translation, arrays/objects, and analysis;
`extract` is non-generative, fixed-price, and limited to simple scalar fields.
[S5][S11]

**FACT (high):** Output is guaranteed to conform to the requested schema, but
fields are effectively nullable/omittable. Zyte warns that larger schemas reduce
quality and mathematical transformations cannot always be correct; it recommends
verbatim extraction followed by deterministic transformation. [S5]

**RECOMMENDATION — ADOPT/REJECT:** Adopt the distinction between extractive and
generative derivation. Reject “schema-valid = factually valid.” Preserve source
text and field grounding before normalization; do arithmetic and canonicalization
deterministically. Generative explanation must never become evidence provenance.

## 6. Anti-blocking, proxy, cookies, and sessions

### 6.1 Observable anti-blocking policy

**FACT (high):** Zyte chooses a target-dependent IP type and geolocation when the
caller does not override them. `ipType` is datacenter or residential. Explicit
residential selection requires KYC and changes cost. Country is the public geo
granularity; finer locality usually relies on cookies/actions/sessions. [S1][S6]

**FACT (high):** Documented anti-ban behavior includes browser-like headers and
ordering, cookie management, session continuity across IP/network stack/cookie
jar, retries, CAPTCHA management, residential IPs, and target-specific handling.
Zyte says it does not automatically log in and cannot automatically retrieve
material always locked behind login. [S6][S10]

**FACT (high):** CAPTCHA management and device-residential IPs are account
permissions enabled by default. They can be disabled; disabling residential
also disables extended geolocations and may increase bans. A domain may be
blocked with 451 `/download/domain-forbidden`. [S6][S10]

**UNKNOWN (high importance):** The ordinary success response does not clearly
declare which automatic anti-ban techniques, effective exit class/location,
header overrides, CAPTCHA handling, or retry attempts were used.

**RECOMMENDATION — REJECT DEFAULT:** Curiosity should request datacenter-only
and no CAPTCHA unless a separately governed capability is approved. Residential
or challenge handling requires target policy, lawful-purpose and peer-network
review, explicit operator authorization, provenance, and spend limits.

### 6.2 Proxy compatibility mode

**FACT (high):** Proxy mode uses `api.zyte.com:8011`, with an HTTPS-proxy
interface on 8014. It returns the target body directly and avoids the Base64/JSON
overhead of the HTTP API. `Zyte-*` headers select a subset of controls. [S7]

**FACT (high):** Compared with the canonical API, proxy mode lacks screenshots,
actions, network capture, JavaScript control, automatic extraction,
server-managed sessions, and echo data; cookies can target only the target
domain. It injects a unique `Zyte-Request-ID`, but its documentation says it is
not optimized as a local-browser proxy. [S7]

**INFERENCE (high):** Proxy mode is a lossy migration façade over a richer
acquisition control plane.

**RECOMMENDATION — DEFER:** Implement only for a proven migration need. A
compatibility adapter must advertise lost capabilities and must not become the
provider-neutral contract.

### 6.3 Cookies and transport sessions

**FACT (high):** Cookies use structured request/response fields. If the caller
provides none, Zyte may add cookies to reduce bans; `cookieManagement: discard`
disables automatic cookies while preserving explicit caller cookies. [S6]

**FACT (high):** A Zyte session is shared transport identity—IP, network stack,
cookie jar, and related conditions—not browser-tab, process, machine, DOM, or
JavaScript-heap persistence. Browser persistence is described as planned, not
current. [S6]

**FACT (high):** Client-managed sessions use caller UUIDv4 IDs and may expire at
15 minutes from creation, two minutes since use, or three consecutive bans; an
expired ID is tombstoned for 5-10 minutes. Server-managed sessions use up to ten
context pairs and expire after four hours or three bans. [S1][S6]

**RECOMMENDATION — ADOPT:** Model this as `transport_session`, never `browser`.
Session identifiers and cookies are secret-bearing, adapter-scoped state. They
must have explicit expiry, purpose, target scope, and deletion.

## 7. Freshness, cache, and provenance

### 7.1 What the public contract establishes

**FACT (high):** Ordinary responses expose final URL and origin status; selected
headers/cookies can be returned. Extraction records have `dateDownloaded`.
`echoData` round-trips caller metadata, `tags` support Stats filtering, action
records expose execution outcomes, and proxy mode returns a provider request ID.
[S1][S6][S7][S12]

**FACT (high):** Stats API aggregates request count, status, billed traffic,
average/p80 cost and latency, features, extraction type/source, tags, time, and
domain. Domain health is limited to recent/top domains and recalculated every
three hours, so it is not per-page provenance. Stats uses a dashboard API key
separate from the Zyte API key and is limited to 20 RPM. [S12]

### 7.2 Negative results and gaps

**NEGATIVE RESULT (medium-high):** No reviewed first-party Zyte API page defines
an ordinary acquisition response cache, cache key, cache hit/miss field,
`maxAge`, `maxStale`, force-refresh control, or stale-if-error behavior.
Therefore neither “always live” nor “may be cached” is a contractual conclusion.

**NEGATIVE RESULT (high):** Raw HTTP and browser responses do not clearly carry
a guaranteed fetch timestamp comparable to extraction `dateDownloaded`.

**NEGATIVE RESULT (high):** The reviewed response contract does not guarantee a
full redirect chain, effective anti-ban choices, browser/runtime version,
render-policy version, every extractor build, per-field source spans/regions,
content hashes, robots/policy decision, truncation flag, or per-response billed
cost. Aggregate Stats cannot repair missing item lineage.

**RECOMMENDATION — ADAPT:** Curiosity must own freshness and evidence:

```text
local_request_id, provider_request_id, crawl/discovery lineage
requested_url, canonical_url, final_url, redirect_chain
request_fingerprint, representation key, session scope
requested_at, fetch_started_at, origin_observed_at, completed_at
transport_status, origin_status, policy_status, semantic_status
requested/effective fetch mode, geo, IP class, header policy
TLS verification, render/action/capture program digests
cache policy and disposition, validators, raw/rendered hashes
extractor/model/schema, extraction source, dateDownloaded
field -> source artifact/span/region/confidence
robots/rights/policy decision, retry lineage, cost, limits/truncation
```

Acquisition cache keys must include URL, method/body, representation-affecting
headers/cookies, geo/IP/device, render/action settings, and session scope.
Derivation keys must additionally include source-artifact hash, schema, model,
and extraction options. Search and extraction outputs remain untrusted.

## 8. Limits, errors, retries, and prices

### 8.1 Limits

| Dimension | Published value | Consequence |
|---|---:|---|
| API request body | 5 MiB | Includes selected configuration/user HTML [S1] |
| URL | 8,192 chars; domain host, not IP | Partial SSRF guard, not a complete redirect/egress policy [S1] |
| Raw/browser output | 10 MB before Base64 | Longer output truncated [S13] |
| Browser action wall time | 60 s | Partial artifacts returned [S3] |
| Network filters/results/bodies | 10 / 10 / 5 MiB combined | Earlier captures win [S1] |
| Standard-plan API-key rate | 3,000 RPM | Additional target/account-target/platform limits apply [S8] |
| Enterprise rate | Pricing table says 10,000 RPM; rate page says custom | Order-form check required [S8][S11] |
| Stats API | 20 RPM | Separate operations budget [S12] |

**FACT (high):** Rate limits are RPM, not concurrency. Zyte estimates required
concurrency as `RPM / 60 * average seconds`; browser calls commonly take 10-30
seconds. Increasing parallelism can slow targets or increase failures. [S8][S9]

**RECOMMENDATION:** Keep global, tenant, origin, and tenant-origin controls plus
hard action/render worker limits. Provider RPM is a ceiling, not permission to
send that traffic to one origin.

### 8.2 Error and success semantics

**FACT (high):** Zyte's outer 200 means it provided requested ban-free data, even
if the origin status is non-200, actions failed, extraction type mismatched, or
content differs from a non-browser client. Origin status is in `statusCode`.
[S10]

**FACT (high):** Machine-readable classes include 429 account/domain/account-
domain limits; 503 extractor/global overload; 520 temporary download/ban; 521
permanent/internal download; 500 timeout/internal; 400 malformed/invalid; 401
authentication; 421 unreachable domain; 422 incompatible request; 451 forbidden
domain; and 403 suspended account. Rate-limit and unsuccessful responses are not
charged. [S10][S11]

**FACT (high):** Zyte advises randomized exponential backoff, indefinite retry
for rate limiting, and bounded retry for other unsuccessful responses. It warns
that some intermittent 521 responses may be misclassified bans and can be
treated as 520 for an affected target. [S10]

**RECOMMENDATION — ADOPT/REJECT:** Adopt typed provider/target/policy/semantic
states and explicit retry classes. Reject indefinite in-process retry and ad hoc
target reclassification: cap attempts, elapsed time, bytes, spend, and deadline,
then return `deferred` to the scheduler. Policy changes require versioned
evidence.

### 8.3 Pricing observed 2026-08-17

**FACT (high, time-sensitive):** Only Zyte-successful responses are charged.
Base cost depends on target, HTTP versus browser, and one of five automatically
assigned tiers per request type. New target/type combinations receive a
temporary tier; tiers are reviewed quarterly with two weeks' notice. Exact base
tier prices and distribution are delegated to a dynamic pricing page/estimator.
[S11]

**FACT (high):** Add-ons include action CPU/network, capture output size,
screenshot ($0.002), standard extraction ($0.0004-$0.0016; SERP free), generative
custom attributes ($0.002/1k input tokens + $0.01/1k output tokens), and fixed
extractive custom attributes ($0.001), before discounts. Residential/extended
geo adds traffic-sensitive cost. [S11]

**FACT (high):** Standard PAYG displayed $5 initial first-month credit, 3,000
RPM, and a $100/month plan spending limit. Commitment options pair $100-$500
monthly commitments with $200-$2,500 plan limits and 25%-52% discounts.
Organization and API-key blocking limits exist; domain alerts are informational,
not blocking. The pricing page also warns some plans permit overage beyond base
limits unless a blocking limit is configured. [S11]

**UNKNOWN:** No exact universal cost/1,000 requests can be stated because target
tier, feature mix, traffic, retries, and discounts vary.

**RECOMMENDATION — ADOPT:** Preflight expected/worst-case cost; attach estimated
and actual cost to every local request; enforce job/domain/tenant/provider hard
budgets before provider plan limits. A billed outer 200 does not prove useful
retrieval.

## 9. Privacy, security, and legal boundary

### 9.1 Security posture established publicly

**FACT (medium-high):** The DPA says Zyte applies Article 32-oriented technical
and organizational measures, confidentiality, centralized event logs,
least-privilege administrative access, daily vulnerability scans, incident
management, TLS 1.2 in transit, cloud providers certified to ISO 27001, and a
risk program aligned to ISO 27001. These are contractual statements, not an
independent audit reviewed here. [S16]

**FACT (high):** The DPA requires notice of a Security Event without undue delay
and within 72 hours, permits subprocessors under written obligations, makes Zyte
responsible for them, and uses transfer mechanisms for restricted transfers.
Service Personal Data retention is “as specified in the Agreement.” [S16]

**UNKNOWN:** Public material reviewed did not establish API request/response
body retention, debug/session/log retention, backup deletion, tenant cache
isolation, exact processing regions, current full subprocessors, API-key scopes,
SSO/audit controls by plan, or a downloadable current independent assurance
report.

**RECOMMENDATION — DEFER SENSITIVE USE:** Obtain Trust Center evidence, current
subprocessor/region matrix, retention/deletion schedule, key/RBAC controls,
penetration and assurance reports, and incident/deletion terms before adoption.
The HTTP TLS default must also be contract-tested on an owned benign fixture if
later authorized.

### 9.2 Service Data, personal data, and training

**FACT (high):** Terms define Service Data broadly as data extracted through the
software, including screenshots. They permit Zyte to use Service Data, Data
Feeds, code, content, and other service data for product development and product
training unless an applicable agreement alters that result. [S14]

**FACT (high):** For Service Personal Data, the DPA makes the customer controller
and Zyte processor; the customer warrants lawful instructions, notices/consent,
and compliant collection/use. International processing/transfers may occur.
[S14][S16][S17]

**FACT (high):** Privacy-policy retention is purpose-based: support tickets are
typically deleted after four years, billing details after seven years, and
service-usage logs are kept as long as needed for service security/integrity.
It gives no single public duration for fetched API content. [S17]

**RECOMMENDATION — PROCUREMENT BLOCKER:** Require an order-form override barring
independent use/model training, defined content/log/cache retention, deletion
SLA, and approved regions before any confidential, personal, unpublished, or
regulated material. Do not send credentials, private pages, or logged-in content.

### 9.3 Access rights and acceptable use

**FACT (high):** Terms limit Services to scraping publicly accessible websites,
make the customer responsible for legality and ethical internal use, allow Zyte
to stop target activity after a cease request or legal/operational/business risk,
and provide no copyright permission or non-infringement warranty for Service
Data. [S14]

**FACT (high):** The AUP prohibits unlawful/fraudulent collection, privacy-law or
rights violations, access where the customer explicitly accepted terms
prohibiting that manner of access/use, LinkedIn scraping, security testing,
unauthorized access, specified harmful content, and material interference with a
site. It specifically prohibits screenshots for personal data, copyrighted
material, or illegal content. It also prohibits using the Services, Service Data,
or Data Feeds to build or support EU AI Act prohibited or high-risk systems,
listing recruitment/employment among its examples. [S15]

**FACT (high):** The AUP prohibits attempting to decipher, decompile, reverse
engineer, or discover Zyte service/software source. The Terms also say automated
service use by an AI agent or scripted process constitutes acceptance by the
natural or legal person that develops, deploys, or operates it. [S14][S15]

**NEGATIVE RESULT (high importance):** No reviewed Zyte API contract states that
the single-resource endpoint automatically enforces `robots.txt`, crawl delay,
Curiosity's target terms, copyright/data rights, or purpose limitation.

**RECOMMENDATION — ADOPT/STRENGTHEN:** Curiosity must authorize before calling
the provider: public-access check, target allow/deny, robots snapshot/rule,
politeness, purpose, data category, terms/rights review, complaint/cease path,
artifact-use rights, and budget. Provider technical success or KYC is not target
authorization.

## 10. Clean-room architecture inference

The following is **INFERENCE**, not Zyte implementation disclosure.

```text
canonical request / proxy façade
          |
   auth + schema validation
          |
 capability / policy / cost planner
          |
 target-aware acquisition control
   | HTTP profile + TLS/redirect
   | browser worker + action runner
   | IP/geo/cookie/session selection
   | retry/ban/rate control
          |
 raw/render/capture artifacts
          |
 optional standard extractor
          |
 optional custom-attribute LLM
          |
 response assembly
          +------> usage/billing/domain telemetry
```

### A. Capability planner — **medium-high confidence**

Evidence: one endpoint, incompatible feature combinations, target-dependent
defaults, request-type tiers, automatic extraction source, and a narrower proxy
façade. A planner can map requested outputs to HTTP/browser/extractor resources.
[S1][S7][S11]

### B. Target-adaptive anti-ban control plane — **medium confidence**

Evidence: website and account-website limits, domain health, automatic IP/geo,
target tiers, and target monitoring. Domain telemetry likely influences request
policy, but signals, models, fingerprints, and update process are unknown.
[S6][S8][S10-S12]

### C. Request-scoped browser workers — **high confidence logically**

Evidence: 60-second action budget and explicit statement that sessions preserve
neither browser process nor tab/machine. Physical pooling is possible, but the
contract is disposable request state. [S3][S6]

### D. Separate identity/session service — **medium-high confidence**

Evidence: client UUID sessions, server context sessions, shared cookie/IP/network
conditions, independent expiry/ban invalidation, and tombstones. [S1][S6]

### E. Asynchronous telemetry/billing path — **medium confidence**

Evidence: request tags/echo, separate Stats credentials/host, aggregate p80s,
and domain health recalculated every three hours. It should not be treated as
synchronous item evidence. [S1][S12]

## 11. Curiosity implications and verdict ledger

### ADOPT

1. Explicit `fetch | render | capture | extract` capabilities and invalid-
   combination validation.
2. One bounded resource per provider call; scheduling and frontier remain owned.
3. Ordered browser-action ledger and explicit partial completion.
4. Event/condition waits over fixed sleeps.
5. Transport-identity session semantics distinct from browser persistence.
6. Typed provider, origin, policy, and retry states.
7. Extraction source declaration, model pinning, mismatch signal, and download
   timestamp.
8. Feature/tag/domain cost telemetry and hard spending controls.
9. Compatibility interfaces as narrower façades, never canonical contracts.

### ADAPT

1. Outer provider success -> separate transport/origin/action/extraction/
   semantic states.
2. Output selection -> add hashes, byte counts, truncation, capture lineage, and
   immutable local evidence references.
3. Provider defaults -> require explicit TLS, IP class, geo, cookie, CAPTCHA,
   render, retry, and cache policy.
4. Date downloaded -> retain all request/fetch/origin/completion timestamps.
5. Aggregate Stats -> local request-level cost and evidence records.
6. Provider retries -> owned deadline, attempts, bytes, and cost budgets.
7. Extraction schemas -> source spans/regions and deterministic validation.

### REJECT

1. Omitted/false HTTP certificate verification.
2. Default residential or CAPTCHA escalation.
3. Infinite rate-limit retry inside an API worker.
4. Outer HTTP 200 as retrieval-quality success.
5. Silent partial browser or truncated-content acceptance.
6. Generative/schema-valid output as evidence without grounding.
7. Automatic provider choices absent from provenance.
8. Aggregate logs/Stats as durable item provenance.
9. Any assumption that technical access grants legal/data-use rights.

### DEFER

1. A Zyte API adapter until contract/security gates and an authorized no-cost
   owned-domain test plan exist.
2. Browser actions, evaluate/scripts, and target-specific interactions pending a
   separate threat model and side-effect policy.
3. Residential IPs and CAPTCHA management pending legal, ethical, peer-network,
   and target-policy review.
4. Sensitive/personal/confidential content pending no-training, retention,
   deletion, subprocessor, and regional terms.
5. Proxy mode until a concrete migration requirement exists.
6. Automatic extraction as an evidence source until field grounding and quality
   are evaluated on a licensed fixture corpus.

## 12. Unknowns and required checks

| Unknown / risk | Confidence now | Required check before reliance |
|---|---:|---|
| Ordinary response cache and live-fetch guarantee | Low | Written product/contract answer; owned-fixture test only if authorized |
| Cache key, isolation, validators, stale behavior | Low | Security architecture and contract review |
| Exact API body/log/session/capture retention | Low | Order form, DPA annex, Trust Center, deletion SLA |
| Training use and opt-out for the proposed account | High that public Terms permit; low on exceptions | Written no-training/no-independent-use override |
| Raw/browser authoritative fetch timestamps | Low | Current OpenAPI/headers and vendor confirmation |
| Full redirect chain and per-hop URL/IP policy | Low | Security statement and owned redirect fixture |
| Private/link-local/metadata destination blocking, including redirects/subrequests | Low | SSRF/egress architecture; controlled security test under separate authority |
| Effective IP class, geo, headers, CAPTCHA, and retry attempts | Low | Response/telemetry contract or vendor confirmation |
| Browser engine/version/update policy | Low | Compatibility and change-management commitment |
| Universal request ID on canonical JSON API | Low-medium | Current documented response headers/OpenAPI or vendor response |
| `browserHtmlOnly` runtime support | Medium-low | Versioned OpenAPI and non-billable schema validation/vendor answer |
| Truncation indicators | Low | Contract confirmation and owned oversized fixture |
| Robots/politeness behavior | Low | Explicit Zyte answer; Curiosity enforces independently regardless |
| Extraction field grounding and exact model build | Low | Current schema, model card/change log, controlled quality test |
| Standard 10k Enterprise RPM versus custom rate wording | Medium | Order form/SLA |
| Exact target-tier prices and cost distribution | Low/time-sensitive | Current estimator and negotiated schedule at decision time |
| Current subprocessors, processing regions, assurance reports | Low | Trust Center/account procurement package |

## 13. Clean-room transfer rules

1. Transfer behavioral requirements and acceptance criteria, not Zyte private
   methods, anti-bot fingerprints, target playbooks, prompts, or schemas.
2. Author Curiosity's provider-neutral contracts independently; keep Zyte field
   names and price tiers inside an adapter specification.
3. Do not inspect service binaries, private interfaces, or proprietary source;
   the AUP expressly prohibits service/software reverse engineering. [S15]
4. Preserve source attribution and the access date in this dossier.
5. Treat official SDKs as explicit dependencies with their own license and
   supply-chain review; no SDK or Scrapy Cloud component was adopted here.
6. Do not probe protected targets, CAPTCHA systems, residential peers, private
   addresses, or account-only surfaces without a separately approved test frame.
7. Re-check public contract, OpenAPI, prices, legal terms, and model lifecycle
   immediately before procurement.

## 14. Bounded curiosity pass

After synthesis, gaps were scored 1-5 for **relevance (R)**, **decision value
(V)**, **novelty (N)**, and **cost (C, lower is better)**. Only public primary-
source checks requiring no account, request, or bypass were eligible. Priority
was approximately `R + V + N - C`.

| Thread | R/V/N/C | Result |
|---|---:|---|
| HTTP TLS verification default | 5/5/5/1 | **Pursued.** Reference establishes validation is off when omitted/false; elevated to rejection criterion. [S1] |
| Cache/freshness contract | 5/5/4/2 | **Pursued to saturation.** No ordinary cache/freshness control or guarantee found; negative result retained. |
| Extraction provenance timestamp | 5/4/4/1 | **Pursued.** Found required `dateDownloaded` for extraction metadata; narrowed, rather than overstated, the provenance gap. [S1] |
| Action partial-state/on-error semantics | 5/5/3/1 | **Pursued.** Default stop-on-error plus partial response confirmed. [S1][S3] |
| Terms training and screenshot restrictions | 5/5/4/1 | **Pursued.** Material procurement and artifact constraints confirmed. [S14][S15] |
| `browserHtmlOnly` guide/reference drift | 4/4/4/2 | **Pursued.** Contradiction retained; runtime remains unknown. [S1][S4] |
| Exact anti-block algorithms/fingerprints | 2/2/4/5 | **CURIOSITY_NO_GO:** proprietary, bypass-adjacent, prohibited by clean-room need, and irrelevant to contract verdict. |
| Live success/CAPTCHA/residential tests | 2/3/3/5 | **CURIOSITY_NO_GO:** caller forbade tests/credentials/bypass; target-specific results would not generalize. |
| SSRF/TLS exploit or private-target probing | 4/4/4/5 | **CURIOSITY_NO_GO:** no authorized isolated fixture or security-test frame; retained as procurement unknown. |
| Account-only Trust Center/SOC evidence | 4/4/2/5 | **CURIOSITY_NO_GO:** access unavailable in public no-account budget; mandatory procurement check. |
| Scrapy Cloud jobs/frontier/deployment | 1/1/1/4 | **CURIOSITY_NO_GO:** explicitly excluded; only `jobId`/client dependency boundary recorded. |
| Competitor benchmark | 1/2/2/5 | **CURIOSITY_NO_GO:** outside single-product decision and requires a declared corpus/budget. |
| Jurisdiction-specific scraping legality | 5/5/3/5 | **CURIOSITY_NO_GO:** counsel task beyond research authority; technical and contractual boundaries retained. |

**Stop reason:** coverage plus saturation. Every requested category has primary
evidence; remaining material questions require an account agreement, vendor
answer, assurance access, counsel, or controlled test authority. No autonomous
follow-up is authorized.

## 15. Sources

All sources are first-party Zyte materials accessed **2026-08-17**.

- **[S1]** Zyte API reference / rendered OpenAPI:
  <https://docs.zyte.com/zyte-api/usage/reference.html>
- **[S2]** Zyte API HTTP requests:
  <https://docs.zyte.com/zyte-api/usage/http.html>
- **[S3]** Zyte API browser automation:
  <https://docs.zyte.com/zyte-api/usage/browser.html>
- **[S4]** Zyte API automatic extraction:
  <https://docs.zyte.com/zyte-api/usage/extract/index.html>
- **[S5]** Custom attributes extraction:
  <https://docs.zyte.com/zyte-api/usage/extract/custom-attributes.html>
- **[S6]** Zyte API shared features (geo, IP, cookies, sessions, permissions):
  <https://docs.zyte.com/zyte-api/usage/features.html>
- **[S7]** Zyte API proxy mode:
  <https://docs.zyte.com/zyte-api/usage/proxy-mode.html>
- **[S8]** Zyte API rate limits:
  <https://docs.zyte.com/zyte-api/usage/rate-limit.html>
- **[S9]** Optimizing Zyte API usage:
  <https://docs.zyte.com/zyte-api/usage/optimize.html>
- **[S10]** Zyte API error handling:
  <https://docs.zyte.com/zyte-api/usage/errors.html>
- **[S11]** Zyte API pricing:
  <https://docs.zyte.com/zyte-api/pricing.html>
- **[S12]** Zyte API Stats API:
  <https://docs.zyte.com/zyte-api/usage/stats/index.html>
- **[S13]** Zyte API FAQ:
  <https://docs.zyte.com/zyte-api/faq.html>
- **[S14]** Zyte Terms of Service:
  <https://www.zyte.com/terms-policies/terms-of-service/>
- **[S15]** Zyte Acceptable Use Policy:
  <https://www.zyte.com/terms-policies/acceptable-use-policy/>
- **[S16]** Zyte Data Processing Agreement:
  <https://www.zyte.com/terms-policies/dpa/>
- **[S17]** Zyte Privacy Policy (page states effective 2024-08-30):
  <https://www.zyte.com/terms-policies/privacy-policy/>

## 16. Confidence summary

- **High:** endpoint/output contract, TLS default, action/capture bounds,
  extraction metadata, session semantics, error classes, public prices and
  limits, Terms/AUP/DPA language.
- **Medium:** logical planner/control-plane/worker/telemetry architecture and the
  completeness of negative searches across changing documentation.
- **Low / unknown:** runtime cache behavior, private egress/SSRF controls, exact
  retention and regions, effective anti-ban choices, browser/model builds,
  account-specific legal exceptions, live quality, and target-specific costs.
