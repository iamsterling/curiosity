# Apache Lucene internals: clean-room architecture study

**Date / source access:** 2026-08-17  
**Reference release:** Apache Lucene 10.5.1 (released 2026-08-12) [S1]  
**Decision:** which Lucene architectural ideas Curiosity should reproduce from
independent specifications and tests, without copying Lucene code or adopting
Lucene as the owned search core.  
**Status:** research record only; no code, dependency, benchmark, or deployment.  
**Overall confidence:** high for documented 10.5.1 structures and APIs; medium
for performance implications that were not benchmarked in Curiosity.

## Executive verdict

**ADAPT conceptually, do not clone (high confidence).** Lucene's most valuable
lesson is not a particular byte encoding. It is the separation of an immutable,
independently searchable segment from mutable publication state: writers append
new segment files, deletions/column updates are sidecar generations, a small
commit manifest publishes one consistent set, readers retain a point-in-time
view, and background merges rewrite rather than mutate old segments. This gives
lock-light reads, crash-safe publication, cheap snapshots, and a tractable unit
for validation, caching, replication, and rollback [S2][S12][S13].

For Curiosity, **ADOPT** the segment/manifest lifecycle, typed field capabilities,
analysis-version discipline, postings/doc-values separation, top-k competitive
skipping, and bounded collector model as independently designed concepts.
**ADAPT** BM25 and HNSW from their papers plus project-authored specifications
and tests, not from Lucene source. **DEFER** Lucene-like compression, SIMD, HNSW
quantization, and graph-reuse optimizations until profiling proves a need.
**REJECT** copying Lucene's file formats, class/API shape, constants, source,
fixtures, or generated tables into the owned core. **REJECT** exposing Lucene
doc IDs or raw scores as durable Curiosity identifiers or cross-snapshot facts.

Lucene is Apache-2.0, not copyleft, but using or deriving from its code creates a
third-party component with License/NOTICE and attribution duties; the release
license also contains embedded third-party notices [S19]. The clean-room goal is
stricter than what the license permits. This report describes behavior and
architecture; it neither reproduces source nor gives legal advice.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. How do segments, term dictionaries, postings, stored fields, doc values, and
   vectors divide storage and query work?
2. How do analyzers define the searchable vocabulary and positional evidence?
3. How do BM25, scorers, impacts, and collectors turn matches into bounded top-k?
4. How are flushes, deletes, updates, merges, commits, snapshots, and readers
   coordinated without in-place mutation of the main index?
5. Which concurrency, performance, and operational properties are architectural
   versus release-specific optimizations?
6. What may Curiosity reproduce independently, and what must remain outside the
   owned-core boundary?

**Depth budget:** Lucene Core 10.5.1 architecture, public file-format Javadocs,
selected release-tag source used only to verify lifecycle claims, and original
BM25/HNSW publications. No build, runtime inspection, corpus ingestion,
benchmarking, decompilation, private access, or source transfer.

**Stopping rule:** stop after every requested category has a primary-source
account, a clean-room implication, and at least one risk/check; do not chase
individual codec micro-optimizations unless they change the target architecture.

### 1.2 Evidence labels and limitations

- **FACT** is directly supported by cited official documentation, tagged source,
  release notes, or original paper.
- **INFERENCE** is architectural interpretation, not measured here.
- **RECOMMENDATION** is a proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

Official Javadocs are both API documentation and generated format documentation.
Tagged source was read to trace commit/file-lifetime claims, not to derive an
implementation. Release-note speedups are the Lucene project's nightly results,
not independent benchmarks and not Curiosity forecasts [S1]. File formats are
versioned and deliberately evolve; names such as `Lucene90DocValuesFormat` can
remain active inside a 10.5.1 codec, so the class suffix is not the product
release number [S2].

## 2. Architectural map

```text
document fields
  -> per-field analyzer: chars -> tokens + attributes
  -> per-thread indexing buffers
  -> flush creates immutable segment
       term trie/dictionary -> postings (docs/freqs/positions/offsets)
       stored fields        -> result reconstruction
       doc values / norms   -> sort, filter, facet, score features
       points               -> exact/range spatial and numeric search
       vectors + graph      -> approximate nearest-neighbor candidates
       live-doc/update generations -> logical mutations
  -> manifest (segments_N) atomically publishes a set of segment generations

query -> rewrite -> collection/term statistics -> Weight
      -> per-segment Scorer/BulkScorer -> Collector/LeafCollector
      -> top-k merge across leaf partitions -> stable external IDs + evidence

background merge: selected old segments + updates -> one new immutable segment
snapshot/reader refs keep old files alive until no published view needs them
```

