# Meilisearch architecture: clean-room research dossier

**Research date:** 2026-08-17  
**Decision frame:** what Meilisearch's documented architecture teaches Curiosity
about a bounded, self-owned retrieval system; not whether to copy or deploy
Meilisearch.  
**Product/source baseline:** public Meilisearch documentation as served on the
research date, plus the official repository at commit
`577f7af28942b71782eab1e59f44ad8296ce0a92` (the v1.53.1 version bump) [S32].  
**Status:** research only. No code, index, binary, dataset, or deployment was
copied, executed, or imported.

## 1. Executive verdict

Meilisearch is a single-binary application-search system whose core engine,
`milli`, owns one index while the service layer owns multiple indexes and the
durable task queue. Each index is an LMDB environment. It stores source
documents and several purpose-built derived structures: token-to-document
postings, prefix postings, positional/proximity postings, facet trees and
bitmaps, FST dictionaries, and a vector store. Long writes are accepted as
tasks, serialized by the scheduler, opportunistically batched, and committed
transactionally; searches continue against committed state [S2-S5].

The strongest lesson is not a particular algorithm. It is the explicit split
between (1) accepted asynchronous mutation, (2) materialized retrieval
structures, and (3) synchronous bounded query evaluation. The main caution is
that Meilisearch is tuned for short, user-facing application queries, not a
transparent public-web evidence engine: only ten query terms are considered,
ranking is lexicographic bucket sorting rather than corpus-relevance scoring,
and source provenance, immutable captures, temporal versions, diversity, and
contradiction evidence are not native concepts [S8,S18].

**Overall verdict for Curiosity:**

| Item | Verdict | Rationale |
| --- | --- | --- |
| Tasked mutation + immutable task receipt | **ADOPT (concept)** | Gives ingest backpressure, observable completion, and retry boundaries. |
| Independent lexical structures for words, positions, prefixes, and facets | **ADAPT** | Useful decomposition, but Curiosity also needs passage/capture/version and policy indexes. |
| FST + edit-distance automaton for bounded typo expansion | **ADAPT after evaluation** | Strong for short UI queries; risky for identifiers, citations, and long research queries. |
| Sequential bucket ranking | **ADAPT only as a deterministic stage** | Explainable, but its uncompensated priorities are too rigid for web evidence ranking. |
| Vector search as an additional channel | **DEFER** | Add only after a lexical/provenance baseline and held-out gain; do not inherit provider calls or opaque fusion. |
| Meilisearch as Curiosity's owned core | **REJECT** | Third-party implementation, product-shaped limits, and no native web provenance/version model. |
| CE as a replaceable benchmark oracle | **ADOPT with license review** | CE is MIT; exact file boundaries and notices still matter. |
| EE sharding/replication code or behavior as a foundation | **REJECT** | BUSL/commercial production boundary; clean-room learning only. |

Confidence in the high-level architecture is **high**. Confidence in exact
on-disk structures at the pinned commit is **high** because the official source
declares them. Confidence in undocumented optimizer, ANN, hybrid-fusion, and
cluster-failover details is **low**; those remain unknown rather than inferred.

## 2. Frame, method, and boundaries

### 2.1 Bounded sub-questions

1. How are mutations accepted, ordered, batched, committed, and observed?
2. What durable retrieval structures are publicly documented or directly
   declared by the pinned official source?
3. How do typo, prefix, filter, facet, and ranking paths work?
4. How are vectors generated, retained, queried, and mixed with lexical hits?
5. What are update, deletion, backup, replication, operational, and security
   boundaries?
6. Which lessons can Curiosity adopt without copying third-party code or
   importing license obligations into an owned implementation?

### 2.2 Evidence method

- Official documentation and the official repository are primary sources.
- Documentation establishes current advertised behavior, not performance or
  comparative superiority. Vendor examples and quality claims are not treated
  as benchmarks.
- Source inspection was confined to architecture declarations and licenses at
  one pinned commit. This report paraphrases behavior; it contains no source
  code or implementation recipe.
- All web sources were accessed 2026-08-17. Documentation is mutable, so URLs
  without a commit pin must be rechecked before a consequential decision.

