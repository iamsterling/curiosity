# Coordinate Systems

Status: **Current** for editor/runtime ownership. **Transitional** for
renderer-package compatibility wrappers.

## Spaces

| Space | Definition | Produced by |
|---|---|---|
| **Screen** | Browser client coordinates (`event.clientX/Y`) | DOM pointer events |
| **Canvas-local** | Screen minus the canvas element's bounding-rect origin | `pointAt` / `canvasPoint` (`canvas-stage.tsx:170`) |
| **World** | Infinite-canvas coordinates | `screenToWorld` |
| **Parent-local** | Relative to a node's parent | hierarchy traversal |
| **Node-local** | Before the node's own `transform`, relative to `bounds` origin | `inverseTransformPoint` |
| **Device-pixel** | Canvas-local × `devicePixelRatio` | renderer host |

Note the naming: the reducer and harness call the second row *screen* space
(`interaction.ts` `PointerInput.point` is canvas-local). There is no separate
"chrome inset" space in the code — the canvas bounding rect absorbs chrome
(toolbar, sidebars, status bar).

## The viewport transform

```
screen = world × zoom + pan
world  = (screen − pan) / zoom
```

`Viewport = { panX, panY, zoom, devicePixelRatio }`. Pan is stored in **screen**
units, which is why `pan` effects add raw pointer deltas and `move` effects
divide by zoom (`harness.ts:592`).

### Zoom about a cursor

The only correct formulation, and both implementations agree on it:

1. Convert the anchor to world space **at the current zoom**.
2. Change zoom.
3. Recompute pan so the anchor's world point maps back to the same screen point.

```ts
zoom = clamp(zoom × factor, ZOOM_MIN, ZOOM_MAX)
pan  = anchor − worldAnchor × zoom
```

Never scale pan directly. Never zoom about the canvas origin when the user's
cursor is elsewhere.

## Shared clamps

Declared once, in `packages/editor/src/kernel/coordinates.ts:13`:

```ts
ZOOM_MIN = 0.05
ZOOM_MAX = 256
WORLD_LIMIT = 1e6
SNAP_TOLERANCE_SCREEN_PX = 12
```

`packages/scene-renderer` re-exports them rather than redeclaring
(`scene-renderer/src/index.ts:1`, `:9`), and the document validator enforces them
on `PageCanvas.rest` (`document.ts:200`). **Never re-declare a clamp.** If you
need a different range, change the constant and let every consumer inherit it.

## Node transform composition

A node's world transform is:

```
world = parentWorld × translate(bounds.x, bounds.y) × node.transform
```

Implemented identically in three places, which must stay in agreement:

- `documentHitTest` — `packages/editor/src/kernel/interaction.ts:91`
- `createSceneSpatialIndex` — `packages/scene-model/src/spatial-index.ts:37`
  (note: uses `multiplyTransforms(parent, layer.transform)` and keeps `bounds`
  separate via `localBounds`, an equivalent decomposition)
- The Rust encoder — `packages/scene-renderer/rust/src/lib.rs` `multiply`

Point-in-node testing inverts the composed transform and compares against
`bounds` in node-local space, so rotated and skewed nodes hit-test correctly
(`inverseTransformPoint`, guarded by a `1e-9` determinant epsilon for degenerate
matrices).

`transformRect` / `transformBounds` compute the **axis-aligned bounding box** of
the four transformed corners. That is a conservative bound, correct for
broad-phase queries and wrong for tight selection outlines of rotated nodes — a
known limitation, not a bug.

## Renderer compatibility wrappers

`screenToWorld`, `worldToScreen` and `zoomAt` still exist twice in source, but
the editor runtime now imports the kernel versions directly. The
`scene-renderer` copies remain compatibility wrappers for renderer-package API
consumers until the package graph is cleaned up.

