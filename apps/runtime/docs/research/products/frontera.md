# Frontera crawl-frontier framework: clean-room architecture study

**Date / source access:** 2026-08-17  
**Decision frame:** what Curiosity should learn from, reuse from, or reject from
Frontera when designing an owned crawl frontier.  
**Inspected baseline:** public `scrapinghub/frontera` repository at
`c94beae2f438492139d24759729d0201779ccf1c`; documentation identifies itself as
Frontera 0.8.  
**Status:** research only. No Frontera code, data, or deployment was imported.

## Executive verdict

**REJECT Frontera as a Curiosity production dependency; ADOPT/ADAPT selected
architecture lessons (high confidence).** Frontera has a useful separation of
fetchers, policy/strategy, durable URL state, priority queues, and transport.
Its hostname-affine partitioning and explicit strategy API are particularly
instructive. It is not, however, a safe modern foundation: the latest GitHub
release and PyPI-selected release are 0.8.1 from 2019; the only 2025 `master`
changes are CI workflow changes; durable handoff is not transactional; queue
items can be removed before publication; URL state is only four-valued and
strategy-managed; politeness is split across optional configuration, strategy,
and Scrapy; and backend ordering/delay behavior is not uniform [S1][S14-S17].

The clean-room lesson is not “port Frontera.” It is to preserve its **control-
plane separation and host affinity**, while specifying stronger neutral
contracts for leases, retries, idempotency, score semantics, policy evidence,
revisit time, and partition migration.

## 1. Bounded questions and method

### Questions

1. How are URL identity, state, score, deduplication, and revisits represented?
2. How do queues, partitions, spiders, strategy workers, DB workers, and
   backends cooperate in single-process and distributed modes?
3. What survives restart, and what happens at each crash boundary?
4. Where are robots, host affinity, throttling, and broader politeness enforced?
5. What scale is evidenced, what failure properties remain unknown, and what is
   the maintenance/license posture?
6. Which ideas should Curiosity adopt, adapt, reject, or defer without copying
   implementation?

### Method and boundaries

Official project documentation, repository source, release/tag/commit metadata,
PyPI metadata, and the repository license were inspected. Claims in the README
are treated as project claims, not independent benchmarks. Source inspection
was behavioral and clean-room: this report describes externally relevant
concepts and does not reproduce algorithms or code. No crawler, package, or
third-party service was executed. GitHub issues were used only as maintenance
signals, not as proof of a defect [S1-S18].

Labels:

- **FACT** — directly present in an official source.
- **INFERENCE** — conclusion from inspected behavior, not measured here.
- **RECOMMENDATION** — a Curiosity design choice.
- Confidence is **high**, **medium**, or **low**.

## 2. System model

### 2.1 The abstraction

**FACT (high):** Frontera is a frontier and distribution toolbox, not a complete
search engine. Its manager mediates a fetcher through middleware to one backend.
The backend owns crawl policy at the framework level and delegates low-level
storage to `Queue`, `Metadata`, `States`, and `DomainMetadata`. A fetcher may be
Scrapy or another system [S2][S5].

There are two active run modes [S2][S3]:

| Mode | Shape | Intended use |
| --- | --- | --- |
| Single process | fetcher + manager + middleware + local backend | strategy development or small, fast crawls |
| Distributed | spiders, sharded strategy workers (SW), sharded DB workers (DBW), message bus, durable backend | broad/web-scale crawling |

Version 0.8 deliberately removed the earlier “distributed spiders” mode and
backend-owned prioritization, making crawling strategy the primary policy
surface [S14].

### 2.2 Distributed loop

```text
spider fetch/extract result
  -> spider-log (keyed by host/domain fingerprint)
  -> strategy worker for that partition
       -> fetch URL states
       -> policy handler changes state and emits (request, score, schedule?)
  -> scoring-log
  -> DB worker deduplicates only within that consumed batch
       -> durable priority queue
  -> DB batch generator removes a batch from queue
  -> spider-feed partition
  -> assigned spider / Scrapy downloader
  -> repeat

In parallel: spider-log -> DB worker -> crawl metadata storage
```

