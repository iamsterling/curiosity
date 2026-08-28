# ADR 0023: Canonical dynamic-text content in document schema v5

Status: Accepted — implemented
Date: 2026-08-16

## Context

**Current.** The canonical `EditorDocument` is schema v5. `DocumentNode` is a
discriminated union: `kind: "text"` requires `text: string`, and every other
current kind has `text?: never`. Historical source-schema nodes retain an
untrusted optional member only until source-version validation rejects or
migrates them. Runtime validation and the typed `set-property` command enforce
the same ownership rule before durable mutation.

**Current.** The migration registry validates each known source version before
applying its next step, validates the final current version, and rejects unknown
starting versions with `DOCUMENT_UNSUPPORTED_SCHEMA`. Canonical serialization
validates the current document before emitting sorted-key JSON. This makes a
versioned correction possible without adding a second load path.

**Transitional.** [ADR 0020](0020-text-rendering-and-culling.md) establishes the
protocol-v5, embedded-Inter rendering foothold. It does not define canonical
document absence, migration, or text-validation semantics. The
[`dynamic-text-capability` OpenSpec change](../../../openspec/changes/dynamic-text-capability/design.md)
requires this prerequisite decision before implementation.

The invariant at stake is that one logical authored value has one canonical,
validated durable representation, and every durable replacement has an exact
inverse. Treating absent text and empty text as interchangeable at consumers
would create two durable representations and make the first inverse ambiguous.

## Constraints

- The authored document remains canonical; resolved lines, glyphs, fallback
  choices, font discoveries, carets, and caches are never migrated into it.
- Known-version input is validated at its declared source version before a
  migration step can normalize it. Unknown versions are rejected, never
  coerced.
- Every text mutation uses validated, invertible commands. Rejection occurs
  before durable bytes, revision, undo depth, or redo depth change.
- Canonical persistence is deterministic and must not omit a required empty
  string.
- This decision must not select a text engine, layout contract, font system,
  glyph realizer, renderer packet, rich-text model, or performance target.

## Options Considered

### 1. Keep `text` optional and interpret absence as empty

This is plausible because v4 documents and fixtures already permit omission and
consumers can cheaply use `node.text ?? ""`. It loses because absence and `""`
would encode the same logical value differently, commands and inverses would
have to preserve that accidental distinction, and consumers could drift.

### 2. Require text without a schema bump

This is plausible as a small loader correction: fill absent values while still
calling the document v4. It loses because canonical bytes and validation
semantics would change without a versioned migration, and two implementations
claiming v4 could disagree on whether the same document is valid.

### 3. Require text in v5 and reject historical absence

This is plausible as the strictest invariant: every accepted document already
has the target shape. It loses backward compatibility with valid v1-v4
documents whose text nodes omitted the optional member.

### 4. Require text in v5 with an explicit v4→v5 migration

This is plausible because the existing registry already provides source and
final validation boundaries. It preserves every historical string only where
the node kind is text-capable, gives historical absence one deterministic
meaning, and makes current documents canonical. It adds a one-way compatibility
boundary, retrospectively rejects wrong-kind text that lax validators once
accepted, and causes fixture churn, but is the smallest version-honest,
no-silent-data-loss correction. **This option is accepted.**

## Decision

**Target.** Schema v5 requires an own `text` member whose value is a string on
every text-capable node. For v5, the only text-capable node kind is `text`.
Every other node kind must omit the member. Empty content is represented only as
`text: ""`; canonical persistence includes that member.

The migration is exactly `v4-to-v5-require-text-content`. After v4 source
validation and before v5 validation, it:

1. adds `text: ""` to each v4 `text` node that has no own `text` member;
2. preserves every present string exactly, without Unicode normalization or
   other content rewriting; and
3. never coerces, drops, or replaces a present malformed value.

Known v1-v3 documents reach this step through the existing ordered migration
chain only if each source validation boundary accepts them under the
retrospective text rule. Every known-version source validator rejects both a
present non-string value and a present string on a non-text-capable node before
that source's migration step. Wrong-kind strings are not stripped, relocated,
or normalized. This is an additional compatibility break for v1-v4 documents
that historical lax validators accepted; they are no longer migratable. An
unknown starting version is rejected with `DOCUMENT_UNSUPPORTED_SCHEMA` before
chain selection, with no migration applied.

The exact text validation codes and precedence are:

1. At command runtime, every `text` value for which
   `typeof value !== "string"` produces `DOCUMENT_TEXT_VALUE_INVALID`. This
   includes the JSON value classes number, boolean, null, array, and object
   (including a valid `GlassFill`-shaped object), and non-JSON JavaScript values
   such as `undefined`, function, symbol, and bigint.
2. Otherwise, a present string on a non-text-capable node produces
   `DOCUMENT_TEXT_KIND_INVALID`.
3. A v5 text-capable node with absent `text` produces
   `DOCUMENT_TEXT_VALUE_INVALID`.

