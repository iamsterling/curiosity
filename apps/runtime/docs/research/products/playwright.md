# Playwright as a browser-rendering control plane

**Date:** 2026-08-17  
**Official sources accessed:** 2026-08-17  
**Status:** clean-room product research; not an implementation, dependency
approval, deployment record, or security certification.  
**Decision:** what Curiosity should learn from, and whether it should depend on,
Playwright for the bounded rendering lane of owned public-web retrieval.

## Executive verdict

**ADAPTED / DEFERRED (high confidence):** Playwright is a strong candidate for a
replaceable browser-control adapter, but it is not a crawler scheduler, network
security boundary, resource governor, evidence archive, or hostile-content
sandbox. Its useful abstraction is the hierarchy `browser -> isolated context
-> page`, with context-wide interception, event streams, explicit closure, and
traceable operations. Curiosity should adapt that lifecycle while placing it
inside a stricter supervisor and network sandbox.

Do not make Playwright the provider-neutral retrieval contract. Keep static
fetch as the default lane and invoke rendering only after a typed quality rule
requires it. Start every render attempt in fresh disposable state; apply
redirect-aware egress policy outside the browser; bound wall time, requests,
bytes, DOM/output, downloads, child pages, CPU and memory; and preserve a
separate immutable capture/evidence record. Playwright's own timeouts and test
isolation do not supply those controls.

**Dependency verdict — DEFERRED (medium confidence):** a pinned Playwright plus
pinned browser build is reasonable for an isolated Chromium pilot. Production
adoption still requires an adversarial harness, browser-binary license review,
measured capacity envelope, patch/upgrade process, and proof that network policy
cannot be bypassed by redirects, DNS changes, service workers, WebSockets or
downloads. Cross-browser rendering should be rejected for the first lane unless
measured corpus failures justify its cost.

## 1. Frame, labels and method

### 1.1 Bounded questions

1. What are Playwright's actual control and lifecycle boundaries across test
   workers, browser instances, contexts, pages and workers?
2. What does navigation completion mean, and which important crawl bounds are
   or are not supplied?
3. How complete is request interception around redirects, service workers,
   WebSockets and downloads?
4. What can tracing prove, what can it leak, and what survives cleanup?
5. How do auto-waiting, timeouts and retries alter determinism and side effects?
6. Which isolation, scale, operations and licensing lessons transfer cleanly to
   Curiosity?

**Depth budget:** official Playwright documentation and official repository
policy/license files; architecture-level reverse engineering of documented
behavior. No package execution, hostile-site experiment, benchmark, source-code
copying, private endpoint use, vulnerability testing, or legal opinion.

**Stop rule:** every requested category has documented behavior, a gap/risk,
and a Curiosity verdict; stop when additional official pages repeat an existing
control class. The bounded curiosity pass in section 13 follows this declared
frame and the caller's authority.

Labels:

- **FACT** — directly documented by an official source.
- **INFERENCE** — conclusion from cited facts; not measured here.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

The live documentation identified itself as Playwright **v1.62.0** in Docker
examples and included APIs added through v1.62 [S14]. Documentation is mutable;
the source list records access date, not immutable content hashes.

## 2. The documented control plane

### 2.1 Hierarchy and ownership

```text
Playwright Test coordinator (optional)
  -> independent OS worker process(es)
     -> one browser per worker
        -> BrowserContext (logical session / incognito-like profile)
           -> Page(s): tabs and popups
           -> service workers (Chromium support only)
           -> context-wide network routes, events, trace, auth/storage state
           -> downloads and optional HAR/video artifacts
```

**FACT (high):** Playwright Test uses independent OS worker processes; each
worker starts its own browser. Workers cannot communicate, may be reused across
files, and are shut down after a test failure [S15]. A browser can own multiple
contexts, a context can own multiple pages, and a popup remains in its opener's
context [S1, S2, S3].

**FACT (high):** non-persistent contexts do not write browsing data to disk and
do not share cookies/cache with other contexts. Playwright Test creates a fresh
context and default page per test. The product describes these as
incognito-like, fast and “completely isolated” for test state [S1, S3]. A
persistent context instead uses a user-data directory and is the browser's only
context [S14].

