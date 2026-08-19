# Curiosity-owned lexical reader format and query specification v1

**Status:** normative for the reader-only qualification authorized by ADR 0054.
It is not builder, publication, serving, corpus, package, or production authority.

## 1. Conformance and clean-room boundary

`COLR/1` is an independently specified, immutable, uncompressed lexical fixture
format. A conforming reader uses no third-party runtime or development dependency
and makes no compatibility claim with Tantivy, Lucene, or either project's file
formats or APIs. Upstream source, tests, fixtures, serialized layouts, and code
must not be copied, translated, or used as conformance oracles.

All integers are unsigned little-endian unless explicitly signed. All offsets and
lengths are byte counts from the start of the named file, are checked with
overflow-detecting arithmetic before access, and must lie wholly within the
manifest-declared and source-reported length. Reserved bytes must be zero. No
reader may infer a missing, unknown, duplicate, trailing, or malformed value.

## 2. Generation directory and manifest

The closed reader-v1 inventory is:

```text
manifest.json
passages.colr
terms.colr
postings.colr
```

The generation-open input is a closed map from these four names to four
independent `ReadAtV1` sources. A missing or extra name is `MANIFEST_INVALID`
before any artifact source is opened. No other entry is part of the generation.
A separately stored `build-receipt.json` MAY accompany a test fixture outside
that map, but is never opened by the reader and cannot affect interpretation or
eligibility.

`manifest.json` is at most 65,536 bytes and is UTF-8 canonical JSON: no BOM or
whitespace outside strings; object keys occur in the exact UTF-8 byte order shown
below; no duplicate keys; strings use JSON escapes only where required, with
lowercase `\u` hex and the shortest available escape; numbers are base-10
integers with no leading zero or negative zero. `generationId` and `cellId` are
1–128 bytes matching `[A-Za-z0-9._:-]+`. Unknown or missing keys fail closed. Its
exact object is:

```text
{
 "analyzerId":"curiosity_scalar_v1",
 "artifactDigests":{
   "passages.colr":{"length":u64,"sha256":lowercase-hex-64},
   "postings.colr":{"length":u64,"sha256":lowercase-hex-64},
   "terms.colr":{"length":u64,"sha256":lowercase-hex-64}
 },
 "byteOrder":"little",
 "cellId":string,
 "format":"curiosity-owned-lexical-reader",
 "formatVersion":1,
 "generationId":string,
 "passageCount":u32,
 "rankingPolicyId":"bm25-colr-v1",
 "schemaVersion":1,
 "sourceManifestDigest":lowercase-hex-64,
 "tombstoneWatermark":u64
}
```

The manifest is the reader authority binding. `sourceManifestDigest` binds the
future target `ProjectionGenerationV1`; for hand-authored qualification fixtures
it binds a canonical project-authored source record. A build receipt may record
toolchain, operator, inputs, and process observations, but is evidence about a
build, not a substitute for this manifest and not an eligibility grant.

SHA-256 is as specified by NIST FIPS 180-4 and covers each complete artifact.
Any implementation not supplied by a language standard library must be
independently project-authored from that standard; this specification grants no
cryptographic dependency. Manifest length is checked before parsing and artifact
length before digesting. Validation order is manifest length and syntax/schema,
inventory, source lengths, headers, artifact digests, records, then cross-file
invariants.

## 3. Binary envelope and inventory

Every `.colr` file begins with this exact 32-byte header:

| Offset | Width | Meaning                                                   |
| -----: | ----: | --------------------------------------------------------- |
|      0 |     8 | file-specific ASCII magic                                 |
|      8 |     2 | major version, exactly `1`                                |
|     10 |     2 | minor version, exactly `0`                                |
|     12 |     4 | endian marker, bytes `04 03 02 01` (decoded `0x01020304`) |
|     16 |     4 | header length, exactly `32`                               |
|     20 |     8 | record count (`u64`)                                      |
|     28 |     4 | zero reserved                                             |

The magic values are `COLRPAS\0`, `COLRTRM\0`, and `COLRPST\0` for passages,
terms, and postings respectively. Files have no footer, padding, compression, or
implicit alignment. The last parsed record must end exactly at the declared file
length. Counts must fit both their format type and configured resource limits.

### 3.1 Primitive values

