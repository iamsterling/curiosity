## Purpose

Defines durable text content and intent, plain-text editing behavior, container authoring, and persistence/interchange boundaries without making any input adapter or rendered result canonical.

## ADDED Requirements

### Requirement: Valid authored plain text
The system SHALL represent every text-capable node's durable logical content as a required string. At command runtime, every `text` value for which `typeof value !== "string"` SHALL be rejected with `DOCUMENT_TEXT_VALUE_INVALID`, including JSON and non-JSON JavaScript values. JSON deserialization SHALL use that code for each representable non-string class: number, boolean, null, array, or object, including an object that is otherwise a valid glass-fill value. A present string on a node kind that cannot carry text SHALL be rejected with `DOCUMENT_TEXT_KIND_INVALID`. These codes SHALL take precedence over any generic property-value diagnostic. When value and kind are both invalid, value invalidity SHALL take precedence. A rejected command SHALL throw the one applicable exact code before mutation. Rejected deserialization SHALL return exactly one applicable text diagnostic and no accepted document. Neither path SHALL change input/authored bytes, kernel revision, undo history, or redo history.

#### Scenario: Valid whole-text replacement
- **WHEN** a human or agent replaces a text node's content with a valid string
- **THEN** the new logical content is canonical, the change is exactly undoable and redoable, and a replacement with the existing string creates no history entry

#### Scenario: Invalid runtime content
- **WHEN** runtime command ingress supplies any value for which `typeof value !== "string"`, with tests covering number, boolean, null, array, plain object, valid glass-fill-shaped object, `undefined`, function, symbol, and bigint
- **THEN** each case throws exactly `DOCUMENT_TEXT_VALUE_INVALID` before any generic property-value check or mutation and leaves authored bytes, revision, undo history, and redo history unchanged

#### Scenario: Static command content contract
- **WHEN** a typed caller constructs a command whose property is text
- **THEN** the command value type admits strings and rejects number, boolean, null, array, plain object, and glass-fill object values

#### Scenario: Invalid node-kind command
- **WHEN** a command supplies text on a node kind that cannot carry text
- **THEN** the command throws `DOCUMENT_TEXT_KIND_INVALID` before mutation and leaves authored bytes, revision, and history unchanged

#### Scenario: Invalid serialized text value
- **WHEN** deserialization encounters any of number, boolean, null, array, plain object, or valid glass-fill-shaped object as a present text value
- **THEN** it returns exactly the one-element diagnostic code sequence [`DOCUMENT_TEXT_VALUE_INVALID`], accepts no document, preserves the input bytes, and performs no normalization

#### Scenario: Invalid serialized node-kind pairing
- **WHEN** deserialization encounters text on a node kind that cannot carry text
- **THEN** it returns exactly the one-element diagnostic code sequence [`DOCUMENT_TEXT_KIND_INVALID`], accepts no document, preserves the input bytes, and performs no normalization

#### Scenario: Value and kind are both invalid
- **WHEN** a non-text-capable node carries a number, boolean, null, array, plain object, or valid glass-fill-shaped object as text through command ingress or deserialization
- **THEN** command ingress throws exactly `DOCUMENT_TEXT_VALUE_INVALID`, deserialization returns exactly [`DOCUMENT_TEXT_VALUE_INVALID`], and neither path emits or is intercepted by `DOCUMENT_TEXT_KIND_INVALID` or a generic property-value diagnostic

### Requirement: Authored and ephemeral editing state remain separate
The system SHALL persist logical text and declared text intent only; caret, selection, composition, shaped glyphs, line boxes, fallback results, and renderer cache state SHALL remain disposable or ephemeral and SHALL NOT appear in canonical document serialization.

#### Scenario: Save during an editing session
- **WHEN** a document is saved while a text node has a caret, range selection, or active uncommitted composition
- **THEN** canonical persistence contains the committed logical content and authored intent but none of the caret, selection, composition, glyph, line, or cache state

### Requirement: Kernel-owned plain-text editing
In the plain-text editing milestone, insert, delete, and replace operations SHALL use the same validated, invertible mutation contract for human and agent callers; an input method adapter SHALL NOT mutate durable content directly.

#### Scenario: Committed input transaction
- **WHEN** an input composition or typing action commits text
- **THEN** the resulting logical edit has one explicitly specified history outcome and undo restores the preceding logical content without restoring ephemeral composition or caret state

#### Scenario: Cancelled composition
- **WHEN** an active composition is cancelled
- **THEN** no durable content, revision, or history entry changes

#### Scenario: Grapheme and bidi editing
- **WHEN** deletion, range replacement, or caret movement is applied to combining text, an emoji sequence, or mixed-direction text
- **THEN** the operation follows the declared range-unit, grapheme, and affinity contract and does not produce an invalid range

### Requirement: Container intent is authored explicitly
In the typography and layout integration milestone, text SHALL use the `authored-layout` capability's per-axis `Fixed | Hug | Fill` sizing without defining a second sizing vocabulary. For the initially supported horizontal writing mode, horizontal sizing SHALL govern the inline axis and vertical sizing SHALL govern the block axis: `Fixed` supplies the declared axis size as a text-layout constraint, `Hug` derives the resolved axis size from intrinsic text measurement under applicable constraints, and `Fill` uses the size distributed by authored layout as a text-layout constraint. Minimum and maximum sizing SHALL remain owned by `authored-layout`. This capability owns any text-content overflow policy added for content exceeding the resolved container; that policy SHALL be authored explicitly and SHALL NOT rewrite authored dimensions. Vertical writing, path text, and shape text are not implied by this mapping.

