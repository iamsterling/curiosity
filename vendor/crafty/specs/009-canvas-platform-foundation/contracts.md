# Contracts: Canvas Platform Foundation

All contracts extend the existing renderer contract (`docs/editor/renderer-contract.md`), failure policy (`docs/editor/renderer-failure-policy.md`), invariants (`docs/editor/invariants.md`), and coordinate spaces (`docs/editor/coordinate-spaces.md`). Versions are additive; unknown versions are rejected, never coerced (D4).

## Coordinate and World Contract

- World/page/node coordinates are f64 in the kernel; f32 conversion occurs only at the render-packet boundary (D1).
- `screen = world * zoom + pan` remains the only viewport mapping; zoom-around-cursor preserves the world anchor.
- One documented zoom clamp range across kernel and renderer (D2). World pan limit `±WORLD_LIMIT` enforced at the viewport boundary.
- Zoom-anchor invariance property: `screenToWorld(anchor, zoomAt(v, anchor, f)) == anchor` for f ∈ [0.25, 4], across anchors and zooms.

## Page and Viewport Contract

- A page owns a durable rest-camera (`ViewportRest`: pan, zoom) and its selection; the gesture camera is ephemeral and never serialized.
- `set-page-viewport` is rejected mid-gesture; transient camera writes never persist.
- Page switch restores camera and selection; undo entries carry `pageId` and restore page context.
- Page root is an unbounded content root for interaction; its legacy `bounds` is retained for export only.

## Grid, Ruler, Guide, and Snap Contract

- Grid rendering is an editor overlay, never authored node geometry (D3); grid settings may be page-authored but must not be required for rendering.
- Adaptive grid LOD: major/minor spacing keeps tick spacing within [6, 32] screen px at every zoom level; level transitions use hysteresis (enter 6 px, leave 8 px) and must not oscillate on ±1% zoom changes.
- Pixel grid appears at high zoom only (≥ 400% reference); density bounds are property-tested.
- Snap is decoupled from grid visibility: hiding the grid leaves snap behavior unchanged.
- Snap priority: pixel > guide > object > grid, nearest-within-tolerance.
- Rulers tick math follows power-of-10 label boundaries; sub-pixel labels only at high zoom.
- Guides are authored records (add/move/remove with undo/redo); magnet guides during gestures are ephemeral overlays. Guides never export.

## Render Packet Contract (protocol v2)

- Protocol v2 is additive over v1: `protocolVersion`, `documentRevision`, `packetRevision`, `frameId`, `viewport`, `commands` (full) or `changedNodeIds` + partial commands (batch), optional `selectionBounds`, optional `overlay` packet (grid/rulers/guides), optional `dirtyRegion`.
- The Rust encoder owns deterministic packet encoding: same input → same packet bytes; full re-encode remains the correctness fallback for any batch.
- Every consumer validates `protocolVersion` and fails closed; stale `(documentRevision, requestSequence)` results are discarded (D8).
- Evidence exposes `protocolVersion`, `packetRevision`, `documentRevision`, `commandCount`, and cache/revision stats.

## Retained Host Contract

- GPU resources are keyed by material/layout keys; capacity-cached buffers grow with ×2 doubling and never allocate unbounded resources per frame.
- Compatible commands batch into one upload and render pass where ordering permits (`ordered-submission-batches` semantics).
- Overlay state (selection, preview, marquee, grid) cannot mutate authored packets; overlays compose at the host boundary.
- Deterministic pixel-reference parity (existing SHA-256 methodology) must remain green for current vs retained host; position delta 0, color delta 0 except pinned documented cases.

## Diagnostics Contract (unchanged, extended)

- Structured code + stage + severity + recovery + preservation guarantee (D12).
- New codes may be added for batch encode, stale revision, and grid overlay; messages never include document contents, packet bytes, shader source, adapter internals, or arbitrary thrown values.
- Device loss: diagnostics emitted, device + resources rebuilt, retained packet resubmitted, authored document untouched, degraded state visible until verified (recovery < 5 s target).

## Quality Gates

All gates record `(fixture, hardware, browser, build)` per existing convention and are scripted checks, not claims:

| Gate | Threshold |
|---|---|
| Input latency | pointer-down → first preview effect p95 ≤ 50 ms on 10k-rect fixture; long main-thread tasks < 50 ms |
| Frame time | 10k fixture p95 ≤ 16 ms; 100k fixture p95 ≤ 33 ms (reference hardware, recorded) |
| Memory | 0 unbounded allocs/frame (counter assertion); capacity-cache growth ×2 bounded; heap growth ≤ 5% over 5-min soak |
| Deterministic snapshots | canonical document bytes identical across sessions; render packet byte-identical for same input; snapshot sha256 stable |
| Browser/GPU parity | command count, geometry bounds, draw ordering, pixel hash identical within documented tolerance across supported classes |
| Device loss | recovery < 5 s; `authored-state-and-last-valid-packet` guaranteed |
| Security | fail-closed boundary tests (protocol version, non-finite, node counts, malformed colors, body caps); no unsupported backend presented |
| Migration | Scene→document round-trip byte parity; adapter removal leaves import path green; reload after crash restores last valid |

## Test Matrix (first foundation slices)

| # | Invariant | Test | Layer |
|---|---|---|---|
| 1 | Zoom anchor invariance | property across f, anchors, zooms | kernel unit |
| 2 | Rest camera rule | `set-page-viewport` rejected mid-gesture; transient camera never serialized | kernel unit |
| 3 | Page switch restores camera + selection | kernel state assertion across `set-page` | kernel unit |
| 4 | Undo across pages | gesture on page B undone from page A switches to B | kernel unit |
| 5 | v1→v2 migration round-trip | legacy Scene → adapter → v1 → migrate → v2 → canonical stable | kernel unit + snapshot |
| 6 | Grid LOD density | tick spacing ∈ [6, 32] px across zoom sweep 0.05..64, steps 1..1000 | kernel unit (property) |
| 7 | LOD hysteresis | no oscillation on alternating ±1% zoom | kernel unit |
| 8 | Snap visibility decoupling | hidden grid still snaps | kernel unit |
| 9 | Snap priority | pixel > guide > object > grid within tolerance | kernel unit |
| 10 | Pixel snap rounding | applied only when `snap.pixel`; decimals allowed when off | kernel unit |
| 11 | Guide lifecycle | add/move/remove + undo/redo; delete removes from serialized doc | kernel unit |
| 12 | Rulers unit switching | tick labels switch at power-of-10 boundaries | kernel unit |
| 13 | Accidental-rectangle extension | wheel/pinch never arms create; effect vocabularies disjoint | kernel unit |
| 14 | Paste mints IDs | pasted subtree IDs unique; canonical round-trip | kernel unit |
| 15 | Retained host allocation | repeated renders → zero unbounded allocations | host unit |
| 16 | Protocol v2 batch parity | changed-node batch vs full re-encode: same pixel hash, ≥3× encode speed | host/bench |
| 17 | Page tabs + restore | browser: switch page, pan/zoom, switch back → camera + selection restored; reload persists rest camera | browser integration |
| 18 | Grid/guides in browser | ruler-drag creates guide; guide drag snaps at 6 px tolerance; pixel grid visible at ≥400% only | browser integration |
| 19 | Perf: grid plan | 10k-node fixture + grid plan < 2 ms | bounded perf fixture |
| 20 | Perf: page switch | page switch < 250 ms with rest-camera restore | perf fixture |
