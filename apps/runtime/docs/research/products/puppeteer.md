# Puppeteer for Curiosity's crawler-rendering lane

**Date:** 2026-08-17  
**Product baseline:** Puppeteer documentation version 25.8.0  
**Decision:** what Puppeteer teaches Curiosity about a bounded browser-rendering
lane, and whether it should be adopted as that lane's runtime.  
**Status:** clean-room product research; not an implementation, dependency
approval, benchmark, or deployment record.

## Executive verdict

**ADAPTED, with runtime choice deferred (high confidence):** adopt Puppeteer's
observable browser-lifecycle concepts in Curiosity's provider-neutral render
contract: pinned browser/runtime identity, one fresh browser context per job,
explicit protocol and readiness policy, request/redirect accounting, bounded
page evaluation, and deterministic cleanup. Puppeteer is a credible candidate
for a Chrome-first rendering adapter, especially when direct CDP access is
useful. Do **not** yet adopt it as Curiosity's sole or permanent renderer.

Puppeteer's strongest crawler-relevant path is Chrome over CDP. Firefox uses
WebDriver BiDi by default, while Chrome still defaults to CDP because Puppeteer
documents material BiDi feature gaps—including response-body access, raw CDP
sessions, service-worker bypass, network-condition emulation, metrics, tracing,
and some security details [P3]. That makes a single protocol-neutral behavior
claim unsafe today. Puppeteer supports Chrome and stable Firefox, but not
WebKit; Playwright officially spans Chromium, Firefox, and WebKit [P4, W1].

The render lane remains **selective and deferred** in the wider owned-search
architecture. Static HTTP fetch should stay first. A browser processes hostile
active content, is not the system of record for transport bytes, and must not
gain ambient credentials, private-network reachability, unrestricted downloads,
or cross-job state. Network-idle is only a heuristic: Puppeteer's navigation
events define fixed connection-count windows, which long polling, service
workers, streaming, and background activity can defeat [P9]. Curiosity should
therefore decide success by an owned, bounded readiness policy and record why
rendering added value.

## 1. Frame, method, and confidence

### 1.1 Bounded sub-questions

1. What is Puppeteer's browser/process/context/page lifecycle?
2. Where do CDP and WebDriver BiDi differ materially for crawling?
3. How do interception, execution contexts, navigation, timeouts, and downloads
   behave?
4. What isolation, security, capacity, and operations consequences follow?
5. Which Playwright differences could change a crawler decision?
6. What may Curiosity adopt, adapt, reject, or defer without copying code?

**Depth budget:** official documentation and license analysis at architecture
depth. No package installation, live browser run, source-code inspection,
performance benchmark, exploit test, cloud sizing, or legal opinion.

**Method:** first-party Puppeteer API/guides and upstream license were primary.
Official Playwright documentation was used only for bounded crawler-relevant
contrast, not a full Playwright evaluation. Vendor documentation establishes
documented behavior, not comparative reliability or performance. All web
sources were accessed 2026-08-17.

Labels:

- **FACT** — directly supported by cited official material.
- **INFERENCE** — architecture conclusion from facts; not measured here.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Product and lifecycle model

### 2.1 Package and browser supply

**FACT (high):** Puppeteer normally launches a browser or connects to an
already-running browser. Closing terminates a Puppeteer-launched browser;
disconnecting leaves the remote browser and pages running [P1]. The full
`puppeteer` package downloads a specific Chrome version by default; its
configuration can also download Firefox. `puppeteer-core` ignores Puppeteer
configuration files and environment variables [P15].

**FACT (high):** since Puppeteer 20, the default Chrome artifact is Chrome for
Testing. Since Puppeteer 23, stable Firefox is supported. The documentation
publishes Puppeteer-to-browser version mappings and says the immediately prior
listed mapping applies when an exact Puppeteer release is absent [P4].

**INFERENCE (high):** the package is both an automation API and, unless
separated deliberately, a browser-artifact supply mechanism. Curiosity must pin
and attest the Puppeteer package, browser artifact, container/base image, OS
libraries, and protocol mode independently. A package lock alone does not
identify the actual renderer.

### 2.2 Resource hierarchy and ownership

```text
worker / job supervisor
  -> browser process (launch or controlled remote connection)
      -> browser context (job isolation boundary)
          -> page / popup / child frames / workers
              -> protocol sessions and remote JS handles
```

**FACT (high):** every launched browser has a default context; additional
contexts have isolated cookies, local storage, and related storage. Closing a
non-default context closes its pages; the default context cannot be closed.
Popups inherit the parent's context [P1, P5].

