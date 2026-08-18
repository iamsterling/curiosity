# Vespa search serving and ranking architecture

**Research date / source access:** 2026-08-17  
**Status:** clean-room product research; not implementation, deployment, or legal advice  
**Decision frame:** Which Vespa architectural patterns should Curiosity adopt,
adapt, reject, or defer while preserving a provider-neutral retrieval contract,
bounded behavior, and an independently owned implementation?

## Executive verdict

Vespa's most transferable idea is not a particular index or ranking formula. It
is the explicit **bounded funnel** from several cheap candidate retrievers,
through node-local first/second phases, to a small globally merged rerank set,
with feature and execution traces at each boundary. Its other strong lesson is
that serving architecture, mutation semantics, distribution, and recovery are
one system: fields are deliberately assigned to text indexes, in-memory
attributes, summaries, or tensors; writes become query-visible in real time;
replicas and buckets are continuously reconciled; and query coverage and costs
are represented explicitly [S1-S8].

**Recommendation — ADAPT patterns, do not adopt Vespa as Curiosity's owned core
(high confidence).** Curiosity should adopt the contracts and invariants:
schema-versioned field roles; union candidate provenance; stage budgets;
node-local versus global scoring boundaries; exact-versus-ANN evaluation;
bounded grouping; coverage/degradation reporting; and replayable feature/plan
traces. It should not copy Vespa code, wire formats, schema syntax, internal
distribution algorithm, or operational layout. The official repository is
Apache-2.0, but the current “wholly owned” direction rejects third-party search
engines as the core and still requires independent legal review of dependencies,
NOTICE/attribution, trademarks, patents, and hosted-service terms [S18].

Vespa is credible evidence that this architecture can operate at large scale,
but its headline scale statements remain vendor claims rather than an
independent benchmark. The most concrete official experiment indexed one
billion binary vectors on one 72-vCPU/256-GB content node and reported its
specified setup, indexing throughput, memory, latency, and recall trade-offs;
it is reproducible evidence in principle, not evidence for Curiosity's workload
or public-web corpus [S17].

## 1. Frame, bounded sub-questions, and method

### 1.1 Questions

1. How do schemas map document types and field roles into content clusters?
2. How are documents distributed, replicated, fed, updated, and made visible?
3. How do lexical, sparse, vector, and filtered retrievers form candidate
   unions, and where are their limits applied?
4. What exactly runs in first-phase, second-phase, and global-phase ranking?
5. How do tensors, ANN, grouping, rank features, and execution traces work?
6. What are the snapshot, backup, recovery, consistency, and operational
   boundaries?
7. Which scale statements are facts about a documented test, vendor claims, or
   unknown for Curiosity?
8. Which lessons are clean-room transferable under repository constraints?

### 1.2 Method and limits

Official Vespa documentation, the official Vespa repository license, and an
official Vespa engineering benchmark were used as primary sources. No Vespa
binary was run; no source implementation was inspected or copied; no private or
hosted endpoint was accessed. Documentation establishes behavior claimed by the
maintainer, not comparative superiority. The old benchmark is reported with its
date and exact setup rather than generalized. Source discovery stopped after
the requested categories were covered and additional official pages repeated
the same design.

Labels:

- **FACT** — directly stated by a cited official source.
- **INFERENCE** — synthesis from facts, not measured here.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

## 2. System shape: schemas, containers, and content clusters

**FACT (high):** A Vespa application has stateless container clusters and zero
or more stateful content clusters. Containers perform query/feed processing and
global query stages; content clusters store data and execute matching, ranking,
inference, grouping, and aggregation close to the data. An application package
declares clusters, schemas, models, components, and configuration [S1].

**FACT (high):** A schema defines one document type, field types and indexing
roles, synthetic fields, document summaries, and rank profiles. Multiple
schemas can share a content cluster; multiple clusters isolate load or scale
document types independently. The same document type may be placed in multiple
clusters (for example A/B or hot/cold copies), in which case writes are routed
to each mapped cluster [S2].

### 2.1 Field roles are physical serving choices

