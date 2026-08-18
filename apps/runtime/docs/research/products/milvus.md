# Milvus Distributed: clean-room architecture dossier

**Decision frame:** Which Milvus design patterns should Curiosity adopt, adapt,
reject, or defer for an owned, bounded retrieval store, and what would have to be
validated before Milvus itself became a production dependency?

**Snapshot and boundary:** Official Milvus documentation and repositories were
accessed 2026-08-17. Documentation was pinned to `milvus-io/milvus-docs` commit
`1a8032447c7621d4ff1d05eddae116de2127df95` (2026-08-11), and the Milvus source
repository HEAD observed for license provenance was
`167f37f80de68284535e55c017f788df629e6dfd`. This dossier focuses on **Milvus
Distributed's contemporary 2.6 architecture**: Proxy, consolidated Coordinator,
Streaming Node, Query Node, Data Node, and shared storage. Older pages describing
separate Root/Data/Query coordinators or QueryNode shard leaders are used only
where the current docs have not replaced the underlying concept, and are labeled.
Milvus Lite, Zilliz Cloud, benchmarks, and unreleased/private internals are out of
scope [S1][S2][S15].

No service was deployed, queried, benchmarked, decompiled, or traffic-inspected.
No source code was copied. Public documentation and license files were read as
primary evidence. Vendor performance and durability statements are representations,
not independently verified results.

## Executive verdict

Milvus is a **shared-storage, log-driven, segment-oriented distributed vector
database**. Writes are sharded into virtual channels, ordered and durably appended
to WALs owned by Streaming Nodes, made searchable from growing segments, and later
flushed as immutable sealed segments into object storage. Data Nodes build per-field,
per-segment indexes and compact historical data. Query Nodes search sealed segments;
Streaming Nodes search growing data and delegate historical work; Proxies perform the
final distributed top-k reduction. Etcd holds strongly consistent control metadata,
registration, and checkpoints rather than bulk vector data [S1][S2][S3].

**Curiosity decision: ADAPT the architecture patterns; DEFER Milvus as a runtime
dependency (medium-high confidence).** Adopt immutable segment generations,
write-ahead recovery, explicit freshness/consistency frontiers, filter bitsets, and
hierarchical bounded top-k merge. Adapt Milvus's shared-storage and index-pluggability
ideas behind provider-neutral contracts. Reject treating approximate ANN scores as
evidence quality, assuming logical deletion means erasure, or using default bounded
staleness for workflows that require read-your-write evidence. Defer product adoption
until representative recall/latency, failure recovery, object-store cost, backup/DR,
upgrade, and security-default checks are executed under separate authority.

**Overall confidence:** high for the documented component boundaries, normal write/
query path, consistency levels, filter execution, index families, security switches,
and Apache-2.0 license; medium for failure sequencing and compaction details; low for
exactly-once behavior, cross-shard transaction semantics, worst-case failover windows,
and behavior under correlated storage/control-plane failure.

## 1. Bounded questions and answers

| Question | Finding | Status / confidence |
| --- | --- | --- |
| What is the unit of distribution? | A collection chooses shards; each shard maps to a virtual channel, virtual channels map to physical WAL channels, and a physical channel is bound to a Streaming Node. Historical placement is by sealed segment. | **FACT / high** [S2][S3] |
| When is a write durable and searchable? | The documented durability point is WAL commit; growing data is queried before object-store flush, subject to the selected consistency frontier. Flush/index completion is not the visibility boundary. | **FACT / high** [S1][S2][S5] |
| How is global search performed? | Proxy fans out by shard; each Streaming Node searches growing data and delegates sealed-segment work to Query Nodes; results reduce at Query Node, Streaming Node, then Proxy. | **FACT / high** [S1][S2] |
| How are scalar predicates combined with ANN? | The predicate is planned per segment into a bitset that constrains ANN. Standard mode filters first; iterative mode alternates ANN candidates and expensive predicate evaluation until top-k fills. | **FACT / high** [S7][S8] |
| What provides consistency? | TSO-ordered messages, synchronization/service timestamps, and a request GuaranteeTs. Strong, bounded-staleness (default), session, and eventual map to different frontiers. | **FACT / high** [S3][S5] |
| What is persistent where? | Object storage holds field/log snapshots and indexes; etcd holds control metadata and checkpoints; WAL storage retains ordered changes. Worker local memory/disk is serving cache/working state. | **FACT / high** [S1][S2][S12] |
| Are deletes immediate physical erasures? | No. A delete becomes a timestamped logical exclusion represented by delete logs/bitsets; compaction rewrites live data and GC later removes dropped segments. | **FACT / high** [S8][S9] |
| Is HA equivalent to DR? | No. Worker/replica failover and coordinator active-standby address node failure; backup and single-primary CDC address separate failure domains. CDC failover can lose unreplicated data. | **FACT / high** [S11][S13][S14] |
| Is the system fully transactional? | Current docs promise ordered messages and basic atomic writes at virtual-channel level, but do not establish serializable, atomic multi-shard transactions. | **FACT + negative result / medium-high** [S3] |

