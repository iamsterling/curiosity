# Weaviate local / managed architecture: clean-room dossier

**Decision frame:** Which publicly documented Weaviate architecture patterns should
Curiosity adopt, adapt, reject, or defer for an owned, bounded, provider-neutral
retrieval system, and where would using Weaviate create operational or semantic
coupling?

**Snapshot:** First-party public sources accessed **2026-08-17**. Current docs
identify Weaviate Database `v1.39.0`; older-version behavior is called out where it
materially differs [S1][S2]. No credentials, paid service, live cluster, endpoint
probing, traffic interception, decompilation, or access-control bypass was used.
No source code was copied. Public source layout and its BSD-3-Clause license were
inspected only to establish product boundaries [S18][S19].

**Scope:** Weaviate Database, whether self-hosted or operated inside Weaviate Cloud
(WCD). Cloud-only Embeddings and operational plan differences are included where
they change the boundary. Query Agent, Engram, ingestion connectors, and application
framework integrations are not reverse engineered.

Labels below are **FACT**, **INFERENCE**, **RECOMMENDATION**, and **UNKNOWN**.
Confidence is high, medium, or low.

## Executive verdict

**ADAPT as an optional retrieval-store adapter; do not make its schema or runtime
semantics Curiosity's core contract (high confidence).** Weaviate's strongest design
is its shard-local co-location of an object store, property-oriented inverted
indexes, and one or more vector indexes. That arrangement enables one retrieval
surface for object reads, BM25F, ANN, structured pre-filters, and hybrid fusion. Its
separation of vectors from vector indexes, explicit named vector spaces, and
pluggable vectorizers are valuable precedents [S1-S6].

The consequential limits are equally important. Hybrid score normalization is
query-result-relative, not globally calibrated; HNSW is approximate; asynchronous
indexing can make object acceptance precede vector searchability; query consistency
levels do not make candidate UUID selection replica-consistent; schema evolution
does not backfill new named vectors; and object/inverted/vector state is maintained
by distinct structures rather than one transactional search index [S1][S5][S10-S12].
Curiosity must therefore keep canonical records, immutable source captures,
embedding lineage, retrieval traces, and deletion compliance outside any assumption
that a successful database write proves all search projections are immediately and
uniformly visible.

Self-hosted Weaviate is genuine BSD-3-Clause open source; Weaviate Cloud uses that
database inside a managed service and adds hosted operations, plans, Embeddings,
Query Agent, Data Import, SLAs, and security/compliance options [S16-S19]. Cloud is
not a different proprietary database engine according to current first-party pages,
but neither the BSD license nor public repository grants rights to the managed
service or third-party model APIs.

**Overall confidence:** high for documented data, index, query, consistency,
backup, security, cloud-plan, and license contracts; medium for the synthesized
end-to-end execution ordering; low for Cloud's private orchestration, autoscaling,
placement, noisy-neighbor controls, and exact point-in-time consistency across all
backup components.

## 1. Bounded questions and answers

| Question | Answer | Status / confidence |
| --- | --- | --- |
| What is stored? | JSON-like objects in schema-defined collections, UUIDs, properties, metadata, references, and zero/one/multiple named or multi-vector representations. | FACT / high [S3][S4] |
| What is the physical unit? | A collection maps to an internal index containing shards; each shard co-locates an LSM object store, property inverted indexes, and vector index(es). | FACT / high [S1][S2] |
| Who creates vectors? | A configured module/integration at import and `nearText`/hybrid query time, or the caller supplies vectors. Named vectors can choose separate source properties, models, indexes, compression, and metrics. | FACT / high [S4][S5] |
| How does hybrid work? | BM25F and vector search execute in parallel, their result scores are fused, and `alpha` weights vector versus keyword contribution. Relative-score fusion is the current default. | FACT / high [S6][S7] |
| How are filters combined with ANN? | Inverted indexes make an allow-list before vector search; HNSW traverses with the allow-list. ACORN is default from 1.34; very restrictive filters can switch to flat search. | FACT / high [S8] |
| Are updates/deletes immediately searchable? | Synchronous indexing updates structures on the request path; optional async indexing queues inserts, updates, and deletes persistently. HNSW deletion uses tombstones and background cleanup. Visibility and cleanup therefore differ by mode. | FACT + inference / high [S2][S9][S12] |
| How is distributed consistency handled? | Raft for collection/tenant metadata; leaderless replicated object data with ONE/QUORUM/ALL acknowledgement, repairs, and async replication. Search candidate selection is still based on local shard indexes. | FACT / high [S10][S11] |
| Local versus managed? | Same open-source database core; local/self-hosted owns Kubernetes, disks, keys, monitoring, backups, and upgrades. Cloud wraps it with managed infrastructure, plan limits, operations, SLAs, and cloud-only services. | FACT / high [S14-S19] |

