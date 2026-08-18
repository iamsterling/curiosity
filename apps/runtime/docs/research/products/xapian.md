# Xapian search engine/library: clean-room product research

- **Research date:** 2026-08-17
- **Official sources accessed:** 2026-08-17
- **Version baseline:** Xapian 2.1.0 (released 2026-08-13), with 1.4.32 as the
  previous stable series. [S1]
- **Method:** Behavioural and architectural synthesis from Xapian's public
  documentation, generated API reference, release notes, licence, and
  high-level source declarations. No Xapian source code or encoding procedure
  is reproduced here.
- **Decision frame:** What should Curiosity learn from Xapian, and what—if
  anything—may it safely adopt without importing Xapian's GPL implementation or
  accidentally inheriting its operational constraints?

## Executive verdict

Xapian is a mature, embeddable lexical retrieval library rather than a hosted
search product. Its durable design is a compact inverted index with an explicit
separation between (1) term-to-document postings, (2) document-to-term lists,
(3) positions, (4) per-document value streams, and (5) opaque stored document
data. Search combines a rich query tree with pluggable statistical weighting;
BM25 is the default. Glass is the general-purpose, incrementally writable,
copy-on-write disk backend. Honey, introduced in 2.0, is a compact read-only
backend produced from Glass. Remote databases distribute matching; replication
copies a single writable Glass master to read-only replicas. [S2][S3][S4][S5]

The strongest lessons for Curiosity are architectural, not implementational:

1. **ADOPT** a provider-neutral distinction between searchable terms,
   positional evidence, sortable/filterable typed values, and display payload.
2. **ADOPT** bounded query expansion and explicit resource budgets. Xapian
   exposes expansion limits but leaves wildcard and fuzzy expansion unlimited
   by default; Curiosity should make limits mandatory and fail closed. [S6]
3. **ADAPT** Xapian's one-writer/many-reader revision model into immutable
   search snapshots plus an explicit publication pointer. Do not inherit its
   two-revision reader limitation or shard-local transaction semantics. [S2][S7]
4. **ADAPT** its unique-term upsert pattern: map a stable external identity to
   one searchable identity term, but retain an authoritative provider-neutral
   ID registry and idempotency contract outside any one index adapter. [S8][S9]
5. **ADOPT** the operational principle that display payload belongs in one
   stored blob/object fetch, not scattered across sort/filter value slots. [S10]
6. **REJECT** copying source, on-disk formats, protocol encodings, parser code,
   matcher code, or backend algorithms. Xapian is GPL-2.0-or-later, and the
   2.1.0 build's `--disable-gpl-libxapian` option explicitly still produces a
   GPL-containing build. [S1][S11][S12]
7. **DEFER** using Xapian as a binary/library dependency until counsel reviews
   the exact distribution, linking, deployment and source-offer model. Running
   a private server is materially different from distributing a linked
   application, but this document is not legal advice.

**Overall confidence:** high for public API, current release, data model, Glass,
Honey, transaction and licence facts; medium for implementation-level
performance explanations; low for performance relative to Curiosity's actual
corpus because no representative benchmark was run.

## 1. Product boundary and lineage

### Facts

- Xapian describes itself as an open-source search engine **library**, written
  in C++, with language bindings. It exposes indexing and search primitives,
  while Omega is the packaged application built on it. [S1]
- The official project history says Xapian evolved from Open Muscat; the
  contributor file attributes the earlier code to a BrightStation team. [S13]
- Version 2.1.0 is the current stable release as of the research date. The 2.0
  series was a consequential break: it replaced the matcher, removed Chert,
  added Honey, added extended wildcard/edit-distance queries, changed the
  remote protocol, and required C++17. [S1][S5]
- The API is a toolkit rather than a schema. Applications decide term prefixes,
  stored-data structure, value-slot allocation, identity-term conventions,
  parser features and weighting parameters. [S6][S8][S10]

### Inference

Xapian's longevity comes partly from keeping the retrieval kernel below the
application schema. That is directly relevant to Curiosity's provider-neutral
contracts: a retrieval core should consume normalized documents and queries,
not encode provider-specific concepts into the posting layer.

### Recommendation

Treat Xapian as a design reference and potential isolated adapter, not as the
definition of Curiosity's document or query contract.

## 2. Database and backend architecture

### 2.1 Backend matrix

| Backend/facility | Current role in 2.1 | Updates | Main operational properties | Verdict |
|---|---|---:|---|---|
| **Glass** | Default general disk backend | Yes | Compressed postings in copy-on-write B+-tree tables; crash-safe normal mode; one writer/many readers; transactions; replication; directory or read-only compacted single-file form | **ADAPT** concepts; do not copy format |
| **Honey** | New compact disk backend from 2.0 | No | Created by compacting Glass; read-only; more restrictive WDF invariant; supports the read-side table families | **ADAPT** as immutable optimized-segment idea |
| **InMemory** | Test/small temporary database | Yes, but limited | Official guide calls it inefficient; lacks transactions, spelling, synonyms and replication | **REJECT** for production architecture |
| **Remote** | Transparent client/server database | Server-dependent | `prog` (e.g. SSH pipe) or TCP transport; most query work is remote; writable mode exists; not replication | **DEFER**; useful conceptually for shard fan-out |
| **Stub database** | Text indirection/composition | N/A | Names local/remote databases; supports atomic pointer replacement and multi-database composition | **ADOPT** publication indirection concept |
| **Chert** | Legacy 1.2/1.4 backend | Removed in 2.0 | Must be converted using 1.4 before migration | **REJECT** |

