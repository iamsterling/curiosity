# Azure AI Search: clean-room product and architecture study

**Research date:** 2026-08-17  
**Decision frame:** What publicly observable design lessons from Azure AI Search should Curiosity adopt, adapt, reject, or defer while building a wholly owned search stack?  
**Evidence boundary:** Public Microsoft documentation and pricing pages only. No account, credentials, paid deployment, traffic capture, binaries, private APIs, or source-code inspection were used. This is behavioral and interface analysis, not an implementation specification.

## Executive verdict

Azure AI Search presents one logical index that co-locates typed metadata, analyzed text, stored text, and vectors, but it exposes enough behavior to reveal a staged system: ingestion and enrichment; separate physical structures for lexical, filter, stored, and vector data; shard-local candidate generation; cross-shard merge; optional rank fusion; text-only semantic reranking; and extractive or generative response layers. The strongest transferable lesson is not a particular algorithm. It is the **explicit separation of candidate generation, policy filtering, ranking, and evidence rendering**, with bounded candidate windows and independently observable scores.

For Curiosity:

- **ADOPT** a provider-neutral typed index contract, immutable field semantics, versioned index migration, hybrid retrieval with rank-based fusion, pre-retrieval authorization, bounded reranking, extractive evidence, per-stage telemetry, and freshness checkpoints.
- **ADAPT** Azure's broad all-in-one index into owned, replaceable subsystems. Keep source records and provenance authoritative; treat indexes as rebuildable projections. Make lexical and vector candidate budgets explicit and independently tunable rather than hiding them behind one query.
- **REJECT** application-side post-query ACL trimming, silent underfill after vector filtering, mutable ranking without version telemetry, score thresholds treated as stable truth, and a capacity model that couples indexing and serving without isolation controls.
- **DEFER** learned semantic reranking, generated answer synthesis, binary quantization, query rewriting, and agentic multi-pass retrieval until offline evaluation, cost budgets, model provenance, and failure semantics exist.

Overall confidence is **high** for documented contracts and externally visible pipeline ordering, **medium** for architecture inferred from behavior, and **low** for unpublished internals such as exact topology, consistency timing, model identity/version, hardware, cache policy, and production latency distributions.

## Questions bounded by this study

1. What is indexed, and which field declarations create which query-time capabilities?
2. How are lexical, vector, and hybrid candidate sets produced and combined?
3. Where do metadata and authorization filters execute, and what recall failures follow?
4. What does semantic ranker actually consume and produce?
5. Are answers and citations extractive, generated, or merely reference metadata?
6. How do pull indexers, change detection, and schedules bound freshness?
7. What isolation, encryption, capacity, pricing, and reliability contracts are visible?
8. Which architecture conclusions are facts, which are inferences, and what remains unknown?

## Evidence notation

- **FACT** — directly stated by a cited primary source.
- **INFERENCE** — derived from multiple documented behaviors; not claimed by Microsoft as implementation detail.
- **RECOMMENDATION** — proposed Curiosity design choice.
- Confidence: **High**, **Medium**, or **Low**.

## 1. Product boundary and index model

### 1.1 Logical index

- **FACT (High):** An index is a separately stored, searchable projection of source content. It is not the primary source. Except for indexer-driven and remote agentic retrieval paths, query execution does not consult external source stores. A service query targets one index; there are no joins across independent indexes. [S1]
- **FACT (High):** Each document has exactly one `Edm.String` key. Fields can be primitive, collections, nested complex types, geographic points, or vector arrays. Schema attributes include `searchable`, `filterable`, `sortable`, `facetable`, `retrievable`, and `key`; analyzer, synonym, vector, semantic, scoring, suggester, CORS, and encryption configuration sit alongside fields. [S1]
- **FACT (High):** `searchable` text is analyzed into an inverted index. `filterable`, `sortable`, and `facetable` strings preserve un-tokenized values and consume additional storage. Stored/retrievable content is another physical concern. Vector fields create internal vector indexes. [S1][S15]
- **FACT (High):** Existing field definitions are locked for the index lifetime. New fields can be added, but structural changes generally require drop-and-rebuild or a new index version. Azure recommends code-defined schemas for repeatable rebuilds. [S1]
- **FACT (High):** Documents become queryable during ingestion; concurrent updates can yield temporarily incomplete query results. Deletions and storage reclamation are asynchronous. [S1][S15]

**INFERENCE (High):** The logical document abstraction fans out into at least four storage/access paths: inverted postings, exact-value/filter structures, stored fields, and vector structures. This is not one universal index. The schema is a declarative materialization plan over several engines.

**RECOMMENDATION:** Curiosity should use a provider-neutral `IndexSchema` that declares behavior, not backend classes. Every field capability should map to an explicit cost and physical projection. Schema changes that alter tokenization, vector metric/dimension, or authorization semantics should mint a new index generation, bulk build it, validate it, then atomically switch an alias.

### 1.2 Ingestion contracts

