# Qdrant architecture: clean-room reverse-engineering dossier

**Decision frame:** Which publicly documented Qdrant storage, indexing, query,
and distributed-systems patterns should Curiosity adopt, adapt, reject, or defer
for its owned retrieval substrate?

**Snapshot:** Official Qdrant documentation and the official open-source
repository, accessed 2026-08-17. No hosted account, API key, private interface,
traffic interception, benchmark run, or source-code reuse was involved. This is
clean-room architectural analysis, not a performance certification or legal
advice.

**Boundary:** Qdrant is a vector database, not a crawler, canonical document
store, evidence reasoner, or public-web search engine. This report covers the
server's documented data and query paths. Managed Qdrant Cloud capabilities are
identified separately from self-hosted open source behavior.

## Executive verdict

Qdrant is best understood as a **collection → shard → segment** storage engine.
Points combine stable IDs, one or more dense/sparse/multivector representations,
and JSON payload. Updates become durable in a write-ahead log before they are
applied in sequence-numbered segments. Mutable appendable segments absorb
writes; background optimizers merge segments, build indexes and quantized
representations, and vacuum tombstones while copy-on-write proxies keep reads
available. Dense candidate generation uses per-segment HNSW or exact scans;
payload indexes provide cardinality estimates and filter-aware graph structure.
Sparse retrieval uses a named sparse index, and the Query API can fuse or
re-score bounded candidate sets [S1][S2][S3][S4][S5][S6].

Distributed Qdrant partitions each collection into independent shards and
replicates shard copies. Raft coordinates topology and collection metadata, **not
point data**. Point writes execute across active replicas with caller-selectable
acknowledgement, ordering, and read-consistency controls. The defaults favor
availability and throughput rather than serializable point updates. Snapshots
carry collection data, configuration, and built indexes, but a distributed
backup is a per-node/per-shard operational exercise rather than one globally
atomic archive [S7][S8][S9][S10].

**Curiosity decision — ADAPT as a bounded retrieval component; do not make it the
system of record (high confidence).** Strongly adopt named dense+sparse fields,
payload-indexed hard filters, explicit candidate/fusion/re-score stages,
idempotent stable IDs, and observable background optimization. Adapt Qdrant's
WAL/segment/compaction model behind a revisioned document and evidence ledger.
Reject assumptions that vector score is evidence quality, replication is backup,
Raft makes point writes strongly consistent, or default self-hosting is secure.
Defer quantization, multi-node operation, custom sharding, and advanced formula
ranking until corpus-specific evaluation and operational thresholds justify them.

**Overall confidence:** high for documented contracts and high-level
architecture; medium-high for interactions corroborated by documentation and
the public source layout; medium for inferred physical execution paths; low for
undocumented file formats, crash windows, scheduler policy, and real workload
performance.

## 1. Frame, questions, method, and labels

### 1.1 Bounded questions

1. What are the durability and visibility boundaries from collection through
   shard, WAL, and segment?
2. How do HNSW, payload indexes, cardinality estimation, exact scanning, and
   restrictive-filter traversal interact?
3. Where does quantization save memory or compute, and what quality contract is
   retained?
4. How do updates, deletes, copy-on-write optimization, and vacuuming preserve
   availability?
5. What do sharding, replication, Raft, consistency controls, shard transfer,
   and snapshots actually guarantee?
6. How are dense, sparse, multivector, hybrid, fusion, and re-ranking composed?
7. Which security, observability, operational, and licensing boundaries matter
   to Curiosity?
8. Which lessons are general enough to transfer without copying Qdrant code or
   coupling provider-neutral Curiosity contracts to Qdrant?

### 1.2 Evidence policy

- **FACT** — directly stated in official documentation or observable in the
  Apache-2.0 official repository. Documentation is authoritative for the public
  contract; repository observations are implementation snapshots, not stable
  API guarantees.
- **INFERENCE** — a bounded architectural explanation consistent with facts,
  but not promised as a public contract.
- **RECOMMENDATION** — a Curiosity design or evaluation decision.
- **UNKNOWN** — not established by the reviewed official material.
- Confidence is **high**, **medium**, or **low**.

Material claims are triangulated between concept pages, operations pages, and
the official repository where practical. Vendor benchmark statements are
reported only as vendor statements and are not treated as Curiosity results.

## 2. Architectural map and unit boundaries

```text
collection (logical schema, aliases, vector/payload/index policy)
  └─ shard(s) (horizontal partition; independently queryable point store)
      ├─ WAL / ordered update stream
      └─ segment(s)
          ├─ external-ID ↔ internal-ID map
          ├─ original dense/sparse/multivector storage
          ├─ JSON payload storage
          ├─ vector index (plain scan, HNSW, or sparse inverted index)
          ├─ payload field indexes + cardinality statistics
          └─ optional quantized vector representation

query at any peer
  → route/fan out to relevant shard replicas
  → per-segment plan: filter estimate + indexed traversal or scan
  → segment-local top-k, suppress stale/deleted versions
  → shard/node merge and ID deduplication
  → optional fusion / candidate re-score / formula
  → global top-k projection
```

- **FACT (high):** A collection is a named set of points with collection-level
  vector schema and optimization/index policy. A point may hold multiple named
  vectors, each with its own dimensions, metric, HNSW, quantization, and memory
  configuration. Sparse vector names are separate from dense names [S1].
