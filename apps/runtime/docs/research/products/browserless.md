# Browserless hosted and self-hosted browser service

**Research date and source access:** 2026-08-17  
**Decision frame:** what Browserless teaches Curiosity about operating an
untrusted-web browser tier, and whether Browserless Cloud, Enterprise, or its
source-available core should be adopted, adapted, rejected, or deferred.  
**Clean-room boundary:** public documentation and the public repository were
read; no paid endpoint, account, container, proprietary image, or target site
was exercised, and no Browserless code was copied into Curiosity.

## 1. Executive verdict

Browserless is best understood as a **stateful browser-process broker**, not as
a safe retrieval boundary by itself. It combines Puppeteer/CDP and Playwright
WebSockets, task-oriented HTTP APIs, a process/queue limiter, browser profile
lifecycle, proxy plumbing, and management telemetry. Its commercial service
adds declarative BrowserQL/BAP, persistent sessions, replay, managed proxies,
captcha/stealth features, account metering, and managed or customer-operated
fleets [S1][S3][S6].

| Decision | Verdict | Confidence and reason |
| --- | --- | --- |
| Browserless Cloud as Curiosity's default renderer | **REJECTED as foundation** | High. It is a hosted, metered, stateful third-party execution plane; Curiosity would not own isolation, egress policy, evidence capture, or cost controls. |
| Enterprise self-hosted image | **DEFERRED pilot only** | Medium-high. It offers documented private-network blocking, roles, observability, persistence, and support, but the implementation is proprietary, pricing is custom, and security claims were not independently tested. |
| Public `browserless/browserless` core | **REJECTED for production multi-tenancy** | High. SSPL/commercial licensing is unsuitable without counsel; one shared token is an instance-wide trust domain; private-network blocking is disabled in the inspected base configuration; and arbitrary browser control remains intentionally powerful [S8][S9]. |
| Browserless protocol compatibility | **ADAPTED** | High. Standard Puppeteer/Playwright/CDP connection patterns and stateless task endpoints are useful adapter lessons, not an internal contract. |
| Per-job browser process/profile, bounded queue, hard deadline, deterministic cleanup | **ADOPTED as design lessons** | High. These mechanisms are visible in source and directly address state leakage and denial-of-wallet [S8]. |
| Persistent profiles/reconnects for general retrieval | **REJECTED by default; explicit workflow only** | High. They preserve cookies/cache or the whole live process and enlarge cross-request state, retention, affinity, and credential risks [S4][S5]. |

**Bottom line:** do not expose a Browserless-compatible, full-control browser
endpoint directly to Curiosity agents. Put any renderer behind a narrow,
provider-neutral fetch/render contract, an independently enforced egress
gateway, per-job identity and storage, strict response/time budgets, and an
evidence normalization boundary.

## 2. Method, labels, and limits

The public repository was inspected at commit
`888bf452e0401af5a1dca8aefe5c61224550fc95` (`@browserless.io/browserless`
2.55.4). Official docs, pricing, trust material, the repository, MongoDB's SSPL
text, and OSI licensing criteria were preferred. Vendor docs establish stated
behavior, not effective security or comparative performance. Search snippets
were leads only.

- **FACT** — directly supported by a cited primary source or inspected source.
- **INFERENCE** — reasoned from facts but not measured here.
- **RECOMMENDATION** — a proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

No live free or paid request was made. The hosted control plane, Enterprise
image, token database, BrowserQL implementation, fleet scheduler, billing
hooks, and private-network blocklist implementation were unavailable for source
inspection. SOC 2, GDPR, HIPAA/BAA, penetration-testing, isolation, and breach
statements are vendor assertions; audit reports were not obtained [S16].

## 3. Product boundary and request flow

### 3.1 Four overlapping products

**FACT (high):** the current commercial surface has four API styles [S2][S3]:

| Surface | Transport and authority | State model | Material boundary |
| --- | --- | --- | --- |
| BaaS v2 | WebSocket; standard Puppeteer/CDP or native Playwright | Full browser control; reconnect and persistent-session options | Highest flexibility and attack surface. |
| BrowserQL | HTTPS or WebSocket GraphQL mutations | Declarative workflow and reconnect | Commercial implementation; built-in stealth/captcha behavior is not in the public core. |
| BAP | TypeScript/Python typed SDK over BrowserQL | BrowserQL state model | Client convenience layer, not a distinct isolation plane. |
| REST | HTTPS task calls | Normally one browser per request, then close | `/content`, `/scrape`, `/screenshot`, `/pdf`, `/function`, `/download`, `/performance`, plus commercial `/smart-scrape`, `/search`, `/map`, `/export`, `/unblock`, and `/crawl`. |

