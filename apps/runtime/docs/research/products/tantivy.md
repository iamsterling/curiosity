# Tantivy reverse-engineering dossier

**Accessed:** 2026-08-17  
**Decision frame:** what Tantivy's documented and source-observable design teaches
Curiosity's wholly owned lexical-search plane, without adopting or copying Tantivy.  
**Scope:** schema and analysis, immutable segments, postings/stored/fast fields,
BM25 and query execution, writer/reader concurrency, commits/merges/deletes,
persistence/performance, licensing, and clean-room implications.  
**Status:** research only; no implementation, dependency adoption, corpus use, or
deployment is authorized.

## Executive verdict

**RECOMMENDATION — ADAPT the architecture, REJECT the library as Curiosity's
owned core (high confidence).** Tantivy is a strong, inspectable example of a
Lucene-style embedded search library: immutable independently searchable
segments, an atomic manifest, snapshot readers, compact postings, schema-selected
storage paths, commit-gated visibility, tombstones, and background compaction.
These are the right concepts for Curiosity's first lexical index. Tantivy itself
is third-party MIT software, however, and ADR 0021 says third-party index engines
are comparative evidence rather than the production foundation [S1][S2].

The most important lesson is not a file format. It is the separation of:

1. durable logical identity and provenance outside the index;
2. immutable physical search snapshots inside the index;
3. a short atomic publication point (`meta.json` in Tantivy);
4. query-global statistics followed by segment-local execution;
5. candidate collection before stored-document materialization; and
6. asynchronous space/performance maintenance that does not change the logical
   result set.

Curiosity should **not** reproduce Tantivy's internal encodings from source. It
should independently specify behavior, invariants, corruption tests, and
measurements. In particular, Curiosity needs stronger first-class support than
Tantivy exposes for capture/version identity, analyzer versioning, temporal
validity, policy tombstones, passage provenance, deterministic rank traces, and
snapshot retention.

## 1. Frame, evidence, and version boundary

### 1.1 Bounded questions

1. What invariants make a Tantivy index searchable while indexing and merging?
2. Which schema decisions determine retrieval capability, ranking, and storage
   cost?
3. How do terms become candidates and BM25 scores across many segments?
4. What exactly do commit, reload, delete, merge, rollback, and garbage
   collection mean?
5. Which persistence and performance claims are architectural facts, and which
   require Curiosity-specific measurement?
6. Which lessons are safe to carry into an independently authored owned core?

**Stop rule:** source inspection stopped after every requested category had a
primary-source-backed data/control path, lifecycle semantics, Curiosity
consequence, and explicit unknown/check. No benchmark, failure injection, index
fixture, or black-box compatibility experiment was run.

### 1.2 Evidence baseline

- The latest published rustdoc visible on the access date was **Tantivy 0.26.1,
  released 2026-07-10**. Annotated tag object
  `0093923d94157d9f1f63a292bb504bb8db401f2a` peels to release commit
  `d8f4c0b703120ed98f06297724dc1522df6019b9` [S3][S4].
- The official `main` branch inspected clean-room was commit
  `039a72958e8a2803cd30ad9ab71da990bf121833`; its manifest says `0.27.0`, so it
  is treated as **unreleased forward evidence**, not as 0.26.1 behavior [S5].
- Public API claims below rely on versioned 0.26.1 rustdoc/source. Claims marked
  **MAIN** describe the pinned `main` snapshot and must be rechecked against a
  release before adoption.
- The official architecture note is useful but partly stale. Current source wins
  where they conflict—for example, the note describes a simple bitpacked fast
  field and no substantive doc-store cache, while current source uses
  auto-selected columnar codecs and a configurable decompressed-block LRU
  [S6][S15][S16].

Labels: **FACT** is directly evidenced; **INFERENCE** is reasoned but unmeasured;
**RECOMMENDATION** is a Curiosity choice. Confidence is high/medium/low.

## 2. Mental model and end-to-end flow

**FACT (high):** Tantivy is an embedded library, not a distributed search server.
An `Index` is a collection of segments; a `Searcher` holds segment readers for
one snapshot; an `IndexWriter` owns indexing and merging; a `Directory` abstracts
storage [S3][S6]. Distributed search is explicitly out of scope [S7].

```text
schema + tokenizer registry
        |
documents -> bounded writer queue -> N indexing workers
        |                            -> one mutable in-memory segment per worker
        |                            -> immutable component files
        |
commit -> finish/flush pending worker segments
       -> apply queued deletes as per-segment alive bitsets
       -> sync component directory
       -> atomically replace meta.json (publication point)
       -> optional reader watch/reload
       -> new Searcher snapshot

query -> Query -> snapshot-global Weight/BM25 statistics
      -> one Scorer + SegmentCollector per segment
      -> postings/positions/fast-field access
      -> collector merges segment fruits
      -> fetch only selected DocAddresses from compressed store

background merge -> read committed immutable segments + current deletes
                 -> rewrite live documents into a new immutable segment
                 -> atomically publish replacement segment set
                 -> later garbage-collect unreachable files
```

