# Chroma: clean-room vector-store and retrieval architecture study

**Research date / official-source access date:** 2026-08-17  
**Decision:** whether Chroma, or Chroma-derived patterns, fit the retrieval and
evidence-index layers of Curiosity's owned public-web search architecture.  
**Scope:** Chroma open source, single-node/client-server Chroma, distributed
Chroma, and Chroma Cloud where product boundaries explain materially different
storage or query behavior.  
**Status:** research and recommendations only; no implementation, live service
test, benchmark, legal opinion, or production change.

## 1. Decision frame and clean-room method

### Bounded sub-questions

1. What are Chroma's collection, record, storage, index, and query contracts?
2. What durability, consistency, transaction, update, and deletion guarantees
   are documented in each deployment mode?
3. Where do embedded, single-node HTTP, distributed open-source, managed Cloud,
   and BYOC responsibilities differ?
4. What scale, operability, security, and license constraints matter to an
   owned web-search system?
5. Which ideas should Curiosity adopt, adapt, reject, or defer without copying
   implementation code or confusing a vector store with a web-search engine?

### Method and boundaries

Only Chroma-controlled primary sources were used: current Chroma documentation,
the official `chroma-core/chroma` repository and license, and Chroma engineering,
security, privacy, and terms pages. Public source was consulted at the
architecture/README/license level; no code was copied, decompiled, executed, or
incorporated. No credentials, Cloud account, API call, network inspection,
private trust material, or destructive test was used. Claims about runtime
quality remain vendor claims unless explicitly marked inference. All web
sources in the ledger were accessed 2026-08-17.

Labels used below:

- **FACT** — directly stated by a cited official source.
- **INFERENCE** — bounded conclusion from facts, not directly guaranteed.
- **RECOMMENDATION** — proposed Curiosity choice.
- **UNKNOWN** — decision-relevant behavior not established by reviewed sources.
- Confidence is **high**, **medium**, or **low**.

## 2. Executive verdict

**RECOMMENDATION — ADAPT as an optional dense-candidate sidecar; REJECT as the
owned web-search or evidence foundation (high confidence).**

Chroma is a collection-oriented retrieval database. It stores a unique record
ID, one dense embedding, optional document text/URI, and typed metadata; it can
filter, retrieve, and perform approximate nearest-neighbor search. Single-node
Chroma uses an in-memory HNSW index plus durable local state; distributed Chroma
separates writes, reads, and compaction around object storage and a write-ahead
log. Chroma Cloud adds a materially richer Search API: schema-controlled
indexes, sparse vectors, hybrid fusion, custom score expressions, grouping,
batch search, and copy-on-write forks [S2–S5, S13, S16–S20].

That is useful retrieval infrastructure, but it is not public-web search. Chroma
does not provide a crawler frontier, robots/publisher policy, immutable raw
captures, URL canonicalization, link graph, duplicate clustering, language and
spam analysis, temporal versioning, source authority, freshness scheduling,
fielded BM25 web ranking, citation offsets/hashes, or evidence-chain semantics.
Its record ID and optional document are application data, not proof that a
result maps to an immutable fetched page.

The fit is therefore narrow:

```text
owned capture + canonical document/version + passage ledger
  -> owned lexical candidate lane (system of record)
  -> optional Chroma dense/sparse candidate lane
  -> explicit fusion/reranking outside provider-specific contracts
  -> policy, authority, freshness, diversity and provenance checks
  -> bounded evidence passages linked to immutable capture IDs
```

Do not put canonical documents, crawl state, legal/policy state, or citation
identity solely in Chroma. If Chroma is piloted, store opaque versioned passage
IDs and retrieval features there; resolve evidence from Curiosity's immutable
store. Begin with the lexical baseline already selected by the owned-search
architecture, then add Chroma only if a judged benchmark demonstrates incremental
recall at acceptable cost and operational risk.

## 3. Product and deployment boundaries

### 3.1 One API family, non-identical systems

| Mode | Process/storage boundary | Documented fit | Material constraints |
| --- | --- | --- | --- |
| Python ephemeral | In-process server, memory only | notebooks/prototyping | no persistence [S21] |
| Python persistent | Embedded client with an on-disk path; automatically loads/saves | local prototyping or bounded applications | local process/disk lifecycle; single-node index limits [S21] |
| Single-node HTTP | Separate Chroma process; clients connect by HTTP; path-backed persistence | small/medium workloads, generally below 10M records across a few collections | one node; HNSW working set must fit RAM; no built-in auth in v1 [S2, S22, S25] |
| Distributed open source | gateway, log, query executors, compactors, SQL system DB, object storage, SSD caches | large production workloads and many collections | operationally substantial; cold-cache latency; separate storage subsystem [S3, S27] |
| Chroma Cloud | managed distributed Chroma in selected AWS/GCP region | serverless managed retrieval | quotas, API keys, usage billing, product-specific features [S16, S26, S28] |
| BYOC | distributed Chroma in customer cloud, operated with Chroma support | data-sovereignty/enterprise workloads | fixed minimum infrastructure and vendor operational access/telemetry [S30] |