- **FACT (high):** A distributed collection is partitioned into shards; each
  shard is an independent point store capable of collection operations. Default
  placement uses consistent hashing; user-defined sharding lets the caller
  target shard keys [S7].
- **FACT (high):** A shard's data is divided into segments. Each segment owns
  independent vector/payload stores, vector/payload indexes, and an ID mapper.
  Index configuration is collection-wide even though index instances live in
  individual segments [S2][S3].
- **FACT (high):** A segment may be appendable or non-appendable. Appendable
  segments support add/delete/query; non-appendable segments support read and
  delete. At least one appendable segment exists [S2].
- **FACT (high):** Temporary duplicate point IDs across segments are legal;
  search deduplicates them. Approximate collection counts can include transient
  duplicates, old versions, deleted points, or not-yet-indexed vectors [S1][S2].
- **INFERENCE (medium-high):** This is a log-structured, version-resolved engine
  at segment granularity: mutable deltas accumulate separately from optimized
  immutable-ish bases, and compaction later reconciles physical copies. Qdrant
  does not use that exact public label, but its documented duplicate,
  copy-on-write, merge, and vacuum behavior supports the model [S1][S2][S4].

### Why the boundary matters

Collections are schema and administration boundaries; shards are distribution
and replication boundaries; segments are indexing and compaction boundaries.
Conflating them creates bad operational assumptions. For example, increasing
segment count does not add fault domains, and increasing shard count does not
by itself create replicas or backups.

## 3. WAL, versioning, durability, and visibility

### 3.1 Documented write path

1. **FACT (high):** Every point modification is first appended to a WAL. The WAL
   orders operations and assigns sequential numbers; after WAL persistence,
   Qdrant says the operation survives power loss [S2][S5].
2. **FACT (high):** The update worker then applies operations to segments in
   order. Segments retain the last applied operation version and individual
   points retain versions. An older operation is ignored when its sequence is
   below the point's current version [S2][S4].
3. **FACT (high):** Point writes are asynchronous by default at the protocol
   level. `wait=true` delays the response until the update is applied and
   visible; it does not mean every background index/compaction task is complete.
   Client defaults differ, so adapter behavior must not be inferred from one SDK
   [S4][S5].
4. **FACT (high):** Qdrant describes point APIs as idempotent: retrying the same
   operation has the same logical effect, and upserting an existing ID replaces
   it. Distributed write failure can nevertheless be partially applied to too
   few replicas, and the consistency guide directs clients to retry [S5][S8].

```text
request
  → validate + choose shard(s)
  → append ordered operation to local/replica WAL(s)
  → acknowledgement depends on wait + write consistency + ordering
  → apply versioned mutation to appendable/COW segment
  → later merge/index/quantize/vacuum
```

### 3.2 WAL scope and limits

- **FACT (medium-high, repository observation):** The official configuration
  exposes WAL segment capacity and preallocation, defaulting in the reviewed
  configuration to 32 MiB and zero segments ahead. The public source separates
  the generic WAL crate, shard update machinery, and a distinct Raft consensus
  WAL [S16][S17].
- **INFERENCE (medium):** User-data WAL recovery is local-shard durability, while
  the consensus WAL records cluster-state operations. This follows the source
  organization and the explicit statement that Raft excludes point data, but
  the storage concept page does not normatively define every on-disk WAL scope
  [S2][S7][S16][S17].
- **UNKNOWN:** The reviewed public docs do not promise a cross-collection
  transaction, cross-shard atomic batch, user-visible log sequence token,
  point-in-time read, change-data-capture stream, or externally stable WAL file
  format.
- **RECOMMENDATION (high):** Curiosity must retain its own source revision,
  content digest, embedding model/version, and ingest event ID. A Qdrant success
  is an index-update fact, not provenance for the underlying document.

## 4. Segments, updates, deletes, and compaction

### 4.1 Mutation semantics

- **FACT (high):** An upsert of an existing point replaces the whole point;
  omitted named vectors become absent. Separate vector-update operations change
  only selected vectors, while separate vector-delete operations do not delete
  the point. Payload also has set/overwrite/delete/clear operations [S5].
- **FACT (high):** Upserts support `upsert`, `insert_only`, and `update_only`
  modes. Update operations can carry filter preconditions, allowing optimistic
  version-like application at the API level [S5].
- **FACT (high):** Deletes may select explicit IDs or a payload filter. Qdrant
  marks records deleted and excludes them from subsequent queries rather than
  immediately reclaiming their physical space [S4][S5].
- **FACT (high):** The vacuum optimizer rebuilds a segment after both a minimum
  deletion fraction and minimum vector count are met. Thus logical deletion and
  physical erasure/reclamation are separate events [S4].

### 4.2 Background optimizer family

| Optimizer | Trigger / action | Read/write behavior | Main trade-off |
| --- | --- | --- | --- |
| Vacuum | Deleted fraction and minimum segment size | Rebuild drops tombstoned records | Reclaim space versus rewrite I/O |
| Merge | Too many small segments | Merges at least several small segments, bounded by max segment size | Fewer search fan-outs versus longer rebuilds |
| Indexing | Segment/vector volume crosses threshold or config changes | Builds HNSW, memmap layout, and quantized representation | Faster reads versus CPU/I/O and write lag |

- **FACT (high):** During rebuild, the original segment remains readable. A
  proxy sends concurrent changes to a copy-on-write segment that takes priority
  for retrieval and later updates [S4].
