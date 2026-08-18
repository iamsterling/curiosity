# Zyte browser automation: standalone clean-room dossier

**Research and primary-source access date:** 2026-08-17  
**Subject:** the browser-automation surface of Zyte API, including generic and
special actions, account-deployed browser scripts, sessions, network capture,
rendered artifacts, and the browser-specific parts of unblocking and billing.  
**Boundary:** this is not a general Zyte API survey. Raw HTTP fetching,
automatic extraction, proxy mode, Search API, and Scrapy Cloud are included only
where they define a browser boundary. The broader API is separately assessed in
`zyte-api.md`.

**Method and access boundary:** public first-party documentation, rendered
OpenAPI reference, pricing, Terms, AUP, DPA, and Privacy Policy. No account,
credential, free or paid request, target interaction, IDE access, deployed
script, traffic interception, private interface, source/binary inspection,
security probe, or implementation was used. “Reverse-engineering” here means
reconstructing the public behavioral contract and a logical architecture. It
does not mean discovering Zyte's private code, anti-bot methods, fingerprints,
target playbooks, or infrastructure.

## Executive verdict

**ADAPT the bounded render/action contract; DEFER Zyte browser automation as a
provider; REJECT it as Curiosity's default fetch or agent browser (high
confidence).**

Zyte's product surface is materially narrower than a remotely attachable
Playwright, Puppeteer, Selenium, or CDP browser. One authenticated,
synchronous `POST /v1/extract` starts an opaque browser request for one seed URL,
runs an ordered static action list or an account-deployed TypeScript interaction,
then returns selected artifacts. There is no public browser-create endpoint,
WebSocket debugger, page/context handle, reconnect, or live browser lease.
Zyte's own migration guide positions the HTTP action model as a replacement for
browser-automation clients; non-linear logic moves into Zyte-hosted browser
scripts. [S1-S6]

This contraction of authority is the strongest lesson: make rendering and
interaction declarative, finite, output-driven, and ledgered. But the surface
still has broad effects. `goto`, click, type, JavaScript evaluation, special
actions, and browser scripts can navigate, submit forms, mutate cookies, and
issue subrequests. Script `Page.fetch()` accepts methods, bodies, and headers;
`Page.goto()` follows a caller-selected URL; page JavaScript, redirects, and
actions can send requests not expressible in the seed schema. The public
contract does not establish per-hop public-address enforcement, tenant/worker
isolation, browser profile deletion, browser build/version, subrequest quotas,
or replay-grade evidence. [S1-S6]

The material adoption blockers are:

1. **Network authority is under-specified.** The seed host cannot be an IP
   literal, but no reviewed browser contract defines DNS/private-address,
   metadata, redirect, iframe, WebSocket, worker, script `fetch`, or rebinding
   controls. [S1][S2]
2. **Isolation is opaque.** Sessions explicitly do not preserve a tab, process,
   machine, DOM, or JS heap, but public sources do not define whether workers,
   processes, filesystems, kernels, profiles, caches, or encryption keys are
   shared or how state is erased. [S3]
3. **Provider success is not workflow success.** Outer HTTP 200 can contain a
   non-200 origin response, failed/interrupted actions, and partial browser
   state. [S2][S9]
4. **Unblocking is effective but evidentially opaque.** Zyte may choose geo/IP
   type, cookies, retries, CAPTCHA handling, residential egress, and target-
   specific behavior without returning an attempt-level trace. [S3][S9]
5. **The legal/data boundary is consequential.** Public Terms permit product
   development and product training uses of broadly defined Service Data unless
   an applicable agreement changes that result; the AUP independently limits
   targets, screenshots, security testing, and reverse engineering. [S13-S16]

**Curiosity decision:** adopt the capability separation, ordered action ledger,
partial-result semantics, condition waits, and transport-session distinction.
Adapt every result into Curiosity-owned evidence and enforce egress, side-effect,
deadline, byte, retry, and spend policy independently. Reject direct model
access to generic interactions or scripts, automatic residential/CAPTCHA
escalation, infinite retry, and outer-200 success semantics. Defer all provider
use—especially scripts, authentication, personal data, and sensitive content—
until security and contractual gates are closed.

## 1. Decision frame, questions, and evidence labels

The decision is whether Zyte's hosted browser has a bounded role in Curiosity's
public-web retrieval tier and which externally visible patterns transfer without
copying proprietary implementation.

Bounded sub-questions:

1. What creates and ends a browser run, and what control is exposed?
2. What do generic actions, special actions, and scripts permit and return?
3. What state persists within and across calls, and what does “session” mean?
4. How are rendering, geo, proxies, retries, cookies, and challenge handling
   selected and evidenced?
5. What admission, concurrency, action, timeout, output, and price bounds apply?
6. What isolation, egress, SSRF, secret, and side-effect controls are documented?
7. Which artifacts support source provenance, audit, freshness, and replay?
8. Which privacy, access-rights, acceptable-use, and training terms matter?

Labels:

- **FACT** — directly supported by cited first-party material.
- **INFERENCE** — clean-room reasoning from the public behavior, not a claim
  about Zyte's private implementation.
- **RECOMMENDATION** — a Curiosity design, policy, or procurement choice.
- **UNKNOWN / NEGATIVE RESULT** — not established in reviewed public sources;
  absence in documentation is not proof of service absence.

Confidence is **high**, **medium**, or **low**. Performance, security, consent,
and compliance claims remain vendor claims unless independently evidenced. This
report is not legal advice.

## 2. Product boundary: task API, not browser as a service

| Surface | Public control | State/return boundary | Verdict |
|---|---|---|---|
| Browser request | Blocking HTTP request for one absolute seed URL | Selected DOM/screenshot/headers/cookies/captures after actions | **ADAPT** |
| Generic actions | Ordered JSON list | Fixed action vocabulary; per-action outcome | **ADOPT pattern** |
| Special actions | Target-specific named interaction | Availability discovered by a request; target knowledge hidden | **REJECT discovery model** |
| Browser scripts | TypeScript written/debugged/deployed in Zyte IDE, invoked as an `interaction` action | Non-linear account-hosted logic with a constrained page API | **DEFER** |
| Zyte session | Shared IP/network stack/cookie jar and related request conditions | No browser/tab/process/machine persistence | **ADOPT terminology** |
| Network capture | Filtered browser responses | At most ten responses and 5 MiB combined bodies | **ADAPT** |