**INFERENCE (high):** this is copy-on-write at the segment-set level. Most large
files never change in place; the logical index advances by switching a small
manifest to a new set of immutable files. Delete generations are a bounded
exception in representation, not in snapshot semantics.

## 3. Schema and analyzers

### 3.1 Schema is a physical retrieval contract

**FACT (high):** the strict schema is persisted in root `meta.json`. It assigns a
name, type, and independent indexed/stored/fast behavior to each field. Published
0.26.1 types include text, integer and float types, bool, date, IP address,
facet, bytes, and JSON [S8].

For one logical value, the flags select different physical products:

| Choice                  | Physical/use consequence                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Indexed                 | Term dictionary + postings; searchable without scanning all rows.                                              |
| `Basic`                 | Doc IDs only; enough for membership/filtering, not term-frequency scoring.                                     |
| `WithFreqs`             | Adds per-document term frequency; supports BM25 term saturation.                                               |
| `WithFreqsAndPositions` | Adds positions; enables phrase/proximity behavior at extra space/I/O cost.                                     |
| Stored                  | Value enters the compressed row store and can be reconstructed after selection.                                |
| Fast                    | Value enters columnar random-access storage for sort, scoring features, aggregation, facets, and some filters. |

**FACT (high):** `STORED` does not make a field searchable, and `FAST` is not an
inverted index. The docs warn that some queries can scan an unindexed fast field,
but this is generally much slower than indexed lookup [S8].

**INFERENCE (high):** schema design is irreversible enough to treat as a versioned
build input. Adding positions, changing tokenization, or changing field roles
requires regenerating affected index products; a metadata edit cannot recover
discarded term frequencies, positions, or original text.

### 3.2 Analyzer pipeline and symmetry

**FACT (high):** a text analyzer is a tokenizer followed by token filters. The
published defaults are: `default` (split on whitespace/punctuation, remove long
tokens, lowercase), `raw` (one unprocessed token), and `en_stem` (default-like
processing plus English stemming). Custom analyzers are registered by name in a
`TokenizerManager`; the schema stores that name [S9]. Query parsing looks up the
field's analyzer and tokenizes query literals with it [S10].

**FACT (high):** published Tantivy asks custom tokenizer libraries to depend on
the smaller `tantivy-tokenizer-api`, not the full engine [S9].

**INFERENCE (high):** analyzer-name persistence is not analyzer-definition
persistence. Re-registering the same name with changed normalization can make
new queries semantically incompatible with old terms while the schema still
looks unchanged.

**RECOMMENDATION (high):** Curiosity should persist an immutable analyzer
descriptor and content hash—not just a name—with every index manifest. It should
version Unicode normalization, language detection, tokenizer/filter order,
stopword set, stemmer/model, token-length policy, and code/data artifacts.
Index-time and query-time analysis must resolve the same descriptor. Migration
should build a parallel snapshot and evaluate it before atomic cutover.

### 3.3 Curiosity field implications

**RECOMMENDATION (high):** use separate fields where retrieval semantics differ:
exact URL/host/identifier terms; analyzed title/body/anchor/passages; language;
capture and publication times; source/publisher cluster; content hash; safety and
policy state. Do not overload stored source text as a ranking column or use a
column scan as the normal lexical path.

**RECOMMENDATION (high):** because Tantivy's architecture note records a 1:1
ingested-to-indexed-field limitation (applications duplicate/concatenate before
ingestion), Curiosity's document plane should explicitly emit multiple derived
search fields from one immutable capture, each with derivation provenance [S6].

## 4. Immutable segment anatomy

### 4.1 Segment identity and files

**FACT (high):** a segment is independently searchable and identified by UUID.
Current **MAIN** source maps built-in components to separate files [S11]:

| Component         | Suffix           | Purpose                                                      |
| ----------------- | ---------------- | ------------------------------------------------------------ |
| Terms             | `.term`          | Per-field dictionary from serialized term to `TermInfo`.     |
| Postings          | `.idx`           | Sorted doc-ID lists and optional term frequencies/skip data. |
| Positions         | `.pos`           | Optional term-position deltas.                               |
| Fast fields       | `.fast`          | Column-oriented random access.                               |
| Field norms       | `.fieldnorm`     | Compressed field lengths used by scoring.                    |
| Store             | `.store`         | Compressed row-oriented stored fields.                       |
| Delete generation | `.<opstamp>.del` | Alive-doc bitset for a segment generation.                   |

The segment-local `DocId` is a compact `u32` assigned in ingestion order unless
index sorting/merge mapping intervenes; an index-level `DocAddress` is segment
ordinal plus local doc ID [S3][S6].

