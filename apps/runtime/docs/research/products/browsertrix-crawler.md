# Browsertrix Crawler reverse-engineering dossier

**Access date:** 2026-08-17  
**Product snapshot:** Browsertrix Crawler `v1.14.2`, commit
`e0ff93b21fe40d165cf02a01fb375f02c8003a01`; Browsertrix platform `main`,
commit `7e25d4a0bac7420cdefbfc0473f02cf479dfa3c6` [S1, S15].  
**Decision:** what Browsertrix's public behavior and architecture teach Curiosity
about a bounded browser-rendering/capture lane, without importing Browsertrix
code or widening agent authority.  
**Status:** research only; no implementation, deployment, credentials, archive
content, or third-party source was transferred into this repository.

## Executive verdict

**ADAPT, do not embed (high confidence).** Browsertrix Crawler is a mature
single-container, browser-first web-archive worker. It controls parallel Brave
windows with Puppeteer, records browser traffic through CDP into WARC 1.1,
maintains a Redis frontier, can package WARC plus indexes/page metadata as WACZ,
and can compare live-crawl artifacts with ReplayWeb.page replay [S2, S5, S10].
The separate Browsertrix application adds workflow schedules, quotas, multi-pod
scale, resumability, object storage, and Kubernetes isolation [S11-S16].

The strongest clean-room lessons are: keep capture immutable; make frontier,
pending, finished, failed, and excluded states explicit; use atomic queue
transitions; checkpoint enough state to replay work; preserve request/response
and page-level evidence; package indexes and fixity with captures; and test
replay rather than equating successful fetch with faithful preservation.

Browsertrix is **not** a safe default for Curiosity's broad public-web fetch
lane. Robots compliance is opt-in and disabled by default; the inspected
implementation treats all non-200 or failed `robots.txt` fetches as allow,
processes at most 100 KB, and retains crawl-lifetime cached rules—materially
different from RFC 9309's unreachable, minimum-size, redirect, and cache
requirements [S4, S17, S18]. Politeness is a per-worker fixed delay, not a
host-keyed scheduler; multiple windows/pods can hit one origin concurrently,
and rate-limit accounting is global rather than per host [S4, S8]. Browser
profiles contain session authority, remotely supplied profiles/behaviors widen
the supply-chain boundary, Chromium is launched with `--no-sandbox`, and the
standalone container does not itself enforce egress isolation [S9, S13, S19].

**Curiosity recommendation:** use static HTTP as the normal crawl path. Defer a
browser lane until policy, egress, sandboxing, per-origin politeness, capture
provenance, and replay-quality gates exist. If Browsertrix is evaluated as an
external worker, pin an image digest, run it in a disposable non-root pod with
deny-by-default egress and no service-account token, disallow custom drivers and
remote behaviors/profiles, force standards-conservative robots handling, and
export only validated WARC/WACZ-derived evidence. Browsertrix's AGPL-3.0-or-later
code must not be copied into or represented as Curiosity's MIT project code
[S1]. This is an engineering recommendation, not legal advice.

## 1. Frame, bounded questions, and method

### Questions

1. Where are scheduling, scope, frontier ownership, concurrency, and retries?
2. What is captured, indexed, deduplicated, packaged, and replay-tested?
3. What authority is carried by profiles and custom browser behavior?
4. What happens on interruption, pod loss, rate limiting, and scale changes?
5. Which security, robots, politeness, license, and operational boundaries are
   appropriate—or inappropriate—for Curiosity?

### Method and limits

Primary sources were accessed on 2026-08-17. The official repositories were
read at the commits above in a temporary directory outside this workspace;
official docs, release metadata, WARC/WACZ specifications, RFC 9309, Helm
templates, and the project's published security advisory were triangulated.
No crawler was executed, no site was crawled, no container image or WACZ was
downloaded, and no source code was copied into this report. File/line references
describe inspected code; short names and concepts are used only to explain
observable architecture.

Labels:

- **FACT** — directly supported by cited primary evidence.
- **INFERENCE** — clean-room architectural conclusion from those facts; not a
  measurement.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

Coverage stops after each requested topic has implementation evidence, an
operational consequence, and a Curiosity verdict. Product performance,
standards conformance, and replay quality were not benchmarked.

## 2. System boundary and data flow

**FACT (high):** Browsertrix Crawler is the worker, not the complete service. Its
documented unit is one Docker container controlling one or more Brave windows
through Puppeteer and capturing through Chrome DevTools Protocol (CDP). The
Browsertrix repository supplies the API/UI and orchestration around crawler
containers [S2, S15].

