# Quickwit distributed-search architecture: clean-room product research

**Decision frame.** Determine which Quickwit architectural ideas Curiosity
should adopt, adapt, reject, or defer for public-web retrieval, without copying
Quickwit code or collapsing provider-specific behavior into Curiosity's neutral
contracts.

**Baseline and access date.** This study uses the official Quickwit **0.9.0**
documentation selected as current by the documentation site, plus the current
official repository's license, dependency-license inventory, and security
policy. All sources were accessed **2026-08-17**. Main-branch implementation
source was not inspected. Where the live 0.9 documentation contains recently
updated operational material, this report identifies the documented behavior
rather than assuming compatibility with an older binary. [S1][S18][S19]

**Bounded sub-questions.** How do sources become immutable splits? What belongs
to object storage, the metastore, and local disk? How are indexing, compaction,
distributed search, and caches coordinated? What are deletion, retention,
durability, recovery, scaling, security, and license boundaries? Finally, is
Quickwit suitable for a public-web index or for a narrower Curiosity role?

**Evidence labels.** **FACT** is directly supported by cited official material;
**INFERENCE** is clean-room synthesis; **RECOMMENDATION** is a Curiosity design
judgment. Confidence is **High**, **Medium**, or **Low**. Product documentation
is first-party evidence of intended behavior, not an independent benchmark or
formal correctness proof.

## Executive verdict

Quickwit is best understood as an **append-oriented search engine over immutable
index artifacts in shared object storage**. Indexers turn source partitions or
WAL entries into Tantivy-based splits, upload each split, and atomically advance
source checkpoint and split metadata in a metastore. Stateless searchers ask the
metastore which splits matter, assign those splits to leaf searchers using
rendezvous hashing, search them directly from object storage with several cache
layers, and merge the results at a root searcher. Merges, query deletes, and
retention replace or remove whole immutable artifacts rather than offering a
mutable per-document store. [S2-S8]

That shape is compelling for high-volume, time-oriented, mostly immutable
evidence. It is a poor fit for the **primary current-state public-web index**:
Quickwit itself says mutable data and low-latency e-commerce-style search are
not target use cases; it has no caller-assigned document ID or upsert, delete
queries are deliberately slow/rare, BM25 is opt-in, and no supported vector,
learning-to-rank, link-graph, or web-crawl subsystem was found in the reviewed
0.9 documentation. [S1][S6][S7][S15]

| Verdict | Lesson or product role | Curiosity rationale |
|---|---|---|
| **ADOPT** | Immutable, content-addressable-style serving generations separated from compute | Object-backed artifacts make search capacity elastic and recovery less dependent on rebuilding data onto every search node. |
| **ADOPT** | Atomic publication of artifact metadata with source checkpoint | A search generation must become visible only with the exact ingest watermark it covers. |
| **ADOPT** | Metadata-first pruning by time and bounded low-cardinality tags | Avoid opening irrelevant shards before expensive retrieval starts. |
| **ADAPT** | Root/leaf scatter-gather with stable shard affinity | Preserve the pattern, but expose partition coverage, failures, budgets, and cache generation in Curiosity's response contract. |
| **ADAPT** | Split compaction and local split caches | Use immutable replacement and measured cache affinity, but make write amplification, orphan cleanup, and object-store request cost observable. |
| **ADAPT** | Quickwit as an optional **append-only capture/archive search adapter** | It may fit versioned crawl captures, audit/evidence events, or research telemetry if canonical identity, deduplication, authorization, and ranking remain outside it. |
| **REJECT** | Quickwit as Curiosity's authoritative live public-web index | Recrawls, canonical updates, stable IDs, immediate removals, graph signals, hybrid retrieval, and rich ranking are central gaps. |
| **REJECT** | Silent partial distributed results | Quickwit's Elasticsearch-compatible search defaults `allow_partial_search_results` to true; Curiosity should fail closed unless incompleteness is explicitly authorized and reported. [S15] |
| **REJECT** | Treating object storage alone as a restorable index | The metastore is authoritative for split discovery and checkpoints; both planes require coordinated backup and restore testing. [S3][S13] |
| **DEFER** | Lambda overflow search, schemaless ingestion, and broad Elasticsearch compatibility | These increase provider and operational coupling and do not solve Curiosity's core relevance or mutation requirements. [S15][S23] |

**Overall confidence:** **High** for the documented 0.9 architecture and gaps;
**Medium** for production recovery semantics and Curiosity performance because
no deployment, failure injection, or independent benchmark was authorized.

## 1. System shape and ownership boundaries

### 1.1 Services and durable planes

- **FACT (High):** Quickwit separates Searcher, Indexer, Metastore, Control
  Plane, and Janitor services. Searchers execute queries; indexers consume
  sources and create index data; the control plane assigns indexing pipelines;
  the metastore holds index metadata; and the Janitor runs garbage collection,
  delete, and retention tasks. A single binary/image can run one or several
  services, and every node still exposes the REST API and UI and can redirect
  work to the relevant service. [S2][S11]
- **FACT (High):** Durable index data consists of split files in S3 or
  S3-compatible storage, Azure Blob Storage, Google Cloud Storage, or local
  files. Distributed deployments require shared object storage rather than
  local file storage. [S2][S5][S11]
- **FACT (High):** The metastore holds index configuration, split IDs, states,
  document counts, byte sizes, timestamp ranges, tags, source checkpoints, and
  index creation metadata. PostgreSQL is recommended for distributed use;
  file-backed storage is for convenience and cannot safely have concurrent
  writers because it has no locking. [S3]
