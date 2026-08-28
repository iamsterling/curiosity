# Design — Canvas Actions Parity, Tranche 1

## Context

See `proposal.md` — why. This document records how, and where the approach is
taken from Penpot's source and Figma's/tldraw's published behaviour rather
than invented.

### Prior-art sources used in this design

All Penpot claims were read from the `develop` branch source on 2026-08-07:

| Source | What it establishes |
|---|---|
| `common/src/app/common/geom/align.cljc` | `align-to-rect` (union-rect alignment), `align-to-parent`, `distribute-space` (equal-gap distribution), axis vocabularies |
| `frontend/src/app/main/data/workspace.cljs:967-1037` | `can-align?` / `can-distribute?` gating rules; single-selection aligns to parent; multi-selection to union rect; one undo transaction |
| `frontend/src/app/main/snap.cljs` | Two composable snap services: closest-point snap (`snap-accuracy` 10/zoom) and dynamic alignment equal-distance snap (`snap-distance-accuracy` 20/zoom); dominant-snap-per-axis combination (`combine-snaps-points`) |
| `frontend/src/app/worker/snap.cljs` | Snap index: per-frame x/y range trees; shapes indexed by their rotated points + center (`shape->snap-points`); frames add edge midpoints and layout grids; guides per frame or global; hidden/blocked/layout-children excluded |
| `frontend/src/app/worker/index.cljs:66-77` | `match-bounds?` — snap candidates must lie inside the visible viewport (the fix for issue #1971: off-screen shapes must not snap) |
| `frontend/src/app/main/ui/workspace/viewport/selection.cljs` | Selection identifiers: 1px accent outline, 4px corner circles with 10px hit circles, 8px-thick edge side-handlers, 20px rotation squares, minimum interactive rect `10/zoom`, small-selection handler placement (`25/zoom` threshold), handlers hidden during move/rotate |
| `frontend/src/app/main/ui/workspace/viewport/snap_distances.cljs` | Distance pills: 12px font, 20px tall, 4px radius, at the midpoint of the gap |
| Penpot issue #10258 (shipped 2.17.0) | Selection size badge: `{w} x {h}`, 2 decimals, fixed screen size, 8px below the union box, hidden during transforms |
| Penpot shortcuts (help site) | Alt+A/D/W/S/H/V align; Ctrl+Shift+Alt+H/V distribute; Tab/Shift+Tab sibling selection; Enter descends, Shift+Enter parent |
| Figma help (via `docs/research/competitor-capability-matrix.md`) | Smart selection, pixel grid ≥400%, always-snap containers, align-to-selection-bounds model |
| tldraw docs (`alignShapes`) | Common bounding box of the selection; alignment moves each shape to the edge/centre of that box; works across parents |

Every decision below states whether it follows the source, diverges from it,
or defers it.

## Goals / Non-Goals

**Goals:**

- The ~300-action surface starts moving by unlocking the conformance gaps that
  cost the least per row: wiring the tested snap service, the multi-node
  geometry commands, the keyboard layer, and the selection identifiers.
- Every new command and pure function is kernel-tested with no browser; the
  harness continues to drive interactions without React.
- Snap, align, and distribute behave like the professional tools, with the
  behaviours that those tools converged on (union-bounds align, equal-gap
  distribute, viewport-filtered object snap).

**Non-goals:** rotation/flip, cross-parent geometry, isolation, smart
selection, snap-settings UI. See `proposal.md` — Out of Scope.

## Design Decisions

### D1. Align: union-bounds model, same-parent scope

**Adopted from Penpot and tldraw.** Multi-selection alignment computes the
union rect of the selection (`shapes->rect` in Penpot; "common bounding box"
in tldraw; selection bounds in Figma) and moves every selected shape so its
own bounding box touches the requested edge or centre of the union. This is
the industry-converged model; the in-flight `align-nodes` command already
implements it for axis-aligned nodes.

**Divergence — same-parent only.** Penpot and tldraw resolve every shape to a
common (page) coordinate space, so alignment works across parents. Crafty's
kernel documents `bounds` in parent-local space and has no world-space
resolution on the canvas path (`interaction-conformance.md` finding #1, gap
#3; two conflicting hit-test implementations exist and are already on the
removal list). Writing a third world-space walk into the align command would
add a second coordinate-transform implementation to a subsystem that already
violates the one-implementation invariant. The command therefore requires
`parentId` to be equal across the selection and throws
`DOCUMENT_ALIGN_PARENTS_DIFFER`. This is a loud, documented divergence, not a
silent one.

**Deferred — single-shape align-to-parent** (Penpot `align-objects`; Figma
does not offer it). It is expressible in local space today, but it adds a
second semantic surface (align-to-parent vs align-to-rect) to a tranche that
already ships two commands; it lands with the alignment panel's parent-aware
mode. Trigger: a user request or the inspector alignment section.

### D2. Distribute: equal gaps, extremes pinned

**Adopted from Penpot `distribute-space`** (`align.cljc:83-121`), which
matches Figma's observable behaviour:

- Sort by the shapes' centre on the axis.
- Gap = (union size − Σ shape sizes) / (n − 1); place each shape at
  previous-start + size + gap, starting from the union edge.
- Requires ≥3 shapes (Penpot `can-distribute?`; two shapes have one gap and
  distribution is undefined).

The same-parent rule from D1 applies for the same reason. The command is
`distribute-nodes` with axis `"horizontal" | "vertical"` and an exact inverse
captured as per-node bound entries (`restore-node-bounds`, already in the
working tree for align).

### D3. Snap: kernel service finally has a caller

**Adopted and adapted from Penpot's snap stack.** Penpot splits snapping into
a closest-point service (accuracy `10/zoom` world units, queried against a
per-frame range-tree index of every shape's rotated points + centres) and a
dynamic-alignment service that snaps the moving selection's gap to an equal
gap already present among its neighbours (accuracy `20/zoom`). Four of its
properties transfer directly:

1. **The moving unit is the selection's union rect** (`shapes->rect` moved by
   the delta; `snap.cljs:277-282`), whose corners and centre are the queried
   points.
2. **Candidates are the sibling shapes' axis positions** (edges and centres —
   Crafty's nodes are axis-aligned rects in local space, so the full
   rotated-point model is deferred with transform editing; D5).
