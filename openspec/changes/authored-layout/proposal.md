## Why

Crafty currently has no layout stage: node `bounds` remain absolute and parent
resizes do not reflow children (`docs/architecture/layout.md`; confirmed by
`docs/architecture/current-state.md`). The competitive research in
`docs/research/layout-competitive-landscape.md` shows that durable layout needs
declared flex-family intent, versioned semantics, a proven evaluator, and
behavioral conformance rather than another isolated hand-written algorithm.

## What Changes

- Add optional authored flow-container and per-child layout records. The first
  editable vocabulary is horizontal/vertical flow, wrap, padding, gaps,
  alignment, Fixed/Hug/Fill sizing, min/max constraints, and flow/absolute
  participation.
- Add validated, invertible commands for setting or clearing those records.
- Add explicit layout behavior versioning so saved files retain their authored
  semantics as defaults and import dialects evolve.
- Add a renderer-independent resolution stage that evaluates an entire layout
  tree through one coarse boundary and returns disposable resolved boxes,
  diagnostics, and measurement dependencies. Results never overwrite authored
  `bounds`.
- Adopt Taffy as the initial evaluator behind a Crafty-owned layout IR and
  adapter; ratify the dependency, ownership boundary, and compatibility policy
  in an ADR.
- Add deterministic fixtures plus browser-reference conformance checks at
  multiple container sizes. No unmeasured performance budget is introduced.
- Wire resolved boxes into scene projection, hit testing, selection, and
  inspector projections.

Explicitly out of scope: grid authoring, CSS/Yoga/Figma translators, inference
from absolute geometry, foreign custom-layout execution, drag/reorder/resize
semantics inside flow containers, layout animation, and partial invalidation.
These are follow-on capabilities, not hidden extensions of this change.

## Capabilities

### New Capabilities

- `layout/authored-layout`: Authored flex-family layout intent, stable behavior
  versions, deterministic resolution, diagnostics, and canonical round trips.

### Modified Capabilities

None.

## Impact

- `packages/editor/src/kernel/`: document records, validation, commands,
  resolution adapter, projections, and kernel tests.
- A renderer-independent Rust/WASM layout core owned by the resolution layer;
  it is not part of the renderer protocol and receives no document or product
  semantics.
- `packages/editor/src/ui/`: leaf inspector controls only; shell composition is
  unchanged.
- `packages/scene-renderer`: consumes already-resolved geometry; its product-
  semantics boundary remains unchanged.
- Adds Taffy under its compatible license, requiring an ADR because dependency
  size and ownership affect the core.
- Updates layout, resolution, current-state, roadmap, research-ledger, and ADR
  documentation only as decisions or implementation reality change.
