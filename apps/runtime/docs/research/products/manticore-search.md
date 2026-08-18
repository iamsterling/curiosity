# Manticore Search architecture: clean-room product research

**Decision frame.** Determine which Manticore Search ideas Curiosity should
adopt, adapt, reject, or defer for owned public-web retrieval without copying
GPL-covered implementation code or allowing Manticore-specific behavior to leak
into provider-neutral contracts. This is architecture research, not an
implementation specification, performance endorsement, or legal opinion.

**Baseline and access date.** The product baseline is official release
**Manticore Search 29.0.2**, published **2026-08-14**. Documentation was read
from the official `manticore-29.0.2` branch at
[commit `5fd516b`](https://github.com/manticoresoftware/manticoresearch/commit/5fd516beeb0e21b18d0500fcef8676a04b23a3bc);
release metadata and licenses were cross-checked against official repositories.
All sources were accessed **2026-08-17**. [S1][S2]

**Bounded sub-questions.** What are the durable and serving units? How do RT
writes, transactions, deletes, compaction, lexical ranking, filters, facets,
vectors, and hybrid search behave? How do manual distribution, native sharding,
mirrors, and Galera replication differ? What are the API, recovery, security,
capacity, and license boundaries? Which lessons transfer to Curiosity?

**Evidence labels.** **FACT** is directly supported by cited official primary
material; **INFERENCE** is clean-room synthesis of documented behavior;
**RECOMMENDATION** is a Curiosity design judgment. Confidence is **High**,
**Medium**, or **Low**. Vendor documentation establishes intended behavior, not
an independent correctness or performance proof.

## Executive verdict

Manticore is best understood as a **mutable, segment/chunk-based search database
with several composition layers**. A real-time table combines one mutable RAM
chunk with immutable-style disk chunks; binlogs protect unsaved RAM state;
flushes create disk chunks; background compaction merges chunks and physically
purges tombstones. Separately, distributed tables scatter queries over local or
remote child tables, native sharded tables hide routing over physical shards,
and Galera provides virtually synchronous multi-master replication. These are
distinct mechanisms and should not be described as one generic “cluster.”
[S3][S4][S13-S16]

Manticore's strongest transferable ideas are: explicit RAM-to-disk publication,
generation-safe query isolation during merge, observable bounded query options,
cost-based selection among scans and secondary indexes, rank-based lexical/
vector fusion, filter-aware ANN with brute-force fallback, and separation of
capacity sharding from replica placement. Its largest risks for Curiosity are
operational complexity, tombstone/statistics drift before compaction, partial or
approximate distributed aggregation, default-unbounded controls, unencrypted
binary/SST paths, and a GPL core coupled to a GPL sidecar.
[S5-S12][S17-S23][S33][S35][S36]

| Verdict | Lesson or role | Curiosity rationale |
|---|---|---|
| **ADOPT** | Immutable serving generations with query-safe cutover | Long-running queries keep their old chunk view while new queries see the merged generation; this is the right publication invariant. |
| **ADOPT** | Make query work and approximation explicit | Candidate windows, ANN effort, wildcard expansion, match buffers, timeouts, exactness, and partial-result state must be bounded and observable. |
| **ADAPT** | RAM ingest plus durable log plus immutable disk generations | Retain the shape, but keep Curiosity's authoritative version ledger outside the search engine and define an acknowledged-durability mode. |
| **ADAPT** | Cost-based filter planning over row, column, and secondary structures | Useful, but decisions must include memory, disk, and tenant budgets; Manticore's CBO currently models CPU only. |
| **ADAPT** | Independent lexical/vector retrieval followed by weighted RRF | Preserve branch ranks, candidate windows, filter scope, and fusion contribution rather than returning only one opaque score. |
| **ADAPT** | Shards and replication as separate topology dimensions | Require explicit placement, replication factor, coverage, degraded state, and rebalance semantics in Curiosity operations. |
| **REJECT** | Treating immediate logical deletion as physical erasure | Tombstones hide rows but leave storage and word statistics until rebuild/merge; compliance needs a separate blocklist and erasure ledger. |
| **REJECT** | Direct public access or search-engine-only authorization | Auth is optional, several internal data paths are unencrypted, and search results/highlights remain untrusted external data. |
| **REJECT** | Copying or translating Manticore Search or Buddy code | Search and Buddy are GPL-3.0-family components; clean-room behavior and architecture study does not authorize source reuse. [S35][S36] |
| **DEFER** | Native sharded tables as Curiosity's primary distribution layer | The feature depends on Buddy, hides topology, cannot be altered in place, and has cluster-wide placement constraints requiring evaluation. |
| **DEFER** | In-engine embedding and conversational search | Model downloads, CPU scheduling, external credentials, retries, and LLM behavior couple ingestion and serving to optional subsystems. |

**Overall confidence:** **High** for documented 29.0.2 structure, APIs,
principal operational controls, security defaults, and license identities;
**Medium** for distributed failure semantics and planner behavior; **Low** for
Curiosity-scale performance and formal consistency because no deployment,
fault injection, or benchmark was authorized.

## 1. System shape and ownership boundaries

### 1.1 Table types and management modes

- **FACT (High):** Online schema management (“RT mode”) stores table files under
  `data_dir`, supports SQL `CREATE`/`ALTER`/`DROP`, and is the only mode with
  replication. Configuration-defined “plain mode” supports all documented table
  types but is the natural home of externally built plain tables. Table types
  include real-time, plain, percolate, distributed, and template tables. [S3]
- **FACT (High):** A plain table is built from an external source by `indexer`.
  It cannot accept inserted rows, deletes, or online schema changes after build;
  most content is immutable, with limited in-place row-wise attribute updates.
  Rebuild and rotation publish a new version while the old table serves. [S4]
- **FACT (High):** A real-time (RT) table accepts visible inserts, replaces,
  updates, and deletes. Internally it has one RAM chunk and multiple disk chunks;
  disk chunks have the structure of plain tables. [S5]
- **INFERENCE (High):** “Table” is an API abstraction over materially different
  storage and mutation models. Curiosity must not infer uniform atomicity,
  mutability, vector support, or schema evolution from a shared query surface.
- **RECOMMENDATION:** Record provider capabilities per physical table type and
  reject unsupported operations before issuing a request. Prefer RT tables for
  evaluation, while retaining an external source/version authority.

### 1.2 RT table: RAM chunk, disk chunks, and binlog

- **FACT (High):** New transactions form RAM segments. Manticore merges small
  segments in memory; when memory pressure reaches `rt_mem_limit`, it converts
  RAM state into a disk chunk, brings that chunk online, and releases RAM. The
  table can therefore exceed RAM, but active RAM ingestion and disk serving have
  different physical paths. [S5][S6]
- **FACT (High):** Before an RT mutation completes, Manticore can record its
  transaction in an append-oriented binary log. After an unclean shutdown, it
  loads the latest saved RAM dump and replays checked transactions. A clean
  shutdown or `FLUSH TABLE` persists RAM state and permits obsolete binlogs to
  be removed. Binlogging is enabled by default but can be disabled globally or
  per RT table. [S6][S7]
- **FACT (High):** Default `binlog_flush=2` writes each transaction but syncs
  once per second: a daemon crash should retain written commits, while an OS or
  hardware crash can lose up to roughly one second. Mode `1` flushes and syncs
  every transaction at higher write cost. [S7]
- **FACT (High):** `SHOW TABLE STATUS` exposes RAM bytes, segment and disk-chunk
  counts, garbage bytes, memory limit, optimization state, and `tid` versus
  `tid_saved`; a difference means changes exist only in RAM and, if enabled,
  binlog. [S24]
- **INFERENCE (High):** An acknowledged write is not one universal durability
  promise. Its power-loss boundary depends on binlog enablement and sync mode,
  while its serving representation may still be RAM-only.
- **RECOMMENDATION:** Curiosity should return a mutation receipt containing
  source version, provider TID if available, visibility status, and durability
  class (`process`, `os-buffer`, `fsynced`, or `replicated`). Keep the source
  event until durable publication is independently verified.

### 1.3 Row-wise, columnar, docstore, and secondary indexes

- **FACT (High):** Full-text fields use inverted-index artifacts. Attributes
  support filtering, sorting, grouping, and projection. Traditional row-wise
  attribute storage is the default and performs best when attributes fit in
  memory. Apache-licensed Manticore Columnar Library provides compressed
  columnar storage intended for data volumes beyond RAM. [S4][S8][S27]
- **FACT (High):** The CBO can choose a plain scan, doc-ID index, columnar scan,
  or secondary index. Secondary indexes are created by default for non-JSON
  attributes and combine PGM and inverted structures; histograms, PGM metadata,
  column encoding statistics, a min/max tree, and full-text term statistics feed
  the cost estimate. [S9]
- **FACT (High):** Secondary indexes exist on RT disk chunks, not current RAM
  segments. An in-place attribute `UPDATE` disables that attribute's secondary
  index; replacement is advised when continuity matters. [S10][S24]
- **FACT (High):** The CBO considers at most 1,024 filter-plan combinations,
  favors latency over throughput when choosing multithreaded scans, and models
  CPU but not memory or disk cost. Secondary/doc-ID index plans run single
  threaded. [S9]
- **INFERENCE (High):** The same logical filter can cross three execution
  regimes within one RT table: mutable RAM scan, disk scan, and indexed disk
  lookup. Chunk age and update history can change latency without schema change.
- **RECOMMENDATION:** Treat storage and indexing flags as physical design.
  Capture plan/index use, chunk coverage, bytes read, CPU, and memory. Benchmark
  RAM-heavy, freshly flushed, compacted, and update-degraded states separately.

## 2. Mutation, transaction, and compaction lifecycle

### 2.1 Inserts, updates, replacements, and deletes

- **FACT (High):** `INSERT` rejects an existing ID; `REPLACE` marks the old row
  deleted and inserts the new version. Full and partial replacement can change
  indexed text and columnar attributes; partial replacement requires all fields
  to be stored. [S10]
- **FACT (High):** `UPDATE` is an in-place operation limited to row-wise
  attributes. It cannot change full-text fields, columnar attributes, or the
  document ID. Blob growth may append within a memory-mapped attribute file.
  [S10]
- **FACT (High):** Delete and replace are initially logical. The document is
  excluded through a kill list, but its bytes and term statistics remain until a
  RAM merge, flush, or disk-chunk merge physically removes it. [S6]
- **INFERENCE (High):** Before compaction, replacement amplifies storage and can
  leave ranking statistics reflecting dead versions. A frequently recrawled URL
  may therefore cost more and rank differently than a cleanly rebuilt corpus.
- **RECOMMENDATION:** Use stable Curiosity IDs and idempotent source versions;
  track logical invisibility separately from physical purge. Run relevance and
  storage tests under realistic recrawl/update churn, not only fresh bulk load.

### 2.2 Transaction boundary and documentation tension

- **FACT (High):** Explicit transactions cover `INSERT`, `REPLACE`, and `DELETE`
  on one RT or percolate table. They do not cover `UPDATE`, DDL, `TRUNCATE`,
  `ATTACH`, or writes through a distributed table. Autocommit is on by default;
  uncommitted changes are invisible even to their own session. `/bulk` can
  delimit commits with blank lines, and changing target table commits the prior
  table batch. [S11]
- **FACT (High):** The manual says both that transactions “do not aim to provide
  isolation” and that single-table transactions are “atomic, consistent,
  overly isolated, and durable.” The latter is defined narrowly as pending
  changes being invisible to all readers, including the current session. [S11]
- **INFERENCE (Medium):** The two statements are reconcilable only as a limited
  changeset atomicity/visibility mechanism, not a general ACID concurrency
  contract. The manual does not define conflict serialization, snapshot reads,
  or a formal linearizability model.
- **RECOMMENDATION:** Do not map Manticore transactions to a provider-neutral
  multi-record ACID promise. Curiosity should group one-table batches where
  useful, then verify item count, version, and visibility from outside the write
  session.

### 2.3 Flush, merge, optimize, and generation isolation

- **FACT (High):** `FLUSH RAMCHUNK` creates a new disk chunk; `FLUSH TABLE`
  saves the RAM chunk and helps clean binlogs. Automatic flushing also follows
  memory and activity heuristics. [S12]
- **FACT (High):** Automatic optimization is enabled by default. `OPTIMIZE`
  performs N-way disk-chunk merging and purges deleted documents. Manual and
  background work can be parallelized and I/O-throttled. The table remains
  searchable and writable almost all the time, with a short metadata/file
  cutover lock. [S12]
- **FACT (High):** During a merge, a long-running query retains the old chunk
  generation while a new query sees the replacement. Concurrent updates and
  deletes are applied to source and resulting chunks so cutover does not lose
  them. The same isolation applies when RAM segments become a disk chunk. [S12]
- **INFERENCE (High):** Chunk identity acts as an immutable serving-generation
  boundary even though the table API is mutable. Correctness concentrates in
  atomic manifest/cutover and dual-application of concurrent mutations.
- **RECOMMENDATION:** Adopt generation fencing and reader leases. Publish new
  immutable artifacts atomically, preserve old generations for active readers,
  and garbage-collect only after leases and rollback windows expire.

## 3. Lexical retrieval, filters, facets, and boundedness

### 3.1 Ranking and term expansion

- **FACT (High):** Full-text results default to relevance order. The default
  `proximity_bm25` ranker combines phrase proximity and BM25; alternatives
  include BM25, word count, proximity, field-hit, expression, export, and plugin
  rankers. Field weights and IDF behavior are query-configurable. [S18]
- **FACT (High):** Different child tables in one distributed query can retain
  different default rankers. Their raw weights are merged without automatic
  normalization, so numerically unlike scores can be compared. [S18]
- **FACT (High):** Wildcard expansion can match huge vocabularies.
  `expansion_limit` restricts each wildcard to the N most frequent terms but
  defaults to `0`—unlimited. Phrase expansion has a separate limit and can fail
  closed or continue with a partial transformation and warning. [S19]
- **FACT (High):** Fuzzy search uses Levenshtein distance (default 2), optional
  keyboard layouts, and preservation controls, but requires Buddy and is not
  available in multi-queries. Suggestion search has explicit candidate/reject
  queues; optional search-based reranking issues a search per candidate. [S20]
- **INFERENCE (High):** Manticore offers rich lexical control but several safe
  limits are operator choices rather than secure defaults. Popularity-pruned
  wildcard candidates and partial phrase transformation can alter recall.
- **RECOMMENDATION:** Compile a typed neutral query with mandatory limits for
  tokens, Boolean nodes, wildcards, expansions, fuzzy candidates, wall time, and
  result count. Return warnings, transformed terms, truncation, and ranker ID.

### 3.2 Filters, aggregation, and facets

- **FACT (High):** Attribute filters can be evaluated by scans, columns, or
  secondary indexes; for filtered full-text queries the CBO can either run text
  first and test filters or compute row IDs first and inject them into the
  full-text tree. [S9]
- **FACT (High):** `max_matches` bounds retained best matches, not documents
  scanned. High values increase per-query RAM/CPU. Manticore can raise it for
  grouping accuracy up to a default threshold of 16,384. `cutoff` can stop work
  but is explicitly unsafe for accurate aggregation. [S19]
- **FACT (High):** Parallel RT chunks or pseudo-shards can produce inaccurate
  grouping, aggregation, and `COUNT(DISTINCT)` when per-part result buffers omit
  groups. `accurate_aggregation=1` may raise buffers or disable parallelism.
  [S19][S21]
- **FACT (High):** `FACET` is internally a multi-query optimization: a common
  result set can be searched once and reused by facet calculations. Distinct
  filter scopes may require separate result sets. Per-facet modes control
  strict/expanded bucket behavior and zero-count buckets. [S22]
- **INFERENCE (High):** Bounded distributed aggregation has a three-way trade:
  exactness, memory, and parallel latency. A plausible numeric response is not
  enough; its execution and exactness mode are evidence.
- **RECOMMENDATION:** Curiosity responses should label `exact`, `estimated`,
  `truncated`, or `partial`; include per-shard/chunk coverage, `max_matches`,
  cutoff, warnings, and planner strategy. Exact mode must fail rather than
  silently return incomplete counts.

## 4. Vector and hybrid retrieval

### 4.1 HNSW and filtered ANN

- **FACT (High):** Float vectors and KNN are supported only in RT tables and are
  implemented through Manticore Columnar Library. HNSW is the only documented
  KNN type. L2, inner product, and cosine are supported; cosine vectors are
  normalized on insertion. Defaults are `M=16`, construction `ef=200`, and
  search `ef=10`. [S23]
- **FACT (High):** HNSW graphs must be fully memory resident. Optional 8-bit or
  1-bit scalar quantization reduces vector memory by 4× or 32×. Rescoring is on
  by default and recomputes full-precision distances after a default 3×
  oversampled candidate retrieval. [S23]
- **FACT (High):** Filter preselection is the default. Manticore documents an
  ACORN-1-based traversal that retains graph bridges and activates when fewer
  than 60% of rows pass the filter. A cost estimate can switch highly selective
  cases to exact brute-force distance scan. Postfilter mode is available but can
  return fewer than requested. [S23]
- **FACT (High):** Adaptive HNSW early termination is enabled by default and
  disabled automatically for small `k`; raising `ef` improves accuracy at cost.
  HNSW graph builds happen during flush, compaction, and schema rebuild and can
  be parallel/non-bit-identical by insertion order. [S23]
- **INFERENCE (High):** Chunk count affects ANN semantics and cost: each disk
  chunk owns an HNSW graph while current RAM data follows another path; merging
  rebuilds graph topology. Recall and ranking may shift after compaction without
  any document or query change.
- **RECOMMENDATION:** Evaluate recall against exact distance search before and
  after flush/compaction, with selective/disconnected tenant filters,
  quantization, rescoring, and early termination. Report graph generation,
  search path, effective candidate count, `ef`, and distance metric.

### 4.2 RRF hybrid search and embedding coupling

- **FACT (High):** True hybrid mode executes text and KNN subqueries
  independently in parallel and fuses their rank positions with weighted
  Reciprocal Rank Fusion. The default rank constant is 60; `window_size`
  controls each branch's candidates and can be auto-derived; filters apply to
  both branches. Multiple KNN branches are supported. [S25]
- **FACT (High):** Without explicit `fusion_method='rrf'`, combining `MATCH` and
  `KNN` means KNN-first search filtered by text; lexical weight is only a
  secondary criterion. With RRF, default ordering is `hybrid_score()` and raw
  lexical weight and vector distance remain queryable. [S25]
- **FACT (High):** Manticore can generate embeddings during writes or searches
  using local ONNX/other model families or remote OpenAI-, Voyage-, and
  Jina-style APIs. Remote API keys and timeouts become table configuration; the
  key is validated by a live request during table creation. Embedding CPU thread
  use has a global/per-query cap. [S19][S23]
- **INFERENCE (High):** RRF is portable at the conceptual level, while automatic
  branch windows and chunk-local ANN make exact outcomes provider-specific.
  In-engine embedding makes model availability, credentials, and provider
  latency part of indexing/search availability.
- **RECOMMENDATION:** Adopt explicit weighted RRF in Curiosity's orchestration
  layer, with versioned embedding generation outside serving. Preserve per-
  branch rank/score/distance, candidate-window exhaustion, fusion parameters,
  model/version, and source text hash.

## 5. Distribution, sharding, and replication are different planes

### 5.1 Distributed tables: explicit scatter/gather

- **FACT (High):** A distributed table is a logical collection of local and/or
  remote child tables. Queries fan out, then the coordinator sorts and
  recalculates aggregates. Each `agent` entry is one remote shard; pipe-separated
  addresses are mirrors for that shard; multiple entries are multiple shards.
  Agents are searched in parallel. [S13][S14]
- **FACT (High):** The coordinator does not know each remote table's type. It
  broadens remote limits (for example to `0,1000`) and applies the caller's final
  limit after merge. Connection/query timeouts, retries, persistent connections,
  and blackhole agents are configurable. [S14]
- **FACT (High):** Mirrors default to random selection. Other strategies use
  strict round robin, latency-weighted exclusion of dead nodes, or recent error
  ratios. These are request-routing heuristics, not data replication. [S15]
- **INFERENCE (High):** Distributed tables are topology declarations, not a
  catalog proving shard uniqueness or replica equivalence. Operators remain
  responsible for partitioning, copying data, schema consistency, and failure
  interpretation unless another mechanism supplies them.
- **RECOMMENDATION:** Curiosity must own a shard manifest with non-overlap,
  generation, replica equivalence, and coverage. Fail closed on missing shards
  by default; only return partial results with explicit authorization and a
  complete failure envelope.

### 5.2 Native sharded tables

- **FACT (High):** Native sharded tables require Buddy and transparently route
  reads and writes over hidden physical shards. They can be local (`rf=1`) or
  spread across a replication cluster with a chosen replication factor. Status
  exposes placement and `ok`/`degraded`/`broken` replica state. [S16]
- **FACT (High):** Current limitations include: local and clustered sharded
  modes cannot coexist on the same participating nodes; the subsystem binds to
  one cluster name; schema cannot be altered in place; and a table is limited to
  3,000 shards. [S17]
- **FACT (High):** The 29.0.2 release changed the shard-write and replication
  protocol by adding heartbeats for long operations, creating mixed-version
  upgrade ordering requirements. [S1]
- **INFERENCE (Medium):** Native sharding packages a distributed-table/Galera
  topology behind a simpler object, but hidden generated topology increases
  dependence on Buddy orchestration and version-compatible control behavior.
- **RECOMMENDATION:** Defer adoption until black-box tests establish routing,
  rebalance/add-node behavior, write idempotency, partial shard failure,
  coordinator failover, schema migration, and mixed-version recovery.

### 5.3 Galera replication

- **FACT (High):** Galera replication is virtually synchronous,
  certification-based, multi-master, and tightly coupled: writes can enter any
  node and replicas are intended to hold the same state. Replication supports RT,
  percolate, and distributed tables in online-schema mode on Linux; native
  Windows lacks it and macOS support is development-oriented. [S26]
- **FACT (High):** Replication is per table and a table belongs to at most one
  cluster. Normal replicated-table writes require an explicit cluster-qualified
  SQL name or JSON `cluster` property; omitting it is rejected. [S26]
- **FACT (High):** Rejoining nodes use incremental state transfer when missed
  writes remain cached, otherwise snapshot state transfer copies table files.
  A three-node partition leaving one node without quorum makes it non-primary
  and rejects writes; manual quorum bootstrap can create split brain if used
  while another side remains alive. Full restart must choose the most advanced,
  safe-to-bootstrap node or later SST can discard newer transactions. [S27]
- **INFERENCE (High):** Replication improves availability and durability but
  multiplies storage and does not itself partition capacity. Native sharding
  composes partitioning and per-shard replica placement on top.
- **RECOMMENDATION:** Operate with odd failure-domain-aware membership, explicit
  quorum health, fenced recovery authority, tested IST/SST timing, and backups
  independent of replicas. Never automate `pc.bootstrap` from liveness alone.

## 6. APIs and compatibility boundary

- **FACT (High):** Native SQL is served over the MySQL wire protocol on default
  port 9306. It supports standard connectors and prepared statements but only a
  subset/different dialect of MySQL; vectors and MVAs lack native MySQL types.
  [S28]
- **FACT (High):** HTTP/HTTPS serves JSON, NDJSON, and encoded bodies. `/search`
  is the native JSON search API; `/sql` permits one SELECT and returns search-
  shaped JSON; `/sql?mode=raw` permits any valid SQL and multi-statements. Native
  mutation endpoints include insert/replace/update/delete and transactional
  NDJSON `/bulk`. [S29]
- **FACT (High):** Elasticsearch compatibility is partial: selected write and
  mapping endpoints are supported, while broader Kibana/OpenSearch Dashboard
  emulation depends on Buddy and explicitly does not provide full cluster
  administration or field/plugin compatibility. [S2][S29]
- **INFERENCE (High):** Wire compatibility is not semantic substitutability.
  MySQL drivers can emit unsupported setup SQL; Elasticsearch-shaped responses
  can encourage assumptions about IDs, refresh, mappings, and query DSL that do
  not hold.
- **RECOMMENDATION:** Use one version-pinned Manticore adapter over the narrowest
  native API. Parse every bulk item, validate all response fields and sizes,
  treat highlights/documents as untrusted, escape rendering, and reject
  compatibility fallbacks not covered by conformance tests.

## 7. Operations, recovery, and capacity controls

### 7.1 Backup and recovery

- **FACT (High):** `manticore-backup` performs physical RT-mode backups locally
  or to S3-compatible storage; SQL `BACKUP` delegates high-level work through
  Buddy. `mysqldump` offers logical RT-table export with schema/storage
  constraints. Physical restore requires the serving instance on the target
  host/port to be stopped and protects against overwriting existing files.
  [S30]
- **FACT (High):** Physical backup uses `FREEZE`: table files stop changing
  while writes may continue in RAM. If RAM exceeds `rt_mem_limit`, writes block
  until unfreeze. Tables are frozen together and then unfrozen one by one after
  copying; 29.0.2 includes a fix for failure paths leaving them frozen. [S1][S30]
- **INFERENCE (Medium):** Replication, binlog recovery, and backup address
  different failures. Replica SST can propagate an old chosen state; binlog
  protects unsaved local changes; backup protects against operator/corruption
  loss only if restore is validated.
- **RECOMMENDATION:** Test backup while ingesting, interrupted backup, S3 loss,
  full empty-host restore, and search readiness. Measure RPO/RTO through index
  load and HNSW memory warm-up, not merely copied bytes.

### 7.2 Bounded operation and observability

- **FACT (High):** Useful bounds include connection, packet, filter, filter-
  value, batch-query, worker, per-query thread, query-time, match-buffer,
  wildcard expansion, agent timeout/retry, and merge-I/O controls. Several
  important defaults are unlimited: connection count, job queue, and wildcard
  expansion. [S19]
- **FACT (High):** Query logs can record replayable SQL and per-agent timing;
  table and node status expose chunk, timing, replication, and agent counters;
  `/metrics` supports monitoring. Log files default to mode 600. [S24][S31]
- **FACT (High):** Fragmented RT tables consume many open files; one thousand
  chunks can require thousands. Each worker has caches/stacks, and broad
  operations can consume all CPU unless per-query threads are capped. [S19]
- **INFERENCE (High):** Safety depends on deployment policy, not product defaults.
  A short wildcard, high-cardinality facet, broad distributed request, or
  embedding operation can multiply work across chunks, shards, and replicas.
- **RECOMMENDATION:** Put a budget-enforcing gateway ahead of Manticore. Track
  queue depth, rejected work, CPU/RAM, chunk count, tombstones, binlog lag/size,
  merge debt, open files, shard coverage, agent failures, replica state, and
  backup freshness. Redact query text and credentials from logs.

## 8. Security and license boundaries

### 8.1 Authentication, authorization, encryption, and telemetry

- **FACT (High):** Authentication is disabled unless explicitly configured.
  When enabled it supports MySQL `mysql_native_password`, HTTP Basic, and bearer
  tokens. Actions are `read`, `write`, `schema`, `replication`, and `admin`; no
  matching permission defaults to deny, and explicit deny overrides allow.
  Tokens are independent of passwords and require separate rotation. [S32]
- **FACT (High):** Remote distributed queries run as the current session user.
  Remote nodes require matching stored authentication data—not merely the same
  independently created password. Cluster join replaces the joining node's auth
  data and may write prior salts/hashes into a sensitive auth log. [S32]
- **FACT (High):** HTTPS and MySQL TLS are configurable, but binary client and
  inter-daemon master/agent connections are not encrypted. Replication TLS is
  separate, and SST still uses the unsecured binary API. [S33]
- **FACT (High):** Product and backup telemetry are enabled by default and can be
  disabled through configuration/environment or backup flags. Official docs
  characterize metrics as anonymous, but no field-level independent audit was
  performed. [S34]
- **RECOMMENDATION:** Bind private listeners, enable auth and deny-by-default
  least privilege, require TLS for clients, isolate or tunnel binary/SST
  networks, rotate bearer tokens independently, protect auth logs and model API
  keys, disable telemetry unless approved, and enforce tenant policy outside the
  search engine as well as inside it.

### 8.2 Component licenses and commercial boundary

- **FACT (High):** The 29.0.2 server repository states **GPLv3 or later** and
  contains the GPLv3 text. GPLv3 permits private running/modification without
  conveyance conditions and says mere network interaction is not conveyance;
  distributing covered or combined object code invokes source and license
  obligations. [S2][S35]
- **FACT (High):** Manticore Buddy is a separately published PHP sidecar whose
  repository is identified as GPL-3.0. Official packages normally install and
  launch it, and several high-level features—including native sharding and some
  compatibility/backup behavior—depend on it. [S2][S16][S36]
- **FACT (High):** Manticore Columnar Library, which provides columnar storage
  and the documented KNN functionality, is a separate Apache-2.0 repository.
  Exact packaged secondary-index artifacts and transitive component notices
  still require SBOM inspection. [S8][S23][S37]
- **FACT (High):** The official services page says Manticore is “100%
  open-source” and sells support, consulting, feature engineering, and private
  branch maintenance. No separately licensed proprietary server feature tier
  was found in the reviewed official product/service sources. [S38]
- **INFERENCE (High):** Running an unmodified server behind a network adapter is
  a cleaner boundary than linking or source reuse, but container/image
  distribution and modifications still require artifact-specific review.
- **RECOMMENDATION:** Keep the provider adapter process/API-separated. Do not
  copy server or Buddy source. Before any shipment, inventory the exact server,
  Buddy, Columnar, Galera, model, and client artifacts and obtain legal review
  for GPL conveyance and third-party notices.

## 9. Clean-room implications for Curiosity

### Provider-neutral contract to adopt

1. **Authoritative identity:** canonical resource ID, immutable capture/version,
   content hash, source provenance, schema and tokenizer/ranker generation.
2. **Publication receipt:** accepted, visible, durable, replicated, and indexed
   states are separate; include provider generation/TID where available.
3. **Physical declaration:** searchable/stored/filterable/facetable/sortable/
   vector fields plus row/column/index choices and expected update cost.
4. **Query budget:** token/Boolean/expansion/fuzzy limits, match buffer, ANN
   window/effort, shard fan-out, timeout, response bytes, and exactness mode.
5. **Transparent result:** lexical score/rank, vector distance/rank, fusion
   contribution, filters, plan, shard/chunk coverage, warnings, timeout,
   approximation, and provider provenance.
6. **Deletion state:** blocked-at-gateway, logically absent, compacted/purged,
   replica-complete, and backup-expired are independent milestones.

### Manticore-specific behavior to isolate

- SQL dialect, rankers and IDF flags, RAM/disk chunks, kill lists, TIDs, binlog
  modes, `max_matches`, facet modes, CBO plan details, HNSW/ACORN controls, RRF
  options, Buddy availability, agent/mirror syntax, Galera cluster qualifiers,
  sharded-table internals, `FREEZE`, and backup commands belong only in the
  Manticore adapter and operations layer.
- Never expose raw Manticore SQL, JSON query DSL, wildcard/fuzzy switches,
  exhaustive ANN controls, or administrative endpoints to untrusted callers.
- Blue/green schema or tokenizer changes should publish a new table/generation
  and atomically switch a Curiosity-owned alias/manifest; do not make a hidden
  in-place `ALTER` the portable contract.

### Checks required before adoption

| Check | Evidence to collect | Pass / stop criterion |
|---|---|---|
| Write durability | Crash daemon, OS, and host under every binlog mode after acknowledgment | Receipt accurately predicts loss; external ledger replays without duplicates. |
| Mutation correctness | Concurrent insert/replace/update/delete through flush and optimize | No stale visible version; TID/version converges; index-disable side effects detected. |
| Delete lifecycle | Recrawl/delete churn across RAM, disk, replicas, backups | Immediate block and logical absence; physical/backup erasure meet separate SLAs. |
| Generation isolation | Long query spanning RAM flush and N-way merge | Reader sees one coherent generation; concurrent writes survive cutover. |
| Lexical boundedness | Tiny wildcards, fuzzy/layout expansion, deep Boolean/phrases | p99 stays inside budget; every truncation/warning is machine-readable. |
| Aggregate exactness | High-cardinality facets/groups across chunks and shards | Exact mode matches single-thread truth or fails; approximate mode is labeled. |
| ANN quality | Exact baseline vs RAM/disk/pre/post-merge HNSW and quantization | Recall/latency target holds; path, generation, and effective candidate work reported. |
| Hybrid relevance | Lexical/vector/RRF judgments with varied windows/weights | Target nDCG/recall improves without branch provenance loss. |
| Shard failure | Missing, slow, divergent, and duplicate agents/replicas | Fail closed by default; authorized partial mode reports exact coverage. |
| Galera recovery | Quorum loss, split network, IST, SST, full restart, wrong bootstrap | No split-brain/data rollback under runbook; RPO/RTO and fencing meet SLO. |
| Backup restore | Concurrent writes, interrupted freeze, S3 loss, empty-host restore | Deterministic usable search and auth/config recovery within RTO. |
| Security | Anonymous/direct access, permission bypass, token rotation, log leakage, SST sniffing | Least privilege and tenant isolation hold; every network path encrypted or isolated. |
| License/SBOM | Exact image/package/client/model inventory and distribution plan | GPL, Apache, Galera, model, and notice obligations accepted in writing. |

## 10. Unknowns, contradictions, and negative results

- **UNKNOWN (High relevance):** Formal isolation/linearizability and conflict
  behavior for concurrent RT transactions. The manual's “not isolation” and
  “overly isolated” wording defines visibility, not a complete consistency model.
- **UNKNOWN:** Formal atomic ordering between binlog acknowledgment, RAM index
  mutation, replication certification, and visibility under every crash point.
- **UNKNOWN:** Exact native sharded-table routing key, shard rebalance behavior,
  add/remove-node movement, and per-shard write atomicity were not specified in
  the reviewed user-facing sharding pages.
- **UNKNOWN:** Whether every distributed query failure returns enough structured
  information to prove complete shard coverage, especially across mirror retry
  and aggregation merge.
- **UNKNOWN:** Exact CBO constants and plan stability across RAM/disk chunks;
  documentation states inputs and CPU-only choice but not a reproducible model.
- **UNKNOWN:** Curiosity-shaped p95/p99 latency, ingest throughput, HNSW recall,
  compaction amplification, SST time, and restore-to-search time.
- **UNKNOWN:** Complete licenses and obligations of one exact official package/
  container, official client SDK choice, bundled Galera, downloaded embedding
  models, and all transitive artifacts; repository top-level licenses are not an
  SBOM.
- **NEGATIVE RESULT:** No proprietary “enterprise feature” server edition was
  found in the reviewed official sources; paid offerings described support,
  consulting, engineering, and private branch maintenance.
- **NEGATIVE RESULT:** No top-level `SECURITY.md` existed at the 29.0.2 server
  repository path checked; no official supported-version/remediation SLA was
  established within this research budget.
- **NEGATIVE RESULT:** No evidence was found that binary master/agent traffic or
  replication SST is encrypted by normal server TLS; the SSL manual explicitly
  says both are unsecured.
- **NEGATIVE RESULT:** No independent benchmark was performed. Vendor benchmark
  claims were excluded from the decision because workloads and controls were not
  reproduced for Curiosity.

## 11. Bounded curiosity pass

Scoring is 1–5 for relevance (R), decision value (V), novelty (N), and research
cost (C). Only the highest-value in-frame threads were pursued.

| Thread | R/V/N/C | Decision |
|---|---:|---|
| Distinguish distributed, sharded, and replicated topology | 5/5/4/2 | **Pursued:** separate official pages establish manual scatter/gather, Buddy-managed hidden shards, and Galera replica state as different layers. |
| Resolve transaction “not isolated” vs “overly isolated” | 5/5/4/1 | **Pursued:** retained both primary statements; bounded interpretation to pending-change invisibility and recorded formal semantics unknown. |
| Confirm filtered ANN behavior | 5/5/4/2 | **Pursued:** official KNN page documents ACORN-1 traversal, selectivity trigger, postfilter, and brute-force fallback. |
| Verify current security posture rather than historical no-auth claims | 5/5/4/1 | **Pursued:** 29.0.2 docs show optional users/tokens/RBAC while still documenting unsecured binary/SST paths. |
| Find proprietary feature boundary | 4/4/3/2 | **Pursued to saturation:** official services say 100% open source and describe paid services; no proprietary server tier found. Retained artifact-license unknowns. |
| Prove sharded routing/rebalance algorithm from source | 4/5/5/5 | **CURIOSITY_NO_GO:** implementation tracing would exceed the clean-room public-contract frame; require authorized black-box evaluation. |
| Prove crash atomicity through source/fault injection | 5/5/4/5 | **CURIOSITY_NO_GO:** no execution/deployment authority; proposed a bounded fault matrix instead. |
| Reproduce performance comparisons | 4/5/2/5 | **CURIOSITY_NO_GO:** vendor datasets and Curiosity corpus were not provisioned; first-party numbers would not decide fit. |
| Audit every SDK/model/container transitive license | 4/5/3/5 | **CURIOSITY_NO_GO:** no exact deployment artifact was selected; defer to selection-time SBOM and counsel review. |
| Reverse-engineer conversational-search prompts/routes | 2/2/4/5 | **CURIOSITY_NO_GO:** optional feature is deferred and private/model behavior is outside the core retrieval decision. |

**Stop reason:** Coverage is complete for every declared sub-question; material
contradictions and negative findings are retained. Further high-value evidence
requires a selected artifact and authorized executable evaluation. Source review
or broader commercial exploration would not change the current adopt/adapt/
reject/defer verdicts.

## Sources

All sources are official primary sources accessed **2026-08-17**. Manual links
are pinned to the official `manticore-29.0.2` documentation branch.

- **[S1]** Manticore Search, [release 29.0.2 metadata and notes](https://github.com/manticoresoftware/manticoresearch/releases/tag/release-29.0.2).
- **[S2]** Manticore Search 29.0.2, [README](https://github.com/manticoresoftware/manticoresearch/blob/release-29.0.2/README.md).
- **[S3]** Manual, [local table modes and types](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Creating_a_table/Local_tables.md).
- **[S4]** Manual, [plain tables and file structure](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Creating_a_table/Local_tables/Plain_table.md).
- **[S5]** Manual, [real-time tables](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Creating_a_table/Local_tables/Real-time_table.md).
- **[S6]** Manual, [RT table structure](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Securing_and_compacting_a_table/RT_table_structure.md).
- **[S7]** Manual, [binary logging](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Logging/Binary_logging.md).
- **[S8]** Manual, [row-wise and columnar data types](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Creating_a_table/Data_types.md#row-wise-and-columnar-attribute-storages).
- **[S9]** Manual, [cost-based optimizer](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Searching/Cost_based_optimizer.md).
- **[S10]** Manual, [REPLACE versus UPDATE](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Data_creation_and_modification/Updating_documents/REPLACE_vs_UPDATE.md) and [UPDATE](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Data_creation_and_modification/Updating_documents/UPDATE.md).
- **[S11]** Manual, [transactions](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Data_creation_and_modification/Transactions.md).
- **[S12]** Manual, [compaction](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Securing_and_compacting_a_table/Compacting_a_table.md), [flush](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Securing_and_compacting_a_table/Flushing_RAM_chunk_to_disk.md), and [merge isolation](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Securing_and_compacting_a_table/Isolation_during_flushing_and_merging.md).
- **[S13]** Manual, [distributed tables](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Creating_a_table/Creating_a_distributed_table/Creating_a_distributed_table.md).
- **[S14]** Manual, [remote tables and agents](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Creating_a_table/Creating_a_distributed_table/Remote_tables.md).
- **[S15]** Manual, [remote-node load balancing](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Creating_a_cluster/Remote_nodes/Load_balancing.md).
- **[S16]** Manual, [native sharded tables](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Creating_a_table/Creating_a_sharded_table/Creating_a_sharded_table.md).
- **[S17]** Manual, [sharded-table limitations](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Creating_a_table/Creating_a_sharded_table/Table_sharding_current_limitations.md).
- **[S18]** Manual, [sorting and ranking](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Searching/Sorting_and_ranking.md).
- **[S19]** Manual, [search options](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Searching/Options.md) and [server settings](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Server_settings/Searchd.md).
- **[S20]** Manual, [fuzzy search and spelling suggestions](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Searching/Spell_correction.md).
- **[S21]** Manual, [grouping and distributed/chunk accuracy](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Searching/Grouping.md).
- **[S22]** Manual, [faceted search](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Searching/Faceted_search.md).
- **[S23]** Manual, [KNN vector search](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Searching/KNN.md).
- **[S24]** Manual, [`SHOW TABLE STATUS`](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Node_info_and_management/Table_settings_and_status/SHOW_TABLE_STATUS.md) and [`SHOW TABLE INDEXES`](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Node_info_and_management/Table_settings_and_status/SHOW_TABLE_INDEXES.md).
- **[S25]** Manual, [hybrid search and RRF](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Searching/Hybrid_search.md).
- **[S26]** Manual, [Galera replication](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Creating_a_cluster/Setting_up_replication/Setting_up_replication.md).
- **[S27]** Manual, [cluster recovery](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Creating_a_cluster/Setting_up_replication/Cluster_recovery.md).
- **[S28]** Manual, [MySQL protocol and SQL compatibility](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Connecting_to_the_server/MySQL_protocol.md).
- **[S29]** Manual, [HTTP/HTTPS and SQL-over-HTTP](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Connecting_to_the_server/HTTP.md).
- **[S30]** Manual, [backup and restore](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Securing_and_compacting_a_table/Backup_and_restore.md).
- **[S31]** Manual, [query logging](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Logging/Query_logging.md) and [node metrics/status](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Node_info_and_management/Node_status.md).
- **[S32]** Manual, [authentication and authorization](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Security/Authentication_and_authorization.md).
- **[S33]** Manual, [SSL and unencrypted binary/SST boundaries](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Security/SSL.md).
- **[S34]** Manual, [telemetry and opt-out controls](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Telemetry.md).
- **[S35]** Manticore Search 29.0.2, [GPLv3-or-later license](https://github.com/manticoresoftware/manticoresearch/blob/release-29.0.2/LICENSE); GNU, [GPLv3](https://www.gnu.org/licenses/gpl-3.0.html).
- **[S36]** Manticore Buddy, [official repository and GPL-3.0 license](https://github.com/manticoresoftware/manticoresearch-buddy) and manual [sidecar boundary](https://github.com/manticoresoftware/manticoresearch/blob/manticore-29.0.2/manual/english/Installation/Manticore_Buddy.md).
- **[S37]** Manticore Columnar Library, [official Apache-2.0 repository](https://github.com/manticoresoftware/columnar).
- **[S38]** Manticore Software, [official services and support offerings](https://manticoresearch.com/services/).

## Overall confidence

**High** for the documented RT RAM/disk/binlog lifecycle, mutation limitations,
ranking/filter/vector features, topology distinctions, API surfaces, security
defaults, and top-level component licenses. **Medium** for distributed failure
details, sharding orchestration, backup completeness, and inferred serving
generation semantics. **Low / unknown** for formal transaction consistency,
crash interleavings, Curiosity-scale performance, and complete packaged-artifact
license inventory until tested against a selected deployment.