**FACT (high):** the canonical browser operation is the same Basic-authenticated
`POST /v1/extract` used by other Zyte API capabilities. It accepts one absolute
URL, blocks until the result is ready, is intended for short-running operations,
requires at least one output, caps the URL at 8,192 characters, rejects an IP
literal as seed host, and caps the JSON request at 5 MiB. [S2]

**FACT (high):** Zyte documents HTTP as the automation API. Its migration guide
contrasts this with varying browser-tool protocols and maps Playwright,
Puppeteer, Selenium, Splash, and Scrapy integrations to browser HTML,
screenshots, and JSON actions. It says non-linear flows that cannot be expressed
as a static JSON array may require browser scripts. [S4]

**NEGATIVE RESULT (high):** no reviewed source exposes raw CDP, WebDriver,
Playwright protocol, a browser/page/context object to the API caller, browser
creation/list/kill endpoints, a debugger URL, live attachment, reconnect, or
browser-profile export/import.

**INFERENCE (high):** the externally observable resource is a **request-scoped
browser task**, not a caller-owned browser. Zyte retains browser/runtime and
unblocking control while exposing an output-oriented program. Physical browser
pooling is possible, but not part of the contract.

**RECOMMENDATION (high):** Curiosity should preserve this narrow shape. A core
contract should describe `render`, optional approved interactions, and evidence;
provider/browser protocols and account keys remain adapter-private.

## 3. Browser request and artifact contract

### 3.1 Seed request and secondary network authority

**FACT (high):** the initial browser request does not support a caller-selected
HTTP method, body, or arbitrary headers; only `Referer` is documented. This
restriction applies only to the initial request. Redirects, page JavaScript, and
actions may produce later requests without those method/body/header limitations,
and browser redirects always follow. [S1][S2]

**FACT (high):** browser requests always validate target TLS certificates; the
raw HTTP-only `verifyCertificate` switch is ignored in browser mode. [S2]

**INFERENCE (high):** validating the seed schema does not bound the browser's
effective network authority. The authorization unit includes redirects,
subresources, iframes, scripts, workers, action navigation, page `fetch`, and any
requests triggered by input events.

### 3.2 Rendered HTML

**FACT (high):** `browserHtml` is the serialized DOM after rendering and action
completion/interruption, not the origin response bytes. Iframe bodies are empty
unless `includeIframes` is true. Generic selectors cannot enter iframe or shadow
DOM; evaluate/scripts are the documented alternatives, and scripts can obtain an
iframe `Page`. [S1][S2][S5][S6]

**FACT (high):** JavaScript is normally enabled but Zyte may disable it for some
websites; the caller can select JavaScript behavior. Browser HTML is capped at
10 MB before response encoding and longer content is truncated. The reviewed
FAQ/reference does not provide a mandatory truncation indicator. [S1][S2][S12]

**INFERENCE (high):** DOM serialization is a derived artifact. It can differ
from origin bytes because of script execution, browser parsing, DOM mutation,
unblocking retries, actions, iframe policy, timing, and clipping. It cannot be
substituted for raw-source evidence.

### 3.3 Screenshots

**FACT (high):** screenshots are Base64-encoded JPEG or PNG. JPEG quality is 75
by default. Full-page screenshots are JPEG-only, have a minimum 1920x1080
presentation, and are clipped at 5000x10000 pixels. They are produced after
actions finish or time out. [S1][S2]

**FACT (high):** screenshot use adds $0.002 before discount. The AUP separately
prohibits using screenshots to collect personal data, copyrighted material, or
illegal content. [S10][S14]

**RECOMMENDATION (high):** screenshots need an artifact-specific rights and
retention decision. Record format, viewport, full-page setting, pixel dimensions,
clipping, hash, byte count, action-state reference, and observation time. A
screenshot is not proof that hidden/offscreen or inaccessible content existed in
the DOM.

### 3.4 Headers, cookies, final URL, and status

**FACT (high):** browser results can include final URL, origin status,
selected response headers, and structured response cookies. Zyte may set cookies
when none are supplied to reduce bans; `cookieManagement: discard` prevents
automatic cookie addition while preserving explicit request cookies. [S2][S3]

**NEGATIVE RESULT (high):** the reviewed browser response does not guarantee the
full redirect chain, resolved addresses, request/response chronology for every
resource, effective outbound headers, browser/runtime version, retry sequence,
cache disposition, or raw navigation response body.

## 4. Action program and side effects

### 4.1 Generic and special action vocabulary

**FACT (high):** the public schema/documentation covers click, double-click,
evaluate, goto, hide, hover, deployed interaction, key press, reload, scroll,
search, select, location setting, type, and waits for navigation, request,
response, selector, or timeout. Element targeting supports CSS and XPath 1.0.
Selector strings are bounded, and action-specific timeouts/inputs are schema-
bounded. [S1][S2]

**FACT (high):** generic actions are intended to work across websites. Special
actions encode target-specific knowledge (for example search or form/location
flows) and exist only for selected websites. The documentation tells callers to
discover availability by sending a test request and reading an unsupported-action
error. [S1]

**RECOMMENDATION (high):** Curiosity should not pay to discover capabilities at
runtime. Maintain an adapter capability/version registry, prevalidate an approved
action subset, and treat target-specific interactions as policy-reviewed code,
not a generally callable capability.

### 4.2 Ordering, errors, and partial completion

**FACT (high):** actions execute sequentially before requested artifacts or
extraction are produced. Action `onError` defaults to `return`, which stops the
sequence; `continue` permits later actions. Requested output is returned from
the state reached even after an action error or timeout. [S2][S9]

**FACT (high):** there is no documented action-count limit, but total browser
execution time is capped at 60 seconds. At the cap, the current action is
interrupted, subsequent actions are skipped, and output reflects the partial
state. The response action ledger reports status, error, and elapsed time for
actions. [S1][S2]

