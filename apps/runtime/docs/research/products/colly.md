# Colly crawler framework: clean-room reverse engineering

**Research date:** 2026-08-17  
**Decision frame:** Which architectural ideas from Colly should Curiosity adopt,
adapt, reject, or defer for a bounded, provider-neutral retrieval subsystem?  
**Scope:** callback architecture; concurrency; limits and per-domain throttling;
revisit/deduplication and storage; robots behavior; retry/error semantics;
extensions; scaling and security; license and clean-room lessons.  
**Out of scope:** copying Colly code, implementing an adapter, benchmarking claims
against the public internet, and legal advice.

## Executive verdict

Colly is best understood as an embeddable, callback-driven HTTP fetch-and-parse
library, not as a complete durable crawl control plane. A `Collector` owns policy,
transport, state, and ordered callback lists; a request passes through checks,
network I/O, response callbacks, HTML/XML selector callbacks, and a final scraped
callback. Optional asynchronous dispatch, host-pattern limit rules, queue and
storage interfaces make the small core composable. [S1][S2][S5]

For Curiosity, **adopt the staged lifecycle and early header gate as concepts;
adapt the limit, dedup, queue, storage, context, and extension seams into explicit
provider-neutral contracts; reject Colly's permissive defaults and implicit retry
style; defer direct dependency adoption until a Go runtime need exists.** Colly's
compact API is instructive, but its defaults and state model do not supply the
hard global budgets, atomic leasing, SSRF controls, durable attempt history, or
fail-closed robots policy expected of a bounded retrieval service.

**Overall confidence: high** for mechanics (read from pinned source and checked by
tests), **medium-high** for operational implications (reasoned from those
mechanics), and **low/unknown** for production throughput and very large distributed
deployments (not independently benchmarked).

## Version and evidence boundary

- The latest version published by the Go module proxy and shown by `pkg.go.dev` is
  **v2.3.0**, published 2025-12-04 under Apache-2.0. [S10][S11]
- GitHub's “latest release” API still returned v2.2.0, while the repository has an
  annotated v2.3.0 tag and the authoritative Go distribution path serves v2.3.0.
  Consumers should resolve Go module versions through the Go registry, not the
  GitHub Releases badge/API alone. [S10][S11][S12]
- The main source inspection was pinned to upstream `master` commit
  `17d1d6ca92bd32a5651f34256bf7a2855c967f65` (2026-08-14). It is 34 commits after
  v2.3.0, so master-only behavior is not assumed to be in v2.3.0. [S1][S12]
- The official website remains useful for project intent, but several examples use
  the v1 import path and its configuration list lags current source. It is treated
  as corroboration, not as the final API authority. [S8][S9]
- All sources below are official project, repository, Go registry, or upstream
  license sources and were accessed 2026-08-17.

## 1. Architecture and request lifecycle

### 1.1 Core object model

**FACT — High confidence.** `Collector` combines:

- crawl policy (`AllowedDomains`, URL filters, depth/request/body bounds, revisit
  policy, robots toggle);
- execution (`http.Client`, wait group, async mode, redirect handling, cache);
- shared crawl state (visited storage, cookie jar, robots cache);
- ordered callback registries for request, pre-I/O request headers, response
  headers, response, HTML, XML, error, and final scraped events. [S1]

`Request` carries URL, method, headers, body, depth, callback context, request ID,
and collector reference. Descendant visits increment depth and preserve the same
callback context. `Response` carries the bounded in-memory body, headers, status,
request, context, and optional HTTP trace. [S3]

### 1.2 Observed stage order

**FACT — High confidence.** For an accepted request, the effective pipeline is:

1. Parse/normalize URL; set headers and request context.
2. Check depth, approximate request budget, URL/domain filters, robots (when
   enabled), and revisit state.
