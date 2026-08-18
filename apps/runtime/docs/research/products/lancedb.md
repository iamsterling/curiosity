# LanceDB / Lance storage architecture: clean-room reverse engineering

**Research and source-access date:** 2026-08-17  
**Decision:** whether Lance's open table/storage architecture and LanceDB's
retrieval model should influence, or become a dependency of, Curiosity's owned
search and evidence plane.  
**Scope:** Lance file/table/index formats, LanceDB OSS, and the documented
LanceDB Enterprise boundary. Cloud/Enterprise is covered only far enough to
separate open storage mechanics from commercial distributed serving.  
**Status:** research and recommendations, not implementation, benchmark,
security audit, legal advice, or production approval.

## 1. Frame, bounded questions, and method

### Bounded sub-questions

1. How does Lance turn column files, fragments, manifests, and object-store
   primitives into versioned tables?
2. How do vector, full-text, and scalar indexes remain correct as rows are
   appended, updated, deleted, and compacted?
3. Where are filters applied, how are indexed and unindexed data combined, and
   what can query plans reveal?
4. Which distribution, consistency, security, and operations properties belong
   to open Lance/LanceDB versus commercial LanceDB Enterprise?
5. Which ideas transfer clean-room into Curiosity, and which dependencies or
   assumptions should be rejected or deferred?

### Evidence and clean-room boundary

Official Lance format specifications, official Lance/LanceDB documentation,
and the two official repository license files were read. No credentials,
service calls, private artifacts, traffic interception, decompilation, or
performance tests were used. No source code or file-format implementation is
copied here. Format descriptions are summarized at the architectural level and
remain attributable to their Apache-2.0 sources. Enterprise claims are vendor
claims, not independently audited facts. All sources in the ledger were
accessed 2026-08-17.

Evidence labels:

- **FACT** — directly documented by a cited primary source.
- **INFERENCE** — a bounded conclusion consistent with those facts, but not a
  directly verified implementation claim.
- **RECOMMENDATION** — a Curiosity design or adoption decision.
- Confidence is **high**, **medium**, or **low**.

## 2. Executive conclusion

**RECOMMENDATION — ADAPT the architecture; DEFER adopting Lance as Curiosity's
canonical store pending a targeted proof (high confidence).** Lance is a strong
candidate storage substrate, not a complete evidence/search system. Its most
important idea is the composition of:

```text
immutable column pages
  -> horizontal fragments with independently attachable column files
  -> one immutable manifest per table snapshot
  -> MVCC / optimistic commit over object-store conditional writes
  -> immutable, partial-coverage secondary-index segments
  -> indexed plan + exact scan of the unindexed tail
  -> background index catch-up, compaction, and retention cleanup
```

That is unusually well aligned with Curiosity's need to retain immutable source
evidence while recomputing derived text, embeddings, metadata, and rank signals.
Lance's two-dimensional fragment layout allows a new derived column to be
attached without rewriting unrelated bytes; versioned manifests make snapshots
reproducible; and index coverage is explicit enough that fresh writes can remain
queryable through a slower exact path [S1–S4, S10].

However, LanceDB does **not** by itself supply Curiosity's canonical-document
model, crawl policy, source licensing, content hashes, passage provenance,
document-level authorization, rank calibration, relevance evaluation, or
untrusted-content boundary. Its default `_rowid` is a physical row address and
changes across rewrites unless stable row IDs are enabled at table creation;
even stable row IDs are table-local engine identity, not a substitute for a
Curiosity document/version ID [S5]. OSS is an embedded library, not a
multi-tenant authenticated server, while Enterprise adds a commercial remote
service and operational behavior not conveyed by the Apache license [S17–S20].

The preferred direction is therefore:

1. retain provider-neutral evidence and retrieval contracts above storage;
2. pilot Lance behind a storage adapter using an immutable representative
   corpus and a judged hybrid-search set;
3. require snapshot replay, deletion/retention, index-catch-up, crash recovery,
   object-store cost, ACL filtering, and migration tests before adoption; and
4. treat Enterprise as a separate procurement/security decision, not as an
   automatic consequence of selecting the Lance format.

## 3. Product and project boundaries

### 3.1 Lance versus LanceDB

**FACT (high):** Lance is an open columnar lakehouse format comprising a file
format, table format, index formats, and catalog/namespace specifications.
LanceDB is a retrieval/database layer built on Lance. LanceDB OSS runs embedded
inside the application process; LanceDB Enterprise is a remote distributed
cluster accessed through `db://` connections [S1, S17, S21].

**INFERENCE (high):** three contracts must not be conflated:

| Layer | What is open/documented | What it does not guarantee |
| --- | --- | --- |
| Lance file/table/index format | Durable bytes, snapshots, transactions, row/index metadata | A hosted server, scheduler, ACL system, relevance quality |
| LanceDB OSS | Embedded table/search API and DataFusion-based execution | Independent service isolation, HA, automatic maintenance |
| LanceDB Enterprise | Commercial remote serving, caches, control/data planes, background jobs | Apache-licensed service implementation or feature parity with OSS |

**FACT (high):** both official `lance-format/lance` and `lancedb/lancedb`
repository license files are Apache License 2.0. The Lance license also retains
MIT notices for adapted Polars and Quickwit bitpacking material. Apache-2.0
conditions include license/notice retention, marking modified files, and a
patent grant with termination conditions. Trademark permission is not granted
beyond customary attribution. Enterprise is described as a commercial product
[S21–S23].

**RECOMMENDATION (high):** if Curiosity later links or redistributes OSS code,
record the exact artifacts and versions in `provenance/`, retain all LICENSE and
NOTICE obligations, and run dependency/license review. Architectural learning
alone does not authorize copying implementation details, marks, benchmarks, or
commercial Enterprise components.

