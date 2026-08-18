# Apache Nutch architecture: clean-room research notes

**Research date:** 2026-08-17  
**Decision frame:** What architectural lessons should Curiosity adopt, adapt,
reject, or defer from Apache Nutch's crawler, without copying Nutch code or
conflating a batch crawler with Curiosity's retrieval contracts?  
**Scope:** Apache Nutch **1.x**. The latest released version visible on the
research date is 1.22 (released 2025-07-20); source observations also use the
1.23-SNAPSHOT `master` tree at commit
`178c7403fa05e62b60eca09777363aeb0c3a112b` (2026-08-16). Nutch 2.x/Gora is
out of scope except where needed to prevent confusion. [S01][S03]

## Executive verdict

Nutch 1.x is best understood as a **versioned batch state machine built from
URL-keyed Hadoop files**, not as a continuously transactional frontier. A
durable CrawlDb holds one compact scheduling record per known URL. Each
generation selects due URLs into a timestamp-named segment; fetch and parse
append stage-specific products to that segment; an update job folds those
products and newly discovered links into a replacement CrawlDb generation.
LinkDb and downstream indexes are derived projections. [S02][S04][S05]

The strongest clean-room lessons for Curiosity are:

1. **Separate canonical scheduling state from immutable-ish evidence batches.**
   A compact per-URL record is efficient for frontier decisions, while segments
   preserve stage inputs and outputs for diagnosis and replay.
2. **Make host ownership the politeness boundary.** Nutch partitions a segment
   by host/domain/IP and then runs per-key queues with delay, concurrency, robots
   and error state. This is a sound local invariant, but it is not automatically
   global across overlapping jobs or segments.
3. **Make every stage bounded.** Nutch exposes caps on selected URLs, per-host
   URLs, content bytes, outlinks, redirects, retry count, queue exceptions,
   fetch duration, throughput and threads. Bounds are part of correctness, not
   merely tuning.
4. **Treat fetch/parse/index as separate failure domains.** Nutch can parse in
   fetch or as another job, but its durable segment boundary supports recovery
   and inspection. Curiosity should preserve that separation even if its
   implementation is event-driven rather than Hadoop batch.
5. **Do not inherit Nutch's implicit orchestration contract.** Directory
   presence, shell sequencing and external index-writer side effects are weaker
   than explicit run manifests, idempotency keys and transactional stage
   commits.

**Overall confidence: high** for the 1.x control/data flow and local politeness;
**medium** for production failure semantics, because Hadoop/filesystem and
index-adapter behavior vary by deployment and the project does not publish a
single formal end-to-end consistency specification.

## Bounded sub-questions

1. What is durable canonical state, and what is per-generation evidence?
2. How are due URLs selected, ranked, filtered, partitioned and prevented from
   being generated twice?
3. Where are robots, delays and host-level concurrency enforced?
4. How do fetch, parse, redirect handling, retry and deduplication interact?
5. What work is distributed, and which invariants remain only task- or
   segment-local?
6. Which stage boundaries are recoverable, and which side effects are not
   atomic?
7. How does crawled material reach an index without coupling the frontier to a
   specific search provider?

## 1. Data model and crawl generations

### 1.1 Canonical and derived stores

| Store | Observed role | Status |
|---|---|---|
| **CrawlDb** | URL-keyed `CrawlDatum`: database status, next/last fetch time (the field is context-dependent), retry count, fetch interval, score, content signature, modified time and extensible metadata. It is the canonical scheduler/history summary, not the fetched body store. | **FACT, high** [S04][S05] |
| **Segment** | One generated work batch. Standard parts include `crawl_generate`, `crawl_fetch`, `content`, `parse_text`, `parse_data`, and `crawl_parse`. Fetch and parse products remain associated with the batch that produced them. | **FACT, high** [S02][S04] |
| **LinkDb** | URL-keyed incoming-link projection assembled by inverting parsed outlinks; values include source URL and anchor text. It can merge new segment links into the current projection. | **FACT, high** [S02][S06] |
| **HostDb** | Optional host-level statistics used by current Generator expressions to vary per-host count and delay. It is auxiliary policy input, not the core frontier. | **FACT, high** [S04][S09] |
| **Search index** | External derived serving projection written through configured `IndexWriter` plugins. CrawlDb and LinkDb may enrich or delete index documents but are not search indexes themselves. | **FACT, high** [S02][S13] |

