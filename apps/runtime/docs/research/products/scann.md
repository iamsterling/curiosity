# ScaNN vector search: clean-room reverse-engineering dossier

**Decision frame:** Should Curiosity adopt ScaNN as a local approximate-nearest-
neighbor (ANN) engine, and which of its partitioning, quantization, and reranking
patterns should Curiosity adopt, adapt, reject, or defer independently of the
library?

**Snapshot and boundary:** Primary papers, Google Research documentation, the
public Apache-2.0 source tree, release notes, and PyPI metadata were accessed
2026-08-17. Source observations are pinned to Google Research commit
`1eb8bb0cbe5fd9072311ae3fd760e3644fee690b` (2026-08-16). No private Google
system, service endpoint, credential, traffic, binary disassembly, benchmark run,
or code reuse was involved. This is clean-room architecture analysis, not an
implementation and not a claim about Google's internal serving stack.

**Status:** Research evidence and recommendations, not implementation,
procurement approval, legal advice, or a production-readiness certification.

## Executive verdict

ScaNN is a strong **in-process, CPU-oriented ANN kernel**, not a vector database
or retrieval service. Its characteristic large-index pipeline is:

```text
trained vector-quantization tree / inverted lists
  -> probe selected leaves
  -> score their compressed residual/product-quantization codes
  -> retain an oversized candidate set
  -> rescore that set from a higher-fidelity vector representation
  -> return top-k
```

The transferable design is the explicit separation of **candidate pruning,
cheap approximate scoring, and bounded high-fidelity reranking**. ScaNN's
anisotropic quantization is unusually aligned with maximum-inner-product search
(MIPS): instead of minimizing vector reconstruction error uniformly, it protects
score error for vectors likely to rank highly. SOAR extends the same end-task
principle to partitioning by giving a vector a complementary second partition
assignment whose residual is encouraged to fail differently from its primary
assignment [S1][S2][S11].

**Curiosity disposition: ADAPT, with a bounded evaluation; do not make ScaNN the
provider-neutral contract.** Adopt the staged retrieval pattern and end-metric-
aware training lesson. Adapt ScaNN behind a generation-versioned ANN adapter if
Curiosity's corpus is Linux/CPU, memory-resident, and rebuildable. Reject any
assumption that its benchmark curve establishes Curiosity quality or production
latency. Defer engine selection until Curiosity measures recall, filtered recall,
build/update cost, resident memory, and p50/p95/p99 latency on its own embeddings
and hardware.

The largest deployment gaps are outside ANN math: the open-source package does
not provide a network service, replication, write-ahead log, transactional
updates, distributed sharding, multi-tenant isolation, rich metadata filtering,
or a published durability/availability contract. Current wheels are Linux-only;
official serving images are CPU-only. Dynamic insert/update/delete exists, but
the operational contract and sustained-update benchmarks are much thinner than
the static-search evidence [S5][S6][S7][S8][S9].

**Overall confidence:** high for the public algorithm stages, builder/API
surface, platform requirements, dynamic-update existence, and license; medium
for source-derived runtime behavior and operational implications; low for
Curiosity-specific recall/latency, update-heavy stability, memory at our scale,
and compatibility across future artifact versions.

## 1. Bounded questions and evidence method

### 1.1 Questions

1. How does ScaNN partition a dataset and select work at query time?
2. What does “asymmetric hashing” mean, and what exactly is anisotropic about
   ScaNN's quantization objective?
3. How are approximate scores, residual quantization, candidate selection, and
   reordering composed?
4. Which CPU, SIMD, memory-bandwidth, and batching assumptions underlie the
   reported performance?
5. What is trained at build time; what can be inserted, modified, deleted,
   serialized, rebalanced, or incrementally maintained?
6. What do the published recall/throughput results prove, and what do they not?
7. Which service, durability, filtering, and lifecycle capabilities would
   Curiosity still have to own?
8. What can be learned or reused under the public license without copying code
   or implying access to undisclosed Google systems?

### 1.2 Labels and source policy

- **FACT** — directly stated in a cited paper/document, or directly observable
  in the pinned public source contract. Source behavior is identified as such.
- **INFERENCE** — the smallest architecture or operational consequence
  consistent with those facts; not a vendor promise.
- **RECOMMENDATION** — a Curiosity decision.
- Confidence is **high**, **medium**, or **low**.

The ICML and NeurIPS papers are primary evidence for the algorithms and their
reported experiments. The pinned public repository is primary evidence for the
open-source implementation surface. Google blog claims are useful first-party
context, not independent benchmark replication. Negative source results mean
that the cited public tree and docs were checked; they do not prove that a
capability cannot exist in another Google system.

## 2. Product and algorithm boundary

**FACT (high):** ScaNN (Scalable Nearest Neighbors) is a configurable
single-machine vector similarity-search library supporting dot-product/MIPS and
squared-L2 search. The public Python builder exposes brute-force and asymmetric-
hash scoring, optional partitioning, optional PCA/truncation, optional
reordering, and an autopilot configuration path [S3][S4][S7].

**FACT (high):** The documented pipeline has three phases [S3]:

1. **Partitioning (optional):** train partitions, then choose query-relevant
   partitions.
2. **Scoring:** score every point in the whole dataset or every point in the
   selected partitions, possibly approximately.