- **FACT (High):** Azure supports push ingestion through document indexing APIs and pull ingestion through indexers. Push payloads support upload, merge, merge-or-upload, and delete actions; request payloads are bounded at 16 MB and normally at 1,000 documents per batch. [S13]
- **FACT (High):** Pull indexers follow a visible pipeline: source retrieval/document cracking, field mappings, optional skillset execution, output field mappings, then search-engine indexing. An indexer has exactly one data source and one destination index, while several indexers can write to one index. [S6]
- **FACT (High):** Integrated vectorization is an indexer pipeline composition: chunking plus an embedding skill on ingestion, and an index-level vectorizer for text-to-vector conversion at query time. The query vectorizer must match the model used for stored vectors. External vectorization and direct push remain supported. [S16]

**INFERENCE (Medium):** Azure's “integrated” pipeline is orchestration, not model ownership. Search schedules and invokes separately provisioned model endpoints and then persists the outputs. The search service therefore owns transition handling but not all compute dependencies.

**RECOMMENDATION:** Keep Curiosity ingestion as a durable, replayable DAG with immutable step versions: fetch → parse → normalize → chunk → enrich → embed → project → commit. Persist source fingerprint, parser/chunker/embedder version, parent document ID, chunk offsets, ACL snapshot/version, and projection generation. A failed enrichment must not silently become an authoritative empty field.

## 2. Candidate generation and ranking

### 2.1 Lexical retrieval

- **FACT (High):** Azure's full-text engine uses selected Apache Lucene functionality. Query execution is documented as parsing, lexical analysis, document retrieval from field-specific inverted indexes, and scoring. Simple and Full Lucene parsers expose different operator sets. [S2]
- **FACT (High):** Analyzers are per searchable field and may differ between indexing and query time. Standard behavior includes case normalization, punctuation handling, tokenization, and optionally stemming and stop-word handling. Prefix, wildcard, regex, and fuzzy queries bypass normal lexical analysis in important ways. [S2]
- **FACT (High):** Full-text results use BM25. Scoring profiles can add field weights and freshness, distance, magnitude, or range functions. Explicit sorting overrides relevance order. [S2][S17]
- **FACT (High):** Each shard scores independently using shard-local term statistics; shard results are then merged. Identical documents on different shards can therefore receive slightly different scores. Stable ordering is not guaranteed for ties. [S2]

**INFERENCE (High):** Lexical retrieval is scatter/gather across shards, and global document frequency is not synchronously maintained for every query. This favors throughput and shard autonomy over globally exact BM25 comparability.

**RECOMMENDATION:** Curiosity should expose lexical candidate budget, analyzer version, parser mode, selected fields, per-field boosts, and tie-break key in the query trace. Use deterministic secondary sorting. Prefer globally calibrated evaluation metrics over relying on raw BM25 score thresholds.

### 2.2 Vector retrieval

- **FACT (High):** Azure supports memory-resident HNSW approximate nearest-neighbor search and exhaustive k-nearest-neighbor search. HNSW exposes `m`, `efConstruction`, `efSearch`, and a metric; current documented metric choices include cosine, dot product, Euclidean, and Hamming for binary data. [S3][S15]
- **FACT (High):** HNSW fields consume a per-partition in-memory vector quota because graph traversal is random-access. Exhaustive KNN pages vectors into memory during query execution and does not consume that vector quota, although vectors still consume disk storage. [S15]
- **FACT (High):** Scalar (`int8`) and binary (1-bit) quantization, narrow vector types, dimension truncation, oversampling, and rescoring against preserved original vectors are available. Oversampling expands the quantized candidate set, after which full-precision vectors can reorder the final top `k`. [S4]
- **FACT (High):** A vector field binds to one vector search profile, which composes an algorithm and optional compression configuration. Vector field dimensions must match the embedding output. [S3]
- **FACT (High):** Azure does not apply lexical analyzers or scoring profiles directly to vector field contents. Vector similarity scores are transformed engine scores; for cosine, Azure documents `score = 1 / (1 + cosine_distance)`, not raw cosine similarity. [S3]

**INFERENCE (High):** Azure treats vector generation, ANN candidate search, lossy compression, and exact rescoring as separable stages. This is the important design, not HNSW itself.

**RECOMMENDATION:** Curiosity should store `embedding_model_id`, model revision, dimensions, normalization contract, metric, vector encoding, and source span with every vector projection. The query contract should reject model-space mismatch. Keep ANN recall validation against an exhaustive sample as a release gate. Never expose transformed provider scores as portable relevance truth.

### 2.3 Hybrid search and fusion

