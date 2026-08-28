# Interaction Conformance

Status: **Audit snapshot**, 2026-08-07. Sourced from a four-way code audit of the
canonical canvas-interaction surface shared by Figma, Sketch, and Penpot, scored
against Crafty as it exists — not as documented, and not as planned.

This is not a roadmap. It is a measurement, and a claim about what the
measurement means.

## Why this exists

"Make it behave like professional design software" is not a testable statement.
The industry-standard surface is roughly 300 distinct user actions across
navigation, selection, transform, creation, hierarchy, clipboard, alignment,
snapping, style, masks, vector editing, text, images, layout, components,
prototyping, comments, and inspection.

Enumerating them produces a checklist, which is the least useful form of this
information. The useful form is the observation that falls out of the
enumeration:

> The ~300 actions are gated by roughly a dozen substrate decisions. Most rows
> are not independent work. Ranking substrate gaps by rows-unlocked is a
> different — and much shorter — plan than working the checklist.

## The scoring ladder

Each action is scored at exactly one level:

| Level | Meaning |
|---|---|
| `unsupported` | No code models it |
| `modeled` | A type or record exists; no test, no wiring, no consumer |
| `kernel-tested` | Implemented in the kernel with automated coverage |
| `canvas-enabled` | Reachable end to end through the actual canvas surface |
| `polished` | Canvas-enabled, with modifiers, feedback, and edge cases handled |

The distinction that matters most is `modeled` vs `kernel-tested`, and
`kernel-tested` vs `canvas-enabled`. Crafty has an unusual amount of work
stranded at each of those two boundaries, and they have opposite remedies.

Interaction completeness is **input modality × action**, not toolbar presence.
A row is only `canvas-enabled` for the modalities actually wired.

## Headline results

| Slice | Shape of the result |
|---|---|
| Navigation / selection / movement / transform / snapping / history | Real substrate, thin reach. Viewport and history are the strongest areas in the product. |
| Vector / text / images / layout / 2D grid | 87 of 88 rows were `unsupported` at audit time. The **vector data model** has since landed (2026-08-07): path node kind, geometry record, and the point-edit commands are now `modeled` / `kernel-tested` — see the row table below. Text, images, layout and grid rows are unchanged. |
| Components / prototype / comments / inspection | Records without semantics; prototyping absent entirely; comments blocked on infrastructure that does not exist. |
| Creation / hierarchy / clipboard / alignment / style / masks | Clipboard is the most complete area in the product. Style is blocked in the model *and* the renderer. Alignment is absent. |

### What is genuinely good today

Worth stating plainly, because an audit that only lists absences misrepresents
the codebase:

- **Viewport.** Wheel/trackpad panning with deltaMode normalization and rAF
  coalescing, two-pointer pinch, Safari gesture events, and zoom-around-pointer
  with anchor invariance property-tested across factors, anchors, and zoom
  levels (`coordinates.test.ts:14`).
- **History.** Undo/redo restores page context *and* selection; transaction and
  batch entries collapse correctly (`kernel.ts:189`).
- **Gesture arbitration.** One owner per pointer session, with a closed
  per-tool effect vocabulary (`interaction.ts:33`) enforced as an
  anti-regression contract. Navigation always cancels first, so a pinch or a
  wheel can never produce a shape. This is the design that most editors get
  wrong, and it is right here.
- **Rollback.** Escape, `pointercancel`, tool switch, and scroll-pan all
  converge on a single full-document rollback. No partial-cancellation path
  exists.
- **Page/guide/grid document layer.** Schema v2 `PageCanvas` — grids, rulers,
  snap settings, guide CRUD — is complete, validated, undoable, and rendered.
- **Clipboard.** Copy and paste are the two most complete actions in the
  product, and the only two scored `polished` outside the viewport. Copy does
  topmost-subtree pruning, component/variable/library capture, and MIME-tagged
  OS write with graceful failure. Paste does arm→preview→commit, ID minting,
  override remap with path fallback and drop diagnostics, hovered-frame
  targeting, and collapses to a single undo entry
  (`clipboard.ts:114-275`, `clipboard.test.ts:28-259`).

### Confirmed structural facts

