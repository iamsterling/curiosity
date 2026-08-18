# Elasticsearch: clean-room architecture and licensing study

**Research date / source access date:** 2026-08-17  
**Decision:** which Elasticsearch architecture patterns are useful to Curiosity,
and which source, licensing, operational, and product-coupling risks rule out
direct reuse.  
**Scope:** current Elasticsearch 9.x/main documentation and source-license
metadata, with version checkpoints at 7.10.2, 7.11.0, 8.15.5, 8.16.0, and 9.0.0.
Kibana, Elastic Cloud, and other Stack products are considered only where they
change an Elasticsearch boundary.  
**Status:** comparison-only research; not implementation, legal advice, a
benchmark, or permission to copy source.

## 1. Decision frame, method, and labels

### Bounded sub-questions

1. What are the durable storage, shard, segment, replication, coordination, and
   cluster-state boundaries?
2. How do ingest, lexical/vector/hybrid retrieval, fusion, and reranking compose?
3. What do updates, deletes, refreshes, commits, recovery, and snapshots actually
   guarantee?
4. Which distributed-operation and security responsibilities remain with a
   self-managed operator?
5. Exactly which source and release artifacts are Apache-2.0, AGPLv3, SSPLv1,
   or Elastic-License-2.0, by relevant version and component?
6. Which ideas may Curiosity adopt or adapt clean-room, and which should it
   reject or defer?

### Method and boundaries

Primary Elastic documentation, version-tagged repository license files, current
repository license metadata, Elastic's license texts/FAQs, the OSI AGPL record,
the SSPL text, and Apache Lucene 10.3.1 API documentation were read. No cluster
was deployed, no paid feature was invoked, no benchmark was run, and no Elastic
or Lucene source code was copied. Public APIs and architectural concepts are
described in original words. All web sources in the ledger were accessed
2026-08-17.

The rolling `main` documentation contained features marked through Elastic Stack
9.5.1. A statement marked simply “current” below therefore describes the
documentation observed on the access date, not every 8.x or 9.x minor. Explicit
availability markers are retained where material.

Labels:

- **FACT** — stated by a cited primary source or directly present in a cited
  license file.
- **INFERENCE** — bounded synthesis from facts, not independently exercised.
- **RECOMMENDATION** — a Curiosity design or governance choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Executive conclusion

**RECOMMENDATION — ADAPT the boundaries, REJECT source-level imitation (high
confidence).** Elasticsearch's strongest transferable lesson is the separation
of concerns across a replicated logical shard, immutable per-shard segments,
explicit visibility/durability checkpoints, a small consensus-managed metadata
plane, and a composable retrieval/ranking plane. Its current retriever tree is a
particularly useful product abstraction: bounded candidate generators feed
explicit fusion, rescoring, reranking, pinning/rules, and diversification rather
than hiding all ranking in one opaque score [S1, S2, S15].

The architecture also exposes costs Curiosity should not inherit accidentally:
shard fan-out, global metadata publication, merge amplification, delete debt,
near-real-time rather than immediate search visibility, expensive distributed
top-k reduction, and license-tier coupling in advanced vector/inference features.
Partial search results may still return HTTP 200, and a snapshot is a per-shard
view across an interval rather than a transactionally exact whole-cluster instant
[S5, S8, S13].

The licensing conclusion must be stated precisely:

- Elasticsearch **source before 7.11** defaulted to Apache-2.0 outside X-Pack,
  and Elastic produced separate `-oss` Apache-2.0 binaries [S20].
- **7.11 through 8.15** changed that default source to the choice of SSPLv1 or
  ELv2; X-Pack-only files remained ELv2, and the Apache OSS distribution ended
  [S21, S22, S26].
- **8.16 and current 9.x/main** add AGPLv3 as a third choice for the source files
  whose headers permit it. The repository default is AGPLv3-only **or** SSPLv1
  **or** ELv2 at the user's choice; some files are Apache-compatible; files
  solely under ELv2 occur in `x-pack` [S23–S25].
- Elastic's **official/default release distributions remain ELv2**. The AGPL
  addition applies to eligible source, not to the official binary distribution
  as a whole. Elastic's Apache-2.0 client libraries are a separate component
  class [S26].

Consequently, “Elasticsearch is AGPL” and “Elasticsearch is open source” are
both dangerously incomplete component-level claims. Eligible core source has an
OSI-approved AGPL option; ELv2-only X-Pack source and the ELv2 distribution are
source-available/proprietary-licensed, not made OSI-open-source by proximity.
Curiosity should rely on documentation and independently designed contracts,
not inspect-and-port implementation work. If any Elasticsearch source is ever
used, legal review must select one license per file and trace every dependency;
this report does not authorize that path.

## 3. System and storage architecture

### 3.1 Index, shard, and replication group

**FACT (high):** Elasticsearch stores JSON documents in indices. An index has a
mapping and settings and is partitioned into primary shards. Each shard is a
self-contained Lucene index. Every document belongs to exactly one primary
shard; a primary may have zero or more replica shard copies. The primary count is
fixed at index creation while replica count is dynamically adjustable. Replicas
provide redundant copies and serve reads [S3].

**FACT (high):** an indexing operation is routed—normally using the document
ID—to one replication group. The receiving/coordinating node sends it to that
group's primary. The primary validates and executes locally, then sends the
operation in parallel to every copy in the master's current in-sync set. It
acknowledges after those copies succeed; failed copies must be removed from the
in-sync set before acknowledgement. A stale primary's replica operations are
rejected using primary authority/term checks [S5].

**INFERENCE (high):** the unit of write serialization and recovery is the shard
replication group, not the whole index. This supports scale but gives no general
multi-shard transaction. Curiosity should not model an “index write” as a single
atomic distributed event.

