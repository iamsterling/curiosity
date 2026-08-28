## Status

**Proposed.** This is an umbrella change and sequencing contract, not authorization
to implement every child capability in one branch.

## Why

The `authored-layout` change implemented the first end-to-end foundation: versioned
Crafty flex intent, Taffy evaluation through one coarse Rust/WASM call, intrinsic
measurement contracts and fallbacks, disposable resolved boxes, and projection into
editor geometry. The prior session explicitly deferred the remaining product-level
layout system. Those items are coupled by the authored/resolved boundary but are not
one feature and should not be implemented as a large untestable rewrite.

This umbrella depends on the active `openspec/changes/crafty-ui-format/` change for
document-native `.ui` persistence. Layout runtime hardening cannot close while the
product still saves through a lossy legacy `Scene` path. Component-aware layout also
depends on a separate component-resolution foundation; the records currently exist
but are not resolved (`docs/architecture/components-and-design-systems.md`).

## What Changes

Establish a staged program for:

- runtime hardening and production/browser conformance
- full intrinsic measurement and dependency-aware invalidation
- constraints/pinning and responsive breakpoint/container contexts
- a separate grid layout family
- layout-aware reorder, drag/drop and insertion proposals
- explicit import/export translation with loss reporting
- opt-in automatic layout inference
- component/variant-aware layout after component resolution
- incremental subtree recomputation after semantics stabilize

Layout animation is deliberately a separate `layout-animation` follow-on, excluded
from this umbrella's implementation ledger but covered by its own acceptance
boundary, because it depends on component state, explicit time and the fixed
render-loop path.

## Shared Invariants

- `EditorDocument` remains canonical authored state.
- Resolved boxes are disposable and never overwrite authored `bounds`.
- All durable mutations use validated, invertible kernel commands and transactions.
- Pointer movement and preview indicators never mutate durable state.
- The existing Crafty-owned layout IR/evaluator boundary remains renderer-independent.
- Full resolution remains available as the correctness oracle.
- Unsupported, lossy, missing and ambiguous behavior produces stable diagnostics.
- Existing documents without layout intent remain behaviorally unchanged.
- No new capability extends the legacy `Scene` as an authored model.

## Explicitly Out Of Scope

- Implementing all child changes in this umbrella proposal.
- A universal lossless Figma/HTML/CSS/Sketch/Framer converter.
- Full CSS Grid parity, subgrid, arbitrary custom layout code or a constraint solver
  as the authored language.
- Silent layout inference during resolution or ordinary dragging.
- Per-frame document mutations for animation.
- A performance budget before Crafty fixtures and distributions are measured.
- Opaque/foreign custom-layout execution. Such nodes are rejected by the initial
  translation contract or retained as diagnosed opaque source projections; a future
  dedicated foreign-layout change would be required before execution is supported.
- Reusing proprietary or source-available competitor implementation code.

## Impact

The child changes may touch `packages/editor/src/kernel/`, the resolution boundary,
Rust/WASM layout integration, editor interaction reducers, import/export adapters,
component resolution, tests and architecture ADRs. The umbrella itself adds only
planning and research artifacts.

## Success Criteria

The program is ready to close only when each child has its own accepted scope,
observable scenarios, implementation tasks, conformance fixtures and verification
evidence, or is blocked with an exact technical blocker and residual risk.
