# Scrapy architecture lessons for Curiosity

**Research date / source access:** 2026-08-17  
**Product baseline:** Scrapy 2.17.0, released 2026-07-07; immutable tag
`2.17.0` is used for source claims [S1]. The moving `latest` documentation was
also inspected where noted.  
**Status:** clean-room research record, not implementation guidance or an
authorization to adopt Scrapy. No Scrapy code, dependency, fixture, or data was
copied into this repository.  
**Decision framed:** which architecture lessons from Scrapy should Curiosity
adopt, adapt, reject, or defer while building the owned crawl plane described by
ADR 0021?

## Executive verdict

**ADAPT concepts, REJECT as the owned crawler core (high confidence).** Scrapy
is a strong focused-crawl framework and a useful executable architecture study:
its engine separates scheduling, downloading, spider logic, and item handling;
its middleware chains make cross-cutting fetch behavior composable; its
download slots combine per-origin-like concurrency and delay; and its scheduler
exposes explicit duplicate filtering, priority queues, and pause/resume hooks
[S2-S9].

It is not the target architecture for Curiosity's durable, globally scalable,
policy-auditable frontier. The built-in frontier is process-local, its default
duplicate set is fully resident in memory, `JOBDIR` is single-job local-disk
state that requires a clean shutdown, and Scrapy explicitly has no built-in
multi-server crawl facility [S3, S8, S18]. Its robots middleware is useful but
not a complete RFC 9309 policy implementation: it is optional, caches forever
for the process, keys by `netloc` rather than scheme plus authority, and permits
requests after robots download errors; RFC 9309 requires complete disallow while
robots is unreachable [S10-S12]. Security-sensitive defaults favor scraping
reach over hostile-input isolation, including disabled TLS certificate
verification, enabled local-file/data handlers, and an enabled local Telnet
Python shell [S15].

For Curiosity, retain the component boundaries and bounded asynchronous flow,
but make policy decisions, frontier transitions, captures, derivations, and
item commits typed and durable. Use separate dimensions for host fairness,
importance, freshness, retry state, and exploration instead of compressing them
into one mutable integer priority. Treat every response and extracted item as
untrusted evidence, not as code or authority.

## 1. Frame, method, and labels

### 1.1 Bounded sub-questions

1. How do the engine, scheduler, duplicate filter, downloader, middleware,
   spider, and item pipeline exchange work?
2. What ordering and fairness actually result from priority, concurrency,
   retries, redirects, slots, and AutoThrottle?
3. What is persisted, under which crash and trust assumptions?
4. How closely do robots behavior and hostile-input defaults fit an owned
   public-web crawler?
5. Which design ideas transfer clean-room to Curiosity, and which scale,
   security, provenance, or licensing gaps prevent direct adoption?

**Depth budget:** official Scrapy 2.17 documentation, immutable tagged source,
tagged tests where behavior is consequential, the official release/license,
and RFC 9309. No crawler was run; no third-party plugin was evaluated; no
performance benchmark or legal opinion was attempted.

Labels:

- **FACT** — directly supported by an official source.
- **INFERENCE** — architecture conclusion from cited facts, not measured here.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

### 1.2 System model

**FACT (high):** Scrapy's execution engine owns the loop: spider output is
scheduled; scheduled requests pass through downloader middleware and a download
handler; responses pass back through middleware and spider callbacks; callback
requests return to the scheduler while items enter the item pipeline. The loop
ends when the start iterator, scheduler, downloader, and scraper are all idle
[S2, `ExecutionEngine.spider_is_idle` in S7]. The networking model is
non-blocking and event driven [S2].

```text
Spider.start / callback request
  -> engine -> scheduler + dupefilter
  -> engine capacity gate -> downloader middleware (low order to high)
  -> per-download-slot queue -> protocol handler
  -> downloader middleware response/exception path (high order to low)
  -> scraper + spider middleware -> callback/errback
      -> new requests back to scheduler
      -> items through ordered pipeline -> signals / feed export / sink
```

**INFERENCE (high):** this is deliberately an extensible in-process dataflow,
not a durable event log. Components exchange mutable `Request`, `Response`,
metadata, and item objects; middleware may short-circuit with another request or
response. That flexibility is excellent for scraper customization but weakens
stage provenance and makes global invariants depend on configuration and order.

## 2. Scheduler and request duplicate filtering

### 2.1 Admission and queue mechanics

**FACT (high):** the scheduler interface is small: open/close, enqueue,
dequeue, and pending-state checks. The default scheduler checks the duplicate
filter unless `Request.dont_filter` is true, then pushes to a disk priority queue
when configured and serializable, otherwise to memory. A duplicate returns
`False`, fires `request_dropped`, and is not retried by the engine [S3, S4].
Memory wins over disk when both have a request at the same public priority
[S3].

