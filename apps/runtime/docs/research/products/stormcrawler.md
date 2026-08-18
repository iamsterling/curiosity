# Apache StormCrawler: clean-room architecture dossier

**Access date:** 2026-08-17  
**Research baseline:** Apache StormCrawler `main` at commit
`358d761e502fbf27a2e22efd8cc9d3a081cd54cd` (`4.0.0-SNAPSHOT`); latest release
tag observed was `stormcrawler-3.7.0`.  
**Scope:** stream topology, URL frontier/status persistence, fetch/parse/index
bolts, partitioning and politeness, retries/backpressure, deduplication,
metrics, recovery/scaling, licensing, and transferable lessons for Curiosity.  
**Status:** research and recommendations only—not implementation, legal advice,
or a production validation.

## Executive verdict

StormCrawler is a modular crawling SDK, not a turnkey search engine. It maps a
recursive crawl onto an Apache Storm tuple graph: a spout leases due URLs from a
frontier, a partitioner derives a host/domain/IP key, a multithreaded fetcher
enforces local per-key pacing, type-specific parsers emit content and discovered
URLs, an indexer persists searchable documents, and a status updater closes the
loop by writing URL state plus the next-fetch time. The durable status/frontier
backend and the content index are deliberately separate roles even when one
product, such as OpenSearch, implements both [S2] [S3] [S6].

**Decision for Curiosity — ADAPT, not adopt wholesale (high confidence).**
Adopt the separation of crawl control from content processing, explicit status
feedback, key-partitioned politeness, bounded frontier hand-outs, independently
scalable stages, idempotent URL identity, and metrics for queues/in-flight work.
Adapt these patterns to Curiosity's provider-neutral contracts and bounded job
model. Reject a direct dependency on Storm, unbounded defaults, implicit
at-least-once side effects, and using a search index as the canonical frontier.
Defer StormCrawler itself as an adapter/reference implementation unless a JVM
streaming crawler is actually required. Apache-2.0 permits reuse, but a clean
Curiosity implementation should continue to derive behavior from documented
contracts, not copy source, and must preserve license/NOTICE obligations if any
code is incorporated [S1] [S17].

## 1. Decision frame and method

### 1.1 Bounded questions

1. What is the default stream graph and where does crawl state loop back?
2. Which responsibilities belong to the frontier, status backend, fetcher,
   parser, and indexer?
3. How are URLs partitioned and how is politeness enforced locally and globally?
4. What do Storm acknowledgements, crawler retries, and component-level
   throttles actually guarantee?
5. Where does deduplication occur, and what duplicate classes remain?
6. What state survives task/process/node failure and how is capacity scaled?
7. Which patterns transfer safely into Curiosity?

**Evidence policy.** First-party Apache StormCrawler documentation,
configuration, archetype, and source were examined at the pinned commit. Apache
Storm documentation was used for runtime semantics. The legacy
`stormcrawler.net` FAQ was retained only where it explains historical design and
is clearly marked [S18]. No binaries were decompiled, no private endpoint was
probed, and no source or configuration was copied into Curiosity. Source was
read to verify behavior and is cited by path/line anchor; this dossier restates
behavior independently.

Labels used below:

- **FACT** — directly supported by cited first-party material.
- **INFERENCE** — a bounded architectural conclusion, not an upstream promise.
- **RECOMMENDATION** — a Curiosity decision.
- Confidence is **high**, **medium**, or **low**.

### 1.2 Product boundary

**FACT (high):** StormCrawler describes itself as an open-source collection of
resources for low-latency, scalable web crawlers on Apache Storm. It supplies
core and external components, but users compose their own topology and choose
storage/indexing modules [S1] [S2]. It does not provide ranking, query serving,
snippet generation, or an end-user search API.

## 2. Stream topology and control loop

### 2.1 Reference topology

The current archetype assembles this logical graph [S4]:

```text
URL frontier -> spout -> URL partitioner -> fetcher
                                         | default/content stream
                                         v
                         sitemap -> feed -> JSoup -> Tika routing/Tika -> indexer
                              \        \       \             \          \
                               +--------+-------+--------------+----------+
                                                status stream
                                                     |
                                                     v
                                           frontier/status updater
                                                     |
                                             due URLs re-emitted
```