- **FACT (high):** More/larger optimized segments generally improve query
  throughput by reducing per-query segment work and building larger indexes,
  but take longer to rebuild. More/smaller segments absorb writes and optimize
  faster but add search fan-out [S3][S4].
- **FACT (high):** `indexing_threshold` controls when plain scanning gives way to
  built indexes. Small segments may intentionally have no HNSW index, so
  `indexed_vectors_count=0` can be normal [S1][S4].
- **FACT (high):** Collection status distinguishes ready, optimizing, pending,
  and unrecoverable-error states. Current versions expose queued/running/
  completed optimization details and deferred-point metrics [S1][S4][S14].
- **FACT (high):** Experimental `prevent_unoptimized` can durably accept points
  but defer their search visibility until indexing. Combined with `wait=true`,
  it can block the update worker and subsequent waiting writes [S4].

### Curiosity implications

1. **ADOPT** explicit logical-versus-physical deletion states. Legal or privacy
   erasure requires tracked compaction/snapshot expiry, not merely a successful
   delete call.
2. **ADAPT** COW optimization as an availability pattern, but expose ingest lag,
   index lag, tombstone ratio, and latest searchable revision separately.
3. **REJECT** approximate internal counts for corpus accounting. Use exact count
   checks and the canonical document ledger.
4. **ADOPT** idempotent IDs derived from Curiosity's stable document/chunk
   identity, while retaining an independent revision to prevent stale replay.

## 5. Dense HNSW and payload-aware filtering

### 5.1 Index composition and planning

- **FACT (high):** Vector and payload indexes are independent per-segment data
  structures but are jointly used. Payload indexes accelerate field conditions
  and estimate filter cardinality; the query planner uses that estimate to
  choose a search strategy [S3][S6].
- **FACT (high):** Dense search can use HNSW approximate traversal or an exact
  full scan. `hnsw_ef` expands search breadth at query time, while HNSW build
  parameters such as `m` and `ef_construct` trade memory/build cost for recall.
  `full_scan_threshold` influences when scanning is preferred [S3][S6].
- **FACT (high):** Payload indexes are explicitly created per field/type;
  supported families include keyword/UUID, numeric/range, bool, geo, datetime,
  and text. Unindexed filters remain functional unless strict mode blocks them,
  but can consume disproportionate resources [S3][S12].
- **FACT (high):** Strict mode can reject retrieval or update filtering on
  unindexed fields and bound result size, timeout, filter complexity, index
  count, batch size, storage, and rates [S3][S12].

### 5.2 Filterable HNSW

Naive pre-filtering can leave too many candidates for exact comparison; naive
post-filtering can return too few matches or force large over-fetch. Qdrant's
documented answer combines planning with a filter-aware graph.

- **FACT (high):** Qdrant's filterable HNSW adds graph edges associated with
  indexed payload conditions so filtering can be applied during graph traversal
  rather than solely before or after ANN search [S3][S15].
- **FACT (high):** Payload indexes should be created before ingest/HNSW build.
  Adding one later immediately enables field filtering and estimation, but its
  filter-aware edges do not appear until HNSW is rebuilt [S3].
- **FACT (high):** For restrictive or compounded filters where graph
  connectivity harms recall, optional ACORN traversal explores neighbors of
  filtered-out neighbors. Qdrant documents materially higher cost and enables
  it conditionally below a selectivity threshold [S6].
- **INFERENCE (high):** Filter correctness is not intended to be approximate;
  candidate discovery is. Planner choice, graph connectivity, and `ef` govern
  whether ANN finds the best qualifying neighbors, while final results must
  satisfy the filter [S3][S6].

### 5.3 Failure modes and checks

| Risk | Mechanism | Required check |
| --- | --- | --- |
| Recall loss under correlated filters | Qualifying points form disconnected graph regions | Measure filtered recall against `exact=true` by filter class |
| Latency spike | Unindexed field forces scan/payload I/O | Enable strict mode after index audit; alert on rejected filters |
| Stale filter-aware graph | Payload index added after HNSW | Record index schema epoch and verify rebuild completion |
| Write/read contention | Index and COW rebuild consume CPU/I/O | Monitor optimizer queue, page faults, vector/payload I/O, p95/p99 |
| Tenant leakage | Missing or malformed tenant filter | Enforce tenant scope outside free-form query construction and test authorization separately |

**RECOMMENDATION (high):** Treat tenant, corpus, source policy, visibility,
language, document status, and time bounds as typed filters over indexed fields.
Never encode hard access constraints only into embeddings or ranking formulas.

## 6. Quantization architecture and quality boundary

### 6.1 Representations

Qdrant stores a quantized representation **beside**, not instead of, the original
vector. Quantized search can cheaply generate an oversized candidate set and
optionally re-score it using originals [S21].

| Method | Documented compression profile | Strength | Principal caution |
| --- | --- | --- | --- |
| Scalar (`int8`) | 4× versus float32 | Mature speed/recall balance, SIMD scoring | Distribution/outlier-dependent error |
| TurboQuant | 8×–32× by bit depth | Rotation plus asymmetric query scoring; broad model applicability claim | Newer; must be evaluated per corpus; L1 slow |
| Binary | 16×–32× for 2/1.5/1-bit modes | Very fast bitwise scoring | High dimension and centered distributions favored; rescoring commonly needed |
| Product | Up to 64× | Maximum memory compression | Slower, non-SIMD-friendly scoring and larger accuracy loss |