**FACT (high):** SWs consume assigned spider-log partitions; DBWs persist crawl
metadata and scores and generate spider-feed batches. Spider-log has separate SW
and DBW consumer groups, so each event can reach both policy and metadata paths.
Scoring updates flow independently from SW to DBW [S2][S8][S9].

**INFERENCE (high):** this is an asynchronous, eventually coordinated pipeline,
not a single atomic state machine. Metadata, state, queue, Kafka offsets, and
fetch completion can disagree after a crash because no transaction spans them.

## 3. URL identity, state, score, and deduplication

### 3.1 URL identity

**FACT (high):** the URL fingerprint middleware first applies `w3lib` URL
canonicalization, then a configurable fingerprint function; SHA-1 is the
default. The fingerprint is stored in request/response metadata. Redirect URLs
receive separate fingerprints. Domain fingerprints are optional and similarly
configurable [S6][S11].

This identity is **syntactic URL identity**, not fetched-content identity:

- query normalization follows the chosen URL canonicalizer;
- HTTP method, body, headers, representation, content digest, and capture time
  are not part of the default key;
- an optional canonical-URL solver may substitute document URLs elsewhere in
  the middleware pipeline, but does not create a general duplicate-content
  model [S2][S6].

**INFERENCE (high):** the default key can conflate requests that share a URL but
differ by method/body and cannot collapse mirrors, syndication, or materially
equivalent content. It is unsuitable as Curiosity's sole document/version key.

### 3.2 URL state

**FACT (high):** every fingerprint has one short-integer state:
`NOT_CRAWLED`, `QUEUED`, `CRAWLED`, or `ERROR`. Unknown fingerprints default to
`NOT_CRAWLED`. State is cached in an SW, fetched in batches, mutated by strategy
code, and periodically or gracefully flushed to storage. The framework does not
itself enforce every transition [S4][S5][S7].

The bundled breadth-first strategy illustrates the intended transition model:

```text
unseen -> NOT_CRAWLED -> QUEUED -> CRAWLED
                              \-> ERROR
```

It schedules only `NOT_CRAWLED` links, marks successful responses `CRAWLED`,
and marks failed requests `ERROR`. Requeue policy is strategy code, not a state-
machine guarantee [S7].

**INFERENCE (high):** `QUEUED` combines ready, delayed, published, delivered,
and in-flight work. `ERROR` combines retryable and terminal failures. There are
no built-in lease owner/expiry, attempt count, next-eligible time, HTTP result,
policy block reason, or version/revisit generation in this state enum.

### 3.3 Scoring

**FACT (high):** a strategy schedules a request with a floating-point score
nominally in `[0,1]`; it may alternatively update score without queueing.
Bundled breadth-first and depth-first strategies derive score from link depth.
HBase and Redis discretize scores into 0.01 bands; HBase uses finer 0.001 column
bands inside rows. The queue API calls itself prioritized but does not define a
normative cross-backend tie-breaker or ordering contract [S5][S7][S10].

**INFERENCE (medium): backend score ordering appears inconsistent.** HBase
inverts score before lexicographic scanning and Redis takes sorted-set entries
in reverse order, both implying larger values first. SQLAlchemy orders score
ascending, and the memory backend's min-heap comparator also appears to return
smaller scores first. This was source-inspected but not executed; no conformance
test establishing identical ordering across all backends was found [S10].

**FACT (high):** HBase queue retrieval can request minimum host diversity and a
maximum per-host contribution. It scans progressively deeper up to three times,
groups candidates by a CRC32 host key, then deletes selected queue rows. Redis
has similar host limits and enforces `crawl_at`; HBase stores `crawl_at` but its
time filter is commented out in the inspected retrieval path [S10].

**INFERENCE (high):** score alone is overloaded. It cannot explain whether a URL
won because of topical value, freshness, crawl debt, host fairness, discovery
depth, retry urgency, or policy. Curiosity needs separate typed signals and a
recorded final scheduling decision.