## 2. Clean-room architecture model

### 2.1 Request and storage path

**INFERENCE (high), synthesized from documented components:**

```text
REST / gRPC / GraphQL request
  -> authentication + authorization
  -> collection schema / tenant resolution
  -> UUID hash -> shard and replica-set routing
  -> optional vectorizer module or caller-provided vector
  -> shard-local mutation or query

shard
  object LSM store <-----> property inverted indexes
        |                         |
        +---- UUID/docID ---------+
        |                         |
        +---- vector index(es) ---+

query coordinator
  -> per-shard lexical / vector / filtered search
  -> per-shard and cross-shard top-k merge
  -> optional hybrid fusion / reranking / generation module
  -> object materialization from selected UUIDs
```

The diagram is not a claim about private Cloud internals or exact Go call order.
It is the smallest model consistent with documented shard components, routing,
module roles, and query behavior [S1-S8]. Public repository top-level packages such
as `adapters`, `cluster`, `modules`, `usecases`, `grpc`, and `openapi-specs`
corroborate separation of concerns, but directory names do not establish runtime
semantics [S18].

### 2.2 Object and schema contract

- **FACT (high):** Every object belongs to one collection, has a UUID and properties,
  and may have vectors. A collection schema defines properties, types, references,
  module/vectorizer behavior, inverted-index options, and vector-index options.
  Auto-schema can infer a schema if one was not supplied [S3].
- **FACT (high):** Collections are separate vector spaces. Named vectors let one
  object participate in multiple spaces, each with an independent vectorizer,
  index, compression, and distance metric. Multi-vector objects are supported for
  named HNSW indexes [S3][S4].
- **FACT (high):** Cross-references are directional and do not change the source or
  target vectors. Weaviate warns that reference-heavy queries can be slower and
  recommends denormalization where practical [S3].
- **FACT (high):** Adding a named vector after collection creation does not populate
  it on existing objects; the docs prescribe delete/reinsert for backfill. Deleting
  or changing an existing property definition is not supported in-place [S3][S9].
- **INFERENCE (high):** Schema is both logical API and physical indexing policy.
  Curiosity would be tightly coupled if its domain schema directly encoded Weaviate
  tokenizers, vectorizers, or index settings.

### 2.3 Shard-local storage and durability

- **FACT (high):** Each shard is self-contained: key/value object store, inverted
  index, and vector index(es). Objects and inverted indexes use custom LSM stores;
  memtables flush to immutable sorted segments, Bloom filters avoid irrelevant
  segments, and background compaction merges segments and removes superseded object
  versions [S1].
- **FACT (high):** Vector indexes are separate and non-segmented. HNSW is kept as
  large as practical per shard because independent graphs cannot be cheaply merged
  and querying many graphs is less efficient [S1].
- **FACT (high):** LSM and HNSW each have write-ahead/commit logs. A successful
  mutation guarantees creation of an LSM WAL entry; HNSW has its own commit log on
  the same request path but with different disk-sync timing [S1].
- **FACT (high):** In 1.39, checksummed HNSW snapshots plus post-snapshot commit-log
  replay are mandatory storage behavior. A corrupt current snapshot cannot be
  reconstructed from already-removed covered logs; the affected shard requires a
  backup restore. Atomic rename and commit-log tail truncation bound partial-write
  failures [S1].
- **FACT (high):** Disk pressure defaults warn at 80% and mark affected shards
  read-only at 90%. Persistent volumes are required for durable Docker/Kubernetes
  deployments; production guidance supports Kubernetes, not Docker Compose [S13][S15].

**Important boundary:** “write persisted” is not “all projections mutually atomic
and query-visible everywhere.” The source explicitly distinguishes LSM and HNSW logs,
and optional async indexing inserts another durable queue [S1][S2].

## 3. Vectorizers and module boundary

- **FACT (high):** The database core can run with no modules if callers provide
  vectors. Optional modules cover vectorization, reranking, Q&A/generation,
  spellcheck, backup backends, and other extensions; modules may depend on other
  modules [S5].
- **FACT (high):** Text, image, and multimodal vectorizers transform selected object
  data at import. Textual `nearText` and hybrid queries invoke the configured
  vectorizer to embed the query. Property configuration can include or exclude
  values and property names [S4][S5][S17].
- **FACT (high):** A caller may bring precomputed vectors. Vector creation and vector
  indexing are decoupled; disabling an index does not necessarily disable vector
  generation [S2].
- **FACT (high):** Weaviate's own Embeddings service is Cloud-only and billed by
  tokens. Other integrations can call external provider APIs or local model services.
  The monitoring contract exposes external-module request counts, duration, size,
  token, status, and error metrics [S12][S17].
