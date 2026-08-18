# hnswlib: clean-room reverse-engineering dossier

**Decision frame:** What should Curiosity learn from hnswlib and HNSW, and under
what conditions could an HNSW candidate channel be added without making vector
similarity the source of truth, weakening deterministic rebuilds, or importing a
third-party engine into the owned core by accident?

**Snapshot:** Primary paper, official repository, source, tests, issue records,
license, and package registry accessed 2026-08-17. Source analysis is pinned to
official tag `v0.9.0`, commit `d9b3608c83d83b46c96e25088cb1d729b29dcfe9`
(2026-03-29). PyPI still reported `0.8.0`; “current source” and “current PyPI
package” are therefore not interchangeable [S2][S12].

**Clean-room boundary:** Publicly available paper, documentation, and source were
read to produce an independently worded behavioral specification. No hnswlib code,
index, fixture, or benchmark data is copied here; no package was installed or
executed; no private interface, credential, access-control bypass, or decompilation
was used. This report is not legal advice or patent clearance.

## Executive verdict

**ADAPT the algorithmic pattern; DEFER the dependency; REJECT hnswlib as the
owned search core (high confidence).** HNSW is a strong fit for a later,
memory-resident semantic **candidate-generation lane**: it incrementally builds a
bounded-degree hierarchy, navigates sparse upper layers greedily, and spends a
query-time `ef` budget on the base layer. hnswlib is small, fast, Apache-2.0, and
unusually inspectable. It is not a search service or evidence system. It supplies
labels and distances, not lexical matching, filters backed by an inverted index,
document versions, source authority, citations, calibrated confidence, durable
transactions, snapshot manifests, replication, or tenant isolation [S1-S8].

The consequential limitations for Curiosity are:

1. **Approximation is corpus- and workload-dependent.** `M`,
   `ef_construction`, and query `ef` trade memory/build time/query time for recall;
   no setting gives a portable recall guarantee [S1][S3][S7].
2. **The live object has a strict concurrency envelope.** Query/query and
   add/add are documented, but query/add and resize with either are not. A project
   maintainer separately confirmed simultaneous query/insert remained unsafe
   [S2][S10].
3. **Deletes are tombstones, updates are local graph repair, and replacement
   reuses a tombstoned slot.** These preserve memory and internal IDs but do not
   supply compaction, update isolation, or a published long-run recall guarantee
   [S2][S4].
4. **The binary snapshot is an implementation image, not a durable neutral
   format.** It has no magic, schema version, metric/dimension identity, checksum,
   or `ef`; it writes native-width fields and raw graph/vector records. Loading
   performs structural file-length checks, but untrusted snapshots should not be
   admitted to a serving process [S4][S11].
5. **Seeded is not universally reproducible.** Maintainers prescribe one-thread
   construction for reproducibility. Parallel insertion changes graph history;
   save/load and pickle do not preserve random-generator state for deterministic
   continuation [S5][S9].

For the architecture in ADR 0021, lexical retrieval should still precede vectors.
If an explicit ownership/license exception is later approved, evaluate hnswlib as
an isolated benchmark or replaceable read-only adapter. Otherwise implement only
the published HNSW concepts from an approved specification after patent/FTO review.

**Overall confidence:** high for v0.9.0 layout, algorithms, public API,
concurrency contract, persistence fields, and license; medium for cross-platform
snapshot behavior and update degradation; low for production recall, memory, and
latency until measured on Curiosity's corpus, embedding model, hardware, and query
slices.

## 1. Bounded questions and method

### Questions

1. How does HNSW construct and search its hierarchy, and where does hnswlib differ
   from the paper-level abstraction?
2. What do `M`, `ef_construction`, `ef`, capacity, metric, and thread count actually
   control?
3. What memory is reserved or allocated, and what concurrency combinations are
   supported?
4. What survives save/load, updates, deletions, replacement, and filtering?
5. Can a rebuild be deterministic and a snapshot safely promoted or rolled back?
6. How should recall, tail latency, build cost, and mutation drift be evaluated?
7. What security, license, patent, and clean-room boundaries apply?
8. Which behaviors should Curiosity adopt, adapt, reject, or defer?

### Method and stop rule

The paper establishes the algorithm and its conditional complexity arguments. The
v0.9.0 source establishes current implementation behavior. README/API material and
maintainer issue comments establish supported behavior where the source alone
cannot establish a contract. Tests are evidence of project intent, not proof for
all workloads. No contemporary vendor comparison or old paper benchmark is treated
as a Curiosity capacity promise.

Labels used below:

- **FACT** — directly supported by cited primary material.
- **INFERENCE** — independently reasoned from facts; not measured here.
- **RECOMMENDATION** — proposed Curiosity decision.
- Confidence is **high**, **medium**, or **low**.

Coverage stops after every requested category has a source-backed mechanism,
failure boundary, and Curiosity implication. Live benchmarking, malformed-snapshot
fuzzing, dependency adoption, and patent analysis require separate authority.

## 2. Product boundary and release state

**FACT (high):** hnswlib is a header-only C++11 implementation with Python
bindings. Python exposes squared L2, inner-product distance (`1 - dot`), and cosine
distance; cosine is implemented by normalizing vectors and using inner product.
C++ can provide a custom distance. The current repository advertises incremental
construction, same-label updates, tombstone deletion/replacement, filtering,
pickling, and C++-only multi-vector and epsilon search [S2][S5].

**FACT (high):** v0.9.0's release notes are mostly brute-force-filter fixes and a
behavioral change that throws when fewer than `k` results are available. The core
HNSW layout and algorithm remain the v0.8/v0.7 lineage. v0.7 introduced filters,
deleted-slot replacement, and update/insertion race/deadlock fixes [S2].

**FACT (high):** as accessed, GitHub tagged v0.9.0 while the official PyPI project
reported only source distribution 0.8.0 uploaded in 2023 [S2][S12].