- **FACT (high):** The spout-to-partitioner edge is shuffle-grouped. The
  partitioner-to-fetcher edge is fields-grouped on `key`, so identical keys go
  to the same fetcher task. Main content edges use local-or-shuffle grouping.
  Each producer's status edge is fields-grouped by URL into the status updater
  [S4].
- **FACT (high):** StormCrawler uses a default stream for the URL/content being
  processed and a separate `status` stream carrying URL, metadata, and status.
  Parsers use the latter for outlinks/errors; fetchers use it for redirects,
  restrictions, and failures; indexers use it to report final success/error
  [S3].
- **INFERENCE (high):** The graph has two planes: a high-volume content plane and
  a smaller crawl-control plane. The status updater is the join point where
  processing outcomes become future scheduling decisions.

The archetype defaults every component to parallelism one and one worker; those
are runnable starter values, not capacity recommendations. It also sets a
300-second tuple timeout, `topology.max.spout.pending=100`, 50 fetch threads,
and a 65,536-byte response-body cap [S4] [S5]. Core library defaults differ in
places (for example, ten fetch threads and unlimited response size), so effective
behavior depends on the merged configuration [S5] [S10].

### 2.2 Status state machine

**FACT (high):** The status enum is intentionally small [S3]:

| Status | Producer / meaning | Typical scheduling consequence |
| --- | --- | --- |
| `DISCOVERED` | Seeds or parser/fetcher outlinks; may already be known | Due now unless backend preserves an existing record |
| `REDIRECTION` | Fetcher observed a redirect | Parent revisited on normal interval; target is separately discovered in safe redirect mode |
| `FETCH_ERROR` | Potentially transient fetch failure | Retry after the fetch-error interval |
| `ERROR` | Terminal fetch, parse, or index failure | Usually never retry under archetype config; emits deletion signal |
| `FETCHED` | Full successful pipeline, normally emitted by an indexer | Revisit at normal/adaptive interval |

**FACT (high):** `AbstractStatusUpdaterBolt` adds discovery/processing dates,
increments a successive-fetch-error counter, promotes the third fetch error to
`ERROR` by default, clears stale error metadata after success/redirect, invokes
a scheduler, filters metadata, persists the result, and only then acknowledges
the tuple [S6]. The default effective archetype intervals are 1,440 minutes for
successful/redirected pages, 120 minutes for fetch errors, and no revisit for
terminal errors [S5] [S10]. Metadata-specific intervals and an adaptive scheduler
are available; the latter shortens or lengthens recrawl based on signature
change and can support conditional requests when validators are persisted [S3].

**INFERENCE (high):** Status persistence is the crawl ledger. Searchable content
is a derived projection. Treating the content index as the only ledger would
lose attempts, terminal states, scheduling, and URLs that never produced an
indexable document.

## 3. Frontier and status storage

### 3.1 Pluggable frontier contract

**FACT (high):** Storage-backed spouts extend `AbstractQueryingSpout`. The base
class throttles backend queries, buffers returned URLs, tracks URLs in process,
temporarily retains acked/failed IDs in a purgatory cache, emits the URL as the
Storm message ID, and removes it from in-process tracking on `ack` or `fail`
[S7]. Implementations exist for URLFrontier, OpenSearch, Solr, and SQL; file and
memory spouts serve bounded/local cases [S3].

The backend-facing abstraction is roughly:

1. select URLs whose next-fetch time is due;
2. diversify/bucket them by a partition key;
3. lease or suppress them while work is outstanding;
4. accept idempotent discovered/known URL updates;
5. record next-fetch time and persisted metadata.

This is a behavior summary, not an extracted interface.

### 3.2 URLFrontier module

- **FACT (high):** The current default archetype uses crawler-commons
  URLFrontier over gRPC. A request asks for bounded queue count, URLs per queue,
  crawl ID, and a `delayRequestable` lease duration; the latter defaults from
  Storm's message timeout unless overridden [S8].