## 2. Architecture and service responsibilities

### 2.1 Four layers

1. **Access — Proxy. FACT (high):** Stateless Proxies validate requests, use routing
   caches, fan out work, and aggregate MPP results. An external load balancer provides
   a stable address. Because the Proxy performs the final reduction, adding workers
   does not remove all coordinator/merge pressure from a large fanout [S1].
2. **Control — Coordinator. FACT (high):** Exactly one Coordinator is active at a
   time. It owns DDL/DCL and timestamp/time-tick management, binds WALs to Streaming
   Nodes, publishes query routing views, balances Query Nodes, and schedules compaction
   and index work to Data Nodes [S1]. The current architecture consolidates services
   that older pages call RootCoord, DataCoord, QueryCoord, and IndexCoord.
3. **Execution — worker nodes. FACT (high):** Streaming Nodes own shard-level WAL and
   growing-state recovery/query; Query Nodes serve sealed historical segments; Data
   Nodes execute offline index building and compaction. They are described as stateless
   because durable truth is external, although they clearly retain reconstructible
   in-memory/cache/working state [S1][S3].
4. **Storage. FACT (high):** Etcd is the strongly consistent metadata, service
   registry, health, and checkpoint store. Object storage (for example S3, MinIO, or
   Azure Blob) stores bulk logs/snapshots and scalar/vector indexes. WAL can use
   Woodpecker, Pulsar, or Kafka; Woodpecker can place log data directly in object
   storage and metadata in etcd [S1][S3][S12].

**INFERENCE (high):** “Stateless worker” means replaceable from WAL, metadata, and
object-store state—not free of state and not instantaneously replaceable. Recovery
time includes WAL reassignment/replay, segment/index fetch, cache warming, and routing
convergence.

### 2.2 Control and failure domains

- **FACT (high):** A WAL is active on exactly one Streaming Node; underlying fencing
  plus the Streaming Coordinator enforces single ownership. During movement, the old
  owner rejects requests while clients wait for the new owner to recover and become
  ready [S3].
- **FACT (high):** The current architecture says exactly one Coordinator is active;
  master/standby can be enabled. The official HA page explains etcd-lease election and
  metadata reload on takeover, but that page is anchored in the older multi-coordinator
  architecture and reports a historical 60-second default lease gap [S1][S11].
- **UNKNOWN:** Current consolidated-Coordinator default election timeout, maximum WAL
  replay time, and whether every accepted client write is deduplicated after ambiguous
  timeout/retry are not stated in the reviewed architecture contract.

## 3. Ingestion, channels, and segment lifecycle

### 3.1 Normal write path

```text
client insert/delete/upsert
  -> load balancer -> stateless Proxy validation
  -> shard routing: collection shard/vchannel -> pchannel
  -> owning Streaming Node assigns/orders by TSO
  -> durable WAL append
  -> write-ahead buffer + growing segment state
  -> searchable according to GuaranteeTs/ServiceTime
  -> flush to immutable sealed segment in object storage
  -> Data Node builds field indexes / compacts
  -> Coordinator handoff and Query Node placement
```

- **FACT (high):** Messages are totally ordered in the WAL by TSO and also carry a
  virtual-channel identity with ordering invariants. The Streaming Service offers
  only “basic” atomic writes at a virtual-channel level [S3].
- **FACT (high):** Growing segments represent data not yet persisted to object
  storage; sealed segments are persisted and immutable. Streaming Nodes slice WAL
  entries into segments and maintain the growing query view [S2].
- **FACT (high):** Each sealed segment has its own indexes. A Data Node reads segment
  log snapshots from object storage, builds in memory, serializes the index, and writes
  it back to object storage [S2].
- **FACT (high):** Upsert override mode is insert-new plus delete-old by primary key,
  not an in-place row mutation [S9]. This aligns with immutable historical segments.

### 3.2 Flush ambiguity and visibility

Two first-party explanations do not fully align:

- Data Processing says a Streaming Node flushes once all available WAL entries for a
  segment are consumed and no pending records remain [S2].
- The glossary and product FAQ describe sealing on capacity/entity threshold, time or
  idle policy, with recent data buffered in growing segments [S9].

**INFERENCE (medium):** Policy chooses a segment to seal (size, memory, or idle time),
then flush completion requires draining its assigned WAL range. The documentation does
not normatively define the complete sealing state machine. This contradiction is
retained rather than silently reconciled.