## 4. Columnar file and table architecture

### 4.1 The file container

**FACT (high):** a Lance data file is columnar, Arrow-oriented, and designed for
object-store range reads and random access. Unlike Parquet it has no row-group
layer: each column independently owns one or more large disk pages. Page and
encoding descriptors plus offset tables live near the file tail; a fixed footer
locates them. A reader first resolves metadata, then fetches only the pages and
byte ranges needed for selected columns and row ranges. The specification
recommends roughly 8 MiB pages and 64-byte buffer alignment as defaults, not as
semantic requirements [S1].

**FACT (high):** the encoding layer separates Arrow data types from physical
layouts. Small values use mini-block-oriented layouts to cap point-read
amplification; larger values such as embeddings use layouts optimized to avoid
per-block metadata overhead; very large blobs can be stored out-of-line and
read lazily. A reader-side search cache retains page/encoding lookup metadata,
while full scans can often avoid it [S2].

**INFERENCE (high):** the no-row-group design deliberately decouples three
dimensions that conventional analytic formats often tie together: column page
size, scanner partitioning, and writer memory. This improves selective
retrieval, but creates a specialized format whose performance and compatibility
must be tested with Curiosity's access patterns rather than inferred from
vendor benchmarks.

### 4.2 Fragments and two-dimensional evolution

**FACT (high):** a table snapshot is a set of fragments. A fragment is a
horizontal row partition with one or more data files, each of which can contain
only a subset of columns, plus at most one deletion file for that fragment in a
given version. A manifest holds the complete schema, fragment list, monotonically
increasing version, and optional index section. Every manifest is immutable and
describes one complete snapshot [S3].

**FACT (high):** this is a two-dimensional layout: fragments partition rows;
files inside a fragment partition columns. Adding or recomputing a column can
write a new file for that column and attach it to existing fragments. Dropping a
column can be metadata-only; replacing a column tombstones its old field mapping
and attaches a new file. Missing field data reads as null [S3, S11].

**INFERENCE (high):** this is the most transferable Lance concept for
Curiosity. Raw captures, normalized text, passages, embeddings, ACL projections,
spam signals, and rank features can evolve independently. A parser migration
need not rewrite raw captures. The architecture is useful even if the eventual
storage format is not Lance.

### 4.3 Versions, snapshots, branches, and format compatibility

**FACT (high):** writes create new table versions rather than replacing the
active snapshot in place. Old snapshots share unchanged files; a hundred
versions are not a hundred full data copies, though manifests and retained files
add metadata and storage overhead. Readers can check out versions, restore an
old snapshot as a new current version, and attach tags. Tagged versions are
exempt from ordinary cleanup until the tag is removed. Branches are writable
histories implemented as shallow-clone-like datasets beneath the table tree
[S4, S6].

**FACT (high):** file-format compatibility and SDK/API compatibility are
separate. Stable `data_storage_version` values are intended as a long-term read
contract; the `next` alias and currently documented 2.3 format are unstable and
not for production. Older clients may not read formats introduced later. Table
feature flags require unknown reader/writer features to be rejected rather than
silently ignored [S7, S23].

**RECOMMENDATION (high):** Curiosity should pin an explicit stable format and
SDK compatibility matrix in deployment, reject mixed writers not proven safe,
and bind each evidence citation to its own document/capture version in addition
to the storage table version. A table snapshot proves which rows were visible;
it does not identify the precise source bytes unless Curiosity stores that
identity explicitly.

## 5. Object-store and transaction model

### 5.1 Physical layout and portability

**FACT (high):** a basic dataset root contains separate paths for data files,
manifests, transactions, deletion vectors, index directories, references, and
branches. Manifests can register multiple base paths so different data,
deletion, or index files live in distinct roots/buckets. The specification uses
this for hot/cold tiers, regional placement, and shallow clones. Within one root,
relative paths allow a complete dataset directory to be copied without rewriting
file references [S8].

**FACT (high):** the optional latest-version hint accelerates table opening but
is not authoritative; readers must remain correct if it is missing or stale.
Reverse-sorted v2 manifest names make the latest version discoverable through a
lexicographic object listing and avoid listing every historical version [S8,
S9].

**INFERENCE (medium-high):** open table bytes materially reduce lock-in, but
multi-base datasets weaken simple portability: a copied root can still reference
other buckets, credentials, or regions. A portability drill must discover and
copy every base path, index artifact, tag/branch, and retained version needed by
policy.

### 5.2 ACID, MVCC, and concurrent commits

**FACT (high):** Lance uses MVCC and optimistic concurrency. A transaction is
built from a `read_version`; commit creates a new immutable manifest using an
atomic rename-if-absent or put-if-absent primitive. If another writer wins,
Lance compares transaction operations, then rebases, asks the application to
retry, or rejects an incompatible conflict. Concurrent appends are broadly
compatible; overlapping rewrites, updates, deletes, restores, and index builds
have operation-specific conflict rules [S9].

**FACT (high):** on stores lacking safe conditional creation, an external
manifest store or custom commit lock is needed. The external store serializes
version reservation, but finalized canonical manifest bytes remain in object
storage. Official docs specifically warn that Tencent COS does not reliably
provide the required conditional write on buckets that have ever enabled
versioning, and mixed old/new GooseFS writers can be unsafe [S9, S12].

**INFERENCE (high):** “object-store native” does not mean “every S3-compatible
endpoint is transactionally safe.” The relevant contract is atomic create at a
specific key under all deployed writer versions. Provider compatibility must be
tested, and every writer must share the same commit protocol.