**RECOMMENDATION (high):** identify any evaluation by immutable source commit,
build flags, compiler/standard library, CPU features, Python binding version, and
artifact digest. A bare `hnswlib==latest` claim is not reproducible.

### What hnswlib is not

It is not a vector database, durable service, or Web-search engine. The reviewed
surface has no transaction log, write-ahead recovery, atomic snapshot publication,
replication, sharding, background compaction, metadata index, predicate planner,
authorization, encryption, quotas, embedding generation, model registry, hybrid
fusion, or citation model. These are **negative results (high confidence)** from
the bounded v0.9.0 repository/API review [S2-S7].

## 3. HNSW graph model and construction

### 3.1 Paper-level model

**FACT (high):** HNSW is a sequence of proximity graphs over nested random subsets.
Every element receives a maximum level from an exponentially decaying distribution.
The top layers contain fewer nodes and longer-scale links; layer 0 contains all
nodes. This resembles a probabilistic skip list with proximity graphs replacing
linked lists [S1].

Paper insertion is:

1. choose the new element's random maximum layer;
2. begin at the current top-layer entry point;
3. greedily descend above the new element's level with search width one;
4. at each layer from `min(new_level, current_max_level)` to zero, search with
   width `efConstruction`;
5. select at most `M` diverse neighbors, add reciprocal edges, and prune neighbors
   that exceed their layer's degree bound; and
6. make the new node the entry point if it creates a new highest layer [S1].

The paper's neighbor heuristic considers candidates nearest to the inserted point,
accepting a candidate only when it is not closer to an already accepted neighbor
than to the inserted point. Its purpose is directional diversity and inter-cluster
connectivity, rather than simply retaining the `M` smallest distances [S1].

### 3.2 v0.9.0 construction specifics

**FACT (high):** hnswlib fixes several paper parameters internally [S4]:

| Mechanism | v0.9.0 behavior |
| --- | --- |
| upper-layer degree | `maxM = M` |
| layer-0 degree | `maxM0 = 2*M` |
| level multiplier | `1 / ln(M)` |
| construction width | `max(requested ef_construction, M)` |
| initial search width | `ef = 10` |
| random engines | level engine seeded with `random_seed`; update engine with seed + 1 |
| internal neighbor IDs | 32-bit unsigned integers |
| external labels | native `size_t` |

The source caps `M` at 10,000 with a warning, while public tuning guidance calls
2–100 reasonable and 12–48 suitable for many cases. The public range, not the
emergency source cap, is the useful operating envelope [S3][S4].

**INFERENCE (high):** 32-bit internal IDs impose an architectural ceiling below
`2^32` addressable nodes per index, with a much lower practical ceiling from RAM.
The reviewed constructor accepts capacity as native `size_t`; Curiosity must not
rely on implicit narrowing as a capacity check [S4].

**FACT (high):** the implementation assigns the first item synchronously in the
Python binding, then may add the remainder in parallel. New internal IDs are the
atomic insertion count. A per-label lock serializes operations hashing to one of
65,536 lock slots; a label map lock protects label-to-internal-ID assignment; a
global lock protects entry-point/max-layer transitions; and per-node locks protect
link-list mutation [S4][S5].

**FACT (high):** insertion candidate search keeps two priority queues and a visited
set. It stops when the nearest unexpanded candidate is farther than the worst
retained candidate and the construction queue has reached `ef_construction`.
Deleted nodes remain traversal candidates but are not selected into the retained
construction result [S4].

**FACT (high):** connection selection uses the diversity heuristic. A new node gets
at most `M` selected outgoing neighbors even on layer 0; reciprocal existing nodes
may retain up to `2*M` on layer 0 or `M` above it. When a reciprocal list is full,
the implementation reruns the heuristic over the existing list plus the newcomer
[S4].

**INFERENCE (high):** build order is part of the index. HNSW is incremental and
does not solve a global graph optimization problem; each insertion searches and
mutates the graph as it then exists. The paper explicitly says insertion order can
slightly alter performance, and concurrent completion introduces a larger order
variation [S1][S9].

## 4. Query search

**FACT (high):** search begins at the single current entry point. For every layer
above zero, hnswlib repeatedly moves to any neighbor strictly closer to the query
until reaching a local minimum. At layer 0 it runs a best-first expansion with an
effective width of `max(ef, k)`, then trims the retained queue to `k` and returns
external labels with distances [S4].

At the base layer:

- the candidate queue is ordered nearest-first;
- the result queue keeps the best `ef` candidates with its worst item on top;
- every node is evaluated at most once per search via a tagged visited array;
- a new node is enqueued when the result set is not full or it improves the current
  lower bound; and
- unfiltered/no-deletion search takes a “bare bone” path that skips predicate and
  tombstone checks [S4].

**FACT (high):** `ef` is a query-time breadth budget, not a distance threshold or a
recall promise. Higher values usually increase distance computations, recall, and
latency. Public guidance permits values from `k` to corpus size; the implementation
silently uses at least `k` even if configured lower [S3][S4].

**FACT (high):** the Python distance semantics matter:

- L2 is **squared** Euclidean distance;
- inner product is `1 - dot`, and is not a metric;
- cosine vectors are normalized on insertion/query, and `get_items` returns the
  normalized stored vectors [S2][S5].

**RECOMMENDATION (high):** never expose a hnswlib distance as evidence confidence,
authority, or a score comparable across metrics, embedding models, index
generations, or query types. It is one retrieval-channel feature.

## 5. Parameter effects and tuning

