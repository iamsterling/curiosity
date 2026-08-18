# Browserbase hosted-browser infrastructure: clean-room research dossier

**Research date / source access date:** 2026-08-17  
**Subject:** Browserbase's hosted browser-session infrastructure, not its Search,
Fetch, Agents, Functions, Model Gateway, or Stagehand products except where they
clarify the browser control plane.  
**Status:** research evidence and recommendations only; no implementation,
deployment, account creation, credential use, paid test, or access-control
bypass was performed.  
**Decision frame:** what Browserbase reveals about a production hosted-browser
system, which behaviors Curiosity can learn from clean-room, and whether a
hosted browser should have any role in Curiosity's owned public-web retrieval
architecture.

## Executive conclusion

**RECOMMENDATION — ADAPT the architecture lessons; DEFER any provider choice
(high confidence).** Browserbase documents a useful separation between an API
control plane, one ephemeral browser VM per session, optional encrypted
cross-session Context state, configurable egress/proxy identity, and a distinct
artifact/observability plane. Its strongest transferable lessons are: make a
browser an explicit finite-lifetime resource; reject overload rather than hide
an unbounded queue; isolate each untrusted renderer; separate ephemeral runtime
state from deliberately persisted identity; make recording/logging independently
controllable; and expose lifecycle, usage, and terminal reasons.

**RECOMMENDATION — REJECT Browserbase as Curiosity's search or evidence
foundation (high confidence).** A hosted browser neither supplies an owned
corpus nor proves source authority. It would add vendor, privacy, retention,
cost, and external-network dependencies. At most, it is a deferred adapter for
a quota-bound dynamic-rendering lane after static retrieval fails explicit
quality checks. Its output remains untrusted external data.

**FACT (high):** Browserbase says every browser runs in a dedicated VM and
isolated subnet, the VM is destroyed after the session, browsers are not reused,
and GPUs are unavailable [S13]. **INFERENCE (medium):** the public interfaces
support a four-plane model—control, execution, state/artifact, and egress—but do
not reveal the scheduler, hypervisor, host topology, storage implementation, or
failure-domain design. A Browserbase article explaining Firecracker is not
evidence that Browserbase uses Firecracker [S21].

## 1. Frame, bounded questions, and method

### 1.1 Bounded sub-questions

1. What are the lifecycle and state boundaries of Sessions and Contexts?
2. How are persistence, proxy identity, regions, and network restrictions
   configured?
3. What live debugging, logs, recordings, replay, and download artifacts exist?
4. What concurrency, creation-rate, timeout, queue, and billing boundaries are
   documented?
5. What isolation, access-control, retention, and enterprise controls are
   claimed, and what remains unverified?
6. What stable public API shapes expose the system without revealing internals?
7. Which architecture conclusions follow from those facts, and which do not?
8. Which lessons are safe to adopt or adapt for Curiosity without copying
   proprietary implementation?

### 1.2 Research boundary and evidence policy

This is a clean-room, black-box/documentation study. Public Browserbase product
documentation, its published OpenAPI, official legal/security pages, official
GitHub license files, and an official engineering article were inspected. No
account was opened; no API request or browser session was run; no credentials,
private reports, paid features, traffic interception, binary inspection, or
endpoint probing was used. No Browserbase source code was copied.

Official vendor documentation is primary evidence for **what the vendor
claims**, not independent proof of comparative performance, security, or
compliance. Search snippets were discovery leads only. Sources were accessed
2026-08-17. Plan values and product behavior are date-sensitive.

Labels:

- **FACT** — directly stated by a cited primary source.
- **INFERENCE** — reasoned from cited facts but not directly confirmed.
- **RECOMMENDATION** — a proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

Coverage stopped after every requested category had direct evidence, material
claims repeated without changing the model, and remaining gaps required vendor
access, credentials, paid tests, or intrusive investigation.

## 2. Product boundary and public contract

### 2.1 Core object model

**FACT (high):** a Session is one cloud browser instance. `POST /v1/sessions`
returns a session ID plus a WebSocket `connectUrl`, Selenium HTTP remote URL,
and signing key. The documented status enum is `PENDING`, `RUNNING`, `ERROR`,
`TIMED_OUT`, or `COMPLETED`; records include project, timestamps, expiry,
region, proxy bytes, keep-alive flag, optional Context ID, and user metadata
[S1].

**FACT (high):** supported connection examples use CDP with Playwright and
Puppeteer and a remote WebDriver endpoint with Selenium. Browserbase tells CDP
clients to use the already-created default browser context and page [S2]. This
is a remote-control interface, not a proprietary automation language.