### 5.3 Consistency and caching

**FACT (high):** an OSS/SDK connection can use no automatic cross-process
refresh (default), check for new versions on every read, or accept an eventual
refresh interval. Stronger freshness costs extra object-store metadata work.
Remote table clients also send freshness bounds, preserve read-your-own-write on
the connection, and maintain a highest-observed-version watermark so successive
reads do not move backward across differently cached query nodes [S13].

**RECOMMENDATION (high):** Curiosity batch/research executions should pin a
snapshot at the start and report it. Interactive “latest” reads need an explicit
freshness SLO; an unset/default refresh policy is not a freshness guarantee.
Never let a cache silently mix retrieval lanes from different table versions.

## 6. Index architecture

### 6.1 Index segments and partial coverage

**FACT (high):** Lance indexes are immutable, redundant structures layered over
table row identifiers, not embedded into base data pages. One logical named
index contains one or more physical segments. Each segment covers a disjoint set
of fragments recorded in a fragment bitmap; segments need not cover the whole
table. An engine can query usable segments, scan uncovered fragments, and merge
the results. Unsupported index types or format versions are skipped in favor of
scanning rather than making the table unreadable [S10].

**FACT (high):** index artifacts live under UUID-named index directories and are
published transactionally by a new manifest. Segments are loaded on demand and
can progressively read only relevant pages. Deleted rows referenced by immutable
segments are removed using deletion vectors/current fragment validity. If an
indexed column is updated in place, affected fragments are removed from that
segment's coverage until reindexed [S10].

**INFERENCE (high):** partial coverage is both a correctness strength and an
operations hazard. The exact fallback makes fresh results visible, but latency
can degrade gradually as the unindexed tail grows. `num_unindexed_rows` is a
service-level health metric, not just maintenance trivia.

### 6.2 Vector indexes

**FACT (high):** Lance composes vector indexing from three axes:

- IVF partitions vectors using k-means centroids and limits a query to selected
  partitions;
- the in-partition method is flat scan or HNSW; LanceDB exposes HNSW inside IVF,
  not as a global top-level graph;
- storage is full precision or compressed with PQ, scalar quantization, or
  RaBitQ-style quantization [S14, S15].

Supported product combinations include IVF-FLAT, IVF-PQ, IVF-SQ, IVF-RQ, and
IVF-HNSW with flat/PQ/SQ variants. Float search supports L2, cosine, and dot as
documented by index type; packed binary vectors use IVF-FLAT with Hamming.
Current vector format v3 stores index structure and quantized vectors in regular
Lance files, with centroids/codebooks and row identifiers as index metadata/data
[S14, S15].

**FACT (high):** query-time controls include top-k, minimum/maximum partition
probes, HNSW `ef`, a refine factor, a distance range, and explicit index bypass.
Refinement over-retrieves compressed candidates, reads full vectors, and
reranks. Bypass performs exhaustive search and can establish sampled recall
ground truth. A query must use the metric with which its index was built [S14].

**RECOMMENDATION (high):** do not accept an ANN default without corpus-specific
recall measurement. Curiosity should retain lexical and exhaustive sampled
baselines, record index type/version/metric/probe/refinement settings in its
retrieval trace, and separate vector distance from factual confidence.

### 6.3 Full-text and scalar indexes

**FACT (high):** current LanceDB FTS is Lance-native, replacing legacy
Tantivy-only API options. It uses an inverted index and BM25 scoring. Its on-disk
format has token dictionary, document statistics, compressed postings, and
metadata; optional token positions enable phrase queries but materially increase
index and temporary-build size. Every FTS partition is searched and results are
combined, so fewer/larger partitions generally improve query performance [S16,
S24].

**FACT (high):** tokenization is configurable: simple/whitespace/raw/ngram,
Unicode-aware ICU, and optional language-model/dictionary-backed Jieba or
Lindera paths. Filters include case normalization, stemming, stop words,
maximum token length, and ASCII folding. Phrase search requires stored positions
and, for exact stop-word phrases, retaining stop words. FTS can return BM25
`_score`; structured lower-level index query types include match, phrase,
boolean, multi-match, and boosts [S16, S24].

**FACT (high):** scalar indexes include B-tree for ranges/high-cardinality
values, bitmap for lower-cardinality fields, label-list for list containment,
and FM-index for raw substring matching. Scalar indexes can accelerate
standalone filters and prefilters for vector or FTS searches [S25].

**INFERENCE (high):** Lance provides a credible owned hybrid candidate layer,
not a web-search ranker. BM25/vector scores still need corpus-specific
normalization, duplicate/authority/freshness features, source diversity, and
evaluation. Analyzer configuration is part of the index's semantic version and
must be preserved with results.

### 6.4 Hybrid search and reranking

**FACT (high):** LanceDB hybrid search executes a vector lane and FTS lane, then
combines them through a reranker. Reciprocal Rank Fusion is the documented
default; custom and external-model rerankers are also supported. The same
metadata filter and pre/postfilter choice applies to both lanes [S26].

**RECOMMENDATION (high):** adapt the two-lane/fusion pattern, but keep Curiosity's
provider-neutral stage contract above LanceDB. Store each lane's candidate rank
and raw provider-local score before fusion, plus duplicate cluster, source
class, freshness, policy, and final rerank reasons. RRF is a baseline, not an
authority model.

## 7. Filtering and query execution

**FACT (high):** LanceDB uses DataFusion SQL expressions for filtering in scans,
vector search, updates, and deletes. Prefiltering is the default: the metadata
predicate constrains the rows considered by search. Postfiltering applies the
predicate after ranked top-k and may return fewer than the requested limit.
Frequently filtered columns should have scalar indexes [S25, S27].

