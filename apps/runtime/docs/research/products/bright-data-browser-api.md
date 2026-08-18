# Bright Data Browser API: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Subject:** Bright Data Browser API (formerly Scraping Browser) only. Other
Bright Data products appear only where they explain its proxy, account,
security, or legal boundary.  
**Status:** research evidence and recommendations only. No account, credential,
free or paid browser request, target-site test, traffic interception, binary or
source inspection, endpoint probing, access-control bypass, or implementation
was performed.

## Executive decision

**VERDICT — ADAPT the external contract lessons; DEFER the provider; REJECT it
as a default retrieval or evidence foundation (high confidence).** Browser API
is a remote Chromium automation and managed-unblocking service. A connection to
a zone endpoint allocates a time-boxed browser session controlled through CDP
or WebDriver. Bright Data chooses and rotates proxy peers, fingerprints,
headers, cookies, retries, and CAPTCHA handling; the caller supplies the
interaction logic. The public surface is powerful but narrow in guarantees:
one target domain, a 30-second connection window, five-minute network-idle
termination, 60-minute maximum life, and traffic-based billing [S1-S5].

Its useful clean-room lessons are to make dynamic rendering an explicit
capability, separate browser identity from proxy identity, expose a finite
session lifecycle and billable usage, and retain a provider-neutral evidence
envelope. Its material deficiencies for Curiosity are undocumented renderer
isolation, no public SSRF/network-containment contract, no durable browser-state
contract, opaque provider retries, sparse provenance, no documented recording
or replay, no numeric capacity commitment despite “unlimited” marketing, and a
consequential contractual right to retain collected data and use it for Bright
Data's own purposes [S3][S5][S7][S11].

**RECOMMENDATION (high):** if ever evaluated, place Browser API behind a narrow,
separately authorized `render/interact` adapter after ordinary retrieval fails
an explicit quality test. Use one public domain and one fresh session per job,
disable automatic CAPTCHA solving, prohibit login and client certificates,
enforce destination and byte policy outside the browser, and save Curiosity's
own source evidence. Do not expose raw CDP, zone credentials, debugger URLs, or
the Session Logs API to an agent.

## 1. Frame, bounded questions, and evidence method

### 1.1 Decision and bounded sub-questions

The decision is whether this hosted-browser capability has a safe, bounded role
in Curiosity's public-web retrieval architecture, and which observable design
patterns can be learned without copying or inferring proprietary code.

1. What creates, controls, terminates, and identifies a browser session?
2. What is retained within a session or across sessions, and what is merely a
   sticky proxy identity?
3. How do managed proxies, geolocation, retries, fingerprinting, and CAPTCHA
   handling alter retrieval behavior and evidence?
4. What concurrency, timeout, capacity, bandwidth, and price bounds exist?
5. What isolation, network, SSRF, credential, artifact, and debugger controls
   are documented—and which are not?
6. What logs and capture metadata support provenance, audit, and replay?
7. What privacy, contractual, acceptable-use, and residential-peer constraints
   affect adoption?
8. Which logical architecture follows from public behavior, and which details
   remain unknowable without prohibited reverse engineering?

### 1.2 Method and labels

Public first-party documentation, API schemas, product/pricing pages, security
material, the MSA, AUP, privacy policy, and public DPA were reviewed. Vendor
documentation is primary evidence of **vendor claims**, not independent proof
of security, performance, compliance, or implementation. Search was used only
for discovery; material claims cite their originating first-party page.

- **FACT** — directly supported by a cited public primary source.
- **INFERENCE** — a clean-room conclusion from observable/documented behavior,
  not a statement about private implementation.
- **RECOMMENDATION** — a proposed Curiosity decision.
- **UNKNOWN / NEGATIVE RESULT** — not established in reviewed public sources.
- Confidence is **high**, **medium**, or **low**.

This inquiry respected the MSA prohibition on copying, decompilation, reverse
engineering, source derivation, decryption, modification, and Bright Data IP
mapping [S11]. “Reverse engineering” here means documentation-only contract and
architecture reconstruction. No Bright Data code or confidential material was
accessed or transferred.

## 2. Session and browser contract

### 2.1 Connection creates the execution resource

**FACT (high):** Browser API has no REST operation for creating a browser.
Puppeteer and Playwright connect to
`wss://<zone-user>:<zone-password>@brd.superproxy.io:9222`; Selenium connects to
the HTTPS WebDriver endpoint on port 9515. The FAQ says these credentialed
WebSocket/HTTPS endpoints are currently the only connection methods [S2][S6].
The separate REST Session Logs API is observational, not a browser-creation
interface [S7][S8].