**FACT (high):** a Context is separately created state that can be attached to
later Sessions. Ordinary Sessions start with a fresh user-data directory.
Contexts persist cookies, localStorage, IndexedDB, session storage, service
workers, web/form data, preferences, permissions, and HSTS state, but not the
ordinary HTTP cache [S3].

**FACT (high):** persistence is explicit in both directions: attach a Context
with `persist: false` for a read-only snapshot or `persist: true` to write
changes back when the Session closes. Browserbase warns that synchronization
takes a few seconds and recommends against simultaneous Sessions using the same
Context [S3]. **INFERENCE (high):** Context update behaves like asynchronous
whole-profile checkpoint/restore, not a transactional multi-writer database.

**FACT (high):** Contexts live indefinitely until deletion or parent/account
invalidation, while site credentials can independently expire or be revoked
[S3]. Context records are project-scoped; deletion is permanent. The create
response exposes a public key, `AES-256-CBC` as the currently supported cipher,
and an initialization-vector size; the guide separately says each Context is
uniquely encrypted at rest [S3, S4].

**UNKNOWN:** the public material does not explain envelope-key management,
authentication/integrity protection around the stated CBC encryption, key
rotation, backup deletion timing, conflict resolution, maximum Context size, or
whether concurrent readers are snapshot-isolated.

### 2.2 Lifecycle

```text
API key / project
  -> POST session configuration
  -> PENDING -> RUNNING
  -> connect within 5 minutes via CDP or WebDriver
  -> browser work + optional live view/log/recording
  -> disconnect ends ordinary session
     OR keepAlive permits reconnect until release/timeout
  -> COMPLETED | TIMED_OUT | ERROR
  -> optional Context synchronization
  -> retained metadata/artifacts until plan or feature policy expires
```

**FACT (high):** a newly created Session must be connected to within five
minutes. Without keep-alive, disconnection terminates it; with paid-plan
keep-alive, the same connection URL can be reused until explicit
`REQUEST_RELEASE` or timeout [S2, S5]. A CDP connection is closed after ten
minutes without CDP commands [S6].

**FACT (high):** the create schema permits a 60–21,600 second timeout; standard
paid plans advertise six-hour maximum Sessions, while Free advertises 15
minutes and custom Scale may exceed six hours [S1, S18]. **CHECK:** the generic
long-session guide says “maximum ... 6 hours” [S5], while current plan docs say
Scale is “6+ hrs” [S18]. Treat six hours as the public standard-plan/API bound,
not a universal enterprise ceiling.

**FACT (high):** keep-alive survives controller disconnects but does not suspend
billing or override the timeout. It must be released to avoid idle browser
minutes [S5].

## 3. Persistence, proxies, identity, and regions

### 3.1 Persistence is not runtime reuse

Browserbase separates:

| Concern | Public mechanism | Boundary |
| --- | --- | --- |
| Fresh compute | New Session | New browser VM; destroyed after use [S13] |
| Reconnection | `keepAlive` | Same live Session/URL, finite timeout [S5] |
| Cross-session identity | Context | Encrypted user-data-directory snapshot [S3, S4] |
| Network identity | Proxy configuration | Chosen per Session [S1, S7] |
| Evidence/debug state | Logs, video, HLS, MP4 | Separate retained artifacts [S8–S11] |

**INFERENCE (high):** this is a sound trust model: persisting identity does not
require reusing a potentially compromised VM. Curiosity should preserve that
separation if it ever has authenticated-browser workflows.

### 3.2 Proxy behavior

**FACT (high):** proxies are off by default. Paid Developer-and-higher plans can
use Browserbase-managed residential proxies or customer-provided HTTP/HTTPS
proxies. A Session can carry an ordered list of Browserbase, external, or
`none` routes with regular-expression-like domain patterns; the first matching
rule wins [S1, S7]. SOCKS5 is not supported [S14].

**FACT (high):** managed proxy geolocation accepts country and optionally city
and US state. Location is best effort: the nearest proxy may be substituted,
and bare `proxies: true` attempts the US but may route through a nearby country
such as Canada [S7]. This is not a hard residency guarantee.

**FACT (high):** Browserbase validates external proxy connectivity at Session
creation. Projects may upload persistent PEM CA certificates and attach their
IDs so a Session trusts customer TLS-interception proxies. Certificate IDs must
belong to the project; a missing/mismatched ID makes Session creation fail
[S7].

**FACT (high):** managed residential proxies come from third parties whose
acceptable-use restrictions can change. Browserbase lists banking, government,
streaming, ticketing, webmail, and gambling as higher-risk categories and says
support for a target is not a stable blanket yes/no [S7].

**FACT (high):** proxy bandwidth includes payloads, media, headers,
authentication data, and encryption overhead. Billing has a one-MB minimum per
proxied Session and rounds by MB [S7, S18].

