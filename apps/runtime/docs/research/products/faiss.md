# FAISS vector similarity library: clean-room architecture dossier

**Decision frame:** Which FAISS algorithmic and operational lessons should
Curiosity adopt, adapt, reject, or defer when designing an owned dense-vector
retrieval subsystem?

**Snapshot:** Public primary documentation, papers, release notes, license, and
selected public source headers were accessed 2026-08-17. The current release was
FAISS v1.15.0 (released 2026-08-03; changelog dated 2026-07-31) [S2]. This is a
behavioral and architectural study, not an implementation, dependency approval,
legal opinion, or performance endorsement. No FAISS package was installed, no
FAISS code was executed or copied, and no private interface or access control was
used.

**Boundary:** “FAISS” means the in-process dense-vector similarity library, not a
vector database or hosted service. Exact Flat, inverted-file (IVF), product
quantization (PQ/OPQ/IVFPQ), and HNSW families are in frame. Newer EDEN,
RaBitQ, Vamana/SVS, CAGRA, Panorama, Metal, and cuVS variants are noted only when
they change a boundary; they are not separately evaluated.

## Executive verdict

FAISS is an unusually strong **algorithm and benchmark reference**, but an
intentionally incomplete retrieval system. It provides exact ground truth,
multiple ANN families, compression, CPU/GPU kernels, serialization, sharding and
replication containers, and parameter-space evaluation. It explicitly does not
provide the database control plane Curiosity needs: concurrent writes, metadata
query planning, transactions, durable mutation logs, production distribution,
load balancing, or tenant/security policy [S1].

**Curiosity disposition: ADAPT the design lessons; REJECT FAISS as the owned
serving foundation under the repository's current strict-ownership direction;
DEFER any benchmark-only dependency and dense production lane to separately
reviewed gates.** In particular:

1. **ADOPT** an exact float32 reference path and exact reranking as correctness
   oracles, not necessarily FAISS's implementation.
2. **ADAPT** IVF's explicit partition/probe budget, PQ's separately trained
   codec, OPQ's pre-transform, HNSW's construction/search effort split, and
   FAISS's Pareto-frontier evaluation model.
3. **REJECT** treating an ANN index as corpus authority, metadata database,
   deletion ledger, durable store, distributed service, or relevance truth.
4. **DEFER** HNSW/PQ/GPU choices until a representative Curiosity corpus,
   embedding contract, filter workload, freshness/update rate, QPS, tail-latency
   target, and lexical/hybrid baseline exist.

Overall confidence is **high** for public index behavior, memory formulas,
mutation/filter limitations, persistence boundaries, and license; **medium** for
cross-hardware performance implications; **low** for which family will win on
Curiosity because no Curiosity vector corpus or workload was authorized.

## 1. Bounded questions and method

| Question | Answer | Status / confidence |
| --- | --- | --- |
| What does FAISS own? | Local vector indexing, compression, clustering, search, evaluation, and selected CPU/GPU kernels—not embeddings or database operations. | FACT / high [S1] |
| Which family is exact? | Flat L2/IP; it stores float32 vectors and exhaustively compares them. | FACT / high [S3][S4] |
| How do IVF and HNSW trade recall for work? | IVF probes a subset of learned cells (`nprobe`); HNSW explores a graph with `efSearch`. | FACT / high [S3][S5] |
| How does PQ save memory? | It splits vectors into subspaces, learns a codebook per subspace, and stores compact codes; IVFPQ encodes residuals inside IVF cells. | FACT / high [S1][S3] |
| Are training and updates transparent? | No. IVF/PQ/OPQ require representative training; retraining a populated index is not supported. Mutation semantics differ by family. | FACT / high [S5][S9] |
| Are filters database predicates? | No. Public filtering is ID-subset selection, often checked while scanning candidates; metadata indexing/query planning is external. | FACT / high [S8][S9] |
| Is serialization a durable database? | No. CPU indexes can be serialized, but FAISS warns that loaded data is not authenticated; GPU indexes must be converted to CPU. | FACT / high [S6] |
| Is distribution production-ready? | No. local shard/replica composition exists; the cross-machine RPC example is explicitly insecure and demonstrative. | FACT / high [S1][S10] |
| What transfers to owned design? | Algorithms, test methodology, bounded knobs, and separation of codec/candidate/rerank stages—specified independently and revalidated. | RECOMMENDATION / high |

Labels used below:

- **FACT** — directly supported by a cited primary source.
- **INFERENCE** — bounded architectural interpretation, not a FAISS guarantee.
- **RECOMMENDATION** — proposed Curiosity disposition.
- **UNKNOWN** — material question not answered by the evidence or absent inputs.
- Confidence is **high**, **medium**, or **low**.

The FAISS paper is treated as primary evidence from maintainers. Repository wiki
pages and public headers establish the documented/current interface. Historical
benchmark numbers establish what their fixed setup measured, not current hardware
performance or Curiosity fitness. Source inspection was limited to public headers
needed to resolve behavior; no implementation body was transcribed.

## 2. Product boundary and common contract

### 2.1 What FAISS is—and is not