| Schema role | Physical/serving consequence | Architectural lesson |
| --- | --- | --- |
| `index` on string | Full-text disk index, with recent mutations in a memory index; term positions are retained by default for relevance [S3]. | Lexical retrieval has a different data structure and maintenance path from stored content. |
| `attribute` | In-memory column-oriented value usable for exact/range matching, ranking, sorting, grouping, and aggregation [S2][S3]. | Frequently filtered/ranked metadata should have an explicit serving representation. |
| `attribute: fast-search` | Adds a lookup/posting structure for efficient filtering, increasing update work [S2][S5]. | Query speed and mutation speed are a declared trade-off, not an accidental one. |
| `summary` | Makes a field available during the later fill/result phase; it is not searchable by itself [S2][S5]. | Candidate identity/score can travel separately from presentation payload. |
| `index` on tensor plus `attribute` | Builds an HNSW ANN index over tensor vectors [S2][S10]. | Vector retrieval is another candidate source, not the document store. |
| synthetic field | Derives an indexed/attributed field from document input, e.g. an embedding [S2]. | Derived retrieval material needs versioned lineage back to source fields/model. |

**FACT (high):** Proton, the search core on every content node, organizes each
document type as a document database with `ready`, `not ready`, and `removed`
sub-databases. Ready documents have attributes/indexes and are searchable;
not-ready replicas are stored but not indexed; removed entries preserve IDs and
timestamps for reconciliation. Exactly one ready copy is intended to be active
for query results, while other searchable copies can take over [S3].

**INFERENCE (high):** Vespa's schema is simultaneously a logical contract,
physical design, and ranking program. Curiosity should separate those concerns
in its provider-neutral contract, but require an adapter/index planner to
produce an auditable mapping among canonical fields, serving structures,
derived artifacts, and rank profiles.

## 3. Distribution, replicas, and query fan-out

**FACT (high):** Documents map algorithmically to buckets. A deterministic
weighted-random “ideal state” algorithm orders eligible distributors and
content nodes for each bucket. The highest-order distributor owns the bucket;
redundancy determines preferred storage nodes. Adding/removing a node is
designed to move only affected shares rather than remap the whole corpus [S4].

**FACT (high):** A distributor keeps an in-memory bucket database containing
replica locations, checksums, counts, and metadata. There is no central bucket
directory. Cluster controllers poll node health, elect a master, version and
broadcast cluster state. Distributors create/delete replicas, merge divergent
buckets, split/join buckets, and converge toward ideal state [S6].

**FACT (high):** `redundancy`/`min-redundancy` controls stored copies, while
`searchable-copies` controls indexed ready copies. Fewer searchable copies save
resources but can temporarily reduce query coverage while another stored copy
is indexed after failure. Grouped distribution places a full data copy in each
group for horizontal query capacity; a query normally fans out to every node in
one selected group, not every replica in every group [S7][S8].

**FACT (high):** Query execution bypasses distributors and feed persistence
threads. The container rewrites/dispatches by schema to content nodes; Proton
matches only active documents in each ready sub-database. Nodes return top hits,
global IDs, scores, hit/coverage metadata, and grouping data. The container
merges these, then lazily requests only the selected document summary fields
from the nodes that produced the winners [S3][S8].

**INFERENCE (high):** Curiosity should make three different concepts explicit:
partition ownership, durability replicas, and serving replicas. Treating them
as one “shard count” obscures availability and capacity trade-offs. Query
results should carry expected/observed partition coverage and degradation,
because a plausible top-k from partial coverage is not epistemically complete.

## 4. Feed, updates, visibility, and consistency

### 4.1 Mutation path

**FACT (high):** Put, update, remove, and get operations enter through a
container and are routed by distributors to bucket replicas. Proton first
persists mutating operations to a transaction log, then updates the document
store and serving structures. With transaction-log sync enabled (the default),
successful writes are durable before acknowledgement; changes are immediately
visible to search by default [S3][S9].

**FACT (high):** The synchronous `/document/v1` API provides individual puts,
gets, updates, removes, conditional test-and-set writes, visits, selection-based
batch update/delete/copy, continuation tokens, bounds, status codes, and
back-pressure signals. Different clients concurrently mutating one document
have unspecified ordering; conditional writes are the stronger guard [S6][S19].

**FACT (high):** Partial updates can assign/clear all field types, perform
arithmetic, mutate composites, and add/remove/modify tensor cells. Indexed or
summary-field updates require document-store read-modify-write; most attribute
updates occur in memory and avoid that path. Assign/remove are idempotent, but
replayed arithmetic/add operations may apply more than once [S5][S9].

