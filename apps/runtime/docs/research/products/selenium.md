# Selenium/WebDriver as rendering automation infrastructure

**Research date:** 2026-08-17  
**Source access date:** 2026-08-17 for every linked source unless stated otherwise  
**Method:** clean-room behavioral and architectural analysis from public specifications,
official project documentation, and official repository metadata. No Selenium source code
was copied, adapted, or executed.

## Decision frame

**Decision:** should Curiosity use Selenium/WebDriver as infrastructure for rendering and
extracting pages that cannot be handled by ordinary HTTP retrieval, and if so, where should
the boundary sit?

Bounded sub-questions:

1. What contract does classic WebDriver provide, and what does Grid add?
2. Does a WebDriver session provide adequate workload and tenant isolation?
3. Which real browsers and platforms can be covered without vendor-specific coupling?
4. What are the actual navigation, readiness, timeout, and network-observation semantics?
5. Can runs be made reproducible enough for retrieval evidence?
6. What security boundary and operating cost does a remote browser fleet create?
7. What may Curiosity learn or reuse without importing Selenium implementation or license
   ambiguity?

**Out of frame:** test-authoring style, Selenium IDE, implementation, deployment, bypassing
site controls, anti-bot evasion, credentialed crawling, or copying Selenium internals.

## Executive verdict

**Verdict: ADAPTED, not adopted as Curiosity's retrieval core.** **Confidence: high.**

Selenium is a mature cross-browser *control plane* for real browser sessions. Classic
WebDriver gives a standardized, language-neutral HTTP command/response interface; Grid
multiplexes session creation onto capability-matched browser slots; WebDriver BiDi adds a
WebSocket event plane, including network events and interception. These are strong properties
for a separately operated **rendering adapter** behind Curiosity's provider-neutral retrieval
contract. [S1][S2][S3][S4]

It is a poor fit for first-line public-web retrieval. A browser is far more expensive than an
HTTP request; page-load completion is not application quiescence; classic WebDriver does not
provide a portable response-status/traffic API; BiDi and Selenium's high-level BiDi surface
remain in transition; and Grid is explicitly dangerous if exposed. [S5][S6][S7][S8]

**Recommended boundary:** Curiosity owns URL policy, SSRF controls, budgets, provenance,
artifact normalization, retry policy, and evidence semantics. A Selenium adapter receives a
pre-authorized job, creates one fresh browser session in an ephemeral worker, navigates under
strict deadlines, captures bounded artifacts, then destroys the worker. Do not expose raw
WebDriver, Grid, CDP, arbitrary capabilities, browser arguments, file paths, uploads, or
download primitives to untrusted callers.

## Evidence labels

- **FACT** — directly supported by a cited primary source.
- **INFERENCE** — reasoned consequence of cited facts; not promised by the source.
- **RECOMMENDATION** — design advice for Curiosity.
- Confidence is **high**, **medium**, or **low**. Unknowns and proposed checks are explicit.

## 1. Protocol and remote Grid

### Classic WebDriver contract

- **FACT (high):** WebDriver is an out-of-process, platform- and language-neutral remote
  control protocol. The local end is normally a language binding; the remote end is an HTTP
  server. Commands map to HTTP endpoints and each command yields one HTTP response. Standard
  endpoints include session lifecycle, navigation, elements, script execution, cookies,
  screenshots, and printing. [S1]
- **FACT (high):** The protocol distinguishes an endpoint node (browser or browser-adjacent
  driver) from an intermediary node that proxies to endpoints. From the client perspective an
  intermediary is required to remain wire-compatible with a remote end. Capabilities are
  negotiated at session creation; standard capability keys include browser name/version,
  platform, proxy, page-load strategy, TLS handling, window support, and timeouts. Vendor
  extensions use namespaced keys. [S1]
- **FACT (high):** Classic processing is ordered around a remote-end request queue and a strict
  command/response model. WebDriver BiDi instead permits concurrent commands, out-of-order
  completion, subscriptions, and remote-end events over WebSocket. [S1][S2]
- **INFERENCE (high):** The WebDriver wire protocol is a good **adapter boundary**, not an ideal
  public Curiosity API. It is browser-control shaped, has mutable session state, and permits
  powerful extension commands and capabilities that exceed a bounded retrieval contract.

### Grid control plane

