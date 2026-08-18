# Chromium as hostile-web rendering infrastructure

**Date:** 2026-08-17

**Decision:** whether and how Chromium may serve as Curiosity's selective,
hostile-web rendering lane without turning a browser into a trusted crawler,
an SSRF relay, or a cross-job persistence boundary.

**Status:** clean-room research recommendation; not an implementation,
dependency approval, deployment record, or security certification.

**Source access date:** all web sources were accessed 2026-08-17.

## Executive verdict

**ADAPT, behind a second containment boundary (high confidence):** Chromium is
the practical behavioral reference and a plausible replaceable renderer for
pages whose useful content cannot be obtained by bounded static HTTP. Its
multi-process architecture, desktop Site Isolation, renderer sandbox, mature
navigation model, and unified Headless mode are substantial defenses. They do
not make it safe to expose Chromium directly to arbitrary URLs.

For Curiosity, the browser must be a disposable, uncredentialed worker behind
an independently enforced egress proxy and a VM/microVM or equivalently reviewed
host boundary. One render job gets a fresh browser process and profile, no
downloads, no extensions, no shared cache or service-worker state, no access to
the control plane or private networks, hard wall/CPU/memory/PID/byte/output
budgets, and destruction on success, timeout, crash, or protocol loss. Keep the
existing static-fetch-first rule and require measured incremental extraction
value before rendering a URL.

**REJECT (high confidence):** `--no-sandbox`, single-process mode, a shared
long-lived profile, browser contexts as the only tenant boundary, a directly
reachable DevTools endpoint, CDP interception as the only SSRF defense, or
Chrome for Testing merely because its binaries are conveniently pin-able.
Chrome's own documentation says Chrome for Testing should consume only trusted
content [S14].

## 1. Frame, questions, method

### 1.1 Bounded sub-questions

1. Which Chromium process and site boundaries still hold after a renderer is
   compromised?
2. Which privileged processes, network paths, persisted workers, downloads,
   and navigation states remain dangerous to a hostile-content service?
3. Which limits are native to Chromium, and which must be imposed outside it?
4. What can Headless capture reproducibly, and what does “done” mean?
5. What are the patch, capacity, observability, license, and clean-room costs?
6. Which lessons transfer to Curiosity without copying Chromium code or
   mistaking browser defenses for infrastructure policy?

### 1.2 Method and evidence labels

Primary Chromium design/security documents, Chromium repository policy and
license files, Chrome Headless documentation, and the Chrome DevTools Protocol
(CDP) were preferred. Source was read to understand published architecture, not
to reproduce implementation. No Chromium code, binary, page content, or test
fixture was copied; no hostile page was executed; no live benchmark or exploit
test was run.

- **FACT** — directly stated by a cited primary source.
- **INFERENCE** — architectural conclusion from cited facts; not measured here.
- **RECOMMENDATION** — Curiosity-specific control or decision.
- Confidence is **high**, **medium**, or **low**.

The analysis targets desktop Linux-style render workers. Platform sandboxes
differ materially; Android WebView and iOS are not substitutes for the desktop
model [S2, S4]. Source documents sometimes lag current Stable behavior. Each
candidate binary therefore needs a version-specific verification run.

## 2. Trust model: what Chromium is and is not

```text
untrusted URL + caller policy
  -> admission/static-fetch quality gate
  -> public-only DNS/egress proxy (revalidates every connect/redirect)
  -> disposable VM/microVM + unprivileged OS identity + hard resource limits
  -> one fresh Chromium process/profile/job
       browser process (privileged control and policy broker)
       network service (privileged network parser/request path on Linux)
       site-locked renderer processes (sandboxed)
       GPU and sandboxed utility processes
  -> bounded DOM/text/screenshot/PDF + request/redirect manifest
  -> type/size validation and untrusted-evidence marking
  -> worker and all storage destroyed
```

**FACT (high):** Chromium explicitly assumes sandboxed code is malicious and
its Site Isolation threat model assumes determined attackers will compromise a
renderer [S3, S2]. A compromised renderer can execute native code inside its
sandbox and forge IPC to more privileged browser components [S5].

**INFERENCE (high):** renderer compromise is a planned-for intermediate state,
not an exceptional premise. The render service must therefore survive both a
renderer exploit and attempts to exploit the browser, network service, GPU,
kernel, or orchestration around it.

**FACT (high):** the browser process is the sandbox broker and remains
unsandboxed. Chromium's platform summary (last updated for M128) also lists the
network service as unsandboxed on Linux, Windows, and Android; the GPU process
is platform-dependent [S3, S4]. The network service's trusted interfaces are
intended for the browser, not renderers [S8].