- **FACT (high):** The status updater streams discovered or known URL items to
  URLFrontier. Known items include the next refetch epoch. It derives the same
  partition key and waits for frontier acknowledgement before acking Storm
  tuples [S9].
- **FACT (high):** Its updater bounds messages in flight with a semaphore
  (100,000 by code default), groups concurrent `DISCOVERED` writes for the same
  URL, throttles while permits are exhausted, and fails tuples if its wait-for-
  acknowledgement cache expires [S9]. This is explicit component backpressure,
  not merely Storm queue pressure.
- **FACT (high):** Multiple URLFrontier addresses require one spout task per
  node. The status updater permits a multiple of updater tasks per node. Strict
  frontier-side crawl-delay pacing currently requires one frontier endpoint and
  preferably one spout task because keyed delay changes do not propagate across
  frontier nodes and concurrent `getURLs` calls have a documented non-atomic
  politeness gap [S12].

### 3.3 OpenSearch/Solr/SQL alternatives

**FACT (high):** OpenSearch can play three independent roles: URL status store,
content index, and metrics sink [S13]. Its aggregation spout queries due records,
groups them by a partition field, takes a bounded number of top hits per bucket,
and filters URLs already in the local in-process map/buffer [S14]. Status records
use the SHA-256 URL digest as ID; `DISCOVERED` uses create-only indexing so an
existing URL record is not overwritten, while later known-state updates replace
it [S15]. Solr and SQL provide analogous modules, but their query, locking, and
conflict semantics are backend-specific [S2].

**INFERENCE (high):** A search engine can approximate a frontier through
due-date queries and aggregations, but this couples scheduling correctness and
cost to index refresh, routing, consistency, and query behavior. URLFrontier is
the cleaner control-plane boundary; a transactional database is the safer
Curiosity baseline if frontier scale does not justify a separate service.

## 4. Fetch, parse, and index bolts

### 4.1 Fetch

**FACT (high):** `FetcherBolt` is asynchronous with respect to Storm's
`execute`: it enqueues the tuple into an internal host/domain/IP queue, worker
threads fetch later, downstream emissions remain anchored to the original tuple,
and the tuple is acked after processing. `SimpleFetcherBolt` instead fetches in
`execute` and depends on topology-level partitioning and parallel instances
[S3]. Process latency—not execute latency—is therefore the meaningful Storm UI
metric for `FetcherBolt` [S3].

The fetcher output branches are:

- success: URL, bytes, and metadata on the default stream;
- redirect, robots restriction, HTTP/fetch error, malformed URL, or exception:
  status tuple with typed status and error metadata;
- optional discovered sitemap and redirect target: status stream.

**FACT (high):** Protocol implementations are pluggable. OkHttp is the current
default; Playwright is available for browser rendering. The fetcher enforces a
body-size limit when configured, protocol timeouts, robots policy, redirect
policy, and optional destination-IP filtering [S2] [S10]. Immediate HTTP-client
redirect following bypasses StormCrawler's target URL filtering, deduplication,
and robots check, whereas the default status-stream redirect path applies those
controls [S3].

### 4.2 Parse and route

- **FACT (high):** `SiteMapParserBolt` and `FeedParserBolt` are conditional
  filters: they parse marked content and emit discovered entries on status, but
  pass unrelated content onward [S3].
- **FACT (high):** `JSoupParserBolt` handles HTML and plain text, detects
  charset/MIME type, extracts text/metadata/outlinks, and applies ordered URL and
  parse filters. Binary/non-HTML documents can be routed to the Tika parser
  module [S2] [S3].
- **FACT (high):** Outlink emission is configurable and can be capped per page;
  URL filters/normalizers, same-domain rules, max depth, path repetition, and
  parser filters bound crawl expansion [S2].
- **INFERENCE (high):** Parsers are both extraction stages and frontier
  producers. This is why outlink count, normalization, metadata inheritance, and
  filter order are correctness and cost controls rather than presentation
  details.

### 4.3 Index

**FACT (high):** Backend indexers extend `AbstractIndexerBolt`, which centralizes
metadata-to-field mapping, text trimming, metadata filters, `noindex`, canonical
URL handling, and optional metadata-derived document identity [S16]. A real or
dummy indexer emits final status so the URL is marked `FETCHED` only after the
pipeline's terminal side effect succeeds [S3].