- **FACT (High):** A hybrid request executes one text query and one or more vector queries in parallel against the same logical index. Each component produces an independently ranked list. Reciprocal Rank Fusion (RRF) merges them. [S8][S9]
- **FACT (High):** Azure documents the RRF contribution as `1 / (rank + 60)` and sums contributions for documents appearing in several lists. This constant is unrelated to vector nearest-neighbor `k`. Vector query weights can change contributions. [S9]
- **FACT (High):** A vector query targeting two vector fields counts as two executions for fusion. One text query plus two vector queries over five fields can become 11 executions. [S9]
- **FACT (High):** Text recall is normally bounded; the documented `maxTextRecallSize` default is 1,000. `k` controls each vector list and `top` controls the fused response. [S8][S9]
- **FACT (High):** Debug output can decompose fused scores into subscores, supporting fusion and weighting diagnosis. [S9]

**INFERENCE (High):** Rank fusion is deliberately used because BM25 and vector score distributions are not directly comparable. The product favors a robust, calibration-light merge over learned score normalization.

**RECOMMENDATION:** **Adopt RRF first.** Curiosity's fusion stage should accept named candidate channels and budgets, deduplicate by canonical document/chunk identity, retain source rank and source score, and produce an auditable contribution list. Tune lexical/vector depth with offline judgments before adding learned fusion.

## 3. Filters and authorization

### 3.1 Metadata filters

- **FACT (High):** OData Boolean filters support comparisons, logical operators, collection `any`/`all`, geospatial predicates, `search.in`, and text matching functions. Filterable strings are exact-value, not analyzed text. Azure warns that hundreds of clauses can exceed complexity limits and recommends `search.in` over long disjunctions. [S5]
- **FACT (High):** Vector fields are not filterable. Filters target colocated nonvector string or numeric metadata. [S10]

### 3.2 Vector filter placement

- **FACT (High):** `preFilter` applies predicates during HNSW traversal on every shard, continues traversal to find qualifying candidates, and maximizes filtered recall. It can become much slower for selective predicates. [S10]
- **FACT (High):** `postFilter` obtains unfiltered local top-`k` per shard, filters those lists, then merges them. It has more predictable traversal cost but can miss qualifying documents. [S10]
- **FACT (High):** Preview `strictPostFilter` obtains an unfiltered global top-`k`, then filters it. It can return zero even when matching documents exist and has the highest false-negative risk. [S10]
- **FACT (High):** Azure recommends `preFilter`; it is the default for indexes created after roughly 2023-10-15. Older indexes can retain `postFilter` behavior and may require recreation for prefilter support. [S10]
- **FACT (High):** Microsoft's own benchmark shows prefilter can be several times slower on large indexes with selective filters, while postfilter sacrifices recall. These numbers are workload-specific, not a universal service guarantee. [S10]

**INFERENCE (High):** Filter semantics are an index-generation capability, not merely a request switch. The date-dependent default indicates a physical index or graph-layout evolution.

**RECOMMENDATION:** Authorization must be a **hard inclusion predicate**, never a post-hoc result decoration. Default to prefilter or an authorization-aware ANN design. If the backend cannot guarantee complete authorized top-`k`, return explicit `partial=true`, stage counts, and underfill reason; do not silently broaden access or claim no matches.

### 3.3 Document-level access control

- **FACT (High):** The generally applicable pattern stores user/group IDs in a nonretrievable, filterable string collection and injects a `search.in` filter derived from the caller's groups. Microsoft explicitly states these principals are strings and provide no authentication by themselves. [S11]
- **FACT (High):** Native POSIX-like ACL/RBAC scope, SharePoint ACL, and Purview label ingestion/enforcement are preview features in the 2026-05-01-preview API. Query-time enforcement compares a separate end-user token with permission metadata already synchronized into the index. [S12]
- **FACT (High):** Permission changes are not instantly authoritative. They take effect only after source-specific synchronization updates indexed permission metadata; SharePoint inherited permission changes can require explicit refresh. Microsoft warns of timing lag. [S12]
- **FACT (High):** Service-plane/data-plane RBAC roles are distinct. Data reader and contributor roles can be scoped to one index for direct API operations, but indexers operate with service-level privileges and are not constrained by those per-index assignments. [S18]

**INFERENCE (High):** Azure's authorization result is only as fresh as the ACL projection. Token validation at query time cannot repair stale document ACL metadata.

**RECOMMENDATION:** Curiosity should treat authorization as a versioned join between `(caller principals, policy version)` and `(document ACL snapshot, snapshot time)`. On revocation, prioritize deny propagation; measure `acl_lag_seconds`; support fail-closed maximum staleness; and test nested groups, inherited ACLs, deletion, chunk inheritance, and index rebuilds. Never expose ACL fields as retrievable content.

## 4. Semantic ranker, captions, answers, and citations

### 4.1 Semantic reranking

- **FACT (High):** Semantic ranker is an optional, usage-billed L2 stage over initial BM25 or RRF results. It does not search the corpus again. It reranks at most the top 50 candidates using text only, even when candidates came from vectors. [S7]
- **FACT (High):** A semantic configuration prioritizes one title field, keyword fields, and content fields. Eligible fields must be searchable, retrievable strings. The order matters because input is truncated. [S7]
- **FACT (High):** For each candidate, summarization accepts up to 2,000 input tokens, with 128-token caps for title and keywords and remaining budget for content. The generated summary passed onward can be up to 2,048 tokens. Semantic score is returned separately as `@search.rerankerScore` from 0 to 4. [S7]
- **FACT (High):** Microsoft warns that score distributions can vary because of infrastructure conditions and ranking-model updates; granular fixed thresholds are unsafe. [S7]
- **FACT (High):** Query rewrite can produce up to ten semantic variants before BM25/RRF and reranking. [S7]

