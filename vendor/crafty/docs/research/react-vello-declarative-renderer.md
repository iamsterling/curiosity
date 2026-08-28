# react-vello: a declarative React renderer over Vello/wgpu — reverse engineering for Crafty

Status: research, 2026-08-07 · Source: `mblode/react-vello` (MIT), `main`
branch, cloned and read on 2026-08-07. Primary-source only: every claim below
was read from the repository at that commit. Nothing was copied into Crafty;
this report extracts the problem, the constraints and the architectural
lesson.

## 1. What it is

A React renderer that draws shapes and text declaratively while Rust (Vello)
does the rendering: React elements → a `SceneNode` tree → a binary frame →
WASM linear memory → Vello on a Rust-owned wgpu device → the canvas surface.
Roughly 5,000 lines: ~3,800 TypeScript (`packages/react-vello/src/`) and
~1,025 Rust (`crates/rvello/src/lib.rs`) plus a hand-written present shader
(`present.wgsl`).

## 2. The architecture, precisely

### React host (index.ts, runtime.ts)

- A custom React reconciler host config (`Reconciler(hostConfig)`,
  `index.ts:164`) with `createVelloRoot(canvas)` as the root entry point.
  React elements become type-tagged `SceneNode`s (`Canvas | Group | Rect |
  Path | Text`) with stable minted handles (`node-${++nodeCounter}`,
  `runtime.ts:94`), children lists, sanitized props, and per-node `dragOffset`
  (interactive state lives on the node, not in the document).
- `scheduleRender` fires on commits; the render loop calls `encodeFrame`
  (`runtime.ts:596-695`) which walks the tree, resolving the full transform
  stack and opacity multiplier in TypeScript.
- Hit regions are built **lazily**: a deferred dirty flag, rebuilt only when a
  pointer event arrives (`runtime.ts:674-676`) — most frames are animation,
  not interaction.
- Pointer/wheel/drag events are normalized (`CanvasPointerEvent`,
  `CanvasDragEvent`) and hit-tested against the cached regions using
  world-transform inversion.

### The binary frame protocol (encoder.ts, binaryWriter.ts)

- Op codes: `BeginFrame | Rect | Path | Text | EndFrame`. TypeScript writes
  the resolved values — opacity, `f32` mat3 transform, origin/size, paint —
  into a **reused buffer that allocates nothing per frame**
  (`encoder.ts:44`).
- The buffer is WASM linear memory: `ops_reserve(len)` returns a raw pointer
  to JavaScript, JS writes the frame in place, then one `apply_and_render`
  call decodes and renders it (`lib.rs:223-247`). **One coarse crossing,
  zero copy** — the strongest form of Crafty's "one versioned packet per
  frame, never per-shape calls" invariant.

### Rust side (lib.rs, present.wgsl)

- Rust owns the entire GPU stack: `wgpu::Instance` (backends
  `BROWSER_WEBGPU` only), `HighPerformance` adapter, device/queue, and the
  canvas surface (`lib.rs:70-133`). There is no WebGL2 downlevel floor —
  the comment says it would pin storage-buffer counts and compute workgroup
  sizes, which Vello's compute rasterizer needs headroom in.
- Vello's `Renderer::new` is configured with `AaSupport::area_only()`
  (`lib.rs:138-145`): the default compiles area, MSAA8 and MSAA16 shader
  permutations at startup, and only Area is ever requested — two thirds of
  the startup shader compilation was being paid for and never used.
- Renders into an offscreen texture (`OffscreenTarget`), then a dedicated
  `present.wgsl` pipeline (linear sampler) draws that texture to the surface.
- A path-string cache capped at `PATH_CACHE_LIMIT = 256` distinct paths
  before rebuild.
- Text: a default font embedded via `include_bytes!`; `FontRef`/charmap are
  parsed **once per frame** (they used to be re-derived per text node), a
  one-entry size-metrics memo covers the "one or two sizes per scene" case,
  and line layout/alignment is a small hand-rolled width measurement.
- Rects have three fast paths: plain `Rect`, full-radius `Circle` (a dot —
  "a particle field is thirty thousand dots"), and `RoundedRect` — because
  `RoundedRect` resolves to four lines plus four arcs, and each arc costs
  transcendentals to turn into cubics.

### The software fallback

- When WebGPU is unavailable (or opted in), the **same SceneNode tree** is
  rendered with Canvas2D (`runtime.ts:600-669`) — a second complete backend
  for the same scene.

## 3. What transfers to Crafty

**Adopted (concepts, not code):**