Verified directly, not inferred:

- `DocumentNode` carries `fill: string`, `stroke: string`, `cornerRadius: number`
  (`document.ts:27-44`). Scalars. A repo-wide grep for
  `gradient|shadow|blur|strokeWidth|dash|lineCap|blendMode` across the entire
  canvas lineage returns **zero hits** outside an unrelated icon prop. Multiple
  fills, gradients, stroke width, dashes, shadows, and blurs are
  **unrepresentable**, not unimplemented.
- `DrawGeometry = "rect"` (`scene-renderer/src/draw-protocol.ts:6`), and the
  Rust encoder emits `geometry: "rect"` for every layer including `text` and
  `image` (`scene-renderer/rust/src/lib.rs:265-282`). Text draws as a colored
  rectangle.
- The renderer is narrower than the model it renders. The Rust `Layer`
  deserializer reads only `id/bounds/transform/fill/opacity/visible/zIndex/
  children` (`lib.rs:142-153`) — it does not *parse* `stroke`, `cornerRadius`,
  or `text`. Three properties the document already stores, validates, and
  round-trips through the clipboard are silently discarded at draw time.
  (`appendOutline`, `webgpu-renderer.ts:47`, is selection chrome built from four
  overlay rects — not a stroke.)
- A repo-wide grep for `ungroup|reparent|setParent|groupSelection` returns
  **zero hits**. `group` is a `NodeKind` that nothing can create, and
  `reorder-node` throws `DOCUMENT_REORDER_PARENT_INVALID` when the parent
  differs (`commands.ts:259`). No code path moves a node between parents.
- `set-property` takes a closed union of eight scalar properties
  (`commands.ts:11`) that **excludes `transform`** — while hit-testing and the
  renderer both honor per-node affine transforms. Rotation and flip are
  representable and unreachable.
- No multiplayer, identity, or annotation layer exists. Grepping
  `WebSocket|yjs|automerge|crdt|presence|comment` across `packages/`, `apps/`,
  and `crates/` returns zero hits. Persistence is single-writer filesystem with
  one integer revision compare.

### Vector rows this change moves off `unsupported`

The `vector-path-data-model` change (schema v3, 2026-08-07) makes the *data
model* true: a `path` node kind, the geometry record, and a closed point-edit
command vocabulary all exist in the kernel with tests. Nothing here reaches the
canvas and nothing renders a path. Per the ladder, rows are `modeled` when a
type or record exists and `kernel-tested` when the kernel implements them with
automated coverage — no row below is `canvas-enabled`.