| Parameter | Direct effect | Main trade-off | Failure if misunderstood |
| --- | --- | --- | --- |
| metric + embedding model | defines neighborhood geometry | semantic coverage vs model bias/cost | wrong metric/model silently changes meaning |
| `M` | graph degree, layer distribution, and link memory | connectivity/recall vs RAM/build/query work | too small can disconnect hard regions; too large wastes memory and comparisons |
| `ef_construction` | candidate width during insertion and local repair | graph quality vs build/update time | low value permanently limits graph quality; query `ef` cannot always repair it |
| query `ef` | base-layer retained frontier | recall vs latency/CPU | global setting hides query-class and filter selectivity differences |
| `k` | returned neighbors; effective search width floor | result breadth vs work | selective filter/deletes may leave fewer than `k` and Python throws |
| `max_elements` | preallocated capacity and auxiliary arrays | headroom vs committed RAM | excessive headroom costs memory before items exist |
| thread count | batch build/query parallelism | throughput vs determinism/contention | add/query overlap is unsupported; parallel build is nondeterministic |
| insertion/update/delete history | final graph topology | freshness vs drift | same live vectors can yield different graphs and recall |

**FACT (high):** the paper recommends `mL = 1/ln(M)` and ground-layer maximum
degree `2*M`. Its experiments found the diversity heuristic equal or better than
nearest-only selection in tested cases, particularly for clustered/low-dimensional
data. It described approximately 5–48 as a useful `M` range; current hnswlib docs
broaden that to 2–100 and suggest 12–48 for many workloads [S1][S3].

**FACT (high):** official tuning guidance says construction quality has saturated
when increasing `ef_construction` no longer improves recall; it suggests checking
recall for `M` neighbors at query `ef = ef_construction`, with recall below 0.9 as
evidence of room to improve. This is a heuristic, not an acceptance threshold for
Curiosity [S3].

**RECOMMENDATION (high):** tune in this order:

1. freeze embedding model, normalization, metric, corpus version, and judged set;
2. choose candidate `M` values under a measured RAM budget;
3. raise `ef_construction` until held-out recall/build gains saturate;
4. sweep query `ef` by query class and filter selectivity;
5. select an operating point using Recall@candidate-depth plus p50/p95/p99 latency,
   CPU, throughput, and memory—not mean QPS alone; and
6. repeat after mutation histories, not only on a clean static build.

## 6. Memory and capacity

### 6.1 Core layout

**FACT (high):** v0.9.0 reserves one contiguous layer-0 record for every
`max_elements` slot. Each record contains [S4]:

```text
4-byte link-count/deletion word
+ (2 * M) 4-byte internal neighbor IDs
+ raw vector bytes
+ native-size external label
```

On a common 64-bit build with float32 vectors of dimension `d`, that core record is
`4 + 8M + 4d + 8` bytes. This is a source-derived sizing equation, not a portable
ABI guarantee. Upper layers are separately allocated only for inserted nodes, with
each level holding a 4-byte count plus `M` 4-byte IDs [S4].

**INFERENCE (high):** because level assignment satisfies approximately
`P(level >= l) = M^-l`, expected allocated upper levels per item are
`1/(M-1)`. Upper-link bytes are therefore small relative to the fully reserved
base layer for ordinary `M`; however, runtime overhead outside the serialized graph
is material.

### 6.2 Overheads omitted by simple `M * 8–10` guidance

The project's rough `M * 8–10` bytes/item describes graph-link scale, not complete
resident memory [S3]. Additional v0.9.0 structures include [S4][S6]:

- one pointer and one level integer per capacity slot;
- one mutex object per capacity slot (platform-size dependent);
- a hash map from every external label to internal ID;
- the set of reusable tombstoned internal IDs when enabled;
- one visited array of 2 bytes per capacity slot for every simultaneously checked-
  out search list; the pool grows under concurrency and retains lists;
- two query priority queues and associated storage scaling with `ef`;
- allocator metadata/fragmentation for per-node upper layers; and
- Python input/output, normalization, and batch-worker buffers.

**FACT (high):** `resizeIndex` can grow or shrink capacity only to at least the
stored element count. It reallocates the base block, pointer array, node-lock array,
and visited pool, and is explicitly not thread-safe with add or query [S2][S4].

**RECOMMENDATION (high):** capacity-plan using measured peak RSS at target query
concurrency, not serialized index size or vector bytes plus `M * 8`. Include rebuild
overlap: generation N and N+1 may coexist during atomic promotion, so peak RAM can
approach two complete indexes plus builders and page cache.

## 7. Concurrency and serving topology

### 7.1 Supported combinations

| Combination | Public contract | Assessment |
| --- | --- | --- |
| query + query | thread-safe | supported; each search checks out a visited list [S2][S6] |
| add/update + add/update | thread-safe | supported contract, but graph outcome depends on schedule [S2][S4][S9] |
| query + add/update | explicitly not thread-safe | prohibited [S2][S10] |
| resize + query/add | explicitly not thread-safe | prohibited [S2] |
| pickle + add | explicitly not thread-safe | prohibited [S2] |
| save/load + mutation/query | not promised | treat as prohibited; source exposes no snapshot-wide read/write lock [S4] |
| filter callback + parallel Python query | supported but documented slow | GIL/callback overhead; project recommends one thread [S2][S5] |

**FACT (high):** source locking is fine-grained around label-map and link mutations,
but query's upper-layer and base-layer reads are not protected by an index-wide
reader/writer protocol. This matches the public prohibition on simultaneous query
and insertion [S2][S4][S10].

**INFERENCE (medium):** v0.9.0 calls a shared level random engine during parallel
insertion without an obvious dedicated generator lock. Regardless of whether this
produces a practical race on a specific build, level assignment is not bound to a
stable external-label order. A sanitizer review would be required before treating
parallel build as memory-model evidence rather than only a documented API claim
[S4].

**RECOMMENDATION (high):** use immutable generations:

```text
canonical corpus manifest
  -> offline single-writer build and validation
  -> checksummed generation bundle
  -> read-only query replicas
  -> atomic routing switch
  -> drain old generation
```

