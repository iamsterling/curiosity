# Owned lexical reader qualification fixtures

`golden-three-v1` was hand-assembled directly from section 9 of
`docs/specifications/owned-lexical-reader-format-v1.md`. The binary records were
encoded field-by-field with little-endian standard-library primitives; hashes
use SHA-256. No production index writer, upstream source, upstream fixture,
Tantivy/Lucene format, executable oracle, live corpus, or network input was used.

`source-manifest.json` is the canonical project-authored source record.
`build-receipt.json` is non-authoritative process evidence and records exact
lengths and checksums. Neither file is part of the reader's four-entry generation
map.

`golden-three-v1.recipe.json` is a separately pinned, reviewable statement of
the normative passage and posting facts used for independent hand assembly. It
is outside the generation directory, is never opened by the reader, and grants
no builder or publication authority.