**FACT (high):** the public request priority is an integer where larger values
win. Internally `ScrapyPriorityQueue` negates it and chooses its lowest bucket.
The 2.17 default `DownloaderAwarePriorityQueue` first chooses a download slot
with the fewest active downloads, using deterministic rotating tie selection,
then pops that slot's highest-priority request. Default same-priority ordinary
queues are LIFO; start-request queues are separate FIFO queues and lose to
ordinary requests at equal priority [S3, S5].

**INFERENCE (high):** with the default downloader-aware queue, public priority
is strongest *within the selected slot*, not a strict total order across the
whole frontier. Cross-domain fairness can therefore outrank a globally urgent
request. This is usually desirable for throughput and politeness, but it means
one integer cannot truthfully represent both urgency and fairness.

### 2.2 Fingerprint semantics

**FACT (high):** `RFPDupeFilter` fingerprints canonicalized URL, HTTP method,
and body. Fragments and all headers are ignored by default; selected headers can
be included through a custom fingerprinter. It stores SHA-1 fingerprints in a
Python set; with `JOBDIR`, it also appends one hexadecimal fingerprint per line
and loads the whole file back into the set at startup [S4, S6].

Consequences:

- **FACT (high):** requests that differ only in cookies, authorization,
  content negotiation, or other ignored headers collide by default [S6].
- **FACT (high):** retries deliberately bypass this filter; redirected requests
  normally inherit the original `dont_filter` value [S13, S14].
- **INFERENCE (high):** this is request suppression, not URL identity,
  redirect canonicalization, content deduplication, or document/version
  identity. Curiosity needs all of those as distinct layers.
- **INFERENCE (high):** the in-memory set and line-file reload impose memory and
  startup costs proportional to every seen fingerprint. They are not a
  sharded, atomic, distributed seen-set.
- **INFERENCE (medium):** SHA-1 collision resistance is not an appropriate
  security boundary. Accidental collision risk is small, but an adversarial
  frontier should use a modern digest plus retained comparison material rather
  than treating a short digest as proof of identity.

### 2.3 Priority composition and traversal

**FACT (high):** default ordinary queues produce depth-first-like order.
Breadth-first order requires FIFO queues plus positive `DEPTH_PRIORITY`; the
depth middleware subtracts `depth * DEPTH_PRIORITY`. Redirects add `+2` by
default, while retries add `-1`. Concurrency means the first requests can still
complete out of desired order [S3, S9, S13, S14].

**INFERENCE (high):** additive priority is compact but couples unrelated policy:
depth, redirect continuation, retries, source value, recrawl urgency, and age
can accidentally cancel each other. It also admits starvation because there is
no documented aging guarantee.

**RECOMMENDATION (high):** Curiosity should maintain typed scheduling fields and
an auditable selection policy: policy-ready state, authority/politeness key,
deadline or freshness class, corpus importance, discovery depth, retry class,
first-seen age, and exploration allocation. Fairness should be a separate
selection step, not encoded into document importance.

## 3. Downloader middleware and fetch control

### 3.1 Chain semantics

**FACT (high):** configured middleware is merged with the built-in list.
`process_request` runs from low numeric order toward the downloader;
`process_response` and `process_exception` run in reverse. A middleware can
continue, return a synthetic response, return a replacement request for
rescheduling, or raise/handle an exception. Once a request replacement is
returned, the current chain stops and the replacement traverses the stack on a
later download [S9, S16].

The default 2.17 sequence places Offsite at 50, Robots at 100, HTTP auth at 300,
timeout at 350, default headers at 400, user agent at 500, retry at 550,
meta-refresh at 580, decompression at 590, HTTP redirect at 600, cookies at 700,
proxy at 750, stats at 850, and HTTP cache at 900 [S9]. Thus HTTP responses first
move cache -> stats -> proxy -> cookies -> redirect -> decompression ->
meta-refresh -> retry on their way back to the engine.

**INFERENCE (high):** the bidirectional onion is a valuable extensibility
pattern, but correctness is nonlocal. Moving one component can change whether
another sees compressed bytes, redirects, retries, credentials, or cached
responses. A general middleware's ability to synthesize responses also blurs
capture provenance unless every short circuit records its origin.

**RECOMMENDATION (high):** Curiosity should adapt the hook concept but expose a
fixed typed stage graph. Every disposition should be one of bounded values such
as `continue`, `deny(policy_id)`, `retry(reason,budget)`,
`redirect(edge,budget)`, `captured(capture_id)`, or `fail(class)`. Adapter hooks
must not silently fabricate capture evidence.