Nutch calls the repeated unit a crawl round/cycle. Operationally, the lineage is:

```text
seed files
   -> inject -> CrawlDb/current
   -> generate(due, score, policy) -> segment-N/crawl_generate
   -> fetch -> segment-N/{crawl_fetch, content}
   -> parse -> segment-N/{parse_text, parse_data, crawl_parse}
   -> updatedb(old CrawlDb + segment products) -> new CrawlDb/current
   -> repeat with segment-(N+1)

segments -> invertlinks -> LinkDb/current
CrawlDb + optional LinkDb + segments -> indexing filters/writers -> external index
```

This is **generational** in two different senses:

* each selected batch receives a timestamp-like segment name; and
* each CrawlDb update writes a new MapFile tree, then replaces `current`, keeping
  the former tree as `old` by default. [S04][S05]

**INFERENCE (high):** Segments function like durable evidence/envelopes and
CrawlDb like a compact materialized view over that evidence. They are not a
fully event-sourced log: updates can purge records; segment retention is an
operator choice; and CrawlDb reduction merges away detailed history.

### 1.2 URL state machine

`CrawlDatum` distinguishes durable database states (unfetched, fetched, gone,
temporary/permanent redirect, not modified, duplicate, orphan and parse failed),
transient fetch outcomes, and intermediate records such as linked URLs,
signatures and parse metadata. `updatedb` groups all records by URL, takes the
latest old/fetch record, incorporates link/parse/signature records, runs the
fetch schedule, updates score, removes the generation marker and emits one new
database datum. [S05]

**FACT (high):** Newly parsed outlinks become `STATUS_LINKED` intermediates;
if additions are allowed and no old row exists, update initializes a schedule,
sets an initial score through scoring plugins and persists the URL as unfetched.
[S05]

**FACT (high):** A successful response can become `db_notmodified` either from
HTTP not-modified or from equal old/new signatures. Default and adaptive
fetch-schedule implementations determine the next fetch time/interval. [S05][S09]

**UNKNOWN:** There is no documented invariant that every retained segment has
been folded exactly once into CrawlDb. Passing a segment to `updatedb` again is
possible. The reducer tends to select latest records, but custom scoring and
metadata plugins may not all be replay-idempotent.

## 2. Frontier generation, scoring and filters

### 2.1 Selection

Generator reads all of `CrawlDb/current` through MapReduce. Its selector can
reject a URL because of URL filters, fetch schedule, an existing generation
marker, a JEXL expression, database status, minimum score, or fetch-interval
threshold. Remaining records receive a sort value from the configured scoring
filter chain and are sorted descending within reducer partitions. Selection is
bounded by overall `topN`, maximum count per host/domain and maximum number of
segments. [S04][S09]

The scoring extension point spans the crawl lifecycle: injected/initial score,
generator sort value, score transfer around parsing, score distribution to
outlinks, CrawlDb update, orphan handling and index-time score. Filters are
ordered/chained plugins rather than a single baked-in ranking function. [S07]

URL policy is likewise pluggable and applied at multiple scopes (injection,
generation, fetch, outlink, CrawlDb, LinkDb, index). Normalization and filtering
are separate extension points. [S04][S08]

**INFERENCE (high):** The generator is a periodically rebuilt priority frontier,
not a heap with atomic pop. Its strengths are deterministic bulk policy and
large sequential scans; its costs are scan/shuffle latency and coarse freshness.

**INFERENCE (medium-high):** `topN` is a partition quota, not necessarily an
exact global top-N. Current source divides `topN` by reducer count while URLs are
partitioned by host/domain/IP. A partition with more high-scoring URLs can lose
candidates while another admits lower-scoring ones. This is a deliberate
scalability/politeness trade-off unless only one reducer is used. [S04]

### 2.2 Reservation and overlapping generations

By default, generating twice without an intervening update can produce the same
fetchlist. Optional `generate.update.crawldb=true` runs an extra CrawlDb update
that records a generation timestamp. Generator then suppresses that URL until
normal update removes the marker or `crawl.gen.delay` expires (seven days by
default). CrawlDb lock files serialize the replacement operation. [S04][S09]