**INFERENCE (high):** Index completion is the commit point from the crawler's
perspective, but not a distributed transaction across content storage and
frontier state. A crash between indexing and status persistence can replay the
document. Index writes therefore need deterministic IDs/upserts and must tolerate
at-least-once execution.

## 5. Partitioning and politeness

### 5.1 Two aligned partitioners

**FACT (high):** `URLPartitionerBolt` derives a key by host, paid-level domain,
or IP (`partition.url.mode`) and fields-grouping routes that key to one fetcher
task [S2] [S3] [S4]. Inside `FetcherBolt`, `fetcher.queue.mode` independently
chooses host/domain/IP queues. Each queue has a default one thread, a default
one-second delay, optional per-key thread overrides, and a separate minimum
delay when concurrent threads share a queue [S2] [S10].

**RECOMMENDATION (high):** Curiosity should expose one normative origin-key
function used by frontier, worker routing, rate-limit state, and telemetry.
StormCrawler's separate partition and fetch-queue settings are flexible but can
be misaligned; validate them at startup rather than permit silent divergence.

### 5.2 Robots and adaptive host pressure

- **FACT (high):** StormCrawler parses robots rules by configured crawler agent,
  caches rules/errors, supports `Crawl-delay`, and honors page/header robots
  directives unless operators explicitly disable them [S2] [S10].
- **FACT (high):** A robots delay above the local maximum is normally an error.
  With force mode it is locally capped and emitted as metadata; the optional
  URLFrontier queue regulator can apply the longer host delay centrally. Safe
  operation requires host partitioning, one URL per hand-out, a persist-only
  delay signal, and a single frontier endpoint [S2] [S12].
- **FACT (high):** The regulator can also block host queues for 429/503 pressure,
  respect bounded `Retry-After`, and use exponential backoff with cap, decay,
  and jitter [S2].
- **INFERENCE (high):** Local fetcher pacing protects each worker; frontier
  pacing protects the aggregate crawler. Distributed politeness is violated if
  several independent workers/frontiers believe they own the same origin budget.

**RECOMMENDATION (high):** Curiosity should make the origin lease/rate-limit
decision atomic in one authority, retain server and robots signals with expiry,
and fail closed when the global politeness authority is unavailable. One-item
leases are safer for strict pacing; larger batches trade precision for throughput.

## 6. Retries, backpressure, and delivery semantics

### 6.1 Three different retry loops

1. **Transport retry.** OkHttp can retry connection failures [S2]. This occurs
   inside one fetch attempt and may still duplicate non-idempotent HTTP methods.
2. **Storm replay.** Anchored tuple trees are at-least-once. If any tuple fails
   or the tree misses its timeout, Storm calls the originating spout's `fail`;
   worker/acker failures lead to timeout and replay [S19].
3. **Crawl rescheduling.** `FETCH_ERROR` receives a future next-fetch time and is
   promoted to terminal `ERROR` after a configured consecutive count [S6].

**FACT (high):** These mechanisms are not interchangeable. A Storm replay is
recovery of unfinished work; a scheduled refetch is domain policy; an HTTP
retry is one protocol client's decision.

### 6.2 Backpressure layers

| Layer | Mechanism | Important limit |
| --- | --- | --- |
| Storm ingress | `topology.max.spout.pending`, tuple timeout, worker receive/send queues | Runtime-level; effective only when the topology anchors and ack/fails correctly [S4] [S19] |
| Querying spout | URL buffer, minimum query interval, in-process map, purgatory TTL | Suppresses local re-emission; not a durable distributed lease [S7] |
| Fetcher | Bounded per-queue capacity and optional maximum URLs across active+queued work | Core defaults are unlimited; when aggregate cap is set, `execute` sleeps until capacity opens [S10] [S11] |
| Status updater | Bulk/client buffers, wait-ack cache; URLFrontier semaphore | Delays/fails upstream tuples when durable status writes lag [S9] [S15] |
| Frontier | bounded queues and URLs per bucket; requestable lease | Correctness depends on backend lock/lease semantics [S8] |