Do not mix writes and reads in one index object. Buffer changes in the document
plane, build a new ANN generation, and retain a lexical/fallback path while it is
validated. This is simpler to reason about than trying to turn hnswlib locks into a
database isolation model.

## 8. Persistence and recovery

### 8.1 Native binary snapshot

**FACT (high):** `saveIndex` writes, in order, native binary values describing
offsets, capacity/count, record sizes, max level/entry point, `maxM`, `maxM0`, `M`,
level multiplier, and `ef_construction`; then the occupied contiguous layer-0
records; then each occupied node's upper-link byte count and raw bytes [S4].

It does **not** write:

- a magic signature or format/schema version;
- metric/space name, dimension, scalar type, or normalization policy;
- query `ef` (reset to 10 on load);
- random-generator state or original random seed;
- build code commit, compiler/ABI/CPU feature set, corpus/model manifest;
- `allow_replace_deleted` policy (the loader receives it separately);
- checksum, signature, encryption, creation time, or application metadata [S4][S11].

Deletion bits are embedded in layer-0 records and reconstructed on load. Capacity
may be overridden at load time if the requested capacity is at least the occupied
count [S4].

**FACT (high):** load scans the expected record sequence and requires the traversal
to end exactly at file size before allocation/copy. That catches many truncation or
trailing-data cases. The format still trusts native header sizes and raw graph
contents; it is not a hardened interchange parser [S4].

**INFERENCE (high):** native `size_t`, raw POD, and absent endianness/version fields
make cross-architecture and long-term compatibility an unstated assumption. The
caller supplies the distance space; source does not establish that the saved vector
width matches the caller's dimension/space. A wrong but parseable combination can
be semantically incorrect even when file-length validation succeeds [S4].

### 8.2 Python pickle

**FACT (high):** pickle state includes space, dimension, `ef`, seed, graph arrays,
labels, levels, and replacement policy with serialization version 1. Source TODOs
explicitly say random-generator state is not serialized/deserialized for full
reproducibility; reconstruction creates fresh generators from the original seed
[S5].

**RECOMMENDATION (high):** do not use pickle as a production artifact format or
load untrusted pickle. Generic pickle deserialization can execute code, and this
state still does not solve deterministic continuation.

### 8.3 Required Curiosity wrapper

If later authorized, a generation bundle must add an independently validated
manifest containing at least:

- hnswlib commit/artifact digest and Apache license material;
- platform/ABI, compiler, optimization/SIMD, scalar type, endianness;
- metric, dimension, normalization, embedding model and model digest;
- `M`, `ef_construction`, build seed/thread count/insertion-order digest;
- default and approved `ef` profiles;
- corpus/document/passage generation and label-map digest;
- live/tombstoned counts, build/update history, evaluation report;
- binary byte length and cryptographic digest/signature; and
- promotion, rollback, compatibility, and expiry status.

Write to a temporary artifact, flush according to the storage durability policy,
verify in a separate bounded process, then publish by atomic generation reference.
hnswlib's direct save is not itself crash-consistent publication.

## 9. Updates, deletes, replacement, and filtering

### 9.1 Same-label updates

**FACT (high):** adding an existing label updates rather than inserts. The source
overwrites the stored vector, preserves internal ID and level, and repairs graph
connections. Repair considers the updated node, one-hop neighbors, and selected
two-hop candidates; rebuilds affected neighbor lists with the heuristic; then runs
an insertion-like search to reconnect the updated point at its existing levels
[S2][S4].

**INFERENCE (medium):** this is bounded local repair, not a proof that the resulting
graph equals a clean rebuild over current vectors. Repeated large vector moves can
retain history-dependent topology. Neither paper nor current docs publish a bound
on recall loss after a mutation sequence.

### 9.2 Tombstone deletion

**FACT (high):** deletion sets one bit inside the layer-0 link-count word. It does
not remove the vector, label mapping, node, or edges. Searches may traverse deleted
nodes but omit them from results. `get_current_count` is stored count, not live
count; capacity is not reclaimed merely by marking a node deleted [S2][S4].

**INFERENCE (high):** tombstones can preserve connectivity better than immediate
edge removal, but a high deleted fraction wastes vector RAM and distance
computations and can make `k` live results harder to obtain. A deletion SLA must be
defined at the serving response and generation layers, not inferred from physical
erasure.

### 9.3 Replacing deleted slots

**FACT (high):** replacement must be enabled when creating/loading the index and
requested on add. hnswlib takes an internal ID from an unordered deleted-ID set,
changes its external label, clears the tombstone, overwrites the vector, and runs
the update repair at the slot's existing random level [S2][S4].

**INFERENCE (high):** reuse saves capacity but couples a new point to an old point's
level and an arbitrary reusable-slot selection. It is unsuitable for deterministic
rebuilds and complicates forensic deletion. `unmark_deleted` is also explicitly
unsafe to use when replacement is enabled because the slot may already have been
repurposed [S4].

### 9.4 Query filters

**FACT (high):** the filter is a label predicate. Upper-layer navigation is
unfiltered. At the base layer, disallowed labels and tombstones are excluded from
the retained result set but still serve as traversal nodes. There is no metadata
index or prefilter candidate generation [S2][S4].

Consequences:

- selective filters can require much more traversal;
- filtered nodes do not disconnect the navigation graph because traversal remains
  permitted through them;
- fewer than `k` permitted nodes yields a short C++ result and a Python exception;
- Python callbacks are GIL-limited and documented as slow with multiple threads
  [S2][S4][S5].

**RECOMMENDATION (high):** enforce corpus, tenant, deletion, and rights policy
before ANN admission and again after retrieval. Do not use a Python callback as the
primary authorization boundary. For substantial structured filtering, use lexical/
metadata candidate sets, partitioned indexes with measured economics, or a purpose-
built filtered ANN design; always oversample then policy-filter and backfill within
a hard work budget.