**RECOMMENDATION (high):** Curiosity must never interpret proxy location as
source provenance or legal authority. Record requested and observed egress
region separately, treat substitution as a warning, and never silently rotate
identity to bypass a publisher's controls.

### 3.3 Regions and browser identity

**FACT (high):** the Session API exposes `us-west-2`, `us-east-1`,
`eu-central-1`, and `ap-southeast-1`, defaulting to US West [S1]. The enterprise
page labels these US West, US East, Germany, and Singapore and presents region
selection as a data-residency control [S13].

**FACT (high):** create options include viewport, ad blocking, CAPTCHA solving,
record/log toggles, OS/identity settings, allowed domains, proxy settings,
extensions, Context, and metadata [S1]. The default values documented by the
schema include recording and logging on, CAPTCHA solving on, ad blocking off,
and `ignoreCertificateErrors: true` [S1].

**RECOMMENDATION (high):** Curiosity should invert two defaults for an evidence
renderer: CAPTCHA solving off and certificate-error ignoring off. Rendering
must fail closed on TLS and access challenges unless a separately authorized
workflow says otherwise.

## 4. Debugging, recording, and evidence artifacts

### 4.1 Live and retained observability

**FACT (high):** Session Inspector supports live interaction, post-run video,
events/pages, CDP runtime/page/input/log events, network requests/responses,
console output, resource metrics, metadata, region, duration, proxy bandwidth,
settings, and expiry [S8]. Session logs are available through
`GET /v1/sessions/{id}/logs` [S8].

**FACT (high):** `GET /v1/sessions/{id}/debug` returns full-screen and framed
debug URLs, a WebSocket URL, and per-tab live URLs. Live View permits watching,
clicking, typing, scrolling, iframe embedding, and human takeover. Each tab has
a distinct live URL [S9, S12].

**SECURITY INFERENCE (high):** debug URLs and connection URLs are bearer-like
capabilities even though their exact token form/lifetime is undocumented. They
must be redacted from logs and never delivered directly to an untrusted model or
browser client without an application authorization layer.

### 4.2 Video, replay, and downloads

**FACT (high):** recording and logging default on but can each be disabled at
Session creation [S1]. Video records up to ten concurrently open tabs as
separate streams. The older rrweb DOM replay API is being deprecated; video
remains supported. Disabling recording also disables rrweb but not Live View
[S10].

**FACT (high):** the Replay API lists per-tab metadata then returns an HLS
playlist whose fragmented-MP4 segments are signed CDN URLs. Segment URLs expire
six hours after playlist issue. The playlist endpoint is limited to 120
requests/minute/project [S11]. Browserbase explicitly warns not to call it from
client-side code with the API key; an application backend should fetch the
playlist [S11].

**FACT (high):** after a Session ends, a separate API asynchronously enqueues
one MP4 rendition per recorded tab. States are `NOT_REQUESTED`, `PENDING`,
`COMPLETED`, and `FAILED`; POST retries/re-enqueues and GET is polled. Signed
download URLs expire after six hours. Assembly is available up to 31 days after
the Session on standard projects, versus a 24-hour source window under BYOS;
POST is limited to five requests/minute/project [S17].

**CHECK:** plan-level “Data Retention” is 7 days (Free/Developer), 30 days
(Startup), or 30+ days (Scale), while recording-download docs say source is
available “up to 31 days” [S18, S17]. The exact effective window likely depends
on plan/configuration, but the relationship is not stated. Do not promise 31
days without account-specific confirmation.

**FACT (high):** Zero Data Retention (ZDR) is Enterprise-only as an account
feature; it suppresses Browserbase persistence of logs, video, and rrweb replay
while leaving Live View and operational metadata. On every plan, individual
Sessions can set `logSession: false` and `recordSession: false`. Downloads,
uploads, Contexts, and extensions are separate and require BYOS if they must be
routed to customer storage [S15].

**INFERENCE (high):** observability is also sensitive-content capture. Network
logs, console output, video, DOM state, downloads, and Contexts may contain
tokens, personal data, and page content. “Debuggability” and “data minimization”
must be an explicit per-workload trade, not one global default.

## 5. Concurrency, overload, queues, and cost

### 5.1 Browser capacity and overload

**FACT (high):** two distinct limits apply: active concurrent browsers and new
Session creations within any 60-second window. Exceeding either returns HTTP
429. Documented response headers include `x-ratelimit-limit`,
`x-ratelimit-remaining`, `x-ratelimit-reset`, and `retry-after` [S16].

**FACT (high):** Browserbase explicitly says an over-limit Session-create
request is “effectively dropped”; the documented retry pattern is client-side,
bounded, respects `retry-after`, and adds exponential backoff [S16].