**FACT (high):** a Lucene index is a set of fully independent sub-indexes called
segments. New documents create segments and merges replace existing segments.
The commit file `segments_N` records the segment set and generation metadata;
segment files have unique, never-reused generation-based names [S2][S12].

**INFERENCE (high):** immutability is the enabling constraint. It trades write
amplification and merge complexity for simple reader isolation and cacheability.
Curiosity should evaluate that trade explicitly rather than emulate the class
hierarchy or wire/file names.

## 3. Physical index internals

### 3.1 Segments, identities, and codecs

**FACT (high):** each segment records field metadata, stored fields, term
dictionary/postings, norms, optional term vectors, doc values, live documents,
points, and vectors. A codec is a family of independently replaceable formats
for these structures; postings and doc values can even be selected per field
[S2][S3]. Segment-local integer doc IDs are ephemeral: deletion creates gaps,
merging removes gaps and can renumber documents [S2].

**FACT (high):** segment files generally share a segment-name prefix. Small
segments may be packed into compound `.cfs/.cfe` files. Checksummed footers have
covered index files since Lucene 4.8. The current format still uses signed
32-bit document numbers, an acknowledged index-size limitation [S2].

**RECOMMENDATION (high):** Curiosity needs three separate identities:

1. immutable external `document_version_id` / `passage_id` used by citations;
2. snapshot-local dense ordinal used only inside one segment;
3. segment and manifest IDs carrying schema, analyzer, codec, and build versions.

Never put a segment-local ordinal in a public result or provenance edge.

### 3.2 Term dictionary

**FACT (high):** Lucene 10.3's BlockTree dictionary groups lexicographically
ordered terms into variable blocks by shared byte prefix. Entries are terms or
child-block references. The `.tim` dictionary holds suffixes, statistics, and
postings metadata; `.tmd` holds field/root/statistics metadata; `.tip` holds a
per-field specialized prefix trie mapping prefixes to on-disk blocks. Oversized
prefix ranges split into “floor blocks.” Default documented blocks target 25–48
entries [S4]. This replaced the earlier FST term index in 10.3 [S2].

**INFERENCE (high):** the durable idea is a two-level vocabulary: compact sorted
term blocks on disk plus a smaller in-memory prefix routing index that can also
prove absence. The specialized trie, exact block bounds, metadata columns, and
encoding are release-specific.

**RECOMMENDATION (high):** independently specify a sorted per-field term table
with prefix-compressed blocks and a bounded memory routing structure. Preserve
minimum/maximum term, term count, document frequency, total term frequency, and
file checksums in validation metadata. Benchmark a simple sparse prefix table
before any trie/FST work.

### 3.3 Postings and positional evidence

**FACT (high):** a posting can carry doc ID, term frequency, position, offset,
and payload, depending on field options. In Lucene 10.4, long posting streams use
fixed 256-integer packed blocks; tails use variable integers. Doc IDs and
positions are delta encoded. Data classes are separated into `.doc`, `.pos`,
and `.pay` so a query that needs only documents/frequencies or positions need
not fetch payload/offset bytes. A singleton term may inline its sole doc ID in
the term metadata [S5].

**FACT (high):** two skip levels are interleaved at 256 and 8,192 postings.
Per-block “impacts” summarize competitive frequency/norm pairs, permitting
score-safe skipping when a block cannot exceed the current top-k threshold
[S2][S5]. Lucene 10.4 release notes attribute broad query gains to the larger
posting block and SIMD use, but these are project benchmark claims [S1].

**INFERENCE (high):** layout should follow access paths: exact/filter queries
need doc IDs; BM25 adds frequencies/norms; phrase and anchored snippets add
positions/offsets. Paying every query for every channel is avoidable.

**RECOMMENDATION (high):** Curiosity's lexical baseline should use per-field
sorted postings with optional frequency, position, and character-offset lanes.
Use offsets only as an index-time aid; citations must still anchor to immutable
captured text and extractor version. Add block upper bounds only after a simple
correct exhaustive scorer exists and adversarial equivalence tests prove no
competitive hit can be skipped.

### 3.4 Stored fields versus doc values and norms

**FACT (high):** stored fields reconstruct selected document values for hits;
they are not the inverted index. Lucene compresses groups of documents, using
LZ4-oriented speed mode (8 KiB blocks) or DEFLATE-oriented compression mode
(48 KiB blocks), with monotonic block/doc-offset indexes. Large chunks are
sub-blocked so a visitor can stop after requested early fields [S6].