**INFERENCE (high):** `DocAddress` is a physical snapshot address, not a durable
document identity. Merge rewrites segment UUIDs and local IDs; even segment
ordinal can change between searchers.

**RECOMMENDATION (high):** Curiosity citations and deletion APIs must use stable
project-owned `document_id`, `capture_id`, `version_id`, and `passage_id`. A
physical address may be returned only with the exact `index_snapshot_id` and
must never escape as durable provenance.

### 4.2 Term dictionary, postings, positions

**FACT (high):** the inverted index composes `Term -> TermInfo -> postings`.
Serialization requires lexicographically sorted terms and increasing doc IDs per
term. `TermInfo` carries the addressing metadata needed to locate postings and
positions [S6][S12].

**FACT (high):** postings are doc-ID ordered, enabling streaming intersection,
union, exclusion, and seek. The official format description and current source
use blocks of 128: doc IDs are delta encoded and bitpacked; frequencies are
bitpacked; the non-full tail uses variable integers. Skip data accelerates seeks
and stores block-level scoring upper-bound inputs for eligible scored term lists
[S6][S13].

**FACT (high):** positions are optional token ordinals. Current source delta
encodes and SIMD-bitpacks them in 128-value blocks, with a variable-integer tail;
phrase queries consume this additional stream [S14].

**INFERENCE (high):** posting order supplies the fundamental bounded-execution
property: boolean matching advances cursors rather than materializing every hit.
Positions should be paid only for fields/query classes whose measured quality
benefit justifies the larger index and merge cost.

### 4.3 Stored fields versus fast fields

**FACT (high):** stored fields are serialized row-wise into blocks (default
16 KiB), compressed with the configured LZ4 or Zstd option, located through an
offset structure, and decompressed a block at a time. Current **MAIN** readers
have a configurable LRU of decompressed blocks; the reader-builder default is
100 blocks [S15][S17].

**FACT (high):** fast fields are columnar and support approximately array-like
random access. Current **MAIN** delegates to `tantivy-columnar`, which separates
column cardinality/indexing from dense values and selects among codecs during
serialization; supported cardinalities are full, optional, and multivalued
[S16][S18].

**INFERENCE (high):** fetching stored bodies inside the match loop defeats the
two-stage design. Match/rank with postings, norms, and selected fast fields;
materialize only the final result and passage records. This is especially
important for broad web queries.

**RECOMMENDATION (high):** Curiosity should not use a search segment's stored
document as the authoritative capture. Immutable source bytes/WARC and extracted
versions belong in the document plane. The search store should contain only the
bounded serving projection needed for snippets/result display, reproducibly
derived from a capture and extractor version.

## 5. BM25 and query execution

### 5.1 Exact observed scoring model

**FACT (high):** Tantivy 0.26.1 fixes BM25 parameters at `k1 = 1.2` and
`b = 0.75`. For one term it computes:

```text
idf = ln(1 + (N - n + 0.5) / (n + 0.5))

score = idf * (k1 + 1) * tf
        / (tf + k1 * (1 - b + b * dl / avgdl))
```

where `n` is term document frequency, `N` the document count used by the
statistics provider, `dl` the compressed field norm decoded to field length, and
`avgdl` total field tokens divided by `N` [S19]. Query boosts multiply the weight.
The public API permits a custom `Bm25StatisticsProvider`, but not per-query
`k1`/`b` configuration [S20].

**FACT (high, subtle):** in 0.26.1, the default BM25 provider sums each segment's
`max_doc`, total token count, and raw inverted-index document frequency. `max_doc`
includes deleted slots, while `Searcher::num_docs()` uses live `num_docs`.
Therefore tombstoned documents can continue influencing default BM25 corpus
statistics until a merge physically removes them [S19][S21].

**INFERENCE (high):** even if the set of live documents is unchanged, compaction
can change scores by expunging deleted documents from statistics. Normal commits
also change global IDF and average length. Scores are consequently snapshot-local
and not stable business values.

**RECOMMENDATION (high):** Curiosity must include snapshot/ranker/analyzer IDs
with any score; never compare raw scores across snapshots. Decide explicitly
whether deleted/policy-hidden documents affect collection statistics, document
that choice, and regression-test rank movement across tombstone compaction.

### 5.2 Query -> Weight -> Scorer -> Collector

**FACT (high):** `Query` defines matches and scoring. It builds one `Weight` tied
to the searcher, allowing global statistics to be computed once. The weight then
builds a segment-specific `Scorer`, a sorted cursor over matching docs. A
`Collector` creates per-segment collectors and merges their outputs [S20][S22].
Collectors declare whether they require scoring; disabling scoring avoids work
for counts/filters [S20].

**FACT (high):** default search walks the snapshot's segments, while an explicit
parallel executor can schedule one task per segment. Official docs warn that this
cannot accelerate one large segment and may reduce throughput even while lowering
single-query latency [S22].