**RECOMMENDATION (high):** treat full browser-process or network-process
compromise as credible. A normal container shares the host kernel and is not by
itself the desired final blast-radius boundary. Prefer one-job microVMs/VMs, or
document an independently reviewed equivalent using namespaces, seccomp,
mandatory access control, read-only images, no host mounts, and no ambient
credentials. Never depend on Chromium's sandbox alone.

## 3. Process model, Site Isolation, and sandbox

### 3.1 Useful guarantees

**FACT (high):** Chromium separates the browser, renderers, GPU, network, and
other services. Renderer crashes/hangs can be detected without necessarily
taking down other content [S1]. Desktop full Site Isolation locks a renderer to
one site (scheme plus eTLD+1), places cross-site frames into other processes,
and adds browser-enforced authorization and response filtering [S2]. Process
locks are assigned before content and remain stable for a RenderProcessHost;
the browser checks IPC claims against those locks [S2, S5].

**FACT (high):** Site Isolation is site-, not universally origin-, scoped for
compatibility. Same-site origins may share a process; `file:` has coarse
handling; `data:` and initial empty documents have inherited/special behavior.
Chromium may reuse suitable same-site renderer processes and has a soft process
limit, although cross-site isolation can exceed it [S2].

**INFERENCE (high):** Site Isolation protects one site from another; it is not
a per-customer or per-render-job boundary. Sharing one browser across jobs can
create same-site process reuse, shared browser/network privileged state, and a
single browser-process failure domain even when BrowserContexts differ.

**RECOMMENDATION (high):** use a whole fresh browser process/profile per hostile
job for the security baseline. Pool only already-booted, never-navigated VMs or
workers; do not return a browser that has processed a URL to the pool. Retain
desktop full Site Isolation and verify it in every image. Do not enable
single-process mode or flags that disable Site Isolation/web security.

### 3.2 Sandbox properties and limits

**FACT (high):** the sandbox uses OS controls and a broker/target model to deny
renderers direct filesystem and network access; allowed operations are mediated
by privileged processes. Linux combines namespaces and seccomp-BPF where the
kernel supports them, reducing both capability and exposed syscall surface
[S3, S4]. Chromium's Rule of Two says code handling untrusted input should not
also combine unsafe language and high privilege [S6].

**FACT (high):** sandbox assurances are OS- and configuration-dependent. The
Linux document says strength varies with kernel features. The sandbox cannot
protect against kernel bugs; privileged broker IPC remains attack surface.
Chromium's own sandbox FAQ calls it a strong last defense, not a silver bullet
[S3, S4].

**FACT (high):** Chromium describes CPU and memory as resources sandboxed code
can freely use. Its Windows design notes that Job Objects could limit excessive
CPU, memory, and I/O but Chromium did not do so there [S3].

**RECOMMENDATION (high):** verify `chrome://sandbox`/equivalent diagnostics in
image qualification, then remove access to internal schemes in production.
Run as a non-root user with the browser sandbox active. Enforce CPU, memory,
PIDs, open files, disk, process wall time, network bytes, request count, response
size, output pixels/pages/bytes, and concurrent jobs outside Chromium. Kill the
entire VM/job, not merely a tab, on any breach.

## 4. Network, SSRF, workers, storage, and downloads

### 4.1 Network service and SSRF

**FACT (high):** renderers normally obtain network access through Chromium's
network service. The service handles low-level HTTP, sockets, and WebSockets;
its out-of-process form is preferred for stability, but on Linux the process is
still listed as unsandboxed in Chromium's platform matrix [S8, S4]. Browser-side
factories bind requests to initiator/site authority and enforce CORS/ORB/CORP
before responses reach a renderer [S5].

**INFERENCE (high):** same-origin, CORS, ORB, and Site Isolation defend web
origins from each other; they are not an infrastructure SSRF policy. A hostile
page is expected to request cross-origin images, scripts, media, fetches,
WebSockets, workers, and redirects. Even if response bytes are hidden from
JavaScript, connection attempts can scan or trigger internal services.

**RECOMMENDATION (high):** the worker network namespace may reach only a
project-controlled egress proxy/resolver and required time/update endpoints
(preferably none during a job). The proxy must:

- accept only approved public `http`/`https` destinations and ports;
- resolve itself, reject loopback, link-local, private, carrier-grade NAT,
  multicast, unspecified, documentation/reserved, IPv4-mapped, and project
  control-plane/cloud-metadata ranges, for every address family;