Labels below mean:

- **FACT** — directly supported by cited official material.
- **INFERENCE** — reasoned synthesis, not directly promised or measured.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

## 3. System decomposition and data flow

### 3.1 Control path

**FACT (high):** the internal `milli` library manages exactly one index and can
process one update at a time; the layer above it is responsible for storing
updates and managing multiple indexes [S3]. The public service converts index
creation, settings changes, document adds/updates/deletes, index swaps, dumps,
and snapshots into asynchronous tasks [S2].

```text
write API
  -> durable task receipt (uid, type, index, enqueue time)
  -> global scheduler / priority rules
  -> compatible consecutive-task batch
  -> one-index milli update
  -> LMDB transaction commit or failure with no database change
  -> terminal task + optional webhook
```

Tasks move through `enqueued`, `processing`, then `succeeded`, `failed`, or
`canceled`. On process restart, a processing task returns to `enqueued` and is
retried. Cancellation and task deletion are themselves atomic asynchronous
tasks. Normal tasks are FIFO, but cancellation, upgrade, task deletion,
compaction, export, snapshot, and dump work have documented priority ordering
[S2].

**FACT (high):** consecutive tasks may auto-batch only when index, task type,
and content type are compatible; order inside the batch is preserved.
Delete-by-filter closes a batch and runs independently [S2,S14].

**INFERENCE (high):** a successful write response means “accepted into the
mutation system,” not “search-visible.” Clients must retain the task UID and
wait for a terminal state. Curiosity should make that distinction explicit in
its indexing contract.

### 3.2 Query path

The documented query path is:

```text
query text
  -> language-aware tokenization / normalization
  -> word, prefix, typo, synonym, phrase candidate expansion
  -> optional filter bitmap restriction
  -> lexical and/or vector candidate retrieval
  -> sequential ranking buckets (or semantic/hybrid fusion)
  -> facet aggregation, formatting, pagination
  -> JSON hits
```

**FACT (high):** tokenization is the first indexing step. Charabia splits by
writing system and applies language-specific pipelines; separators,
non-separators, and a dictionary are configurable [S6].

**INFERENCE (medium):** because the same normalized terms feed FST lookup and
postings, tokenizer/version changes are index-format changes in practice even
when the HTTP document schema is unchanged. Curiosity should version analyzer
outputs and index manifests, not only API schemas.

## 4. Durable data structures

### 4.1 Storage substrate

**FACT (high):** each index uses LMDB, an ACID transactional key-value store,
through memory-mapped files. Reads are served from the memory map; the OS
controls resident pages. Low-latency SSD/NVMe storage is recommended. Deleted
space becomes reusable inside LMDB but is not automatically returned to the OS
[S4].

The pinned source declares a distinct LMDB environment per `milli` index and
typed databases for the following logical structures [S5]:

| Structure | Architectural role |
| --- | --- |
| External primary key -> internal 32-bit document ID | Stable API identity separated from compact postings identity. |
| Internal document ID -> stored document | Retrieval/display source record, encoded by field IDs. |
| Document-ID universe bitmap | Fast cardinality and set base. |
| Word -> compressed Roaring document bitmap | Core inverted index. |
| Exact-only word -> bitmap | Fields/terms on which typo tolerance is disabled. |
| Prefix -> bitmap and exact prefix -> bitmap | Search-as-you-type materialization. |
| Word pair + proximity -> bitmap | Phrase/proximity ranking support. |
| Word + position -> bitmap | Word-position ranking. |
| Word/prefix + field ID -> bitmap | Attribute ranking. |
| Field ID + word count -> bitmap | Field-length/count criterion support. |
| Numeric/string facet range/group -> document set | Equality/range filtering and aggregation. |
| Per-document facet values | Reverse maintenance path for updates/deletes. |
| Facet string FST + normalized-to-original map | Facet-value type-ahead and presentation. |
| Word FST, stop-word FST, synonym map | Bounded dictionary traversal and expansion. |
| Embedder-name mapping + vector store | Multiple named embedding spaces. |
| Geo structure and shard membership bitmaps | Specialized geo and EE distribution support. |