**FACT (high; MAIN):** scored boolean unions/intersections of eligible term
scorers use block-max/WAND-style dynamic pruning only when frequencies and a
compatible score combiner are available. Posting skip data carries conservative
block maxima; the collector's evolving top-K threshold permits blocks/documents
that cannot beat the threshold to be skipped [S13][S23]. Noneligible query shapes
fall back to ordinary scorer iteration.

**INFERENCE (medium):** “supports Block-WAND” is not “every top-K query is
sublinear.” Query shape, term frequency option, collector, score combiner,
threshold quality, segment count, and term distribution determine the realized
gain.

**RECOMMENDATION (high):** Curiosity's first scorer should have a simple
published deterministic formula and a query-plan trace: analyzed terms, filters,
snapshot, statistics generation, candidate counts, pruning mode, and bounded
reason classes. Performance optimizations must be observationally equivalent to
the exhaustive scorer on generated and adversarial fixtures.

## 6. Writer/reader concurrency and visibility

### 6.1 Writer side

**FACT (high):** one `IndexWriter` acquires an index-directory writer lock. It
owns a bounded shared operation queue and multiple indexing worker threads; each
worker builds an independent mutable segment using its configured memory arena.
`add_document` can block when the pipeline is full. A single-thread segment
updater serializes metadata transitions; separate merge threads perform expensive
rewrites [S24].

**FACT (high):** operations receive monotonically increasing `u64` opstamps.
Grouped operations receive contiguous opstamps and are flushed into the same
segment, but visibility still waits for commit [S25]. This is operation ordering,
not a globally meaningful document ID.

**INFERENCE (high):** writer memory is intentionally bounded by worker arenas and
queue backpressure, but transient disk and I/O are not bounded by the same
number: flushing and concurrent merges can coexist with old snapshot files.

### 6.2 Reader side

**FACT (high):** `IndexReader` owns the current searcher through an atomically
swapped reference. With the default delayed-on-commit policy it watches
`meta.json`, opens and optionally warms a new segment set, then swaps it in.
Manual reload is available. Each query should acquire one `Searcher` and retain
it for the whole query to guarantee a consistent segment set [S26].

**FACT (high):** an existing `Searcher` remains an immutable snapshot and keeps
its segment files from deletion. Garbage collection can fail to remove mapped
files—especially on Windows—while a searcher remains alive; this is expected and
retried later [S17][S22].

**INFERENCE (high):** commit success and read freshness are separate events.
There is a visibility interval between durable publication and automatic reload,
and already acquired searchers never change.

**RECOMMENDATION (high):** Curiosity's response contract should expose exact
`index_snapshot_id` and snapshot age. A “read your commit” path must wait for a
reader generation at or beyond the committed source watermark, not merely for
writer commit return. Put hard lifetime/lease limits on snapshots so abandoned
queries cannot pin unbounded obsolete storage.

## 7. Commit, rollback, deletes, merges, and garbage collection

### 7.1 Commit and rollback

**FACT (high):** `commit()` is explicit and blocking. It drains pending work,
flushes partial worker segments, applies deletes up to the commit opstamp,
persists files, and publishes the new segment list/opstamp/payload by atomically
writing `meta.json`. After return, published changes are documented as persisted
and crash-resumable if the disk survives [S25][S27].

**FACT (high):** `prepare_commit()` cuts the queue and flushes workers, then
allows commit or abort. Current **MAIN** explicitly notes that final commit is
still non-lightweight because deletes have not yet been flushed. `rollback()`
cancels changes since the last commit and returns its opstamp [S25][S28].

**INFERENCE (high):** `meta.json` is the linearization/publication point, while
component files are prepared beforehand. Orphaned unreferenced files are safe
only if managed-file tracking and garbage collection are correct.

### 7.2 Delete semantics

**FACT (high):** published 0.26.1 deletion is term-based: all documents
containing a term are tombstoned after commit. Tantivy has no primary-key concept;
the application conventionally indexes an exact ID field and deletes its term
[S6][S25]. A delete affects earlier operations according to opstamp ordering,
including earlier adds in the same commit, but not later adds [S25].

**FACT (high):** deletion writes a new per-segment alive bitset generation and
updates metadata; it does not rewrite postings/store/fast fields immediately.
Queries intersect matches with live docs. Physical reclamation occurs through a
merge [S6][S11].

**INFERENCE (high):** “delete then add” is an update protocol, not an in-place
mutation. Its correctness depends on exact ID analysis, op ordering, commit
success, and external source-of-truth recovery.

**RECOMMENDATION (high):** Curiosity needs two distinct concepts:

- **logical/version update:** append a new immutable capture/version and adjust
  serving validity;
- **policy deletion/deindex:** immediately exclude IDs at query time, record a
  durable auditable tombstone, and later compact bytes under retention/legal
  rules.