- **INFERENCE (high):** Integrated vectorization reduces application plumbing but
  turns database writes and textual searches into model-dependent network work.
  Provider outages, throttling, model drift, truncation, and billing can enter the
  database critical path.
- **UNKNOWN:** Current public pages do not promise immutable model revisions,
  deterministic embeddings, automatic corpus-wide re-embedding after model changes,
  or transactional rollback across external vectorization and object/index writes.

**RECOMMENDATION:** Curiosity should own an embedding job ledger with provider,
model/revision, source-property set, preprocessing version, dimensions, digest,
attempts, cost, and validity state. Pass vectors to a storage adapter by default;
use integrated vectorizers only behind an explicit operational policy.

## 4. Lexical, vector, and hybrid retrieval

### 4.1 Inverted indexes and BM25F

- **FACT (high):** Inverted indexes are property-specific. Searchable text indexes
  support BM25F/hybrid; filterable indexes use Roaring Bitmaps for match filters;
  range indexes use bitmap slices for numeric/date ranges. Searchable and filterable
  are enabled by default; range is not [S2].
- **FACT (high):** BM25F scores term frequency, inverse document frequency, field
  length, configurable `k1` (default 1.2) and `b` (default 0.75), selected fields,
  and per-query field boosts. The default query operator is OR with one required
  token; AND and cross-field AND variants are available [S7].
- **FACT (high):** Tokenization and analyzers are schema policy. Stopwords are
  removed during query scoring but remain indexed, allowing stopword changes without
  reindexing. BlockMax WAND can skip irrelevant posting blocks [S2][S7].
- **RECOMMENDATION (high):** Preserve raw text and analyzer version separately.
  Treat BM25 scores as collection/query-local ranking evidence, never calibrated
  relevance probabilities.

### 4.2 Vector indexes

- **FACT (high):** Current index choices are custom HNSW, brute-force flat, dynamic
  flat-to-HNSW (default switch threshold 10,000 objects), and disk-oriented HFresh.
  HNSW is the general recommendation; flat is useful for small per-tenant indexes;
  dynamic requires async indexing [S2][S4].
- **FACT (high):** HNSW provides approximate search and full CRUD. It stores the
  graph in memory; quantization reduces memory. HFresh keeps a compressed HNSW
  centroid index in memory, disk-resident compressed posting lists, and rescores
  candidates against uncompressed vectors [S2].
- **INFERENCE (high):** Index selection is workload policy, not domain semantics.
  Curiosity should demand measured recall/latency/resource curves for its own
  corpus rather than encode “HNSW” in provider-neutral requests.

### 4.3 Hybrid fusion

- **FACT (high):** Hybrid runs vector and BM25 searches in parallel and fuses their
  result sets. `alpha=0` is keyword-only, `alpha=1` vector-only; the server default
  is 0.75 when unset, but client/version behavior can differ, so docs advise setting
  it explicitly [S6].
- **FACT (high):** `relativeScoreFusion`, default since 1.24, min-max normalizes each
  branch's observed scores and sums weighted values. `rankedFusion` discards score
  magnitude and combines reciprocal rank-like values [S6].
- **FACT (high):** A maximum vector-distance threshold can exclude vector candidates
  from hybrid results; no equivalent universal BM25 or final fused-score threshold
  exists [S6].
- **INFERENCE (high):** Relative-score fusion is sensitive to the candidate window
  and branch score extrema. The same document/query can receive a different fused
  score when another candidate enters or leaves the branch result set.
- **RECOMMENDATION (high):** Preserve lexical rank/score, vector rank/distance,
  fusion strategy, alpha, candidate limits, filters, and final rank independently.
  Tune fusion offline by query class; do not expose the fused number as confidence.

## 5. Filters with HNSW

- **FACT (high):** Weaviate constructs an allow-list of eligible `uint64` IDs from
  inverted indexes before ANN search. HNSW can traverse graph edges normally while
  adding only allowed IDs to the result set, avoiding classic post-filter underfill
  [S8].
- **FACT (high):** ACORN is the default HNSW filter strategy from 1.34. Its custom,
  paper-inspired implementation skips distance computation for disallowed nodes,
  explores multi-hop neighborhoods, and seeds matching entry points. It targets
  restrictive filters with low correlation to vector neighborhoods [S8].
- **FACT (high):** The older sweeping strategy traverses from the graph root with the
  allow-list. A configurable flat-search cutoff can brute-force only the small
  allowed subset when the filter is sufficiently restrictive [S8].