3. **Rescoring/reordering (optional):** select the best `k'` approximate
   candidates, recompute their distances more accurately, and choose final
   `k`.

**INFERENCE (high):** ScaNN is not itself semantic search. Embedding generation,
document/chunk identity, metadata, authorization, lexical retrieval, fusion,
freshness, provenance, and final evidence ranking remain external. Its output
quality cannot exceed the semantic and temporal information encoded in the
vectors and candidate corpus.

## 3. Partitioning and search-space pruning

### 3.1 Standard vector-quantization index

**FACT (high):** ScaNN's standard large-data path is a vector-quantization (VQ)
tree/inverted index. Training learns partition centers and assigns datapoints to
them. At query time it scores the much smaller center set, selects a fixed number
of the best leaves, and scans the points associated with those leaves [S3][S11].
The current builder configures a k-means-style partitioner with squared-L2
training distance, a configurable query-tokenization distance, fixed-number
query spilling, and generic or spherical partitioning [S4].

The two principal query/build controls are:

| Control | Effect | Trade-off |
| --- | --- | --- |
| `num_leaves` | Number of trained partitions. | More leaves can improve pruning resolution but increase training/center-selection work and risk imbalance. |
| `num_leaves_to_search` | Number of leaves probed per query; overridable at search time. | More leaves increase candidate recall and scanned points, reducing speed. |

The official rule of thumb is about `sqrt(n)` leaves; tune the probe fraction
`num_leaves_to_search / num_leaves` to the target recall. The same guide advises
brute force below about 20,000 points, AH plus reordering below about 100,000,
and partition + AH + reordering above about 100,000 [S3]. These are heuristics,
not complexity guarantees or Curiosity thresholds.

**FACT (high):** Current builder defaults expose a partition-training sample of
100,000 points, 12 clustering iterations, minimum partition size 50, random
initialization, optional quantized centroids, and optional upper-tree/multi-level
partitioning [S4]. Therefore a default build need not fit centers against every
point even though every point must ultimately receive an index assignment.

**INFERENCE (medium):** Search cost is driven more directly by the total number
of datapoints in selected leaves than by the leaf count alone. Distribution
shift and imbalanced leaves can make a fixed probe count produce unstable work
and recall. Curiosity should record scanned-candidate count and partition-size
statistics, not only `leaves_to_search`.

### 3.2 Residual Tree-AH

**FACT (high):** For the builder's normal tree + dot-product + AH composition,
residual quantization is enabled by default. Instead of quantizing the full
database vector identically in every leaf, the Tree-AH implementation derives a
vector relative to its assigned center and hashes that residual; candidate
scores combine partition context with the residual representation [S4][S13].
Pinned source restricts this residual Tree-AH path to dense float data, a
k-means-tree partitioner, and dot-product distance [S13].

**INFERENCE (high):** Partitioning captures coarse location while residual AH
spends the limited code budget on within-leaf variation. This is analogous to
IVF-PQ, but “similar architecture” is not binary or score compatibility.

### 3.3 SOAR: complementary spilled assignments

**FACT (high):** SOAR (Spilling with Orthogonality-Amplified Residuals) assigns a
datapoint to a primary VQ partition and a second, deliberately complementary
partition. If `r` is the primary residual and `r'` a candidate spilled residual,
the paper's loss is proportional to [S11]:

```text
||r'||² + lambda * ||projection of r' onto r||²
```

Thus a second center is not merely the second-nearest center. It is penalized
when its error aligns with the primary error, making the two assignments less
likely to miss the same true neighbor. Current Python configuration exposes
SOAR for dot-product partitioning through `soar_lambda`; it is optional, not the
default [S4].

**FACT (high):** A SOAR vector can occur in two probed leaves, so query results
require deduplication. Only the compact PQ representation is duplicated, not
the highest-fidelity float32/int8 representation. The paper reports index-size
growth from 453.5 to 488.4 MB (+7.7%) on Glove-1M, from 120.03 to 140.23 GB
(+16.8%) on Microsoft Turing-ANNS, and from 120.85 to 141.80 GB (+17.3%) on
Microsoft SPACEV [S11].

**FACT (high):** At 90% R@100, the paper reports that SOAR reduced the number of
datapoints read for equivalent partition recall from 59,063 to 52,292 on
Glove-1M, 14,350 to 6,950 on SPACEV (2.06x), and 26,700 to 11,150 on Turing-ANNS
(2.39x). Gains increased at 95% recall on the billion-scale sets, to 3.36x and
4.32x respectively [S11]. These are KMR/read-work results from the authors, not
Curiosity latency measurements.

**RECOMMENDATION (medium):** Evaluate SOAR only if high-recall partition misses
dominate and its duplicate-code memory is affordable. It is not automatically
beneficial at small scale or low recall, and write/delete paths now maintain two
assignments per vector.

## 4. Asymmetric hashing and anisotropic quantization

### 4.1 What “asymmetric hashing” means

**FACT (high):** ScaNN's AH path is product-quantization-style asymmetric
distance computation, not a cryptographic hash and not simply binary LSH. It
splits a vector into blocks/subspaces, learns a small codebook for each block,
and stores a codeword identifier per database block. The query remains at higher
precision and creates a table of query-to-codeword partial scores; scoring a
compressed database vector is a series of table lookups and additions [S1][S3].