**FACT (high):** The recent text memory index is periodically flushed to disk
and disk indexes fused. Attributes and document stores are also flushed or
compacted. These background jobs temporarily consume CPU, memory, and disk, and
the product exposes metrics for each maintenance path [S3].

### 4.2 Consistency boundary

**FACT (high):** Vespa is eventually consistent across replicas, not
linearizable. Successful writes are persisted to all replicas currently marked
available, even when fewer than configured redundancy are available. Failed
writes may have reached a subset. Replica reconciliation exchanges timestamped
document versions; newest wins at whole-document granularity [S9].

**FACT (high):** Get/visit never expose a partially updated document, but search
may transiently observe a multi-structure update while it is in progress.
Multi-document transactions do not exist. Visits have **no snapshot isolation**:
a concurrent mutation may or may not appear depending on whether its bucket was
already traversed [S9].

**RECOMMENDATION (high):** Curiosity's canonical corpus should remain the
authority for immutable captures and document versions. A serving index should
be reconstructible materialization. Every mutation should carry operation ID,
document version, source-capture ID, schema/model versions, and idempotency
class; “indexed” and “durably canonical” must not be conflated.

## 5. Retrieval unions and the ranking funnel

### 5.1 Candidate retrieval

**FACT (high):** Vespa's top-k query operators include lexical `weakAnd`, sparse
weighted `wand`, and dense `nearestNeighbor`. Query-language Boolean OR combines
retrievers, exposing the **union** of their candidates to first-phase ranking.
Filters can be conjoined with each retriever. The official hybrid example unions
`nearestNeighbor`, `weakAnd`, and `wand` candidates and uses one rank profile to
score the combined set [S10][S11].

**FACT (high):** The candidate limits are retrieval limits, distinct from the
client's requested `hits`. `totalTargetHits` apportions a desired total across
content nodes; older/per-node `targetHits` remains available. Approximate ANN
typically exposes its bounded target, while exact ANN may expose more candidates
encountered by its scoring heap. A candidate found by multiple retrievers is one
document in the Boolean union, with applicable match features [S10][S11].

**INFERENCE (high):** “Union retrieval” does not guarantee equal quotas,
calibrated scores, or global recall. Each retriever's local target, partition
allocation, filtering strategy, and overlap determine the actual pool. A small
per-node target can lose a globally useful candidate before ranking. Curiosity
must log per-retriever requested/produced counts, overlap, partition, cut-off
reason, and raw score—not merely label a final hit “hybrid.”

### 5.2 Three ranking locations

| Stage | Location and input | Bound and intended cost | Key semantic |
| --- | --- | --- | --- |
| Retrieval | Each content node, over its active ready documents | Top-k operators and Boolean/filter plan bound work | Generate a candidate union using cheap internal scores [S12]. |
| First phase | Each content node, all retrieved matches | Candidate count × expression cost; should be cheap | Initial application score; may drop below a score limit [S12]. |
| Second phase | Each content node, best first-phase hits | Default 100 per node; `total-rerank-count` gives a strict total across nodes | More expensive local reranking near document attributes/indexes [S12]. |
| Global phase | Stateless container after scatter/gather merge | Default 100 global hits; configurable `rerank-count` | Cross-hit normalization/RRF and expensive final models over a globally merged set [S12]. |
| Fill/result | Origin content nodes then container | Only final requested hits/summary fields | Fetch payload, dedupe/postprocess, render [S8]. |

**FACT (high):** First-phase scoring is commonly interleaved with DAAT matching,
not a materialized “match everything, rank later” pass. Second phase is optimized
for local expressions/models and avoids moving large vectors. Global phase is
suited to final ONNX/cross-encoder scoring and supports `normalize_linear`,
reciprocal rank, and reciprocal-rank fusion across the rerank set. Features can
be forced to compute locally and transferred as match features [S8][S12].

**FACT (high):** Rank profiles declare typed query inputs, functions, first/
second/global expressions, model calls, score-drop limits, feature exports, and
per-search thread settings. Queries choose a named profile, allowing controlled
experiments without changing document data [S12][S13].

**RECOMMENDATION (high):** Curiosity should adopt a provider-neutral funnel
contract with hard maxima at every edge:

```text
bounded query plan
  -> lexical / link-prior / sparse / dense retrievers
  -> union + canonical-ID dedupe + retriever provenance
  -> cheap partition-local score
  -> bounded richer local rerank
  -> merge with coverage accounting
  -> bounded global calibration / diversity / evidence score
  -> fetch snippets and provenance only for final hits
```

No stage should infer authority from a higher score. Agent-visible results
remain untrusted external data, and ranking must not widen Curiosity's caller-
declared frame or follow-up budget.

## 6. Tensors and vector retrieval

**FACT (high):** Vespa represents vectors as typed tensors. A tensor with one
indexed dimension stores one vector per document; mapped dimension(s) plus one
indexed dimension store multiple vectors per document. Query tensor types are
declared in the rank profile and must match document-vector dimensions [S10].

**FACT (high):** Supported nearest-neighbor distance metrics include Euclidean,
angular, dot product, prenormalized angular, Hamming, and geo degrees. Without a
tensor `index`, nearest-neighbor search is exact; adding `index` builds HNSW and
makes approximate search the default. Exact mode remains selectable to measure
ANN overlap/recall [S10][S14].

**FACT (high):** HNSW construction exposes graph degree and insertion-exploration
trade-offs; query exploration adds recall at latency cost. ANN can be combined
with filters. Vespa may choose filtered HNSW, post-filtering, or exact prefilter
search based on estimated filter selectivity (the documented default exact-
fallback threshold is 2%). ANN insertion supports updates and deletes [S11][S14].

**FACT (high):** Vector fields can be derived by an embedder during indexing,
and query embeddings can be generated in the container. Tensors also participate
directly in ranking expressions and model inference; vector retrieval and
vector-based reranking are therefore separate choices [S2][S10][S13].

**RECOMMENDATION (high):** Do not start Curiosity with ANN as the only recall
path. Preserve a lexical baseline and exact-vector evaluation slice. Version
embedding model, tokenizer, preprocessing, distance metric, dimensions, numeric
precision, HNSW parameters, and filtering policy. Track ANN recall against exact
search by query class before changing serving parameters.

## 7. Grouping, aggregation, and diversity

**FACT (high):** Vespa grouping is a declarative list-processing language over
all query matches, supporting nested/parallel groups, aggregates, ordering,
per-group hits, ranges, maps/arrays, and opaque pagination continuations. Group
fields must be attributes. Execution is distributed over content nodes and
merged in containers, potentially with multiple round trips [S15].

**FACT (high):** Limits are first-class: defaults cap groups/hits, and
`grouping.globalMaxGroups` preemptively rejects a plan whose worst-case groups
plus summaries exceed its bound. Ordered top groups can be approximate under
distribution; `precision` increases per-node samples at a performance cost.
Grouping favors performance over perfect correctness by default [S15].

**FACT (high):** Grouping can implement result diversity across all nodes after
second-phase ranking, but costs more than earlier match-phase diversity. Stable
ordering/tie-breakers matter for continuation behavior [S15].

**RECOMMENDATION (high):** Curiosity should adapt grouping only for bounded
facets, source/domain diversity, and evidence-set composition. Every request
needs maximum groups, maximum hits per group, precision policy, stable ordering,
and an “approximate aggregation” marker. Never expose an unbounded user-authored
aggregation language to an agent.

## 8. Rank features, traces, and explainability

**FACT (high):** `match-features` compute/export values before fill for all
first-phase hits returned from nodes; `summary-features` compute after fill only
for final hits. `ranking.listFeatures` dumps configured/default rank features
for training/debugging and is explicitly not recommended for production [S13].

**FACT (high):** Query tracing has distinct controls: `trace.level` reveals
container rewrites and progressively content-node plan/execution detail;
`trace.explainLevel` focuses on node plans/iterator trees; structured profiling
can attribute matching, first-phase, and second-phase time down rank-expression
trees. Trace output is documented as unstable and may include the query unless
disabled [S8][S16].

**FACT (high):** Responses expose timing, total count, coverage, errors,
degradation, scores, and optionally feature maps. Mutable per-document counters
can record progression through match/first/second/summary phases, but are
in-memory, may not survive restart, and are not comparable across nodes [S12].