**FACT (high):** Chroma documents a consistent high-level API across local,
single-node, and distributed modes, but explicitly says local and distributed
currently use different storage subsystems and may temporarily lack feature or
behavior parity. Engineering focus is predominantly distributed/Cloud [S2,
S27].

**FACT (high):** the new composable `search()` API is Cloud-only as of the
access date; local support is planned. Cloud-only features reviewed here include
the Search API and collection forking. Single-node uses HNSW; distributed and
Cloud use SPANN [S5, S16, S20].

**INFERENCE (high):** “same API” is not a sufficient portability guarantee.
Index algorithm, query surface, schema controls, cold starts, limits, and
operational semantics vary. Curiosity would need a provider-neutral retrieval
contract and capability negotiation rather than exposing Chroma classes or
assuming Cloud queries run identically on local Chroma.

### 3.2 Client/server and embedding boundary

**FACT (high):** Python supports ephemeral and persistent embedded clients plus
synchronous/asynchronous HTTP clients. TypeScript and Rust connect to a running
server. A lightweight Python HTTP-only package omits default embedding-function
dependencies [S21–S23, S31].

**FACT (high):** collections can persist embedding-function configuration. The
classic API accepts raw embeddings or document/query text; direct embeddings
are mandatory when no embedding function is attached. In Cloud Search, text
passed to `Knn` is embedded using the collection schema configuration [S6, S7,
S13, S17].

**UNKNOWN (medium importance):** reviewed documentation does not provide one
normative execution-location rule for every embedding function and every client
mode. Some SDK embedding functions require local dependencies/API keys, while
Cloud schema-backed search can embed service-side. Deployment review must trace
where text and provider credentials travel for the exact client/function pair.

**RECOMMENDATION (high):** Curiosity should generate and version embeddings in
an explicit ingestion service, record model/dimension/normalization provenance,
and send vectors to the store. Do not let an implicit collection default make
the evidence index depend silently on a client package, external embedding API,
or mutable model configuration.

## 4. Data model, collections, and storage anatomy

### 4.1 Namespace and record model

**FACT (high):** the hierarchy is tenant → database → collection. A collection
is the fundamental independent storage/query unit; each item has a unique string
ID, embedding vector, optional metadata, and document. Collection names are
unique within a database. Chroma describes tenant-level isolation, access
control, quota, and billing in distributed deployments [S2, S6].

**FACT (high):** a record must have an ID and at least a document or embedding.
Metadata values may be strings, integers, floats, booleans, or homogeneous,
non-empty arrays of those scalar types. Nested arrays are unsupported.
Embeddings in one collection must have consistent dimensionality [S7, S10].

**FACT (high):** collection configuration includes its embedding function and
vector-index settings. Collection metadata is separate from record metadata.
Collections can be renamed and their metadata and some mutable index settings
modified; deleting a collection deletes its records, embeddings, documents, and
metadata and is documented as irreversible [S6, S8].

**INFERENCE (high):** collection-per-customer or per-security-domain is a
natural isolation and scaling pattern, but collection-per-web-page is not.
Collections are index/scaling units, and Cloud has per-collection concurrency
and record limits. A web corpus should be sharded by a stable operational policy,
not by every document [S3, S28, S32].

### 4.2 Single-node storage and HNSW

**FACT (high):** single-node Chroma uses a fork of `hnswlib` for ANN. The HNSW
embedding index must reside in system RAM for query and update. Documents and
embedding metadata are stored in SQLite; each collection is durably persisted
to disk, including an HNSW index. Available RAM is therefore the practical
upper bound for concurrently active embeddings [S5, S24].

**FACT (high):** supported distance spaces are squared L2 (default), cosine
distance, and inner-product distance. HNSW exposes construction/search breadth,
neighbor count, threads, batch size, persistence sync threshold, and resize
factor. Some query/runtime settings are mutable; construction choices are not
all mutable [S5]. Distances are lower-is-better; they are not calibrated
relevance probabilities [S13, S18].

**FACT (medium):** Chroma's published single-node stress results use 1024-D
vectors, short documents, and three metadata fields. They report approximate
maximum collections from 250k records on 2 GiB to 15M on 64 GiB and low
single-digit-millisecond mean query latency for small collections. The page says
tests extended to roughly 7M embeddings and recommends at least 2 GiB RAM [S24].
These are vendor experiments on specified EC2 instances, not a Curiosity
benchmark or general SLO.

**INFERENCE (high):** local persistence is not equivalent to an immutable
evidence ledger or a complete backup protocol. SQLite state and HNSW files form
a coupled database directory; copying files while writes occur could capture an
inconsistent point unless Chroma documents or supplies a snapshot procedure.

### 4.3 Distributed storage and indexing

**FACT (high):** distributed Chroma comprises a gateway, write-ahead log,
query executors, compactors, and a SQL-backed system database. The log and
materialized indexes live in object storage; services use local SSD as cache.
The system database tracks tenant/database/collection metadata and index
versions [S3].

**FACT (high):** a write is transformed into log operations, persisted to the
WAL, then acknowledged. Compactors asynchronously consume the log and build new
vector, full-text, and metadata index versions in object storage. A query
executor reads materialized indexes and consults the log to include newer
updates. Requests are routed by rendezvous hashing on collection ID to preserve
cache coherence [S3].