## 10. Deterministic rebuilds

### 10.1 What is reproducible

**FACT (high):** maintainers state construction is reproducible with one thread.
The source seeds level and update generators, and the paper says level randomness
removes the requirement to pre-shuffle input [S1][S4][S9].

**QUALIFICATION (high):** this is narrower than byte-identical, portable rebuilds:

- input order still affects graph history;
- multiple construction threads change insertion order and observed recall;
- C++ `default_random_engine` is implementation-defined across standard libraries;
- floating-point SIMD/compiler choices and distance ties may change comparisons;
- deleted-slot selection comes from an unordered set;
- hash iteration order makes APIs such as the ID list unordered; and
- save/load and pickle do not preserve generator state for identical future appends
  [S1][S4][S5][S9].

### 10.2 Curiosity deterministic-build profile

**RECOMMENDATION (high):** if reproducibility is a gate:

1. create a canonical, content-addressed list of `(stable label, vector bytes)`;
2. sort by an explicit stable key and reject duplicate labels;
3. reject NaN/Infinity, define zero-vector behavior, and freeze normalization;
4. pin embedding model, metric, dimension, scalar representation, code commit,
   compiler/stdlib, CPU path, all HNSW parameters, and seed;
5. build with one insertion thread and no in-place updates/replacements;
6. validate graph integrity, exact artifact digest, recall slices, and query canaries;
7. use immutable snapshots; rebuild from canonical current state after a bounded
   mutation threshold; and
8. distinguish **semantic reproducibility** (same acceptance metrics/results within
   declared tie rules) from **byte reproducibility** (identical artifact digest).

**UNKNOWN:** byte-identical behavior across OS/CPU/compiler combinations has no
official guarantee. It must not be an acceptance criterion without a pinned build
matrix and empirical check.

## 11. Recall, latency, and evaluation

### 11.1 What the paper proves—and does not

**FACT (high):** the paper gives an `O(log N)` search argument only under strong
conditions involving exact Delaunay-like layers and bounded average degree, then
uses empirical low-dimensional results to study approximation. It explicitly says
further analytical evidence is needed for whether resilience generalizes to high
dimensions. Construction is argued as `O(N log N)` under the corresponding
relatively-low-dimensional assumptions [S1].

**FACT (high):** paper benchmarks showed strong recall/time results on its 2016-era
hardware, data, rivals, and tuning. Its 200M SIFT comparison used 64 GB peak RAM for
the tested HNSW configurations versus 23.5–30 GB for compressed Faiss variants,
illustrating HNSW's speed/accuracy versus memory trade rather than a universal win
[S1].

**RECOMMENDATION (high):** use these results as mechanism evidence only. They do
not predict 2026 Curiosity passage embeddings, Web-domain distribution, filters,
tail latency, or current alternatives.

### 11.2 Required evaluation matrix

For each frozen corpus/model generation, compare ANN results with exact search on a
rights-approved stratified sample, as official hnswlib guidance proposes [S7].
Measure:

| Dimension | Minimum measures |
| --- | --- |
| retrieval quality | Recall@k and Recall@candidate-depth against exact vector neighbors; downstream nDCG/primary-source recall after fusion |
| query slices | exact entity, rare term, paraphrase, broad concept, multilingual, temporal, adversarial, duplicate-heavy, no-answer |
| filter slices | allowed fraction, tenant/source/time policy, tombstone ratio, fewer-than-k cases |
| latency | p50/p95/p99 service and kernel time, distance computations, cold/warm cache, batch size |
| throughput | concurrent read-only QPS at fixed tail-latency and recall SLO |
| build | wall time, CPU-hours, peak RSS, artifact size, temporary disk, promotion time |
| mutation | recall/latency after realistic updates/deletes/replacements versus clean rebuild |
| reliability | load/validation time, corrupt/truncated/wrong-manifest rejection, rollback, replica agreement |
| stability | repeat builds by seed/thread/platform; result-overlap and artifact-digest variance |

Sweep a predeclared grid of `M`, `ef_construction`, and query `ef`. Report Pareto
frontiers rather than choosing the highest aggregate recall. The serving profile
may select different bounded `ef` values by query class, but must cap CPU/deadline
and record the effective value.

### 11.3 Hybrid-search acceptance gate

An ANN lane should advance only if, against lexical-only retrieval on held-out
Curiosity judgments, fused retrieval produces a material increase in unique
relevant evidence/primary-source recall or contradiction discovery **without** an
unacceptable regression in exact/entity/rare-term slices, citation resolvability,
p95/p99 latency, memory, or deletion propagation. Vector-neighbor recall alone is
necessary for diagnosing ANN but insufficient for product adoption.

## 12. Security and abuse analysis

### 12.1 Untrusted vectors and queries

**FACT (high):** Python validates array dimensionality and force-casts contiguous
input, but the reviewed path does not establish a finite-number policy. Cosine
normalization adds a tiny denominator term, making a zero vector remain effectively
zero rather than rejecting it [S5].

**INFERENCE (high):** NaN/Infinity can undermine strict priority-queue comparisons;
duplicate or adversarially clustered vectors can stress tie behavior, graph
connectivity, recall, and insertion/search cost. Embedding/index poisoning can make
attacker-controlled passages neighbors of valuable queries. HNSW has no concept of
publisher trust or evidence authority.

**RECOMMENDATION (high):** validate dimension, byte count, finiteness, norm range,
label uniqueness, per-source quotas, duplicate/near-duplicate policy, model/corpus
authorization, and total admission budget before construction. Keep source trust,
safety, and diversity as independent reranking/policy signals.

### 12.2 Resource exhaustion