```text
Browsertrix workflow / standalone CLI
  -> seed + scope + limits + profile + browser/behavior settings
  -> Redis crawl state (sorted frontier, seen, pending, failed, excluded)
  -> N crawler pods x M Brave/Puppeteer page workers
  -> CDP request/response observation + optional direct non-HTML fetch
  -> serial WARC writers + live CDXJ + page JSONL / screenshots / text
  -> optional WACZ packaging, fixity, dependency metadata, upload/webhook
  -> ReplayWeb.page replay + optional QA crawl/comparison
```

**INFERENCE (high):** this is two architectures joined by a state and artifact
contract: (a) a browser capture engine and (b) a cloud control plane. Curiosity
should preserve that separation. An agent-facing retrieval contract should not
become a browser lifecycle API, and a rendering worker should never own corpus
policy, scheduling authority, or downstream agent actions.

## 3. Scheduling, discovery, and crawl scope

### Browsertrix Crawler worker

**FACT (high):** the worker accepts seeds directly or from a file. Scope may be
global or per seed. Built-in scopes are one page, hash-routed page/SPA, URL
prefix (default), host, registrable domain plus subdomains, unrestricted, and
custom include regex. Exclusions override inclusion and extra-hop expansion;
depth and page limits bound discovery [S3]. Per-seed scope overrides crawl-wide
scope [S3].

**FACT (high):** link discovery defaults to anchor `href` values but supports
custom selectors, sitemap discovery, behavior-supplied links, and redirected
seeds. Query parameters are sorted for queue identity; scheme and `www` variants
are deliberately collapsed for prefix/host/domain scope. Since v1.14.0, a seed
redirect to a materially different URL is loaded once but does not automatically
become a new seed unless configured [S3, S4].

**FACT (high):** page scope and resource blocking are separate. Scope decides
which top-level pages enter the frontier; block rules intercept subresources or
frames, can be conditional on frame URL/text, and may synthesize an explanatory
WARC resource record [S3].

**INFERENCE (medium):** normalizing scheme and `www` for scope is convenient but
is not a general URL identity rule. For an evidence system it can merge distinct
security origins or publications. Curiosity should retain requested URL,
redirect-terminal URL, normalized scheduling key, publisher canonical, and
content cluster as separate fields.

### Browsertrix service scheduler

**FACT (high):** recurring workflow scheduling belongs to the Browsertrix
platform, not the crawler binary. It supports daily, weekly, monthly, and custom
cron schedules; custom cron runs in UTC, and a scheduled run is skipped if the
workflow is already running [S11]. Org concurrency and queue limits can leave a
run waiting for resources or dedupe-index work [S12, S16].

**FACT (high):** platform workflows expose hard page, elapsed-time, and size
limits, plus organization storage/time quotas. Scope edits affect later runs;
live exclusions can remove queued traps, and browser-window count can be changed
during a run [S11, S12].

**RECOMMENDATION (high):** ADAPT the layered model—declarative recurring policy
creates immutable run records; run-level limits are copied at dispatch; workers
only consume authorized work. Do not let a Curiosity follow-up create or modify
a recurring crawl. Scheduling remains caller/admin authority.

## 4. Frontier, queues, concurrency, and retries

**FACT (high):** crawl state is Redis-backed. Source inspection shows distinct
keys for a sorted frontier, pending hash, seen set, completed count, terminal
failures, errors, excluded URLs, pages, redirected seeds, sitemap completion,
and robots cache [S6]. Queue insertion atomically enforces a page limit,
deduplicates normalized URLs, adds the work item, and clears stale pending state.
Claiming work atomically pops the minimum-score item and moves it to pending
[S6].

**FACT (high):** priority is principally breadth-first: depth, out-of-scope extra
hops, and retry count contribute increasingly large score bands. Equal-score
ordering is an implementation consequence of the Redis sorted set, not a
documented relevance or host-fairness policy [S6]. Pending work is requeued when
the frontier empties; ordinary failed pages default to two retries, while
rate-limited pages default to four [S4, S6, S8].

**FACT (high):** each worker repeatedly claims one page, rechecks current scope,
loads it, performs behaviors/post-processing, and returns for more work. A
standalone crawl defaults to one worker. In Kubernetes, worker IDs are offset by
pod ordinal, allowing many pods to share one Redis frontier; the platform maps
requested browser windows onto pods using a configured windows-per-pod value
[S4, S6, S14].

**FACT (high):** WARC writing, browser-side fallback fetching, and asynchronous
fetching each use serialized internal queues where ordering/integrity matters.
The frontier can be parallel while a particular output writer remains
single-concurrency [S5].

**INFERENCE (high):** atomic `queued -> pending` movement is a sound distributed
frontier primitive. The design is at-least-once at the page-work level after
worker loss: an abandoned pending item can be requeued, while capture-level
dedupe and append behavior mitigate duplicate bytes. It is not exactly-once
execution, nor should Curiosity require exactly-once network effects.

