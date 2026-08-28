## 1. Schema v3 with parameterised kind sets

- [x] 1.1 Add a failing test asserting a document containing a `"path"` node validates as v3 but fails as v2 and v1
- [x] 1.2 Bump `EDITOR_DOCUMENT_SCHEMA_VERSION` to 3 and add `"path"` to `NodeKind`
- [x] 1.3 Parameterise the accepted kind set in `validateDocumentStructure` / `validateNode` by schema version; v1 keeps the five kinds, v2 keeps six, v3 has seven
- [x] 1.4 Add `v2ToV3DocumentMigration` (re-stamps `schemaVersion` only) and register it in `DOCUMENT_MIGRATIONS`
- [x] 1.5 Add a migration-chain test: v1 → v2 → v3 round-trips without data loss
- [x] 1.6 Add a test asserting a v3 document is rejected by a v2 reader (I10: unknown versions rejected, never coerced)
- [x] 1.7 Confirm 1.1, 1.5, 1.6 pass; confirm no existing fixture or test was weakened

## 2. Geometry types and validation

- [x] 2.1 Add `PathPoint`, `PathSubpath`, `PathGeometry`, `PathHandle`, `PathHandleMode`, `PointId`, `SubpathId`, `OrderKey` to `document.ts`, with `path?: PathGeometry` on `DocumentNode`
- [x] 2.2 Add a `computePathBounds` module (true bezier extrema, not the control-point hull) with tests for curves whose extrema lie off the control hull
- [x] 2.3 Add validation rules to `validateNode`: kind⟺geometry coupling, leaf rule, id map-key equality, node-local id uniqueness, exactly-one-subpath-exactly-once referential integrity, minimum subpath length, world-limit and finiteness checks, handle-mode consistency (corner ⟹ no handles; mirrored ⟹ `handleIn` absent), fill-rule enum, tolerance-compared bounds check
- [x] 2.4 Relax I8 (`width > 0 && height > 0`) to `>= 0` for `kind === "path"` only; audit every `bounds` consumer for zero-area division risk and fix or name any found
- [x] 2.5 Add tests for every rule, including: orphan point, shared point, one-point subpath, non-finite coordinate, stale bounds, mirrored-with-both-handles, rect-carrying-geometry, path-without-geometry
- [x] 2.6 Update `docs/architecture/invariants.md` (I8 relaxation) and `document-model.md` (path representation, derived `bounds`, the authored/derived split)

## 3. Command vocabulary with exact inverses

- [x] 3.1 Add `set-path-points`, `insert-path-point`, `remove-path-point`, `set-subpath-closed`, `reverse-subpath`, `set-path-fill-rule`, `replace-path-geometry` to `DocumentCommand`, each with an exact inverse computed against `beforeDocument` and each running through `assertValid`
- [x] 3.2 Add the de Casteljau split helper used by `insert-path-point`, tested at several parameters including `t = 0.5` and near-0/near-1
- [x] 3.3 Add undo/redo round-trip tests for every command, in the surrounding `commands.test.ts` style
- [x] 3.4 Add a property-style test asserting `reverse-subpath` is a self-inverse (applied twice returns the exact original, including handle assignments)
- [x] 3.5 Add a test asserting `insert-path-point` inverse restores pre-split neighbour tangents exactly
- [x] 3.6 Add a test asserting every path command that changes geometry carries recomputed `bounds` that validates (no command may rely on stale `bounds`)
- [x] 3.7 Add a test asserting `replace-path-geometry` inverse restores exact previous geometry including subpath and point ids

## 4. Point selection and history

- [x] 4.1 Add `pointSelectionBefore`/`pointSelectionAfter` to `HistoryEntry` and `Transaction`, mirroring the node-selection handling
- [x] 4.2 Filter `selectedPointIds` against live geometry on every `apply` (deleted points cannot remain selected), mirroring `kernel.ts:101`
- [x] 4.3 Add a test: delete a selected point, undo, assert the point is selected again
- [x] 4.4 Add a test: delete a selected point, assert the selection no longer contains it
- [x] 4.5 Confirm point selection is never serialized (ephemeral state only)

## 5. Tools, clipboard, hit testing

- [x] 5.1 Add `"pen"` and `"node"` to `EditorTool` with disjoint effect vocabularies in `TOOL_EFFECT_VOCABULARIES`
- [x] 5.2 Add a test asserting the pen vocabulary is disjoint from the rectangle vocabulary (I24 regression contract)
- [x] 5.3 Carry `path` through `ClipboardNode`; paste mints fresh point and subpath ids (I22)
- [x] 5.4 Add clipboard round-trip tests: copy/paste preserves geometry exactly, and two pasted copies share no point ids
- [x] 5.5 Add a geometry narrow phase to `documentHitTest` behind the unchanged AABB broad phase
- [x] 5.6 Add hit-test tests: clicking inside a curve's bbox but outside the geometry does not select; clicking the geometry does

## 6. ADR and documentation

- [x] 6.1 Write ADR 0009: per-point tangents (subpath model) vs per-segment tangents (network-ready), with the flip trigger (shape-builder or 3+-edge vertices as committed requirements) and the migration path if it fires
- [x] 6.2 Update `docs/architecture/current-state.md` gap list: vectors move from "absent everywhere" to "modeled, not rendered", naming the renderer tessellation work as the next change
- [x] 6.3 Update `docs/architecture/interaction-conformance.md` vector rows that this change makes `modeled`, leaving renderer-dependent rows `unsupported`
- [x] 6.4 Record the research sources and lessons in `docs/architecture/research-ledger.md` (Penpot coordinate-identity negative result, tldraw IndexKey, Figma per-segment tangents, Graphite node-graph non-transfers)

## 7. Verification

- [x] 7.1 Run `npm run typecheck`, `npm test`, `npm run lint`, `npm run format:check` and confirm all pass
- [x] 7.2 Confirm the renderer, scene-model and persistence packages are untouched by this change (no `DrawGeometry`, `Scene` or `layerTypeFor` edits)