**FACT (high):** shared Cloud uses regional multi-customer endpoints in San
Francisco, London, and Amsterdam. Enterprise private fleets use dedicated
regional endpoints. Customer-hosted Enterprise changes the host but is
documented as retaining the same REST, WebSocket, BQL, session, and CDP-extension
shapes [S2][S12].

**FACT (high):** the public repository exposes CDP/Puppeteer and Playwright
WebSockets; HTTP content, scrape, screenshot, PDF, function, download, and
Lighthouse performance routes; Chrome DevTools JSON routes; and instance-wide
management routes for sessions, kill, pressure, metrics, and configuration.
Chrome/Chromium/Edge have the richer HTTP/CDP surface; Firefox and WebKit are
Playwright WebSocket routes in this snapshot [S8].

**INFERENCE (high):** Browserless's commercial moat is not merely packaging a
browser. It is the uninspected multi-tenant control plane: account/token policy,
fleet placement, metering, persistent-profile storage, replay/log retention,
managed egress, anti-bot behavior, and operations.

### 3.2 Reconstructed control/data path

```text
token + route + launch/task parameters
  -> hosted account gateway OR self-hosted instance
  -> route authentication/schema hooks
  -> pre-request CPU/memory gate (optional in self-hosted core)
  -> per-instance concurrency limiter and FIFO-style queue
  -> launch browser process / allocate profile and scratch directories
  -> proxy CDP or Playwright frames, or run one HTTP task
  -> browser makes arbitrary target/subresource requests, optionally via proxy
  -> result stream / live WebSocket / persisted profile
  -> success, disconnect, timeout, crash, or explicit kill
  -> close process; remove temporary profile/scratch; record metrics/hooks
```

**FACT (high):** source route handlers acquire a browser through
`BrowserManager`, execute behind `Limiter` when `concurrency=true`, and release
the browser in `finally`. A job's measured start is reset when execution begins,
so queue wait is excluded from source job duration. Temporary profile and
scratch directories are deleted after browser shutdown with retry/backoff and a
five-minute orphan sweeper [S8].

## 4. Sessions and isolation

### 4.1 Ephemeral sessions

**FACT (high):** for CDP launches, the public core normally generates a fresh
user-data directory per session. It also creates a session-owned `TMPDIR`,
forces it into the child environment, and removes both on close; unexpected
browser disconnects are routed through cleanup. A caller-supplied
`userDataDir` is preserved and not deleted. Playwright `launchServer` manages
its own profile unless launch options alter that behavior [S8].

**FACT (high):** each browser connection normally consumes one limiter slot,
regardless of how many pages or browser contexts the client opens inside that
process. Source documentation recommends reusing a browser and opening pages,
which improves efficiency but makes those pages share one process-level fate
and, absent deliberate contexts, profile state [S13].

**INFERENCE (high):** fresh profile directories reduce cookie/cache leakage but
do not constitute a complete tenant sandbox. Sessions still share a container,
kernel, process user, network namespace, download/data roots, logs, management
plane, and instance token. Chromium is launched with `--no-sandbox`; the image
runs as an unprivileged `blessuser`, making the container/host boundary more
important [S8].

### 4.2 Live reconnect versus persisted profile

**FACT (high):** Browserless documents two materially different persistence
mechanisms [S4][S5]:

1. `Browserless.reconnect` keeps the same Puppeteer browser process alive for a
   bounded period. Open pages, memory, cookies, local storage, navigation, and
   form/scroll state survive. It requires disconnect rather than close.
2. `POST /session` provisions an isolated persistent `userDataDir`. After a
   normal disconnect the browser may stop, then a later process restores disk
   state (cookies, localStorage, cache) but opens blank. `processKeepAlive`
   optionally retains full live state. Only one client may attach to a persisted
   session at once; a second gets 429 rather than queueing.

**FACT (high):** persisted-session TTL maxima are documented as 1, 7, 30, and
90 days for Free, Prototyping, Starter, and Scale; Enterprise is custom. The
stop URL permanently deletes state. Reconnect TTL limits separately vary from
10 seconds on Free to five minutes on Scale, with custom Enterprise limits
[S4][S5].

**INFERENCE (high):** persistence changes the unit of isolation from “request”
to “named retained principal.” Session IDs, embedded-token connect/stop URLs,
profile encryption, deletion proofs, backup retention, worker affinity, and
single-writer enforcement all become security-critical.

### 4.3 Instance-wide visibility in the public core

**FACT (high):** in the inspected public core, `/sessions` returns all running
sessions to any holder of the configured instance token, including browser and
page IDs, reconnect/debug URLs, launch options, tracking IDs, and user-data-dir
paths. `/kill/<id|trackingId|all>` can terminate matching sessions. Reconnect
lookup is by browser/page ID within the instance, not by an owner recorded on
the source `BrowserlessSession` object [S8].