**RECOMMENDATION (high):** ADAPT explicit leases, retries, and idempotent capture
IDs, but add a host/politeness owner ahead of ready work. Priority should combine
scope depth with per-origin next-eligible time, tenant budget, retry class, and
bounded freshness priority; Redis availability must not define the permanent
evidence record.

## 5. WARC/WACZ capture and provenance

**FACT (high):** the crawler writes gzip WARC 1.1 and updates per-WARC CDXJ at
record-write time. Collections also contain page JSONL, logs, profile state,
crawl IDs, and optional reports. It can merge WARC/CDX, roll WARC files (default
1 GB), generate WACZ, and upload WACZ—not bare WARC—to S3-compatible storage
[S4, S5].

**FACT (high):** source inspection shows request and response records, WARC
payload digests (SHA-256 by default, optional SHA-1), `warcinfo`, synthesized
resource records (including screenshots, text, page information, and block
messages), truncation metadata, protocol/resource metadata, and revisit records
for identical payloads [S5]. This matches WARC 1.1's request, response, resource,
metadata, and revisit model [S18].

**FACT (high):** WACZ packages WARC, CDXJ indexes, page entry points, and a
`datapackage.json` manifest with sizes/hashes; the format is designed for remote
range-based replay without a specialized archive server [S10]. Browsertrix may
sign WACZ through the separately configured Authsign service, but signing is not
enabled by default [S13, S16].

### Deduplication

**FACT (high):** within a crawl, repeated URLs are skipped and identical payload
content at different URLs produces WARC revisit records. Across crawls, an
optional persistent Redis-compatible digest index maps content to the first
capture. Cross-crawl data is normally committed only after successful completion
so a failed crawl cannot become the canonical dependency [S7].

**FACT (high):** immediate concurrent dedupe is available, but the official docs
explicitly warn it can cause missing content if another crawl references a
capture that is later discarded. WACZ manifests record required WACZ names,
hashes, sizes, and crawl IDs for revisit dependencies; correct replay requires
both the dependent and source WACZ [S7].

**INFERENCE (high):** Browsertrix correctly makes storage dedupe a provenance
graph, not merely a byte-saving optimization. Curiosity must never expose a
revisit as self-contained evidence. Garbage collection, deletion, replication,
and citation resolution must traverse capture dependencies.

**RECOMMENDATION (high):** ADOPT WARC 1.1 and WACZ-compatible packaging as
interchange/evaluation formats, not necessarily as the query-serving store.
Preserve raw capture hash, WARC record ID, requested/terminal URL, capture time,
HTTP request/response, redirect chain, renderer/browser version, extraction
version, and WACZ fixity. Keep the agent index derivative and rebuildable.

## 6. Profiles and authenticated crawling

**FACT (high):** profile creation can be interactive over noVNC or automated for
a single login. Saved tarballs contain the Brave profile and temporary session
cookies rather than the submitted password. A crawl can load a local profile or
download one from HTTP(S); the docs recommend creating and consuming profiles
with compatible crawler/headless versions [S9].

**FACT (high):** the platform warns against personal accounts and recommends
dedicated crawl identities. Optional capture of `localStorage` and
`sessionStorage` can improve replay but may archive login data and identifying
preferences; Browsertrix does not classify those values for sensitivity [S11].

**INFERENCE (high):** a profile is a credential bundle even without a password.
Cookies, storage, origin permissions, proxy configuration, and fingerprints
carry authority and can leak into WARC, screenshots, logs, profile outputs, or
subrequests. Fetching a profile by URL also adds a supply-chain and SSRF-like
input surface.

**RECOMMENDATION (high):** REJECT authenticated crawling for Curiosity's initial
public corpus. If later authorized, use a dedicated per-site account, encrypted
profile object, one-run materialization, no cross-tenant reuse, explicit origin
allowlist, automatic secret scanning/redaction on derivatives, no browser
storage capture by default, and destruction/rotation after the run. Never make
profiles visible to the research agent.

## 7. Robots, rate limits, and politeness

### Robots behavior

**FACT (high):** `--useRobots` is false by default. When enabled, the crawler
checks the configured `Browsertrix/1.x` token plus wildcard rules and can report
`robotsTxt` as a skip reason [S4]. The implementation shares in-flight fetches
per origin and caches the 100 most recently used bodies in Redis [S17].

**FACT (high):** the inspected `v1.14.2` implementation waits at most ten
seconds, accepts only status 200, reads at most 100,000 bytes, and treats every
other status or fetch/parse failure as no rules. Cache entries have LRU eviction
but no time expiry [S17]. RFC 9309 instead says unreachable robots (for example,
5xx/network errors) means complete disallow, recommends following at least five
redirects, requires a parser limit of at least 500 KiB, and normally limits cache
use to 24 hours [S18].