- **FACT (high):** Selenium Grid's Router fronts the system. New sessions pass through a New
  Session Queue; the Distributor matches requested capabilities to a Node slot; the Session
  Map associates session IDs with Nodes; Nodes run sessions; and an Event Bus carries internal
  asynchronous messages. Grid can run standalone, hub-and-node, or fully distributed. [S3][S4]
- **FACT (high):** A slot has a capability stereotype; a Node can advertise more slots than it
  can run simultaneously, while `maxSessionCount` limits concurrency. The Grid Model is a
  cached model and the official architecture explicitly notes that it can temporarily diverge
  from reality. [S3]
- **FACT (high):** The Router routes active-session commands using the Session Map. Node
  heartbeat/registration and Distributor health checks recover knowledge of Nodes. Queue,
  session, health-check, registration, and inactivity timeouts are separate controls. [S3][S9]
- **INFERENCE (high):** A retrieval orchestrator must distinguish at least four timeout/failure
  domains: queue admission, session startup, browser command/navigation, and whole-job wall
  clock. A single WebDriver timeout cannot bound the system.
- **RECOMMENDATION (high):** Return Curiosity-native typed outcomes such as
  `capacity_timeout`, `session_start_failed`, `navigation_timeout`, `policy_blocked`, and
  `artifact_limit`; do not leak Grid's topology or implementation-specific exception text as
  the stable contract.

## 2. Session and tenant isolation

- **FACT (high):** Selenium recommends a new WebDriver instance per test and says ChromeDriver
  and GeckoDriver normally start a clean new user profile. Its stronger ideal is a new virtual
  machine per test. The project also recommends avoiding shared state and always quitting the
  driver. [S10][S11]
- **FACT (high):** The WebDriver specification gives every session an identifier and session
  state, and session deletion closes top-level browsing contexts and ends the session. It does
  not define host, process, filesystem, network-namespace, kernel, or tenant isolation. [S1]
- **FACT (high):** Grid maps one running session to one slot, but a Node can host multiple
  concurrent browser sessions. Grid guidance estimates roughly one CPU and 1 GB RAM per
  session, recommends smaller Nodes for failure isolation, and explicitly presents containers
  as one way to achieve it. Safari is restricted to one session in this guidance. [S4]
- **INFERENCE (high):** A fresh browser profile reduces cookie/cache/storage contamination but
  is **not a security sandbox**. Same-Node sessions may still share host kernel, network reach,
  DNS, process table exposure permitted by the OS, and operational failure domains.
- **RECOMMENDATION (high):** Use one untrusted retrieval job per short-lived container or VM,
  one WebDriver session per worker, a read-only base image, no host mounts, no ambient cloud
  credentials, restricted egress, bounded writable storage, non-root execution, resource
  limits, and forced cleanup. Node reuse is acceptable only inside the same trust domain and
  after proving browser/profile cleanup; cross-tenant Node reuse should be rejected by default.
- **UNKNOWN:** No reviewed primary source promises hard multi-tenant isolation for Selenium
  Grid. **Check:** adversarially test data remanence (profiles, downloads, `/tmp`, crash dumps),
  process and network separation, orphan cleanup, and session-ID authorization in the intended
  runtime.

## 3. Browser and platform coverage

- **FACT (high):** Selenium's official browser documentation covers Chrome, Edge, Firefox,
  Safari, and Internet Explorer functionality. SafariDriver ships with the operating system;
  official examples are macOS-only, and Selenium directs iOS Safari automation to Appium.
  Standalone Internet Explorer support ended in June 2022; the IE driver remains for Edge IE
  compatibility mode. [S12][S13][S14]
- **FACT (high):** Capability negotiation can select browser, browser version, and platform,
  while Grid Nodes advertise matching stereotypes. Grid relay can forward WebDriver commands
  to external services such as Appium or cloud providers. [S1][S9]
- **FACT (high):** Selenium Manager can discover, download, and cache compatible drivers and,
  for Chrome, Firefox, and Edge, browsers. It accepts fixed versions and channel labels. Safari
  remains tied to Apple's installed OS browser/driver. [S15]
- **INFERENCE (high):** “Cross-browser” means one broad control protocol, not identical feature
  behavior. Rendering, headless modes, fonts, media codecs, PDF output, screenshots,
  extensions, download handling, logs, BiDi modules, and vendor capabilities remain browser-
  and platform-dependent.