**NEGATIVE RESULT (high):** no public browser-session document examined offers
a server-side waiting queue, queue position, admission deadline, reservation,
priority, or fairness guarantee. The `PENDING` status proves a provisioning
state exists but does not establish durable queuing semantics [S1, S16]. Do not
infer a hidden queue.

**FACT (high):** concurrency is assigned at organization level and distributed
among projects; each project receives at least one. The current plan table is:

| Plan | Monthly price | Included browser hours | Concurrent | Creates/min | Advertised max Session |
| --- | ---: | ---: | ---: | ---: | ---: |
| Free | $0 | 1 | 3 | 5 | 15 min |
| Developer | $20 | 100 | 25 | 25 | 6 hr |
| Startup | $99 | 500 | 100 | 50 | 6 hr |
| Scale | Custom | Flexible | 250+ | 150+ | 6+ hr |

[S18]. Browser time has a one-minute per-Session billing minimum. Developer
overage is $0.12/hour and proxy overage $12/GB; Startup is $0.10/hour and
$10/GB. Included proxy amounts are 1 GB and 5 GB respectively. Free has no
proxy allocation [S18].

**FACT (high):** monthly browser/proxy allocations on paid plans are not hard
caps; overage continues without cutoff. **RECOMMENDATION (high):** a Curiosity
adapter needs its own hard budget circuit breaker because provider billing does
not supply one.

### 5.2 The only documented queue in scope

**FACT (high):** MP4 recording assembly is explicitly asynchronous and queued;
clients POST then poll per-page state [S17]. This is an artifact-production
queue, not browser admission. Browserbase Functions claim automatic concurrency
and Session lifecycle management [S16], but their internal queueing semantics
were outside this browser-infrastructure frame and are not evidence for Session
creation behavior.

**RECOMMENDATION (high):** Curiosity should put its own finite admission queue
in front of any renderer, with deadline, cancellation, per-origin and global
caps, and stable overload errors. Retry 429 only inside the caller's remaining
budget; never convert provider throttling into an unbounded internal backlog.

## 6. Security, isolation, access, and data handling

### 6.1 Documented controls

**FACT (high, vendor-claimed):** Browserbase describes “zero trust browser
isolation”: one browser per dedicated VM, one isolated subnet with strict
firewalls, no browser reuse, VM destruction after each Session, and no GPU
access [S13]. It claims SOC 2 Type II, HIPAA support with BAA availability,
third-party penetration testing, and fast Chrome CVE patching [S13]. Full
attestations and test reports require Trust Center/vendor access and were not
reviewed.

**FACT (high):** all documented REST endpoints use an `X-BB-API-Key`; project
may be inferred from that key [S1, S19]. Dashboard roles are Admin,
Contributor, and Viewer, but Browserbase explicitly says those roles govern the
dashboard only, not API interaction; the API key determines API access [S20].

**INFERENCE (high):** the key is a broad project capability and is not a safe
end-user delegation primitive. Curiosity would need its own narrowly scoped
broker and audit policy; never expose the vendor key, Session signing key,
connect URL, signed replay segments, or live-control URL to an agent response.

**FACT (high):** Allowed Domains is experimental and only restricts top-frame
HTTP(S) navigation. A parent domain permits all subdomains; iframe/subframe
loads, scripts, images, XHR, and non-HTTP schemes such as `file:` and `chrome:`
are not blocked by that feature [S14].

**RECOMMENDATION (high):** Allowed Domains is a UX guard, not SSRF or exfiltration
containment. A Curiosity renderer needs network-layer destination policy after
DNS resolution, private/link-local/metadata-address denial, redirect
revalidation, protocol restrictions, download/upload bounds, and controlled
egress. Browserbase's external-proxy route can complement—but does not itself
prove—those controls.

### 6.2 Material unknowns

The following were not established by public sources reviewed:

- exact hypervisor/microVM technology, host OS, cloud provider mix, scheduler,
  warm-pool design, image build pipeline, and inter-region failover;
- VM CPU/RAM/disk quotas, noisy-neighbor controls, cold-start distribution,
  crash retry semantics, availability/error-rate SLOs, and backup architecture;
- concrete subnet/firewall rules, DNS controls, cloud metadata blocking,
  privileged browser flags, sandbox layering, or kernel-hardening configuration;
- API-key scopes, service accounts, per-key roles, rotation overlap, audit-log
  export, connect/debug URL lifetime and revocation, or simultaneous-controller
  policy;
- transport/at-rest encryption details for artifacts other than Contexts,
  deletion SLA and backup purge, log redaction, employee/support access, and
  exact data processor/subprocessor path;