**FACT (high):** document IDs are unsigned 32-bit internally; the public hard
limit is 4,294,967,296 documents per index. Primary-key values are limited to
511 bytes because they are LMDB keys. Individual filterable values are limited
to 468 bytes [S18].

**INFERENCE (high):** Meilisearch favors denormalized, query-specific indexes
over computing features from stored JSON at query time. The reverse facet maps
also indicate update/delete maintenance is designed as removal of old derived
entries plus insertion of new entries, not an append-only segment model.

**UNKNOWN:** the exact binary encodings, write-amplification formula, merge
heuristics, crash-recovery sequence, and per-structure size contribution were
not characterized. Those are implementation details, not safe design inputs.

## 5. Lexical matching, filtering, facets, and ranking

### 5.1 Typo tolerance

**FACT (high):** indexed terms are held in an FST. At query time Meilisearch
intersects a generated edit-distance automaton with that dictionary rather than
scanning every term. The current internals page specifies Damerau-Levenshtein
behavior. Defaults permit zero typos for 1-4 characters, one for 5-8, and two
for 9+, with a hard maximum of two per word. A first-character typo costs two;
split/concatenated candidates handle some word-boundary mistakes [S7].

Typo tolerance controls candidate inclusion. The separate `typo` ranking rule
orders accepted matches by typo count. It can be disabled globally, for named
words, for attributes, or for numeric terms [S7].

**RECOMMENDATION (high):** Curiosity should not enable fuzzy matching uniformly.
Disable it for URLs, hashes, identifiers, quoted citations, code symbols, and
numeric/version fields. Preserve the original query and expose expansion reason
codes so an agent can distinguish exact evidence from correction candidates.

### 5.2 Prefix behavior

**FACT (high):** only the last query word is treated as a prefix. The default
`indexingTime` mode builds prefix data during indexing, trading index size and
write time for faster query-time prefix search; prefix search can be disabled
[S8]. Prefix and typo matching can operate together on that final token [S7].

**INFERENCE (high):** materialized prefix postings are suitable for interactive
autocomplete but unnecessarily expensive for many research-agent queries.
Curiosity should make prefix expansion a query-class policy, not a universal
index default.

### 5.3 Filters and facets

**FACT (high):** an attribute must be configured as filterable before filter or
facet use. This causes optimized structures to be built during indexing.
Filters first restrict the eligible document set; lexical relevance ranks
within it. Facet distributions count the intersection of query matches and
active filters [S9,S10].

String and numeric facets have distinct structures. The pinned source shows
range/group keys backed by compressed document sets, explicit `exists`,
`is-null`, and `is-empty` sets, reverse per-document values, and an FST for
string facet-value search [S5]. Facet search is string-only, considers only the
first facet-query term, returns at most 100 values, and uses estimated counts by
default unless exact counts are requested [S10,S18].

**FACT (high):** granular filter configuration can disable comparison or facet
search per attribute. Facet search can also be disabled for the entire index;
doing so avoids its additional indexing work while preserving ordinary facet
distributions [S10].

**RECOMMENDATION (high):** Curiosity should use typed policy/freshness/source
facets, but only materialize operators actually needed. Never expose an
unbounded arbitrary-field filter language to an agent; validate field,
operator, depth, list length, and total deadline.

### 5.4 Ranking rules

**FACT (high):** the default ranking sequence is `words`, `typo`, `proximity`,
`attributeRank`, `sort`, `wordPosition`, and `exactness`. Rules are applied as
lexicographic bucket sort: a later criterion breaks ties only within a bucket
left by all earlier criteria. A result separated by an earlier rule cannot
recover through later rules [S11,S12].

- `words`: more query terms first. Matching strategy controls whether terms are
  dropped from the right (`last`, default), all are required, or frequent terms
  are dropped first (`frequency`) [S13].
- `typo`: fewer corrections first.
- `proximity`: closer, ordered terms first.
- `attributeRank`: earlier configured searchable attributes first.
- `sort`: query-requested sort, active only when supplied.
- `wordPosition`: earlier occurrence within an attribute first.
- `exactness`: exact terms before partial variants.