**FACT (high):** This marker is a lease-like reservation with expiration, not an
exactly-once claim. It is specifically intended for overlapping generate/fetch/
update cycles. [S09]

**RECOMMENDATION:** Curiosity should adapt this as explicit frontier leases with
`owner`, `leased_at`, `expires_at`, `attempt_id` and compare-and-set completion.
Do not copy the implicit metadata marker or depend on a seven-day global default.

## 3. Partitioning, robots and politeness

### 3.1 Two levels of host ownership

After selection, Generator repartitions URLs by `partition.url.mode` (`byHost`,
`byDomain` or `byIP`) and hash-sorts URLs within each partition. One generated
fetchlist partition is consumed by one fetcher map task. The explicit goal is
to keep a politeness key in one process while dispersing same-key URLs through
the list so other queues can make progress during delays. [S04][S10][S16]

Inside each map task, a feeder fills in-memory queues keyed independently by
`fetcher.queue.mode` (also host/domain/IP). Worker threads round-robin eligible
queues. Each queue tracks in-progress count, next eligible time, crawl delay,
minimum delay, cookie and exception state. Default concurrency is one thread per
queue; raising it changes delay semantics. [S10]

**FACT (high):** Fetch map speculation is disabled specifically for politeness.
Without that, a speculative duplicate task could issue duplicate requests.
[S10]

**INFERENCE (high):** The politeness invariant is local to a fetch task and
segment. It is global only if all work for a politeness key is assigned to one
active task. Concurrent segments/jobs, mismatched partition and queue modes, or
multiple clusters can independently contact the same host.

### 3.2 Robots behavior

Protocol plugins obtain robot rules through crawler-commons. Before fetching a
page, the worker checks deferred-visits state, allow/deny and crawl delay.
Robots denial is recorded as gone-like fetch output. A robots delay greater than
`fetcher.max.crawl.delay` is skipped unless the maximum is disabled; a shorter
delay is raised to the configured minimum. Robots 5xx and 429 responses can
defer the host queue, with bounded retries and delay. Robots redirects are
bounded separately. [S09][S11]

The configuration requires a non-empty product-token agent name and supports
agent description/contact fields. It also offers a robot allowlist that bypasses
robots fetching/rules; the official configuration warns this also bypasses
crawl delay and sitemap detection and should be used only with explicit owner
permission. [S09]

**RECOMMENDATION:** Adopt robots as a first-class, cached policy decision with
source response, parser version, decision time and expiry attached. Preserve
Nutch's fail-bounded behavior, but make legal/owner exceptions auditable and
never expose a casual global bypass.

## 4. Fetch, parse, redirects, retries and deduplication

### 4.1 Fetch and parse pipeline

Each fetcher mapper is internally multithreaded. A protocol plugin returns
status plus optional content. The worker emits URL-keyed `CrawlDatum`, optional
raw content, and—when `fetcher.parse=true`—parse products. Otherwise a separate
ParseSegment MapReduce stage reads content and emits parsed text, metadata,
outlinks and CrawlDb-update records. [S10][S11]

Parsing is plugin-driven (including Tika integrations). Extracted outlinks are
length-bounded, normalized, filtered, optionally constrained to internal or
external scope, capped per page, and deduplicated in-memory before persistence.
Content bytes and total fetch time can be bounded; truncated-content parse
behavior is configurable. [S09][S11]

**FACT (high):** Immediate depth-following exists, but the official configuration
labels it expert functionality and warns that it is unaware of CrawlDb state and
may refetch duplicates. Normal batch discovery via `crawl_parse -> updatedb ->
next generate` is the state-aware path. [S09][S11]

**RECOMMENDATION:** Curiosity should keep discovered links as proposals to the
durable frontier, not recursively fetch by default. A bounded same-site expansion
may be useful only when attached to a request budget and a per-run seen set.

### 4.2 Redirects

Redirects are normalized and filtered and can be followed immediately up to a
configured maximum or recorded as linked targets for a later cycle. A bounded,
time-based in-memory redirect cache can suppress pathological many-to-one
redirects. Representative-URL metadata is carried along redirect chains.
[S09][S11]

