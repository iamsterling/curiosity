# OpenSearch architecture: clean-room reverse-engineering dossier

**Research date / source access date:** 2026-08-17  
**Version frame:** OpenSearch 3.8.0, released 2026-08-05, plus the official
`latest` documentation as it existed on the access date and source references
pinned to the 3.8.0 core or 3.8.0.0 plugin tags [S1]. Where behavior is
version-sensitive, this report says so.  
**Decision frame:** what OpenSearch's architecture teaches Curiosity about an
owned, bounded retrieval plane; not whether to copy OpenSearch or deploy it.  
**Status:** research only. No OpenSearch code, model, index, binary, or service
was copied, run, benchmarked, or incorporated.

## Executive conclusion

**RECOMMENDATION — ADAPT the architecture, do not silently adopt the product
(high confidence).** OpenSearch is strong evidence for six separations that
Curiosity should preserve: immutable segment storage versus mutable routing
metadata; durable write acceptance versus later search visibility; primary
execution versus replica/recovery flow; candidate generation versus fusion
versus reranking; score-affecting query clauses versus policy filters; and
live replicas versus independent snapshots. Its source also demonstrates the
operational cost of making shards the common unit of storage, routing,
replication, recovery, and search fan-out.

OpenSearch is not a single self-contained “Apache-2.0 vector database.” The
core repository is Apache-2.0, but security, neural search, k-NN, ML Commons,
cross-cluster replication, index management, and other capabilities are
plugins or separate projects. Their repository licenses, bundled third-party
notices, model licenses, connector/service terms, and trademarks remain
separate boundaries. In particular, the k-NN plugin's license file includes
third-party terms for FAISS, OpenBLAS, Cerberus, PyYAML, NumPy, and Windows
runtime components, and its source uses NMSLIB and FAISS submodules [S28].

For Curiosity, **ADOPT** explicit retrieval stages, immutable generations,
rank-based fusion as a safe baseline, typed filter placement, recovery drills,
and independent snapshot manifests. **ADAPT** shard/segment ideas without
coupling the public agent contract to OpenSearch APIs. **REJECT** treating a
replica as a backup, relying on unversioned scores, forcing refresh for every
write, or granting the search cluster autonomous agent authority. **DEFER**
OpenSearch itself as a benchmark or replaceable adapter until corpus rights,
SLOs, ownership policy, and workload measurements exist.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. How do cluster state, shards, Lucene segments, and translogs divide control,
   data, durability, and visibility?
2. What happens to a document through ingest, index, update, delete, refresh,
   flush, merge, replication, and recovery?
3. Where do lexical, vector, hybrid, filtering, fusion, and reranking execute,
   and what correctness limits follow from shard-local candidate sets?
4. How do snapshots, replicas, remote-backed storage, and cross-cluster
   replication differ?
5. What security and operational machinery is required at scale?
6. Which concepts can Curiosity learn clean-room, and which code, plugin,
   model, service, data, license, and trademark boundaries must remain explicit?

### 1.2 Evidence method and limits

Official OpenSearch documentation, release records, repository license/notice
files, and public source paths were used. Documentation establishes intended
behavior; source structure was used to triangulate component boundaries, not
to reproduce implementation. Source and repository-license references are
pinned to the 3.8.0 core or corresponding 3.8.0.0 plugin release tags.
No private interface, access control, hosted service, or benchmark was probed.

**Depth budget:** architecture and lifecycle depth across every requested
category; no full call graph, line-by-line code study, performance experiment,
dependency SBOM audit, legal opinion, or production sizing exercise.

**Labels:**

- **FACT** — directly supported by cited official documentation or source.
- **INFERENCE** — synthesis from those facts, not directly measured here.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

## 2. System anatomy

### 2.1 Four nested units and two planes

```text
cluster (one elected cluster manager; replicated cluster-state view)
  -> index (mapping/settings/aliases; fixed primary-shard topology)
    -> shard copy (one Lucene index + translog; primary or replica)
      -> immutable Lucene segments (postings, stored fields, doc values,
         points and, when configured, vector structures)
```

**FACT (high):** an index is partitioned into primary shards; each shard is a
complete Lucene index, and replicas are additional shard copies. The node that
receives a request coordinates routing and result reduction. A production
cluster can assign dedicated cluster-manager, data, ingest, coordinating, and
search roles, although nodes are multi-role by default [S2, S3].

**FACT (high):** the cluster manager owns cluster-wide metadata and routing
changes, not the normal document/search data path. Cluster state includes
nodes, index metadata/mappings/settings, blocks, and shard routing. The elected
manager computes updates, publishes them, waits for a voting-configuration
majority to commit, then tells nodes to apply; differential publication is
normally used, with a full state sent to new or stale nodes [S4, S5]. Source
separates election and publication (`Coordinator`, `CoordinationState`,
`Publication`, `PublicationTransportHandler`) from shard replication
(`TransportReplicationAction`, `ReplicationOperation`) [C1, C2].

**INFERENCE (high):** OpenSearch has a control-plane/data-plane separation,
but not an independent control service. Mapping churn, index creation, node
membership, and shard movements still converge through one ordered cluster
state publication stream. Large mappings, excessive index/shard counts, or
slow followers therefore become control-plane risks even when search CPU is
available.

### 2.2 Shards and routing

**FACT (high):** document ID, or an explicit routing value, determines the
target primary shard. Reads, updates, and deletes must supply the same custom
routing value used at index time. Primary and replica copies are allocated on
different nodes when possible; awareness/forced-awareness can spread copies
across zones [S6, S3].

**FACT (high):** shard count is both a parallelism knob and overhead. Official
introductory guidance gives 10–50 GiB as a rule-of-thumb shard-size range and
warns that every shard is a Lucene index consuming CPU and memory [S2]. This is
guidance, not a universal limit.