Ranking rules can be reordered and custom ascending/descending field rules can
be appended. Updating ranking rules does not require full reindexing, but many
analyzer/filter/embedder settings do [S11,S17].

**INFERENCE (high):** bucket ranking is explainable but deliberately
non-compensatory. That makes business priority predictable, while making it a
poor sole ranker for public-web evidence where authority, freshness,
specificity, provenance completeness, and diversity may need controlled
trade-offs.

**RECOMMENDATION (high):** adopt deterministic staged ranking, not the exact
rule set: eligibility/policy -> lexical candidate quality -> evidence quality
-> freshness/authority rerank -> near-duplicate clustering -> source diversity.
Return bounded reason classes and an index-manifest ID.

## 6. Vector and hybrid search

**FACT (high):** configuring an embedder causes document vectors to be
generated and stored; changed document content is re-embedded while unchanged
content can reuse cached embeddings. Changing model, source, document template,
dimensions, or pooling may re-embed the full index. Multiple named embedders can
coexist [S15].

Meilisearch supports local/provider/REST embedders and `userProvided` vectors.
User vectors live in reserved `_vectors` data keyed by embedder name; documents
may carry more than one vector per embedder. The caller must provide a query
vector for a `userProvided` embedder. Vector requests can still apply filters
and sort [S16].

**FACT (high):** `semanticRatio` is a per-query value from 0 to 1: 0 is lexical
only, 1 is semantic only, and intermediate values blend channels. The default is
0.5 [S15]. Binary quantization stores one bit per dimension instead of a
full-precision value; enabling it is irreversible for that embedder without
re-vectorizing elsewhere [S19].

**FACT (high, source-specific):** at the pinned v1.53.1 source, newly created
indexes select the `hannoy` vector-store backend; pre-v1.29 data defaulted to
`arroy` and retains an explicit backend marker [S5].

**UNKNOWN (material):** the public pages examined do not specify a stable,
normative hybrid-fusion formula, candidate depths, tie behavior, ANN recall
guarantee, or the `hannoy` algorithm and tuning contract. Marketing phrases
such as “smart scoring” are not sufficient to infer RRF, weighted-score fusion,
HNSW, or exact nearest-neighbor behavior. Do not encode those assumptions.

**RECOMMENDATION (high):** Curiosity should keep vectors as a separately
versioned candidate channel. Record model, dimensions, template, content hash,
normalization, vector/index version, and whether the vector was provider-made or
user-supplied. Fuse only after offline judgment shows incremental recall, and
retain a lexical-only fallback. Never return stored vectors by default.

## 7. Incremental updates and deletes

**FACT (high):** document replacement overwrites the complete document;
top-level partial update merges supplied fields but replaces a supplied nested
object as a whole. Both create absent documents unless `skipCreation` is set.
Single-ID, ID-batch, filter-based, and all-document deletion are asynchronous
[S14].

**FACT (high):** changes to searchable, filterable, sortable attributes, stop
words, synonyms, typo settings, embedder configuration, dictionary, proximity
precision, and token separators trigger full reindexing. Displayed attributes
and ranking-rule changes do not [S17].

**FACT (high):** LMDB does not return deleted pages to the OS automatically.
Manual index compaction reclaims fragmentation, requires temporary disk roughly
equal to the index size, remains searchable, but blocks later indexing tasks in
the queue. Compaction is never automatic [S20].

**INFERENCE (medium):** ordinary document mutation is logically incremental,
but “incremental” does not mean low-cost: one changed field may touch word,
position, prefix, facet, and vector structures. Settings can force total
rebuilds, and repeated mutation creates storage fragmentation.

**RECOMMENDATION (high):** Curiosity needs source-of-truth document versions,
idempotency keys, content hashes, explicit tombstones, and replayable index
manifests above any mutable index. A search engine's current stored document is
not sufficient citation provenance.

## 8. Snapshots, dumps, exports, and replication

### 8.1 Backup and migration