**FACT (high):** FAISS indexes fixed-dimensional dense vectors, associates them
with integer IDs, and searches mainly by squared L2 distance or inner product.
Cosine search is inner-product search after normalizing both database and query
vectors. The common input representation is float32 [S1][S4][S12].

**FACT (high):** The maintainers explicitly say FAISS is not an embedding model,
service, or database. It lacks concurrent write access, load balancing, sharding
as a managed distributed system, transaction management, and query optimization
[S1]. Its local `IndexShards` is therefore not contradictory: it is composition,
not a database control plane.

**INFERENCE (high):** Curiosity must place a durable document/passage registry,
embedding-version manifest, metadata index, deletion/takedown ledger, generation
publisher, and serving router around any ANN primitive. Integer vector IDs should
be opaque references to that authority, never the authority themselves.

### 2.2 Metrics are an embedding contract

FAISS's paper calls the relationship between extractor and index an “embedding
contract”: the model must make distance meaningful; the index can only recover
neighbors under that distance [S1]. Exact ANN recall therefore measures fidelity
to exact vector neighbors—not semantic relevance, evidence quality, freshness,
source diversity, or citation entailment.

**RECOMMENDATION (high):** Version at least model identity/hash, tokenizer and
pooling, dimensionality, normalization, distance metric, preprocessing transform,
training-corpus manifest, codec/centroid generation, and index generation. Mixing
vectors across incompatible contracts must fail closed.

## 3. Index families

### 3.1 Exact Flat

| Property | Finding |
| --- | --- |
| Search | Exhaustive comparison; `IndexFlatL2` and `IndexFlatIP` are the only documented indexes that guarantee exact neighbors [S5]. |
| Training | None. |
| Primary storage | `4 * d` bytes/vector for float32 values; no per-vector index overhead in the base sequential form [S3]. |
| IDs | Base Flat uses sequential positions; `IndexIDMap`/`IndexIDMap2` supplies external IDs [S3][S5]. |
| Mutation | Adds append. Removal shifts later sequential IDs in Flat-like sequential indexes [S7]. |
| Role | Ground-truth oracle, small-corpus search, shortlist reranker, and low-query-count baseline. |

**FACT (high):** Exact does not mean numerically ideal. The FAQ documents
float32 cancellation differences between direct and matrix-multiplication L2
paths for large-magnitude components [S9]. Tie ordering is not guaranteed [S9].

**Curiosity implication:** **ADOPT** an exact baseline and reranking contract.
Require stable secondary ordering outside the distance kernel and test pathological
norms, duplicates, ties, NaNs, and zero vectors. Do not equate “exact vector
neighbor” with relevant retrieval.

### 3.2 IVF and IVFFlat

**FACT (high):** IVF learns `nlist` coarse centroids, assigns every database
vector to an inverted list, chooses `nprobe` lists for each query, and scans only
their contents. A rough scanned fraction is `nprobe / nlist`, though unequal list
lengths make that estimate optimistic. Recall fails when the true neighbor's cell
is not probed [S3].

**FACT (high):** `IndexIVFFlat` retains full vectors and explicit 64-bit IDs,
using approximately `4*d + 8` bytes per vector, excluding fixed centroids, list
tables, capacity slack, and allocator overhead [S3][S13]. The official heuristic
balances centroid assignment against list scanning near `nlist = C*sqrt(N)`;
current selection guidance instead offers workload-size bands and must still be
validated empirically [S3][S5].

**INFERENCE (high):** IVF exposes a useful bounded-work model. `nprobe`,
`max_codes`, and current early-stop fields are candidate-budget controls, but they
are not relevance guarantees [S14]. Skewed cells, duplicate vectors, metadata
filters, and drift can change actual work radically.

**Curiosity implication:** **ADAPT** coarse routing as an observable stage:
record partition generation, selected partitions, codes visited, candidates
returned, filter rejects, and stop reason. Never hide `nprobe` behind an
unversioned “auto” mode in reproducible evaluation.

### 3.3 PQ, OPQ, and IVFPQ

**FACT (high):** PQ splits a `d`-dimensional vector into `M` sub-vectors and
learns a quantizer for each. A code uses `ceil(M * nbits / 8)` bytes/vector.
Search normally uses asymmetric distance computation: the query stays uncompressed
while database codes approximate vectors [S1][S3]. Product-code compactness is
paid for with distance distortion and training/codebook overhead.

**FACT (high):** OPQ is a learned linear rotation (optionally dimensionality
reducing) before PQ. It redistributes correlated/uneven variance among PQ
subspaces to reduce quantization error; it is preprocessing, not a neighbor index
by itself [S1][S5].

**FACT (high):** IVFPQ combines two approximation sources: IVF may omit the
correct cell, while residual PQ distorts distances among scanned candidates. It
stores approximately `ceil(M * nbits / 8) + 8` bytes/vector, plus coarse
centroids, PQ codebooks, inverted-list metadata/capacity, and optional lookup
tables [S3][S13]. FAISS's debugging recipe isolates the losses by (a) setting
`nprobe=nlist` to expose PQ error and (b) comparing IVFFlat to expose routing
error [S9].

**RECOMMENDATION (high):** Preserve this loss decomposition in Curiosity tests:

1. exact full-vector ground truth;
2. exact scan within chosen partitions (routing loss);
3. compressed scan within chosen partitions (codec loss);
4. expanded shortlist plus exact full-vector rerank (recoverable loss);
5. end-to-end judged retrieval (embedding/relevance loss).

**UNKNOWN:** Whether Curiosity's expected dimensions and embedding distribution
are sufficiently compressible for PQ/OPQ. MSE alone cannot answer that; shortlist
recall and end-task metrics are required.

### 3.4 HNSW

**FACT (high):** HNSW builds a multi-level neighbor graph. In FAISS, `M` controls
graph degree/memory, `efConstruction` controls insertion effort, and `efSearch`
controls query exploration. `IndexHNSWFlat` keeps full vectors in random-access
storage. The simplified guidance formula is about `4*d + M*2*4` bytes/vector;
the index table adds a level-distribution multiplier, and actual memory also
includes level/offset/visited/allocator state [S3][S5].

**FACT (high):** HNSWFlat needs no distribution-learning phase, but graph
construction is substantial index building, not “free.” Adds are sequential-ID
unless wrapped, cannot run concurrently, and may be nondeterministic under
multithreaded insertion. Search is deterministic for a fixed graph [S11][S14].
FAISS documents no vector removal because deleting a node would damage graph
structure [S3][S5]. PQ/SQ-backed HNSW variants do require storage-codec training
[S14].

**INFERENCE (high):** HNSW is attractive for read-heavy, RAM-resident generations
with moderate churn and high recall, but poor as the sole mutable truth. Tombstones
outside the graph avoid immediate physical deletion but waste exploration and can
degrade filtered recall until compaction/rebuild.

**Curiosity implication:** **DEFER** HNSW as a serving candidate until deletion,
filter selectivity, rebuild cadence, peak build memory, and generation-swap costs
are benchmarked. If adopted later, treat each graph as immutable and replaceable.

### 3.5 Comparative decision table

| Family | Exact? | Distribution training | Main query knob | Approx. vector bytes | Mutation/filter fit | Curiosity verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Flat | Yes | No | none | `4d` | Simple append; delete shifts base IDs; ID filter path-dependent | **ADOPT concept** as oracle/reranker |
| IVFFlat | No unless all lists probed | Coarse k-means | `nprobe`, code budget | `4d+8` | Arbitrary IDs and direct-map updates possible; scans/maintenance remain costly | **ADAPT** bounded routing |
| PQ Flat | Exhaustive over approximate codes, not exact vectors | PQ codebooks | codec/search options | `ceil(M*nbits/8)` | Sequential-index removal semantics | **DEFER** codec |
| IVFPQ/OPQ-IVFPQ | No | coarse + residual PQ; OPQ if used | `nprobe`, code budget, rerank | code bytes `+8` | Best compression; two recall-loss sources; rebuild on retrain | **DEFER** pending measured value |
| HNSWFlat | No | No codec training; graph build | `efSearch` | roughly `4d + graph` | Incremental add; no removal; ID filtering is not a metadata engine | **DEFER** read-heavy candidate |

Formulas are lower-order planning estimates, not allocator/RSS guarantees.

## 4. Training, drift, and lifecycle

### 4.1 Representative training is mandatory

**FACT (high):** IVF, PQ, and OPQ learn from the input distribution. The FAQ says
an index trained on a statistically different data type/distribution should not
be reused; FAISS checks dimensionality, not distribution compatibility, so the
failure appears as accuracy and/or latency degradation [S9].

**FACT (high):** Current sources disagree slightly on sampling heuristics. The
FAQ's clustering defaults are 39 minimum and 256 maximum points/centroid; the
2026 index-choice page says 30–256 per IVF centroid; another FAQ rule says little
consistent k-means improvement beyond 20 iterations and 1000*k points [S5][S9].
These are heuristics, not quality guarantees.

**RECOMMENDATION (high):** Curiosity should train only from a versioned,
representative sample stratified across language, source type, time, embedding
model, and expected query/document distributions. Record sample selection,
random seed, empty/imbalanced cells, objective curve, training hardware/software,
and held-out recall. Never promote on training MSE alone.

### 4.2 Retraining means rebuilding

**FACT (high):** FAISS does not support retraining a populated index in place.
Its documented lifecycle is untrained/empty → trained/empty → trained/populated;
reset returns to trained/empty, not untrained [S9]. Warm-start centroid examples
exist, but do not remove the need to rebuild encoded vectors.

**INFERENCE (high):** An owned system needs immutable generations: train new
artifacts, bulk-build, evaluate against the old generation, publish atomically,
retain rollback, and garbage-collect only after readers drain. Incremental adds
must carry the same embedding/index generation and be bounded by a drift trigger.

### 4.3 Duplicate and skew failure modes

FAISS says large duplicate/near-duplicate sets hurt both IVF (one long list) and
HNSW, and recommends deduplication or application post-processing [S9]. For web
retrieval this is a first-order issue: mirrors, boilerplate, syndicated articles,
and chunk overlap can dominate neighborhoods.

**RECOMMENDATION:** Deduplicate/canonicalize before vector indexing, preserve all
evidence mappings outside ANN, and measure owner/publisher diversity after merge.

## 5. Memory, storage, and compute placement

### 5.1 Capacity model