#### Scenario: Intrinsic text container
- **WHEN** logical content or a resolved font changes for a text node with a Hug-sized axis
- **THEN** its resolved container dimension is recomputed from text layout while its authored policy remains unchanged

#### Scenario: Fixed or Fill text container
- **WHEN** a text node has a Fixed axis or receives a distributed Fill size
- **THEN** text layout uses that resolved axis size as its constraint without changing the authored sizing mode

#### Scenario: Text exceeds its resolved container
- **WHEN** text content exceeds a resolved Fixed or Fill container, or a Hug result constrained by authored minimum or maximum sizing
- **THEN** line layout and overflow follow the authored text-content overflow policy without rewriting authored dimensions or redefining `Fixed | Hug | Fill`

### Requirement: Canonical persistence and migration
The first schema that requires canonical text strings SHALL be reached through an explicit known-schema migration. A known predecessor document SHALL be migratable only if it satisfies the retrospective text-kind/type rule. For each accepted predecessor-schema text-capable node, migration SHALL preserve a present string and SHALL canonicalize an absent text member to `text: ""` before current-schema validation. Every known source validator SHALL reject a present non-string with `DOCUMENT_TEXT_VALUE_INVALID` and a present string on a non-text-capable node with `DOCUMENT_TEXT_KIND_INVALID` before that source's migration step. Migration SHALL NOT coerce a present invalid value or strip, relocate, or normalize wrong-kind text. This intentionally breaks compatibility for documents historical lax validators accepted with wrong-kind text rather than silently losing data. Current-schema text-capable nodes with absent text SHALL be rejected with `DOCUMENT_TEXT_VALUE_INVALID`; commands SHALL therefore operate only on strings. Canonical persistence SHALL serialize the required empty string. The existing v3→v4 migration SHALL target an explicit v4 constant rather than the moving current-version constant. Unknown schema versions SHALL be rejected without migration, and migration SHALL NOT materialize resolved glyphs, lines, fallback choices, or font-discovery results as authored data.

#### Scenario: Qualifying existing document round trip
- **WHEN** a pre-capability document satisfying the retrospective text-kind/type rule is opened, saved, and reopened
- **THEN** its logical content is preserved and canonical serialization is stable under the declared migration

#### Scenario: Historical absent text
- **WHEN** a valid known predecessor-schema text-capable node omits its optional text member
- **THEN** migration produces canonical `text: ""`, persistence includes that member, and save then reopen produces identical canonical bytes

#### Scenario: First replacement after absent-text migration
- **WHEN** the first command replaces the migrated empty string with non-empty text and is undone
- **THEN** its explicit inverse restores `text: ""` and never restores an absent or undefined value

#### Scenario: Current-schema absent text
- **WHEN** a text-capable node in the current required-string schema omits text
- **THEN** deserialization returns exactly [`DOCUMENT_TEXT_VALUE_INVALID`] and does not silently add the member

#### Scenario: Historical present invalid text
- **WHEN** any known predecessor-schema node has a present non-string text value
- **THEN** source-version validation rejects it with the deterministic text diagnostic before migration and no migration step coerces it

#### Scenario: Historically accepted wrong-kind text
- **WHEN** any v1–v4 document has a present string text member on a non-text-capable node, even if a historical lax validator accepted it
- **THEN** source-version validation returns exactly [`DOCUMENT_TEXT_KIND_INVALID`] before that source's migration step and does not strip, relocate, normalize, or otherwise migrate the value

#### Scenario: Migration chain remains ordered after the schema bump
- **WHEN** a v3 document satisfying the retrospective text rule migrates to v5
- **THEN** the applied-id sequence includes the explicit v3→v4 step followed by `v4-to-v5-require-text-content`, with v3→v4 targeting v4 rather than the moving current schema version

#### Scenario: Unknown document version
- **WHEN** a document declares an unsupported future schema version
- **THEN** the system rejects it with `DOCUMENT_UNSUPPORTED_SCHEMA` before any text migration rather than coercing or dropping text data

### Requirement: Interchange fidelity is explicit and staged
In the later rich-text and interchange milestone, every supported interchange boundary SHALL state independently whether it preserves logical content, editable intent, and/or pixel appearance; successful output alone SHALL NOT imply all three.

#### Scenario: Unsupported live-text feature
- **WHEN** an interchange target cannot preserve a font, text feature, range, or container behavior
- **THEN** the result is classified at the supported fidelity level and a stable diagnostic identifies the unsupported fidelity rather than silently presenting substitution as equivalent

### Requirement: Scoped rich intent follows plain-text proof
Inline and paragraph intent SHALL NOT become authorable until range units, normalization, plain-text editing, font resolution, and container behavior have passed their required conformance gates.

#### Scenario: Rich-text gate is not satisfied
- **WHEN** any prerequisite plain-text contract remains unapproved or failing
- **THEN** production authoring cannot create scoped rich-text ranges or paragraph records