**FACT (high):** the supported control families are Puppeteer/CDP, Playwright's
`connectOverCDP`, and Selenium WebDriver. Official examples create a page after
connecting and close the browser or quit the driver in `finally` [S2]. Bright
Data says standard CDP/Puppeteer features work and adds custom CDP domains for
provider services [S3][S4].

**INFERENCE (high):** successful authenticated connection is the effective
session-create operation. The connection endpoint combines admission,
credential validation, browser allocation, and issuance of broad browser
authority. Closing the browser is the documented normal release path.

**SECURITY INFERENCE (high):** putting zone username/password in a connection
URL makes exceptions, traces, shell history, process arguments, and proxy logs
likely leak points. Some clients can move Basic authentication to a header, but
the examples and endpoint contract remain secret-bearing. Curiosity would need
a broker that holds credentials and never returns the endpoint to callers.

### 2.2 Observable lifecycle

```text
zone credentials
  -> connect attempt (must establish within 30 s)
  -> remote Chromium allocated / WebSocket or WebDriver attached
  -> pages, contexts, CDP sessions, navigations and interactions
  -> managed proxy/unblocking/retries behind browser traffic
  -> browser.close / driver.quit
     OR 5 min without network activity
     OR 60 min total
     OR worker/browser/infrastructure failure
  -> finished | failed session-log record
```

**FACT (high):** connection establishment has a 30-second timeout. A session is
terminated after five minutes with no network activity or at 60 minutes total.
The idle definition is network activity, not CDP commands, CPU use, page state,
or human activity [S2][S5].

**FACT (high):** top-level navigation is limited to one domain per session;
within it, navigations, clicks, scrolling, and forms are described as unlimited.
A different domain requires a new session [S2][S5][S6].

**UNKNOWN (high importance):** “domain” is not defined as exact host,
registrable domain, origin, scheme/port tuple, or subdomain family. Redirect
handling, popups, iframes, service workers, workers, WebSockets, and cross-domain
subresources are not specified by the one-domain rule. Normal pages require
cross-origin assets, so it cannot safely be assumed to be a complete egress
allowlist.

**FACT (high):** documented terminal/failure causes include 60-minute timeout,
network inactivity, domain-limit violation, CDP-command timeout, browser
disconnect, no free worker, worker crash, killed job, navigation error, proxy
timeout, no peer, and policy/authentication failures [S5]. The Session Logs API
reduces state to `running`, `finished`, or `failed` [S7][S8].

**UNKNOWN:** there is no documented create idempotency key, reconnect contract,
client-disconnect grace period, cancellation/kill REST endpoint, terminal-reason
taxonomy in the Session Logs schema, or guarantee that `browser.close()` has
completed cleanup before it returns.

### 2.3 Browser authority and custom control plane

**FACT (high):** standard browser actions include arbitrary page JavaScript,
DOM reads/interactions, request interception, screenshots, cookies, cache, and
CDP network operations. Bright Data's custom domains expose:

- `Captcha.solve`, `Captcha.setAutoSolve`, solver events, and synchronous wait;
- `Proxy.setLocation`, `Proxy.getGeolocation`, and `Proxy.useSession`;
- `Unblocker.enableAdBlock` / `disableAdBlock`;
- `Emulation.getSupportedDevices` / `setDevice`;
- `Browser.getSessionId`, `Browser.addCertificate`, and `Page.inspect`;
- `Download.enable`, download events, metadata, and body retrieval;
- `Input.type` [S3][S4][S9].

**INFERENCE (high):** Browser API is remote browser execution, not a constrained
fetch API. CDP permits script execution and broad page/network observation; its
authority is substantially larger than Curiosity needs to retrieve evidence.
A provider-neutral adapter should expose outcomes, not CDP commands.

## 3. Proxying, unblocking, and retrieval semantics

### 3.1 Managed egress

**FACT (high, vendor-claimed):** Bright Data automatically manages proxy-network
selection/rotation, browser fingerprints, headers, cookies, CAPTCHAs, retries,
and session recovery. The FAQ says Residential proxies are the Browser API
default, but the system may switch to Datacenter proxies for domains requiring
KYC/compliance treatment [S1][S6].

**FACT (high):** country can be encoded into the zone username. Exact latitude,
longitude, and radius can instead be requested before navigation through
`Proxy.setLocation`. With `strict: true`, peers are restricted to that radius;
with `false`, the radius expands to a nearest peer. `Proxy.getGeolocation` after
navigation returns observed IP version, country, ASN, city/region/postcode,
coordinates, and time zone—but intentionally not the peer IP [S4][S9].

**FACT (high):** Bright Data says Unlocker-family public IPs are hidden and
rotated for privacy/compliance; customers can inspect surrounding location and
ASN metadata but not the exit IP [S9].

**RECOMMENDATION (high):** record requested location, strictness, provider-
reported observed location/ASN, and any failure/substitution separately. Neither
requested nor provider-reported geo proves source location, legal jurisdiction,
or residency.