**FACT (high):** If a fetch queue is full, the fetcher fails the input tuple, so
Storm can replay it. Fetcher worker threads ack only after downstream emissions;
the reference config's tuple timeout must therefore exceed queue wait, network,
parse, index, and status-write time [S11] [S19].

**INFERENCE (high):** StormCrawler provides backpressure primitives, but safe
bounds are operator-selected. Several library defaults are `-1`/unbounded.
Curiosity cannot claim bounded behavior merely by adopting the topology pattern.

## 7. Deduplication and identity

StormCrawler has several distinct duplicate controls, not one global deduper:

| Duplicate class | Mechanism | Residual risk |
| --- | --- | --- |
| Same normalized URL discovered repeatedly | Durable unique URL/document ID; create-only `DISCOVERED`; status-updater cache and in-flight coalescing | Normalization policy differences create distinct IDs; caches are optimizations only [S6] [S9] [S15] |
| Same URL selected while active | Spout in-process map, buffer uniqueness, purgatory TTL, frontier lease | Multiple spout tasks/topologies require backend atomicity [S7] [S14] |
| Redirect target | Default status path normalizes/filters and durable URL identity dedups | Immediate-follow mode bypasses these checks [S3] |
| Canonical-equivalent URLs | Same-domain canonical URL may replace indexed URL | Frontier still tracks source URLs independently [S16] |
| Byte/text-equivalent content at different URLs | Optional parse signature plus metadata-derived index document ID | Backend support varies; shared-document deletion can remove content still live at another URL [S2] [S16] |
| Near duplicates / mirrors / syndication | No general clustering mechanism established | Requires a separate similarity and cluster policy |

**FACT (high):** The updater's discovered-URL cache avoids redundant writes but
is not authoritative; persistent unique identity is what makes recursive crawl
dedup durable [S3] [S6] [S15]. The older official FAQ explicitly contrasted
unique-key storage for recursive crawls with plain queues, which would enqueue
the same URL whenever rediscovered [S18].

**RECOMMENDATION (high):** Curiosity should keep `crawl_url_id`, normalized URL,
resolved canonical cluster, capture/content hash, and near-duplicate cluster as
different fields. Do not collapse crawl scheduling identity into content
identity; shared content IDs complicate deletion, provenance, and recrawl.

## 8. Metrics, recovery, and scale

### 8.1 Metrics

**FACT (high):** `CrawlerMetrics` can register Storm V1 metrics, V2
Dropwizard/Codahale metrics, or both. It supports scoped counters, gauges,
histograms/means, rates, and timing collections [S20]. Notable built-in signals
include:

- fetcher active threads, queued URLs, number of queues, event counters,
  per-document latency, per-second bytes/pages, and time in queues [S11];
- spout buffer size, queue count, being processed, purgatory, query latency,
  emitted/acked/failed, and empty-buffer duration [S7];
- status-updater cache hits/misses/size, in-flight throttling, wait-ack size,
  bulk latency/throughput, ack/fail/purge [S6] [S9] [S15];
- Storm's own execute/process latency, capacity, failed/acked counts, worker and
  acker health [S19].

OpenSearch and Solr metrics consumers can persist Storm metrics; OpenSearch also
ships example crawl-status and crawl-metrics dashboards [S13].

**RECOMMENDATION (high):** Curiosity should retain stage, partition/origin key
(cardinality-controlled), attempt, lease age, queue age, retry reason, status,
bytes, and terminal outcome. Alert on oldest due URL/lease, not only throughput;
an apparently busy crawler can starve whole origins.

### 8.2 Recovery semantics

- **FACT (high):** Storm supervisors restart dead workers; Nimbus reassigns
  tasks when nodes die. Nimbus/Supervisor state is externalized, and workers can
  continue during Nimbus loss, although failed-node reassignment then pauses
  [S21].
- **FACT (high):** Storm's ackers track anchored tuple DAGs. Failed tasks,
  ackers, or timed-out trees cause the spout root to fail/replay, providing
  at-least-once processing when components use the API correctly [S19].