### 3.4 Deduplication

Frontera's principal dedup mechanism is **state by canonicalized-URL
fingerprint**, consulted by the strategy before scheduling [S4][S6][S7]. There
are also narrower dedup points:

- the DB scoring consumer keeps the first update for each fingerprint only
  within one consumed batch;
- HBase/Redis metadata collapse extracted links by fingerprint within one
  event/batch;
- metadata/state rows are keyed by fingerprint [S8][S10].

**FACT (high):** the SQL queue schema uses an independent integer primary key;
its fingerprint is not unique. HBase queue cells and Redis sorted-set members
also do not constitute a documented global uniqueness transaction with state
[S10].

**INFERENCE (high):** concurrent duplicate discoveries can be scheduled more
than once when SW state is stale, a prior state update is unflushed, or a message
is replayed. Conversely, a persisted `QUEUED` state whose queue/feed item is
lost can suppress the URL indefinitely. Frontera provides practical
best-effort URL deduplication, not an exactly-once admission invariant.

No built-in content-hash, near-duplicate, redirect-cluster, or canonical-
document dedup layer was found. **Negative result retained.**

## 4. Queueing and partitioning

### 4.1 Durable queue behavior

**FACT (high):** `get_next_requests` removes returned requests from internal
queue storage. Memory uses per-partition heaps; SQL uses queue rows; HBase uses
priority-encoded row keys and deletes selected rows; Redis uses one sorted set
per partition and removes returned members [S5][S10].

Queue partition is normally derived from hostname/domain with CRC32 modulo the
configured partition count. HBase additionally allows request metadata `slot`
to override the partition key. A custom hostname-local fingerprint places a
host CRC prefix in a document fingerprint to improve HBase locality [S4][S10].

**INFERENCE (high):** changing partition count changes modulo placement and no
online rebalance/migration protocol is documented. Host/domain metadata and SW
cache ownership therefore need an explicit migration plan in any successor.

### 4.2 The two partition planes

Frontera has two related but distinct planes [S2][S4][S9]:

1. **Spider log -> SW.** Events are keyed by domain fingerprint and Kafka uses a
   fingerprint partitioner. Stable host affinity means one SW owns strategy
   decisions for a host/domain subset.
2. **Queue/spider feed -> spider.** The durable queue is host-partitioned. When
   publishing to spider feed, the key is hostname only if
   `QUEUE_HOSTNAME_PARTITIONING` is enabled; otherwise it is URL fingerprint.

**FACT (high):** the default for `QUEUE_HOSTNAME_PARTITIONING` is false [S11].
Thus the documentation's statement that one host is downloaded by no more than
one spider process is configuration-dependent, not an unconditional invariant
[S2][S9]. Even when enabled, it means one **process**, not one concurrent fetch;
Scrapy's per-domain concurrency still applies.

### 4.3 Flow control

**FACT (high):** the spider feed reports consumer lag. DB batch generation only
fills partitions whose lag is below `MAX_NEXT_REQUESTS`; incoming spider offset
messages can also mark feed partitions ready/busy. Batch size, backend query
limits, host diversity, and a configurable new-batch delay provide coarse flow
control [S9][S13].

**INFERENCE (medium):** this is useful bounded backpressure, but not end-to-end
capacity control: durable queue dequeue, producer buffering, broker receipt,
spider receipt, downloader admission, and fetch completion are separate stages.

## 5. Spiders, backends, and policy

### 5.1 Spider/fetcher boundary

**FACT (high):** Scrapy is optional. In distributed mode its Frontera backend
consumes one configured spider-feed partition, converts frontier requests into
Scrapy requests, and sends crawled/error/extracted-link events to spider log.
The scheduler fills only when downloader capacity is available and maintains an
overused-slot buffer [S2][S12].

Frontera documentation strongly narrows Scrapy's role to fetching, parsing, and
link extraction. It advises disabling Scrapy depth, offsite, URL-length, and
robots policy so the crawling strategy remains authoritative [S12].

### 5.2 Backend matrix