For `N` vectors, initial planning should include:

```text
Flat payload       = N * 4d
IVFFlat entries    = N * (4d + 8)
PQ payload         = N * ceil(M*nbits/8)
IVFPQ entries      = N * (ceil(M*nbits/8) + 8)
HNSWFlat lower bound ~= N * (4d + graph links)
```

Then add fixed centroids/transforms/codebooks, list or graph metadata, direct
maps, ID filters, precomputed tables, capacity slack, build workspace, query
scratch, process allocator fragmentation, replicas, and rollback generations
[S1][S3][S13]. **INFERENCE (high):** peak deployment memory can be materially
larger than steady-state payload because safe replacement holds old and new
generations concurrently.

### 5.2 CPU

**FACT (high):** CPU indexes permit concurrent read-only searches, but callers
must serialize operations that mutate an index. Training, add, and batch search
use OpenMP/BLAS; singleton and batch behavior differs, and oversubscription can
degrade performance. FAISS recommends batching for throughput [S11]. It is not
NUMA-aware [S15].

**RECOMMENDATION:** Report batch-1 and service-realistic microbatch latency
separately; pin explicit thread/NUMA policy; include scheduler/queue time; never
quote library QPS as request p95.

### 5.3 GPU and accelerator boundary

**FACT (high):** The v1.15.0 README lists optional CUDA and AMD ROCm support and
optional NVIDIA cuVS backends. v1.15.0 also added a Metal IVFPQ implementation;
therefore the older CUDA-centric GPU wiki is not a complete current backend
matrix [S2][S4]. The established GPU families include Flat, IVFFlat, IVF scalar
quantization, and IVFPQ. GPU counterparts intentionally omit parts of CPU IVF's
API, such as direct inverted-list manipulation [S12].

**FACT (high):** Host/device pointers are accepted; avoiding transfer requires
inputs on the same device. Multi-GPU helpers support replication (query
parallelism) and sharding (capacity), but sharding speedup is more sublinear.
GPU indexes are not thread-safe through a shared resource object [S11][S12].

**FACT (high):** Legacy GPU documentation sets implementation-specific limits
such as `k,nprobe <= 2048`, supported IVFPQ code sizes, temporary scratch, and
batching requirements. It also says GPU indexes must be converted to CPU before
serialization [S6][S12]. These limits must be rechecked against the selected
v1.15 backend; Metal, ROCm, native CUDA, and cuVS are not assumed equivalent.

**Curiosity implication:** **DEFER** accelerators until profiling proves that
search, not embedding, transfer, filtering, reranking, or orchestration dominates.
Keep a backend-neutral candidate contract; do not expose accelerator limits as
domain semantics.

### 5.4 On-disk IVF

FAISS can memory-map IVF inverted lists and keep a list-offset table in RAM. A
query may incur one seek per visited list; OS page cache makes warm repeated tests
look unlike cold service behavior. Online addition to `OnDiskInvertedLists` is
documented as very inefficient and potentially removable [S10].

**INFERENCE (high):** This is a useful storage-layout lesson, not a durable
service. Curiosity must separately design checksummed files, manifests, atomic
publication, cache-aware admission, compaction, recovery, deletion propagation,
and cold-start SLOs.

## 6. IDs, additions, updates, deletes, and filters

### 6.1 ID semantics

- **FACT:** Native IDs are 64-bit integers; string IDs are unsupported [S9].
- **FACT:** Flat/HNSW default to sequential positions; ID-map wrappers provide
  external IDs. IVF stores explicit IDs with entries [S3][S5].
- **RECOMMENDATION:** Curiosity maps stable passage-version IDs to dense internal
  ordinals in a generation manifest. Never expose ordinals as durable IDs.

### 6.2 Update/delete matrix

| Operation | Flat/PQ sequential | IVF | HNSW |
| --- | --- | --- | --- |
| Add | Append; sequential IDs unless wrapped | Add, including explicit distinct IDs | Add; no concurrent add; sequential unless wrapped |
| Update vector | No general in-place contract; remove/re-add or rebuild | `update_vectors` requires a direct map [S14] | No documented in-place vector update |
| Delete | Supported for documented Flat-like paths, but later sequential IDs shift | `remove_ids`; normally scans the database. Hashtable direct map + ID array selector can avoid full scan | Unsupported because graph structure would be damaged [S3][S7] |
| Concurrent mutation | Caller locking required | Caller locking required | Caller locking required |

**INFERENCE (high):** Regulatory/takedown deletion cannot rely on family-specific
physical behavior. Apply an authoritative tombstone before serving, verify it at
result materialization, propagate to every replica/generation/cache, and rebuild
to reclaim unreachable vectors. Measure tombstone leakage as a correctness SLO.

### 6.3 Filters are ID selectors, not metadata indexes

**FACT (high):** `SearchParameters.sel` accepts an `IDSelector`. Built-ins cover
ranges, arrays, hash/Bloom-backed batches, bitmaps, negation, and boolean
composition. IVF usually checks membership while scanning codes; optimized paths
exist for sorted ranges and selected Flat cases. Selector memory and lookup costs
vary [S8][S14]. The FAQ calls filtering “limited,” ID-based, and slower than
searching an index containing only eligible elements [S9].