`bytes32` is exactly 32 bytes. A `text` value is `u32 byteLength` followed by
that many bytes of strictly valid UTF-8. It has no terminator and must satisfy its
field limit before allocation. IDs are 1–128 bytes; language is 1–16 bytes;
media type and source class are 1–64 bytes; display locator is 0–2,048 bytes;
title is 0–1,024 bytes; text is 0–65,536 bytes. IDs, language, media type, and
source class are printable ASCII with no controls; IDs match
`[A-Za-z0-9._:-]+`. Digests in binary records are raw `bytes32`.

Times are signed little-endian `i64` Unix milliseconds. `publishedAt` alone may
be `i64::MIN`, meaning unknown; that sentinel is invalid elsewhere. Boolean and
enum values accept only documented representations.

### 3.2 `passages.colr`

Magic is `COLRPAS\0`. Record count equals manifest `passageCount` and is at most
`u32::MAX`. Each record is `u32 recordLength` then an exact payload in this order:

```text
u32 ordinal                         // zero-based, equal to record position
text passageId                      // unique, strictly increasing UTF-8 bytes
text sourceObjectId
text revisionId
text captureId
text representationId
text cellId                         // exactly manifest cellId
text admissionId
bytes32 revisionScopeDigest
bytes32 revisionPolicyDigest
text title
text text
text locatorDisplay
text mediaType
text language
i64 observedAt
i64 publishedAt                     // i64::MIN means unknown
text sourceClass
bytes32 authorityScopeDigest
u64 tombstoneSequence
u32 titleTokenCount
u32 textTokenCount
```

No payload bytes may remain. `passageId` order defines dense physical ordinals;
the ordinal is generation-local and never durable provenance. Token counts must
equal reader-v1 analysis of the corresponding fields. A zero-token passage is
valid but cannot be a lexical candidate.

### 3.3 `terms.colr`

Magic is `COLRTRM\0`. Records are contiguous and strictly increasing by
`(fieldTag, termBytes)`, where title is tag `1` and text is tag `2`. Each record:

```text
u8 fieldTag
u8[3] zeroReserved
u32 termByteLength                  // 1..64
u8[termByteLength] termBytes        // valid analyzer output UTF-8
u32 documentFrequency              // 1..passageCount
u64 totalTermFrequency             // >= documentFrequency
u64 postingsOffset                 // absolute offset in postings.colr
u64 postingsLength                 // exact byte length, df * 8 in v1
```

Posting ranges must begin at or after byte 32, be non-overlapping, contiguous in
the same order as term records, and collectively cover the entire postings file
after its header. No term or posting stream may be aliased.

### 3.4 `postings.colr`

Magic is `COLRPST\0`; its record count equals the term-record count. A term's
range contains exactly `documentFrequency` pairs:

```text
u32 docDelta
u32 termFrequency
```

Before the first pair, previous ordinal is logically `-1`; decode the first as
`ordinal = docDelta - 1`. Later ordinals are `previous + docDelta`. `docDelta`
and `termFrequency` are nonzero. Decoded ordinals strictly increase and are below
`passageCount`. The sum of frequencies equals `totalTermFrequency`, and each
frequency equals independent analysis of the named passage field. Reader v1 has
**no positions, offsets, payloads, skip data, or compression**.

## 4. Analyzer `curiosity_scalar_v1`

Input must be strict UTF-8. There is no Unicode normalization, stemming,
stopword removal, language-specific behavior, or locale dependence. Scan Unicode
scalar values from left to right:

1. maximal runs of ASCII `A-Z`, `a-z`, and `0-9` form one token and ASCII letters
   are lowercased;
2. each non-ASCII Unicode scalar value forms one token containing its unchanged
   UTF-8 encoding; and
3. every other ASCII scalar is a delimiter and emits nothing.

Tokens have a maximum encoded length of 64 bytes and input fields have the bounds
above. The analyzer emits neither positions nor offsets. Query and record
analysis are byte-for-byte identical. Any analyzer change requires a new ID,
format qualification, and rebuilt generation; an implementation cannot silently
inherit host Unicode or locale behavior.

## 5. Closed typed query and filters

Reader v1 accepts an internal semantic value equivalent to the following closed
Rust enum/struct model. It does not accept JSON, bytes, a query string, or any
other serialized query representation:

```rust
struct QueryV1 {
    version: QueryVersionV1, // only V1
    generation_id: String,
    cell_id: String,
    expression: ExpressionV1,
    filters: Vec<FilterV1>,
    limit: u32,
}

enum ExpressionV1 {
    Match { field: MatchFieldV1, mode: MatchModeV1, text: String },
    All(Vec<ExpressionV1>), // one or more
    Any(Vec<ExpressionV1>), // one or more
    Not(Box<ExpressionV1>),
}

enum MatchFieldV1 { Title, Text, All }
enum MatchModeV1 { Any, All }

enum FilterV1 {
    Eq { field: EqFieldV1, value: String },
    TimeRange {
        field: TimeFieldV1,
        gte: Option<i64>,
        lt: Option<i64>,
    },
}

enum EqFieldV1 {
    PassageId, SourceObjectId, RevisionId, CaptureId, RepresentationId,
    Language, MediaType, SourceClass,
}
enum TimeFieldV1 { ObservedAt, PublishedAt }
```

Unknown enum discriminants cannot be constructed through the typed API. Empty
analyzed text, analyzer output of zero terms, an empty boolean, a range with
neither bound or `gte >= lt`, and generation/cell mismatch fail before postings
access. Filters and tombstones affect eligibility, not generation BM25
statistics. Duplicate analyzed terms in one `Match` are collapsed.

Evaluation is exhaustive and recursive. For one document, every expression
returns either `NoMatch` or `Match(C)`, where `C` is a set of unique positive
`(fieldTag,termBytes)` scoring contributions:

1. A named-field `Match` forms one postings predicate per unique analyzed term.
   `mode:any` succeeds if at least one predicate matches and `mode:all` succeeds
   if all match. On success, `C` contains exactly its matching predicates; on
   failure it returns `NoMatch`, discarding every partially matching predicate.
2. For `field:all`, each analyzed term's predicate is the union of that term's
   title and text postings. The mode combines those per-term predicates as above.
   On success, `C` contains every matching title/text `(field,term)` occurrence;
   on failure it returns `NoMatch` and an empty contribution set.
3. `Any` evaluates every child. It returns `NoMatch` if every child fails;
   otherwise it returns the union of `C` from successful children only. A failed
   child contributes nothing, including a partially matched nested `All`.
4. `All` evaluates every child. It returns the union of child contribution sets
   only if every child succeeds. If any child fails, the entire `All` returns
   `NoMatch` and all sibling contributions are discarded.
5. `Not` evaluates its child against the finite ordinal universe. Child
   `NoMatch` becomes `Match({})`; child `Match(C)` becomes `NoMatch`. `Not`
   always discards `C` and contributes zero. Consequently double negation
   restores matching truth but never restores the inner score contribution.

The root contribution set alone is scored, so duplicate leaves across successful
branches score once. The AST must contain at least one `Match` with no `Not`
ancestor; a purely gating/negative query is unsupported. `Eq` compares exact
UTF-8 bytes. `TimeRange` uses `gte <= value < lt` for every present bound;
unknown `publishedAt` never matches. Filters are ANDed after expression
evaluation and before scoring/top-K retention.

The mandatory nested cases over the golden fixture use `T(field,term)` to mean a
single-term `Match`:

- `Any(All(T(title,rust),T(title,search)),T(text,rust))` matches all documents.
  `p-beta` scores only `text/rust`; its `title/search` match belongs to the failed
  `All` and is discarded. `p-tomb` analogously scores only `text/rust`.
- `All(Any(T(title,rust),T(title,search)),Not(T(text,search)))` rejects `p-alpha`
  and discards its successful title contributions; it matches `p-beta` with only
  `title/search` and `p-tomb` with only `title/rust`.
- `All(Not(Not(T(title,rust))),T(text,rust))` matches `p-alpha` and `p-tomb`, not
  `p-beta`; only `text/rust` scores because the double-negated title term is a
  truth gate with zero contribution.