3. **Viewport filtering** (`worker/index.cljs:66-77`): a candidate whose point
   is outside the visible viewport never snaps. Penpot shipped this after
   issue #1971 ("it snaps to everything but what I want") — the #1 reported
   snap annoyance. Adopted as a `viewport` parameter to the kernel function,
   not a UI toggle.
4. **Selection exclusion** (`make-remove-snap`, `snap.cljs:29-58`): the moving
   shapes and their descendants are never candidates for themselves.

**Divergence — one service, not two.** Crafty's existing `snapAxis` +
`SNAP_FAMILY_PRIORITY` (pixel > guide > object > grid, `grid.ts:170-233`)
already implements the closest-point model per axis with a tested tolerance
(6 screen px, `SNAP_TOLERANCE_SCREEN_PX`; Penpot uses 10). The equal-distance
"dynamic alignment" service is deferred: it needs a range tree over candidate
gaps and its value is interactive-feedback (snap *lines*), not correctness.
**Deferred trigger:** the transform-handle model lands and a drag already
produces snap feedback; then add gap-equality snapping behind the same
`snapMove` seam.

**The seam.** New pure kernel function
`snapMoveSelection(document, pageId, nodeIds, deltaWorld, viewport, zoom) →
{ delta, snaps: SnapMatch[] }` where `SnapMatch = { family, axis, position,
distance, source }`. It computes the union rect of the moving nodes, requests
`snapAxis` per axis, and reports every match so the overlay can draw lines.
`previewMove` (`harness.ts:690`) calls it in the transaction; all
screen↔world conversion stays where it is (point of use). React is not on the
path. This preserves the invariant that no DOM handler reimplements snap
arithmetic.

### D4. Selection identifiers: kernel semantics

**Adopted: `selectedIds` stays the single ordered source of truth.**
`selection-and-hit-testing.md:61` already documents the ordered-set model and
per-page memory. This tranche adds the two consumers that order was reserved
for, without adding new selection state:

- `selectionUnionBounds(document, pageId, ids)` — pure kernel helper feeding
  align (via the command), distribute, the badge, and zoom-to-selection.
- **No key-node/anchor.** Penpot sorts by centre for distribute and aligns to
  the union rect — selection order is not load-bearing in either tool for
  these operations (Sketch's key-object align is the notable divergence, and
  none of the surveyed tools default to it). A key-node would be speculative
  state today. **Deferred trigger:** an align-to-key-node mode or
  order-dependent operation is actually requested.
- `hoveredId` gains a writer: the harness hit-tests idle pointer-moves and
  calls `setHovered(id?)`; hover is ephemeral, never serialized (I13), and
  clears on pointer-down, tool switch, page switch and canvas leave. The
  reducer stays pure — hover is a harness observation, not an interaction
  transition, because an idle pointer-move is not an interaction input.

### D5. Selection chrome: handle model and overlay extension

**Adopted from Penpot `selection.cljs`.** The handle set is enumerated, not
inferred:

- 8 resize handles: 4 corners + 4 edge midpoints, each with a `position`
  identity, a hit region of `10 / zoom` world units (Penpot
  `resize-point-circle-radius`), and an anchor (the opposite edge/corner).
  Corners are drawn as 4px-radius filled circles with a 1px accent stroke
  (Penpot `resize-point-radius`); edges as 8px-thick transparent strips
  (`resize-side-height`). Crafty v1 draws them as overlay quads — the host has
  no circle geometry and adding one is not worth a protocol change in this
  tranche; the visual is a small square corner marker instead of a circle
  (**divergence, cosmetic, recorded**).
- Minimum interactive rect `10 / zoom` (Penpot `min-selrect-width/height`):
  tiny shapes keep a grabbable selection rect.