**INFERENCE (high):** Browsertrix's robots option is useful archival policy
support but is not an RFC 9309-conservative policy engine. A long crawl can use
stale rules, a large valid file is truncated below the standards floor, and
transient server failure becomes allow. This is unsuitable as Curiosity's
compliance boundary without an independent gate.

### Politeness and blocking

**FACT (high):** a fixed delay can be added after each page/behavior cycle.
Increasing browser windows increases traffic and the project's docs warn it can
increase rate limiting [S4, S11]. No host-keyed concurrency cap, crawl-delay
implementation, or adaptive per-host scheduler was found in the docs or
inspected frontier. The documented rate-limit counters are global, not per seed
or domain [S8].

**FACT (high):** status 403/429/503 and configurable page-text patterns can mark
a page rate limited. Such content is loaded but not archived; the URL is retried
later or skipped. `Retry-After` overrides the default five-minute interval. The
platform can restart with increasing intervals up to five minutes and pause a
run after a prolonged blocked state [S8, S12]. The docs explicitly state that
bypassing auth walls is out of scope and recommend permission when needed [S8].

**RECOMMENDATION (high):** REJECT these defaults for a public search crawler.
Curiosity needs robots on by policy, RFC 9309 semantics and evidence, a stable
contact-bearing user agent, DNS/IP revalidation, one scheduler owner per
scheme/authority politeness key, per-host concurrency and minimum spacing,
adaptive backoff, bounded retries, and global/tenant/host budgets. CAPTCHA or
auth-wall detection must stop/escalate, never trigger evasion.

## 8. Replay fidelity and quality evidence

**FACT (high):** fidelity is active, not passive. Default behaviors autoplay
media, fetch lazy/alternate resources, autoscroll, and run site-specific logic;
autoclick is optional. Site-specific behaviors target major social platforms,
and custom behavior may add links. Page-load condition, load timeout, post-load
delay, behavior timeout, network-idle wait, and final delay all alter the
captured state [S19].

**FACT (high):** fidelity also has deliberate compromises. Brave Shields are on
unless changed by a profile; optional host blocking removes ads/malware;
service workers are disabled by default; headful historically was recommended
for fidelity while modern headless is described as closer and faster; the
YouTube behavior selects a replayable 360p MP4 [S4, S9, S19].

**FACT (high):** QA replays a source WACZ in ReplayWeb.page and compares the
original crawl with replay by viewport pixel similarity, Levenshtein text
similarity, and per-page resource URL/status/MIME/type counts. QA results are
written as additional WARC resource/page-info data [S20].

**INFERENCE (high):** “high fidelity” is a goal and tested property, not a
guarantee. Screenshot similarity may penalize benign dynamic differences or
miss invisible semantic loss; text similarity misses interaction/media; resource
counts miss functional equivalence. Browser version, profile, service-worker
policy, locale, viewport, timing, blockers, and behavior version are part of the
capture's meaning.

**RECOMMENDATION (high):** ADAPT the QA loop. Curiosity's browser lane should
record deterministic fixtures and compare raw resource completeness, DOM/text,
screenshots, link extraction, and replay console/network failures. Return a
quality vector and warnings, not one “fidelity” score. Browser-derived text is
untrusted evidence and must remain anchored to immutable capture IDs.

## 9. Checkpoints, interruption, and recovery

**FACT (high):** on graceful interruption, Browsertrix serializes Redis state to
YAML: finished, queued, pending, failed, errors, excluded URLs, redirected seeds,
and sitemap completion. Pending work is loaded back into the frontier on restart;
scope is rechecked. Saved state defaults to interrupted/partial, or can be always
with a default five-minute interval and five retained versions [S4, S6].

**FACT (high):** one SIGINT/SIGTERM waits for pages and async writes, flushes
WARC, builds WACZ, and saves state. A second signal closes the browser and skips
WACZ/post-processing but flushes queued WARC; SIGKILL gives no WARC-validity
guarantee. Kubernetes pod termination normally sends the first, graceful form
[S4].

**FACT (high):** Browsertrix runs crawler pods `OnFailure`, uses shared external
Redis, a persistent volume or `emptyDir`, liveness checks, size/time/disk limits,
and a long termination grace period. Its standard platform arguments enable
restart-aware behavior, headless mode, WACZ generation, screenshots, Redis
events, and health checks [S14, S16]. Pause packages and uploads what exists;
resume may apply changed workflow settings. Paused runs expire after seven days
[S12].