**FACT (high):** Search visibility is not coupled to manual `flush()`: growing data is
searchable, and Strong consistency can wait for its frontier. Flush changes persistence
and serving form, not the logical visibility contract [S2][S5][S9].

### 3.3 Segment consequences

- Segments bound index-build and compaction work and are the historical scheduling,
  loading, caching, and failure-recovery unit [S1][S2].
- Sealing too frequently creates many small segments, increasing per-segment fanout,
  metadata, load, and merge work; compaction amortizes that debt [S6][S9].
- Growing segments can use temporary/interim indexes in current configurations; they
  should not be assumed to always brute-force. Definitive index-build output still
  belongs to sealed segments [S9].

## 4. Index system and accuracy/resource trade-offs

### 4.1 Vector index families

**FACT (high):** Indexes are field-specific and selected by vector representation
[S6]. The current official matrix includes:

| Data / strategy | Principal index types | Architectural trade-off |
| --- | --- | --- |
| Exact dense | `FLAT`; GPU brute force | Highest recall; linear work and high bandwidth. |
| IVF dense | `IVF_FLAT`, `IVF_SQ8`, `IVF_PQ`, `IVF_RABITQ` | Centroid/bucket pruning; tunable probes; quantization reduces memory at recall cost. |
| Graph dense | `HNSW`, quantized/refined HNSW variants | Low-latency/high-recall profile; graph memory overhead and nontrivial build. |
| Disk-oriented | `DISKANN`, `AISAQ`, mmap-assisted variants | Exceeds RAM by using SSD/object-backed serving cache; sensitive to IOPS and cold starts. |
| Other CPU/GPU | `SCANN`, generic `FAISS`, `GPU_CAGRA`, GPU IVF | Hardware- and workload-specific operational surface. |
| Sparse float | `SPARSE_INVERTED_INDEX` | Posting-list retrieval for sparse embeddings/BM25-style output. |
| Binary | `BIN_FLAT`, `BIN_IVF_FLAT`, `MINHASH_LSH`, `FAISS` | Binary similarity/set-oriented workloads, not interchangeable with dense metrics. |

**FACT (high):** The current index explanation models an ANN index as data structure
+ optional quantizer + optional refiner. Query retrieves an expanded candidate set,
then a refiner recomputes higher-precision distances before final top-k [S6].

**RECOMMENDATION (high):** Curiosity must store index type, metric, build parameters,
search parameters, embedding model/version, dimension, quantization/refiner, and index
generation beside every result set. A distance without this context is not stable or
comparable evidence.

### 4.2 Scalar indexes

- **FACT (high):** `AUTOINDEX` chooses by scalar type. Current matrices expose
  `INVERTED`, `BITMAP`, `STL_SORT`, and Trie across eligible scalar, JSON, and array
  types. Inverted indexing is implemented with Tantivy [S6][S7].
- **FACT (high):** A scalar predicate becomes an AST/physical plan executed inside
  each segment to create a bitset; ANN receives that bitset to exclude nonmatching
  rows [S7][S8].
- **INFERENCE (high):** This is predicate pushdown into every selected segment, not a
  globally centralized relational executor. Segment pruning and partition pruning are
  therefore critical before per-segment predicate work.

## 5. Consistency and ordering

### 5.1 Timestamp mechanism

Every write is TSO-ordered. Consumers advance a synchronization/service timestamp
only when all earlier operations are visible. A query carries or derives a
**GuaranteeTs**; execution waits when ServiceTime has not reached the guarantee [S3][S5].

| Level | Guarantee frontier | Semantics / cost |
| --- | --- | --- |
| Strong | Latest system timestamp | Wait for the newest frontier; lowest staleness, potentially higher latency. |
| Bounded staleness | Earlier tolerated timestamp | Default; trades freshness for latency. The reviewed page does not state a universal numeric bound. |
| Session | Client's latest write timestamp | Read-your-own-writes for that client/session, not global linearizability. |
| Eventual | Very small timestamp | Skip freshness wait and use currently available view. |

**FACT (high):** Consistency can be selected at collection creation and on search or
query [S5]. **UNKNOWN:** The public page does not define the exact bounded-staleness
window under all deployment configurations, nor a formal proof for cross-shard causal
or transaction semantics.

**RECOMMENDATION (high):** Curiosity should expose the actual read frontier and
ingestion checkpoint in retrieval provenance, not only a friendly enum. Newly written
evidence, deletes, and re-embeddings require Session or Strong semantics; exploratory
recall over stable corpora may tolerate bounded staleness.

## 6. Distributed query, pruning, and result reduction

### 6.1 Query path

1. Proxy resolves target shards from its routing view and fans out concurrently.
2. Each targeted Streaming Node generates the plan and searches its growing segments.
3. The Streaming Node delegates sealed-segment work to Query Nodes holding historical
   segments and merges those responses into one shard result.