- **FACT (High):** Local `data_dir` state is operational rather than the final
  search corpus: it contains ingest WAL/queues, in-progress indexing
  directories, merge split cache, delete-task scratch space, and an optional
  searcher split cache. The WAL is truncated after a split is in object storage
  and its metadata is in the metastore. [S10]
- **INFERENCE (High):** Quickwit has three distinct durability domains:
  (1) source or local WAL before publication, (2) immutable split objects, and
  (3) authoritative metastore records that make those objects discoverable.
  “Data is in S3” does not imply it is query-visible, checkpointed, or
  restorable.
- **RECOMMENDATION (High):** Curiosity should model these separately as
  `source_watermark`, `artifact_generation`, and `catalog_generation`, with an
  explicit publication receipt tying all three together.

### 1.2 A split is the serving and maintenance unit

- **FACT (High):** An index is a set of independent splits, each identified by a
  UUID. A split contains an inverted index, optional columnar fast fields, and a
  row-oriented document store according to field mapping. A companion
  `hotcache` captures enough of the split's internal representation to open the
  remote split quickly. [S2][S5]
- **FACT (High):** Split metadata includes whether the split is ready for search
  and, when configured, its minimum/maximum timestamp and low-cardinality tag
  values. Searchers consult this metadata before touching the split. [S2][S6]
- **FACT (High):** Published splits are immutable from the documented indexing
  model's perspective. Compaction groups immature splits and emits a new split;
  delete processing downloads affected splits and uploads replacement splits;
  retention drops complete splits. [S4][S7][S10]
- **INFERENCE (High):** Immutability greatly simplifies concurrent readers and
  cache invalidation: a split ID denotes one stable byte artifact. Mutation is
  moved into catalog replacement and garbage collection, where atomicity and
  orphan handling become the primary correctness risks.
- **RECOMMENDATION (High):** Curiosity should use immutable shard manifests and
  generation fencing. Never overwrite an object in place; publish a complete
  replacement manifest, then asynchronously retire unreachable artifacts after
  a grace period.

## 2. Ingest sources, WAL, and exactly-once boundaries

### 2.1 Supported sources

- **FACT (High):** Quickwit 0.9 documents ingest API, Kafka, Kinesis, Pulsar,
  ad-hoc local/object files, and beta S3-file ingestion driven by SQS
  notifications. Input is fundamentally JSON/NDJSON, with OTLP JSON/protobuf and
  plain text adapters; non-ingest-API sources may run VRL transforms before
  mapping. [S4]
- **FACT (High):** Sources can be added, enabled, disabled, and deleted. Deleting
  a source also deletes its checkpoint. Multiple sources may feed one index.
  Kafka/Pulsar-style partitioned sources can use multiple pipelines scheduled
  across indexers; source partitions are distributed among those pipelines.
  [S4]
- **FACT (High):** S3 notifications and SQS are at-least-once. Quickwit records
  per-file progress in metastore checkpoints and retains deduplication records
  within configurable time/count windows. It recommends a dead-letter queue and
  does not delete successfully consumed source objects. [S4]
- **INFERENCE (High):** File deduplication is source-object deduplication, not
  document-level idempotency. Two files containing the same web capture, or the
  same capture resubmitted after the deduplication window, can still produce two
  documents.

### 2.2 Checkpoint and publication transaction

- **FACT (High):** A source checkpoint maps absolute file paths or source
  partition IDs to offsets/sequence numbers. Quickwit updates the checkpoint in
  the metastore atomically when it publishes a new split. After an indexing
  failure, processing resumes after the last successfully published checkpoint.
  The documentation describes this as exactly-once processing. [S6]
- **FACT (High):** On the write path, an indexer first pushes split data to index
  storage and then publishes metadata in the metastore. On the read path,
  searchers rely on metastore metadata to discover splits. [S2]
- **INFERENCE (High):** The metastore publication is the visibility commit. A
  crash before publication can leave an unreferenced object, but must not expose
  a half-published split or advance its source offset. A crash after publication
  should allow replay to continue after that checkpoint. The official
  architecture explains the intended transaction but does not provide a formal
  proof for every object-store failure interleaving.
- **INFERENCE (High):** “Exactly once” is bounded to Quickwit's consumption of a
  checkpointed source interval. It does not provide global deduplication when a
  producer resends equivalent content as a new source message/request, and it
  cannot derive public-web canonical identity because Quickwit has no stable
  caller-assigned document ID. [S6][S15]
- **RECOMMENDATION (High):** Curiosity ingestion should assign an immutable
  `capture_id` and a stable `canonical_resource_id` before Quickwit. The adapter
  should retain source partition/offset, payload hash, transform version, schema
  version, and published split generation. Retries must be idempotent in the
  authoritative ledger rather than trusting search-engine “exactly once.”

### 2.3 Ingest API and local-WAL risk

- **FACT (High):** Ingest API V2 is the 0.9 default and can distribute indexing
  regardless of which node receives the request. The 0.9 documentation says WAL
  replication is a future capability, not a current one. V1 remains enabled by
  default during migration. [S12][S13]
- **FACT (High):** The ingest API persists accepted records to a local WAL and
  can acknowledge before they are searchable. `commit=wait_for` waits for normal
  publication; `commit=force` forces a split and can be expensive for small
  batches. Queue memory, disk, and request size are bounded, and overload can
  return 429. [S10][S12][S14]
- **FACT (High):** Graceful indexer termination waits for local WAL data to be
  indexed and committed, potentially as long as the largest index commit
  timeout. Operators must configure sufficient termination grace. [S5]
- **INFERENCE (High):** Before split publication, ingest-API durability is tied
  to the receiving/assigned node's local disk. Loss of that disk can lose an
  acknowledged but unpublished batch because WAL replication is absent. Kafka
  or another retained external log offers a stronger replay authority than the
  native API in this version.