**INFERENCE (high):** a browser context is a useful *state-isolation primitive*,
not a hostile-code security boundary. All contexts still inhabit one browser
process tree and host/container security envelope. A browser or renderer crash
can affect multiple colocated jobs; shared process compromise risk cannot be
treated as eliminated by incognito contexts.

**RECOMMENDATION (high):** use one newly created non-default context per render
job and close it in a mandatory finalizer. Rotate the entire browser after a
bounded job count, age, memory threshold, protocol fault, renderer crash, or
policy violation. Never place crawl jobs in the default context or use a
persistent user-data directory for routine crawling.

### 2.3 Launch versus connect

**FACT (high):** Puppeteer supports connecting through a browser WebSocket
endpoint, and disconnect differs from browser close [P1].

**INFERENCE (high):** remote connection separates control-plane and browser
lifecycles but introduces endpoint authentication, tenant binding, transport
confidentiality, orphan cleanup, version negotiation, and confused-deputy
risks. An exposed debugging endpoint is effectively browser control authority.

**RECOMMENDATION (high):** prefer a local sidecar or same-job browser initially.
If remote browsers are later used, require authenticated private transport,
single-job leases, server-enforced egress policy, exact version/protocol
handshake, lease expiry, and server-side kill. Never accept a browser endpoint
from page content or an untrusted caller.

## 3. CDP and WebDriver BiDi

### 3.1 Documented protocol split

**FACT (high):** Puppeteer describes WebDriver BiDi as an evolving
cross-browser, bidirectional protocol. Firefox launches with BiDi by default.
Chrome launches with CDP by default because not all CDP-backed features are
supported over BiDi; unsupported calls raise `UnsupportedOperation` [P3].

**FACT (high):** both protocols support core navigation, script evaluation,
selectors, cookies, permissions, and request interception, subject to listed
parameter gaps [P3]. Chrome/CDP additionally exposes a page-attached raw CDP
session through Puppeteer [P11].

### 3.2 Material crawler gaps in Puppeteer's BiDi backend

The official unsupported list is version-specific and should be rechecked on
every upgrade. At 25.8.0 it includes [P3]:

| Gap over BiDi | Crawler consequence |
| --- | --- |
| `HTTPResponse.buffer/content/text` | Cannot assume Puppeteer's common API can capture response bodies equally across protocols. |
| `HTTPResponse.securityDetails` | TLS/security metadata parity is absent. |
| `HTTPResponse.fromServiceWorker` | Provenance of service-worker-served content is weaker. |
| `HTTPRequest.resourceType` | Resource-class filtering cannot be assumed portable. |
| `Page.createCDPSession` | Chrome-specific low-level escape hatch is unavailable by definition. |
| service-worker bypass controls | Interception and reproducibility differ for worker-controlled requests. |
| offline/network-condition emulation | Mostly testing concerns, but evidence of backend asymmetry. |
| metrics, coverage, tracing | Diagnostics and leak investigation differ. |

**INFERENCE (high):** “same Puppeteer API” does not imply same evidence surface.
A renderer contract must advertise capabilities and partial evidence, not hide
protocol differences behind one success boolean.

**RECOMMENDATION (high):** if Puppeteer is piloted, constrain the first adapter
to pinned Chrome for Testing over CDP. Treat Firefox/BiDi as a separate adapter
capability profile and evaluation cell. Keep raw CDP use inside the adapter;
never leak CDP method names or Puppeteer classes into Curiosity's neutral domain
contract.

**DEFERRED (medium):** cross-browser rendering. It is valuable only if a judged
corpus shows material content or compatibility gain. Browser diversity should
not be purchased speculatively at the cost of weaker capture parity.

## 4. Network interception and evidence capture

### 4.1 Interception semantics

**FACT (high):** once Puppeteer request interception is enabled, every request
stalls until continued, responded to, or aborted [P6]. Multiple handlers can
race. Puppeteer requires synchronous checking of whether a request has already
been resolved before resolving it. Its cooperative mode awaits handlers and
uses priorities, but one legacy resolution without priority causes immediate
legacy behavior [P6].

**INFERENCE (high):** interception is a synchronous policy chokepoint on the
page's critical path. Slow DNS/policy lookups or handler composition can create
head-of-line blocking, navigation timeouts, contradictory decisions, and
unbounded pending requests. Third-party plugins that add handlers enlarge the
trusted computing base.

**RECOMMENDATION (high):** use one project-owned interception coordinator per
page/context, with a deterministic precedence order and a fail-closed deadline.
Precompute policy where possible. No crawler plugin may register an independent
request resolver. Record one terminal decision per request: allow, block,
synthetic response, redirect-policy failure, byte/type limit, or deadline.