Bound `max_elements`, `M`, `ef_construction`, `ef`, `k`, dimensions, batch rows,
thread count, filter work, load file size, build duration, and concurrent queries.
The source's `M <= 10000` cap is far too permissive to serve as a deployment budget,
internal IDs are only 32-bit, and every simultaneous visited list costs
capacity-proportional memory [S4][S6].
Reject queries or degrade to a declared fallback rather than allowing unbounded
`ef` to become denial-of-wallet.

### 12.3 Snapshot trust boundary

**INFERENCE (high):** a malformed binary header can drive native-size arithmetic,
seeks, and allocations before semantic graph validation. File-length checks are
valuable but do not make the loader safe for hostile input [S4].

Load only authenticated project-produced artifacts, verify outer manifest/digest
and strict size ceilings first, use a low-privilege bounded validation process, and
promote only after graph-integrity and query-canary checks. Never accept an uploaded
hnswlib binary or pickle directly into a long-lived agent/search process.

### 12.4 Data confidentiality and result safety

Embeddings can reveal corpus membership or sensitive semantics; labels can expose
stable document IDs. Apply tenant isolation, least-privilege artifact access,
encryption at rest/in transit in the surrounding service, query-log minimization,
and deletion/audit procedures. Returned passages remain untrusted external evidence
and cannot grant tool authority. hnswlib labels/distances must resolve through the
document plane to an authorized immutable capture before citation.

## 13. License, patent, and clean-room boundary

### 13.1 Apache-2.0

**FACT (high, not legal advice):** the repository contains the Apache License 2.0.
It grants copyright and contributor patent licenses subject to conditions, requires
a copy of the license on redistribution, prominent notices on modified files, and
retention of applicable notices; its patent grant has scope and patent-litigation
termination terms [S8]. No separate `NOTICE` file was found in the pinned root
during this bounded inspection.

**RECOMMENDATION (high):** if hnswlib is adopted as a dependency, record exact
version/source, preserve license/notices, mark modifications, generate an SBOM, and
run dependency/security/license review. “Apache-2.0” does not make hnswlib
project-owned; under ADR 0021's strict owned-core premise, inclusion requires an
explicit exception.

### 13.2 Update patent uncertainty

**FACT (high):** the official README says its update algorithm was to be published
in “Dynamic Updates For HNSW, Hierarchical Navigable Small World Graphs,” US patent
application 15/929,802, naming Apoorv Sharma, Abhishek Tayal, and Yury Malkov [S2].

**UNKNOWN (material):** this pass did not resolve the application's publication,
grant, ownership, jurisdictional family, expiration, claim scope, or whether every
relevant claim is covered by Apache-2.0 contributor patent grants. The README's
application identifier is not a freedom-to-operate opinion.

**RECOMMENDATION (high):** legal counsel must perform a targeted patent/FTO and
contributor-ownership review before independently implementing hnswlib-style update
repair or distributing a modified implementation. Until then, specify static HNSW
from the paper separately from the repository's later update behavior.

### 13.3 Clean-room transfer rule

Safe lessons are published HNSW hierarchy/search/neighbor-selection concepts,
independently expressed parameter contracts, and observed operational requirements.
Do not translate source line-by-line into an “owned” implementation. For a strict
from-scratch path, researchers may produce an approved functional specification;
implementers should work from the paper/specification and independent fixtures,
with source-reading and implementation provenance separated. Any direct source use
is an Apache third-party dependency, not clean-room project code.

## 14. Exact Curiosity implications

1. **Keep lexical first.** HNSW is an additional semantic candidate channel after
   the deterministic lexical baseline passes its gates; it never replaces exact
   term/entity retrieval or citation evidence.
2. **Separate provider-neutral contracts.** Core search requests express semantic
   candidate budget, corpus/model generation, filters, and deadline. An hnswlib
   adapter maps these to `k`/`ef`; `M` and `ef_construction` remain generation
   metadata, not caller controls.
3. **Fuse, do not equate scores.** Fuse lexical and ANN ranks with an independently
   specified method, then apply policy, tombstones, duplicate clustering, source
   authority, freshness, and diversity. Never compare raw BM25 and vector distance
   as if calibrated.
4. **Resolve through provenance.** ANN labels point to stable passage/document IDs.
   Responses must recover capture ID, exact passage, content hash, fetch time,
   embedding model, index generation, and channel/rank before synthesis.
5. **Use immutable read replicas.** No query/update overlap. Build offline, validate,
   atomically promote, retain rollback, and rebuild after bounded change thresholds.
6. **Make approximation visible.** Trace metric, model/index generation, `k`,
   effective `ef`, returned count, distance, filter/backfill status, partial failure,
   and whether lexical fallback was used.
7. **Treat model changes as full generations.** New dimensions, normalization,
   model weights, or passage segmentation require re-embedding and clean rebuild,
   not in-place update.
8. **Bound filtering.** Enforce hard policy before admission and after candidate
   retrieval; oversample/backfill only within shared branch budgets. A callback is
   not an authorization system.
9. **Monitor mutation debt.** Record stored/live/tombstone counts, update count and
   displacement, recall canaries, and rebuild age. Trigger clean rebuild on measured
   degradation, not folklore.
10. **Support deterministic fallback.** If ANN is unavailable, stale, over budget,
    or fails generation checks, lexical search continues with an explicit coverage
    warning.
11. **Do not give ANN curiosity authority.** Retrieval returns candidates and
    coverage signals. Only the caller-framed researcher may initiate the one bounded
    follow-up pass; ANN similarity cannot autonomously expand scope.
12. **Evaluate marginal curiosity value.** Measure unique relevant evidence and
    contradiction gain per ANN branch, not merely nearest-neighbor recall.

### Conceptual neutral result extension