- **CAUTION (high):** Vendor internal tests say filtered recall is typically not
  worse than unfiltered recall; that is not an independent guarantee for Curiosity's
  data. Filter selectivity, vector/filter correlation, HNSW parameters, compression,
  and index lag must all be evaluated.

## 6. Updates, deletes, TTL, and visibility

### 6.1 Updates

- **FACT (high):** Partial update replaces specified property values; full replace
  removes unspecified properties. Updating a previously vectorized property triggers
  re-vectorization and reindexing. The vector itself can be updated explicitly [S9].
- **FACT (high):** Adding a schema property or named vector does not automatically
  reprocess existing objects [S3][S4][S9].
- **FACT (high):** With synchronous indexing, vector index mutation is on the write
  path. With `ASYNC_INDEXING`, single writes, batches, updates, and deletes use a
  persistent on-disk vector queue; node/shard status exposes queue length [S2][S12].

### 6.2 Deletes

- **FACT (high):** Objects can be deleted by UUID, filter, collection deletion, or
  collection-level TTL. Filtered batch deletion supports dry-run and verbose output
  [S9].
- **FACT (high):** LSM compaction eventually removes superseded object versions.
  HNSW deletion creates tombstones; background cleanup repairs graph neighbors and
  removes deleted vectors. Metrics expose active tombstones, cleanup progress,
  cleaned counts, and unexpected tombstones [S1][S12].
- **FACT (high):** Replicated deletion conflicts can use no automated resolution,
  delete-wins, or timestamp-based resolution. Timestamp-based resolution is default
  from 1.36, allowing a later recreation to beat an earlier deletion [S11].
- **FACT (high):** TTL expiry is periodic, not instantaneous. Expired-but-not-yet-
  deleted objects may optionally be hidden. TTL deletion for inactive/offloaded
  tenants waits until activation [S3].

**RECOMMENDATION (high):** Curiosity needs a deletion ledger and a distinct purge
state for canonical store, lexical projection, vector projection, replicas, caches,
backups, and cold/offloaded tenants. “DELETE accepted” must not be represented as
physical erasure from tombstones, immutable segments, or retained backups.

## 7. Sharding, replication, and consistency

### 7.1 Sharding and placement

- **FACT (high):** Single-tenant collections use a fixed-at-creation shard count;
  UUIDs route via 64-bit Murmur3. Each tenant in a multi-tenant collection is one
  shard. New collection/shard placement prefers nodes with available disk [S10].
- **FACT (high):** More shards increase dataset capacity and import parallelism but
  do not themselves increase query throughput; replication provides HA and roughly
  scalable read throughput. Adding nodes does not rebalance existing shards [S10].
- **FACT (high):** Replica movement/copy, available from 1.32 and disabled by default,
  supports rebalancing and node drain through staged hydration, catch-up,
  integration, and optional source removal [S11].

### 7.2 Metadata versus object data

- **FACT (high):** Collection definitions and tenant activity status use leader-based
  Raft and commit after quorum. Replicated object data uses leaderless replication
  and two-phase commits adjusted to ONE, QUORUM (default), or ALL acknowledgement
  [S10][S11].
- **FACT (high):** Writes are sent to all replicas even when the coordinator returns
  after fewer acknowledgements. Repair-on-read and Merkle-tree-based async replication
  converge stale replicas; async replication defaults on for RF>1 from 1.38 [S11].
- **FACT (high, critical):** Read consistency controls versions of objects fetched
  after candidate UUID selection. It does **not** merge search candidate sets across
  replicas; query UUIDs come from the coordinator and required shards' local indexes.
  Even `ALL` therefore cannot guarantee the freshest search ranking during index
  divergence [S11].
- **RECOMMENDATION (high):** For compliance-critical records, retain a strongly
  consistent source of truth outside Weaviate. Record write CL, read CL, RF, shard,
  async queue state, and query time. Never translate `ALL` into “linearizable search.”

## 8. Backups and disaster recovery

- **FACT (high):** Backup modules support S3/S3-compatible, GCS, Azure, and local
  filesystem. Cloud stores support multi-node production; filesystem is single-node
  and explicitly not recommended for production [S14].
- **FACT (high):** Backups can select collections, run asynchronously while reads and
  writes continue, and restore across providers. Backup first flushes memtables,
  records immutable files, and pauses compaction while copying them [S14].
- **FACT (high):** Incremental backups from 1.37 reference unchanged files through a
  chain whose full base and intermediates must remain available. Restore fails if a
  target collection already exists; role/user restoration is opt-in [S14].
- **FACT (high):** Current backup docs say 1.37+ includes active and inactive tenants
  but skips offloaded tenants. The data-concepts and multi-tenancy pages still say
  backups include only active tenants. Treat the latter as stale documentation and
  verify exact server version before relying on inactive-tenant coverage [S3][S14].