- **INFERENCE (high):** Storm does not make the external frontier or content
  index exactly-once. Recovery is safe only when leases expire and side effects
  are deterministic/idempotent. In-memory fetch queues, status caches, and
  spout buffers are disposable acceleration state.
- **UNKNOWN:** URLFrontier server durability/replication behavior was outside
  this StormCrawler-focused frame. The client contract alone cannot establish
  no-loss recovery for a particular server deployment.

### 8.3 Scaling

**FACT (high):** Storm scales worker processes and per-component executors;
executors can be changed by rebalance while task count remains fixed for the
topology lifetime [S22]. StormCrawler adds fetch threads inside each fetcher
task, so there are two concurrency knobs: component parallelism and per-task
fetch concurrency.

Scale constraints:

1. Increase fetcher task parallelism only with stable fields partitioning.
2. Increase fetch threads for origin diversity, not to defeat per-origin delay.
3. Scale parsing/indexing independently when CPU or sink latency dominates.
4. Scale status-updater capacity with backend bulk throughput and wait-ack age.
5. Scale spouts only when the frontier's lease and politeness semantics remain
   atomic across consumers.
6. Preserve enough tasks at submission time if future executor rebalance is
   expected [S22].

**INFERENCE (high):** Maximum useful crawl rate is bounded by origin diversity
and politeness, not merely cluster CPU. Additional workers do not improve a
single-origin crawl under a correct global origin budget.

## 9. Curiosity implications and verdict ledger

| Pattern / decision | Verdict | Rationale | Confidence |
| --- | --- | --- | --- |
| Separate frontier/status ledger from content index | **ADOPT** | Preserves scheduling, failures, and non-indexable URLs independently | High |
| Explicit default/content and status/control planes | **ADOPT** | Makes recursive feedback and terminal commits observable | High |
| Stable origin-key partitioning | **ADOPT** | Foundation for politeness and fair scheduling | High |
| One central atomic origin lease/rate authority | **ADAPT** | Stronger than StormCrawler's optional local+frontier combination | High |
| Bounded, diversified frontier hand-outs | **ADOPT** | Prevents one origin from monopolizing workers; enables fairness | High |
| Small typed status machine plus next-action time | **ADAPT** | Add explicit attempt/lease/job state and reason taxonomy | High |
| At-least-once processing with idempotent terminal writes | **ADOPT** | Practical recovery contract; document duplicate side effects | High |
| Apache Storm runtime | **REJECT as default** | High operational/JVM complexity for a provider-neutral retrieval service; reconsider only for sustained streaming crawl scale | Medium-high |
| Search engine as canonical frontier | **REJECT as baseline** | Couples correctness to index/query semantics; acceptable adapter, not contract | High |
| Unbounded queues/body/text defaults | **REJECT** | Conflicts with repository requirement for bounded behavior | High |
| Local caches as dedup correctness | **REJECT** | They reduce writes but disappear and do not coordinate consumers | High |
| Content-hash document ID as universal dedup | **REJECT** | Breaks URL-level deletion/provenance and conflates identities | High |
| URLFrontier adapter | **DEFER** | Valuable language-neutral boundary; requires separate server durability/politeness review | Medium-high |
| Playwright/browser-fetch adapter | **DEFER** | Useful but much more expensive and expands security/isolation needs | High |

### Recommended Curiosity contract

**RECOMMENDATION (high):** Define a provider-neutral `FrontierItem` with at
least: normalized URL ID, original URL, origin key/version, crawl/job ID,
priority, discovered-at/source, due-at, lease owner/expiry/token, attempt,
terminal/retry status and typed reason, robots/rate state reference, persisted
fetch validators, and bounded metadata. Keep capture/content/index IDs separate.

Workers should receive a bounded lease batch, checkpoint deterministic stage
outcomes, and finish with a conditional compare-and-set on the lease token.
Retry policy should classify transport retry, work replay, and future recrawl as
different operations. Every queue, response body, parser expansion, metadata
set, attempt count, deadline, and browser action budget must be explicit.

## 10. Unknowns and validation checks

### 10.1 Material unknowns

