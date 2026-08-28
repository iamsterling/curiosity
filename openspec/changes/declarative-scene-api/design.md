# Design — Declarative Scene API

## Context

See `proposal.md` — why. This document records how, and where the approach
follows react-vello versus diverges from it. Primary source:
`mblode/react-vello` (MIT), cloned and read 2026-08-07; the evidence and
source map are in `docs/research/react-vello-declarative-renderer.md`.

Constraints that shape everything below:

- The renderer contract is the packet (`RenderFrame`, protocol v3): one
  coarse frame per render call, geometry/transform/fill/opacity/order,
  explicit `(zIndex, order)`, no product semantics (I30). The scene API emits
  packets; it never touches Vello or wgpu directly.
- The document is canonical and command-driven. The scene API never mutates
  it, never reads it as an editing surface, and never becomes a second
  document. Agent surfaces operate the kernel directly and may use the scene
  API only to describe visuals.
- `docs/architecture/performance.md`: no budget without a measurement. The
  resolver's cost is measured with a fixture when the renderer benchmark
  lands, not asserted here.
- react-vello is MIT; concepts are being adapted, no code is copied.

## Goals / Non-Goals

**Goals:**

- A framework-neutral, serializable scene description (groups/rects/paths/
  text/fills/strokes) that resolves deterministically into the protocol-v3
  packet.
- A thin React binding that gives the app layer the react-vello ergonomics —
  declarative primitives, one resolver call per frame — without a custom
  reconciler.
- The packet boundary is airtight: nothing in `scene-api` imports Vello,
  wgpu, or renderer internals.

**Non-Goals:**

- A custom React host renderer (react-vello's reconciler; React's own
  diffing suffices at chrome scene sizes).
- The binary frame protocol — recorded as the transport question, decided by
  a measurement against the existing packet.
- Editing semantics, document access beyond read, components/tokens.
- Replacing the editor canvas path (kernel → packet stays the authored
  surface).
- Text shaping/glyphs, gradients, masks — the packet grows them in their own
  changes; the description types grow with it.

## Decisions

### 1. Description types mirror the packet, not Vello — following the boundary

**Adopted from the research, diverging from react-vello in one place:**
react-vello's props (origin/size, radius, fill kind, stroke width) map
1:1 onto its op codes, and its op codes map 1:1 onto Vello scene calls —
two layers, no abstraction in between. Crafty keeps the abstraction because
the renderer contract is already the packet: `SceneDescription` is the
declarative form of a `RenderFrame` (groups → transform/opacity stacking,
rects → the rect fast path, paths → `PathGeometry` + fillRule + stroke
descriptor), and the resolver is the only code that knows the mapping. When
Vello changes (its stated pre-1.0 cadence), only the Rust decoder changes —
the description and the app surfaces do not.

### 2. The resolver is pure and deterministic — the react-vello pattern

**Adopted.** react-vello computes the full transform stack and opacity
multiplier in TypeScript and writes resolved values into the frame
(`encoder.ts`). The resolver does the same against the packet: walking the
description, multiplying transforms, multiplying opacities, emitting
`DrawCommand`s in `(zIndex, order)` sequence. Determinism is a tested
property (same description → byte-identical packet), and a resolver call
never mutates its inputs (tested by deep-equality on the input after
resolution).

### 3. React binding: composable elements, not a reconciler — diverging

**Divergence from react-vello, deliberately.** react-vello builds a custom
React reconciler (`index.ts:164`) so arbitrary React subtrees become
`SceneNode`s. That machinery buys imperative control over a renderer's tree;
Crafty's chrome scenes are small, React-owned, and re-render through normal
props flow. The binding is therefore: declarative host elements
(`SceneRect`, `SceneGroup`, `ScenePath`, …) that collect their props into a
description on render, and a `SceneCanvas` host that resolves and submits
once per commit (rAF-coalesced). If a future surface genuinely needs a
foreign-object subtree in the scene, the reconciler is then a justified
addition — recorded as the flip trigger, not built speculatively.

### 4. The path representation rides the v3 packet unchanged — following the data model

Path nodes in a scene description carry the same `PathGeometry` the kernel
validates (points/subpaths/fillRule). The resolver copies it into the
packet's path command verbatim; there is exactly one path representation in
the system, and the Rust decoder already parses it in `vector-path-rendering`.
No conversion layer at the scene API.

### 5. Sequencing: renderer first, ergonomics second

**Adopted from the user's trajectory and the research.** The substrate
(`vector-path-rendering`) lands first; this change's tasks reference the
protocol-v3 packet and can be developed against it with a stub submitter.
The scene API is the layer where the app grows, not the layer that justifies
the renderer.

## Alternatives Considered

| Alternative | Why it lost |
|---|---|
| Custom React reconciler (react-vello's model) | Real complexity for chrome-sized scenes; React's own diffing + props flow is sufficient; the flip trigger is recorded. D3 |
| Scene API as part of `apps/crafty-web` | The API is framework-neutral and serves agent surfaces too; it belongs in a package, with the React binding as a subpath. |
| Scene API speaks Vello scene ops directly | Violates the renderer-contract ≠ Vello rule; every Vello release would touch app code. D1 |
| Reuse `EditorDocument` as the scene description | The description is derived/disposable; the document is canonical. Making them the same type would let chrome edits leak into the document. |
| Adopt react-vello's binary writer now | The transport question needs a measurement (packet JSON vs binary vs shared memory); react-vello proves feasibility, not that Crafty's budget needs it. |

## Deferred Items and Their Triggers

- Binary/shared-memory packet transport — trigger: a measured encode cost on
  the renderer benchmark exceeds the budget with the JSON packet.
- Custom reconciler — trigger: a surface needs foreign-object subtrees
  (arbitrary React content inside a scene group).
- Text/gradients/masks in the description — trigger: the packet grows them
  (text decision, roadmap).
