# Selection and Hit Testing

Status: **Current** for broad-phase indexing and single/multi selection state.
**Violated** for the one-implementation rule. **Target** for nested selection,
component boundaries and handles.

## Two implementations, both still live

| | `documentHitTest` | `createSceneSpatialIndex` |
|---|---|---|
| Path | `packages/editor/src/kernel/interaction.ts:84` | `packages/scene-model/src/spatial-index.ts:43` |
| Input | `EditorDocument` | projected legacy `Scene` |
| Structure | recursive walk, no index | 256×256 world-unit cell buckets |
| Respects `visible` | yes | yes (inherited down the tree) |
| Respects `locked` | **yes** | **no** — `Layer` has no `locked` field |
| Transform-aware | yes | yes |
| Precision | inverse-transform then node-local bounds test | AABB reject, then inverse-transform, then local bounds test |
| Ordering | deepest hit wins (`hits.at(-1)`) | sorted by `zIndex` desc, then insertion `order` desc |
| **Used in production** | **yes** — pointer selection, paste target resolution, and context-menu selection | **yes** — hover highlight and marquee scope container |

This is the second instance of the same structural problem as
[`coordinate-systems.md`](coordinate-systems.md): the kernel has the better
implementation, and parts of the app still use the one built for the
transitional format. Context-menu selection now goes through the kernel path, so
locked and hidden nodes no longer leak through that entry point; the remaining
split is hover and marquee scoping.

**Target:** the kernel owns hit testing over `EditorDocument`, backed by a
spatial index it maintains; the legacy scene index is retired with `Scene`.

## Broad phase

`createSceneSpatialIndex` buckets every layer's world AABB into 256-unit cells,
then queries the single cell containing the point (`spatial-index.ts:62`). Within
a cell, candidates are filtered by visibility, AABB containment, invertibility,
and node-local containment, then sorted.

Properties worth keeping:

- **Rebuild, not mutate.** The index is rebuilt whenever the scene projection
  changes (`harness.ts:651`), keyed on
  `documentRevision:storyId:frameId:revision`. Derived data is disposable — it is
  never a source of truth, so a stale index is a correctness bug that the cache
  key prevents rather than a data-loss bug.
- **Broad phase then narrow phase.** AABB rejection before the inverse transform.
  Correct shape for adding real geometry later.

Known limitations:

- Rebuild is O(n) per document change. During a drag, that is a full index
  rebuild per pointer-move. Fine at current scale; the first thing to measure
  when large-document work starts.
- Only the cell containing the point is consulted. Correct, because every entry
  is inserted into *every* cell its AABB overlaps.
- No frustum/viewport culling anywhere in the pipeline. The Rust encoder emits
  every visible node in the frame regardless of the viewport.

## Selection state

Held on `EditorState.selectedIds: DocumentId[]` — an **ordered set**, deduplicated
on write (`kernel.ts:132`). Ordering matters for future operations like "align to
first selected".

- `setSelection(ids)` replaces; `toggleSelection(ids)` XORs (used for
  shift-click and additive marquee).
- Selection is filtered against the live node map on every mutation
  (`kernel.ts:101`) — deleted nodes cannot stay selected (I19).
- Selection is remembered **per page** and restored on page switch
  (`pageSelections`, `kernel.ts:75`).
- History entries carry `selectionBefore` and `selectionAfter`, so undo restores
  the selection you had (`kernel.ts:114`).

### Marquee

`commit-marquee` in the reducer; geometry computed in the harness
(`commitMarquee`, `harness.ts:617`). Current behaviour: flattens all layers of
the active frame, computes world AABBs, and selects every layer whose AABB
*intersects* the marquee.

Two known deviations from professional tools:

- **Intersect, not contain.** Figma and Sketch select nodes that *intersect* the
  marquee by default; this matches. But there is no modifier to switch to
  strict containment, and no distinction between crossing and window selection.
- **All depths.** Every descendant at every depth is eligible, so marqueeing a
  frame selects the frame *and* its children. In a structured editor the marquee
  should select the outermost selectable node within the current isolation
  context.

Both are consequences of the missing isolation model below.

## What is missing

### Isolation / deep select

`EditorState.isolationRootId` is declared and nothing sets it. This one field is
the key to several behaviours a professional editor needs:

- **Default selection targets the outermost selectable ancestor** within the
  isolation context — click a button instance, select the instance, not its inner
  label.
- **Double-click descends** one level, setting a new isolation root.
- **Cmd/Ctrl-click deep-selects** the leaf directly.
- **Escape ascends** one level.
- **Component boundaries are hard walls.** Clicking inside an instance selects
  the instance. Descending into one is an explicit act, and what you can then
  select is constrained to overridable properties, not arbitrary sub-nodes.
- **Locked and hidden ancestors** disqualify a whole subtree.

**Target model:**

```
resolveSelection(document, isolationRootId, hitNodeId) → DocumentId | undefined
  walk from hitNodeId up to isolationRootId
  reject if any ancestor is locked or hidden
  return the highest ancestor that is a direct child of the isolation context,
    unless a component-instance boundary is crossed first, in which case
    return the instance root
```

This belongs in the kernel, is pure, and is straightforward to test without a
browser.

### Selection overlays

Today the renderer draws a single outline for one id
(`SceneRenderer.render(..., selectedLayerId, ...)`), rendered as four thin
rectangles at `3 / zoom` world thickness (`webgpu-renderer.ts:appendOutline`).

Missing: multi-selection outlines, a selection bounding box across the set,
resize handles, rotation handle, distance/measurement guides, hover highlight,
and any indication of locked or component-instance status.

Overlays are correctly modelled as **renderer state, not authored geometry**
(I31) and should stay that way — a handle is not a node. The overlay packet
(`DrawOverlayPacket`) is the right extension point: it already carries grid,
guides with its own structural types that do not import the kernel.

### Handles

There is no handle model. See [`input-and-tools.md`](input-and-tools.md) — resize
is inferred from a 16px corner proximity test and routed through the `move`
effect. Handles need to be modelled explicitly (identity, hit region in screen
px, cursor, modifier behaviour) before resize, rotation, or path editing can be
correct.

## Rules

- **Hit testing is a kernel concern.** It reads the authored document and the
  isolation context. It must not read renderer or React state.
- **Screen-space tolerances convert at the point of use.** A handle is ~8 screen
  px regardless of zoom; divide by zoom to get world tolerance. Never bake a
  zoom-dependent constant into the document.
- **Derived indexes are rebuildable and never authoritative.** If an index and
  the document disagree, the document wins and the index is rebuilt.
- **Selection is not the same as focus.** `focusedId` (for text/path editing) is
  a separate field for a reason; do not conflate them.