**FACT (high):** the source accepts a caller-supplied profile path in launch
options and treats it as caller-managed. Two mutually trusting clients can
therefore intentionally reuse state; the base manager does not attach a tenant
owner to that path [S8].

**INFERENCE (high):** the public core's single token should be treated as an
**instance administrator capability**, not as a multi-tenant API key. Separate
untrusted Curiosity principals require separate instances or a stronger outer
control plane; merely issuing the same token to several clients permits session
enumeration, attachment attempts, shared-profile selection, and termination.

## 5. Queueing, concurrency, and deadlines

### 5.1 Source behavior

**FACT (high):** the public limiter defaults to 10 running and 10 queued jobs.
Admission rejects with 429 when `running + queued` is full. Queued jobs begin as
slots free; queue alerts, rejects, running, successes, failures, and timeouts are
counted. Optional pre-admission health checks reject new work when CPU or memory
is over the configured threshold; already-running work continues [S8][S10].

**FACT (high):** `TIMEOUT` defaults to 30 seconds in the core/Enterprise Docker
configuration and may be overridden by `?timeout=` per request. In source, the
queue library's job timer applies to execution, while infrastructure can still
drop an idle queued connection. `TIMEOUT=-1` disables the execution deadline;
docs warn that leaked sessions can then exhaust capacity [S8][S10][S11].

**FACT (high):** reconnect, persisted-session TTL, navigation/wait, WebSocket
connection, live-view, queue/infrastructure idle, and outer reverse-proxy
timeouts are independent. Private-fleet docs state a five-minute session
default, unlike Docker's 30 seconds. Reverse-proxy idle/read timeouts must exceed
session deadlines, and Enterprise sends configurable heartbeats [S11].

**INFERENCE (high):** a single `timeout` field is not a safe contract. Curiosity
needs explicit admission deadline, browser wall-clock deadline, per-navigation
deadline, idle deadline, response byte cap, and retained-session TTL. Each must
have a server-side maximum that the caller cannot raise.

### 5.2 Documentation discrepancies retained

- **FACT (medium):** terminology says Cloud automatically queues up to twice a
  concurrency limit, while current pricing displays unexplained `+5`, `+10`, or
  `+20` beside paid concurrency. Self-hosted docs instead make `QUEUED`
  independently configurable. Exact Cloud queue limits and fairness are
  therefore **unknown** [S6][S14].
- **FACT (medium):** long-queue docs describe processing “in order,” and the
  source uses the npm `queue` package, but hosted cross-account fairness,
  priorities, starvation behavior, and regional spillover are not documented
  sufficiently to verify.
- **FACT (high):** queue capacity is local to a source instance. Fleet capacity
  is documented as workers multiplied by per-worker concurrency; the proprietary
  fleet dispatcher is not inspectable [S15].

## 6. Authentication, authorization, and metering

### 6.1 Tokens

**FACT (high):** Cloud requires an account token, usually shown in the query
string. Self-hosted core reads a token from either `?token=` or an Authorization
header; if `TOKEN` is unset, authenticated routes permit everyone. The server
shim removes query tokens and moves them into an Authorization header before
normal route handling, reducing subsequent URL propagation but not exposure in
the original client, intermediary, or access log [S2][S8][S10].

**FACT (high):** public-core token comparison is an inclusion check against the
configured token value; there is no source-level expiry, per-token quota,
session ownership, or role model. Enterprise self-hosted documents `admin`,
`developer`, `viewer`, and `public` roles plus persistent token management.
However, it also documents that any authenticated token can list token objects
containing full token strings and `createdBy` token strings; this surprising
behavior requires verification before adoption [S7][S8].

**FACT (high):** the public core's Chrome and Edge raw page-target WebSocket
route classes set `auth=false`, whereas the Chromium shared page route sets
`auth=true`; server authorization only runs when the matched route's `auth`
flag is true. Thus those raw target URLs act as bearer capabilities in the
inspected source. This conflicts with the broad documentation statement that
all APIs require a token. No live exploit check was performed [S8].

**RECOMMENDATION (high):** never put long-lived secrets in URLs returned to
agents. Use short-lived, audience-bound capabilities; strip secrets from logs
and traces; bind every session lookup and destructive operation to tenant and
job identity; and require distinct management authentication.

### 6.2 Metering and price

**FACT (high):** Cloud defines one unit as up to 30 seconds of browser time per
browser connection, rounding longer use into additional 30-second units.
Reconnects are new connections and incur a fresh unit. Built-in residential and
datacenter proxy traffic costs 6 and 2 units/MB respectively; a successful
captcha solve costs 10 units [S6].