**FACT (high):** filtered ANN can adaptively search more IVF partitions when too
few rows survive, bounded by minimum and maximum probe settings. For highly
selective filters the docs recommend higher probes or bypassing the vector index
for an exact scan. HNSW-backed IVF is documented as having greater latency
variance under filtered workloads than IVF-PQ/RQ [S14, S25].

**FACT (high):** `explain_plan` exposes the resolved execution plan;
`analyze_plan` executes it and reports operator rows, compute time, bytes, I/O
requests, index comparisons, and loaded index parts. Enterprise can return
aggregate or per-worker metrics. Plans reveal projection pushdown, scalar index
use, ANN partitions, exact scans, remote takes, and whether filtering was pushed
down [S27].

**INFERENCE (medium):** the filtering page's statement that both pre- and
postfiltering can yield “false positives” is imprecise. The described mechanism
is principally ANN recall loss or a short top-k after filtering, not permission
to return rows that violate a deterministic filter. Exact filter correctness
still requires an empirical canary because the terminology is ambiguous [S25].

**RECOMMENDATION (high):** Curiosity authorization filters must be mandatory,
prefiltered, scalar-indexed, and rechecked before output. Performance-driven
postfiltering is unacceptable for ACL enforcement. A missing/unsupported ACL
index must fail closed or execute an exact authorized scan, never skip the ACL.

## 8. Updates, deletes, compaction, and cleanup

### 8.1 Update mechanics

**FACT (high):** the user-facing write families are filtered `update`, keyed
`merge_insert`/upsert, append, and delete. At the transaction level an update can
rewrite selected rows into new fragments while tombstoning old copies, or
rewrite affected column files when most rows but few columns change. Primary-key
metadata is explicitly unenforced for ordinary writes; merge/upsert or external
deduplication is still required [S3, S9, S11].

**FACT (high):** updated rows remain searchable, but are moved outside the old
index coverage and use the slower unindexed path until index maintenance.
Merge-insert benefits from a scalar index on the join key [S11].

### 8.2 Deletes and retention

**FACT (high):** delete is initially logical. A fragment's deletion vector stores
deleted offsets as Arrow IPC for sparse deletions or Roaring bitmap for dense
deletions. Readers and indexes exclude those rows, but the source bytes remain in
data files and older snapshots until compaction and version cleanup make them
unreferenced [S3, S11].

**FACT (high):** compaction rewrites fragments to remove deleted rows and dropped
columns and merge small fragments. It improves reads but writes new files while
old versions still reference old files, so storage can temporarily rise. Space
is reclaimed only when old versions and unreferenced files are pruned. LanceDB
documents a seven-day cleanup default for `optimize()`; tagged snapshots remain
retained [S4, S11, S28].

**INFERENCE (high):** `delete()` is not an erasure API. Any legal/privacy deletion
SLO must include live-view removal, index exclusion, snapshot/tag inventory,
backup/object-version handling, compaction, pruning, and verification that no
retained base path still references the bytes.

### 8.3 Compaction and index correctness

**FACT (high):** compaction changes physical row addresses. Lance can let old
index segments become uncovered, rewrite segment addresses, or use a fragment
reuse index to remap old addresses. Stable row IDs avoid address changes at the
logical level but require an extra ID-to-address lookup; stable-ID index support
is still described as experimental/in progress in the format docs [S5, S10].

**FACT (high):** LanceDB `optimize()` combines fragment compaction, old-version
cleanup, and incremental updates to vector, scalar, and FTS indexes. New writes
remain complete through indexed results plus exact scans of unindexed fragments;
`fast_search()` deliberately skips the exact tail and can return stale/incomplete
results. OSS maintenance is operator-managed; Enterprise documents asynchronous
background maintenance [S14, S16, S28].

**RECOMMENDATION (high):** Curiosity should never use “fast indexed only” for an
evidence-complete or deletion-sensitive query unless the response explicitly
declares the missing tail and the caller accepts it. Alert on unindexed rows,
small-fragment count, deletion density, retained-version age, cleanup failures,
and temporary compaction headroom.

## 9. Identity and lineage

**FACT (high):** without stable IDs, `_rowid` equals a physical 64-bit row
address formed from fragment ID and local offset, and changes after compaction or
row-moving updates. Stable row IDs must be enabled when the dataset is first
created and cannot currently be enabled later. When enabled, rows receive a
monotonic table-local ID, preserve it across updates, and can expose created-at
and last-updated-at table versions for incremental processing [S5].

**FACT (high):** official docs acknowledge that some code/documentation may still
mix “row ID,” “row address,” and “stable row ID.” Secondary indexes primarily
reference physical addresses; stable-ID index use remains evolving [S5, S10].

**RECOMMENDATION (high):** use a Curiosity-owned immutable `document_id`,
`capture_version_id`, and `passage_id` as table columns and scalar indexes.
Enable stable row IDs only as an engine optimization. Never expose `_rowid` as a
durable citation or cross-table identity.

## 10. Distributed and Cloud/Enterprise boundaries

### 10.1 Open Lance distribution

**FACT (high):** Lance supports a two-phase distributed write: workers write
independent fragments, then one coordinator collects fragment metadata and
commits one table transaction. Distributed column backfills use the same pattern.
Lance supplies Ray and Spark integrations, but the core custom workflow leaves
scheduling and orchestration to the caller [S29].

**FACT (high):** distributed index workers write uncommitted index segments;
the caller decides whether to keep or merge them and commits disjoint fragment
coverage as one logical index. Independent vector workers may train separate
IVF/PQ models and remain separate physical segments; segments intended for
physical merge need compatible shared model artifacts. Uncommitted directories
remain garbage until age-based cleanup [S30].

