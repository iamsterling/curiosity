# Canvas Actions Parity — Tranche 1

## Why

`docs/architecture/interaction-conformance.md` measured the industry-standard
canvas surface at ~300 distinct actions and ranked the substrate gaps that gate
them. Its two cheapest findings are both blocked on this change:

- **Finding #3 — capability stranded one layer short of the user.** The snap
  service is fully implemented and tested (`grid.ts:218` `snapAxis`,
  `grid.test.ts:141`) and has **no caller** (gap #10). `reorder` has a kernel
  command and no affordance; zoom shortcuts are `preventDefault`ed with no
  handler — "currently *worse* than unimplemented, since the browser fallback
  is suppressed too" (gap #12, `keyboard-bindings.tsx:66`). These rows need
  wiring, not design.
- **Gap #15 — no multi-node geometry command.** All bounds edits are
  `set-bounds` on one node (`commands.ts`); align, distribute, and nudge are
  selection-wide operators that cannot be expressed. Alignment is absent
  (headline table, row "Creation / hierarchy / clipboard / alignment").

Two more gaps in the same tranche, because they are the same blast radius:

- **Gap #9 — no transform-handle model.** Resize is a hardcoded 16px
  bottom-right hot zone (`harness.ts:686`) routed through `move`. There is no
  handle enumeration, no anchor, no per-handle hit region.
- **Selection identifiers.** `EditorState.hoveredId` is declared
  (`kernel.ts:12`) and nothing writes it; the renderer draws a single outline
  for one id (`webgpu-renderer.ts:47` `appendOutline`, consumed at `:65-66`),
  and `selection-and-hit-testing.md:125-133` lists what is missing:
  multi-selection outlines, a union bounding box, resize handles, hover
  highlight, and any selection badge. The kernel's `selectedIds` ordered set
  is the seed (`kernel.ts:137`) but nothing consumes order or union bounds.

Each item below is either a confirmed defect (cited), a suspected gap, or an
improvement built on prior art. Everything in this tranche is **kernel-first
and testable without a browser** — the harness (`harness.test.ts`) and the
existing pure-kernel test style are preserved.

## What Changes

**Kernel — commands (spec: `align-and-distribute`)**

- `align-nodes` (in flight, uncommitted: `commands.ts` working tree) is
  finished, tested, and kept at its documented scope: ≥2 same-parent nodes
  aligned to the selection's union bounds, exact inverse, validated through
  `assertValid`, one undo entry. `DOCUMENT_ALIGN_REQUIRES_TWO`,
  `DOCUMENT_ALIGN_PARENTS_DIFFER`, `DOCUMENT_NODE_MISSING:<id>` remain the
  loud diagnostics.
- `distribute-nodes` (new): same-parent, ≥3 nodes, equal gaps on an axis with
  the extremes pinned to the union bounds — the Penpot `distribute-space`
  algorithm, not invented. Exact inverse, validated, one undo entry.
- `move-nodes` (new): moves any set of nodes by a delta in parent-local
  coordinates; exact inverse is the negated delta. This is the multi-node
  geometry command gap #15 names, used by nudge and the existing drag path can
  adopt it; it must not silently drop locked or hidden nodes — see the spec.

**Kernel — snap wiring (spec: `snap-move`)**

- A pure kernel function (`snapMove`/`snapMoveSelection`) that turns a
  requested move delta + document + page canvas + viewport into a snapped
  delta **and the matched snap facts** (family, axis, position, distance) so
  the overlay can draw snap lines and distance pills. It reuses the existing
  tested `snapAxis` and `SNAP_FAMILY_PRIORITY` (`grid.ts:170-233`) and the
  per-page `SnapSettings`.
- Candidate model, adapted from Penpot's worker snap index
  (`worker/index.cljs`, `worker/snap.cljs`): axis positions of sibling shapes'
  edges and centers, the page's grid and guides, and the device pixel grid;
  **selection members excluded**; **viewport-filtered** (a shape off-screen
  never snaps — Penpot issue #1971's fix, `worker/index.cljs:66-77`);
  tolerance stays the tested 6 screen px constant
  (`SNAP_TOLERANCE_SCREEN_PX`, `grid.ts`).
- The harness move path (`previewMove`, `harness.ts:690`) calls the kernel
  function; all arithmetic stays in the kernel. React is not on the path.

**Kernel + harness — selection identifiers (spec: `selection-identifiers`)**

- `selectionUnionBounds` (pure kernel helper): union of the selected nodes'
  bounds — consumed by align, distribute, the badge, and zoom-to-selection.
- `hoveredId` lifecycle: harness pointer-move (no buttons, idle interaction)
  hit-tests and writes `setHovered`; hover clears on pointer-down, tool
  switch, page switch, and canvas leave.
- Keyboard layer (fixes `keyboard-bindings.tsx:66`): arrow keys nudge the
  selection 1 world unit (Shift ×10) via one `move-nodes` dispatch per
  keypress — one undo entry per keypress, OS repeat for hold; Tab /
  Shift+Tab move selection to the previous/next sibling (wrapping); Cmd+1
  zoom-to-fit, Cmd+2 zoom-to-selection, Cmd+0 100% — all camera operations,
  ephemeral, never history.

**Renderer — selection chrome (spec: `selection-overlay`)**

- `DrawOverlayPacket` (protocol v2, additive) gains a selection block:
  per-node outlines, union bounding box, eight resize handles, hover outline,
  and the size badge; plus a snap-lines block (axis lines + distance pills).
  All renderer state composed after the authored packet — never authored
  geometry (I31).
- The host (`webgpu-renderer.ts`) draws the new overlay structures from the
  packet; the harness enumerates handle geometry and hit regions in screen px
  (`10 / zoom` world tolerance, Penpot's `resize-point-circle-radius`), and
  routes corner/edge drags to a real anchored resize (new pure kernel helper
  `resizeRect`), replacing the 16px bottom-right hot zone.
- The badge follows Penpot 2.17.0 (issue #10258): `{w} x {h}` at two decimal
  places, fixed screen size, centred 8 world-visible px below the union box,
  hidden during transforms.

## Out of Scope

Explicitly not in this change, so it is not smuggled in later:

- Rotation and flip (needs the `transform` property command — `set-property`
  excludes it; separate change).
- Cross-parent align/distribute and world-space resolution (gap #3 — the
  authored/resolved split; the same-parent rule stays and is documented).
- Single-shape align-to-parent (Penpot supports it; Figma does not; deferred).
- Isolation / double-click deep select (gap #11).
- Smart selection handles and the contain-modifier marquee (Figma).
- Snap-settings and guide/grid UI (the settings exist in the schema; toggles
  come with the settings panel).
- Rotation handle UI, selection badge variants (component vs plain).

## Evidence and Verification

- Kernel: new `commands.test.ts`/`grid.test.ts`/`selection.test.ts` coverage;
  every command has undo/redo round-trip tests and a validated result.
- Interaction: `harness.test.ts` drives snap-move and resize through the
  editor with no React and no DOM, per `docs/architecture/testing.md`.
- Renderer: overlay packet schema tests plus host rendering tests in
  `scene-renderer-wasm`; pixel parity where the host consumes the packet.
- Mechanical: `npm run typecheck && npm run test && npm run lint &&
  npm run format:check`.