**INFERENCE (high):** choosing primary-shard count fixes the dominant failure,
recovery, fan-out, and rebalancing granularity. More shards can use more nodes,
but also multiply per-shard readers, caches, segments, queues, routing entries,
and partial-failure surfaces. Curiosity should size from measured corpus,
ingest, latency, recovery, and growth—not from document count alone.

### 2.3 Segments, refresh, flush, and merge

**FACT (high):** a shard's Lucene index is composed of immutable segments.
Indexing first changes in-memory indexing structures and appends durability
records to the translog. A **refresh** writes new searchable segment files and
opens a reader, but does not make a durable Lucene commit. A **flush** fsyncs a
Lucene commit so older translog history is no longer required for restart
recovery. Merges rewrite smaller segments into larger segments and reclaim
space from deleted documents [S2, S7, S8, S9].

**FACT (high):** search visibility and write durability are distinct. Under
request translog durability, an acknowledged write can survive failure before
it appears in search. `refresh=false` leaves visibility to periodic refresh;
`wait_for` waits for visibility without forcing a refresh; `true` forces one
and can create many small segments and merge pressure [S6, S7].

**INFERENCE (high):** “near real time” is a reader-generation contract, not a
weak durability promise. A correct evidence service must expose or control the
generation against which it searches; otherwise an agent can index evidence,
receive success, and still search an older view.

## 3. Write lifecycle: ingest, index, update, and delete

### 3.1 End-to-end normal document-replication path

```text
client / bulk producer
  -> coordinating or ingest node
  -> optional ordered ingest processors (transform/drop/fail; on_failure)
  -> resolve index/alias, mapping and routing
  -> target primary shard
  -> validate + assign sequence number under current primary term
  -> apply Lucene operation + append translog
  -> replicate operation to in-sync replicas in parallel
  -> replica apply + translog
  -> required acknowledgements / response
  -> later refresh exposes a new search generation
  -> later flush commits; later merge compacts and reclaims deletes
```

**FACT (high):** ingest pipelines are ordered processor chains run before
indexing. They can mutate metadata/source, conditionally execute, invoke nested
pipelines, drop a document, or fail; processor- and pipeline-level `on_failure`
paths make failure handling part of the configured data contract [S10].

**FACT (high):** index, update, delete, and bulk requests route to a primary,
execute there, and replicate to active in-sync replicas. Sequence number and
primary term support optimistic concurrency through `if_seq_no` and
`if_primary_term`; a new primary term fences operations from an older primary
assignment [S6]. Source locates orchestration in `TransportWriteAction`,
`TransportReplicationAction`, and `ReplicationOperation`, while `IndexShard`
bridges replication semantics to the engine [C2, C3].

**CHECK:** `wait_for_active_shards` is a pre-execution availability condition,
not a substitute for application idempotency or concurrency checks. Bulk
responses must be inspected item by item; HTTP-level success does not imply
that every bulk item succeeded.

### 3.2 Index/create

**FACT (high):** Index replaces a document with the same ID; Create fails if
that ID already exists. Text fields are analyzed into terms for inverted-index
search; keyword fields retain exact values; doc values normally support
sorting/aggregations [S6, S11].

**INFERENCE (high):** replacement is logically whole-document even when
segments retain old physical records until merge. Stable external document and
capture IDs should therefore live above the Lucene document identity.

### 3.3 Update is read-modify-reindex, not an in-place field patch

**FACT (high):** the Update API accepts a partial document or script and can
retry version conflicts. At the API level it avoids a client-side GET/PUT
round-trip, but the resulting document version is reindexed; immutable segment
storage has no in-place field mutation [S12, S2].

**INFERENCE (high):** descriptions such as “change fields without reindexing
the entire document” should be read as an API/network convenience, not a
storage primitive. Large `_source` documents, high update rates, vectors, and
frequent deletes all create write amplification and merge work.

### 3.4 Delete is logical before it is physical

**FACT (high):** Delete uses the same routing, replication, refresh, sequence,
and primary-term mechanisms as other writes. Segment statistics separately
report live and deleted documents; deleted records are reclaimed by merge, not
necessarily when the Delete API returns [S6, S9].

**INFERENCE (high):** serving deletion, disk erasure, snapshot deletion, and
source-capture retention are four different controls. Curiosity needs an
immediate query-serving tombstone plus separately auditable purge schedules for
segments, snapshots, remote stores, and immutable legal/audit records.

### 3.5 Mapping and ingest failure boundaries

**FACT (high):** mappings, analyzers, and index settings determine how fields
are materialized. Mapping updates are cluster-state changes, unlike ordinary
document writes [S4, S11].

**RECOMMENDATION (high):** Curiosity should validate a versioned canonical
document before it reaches any search-engine adapter. Treat engine ingest
pipelines as replaceable derivation adapters, not as the sole record of
extraction, provenance, policy, or model version. Quarantine malformed input;
never silently accept partial provenance because an `on_failure` branch made
the indexing request succeed.

## 4. Search execution and retrieval pipelines

### 4.1 Distributed query/fetch

```text
request -> coordinating node
  query phase -> one eligible copy of each target shard
    local rewrite / match / score / top-N
  optional phase-results processor -> normalize or rank-fuse shard results
  global reduce -> top hits
  fetch phase -> owning shards fetch _source/stored fields/highlights
  optional response processors / reranker
  response
```

**FACT (high):** the default `query_then_fetch` search obtains shard-local top
hits and reduces them at the coordinator. `dfs_query_then_fetch` first gathers
distributed term/document frequencies to reduce shard-local scoring skew, at
additional cost. Search pipelines can install request, phase-results, and
response processors around this flow [S13, S14].

**INFERENCE (high):** every staged ranker operates on a bounded candidate set.
A perfect reranker cannot recover a relevant document omitted by shard-local
top-N, ANN traversal, a filter, or an earlier fusion window. Recall must be
measured at every boundary, not only for final top 10.

### 4.2 Lexical path