**FACT (high):** Chroma identifies the collection as the unit of atomicity and
parallel scaling. `wal3` places separate collection logs under disjoint object
store paths. The current object-store log uses immutable fragments, a mutable
manifest updated with conditional writes, snapshots, cursors that pin history,
garbage collection, and an associative/commutative `setsum` integrity digest.
The official README describes the log as linearizable and intended for a single
writer with multiple readers while remaining correct with concurrent writers
[S4, S29].

**FACT (medium):** the architecture's original workload premise was many
moderate-size, power-law-accessed collections rather than a few billion-record
hot indexes. Object storage adds baseline/cold-start latency, mitigated by SSD
and memory caching [S3, S14].

**INFERENCE (high):** the separation of accepted WAL writes from asynchronously
materialized indexes is the key reusable design, not SPANN or object storage by
itself. Querying the uncompacted tail closes the freshness gap; without that
step, asynchronous indexing would make acknowledged writes temporarily absent.

### 4.4 Cloud schemas and indexes

**FACT (high):** Cloud schema defaults include a dense vector index on the
embedding, FTS on document text, and inverted indexes for string, integer,
float, and boolean metadata. Sparse-vector indexes are opt-in and tied to named
metadata keys. Schema can disable some unused indexes to reduce write overhead,
but is currently set only at collection creation [S15, S19].

**FACT (high):** distributed/Cloud ANN uses SPANN rather than single-node HNSW.
The documentation publishes the conceptual two-level clustered design and
parameters, but says SPANN customization is currently ignored by the server.
Dense vectors can only occupy the default embedding field; multiple named
sparse-vector fields are supported, while multiple dense fields are not [S5,
S18, S19].

**INFERENCE (high):** schema-at-creation and one dense field make embedding
model migrations operationally significant. A safe model upgrade likely needs
a new collection, dual writes/backfill, validation, and cutover rather than an
in-place field addition.

## 5. Write, persistence, transaction, and deletion semantics

### 5.1 Add, update, and upsert

| Operation | Documented behavior | Important edge |
| --- | --- | --- |
| `add` | inserts new IDs; accepts documents, embeddings, or both | existing ID is silently ignored; wrong dimension errors [S7] |
| `update` | changes supplied record properties | missing ID is logged and ignored; document without embedding triggers re-embedding [S8] |
| `upsert` | updates present IDs and adds absent IDs | inherits update/add behavior [S8] |
| delete by IDs | removes embeddings, documents, and metadata | destructive and irreversible at API level [S9] |
| predicate delete | deletes records matching metadata `where` | can be unbounded and expensive; distributed guidance recommends bounded batches [S9, S32] |
| collection delete | removes complete collection | destructive and irreversible at API level [S6] |

**INFERENCE (high):** silent ignore on duplicate `add` and missing `update` is a
poor ingestion acknowledgement contract for an evidence pipeline. An upstream
job can appear successful while desired content was not applied. Curiosity
needs explicit per-item outcomes, idempotency keys, expected-version checks, and
reconciliation counts around any adapter.

**UNKNOWN (high importance):** the reviewed user documentation does not state
whether partial metadata updates merge keys or replace the whole metadata map
in every client/version, nor does it define batch behavior if one item fails
validation. Do not infer atomic all-or-nothing behavior beyond the distributed
architecture's statement that the log ensures atomicity across multi-record
writes [S3]. Verify exact release behavior before adoption.

### 5.2 Durability and visibility

**FACT (high):** persistent local clients automatically save and reload from a
path. The single-node HNSW `sync_threshold` controls when the index synchronizes
with persistent storage. Distributed mode acknowledges after WAL persistence,
then query executors combine indexes with WAL updates for a consistent result
[S3, S5, S21].

**FACT (high):** `wal3`'s contract says acknowledged data must remain readable
until garbage collection, and its object-store representation is append/immutable
apart from coordination manifests. Cursors pin positions against garbage
collection. Integrity checks detect likely missing/corrupt fragments but do not
make object storage infallible [S4, S29].

**UNKNOWN (high importance):** official material reviewed does not define a
complete public consistency matrix: cross-client read-your-writes latency,
snapshot isolation for ordinary reads, ordering across collections, behavior
during collection migration, or the exact recovery point objective for each
deployment. The architecture supports strong-looking per-collection semantics,
but those details require a versioned contract or fault test.

### 5.3 Conditional transactions

**FACT (high):** conditional transactions provide optimistic, collection-scoped
read-check-write. They buffer writes and commit only if records in the read set
have not changed since the read snapshot; conflicts can be retried [S12].

Documented limitations are consequential:

- no transaction spans collections;
- no transactional vector `query`, only `get`;
- no predicate delete; explicit IDs are required;
- no read-after-buffered-write for the same ID;
- at most one buffered write per ID;
- a filter read protects only IDs actually returned, not phantoms that later
  satisfy the predicate [S12].

**INFERENCE (high):** this is optimistic record-set validation, not a general
serializable transaction system. It can protect a document-version compare-and-
swap within one collection, but cannot atomically coordinate crawl state,
canonical documents, lexical indexes, and vector indexes. Curiosity therefore
needs an external ingestion state machine/outbox and reconciliation.

### 5.4 Deletes, garbage collection, and backup

