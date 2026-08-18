# Apache Solr as a distributed search server

**Research status:** clean-room architecture study; no Solr source code copied.  
**Source access date:** 2026-08-17.  
**Version baseline:** Apache Solr 10.0, the version selected by the official `latest` Reference Guide on the access date. Version-sensitive findings are not assumed to hold for Solr 9 or a later 10.x release without re-checking. [S1]  
**Decision frame:** Which Solr design ideas should Curiosity adopt, adapt, reject, or defer for a bounded, provider-neutral search and retrieval architecture?  
**In scope:** schema and update processing; collections, shards, replicas and routing; caches and facets; distributed query; lexical ranking, LTR and vector search; snapshots, backup and recovery; operations and security; licensing and clean-room lessons.  
**Out of scope:** API-by-API compatibility, source-level reimplementation, benchmark claims, deployment sizing, and choosing Solr itself as Curiosity's production engine.

## Executive verdict

Solr is best understood not as “Lucene over HTTP,” but as a control plane plus a data plane around immutable Lucene index views. ZooKeeper-backed cluster metadata, shard leaders, replica-local indexes, distributed update processing, scatter/gather query coordination, searcher-scoped caches, commit points, transaction logs, and pluggable ranking all meet at explicit consistency and failure boundaries. That separation is the main transferable lesson.

| Verdict | Curiosity decision | Why |
|---|---|---|
| **ADOPT** | Explicit query completeness metadata (`complete`, failed partitions, stale-control-plane indication) | Solr distinguishes hard failure, partial results, and disconnected cluster metadata through `shards.tolerant`, `partialResults`, and `zkConnected`. Silent incompleteness is unsafe for retrieval. [S6] |
| **ADOPT** | Stable document identity and deterministic partition routing | Solr routes each document to exactly one shard and supports route-aware queries. Determinism makes retries, locality and recovery tractable. [S5] |
| **ADOPT** | Separate durability, visibility and backup watermarks | Hard commit, soft commit and backup inclusion are distinct in Solr. Curiosity should name these states rather than expose one ambiguous “indexed” flag. [S12][S13] |
| **ADOPT** | Bounded two-stage retrieval with first-pass candidates and optional reranking | Solr’s LTR module reranks only the top N and reverts reranking when query limits are exceeded. This is a strong bounded-computation pattern. [S10] |
| **ADOPT** | Structured aggregation tree with explicit approximation/refinement metadata | JSON Facet supports nested buckets, metrics, distributed over-request and a refinement phase. [S8] |
| **ADAPT** | Update-processor chain as a provider-neutral ingestion pipeline | Preserve ordered transform/validate/route/persist stages, but do not expose arbitrary runtime plugins or request-selected chains to untrusted callers. [S4] |
| **ADAPT** | Replica preferences and cache-affinity hints | Stable routing can improve cache use, but must remain a hint behind health, tenant isolation and load balancing. [S6] |
| **ADAPT** | Searcher-generation cache lifecycle | Tie cache keys to immutable index/provider generations and warm selectively; avoid copying Solr’s JVM-local cache catalogue literally. [S7] |
| **ADAPT** | Transaction-log recovery and achieved replication acknowledgement | Curiosity needs durable ingestion acknowledgements and degraded-write evidence, but its contract should state the required durability policy rather than call a leader-only write an unconditional success. [S11] |
| **REJECT** | Returning partial distributed results without an explicit caller policy | Solr defaults to failure, while opt-in tolerance marks partial results. Curiosity should retain that fail-closed default. [S6] |
| **REJECT** | Treating an in-place snapshot as disaster recovery | Solr explicitly distinguishes a snapshot (pins files in the same index directory) from a backup (copies to a repository). [S12] |
| **REJECT** | Public exposure of the search/admin server | Solr states that no API, including Admin UI, is designed for untrusted parties and recommends firewall protection. [S14] |
| **DEFER** | Solr-compatible query syntax, plugin ABI, LTR model store, HNSW tuning, and GPU indexing | These are implementation commitments, not provider-neutral contracts. Validate against Curiosity workloads first. |

**Overall confidence: high** for documented Solr 10.0 behavior; **medium** for Curiosity implications, which are architectural inferences requiring workload validation.

## 1. System model and invariants

### 1.1 Logical and physical shape

**FACT — high confidence.** A collection is logically partitioned into shards; every document belongs to exactly one shard. Each shard has one or more physical replicas and exactly one leader at a time. A node receiving an update determines the shard and forwards the update to that shard’s leader; the leader applies and forwards the update to replicas. Leader election is coordinated through ZooKeeper. [S5]