**FACT (high):** doc values are forward/column-oriented values keyed by document
and intended for fast scoring, sorting, faceting, and grouping. Types are
numeric, binary, sorted, sorted-set, and sorted-numeric. The current documented
format separately encodes which docs have values, then densely addresses values
by ordinal. It chooses among constant, delta, table, GCD, monotonic, fixed/
variable-width, and prefix-compressed representations; dense, sparse, and full
doc-ID blocks have different encodings [S7]. Norms are per-document/per-field
numeric values used by scoring [S2].

**INFERENCE (high):** “stored” and “columnar” are different contracts even when
both contain the same logical value. Duplicating a URL/title in result storage
and a sortable canonical-domain/freshness column is legitimate denormalization.

**RECOMMENDATION (high):** define field capabilities independently:
`indexed_terms`, `positions`, `stored_result`, `doc_value`, `norm`, `point`, and
`vector`. Keep immutable citation payloads outside or alongside the hot index;
store only bounded display/provenance fields required to return a hit. Add
column skip metadata (min/max/presence) only for measured filters.

## 4. Analysis is part of index semantics

**FACT (high):** an `Analyzer` is explicitly a policy for extracting terms. It
builds a reusable chain of character filters, tokenizer, token filters, and
token attributes. Tokens can carry term bytes, positions, offsets, types, and
payloads. Index analysis and single-term query normalization are distinct:
wildcard/fuzzy fragments should generally normalize without tokenizing or
stemming. Components are reused per thread, globally or per field [S8].

**FACT (high):** position and offset gaps define semantics across repeated
instances of a field. A zero position gap can allow a phrase to span two field
instances. Lucene provides language/domain analyzers, including ICU and
morphological modules, but their behavior and dictionaries are dependencies,
not universal rules [S8][S19].

**INFERENCE (high):** analyzer mismatch is silent semantic corruption: terms
remain structurally valid while exact, phrase, entity, and language recall
change. Upgrading tokenization can require reindexing; Lucene's own release notes
warned of this for updated Snowball dictionaries [S1].

**RECOMMENDATION (high):** Curiosity should version an analyzer manifest per
field: Unicode version, normalization, tokenizer, case/accent policy, stop list,
stemmer/lemmatizer, synonym graph, position/offset gaps, and code/data hashes.
Query analysis must select the compatible manifest for every searched segment.
Retain original text; never treat stemmed terms as citation text. Begin with
conservative Unicode segmentation plus case normalization and language-specific
opt-in, judged separately for exact/entity and natural-language query classes.

## 5. Query, BM25, scorers, and collectors

### 5.1 Execution model

**FACT (high):** an `IndexSearcher` searches one reader, rewrites higher-level
queries to executable forms, creates a `Weight` containing collection-level
state, produces per-leaf scorers, and feeds matching docs to a per-leaf
collector. `CollectorManager` creates independent collectors for concurrent
leaf slices and reduces their results [S9][S10]. Query modes declare whether
all matches/scores are required or only competitive top documents [S11].

**FACT (high):** Lucene's standard top-score collector retains a bounded heap,
orders by descending score then ascending doc ID, and raises the minimum
competitive score once enough hits exist. The scorer may use this threshold and
posting impacts to avoid evaluating blocks that cannot enter the heap [S11][S18].
Default convenience searches count hits exactly only up to 1,000, then may
return a lower bound while the returned top-doc array remains exact [S9].

**INFERENCE (high):** matching, scoring, and collection are separable policies.
A caller asking only for top 10 should not force exact total-hit counting,
faceting, snippets, and every score feature.

### 5.2 BM25

**FACT (high):** Lucene's default `BM25Similarity` uses `k1=1.2`, `b=0.75`, and
discounts overlap tokens. Its IDF is
`log(1 + (docCount - docFreq + 0.5)/(docFreq + 0.5))`; average field length is
`sumTotalTermFreq/docCount`. `k1` controls term-frequency saturation and `b`
controls length normalization [S15]. The Javadoc traces the model to Robertson
et al., *Okapi at TREC-3* [S20].

**INFERENCE (high):** Lucene BM25 is a concrete parameterization and numerical
contract, not “BM25” in the abstract. Scores depend on corpus statistics,
segment/snapshot composition, field norms, boosts, analyzer choices, and query
structure. They are unsuitable as calibrated probabilities or values comparable
across snapshots.

**RECOMMENDATION (high):** independently implement the published formula behind
a versioned scoring spec. Use per-field statistics and tune parameters on held-
out judgments by query class. Return bounded reason classes and component
features for debugging, but label raw score as snapshot/model-local. Do not use
Lucene defaults as unexplained constants.