Limits are computed from the semantic value before postings access: one AST node
for each `Match`, `All`, `Any`, or `Not` including the root; root depth is `1` and
each child adds `1`; one filter per `FilterV1`; string bytes are the sum of UTF-8
lengths of `generation_id`, `cell_id`, every `Match.text`, and every `Eq.value`
(enum labels and absent time bounds add zero); analyzed-term occurrences count
every analyzer emission before per-`Match` duplicate collapse; unique posting
terms count distinct expanded `(fieldTag,termBytes)` keys across all `Match`
nodes, including negated nodes. Default maxima are 64 AST nodes, depth 8, 16
filters, 4,096 total string bytes, 64 analyzed-term occurrences, 128 unique
posting terms, and requested `limit` 1–100. Callers may lower, never raise, these
limits without a new qualification. Query serialization and all wire-size limits
are deferred.

## 6. Deterministic exhaustive BM25 top-K

Reader v1 exhaustively evaluates every eligible candidate from the required
postings. It has no WAND, skip, early termination, parallel reduction, or
approximate total. Statistics include every passage in the immutable generation,
including externally tombstoned passages, so applying a later tombstone cannot
perturb remaining scores. For each field independently:

```text
N = manifest passageCount
avgdl = sum(field token counts for all N passages) / N
idf = ln_colr_v1(1 + (N - df + 0.5) / (df + 0.5))
termScore = idf * ((k1 + 1) * tf)
                  / (tf + k1 * (1 - b + b * dl / avgdl))
score = sum(fieldBoost * termScore)
```

Constants are the binary64 values `k1=0x3ff3333333333333` (nearest to `1.2`),
`b=0x3fe8000000000000` (`0.75`), title boost `0x4000000000000000`
(`2.0`), and text boost `0x3ff0000000000000` (`1.0`). These are independent
reader-v1 policy choices, not compatibility defaults.
If `N=0` no candidates exist; a zero average field length contributes zero for
that field. `df` comes from the validated term record.

All operations use IEEE-754 binary64, round-to-nearest ties-to-even. Every
addition, subtraction, multiplication, and division rounds separately; fused
multiply-add, extended intermediates, a platform `libm` logarithm, and algebraic
reassociation are forbidden. Integers are converted individually to binary64.
Compute `avgdl` as `binary64(sumTokenCounts) / binary64(N)`. For each term use
these exact rounded steps, where `0.5` and `1.0` are their exact binary64 values:

```text
idfNumerator = binary64(N - df) + 0.5
idfDenominator = binary64(df) + 0.5
idfArgument = 1.0 + idfNumerator / idfDenominator
idf = ln_colr_v1(idfArgument)
saturationNumerator = (k1 + 1.0) * binary64(tf)
lengthRatio = binary64(dl) / avgdl
lengthAdjustment = (1.0 - b) + b * lengthRatio
saturationDenominator = binary64(tf) + k1 * lengthAdjustment
termScore = idf * (saturationNumerator / saturationDenominator)
contribution = fieldBoost * termScore
score = score + contribution
```

Within `lengthAdjustment`, compute `b * lengthRatio` before its addition. Add
contributions in sorted `(fieldTag,termBytes)` order. Documents are evaluated by
ascending ordinal.

`ln_colr_v1(x)` is the following project-authored qualification algorithm. Its
input must be a positive finite normal binary64 value:

1. Decode `x` as sign, 11-bit exponent `E`, and 52-bit fraction `F`. Set integer
   `e = E - 1023` and construct binary64 `m` from exponent bits `1023` and the
   unchanged `F`, so `x = m * 2^e` and `1 <= m < 2`.
2. Set `z=(m-1)/(m+1)`, `z2=z*z`, `term=z`, and `sum=z`, rounding after each
   operation.
3. For integer `n` from `1` through `31` in ascending order, set
   `term=term*z2`, then `sum=sum + term/binary64(2*n+1)`, again rounding after
   each multiplication, division, and addition.
4. Return `(2*sum) + binary64(e)*LN2`, evaluating the two multiplications before
   the addition, where `LN2` is binary64 bits `0x3fe62e42fefa39ef`.

This fixed 32-term atanh series and range reduction are normative; an
implementation may not substitute a mathematically similar function. Required
input/output binary64 vectors are:

| input bits           | output bits          |
| -------------------- | -------------------- |
| `0x3ff0000000000000` | `0x0000000000000000` |
| `0x3ff2492492492492` | `0x3fc1178e8227e479` |
| `0x3ff999999999999a` | `0x3fde148a1a2726d1` |
| `0x4000000000000000` | `0x3fe62e42fefa39ef` |
| `0x4005555555555556` | `0x3fef62f40794a7b9` |