Sources: [S2][S3][S5][S14].

### 2.2 Glass

#### Facts

- Glass stores logical tables in separate `.glass` files. The posting table is
  mandatory; termlist is default but optional; docdata, positions, spelling and
  synonyms are created only when data exists. The default B-tree block size is
  8 KiB and can be selected from 2–64 KiB. [S3][S15]
- The posting table also stores chunked value streams. The termlist table stores
  the terms and used value slots for each document. [S3]
- The backend uses copy-on-write block storage, preserving an old revision
  while a new one is formed. Normal commits publish a consistent revision;
  readers see a fixed snapshot. [S2][S15]
- A compacted Glass database can be made into one read-only file, including at
  a non-zero offset inside another file. This reduces open-file overhead and
  makes transport convenient; it does not intrinsically save disk space. [S3][S7]
- Glass's high-level 2.1 source declaration independently identifies compressed
  postings, B-tree storage, and separate posting, position, termlist, spelling,
  synonym and docdata managers. It also identifies a changeset manager for
  replication. [S16]

#### Inference

Copy-on-write is serving three purposes at once: atomic publication, reader
isolation, and recovery without an application WAL. Separate optional tables
avoid paying position/spelling/storage costs for collections that do not need
them. The design is optimized for lexical retrieval and filesystem page cache,
not arbitrary row access.

#### Curiosity implication

Use immutable segment/snapshot publication as an internal contract, but keep
storage engines replaceable. Optional capabilities (`positions`, `spelling`,
`stored_payload`, `values`) should be declared per index, not assumed.

### 2.3 Honey

#### Facts

- Honey was added in 2.0 and currently cannot be incrementally updated. It must
  be produced from Glass by `xapian-compact`/the compaction API. [S5][S7]
- A Honey term must either always have WDF 0 (a boolean term) or never have WDF
  0. Xapian says this permits more compact posting encodings. [S5]
- Current high-level source declarations show Honey has docdata, posting,
  positions, spelling, synonyms, termlist and values managers analogous to the
  Glass read model. It has no writable database class in that declaration. [S17]

#### Inference

Honey represents a deliberate build-versus-serve split: mutable indexing pays
for update headroom; serving compacts to a more constrained immutable form.
This resembles an immutable segment tier more than a primary database.

#### Recommendation

**ADAPT** the lifecycle, not the format: build mutable state, validate it,
compact into immutable artifacts, then atomically publish. Preserve old
artifacts for rollback. Whether a second physical format is worth Curiosity's
complexity remains **DEFERRED** pending benchmarks.

### 2.4 In-memory, remote, sharding and stubs

#### Facts

- The in-memory backend was originally for tests; official docs recommend a
  disk backend on a RAM disk over InMemory for production because features and
  efficiency are limited. Transactions currently throw as unimplemented. [S2][S7]
- A `Database` may contain multiple shards. Read operations combine shards;
  writable additions are assigned round-robin. Transaction and commit atomicity
  are guaranteed only within each shard, not across shards. [S7]
- Remote access supports a child program/pipe or TCP server. The client uses the
  regular query API, while most matching occurs server-side. Current 2.0 notes
  say remote shards are waited on in parallel and their MSet results merged.
  [S5][S14]
- Stub database files compose local and remote databases and can act as an
  atomically replaceable pointer to a newly built physical database. [S2]

#### Inference

Xapian deliberately treats federation as result merging rather than a single
distributed transaction system. This is appropriate for search availability,
but external consistency and cross-shard write recovery remain the caller's
problem.

#### Recommendation

Curiosity should expose shard identity, snapshot revision and partial-failure
status in retrieval results. Never imply cross-provider or cross-shard atomicity
from an adapter that only offers shard-local commits.

## 3. Core index model: postings, termlists, positions, values and data

### 3.1 Document planes

| Plane | Direction | Stored evidence | Typical use | Curiosity mapping |
|---|---|---|---|---|
| Posting list | term → ordered documents | docid and WDF; collection statistics around the list | candidate generation and scoring | lexical inverted index |
| Termlist | document → ordered terms | terms, WDF and used value slots | delete/replace diff, expansion, introspection | reverse manifest per indexed revision |
| Position list | (document, term) → positions | word-like term positions | phrase/near checks, reconstruction | optional positional evidence |
| Value stream | slot → ordered document/value pairs | opaque byte strings; slot stats and bounds | sorting, ranges, facets, collapse, score features | typed normalized fields with codec/version |
| Document data | document → opaque blob | caller-defined bytes | display payload / source summary | bounded result payload or object reference |
| Auxiliary dictionaries | key → spelling/synonym data | word frequencies, trigram keys, synonyms | suggestions and query expansion | optional query-assistance index |

Sources: [S3][S7][S10][S18].

### 3.2 Terms and posting statistics

#### Facts

- A term records within-document frequency (WDF). Optional positions support
  phrase and proximity queries. Xapian also records term frequency (number of
  indexed documents) and collection frequency (sum of WDF). Document length is
  the sum of WDF across terms. [S7][S18]
- Boolean terms conventionally have WDF 0, so they do not add to document
  length or ranking. Fields are encoded by application-defined term prefixes,
  conventionally uppercase prefixes before normalized lowercase terms. [S18][S19]
- Term names in Glass and Honey are limited to 245 bytes, with a lower effective
  limit for embedded zero bytes. [S20]
- Posting and term iterators are lexicographically/docid ordered and expose
  `skip_to`-style navigation through the API. [S7]

#### Inference