4. Query Nodes reduce across local segments; Streaming Nodes reduce growing and
   historical candidates per shard; Proxy performs the global reduction [S1][S2].

**INFERENCE (high):** Correct global top-k requires each lower stage to return enough
candidates under a common metric/order; aggressive local truncation can lose globally
competitive items. The docs establish hierarchical reduction but not its complete tie,
rounding, duplicate, or partial-failure contract.

### 6.2 Routing, placement, replicas

- **FACT (high):** Coordinator query views guide routing and balance sealed segments
  across Query Nodes by memory, CPU, and segment count [S1][S2].
- **FACT (medium; older design page):** In-memory replicas load the same segment on
  multiple Query Nodes for throughput and failover. The historical replica page says
  routing caches can become stale and are repaired on errors; a segment absent after
  refresh may have been compacted [S4]. The current Streaming Node architecture moves
  growing-query delegation out of the old QueryNode shard-leader shape, so old node
  names should not be copied into a new design.
- **FACT (high):** Tiered Storage (documented beta for 2.6.4+) can load metadata first,
  fetch fields by chunk and indexes by whole segment on demand, warm selected data,
  and evict cached objects by LRU/watermarks/TTL [S12].
- **INFERENCE (high):** Shared storage improves elasticity but shifts p95/p99 risk to
  object-store GET latency, cache hit ratio, index object size, and synchronized cold
  starts. Replica count alone does not guarantee warm replicas.

### 6.3 Partition and segment pruning

**FACT (high):** Clustering compaction redistributes rows by a clustering scalar and
builds `PartitionStats`, a global mapping from clustering-key ranges to segments.
When segment pruning is enabled and a request constrains that key, irrelevant segments
can be omitted before per-segment search [S10].

**RECOMMENDATION (high):** For Curiosity, tenant/corpus/time-source boundaries should
be explicit partition/pruning keys rather than merely post-ANN filters. This reduces
cost and is a stronger isolation primitive, but authorization must still be enforced
outside the query optimizer.

## 7. Scalar filters and hybrid retrieval

- **FACT (high):** Standard filtering evaluates metadata first, then ANN only over
  matching rows. This is preferable when the predicate is cheap or selective [S7].
- **FACT (high):** Iterative filtering obtains ANN candidates incrementally and tests
  each candidate until top-k valid rows are found. It can avoid evaluating a complex
  predicate over a huge population, but sequential candidate processing can be slow
  when acceptance is rare [S7].
- **FACT (high):** Boolean predicates cover scalar comparison/logical operations, and
  current scalar indexes also support relevant VARCHAR, JSON, and array paths [S6][S7].
- **INFERENCE (medium-high):** Choosing prefilter versus iterative filtering is a
  selectivity-and-cost problem. A safe adapter cannot infer equivalent latency from
  equivalent logical predicates.

**Curiosity implication:** Keep hard authorization/corpus constraints separate from
soft retrieval filters. Parameterize user values rather than concatenating expression
strings; cap expression complexity; record the normalized filter and execution mode;
and test whether filtered ANN preserves required recall for each index family.

## 8. Deletion, compaction, and physical reclamation

### 8.1 Logical delete

**FACT (high):** Delete messages identify primary keys or filter-selected rows. A
timestamped deletion bitset marks excluded rows so ANN/query does not compute them at
the chosen time frontier [S8][S9]. Upsert follows the same append-plus-delete model.
This permits current and time-aware views without mutating immutable segment files.

### 8.2 Compaction and GC

- **FACT (high):** Background compaction merges smaller segments and removes logically
  deleted or TTL-expired rows. It creates new segments and marks predecessors Dropped;
  a later garbage collector removes dropped objects [S9].
- **FACT (high):** Clustering compaction is a separate rewrite organized by a chosen
  scalar key and may be manual or periodic. It updates segment-level pruning stats
  [S10].
- **FACT (medium):** Current configuration exposes level-zero, mix, single-segment,
  and clustering compaction queues/triggers, but the reviewed user architecture does
  not provide one normative end-to-end state machine for all modes [S10].

**INFERENCE (high):** A delete has at least four moments: accepted into WAL, visible
at a consistency frontier, absent from compacted live output, and physically removed
by GC. Backup/snapshot/replica copies add more. “Deleted” is therefore not synonymous
with storage erasure.

**RECOMMENDATION (high):** Curiosity needs tombstone provenance and an auditable
erasure workflow across WAL retention, object versions, backups, replicas, and caches.
Do not promise regulatory deletion from a successful Milvus delete RPC alone.

## 9. Object storage, metadata, and recovery model