3. In async mode, launch a goroutine; otherwise continue inline.
4. Run `OnRequest`; an abort here stops without `OnError`.
5. Enter the first matching host limit rule; run `OnRequestHeaders`; perform HTTP.
6. Run `OnResponseHeaders` before reading the body; abort can avoid the download.
7. Read up to `MaxBodySize`; classify transport/non-2xx failures via `OnError`.
8. For accepted responses, run `OnResponse`, then all matching HTML callbacks,
   then XML callbacks, then `OnScraped`. [S1][S2]

Callbacks of a given kind execute in registration order. HTML selectors and XPath
queries are evaluated sequentially within a response. In async mode, separate
responses can execute the same callbacks concurrently, so callback-owned mutable
state must be synchronized by the caller. Registration uses locks, while most
non-selector callback iteration reads the callback slices directly; changing the
callback graph during active async work should not be treated as a safe dynamic
plugin mechanism. [S1]

**INFERENCE — High confidence.** This is an event pipeline with implicit control
flow, not middleware: callbacks do not return a typed decision, do not naturally
compose around the next stage, and generally cannot transform an error into a
success. That simplicity helps one-process scrapers but weakens auditability and
policy isolation.

### 1.3 Parsing behavior

**FACT — High confidence.** HTML parsing is content-type gated (with content
sniffing when absent) and uses CSS selectors; XML callbacks use XPath and can also
run over HTML. A document `<base>` can alter relative-link resolution. The complete
response body is held in memory before parsing. `OnResponseHeaders` is therefore
the only built-in pre-body content gate. Aborting there may prevent HTTP/1.1
connection reuse, a trade-off explicitly documented by Colly. [S1][S3]

**INFERENCE — Medium-high confidence.** A malformed HTML parse error is sent to
`OnError`, but the subsequent XML-stage result overwrites the local error before
`Visit` returns. An HTML parse error can therefore be observable through the error
callback yet absent from the final synchronous return. This deserves a focused
upstream behavior test before relying on exact parser-error propagation.

## 2. Concurrency and scheduling

### 2.1 Async collector

**FACT — High confidence.** With `Async` disabled, `Visit` performs the full
pipeline inline. With it enabled, every accepted scrape starts a goroutine and
returns; `Wait` joins the collector wait group. Host concurrency is separately
controlled by `LimitRule`. [S1]

**INFERENCE — High confidence.** Async admission is not a bounded worker pool.
Goroutines are created before a matching limit semaphore is acquired, so a burst
can create many blocked goroutines even when network parallelism is low. The
request maximum is also checked before the request counter is incremented inside
the goroutine, making it an approximate ceiling under concurrent admission rather
than a strict global budget. [S1][S2]

### 2.2 Queue

**FACT — High confidence.** The separate queue package stores serialized requests
behind a concurrency-safe storage interface and uses a configured number of
consumer goroutines. Its default FIFO is in memory with a default maximum of
100,000 items. `Run` blocks until the queue and active worker count are empty;
`Stop` stops consumption. Worker calls discard `Request.Do` errors, and request
decode/storage-pop errors are skipped by the loop. [S5]

**INFERENCE — High confidence.** Queue success is not delivery success: there is
no built-in acknowledgement, lease, dead-letter queue, attempt record, or retry
schedule. Combining queue workers with an async collector also decouples queue
completion from network completion unless the caller separately waits. This is a
convenience frontier, not durable orchestration.

## 3. Limits and per-domain throttling

**FACT — High confidence.** A `LimitRule` matches a request's `URL.Host` (including
port) by regular expression and/or glob. It provides:

- a semaphore with capacity `max(Parallelism, 1)`;
- fixed delay plus uniformly randomized extra delay;
- first-match-wins selection when multiple rules match.

The semaphore is acquired immediately before the HTTP operation. On completion,
the goroutine sleeps for the configured delay while still holding its slot, then
releases it. Rules can be shared across collectors; current master initializes a
shared rule idempotently, while cloning a rule creates independent limiter state.
[S2]

**INFERENCE — High confidence.** Consequences:

- a rule is a process-local matched-host concurrency gate, not a distributed rate
  limit;
- `Parallelism > 1` plus delay allows request starts in clusters and does not
  guarantee a strict minimum gap across the host;