The “term” abstraction unifies free-text tokens, field scoping, exact filters
and external IDs. This simplicity is powerful but shifts schema governance to
the application. Prefix collisions, analyzer drift or accidentally assigning
WDF to a boolean filter can silently change retrieval semantics.

#### Recommendation

Curiosity needs a versioned field/analyzer registry. Distinguish lexical terms,
identity terms and filters at the contract level even if an adapter encodes
all three into one underlying term namespace.

### 3.3 Why the reverse termlist matters

#### Facts

- Glass can omit the termlist table to save disk, CPU and update I/O, but then
  term iteration and relevance expansion are unavailable; deleting a document
  and replacing an existing document currently require termlists. [S15]
- High-level inspection of current Glass update logic confirms the reason:
  deletion walks the old document's terms to remove postings/positions and
  adjust statistics; replacement merges the ordered old and new termlists to
  classify removed, added and retained terms. [S21]

#### Inference (clean-room behavioural description)

An exact mutable inverted index needs a reverse manifest or an equivalent
source of the old indexed representation. Without it, deletion must scan the
global term space, accept stale postings/inexact statistics, or rebuild.

#### Recommendation

**ADOPT.** Store a per-document indexed manifest (or immutable prior version)
whenever Curiosity promises exact update/delete semantics. Do not reconstruct
deletions from current provider data, because current data may already differ
from the indexed revision.

### 3.4 Value slots

#### Facts

- Each document may have sparse values addressed by unsigned 32-bit slot
  numbers except `0xffffffff`. Values are opaque binary strings to Xapian. [S10]
- String comparison defines value order. Numeric range/sort therefore requires
  an order-preserving serialization; Xapian provides a platform-independent
  double serialization for that purpose. [S7][S10]
- Values for a slot are stored as a chunked stream ordered by slot and docid,
  with prefix compression between adjacent values. This favors scanning one
  field across candidates in docid order. [S10]
- The official guide warns against using many value slots for display fields:
  each slot can require another block stream; display data should be in the
  document data blob. [S10]
- Values power range filters, sort keys, result collapsing and facet counting.
  Exact facet counts can require checking all matches; checking a bounded
  sample trades speed for approximate counts. [S7][S22]

#### Inference

Slots are columnar search features, not general document storage. Their numeric
IDs make schema drift and accidental reuse an application risk. Range ordering
is only as correct as the codec and normalization used at index and query time.

#### Recommendation

Curiosity's value contract should name fields rather than expose numeric slots.
Each adapter should map names to versioned physical slots and record type,
codec, null behavior, sort collation and migration state. Keep snippets and UI
metadata in one bounded payload or retrieve them from an authoritative store.

## 4. Query model, parser and weighting

### 4.1 Query tree and matching

#### Facts

- Query objects form a tree of terms/external posting sources and operators:
  AND, OR, AND-NOT, XOR, AND-MAYBE, FILTER, NEAR, PHRASE, value comparisons,
  weight scaling, elite-set selection, SYNONYM, MAX, wildcard and edit-distance
  expansion. Match-all and match-nothing are explicit leaves. [S23]
- FILTER matches like AND but only the first branch contributes weight;
  SYNONYM matches like OR but combines statistics to approximate one term;
  AND-MAYBE requires the first branch and accepts extra weight from others.
  [S23]
- Phrase/near matching first intersects required terms and then checks
  positions. It can be significantly slower when many documents contain the
  terms but few satisfy the positional condition. [S24]
- The 2.0 matcher rewrite uses docid ranges and weight upper bounds to prune
  work, uses heaps for several merges, handles remote shards in parallel, and
  separates candidate match estimates from the requested result page. [S5]

#### Inference

Xapian's important abstraction is not its parser syntax but a composable query
IR that separates match semantics from score contribution. Tight score upper
bounds enable safe skipping. This is a useful model for Curiosity even if the
backing provider has a different query language.

#### Recommendation

**ADOPT** a small provider-neutral query IR with explicit `must`, `should`,
`must_not`, filter, phrase/proximity and bounded expansion semantics. Adapter
capabilities must state whether a construct is exact, approximated, or
unsupported; never silently downgrade phrase to AND.

### 4.2 QueryParser

#### Facts

- The parser offers web-search-like syntax: boolean operators, `+`/`-`,
  phrases, NEAR/ADJ, field prefixes, ranges, synonyms, wildcards, partial
  queries and (from 2.0) fuzzy/edit-distance terms. Defaults enable phrase,
  boolean and love/hate syntax, with OR as the default operator. [S6][S25]
- Free-text prefixes, boolean prefixes and range processors are configured by
  the application; parser and index-time prefix/analyzer choices must agree.
  Numeric values must use the same sortable encoding at index and query time.
  [S6][S25][S26]
- Wildcard/fuzzy expansion can be limited and can error, take the first terms,
  or take the most frequent terms. However, wildcard and fuzzy expansion are
  unlimited by default; partial-term expansion defaults to 100 frequent terms.
  In a multi-database search, a limit is currently applied independently to
  each database, so aggregate expansion can exceed it. [S6][S23]
- Pure NOT is off by default because it may require the all-documents list.
  Leading/general wildcards and positional queries carry explicit cost warnings.
  [S6]
- `Enquire::set_time_limit()` is **not** a hard query deadline: it disables
  `check_at_least` after the interval. The API explicitly says there is no way
  through this feature to force the match to end after a fixed time. [S27]

#### Inference