- **RECOMMENDATION (High):** Do not use Quickwit 0.9 ingest acknowledgement as
  Curiosity's sole durable receipt. Keep a replicated upstream log/object ledger
  until publication is independently observed. Test kill -9, disk loss, and
  node replacement—not only graceful shutdown.

## 3. Index construction and compaction

### 3.1 Mapping is physical design

- **FACT (High):** Quickwit supports fixed, dynamic, and mixed schemas. Per-field
  settings decide indexed postings, stored payload, fast-field columnar data,
  tokenization, term frequency/positions, and field norms. Phrase search needs
  positions; BM25 needs field norms; aggregations and some range operations need
  fast fields. Original JSON storage is separately configurable. [S5]
- **FACT (High):** A timestamp field adds split-level time ranges. Tag fields add
  values to split metadata only when cardinality remains below 1,000. A
  partition key can keep selected values in separate split lineages, and
  `max_num_partitions` bounds partition explosion by routing excess values to an
  overflow partition. Merges preserve partition isolation. [S5][S8]
- **INFERENCE (High):** A schema flag changes ingest cost, split size, cache
  demand, and available query operators. Dynamic mapping is operationally easy
  but dangerous for arbitrary public-web JSON because hostile or accidental
  field growth can expand dictionaries and fast fields.
- **RECOMMENDATION (High):** Use a strict, versioned Curiosity capture schema.
  Store bounded raw content separately; index an allowlisted projection. Treat
  timestamp, domain/tenant, language, MIME type, safety class, and corpus
  generation as deliberate pruning fields rather than dynamic discoveries.

### 3.2 Flush and merge lifecycle

- **FACT (High):** Each pipeline buffers documents and emits a split when it
  reaches `split_num_docs_target` (default 10 million) or
  `commit_timeout_secs` (default 60 seconds). Timeout-created small splits are
  immature. Lower latency therefore creates more small artifacts and more merge
  work. [S5][S6]
- **FACT (High):** The default stable-log policy groups similarly sized,
  time-close immature splits, normally with merge factor 10 and maximum 12,
  until they reach target size or mature by age (default 48 hours). The
  limit-merge policy bounds a split's merge count; `no_merge` exists but is not
  recommended because too many splits hurt search. [S5]
- **FACT (High):** Recently published/immature splits are cached on indexer disk
  to avoid redownloading them for merges. Defaults are 100 GB and 1,000 splits;
  partitioning can multiply split production and require substantially more
  entries. A split commonly undergoes three or four merges in the documented
  default scenario. [S10][S14]
- **FACT (High):** Ingest V2 shards commits across indexers. On a stopped stream,
  each shard can leave a small tail split that does not meet the normal merge
  factor, so distributed ingest may increase steady-state split count. [S13]
- **INFERENCE (High):** Compute/storage separation does not remove compaction
  locality. Indexers still need scratch disk and object-store bandwidth, and a
  cold cache turns a merge into download plus rewrite plus upload. Partitioning,
  freshness, and query pruning trade against artifact count and write
  amplification.
- **RECOMMENDATION (High):** Curiosity should expose compaction debt: split count
  by size/age/partition, bytes downloaded/uploaded, write amplification,
  publication lag, orphan candidates, cache hit rate, and projected object-store
  request cost. Freshness SLOs must include the compaction cost they induce.

## 4. Distributed search, pruning, and caches

### 4.1 Root/leaf protocol

- **FACT (High):** Any searcher receiving a query acts as root. It fetches index
  metadata, prunes splits, distributes relevant splits among available leaf
  searchers, waits for their results, merges them, and returns the aggregate.
  Search streaming uses the same path but forwards results as leaves produce
  them. [S2][S8]
- **FACT (High):** Split assignment uses rendezvous hashing. Because adding or
  removing searchers changes only a limited fraction of split assignments, it
  supplies stable split/node affinity for caches while still balancing work.
  Searchers are described as stateless and can read any split from shared
  storage; scaling does not move index ownership. [S2][S8]
- **FACT (High):** Timestamp bounds and low-cardinality tags prune splits from
  the plan. Partition keys improve tag pruning by preventing unrelated values
  from being mixed into every split. They are not a separate durable shard
  ownership layer: searchers can still search every split. [S8]
- **INFERENCE (High):** This is scatter/gather over immutable work units, not
  classic data-node sharding. Search capacity is elastic, but one broad query
  can still fan out over a large fraction of the corpus and consume object-store
  bandwidth on every participating searcher.
- **RECOMMENDATION (High):** A Curiosity response must record planned splits,
  pruned splits by reason, leaves contacted, split successes/failures, artifact
  generation, timeout/cancellation, and merge completeness. A plausible top-k
  without this envelope is not trustworthy evidence.

### 4.2 Four cache layers

- **FACT (High):** Searchers have three bounded RAM caches: split footer/
  hotcache (default 500 MB), fast fields (default 1 GB), and partial request
  results (default 64 MB). An optional disk cache stores complete splits and
  evicts with LRU; defaults include up to 10,000 splits, while byte capacity must
  be configured. [S8][S14]
- **FACT (High):** The hotcache is static split metadata used to open remote
  split files; fast-field cache accelerates filters, ranges, aggregations, and
  streams; partial request cache targets dashboard-like requests that differ
  mainly in time bounds; full split cache reduces object-store calls and cost.
  [S8][S14]
- **FACT (High):** Search concurrency is bounded per node (default 100 concurrent
  split searches), request timeout defaults to 30 seconds, aggregation memory is
  shared and capped (default 500 MB per searcher), and aggregation bucket output
  is capped (default 65,000). [S14]