### 3.2 Sticky proxy identity is not persisted browser state

**FACT (high):** `Proxy.useSession({sessionId})`, invoked before navigation,
associates a caller-supplied identifier with a proxy peer so that the same peer
can be reused across Browser API sessions [S3].

**CHECK / CONTRADICTION:** the custom-CDP reference narrowly defines this as
reuse of the **same proxy peer**. The product page calls it “Session
Persistence” and variously says it maintains browser state, cookies, or IP
continuity between sessions [S3][S10]. No public mechanism was found to name,
restore, export, or delete a browser profile across sessions.

**INFERENCE (high):** treat `Proxy.useSession` only as sticky network identity.
Cookies, local/session storage, IndexedDB, cache, service workers, open pages,
and process memory persist naturally inside one live browser but are **not
established as durable across browser sessions**. Product-page wording is not
sufficient to enlarge the technical contract.

**FACT (high):** browser caching is documented only across repeated
navigations in a single session [S6]. Cookie setting is KYC-gated [S4]. Password
entry is disabled by default to prevent login/nonpublic collection; an exception
requires KYC and compliance approval [S6]. A PFX client certificate can be
installed for one session and is said to be removed when that session ends [S3].

**RECOMMENDATION (high):** Curiosity should not use sticky peer sessions,
cookies, password-entry exceptions, or client certificates in its public-web
lane. They create retained identity, credential, target-rights, and attribution
risks without improving source evidence.

### 3.3 Retries and CAPTCHA behavior

**FACT (high):** CAPTCHA auto-solving and form submission are on by default.
They can be disabled per session through CDP or at zone level; event/status
values distinguish detected, solved, failed, not detected, and invalid states
[S3]. Ad blocking is off until enabled [S3].

**FACT (medium, vendor claim):** unblocking can retry requests and rotate IPs in
the background [S1][S10]. The public contract gives no attempt count, retry
deadline, backoff, per-attempt peer identity, or record of intermediate target
responses.

**INFERENCE (high):** the HTML finally observed by the caller may be the result
of undisclosed attempts, identity changes, challenge solving, cookie mutation,
and form submission. A successful navigation is therefore neither a single
HTTP observation nor proof of completeness/currentness.

**RECOMMENDATION (high):** automatic CAPTCHA solving should be off. Never use
provider unblocking to override a Curiosity robots, rights, authentication, or
access-control deny. If provider retries cannot be bounded and evidenced under
the caller's remaining time/byte budget, the adapter should reject the task.

## 4. Isolation, persistence, network security, and SSRF

### 4.1 What is actually documented

**FACT (medium, vendor-claimed):** product copy describes fully managed hosted
browsers, “secure, isolated sessions,” auto-scaling, and an AWS multi-AZ
platform with network segmentation, TLS 1.3/minimum 1.2, and AES-256 at rest
[S10][S14]. These are platform-level assertions, not a Browser API tenant-
isolation specification.

**FACT (high):** each custom client certificate is scoped to one browser
session and removed afterward [S3]. Session Logs authenticate separately with a
Bearer API key; browser control uses zone username/password [S6-S8][S15]. API
keys can expire and have broad Admin, Finance, Ops, Limit, or User permission
profiles [S15].

### 4.2 Material negative results

No reviewed public Browser API source establishes:

- whether a session has a dedicated VM, container, browser process, OS user,
  network namespace, kernel, filesystem, or worker;
- whether multiple customers/sessions share a browser process or host, and the
  scope of pages/contexts inside one session;
- Chromium sandbox flags, seccomp/capability policy, host patch cadence, CPU,
  memory, process, disk, download, page/context, or decompression quotas;
- fresh-profile creation, profile-disk encryption/key boundaries, crash cleanup,
  deletion SLA, backup purge, or forensic remanence;
- private, loopback, link-local, cloud-metadata, multicast, service-network,
  DNS-rebinding, alternate-IP-encoding, or unsafe-port blocks;
- DNS answer pinning, redirect revalidation, cross-origin subrequest policy,
  WebSocket/WebRTC egress controls, non-HTTP scheme handling, or proxy fail-
  closed behavior;
- zone-resource scoping for API keys, per-session ownership binding, debugger-
  URL audience/expiry/revocation, or simultaneous-controller rules;
- a Browser API security whitepaper, public threat model, penetration-test
  findings specific to the browser worker, or public escape/isolation test.

**NEGATIVE RESULT (high):** the one-domain navigation rule is not a documented
SSRF control. It neither defines a public-address requirement nor covers all
browser-initiated traffic [S2][S5]. The error catalog's target-policy controls
and Bright Data's general network monitoring do not fill that technical gap.