**FACT (high):** a snapshot is an exact indexed database copy: large and fast
to restore, but supported only by the same Meilisearch version. Self-hosted
instances can schedule snapshots; each new local snapshot overwrites the prior
one. A dump is a smaller portable blueprint containing indexes, documents,
settings, and earlier tasks; restore rebuilds indexes and blocks API startup
until complete [S21-S23].

Dump creation is a global asynchronous task. A completed file is all-or-nothing;
the documented process does not leave a partial dump. API-key material derived
from the master key is not propagated in dumps [S23]. Importing newer-version
dumps into older versions is unsupported. Snapshot/dump staging uses temporary
space, which may be on a different filesystem than the configured destination
[S24].

**RECOMMENDATION (high):** for Curiosity, separate immutable crawl captures and
canonical document versions from rebuildable indexes. Back up manifests,
policy decisions, tombstones, and source records independently. Test restores;
do not treat an index snapshot as the sole corpus archive.

### 8.2 Sharding and replication

**FACT (high):** Community Edition is single-node for this purpose. EE v1.37+
supports a network of named remotes. Sharding assigns subsets to instances;
replication assigns the same shard to multiple remotes. Search fans out and
merges shard results, querying each shard exactly once. One configured leader
accepts writes and topology changes; non-leaders reject writes. Searches may be
sent to any instance [S25].

The documented network supports lexical, filter/facet, hybrid, geo,
multi-search, and tenant-token behavior, with listed caveats. Topology changes
can temporarily produce search errors. All members should use the same version;
cross-version compatibility is not guaranteed [S25].

**UNKNOWN (material):** the examined official overview does not promise
automatic leader election, write failover, quorum semantics, read-your-writes,
cross-replica consistency lag bounds, snapshot coordination, or a recovery point
objective. “High availability” should not be expanded into those guarantees.

**RECOMMENDATION (high):** Curiosity should define its own partition key,
replication/consistency contract, index generation, and partial-shard warning.
Treat distributed search as a failure-aware fan-out with deadline and minimum
coverage, never as an invisible scaling switch.

## 9. Limits and operational profile

**FACT (high):** important current limits/defaults include [S18,S24]:

| Boundary | Current documented value / behavior |
| --- | --- |
| Query terms considered | 10; later terms are ignored. |
| Positions per attribute | 65,535; excess words silently ignored. |
| Attributes per index | 65,536. |
| Documents per index | 2^32. |
| Primary-key value | 511 bytes. |
| Filterable value | 468 bytes. |
| Filter nesting depth | 200. |
| Exact integer range | -2^53 through 2^53 (numbers use double precision). |
| Search queue | Default 1,000 concurrent requests; overflow can return 503. |
| Payload | Default about 100 MB, configurable. |
| Returned searchable hits | Default total ceiling 1,000, configurable by index. |
| Index size | About 80 TiB Linux address-space ceiling; under 2 TiB recommended. |
| Task database | 20 GiB hard documented maximum; cleanup attempted after 1M entries. |

Indexing defaults to at most two-thirds of available RAM and half available
threads, explicitly reserving capacity for search. Larger request batches are
usually faster but consume more RAM. NVMe/SSD and adequate file descriptors are
operationally important [S17,S24]. Prometheus metrics and detailed logs exist,
but some routes/options are marked experimental [S24].

**CONTRADICTION / CHECK:** the task guide says the “task queue” errors at about
10 GiB, while known limitations says the task database supports 20 GiB [S2,S18].
These may denote different thresholds/components or documentation drift; the
sources examined do not reconcile them. Operate against the lower threshold
until verified for the exact release.

**RECOMMENDATION (high):** Curiosity must reject or explicitly truncate before
the engine does. Silent ten-term and 65,535-position truncation is unacceptable
for evidence retrieval unless surfaced in a response warning. Define per-stage
deadlines, request/body/result caps, queue admission, and overload semantics in
the provider-neutral contract.

## 10. Security and trust boundaries

**FACT (high):** production mode requires a master key of at least 16 bytes and
protects every route except health. Development mode may run with every route
unprotected. API keys can be scoped by action, index, and expiry; permissions
and expiry are immutable after key creation, requiring replacement for rotation
[S26,S27].