| Backend | Intended role | Durability/scale observation |
| --- | --- | --- |
| Memory | education/testing | process-local; state cache may clear |
| SQLAlchemy | local/general RDBMS | persistent queue/state/metadata; default SQLite memory configuration |
| HBase | large-scale broad crawl | SW opens states/domain metadata; DBW opens queue/crawl metadata |
| Redis | large but limited scope | persistent components subject to Redis memory; docs say failed writes may be skipped and lost |

**FACT (high):** Redis retries connection operations three times and then skips
the operation; out-of-memory write failures are logged while the crawler
continues, losing metadata or queue items [S5]. ZeroMQ is explicitly for PoC or
small deployments and can lose messages at startup/shutdown; it supports only
one SW and one DBW. Kafka is the only built-in transport supported for the
documented distributed mode [S3][S8].

### 5.3 Strategy boundary

**FACT (high):** strategies receive seed, crawled-page, request-error, and
filtered extracted-link events; they can batch-refresh states, schedule with a
score, persist per-domain metadata, and define a stopping condition. The 0.8
release made this policy boundary central and added basic breadth-first,
depth-first, and Discovery strategies [S4][S7][S14].

**RECOMMENDATION (high):** Curiosity should retain a pure, versioned strategy
decision interface, but it should return an auditable decision record rather
than mutate opaque request metadata. Policy and storage adapters must remain
separate from provider-neutral frontier contracts.

## 6. Restart and failure semantics

### 6.1 Intended restart model

**FACT (high):** documentation says queue contents, link states, and domain
metadata persist; on orderly stop, state is flushed and later loaded on demand.
A paused crawl resumes the main workflow without reinjecting seeds. Starting a
new crawl requires clearing queue, states, and domain metadata, usually by table
truncation [S4].

SW shutdown stops periodic work, flushes states, closes the manager and scoring
producer, and closes the consumer; Kafka consumer close commits offsets [S7][S9].
HBase metadata and state writes are batched [S10].

### 6.2 Crash-boundary analysis

| Boundary | Inspected behavior | Consequence (inference) |
| --- | --- | --- |
| SW consumes spider event before state/scoring output is durable | Kafka consumer and state/scoring stores are independent | replay or loss depends on offset timing; no atomic consume-transform-produce |
| DBW consumes scoring update before queue write | independent consumer and backend commit | duplicate or missing admission is possible |
| Queue -> spider feed | queue entries are deleted before/while asynchronous producer sends | producer/encoding/crash failure can strand `QUEUED` URLs |
| Spider consumes feed before fetch result | no durable lease/in-flight row found | crash may lose committed work or replay uncommitted work |
| Fetch result -> state + metadata | separate SW/DBW consumer groups and stores | one side can advance without the other |
| Periodic state cache -> backend | SW flush defaults to 300 seconds | abrupt loss can forget recent state transitions |

**FACT (high):** batch generation counts encoding failures as processed and does
not reinsert the already-dequeued request; send exceptions are logged but the
request is likewise not restored. Kafka producer sends are asynchronous and the
batch generator does not await each send result [S9].

**INFERENCE (high):** Frontera offers operational resume from durable snapshots,
but not a defined at-least-once or exactly-once frontier protocol. It has both
loss and duplication windows. Kafka improves persistence relative to ZeroMQ but
does not repair application-level handoff gaps.

**Unknown:** no official crash-injection matrix, recovery-point objective,
queue/feed reconciliation tool, or proof of consumer-offset semantics was found.
No live failure test was authorized.

## 7. Politeness and robots integration

Politeness is distributed across three layers rather than enforced by one
frontier invariant:

1. **Affinity/fairness:** host-derived queue partitions, optional hostname-keyed
   spider feed, and broad-crawl `min_hosts` / `max_requests_per_host` batching
   reduce concentration [S2][S9][S10].
2. **Policy:** `DomainMetadata` can store bans, counters, and robots content.
   Discovery claims robots and sitemap support and per-site page limits [S4][S5].