**FACT (high):** Cloud security states that managed data uses S3 versioning,
deletion protection, cross-region replication, SQL streaming replication, and
daily snapshots. It simultaneously tells customers to maintain backups of
critical data [S33]. Local `vacuum` blocks all reads/writes and is normally
unnecessary after current continuous pruning is enabled [S25].

**INFERENCE (high):** “delete is irreversible” describes the public API, not a
provable immediate physical erasure from WAL fragments, snapshots, object
versions, backups, caches, or observability. Physical disposal follows backend
retention/garbage-collection policy.

**UNKNOWN (high importance):** public reviewed sources do not give Cloud backup
retention, customer point-in-time restore procedures/RPO/RTO, delete-erasure
timelines, or a supported consistent online backup recipe for single-node
Chroma. Procurement and operations must resolve these before storing sensitive
or sole-copy evidence.

**RECOMMENDATION (high):** Curiosity's canonical objects and metadata database
remain independently backed up and restorable. Treat Chroma as rebuildable
derived state; exercise full rebuild, incremental replay, delete propagation,
and corrupt-index replacement.

## 6. Query, filtering, and ranking contract

### 6.1 Classic `query` and `get`

**FACT (high):** `query` performs dense ANN from text or supplied vectors;
`get` retrieves without similarity ranking. Query defaults to ten results per
input and accepts multiple query vectors/texts. Both support ID restriction,
metadata `where`, document `where_document`, and field inclusion. `get` supports
limit/offset; classic `query` does not expose pagination [S13].

**FACT (high):** query results are column-major and grouped by input query.
They can include IDs, documents, URIs, metadata, embeddings, and distances.
IDs always return; embeddings are omitted by default because of payload size
[S13, S36].

**FACT (high):** classic metadata filtering supports equality/inequality,
numeric comparisons, membership/non-membership, logical AND/OR, and homogeneous
array contains/not-contains. Missing fields match negative operators such as
`not in`; mixed types under one key have undefined comparison behavior [S10,
S17].

**FACT (high):** document filters support case-sensitive substring and regex,
including negation and AND/OR. In current Cloud Search documentation, patterns
with fewer than three literal characters may return incorrect results; regex
and substring are document-only, not scalar-metadata pattern matching [S11,
S17].

**INFERENCE (high):** these document predicates are useful filters, not a
complete web lexical ranker. Case-sensitive containment/regex lacks documented
tokenization, stemming, language analyzers, field boosts, BM25 scores, phrase
positions, explanations, or corpus-statistics control. It cannot replace the
owned lexical baseline.

### 6.2 Cloud Search API

**FACT (high):** Cloud's `search()` unifies filtered retrieval and KNN in a
typed expression model, supports batch operations, field projection,
limit/offset, grouping/deduplication, score arithmetic, and hybrid fusion. With
no rank expression results are in index order, described as typically insertion
order. Ranked results sort ascending; lower is better [S16–S20].

**FACT (high):** each `Knn` expression has an independent candidate limit,
default 16. A document must occur in at least one component candidate list and
in every component whose missing-value default is unset. This can accidentally
turn multi-lane retrieval into candidate intersection. The final `Search.limit`
is separate from candidate limits [S18].

**FACT (high):** Reciprocal Rank Fusion (RRF) combines rank positions rather
than raw score scales, with configurable weights and smoothing `k` (default 60).
Components must request ranks. Depending on component defaults, documents absent
from a lane may be excluded rather than assigned a fallback [S20].

**FACT (high):** offset pagination is available, but no stable cursor or index
snapshot token is documented. Cloud caps returned results at 300 by default
[S16, S28].

**INFERENCE (high):** repeated offset pages over a changing ANN index are not a
stable export or evidence enumeration mechanism. Records may move, repeat, or
be skipped as writes/compaction change ranking. Use IDs/version checkpoints and
the canonical ledger for exports.

### 6.3 Query-stage risks for Curiosity

1. **Approximation risk.** HNSW/SPANN recall depends on construction/search and
   candidate limits; nearest neighbors can be missed [S5, S24].
2. **Score interpretation risk.** L2, cosine distance, inner-product-derived
   distance, component ranks, and fused expressions have different scales.
   Chroma scores are not relevance confidence [S5, S18, S20].
3. **Filter semantics risk.** missing keys satisfy negative predicates and mixed
   types are undefined; schema discipline is mandatory [S17].
4. **Candidate truncation risk.** Cloud KNN defaults to only 16 candidates,
   while fusion without explicit defaults can intersect candidate sets [S18].
5. **Evidence risk.** a returned document string has no native capture ID,
   extraction version, passage offsets, content hash, or source-rights policy.

**RECOMMENDATION (high):** adapters should return opaque candidate IDs, raw
distance/rank, metric and index/model versions, applied filters, candidate-lane
identity, and truncation indicators. The owned reranker—not Chroma score—should
apply source authority, freshness, policy, duplication, diversity, and final
confidence.

## 7. Scale and operations

### 7.1 Scaling unit and workload shape

**FACT (high):** distributed Chroma shards across collections. Collections have
isolated cold starts and rate limits; Chroma recommends one collection per
customer knowledge base where data is naturally isolated [S32]. Cloud defaults
allow 1,000,000 collections and 5,000,000 records per collection [S28].