**SECURITY INFERENCE (high):** client certificates increase the consequence of
SSRF or routing mistakes by adding an authenticated network principal to the
browser. File-download APIs can return attacker-controlled binary bytes to the
client. Live DevTools exposes DOM, network, console, execution, and input
authority. These features require distinct policy gates, not one generic
“browser” permission.

**RECOMMENDATION (high):** any Curiosity adapter must independently perform URL
policy before admission and network-layer enforcement after DNS resolution;
deny private/reserved/link-local/metadata/service ranges and unsafe schemes and
ports; recheck every redirect and connection; cap requests, pages, bytes,
downloads, decompression, CPU/memory/disk, and wall time; and treat all HTML,
screenshots, console/network data, and downloaded files as untrusted.

## 5. Concurrency, timeouts, failures, and pricing

### 5.1 Bounded facts

| Dimension | Public contract | Confidence |
| --- | --- | --- |
| Connect | 30 seconds before `client_timeout` | High [S5] |
| Network idle | Session killed after 5 minutes without network activity | High [S2][S5] |
| Total session | 60-minute maximum | High [S2][S5] |
| Navigation | 2 minutes recommended because initial unlock can take seconds to 1–2 minutes; caller/library timeout | High [S6] |
| CDP command | `cdp_cmd_timeout` exists; numeric bound not published | High [S5] |
| Domain | One domain/session; unlimited in-domain navigations | High [S2][S5] |
| Admission | `no_free_workers` or HTTP 503 can occur before connection | High [S5][S6] |
| Meter | Billable transferred GB; no instance/time/request charge | High [S6][S13] |

**FACT (high):** public list prices observed 2026-08-17 were $8/GB pay-as-you-go;
$499/month for 71 GB then an advertised $7/GB; $999 for 166 GB at $6/GB; and
$1,999 for 399 GB at $5/GB. Enterprise is custom. Premium domains cost more per
GB; exact premium rates are account/configuration dependent [S6][S13].

**FACT (high):** the Session Logs record reports total **billable bandwidth** in
bytes [S7][S8]. Bright Data recommends blocking media, fonts, stylesheets, ads,
and unnecessary requests and using same-session browser cache to reduce cost;
it warns that resource blocking can interfere with anti-bot expectations [S6].

### 5.2 Capacity and billing unknowns

**CHECK / CONTRADICTION:** product and docs advertise “unlimited concurrent
sessions/requests,” yet `no_free_workers` and HTTP 503 explicitly report worker
exhaustion/scaling [S1][S5][S6][S10]. “Unlimited” means no advertised fixed
customer number, not guaranteed instantaneous capacity.

**NEGATIVE RESULT (high):** no public numeric concurrency limit, creation rate,
queue depth, queue position, admission deadline beyond connection timeout,
reservation, priority, fairness, regional placement, autoscaling bound, or 429
contract was found. There is no public Browser API waiting-queue contract.

**UNKNOWN:** billing documentation does not define whether billable bytes include
request/response headers, retries, failed attempts, CAPTCHA traffic, debugger
traffic, downloads returned over CDP, TLS overhead, cache fills, browser telemetry,
or bytes transferred before a timeout. Nor does it document billing rounding,
minimum charge, delayed metering, hard spend cutoff, or how premium-domain rates
are selected.

**RECOMMENDATION (high):** Curiosity must provide its own finite queue, global
and per-origin concurrency, admission deadline, cancellation, attempt cap, and
hard dollar/byte circuit breaker. Retry capacity failures only within the
caller's budget. Meter provider-reported billable bytes separately from target
payload and Curiosity artifact bytes.

## 6. Logs, debugger, recording, and provenance

### 6.1 Available observability

**FACT (high):** `Browser.getSessionId` returns a UUID-like session ID. A
Bearer-authenticated REST API can retrieve that session or list historical and
running sessions with offset pagination (default 50, maximum 100), filters, and
sorting [S3][S7][S8].

**FACT (high):** each record contains session ID, Browser API/zone name, status,
initial target URL, last URL, navigation count, start timestamp, duration,
CAPTCHA state, billable bandwidth, and an optional `{code,message}` error.
List filters include status, API name, date range, target/end URL; sorts include
timestamp, duration, and bandwidth [S7][S8].

**FACT (high):** `Page.inspect` returns a URL for live Chrome DevTools. The
control panel can list live sessions and connect its debugger. DevTools permits
DOM inspection, network analysis, JavaScript debugging, console/performance
inspection, and live session visibility [S2][S6].

**SECURITY INFERENCE (high):** an inspect URL is a bearer-like high-authority
capability unless proven otherwise. Its exact authentication and lifetime are
undocumented. It must be redacted, brokered, audience-bound, and unavailable to
untrusted models or ordinary end users.