- **INFERENCE (High):** “Stateless” means no unique durable index ownership, not
  no local state. Warmth materially affects latency and cloud cost. Rendezvous
  affinity is valuable only if cache capacity can retain the working set, and a
  newly scaled searcher starts cold.
- **RECOMMENDATION (High):** Curiosity should distinguish correctness-neutral
  cache hints from catalog state. Cache keys must include corpus, split ID,
  schema/ranking generation, query normalization, authorization scope, and
  projection. Report cold/warm latency and object bytes, and prevent tenant data
  leakage through partial-result caching.

### 4.3 Ranking and query boundedness

- **FACT (High):** Quickwit supports Boolean, term, term-set, phrase, phrase
  slop, prefix, wildcard, range, and exists queries, plus snippets and
  aggregations. Leading wildcards are documented as less efficient. Phrase
  prefix may enumerate only the first 50 matching terms, which can omit an
  otherwise valid document. [S16]
- **FACT (High):** BM25 ordering is supported only when field norms were indexed
  and the request explicitly sorts by `_score`; BM25 is disabled by default to
  improve latency. Otherwise sorting uses up to two fast-field criteria plus the
  internal document address as a deterministic tie-breaker. [S8][S15]
- **FACT (High):** Quickwit's internal document ID combines split ID and Tantivy
  doc ID. Callers cannot assign it, and it changes when splits merge. [S8]
- **FACT (High):** The Elasticsearch compatibility layer is explicitly
  incomplete. Bulk ingest supports create only, silently ignores update/delete,
  does not enforce `_id` at-most-once behavior, and directs users to server logs
  for indexing errors. Search defaults `allow_partial_search_results=true`.
  Some unsupported Elasticsearch modes are silently interpreted as another
  supported mode rather than rejected. [S15]
- **INFERENCE (High):** Quickwit provides strong lexical filtering/search over
  append-only data, but its default configuration prioritizes scan/filter/
  analytics latency over relevance ranking. Stable web identity and ranking
  provenance cannot be derived from Quickwit document addresses or raw scores.
- **RECOMMENDATION (High):** Never expose Quickwit query strings directly to
  Curiosity callers. Compile a typed, bounded neutral query; reject leading
  wildcard/regex and excessive Boolean/prefix expansion by policy; explicitly
  request scoring; preserve external canonical IDs as stored fields; and treat
  every compatibility downgrade or partial response as an error unless declared.

## 5. Deletion, retention, and garbage collection

### 5.1 Query deletes are asynchronous rewrites

- **FACT (High):** Quickwit positions query deletes primarily for GDPR-style
  compliance and recommends only a few delete queries per hour or day because
  they are expensive. One task applies to every split created before the task;
  on a large matching corpus it can run for hours. [S7]
- **FACT (High):** Each task receives an increasing operation stamp. Split
  metadata records the latest applied stamp, and several outstanding delete
  predicates can be batched while rewriting a split. New splits start at or
  beyond the task's stamp. [S7]
- **FACT (High):** Deletes apply only when splits are mature. A task can wait up
  to the merge-policy maturation period (48 hours by default) before immature
  splits are eligible. The 0.9 concept page says delete progress cannot currently
  be monitored. [S5][S7]
- **INFERENCE (High):** Delete acknowledgement is task acceptance, not immediate
  search invisibility or physical erasure. Compliance latency includes waiting
  for maturity, downloading every affected split, rewriting/uploading
  replacements, catalog publication, cache turnover, and old-object garbage
  collection.
- **RECOMMENDATION (High):** Quickwit is unacceptable as the sole deletion
  authority for a mutable public-web index. If used for immutable captures,
  Curiosity needs a deny/tombstone layer enforced before result release, plus
  measured logical-removal and physical-erasure watermarks.

### 5.2 Retention is split-granular

- **FACT (High):** Retention uses the configured timestamp field and deletes a
  complete split when `now - split.time_range.end` reaches the retention period.
  Evaluation runs on a configured schedule, hourly by default. Without a policy,
  data is kept forever. [S5]
- **INFERENCE (High):** A single recent event can keep older events in the same
  split until the split's maximum timestamp expires. Time-local split formation
  therefore determines both pruning quality and retention precision.
- **RECOMMENDATION (High):** Curiosity archival generations should have explicit
  legal-retention classes and time-local partitions. Do not use event timestamp
  as a substitute for crawl-policy or legal-hold metadata.

### 5.3 Garbage collection

- **FACT (High):** The Janitor garbage-collects stale staged splits and splits
  marked for deletion; the CLI exposes a dry run and a grace period (default one
  hour). [S2][S17]
- **INFERENCE (Medium):** Grace-delayed GC is the cleanup half of immutable
  publication: abandoned uploads and superseded split objects can remain safely
  until catalog transitions settle. Official user documentation does not fully
  specify all race handling, object-version behavior, or physical-deletion SLA.
- **RECOMMENDATION (High):** Require manifest reachability checks, object-store
  version/lifecycle awareness, dry-run inventory, deletion receipts, and a
  minimum recovery grace. Never let a transient metastore outage define an
  object as unreachable.

## 6. Recovery, availability, and scaling

### 6.1 What recovers naturally

- **FACT (High):** Searchers have no exclusive split ownership. A surviving or
  newly added searcher can read every published split from shared storage, and
  membership plus rendezvous hashing redistributes work without copying index
  data. [S2][S8]
- **FACT (High):** Checkpointed external sources resume after the last published
  offset. Native ingest WAL survives a process restart when its local volume
  survives, and is drained on graceful termination. [S6][S10]
- **INFERENCE (High):** Searcher replacement is mostly a control-plane and
  cache-warm problem. Indexer replacement differs by source: a retained Kafka/
  object source is replayable, whereas unreplicated local WAL is a potential
  single-node loss boundary.