**INFERENCE (medium-high):** Nutch intentionally separates URL identity from
content identity: redirect representation metadata assists canonical choice,
whereas later signature dedup determines duplicate content. Curiosity should
model redirect edge, requested URL, final URL and canonical decision separately.

### 4.3 Retry layers

Nutch has at least three distinct retry/containment layers:

1. **Within a fetch task:** protocol `RETRY`, unexpected worker exceptions,
   robots temporary failure, per-queue exponential delay, queue exception caps,
   time/throughput limits and hung-thread shutdown. [S09][S10][S11]
2. **Across crawl cycles:** `updatedb` increments/schedules retry state; below
   `db.fetch.retry.max` (default 3) the URL returns to unfetched, after which it
   becomes gone and receives the gone schedule. [S05][S09]
3. **At compute level:** Hadoop supplies task/job retry and output-commit
   behavior. Nutch disables fetch-map speculation but otherwise relies on the
   deployment's Hadoop semantics. [S10]

Queue exceptions can delay the next request exponentially and eventually purge
the remaining queue for that segment. Fetch timelimit, minimum throughput and
hung-thread checks also drop queued items rather than allowing a mapper to stall
indefinitely; counters expose these losses. [S09][S10]

**INFERENCE (high):** “Dropped from this segment” is not the same as permanently
lost: because no successful fetch update is emitted, CrawlDb can schedule the URL
again, subject to a generation lease. Operators must distinguish deferred,
dropped, retryable and terminal counts.

### 4.4 Duplicate handling

Nutch's durable content dedup is post-fetch. A configurable signature (MD5 is
the default class) is written to CrawlDb. The dedup MapReduce groups fetched or
not-modified rows by signature, optionally within host/domain, retains a winner
according to ordered heuristics (score, fetch time, HTTPS preference and URL
length) and marks other CrawlDb rows `db_duplicate`. Index deletion is a later
clean/index action; segment content is not erased by this marking. [S02][S05][S12]

This differs from local defenses: outlink set dedup and redirect-cache dedup
reduce repeated work within a fetcher but do not establish corpus identity.

**RECOMMENDATION:** Adopt layered dedup semantics with explicit names:
canonical-URL dedup before scheduling, request/lease dedup during execution,
content-fingerprint dedup after parsing, and index-document canonicalization.
Do not overload a single “duplicate” bit.

## 5. Distributed operation and scale

Nutch 1.x maps each durable stage to Hadoop jobs over SequenceFiles/MapFiles.
Generate scans and shuffles CrawlDb, partitions selected URLs into fetcher tasks,
fetch runs one multithreaded mapper per input partition, parse distributes
content parsing, updatedb reduces all events for a URL, LinkDb reduces incoming
links, dedup reduces signatures, and indexing joins URL-keyed products before
calling writers. [S04-S06][S10][S12-S13]

The official site describes Nutch as scalable because it relies on Hadoop data
structures for batch processing. A project-committer architecture presentation
states that all core 1.x data is URL-keyed in Hadoop sequence/map files and that
segments preserve each fetch/parse batch. The historical Nutch design likewise
assigned each domain to one fetch process for politeness and distributed fetch
and query work over commodity machines. [S01][S15][S16]

### Scaling properties

* **Good:** sequential distributed scans, data-local task execution, replayable
  batches, natural URL-key shuffle joins, host-isolated fetch queues, bounded
  worker memory and independently scalable stages.
* **Costs:** a frontier decision can require scanning the entire CrawlDb;
  generate/update/LinkDb are shuffle-heavy; small crawls pay Hadoop startup and
  file overhead; freshness is bounded by cycle duration; per-task queue state
  is ephemeral.
* **Operational knobs:** fetch partitions/nodes, reducers, fetch threads,
  threads-per-queue, queue depth, content limit, topN, URLs per host/domain,
  segment count, fetch timelimit, throughput floor, target bandwidth and
  HostDb-driven delay/count expressions. [S02][S04][S09]

**FACT (high):** Current master targets Hadoop 3.5.0 and Java 17 in CI. This is a
substantial runtime/operations dependency, not merely a storage format choice.
[S03]