Tenant tokens are signed short-lived credentials embedding filter rules. They
restrict search results only; they do not authorize administrative operations.
Meilisearch returns stored document content as-is and explicitly delegates HTML
escaping/sanitization to the application [S26]. TLS and optional client
authentication can be configured [S24].

Self-hosted telemetry is enabled unless disabled. Official docs say it sends
system, performance, and feature-usage metrics, not document contents or user
identity; the metric list changes with releases [S28].

**INFERENCE (high):** search-only API credentials and tenant filters are useful
defense layers, but do not make indexed content trusted. A leaked search key may
still permit corpus scraping up to pagination limits, and XSS/prompt injection
survives indexing.

**RECOMMENDATION (high):** place Curiosity's service behind authenticated fixed
origins, least-privilege service identities, TLS, network egress controls, query
and result quotas, and audit logging. Keep tenant/policy filters server-owned.
Mark all returned content untrusted, sanitize presentation, and prevent result
text from changing agent authority. Disable optional telemetry in sensitive
deployments unless separately approved.

## 11. Licensing and clean-room boundary

**FACT (high):** the repository root license is not simply MIT. It declares
`MIT AND BUSL-1.1`: files outside the marked enterprise areas are MIT, while
files explicitly marked EE or in enterprise modules/folders are under the
adapted Business Source License 1.1 [S29,S30].

The BUSL additional-use grant permits non-production testing, development, and
evaluation. Production use requires a commercial agreement. Each covered
version changes to MIT no later than four years after first publication, with
the date evaluated separately per version. The current official edition page
identifies sharding as EE-exclusive [S30,S31]. This report is not legal advice.

Clean-room controls:

1. Learn behavior and public architecture; do not copy, translate, or closely
   paraphrase source code.
2. Pin every inspected source file and retain researcher/implementer separation
   for an independently owned core.
3. Derive specifications from public standards/papers (LMDB concepts, FSTs,
   edit-distance automata, inverted indexes, Roaring-style sets, ANN literature)
   and independently authored fixtures, not Meilisearch code structure.
4. If CE is ever used as a dependency or benchmark binary, review the exact
   file-level license boundary and preserve MIT notices.
5. Do not build on EE sharding/replication code or run it in production without
   a commercial/license decision. Do not infer that a future four-year change
   date has already occurred for the version under review.
6. Product names and logos are not granted by the code license; avoid implying
   Curiosity is Meilisearch or derived from it.

## 12. Curiosity architecture implications

### Adopt

- Durable mutation receipts with terminal status, stable error class, timing,
  affected counts, and safe retry semantics.
- A scheduler that protects query capacity from indexing and has explicit
  priority, batching, cancellation, and retention policies.
- Separate materialized structures for lexical candidates, positions,
  attributes, filters/facets, and later vectors.
- Transactional publication of an index generation so readers never observe a
  half-applied update.
- Compaction/fragmentation metrics and restore drills.

### Adapt

- Use compact internal IDs and set algebra, but map them to immutable
  `document_id`, `capture_id`, and `passage_id`, not only current mutable JSON.
- Use typo/prefix expansion selectively with reason codes and strict term caps.
- Use lexicographic stages for hard policy and deterministic tie-breaks, then a
  transparent relevance model and diversity pass rather than one fixed bucket
  chain.
- Use facets for source class, language, observed time, policy state, and corpus
  coverage; keep high-cardinality provenance in a document store.
- Keep vectors and embedders behind provider-neutral interfaces with model/data
  provenance and lexical fallback.

### Reject

- Silent query/document truncation.
- Treating the current search index as the corpus source of truth.
- Returning unversioned snippets without capture and passage anchors.
- Letting an external embedding provider receive arbitrary sensitive corpus
  text by default.
- Assuming “replication” implies consensus, automatic failover, or bounded lag.
- Copying CE or EE source into a claimed wholly owned core.

### Defer

- ANN backend selection, binary quantization, and hybrid fusion until measured
  on a Curiosity-specific judged set.
- Horizontal sharding until a bounded single-node corpus reaches measured
  capacity limits.