### 3.2 Lucene segments and physical field structures

**FACT (high):** a shard's Lucene index is a collection of segments plus a
commit point. Each segment is independently searchable. Segment cores are
immutable; additions create new segments, while live-document and doc-values
updates are per-commit state. Background merges combine smaller segments,
renumber live documents, and reclaim dead space from deletes and updates [S4,
S18].

**FACT (high):** Lucene's principal structures are purpose-specific: postings
and a term dictionary form the inverted index; stored fields retrieve values by
document ID; doc values are column-oriented for sorting/faceting and some
filtering; points use a k-d-tree family for numeric/range/geo access; and kNN
vector values provide nearest-neighbor access. Internal document IDs are
segment-local and can change on merge, so they are not durable application IDs
[S18].

**INFERENCE (high):** Elasticsearch is not one universal index. A mapped field
materializes one or more specialized structures. Curiosity should make each
physical representation and its storage/update cost explicit rather than imply
that adding a sort, facet, vector, highlight, or range capability is free.

### 3.3 Refresh, flush, commit, and translog

These terms are not interchangeable:

| Mechanism | What it does | Main guarantee |
| --- | --- | --- |
| Lucene/Elasticsearch refresh | writes buffered content to a new segment and opens it | search visibility, not a durable Lucene commit |
| Elasticsearch flush | performs a Lucene commit and starts a new translog generation | shortens/rebases crash recovery |
| translog fsync/commit | persists operation history needed after the last Lucene commit | durability of acknowledged recent writes under configured policy |
| segment merge | rewrites segments into fewer/larger segments | search efficiency and dead-space reclamation, not visibility semantics |

**FACT (high):** refresh makes operations since the prior refresh searchable.
Self-managed Elastic Stack defaults to a one-second refresh interval for indices
searched in the previous 30 seconds; Serverless defaults to five seconds for the
request `refresh` behavior described by Elastic. `refresh=true` forces affected
primary and replica shards and can create costly tiny segments; `wait_for` waits
for a refresh and is generally less disruptive [S4, S17].

**FACT (high):** all index and delete operations are written to each shard
copy's translog after Lucene processing and before acknowledgement. With default
`index.translog.durability=request`, success is reported only after the translog
is fsynced and committed on the primary and every allocated replica. `async`
permits acknowledged operations since the previous periodic sync to be lost on
failure. Automatic flush performs the expensive Lucene commit and rotates the
translog [S16].

**INFERENCE (high):** “write returned”, “get can observe”, “search can observe”,
and “survives a process/host failure” are distinct states. Curiosity should name
these states in its write contract and avoid an overloaded `committed` flag.

### 3.4 Cluster state: metadata plane, not data path

**FACT (high):** cluster state contains node identity/attributes, cluster-wide
settings, index mappings/settings, and every shard copy's location/status. Only
the elected master changes it. The master processes one batch at a time,
broadcasts an update, obtains enough master-eligible acknowledgements to commit,
then instructs nodes to apply it. Updates normally publish diffs; joining or
out-of-date nodes receive full state [S7].

**FACT (high):** the default publication timeout is 30 seconds; failure to commit
within it causes the master to stand down. A committed update can still leave a
node lagging; the documented default follower-lag timeout is 90 seconds before
removal. High-throughput index/delete/search normally bypass the master and use
the replicated state already present on each node [S7].

**FACT (high):** all nodes can coordinate requests. Dedicated coordinating-only
nodes still receive full cluster state, participate in publication
acknowledgement, and need CPU/heap for scatter/gather reduction. Adding too many
can therefore burden the metadata plane rather than merely add free load
balancers [S6].

**INFERENCE (high):** cluster-state cardinality is an architecture budget. Index,
mapping, field, shard, alias, pipeline, and node proliferation can turn metadata
coordination into a bottleneck even when indexed bytes are modest. Curiosity
should bound control-plane object count and keep large mutable policy/config
payloads outside consensus state.

## 4. Ingest and indexing path

**FACT (high):** ingest pipelines are ordered processor chains that transform or
enrich a document before indexing. Nodes with the `ingest` role execute them;
heavy workloads can use dedicated ingest nodes. Pipeline definitions live in
cluster state. Processors run sequentially, stop on failure by default, and
support processor- or pipeline-level failure branches. A request-selected or
index default pipeline runs before an index final pipeline [S9].

**FACT (high):** data nodes perform CRUD, search, and aggregation. A bulk request
reduces protocol overhead but its individual items are still routed to their
target primaries/replication groups. The stages remain coordinating, primary,
and replica; completion of an earlier stage includes completion of later stages
[S5].

**FACT (high):** text fields are analyzed at index time into terms for the
inverted index. Current `semantic_text` fields additionally hide inference-field
plumbing: they select a dense or sparse representation from the inference
endpoint, generate embeddings during indexing, and chunk long text. The mapping
can exist without a suitable license, but indexing/reindexing can then fail when
it calls a license-gated Inference API [S10, S30].

**INFERENCE (medium):** convenience field types collapse model identity,
chunking, inference availability, vector schema, and index lifecycle into one
mapping. This improves ergonomics but increases replay and migration risk. The
docs themselves warn that an unspecified default endpoint may change for newly
created indices, producing mixed-model ranking behavior [S30].

**RECOMMENDATION (high):** Curiosity should keep its canonical document,
extraction, chunking, embedding, and index-view versions explicit. Inference
failure must not make the authoritative source record disappear; derived index
views should be replayable from immutable evidence.

## 5. Search execution and retrieval

### 5.1 Distributed scatter/gather

**FACT (high):** the node receiving a read resolves target shards, selects one
active primary or replica copy per replication group (adaptive replica selection
is the default), sends shard-level requests, and combines results. Search is a
two-phase scatter/gather operation coordinated by the receiving node. Adaptive
selection considers prior network response time, prior search service time, and
search-thread-pool queue size [S5, S6, S8].

