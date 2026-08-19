# Curiosity-owned lexical reader research synthesis

**Date:** 2026-08-19

**Status:** research and clean-room provenance record; authority is only in ADR
0054 and its specifications

**Method:** synthesis of the completed 2026-08-17 Tantivy and Lucene primary-
source reviews plus primary IR literature; no code, fixture, format, dependency,
index, corpus, or benchmark was imported or run

## Question and recommendation

What is the smallest Curiosity-owned lexical tranche that establishes a sound
correctness oracle without importing a search engine or prematurely authorizing
an indexing/serving system?

**Recommendation (high confidence):** specify a simple uncompressed immutable
format, then qualify only a defensive reader, fixed analyzer, closed typed query
model, and exhaustive deterministic BM25 top-K on hand-authored fixtures. Keep
the seam internal and dependency-free. Defer the builder and every optimization
until the parser, corruption behavior, ranking oracle, semantic work counters,
and bounded implementation-local resource telemetry are independently testable.
This is the strategist's bounded-reader recommendation adopted by ADR 0054; it
is not itself implementation authority.

## Facts from primary literature

- **FACT (high):** Robertson et al.'s _Okapi at TREC-3_ documents the probabilistic
  term-weighting line from which BM25 is derived. Robertson and Zaragoza's later
  review explains BM25 as a family whose parameters, term-frequency saturation,
  document-length normalization, and collection statistics must be stated; the
  name alone is not a complete numeric contract [L1][L2].
- **FACT (high):** inverted files map terms to document occurrence lists; sorted
  document identifiers permit set-at-a-time/cursor evaluation. This is a general
  published IR structure, not an upstream-product invention [L3].
- **FACT (high):** raw lexical scores depend on collection statistics and are not
  probabilities or cross-collection stable quantities [L2].

## Facts from exact upstream review points

These facts explain mature implementation patterns. They do **not** define the
Curiosity format or permit source transfer.

### Tantivy

The completed review pinned release 0.26.1's annotated tag object
`0093923d94157d9f1f63a292bb504bb8db401f2a` to its peeled source commit
`d8f4c0b703120ed98f06297724dc1522df6019b9`, and unreleased forward evidence to
commit `039a72958e8a2803cd30ad9ab71da990bf121833` [T1][T2]. At those exact refs:

- **FACT (high):**
  `d8f4c0b.../src/query/bm25.rs` binds a concrete BM25 formula/statistics policy,
  while `d8f4c0b.../src/core/searcher.rs` distinguishes live counts from raw
  posting statistics. Deleted rows can therefore affect scores until rewritten
  in that product [T3][T4].
- **FACT (high):**
  `039a729.../src/postings/serializer.rs` requires sorted terms/increasing docs,
  and the sibling `src/postings/` plus `skip.rs` add product-specific compression
  and skip/block-max structures [T5]. Positions are a separate optional stream at
  `src/positions/mod.rs` [T6].
- **FACT (high):**
  `039a729.../src/reader/mod.rs` holds snapshot readers and swaps a new searcher;
  `src/indexer/segment_updater.rs` serializes publication/merge transitions [T7].
- **FACT (high):** exact source paths show that query/scorer/collector separation
  and dynamic pruning are conditional optimizations, not a guarantee that every
  top-K query avoids exhaustive work (`src/query/boolean_query/boolean_weight.rs`,
  `block_wand_union.rs`, and `src/query/weight.rs`) [T8].

### Apache Lucene

The completed review pinned Apache Lucene 10.5.1 to release ref
`releases/lucene/10.5.1`; all paths below are under that exact ref [U1].

- **FACT (high):** generated 10.5.1 format documentation and
  `lucene/core/src/java/org/apache/lucene/index/SegmentInfos.java` describe a
  manifest-selected set of immutable segment generations and a pending-to-final
  commit pattern [U1][U2].