Non-finite intermediate values or an out-of-domain logarithm input are
`RECORD_INVALID`. The stable ordering key is:

```text
rankScore = roundTiesToEven(score * binary64(0x41cdcd6500000000)) as i64
ORDER BY rankScore DESC, passageId UTF-8 bytes ASC
```

`score` and `rankScore` are generation/policy-local. Only `rankScore` determines
ordering. Collection may retain a bounded heap of `limit`, but every final
contributing document-term pair is scored. Exact `passageId` deduplication is
therefore structural. Target capture grouping, relationship deduplication,
diversity, freshness rerank, hydration, and delivery checks remain required by
the target contract but are outside reader-v1 implementation authority.

## 7. Read boundary, resources, and tombstones

The sole byte source contract for each of the four generation inputs is:

```text
ReadAtV1 { len() -> u64; read_at(offset:u64, destination:byte[]) -> exact bytes }
```

`len()` is sampled before the first read and after the last read of each source
and must be unchanged. A zero-length destination makes no call and does not
increment counters. Every nonzero call either fills the destination exactly or
fails. Short reads, changed lengths, or source errors fail closed. The parser
cannot request beyond declared bounds, request the whole generation implicitly,
mmap, seek shared mutable state, or retain a borrowed source slice after the call.
Tests must supply instrumented fragmented sources and a source that fails if an
out-of-range read is attempted.

Limits are immutable per reader and checked before reads or allocation. Default
qualification maxima are: one 64 KiB manifest; exactly 3 artifacts; 16 MiB per
artifact; 32 MiB total artifact bytes; 10,000 passages; 100,000 terms; 1,000,000
postings; 1 MiB one logical allocation; 16 MiB simultaneously retained logical
bytes; 64 MiB total requested read bytes; 1,000,000 `read_at` calls; 1,000,000
evaluated posting pairs; 1,000,000 scored document-term pairs; 10,000 tombstone
IDs; and 1 MiB aggregate tombstone ID bytes. Exceeding any limit returns
`RESOURCE_LIMIT` before the operation that would exceed it. MiB and KiB mean
powers of 1,024.

Conformance diagnostics separate **semantic work counters** from
**implementation-local telemetry**. Semantic counters have these exact meanings
and increment points:

- `passagesDecoded`: increment after one complete passage record passes its
  record-local bounds, UTF-8, field, ordinal, ordering, and token-count checks;
- `termsDecoded`: increment after one complete term record passes its local
  field, token, ordering, frequency, and posting-range checks;
- `postingsDecoded`: increment exactly once after one posting pair passes delta,
  ordinal, frequency, and range checks during mandatory generation validation;
- `astNodes`: pre-order traversal; increment when a node is admitted under the
  node/depth budget, before visiting children;
- `analyzedTermOccurrences`: increment for each query-analyzer emission before
  duplicate collapse, provided accepting it does not exceed the term budget;
- `uniquePostingTerms`: after all `Match` analysis, sort and deduplicate expanded
  `(fieldTag,termBytes)` keys and increment once per admitted key;
- `postingPairsEvaluated`: for each unique posting term required by the AST,
  increment once per logical pair in its validated posting list before applying
  that pair to expression truth, independent of whether bytes are reread;
- `candidateDocuments`: increment once for each ordinal whose root expression
  returns `Match(C)`, before filters and tombstones; and
- `scoredDocumentTermPairs`: after filters and tombstones, increment once for
  each unique contribution in that document's root `C` immediately before its
  BM25 contribution is computed.

The semantic counters must be equal across conforming readers for equal valid
bytes, semantic query, tombstones, and semantic limits. On failure, an increment
whose stated validation/admission point was not reached does not occur.

`readCalls`, `requestedReadBytes`, and `allocatedBytesHighWater` are bounded
implementation-local telemetry, not format-conformance counters. `readCalls`
increments immediately before each nonzero `read_at`; `requestedReadBytes` adds
that destination length at the same point. For local accounting, allocated bytes
are the logical payload lengths of owned manifest, text, query, tombstone-ID,
decoded-record, or retained index buffers; allocator capacity and fixed-size
stack storage do not count. Charge before ownership and release on discard; the
telemetry records the maximum simultaneous charge. These three values must stay
within configured limits and repeat for the same implementation, version,
configuration, and inputs, but may differ between conforming strategies.
Diagnostics contain codes and counters, never source text or unrestricted record
bodies.