1. Production behavior and durability of any specific URLFrontier server
   implementation, including multi-node ownership and disaster recovery.
2. Effective Storm 3.0.0 backpressure defaults and tuning for a chosen cluster;
   the StormCrawler archetype declares only some topology bounds.
3. Atomicity of SQL/Solr status selection under multiple spout tasks; this needs
   backend-specific source/test and live contention validation.
4. End-to-end replay behavior when indexing succeeds but status persistence
   fails under each indexer backend.
5. Crawl fairness under millions of tiny origins, DNS churn, redirects between
   origins, and IPv4/IPv6 partition changes.
6. Whether current docs' effective defaults always match generated projects;
   library YAML, archetype overrides, and class fallback values differ.
7. Quantitative throughput, latency, memory, and storage amplification. No
   benchmark was run, and upstream production claims do not establish Curiosity
   capacity.

### 10.2 Required checks before any adoption

- Fault-inject worker death at fetch, parse, index, and status-commit boundaries;
  verify bounded duplicate writes and lease recovery.
- Run two or more consumers against one origin; verify atomic global pacing and
  `Retry-After`/robots behavior.
- Verify URL normalization and identity against redirects, Unicode/IDNA,
  fragments, default ports, query ordering, and canonical hints.
- Saturate index/status sinks; verify that queue count, memory, in-flight tuples,
  and retry volume remain bounded.
- Test poison URLs/documents and permanent errors; ensure replay terminates.
- Measure oldest-due age and per-origin starvation under skewed frontiers.
- Validate robots, destination-IP controls, decompression/body/parser limits,
  browser isolation, and untrusted-content handling independently.
- Reconcile generated configuration against runtime-resolved values and export
  them as deployment evidence.

## 11. Bounded curiosity pass

After synthesis, open gaps were scored 1–5 on **relevance (R)**, **decision
value (V)**, **novelty (N)**, and **cost (C, lower is cheaper)**. Only the best
in-frame thread was pursued; the stop condition was architectural coverage plus
source saturation.

| Thread | R | V | N | C | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify whether frontier-level politeness is atomic with multiple clients | 5 | 5 | 5 | 2 | **Pursued.** Official URLFrontier module README records non-propagated keyed delays and a non-atomic concurrent hand-out limitation; recommendation strengthened to one atomic authority [S12]. |
| Compare every backend's concurrency/locking semantics | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO.** Too broad; retained as backend-specific unknown/check. |
| Benchmark StormCrawler versus a custom worker pool | 3 | 4 | 3 | 5 | **CURIOSITY_NO_GO.** Requires representative hardware/corpus and would exceed research-only authority. |
| Reverse-engineer Playwright action internals | 2 | 2 | 3 | 4 | **CURIOSITY_NO_GO.** Outside the crawl-control decision. |
| Inspect URLFrontier server storage engines | 4 | 4 | 4 | 5 | **CURIOSITY_NO_GO.** Separate product/deployment review; caller authorized StormCrawler only. |

## 12. License and clean-room record

- **FACT (high):** Apache StormCrawler's repository is Apache License 2.0 and
  includes an ASF NOTICE [S1] [S17]. Apache-2.0 grants copyright and patent
  permissions subject to its conditions; redistribution of source/derivatives
  requires the license, changed-file notices, retained attribution notices, and
  applicable NOTICE attribution. It does not grant trademark rights [S17].
- **FACT (high):** StormCrawler depends on numerous third-party components;
  incorporating code or binaries requires reviewing the release's NOTICE and
  third-party inventory, not assuming every dependency is Apache-2.0 merely
  because the project is [S1].
- **RECOMMENDATION (high):** This dossier is a behavior-level reference with
  explicit attribution. No StormCrawler code, comments, schemas, or config are
  transferred. If implementation later copies or modifies any upstream code,
  stop calling that portion clean-room, record exact file/commit provenance,
  perform legal/license review, and carry required LICENSE/NOTICE/change notices.
  Independent implementation should use Curiosity names and contracts and be
  reviewed against this behavioral specification rather than upstream source.

## Sources