- **RECOMMENDATION (high):** Define Curiosity support as an explicit tested matrix of browser
  family + exact browser build + driver + OS/image + enabled artifact features. Treat Chromium
  as the economical default renderer; add Firefox for diversity and Safari only where WebKit
  evidence justifies macOS capacity and operational cost. Exclude IE compatibility mode from
  ordinary retrieval.
- **UNKNOWN:** The reviewed documentation does not provide a single current, normative feature
  parity matrix for every BiDi command across every browser and Selenium language binding.
  **Check:** run the required Curiosity conformance corpus on each exact matrix entry before
  advertising it.

## 4. Navigation, readiness, and timeouts

- **FACT (high):** Classic WebDriver defines per-session `script`, `pageLoad`, and `implicit`
  timeouts. The specification's defaults are 30 seconds for scripts, 300 seconds for page load,
  and 0 for implicit element lookup. Navigation waits are governed by the page-load strategy.
  [S1]
- **FACT (high):** Selenium documents three page-load strategies: `normal` waits for
  `document.readyState == complete`, `eager` for `interactive`, and `none` does not block.
  Selenium explicitly warns that ready state does not mean a single-page application has
  finished dynamic loading, and that this behavior does not apply in the same way to
  click/form-triggered navigation. [S5]
- **FACT (high):** Selenium's wait guidance says navigation readiness only concerns resources
  represented by HTML loading; JavaScript can mutate the page afterward. Implicit wait is
  global to element lookup; explicit waits poll an application-specific condition. [S16]
- **FACT (high):** Grid adds a new-session queue timeout and retry interval; Nodes separately
  expire inactive sessions. WebDriver client HTTP/socket deadlines are another independent
  layer. [S9]
- **INFERENCE (high):** “Rendered” has no universal protocol moment. `load` can be too early for
  SPA content and too late when irrelevant resources hang. “Network idle” is also not universal
  because analytics, streaming, long polling, and service workers may never become idle.
- **RECOMMENDATION (high):** Use a bounded completion policy rather than claiming full page
  completion: successful main navigation plus a configurable DOM predicate, a short bounded
  settle window, and hard wall-clock cutoff. Record which condition fired. Keep implicit waits
  at zero; use targeted explicit checks only. Stop loading/capture partial evidence when the
  deadline is reached, and label it partial rather than silently retrying.
- **RECOMMENDATION (high):** Enforce limits for redirects, browsing contexts/popups, DOM bytes,
  screenshot dimensions, script result bytes, response/event bytes, download count/size, and
  total job duration outside Selenium. Selenium's own timeouts do not create these budgets.

## 5. Network observation and interception limits

### Classic WebDriver

- **FACT (high):** The classic standard endpoint table has navigation, DOM, script, cookies,
  screenshots, and print commands but no general request/response event stream, response-body
  capture, or main-document HTTP status endpoint. Selenium's own guidance says WebDriver does
  not generally expose response codes portably and recommends a proxy when cross-browser
  traffic capture/manipulation is required. [S1][S7]
- **INFERENCE (high):** Classic WebDriver alone cannot produce a trustworthy HAR-like evidence
  record or distinguish a successful browser-rendered error page from application success
  without inspecting content.

### CDP and BiDi

- **FACT (high):** Selenium describes CDP support as temporary, Chromium-specific in practice,
  not designed as a stable testing API, and highly browser-version dependent. Basic direct CDP
  commands do not cover features requiring bidirectional communication; generated CDP bindings
  must track browser protocol versions. [S6]
- **FACT (high):** WebDriver BiDi is a W3C draft protocol using WebSocket, with subscribable
  network events and commands including request/response continuation, authentication,
  failure, synthetic response, cache behavior, extra headers, and data collection. The 2026
  specification remains an Editor's Draft, and Selenium says its migration from classic to
  BiDi is ongoing while preserving compatibility. [S2][S8]
- **FACT (medium):** Selenium's high-level network documentation describes auth, request, and
  response handlers but points to an implementation-tracking issue; its examples identify
  Chrome, Edge, and Firefox for the shown BiDi test. This supports availability, not complete
  parity. [S17]
- **INFERENCE (high):** BiDi is the right standards direction but not yet a safe assumption for
  identical capture/interception semantics across the entire support matrix. CDP can fill a
  Chromium-only gap, at the cost of version coupling.