1. **The declarative projection pattern is proven.** A React/declarative
   surface can sit over a Rust/WASM/Vello renderer with a clean seam: React
   elements → resolved scene tree → one binary frame. This validates the
   trajectory of a Crafty-native scene API as an *ergonomic projection* over
   the resolved render scene — with the hard rule the react-vello codebase
   demonstrates by construction: the SceneNode tree is disposable, derived,
   re-built from props on every commit. It is never a document.
2. **The zero-alloc binary frame with direct WASM-memory writes** is the
   strongest form of the coarse-packet invariant. Crafty's open packet-
   transport question (JSON vs binary/shared-memory) now has a working
   reference implementation to measure against — TS resolves, Rust decodes.
3. **TS resolves, Rust draws.** Transform stacks and opacity are computed in
   TypeScript; Rust decodes op codes into Vello scene ops. Exactly the
   ratified boundary: Rust owns *what to draw*, TS owns the rest.
4. **`AaSupport::area_only()`** — Vello compiles per-AA-config shaders at
   startup; configure the support set explicitly or pay for unused
   permutations. Directly applicable to the `vector-path-rendering` change.
5. **Rect fast paths** (Rect / Circle / RoundedRect) — the rect fast path
   stays first-class; the dot case avoids the arc tessellation cost.
6. **Parse-once-per-frame + one-entry memo for font metrics** — the shape of
   the text decision when Crafty's text stack lands.
7. **Lazy hit regions** — derived interaction data is built on demand, not
   per frame. Matches Crafty's disposable-derived-data rule.
8. **Bounded caches** (PATH_CACHE_LIMIT) — same discipline as the capacity-
   resource-cache.

**Rejected / diverged, with reasons:**

1. **The Canvas2D software fallback is a second backend.** react-vello's
   answer to WebGPU unavailability is the exact dual-renderer tax Graphite's
   history documents as permanent. Crafty's I32 stands: WebGPU unavailability
   is a diagnostic, not a trigger for a second backend. (The future
   headless/export path via `vello_cpu` is a different feature, not a
   fallback.)
2. **Full Rust device + surface ownership with direct present — now ADOPTED.**
   react-vello owns the surface and presents; the earlier design kept this
   "rejected" because Crafty's overlays were TS-side renderer state (I31)
   composited after the authored packet. The resolution (decided 2026-08-07,
   encoded in `openspec/changes/vector-path-rendering/`): overlays are still
   *composed* by the host, but their *drawing* moves into the scene — the
   Rust encoder decodes the overlay packet after the authored content, and
   the module owns device, surface, render and present. The staging readback
   and the two-device question disappear; the TypeGPU host's canvas role
   retires (ADR 0007 reversal, ADR 0010). The only per-frame crossing is the
   packet, JS → WASM, one-way.
3. **Their props model is UI-oriented, not document-oriented** — no
   component/token/variant semantics, no commands. Crafty's scene API must
   not grow into an editing surface; editing stays in the kernel.
4. **Canvas-scoped hit testing** (regions per node) is fine for UI chrome but
   is not the kernel's document hit testing — Crafty already has the
   authoritative one.

## 4. The layered trajectory this confirms

```
React / Next
  → Crafty scene API (declarative ergonomic interface)
  → Editor / product model (semantic truth)      ← the document, kernel-owned
  → Resolved render scene
  → Rust/WASM
  → Vello / wgpu / WebGPU
```

The critical rule, reinforced by react-vello's own construction: **the
declarative API is a projection into the renderer, never the canonical
document model.** Agents will operate Crafty without React at all — the scene
API is a surface for describing visual primitives, and the document stays
command-driven. And the renderer contract must stay ≠ Vello's API, so Vello's
pre-1.0 evolution (alpha, ~3 breaking releases/yr, blur/filter work,
allocation strategy, glyph caching, web-not-primary-target) never rewrites
the editor.

## 5. Source map (fetched 2026-08-07)

- `packages/react-vello/src/index.ts` — reconciler host config,
  `createVelloRoot`, render scheduling.
- `packages/react-vello/src/runtime.ts` — SceneNode tree, render loop, hit
  regions, software fallback, pointer events.
- `packages/react-vello/src/encoder.ts`, `binaryWriter.ts` — the binary
  frame protocol.
- `packages/react-vello/src/nodeProps.ts`, `types.ts`, `mat3.ts` — the
  declarative props surface and transform math.
- `crates/rvello/src/lib.rs` — wgpu device/surface ownership, Vello renderer
  config, op decoding, text, rect fast paths.
- `crates/rvello/src/present.wgsl` — the present pipeline.
- License: MIT (read from `LICENSE.md`). Concepts only are being transferred;
  no code.