All web sources accessed 2026-08-17. StormCrawler repository links are pinned to
commit `358d761e502fbf27a2e22efd8cc9d3a081cd54cd` so later edits do not silently
change the evidence.

- **[S1]** Apache StormCrawler, repository README, license and project boundary:
  <https://github.com/apache/stormcrawler/tree/358d761e502fbf27a2e22efd8cc9d3a081cd54cd>
- **[S2]** Apache StormCrawler, architecture and configuration:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/docs/src/main/asciidoc/architecture.adoc>;
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/docs/src/main/asciidoc/configuration.adoc>
- **[S3]** Apache StormCrawler, internals (status stream, bolts, spouts, filters,
  protocols):
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/docs/src/main/asciidoc/internals.adoc>
- **[S4]** Apache StormCrawler, generated Flux topology:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/archetype/src/main/resources/archetype-resources/crawler.flux>
- **[S5]** Apache StormCrawler, generated crawler configuration:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/archetype/src/main/resources/archetype-resources/crawler-conf.yaml>
- **[S6]** Apache StormCrawler, `AbstractStatusUpdaterBolt`:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/core/src/main/java/org/apache/stormcrawler/persistence/AbstractStatusUpdaterBolt.java>
- **[S7]** Apache StormCrawler, `AbstractQueryingSpout`:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/core/src/main/java/org/apache/stormcrawler/persistence/AbstractQueryingSpout.java>
- **[S8]** Apache StormCrawler URLFrontier spout:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/external/urlfrontier/src/main/java/org/apache/stormcrawler/urlfrontier/Spout.java>
- **[S9]** Apache StormCrawler URLFrontier status updater:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/external/urlfrontier/src/main/java/org/apache/stormcrawler/urlfrontier/StatusUpdaterBolt.java>
- **[S10]** Apache StormCrawler core defaults:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/core/src/main/resources/crawler-default.yaml>
- **[S11]** Apache StormCrawler `FetcherBolt`:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/core/src/main/java/org/apache/stormcrawler/bolt/FetcherBolt.java>
- **[S12]** Apache StormCrawler URLFrontier module README (pacing constraints):
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/external/urlfrontier/README.md>
- **[S13]** Apache StormCrawler OpenSearch module README (roles/metrics):
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/external/opensearch/README.md>
- **[S14]** Apache StormCrawler OpenSearch `AggregationSpout`:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/external/opensearch/src/main/java/org/apache/stormcrawler/opensearch/persistence/AggregationSpout.java>
- **[S15]** Apache StormCrawler OpenSearch status updater:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/external/opensearch/src/main/java/org/apache/stormcrawler/opensearch/persistence/StatusUpdaterBolt.java>
- **[S16]** Apache StormCrawler `AbstractIndexerBolt`:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/core/src/main/java/org/apache/stormcrawler/indexing/AbstractIndexerBolt.java>
- **[S17]** Apache StormCrawler LICENSE and NOTICE:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/LICENSE>;
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/NOTICE>
- **[S18]** StormCrawler legacy official FAQ (storage, recursion, politeness,
  continuous topology caveat): <https://stormcrawler.net/faq/>
- **[S19]** Apache Storm, Guaranteeing Message Processing (at-least-once,
  anchoring, ack/fail, timeout):
  <https://storm.apache.org/releases/2.8.3/Guaranteeing-message-processing.html>
- **[S20]** Apache StormCrawler, `CrawlerMetrics`:
  <https://github.com/apache/stormcrawler/blob/358d761e502fbf27a2e22efd8cc9d3a081cd54cd/core/src/main/java/org/apache/stormcrawler/metrics/CrawlerMetrics.java>
- **[S21]** Apache Storm, Daemon Fault Tolerance:
  <https://storm.apache.org/releases/2.8.3/Daemon-Fault-Tolerance.html>
- **[S22]** Apache Storm, topology parallelism and rebalance:
  <https://storm.apache.org/releases/2.8.3/Understanding-the-parallelism-of-a-Storm-topology.html>

**Overall confidence:** high for the pinned architecture and component behavior;
medium for cross-backend operational equivalence; low for untested quantitative
performance and any URLFrontier server deployment behavior.