**INFERENCE (high):** Highly selective filters can destroy ANN recall/latency if
the search budget is spent on ineligible nodes/codes. Post-filtering top-k can
underfill results; overfetch has no fixed recall guarantee; one-index-per-attribute
explodes combinations. HNSW traversal under filters is especially workload
dependent even if a selector is accepted.

**RECOMMENDATION:** Curiosity needs a first-class metadata planner that chooses
among prefilter → exact search, ANN → postfilter/expand, partition routing, or a
hybrid. Filters must carry selectivity estimates, oversampling/budget, underfill
status, and policy-hard versus ranking-soft semantics. Security, tenant,
takedown, and license filters require final fail-closed enforcement outside ANN.

## 7. Persistence, integrity, and distribution gaps

### 7.1 Serialization

**FACT (high):** `write_index`/`read_index` serialize CPU indexes to files or
generic sequential I/O channels. FAISS warns that it does not authenticate loaded
data and that malicious/corrupt input may cause memory exhaustion or code
execution; callers must verify integrity [S6]. v1.15 release notes show ongoing
deserialization hardening, which reduces known defects but does not create a trust
boundary [S2].

**Missing database facilities (FACT where explicitly disclaimed; otherwise
negative-result inference, high):** no documented WAL, transaction/commit model,
MVCC, crash-consistent incremental checkpoint, authenticated manifest, portable
schema-evolution guarantee, online backup protocol, replica consensus, or
point-in-time recovery [S1][S6].

**RECOMMENDATION:** Owned artifacts need a versioned envelope with lengths,
checksums/signatures, model/metric/training manifests, build identity, monotonic
generation, compatibility checks, staged validation, and atomic publish. Treat
all index files as untrusted until verified.

### 7.2 Sharding and replication

**FACT (high):** `IndexReplicas` copies a dataset and parallelizes query batches;
`IndexShards` splits data and merges local top-k. Multi-machine build can train a
common IVF model, independently add shards, and merge them. Separately trained
compressed shards may produce distances that compare poorly [S9][S12].

**FACT (high):** FAISS's cross-machine RPC is a demonstration without required
security protections and is explicitly not for production/untrusted networks
[S10].

**RECOMMENDATION:** **REJECT** that demo as architecture. Curiosity distribution
must own routing, authenticated transport, shard map/versioning, scatter/gather
deadlines, partial-result policy, replica health, consistency, backpressure,
failover, rebuild/restore, and global deterministic merge. A shard must return its
generation and metric contract with every candidate batch.

## 8. Recall, latency, and correctness evaluation

### 8.1 Separate four quality layers

1. **Vector ground truth:** exact Flat neighbors under the frozen metric.
2. **ANN fidelity:** `n`-recall@`k`/intersection against exact IDs; for range
   search, precision-recall/mAP against exact radius results [S1].
3. **Candidate utility:** recall of judged-relevant or answer-supporting passages
   before reranking, including hybrid union gain.
4. **End retrieval:** nDCG/MRR/Recall@k as appropriate, primary-source recall,
   diversity, freshness, duplication, and citation entailment.

FAISS's own auto-tuner holds exact ground truth, evaluates recall, records search
time, and keeps Pareto-optimal operating points. It warns that tuning needs a
sensitive representative query set (at least ~1,000, preferably 10,000) and
stable timing; sub-second multithread timings are unreliable [S6].

### 8.2 Required Curiosity benchmark matrix

**RECOMMENDATION (high):** Freeze corpus/query/judgment/manifests and evaluate:

- family and build parameters (`nlist`, `M`, code size, `efConstruction`);
- runtime sweeps (`nprobe`, `max_codes`, `efSearch`, shortlist/rerank factor);
- exact, routing-only, codec-only, combined, and exact-reranked paths;
- QPS plus p50/p95/p99 service latency at batch 1 and realistic microbatches;
- warm and cold mmap/cache states; CPU threads/NUMA and each accelerator backend;
- steady and peak RSS/device memory, scratch, build time/memory, add throughput,
  artifact size, restore time, and dual-generation publish headroom;
- filter selectivity/combinations, result underfill, duplicates, tombstones,
  skewed lists, language/source/time slices, and out-of-distribution queries;
- drift over corpus time and embedding-model replacement;
- deterministic IDs/tie-breaking and repeatability across build thread counts.

Select the cheapest operating point meeting **both** ANN candidate-recall and
end-retrieval/tail-latency gates. Do not optimize QPS on easy benchmark queries or
use clicks alone as relevance truth.

### 8.3 Historical performance claims are not procurement evidence

FAISS's 2017 GPU paper reported large gains and billion-scale builds on then-current
hardware [S16]. Its 1B-vector wiki reports QPS/recall curves on a fixed Xeon,
datasets, code sizes, and thread count [S13]. These are reproducibility evidence
for the methods, not current CPU/GPU forecasts. No numerical claim from them is
adopted for Curiosity capacity planning.

## 9. License, clean-room, and rights lessons

### 9.1 Software license

**FACT (high):** FAISS source is MIT-licensed. The license permits use,
modification, distribution, sublicensing, and sale, conditioned on retaining the
copyright and permission notice in copies or substantial portions; it disclaims
warranty [S17].