- re-resolve/revalidate each redirect and connection, bind the checked address
  to the connection, and resist DNS rebinding/alternate-address fallback;
- cap redirects, requests, DNS answers, response bytes, decompressed bytes,
  connection time, total bytes, sockets, and bandwidth;
- deny direct UDP, QUIC if the proxy cannot mediate it, WebRTC peer paths,
  WebTransport/direct sockets, proxy bypass, non-HTTP schemes, and arbitrary
  CONNECT tunnels;
- strip ambient proxy credentials and never expose cookies, client certs,
  cloud credentials, SSH agents, or internal CA material;
- log bounded destination/decision metadata, not unrestricted bodies or
  secrets.

CDP request observation/interception is useful telemetry and defense in depth,
but events can race the actual network path and protocol clients can disconnect.
It is **REJECTED** as the primary SSRF barrier (high confidence).

### 4.2 Service workers and persistent state

**FACT (high):** service workers execute in origin-associated sandboxed renderer
processes, can intercept requests, and their registration persists like other
origin storage even though running workers are eventually terminated. The cited
Chromium FAQ says neither the specification nor then-current Chrome defined a
limit on the number of service workers [S9]. CDP exposes explicit service-worker
bypass, cache disabling, storage usage/quota, service-worker/cache storage
clearing, and disposable BrowserContexts [S10, S12].

**INFERENCE (high):** a reused profile can let one job influence a later job's
network responses and consume storage/process resources. Incognito-like
BrowserContexts reduce storage sharing but are controlled by the same privileged
browser process and are not a hard compromise boundary.

**RECOMMENDATION (high):** use a new on-disk profile in ephemeral storage for
each browser/job, bypass service workers for retrieval captures unless worker
behavior is the explicit reason to render, disable cache, and destroy the whole
profile afterward. Context disposal/clear-storage calls are cleanup checks, not
a substitute for destruction. Record whether any response came from a worker
or cache.

### 4.3 Downloads, file access, prompts, and capabilities

**FACT (high):** a navigation can turn into a download due to
`Content-Disposition`; CDP's navigation result reports this. CDP can deny all
downloads, intercept/cancel file chooser dialogs, reset/deny permissions, and
dispose a context without running `beforeunload` [S7, S10, S11].

**RECOMMENDATION (high):** deny downloads at browser policy/CDP and filesystem
levels; treat a download navigation as a typed non-render result. Mount no host
directories, secrets, or writable executable paths. Deny file choosers,
clipboard, notifications, geolocation, sensors, camera/microphone, MIDI/USB/
Bluetooth, local fonts, local-network access, payment/background APIs, external
protocol handlers, popups, extensions, and privileged/internal schemes. If a
PDF or other document must be rendered, route its already bounded capture
through a separately reviewed type-specific lane rather than permitting a
general download side effect.

## 5. Navigation and lifecycle: “loaded” is not “ready”

**FACT (high):** Chromium separates navigation from loading. Navigation
includes request/redirect, response processing, renderer selection, and commit;
loading then parses, executes scripts, renders, and fetches subresources. A
successful commit can still have later load failures [S7]. Same-document
navigations, client redirects, concurrent frame navigations, cache, service
workers, `data:` pages, and downloads have different paths [S7].

**FACT (high):** CDP exposes frame/loader IDs, redirects, DOMContentLoaded,
load, lifecycle events, request/response/finish/failure, JavaScript dialogs,
target crashes, and explicit stop-loading. A dialog can stall execution when no
handler exists [S10, S11, S12].

**INFERENCE (high):** no single event proves that a modern or adversarial page
is “done.” `DOMContentLoaded` may precede useful fetches; `load` may never fire;
network-idle can be defeated by polling/WebSockets; DOM stability can be
defeated by animations; SPAs may change content without a new document.

**RECOMMENDATION (high):** define a versioned capture policy, not a generic
“wait until loaded” switch:

1. validate the admitted URL and start an immutable redirect/request manifest;
2. apply a hard wall deadline before navigation;
3. track the expected main-frame `frameId` and `loaderId`, authoritative commit,
   redirects, same-document changes, popups/targets, and download conversion;
4. auto-dismiss dialogs, deny new windows, and stop after bounded DOM/content
   stability plus bounded network quiet, without waiting forever;
5. capture at an explicit readiness reason (`load`, bounded quiet/stability,
   virtual-time budget, or hard-deadline partial);
6. stop loading, obtain bounded outputs, record late/failed requests, and
   destroy the worker.