Value validation therefore precedes kind validation when both defects coexist.
At command ingress it also precedes the generic
`DOCUMENT_PROPERTY_VALUE_INVALID:text` guard. Deserialization is JSON-scoped,
so its exhaustive non-string classes are number, boolean, null, array, and
object; it remains fail-fast and returns exactly the one applicable text
diagnostic for those cases. The source-validation rules apply to every known
source-version validator and the v5 validator; this ADR does not define a global
ordering against unrelated document defects encountered outside the affected
node.

Commands consequently operate on canonical strings only. The first replacement
of a migrated empty value records an inverse whose value is exactly `""`, never
absence or `undefined`.

This ADR extends but does **not** supersede ADR 0020. It decides canonical
content, diagnostics, and migration only. It does not decide an engine, shaping,
layout, font identity, caret/range units, glyph realization, renderer packet,
rich text, or performance policy.

## Consequences

- **Compatibility:** known v1-v4 documents are migratable only when they satisfy
  the retrospective text-kind/type rule. Historical absent text on text-capable
  nodes becomes `""`, and present strings on those nodes keep their exact value.
  A wrong-kind string or non-string value that historical lax validators
  accepted now rejects before migration. This deliberately breaks compatibility
  for that subset rather than silently dropping or laundering authored data.
- **Persistence:** the first canonical save after migration changes bytes by
  advancing `schemaVersion` to 5 and materializing empty text members. Later
  save→load→save operations are byte-stable under canonical serialization.
- **Commands/history:** replacement no longer needs an optional-value inverse;
  undo of the first replacement after migration restores `""`.
- **Forward/backward readers:** v5 readers retain the existing policy of
  rejecting unknown future versions. v4 readers reject v5 as unknown; they do
  not silently drop the required member or reinterpret v5 as v4.
- **Implementation work:** schema types, all known-version validators, command
  typing/runtime guards, migration-chain expectations, canonical fixtures, and
  persistence tests must move together. No renderer or resolution change is
  implied.

## Risks

- A source validator could retain the current validation hole, allowing the
  migration to appear to repair malformed input. This shows up when a
  non-string or wrong-kind-string v1-v4 fixture reaches its next migration id
  instead of returning the exact text diagnostic.
- A serializer or fixture builder could omit `""`, recreating two
  representations. This shows up as a v5 round-trip failure or a current-schema
  absent-text rejection during save.
- Generic command validation could intercept object values first. This shows up
  as `DOCUMENT_PROPERTY_VALUE_INVALID:text` instead of
  `DOCUMENT_TEXT_VALUE_INVALID`, or as changed revision/history after rejection.
- The existing v3→v4 migration could keep targeting the moving current-version
  constant and skip v4 when v5 lands. This shows up as an incorrect migration
  sequence or v3 output labeled v5 without the v4→v5 step.
- A deployment rollback could put a v4-only binary behind persisted v5 files.
  This shows up as `DOCUMENT_UNSUPPORTED_SCHEMA` at load; it must not trigger a
  relabel or lossy fallback.

## Validation

**Implemented.** The v4→v5 migration, source-version validation, command
precedence, canonical fixtures, static current-node representation, populated
history rejection checks, and packet-builder boundary test are covered by
`packages/editor/src/kernel/dynamic-text-schema.test.ts`. At the boundary, an
invalid document fails while constructing the kernel-backed `CanvasEditor`,
before its resolved scene can be supplied to `sceneToRenderFrame`; no renderer
semantic was added. Attributable red/green command output is retained under the
OpenSpec change evidence directory.

Implementation is accepted only when tests prove all of the following:

- the migration registry records `v4-to-v5-require-text-content` in the exact
  v1-v5 and v4-v5 applied-id sequences, and v3→v4 is pinned to an explicit v4
  constant rather than the moving current-version constant;
- v4 absence becomes `""`, every correctly-kinded valid string is preserved
  exactly, every present JSON non-string class and every wrong-kind string at
  each known source schema rejects before that schema's migration step, and
  schema 99 rejects with `DOCUMENT_UNSUPPORTED_SCHEMA` and no applied step;
- v5 absence and wrong-kind/value combinations return the exact one-element
  diagnostic sequences and precedence defined above;
- command static typing accepts only strings for `text`; runtime bypasses prove
  the exhaustive `typeof value !== "string"` rule with all JSON classes plus
  representative `undefined`, function, symbol, and bigint values, returning
  the exact code before mutation; and first replacement undo restores `""`;
- canonical v5 save→load→save bytes include empty text and remain identical; and
- rejected input never reaches renderer packet decode.

## Revisit When

Revisit this decision only if Crafty introduces another authored node kind that
can own logical text, or an approved rich-text schema replaces the single-string
canonical representation. Either event requires an explicit schema and
migration decision; engine, layout, or realization changes alone do not.

## Rollback and supersession

Before any v5 document is persisted, implementation can be rolled back by
removing the unshipped correction. After v5 persistence, rollback is not a
version relabel: operators must keep a v5-aware reader/writer deployed or obtain
a separately approved, tested compatibility/down-migration plan. No automatic
v5→v4 migration or dual-write format is approved here.

Any later ADR that changes required canonical text must supersede this record in
both directions. ADR 0020 remains accepted and unsuperseded by this decision.