| | `editor/src/kernel/coordinates.ts` | `scene-renderer/src/index.ts` |
|---|---|---|
| `screenToWorld` | line 41 | line 50 |
| `worldToScreen` | line 40 | line 49 |
| `zoomAt` | line 43, returns `clampViewport(...)` — clamps zoom **and** pan to `WORLD_LIMIT` | line 52, clamps zoom and pan inline |
| `Viewport` type | includes `devicePixelRatio` | does not |

The editor harness and canvas stage import the **kernel** coordinate helpers.
Every world/screen conversion in the browser — paste positioning, hit testing,
resize arming, marquee bounds, rectangle commit, overlay placement — now goes
through `packages/editor/src/kernel/coordinates.ts`. The renderer package keeps
its exported helpers for compatibility and for renderer-local utilities such as
`hitTestScene`.

Why this is a real problem and not cosmetic:

- Two `Viewport` types with different fields means `devicePixelRatio` is threaded
  separately and can drift.
- Two clamp paths means a future change to pan clamping can silently apply to one
  and not the other.
- The dependency direction is backwards: the renderer package is a *consumer* of
  editor semantics, so editor math living there inverts the layering.

### Current boundary

`packages/editor/src/kernel/coordinates.ts` is the authoritative implementation
for editor/runtime coordinate conversion. `scene-renderer` still carries
matching wrappers because `@crafty/editor` already depends on
`@crafty/scene-renderer`; making the renderer import the kernel directly would
create a package cycle.

## Rules

- **The fresh camera centres the world origin.** A camera that has never been
  positioned — first load, or a page whose restored camera is the default rest
  (0,0,1) — renders world (0,0) at the centre of the viewport
  (`CanvasEditor.centerOrigin`, driven by the canvas stage's measured size). It
  re-centres on resize until the first pan, zoom or pinch hands the camera to
  the user; after that it is never moved for you.
- **Undo and redo restore the document, never the camera.** The live viewport
  is ephemeral editor state, not a history subject: `undo`/`redo` on the page
  you are already on keep the camera exactly where it is, and
  `set-page-viewport` is bookkeeping that never creates a history entry. Only a
  real page change restores that page's session or rest camera.
- **A settled camera persists.** Every gesture end that moved the camera —
  pan/zoom gesture up, wheel/pinch zoom, trackpad scroll-pan, preset zoom, the
  close of a pen session that spanned navigation — writes the live viewport
  into the page's authored rest camera (`CanvasEditor.persistRestCamera`,
  guarded on the interaction being idle and no open transaction), so a reload
  restores the zoom and coordinate focus. The write is a document change (it
  must reach disk), but never a history entry.
- **All conversion goes through the shared helpers.** Event handlers must not
  reimplement pan or zoom arithmetic. `canvas-stage.tsx` does raw arithmetic in
  exactly one place — accumulating wheel deltas before handing them to
  `scrollPan`/`handleWheel` — which is input normalisation, not coordinate
  conversion, and is acceptable.
- **Store one camera.** The live camera is ephemeral editor state; the *rest*
  camera is authored per page (`PageCanvas.rest`). Do not add a third. (The
  harness's duplicate viewport was consolidated into `EditorState.viewport` —
  the kernel owns the live camera; `PageCanvas.rest` remains authored.)
- **Never mix viewport state into document geometry.** A node's `bounds` are in
  parent-local world units and must never be adjusted for zoom. When a screen-px
  quantity is needed in world space (hit tolerance, handle size, outline
  thickness), divide by zoom at the point of use — as the reducer's
  `cornerHit` does with `16 / zoom` and the renderer does with `3 / viewport.zoom`.
- **Device pixels stop at the renderer.** `devicePixelRatio` enters at
  `wasm-bridge.ts:127` and is used for the render target only. Nothing in the
  document or the interaction model is expressed in device pixels.
- **Precision.** World coordinates are `f64` in Rust and `number` in TypeScript,
  clamped to ±1e6. That is roughly 1e-10 relative precision at the limit —
  ample. If the world limit is ever raised, revisit whether the renderer's `f32`
  vertex path needs a camera-relative rebase.