Capture partial results with a reason rather than silently treating timeout as
success. Never run `beforeunload` as a prerequisite for cleanup.

## 6. Headless and deterministic capture

### 6.1 What Headless supplies

**FACT (high):** since Chrome 112, normal Headless creates but does not display
platform windows and shares the full Chrome implementation; old Headless is a
separate `chrome-headless-shell` from Chrome 132 onward [S13]. Headless supports
DOM serialization after script execution, screenshots, PDF, a wall timeout,
and virtual-time budgets [S15]. CDP exposes screenshot, PDF, MHTML snapshot,
viewport/device/media/font/locale/timezone/user-agent overrides, lifecycle
events, and virtual time [S10, S11].

**INFERENCE (high):** unified Headless is the closer rendering oracle because it
shares normal Chrome behavior. The lighter legacy shell may be cheaper, but its
separate implementation and deprecation make it a poor long-lived fidelity
baseline. Neither mode is a security boundary.

### 6.2 Reproducibility limits

**FACT (high):** virtual time replaces real time for frames and can fast-forward
scheduled tasks; its policy may pause while network fetches are pending and it
has a starvation bound [S11]. PDF defaults can include date/URL headers, and
screen capture depends on viewport/surface choices [S10, S15]. Chrome for
Testing exists partly because auto-updates break repeatability and supplies
versioned binaries, but its documentation restricts it to trusted content
[S14].

**INFERENCE (high):** virtual time is scheduler control, not deterministic web
replay. Live DNS/content, server timing, random values, ads, A/B tests, service
workers, font availability, GPU/driver behavior, color management, locale,
timezone, device scale, browser revision, and races can all change DOM or
pixels. A live rerender cannot be expected to reproduce a byte-identical image.

**RECOMMENDATION (high):** pin and record exact browser revision/build source,
CDP protocol version, OS image/kernel, sandbox status, fonts and font hashes,
locale/language/timezone, viewport/device scale/color/media preferences, GPU
mode/driver, user agent/client hints, capture policy, virtual-time parameters,
and output encoder settings. Disable animations/transitions only if the capture
contract explicitly permits modifying presentation. Omit PDF headers/footers or
make them fixed. Never claim deterministic capture from a live page; call it a
repeatable environment and preserve source response/capture IDs.

For byte-level replay, use authorized frozen response fixtures behind the same
egress gate and record every substituted resource. MHTML is an experimental CDP
snapshot format, not proof that all active state or future rendering is
reproducible [S10].

## 7. Resource quotas, abuse, and outputs

Chromium's origin storage quota and DevTools network buffer limits are not
tenant CPU, memory, fetch-byte, or billing limits. CDP reports storage usage and
can override an origin quota, while `Network.enable` buffer sizes cap retained
protocol payload—not necessarily bytes Chromium fetches [S12].

**RECOMMENDATION (high):** enforce a job envelope externally:

| Dimension | Required hard control | Evidence to retain |
| --- | --- | --- |
| Time/compute | queue deadline, wall timeout, CPU quota, throttling/kill | queue/start/commit/capture/kill times; CPU-seconds |
| Memory/processes | VM/container memory, swap policy, PID/process count | peak RSS, OOM/kill reason, renderer/GPU/network crashes |
| Network | request/socket/redirect/DNS/byte/rate limits at proxy | allowed/denied destinations, encoded bytes, reason codes |
| Storage | tiny ephemeral disk/profile; no persistent mounts | peak bytes/inodes, service-worker/cache presence |
| Visual output | viewport and full-page height/pixel/page/byte caps | dimensions, truncation, encoder, output hash |
| DOM/text | serialized and extracted byte/node/depth caps | omitted/truncated flags, content hashes |
| Concurrency | per-tenant/global queues and admission budgets | accepted/rejected counts, render reason, marginal gain |

Pages can intentionally create many frames/sites (raising process and memory
count), allocate JavaScript/Wasm memory, decode pathological media/images, run
busy loops, grow layout height, keep sockets open, or continuously mutate. The
only reliable completion action is destruction of the complete job boundary.

## 8. Renderer escape and control-plane risk

### Threat chain

1. hostile HTML/script/media compromises a renderer;
2. compromised renderer attacks broker IPC, browser/network/GPU/utility process,
   or kernel surface;
3. escaped process probes credentials, host mounts, metadata, control APIs, or
   neighboring jobs;
4. exposed CDP/browser-control channel bypasses web constraints directly;
5. captured active content injects downstream agents or parsers.