**FACT (high):** an outer HTTP 200 is still considered successful when some
browser actions fail or an action-triggered page produces a bad response.
Callers must inspect the action ledger and origin state. [S9]

**RECOMMENDATION (high):** map results into distinct states:

```text
provider_transport: accepted | rejected | timed_out
origin_observation: status | unavailable | unknown
action_program: complete | partial | failed | not_run
artifact: complete | truncated | absent | unknown
policy: allowed | stopped | violation | unknown
semantic_usefulness: accepted | rejected | unevaluated
```

Never infer `complete` from HTTP 200. Curiosity should additionally cap action
count, navigation count, request count, bytes, decompressed bytes, side effects,
and total deadline.

### 4.3 Wait semantics

**FACT (high):** Zyte supports event/condition waits (`waitForSelector`, request,
response, and navigation) plus fixed timeout. Documentation recommends condition
waits and warns that sleeps consume the finite action budget. Browser-script
navigation/selector waits default to 30 seconds; `networkidle0` means no ongoing
network connections for at least 0.5 seconds. Script `GotoOptions.timeout = 0`
disables that inner navigation timeout. [S1][S6]

**INFERENCE (high):** inner disabled or long waits remain bounded by the outer
browser execution cap in ordinary API use, but this composition is not a reason
to expose zero-timeout controls. Different clocks—client HTTP, API operation,
browser total, action, navigation, condition, retry, and rate-limit backoff—must
remain explicit.

### 4.4 Side-effect classification

| Action class | Observable risk | Curiosity default |
|---|---|---|
| DOM read/hide/screenshot | content exposure and misleading derived state | Allow only in render lane |
| Scroll/hover | triggers lazy loads, tracking, and network traffic | Bounded/allowlisted |
| Click/key/type/select | submissions, purchases, votes, consent, account mutation | Deny |
| `goto`/reload/search/location | navigation and target expansion | Deny unless predeclared |
| `evaluate` | arbitrary page-context script and network/data access | Deny |
| special/deployed interaction | opaque or account-hosted target logic | Deny/defer |

**RECOMMENDATION (high):** “read-only browser” cannot be inferred from HTTP GET.
Interaction authorization must be semantic and side-effect-aware. Curiosity's
retrieval agent should never receive generic `type`, click, evaluate, script ID,
or arbitrary action construction authority.

## 5. Browser scripts and IDE surface

### 5.1 Deployment lifecycle

**FACT (high):** Zyte IDE stores editable TypeScript under cloud-hosted `src/`;
multiple developers can edit and see changes in real time. Deployment empties
`dist/`, builds `src/`, and deploys the resulting interactions to Zyte API. A
deployed script is invoked through an action containing `action: interaction`,
an interaction ID, and optional JSON arguments. Custom deployment is disabled by
default and requires KYC outside a free trial; Enterprise customers are described
as already KYC-complete. [S5]

**SECURITY INFERENCE (high):** script source, build output, interaction IDs, and
arguments become a separate account-level software supply chain. Shared editing,
whole-folder deployment, and runtime invocation require change review, tenant
ownership, audit, rollback, secret scanning, and least privilege. KYC establishes
customer identity/compliance review, not script safety or target authorization.

### 5.2 Scripting authority

**FACT (high):** the scripting API offers non-linear TypeScript control over a
constrained `Page`: click/type/select/hover, DOM queries, cookies, iframe access,
arbitrary page-context JavaScript evaluation, navigation/reload, waits, scrolling,
and `Page.fetch()`. Fetch accepts method, body, headers, cache, mode, redirect,
and referrer options and is limited by the browser context, including CORS.
Returned data can be read as bytes, text, or JSON. [S6]

**FACT (high):** `Page.goto()` accepts a URL and permits timeout zero; cookie APIs
can enumerate, set, and delete cookies; script arguments are caller-supplied
objects. [S5][S6]

**INFERENCE (high):** browser scripts are substantially more powerful than
static generic actions. CORS is a browser policy, not an SSRF defense; navigation,
no-CORS requests, redirects, same-origin access, cookies, and target-controlled
code still create broad network and data authority.

### 5.3 Version and reproducibility

**FACT (high):** Zyte says every new `smartbrowser-core-interactions` version is
backward-compatible and automatically made available to IDE instances and
already deployed code. The page says a system for introducing incompatible
versions may be implemented in the future. [S6]

**INFERENCE (high):** automatic compatible upgrades still change execution
without an explicit per-run dependency pin. “Backward-compatible” does not mean
bitwise deterministic or behaviorally identical for evidence reproduction.

**NEGATIVE RESULT (high):** reviewed public sources do not establish script
source/build retention, immutable deployment digest, per-call script digest,
rollback history, code-review enforcement, package/import allowlist beyond the
documented module, secret management, sandbox/CPU/memory limits, stdout/log
retention, tenant RBAC, or audit events.

**RECOMMENDATION (high):** do not adopt scripts for Curiosity's initial lane. If
later authorized, require immutable reviewed bundles, no secrets, domain and
network manifests, deterministic version pins, single-purpose IDs, argument
schemas, deployment attestations, rollback, and per-run bundle digests.

## 6. Sessions, cookies, and isolation

### 6.1 What “session” means

**FACT (high):** a Zyte session shares request conditions including IP address,
network stack, cookie jar, and related target-facing state. It explicitly does
**not** retain the same browser tab, window, process, machine, DOM, or JavaScript
heap across browser requests. Browser persistence is described as planned, not
current. [S3]

**FACT (high):** client-managed sessions use caller UUIDv4 IDs. They may expire
15 minutes after creation, two minutes after last use, or after three consecutive
bans; expired IDs are tombstoned for 5–10 minutes. Server-managed sessions use up
to ten context key/value pairs and may expire after four hours or three bans.
[S2][S3]

**INFERENCE (high):** `session` is a **transport/target identity**, not a browser
lease. It can link jobs through cookies and egress while providing no durable DOM
or process state. Its identifier and jar are secret-bearing provider state.

### 6.2 Isolation negative results

No reviewed public browser source establishes:

- one process, OS user, container, VM, kernel, filesystem, or network namespace
  per request, account, or customer;