- unmatched domains are unlimited;
- first-match semantics make rule order consequential;
- ports and hostname spellings can create separate buckets;
- delay after failures also consumes capacity, which is polite but can amplify
  head-of-line blocking;
- robots fetches call the HTTP client directly and bypass limit rules, normal
  callbacks, body bounds, and collector cancellation context. [S1][S2]

**RECOMMENDATION — High confidence.** Curiosity should model independent,
composable controls: global admission, tenant/job budget, origin-key concurrency,
token-bucket start rate, retry budget, queue bound, and byte/time limits. The
origin key should be canonical and policy-defined; distributed workers require a
shared lease/rate authority or conservative partitioning.

## 4. Revisit, deduplication, cache, and storage

### 4.1 Dedup key and timing

**FACT — High confidence.** Revisit suppression is on by default. Colly normalizes
the URL and computes a 64-bit FNV-1a hash over URL plus request body when present.
The method, headers, cookies, and crawl context are not part of the key. It calls
`IsVisited` and then `Visited` before network fetch. Redirect destinations are also
checked/marked, with special handling for redirect cycles. `Request.Retry`
explicitly bypasses the revisit check. [S1][S3]

**INFERENCE — High confidence.** Important semantics:

- “visited” means admitted/marked, not successfully fetched or parsed; an initial
  failure remains deduplicated unless explicitly retried;
- equal URL/body requests with different methods or representations can collide
  semantically, and a 64-bit non-cryptographic hash has an irreducible collision
  risk;
- `IsVisited` followed by `Visited` is not atomic. Two concurrent workers can both
  observe absence and both fetch, even if each storage method is thread-safe;
- a distributed storage adapter centralizes values but cannot make the current
  two-call protocol exactly-once;
- permitting revisits disables this suppression rather than introducing freshness
  or recrawl policy.

### 4.2 Storage seam

**FACT — High confidence.** Core `storage.Storage` has operations for initialization,
visited-ID read/write, and cookie read/write. Default storage is process-local
memory. `SetStorage` also wraps the storage as the collector cookie jar. The
official site lists Redis and community BoltDB, SQLite, MongoDB, and PostgreSQL
backends and recommends custom storage for persistent/distributed visited URLs and
cookies. [S4][S8]

Collector clones have no callbacks but share the HTTP backend, visited storage,
robots cache, cookie jar, debugger, and lock. They receive an independent wait
group and request counters. [S1]

**INFERENCE — High confidence.** Sharing dedup and cookies in one narrow interface
is convenient but couples different consistency, retention, privacy, and tenancy
requirements. Clone sharing can also leak authenticated session state across
logical crawler roles unless deliberately isolated.

### 4.3 HTTP cache

**FACT — High confidence.** Optional disk caching applies only to GET, keys solely
by SHA-1 of URL, persists a serialized response, optionally expires by file age,
does not serve cached 5xx, and bypasses cache when request `Cache-Control` is
`no-cache`. Cache reads still invoke response-header callbacks. [S2]

**INFERENCE — High confidence.** Because request headers, cookies, authorization,
tenant, and response `Vary` are absent from the key, a shared cache directory can
cross-contaminate authenticated or negotiated representations. The body bound is a
read truncation, not an explicit “too large” error, so a truncated document may be
cached and parsed as if complete. Curiosity should not reuse this cache contract.

## 5. Robots behavior

**FACT — High confidence.** Despite advertising robots support, a new collector
sets `IgnoreRobotsTxt = true`; robots restrictions are therefore **ignored by
default**. When enabled:

- non-HEAD requests fetch `scheme://host/robots.txt` on first use;
- the fetch uses the collector HTTP client and configured headers/User-Agent;
- parsed robots data is cached in memory by `u.Host` without expiry;
- Colly selects the group for the collector User-Agent and tests escaped path plus
  normalized query;
- a disallowed target returns `ErrRobotsTxtBlocked` before normal request
  callbacks; HEAD skips robots checking. [S1]