| Plane | Durable content | Recovery role | Principal risk |
| --- | --- | --- | --- |
| Etcd metadata | Schemas, topology/service registration, checkpoints, WAL/segment metadata | Reconstruct control state and elect/bind owners | Quorum loss, metadata backup/restore mismatch, lease delay |
| WAL | Ordered DDL/DML messages and pending state | Replay unflushed/recent operations and recover Streaming Node state | Retention, replay lag, ambiguous retries, backend outage |
| Object storage | Segment/binlog snapshots, scalar/vector indexes, intermediate artifacts | Rehydrate Query/Data workers and rebuild serving view | Cold-read latency, request cost, permissions/versioning, correlated outage |
| Worker cache/local disk | Growing state, loaded fields/indexes, temporary build/compaction state | Performance acceleration; reconstructible | Cold start, eviction, disk pressure, cache skew |

**FACT (high):** Woodpecker's documented zero-disk mode stores log data in object
storage and metadata in etcd. Its MemoryBuffer and quorum-buffer modes have different
latency/durability paths; the official benchmark numbers are vendor measurements and
are not relied on here [S3][S16].

**INFERENCE (high):** “Zero disk” removes a separately managed broker disk tier but
does not remove state or failure coupling. It increases the importance of object-store
and etcd configuration, credentials, versioning, lifecycle rules, and restore testing.

## 10. Recovery and operations

### 10.1 Availability layers

- **Worker recovery:** Reassign fenced WAL ownership, replay it, reload sealed objects
  and indexes, then update routing. Additional in-memory replicas can avoid some
  reload delay for Query Node failure [S3][S4].
- **Coordinator HA:** Active/standby election uses etcd. The older HA page explicitly
  says standby metadata is not strongly synchronized and reloads on takeover [S11].
- **Backup/restore:** Milvus Backup reads collection metadata and segment references,
  copies collection objects into a backup root, and recreates a collection plus copied
  data on restore. Its published matrix restricts cross-version restore combinations;
  2.6 backups restore to 2.6 in the reviewed table [S13].
- **Cross-cluster DR:** Milvus CDC forwards WAL changes from one writable primary to
  read-only standbys. Planned switchover waits for catch-up and claims RPO 0; emergency
  failover may lose the current CDC-lag window. Active-active writes are unsupported
  [S14].

### 10.2 Operability

**FACT (high):** Official operations guidance exposes per-component Prometheus metrics
on port 9091 and Grafana dashboards, including time-tick delay, request rates, segment/
binlog size, memory, index and compaction latency [S17]. Logs have configurable levels.

**RECOMMENDATION (high):** Required Curiosity SLO signals include WAL append latency,
TSO/service-time lag, growing bytes/rows, seal/flush age, index backlog, compaction and
GC backlog, segment count/size distribution, query fanout, candidates per reduction
stage, cache hit/miss and cold-fetch bytes, per-filter selectivity, recall canaries,
CDC lag, backup age, and tested restore age. CPU/QPS alone is insufficient.

### 10.3 Required failure checks (not executed)

1. Kill/restart each worker during append, flush, index build, compaction, and query;
   verify no acknowledged row loss, duplicate visibility, or stale-routing omission.
2. Fail the active Coordinator and measure election plus metadata/routing convergence.
3. Interrupt object storage and etcd independently; then test correlated outage and
   credential-expiry behavior.
4. Retry writes across client timeouts with fixed primary keys and verify dedup/upsert
   semantics; do not assume exactly-once.
5. Restore backups into an isolated compatible cluster and compare row counts, schema,
   indexes, deletes, consistency frontiers, and sampled exact-search recall.
6. Exercise CDC catch-up, planned switchover, emergency failover, and old-primary
   fencing; measure observed RPO/RTO and split-brain prevention.

## 11. Security and license

### 11.1 Security posture

- **FACT (high):** Username/password authorization must be explicitly enabled with
  `common.security.authorizationEnabled`; the documented initial account is
  `root`/`Milvus` [S18]. Therefore an unreviewed default deployment must not be assumed
  authenticated, and the initial credential must never survive bootstrap.
- **FACT (high):** RBAC grants privileges/privilege groups to roles over instance,
  database, and collection resources, then grants roles to users [S18].
- **FACT (high):** Proxy TLS supports one-way or mutual authentication for gRPC and
  REST. TLS and user authentication are separate controls [S18]. A separate internal-
  TLS configuration page exists, but the reviewed material is not complete enough to
  claim that every east-west path is encrypted by default; deployment-wide verification
  is required.
- **UNKNOWN:** The reviewed public docs do not establish row-level security, field-level
  masking, KMS-backed application-layer encryption, or a universal at-rest encryption
  guarantee across etcd, every WAL backend, object storage, backups, and local caches.