Do not make copyright/privacy deletion depend on eventual merge. Exact stable IDs
must use non-tokenizing normalization whose version is fixed.

### 7.3 Merge semantics

**FACT (high):** the default `LogMergePolicy` groups segments of similar document
count and selects size levels with enough members; **MAIN** defaults are eight
segments, 10,000 minimum layer size, and 10,000,000 docs as the eligibility
ceiling. Its default delete-ratio threshold is `1.0`, and source comments call
that backward-compatible default not very sensible because it effectively does
not independently trigger deletion cleanup [S29]. These are implementation
defaults, not universal recommendations.

**FACT (high):** merge runs on background threads, applies deletes through a
target opstamp, rewrites live documents/components into a new segment, catches up
deletes that arrived during the rewrite before accepting it, then publishes the
replacement through the serialized updater. Committed and uncommitted segments
are considered separately [S27][S30].

**FACT (high):** merging removes tombstoned rows and remaps doc IDs. Optional
index sorting can also reorder live documents. The old files remain available to
existing searcher snapshots until no longer referenced and collected [S30].

**INFERENCE (high):** merge is logically transparent for live-match membership
but not bitwise transparent: segment IDs, doc addresses, corpus statistics,
scores, file layout, and latency can change. Merge amplification competes with
ingest and search for CPU, I/O, and temporary space.

**RECOMMENDATION (high):** Curiosity merge policy should be driven by measured
segment fan-out, deleted-byte ratio, read amplification, write amplification,
temporary-space headroom, and freshness SLO—not copied constants. Keep an
emergency no-merge/backpressure mode and explicit disk-watermark behavior.

## 8. Persistence, integrity, and performance

### 8.1 Persistence and recovery properties

**FACT (high):** `Directory` is a write-once/read-many abstraction. Tantivy ships
memory-mapped and RAM implementations and allows custom directories [S3][S17].
In current **MAIN**, manifest publication first syncs the directory and then uses
the directory's atomic-write primitive for `meta.json` [S27].

**FACT (high; MAIN):** managed component files receive a footer containing the
index-format/library version and CRC32 of the body. The inspected source reports
format version 7 and readable range 4–7, and exposes checksum validation [S31].

**INFERENCE (medium):** CRC and atomic manifest replacement detect many torn or
corrupt files but are not end-to-end authenticity, replica consensus, or backup.
Actual crash guarantees depend on the `Directory` implementation and underlying
filesystem/object-store semantics.

**RECOMMENDATION (high):** Curiosity must specify a storage contract before
adapters: immutable content-addressed component objects, checksums, format and
schema/analyzer versions, source watermarks, manifest generation, atomic
compare-and-swap publication, and startup validation. Test power loss at every
publication step. Retain at least one verified previous manifest for rollback;
backup the authoritative captures/document log, not just reconstructable search
segments.

### 8.2 Performance model—not a benchmark result

**FACT (high):** the design's performance levers are compact segment-local IDs,
sorted/delta-compressed postings, block seeks and score bounds, mmap-friendly
immutable reads, optional positions/frequencies, columnar fields, block-compressed
stored fields, bounded writer arenas, segment-parallel search, and background
merge [S3][S6][S13][S16][S22].

**INFERENCE (high):** costs trade across stages:

- more indexing workers improve ingest parallelism but increase active memory
  and initial segment count;
- frequent commits improve freshness/recovery points but create small segments,
  fsync pressure, and merge work;
- positions/frequencies improve ranking/query capability but enlarge index and
  compaction I/O;
- many segments increase per-query setup/fan-out and file handles;
- larger stored blocks improve compression but amplify random-result decode;
- long-lived snapshots preserve consistency but delay reclamation;
- background merge can improve future reads while worsening current tail latency.

**UNKNOWN:** no Curiosity corpus benchmark was run, so no throughput, p50/p95/p99,
index-size ratio, startup, commit, recovery, or merge-amplification number is
accepted here. Tantivy's project benchmarks are vendor/project evidence, not a
Curiosity sizing basis [S7].

**RECOMMENDATION (high):** benchmark with authorized Curiosity-like captures and
query classes. Measure ingest docs/bytes per second, peak RSS per worker, commit
latency, segment count, postings/positions/store/fast-field bytes, cold/warm
top-K latency, phrase/filter/sort/aggregation latency, stored-hit decode, delete
visibility, score stability, merge CPU/I/O/write amplification, temporary disk,
snapshot-pinned garbage, crash recovery, and checksum scan time. Report quality
(recall/nDCG/diversity) beside latency; never optimize an unjudged ranker.

## 9. License and clean-room boundary

### 9.1 License facts

**FACT (high):** Tantivy's root manifest and LICENSE identify the project as MIT.
The license permits use, modification, distribution, sublicensing, and sale, but
requires preservation of the copyright and permission notice in copies or
substantial portions and disclaims warranty [S5][S32].