**FACT (high):** search concurrency grows with shard fan-out. The documented
default maximum concurrent shard requests per node is five, and operators can
set a hard shard-count limit. Deep `from`/`size` pagination forces each shard to
retain its own candidates for earlier pages; Elastic recommends `search_after`
with a point in time for deep pagination [S8, S12].

**FACT (high):** if a shard read fails, the coordinator retries another copy.
Search, multi-search, and multi-get may return partial results with HTTP 200;
clients must inspect `timed_out` and `_shards`, not treat transport success as
complete evidence [S5].

**RECOMMENDATION (high):** Curiosity's provider-neutral response needs explicit
`complete`, timeout, attempted partitions, failed partitions, and degradation
fields. Never infer evidence completeness from HTTP status.

### 5.2 Lexical retrieval

**FACT (high):** lexical/full-text search analyzes both indexed text and queries,
uses Lucene's term dictionary/postings, and normally ranks relevant text with
BM25-style scoring. Filters are binary and can avoid score contribution; full
text contributes relevance. Lucene postings can carry block impacts that permit
skipping blocks whose maximum possible score cannot beat the competitive
threshold [S11, S18].

**INFERENCE (high):** lexical retrieval remains a low-cost, explainable,
high-precision lane for names, identifiers, quotations, and rare terms. It is
not a legacy fallback to remove when vectors are introduced.

### 5.3 Dense and sparse vector retrieval

**FACT (high):** `dense_vector` supports brute-force exact scoring and indexed
approximate kNN. Elasticsearch uses HNSW for its HNSW index types; current 9.x
also supports flat variants and `bbq_disk`, a clustered, disk-oriented binary
quantized option. Quantization choices include int8, int4, and one-bit BBQ, with
raw values retained on disk for reindexing and rescoring. Similarities include
L2, dot product, cosine, and maximum inner product [S14].

**FACT (high):** defaults changed across 9.x: 9.0 float vectors defaulted to
`int8_hnsw`; 9.1 used `bbq_hnsw` at 384+ dimensions and `int8_hnsw` below; the
rolling docs mark `bbq_disk` as a later default where the current license permits
it. `bbq_disk` itself requires an Enterprise subscription [S14].

**FACT (high):** `sparse_vector` stores weighted features for learned sparse
retrieval such as ELSER. In 9.1+, new indices default to token pruning using
frequency and weight thresholds. Sparse-vector fields support specialized query
use rather than normal sorting/aggregation and preserve reduced precision
[S29].

**INFERENCE (high):** “vector search” does not identify one algorithm or cost
profile. Exact/ANN, dense/sparse, graph/flat/clustered-disk, quantization,
oversampling, rescoring, and license tier are separate choices. Curiosity's
retrieval plan must record all of them in reproducibility metadata.

### 5.4 Hybrid fusion and retriever trees

**FACT (high):** retrievers entered `_search` in 8.14 and became generally
available in 8.16. A retriever specification forms a tree. First-stage standard
and kNN retrievers generate candidates; compound retrievers combine or reorder
children. Current documented types include RRF, linear, pinned, rule, rescorer,
text-similarity reranker, and preview diversification [S1, S2].

**FACT (high):** RRF combines child ranks without requiring score comparability.
Its `rank_window_size` controls each input list and trades relevance for work;
`rank_constant` controls the influence of lower-ranked items. Current 9.2 docs
also permit per-child RRF weights [S15].

**FACT (high):** linear fusion computes a weighted sum of normalized child
scores. Available normalizers are none, min-max, and (from 9.1) L2 norm. Without
normalization, lexical and vector score scales can bias the result. Multi-field
query syntax in 9.1+ separately groups lexical and semantic fields so each group
contributes half after normalization [S2, S28].

**FACT (high):** retriever-tree aggregation semantics are not simply “aggregate
the final top-k”: aggregations use the combination of leaf retrievers as Boolean
`should` clauses. Global top-level `query`, `knn`, `sort`, `search_after`,
`terminate_after`, and `rescore` have restrictions when `retriever` is present
[S2].

**RECOMMENDATION (high):** adapt a typed retrieval DAG with explicit candidate
budgets, fusion windows, normalization, weights, and post-fusion thresholds.
Preserve raw lane rank/score and final rank so relevance failures are auditable.
RRF should be the safe default when score calibration is absent; calibrated
linear fusion is appropriate only with evaluated normalizers and stable score
semantics.

### 5.5 Rescoring, semantic reranking, and diversity

**FACT (high):** semantic reranking is a late top-k stage. Elasticsearch's
current semantic reranker supports cross-encoders, not bi-encoders, and can
rerank lexical, semantic, or hybrid candidates through a
`text_similarity_reranker` child or ES|QL `RERANK`. Because cross-encoders are
computationally expensive, Elastic recommends applying them to a small candidate
window [S31].

**FACT (high):** long documents may be truncated by a reranker; a chunk rescorer
can control chunk size and inference cost. The preview diversify retriever uses
maximum marginal relevance to reduce redundancy in a top-N child result set
[S1, S31].

**INFERENCE (high):** retrieval, fusion, relevance reranking, authority/safety,
and diversity are independent objectives. A single final score obscures which
objective removed or promoted evidence.

**RECOMMENDATION (high):** keep reranking bounded and optional, store its model
and prompt/input version, and retain pre-rerank candidates. Diversity should be a
named post-relevance stage with a measurable objective, not random deduplication.

## 6. Updates, deletes, readers, and snapshots

### 6.1 Updates and deletes