### 4.2 What interception must enforce

Puppeteer supplies mechanics, not Curiosity's crawl policy. The adapter still
needs to enforce:

- allowed schemes and ports; block `file:`, browser-internal, extension, and
  other non-public schemes;
- DNS resolution plus private/link-local/loopback/metadata-address denial on
  every connection and redirect, including rebinding defenses;
- redirect count, request count, host count, total transferred bytes, response
  bytes, decompression ratio, wall time, and browser CPU/memory limits;
- robots and corpus-policy decision before navigation, with a stable policy ID;
- no ambient proxy, cloud, filesystem, cookie, client-certificate, or host
  credential inheritance;
- a strict subresource policy, while recognizing that blocking scripts/images
  can change the rendered document and must be recorded as a rendering profile.

**INFERENCE (high):** request interception alone is insufficient for hard SSRF
control if enforcement happens only after the browser has resolved or initiated
network activity. The browser must also sit behind a network namespace or
egress proxy that independently denies private destinations.

### 4.3 Browser output is not transport truth

**FACT (high):** `Page.goto` resolves to the final main-resource response after
redirects, or `null` for cases such as `about:blank` and same-document hash
navigation. Valid HTTP error statuses do not necessarily cause navigation to
throw; callers must inspect status [P7].

**INFERENCE (high):** DOM serialization is a post-execution view, not an
immutable HTTP capture. It omits or transforms transport details and may include
content synthesized by scripts, extensions, service workers, or browser state.

**RECOMMENDATION (high):** preserve the static fetch/WARC as primary transport
evidence. Link rendered artifacts to it using a render record containing final
URL, redirect observations, request decisions, browser/protocol/version,
readiness reason, DOM/text/screenshot hashes where retained, and policy profile.
Never overwrite raw capture with `page.content()` output.

## 5. Execution contexts and hostile JavaScript

### 5.1 Evaluation model

**FACT (high):** a function passed to Puppeteer evaluation is serialized and
run in the target page context; it cannot use controller-scope variables unless
passed explicitly. Primitive and serializable values cross back by value;
objects such as DOM nodes require remote handles. Promises are awaited [P2].

**FACT (high):** `evaluateOnNewDocument` runs after a document is created but
before page scripts, for navigations and newly attached/navigated child frames
[P10].

**INFERENCE (high):** evaluation crosses a trust boundary in both directions.
The controller sends code into adversarial state and receives attacker-shaped
objects/strings. Remote handles retain browser-side objects and can become a
memory leak. Pre-document scripts mutate the evidence environment and can
change site behavior or detection outcomes.

**RECOMMENDATION (high):** allow only versioned, project-owned extraction
functions selected by policy—never arbitrary caller or page-provided code.
Return small JSON-like values under depth, item-count, string, and total-byte
limits; avoid handles except inside a tightly scoped extraction operation and
dispose them deterministically. Do not expose privileged Node callbacks into the
page. Hash and record every initialization/extraction script version.

### 5.2 Frames, worlds, and provenance

**FACT (high):** initialization applies to child frames as well as the main
document [P10]. Puppeteer's model also exposes pages, frames, workers, and
targets [P5].

**INFERENCE (medium):** extracted text without frame origin loses security and
provenance information. Cross-origin iframe content, ads, widgets, and embedded
documents should not silently merge into the publisher's main-document claim.

**RECOMMENDATION (high):** default extraction to the main frame. If child-frame
content is retained, attach frame URL, origin, parent relation, sandbox flags,
and extraction reason. Do not follow popups or new targets unless the render
profile explicitly permits them; otherwise close and record them.

## 6. Navigation, readiness, cancellation, and timeouts

### 6.1 Built-in waiting behavior

**FACT (high):** Puppeteer's generic navigation wait defaults to `load` and
30 seconds. It accepts an `AbortSignal`; setting timeout to zero disables the
timeout [P8]. Lifecycle choices are `load`, `domcontentloaded`, `networkidle0`
(zero connections for at least 500 ms), and `networkidle2` (no more than two
connections for at least 500 ms) [P9]. A separate `waitForNetworkIdle` always
waits at least its configured idle interval [P12].

**INFERENCE (high):** no built-in lifecycle event means “crawler extraction is
complete.” `DOMContentLoaded` may be early; `load` may wait on irrelevant
resources; network idle may never arrive or may arrive before delayed rendering.
Disabling timeouts is incompatible with bounded crawling.

### 6.2 Owned readiness policy

**RECOMMENDATION (high):** define readiness outside Puppeteer as a bounded race:

1. start a hard wall-clock deadline before browser acquisition;
2. navigate and require an allowed final URL plus acceptable main-response
   status/type;
