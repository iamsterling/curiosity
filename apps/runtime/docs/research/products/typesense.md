# Typesense architecture: clean-room product research

**Decision frame.** Determine which architectural ideas Curiosity should adopt,
adapt, reject, or defer from Typesense without copying GPL-covered code. This is
an architecture study, not an implementation specification or legal opinion.

**Scope.** Typesense Server v30.2, with current official documentation and the
public `v30.2` source tag. Primary sources were accessed **2026-08-17**. The
bounded questions are: storage/index split; lexical, filter, facet, vector and
hybrid execution; mutation lifecycle; replication and recovery; capacity and
performance evidence; and security/licensing boundaries. Typesense Cloud's
private control plane is out of scope.

**Evidence labels.** **FACT** is directly supported by a cited primary source;
**INFERENCE** is a clean-room interpretation of public interfaces or source
structure; **RECOMMENDATION** is a Curiosity design judgment. Confidence is
High / Medium / Low.

## Executive verdict

Typesense is best understood as a **fully replicated, read-optimized search
node**: RocksDB is the durable document/meta store; schema-selected search
structures are rebuilt and maintained in RAM; Raft serializes cluster writes;
every node holds the complete dataset and serves local reads. Its strongest
transferable ideas are explicit indexed-versus-stored fields, bounded fuzzy and
prefix candidate expansion, query-time choice between facet algorithms,
filter-aware ANN with a small-set flat-search escape hatch, and operationally
explicit snapshot/restore. Its principal limit for Curiosity is that replication
adds availability and read throughput, **not data sharding**: per-node RAM must
still hold the complete index. [S1][S2][S8]

| Verdict | Lesson | Rationale for Curiosity |
|---|---|---|
| **ADOPT** | Separate durable source records from rebuildable serving indexes | Recovery and index evolution become explicit; unindexed payload need not consume index RAM. |
| **ADOPT** | Bound typo/prefix work and expose exhaustion controls | Protects latency from short, ambiguous queries; exact exhaustive behavior remains opt-in. |
| **ADAPT** | Hybrid retrieval as two independently observable candidate paths plus fusion | Preserve lexical/vector scores, candidate limits and provenance; do not hide fusion behind one opaque score. |
| **ADAPT** | Facet strategy chosen from hit cardinality and requested breadth | Useful, but Curiosity should require exact/estimated metadata rather than silently varying count semantics. |
| **ADAPT** | Full-replica Raft deployment | Suitable only for modest, read-heavy corpora; retain a separate scaling plan for partitioned data. |
| **REJECT** | Treat the search service as the system of record | Typesense is optimized for search/read patterns and rebuilds volatile indexes from disk; Curiosity should retain an authoritative ingestion ledger. |
| **REJECT** | Copy or translate Typesense server source | Server code is GPL-3.0; architectural concepts and public behavior may inform a clean-room design, but source-derived implementation copying crosses the intended boundary. [S13] |
| **DEFER** | In-process embedding inference | Operational coupling, 2–6 GB model RAM, external credential handling, and provider retries need separate threat/capacity review. [S7][S12] |

## 1. System shape and data ownership

### Durable plane versus serving plane

- **FACT (High):** Typesense calls itself an in-memory datastore: the complete
  search index resides in memory, while raw documents are stored on disk. At
  search time it identifies result IDs using RAM structures, then fetches only
  final documents from disk for the response. On restart, documents are read
  from the data directory and in-memory indexes are rebuilt. [S1][S2]
- **FACT (High):** The durable store abstraction wraps RocksDB. The public
  source exposes get/insert/remove, batched writes, scans, checkpoints,
  compaction and reload. Collection metadata, document-ID/sequence-ID mappings,
  and stored records use key prefixes in the same store. [S3][S4]
- **FACT (High):** Every schema field is indexed by default. `index:false`
  stores a field without adding it to the in-memory query indexes; `store:false`
  removes it before disk storage. Search/filter/facet/group/sort fields therefore
  consume index resources, while display-only fields can remain disk-only. [S5]