### 5.3 Bounded top-k contract

**RECOMMENDATION (high):** the owned query engine should expose internal stages:

1. rewrite with hard clause/term-expansion/deadline budgets;
2. create immutable snapshot-level corpus statistics;
3. per-segment candidate iteration and optional block upper-bound skipping;
4. per-branch bounded top-k collection, with explicit exact/lower-bound totals;
5. deterministic merge by score plus stable external tie-breaker;
6. policy/tombstone filtering, near-duplicate clustering, diversification, and
   passage retrieval as separately observable stages.

This preserves Lucene's useful mechanism while preventing a ranker's local doc
ID or score from leaking into Curiosity's durable evidence model.

## 6. Deletes, updates, merges, commits, and snapshots

### 6.1 Flush and visibility

**FACT (high):** `IndexWriter` buffers changes and flushes them to new segments,
by default around a 16 MB RAM trigger. Flush makes files but is not a durable
commit and ordinary directory readers do not see it. A near-real-time reader can
open directly from the writer and see committed plus uncommitted changes without
closing or committing; there is no hard refresh-latency guarantee [S12][S14].

**FACT (high):** only one writer holds the directory write lock, while writer,
reader, and searcher instances are documented thread-safe. Sequence numbers
order operations within one writer instance but are transient and not persisted
[S12][S14].

### 6.2 Deletes and updates

**FACT (high):** hard deletes are represented by optional live-document data;
gaps disappear only after a merge. Updating a document is logically delete then
add. Doc-value updates and soft deletes use generated sidecar files/field-info
updates rather than rewriting the base segment immediately [S2][S12][S21].

**INFERENCE (high):** physical immutability does not mean “no mutable truth.”
The manifest chooses a generation of live docs and updated columns for each base
segment. A deletion SLO therefore concerns refresh/commit publication and all
retained snapshots, not just writing a tombstone.

**RECOMMENDATION (high):** Curiosity should model tombstones as first-class,
generation-stamped policy records. Serving must apply them before returning a
hit; compaction later reclaims bytes. Snapshot retention must never defeat a
legal/safety deindex: retained content may remain in restricted backup storage,
but must be masked from every serving view.

### 6.3 Merge policy and backpressure

**FACT (high):** the default `TieredMergePolicy` merges approximately equal-size
segments when the index exceeds a tier budget. It may choose nonadjacent
segments and scores candidates by size skew, total bytes, and deletes reclaimed.
Current documented defaults include 16 MB floor, 8 segments/tier, up to 10
segments per normal merge, approximately 5 GB maximum merged segment, and 20%
allowed deleted-doc space [S16].

**FACT (high):** `ConcurrentMergeScheduler` runs merges in separate threads,
prioritizes smaller merges, can pause large merges, and stalls indexing threads
when pending/running merges exceed limits. Auto-detected defaults are CPU- and
SSD-oriented; optional adaptive I/O throttling exists [S17]. A merge may need up
to roughly one extra copy of merged bytes, or two when open readers retain old
files [S12]. Snapshots can likewise retain about another index copy at an
unfortunate time [S13].

**INFERENCE (high):** merge debt is a resource-control loop, not housekeeping.
Flush rate, segment count, deletion reclamation, query fan-out, page-cache churn,
write amplification, and free disk are coupled.

**RECOMMENDATION (high):** make compaction policy and execution separate. Score
candidates with measurable read-amplification benefit, delete reclamation,
write cost, age, and available space. Bound workers and bytes/sec; backpressure
ingestion before reserve space is endangered. Avoid routine force-merge: it can
create huge rewrites, cache shocks, and snapshot amplification.

### 6.4 Crash-safe commit and file lifetime

**FACT (high):** tagged 10.5.1 source shows a two-step commit: write and sync a
new `pending_segments_N`, then rename it to `segments_N` and sync directory
metadata. The manifest carries segment codec, delete/field-info/doc-value
generations, counts, optional user metadata, and a checksum footer [S21].
`IndexWriter.commit()` syncs referenced files so changes survive OS/machine
crash or power loss [S12].

**FACT (high):** tagged source reference-counts files across all live commit
points and the in-memory writer checkpoint. Files are deleted only when no live
view references them; an `IndexDeletionPolicy` chooses old commits to retire.
The default keeps only the latest commit [S22]. `SnapshotDeletionPolicy` pins a
commit; its basic form is in-memory only, while a persistent variant is required
to survive process failure [S13].