**INFERENCE (high):** Nutch scales throughput by making frontier and joins
batch-distributable, at the cost of low-latency responsiveness. Curiosity should
adopt the partition and evidence ideas, not Hadoop as an architectural default.

## 6. Index handoff

Indexing accepts CrawlDb or `-nocrawldb`, optional LinkDb, and one or more
segments. MapReduce groups URL-keyed database status, parsed text/data, content
and inlinks. Indexing filters create/enrich a provider-neutral `NutchDocument`;
scoring filters can alter index score; configured `IndexWriter` plugins perform
add/delete/update/commit/close against Solr, Elasticsearch or other adapters.
The CrawlDb is required for correct score/weight and deletion of gone, redirect
or duplicate rows; LinkDb contributes incoming anchor text. [S02][S13]

This separation is structurally valuable: crawl evidence and scheduling do not
depend on Solr. However, the current `IndexerOutputFormat` deliberately has no
file output and no task commit/abort work; reducers call external writers and
may commit on close. Reduce speculation is disabled, but a crash or Hadoop task
retry can still interact with external writer idempotency. [S13]

**INFERENCE (high):** End-to-end index handoff is adapter-dependent and not one
atomic transaction with CrawlDb/segments. A failed indexing job can have partial
external effects even though its temporary Hadoop path is removed.

**RECOMMENDATION:** Curiosity should hand off immutable, versioned indexing
envelopes through a provider-neutral contract. Each action needs a stable
document ID, source evidence version and idempotency key. Adapter commit tokens
and reconciliation should be explicit; crawling must not wait on serving-index
availability.

## 7. Checkpoints, recovery and failure boundaries

### 7.1 Stronger boundaries

* CrawlDb update acquires `.locked`, writes a random temporary database, waits
  for job success, moves `current` to `old`, installs the temporary tree as
  `current`, and removes the lock. `db.preserve.backup=true` retains `old` for
  manual rollback. Failure cleanup removes temporary output and lock. [S05][S09]
* Generator uses a CrawlDb lock while selecting/updating reservations, writes to
  temporary paths, creates the segment, then deletes temporary data. [S04]
* LinkDb similarly writes a new tree, merges with current when present, and
  swaps directories under a lock, although its `old` tree is deleted after a
  successful install. [S06]
* Completed segment parts give operators durable boundaries between generation,
  fetch, parse and database update. The bundled script can resume manually from
  the relevant command rather than restarting an entire crawl. [S02][S14]

### 7.2 Weaker boundaries and edge cases

* Lock files prevent cooperating writers but are not distributed transactions;
  `-force` can override them.
* Directory renames are only as atomic/durable as the configured Hadoop
  filesystem and cross-path arrangement permit.
* The crawl shell script derives the newest segment by listing/sorting names and
  sequences commands; it does not persist an authoritative run manifest with
  stage attempts and input/output checksums. [S14]
* Fetch intentionally drops remaining work under time, throughput, host-error
  and hung-thread bounds. This is availability-preserving but must be visible in
  counters.
* The bundled script enables Hadoop bad-record skipping for parse after failed
  attempts, so a malformed document need not fail the entire task. This trades
  completeness for progress. [S14]
* Index writes are external side effects with adapter-dependent recovery, as
  noted above.

**INFERENCE (medium):** CrawlDb directory replacement is a practical checkpoint,
not a guaranteed crash-consistent commit across every filesystem failure point.
The previous `old` tree helps, but operator runbooks must validate and choose a
generation after interrupted rename/install.

**RECOMMENDATION:** Add an explicit Curiosity run ledger: run/generation ID,
stage attempt, immutable input set, policy/config digest, expected output,
counter summary, completion marker and supersession relation. Stage outputs
become visible only after manifest commit. Preserve failed evidence separately
from retry scheduling.

## 8. Security and operational boundary

Official Nutch security documentation says the runtime and configuration are
trusted, local/Hadoop access must be restricted, and legacy unauthenticated REST
service access was equivalent to host access (the service is removed in 1.23).
It warns that default capabilities can reach local files and intranet resources,
and that hostile pages can contain links such as local-file URLs. Recommended
controls include disabling `protocol-file`, restrictive URL filters and private-
IP filtering. [S17]