3. **Fetcher:** documentation recommends Scrapy AutoThrottle, per-domain
   concurrency, a disclosed user agent, response-size limits, and downloader
   delays. It simultaneously instructs users to disable Scrapy's robots
   middleware and implement robots in the strategy [S12].

**INFERENCE (high):** Frontera does not provide one durable host-budget service
that atomically combines robots status, crawl-delay, concurrency, retry-after,
recent latency/errors, and next-eligible time across workers. Host affinity
prevents multi-spider competition only when configured, and one spider can
still issue multiple same-domain requests.

**RECOMMENDATION (high):** Curiosity should make robots/publisher policy and
host admission a mandatory service in front of leasing, not optional strategy
convention. Every lease should carry policy-version evidence and a host-token
decision; Scrapy/browser adapters may impose stricter limits but never bypass
the frontier gate.

## 8. Scale, operations, and failure posture

**FACT (medium):** the project README claims its largest deployment used 60
spiders/strategy workers and delivered 50–60 million documents per day for 45
days without downtime [S1]. This is first-party historical evidence with no
published workload, hardware, success definition, cost, or reproducible report;
it must not be treated as an independent benchmark.

Architectural scale strengths:

- host-affine SW shards localize state and policy;
- DBW consumer groups and manually assigned queue partitions permit horizontal
  work distribution;
- HBase separates high-volume queue/metadata from cached state access;
- small online batches allow strategy changes without stopping the crawl;
- feed lag, batch bounds, host diversity, and stats streams expose control
  points [S2][S9][S10][S13].

Scale/failure limits:

- a hot host/domain is confined to one SW partition and, with politeness
  affinity, one spider process;
- CRC/modulo partitioning lacks documented elastic migration;
- score bands and queue scans trade precision for storage locality;
- HBase queue count is unimplemented, and HBase delayed eligibility appears
  stored but not applied in the inspected read path;
- Redis explicitly drops work on repeated connection or memory failure;
- ZeroMQ explicitly loses messages;
- no dead-letter queue, lease sweeper, admission ledger, or queue/feed/state
  reconciliation protocol was found [S5][S8][S10].

**INFERENCE (high):** Frontera demonstrates that this topology can reach high
throughput, not that it meets modern correctness, operability, or evidence-
lineage requirements.

## 9. Maintenance and compatibility status

**FACT (high):** GitHub's latest release is 0.8.1, published 2019-04-05. PyPI
also reports 0.8.1 as the current version and provides only a source archive for
it. The package classifiers cover Python 2.7 and Python 3.4–3.7, and dependencies
include old integration surfaces such as `kafka-python>=1.4.0` [S14][S15].

**FACT (high):** `master` had no product-code commit after 2019-11-29. Two June
2025 commits added/fixed GitHub Actions workflows only. A `v0.7.2` tag and PyPI
files were created in June 2025 from a separately modernized **older 0.7 line**;
because `0.7.2 < 0.8.1`, ordinary “latest version” resolution remains 0.8.1.
There is no corresponding GitHub Release entry for 0.7.2 [S14-S17].

**FACT (medium):** the repository is not marked archived, but it has 95 open
issues in the 2026 GitHub API snapshot. An open “Project Status?” issue from
2020 received no maintainer status answer in the inspected comments [S16][S18].

**INFERENCE (high):** maintenance is dormant/ambiguous, not formally declared
dead. The 2025 workflow/tag activity is insufficient evidence of maintained 0.8
runtime compatibility or security support. Curiosity should not inherit this
dependency and transitive stack without a separately authorized fork audit.

## 10. License and clean-room boundary

**FACT (high):** Frontera is BSD-3-Clause. Source and binary redistribution,
with or without modification, is permitted if copyright/license/disclaimer
conditions are retained; contributor/project names cannot endorse derived
products without permission; the software is provided without warranty [S17].

BSD compatibility does **not** make source provenance irrelevant.

### Allowed learning posture

- learn abstract separation of frontier, strategy, fetcher, storage, and bus;
- learn host-affine partitioning, bounded batch generation, typed state needs,
  domain metadata, and separate local/distributed modes;