**FACT — high confidence.** SolrCloud offers three replica modes: NRT replicas index locally and maintain a transaction log; TLOG replicas maintain the log but normally obtain index changes by replication; PULL replicas neither maintain a transaction log nor participate in leader election and only replicate an index from a leader. NRT and TLOG replicas are leader-eligible; PULL replicas are not. Only NRT replicas support soft commits. [S5]

**INFERENCE — high confidence.** Solr separates three concerns often collapsed into “replication”: accepting writes, being electable for write leadership, and serving reads. Curiosity should model provider capabilities on these independent axes. A replica/provider endpoint can be readable but stale, durable but not searchable yet, or searchable but ineligible to coordinate writes.

**RECOMMENDATION — high confidence.** Curiosity’s internal topology vocabulary should minimally include:

- logical corpus/index;
- deterministic partition;
- physical copy or provider endpoint;
- coordinator;
- write authority;
- health and freshness watermark;
- durability/visibility capability.

Do not put Solr-specific names (`collection`, `core`, `NRT`, `TLOG`) in the provider-neutral contract.

### 1.2 Control plane versus data plane

**FACT — high confidence.** SolrCloud uses ZooKeeper for cluster state and leader election. A query coordinator may continue serving from its known topology while disconnected from ZooKeeper, but reports `zkConnected=false`; callers can require current ZooKeeper connectivity and fail instead. [S5][S6]

**INFERENCE — high confidence.** Control-plane freshness is part of result correctness. Data-plane reachability alone cannot prove that every current partition was queried.

**RECOMMENDATION — high confidence.** Every Curiosity distributed response should carry a bounded evidence envelope: topology/version observed, partitions planned, partitions completed, partition failures, provider timeouts, and whether control-plane state was authoritative. This belongs in the neutral response, not hidden in adapter logs.

## 2. Schema and update chain

### 2.1 Schema as executable retrieval policy

**FACT — high confidence.** Solr schemas define field types, concrete fields, dynamic fields, copy fields, a unique key and similarity policy. Managed schemas are changed through the Schema API; classic schemas are edited as configuration. SolrCloud schema/configuration may live in ZooKeeper rather than local files. The default schema-level behavior permits per-field-type similarity and falls back to BM25. [S2]

**FACT — high confidence.** Field definitions govern indexing, storage, analysis and DocValues behavior. The unique key is expected for updates, must be single-valued and non-analyzed, and cannot be populated by schema defaults or copy fields. [S2]

**INFERENCE — high confidence.** A schema is not merely type validation. It fixes tokenization, retrieval representation, aggregation eligibility, update identity and ranking semantics. Schema changes can therefore change meaning even when documents remain syntactically valid.

**RECOMMENDATION — high confidence.** Curiosity should version an immutable **retrieval schema generation** comprising:

1. canonical source/document identity;
2. normalized fields and cardinality;
3. analysis/tokenization profile;
4. lexical/vector representations;
5. filter/sort/facet eligibility;
6. provenance and access-control fields;
7. ranking profile compatibility.

Adapters may translate that generation into provider schemas. They must report unsupported or lossy mappings; “schemaless” inference must never silently widen the neutral contract.

### 2.2 Ordered update processors

**FACT — high confidence.** Every Solr update passes through an ordered Update Request Processor (URP) chain. Processors may mutate fields, add defaults, validate, discard an update, short-circuit the chain or throw. The default chain logs, distributes to the correct shard/replicas in SolrCloud, then executes the local update. [S4]

**FACT — high confidence.** Placement around the distributed processor matters. Pre-processors run once on the first receiving node; post-processors run on the leader and replicas. During recovery, buffered updates are replayed without custom post-processors, and the Solr guide advises avoiding custom post-processors because of this documented gap. Atomic updates are expanded to full documents by the distributed processor on the leader, so pre-processors may see only a partial document. [S4]

**INFERENCE — high confidence.** A distributed transformation cannot be classified only by function; its execution location and replay semantics are correctness properties. Non-deterministic or non-idempotent transformations after fan-out can cause replica divergence. Transformations that require the full document cannot safely execute before materialization.

**RECOMMENDATION — high confidence.** Curiosity should use a fixed, reviewable ingestion state machine:

`decode → bound size/count → authenticate/authorize → normalize → validate schema → assign identity/version → enrich deterministically → choose partition/provider → durable append → materialize index → acknowledge`.