**INFERENCE (high):** contexts are an efficient *session-state boundary*, not a
hostile-tenant security boundary. Multiple contexts still belong to one browser
object, while the official Docker guide separately warns against using its
default image for untrusted sites and prescribes browser sandboxing for crawling
[S3, S19]. A browser compromise, process-level leak, shared host resources,
shared DNS/egress, and shared backend state are outside context isolation.

**RECOMMENDATION:** Curiosity's minimum security tenancy should be a disposable
OS/container/VM render job, not merely one context per URL. Context-per-attempt
remains valuable defense in depth and cleanup, but unrelated trust domains must
not depend on context isolation alone.

### 2.2 Page semantics and rendering control

**FACT (high):** each page is one tab or popup. All pages in a context inherit
context-level viewport/emulation, locale and network routes, and can behave as
active pages without being brought to front [S2]. Playwright can retrieve the
post-execution HTML, execute page JavaScript, capture screenshots, observe
console/errors and inspect the accessibility representation [S5].

**INFERENCE (high):** this is sufficient to operate a JavaScript rendering
adapter, but the DOM returned after execution is not the original HTTP entity.
It is a time-dependent browser state affected by browser build, scripts,
cookies, locale, viewport, clock, network races and automation behavior.

**RECOMMENDATION:** a rendered capture must record at least original URL, every
navigation hop, final URL, browser/Playwright build, context profile, viewport,
locale/time zone, service-worker policy, start/end times, readiness rule,
request ledger, blocked-resource ledger, console/page errors, DOM hash,
screenshot hash and truncation/failure reasons. Never silently substitute it for
the static response version.

## 3. Navigation semantics and missing crawl bounds

### 3.1 What “loaded” means

**FACT (high):** `goto` waits for `load` by default and returns the first
non-redirect main-resource response. It throws on invalid URL, TLS failure,
timeout, unreachable/non-responsive server, or failed main resource; it does
*not* throw for HTTP 404 or 500. `about:blank` and same-document hash navigation
can return no response [S4, S5].

**FACT (high):** Playwright distinguishes navigation commitment from subsequent
loading. Its supported success points are `commit`, `domcontentloaded`, `load`,
and `networkidle`; the last is explicitly discouraged and means no network
connections for at least 500 ms [S4, S5]. The navigation guide says there is no
general way to tell when a modern page is “loaded”; work may continue after the
load event. Client-side redirects before `load` are followed [S4].

**FACT (high):** Playwright disables BFCache by default. If explicitly enabled,
BFCache restoration is unsupported and can desynchronize the Page because the
normal lifecycle events are skipped [S4]. Headless navigation to PDF is also
documented as unsupported [S5].

**INFERENCE (high):** `load` is neither a content-completeness guarantee nor a
safe crawl budget. A malicious or merely busy page can keep work alive; an SPA
can look useful before or long after `load`; and a 500 response can be mistaken
for success unless the caller inspects status.

**RECOMMENDATION:** use a Curiosity-owned state machine:

```text
validate initial target
  -> commit within deadline
  -> validate every effective destination at the egress boundary
  -> bounded DOM/readiness observation
  -> capture exactly once
  -> close context and flush selected artifacts
```

Readiness should be a typed result (`content-ready`, `load-only`, `deadline`,
`request-budget`, `resource-budget`, `policy-block`, `download`, `crash`), not a
claim that the page became universally “loaded.” Do not use `networkidle` as the
generic criterion.

### 3.2 Bounds ledger

| Control | Documented Playwright behavior | Curiosity implication |
| --- | --- | --- |
| Test wall time | Test default is 30 s; fixture setup and hooks share it. A separate equal teardown allowance follows [S16]. | Useful test-runner envelope, not a render-service SLA. Supervisor deadline must include launch, DNS, navigation, settle, capture, flush and kill. |
| Navigation/action timeout | Low-level test defaults are no timeout; `goto` API default is `0` (none). Page/context precedence is configurable [S5, S16]. | Every operation and whole job need finite deadlines; never inherit `0`. |
| Whole run | No default global timeout [S16]. | Mandatory queue/job global deadline and cancellation propagation. |
| Redirects | `goto` follows navigation redirects and reports the first non-redirect response; no `goto` redirect cap is documented [S5]. `route.fetch` separately defaults to 20 redirects and can use zero [S13]. | Enforce hop count and re-authorize every hop outside the browser; do not confuse `route.fetch` bounds with browser navigation. |
| Network retries | `route.fetch` defaults to zero and, if enabled, currently retries only `ECONNRESET`, not HTTP codes [S13]. Test retries re-run much more than a request [S17]. | Scheduler owns retry classes/backoff/idempotency. No automatic retry for policy failures, 4xx, most 5xx or side-effecting interactions. |
| Requests/bytes | No context/page request-count, aggregate-byte, response-byte or decompressed-byte cap is documented in reviewed APIs. | Enforce at proxy/egress and supervisor; abort on limit and preserve a truncation reason. |
| CPU/memory/DOM | No per-context CPU, RSS, heap, node-count or script-work quota is documented. | Hard container/cgroup/VM quotas plus browser/job recycling. Bound extracted DOM and screenshots separately. |
| Popups/pages | Context can receive arbitrarily triggered new-page events; no reviewed built-in page-count cap [S2]. | Close/block child pages by default; count and cap them before any interaction. |
| Downloads | Accepted by default in a new context; size/type/count bounds are not documented [S3, S9]. | Reject by default, then stream through a separately bounded quarantine lane only when explicitly requested. |