**FACT / negative result (high):** The repository's MIT text contains no express
patent-license clause [S17]. This does **not** establish that practicing every
algorithm is patented, unpatented, safe, or unsafe.

**RECOMMENDATION:** If policy later permits a FAISS binary/library, perform
dependency, transitive-license, backend (CUDA/ROCm/cuVS/Metal), export, security,
and notice review. If “owned” excludes third-party engines, MIT permissiveness
does not change the architectural rejection.

### 9.2 Clean-room transfer

This dossier may transfer **behavioral requirements, equations/formulas attributed
to papers, interface lessons, failure modes, and evaluation plans**. It must not be
used as a source-code transplant. Because this researcher inspected public FAISS
headers, this researcher should not implement Curiosity's corresponding core.

For a strict clean-room implementation:

1. counsel defines the allowed published-algorithm and FTO boundary;
2. a specification team records independently phrased requirements and tests;
3. an implementation team not exposed to FAISS implementation source writes from
   approved literature/specifications;
4. a separate verifier runs black-box or mathematical conformance tests;
5. provenance records distinguish paper-derived, independently designed, and
   third-party-compatible elements.

**UNKNOWN / legal gate:** Patent/FTO status of PQ/OPQ/IVFADC/HNSW variants and
optimized kernels was not investigated. Software copyright permission and patent
permission are separate questions. Counsel review is required before owned
production implementation; this report gives no freedom-to-operate conclusion.

## 10. Curiosity architecture implications and verdicts

| Pattern / decision | Verdict | Confidence / rationale |
| --- | --- | --- |
| Exact vector search as frozen ground truth | **ADOPTED concept** | High; necessary to measure ANN loss. |
| Candidate retrieval followed by exact rerank | **ADOPTED/ADAPTED** | High; recovers compression/routing error when shortlist recall is adequate. |
| Explicit bounded search knobs and stop diagnostics | **ADOPTED** | High; `nprobe`, code budgets, and `efSearch` are strong precedents. |
| Separate preprocessing, codec, routing, scan, and rerank stages | **ADAPTED** | High; improves attribution and replaceability. |
| IVF as an observable partition router | **ADAPTED, deferred** | Medium-high; useful bounded work, corpus-specific quality unknown. |
| PQ/OPQ compression | **DEFERRED** | High; memory value must beat training, distortion, and rebuild cost. |
| HNSW serving lane | **DEFERRED** | High; deletion/filter/rebuild fit is unresolved. |
| GPU acceleration | **DEFERRED** | High; hardware/backend and transfer economics absent. |
| FAISS as owned serving core | **REJECTED under current strict ownership** | High; third-party engine and incomplete DB/control plane. |
| FAISS as benchmark oracle | **DEFERRED to reviewed exception** | Medium; valuable, but repository direction rejects OSS engines in owned core and no install was authorized. |
| FAISS serialization as source of truth | **REJECTED** | High; unauthenticated artifact, no transaction/recovery model. |
| FAISS RPC demo for production distribution | **REJECTED** | High; maintainers explicitly warn against it. |
| IDSelector as metadata/security policy | **REJECTED** | High; limited ID filtering is not policy/query planning. |
| Immutable versioned index generations with atomic publish | **ADOPTED recommendation** | High; required by retraining/rebuild and safe rollback. |
| Dense retrieval replacing lexical retrieval | **REJECTED** | High; dense neighbors do not provide exact-term recall or evidence authority. Use hybrid candidates only after lexical baseline gates. |

### Proposed provider-neutral ANN result contract

**RECOMMENDATION (not copied from FAISS):** A future internal candidate response
should include `index_generation`, `embedding_contract`, `metric`, `candidate_id`,
raw score/distance with direction, rank, route/partition identifiers, work budget
and actual work, filter policy/version and reject counts, approximate/exact flag,
rerank stage, underfill/partial status, latency breakdown, and stop reason. The
public retrieval response should still resolve candidates through authoritative
passage/capture provenance.

## 11. Unknowns and mandatory checks

### Blocking unknowns

1. Authorized embedding model, dimension, normalization, metric, and model/data
   rights.
2. Passage count, growth/churn, deletion SLA, duplicate rate, and drift profile.
3. Metadata filter vocabulary and selectivity distribution.
4. Candidate recall and end-relevance targets; p95/p99 latency and QPS/concurrency.
5. RAM/device/disk budget, region/replication, rebuild and recovery objectives.
6. Whether “wholly owned” permits FAISS only in offline benchmarking.
7. Patent/FTO and third-party backend review.

### Verification checklist before any ADR

- [ ] Freeze embedding/corpus/query/judgment manifests and exact ground truth.
- [ ] Validate every memory formula against measured steady and peak RSS/device
      memory, including two generations.
- [ ] Test ID stability, duplicate/tie ordering, zero/NaN vectors, and corrupted
      artifacts.
- [ ] Test add/update/delete/tombstone propagation and no-return guarantees.
- [ ] Sweep filter selectivity and record underfill and recall, not only latency.
- [ ] Compare Flat, IVFFlat, HNSW, IVFPQ/OPQ-IVFPQ, and lexical/hybrid baselines
      only under identical contracts.