- cite Frontera as the origin of these studied design lessons;
- independently specify Curiosity contracts from requirements and public
  behavior.

### Prohibited in this study

- copying Frontera source, data layouts, tests, or implementation text;
- representing BSD project code as Curiosity-owned original code;
- using Frontera/Scrapinghub names as endorsement;
- assuming transitive dependencies share BSD terms;
- deploying or publishing any derived component without separate review.

**RECOMMENDATION (high):** keep this report as design provenance. If source reuse
is ever authorized, record exact files/commits and notices separately and review
every dependency license. The present verdict requires no code transfer.

## 11. Curiosity implications and decision ledger

| Item | Type | Verdict | Confidence | Rationale / required adaptation |
| --- | --- | --- | --- | --- |
| Separate fetch, policy, frontier storage, and transport | Recommendation | **ADOPTED** | High | Strong provider-neutral boundary; policy must not be buried in fetch adapters. |
| Single-process simulator plus distributed production topology | Recommendation | **ADOPTED** | High | Enables deterministic strategy testing before scale. Contracts must be identical in both modes. |
| Stable host-affine ownership | Recommendation | **ADAPTED** | High | Use a versioned consistent assignment/rendezvous scheme with migration epochs, not bare modulo. |
| Four URL states | Recommendation | **REJECTED** | High | Replace with explicit discovered/admitted/ready/leased/fetched/retry/terminal/policy-blocked states and transition events. |
| Mutable request metadata as control plane | Recommendation | **REJECTED** | High | Use typed immutable IDs, policy evidence, scheduling decisions, and attempt records. |
| One scalar `[0,1]` score | Recommendation | **ADAPTED** | High | Preserve sortable priority, but record component signals, model/policy version, eligibility time, and deterministic tie-breaker. |
| State-based URL dedup | Recommendation | **ADAPTED** | High | Admission must be atomic/idempotent by crawl-target key; keep document/version and content-cluster identity separate. |
| Destructive dequeue before publish | Recommendation | **REJECTED** | High | Use durable leases/outbox or transactional publication; acknowledge only after durable handoff. |
| Kafka/ZeroMQ implementation | Recommendation | **REJECTED** | High | Transport is an adapter choice; correctness contract must not depend on broker folklore. |
| Per-domain metadata | Recommendation | **ADOPTED** | High | Make schema typed/versioned: robots evidence, budgets, errors, latency, cooldown, publisher controls. |
| Host-diverse bounded batching | Recommendation | **ADOPTED** | High | Useful fairness/backpressure primitive, subordinate to mandatory politeness admission. |
| Robots in optional crawling strategy | Recommendation | **REJECTED** | High | Policy gate must be mandatory, durable, inspectable, and fail closed where required. |
| Frontera package as production dependency | Recommendation | **REJECTED** | High | Dormant/ambiguous maintenance, old runtime surface, non-transactional failure windows. |
| Frontera BSD source reuse | Recommendation | **DEFERRED** | High | Unnecessary for clean-room design; requires explicit exception, provenance, and license/dependency review. |
| Historical scale claim | Fact | **DEFERRED as benchmark evidence** | Medium | Useful feasibility signal only; not independently reproducible. |

### Minimum successor contracts

Curiosity's frontier specification should independently define:

1. `CrawlTargetId` distinct from canonical document, capture, and content-cluster
   IDs; method/body and normalization-policy version must be explicit.
2. Atomic idempotent admission with discovery provenance and dedup reason.
3. `eligible_at`, priority components, final score, policy/model version, and a
   deterministic tie-breaker.
4. Durable lease owner, attempt, expiry, heartbeat, acknowledgement, and retry/
   terminal classification.
5. Mandatory robots/publisher-policy evidence and host token/budget decision.
6. Versioned partition assignment and safe shard movement.
7. Outbox/inbox or equivalent handoff invariant across queue, bus, and result
   events; duplicate delivery must be harmless.
8. Reconciliation for admitted-without-ready, leased-expired, fetched-without-
   capture, and result-without-state cases.