`TombstoneInputV1` is supplied out of band as `{watermark:u64,
passageIds:sorted unique string[]}`. It is not read from or mutated by the index.
Its watermark must be at least the manifest watermark; IDs use the passage-ID
syntax above and are ordered by UTF-8 bytes. Malformed, duplicate, or over-limit
IDs fail before query execution. IDs absent from this generation are valid and
ignored, because the input may cover a broader authority inventory. A listed
passage is excluded before scoring and top-K insertion. Reader qualification
proves this input boundary only; it does not claim canonical tombstone retrieval,
publication, or delivery authority.

## 8. Stable failures

The closed reader-v1 codes are:

- `IO_READ_FAILED` — source error, short read, or changed source length;
- `RESOURCE_LIMIT` — a configured count/byte/depth/work limit would be exceeded;
- `MANIFEST_INVALID` — noncanonical JSON, schema/value/inventory error;
- `FORMAT_UNSUPPORTED` — magic, major/minor, endian, schema, analyzer, or ranking
  version is not exactly supported;
- `BOUNDS_INVALID` — overflow, range, length, overlap, gap, trailing bytes, or
  out-of-file reference;
- `CHECKSUM_MISMATCH` — artifact digest differs;
- `UTF8_INVALID` — a declared text value is not strict UTF-8;
- `RECORD_INVALID` — reserved/enum/order/count/frequency/token/provenance record
  invariant fails;
- `QUERY_UNSUPPORTED` — typed query is not in the closed valid subset;
- `QUERY_BINDING_MISMATCH` — query generation or cell differs; and
- `TOMBSTONE_INVALID` — tombstone order, uniqueness, bounds, or watermark fails.

Validation follows the order in sections 2 and 3, file order
`passages`, `terms`, `postings`, then record byte order. The first detected error
is stable. A resource check precedes the operation it guards; an I/O failure from
an already permitted call wins. Errors expose file kind and numeric offset when
known, but no host path and no passage/query text.

## 9. Hand-authored golden fixture

The mandatory `golden-three-v1` fixture is authored directly from this document
with a reviewed hex/text fixture recipe—not with a builder or upstream engine.
Its manifest uses generation `golden-three-v1`, cell `golden-cell`, watermark
`7`, and source-manifest digest
`aded5d41b2172574277755ce240a0febd1124bf38a0fc1806901b625b0d3f6c2`, the
SHA-256 of the exact UTF-8 bytes `{"fixture":"golden-three-v1"}`. It contains
three passage records in
`passageId` order. For passage suffix `alpha`, `beta`, or `tomb`, respectively,
replace `S` with that suffix in IDs `source-S`, `revision-S`, `capture-S`,
`representation-S`, and `admission-S`, and in locator `fixture:S`. Media type is
`text/plain`; language is `en`; source class is `fixture`; `observedAt` is `1`,
`2`, or `3`; published time is unknown; tombstone sequence is `0`; and the three
digest fields are 32 repeats of bytes `0x11`, `0x22`, and `0x33` in schema order.
The varying fields are:

| passageId | title         | text                 | title/text token counts |
| --------- | ------------- | -------------------- | ----------------------- |
| `p-alpha` | `Rust Search` | `rust search search` | 2 / 3                   |
| `p-beta`  | `Search`      | `rust`               | 1 / 1                   |
| `p-tomb`  | `Rust`        | `rust`               | 1 / 1                   |

Its sorted term/posting facts are exactly:

```text
title/rust   -> (doc 0, tf 1), (doc 2, tf 1)
title/search -> (doc 0, tf 1), (doc 1, tf 1)
text/rust    -> (doc 0, tf 1), (doc 1, tf 1), (doc 2, tf 1)
text/search  -> (doc 0, tf 2)
```