- whether different calls/customers can share a browser process or worker host;
- browser sandbox flags, host hardening, patch SLA, extension policy, or browser
  engine/build/update notice;
- fresh profile creation, cache/service-worker/storage partitioning, profile
  encryption, crash cleanup, deletion SLA, backup purge, or forensic remanence;
- CPU, memory, process, page, context, disk, download, request, decompression, or
  subresource quotas per browser task;
- script/IDE runtime isolation from other scripts, accounts, build workers, or
  cloud storage tenants.

**INFERENCE (high):** the no-persistence statement constrains externally visible
state, not physical isolation. It must not be promoted into a fresh-process or
secure-erasure guarantee.

**RECOMMENDATION (high):** use a fresh logical session for each independent job,
`cookieManagement: discard`, no supplied cookies, no cross-job session IDs, and
no authenticated targets. Require a product-specific isolation/threat model and
deletion controls before sending sensitive content.

## 7. Rendering, geo, and managed unblocking

**FACT (high, vendor-described):** Zyte automatically aims to return ban-free
browser-like data and may manage browser-like headers/order, cookies, retries,
CAPTCHAs, network stack, IP choice, residential IPs, and target-specific logic.
It chooses geo and datacenter/residential IP type unless the caller overrides
them. Explicit residential selection requires KYC and changes cost. [S2][S3][S9]

**FACT (high):** CAPTCHA management and device-residential capability are
account permissions documented as enabled by default and can be disabled.
Disabling residential also removes extended geolocations and may lower success.
Zyte does not automatically log in and cannot automatically retrieve content
that is always behind login. Domains can be blocked with 451. [S3][S9]

**FACT (medium, vendor claim):** residential addresses are described as end-user
device addresses provided with explicit user consent for bandwidth sharing.
[S3]

**NEGATIVE RESULT (high):** an ordinary browser response does not clearly report
the effective IP class/geo, exit ASN/address, browser fingerprint/profile,
header overrides, CAPTCHA attempts/outcomes, residential peer class, retry
count, intermediate target responses, cookie changes attributable to unblocking,
or target-specific technique/version.

**INFERENCE (high):** a final DOM may result from several undisclosed attempts
and identities. It is an observation produced by an adaptive retrieval system,
not one replayable browser exchange.

**RECOMMENDATION (high):** request datacenter-only, no CAPTCHA, cookie discard,
and explicit geo. If the provider cannot guarantee those controls and return
effective settings, reject the request rather than silently escalate. Residential
or challenge solving requires a separate lawful-purpose, peer sourcing,
publisher-signal, geography, and budget decision.

## 8. Network capture, SSRF, and security

### 8.1 Capture contract

**FACT (high):** up to ten ordered network-capture filter sequences can select
browser responses by case-sensitive URL/resource criteria during rendering and
actions. Regex/wildcards are not supported. At most ten responses are returned;
combined captured bodies are capped at 5 MiB, with earlier matches winning when
the body budget is exhausted. [S1][S2]

**INFERENCE (high):** absence from capture does not prove absence from the
network. A response may miss filters, fall after count/byte exhaustion, be a
request without captured response, or belong to an unsupported channel.

### 8.2 Publicly established controls

**FACT (high):** the top-level schema requires a domain-name host and rejects an
IP literal. Browser TLS validation is always on. Zyte may forbid a domain, and
the browser seed cannot specify arbitrary initial method/body/headers. [S1][S2]

These are useful controls but do not establish a complete egress boundary.

### 8.3 Material network-security unknowns

No reviewed public source defines blocking/revalidation for:

- loopback, RFC1918/private, link-local, carrier-grade NAT, multicast, reserved,
  IPv6 local, cloud metadata, service-network, or internal DNS destinations;
- domain names resolving/rebinding to blocked addresses, alternate numeric
  forms, DNS pinning, or address re-resolution;
- every redirect/navigation made by the seed, click, special action, script
  `goto`, page/script `fetch`, iframe, popup, worker, service worker, WebSocket,
  WebRTC, or target JavaScript;
- non-HTTP schemes, unsafe ports, downloads, uploads, local-file access, browser
  extension/native interfaces, or proxy fail-open behavior;
- per-request egress allowlists, domain ownership checks, or network-policy event
  output.

**SECURITY INFERENCE (high):** the “no IP literal” seed rule is a partial input
validation rule, not an SSRF guarantee. `goto`, redirects, DNS, and script
`fetch` can expand authority unless separately constrained. Network capture is
observation, not prevention.

**RECOMMENDATION (high):** Curiosity must authorize URLs before provider
dispatch and require provider-side enforcement at DNS/connect time for every
browser channel. Deny private/reserved/metadata/service ranges, unsafe schemes
and ports; reauthorize redirects and navigation; cap network requests and bytes;
and treat HTML, script results, screenshots, headers, cookies, and capture bodies
as untrusted external data. Because an external service cannot rely on
Curiosity's local egress firewall, written provider guarantees are a blocker.

## 9. Concurrency, timeouts, failures, and cost

### 9.1 Published bounds

| Dimension | Public browser contract | Confidence |
|---|---:|---|
| API request body | 5 MiB | High [S2] |
| Seed URL | 8,192 chars; host must be domain, not IP literal | High [S2] |
| Browser HTML | 10 MB pre-encoding; longer output truncated | High [S12] |
| Browser action execution | 60 seconds total; partial output afterward | High [S1] |
| Action count | No documented fixed count | High negative [S1] |
| Capture filters/results/bodies | 10 / 10 / 5 MiB combined | High [S1][S2] |
| Standard account rate | 3,000 RPM | High [S7][S10] |
| Enterprise rate | pricing says 10,000 RPM; rate page says custom | Medium contradiction [S7][S10] |
| Concurrency | Derived from RPM and response duration, not a fixed public count | High [S7] |

**FACT (high):** Zyte estimates concurrency as `RPM / 60 * average response
seconds`; its examples imply 1,000 concurrent requests at 3,000 RPM and 20-second
latency. Additional website, account-website, and temporary platform limits
apply. A 429 or 503 rate/capacity response is uncharged. [S7][S9]

