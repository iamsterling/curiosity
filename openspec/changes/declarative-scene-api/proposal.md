# Declarative Scene API

## Why

The renderer trajectory is settled (`vector-path-rendering`: Vello/wgpu on the
module-owned device, staging readback, TypeGPU composite). That change gives
Crafty a production-grade graphics substrate; this change gives the **application
and agent surfaces a declarative way to describe visual primitives over it**,
informed by reverse-engineering `mblode/react-vello` (MIT, cloned and read
2026-08-07; full report:
[`docs/research/react-vello-declarative-renderer.md`](../../docs/research/react-vello-declarative-renderer.md)).

react-vello demonstrates the pattern end to end: React elements → a disposable
`SceneNode` tree → one coarse binary frame written straight into WASM linear
memory → Rust-decoded Vello scene ops on a Rust-owned wgpu device. Three of
its properties are exactly what Crafty needs, and three of its choices are
exactly what Crafty must not copy (recorded in the report). The confirmed
defect this change fixes: **Crafty has no surface for describing visuals other
than the editor's own kernel-driven canvas path.** UI chrome, previews,
inspector thumbnails, agent-authored visualizations, and the roadmap's
"live, bidirectional visualization of the code in this repository" would each
grow their own ad-hoc drawing code, or worse, leak into the document.

The organizing rule, stated twice because it is the whole point: **the
declarative scene API is an ergonomic projection into the renderer — it is
never the canonical Crafty document model.** Editing stays command-driven
through `editor-kernel`; agents operate Crafty without React at all; and the
renderer contract stays ≠ Vello's API, so Vello's pre-1.0 evolution never
rewrites the editor.

## What Changes

**A new `packages/scene-api` package** (framework-neutral, kernel-neutral):

- **Scene description types**: a serializable scene graph of visual
  primitives — groups (transform + opacity), rects, paths (the v3
  `PathGeometry` representation), text (plain runs; metrics land with the
  text decision), fills/strokes, and a canvas root with size/dpr/background.
  No component/token/variant semantics — product semantics stop above this
  layer (I30).
- **A pure resolver**: `resolveScene(description, viewport) → RenderFrame`
  (the existing protocol-v3 packet). The resolver computes the transform
  stack and opacity, in the react-vello pattern (TS resolves, Rust decodes),
  and never mutates the description or the document. Re-resolving the same
  description is deterministic.
- **A thin React binding** (`@crafty/scene-api/react`): `SceneCanvas`-style
  host elements compose the description from React props and feed the
  resolver — the react-vello ergonomics, minus its reconciler: Crafty does
  not need a custom React host renderer (React's own tree + props diffing
  suffice for chrome-sized scenes; a custom reconciler is the react-vello
  complexity that buys nothing at Crafty's scene sizes).
- **The packet is the boundary**: the scene API emits `RenderFrame`; the
  wgpu/vello machinery consumes it. Nothing in this package imports Vello,
  wgpu, or `scene-renderer-wasm` internals beyond the packet types.

**Sequencing**: this change is planned after `vector-path-rendering` lands
(renderer substrate first, ergonomics second — the order the research
dictates). The tasks here are implementable against the protocol-v3 packet
with a stub consumer if the renderer is mid-flight.

**Explicitly out of scope**: a custom React reconciler (react-vello's); the
binary frame protocol (the transport question — react-vello proves it, a
separate measurement decides it); editing semantics of any kind (commands
only); replacing the editor's kernel-driven canvas path (the scene API is a
surface for chrome/preview/agent visuals, not the authored canvas);
software-renderer fallbacks (I32); text shaping and glyphs (the text
decision).

## Impact

- New package `packages/scene-api` with `src/` (description types, resolver,
  react binding) and vitest coverage — resolver determinism, transform
  stacking, opacity, path carrying, no-mutation guarantees.
- `packages/scene-renderer` — consumed via `DrawOverlayPacket`/`RenderFrame`
  types only; no edits expected.
- `apps/crafty-web` — the first consumer: the editor chrome surfaces
  (preview overlays, thumbnails) migrate where the kernel path does not own
  them.
- Docs: `wasm-boundary.md` (the scene API sits above the packet),
  `research-ledger.md` (react-vello row already records the concept adoption).
- Tests in the surrounding style: kernel-free, deterministic, no DOM where
  the resolver is tested; the React binding gets the minimal mount tests the
  repo convention allows.