**INFERENCE (high):** open Lance is a distributed-storage building block, not a
distributed database service. The owner must supply job scheduling, retries,
resource isolation, queueing, idempotency, orphan cleanup, availability, and
operational admission control.

### 10.2 Enterprise architecture

**FACT (medium-high, vendor claim):** Enterprise separates control plane,
query/planning nodes, read executors and caches, write/WAL paths, monitoring/job
coordination, and durable object storage. Query serving, indexing, and compaction
can use separate workers; table and index files remain in object storage rather
than becoming node-local truth. Managed and BYOC deployments are documented for
AWS, GCP, and Azure [S17–S19].

**FACT (high):** `db://` tables are remote service objects, not direct object
paths. The cluster owns storage credentials; runtime `storage_options` are not
passed by clients. Enterprise supports API keys and OAuth client-credentials;
Azure managed identity avoids a stored client secret. Client/table semantics
are similar but not identical to OSS, and remote tables intentionally omit some
whole-table materialization APIs [S17–S20].

**CONTRADICTION RETAINED (medium):** the architecture and indexing pages describe
indexers/background maintenance as present, while the Enterprise overview labels
“distributed search” and expanded “distributed indexing and compaction” as
coming soon. The defensible interpretation is that some cluster-managed
maintenance exists, but the extent of fully distributed large-table execution
is version/deployment dependent and not established by public docs [S14, S17,
S18].

**RECOMMENDATION (high):** treat Enterprise capability as a dated deployment
matrix to verify contractually and empirically. Do not infer that selecting the
open format grants the commercial control plane, scheduler, cache, HA, security
operations, or support.

## 11. Operations, security, and trust

### 11.1 OSS operations

**FACT (high):** object-store choices include S3/S3-compatible storage, GCS,
Azure Blob, and additional documented backends. Configuration includes
credentials, timeouts, retries, TLS controls, proxy settings, S3 server-side
encryption/KMS, and backend-specific commit constraints. Documentation exposes
insecure `allow_http` and certificate-validation bypass options explicitly for
testing; they default off [S12, S31].

**FACT (high):** OSS can emit object-store request count, bytes, duration,
errors, in-flight, throttling, and retryable-response metrics through a metrics/
OpenTelemetry bridge. Query `analyze_plan`, index statistics, table versions,
and fragment/cleanup results add separate operational evidence [S27, S32].

**INFERENCE (high):** because OSS is embedded, its authentication boundary is
the application and object-store IAM. LanceDB OSS does not become secure merely
because files are local or encrypted: any process/principal with raw bucket
access can potentially read manifests, source content, vectors, deleted-but-
retained bytes, and index artifacts.

### 11.2 Enterprise security claims

**FACT (medium, vendor claim):** LanceDB states Enterprise maintains SOC 2 Type
II, HIPAA, and GDPR compliance/support, encrypts object-store and cache data at
rest, and receives only health telemetry from customer deployments. Managed
deployment runs in vendor-managed accounts; BYOC runs inside the customer's
cloud account and is positioned for residency/direct-object-access needs. The
public Trust Center, not the accessed page, holds detailed reports [S19, S20,
S33].

**UNKNOWN:** public sources reviewed did not establish document/row-level RBAC,
per-result authorization traces, key ownership/rotation detail outside S3 KMS
configuration, audit-log schema/retention, query-text retention, telemetry field
inventory, deletion SLA, backup policy, RPO/RTO, penetration-test results, or
certification scope/exceptions.

**RECOMMENDATION (high):** Curiosity must implement authorization and policy as
provider-neutral retrieval invariants. Keep source content untrusted; validate
types and bounds; never execute text retrieved from a Lance table as agent
instructions. For Enterprise, require a DPA/security review and written answers
to every unknown above. For OSS, use least-privilege workload identities, TLS,
customer-managed encryption where required, private endpoints, bucket-prefix
isolation, secret management, and independently tested backup/restore.

## 12. Clean-room verdict ledger

### Adopted

1. **ADOPT — immutable snapshot manifests (high confidence).** Every write
   creates a replayable table state; query/evaluation runs pin and report it.
2. **ADOPT — two-dimensional derived-column storage (high).** Keep expensive
   source evidence separate from independently replaceable extraction,
   embedding, ACL, and ranking columns.
3. **ADOPT — explicit partial index coverage (high).** Track covered fragments
   and unindexed rows; combine index and exact-tail plans for correctness.
4. **ADOPT — immutable index segments (high).** Publish segments transactionally,
   load on demand, and rebuild without mutating prior snapshots.
5. **ADOPT — explain/analyze plans (high).** Persist bounded plan identity and
   stage metrics for retrieval regressions and cost diagnosis.
6. **ADOPT — separate compaction from cleanup (high).** Read optimization and
   physical erasure are different lifecycle events with separate SLOs.

### Adapted

1. **ADAPT — Lance versions into evidence versions (high).** A table snapshot is
   useful but insufficient; add document/capture/parser/passage identities and
   hashes.
2. **ADAPT — hybrid search (high).** Preserve lexical and vector lanes, then add
   Curiosity-owned authority, freshness, duplicate, diversity, policy, and
   evidence reranking.
3. **ADAPT — stable row IDs (high).** Enable where beneficial, but use domain IDs
   as durable identity and treat row IDs as storage-local.
4. **ADAPT — object-store portability (medium-high).** Require a complete
   base-path/catalog/reference export and restore drill, not merely open bytes.