- **INFERENCE (High):** RocksDB is not merely a backup file: it is the
  reconstruction source and response payload store, while RAM structures are
  derived serving state. The disk read on final hits means SSD latency still
  affects response tails even though candidate generation is in memory.
- **INFERENCE (Medium):** A node restart has a corpus-size-dependent warm-up
  period. Documentation exposes parallel collection/document load controls but
  does not publish a general readiness-time model. [S12]

### In-memory structures

- **FACT (High):** The original design identifies a token-to-documents inverted
  index backed by an Adaptive Radix Tree (ART). Current v30.2 source still has a
  per-field `search_index` of ART trees; each token leaf owns document IDs,
  offset mappings and token offsets. Posting lists are compressed chains of
  blocks, supporting skip/intersection and positional/exact/phrase checks. [S6]
- **FACT (High):** Other per-field structures are specialized: numeric trees,
  optional numeric range tries, sort maps, string-sort trees, facet indexes,
  infix tries, geo indexes, a complete sequence-ID list, and HNSW vector indexes.
  These are visible as separate members of `Index`, not one universal index.
  [S6]
- **INFERENCE (High):** Schema flags are physical-design decisions. Enabling
  facets, infix, sort, range or vectors allocates distinct structures and can
  multiply RAM/update cost. A Curiosity contract should not present them as
  cost-free query options.

## 2. Lexical retrieval: typo, prefix and ranking

- **FACT (High):** ART supports prefix iteration and fuzzy search. Current fuzzy
  calls take edit-cost bounds, a maximum number of words, token ordering,
  prefix mode and optional filter constraints. The API defaults `prefix=true`
  and applies prefix treatment to the final query word for autocomplete. [S6][S9]
- **FACT (High):** `num_typos`, `min_len_1typo`, and `min_len_2typo` bound edit
  tolerance. `typo_tokens_threshold` delays broader typo exploration until too
  few results have been found. `max_candidates` defaults to 4 and limits
  similar prefix/typo terms; `exhaustive_search=true` expands all variations and
  disables early stopping thresholds. [S9]
- **FACT (High):** Candidate terms are ranked by a configured default sorting
  field when present, otherwise by matching-record frequency. Ranking also uses
  token match information and positions/proximity; current APIs expose exact
  match, token position, number of matching fields, field weights, typo cost,
  token dropping and custom sort controls. [S5][S6][S9]
- **INFERENCE (High):** Typo tolerance is not a preliminary spell-correction
  rewrite. It is bounded vocabulary traversal that produces token candidates,
  whose postings are then intersected/scored. Popularity-based candidate
  pruning can improve latency while excluding a rarer intended completion.
- **RECOMMENDATION:** Curiosity should report lexical expansion diagnostics:
  candidate cap, expansions considered, early-stop reason, dropped tokens and
  exhaustion status. This makes bounded behavior testable and prevents a silent
  recall change when defaults move.

## 3. Filtering and faceting

### Filters

- **FACT (High):** `filter_by` supports exact and token-level string matching,
  numeric comparisons/ranges, Boolean composition, arrays, nested-object-array
  scoping, negation, geographic predicates and string-prefix filters. Optional
  `range_index:true` accelerates numeric ranges at additional memory cost. [S9]
- **FACT (High):** Internally, filter expressions become a filter tree/result
  iterator. Posting-list intersections and HNSW search can consume that iterator;
  the search surface also exposes lazy filtering and candidate caps. [S6]
- **FACT (High):** The server defaults to at most 100 operators in a filter
  expression (`--filter-by-max-ops`). [S12]
- **INFERENCE (Medium):** The architecture aims to avoid always materializing a
  full filtered ID set: filter iterators can participate during lexical/ANN
  traversal. Exact planner heuristics and worst-case complexity are not fully
  documented, so a complex filter should not be assumed cheap merely because it
  is index-backed.

### Facets