### 3.2 Slots, concurrency, delay, and backpressure

**FACT (high):** the downloader enforces a global active-request limit and a
per-slot transfer limit. By default, the slot key is URL hostname; a request may
override it. Each slot has a FIFO downloader queue, concurrency, delay,
randomization, active set, and transferring set. Delay is randomized uniformly
between 0.5x and 1.5x by default and spaces transfer starts; when delay is set,
the queue starts at most one request per delay interval [S17].

**FACT (high):** released-library fallbacks are 16 global requests, 8 per
domain, and zero delay, while a generated Scrapy project sets more conservative
documented defaults of 1 per domain and 1 second delay. The distinction between
framework fallback and project-template default matters when evaluating a bare
embed [S9, S17].

**FACT (high):** the engine stops pulling the scheduler when either downloader
active requests reach the global limit or scraper buffered response size
exceeds `SCRAPER_SLOT_MAX_ACTIVE_SIZE` (5 MB fallback). A response is accounted
after download, at least 1 KiB each; item/output handling is parallelized up to
`CONCURRENT_ITEMS` (100 fallback) per response [S7, S19].

**INFERENCE (high):** Scrapy has useful local backpressure, but it is not an
end-to-end durable admission budget. A single response may be as large as the
separate download limit before scraper backpressure engages, and work already
inside external sinks is not represented in frontier leases.

**RECOMMENDATION (high):** Curiosity should key politeness by normalized scheme
+ authority (and optionally independently reviewed IP/network grouping), give
one owner a lease for each key, and enforce global, tenant, host, byte, parser,
and sink budgets. Backpressure should propagate from durable capture and
derivation queues to frontier admission.

## 4. Robots and politeness

### 4.1 Scrapy behavior

**FACT (high):** robots obedience is optional (`ROBOTSTXT_OBEY` has a released
fallback of `False`). When enabled, the middleware coalesces the first robots
fetch for a `netloc`, stores its parser in a process dictionary, constructs
`scheme://netloc/robots.txt`, and blocks the target request until that fetch
finishes. The parser defaults to Protego; the matching identity is
`ROBOTSTXT_USER_AGENT`, then request `User-Agent`, then the default user agent.
Requests may bypass policy with `dont_obey_robotstxt`; `data:` and `file:` skip
robots entirely [S10, S11].

**FACT (high):** a robots fetch uses `engine.download_async`, which applies
downloader middleware but bypasses the scheduler and dupefilter; the robots
request itself is marked to bypass robots. Redirect and retry middleware still
apply. The declared robots request priority therefore does not order it through
the scheduler [S7, S10].

**FACT (high):** parser results have no expiry during the process. The cache key
is `netloc`, not scheme plus authority. A download exception stores `None`,
which permits crawling; official tests assert allow-all for immediate download
failure, garbage, and empty robots bodies [S10, S20].

### 4.2 RFC 9309 check

RFC 9309 requires or recommends: scheme + authority `/robots.txt`; at least five
redirects; 4xx may allow; 5xx/network unreachable must initially disallow all;
cached content normally no longer than 24 hours; and a parser limit of at least
500 KiB [S12].

| Check | Scrapy 2.17 observation | Verdict |
| --- | --- | --- |
| Matching and parser | Protego is the default and alternate parsers are pluggable [S11]. Exact RFC conformance was not independently tested. | **UNKNOWN** |
| Redirect ceiling | Generic redirect middleware follows up to 20, including cross-authority HTTP(S), then aborts [S14]. | **Compatible in count; semantics not fully tested** |
| 4xx unavailable | Status is eventually parsed as a body; empty body allows all [S10, S20]. | **Often equivalent, not status-explicit** |
| 5xx/network unreachable | After generic retries, an empty response or exception produces allow-all [S10, S13, S20]. | **Conflicts with RFC 9309 unreachable rule** |
| Cache scope | Dictionary key is `netloc`; first scheme's policy can serve later requests with the same netloc [S10]. | **Insufficient identity** |
| Cache freshness | No timestamp, cache-control decision, or 24-hour refresh in middleware state [S10]. | **Gap for long jobs** |
| Decision record | Stats count request, response status, exceptions, and forbidden requests, but no immutable per-fetch policy-decision object [S10]. | **Gap for provenance** |

**INFERENCE (high):** Scrapy robots support is a convenience guard for a spider,
not a legally/auditably complete crawl-policy plane. Robots is also not
authorization; an allow decision does not decide copyright, contract, privacy,
retention, indexing, or display [S12].