The paper gives query setup plus scan complexity as `O(kd + mn)` for `k`
codewords, `m` blocks, dimension `d`, and `n` scanned vectors, versus `O(nd)`
exact scoring. Compression also reduces memory traffic and storage [S1].

**FACT (high):** The current builder exposes two AH codebook widths [S4]:

- `lut16`: 16 centers/block (a 4-bit database code per full block), with an
  int8 lookup-table path designed for SIMD;
- `lut256`: 256 centers/block (an 8-bit database code per block), with an int8
  lookup path.

The official default recommendation is two dimensions per block. AH training
defaults to a 100,000-point sample and ten clustering iterations [S3][S4].

### 4.2 Why the loss is anisotropic

Traditional PQ minimizes `||x - x_tilde||²`. That treats residual error in all
directions equally. For MIPS, however, a database vector matters most for
queries with high true inner product, and an error component parallel to that
database vector perturbs those high scores more than an orthogonal component
[S1][S2].

**FACT (high):** Guo et al. define score-aware loss as the expected squared
inner-product error weighted by a function of the true score. Under a uniformly
distributed unit-query assumption, it decomposes into:

```text
h_parallel * ||residual_parallel||²
  + h_orthogonal * ||residual_orthogonal||²
```

For a non-decreasing weight on non-negative scores, `h_parallel >=
h_orthogonal`; equality reduces to isotropic reconstruction loss. For the
threshold weight `w(t) = 1[t >= T]`, the paper derives the relative directional
penalty and trains/assigns PQ codewords against it [S1].

**FACT (high):** On unit-normalized Glove1.2M, the authors selected `T=0.2`,
corresponding in their setup to a parallel/orthogonal weight ratio `eta=4.125`,
and reported better Recall1@10 and lower top-1 inner-product estimation error
than reconstruction-loss quantization at fixed bitrates [S1]. ScaNN's public
builder exposes an `anisotropic_quantization_threshold` for AH and cites the
paper for its meaning [S3][S4].

### 4.3 Scope and caveats

- **FACT (high):** The derivation assumes a spherical unit-query distribution
  when the real query distribution is unknown; the paper says the expectation
  can instead be recomputed for an estimated query distribution [S1].
- **INFERENCE (high):** Mismatch between the training vectors/assumptions and
  production queries can weaken the advantage. A threshold copied from Glove is
  not a portable default.
- **FACT (high):** The Python builder permits partition-level AVQ only for dot
  product. The library also supports squared L2, but the headline anisotropic
  argument and residual Tree-AH restrictions are MIPS-specific [S4][S13].
- **RECOMMENDATION (high):** Tune against retrieval recall/NDCG on held-out,
  time-separated Curiosity queries, not codebook reconstruction error alone.
  That end-task alignment is the key lesson even if another ANN engine is used.

## 5. Approximate scoring, top-N selection, and reordering

### 5.1 Query path

The smallest architecture consistent with the papers, docs, and pinned source
is:

```text
query vector
  -> optional projection (PCA / truncation)
  -> score partition centers
  -> choose bounded leaves
  -> construct AH lookup table(s), including residual context where configured
  -> SIMD scan compact codes in selected leaves
  -> maintain approximate top-k' candidates
  -> fetch candidates from float32 / bfloat16 / int8 reorder representation
  -> recompute higher-fidelity scores
  -> exact top-k selection over the rescored candidate set
```

“Exact top-k” in the final line is only over candidates that survived pruning
and approximate scoring. It does not make the overall ANN result exact.

### 5.2 Reordering contract

**FACT (high):** `reordering_num_neighbors` is `k'` and should exceed final
`k`. Increasing it improves the chance that a true neighbor lost by AH ordering
is restored, at the cost of reading and scoring more high-fidelity vectors
[S3][S4]. Search calls may override final neighbors, pre-reorder neighbors, and
leaves-to-search, so one built index can expose multiple recall/latency points
[S5].

**FACT (high):** Reordering may use float32, int8, or bfloat16 data in the
current builder. Float32 is the highest-fidelity path. Despite the internal
config name `exact_reordering`, int8 and bfloat16 reordering are still
quantized/more-accurate, not mathematically exact relative to the source floats
[S3][S4].

**INFERENCE (high):** There are three distinct false-negative gates:
partition pruning, AH candidate truncation, and final top-k truncation. Overall
recall cannot be diagnosed from one global number. Curiosity should separately
measure leaf-oracle recall and pre-reorder candidate recall before blaming the
reranker.

### 5.3 Quantized brute force is workload-dependent

**FACT (high):** ScaNN's per-dimension int8 brute force is roughly 4x smaller
than float32 and the docs say it can quarter latency in memory-bandwidth-bound
cases. The same docs warn that it can be slower when a large batch makes the
work compute-bound or when the dataset fits in cache; accuracy loss is described
as generally negligible [S3].

**RECOMMENDATION (high):** Benchmark single-query tail latency and batched
throughput separately. A compression win under random online queries may reverse
under offline batches.

## 6. Training, building, persistence, and mutation

### 6.1 Build-time learned state

Depending on configuration, build may learn and materialize:

- optional PCA projection or embedding truncation;
- one- or multi-level VQ partition centers and point-to-leaf assignments;
- optional SOAR secondary assignments;
- AH subspace codebooks and compact codes, often for partition residuals;
- optional float32, bfloat16, or int8 reorder vectors and associated scale/norm
  data;