- **FACT (high):** Quantization is optional and configurable per collection or
  named vector. Original and quantized vectors coexist [S1][S21].
- **FACT (high):** Search parameters can ignore quantization, enable/disable
  original-vector rescoring, and oversample the quantized candidate set before
  rescoring [S6][S21].
- **FACT (high):** Quantized vectors have memory placement controls separate
  from originals; keeping compressed candidates in RAM while originals remain
  disk-backed is an intended deployment pattern [S2][S21].
- **FACT (medium):** Published recall and speed figures are Qdrant's benchmark
  observations on selected datasets, not general guarantees. Qdrant itself says
  to test methods on the user's data [S21].

### Curiosity verdict

- **DEFER** quantization for an initial bounded corpus. It adds a second quality
  approximation before evidence ranking is understood.
- **ADAPT** later as a first-stage-only accelerator with originals retained,
  fixed oversampling, exact/full-precision re-score, and quality gates segmented
  by query type, language, time filter, and tenant.
- **REJECT** compression ratio as the success metric. Gate on recall@candidate-k,
  nDCG/MRR after re-score, tail latency, memory, storage, and rebuild cost.
- **UNKNOWN:** No official source establishes which method best fits Curiosity's
  embedding distribution or whether its target hardware realizes vendor
  benchmark gains.

## 7. Sparse, hybrid, multivector, and multi-stage retrieval

### 7.1 Native representations

- **FACT (high):** A point may contain named dense vectors, named sparse
  vectors, and multivectors. Sparse vectors are index/value pairs, use dot
  product, and are searched exactly through their sparse index; dense HNSW is
  approximate [S1][S5][S6].
- **FACT (high):** Sparse index configuration supports an IDF modifier, allowing
  document-frequency weighting in the engine. Full-text payload indexes are a
  different feature used for filtering, not the same contract as a named sparse
  retrieval vector [S1][S3].
- **FACT (high):** Multivectors support late-interaction uses such as ColBERT,
  generally as an expensive re-score representation rather than the cheapest
  first-stage index [S5][S11].

### 7.2 Query DAG

The Query API's `prefetch` creates a bounded candidate DAG:

```text
dense top-k ─┐
             ├─ RRF / weighted RRF / DBSF ─ candidate top-k
sparse top-k ┘                                  │
                                               ├─ full vector / multivector rescore
                                               └─ formula: freshness/authority/etc.
```

- **FACT (high):** One or more prefetches run before the main query, and
  prefetches can themselves have prefetches. The main query is applied only to
  their candidate results. Every stage therefore needs a sufficient explicit
  limit; main-query offset does not enlarge upstream limits [S11].
- **FACT (high):** RRF combines rank positions and avoids incomparable score
  scales. Current Qdrant supports configurable `k` and per-prefetch weights.
  DBSF normalizes each returned score distribution using its mean and standard
  deviation before summing; its statistics are only from the prefetch top-k and
  can be outlier-sensitive [S11].
- **FACT (high):** Qdrant warns against a raw fixed-alpha sum of dense cosine and
  sparse/BM25-like scores because their scales differ and move by query [S11].
- **FACT (high):** A final formula can combine a prefetch score with indexed
  payload variables, conditions, and decay functions. Formula evaluation is a
  re-scoring step, not independent corpus-wide candidate generation [S11].

### Curiosity implications

1. **ADOPT** separate candidate generation from fusion and final policy ranking.
2. **ADOPT** RRF as the uncalibrated safe baseline; **DEFER** weighted RRF/DBSF
   until held-out judgments show a gain.
3. **ADAPT** formula re-ranking for freshness or source quality only after
   retrieval. Store every component and final score for audit; do not collapse
   evidence authority into semantic similarity.
4. **ADOPT** stage-specific limits and budget accounting. A final limit of 20 is
   not meaningful if each branch silently fetches 10,000.
5. **REJECT** Qdrant's query DAG as Curiosity's whole reasoning planner. It is a
   retrieval/ranking graph, not a gap/contradiction detector or source-verifying
   research loop.

## 8. Sharding, replication, Raft, and consistency

### 8.1 Sharding and routing

- **FACT (high):** Automatic sharding hashes points across a fixed collection
  shard count; user-defined sharding maps caller-selected shard keys and can
  target operations to tenant/region subsets [S7][S9].
- **FACT (high):** Any cluster node can accept a query, route it to relevant
  shards, merge partial results, and return the global result. Official clients
  do not themselves load-balance across nodes; an external load balancer is
  recommended [S9].
- **FACT (high):** Self-hosted shard count cannot be changed in place in the
  documented workflow; recreation/migration is needed. Cloud adds automatic
  rebalancing and resharding not available to open-source self-hosting [S9].
- **RECOMMENDATION (high):** Defer sharding until a single node fails measured
  capacity or availability objectives. Premature shards multiply search,
  snapshot, transfer, and consistency operations.

### 8.2 Replication and point consistency

- **FACT (high):** Replication stores multiple copies of each shard. The default
  replication factor is one, so distributed mode alone creates no redundancy
  [S7][S9][S16].
- **FACT (high):** There is normally no fixed primary/secondary. Writes execute
  in parallel on active replicas; any active replica may serve reads or writes.
  A dynamic/permanent write leader appears only for stronger ordering modes
  [S7][S8].