- [ ] Test cold/warm persistence, restore, atomic generation swap, rollback, and
      shard partial failure.
- [ ] Recheck v1.15 backend-specific GPU/Metal/ROCm/cuVS support and limits rather
      than relying on the older GPU wiki.
- [ ] Complete license, notice, security, dependency, and counsel/FTO gates.

## 12. Bounded curiosity pass and stop

Scoring is 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Check whether 2026 release changed persistence/backend boundaries | 5 | 5 | 4 | 1 | **Pursued:** v1.15 added Flat mmap, HNSW I/O, Metal IVFPQ, and current CUDA/ROCm/cuVS context [S2][S4]. Core database gap did not change. |
| Resolve filtering from current selector/header evidence | 5 | 5 | 3 | 1 | **Pursued:** filters remain ID-subset checks with path-specific optimization, not metadata predicates [S8][S14]. |
| Quantify Curiosity recall/latency on live vectors | 5 | 5 | 5 | 5 | **DEFERRED:** no authorized embedding corpus, workload, install, or hardware. |
| Exhaustively compare every new v1.15 index/backend | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: outside requested families and cannot change the control-plane verdict. |
| Inspect FAISS implementation bodies for kernel/layout replication | 1 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: violates the clean-room transfer goal; public contracts and papers suffice. |
| Determine patent status family by family | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: requires counsel/FTO authority and specialist search; retained as mandatory legal gate. |
| Run the insecure RPC demo | 1 | 1 | 2 | 4 | `CURIOSITY_NO_GO`: maintainers disclaim production/security suitability and no execution was authorized. |
| Derive dollar capacity plan | 4 | 4 | 2 | 4 | `CURIOSITY_NO_GO`: corpus, SLO, hardware, replication, and workload inputs are absent. |

**Coverage check:** exact, IVF, PQ/OPQ/IVFPQ, HNSW, training/drift,
memory/storage, CPU/GPU, update/delete/filter behavior, persistence/distribution,
evaluation, license/clean-room, and Curiosity decisions are represented.

**Saturation check:** the current paper, wiki, release, license, and public headers
converge on the same central finding: FAISS is a rich ANN toolkit and deliberately
not a database or production distribution plane. Further index variants do not
change that finding.

**Stop:** coverage and source-category saturation reached. Empirical selection,
hardware capacity, and legal/FTO remain intentionally unresolved pending caller
authority and required inputs.

## 13. Primary claim ledger

| ID | Type | Claim | Sources | Confidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | FAISS is an in-process ANN toolkit, not an embedding model, service, or database. | [S1][S4] | High | Boundary **ADOPTED** |
| L2 | FACT | Flat L2/IP is exact, untrained, and stores 4d bytes/vector. | [S3][S5] | High | Oracle concept **ADOPTED** |
| L3 | FACT | IVF partitions by learned centroids and probes selected lists; IVFFlat costs about 4d+8 bytes/vector. | [S3][S14] | High | **ADAPTED** |
| L4 | FACT | PQ stores compact learned subspace codes; IVFPQ adds routing and codec approximation; OPQ is a learned pre-transform. | [S1][S3] | High | **DEFERRED** |
| L5 | FACT | HNSW separates build/search effort and does not support removal in FAISS. | [S3][S5] | High | **DEFERRED** |
| L6 | FACT | Training must match the indexed distribution; populated retraining is unsupported. | [S9] | High | Immutable generations **ADOPTED** |
| L7 | FACT | Mutation semantics differ sharply; IVF updates need a direct map and common removals scan broadly. | [S7][S14] | High | External authority **ADOPTED** |
| L8 | FACT | Search filtering is ID-selector based, limited, and often applied during candidate scanning. | [S8][S9][S14] | High | Metadata policy use **REJECTED** |
| L9 | FACT | CPU read search is thread-safe; mutation needs locking; GPU resource use is not thread-safe. | [S11] | High | Service orchestration required |
| L10 | FACT | CPU index I/O is available, GPU must convert to CPU, and loaded files require caller integrity verification. | [S6][S12] | High | Source-of-truth use **REJECTED** |
| L11 | FACT | Multi-GPU shard/replica helpers exist; multi-machine RPC is demonstration-only and insecure for production. | [S10][S12] | High | RPC design **REJECTED** |
| L12 | FACT | ANN recall is fidelity to exact vector neighbors; end-task quality depends first on the embedding contract. | [S1] | High | Layered evaluation **ADOPTED** |
| L13 | FACT | FAISS is MIT licensed; its license text has no express patent grant. | [S17] | High | License review required |
| L14 | INFERENCE | Safe owned serving requires immutable generations, an external metadata/deletion authority, and authenticated manifests. | [S1][S6][S9] | High | **ADOPTED recommendation** |
| L15 | RECOMMENDATION | Dense ANN remains a deferred hybrid candidate after lexical baseline and representative evaluation. | Local architecture dossier; [S1] | High | **DEFERRED** |

## 14. Primary bibliography

All sources were accessed 2026-08-17. Wiki revision dates are noted where
material; repository `main` source is a moving snapshot, while v1.15.0 is the
identified release baseline.

- **[S1]** Douze, M. et al., “The Faiss Library,” arXiv:2401.08281v4,
  2025-10-23. Sections 1, 3–6 and Appendix.
  <https://arxiv.org/html/2401.08281>