- Learned ranking until labels, counterfactual logging, abuse controls, and
  deterministic fallback exist.

## 13. Unknowns and required checks

| Unknown/check | Why it matters | Required evidence before decision |
| --- | --- | --- |
| Exact hybrid fusion and candidate depth | Changes relevance and reproducibility. | Version-pinned specification or permitted black-box characterization. |
| `hannoy` ANN algorithm/recall contract | Determines vector correctness and tuning. | Official pinned design plus recall/latency benchmark on authorized data. |
| Update write amplification | Controls ingestion cost. | Per-field mutation benchmark with structure-level disk/CPU metrics. |
| Task 10 GiB vs 20 GiB thresholds | Changes overload runbook. | Exact-version test and maintainer clarification. |
| EE leader failure behavior | Determines actual write availability. | Versioned HA/failover specification and fault-injection evidence. |
| Snapshot consistency across a network | Determines cluster RPO/RTO. | Official cluster backup protocol and restore drill. |
| Documentation/version drift | Unpinned docs may describe later behavior. | Archive docs or verify against the deployed release. |
| Relevance for long evidence queries | Product defaults target short queries. | Curiosity judged set with truncation, exact, typo, prefix, and diversity ablations. |
| License boundary of any selected file/binary | Root is mixed-license. | Counsel/dependency review against exact artifact and release. |

## 14. Bounded curiosity pass

After synthesis, gaps were scored 1-5 for **relevance**, **decision value**,
**novelty**, and inverse **cost** (5 = cheap). Only the best in-frame thread was
pursued.

| Thread | R | V | N | C | Score | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Is replication only a Cloud claim, or is there a versioned self-hosted EE topology? | 5 | 5 | 4 | 5 | 19 | **Pursued:** official self-hosted overview establishes EE v1.37+, leader writes, replica selection, topology caveats, and leaves failover semantics unknown [S25]. |
| Resolve hybrid fusion formula from source | 4 | 5 | 4 | 1 | 14 | **CURIOSITY_NO_GO:** high source-analysis cost and contamination risk; not needed to conclude fusion must remain unspecified. |
| Reverse-engineer `hannoy` internals | 3 | 4 | 5 | 1 | 13 | **CURIOSITY_NO_GO:** no official design page found in bounded search; exact ANN choice is deferred. |
| Reproduce vendor latency/quality claims | 3 | 3 | 2 | 1 | 9 | **CURIOSITY_NO_GO:** requires a benchmark corpus and execution authority outside this research frame. |
| Enumerate every API setting | 2 | 1 | 1 | 2 | 6 | **CURIOSITY_NO_GO:** saturation; would not alter the architecture verdict. |

**Stop reason:** coverage and saturation. Every requested category has primary
evidence, a confidence label, material unknowns, and a Curiosity verdict. The
remaining high-value questions require benchmarking, deeper source analysis,
license review, or deployment authority not granted here.

## Sources

All accessed 2026-08-17. Official sources only.

- **[S1]** Meilisearch documentation index,
  <https://www.meilisearch.com/docs/llms.txt>.
- **[S2]** Tasks and asynchronous operations,
  <https://www.meilisearch.com/docs/capabilities/indexing/tasks_and_batches/async_operations>.
- **[S3]** Pinned `milli` README,
  <https://github.com/meilisearch/meilisearch/blob/577f7af28942b71782eab1e59f44ad8296ce0a92/crates/milli/README.md>.
- **[S4]** Storage and LMDB,
  <https://www.meilisearch.com/docs/resources/internals/storage>.
- **[S5]** Pinned `milli` index declarations,
  <https://github.com/meilisearch/meilisearch/blob/577f7af28942b71782eab1e59f44ad8296ce0a92/crates/milli/src/index.rs>.
- **[S6]** Tokenization,
  <https://www.meilisearch.com/docs/capabilities/indexing/advanced/tokenization>.
- **[S7]** Typo-tolerance internals,
  <https://www.meilisearch.com/docs/resources/internals/typo_tolerance>.
- **[S8]** Prefix search,
  <https://www.meilisearch.com/docs/resources/internals/prefix> and
  <https://www.meilisearch.com/docs/capabilities/full_text_search/how_to/configure_prefix_search>.