### 6.2 What must be backed up

- **FACT (High):** The 0.9 upgrade guide requires a metastore backup before SQL
  migration and recommends object/index backup when storage is not already
  versioned. Mixed 0.8/0.9 clusters are unsupported; rollback requires restoring
  the metastore backup after all 0.9 nodes stop. [S13]
- **FACT (High):** The file-backed metastore cannot have concurrent writers and
  is read once unless polling is configured. PostgreSQL supports multiple
  metastore service nodes and is the distributed recommendation. Searchers can
  optionally use a PostgreSQL read replica, accepting stale catalog reads; when
  configured they require it at startup and do not fall back to primary. [S3][S14]
- **INFERENCE (High):** A valid disaster-recovery point requires mutually
  compatible metastore state and split objects. Restoring only PostgreSQL can
  reference missing objects; restoring only a bucket can leave live splits
  undiscoverable or resurrect retired data. Object versioning is not itself a
  coherent catalog snapshot.
- **UNKNOWN:** No official 0.9 runbook was found for rebuilding a completely lost
  metastore by scanning split objects, for point-in-time coordinated backup, or
  for validating every referenced object during restore.
- **RECOMMENDATION (High):** Back up the metastore and immutable-object manifest
  at a named publication watermark; restore into an isolated cluster; verify
  every object checksum, split count, source checkpoint, delete opstamp, and
  sampled query; only then cut traffic over. Test loss of PostgreSQL, bucket,
  local WAL, and an entire availability zone independently.

### 6.3 Horizontal scale and remaining singletons

- **FACT (High):** Searchers and indexers scale independently. The sizing guide
  gives a first-party rule of roughly 7.5 MB/s indexing per core, recommends 4
  GB RAM/core for indexers and 8 GB/core for S3-backed searchers, and says
  workload measurement should override these general figures. [S9]
- **FACT (High):** Multiple source partitions/pipelines are required to use many
  indexer cores. The control plane's `cpu_capacity` is advisory, not an enforced
  limit, and work is still scheduled if the cluster lacks sufficient capacity.
  [S4][S14]
- **FACT (High):** Official 0.9 guidance says a cluster has one control plane and
  one Janitor. PostgreSQL-backed metastore services can have multiple nodes, but
  file-backed metastore requires exactly one. A Janitor using query deletes
  should be sized like an indexer. [S9]
- **INFERENCE (High):** The data plane scales horizontally, but control-plane and
  maintenance availability are not uniformly active-active. Search can continue
  over already published metadata during some control-plane interruption, while
  new scheduling, retention, GC, and delete progress may pause.
- **RECOMMENDATION (High):** Curiosity evaluation must distinguish search
  availability, ingestion availability, catalog-write availability, and
  maintenance progress. Alert on each separately; never summarize them as one
  green cluster state.

### 6.4 Operational observability and overload

- **FACT (High):** Quickwit exports Prometheus metrics and official Grafana
  dashboards for indexers, searchers, and metastore queries. Cache metrics cover
  fast fields, file descriptors, partial requests, predicates, full splits, and
  split footers. [S20]
- **FACT (High):** Local split-cache startup scans cached files and can take
  minutes with tens of thousands of splits, potentially conflicting with
  Kubernetes liveness timing. [S10]
- **INFERENCE (High):** Object-store errors, metastore latency, cold caches, and
  split explosion are first-order query-tail drivers. CPU-only autoscaling will
  miss them.
- **RECOMMENDATION (High):** Minimum SLO telemetry should include root/leaf
  latency, planned/completed splits, bytes/range requests by storage, metastore
  generation/latency, queue/WAL bytes and oldest age, commit/publish lag,
  compaction debt, delete/retention lag, cache outcomes, cancellation, and
  partial-result count.

## 7. Security and license boundaries

### 7.1 Transport, identity, and authorization

- **FACT (High):** Current official node configuration documents TLS for REST
  and internal gRPC, optional client-certificate verification (mTLS), certificate
  hot reload, and CA rotation. A separate optional health server is explicitly
  plaintext and unauthenticated and must not be publicly exposed. [S14]
- **FACT (High):** By default Quickwit binds to localhost; distributed operation
  requires an externally reachable address. Every node exposes REST/UI and can
  redirect requests. CORS is configurable but disabled cross-origin by default.
  [S11][S14]
- **FACT (High):** Storage configuration warns against hard-coded credentials
  and recommends provider authentication mechanisms. Kafka supports underlying
  client security settings. [S4][S18]
- **NEGATIVE RESULT:** No documented application-level users, API keys, roles,
  per-index authorization, tenant policy engine, or audit-policy model was found
  in the reviewed 0.9 security/configuration material. mTLS authenticates a
  certificate but does not by itself provide Curiosity's resource-level
  authorization semantics.
- **INFERENCE (High):** Quickwit should be treated as an internal trusted service,
  not a public search endpoint. Its broad query language, admin APIs, UI,
  ingestion, source management, delete tasks, and incomplete compatibility
  behavior create too much authority for untrusted callers.
- **RECOMMENDATION (High):** Place it behind Curiosity's authenticated adapter;
  expose neither REST/UI nor health endpoints publicly; use mTLS internally;
  separate admin and query network identities; authorize corpus and tenant
  before planning; inject mandatory filters server-side; use workload identity
  for object store/PostgreSQL/queues; redact queries and snippets; and bound
  response bytes, regex/wildcard complexity, fan-out, aggregation memory, and
  time.

### 7.2 Results are untrusted

- **FACT (High):** Stored documents, dynamic JSON, snippets, aggregation keys,
  and provider errors originate in ingested external data. Schemaless mode can
  preserve arbitrary fields and values. [S5][S15]