The parser is intentionally permissive and application-configurable. In an
untrusted public-search context, defaults are not a safety boundary. Query
complexity can multiply across shards even when each shard appears bounded.

#### Recommendation

**ADAPT strongly:** parse into a bounded IR, count leaves, expansions, shards,
candidate work and positional clauses before execution, and enforce one global
budget. Curiosity needs cancellation/deadline support outside Xapian's
`set_time_limit`; process isolation may be necessary for a hard stop.

### 4.3 Weighting and result control

#### Facts

- BM25 is the default. Xapian's default parameters are `k1=1`, `k2=0`,
  `k3=1`, `b=0.5`, with a default normalized-length floor of 0.5. The official
  note states optimal parameters vary by corpus and query type. [S27][S28]
- Current built-ins span boolean, TF-IDF, BM25/BM25+, probabilistic,
  divergence-from-randomness, language-model, coordinate and Dice families.
  Custom schemes declare which collection/query/document statistics they need
  and must supply safe maximum contribution bounds used by matcher pruning.
  [S29]
- Weighting uses WDF, document length, collection size, term frequency,
  collection frequency, WQF and optional relevance-set statistics, depending
  on the scheme. [S28][S29]
- Enquire supports relevance sorting, value sorting, mixed sorting, collapse,
  cutoffs, result-page offset/limit, relevance feedback and reranking support.
  Match counts are bounds/estimates unless enough candidates are checked.
  [S27]

#### Inference

The max-score contract is as important as the formula: an incorrect upper bound
can make pruning incorrect, while a loose one sacrifices speed. Search quality
is not portable solely by selecting “BM25”; analyzer, field boosts, document
length, shard statistics and parameter defaults all matter.

#### Recommendation

Curiosity should record scoring-model name/version, analyzer version and index
revision with evaluation results. Use offline judgments and representative
queries to tune, and never compare raw scores across providers as if calibrated.

## 5. Spelling and query assistance

### Facts

- Xapian's spelling dictionary can be populated explicitly or from text during
  term generation. Suggestions therefore learn proper nouns and domain terms,
  not just a fixed language dictionary. [S30]
- Candidate retrieval uses character trigrams plus special handling for short
  words, then ranks shortlisted candidates by character edit distance; frequency
  breaks equal-distance ties. The default maximum edit distance is 2. [S30]
- The algorithm is intentionally not exhaustive. The documentation says trigram
  preselection can miss the globally closest candidate, though release 1.4.31
  removed a flawed n-gram-only rejection optimization at a measured cost of
  about 2 ms on its cited German dictionary example. [S5][S30]
- QueryParser produces a corrected query string but still parses/runs the
  original; applications can offer “Did you mean?” or explicitly reparse the
  correction. [S6][S30]
- Dynamically added spelling entries are not automatically removed when a
  document is deleted/replaced. Xapian treats historical vocabulary as useful;
  exact removal requires application work. Spelling ignores prefixed terms in
  the documented implementation. [S30]
- Current support is Glass (and Chert in old series), not InMemory; the older
  spelling guide says remote support was planned, while 2.0 release notes focus
  on faster spelling over sharded databases. This is a documentation ambiguity,
  not evidence that remote spelling is now complete. [S5][S30]

### Inference

Spelling is a separate, eventually consistent corpus-derived model. Treating it
as an exact projection of live documents creates expensive delete coupling and
usually little user value. Auto-correction, however, can change intent and must
not be hidden.

### Recommendation

**ADAPT.** Maintain suggestions as a versioned, bounded side index. Return
suggestions with confidence/provenance; do not silently replace the user's
query. Apply abuse limits to fuzzy expansion independently from “Did you mean?”

## 6. Transactions, revisions and replication

### 6.1 Transactions and snapshots

#### Facts

- Normal disk modifications are atomic: uncommitted changes are invisible to
  separate readers; the on-disk database remains consistent through interruption
  assuming storage hardware does not corrupt writes. Commits invoke durability
  primitives and are therefore expensive; batching improves throughput. [S3]
- Xapian automatically batches modifications. The current API documents an
  automatic threshold of 10,000 added/deleted/modified documents, configurable
  using `XAPIAN_FLUSH_THRESHOLD`; frequent explicit commits reduce throughput.
  [S7]
- Explicit transactions can be flushed (durable on commit) or unflushed
  (atomic within the surrounding batch). Closing with an active transaction
  cancels it; closing without one implicitly commits pending changes. [S7]
- Transactions cannot span multiple databases or external systems. In a
  sharded writable database, commit/transaction atomicity is only per shard.
  The InMemory backend does not implement transactions. [S3][S7]
- Readers hold a fixed revision until `reopen()`. Official current guide text
  says disk backends keep at most two concurrent versions; after two newer
  commits an old reader may receive `DatabaseModifiedError` when accessing
  changed data and must reopen. [S2]
- `DB_NO_SYNC` trades durability for indexing speed; `DB_FULL_SYNC` tries
  stronger device persistence where supported; `DB_DANGEROUS` overwrites in
  place, disables concurrent safe reading/cancel, and can leave an unusable
  database after an unclean indexing end. [S15]

#### Inference

Xapian's transaction boundary is an index revision, not an end-to-end source
ingestion transaction. Any source cursor/checkpoint committed separately can
diverge from the index after partial failure.

#### Recommendation

Curiosity should define an ingestion journal with idempotent document versions,
then publish the index revision and source checkpoint through a recoverable
protocol. Never rely on cross-shard atomicity that the adapter cannot provide.

### 6.2 Replication

#### Facts