- **UNKNOWN:** The reviewed pages do not state a universal RPO/RTO, cryptographic
  immutability guarantee, or one atomic timestamp spanning every shard/node/vector
  index. Live backup mechanics establish stable per-shard file sets, not a published
  database-wide snapshot-isolation theorem.

**RECOMMENDATION:** Require versioned restore drills, offloaded-tenant inventory,
chain retention validation, encrypted object storage, checksum verification, and
documented application-level RPO/RTO. Backup success is not purge success.

## 9. Multi-tenancy

- **FACT (high):** Multi-tenancy is disabled by default. Each tenant receives an
  isolated shard and dedicated vector index; all CRUD/search requests name a tenant.
  Automatic tenant creation is optional and typo-sensitive [S3][S20].
- **FACT (high):** `ACTIVE` tenants are readable/writable, `INACTIVE` tenants remain
  local but unavailable, and `OFFLOADED` tenants reside in cloud object storage and
  are unavailable until loaded. State transitions are eventually propagated [S3].
- **FACT (high):** Tenant deletion deletes its shard and objects. References may go
  from a tenant to non-tenant data or same-tenant data, not across tenants or from
  non-tenant to tenant data [S3][S20].
- **FACT (high):** Auto lazy-loading starts for multi-tenant collections above 1,000
  shards or 100 GB by default in 1.36.6+, reducing startup blocking but potentially
  adding first-access latency [S1].
- **INFERENCE (high):** Physical shard isolation is a strong operational primitive
  but not a complete SaaS isolation policy. Authentication, tenant-scoped RBAC,
  quotas, billing, noisy-neighbor limits, audit, backups, and deletion still require
  independent enforcement.

## 10. Security and operations

### 10.1 Self-hosted controls

- **FACT (high):** Authentication supports API keys, OIDC, or anonymous access;
  anonymous is strongly discouraged outside development. Authorization supports
  RBAC, admin/read-only lists, or undifferentiated access [S21][S22].
- **FACT (high):** RBAC separates permissions for collection definitions, tenants,
  data objects, backups, nodes, aliases, replications, roles, users, and OIDC groups;
  collection permission does not imply tenant permission. Authorization decisions
  are audit-logged when RBAC is enabled [S22][S23].
- **FACT (high):** Prometheus metrics cover requests, query latency, object/LSM/vector
  operations, queues, tombstones, module calls, Raft, replication, backups, shard
  loading, and resources. Metrics are not semver-stable and sample dashboards are
  unsupported examples [S12].
- **FACT (high):** Production guidance calls for Kubernetes, persistent volumes,
  at least three nodes/RF3 for HA, TLS between components, network policy, secret
  management, backups, monitoring, alerting, and tested failover [S15][S24].
- **RECOMMENDATION (high):** Disable anonymous access, use OIDC or rotated keys,
  least-privilege tenant-scoped RBAC, TLS, private networking, secret injection,
  audit export, bounded request sizes/time, and alerts on disk, queues, tombstones,
  replica repair, and backup failure. Do not expose raw database interfaces publicly.

### 10.2 Managed Cloud boundary

- **FACT (high):** WCD is fully managed and offered as shared or dedicated Cloud.
  The pricing page lists Free, Flex, and Premium tiers; paid shared tiers add HA,
  replication, and retained backups, while dedicated adds isolated infrastructure
  and higher security/compliance options [S16][S19].
- **FACT (high):** Current pricing advertises API/RBAC, managed upgrades, console
  metrics, encrypted Cloud operations, SOC 2 Type II, and dedicated-plan options such
  as HIPAA, PrivateLink, and customer-key encrypted volumes. SLAs range from best
  effort (Free) through 99.95% (Premium Dedicated) [S16][S25].
- **CONTRADICTION:** Current pricing marks RBAC available on all Cloud plans, while
  the generic authorization page says WCD uses admin-list access and RBAC will be
  available in a future release [S16][S22]. Pricing and Cloud-specific configuration
  should govern procurement, but this must be verified in the actual tenant before
  relying on fine-grained controls.
- **UNKNOWN:** Public pages reviewed do not reveal Cloud's exact scheduler, replica
  placement, autoscaling thresholds, encryption key hierarchy, backup transaction
  boundary, control-plane tenancy, or incident runbooks. Marketing security claims
  are not substitutes for Trust Portal evidence and executed contract terms.

## 11. Hosted versus OSS and license

- **FACT (high):** The public `weaviate/weaviate` database repository is licensed
  BSD 3-Clause. Source/binary redistribution and modification are permitted with
  notice/disclaimer preservation; names may not endorse derivatives without prior
  permission [S18][S19].