- **FACT (High):** Facet fields are indexed verbatim. The in-memory facet index
  maps field/value to document-ID sets, assigns IDs to unique values, tracks
  counts and provides hash/value indexes. High-cardinality handling can remove
  some indexes. [S5][S10]
- **FACT (High):** Two documented query algorithms exist. `exhaustive` walks
  matched documents and accumulates their facet values; `top_values` takes
  high-frequency facet-value posting lists and intersects each with search hits.
  `automatic` chooses heuristically. `top_values` can avoid scanning many hits,
  but its `total_values` is not exact because only limited facet values are
  intersected. [S9]
- **FACT (High):** Facet sampling parameters exist for large result sets. [S9]
- **RECOMMENDATION:** Curiosity should return `count_mode: exact|estimated`, the
  sample rate and planner strategy with every aggregation. Adopt the dual
  strategy, not ambiguous count semantics.

## 4. Vector, semantic and hybrid retrieval

- **FACT (High):** A vector field is a `float[]` with fixed `num_dim`. The
  default ANN index is HNSW; v30.2 defaults are `M=16`,
  `ef_construction=200`, and search `ef=10`. Cosine distance is the documented
  default; the source normalizes vectors and uses an inner-product space for
  cosine. [S6][S7]
- **FACT (High):** `flat_search_cutoff` bypasses HNSW for brute-force scoring
  when a filter yields fewer than the configured number of documents. HNSW
  accepts a filter functor for approximate filtered search. `k`, distance
  threshold and result pagination bound output. [S6][S7]
- **FACT (High):** Typesense can accept caller-generated embeddings or generate
  them using built-in ONNX models and remote providers. Auto-embedding uses
  configured source fields; embeddings regenerate only when those source fields
  change. Remote embedding calls have explicit timeout, retry and bulk batch
  controls. GPU accelerates embedding generation only, not ANN retrieval. [S7]
- **FACT (High):** Hybrid search runs lexical and vector retrieval and fuses
  ranks. Documentation states default weights of 0.7 keyword and 0.3 vector,
  adjustable with `alpha`; optional `rerank_hybrid_matches` computes the missing
  score for candidates found by only one branch at additional cost. Vector
  distance can alternatively re-sort lexical hits. [S7]
- **INFERENCE (Medium):** The documentation's displayed fusion equation uses
  ranks directly while calling the result a score; its exact orientation and
  normalization are not sufficiently specified to reproduce from docs alone.
  Treat fusion behavior as an API outcome requiring black-box conformance tests,
  not as a portable formula.
- **RECOMMENDATION:** Curiosity should preserve branch-level rank, raw score,
  candidate pool and fusion contribution. Use pre-filtered flat scoring for
  small allowed sets; benchmark post-/in-traversal filtering for selective,
  disconnected HNSW subsets. Keep embedding generation outside the serving
  engine unless the operational benefit clearly outweighs provider/model
  coupling.

## 5. Writes, updates and deletes

- **FACT (High):** Write modes are `create`, whole-document `upsert`, partial
  `update`, and `emplace` (create or partial update). Bulk JSONL import is the
  recommended high-throughput path; each record succeeds or fails independently,
  and the endpoint still returns HTTP 200, requiring inspection of every response
  line. [S11]
- **FACT (High):** Import processes 40 documents per server batch by default,
  then services queued searches; raising the batch size increases throughput but
  can impair search latency and transient memory. The docs recommend buffering
  and bulk import above tens of writes per second. [S11]
- **FACT (High):** A mutation record carries the prior full document loaded from
  disk, the new full document, fields to delete, preprocessed token/offset data
  and embedding results. Index code exposes incremental remove/upsert operations
  across postings, facets and vectors, while RocksDB supports batched durable
  writes. [S3][S6]
- **FACT (High):** Deletes support ID, filter batches and collection truncation.
  Larger delete batches are explicitly documented to affect concurrent work.
  Frequent updates/deletes can leave RocksDB space/read amplification that the
  compaction operation may reduce without blocking the DB, though off-peak
  execution is recommended. [S8][S11]