**FACT (high):** current Cloud defaults also cap vectors at 4,096 dimensions,
documents at 16,384 bytes, IDs at 128 bytes, 32 record-metadata keys, eight
where predicates, 300 records per write, 300 returned results, and ten concurrent
reads plus ten concurrent writes per collection. Most quotas can be raised on
request [S28].

**INFERENCE (high):** one monolithic public-web collection is misaligned with
default Cloud limits and collection-level throughput isolation. Conversely,
excessive fine-grained collections complicate cross-shard retrieval and global
ranking. A pilot must choose and evaluate an explicit shard/fan-out policy.

### 7.2 Cold starts, cache, and cost

**FACT (high):** distributed indexes/logs are durable in object storage and
cached on SSD/memory. A first query on a cold collection can incur fetch
latency; Chroma suggests optional warm-up queries [S3, S31].

**FACT (medium):** Cloud bills logical writes, queried/returned data, and logical
storage. As accessed, published prices are $2.50/logical GiB written,
$0.0075/TiB queried, $0.09/GiB returned, and $0.33/GiB-month stored. Predicates
add query units, and full-text/regex cost scales with pattern length [S34].
Pricing is volatile and is not a cost forecast.

**INFERENCE (high):** web passage indexing is write-heavy because recrawls,
re-embedding, metadata corrections, and deletes produce churn. Logical-write
pricing and secondary-index overhead matter at least as much as query price.
Derived-state rebuilds must be included in total cost even if background
compaction itself is not separately billed.

### 7.3 Operations and observability

**FACT (high):** self-hosted Chroma exposes OpenTelemetry traces, not a documented
complete metrics suite on the reviewed page. Operator traces are sent only to
the configured destination. Separately, Chroma states that product telemetry
collection ended at version 1.5.4 [S27, S35].

**FACT (high):** a distributed BYOC deployment requires a storage bucket,
relational database, Kubernetes cluster, VPC, Terraform/Terragrunt, Argo CD,
secret manager, compaction/log/query/frontend/system DB services, and garbage
collection. Chroma-managed BYOC exports usage metrics, traces, and CPU/memory
profiles to Chroma's observability platform; Chroma says these exports exclude
sensitive Chroma data [S30].

**INFERENCE (high):** distributed self-hosting is not a drop-in library upgrade;
it is a database platform. Curiosity should not accept this operational surface
until measured scale exceeds single-node or another simpler sidecar and staffing
exists for object-store, SQL, K8s, index-rebuild, compaction, GC, and restore
failure modes.

**RECOMMENDATION (high):** required pilot signals include per-lane recall,
p50/p95/p99 hot and cold latency, WAL tail size/age, compaction lag, cache hit,
index build age, rejected/ignored item counts, delete lag, shard fan-out,
embedding failures, storage/write amplification, and reconciliation drift.
Chroma's documented trace hooks are useful but insufficient as the whole SLO
contract.

## 8. Security, privacy, and tenancy

### 8.1 Self-hosted

**FACT (high):** current v1 self-hosted Chroma does not ship built-in
authentication implementations. Historical auth/authz environment variables
belong to older Python-era configurations. The default listen address is
`0.0.0.0`; reset is disabled by default; CORS and payload limits are operator
configuration [S25].

**INFERENCE (high):** an unprotected single-node server must never be exposed
directly to an untrusted network. TLS, authentication, authorization, tenant
mapping, request limits, audit logging, and network policy must be supplied by a
trusted gateway/service mesh. Chroma's tenant/database names alone are not a
security boundary in a server with no auth implementation.

### 8.2 Cloud and BYOC

**FACT (high):** Cloud clients use API keys scoped with tenant/database context.
Chroma says a single-database key can auto-resolve those values [S21]. Cloud is
offered in AWS US East and GCP Europe West 1; a database remains within its
selected region, though feature availability differs [S26].

**FACT (medium):** Chroma's security statement claims SOC 2 Type II, encryption
in transit and at rest, least-privilege employee access, MFA, logging/threat
monitoring, vulnerability scans, annual penetration testing, and multi-AZ AWS
hosting. It also identifies AWS, Vercel, Honeycomb, and PostHog as key providers
[S33]. These are public vendor assertions; the underlying report and scope were
not reviewed.

**FACT (high):** BYOC keeps storage and data infrastructure in the customer's
cloud but remains managed with Chroma engineering support and exported
operational telemetry [S30]. This is data-plane residency, not zero vendor
operational involvement.

**UNKNOWN (high importance):** public sources reviewed do not fully establish
API-key roles/rotation/audit granularity, private networking for standard Cloud,
customer-managed keys, exact subprocessors by product data path, product-data
retention, incident-notification periods, legal deletion SLA, or whether Cloud
payloads enter product analytics. The 2023 public privacy page primarily covers
the website, not the hosted database [S37, S38].

**RECOMMENDATION (high):** before Cloud/BYOC, obtain and review product terms,
DPA/subprocessor list, SOC report scope, region and support-access controls,
retention/deletion, backup restore, breach notice, key management, private
connectivity, and telemetry field inventory. Store no credentials, private
source text, or legally restricted content until approved.