**RECOMMENDATION (high):** Isolate Milvus on private networks; enable auth, least-
privilege RBAC, external and internal TLS; rotate bootstrap credentials; use workload
identities and KMS-backed storage encryption; protect metrics/admin endpoints; audit
DDL/DCL and reads; enforce tenant boundaries before requests reach Milvus; and threat-
model filter expressions and returned scalar fields as untrusted inputs/data.

### 11.2 License and clean-room boundary

**FACT (high):** The official Milvus repository carries Apache License 2.0 [S15]. It
permits use, modification, and distribution subject to license, notice, changed-file,
attribution, and patent provisions; it does not grant trademark rights. This dossier
contains no Milvus code. Any future reuse must inspect repository `NOTICE`, dependency
licenses, and component-specific repositories (including Woodpecker, SDKs, Backup, and
CDC) rather than assuming the top-level Milvus license covers every deployed artifact.

General patterns—WAL replay, immutable segments, bitset filtering, hierarchical top-k,
and shared object storage—are architectural ideas. Curiosity should implement only
independently designed provider-neutral contracts or integrate Milvus through its
public interfaces, preserve attribution where code is actually reused, and avoid
Milvus/Zilliz marks except for factual compatibility statements.

## 12. Curiosity verdict ledger

| Pattern / claim | Verdict | Confidence | Curiosity rationale |
| --- | --- | --- | --- |
| WAL before visibility/persistence transition | **ADOPT** | High | Gives a precise recovery source and supports recent searchable state. Record append ID/frontier. |
| Growing versus immutable sealed segments | **ADOPT** | High | Separates low-latency ingestion from optimized historical serving and makes generations auditable. |
| Shard/vchannel/pchannel distinction | **ADAPT** | High | Keep logical corpus shards independent of physical queues/workers; do not expose Milvus names in core contracts. |
| Shared object storage with replaceable workers | **ADAPT** | High | Strong elasticity and recovery model, but add explicit cache/cold-start budgets and failure-domain checks. |
| One active consolidated Coordinator | **DEFER** | Medium-high | Operationally simple, but election/reload and control bottleneck need measured SLOs. |
| TSO + GuaranteeTs consistency frontier | **ADOPT concept** | High | Surface concrete ingestion/read frontiers and stop calling every successful insert immediately visible. |
| Bounded staleness default | **REJECT as universal default** | High | Evidence updates/deletes need Session or Strong; stable exploratory corpora may opt in. |
| Per-segment scalar bitsets before ANN | **ADOPT** | High | Efficient hard narrowing; preserve exact predicate, index generation, and selectivity. |
| Iterative filtering | **ADAPT** | High | Useful for expensive predicates, but require candidate/work/deadline caps and telemetry. |
| Pluggable ANN index families | **ADAPT** | High | Select by measured recall/latency/cost; hide provider parameters behind typed profiles without erasing provenance. |
| Approximate distance as relevance/truth | **REJECT** | High | Distance is model/index/query-local and says nothing about source authority or claim support. |
| Multi-level top-k reduction | **ADOPT with checks** | High | Bounded fanout/merge scales, but oversampling, ties, duplicates, partial shards, and determinism must be explicit. |
| Clustering-key segment pruning | **ADAPT** | High | Strong for tenant/corpus/time pruning; compaction cost and skew require measurement. |
| Logical delete + asynchronous reclaim | **ADAPT operationally** | High | Efficient database mechanism; insufficient alone for erasure or provenance policy. |
| In-memory replicas as DR | **REJECT** | High | They improve serving HA only; use tested backup and cross-cluster CDC for DR. |
| Milvus as Curiosity's owned retrieval store | **DEFER** | Medium-high | Plausible candidate; requires authorized workload, security, failure, restore, and total-cost evaluation. |
| Copying current service topology into core domain | **REJECT** | High | Milvus changed coordinator/streaming topology across versions; adapter isolation prevents architecture lock-in. |

## 13. Exact Curiosity implications

1. **Provider-neutral storage contract:** model `corpus`, `logical_shard`, `write_id`,
   `commit_frontier`, `segment_generation`, `index_generation`, `tombstone`, and
   `read_frontier`. Translate these in a Milvus adapter; never leak pchannel/node IDs.
2. **Evidence provenance:** every hit must retain corpus/version, embedding model,
   vector field, metric, index/search profile, scalar predicate, consistency level and
   observed frontier, retrieval time, distance, rank, and whether data was growing or
   sealed when that is observable.
3. **Bounded distributed search:** cap shards, segments/candidates, per-shard top-k,
   oversampling, total merge candidates, bytes of scalar fields, and deadline. Return
   partial-shard/error/completeness metadata rather than silently treating partial
   fanout as complete.
4. **ANN is candidate generation:** rerank and verify with source-quality and
   claim-evidence logic outside Milvus. Never map cosine/L2/IP scores directly to
   confidence or truth.