**FACT (high):** annual-billing prices displayed on 2026-08-17 were: Free
(1,000 units, 2 concurrent, one-minute session); Prototyping $25/month (20,000,
10 `+5`, 15 minutes, $0.0020 overage); Starter $140/month (180,000, 40 `+10`,
30 minutes, $0.0017); Scale $350/month (500,000, 100 `+20`, 60 minutes,
$0.0015). Enterprise is custom and offers hosted private or licensed
self-hosting [S6].

**INFERENCE (medium):** billing by connection and 30-second ceiling creates an
incentive to batch pages in one browser, but that conflicts with strict
per-document isolation and makes failure attribution coarser. Proxy byte fees
also create denial-of-wallet risk from large media, downloads, redirects, and
streaming responses.

**UNKNOWN:** whether failed launches, queue wait, captcha attempts, streamed
bytes before abort, or provider retries consume hosted units. Source metrics
start at execution after queueing, but proprietary billing hooks were not
available; do not equate public-core metrics with invoices.

## 7. Proxies and state locality

**FACT (high):** Cloud offers managed residential (6 units/MB) and datacenter
(2 units/MB) networks with country/city targeting and sticky sessions. Plain
REST/BaaS requests rotate by default unless `proxySticky=true`; stealth,
BrowserQL, `/unblock`, `/scrape`, and `stealth=true` are sticky by default.
External proxies can be supplied by URL/launch option, including credentials
[S6][S17].

**FACT (high):** self-hosted Enterprise does not include residential proxy
credentials by default. Operators bring a proxy, purchase separate access, or
pass browser launch/BQL proxy settings. The public core passes `--proxy-server`
or Playwright proxy options through and adds Browserless's own host to a bypass
list so local function machinery remains reachable [S8][S12].

**INFERENCE (high):** proxy support is egress routing, not SSRF protection. A
caller-controlled bypass list, direct connections, proxy DNS semantics,
credentials in URLs, and sticky identity all need independent policy. Egress
must fail closed if the approved proxy is unavailable; otherwise a browser may
silently reveal the origin IP or reach internal services.

**RECOMMENDATION (high):** Curiosity should assign one egress policy and one
ephemeral proxy credential per job; prohibit arbitrary proxy servers and launch
flags from agents; meter compressed and decompressed bytes; and capture the
observed egress region/provider without storing proxy credentials.

## 8. SSRF, browser escape, and state-leak defenses

### 8.1 What the public core actually enforces

**FACT (high):** `file://` navigation is blocked by default and
`ALLOW_FILE_PROTOCOL` can disable that protection. Request payloads default to
a 10 MB cap. Sensitive top-level request-body fields are shallowly redacted for
logging. Browser processes run as a non-root image user, temporary downloads
and profiles are generated, and session cleanup handles normal completion,
timeouts, crashes, and transient directory deletion failures [S8].

**FACT (high):** the inspected base `Config.getBlockedNetworkRanges()` returns
`null`, explicitly disabling private-network navigation blocking. The source
contains a robust-looking opt-in matcher for loopback/private/metadata ranges,
alternate IPv4 encodings, IPv4-mapped IPv6, selected schemes, WebSocket
navigation frames, subresources, and redirects—but a downstream subclass must
supply the blocked ranges. Therefore the public core, by default, permits a
browser to reach network destinations visible from its container other than
blocked `file://` URLs [S8].

**FACT (high):** the public request/response guards classify URL host text; they
do not resolve arbitrary hostnames and compare the resulting address. An
`isBlockedNavigationIP` helper exists and is unit-tested, but no production use
was found in the inspected `src/` tree. A hostname resolving or rebinding to a
private address is therefore not stopped by this base URL matcher alone [S8].

**FACT (medium):** Enterprise docs describe a built-in blocklist for localhost,
private IPs, and cloud metadata, with `DISABLE_BLOCKLIST=false` by default.
That is consistent with an unavailable Enterprise subclass, not with the public
base configuration. Its DNS-rebinding behavior and full coverage could not be
verified [S10].

**FACT (high):** CDP Chromium is launched with `--no-sandbox`, and browser
clients receive broad DevTools/Playwright authority. `/function` accepts caller
code executed in an in-browser function runner with a browser connection. This
is not equivalent to running arbitrary Node code on the host, but it provides
browser-network and browser-data authority [S8].

### 8.2 Residual threats