**INFERENCE (medium):** the checkpoint is a frontier snapshot, not a fully
transactional snapshot spanning Redis, WARC append, WACZ upload, and external
dedupe commit. Recovery therefore depends on idempotence, append validation,
capture dedupe, and control-plane reconciliation.

**RECOMMENDATION (high):** ADAPT explicit checkpoint manifests with monotonic
generation, content hash, run configuration hash, frontier watermark, output
segment hashes, and commit status. Recovery must validate WARC segments and
reconcile leases before dispatch. Never index or cite an uncommitted segment.

## 10. Security and isolation

### Worker/container boundary

**FACT (high):** the crawler launches Chromium with `--no-sandbox` and a remote
debugging port; CLI switches can expose CDP and Redis for debugging. It accepts
arbitrary Chrome arguments, proxies, remotely downloaded profile tarballs,
custom JavaScript/JSON behaviors from files/URLs/Git, and a custom driver [S4,
S5, S19]. The browser visits attacker-controlled pages by design.

**FACT (high):** the Browsertrix Helm worker improves the boundary: non-root
UID/GID, no privilege escalation, read-only root filesystem, memory requests and
limits, isolated writable `/tmp` and crawl volume, liveness probe, and crawler
namespace [S14]. The default NetworkPolicy excludes RFC 1918 destinations and
allows only public IPv4, DNS, crawl Redis, and configured platform services;
administrators can widen or replace it [S13].

**FACT (high):** a published critical Browsertrix platform advisory
(`CVE-2026-54501`) reports command injection in custom-behavior Git URL
validation for backend versions `>=1.15.0 <1.22.8`, with access to database,
storage, proxy secrets, archives, and profile cookies. It is patched in 1.22.8;
the inspected platform declares 1.24.2 images [S16, S21]. No published crawler
repository advisory was returned by GitHub's advisory API on the access date;
this negative result is not proof of absence [S22].

**INFERENCE (high):** Kubernetes hardening compensates for an intentionally
powerful, sandbox-disabled browser container; it does not make the browser safe.
The default egress policy does not cover public-address rebinding after DNS,
IPv6, cloud metadata on non-RFC1918 routes, public control panels, or exfiltration
to attacker origins. Remote custom inputs can cross control-plane and worker
boundaries. Profiles and S3/proxy credentials sharply increase blast radius.

**RECOMMENDATION (high):** for any Curiosity evaluation:

- disposable pod/VM per trust domain; non-root, read-only root, dropped Linux
  capabilities, runtime-default seccomp, no privilege escalation, no host mounts,
  no service-account token, and strict CPU/memory/PID/ephemeral-storage limits;
- egress proxy that resolves and revalidates every redirect, denies loopback,
  link-local, private, reserved, metadata, cluster, and IPv6 equivalents, and
  logs destination decisions without credentials;
- never expose CDP/VNC/Redis publicly; authenticate any observation channel;
- image digest and SBOM pinning; patched Brave/Chromium; isolated secrets with
  least privilege and short lifetime;
- disable remote profiles, custom drivers, custom behavior URLs/Git, arbitrary
  Chrome flags, origin overrides, and browser downloads in the Curiosity lane;
- malware/type/size/decompression limits and WARC/WACZ validation before the
  artifact leaves quarantine.

## 11. Kubernetes and operations lessons

**FACT (high):** Browsertrix is Kubernetes-native and Helm-managed. The default
deployment includes backend, frontend, MongoDB, Redis/Kvrocks dedupe, and S3-like
storage (local MinIO by default). Crawl pods are created separately in a crawler
namespace; a per-crawl PVC is normally ReadWriteOnce, and multiple browser
windows are distributed over pods while sharing Redis state [S13-S16].

**FACT (high):** current chart defaults include 50,000 maximum pages, eight
maximum browser windows, two workers per crawler pod, 25 GiB minimum crawler
storage, 10 GB session segmentation, five-hour session time limit, 90% disk
threshold, persistent dedupe, 1 GB base memory plus increments, and crawler
network policy enabled [S16]. These are deployer defaults, not demonstrated safe
capacity figures.

**FACT (high):** WACZ output can be uploaded to S3-compatible storage with hash,
size, completion state, and webhook notification. Browsertrix supports storage
replicas and delayed replica deletion; backend/frontend—not crawl pods—have HPA
configuration. Crawl scale is explicit browser-window-to-pod mapping [S4, S13,
S14].

**INFERENCE (high):** operational correctness depends on four durable planes:
workflow metadata, Redis frontier, capture volume/segments, and object-store
artifacts. Each needs backup, quota, reconciliation, retention, deletion, and
observability. HPA of the API does not solve crawl capacity; admission control
and origin-aware dispatch do.