- config and doc-ID/index mappings [S4][S5][S13].

**FACT (high):** Training-thread count is configurable. Search supports one
query, batched queries, and a parallel batched path; the native wrapper also
allows resetting the query thread-pool size [S5]. The source publishes no build
time, peak-memory, or tail-latency formula.

### 6.2 Serialization

**FACT (high):** The native Python searcher serializes a directory of typed
artifacts and an asset manifest; these can include config, partitioner,
tokenization, AH codebook/codes, reorder vectors/scales/norms, source dataset,
and a Python-pickled doc-ID list. A loader reconstructs the in-process searcher.
TensorFlow bindings can serialize assets into a module/SavedModel [S5].

**Negative result (high):** Public docs do not promise artifact-format stability
across ScaNN versions, atomic snapshot creation, checksums, encryption, online
snapshot isolation, downgrade compatibility, or endianness/platform portability.
Release notes repeatedly record TensorFlow-op incompatibility across TF versions
[S6].

**RECOMMENDATION (high):** Treat a ScaNN directory as a derived, immutable index
generation, never as the system of record. Store the source corpus/embeddings
elsewhere; add a manifest with engine version, commit/package digest, config,
embedding model/dimension/metric, source snapshot, checksums, build hardware,
and validation results. Publish a generation only after load and recall checks.

### 6.3 Insert, update, and delete

**FACT (high):** Release 1.3.0 added dynamic vector insertion, modification, and
deletion. In the native Python API these are `upsert`, `delete`, `reserve`, and
`rebalance` [S5][S6]. Important public constraints are:

- string `docids` must be unique and supplied when building if mutation will be
  used;
- upsert inserts an unknown ID and replaces the vector for an existing ID;
- delete is by doc ID in the wrapper;
- deletion compacts storage by moving the last internal point into the removed
  slot, so numeric internal indices are not stable external identities;
- batch upsert precomputes mutation artifacts, but the wrapper applies points in
  a loop; no transaction/rollback contract is documented;
- source tests cover brute force and dynamic Tree-AH, serialization after
  updates, a full rebalance, and online/incremental modes [S4][S5].

**FACT (high):** Current configuration has two related maintenance mechanisms:

1. `rebalance()` currently performs a full retrain/reindex from the initial or
   supplied config (the wrapper contains an explicit TODO noting this) [S5].
2. Tree incremental training can be enabled with an absolute or fractional
   threshold; autopilot exposes `NONE`, `ONLINE`, and `ONLINE_INCREMENTAL` modes.
   Pinned tests exercise phase changes between brute force and Tree-AH and
   incremental split/reassignment behavior [S4][S5].

**FACT (medium):** The full-retrain source path requires the searcher to be able
to reconstruct a float dataset and returns a failed precondition otherwise
[S14]. Precisely which compressed configurations remain reconstructable enough
for every rebalance path is not normatively documented.

### 6.4 Mutation limits and unknowns

The public API/source review found no documented guarantee for:

- atomicity across a multi-vector upsert/delete;
- read-after-write or concurrent reader/writer semantics;
- crash consistency between mutation and serialization;
- a write-ahead log, replay token, tombstone retention, or snapshot isolation;
- sustained update rate, pause time, rebalance trigger SLO, or memory
  amplification during full retrain;
- recall degradation bounds under distribution shift or adversarial churn;
- maximum corpus size, mutation batch, doc-ID length, or update count;
- safe behavior when the Python doc-ID map has changed but a native mutation
  subsequently fails [S4][S5][S6].

**INFERENCE (high):** Dynamic support makes ScaNN usable for controlled deltas,
but it does not turn the library into a durable online vector database. A
Curiosity service would still need a source-of-truth change log, idempotent
operation IDs, generation/epoch control, recovery, compaction policy, and
periodic rebuild. Until concurrency is validated, serialize mutations per shard
and use immutable readers or copy-on-publish generations.

## 7. Hardware and performance assumptions

### 7.1 Published platform contract

**FACT (high):** Version 1.4.2 is the current PyPI release. PyPI records its
upload on 2025-08-29 and provides CPython 3.9–3.13 `manylinux_2_27` wheels for
`x86_64` and `aarch64`; there are no official macOS or Windows wheels [S7][S8].
The x86 wheels require AVX and FMA; ARM wheels require NEON. The runtime also
requires system `libstdc++` 3.4.23 or newer [S7].

**FACT (high):** A source build currently calls for Bazel 7.x, Clang 19, C++17
headers, modern Python, and TensorFlow 2.20 for that build flow. TensorFlow ops
became an optional `scann[tf]` extra in 1.4.0; native pybind is recommended when
TensorFlow integration is unnecessary [S6][S7].

**FACT (high):** Official TF Serving + ScaNN images are compiled for AVX2/FMA3
and require supporting CPUs. The repository explicitly says it does not provide
GPU or MKL variants of those images [S9]. A pinned-source search found no CUDA,
ROCm, or Metal backend in the public ScaNN tree.

### 7.2 CPU execution model