For query `match(field=all,mode=any,text="rust search")`, limit 3, and tombstone
input containing `p-tomb`, generation statistics still use all three passages.
The exact results are `p-alpha` then `p-beta`. Their score bit patterns are
`0x40061932874db05d` (`2.7623034067710663`) and `0x3ff34edd10abeaf8`
(`1.2067537928803045`); required rank scores are `2762303407` and `1206753793`.
Semantic counters after opening and this tombstoned query are exactly
`passagesDecoded=3`, `termsDecoded=4`, `postingsDecoded=8`, `astNodes=1`,
`analyzedTermOccurrences=2`, `uniquePostingTerms=4`,
`postingPairsEvaluated=8`, `candidateDocuments=3`, and
`scoredDocumentTermPairs=6`.
Without the tombstone, `p-beta` precedes `p-tomb` because both have score bits
`0x3ff34edd10abeaf8` and equal rank scores, so passage ID breaks the tie. The
untombstoned query changes only `scoredDocumentTermPairs` to `8`; local telemetry
is intentionally not a golden cross-implementation value. The fixture manifest
records exact artifact lengths and SHA-256 values produced by the hand-authored
recipe and is reviewed independently against this table.

## 10. Implementation acceptance tests

The implementation proposal must add these tests **before** behavior and keep
them unchanged while making the smallest reader implementation pass:

1. **Golden/numeric:** both golden queries produce exact IDs, score bits, rank
   scores, semantic counters, and tombstone behavior on two consecutive runs;
   every `ln_colr_v1` bit vector passes without calling `libm`.
2. **Envelope/bounds:** for every byte boundary in every artifact, truncation
   fails with a stable code/offset; altered magic/version/endian/reserved/count,
   integer overflow, overlap, gap, alias, trailing byte, and out-of-range offset
   never panic or request out-of-bounds bytes.
3. **Integrity/cross-file:** each single-byte payload mutation without a manifest
   update fails checksum; header mutations follow the declared earlier header
   validation code. With a recomputed test checksum, malformed UTF-8, term order,
   passage order, token counts, df/total-tf, delta/frequency, cell, and ordinal
   each fail their structural code.
4. **Properties:** deterministic generated valid models round-trip only through
   a test-local independent byte recipe; generated arbitrary bytes and mutation
   sequences never panic, hang, allocate/read above limits, or return an
   unvalidated passage. No production builder is introduced.
5. **Query:** every empty/over-depth/over-node/over-string-byte/over-term/filter
   semantic value rejects before postings reads; boolean/filter truth tables,
   failed-branch contribution discard, all three mandatory nested cases, double
   negation, and stable tie-breaks match an independent exhaustive model. No
   query serializer or parser is introduced.
6. **Resources/read_at:** each limit is tested at `limit-1`, `limit`, and
   `limit+1`; fragmented/short/failing/changing sources produce exact semantic
   counters and codes; instrumentation proves all requests are in range. Local
   telemetry repeats for the same implementation/configuration/input but is not
   compared to another read or allocation strategy.
7. **Boundary:** network-denied tests pass; dependency manifests/lockfiles are
   byte-identical; normal package exports, native symbols, and public `.d.ts`
   contain no reader surface; default/release behavior is unchanged.
8. **Clean room:** fixture and implementation provenance name this specification
   and primary literature only; repository search finds no copied upstream magic,
   fixture, API, source fragment, or compatibility claim.

Acceptance is binary: all eight groups pass in one documented command set or the
tranche is not accepted. Performance measurements are diagnostic only and cannot
waive correctness or resource gates.

## 11. Stop conditions and deferrals

Stop implementation and request a new ADR if conformance requires a dependency,
network, builder/publication path, public ABI/export, mutable generation, mmap,
compression, positions, phrase/proximity, optimization that can skip candidates,
merge, shard, production corpus, live fetch, Retrieval v3 serving, SearXNG
change, or production authority. Also stop on ambiguous bytes/query semantics,
nondeterministic rank keys, inability to produce the fixture by hand, resource
accounting disagreement, or uncertain clean-room provenance.

All those capabilities, plus canonical tombstone acquisition, generation
activation/rollback mechanics, relationship deduplication, diversity, freshness,
hydration, snippets, broader analyzers/languages, and performance SLOs are
explicitly deferred.

## 12. Traceability

[ADR 0054](../decisions/0054-clean-room-owned-lexical-reader-qualification.md),
[engine-neutral target contract](owned-web-lexical-query-v1.md), and
[research synthesis](../research/owned-lexical-reader-synthesis-2026-08-19.md).