The negative findings above mean “not found in the reviewed official contract,”
not proof that no browser-internal limit exists.

## 4. Interception: powerful policy hook, incomplete boundary

### 4.1 Documented behavior

**FACT (high):** page- or context-level routes can abort, continue, modify or
fulfil matching HTTP(S) requests. A matching request stalls until the handler
chooses one. Page routes take precedence over context routes; handler chains run
in reverse registration order when fallback is used. Enabling routing disables
the HTTP cache [S6, S13].

**FACT (high):** routing can change URL, method, headers and body with important
limits: a continued URL must preserve protocol; URL/method/body overrides apply
only to the original request, while header overrides also apply to redirects;
some browser-forbidden headers cannot be overridden. `route.fetch` has an
explicit redirect cap and narrow network retry control [S13]. Context-level
WebSocket routing can modify connections created after registration [S3, S6].

**INFERENCE (high):** routing is excellent observability and an additional
deny-by-default policy hook, but it is unsafe as the only SSRF defense. URL
matching is not documented as validating resolved IPs; redirects require
continued authorization; service workers have special visibility rules; and
the browser still owns DNS, connection reuse and protocol behavior.

**RECOMMENDATION:** all browser traffic must traverse a separate egress control
that resolves and pins/validates destinations, denies loopback/link-local/
private/metadata/control-plane networks, rechecks redirects and DNS answers,
restricts ports/protocols, caps bytes and requests, and emits an auditable
decision. Install context routes before any page exists as defense in depth.
Treat routing-handler timeout or exception as deny, not implicit continue.

### 4.2 Interception changes what is observed

**FACT (high):** merely enabling routing disables HTTP cache [S3]. Request and
response modification, HAR replay and resource blocking can materially change
execution [S6, S13].

**INFERENCE (high):** a “rendered page” captured under image/font/script
blocking is a derived experimental view, not a faithful browser visit.

**RECOMMENDATION:** version the interception profile and distinguish
`observational` (policy only), `cost-reduced` (nonessential resources blocked),
and `replay` modes. Evidence records must enumerate blocked/modified/fulfilled
requests.

## 5. Service workers and downloads

### 5.1 Service workers

**FACT (high):** service-worker inspection/routing is supported only for
Chromium-based browsers. Service workers are allowed by default, may proxy page
traffic, and can be blocked per context [S7, S3]. Requests intercepted by a
service worker may be invisible to ordinary page/context routing; Playwright's
general network guide recommends blocking service workers when requests appear
missing [S6].

**FACT (high):** the dedicated guide exposes worker-owned requests through
context events and routes, but frame access throws for those requests. A page
request handled by a worker can produce both frame-owned and worker-owned event
views, only the externally fetching worker-owned request is routable in the
documented transparent-proxy example. Updating the service worker's main script
cannot currently be routed [S7].

**INFERENCE (high):** allowing workers complicates completeness, deduplication
and causality. Blocking them improves policy observability but can change sites
whose content depends on worker caches/offline logic.

**RECOMMENDATION:** first release uses Chromium with `serviceWorkers: block` and
records that fidelity trade-off. Add an explicit “worker-required” profile only
after tests prove context-event accounting and the external egress layer still
sees every connection. Never infer request counts by naively counting all
Playwright events.

### 5.2 Downloads