**INFERENCE (high):** A raw execution trace is an engineering diagnostic, not a
durable evidence record or user explanation. Curiosity needs a stable, redacted
retrieval trace schema above any engine: plan/version IDs; candidate counts and
cutoffs; partition coverage; raw and calibrated feature contributions; model
versions; time budget spent; degradation; dedupe/diversity decisions; and final
evidence lineage. Query text and tensors require minimization and retention
policy because traces can leak user data or large payloads.

## 9. Snapshots, backup, recovery, and operations

### 9.1 What “snapshot” does and does not mean

**FACT (high):** Vespa visits can export all or selected documents with opaque
continuations and independent slices, but visits are linear scans with **no
snapshot isolation** under concurrent mutation [S9][S19]. Therefore, a visit is
not by itself a point-in-time corpus snapshot.

**FACT (high):** Vespa Cloud supports managed periodic content-cluster backups
when configured. At the accessed documentation version, backups are retained
for three intervals plus the latest completed backup; restore is support-
initiated and requires a target with the same content-node count and at least
equivalent disk capacity, followed usually by redistribution. Manual document
export/visit is the documented user-managed alternative [S20]. These statements
describe Vespa Cloud, not a generic self-hosted snapshot API.

### 9.2 Local durability and repair

**FACT (high):** Proton persists mutations in a transaction log and can replay
it after crash. Flushes create durable snapshots of attributes/memory indexes
that shorten replay; disk index fusion and document-store compaction run while
the current structures continue serving and may require approximately double
temporary disk for the component [S3][S7].

**FACT (high):** Replication is continuous repair, not backup. Distributors use
checksums and document timestamps to reconcile divergent buckets. Tombstones
are retained only for a configured period; a node absent longer than that should
have its indexes removed before rejoining or deleted documents may resurrect.
Vespa does not automatically detect this condition [S9].

**FACT (high):** A corrupted self-managed node is normally wiped/rebuilt from
replicas. If redundancy is insufficient, official recovery guidance is manual:
stop, repair resources/data, restart one node at a time, verify health, and wait
for pending bucket merges to reach zero [S21].

**FACT (high):** Feed blocks and local write rejection protect disk/memory
headroom. Health/state, cluster state, initialization progress, coverage,
transaction-log, maintenance, resource, query, and bucket-ideal-state metrics
are exposed. Controlled restarts drain/reject work and replicas/searchable
copies take over, but short-timeout requests can still fail [S3][S6][S7].

**RECOMMENDATION (high):** Curiosity needs three independent recovery stories:
(1) immutable canonical capture/version store with true point-in-time manifests,
(2) reconstructible serving indexes and tested rebuild time, and (3) replicated
online serving state. Export continuations are not snapshot manifests; replicas
are not backups; transaction logs are not long-term provenance. Recovery drills
must verify deletions/tombstones, schema/model pinning, checksums, coverage, RPO,
and RTO.

## 10. Scale claims: evidence and limits

| Claim | Classification | Assessment |
| --- | --- | --- |
| “Billions of constantly changing data items, thousands of QPS, below 100 ms” [S22] | Official marketing claim | **FACT that Vespa publishes it; low confidence as a workload-independent performance claim.** No hardware, query mix, corpus, percentile, or recall accompanies the homepage sentence. |
| Distribution algorithm has not shown a practical problem at about 1,000 nodes [S4] | Maintainer operational claim | **Medium confidence.** Useful evidence of design intent/experience, not a reproducible Curiosity capacity limit. |
| One-billion-vector official experiment [S17] | Documented vendor benchmark | **Medium-high confidence for that setup:** one content node, 72 vCPU, 256 GB RAM, 1 TB fast disk; one billion 104-bit binary codes; reported ~80k puts/s without HNSW, ~64 GB baseline memory, 15 s exact one-thread query, and ~4 ms at 90% recall@10 for one HNSW configuration. Old (2022), specialized Hamming vectors, average latency, and vendor-run. |
| Curiosity public-web scale/cost on Vespa | Unknown | **Low confidence / not established.** Corpus shape, text index, vectors, update rate, ranking models, grouping, SLO percentiles, regions, and availability targets are absent. |

**INFERENCE (high):** The benchmark's main transferable result is the shape of
the trade-off: ANN adds insertion work and memory; exact search is a useful
oracle but expensive at a billion vectors; recall, latency, throughput, and
update cost must be measured together. Its absolute numbers should not enter a
Curiosity capacity plan.