- **RECOMMENDATION (high):** For Curiosity, prefer a controlled egress proxy or separate HTTP
  fetch path for canonical request/response evidence. Use BiDi opportunistically for browser
  events and diagnostics behind capability detection. Do not make CDP-shaped fields part of
  the provider-neutral contract. If interception is enabled, restrict mutations to a reviewed
  policy; arbitrary synthetic responses or header/body rewrites can invalidate provenance.
- **UNKNOWN:** Exact response-body retention, streaming, service-worker, cache, WebSocket,
  redirect-chain, and cross-origin behavior varies by browser/version and was not established
  by the reviewed high-level Selenium docs. **Check:** a conformance suite covering redirects,
  compression, large bodies, 204/304, downloads, service workers, cache hits, auth, SSE, and
  WebSockets on every supported runtime.

## 6. Reproducibility and evidence quality

- **FACT (high):** Selenium Manager's default behavior can resolve current versions online,
  download assets, cache them under `~/.cache/selenium`, refresh metadata by TTL, prune unused
  versions, and report anonymized usage statistics unless disabled. It supports exact browser
  and driver versions, offline mode, alternate cache/mirror paths, and disabling statistics.
  [S15]
- **FACT (high):** The WebDriver session response reports actual capabilities including browser
  and platform information. The standard also exposes `navigator.webdriver`, so sites can
  intentionally vary behavior under automation. [S1]
- **FACT (high):** Selenium warns that CDP versions must match Chrome and that Selenium supports
  only a moving recent-version window for generated CDP access. [S6]
- **INFERENCE (high):** Auto-management optimizes convenience, not archival reproducibility.
  Unpinned `stable`/`latest`, host-installed browsers, mutable base images, live DNS/content,
  locale/timezone/font differences, and site automation detection can all change output.
- **RECOMMENDATION (high):** Production workers should be immutable and digest-pinned. Record
  Selenium binding/server version, Grid version, browser and driver full versions, OS image
  digest, architecture, headless mode, viewport/device scale, locale, timezone, fonts, proxy
  policy, accepted capabilities, completion condition, timestamps, final URL, redirect summary,
  and hashes of captured artifacts. Disable Manager telemetry; prefer offline pre-provisioned
  artifacts from an approved mirror. Never persist the Manager cache as undocumented evidence.
- **RECOMMENDATION (high):** Treat browser output as an observation, not canonical truth. Keep
  raw HTML/DOM snapshot semantics distinct, preserve screenshot and extraction hashes, and
  mark that automation may have affected the served representation.
- **UNKNOWN:** Bit-for-bit screenshot reproducibility across hosts is not promised. **Check:**
  repeated-run variance testing on pinned workers, including fonts, GPU/software rendering,
  animation disabling policy, clocks, random content, and viewport scaling.

## 7. Security boundary

- **FACT (high):** Selenium explicitly warns that Grid must be firewalled. An exposed Grid can
  give third parties access to Grid infrastructure, internal applications/files, and custom
  binary execution. [S4]
- **FACT (high):** Grid supports Router basic authentication, HTTPS certificate/key settings,
  a Node registration secret, origin/content-type checks, optional CORS, and limits on WebSocket
  connections per session. Its configuration also allows browser/driver paths, Docker or
  Kubernetes session provisioning, file upload/download handling, custom Node/driver classes,
  and relays to other WebDriver services. [S9]
- **FACT (high):** WebDriver can navigate arbitrary URLs, execute page scripts, accept insecure
  certificates, configure proxies, upload local files through a remote file detector, and
  retrieve managed downloads when enabled. [S1][S18]
- **INFERENCE (high):** A reachable WebDriver/Grid endpoint is effectively a remote browser
  execution service with SSRF and data-exfiltration potential. Basic authentication and a
  registration secret are useful controls, not a tenant authorization model or sandbox.
- **RECOMMENDATION (high):** Keep Router and all Grid internals on a private network; put a
  Curiosity authorization/policy broker in front; use mutually authenticated service transport
  where feasible; deny direct session IDs to end users; rotate credentials; disable UI, CORS,
  uploads, managed downloads, CDP/BiDi proxying, insecure certificates, arbitrary browser
  binaries/arguments, and custom extensions unless a use case specifically requires them.
- **RECOMMENDATION (high):** Apply URL policy before navigation and again after every redirect
  and browser-created top-level context. Resolve and pin allowed destinations against private,
  loopback, link-local, metadata, and special-use address ranges; constrain DNS rebinding;
  restrict egress by network policy rather than trusting browser code; isolate secrets; redact
  authorization/cookie data from traces and artifacts.