For each stage record: input shape, full-versus-patch requirement, determinism, idempotency key, side effects, replay behavior, failure class, and whether it executes once or per copy. Runtime caller-selected processors are **REJECTED** for the public contract because they expand the attack surface and defeat reproducibility.

### 2.3 Commits, visibility and transaction logs

**FACT — high confidence.** A hard commit fsyncs index files to stable storage, closes the current transaction log and may open a new searcher. A soft commit makes changes searchable without fsyncing index files or rotating the transaction log. Automatic hard and soft commit intervals can be configured independently. Transaction logs record updates since the previous hard commit and are replayed after an ungraceful shutdown. [S13]

**FACT — high confidence.** SolrCloud recommends server-side commit policy rather than indexing clients issuing explicit commits. Search visibility after soft commits is roughly synchronized, not guaranteed across replicas; successive reads routed to different replicas may briefly disagree. [S5]

**INFERENCE — high confidence.** “The update succeeded” is underspecified. At least four milestones exist: accepted, durably journaled, materialized, and visible to the querying generation. A fifth milestone—captured by a recoverable backup—lags them.

**RECOMMENDATION — high confidence.** Curiosity write receipts should expose monotonic watermarks rather than a boolean. Suggested fields: `accepted_version`, `durable_version`, `visible_version`, `replicated_copies`, `backup_generation`, and the policy actually satisfied. Read-your-write behavior, if offered, should route or wait against a receipt watermark within a strict deadline.

## 3. Collections, shards, replicas and routing

### 3.1 Deterministic placement

**FACT — high confidence.** Solr’s default `compositeId` router hashes the unique key, optionally using a prefix before `!` to co-locate related documents. `_route_` can restrict a query to the shard range for one or more route keys. A route key can reserve only part of the hash bits, spreading a hot tenant over a fraction of shards. The `implicit` router instead allows explicit shard choice, optionally from a configured field. [S5]

**INFERENCE — high confidence.** Routing is simultaneously a correctness rule, a locality optimization, a multi-tenant isolation lever and a future resharding constraint. Query fan-out is reduced only when the caller and document placement share the same route semantics.

**RECOMMENDATION — high confidence.** Curiosity should define a versioned routing function over stable identity plus an optional locality key. The routing version must be persisted with each item and query plan. Hot-key splitting should use virtual buckets or controlled hash-bit expansion rather than embedding physical shard names into external IDs.

### 3.2 Shard count and splitting

**FACT — high confidence.** Solr collections start with a chosen shard count. Solr can split a shard into two new shards while retaining the original until operators remove it, temporarily duplicating data. [S5]

**INFERENCE — medium confidence.** Online split-by-copy is operationally simple but creates temporary storage amplification and a cutover problem. It also illustrates why logical partition IDs must outlive physical copies.

**RECOMMENDATION — medium confidence.** Curiosity should keep routing indirection between virtual partition and provider-specific physical shard. Resharding needs an explicit state machine (`copying`, `dual-read/check`, `cutover`, `retired`) and generation fencing; do not rely on mutable hash modulo alone.

### 3.3 Write acknowledgement and degraded replication

**FACT — high confidence.** Solr may return a successful update when the shard leader accepted it but some replicas did not. The response includes achieved replication factor `rf`, defined for a multi-shard request as the minimum achieved factor across shards. Missed replicas recover later. [S11]

**INFERENCE — high confidence.** Transport success and durability-policy success are distinct. The minimum across shards is safe as a compact lower bound but loses per-partition detail.

**RECOMMENDATION — high confidence.** Curiosity should fail the requested durability policy if the achieved copies fall short, while optionally returning a typed “accepted-degraded” receipt for explicit caller workflows. Preserve per-partition outcomes internally and expose them to privileged diagnostics.

## 4. Query execution, caches and facets

### 4.1 Scatter/gather and phases

**FACT — high confidence.** Any suitable Solr node can coordinate a distributed query. It selects one replica per relevant shard, sends internal requests, merges responses, and may issue subsequent requests for stored fields or facet refinement. The normal result-fetch path can be two-phase; `distrib.singlePass` can fetch stored fields during the first phase, trading fewer round trips for potentially more network transfer. [S6]

**FACT — high confidence.** A complete response requires at least one reachable replica of each relevant shard. Default behavior is to fail if any required shard is unavailable. With `shards.tolerant=true`, Solr may return partial results and marks them with `partialResults`; shard details can also be requested. [S6]

**FACT — high confidence.** Distributed lexical scoring may use local shard statistics by default or fetch exact/global document frequencies through alternative stats caches. Global statistics improve cross-shard score comparability but add distributed work. [S6]