**FACT (high):** The public implementation contains architecture-specific or
portable SIMD paths including AVX-512, AVX2, SSE4, and Highway/ARM-compatible
paths for LUT16 and distance kernels [S13]. The original AVQ end-to-end benchmark
ran single-threaded on an Intel Xeon W-2135 and combined a VQ tree, product
quantization, and SIMD asymmetric distance computation [S1].

**INFERENCE (high):** ScaNN is optimized around contiguous compressed-list
scans, SIMD table lookup/accumulation, cache behavior, prefetching, and memory
bandwidth. Performance is consequently sensitive to CPU generation, NUMA
placement, query concurrency, vector dimension, block layout, leaf imbalance,
reorder width, and whether the full reorder dataset remains resident.

**RECOMMENDATION (high):** Do not size from QPS alone. Record per generation:
resident and peak build memory, bytes/vector by representation, points/leaves
scanned, candidates reordered, CPU model/instruction path, threads, batch size,
NUMA placement, p50/p95/p99 service latency, QPS, and recall at each operating
point.

## 8. Recall, throughput, and latency evidence

### 8.1 What is supported

- **FACT (high):** The 2020 paper reports ScaNN as fastest in the high-recall
  region on Glove1.2M under the ANN-Benchmarks protocol, on one Xeon W-2135
  thread [S1].
- **FACT (medium):** Google's launch post characterized the Glove-100-angular
  result as roughly twice the QPS of the next-fastest of eleven tuned libraries
  at a given accuracy [S2]. This is an author/vendor summary of a 2020 benchmark,
  not a current independent guarantee.
- **FACT (high):** The SOAR paper reports ScaNN + SOAR improving ScaNN's
  Glove-1M curve. On custom-hardware Big-ANN Track 3 at 90% R@10, the authors
  report 46,712 QPS on SPACEV and 32,608 QPS on Turing-ANNS using a CPU system
  they estimated at $2,740.60 hardware cost; they also report favorable
  throughput/cost ratios [S11]. Hardware heterogeneity makes raw QPS comparisons
  especially fragile.
- **FACT (high):** Both papers measure recall/throughput curves, not a universal
  millisecond latency. Neither publishes a Curiosity-like filtered, mutable,
  hybrid retrieval workload or a production p99 SLO [S1][S11].

### 8.2 What is not supported

Published results do **not** establish:

1. recall for Curiosity's embedding model, dimension, corpus, duplicates,
   metadata restrictions, or query distribution;
2. end-to-end latency including embedding, filters, network, lexical fusion,
   evidence fetch, or reranking;
3. p95/p99 latency under concurrent service load;
4. update-heavy recall, rebuild interruption, or fresh-document visibility;
5. current superiority over present versions of other ANN engines;
6. equivalent performance on ARM, virtualized/cloud CPUs, small caches, or
   multi-socket NUMA systems;
7. exact recall: ScaNN deliberately trades approximation for speed.

**RECOMMENDATION (high):** Require a local Pareto curve, not a winner at one
operating point. Compare exact brute-force ground truth against candidate
recall@k, downstream answer/evidence quality, QPS, tail latency, memory, build
time, incremental visibility, and periodic-rebuild cost. Pin every result to an
artifact generation and hardware fingerprint.

## 9. Deployment gaps Curiosity must own

| Capability | Public ScaNN surface | Curiosity consequence |
| --- | --- | --- |
| Process/service | In-process C++/Python/TensorFlow ops; optional custom TF Serving image. | Build an isolated service/worker only if needed; define request limits, deadlines, health, and graceful reload. |
| Durability | Directory/module serialization. | Keep authoritative vectors and mutation log elsewhere; use checksummed immutable generations. |
| Replication/failover | No public ScaNN replication protocol. | Replicate generations and route at the service layer. |
| Sharding/distribution | Public package is single-machine; old distributed config names are reserved, not an OSS feature contract [S13]. | Own shard assignment, fan-out, top-k merge, failure accounting, and resharding. |
| Rich filtering | Low-level allowlist/restrict machinery exists, but no documented Python metadata predicate/index contract comparable to a vector DB. | Apply bounded candidate filters carefully; measure filtered recall or use a filter-aware engine. |
| Transactions/concurrency | Dynamic mutation exists; atomicity and reader/writer guarantees are undocumented. | Serialize writes or publish immutable snapshots until validated. |
| Security/tenancy | No auth, authorization, encryption, audit, or tenant quotas as a library concern. | Enforce all at Curiosity's service/storage boundaries. |
| Observability | Thread controls and partition health stats exist; no ready service SLO stack. | Export generation, stage work, recall canaries, mutation lag, and resource metrics. |
| Hybrid retrieval | Vector ANN only. | Keep lexical retrieval, source authority, freshness, dedupe, and fusion provider-neutral. |
| GPU acceleration | No public ScaNN GPU backend/official GPU serving image found. | Select a different adapter if GPU residency is a requirement. |
| Cross-platform dev | Official wheels are Linux x86/ARM only. | Use Linux CI/containers; macOS development needs a remote/container path or unsupported source work. |

Search outputs remain derived candidates, not evidence. Curiosity must preserve
document/chunk lineage, deletion policy, ACL decisions, canonical IDs, source
timestamps, and exact quoted evidence independently of ScaNN's mutable numeric
indices.