## 11. License and clean-room boundary

**FACT (high):** The official `vespa-engine/vespa` repository's root `LICENSE`
is Apache License 2.0. It grants copyright and contributor patent licenses
subject to conditions, includes patent-litigation termination, requires license
and attribution preservation on redistribution, and does not grant trademark
rights beyond customary origin description [S18].

**UNKNOWN:** This review did not inventory every bundled dependency, model,
sample dataset, container image, client, or cloud term. The root repository had
no `NOTICE` file at the probed raw URL; that negative result does **not** prove
that no subcomponent or distribution has NOTICE/attribution obligations.

**Clean-room rules for Curiosity:**

1. Learn from public behavior and architecture documentation; write an
   independent specification in Curiosity vocabulary.
2. Do not copy Vespa source, schemas, examples, protocol payloads, generated
   files, tests, comments, or internal constants into an owned implementation.
3. Do not imply that Apache-2.0 Vespa code is Curiosity-owned code. If a future
   decision embeds or links Vespa, perform dependency/SBOM, license, NOTICE,
   patent, trademark, export, and cloud-terms review first.
4. Keep the provider-neutral retrieval/ranking contract separate from any Vespa
   adapter. Preserve source attribution in this dossier and future provenance.
5. Benchmark only on licensed/authorized corpora and models; official Vespa
   tutorials themselves sometimes use research-only datasets [S11].

## 12. Curiosity decision ledger

| Item | Verdict | Basis / confidence |
| --- | --- | --- |
| Schema-versioned logical fields plus explicit physical serving roles | **ADOPTED** | High: makes index/attribute/summary/vector trade-offs reviewable. |
| Separate canonical corpus from reconstructible serving materializations | **ADOPTED** | High: Vespa's eventual consistency and non-snapshot visits reinforce the need. |
| Lexical + sparse + dense candidate union | **ADAPTED** | High: adopt union and provenance, not Vespa YQL/operators. Lexical remains mandatory baseline. |
| First/local-second/global ranking funnel | **ADOPTED** | High: explicit stage location and strict candidate budgets control cost. |
| Per-retriever and per-stage trace contract | **ADOPTED** | High: required for evaluation, provenance, and bounded degradation. |
| Exact vector oracle alongside ANN | **ADOPTED for evaluation** | High: required to quantify ANN recall; not necessarily a production path. |
| Distributed bounded grouping | **ADAPTED** | Medium-high: useful for diversity/facets; approximate semantics and DoS risk require tight bounds. |
| Bucket/replica/serving-copy separation | **ADOPTED conceptually** | High: preserve the three concerns; derive an independent algorithm later. |
| Vespa distribution algorithm and internal storage layout | **REJECTED copying** | High: implementation-specific and unnecessary for the neutral contract. |
| Vespa as wholly owned Curiosity core | **REJECTED under current premise** | High: mature Apache-2.0 third-party engine is not independently owned implementation. |
| Vespa as a benchmark/reference adapter | **DEFERRED** | Medium: useful only after corpus, SLO, ownership exception, and license/ops review exist. |
| Vespa Cloud backup/managed operations | **REJECTED as ownership foundation** | High: hosted control plane conflicts with wholly owned/self-hosted goal; concepts still inform requirements. |
| Global-scale capacity or cost conclusion | **DEFERRED** | High: no authorized workload/SLO/hardware assumptions or Curiosity benchmark. |

## 13. Fact / inference / recommendation ledger