| Threat | Observed defense | Residual/unknown |
| --- | --- | --- |
| SSRF to RFC1918/loopback/metadata | Enterprise claims default blocklist; source has opt-in URL/IP/frame backstops | Public base is off by default. DNS answer pinning/revalidation, rebinding, redirects across all protocols, service-mesh names, IPv6 edge cases, and enterprise implementation remain unverified. |
| Local file read | `file://` disabled by default | Caller launch flags, browser vulnerabilities, downloads, mounted volumes, and other schemes still require containment. |
| Browser escape | Non-root container user; image/browser updates | Chromium `--no-sandbox`; shared kernel/container boundary; patch latency and seccomp/capability profile not documented in inspected source. |
| Cross-session browser state | Fresh CDP profile and scratch dirs; cleanup/retry | Manual profile paths, persistent profiles, shared container services, logs, management endpoints, and source instance-wide token. |
| Session hijack | Token on most routes; random browser/page IDs | Returned URLs embed tokens; Chrome/Edge raw page target routes are source capability URLs; hosted owner binding unverified. |
| Data remanence | Temp-dir deletion and persisted-session TTL/stop | Cloud backup deletion, encryption-key boundaries, crash/OOM disks, replay/log copies, and deletion evidence unknown. |
| Resource exhaustion | Concurrency/queue caps, deadlines, optional CPU/memory gate | Unlimited timeout/reconnect settings, pages/contexts inside one connection, downloads, profile growth, decompression, bandwidth, and OOM can exceed session-count controls. |
| Secret leakage | Query-token shim; shallow body redaction | Original URLs, nested secrets, launch options, proxy URLs, page content, console logs, `/sessions`, config/metrics, replay, and traces require separate redaction. |

**INFERENCE (high):** Browserless's limiter bounds **browser connections**, not
all work. One admitted CDP client can open many pages, navigate repeatedly,
download large files, consume proxy bandwidth, retain a browser, or allocate
large in-browser objects. Curiosity needs nested limits inside each admitted
session.

**RECOMMENDATION (high):** deploy rendering workers in disposable pods/VMs with
no workload credentials, read-only root filesystem, minimal mounts and Linux
capabilities, browser sandbox retained where feasible, isolated `/tmp` and
`/dev/shm`, enforced memory/CPU/pid/disk/network quotas, and an external DNS+
egress policy that rechecks every redirect and resolved address. Treat HTML,
PDFs, screenshots, downloads, console output, and extracted text as untrusted.

## 9. Deployment and operations

**FACT (high):** commercial options are shared Cloud, Browserless-managed
private fleet, customer-hosted Enterprise image from a private registry, and
the public source-available images. Enterprise licensing uses a `KEY` distinct
from the request `TOKEN`; docs state time-limited offline keys need no callback
[S1][S10][S12][S20].

**FACT (high):** the Enterprise guide recommends version pinning, at least 2 CPU
and 4 GB RAM, 2 GB shared memory, resource limits, persisted data/download/
metrics volumes, health checks, structured logs/OpenTelemetry, and multiple
containers behind a load balancer. Example sizing rises from 5–10 sessions on
2 CPU/4 GB to 20–50 on 8+ CPU/16+ GB, but this is vendor guidance, not a
benchmark [S10][S13].

**FACT (high):** `/pressure` exposes CPU, memory, availability, running/queued
counts, maxima, rejection recency, and reason. Queue/reject/timeout/error/failed-
health webhooks and metrics are available. Operators remain responsible for
container orchestration, scaling, updates, registry availability, logs,
backups, and local metrics in self-hosted deployments [S10][S12][S13].

**FACT (high):** sessions are worker-stateful. Reconnect/live URLs must return
to the originating worker; a shared load-balancer address without affinity can
misroute. Browserless recommends direct per-instance addresses in returned
URLs. This complicates draining, failover, network exposure, and zero-downtime
upgrades [S18].

**INFERENCE (high):** automatic retry of non-idempotent browser requests is
unsafe unless the operation has an idempotency key and no session was created
on the first worker. The documented NGINX example retries 429 and
`non_idempotent`; Curiosity should not copy that behavior blindly [S18].

**RECOMMENDATION (high):** use admission-aware load balancing only for new
jobs; pin live sessions by opaque worker routing metadata; drain rather than
retry active sessions; report queue delay separately from execution; and canary
browser/image updates against deterministic fixtures and hostile pages.

## 10. Hosted versus source-available and licensing

| Capability | Public repository/image | Commercial Cloud / Enterprise |
| --- | --- | --- |
| Browser WebSockets | Yes: CDP/Puppeteer and Playwright | Yes, shared/private/self-hosted endpoints |
| Core task HTTP APIs | Content, scrape, screenshot, PDF, function, download, performance | Those plus documented smart scrape/search/map/export/unblock/crawl |
| Queue/timeout/profile cleanup | Yes, per instance | Yes; account/fleet policy adds proprietary behavior |
| Authentication | Optional instance-wide token, no source roles | Cloud account tokens; Enterprise roles/token API |
| Persistent Session API/replay | Not present as the documented premium implementation | Plan-bounded persistence and replay |
| Managed proxy/captcha/stealth | Basic proxy/stealth launch plumbing only | Managed proxy units, BrowserQL/BAP, captcha and advanced stealth |
| Network blocklist | Matcher exists, private ranges disabled in base config | Enterprise docs claim enabled by default |
| Operations | Operator owns everything | Managed shared/private fleet or supported private image |