| Action | Level | Evidence |
|---|---|---|
| Path node kind in the document model (validated, version-gated) | `modeled` | `NodeKind` + `NODE_KINDS_V3` (`document.ts:9`, `:233-235`); validation (`document.ts:293-300`); v1/v2 rejection (`document.test.ts:51`) |
| Path geometry record: points, handles, subpaths, fill rule, fractional order | `modeled` | `PathGeometry`/`PathPoint`/`PathSubpath`/`PathHandle`/`OrderKey` (`document.ts:12-16`, `:41-71`); order keys and bbox math (`path-geometry.ts:20-89`, `:158`) |
| Derived-and-verified path `bounds` (bezier-extrema bbox; zero extent legal) | `kernel-tested` | `computePathBounds` (`path-geometry.ts:158`), tolerance check (`document.ts:278-281`); tests incl. stale-bounds and rebase (`document.test.ts:103`, `path-commands.test.ts:80`) |
| Move a point / adjust handles (absolute records) | `kernel-tested` | `set-path-points` (`commands.ts:13`, `:233-245`); `path-commands.test.ts:62` |
| Insert a point on a segment (de Casteljau split) | `kernel-tested` | `insert-path-point` (`commands.ts:14`, `:247-257`); `splitSegment` (`path-geometry.ts:203`); `path-commands.test.ts:109` |
| Delete a point (neighbours reconnected) | `kernel-tested` | `remove-path-point` (`commands.ts:15`, `:259-279`); `path-commands.test.ts:137` |
| Close / open a subpath | `kernel-tested` | `set-subpath-closed` (`commands.ts:16`, `:281-293`); `path-commands.test.ts:167` |
| Reverse a subpath's direction (self-inverse, payload-free) | `kernel-tested` | `reverse-subpath` (`commands.ts:17`, `:295-310`); `reverseOrderKey` (`path-geometry.ts:77`); `path-commands.test.ts:182` |
| Change fill rule (`nonzero` / `evenodd`) | `kernel-tested` | `set-path-fill-rule` (`commands.ts:18`, `:312-317`); `path-commands.test.ts:200` |
| Whole-geometry replacement (join, split, paste — structural ops) | `kernel-tested` | `replace-path-geometry` (`commands.ts:19`, `:319-325`); `path-commands.test.ts:212` |
| Point selection (ephemeral, survives undo, filtered against live geometry) | `kernel-tested` | `selectedPointIds` + `pointSelectionBefore`/`After` in history (`kernel.ts:28`, `:117`, `:167-176`, `:247-257`); `path-selection.test.ts:52-81` |
| Pen / node tools declared, closed disjoint vocabularies | `modeled` | `EditorTool` gains `"pen"`/`"node"` with navigation-only vocabularies (`interaction.ts:8`, `:40-46`); the disjointness contract is asserted (`path-selection.test.ts:84-110`). The tools arm a session and emit nothing — no point creation exists yet, and nothing in the canvas harness wires them |
| Clipboard carries path geometry; paste mints fresh point/subpath ids | `kernel-tested` | `ClipboardNode.path` (`clipboard.ts:32`), `mintPathGeometry` (`clipboard.ts:232-268`); exact round-trip and shared-id-free paste tests (`path-selection.test.ts:112-143`) |
| Hit-testing path geometry (AABB broad phase + geometry narrow phase) | `kernel-tested` | `documentHitTest` narrow phase (`interaction.ts:118-137`, `pointInSubpath` at `path-geometry.ts:271`); bbox-inside/geometry-outside and geometry-hit tests (`path-selection.test.ts:145-169`) |

**Still `unsupported`** — canvas wiring and renderer rows. Nothing in the
browser harness arms the pen/node tools, draws a path, or renders one: no path
draw geometry, no tessellation (`DrawGeometry = "rect"`,
`draw-protocol.ts:6`) — the renderer work is the next change
(`openspec/changes/vector-path-rendering/`).

Snapshot note (2026-08-07): the implementation landed while this table was
written; three tests in `path-selection.test.ts` — point-selection undo
(`:60`), clipboard round-trip subpath remap (`:113`), hit-test geometry select
(`:165`) — were still failing in the mid-flight working tree. Rows above are
scored against the change's spec, which requires them; re-run the suite to
confirm before relying on the exact row count.

## The substrate gaps, ranked by rows unlocked

This is the actual output of the audit. Each item gates the row count beside it.