**INFERENCE — High confidence.** No Colly path applies robots `Crawl-delay` or
sitemap directives; only allow/disallow testing is invoked. Concurrent first
requests can race and fetch the same robots file more than once because the cache
read and population are not single-flight. Robots fetch errors fail the target
request, while successfully cached policy can remain stale indefinitely. A change
of request User-Agent inside `OnRequest` occurs too late to affect robots group
selection, which uses `Collector.UserAgent` during preflight.

**RECOMMENDATION — High confidence.** Curiosity should be fail-closed by default
for public crawling, make robots policy an explicit provider/operation decision,
cache with bounded TTL and single-flight, subject robots retrieval itself to SSRF,
timeouts, bytes, and origin throttles, and record the policy snapshot behind each
allow/deny. HEAD must not become a policy bypass.

## 6. Errors and retries

**FACT — High confidence.** Colly has no automatic retry policy. `Request.Retry`
resubmits the same URL, method, depth, context, headers, and seekable body, removes
the explicit Cookie header so the jar can repopulate it, and bypasses revisit
suppression. A non-seekable body is rejected. Retry can be called manually from
`OnError` or another callback. [S3]

By default, transport failures and final HTTP statuses `>= 300` invoke every
`OnError` callback and terminate the successful parse pipeline. With
`ParseHTTPErrorResponse`, status errors are accepted into `OnResponse` and parser
callbacks. Error callbacks are observers: their return type is void and the
original error is still returned in synchronous mode. Async callers receive no
per-request return and must observe callbacks/side effects. Request abort before
I/O returns quietly; response-header abort becomes an error. [S1]

**INFERENCE — High confidence.** Manual callback retry has no built-in attempt
limit, backoff, jitter policy, `Retry-After` handling, idempotency classification,
or durable attempt lineage. In synchronous mode, retry from `OnError` can nest
within the failing call. Treating every 3xx final response as an error and all
`ParseHTTPErrorResponse` statuses as parseable are coarse choices.

**RECOMMENDATION — High confidence.** Curiosity should centralize retry outside
extractor callbacks, with typed failure classes, method/idempotency rules,
deadline-aware exponential backoff, server-hint support, per-request and global
retry budgets, and one durable logical-request ID with numbered attempts.

## 7. Extensions and observability

**FACT — High confidence.** Built-in extensions are ordinary functions that
register callbacks. Current tree includes random desktop/mobile User-Agent,
referer propagation, and URL-length filtering. The referer extension works only
when following links through `Request.Visit`, because that preserves callback
context. Proxy rotation is a separate helper; debugging is a small event-sink
interface. [S6][S7]

The callback context is a lock-protected string-to-any map shared from parent to
child requests. Queue serialization JSON-encodes those values, so arbitrary
in-process values do not necessarily survive queueing. [S3][S5]

**INFERENCE — High confidence.** Callback registration is an elegant low-friction
extension seam but lacks declared capabilities, ordering dependencies, lifecycle,
resource budgets, failure isolation, and trust boundaries. Randomizing User-Agent
also creates a mismatch with robots selection and is inappropriate as a default
identity strategy for a policy-compliant retriever.

**RECOMMENDATION — High confidence.** Adapt extensions into typed stages with
immutable inputs, explicit outputs/decisions, deterministic order, stage budgets,
and declared permissions. Keep tracing/event sinks out-of-band and ensure external
content cannot become unbounded metric labels or unsanitized logs.

## 8. Scale and security assessment

### What scales reasonably

- Async I/O plus per-host semaphores is adequate for bounded, single-process jobs.
- A small storage interface allows persistent visited/cookie state.
- A queue storage interface permits alternative frontiers.
- Clones can separate callback roles while sharing transport/session state.
- HTTP trace and debugger event seams aid local diagnosis. [S1][S4][S5][S7]

### Boundaries and threats