### 6.2 Provenance gaps

**NEGATIVE RESULT (high):** no public Browser API document reviewed offers
video recording, DOM replay, trace archive, WARC, HAR persistence, response-body
archive, screenshot retention, immutable result manifest, or cryptographic
capture hash. Screenshots and download bodies are caller-triggered outputs; the
provider Session Logs API is metadata, not an evidence archive [S3][S4][S7].

**UNKNOWN (high importance):** retention period and deletion controls for
session records, target/end URLs, CAPTCHA state, debugger data, internal network
logs, intermediate retries, cookies, fingerprints, screenshots, and downloaded
content are not specified. The Session Logs list endpoint supports historical
queries but declares no retention horizon [S7][S8].

**INFERENCE (high):** provider logs are operational provenance only. They do not
prove the redirect chain, target status, response headers/body, retry sequence,
peer changes, browser build, requested/observed geo, final DOM derivation, or
exact observation time per resource. They cannot reproduce a session.

**RECOMMENDATION (high):** Curiosity's adapter should create an immutable
evidence envelope containing requested/final URL, redirect chain when observed,
all target/provider statuses, start/end times, session ID, logical zone ID,
render policy, browser/adapter versions, requested and reported geo/ASN,
navigation/request/byte counts, CAPTCHA and retry policy/events, content type,
raw response or authorized capture, extracted derivative, hashes, truncation,
warnings, and terminal reason. Never store zone credentials, peer/session
stickiness identifiers, debugger URLs, certificate material, or raw secrets.

## 7. Privacy, legal, compliance, and peer considerations

### 7.1 Consequential contract terms

**FACT (high):** the June 16, 2026 MSA groups “Proxy Services and Scraping
Browser API” and says Bright Data **may retain data the client collected and may
use it for its own purposes in its sole discretion** [S11]. It also disclaims
accuracy, completeness, security, non-infringement, virus absence, and
continuous/error-free service; makes the client responsible for lawful use and
third-party rights; and limits aggregate liability to fees received during the
one month before an event [S11].

**RECOMMENDATION (high):** that retention/reuse clause is a procurement blocker
for confidential, personal, unpublished, credentialed, or otherwise sensitive
retrieval. Require an order-form/DPA override covering no independent use or
training, content/log/profile retention periods, deletion and backup-purge SLA,
subprocessors/regions, support access, incident timing, audit evidence, and
output/artifact rights.

**FACT (high):** the AUP prohibits collection of nonpublic/behind-login data,
fraud, spam, fake accounts/content/engagement, ticket bots, click fraud, and
violations of law or third-party rights. Bright Data may block adult,
government, harmful, and other content at its discretion [S12]. Browser API
accordingly blocks password typing by default, although KYC plus compliance
approval can permit an exception [S6].

**INFERENCE (high):** KYC or provider permission is not permission from a target
and does not replace Curiosity's robots, terms, copyright, privacy, database-
right, proportionality, or purpose review. Curiosity should never request the
password-entry exception.

### 7.2 Personal data and residential peers

**FACT (high):** the privacy policy says Bright Data may collect account/KYC
identifiers, IDs, addresses, payment data, IP addresses, and recorded calls;
retains personal information as needed for service, legal obligations, disputes,
and policy enforcement rather than for one fixed period; and may process outside
the EEA under asserted safeguards [S16]. It says User Data is not rented or
sold, while its CCPA notice says it may have sold the category “Identifiers” in
the prior 12 months [S16].

**FACT (high):** the public DPA requires documented instructions,
confidentiality, reasonable security, data-subject assistance, deletion on
request/termination subject to law, breach notice without undue delay, and
general subprocessor authorization with seven days' notice/objection. The
reviewed public document does not list subprocessors or promise a fixed breach
notification or deletion period [S17].

**FACT (high, vendor-claimed):** Bright Data says new Residential zones after
2026-07-07 require a human-reviewed KYC process for registered companies with a
corporate domain, residential peers are real people who opted in, traffic is
monitored continuously, and use is restricted to the approved case [S18].
Browser API normally uses Residential peers but may switch to Datacenter for
compliance [S6].

**RECOMMENDATION (high):** residential routing should be separately deferred
pending legal, privacy, sourcing/consent, geography, and purpose review. Never
interpret hidden peer IP, successful routing, or KYC as evidence of ethical or
lawful authority for a particular target.

### 7.3 Security attestations

**FACT (medium, vendor-claimed):** Bright Data reports ISO/IEC 27001:2022,
27017, 27018, SOC 2 Type II under NDA, public SOC 3, annual penetration testing,
AWS multi-AZ/DR, encryption, RBAC, and secure-SDLC controls [S14]. The published
2025 penetration-test product list names proxy, Unlocker, control/API, dataset,
archive, and scraper surfaces but does not explicitly name Browser API [S14].