**RECOMMENDATION (high):** independently design a content-addressed or unique-
generation immutable file set plus a small checksummed manifest. Publication is:
write -> validate -> sync data -> write/sync pending manifest -> atomic publish
-> sync namespace. On startup, select the latest fully valid manifest, never the
largest data filename. Keep a manifest/file reference ledger; garbage collect
only after reader leases, replication leases, and snapshot policy release it.

## 7. Concurrency and near-real-time search

**FACT (high):** one `IndexWriter` accepts concurrent mutation calls; readers
and searchers are also thread-safe. Existing readers retain their point-in-time
view while a new reader is opened. `openIfChanged` can reuse unchanged segment
sub-readers and is cheaper than reopening everything [S12][S14]. Search can run
leaf slices concurrently, and 10.x can partition a large segment for intra-
segment concurrency, though some query types pay per-partition setup costs [S9].

**FACT (high):** near-real-time opening can apply all buffered deletes or defer
their visibility for performance. Warming a newly merged segment can reduce the
latency shock before publishing it [S14].

**INFERENCE (high):** snapshot isolation should be the serving concurrency
primitive. Reader refresh is pointer replacement plus reference management, not
shared mutable index state. Parallelism must be budgeted across query branches,
segments, vector traversal, and collectors to avoid nested oversubscription.

**RECOMMENDATION (high):** Curiosity query responses must name an immutable
`index_snapshot_id`. Publish a fully opened/validated reader set atomically,
drain old readers by lease, and warm only measured hot structures. Use one
bounded executor policy with request-level CPU/deadline quotas. Make refresh,
commit, and replication durability separate states in telemetry.

## 8. Vector support

**FACT (high):** Lucene stores one dense float or byte vector (or none) per
document/field with fixed dimension and similarity. Float vector fields support
up to 1,024 dimensions in the documented default field type [S24]. Vector files
separate raw values, metadata, optional quantized values, and HNSW graph data
[S2]. HNSW is based on a published multilayer proximity-graph algorithm whose
paper describes probabilistic layers and approximate search [S23].

**FACT (high):** filtered kNN chooses per leaf between exact and approximate
search: if filter cost is below `k`, it uses exact scoring; otherwise it runs
filtered ANN and may fall back to exact if traversal exceeds a visit limit
[S25]. Lucene 10.4 added per-vector optimized scalar quantization at 1, 2, 4, 7,
or 8 bits and configurable HNSW connection/beam parameters [S1][S26]. Lucene
10.5.1 fixed graph reuse and quantized-score correctness bugs, evidence that
vector/merge interactions remain operationally delicate [S1].

**INFERENCE (high):** vector retrieval is an additional lossy candidate channel,
not a citation store and not a substitute for lexical exactness. Segment merges
affect graph construction cost and potentially result stability; quantization
adds another model/format/recall version.

**RECOMMENDATION (high):** defer owned ANN until lexical retrieval, provenance,
and evaluation are stable. Then:

- record embedding model, tokenizer, dimension, normalization, similarity,
  quantization, and graph-build versions per segment;
- maintain exact scoring for small filtered sets and evaluation samples;
- fuse lexical and vector ranks as separate channels before reranking;
- report approximate/partial/timeout status and visited-work budget;
- gate every quantization/graph change on recall@k, exact/entity regressions,
  tail latency, memory, merge time, and deterministic snapshot reproducibility.

Do not infer that Lucene's bit settings or graph parameters generalize to
Curiosity embeddings.

## 9. Performance and operations

### 9.1 Durable principles versus local optimizations

| Layer | Durable principle to adapt | Lucene-specific detail to defer/reject |
| --- | --- | --- |
| I/O | immutable files, checksums, sequential merge and random query hints | exact extensions, mmap arena behavior, `madvise` policy |
| terms/postings | block access, delta coding, skip/upper-bound metadata | 25–48 term blocks, 256/8,192 posting constants, SIMD code |
| values | dense ordinal addressing with explicit missingness | current adaptive numeric/binary encodings |
| scoring | separate exhaustive match from competitive top-k | collector class hierarchy and heap implementation |
| merging | costed policy, bounded executor, ingestion backpressure | TieredMergePolicy formula/default thresholds |
| vectors | exact fallback, measured ANN recall, versioned representation | Lucene HNSW file layout and scalar quantizer |

**FACT (high):** `FSDirectory` is recommended to use the OS disk cache;
`MMapDirectory` maps file-sized virtual address ranges, can preload selectively,
and supports platform page-access advice. It warns about address space,
interrupt/channel behavior, and cold-cache/opening trade-offs [S9][S27].

**FACT (high):** `CheckIndex` verifies postings, stored fields, doc values,
norms, points, vectors, live docs, and sort invariants. Full verification reads
every byte and can be expensive; its repair mode drops entire broken segments
and is explicitly destructive [S28].