**RECOMMENDATION (high):** Curiosity must implement RFC 9309 from the normative
text, retain the fetched robots capture and parser/version, key it by scheme +
normalized authority, record the exact group/rule/disposition, obey unreachable
fail-closed behavior, refresh within policy, and combine robots with corpus,
takedown, rights, and privacy policy. Discovered URLs should wait in a
`POLICY_PENDING` state rather than enter a fetch-ready queue first.

### 4.3 AutoThrottle

**FACT (high):** AutoThrottle is off by default. Per download slot, it targets
delay `latency / target_concurrency`, updates toward that target, never permits
a non-200 response to lower delay, and clamps between configured minimum and
maximum. Target concurrency is advisory; hard per-slot concurrency still wins.
Scrapy measures latency from TCP connection establishment to receipt of HTTP
headers and warns that cooperative scheduling can distort it [S21].

**INFERENCE (high):** this elegantly avoids accelerating when fast error pages
replace slow successful pages, but it conflates crawler event-loop pressure,
network path, and server load. The retry middleware does not parse
`Retry-After`, use exponential backoff, or add explicit retry jitter; a fast 429
cannot lower delay but may not raise it either [S13, S21].

**RECOMMENDATION (high):** adapt feedback control, not this signal alone. Use a
conservative floor, per-authority concurrency, `Retry-After`, 429/503 rates,
timeout and connection failures, observed latency, complaint/suppression state,
and bounded exponential backoff. Keep exploration traffic from consuming the
same budget as urgent policy or recrawl checks.

## 5. Retry and redirect state machines

### 5.1 Retries

**FACT (high):** default retries cover selected network/decompression/data-loss
exceptions and statuses 408, 429, 500, 502, 503, 504, 522, and 524. There are two
retries after the initial attempt. A retry copies the request, increments
`retry_times`, bypasses the duplicate filter, lowers priority by 1, and records
count/reason/max-reached stats. Per-request metadata can disable or change retry
count and priority [S13].

**INFERENCE (high):** lower priority tends to defer failed work, particularly
within the same slot, but the documentation's phrase “rescheduled at the end”
is not a strict global guarantee under the downloader-aware scheduler. There is
no durable attempt ledger, elapsed retry budget, response-header backoff, or
exact distinction between fetch attempts and accepted captures.

### 5.2 Redirects

**FACT (high):** HTTP 301/302/303/307/308 and bounded HTML meta-refresh can
create replacement requests; the combined redirect TTL defaults to 20. The
chain records URLs and reasons in request metadata and raises `IgnoreRequest`
when exhausted. Redirects add 2 priority. Scrapy only follows HTTP(S) targets,
converts applicable POST redirects to GET, and removes body-related headers
[S14].

**FACT (high):** redirect construction strips `Authorization` when scheme,
host, or port changes; strips an explicit `Cookie` header when host changes or
the scheme is not an allowed upgrade; clears proxy authorization on scheme
change; and delegates `Referer` to referrer policy [S14].

**INFERENCE (high):** these are valuable anti-leakage details, but generic
custom sensitive headers remain application responsibility. Redirect DNS and
address policy are not revalidated by a built-in private-network egress gate.
Redirect history in mutable metadata is also not a capture/document lineage
graph.

**RECOMMENDATION (high):** represent every attempt and redirect as immutable
edges. Re-run scheme, DNS, resolved-address, corpus, robots, credential, and
budget policy on every hop. Budgets must cap redirects, retries, bytes,
decompression, wall time, and unique authorities together; retries should be
idempotent and redirect terminal URLs must not erase fetched identity.

## 6. Item pipeline, extraction boundary, and persistence

### 6.1 Item processing

**FACT (high):** each item traverses enabled pipeline components sequentially
in increasing component order. A component returns the item, asynchronously if
desired, or raises `DropItem`; common uses are validation, cleansing, duplicate
item suppression, and storage. Different callback outputs can be processed in
parallel up to the concurrency bound [S19, S22]. Pipeline exceptions are logged
and signaled; the item is not automatically retried [S19].

**INFERENCE (high):** this is a good separation between extraction and sinks,
but it provides neither exactly-once delivery nor deterministic global item
order. A database write followed by process failure can be replayed without a
framework-level commit token. Pipeline-local item dedupe is unrelated to
request dedupe and is usually lost on restart unless the component persists it.

**FACT (high):** feed export supports local, FTP, S3, GCS, and stdout targets;
some remote backends write a temporary local file and upload only at crawl end,
unless item-count batching is enabled [S23]. Feed output is not a WARC capture,
and output commit state is not part of scheduler `JOBDIR` recovery.

**RECOMMENDATION (high):** Curiosity should adapt ordered validation stages but
make them replayable derivations from immutable captures. Every output needs
capture ID, extractor/schema/version, content hash, policy decision, and an
idempotency key. Capture commit, frontier acknowledgement, and derivation enqueue
need an explicit recoverable protocol; item sinks must be able to reject,
quarantine, or retry without silently losing lineage.