**RECOMMENDATION:** Curiosity must treat every discovered URL, redirect, header,
body, metadata field and index field as untrusted. Enforce scheme allowlists,
DNS/IP checks both before and after resolution/redirect, private-network denial,
response byte/time limits, parser isolation and output sanitization. Nutch's
trusted-config assumption should not leak into a multi-tenant API.

Operationally, useful Nutch signals include stage counters by status/rejection,
bytes and pages, queues, queue exceptions, latency, throughput, filtered URLs,
robots denials, dropped items and dedup counts. [S04][S09-S13]

**RECOMMENDATION:** Preserve reason-coded counters at every admission and loss
point, but attach them to generation and policy digests. A total URL count alone
cannot explain coverage.

## 9. License and clean-room contamination boundary

### Facts

* Apache Nutch source and releases are under the Apache License 2.0. The license
  grants copyright and patent permissions subject to conditions including
  providing the license, marking modified files, preserving notices, and
  carrying applicable NOTICE attributions in distributed derivative works.
  Trademark permission is not granted beyond customary attribution. [S18]
* The download page independently identifies 1.22 distributions as Apache-2.0
  and directs users to the artifact NOTICE file. [S01]

### Boundary for this research

This document records **behavioral and architectural observations only**. No
Nutch source, pseudocode, data structure serialization, tests, configuration
blocks, comments or distinctive implementation expression is copied into
Curiosity. Class and property names appear only as traceable factual references.
The temporary source checkout was read-only and outside the repository.

If Curiosity later chooses direct reuse, linking, adaptation, or redistribution
of Nutch code/plugins, that is a separate legal/engineering decision requiring:

1. component and transitive-license inventory (including binary NOTICE files),
2. preserved Apache headers/NOTICE where applicable,
3. modification notices,
4. patent and trademark review, and
5. architectural isolation as a third-party adapter or service.

**RECOMMENDATION:** Continue clean-room re-expression from requirements in this
report. Do not paste Nutch code into provider-neutral Curiosity contracts. This
is engineering guidance, not legal advice.

## 10. Curiosity decision ledger

| Lesson | Verdict | Curiosity disposition |
|---|---|---|
| Canonical URL scheduling record plus per-generation evidence batches | **ADOPTED** | Separate frontier state from immutable fetch/parse evidence and derived indexes. |
| URL-keyed typed state transitions | **ADAPTED** | Use explicit schemas/events and monotonic attempt IDs rather than Hadoop Writables and overloaded time fields. |
| Host/domain/IP partition ownership for politeness | **ADOPTED** | Use a globally coordinated politeness-key lease, not merely task-local ownership. |
| Pluggable URL filters, normalization, scoring, parsers and index writers | **ADOPTED** | Keep provider-neutral contracts; version every plugin decision and bound plugin execution. |
| Bulk score-based generation with per-host caps | **ADAPTED** | Preserve policy/ranking/caps, but define exact versus approximate selection semantics. |
| Generation timestamp as expiring reservation | **ADAPTED** | Replace with explicit CAS leases and attempt ownership. |
| Parse inline with fetch | **REJECTED as default** | Keep fetch evidence durable before untrusted parsing; permit fused execution only as an optimization with equivalent checkpoints. |
| Immediate recursive outlink following | **REJECTED as default** | Admit links through durable frontier policy; allow only bounded request-scoped expansion. |
| Post-fetch content signatures and winner policy | **ADAPTED** | Maintain separate URL/request/content/document dedup layers and explain winner choice. |
| Hadoop MapReduce/SequenceFile/MapFile runtime | **DEFERRED** | Valuable for very large batch crawls, but not justified as Curiosity's provider-neutral core. |
| Directory naming plus shell order as orchestration state | **REJECTED** | Use a transactional run manifest and stage completion ledger. |
| Direct reducer-to-index side effects | **REJECTED** | Use idempotent handoff envelopes, adapter commit state and reconciliation. |
| Trusted runtime/configuration assumption | **REJECTED** | Curiosity must be secure against untrusted results, URLs and tenant input. |

## 11. Unknowns and proposed checks