**RECOMMENDATION (high):** operational telemetry should include:

- ingest docs/bytes/tokens/sec; analyzer rejects and oversized terms;
- active/flushing bytes, segment count/size/age, refresh and commit latency;
- merge queued/running bytes, write amplification, throttle/stall time, deletes;
- snapshot/reader counts and pinned bytes; orphan-file and checksum findings;
- page faults/resident bytes/file handles, cache warmup, read bytes by lane;
- query rewrite clauses, postings visited/skipped, exact/lower-bound hit count,
  collector CPU, timeout/partial state, p50/p95/p99 by query class;
- vector visits, exact fallbacks, recall audit, graph/quantization build cost.

Reserve disk for largest plausible merge plus retained readers/snapshots. Run
non-destructive validation continuously on newly built files and sampled full
offline checks; restore from immutable source/manifests rather than making a
destructive checker the normal recovery plan.

## 10. Clean-room and license boundary

### 10.1 Facts and controls

**FACT (high):** Lucene 10.5.1 is distributed under Apache License 2.0. The
license grants copyright and contributor patent permissions subject to terms;
redistribution requires the license, preservation of relevant notices, marked
modified files, and NOTICE handling. It does not grant trademark rights. The
release license includes additional notices for Unicode, Python-derived work,
automata, stemmers/dictionaries, LZ4, and other components [S19].

**RECOMMENDATION (high):** because Curiosity's owned-core requirement is stricter
than Apache-2.0 compliance, use this separation:

| Allowed learning input | Control |
| --- | --- |
| Public BM25/HNSW papers and general IR literature | independent written spec; patent review where applicable |
| Official behavioral/file-format documentation | extract requirements, not prose/code; cite source and version |
| Aggregate benchmark hypotheses | rerun on project-owned corpora; do not claim Lucene numbers |
| Black-box comparison through a separately installed Lucene oracle | authorized fixtures only; compare outputs/metrics, never import index files |

| Excluded from owned core | Reason |
| --- | --- |
| Lucene source or translated/pseudocopied methods | derivative/attribution and contamination risk |
| Lucene tests, generated automata/tables, dictionaries, analyzers, codecs | copyright/data-license provenance and hidden design transfer |
| Lucene index files as production seed or format contract | binds behavior to evolving third-party codec and data provenance |
| Lucene names/trademarks as project identity | Apache-2.0 does not grant trademark rights [S19] |

Researchers who read source should deliver this behavior-level record and test
properties. Implementers should work from an approved neutral specification,
project-authored fixtures, and independently chosen structures. Keep research,
specification, implementation, and similarity review histories. If the project
instead decides to embed Lucene, classify it honestly as an Apache-2.0 third-
party dependency and complete LICENSE/NOTICE/SBOM/security obligations; do not
call that path “from scratch.”

### 10.2 Conceptual reproduction verdicts

| Concept | Verdict | Independent target |
| --- | --- | --- |
| immutable segments + atomic manifest | **ADOPT** | project-owned format and crash tests |
| reader snapshots + file reference leases | **ADOPT** | explicit snapshot/deindex semantics |
| term blocks + prefix router | **ADAPT** | simplest measured structure, no Lucene layout |
| positional postings and separate payload lanes | **ADOPT** | typed field capability contract |
| stored-result versus column values | **ADOPT** | project-defined row/column formats |
| analyzer pipeline/versioning | **ADOPT** | independent Unicode/language policies |
| BM25 | **ADAPT** | paper-derived formula, tuned and versioned |
| competitive top-k block skipping | **ADAPT** | only after exhaustive equivalence oracle |
| tiered compaction/backpressure | **ADAPT** | workload-derived cost policy |
| HNSW/vector quantization | **DEFER** | paper-derived ANN after lexical gates |
| Lucene codecs, constants, source/tests | **REJECT** | no transfer into owned core |
| Lucene as production core | **REJECT for current owned-core decision** | may be external benchmark oracle only |

## 11. Curiosity-specific implications and checks

1. **Snapshot provenance — ADOPT.** Every search response and citation carries
   snapshot, analyzer, scoring, and passage-extractor versions. A rank score is
   local to that tuple.
2. **Evidence identity — ADOPT.** Stable document/capture/passage hashes survive
   segment renumbering and compaction. Stored snippets never become authority.
3. **Multi-lane retrieval — ADAPT.** Lexical postings remain exact baseline;
   later vectors are visibly separate candidates. Filters and tombstones apply
   before final serving.