5. **Hard constraints first:** tenant authorization, corpus allowlists, deletion state,
   and policy filters must be enforced independently and preferably prune partitions/
   segments. Soft topical filters and reranking follow.
6. **Controlled freshness:** use Strong/Session after ingestion, correction, delete, or
   re-embedding workflows; allow bounded/eventual only by explicit workload policy.
   Health checks should compare expected and observed frontiers.
7. **Immutable rebuilds:** build new embeddings/indexes as a new generation, validate
   recall and metadata, atomically move the logical alias, retain rollback briefly,
   then garbage-collect under an auditable retention policy.
8. **Deletion ledger:** distinguish logical exclusion, compacted absence, object GC,
   backup expiry, CDC propagation, and cache purge. Report the slowest outstanding
   stage.
9. **Curiosity-loop separation:** vector retrieval does not authorize new investigative
   branches. Follow-ups require the caller's declared frame, scored gap/contradiction,
   remaining shared budget, and a recorded stop reason.
10. **Adapter/version isolation:** pin server, SDK, schema/index definitions, docs, and
    migration procedure. Milvus 2.x topology changes demonstrate why core retrieval
    behavior cannot depend on component names or undocumented routing.

## 14. Unknowns and required validation

| Unknown | Decision impact | Authorized future check |
| --- | --- | --- |
| Exact client acknowledgement and dedup semantics under timeout/retry | Duplicate or lost writes corrupt evidence lineage. | Fault-injection matrix around WAL append acknowledgement with stable primary keys. |
| Multi-vchannel transaction guarantees | Cross-document generation switch may not be atomic. | Obtain formal vendor/source contract; test only benign isolated batches. |
| Complete segment sealing/flush state machine | Controls index lag, small-segment debt, and visibility transitions. | Trace official metrics/state under bounded ingestion profiles; reconcile docs with maintainers. |
| Current consolidated Coordinator failover bound | Determines control-plane RTO. | Kill active Coordinator in staging and measure election, metadata reload, and routing convergence. |
| Partial distributed-query semantics | Silent omitted shards would invalidate recall/completeness. | Remove/move segments and interrupt one node during search; inspect status and result completeness. |
| Tie, duplicate, score-rounding, and oversampling rules across reductions | Affects deterministic global top-k. | Compare distributed results with exact single-node ground truth on owned synthetic vectors. |
| Filter planner selectivity estimates and standard/iterative choice | Tail latency and recall vary with predicate shape. | Controlled cardinality/skew matrix with fixed ANN ground truth. |
| Index recall and cold/warm p95/p99 on Curiosity vectors | Determines index profile and capacity. | Representative, non-sensitive corpus; exact FLAT baseline; record build/search parameters. |
| Physical erasure across all persistence layers | Compliance and user deletion promises. | Document WAL/object/version/backup/cache retention and verify lifecycle completion. |
| Backup consistency with concurrent writes/deletes | Restore may represent an unclear point in time. | Quiesced versus live backup tests; compare frontiers and restored deletes. |
| CDC schema/index/DDL coverage and failover RPO | Determines real DR envelope. | Compatibility review plus staged switchover/failover with measured lag. |
| Encryption coverage and credential rotation without outage | Security gate. | Deployment-specific threat model and configuration audit; no production probing. |
| Total object-store request/egress and compaction amplification | Can dominate owned-system cost. | Measure GET/PUT/list bytes/requests per ingest, query, rebuild, restore, and failover. |

## 15. Bounded curiosity pass

Scoring is 1 (low) to 5 (high); priority = relevance + decision value + novelty −
cost. Caller authority covered in-frame public-source follow-up only.

| Thread | R/V/N/C | Priority | Outcome |
| --- | --- | ---: | --- |
| Resolve old coordinator/query-leader pages versus current Streaming Node design | 5/5/5/2 | 13 | **Pursued.** Current architecture establishes consolidated Coordinator + Streaming Node; older replica/HA details are explicitly version-qualified [S1][S4][S11]. |
| Determine whether flush gates visibility | 5/5/4/1 | 13 | **Pursued.** Consistency docs and FAQ establish frontier-based growing-data visibility; flush is not the read boundary [S5][S9]. |
| Reconcile flush trigger wording | 4/4/4/1 | 11 | **Pursued.** Current Data Processing and glossary/FAQ differ; likely policy-versus-drain phases retained as inference, not fact [S2][S9]. |
| Verify deletion means physical erase | 5/5/3/1 | 12 | **Pursued.** Bitsets, compaction, dropped segments, and later GC establish delayed physical reclamation [S8][S9]. |
| Separate node HA, backup, and cross-cluster DR | 5/5/4/2 | 12 | **Pursued.** Replica, Backup, and CDC docs establish distinct envelopes; failover can lose CDC-lag data [S4][S13][S14]. |
| Reverse-engineer query scheduler/index kernel source | 3/3/5/5 | 6 | **CURIOSITY_NO_GO.** Not needed for the architecture decision, high cost, and caller prohibited code copying/implementation. Public contracts suffice. |
| Run ANN/compaction/failure benchmarks | 5/5/4/5 | 9 | **CURIOSITY_NO_GO.** Requires deployment and workload authority not granted to this research subagent. Validation plan retained. |
| Analyze Zilliz Cloud proprietary controls | 1/2/3/4 | 2 | **CURIOSITY_NO_GO.** Hosted commercial product is outside the Milvus Distributed frame. |
| Treat current master 3.0 snapshot/storage pages as 2.6 behavior | 3/3/4/1 | 9 | **CURIOSITY_NO_GO.** Version contamination risk; excluded except as evidence that docs are mutable. |
| Audit every transitive dependency license | 3/4/3/5 | 5 | **DEFERRED.** Necessary only if adopting/deploying; top-level Apache-2.0 does not answer the full image/software-bill-of-materials question. |