## 10. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Evidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | Fact | ScaNN separates optional partitioning, scoring, and optional higher-fidelity rescoring. | High | [S3] | **ADOPT** the staged pattern. |
| L2 | Fact | Standard partitioning is a trained VQ/k-means-style inverted index with a bounded leaf probe count. | High | [S3][S4][S11] | **ADAPT** behind engine-neutral candidate controls. |
| L3 | Fact | `sqrt(n)` leaves and the 20k/100k cutovers are documented heuristics, not guarantees. | High | [S3] | **REJECT** as fixed production policy. |
| L4 | Fact | SOAR adds a complementary second assignment and modest PQ-code memory overhead. | High | [S4][S11] | **DEFER** pending high-recall memory/work evaluation. |
| L5 | Fact | AH is product-quantization-style asymmetric lookup scoring over compressed database codes and a high-precision query. | High | [S1][S3][S4] | **ADOPT** as a conceptual candidate-scoring pattern. |
| L6 | Fact | Anisotropic loss penalizes score-harmful parallel residual error more than orthogonal error for MIPS. | High | [S1][S2] | **ADOPT** the end-objective-aware training principle. |
| L7 | Inference | A Glove-tuned anisotropic threshold is not portable to Curiosity queries/embeddings. | High | assumptions and experiment scope [S1] | **REJECT** copied constants; tune locally. |
| L8 | Fact | Tree + dot-product AH defaults to residual quantization in the current builder. | High | [S4][S13] | **ADAPT** if a ScaNN adapter is evaluated. |
| L9 | Fact | Reordering width and leaves probed are query-time recall/work knobs. | High | [S3][S5] | **ADOPT** explicit bounded effort controls. |
| L10 | Fact | Quantized reordering is not exact relative to float32 even though the config says `exact_reordering`. | High | [S3][S4] | **ADAPT** with truthful contract names. |
| L11 | Fact | Dynamic insert/modify/delete and full rebalance exist from 1.3.0 onward. | High | [S5][S6] | **ADAPT** only with an external log and rebuild path. |
| L12 | Negative fact | No public transaction, WAL, replication, crash-consistency, or sustained-update SLO was found. | High for public surface | [S4][S5][S6] | **REJECT** treating ScaNN as system of record. |
| L13 | Fact | Official wheels are Linux x86_64/aarch64 and require AVX+FMA or NEON. | High | [S7][S8] | **DEFER** until deployment hardware is fixed. |
| L14 | Negative fact | No public GPU backend or official GPU TF Serving image was found. | High for pinned tree/docs | [S9][S13] | **REJECT** for a GPU-only requirement. |
| L15 | Fact | Headline benchmarks use author-tuned static datasets/hardware and recall-throughput curves. | High | [S1][S2][S11] | **REJECT** as procurement proof; benchmark locally. |
| L16 | Inference | Partition imbalance and drift can make a fixed leaf count unstable in work and recall. | Medium-high | [S3][S5][S11] | **ADAPT** with scanned-point and health metrics. |
| L17 | Recommendation | Keep engine index numbers internal and Curiosity canonical IDs external. | High | delete compaction behavior [S5] | **ADOPT.** |
| L18 | Recommendation | Publish immutable, checksummed index generations and keep vectors/corpus authoritative elsewhere. | High | serialization and mutation gaps [S5][S6] | **ADOPT.** |
| L19 | Fact | Public source and package metadata declare Apache-2.0. | High | [S10][S12] | **ADOPT** only with notice/license compliance and review. |
| L20 | Recommendation | Keep ScaNN as one optional ANN adapter, never the provider-neutral retrieval contract. | High | product/deployment boundary | **ADOPT.** |

## 11. Exact Curiosity implications

1. **Provider-neutral ANN request.** Define metric, final `k`, candidate budget,
   filter/allowlist reference, deadline, effort class, and generation ID without
   exposing `num_leaves_to_search` or ScaNN class names. Let the adapter map an
   effort class to leaves and pre-reorder width.
2. **Stage telemetry.** Return/record selected leaves, points scored, candidates
   reordered, final results, stage timings, engine version, index generation,
   and completeness/failure status. Do not label approximate scores as
   calibrated probabilities.
3. **Canonical identity.** Store Curiosity chunk/document IDs beside the source
   vector manifest. Never persist or cite ScaNN's compacting numeric index as a
   durable evidence ID.
4. **Immutable generation lifecycle.** Build in isolation, validate exact-set
   recall and canary queries, checksum, atomically publish a generation pointer,
   retain rollback, and garbage-collect only after reader drain.
5. **Bounded delta path.** Journal idempotent upsert/delete operations outside
   ScaNN, replay against a known generation, cap mutable age/size, and trigger a
   full rebuild on drift, imbalance, or age. Dynamic mutation is an optimization,
   not authority.
6. **Deletion semantics.** A privacy/source deletion must first be durable in the
   source of truth, then removed from every active and rollback index generation
   or those generations must be retired. ANN deletion alone is not deletion
   proof.
7. **Recall decomposition.** Measure partition-oracle recall, pre-reorder
   candidate recall, final vector recall, and downstream evidence quality.
   Diagnose the lost-neighbor stage before changing parameters.
8. **Filtered recall.** If ACL/domain/language/time filters occur after ANN,
   over-retrieve within a hard budget and measure starvation. Prefer prefilter or
   shard strategies when postfilter loss is material.