**FACT (high):** at the Lucene layer Elasticsearch writes a new document or
deletes an existing one. A document update atomically deletes the old Lucene
document and indexes a full new one. Deleted documents remain dead space until
merge. Elasticsearch soft-deletes recent history so missing replicas and
cross-cluster followers can replay operations [S18, S19].

**FACT (high):** each primary assigns monotonically increasing operation sequence
numbers. A sequence number plus primary term identifies a change, and clients
can condition index/update/delete using `if_seq_no` and `if_primary_term` to
prevent a stale write from replacing a newer version [S32].

**FACT (high):** retention leases track the earliest operation a replica/follower
still needs. A failed copy that returns before lease expiry can often recover by
replaying missing operations; after history is no longer retained it needs a
full shard copy. The documented lease default is 12 hours [S19].

**INFERENCE (high):** update-heavy workloads pay write, delete-marker, search,
and later merge costs. Immutable/versioned records with append-oriented derived
views fit the engine better than frequent in-place mutation.

### 6.2 Point-in-time reads

**FACT (high):** Lucene readers expose a consistent point-in-time view and must
be reopened to see later writes. Elasticsearch PIT pins the relevant search
contexts/segments for repeatable pagination. Open PITs prevent old segments from
being deleted and can consume disk, file descriptors, and heap—especially when
updates/deletes require tracking which documents were live [S12, S18].

**RECOMMENDATION (high):** Curiosity should expose snapshot/read-view IDs only
with explicit TTL and resource budgets. Stable pagination is a leased resource,
not a free cursor.

### 6.3 Snapshots

**FACT (high):** Elasticsearch snapshots copy immutable primary-shard segments
to an off-cluster repository and deduplicate segments across snapshots. Deleting
one snapshot deletes only segments exclusive to it. A snapshot can include
cluster state, indices/data streams, aliases, and feature states, but excludes
transient settings, repository registration, node configuration files, and
security configuration files [S13].

**FACT (high):** a snapshot is not a single exact cluster instant. Each shard is
captured at some point between the snapshot's start and end times. Unavailable
primaries fail the attempt; relocating/starting shards are waited on, and a shard
being copied is not relocated until its copy completes [S13].

**FACT (high):** Elastic states the built-in snapshot mechanism is the only
supported reliable cluster backup; copying node data directories, even around
filesystem snapshots, does not satisfy cluster-wide consistency requirements.
Restores are forward-version constrained and index creation-version compatibility
is separate from snapshot-version compatibility [S13].

**RECOMMENDATION (high):** Curiosity backups should be repository-managed,
content-addressed, immutable-object snapshots with a manifest that records each
partition's capture boundary. Do not claim global point-in-time consistency
unless the write protocol actually creates it.

## 7. Distributed operations and failure model

**FACT (high):** discovery finds nodes, elects a master, bootstraps the first
voting configuration, and publishes cluster state. Decisions use quorum voting;
production bootstrapping must be explicit because auto-bootstrapping is unsafe.
High availability requires at least three master-eligible nodes, at least two of
which are not voting-only [S6, S33].

**FACT (high):** shard allocation assigns copies to nodes; relocation creates
and recovers a target copy before deleting the source; recovery initializes from
local data, a primary, relocation, snapshot restore, or index clone/shrink/split.
Awareness and allocation filters can spread copies across failure domains [S34].

**FACT (high):** adaptive replicas improve read latency, but a write waits for
all copies in the current in-sync set. Therefore one slow replica can slow the
replication group. Conversely, read efficiency comes from executing against only
one active copy per group. A concurrent read can observe a primary-local write
before client acknowledgement; an isolated stale primary can briefly expose an
unacknowledged write until demotion is learned [S5].

**INFERENCE (high):** Elasticsearch offers robust shard-level availability, not
linearizable whole-index semantics. Recovery time depends on retained operation
history, immutable-segment reuse, network/disk limits, and shard size. More
shards improve placement granularity only up to the point where metadata,
fan-out, heap, and recovery scheduling dominate.

**RECOMMENDATION (high):** Curiosity should define:

1. a fixed partition key and versioned routing algorithm;
2. an explicit per-partition primary/lease or consensus authority;
3. acknowledged-write and searchable-read semantics;
4. an in-sync/eligible-copy invariant;
5. bounded partial-result behavior;
6. failure-domain-aware placement; and
7. recovery checkpoints that choose operation replay before full transfer.

Do not reproduce Elasticsearch's broad role matrix until scale measurements
justify it. Separate control, ingest, query coordination, and storage as logical
resource pools first; dedicated deployable roles can follow.

## 8. Security architecture

**FACT (high):** Elasticsearch security covers authentication, RBAC authorization,
API keys, TLS, secure settings, and (depending on tier) audit logging, external
realms/SSO, document/field-level controls, and advanced remote-cluster security.
Security is enabled automatically on first startup in Elasticsearch 8.0+ when
automatic setup applies [S35, S36].

**FACT (high):** Elasticsearch exposes a REST/HTTP layer (normally port 9200)
and a node transport layer (normally 9300). Multi-node transport uses mutual TLS
for node authentication and encryption; a production-mode secured cluster will
not start without transport TLS. HTTP TLS is strongly recommended but remains an
operator responsibility in self-managed installations. Elastic Cloud manages
transport/HTTP TLS and encryption at rest; self-managed Elasticsearch does not
provide at-rest encryption itself and points operators to disk and repository
encryption [S35, S37].

**FACT (high):** Basic includes encrypted communications, RBAC, native/file
authentication, API-key management, and secure settings. The current
subscription matrix places audit logging, LDAP/AD/PKI, SSO, attribute-based
access, field/document-level security, custom realms, FIPS mode, and advanced
remote-cluster security in paid tiers [S38].