**NEGATIVE RESULT (high):** no public browser-worker concurrency limit, queue
size/position, admission deadline, fairness, priority, region, cancellation
endpoint, browser-worker reservation, or capacity SLO was found. RPM does not
guarantee immediate browser admission or permit that load against one origin.

### 9.2 Failure and retry semantics

**FACT (high):** typed failures include account/domain/account-domain limits,
global/extractor overload, temporary ban/download errors, permanent/internal
download errors, server timeout/internal error, malformed/incompatible request,
unreachable/forbidden domain, authentication, and suspension. Unsuccessful and
rate-limited responses are not charged. [S9][S10]

**FACT (high):** Zyte recommends randomized exponential backoff, forever retry
for rate limiting, and bounded retry for other failures. It notes that some
intermittent 521 errors may be misclassified bans and can be locally treated as
retryable for an affected target. [S9]

**RECOMMENDATION (high):** reject infinite in-worker retry and unreviewed target
reclassification. Use scheduler-level attempts with admission, wall-clock,
origin, byte, side-effect, and dollar deadlines. Return `deferred` when exhausted.

### 9.3 Browser price surface observed 2026-08-17

**FACT (high, time-sensitive):** target plus HTTP/browser request type selects
one of five automatically assigned tiers. New combinations receive a temporary
tier; tiers are reviewed quarterly with two weeks' notice. Exact tier cost and
distribution are delegated to dynamic pricing/estimator pages. Only responses
Zyte classifies as successful are charged. [S10]

**FACT (high):** actions add CPU/network-based cost; captures add output-size
cost; screenshots add $0.002 before discount. Residential/extended geo adds
traffic-sensitive cost. Standard PAYG displays $5 initial first-month credit,
3,000 RPM, and a $100/month plan limit. Commitment plans combine $100–$500
monthly commitments, $200–$2,500 limits, and 25%–52% discounts. Plans may allow
overage unless an organization/API-key blocking spending limit is configured;
domain alerts are informational only. [S10]

**UNKNOWN:** no universal browser cost/1,000 calls exists. Target tier, action
CPU/network, capture size, screenshot, residential traffic, retry behavior,
discount, and billed outer-200-but-useless results vary. Per-response actual cost
is not clearly part of the browser result.

**RECOMMENDATION (high):** preflight worst-case spend and enforce local job,
tenant, domain, and provider hard limits. Store provider billed cost separately
from target bytes, artifact bytes, and useful-result status.

## 10. Output provenance, freshness, and replay

### 10.1 What can be retained

**FACT (high):** ordinary responses can expose final URL, origin status, selected
headers/cookies, browser HTML, screenshot, action records, capture records, and
caller `echoData`/tags. Stats aggregates count, status, billed traffic, latency,
features, time, tags, and domain health; it is not item-level evidence. [S2][S3][S11]

### 10.2 Negative results

No reviewed browser contract guarantees:

- a fetch/origin-observation timestamp for the rendered artifact;
- ordinary-response cache control, live-fetch guarantee, cache key/disposition,
  validator behavior, force refresh, or stale-if-error policy;
- full redirect, DNS, request, response, retry, peer, challenge, or cookie trace;
- browser engine/build, OS/device/fingerprint, render-policy version, script
  deployment digest, special-action version, or effective unblocking settings;
- DOM/screenshot/capture hashes, byte counts, explicit HTML truncation, visual
  clipping flag, screenshot creation timestamp, or per-field source regions;
- HAR, WARC, trace, video, DOM replay, deterministic rerun, immutable manifest,
  or provider-signed evidence;
- per-item policy/robots decision or item-level billed cost.

**INFERENCE (high):** the action ledger is useful execution provenance but not
source provenance. Stats is operational/billing telemetry. Neither reconstructs
what the origin sent or how adaptive unblocking reached the final DOM.

**RECOMMENDATION (high):** Curiosity must create an evidence envelope:

```text
job_id, tenant_id, provider_request_ref?
requested_url, authorized_url_scope, final_url, redirect_chain?
requested_at, admitted_at?, origin_observed_at?, completed_at
provider_transport, origin_status, action_status, policy_status, semantic_status
requested/effective render, JS, cookie, geo, IP, CAPTCHA and retry policy
session_scope, action/script digest, browser/provider/adapter versions?
request/navigation/resource counts?, target/provider/artifact bytes?
DOM_ref/hash/size/truncation, screenshot_ref/hash/size/clipping
capture[]: URL/status/headers/body_ref/hash/size/truncation/causal_action
action[]: type/status/error/elapsed/side_effect_class
robots/rights/purpose decision, warnings, retry lineage, estimated/actual cost
```

Question marks must remain `unknown`, never guessed. Cache keys must include URL,
representation-affecting headers/cookies, geo/IP/device, JS/render/action/script
digests, and transport-session scope.

## 11. Privacy, security assurances, and legal boundary

### 11.1 Public security and data-processing claims

**FACT (medium-high, contractual/vendor claim):** the public DPA describes
Article 32-oriented technical and organizational measures, confidentiality,
least privilege, centralized event logging, daily vulnerability scans, incident
management, TLS 1.2 in transit, cloud providers certified to ISO 27001, and a
risk program aligned to ISO 27001. It provides subprocessors under written
obligations, restricted-transfer mechanisms, and Security Event notice without
undue delay and within 72 hours. [S15]

**UNKNOWN:** public sources reviewed did not establish browser request/DOM/
screenshot/capture/cookie/profile/script/IDE/log retention, cache isolation,
backup deletion, processing regions, current full subprocessors, support access,
key/RBAC controls by plan, or a current independent report mapped specifically
to browser workers and IDE/script storage.

### 11.2 Service Data, personal data, and training

**FACT (high):** Terms define Service Data broadly, expressly including
screenshots, and permit Zyte to use Service Data, Data Feeds, code, content, and
other service data for product development and product training unless the
applicable agreement changes the position. For Service Personal Data the DPA
places the customer as controller and Zyte as processor; customers warrant
lawful instructions, notices/consent, and compliant collection/use. [S13][S15]

**FACT (high):** the Privacy Policy uses purpose-based retention. Support tickets
are typically deleted after four years, billing details after seven years, and
service-usage logs are retained as needed for service security/integrity; it
does not state one fixed public retention period for fetched browser artifacts
or IDE code. International processing/transfers may occur. [S16]