**FACT (high):** analyzed text is tokenized and normalized at index and query
time, stored in Lucene's inverted index, and scored using the field's
similarity; BM25 is the standard/default lexical similarity. Phrase and span
behavior depend on positions; exact matching normally uses keyword fields.
Multi-field mappings permit distinct representations of the same logical
value [S11, S15].

**INFERENCE (high):** analyzers are relevance code. Changing tokenization,
stemming, synonyms, stop words, similarity, or field boosts changes evidence
selection even when the public query is identical. Curiosity must version these
choices alongside the index generation and preserve the original text.

### 4.3 Vector and neural path

**FACT (high):** the k-NN plugin adds `knn_vector` mappings and exact or
approximate nearest-neighbor search. Approximate methods include HNSW and,
where supported, IVF; engines include Lucene and FAISS, while NMSLIB remains a
separate native dependency/legacy engine boundary. Search quality, memory,
indexing cost, and latency depend on engine, method, compression, construction,
and query exploration parameters [S16, S17, S28].

**FACT (high):** neural search is not just the core engine. The neural-search
plugin supplies neural and hybrid query/pipeline behavior; ML Commons manages
models/connectors; k-NN supplies vector field/search machinery. Embeddings may
be precomputed, generated by local models, or obtained through configured
remote connectors [S18, S29, S30].

**INFERENCE (high):** “OpenSearch semantic search” is a composition of at least
index mapping, chunking, embedding model, model/connector runtime, vector
engine, ANN parameters, and query pipeline. Each is independently versioned and
can fail or carry different data/license obligations.

### 4.4 Hybrid fusion

**FACT (high):** a top-level `hybrid` query runs one to five subqueries per
shard; documents matching at least one clause are eligible. A search pipeline
then combines channels. The normalization processor (introduced in 2.10)
supports min-max, L2, or z-score normalization and arithmetic, geometric, or
harmonic combination with optional weights. The score-ranker processor
(introduced in 2.19) uses reciprocal-rank fusion (RRF), with rank constant and
optional weights [S19, S20, S21].

**FACT (high):** hybrid rescoring differs from ordinary rescore: each hybrid
subquery is rescored on each shard before coordinator-level normalization or
rank fusion. A Boolean `should` query is not equivalent to `hybrid`; it sums
ordinary Boolean scores and does not invoke hybrid normalization. Hybrid query
nesting inside score wrappers is restricted because those wrappers bypass the
special per-subquery score collection [S21].

**INFERENCE (high):** score normalization is sensitive to the observed
candidate distribution and outliers; raw BM25, cosine/distance-derived, sparse,
and model scores are not naturally commensurate. RRF discards magnitude and is
usually the cleaner first fusion baseline, but still depends on candidate
depth, tie policy, channel weights, and duplicate identity.

**RECOMMENDATION (high):** Curiosity should log, per returned passage, channel
membership, channel rank, fusion version, model/index generation, and bounded
reason classes. Do not expose a single score as probability or compare it
across requests, shards, pipelines, or generations.

### 4.5 Reranking

**FACT (high):** core rescore reruns a more expensive query over a top window.
The search-pipeline `rerank` response processor supports OpenSearch-hosted
cross-encoder scoring (`ml_opensearch`, available since 2.12) and reranking by
a document field (since 2.18). Official tutorials also connect external
reranking services through ML connectors [S22, S23].

**INFERENCE (high):** response-stage cross-encoder reranking is a separate
latency, availability, privacy, and license domain. It should have a hard
candidate cap, deadline, circuit breaker, model version, deterministic
fallback, and an evaluation slice for exact names, rare terms, freshness, and
primary-source preference—not only average nDCG.

### 4.6 Filters are placement semantics, not decoration

**FACT (high):** Boolean `filter` and `must_not` clauses decide eligibility
without contributing relevance score and may benefit from caching. A top-level
`post_filter` runs after query scoring and aggregations, so it can narrow hits
while preserving broader facet counts. A hybrid query has its own filter that
applies to all subqueries [S24, S21].

**FACT (medium):** vector filtering has multiple modes with different recall
and cost: post-filtering can return fewer than `k`; exact prefilter-then-score
can be expensive; efficient filtering integrates the filter into supported ANN
engines/algorithms [S25]. Exact support varies by engine, method, and release,
so it must be checked against the deployed version rather than inferred from
the generic Query DSL.

**RECOMMENDATION (high):** policy/takedown/tenant/language/time eligibility
belongs in a mandatory pre-candidate filter shared by every retrieval channel.
Faceted UI selection may use post-filter semantics, but a security or deletion
rule must never be a response-only post-filter: candidates, highlights,
aggregations, caches, traces, and rerank calls could already have exposed it.

## 5. Replication, recovery, and snapshots

### 5.1 Three distinct replication meanings

| Mechanism | Unit moved | Main purpose | Architectural caveat |
| --- | --- | --- | --- |
| Document replication | each write operation; every shard copy indexes it | same-cluster HA and read capacity | replica CPU/merge work resembles primary |
| Segment replication | primary builds Lucene segments; replicas copy segment files after refresh/checkpoint | reduce duplicate indexing work and enable search replicas | visibility/recovery lag follows segment transfer; needs backpressure |
| Cross-cluster replication plugin | leader-index changes followed into a follower cluster | regional DR/read locality/migration | separate plugin, security, lag, and failover procedure; not consensus |

**FACT (high):** document replication is the normal primary-backup operation
flow. Segment replication instead performs Lucene indexing on the primary and
copies newly created segments to replicas; OpenSearch exposes replication lag
and backpressure because a primary can outrun replica segment transfer [S6,
S26]. Source has explicit replication modes and proxies plus segment checkpoint
listeners, corroborating that this is a selectable data path, not merely a
transport optimization [C2, C3].

**FACT (high):** cross-cluster replication is a separate plugin with leader and
follower indexes, auto-follow, permissions, and lag/status controls [S27]. It
does not make two clusters one quorum or provide automatic application-level
write conflict resolution.

### 5.2 Peer recovery