- **FACT (High):** Schema alterations validate stored documents and block writes
  to the collection; in HA, all nodes alter in parallel and writes are blocked
  cluster-wide for that collection. [S5]
- **INFERENCE (Medium):** Updates are logically replacement of affected index
  entries, not append-only immutable segments. This favors immediate visibility
  but makes write amplification proportional to changed indexed structures and
  can expose readers to lock contention. Public docs do not provide a formal
  per-document atomicity/visibility contract across disk and every in-memory
  structure.
- **RECOMMENDATION:** Curiosity should make ingestion idempotent by external
  source/version key, parse item-level bulk status, and retain a replayable
  authoritative log. Separate embedding jobs from metadata-only updates.

## 6. Clustering, replication and snapshots

- **FACT (High):** Current Typesense uses Raft (braft in source). Every node
  continuously replicates the entire dataset. Any node serves reads locally;
  writes arriving at followers are forwarded to the leader. A 3-node cluster
  tolerates one failure and 5 nodes tolerate two, with higher write latency.
  [S8][S14]
- **FACT (High):** Nodes use separate API and peering ports. Official guidance
  says peering traffic contains **unencrypted Raft data**, so the peering address
  must be private. Public API TLS is separately configurable. [S8][S12]
- **FACT (High):** Lagging/recovering nodes return 503 until caught up. Default
  health thresholds reject reads at update lag over 1000 and writes over 500.
  Loss of quorum causes Typesense to stop both reads and writes to avoid split
  brain, requiring manual recovery. [S8][S12]
- **FACT (High):** Internal snapshots compact Raft logs; external point-in-time
  snapshots use a RocksDB checkpoint and can be backed up. Copying a live data
  directory directly is unsafe. Restore stops the server, replaces the data
  directory, starts from the checkpoint and rebuilds RAM indexes. [S2][S8][S14]
- **FACT (High):** If a follower is unavailable/loading, automatic internal
  snapshotting is paused by design. A long-absent follower may therefore need to
  replay many writes; the documented recovery playbook removes it, triggers an
  internal leader snapshot, clears its data, then rejoins it to receive the
  compacted state. [S8]
- **INFERENCE (High):** Replication scales read QPS approximately by replicas but
  multiplies RAM/disk footprint and does not raise maximum corpus size. Write
  throughput remains leader/quorum constrained. Geographic latency and failure
  domain placement are deployment responsibilities unless using the private
  Cloud control plane.
- **RECOMMENDATION:** Curiosity should distinguish HA replication from capacity
  sharding in product language. Test restore-to-usable-search time (including
  index rebuild), not just snapshot creation, and encrypt/isolate all replication
  links.

### Important source contradiction

The repository's `DESIGN.md` says HA is a single-master/asynchronous-read-replica
system and states an availability-over-consistency partition preference. That is
historical and conflicts with current Raft docs/source and quorum-stop behavior.
**Verdict: REJECT as stale architecture evidence**; use it only for the ART and
read-optimized design rationale that current source corroborates. [S6][S8][S15]

## 7. Capacity and performance claims

### Published sizing guidance

- **FACT (Medium):** Official guidance estimates keyword-index RAM at 2–3× the
  byte size of indexed field values, with lower use for repeated vocabulary and
  higher use for unique tokens. Baseline process RAM is stated as about 20 MB.
  [S1]
- **FACT (Medium):** Official vector sizing is `7 bytes × dimensions × records`;
  built-in semantic models add 2–6 GB RAM, while remote embedding services add
  no model RAM. At least 2 vCPUs are required. Raw-data disk capacity is the
  stated minimum, with SSD strongly recommended. [S1]
- **INFERENCE (Medium):** The 7-byte rule is a planning heuristic, not a complete
  upper bound: HNSW graph links, allocator fragmentation, filters/facets/sorts,
  document metadata, concurrency and transient import buffers also matter.
  Likewise, raw-data-size disk does not include safe headroom for RocksDB
  compaction, Raft logs and snapshots.