- **RECOMMENDATION (high):** Treat page DOM, console messages, filenames, headers, downloads,
  screenshots, stack traces, and BiDi events as untrusted external data. Bound, sanitize, and
  content-type-check them before storage or downstream model use.

## 8. Operational cost and failure modes

- **FACT (high):** Grid guidance uses approximately one CPU and 1 GB RAM per concurrent browser
  as a starting estimate and recommends measuring the actual environment. It recommends many
  small Nodes over one large Node for failure isolation. Session creation concurrency and Node
  concurrency are CPU-related; excessive threads can add costly context switching. [S4][S9]
- **FACT (high):** Distributed Grid has Router, Distributor, Queue, Session Map, Event Bus, and
  Node availability/failure surfaces. It provides health/status endpoints, draining, inactive-
  session cleanup, structured logs, and OpenTelemetry tracing, but operators must configure and
  retain the telemetry systems. [S3][S9][S19]
- **INFERENCE (high):** Browser startup, rendering, JS execution, fonts, shared memory, video or
  screenshots, network event volume, crash cleanup, and multi-platform image maintenance make
  the unit cost orders of magnitude more variable than HTTP retrieval. No reviewed primary
  source provides a universal throughput or cost figure.
- **RECOMMENDATION (high):** Use rendering only after cheaper HTTP retrieval proves insufficient
  or policy explicitly requests it. Maintain a small bounded queue, per-origin concurrency,
  admission control, global circuit breakers, worker recycling, and cost attribution by CPU
  time, memory high-water mark, bytes, and wall duration. Never retry an unbounded browser job.
- **RECOMMENDATION (high):** Prefer single-purpose ephemeral workers over a fully distributed
  Grid until measured demand requires Grid scheduling. Grid solves capability routing and
  scale, but adds stateful distributed components and incident surface.
- **UNKNOWN:** Curiosity's real pages-per-worker, crash rate, cold-start latency, and artifact
  size distribution. **Check:** a representative benchmark with static pages, JS-heavy SPAs,
  hostile hangs, large media, redirects, and deliberate browser crashes; report p50/p95/p99,
  not averages alone.

## 9. License and clean-room lessons

- **FACT (high):** The Selenium repository is licensed under Apache License 2.0; its current
  license text attributes 2026 Software Freedom Conservancy, and the repository NOTICE lists
  Software Freedom Conservancy and Selenium committers. Apache-2.0 grants copyright and patent
  rights subject to conditions including license/notice retention, marking modified files, and
  preserving applicable attributions; it does not grant trademark rights. [S20][S21]
- **FACT (high):** The W3C WebDriver and BiDi specifications carry W3C permissive document
  license notices and are independent standards documents. [S1][S2]
- **INFERENCE (high):** Speaking the public WebDriver protocol or independently implementing a
  provider-neutral adapter is separable from copying Selenium source. Using Selenium binaries
  as dependencies or services remains use of Apache-2.0 software and requires normal dependency
  attribution/compliance; browser binaries and drivers have their own vendor terms.
- **RECOMMENDATION (high):** Adopt concepts and public contracts, not Selenium implementation:
  capability negotiation, opaque session handles, explicit lifecycle, queue/slot separation,
  draining, and protocol-level typed errors. Keep original Curiosity code and docs provider-
  neutral; place Selenium-specific translation in an adapter; preserve third-party license and
  NOTICE material in distribution records; inventory each browser, driver, container image,
  codec/font package, and cloud service separately.
- **RECOMMENDATION (high):** Do not copy generated bindings, Selenium examples, Java classes,
  Grid internals, logos, or documentation prose. This report paraphrases public behavior and
  links the origin. Legal review is required before redistribution; this report is not legal
  advice.

## 10. Curiosity contract implications

### ADOPT

1. **Opaque render-job and session handles**, never caller-selected raw Grid IDs.
2. **Capability request/response negotiation** for browser family, exact version, viewport,
   locale, timezone, artifacts, and optional event support.
3. **Explicit lifecycle:** queued → assigned → starting → navigating → settling → capturing →
   terminated, with typed terminal outcomes.
4. **Fresh isolated worker per untrusted job**, with mandatory teardown and separate whole-job
   deadline.
