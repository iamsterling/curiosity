## Context

See `proposal.md` — Why. This document records the decision and the
alternatives that lost, with the research basis for each. Full evidence:
`docs/research/graphite-reverse-engineering.md`,
`docs/research/vello-vector-rasterization.md`,
`docs/research/lyon-and-cpu-tessellation.md` (all 2026-08-07).

Constraints that shape everything below:

- The coarse boundary is ratified (ADR 0003): Rust owns *what to draw*,
  TypeScript owns the GPU, one versioned packet per frame, never per-shape
  calls. **This change moves the GPU clause deliberately:** the canvas is
  fully Rust-owned (device, surface, render, present — the react-vello model,
  `docs/research/react-vello-declarative-renderer.md`), the TypeGPU host's
  canvas role retires (ADR 0007 reversal, recorded in ADR 0010), and the host
  keeps composing the overlay packet and encoding frames. The one-versioned-
  packet-per-frame rule is unchanged; the packet is the only per-frame
  crossing, and it is one-way (JS → WASM).
- The "no fallback backend" invariant (I32) holds: WebGPU unavailability is a
  diagnostic, not a trigger for a second backend. The wgpu path is the
  renderer, not a fallback.
- `docs/architecture/performance.md` forbids asserting a budget without a
  measurement; every size/perf claim in this change is a *measurement task*,
  not a budget.
- The packet never carries product semantics (I30). The scene built from it
  carries geometry, paint, order — nothing else. Overlays are renderer state
  composed after the authored packet (I31): their *composition* stays in the
  host, their *drawing* moves into the scene.
- Research agreement: the two renderer streams (Vello, lyon) disagree on
  Vello's browser-GPU maturity but agree on the de-risking experiment and on
  the "which choice serves glyphs later" test.

## Goals / Non-Goals

**Goals:**

- The authored packet (v3) renders filled and stroked paths through the
  existing WASM module via Vello's wgpu renderer, verifiably headless at the
  encode level and verified on a real device.
- Rects keep working, overlays stay rects, and the rect fast path remains.
- A pixel-parity harness exists before any renderer-specific behaviour is
  trusted, and the wasm-size cost of each new dependency is measured, not
  guessed — wgpu on wasm is heavy and Graphite's 25 MB binary is the
  counterexample.
- The present spike settles the react-vello-proven shape on Crafty's real
  stack — module-owned device + surface, Vello render, present — and records
  the first-frame cost as an environment-noted distribution before the
  encoder is built against it.
- The encoder builds `vello::encoding::Encoding` — the scene model the wgpu
  renderer consumes — isolated behind one module, with the overlay packet
  decoded into the same scene after the authored content.

**Non-Goals:**

- `vello_cpu` as the interactive renderer (its PostScript-style API does not
  share the scene model; it stays a candidate for roadmap 4.4's
  headless/export rendering, evaluated separately).
- Gradients, `Paint[]`, images, clipping, text, masks, boolean ops,
  stroke-to-fill.
- Adopting lyon, tiny-skia, analytic fringes, or stencil-then-cover — see
  Decision 1.
- Any performance budget beyond the existing recorded
  `RENDERER_BUDGETS_MS` fixtures; the new fixture measurements are recorded
  as environment-noted distributions, per `performance.md`.

## Decisions

### 1. Vello's wgpu renderer, now — not lyon, not fringes, not CPU-first

The roadmap question — "which choice also serves glyph rasterization later,
so the work is done once rather than twice" — is the discriminator:

- **Vello classic (wgpu)**: text and paths flow through the same pipeline
  (glifo/skrifa → `draw_glyphs` → the same compute rasterization), analytic
  area AA, both fill rules, GPU-side tessellation. Adopting it makes roadmap
  3.1 (text) and 3.3 (paths) one rendering system, which is the reason the
  earlier staged plan existed at all — and the reason the stage boundary was
  wrong: the staged plan's Phase A (vello_cpu) did **not** share the scene
  model with the wgpu line (prototype-verified), so it would have built the
  interactive encoder twice. Going straight to the wgpu line builds it once,
  against `vello::encoding::Encoding` — the model the wgpu renderer consumes.
- **lyon**: stable, 1.0 since 2022, boundary-preserving, but text-blind —
  glyphs would be a second, separately-built pipeline. Its stroke tessellator
  has a documented quality ceiling (spikes, alpha double-blend; stroke-to-fill
  not shipped), and its AA needs MSAA 4x, which WebGPU guarantees only at 4x
  and which costs a resolve pass on every frame.
- **Analytic-AA fringes**: smallest start, but every future feature (strokes,
  gradients, images, clipping, glyphs) is a fresh pipeline-and-AA
  investigation. Vello itself uses MSAA for stroke joins/caps — evidence that
  fringe-only is the risky part.