**INFERENCE — high confidence.** Distributed search is a protocol, not one request: plan, candidate retrieval, merge, optional statistics exchange, optional refinement, materialization, response. Each phase needs its own budget and failure semantics. Scores from heterogeneous providers or shards are not naturally comparable merely because they are floating-point numbers.

**RECOMMENDATION — high confidence.** Curiosity should make the coordinator phase graph explicit and bounded:

1. validate and normalize request;
2. select providers/partitions from an authoritative snapshot;
3. retrieve bounded candidates per source;
4. normalize or rank-fuse with declared semantics;
5. optionally refine/rehydrate only selected IDs;
6. return completeness, timing and truncation evidence.

Do not promise globally meaningful raw scores across providers. Prefer rank fusion or calibrated scores tied to a ranking-profile version.

### 4.2 Replica choice and cache affinity

**FACT — high confidence.** Solr can prefer replicas by type, location, leader status or node property. Its default random fallback balances traffic but can reduce cache reuse. Stable hash-based preference can route equivalent queries consistently. The guide warns that locality preferences may create hotspots unless requests are load-balanced across the cluster. [S6]

**INFERENCE — high confidence.** Cache affinity and load distribution oppose each other. Stable routing is useful only inside a health-aware, bounded-load policy.

**RECOMMENDATION — high confidence.** Adapt stable routing as a soft preference keyed by tenant plus normalized query class, with health, circuit state and fairness overriding affinity. Never let user-controlled query text alone determine a permanent hotspot.

### 4.3 Searcher-scoped caches

**FACT — high confidence.** Solr caches belong to an immutable Index Searcher view. Opening a new searcher creates new caches; the old searcher continues serving in-flight requests while selected entries warm the new caches. Solr provides filter, query-result and stored-document caches, plus user-defined caches. Caffeine/W-TinyLFU is the documented default implementation. [S7]

**FACT — high confidence.** Filter cache entries map parsed filters to matching document sets; query-result entries contain ordered document IDs for query/sort/window; document cache entries hold stored fields and cannot be autowarmed because Lucene document IDs are transient. Commits that open searchers invalidate generation-bound caches. Very frequent soft commits can make caching and warming counterproductive. [S7][S13]

**INFERENCE — high confidence.** Correct invalidation is cheap when cache entries are immutable-generation-scoped. Warming is speculative resource allocation and must be measured, not assumed beneficial.

**RECOMMENDATION — high confidence.** Curiosity cache keys should include provider, corpus, schema/ranking version, index generation, normalized request, authorization scope and output projection. Never share cached results across principals unless the authorization equivalence is proven. Bound entries by byte size as well as count; track hit ratio, eviction, fill cost, stale-generation retention and tenant distribution.

### 4.4 Facets and distributed refinement

**FACT — high confidence.** Solr’s JSON Facet API models terms/range/query/heatmap buckets, nested sub-facets and metric functions. In distributed terms facets, shards can over-request candidate buckets; `refine=true` triggers a second phase so every shard contributes to final returned buckets and nested metrics. Some analytics are explicitly estimates, including high-cardinality `unique`; HLL and t-digest are offered for cardinality and percentiles. [S8]

**INFERENCE — high confidence.** Aggregation correctness has dimensions: bucket-candidate completeness, per-bucket count refinement, and metric exactness. A single `exact=true` flag is insufficient.

**RECOMMENDATION — high confidence.** Curiosity’s provider-neutral aggregation contract should be an expression tree with strict maximum depth, bucket count, cardinality work and refinement rounds. Responses should annotate each metric as exact, refined, sampled, estimated or truncated, including algorithm/error metadata when available. Treat facet labels and provider values as untrusted output.

## 5. Ranking, LTR and vector retrieval

### 5.1 Lexical ranking

**FACT — high confidence.** Solr defaults to BM25 for field types without an explicit similarity and allows field-type-specific similarity implementations. Distributed scoring can use shard-local or exact/global term statistics. [S2][S6]

**INFERENCE — high confidence.** Ranking configuration is schema-coupled and distributed-statistics-coupled. A ranking-profile change can invalidate score calibration, caches and offline judgments without altering query syntax.

**RECOMMENDATION — high confidence.** Curiosity should version ranking profiles independently but declare compatible schema generations. Preserve component scores and profile version for evaluation, not necessarily in the public response.

### 5.2 Learning to Rank

**FACT — high confidence.** Solr LTR is an optional module. It computes features, logs feature vectors, stores feature definitions and trained models, and reranks a bounded top-N candidate set. Model training occurs outside Solr. Supported documented model families include linear, additive trees and neural-network forms, plus extensions. Feature and model stores are managed resources and require collection/core reload before changes become active. [S10]