### Vendor benchmarks (not independently reproduced here)

| Corpus / host | Published result | Confidence and caveat |
|---|---|---|
| 2.2M recipes, 4 vCPU | 900 MB RAM; 3.6 min indexing; 104 concurrent searches/s; 11 ms mean processing | **Medium:** first-party README; query mix, client latency and percentile tails are not stated. [S16] |
| 28M books, 4 vCPU | 14 GB RAM; 78 min indexing; 46 concurrent searches/s; 28 ms mean processing | **Medium:** same limitations. [S16] |
| 3M products, 3 nodes × 8 vCPU | 250 concurrent searches/s | **Low–Medium:** little workload/index detail; “concurrent searches/s” is nonstandard wording. [S16] |

**RECOMMENDATION:** Do not transpose these numbers to Curiosity. Benchmark our
own document/token distributions, filters, facets, vectors, updates and response
payloads. Record p50/p95/p99, recall@k, CPU/RAM/disk amplification, cold-start,
snapshot restore and mixed read/write behavior. Size every replica for the full
index plus failure/rebuild headroom.

## 8. Security and license boundaries

- **FACT (High):** Requests authenticate with API keys. Managed keys scope
  actions and collections and can expire; scoped search keys cryptographically
  embed immutable search parameters such as tenant filters and excluded fields.
  The bootstrap key has universal access and official docs warn against using it
  in production clients or browsers. [S17][S18]
- **FACT (High):** Public API TLS is optional/configured by certificate paths;
  CORS is separately configurable. Raft peering is unencrypted. Search logs may
  include request payloads. Remote embedding configurations may include provider
  API keys/service-account private keys. [S7][S8][S12]
- **FACT (High):** The server repository is GPL-3.0. GPL permits unmodified use
  and private modification without conveyance conditions, while distribution of
  modified/combined covered work triggers source and GPL obligations. Mere
  network interaction is not conveyance under GPLv3. Typesense states its client
  libraries are Apache-licensed, but each artifact must be checked independently.
  [S13][S16]
- **FACT (High):** The repository security policy only directs vulnerability
  reports to an email address; it does not document supported versions, response
  SLAs, hardening baseline or audit certifications. [S19]
- **INFERENCE (High):** A tenant filter embedded in a scoped search key is useful
  defense at the search boundary, but Curiosity should not let the search engine
  become the sole authorization authority. Key creation and signing must remain
  server-side, and filter claims must derive from authenticated policy.
- **RECOMMENDATION:** Put Typesense behind a trusted adapter; use least-privilege,
  short-lived scoped keys; enforce TLS at the API edge and private encrypted
  networking for peer traffic; redact query/payload logs; isolate embedding
  credentials; and rate/complexity-limit filters, wildcard/prefix expansion,
  page size and exhaustive search. Obtain counsel before distributing a modified
  server or linking any server code into Curiosity.

## 9. Clean-room implications for Curiosity

### Provider-neutral contract to adopt

1. **Durable record:** immutable source identity/version, normalized text,
   retrieval metadata and optional vector; replayable independently of provider.
2. **Index declaration:** explicit `searchable`, `filterable`, `facetable`,
   `sortable`, `vector`, `stored` capabilities with estimated cost.
3. **Bounded query budget:** lexical expansion cap, filter operation cap,
   candidate `k`, ANN effort, timeout, maximum hits/facets and exactness mode.
4. **Transparent result:** lexical score/rank, vector distance/rank, fusion
   contribution, applied filters, truncation/timeout flags and provider provenance.
5. **Operational SLO:** fresh-write visibility, cold rebuild, restore time,
   replica lag and mixed-load tail latency.

### Adapter-specific behavior to isolate

- Typesense query syntax, typo/prefix defaults, rank-fusion controls, facet
  strategy, scoped-key generation, JSONL item-level status, HNSW knobs, aliases,
  snapshots and leader/follower topology belong in a Typesense adapter/operations
  layer—not Curiosity's provider-neutral domain contract.