- **FACT (high):** Weaviate Cloud states that it uses the open-source database and
  adds managed hosting plus Embeddings, Query Agent, and Data Import [S16].
- **CAUTION (high):** BSD covers the repository code, not the Weaviate trademarks,
  Cloud control plane, service entitlements, third-party model weights/APIs, customer
  data, or documentation assets. Individual dependencies/modules may carry their own
  notices and conditions.
- **RECOMMENDATION (high):** Curiosity may independently adopt architectural ideas
  and may use or modify BSD code after dependency and notice review. This dossier
  includes no code. Keep any future Weaviate adapter and attributions separate from
  provider-neutral Curiosity contracts; do not imply Cloud equivalence or vendor
  endorsement.

## 12. Curiosity implications and verdict ledger

| Pattern / decision | Evidence type | Verdict | Rationale |
| --- | --- | --- | --- |
| Canonical object plus lexical/vector projections | FACT [S1-S4] | **ADOPTED** | Cleanly separates record retrieval from ranking structures. |
| Shard-local co-location of object, inverted, vector indexes | FACT [S1] | **ADAPTED** | Preserve locality, but hide physical shard semantics behind a store contract. |
| Named vector spaces with independent lineage | FACT [S3][S4] | **ADOPTED** | Supports chunk/content/title/model-specific retrieval without overloading one embedding. |
| Integrated vectorization on DB write/query | FACT [S5][S17] | **DEFERRED** | Convenient, but obscures model work, cost, retries, and drift unless wrapped by a job ledger. |
| BM25F + ANN parallel retrieval | FACT [S6][S7] | **ADOPTED** | Strong baseline for exact and semantic recall. |
| Relative min-max fusion as universal score | FACT + inference [S6] | **REJECTED** | Candidate-relative and uncalibrated; retain branch evidence and tune by query class. |
| Pre-filter allow-list with adaptive ACORN/flat execution | FACT [S8] | **ADAPTED** | Keep declarative filter semantics; adapter chooses algorithm and reports selectivity/profile. |
| Async persistent vector queue | FACT [S2][S12] | **ADAPTED** | Useful for throughput only with explicit projection state and read-your-write policy. |
| HNSW tombstones and background repair | FACT [S12] | **ADAPTED** | Operationally valid, but compliance deletion requires a cross-store purge ledger. |
| Raft metadata + leaderless object replication | FACT [S10][S11] | **DEFERRED** | Mature option, but Curiosity need not reproduce a distributed database initially. |
| Treating read CL=ALL as consistent search | FACT [S11] | **REJECTED** | Candidate generation remains local-index-based. |
| Tenant-per-shard isolation | FACT [S3][S20] | **ADAPTED** | Good lifecycle unit; still requires authz, quotas, audit, and backup policy. |
| Weaviate as canonical provenance archive | Inference | **REJECTED** | Updates, compaction, mutable vectors, and backup retention do not provide immutable capture semantics. |
| Weaviate adapter for derived retrieval projections | Recommendation | **ADOPTED** | Useful when isolated behind provider-neutral indexing/search contracts. |
| Cloud production use | FACT + unknowns [S16][S19] | **DEFERRED** | Requires tenant-level feature checks, DPA/SLA/security review, cost model, and authorized benchmark. |

### Minimum adapter contract

Curiosity's core should express:

```text
index input:
  canonical_record_id + immutable_capture_id + properties
  + embeddings[{space, model_revision, dimensions, digest, vector}]
  + tenant + source_version + desired_projection_version

query input:
  lexical_query? + query_vectors[{space, vector}]
  + typed_filters + branch_limits + fusion_policy + freshness/deletion policy

query trace:
  provider/version + collection/tenant + analyzer/vector-space versions
  + lexical/vector candidates and scores + filter selectivity
  + fusion method/weights/window + shard/consistency settings
  + projection lag/queue observations + warnings

result:
  canonical_record_id + capture_id + branch ranks/scores
  + fused rank (not confidence) + projection_version
```

The adapter must reject or clearly mark objects whose requested named vector is
missing, whose projection predates a purge/update, or whose query depends on an
unobserved async queue. Curiosity—not Weaviate—owns source authority, passage
anchoring, evidence claims, embedding lineage, contradiction handling, and bounded
research stopping.

## 13. Unknowns and validation gates