**FACT — high confidence.** Solr LTR accepts external feature information from the request. If a query CPU/time limit is exceeded during reranking, Solr aborts and fully reverts reranking, returns the original ranking, and marks the response partial with details. Team-draft interleaving is supported, but the guide notes its implementation assumes results from one shard. [S10]

**INFERENCE — high confidence.** LTR’s transferable architecture is not its model JSON. It is the separation of candidate generation, deterministic feature computation, offline training, versioned model activation, bounded reranking and fallback.

**RECOMMENDATION — high confidence.** Adopt those stages with these additional controls:

- allowlisted, typed external features only; never interpolate arbitrary caller text into provider query templates;
- model, feature-set and normalization versions in every evaluation record;
- maximum candidates, features, evaluation time and memory;
- atomic model activation and rollback;
- fallback to the untouched first-pass order on rerank failure;
- shadow/interleaving experiments only with consent, isolation and auditable assignment.

### 5.3 Dense vectors and hybrid retrieval

**FACT — high confidence.** Solr supports dense vector fields with fixed dimension and Euclidean, dot-product or cosine similarity; vectors can be float or byte encoded. It uses Lucene’s HNSW-based approximate nearest-neighbor search. Scalar and binary quantized field types trade precision for memory. Text embeddings are normally generated outside Solr, though Solr 10 also documents an experimental text-to-vector path. [S9]

**FACT — high confidence.** Solr exposes top-K and threshold vector queries, graph pre-filtering, optional lexical seeding, approximate-search tuning and vector queries as rerankers. The guide warns that vector reranking currently executes kNN against the whole index and only contributes a second-pass score when a first-pass document is in the global top K. GPU graph construction and in-Solr text encoding are documented as experimental. [S9]

**INFERENCE — high confidence.** Vector retrieval adds a model/schema/index compatibility triple: dimension and metric, embedding model/version, and graph/quantization parameters. Filtering semantics materially affect both recall and cost. Hybrid search is not simply adding lexical and vector scores because their scales and candidate universes differ.

**RECOMMENDATION — high confidence.** Curiosity should keep embedding generation behind a provider-neutral representation contract: `model_id`, `model_version`, `dimension`, `normalization`, `metric`, `content_hash`, and safety/provenance metadata. Use bounded candidate union plus rank fusion as the default hybrid design. Defer score addition until calibrated on judgments. Make pre-filter versus post-filter explicit, especially for access control: authorization filters must never be post-filtered after unauthorized content has been returned to the coordinator.

## 6. Snapshots, backup and recovery

### 6.1 Snapshot is not backup

**FACT — high confidence.** Solr snapshots pin a named index commit’s files in the same index directory; they do not copy those files elsewhere. Backups copy hard-committed index data and configuration to a backup repository. Soft-committed, searchable changes may be absent from a backup; hard-committed changes with no newly opened searcher may be in backup while not yet query-visible. [S12]

**RECOMMENDATION — high confidence.** Use separate terms in Curiosity:

- **checkpoint:** immutable local/provider generation reference;
- **backup:** independently stored recoverable copy;
- **restore:** construction of a new serving generation from backup;
- **recovery:** bringing a failed copy current from a live authority/journal.

Never report checkpoint creation as disaster-recovery success.

### 6.2 Backup repositories and restore

**FACT — high confidence.** SolrCloud backup/restore operates across collection shards and can restore topology. Solr 10 documents local/shared filesystem, Google Cloud Storage and Amazon S3 repository implementations plus a plugin abstraction. Index checksums are verified by default before copying. Backup APIs list and delete backup points; backup and restore are asynchronous. [S12]

**INFERENCE — high confidence.** A repository abstraction is useful, but backup correctness depends on commit selection, configuration capture, integrity verification, credential isolation, retention and restore testing—not merely successful object upload.

**RECOMMENDATION — high confidence.** Curiosity backup manifests should include corpus/schema/routing/ranking versions, per-partition generation and checksum, creation watermark, repository object IDs, encryption/key reference, software compatibility range and completion state. Publish a backup only after every required partition and manifest checksum succeeds. Restore into a new generation, verify counts/checksums and sampled queries, then switch atomically.

### 6.3 Replica recovery

**FACT — high confidence.** Solr replicas recover from leaders using transaction logs and index replication. A candidate leader first synchronizes against peers; replicas too far behind require full replication/replay recovery. PULL replicas can continue querying an existing local index during some leader/network failures, but a restarting PULL replica normally remains unavailable until initial recovery from a current leader. [S5][S11]