- **RECOMMENDATION (High):** Validate types and size, escape every presentation
  context, never render highlight markup as trusted HTML, prevent formula/log
  injection, and preserve provenance separately from payload. A search hit is
  evidence to evaluate, not authority to execute or expand agent scope.

### 7.3 License and clean-room record

- **FACT (High):** The current official `quickwit-oss/quickwit` repository's
  top-level license is **Apache License 2.0**, copyright 2021–present Datadog,
  Inc. Apache-2.0 grants copyright and patent permissions subject to conditions,
  including license delivery, change notices, retention of notices, and no
  general trademark grant. [S21]
- **FACT (High):** The repository maintains a large third-party license inventory
  with components under many licenses. The security policy directs private
  reports to Datadog security and says deployers remain responsible for their
  environments. [S19][S22]
- **INFERENCE (High):** The top-level Apache-2.0 label does not determine the
  obligations of every binary, optional feature, container layer, tokenizer, or
  transitive asset. Historical search results may mention older Quickwit
  licensing; they are not evidence for the current official repository artifact.
- **RECOMMENDATION (High):** Architectural patterns may be independently
  re-expressed. Do not copy source, tests, documentation prose, schemas, or
  configuration wholesale. If Curiosity embeds, modifies, or redistributes an
  actual Quickwit build, review the exact release tag, top-level license,
  third-party inventory, image contents, notices, patents, and trademarks with
  counsel. This report is not legal advice.
- **Clean-room record:** Only public official documentation and repository
  governance/license files were used. No Quickwit implementation source was
  inspected, executed, translated, or copied; no private endpoint or dataset was
  accessed; no compatibility implementation is specified here.

## 8. Fit for public-web search and Curiosity

### 8.1 Public-web requirement matrix

| Requirement | Quickwit evidence | Fit verdict |
|---|---|---|
| Append immutable captures at high volume | Native strength: checkpointed sources, object-backed immutable splits, independent index/search scale. [S1-S6] | **ADAPT** for capture history or event ledger. |
| Current canonical page per URL | No caller ID, upsert, or mutable document; internal ID changes on merge. [S8][S15] | **REJECT** as current-state authority. |
| Frequent recrawl/update | Product says mutable data is a “when not to use” case. Query deletes are slow rewrites. [S1][S7] | **REJECT** for primary serving index. |
| Prompt legal/robots removal | Delete can wait for split maturity and hours of rewrite; progress visibility is weak. [S7] | **REJECT** without external tombstone gate. |
| Lexical retrieval/snippets | Terms, Boolean, phrase, prefix/wildcard, BM25, snippets, fast-field filters are present. [S8][S15][S16] | **ADAPT** for bounded lexical archive search. |
| Typo tolerance, language breadth | Limited documented tokenizers/stemming; no reviewed typo/fuzzy contract; phrase-prefix expansion can truncate. [S5][S16] | **GAP**; evaluate externally. |
| Dense/vector and hybrid retrieval | No supported 0.9 vector/ANN/hybrid feature was found in official user docs. | **GAP / DEFER**; separate retriever required. |
| Link graph, anchor aggregation, PageRank | No crawler, canonicalizer, link graph, or graph-ranking subsystem was found. | **GAP**; separate owned pipeline required. |
| Learning-to-rank/reranking | No supported LTR/model/rerank contract was found; ranking is BM25 or fast-field sorting. [S8][S15] | **GAP**; Curiosity ranking funnel remains external. |
| Stable pagination/provenance | Search-after/scroll exist, but engine document IDs change on merge. [S8][S15] | **ADAPT** using external capture IDs and immutable generation pinning. |
| Elastic read compute over cold history | Stateless searchers, split affinity, object storage, and layered caches are a strong match. [S2][S8] | **ADOPT pattern**; benchmark tails/cost. |
| Tenant authorization | Tag/partition pruning exists; no documented RBAC. [S8][S14] | **REJECT as security boundary**; enforce externally. |

### 8.2 Narrow role that could fit

**RECOMMENDATION (Medium):** If Curiosity needs inexpensive lexical access to
immutable historical evidence, evaluate Quickwit as a replaceable adapter for
one of these bounded roles:

1. **Versioned web-capture archive:** one immutable document per capture, with
   externally assigned capture/canonical IDs, crawl timestamp, domain, language,
   MIME type, content hash, safety class, and storage provenance.
2. **Retrieval audit/event index:** immutable query, candidate, decision, and
   evidence events under strict privacy and retention policy.
3. **Operational search:** Curiosity's own logs/traces, which match Quickwit's
   explicit target workload and must remain isolated from the retrieval corpus.

Even in the archive role, Quickwit should not decide canonical freshness,
deduplicate captures, enforce legal deletion alone, crawl URLs, compute links or
embeddings, or produce final Curiosity rank. The adapter should return bounded
lexical candidates plus explicit completeness and generation metadata.

### 8.3 Provider-neutral contract lessons

**ADOPT:**

- immutable artifact manifests and stable artifact IDs;
- atomic source-watermark plus publication-generation commit;
- metadata pruning before shard open;
- distinct indexing, searching, catalog, and maintenance capacity;
- cache affinity as an optimization, never ownership;
- logical deletion, physical deletion, and retention as separate watermarks.

**ADAPT:**

- root/leaf search into a neutral fan-out plan carrying hard limits;
- split/tag partitioning into versioned virtual partitions, with overflow
  explicitly reported rather than silently mixing security domains;
- merge policy into measurable compaction budgets;
- partial responses into an opt-in policy with partition-level evidence;
- external source checkpoints into immutable Curiosity ingest receipts.

**REJECT:**