**INFERENCE (High):** The ranker is a bounded cross-encoder-like or reading-comprehension pipeline over pre-summarized candidate text, operationally isolated from L1 retrieval. Its unpublished model and updates make it a nonstationary dependency.

**RECOMMENDATION:** Curiosity should preserve L1 and L2 scores, candidate rank before/after reranking, ranker model/revision, truncation counts, and the exact fields/spans supplied. Reranking must be bypassable and degrade to deterministic L1. Adopt only after proving lift on owned judgments and tail-latency budgets.

### 4.2 Extractive captions and answers

- **FACT (High):** Semantic captions are verbatim passages selected from each result and can include highlights. Semantic answers are also verbatim passages recognized by a reading-comprehension model; they are not generated prose. [S7][S19]
- **FACT (High):** Answers require a question-like query and answer-like indexed text in semantic fields. No answer is valid and represented by an empty array. The response includes document key, plain/highlighted text, and confidence; up to ten answers can be requested. [S19]
- **FACT (High):** The highest answer and highest caption may come from different documents. [S19]

**RECOMMENDATION:** Prefer extractive evidence before answer synthesis. Store immutable source URI, content hash, document key, chunk/span offsets, and ingestion timestamp so every displayed passage can link back to the exact source version. Treat highlights as untrusted markup and escape/sanitize before rendering.

### 4.3 Citations are a separate product layer

- **INFERENCE (High):** Classic document search and semantic answers expose document keys and passages, not the response-local reference/activity graph documented for agentic retrieval. An application can construct source links from those keys, but that is not the same citation contract. [S19][S20]
- **FACT (High):** Agentic retrieval returns an extracted grounding string plus `references` and `activity` arrays. Each reference has a response-local ID, document key, source type, and activity link. The reference ID is not the index document key. [S20]
- **FACT (High):** In the 2026-05-01-preview, agentic retrieval can synthesize answers, expose model/token activity, and carry inline reference IDs. This is distinct from classic semantic “answers,” which remain extractive. [S20]
- **FACT (High):** Agentic retrieval can emit up to 200 chunks after a documented reranker threshold of 2.5, subject to an output token budget; a too-large document can be omitted with a warning. [S20]

**INFERENCE (High):** Azure separates evidence identity from display text and from synthesis. This enables references to survive response shaping and provides an audit path from answer → response-local reference → source activity → source document.

**RECOMMENDATION:** Curiosity should make citations first-class and model-independent: stable evidence IDs, response-local aliases, source URI/version, quoted span, retrieval channel, authorization decision, and score lineage. A generated answer may cite only evidence actually present in the bounded context. Unsupported claims should fail citation validation rather than receive guessed links.

## 5. Indexers, change tracking, and freshness

- **FACT (High):** Indexers are pull crawlers over supported data sources. They can run on demand or at intervals from five minutes to 24 hours. More frequent freshness requires a push model. [S6][S14]
- **FACT (High):** Blob change detection is automatic; Azure SQL and Cosmos DB require change detection configuration. Scheduled indexers resume from persisted progress where supported. [S6][S14]
- **FACT (High):** The typical indexer execution ceiling is two hours in the multitenant environment and can be 24 hours in the private environment. Long jobs should run repeatedly so they resume from checkpoints. [S13]
- **FACT (High):** Scheduled starts are approximate. If one run overlaps the next, the scheduled occurrence can be skipped; delayed jobs can queue and later drain sequentially. Repeated failures can reduce schedule frequency. [S14]
- **FACT (High):** Indexers do not have dedicated compute, and indexing can increase query throttling. Text indexer concurrency is tied to search units; skill workloads use a separate execution environment and different availability constraints. [S6][S14]
- **FACT (High):** Deleted vector documents are tombstoned and reclaimed later during internal cleanup. High update/delete rates can inflate vector memory, and Azure does not expose the current deleted-document ratio. [S15]

**INFERENCE (High):** “Every five minutes” is a trigger floor, not a freshness SLO. End-to-end freshness is schedule delay + source detection + queue delay + crawl/enrichment time + index visibility + ACL propagation.

**RECOMMENDATION:** Curiosity should expose separate timestamps for source observation, content fetch, transformation, embedding, ACL snapshot, index commit, and query visibility. Define freshness SLOs from source mutation to searchable authorized projection. Use an append-only change ledger and idempotent checkpoints; dead-letter poison records rather than allowing one document to degrade the whole schedule.

## 6. Capacity, reliability, and pricing

### 6.1 Capacity model