- **FACT (high):** Raft applies to cluster topology and collection structure,
  not point operations. Collection changes require a majority; point writes do
  not become atomic distributed transactions through Raft [S7].
- **FACT (high):** `write_consistency_factor` is an acknowledgement threshold,
  default one. A failed write can be partially applied; success means enough
  replicas acknowledged, not that all copies did [S8].
- **FACT (high):** Read consistency defaults to one replica. `all`, `majority`,
  `quorum`, or a replica count query multiple copies and reconcile presence.
  Read affinity can stabilize repeated reads to one replica but is best-effort,
  not a consistency proof [S8].
- **FACT (high):** Write ordering is `weak` by default; `medium` serializes via a
  dynamically elected leader, and `strong` via a stable leader at the cost of
  availability when that leader is unavailable [S8].

**INFERENCE (high):** Qdrant exposes independent durability, acknowledgement,
visibility, ordering, and read-reconciliation knobs. None alone implies
serializability; Curiosity must choose a coherent profile for each workflow.

Suggested Curiosity profiles to evaluate, not implementation prescriptions:

| Workflow | Priority | Candidate policy |
| --- | --- | --- |
| Rebuildable embedding ingest | Throughput | Idempotent write, `wait=false`, weak ordering, retry ledger |
| User-visible correction | Read-after-write | `wait=true`, revision precondition, stronger read on verification |
| Security/tenant policy mutation | Correctness | Keep authoritative policy outside vector DB; verify all affected points/indexes |
| Retrieval | Availability | Default read for normal search; explicit stronger read only for anomaly diagnosis |

### 8.3 Failure domains

- **FACT (high):** Three or more voting nodes plus replication factor at least
  two is Qdrant's recommended production HA baseline. Two nodes cannot retain a
  Raft majority when either is unavailable [S7].
- **FACT (high):** Self-hosted Qdrant is not availability-zone-aware; operators
  must place and move replicas across zones. Cloud offers zone-aware automation
  as a separate capability [S18].
- **UNKNOWN:** The reviewed sources do not establish Curiosity-specific RPO/RTO,
  performance under partial network partitions, or the exact stale-read window
  under its workload.

## 9. Shard transfer, snapshots, restore, and backup

### 9.1 Transfer paths

Qdrant documents three shard-transfer mechanisms [S9]:

- `stream_records` (default): stream point records in batches; target rebuilds
  local indexes as needed.
- `snapshot`: create/transfer/restore a shard snapshot including indexes and
  quantized data, then replay queued updates in order.
- `wal_delta`: reconcile missed operations through WAL difference; documented as
  the automatic recovery default for dead replicas since v1.9.

**INFERENCE (high):** These are base-plus-delta variants. Record streaming is
portable but rebuild-heavy; snapshot transfer moves a physical optimized base;
WAL delta is efficient only when replicas share enough history.

### 9.2 Snapshot contract

- **FACT (high):** A collection snapshot is a tar archive of that collection's
  local data and configuration at a point in time, including points, payloads,
  and prebuilt indexes. Collection aliases are excluded [S9][S10].
- **FACT (high):** In a distributed deployment, collection snapshots must be
  created separately on each node; each contains only data held by that node.
  Full-storage snapshots, which include aliases, are restore-suitable only for
  single-node deployments [S10].
- **FACT (high):** Restore compatibility is limited to the same minor version or
  the next minor version under the documented rule. Recovery priority can favor
  existing replicas, favor snapshot data, or skip synchronization; misuse of
  `no_sync` can break a cluster [S10].
- **FACT (high):** Snapshots may be stored locally or in S3-compatible storage.
  URL-based restore creates an SSRF-relevant outbound-fetch surface; Qdrant's
  hardening guide recommends blocking unnecessary egress, and Cloud blocks URL
  restore outbound traffic [S10][S13].
- **FACT (high):** Cloud backups are disk-level and cluster-oriented, distinct
  from portable collection snapshots. Replication is for availability, while
  snapshots/backups are the recovery mechanisms [S19].

### Curiosity verdict

1. **ADOPT** base-plus-delta transfer as a general recovery pattern.
2. **REJECT** replication as backup and a per-node snapshot set as automatically
   globally atomic.
3. **REQUIRE** automated restore drills, version-compatibility checks, encrypted
   external storage, checksum/catalog records, alias recreation, and measured
   RPO/RTO before relying on Qdrant for production recovery.
4. **RETAIN** canonical documents and embedding recipes outside Qdrant so the
   entire index can be rebuilt even when snapshots are unusable.

## 10. Security, operations, and observability

### 10.1 Security boundary

- **FACT (high):** Open-source self-hosted Qdrant is insecure by default: it
  binds broadly, uses no authentication, and does not enable transport
  encryption. Qdrant says it is not production-ready until secured [S13][S17].
- **FACT (high):** It supports admin and read-only static keys, collection-scoped
  JWT RBAC, API TLS, peer TLS, client-certificate validation, API-key rotation,
  and JSON audit logs. Audit logging is off by default [S13].
- **FACT (high):** Internal peer gRPC is not protected by API keys/bearer tokens;
  port 6335 must be network-isolated and peer TLS should be enabled [S13].
- **FACT (high):** Snapshot read permissions are sensitive: documented RBAC
  permits read roles to download collection snapshots. A snapshot contains the
  whole local collection payload/vector/index state, not merely one query's
  projected fields [S10][S13].