3. wait for a conservative baseline event such as `DOMContentLoaded`;
4. optionally wait for a short quiet window or a site/profile-specific content
   predicate, never beyond the hard deadline;
5. sample DOM/text stability only a bounded number of times;
6. extract once, record the terminal reason, cancel pending waits, and close.

Terminal reasons should distinguish `ready`, `deadline_partial`, `navigation
error`, `policy_block`, `resource_budget`, `browser_crash`, `protocol_error`,
and `cancelled`. A partial artifact is not a full success.

**RECOMMENDATION (high):** maintain separate bounded timers for queue wait,
browser acquisition, navigation, readiness, extraction, artifact upload, and
cleanup, all nested under one job deadline. Never set zero/unlimited timeouts.
On cancellation, abort Puppeteer waits, close the page/context, and escalate to
browser kill if teardown misses its own short deadline.

## 7. Downloads

**FACT (high):** Puppeteer's documented download behavior can allow, deny, or
use default behavior. Allowed downloads require a path; `allowAndName` names
files by download GUID [P13]. Its top-level documentation here exposes policy
configuration rather than a Playwright-like first-class download lifecycle.

**FACT (high, comparison):** Playwright emits a `Download` object for every
attachment, provides URL/name/stream/save operations, stores downloads in a
temporary folder, and deletes them when the producing context closes [W3].

**INFERENCE (high):** browser downloads are a separate untrusted file-ingestion
channel. They complicate byte limits, completion detection, MIME validation,
malware scanning, path safety, cleanup, and provenance. Puppeteer's documented
abstraction is less crawler-convenient than Playwright's event/object model.

**RECOMMENDATION (high):** deny all browser downloads in the initial render
lane. If a navigation turns into an attachment, return a typed outcome and let
the static fetch pipeline handle it under its byte/type policy. Any future
download feature needs an isolated quota-limited directory, no execution,
streaming size enforcement, content-type and magic-byte checks, malware policy,
hash/provenance, and deletion on job completion.

## 8. Isolation and security posture

### 8.1 Sandbox and container boundary

**FACT (high):** Puppeteer strongly discourages Chrome's `--no-sandbox` and
states that the recommended operation uses sandboxes [P16]. The official Docker
image includes Chrome for Testing, dependencies, and Puppeteer; its documented
sandboxed invocation requires `SYS_ADMIN`, and an init process is required for
proper child-process management [P14].

**INFERENCE (high):** the official image is a useful reproducibility reference,
not an automatically acceptable production security profile. Broad
`SYS_ADMIN` is a material container privilege. Browser sandbox, container
isolation, and network egress policy are independent layers; weakening one
because another exists is unsafe.

**RECOMMENDATION (high):** security engineering must choose and validate a
deployment-specific sandbox profile that keeps Chrome's sandbox enabled without
granting the crawler service broad host authority. Run rootless/non-privileged
where feasible, read-only root filesystem, writable per-job temp only, seccomp/
LSM controls, no host mounts or container socket, no inbound browser endpoint,
and forced egress through a policy gate. Treat inability to keep a tested
sandbox as a **STOP**, not justification for `--no-sandbox`.

### 8.2 State and authority minimization

Contexts isolate browser storage [P1, P5], but Curiosity should additionally:

- start without cookies, local/session storage, cache, permissions, service
  worker state, client certificates, or authentication;
- deny geolocation, notifications, camera, microphone, clipboard, MIDI, USB,
  Bluetooth, serial, filesystem, and persistent-storage permissions;
- never inject secrets, bearer tokens, crawler-control endpoints, or internal
  headers into page-visible state;
- disable extensions and development conveniences unless a reviewed profile
  requires them;
- cap console/error text and sanitize it before logs or agent-visible output;
- treat DOM, accessibility trees, screenshots, URLs, headers, console messages,
  and exceptions as untrusted external data;
- patch browser security updates promptly while preserving a rollback-capable
  compatibility lane and immutable version evidence.

## 9. Scale, reliability, and operations

### 9.1 Capacity model

No official source reviewed provides a safe universal “pages per browser” or
concurrency number. Capacity depends on page behavior, browser build, CPU,
memory, renderer processes, interception, artifact mix, fonts, and readiness
policy.

**RECOMMENDATION (high):** size from measured pilot distributions:

- queue delay and browser acquisition/startup latency;
- wall time and browser-seconds per terminal reason;
- peak resident memory, CPU-seconds, process count, file descriptors, temp
  bytes, and network bytes per job;