- **FACT (High):** Dedicated capacity is `search units = replicas × partitions`. Replicas primarily increase query throughput and availability; partitions increase storage and indexing throughput. Standard tiers allow up to 36 SUs, with up to 12 replicas and 12 partitions subject to valid combinations. [S13]
- **FACT (High):** Newer services have materially larger storage and vector quotas. Current high-capacity per-partition storage spans 15 GB Basic, 160 GB S1, 512 GB S2, 1 TB S3, 2 TB L1, and 4 TB L2 in supported regions. HNSW memory quota per partition spans 5, 35, 150, 300, 150, and 300 GB respectively. Older services/regions can have much lower limits. [S13]
- **FACT (High):** Maximum vector dimensions are 4,096. Document-count limits are extremely high, but practical ceilings can instead be storage, in-memory vector quota, object count, field count, or throttling. [S13]
- **FACT (High):** Semantic-ranker concurrency and queue depth scale by tier and SU and can reject requests when both are full. Query throughput otherwise depends on query complexity and is not a fixed published QPS for Dedicated tiers. [S13]
- **FACT (High):** Index shard merge is periodic and resource-intensive; it reclaims deleted content and can cause latency spikes after content changes. [S21]

### 6.2 Reliability and consistency

- **FACT (High):** A replica is a copy of the search engine. One is primary for writes; reads can use other replicas. Replication is asynchronous after commit to the primary. [S22]
- **FACT (High):** Two replicas are required for the query SLA and three for query-plus-indexing SLA. Partitions do not affect SLA eligibility. Azure attempts zone distribution but does not guarantee exact placement. [S22]
- **FACT (High):** Loss of a primary can lose writes not yet replicated; promotion usually takes seconds. Azure AI Search is single-region and requires customer-built multi-region synchronization and failover. [S22]
- **FACT (High):** There is no managed self-service backup/restore. The service is explicitly not a primary store; recovery is rebuild from source or use sample export utilities. [S22]

**INFERENCE (High):** The serving index is a rebuildable, asynchronously replicated materialized view. Availability is bought with full engine replicas, while storage/indexing capacity is bought with partitions. Indexing and query load remain coupled enough that concurrency, merges, and replica/partition choices affect both.

**RECOMMENDATION:** Curiosity should preserve an authoritative source/change log outside the serving index, automate full rebuild, and test generation cutover and region restore. Separate ingestion workers from query nodes where possible, or enforce explicit resource admission control. Define read-after-write and revocation consistency instead of implying immediacy.

### 6.3 Pricing observations

- **FACT (High):** Dedicated service is fixed hourly capacity by tier and SU; multiplying replicas or partitions multiplies cost. Premium features add usage charges: semantic ranker per request after a free allowance, agentic retrieval by tokens, and some enrichment/image extraction by transaction. Actual regional dollar rates are agreement- and region-dependent and were not exposed in the fetched static page. [S23][S24]
- **FACT (High):** Serverless Developer is preview, scales compute dynamically including to zero, and bills by compute-unit hours plus indexed GB-month. It lacks an SLA and several operational features, including index aliases and shared private links. [S13][S24]
- **UNKNOWN:** Microsoft sources fetched on 2026-08-17 disagree on serverless billing start: the Learn limits/tier pages state **2026-09-13**, while the public pricing page says only “late 2026” with 30 days' notice. Treat the dated Learn pages as more specific but recheck before any financial decision. [S13][S23][S24]
- **UNKNOWN:** The public pricing page says semantic ranker is unavailable on Dedicated Free, while Learn documentation says it can run on Free subject to free-tier limits. No deployment was made to resolve this. [S7][S23]

**RECOMMENDATION:** Curiosity's cost model should allocate cost by stage and tenant: source fetch, parsing, embedding, lexical index bytes, vector bytes/RAM, queries by channel/depth, reranker calls, and synthesis tokens. Capacity and cost claims require workload replay, not SKU arithmetic alone.

## 7. Security architecture

- **FACT (High):** Azure recommends Microsoft Entra RBAC over API keys. Control-plane, object-management, data-write, and data-read roles are distinct; key authentication remains an alternative/default on some configurations. [S18]
- **FACT (High):** TLS 1.2/1.3 protects transport. Service-managed AES-256 encryption at rest is automatic; customer-managed keys add a second layer for indexes and sensitive object definitions. [S25][S26]
- **FACT (High):** Indexers may execute in service-private or Microsoft multitenant environments. Private-link access forces the private environment; public firewall access must account for both origin sets. [S27]
- **FACT (High):** Microsoft says customer documents and queries are not used to train its models. Query resource logs contain query text but not end-user identity. [S25]

**INFERENCE (Medium):** Azure's security planes are cleanly separated but operationally complex: client-to-search, search-to-source, search-to-model, and document authorization each have distinct identities and network paths.

**RECOMMENDATION:** Curiosity should model those four trust edges explicitly. Use workload identity, least privilege, private egress policy, encrypted secrets, redacted query telemetry, and immutable authorization audit records. Search results and connector payloads remain untrusted external data even when transport and storage are encrypted.