5. **ADAPT — branch/tag workflows (medium).** Tags can preserve important
   evaluation snapshots; enforce quotas and retention review so they cannot
   defeat deletion obligations indefinitely.
6. **ADAPT — background maintenance (high).** Use bounded, observable jobs with
   admission control, retries, temporary-space budgets, and explicit completion.

### Rejected

1. **REJECT — LanceDB as the domain/evidence contract (high).** Storage-specific
   table, row, index, and service concepts stay behind provider-neutral APIs.
2. **REJECT — `_rowid` as citation identity (high).** Default IDs move; stable
   IDs remain engine-local.
3. **REJECT — indexed-only fast search as an undeclared default (high).** It can
   omit fresh/unindexed rows.
4. **REJECT — soft delete as erasure (high).** Bytes can remain in files,
   versions, tags, clones, backups, and object-store versions.
5. **REJECT — postfilter authorization (high).** ACLs must constrain candidate
   generation and be rechecked before release.
6. **REJECT — vector/BM25 score as truth (high).** Scores are rank features, not
   factual confidence or source authority.

### Deferred

1. **DEFER — Lance as canonical Curiosity storage (high).** Pending the validation
   gates below and an ADR if the dependency becomes consequential.
2. **DEFER — Enterprise procurement (high).** Commercial maturity, security,
   retention, distributed-feature status, costs, and SLOs need separate review.
3. **DEFER — branches for live production workflows (medium).** First prove
   lifecycle, merge semantics, cleanup, and deletion propagation.
4. **DEFER — experimental stable-ID indexing, overlay files, unstable 2.3
   encodings, and experimental FTS layouts (high).** Use only in isolated
   benchmarks until compatibility contracts stabilize.

## 13. Curiosity-specific data and retrieval implications

**RECOMMENDATION (high):** if piloted, map Curiosity artifacts approximately as
follows without exposing Lance types at the API boundary:

| Curiosity concept | Storage implication |
| --- | --- |
| immutable fetch/capture | append-only domain version with source hash and timestamps |
| parser/chunker output | independently versioned derived columns or child table |
| passage evidence | stable domain passage ID, parent capture ID, offsets and hash |
| embedding | model/version/dimension/metric plus replaceable vector column |
| lexical representation | analyzer/tokenizer/version recorded with FTS index |
| source/ACL/policy metadata | scalar-indexed columns, mandatory prefilter and output recheck |
| retrieval execution | pinned table version plus lane/index/segment/coverage trace |
| deletion | logical tombstone plus index, compaction, retention, clone/tag and backup workflow |

Curiosity's response envelope should carry at least:

```text
query_id, declared frame, hard budgets, deadline
table/corpus snapshot and freshness state
lexical/vector/scalar index names + versions + coverage
per result: document_id, capture_version_id, passage_id + offsets/hash
retrieval lane ranks and scores, fusion/reranker version
ACL/policy decision, duplicate cluster, source class, timestamps
unindexed-tail and partial-failure warnings
```

The bounded curiosity pass may use lexical/vector disagreement, stale index
coverage, source monoculture, or snapshot drift as signals. It still needs caller
authority to run any follow-up. Storage background jobs must never expand the
research frame, crawl new sources, or convert untrusted text into tool actions.

## 14. Validation gates and reproducible checks (not executed)

1. **Snapshot replay:** ingest/update/delete/compact/index, then reproduce every
   retained snapshot and citation hash exactly.
2. **Crash/commit matrix:** interrupt fragment upload, index build, manifest
   commit, external-coordinator finalization, and cleanup; verify no partial
   snapshot becomes visible and orphan cleanup is bounded.
3. **Concurrent writers:** append/append, append/index, update/delete,
   update/compaction, and restore/write against the chosen object store and every
   deployed SDK version.
4. **Index completeness:** compare ANN and FTS results before/after appends,
   updates, deletes, compaction, and catch-up; assert exact-tail inclusion and
   explicit `fast_search` incompleteness.
5. **Recall evaluation:** sampled exhaustive kNN truth; tune metric, probes,
   quantization, refinement, filter selectivity, and HNSW `ef`; report recall,
   latency, bytes, IOPS, and cost together.
6. **Lexical evaluation:** analyzer/version matrix across exact IDs, phrases,
   code, multilingual text, long tokens, stemming, stop words, and malformed
   Unicode; compare BM25 and hybrid judged relevance.
7. **ACL canary:** allow/deny, group change, stale ACL column, missing scalar
   index, postfilter attempt, and index fallback. Any unauthorized result fails
   the candidate.
8. **Erasure drill:** delete one capture and prove removal from live reads,
   index results, compacted files, expired snapshots, tags/branches, shallow
   clones, backups, multipart remnants, and provider object versions.
9. **Portability drill:** inventory all base paths and references, export to a
   clean environment with no original credentials, open with an independent
   compatible client, rebuild indexes, and compare results.
10. **Format upgrade:** stable-version pin, mixed reader/writer rejection,
    rollback, old snapshot reads, and a future client reading current bytes.
11. **Capacity/operations:** fragment explosion, deletion density, continuous
    ingest, index backlog, compaction temporary space, object throttling,
    retention/tag growth, and restore time.
12. **Security:** least-privilege object IAM, KMS denial/rotation, private
    networking, TLS/certificate failures, secret redaction, malformed files,
    decompression/resource bounds, and hostile retrieved content.

**Pass condition:** Lance must beat the simpler owned baseline at matched
correctness and judged relevance while preserving provider-neutral identity,
snapshot replay, ACL safety, deletion SLOs, portable export, bounded operations,
and acceptable full-lifecycle cost.

## 15. Unknowns and negative results retained