- **RECOMMENDATION (high):** Put Qdrant on a private network, authenticate every
  non-health route, use TLS/mTLS, separate ingest and query credentials, deny
  egress except required peers/object storage, and treat snapshot access as bulk
  data export.
- **RECOMMENDATION (high):** Qdrant payload filtering is not a substitute for a
  Curiosity authorization layer. Enforce tenant/corpus scope before generating
  the database query and validate defense-in-depth filters.

### 10.2 Operational surface

- **FACT (high):** `/metrics` exposes Prometheus/OpenMetrics node metrics for
  API duration/failures, collections, replicas, optimization, snapshots, memory,
  file descriptors/mmaps, page faults, and Raft state. It is node-local and must
  be scraped on every peer [S14].
- **FACT (high):** `/telemetry` is peer-local; `/cluster/telemetry` aggregates a
  smaller cluster-wide view. `/healthz`, `/livez`, and `/readyz` are basic and
  deliberately unauthenticated [S14].
- **FACT (high):** Collection-level optimization APIs expose queue, segment,
  point, progress, and task detail. This is essential because indexing lag can
  alter latency or visibility [S4].
- **RECOMMENDATION (high):** Alert at minimum on dead/partial replicas, Raft
  pending operations, update/optimizer backlog, deferred or indexed-only-excluded
  points, tombstone/vacuum pressure, disk headroom, major page faults, file
  descriptors/mmaps, snapshot failures/age, API error rate, and p95/p99 latency.
- **UNKNOWN:** Basic readiness does not prove every collection is green, every
  replica is active, or the latest revision is searchable. Curiosity needs a
  semantic readiness check against expected collection/index epochs.

## 11. License and clean-room transfer boundary

- **FACT (high):** The Qdrant server repository is licensed under Apache License
  2.0. It permits use, modification, and distribution subject to license,
  notice, changed-file, attribution, patent, and trademark terms [S17][S20].
- **FACT (high):** Apache-2.0 does not grant rights to Qdrant trademarks except
  customary attribution, and its patent license terminates for specified patent
  litigation [S20].
- **BOUNDARY:** Qdrant Cloud and other managed services have separate commercial
  terms; the server's Apache license does not make service operations or branding
  part of Curiosity's project license.
- **CLEAN-ROOM DECISION:** This dossier adopts architectural ideas and public
  contracts only. No Qdrant code, file format, constants, tests, or generated API
  artifacts are copied. If Curiosity later embeds, modifies, or redistributes
  Qdrant code, preserve Apache-2.0 and NOTICE obligations after a separate legal
  and dependency review.

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Evidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| Q1 | Fact | Collection → shard → segment are distinct schema, distribution, and optimization boundaries. | High | [S1][S2][S7] | **ADOPT** the separation conceptually. |
| Q2 | Fact | Point writes enter an ordered WAL before segment application. | High | [S2][S5] | **ADAPT** behind Curiosity's source ledger. |
| Q3 | Inference | Segment duplicates, versions, COW rebuild, merge, and vacuum form a log-structured compaction model. | Medium-high | [S1][S2][S4] | **ADOPT** as a mental model, not a compatibility contract. |
| Q4 | Fact | Payload indexes both accelerate filters and provide cardinality estimates to query planning. | High | [S3][S6] | **ADOPT.** |
| Q5 | Fact | Filter-aware HNSW needs payload indexes present when the graph is built. | High | [S3] | **ADOPT** schema-first ingest and rebuild tracking. |
| Q6 | Fact | ACORN improves traversal under restrictive filters at higher cost. | High | [S6] | **DEFER** until exact-baseline tests identify a recall gap. |
| Q7 | Fact | Quantized vectors coexist with originals and support oversampled rescoring. | High | [S21] | **DEFER**, then **ADAPT** as candidate-only acceleration. |
| Q8 | Fact | Deletes are tombstones until vacuum rebuild reclaims them. | High | [S4] | **ADAPT** with erasure-state tracking. |
| Q9 | Fact | Optimizers keep old segments readable and redirect changes through COW proxies. | High | [S4] | **ADOPT** the availability pattern. |
| Q10 | Fact | Sparse retrieval is named, dot-product, and exact; dense HNSW is approximate. | High | [S1][S6] | **ADOPT** explicit modality contracts. |
| Q11 | Fact | Nested prefetch supports fusion and multi-stage re-score with bounded candidate lists. | High | [S11] | **ADOPT** as the retrieval DAG. |
| Q12 | Recommendation | RRF is safer than summing raw dense and sparse scores without calibration. | High | [S11] | **ADOPT** as baseline; evaluate alternatives. |
| Q13 | Fact | Raft covers collection/topology metadata, not point data. | High | [S7] | **REJECT** “Raft means all writes are strongly consistent.” |
| Q14 | Fact | Distributed defaults are replication 1, write consistency 1, read consistency 1, weak ordering. | High | [S8][S9][S16] | **REJECT** defaults as an implicit HA/correctness claim. |
| Q15 | Fact | Failed distributed writes can partially apply and require idempotent retry. | High | [S8] | **ADOPT** attempt/retry lineage. |
| Q16 | Fact | Distributed collection snapshots are per-node and aliases are excluded. | High | [S10] | **REJECT** one-call/global-backup assumptions. |
| Q17 | Fact | Self-hosted open source is unauthenticated and unencrypted by default. | High | [S13][S17] | **REJECT** default deployment for production. |
| Q18 | Fact | Server code is Apache-2.0. | High | [S17][S20] | **ADOPT** only with explicit obligations if code is reused. |
| Q19 | Recommendation | Qdrant should be rebuildable projection storage, not Curiosity's canonical evidence store. | High | architecture/risk synthesis | **ADOPT.** |
| Q20 | Unknown | Curiosity-specific recall, latency, resource curve, RPO/RTO, and optimal quantization are unmeasured. | High | negative result | **DEFER** scale/quality choices pending checks. |

