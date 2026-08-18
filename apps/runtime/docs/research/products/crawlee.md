# Crawlee reverse-engineering dossier

**Date:** 2026-08-17  
**Decision:** which Crawlee concepts, if any, should inform Curiosity's owned,
bounded public-web crawl plane without importing crawler authority, hosted
coupling, or third-party implementation.  
**Status:** research only; no implementation or dependency decision.  
**Product examined:** Crawlee for JavaScript, package version `3.18.1`, official
repository `master` at commit
[`7667e20414bdb1937fafa9b1ecd890d00c663f8f`](https://github.com/apify/crawlee/tree/7667e20414bdb1937fafa9b1ecd890d00c663f8f)
(checked out read-only on 2026-08-17). The public API pages available during the
inspection linked to an earlier generated-source commit, so consequential
defaults were checked against the named repository snapshot.

## Executive verdict

**ADAPT concepts, REJECT as the owned crawl core (high confidence).** Crawlee is
a capable job-oriented crawling framework: a persistent unique-key request
queue feeds a resource-aware task pool; crawlers share retries, sessions,
proxies, routing and storage; HTTP parsers and real browsers are separate
implementations behind similar handler conventions. Its best lessons for
Curiosity are the explicit request lifecycle, pluggable storage interface,
separate session-rotation budget, resource feedback, skipped-request reasons,
and static-before-browser experiment.

It is not a ready-made Curiosity frontier or security boundary. Robots
compliance is opt-in and fail-open, same-domain delay defaults to zero, the
resource autoscaler is not a host-politeness scheduler, terminal failures are
marked handled, local persistence is optimized for a process/job rather than a
large distributed corpus, and no built-in private-network/SSRF boundary or
response-byte ceiling was identified in the inspected HTTP path. Plain HTTP
TLS verification is disabled by default. The framework emphasizes avoiding bot
blocking, including proxy/fingerprint rotation and optional challenge bypass;
Curiosity instead needs publisher policy, identifiable crawling, hard egress
controls and auditability.

Crawlee itself is Apache-2.0, not AGPL. It runs locally without Apify, but its
types, vocabulary, packages and migration/cloud paths are strongly shaped for
Apify Platform. Direct adoption would also make the supposedly owned core
third-party code and pull a broad dependency graph. Learn from behavior and
public contracts; independently specify and implement only approved concepts.

## 1. Frame, method and limits

### 1.1 Bounded questions

1. How do requests move from discovery through queueing, locking, retries and
   completion?
2. What does autoscaling control, and what politeness guarantees does it not
   provide?
3. How are proxy identity, cookies, blocking and retries coupled?
4. Are HTTP and browser crawling genuinely separate lanes, and how does the
   experimental adaptive crawler choose between them?
5. What persistence and result semantics do queues, datasets and key-value
   stores offer locally and on Apify?
6. What scope, robots, security, license and hosted-service boundaries matter
   for Curiosity?

**Depth budget:** official documentation plus bounded clean-room source
inspection of the current queue, crawler, autoscaling, session, storage,
robots, link-scope and adaptive-rendering paths. No crawler was run; no code was
copied; no anti-bot behavior was tested; no legal conclusion or exhaustive
dependency audit was attempted.

### 1.2 Method and labels

Official Crawlee/Apify docs and the public Apify repository were accessed
2026-08-17. The repository was cloned only into the approved temporary area and
inspected at the commit above. Documentation establishes intended behavior;
source establishes the inspected snapshot's implementation, not every release
or deployment. Vendor claims such as “human-like” or “fly under the radar” are
capability positioning, not independently validated performance [S1].

- **FACT** — directly supported by a cited official source or inspected source.
- **INFERENCE** — reasoned architectural conclusion, not measured here.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Reconstructed system model

```text
seed URLs / RequestList / discovered links
  -> scope + optional robots filtering
  -> Request { URL, uniqueKey, userData, retry/session counters, depth }
  -> RequestQueue (pending -> lock/in progress -> handled | reclaim)
  -> AutoscaledPool readiness + CPU/memory/event-loop feedback
  -> shared BasicCrawler lifecycle
       -> session selection -> proxy affinity -> navigation
       -> HTTP lane (raw/Cheerio/JSDOM/LinkeDOM)
          or browser lane (Playwright/Puppeteer)
       -> handler/router -> enqueue links + write results
       -> success: mark handled
       -> failure: retry/reclaim, rotate session, or terminally mark handled
  -> Dataset (append results) / KeyValueStore (files and state)
  -> periodic state persistence and migration hooks
```

**FACT (high):** the common `BasicCrawler` supplies queue consumption,
autoscaling, retry/session policy, routing and statistics; `HttpCrawler` and
browser crawlers add navigation and extraction behavior [S7, S9].

**INFERENCE (high):** Crawlee is primarily an execution framework for bounded
scraping jobs, not a complete search-engine crawl plane. It has no first-class
immutable capture/version graph, WARC chain of custody, canonical-document
model, recrawl policy, publisher takedown workflow, index handoff, or evidence
contract in the inspected surface.

## 3. Request frontier and lifecycle

### 3.1 Queue identity, order and discovery

**FACT (high):** `RequestQueue` accepts dynamic additions and supports normal
and `forefront` insertion, corresponding broadly to breadth-first and
depth-first behavior. Requests are unique by `uniqueKey`; the default derives
from URL, normally removing the fragment. An existing key is not updated. The
caller can preserve fragments, include method/payload in an extended key, or
override the key [S2, S14].

**FACT (high):** queue operations separate `fetchNextRequest`,
`markRequestHandled`, and `reclaimRequest`. A temporary `null` fetch does not
prove completion; `isFinished` accounts for in-progress work and promises no
false positive, though it can return a false negative with distributed storage.
The v2 provider uses request locks; the crawler sizes a lock to handler timeout
plus padding [S2, S7].

**FACT (high):** bulk insertion is deliberately staged. `addRequests` uses
batches of 25 and waits for all; `addRequestsBatched`/crawler insertion can wait
for an initial batch (documented as 1,000) and enqueue the remainder in the
background [S2]. A static `RequestList` can hold a known immutable set; when
combined with a queue, list entries pass through the queue to avoid duplicate
processing [S3].

**INFERENCE (high):** this is at-least-once-like work delivery rather than
exactly-once result production. Lock expiry, host migration, process death
between side effect and acknowledgement, and the source's own migration warning
can duplicate work. `uniqueKey` suppresses duplicate queue records but cannot
make downstream side effects atomic [S2, S7].

**RECOMMENDATION (high):** ADAPT the explicit state machine and idempotency key,
but make Curiosity states and reasons durable: discovered, policy-blocked,
scheduled, leased, fetched, capture-committed, derived, terminal-failed and
superseded. A fetch must be acknowledged only after an immutable capture or an
explicit bounded failure record commits. Separate URL identity, fetch-attempt
identity and document/version identity; Crawlee's `uniqueKey` is not enough.

### 3.2 Retry accounting

**FACT (high):** ordinary navigation, hook and handler errors default to three
retries; per-request `maxRetries` can override the crawler. Before each retry an
`errorHandler` can modify the request; after exhaustion a
`failedRequestHandler` runs. The request is then marked handled, so “handled”
includes terminal failure [S7].

**FACT (high):** session failures have a separate default ceiling of ten
rotations and do not consume ordinary retries. `NonRetryableError` stops retry;
`RetryRequestError` deliberately overrides the retry ceiling and can retry
indefinitely; `CriticalError` shuts down the crawler [S7, S8].

**INFERENCE (high):** defaults can multiply attempts, and the explicit
unbounded retry error is incompatible with a hard-cost retrieval plane unless
an outer budget always dominates. Conflating failed and successfully handled
requests also obscures corpus coverage.

**RECOMMENDATION (high):** ADAPT typed failure classes and independent network,
render and identity budgets, but prohibit any retry mechanism from escaping the
aggregate request/host/job deadline, byte, attempt and cost limits. Persist each
attempt and terminal reason; never report terminal failure as successful
handling.

## 4. Autoscaling versus politeness

**FACT (high):** `AutoscaledPool` starts asynchronous tasks only when work is
ready and system status permits. `Snapshotter` and `SystemStatus` observe CPU,
memory and event-loop pressure (plus platform-aware data on Apify). Current
defaults are minimum concurrency 1, maximum 200, desired concurrency initially
the minimum, 0.9 desired-concurrency ratio, 5% scale steps, 0.5-second task
check, 10-second autoscale check, and unlimited tasks per minute [S4, S6].

**FACT (high):** crawler shorthands expose min/max concurrency and a global
requests-per-minute ceiling. `sameDomainDelaySecs` exists but defaults to zero.
`maxRequestsPerCrawl` is recommended by Crawlee to prevent infinite crawls, but
parallel execution can overshoot it slightly [S6].

**INFERENCE (high):** host-resource autoscaling and publisher politeness are
orthogonal. A healthy machine can increase concurrency precisely when a target
should be slowed. The global rate cap and one same-domain delay do not establish
per-origin fairness, adaptive 429/latency backoff, robots cache policy, or
multi-tenant quotas.

**RECOMMENDATION (high):** ADAPT resource feedback only behind a stricter
scheduler: per normalized authority token buckets, minimum delay, concurrency
caps, robots/policy gates, adaptive backoff, tenant and job budgets, and global
kill switches. The politeness scheduler decides eligibility; the resource
controller decides whether an eligible task can run. Curiosity should default
far below 200 and never default to unlimited request rate.

## 5. Sessions, proxies and identity

**FACT (high):** `SessionPool` models a user-like identity containing cookies,
custom data and a stable ID used for proxy affinity. It creates sessions until
the pool is full, then chooses randomly; defaults in the inspected snapshot are
1,000 sessions per pool, 3 maximum error score, 0.5 success decrement, 50 uses
and 3,000 seconds maximum age. Pool state is periodically stored in a key-value
store by default [S5, S15].

**FACT (high):** 401, 403 and 429 are blocked-status defaults. A bad result can
increment error score, a definite block can retire the session, and a good
result increments usage while reducing prior error score. HTTP and browser
crawlers persist cookies per session by default when the session pool is active
[S5, S7].

**FACT (high):** `ProxyConfiguration` supports round-robin custom proxies,
caller-defined selection, stable session-to-proxy mapping, and tiered proxies
that escalate on blocking and periodically probe cheaper/lower tiers [S10]. The
docs separately support Apify Proxy through the Apify SDK [S13]. Browser
fingerprint generation is enabled by default for Playwright/Puppeteer, and the
framework documents Camoufox plus a Cloudflare challenge helper [S11].

**INFERENCE (high):** cookies, authorization data and proxy credentials make
session persistence a secret-bearing store, not harmless crawl state. Rotating
identities to bypass blocks is also the opposite of an identifiable public-web
crawler's policy goal. A 401 can mean authentication is required rather than
bot blocking; 403 and 429 are similarly ambiguous.

**RECOMMENDATION (high):** REJECT anti-block circumvention, fingerprint
spoofing, challenge solving and automatic proxy escalation for Curiosity's
baseline crawl. Use a stable published crawler identity; interpret 401/403/429
as policy/backoff signals. If geo routing or egress proxies later become
authorized, separate proxy choice from publisher identity, never persist proxy
URLs or credentials in frontier/result records, encrypt any cookie store, scope
cookies to an approved source and job, and default to no cookies.

## 6. Static and browser lanes

**FACT (high):** the static family uses plain HTTP and can expose raw bodies or
parse HTML with Cheerio, JSDOM or LinkeDOM; default accepted types include HTML,
XHTML, XML and JSON. The browser family uses Playwright or Puppeteer and a
browser pool, supporting JavaScript rendering and browser hooks. Both inherit
the basic queue/retry/session lifecycle [S1, S9].

**FACT (high):** `AdaptivePlaywrightCrawler` is explicitly experimental. It
offers a restricted handler to permit an HTTP-only run, samples rendering-type
detection at a default ratio of 0.1, compares static and browser results (or a
caller quality check), and falls back to browser when static access needs a
page, fails quality, or produces an eligible error. It warns that handler side
effects may be repeated and defaults to preventing direct storage access in the
adaptive handler [S12].

**INFERENCE (high):** the adaptive design contains a valuable economic idea—pay
for rendering only when it changes accepted output—but it also reveals why
lane switching must be transactional. Re-running the same handler can duplicate
external writes; deep equality of extracted dataset rows is not a general
measure of evidence completeness.

**RECOMMENDATION (high):** ADAPT as two explicit queues, not a transparent
handler retry. Static capture always comes first. A deterministic quality gate
records why rendering is needed (missing required content, client shell,
authorized source rule), then creates a distinct render attempt. Compare
content/evidence gain against static capture, commit outputs idempotently, and
measure browser-seconds and incremental accepted passages. Browsers require
disposable profiles, no ambient credentials, no downloads, no intranet access,
strict subprocess/resource limits and rapid patching.

## 7. Storage, datasets and persistence

### 7.1 Local semantics

**FACT (high):** the default `MemoryStorage` keeps active data in memory while
off-loading it under `./storage` (or `CRAWLEE_STORAGE_DIR`). Request queues,
datasets and key-value stores share a `StorageClient` abstraction. Persistence
defaults true, while default stores are purged at run start by default unless
configuration changes that behavior [S3, S16].

**FACT (high):** a dataset is append-only structured rows; locally each item is
a numbered JSON file. A key-value store holds MIME-typed arbitrary values such
as input/output JSON, screenshots, files and crawler state. Queue records are
persisted locally. Dataset items are limited to just under 9 MB in the public
API, and batched writes preserve order but are not transactional: a failed
batch can leave a committed prefix [S3, S17].

**FACT (high):** session state and statistics can persist in key-value storage;
request lists can persist progress; the crawler pauses on migration and warns
that requests still running at migration may duplicate results [S5, S7].

**INFERENCE (high):** “persistent” means restart/migration assistance under the
chosen storage client, not immutable archival durability or exactly-once
processing. Purge-on-start is convenient for isolated jobs but dangerous for a
long-lived corpus. A mutable key-value state snapshot and append dataset do not
provide capture lineage, atomic capture/frontier commit, schema evolution,
tombstones or reproducible derivation.

### 7.2 Cloud and provider coupling

**FACT (high):** Crawlee's default configuration creates local
`MemoryStorage`, and its docs state that Crawlee runs locally or on any cloud.
Using Apify Platform requires the separate Apify SDK/Actor initialization to
select cloud storage and lifecycle; platform services add Actors, scheduling,
webhooks, storage and Apify Proxy [S13, S16].

**FACT (high):** the neutral-looking storage API closely mirrors Apify's three
storage products and metadata. API docs describe queue operations in terms of
the Apify API shape; autoscaling and migration hooks can consume Apify platform
signals; `@crawlee/core` depends on several `@apify/*` packages [S2, S4, S18].

**INFERENCE (high):** there is no mandatory hosted runtime coupling, but there
is substantial architectural and ecosystem coupling. Swapping a `StorageClient`
is possible; proving a production-grade non-Apify distributed implementation
with equivalent lease, concurrency and migration semantics is separate work.
The official Apify platform documentation states that a cloud request queue can
only be processed by one Actor/task run at a time, further distinguishing it
from a globally partitioned frontier [S19].

**RECOMMENDATION (high):** ADAPT provider-neutral storage ports, but define
Curiosity's domain contracts independently of Apify names and wire shapes.
Store immutable captures in an object/capture plane, frontier leases and policy
decisions in a transactional control plane, and derived rows in versioned
datasets. Do not make Apify credentials, Actor lifecycle, public storage IDs or
retention policy part of the crawler domain.

## 8. Scope and robots

**FACT (high):** `enqueueLinks` defaults to same hostname when no explicit
patterns are provided and can instead allow same registrable domain (including
subdomains), same origin (scheme + hostname), or all HTTP(S). Globs, regexes,
exclusions, depth, limits and transformation hooks further constrain discovery.
Redirect targets that leave the selected strategy can be skipped, and skipped
reasons are exposed to callbacks [S6, S20].

**FACT (high):** `respectRobotsTxtFile` defaults to **false**. When enabled, the
crawler fetches `/robots.txt`, caches up to 1,000 origins in an in-memory LRU,
checks either `*` or a configured user-agent, and filters both dispatch and
newly enqueued links. A 404 is allow-all; parser `undefined` is treated allowed;
other fetch errors are logged and treated as no robots file, therefore allowed
[S6, S21].

**INFERENCE (high):** link scope is not authorization. “Same domain” can cross
organizational subdomains and both HTTP/HTTPS; “all” can escape to arbitrary
origins. The robots behavior is convenience-oriented, fail-open, non-versioned
and has no documented RFC 9309 cache-age decision record. It is not adequate as
Curiosity's policy evidence.

**RECOMMENDATION (high):** ADAPT explicit scope strategies and skipped-reason
telemetry, but default to an allowlisted corpus and same-origin/approved-host
expansion. Robots must be mandatory for public crawling, conservatively
fail-closed or defer on unavailable/ambiguous policy, follow RFC 9309, use the
actual published crawler user-agent, and persist fetched bytes/hash, status,
fetch time, expiry and exact rule decision with every attempt. Robots remains
neither authorization nor a copyright/privacy license.

## 9. Security analysis

### 9.1 Positive controls found

- **FACT (high):** hard handler/navigation timeouts, MIME allowlisting,
  bounded ordinary/session retries, total crawl/depth limits, resource-aware
  concurrency, request URL protocol validation (`http`/`https` in local queue),
  storage path confinement, browser-pool isolation primitives and skipped
  redirect/scope checks are available [S6, S7, S9].
- **FACT (high):** the adaptive crawler can forbid direct storage calls while a
  handler may be replayed, reducing one duplicate-side-effect class [S12].
- **FACT (high):** proxy and session data are structured rather than ambient in
  handler logic, allowing an adopter to wrap them with policy [S5, S10].

### 9.2 Material gaps/default hazards

- **FACT (high):** `HttpCrawler` defaults `ignoreSslErrors` to true and sets
  `rejectUnauthorized` false; browser contexts also set
  `ignoreHTTPSErrors: true` in the inspected browser crawler. This weakens
  server authentication [S9, S22].
- **FACT (high):** HTTP bodies are streamed and then concatenated to a buffer in
  the inspected parse path. No first-party body-byte/decompression ceiling was
  found in the crawler option or parse path reviewed; MIME rejection occurs
  after response headers, not as a general size bound [S9].
- **NEGATIVE RESULT (medium):** no built-in DNS/IP egress policy preventing
  loopback, link-local, RFC1918/ULA, cloud metadata, UNIX/local services or DNS
  rebinding was identified in official options or the bounded source searches.
  This is not proof none exists elsewhere; it is sufficient to reject Crawlee
  itself as the Curiosity SSRF boundary.
- **FACT (high):** robots is off and same-domain delay is zero by default;
  anti-blocking/fingerprint features are on or promoted in browser workflows
  [S6, S11].
- **FACT (high):** cookies and arbitrary `userData` persist with session state;
  request headers/payload and errors can persist with request state. Untrusted
  pages, redirects and handler logging therefore create secret/PII leakage risk
  unless the caller imposes controls [S5, S14].
- **FACT (medium):** GitHub reported no repository `SECURITY.md` and no
  published repository advisories on the inspected security page. This says
  nothing about package advisories elsewhere [S23].

**RECOMMENDATION (high):** Curiosity needs a separate network-security gate on
every initial URL, DNS answer and redirect; TLS verification on; strict
redirect, header, body, decompressed-byte, ratio, MIME and time ceilings;
streaming capture; parser/browser sandboxes; no ambient cloud credentials;
malware and prompt-injection treatment; secrets redaction; and append-only
policy/audit records. Search results and page content remain untrusted data and
must never grant further tools or authority.

## 10. License and clean-room boundary

**FACT (high):** the repository and published packages declare Apache License
2.0. The license grants copyright and contributor patent permissions subject to
conditions including supplying the license, marking modified files, preserving
notices, and handling any `NOTICE` obligations; it does not grant trademark
rights [S18, S24]. Crawlee is therefore not AGPL and must not be described as
such.

**INFERENCE (high):** Apache-2.0 permits direct use subject to obligations, but
direct use or copied/translated implementation would still be third-party
software and would contradict a strict “wholly owned core” interpretation.
Dependencies (including Playwright/Puppeteer and `@apify/*`) require their own
version-specific license and vulnerability review; Crawlee's project license is
not a blanket license for the dependency graph.

**RECOMMENDATION (high):** for clean-room learning, retain this dossier and its
source commit, derive an independently reviewed functional specification, use
independently authored fixtures, and do not copy code, tests, comments, names or
default constants merely for compatibility. Public ideas suitable for
independent implementation include leased work queues, feedback controllers,
idempotency keys, session health state and two-lane quality gates. Any proposal
to import Crawlee packages is a separate dependency exception, not an outcome
of this research.

## 11. Curiosity implications and verdict ledger

| Crawlee concept | Verdict | Curiosity adaptation | Confidence |
| --- | --- | --- | --- |
| Request fetch/reclaim/ack lifecycle | **ADAPTED** | Durable typed frontier states; ack only after capture/failure commit | High |
| URL `uniqueKey` dedupe | **ADAPTED** | Separate URL, attempt, capture and document identities | High |
| Forefront/BFS controls | **ADAPTED** | Explicit priority classes with fairness and trap budgets | High |
| Resource-aware autoscaling | **ADAPTED** | Secondary admission gate behind host/tenant politeness | High |
| Default limits/retries | **REJECTED as defaults** | Hard aggregate attempt/byte/time/cost ceilings; no unbounded retry | High |
| Sessions/cookie affinity | **DEFERRED/restricted** | Only for explicitly authorized sources; encrypted and source/job scoped | High |
| Anti-blocking/proxy escalation/fingerprint spoofing | **REJECTED** | Treat blocks as policy/backoff; identifiable crawler | High |
| HTTP-first/browser fallback | **ADAPTED** | Explicit static and sandboxed render attempts with gain measurement | High |
| Adaptive crawler implementation | **REJECTED** | Experimental/replay semantics; use independent two-queue design | High |
| Dataset/KVS result model | **ADAPTED narrowly** | Append events and opaque objects, but add immutable capture/version lineage | High |
| Storage client port | **ADAPTED** | Provider-neutral domain port, not Apify-shaped contract | High |
| Robots implementation/default | **REJECTED** | Mandatory RFC/policy service with persisted, conservative decisions | High |
| Crawlee package in owned core | **REJECTED under current premise** | Learning/benchmark oracle only unless ownership policy changes | High |
| Apify Platform/Proxy | **REJECTED as foundation** | Hosted coupling, credentials, retention and opaque service dependency | High |
| Apache-2.0 concepts/docs study | **ADOPTED with attribution** | Clean-room specification and independent implementation | High |

### Required checks before any reconsideration

1. **Security check:** adversarial SSRF/DNS-rebinding, redirects, TLS, response
   bombs, malformed encodings, browser escape, download and credential tests.
2. **Durability check:** crash at every fetch/capture/ack boundary; lease expiry;
   duplicate and lost-work measurement; restore from a clean host.
3. **Politeness check:** per-authority concurrency/delay, 429/503 adaptation,
   robots versioning, complaint kill switch and cross-tenant fairness.
4. **Lane check:** static-versus-render evidence gain by source class, browser
   cost, replay idempotency and sandbox isolation.
5. **License check:** exact package/dependency SBOM, notices, patents/trademark,
   and whether “owned” permits any third-party runtime library.
6. **Provider-neutrality check:** demonstrate the frontier/capture contracts and
   restore procedure without Apify API types, credentials or lifecycle.

## 12. Unknowns and retained negative results

- **UNKNOWN:** current production-scale behavior of local `MemoryStorage`; no
  load, crash or multi-process benchmark was run.
- **UNKNOWN:** completeness and RFC 9309 conformance of the transitive
  `robots-parser` behavior across edge cases; only Crawlee's wrapper/defaults
  were inspected.
- **UNKNOWN:** actual anti-block success, relevance, cost or legal acceptability;
  no evasion testing was authorized or performed.
- **UNKNOWN:** vulnerability status of the full exact dependency lockfile and
  browser binaries; repository GitHub advisories are not an SBOM audit.
- **UNKNOWN:** equivalence of third-party `StorageClient` implementations or
  Apify cloud semantics under partitions; no cloud account/API was used.
- **NEGATIVE RESULT:** no WARC capture, immutable page-version/provenance model,
  recrawl scheduler, index contract or takedown workflow was found in the
  inspected Crawlee core surface.
- **NEGATIVE RESULT:** no built-in SSRF/private-address or response-byte ceiling
  was found in the bounded official options/source inspection.
- **NEGATIVE RESULT:** no official claim found that robots is on by default; the
  source conclusively sets it false.
- **NEGATIVE RESULT:** no independent benchmark supports Crawlee's marketing
  claims against bot protection; those claims were not used as evidence.

## 13. Bounded curiosity pass and stop

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify robots default and failure mode in current source | 5 | 5 | 4 | 1 | **Pursued:** opt-in, 404/parser absence allow, other fetch errors fail open [S7, S21]. |
| Verify TLS and response-size posture | 5 | 5 | 5 | 2 | **Pursued:** TLS verification disabled by default; no body ceiling found in bounded path [S9, S22]. |
| Distinguish local independence from Apify coupling | 5 | 5 | 3 | 2 | **Pursued:** local client is default; cloud requires Apify SDK, while contracts/dependencies remain Apify-shaped [S13, S16, S18]. |
| Benchmark queue crash consistency live | 4 | 5 | 3 | 4 | `CURIOSITY_NO_GO`: no implementation/test authority or agreed workload; required later check. |
| Test anti-bot and challenge bypass | 1 | 1 | 2 | 5 | `CURIOSITY_NO_GO`: outside Curiosity policy, unnecessary and potentially abusive. |
| Audit every transitive dependency license/CVE | 3 | 4 | 2 | 5 | `CURIOSITY_NO_GO`: only needed if dependency adoption is proposed. |
| Reverse engineer Apify hosted internals | 1 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: proprietary, unnecessary and outside clean-room boundary. |

**Coverage:** all caller-requested queue, autoscale, session/proxy, retry,
static/browser, storage, scope/robots, persistence, security, hosted and license
categories have evidence and a Curiosity verdict.  
**Saturation:** further official pages repeated the same public abstractions;
source inspection changed the decision only on robots fail-open, TLS default,
body buffering and Apify-independent local storage.  
**Stop:** coverage and bounded curiosity budget reached. Live tests and
dependency adoption require new caller authority.

## 14. Official sources

All sources accessed 2026-08-17.

1. **[S1] Crawlee introduction and official repository README.**
   https://crawlee.dev/js/docs/introduction and
   https://github.com/apify/crawlee — product scope, crawler families, feature
   and independence claims.
2. **[S2] RequestQueue API.**
   https://crawlee.dev/js/api/core/class/RequestQueue — uniqueness, batching,
   fetch/reclaim/handle, completion and storage semantics.
3. **[S3] Request and result storage guides.**
   https://crawlee.dev/js/docs/guides/request-storage and
   https://crawlee.dev/js/docs/guides/result-storage — local paths,
   RequestList, queue, dataset, KVS and purge behavior.
4. **[S4] AutoscaledPool API and scaling guide.**
   https://crawlee.dev/js/api/core/class/AutoscaledPool and
   https://crawlee.dev/js/docs/guides/scaling-crawlers — feedback model and
   documented controls.
5. **[S5] Session management guide and Session API.**
   https://crawlee.dev/js/docs/guides/session-management and
   https://crawlee.dev/js/api/core/class/Session — cookie/identity health and
   retirement semantics.
6. **[S6] BasicCrawlerOptions API.**
   https://crawlee.dev/js/api/basic-crawler/interface/BasicCrawlerOptions —
   public retry, robots, depth, rate, delay and crawl-limit contract.
7. **[S7] BasicCrawler current source.**
   https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/basic-crawler/src/internals/basic-crawler.ts
   — current defaults, queue locks, robots failure handling, retries and
   migration warning.
8. **[S8] Current crawler error classes.**
   https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/core/src/errors.ts
   — retry, non-retry, critical and session error semantics.
9. **[S9] HttpCrawler API and current source.**
   https://crawlee.dev/js/api/http-crawler/interface/HttpCrawlerOptions and
   https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/http-crawler/src/internals/http-crawler.ts
   — HTTP lane, types, cookies, status handling, TLS and body parsing.
10. **[S10] Proxy management guide.**
    https://crawlee.dev/js/docs/guides/proxy-management — custom, sticky and
    tiered proxy behavior.
11. **[S11] Avoid blocking guide.**
    https://crawlee.dev/js/docs/guides/avoid-blocking — default browser
    fingerprints and documented challenge-bypass path.
12. **[S12] AdaptivePlaywrightCrawler API and current source.**
    https://crawlee.dev/js/api/playwright-crawler/class/AdaptivePlaywrightCrawler
    and
    https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/playwright-crawler/src/internals/adaptive-playwright-crawler.ts
    — experimental static/browser choice and replay constraints.
13. **[S13] Crawlee deployment on Apify.**
    https://crawlee.dev/js/docs/deployment/apify-platform — independent local
    use versus Actor, cloud storage and proxy integration.
14. **[S14] Current Request source.**
    https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/core/src/request.ts
    — request identity, metadata, depth and retry fields.
15. **[S15] Current SessionPool and Session source.**
    https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/core/src/session_pool/session_pool.ts and
    https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/core/src/session_pool/session.ts
    — current allocation, persistence and defaults.
16. **[S16] Current Configuration source/API.**
    https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/core/src/configuration.ts and
    https://crawlee.dev/js/api/core/class/Configuration — local storage client,
    persistence and purge configuration.
17. **[S17] Current Dataset source.**
    https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/core/src/storages/dataset.ts
    — item limits and non-transactional batching.
18. **[S18] Current package manifests.**
    https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/crawlee/package.json and
    https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/core/package.json
    — version, package surface, license declaration and dependencies.
19. **[S19] Apify Platform storage documentation.**
    https://docs.apify.com/storage — hosted retention, access, rate and
    concurrency semantics.
20. **[S20] enqueueLinks and EnqueueStrategy APIs.**
    https://crawlee.dev/js/api/core/function/enqueueLinks and
    https://crawlee.dev/js/api/core/enum/EnqueueStrategy — discovery filters and
    host/domain/origin scope.
21. **[S21] Current robots wrapper source.**
    https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/utils/src/internals/robots.ts
    — fetch, 404, parser-default and sitemap filtering behavior.
22. **[S22] Current browser crawler source.**
    https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/packages/browser-crawler/src/internals/browser-crawler.ts
    — browser navigation context, TLS-ignore and session-cookie behavior.
23. **[S23] GitHub repository security page.**
    https://github.com/apify/crawlee/security — absence of repository security
    policy/advisories at access time; not a full vulnerability source.
24. **[S24] Crawlee Apache-2.0 license.**
    https://github.com/apify/crawlee/blob/7667e20414bdb1937fafa9b1ecd890d00c663f8f/LICENSE.md
    — authoritative project license and conditions.