| Area | Finding | Type / confidence | Curiosity implication |
|---|---|---|---|
| SSRF | Domains are allowed by default. Filters inspect URL text/hostname, not resolved IPs; redirects are re-filtered but DNS rebinding and private/link-local destinations are not intrinsically blocked. | Inference / high | Require scheme/port allowlists, canonical host policy, resolve-and-validate on every connection/redirect, private-range denial, and controlled transport. |
| Resource bounds | Body defaults to 10 MiB, client timeout to 10 s, but depth and request count are unlimited; async goroutines/frontier can grow independently. Decompression occurs after the limited compressed read, so expanded output is not bounded by the same byte limit. | Fact + inference / high | Enforce compressed and decompressed byte caps, global wall-clock/deadline, strict admissions, parser complexity limits, and bounded queues. |
| Content trust | Full HTML/XML is parsed in process and callbacks receive external strings/DOM. | Fact / high | Preserve untrusted-data labeling, parser sandbox/limits where warranted, and output validation. |
| Cookies/session | Storage and clone semantics can share cookies broadly; persistent cookie representation has a smaller contract than a full browser jar. | Fact + inference / medium-high | Partition session state by tenant/job/provider and encrypt or avoid persistence. |
| Cache privacy | URL-only cache key ignores authentication and content negotiation. | Fact + inference / high | Use a policy-aware cache key and prohibit shared caching of private responses. |
| Redirects | URL/domain filters are applied on redirects and Authorization is removed when host changes; default redirect cap follows Go's ten-hop behavior. | Fact / high | Adopt redirect revalidation and credential stripping, but also re-resolve and re-check network destination each hop. |
| Header gate | Body can be aborted after headers; HTTP/1.1 reuse may be lost. | Fact / high | Adopt as a content-type/length gate and explicitly measure connection trade-offs. |
| Observability | Event records include request/collector IDs, URL and status, but no durable attempt model or built-in redaction. | Fact + inference / high | Structured redacted telemetry must avoid query secrets and cardinality abuse. |
| Queue reliability | Worker fetch errors and malformed dequeues can be silently dropped. | Fact / high | Require lease/ack/nack, retry/DLQ, and loss counters. |

The official claim of “>1k request/sec on a single core” is a project claim, not a
result reproduced here. It says little about TLS, real origin latency, parsing,
politeness, storage, or bounded memory and should not drive Curiosity capacity
planning. [S13]

## 9. Curiosity decision ledger

| ID | Observation or proposal | Class | Confidence | Verdict | Rationale / source |
|---|---|---|---|---|---|
| D1 | Ordered request → headers → body → parse → scraped lifecycle | Fact | High | **ADOPT concept** | Clear interception points and finalization. [S1] |
| D2 | Early response-header abort | Fact | High | **ADOPT** | Avoids unwanted bodies, with known HTTP/1.1 reuse cost. [S1] |
| D3 | Callback functions as the primary extension/control mechanism | Fact | High | **ADAPT** | Replace void callbacks with typed, budgeted stage contracts. [S1][S6] |
| D4 | Goroutine-per-accepted-request async model | Fact | High | **REJECT** | Admission must be bounded before spawning work. [S1][S2] |
| D5 | Host-pattern semaphore plus post-response delay | Fact | High | **ADAPT** | Separate concurrency and start-rate controls; define canonical origin key and distributed semantics. [S2] |
| D6 | URL/body 64-bit visited hash and pre-fetch marking | Fact | High | **REJECT as contract** | Lacks atomic claim, success state, method/variant dimensions, and collision handling. [S1] |
| D7 | Pluggable visited/cookie storage | Fact | High | **ADAPT** | Split dedup/frontier/session stores with explicit consistency and retention. [S4][S8] |
| D8 | URL-only serialized disk response cache | Fact | High | **REJECT** | Unsafe for auth/variants/multi-tenancy and truncation-aware correctness. [S2] |
| D9 | Robots ignored by default | Fact | High | **REJECT** | Curiosity should require explicit, fail-closed policy. [S1] |
| D10 | Manual callback-driven retry | Fact | High | **REJECT** | Central retry policy needs budgets, classifications, backoff, and lineage. [S1][S3] |
| D11 | Queue storage abstraction | Fact | High | **ADAPT** | Useful seam, but require leasing, acknowledgements and durable errors. [S5] |
| D12 | Clone sharing backend/cookies/dedup/robots | Fact | High | **ADAPT cautiously** | Share rate/transport intentionally; isolate tenant/session state by default. [S1] |
| D13 | Direct Colly dependency | Recommendation | Medium-high | **DEFER** | Architectural lessons are language-neutral; no established Go adapter need in this frame. |
| D14 | Random User-Agent extension | Fact | High | **REJECT as default** | Identity should be stable, truthful, and consistent with robots policy. [S6] |
| D15 | Redirect filtering and cross-host Authorization removal | Fact | High | **ADOPT + strengthen** | Preserve revalidation; add resolved-address and per-hop policy checks. [S1] |