| Unknown / check | Why material | Required check before adoption |
| --- | --- | --- |
| Cross-structure failure atomicity for object, inverted, and each vector index | Determines orphan/stale projection behavior. | Vendor/source review plus fault-injection in an authorized disposable local cluster. |
| Exact async-index read-your-write semantics across update/delete/recreate | Prevents stale retrieval and resurrection. | Version-pinned lifecycle tests with queue metrics and UUID reuse. |
| Hybrid merge depth per shard and normalization window | Determines ranking stability in sharded collections. | Inspect version-pinned API/source and compare controlled fixtures. |
| HNSW/ACORN/HFresh recall for Curiosity filters and embeddings | Determines evidence recall. | Ground-truth flat-search comparison by query/filter class. |
| Backup-wide point-in-time semantics | Determines recovery correctness. | Obtain explicit vendor statement; test cross-shard write invariants during backup. |
| Purge from tombstones, LSM segments, replicas, offload, and backups | Determines legal deletion claims. | Written retention model and end-to-end deletion drill. |
| Cloud RBAC availability contradiction | Determines least privilege. | Verify actual plan/cluster UI and API; retain evidence in procurement record. |
| Cloud placement, keys, subprocessors, retention, DR, and incident controls | Determines security/compliance fit. | Trust Portal, DPA, BAA if needed, SLA, architecture questionnaire, and contract review. |
| Version and migration compatibility for 1.39 snapshots | Determines rollback/restore safety. | Staged upgrade and restore rehearsal with version matrix. |
| Cost under multiple named/multi-vectors and hybrid traffic | Determines total cost. | Authorized workload model including vector dimensions, storage, backup, embeddings, and egress. |

## 14. Bounded curiosity pass

Score 1 (low) to 5 (high). Priority favored decision relevance, value, and novelty
while penalizing access, legal, and time cost.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify whether ALL consistency applies to search candidate generation | 5 | 5 | 5 | 1 | **Pursued:** docs explicitly say it does not; retained as a central warning [S11]. |
| Reconcile inactive-tenant backup behavior | 5 | 5 | 4 | 1 | **Pursued:** current backup page says included from 1.37; older concept/how-to text conflicts [S3][S14][S20]. |
| Trace deletion beyond API behavior | 5 | 5 | 4 | 1 | **Pursued:** LSM compaction, HNSW tombstone metrics, TTL, and replica conflict rules establish distinct lifecycle stages [S1][S3][S11][S12]. |
| Distinguish Cloud database core from Cloud-only services | 5 | 4 | 3 | 1 | **Pursued:** Cloud and pricing pages identify shared OSS core plus managed/service additions [S16][S17][S19]. |
| Resolve Cloud RBAC contradiction | 5 | 5 | 4 | 2 | **Pursued to public-source limit:** pricing says all plans; generic auth page says future. Requires tenant/vendor verification [S16][S22]. |
| Reconstruct private Cloud autoscaler and scheduler | 2 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** proprietary, unnecessary for adapter decision, and not available through sanctioned sources. |
| Copy or port Weaviate HNSW/ACORN implementation | 2 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** user prohibited implementation/code copying; architecture lessons suffice. |
| Run local fault injection or paid Cloud benchmarks | 4 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** no live-test authority; deferred behind explicit validation plan. |
| Inspect every module/dependency license | 3 | 4 | 2 | 4 | **DEFERRED:** mandatory before code reuse/deployment, but no code is reused here. |
| Treat vendor recall/scale claims as proof | 2 | 2 | 2 | 1 | **CURIOSITY_NO_GO:** no adoption decision depends on unreplicated marketing benchmarks. |

**Stop condition:** Requested architecture dimensions are covered and material claims
triangulate across concepts, operations, Cloud, pricing, and license sources. Further
high-value answers require version-pinned source analysis, an executed Cloud contract,
or authorized empirical tests, so research stopped on coverage and access exhaustion.

## 15. Primary source ledger

All sources are first-party and were accessed **2026-08-17**. Documentation is
mutable; version-specific statements should be rechecked before implementation.