## 9. License and clean-room transfer

**FACT (high):** the official repository and documentation identify Chroma as
Apache License 2.0. The license grants copyright and contributor patent rights
subject to conditions, including supplying the license, marking changed files,
retaining notices, carrying any NOTICE obligations, and respecting trademark
limits. It includes a patent-litigation termination clause [S1, S27].

**FACT (high):** Chroma says the distributed/serverless architecture is also
available under Apache 2.0 and Cloud runs the same open-source distributed
system [S14, S27]. This does not imply that managed operations, service terms,
marks, datasets, third-party embedding models, or every deployment artifact are
licensed for unrestricted reuse.

**INFERENCE (high):** Apache-2.0 permits more than clean-room learning, but
Curiosity's research task did not authorize incorporation. Conceptual patterns
such as WAL-before-ack, immutable fragments, async compaction, tail overlay,
cache-aware routing, and integrity checks are transferable at the architecture
level. Copying Chroma source, schemas, tests, diagrams, text, or branded API
surface would create attribution, dependency, maintenance, and potentially
third-party-license obligations.

**RECOMMENDATION (high):** if future implementation chooses Chroma as a
dependency, pin versions, preserve Apache attribution/NOTICE, inventory all
transitive licenses and embedding-model terms, isolate the adapter, retain an
SBOM, and document source/patch history in `provenance/`. If Curiosity implements
similar concepts independently, use this document as requirements evidence,
not Chroma source as a coding reference; have different implementers work from
provider-neutral contracts and original literature where appropriate.

## 10. Fit and gaps for Curiosity/web search

### Capability matrix

| Need | Chroma evidence | Verdict for Curiosity |
| --- | --- | --- |
| Dense ANN candidate generation | HNSW single node; SPANN distributed [S5] | **ADAPTED** after lexical baseline and benchmark |
| Sparse/dense hybrid | Cloud sparse indexes + RRF/custom expressions [S18–S20] | **ADAPTED/DEFERRED**; useful pattern, Cloud-specific surface |
| Typed metadata prefilter | rich exact/range/set/array filters [S10, S17] | **ADAPTED** with strict schema and missing-key tests |
| Bounded projection | explicit selected fields; IDs always returned [S13, S16] | **ADOPTED** as provider-neutral response-budget principle |
| Write durability pattern | WAL-before-ack, async index, log-tail reads [S3, S4] | **ADOPTED** as architecture lesson, not copied implementation |
| Rebuildable derived index | collections/indexes separable from canonical source | **ADOPTED** operational posture |
| Immutable web capture/evidence | not supplied | **REJECTED** as source of truth |
| Crawl/discovery/canonicalization | not supplied | **REJECTED** as search foundation |
| Stable lexical web rank | only document FTS/filter plus Cloud sparse lane | **REJECTED** as owned lexical baseline |
| Link/authority/freshness/spam/policy | not supplied | **REJECTED** as final ranker |
| Stable export/pagination | offset only; no snapshot cursor documented | **REJECTED** for evidence enumeration |
| Cross-store transaction | collection-scoped optimistic transaction only | **REJECTED** for ingestion atomicity |
| Secure standalone network service | v1 has no built-in auth | **REJECTED** without external security boundary |

### Recommended record boundary for a pilot

**RECOMMENDATION (high):** one Chroma record should represent a versioned,
bounded passage or chunk, never “the current URL.” Its ID should be an opaque,
deterministic key derived from Curiosity-owned identifiers, for example the
logical tuple `(document_id, capture_id, extractor_version, passage_id)` without
requiring Chroma to interpret it. Metadata should remain compact and typed:
language, observed-time bucket, source/policy class, content family, and shard;
large provenance belongs in the canonical metadata store.

The stored document may be a retrieval copy of passage text, but every returned
ID must resolve to:

- canonical and fetched URL;
- immutable capture/object hash and fetch time;
- extractor version;
- passage byte/text offsets and passage hash;
- rights/policy state;
- embedding model, dimension, normalization, and creation time.

### Pilot gates

1. **Correctness:** exact ID CRUD, duplicate-add, missing-update, partial-batch,
   restart, concurrent write, filter missing-key, type mismatch, and delete
   tests against the pinned release.
2. **Retrieval:** judged lexical-only vs dense-only vs fused recall/NDCG/MRR;
   multilingual, exact-name, navigational, fresh-event, adversarial, and
   near-duplicate slices.
3. **Freshness:** measured write-to-query visibility, uncompacted-tail behavior,
   recrawl replacement, tombstone propagation, and stale-vector detection.
4. **Operations:** hot/cold latency, memory/storage growth, rebuild duration,
   backup/restore, cache loss, compaction delay, index corruption, and capacity
   under shard fan-out.
5. **Security:** gateway enforcement, key isolation, rate bounds, payload limits,
   malicious metadata/document patterns, audit trail, and tenant escape tests.
6. **Exit:** full export/rebuild from canonical state with no reliance on
   Chroma-internal identifiers or score semantics.

**Stop/go rule:** adopt a Chroma adapter only if fused retrieval adds material
quality over the owned lexical baseline, all evidence resolves independently,
write/delete visibility meets freshness targets, rebuild/restore is bounded,
and operations/security are cheaper than a simpler ANN sidecar. Otherwise retain
the learned patterns and reject the dependency.