**FACT (high):** Chromium's compromised-renderer document enumerates browser-
side IPC/origin checks and also records known gaps; Site Isolation and sandbox
are defense in depth [S5]. The browser and DevTools frontend are trusted in that
model. CDP can create contexts/targets, execute browser commands, grant
permissions, read response bodies, and control downloads [S10, S11, S12].

**RECOMMENDATION (high):** bind the DevTools transport to a private per-job
channel, never a shared/listening public port; give only the orchestrator access;
validate protocol messages and cap response sizes. Keep the orchestrator and
result parser outside the browser VM, but expose only a minimal authenticated
job/result protocol. Treat DOM, text, console, URLs, headers, screenshots, PDFs,
and errors as untrusted. Do not feed active HTML to the research agent. Result
processing gets no write/action authority and retains the repository's
`untrusted-external-evidence` semantics.

Patch latency is part of containment. Chromium states that almost all updates
carry security fixes, Stable refreshes weekly, and all should be applied rather
than selectively prioritized [S16, S17]. Maintain a fast image rebuild/canary/
rollback path, automated version-age alarms, emergency drain/kill switch, and
no production capacity on an unsupported revision.

## 9. Operations and economic model

### 9.1 Cost drivers

No public source supports a reliable dollars-per-page quote. Measure:

- browser/VM cold-start time and idle baseline RSS;
- renderer/site/frame count and peak RSS per page class;
- browser-seconds, CPU-seconds, network bytes, and ephemeral disk per attempt;
- screenshot pixels, PDF pages, DOM/text bytes, and output encoding time;
- timeout/crash/OOM/retry rates and duplicate rendering;
- image-build, weekly security rollout, regression canary, sandbox verification,
  CVE response, on-call, abuse, and forensic-review labor;
- incremental useful text/citation yield over static fetch.

**INFERENCE (high):** one-browser-per-job plus VM isolation costs more startup
and memory than pooled tabs, while Site Isolation raises process/memory count.
This is deliberate purchase of smaller blast radius. Chromium reports a
historical 10–13% desktop memory increase from full Site Isolation with many
tabs; that is directional, not a capacity estimate for current Headless [S2].

### 9.2 Scheduling and SLOs

Use a separate low-priority render queue with per-host, tenant, and global
budgets. Admission requires a static-fetch failure/quality reason. Useful
service indicators are p50/p95/p99 queue and browser time, commit/capture
success, partial-result rate, crash/OOM/timeout rate, sandbox verification,
blocked private-destination attempts, patch age, render-needed precision, and
incremental extraction/citation gain per browser-second and MiB.

Do not automatically retry deterministic policy denials, downloads, private
network attempts, or repeated OOM/timeouts. At most one clean retry may be
justified for transient infrastructure failure under the original aggregate
budget. Circuit-break by browser revision, destination host, and failure class.

## 10. License, distribution, and clean-room boundary

This is an engineering boundary, not legal advice.

**FACT (high):** Chromium's top-level source license is BSD-style and requires
retaining notices/disclaimers; it forbids using Google/contributor names for
endorsement [S18]. Chromium also contains extensive third-party code under
other licenses. Its policy tracks each dependency's source, revision, license,
shipping status, security criticality, modifications, and notices, and
generates credits from that metadata [S19].

**FACT (high):** Google Chrome is a Google-built/distributed Chromium product
with Google branding, API keys, codecs, packaging, testing, and update behavior
that can differ from distribution Chromium. Google Chrome branding assets are
not released under Chromium's open-source license [S20, S21].

**RECOMMENDATION (high):** do not describe Chromium as wholly project-owned or
as a single-license dependency. Before any binary use, legal/SBOM review must
identify exact source/build/distributor, all shipped component licenses and
notices, codec/patent exposure, trademark/branding, redistribution terms,
update mechanism, source-offer obligations if any, and vulnerability ownership.
Prefer unbranded Chromium terminology unless the actual approved binary is
Google Chrome; never use Chrome marks to imply endorsement.

### Clean-room lessons

- **ADOPT:** public behavioral contracts and security principles—least
  privilege, hostile renderer assumption, site/process separation, browser-side
  authorization, disposable profiles, typed lifecycle/result states, hard
  external budgets, and frequent patching.
- **ADAPT:** CDP concepts into a small provider-neutral render-job contract;
  Chromium remains a replaceable adapter. Do not expose raw CDP or Chromium
  flags as Curiosity's domain API.
