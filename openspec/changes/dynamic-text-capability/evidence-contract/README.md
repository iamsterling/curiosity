# Dynamic-text candidate evidence contract

**Proposed contract, version 1.** This directory defines investigation evidence
only. It is not a Crafty document, resolution, renderer, or persistence schema.
Unknown contract versions are rejected rather than migrated or coerced.

## Invariant and intent

The same logical input must remain identifiable while candidate-native offsets,
layout, fonts, realization, and environments are compared. The contract therefore
preserves native evidence and makes conversion loss visible. It deliberately does
not choose Crafty's durable range unit, normalization, affinity model, engine,
font policy, resolved-text API, glyph protocol, or realization.

`schema-v1.json` is the normative structural contract. `validate.mjs` adds the
content checks JSON Schema cannot express: text hashes, independently identified
boundary derivations, complete scalar-boundary maps, range conversion coherence,
and canonical output. A record is conforming only when both pass.

## Required and optional output

Every record requires:

- `input`: corpus/config identity, exact logical text, its UTF-8 hash, and three
  independently identified maps sourced from UTF-8 byte, UTF-16 code-unit, and
  Unicode code-point boundaries;
- `candidate`: candidate/build identity and its explicitly labelled native range
  unit (including an opaque candidate-defined label when necessary);
- `outputs`: native ranges with explicit conversion status, clusters and
  candidate-native bidi affinity labels, lines, positioned glyphs, font
  byte/face/variation identities, and stable diagnostics;
- `environment`: qualified browser/WASM/platform identity;
- `provenance`: dependency, build, and emitted-artifact hashes; and
- `observations`: timing/resource sample distributions with units and cold/warm
  state. Empty observations are valid when execution was blocked; the blocking
  diagnostic explains why. Budgets, pass thresholds, and single-number claims
  are not fields in this contract.

`realization` is optional. When present, every vector, raster, or pixel artifact
is hash-addressed and references the qualified environment. Pixel equality is
never inferred from geometry equality. Absence means “not recorded”; JSON `null`
is forbidden everywhere and never means unknown, unsupported, zero, or empty.
Required arrays remain present and may be empty only where the schema allows.

## Number and canonical encoding

- Offsets, indices, byte lengths, counts, and bidi levels are non-negative JSON
  integers within JavaScript's safe integer range.
- Geometry, variation values, time, and resource samples use an exact lowercase
  IEEE-754 binary64 bit string: `{ "f64": "0x0000000000000000" }`. NaNs are
  permitted as evidence but their payload bits remain exact; no decimal float,
  epsilon, rounding, `-0` normalization, or non-finite JSON token is allowed.
- Every line and glyph dimensional field (`originX`, `originY`, `inlineExtent`,
  `blockExtent`, `x`, `y`, `advanceX`, and `advanceY`) uses the one required
  `outputs.geometry` declaration. It names coordinate space, unit, complete x/y
  and inline/block axes, and origin. Known spaces are `candidate-layout` and
  `candidate-device`; known units are `css-px`, `device-px`, and `font-unit`.
  Candidate-defined semantics require labels. Missing metadata is
  `EVIDENCE_GEOMETRY_METADATA_REQUIRED`; unknown semantics are
  `EVIDENCE_GEOMETRY_METADATA_UNKNOWN`; incompatible axes are
  `EVIDENCE_GEOMETRY_METADATA_INCOMPATIBLE`. The declaration applies to every
  line/glyph dimension, so a record cannot mix geometry metadata.
- UTF-8 JSON without a BOM is canonicalized with `canonicalize.mjs`: object keys
  sort by UTF-8 byte order over valid Unicode scalars, no insignificant
  whitespace is emitted, and one trailing LF is added. Canonical string bytes do
  **not** use a host JSON serializer: quote is `\"`, backslash is `\\`, and the
  five named controls are `\b`, `\t`, `\n`, `\f`, and `\r`; every other U+0000–
  U+001F control is lowercase `\u00xx`. Slash is raw `/`; U+2028, U+2029, BMP
  non-ASCII, combining scalars, and astral scalars are raw UTF-8. Lone UTF-16
  surrogates (or any other non-scalar) are rejected in keys and values with
  `EVIDENCE_UNICODE_NON_SCALAR` before hashing. Rust's test-only reference uses
  the identical scalar algorithm; `canonical-contract-vector.*` preserves the
  exact adversarial bytes and SHA-256.