**FACT (high):** accepted downloads go to temporary storage, emit an event when
they start, and expose a path/stream only on completion. Files are deleted when
their context closes; direct path access throws over a remote connection.
Suggested filenames come from browser interpretation of response headers or the
HTML download attribute and may differ by browser [S8, S9]. Event callbacks can
outlive the main control flow if not explicitly awaited [S8].

**INFERENCE (high):** automatic acceptance plus asynchronous completion creates
disk-exhaustion, archive-bomb, malware, race and path-selection hazards. Context
deletion is cleanup, not content validation, and a browser-suggested name is
untrusted input.

**RECOMMENDATION:** disable acceptance for normal rendering. A later download
lane must use generated object IDs rather than suggested paths; stream through
byte/time/type/count limits; never execute or unpack in the render sandbox; hash
and quarantine before inspection; and await cancellation/completion before
teardown.

## 6. Tracing and evidentiary limits

**FACT (high):** context tracing can capture browser operations and network
activity; with snapshots it captures DOM snapshots on actions and network
activity, with optional screenshots and source files. The library tracing API
does not record test assertions, whereas Playwright Test tracing does [S10].
Trace Viewer exposes action timing, before/action/after DOM snapshots, source,
logs, errors, browser/test console output, request and response headers/bodies,
screenshots and metadata [S11].

**FACT (high):** always-on tracing is described as performance-heavy; the
recommended CI mode records on first retry or retains failures [S11]. The hosted
static viewer says a dragged trace is loaded entirely in the browser and not
transmitted externally [S11].

**INFERENCE (high):** traces are high-value diagnostics but high-risk sensitive
artifacts. DOM, headers, bodies, source, console and screenshots can contain
cookies, authorization values, PII, proprietary content and prompt-injection
text. A trace is also not a stable provenance format or proof that every byte
was captured, particularly with service workers or library-mode assertions.

**RECOMMENDATION:** do not use Playwright trace ZIPs as Curiosity's evidence
record. Keep structured, bounded, content-addressed capture metadata in the
provider-neutral plane. Enable traces only for sampled or failed jobs; encrypt,
access-control, redact where feasible, apply short retention, and never expose a
remote trace URL publicly. The claim that the official static viewer does not
upload data does not make the trace non-sensitive.

## 7. Cleanup and failure lifecycle

**FACT (high):** explicitly closing a context closes all its pages and is the
recommended way to flush HAR and video artifacts. Closing a launched browser is
similar to force-quitting; contexts should be gracefully closed first. Closing
a connected Browser clears contexts created by that client and disconnects
rather than necessarily terminating the remote server [S3]. Downloads disappear
on context close, while a configured `artifactsDir` is not cleaned when the
browser closes [S9, S14].

**FACT (high):** Playwright handles SIGHUP/SIGINT/SIGTERM by closing a launched
browser by default. Docker recommends an init process because PID 1 behavior can
otherwise leave zombies [S14, S19]. Async listeners can be explicitly removed
with options to wait or suppress subsequent errors [S3].

**INFERENCE (high):** graceful close and hard kill are both required. Grace is
needed for selected artifacts; a deadline breach, wedged listener or compromised
browser cannot be trusted to cooperate. Artifact directories and remote browser
servers have different ownership from contexts.

**RECOMMENDATION:** supervisor cleanup order is: stop new events; cancel
operations/downloads; bounded wait for required streams/listeners; close
context; flush and hash approved artifacts; close/disconnect browser; kill
remaining process tree; delete job workspace; verify no processes/files remain.
Artifact publication must be transactional, so a teardown timeout cannot make a
partial capture look complete.

## 8. Auto-waiting, retries and side effects

**FACT (high):** actions auto-wait for relevant conditions such as unique target,
visibility, stability, event reception and enabled/editable state. Failure to
meet them before timeout raises a timeout error. Web-first assertions retry;
forcing actions bypasses some checks [S12]. Auto-waiting does not mean a page is
globally ready, and the navigation guide documents hydration races where an
apparently enabled control has not yet acquired listeners [S4].

**FACT (high):** test retries are off by default. When enabled, a failed test is
retried in a new OS worker and browser; failures discard the old worker.
Playwright labels first-pass success, flaky retry success and exhausted failure
separately [S17]. Serial groups retry together and are discouraged in favor of
independent tests [S17].