## 11. Unknowns and required checks

| Unknown | Why it matters | Required check | Confidence that it is unresolved publicly here |
| --- | --- | --- | --- |
| Exact batch failure atomicity in each mode | ingestion may partially apply | pinned-version contract + fault-injection test | high |
| Metadata merge vs replacement semantics | stale keys or accidental deletion | release-specific CRUD test | high |
| Read-your-writes/snapshot matrix | freshness and pagination correctness | vendor contract + concurrent test | high |
| Single-node consistent online backup | sole-copy corruption risk | official procedure or stop-the-world backup/restore drill | high |
| Cloud backup retention/PITR/RPO/RTO | disaster recovery | procurement confirmation + restore exercise | high |
| Physical delete timeline | legal/privacy obligations | DPA/retention/backup/GC confirmation | high |
| ANN recall under Curiosity filters and churn | relevance regressions | judged benchmark with exact-search control | high |
| Stable ordering under equal scores/compaction | reproducibility | pinned corpus repeated-run test | medium |
| Embedding execution/data boundary per client | text/key exposure | data-flow trace for selected EF and mode | high |
| Cloud/BYOC support access and telemetry fields | confidential data exposure | architecture/DPA/telemetry review | high |
| Distributed self-host release/support maturity | operational risk | pinned release runbook, upgrade and DR review | medium |
| Third-party notices/model licenses in chosen build | redistribution/compliance | SBOM and counsel review | high |

## 12. Curiosity pass and stopping record

After the first synthesis, in-frame gaps were scored 1–5 for **relevance (R)**,
**decision value (V)**, **novelty (N)**, and **cost (C)**. Priority is
`R + V + N - C`. The bounded follow-up budget was one documentation branch.

| Thread | R/V/N/C | Priority | Outcome |
| --- | --- | ---: | --- |
| Resolve current self-host auth boundary | 5/5/3/1 | 12 | **Pursued.** Current server configuration confirms v1 removed built-in auth; external boundary is mandatory [S25]. |
| Confirm stable cursor/snapshot pagination | 5/4/3/2 | 10 | **Pursued within existing Search docs.** Only offset is documented; retained as unknown/no stable-cursor claim [S16]. |
| Reconstruct exact SPANN implementation/parameters from source | 3/2/4/5 | 4 | **CURIOSITY_NO_GO.** Public conceptual/config evidence is sufficient; copying or reverse-engineering implementation is unnecessary. |
| Run Cloud/local recall and transaction probes | 5/5/4/5 | 9 | **CURIOSITY_NO_GO.** Requires credentials/runtime state and a predeclared corpus; caller authorized document research only. |
| Inspect private SOC 2 report/DPA | 5/5/2/5 | 7 | **CURIOSITY_NO_GO.** Gated procurement/legal material and no authority; retained as mandatory check. |
| Determine deletion remnants by object-store inspection | 4/5/4/5 | 8 | **CURIOSITY_NO_GO.** Unauthorized active inspection and would not prove policy across backups. |
| Audit every transitive dependency license | 3/4/2/5 | 4 | **CURIOSITY_NO_GO.** No dependency adoption or pinned release exists; defer to SBOM gate. |
| Compare Chroma with every vector database | 2/3/2/5 | 2 | **CURIOSITY_NO_GO.** Outside single-product anatomy and not needed for the web-search-foundation verdict. |

**Stop condition:** coverage achieved for every bounded sub-question; primary
documentation was internally consistent on core architecture; remaining gaps
require a pinned version, live benchmark, procurement access, or legal review.
Further document search reached saturation.

## 13. Source ledger

All sources are official Chroma-controlled sources, accessed 2026-08-17.

