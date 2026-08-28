## Context

See `proposal.md` for motivation and the capability spec for observable
behavior. Current Crafty has authored absolute bounds but no resolved layout
stage. The kernel and document model are TypeScript; Rust/WASM currently owns
render encoding. Layout results are required above rendering by scene
projection, hit testing, selection, inspection, headless export, and later code
translation.

The 2026-08-09 competitive research found two durable patterns: design tools
converged on declared flex-family flow plus an absolute escape hatch, and Rust
layout consumers converged on Taffy. It also found that per-node JS/WASM calls
lose to local evaluation, while coarse tree-level calls avoid that boundary
cost. This design adopts those findings without placing product semantics in
the renderer.

## Goals / Non-Goals

**Goals:**

- Establish durable authored intent and versioned semantics.
- Keep the designer-facing vocabulary smaller than the evaluator IR.
- Evaluate layout through a renderer-independent, deterministic coarse
  boundary.
- Support intrinsic measurement as a first-class protocol.
- Establish browser-reference conformance before expanding the property set.

**Non-Goals:**

- Grid, translators, inference, foreign custom layout, or interaction semantics.
- Proving universal lossless bidirectional translation.
- Partial invalidation or a performance budget before measurement.
- Moving document mutation, history, or product semantics into Rust.

## Decisions

### 1. Author a closed Crafty vocabulary over a richer layout IR

The document exposes horizontal/vertical flow, wrap, padding, row/column gap,
alignment, per-axis Fixed/Hug/Fill with min/max, and `flow | absolute`
participation. The Crafty-owned evaluator IR additionally reserves normalized
concepts needed by mature evaluators: available-space constraints, intrinsic
measurement, grow/shrink/basis, margins/borders, aspect ratio, insets, and
behavior flags. Reserved IR concepts are not automatically authorable.

This follows Figma/Penpot/Rive's declared-flow consensus while preserving an
honest subset. A single property bag mirroring all CSS was rejected because it
would expose behavior the editor cannot yet author or round-trip. A tiny IR
identical to the initial UI was rejected because it would force a schema or
engine-boundary redesign for translation and grid.

### 2. Use Taffy behind a renderer-independent Rust/WASM layout core

The TypeScript resolution layer adapts a complete subtree into one versioned
input, invokes the layout core once, and receives one batch containing resolved
boxes, diagnostic codes, and measurement requests/dependencies. There are no
per-node JS/WASM calls. The layout core is not the renderer and cannot mutate or
retain the authored document. Rust output is checked before replacing the last
valid resolved layout.

This follows the Taffy convergence in Servo, Bevy, Zed, Blitz, and Slint, and
Rive's precedent of embedding a proven engine. Yoga-WASM was rejected as the
primary choice because it is flex-only and would create an expected migration
for grid. A bespoke TypeScript flex implementation was rejected because
intrinsic sizing, wrap, min/max redistribution, compatibility semantics, and
future grid would create a costly second engine. Embedding layout in the
renderer was rejected because product semantics must resolve before packet
construction.

ADR 0013 records the dependency license/size, ownership boundary, IR version,
fallback policy, and what evidence could justify changing placement later.

### 3. Version behavior per authored layout subtree

Each subtree records a model and integer behavior version. Optional normalized
dialect/errata metadata may be carried when importing foreign semantics, but
Crafty's native model does not claim foreign compatibility. Unknown versions
are rejected. Supported old versions remain evaluable.

This follows Yoga Errata and Figma's dual-semantics migrations. Relying on the
document schema version alone was rejected because layout behavior evolves at a
different cadence and imported subtrees can carry different compatibility
requirements.

### 4. Make intrinsic measurement an explicit request/response protocol

Leaves can provide deterministic measurements keyed by content/style identity
and available-space constraints. Resolution may perform the evaluator's
required intrinsic and final-size passes; it is not constrained to a single
bottom-up pass. Until real text shaping lands, authored bounds are a documented
fallback accompanied by a diagnostic when an intrinsic measurement was
required but unavailable.

This follows Taffy/Yoga measure functions and the Parley-oriented text direction
already selected by Crafty's text ADR. Treating every leaf's authored size as
Hug was rejected because it would disguise missing typography semantics.

### 5. Define fidelity behaviorally

Fixtures describe authored intent, intrinsic measurements, and multiple
containing sizes. A browser-reference generator records expected geometry for
the supported CSS-equivalent subset. Crafty output and later translation
round-trips are compared against those recorded boxes. Comparison rules and
environment are committed with the fixture; tolerances are measured rather than
invented.

This follows Taffy and Yoga's Chrome-generated tests. Property equality was
rejected because dialects can produce equivalent geometry from different
representations.

### 6. Stage follow-on capabilities

This change establishes authored flex layout and its evaluator boundary.
Separate changes own flow interaction semantics, CSS/Yoga/Figma translation,
grid, absolute-to-layout inference, and opaque foreign-layout nodes. This keeps
the initial schema honest while leaving deliberate extension seams.

## Risks / Trade-offs

- **WASM boundary latency** → One versioned subtree call and one result batch;
  measure committed fixtures before considering workers, shared memory, or a TS
  fallback.
- **Taffy semantics leak into authored files** → Crafty owns both authored
  records and normalized IR; adapters contain engine-specific values.
- **Dependency size or license affects the core** → Record exact evidence and
  acceptance in ADR 0013 before implementation.
- **Text measurement creates cyclic work** → Explicit constrained measurement
  passes, stable cache keys, bounded hierarchy, and diagnostic fallback.
- **Old files change after evaluator upgrades** → Behavior versions and frozen
  conformance fixtures remain selectable.
- **Rust failure disrupts editing** → Preserve authored state and the last valid
  resolved result; return structured diagnostics.

## Migration Plan

Layout fields are additive. Existing files remain behaviorally unchanged.
Introduce the IR and evaluator behind tests before UI authoring controls; then
wire projections and commands. Rollback consists of disabling layout authoring
and ignoring optional layout fields while preserving their serialized data; no
computed boxes require migration because they are never authored.