## 8. Reconstructed architecture

The following is a clean-room inference from contracts and observed/documented behavior, not a claim about Microsoft source code.

```text
source systems / push clients
        |
        v
connector + checkpoint state
        |
   crack / parse
        |
map -> enrich -> chunk -> embed -> ACL projection
        |
        v
logical document commit
   |          |          |          |
stored     exact-value  inverted   vector
fields     filter data  indexes    HNSW/eKNN
                                      |
query/auth context                      |
   |                                   |
parse + analyze ------ lexical top-N   |
metadata/ACL filter --- vector top-k --+
                 \       / 
                  RRF merge
                     |
              optional profiles
                     |
           semantic summary + L2
                     |
      captions / extractive answers
                     |
 optional agentic synthesis + references
                     |
              bounded response
```

### Architecture inferences

1. **Control and data planes are separate (High).** Service provisioning, schema objects, and role assignment use management paths distinct from document/query paths. [S18]
2. **Index commits feed several projections (High).** Field flags change storage footprint and query operations, which implies independent materializations rather than runtime interpretation of raw JSON. [S1][S15]
3. **Shards are the partition-local execution unit (High).** BM25 term statistics, HNSW graphs, filtering, and local top-`k` are described per shard; a coordinator merges results. [S2][S10]
4. **Replicas copy a partitioned engine (Medium).** Microsoft calls replicas full search-engine copies and partitions storage units; the exact process topology and shard-to-partition mapping are unpublished. [S13][S22]
5. **Semantic processing is a remote/shared model service (High).** Documentation says results are sent to Microsoft-hosted language models and semantic capacity/queues are region-level. [S7][S13][S25]
6. **Indexing is near-real-time but not transactionally coupled to source truth (High).** Queries can observe partial ingestion, replica propagation is asynchronous, and ACLs/freshness depend on synchronization. [S1][S12][S22]
7. **Maintenance is segment/shard based (Medium).** Deletes become tombstones, merges reclaim space, and latency can spike during shard merge. Exact Lucene segment policy is unknown. [S15][S21]

## 9. Curiosity target implications

### Provider-neutral contracts to own

1. `SourceRecord`: canonical ID, URI, source version/hash, observed time, content type, raw provenance.
2. `DocumentProjection`: generation, fields, parent/chunk offsets, parser/chunker versions, ACL snapshot/version.
3. `EmbeddingProjection`: model/revision, dimensions, metric, normalization, encoding, vector hash.
4. `RetrievalRequest`: lexical/vector channels, per-channel budgets, filters, authorization context, freshness cutoff, deadline.
5. `Candidate`: canonical ID, channel, local rank/score, shard/partition trace, match spans.
6. `FusionTrace`: dedup identity, per-channel RRF contribution, final L1 rank.
7. `RerankTrace`: ranker revision, text spans/truncation, old/new rank and score.
8. `Evidence`: immutable evidence ID, source version, exact quoted span, retrieval and authorization lineage.
9. `RetrievalResponse`: results, citations, stage timings/counts, partial/underfill flags, index and model generations.

### Bounded behavior

- Set hard limits for request bytes, clauses, fields, lexical candidates, vector candidates, fused candidates, rerank candidates, evidence bytes, and synthesis tokens.
- Carry one deadline and cancellation signal across all stages.
- Make every optional stage fail-open only to a defined earlier rank, never to unauthorized or unbounded retrieval.
- Record input/output counts at filter, ANN, fusion, rerank, and citation validation stages.
- Treat empty answer, fewer-than-`k`, partial source failure, stale ACL, and stale index as distinct outcomes.

### Evaluation checks before adoption

| Check | Required evidence |
|---|---|
| Lexical baseline | NDCG/MRR/recall on owned judgments; analyzer regression set |
| ANN | Recall@k against exhaustive ground truth; memory and p95/p99 latency |
| Hybrid | Channel ablations and RRF depth/weight sweep |
| Filters | Recall and latency versus selectivity; hard authorization leakage tests |
| Reranker | Lift, truncation sensitivity, model-version drift, fallback behavior |
| Freshness | mutation-to-searchable and revocation-to-denied distributions |
| Citations | exact-span validation, source-version resolution, unsupported-claim rate |
| Rebuild/DR | deterministic rebuild, alias cutover, region restore RTO/RPO |
| Cost | per-stage and per-tenant cost under replayed traffic |

## 10. Verdict ledger