| Unknown / risk | Confidence | Bounded check before design commitment |
|---|---:|---|
| Exact idempotency of replaying the same segment through CrawlDb with each enabled scoring/metadata plugin | Low | Run a two-pass fixture and compare full CrawlDb dumps and counters; inspect only the chosen plugins. |
| Crash consistency of `current`/`old` replacement on the production filesystem | Medium-low | Fault-inject before/after each rename and document recovery; do not infer HDFS behavior for object stores. |
| Global politeness under multiple simultaneous generators/fetch jobs | High that core alone does not guarantee it | Run two segments containing one host concurrently and inspect request spacing; require external ownership if overlap is allowed. |
| Exact global ranking quality with multiple Generator reducers | Medium-high that it is quota-approximate | Construct skewed score/host partitions and compare selected set with a true global top-N. |
| Index writer retry/commit idempotency for the selected backend | Low, adapter-specific | Kill reducers around write/commit, retry, then reconcile document counts/versions. |
| Robots cache sharing and expiry across tasks/jobs | Medium-low | Inspect and test the selected protocol plugin and crawler-commons cache path; core fetch queues alone do not answer this. |
| Stable 1.23 behavior | Medium | Re-check against the eventual signed 1.23 release; current observations include snapshot code. |
| Practical scale envelope for Curiosity's corpus and freshness target | Unknown | Benchmark representative host skew, body sizes and recrawl rates; old billion-page claims are not capacity guarantees for current infrastructure. |

## 12. Bounded curiosity pass

Scoring: 1 (low) to 5 (high); priority favors relevance × value × novelty over
cost. Budget was one additional pass after the main synthesis.

| Thread | R | V | N | Cost | Decision/result |
|---|---:|---:|---:|---:|---|
| Is Generator `topN` globally exact? | 5 | 4 | 4 | 2 | **PURSUE.** Source shows reducer-local `topN / reducers` quotas under URL partitioning; documented as an inference and test above. |
| Are index writes covered by Hadoop output commit? | 5 | 5 | 4 | 2 | **PURSUE.** `IndexerOutputFormat` exposes a no-op committer while writers execute external effects; documented as a critical handoff risk. |
| Does partitioning guarantee global politeness? | 5 | 5 | 3 | 2 | **PURSUE.** Guarantee is task/segment-local; overlap remains an explicit unknown/check. |
| Reconstruct obsolete pre-Hadoop WebDB internals | 1 | 1 | 2 | 4 | **CURIOSITY_NO_GO:** historically interesting but not representative of current 1.x. |
| Benchmark Nutch itself at billion-page scale | 3 | 3 | 2 | 5 | **CURIOSITY_NO_GO:** no authorized cluster/data budget; old presentations are not a substitute. |
| Deep review of every parser/index plugin | 2 | 3 | 2 | 5 | **CURIOSITY_NO_GO:** adapter-specific and beyond the architecture decision; defer until provider selection. |
| Reverse engineer Nutch 2.x/Gora | 2 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** caller explicitly needs Nutch architecture for current clean-room lessons; 1.x is the maintained tutorial/release path studied here. |

**Stop condition:** coverage reached for every caller-requested topic; the best
contradictions (global top-N, global politeness and index commit semantics) were
resolved or converted into bounded checks; remaining threads were lower-value or
adapter/environment-specific.

## Sources

All web sources accessed 2026-08-17. Source-code links are pinned to the exact
observed commit where practical. Source inspection was for behavior only.

* **[S01] Apache Nutch, “Downloads.”** Latest release, date and license.
  <https://nutch.apache.org/download/>
* **[S02] Apache Nutch Wiki, “NutchTutorial,” updated 2026-02-17.** Official
  crawl workflow, data structures, commands, dedup and index handoff.
  <https://cwiki.apache.org/confluence/display/NUTCH/NutchTutorial>
* **[S03] Apache Nutch official repository, commit `178c740...`.** Snapshot
  identity and build/runtime versions (`default.properties`, README).
  <https://github.com/apache/nutch/tree/178c7403fa05e62b60eca09777363aeb0c3a112b>
* **[S04] Apache Nutch source, `Generator.java`.** Selection, scoring,
  partitioning, quotas, multi-segment output, generation markers, locks and
  cleanup. <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/java/org/apache/nutch/crawl/Generator.java>