- technical validation of SOC 2, HIPAA, penetration-test, residency, or ZDR
  claims; the supporting reports were not publicly inspectable in this pass;
- source, consent model, country-by-country routing, and contractual chain for
  every third-party residential proxy provider;
- correctness of default `ignoreCertificateErrors: true` across all SDK/API
  versions, beyond the current published schema.

## 7. Public APIs and architecture reconstruction

### 7.1 Relevant public API surface

| Purpose | Public operation / shape | Observation |
| --- | --- | --- |
| Session lifecycle | create, list, get, update/release | Finite state plus timestamps, expiry, usage [S1, S19] |
| Browser control | WebSocket CDP; Selenium HTTP + signing material | Standard remote automation protocols [S1, S2] |
| Context | create, get, delete; attach on Session | Persistence is an explicit project object [S3, S4] |
| Live control | `GET .../{id}/debug` | Session- and page-level URLs plus WebSocket [S12] |
| Logs | `GET .../{id}/logs` | CDP/console/network event retrieval [S8] |
| Replay | list pages; get per-page HLS playlist | API-authenticated manifest, signed CDN segments [S11] |
| MP4 rendition | POST enqueue; GET statuses/URLs | Separate asynchronous artifact job [S17] |
| Project usage | usage API and dashboard | Browser minutes, proxy bytes, statuses [S6] |
| Supporting project objects | extensions, uploads/downloads, certificates | Persistent artifacts are outside Session runtime [S7, S19] |

The full v1 OpenAPI also includes newer Agents, Fetch, Search, and Functions
[S19]. They are adjacent products and should not be conflated with the browser
Session contract.

### 7.2 Reconstructed logical architecture

```text
Caller / SDK / REST
        |
        v
API authentication + project lookup + admission/rate limit
        |
        +------> Session metadata/lifecycle control plane
        |             |
        |             v
        |       regional browser provisioner
        |             |
        |             v
        |       [one ephemeral VM]
        |       [one browser/session]
        |       CDP / WebDriver / live-control bridge
        |             |
        |             +--> direct or routed egress
        |                    (managed residential / external / none)
        |
        +------> Context checkpoint store (encrypted persistent profile)
        |
        +------> artifact pipeline
                 logs/events + per-tab video
                 -> HLS/CDN replay
                 -> asynchronous MP4 rendition
                 -> standard storage or enterprise BYOS
```

**INFERENCE (high):** the control plane must perform authentication, project
resolution, regional placement, quota admission, lifecycle tracking, and
credential issuance because those are observable API behaviors [S1, S16].

**INFERENCE (high):** browser I/O is multiplexed into at least three consumers:
the automation connection, Live View, and observability capture. The per-tab
live/replay model implies page identity is tracked independently of the browser
Session [S8, S9, S11].

**INFERENCE (high):** artifact delivery is decoupled from execution: retained
events/video outlive the VM; HLS uses signed CDN segments; MP4 conversion is an
asynchronous job; BYOS changes artifact destination without changing Session
execution [S11, S15, S17].

**INFERENCE (medium):** Context synchronization likely restores an encrypted
profile before launch and checkpoints selected user-data-directory contents on
shutdown. The delay and no-concurrent-use advice support this, but format,
incrementality, and conflict handling are unknown [S3].

**NOT ESTABLISHED:** Browserbase's official Firecracker explainer describes
Firecracker generally but never says its browser fleet runs on it [S21]. No
claim about Firecracker, Kubernetes, AWS, snapshot pools, container layering,
or fleet implementation is adopted here.

## 8. Clean-room lessons and Curiosity implications

### 8.1 Adopt or adapt

| Lesson | Verdict | Curiosity translation |
| --- | --- | --- |
| One untrusted renderer per strong isolation boundary | **ADOPT** | Ephemeral per-job VM/microVM or equivalently reviewed sandbox; never share browser profile/process across unrelated jobs. |
| Explicit Session state and expiry | **ADOPT** | `queued/provisioning/running/terminal`, deadline, termination reason, cost/usage, cancellation. |
| Separate compute, reconnect, persistence, and artifacts | **ADOPT** | Never equate a persisted identity with a reused runtime. |
| Standard browser protocols behind provider adapter | **ADAPT** | Keep provider-neutral render contract; isolate CDP/vendor URL handling in adapter. |
| Finite concurrency plus creation-rate limit | **ADOPT** | Global/per-origin admission; bounded client queue; retry budget honoring `Retry-After`. |
| Default observability with per-job suppression | **ADAPT** | Metadata always; content-bearing logs/video only under explicit retention class. |
| Per-tab live/replay identity | **ADAPT** | Stable page/document/capture IDs and tab lineage; do not use video as canonical evidence. |
| Encrypted profile Context as separate object | **ADAPT** | Only for separately authorized authenticated retrieval; per-principal/per-site, TTL, version, single-writer lease, explicit deletion. |
| Proxy routing by domain | **ADAPT cautiously** | Policy-bound egress route selection, not anti-block evasion; record actual route and failures. |
| Signed short-lived artifact URLs | **ADOPT** | Brokered access, short TTL, no secrets in frontend/model output, revocation where possible. |
| BYOS/ZDR split | **ADAPT** | Storage destination and capture suppression are orthogonal controls. |