- **FACT (high):** `Lucene104PostingsFormat` documents doc-delta/frequency lanes
  plus product-specific packed blocks, skip levels, and impacts. Positions are
  additional data needed for phrase/proximity behavior [U3].
- **FACT (high):** `BM25Similarity` gives one concrete formula/parameterization;
  `lucene/core/src/java/org/apache/lucene/search/TopScoreDocCollector.java`
  demonstrates bounded top-K collection and optimization around a result heap
  [U4][U5].
- **FACT (high):** `IndexFileDeleter.java` reference-counts files across live
  views, reinforcing that immutable-reader lifetime and garbage collection are
  separate from durable document/provenance identity [U6].

## Curiosity inferences and decision consequences

- **INFERENCE (high):** immutable bytes plus a small checksummed manifest are the
  useful architecture. Copying a codec, class hierarchy, suffix, magic, block
  size, fixture, or default is unnecessary and would weaken clean-room ownership.
- **INFERENCE (high):** a simple `u32` doc-delta/frequency stream is sufficient to
  establish correctness. Compression, skips, WAND, SIMD, and mmap should follow
  only measured need and equivalence against the exhaustive oracle.
- **INFERENCE (high):** phrase/proximity requires positions and changes format,
  parser, resource, and corruption surfaces. It should not enter reader v1.
- **INFERENCE (high):** a closed typed AST avoids accidental adoption of an
  upstream query-parser language and makes expansion/depth/work bounds explicit.
- **INFERENCE (high):** reader qualification can be meaningful without a builder
  only if the fixture is hand-authored from an independent byte recipe. A builder
  used to create the oracle would make parser and writer share mistakes.
- **INFERENCE (high):** manifest authority and build receipt must be separate.
  Runtime interpretation follows immutable declared bytes; process provenance is
  useful evidence but cannot grant corpus, tombstone, or publication authority.
- **INFERENCE (high):** later tombstones should suppress eligibility without
  changing immutable generation statistics in reader v1. This preserves stable
  rank keys while final authority remains outside the projection.

## Unknowns and unresolved evidence

- **UNKNOWN:** representative Curiosity relevance, latency, memory, and storage;
  no authorized corpus, judgment set, or benchmark was used.
- **UNKNOWN:** whether the deliberately minimal scalar analyzer is useful beyond
  parser/ranker qualification. Production language analysis requires evaluation
  and likely a new version.
- **UNKNOWN:** production builder/publication crash semantics, retention,
  tombstone acquisition, and generation rollback operations; all are deferred.
- **UNKNOWN:** patent/FTO conclusions for an eventual production implementation.
  This synthesis is technical research, not legal advice.
- **UNKNOWN:** whether later performance evidence will justify compression, mmap,
  dynamic pruning, merges, or sharding.
- **NEGATIVE RESULT:** neither upstream engine supplies Curiosity's capture,
  admission, Ledger, provenance, authorization, or evidence authority.
- **NEGATIVE RESULT:** there is no need or clean-room justification for Tantivy
  or Lucene format compatibility.

## Clean-room constraints and evidence ledger

The requirements author may cite papers and describe high-level observed
patterns. The implementer must work from ADR 0054 and Curiosity specifications,
not upstream source. Do not copy or translate upstream code, comments, names,
serialized layouts, constants, tests, expected outputs, generated tables, or
fixtures. Do not run an upstream engine as oracle. Project-authored fixtures and
property models must have provenance to the specification and literature only.

The v1 constants and encoding must each have an independent reason: simplicity,
closed bounds, deterministic qualification, or the cited published BM25 model.
Coincidental agreement with common `k1=1.2`/`b=0.75` values is not a compatibility
claim. Any future upstream dependency changes the ownership/licensing frame and
requires a new ADR, lock/license receipt, and security review.

## Research stop condition