**RECOMMENDATION (high):** require an order-form override for no independent use
or model training, exact content/code/log/cache/profile retention, deletion and
backup-purge SLA, approved regions/subprocessors, support access, incident terms,
and artifact rights. Until then, do not send confidential, unpublished,
credentialed, personal, or regulated content or browser scripts containing
proprietary logic.

### 11.3 Access rights and acceptable use

**FACT (high):** Terms limit the services to scraping publicly accessible
websites, allocate legality/ethical-use responsibility to the customer, permit
target activity to be stopped after cease requests or legal/operational/business
risk, and do not grant copyright permission or warrant non-infringement of
Service Data. [S13]

**FACT (high):** the AUP prohibits unlawful/fraudulent collection, privacy or
rights violations, access where the customer accepted terms prohibiting that
manner of access/use, LinkedIn scraping, unauthorized access, security testing,
specified harmful uses, and material interference. It restricts screenshots as
noted above and prohibits using services/data to support EU AI Act prohibited or
high-risk systems, with recruitment/employment among examples. [S14]

**FACT (high):** the AUP prohibits deciphering, decompiling, reverse engineering,
or discovering service/software source. Terms say automated use by an AI agent
or scripted process constitutes acceptance by the person/entity developing,
deploying, or operating it. [S13][S14]

**NEGATIVE RESULT (high):** no reviewed browser contract says Zyte enforces
`robots.txt`, crawl delay, target terms, copyright/database rights, purpose
limitation, or Curiosity's no-side-effect policy.

**RECOMMENDATION (high):** authorize before dispatch: public-access status,
robots snapshot/rule, target terms/rights, data category, purpose, politeness,
interaction side effects, artifact rights, complaint/cease handling, geography,
and spend. KYC, provider success, or technical reachability is not target
permission.

## 12. Clean-room logical architecture

The following is **INFERENCE**, not disclosure of Zyte's private implementation:

```text
BrowserTask request (URL + outputs + actions/script + session/policy hints)
  -> Basic auth, account/KYC/permission, schema and capability validation
  -> target/rate/cost/unblocking plan
  -> request-scoped logical browser worker
       | initial navigation + browser TLS
       | adaptive IP/geo/header/cookie/retry/CAPTCHA control
       | ordered generic/special/script action runner
       | script sandbox/API bridge (when invoked)
       | network capture collector
  -> DOM / screenshot / headers / cookies / captures / action ledger
  -> response assembly (including partial browser state)
  -> separate aggregate stats, billing, domain-health and IDE/deployment planes
```

### A. Capability/cost planner — **medium-high confidence**

One endpoint validates incompatible output combinations; browser and HTTP have
different target tiers; selected features add cost; automatic choices depend on
target. A logical planner is sufficient to explain the contract. [S2][S10]

### B. Request-scoped logical worker — **high confidence logically**

The browser action budget is request-bounded and sessions explicitly do not
preserve process/tab/machine. Physical pools, process reuse, and worker-to-host
ratio remain unknown. [S1][S3]

### C. Target-adaptive unblocking plane — **medium-high confidence**

Automatic geo/IP/cookies/retries/CAPTCHA behavior, domain rate/health concepts,
and target tiers imply target-aware control. Algorithms, signals, fingerprints,
models, and retry policy are intentionally not inferred. [S3][S7][S9-S11]

### D. Interaction runtime and deployment plane — **high confidence logically**

IDE `src`/`dist`, build/deploy, interaction IDs, automatic API module upgrades,
and runtime invocation require a deployment store and an action/runtime bridge.
Its infrastructure, sandbox, compiler, storage, and tenancy are unknown. [S5][S6]

### E. Separate telemetry/billing plane — **medium-high confidence**

Tags/echo, separate Stats API credentials/host, aggregates, and domain-health
recalculation are operationally distinct from item response evidence. [S2][S11]

## 13. Curiosity verdict ledger

### ADOPTED

1. **Explicit browser escalation:** static fetch and browser render/interact are
   different capabilities; never silently upgrade.
2. **Output-oriented task boundary:** one bounded resource operation returns
   selected artifacts rather than granting a live general browser.
3. **Ordered action ledger:** retain type, status, elapsed time, error, and the
   distinction between complete and partial execution.
4. **Condition waits:** selector/request/response/navigation events beat sleeps.
5. **Transport session terminology:** network/cookie affinity is not browser
   persistence.
6. **Capture budgets:** count and byte limits are explicit; capture absence is
   not treated as network absence.
7. **Typed provider/origin/action/policy/semantic status:** one outer status is
   insufficient.

### ADAPTED

1. Add hard action, navigation, request, redirect, response, decompression,
   CPU/memory/disk, wall-time, and dollar bounds.
2. Replace generic action/script authority with a small reviewed interaction
   vocabulary and semantic side-effect classes.
3. Add immutable content hashes, sizes, clipping/truncation, complete timestamps,
   causal capture/action links, and retry/provider-policy lineage.
4. Require explicit datacenter, geo, cookie-discard, no-CAPTCHA, no-login,
   no-download, no-secret, and no-persistent-session policy.
5. Keep provider action names, script IDs, sessions, price tiers, Stats fields,
   and credentials inside the Zyte adapter.
6. Use local item-level metering and budgets; provider aggregate Stats is only a
   reconciliation source.

### REJECTED

1. Direct raw action arrays or browser scripts generated/invoked by autonomous
   models.
2. Browser rendering for every URL or as a search/index/provenance foundation.
3. `goto`, evaluate, type, click, search, forms, location mutation, or special
   actions in the ordinary public-read lane.
4. Automatic residential, CAPTCHA, cookie, geo, or retry escalation.
5. Infinite rate-limit retries inside a worker.
6. Outer HTTP 200 as complete/useful retrieval.
7. Provider session as durable browser state or isolation evidence.
8. Seed host validation as SSRF protection.
9. Final DOM/screenshot or aggregate Stats as replay-grade source evidence.

### DEFERRED

1. A Zyte browser adapter until written isolation, egress, retention, legal, and
   cost contracts plus an authorized owned-fixture test plan exist.