| Azure pattern | Verdict | Curiosity treatment |
|---|---|---|
| One typed logical document over multiple physical structures | **ADOPT** | Provider-neutral schema with explicit cost/capability mapping |
| Search index as rebuildable projection, not primary store | **ADOPT** | Durable source ledger and reproducible generations |
| Immutable structural field semantics | **ADAPT** | Versioned generations plus alias cutover; automate migration |
| Lucene/BM25 lexical baseline | **ADOPT** | Owned analyzer/query contracts and deterministic tie breaks |
| HNSW plus exhaustive baseline | **ADOPT** | ANN for serving; exhaustive sample for recall checks |
| Quantization plus oversample/exact rescore | **DEFER** | Add only when memory pressure justifies measured quality tradeoff |
| RRF for hybrid fusion | **ADOPT** | Preserve all component ranks and contributions |
| Hidden/default candidate budgets | **REJECT** | Require explicit bounded budgets and trace them |
| Prefilter for hard constraints | **ADOPT** | Authorization-aware retrieval by default |
| Postfilter/strict-postfilter without underfill signal | **REJECT** | Allow only as explicit approximation with partial metadata |
| Bounded top-50 semantic rerank | **ADAPT** | Configurable owned budget; model/version and truncation telemetry |
| Opaque, mutable ranker scores used as thresholds | **REJECT** | Versioned calibration and robust policy thresholds |
| Extractive captions/answers | **ADOPT** | Exact evidence spans with source-version links |
| Agentic generated answers | **DEFER** | Require citation validator, token/cost cap, and no-answer policy |
| ACLs indexed beside chunks | **ADOPT** | Inherit and verify ACL on every chunk; freshness SLO |
| Application-side string security filter | **ADAPT** | Useful portability fallback, but identity resolution must be trusted and fail closed |
| Scheduled pull plus push for strict freshness | **ADOPT** | CDC/push primary where available; crawlers as bounded adapters |
| Search units coupling replicas and partitions | **REJECT** | Independently scale ingestion, lexical, vector, and rerank tiers where practical |
| Rebuild from source instead of index backup as primary recovery | **ADOPT** | Still export schemas/manifests for faster DR |
| Single-region service with customer-built DR | **ADAPT** | Make multi-region index generation and failover part of owned operations |

## 11. Unknowns and verification plan

### Material unknowns

1. Exact shard/partition/replica placement, shard count policy, routing, and rebalance algorithm.
2. Refresh interval and consistency guarantees for push writes, deletes, and replica propagation.
3. HNSW implementation details beyond exposed parameters; graph rebuild/merge policy and concurrent update semantics.
4. Exact BM25 parameters/default similarity version and whether any global-statistics option exists in current APIs.
5. Semantic ranker architecture, training corpus details beyond “adapted from Bing,” model version, rollout policy, and deterministic behavior.
6. Exact semantic pricing and dedicated SU dollar rates for a chosen region/agreement; static pricing output redacted amounts.
7. End-to-end ACL revocation latency distributions and fail-open/fail-closed behavior during identity/provider outages.
8. Production p50/p95/p99 latency and QPS by tier, corpus, filter selectivity, vector dimension, and candidate depth.
9. Whether classic query APIs expose stable source-span offsets sufficient for citations without storing them explicitly.

### Checks that would require separate caller authority

No live checks were performed. A future, separately authorized evaluation could use a free or approved test subscription to run a fixed corpus and verify score stability, visibility lag, ACL revocation, ANN recall, filter underfill, merge latency, and actual pricing. That is outside this research frame because the caller prohibited credentials and paid deployment.

## 12. Bounded curiosity pass

After synthesis, remaining gaps were scored 1–5 on relevance (R), decision value (V), novelty (N), and investigation cost (C); priority is `R + V + N - C`.

| Thread | R | V | N | C | Priority | Outcome |
|---|---:|---:|---:|---:|---:|---|
| Vector filter placement and shard semantics | 5 | 5 | 4 | 1 | 13 | **Pursued** via current filter documentation; materially changed authorization recommendation. [S10] |
| ACL synchronization versus query token enforcement | 5 | 5 | 4 | 2 | 12 | **Pursued**; established that indexed permission freshness is the limiting control. [S12] |
| Citations versus semantic answers | 5 | 5 | 3 | 1 | 12 | **Pursued**; separated classic extractive answers from agentic reference/synthesis APIs. [S19][S20] |
| Shard-local BM25 and replica consistency | 4 | 4 | 4 | 1 | 11 | **Pursued**; supported scatter/gather and asynchronous-view inference. [S2][S22] |
| Exact regional prices | 3 | 3 | 1 | 4 | 3 | **CURIOSITY_NO_GO** — static pricing page redacted values and actual amounts depend on region/agreement; calculator/account access was out of frame. |
| Private semantic model internals | 3 | 2 | 4 | 5 | 4 | **CURIOSITY_NO_GO** — unpublished and not clean-room observable without prohibited access; interface behavior is sufficient for the decision. |
| Benchmarking Azure against Curiosity corpus | 5 | 5 | 3 | 5 | 8 | **CURIOSITY_NO_GO** — would require deployment, credentials, and a declared evaluation dataset; explicitly prohibited. |
| Agentic medium-reasoning implementation details | 2 | 2 | 4 | 4 | 4 | **CURIOSITY_NO_GO** — peripheral to the owned core retrieval stack and preview behavior is volatile. |