- **UNKNOWN:** independent quality/latency/cost results for Curiosity's corpus;
  no benchmark was run.
- **UNKNOWN:** exact cache coherence, scheduler, admission-control, HA, failure-
  recovery, and rolling-upgrade behavior of any specific Enterprise deployment.
- **UNKNOWN:** Enterprise feature maturity where public docs conflict on current
  versus coming-soon distributed search/indexing/compaction.
- **UNKNOWN:** Enterprise query/session/telemetry retention, row/document ACLs,
  audit events, backup/RPO/RTO, key custody, and certification report scope.
- **UNKNOWN:** stable-row-ID index production readiness and its performance cost;
  format docs call it experimental/in progress.
- **UNKNOWN:** whether every public query/index API behaves identically across
  Python, TypeScript, Rust, direct Lance, OSS LanceDB, and RemoteTable.
- **NEGATIVE RESULT:** no native Curiosity-style document/capture/passage
  provenance or immutable citation contract was found.
- **NEGATIVE RESULT:** no OSS multi-tenant authentication or row-level
  authorization layer was found; OSS is documented as embedded.
- **NEGATIVE RESULT:** no evidence that soft delete immediately erases bytes;
  official docs state the opposite.
- **NEGATIVE RESULT:** no evidence that open format alone provides a distributed
  scheduler; official distributed-indexing docs assign orchestration to caller.
- **NEGATIVE RESULT:** no built-in web crawl, source-rights, robots, canonical
  URL, authority, spam, diversity, or evidence-verification layer was found.
- **NEGATIVE RESULT:** no claim that ANN distance or BM25 score is calibrated as
  relevance probability, factual confidence, or authority was found.
- **NEGATIVE RESULT:** no live service, malformed-file, concurrency, security,
  recovery, or storage-provider test was authorized or performed.

These gaps do not negate Lance's storage design; they bound what Curiosity would
still have to own.

## 16. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for relevance (R), decision value
(V), novelty (N), and cost (C); priority = `R + V + N - C`. Caller authority
covered public-source follow-up only.

| Thread | R/V/N/C | Priority | Outcome |
| --- | --- | ---: | --- |
| Index correctness across updates/deletes/compaction | 5/5/5/2 | 13 | **Pursued.** Format index and transaction specs established fragment coverage, deletion filtering, invalidation, remapping, and exact-tail fallback [S9, S10]. |
| Stable identity versus physical row address | 5/5/5/1 | 14 | **Pursued.** Row-lineage spec resolved the default `_rowid` hazard and creation-time stable-ID constraint [S5]. |
| Atomic commits on generic object stores | 5/5/4/2 | 12 | **Pursued.** Conditional-write requirement and COS/GooseFS exceptions show backend capability, not URI compatibility, is decisive [S9, S12]. |
| Enterprise distribution maturity contradiction | 5/4/4/2 | 11 | **Pursued.** Contradiction retained; public docs support some background workers but not blanket mature distributed execution [S17, S18]. |
| Exact Enterprise internals/SLOs | 4/4/3/5 | 6 | **CURIOSITY_NO_GO.** Requires private deployment and contractual material; public inference would be unreliable. |
| Empirical storage/index benchmark | 5/5/4/5 | 9 | **CURIOSITY_NO_GO.** Caller requested research only; live workload design and execution need separate authority. |
| Review every format protobuf/source module | 2/2/3/5 | 2 | **CURIOSITY_NO_GO.** Specification-level coverage is sufficient; copying/reconstructing implementation would add little decision value and cross the clean-room purpose. |
| Experimental overlays/MemWAL internals | 2/2/4/4 | 4 | **CURIOSITY_NO_GO.** Not needed for the current adoption decision and explicitly unstable/experimental. |
| Trust Center restricted reports | 4/4/2/5 | 5 | **CURIOSITY_NO_GO.** Access-controlled assurance material requires procurement/security authority. |

**Stop condition:** coverage and saturation. Every requested architecture category
has primary-source coverage; the highest-value contradictions were resolved or
retained. Remaining consequential questions require empirical tests, commercial
artifacts, or a separately authorized implementation/procurement phase. No live
autonomous follow-up was initiated.

## 17. Source ledger

All sources are official/primary and were accessed **2026-08-17**.