**INFERENCE (high):** action waiting is useful for deterministic extraction but
not safe authority for autonomous interaction. Replaying a whole render workflow
can repeat POSTs, analytics, consent actions, logins or downloads. A timeout is
ambiguous: the browser may have committed a side effect before observation
failed.

**RECOMMENDATION:** public-web rendering is read-only by default: no typing,
clicking, permission grants, uploads or mutation methods. Retry only fresh,
idempotent GET-like jobs with a new sandbox and a stable job ID. Separate
transport retries from render retries, cap both, use exponential backoff with
jitter, honor domain politeness, and retain every attempt outcome. Never use
Playwright Test's whole-test retry semantics as the production scheduler.

## 9. Isolation and security gap analysis

| Boundary | Supported fact | Gap / Curiosity response |
| --- | --- | --- |
| Browser context | Separate cookies/cache/storage; non-persistent data not written to disk [S1, S3]. | **INFERENCE:** not a hostile-code sandbox. Use one disposable OS sandbox per trust unit and fresh context per attempt. |
| Chromium sandbox | Browser launch API documents `chromiumSandbox: false` as default. Docker root execution disables the sandbox [S14, S19]. | Run non-root with sandbox-capable kernel/seccomp profile; verify sandbox at runtime. Reject root/no-sandbox production. |
| Container image | Official image is for testing/development and is not recommended for untrusted sites [S19]. | Build/harden a separately reviewed image; minimal mounts/capabilities, read-only base, ephemeral writable space, no Docker socket. |
| Network | Context can use HTTP/SOCKS proxies and proxy bypass lists; remote connect can expose client-side networks, even `*` [S6, S14]. | Dedicated deny-by-default egress proxy/network namespace. Never permit broad bypass or `exposeNetwork: *`; protect metadata and internal control planes. |
| Remote control | Playwright supports WebSocket server connections; client/server major+minor versions must match. CDP is Chromium-only and significantly lower fidelity [S14]. | Authenticate and encrypt remote control, bind privately, authorize per job, pin versions. Prefer native protocol; do not expose endpoints publicly. |
| Permissions | Context permissions default to none; exact support varies by browser/version [S3]. | Keep none. Explicitly deny camera/mic/geolocation/clipboard/local-network access; do not assume unsupported equals denied. |
| TLS/CSP | Ignoring TLS errors and bypassing CSP default false [S3]. | Preserve defaults; policy must reject TLS failure rather than weakening validation. Never enable CSP bypass for extraction. |
| Downloads | `acceptDownloads` defaults true [S3]. | Override false and isolate any later download lane. |
| Credentials | Auth state files may contain cookies/headers sufficient for impersonation; official docs discourage committing them [S20]. | Anonymous rendering by default. No host credentials, tokens, client certs or personal profile. Secret-bearing captures require separate authorization and retention. |
| Persistent profiles | Persistent contexts write state; automating the normal Chrome profile is unsupported [S14]. | Reject persistent and daily-driver profiles for public-web retrieval. |
| Page-to-host bridge | Page/context APIs can expose host callbacks to every frame and across navigations [S3, S5]. | Do not expose privileged host functions to untrusted pages. If unavoidable, use narrow capability tokens, origin checks and bounded serialization. |

**Overall security conclusion (high confidence):** Playwright increases the attack
surface from HTTP parsing to an entire browser, JavaScript engine, media stack,
protocol client and artifact pipeline. Its convenience APIs can also bridge the
page to filesystem, callbacks, credentials and internal networks. Curiosity must
treat every page, event field, DOM string, filename, console message and trace as
untrusted data, and the browser as potentially compromised after every job.

## 10. Scale and operations

**FACT (high):** local parallelism is worker-process based, each worker starts a
browser, and the worker count is configurable. Playwright recommends one worker
in CI for stability/reproducibility, with sharding across jobs/machines for wider
parallelism [S15, S18]. Test-level sharding balances better when fully parallel;
otherwise sharding is file-granular and can be skewed [S21].

**FACT (high):** Playwright versions require specific browser binaries; updates
may require reinstalling browsers. Browser caches consume hundreds of megabytes
per engine in the official examples. The project recommends pinned Docker image
versions and matching remote client/server versions; it does not recommend CI
browser-binary caching because restore can cost as much as download [S14, S19].