- **REJECT:** copying/translating Chromium source, tests, flags tables, or
  implementation structure into an “owned” renderer. A BSD license may permit
  reuse with obligations, but reused code remains third-party and conflicts
  with a strict clean-room-owned core.
- **DEFER:** exact binary/distribution selection until legal, sandbox, patch
  provenance, and hostile-page qualification gates pass. Chrome for Testing's
  own trusted-content warning is material [S14].

The research team may inspect public design/security/API documents and permitted
black-box behavior. If Curiosity later authors an owned renderer adapter, its
implementers should work from an approved functional/security specification and
independent fixtures, with source-reading and implementation histories kept
separate where counsel requires.

## 11. Curiosity implications and verdict ledger

| Item | Verdict | Confidence and rationale |
| --- | --- | --- |
| Chromium as default fetcher | **REJECTED** | High; unnecessary browser cost and attack surface for static pages. |
| Chromium as selective render adapter | **ADAPTED / deferred to gate** | High; strong fidelity and defenses, but only behind external containment. |
| Static HTTP first with measured render trigger | **ADOPTED** | High; bounds cost and exposure and measures incremental value. |
| One fresh browser/profile and VM per hostile job | **ADOPTED baseline** | High; BrowserContext/Site Isolation are not tenant escape boundaries. |
| Desktop Site Isolation and Chromium sandbox | **ADOPTED defense in depth** | High; never disabled, never sole boundary. |
| Egress proxy with connect-time public-address validation | **ADOPTED blocking control** | High; browser web security is not SSRF policy. |
| Shared long-lived browser/profile | **REJECTED** | High; cross-job privileged state, service workers, cache, process reuse, failure domain. |
| Downloads, extensions, privileged schemes, ambient permissions | **REJECTED** | High; no retrieval value commensurate with authority. |
| Unified Headless | **ADAPTED** | High; closest supported browser behavior, not deterministic or isolated by itself. |
| Legacy headless shell | **DEFERRED/likely rejected** | Medium; potential cost benefit, lower fidelity and separate/deprecated path. |
| Chrome for Testing for hostile production pages | **REJECTED absent separate approval** | High; official trusted-content-only warning. |
| Live screenshot as reproducible evidence | **REJECTED claim** | High; environment can be pinned, live content/timing cannot. |
| Frozen authorized replay for byte comparisons | **ADOPTED for tests** | High; record substitutions and browser/environment versions. |
| Raw CDP as Curiosity contract | **REJECTED** | High; powerful unstable provider API and control-plane exposure. |
| Chromium code in clean-room owned core | **REJECTED** | High under current ownership premise; concepts/docs only. |

### Proposed provider-neutral render result (conceptual)

A request identifies admitted URL, policy/corpus decision, static-fetch capture,
render reason, deadline, locale/viewport profile, and output classes. A result
identifies adapter and exact browser/environment revisions; final URL and full
redirect/request decision manifest; commit/readiness reason; cache/worker use;
DOM/text/screenshot/PDF capture IDs and hashes; truncation/partial flags;
resource consumption; crash/timeout/policy-denial diagnostics; and trust set to
untrusted external evidence. It contains no credentials, internal addresses,
raw DevTools endpoint, VM identity, or reusable profile handle.

## 12. Unknowns and required checks

### Blocking unknowns

1. Exact platform, kernel, VM/container runtime, Chromium build/distributor,
   and update owner are unchosen.
2. Current-version sandbox status for browser, network, GPU, PDF, audio/video,
   and utility processes is unverified; [S4] is only current through M128.
3. Target page classes, render-needed prevalence, QPS, latency, output types,
   retention, and cost envelope are unspecified.
4. Whether service-worker semantics, authenticated pages, PDFs, media, WebGL,
   or full-page screenshots are ever required is undecided. Authentication is
   incompatible with the initial no-credentials lane.
5. Exact binary redistribution, third-party notice, codec/patent, trademark,
   and support obligations require counsel and SBOM review.
6. No hostile-corpus renderer-escape, SSRF, DNS-rebinding, decompression,
   process-bomb, storage, or lifecycle benchmark has been run.

### Pre-production checks

- version-pinned sandbox/process matrix on the real kernel/runtime, proving
  sandbox failure closes the worker rather than falling back to `--no-sandbox`;
- private/loopback/link-local/metadata/IPv6/mapped-address, DNS rebinding,
  redirect, proxy-bypass, WebSocket/WebRTC/QUIC/WebTransport egress suite;
- renderer/browser/network/GPU crash and protocol-disconnect containment;
- service-worker/cache/cookie/storage/profile non-persistence across jobs;
- download, popup, dialog, file chooser, permission, privileged-scheme, and
  external-protocol denial;