**FACT (high):** “MIT” does not make copied code project-owned. Tantivy also has
many dependencies with their own versions and obligations; adopting the crate
would require dependency/SBOM and exact-version review, not just reading the root
license [S3][S5].

**UNKNOWN:** this research did not perform patent clearance, contributor-title
review, transitive license audit, security audit, or legal analysis. No conclusion
about freedom to operate follows from the MIT file.

### 9.2 Clean-room rules for Curiosity

**RECOMMENDATION (high):** retain this report as a behavioral/design research
record only. An owned-core implementation specification may adopt abstract ideas
and published equations, but must:

1. cite origins and independently state required behavior/invariants;
2. avoid copying or line-by-line translating Tantivy code, comments, tests,
   constants, serialized layouts, names, or fixture outputs;
3. derive BM25 from its published literature/specification, not from Tantivy's
   implementation text, and record a patent/FTO check;
4. use independently authored property tests and authorized synthetic fixtures;
5. avoid reading Tantivy source during implementation where organizational clean
   room requires role separation;
6. treat interoperability with Tantivy's private format as out of scope unless
   separately authorized and specified from permissible evidence; and
7. record any future decision to embed/link Tantivy as a third-party dependency,
   including notices and transitive obligations, in a new ADR.

**REJECTED (high confidence):** vendoring Tantivy, translating its codecs,
claiming its MIT code as Curiosity-owned, or using a Tantivy index as the
long-term provenance store.

## 10. Curiosity decision ledger

| Concept                             | Verdict                   | Curiosity adaptation                                                                                                  |
| ----------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Strict, typed field schema          | **ADOPT**                 | Version schema as a physical build contract; separate exact, analyzed, temporal, provenance, and policy fields.       |
| Named analyzer registry only        | **ADAPT**                 | Persist content-addressed analyzer definitions and migration lineage, not mutable names alone.                        |
| Immutable independent segments      | **ADOPT**                 | Build immutable, checksummed lexical components from a durable document/version log.                                  |
| Small atomic manifest               | **ADOPT**                 | Manifest includes snapshot, source watermark, schema/analyzer/ranker versions, checksums, and rollback parent.        |
| Segment-local compact IDs           | **ADOPT internally**      | Never expose them as document/citation IDs.                                                                           |
| Indexed/stored/fast separation      | **ADOPT**                 | Postings for candidate generation, columns for selected features, bounded serving projection for result hydration.    |
| Optional freqs/positions            | **ADOPT**                 | Enable by evaluated field/query class; preserve an exact-field lane.                                                  |
| Query/Weight/Scorer/Collector split | **ADAPT**                 | Separate query-global statistics, segment-local cursors, and bounded result reducers with traceable plans.            |
| Fixed Tantivy BM25                  | **ADAPT**                 | Begin with independently specified deterministic BM25; version parameters/statistics and test deletion/merge effects. |
| Block-max dynamic pruning           | **DEFER**                 | Add only after exhaustive-equivalence tests and profiling show top-K value.                                           |
| One writer, many snapshot readers   | **ADOPT**                 | Single publication authority per shard; lock-free/low-lock immutable readers with snapshot IDs and leases.            |
| Commit-gated visibility             | **ADOPT**                 | Make durable publication and reader-observed watermark explicit; supply read-after-commit waiting.                    |
| Term tombstones/alive bitsets       | **ADAPT**                 | Stable-ID and policy tombstone overlay with immediate serving exclusion; compact later.                               |
| Similar-size background merge       | **ADAPT**                 | Tune from Curiosity workload and disk/latency gates; do not copy defaults.                                            |
| Search store as source of truth     | **REJECT**                | Captures and extracted versions remain authoritative outside the reconstructable index.                               |
| Tantivy crate in owned core         | **REJECT** under ADR 0021 | Research comparison only; any executable comparison or oracle use requires a later ADR.                               |
| Tantivy file-format compatibility   | **REJECT/DEFER**          | No requirement or clean-room value established.                                                                       |

## 11. Required checks before design approval

1. **Analyzer reproducibility:** prove identical terms from pinned index/query
   analyzer artifacts across process restart and rolling upgrade.
2. **Snapshot atomicity:** failure-inject every component write, sync, manifest
   swap, reload, and GC boundary; observe only old or complete new snapshot.
3. **Stable identity:** show citations survive merge, reordering, rebuild, and
   shard movement while physical doc addresses change.
4. **Delete correctness:** test add/delete/add order, same-commit updates,
   takedown visibility, restart, stale reader, merge catch-up, and physical purge.
5. **Rank determinism:** exhaustive versus optimized execution; tie-breaking;
   deleted-statistics policy; cross-snapshot score non-comparability.
6. **Boundedness:** adversarial token counts/lengths, huge term expansions,
   high-frequency postings, phrase positions, broad filters, collector memory,
   stored-block decompression, and snapshot pinning.