## 10. License and clean-room transfer

**FACT — High confidence.** Colly is Apache License 2.0. The repository license
grants copyright and patent rights subject to conditions, including supplying the
license on redistribution, marking modified files, and retaining applicable
notices; trademark rights are not granted beyond customary origin description.
No `NOTICE` file was observed at the inspected master commit. [S14]

**RECOMMENDATION — High confidence.** This report transfers only independently
described architecture and observed behavior; it copies no implementation. For
Curiosity:

1. Preserve this source and access-date ledger as design provenance.
2. Express requirements independently (typed lifecycle, bounded admission,
   atomic frontier claim, origin policy) rather than translating Colly functions.
3. If Colly is later linked, vendored, or modified, perform a dependency/license
   review, include Apache-2.0 materials, retain notices, mark modifications, and
   review every transitive dependency separately.
4. Do not imply endorsement or use Colly marks as Curiosity branding.
5. Keep provider-neutral contracts separate from any future Colly adapter.

Apache-2.0 permits reuse; “clean-room” here is a provenance and design-discipline
choice, not a claim that the license requires independent reimplementation. This
section is not legal advice.

## 11. Unknowns, negative results, and checks

### Unknowns

- **UNKNOWN:** Real throughput, memory, and tail latency under Curiosity-like mixed
  content, TLS, parsing, and politeness constraints; no benchmark was run.
- **UNKNOWN:** Behavior and maintenance quality of third-party storage adapters;
  they were listed but not audited.
- **UNKNOWN:** Exact operator expectations around robots fetch failures and stale
  policy in production; source mechanics are clear, deployment practices are not.
- **UNKNOWN:** Whether master-only limiter/callback fixes will ship unchanged after
  v2.3.0.
- **UNKNOWN:** Formal security review history and vulnerability response SLA; not
  established from the bounded official-source pass.
- **UNKNOWN pending focused test:** final synchronous return for an HTML parser
  error when XML handling subsequently succeeds/does nothing.

### Negative results retained

- No automatic retry/backoff/`Retry-After` policy was found.
- No atomic visited “claim if absent” operation was found.
- No durable queue acknowledgement, lease, or dead-letter mechanism was found.
- No global or distributed request/rate limiter was found.
- No built-in IP-range SSRF defense or DNS-rebinding defense was found.
- No robots crawl-delay application, robots TTL, or single-flight fetch was found.
- No strict decompressed-body limit was found.
- No cache variance by authorization, cookies, headers, or `Vary` was found.
- No `NOTICE` file was found at the inspected commit.

### Mechanical checks performed

- Clean clone of official repository; pinned and recorded master commit and tag
  ancestry.
- Confirmed v2.3.0 through both `pkg.go.dev` and the official Go module proxy.
- Ran `go test ./...` at master commit: all package tests passed on 2026-08-17.
- Verified v2.3.0 and v2.2.0 are annotated but **unsigned** Git tags (`git tag -v`
  reported no signature). This is a provenance limitation, not evidence of
  compromise.
- Compared official site guidance with source and registry; retained the stale
  website/import-path discrepancy.
- Worktree check after research: this research created only the designated report;
  pre-existing unrelated workspace changes were left untouched, and the upstream
  clone/build artifacts stayed in the approved temporary directory.

## 12. Bounded curiosity pass

Scoring scale 1–5; priority favors relevance × value × novelty, discounted by
cost. The declared frame authorized only follow-up research, not implementation.