**FACT (high):** when a shard copy is created or falls behind, recovery can
transfer store files and then replay retained translog operations to catch up.
The public source separates source/target services, chunked file transfer,
prepare-for-translog, translog-operation, finalize, and primary-context handoff
messages [C4]. Sequence numbers, local/global checkpoints, primary terms, and
retained history let the system determine what operations are safely complete
or need replay [S6, C3].

**INFERENCE (high):** recovery bandwidth and merge/segment shape are part of
availability. A cluster can be green in steady state yet miss its recovery SLO
after a zone loss. Curiosity needs degraded-load tests with concurrent ingest,
search, shard rebuild, and snapshot traffic.

### 5.3 Remote-backed storage

**FACT (high):** remote-backed storage requires segment replication and is a
cluster-level bootstrap choice. The primary indexes writes, uploads translog
and segment data to configured remote repositories, and replicas obtain segment
copies from remote storage. Remote cluster state can be stored separately. The
feature cannot simply be toggled on or off after ordinary bootstrap [S31].

**INFERENCE (high):** remote object storage changes the durability and recovery
topology but introduces repository consistency, credentials, encryption,
bandwidth, latency, retention, and vendor-adapter failure domains. “Remote” is
not synonymous with independently restorable backup.

### 5.4 Snapshots

**FACT (high):** snapshots are repository-backed and incremental because
immutable segment files can be shared. They include primary-shard data and can
include cluster/global state. They are not an instantaneous cluster-wide point
in time: different primary shards can be captured at somewhat different times
while indexing continues. Shared snapshot blobs must be deleted through the API
so referenced data is retained [S32, S33].

**FACT (high):** `SnapshotsService`, `SnapshotShardsService`, repository code,
and `RestoreService` are separate source components; in-progress shard snapshot
status is reflected in cluster coordination [C5]. A replica is therefore not a
snapshot, and a snapshot repository is not just a copy of a node data path.

**RECOMMENDATION (high):** Curiosity should treat an index release as an
immutable manifest containing corpus/version IDs, analyzer/model/pipeline
versions, shard/segment hashes, policy generation, and restore checks. Keep a
separately controlled snapshot repository, test selective and full restore,
and measure deletion propagation through retained snapshots.

## 6. Security architecture and trust boundaries

**FACT (high):** OpenSearch Security is a plugin. It provides TLS for REST and
node transport; authentication through internal users, certificates, JWT,
LDAP/AD, SAML, or OIDC; role-based cluster/index permissions; document- and
field-level controls and field masking; and audit logging. Encryption at rest
is outside that plugin and normally belongs to the host/storage layer [S34,
S35].

**FACT (high):** permissions protect internal actions, not merely REST paths,
because one REST request can fan out into multiple actions. Audit logging is
disabled by default; logging every item of large bulk requests can create very
large audit volume. Demo certificates/configuration must be replaced for
production, and the Security plugin can be disabled [S36, S37].

**INFERENCE (high):** installation does not equal secure operation. The
cluster, Dashboards, ingest clients, snapshot repository, remote model
connectors, inter-node transport, system indexes, and operator APIs each need a
credential and egress boundary. DLS/FLS are useful defense in depth but cannot
replace corpus-policy enforcement before indexing or independent tenant tests.

**RECOMMENDATION (high):** for Curiosity:

- expose a narrow search adapter, not the OpenSearch API, to an agent;
- separate ingest, query, snapshot, security-admin, and model-connector roles;
- deny scripts, pipeline mutation, index management, snapshot, connector, and
  cluster settings to the query principal;
- allowlist outbound model endpoints and never pass ambient cloud credentials;
- preserve untrusted-content labels through highlights and reranker prompts;
- cap query clauses, shards, result windows, aggregation buckets, scripts,
  vector `k`, rerank candidates, bytes, and deadlines;
- export audit logs outside the protected search cluster so compromise or disk
  pressure cannot erase the only record.

## 7. Operations and scale

### 7.1 Capacity axes

**FACT (high):** official production guidance recommends three dedicated
cluster-manager nodes across three zones for most production clusters, balanced
data nodes, and avoiding direct client traffic to cluster managers. Dedicated
coordinating nodes can isolate search reduction; search nodes/search replicas
can separate search from indexing workloads [S3].

**INFERENCE (high):** capacity has at least six independent dimensions:

1. **control:** cluster-state size/publication rate and manager heap/latency;
2. **write:** ingest processor CPU, primary indexing, translog fsync, replicas;
3. **maintenance:** refresh, merge, segment transfer, snapshot, recovery;
4. **query:** shard fan-out, caches, collectors, aggregations, reduce/fetch;
5. **vector/ML:** graph/index memory, native memory, embedding and rerank compute;
6. **storage/network:** local disks, replica factor, remote/snapshot traffic.

A node can be healthy on one axis and saturated on another. Average QPS and
total index bytes are insufficient sizing inputs.

### 7.2 Required observability

**RECOMMENDATION (high):** monitor and alert on:

- cluster-state queue/publication/follower lag, manager elections, node joins;
- shard health/allocation/relocations, recovery stage/rate/time, zone balance;
- per-shard indexing latency/rejections, translog size/age/fsync, refresh rate,
  segment count, merge backlog/throttle, disk watermarks;
- search latency and failures by phase/query class, fan-out, coordinator heap,
  cache hit/eviction, circuit breakers, cancelled tasks, slow logs;
- ANN graph/native memory, filtered-result shortfall, candidate recall samples,
  embedding/rerank latency/errors and fallback rate;
- segment-replication checkpoint/bytes/lag and backpressure rejections;
- snapshot age/duration/failure/partial state, repository errors, restore RTO;
- auth failures, missing privileges, sensitive configuration changes, audit
  queue/drop/storage health;
- end-to-end capture-to-search lag, tombstone-to-nonserve lag, and citation
  resolvability—the product metrics that engine health cannot supply.