### 8.2 Reject or defer

| Product idea | Verdict | Reason |
| --- | --- | --- |
| Browserbase as search/index foundation | **REJECTED** | No owned corpus/ranking/provenance; hosted dependency does not satisfy owned-search decision. |
| Browser rendering on every fetch | **REJECTED** | Higher attack surface, latency, nondeterminism, and cost than static fetch. |
| CAPTCHA solving or stealth as retrieval default | **REJECTED** | Risks bypassing publisher intent and widening authority; not needed for public evidence lane. |
| Long-lived shared login Contexts | **REJECTED** | Credential concentration, cross-task contamination, stale state, and difficult attribution. |
| Browserbase provider selection now | **DEFERRED** | No workload/SLO, privacy review, legal review, benchmark, or approved paid evaluation. |
| Authenticated browser lane | **DEFERRED** | Requires separate caller authority, secret broker, consent model, and audit/retention design. |
| Embedded interactive Live View | **DEFERRED** | Useful for human takeover, but introduces delegated-control authorization and secret-bearing URL risks. |

### 8.3 Minimum provider-neutral render contract

**RECOMMENDATION (high):** if Curiosity later authorizes a dynamic-render lane,
the internal contract should not expose Browserbase terms or credentials. It
should bound and record:

- normalized target URL, allowed redirect count, allowed schemes, resolved
  destination policy, origin budget, and caller-declared purpose;
- total deadline, queue deadline, navigation deadline, byte/DOM/node/tab/
  download limits, and cancellation token;
- region and egress policy, with requested versus observed route separated;
- fresh ephemeral identity by default; separately authorized persistent-state
  reference with version/lease/TTL when required;
- capture policy (`metadata`, `network summary`, `DOM/text`, `screenshot`,
  `video`) and retention class;
- terminal reason, HTTP/navigation trace, final canonical URL candidate,
  extraction version, content hash, timestamps, and partial-failure warnings;
- opaque provider trace ID available only to operators, never to agent output;
- stable errors for admission rejection, provider throttling, DNS/private-IP
  denial, TLS failure, timeout, content limit, challenge/access denial, and
  provider failure.

Rendered DOM, screenshots, logs, headers, and downloaded files remain untrusted
external input. None alone proves authorship, publication time, canonicality,
or claim truth.

## 9. Fact / inference / recommendation ledger

| ID | Type | Claim or decision | Sources | Confidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | A Session is a project-scoped remote browser with CDP/WebDriver connection material and finite lifecycle states. | S1, S2 | High | **ADAPTED** contract lesson |
| L2 | FACT | Contexts persist selected Chromium profile state, are encrypted at rest, and require explicit write-back. | S3, S4 | High | **ADAPTED** |
| L3 | FACT | Context write-back is delayed and same-Context concurrent use is discouraged. | S3 | High | **ADAPTED** as single-writer/versioning requirement |
| L4 | FACT | Managed/custom proxy routes and geographic selection are configured per Session; geolocation is best effort. | S1, S7 | High | **ADAPTED cautiously** |
| L5 | FACT | Session recording/logging default on; live view remains when recording is off. | S1, S9, S10 | High | **ADAPTED** with privacy inversion |
| L6 | FACT | Replay is per tab via HLS and signed six-hour CDN segment URLs; MP4 assembly is separately queued. | S11, S17 | High | **ADAPTED** artifact separation |
| L7 | FACT | Session overload returns 429 and is dropped; no browser waiting queue is documented. | S16 | High | **ADOPTED** explicit backpressure |
| L8 | FACT | Current plans range 3–100 standard concurrent Sessions and 5–50 creates/min; Scale advertises 250+/150+. | S18 | High, date-sensitive | Benchmark only |
| L9 | FACT | Vendor claims one browser per VM/subnet, teardown/no reuse, and no GPU. | S13 | High as vendor claim | **ADOPTED** isolation principle, not implementation claim |
| L10 | FACT | Dashboard roles do not scope API access; API keys do. | S20 | High | **ADAPTED**: add brokered least privilege |
| L11 | FACT | Allowed Domains only covers top-frame HTTP(S) navigation, not subresources, frames, or special schemes. | S14 | High | **REJECTED** as security boundary |
| L12 | INFERENCE | Public behavior implies distinct control, execution, state/artifact, and egress planes. | S1, S3, S7, S11, S13, S17 | High | **ADOPTED** conceptual decomposition |
| L13 | INFERENCE | Contexts resemble encrypted profile checkpoint/restore with asynchronous close-time write-back. | S3, S4 | Medium | **DEFERRED** implementation detail |
| L14 | INFERENCE | Live/connect/replay URLs are sensitive bearer-like capabilities. | S1, S9, S11, S12 | High | **ADOPTED** secret-handling rule |
| L15 | INFERENCE | Firecracker is not established as Browserbase's fleet technology. | S13, S21 | High | **REJECTED** inference |
| L16 | RECOMMENDATION | Use a browser only as a bounded second-lane renderer after static retrieval fails. | This dossier; repository constitution | High | **ADOPTED** architecture recommendation |
| L17 | RECOMMENDATION | Do not use stealth/CAPTCHA solving or TLS-error suppression by default. | S1, S7 | High | **ADOPTED** safety recommendation |
| L18 | RECOMMENDATION | Defer vendor selection until an authorized, privacy-reviewed, paid benchmark exists. | Gaps below | High | **DEFERRED** |