| ID | Type | Statement | Sources | Confidence / check |
| --- | --- | --- | --- | --- |
| L1 | FACT | Schemas map document types and field roles into one or more content clusters. | [S1][S2][S7] | High; cross-checked overview, schema guide, services reference. |
| L2 | FACT | Proton has ready/not-ready/removed sub-databases and separates query from feed paths. | [S3] | High; single authoritative architecture page. |
| L3 | FACT | Bucket ownership is deterministic; distributors and controllers continuously repair ideal state. | [S4][S6] | High; algorithm and operational descriptions agree. |
| L4 | FACT | Successful writes are logged/durable and immediately visible by default, but replica/read semantics are eventual rather than linearizable. | [S3][S9] | High; apparent tension resolved by scope: local visibility versus distributed consistency. |
| L5 | FACT | OR of top-k lexical/sparse/vector retrievers exposes a candidate union to phased ranking. | [S10][S11][S12] | High; guide plus phased-ranking specification. |
| L6 | FACT | First/second phases are node-local; global phase runs after merged hits reach the container. | [S8][S12] | High. |
| L7 | FACT | Grouping is distributed, bounded, and potentially approximate for ordered global groups. | [S15][S16] | High. |
| L8 | FACT | Visits are not snapshot-isolated; Cloud backups and self-managed recovery are different mechanisms. | [S9][S20][S21] | High. |
| L9 | INFERENCE | Candidate provenance and stage cutoffs must be stable engine-neutral result fields. | [S8][S11][S12] | High; necessary to make union/funnel behavior auditable. |
| L10 | INFERENCE | Serving replication cannot replace canonical immutable versions or backup. | [S3][S9][S20] | High. |
| L11 | RECOMMENDATION | Build Curiosity's owned baseline independently and use Vespa only as an architectural/evaluation reference. | This dossier; repository constitution | High under current ownership premise. |
| L12 | RECOMMENDATION | Gate ANN, grouping, and expensive global reranking on measured recall, latency, update, coverage, and cost budgets. | [S12][S14][S15][S17] | High. |

## 14. Unknowns and required checks before any reconsideration

1. **Workload:** authorized corpus size, languages, field lengths, vector count
   and dimensions, mutation/delete rate, query classes, and group cardinality.
2. **SLOs:** QPS, p50/p95/p99, freshness, minimum coverage, availability, RPO,
   RTO, regions, and degraded-result policy.
3. **Relevance:** judgments, lexical baseline, exact-vector oracle, candidate
   recall by retriever, union overlap, phase survival, diversity, and calibration.
4. **Operations:** rebuild/restore drills, schema migration, tombstone retention,
   transaction-log replay, node loss, partition, disk-full/feed-block, and trace
   redaction/retention.
5. **Licensing/security:** exact Vespa version and artifact inventory, SBOM,
   transitive licenses/notices, model/data rights, trademarks, patent review,
   cloud/container terms, CVE/update process, and plugin isolation.
6. **Benchmark:** reproduce with a Curiosity-shaped corpus and fixed harness;
   report hardware, versions, warmup, maintenance state, percentiles, coverage,
   quality/recall, feed rate, memory/disk, and failure conditions.

## 15. Bounded curiosity pass and stop

Scoring: 1 low to 5 high; cost 1 cheap to 5 expensive.

| Thread | Rel. | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve “immediate visibility” versus eventual consistency | 5 | 5 | 3 | 1 | **Pursued:** local/index visibility after ACK does not imply linearizable replica reads [S3][S9]. |
| Determine whether document export is a snapshot | 5 | 5 | 4 | 1 | **Pursued:** visits explicitly lack snapshot isolation [S9]. |
| Find a concrete scale test behind broad claims | 5 | 4 | 4 | 2 | **Pursued:** retained the billion-vector setup and bounded its applicability [S17]. |
| Verify repository license from origin | 5 | 5 | 2 | 1 | **Pursued:** root Apache-2.0 license fetched directly [S18]. |
| Inventory every dependency/license in current distributions | 4 | 5 | 3 | 5 | `CURIOSITY_NO_GO`: no adoption decision or exact artifact/version; mandatory if reconsidered. |
| Inspect Vespa source to reproduce algorithms/layouts | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: outside clean-room behavioral research and unnecessary. |
| Run live benchmark | 5 | 5 | 3 | 5 | `CURIOSITY_NO_GO`: no authorized corpus, workload, deployment, or implementation authority. |
| Price Vespa Cloud versus owned deployment | 3 | 3 | 2 | 4 | `CURIOSITY_NO_GO`: hosted foundation is out of frame and workload/SLOs are unknown. |
| Patent/FTO analysis of ANN/ranking/distribution | 4 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: counsel work outside authority; defer to implementation gate. |

**Coverage:** every caller-requested category is represented.  
**Saturation:** additional official pages repeated the same schema, feed,
retrieval, ranking, grouping, tracing, or operations model.  
**Stop:** coverage and saturation reached. Follow-up execution requires caller
authority, a declared workload/frame, and the listed legal/operational gates.

## 16. Official sources