**FACT (high):** Chromium in Docker may exhaust shared memory and crash; the
official guide recommends `--ipc=host`, and also recommends an init process to
avoid zombies [S19]. Alpine/musl is unsupported for the supplied Firefox and
WebKit builds [S19]. Headless shell and full/new-headless Chromium are distinct
and can behave differently [S22].

**INFERENCE (high):** adding workers until CPUs are busy is not safe browser
capacity planning. Memory, shared memory, file descriptors, process count,
network bandwidth, artifact I/O and domain politeness can bind first. Sharing
host IPC may improve stability but weakens tenant isolation.

**RECOMMENDATION:** operate a bounded render queue, not a generic test farm:

- pinned immutable Playwright/browser/OS image; signed artifacts and rapid
  browser security-update cadence;
- one Chromium profile initially, with explicit headless-mode identity;
- small per-node concurrency derived from adversarial RSS/CPU/SHM/FD tests;
- dedicated SHM allocation rather than broad host IPC where isolation matters;
- per-origin admission/politeness, global backpressure and queue expiry;
- browser/job recycling on crash, timeout, policy violation or resource high
  water mark; never return a tainted browser to a shared pool;
- metrics for queue age, launch/commit/render/teardown latency, request/byte
  counts, peak RSS/CPU/SHM/FDs, child pages, blocked egress, crashes, truncations,
  artifact bytes and success by readiness class;
- canary upgrades against a fixed corpus before changing the pinned build.

## 11. License and clean-room boundary

**FACT (high):** the Playwright repository is licensed under Apache License 2.0,
including copyright and patent grants, redistribution conditions, patent
termination language, warranty disclaimer and trademark exclusion [S23]. Its
NOTICE attributes Microsoft and says portions derive from Puppeteer, also under
Apache 2.0 [S24].

**UNKNOWN (material):** this review did not establish the complete license,
notice, codec, patent or redistribution obligations of every downloaded
Chromium, Firefox, WebKit, OS package, font or media dependency. Playwright's
Apache license does not by itself license all bundled browser components or web
content. Branded browsers and codecs have additional distinctions [S22].

**RECOMMENDATION:** clean-room learning may adopt documented concepts and public
interfaces without copying implementation. If Curiosity imports Playwright,
record exact package/browser/image digests and preserve the Apache license,
NOTICE and all transitive notices required by the chosen distribution. Run SBOM,
vulnerability and license review on the exact artifact. If an owned adapter is
implemented later, derive its requirements from this behavior dossier and
standards, not copied Playwright/Puppeteer source. Product name/trademark use is
descriptive only.

No source implementation was inspected or copied for this report. Official API
examples were read as documentation but none are reproduced into Curiosity
project code.

## 12. Curiosity target contract and verdicts

### 12.1 Provider-neutral boundary

**RECOMMENDATION (high confidence):** keep Playwright behind an internal
`render(request) -> rendered_capture` adapter. The provider-neutral request
should contain policy, not Playwright options:

- immutable job/attempt ID and caller-declared purpose;
- validated initial URL plus egress policy reference;
- browser profile ID, locale/viewport and anonymous-state requirement;
- service-worker/download/child-page policies;
- wall/request/byte/resource/output budgets;
- readiness rule and static-capture parent ID;
- evidence/diagnostic retention class.

The result should contain final disposition, complete redirect/request decision
ledger, browser profile/build, timings, status, readiness class, policy blocks,
truncations, console/page errors, DOM/screenshot references and hashes, and
cleanup attestation. Playwright objects, exceptions, traces and local paths must
not cross this boundary.

### 12.2 Placement in owned retrieval

```text
static fetch + extraction
  -> typed quality gate says rendering is necessary
  -> admission / robots-policy continuity / domain politeness
  -> disposable render sandbox
       -> external deny-by-default egress gateway
       -> pinned Playwright Chromium adapter
       -> fresh non-persistent context, SW/downloads blocked
       -> bounded capture
  -> artifact quarantine + hashing
  -> extraction linked to static and rendered versions
  -> immutable evidence metadata
  -> sandbox destruction and attestation
```

Rendering must not grant the agent new navigation or interaction authority. The
retrieval service, not the agent or page, decides whether a second URL, popup,
download or retry is in frame.

### 12.3 Adopt/adapt/reject/defer ledger