**INFERENCE (high):** source availability, runtime entitlement, and operational
security are three different axes. Seeing a security implementation in source
does not establish a free runtime entitlement; a Basic feature does not remove
certificate, key, host, network, backup, and audit responsibilities.

**RECOMMENDATION (high):** Curiosity must be secure by default without license
gates around baseline controls: authenticated service identity, least-privilege
RBAC, tenant/document policy enforcement, mTLS internally, TLS externally,
encrypted disks/backups, scoped/expiring API credentials, secret stores,
tamper-evident audit, and explicit remote-provider trust boundaries. Search
results and indexed content remain untrusted data even when the cluster is
authenticated.

## 9. Licensing: exact component and version map

This section reports license metadata, not a legal conclusion.

### 9.1 Timeline

| Version / artifact | Source default | X-Pack-only source | Official distribution |
| --- | --- | --- | --- |
| 7.10.2 and earlier checkpoint | Apache-2.0 outside X-Pack | Elastic License | two builds existed; `-oss` excluded X-Pack and was Apache-2.0; default build included Elastic-licensed code |
| 7.11.0–8.15.x | choice of SSPLv1 or ELv2 | ELv2-only | ELv2; no Apache OSS distribution |
| 8.16.0–current 9.x/main | choice of AGPL-3.0-only, SSPLv1, or ELv2 by eligible file; some Apache-compatible files | ELv2-only files occur only under `x-pack` | ELv2 default release, not an AGPL whole-distribution grant |

**FACT (high):** the version-tagged files establish each row directly [S20–S25].
The 2021 Elastic FAQ says 7.11 replaced the Apache source default and ended the
Apache distribution. The 2024 FAQ says AGPL was added before 8.16, only to the
free/previously dual-licensed source portions, while official releases continue
under ELv2 [S26].

### 9.2 What the three current choices mean

- **AGPLv3-only:** OSI-approved strong copyleft. If a modified covered program
  supports remote interaction, section 13 requires offering its Corresponding
  Source to remote users. Conveyed modified works have broader source and
  same-license duties. This is a license option only for files whose headers
  permit it [S27].
- **SSPLv1:** a source-available copyleft-like license with a much broader
  service-source obligation: providing the program as a service requires source
  for the program and management/UI/API/automation/monitoring/backup/storage/
  hosting layers sufficient to run the service. Elastic itself states SSPL is
  not OSI-approved [S26, S39].
- **ELv2:** permits use, copying, distribution, making available, and derivative
  works, but prohibits providing the software as a hosted/managed service that
  exposes a substantial feature set, bypassing license-key controls, and
  removing notices. It is not OSI-approved [S40, S41].

**FACT (high):** triple licensing is alternative, not cumulative: for an
eligible source file a user selects one offered license. It does not turn an
ELv2-only file into AGPL, and it does not relicense third-party Apache-compatible
files [S23–S26].

### 9.3 Components and common classification errors

1. **Repository core/default files:** inspect each header. Current repository
   default is AGPL-3.0-only/SSPLv1/ELv2 choice, but exceptions exist [S24].
2. **`x-pack`:** contains additional modules/plugins. The top-level license says
   solely ELv2 files are found only there; this does **not** mean every file in
   `x-pack` has identical terms, so file headers remain controlling [S24].
3. **Official Elasticsearch binaries:** ELv2 release terms. A source-build under
   AGPL is not the same artifact/license proposition as downloading Elastic's
   default distribution [S26, S40].
4. **Client libraries:** Elastic says its clients remain Apache-2.0. Verify the
   particular client repository/tag rather than inheriting the server's license
   label [S26].
5. **Apache Lucene:** a distinct Apache Software Foundation dependency and
   project, not “the Apache-licensed part of current Elasticsearch.” Its public
   APIs support comparison, but Lucene attribution and license obligations still
   apply to actual reuse [S18].
6. **Features versus source:** the subscription matrix governs runtime feature
   entitlement; source-file license governs copyright permission. For example,
   current docs mark `bbq_disk` Enterprise and inference calls may be license
   gated even though mapping syntax is visible [S14, S30, S38].
7. **Trademark:** “Elasticsearch” is a protected mark. Elastic permits truthful
   referential phrases such as “for Elasticsearch” or “compatible with
   Elasticsearch” when accurate and non-endorsing, but prohibits using the mark
   as a product name and specifies attribution [S42].

**UNKNOWN (medium):** this study did not produce a machine-generated inventory
of every current file header, generated artifact, bundled dependency, model,
connector, or plugin. The repository-level rule is not a substitute for a
release bill of materials. Model weights and hosted inference services may carry
separate terms not resolved here.

## 10. Clean-room and comparison risks

### Risk register

| Risk | Why it matters | Control | Confidence |
| --- | --- | --- | --- |
| Porting implementation after source inspection | eligible core may be AGPL/SSPL/ELv2; X-Pack can be ELv2-only | use public behavior/docs; independent spec and implementer; no source-derived pseudocode | high |
| Treating APIs as permission to clone internals | interface knowledge does not license implementation expression or trademarks | provider-neutral behavior contract; independent naming and data model | high |
| Mixing AGPL and proprietary Curiosity code | derivative/combined-work and network-source obligations require legal analysis | do not import/link/copy; legal review before any dependency | high |
| Selecting SSPL for a hosted service | service-source obligation can reach management layers | reject SSPL dependency for hosted Curiosity absent executive/legal approval | high |
| Redistributing official binaries as “AGPL” | official distribution is ELv2 | preserve artifact-level license and notices; never re-label | high |
| Copying X-Pack ranking/security/vector code | some X-Pack code is ELv2-only and feature entitlements may also apply | no source copying; independently derive from public papers/general IR practice | high |
| Trademark confusion | product naming can imply affiliation | comparison-only nominative use plus attribution; no Elastic mark in Curiosity product names | high |
| Patent/algorithm assumption | public papers and API docs do not clear all patent claims | patent review for consequential exact mechanisms; prefer standard/public-domain techniques | medium |
| Test contamination | golden responses copied from a live product can encode expressive fixtures or terms-restricted data | synthetic independently authored fixtures and property tests | medium |

