## Why

Crafty cannot edit vector paths at all today. `NodeKind` is
`"page-root" | "frame" | "group" | "rectangle" | "text" | "image"`
(`packages/editor-kernel/src/document.ts:7`) and `DocumentNode` carries only
`bounds/transform/visible/locked/opacity/fill/stroke/cornerRadius/zIndex/text`
(`document.ts:27-44`). There is no point, anchor, segment or subpath anywhere in
the repo. The audit of the Figma/Sketch/Penpot interaction inventory
(`docs/architecture/interaction-conformance.md`) scored the entire vector family
`unsupported` — 87 of 88 audited rows for vector/text/image/layout/grid are not
model-blocked, not kernel-tested, not canvas-enabled.

A research team (session `b4241c09` in the crafty Claude project) studied how
Penpot, Figma, tldraw, Graphite/`bezier-rs`, Inkscape and the SVG spec model
editable path geometry, reading primary source where possible. This change is
the document-model half of its recommendation, deliberately scoped so the
schema, commands and validation land and are tested *before* any renderer
tessellation exists.

Two hard prerequisites the research identified are already true of the working
tree:

- `layerTypeFor` now throws on unknown kinds (`scene-adapter.ts:24`) instead of
  silently falling through to `"image"`, so a future `path` node can never be
  silently destroyed by the legacy `Scene` round-trip.
- `reparent-node` exists (`commands.ts:10`), which is the prerequisite for
  group/ungroup/frame/unframe — the structural operations that a path node will
  be nested under.

What remains is the data model itself: a `path` node kind, a path geometry
representation with stable point identity, the command vocabulary with exact
inverses, validation, and the derived-`bounds` rule.

## What Changes

**The schema goes to v3** (`EDITOR_DOCUMENT_SCHEMA_VERSION = 3`). The `"path"`
kind joins the closed union, `DocumentNode` gains an optional `path?` field,
and — critically — the accepted kind set becomes **parameterised by schema
version**. Today `validateNode` (`document.ts:186`) hardcodes the kind list and
is shared by the v1 and v2 validators, so naively adding `"path"` would let a v1
document containing a path node newly validate as v1, which is false. The
migration chain (`DOCUMENT_MIGRATIONS`, `document.ts:322`) has exactly one entry
and has never actually chained; v1→v3 must be verified to work.

**Path geometry is an ordered subpath list over a flat id-keyed point map** —
not a vector network, not an SVG string:

```ts
PathGeometry = { points: Record<PointId, PathPoint>, subpaths: Record<SubpathId, PathSubpath>, fillRule: "nonzero" | "evenodd" }
```

Points carry stable minted ids, node-local coordinates, authored handle intent
(`PathHandleMode = "corner" | "free" | "asymmetric" | "mirrored"`), optional
tangent handles, and a fractional order key (`OrderKey`, the tldraw
`IndexKey` pattern) instead of an ordered array — insertion never renumbers.
Membership is the point's own `subpathId`, never an index. Handles are stored as
anchor-relative deltas (`dx`/`dy`), and `mirrored` stores only `handleOut`,
deriving `handleIn` as its negation so the mode cannot drift into a state
`assertValid` rejects.

**A closed path-command vocabulary, every command absolute-valued with an
exact inverse** — the kernel recomputes inverses against `beforeDocument` on
every `preview()` (`kernel.ts:157`), so relative commands are incorrect by
construction in a drag. Granular commands (`set-path-points`,
`insert-path-point`, `remove-path-point`, `set-subpath-closed`,
`reverse-subpath`, `set-path-fill-rule`) carry full point records plus
recomputed `bounds`; structural operations (`join endpoints`, split, boolean
results, paste) use one `replace-path-geometry` whose inverse is the previous
geometry — the whole-content pattern Penpot ships for every path op.

**`bounds` becomes derived-and-verified for path nodes.** `bounds.x/y` remain
authored placement for every kind; for `path`, `width/height` are the tight
bbox of the geometry, computed by the command layer, written by the same
command, and verified by `assertValid`. The geometry bbox is pinned to
`(0,0)` node-local (the existing hit-testing convention), so dragging a point
past an edge rebases all points in the same command — an O(points) cost in the
same class as the per-command validation that already runs.

**Validation.** `validateNode` gains: kind⟺geometry coupling, point/subpath id
uniqueness (node-local, to keep the document-wide duplicate check O(n)),
referential integrity (every point referenced by exactly one subpath exactly
once), minimum subpath length, world-limit checks, handle-mode consistency, and
a tolerance-compared bounds check using true bezier extrema. **I8 is relaxed to
`>= 0` for `path` only** — a straight horizontal line has zero height and must
be representable.

**Editor surfaces.** `EditorTool` gains `"pen"` and `"node"` with disjoint
effect vocabularies (`interaction.ts:33`); `HistoryEntry` gains
`pointSelectionBefore/After` so undo restores point selection; `ClipboardNode`
carries `path` and paste mints fresh point ids; hit testing gains a geometry
narrow phase.

**Explicitly out of scope**, recorded so they are not smuggled in: renderer
tessellation (`DrawGeometry = "rect"` stays), gradients and `Paint[]`, the
`Scene` persistence round-trip retirement, vector networks, shape-builder and
boolean ops, strokes with caps/joins/dashes, collaboration.

## Capabilities

### New Capabilities

- `editor-kernel/path-data-model`: the v3 schema, `PathGeometry` representation
  — what identity, ordering, handles and authored intent mean for a path node,
  and the derived-`bounds` rule.
- `editor-kernel/path-commands`: the closed command vocabulary, its absolute
  values, exact inverses and validation interplay.

### Modified Capabilities

None. `openspec/specs/` is empty; the existing change
(`harden-wasm-webgpu-foundation`) touches the renderer only.

## Impact

- `packages/editor-kernel/src/document.ts` — schema version, `NodeKind`, `path?`
  field, `PathGeometry` types, parameterised kind sets, migration.
- `packages/editor-kernel/src/commands.ts` — seven new command cases with
  inverses; `bounds` recomputation.
- `packages/editor-kernel/src/interaction.ts` — `EditorTool`, effect
  vocabularies.
- `packages/editor-kernel/src/kernel.ts` — `HistoryEntry` point selection.
- `packages/editor-kernel/src/clipboard.ts` — `ClipboardNode.path`, paste id
  minting.
- `packages/editor-kernel/src/coordinates.ts` or a new geometry module — bounds
  computation with bezier extrema, de Casteljau split (command payloads need
  post-split neighbour tangents).
- Hit testing (`interaction.ts`) — geometry narrow phase.
- `docs/architecture/invariants.md` — I8 relaxation for paths.
- `docs/architecture/document-model.md` — the authored/derived `bounds` split.
- A new ADR: per-point tangents (subpath) vs per-segment tangents
  (network-ready) — the one flip-able decision the research escalated.
- `docs/architecture/interaction-conformance.md` — vector rows move from
  `unsupported` to `modeled` where they land.
- Tests in the surrounding style: command round-trips (undo/redo), validation
  rules, migration chaining v1→v2→v3, reverse-subpath self-inverse property.
- The renderer, scene model and persistence are untouched by this change.