- engine-internal document addresses as public identity;
- mutable current-state semantics simulated by repeated append plus slow delete;
- raw Elasticsearch/Quickwit syntax in the public API;
- dynamic schema over arbitrary web payloads;
- search-engine tags as the sole authorization mechanism;
- “shared object storage” as a complete backup/recovery claim.

**DEFER:**

- choosing Quickwit as an archive adapter until recovery, delete SLA, cold-tail
  latency, relevance, and total object-store cost pass the checks below;
- Lambda leaf offload, because it is AWS-specific and adds deployment/IAM/cold
  start behavior without addressing the primary-fit gaps;
- any source-level reuse or compatible reimplementation.

## 9. Checks required before any adoption

| Check | Evidence to collect | Pass / stop criterion |
|---|---|---|
| Publication atomicity | Fault injection before upload, between upload/catalog publish, and after checkpoint | No visible partial split, no skipped source interval, bounded orphan cleanup, deterministic receipt. |
| WAL durability | Kill process, lose pod, lose volume, lose zone with accepted uncommitted data | Curiosity's upstream ledger recovers every accepted capture; Quickwit loss boundary is documented. |
| Metastore DR | Restore catalog plus versioned object store into an empty cluster | Every referenced object verifies; no missing/resurrected split; checkpoints, deletes, and retention match. |
| Search completeness | Fail leaf, object GET, metastore/read replica, and root during broad queries | Fail closed by default; authorized partial mode reports exact failed splits and generation. |
| Cold/warm performance | Real capture sizes, token distributions, snippets, filters, aggregations | p50/p95/p99 and object requests/bytes meet SLO in cold, warm, scale-out, and cache-churn states. |
| Relevance | Curiosity judgments: BM25 fields/boosts versus current baseline | Target nDCG/recall achieved without hidden truncation; scores and profile version retained. |
| Query boundedness | Leading wildcards, regexes, short prefixes, broad time ranges, deep Boolean, high-cardinality aggs | Every request stays inside CPU/RAM/time/fan-out/byte limits; cancellation reaches leaves. |
| Stable identity | Merge repeatedly while paginating and retrieving captures | External capture ID/provenance remains stable; no reliance on split/doc ID. |
| Delete compliance | Delete fresh and mature captures across hot/cold caches and versioned object storage | Search blocking is immediate at Curiosity gate; logical and physical erasure meet separate SLAs. |
| Compaction | High partition count, low ingest rate, indexer churn, cold merge cache | Split count and write amplification converge; scratch disk and object cost remain bounded. |
| Tenant isolation | Direct API attempts, forged tag filters, cache crossover, admin endpoints | Gateway and mandatory filters prevent cross-scope access even if Quickwit is reached indirectly. |
| License/SBOM | Exact image/release inventory and distribution plan | Apache and all third-party obligations accepted; no stale historical license assumption. |

## 10. Unknowns and negative results

- **UNKNOWN (High relevance):** Formal consistency guarantees for concurrent
  metastore readers, especially a configured stale PostgreSQL read replica, and
  whether a response identifies the catalog generation it planned against.
- **UNKNOWN:** Exact search response semantics and diagnostics for every root,
  leaf, split, timeout, and object-store failure outside the documented
  Elasticsearch `allow_partial_search_results` switch.
- **UNKNOWN:** A supported, end-to-end metastore-plus-object-store backup and
  restore protocol, including point-in-time coordination and full catalog-loss
  reconstruction.
- **UNKNOWN:** Physical erasure timing with object-store versioning, replication,
  provider lifecycle rules, caches, and backups after query delete or retention.
- **UNKNOWN:** Formal object publication/garbage-collection invariants under
  crashes and eventually delayed provider operations; user docs describe the
  workflow, not a proof.
- **UNKNOWN:** Independent p95/p99 search latency, recall, ingest throughput, and
  total object-store cost for a Curiosity-shaped web corpus. Official sizing is
  guidance, not an independently reproduced benchmark.
- **UNKNOWN:** Whether current official binaries matching the live 0.9 docs
  include every recently documented TLS/read-replica behavior; verify the exact
  release artifact before deployment.
- **NEGATIVE RESULT:** No stable caller-assigned document ID, update, or upsert
  capability was found; the compatibility bulk API explicitly lacks them.
- **NEGATIVE RESULT:** No supported vector/ANN, hybrid rank fusion, LTR, neural
  reranking, web crawler, canonicalizer, or link-graph ranking subsystem was
  found in the reviewed 0.9 user documentation.
- **NEGATIVE RESULT:** No documented application RBAC/API-key/per-index
  authorization layer was found; TLS/mTLS and deployment isolation are the
  evidenced controls.
- **NEGATIVE RESULT:** No independent benchmark was pursued; first-party scale
  and throughput statements were not generalized to Curiosity.

## 11. Bounded curiosity pass

Scoring is 1–5 for relevance (R), decision value (V), novelty (N), and research
cost (C). Only high-value, in-frame threads were pursued.