OpenSearch exposes cluster health/state, CAT and node/index stats, segments,
recovery, tasks, profile/slow logs, circuit breakers, search/indexing
backpressure, and workload management; which signals are enabled and retained
is an operator decision [S38, S39].

### 7.3 Failure drills and scale checks

**RECOMMENDATION (high):** before accepting a deployment, test manager loss,
minority and majority network partitions, zone/data-node loss, disk watermark,
corrupt/unavailable snapshot repository, slow remote store, replica lag,
coordinator overload, mapping explosion, hot routing key, large aggregation,
expensive wildcard/script, model timeout, bulk partial failure, rolling upgrade,
full restore, and emergency deindex. Record RPO/RTO and partial-result behavior.

**UNKNOWN:** no workload, corpus, index schema, QPS, latency percentile,
freshness, update/delete rate, vector dimension, replication mode, region, or
retention target was supplied. No node, shard, memory, or cost number is
defensible here.

## 8. License and component boundary

### 8.1 What Apache-2.0 does and does not cover

**FACT (high):** the OpenSearch core repository is licensed under Apache
License 2.0. Redistribution conditions include providing the license, marking
modified files, retaining applicable notices, and reproducing relevant NOTICE
attributions. The license includes a contributor patent grant with a patent
litigation termination condition and does not grant trademark rights [S40].
Core NOTICE attributes OpenSearch Contributors, historical Elasticsearch work,
the Apache Software Foundation, Joda.org, and another Apache-licensed
contributor [S41].

**FACT (high):** Security and neural-search are separate Apache-2.0
repositories with their own NOTICE/dependency records [S42, S29]. k-NN is also
Apache-2.0 at the project level, but its `LICENSE.txt` carries additional
third-party licenses and its `.gitmodules` identifies NMSLIB and FAISS native
sources [S28]. The core repository itself contains built-in plugin directories,
while many distribution capabilities live in separate repositories [C6].

**INFERENCE (high):** “OpenSearch is Apache-2.0” is true of the named core work,
not a blanket declaration that every binary, plugin, native library, model,
Docker image layer, connector, dataset, or hosted service has only Apache-2.0
obligations. A specific release artifact needs an SBOM plus its LICENSE,
NOTICE, and third-party files.

### 8.2 Models, connectors, and services

**FACT (high):** official semantic/reranking tutorials reference OpenAI,
Cohere, Amazon Bedrock, SageMaker, and custom local models [S18, S23]. Those
references describe integration paths. They do not relicense providers,
weights, APIs, inputs, or outputs under Apache-2.0.

**RECOMMENDATION (high):** maintain separate ledgers for:

- OpenSearch core version and notices;
- every plugin and native dependency version/license;
- container/JDK/OS packages;
- model weights, tokenizer, training/evaluation data, acceptable-use terms;
- connector destination, service terms, data retention and data residency;
- indexed corpus/document rights; and
- OpenSearch names/logos under project trademark policy.

This is an engineering boundary, not legal advice. Counsel must decide concrete
distribution, SaaS, model, patent, privacy, and trademark questions.

## 9. Clean-room lessons for Curiosity

### 9.1 Safe conceptual learning

**ADOPTED / high confidence:** independently specify these public architectural
ideas without copying source expression:

1. immutable sorted segments plus background compaction;
2. explicit write-durable, search-visible, committed, and compacted states;
3. deterministic document routing and a separately versioned routing manifest;
4. primary term/epoch plus monotonic operation sequence for stale-writer fencing;
5. file/generation transfer followed by operation-log catch-up for recovery;
6. query/fetch fan-out and bounded coordinator reduction;
7. lexical and semantic candidate channels with rank-based fusion;
8. mandatory pre-candidate policy filters and separately named post-filters;
9. expensive reranking over a hard top-N with timeout/fallback;
10. content-addressed incremental snapshots with API-managed reference deletion.

Published algorithms (BM25, HNSW, IVF, RRF) still need origin attribution and a
targeted patent/freedom-to-operate check appropriate to the implementation and
jurisdiction. Public behavior and documentation can inform a neutral
specification; brand, text, source structure, tests, fixtures, and nonpublic
behavior should not be cloned.

### 9.2 Contamination controls

**RECOMMENDATION (high):** researchers may record behavior, sources, invariants,
failure modes, and black-box test ideas. If Curiosity requires a wholly owned
implementation, implementers should work from an approved provider-neutral
specification and independently authored fixtures, without using OpenSearch
source as a translation template. Preserve research/implementation role and
artifact provenance. Apache-2.0 is permissive, but copied code remains
third-party code with attribution and notice obligations; it is not transformed
into project-owned code by permissive licensing.

### 9.3 Provider-neutral boundary

```text
Curiosity SearchRequest / SearchResponse + authority and hard budget
  -> adapter (OpenSearch could be one replaceable implementation)
     -> index-generation resolver
     -> mandatory policy/tombstone filter
     -> lexical candidates
     -> optional semantic candidates
     -> versioned fusion
     -> bounded rerank
     -> duplicate/source diversification
     -> capture-anchored passages and warnings
```

**RECOMMENDATION (high):** never expose OpenSearch index names, DSL, pipeline
IDs, model IDs, `_score`, shard topology, credentials, or cluster errors as the
Curiosity domain contract. Return stable document/capture/passage IDs, index
generation, retrieval channel/rank, policy generation, model/pipeline versions,
coverage/partial-failure warnings, and an untrusted-evidence marker.

## 10. Curiosity implications and verdict ledger