**RECOMMENDATION (high):** Curiosity should start with one browser worker and a
small allowlisted corpus. Track page latency, browser crashes, memory high-water,
frontier/pending age, WARC validation, bytes/page, replay-quality vectors,
robots outcomes, per-origin request rate, rate-limit events, and abandoned
leases. Scale only when host politeness remains invariant across replicas.

## 12. License and clean-room boundary

**FACT (high):** Browsertrix Crawler's README and package metadata state
AGPL-3.0-or-later; the Browsertrix platform is AGPLv3 and its documentation is
CC BY 4.0 [S1, S15]. AGPL section 13 requires a modified version supporting
remote network interaction to offer corresponding source to remote users [S1].

**RECOMMENDATION (high):** **REJECT** copying, translating, linking, vendoring,
or adapting Browsertrix implementation code into Curiosity's MIT project without
separate legal and architectural approval. **ADOPT** public WARC 1.1, RFC 9309,
HTTP, CDXJ/WACZ specifications subject to their own terms; **ADAPT** general
ideas from independently written requirements and tests. If Browsertrix is run
as an unmodified external tool, keep it process/network separated, preserve its
license/notices, publish no claim that it is MIT project code, and obtain legal
review for distribution, modification, or network-service use.

Clean-room controls:

1. Keep this dossier as the requirements input; implementers do not consult
   Browsertrix source.
2. Derive behavior from standards and project-authored fixtures, not copied
   tests, constants, schemas, Redis keys, or control flow.
3. Record source/version/date for every learned concept and dependency.
4. Have an independent reviewer compare behavior at the level of public formats
   and requirements, not code similarity.
5. Treat captured web content, profiles, and WACZ data rights separately from
   software licensing.

## 13. Curiosity implications and verdict ledger

| Capability/lesson | Verdict | Curiosity disposition | Confidence |
| --- | --- | --- | --- |
| WARC 1.1 immutable request/response capture | **ADOPT** | Canonical capture interchange; validate before commit | High |
| WACZ manifest, fixity, pages, indexes | **ADAPT** | Portable evidence bundle and replay/evaluation artifact | High |
| Explicit queued/pending/finished/failed/excluded state | **ADAPT** | Provider-neutral frontier state machine with durable leases | High |
| Atomic Redis shared frontier | **ADAPT** | Learn atomic transitions; do not make Redis permanent truth | High |
| Browser-first crawling | **REJECT initial / DEFER** | Static HTTP first; isolated render fallback only after gates | High |
| Browser behaviors and QA | **ADAPT** | Versioned behavior policy and multidimensional replay tests | High |
| Browser profiles | **REJECT initial / DEFER** | Dedicated authorized identities only, outside agent reach | High |
| Optional robots, allow-on-error semantics | **REJECT** | Independent RFC 9309-conservative policy gate | High |
| Per-worker delay/global rate limit | **REJECT** | Host-keyed scheduler, caps, pacing, and backoff | High |
| Concurrent cross-crawl dedupe | **REJECT initial** | Commit-after-success dependency graph first | High |
| Kubernetes non-root/read-only/network policy | **ADAPT and strengthen** | Disposable worker isolation plus egress proxy/seccomp | High |
| Remote profiles/custom behavior/custom driver | **REJECT** | No remote executable or credential-bearing inputs | High |
| Browsertrix source incorporation | **REJECT** | AGPL clean-room separation; concepts/specs only | High |
| External Browsertrix worker evaluation | **DEFER** | Legal/security review and fixture benchmark required | Medium |

### Minimum acceptance checks for a future browser lane

1. RFC 9309 conformance fixtures, including redirects, 4xx, 5xx, timeout,
   oversized files, wildcard/longest match, cache expiry, and exact decision log.
2. DNS rebinding/private/metadata/IPv6 redirect tests through the real egress
   enforcement point.
3. Two origins under multi-worker/multi-pod load proving per-origin caps and
   fairness do not change with scale.
4. Crash at each `claim -> fetch -> WARC append -> index -> upload -> commit`
   boundary; prove no cited orphan and bounded duplicate work.
5. WARC 1.1 and WACZ validation, fixity corruption, revisit-dependency deletion,
   and range-replay tests.
6. Replay corpus covering SPA, lazy media, service worker, iframe, authenticated
   fixture, redirects, downloads, streaming, and anti-bot response; report a
   quality vector, not pass/fail marketing language.
7. Browser escape/tabletop exercise proving no cluster, profile, object-store,
   proxy, or other-tenant reachability.
8. License review of exact image, deployment mode, modifications, notices,
   remote-user interaction, and artifact distribution.

## 14. Unknowns, contradictions, and negative results

- **UNKNOWN (high relevance):** no benchmark here establishes pages/hour,
  bytes/page, memory/window, failure rate, or comparative fidelity on
  Curiosity's corpus. Official capability claims are not comparative evidence.