```text
retrieval_channel: semantic_ann
index_generation: content-addressed manifest ID
embedding_model: model/version digest
metric: cosine | squared_l2 | inner_product
candidate_rank: positive integer
distance: channel-local, uncalibrated
effective_ef: bounded integer
document_id + capture_id + passage_id
policy_state: admitted | filtered | backfilled
warnings: approximate | generation_stale | fewer_than_k | fallback_used
```

This is a contract recommendation, not copied API or implementation code.

## 15. Verdict ledger

| ID | Type | Finding | Confidence | Verdict |
| --- | --- | --- | --- | --- |
| H1 | Fact | HNSW uses random nested proximity layers, greedy upper descent, and bounded base-layer expansion. | High [S1][S4] | **ADOPT** the published candidate-generation concept. |
| H2 | Fact | hnswlib fixes upper degree to `M`, base degree to `2M`, and level multiplier to `1/ln(M)`. | High [S4] | **ADAPT** into generation metadata, not public request knobs. |
| H3 | Fact | `M`, `ef_construction`, and `ef` jointly trade RAM/build/query work for recall. | High [S1][S3] | **ADOPT** explicit tuning/evaluation gates. |
| H4 | Fact | Python query/query and add/add are documented safe; query/add is not. | High [S2][S10] | **REJECT** mixed read/write serving; use immutable generations. |
| H5 | Fact | binary save omits metric, dimension, version, checksum, RNG state, and query `ef`. | High [S4][S11] | **REJECT** it as standalone durable artifact; wrap in a signed manifest. |
| H6 | Fact | deletion is a result-suppressing tombstone; replacement reuses a deleted slot and level. | High [S4] | **ADAPT** only for transient experiments; rebuild for production hygiene. |
| H7 | Inference | repeated local updates can produce history-dependent quality unlike a clean rebuild. | Medium [S4] | **DEFER** update-heavy operation pending mutation benchmarks. |
| H8 | Fact | filters are label callbacks applied to result eligibility while traversal crosses filtered nodes. | High [S2][S4] | **REJECT** as primary policy/metadata filtering. |
| H9 | Fact | single-thread builds are maintainer-prescribed for reproducibility; parallel builds vary. | High [S9] | **ADOPT** a one-thread deterministic build profile where required. |
| H10 | Inference | byte portability/reproducibility across ABI/compiler/CPU is not established. | High [S4][S5] | **ADAPT** with pinned builds and semantic-vs-byte reproducibility gates. |
| H11 | Fact | repository is Apache-2.0, but README identifies a patent application for updates. | High [S2][S8] | **DEFER** dependency/independent update repair pending ownership and legal review. |
| H12 | Fact | GitHub v0.9.0 and PyPI 0.8.0 differed at access time. | High [S2][S12] | **ADOPT** commit/artifact pinning; **REJECT** unpinned `latest`. |
| H13 | Recommendation | Vector distances are not provenance, truth, authority, or calibrated confidence. | High | **ADOPT.** |
| H14 | Recommendation | Add ANN only after measured incremental gain over lexical retrieval. | High | **ADOPT** ADR 0021's staged gate. |
| H15 | Recommendation | hnswlib cannot be the wholly owned core without a reviewed third-party exception. | High | **REJECT** as current foundation; **DEFER** as adapter/benchmark. |

## 16. Unknowns and required checks

| Unknown | Why it matters | Required non-production check |
| --- | --- | --- |
| Recall/latency on Curiosity passages | paper/project data do not represent the Web corpus | frozen exact-neighbor and downstream judged benchmark by query class |
| Memory at target capacity/concurrency | mutex, map, visited-pool, allocator, and rebuild overlap dominate simple estimates | peak RSS and allocation profile under cold/warm read concurrency and dual generations |
| Long-run update/delete drift | no published workload-independent guarantee | replay realistic change histories; compare each checkpoint with a clean rebuild |
| Selective-filter behavior | callback traversal can inflate latency or return fewer than k | sweep allowed fractions, `ef`, tombstones, backfill, and p99 |
| Cross-platform artifact compatibility | native binary format has no portable contract | explicit build/load matrix; reject unsupported combinations in manifest validator |
| Byte-identical rebuild envelope | RNG implementation, SIMD, ties, and allocator/ABI may vary | repeat pinned one-thread builds and compare graph/artifact/result digests |
| Crash behavior during save/promotion | direct save has no transaction protocol | kill/fault-injection around wrapper temp-write, flush, verify, rename, and rollback |
| Malformed binary safety | source validation is structural, not hardened hostile parsing | separately authorized fuzzing in a sandbox with ASan/UBSan and strict file/RSS/time caps |
| Parallel insertion memory-model safety | shared RNG call lacks an obvious dedicated lock | upstream clarification plus TSAN on pinned source; not needed for deterministic profile |
| Patent application status/scope | affects independent update implementation and distribution | counsel-led USPTO/family/assignment/claims/FTO review |
| v0.9.0 package provenance | PyPI lag means source and registry artifact differ | build/release provenance, signatures/digests, dependency scanner, reproducible package build |
| Takedown physical-erasure requirements | tombstone is logical suppression, not byte erasure | privacy/legal deletion design across vectors, snapshots, replicas, backups, and manifests |

## 17. Bounded curiosity pass