| ID | Official source | Material used |
| --- | --- | --- |
| S1 | [Chroma repository LICENSE](https://github.com/chroma-core/chroma/blob/main/LICENSE) | Apache-2.0 terms |
| S2 | [Architecture overview](https://docs.trychroma.com/reference/architecture/overview) | modes, hierarchy, records, scale framing |
| S3 | [Distributed architecture](https://docs.trychroma.com/reference/architecture/distributed) | components, read/write paths, storage, routing, cold cache |
| S4 | [wal3 engineering article](https://www.trychroma.com/engineering/wal3) | object-store WAL, atomicity unit, setsum, GC design |
| S5 | [Configure collections](https://docs.trychroma.com/docs/collections/configure) | HNSW/SPANN, metrics, parameters, mutability |
| S6 | [Manage collections](https://docs.trychroma.com/docs/collections/manage-collections) | lifecycle, namespace, embedding config, destructive delete |
| S7 | [Add data](https://docs.trychroma.com/docs/collections/add-data) | record contract, metadata types, duplicate IDs, dimensions |
| S8 | [Update data](https://docs.trychroma.com/docs/collections/update-data) | update/upsert and re-embedding behavior |
| S9 | [Delete data](https://docs.trychroma.com/docs/collections/delete-data) | ID/predicate delete |
| S10 | [Metadata filtering](https://docs.trychroma.com/docs/querying-collections/metadata-filtering) | classic filter operators and arrays |
| S11 | [Full-text search](https://docs.trychroma.com/docs/querying-collections/full-text-search) | substring/regex document predicates |
| S12 | [Conditional transactions](https://docs.trychroma.com/docs/collections/conditional-transactions) | optimistic transactions and limitations |
| S13 | [Query and get](https://docs.trychroma.com/docs/querying-collections/query-and-get) | classic query/get contract and result shape |
| S14 | [Retrieval powered by object storage](https://www.trychroma.com/engineering/serverless) | workload premise, Arrow/object storage/cache, Apache claim |
| S15 | [Schema overview](https://docs.trychroma.com/cloud/schema/overview) | Cloud schema defaults/mutability |
| S16 | [Search API overview](https://docs.trychroma.com/cloud/search-api/overview) and [pagination/selection](https://docs.trychroma.com/cloud/search-api/pagination-selection) | Cloud-only boundary, projections, offset |
| S17 | [Search filtering](https://docs.trychroma.com/cloud/search-api/filtering) | filter semantics, missing keys, pattern limits |
| S18 | [Ranking and scoring](https://docs.trychroma.com/cloud/search-api/ranking) | candidate limits, score expressions, dense/sparse limits |
| S19 | [Index reference](https://docs.trychroma.com/cloud/schema/index-reference) | index types and schema constraints |
| S20 | [Hybrid Search with RRF](https://docs.trychroma.com/cloud/search-api/hybrid-search) | rank fusion formula and candidate behavior |
| S21 | [Chroma clients](https://docs.trychroma.com/docs/run-chroma/clients) | Cloud, ephemeral, persistent, HTTP clients, regions |
| S22 | [Client-server mode](https://docs.trychroma.com/docs/run-chroma/client-server) | process boundary and clients |
| S23 | [Client-server deployment guide](https://docs.trychroma.com/guides/deploy/client-server-mode) | single-node remote deployment |
| S24 | [Single-node performance](https://docs.trychroma.com/guides/performance/single-node) | HNSW/SQLite anatomy and vendor stress results |
| S25 | [Server environment variables](https://docs.trychroma.com/reference/server-env-vars) and [Vacuum](https://docs.trychroma.com/docs/cli/vacuum) | persistence, reset/CORS, removed auth, maintenance blocking |
| S26 | [Chroma Cloud getting started](https://docs.trychroma.com/cloud/getting-started) | managed boundary, regions, feature differences, vendor recall claim |
| S27 | [Open source](https://docs.trychroma.com/docs/overview/oss) | license, parity roadmap, telemetry removal |
| S28 | [Cloud quotas and limits](https://docs.trychroma.com/cloud/quotas-limits) | current default operational bounds |
| S29 | [wal3 README](https://github.com/chroma-core/chroma/blob/main/rust/wal3/README.md) | log contract, fragments/manifests/cursors/GC/integrity |
| S30 | [Distributed Chroma BYOC](https://www.trychroma.com/engineering/distributed-chroma-byoc) | infrastructure, operations, access, exported telemetry |
| S31 | [General performance guidance](https://docs.trychroma.com/guides/performance/general) | thin client, embedding service, cold warm-up |
| S32 | [Distributed/Cloud performance](https://docs.trychroma.com/guides/performance/distributed) | collection sharding, indexes, bounded predicate deletes |
| S33 | [Chroma Cloud security](https://www.trychroma.com/security) | controls, encryption, DR, providers, customer backups |
| S34 | [Cloud pricing](https://docs.trychroma.com/cloud/pricing) | usage dimensions and accessed prices |
| S35 | [Observability](https://docs.trychroma.com/guides/deploy/observability) | OTel traces and telemetry distinction |
| S36 | [Troubleshooting](https://docs.trychroma.com/docs/overview/troubleshooting) | HNSW recall failure, omitted embeddings, SQLite/pruning |
| S37 | [Website privacy](https://www.trychroma.com/website-privacy) | website-policy scope and analytics |
| S38 | [Website terms](https://www.trychroma.com/website-terms) | product terms explicitly separate from site terms |

## 14. Final confidence

- **High confidence:** deployment boundaries; collection/record model; classic
  CRUD/filter/query surface; HNSW vs SPANN split; distributed WAL/compaction
  architecture; Cloud Search features/limits; Apache-2.0; self-host auth gap.
- **Medium confidence:** production performance, durability, recall, security,
  and operational-quality claims because the evidence is vendor-authored and no
  live or independent test was authorized.
- **Low confidence / intentionally unknown:** exact transaction failure behavior,
  stable pagination under writes, metadata patch semantics by release, Cloud
  restore/erasure SLAs, and complete hosted-data privacy terms.

**Final verdict:** **ADOPT** the bounded-response, WAL-before-ack,
async-compaction-plus-tail, integrity-verification, and rebuildable-index
principles. **ADAPT** Chroma only as a version-pinned optional retrieval adapter
after benchmark gates. **REJECT** Chroma as crawler, canonical source, evidence
ledger, lexical web-search foundation, final authority/freshness ranker, or
directly exposed self-hosted service. **DEFER** Cloud/BYOC, sparse hybrid, and
distributed deployment until scale, security/procurement, restore, and judged
quality evidence justify them.