- request/redirect/host counts and blocked-policy events;
- crash, disconnect, timeout, forced-kill, orphan, and cleanup-failure rates;
- extraction yield and incremental information over static fetch;
- duplicate rendering and render-cache hit rate by capture/version/profile.

Use admission control from actual memory/CPU headroom, not fixed high
concurrency. Apply per-tenant, per-host, and global queues; rendering must share
the crawler's host politeness budget rather than opening a second uncoordinated
fetch channel.

### 9.2 Pooling trade-off

**INFERENCE (high):** browser reuse amortizes startup cost but increases blast
radius and leak accumulation; one browser per page maximizes isolation but can
make startup dominant. Context-per-job within a short-lived bounded browser is
the reasonable pilot midpoint, subject to measurement.

**RECOMMENDATION (high):** browser pool state should be explicit: starting,
healthy, draining, suspect, and dead. A context is never returned to the pool.
Drain after threshold or anomaly. Health checks must not browse arbitrary
external sites. Supervisor ownership—not request handlers—must reap browser
process trees and orphan temp directories.

### 9.3 Browser and artifact management

**FACT (high):** Puppeteer caches downloaded browsers globally by default and
supports configuration of cache/download behavior; blocked install scripts may
require an explicit browser-install step [P15, P16]. Linux launch requires a
compatible set of shared libraries, and official troubleshooting notes no
default Chrome Linux arm64 binaries at the time documented [P16].

**RECOMMENDATION (high):** never download browsers at production startup or job
time. Build from reviewed immutable artifacts, verify digest/signature where
available, inventory transitive licenses, scan browser and image CVEs, pin fonts
and locale data, and canary every browser/Puppeteer upgrade against a frozen
authorized corpus. Record actual executable version at runtime.

## 10. Crawler-relevant Playwright contrast

This is deliberately narrow; it does not replace a separate Playwright study or
benchmark.

| Dimension | Puppeteer 25.8.0 | Official Playwright behavior | Decision relevance |
| --- | --- | --- | --- |
| Browser breadth | Chrome and stable Firefox; Chrome/CDP default, Firefox/BiDi default [P3, P4] | Chromium, patched Firefox, and patched WebKit; branded Chrome/Edge options [W1] | Playwright has broader engine coverage; only valuable if corpus tests show gain. |
| Protocol posture | Publicly exposes CDP sessions; documents BiDi feature parity gaps [P3, P11] | Public CDP session API exists for Chromium [W6] | Both permit low-level Chromium escape hatches; Puppeteer makes protocol split central. |
| Context isolation | Explicit isolated storage and closable non-default contexts [P1, P5] | Context-per-test is a first-class documented model [W2] | Conceptually similar for adapter design; neither proves hostile-code containment. |
| Interception | Global page interception stalls every request; multiple-handler resolution has legacy/cooperative complexity [P6] | Page- and context-level routes; context routing applies to popups/opened links; service workers can hide events [W4] | Playwright's context routing is crawler-convenient; both require one owned policy coordinator. |
| Downloads | Policy/path configuration [P13] | First-class download event/object, stream/save lifecycle, context cleanup [W3] | Playwright is materially clearer if downloads are ever authorized; initial Curiosity policy denies both. |
| Readiness | `load`, DOMContentLoaded, networkidle0/2 with documented 500 ms semantics [P8, P9] | Load-state API exists, but product defaults still do not define crawler completeness [W5] | Curiosity needs an owned readiness contract regardless of runtime. |
| Test ergonomics | Automation library with locators and browser APIs | Broader test runner, auto-waiting, projects, traces, multi-language support | Mostly irrelevant to a backend crawler; avoid selecting on test-runner features. |

**INFERENCE (medium):** Puppeteer is the smaller conceptual fit for a
Chrome-first Node adapter with deliberate CDP use. Playwright appears stronger
when browser-engine breadth, context-wide routing, and download lifecycle are
requirements. No performance, stability, memory, or extraction-quality winner
can be claimed without a controlled benchmark.

## 11. Provider-neutral Curiosity contract lessons

The neutral contract should model rendering outcomes, not Puppeteer objects.

### Request concepts

- capture/document reference and policy-decision reference;
- requested render profile and capability requirements;
- exact total deadline and budgets for requests, redirects, hosts, bytes,
  browser-seconds, CPU/memory class, frames, popups, and output sizes;
- locale, timezone, viewport, user-agent class, and JavaScript policy;
- readiness policy ID and extraction policy ID;
- no credentials, executable path, debugging endpoint, CDP command, or arbitrary
  script supplied by callers.

### Response concepts