- Set-like arrays sort as follows: maps by source offset; ranges, clusters,
  glyphs, fonts, artifacts by `id`; lines by `(index,id)`; diagnostics by
  `(code,stage,subjectId)`; dependencies by `(purl,sha256)`; observations by
  `(metric,unit,state)`; variation coordinates by `tag`; affinity records by
  `(edge,label)`; flags and distribution samples lexically. Every set-like sort
  breaks equal keys with complete canonical JSON entry bytes, so equal keys with
  different content have a total JS/Rust order. Identity-bearing arrays reject
  duplicates during the linear pre-index: output ids use
  `EVIDENCE_GRAPH_DUPLICATE_ID`; boundary source offsets use
  `EVIDENCE_BOUNDARY_ENTRY_DUPLICATE_OFFSET`; font variation tags use
  `EVIDENCE_FONT_VARIATION_DUPLICATE_TAG`; provenance dependency PURLs use
  `EVIDENCE_PROVENANCE_DEPENDENCY_DUPLICATE_PURL`; provenance artifact ids use
  `EVIDENCE_PROVENANCE_ARTIFACT_DUPLICATE_ID`; realization artifact ids use
  `EVIDENCE_REALIZATION_ARTIFACT_DUPLICATE_ID`. `clusterIds` and `glyphIds`
  retain candidate order because order is evidence.

Canonical SHA-256 is computed over those exact UTF-8 bytes, including the LF.
The canonicalizer rejects invalid records before producing bytes.

## Diagnostics and comparison

Diagnostics have stable `code`, `severity`, `stage`, `blocking`, and
`subjectId` fields. Optional `data` is a sorted string-to-string map. Human prose,
stack traces, timestamps, random IDs, and environment-dependent paths are outside
the record; reports may associate prose separately by code.

Cross-candidate comparison uses this order:

1. Inputs compare only when corpus/config/text hashes match. Environments and
   provenance remain comparison qualifiers, never ignored metadata.
2. Native range integers are not compared across unlike units. Compare exact
   converted boundaries only where both records say `exact`; `lossy` or
   `unmappable` is a reported difference, never coerced.
3. Geometry values compare only if the complete geometry declarations match after
   canonicalization. Different units, spaces, axes, or origins are incomparable,
   never implicitly converted.
4. Cluster, line, glyph, font, diagnostic, and geometry differences are reported
   independently. Candidate IDs, glyph IDs, and affinity labels are opaque; they
   are compared within a candidate/repeat, not treated as shared semantics.
5. Repeated identical-input geometry requires exact integer/string/bit equality
   after canonical sorting. Pixel artifacts compare only for matching qualified
   environments and declared pixel formats; otherwise they are separate rows.
6. Observation distributions are descriptive evidence. They may be stratified by
   environment and state, but cannot pass or fail a candidate without a later,
   separately approved criterion.

## Validation

Validation pre-indexes boundary tuples and every range, line, cluster, glyph, and
font id, plus every other identity-bearing array named above. It rejects dangling references and missing inverse line→cluster and
cluster→glyph memberships with the `EVIDENCE_GRAPH_*` codes named by isolated
invalid fixtures. The walk is O(n) in the entries; the bounded 2,048-record test
forbids accidental array `.find` lookups without declaring a product budget.

```sh
bun openspec/changes/dynamic-text-capability/evidence-contract/contract.test.mjs
(cd packages/scene-renderer/rust && cargo test --test evidence_contract_canonical)
openspec validate dynamic-text-capability --strict
```

The valid fixtures must canonicalize identically despite non-semantic ordering.
Each invalid fixture names the exact stable validation code it must produce.