7. **Corruption/recovery:** bad checksum, missing component, malformed footer,
   incompatible format, stale manifest, full disk, partial merge, and previous
   manifest rollback.
8. **Operational envelope:** commit cadence versus freshness, merge debt, disk
   high-water marks, search tail latency under ingest/merge, and rebuild time from
   authoritative records.
9. **License boundary:** implementation-role separation, source ledger, BM25
   literature origin, independent fixtures, dependency exception process, and
   targeted FTO review.

## 12. Unknowns and negative results

- **UNKNOWN:** whether unreleased `main` 0.27.0 details cited here will ship
  unchanged. Recheck the eventual release tag.
- **UNKNOWN:** exact durability behavior for a future Curiosity object-store or
  distributed directory; local `MmapDirectory` evidence does not answer it.
- **UNKNOWN:** the best segment size, commit interval, block size, merge policy,
  and analyzer for Curiosity; no representative benchmark or relevance judgment
  was run.
- **UNKNOWN:** the complete transitive-license/security posture of Tantivy
  0.26.1/0.27.0.
- **NEGATIVE RESULT:** no first-class durable web capture/version/passage
  provenance model was found in Tantivy's core abstractions. This is application
  responsibility, not a library defect.
- **NEGATIVE RESULT:** no claim that raw BM25 scores remain stable across commit,
  delete, or merge is supportable; source evidence points the other way.
- **NEGATIVE RESULT:** no basis was found to treat `DocAddress` as stable beyond
  its searcher snapshot.
- **NEGATIVE RESULT:** no evidence supports copying Tantivy's default merge
  constants into Curiosity.
- **NEGATIVE RESULT:** the official architecture note is not sufficiently current
  to serve as a format specification by itself.

## 13. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 (higher is more) on relevance
`R`, decision value `V`, novelty `N`, and investigation cost `C`; priority was
`R + V + N - C`.

| Thread                                                       | R/V/N/C | Score | Action/result                                                                                                                                                          |
| ------------------------------------------------------------ | ------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Do deleted docs affect default BM25 statistics before merge? | 5/5/5/1 |    14 | **Pursued.** Confirmed in 0.26.1 source: `max_doc` and raw doc frequency feed BM25, unlike live `num_docs` [S19][S21]. Material Curiosity rank-versioning implication. |
| Does current store really lack a decompressed-block cache?   | 3/3/4/1 |     9 | **Pursued.** Found stale-doc contradiction: current reader has configurable LRU/default 100 blocks [S15][S17].                                                         |
| Are all top-K boolean queries Block-WAND optimized?          | 4/4/3/2 |     9 | **Pursued.** No; eligibility depends on term scorers, frequencies, combiner, and pruning collector [S23].                                                              |
| Reproduce Tantivy binary format with fixtures                | 2/1/2/5 |     0 | **CURIOSITY_NO_GO:** no interoperability requirement; contamination and cost outweigh value.                                                                           |
| Run Tantivy versus Lucene/owned prototype benchmark          | 4/4/2/5 |     5 | **CURIOSITY_NO_GO:** no approved representative corpus/prototype; would not resolve present architecture decision.                                                     |
| Audit every dependency/patent                                | 3/4/2/5 |     4 | **CURIOSITY_NO_GO:** requires legal/dependency-review authority and matters only if adoption is reopened.                                                              |

Stop condition: **coverage and saturation**. The three pursued contradictions
changed or sharpened the decision; remaining threads require implementation,
dataset, legal, or benchmarking authority outside this research frame.

## Sources

All web sources accessed 2026-08-17. GitHub source links are pinned.