- Replication is one writable master to multiple read-only replicas. It is not
  multi-master and does not merge independently modified copies. [S4]
- Setting `XAPIAN_MAX_CHANGESETS` retains commit changesets. A replica behind
  within that window receives incremental changes; without the required chain,
  the master sends enough database blocks for a full reconstruction. [S4][S31]
- Current 2.1 source and API retain Glass replication, the
  `xapian-replicate-server`/`xapian-replicate` tools, and an explicitly
  **experimental** `DatabaseReplica` interface. Current implementation reports
  that replication requires Glass to be enabled. [S32]
- Replication preserves the database UUID; compaction/copying makes a new UUID.
  Revision information combines master identity and exact revision. [S7][S32]
- Search and indexing are intended to continue during synchronization. The
  replica uses indirection to swap a full copy live. `Database::reopen()` does
  not correctly follow that replication stub swap in the documented design;
  readers must close and open afresh. [S4]
- The guide documents a narrow database-swap sequence which can fool replication
  and mix two databases. It also explains why rsync, network filesystems and
  full copies have CPU, consistency or cache-disruption disadvantages. [S4]

#### Inference

Changeset retention is a bounded delta log with snapshot fallback. The critical
correctness keys are source UUID plus revision, not path name. Publication
indirection allows readers to finish on the old artifact while new readers move
to the new one.

#### Recommendation

**ADOPT** identity+revision handshakes, bounded delta retention, verified
snapshot fallback and atomic publication. **REJECT** path identity and manual
directory swapping. Require checksum/integrity validation before promotion.
Treat Xapian's replication API as unstable and Glass-specific.

## 7. Updates, replacement and deletion

### Facts

- `add_document` allocates monotonically increasing docids; deleted docids are
  not reused. Compaction can renumber/reclaim gaps unless preservation is
  requested. [S7][S20]
- `replace_document(docid, doc)` updates that ID or inserts it if absent. A
  high manually selected docid advances automatic allocation and can exhaust
  the counter. [S7]
- `replace_document(unique_term, doc)` uses the lowest matching docid, or
  allocates a new one. It does **not** automatically add the unique term to the
  replacement. `delete_document(unique_term)` deletes all matching documents;
  uniqueness is therefore an application invariant. [S7]
- Xapian's guide recommends either mapping external integer IDs to docids or
  indexing an external ID as a specially prefixed term (conventionally `Q`).
  [S8]
- Replacement can avoid rewriting unchanged planes when modifying a lazily
  loaded document from the same writable database, but this is an implementation
  optimization rather than a portable semantic guarantee. [S21]
- Spelling frequencies learned while indexing are not automatically reversed
  by document replacement/deletion. [S30]

### Inference

Stable external identity terms make ingestion naturally idempotent only if the
caller enforces exactly one document per identity and always includes the term
in replacements. A search-engine docid is an internal locator, not a durable
business identity.

### Recommendation

- **ADOPT** stable source-qualified identity and idempotent replace semantics.
- Enforce uniqueness before publication and alert on duplicate identity terms.
- Keep tombstones/version clocks outside the index so stale provider events
  cannot resurrect deleted content.
- Treat auxiliary indexes (spelling, facets, embeddings) as separate consistency
  domains with declared lag and rebuild paths.

## 8. Performance and operations

### 8.1 Performance shape

#### Facts

- Xapian documentation says large deployments become I/O-bound. It recommends
  ample RAM for the OS page cache, fast reads, smaller databases, and compaction.
  Cold benchmark queries are unrepresentatively slow because upper B-tree and
  common leaf blocks have not yet been cached. [S33]
- Sorted docid gaps and other index data are compressed. Glass leaves update
  headroom in blocks; compaction fills blocks, reducing size and often search
  I/O at the cost of slower subsequent updates due to splitting. [S3][S33]
- Xapian 2.1 performs query readahead, and current backend declarations show
  backend-specific readahead hooks. This is an optimization, not a durability
  guarantee. [S5][S16][S17]
- Value scans are efficient when one slot is accessed in ascending docid order,
  but large/many values increase match-time I/O. Positional checks add work
  after candidate intersection. [S10][S24]
- Each Glass database uses one to six file descriptors depending on optional
  tables. Searching many databases can hit process limits. Remote access can
  reduce client-side descriptors and distribute load. [S24][S33]
- Default docids are 32 bit; 64-bit docid/termcount builds are optional and
  change the library ABI, not the disk format. B-tree block numbers are 32 bit,
  giving a 32 TiB table at 8 KiB blocks and 256 TiB at 64 KiB. [S20][S33]

#### Inference

Most tuning is locality tuning: fewer blocks, fewer value streams, fewer
candidate position checks, and warm page cache. A microbenchmark that fits the
whole database in RAM says little about cold-start or replica-promotion tails.

#### Recommendation

Benchmark Curiosity with warm and cold runs, representative updates, phrase and
worst-case expansion queries, result hydration, and p95/p99 latency. Track bytes
per document, postings/positions/value/payload bytes separately, file descriptors,
commit duration, snapshot age and replica lag.

### 8.2 Operational controls and failure modes

#### Facts

- `xapian-check` validates internal table consistency; repair is limited and
  historically backend-specific. `xapian-delve` inspects terms/documents;
  `xapian-compact` compacts and merges. [S3]
- Backups require either stopping commits while all files are copied or taking
  one atomic filesystem snapshot across every database file. Per-file snapshots
  can mix revisions. Progressive backups are poor because changed blocks are
  spread through files. [S3]
