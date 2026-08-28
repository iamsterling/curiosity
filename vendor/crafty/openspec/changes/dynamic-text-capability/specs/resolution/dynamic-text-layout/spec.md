## Purpose

Defines deterministic text-resolution inputs and disposable outputs for font selection, Unicode shaping, line layout, measurement, hit testing, caret geometry, and failure diagnostics.

## ADDED Requirements

### Requirement: Explicit font identity and fallback
Text resolution SHALL use an explicit font identity, readiness state, and ordered fallback policy. An identity that does not determine bytes/version across environments SHALL be labeled non-deterministic, and missing, substituted, stale, and unsupported-glyph states SHALL produce stable diagnostics.

#### Scenario: Same declared font name resolves to different bytes
- **WHEN** two environments map an authored font request to different font bytes or versions
- **THEN** the resolved identity differs or is labeled non-deterministic and the system reports substitution instead of claiming equivalent deterministic layout

#### Scenario: Primary face lacks a glyph
- **WHEN** the primary resolved face cannot represent part of the logical text
- **THEN** fallback follows the declared order, records the face identity used for each affected resolved range, and reports a stable diagnostic when no supported face is available

### Requirement: Unicode shaping and line layout
The read-only layout milestone SHALL resolve logical text using declared font, language, direction, feature, variation, width, and container inputs into clusters, lines, positioned glyphs, and diagnostics. It SHALL support the approved corpus for combining marks, emoji sequences, Arabic and Hebrew bidi text, Indic scripts, CJK, whitespace, and line breaking without scalar-by-scalar guesses.

#### Scenario: Mixed-direction complex text
- **WHEN** a fixture contains Arabic or Hebrew mixed with Latin, digits, combining marks, and explicit bidi controls
- **THEN** the result preserves logical cluster mapping, resolved visual order, line membership, and caret affinity according to the pinned conformance corpus

#### Scenario: Line breaking under width constraint
- **WHEN** the same logical text is resolved under two declared inline constraints
- **THEN** each result has lines and overflow matching the pinned line-breaking corpus and neither result mutates authored text

### Requirement: One disposable geometry result serves all consumers
For a given resolution revision, intrinsic measurement, text-level hit queries, caret/range geometry, and rendering SHALL consume one coherent disposable text result or results proven equivalent to it. Node-box broad-phase hit testing MAY remain, but text offset decisions SHALL NOT be inferred from ink pixels or box geometry alone.

#### Scenario: Point to caret
- **WHEN** a point inside or near laid-out text is queried through the authoritative coordinate and hit-test path
- **THEN** the returned logical position and affinity correspond to the same line and cluster geometry used for selection and rendering

#### Scenario: Intrinsic measurement
- **WHEN** layout requests intrinsic text dimensions for a declared available space
- **THEN** the returned dimensions derive from the same resolved lines and glyph metrics used by rendering

### Requirement: Resolution invalidation is complete
Changes to logical content, available width, font identity/readiness, fallback, language, direction, features, variations, or behavior version SHALL invalidate every affected resolved result. A full resolution SHALL remain the correctness oracle for any incremental or cached result.

#### Scenario: Font readiness changes
- **WHEN** a previously unavailable declared font becomes ready
- **THEN** affected text is re-resolved, diagnostics and geometry update together, and an incremental result is equivalent to a full resolution

### Requirement: Failed resolution preserves prior valid state
A failed or stale text-resolution attempt SHALL NOT mutate authored state or replace the last valid resolved result used for presentation. It SHALL return stable diagnostics identifying failure or staleness.

#### Scenario: Resolution fails after a valid result
- **WHEN** a font or layout failure occurs while a prior valid resolution is presented
- **THEN** the authored document and prior valid presentation remain unchanged and the failure is observable through a stable diagnostic code
