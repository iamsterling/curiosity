## 1. Align and distribute commands

- [x] 1.1 Finish the in-flight `align-nodes` (uncommitted working tree): confirm tests cover every axis, `DOCUMENT_ALIGN_REQUIRES_TWO`, `DOCUMENT_ALIGN_PARENTS_DIFFER`, no-op `changed: false`, and exact inverse through `restore-node-bounds`
- [x] 1.2 Add `distribute-nodes` (`axis: "horizontal" | "vertical"`) to `DocumentCommand`: same-parent and existence checks, `DOCUMENT_DISTRIBUTE_REQUIRES_THREE`, Penpot `distribute-space` algorithm (sort by centre, equal gaps, extremes pinned to the union)
- [x] 1.3 Add `move-nodes` (`nodeIds` + finite `delta`) to `DocumentCommand` with the negated-delta inverse; add it to the kernel's dispatch preconditions
- [x] 1.4 Add undo/redo round-trip tests for all three commands in the surrounding `commands.test.ts` style, including: distribute sorts by centre not selection order; move-nodes inverse restores exact bounds; non-finite delta rejected
- [ ] 1.5 Wire `editor.alignSelection` (harness) to also offer distribute; keep `alignSelection` name or rename to a shared surface — choose once, update `align-panel.tsx`

## 2. Snap service caller

- [ ] 2.1 Add pure `snapMoveSelection(document, pageId, nodeIds, delta, viewport, zoom)` to the kernel (new `snap-move.ts` module in `editor-kernel`): computes the union rect of the moving nodes, builds per-axis candidate positions (sibling edges/centres, page grid, page guides + magnet positions, device pixel), and returns `{ delta, snaps }` via the existing `snapAxis`/`SNAP_FAMILY_PRIORITY`
- [ ] 2.2 Enforce the Penpot candidate rules: moving nodes and their descendants excluded; invisible siblings excluded; candidates outside the visible viewport excluded (guides and grid exempt)
- [ ] 2.3 Add `grid.test.ts`-style tests: self-exclusion, viewport exclusion, hidden exclusion, family priority per axis, perpendicular axis untouched, empty snaps on no candidate, deterministic output
- [ ] 2.4 In `previewMove` (`harness.ts:690`), route the drag delta through `snapMoveSelection` before building previews; keep all screen↔world conversion at the point of use
- [ ] 2.5 Surface the snap facts to the overlay so lines/pills can be drawn (store in harness editor state, cleared on commit/cancel/rollback)
- [ ] 2.6 Add harness-level tests: a drag near a sibling edge previews snapped positions; a cancelled drag leaves the document unchanged and no snap artefacts

## 3. Selection identifiers

- [x] 3.1 Add pure `selectionUnionBounds(document, pageId, ids)` to the kernel with tests (multi-selection union, missing ids skipped, empty → `undefined`)
- [x] 3.2 Add `setHovered(id?)` to `EditorKernel` (filter against live nodes) and clear hover on page switch, selection change, pointer-down, tool switch; assert never serialized
- [x] 3.3 Wire idle pointer-move hit-testing in the harness (`handlePointerMove` when no buttons and interaction idle) → `setHovered`; clear on canvas leave
- [x] 3.4 Keyboard layer: arrow nudge via one `move-nodes` dispatch per keypress (1 unit, Shift 10), ignored in text entry and with empty selection; each keypress one undo entry (OS repeat)
- [ ] 3.5 Keyboard layer: Tab / Shift+Tab sibling traversal in ascending `childIds` order, wrapping; empty selection → top-most / bottom-most sibling
- [ ] 3.6 Keyboard layer: Cmd/Ctrl+1 fit page, Cmd/Ctrl+2 fit selection union, Cmd/Ctrl+0 100%, Cmd/Ctrl+/− zoom step — all camera-only, never history; replaces the swallow at `keyboard-bindings.tsx:66`
- [ ] 3.7 Add reducer/harness tests: nudge is one undo entry per keypress; Tab wraps and never selects a page root; zoom-to commands create no history entry

## 4. Selection chrome overlay

- [ ] 4.1 Extend `DrawOverlayPacket` (`draw-protocol.ts:65`) with the `selection` block (outlines, bbox, 8 named handles, hover, badge) and `snapLines` block; bump nothing — protocol v2 is additive; add schema tests in `draw-protocol.test.ts`
- [x] 4.2 Add pure `resizeRect(start, handle, dx, dy, minSize)` to the kernel coordinates module with anchor tests for all 8 handles and the minimum-size floor
- [ ] 4.3 Enumerate handles in the harness from the selection union (`10 / zoom` hit tolerance), replacing `armResize`'s 16px hot zone (`harness.ts:678-688`); corner/edge drags preview anchored resizes through `set-bounds`
- [ ] 4.4 Host (`webgpu-renderer.ts`): draw outlines, bbox, handle markers, hover outline and badge from the packet's selection block — 1px screen thickness, fixed screen badge size, hidden during transforms; extend the host tests
- [ ] 4.5 Host: draw snap lines and distance pills from the packet's `snapLines` block (family colour, distance pill at the segment midpoint); extend host tests
- [ ] 4.6 Build the overlay packet in the harness (`overlay.ts`) from kernel state: selection block from `selectedIds` + `selectionUnionBounds`, hover from `hoveredId`, snap lines from the snap facts; remove the single-`selectionBounds` path or keep it only as the host fallback

## 5. Panels and docs

- [ ] 5.1 Extend `align-panel.tsx` with distribute (horizontal/vertical) and correct enablement rules (≥2 align, ≥3 distribute); add a `button-group`-style control if needed, following the ui primitive model
- [ ] 5.2 Update `docs/architecture/interaction-conformance.md`: move the rows this change unlocks to `kernel-tested`/`canvas-enabled` with `path:line` evidence (align, distribute, snap-move, nudge, tab traversal, zoom shortcuts, resize handles, hover, badge)
- [ ] 5.3 Update `docs/architecture/selection-and-hit-testing.md`: handle model, hover lifecycle, union-bounds query, the resolved same-parent align rule
- [ ] 5.4 Record the research in `docs/architecture/research-ledger.md`: Penpot `align.cljc`, `snap.cljs`, `worker/snap.cljs`, `worker/index.cljs`, `selection.cljs`, issue #10258, issue #1971 — source, lesson, Crafty conclusion (adapted/diverged), with this change cited

## 6. Mechanical verification

- [ ] 6.1 `npm run typecheck && npm run test && npm run lint && npm run format:check`
- [ ] 6.2 `npm run build` (host and packet changes cross the wasm/webgpu boundary)
- [ ] 6.3 Confirm no existing fixture or test was weakened; confirm the uncommitted align working tree is fully covered here before this change closes