| Finding | Verdict | Confidence / implication |
| --- | --- | --- |
| Immutable segment generations | **ADOPTED** | High; reproducible citations and rollback need named generations. |
| Refresh separate from durability | **ADOPTED** | High; expose read-after-write/visibility semantics explicitly. |
| Shard as universal unit | **ADAPTED** | High; useful locality, but avoid oversharding and coupling public IDs to shard math. |
| Central ordered cluster metadata | **ADAPTED** | High; version routing/policy, but bound metadata size/churn and isolate data path. |
| Engine ingest pipelines as canonical ETL | **REJECTED** | High; provenance and policy must exist before/independent of an adapter. |
| Lexical BM25 baseline | **ADOPTED** | High; deterministic, debuggable first candidate channel. |
| Semantic retrieval replacing lexical | **REJECTED** | High; exact/rare/entity queries and model failure require lexical fallback. |
| Hybrid RRF baseline | **ADOPTED** | High; safer first fusion than treating heterogeneous scores as calibrated. |
| Score normalization/weighted fusion | **DEFERRED** | Medium; only after judged, sliced experiments and score-drift checks. |
| Cross-encoder reranking | **DEFERRED** | High; candidate recall, model rights, privacy, latency, and fallback gates first. |
| Mandatory pre-candidate policy filters | **ADOPTED** | High; response-only filters are unsafe for deletion/security. |
| Replicas as backups | **REJECTED** | High; correlated failure/deletion replicates; independent snapshots required. |
| Incremental snapshot manifests | **ADOPTED** | High; pair with restore tests and deletion-retention policy. |
| Segment replication / remote store | **DEFERRED** | Medium; workload-specific trade-off requiring measured lag/recovery economics. |
| OpenSearch as Curiosity's owned core | **REJECTED under strict ownership** | High; it is third-party Apache software plus plugin/dependency boundaries. |
| OpenSearch as benchmark/replaceable adapter | **DEFERRED** | High; allowed only by explicit ownership/license decision and measured need. |
| Direct agent access to OpenSearch | **REJECTED** | High; expands query/admin/DoS surface and leaks provider contract. |

### Curiosity-aware retrieval

**INFERENCE (high):** OpenSearch's pipelines can execute retrieval mechanics,
but they do not supply Curiosity's authority model. Novel query branches,
contradiction search, source diversity, and stopping remain caller/researcher
decisions. The search plane should report branch overlap, channel coverage,
candidate shortfall, partial shard/model failures, and marginal evidence gain;
it must not autonomously spawn new searches.

## 11. Verification checks and unresolved questions

### 11.1 Checks before relying on any release

1. Pin exact OpenSearch, Lucene, plugin, JDK, native-library, model, and image
   digests; archive their license/notice/SBOM records.
2. Characterize Index/Create/Update/Delete/Bulk behavior with custom routing,
   concurrency conflicts, retries, timeouts, refresh modes, and partial replicas.
3. Prove search generation and citation passage remain reproducible across
   refresh, merge, relocation, replica selection, snapshot, and restore.
4. Measure candidate recall before fusion/rerank by shard count and query class;
   compare `query_then_fetch` and DFS where lexical score skew matters.
5. Verify vector filter behavior for the exact engine/method/release, including
   returned count below `k`, selective filters, deletes, and segment merges.
6. Force embedding/rerank connector timeout, malformed output, quota failure,
   and model unavailability; verify bounded deterministic fallback.
7. Test policy deletion before candidates, aggregations, highlights, cache,
   traces, rerank calls, snapshots, and restored indexes.
8. Restore snapshots into an isolated clean cluster and validate corpus,
   security configuration, aliases, templates, pipelines, and model dependencies.
9. Test minority/majority partitions and stale-primary fencing; inspect
   acknowledged-write and search-visibility outcomes.
10. Re-audit official docs/source at upgrade: `latest` is mutable, and plugin
    feature matrices and license inventories can change independently.

### 11.2 Unknowns

- Whether Curiosity's “owned” requirement permits any Apache-2.0 engine or
  plugin as a production component.
- Initial corpus, schema, language analysis, update/delete profile, vector
  dimension/model, relevance judgments, and provenance fields.
- Required consistency, p95/p99 latency, QPS, ingest rate, freshness, RPO/RTO,
  regions, retention, and deletion SLA.
- Whether remote model calls are legally and operationally permitted for query
  or corpus text.
- Exact 3.8.0 distribution/plugin composition and transitive-license inventory;
  repository-level inspection is not an artifact SBOM audit.
- Whether segment replication, remote-backed storage, searchable snapshots, or
  cross-cluster replication would improve the eventual measured workload.
- Comparative relevance, cost, and recovery performance versus an owned engine;
  no benchmark was run.

## 12. Bounded curiosity pass

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive). This pass
stayed inside the caller's declared OpenSearch/Curiosity frame.

| Thread | Relevance | Value | Novelty | Cost | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify current version rather than assume older 2.x docs | 5 | 5 | 3 | 1 | **Pursued:** official release API identifies 3.8.0 on 2026-08-05 and Lucene 10.5.0 [S1]. |
| Check whether k-NN is purely Apache-2.0 | 5 | 5 | 5 | 1 | **Pursued:** project license is Apache-2.0 but the same file records multiple third-party terms and native submodules [S28]. |
| Distinguish replica, snapshot, and remote store | 5 | 5 | 4 | 2 | **Pursued:** mechanisms have different units, consistency, and failure domains [S26, S31, S32]. |
| Determine exact ANN filter matrix for every 3.8 method | 4 | 4 | 3 | 4 | `CURIOSITY_NO_GO`: deployment configuration is unknown; retained as a mandatory version-specific check. |
| Audit every distribution transitive dependency/license | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: requires exact artifacts/SBOM and legal review, outside architecture budget. |
| Benchmark lexical/vector/hybrid/rerank quality | 5 | 5 | 3 | 5 | `CURIOSITY_NO_GO`: no authorized corpus, judgments, hardware, or workload. |
| Reconstruct full cluster consensus proof from source | 3 | 3 | 3 | 5 | `CURIOSITY_NO_GO`: quorum/publication invariants are sufficiently documented; proof-level work would not change the decision. |
| Reverse engineer hosted Amazon OpenSearch Service differences | 2 | 3 | 3 | 5 | `CURIOSITY_NO_GO`: proprietary service behavior is outside the OpenSearch OSS/Curiosity frame. |