**RECOMMENDATION — REJECT (high):** do not fork Elasticsearch, copy Java classes,
translate source, reproduce proprietary X-Pack modules, or use source structure
as an implementation blueprint for Curiosity.

**RECOMMENDATION — ADOPT (high):** factual compatibility testing against a
lawfully operated Elasticsearch instance can be isolated in an optional adapter
test suite, but provider-neutral contracts and owned retrieval code must not
depend on proprietary distribution internals or paid-only behavior.

Suggested clean-room record:

1. this report and cited public specifications are the research-side input;
2. an architecture owner writes requirement-level behavior without source
   symbols, class layout, magic constants, or copied examples;
3. an implementer who has not inspected Elasticsearch source builds the owned
   design from general IR/distributed-systems literature;
4. reviewers retain source/access dates, independent test provenance, license
   scan results, and explicit non-copy attestations.

## 11. Curiosity implications and verdicts

### ADOPT

1. **Immutable versioned search views (high).** Treat segments/snapshots as
   manifestations of immutable document versions, with merge/compaction outside
   the logical evidence identity.
2. **Explicit visibility and durability states (high).** Separate accepted,
   replicated, durable, searchable, and snapshot-covered checkpoints.
3. **Typed retrieval DAG (high).** Candidate lanes, filters, fusion, reranking,
   diversity, and final truncation each have independent bounds and traces.
4. **Partition-level failure accounting (high).** Return partial-result status
   and failed partitions alongside results.
5. **Content-addressed incremental backup (high).** Deduplicate immutable index
   objects while preserving a partition manifest and compatibility metadata.
6. **Control/data plane separation (high).** Keep small consensus metadata away
   from high-throughput search/index traffic.

### ADAPT

1. **Primary-backup replication (medium-high).** Useful if Curiosity owns a
   mutable serving index, but start with fewer roles and stronger explicit
   fencing/lease semantics.
2. **RRF and calibrated linear fusion (high).** Make RRF the score-agnostic
   baseline; permit linear fusion only with offline evaluation and normalization
   telemetry.
3. **PIT/search-after (high).** Use bounded leases and stable content IDs rather
   than expose physical document IDs.
4. **Ingest pipelines (high).** Keep transforms composable but version them
   outside consensus state and preserve the raw immutable input.
5. **Soft-delete/replay recovery (medium-high).** Retain operation history by an
   explicit byte/time budget, then fall back to partition snapshot transfer.
6. **Dedicated resource pools (medium).** Separate workloads logically now;
   split deployable roles only after measurements.

### REJECT

1. **Source or source-structure reuse (high).** License and clean-room risk
   outweigh comparison value.
2. **Shard-per-tenant/index-per-small-unit defaults (high).** Metadata and
   scatter/gather amplification are unacceptable without measured need.
3. **HTTP-200-as-complete (high).** Completeness is an application invariant.
4. **Opaque one-score ranking (high).** Preserve per-stage reasons and rank
   lineage.
5. **Model defaults without identity pinning (high).** Embedding/rerank model,
   chunker, and normalization versions are evidence metadata.
6. **Paid-license-gated baseline security (high).** Curiosity's minimum security
   cannot depend on commercial feature unlocks.

### DEFER

1. **HNSW/quantization/vector-on-disk implementation (high).** Use a provider-
   neutral vector adapter or independently selected permissive library until
   corpus/latency measurements justify ownership.
2. **Learned sparse model hosting (medium).** Evaluate open model licenses,
   relevance, languages, and operating cost separately.
3. **Cross-cluster replication/federated search (medium).** Defer until the
   single-cluster evidence and failure contract is stable.
4. **GPU vector indexing and late-interaction rank vectors (medium).** Current
   and specialized; no Curiosity requirement or benchmark yet.
5. **Serverless/stateless Elasticsearch internals (low-medium).** Public docs
   confirm managed abstraction and current source tree contains ELv2 X-Pack
   stateless modules, but this pass found insufficient clean, license-neutral
   detail for a reliable architecture conclusion.

## 12. Unknowns and required checks before decisions

### Known unknowns

- Exact current serverless separation of compute, object storage, cache,
  metadata, and recovery control is not publicly specified at a level safe for a
  clean-room reconstruction.
- Exact distributed execution of every compound retriever, cross-shard fusion
  optimization, and failure mode was not established from public reference docs.
- Current defaults differ by 9.x minor, deployment type, index mode, dimensions,
  and subscription; a deployment must report its effective mappings/settings.
- No relevance, recall, indexing throughput, merge cost, recovery time, or
  snapshot restore benchmark was run.
- This pass did not map every Elasticsearch module to source header, runtime
  subscription tier, bundled model license, or cloud-service term.
- Legal boundaries of derivative work, API compatibility, patents, AGPL section
  13, SSPL section 13, and ELv2 “substantial set” depend on facts and counsel.

### Checks required before adoption

1. Record the exact target Elasticsearch tag/distribution and inspect its shipped
   `LICENSE`, `NOTICE`, plugin/model terms, and subscription matrix.
2. Obtain counsel for any source use, linking, redistribution, hosted exposure,
   compatibility branding, or modified AGPL/SSPL/ELv2 deployment.
3. Benchmark representative Curiosity corpus partitions for lexical, vector,
   hybrid, update/delete, merge, PIT, partial-failure, snapshot, and restore
   behavior.
