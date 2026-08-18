# pgvector: clean-room reverse engineering for Curiosity retrieval

**Research date / source access date:** 2026-08-17  
**Version boundary:** released documentation for **v0.8.6** (2026-07-29), plus public `master` at commit [`36c26ba17644aeb63707f536287a0265c5309234`](https://github.com/pgvector/pgvector/tree/36c26ba17644aeb63707f536287a0265c5309234), 55 commits after v0.8.6 and identifying itself as unreleased 0.8.7. Master-only observations are not release commitments. [S1][S2]  
**Method / clean-room boundary:** Public pgvector documentation, license, source, tests, changelog, cited papers, and PostgreSQL documentation only. No credentials, private artifacts, decompilation, traffic capture, copied implementation, or production experiment. Source was read to understand contracts and mechanisms; this report contains independent prose only.  
**Evidence labels:** **Fact** = directly documented or observed in public source; **Inference** = a bounded conclusion from those facts; **Recommendation** = Curiosity advice; **Unknown** = not established. Confidence is High / Medium / Low.

## Decision frame

**Decision:** Should Curiosity use pgvector as an owned vector-retrieval component, and which of its contracts and operational lessons should be adopted, adapted, rejected, or deferred?

Bounded sub-questions:

1. What do exact, HNSW, and IVFFlat search actually execute, store, and return?
2. How do PostgreSQL planning, filters, MVCC, transactions, updates, deletes, and vacuum alter observable retrieval?
3. What replication, backup, scaling, dimensional, and access-method limits matter operationally?
4. Which lessons transfer without copying source or coupling Curiosity's provider-neutral contracts to PostgreSQL?

Out of scope: implementation, unpublished benchmarks, managed-provider modifications, exhaustive client-library review, legal advice, and claims about workload-specific quality or latency without measurement.

## Executive verdict

pgvector is not a separate vector database hidden inside PostgreSQL. It adds four representations (`vector`, `halfvec`, PostgreSQL `bit`, and `sparsevec`), distance operators/functions, and two custom index access methods. Exact search remains a normal PostgreSQL scan plus distance ordering; HNSW is an incrementally maintained multilayer proximity graph; IVFFlat is a trained set of fixed centroids and posting-list-like pages. Heap rows remain the transactional source of truth. Both ANN indexes return heap TIDs and rely on PostgreSQL to apply MVCC visibility and ordinary predicates. [S1][S3][S4][S5]

**Recommendation (High): ADOPT pgvector as a replaceable, transactional vector-retrieval baseline—not as Curiosity's retrieval contract or sole search engine.** It is especially compelling when embeddings, source metadata, authorization attributes, and lifecycle state already live in PostgreSQL and the corpus fits one PostgreSQL operational domain. Keep exact search as the recall oracle; prefer HNSW as the initial ANN candidate generator; isolate tenants/corpora where filtering is selective; over-fetch and rerank on canonical vectors; and preserve a lexical path. [S1][S5]

**Recommendation (High): DEFER IVFFlat by default.** It can build faster and use less memory, but requires training data, list/probe tuning, and rebuilds when corpus distribution drifts. Choose it only through workload-specific recall/latency/build/write-amplification tests. **Reject** any assumption that ACID implies deterministic or complete ANN results: ACID governs row visibility and durability; ANN recall remains parameter-, graph-, filter-, dead-tuple-, and workload-dependent. [S1][S13][S14]

## Reconstructed architecture

```text
canonical PostgreSQL heap row
  = identity + source/version + metadata/ACL + content/chunk + embedding
            |
            +--> exact path: visible/filter-matching rows
            |      -> distance operator for each row
            |      -> top-N sort / ORDER BY + LIMIT
            |
            +--> HNSW index: metapage + entry point
            |      -> multilayer graph elements + neighbor tuples + heap TIDs
            |      -> bounded graph traversal -> candidate heap TIDs
            |
            +--> IVFFlat index: metapage + trained list centers
                   -> nearest center selection -> selected list pages
                   -> distance/sort within probed lists -> candidate heap TIDs

candidate heap TID
  -> PostgreSQL snapshot visibility check
  -> ordinary WHERE predicates / joins
  -> LIMIT (and optional iterative continuation)
```

**Fact (High):** Both access methods advertise distance-operator ordering (`amcanorderbyop`) but not ordinary ordered scans, backward scans, uniqueness, multiple indexed columns, included columns, bitmap scans, index-only return, or parallel index scans. Both support parallel *builds* and parallel vacuum bulk deletion. [S3][S4]

**Inference (High):** pgvector ANN indexes are single-column candidate generators, not covering metadata indexes. They cannot absorb a tenant, ACL, language, date, or source predicate into the same ANN key, cannot be `BitmapAnd`-combined with a metadata index, and must visit the heap to check visibility and return rows. Partial indexes and partition pruning are the main ways to move stable filters ahead of ANN traversal. [S1][S3][S4][S7]

## Data types and physical storage

### Type-level contract

| Representation | Element/layout | Documented payload size | Type-level limit | ANN index limit |
|---|---|---:|---:|---:|
| `vector` | varlena header, 16-bit dimension, float32 elements | `4 * dimensions + 8` bytes | 16,000 dimensions | 2,000 dimensions |
| `halfvec` | varlena header, 16-bit dimension, IEEE-like 16-bit elements | `2 * dimensions + 8` bytes | 16,000 dimensions | 4,000 dimensions |
| `bit(n)` | PostgreSQL fixed-length bit string | `dimensions / 8 + 8` bytes (documented approximation) | PostgreSQL type constraints | 64,000 bits |
| `sparsevec` | 32-bit total dimension and nonzero count; sorted 0-based int32 indexes followed by float32 values | `8 * nnz + 16` bytes | 1,000,000,000 dimensions; 16,000 nonzeros | HNSW only; 1,000 nonzeros |

Facts and limits: [S1][S8]. `vector`, `halfvec`, and `sparsevec` require finite elements—no `NaN` or infinities. Text sparse indexes are 1-based, while the binary/on-disk sparse layout is sorted and 0-based. The extension declares its variable-length types with `STORAGE = external`, allowing out-of-line TOAST storage without compression by default. [S1][S8][S9]

**Fact (High):** A column declared without a typmod, such as `vector`, can hold different dimensions, but an ANN index can cover only rows cast to one fixed dimension, typically through an expression plus partial index. Null vectors are not indexed; zero vectors are also omitted for cosine indexes because normalization is undefined. [S1][S5]

**Inference (High):** Heap storage and ANN storage are duplicated working sets. ANN tuples retain the vector representation needed for distance calculations, while the heap remains necessary for MVCC and result fields. TOAST can make heap scans look artificially cheap because PostgreSQL's planner does not fully price out-of-line fetches; storing vectors inline can improve plan selection at the cost of wider heap rows. [S1][S3][S4]

**Recommendation (High):** Store model ID, embedding dimension, normalization state, precision, and generation version beside every embedding. Use a dimensioned column where one model dominates; use explicit partial expression indexes when models differ. Never silently cast an embedding model upgrade into an old index.

### Distance/operator matrix

| Type | Exact operators | HNSW | IVFFlat |
|---|---|---|---|
| `vector`, `halfvec` | L2 `<->`, negative inner product `<#>`, cosine `<=>`, L1 `<+>` | L2, IP, cosine, L1 | L2, IP, cosine |
| `bit` | Hamming `<~>`, Jaccard `<%>` | Hamming, Jaccard | Hamming |
| `sparsevec` | L2, negative IP, cosine, L1 | all four | unsupported |

**Fact (High):** Inner product is negated because PostgreSQL distance-operator index scans are ascending. Each distance requires a matching operator-class index; one index does not serve every metric. [S1][S9]

## Exact search

- **Fact (High):** With no ANN index path, PostgreSQL scans visible rows, evaluates the chosen distance, and orders to satisfy `LIMIT`. pgvector describes this as perfect recall. Its distance functions are marked parallel-safe, and the project recommends increasing `max_parallel_workers_per_gather` for exact scans. [S1][S9]
- **Fact (High):** A selective metadata B-tree can drive an exact candidate subset, after which PostgreSQL computes and sorts distances. This is often preferable when a predicate matches a small fraction of rows. [S1]
- **Fact (High):** A pure distance threshold does not use an ANN index by itself; the documented indexable shape combines ascending `ORDER BY <distance operator>` and `LIMIT`. [S1][S3][S4]
- **Inference (High):** “Perfect recall” means exact relative to stored finite-precision values and the selected distance—not semantic truth, original float64 embeddings, deterministic tie order, or authorization correctness.
- **Recommendation (High):** Keep bounded exact queries as the golden oracle for ANN recall monitoring. Stratify them by tenant, filter selectivity, model, and corpus age; aggregate recall alone can hide severe filtered-query failures.

## HNSW

### Structure and search

- **Fact (High):** HNSW stores a metapage with parameters and an entry point, element tuples containing the value and heap TIDs, and separate neighbor tuples. Layer 0 permits `2m` connections; upper layers permit `m`. Random levels use the paper's `1 / log(m)` multiplier. Defaults are `m=16`, `ef_construction=64`, and `ef_search=40`; supported ranges are `m=2..100`, `ef_construction=4..1000`, and `ef_search=1..1000`. [S3][S10]
- **Fact (High):** Search descends upper layers with one candidate, then searches layer 0 with `ef_search`. Increasing `ef_search` increases the candidate set and normally recall, with latency/memory cost. HNSW can be built on an empty table because it has no separate training phase. [S1][S5]
- **Fact (High):** Exact duplicate values can share one graph element with up to ten heap TIDs; this is explicitly intended to make the graph robust to non-HOT updates. Beyond that capacity, another element can be created. [S10]
- **Inference (Medium):** Graph shape depends on insertion/build order, random levels, concurrent activity, and later repair. Two logically identical restored or rebuilt databases need not have byte-identical graphs or identical approximate tie/candidate choices.

### Build and mutation

- **Fact (High):** HNSW first builds a graph in private/shared memory. If it outgrows `maintenance_work_mem`, it transitions to an on-disk insertion phase and warns that the build will be significantly slower. A completed build WAL-logs the index pages; online insert and repair paths use PostgreSQL Generic WAL. Parallel build is supported. [S1][S11]
- **Fact (High):** Online insertion searches for neighbors and mutates reciprocal connections under page/buffer locks. A higher `ef_construction` can improve graph quality but slows builds and inserts. New vectors are therefore not free append-only payloads; each write performs graph work and emits WAL. [S1][S12]
- **Inference (High):** Updating an indexed vector is operationally a new graph insertion plus retention of the old heap-version reference until vacuum. High embedding-churn workloads can accumulate dead graph elements and write amplification even though SQL update semantics remain atomic.

### Iterative scans

- **Fact (High):** Iterative HNSW is off by default. `strict_order` preserves nondecreasing distance; `relaxed_order` can improve recall at the cost of slight disorder. The initial scan is bounded by `ef_search`; continuation resumes from discarded layer-0 candidates in batches. It stops around `hnsw.max_scan_tuples` (default 20,000) or `work_mem * hnsw.scan_mem_multiplier` (default 1). The tuple cap is approximate and does not constrain the initial scan. [S1][S5]
- **Recommendation (High):** Enable iterative scan per query/transaction for selective filters, set explicit workload budgets, and still over-fetch. Treat a short result set as a valid bounded outcome, not evidence that fewer authorized records exist.

## IVFFlat

### Training, layout, and search

- **Fact (High):** IVFFlat creates `lists` centroids with k-means, assigns each vector to its nearest list, and at query time scores all list centers, chooses the nearest `probes` lists, scans all their entry pages, computes distances, and sorts candidates. Defaults are 100 lists and one probe; lists range from 1 to 32,768. [S1][S4][S13]
- **Fact (High):** Build sampling uses reservoir-style sampling, targeting 50 samples/list with at least 10,000 samples, bounded by estimated available tuples. If sampled rows are fewer than lists, the build warns that recall will be low. [S13]
- **Fact (High):** Project guidance starts at `rows/1000` lists up to one million rows and `sqrt(rows)` above that, with `sqrt(lists)` probes. These are heuristics, not guarantees. Setting probes to all lists requests exact coverage, but the planner then avoids the index. [S1]
- **Fact (High):** An insert compares against every center, appends a full index tuple to the nearest list's page chain, and does not retrain centers. Generic WAL covers page creation and mutation. [S14]
- **Inference (High):** Distribution drift is structural: centroids are fixed after build, so a changing model or corpus can create imbalanced lists and degraded recall/latency. `VACUUM` removes dead entries but does not retrain. Rebuild/reindex is the retraining mechanism.

### Iterative scans

- **Fact (High):** IVFFlat iterative scan supports only `relaxed_order`. It searches additional groups of `probes` lists until `ivfflat.max_probes` (default maximum 32,768, but never below current probes) or exhaustion. A materialized CTE plus outer reorder is the documented way to restore strict final order. [S1][S4]
- **Recommendation (Medium):** If IVFFlat is selected, version and monitor list count, probes, list-size skew, build corpus/model, rebuild time, and recall by filter. A fixed “probes=10” global default is not a quality policy.

## Planner and filter interaction

### Required query shape

**Fact (High):** The planner assigns infinite cost to either ANN index when no distance `ORDER BY` is present. The usable shape is the bare matching distance operator in ascending order plus a limit, for example `ORDER BY embedding <=> query LIMIT k`; rewriting it as similarity (`1 - distance`) in descending order prevents index use. Small tables may correctly choose a sequential scan. [S1][S3][S4]

**Fact (High):** HNSW cost uses tuple count, `m`, `ef_search`, estimated graph levels, a hard-coded scaling factor, and index pages. IVFFlat cost primarily scales startup cost by `probes/lists`. Both compensate partially for PostgreSQL sequential-scan estimates that omit TOAST costs. These are heuristics, not learned corpus statistics. [S3][S4]

### Post-filtering consequence

**Fact (High):** Ordinary filters are applied after ANN candidate generation. With HNSW `ef_search=40` and a predicate selecting 10%, the project says roughly four candidates match on average. Iterative scans were added in 0.8.0 to continue searching when filters discard candidates. [S1][S2]

Consequences:

1. **Inference (High):** A metadata index and ANN index are alternative plan paths, not a composite execution: ANN exposes no bitmap scan and no multicolumn key. For selective filters the planner can use metadata access then exact-sort; for broad filters it can use ANN then heap-filter.
2. **Fact (High):** Partial ANN indexes move a fixed predicate into index membership. Partitioning/list partitioning can isolate many categories or tenants before each local ANN scan. [S1][S7]
3. **Fact (High):** Sharing one ANN index across tenants lets other tenants' vectors consume traversal/candidate work and alter recall/speed. pgvector explicitly recommends partitions or separate tables for isolation. [S1]
4. **Inference (High):** Dynamic ACL predicates are particularly hostile to post-filtered ANN: selectivity varies per caller, partial indexes cannot be created per arbitrary ACL set, and raising `ef_search` globally wastes work for broad-access callers.
5. **Fact (High):** Relaxed iterative results may need a materialized CTE and final order. For Postgres 17+, pgvector documents `distance + 0` to force the outer sort; distance-threshold predicates are best placed outside the candidate CTE while other filters remain inside. [S1]

**Recommendation (High):** Curiosity should choose among three explicit plans per corpus/query: (a) selective filter → exact top-k, (b) partition/partial-index-local ANN, or (c) broad ANN → bounded authorization/metadata filter → rerank. Record requested `k`, candidates visited, candidates filtered, returned count, ANN parameters, plan, and index/model version.

## Transactions and MVCC

### What ACID covers

- **Fact (High):** PostgreSQL creates a heap version before its index entries; index tuples do not carry independent visibility. A scan receives heap TIDs, and the heap snapshot decides whether the row version is visible. Uncommitted, aborted, updated-away, and deleted rows can therefore remain physically represented in an index while being invisible to SQL results. [S15][S16]
- **Fact (High):** HNSW and IVFFlat reject non-MVCC snapshots. HNSW does so because it cannot retain an index-page pin while traversing its graph; IVFFlat cannot retain pins while collecting and sorting TIDs. Both report `xs_recheck=false`, relying on the matching heap TID and MVCC safety rather than rechecking the vector expression. [S5][S15]
- **Fact (High):** HNSW adds a scan lock around graph traversal/continuation so vacuum cannot delete and reuse referenced elements during traversal. It version-checks elements loaded across iterative batches. [S5]
- **Fact (High):** Neither access method implements fine-grained predicate locks (`ampredlocks=false`). PostgreSQL therefore takes a nonblocking predicate lock on the full index for a serializable scan, which can increase serialization conflicts while preserving serializable integrity. [S3][S4][S15]

### What ACID does not cover

- **Inference (High):** Transactions guarantee that a returned heap row is visible under the query snapshot; they do not guarantee that ANN found every nearest visible row. Invisible/dead candidates and post-filters can consume a bounded search frontier. HNSW documentation specifically lists dead tuples and filters as reasons for fewer results. [S1][S5]
- **Inference (High):** A transaction that inserts or updates an embedding and then queries can see its own heap version under normal PostgreSQL rules, but whether a bounded ANN scan ranks it in top-k remains an ANN property. Exact search is the correctness oracle when read-your-write nearest-neighbor completeness matters.
- **Inference (Medium):** Repeatable-read stabilizes heap visibility, not necessarily the physical graph work or approximate candidate set across statements if concurrent maintenance changes the index. Application contracts should promise snapshot-correct returned rows, not repeatable ANN identity, unless empirically enforced.

## Updates, deletes, vacuum, and reindex

### Lifecycle

1. **Fact (High):** Inserts update the ANN index in the same SQL operation; both online index mutation paths use Generic WAL. Nulls and unnormalizable cosine-zero values are skipped. [S12][S14]
2. **Fact (High, inherited PostgreSQL):** An update creates a new heap row version. If no indexed value/expression changes and PostgreSQL can perform a HOT update, no new index tuple is needed. A changed embedding requires a new index entry; the old one remains until vacuum. A delete likewise marks the heap version dead before later index cleanup. [S16][S26]
3. **Fact (High):** IVFFlat vacuum takes cleanup locks on list entry pages, removes dead index tuples, and marks a page with free space as the list's insertion page. It does not change list centers. [S17]
4. **Fact (High):** HNSW vacuum is graph-aware: pass 1 removes dead heap TIDs and identifies empty elements; pass 2 repairs graph connections; later passes confirm repair and mark elements deleted/reusable. Vacuum coordinates with concurrent scans and inserts through dedicated page locks. [S18]
5. **Fact (High):** Standard vacuum makes dead space reusable but usually does not return it to the operating system. pgvector warns HNSW vacuum can take a while and recommends `REINDEX INDEX CONCURRENTLY` before vacuum as a speed strategy. [S1][S16]

**Operational caution (High):** The recent changelog is material evidence, not a reason to assume current corruption. v0.8.3 fixed possible HNSW vacuum corruption; v0.8.4 fixed a graph-repair error and an insert/vacuum race; v0.8.6 fixed an IVFFlat 32-bit build buffer overflow and nested-loop scan memory usage. Current tests explicitly exercise concurrent HNSW scan/vacuum, insert/delete/select/vacuum, and WAL replay for both indexes. Pin and qualify versions; do not run an unbounded “latest” extension in production. [S2][S19]

**Recommendations (High):**

- Tune autovacuum per high-churn embedding table/partition; monitor dead tuples, index size, vacuum duration, WAL volume, and short-result rate.
- Prefer append-new-version plus tombstone/reconciliation for source embeddings when auditability matters, but still expire old versions and vacuum them.
- Reindex after model-wide embedding replacement, material IVFFlat drift, unexplained recall loss, or sustained bloat. Use concurrent operations for live tables and test the extra I/O/WAL headroom.
- Treat HNSW maintenance as part of capacity planning. Recent vacuum fixes make upgrade qualification and crash/replica tests mandatory.

## Index build and deployment behavior

- **Fact (High):** A normal PostgreSQL index build blocks table writes; `CREATE INDEX CONCURRENTLY` avoids that write-blocking lock but performs two scans, waits for old transactions/snapshots, takes longer, cannot run inside a transaction block, and can leave an invalid index after failure. Only one concurrent build per table runs at a time. Concurrent build on a partitioned parent is unsupported; build each partition concurrently and attach/create the parent index afterward. [S7]
- **Fact (High):** pgvector recommends concurrent production builds. HNSW and IVFFlat report build phases through `pg_stat_progress_create_index`; both can use parallel maintenance workers, but index scans themselves are not parallel. [S1][S3][S4]
- **Inference (High):** A model migration needs dual columns/indexes or a version-partitioned rollout. A single transaction cannot wrap `CREATE INDEX CONCURRENTLY`, and switching query expressions/operator classes is an application/configuration change, not an atomic index-format upgrade.

## WAL, replication, and backups

### Physical replication and PITR

- **Fact (High):** Build, insert, and vacuum paths use PostgreSQL Generic WAL; HNSW's optimized build WAL-logs completed pages, while online mutations log page changes. The repository has streaming-replica tests that build each index, then compare primary/replica ANN results after delete, vacuum, and insert cycles. [S11][S12][S14][S17][S18][S19]
- **Fact (High):** PostgreSQL WAL supports crash recovery, base-backup-plus-WAL PITR, and physical warm standbys. A physical backup preserves ANN pages and WAL history rather than retraining the index. [S20]
- **Recommendation (High):** Keep the same compatible pgvector binary available on primary and standby, test indexed queries after failover, monitor replay lag and WAL growth during builds/reindex/model refresh, and perform actual PITR drills. “Uses WAL” is not evidence that a particular backup chain is complete.

### Logical replication

- **Fact (High, PostgreSQL):** Logical replication copies table changes, but not schema or DDL. The subscriber must be provisioned with compatible extension types, tables, operator classes, and indexes; subscriber-side DML then maintains its local ANN index. [S21]
- **Inference (High):** Logical replicas need not have byte-identical ANN structures, and approximate results can differ after independent build/apply order even when visible rows match. Logical replication is suitable for independently queryable/sharded copies only if recall parity is tested rather than assumed.

### Logical dump/restore

- **Fact (High):** `pg_dump` produces a transactionally consistent logical snapshot and can restore across newer PostgreSQL versions/architectures, unlike physical backups. It reconstructs SQL objects/data; it is not WAL/PITR. [S22]
- **Inference (High):** Restoring index definitions rebuilds HNSW/IVFFlat from table data rather than preserving physical graph/centroids. The target must have a compatible pgvector extension installed. Restored ANN may be semantically valid but return different approximate candidates.
- **Recommendation (High):** Maintain both physical recovery and logical export paths. Verify extension installation/version, row counts/checksums, index validity, exact-vs-ANN recall, filtered short-result behavior, and application queries after every restore class.

## Scaling and hard/practical limits

### Limits ledger

| Limit | Value / behavior | Consequence |
|---|---|---|
| PostgreSQL relation size | 32 TB at default 8 KiB block size | applies per heap/index relation; practical limits arrive earlier |
| ANN indexed columns | one; no `INCLUDE`, unique, bitmap, or index-only scan | metadata stays in heap/separate indexes |
| `vector` / `halfvec` ANN dimensions | 2,000 / 4,000 | higher dimensions require quantization, subvector indexing, or reduction |
| `bit` ANN dimensions | 64,000 | binary quantization loses information; rerank required |
| `sparsevec` HNSW | 1,000 nonzeros | no IVFFlat sparse support |
| HNSW `m` / `ef_*` | `m` 2–100; `ef_construction` 4–1000; `ef_search` 1–1000 | bounded graph degree/search breadth |
| IVFFlat lists | 1–32,768 | center scoring is all-lists; scanned data is probes-dependent |
| index query parallelism | unsupported | one ANN scan is single-process even though builds can parallelize |

Sources: [S1][S3][S4][S8][S23].

### Scale-up and scale-out

- **Fact (High):** pgvector recommends reducing working set with `halfvec` or binary quantization, scaling a node with memory/CPU/storage, and scaling reads with PostgreSQL replicas. Indexes need not fit in memory, but performance normally improves when they do. [S1]
- **Fact (High):** Binary quantization and subvector expression indexes are candidate-generation techniques; the documented pattern over-fetches and reranks against the original full vector. pgvector does not expose product/scalar quantization, GPU execution, or a distributed global ANN index in the reviewed core. [S1]
- **Fact (High):** The project points to Citus, PgDog, or other sharding approaches, but distribution is outside pgvector's core access methods. [S1]
- **Inference (High):** A global top-k over shards requires fan-out and merge. To preserve recall, each shard must return enough local candidates, accounting for filters and uneven score distributions; `k` from every shard is safe for exact local top-k but not necessarily for bounded ANN recall. Replication scales reads, not writes, and introduces freshness lag.
- **Inference (High):** Partition-per-tenant improves isolation and filtered recall but increases relation/index count, planning/DDL/autovacuum overhead, and operational complexity. Thousands of partitions are technically possible, not automatically economical.

**Recommendation (High):** Scale in this order: measure exact baseline → HNSW with full vectors → half-precision index/full-vector rerank → binary/subvector candidate index/full-vector rerank → tenant/corpus partitioning → read replicas → explicit sharding. At every step preserve a canonical embedding outside the lossy index and compare against exact results.

## License and clean-room lessons

- **Fact (High):** pgvector's repository `LICENSE` is the PostgreSQL-style permissive license, with PostgreSQL and University of California copyright notices, permission to use/copy/modify/distribute, a notice-retention condition, and warranty/liability disclaimers. It is **not MIT**, Apache-2.0, or AGPL. [S24]
- **Fact (High):** The project credits the HNSW paper, Faiss, PASE, k-means++, triangle-inequality k-means, and sparse clustering work. Those are origins for algorithmic ideas; pgvector's license governs pgvector source copies, not every cited paper or third-party implementation. [S1][S25]
- **Recommendation (High):** Curiosity may depend on pgvector under its license, but distribution must preserve the required copyright/license text. Record version, source URL/commit, package origin, and modifications in third-party notices/provenance. Do not relabel copied pgvector code as Curiosity MIT code.
- **Recommendation (High):** Learn from public interfaces and algorithms, and implement any provider-neutral contract independently. If source is copied or modified, treat that as explicit third-party code with review and attribution—not “clean-room reimplementation.” This report copied no implementation.

## Curiosity implications and verdict ledger

### Adopt

1. **ADOPT — exact oracle (High).** Every ANN configuration needs repeatable exact top-k samples and recall-by-filter monitoring.
2. **ADOPT — PostgreSQL transaction boundary (High).** Co-locate canonical retrieval metadata, source version, tombstone, ACL projection, and embedding when one database can own their lifecycle.
3. **ADOPT — HNSW candidate generation (High).** Use as the default evaluated ANN path, with per-request/local `ef_search` and iterative-scan budgets.
4. **ADOPT — lossy candidate/full-vector rerank split (High).** Half/binary/subvector indexes are replaceable accelerators; canonical vectors make quality recoverable.
5. **ADOPT — WAL/PITR/replica discipline (High).** Reuse PostgreSQL's mature durability mechanisms, but verify extension-specific replay, restore, and failover.

### Adapt

1. **ADAPT — SQL operators behind a provider-neutral retrieval port (High).** Curiosity contracts should express metric, filters, candidate budget, approximation mode, and trace—not PostgreSQL operators/GUC names.
2. **ADAPT — filters into plan classes (High).** Route selective filters to exact search; stable tenant/corpus filters to partition/partial ANN; broad dynamic filters to iterative ANN with bounded over-fetch.
3. **ADAPT — index lifecycle as a versioned artifact (High).** Record model/dimension/precision/normalization, opclass, build commit/version, parameters, corpus cutoff, and recall report.
4. **ADAPT — short results as observable bounded behavior (High).** Return candidate/filtered counts and exhaustion reason; never silently imply corpus exhaustion.
5. **ADAPT — multitenancy (High).** Separate high-value or adversarial tenants by partition/table/database when recall and workload isolation matter; do not promise isolation from a shared graph.

### Reject

1. **REJECT — ANN as authorization (High).** Heap predicates still enforce ACLs, but post-filtered ANN can under-return. Authorization correctness and retrieval completeness are separate invariants.
2. **REJECT — ACID as a recall claim (High).** MVCC prevents invisible rows from being returned; it does not make bounded ANN exact or deterministic.
3. **REJECT — one global HNSW index for all models/metrics/tenants (High).** Dimensions, operator classes, normalization, filters, and tenant interference require explicit boundaries.
4. **REJECT — pgvector-specific SQL as the domain API (High).** It would couple Curiosity to one storage engine and make scale-out/reranker evolution expensive.
5. **REJECT — binary/half precision without original-vector reranking (High).** Compression is an index optimization, not a transparent representation.

### Deferred

1. **DEFER — IVFFlat (Medium/High).** Adopt only if measured build/memory benefits outweigh training, tuning, drift, and rebuild complexity.
2. **DEFER — cross-shard global ANN (High).** First prove one-node/partitioned quality and define merge/over-fetch/freshness semantics.
3. **DEFER — model-wide online index migrations (Medium).** Design dual-read/dual-index cutover only when model cadence requires it.
4. **DEFER — aggressive per-user ACL partitioning (Medium).** It does not scale to arbitrary memberships; first define canonical ACL and plan-selection policy.

## Verification checks before production reliance

1. **Exact recall matrix:** recall@k and returned-count rate for HNSW/IVFFlat across `k`, filter selectivity, tenant size, corpus age, duplicates, dead-tuple ratios, and cold/warm cache.
2. **MVCC check:** concurrent insert/update/delete/rollback under read committed, repeatable read, and serializable; verify no invisible rows and characterize serialization failures/ANN repeatability.
3. **Filter check:** compare metadata-index exact, shared ANN post-filter, iterative ANN, partial ANN, and partition-local ANN plans with `EXPLAIN (ANALYZE, BUFFERS)`.
4. **Vacuum torture:** concurrent writes, deletes, scans, autovacuum/manual vacuum, reindex, crash/restart; monitor graph errors, recall, bloat, locks, WAL, and latency.
5. **Drift check:** append embeddings from a shifted model/corpus distribution; measure IVFFlat list skew and recall before/after rebuild, and HNSW recall before/after reindex.
6. **Build failure check:** normal/concurrent build cancellation, disk exhaustion, invalid-index cleanup, partition attach, and workload impact.
7. **Recovery check:** physical failover, base backup + PITR, logical dump/restore, and logical subscriber; compare visible row checksums, exact top-k, ANN recall, and index validity.
8. **Capacity check:** heap/TOAST/index sizes, cache residency, single-scan CPU ceiling, insert/update throughput, replica lag, and worst-case iterative-scan memory.
9. **License/provenance check:** package origin, exact version/commit, license/notice retention, build flags, provider patch set, and upgrade/rebuild notes.

## Unknowns and negative results

- **Unknown:** Curiosity's latency/recall/write-throughput breakpoints for exact vs HNSW vs IVFFlat. Public heuristics cannot answer this.
- **Unknown:** Managed PostgreSQL providers' patch sets, allowed GUC ranges, extension upgrade timing, failover behavior, storage/WAL pricing, and support commitments.
- **Unknown:** A formal pgvector on-disk index-format compatibility policy. Historical changelog entries have required IVFFlat recreation after specific old upgrades; qualify every target upgrade and read its release notes. [S2]
- **Unknown:** Deterministic ANN parity after logical restore/replication or reindex. No such guarantee was found; mechanism suggests it should not be assumed.
- **Unknown:** Safe global defaults for autovacuum, `ef_search`, iterative caps, list/probe counts, partition size, and over-fetch. They are workload properties.
- **Negative result:** No native filter-aware multicolumn ANN, bitmap ANN scan, index-only ANN scan, parallel ANN query scan, distributed global index, GPU path, or built-in lexical/vector fusion was found in the reviewed core access methods. Full-text search plus application-side fusion/reranking is the documented hybrid pattern. [S1][S3][S4]
- **Negative result:** No source supports “replication means zero-staleness.” Physical replicas replay WAL asynchronously unless configured otherwise; read freshness remains an operational contract.
- **Negative result:** No source supports treating logical dump as preservation of physical ANN layout; it is a logical reconstruction path. [S22]
- **Negative result:** No empirical test was run in this research, so source-level mechanisms are high confidence but performance and quality recommendations remain conditional.

## Bounded curiosity pass

Scoring: 1–5 each for relevance (R), decision value (V), novelty (N), and cost (C, lower is better). Priority = R + V + N − C.

| Gap/thread | R | V | N | C | Priority | Outcome |
|---|---:|---:|---:|---:|---:|---|
| ANN filter execution and iterative continuation | 5 | 5 | 4 | 2 | 12 | Pursued through access-method and scan source [S3][S4][S5] |
| MVCC/dead tuples/vacuum graph repair | 5 | 5 | 5 | 3 | 12 | Pursued through PostgreSQL locking and both vacuum paths [S15][S17][S18] |
| WAL replay and backup semantics | 5 | 5 | 3 | 2 | 11 | Pursued through Generic WAL source/tests and PostgreSQL recovery docs [S19][S20] |
| IVFFlat drift mechanism | 4 | 4 | 4 | 2 | 10 | Pursued through fixed-center insert/build source [S13][S14] |
| Empirical Curiosity benchmark | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO:** no implementation/benchmark authority in declared frame |
| Managed-provider divergence survey | 3 | 4 | 3 | 5 | 5 | **CURIOSITY_NO_GO:** provider scope unbounded; core pgvector requested |
| Exhaustive commit-by-commit bug archaeology | 3 | 3 | 4 | 5 | 5 | **CURIOSITY_NO_GO:** recent material fixes captured; low marginal decision value |
| Reproduce algorithms from source | 2 | 1 | 4 | 5 | 2 | **CURIOSITY_NO_GO:** implementation prohibited and unnecessary; clean-room boundary |

**Stop condition:** Requested topics are covered and the highest-value mechanism contradictions—transactional visibility vs ANN recall, filter ordering, vacuum repair, and physical vs logical replication—are resolved or explicitly bounded. Remaining high-value questions require workload benchmarks, managed-provider access, or implementation authority.

## Source register

All sources are primary project source/documentation or primary PostgreSQL documentation, accessed **2026-08-17**. GitHub source links are pinned to the reviewed commit.

- **[S1]** pgvector [`README.md`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/README.md) — public contract, query forms, types, index guidance, filtering, iterative scans, operations, scaling, dimensions, and FAQ.
- **[S2]** pgvector [`CHANGELOG.md`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/CHANGELOG.md) — version boundary, recent fixes, historical compatibility and feature changes.
- **[S3]** pgvector [`src/hnsw.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/hnsw.c) — GUCs, options, cost model, and HNSW access-method capabilities.
- **[S4]** pgvector [`src/ivfflat.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/ivfflat.c) and [`src/ivfscan.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/ivfscan.c) — options, cost model, AM capabilities, center/list selection, sorting, iterative scans.
- **[S5]** pgvector [`src/hnswscan.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/hnswscan.c) — graph traversal, MVCC requirement, scan/vacuum locking, strict/relaxed continuation and bounds.
- **[S6]** [HNSW paper](https://arxiv.org/abs/1603.09320) — algorithm origin credited by pgvector; conceptual triangulation, not evidence of pgvector's exact implementation.
- **[S7]** PostgreSQL 18 [`CREATE INDEX`](https://www.postgresql.org/docs/18/sql-createindex.html) — partial/expression indexes, concurrent build lifecycle and partition limitations.
- **[S8]** pgvector type headers: [`vector.h`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/vector.h), [`halfvec.h`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/halfvec.h), [`sparsevec.h`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/sparsevec.h), and ANN headers [`hnsw.h`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/hnsw.h), [`ivfflat.h`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/ivfflat.h) — layouts and hard limits.
- **[S9]** pgvector [`sql/vector.sql`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/sql/vector.sql) — type storage settings, operators, parallel-safe functions, access methods, and operator classes.
- **[S10]** pgvector [`src/hnsw.h`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/hnsw.h), [`src/hnswutils.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/hnswutils.c), and duplicate handling in [`src/hnswinsert.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/hnswinsert.c) — graph representation, levels, dimensions/nonzeros, duplicate heap TIDs.
- **[S11]** pgvector [`src/hnswbuild.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/hnswbuild.c) — memory/on-disk phases, parallel build, and final WAL page logging.
- **[S12]** pgvector [`src/hnswinsert.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/hnswinsert.c) — online locking, neighbor mutation, Generic WAL, and skipped null values.
- **[S13]** pgvector [`src/ivfbuild.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/ivfbuild.c) and [`src/ivfkmeans.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/ivfkmeans.c) — sampling, k-means, centers, list pages, and build memory.
- **[S14]** pgvector [`src/ivfinsert.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/ivfinsert.c) — nearest fixed-center insertion, page chains, and Generic WAL.
- **[S15]** PostgreSQL 18 [Index Locking Considerations](https://www.postgresql.org/docs/18/index-locking.html) — heap/index ordering, MVCC safety, pins, asynchronous TID collection, predicate locks.
- **[S16]** PostgreSQL 18 [Routine Vacuuming](https://www.postgresql.org/docs/18/routine-vacuuming.html) — MVCC row versions, dead-space reuse, autovacuum, statistics, and visibility.
- **[S17]** pgvector [`src/ivfvacuum.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/ivfvacuum.c) — dead tuple deletion and free-page reuse.
- **[S18]** pgvector [`src/hnswvacuum.c`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/src/hnswvacuum.c) — multi-pass heap-TID removal, graph repair, deletion, and concurrency controls.
- **[S19]** pgvector WAL/concurrency tests: [`001_ivfflat_wal.pl`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/test/t/001_ivfflat_wal.pl), [`010_hnsw_wal.pl`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/test/t/010_hnsw_wal.pl), [`046_hnsw_vacuum_scan.pl`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/test/t/046_hnsw_vacuum_scan.pl), [`047_hnsw_vacuum_insert.pl`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/test/t/047_hnsw_vacuum_insert.pl) — streaming replay and concurrent maintenance coverage.
- **[S20]** PostgreSQL 18 [Continuous Archiving and PITR](https://www.postgresql.org/docs/18/continuous-archiving.html) — WAL, crash recovery, physical backups, PITR, and warm standby.
- **[S21]** PostgreSQL 18 [Logical Replication Restrictions](https://www.postgresql.org/docs/18/logical-replication-restrictions.html) — schema/DDL are not replicated.
- **[S22]** PostgreSQL 18 [SQL Dump](https://www.postgresql.org/docs/18/backup-dump.html) — logical snapshot, restore, portability, and distinction from physical/WAL backup.
- **[S23]** PostgreSQL 18 [Limits](https://www.postgresql.org/docs/18/limits.html) — 32 TB relation limit at default block size and general relation/index limits.
- **[S24]** pgvector [`LICENSE`](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/LICENSE) — PostgreSQL-style license terms and notices.
- **[S25]** pgvector README [acknowledgements](https://github.com/pgvector/pgvector/blob/36c26ba17644aeb63707f536287a0265c5309234/README.md#thanks) — algorithm and project origins credited upstream.
- **[S26]** PostgreSQL 18 [Heap-Only Tuples](https://www.postgresql.org/docs/18/storage-hot.html) — HOT update conditions and index-entry avoidance.

## Overall confidence

**High** for public type/operator limits, access-method flags, scan/build/update/vacuum mechanisms, WAL use, PostgreSQL MVCC/concurrent-build/backup contracts, and license text. **Medium** for planner outcomes in complex queries, graph nondeterminism, drift impact, and scale-out consequences because they are mechanism-derived and workload-sensitive. **Low / unknown** for Curiosity-specific quality/latency thresholds, managed-provider behavior, safe universal tuning, and on-disk compatibility beyond reviewed release notes.