- Network filesystems may work but require correct locking and careful testing;
  Xapian is I/O intensive, and cache invalidation/network latency can be severe.
  [S3][S4]
- Xapian does not add object-level locks. Separate objects may be used in
  separate threads, but sharing an object or an object that retains a reference
  to another requires caller serialization. [S34]
- The 2.1.0 release fixed a missed HTML-escaping corner in `MSet::snippet()`
  related to CVE-2018-0499. Search content must still be treated as untrusted,
  and application output encoding remains mandatory. [S5]

### Recommendation

For any Xapian adapter, require:

- one writer owner per physical database and explicit lock contention metrics;
- atomic snapshot or quiesced-commit backup, plus restore drills;
- integrity check before snapshot promotion;
- hard outer deadline/process cancellation, not only `set_time_limit`;
- bounded wildcard/fuzzy/partial expansion and global shard budget;
- output escaping independent of snippet generation;
- version-aware migration plan (notably 1.4 Glass to 2.x; Chert conversion must
  happen with 1.4 tooling);
- close-and-reopen after replication full-copy publication; and
- explicit disk, descriptor, page-cache and revision-age alerts.

## 9. Licensing and clean-room boundary

### 9.1 Facts

- Xapian's homepage and README state **GNU GPL version 2 or later**. Source
  headers repeat GPL-2.0-or-later notices. [S1][S11][S16][S17]
- GPLv2 section 0 says running the program is not restricted. Sections 2 and 3
  impose conditions on distributing modified/derivative works and object code,
  including whole-work licensing and corresponding source obligations in the
  covered cases. Section 10 says to ask the author for permission to incorporate
  portions into programs with different distribution terms. [S11]
- Xapian 2.0 added `--disable-gpl-libxapian`, but its release notes say this
  disables backends containing code the project cannot relicense and chiefly
  leaves no updating disk backend. More importantly, current `configure.ac`
  explicitly warns that the resulting build **still contains GPL code**, albeit
  code the project believes it may eventually relicense. This is not a present
  non-GPL licence grant. [S5][S12]
- The same configuration disables Glass, InMemory and Remote by default under
  that option while retaining Honey. The project lineage and copyright headers
  explain why some older backend code is harder to relicense. [S12][S13]
- Xapian is GPL, **not AGPL**. The GPL text does not add an AGPL-style network
  interaction source-offer condition. Distribution, linking/derivation and
  deployment details still need legal analysis. [S1][S11]

### 9.2 Inferences and risk calls

- **High-confidence inference:** copying Xapian implementation code, format
  encoders, parser/matcher code or protocol implementation into Curiosity would
  create substantial GPL and provenance risk.
- **Medium-confidence legal inference, counsel required:** statically or
  dynamically linking Xapian into a distributed proprietary executable is
  materially riskier than operating an unmodified, separately deployed GPL
  service reached over an ordinary process/network boundary. The legal outcome
  depends on facts; dynamic linking is not declared safe here.
- **High-confidence inference:** `--disable-gpl-libxapian` must not be represented
  as “Xapian under a permissive licence.” Its own configuration help refutes that.

### 9.3 Clean-room controls

1. Do not copy or translate Xapian source, tests, constants tied to its formats,
   protocol frames, serialization layouts or on-disk encodings.
2. Keep this behavioural research separate from any implementation task. An
   implementer should work from Curiosity-owned requirements and standard IR
   literature, not Xapian source.
3. Prefer standard, independently documented ideas: inverted indexes, BM25,
   copy-on-write snapshots, order-preserving typed codecs, delta logs and atomic
   pointer swaps are not adopted here from code.
4. Preserve this source ledger and any future legal decision in provenance/ADR
   records before introducing a dependency.
5. If Xapian is evaluated as a component, isolate it behind a provider adapter,
   use unmodified official packages, inventory licence/source-offer duties, and
   obtain counsel approval before distribution.

## 10. Curiosity decision ledger

| Topic | Verdict | Rationale / boundary |
|---|---|---|
| Provider-neutral lexical query IR | **ADOPT** | Match versus score contribution is a durable separation; capabilities must be explicit |
| Terms/postings/positions/value/payload separation | **ADOPT** | Prevents display storage from polluting match-time column access |
| Reverse per-document manifest | **ADOPT** | Enables exact, bounded replace/delete without global scans |
| Stable external-ID term | **ADAPT** | Useful physical mapping, but Curiosity owns source-qualified identity, uniqueness and tombstones |
| Numeric slot IDs in public contract | **REJECT** | Adapter-local implementation detail with schema-drift risk |
| Glass mutable → Honey immutable lifecycle | **ADAPT** | Adopt validated immutable publication, not formats or dual-backend complexity yet |
| Stub/pointer atomic swap | **ADOPT** | General snapshot publication pattern; include revision and checksum |
| One writer / many snapshot readers | **ADAPT** | Good local invariant; avoid two-revision and cross-shard limitations in core contract |
| Shard-local commits represented as global atomicity | **REJECT** | Factually unsupported and unsafe |
| Changeset retention + full snapshot fallback | **ADOPT** | Bounded recovery pattern with UUID+revision verification |
| Unlimited parser expansion defaults | **REJECT** | Incompatible with bounded untrusted search |
| “Did you mean?” suggestions | **ADAPT** | Side index, explicit user-visible suggestion, confidence and limits |
| BM25 default | **ADAPT** | Strong baseline, but version/tune/evaluate per corpus and analyzer |
| Raw score comparability across providers | **REJECT** | Models/statistics/scales differ |
| Xapian source/format/protocol copying | **REJECT** | GPL and clean-room risk |
| Xapian linked dependency | **DEFER** | Requires use-case-specific legal and operational review |
| Separately operated Xapian adapter/service | **DEFER** | Potentially viable, still requires licence, packaging and hard-timeout review |