Scoring: 1 (low) to 5 (high); cost 1 is cheap and 5 is expensive.

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Inspect exact v0.9.0 graph/search/persistence layout | 5 | 5 | 4 | 2 | **Pursued:** resolved degree caps, memory layout, effective `ef`, snapshot omissions, and tombstone traversal. |
| Reconcile source release with PyPI | 4 | 4 | 4 | 1 | **Pursued:** GitHub is v0.9.0; PyPI remained 0.8.0 [S2][S12]. |
| Verify reproducibility contract | 5 | 5 | 4 | 1 | **Pursued:** maintainer records require one-thread construction; source shows RNG-state serialization gaps [S5][S9]. |
| Verify simultaneous query/update safety | 5 | 5 | 3 | 1 | **Pursued:** README and 2024 maintainer answer agree it is unsafe [S2][S10]. |
| Quantify full memory rather than link estimate | 5 | 5 | 4 | 2 | **Pursued:** source-derived core formula plus capacity/mutex/map/visited-list overhead classes. |
| Resolve update patent family and claims | 5 | 5 | 5 | 5 | **CURIOSITY_NO_GO:** legal/FTO work requires counsel and authoritative patent search; retained as blocking unknown. |
| Fuzz malformed snapshots | 4 | 5 | 4 | 4 | **CURIOSITY_NO_GO:** live security testing was not authorized; source review establishes the need and safe test plan. |
| Benchmark current ANN competitors | 3 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** outside the hnswlib mechanism frame and impossible to make decision-relevant without Curiosity corpus/SLOs. |
| Reproduce paper performance numbers | 2 | 2 | 1 | 5 | **CURIOSITY_NO_GO:** old hardware/data comparison would not answer Curiosity's adoption gate. |
| Infer proprietary vector-database implementations | 1 | 1 | 3 | 5 | **CURIOSITY_NO_GO:** unnecessary and outside clean-room scope. |
| Implement or copy a reference index | 1 | 1 | 1 | 5 | **CURIOSITY_NO_GO:** caller prohibited implementation/code copying; architecture decision does not require it. |

**Stop:** requested graph, parameter, construction/search, memory, concurrency,
persistence, mutation, filter, determinism, performance, security, license,
clean-room, and Curiosity dimensions are covered. Source and docs saturated around
the same contracts. Remaining high-value gaps require a Curiosity corpus/SLO,
authorized dynamic testing, or counsel, so the pass stopped on coverage and
authority exhaustion.

## Sources

All sources were accessed 2026-08-17. Repository links are pinned where behavior is
material.

- **[S1]** Y. A. Malkov and D. A. Yashunin, “Efficient and Robust
  Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World
  Graphs,” *IEEE TPAMI* 42(4), 824–836; arXiv v4.
  <https://arxiv.org/abs/1603.09320> and
  <https://doi.org/10.1109/TPAMI.2018.2889473>.
- **[S2]** nmslib/hnswlib, official README and release/API documentation, tag
  v0.9.0, commit `d9b3608c83d83b46c96e25088cb1d729b29dcfe9`.
  <https://github.com/nmslib/hnswlib/blob/d9b3608c83d83b46c96e25088cb1d729b29dcfe9/README.md>.
- **[S3]** nmslib/hnswlib, official algorithm parameter guidance, same commit.
  <https://github.com/nmslib/hnswlib/blob/d9b3608c83d83b46c96e25088cb1d729b29dcfe9/ALGO_PARAMS.md>.
- **[S4]** nmslib/hnswlib, `hnswalg.h`, same commit: state/layout and initialization
  lines 14–143; construction search 225–304; query search 308–483; neighbor
  connection 506–629; resize/save/load 633–821; deletion 849–946; replacement and
  updates 949–1138; insertion/query 1152–1323.
  <https://github.com/nmslib/hnswlib/blob/d9b3608c83d83b46c96e25088cb1d729b29dcfe9/hnswlib/hnswalg.h>.
- **[S5]** nmslib/hnswlib, Python bindings, same commit: metric setup and init
  lines 145–248; parallel add 251–304; pickle state/RNG TODOs 351–609; query/filter
  612–675.
  <https://github.com/nmslib/hnswlib/blob/d9b3608c83d83b46c96e25088cb1d729b29dcfe9/python_bindings/bindings.cpp>.
- **[S6]** nmslib/hnswlib, visited-list pool, same commit.
  <https://github.com/nmslib/hnswlib/blob/d9b3608c83d83b46c96e25088cb1d729b29dcfe9/hnswlib/visited_list_pool.h>.
- **[S7]** nmslib/hnswlib, official exact-recall testing guidance, same commit.
  <https://github.com/nmslib/hnswlib/blob/d9b3608c83d83b46c96e25088cb1d729b29dcfe9/TESTING_RECALL.md>.
- **[S8]** nmslib/hnswlib, Apache License 2.0 file, same commit.
  <https://github.com/nmslib/hnswlib/blob/d9b3608c83d83b46c96e25088cb1d729b29dcfe9/LICENSE>.
- **[S9]** Official hnswlib issue #65 and maintainer comments on reproducible
  construction; issue #28 and maintainer comment on multithreaded variation.
  <https://github.com/nmslib/hnswlib/issues/65#issuecomment-431399412> and
  <https://github.com/nmslib/hnswlib/issues/28#issuecomment-398461511>.
- **[S10]** Official hnswlib issue #562, maintainer confirmation that simultaneous
  query and insert is not thread-safe (2024-05-28).
  <https://github.com/nmslib/hnswlib/issues/562#issuecomment-2134268552>.
- **[S11]** Official hnswlib issue #358, maintainer explanation that binary save
  omits `ef` for historical compatibility and pickle includes it.
  <https://github.com/nmslib/hnswlib/issues/358#issuecomment-1002794850>.
- **[S12]** Python Package Index, official `hnswlib` project JSON metadata and
  release files, reporting version 0.8.0 at access time.
  <https://pypi.org/pypi/hnswlib/json>.

### Negative results retained

- No official portable/versioned binary index-format specification was found.
- No official transactional save, crash-recovery, replication, or atomic promotion
  protocol was found.
- No official recall/SLO guarantee, update-drift bound, or filter-selectivity cost
  model was found.
- No official cross-platform byte-reproducibility guarantee was found.
- No current PyPI 0.9.0 artifact was present despite the official GitHub tag.
- No legal conclusion about update-patent status or Apache patent-grant coverage was
  reached; this remains a required specialist review.