- `completed`, `partial`, `blocked`, `failed`, or `cancelled` plus stable reason;
- adapter/runtime/browser/protocol versions and immutable render-profile ID;
- start/end timestamps and phase timings;
- requested, initial, redirect-terminal, and main-frame URLs;
- main response status/type and bounded redirect/request decision summaries;
- readiness event/reason and budget consumption;
- artifact references plus hashes, sizes, media types, and retention class;
- frame-qualified extracted passages and provenance;
- warnings for service workers, blocked resources, popups, downloads, protocol
  capability gaps, truncation, and cleanup escalation;
- trust marker `untrusted-external-evidence`.

**RECOMMENDATION (high):** define a renderer capability handshake so adapters
can report `response_body`, `tls_details`, `service_worker_provenance`,
`download_events`, `browser_engine`, and `protocol`. Reject jobs whose mandatory
capabilities are absent rather than silently degrading.

## 12. Verification plan and gates

Before choosing a runtime, run Puppeteer and Playwright adapters against the
same project-owned or explicitly authorized fixture corpus. Include:

1. static page, client-rendered page, delayed hydration, SPA route change;
2. redirect chains, loops, HTTP errors, TLS errors, auth prompts;
3. long polling, WebSocket, event stream, never-idle analytics;
4. service-worker interception and cache variants;
5. cross-origin and sandboxed frames, popup storms, worker storms;
6. download/attachment, oversized response, decompression bomb fixture;
7. DNS rebinding simulation and every private/metadata address class;
8. infinite DOM growth, CPU loop, memory pressure, renderer/browser crash;
9. malformed markup, hostile console strings, prompt-injection content;
10. cancellation during acquisition, navigation, readiness, extraction, and
    artifact persistence.

Measure extraction correctness and incremental yield over static fetch, not
just navigation success. Also compare p50/p95/p99 wall time, CPU, peak memory,
bytes, crash/kill/cleanup rates, and protocol-specific evidence completeness.

### Pilot GO gates

- zero fixture escapes to denied network destinations;
- Chrome sandbox remains enabled under the reviewed deployment profile;
- every job ends with context/process/temp cleanup or a recorded forced kill;
- hard budgets terminate adversarial fixtures predictably;
- rendered evidence links to immutable static capture and exact runtime profile;
- rendering produces predeclared incremental extraction gains on the judged
  render-needed set at an accepted marginal cost;
- adapter conformance tests prove no Puppeteer/CDP types leak into the neutral
  contract.

### STOP / rollback gates

- operation requires `--no-sandbox` or unacceptable host/container privilege;
- private-network defense depends only on page-level interception;
- browser downloads or runtime browser fetching cannot be disabled;
- orphan/leak rate cannot be bounded by supervisor recycling;
- protocol/backend differences are silently represented as equivalent evidence;
- rendering does not materially improve accepted-document or passage yield over
  static fetch;
- upgrade cadence cannot meet browser security response requirements.

## 13. Verdict ledger

| Item | Verdict | Confidence / rationale |
| --- | --- | --- |
| Static fetch before render | **ADOPTED** | High; browser output is expensive active-content evidence, not transport truth. |
| Puppeteer concepts in neutral contract | **ADAPTED** | High; lifecycle, context, protocol, wait, and cleanup concepts are useful without coupling. |
| Puppeteer as permanent sole renderer | **DEFERRED** | High; no controlled benchmark and material cross-browser/protocol gaps remain. |
| Puppeteer Chrome/CDP pilot | **DEFERRED candidate** | High; strongest documented feature surface, pending security and value gates. |
| Firefox/BiDi parity | **REJECTED as assumption** | High; official unsupported list is materially crawler-relevant [P3]. |
| One fresh context per job | **ADOPTED** | High; useful state isolation with explicit limitation as a security boundary. |
| Bounded browser reuse | **ADAPTED** | Medium; plausible startup/isolation compromise, must be measured. |
| Network idle as success | **REJECTED** | High; fixed connection heuristic is not content completeness [P9]. |
| Arbitrary page evaluation | **REJECTED** | High; expands authority and hostile-code boundary. |
| Browser downloads initially | **REJECTED** | High; unnecessary ingestion path and weaker Puppeteer lifecycle abstraction. |
| Raw CDP in neutral domain | **REJECTED** | High; adapter-specific and Chrome-bound. |
| Raw CDP inside adapter | **ADAPTED sparingly** | Medium; useful for missing evidence, but increases version coupling. |
| `--no-sandbox` | **REJECTED** | High; upstream strongly discourages it [P16]. |
| Official Puppeteer Docker image unchanged | **DEFERRED** | High; documented `SYS_ADMIN` requirement needs independent security review [P14]. |
| Playwright runtime | **DEFERRED comparator** | Medium; broader engines/routing/download ergonomics, no measured crawler winner. |
| Apache-2.0 source reuse | **DEFERRED to dependency review** | High; permissive does not mean project-owned or obligation-free. |