## 11. Unknowns, contradictions and checks

### Material unknowns

1. **Licence deployment outcome:** No legal opinion was obtained for Curiosity's
   eventual distribution/deployment model. **Owner/check:** counsel reviews
   process boundary, linking, containers/images, customer delivery and source
   offer before dependency approval.
2. **Honey value:** No official representative Glass-versus-Honey size/latency
   benchmark was found in the bounded search, and none was run. **Check:** use
   Curiosity corpus and update cadence before adding an immutable second format.
3. **Hard cancellation:** Xapian's documented time limit is not a hard deadline.
   **Check:** if piloted, test process cancellation and database integrity under
   adversarial wildcard, fuzzy, phrase and huge-OR queries.
4. **Remote spelling:** the spelling guide says remote is unsupported/planned,
   while newer notes describe sharded spelling improvements and remote synonym
   support. No explicit current 2.1 statement proving remote spelling support
   was found. Treat as unsupported until an API integration test says otherwise.
5. **Replication maturity:** current code/API exist and Glass is wired, but the
   public `DatabaseReplica` interface remains experimental. Protocol stability
   across release-series upgrades is unknown without a compatibility matrix.
6. **Current admin guide drift:** `admin_notes.html` identifies itself as current
   for 1.4.21 and still documents Chert, while 2.0 removed Chert and added Honey.
   Current API/2.0 NEWS take precedence for 2.1 facts.
7. **Crash guarantees:** documentation assumes storage hardware and OS flush
   semantics behave correctly. No fault-injection evidence was assessed.

### Suggested validation checks before any pilot

- Confirm official package version, compile flags and enabled backends.
- Verify database type, UUID and revision on startup; reject unexpected format.
- Exercise add/replace/delete by stable identity, duplicate identity, crash
  before/after commit, stale reader after multiple commits and shard failure.
- Measure exact versus sampled facets, value-range correctness, codec migration,
  cold/warm latency and payload hydration.
- Test global expansion limits across every shard, not merely per shard.
- Test replication incremental catch-up, changeset-gap full copy, master UUID
  mismatch, promotion, close/reopen behavior and rollback.
- Run integrity checking and full restore from the documented backup method.
- Validate HTML escaping around snippets with malicious stored content.

## 12. Bounded curiosity pass

After the main synthesis, gaps were scored 1–5 on relevance (R), decision value
(V), novelty (N), and investigation cost (C); priority = R + V + N − C.

| Thread | R | V | N | C | Priority | Outcome |
|---|---:|---:|---:|---:|---:|---|
| Is `--disable-gpl-libxapian` actually non-GPL? | 5 | 5 | 5 | 1 | 14 | **Pursued.** Current configure text says no; major clean-room finding. [S12] |
| Does replication survive into 2.1 after Chert removal? | 5 | 4 | 4 | 2 | 11 | **Pursued.** Current Glass replicator/tools/API exist; interface remains experimental. [S32] |
| Is Xapian's query time limit a hard deadline? | 5 | 5 | 4 | 1 | 13 | **Pursued.** It is not; only disables `check_at_least`. [S27] |
| Are expansion limits globally bounded by default? | 5 | 5 | 4 | 1 | 13 | **Pursued.** No; defaults and per-database application create risk. [S6][S23] |
| Exact Honey compression format | 2 | 1 | 3 | 5 | 1 | **CURIOSITY_NO_GO.** GPL implementation detail; no decision value justifies contamination/cost. |
| Reproduce matcher pruning implementation | 3 | 2 | 3 | 5 | 3 | **CURIOSITY_NO_GO.** High clean-room risk; public max-score contract is sufficient. |
| Historical Chert/Flint encoding evolution | 1 | 1 | 2 | 4 | 0 | **CURIOSITY_NO_GO.** Removed/legacy and outside current decision. |
| Third-party benchmark hunt | 3 | 3 | 2 | 4 | 4 | **CURIOSITY_NO_GO.** Caller required official sources; heterogeneous benchmarks would not answer Curiosity fit. |
| Remote spelling support in 2.1 | 3 | 2 | 3 | 3 | 5 | **Deferred/unknown.** Official pages conflict by age; requires a bounded integration test, not more source reading. |

**Stop reason:** coverage reached for every caller-specified topic; the remaining
high-value gaps require legal authority or a representative implementation
benchmark, neither authorized in this research-only task. Additional source
inspection had reached saturation and would increase clean-room risk.

## 13. Source ledger

All sources below are official Xapian project documentation or official project
repository material and were accessed 2026-08-17.

- **[S1]** Xapian project home page, release and licence statement:
  https://xapian.org/
- **[S2]** Getting Started, “Databases” (2.0 documentation):
  https://getting-started-with-xapian.readthedocs.io/en/latest/concepts/indexing/databases.html
- **[S3]** Xapian Administrator's Guide (self-identifies as current for 1.4.21;
  used for Glass operations and historical backend details):
  https://xapian.org/docs/admin_notes.html
- **[S4]** Database Replication Users Guide:
  https://xapian.org/docs/replication.html
- **[S5]** Official xapian-core NEWS, especially 2.1.0 and 2.0.0:
  https://github.com/xapian/xapian/blob/v2.1.0/xapian-core/NEWS