| Thread | Relevance | Value | Novelty | Cost | Action |
|---|---:|---:|---:|---:|---|
| Confirm atomicity of dedup across async/distributed workers | 5 | 5 | 4 | 1 | **Pursued:** interface/source proves check-and-mark are separate; recorded as a high-confidence race implication. |
| Check release identity vs GitHub “latest release” discrepancy | 4 | 4 | 3 | 1 | **Pursued:** Go proxy/pkg.go.dev confirm v2.3.0; tags are unsigned. |
| Inspect robots fetch path for limiter/context/body-bound bypass | 5 | 5 | 4 | 1 | **Pursued:** direct client path confirmed. |
| Benchmark the advertised >1k req/s | 2 | 3 | 2 | 5 | **CURIOSITY_NO_GO:** not representative without a Curiosity workload and exceeds research budget. |
| Audit every community storage adapter | 3 | 3 | 3 | 5 | **CURIOSITY_NO_GO:** third-party scope explosion; core protocol already reveals atomicity limit. |
| Mine all 193 open issues for production incidents | 3 | 3 | 3 | 5 | **CURIOSITY_NO_GO:** low marginal value after source/test triangulation. |
| Fuzz parser and URL normalization | 4 | 4 | 4 | 5 | **CURIOSITY_NO_GO:** valuable future security work, but execution would exceed this bounded documentation task. |

**Stop condition:** coverage achieved for every requested area; three highest-value
gaps were resolved from primary sources; further threads were high-cost and had
diminishing decision value.

## Sources

All accessed 2026-08-17.

- **[S1] Primary source — Collector and lifecycle, pinned master:**
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/colly.go#L55-L142>,
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/colly.go#L490-L511>,
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/colly.go#L636-L818>,
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/colly.go#L847-L1051>,
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/colly.go#L1134-L1387>,
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/colly.go#L1420-L1529>,
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/colly.go#L1680-L1697>
- **[S2] Primary source — limiter, HTTP and cache:**
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/http_backend.go#L37-L155>,
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/http_backend.go#L157-L290>
- **[S3] Primary source — request/response/context:**
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/request.go#L26-L199>,
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/context.go#L21-L99>,
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/response.go#L30-L115>
- **[S4] Primary source — storage contract:**
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/storage/storage.go#L25-L98>
- **[S5] Primary source — queue:**
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/queue/queue.go#L16-L71>,
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/queue/queue.go#L130-L267>
- **[S6] Primary source — extensions:**
  <https://github.com/gocolly/colly/tree/17d1d6ca92bd32a5651f34256bf7a2855c967f65/extensions>
- **[S7] Primary source — debugger contract:**
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/debug/debug.go#L17-L36>
- **[S8] Official docs — storage and distribution:**
  <https://go-colly.org/docs/best_practices/storage/>,
  <https://go-colly.org/docs/best_practices/distributed/>
- **[S9] Official docs — configuration and extensions:**
  <https://go-colly.org/docs/introduction/configuration/>,
  <https://go-colly.org/docs/best_practices/extensions/>
- **[S10] Go package registry — latest version/license:**
  <https://pkg.go.dev/github.com/gocolly/colly/v2@v2.3.0>
- **[S11] Official Go module proxy version list:**
  <https://proxy.golang.org/github.com/gocolly/colly/v2/@v/list>
- **[S12] Official repository metadata and commit:**
  <https://api.github.com/repos/gocolly/colly>,
  <https://api.github.com/repos/gocolly/colly/releases/latest>,
  <https://github.com/gocolly/colly/releases/tag/v2.3.0>,
  <https://github.com/gocolly/colly/commit/17d1d6ca92bd32a5651f34256bf7a2855c967f65>
- **[S13] Official README — feature/throughput claims:**
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/README.md#L36-L48>
- **[S14] Primary source — Apache-2.0 license:**
  <https://github.com/gocolly/colly/blob/17d1d6ca92bd32a5651f34256bf7a2855c967f65/LICENSE.txt>