4. Fault-inject slow replicas, stale primaries, lost nodes, lagging metadata,
   unavailable shards, inference failure, and repository interruption.
5. Evaluate result completeness and ranking per query class; do not select RRF,
   linear weights, ANN candidate count, or rerank windows by intuition.
6. Threat-model query/document injection, tenant boundaries, API credentials,
   TLS identity, snapshot sensitivity, and inference-provider data transfer.

## 13. Bounded curiosity pass

After synthesis, unresolved threads were scored 1–5 for **relevance (R)**,
**decision value (V)**, **novelty (N)**, and inverse **cost (C; 5 = cheap)**.
Only the best in-frame thread was pursued; research stopped on coverage and
source saturation.

| Thread | R | V | N | C | Action / result |
| --- | ---: | ---: | ---: | ---: | --- |
| Did AGPL begin at 8.16 exactly, and does it cover the distribution? | 5 | 5 | 4 | 5 | **Pursued.** Version-tagged 8.15.5/8.16.0 files plus FAQ resolved: source default changed at 8.16; official release remains ELv2 [S22, S23, S26]. |
| Is one current vector default universal? | 4 | 4 | 3 | 4 | **Pursued within existing source.** No: defaults vary by 9.x minor, dimensions, index mode, and license [S14]. |
| Reverse-engineer stateless/serverless object-store internals from X-Pack | 3 | 3 | 5 | 1 | **CURIOSITY_NO_GO:** ELv2-only contamination risk, weak public specification, and not needed for the current decision. |
| Enumerate every source file's license header | 3 | 4 | 2 | 1 | **CURIOSITY_NO_GO:** release-compliance task requiring a pinned artifact and tooling; repository rule plus explicit unknown is sufficient here. |
| Benchmark Elastic's relevance and recovery claims | 4 | 5 | 3 | 1 | **CURIOSITY_NO_GO:** no caller authority for deployment/paid calls and no representative corpus declared. Deferred as a required check. |
| Investigate individual patents around ANN/BBQ | 3 | 4 | 4 | 1 | **CURIOSITY_NO_GO:** requires counsel and a selected implementation; architecture study cannot clear patents. |

**Stop reason:** all caller-required topics have primary-source coverage; the
remaining high-value questions require a pinned implementation decision,
benchmark authority, or legal review. Additional general documentation produced
diminishing returns.

## 14. Source ledger

All sources accessed 2026-08-17. Elastic pages are primary vendor sources;
version-tagged license files are primary artifact metadata. OSI is authoritative
for its own approval record. Lucene Javadocs describe the underlying library,
not every Elasticsearch wrapper behavior.

- **S1 — Elastic, “Retrievers.”** Current overview, versions, types, and pipeline
  model. <https://www.elastic.co/docs/solutions/search/retrievers-overview>
- **S2 — Elastic, “Retrievers” reference.** Tree semantics, restrictions,
  aggregation and multi-field behavior.
  <https://www.elastic.co/docs/reference/elasticsearch/rest-apis/retrievers>
- **S3 — Elastic, “Index fundamentals.”** Index/shard/replica/segment model.
  <https://www.elastic.co/docs/manage-data/data-store/index-basics>
- **S4 — Elastic, “Near real-time search.”** Segments, commit point, filesystem
  cache, and refresh.
  <https://www.elastic.co/docs/manage-data/data-store/near-real-time-search>
- **S5 — Elastic, “Reading and writing documents.”** Primary-backup replication,
  reads, failures, partial results.
  <https://www.elastic.co/docs/deploy-manage/distributed-architecture/reading-and-writing-documents>
- **S6 — Elastic, “Node roles.”** Master/data/ingest/coordinator roles and
  scatter/gather.
  <https://www.elastic.co/docs/deploy-manage/distributed-architecture/clusters-nodes-shards/node-roles>
- **S7 — Elastic, “Cluster state.”** Contents, publication, diffing, timeout and
  lag behavior.
  <https://www.elastic.co/docs/deploy-manage/distributed-architecture/discovery-cluster-formation/cluster-state-overview>
- **S8 — Elastic, “Search shard routing.”** Adaptive replica selection,
  concurrency, preference, routing.
  <https://www.elastic.co/docs/reference/elasticsearch/rest-apis/search-shard-routing>
- **S9 — Elastic, “Elasticsearch ingest pipelines.”** Pipeline execution,
  storage, defaults/final pipeline, failure handling.
  <https://www.elastic.co/docs/manage-data/ingest/transform-enrich/ingest-pipelines>
- **S10 — Elastic, “The Elasticsearch data store.”** Lucene/document/vector
  database positioning and index/data-stream boundary.
  <https://www.elastic.co/docs/manage-data/data-store>
- **S11 — Elastic, “Full-text search.”** Lexical analysis and search role.
  <https://www.elastic.co/docs/solutions/search/full-text>
- **S12 — Elastic, “Point in time API” and pagination guidance.** Segment pinning
  and stable deep pagination.
  <https://www.elastic.co/guide/en/elasticsearch/reference/current/point-in-time.html>
- **S13 — Elastic, “Snapshot and restore.”** Segment deduplication, contents,
  interval semantics, compatibility, and backup warning.
  <https://www.elastic.co/docs/deploy-manage/tools/snapshot-and-restore>
- **S14 — Elastic, “Dense vector field type.”** HNSW/flat/BBQ, quantization,
  similarity, defaults, subscription marker.
  <https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector>
- **S15 — Elastic, “RRF retriever.”** RRF formula controls, windows and weighting.
  <https://www.elastic.co/docs/reference/elasticsearch/rest-apis/retrievers/rrf-retriever>
- **S16 — Elastic, “Translog settings.”** Acknowledgement durability, recovery,
  flush and fsync.
  <https://www.elastic.co/docs/reference/elasticsearch/index-settings/translog>