## 14. Unknowns and negative results

### Material unknowns

- Real extraction gain and cost on Curiosity's authorized corpus.
- Peak safe density, browser recycling threshold, and leak/crash distribution.
- Exact network events and body-capture parity under service workers, cache,
  redirects, streaming, and Puppeteer BiDi in the chosen release.
- Whether the deployment platform can preserve browser sandboxing with an
  acceptable container capability profile.
- Required initial browser engines, locales, fonts, codecs, and accessibility
  artifacts.
- Browser security patch SLA and rollback ownership.
- Retention and privacy policy for screenshots, DOM, console, and request URLs.
- Whether strict “wholly owned” permits Puppeteer/Playwright as third-party
  runtime dependencies at all.

### Negative source results retained

- No official Puppeteer source reviewed provides production concurrency,
  memory-per-page, pages-per-browser, or browser-recycle guarantees.
- No official evidence reviewed establishes Puppeteer as faster, safer, more
  stable, or more extraction-accurate than Playwright.
- No Puppeteer guarantee was found that browser contexts are a security sandbox
  against hostile pages; documentation establishes storage isolation.
- No built-in readiness event was found that establishes semantic content
  completeness for crawling.
- `https://pptr.dev/guides/webdriver-bidi` and
  `https://pptr.dev/guides/downloads` returned 404; the valid BiDi page was
  `/webdriver-bidi`, while download behavior was documented in the API.
- Search discovery hit HTTP 429 during research; direct official-source access
  succeeded. No search snippet was used as evidence.

## 15. Curiosity pass and stop decision

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify whether Firefox/BiDi can return response bodies | 5 | 5 | 4 | 1 | **Pursued:** official unsupported list says Puppeteer response body methods are unavailable over BiDi [P3]. |
| Verify download lifecycle contrast | 4 | 4 | 3 | 1 | **Pursued:** Puppeteer documents policy/path; Playwright documents event/object/stream and context cleanup [P13, W3]. |
| Verify sandbox/container contradiction | 5 | 5 | 4 | 1 | **Pursued:** official image documents sandbox mode plus `SYS_ADMIN`; upstream separately strongly discourages `--no-sandbox` [P14, P16]. |
| Benchmark both runtimes live | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: no authorized fixture plan or implementation authority in this research task. |
| Inspect internal protocol mapper source | 3 | 3 | 4 | 4 | `CURIOSITY_NO_GO`: public behavior documentation is sufficient for architecture decision; source inspection adds clean-room contamination risk. |
| Compare every automation library | 2 | 2 | 2 | 5 | `CURIOSITY_NO_GO`: outside Puppeteer-versus-Playwright frame and unlikely to change selective-render architecture. |
| Design exact Kubernetes sandbox profile | 4 | 5 | 3 | 5 | `CURIOSITY_NO_GO`: deployment platform and security authority are undeclared. |
| Determine jurisdiction-specific legality of executing page scripts | 4 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: legal advice outside authority; requires counsel and corpus/jurisdiction frame. |

**Coverage:** lifecycle, protocols, interception, execution, navigation/timeouts,
downloads, isolation/security, scale/operations, Playwright differences,
licensing, contract lessons, verification, recommendations, confidence, and
unknowns are covered.

**Saturation:** additional official API pages repeated the same lifecycle and
capability model rather than changing the verdict. **Stop:** coverage and
saturation reached. Runtime selection remains deliberately deferred until a
separately authorized security review and controlled benchmark.

## 16. Licensing and clean-room boundary

**FACT (high):** Puppeteer's upstream repository license is Apache License 2.0,
with a Google copyright notice [P17]. Playwright is also Apache License 2.0 and
its license records Microsoft and Google portions [W7]. Apache-2.0 grants
copyright and contributor patent licenses subject to conditions including
license delivery, modified-file notices, retention of relevant notices, and
NOTICE handling when applicable; it does not grant trademark permission beyond
customary descriptive use [P17, W7].

**RECOMMENDATION (high):** this report may adapt publicly documented concepts
and independently specify Curiosity behavior. It must not be used to represent
Puppeteer, Chrome, or Playwright code as Curiosity-owned code. Any runtime,
container, copied sample, transitive package, browser binary, codec, or font
requires a version-specific dependency/license/security ledger. The Chrome and
Firefox browser distributions have licenses distinct from Puppeteer's package;
Apache-2.0 on Puppeteer does not license all bundled artifacts.