**INFERENCE — high confidence.** Availability can mean “serve last known data” or “serve only proven-current data.” Those are policy choices, not universally correct behavior.

**RECOMMENDATION — high confidence.** Curiosity should attach freshness watermarks to serving copies and let the request policy choose a maximum staleness bound. A stale copy may serve only when the caller explicitly permits it and the response labels the watermark.

## 7. Operations and security

### 7.1 Observability and overload

**FACT — high confidence.** Solr 10 exposes Prometheus/OpenMetrics pull metrics and optional OTLP push metrics, grouped at node, core, JVM and Overseer scopes. Core metrics carry collection, shard and replica-type labels. Solr 10 labels its redesigned metrics beta. [S15]

**FACT — high confidence.** Circuit breakers can reject query/update requests with HTTP 429 based on heap, CPU or load average; they can run warn-only. Solr notes that breakers are checked on the initial coordinator, not inter-node requests. Rate limiting is JVM-level and currently only recognizes requests carrying the `Solr-Request-Type: QUERY` header; requests without it bypass that limiter. [S16][S17]

**INFERENCE — high confidence.** Coordinator-only admission control cannot bound downstream fan-out. Header-selected limits are unsafe as a trust boundary. Distributed work needs budgets propagated and enforced at every hop.

**RECOMMENDATION — high confidence.** Curiosity should derive request class server-side after authentication, then enforce hierarchical limits: global, tenant, provider, query class and internal fan-out. Propagate a signed/opaque deadline and remaining work budget to adapters. Bound shards/providers, candidates, bytes, facet buckets, vector operations and retries. Return typed overload responses with retry guidance; use jittered exponential backoff only for idempotent operations.

**RECOMMENDATION — high confidence.** Minimum telemetry dimensions: request ID/trace, tenant (privacy-safe), provider, corpus, partition, phase, ranking profile, cache outcome, completeness, timeout/cancellation, candidate counts, returned bytes, retry count, and circuit decision. Keep high-cardinality raw query/content out of metrics and logs.

### 7.2 Security boundary

**FACT — high confidence.** The Solr security guide states that no Solr API, including Admin UI, is designed for untrusted exposure. It recommends a firewall and minimal network binding. Solr supports TLS, Basic/JWT/certificate authentication, rule-based authorization, audit logging, IP allow/deny lists, and ZooKeeper ACL protection. [S14]

**INFERENCE — high confidence.** Solr’s extensive query syntax, configuration APIs, plugin surfaces and admin endpoints assume a trusted service perimeter. A Curiosity adapter must not become a transparent public Solr proxy.

**RECOMMENDATION — high confidence.** Curiosity must terminate authentication at its own narrow API; authorize before query planning; compile a typed neutral query AST into Solr/provider requests; reject raw local-parameter/query fragments; separate data and administration planes; use least-privilege service identities; encrypt inter-node and backup traffic; protect cluster metadata; and audit configuration/model/schema changes. Search results, facet labels, highlights and provider errors remain untrusted external data and require output encoding and size bounds.

### 7.3 Operational checks before production use

1. Failure drill: lose coordinator, leader, replica, provider and control-plane connectivity independently.
2. Consistency drill: verify read-after-write, replica switch and soft/hard visibility bounds.
3. Backup drill: restore into an empty environment and compare manifests plus sampled queries.
4. Overload drill: prove cancellation reaches every fan-out and late responses are discarded.
5. Security drill: verify no raw provider syntax, admin endpoint or credential leaks through the adapter.
6. Relevance drill: evaluate lexical, vector and fused profiles on versioned judgments.
7. Cache drill: measure warming cost, authorization isolation and generation retirement.

## 8. License and clean-room lessons

### 8.1 License facts

**FACT — high confidence.** The Solr 10.0 distribution’s `LICENSE.txt` begins with Apache License 2.0 and also records separately licensed bundled material. Its `NOTICE.txt` attributes Apache Solr to the Apache Software Foundation and lists Apache Lucene and numerous third-party works. Apache License 2.0 grants copyright and patent rights subject to conditions; redistribution requires the license, change notices for modified files, retention of relevant notices, and propagation of applicable NOTICE attributions. The license does not grant trademark rights beyond reasonable descriptive use. [S18][S19][S20]