### 6.2 Pause and resume

**FACT (high):** `JOBDIR` persists pending scheduler requests, seen request
fingerprints, and a pickled spider-state dictionary for one job. It must not be
shared between spiders or even runs of the same spider. Resume is supported only
after clean shutdown; sudden termination can corrupt state. Requests must be
serializable, and unserializable requests fall back to memory [S3, S8].

**FACT (high):** request queues and spider state use pickle-based
serialization. Official documentation says to protect `JOBDIR` like project
source and never let untrusted parties write it [S8]. Its files are explicitly
implementation details with no compatibility guarantee [S3].

**INFERENCE (high):** `JOBDIR` is a convenient checkpoint, not a transactional
frontier: there are no multi-worker leases, fencing tokens, replicated log,
crash-safe exactly-once semantics, schema migration contract, or coordinated
item-sink checkpoint. Loading a hostile pickle can execute code, so state is a
trusted control artifact, not external data.

**RECOMMENDATION (high):** Curiosity should use versioned, non-executable state
formats; append-only transitions; leases with expiry/fencing; explicit
acknowledgement after durable capture; and independently recoverable seen,
frontier, robots, capture, derivation, and deletion state. Never deserialize
external bytes as runtime objects.

## 7. Hostile input and security posture

### 7.1 Controls worth learning from

**FACT (high):** Scrapy provides bounded download timeout, maximum body size,
pre/post-decompression size enforcement (handler-dependent before
decompression), redirect and retry ceilings, URL-length and depth middleware,
offsite filtering, response data-loss detection, memory monitoring, and
automatic close conditions [S9, S24]. Redirect code contains credential and
proxy-header stripping described above [S14]. The security guide explicitly
treats responses as untrusted and warns against `eval`, `exec`, `pickle.loads`,
and response-derived file paths [S15].

### 7.2 Defaults and missing boundaries

**FACT (high):** the released fallbacks include a 180-second timeout, 1 GiB body
limit, unlimited crawl depth, cookies enabled, robots disabled, TLS certificate
verification disabled, HTTP/FTP/file/data handlers enabled, and Telnet console
enabled on localhost with a generated password [S9, S15]. Scrapy says its
defaults optimize scraping, not hostile-input or shared-environment security
[S15].

**FACT (high):** `file://` can read arbitrary process-accessible local files.
The security guide recommends disabling local/data and unencrypted handlers,
enabling certificate verification, limiting authentication to a domain, and
disabling Telnet when not needed [S15]. Offsite filtering allows all domains
when `allowed_domains` is empty and may be bypassed per request [S9].

**NEGATIVE RESULT (high):** no built-in setting or stage was found in the
2.17 defaults, downloader, redirect code, or security guide that rejects
loopback, link-local, RFC 1918, Unix sockets, cloud metadata addresses, or DNS
rebinding after resolution. The guide tells applications to validate schemes
and hosts to avoid SSRF; that is not equivalent to an address-aware egress gate
[S9, S14, S15, S17].

**INFERENCE (high):** default Scrapy is unsafe as a direct executor of URLs
discovered from arbitrary public pages inside a privileged network. A malicious
response can propose internal HTTP URLs even if `file:` is disabled. In-process
HTML/XML/native parsers and arbitrary project middleware also share the
crawler's credentials, filesystem, and network namespace.

**RECOMMENDATION (high):** Curiosity's static fetch workers must be disposable,
unprivileged, and isolated from project, control-plane, and cloud metadata
networks. Resolve and validate every address before connection and after every
redirect; pin the approved resolution for that attempt; disable ambient proxy,
cookie, credential, local-file, FTP, and active-content behavior. Apply small
per-response and aggregate byte limits, decompression-ratio limits, MIME sniffing,
parser CPU/memory deadlines, malware/safety signals, Unicode normalization, and
quarantine. Search and page text remain `untrusted-external-evidence` and cannot
request tools, secrets, or policy changes.

## 8. Scale and operational gaps

**FACT (high):** Scrapy describes broad-crawl tuning—raise concurrency, increase
DNS thread-pool capacity, lower timeout/log volume, disable cookies/retries or
redirects where appropriate, and use breadth-first order to reduce memory. It
warns that concurrency raises memory and that blocking DNS can bottleneck [S25].

**FACT (high):** Scrapy explicitly provides no built-in distributed
multi-server crawl. Its suggested approaches are distributing independent
spider runs or externally partitioning URLs among spiders [S18]. The built-in
scheduler and seen set do not coordinate those partitions.