**Coverage stop:** every caller-requested category has an evidenced mechanism,
Curiosity implication, verdict, and open check.  
**Saturation stop:** further official pages largely expanded API parameters or
plugin-specific examples without changing the architecture decision.  
**Exhaustion stop:** exact workload, artifact set, and legal authority are not
available; benchmark and complete license audit cannot responsibly proceed.

## 13. Primary source bibliography

All sources accessed 2026-08-17. Documentation URLs marked `latest` are mutable;
the access date and 3.8.0 frame are therefore material.

1. **[S1] OpenSearch 3.8.0 official GitHub release.**
   https://github.com/opensearch-project/OpenSearch/releases/tag/3.8.0 — release
   date, current version, feature/fix context, and Lucene 10.5.0 upgrade.
2. **[S2] OpenSearch introduction and concepts.**
   https://docs.opensearch.org/latest/getting-started/intro/ and
   https://docs.opensearch.org/latest/getting-started/concepts/ — nodes,
   shards, Lucene indexes, segments, translog, refresh, flush, and merge.
3. **[S3] Creating and tuning a cluster.**
   https://docs.opensearch.org/latest/tuning-your-cluster/ — node roles,
   three-manager guidance, zones, allocation awareness, and client routing.
4. **[S4] Cluster State API.**
   https://docs.opensearch.org/latest/api-reference/cluster-api/cluster-state/
   — state contents, versions, manager/local views, metadata and routing.
5. **[S5] Voting and quorum.**
   https://docs.opensearch.org/latest/tuning-your-cluster/discovery-cluster-formation/voting-quorums/
   — elections, voting configuration, majority commit, state publication and
   follower lag.
6. **[S6] Document APIs.**
   https://docs.opensearch.org/latest/api-reference/document-apis/ — routing,
   primary/replica write flow, refresh modes, sequence numbers, primary terms,
   and optimistic concurrency.
7. **[S7] Refresh Index API.**
   https://docs.opensearch.org/latest/api-reference/index-apis/refresh/ —
   visibility, idle refresh, `wait_for`, and forced-refresh costs.
8. **[S8] Flush API.**
   https://docs.opensearch.org/latest/api-reference/index-apis/flush/ — Lucene
   persistence and translog lifecycle.
9. **[S9] Index Segments API.**
   https://docs.opensearch.org/latest/api-reference/index-apis/segment/ —
   committed/searchable segments and deleted-document accounting.
10. **[S10] Ingest pipelines and failures.**
    https://docs.opensearch.org/latest/ingest-pipelines/ and
    https://docs.opensearch.org/latest/ingest-pipelines/pipeline-failures/ —
    ordered processors, conditions, failure and `on_failure` behavior.
11. **[S11] Mappings and field types.**
    https://docs.opensearch.org/latest/mappings/ — text/keyword fields,
    analysis, doc values, mappings, and multi-fields.
12. **[S12] Update Document API.**
    https://docs.opensearch.org/latest/api-reference/document-apis/update-document/
    — partial/script updates, no-op/conflict behavior, and API semantics.
13. **[S13] Search a document / search process.**
    https://docs.opensearch.org/latest/search-plugins/searching-data/index/ —
    distributed query and fetch behavior.
14. **[S14] Search pipelines.**
    https://docs.opensearch.org/latest/search-plugins/search-pipelines/index/ —
    request, phase-results, and response processor stages.
15. **[S15] Similarity.**
    https://docs.opensearch.org/latest/im-plugin/similarity/ — BM25 and
    configurable lexical similarity boundary.
16. **[S16] Approximate k-NN.**
    https://docs.opensearch.org/latest/vector-search/vector-search-techniques/approximate-knn/
    — ANN engines/methods and tuning dimensions.
17. **[S17] Exact k-NN.**
    https://docs.opensearch.org/latest/vector-search/vector-search-techniques/knn-score-script/
    — exact vector scoring path.
18. **[S18] Neural and hybrid search tutorial.**
    https://docs.opensearch.org/latest/tutorials/vector-search/neural-search-tutorial/
    — model registration/deployment, ingest embeddings, neural query and hybrid
    pipeline composition.
19. **[S19] Hybrid search.**
    https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/index/
    — normalization and score-ranker processor roles.
20. **[S20] Normalization processor.**
    https://docs.opensearch.org/latest/search-plugins/search-pipelines/normalization-processor/
    — score normalization, combination, weights, query/fetch placement and
    candidate-depth warning.
21. **[S21] Hybrid query and score ranker.**
    https://docs.opensearch.org/latest/query-dsl/compound/hybrid/ and
    https://docs.opensearch.org/latest/search-plugins/search-pipelines/score-ranker-processor/
    — clause count, top-level restrictions, rescore ordering, and RRF.
22. **[S22] Rescore and rerank processor.**
     https://docs.opensearch.org/latest/query-dsl/rescore/ and
    https://docs.opensearch.org/latest/search-plugins/search-pipelines/rerank-processor/
    — bounded rescore and response rerank types.
23. **[S23] Cross-encoder reranking.**
    https://docs.opensearch.org/latest/search-plugins/search-relevance/rerank-cross-encoder/
    — model and search-pipeline composition; external tutorials are linked
    from the same documentation family.
24. **[S24] Boolean query and post-filter.**
     https://docs.opensearch.org/latest/query-dsl/compound/bool/ and
     https://docs.opensearch.org/latest/search-plugins/filter-search/ —
    scoreless filter context, caching, and post-aggregation filtering.
25. **[S25] k-NN filtering.**
    https://docs.opensearch.org/latest/vector-search/filter-search-knn/ —
    post-filter, exact, and efficient ANN-filter trade-offs.
26. **[S26] Segment replication and backpressure.**
    https://docs.opensearch.org/latest/tuning-your-cluster/availability-and-recovery/segment-replication/ and
    https://docs.opensearch.org/latest/tuning-your-cluster/availability-and-recovery/segment-replication/backpressure/
    — primary segment production, replica transfer, lag and rejection controls.