| Thread | R/V/N/C | Decision |
|---|---:|---|
| Verify split-search/cache distribution beyond architecture overview | 5/5/3/1 | **Pursued:** querying and node-config pages corroborate root/leaf, rendezvous affinity, four caches, limits, and timeout. |
| Distinguish source exactly-once from native ingest durability | 5/5/4/2 | **Pursued:** checkpoint, ingest-V2, WAL, and upgrade pages show atomic source publication but unreplicated local WAL. |
| Determine whether Quickwit can support live web identity/update | 5/5/3/1 | **Pursued:** internal ID and compatibility docs explicitly rule out custom ID/upsert semantics. |
| Find coordinated backup/full metastore rebuild runbook | 5/5/4/3 | **Pursued to saturation:** upgrade docs require separate backups, but no complete restore/rebuild procedure was found; retained as unknown. |
| Inspect implementation to prove object/catalog atomicity | 4/5/4/5 | **CURIOSITY_NO_GO:** source-level proof exceeds the clean-room documentation frame and caller did not authorize fault-injection evaluation. |
| Reproduce performance/scale claims | 4/5/2/5 | **CURIOSITY_NO_GO:** no deployment or dataset authority; Curiosity-specific benchmark is the required next step. |
| Reverse-engineer cache keys or partial-result internals | 3/4/4/5 | **CURIOSITY_NO_GO:** behavior should be tested through public interfaces; code tracing would not change the current fit verdict. |
| Investigate Datadog private roadmap/hosted controls | 2/2/3/5 | **CURIOSITY_NO_GO:** private, unavailable, and not needed for the open 0.9 architecture decision. |

**Stop reason:** Every declared category is covered, material contradictions and
negative findings are recorded, and further work requires executable evaluation
or private/product-roadmap access. Evidence saturated for the decision that
Quickwit is an instructive immutable-search architecture and, at most, a
candidate archive adapter—not Curiosity's primary live public-web engine.

## Sources

All sources are official primary sources accessed **2026-08-17**.

- **[S1]** Quickwit, “What is Quickwit?” (0.9.0), including target and non-target
  use cases: <https://quickwit.io/docs/overview/introduction>
- **[S2]** Quickwit, “Architecture” (0.9.0), services, splits, storage,
  metastore, root/leaf search, control plane, and Janitor:
  <https://quickwit.io/docs/overview/architecture>
- **[S3]** Quickwit, “Metastore configuration” (0.9.0), metadata contents,
  PostgreSQL, file-backed limitations, and polling:
  <https://quickwit.io/docs/configuration/metastore-config>
- **[S4]** Quickwit, “Source configuration” (0.9.0), source types, SQS file
  deduplication, pipelines, formats, and transforms:
  <https://quickwit.io/docs/configuration/source-config>
- **[S5]** Quickwit, “Index configuration” (0.9.0), field roles, partitioning,
  split targets, merge policies, and retention:
  <https://quickwit.io/docs/configuration/index-config>
- **[S6]** Quickwit, “Indexing” (0.9.0), immutable splits, merge lifecycle,
  source checkpoints, and atomic publication:
  <https://quickwit.io/docs/overview/concepts/indexing>
- **[S7]** Quickwit, “Deletes” (0.9.0), operation stamps, rewrite cost,
  maturity delay, and monitoring limitation:
  <https://quickwit.io/docs/overview/concepts/deletes>
- **[S8]** Quickwit, “Querying” (0.9.0), pruning, partitioning, caches, BM25,
  and unstable document IDs:
  <https://quickwit.io/docs/overview/concepts/querying>
- **[S9]** Quickwit, “Cluster sizing” (0.9.0), service scaling, resource
  guidance, service counts, and PostgreSQL HA:
  <https://quickwit.io/docs/deployment/cluster-sizing>
- **[S10]** Quickwit, “Data directory” (0.9.0), WAL, indexing/delete scratch,
  merge/search caches, and startup scan:
  <https://quickwit.io/docs/operating/data-directory>
- **[S11]** Quickwit, “Deployment modes” (0.9.0), service composition,
  cluster storage, redirects, and file-metastore limitation:
  <https://quickwit.io/docs/deployment/deployment-modes>
- **[S12]** Quickwit, “Ingest API” (0.9.0), V2 distribution and future WAL
  replication: <https://quickwit.io/docs/ingest-data/ingest-api>
- **[S13]** Quickwit, “Upgrade” (0.9.0), metastore/object backups, non-rolling
  migration, Ingest V2 split tails, and rollback:
  <https://quickwit.io/docs/get-started/upgrade>
- **[S14]** Quickwit, “Node configuration” (0.9.0), TLS/mTLS, health server,
  ingest limits, search caches/concurrency/timeout, and metastore read replica:
  <https://quickwit.io/docs/configuration/node-config>
- **[S15]** Quickwit, “Elasticsearch compatible API” (0.9.0), incomplete
  compatibility, create-only bulk, no IDs, partial search, sorting, scrolling,
  and supported query DSL:
  <https://quickwit.io/docs/reference/es_compatible_api>
- **[S16]** Quickwit, “Query Language Reference” (0.9.0), Boolean/term/phrase/
  wildcard/range behavior and prefix truncation:
  <https://quickwit.io/docs/reference/query-language>
- **[S17]** Quickwit, “Command-line options” (0.9.0), split states and Janitor
  garbage collection: <https://quickwit.io/docs/reference/cli>
- **[S18]** Quickwit, “Storage configuration” (0.9.0), supported object stores,
  checksums, provider settings, and credential warning:
  <https://quickwit.io/docs/configuration/storage-config>
- **[S19]** Quickwit official repository, `SECURITY.md`:
  <https://github.com/quickwit-oss/quickwit/blob/main/SECURITY.md>
- **[S20]** Quickwit, “Monitoring with Grafana” and metrics reference (0.9.0):
  <https://quickwit.io/docs/operating/monitoring> and
  <https://quickwit.io/docs/reference/metrics>
- **[S21]** Quickwit official repository, current Apache License 2.0:
  <https://github.com/quickwit-oss/quickwit/blob/main/LICENSE>
- **[S22]** Quickwit official repository, third-party license inventory:
  <https://github.com/quickwit-oss/quickwit/blob/main/LICENSE-3rdparty.csv>
- **[S23]** Quickwit, “Lambda configuration” (0.9.0), AWS-only overflow leaf
  search and offload threshold:
  <https://quickwit.io/docs/configuration/lambda-config>