**Stop reason:** coverage and saturation. Every requested dimension has first-party
evidence, the highest-value version and lifecycle contradictions were pursued, and
remaining material gaps require an authorized deployment, source-level audit, vendor
clarification, or legal/SBOM review.

## Sources

All sources were accessed 2026-08-17. Documentation links are mutable; the pinned
`milvus-docs` commit above is the evidence snapshot.

- **[S1]** Milvus, “Architecture Overview” and “Main Components,”
  <https://milvus.io/docs/architecture_overview.md>,
  <https://milvus.io/docs/main_components.md>; pinned source:
  <https://github.com/milvus-io/milvus-docs/tree/1a8032447c7621d4ff1d05eddae116de2127df95/site/en/reference/architecture>.
- **[S2]** Milvus, “Data Processing,”
  <https://milvus.io/docs/data_processing.md>.
- **[S3]** Milvus, “Streaming Service,”
  <https://milvus.io/docs/streaming_service.md>.
- **[S4]** Milvus, “In-Memory Replica,”
  <https://milvus.io/docs/replica.md>. This is an older-topology conceptual page and
  is not authority for current Streaming Node names.
- **[S5]** Milvus, “Consistency Level,”
  <https://milvus.io/docs/consistency.md> and
  <https://milvus.io/docs/tune_consistency.md>.
- **[S6]** Milvus, “Index Explained,”
  <https://milvus.io/docs/index-explained.md>.
- **[S7]** Milvus, “Filtered Search” and “Scalar Index,”
  <https://milvus.io/docs/filtered-search.md>,
  <https://milvus.io/docs/scalar_index.md>.
- **[S8]** Milvus, “Bitset,”
  <https://milvus.io/docs/bitset.md>.
- **[S9]** Milvus, Product FAQ, delete/upsert documentation, and glossary,
  <https://milvus.io/docs/product_faq.md>,
  <https://milvus.io/docs/upsert-entities.md>,
  <https://milvus.io/docs/glossary.md>.
- **[S10]** Milvus, “Clustering Compaction,”
  <https://milvus.io/docs/clustering-compaction.md>.
- **[S11]** Milvus, “Coordinator HA,”
  <https://milvus.io/docs/coordinator_ha.md>. The page describes the pre-consolidation
  coordinator topology and is used only for the documented election/reload pattern.
- **[S12]** Milvus, “Tiered Storage Overview” (beta, 2.6.4+),
  <https://milvus.io/docs/tiered-storage-overview.md>.
- **[S13]** Milvus, “Milvus Backup,”
  <https://milvus.io/docs/milvus_backup_overview.md>.
- **[S14]** Milvus, “Milvus CDC,”
  <https://milvus.io/docs/milvus_cdc_overview.md>.
- **[S15]** `milvus-io/milvus`, Apache License 2.0 and repository,
  <https://github.com/milvus-io/milvus/blob/167f37f80de68284535e55c017f788df629e6dfd/LICENSE>,
  <https://github.com/milvus-io/milvus/tree/167f37f80de68284535e55c017f788df629e6dfd>.
- **[S16]** Milvus, “Woodpecker,”
  <https://milvus.io/docs/woodpecker_architecture.md>.
- **[S17]** Milvus, monitoring overview, Prometheus setup, and dashboard metrics,
  <https://milvus.io/docs/monitor_overview.md>,
  <https://milvus.io/docs/monitor.md>,
  <https://milvus.io/docs/metrics_dashboard.md>.
- **[S18]** Milvus, authentication, RBAC, and TLS,
  <https://milvus.io/docs/authenticate.md>,
  <https://milvus.io/docs/rbac.md>,
  <https://milvus.io/docs/tls.md>,
  <https://milvus.io/docs/configure_internaltls.md>.