- **[S2]** FAISS, “Releases,” v1.15.0, released 2026-08-03; changelog dated
  2026-07-31. <https://github.com/facebookresearch/faiss/releases/tag/v1.15.0>
- **[S3]** FAISS wiki, “Faiss indexes,” revised 2025-07-28. Index table and
  Flat/IVF/HNSW/PQ sections.
  <https://github.com/facebookresearch/faiss/wiki/Faiss-indexes>
- **[S4]** FAISS repository, `README.md`, `main` snapshot. Scope, metrics,
  CPU/GPU backends, authors, references, license.
  <https://github.com/facebookresearch/faiss/blob/main/README.md>
- **[S5]** FAISS wiki, “Guidelines to choose an index,” revised 2026-03-26.
  <https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index>
- **[S6]** FAISS wiki, “Index IO, cloning and hyper parameter tuning,” revised
  2024-01-11. I/O warning, CPU/GPU conversion, auto-tuning and reliability.
  <https://github.com/facebookresearch/faiss/wiki/Index-IO,-cloning-and-hyper-parameter-tuning>
- **[S7]** FAISS wiki, “Special operations on indexes,” revised 2024-08-02.
  Direct maps, removals, range search, split/merge.
  <https://github.com/facebookresearch/faiss/wiki/Special-operations-on-indexes>
- **[S8]** FAISS wiki, “Setting search parameters for one query,” revised
  2024-08-28. Per-query parameters and ID selectors.
  <https://github.com/facebookresearch/faiss/wiki/Setting-search-parameters-for-one-query>
- **[S9]** FAISS wiki, “FAQ,” revised 2025-08-05. Accuracy diagnosis,
  concurrency, distributed build, training, drift, retraining, filters, IDs,
  duplicates, and exactness caveats.
  <https://github.com/facebookresearch/faiss/wiki/FAQ>
- **[S10]** FAISS wiki, “Indexes that do not fit in RAM,” revised 2024-01-15.
  Demonstration RPC warning and mmap IVF behavior.
  <https://github.com/facebookresearch/faiss/wiki/Indexes-that-do-not-fit-in-RAM>
- **[S11]** FAISS wiki, “Threads and asynchronous calls,” revised 2026-04-30.
  Thread safety, batching, reproducibility, and asynchronous calls.
  <https://github.com/facebookresearch/faiss/wiki/Threads-and-asynchronous-calls>
- **[S12]** FAISS wiki, “Faiss on the GPU,” revised 2023-03-28. CPU/GPU
  interoperability, implemented index classes, limitations, memory, and
  multi-GPU behavior. Treated as legacy where v1.15 sources supersede it.
  <https://github.com/facebookresearch/faiss/wiki/Faiss-on-the-GPU>
- **[S13]** FAISS wiki, “Indexing 1G vectors,” revised 2021-04-01. Benchmark
  methodology and memory-overhead categories.
  <https://github.com/facebookresearch/faiss/wiki/Indexing-1G-vectors>
- **[S14]** FAISS public headers, `IndexIVF.h`, `IndexHNSW.h`, and
  `impl/IDSelector.h`, `main` snapshot. Search budgets, direct-map updates,
  non-concurrent HNSW add, and selector contract.
  <https://github.com/facebookresearch/faiss/blob/main/faiss/IndexIVF.h>
  <https://github.com/facebookresearch/faiss/blob/main/faiss/IndexHNSW.h>
  <https://github.com/facebookresearch/faiss/blob/main/faiss/impl/IDSelector.h>
- **[S15]** FAISS wiki, “How to make Faiss run faster,” revised 2023-03-08.
  Training/search knobs, batching, memory, NUMA and threading observations.
  <https://github.com/facebookresearch/faiss/wiki/How-to-make-Faiss-run-faster>
- **[S16]** Johnson, J.; Douze, M.; Jégou, H., “Billion-scale similarity search
  with GPUs,” arXiv:1702.08734, 2017; later IEEE Transactions on Big Data, 2019.
  Architecture and
  historical experiments. <https://arxiv.org/html/1702.08734>
- **[S17]** FAISS repository, `LICENSE`, `main` snapshot, MIT License.
  <https://github.com/facebookresearch/faiss/blob/main/LICENSE>

### Origin papers named by FAISS for algorithm attribution

These are algorithm origins, not evidence of Curiosity fitness or FTO:

- Jégou, H.; Douze, M.; Schmid, C., “Product Quantization for Nearest Neighbor
  Search,” IEEE TPAMI 33(1), 2011; author manuscript linked by FAISS FAQ.
  <https://hal.inria.fr/inria-00514462/document>
- Ge, T. et al., “Optimized Product Quantization,” CVPR 2013.
  <https://openaccess.thecvf.com/content_cvpr_2013/html/Ge_Optimized_Product_Quantization_2013_CVPR_paper.html>
- Malkov, Y.; Yashunin, D., “Efficient and Robust Approximate Nearest Neighbor
  Search Using Hierarchical Navigable Small World Graphs,” IEEE TPAMI 2020,
  arXiv:1603.09320. <https://arxiv.org/abs/1603.09320>