- **UNKNOWN (high relevance):** the exact Brave base image's kernel sandbox,
  seccomp profile, capabilities, package CVEs, and Chromium patch age were not
  inspected. The application template does not explicitly set seccomp or drop
  capabilities [S14].
- **UNKNOWN (high relevance):** no end-to-end experiment verified WARC validity
  after pod/node/storage failure or concurrent scale changes.
- **CONTRADICTION (high confidence):** docs describe robots support, but CLI
  defaults disable it and source behavior differs materially from RFC 9309 for
  failures, size, and cache lifetime [S4, S17, S18].
- **CONTRADICTION (medium confidence):** current rate-limit docs say default four
  retries, while one sentence says the crawler continues retrying indefinitely;
  CLI/source default is four, so the finite default was used here [S4, S8].
- **NEGATIVE RESULT (medium confidence):** no host-keyed scheduler, per-origin
  concurrency limit, or `crawl-delay` handling was found in official docs or the
  inspected crawler source. Absence was not proven by runtime tracing.
- **NEGATIVE RESULT (low confidence):** GitHub's crawler security-advisory API
  returned no published entries; private, withdrawn, dependency, or unreported
  vulnerabilities may still exist [S22].
- **UNKNOWN (medium relevance):** WACZ signing trust policy, key custody,
  revocation, and verifier behavior are deployment-specific and were not tested.
- **UNKNOWN (medium relevance):** legal permission to crawl, retain, index, and
  redistribute any target corpus is outside software-license analysis.

## 15. Bounded curiosity pass

The declared frame authorized one in-frame follow-up after synthesis. Candidate
gaps were scored 1–5 (higher relevance/value/novelty; lower cost is better):

| Thread | R | V | N | Cost | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify actual robots failure/cache semantics against RFC 9309 | 5 | 5 | 4 | 1 | **Pursued**; found consequential divergence [S17, S18] |
| Inspect Kubernetes worker security context/egress, not just docs | 5 | 5 | 3 | 1 | **Pursued**; non-root/read-only plus residual gaps [S13, S14] |
| Check published security advisories around custom behaviors | 5 | 5 | 5 | 1 | **Pursued**; critical patched platform advisory [S21] |
| Run cross-product replay benchmark | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO** — outside no-execution budget |
| Reverse engineer Brave base image layers | 3 | 4 | 3 | 4 | **CURIOSITY_NO_GO** — exact image not pulled; defer to security review |
| Inspect every third-party dependency license/CVE | 3 | 4 | 2 | 5 | **CURIOSITY_NO_GO** — requires SBOM/legal audit of selected image |
| Explore hosted Browsertrix commercial behavior | 2 | 2 | 2 | 4 | **CURIOSITY_NO_GO** — hosted service is outside worker architecture |

Stop condition: **coverage and saturation**. The pursued threads changed the
security/politeness verdict; remaining high-value questions require authorized
execution, an exact deployment, or legal review.

## Sources

All web sources accessed 2026-08-17. Repository links are pinned where source
behavior is material.

- **[S1]** Webrecorder, Browsertrix Crawler `v1.14.2` release, README, package
  license, and AGPL text:
  <https://github.com/webrecorder/browsertrix-crawler/releases/tag/v1.14.2>,
  <https://github.com/webrecorder/browsertrix-crawler/blob/e0ff93b21fe40d165cf02a01fb375f02c8003a01/README.md>,
  <https://github.com/webrecorder/browsertrix-crawler/blob/e0ff93b21fe40d165cf02a01fb375f02c8003a01/package.json>,
  <https://github.com/webrecorder/browsertrix-crawler/blob/e0ff93b21fe40d165cf02a01fb375f02c8003a01/LICENSE>.
- **[S2]** Browsertrix Crawler official overview:
  <https://crawler.docs.browsertrix.com/>.
- **[S3]** Crawl scope:
  <https://crawler.docs.browsertrix.com/user-guide/crawl-scope/>.
- **[S4]** CLI options and common options:
  <https://crawler.docs.browsertrix.com/user-guide/cli-options/>,
  <https://crawler.docs.browsertrix.com/user-guide/common-options/>.
- **[S5]** Output docs and pinned recorder/writer source:
  <https://crawler.docs.browsertrix.com/user-guide/outputs/>,
  <https://github.com/webrecorder/browsertrix-crawler/blob/e0ff93b21fe40d165cf02a01fb375f02c8003a01/src/util/recorder.ts>,
  <https://github.com/webrecorder/browsertrix-crawler/blob/e0ff93b21fe40d165cf02a01fb375f02c8003a01/src/util/warcwriter.ts>.