2. Browser scripts/IDE pending a separate software supply-chain, sandbox,
   versioning, tenancy, audit, and deletion review.
3. Sensitive, personal, confidential, unpublished, credentialed, or regulated
   content pending no-training/no-independent-use and DPA/security gates.
4. Residential routing and challenge handling pending target-specific legal,
   ethical, peer-consent, geography, and purpose review.
5. Any authenticated workflow, login, state-changing interaction, or supplied
   cookie pending a dedicated product use case and threat model.

## 14. Minimum provider-neutral browser task contract

```text
BrowserTaskRequest {
  job_id, tenant_id, url,
  capability: render | approved_interaction,
  approved_action_program_id?,
  admission_deadline_ms, wall_deadline_ms, navigation_deadline_ms,
  max_actions, max_navigations, max_redirects, max_requests,
  max_response_bytes, max_total_bytes, max_decompressed_bytes,
  egress_policy_id, target_policy_id,
  geo?, ip_class: datacenter, cookie_policy: discard,
  captcha_policy: deny, credential_policy: none,
  download_policy: deny, side_effect_policy: deny,
  retention_class: metadata_and_authorized_artifacts
}

BrowserTaskEvidence {
  job_id, provider_ref?, requested_url, final_url, redirect_chain?,
  requested_at, admitted_at?, observed_at?, completed_at,
  provider_status, origin_status?, action_status, policy_status,
  terminal_reason, browser_version?, adapter_version,
  requested_policy, effective_policy?, session_scope,
  action_program_digest, actions[], policy_events[],
  request_count?, navigation_count?, retry_summary?, captcha_events?,
  target_bytes?, provider_bytes?, artifact_bytes,
  dom_ref?, dom_hash?, dom_truncated,
  screenshot_ref?, screenshot_hash?, screenshot_clipped,
  captures[], cost_estimate, actual_cost?, warnings[]
}
```

Missing provider fields remain unknown. Static HTTP should remain the first
choice; browser escalation must be justified by an evidence requirement that
static retrieval did not meet.

## 15. Unknowns and required checks before reliance

| Unknown / risk | Confidence now | Required check |
|---|---:|---|
| Worker/process/container/VM/kernel isolation | Low | Browser-specific architecture and threat model; independent control evidence |
| Fresh profile and cross-tenant cache/storage isolation | Low | Written contract plus authorized isolated fixture |
| Profile/cookie/cache/script/IDE/log retention and deletion | Low | DPA annex/order form, backup-purge SLA, admin deletion evidence |
| Private/reserved/metadata/service network blocking | Low | Exact ranges and enforcement at DNS/connect for every browser channel |
| Redirect/subresource/WebSocket/worker/script-fetch reauthorization | Low | Egress design statement and controlled owned-fixture security plan |
| DNS rebinding/pinning and proxy fail-closed behavior | Low | Security architecture and separately authorized isolated test |
| Browser engine/build/update/patch policy | Low | Version response field and compatibility/security change SLA |
| Per-task CPU/memory/process/disk/request/decompression quotas | Low | Capacity/isolation contract |
| Queue/admission/cancellation/fairness/capacity SLO | Low | Written operations contract and no-cost capacity checks if authorized |
| Effective IP/geo/ASN, retries, CAPTCHA, headers, cookies | Low | Item-level response/telemetry schema or vendor commitment |
| Full redirect/network trace and authoritative observation time | Low | Evidence contract; Curiosity capture on owned fixture |
| DOM truncation and screenshot clipping indicators | Low | Schema confirmation and authorized oversized fixture |
| Ordinary fetch cache/live guarantee and cache isolation | Low | Written cache contract and owned-fixture validation |
| Script sandbox, imports, network manifest, resources, logs | Low | IDE/runtime security design and penetration-test scope |
| Script source/build history, immutable digest, rollback/audit | Low | Deployment/control-plane contract |
| IDE RBAC, collaborative edit tenancy, support access | Low | Account security and audit-control review |
| Public Terms training exception for proposed account | High that public Terms permit; low on exception | Signed no-training/no-independent-use override |
| Current subprocessors, regions, audit reports | Low | Procurement/Trust Center package |
| Enterprise 10k RPM vs custom wording | Medium | Order form/SLA |
| Exact browser tier/action/capture cost | Low/time-sensitive | Current estimator and negotiated schedule at decision time |

## 16. Clean-room transfer rules

1. Transfer behavioral requirements and test criteria, not Zyte field names,
   target-specific special actions, scripts, anti-bot methods, fingerprints,
   prompts, or private playbooks.
2. Author provider-neutral contracts independently. Place Zyte request fields,
   action names, session IDs, price tiers, and errors in an adapter specification.
3. Do not inspect service binaries, private endpoints, deployed vendor scripts,
   proprietary source, or runtime internals; the AUP prohibits reverse
   engineering/discovery of source. [S14]
4. Do not probe private addresses, metadata endpoints, redirects, DNS rebinding,
   CAPTCHA systems, residential peers, restricted targets, or other customers'
   state without a separately reviewed isolated security-test authority.
5. Do not copy browser scripts or special-action implementations. Independently
   specify minimal behavior from Curiosity requirements.
6. Treat official clients as optional dependencies requiring their own license,
   provenance, version, and supply-chain review; no SDK/source was adopted here.
7. Re-check OpenAPI, action/script API, prices, Terms, AUP, DPA, Privacy Policy,
   and security materials immediately before procurement.

## 17. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for **relevance (R)**,
**decision value (V)**, **novelty (N)**, and **cost (C; lower is better)**.
Only public, first-party, no-account checks were eligible. The pass stopped at
**coverage plus saturation**.

