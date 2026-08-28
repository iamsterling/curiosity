## 1. Completed Research and Foundations

- [x] 1.1 Preserve the baseline, reconcile the research package, and update the
  architecture truth docs so the repo describes current reality rather than the
  superseded pre-convergence story.
- [x] 1.2 Record the current ownership map honestly, including the remaining
  duplicate coordinate/hit-test debt, the transitional Scene path, and the
  renderer/documentation drift that still matters.
- [x] 1.3 Land only the foundations that do not guess product semantics:
  first-party file workspace descriptor, local command-room/receipt seam,
  projection source-map anchors, deterministic animation evaluation, and
  extracted scene-packet composition.

## 2. Remaining Explicit Product Contracts

- [ ] 2.1 Do not generalize `EditorWorkspace` beyond the current
  `{ mode: "design", file: ... }` shape until a second real workspace or mode
  exists and its lifecycle is agreed.
- [ ] 2.2 Before exposing MCP or any remote automation transport, ratify the
  command-room envelope contract, actor/capability policy, persistence/save
  wiring, receipt lifecycle, and operator review surface in a scoped follow-up
  change.
- [ ] 2.3 Before starting Code mode, ratify the authored projection contract:
  which text artifacts exist, how stable anchors map back to validated commands,
  and where refusal/diagnostics are surfaced.
- [ ] 2.4 Before treating prototyping/animation as shipped, ratify authored
  trigger/action/transition records, preview/runtime routing, and render-loop
  integration for the existing evaluation seam.

## 3. Remaining Migration Gates

- [ ] 3.1 Retire the remaining legacy Scene and hover-hit-test paths only behind
  parity tests, focused measurements, and a reversible migration checkpoint.
- [ ] 3.2 Measure serialization, browser presentation, and recovery before
  changing packet transport or treating scene-packet extraction as evidence that
  the renderer migration is complete.
- [ ] 3.3 Record the architecture review/approval gate explicitly before marking
  the above contracts as approved direction.
- [x] 3.4 Keep approved behavioral or schema work in separate scoped OpenSpec
  changes rather than extending this planning-only change. Existing follow-ons
  in the repo already cover that pattern.
