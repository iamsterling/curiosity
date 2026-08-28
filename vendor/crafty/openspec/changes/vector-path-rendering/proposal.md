## Why

Crafty's renderer can draw exactly one primitive: a solid-filled axis-aligned
rectangle. `DrawGeometry = "rect"` (`packages/scene-renderer/src/draw-protocol.ts:6`)
is the only geometry, and the Rust encoder emits `"rect"` for every layer. The
vector-path data model (`openspec/changes/vector-path-data-model/`) makes paths
representable and editable in the document, but nothing can draw them: roadmap
3.3 ("path node kind, tessellation in the encoder, strokes, gradients") is
blocked on a rendering decision.

Three research reports were completed on 2026-08-07 to settle how:

- [`docs/research/graphite-reverse-engineering.md`](../../../docs/research/graphite-reverse-engineering.md) —
  a source-verified study of Graphite, the closest analog (Rust→WASM vector
  editor). Its core lesson: a **dual renderer (SVG + Vello) is a permanent tax**
  with renderer-specific semantic divergences, and a full-document
  re-evaluation per drag frame is the performance wall to avoid.
- [`docs/research/vello-vector-rasterization.md`](../../../docs/research/vello-vector-rasterization.md) —
  Vello 0.9.0 (2026-05-15): analytic area AA, both fill rules, GPU-side
  tessellation, text via glifo/skrifa in the same pipeline, embeds as a library
  via `render_to_texture` into a host-owned texture. Pre-1.0, ~3 breaking
  releases/yr, `dispatchWorkgroupsIndirect` uncertainty on Firefox non-Windows,
  ~0.5–1 MB wasm.
- [`docs/research/lyon-and-cpu-tessellation.md`](../../../docs/research/lyon-and-cpu-tessellation.md) —
  lyon 1.0.20 (2026-03-21): stable, both fill rules, in-tessellator
  self-intersection handling, but no AA of its own (MSAA 4x required), known
  stroke-quality ceiling, and no text story.

**The decision, recorded:** adopt **Vello's wgpu renderer (vello-classic), now, with full Rust ownership of the canvas** — the react-vello model (MIT, reverse-engineered 2026-08-07, `docs/research/react-vello-declarative-renderer.md`): the WASM module creates the wgpu instance, adapter, device, queue **and the canvas surface**; Vello renders the authored packet *and* the overlay packet into the scene; a present pipeline draws to the surface. There is **no pixel crossing back to the host** — the only per-frame crossing is the packet (JS → WASM), and the earlier staging-readback design is dropped. The alternatives that survived scrutiny — lyon (stable, boundary-preserving, text-blind) and analytic-AA fringes (zero-dependency, compounding feature tax) — fail the roadmap's "which choice also serves glyph rasterization later" test; their flip conditions are recorded in the design doc. Stencil-then-cover and tiny-skia were rejected outright.

**Prototype-verified correction, folded in (2026-08-07):** the de-risking
prototype (`benchmarks/vello-cpu-prototype-report.md`) established that
`vello_cpu` 0.2.0 **does not share the scene/encoding model with the
vello-classic wgpu renderer** — it exposes its own PostScript-style API
(`set_paint` / `fill_rect` / `fill_path` → pixmap) and does not consume
`vello_encoding` at all. Because this change now targets vello-classic, that
finding *restores* the original one-encoder premise rather than retracting it:
the encoder builds `vello::encoding::Encoding` (the scene model the wgpu
renderer consumes), and `vello_cpu`'s divergent API is irrelevant to the
interactive path. `vello_cpu` remains a candidate for roadmap 4.4's
headless/export rendering, evaluated separately; the prototype's measurements
(+28,910 raw wasm / +7,536 gzip for vello_cpu, ~0.77 ms/frame CPU) stay on
record as the dependency-cost baseline, and the wgpu delta is measured in
this change against the same parity harness.

The change is sequenced so the **present spike runs first**: the
research names the same-device-ownership question as the one genuine boundary
reversal risk ("TypeScript owns the GPU" moves for the authored path), and
the cheapest experiment is a two-GPU-stack spike on the real stack — a wgpu
device and a TypeGPU device on one adapter, one page, one frame — before any
protocol work is trusted. Nothing in this change assumes the spike outcome
beyond what the reports verified (encoding, embedding API, `render_to_texture`
into a host-owned texture); the pixel-parity harness it produces is reused for
every subsequent step.

The de-risking prototype (section 1, `benchmarks/vello-cpu-prototype-report.md`)
already ran and produced the evidence this change builds on: the 10k-rect
fixture encodes as a Vello scene, the dependency cost is measured (+28,910
raw / +7,536 gzip, ~0.77 ms/frame CPU), and the one research contradiction it
found — vello_cpu's scene model diverges from vello-classic — is precisely why
the interactive encoder targets `vello_encoding` directly. The pixel-parity
harness discipline it established is reused for every subsequent step.

## What Changes

**Protocol v3.** `DRAW_PROTOCOL_VERSION` goes to 3 with v2 accepted:
`DrawGeometry` gains `"path"`; `DrawCommand` gains optional `path` geometry
(node-local point records with handles and closure, in the authored
representation the kernel already validated), an optional stroke descriptor
(width, caps, joins, dash), and an explicit fill rule. `"rect"` remains a
first-class geometry forever — overlays (selection, grid, guides) stay rects
and the rect fast path is a Vello fast path.