## 10. Unknowns, contradictions, and checks

### 10.1 Contradiction / ambiguity register

| Item | Evidence | Resolution |
| --- | --- | --- |
| Six-hour maximum versus “6+ hrs” Scale | S5 says maximum six hours; S1 schema caps 21,600 s; S18 advertises Scale 6+ hours. | Standard public API/plans: six hours. Enterprise extension is plausible but unspecified. |
| Plan retention versus recording-download source window | S18 gives 7/30/30+ days; S17 says up to 31 days standard and 24 hours BYOS. | Effective availability is plan/config dependent and unknown; use the shorter confirmed account policy. |
| “Zero data retention” wording | S13 loosely equates disabling logs/recording with zero retention; S15 says account ZDR is Enterprise and operational metadata plus separate artifacts remain. | Use S15's narrower definition; per-Session toggles do not erase every data class. |
| “Data residency” versus proxies | S13 ties browser region to residency; S7 says proxy egress may substitute another location. | Compute/artifact residency and public egress location are separate dimensions. |
| Context “unique encryption” versus cipher detail | S3 says uniquely encrypted; S4 says AES-256-CBC and returns public-key/cipher metadata. | Encryption is claimed; full authenticated-encryption/key design remains unknown. |

### 10.2 Checks performed and retained negative results

- Read repository `AGENTS.md`; preserved provider-neutral separation, untrusted
  external-data handling, licensing clarity, and no operational mutation.
- Read the official documentation index and relevant Session, Context, proxy,
  observability, security, concurrency, plan, team, and OpenAPI pages.
- Compared human guides with the OpenAPI create schema and current plan table.
- Checked official Node and Python SDK license files: both were Apache-2.0 at
  the inspected default branches [S22, S23]. This licenses those repositories,
  **not** Browserbase's hosted backend or product design.
- Attempted to retrieve the public Terms and Privacy pages; the text extractor
  returned titles only [S24, S25]. No legal terms were inferred from absent
  text. Legal review remains mandatory before use.
- Trust Center returned no publicly inspectable report text in this pass. SOC,
  HIPAA, and penetration-test statements remain vendor claims [S13].
- No evidence was found for a durable Session admission queue, exact VM
  technology, host orchestration stack, or public SLO.

## 11. Bounded curiosity pass

Scores are 1 (low) to 5 (high). Cost includes access, legal, and safety cost.
Only in-frame public-source follow-ups were eligible.