## 13. Exact Curiosity implications and verification plan

### 13.1 Provider-neutral model

Keep Qdrant behind a retrieval adapter. The provider-neutral record should carry:

- stable `document_id`, `chunk_id`, source revision, and content digest;
- dense/sparse vector model name, model revision, dimensions, and generated time;
- typed payload fields for tenant, corpus, source class, URL/domain, language,
  publication/fetch/validity times, visibility, and deletion state;
- canonical content/evidence location outside Qdrant;
- ingest operation ID and expected searchable index epoch.

Qdrant collection names, vector names, fusion enums, score shapes, shard keys,
and consistency settings belong in the adapter/operations layer, not the core
Curiosity contract.

### 13.2 Initial disposition

**ADOPT now**

1. Named dense and sparse representations on the same chunk identity.
2. Explicit payload indexes for every hard-filter and ranking-policy field.
3. RRF over bounded dense/sparse top-k, followed by separately observable policy
   scoring.
4. Stable idempotent point IDs and revision-guarded update jobs.
5. Exact-search shadow checks and full-precision originals for evaluation.
6. Canonical documents, evidence spans, and provenance outside the vector DB.

**ADAPT**

1. WAL durability into an end-to-end ingest state machine: accepted, durable,
   applied, indexed, searchable, and canonical-source committed.
2. Tombstone/vacuum behavior into deletion SLAs that cover live segments,
   snapshots, backups, and source stores.
3. Formula ranking into a transparent score-feature ledger; hard authorization
   remains a filter/policy decision.
4. Background optimization into explicit freshness and backlog SLOs.

**REJECT**

1. Using vector similarity as source authority, truth, citation support, or
   document freshness.
2. Unbounded payload shapes and ad hoc production filtering without indexes.
3. Raw dense+sparse score addition without normalization/evaluation.
4. Treating Qdrant replication, Raft, or snapshot presence as sufficient backup
   and consistency policy.
5. Internet-exposed default self-hosting.

**DEFER**

1. Quantization and multivector reranking until baseline quality and cost exist.
2. Multi-node replication/sharding until availability/capacity objectives and
   operator ownership are explicit.
3. Custom shard keys until tenant skew and shard-pruning benefit are measured.
4. ACORN, weighted RRF, DBSF, formula complexity, and `prevent_unoptimized`
   until targeted evaluations show value.

### 13.3 Required checks before adoption

| Gate | Minimum check | Failure decision |
| --- | --- | --- |
| Retrieval quality | Exact dense baseline; dense-only, sparse-only, RRF; recall@k, nDCG/MRR by query class | Revisit model/chunking/index before tuning HNSW |
| Filter quality | Exact vs ANN under high/medium/low selectivity and correlated multi-field filters | Increase `ef`, rebuild filter graph, or evaluate ACORN |
| Freshness | Measure durable→applied→indexed→searchable lag under normal and burst ingest | Bound ingest or provision optimizer headroom |
| Mutation safety | Replay, out-of-order revision, whole-point replacement, partial-vector update, filtered delete | Keep adapter blocked until stale-write tests pass |
| Deletion | Confirm query disappearance, vacuum reclamation, snapshot/backup expiry | Do not claim erasure before all layers complete |
| Recovery | Restore collection plus aliases into a version-compatible isolated cluster and compare exact counts/digests | Snapshot is not an accepted backup |
| Distribution | Kill node/leader, isolate network, partially fail write, transfer shard; verify retry and consistency behavior | Remain single-node/rebuildable or redesign HA profile |
| Security | Auth/TLS/mTLS, least-privilege JWT, peer-port isolation, audit, egress/SSRF test, snapshot access review | No production exposure |
| Operations | Load plus optimizer/compaction contention; p50/p95/p99, CPU, RAM, disk, page faults, queue growth | Set write budgets or resize before launch |
| License | Inventory binaries/images/clients and preserve Apache obligations | Use service adapter only or stop adoption |

## 14. Unknowns and retained negative results

1. No reviewed official source promises ACID transactions across points, shards,
   collections, or replicas.
2. No public contract exposes a stable commit LSN, point-in-time read, CDC feed,
   or externally supported WAL format.
3. No snapshot contract establishes a single globally atomic distributed-cluster
   cut; per-node collection snapshots are explicit.
4. No Qdrant mechanism establishes document authenticity, canonical URL,
   license, citation entailment, or evidence trust. Payload can store these facts
   but does not verify them.
5. No score is calibrated across vector names, embedding models, query families,
   collections, or time. Fusion and formula scores are ranking values, not
   probabilities.
6. No vendor benchmark proves Curiosity recall, latency, memory, or cost.
7. No reviewed source establishes guaranteed physical-erasure timing after a
   point delete or deletion from already-created snapshots/backups.
8. No basic health endpoint proves semantic freshness or full replica/index
   readiness.
9. Self-hosted open source lacks documented automatic Cloud-style rebalancing,
   resharding, Multi-AZ placement, and failed-node replacement.