- **S17 — Elastic, “The refresh parameter.”** `true`, `wait_for`, `false`, and
  segment cost.
  <https://www.elastic.co/docs/reference/elasticsearch/rest-apis/refresh-parameter>
- **S18 — Apache Lucene 10.3.1, `org.apache.lucene.index` package.** Segment,
  update/delete, reader and field-structure semantics.
  <https://lucene.apache.org/core/10_3_1/core/org/apache/lucene/index/package-summary.html>
- **S19 — Elastic, “History retention settings.”** Soft deletes, leases and
  replay/full-copy fallback.
  <https://www.elastic.co/docs/reference/elasticsearch/index-settings/history-retention>
- **S20 — Elasticsearch v7.10.2 `LICENSE.txt`.** Apache default and separate OSS
  binaries. <https://raw.githubusercontent.com/elastic/elasticsearch/v7.10.2/LICENSE.txt>
- **S21 — Elasticsearch v7.11.0 `LICENSE.txt`.** SSPLv1/ELv2 dual-source default.
  <https://raw.githubusercontent.com/elastic/elasticsearch/v7.11.0/LICENSE.txt>
- **S22 — Elasticsearch v8.15.5 `LICENSE.txt`.** Pre-AGPL dual-source checkpoint.
  <https://raw.githubusercontent.com/elastic/elasticsearch/v8.15.5/LICENSE.txt>
- **S23 — Elasticsearch v8.16.0 `LICENSE.txt`.** AGPLv3/SSPLv1/ELv2 source
  checkpoint. <https://raw.githubusercontent.com/elastic/elasticsearch/v8.16.0/LICENSE.txt>
- **S24 — Elasticsearch current `main` `LICENSE.txt`.** Current repository rule.
  <https://raw.githubusercontent.com/elastic/elasticsearch/main/LICENSE.txt>
- **S25 — Elasticsearch v9.0.0 `LICENSE.txt`.** 9.x source checkpoint.
  <https://raw.githubusercontent.com/elastic/elasticsearch/v9.0.0/LICENSE.txt>
- **S26 — Elastic, “FAQ on Software Licensing.”** 2021/2024 changes,
  distributions, source choices, clients and plugins.
  <https://www.elastic.co/pricing/faq/licensing>
- **S27 — OSI, “GNU Affero General Public License version 3.”** Approval record
  and license text. <https://opensource.org/license/agpl-v3>
- **S28 — Elastic, “Linear retriever.”** Weighted normalized fusion.
  <https://www.elastic.co/docs/reference/elasticsearch/rest-apis/retrievers/linear-retriever>
- **S29 — Elastic, “Sparse vector field type.”** Weighted features, pruning,
  precision and limitations.
  <https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/sparse-vector>
- **S30 — Elastic, “Semantic text field type.”** Inference-field automation,
  chunking, endpoint and license caveat.
  <https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/semantic-text>
- **S31 — Elastic, “Semantic reranking.”** Cross-encoder late stage, retriever and
  ES|QL paths, chunk rescoring.
  <https://www.elastic.co/docs/solutions/search/ranking/semantic-reranking>
- **S32 — Elastic, “Optimistic concurrency control.”** Sequence number and
  primary-term guards.
  <https://www.elastic.co/docs/reference/elasticsearch/rest-apis/optimistic-concurrency-control>
- **S33 — Elastic, “Discovery and cluster formation.”** Discovery, quorum,
  bootstrap and publication.
  <https://www.elastic.co/docs/deploy-manage/distributed-architecture/discovery-cluster-formation>
- **S34 — Elastic, “Shard allocation, relocation, and recovery.”** Allocation and
  recovery lifecycle.
  <https://www.elastic.co/docs/deploy-manage/distributed-architecture/shard-allocation-relocation-recovery>
- **S35 — Elastic, “Security.”** Security responsibilities by deployment type.
  <https://www.elastic.co/docs/deploy-manage/security>
- **S36 — Elastic, “Minimal security setup.”** 8.0 automatic enablement and
  self-managed baseline.
  <https://www.elastic.co/docs/deploy-manage/security/set-up-minimal-security>
- **S37 — Elastic, “TLS encryption for cluster communications.”** HTTP/transport
  channels and mutual TLS.
  <https://www.elastic.co/docs/deploy-manage/security/secure-cluster-communications>
- **S38 — Elastic, “Self-managed subscriptions.”** Current feature/tier matrix.
  <https://www.elastic.co/subscriptions>
- **S39 — MongoDB, “Server Side Public License.”** SSPLv1 text, especially
  service-source section 13.
  <https://www.mongodb.com/legal/licensing/server-side-public-license>
- **S40 — Elastic, “Elastic License.”** ELv2 text.
  <https://www.elastic.co/licensing/elastic-license>
- **S41 — Elastic, “FAQ on Elastic License 2.0.”** ELv2 examples and substantial
  feature-set interpretation.
  <https://www.elastic.co/licensing/elastic-license/faq>
- **S42 — Elastic, “Trademarks.”** Referential use, product naming and
  attribution rules. <https://www.elastic.co/legal/trademarks>

## 15. Overall confidence

**High** for the logical shard/segment/replication/cluster-state model, current
documented retrieval surface, refresh/translog/snapshot distinctions, and the
repository/distribution licensing timeline. **Medium** for implementation-level
performance implications and exact behavior across every 9.x minor because no
cluster was exercised. **Low to medium** for proprietary Serverless/stateless
internals and exhaustive per-feature/per-file licensing; both are explicitly
deferred.

Elasticsearch is a trademark of elasticsearch B.V., registered in the U.S. and
in other countries. This document uses the name solely for truthful comparative
reference and does not imply affiliation or endorsement.