All sources accessed **2026-08-17**.

1. **[S1] Vespa overview.** https://docs.vespa.ai/en/learn/overview.html —
   container/content/config architecture, application packages, query and write
   flows, distributed serving.
2. **[S2] Schemas.** https://docs.vespa.ai/en/basics/schemas.html — document and
   synthetic fields, index/attribute/summary roles, multiple schemas/clusters.
3. **[S3] Proton.** https://docs.vespa.ai/en/content/proton.html — document
   databases, sub-databases, transaction log, document/index stores,
   maintenance, feed/query paths.
4. **[S4] Distribution algorithm.**
   https://docs.vespa.ai/en/content/idealstate.html — deterministic weighted
   placement, minimal movement, skew and node-scale discussion.
5. **[S5] Partial updates.**
   https://docs.vespa.ai/en/writing/partial-updates.html — update costs and
   index/attribute/summary behavior.
6. **[S6] Content nodes, states and metrics.**
   https://docs.vespa.ai/en/content/content-nodes.html — distributors, cluster
   controllers, replicas, buckets, ordering, repair, restarts.
7. **[S7] `services.xml` content reference.**
   https://docs.vespa.ai/en/reference/applications/services/content.html —
   document mapping/modes, redundancy, searchable copies, groups, resource
   limits and tuning.
8. **[S8] Query API guide.** https://docs.vespa.ai/en/querying/query-api.html —
   processing, fan-out, DAAT matching/ranking, merge, fill, tracing.
9. **[S9] Vespa consistency model.**
   https://docs.vespa.ai/en/content/consistency.html — durability, eventual
   consistency, visibility, reconciliation, no snapshot isolation.
10. **[S10] Nearest-neighbor search.**
    https://docs.vespa.ai/en/querying/nearest-neighbor-search.html — tensors,
    distance metrics, exact/ANN, target hits, filters and rank profiles.
11. **[S11] Nearest-neighbor practical guide.**
    https://docs.vespa.ai/en/querying/nearest-neighbor-search-guide.html —
    weakAnd/wand/ANN candidate unions, hybrid features, filter planning and
    exact/approximate comparison.
12. **[S12] Phased ranking.** https://docs.vespa.ai/en/ranking/phased-ranking.html
    — retrieval, first/second/global phases, total rerank bounds,
    normalization/RRF and phase statistics.
13. **[S13] Ranking expressions and features.**
    https://docs.vespa.ai/en/ranking/ranking-expressions-features.html — typed
    features, model expressions, match/summary features and feature dumps.
14. **[S14] Approximate nearest neighbor using HNSW.**
    https://docs.vespa.ai/en/querying/approximate-nn-hnsw.html — graph
    configuration, exact override, recall/latency/update trade-offs.
15. **[S15] Grouping and aggregation.**
    https://docs.vespa.ai/en/querying/grouping.html — distributed grouping,
    bounds, precision/correctness, continuations and aggregation.
16. **[S16] Query API reference.**
    https://docs.vespa.ai/en/reference/api/query.html — rerank/target controls,
    grouping caps, coverage/timeouts, trace/explain/profile parameters.
17. **[S17] Vespa engineering, “Billion-scale vector search with Vespa — part
    two” (2022-01-27).** https://blog.vespa.ai/billion-scale-knn-part-two/ —
    official one-billion-vector experiment, hardware, throughput, memory,
    latency and recall figures.
18. **[S18] `vespa-engine/vespa` root license.**
    https://raw.githubusercontent.com/vespa-engine/vespa/master/LICENSE — Apache
    License 2.0 text; direct origin for license claim.
19. **[S19] `/document/v1` API reference.**
    https://docs.vespa.ai/en/reference/api/document-v1.html — operation,
    visit/slicing/continuation, conditional write and back-pressure contracts.
20. **[S20] Data management and backup.**
    https://docs.vespa.ai/en/operations/data-management.html — Vespa Cloud
    backup/restore constraints and manual export alternative.
21. **[S21] Self-managed content-node recovery.**
    https://docs.vespa.ai/en/operations/self-managed/content-node-recovery.html
    — corrupted-node repair and convergence checks.
22. **[S22] Vespa.ai homepage.** https://vespa.ai/ — current vendor headline
    scale statement, retained explicitly as marketing rather than benchmark.