Research reached coverage and saturation: primary literature supports the
scoring family; two mature engines independently support immutable snapshots,
sorted postings, and bounded collection; exact source checks exposed why deleted
statistics and optimized execution need explicit policy. Further codec reading,
format reproduction, fixture extraction, or benchmarking cannot change the
reader-only decision without implementation, dependency, corpus, legal, or
performance authority. Stop rather than cross those boundaries.

## Sources

All upstream web sources were accessed in the completed review on 2026-08-17.

- **[L1]** S. E. Robertson et al., “Okapi at TREC-3,” 1994.
  https://trec.nist.gov/pubs/trec3/t3_proceedings.html
- **[L2]** S. Robertson and H. Zaragoza, “The Probabilistic Relevance Framework:
  BM25 and Beyond,” _Foundations and Trends in Information Retrieval_ 4(1–2),
  2009, pp. 1–174. https://doi.org/10.1561/1500000019
- **[L3]** J. Zobel and A. Moffat, “Inverted Files for Text Search Engines,”
  _ACM Computing Surveys_ 38(2), 2006. https://doi.org/10.1145/1132956.1132959
- **[T1]** Tantivy 0.26.1 peeled source commit
  `d8f4c0b703120ed98f06297724dc1522df6019b9`; annotated tag object
  `0093923d94157d9f1f63a292bb504bb8db401f2a`.
  https://github.com/quickwit-oss/tantivy/tree/d8f4c0b703120ed98f06297724dc1522df6019b9
- **[T2]** Tantivy inspected `main` exact commit and architecture note.
  https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/ARCHITECTURE.md
- **[T3]** Tantivy 0.26.1 BM25 source review point.
  https://github.com/quickwit-oss/tantivy/blob/d8f4c0b703120ed98f06297724dc1522df6019b9/src/query/bm25.rs
- **[T4]** Tantivy 0.26.1 search statistics review point.
  https://github.com/quickwit-oss/tantivy/blob/d8f4c0b703120ed98f06297724dc1522df6019b9/src/core/searcher.rs
- **[T5]** Tantivy exact serializer and postings review points.
  https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/postings/serializer.rs
  and https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/postings/skip.rs
- **[T6]** Tantivy exact positions review point.
  https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/positions/mod.rs
- **[T7]** Tantivy exact reader/publication review points.
  https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/reader/mod.rs
  and https://github.com/quickwit-oss/tantivy/blob/039a72958e8a2803cd30ad9ab71da990bf121833/src/indexer/segment_updater.rs
- **[T8]** Tantivy exact optimized-query review directory.
  https://github.com/quickwit-oss/tantivy/tree/039a72958e8a2803cd30ad9ab71da990bf121833/src/query/boolean_query
- **[U1]** Apache Lucene 10.5.1 index-file format documentation.
  https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/codecs/lucene104/package-summary.html
- **[U2]** Apache Lucene 10.5.1 `SegmentInfos.java` release-ref source.
  https://github.com/apache/lucene/blob/releases/lucene/10.5.1/lucene/core/src/java/org/apache/lucene/index/SegmentInfos.java
- **[U3]** Apache Lucene 10.5.1 `Lucene104PostingsFormat`.
  https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/codecs/lucene104/Lucene104PostingsFormat.html
- **[U4]** Apache Lucene 10.5.1 `BM25Similarity`.
  https://lucene.apache.org/core/10_5_1/core/org/apache/lucene/search/similarities/BM25Similarity.html
- **[U5]** Apache Lucene 10.5.1 `TopScoreDocCollector.java` release-ref source.
  https://github.com/apache/lucene/blob/releases/lucene/10.5.1/lucene/core/src/java/org/apache/lucene/search/TopScoreDocCollector.java
- **[U6]** Apache Lucene 10.5.1 `IndexFileDeleter.java` release-ref source.
  https://github.com/apache/lucene/blob/releases/lucene/10.5.1/lucene/core/src/java/org/apache/lucene/index/IndexFileDeleter.java

Detailed prior records: [Tantivy dossier](products/tantivy.md) and
[Apache Lucene study](products/apache-lucene.md).