| Item | Verdict | Confidence / rationale |
| --- | --- | --- |
| Browser/context/page lifecycle | **ADAPTED** | High — cheap fresh contexts and explicit close are strong patterns, with OS sandbox added above them. |
| Playwright Library as adapter | **DEFERRED** | Medium — likely pilot choice, pending security/capacity/license gates. |
| Playwright Test as production scheduler | **REJECTED** | High — worker/test/retry model is optimized for tests, not crawl authority, politeness or idempotent evidence capture. |
| Chromium-only initial lane | **ADOPTED for pilot** | High — narrows patching/capacity and is the only documented service-worker-control path. |
| Static fetch first, rendering on quality gate | **ADOPTED** | High — contains cost and browser attack surface. |
| Fresh non-persistent context per attempt | **ADOPTED** | High — documented state isolation and cleanup, but only defense in depth. |
| Context as hostile-tenant boundary | **REJECTED** | High — contradicted by the official untrusted-site Docker cautions. |
| Context routing as sole SSRF defense | **REJECTED** | High — service-worker gaps and no documented resolved-IP policy. |
| Service workers and downloads by default | **REJECTED** | High — observability, fidelity and resource hazards. |
| Playwright traces as canonical evidence | **REJECTED** | High — diagnostic, sensitive, expensive and incomplete as a provenance contract. |
| Sampled/failure traces | **ADAPTED** | High — useful under encryption, short retention and access controls. |
| Whole-workflow automatic retries | **REJECTED** | High — ambiguous side effects and wrong scheduler semantics. |
| Cross-browser rendering | **DEFERRED** | High — no demonstrated corpus need; triples operational and behavioral surface. |
| Persistent/authenticated browsing | **REJECTED by default** | High — secrets and cross-job state violate anonymous public-web lane. Separate authority would be required. |

## 13. Unknowns, checks and bounded curiosity pass

### 13.1 Material unknowns and required checks

| Unknown | Confidence impact | Bounded check before adoption |
| --- | --- | --- |
| Effective process/sandbox topology and whether Chromium sandbox is truly active in the target runtime | High security impact | Runtime sandbox attestation plus controlled escape-resistant configuration review; fail closed. |
| Redirect, DNS rebinding, IPv4/IPv6, WebSocket, worker and browser-internal request coverage through the proposed egress layer | High | Adversarial local fixture corpus with no production/internal targets; assert every connection decision. |
| Peak CPU/RSS/SHM/FD/disk/request/output behavior on Curiosity's corpus | High | Resource-bomb and long-tail benchmark under hard quotas; derive concurrency from measured high percentiles. |
| Cleanup after crash, kill, listener stall and remote disconnect | High | Fault injection; prove no child process, workspace, secret, download or partial “complete” artifact survives. |
| Rendering fidelity with workers blocked and resources capped | Medium | Judged corpus comparing static, bounded-render and normal-browser extraction; record failure classes. |
| Trace/HAR secret redaction completeness | High | Seed synthetic secrets across headers, DOM, console, bodies, URL and screenshots; inspect all artifacts. |
| Exact transitive/browser binary obligations | High legal/ops impact | Exact-version SBOM and counsel/license review before redistribution or image publication. |
| Browser security-patch SLO and rollback compatibility | Medium | Operational drill with pinned canary corpus and signed-image promotion. |

No performance, containment or comparative-quality claim is made without those
checks.

### 13.2 Curiosity scoring

Scale 1–5; higher cost is worse. Pursue only the highest-value in-frame gap.

| Thread | Relevance | Value | Novelty | Cost | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Is the documented Chromium sandbox default safe for untrusted crawling? | 5 | 5 | 4 | 1 | **Pursued:** API says sandbox false; Docker says root disables it and non-root+seccomp is recommended. This materially strengthens the external sandbox requirement [S14, S19]. |
| Can Playwright routing alone guarantee all egress is observed? | 5 | 5 | 4 | 2 | **Pursued:** service-worker documentation supplies explicit missing/routing exceptions; sole-boundary use rejected [S6, S7]. |
| Are trace files safe diagnostic attachments? | 4 | 5 | 3 | 1 | **Pursued:** viewer exposes DOM, source, headers and bodies; sensitive-artifact controls added [S10, S11]. |
| Benchmark throughput on this machine | 4 | 4 | 2 | 5 | `CURIOSITY_NO_GO`: no approved workload/corpus or execution authority; results would not establish production containment. |
| Inspect source internals for undocumented protocol behavior | 3 | 3 | 4 | 5 | `CURIOSITY_NO_GO`: outside clean-room documentation frame and unnecessary for current architecture decision. |
| Test real public sites for bypasses | 4 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: no live-host authorization; use a controlled fixture corpus in a separately approved pilot. |
| Complete patent/FTO analysis for browsers/codecs | 3 | 5 | 2 | 5 | `CURIOSITY_NO_GO`: legal analysis outside authority; exact-artifact counsel review remains mandatory. |
| Compare Browserless/Puppeteer/Selenium/Crawlee | 2 | 3 | 2 | 4 | `CURIOSITY_NO_GO`: product comparison is outside the Playwright control-plane frame and would not change the required outer sandbox. |