**UNKNOWN:** no audit report mapping was obtained for Browser API browser-worker
isolation, SSRF, ephemeral state deletion, or Session Logs retention. General
certification is not proof of those product-specific properties.

## 8. Clean-room logical architecture

The following is **INFERENCE**, not a claim about Bright Data source code,
orchestrator, hypervisor, container runtime, or cloud topology.

```text
Curiosity-side controller
  | zone user/password: CDP WebSocket or WebDriver HTTPS
  v
protocol/auth + zone-policy + capacity gateway
  |                         |
  |                         +--> account/KYC/compliance/billing policy
  v
browser worker allocation -> hosted Chromium session
  |                          |-- pages/contexts/cache/cookies (live session)
  |                          |-- custom CDP shim (Captcha/Proxy/Download/etc.)
  |                          `-- DevTools live-inspection bridge
  v
managed unblock/proxy broker
  | choose/rotate/stick peer, geo, fingerprint, headers, retry, CAPTCHA
  v
public target + cross-origin resources

separate observation plane:
Browser.getSessionId -> session metadata store -> Bearer REST list/get API
```

Evidence for this model:

- two standard remote-control gateways and zone credentials [S2][S6];
- worker-exhaustion/crash errors and auto-scaling claims [S5][S10];
- custom CDP methods between client and ordinary Chromium behavior [S3][S4];
- documented proxy selection, peer stickiness, geo, retries, and CAPTCHA
  orchestration [S1][S3][S6][S9];
- live debugger plus separately authenticated historical session metadata
  [S6-S8].

**INFERENCE (high):** a control/policy plane resolves the zone, compliance, and
billing context before assigning a browser worker. A protocol shim must
intercept custom CDP methods and coordinate proxy/unblock services. A separate
metadata path outlives at least some completed sessions because historical REST
listing exists.

**INFERENCE (medium):** the browser worker and proxy broker exchange session and
navigation state because geolocation must be set before navigation, queried
after it, and reused under a supplied peer-session ID. The storage and transport
mechanisms are unknown.

**NOT ESTABLISHED:** worker-to-host ratio, warm pools, orchestration platform,
browser build pipeline, profile snapshots, VM/container technology, queueing,
regional topology, data-store technology, retry algorithm, or isolation boundary.
No such details should be copied from analogous products or marketing language.

## 9. Curiosity implications and verdict ledger

### 9.1 Adopt / adapt

| Lesson | Verdict | Curiosity translation |
| --- | --- | --- |
| Dynamic interaction is a distinct capability | **ADOPTED** | `fetch`, `render`, and `interact` require separate authority and budgets; no silent escalation. |
| Finite browser lifecycle with typed terminal causes | **ADOPTED** | Explicit admission, running, timeout, policy, capacity, and failure states. |
| Separate control and observation credentials | **ADAPTED** | Workload identity is narrow and short-lived; audit APIs are operator-only. |
| Proxy location is requested and observed | **ADOPTED** | Preserve both plus strictness and ASN; never promote them to truth or provenance. |
| Sticky network identity differs from browser state | **ADOPTED** | Model egress affinity independently from cookies/profile/process persistence. |
| Standard browser protocols behind adapter | **ADAPTED** | Keep CDP/WebDriver and custom domains inside provider adapter; never in core contracts. |
| Session ID plus usage metadata | **ADAPTED** | Correlate provider session to Curiosity job/evidence, without exposing provider capabilities. |
| Content-bearing observability is sensitive | **ADOPTED** | Metadata by default; screenshots/network/DOM/downloads only under explicit retention class. |
| Traffic-based cost optimization | **ADAPTED** | Block unnecessary resources only when evidence policy permits; enforce hard bytes and dollars. |

### 9.2 Reject / defer

| Choice | Verdict | Reason |
| --- | --- | --- |
| Browser API as Curiosity search, corpus, or provenance foundation | **REJECTED** | It supplies execution/unblocking, not owned index, ranking, or source proof. |
| Browser rendering for every URL | **REJECTED** | More authority, nondeterminism, attack surface, latency, and cost than static retrieval. |
| Raw CDP/WebDriver exposed to agents | **REJECTED** | Excessive script, network, credential, file, and live-control authority. |
| CAPTCHA solving, identity rotation, or stealth by default | **REJECTED** | Can override publisher signals and obscures attempt-level provenance. |
| Login, password exception, cookies, or client certificates | **REJECTED** | Public-web lane must not collect nonpublic data or concentrate target credentials. |
| `Proxy.useSession` for general retrieval | **REJECTED** | Cross-job network identity creates linkage without durable evidence benefit. |
| One-domain rule as SSRF defense | **REJECTED** | Undefined and incomplete for browser subresources/redirects/DNS. |
| Provider selection now | **DEFERRED** | Isolation, SSRF, retention, billing, capacity, legal, and contract checks remain open. |
| Residential peer routing | **DEFERRED** | Requires explicit peer-consent, KYC, jurisdiction, target-rights, and purpose review. |
| Live debugger in production | **DEFERRED** | Useful operationally but needs capability lifetime, authorization, redaction, and audit design. |

### 9.3 Minimum provider-neutral render contract

```text
RenderRequest {
  job_id, tenant_id, url, mode: rendered|interact,
  admission_deadline_ms, wall_deadline_ms, navigation_deadline_ms,
  max_redirects, max_requests, max_response_bytes, max_total_bytes,
  egress_policy_id, geo_request?, captcha_policy: deny,
  credential_policy: none, download_policy: deny,
  retention_class: metadata_only
}