- **[S1]** Lance Format, [Lance File Format](https://lance.org/format/file/) —
  pages, no row groups, footer/metadata, random-access read strategy.
- **[S2]** Lance Format, [Encoding Strategy](https://lance.org/format/file/encoding/) —
  Arrow types versus layouts, search cache, mini-block/full-zip/blob encodings.
- **[S3]** Lance Format, [Lance Table Format](https://lance.org/format/table/) —
  manifests, fragments, column files, deletion vectors, schema evolution.
- **[S4]** LanceDB, [Lance format overview](https://docs.lancedb.com/lance) and
  [Versioning](https://docs.lancedb.com/tables/versioning) — snapshot sharing,
  compaction, cleanup, tags, restore behavior.
- **[S5]** Lance Format, [Row ID and Lineage](https://lance.org/format/table/row_id_lineage/) —
  row address, stable IDs, update semantics, version lineage and change queries.
- **[S6]** Lance Format, [Branch and Tag](https://lance.org/format/table/branch_tag/) —
  writable branch layout and named version references.
- **[S7]** Lance Format, [File Versioning](https://lance.org/format/file/versioning/) and
  [Table Feature Flags](https://lance.org/format/table/versioning/) — stable/
  unstable compatibility and required-feature rejection.
- **[S8]** Lance Format, [Storage Layout](https://lance.org/format/table/layout/) —
  root layout, base paths, clones, portability, manifest naming and hints.
- **[S9]** Lance Format, [Transactions](https://lance.org/format/table/transaction/) —
  MVCC, conditional commits, operation conflicts, external manifest store.
- **[S10]** Lance Format, [Indices in Lance](https://lance.org/format/index/) —
  immutable segments, fragment coverage, fallback, invalidation and compaction.
- **[S11]** LanceDB, [Updating and Modifying Table Data](https://docs.lancedb.com/tables/update) —
  updates, merge/upsert, soft deletion, cleanup, user-visible index behavior.
- **[S12]** Lance Format, [Object Store Configuration](https://lance.org/guide/object_store/) —
  providers, credentials, TLS, KMS, COS and GooseFS commit caveats.
- **[S13]** LanceDB, [Consistency](https://docs.lancedb.com/tables/consistency) —
  refresh intervals, remote freshness bounds, watermarks and read-own-write.
- **[S14]** LanceDB, [Vector Indexes](https://docs.lancedb.com/indexing/vector-index) —
  IVF/HNSW/quantization choices, coverage fallback and query controls.
- **[S15]** Lance Format, [Vector Index Format](https://lance.org/format/index/vector/) —
  compositional index design and current on-disk vector index layout.
- **[S16]** LanceDB, [FTS Index](https://docs.lancedb.com/indexing/fts-index) and
  [Full-Text Search](https://docs.lancedb.com/search/full-text-search) — BM25,
  analyzers, phrase positions, catch-up and pre/postfiltering.
- **[S17]** LanceDB, [Enterprise overview](https://docs.lancedb.com/enterprise) —
  OSS/Enterprise boundary, remote API, cache and feature-status claims.
- **[S18]** LanceDB, [Enterprise Architecture](https://docs.lancedb.com/enterprise/architecture) —
  control/data planes, query nodes, executors, jobs, WAL and object storage.
- **[S19]** LanceDB, [Enterprise Deployment](https://docs.lancedb.com/enterprise/deployment) —
  managed and BYOC deployment boundaries.
- **[S20]** LanceDB, [Enterprise Authentication](https://docs.lancedb.com/enterprise/authentication) —
  API key, OAuth client credentials and Azure managed identity.
- **[S21]** LanceDB, [OSS FAQ](https://docs.lancedb.com/faq/faq-oss) — project
  separation, embedded scope, scale/concurrency and Apache-2.0 statement.
- **[S22]** Official repositories, [Lance LICENSE](https://github.com/lance-format/lance/blob/main/LICENSE)
  and [LanceDB LICENSE](https://github.com/lancedb/lancedb/blob/main/LICENSE) —
  Apache-2.0 terms and Lance third-party notices.
- **[S23]** Lance Format, [official repository README](https://github.com/lance-format/lance) —
  project scope and file-format compatibility contract.
- **[S24]** Lance Format, [Full Text Search Index Format](https://lance.org/format/index/scalar/fts/) —
  postings layout, analyzers, build phases, partitions and structured queries.
- **[S25]** LanceDB, [Metadata Filtering](https://docs.lancedb.com/search/filtering) and
  [Scalar Indexes](https://docs.lancedb.com/indexing/scalar-index) — DataFusion
  predicates, filter placement and scalar index families.
- **[S26]** LanceDB, [Hybrid Search](https://docs.lancedb.com/search/hybrid-search) —
  vector/FTS lanes, RRF, reranking and shared filtering.
- **[S27]** LanceDB, [Optimize Query Performance](https://docs.lancedb.com/search/optimize-queries) —
  explain/analyze plans, pushdown and local/distributed metrics.
- **[S28]** LanceDB, [Reindexing](https://docs.lancedb.com/indexing/reindexing) —
  incremental catch-up, optimize phases and disk/retention behavior.
- **[S29]** Lance Format, [Distributed Write](https://lance.org/guide/distributed_write/) —
  parallel fragment generation and coordinated commit.
- **[S30]** Lance Format, [Distributed Indexing](https://lance.org/guide/distributed_indexing/) —
  caller/worker boundary, index segments, merge and orphan cleanup.
- **[S31]** LanceDB, [Storage Configuration](https://docs.lancedb.com/storage/configuration) —
  OSS credentials/options, KMS, Enterprise-owned credentials and table defaults.
- **[S32]** LanceDB, [Storage Monitoring](https://docs.lancedb.com/storage/monitoring) and
  Lance Format, [Observability](https://lance.org/guide/observability/) — object-
  store metrics and OpenTelemetry integration.
- **[S33]** LanceDB, [Security & Compliance](https://docs.lancedb.com/enterprise/security) —
  vendor certification, isolation, telemetry and encryption claims.

## 18. Overall confidence and final verdict

**High confidence:** open file/table/index architecture, version/transaction
semantics, partial index coverage, update/delete/compaction model, object-store
requirements, public API behavior, and repository license identity.  
**Medium confidence:** performance implications, optimal index choice, stable-ID
trade-offs, and the smallest Enterprise architecture consistent with public
docs.  
**Low/unknown:** Curiosity-specific performance/relevance, commercial feature
maturity, Enterprise internals/SLOs, security-control effectiveness, and total
cost.

**Final verdict:** **ADOPT** immutable snapshots, two-dimensional derived-column
storage, partial-coverage index semantics, and observable maintenance as
architecture patterns; **ADAPT** Lance's hybrid retrieval, identity, object-store
portability, and branch/tag concepts into Curiosity-owned evidence contracts;
**REJECT** storage row IDs as citations, soft delete as erasure, undeclared
indexed-only search, and scores as truth; **DEFER** Lance dependency selection
and Enterprise procurement until the bounded validation gates pass.