- **[S6]** QueryParser API (2.1.0):
  https://xapian.org/docs/apidoc/html/classXapian_1_1QueryParser.html
- **[S7]** Database, WritableDatabase, Document and Enquire APIs (2.1.0):
  https://xapian.org/docs/apidoc/html/classXapian_1_1Database.html ;
  https://xapian.org/docs/apidoc/html/classXapian_1_1WritableDatabase.html ;
  https://xapian.org/docs/apidoc/html/classXapian_1_1Document.html ;
  https://xapian.org/docs/apidoc/html/classXapian_1_1Enquire.html
- **[S8]** Getting Started, “Using identifiers with Xapian”:
  https://getting-started-with-xapian.readthedocs.io/en/latest/concepts/indexing/uniqueness.html
- **[S9]** WritableDatabase unique-term replace/delete API details:
  https://xapian.org/docs/apidoc/html/classXapian_1_1WritableDatabase.html
- **[S10]** Getting Started, “Values”:
  https://getting-started-with-xapian.readthedocs.io/en/latest/concepts/indexing/values.html
- **[S11]** Official xapian-core GPLv2 licence copy and README licence statement:
  https://github.com/xapian/xapian/blob/v2.1.0/xapian-core/COPYING ;
  https://github.com/xapian/xapian/blob/v2.1.0/xapian-core/README
- **[S12]** Official 2.1.0 `configure.ac`, `--disable-gpl-libxapian` text and
  backend selection:
  https://github.com/xapian/xapian/blob/v2.1.0/xapian-core/configure.ac
- **[S13]** Official contributor/lineage file:
  https://github.com/xapian/xapian/blob/v2.1.0/xapian-core/AUTHORS
- **[S14]** Remote Backend guide:
  https://xapian.org/docs/remote.html
- **[S15]** Xapian constants API/source documentation for sync, dangerous and
  no-termlist modes:
  https://xapian.org/docs/apidoc/html/namespaceXapian.html
- **[S16]** Glass high-level backend declaration, v2.1.0:
  https://github.com/xapian/xapian/blob/v2.1.0/xapian-core/backends/glass/glass_database.h
- **[S17]** Honey high-level backend declaration, v2.1.0:
  https://github.com/xapian/xapian/blob/v2.1.0/xapian-core/backends/honey/honey_database.h
- **[S18]** Getting Started, “Terms”:
  https://getting-started-with-xapian.readthedocs.io/en/latest/concepts/indexing/terms.html
- **[S19]** Document API boolean term semantics:
  https://xapian.org/docs/apidoc/html/classXapian_1_1Document.html
- **[S20]** Getting Started, “Index limitations”:
  https://getting-started-with-xapian.readthedocs.io/en/latest/concepts/indexing/limitations.html
- **[S21]** Glass writable database source, consulted only for high-level update
  behavior (no code or encoding copied):
  https://github.com/xapian/xapian/blob/v2.1.0/xapian-core/backends/glass/glass_database.cc
- **[S22]** Faceting support guide:
  https://xapian.org/docs/facets
- **[S23]** Query API and operator semantics (2.1.0):
  https://xapian.org/docs/apidoc/html/classXapian_1_1Query.html
- **[S24]** Getting Started, “Search-time limitations”:
  https://getting-started-with-xapian.readthedocs.io/en/latest/concepts/search/search_limitations.html
- **[S25]** QueryParser syntax:
  https://xapian.org/docs/queryparser.html
- **[S26]** Value range guide:
  https://xapian.org/docs/valueranges.html
- **[S27]** Enquire API, sorting, match estimates and time-limit semantics:
  https://xapian.org/docs/apidoc/html/classXapian_1_1Enquire.html
- **[S28]** Official BM25 technical note:
  https://xapian.org/docs/bm25.html
- **[S29]** Weight API and current built-in subclasses:
  https://xapian.org/docs/apidoc/html/classXapian_1_1Weight.html ;
  https://xapian.org/docs/apidoc/html/namespaceXapian.html
- **[S30]** Spelling correction guide:
  https://xapian.org/docs/spelling.html
- **[S31]** Glass changeset declaration, v2.1.0:
  https://github.com/xapian/xapian/blob/v2.1.0/xapian-core/backends/glass/glass_changes.h
- **[S32]** Current replication API and Glass replication implementation
  presence, v2.1.0:
  https://github.com/xapian/xapian/blob/v2.1.0/xapian-core/api/replication.h ;
  https://github.com/xapian/xapian/tree/v2.1.0/xapian-core/backends/glass
- **[S33]** Scalability guide:
  https://xapian.org/docs/scalability.html
- **[S34]** Getting Started, “Concurrency”:
  https://getting-started-with-xapian.readthedocs.io/en/latest/concepts/concurrency.html

## Confidence summary

| Area | Confidence | Basis |
|---|---|---|
| Current release, licence, backend availability | High | Homepage, NEWS, configure, current API/source declarations |
| Terms/postings/termlists/values/positions | High | Current guide + API + backend declarations |
| Query/parser/weighting semantics | High | Current 2.1 generated API and official technical notes |
| Updates/deletes/transactions | High | Public API + admin guide + bounded high-level source check |
| Replication behavior | High for Glass design; medium for upgrade compatibility | Guide + current implementation/API; interface remains experimental |
| Performance mechanisms | Medium-high | Official docs/NEWS; no Curiosity benchmark |
| Comparative performance or capacity | Low | Corpus/hardware/query dependent; not tested |
| Legal effect for Curiosity | Medium-low | Licence facts are high confidence; application is counsel-dependent |