9. A complete append-only transition/evidence ledger plus bounded operational
   projections; search results and fetched content remain untrusted data.

## 12. Verification ledger, unknowns, and negative results

| Check | Result | Confidence |
| --- | --- | --- |
| Architecture docs vs source topology | SW/DBW/spider and three streams agree | High |
| State enum/docs vs bundled strategies | Four values and strategy-managed transitions agree | High |
| Queue API vs HBase/Redis/SQL/memory | Destructive dequeue confirmed in all inspected implementations | High |
| Host-affinity claim vs defaults/source | Conditional; spider-feed hostname partitioning defaults off | High |
| Delayed scheduling across backends | Redis enforces; HBase stores but inspected filter is disabled; no uniform contract | High |
| Score direction across backends | Source indicates divergence; no execution performed | Medium |
| Restart documentation vs handoffs | Durable stores exist, but no cross-store transaction/lease found | High |
| Release/PyPI/tag history | 0.8.1 remains latest; 2025 0.7.2 is a lower, older-line release | High |
| Production scale | README claim only; no independent report found | Medium |

Explicit unknowns:

- current private production use or maintainer intent;
- behavior against supported 2026 Python/Scrapy/Kafka/HBase/Redis versions;
- measured loss/duplicate rates under kill, broker partition, or storage outage;
- exact historical hardware/corpus behind the 50–60M documents/day claim;
- whether downstream forks repair handoff and maintenance issues.

Negative results retained:

- no normative end-to-end delivery guarantee;
- no durable lease/in-flight model or dead-letter/reconciliation service;
- no global atomic queue dedup invariant;
- no content/near-duplicate model;
- no documented online partition migration;
- no uniform backend score/delay conformance suite found;
- no current maintainer support statement found;
- no independent scale benchmark found.

## 13. Bounded curiosity pass

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Rel. | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve apparent 2025 revival vs 2019 latest release | 5 | 5 | 5 | 1 | **Pursued:** established workflow-only `master` changes and the lower-version 0.7.2 branch/tag. |
| Verify claimed host politeness against partition defaults | 5 | 5 | 4 | 2 | **Pursued:** claim is conditional; hostname spider-feed partitioning defaults off. |
| Inspect dequeue-to-publish crash boundary | 5 | 5 | 4 | 2 | **Pursued:** destructive dequeue and non-awaited per-item send expose loss windows. |
| Compare priority/delay semantics across all backends | 5 | 5 | 4 | 2 | **Pursued:** found apparent score-direction divergence and HBase delay gap. |
| Run a historical HBase/Kafka cluster and fault injection | 4 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: outside research authority, obsolete stack cost, and not needed for dependency verdict. |
| Audit every transitive dependency CVE/license | 4 | 4 | 2 | 5 | `CURIOSITY_NO_GO`: no adoption is proposed; perform only if reuse is authorized. |
| Survey every Frontera fork | 2 | 3 | 3 | 4 | `CURIOSITY_NO_GO`: product decision concerns official framework; no evidence a fork changes the clean-room lessons. |
| Infer proprietary Scrapinghub production architecture | 1 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: undocumented, unnecessary, and outside clean-room boundaries. |

**Stop:** requested categories are covered; source and documentation evidence
saturated around the same topology and failure boundaries. Remaining unknowns
require live testing, maintainer access, or a newly authorized dependency audit.

## 14. Official sources

All accessed 2026-08-17. Repository source links are pinned to inspected commit
`c94beae2f438492139d24759729d0201779ccf1c` where practical.

1. **[S1] Frontera README.** Overview, feature list, historical scale claim,
   backends/transports, BSD statement.
   https://github.com/scrapinghub/frontera/blob/c94beae2f438492139d24759729d0201779ccf1c/README.md
2. **[S2] Official architecture overview.** Manager pipeline, distributed
   components, streams, host-affinity claim.
   https://frontera.readthedocs.io/en/latest/topics/architecture.html
3. **[S3] Official run modes.** Component assignments and Kafka-only built-in
   distributed transport.
   https://frontera.readthedocs.io/en/latest/topics/run-modes.html