No source code was inspected or copied for this report. Official documentation
examples were read to understand public behavior but are not reproduced here.
If strict ownership excludes third-party runtime libraries, use this functional
analysis only as a clean-room behavioral specification and benchmark plan.

## 17. Official sources

All accessed 2026-08-17. Puppeteer pages displayed documentation version 25.8.0.

1. **[P1] Puppeteer, Browser management.**
   https://pptr.dev/guides/browser-management — launch/connect/close/disconnect
   and context isolation.
2. **[P2] Puppeteer, JavaScript execution.**
   https://pptr.dev/guides/javascript-execution — page-context serialization,
   return values, handles, promises, and arguments.
3. **[P3] Puppeteer, WebDriver BiDi support.**
   https://pptr.dev/webdriver-bidi — protocol defaults and version-specific
   supported/unsupported feature lists.
4. **[P4] Puppeteer, Supported browsers.**
   https://pptr.dev/supported-browsers — Chrome for Testing, stable Firefox,
   headless-shell distinction, and version mapping.
5. **[P5] Puppeteer, BrowserContext API.**
   https://pptr.dev/api/puppeteer.browsercontext — context storage, popup
   ownership, pages/targets, and closure semantics.
6. **[P6] Puppeteer, Request Interception.**
   https://pptr.dev/guides/network-interception — stalled requests,
   multiple-handler races, and cooperative/legacy resolution.
7. **[P7] Puppeteer, Page.goto.**
   https://pptr.dev/api/puppeteer.page.goto — redirects, response/null return,
   and HTTP-status behavior.
8. **[P8] Puppeteer, WaitForOptions.**
   https://pptr.dev/api/puppeteer.waitforoptions — default timeout/load event,
   abort signal, and wait arrays.
9. **[P9] Puppeteer, PuppeteerLifeCycleEvent.**
   https://pptr.dev/api/puppeteer.puppeteerlifecycleevent — exact
   DOM/load/network-idle definitions.
10. **[P10] Puppeteer, Page.evaluateOnNewDocument.**
    https://pptr.dev/api/puppeteer.page.evaluateonnewdocument — pre-page-script
    initialization across navigation and child frames.
11. **[P11] Puppeteer, Page.createCDPSession.**
    https://pptr.dev/api/puppeteer.page.createcdpsession — raw page-attached CDP
    session.
12. **[P12] Puppeteer, Page.waitForNetworkIdle.**
    https://pptr.dev/api/puppeteer.page.waitfornetworkidle — explicit idle wait
    and minimum idle interval.
13. **[P13] Puppeteer, DownloadBehavior.**
    https://pptr.dev/api/puppeteer.downloadbehavior — deny/allow/default policy,
    destination path, and GUID naming.
14. **[P14] Puppeteer, Docker.**
    https://pptr.dev/guides/docker — official image contents, sandbox mode,
    `SYS_ADMIN`, and init-process requirement.
15. **[P15] Puppeteer, Configuration.**
    https://pptr.dev/guides/configuration — pinned default Chrome, multiple
    browser downloads, cache, proxy, and `puppeteer-core` boundary.
16. **[P16] Puppeteer, Troubleshooting.**
    https://pptr.dev/troubleshooting — sandbox warning, Linux dependencies,
    cache/install behavior, architecture limits, and process cleanup guidance.
17. **[P17] Puppeteer upstream LICENSE.**
    https://github.com/puppeteer/puppeteer/blob/main/LICENSE — Apache License
    2.0 and upstream notice.
18. **[W1] Playwright, Browsers.**
    https://playwright.dev/docs/browsers — Chromium/Firefox/WebKit coverage,
    artifact management, branded channels, and patched-browser boundaries.
19. **[W2] Playwright, Isolation.**
    https://playwright.dev/docs/browser-contexts — context-per-test isolation
    model.
20. **[W3] Playwright, Downloads.**
    https://playwright.dev/docs/downloads — download event/object, temporary
    storage, streams/save, and context cleanup.
21. **[W4] Playwright, Network.**
    https://playwright.dev/docs/network — page/context routes, traffic mutation,
    WebSockets, and service-worker caveat.
22. **[W5] Playwright, Page API (`waitForLoadState`).**
    https://playwright.dev/docs/api/class-page#page-wait-for-load-state —
    official load-state behavior used only for bounded contrast.
23. **[W6] Playwright, CDPSession.**
    https://playwright.dev/docs/api/class-cdpsession — raw Chromium CDP methods
    and events.
24. **[W7] Playwright upstream LICENSE.**
    https://github.com/microsoft/playwright/blob/main/LICENSE — Apache License
    2.0 and upstream notices.