| Thread | R/V/N/C | Decision and result |
|---|---:|---|
| Is this remote browser control or a task API? | 5/5/4/1 | **Pursued.** Migration/reference establish synchronous HTTP outputs/actions; no CDP/WebDriver/live lease found. [S2][S4] |
| Transport session vs browser persistence | 5/5/5/1 | **Pursued.** Explicitly no tab/process/machine persistence; expiry/tombstone semantics retained. [S3] |
| Script authority and versioning | 5/5/5/2 | **Pursued.** Found `goto`, page `fetch`, evaluate, cookies, iframe access, cloud deployment, and automatic backward-compatible module updates. [S5][S6] |
| Browser SSRF/egress contract | 5/5/5/2 | **Pursued to saturation.** Seed IP literals are barred, but no all-channel DNS/connect/private-network contract found; retained as blocker. [S1][S2][S6] |
| Action partial-state semantics | 5/5/4/1 | **Pursued.** 60-second interruption, follow-up omission, ledger, and outer-200 behavior confirmed. [S1][S2][S9] |
| Capture as network evidence | 5/4/4/1 | **Pursued.** Count/body/filter limits show capture is selective, not a complete trace. [S1][S2] |
| IDE tenancy and code retention | 4/5/4/2 | **Pursued to public limit.** Collaborative cloud `src` and destructive `dist` deployment documented; RBAC/audit/retention remain unknown. [S5] |
| Training/screenshot restrictions | 5/5/4/1 | **Pursued.** Terms and AUP materially constrain procurement and artifacts. [S13-S16] |
| Live action/CAPTCHA/residential tests | 3/3/3/5 | **CURIOSITY_NO_GO:** credentials/tests prohibited; could interact with third parties and would not establish durable guarantees. |
| SSRF, metadata, DNS-rebinding, or cross-tenant probes | 5/5/4/5 | **CURIOSITY_NO_GO:** no isolated fixture or written security-test authority; unsafe and AUP-sensitive. |
| Obtain/inspect deployed script runtime or private IDE interfaces | 2/3/5/5 | **CURIOSITY_NO_GO:** account/private access prohibited and unnecessary for public-contract analysis. |
| Infer CAPTCHA, fingerprint, proxy, or target-specific algorithms | 1/1/4/5 | **CURIOSITY_NO_GO:** proprietary, bypass-adjacent, contractually restricted, and irrelevant to the bounded decision. |
| Paid load/success/cost benchmark | 3/4/3/5 | **CURIOSITY_NO_GO:** no credentials, budget, licensed fixture corpus, or SLO frame. |
| Account-only assurance/Trust Center evidence | 4/4/2/5 | **CURIOSITY_NO_GO:** unavailable under no-account authority; mandatory procurement check. |
| Jurisdiction-specific scraping legality | 5/5/3/5 | **CURIOSITY_NO_GO:** counsel task requiring target, corpus, purpose, artifact, and jurisdiction facts. |
| Competitor bake-off | 1/2/2/5 | **CURIOSITY_NO_GO:** caller requested one standalone surface and no comparative workload was declared. |

**Stop reason:** every requested category has primary evidence or a specific
negative result. Further material resolution requires a vendor answer/order
form, confidential assurance access, counsel, credentials/paid calls, or an
authorized isolated fixture. No autonomous follow-up is authorized.

## 18. Primary sources

All sources are first-party Zyte materials accessed **2026-08-17**.

- **[S1]** Zyte API browser automation — browser HTML, screenshots, actions,
  waits, action cap, capture, redirects, headers, JavaScript:
  <https://docs.zyte.com/zyte-api/usage/browser.html>
- **[S2]** Zyte API rendered OpenAPI reference — endpoint, schemas, constraints,
  outputs, actions/capture, status and compatibility:
  <https://docs.zyte.com/zyte-api/usage/reference.html>
- **[S3]** Zyte API shared features — geo, IP class, cookies, permissions,
  transport sessions and expiry:
  <https://docs.zyte.com/zyte-api/usage/features.html>
- **[S4]** Migrating from browser automation to Zyte API — product/protocol
  boundary and static-actions-versus-scripts statement:
  <https://docs.zyte.com/zyte-api/migration/browser-automation/index.html>
- **[S5]** Zyte IDE — cloud source/deployment, collaboration, debugging, KYC,
  interaction invocation:
  <https://docs.zyte.com/zyte-api/ide/index.html>
- **[S6]** Zyte browser scripting API — Page/evaluate/fetch/goto/cookies/iframes,
  waits, options, and versioning:
  <https://docs.zyte.com/zyte-api/ide/api/index.html>
- **[S7]** Zyte API rate limits and concurrency:
  <https://docs.zyte.com/zyte-api/usage/rate-limit.html>
- **[S8]** Optimizing Zyte API usage:
  <https://docs.zyte.com/zyte-api/usage/optimize.html>
- **[S9]** Zyte API error handling — outer success, action errors, ban handling,
  retry guidance, typed failures:
  <https://docs.zyte.com/zyte-api/usage/errors.html>
- **[S10]** Zyte API pricing — plans, browser tiers, feature costs, spending
  alerts/limits and discounts:
  <https://docs.zyte.com/zyte-api/pricing.html>
- **[S11]** Zyte API Stats API — aggregated dimensions and domain health:
  <https://docs.zyte.com/zyte-api/usage/stats/index.html>
- **[S12]** Zyte API FAQ — browser/raw output size and truncation:
  <https://docs.zyte.com/zyte-api/faq.html>
- **[S13]** Zyte Terms of Service:
  <https://www.zyte.com/terms-policies/terms-of-service/>
- **[S14]** Zyte Acceptable Use Policy:
  <https://www.zyte.com/terms-policies/acceptable-use-policy/>
- **[S15]** Zyte Data Processing Agreement:
  <https://www.zyte.com/terms-policies/dpa/>
- **[S16]** Zyte Privacy Policy (page stated effective 2024-08-30):
  <https://www.zyte.com/terms-policies/privacy-policy/>

## 19. Confidence summary

- **High:** task-API boundary; initial browser request restrictions; action,
  capture, screenshot, partial-result, session, rate, error, pricing, IDE, and
  scripting contracts; public Terms/AUP/DPA language.
- **Medium:** logical planner/worker/unblocking/runtime/telemetry architecture;
  completeness of negative searches across changing public documentation;
  vendor security and consent claims.
- **Low / unknown:** physical and tenant isolation, all-channel SSRF/egress,
  browser build and sandbox, script runtime controls, exact retention/regions,
  effective unblocking attempts, replay/freshness/cache behavior, account-specific
  legal exceptions, live quality/capacity, and target-specific cost.