**Stop reason:** Coverage reached all caller-specified domains; additional high-value threads require live service access or unpublished internals. Source review had reached saturation on the central staged-retrieval architecture.

## Sources

All sources are Microsoft primary documentation or pricing pages, accessed **2026-08-17**.

1. **[S1]** Microsoft Learn, “Search Index Overview — Azure AI Search.” https://learn.microsoft.com/en-us/azure/search/search-what-is-an-index
2. **[S2]** Microsoft Learn, “Full-Text Search — Azure AI Search.” https://learn.microsoft.com/en-us/azure/search/search-lucene-query-architecture
3. **[S3]** Microsoft Learn, “Vector Search Ranking” and “Create a Vector Index.” https://learn.microsoft.com/en-us/azure/search/vector-search-ranking ; https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-create-index
4. **[S4]** Microsoft Learn, “Compress Vectors Using Quantization.” https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-quantization
5. **[S5]** Microsoft Learn, “OData Filter Reference.” https://learn.microsoft.com/en-us/azure/search/search-query-odata-filter
6. **[S6]** Microsoft Learn, “Indexer Overview.” https://learn.microsoft.com/en-us/azure/search/search-indexer-overview
7. **[S7]** Microsoft Learn, “Semantic Ranking Overview.” https://learn.microsoft.com/en-us/azure/search/semantic-search-overview
8. **[S8]** Microsoft Learn, “Hybrid Search Overview” and “Create a Hybrid Query.” https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview ; https://learn.microsoft.com/en-us/azure/search/hybrid-search-how-to-query
9. **[S9]** Microsoft Learn, “Hybrid Search Scoring (RRF).” https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking
10. **[S10]** Microsoft Learn, “Vector Query Filters.” https://learn.microsoft.com/en-us/azure/search/vector-search-filters
11. **[S11]** Microsoft Learn, “Security Filter Pattern.” https://learn.microsoft.com/en-us/azure/search/search-security-trimming-for-azure-search
12. **[S12]** Microsoft Learn, “Document-Level Access Control.” https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview
13. **[S13]** Microsoft Learn, “Service Limits for Tiers and SKUs.” https://learn.microsoft.com/en-us/azure/search/search-limits-quotas-capacity
14. **[S14]** Microsoft Learn, “Schedule Indexer Execution.” https://learn.microsoft.com/en-us/azure/search/search-howto-schedule-indexers
15. **[S15]** Microsoft Learn, “Vector Index Limits.” https://learn.microsoft.com/en-us/azure/search/vector-search-index-size
16. **[S16]** Microsoft Learn, “Integrated Vectorization Overview.” https://learn.microsoft.com/en-us/azure/search/vector-search-integrated-vectorization
17. **[S17]** Microsoft Learn, “Relevance and Ranking Overview.” https://learn.microsoft.com/en-us/azure/search/search-relevance-overview
18. **[S18]** Microsoft Learn, “Connect Using Azure Roles.” https://learn.microsoft.com/en-us/azure/search/search-security-rbac
19. **[S19]** Microsoft Learn, “Return a Semantic Answer.” https://learn.microsoft.com/en-us/azure/search/semantic-answers
20. **[S20]** Microsoft Learn, “Query Knowledge Base via API or MCP.” https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-retrieve
21. **[S21]** Microsoft Learn, “Analyze Performance — Azure AI Search.” https://learn.microsoft.com/en-us/azure/search/search-performance-analysis
22. **[S22]** Microsoft Learn, “Reliability in Azure AI Search.” https://learn.microsoft.com/en-us/azure/reliability/reliability-ai-search
23. **[S23]** Microsoft Azure, “Foundry IQ (Azure AI Search) pricing.” https://azure.microsoft.com/en-us/pricing/details/search/
24. **[S24]** Microsoft Learn, “Choose a pricing model and service tier.” https://learn.microsoft.com/en-us/azure/search/search-sku-tier
25. **[S25]** Microsoft Learn, “Data, Privacy, and Built-in Protections.” https://learn.microsoft.com/en-us/azure/search/search-security-built-in
26. **[S26]** Microsoft Learn, “Configure Customer-Managed Keys for Azure AI Search.” https://learn.microsoft.com/en-us/azure/search/search-security-manage-encryption-keys
27. **[S27]** Microsoft Learn, “Indexer Access to Protected Resources.” https://learn.microsoft.com/en-us/azure/search/search-indexer-securing-resources

## Confidence summary

- **High:** public schema, query parameters, algorithms named by Microsoft, documented limits, filter ordering, indexer schedules, semantic candidate/input bounds, ACL synchronization model, capacity formula, and SLA prerequisites.
- **Medium:** reconstructed component boundaries, shard coordinator behavior beyond explicitly described merge steps, replica/partition physical mapping, and semantic service isolation.
- **Low / unknown:** proprietary model internals, undocumented latency/QPS, exact current regional prices, consistency distributions, and operational implementation details not exposed by public contracts.