9. **Hybrid retrieval.** Fuse vector candidates with lexical/exact retrieval
   using canonical IDs and independently calibrated features. ScaNN scores are
   local ranking signals, not source authority or truth.
10. **Hardware-aware capacity.** Qualify exact wheel/CPU instruction support;
    benchmark Linux x86 and ARM separately; pin threads and NUMA policy; reject
    hosts lacking required SIMD before loading an index.
11. **Benchmark gate.** Compare ScaNN brute force, ScaNN Tree-AH (with and without
    SOAR where justified), and at least one operationally richer baseline on the
    same Curiosity snapshot. Include build/update/publish costs, not just QPS.
12. **Adapter exit.** Preserve source embeddings and engine-neutral manifests so
    Curiosity can rebuild with another engine without changing evidence IDs,
    retrieval contracts, or provenance.

## 12. Clean-room and license lessons

**FACT (high):** The pinned Google Research repository has an Apache License 2.0
root license, and ScaNN's package metadata declares `Apache-2.0` [S10][S12]. The
license grants copyright and applicable patent rights subject to its conditions,
including providing the license, preserving required notices, marking modified
files, and handling any NOTICE file obligations. It includes warranty and
liability disclaimers and patent-termination terms [S10].

The README's phrase “released for research purposes” describes project context;
the repository's Apache-2.0 license text is the operative public code license.
That interpretation is not legal advice, and dependencies/binary distributions
need their own notice review.

This dossier copies no implementation code. Mathematical ideas and public API
facts are restated with attribution. A future implementation has two lawful
paths that must not be confused:

1. **Use/adapt ScaNN under Apache-2.0:** preserve attribution/license/NOTICE
   obligations, mark modifications, inventory dependencies, and avoid implying
   Google endorsement.
2. **Independent engine/contract design:** derive requirements from the papers
   and observable behavior, use Curiosity naming and tests, and do not copy
   ScaNN code/config text or undisclosed behavior.

The papers do not disclose Google's private production topology, models,
operational tuning, or service controls. Public source analysis cannot be used
to claim parity with a Google product. No source code is included in this report
and no external repository content was added to the workspace.

## 13. Unknowns and required checks

| Unknown / risk | Why it matters | Authorized future check (not executed) |
| --- | --- | --- |
| Curiosity recall/latency curve | Vendor datasets do not represent our corpus. | Exact-ground-truth benchmark on a frozen, non-sensitive Curiosity vector snapshot. |
| Filtered and hybrid recall | Postfiltering may exhaust top-k; lexical fusion changes value. | Evaluate representative ACL/domain/time filters and fusion with fixed budgets. |
| Build time and peak RAM | A fitting resident index can still fail during build/rebalance. | Measure build, serialize, load, rebalance, and dual-generation peak memory. |
| Update consistency | API docs do not define concurrent read/write atomicity. | Source-authorized stress test with serialized and concurrent readers, crash-free only at first; seek maintainer clarification. |
| Crash recovery/durability | In-memory mutation plus later serialization can lose state. | Keep external journal; test kill/reload only in an isolated disposable environment under a reviewed protocol. |
| Artifact compatibility | Future releases may not load old generations. | Cross-version load matrix with checksummed synthetic indices before upgrading. |
| Incremental quality drift | New embeddings may distort partitions/AH codebooks. | Time-sliced insert/delete benchmark versus fresh rebuild ground truth. |
| SOAR value under writes | Secondary assignment raises memory and maintenance work. | Compare static and delta-heavy Tree-AH with/without SOAR at matched recall. |
| ARM performance | NEON support does not imply x86-equivalent QPS. | Same dataset/config and price-normalized benchmark on target ARM hosts. |
| Memory accounting | Representations and Python doc-ID maps add overhead. | Process RSS and artifact bytes/vector by configuration and cardinality. |
| Serialization safety | Python doc IDs use pickle; untrusted artifacts could execute code when loaded. | Treat all index artifacts as trusted build outputs; verify digest before load; security review loader paths. |
| Current maintenance/release cadence | Source moved after the 2025 wheel; public wheel may lag master. | Pin a released package; review release notes/issues and avoid building arbitrary master for production. |

### Proposed acceptance checks

1. Exact recall@10/@50/@100 and downstream evidence recall meet declared
   thresholds at p95/p99 latency and memory ceilings.
2. Results remain within tolerance across repeats, batch sizes, and target CPU
   families.
3. Filtered queries do not silently return underfilled or unauthorized sets.
4. A full build, load, health check, publish, rollback, and source deletion can
   be demonstrated from immutable manifests.
5. Upsert/delete replay is idempotent from an external log; a fresh rebuild
   converges to the same canonical active-ID set.
6. Upgrade and artifact corruption fail closed before serving.
7. License/dependency notices and image provenance pass review.

## 14. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for relevance (R), decision value
(V), novelty (N), and investigation cost (C); priority = R + V + N − C. Caller
authority covered public-source follow-up only—no live benchmark or implementation.