Material gaps for Curiosity:

| Gap | Evidence / inference | Curiosity requirement |
| --- | --- | --- |
| Distributed frontier | No built-in multi-server facility; local scheduler/seen set [S3, S18]. | Sharded ownership, leases, rebalance, replication, global dedupe. |
| Durable crash recovery | Clean shutdown required; implementation-detail local files [S8]. | Recovery from kill/power loss with invariant checks and replay. |
| Robots/policy audit | Process cache and counters, not versioned decisions [S10]. | Immutable decision IDs and policy-change propagation. |
| Recrawl/freshness | No built-in change-hazard model or durable recrawl calendar found. | first/last seen, validators, change rate, importance, freshness SLO. |
| Capture provenance | Response/item flow; HTTP cache/feed output are not immutable WARC lineage. | attempt/request/response capture, hashes, timestamps, WARC IDs. |
| Trap and budget defense | Depth/URL/close limits exist but default mostly unbounded; no global URL-pattern/trap model. | per-host path/query cardinality, calendar/session traps, tenant cost ceilings. |
| Multi-stage processing | In-process callbacks and pipelines. | independently scalable capture, parse, canonicalize, dedupe, index queues. |
| Deletion/takedown | No integrated serving-index deletion plane found. | globally propagated tombstone and auditable restricted retention. |
| Observability | Rich counters/signals, but process/job centered [S24]. | cross-service trace from discovery through citation and policy. |

**INFERENCE (high):** Scrapy can be an effective leaf fetcher or benchmark for a
bounded corpus, but surrounding it with a distributed frontier and capture
plane would leave critical semantics split between framework internals and the
owned system. Under ADR 0021's strict owned-core direction, learning from it is
cleaner than making it the execution substrate.

## 9. Clean-room and license boundary

**FACT (high):** Scrapy is BSD 3-Clause licensed. Source/binary redistribution
is allowed with copyright, conditions, and disclaimer retention; the Scrapy and
contributor names may not endorse derived products without permission [S26].
Dependencies and optional parsers have their own licenses and require a
separate ledger.

Verdicts:

- **REJECTED — owned production core (high confidence):** ADR 0021 requires a
  new explicit ownership/license decision before adopting a third-party crawler.
  Permissive license does not make Scrapy project-owned code.
- **ADOPTED — published architectural concepts (high confidence):** event-driven
  engine, scheduler interface, per-host slots, reverse response middleware,
  bounded retries/redirects, backpressure, and ordered item validation may be
  independently specified.
- **ADAPTED — black-box benchmark/oracle (medium confidence):** only on
  project-authored or otherwise authorized fixtures, with exact version and
  configuration recorded, and only after dependency/license approval.
- **DEFERRED — dependency exception (high confidence):** if ownership policy is
  relaxed, review Scrapy plus transitive licenses, security hardening,
  maintenance, notices, and whether network service separation is sufficient.

**Clean-room control:** this report intentionally describes behavior and
failures without reproducing implementation code. Researchers have inspected
tagged source. Any future implementer should work from an approved neutral
functional specification, RFC 9309, independent data structures, and
project-authored fixtures; do not translate Scrapy functions, tests, comments,
or defaults mechanically. Preserve this source-access record and seek legal
review for strict clean-room staffing or patent questions.

## 10. Curiosity decision ledger

| Scrapy lesson | Verdict | Confidence | Reason |
| --- | --- | --- | --- |
| Engine/component separation | **ADOPTED** | High | Keeps frontier, fetch, extraction, and sinks independently testable. |
| Arbitrary in-process middleware onion | **ADAPTED** | High | Fixed typed stage graph and provenance replace unrestricted short circuits. |
| Request fingerprint dedupe | **ADAPTED** | High | One layer only; retain request, URL, content, and document/version identities separately. |
| Downloader-aware fairness | **ADAPTED** | High | Separate host fairness from urgency/importance and make starvation measurable. |
| One integer additive priority | **REJECTED** | High | Conflates depth, retry, redirect, freshness, value, and age. |
| Download slots and local backpressure | **ADAPTED** | High | Use scheme+authority ownership plus global/tenant/byte/sink budgets. |
| AutoThrottle latency feedback | **ADAPTED** | High | Combine with hard floors, status/error signals, Retry-After, and exponential backoff. |
| Built-in robots middleware as policy plane | **REJECTED** | High | Optional, allow-on-error, wrong cache scope/freshness, no immutable decision. |
| Bounded retry/redirect metadata | **ADAPTED** | High | Durable attempt/edge ledger and combined budgets required. |
| Ordered item pipeline | **ADAPTED** | High | Versioned replayable derivations and idempotent commits required. |
| `JOBDIR` persistence | **REJECTED** | High | Trusted pickle, clean-shutdown, single-job local state, unstable format. |
| Scrapy as owned crawler core | **REJECTED** | High | Third-party BSD code plus distributed, policy, provenance, and security gaps. |
| Scrapy as authorized benchmark | **DEFERRED** | Medium | Useful only with exact config, fixtures, license ledger, and no code transfer. |