5. **Capability-aware routing and draining** as operational patterns.

### ADAPT

1. Translate WebDriver/exception details into stable provider-neutral error classes while
   retaining sanitized diagnostics internally.
2. Replace Selenium's test-centric “page loaded” notion with a bounded evidence completion
   policy and explicit `complete`/`partial` labels.
3. Supplement browser control with network-layer destination enforcement and, where needed, an
   egress proxy for canonical response evidence.
4. Record an evidence manifest richer than WebDriver capabilities, including immutable image
   identity, policy decisions, limits, artifacts, and hashes.
5. Start with local/ephemeral remote WebDriver workers; introduce Grid only for measured
   heterogeneous capacity needs.

### REJECT

1. Selenium/Grid as the default HTTP fetcher, crawler, search provider, or public API.
2. Exposing raw capabilities, browser arguments, CDP commands, BiDi commands, file operations,
   executable paths, or Grid endpoints to untrusted callers.
3. Treating a WebDriver session, fresh browser profile, Grid slot, or Basic Auth as a tenant
   security boundary.
4. Treating `document.readyState`, `load`, or “network idle” as proof of complete rendering.
5. Treating CDP as a portable provider-neutral contract or auto-resolved `latest` versions as
   reproducible evidence.

### DEFER

1. Safari/macOS capacity until a WebKit-specific evidence requirement and budget exist.
2. Cross-browser BiDi interception as a required contract until Curiosity's exact matrix passes
   conformance checks.
3. Fully distributed Grid, video capture, managed downloads, mobile/Appium, and cloud Grid
   relays until measured demand justifies their security and operating cost.

## 11. Required validation checks before adoption

| Check | Pass condition |
| --- | --- |
| Isolation | No cross-job cookies, cache, storage, files, downloads, processes, logs, or network access; worker destruction verified after crash/timeout. |
| SSRF/egress | Direct URLs, redirects, iframes, popups, DNS rebinding, alternate IP forms, proxy paths, and service-worker requests cannot reach denied destinations. |
| Deadlines | Queue, startup, navigation, settle, capture, inactivity, and global wall deadlines each produce typed bounded termination. |
| Resource abuse | CPU, memory, PIDs, disk, shared memory, sockets, contexts, DOM/artifact bytes, and event volume remain capped under hostile pages. |
| Evidence | Exact runtime manifest, final URL, completion trigger, policy decisions, artifact hashes, and partial/failure state are persisted. |
| Compatibility | Required corpus passes on every advertised browser/driver/OS tuple; unsupported BiDi features fail closed. |
| Operations | Orphan sessions are reaped, Nodes drain, queue backpressure works, telemetry is redacted, and capacity loss does not cause retry storms. |
| License | Selenium Apache-2.0 LICENSE/NOTICE and every browser/driver/image obligation are recorded and reviewed. |

## 12. Unknowns and negative results

1. **No hard-isolation guarantee found.** Selenium's primary material recommends fresh
   browsers/VMs and small Nodes but does not claim Grid is a hostile multi-tenant sandbox.
2. **No universal network-capture guarantee found.** Classic WebDriver lacks it; BiDi defines a
   rich draft model, but reviewed Selenium documentation does not establish complete parity
   across browsers/bindings.
3. **No deterministic-rendering guarantee found.** Version pinning is possible, but live web
   input and platform rendering remain variable.
4. **No authoritative universal capacity number found.** The official 1 CPU/1 GB guidance is a
   starting estimate, explicitly subject to measurement.
5. **No evidence that Selenium enforces Curiosity-grade URL/redirect/egress policy.** These
   controls must remain outside the browser automation library.
6. **No primary-source claim that Selenium is intended as a general crawler.** The standard is
   principally framed around browser automation/testing; suitability for retrieval is an
   architectural inference, not a product promise.

## 13. Bounded curiosity pass

Scoring: relevance/value/novelty/cost from 1 (low) to 5 (high). Pursuit budget was two threads
after the core synthesis.