- **Stencil-then-cover**: rejected — evenodd trivial but nonzero hard
  (Figma-era NV_path_rendering's own known problem), pass-heavy, and it
  reimplements the whole pipeline. Impeller has not shipped it either.
- **tiny-skia**: rejected for the interactive path — CPU rasterization
  inverts the ratified boundary and cannot serve large scenes; it remains a
  credible export/thumbnail rasterizer candidate for roadmap 4.4, evaluated
  separately.

*Flip conditions, recorded.* To **lyon**: a hard constraint "no pre-1.0
dependency and no wgpu on wasm, ever", combined with a decision that glyph
rasterization will be a separate atlas path anyway. To **fringes**: a hard
constraint "zero new Rust", paying bespoke pipelines forever. Either is a
product-level constraint not currently in force; the ADR that ratifies this
decision records them.

**Costs accepted with the wgpu decision, each with its measurement task:**
wgpu on wasm is a large dependency (Graphite's 25 MB binary is the cautionary
number; the module-size delta is recorded at each dependency step); Vello is
0.9.0 pre-1.0 with ~3 breaking releases/yr and its `wgpu` pin moves with it;
Firefox non-Windows `dispatchWorkgroupsIndirect` is the research's flagged
platform risk and gets a real-browser verification; and the first-frame GPU
stall (up to ~1.5 s in the research) is measured, not assumed. The
prototype's vello_cpu measurements (+28,910 raw wasm /
+7,536 gzip, ~0.77 ms/frame CPU on the 10k fixture) remain on record as the
dependency-cost baseline and as evidence for the future headless/export path.

### 2. Rust owns the canvas end to end — the react-vello model, adopted

The module creates the wgpu instance, adapter, device, queue **and the
surface**; Vello renders the authored packet and the overlay packet into one
scene; a module-owned present pipeline (a small textured-quad shader over
Vello's offscreen target, the shape react-vello ships as `present.wgsl` —
implemented independently, not copied) draws to the surface. This is the
model react-vello has in production on the same stack (wasm-bindgen, wgpu,
Vello), and it eliminates the two problems the earlier split design carried:
the staging readback (pixels never return to the host) and the two-device
adapter question (there is one device and it is Rust's).

**Deliberately retired: the TypeGPU host's canvas role (ADR 0007 reversal).**
`webgpu-renderer.ts`'s scene submission and compositing end; the host keeps
composing the overlay packet and encoding frames. ADR 0010 records the
reversal and what the host retains. The overlay packet stays the input —
overlays are still renderer state composed after the authored packet (I31) —
but their *drawing* is decoded by the Rust encoder into the same Vello scene,
after the authored content. react-vello demonstrates the whole composite
living in the scene; Crafty's overlays (grid, guides, selection chrome, snap
lines) are rects and lines, expressible in the same vocabulary.

**Deliberately not taken:** the earlier staging-readback split (rejected:
pixels crossing back per frame, two devices, and it existed only to keep
TypeGPU compositing — which the scene can do itself); letting wgpu present
through a DOM-mediated blit (Graphite's counterexample, `graphite-reverse-
engineering.md` §c.8); moving overlay *composition* into Rust (the host
composes; Rust draws).

### 3. Protocol v3: paths ride the existing packet; rects stay first-class

`DRAW_PROTOCOL_VERSION = 3`, v2 accepted forever. `DrawGeometry` gains
`"path"`. `DrawCommand` gains: `path` geometry (node-local point records with
handles and closure — the representation the kernel already validates in the
data-model change), `fillRule: "nonzero" | "evenodd"`, and an optional stroke
descriptor (width, caps, joins, dash). Ordering stays the encoder's
`(zIndex, order)` sort; the packet carries no product semantics.

The scene maps the packet directly: insertion order is z-order (Vello has no
zIndex concept — the host orders, which the encoder already does), and
transforms are `kurbo::Affine` f64s matching the existing field shape.

### 4. Immediate-mode re-encode retires the delta for authored geometry

Vello is immediate-mode: `Scene::reset()` per frame, no retained fragments
(the recording feature was removed upstream). Consequence, accepted: the
host-side retained command map and `changedNodeIds` merge retire for authored
geometry; the scene re-encodes every frame in Rust. The whole reason the
delta existed was JSON encode cost on the JS side, which disappears when the
encoder writes binary encoding streams in-process. The packet-revision /
document-revision sequencing and staleness rules are untouched; dirty-region
reporting survives as diagnostics. Graphite's measured cost of full
re-evaluation was the *document-graph* re-run per drag — Crafty does not have
that tax; the encoder's re-encode is bounded by packet size, not document
size.

### 5. One coarse crossing per frame: the packet, JS → WASM

The host hands the module the canvas element once and submits one packet per
frame; the module renders and presents. There is no pixel crossing back —
the only per-frame crossing is the packet. Non-finite transforms and
coordinates are rejected at the boundary — Vello's documented "NaN or large
float values drop nearly any scene down to 12fps" failure (vello#470), and
Crafty already rejects non-finite viewport values the same way. The JSON
packet survives for diagnostics and parity evidence, exactly as today.

### 6. Failure vocabulary extends, does not fork

`VELLO_ENCODE_FAILED` / `VELLO_RENDER_FAILED` join the merged vocabulary with
severity classes (recoverable/critical), produced by `failure-policy.ts` —
the single producer established in the harden-wasm-webgpu-foundation change.
A render failure preserves the last valid packet; the document is untouched
(I31).

### 7. Verification is the first workstream, not the last

Sequencing in `tasks.md` follows the research's agreed de-risking order,
with the wgpu line's own spike first: (1) the **present spike** — the module
creates device + surface, Vello renders a fixture, the present pipeline draws
it (the react-vello-proven shape, verified on Crafty's real stack), recording
the first-frame cost and the Firefox non-Windows check; (2) protocol v3 + the
`vello_encoding` scene encoder; (3) the Vello wgpu renderer embedding with
overlay decoding and the present pipeline; (4) host: canvas handoff, overlay
composition, TypeGPU-submission retirement; (5) parity harness and
module-size records at each dependency step. The completed vello_cpu
prototype (1.x) stays on record: it measured the dependency cost baseline and
produced the finding that made the staged plan's encoder premise false. Each
task ships its test with it; no task is "done" without its evidence.