4. **Bounded execution — ADOPT.** Rewrite clauses, candidate visits, collectors,
   hit counting, vector visits, CPU, wall time, and returned bytes have explicit
   limits and partial-result semantics.
5. **Refresh versus durability — ADOPT.** `search_visible`, `committed`,
   `replicated`, and `backup_verified` are distinct states. Curiosity does not
   cite an uncommitted view unless policy explicitly permits and records it.
6. **Deletion precedence — ADAPT.** Serving masks propagate independently of
   physical compaction and snapshot retention.
7. **Curiosity branching — ADAPT.** Per-branch collectors can retrieve primary,
   disconfirming, temporal, and stakeholder evidence, then a bounded reducer
   diversifies. The index does not autonomously authorize new branches.

**Pre-implementation checks:** crash at every manifest publication boundary;
reopen latest valid snapshot; exhaustive-versus-skipping ranking equivalence;
randomized merge/delete/update history; analyzer golden corpus across Unicode
and language changes; stable citation reconstruction after merge; deletion mask
across old snapshots; disk-full and checksum corruption; reader lease leaks;
merge-debt backpressure; exact-versus-ANN recall by filters; score non-
comparability across snapshots; deterministic tie-breaking by external ID.

## 12. Unknowns, contradictions, and negative results

### Material unknowns

- **UNKNOWN (high impact):** Curiosity's corpus size, update/delete rate, query
  mix, memory/storage hardware, and latency target are not fixed; therefore no
  block size, merge threshold, cache policy, or ANN parameter is recommended.
- **UNKNOWN (high impact):** language distribution and exact/entity query mix;
  analyzer policies cannot be selected responsibly without judged slices.
- **UNKNOWN (high impact):** deletion/takedown retention law and backup policy;
  snapshot mechanics alone do not settle legal erasure.
- **UNKNOWN (medium):** whether immutable citation content belongs inside the
  index or an object/capture store; benchmark reconstruction and failure modes.
- **UNKNOWN (medium):** HNSW/quantization value for Curiosity. No embeddings,
  authorized corpus, ground-truth neighbors, or memory budget were tested.

### Contradiction retained

**FACT (high):** the 10.5.1 `IndexWriter` class overview says the default merge
policy is `LogByteSizeMergePolicy`, while the 10.5.1 `IndexWriterConfig`
constructors explicitly say the default is `TieredMergePolicy` [S12][S16]. The
configuration documentation and `TieredMergePolicy` page agree with each other,
so this report treats Tiered as current and records the other sentence as stale
documentation. **CHECK:** verify against a released binary/config dump before
making any operational assumption.

### Negative results

- No official guarantee was found for a fixed near-real-time refresh latency;
  the docs explicitly require workload experimentation [S14].
- No evidence was found that Lucene scores are calibrated probabilities or
  stable across commits; the documented inputs imply the opposite [S15].
- No primary evidence supports transplanting Lucene's current block/merge/HNSW
  constants to a different corpus or implementation.
- No benchmark in this study independently validates Lucene release-note gains
  or predicts Curiosity performance.
- No license review supports importing Lucene analyzers/dictionaries while
  calling the resulting core wholly owned [S19].

## 13. Bounded curiosity pass

After synthesis, remaining threads were scored 1–5 for relevance (R), decision
value (V), novelty (N), and research cost (C, lower is cheaper). Pursuit score
was `R + V + N - C`.

| Thread | R | V | N | C | Score | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| commit manifest/file reclamation source check | 5 | 5 | 3 | 2 | 11 | **Pursued** [S21][S22] |
| filtered ANN exact-fallback behavior | 4 | 4 | 4 | 2 | 10 | **Pursued** [S25] |
| current merge-policy contradiction | 4 | 4 | 3 | 1 | 10 | **Pursued**, contradiction retained [S12][S16] |
| every 10.5.1 codec bit layout | 2 | 1 | 2 | 5 | 0 | `CURIOSITY_NO_GO`: implementation detail |
| reproduce nightly benchmarks | 3 | 4 | 3 | 5 | 5 | `CURIOSITY_NO_GO`: no build/corpus authority |
| Solr/Elasticsearch wrappers | 2 | 2 | 2 | 4 | 2 | `CURIOSITY_NO_GO`: outside Lucene Core frame |
| patent/FTO opinion for all IR algorithms | 4 | 5 | 3 | 5 | 7 | `CURIOSITY_NO_GO`: requires counsel; flagged |

**Stop reason:** coverage and saturation. The best gaps were checked; further
codec/source reading repeated optimization patterns without changing the
owned-core decision. No live autonomous follow-up is authorized.