10. Exact crash consistency of every optimizer swap, file rename, and fsync
    boundary was not reconstructed; that would require a version-pinned source
    and fault-injection study outside this decision frame.

## 15. Bounded curiosity pass

After initial synthesis, remaining in-frame gaps were scored 1–5 for relevance
(`R`), decision value (`V`), novelty (`N`), and inverse cost (`C`; 5 is cheap).
Only the highest-value gaps were pursued within the official-source budget.

| Thread | R/V/N/C | Action | Result / stop reason |
| --- | --- | --- | --- |
| Does Raft replicate point data? | 5/5/4/5 | Pursued via scaling + consistency pages | Resolved: no; metadata/collection operations only [S7][S8]. |
| Can distributed snapshots be treated as one backup? | 5/5/4/5 | Pursued via snapshot + migration pages | Resolved negatively: per-node collection snapshots; backups are separate [S10][S19]. |
| Does payload indexing merely prefilter HNSW? | 5/5/4/4 | Pursued via indexing, search, filterable-HNSW sources | Resolved: estimates plus filter-aware graph edges; ACORN covers restrictive traversal [S3][S6][S15]. |
| Can deletion satisfy erasure immediately? | 5/5/3/5 | Pursued via optimizer + snapshot docs | Resolved negatively: tombstone then vacuum; old snapshots remain separate retention objects [S4][S10]. |
| Which quantizer is best for Curiosity? | 4/4/3/1 | Rejected after method review | **CURIOSITY_NO_GO:** workload embeddings/hardware and eval set are absent; vendor guidance cannot decide [S21]. |
| Exact WAL/fsync and optimizer crash windows | 4/4/5/1 | Rejected | **CURIOSITY_NO_GO:** requires version-pinned code audit and fault injection; public contract already suffices for adapter decision. |
| Reproduce vendor performance benchmarks | 3/3/2/1 | Rejected | **CURIOSITY_NO_GO:** no deployment authority or representative corpus; would exceed clean-room document scope. |
| Reverse-engineer proprietary Cloud control plane | 2/2/4/1 | Rejected | **CURIOSITY_NO_GO:** unnecessary, outside open-source architecture and access boundary. |
| Enumerate every payload filter/tokenizer/query variant | 2/2/1/2 | Rejected | **CURIOSITY_NO_GO:** contract inventory adds little to the architecture decision; API docs remain authoritative. |

**Stop condition:** coverage reached for every caller-requested subsystem;
additional official pages repeated established boundaries, while remaining gaps
require empirical workloads or a version-pinned fault study. Research stopped on
coverage and saturation, not because the unknowns were silently resolved.

## Sources

All sources are official Qdrant properties or the official Qdrant GitHub
repository, accessed 2026-08-17.

- **[S1]** Qdrant, “Collections.”
  https://qdrant.tech/documentation/manage-data/collections/
- **[S2]** Qdrant, “Storage.”
  https://qdrant.tech/documentation/manage-data/storage/
- **[S3]** Qdrant, “Indexing.”
  https://qdrant.tech/documentation/manage-data/indexing/
- **[S4]** Qdrant, “Optimizer.”
  https://qdrant.tech/documentation/ops-optimization/optimizer/
- **[S5]** Qdrant, “Points.”
  https://qdrant.tech/documentation/manage-data/points/
- **[S6]** Qdrant, “Similarity Search.”
  https://qdrant.tech/documentation/search/search/
- **[S7]** Qdrant, “Horizontal Scaling.”
  https://qdrant.tech/documentation/scaling/horizontal-scaling/
- **[S8]** Qdrant, “Consistency Guarantees.”
  https://qdrant.tech/documentation/scaling/consistency-guarantees/
- **[S9]** Qdrant, “Distributed Deployment.”
  https://qdrant.tech/documentation/scaling/distributed_deployment/
- **[S10]** Qdrant, “Snapshots.”
  https://qdrant.tech/documentation/snapshots/
- **[S11]** Qdrant, “Hybrid and Multi-Stage Queries.”
  https://qdrant.tech/documentation/search/hybrid-queries/
- **[S12]** Qdrant, “Administration / Strict Mode.”
  https://qdrant.tech/documentation/ops-configuration/administration/
- **[S13]** Qdrant, “Security & Access Control.”
  https://qdrant.tech/documentation/security/
- **[S14]** Qdrant, “Monitoring & Telemetry.”
  https://qdrant.tech/documentation/ops-monitoring/monitoring/
- **[S15]** Andrei Vasnetsov / Qdrant, “Filterable HNSW Without Recall Loss.”
  https://qdrant.tech/articles/filterable-hnsw/
- **[S16]** Qdrant official repository, default server configuration.
  https://github.com/qdrant/qdrant/blob/master/config/config.yaml
- **[S17]** Qdrant official repository, project README and architecture/features
  overview. https://github.com/qdrant/qdrant/blob/master/README.md
- **[S18]** Qdrant, “Resilience.”
  https://qdrant.tech/documentation/scaling/resilience/
- **[S19]** Qdrant, “Migration and Recovery Options.”
  https://qdrant.tech/documentation/migration-recovery-options/
- **[S20]** Qdrant official repository, Apache License 2.0.
  https://github.com/qdrant/qdrant/blob/master/LICENSE
- **[S21]** Qdrant, “Quantization.”
  https://qdrant.tech/documentation/manage-data/quantization/