RenderEvidence {
  job_id, provider_ref, requested_url, final_url, redirect_chain?,
  started_at, ended_at, target_status?, provider_status, terminal_reason,
  browser_version?, adapter_version, render_policy,
  requested_geo?, observed_geo_asn?,
  navigations, requests?, target_bytes?, provider_billable_bytes?,
  captcha_events[], retry_summary?, media_type,
  content_ref, content_hash, extracted_ref?, extraction_chain[],
  truncated, policy_events[], warnings[]
}
```

Question marks are deliberate: the Bright Data public contract does not supply
every field. Missing provenance must remain explicitly missing, not inferred.

## 10. Unknowns and pre-adoption checks

### Contract and privacy checks

- Obtain a written override of MSA section 10.1.IV for no retention,
  independent use, analytics reuse, or model training on collected content.
- Obtain the current DPA, named subprocessors and processing regions, fixed
  incident deadline, content/session-log retention, deletion and backup-purge
  SLA, support-access model, and Browser API audit/control mapping.
- Clarify output ownership/license, target-content responsibility, indemnities,
  premium-domain classification/rates, and advance notice for API/price changes.

### Security and isolation checks

- Demand a Browser API threat model and exact per-session process/VM/container,
  kernel, filesystem, profile, network, and tenant-isolation boundary.
- Confirm private/reserved/link-local/metadata/service-address and unsafe-port
  blocking after DNS resolution, on redirects, subresources, WebSockets, and all
  protocols; confirm DNS-rebinding and proxy fail-closed behavior.
- Confirm Chromium sandbox posture, resource quotas, patch SLA, crash cleanup,
  certificate/profile deletion, key boundaries, and independent test scope.
- Define debugger URL authentication, audience, TTL, revocation, redaction,
  simultaneous controllers, and audit events.

### No-cost contract checks, only after separate approval

- On an approved public test domain, verify what “same domain” means for hosts,
  schemes, ports, redirects, popups, iframes, workers, and CDN subresources.
- Verify connection/disconnect races, close semantics, all timeout clocks,
  capacity response/backoff, command timeout, and whether a dropped connection
  leaves a chargeable browser.
- Verify a new connection has a fresh profile and that `Proxy.useSession`
  preserves only peer identity, not cookies/cache/storage/process state.
- Verify retry/peer/CAPTCHA evidence, target status and headers, reported geo,
  billable-byte composition/rounding, spend-limit delay, and premium pricing.
- Verify Session Logs visibility, ownership, pagination consistency, retention,
  deletion, error taxonomy, URL redaction, and running-to-terminal latency.
- Paid load, success-rate, CAPTCHA, restricted-target, authenticated-site, and
  bypass tests remain prohibited absent a new reviewed authority and budget.

## 11. Contradictions and retained negative results

1. **Headless versus GUI/headful:** the current product page says browsers are
   headless, then calls Browser API GUI/headful elsewhere; the pricing FAQ says
   it is GUI/headful but experienced as headless [S10][S13]. **UNKNOWN:** actual
   launch/display mode and fingerprint contract. It is irrelevant to Curiosity's
   security boundary and must not be inferred.
2. **Persistence:** the technical CDP reference promises same proxy peer; product
   copy also says browser state/cookies persist across sessions [S3][S10]. No
   durable-profile API was found. Adopt the narrower peer-only contract.
3. **Unlimited concurrency:** marketing says unlimited; operational docs expose
   no-free-worker and 503 scaling failures [S1][S5][S6][S10]. No capacity SLO or
   queue is documented.
4. **Scripts “run inside” versus remote control:** introduction copy says scripts
   run inside the hosted environment, while all examples run customer code
   locally and attach remotely [S1][S2]. Treat customer code as client-side and
   page JavaScript as browser-side unless a separate product contract says more.
5. **API authentication:** generic authentication documentation recommends API
   keys for Browsers, but the Browser FAQ says browser connection is only zone
   username/password; API keys authenticate Session Logs [S6-S8][S15]. These are
   separate surfaces, not interchangeable methods.
6. **Recording:** no video/replay/trace/WARC facility or retention contract was
   found. Live DevTools and summary Session Logs must not be mislabeled as
   recording or reproducible evidence.

## 12. Bounded curiosity pass

Scoring is **relevance/value/novelty/cost**, each 1–5. Only declared-frame,
public-source work was eligible. The pass stopped at **coverage + saturation**:
all requested categories had evidence or an explicit negative result; further
answers required credentials, paid tests, confidential reports, or prohibited
reverse engineering.

| Thread | R/V/N/C | Decision and result |
| --- | ---: | --- |
| Sticky peer versus browser-profile persistence | 5/5/5/1 | **Pursued.** Technical reference supports peer reuse only; retained product-page contradiction [S3][S10]. |
| Session Logs schema and provenance | 5/5/4/1 | **Pursued.** Found list/get schemas and sparse metadata; no replay-grade evidence [S7][S8]. |
| Browser-specific SSRF/isolation contract | 5/5/4/2 | **Pursued.** No technical contract found; retained detailed negative result. |
| MSA collection retention/reuse | 5/5/5/1 | **Pursued.** Found provider reuse right; elevated to procurement blocker [S11]. |
| Concurrency versus worker exhaustion | 5/4/4/1 | **Pursued.** “Unlimited” is contradicted by capacity errors; numeric admission model remains unknown [S1][S5][S6]. |
| Recording/replay retention | 4/5/3/2 | **Pursued.** No Browser API recording/replay contract found; live debugger is not a recording. |
| Active endpoint/fingerprint/isolation probing | 3/3/4/5 | **CURIOSITY_NO_GO:** prohibited by frame, unnecessary for documented-contract decision, and potentially contrary to MSA. |
| Paid success/capacity benchmark | 3/4/2/5 | **CURIOSITY_NO_GO:** paid tests and credentials prohibited; vendor performance claims remain unverified. |
| Bright Data private code or worker-image acquisition | 2/3/4/5 | **CURIOSITY_NO_GO:** outside access/license boundary and unnecessary. |
| Target-specific anti-bot bypass study | 2/2/3/5 | **CURIOSITY_NO_GO:** outside public-retrieval safety frame and would test bypass behavior. |
| Litigation and residential-peer app forensics | 3/3/4/5 | **CURIOSITY_NO_GO:** legal survey and invasive peer reverse engineering are outside the bounded product-contract task; defer to counsel/vendor diligence. |

## Sources

All sources are first-party Bright Data materials accessed **2026-08-17**.
Product, performance, scale, security, and compliance statements are vendor
claims unless the cited material itself identifies an external attestation.

- **[S1]** Browser API introduction — https://docs.brightdata.com/scraping-automation/scraping-browser/introduction
- **[S2]** Browser API configuration and connection examples — https://docs.brightdata.com/scraping-automation/scraping-browser/configuration
- **[S3]** Custom CDP functions — https://docs.brightdata.com/scraping-automation/scraping-browser/cdp-functions/custom
- **[S4]** Standard CDP functions — https://docs.brightdata.com/scraping-automation/scraping-browser/cdp-functions/standard
- **[S5]** Browser API error catalog — https://docs.brightdata.com/scraping-automation/scraping-browser/error-codes
- **[S6]** Browser API FAQs — https://docs.brightdata.com/scraping-automation/scraping-browser/faqs
- **[S7]** List Browser Sessions OpenAPI — https://docs.brightdata.com/api-reference/browser-api/get-sessions
- **[S8]** Get Browser Session OpenAPI — https://docs.brightdata.com/api-reference/browser-api/get-session
- **[S9]** Browser API geolocation targeting — https://docs.brightdata.com/scraping-automation/scraping-browser/features/proxy-location
- **[S10]** Browser API product page — https://brightdata.com/products/scraping-browser
- **[S11]** Master Service Agreement, updated 2026-06-16 — https://brightdata.com/license
- **[S12]** Acceptable Use Policy — https://brightdata.com/acceptable-use-policy
- **[S13]** Browser API pricing — https://brightdata.com/pricing/scraping-browser
- **[S14]** Security and compliance overview — https://docs.brightdata.com/general/security/security-overview
- **[S15]** Authentication and API-key permissions — https://docs.brightdata.com/api-reference/authentication
- **[S16]** Privacy Policy, reviewed 2026-05-14 — https://brightdata.com/privacy
- **[S17]** Data Protection Addendum (public PDF) — https://brightdata.com/static/web/Bright-Data-Data-Protection-Agreement.pdf
- **[S18]** Residential network access policy — https://docs.brightdata.com/proxy-networks/residential/network-access