## Sources

All web sources accessed **2026-08-17**. Links pin 10.5.1 or its release tag
where available.

- **[S1]** Apache Lucene, “Lucene Core News,” 10.5.1/10.5.0/10.4.0 release
  notes. https://lucene.apache.org/core/corenews.html
- **[S2]** Apache Lucene 10.5.1, “Lucene 10.4 file format / Index File
  Formats.” https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/codecs/lucene104/package-summary.html
- **[S3]** Apache Lucene 10.5.1, Codecs API. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/codecs/package-summary.html
- **[S4]** Apache Lucene 10.5.1, `Lucene103BlockTreeTermsWriter`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/codecs/lucene103/blocktree/Lucene103BlockTreeTermsWriter.html
- **[S5]** Apache Lucene 10.5.1, `Lucene104PostingsFormat`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/codecs/lucene104/Lucene104PostingsFormat.html
- **[S6]** Apache Lucene 10.5.1, `Lucene90StoredFieldsFormat`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/codecs/lucene90/Lucene90StoredFieldsFormat.html
- **[S7]** Apache Lucene 10.5.1, `Lucene90DocValuesFormat`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/codecs/lucene90/Lucene90DocValuesFormat.html
- **[S8]** Apache Lucene 10.5.1, `Analyzer`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/analysis/Analyzer.html
- **[S9]** Apache Lucene 10.5.1, `IndexSearcher`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/search/IndexSearcher.html
- **[S10]** Apache Lucene 10.5.1, `Collector`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/search/Collector.html
- **[S11]** Apache Lucene 10.5.1, `ScoreMode`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/search/ScoreMode.html
- **[S12]** Apache Lucene 10.5.1, `IndexWriter`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/index/IndexWriter.html
- **[S13]** Apache Lucene 10.5.1, `SnapshotDeletionPolicy`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/index/SnapshotDeletionPolicy.html
- **[S14]** Apache Lucene 10.5.1, `DirectoryReader`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/index/DirectoryReader.html
- **[S15]** Apache Lucene 10.5.1, `BM25Similarity`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/search/similarities/BM25Similarity.html
- **[S16]** Apache Lucene 10.5.1, `IndexWriterConfig` and
  `TieredMergePolicy`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/index/IndexWriterConfig.html ; https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/index/TieredMergePolicy.html
- **[S17]** Apache Lucene 10.5.1, `ConcurrentMergeScheduler`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/index/ConcurrentMergeScheduler.html
- **[S18]** Apache Lucene 10.5.1 release-tag source,
  `TopScoreDocCollector.java`. https://github.com/apache/lucene/blob/releases/lucene/10.5.1/lucene/core/src/java/org/apache/lucene/search/TopScoreDocCollector.java
- **[S19]** Apache Lucene 10.5.1 release-tag `LICENSE.txt`. https://github.com/apache/lucene/blob/releases/lucene/10.5.1/LICENSE.txt
- **[S20]** S. E. Robertson et al., “Okapi at TREC-3,” *TREC-3*, 1994;
  attribution and formula entry point in [S15]. https://trec.nist.gov/pubs/trec3/t3_proceedings.html
- **[S21]** Apache Lucene 10.5.1 release-tag source, `SegmentInfos.java`.
  https://github.com/apache/lucene/blob/releases/lucene/10.5.1/lucene/core/src/java/org/apache/lucene/index/SegmentInfos.java
- **[S22]** Apache Lucene 10.5.1 release-tag source,
  `IndexFileDeleter.java`. https://github.com/apache/lucene/blob/releases/lucene/10.5.1/lucene/core/src/java/org/apache/lucene/index/IndexFileDeleter.java
- **[S23]** Y. A. Malkov and D. A. Yashunin, “Efficient and robust
  approximate nearest neighbor search using Hierarchical Navigable Small World
  graphs,” arXiv:1603.09320v4. https://arxiv.org/abs/1603.09320
- **[S24]** Apache Lucene 10.5.1, `KnnFloatVectorField`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/document/KnnFloatVectorField.html
- **[S25]** Apache Lucene 10.5.1, `KnnFloatVectorQuery`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/search/KnnFloatVectorQuery.html
- **[S26]** Apache Lucene 10.5.1,
  `Lucene104HnswScalarQuantizedVectorsFormat`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/codecs/lucene104/Lucene104HnswScalarQuantizedVectorsFormat.html
- **[S27]** Apache Lucene 10.5.1, `MMapDirectory`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/store/MMapDirectory.html
- **[S28]** Apache Lucene 10.5.1, `CheckIndex`. https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/index/CheckIndex.html