4. **[S4] Official custom strategy guide.** Persistence/restart, host partition,
   state values, domain metadata, metadata fields.
   https://frontera.readthedocs.io/en/latest/topics/custom_crawling_strategy.html
5. **[S5] Official backend reference.** Component contracts, implementations,
   Redis failure behavior.
   https://frontera.readthedocs.io/en/latest/topics/frontier-backends.html
6. **[S6] Fingerprint middleware source.** URL canonicalization and configurable
   URL/domain fingerprints.
   https://github.com/scrapinghub/frontera/blob/c94beae2f438492139d24759729d0201779ccf1c/frontera/contrib/middlewares/fingerprint.py
7. **[S7] Strategy/worker/manager source.** Strategy API, bundled depth policies,
   state batching/flushing, score stream.
   https://github.com/scrapinghub/frontera/tree/c94beae2f438492139d24759729d0201779ccf1c/frontera/strategy and
   https://github.com/scrapinghub/frontera/blob/c94beae2f438492139d24759729d0201779ccf1c/frontera/worker/strategy.py
8. **[S8] Official message-bus reference.** ZeroMQ loss warning and Kafka role.
   https://frontera.readthedocs.io/en/latest/topics/message_bus.html
9. **[S9] Kafka and DB worker components.** Partitioners, consumers/producers,
   lag control, scoring consumption, destructive batch publication.
   https://github.com/scrapinghub/frontera/blob/c94beae2f438492139d24759729d0201779ccf1c/frontera/contrib/messagebus/kafkabus.py and
   https://github.com/scrapinghub/frontera/tree/c94beae2f438492139d24759729d0201779ccf1c/frontera/worker/components
10. **[S10] Backend implementation source.** HBase, Redis, SQLAlchemy, memory
    queue/state and schema behavior.
    https://github.com/scrapinghub/frontera/tree/c94beae2f438492139d24759729d0201779ccf1c/frontera/contrib/backends
11. **[S11] Default settings.** Fingerprints, partitions, batching, state flush,
    strategy and transport defaults.
    https://github.com/scrapinghub/frontera/blob/c94beae2f438492139d24759729d0201779ccf1c/frontera/settings/default_settings.py
12. **[S12] Official Scrapy integration and scheduler source.** Fetcher role,
    disabled policy middleware, robots responsibility, throttling/concurrency.
    https://frontera.readthedocs.io/en/latest/topics/scrapy-integration.html and
    https://github.com/scrapinghub/frontera/blob/c94beae2f438492139d24759729d0201779ccf1c/frontera/contrib/scrapy/schedulers/frontier.py
13. **[S13] Official cluster fine-tuning guide.** Bottlenecks, flow control,
    batch-size guidance.
    https://frontera.readthedocs.io/en/latest/topics/fine-tuning.html
14. **[S14] GitHub Releases API / v0.8 release notes.** 0.8 architectural
    changes and 0.8.1 date.
    https://api.github.com/repos/scrapinghub/frontera/releases?per_page=100
15. **[S15] PyPI project JSON.** Selected version, release files/dates,
    classifiers, ownership and 2025 0.7.2 artifacts.
    https://pypi.org/pypi/frontera/json
16. **[S16] GitHub repository, commits, tags APIs.** Repository status, open
    issue count, 2019 product-code cutoff, 2025 workflow commits, 0.7.2 tag.
    https://api.github.com/repos/scrapinghub/frontera and
    https://api.github.com/repos/scrapinghub/frontera/commits?per_page=10 and
    https://api.github.com/repos/scrapinghub/frontera/tags?per_page=20
17. **[S17] BSD-3-Clause license.** Exact reuse and notice conditions.
    https://github.com/scrapinghub/frontera/blob/c94beae2f438492139d24759729d0201779ccf1c/LICENSE
18. **[S18] Official repository issue 409, “Project Status?”** Maintenance
    signal only; no maintainer answer in inspected thread.
    https://github.com/scrapinghub/frontera/issues/409