* **[S05] Apache Nutch source, `CrawlDatum.java`, `CrawlDb.java`, and
  `CrawlDbReducer.java`.** URL record/state machine, update merge, retries,
  schedules and `current`/`old` installation.
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/java/org/apache/nutch/crawl/CrawlDatum.java>
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/java/org/apache/nutch/crawl/CrawlDb.java>
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/java/org/apache/nutch/crawl/CrawlDbReducer.java>
* **[S06] Apache Nutch source, `LinkDb.java` and `LinkDbMerger.java`.** Link
  inversion, anchor bounds, merge and installation.
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/java/org/apache/nutch/crawl/LinkDb.java>
* **[S07] Apache Nutch source, `ScoringFilter.java`.** Lifecycle-wide scoring
  extension contract.
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/java/org/apache/nutch/scoring/ScoringFilter.java>
* **[S08] Apache Nutch source, core extension points.** Parser, protocol, URL
  filter/normalizer, scoring, indexing and writer plugin boundaries.
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/plugin/nutch-extensionpoints/plugin.xml>
* **[S09] Apache Nutch source, `nutch-default.xml`.** Official defaults and
  property semantics for scheduling, generation, robots, politeness, retries,
  bounds, parse and signatures.
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/conf/nutch-default.xml>
* **[S10] Apache Nutch source, `Fetcher.java`, `FetchItemQueues.java`, and
  `FetchItemQueue.java`.** Distributed fetch task, local threads/queues,
  throttling, timeout, throughput and error containment.
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/java/org/apache/nutch/fetcher/Fetcher.java>
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/java/org/apache/nutch/fetcher/FetchItemQueues.java>
* **[S11] Apache Nutch source, `FetcherThread.java`.** Robots, protocol status,
  redirects, parsing, signatures, outlink filtering/dedup and output.
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/java/org/apache/nutch/fetcher/FetcherThread.java>
* **[S12] Apache Nutch source, `DeduplicationJob.java`.** Signature grouping,
  survivor heuristics and duplicate status marking.
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/java/org/apache/nutch/crawl/DeduplicationJob.java>
* **[S13] Apache Nutch source, `IndexingJob.java`, `IndexerMapReduce.java`,
  `IndexerOutputFormat.java`, and `IndexWriter.java`.** URL-key join, delete
  behavior, writer boundary and commit semantics.
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/java/org/apache/nutch/indexer/IndexingJob.java>
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/java/org/apache/nutch/indexer/IndexerOutputFormat.java>
* **[S14] Apache Nutch source, `src/bin/crawl`.** Operational sequencing,
  segment discovery, parse bad-record policy and per-round inversion/dedup/index.
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/src/bin/crawl>
* **[S15] Sebastian Nagel, “Web Crawling with Apache Nutch,” ApacheCon Europe
  2014.** Project-committer architecture presentation; triangulates 1.x URL-key
  stores, segments, workflow and Hadoop trade-offs.
  <https://events17.linuxfoundation.org/sites/events/files/slides/aceu2014-snagel-web-crawling-nutch.pdf>
* **[S16] Doug Cutting and Mike Cafarella, “Building Nutch: Open Source
  Search,” ACM Queue 2(2), 2004.** Founders' historical design paper; durable
  WebDB, domain-assigned fetchlists and distributed fetch/index architecture.
  <https://queue.acm.org/detail.cfm?id=988408>
* **[S17] Apache Nutch, “Security.”** Trusted-runtime model, REST history and
  local/intranet information-leakage controls.
  <https://nutch.apache.org/documentation/security/>
* **[S18] Apache Nutch official `LICENSE.txt`, Apache License 2.0.** Primary
  license text and redistribution/trademark conditions.
  <https://github.com/apache/nutch/blob/178c7403fa05e62b60eca09777363aeb0c3a112b/LICENSE.txt>

## Source quality and negative results

The current official tutorial, pinned source and configuration are the primary
basis. The 2014 committer presentation and 2004 founders' paper triangulate the
design intent but are not used to assert current defaults. Search also surfaced
third-party performance papers and obsolete pre-Hadoop WebDB documentation;
these were not used for current behavior because versions and architecture do
not match. No official formal specification of exactly-once segment folding,
global cross-job politeness, or transactional external index commit was found;
those absences are retained as unknowns rather than silently assumed.