**FACT (high):** the repository is dual-licensed `SSPL-1.0 OR Browserless
Commercial License`. Its README says proprietary commercial sites,
applications, and closed-source CI need a commercial license. SSPL section 13
requires anyone offering the program or a modified version as a service to make
the broadly defined “Service Source Code” available under SSPL [S1][S8][S9].

**FACT (high):** Browserless markets the public option as “Open Source,” but
SSPL is not on OSI's approved-license list; OSI says only software under an
OSI-approved license should be labeled Open Source. This report therefore uses
**source-available**, while accurately preserving Browserless's own wording
where quoted [S19].

**RECOMMENDATION (high):** do not copy, modify, link, package, deploy, or offer
Browserless source as part of Curiosity without written legal review and either
a commercial license or an approved SSPL compliance plan. Protocol observation,
independent contracts, and standard Puppeteer/CDP interoperability are safer
clean-room inputs than implementation reuse. This is not legal advice.

## 11. Clean-room lessons for Curiosity

### 11.1 Adopt

1. **Admission before launch:** bounded running and queued counts; reject early
   with stable retry semantics.
2. **Separate queue and execution clocks:** expose both; billing/cost begins only
   under an explicit rule.
3. **Per-job filesystem ownership:** unique profile/download/scratch locations,
   shutdown-before-delete, retries, and orphan sweeping.
4. **Crash-aware lifecycle:** browser disconnect, client abort, timeout, and
   service shutdown converge on one idempotent cleanup path.
5. **Pressure reporting:** running, queued, rejected, CPU, memory, and reason,
   without exposing tenant/session secrets.
6. **Stateless convenience operations:** screenshot, PDF, and rendered-content
   adapters can be narrow and independently budgeted.

### 11.2 Adapt, do not copy

1. Keep a provider-neutral `render_fetch` contract separate from a Browserless
   adapter. Do not expose launch args, CDP, arbitrary functions, management APIs,
   or provider token fields to the researcher.
2. Return capture metadata: requested/final URL, redirect chain, resolved IP
   class, fetch/render timestamps, browser/extractor versions, content type,
   byte counts, truncation, HTTP status, provenance hash, and bounded failures.
3. Use one fresh browser context/process per job. Persistent identities require
   explicit caller authority, a named purpose, short TTL, encrypted storage,
   single-writer lease, owner binding, and auditable deletion.
4. Put egress enforcement outside the browser: URL policy before admission,
   DNS/IP checks at connection time, redirect/subresource checks, proxy
   fail-closed behavior, and blocked metadata/private/service ranges.
5. Layer quotas: sessions, pages, navigations, redirects, requests, wall time,
   idle time, CPU, memory, pids, disk, response bytes, proxy bytes, and retained
   state.
6. Use short-lived workload identity in headers or mTLS. Management identity is
   separate; agents never receive list/kill/config/metrics capabilities.

### 11.3 Reject

- Shared tokens across Curiosity tenants or workers.
- Unbounded `timeout=-1`, infinite reconnect, arbitrary profile paths, launch
  flags, proxy servers, extensions, server-side functions, or raw CDP.
- Browser-side blocklists as the sole SSRF control.
- Reusing a browser/profile merely to reduce 30-second billing units.
- Treating a successful render as trusted evidence or storing replay/profile
  data by default.
- Automatic cross-worker retry of non-idempotent/live-session operations.

### 11.4 Minimal proposed contract

```text
RenderRequest {
  url, job_id, tenant_id,
  mode: static|rendered,
  admission_deadline_ms, wall_deadline_ms, navigation_deadline_ms,
  max_redirects, max_requests, max_response_bytes,
  egress_policy_id, storage_policy: ephemeral
}

RenderEvidence {
  requested_url, final_url, redirect_chain,
  observed_at, status, media_type,
  capture_id, content_hash, browser_version, extractor_version,
  bytes_received, truncated, policy_events[], failures[]
}
```

**RECOMMENDATION (high):** static HTTP remains first choice. Escalate to the
browser only when policy-authorized evidence requires JavaScript. This keeps the
browser tier an expensive, hostile-content parser rather than Curiosity's
general network client.

## 12. Verification checks before any pilot

1. Obtain the exact Enterprise image digest, SBOM, commercial terms, support/
   security SLA, vulnerability policy, audit report, DPA/subprocessor list, data
   residency, retention/deletion, backup, and incident-notification terms.