**RECOMMENDATION — high confidence.** Architectural ideas and independently expressed behavior descriptions may be studied clean-room, but copied code, tests, configuration, documentation prose or bundled assets trigger attribution/license review. If Curiosity ever embeds or distributes Solr, Lucene, an adapter derived from Solr code, or Solr configuration/assets, legal review must inspect the exact artifact’s `LICENSE`, `NOTICE` and dependency inventory. This document is not legal advice.

### 8.2 Clean-room record

- Inputs were public official documentation and the official Solr release `LICENSE.txt`/`NOTICE.txt`, accessed read-only.
- No Solr source implementation was inspected for this study; documentation “Edit this Page” links were not followed into implementation code.
- No code, test, configuration block or API payload was copied into Curiosity. Names are used only where necessary to identify documented concepts.
- Curiosity recommendations are newly expressed, provider-neutral abstractions rather than Solr API compatibility requirements.
- Trademark: use “Apache Solr” only descriptively; do not imply ASF endorsement. [S20]

**INFERENCE — high confidence.** Apache-2.0 is permissive, but “permissive” does not mean attribution-free, dependency-free or trademark-free. The release NOTICE demonstrates that the binary product is a composite whose obligations cannot be inferred from the top-level license alone. [S18][S19]

## 9. Unknowns and verification plan

| Unknown / boundary | Confidence impact | Required check before adoption |
|---|---|---|
| Curiosity corpus size, update rate, query mix and latency SLOs are not specified. | Limits cache, sharding and vector recommendations to patterns, not sizing. | Replay production-shaped traces in a disposable benchmark; measure p50/p95/p99, fan-out, memory and recovery. |
| Provider-neutral score comparability is unresolved. | High risk for naïve score merging. | Build judged datasets; compare reciprocal-rank fusion, weighted fusion and calibrated scoring. |
| Solr 10 metrics are documented beta. | Metric names/contracts may change in minor releases. | Pin exact Solr version and test dashboards/alerts during upgrade rehearsal. [S15] |
| Snapshot/backup repository guarantees vary by backend. | Object-store consistency, encryption and retention behavior are deployment-specific. | Validate manifest atomicity, checksum failures, interrupted uploads and cross-account restore. |
| LTR interleaving’s documented single-shard assumption limits distributed evaluation. | Online evaluation semantics may not generalize. | Use coordinator-owned experiment assignment and offline replay before any cross-provider interleaving. [S10] |
| Vector recall/latency and quantization loss are corpus-specific. | Cannot select HNSW/quantization settings from documentation. | Measure recall@K against exact neighbors and end-to-end relevance under filters. |
| Exact semantics of schema/config propagation during concurrent writes were not exhaustively traced. | Potential mixed-generation indexing risk. | Test gated schema rollout, reject mixed generation, and reindex rollback. |
| Solr documentation contains a persistent warning that recovery replay skips custom URP post-processors. | Confirms a known edge but not whether all future 10.x versions retain it. | Re-check issue/release notes for the pinned deployment version; Curiosity design should avoid relying on this behavior regardless. [S4] |
| No source-level inspection was performed. | Internal algorithms beyond documented contracts remain unknown by design. | If an interoperability requirement emerges, open a separately authorized, license-reviewed clean-room protocol study. |

## 10. Bounded curiosity pass

Budget: one pass after synthesis; pursue only gaps scoring highest on **relevance (R), decision value (V), novelty (N), and cost (C, lower is better)**, each 1–5.

| Thread | R/V/N/C | Action | Result |
|---|---:|---|---|
| Solr 10 overload controls may undermine bounded behavior | 5/5/4/1 | **Pursued** via official circuit-breaker and rate-limiter guides | Found coordinator-only breaker checks and header/JVM-scoped rate-limit limitations; strengthened per-hop, server-classified budget recommendation. [S16][S17] |
| Solr 10 observability contract stability | 4/4/3/1 | **Pursued** via official metrics guide | Metrics redesign is beta; added version-pin/upgrade check. [S15] |
| Distribution license composition | 5/5/3/1 | **Pursued** via official release LICENSE/NOTICE | Confirmed Apache-2.0 top-level terms plus composite notices; strengthened artifact-specific review. [S18][S19] |
| Exact HNSW implementation internals | 3/2/2/5 | **CURIOSITY_NO_GO** | Source inspection would exceed the clean-room/documented-contract frame and would not change the neutral decision. |
| ZooKeeper protocol and Overseer internals | 3/2/2/5 | **CURIOSITY_NO_GO** | Solr control-plane behavior is sufficiently covered for the decision; protocol replication is out of scope. |
| Comparative benchmarks versus Elasticsearch/OpenSearch/Vespa | 3/3/4/5 | **CURIOSITY_NO_GO** | No caller authority for a product bake-off; third-party benchmarks would not answer Curiosity workload fit. |
| Security CVE history | 4/3/3/4 | **CURIOSITY_NO_GO** | Valuable for choosing a deployment, but the declared task is architecture reverse engineering, not product risk acceptance. |
| Solr Operator/Kubernetes mechanics | 2/2/2/4 | **CURIOSITY_NO_GO** | Deployment adapter details do not affect provider-neutral retrieval contracts. |