- **[S9]** Filtering, sorting, and faceting overview,
  <https://www.meilisearch.com/docs/capabilities/filtering_sorting_faceting/overview>.
- **[S10]** Facet behavior and optimization,
  <https://www.meilisearch.com/docs/capabilities/filtering_sorting_faceting/how_to/search_and_filter_together>,
  <https://www.meilisearch.com/docs/capabilities/filtering_sorting_faceting/how_to/facet_search>, and
  <https://www.meilisearch.com/docs/capabilities/filtering_sorting_faceting/advanced/optimize_facet_performance>.
- **[S11]** Built-in ranking rules,
  <https://www.meilisearch.com/docs/capabilities/full_text_search/relevancy/ranking_rules>.
- **[S12]** Bucket sort,
  <https://www.meilisearch.com/docs/resources/internals/bucket_sort>.
- **[S13]** Matching strategies,
  <https://www.meilisearch.com/docs/capabilities/full_text_search/how_to/use_matching_strategy>.
- **[S14]** Add/update and delete behavior,
  <https://www.meilisearch.com/docs/capabilities/indexing/how_to/add_and_update_documents> and
  <https://www.meilisearch.com/docs/capabilities/indexing/how_to/delete_documents_at_scale>.
- **[S15]** Hybrid overview and tuning,
  <https://www.meilisearch.com/docs/capabilities/hybrid_search/overview> and
  <https://www.meilisearch.com/docs/capabilities/hybrid_search/advanced/custom_hybrid_ranking>.
- **[S16]** User-provided embeddings,
  <https://www.meilisearch.com/docs/capabilities/hybrid_search/how_to/search_with_user_provided_embeddings>.
- **[S17]** Indexing best practices and reindex triggers,
  <https://www.meilisearch.com/docs/capabilities/indexing/advanced/indexing_best_practices>.
- **[S18]** Known limitations,
  <https://www.meilisearch.com/docs/resources/help/known_limitations>.
- **[S19]** Binary quantization,
  <https://www.meilisearch.com/docs/capabilities/hybrid_search/advanced/binary_quantization>.
- **[S20]** Index compaction,
  <https://www.meilisearch.com/docs/capabilities/indexing/how_to/compact_an_index>.
- **[S21]** Backup overview,
  <https://www.meilisearch.com/docs/resources/self_hosting/data_backup/overview>.
- **[S22]** Snapshots,
  <https://www.meilisearch.com/docs/resources/self_hosting/data_backup/snapshots>.
- **[S23]** Dumps,
  <https://www.meilisearch.com/docs/resources/self_hosting/data_backup/dumps>.
- **[S24]** Self-hosted configuration reference,
  <https://www.meilisearch.com/docs/resources/self_hosting/configuration/reference>.
- **[S25]** Self-hosted replication and sharding,
  <https://www.meilisearch.com/docs/resources/self_hosting/sharding/overview>.
- **[S26]** Security and tenant tokens,
  <https://www.meilisearch.com/docs/capabilities/security/overview>.
- **[S27]** API-key management and basic security,
  <https://www.meilisearch.com/docs/capabilities/security/how_to/manage_api_keys> and
  <https://www.meilisearch.com/docs/resources/self_hosting/security/basic_security>.
- **[S28]** Telemetry,
  <https://www.meilisearch.com/docs/resources/help/telemetry>.
- **[S29]** Pinned root license,
  <https://github.com/meilisearch/meilisearch/blob/577f7af28942b71782eab1e59f44ad8296ce0a92/LICENSE>.
- **[S30]** Pinned Enterprise license,
  <https://github.com/meilisearch/meilisearch/blob/577f7af28942b71782eab1e59f44ad8296ce0a92/LICENSE-EE>.
- **[S31]** Enterprise and Community editions,
  <https://www.meilisearch.com/docs/resources/self_hosting/enterprise_edition>.
- **[S32]** Official commit record for the source baseline,
  <https://github.com/meilisearch/meilisearch/commit/577f7af28942b71782eab1e59f44ad8296ce0a92>.