- Treat all returned highlights/documents as untrusted external data: validate
  shape/size, escape rendering, and preserve a bounded raw response only where
  policy permits.
- Blue/green reindexing should use a new collection plus alias cutover, while the
  authoritative ingestion ledger remains outside the engine.

### Proposed checks before adoption

| Check | Evidence sought | Stop / pass criterion |
|---|---|---|
| Lexical boundedness | Adversarial 1–2 character prefixes, typos, token dropping | p99 and candidate counts remain within declared budget; truncation is observable. |
| Hybrid quality | Curiosity relevance set with lexical-only, vector-only and fused runs | Fusion improves target nDCG/recall without unacceptable tail or opaque score loss. |
| Filtered ANN | Highly selective and disconnected tenant/category filters | No cross-tenant result; recall measured against exact flat baseline. |
| Mutation correctness | Create/update/delete/recreate during concurrent search and restart | No stale postings/vectors/facets after acknowledged write and documented visibility window. |
| Recovery | Node loss, quorum loss, snapshot restore, cold rebuild | RTO/RPO met with full index rebuild included; runbook is deterministic. |
| Capacity | Real token uniqueness, facets, vectors, update churn | Full replica fits with ≥30% measured headroom and compaction/snapshot overlap. |
| Security | Key scope bypass, filter override, TLS/log/credential review | Tenant isolation and least privilege hold under direct API access. |
| License | Artifact/SBOM and deployment/distribution review | GPL obligations and third-party model licenses accepted in writing. |

## 10. Unknowns and negative results

- **UNKNOWN:** Formal linearizability/read-after-write guarantees for reads served
  by followers. Current docs describe local reads and lag thresholds, not a
  consistency contract.
- **UNKNOWN:** Exact atomic ordering and crash-recovery behavior across RocksDB
  writes and all mutable in-memory indexes for an individual update.
- **UNKNOWN:** Complete current query planner heuristics for lazy filters,
  facet-strategy selection and filtered HNSW traversal.
- **UNKNOWN:** Exact hybrid rank-fusion normalization/tie behavior from docs; the
  published example is insufficient for independent reproduction.
- **UNKNOWN:** Worst-case cold rebuild and snapshot restore throughput by corpus
  shape; no general official model was found.
- **UNKNOWN:** Typesense Cloud internals, encryption controls, backup retention,
  multi-region consistency and control-plane architecture; they are not evidenced
  by the open server sources reviewed.
- **NEGATIVE RESULT:** No evidence of horizontal data sharding was found in the
  v30.2 HA docs/source reviewed; all evidence says full replication.
- **NEGATIVE RESULT:** No independently controlled benchmark was found in the
  primary-source budget; published figures are vendor-run.
- **NEGATIVE RESULT:** The public `SECURITY.md` contains no supported-version or
  remediation policy beyond the reporting email.

## 11. Bounded curiosity pass

Scoring is 1–5 for relevance (R), decision value (V), novelty (N), and research
cost (C); pursuit priority is qualitatively high when R/V/N are high and C low.

| Thread | R/V/N/C | Decision |
|---|---:|---|
| Resolve DESIGN.md vs current HA behavior | 5/5/3/1 | **Pursued:** current Raft docs and `ReplicationState` override stale design text. |
| Confirm filtered-vector execution and flat fallback | 5/5/4/2 | **Pursued:** API docs plus HNSW filter functor corroborate both paths. |
| Determine exact hybrid fusion math | 4/4/3/4 | **CURIOSITY_NO_GO:** docs are ambiguous; full code tracing/behavioral harness exceeds this clean-room bounded pass. Record as unknown and require conformance tests. |
| Reverse-engineer mutable-index crash atomicity | 4/5/4/5 | **CURIOSITY_NO_GO:** would require deep write-path proof/fault injection; defer to an authorized evaluation. |
| Inspect Typesense Cloud control plane | 2/2/3/5 | **CURIOSITY_NO_GO:** private/out of frame and unnecessary for server architecture verdict. |
| Reproduce vendor benchmarks | 4/5/2/5 | **CURIOSITY_NO_GO:** no deployment/data-run authority; propose Curiosity-specific benchmark instead. |