## 11. Unknowns and checks before any future decision

1. **UNKNOWN:** exact RFC 9309 conformance and resource bounds of Protego 0.x as
   shipped with the selected Scrapy environment. **Check:** standards-derived,
   independently authored corpus across matching, encoding, redirects, status,
   and parser-size cases.
2. **UNKNOWN:** crash outcomes at every queue/file write boundary. **Check:**
   kill/power-failure matrix on disposable authorized fixtures; never rely on
   undocumented `JOBDIR` layout as a contract.
3. **UNKNOWN:** throughput and memory of the default set/queues at Curiosity's
   measured pilot frontier sizes. **Check:** reproducible benchmark with fixed
   URL distribution, priorities, response sizes, and sink latency.
4. **UNKNOWN:** behavior differences among Scrapy's HTTP/1.1, HTTP/2, and httpx
   handlers for size limits, TLS, proxying, cancellation, and DNS policy.
   **Check:** exact-handler conformance suite if benchmark use is approved.
5. **UNKNOWN:** transitive license/security posture of a concrete dependency
   lock. **Check:** SBOM, exact-version notices, vulnerability review, and legal
   approval; the Scrapy license alone is insufficient.
6. **UNKNOWN:** whether “wholly owned” will ever permit a third-party crawler as
   an isolated service. **Check:** caller/architecture/legal decision; this
   research does not authorize it.

## 12. Bounded curiosity pass

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Rel. | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Compare robots failure/cache behavior to RFC 9309 | 5 | 5 | 5 | 1 | **Pursued:** found allow-on-error, no expiry, and netloc-only scope; changes adoption verdict [S10-S12, S20]. |
| Verify hostile defaults against new official security guide | 5 | 5 | 4 | 1 | **Pursued:** confirmed reach-oriented TLS/local-resource/Telnet posture and missing built-in SSRF gate [S15]. |
| Trace actual priority vs downloader fairness | 5 | 4 | 4 | 2 | **Pursued:** default selects least-active slot before that slot's priority queue [S5]. |
| Run live crawl and throughput benchmark | 3 | 3 | 2 | 5 | `CURIOSITY_NO_GO`: no authorized target/corpus or workload; would not resolve architecture ownership. |
| Audit every optional parser/plugin | 2 | 3 | 2 | 5 | `CURIOSITY_NO_GO`: unbounded ecosystem and no approved dependency set. |
| Exploit-test parsers or public sites | 1 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: outside clean-room research authority and unnecessary. |
| Compare every historical Scrapy version | 1 | 2 | 1 | 4 | `CURIOSITY_NO_GO`: immutable current release answers the framed decision. |
| Seek legal opinion on BSD/clean-room | 4 | 5 | 3 | 5 | `CURIOSITY_NO_GO`: counsel authority absent; explicitly deferred. |

**Coverage stop:** every caller-requested category—scheduler/dupefilter,
middleware, priority/concurrency, robots, AutoThrottle, retry/redirect, item
pipeline, persistence, hostile input/security, scale, license/clean-room, and
Curiosity implications—has source-backed findings and a verdict.

**Saturation stop:** source inspection began repeating the same in-process,
local-state, configurable-hook model. Further plugin breadth would not change
the owned-core decision. Research stops on coverage and saturation.

## 13. Sources

All sources accessed 2026-08-17. Scrapy source links are pinned to release tag
`2.17.0` unless explicitly marked documentation.

1. **[S1] Scrapy 2.17.0 official GitHub release.**
   https://github.com/scrapy/scrapy/releases/tag/2.17.0 — version/date baseline.
2. **[S2] Scrapy architecture overview.**
   https://docs.scrapy.org/en/2.17/topics/architecture.html — component flow and
   event-driven model.
3. **[S3] Scheduler documentation and source.**
   https://docs.scrapy.org/en/2.17/topics/scheduler.html and
   https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/core/scheduler.py —
   interface, queues, ordering, disk fallback, persistence.
4. **[S4] Duplicate-filter source.**
   https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/dupefilters.py — in-memory
   set, append file, admission behavior.
5. **[S5] Priority-queue source.**
   https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/pqueues.py — negated
   priority buckets and downloader-aware slot selection.
6. **[S6] Request fingerprint source.**
   https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/utils/request.py — URL,
   method, body, headers/fragments, digest semantics.