- CPU/memory/PID/disk/socket/byte/pixel/DOM/decompression/time exhaustion and
  whole-job kill behavior;
- representative static-versus-render quality, latency, and unit economics;
- reproducibility matrix across browser updates, fonts, GPU modes, locale,
  virtual time, screenshots, and PDFs;
- SBOM, exact notices/licenses, source/build provenance, signature/hash,
  update/rollback SLA, and emergency kill-switch review.

## 13. Bounded curiosity pass and stop

Scores are 1 (low) to 5 (high); cost 1 is cheap and 5 expensive.

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify privileged network-process status | 5 | 5 | 4 | 1 | **Pursued:** official platform matrix says unsandboxed on Linux/Windows/Android through M128 [S4], strengthening the external-boundary requirement. |
| Check convenient pinned binary safety posture | 5 | 5 | 4 | 1 | **Pursued:** Chrome for Testing explicitly says trusted content only [S14], changing it from a likely candidate to rejected absent review. |
| Verify worker persistence/limits | 5 | 4 | 3 | 1 | **Pursued:** official FAQ confirms persistent registration and records no then-current SW count limit [S9]. |
| Enumerate every Chromium command-line hardening flag | 3 | 3 | 2 | 4 | `CURIOSITY_NO_GO`: unstable, version/platform-specific, and risks cargo-cult security; derive settings from qualification tests. |
| Reproduce public browser exploits | 2 | 3 | 4 | 5 | `CURIOSITY_NO_GO`: unsafe and unnecessary; authorized red-team belongs in a separate reviewed environment. |
| Quote cloud cost per rendered page | 4 | 4 | 2 | 4 | `CURIOSITY_NO_GO`: workload and SLOs absent; measure pilot unit rates. |
| Select exact VM/runtime/browser distribution | 5 | 5 | 3 | 4 | `CURIOSITY_NO_GO`: requires caller authority, platform assumptions, legal review, and hands-on tests. |
| Exhaustively audit all transitive licenses | 5 | 5 | 2 | 5 | `CURIOSITY_NO_GO`: exact binary is unchosen; mandatory SBOM gate later. |

**Coverage check:** all requested process/site isolation, sandbox, network,
service worker, download, quota, navigation/lifecycle, headless/capture, SSRF,
escape, operations, licensing/clean-room, and Curiosity categories are covered.
**Saturation check:** additional product-feature and automation material would
not change the central decision: Chromium is a hostile parser behind, not in
place of, infrastructure containment. **Stop:** coverage and saturation reached;
platform selection and live validation require separately declared authority.

## 14. Primary sources

All accessed 2026-08-17. GitHub raw links below mirror files in Chromium's
official public source repository; canonical paths are stated to retain origin.

1. **[S1] Chromium, Multi-process Architecture.**
   https://www.chromium.org/developers/design-documents/multi-process-architecture/
   — browser/renderer roles, IPC, crashes, network mediation, additional
   process types.
2. **[S2] Chromium, Process Model and Site Isolation; Site Isolation.**
   https://github.com/chromium/chromium/blob/main/docs/process_model_and_site_isolation.md
   and https://www.chromium.org/Home/chromium-security/site-isolation/ — current
   process locks/reuse/modes and published threat model, limits, overhead.
3. **[S3] Chromium, Sandbox and Sandbox FAQ.**
   https://github.com/chromium/chromium/blob/main/docs/design/sandbox.md and
   https://github.com/chromium/chromium/blob/main/docs/design/sandbox_faq.md —
   hostile-code assumption, broker/target model, OS dependence, resource limits.
4. **[S4] Chromium, Linux Sandbox; Unsandboxed Processes by Platform.**
   https://github.com/chromium/chromium/blob/main/sandbox/linux/README.md and
   https://github.com/chromium/chromium/blob/main/docs/security/process-sandboxes-by-platform.md
   — namespaces/seccomp and default Stable process sandbox matrix through M128.
5. **[S5] Chromium, Threat Model and Defenses Against Compromised Renderers.**
   https://github.com/chromium/chromium/blob/main/docs/security/compromised-renderers.md
   — native-code/forged-IPC premise, browser-side checks, known gaps, DevTools trust.
6. **[S6] Chromium, The Rule of Two.**
   https://github.com/chromium/chromium/blob/main/docs/security/rule-of-2.md —
   untrusted input, memory safety, privilege, and structured normalization.