| Candidate gap | R/V/N/C | Decision and result |
| --- | --- | --- |
| Is Grid a tenant sandbox? | 5/5/3/2 | **Pursued.** Official isolation, Grid sizing, and security guidance triangulated; result is negative—fresh profile/session is not a hard boundary. |
| Can BiDi replace a capture proxy today? | 5/5/4/3 | **Pursued.** W3C draft, Selenium BiDi/CDP/network docs triangulated; result is conditional and matrix-dependent. |
| Exact current Selenium release/package API by language | 2/2/1/2 | **CURIOSITY_NO_GO:** volatile and not needed for architecture. |
| Commercial cloud Grid pricing/SLAs | 2/3/2/4 | **CURIOSITY_NO_GO:** provider-specific and outside self-hosted infrastructure frame. |
| Anti-bot detectability/evasion | 3/2/4/5 | **CURIOSITY_NO_GO:** outside authorized frame; `navigator.webdriver` fact is sufficient for evidence caveat. |
| Selenium implementation internals/source audit | 2/2/3/5 | **CURIOSITY_NO_GO:** public protocol and operations docs reached saturation; source inspection would add clean-room/license cost without changing the decision. |

**Stop condition:** coverage and saturation. Both decision-critical uncertainties were pursued;
remaining gaps require runtime validation on Curiosity's eventual deployment matrix rather
than more documentary research.

## Sources

All sources below are primary and were accessed 2026-08-17.

- **[S1]** W3C, [WebDriver Working Draft, 2 July 2026](https://www.w3.org/TR/webdriver2/).
- **[S2]** W3C, [WebDriver BiDi Editor's Draft, 5 August 2026](https://w3c.github.io/webdriver-bidi/).
- **[S3]** Selenium, [Grid architecture](https://www.selenium.dev/documentation/grid/architecture/).
- **[S4]** Selenium, [Getting started with Selenium Grid](https://www.selenium.dev/documentation/grid/getting_started/).
- **[S5]** Selenium, [Browser options: page-load strategy](https://www.selenium.dev/documentation/webdriver/drivers/options/#pageloadstrategy).
- **[S6]** Selenium, [Chrome DevTools Protocol](https://www.selenium.dev/documentation/webdriver/bidi/cdp/).
- **[S7]** Selenium, [Discouraged: HTTP response codes](https://www.selenium.dev/documentation/test_practices/discouraged/http_response_codes/).
- **[S8]** Selenium, [WebDriver BiDi](https://www.selenium.dev/documentation/webdriver/bidi/).
- **[S9]** Selenium, [Grid CLI configuration options](https://www.selenium.dev/documentation/grid/configuration/cli_options/).
- **[S10]** Selenium, [Fresh browser per test](https://www.selenium.dev/documentation/test_practices/encouraged/fresh_browser_per_test/).
- **[S11]** Selenium, [Avoid sharing state](https://www.selenium.dev/documentation/test_practices/encouraged/avoid_sharing_state/).
- **[S12]** Selenium, [Supported browsers](https://www.selenium.dev/documentation/webdriver/browsers/).
- **[S13]** Selenium, [Safari-specific functionality](https://www.selenium.dev/documentation/webdriver/browsers/safari/).
- **[S14]** Selenium, [Internet Explorer-specific functionality](https://www.selenium.dev/documentation/webdriver/browsers/internet_explorer/).
- **[S15]** Selenium, [Selenium Manager](https://www.selenium.dev/documentation/selenium_manager/).
- **[S16]** Selenium, [Waiting strategies](https://www.selenium.dev/documentation/webdriver/waits/).
- **[S17]** Selenium, [WebDriver BiDi network features](https://www.selenium.dev/documentation/webdriver/bidi/network/).
- **[S18]** Selenium, [Remote WebDriver](https://www.selenium.dev/documentation/webdriver/drivers/remote_webdriver/).
- **[S19]** Selenium, [Observability in Selenium Grid](https://www.selenium.dev/documentation/grid/advanced_features/observability/).
- **[S20]** SeleniumHQ repository, [Apache License 2.0](https://github.com/SeleniumHQ/selenium/blob/trunk/LICENSE).
- **[S21]** SeleniumHQ repository, [NOTICE](https://github.com/SeleniumHQ/selenium/blob/trunk/NOTICE).

## Confidence summary

- Protocol, Grid architecture, classic navigation semantics, documented browser scope,
  licensing, and exposure risk: **high**.
- BiDi feature availability as a general direction: **high**; exact cross-browser parity:
  **medium-to-low until tested**.
- Isolation and operational recommendations: **high as security architecture inference**, but
  deployment-specific effectiveness is **unknown until adversarial validation**.
- Cost and throughput for Curiosity: **low until benchmarked**.