| # | Gap | Rows | Note |
|---|---|---:|---|
| 1 | **No geometry primitive beyond an axis-aligned rect** | ~30 | A path node kind and validated geometry landed 2026-08-07 (`vector-path-data-model` — the model half, see the vector rows table above). Still missing: a path draw geometry and GPU tessellation (`vector-path-rendering` is the next change). Zeroes text-to-outlines and non-rect masks. The largest single item on the board. |
| 2 | **No text stack** — no font model, metrics, shaping, or caret | ~25 | `text?: string` is the entire typography model. Also blocks baseline alignment and every hug-to-content sizing row, which are undefined without measurement. |
| 3 | **No authored/resolved split** | ~35 | Everything reads and writes absolute `bounds`, including the sole renderer feed (`scene-adapter.ts:69-79`). **Prerequisite for #4, not parallel to it.** |
| 4 | **No layout stage on the canvas path** | ~35 | Layout is computed by no one. See the note below — the algorithm already exists. |
| 5 | **No instance-resolution step** | ~15 | Definitions, instances, and overrides are stored but nothing expands or applies them. |
| 6 | **No interaction/behavior graph in the document** | ~32 | No edges, triggers, actions, or flows. Every prototype row fails on this one absence. |
| 7 | **No style model beyond scalars** | ~29 | See confirmed facts above. Model *and* renderer both need widening. |
| 8 | ~~**No reparent command**~~ | ~10 | **Kernel done.** `reparent-node` lands with exact structural undo, cycle rejection, and index validation. Group/ungroup/frame/unframe/mask/flatten are now unblocked at the kernel; each still needs its own command and UI. |
| 9 | **No transform-handle model** | ~7 | Resize is a hardcoded 16px bottom-right hot zone (`harness.ts:589`) routed through `move`. No handle enumeration, no anchor, no active-handle state. |
| 10 | **The snap service has no caller** | ~7 | Fully implemented and tested (`grid.ts:263`, `grid.test.ts:181-241`); `harness.ts` never invokes it. |
| 11 | **No selection scope / hierarchy context** | ~9 | `focusedId` and `isolationRootId` exist on `EditorState` and nothing writes or reads them. Hit-testing is flat-deepest. |
| 12 | **No keyboard command layer** beyond tools/history/clipboard | ~8 | No arrow keys at all. Cmd+0/+/- are `preventDefault`ed with no handler — currently *worse* than unimplemented, since the browser fallback is suppressed too. |
| 13 | **No asset/resource layer** | ~9 | No image source field, no texture upload, no asset table. Will also be required for glyph atlases in #2 — build once for both. |
| 14 | **No collaboration infrastructure** | 4 | Not a UI gap. Comments require sockets, identity, and presence from zero. |
| 15 | **No multi-node geometry command** | ~15 | All bounds edits are `set-bounds` on one node; even `duplicate` reads `selectedIds[0]`. Alignment, distribute, tidy, and equal-spacing all need a selection-wide operator. Also the fix for multi-select drag. |
| 16 | **The tool registry is a closed three-entry union** | ~15 | `EditorTool = select\|rectangle\|hand`, effect vocabularies are enumerated literals, and `commit-rectangle` builds a rectangle inline (`harness.ts:624-633`). Every new tool edits the union rather than registering. |
| 17 | **The layers panel is read-only and permanently flat** | ~7 | Strands *working, tested* kernel commands as unreachable — see below. |

## Four findings that change the plan

These are the things a checklist would have hidden.

### 1. A working flex solver already exists, in the wrong place

`pen-import/src/index.ts:296-405` implements direction, gap, four-side padding,
justify, align, `fill_container`, and absolute positioning — with tests. It runs
at *import time* and destructively flattens intent into absolute `bounds`, so
nothing survives into `EditorDocument`.

Roughly twenty layout rows do not need an algorithm invented. They need this one
relocated to a resolve stage — which is why gap #3 must land before gap #4.

### 2. Some "existing support" belongs to a dormant lineage and does not count