- **[S1]** Curiosity, [ADR 0021: stage an owned public-web search plane](../../decisions/0021-owned-public-web-search.md).
- **[S2]** Curiosity, [owned public-web search dossier, clean-room boundary](../owned-public-web-search-architecture-2026-08-17.md#4-clean-room--from-scratch-boundary).
- **[S3]** Tantivy 0.26.1 rustdoc, [crate overview and architecture](https://docs.rs/tantivy/0.26.1/tantivy/).
- **[S4]** Tantivy official source, [0.26.1 peeled release commit](https://github.com/quickwit-oss/tantivy/tree/d8f4c0b703120ed98f06297724dc1522df6019b9); annotated tag object `0093923d94157d9f1f63a292bb504bb8db401f2a`.
- **[S5]** Tantivy official source, [`Cargo.toml` at inspected `main`](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/Cargo.toml).
- **[S6]** Tantivy official source, [architecture note](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/ARCHITECTURE.md).
- **[S7]** Tantivy official repository, [README: scope, features, benchmarks, non-features](https://github.com/quickwit-oss/tantivy/blob/d8f4c0b703120ed98f06297724dc1522df6019b9/README.md).
- **[S8]** Tantivy 0.26.1 rustdoc, [schema](https://docs.rs/tantivy/0.26.1/tantivy/schema/index.html) and [`IndexRecordOption`](https://docs.rs/tantivy/0.26.1/tantivy/schema/enum.IndexRecordOption.html).
- **[S9]** Tantivy 0.26.1 rustdoc, [tokenizers and custom analyzers](https://docs.rs/tantivy/0.26.1/tantivy/tokenizer/index.html).
- **[S10]** Tantivy 0.26.1 source, [`QueryParser` analyzer lookup](https://github.com/quickwit-oss/tantivy/blob/d8f4c0b703120ed98f06297724dc1522df6019b9/src/query/query_parser/query_parser.rs).
- **[S11]** Tantivy source **MAIN**, [segment component contract](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/index/segment_component.rs).
- **[S12]** Tantivy source **MAIN**, [inverted-index serializer ordering and component split](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/postings/serializer.rs).
- **[S13]** Tantivy source **MAIN**, [posting compression](https://github.com/quickwit-oss/tantivy/tree/039a72958e8a2803cd30ad9ab71da990bf121833/src/postings) and [skip/block-max metadata](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/postings/skip.rs).
- **[S14]** Tantivy source **MAIN**, [positions format](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/positions/mod.rs).
- **[S15]** Tantivy source **MAIN**, [stored-field blocks](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/store/mod.rs) and [reader cache](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/store/reader.rs).
- **[S16]** Tantivy source **MAIN**, [fast-field contract](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/fastfield/mod.rs) and [`tantivy-columnar`](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/columnar/src/lib.rs).
- **[S17]** Tantivy source **MAIN**, [reader builder, reload, warming, cache default, atomic searcher swap](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/reader/mod.rs) and [directory/GC contract](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/directory/mod.rs).
- **[S18]** `tantivy-columnar` official source **MAIN**, [column/cardinality model](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/columnar/src/lib.rs).
- **[S19]** Tantivy 0.26.1 source, [BM25 implementation and default statistics](https://github.com/quickwit-oss/tantivy/blob/d8f4c0b703120ed98f06297724dc1522df6019b9/src/query/bm25.rs).
- **[S20]** Tantivy 0.26.1 rustdoc, [`Query`](https://docs.rs/tantivy/0.26.1/tantivy/query/trait.Query.html), [`Bm25StatisticsProvider`](https://docs.rs/tantivy/0.26.1/tantivy/query/trait.Bm25StatisticsProvider.html), and [`EnableScoring`](https://docs.rs/tantivy/0.26.1/tantivy/query/enum.EnableScoring.html).
- **[S21]** Tantivy 0.26.1 source, [`Searcher::num_docs` versus `doc_freq`](https://github.com/quickwit-oss/tantivy/blob/d8f4c0b703120ed98f06297724dc1522df6019b9/src/core/searcher.rs).
- **[S22]** Tantivy 0.26.1 rustdoc, [`Searcher` execution and segment-parallel caveat](https://docs.rs/tantivy/0.26.1/tantivy/struct.Searcher.html).
- **[S23]** Tantivy source **MAIN**, [boolean scorer specialization](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/query/boolean_query/boolean_weight.rs), [Block-WAND union](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/query/boolean_query/block_wand_union.rs), and [pruning threshold API](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/query/weight.rs).
- **[S24]** Tantivy source **MAIN**, [`IndexWriter` lock, queue, workers, and memory arenas](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/indexer/index_writer.rs).
- **[S25]** Tantivy 0.26.1 rustdoc, [`IndexWriter` operation, commit, rollback, and delete semantics](https://docs.rs/tantivy/0.26.1/tantivy/indexer/struct.IndexWriter.html).
- **[S26]** Tantivy 0.26.1 rustdoc, [`IndexReader` reload and snapshot usage](https://docs.rs/tantivy/0.26.1/tantivy/struct.IndexReader.html).
- **[S27]** Tantivy source **MAIN**, [serialized commit/publication and merge orchestration](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/indexer/segment_updater.rs).
- **[S28]** Tantivy source **MAIN**, [`PreparedCommit`](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/indexer/prepared_commit.rs).
- **[S29]** Tantivy source **MAIN**, [`LogMergePolicy`](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/indexer/log_merge_policy.rs).
- **[S30]** Tantivy source **MAIN**, [merge rewrite/doc-ID mapping](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/indexer/merger.rs) and [merge catch-up/publication](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/indexer/segment_updater.rs).
- **[S31]** Tantivy source **MAIN**, [format version constants](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/lib.rs), [CRC/version footer](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/directory/footer.rs), and [checksum validation](https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/index/index.rs).
- **[S32]** Tantivy official source, [MIT license](https://github.com/quickwit-oss/tantivy/blob/d8f4c0b703120ed98f06297724dc1522df6019b9/LICENSE).