- **[S1]** Weaviate, [Storage](https://docs.weaviate.io/weaviate/concepts/storage) —
  shard components, LSM, WALs, HNSW snapshots, lazy loading.
- **[S2]** Weaviate, [Indexing](https://docs.weaviate.io/weaviate/concepts/indexing),
  [inverted indexes](https://docs.weaviate.io/weaviate/concepts/indexing/inverted-index),
  and [vector indexes](https://docs.weaviate.io/weaviate/concepts/vector-index) —
  index families, async indexing, HFresh, property indexes.
- **[S3]** Weaviate, [Data structure](https://docs.weaviate.io/weaviate/concepts/data) —
  objects, schema, UUIDs, references, named vectors, TTL, tenants.
- **[S4]** Weaviate, [Vectorizer and vector index configuration](https://docs.weaviate.io/weaviate/manage-collections/vector-config)
  and [vector-index reference](https://docs.weaviate.io/weaviate/config-refs/indexing/vector-index) — named/multi-vectors, source properties, index settings.
- **[S5]** Weaviate, [Modules](https://docs.weaviate.io/weaviate/concepts/modules) —
  optional extension types, dependencies, bring-your-own vectors.
- **[S6]** Weaviate, [Hybrid search concepts](https://docs.weaviate.io/weaviate/concepts/search/hybrid-search) —
  parallel branches, fusion methods, alpha, thresholds.
- **[S7]** Weaviate, [Keyword search (BM25)](https://docs.weaviate.io/weaviate/concepts/search/keyword-search) —
  BM25F, tokenization, stopwords, parameters, operators, boosts.
- **[S8]** Weaviate, [Filtering](https://docs.weaviate.io/weaviate/concepts/filtering) —
  allow-lists, ACORN, sweeping, flat cutoff, Roaring indexes.
- **[S9]** Weaviate, [Update objects](https://docs.weaviate.io/weaviate/manage-objects/update)
  and [delete objects](https://docs.weaviate.io/weaviate/manage-objects/delete) —
  mutation and deletion API semantics.
- **[S10]** Weaviate, [Horizontal scaling](https://docs.weaviate.io/weaviate/concepts/cluster) —
  shard/replica trade-offs, UUID hashing, placement, node discovery.
- **[S11]** Weaviate, [Replication architecture](https://docs.weaviate.io/weaviate/concepts/replication-architecture)
  and [consistency](https://docs.weaviate.io/weaviate/concepts/replication-architecture/consistency) —
  Raft, leaderless object replication, CLs, query caveat, repair, deletion conflict, movement.
- **[S12]** Weaviate, [Monitoring](https://docs.weaviate.io/deploy/configuration/monitoring) —
  queue, tombstone, LSM, module, replication, backup, and cluster metrics.
- **[S13]** Weaviate, [Persistence](https://docs.weaviate.io/deploy/configuration/persistence) —
  volumes, disk-pressure behavior, access strategy.
- **[S14]** Weaviate, [Backups](https://docs.weaviate.io/deploy/configuration/backups) —
  backends, live/incremental mechanics, restore, tenant-version caveat.
- **[S15]** Weaviate, [Production environments](https://docs.weaviate.io/deploy/production) —
  Kubernetes support and production responsibilities.
- **[S16]** Weaviate, [Weaviate Cloud](https://docs.weaviate.io/cloud) —
  managed/OSS relationship and shared/dedicated boundary.
- **[S17]** Weaviate, [Weaviate Embeddings](https://docs.weaviate.io/weaviate/model-providers/weaviate/embeddings) —
  Cloud-only import/query vectorization and model behavior.
- **[S18]** Weaviate, [public database repository](https://github.com/weaviate/weaviate) —
  public package layout, database/API claims, BSD license declaration.
- **[S19]** Weaviate, [BSD-3-Clause license](https://github.com/weaviate/weaviate/blob/main/LICENSE)
  and [pricing](https://weaviate.io/pricing) — license terms, Cloud plans, limits,
  pricing dimensions, service additions, SLAs.
- **[S20]** Weaviate, [Multi-tenancy operations](https://docs.weaviate.io/weaviate/manage-collections/multi-tenancy) —
  tenant CRUD, state, data isolation, references, backup wording.
- **[S21]** Weaviate, [Authentication](https://docs.weaviate.io/deploy/configuration/authentication) —
  API key, OIDC, anonymous, Cloud defaults.
- **[S22]** Weaviate, [Authorization](https://docs.weaviate.io/deploy/configuration/authorization) —
  RBAC/admin-list/anonymous and conflicting WCD note.
- **[S23]** Weaviate, [RBAC overview](https://docs.weaviate.io/weaviate/configuration/rbac) —
  resources, permissions, roles, tenant/collection separation.
- **[S24]** Weaviate, [Kubernetes production-readiness self-assessment](https://docs.weaviate.io/deploy/production/kubernetes/production-readiness) —
  HA, TLS, secrets, backup, monitoring, and capacity checks.
- **[S25]** Weaviate, [Security](https://weaviate.io/security) — Cloud encryption,
  backups, monitoring, availability-zone, and compliance claims; vendor claims, not
  independent audit evidence.

## 16. Verification record

- Read the repository constitution before research and changed only this dossier.
- Triangulated storage and deletion claims across concepts, operational metrics,
  replication, and backup documentation.
- Retained negative results and contradictions rather than smoothing them: Cloud
  RBAC availability; inactive-tenant backup wording; no published globally atomic
  backup theorem; no guarantee that ALL consistency merges search candidates.
- Verified the OSS license from the repository's license text, not a third-party
  license catalog.
- Performed no paid/free API call, cluster deployment, benchmark, credential use,
  private-interface access, or code copying.