**Rust encoder grows a Vello scene encoder.** After the existing `(zIndex,
order)` sort, `RendererCore` builds a `vello::encoding::Encoding` (rects via
the rect fast path, paths via `fill(Fill::NonZero|EvenOdd, …)` /
`stroke(…)`), decodes the overlay packet into the same scene after the
authored content, and Vello's wgpu renderer renders it on the module-owned
device into a texture that the module's present pipeline draws to the surface
— the packet is the only crossing, one-way. Non-finite transforms and
coordinates are rejected at the boundary (Vello's documented 12fps failure
mode, vello#470; Crafty already does this for the viewport).

**Device ownership: Rust owns the canvas end to end.** The module creates
the wgpu instance/adapter/device/queue **and the surface**; Vello renders the
authored packet and the overlay packet into one scene; the module's present
pipeline draws to the surface. The TypeGPU host's scene-submission and
compositing role **retires** (ADR 0007 reversal, recorded in ADR 0010); the
host keeps composing the overlay packet and encoding frames — the canvas
hands the module the element, the packets, and nothing else. The "no fallback
backend" invariant (I32) holds — this wgpu path is *the* backend, not a
fallback.

**Overlays move into the scene, not into a second GPU.** The overlay packet
(grid, guides, selection chrome, snap lines — renderer state composed after
the authored packet, I31) is decoded by the Rust encoder and appended to the
scene after the authored content. Overlay geometry stays out of the document;
its *rendering* moves from the TypeGPU host into Vello, exactly as react-vello
demonstrates (its own present pipeline and scene-encoded visuals). Overlay
text (badges, distance pills) rides Vello's glyph path later, with the text
decision — the rect/line overlay vocabulary lands in this change.

**Host composites nothing; it encodes.** The TypeScript host builds the
authored packet and the overlay packet, hands the module the canvas element
once, and submits one packet per frame. `capacity-resource-cache` and the
retained command map retire with the TypeGPU submission path; the
packet-revision/document-revision sequencing and staleness rules stay intact.
The JSON packet survives for diagnostics and parity evidence, exactly as
today.

**Failure policy.** New diagnostic codes `VELLO_ENCODE_FAILED` /
`VELLO_RENDER_FAILED` with severity classes from the merged vocabulary; the
"no fallback backend" invariant (I32) holds — the Vello wgpu path is *the*
backend of this phase, not a fallback, and device loss follows the defined
recovery path.

**Verification.** A parity harness: the 10k-rect fixture and a
bezier/self-intersecting fixture render and compare against the recorded
reference hashes (re-recorded with environment noted). The present spike
records the first-frame cost and the surface/present path on the recorded
platform (the react-vello-proven shape, verified on Crafty's real stack); the
Firefox non-Windows indirect-dispatch risk from the research is verified on a
real browser. wasm32 size builds record the module-size delta before/after at
each dependency step (wgpu on wasm is heavy — Graphite's 25 MB pain is the
counterexample). Headless parity tests exercise the encode path in vitest via
the compiled module; GPU-dependent paths are covered by the spike and the
recorded environment.

**Explicitly out of scope**, recorded so they are not smuggled in: gradients
and `Paint[]`, images (roadmap 3.4), clipping, text shaping/glyph
rasterization (separate decision, though this change is the prerequisite that
makes "glyphs as paths" possible), stroke-to-fill final-quality stroking,
`vello_cpu` as the interactive renderer (it is a candidate for the future
headless/export path only), and the document-schema half of vector paths (the
data-model change).

## Capabilities

### New Capabilities

- `renderer/path-packet`: protocol v3 — what a path draw command carries, how
  rects coexist, and what the packet does not carry.
- `renderer/vello-wgpu-rasterization`: the encoder→encoding→wgpu-render→
  present path with full Rust ownership (device, surface, overlays-in-scene),
  the TypeGPU-host retirement, its failure vocabulary, and the parity
  guarantee.

### Modified Capabilities

None yet. `openspec/specs/` is still empty; the renderer capabilities this
change introduces will be extended, not rewritten, when text (glyphs as
paths) lands.

## Impact

- `packages/scene-renderer/src/draw-protocol.ts` — protocol v3, `"path"`
  geometry, stroke descriptor, fill rule.
- `packages/scene-renderer-wasm/src/lib.rs` — `vello::encoding::Encoding`
  scene encoder (authored packet + overlay packet), Vello wgpu renderer and
  present pipeline on the module-owned device and surface, boundary
  sanitization.
- `packages/scene-renderer-wasm/Cargo.toml` — `vello` (wgpu feature) +
  `vello_encoding`, pinned exactly; `wgpu` pinned to Vello's release
  (upgrades witnessed by the parity harness).
- `packages/scene-renderer-wasm/src/webgpu-renderer.ts` — canvas-element
  handoff and one packet per frame; TypeGPU scene submission and compositing
  retire (ADR 0007 reversal).
- `packages/scene-renderer/src/failure-policy.ts` — new codes with severity.
- `packages/scene-renderer-wasm/benchmarks/` — parity harness, re-recorded
  hashes with environment, present-spike report, module-size record at each
  dependency step.
- `docs/architecture/renderer.md`, `wasm-boundary.md` — protocol version,
  stage placement (Rust owns device, surface, render and present; the host
  composes the overlay packet and encodes frames), delta retirement, packet-
  only crossing.
- `docs/architecture/research-ledger.md` — the Vello/lyon open question
  resolves to **adopted (wgpu today, measured)**.
- Tests in the surrounding style: parity, boundary rejection, protocol
  round-trip, severity mapping.