**Stop condition:** coverage reached. The pursued threads resolved the only
documentation-level contradictions that change architecture; remaining gaps
require an authorized empirical or legal phase rather than more document search.

## 14. Official sources

All sources are primary Playwright project sources, accessed 2026-08-17.

- **[S1]** Playwright, “Isolation.”
  <https://playwright.dev/docs/browser-contexts>
- **[S2]** Playwright, “Pages.” <https://playwright.dev/docs/pages>
- **[S3]** Playwright API, `Browser` and `BrowserContext`.
  <https://playwright.dev/docs/api/class-browser> and
  <https://playwright.dev/docs/api/class-browsercontext>
- **[S4]** Playwright, “Navigations.”
  <https://playwright.dev/docs/navigations>
- **[S5]** Playwright API, `Page` (including `goto`, close, content and
  evaluation behavior). <https://playwright.dev/docs/api/class-page>
- **[S6]** Playwright, “Network.” <https://playwright.dev/docs/network>
- **[S7]** Playwright, “Service Workers.”
  <https://playwright.dev/docs/service-workers>
- **[S8]** Playwright, “Downloads.” <https://playwright.dev/docs/downloads>
- **[S9]** Playwright API, `Download`.
  <https://playwright.dev/docs/api/class-download>
- **[S10]** Playwright API, `Tracing`.
  <https://playwright.dev/docs/api/class-tracing>
- **[S11]** Playwright, “Trace viewer.”
  <https://playwright.dev/docs/trace-viewer>
- **[S12]** Playwright, “Auto-waiting.”
  <https://playwright.dev/docs/actionability>
- **[S13]** Playwright API, `Route`.
  <https://playwright.dev/docs/api/class-route>
- **[S14]** Playwright API, `BrowserType` (launch, persistent contexts,
  native remote connection and CDP).
  <https://playwright.dev/docs/api/class-browsertype>
- **[S15]** Playwright Test, “Parallelism.”
  <https://playwright.dev/docs/test-parallel>
- **[S16]** Playwright Test, “Timeouts.”
  <https://playwright.dev/docs/test-timeouts>
- **[S17]** Playwright Test, “Retries.”
  <https://playwright.dev/docs/test-retries>
- **[S18]** Playwright, “Continuous Integration.”
  <https://playwright.dev/docs/ci>
- **[S19]** Playwright, “Docker.” <https://playwright.dev/docs/docker>
- **[S20]** Playwright, “Authentication.”
  <https://playwright.dev/docs/auth>
- **[S21]** Playwright Test, “Sharding.”
  <https://playwright.dev/docs/test-sharding>
- **[S22]** Playwright, “Browsers.” <https://playwright.dev/docs/browsers>
- **[S23]** Microsoft Playwright repository, `LICENSE`.
  <https://github.com/microsoft/playwright/blob/main/LICENSE>
- **[S24]** Microsoft Playwright repository, `NOTICE`.
  <https://github.com/microsoft/playwright/blob/main/NOTICE>
- **[S25]** Microsoft Playwright repository, `SECURITY.md`.
  <https://github.com/microsoft/playwright/blob/main/SECURITY.md>

## Confidence summary

- **High:** documented lifecycle, context/page state model, navigation events,
  routing and worker limitations, cleanup requirements, timeout/retry defaults,
  Docker cautions, trace content, version pinning and top-level license.
- **Medium:** Playwright is the best dependency for Curiosity's pilot; no
  comparative benchmark was authorized, and the verdict is conditional.
- **Low / unknown:** quantified capacity, containment against browser exploits,
  complete network mediation under adversarial behavior, extraction fidelity,
  and exact transitive/browser redistribution obligations. These remain gates,
  not assumed properties.