| Candidate gap | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Distinguish Session overload from artifact queue | 5 | 5 | 4 | 1 | **Pursued:** S16 and S17 establish dropped 429s versus explicit MP4 queue. |
| Resolve retention/ZDR wording | 5 | 5 | 3 | 1 | **Pursued:** S15, S17, S18 reveal separate artifact classes and ambiguity. |
| Verify Allowed Domains as a network boundary | 5 | 5 | 3 | 1 | **Pursued:** S14 proves it is top-frame-only. |
| Identify exact hypervisor from engineering posts | 3 | 2 | 4 | 4 | `CURIOSITY_NO_GO`: S21 discusses Firecracker generally but provides no fleet attribution; further inference would be speculative. |
| Open a free account and test URL/key lifetimes | 3 | 3 | 4 | 4 | `CURIOSITY_NO_GO`: caller prohibited credentials/live tests; no authority. |
| Run paid concurrency/proxy benchmarks | 4 | 4 | 4 | 5 | `CURIOSITY_NO_GO`: prohibited paid testing and no approved workload/SLO. |
| Obtain SOC 2/pen-test/DPA/subprocessor documents | 4 | 5 | 3 | 4 | `CURIOSITY_NO_GO`: gated vendor/legal diligence outside public-source budget; deferred. |
| Probe sandbox, metadata IP, DNS rebinding, or cross-tenant isolation | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO`: intrusive security testing and bypass are outside authority. |
| Reverse engineer proprietary backend/client traffic | 2 | 2 | 5 | 5 | `CURIOSITY_NO_GO`: unnecessary and outside clean-room/access boundaries. |
| Enumerate every proxy provider/site restriction | 2 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: provider lists are undisclosed and mutable; does not change architecture. |

**Stop condition:** requested categories are covered, the highest-value public
contradictions were resolved or bounded, and remaining questions require
credentials, contracts, paid benchmarking, vendor disclosure, or intrusive
testing. Coverage and authority are exhausted.

## 12. Sources

All sources accessed 2026-08-17. Browserbase documentation is a first-party
statement about its current service and may change.

- **[S1]** Browserbase, “Create a Session” OpenAPI reference.
  https://docs.browserbase.com/reference/api/create-a-session
- **[S2]** Browserbase, “Using a browser session.”
  https://docs.browserbase.com/platform/browser/getting-started/using-browser-session
- **[S3]** Browserbase, “Contexts.”
  https://docs.browserbase.com/platform/browser/core-features/contexts
- **[S4]** Browserbase, “Create a Context” OpenAPI reference.
  https://docs.browserbase.com/reference/api/create-a-context
- **[S5]** Browserbase, “Long sessions.”
  https://docs.browserbase.com/platform/browser/long-sessions/overview
- **[S6]** Browserbase, “Manage a browser session.”
  https://docs.browserbase.com/platform/browser/getting-started/manage-browser-session
- **[S7]** Browserbase, “Proxies.”
  https://docs.browserbase.com/platform/identity/proxies
- **[S8]** Browserbase, “Observability.”
  https://docs.browserbase.com/platform/browser/observability/observability
- **[S9]** Browserbase, “Session live view.”
  https://docs.browserbase.com/platform/browser/observability/session-live-view
- **[S10]** Browserbase, “Session recording (rrweb).”
  https://docs.browserbase.com/platform/browser/observability/session-recording
- **[S11]** Browserbase, “Session replay.”
  https://docs.browserbase.com/platform/browser/observability/session-replay
- **[S12]** Browserbase, “Session Live URLs” OpenAPI reference.
  https://docs.browserbase.com/reference/api/session-live-urls
- **[S13]** Browserbase, “Enterprise security.”
  https://docs.browserbase.com/account/enterprise/security
- **[S14]** Browserbase, “Allowed Domains” and “IP allowlisting.”
  https://docs.browserbase.com/platform/browser/security/allowed-domains  
  https://docs.browserbase.com/platform/browser/security/ip-allowlisting
- **[S15]** Browserbase, “Zero data retention (ZDR)” and “Bring your own
  storage (BYOS).”  
  https://docs.browserbase.com/account/enterprise/zero-data-retention  
  https://docs.browserbase.com/account/enterprise/byos-setup-guide
- **[S16]** Browserbase, “Concurrency management.”
  https://docs.browserbase.com/optimizations/concurrency/overview
- **[S17]** Browserbase, “Recording downloads.”
  https://docs.browserbase.com/platform/browser/observability/recording-downloads
- **[S18]** Browserbase, “Plans.”
  https://docs.browserbase.com/account/billing/plans
- **[S19]** Browserbase, v1 OpenAPI specification and API overview.
  https://docs.browserbase.com/reference/api/openapi.v1.yaml  
  https://docs.browserbase.com/reference/api/overview
- **[S20]** Browserbase, “Teams.”
  https://docs.browserbase.com/account/team/roles
- **[S21]** Browserbase, “What is Firecracker? MicroVMs Behind AWS Lambda,”
  2026-05-11. https://browserbase.com/blog/what-is-firecracker/
- **[S22]** Browserbase Node SDK, `LICENSE` (Apache-2.0).
  https://github.com/browserbase/sdk-node/blob/main/LICENSE
- **[S23]** Browserbase Python SDK, `LICENSE` (Apache-2.0).
  https://github.com/browserbase/sdk-python/blob/main/LICENSE
- **[S24]** Browserbase, “Terms of Use” (page title retrieved; body unavailable
  to the text extractor). https://browserbase.com/terms-of-service
- **[S25]** Browserbase, “Privacy Policy” (page title retrieved; body unavailable
  to the text extractor). https://browserbase.com/privacy-policy