**Stop reason:** coverage achieved for every declared sub-question; additional
source tracing had diminishing decision value and would not change the
adopt/adapt/reject/defer verdicts without executable evaluation authority.

## Sources

All sources are primary and accessed 2026-08-17. Versioned documentation is
v30.2 unless noted.

- **[S1]** Typesense, [System Requirements](https://typesense.org/docs/guide/system-requirements.html).
- **[S2]** Typesense, [Backing Up and Restoring Data](https://typesense.org/docs/guide/backups.html).
- **[S3]** Typesense Server v30.2, [`include/store.h`](https://github.com/typesense/typesense/blob/v30.2/include/store.h).
- **[S4]** Typesense Server v30.2, [`include/collection.h`](https://github.com/typesense/typesense/blob/v30.2/include/collection.h) and [`src/collection_manager.cpp`](https://github.com/typesense/typesense/blob/v30.2/src/collection_manager.cpp).
- **[S5]** Typesense, [Collections API](https://typesense.org/docs/30.2/api/collections.html).
- **[S6]** Typesense Server v30.2, [`include/index.h`](https://github.com/typesense/typesense/blob/v30.2/include/index.h), [`include/art.h`](https://github.com/typesense/typesense/blob/v30.2/include/art.h), and [`include/posting_list.h`](https://github.com/typesense/typesense/blob/v30.2/include/posting_list.h).
- **[S7]** Typesense, [Vector Search](https://typesense.org/docs/30.2/api/vector-search.html).
- **[S8]** Typesense, [High Availability](https://typesense.org/docs/guide/high-availability.html) and [Cluster Operations](https://typesense.org/docs/30.2/api/cluster-operations.html).
- **[S9]** Typesense, [Search API](https://typesense.org/docs/30.2/api/search.html).
- **[S10]** Typesense Server v30.2, [`include/facet_index.h`](https://github.com/typesense/typesense/blob/v30.2/include/facet_index.h).
- **[S11]** Typesense, [Documents API](https://typesense.org/docs/30.2/api/documents.html).
- **[S12]** Typesense, [Server Configuration](https://typesense.org/docs/30.2/api/server-configuration.html).
- **[S13]** Typesense Server v30.2, [`LICENSE.txt` (GPL-3.0)](https://github.com/typesense/typesense/blob/v30.2/LICENSE.txt); GNU, [GPLv3](https://www.gnu.org/licenses/gpl-3.0.html).
- **[S14]** Typesense Server v30.2, [`include/raft_server.h`](https://github.com/typesense/typesense/blob/v30.2/include/raft_server.h).
- **[S15]** Typesense Server v30.2, [`DESIGN.md`](https://github.com/typesense/typesense/blob/v30.2/DESIGN.md) (historical/stale where contradicted).
- **[S16]** Typesense Server, [README: benchmarks, FAQ and licensing rationale](https://github.com/typesense/typesense/tree/v30.2#readme).
- **[S17]** Typesense, [Authentication](https://typesense.org/docs/30.2/api/authentication.html).
- **[S18]** Typesense, [API Keys and Scoped Search Keys](https://typesense.org/docs/30.2/api/api-keys.html).
- **[S19]** Typesense Server v30.2, [`SECURITY.md`](https://github.com/typesense/typesense/blob/v30.2/SECURITY.md).

## Overall confidence

**High** for open-server topology, durable/in-memory split, principal index
structures, documented query features, mutation APIs, Raft replication,
snapshots and GPL boundary. **Medium** for inferred execution ordering,
performance generalization and exact planner behavior. **Low / unknown** for
Typesense Cloud internals and formal consistency/atomicity properties not stated
in the reviewed primary sources.