2. Ask Browserless to document tenant binding for session IDs, reconnect URLs,
   `/sessions`, `/kill`, debug/live URLs, roles, logs, replay, and persisted
   profiles. Verify that viewer/developer tokens cannot enumerate full token
   strings or other tenants.
3. In an authorized isolated test environment, test loopback, RFC1918, link-
   local, metadata, IPv6, mapped IPv4, alternate IP notation, redirects, DNS
   rebinding, WebSockets, service names, subresources, downloads, and proxy
   failure. Do not test the shared hosted service without written permission.
4. Verify fresh process/profile per job; cross-session cookies/cache/storage/
   service workers; crash/OOM/timeout cleanup; retained-volume and backup
   deletion; and no credentials in URLs, logs, metrics, traces, hooks, replay,
   screenshots, or session listings.
5. Load-test with Curiosity's own bounded corpus: cold/warm launch, queue delay,
   p50/p95/p99 completion, success by page class, memory high-water, disk leak,
   proxy bytes, unit cost, and failures during rolling drain.
6. Confirm queue fairness, cancellation of queued/disconnected requests,
   idempotency behavior, exact billed events, overage hard caps, and retry-after
   semantics in writing.

## 13. Unknowns and negative results

- **UNKNOWN:** hosted worker/container/process isolation granularity and whether
  customers ever share a browser process, VM, network namespace, profile store,
  proxy credential, encryption key, or cache. Marketing says containerized and
  isolated; architecture evidence was unavailable [S16].
- **UNKNOWN:** Enterprise private-range set, DNS resolver behavior, rebinding
  resistance, redirect-time re-resolution, browser protocol coverage, and
  whether `DISABLE_BLOCKLIST` can be restricted by role.
- **UNKNOWN:** hosted queue algorithm, account fairness, priority behavior,
  cancellation, regional failover, and the meaning of pricing's `+N`
  concurrency notation.
- **UNKNOWN:** exact Cloud billing for failed/aborted/queued/retried work and
  bytes; no invoice or paid test was authorized.
- **UNKNOWN:** encryption and deletion guarantees for profiles, replay, logs,
  downloads, backups, and returned URLs; no audit artifacts were accessed.
- **UNKNOWN:** Enterprise code parity with the public 2.55.4 source. The docs'
  example `enterprise:2.3.0` tag is not evidence of semantic parity.
- **NEGATIVE RESULT:** no public source for BrowserQL, BAP server, persistent
  Session API, commercial token roles, hosted scheduler/meter, or Enterprise
  blocklist was found in the inspected repository.
- **NEGATIVE RESULT:** no independent comparative benchmark or reproducible
  Browserless security assessment was found within the bounded primary-source
  pass. Vendor testimonials and marketing claims were not used as proof.

## 14. Curiosity pass and stop decision

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Reconcile “built-in SSRF blocklist” with public source | 5 | 5 | 5 | 2 | **Pursued:** source base returns `null`; Enterprise docs describe a proprietary/default-on layer. This materially changed the public-core verdict. |
| Inspect session ownership and raw target authentication | 5 | 5 | 5 | 2 | **Pursued:** source sessions are instance-wide and Chrome/Edge raw page routes are capability URLs. Added explicit verification gate. |
| Reconcile queue/time/billing boundaries | 5 | 4 | 4 | 2 | **Pursued:** source excludes queue wait from job duration, but hosted billing remains unknown and docs conflict on queue size. |
| Exercise hosted SSRF or cross-session access | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: no written authorization; could affect shared infrastructure or customer data. |
| Pull/run Enterprise image | 5 | 5 | 3 | 5 | `CURIOSITY_NO_GO`: private registry, commercial key, and paid access unavailable; prohibited by scope. |
| Give definitive SSPL legal advice | 5 | 5 | 2 | 5 | `CURIOSITY_NO_GO`: counsel decision outside research authority. License facts and review gate retained. |
| Benchmark Cloud pricing/performance | 3 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: paid tests and a representative workload/SLO were absent. |
| Reverse engineer proprietary BrowserQL/Enterprise code | 2 | 3 | 4 | 5 | `CURIOSITY_NO_GO`: unavailable, unnecessary, and outside clean-room/access boundaries. |

**Coverage:** APIs/isolation, queues/concurrency, auth/metering/timeouts,
proxies/persistence, SSRF/state leakage, deployment/operations/pricing,
hosted-versus-source licensing, and Curiosity implications are all represented.
**Saturation:** later sources repeated the same capability and operations classes
without resolving proprietary implementation unknowns. **Stop:** coverage and
primary-source saturation reached; live/paid/security testing requires separate
caller authority.

