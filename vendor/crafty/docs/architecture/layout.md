# Layout

Status: **Current** for authored records, validation, commands, the versioned
layout IR, and the Taffy evaluator foundation. **Transitional** for projection
wiring and browser conformance. **Target** for constraints, grid, translation,
interaction semantics, and incremental resolution.

`DocumentNode` now carries optional `autoLayout`, `sizing`, and
`layoutPosition` records. Validated invertible commands edit them. The
renderer-independent version-1 layout contract adapts whole subtrees to Taffy
0.13 and returns disposable id-keyed boxes; authored `bounds` remain unchanged.
The editor projection wiring is transitional, so existing non-layout documents
still render exactly as before.

This document records the direction and the constraints on it so that the first
implementation does not have to be undone.

## Why this is architecture, not a feature

Layout decides where the authored/resolved line sits for geometry. Get it wrong
and you get one of two failure modes:

- **Layout results written back as `bounds`.** The document now contains computed
  values. Changing padding stops reflowing, and every layout change is a
  destructive document mutation with an undo entry.
- **Layout inside the renderer.** Every backend reimplements it, headless export
  disagrees with the canvas, and product semantics leak into GPU code.

The rule, from [ADR 0005](adrs/0005-layout-and-resolution.md):

> Layout **intent** is authored. Layout **results** are resolved. Results are
> written into the resolved tree and are never written back to `bounds`.

## Two systems, not one

Mature tools need both, and they are different mechanisms:

### Constraints (child-to-parent, on resize)

A child declares how it responds when its parent frame resizes: pinned left /
right / both (stretch) / centre / scale, per axis. Cheap, local, and the right
answer for absolutely-positioned children of a frame.

### Auto layout (parent-driven flow)

A frame declares a flow direction, padding, gap, alignment and wrapping; children
are positioned by the flow and declare a sizing mode per axis:

- **Fixed** — an explicit size.
- **Hug** — size to content.
- **Fill** — take the available space in the parent's flow.

Figma has stated publicly that auto layout is intended as "a thoughtful subset of
flexbox", and its newer wrap mode adopts CSS flex-wrap semantics with independent
row and column gaps.

**Adopt that framing.** Modelling auto layout as a documented subset of flexbox
gives three things Crafty specifically needs: designers already know the mental
model, generated code maps to CSS without a translation layer, and — because
Crafty is production-code-aware — the design and the implementation can be
checked against each other.

**Do not** claim full CSS compatibility. Pick a subset, document exactly which
properties are supported and which are deliberately excluded, and make the
excluded set explicit rather than accidental.

## Where it goes

Stage 4 of the resolution pipeline, after component expansion and token
substitution, before text shaping. See
[`scene-resolution.md`](scene-resolution.md).

Order matters and is not negotiable: a component instance's overrides can change
what content exists, content determines hug sizes, and hug sizes determine the
parent's size. Layout before expansion computes the wrong thing.

Text is the circular dependency to watch: text width depends on shaping, and
shaping width depends on the available width from layout. The standard resolution
is a two-pass measure/arrange protocol — measure with a width constraint, then
arrange — with a shaping cache keyed by (content, font, size, features, width).

## Current authored records

Not yet ratified. Sketched here so the first implementation has a starting point,
not a blank page.

```ts
interface AutoLayout {                 // on a frame
  behavior: { model: "crafty-flex"; version: 1 };
  direction: "horizontal" | "vertical";
  wrap: boolean;
  padding: { top; right; bottom; left };
  gap: { row: number; column: number };
  primaryAlign: "start" | "center" | "end" | "space-between";
  counterAlign: "start" | "center" | "end" | "baseline";
}

interface Sizing {                     // on any child
  horizontal: "fixed" | "hug" | "fill";
  vertical:   "fixed" | "hug" | "fill";
  min?: number; max?: number;
}

type LayoutPosition = "flow" | "absolute";
```

`bounds` remains the authored position/size for fixed, non-flowed nodes and the
fallback when no layout applies. It must not become the layout output field.

## Implementation notes

- **Taffy evaluates a Crafty-owned IR**, ratified by
  [ADR 0013](adrs/0013-taffy-layout-core.md). The TypeScript kernel owns authored
  semantics and validation; one coarse Rust/WASM call returns resolved boxes.
- **Deterministic.** Same input, same output, byte for byte. No iteration-order
  dependence, no floating-point accumulation across siblings where a single
  pass would do.
- **Invalidation is a dependency problem.** Editing a child's content dirties its
  hug-sized ancestors transitively. Model this explicitly or accept full
  re-layout; do not guess.
- **Diagnostics over guesses.** Unsupported behavior versions, malformed
  records, missing intrinsic measurements, and evaluator failures are explicit.
- **Nested layout must terminate.** Depth is bounded by the hierarchy, which is
  already acyclic (I5).

## Open decisions

| Question | Why it matters |
|---|---|
| Do constraints and auto layout coexist on the same frame? | Figma allows only one. Allowing both multiplies the semantic surface. |
| Does layout move to a worker or shared-memory transport? | Depends entirely on measured cost. Do not pre-decide. |
| Grid layout at all? | Real tools are adding it. It is a large increment and should not block flow layout. |

Engine ownership is ratified by ADR 0013. Do not add a second evaluator.