| Thread | R/V/N/C | Priority | Outcome |
| --- | --- | ---: | --- |
| Release note says dynamic updates, but old summaries call ScaNN static | 5/5/5/1 | 14 | **Pursued.** Pinned wrapper, native mutation path, builder, and update tests confirmed upsert/delete/rebalance and newer online/incremental modes [S4][S5][S6]. |
| “Exact reordering” versus quantized reorder modes | 5/5/4/1 | 13 | **Pursued.** Builder/docs show float32, int8, and bfloat16; report distinguishes exact candidate selection from exact source-vector scoring [S3][S4]. |
| SOAR's practical cost, not just its loss | 4/5/5/1 | 13 | **Pursued.** Paper tables supplied memory growth, scanned-point reductions, and billion-scale QPS context [S11]. |
| GPU support assumption | 5/5/3/1 | 12 | **Pursued.** Official serving docs deny GPU images and the pinned tree has no CUDA/ROCm/Metal backend [S9][S13]. |
| Current wheel/platform reality | 4/4/3/1 | 10 | **Pursued.** PyPI JSON confirmed 1.4.2, 2025-08-29 uploads, and Linux x86_64/aarch64 wheels only [S8]. |
| Reproduce ANN-Benchmarks headline | 5/5/3/5 | 8 | **CURIOSITY_NO_GO.** Requires benchmark execution/hardware and exceeds research-only authority; old author results are retained with caveats. |
| Prove concurrent update consistency from tests | 5/5/4/5 | 9 | **CURIOSITY_NO_GO.** No normative public contract found; code inference is insufficient and live stress testing was not authorized. |
| Reverse engineer Google-internal ScaNN serving | 2/2/5/5 | 4 | **CURIOSITY_NO_GO.** Outside public clean-room boundary and unnecessary for the adapter decision. |
| Inspect binary SIMD output/disassemble wheels | 2/2/3/5 | 2 | **CURIOSITY_NO_GO.** Source and platform docs answer the in-frame hardware question; binary reverse engineering adds little and was not authorized. |
| Design or copy an adapter implementation | 5/4/1/5 | 5 | **CURIOSITY_NO_GO.** Caller explicitly prohibited implementation and code copying. |
| Survey every ANN competitor | 3/4/3/5 | 5 | **DEFERRED.** Needed for engine selection, but this dossier's declared frame is ScaNN; use a separately authorized comparative benchmark. |

**Stop reason:** coverage and saturation. Every requested dimension has primary
paper/document/source evidence. Remaining decision-critical gaps require a
Curiosity dataset, target hardware, concurrency experiments, or a broader
comparative-engine frame, none of which was authorized here.

## Sources

All web and source materials were accessed 2026-08-17.

- **[S1]** Ruiqi Guo et al., “Accelerating Large-Scale Inference with
  Anisotropic Vector Quantization,” ICML 2020, PMLR 119:3887–3896,
  <https://proceedings.mlr.press/v119/guo20h.html>; arXiv v5,
  <https://arxiv.org/abs/1908.10396>.
- **[S2]** Google Research, “Announcing ScaNN: Efficient Vector Similarity
  Search” (2020-07-28),
  <https://research.google/blog/announcing-scann-efficient-vector-similarity-search/>.
- **[S3]** Google Research, “ScaNN Algorithms and Configuration,” pinned commit
  `1eb8bb0cbe5fd9072311ae3fd760e3644fee690b`,
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/docs/algorithms.md>.
- **[S4]** Google Research, public Python `ScannBuilder` contract, same pinned
  commit,
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/scann/scann_ops/py/scann_builder.py>.
- **[S5]** Google Research, native Python wrapper, native ScaNN/Numpy interface,
  and dynamic-update tests, same pinned commit:
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/scann/scann_ops/py/scann_ops_pybind.py>,
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/scann/scann_ops/cc/scann_npy.cc>, and
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/scann/scann_ops/py/scann_ops_pybind_updates_test.py>.
- **[S6]** Google Research, ScaNN release notes, same pinned commit,
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/docs/releases.md>.
- **[S7]** Google Research, ScaNN README and build/platform requirements, same
  pinned commit,
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/README.md>.
- **[S8]** Python Package Index, ScaNN project and JSON release metadata,
  <https://pypi.org/project/scann/> and <https://pypi.org/pypi/scann/json>.
- **[S9]** Google Research, “TF Serving + ScaNN ops with Docker,” same pinned
  commit,
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/tf_serving/README.md>.
- **[S10]** Google Research repository, Apache License 2.0, same pinned commit,
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/LICENSE>.
- **[S11]** Philip Sun et al., “SOAR: Improved Indexing for Approximate Nearest
  Neighbor Search,” NeurIPS 2023; arXiv v1 (2024-03-31),
  <https://arxiv.org/abs/2404.00774> and
  <https://arxiv.org/html/2404.00774>.
- **[S12]** Google Research, ScaNN package metadata (`version = 1.4.2`,
  `license = Apache-2.0`), same pinned commit,
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/pyproject.toml>.
- **[S13]** Google Research, public implementation details for residual Tree-AH,
  AH config, SIMD LUT dispatch, and top-level config, same pinned commit:
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/scann/base/internal/tree_x_hybrid_factory.cc>,
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/scann/proto/hash.proto>,
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/scann/hashes/internal/lut16_interface.h>, and
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/scann/proto/scann.proto>.
- **[S14]** Google Research, full retrain/reindex path, same pinned commit,
  <https://github.com/google-research/google-research/blob/1eb8bb0cbe5fd9072311ae3fd760e3644fee690b/scann/scann/utils/single_machine_retraining.cc>.