- **Components** appear three times: kernel records with no semantics
  (`document.ts:108-121`; the architecture doc concedes "Records exist.
  Semantics do not."); a dormant workbench system that discovers real components
  from source but whose render target is hard-coded `status: "unsupported"`; and
  the legacy `Story` mechanism — the only one that actually repaints a canvas,
  and the one its own panel marks for replacement (`states-panel.tsx:11-15`).
- **A second, complete canvas implementation once existed in
  `apps/vscode-extension/webview`** — its own Zustand `CanvasNodeFrame` type,
  rendered as DOM divs with inline CSS. It imported neither
  `@crafty/editor/kernel` nor `@crafty/scene-model`.

**That lineage is retired and this is not an open question.** It was pre-alpha
work predating the canvas lineage, and it was removed in one deliberate change —
[ADR 0016](adrs/0016-block-compiler-lineage-retirement.md). The WASM/WebGPU
canvas is the product.

The audit surfaced working alignment, stroke width, corner radius, drop shadow,
and backdrop blur in that webview. **None of it counts as support.** Those rows
are `unsupported`, flagged `[vsx]` only so nobody re-discovers them later and
mistakes them for product capability. They were readable prior art — the
alignment math was correct and worth reading before writing the kernel
version — but the code did not migrate.

What remains genuinely undecided is narrower and lives entirely inside the
canvas lineage: **components**. The kernel has definition/instance records with
no semantics (`document.ts:108-121`), while the only variant switch that repaints
a canvas today is the legacy `Story` mechanism in `apps/crafty-web`, which its
own panel marks for replacement (`states-panel.tsx:11-15`). That one is a real
fork in the road.

### 3. Capability is stranded one layer short of the user

The largest cluster of cheap wins is not new capability. The guide/ruler/grid/
snap layer is built, validated, undoable, rendered — and has no UI. Snapping is
implemented and tested with no caller. `queryCandidates()` returns the full
ordered hit stack, tested, and nothing calls it. `editor.reorder(±1)` is
implemented and tested (`harness.test.ts:467`) with no button, keybinding, or
panel control. Lock, visibility, and rename all have working kernel commands and
no affordance anywhere, because the layers panel renders plain selection buttons
over a permanently expanded tree (`layers-panel.tsx:16-25`).

These rows need wiring, not design. They are the cheapest large win on the
board.

### 4. Three live correctness gaps, independent of any roadmap

The audit found three bugs — not missing features. Two are now fixed:

- ~~**Drag moves only the hit subtree, not the rest of the selection.**~~
  **Fixed.** The `move` effect now carries `nodeIds`, and the reducer emits the
  whole selection when the grabbed node belongs to it. This exposed a second
  bug behind it: pointer-**down** collapsed a multi-selection to the clicked
  node, so a multi-drag could never have worked. Collapse is now deferred to
  pointer-up and only fires when no drag occurred.
- ~~**Lock is dropped on the projection the canvas hit-tests.**~~ **Fixed.**
  `Layer.locked` is now carried through the scene projection and inherited down
  the tree in `SceneSpatialIndex`, matching how `visible` already behaved.
  Marquee selection previously filtered on *neither* flag, so hidden layers were
  marquee-selectable too; both are now honored. Lock also survives a save/reload
  round-trip, which it did not before (`scene-adapter.ts` hardcoded
  `locked: false` on the way in).
- **The validator never checks `components`/`instances`/`variables`**
  (`document.ts:224-274`). Those maps can drift into invalid states silently.
  **Still open — and it must not be fixed first.** Adding the obvious rules
  would reject states the current code legitimately produces:
  `planClipboardInsert` deliberately writes a dangling instance and reports
  `PASTE_COMPONENT_MISSING` (`clipboard.ts:267-271`, entirely untested);
  `delete-subtree` and `delete-page` orphan `instances` entries where
  `delete-pasted-nodes` cleans them up; `variables` are collected on copy and
  silently dropped on paste, since `mint-and-insert` carries no `variables`
  field; and paste never remaps a component's `rootNodeId`
  (`clipboard.ts:264`), which only passes today because the existing test
  pastes within one document. Fix those four, then add the rules.
  Note `validateDocumentStructure` is shared by v1 and v2 validation, so any
  new rule must be gated on `expectedVersion` or it retroactively breaks
  loading existing saved files.

One more worth naming: "resize parent without resizing contents" scores
`canvas-enabled`, but only because nothing propagates to children. The correct
behavior and the missing behavior are presently indistinguishable — a gap
wearing a feature's clothes.

## How to use this

The matrix is a conformance target, not a backlog. The intended workflow:

1. A row's status is a claim about the code, and every non-`unsupported` row
   carries `path:line` evidence. Claims are checkable.
2. Status only moves on evidence — a test for `kernel-tested`, a wired canvas
   path for `canvas-enabled`.
3. Substrate gaps are the unit of planning. Rows are the unit of verification.

The natural next step is to turn the ranked gap table into a conformance suite,
so that "this behaves like professional design software" becomes a number that
moves rather than an opinion.

## Audit provenance

Four parallel read-only audits, each verifying in code and instructed to treat
documentation and roadmap entries as `unsupported`:

| Slice | Result |
|---|---|
| Navigation, selection, movement, transform, snapping, history | Complete |
| Vector, text, images, layout containers, 2D grid | Complete |
| Components, prototype, comments, inspection | Complete |
| Creation, hierarchy, clipboard, alignment, style, masks | Complete |

Row counts in the gap table are an aggregation across four differently-scoped
audits, not a verified census. The ranking is sound; treat the individual
numbers as approximate.