7. **[S7] Execution-engine source.**
   https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/core/engine.py — capacity,
   scheduling, direct downloads, idle/close behavior.
8. **[S8] Jobs / pause-resume documentation.**
   https://docs.scrapy.org/en/2.17/topics/jobs.html — single job directory,
   clean shutdown, pickle, trust warning.
9. **[S9] Settings reference and released defaults.**
   https://docs.scrapy.org/en/2.17/topics/settings.html and
   https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/settings/default_settings.py
   — middleware order, limits, security and project/fallback defaults.
10. **[S10] Robots middleware source.**
    https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/downloadermiddlewares/robotstxt.py
    — cache key, fetch, bypass, error and decision behavior.
11. **[S11] Robots parser source.**
    https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/robotstxt.py — parser
    abstraction and Protego default implementation.
12. **[S12] IETF RFC 9309, Robots Exclusion Protocol.**
    https://datatracker.ietf.org/doc/html/rfc9309 — normative matching, access
    status, redirects, caching, limits, and non-authorization boundary.
13. **[S13] Retry middleware source.**
    https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/downloadermiddlewares/retry.py
    — attempt count, exceptions/statuses, duplicate bypass, priority and stats.
14. **[S14] Redirect middleware source.**
    https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/downloadermiddlewares/redirect.py
    — redirect TTL, methods, schemes, history, credentials, priorities.
15. **[S15] Scrapy security guide.**
    https://docs.scrapy.org/en/2.17/topics/security.html — untrusted responses,
    TLS, schemes/local files, Telnet, credentials and SSRF guidance.
16. **[S16] Downloader middleware guide and manager source.**
    https://docs.scrapy.org/en/2.17/topics/downloader-middleware.html and
    https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/core/downloader/middleware.py
    — chain order, short-circuit and exception semantics.
17. **[S17] Downloader/slot source.**
    https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/core/downloader/__init__.py
    — slot key, delay, concurrency, queues and local backpressure.
18. **[S18] Common practices: distributed crawls.**
    https://docs.scrapy.org/en/2.17/topics/practices.html#distributed-crawls — no
    built-in multi-server crawl facility.
19. **[S19] Scraper and item-pipeline manager source.**
    https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/core/scraper.py and
    https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/pipelines/__init__.py —
    response-size backpressure, item concurrency, sequential chain, errors.
20. **[S20] Official robots middleware tests.**
    https://github.com/scrapy/scrapy/blob/2.17.0/tests/test_downloadermiddleware_robotstxt.py
    — asserted allow-all error, garbage, and empty-body outcomes.
21. **[S21] AutoThrottle documentation and source.**
    https://docs.scrapy.org/en/2.17/topics/autothrottle.html and
    https://github.com/scrapy/scrapy/blob/2.17.0/scrapy/extensions/throttle.py —
    goals, latency signal, algorithm, bounds and caveat.
22. **[S22] Item pipeline guide.**
    https://docs.scrapy.org/en/2.17/topics/item-pipeline.html — ordering,
    validation/drop/storage roles and lifecycle.
23. **[S23] Feed exports.**
    https://docs.scrapy.org/en/2.17/topics/feed-exports.html — formats, storage,
    delayed delivery and batching.
24. **[S24] Extensions reference.**
    https://docs.scrapy.org/en/2.17/topics/extensions.html — statistics, memory
    control, close conditions, Telnet and spider state.
25. **[S25] Broad crawl guidance.**
    https://docs.scrapy.org/en/2.17/topics/broad-crawls.html — concurrency, DNS,
    timeout, retries, redirects, memory and traversal trade-offs.
26. **[S26] Scrapy BSD 3-Clause license.**
    https://github.com/scrapy/scrapy/blob/2.17.0/LICENSE — redistribution,
    notice, disclaimer, and non-endorsement terms.

### Retained negative results

- No built-in distributed shared frontier or atomic distributed seen-set was
  documented; official guidance externalizes partitioning [S18].
- No built-in private/link-local/cloud-metadata address deny or DNS-rebinding
  policy was found; official security guidance delegates URL validation to the
  application [S15].
- No durable per-fetch robots decision record, cache expiry, or RFC 9309
  fail-closed unreachable behavior was found [S10, S20].
- No framework-level exactly-once item commit or coordinated scheduler/sink
  checkpoint was found [S8, S19, S23].
- No claim is made that Scrapy is slow or unsuitable for every broad crawl;
  official guidance says it can run fast broad crawls after tuning [S25]. The
  rejection is about Curiosity's ownership, distributed durability, policy,
  provenance, and hostile-input requirements, not an unmeasured speed verdict.