27. **[S27] Cross-cluster replication.**
    https://docs.opensearch.org/latest/tuning-your-cluster/replication-plugin/
    — leader/follower, auto-follow, security, settings, and status APIs.
28. **[S28] OpenSearch k-NN repository license and submodules.**
     https://github.com/opensearch-project/k-NN/blob/3.8.0.0/LICENSE.txt and
     https://github.com/opensearch-project/k-NN/blob/3.8.0.0/.gitmodules — project
    Apache-2.0 text, third-party terms, NMSLIB and FAISS boundaries.
29. **[S29] Neural-search repository license.**
     https://github.com/opensearch-project/neural-search/blob/3.8.0.0/LICENSE and
     https://github.com/opensearch-project/neural-search/blob/3.8.0.0/NOTICE —
    separate Apache-2.0 project and notice boundary.
30. **[S30] ML Commons.**
    https://docs.opensearch.org/latest/ml-commons-plugin/ — model lifecycle,
    local/remote model and connector boundary.
31. **[S31] Remote-backed storage.**
    https://docs.opensearch.org/latest/tuning-your-cluster/availability-and-recovery/remote-store/
    — bootstrap constraint, translog/segment/state repositories, primary and
    replica flow, durability/recovery role.
32. **[S32] Take and restore snapshots.**
    https://docs.opensearch.org/latest/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/
    — incremental segments, non-atomic timing, primary shards, restore and
    API-mediated deletion.
33. **[S33] Snapshot management.**
    https://docs.opensearch.org/latest/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-management/
    — scheduling, retention, system-index metadata and repository scale.
34. **[S34] About security.**
    https://docs.opensearch.org/latest/security/ — TLS, authentication,
    authorization, FGAC, audit, and at-rest boundary.
35. **[S35] Authentication and access control.**
    https://docs.opensearch.org/latest/security/authentication-backends/authc-index/ and
    https://docs.opensearch.org/latest/security/access-control/ — backend
    chains, roles, mappings, index/document/field controls.
36. **[S36] Security permissions.**
    https://docs.opensearch.org/latest/security/access-control/permissions/ —
    internal action authorization and sensitive administrative boundaries.
37. **[S37] Security configuration and audit logs.**
    https://docs.opensearch.org/latest/security/configuration/ and
    https://docs.opensearch.org/latest/security/audit-logs/ — demo-production
    boundary, disabling plugin, audit defaults and volume warning.
38. **[S38] Cluster APIs and CAT APIs.**
    https://docs.opensearch.org/latest/api-reference/cluster-api/ and
    https://docs.opensearch.org/latest/api-reference/cat/ — operational state,
    health, allocation, node, shard and task surfaces.
39. **[S39] Availability and recovery controls.**
    https://docs.opensearch.org/latest/tuning-your-cluster/availability-and-recovery/
    — search/indexing backpressure and workload management.
40. **[S40] OpenSearch core LICENSE.**
     https://github.com/opensearch-project/OpenSearch/blob/3.8.0/LICENSE.txt —
    Apache-2.0 grants, conditions, patent and trademark clauses.
41. **[S41] OpenSearch core NOTICE.**
     https://github.com/opensearch-project/OpenSearch/blob/3.8.0/NOTICE.txt —
    required origin/attribution evidence.
42. **[S42] Security plugin LICENSE and NOTICE.**
     https://github.com/opensearch-project/security/blob/3.8.0.0/LICENSE.txt and
     https://github.com/opensearch-project/security/blob/3.8.0.0/NOTICE.txt —
    separate Apache work and third-party notice pointer.

### Source-component map (structure evidence, no code reproduced)

- **[C1] Coordination:**
  https://github.com/opensearch-project/OpenSearch/tree/3.8.0/server/src/main/java/org/opensearch/cluster/coordination
  — `Coordinator`, `CoordinationState`, `Publication`, publication transport,
  election/pre-vote, leader/follower checks, lag detection.
- **[C2] Replicated actions:**
  https://github.com/opensearch-project/OpenSearch/tree/3.8.0/server/src/main/java/org/opensearch/action/support/replication
  — primary/replica orchestration, replication modes/proxies, pending actions,
  replicated responses.
- **[C3] Shard boundary:**
  https://github.com/opensearch-project/OpenSearch/tree/3.8.0/server/src/main/java/org/opensearch/index/shard
  — `IndexShard`, operation permits, replication group, checkpoints, refresh,
  merge, remote-store and primary/replica synchronization.
- **[C4] Recovery:**
  https://github.com/opensearch-project/OpenSearch/tree/3.8.0/server/src/main/java/org/opensearch/indices/recovery
  — peer source/target, file chunks, translog catch-up, finalization and remote
  recovery handlers.
- **[C5] Snapshots:**
  https://github.com/opensearch-project/OpenSearch/tree/3.8.0/server/src/main/java/org/opensearch/snapshots
  — cluster-level snapshot coordination, shard work, restore, state/status.
- **[C6] Core-repository plugins:**
  https://github.com/opensearch-project/OpenSearch/tree/3.8.0/plugins — evidence
  that even the core tree has separately packaged analysis, repository,
  ingestion, cache, telemetry, transport, and workload plugins.

### Negative results retained

- No official source establishes that OpenSearch, any engine, or any hybrid
  weighting is categorically best for Curiosity's unknown corpus.
- No repository-level Apache-2.0 file establishes one blanket license for an
  assembled distribution, its transitive dependencies, models, or services.
- No snapshot mechanism found provides an instantaneous transactionally atomic
  point-in-time image of every shard while unrestricted writes continue.
- No replica mechanism found substitutes for an independently controlled,
  tested backup and restore path.
- No reranker can recover documents absent from its bounded candidate set.
- No engine-level DLS/FLS mechanism establishes crawl/content rights or makes
  untrusted web content safe for an agent.
- No evidence was found that OpenSearch search pipelines enforce Curiosity's
  caller authority, research frame, branch budget, or stop rules; those remain
  outside the engine.