- Handlers hidden during move and resize transactions (Penpot hides them when
  `transform-type` is move/rotate) — the badge too.
- **Rotation handle deferred** with rotation itself (needs the `transform`
  property command); no dead control is drawn.

**Resize is anchored bounds editing, not a hot zone.** New pure kernel helper
`resizeRect(start: Rect, handle, dx, dy, minSize) → Rect` in the coordinates
module (one implementation, tested): for each handle the opposite edge/corner
stays fixed; both axes handled; `minSize` floor enforced. The harness routes
corner/edge drags to it inside the existing move transaction, deleting
`armResize`'s 16px hot zone (`harness.ts:678-688`). Resize stays a `set-bounds`
preview; rotation and transform-space resize are out of scope.

**Badge: adopted from Penpot issue #10258.** `{w} x {h}` at two decimals,
fixed screen size (it does not scale with zoom), centred on the union box
midpoint, 8 screen px below it, hidden during transforms and when nothing is
selected. The component/instance colour variant (Figma-style black badge,
Penpot's `--assets-component-hightlight`) is deferred until instances render.

**Overlay protocol.** `DrawOverlayPacket` (`draw-protocol.ts:65`) gains two
additive blocks, both renderer-state:

```
selection?: {
  outlines: { bounds: Bounds }[]              // one per selected node
  bbox: Bounds                                // union box
  handles: { position: HandlePosition; x: number; y: number }[]   // 8
  hover?: Bounds                              // hovered node outline
  badge?: { text: string; x: number; y: number }   // screen-fixed size
}
snapLines?: { axis: "x" | "y"; position: number; from: number; to: number; label?: string }[]
```

The host draws them from the packet (no kernel import — the boundary in
`draw-protocol.ts:28-34` is preserved). `selectionBounds` on `RenderFrame`
stays for compatibility until the host consumes the packet block.

### D6. Keyboard layer: what the conformance audit named

**Fixes the confirmed defect at `keyboard-bindings.tsx:66`** (zoom keys
suppressed with no handler):

- **Nudge**: ArrowLeft/Right/Up/Down move the selection 1 world unit
  (Shift: 10) via one `move-nodes` dispatch per keypress — one undo entry per
  keypress; the OS key-repeat produces one entry per repeat, matching Figma
  and Penpot. No camera change.
- **Tab / Shift+Tab**: selection moves to the next/previous sibling of the
  first selected node, wrapping (Penpot shortcuts). Sibling order is
  document `childIds` order (bottom-to-top for the layers panel; Tab order is
  top-to-bottom like Penpot's layer list — **divergence recorded**: Penpot's
  Tab moves "next layer (sibling)" in the panel's bottom-to-top reading;
  Crafty uses ascending `childIds`, the visual top-most first, and the
  keyboard spec states it explicitly).
- **Zoom**: Cmd/Ctrl+1 fit page to viewport, Cmd/Ctrl+2 fit selection,
  Cmd/Ctrl+0 100%, Cmd/Ctrl+/− zoom step. All are camera operations on
  ephemeral viewport state (`kernel.setViewport` / harness zoomAt) — never
  history entries (the invariant in `kernel.ts:178-181`).

The bindings remain in one place (`keyboard-bindings.tsx`) and dispatch
kernel commands or harness methods only; no tool behaviour leaks into
handlers (`input-and-tools.md`).

## Alternatives Considered

| Alternative | Why it lost |
|---|---|
| Key-node/anchor alignment (Sketch) | No surveyed tool defaults to it; adds selection state with no consumer. D4 |
| World-space align across parents now | Requires a third transform implementation before the authored/resolved split (gap #3) exists; the same-parent rule is loud and removable. D1 |
| Harness-side snap (call `snapAxis` from `previewMove` directly) | Puts coordinate and snap arithmetic back in the DOM layer, violating the kernel-owns-coordinates rule; the pure kernel seam keeps it testable headless. D3 |
| Circle geometry for corner handles | A new `DrawGeometry` member is a protocol bump for a cosmetic; quads suffice. D5 |
| Distribute by equal centres | Figma and Penpot both equalize gaps (space-between), not centres; equal-centres gives visibly uneven spacing for mixed sizes. D2 |
| One dispatch per held arrow key (repeat timer) | OS key repeat is already correct granularity for undo; a timer would coalesce into one entry per press-hold and fight the platform. D6 |

## Deferred Items and Their Triggers

- Dynamic-alignment gap-equality snapping (Penpot `calculate-snap`) — trigger:
  snap feedback (lines/pills) ships and the handle model lands.
- Cross-parent align/distribute — trigger: the authored/resolved split
  (conformance gap #3) provides one authoritative world-space transform.
- Rotation handles and rotate gesture — trigger: `transform` joins
  `set-property`'s property union.
- Single-shape align-to-parent — trigger: alignment panel parent-aware mode.
- Badge colour variants — trigger: instance resolution renders.
- Key-node align — trigger: a requested order-dependent operation.

None of these needs a measurement to justify being deferred; each is gated on
a substrate decision that this tranche does not move.