- **[S6]** Pinned frontier and worker implementation:
  <https://github.com/webrecorder/browsertrix-crawler/blob/e0ff93b21fe40d165cf02a01fb375f02c8003a01/src/util/state.ts#L842-L1061>,
  <https://github.com/webrecorder/browsertrix-crawler/blob/e0ff93b21fe40d165cf02a01fb375f02c8003a01/src/util/state.ts#L1449-L1818>,
  <https://github.com/webrecorder/browsertrix-crawler/blob/e0ff93b21fe40d165cf02a01fb375f02c8003a01/src/util/worker.ts#L346-L456>.
- **[S7]** Deduplication user and developer documentation:
  <https://crawler.docs.browsertrix.com/user-guide/dedupe/>,
  <https://crawler.docs.browsertrix.com/develop/dedupe/>.
- **[S8]** Rate-limit/CAPTCHA detection:
  <https://crawler.docs.browsertrix.com/user-guide/rate-limits/>.
- **[S9]** Browser profiles:
  <https://crawler.docs.browsertrix.com/user-guide/browser-profiles/>.
- **[S10]** Webrecorder, WACZ 1.1.1 specification:
  <https://specs.webrecorder.net/wacz/1.1.1/>.
- **[S11]** Browsertrix workflow settings:
  <https://docs.browsertrix.com/user-guide/workflow-setup/>.
- **[S12]** Browsertrix crawl workflows and running crawls:
  <https://docs.browsertrix.com/user-guide/crawl-workflows/>,
  <https://docs.browsertrix.com/user-guide/running-crawl/>.
- **[S13]** Browsertrix deployment customization and pinned NetworkPolicy:
  <https://docs.browsertrix.com/deploy/customization/>,
  <https://github.com/webrecorder/browsertrix/blob/7e25d4a0bac7420cdefbfc0473f02cf479dfa3c6/chart/templates/networkpolicies.yaml>.
- **[S14]** Pinned crawler pod and scale implementation:
  <https://github.com/webrecorder/browsertrix/blob/7e25d4a0bac7420cdefbfc0473f02cf479dfa3c6/chart/app-templates/crawler.yaml>,
  <https://github.com/webrecorder/browsertrix/blob/7e25d4a0bac7420cdefbfc0473f02cf479dfa3c6/backend/btrixcloud/operator/crawls.py#L335-L378>.
- **[S15]** Browsertrix platform README and license statement:
  <https://github.com/webrecorder/browsertrix/blob/7e25d4a0bac7420cdefbfc0473f02cf479dfa3c6/README.md>,
  <https://github.com/webrecorder/browsertrix/blob/7e25d4a0bac7420cdefbfc0473f02cf479dfa3c6/LICENSE>.
- **[S16]** Pinned Browsertrix chart defaults and crawler arguments:
  <https://github.com/webrecorder/browsertrix/blob/7e25d4a0bac7420cdefbfc0473f02cf479dfa3c6/chart/values.yaml>,
  <https://github.com/webrecorder/browsertrix/blob/7e25d4a0bac7420cdefbfc0473f02cf479dfa3c6/chart/templates/configmap.yaml#L143-L154>.
- **[S17]** Pinned Browsertrix robots implementation:
  <https://github.com/webrecorder/browsertrix-crawler/blob/e0ff93b21fe40d165cf02a01fb375f02c8003a01/src/util/robots.ts#L17-L124>,
  <https://github.com/webrecorder/browsertrix-crawler/blob/e0ff93b21fe40d165cf02a01fb375f02c8003a01/src/util/state.ts#L1849-L1878>.
- **[S18]** IETF RFC 9309, Robots Exclusion Protocol, and IIPC WARC 1.1:
  <https://www.rfc-editor.org/rfc/rfc9309>,
  <https://iipc.github.io/warc-specifications/specifications/warc-format/warc-1.1/>.
- **[S19]** Browser behavior documentation and pinned Chromium arguments:
  <https://crawler.docs.browsertrix.com/user-guide/behaviors/>,
  <https://github.com/webrecorder/browsertrix-crawler/blob/e0ff93b21fe40d165cf02a01fb375f02c8003a01/src/util/browser.ts#L390-L421>.
- **[S20]** Browsertrix Crawler QA documentation:
  <https://crawler.docs.browsertrix.com/user-guide/qa/>.
- **[S21]** Webrecorder published advisory, `CVE-2026-54501` /
  `GHSA-47vv-v544-r985`:
  <https://github.com/webrecorder/browsertrix/security/advisories/GHSA-47vv-v544-r985>.
- **[S22]** GitHub repository advisory API queried for Browsertrix Crawler:
  <https://api.github.com/repos/webrecorder/browsertrix-crawler/security-advisories>.