7. **[S7] Chromium, Life of a Navigation; Navigation Concepts.**
   https://github.com/chromium/chromium/blob/main/docs/navigation.md and
   https://github.com/chromium/chromium/blob/main/docs/navigation_concepts.md —
   redirect/commit/load phases, downloads, concurrency, special navigation paths.
8. **[S8] Chromium, Network Service.**
   https://github.com/chromium/chromium/blob/main/services/network/README.md —
   trusted interfaces, process placement, low-level protocols, crash recovery.
9. **[S9] Chromium, Service Worker Security FAQ.**
   https://github.com/chromium/chromium/blob/main/docs/security/service-worker-security-faq.md
   — worker process, persistence, lifetime, origin/security properties and
   historical absence of count limits. Last-updated age is noted in the report.
10. **[S10] Chrome DevTools Protocol, Page and Browser domains.**
    https://chromedevtools.github.io/devtools-protocol/tot/Page/ and
    https://chromedevtools.github.io/devtools-protocol/tot/Browser/ — capture,
    lifecycle, navigation/download, dialogs, permissions, download denial.
11. **[S11] Chrome DevTools Protocol, Target and Emulation domains.**
    https://chromedevtools.github.io/devtools-protocol/tot/Target/ and
    https://chromedevtools.github.io/devtools-protocol/tot/Emulation/ —
    disposable contexts, targets/crashes, environment and virtual-time controls.
12. **[S12] Chrome DevTools Protocol, Network and Storage domains.**
    https://chromedevtools.github.io/devtools-protocol/tot/Network/ and
    https://chromedevtools.github.io/devtools-protocol/tot/Storage/ — request
    telemetry, cache/worker bypass, protocol buffers, storage usage/clearing.
13. **[S13] Chrome for Developers, Chrome Headless mode.**
    https://developer.chrome.com/docs/automation-and-testing/headless — unified
    Headless architecture and old-shell boundary.
14. **[S14] Chrome for Developers, Chrome for Testing.**
    https://developer.chrome.com/docs/automation-and-testing/chrome-for-testing
    — pinned testing binaries and explicit trusted-content-only warning.
15. **[S15] Chrome for Developers, Headless command-line reference.**
    https://developer.chrome.com/docs/automation-and-testing/headless-cli — DOM,
    screenshot, PDF, wall-timeout and virtual-time behavior.
16. **[S16] Chromium, Chrome Security Update FAQ.**
    https://github.com/chromium/chromium/blob/main/docs/security/updates.md — all
    updates important, weekly planned security refreshes, rapid patch guidance.
17. **[S17] Chromium, Chrome Release Cycle.**
    https://github.com/chromium/chromium/blob/main/docs/process/release_cycle.md
    — four-week milestones, weekly Stable refreshes, Stable recommendation.
18. **[S18] Chromium top-level LICENSE.**
    https://github.com/chromium/chromium/blob/main/LICENSE — BSD-style source
    terms and non-endorsement clause.
19. **[S19] Chromium, Adding third-party libraries.**
    https://github.com/chromium/chromium/blob/main/docs/adding_to_third_party.md
    — provenance, security ownership, freshness, license metadata and credits.
20. **[S20] Chromium, Difference between Google Chrome and Chromium on Linux.**
    https://github.com/chromium/chromium/blob/main/docs/chromium_browser_vs_google_chrome.md
    — packaging, codecs, testing, sandbox/update and API-key distinctions.
21. **[S21] Chromium, Google Chrome branded builds.**
    https://github.com/chromium/chromium/blob/main/docs/google_chrome_branded_builds.md
    — Chrome trademark assets are outside Chromium's open-source license.

### Negative results retained

- No primary source found that makes Chromium Site Isolation or CORS an
  infrastructure-grade SSRF control; the opposite architecture is apparent:
  privileged network code intentionally reaches cross-origin resources.
- No current primary source found a native per-render-job CPU, memory, PID,
  request-byte, or cost budget suitable for multi-tenant service enforcement.
- No source supports treating BrowserContext/incognito separation as a sandbox
  against browser-process compromise.
- No source supports byte-deterministic capture of arbitrary live pages.
- No reliable current dollars-per-render figure was found; public Site
  Isolation overhead is historical and not a Headless capacity benchmark.
- No single Chromium/Chrome license covers every shipped dependency, codec,
  branded asset, and chosen distribution.
- The process-sandbox matrix is not current beyond M128, and the service-worker
  FAQ is dated 2017; both are useful primary records but require candidate-
  version verification rather than blind reliance.