## 15. Primary bibliography

All sources accessed 2026-08-17.

1. **[S1] Browserless repository README.**
   https://github.com/browserless/browserless/blob/888bf452e0401af5a1dca8aefe5c61224550fc95/README.md
   — product tiers, public/premium feature boundary, deployment options, and
   Browserless's licensing statement.
2. **[S2] Browserless, Connection URLs and Endpoints.**
   https://docs.browserless.io/overview/connection-urls — shared/private regions,
   transports, browser routes, tokens, and REST examples.
3. **[S3] Browserless, API Comparison and REST APIs.**
   https://docs.browserless.io/overview/comparison and
   https://docs.browserless.io/rest-apis/intro — BAP/BQL/BaaS/REST boundaries,
   API inventory, and stateless REST limitations.
4. **[S4] Browserless, Persisting State.**
   https://docs.browserless.io/baas/session-management/persisting-state — Session
   API lifecycle, isolated profile claim, TTL, one-client lease, and deletion.
5. **[S5] Browserless, Standard Sessions.**
   https://docs.browserless.io/baas/session-management/standard-sessions — live
   reconnect semantics, token requirement, and plan TTL limits.
6. **[S6] Browserless pricing.** https://browserless.io/pricing — current annual
   prices, concurrency notation, units, overages, proxy/captcha costs, retention,
   and Enterprise boundary.
7. **[S7] Browserless, Token Roles and Permissions.**
   https://docs.browserless.io/enterprise/token-roles — Enterprise roles,
   self-hosted token API, persistence, and documented response fields.
8. **[S8] Browserless public source at inspected commit.**
   https://github.com/browserless/browserless/tree/888bf452e0401af5a1dca8aefe5c61224550fc95 — specifically `src/config.ts`,
   `src/network-security.ts`, `src/token.ts`, `src/server.ts`, `src/router.ts`,
   `src/limiter.ts`, `src/browsers/`, `src/shared/`, `src/routes/management/`,
   `src/utils.ts`, and `docker/`; direct implementation evidence for this report.
9. **[S9] Browserless LICENSE; MongoDB SSPL v1.**
   https://github.com/browserless/browserless/blob/888bf452e0401af5a1dca8aefe5c61224550fc95/LICENSE and
   https://www.mongodb.com/licensing/server-side-public-license — dual-license
   identifier and SSPL section 13 service-source obligation.
10. **[S10] Browserless, Docker Configuration Reference.**
    https://docs.browserless.io/enterprise/docker/config — auth/license keys,
    queue/deadline defaults, storage, security, blocklist claim, metrics, and
    webhooks.
11. **[S11] Browserless, Timeouts.**
    https://docs.browserless.io/enterprise/private-deployment/timeouts — layered
    deadlines, private-fleet default, heartbeats, and proxy alignment.
12. **[S12] Browserless, Migrating from Cloud to Self-Hosted.**
    https://docs.browserless.io/enterprise/docker/cloud-to-self-hosted — API
    parity claim, operator duties, proxy difference, and migration hazards.
13. **[S13] Browserless, Enterprise Deployment Guide and Production Best Practices.**
    https://docs.browserless.io/enterprise/docker/enterprise-image and
    https://docs.browserless.io/enterprise/docker/best-practices — images,
    sizing, shared memory, hardening, monitoring, persistence, and scaling.
14. **[S14] Browserless, Terminology.**
    https://docs.browserless.io/enterprise/terminology — worker/session,
    automatic queue statement, concurrency, and pressure definitions.
15. **[S15] Browserless, Performance and Capacity.**
    https://docs.browserless.io/enterprise/private-deployment/performance — fleet
    capacity, overload rejection, burst behavior, drift, and relaunch operations.
16. **[S16] Browserless Trust Center.** https://browserless.io/trust — vendor
    security, compliance, data residency, retention, and incident assertions;
    treated as self-attestation absent audit artifacts.
17. **[S17] Browserless, Proxies.**
    https://docs.browserless.io/baas/features/proxies — managed/external proxy
    mechanics, cost, sticky behavior, and geotargeting.
18. **[S18] Browserless, NGINX Load Balancing.**
    https://docs.browserless.io/enterprise/docker/nginx-load-balancing —
    per-worker affinity, pressure routing, retry example, and external addresses.
19. **[S19] Open Source Initiative, Frequently Answered Questions.**
    https://opensource.org/faq/#approved-licenses-only and
    https://opensource.org/licenses — OSI criteria for the “Open Source” label
    and approved-license authority; SSPL is not listed.
20. **[S20] Browserless, OpenAPI Reference Overview.**
    https://docs.browserless.io/open-api — Enterprise/Cloud API boundary and
    time-limited offline software-key behavior.