**Stop condition:** coverage reached for every requested topic; the final three pursued threads produced one material boundedness finding and then saturated. Further work would require workload data, source-level authorization, or a broader product-selection frame.

## 11. Source ledger

All sources are official Apache/ASF or official Apache Solr release materials, accessed 2026-08-17.

- **[S1]** Apache Solr Reference Guide 10.0, landing page and version selector: <https://solr.apache.org/guide/solr/latest/index.html>
- **[S2]** Schema Elements: <https://solr.apache.org/guide/solr/latest/indexing-guide/schema-elements.html>
- **[S3]** Schema API (supporting context): <https://solr.apache.org/guide/solr/latest/indexing-guide/schema-api.html>
- **[S4]** Update Request Processors: <https://solr.apache.org/guide/solr/latest/configuration-guide/update-request-processors.html>
- **[S5]** SolrCloud Shards and Indexing: <https://solr.apache.org/guide/solr/latest/deployment-guide/solrcloud-shards-indexing.html>
- **[S6]** SolrCloud Distributed Requests: <https://solr.apache.org/guide/solr/latest/deployment-guide/solrcloud-distributed-requests.html>
- **[S7]** Caches and Query Warming: <https://solr.apache.org/guide/solr/latest/configuration-guide/caches-warming.html>
- **[S8]** JSON Facet API: <https://solr.apache.org/guide/solr/latest/query-guide/json-facet-api.html>
- **[S9]** Dense Vector Search: <https://solr.apache.org/guide/solr/latest/query-guide/dense-vector-search.html>
- **[S10]** Learning To Rank: <https://solr.apache.org/guide/solr/latest/query-guide/learning-to-rank.html>
- **[S11]** SolrCloud Recoveries and Write Tolerance: <https://solr.apache.org/guide/solr/latest/deployment-guide/solrcloud-recoveries-and-write-tolerance.html>
- **[S12]** Backup and Restore: <https://solr.apache.org/guide/solr/latest/deployment-guide/backup-restore.html>
- **[S13]** Commits and Transaction Logs: <https://solr.apache.org/guide/solr/latest/configuration-guide/commits-transaction-logs.html>
- **[S14]** Securing Solr: <https://solr.apache.org/guide/solr/latest/deployment-guide/securing-solr.html>
- **[S15]** Metrics Reporting and Monitoring: <https://solr.apache.org/guide/solr/latest/deployment-guide/metrics-reporting.html>
- **[S16]** Circuit Breakers: <https://solr.apache.org/guide/solr/latest/deployment-guide/circuit-breakers.html>
- **[S17]** Request Rate Limiters: <https://solr.apache.org/guide/solr/latest/deployment-guide/rate-limiters.html>
- **[S18]** Apache Solr 10.0.0 `LICENSE.txt`: <https://raw.githubusercontent.com/apache/solr/releases/solr/10.0.0/LICENSE.txt>
- **[S19]** Apache Solr 10.0.0 `NOTICE.txt`: <https://raw.githubusercontent.com/apache/solr/releases/solr/10.0.0/NOTICE.txt>
- **[S20]** Apache License, Version 2.0: <https://www.apache.org/licenses/LICENSE-2.0>

## 12. Final confidence and decision record

- **Facts:** high confidence, directly grounded in Solr 10.0 official documentation or official release legal files.
- **Inferences:** high confidence where they follow from explicit failure/consistency boundaries; medium where future Curiosity topology or workload is unknown.
- **Recommendations:** medium-high confidence as architecture principles; no implementation or product-selection claim is made.
- **ADOPTED:** explicit completeness, deterministic identity/routing, separated durability/visibility/backup states, bounded reranking, structured exactness metadata.
- **ADAPTED:** ingestion chain, replica affinity, generation caches, recovery acknowledgements, backup repository abstraction.
- **REJECTED:** silent partial results, snapshot-as-backup, public Solr exposure, arbitrary caller-selected processing/query fragments.
- **DEFERRED:** Solr compatibility, concrete engine selection, LTR/model format, vector index parameters, GPU and experimental text-to-vector features.
