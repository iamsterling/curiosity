# ADR 0010: Vello wgpu Adoption with Full Canvas Ownership

Status: Accepted — implemented
Date: 2026-08-08
Implementation status: The encoder, the module-owned device/surface/present
path and the host handover are implemented and verified headless (cargo tests,
encode-level parity harness, protocol-v2 retention). On-screen verification —
first-frame timings, the Firefox non-Windows `dispatchWorkgroupsIndirect`
check, and pixel-identity on real hardware — is pending the real-browser spike
(openspec change `vector-path-rendering`, tasks 2.1–2.6, 6.4, 7.3); nothing in
this record claims it is done.

## Context

Crafty's renderer drew exactly one primitive — solid-filled axis-aligned
rectangles — until this change. The vector-path data model made paths
representable in the document, but nothing could draw them; roadmap 3.3 was
blocked on a rendering decision. Three primary-source research reports were
completed on 2026-08-07 to settle how:
[`docs/research/graphite-reverse-engineering.md`](../../../docs/research/graphite-reverse-engineering.md)
(dual-renderer divergence and per-drag document re-evaluation as the walls to
avoid), [`docs/research/vello-vector-rasterization.md`](../../../docs/research/vello-vector-rasterization.md)
(Vello 0.9.0: analytic area AA, both fill rules, GPU-side tessellation, text
via glifo/skrifa in the same pipeline, pre-1.0 with ~3 breaking releases/yr,
Firefox non-Windows `dispatchWorkgroupsIndirect` uncertainty), and
[`docs/research/lyon-and-cpu-tessellation.md`](../../../docs/research/lyon-and-cpu-tessellation.md)
(lyon 1.0.20: stable, both fill rules, no AA of its own, stroke-quality
ceiling, no text story).

The boundary history this decision reverses in part:

- **ADR 0003** ratified the coarse one-versioned-packet-per-frame boundary and
  the clause "TypeScript owns WebGPU resources". The packet rule survives
  unchanged; the GPU clause moves deliberately.
- **ADR 0007** adopted a bounded TypeGPU host (runtime API, raw WGSL shaders)
  as the canvas substrate. Its canvas role — device ownership, compositing,
  retained submission — is what this change retires. The TypeGPU-era failure
  vocabulary stays in the policy file as legacy stages.

The de-risking prototype (`benchmarks/vello-cpu-prototype-report.md`) added the
decisive correction: `vello_cpu` 0.2.0 **does not share the scene model** with
the wgpu line — it exposes its own PostScript-style `RenderContext` API and
does not consume `vello_encoding`. The staged plan's Phase A (vello_cpu first,
wgpu later, "same encoder both phases") would therefore have built the
interactive encoder twice. This change goes straight to the wgpu line and
builds it once, against `vello::encoding::Encoding` — the scene model the wgpu
renderer consumes.

## Constraints

- The packet is the only per-frame crossing, and it is one-way (JS → WASM) —
  the ADR 0003 rule, unchanged. No per-shape calls; no pixel readback to the
  host.
- Overlays are renderer state composed after the authored packet (I31): their
  *composition* stays in the host; only their *drawing* moves into the scene.
- The "no fallback backend" invariant (I32) holds: the wgpu path is *the*
  backend, not a fallback. WebGPU unavailability is a diagnostic.
- Rendering never mutates authored state (I28); a render failure preserves the
  last valid frame (I29) and the document.
- Pins are exact and move together; upgrades are witnessed by the parity
  harness, never by faith. Every size/perf claim is a measurement with a
  recorded environment — no invented budgets (`performance.md`).
- Headless testability is preserved: the encoder runs in `cargo test` with no
  GPU, and the compiled module's `encode_frame` is the wasm-level parity hook.
- Vello's documented failure mode (vello#470: a NaN or overflowing float drops
  a scene to ~12fps) is rejected at the boundary, not propagated.

## Options Considered

- **Vello classic (wgpu), now — full Rust canvas ownership** (chosen). Text
  and paths flow through the same pipeline, so roadmap 3.1 (text) and 3.3
  (paths) become one rendering system — the roadmap's "which choice also
  serves glyph rasterization later" test is the discriminator. The module
  creates the wgpu instance, adapter, device, queue **and the surface**; Vello
  renders the authored packet and the overlay packet into one scene; a
  module-owned present pipeline draws to the surface. This is the model
  react-vello ships in production on the same stack (wasm-bindgen, wgpu,
  Vello), independently implemented — the react-vello research
  (`docs/research/react-vello-declarative-renderer.md`) is the source of the
  shape, not of the code. Costs accepted: a heavy wasm dependency (measured:
  shipped module 1,637,283 raw / 484,923 gzip, +1,462,504 raw / +412,298 gzip
  vs the pre-Vello module), pre-1.0 release churn, and a real-browser
  verification backlog.
- **lyon**. Stable (1.0 since 2022), boundary-preserving, both fill rules,
  in-tessellator self-intersection handling. Rejected: text-blind (glyphs
  would be a second, separately-built pipeline), documented stroke-quality
  ceiling (spikes, alpha double-blend; stroke-to-fill not shipped), and AA
  needs MSAA 4x — a resolve pass every frame. **Flip condition:** a hard
  product constraint "no pre-1.0 dependency and no wgpu on wasm, ever",
  combined with a decision that glyph rasterization will be a separate atlas
  path anyway.
- **Analytic-AA fringes**. Smallest start, zero new Rust. Rejected: every
  future feature (strokes, gradients, images, clipping, glyphs) is a fresh
  pipeline-and-AA investigation, and Vello itself uses MSAA for stroke
  joins/caps — evidence that fringe-only is the risky part. **Flip
  condition:** a hard product constraint "zero new Rust", paying bespoke
  pipelines forever.
- **Stencil-then-cover**. Rejected outright: evenodd is trivial but nonzero
  fill is hard (the NV_path_rendering problem Figma-era hardware hit),
  pass-heavy, and it reimplements the whole pipeline; Impeller has not shipped
  it either.
- **tiny-skia**. Rejected for the interactive path: CPU rasterization inverts
  the ratified boundary and cannot serve large scenes. It remains a credible
  export/thumbnail candidate for roadmap 4.4, evaluated separately.
- **Staged vello_cpu first, wgpu later**. Rejected by prototype evidence:
  vello_cpu 0.2.0 does not share the scene model, so Phase A would have built
  the interactive encoder twice. `vello_cpu` stays a **dev-only headless/export
  candidate** (moved to `[dev-dependencies]` in this change's close-out after
  an audit found no shipped consumer; the shipped module is byte-identical —
  LTO already dead-stripped it).
- **The staging-readback split** (pixels cross back to the host per frame,
  two devices, TypeGPU keeps compositing). Rejected: it existed only to keep
  TypeGPU compositing, which the scene can do itself, and it bought two devices
  and a per-frame pixel crossing.
- **DOM-mediated blit** (let wgpu present through a DOM-composited canvas).
  Rejected: Graphite's counterexample (`graphite-reverse-engineering.md`
  §c.8); the module-owned surface is the direct path.
- **Keep the TypeGPU host**. Rejected by the same reasoning that rejected the
  split: TypeGPU has no path into Vello's renderer (no wasm API imports a
  browser device into wgpu), and a second device on one adapter carries
  cross-queue synchronization hazards.

## Decision

**Adopt Vello 0.9.0's wgpu renderer now, with full Rust ownership of the
canvas** — the react-vello model, adopted: the WASM module creates the wgpu
instance, adapter, device, queue **and the canvas surface**; the Rust encoder
builds one `vello::encoding::Encoding` per frame from the authored packet
**and** the decoded overlay packet (overlays appended after the authored
content); Vello renders into a module-owned offscreen texture; the module's
own present pipeline (own WGSL, `present.wgsl` — a fullscreen textured quad,
not copied from react-vello) draws to the surface. There is no pixel crossing
back to the host; the only per-frame crossing is the packet, JS → WASM, one-way.

Explicit choices, with why:

- `AaSupport::area_only()` — the default compiles the Area, MSAA8 and MSAA16
  shader permutations at startup and only Area is ever requested; the react-vello
  research measured that two thirds of startup shader compilation is otherwise
  paid for and never used.
- Surface format Rgba8Unorm when offered, Bgra8Unorm otherwise — the offscreen
  target is Rgba8Unorm, so the preferred choice makes the present pass a pure
  copy on every platform; the fallback covers the browser-preferred byte
  orders on macOS/Windows with identical displayed pixels.
- Alpha mode PreMultiplied (Auto fallback) — matches the retired host's
  `context.configure`, and the presented content is fully opaque, so the
  composite equals opaque mode.
- Present mode Fifo — the only mode the WebGPU spec guarantees, and the
  browser default the retired host never overrode. `desired_maximum_frame_latency`
  is 2, the browser-fixed value on WebGPU.
- Present is the commit point — if any step fails, nothing is presented, so
  the surface keeps showing the last valid frame by construction.
- The interactive encoder targets `vello_encoding` directly (the scene model
  the wgpu renderer consumes). `vello_cpu` is not the interactive renderer and
  ships in no module: it remains a headless/export candidate for roadmap 4.4,
  evaluated separately, and is dev-dependency-only from this change's close-out.

**ADR 0007 reversal, recorded:** the TypeGPU host's canvas role retires —
device ownership, scene submission, retained compositing (`capacity-resource-cache`,
`ordered-submission-batches`, `typegpu-rectangle-host`), and the `typegpu`
dependency are gone with the submission path. The host retains exactly: overlay
packet composition (I31), frame encoding (packet serialization), the
packet-revision/document-revision sequencing and staleness rules, and the
mapping of module strings onto the failure-policy vocabulary. ADR 0003's
coarse-boundary rule is unchanged; its GPU clause ("TypeScript owns WebGPU
resources") is deliberately moved for the canvas, and `wasm-boundary.md`'s
stage table records the new placement.

This decision does **not** cover: gradients and `Paint[]`, images, clipping,
text shaping/glyph rasterization (a separate decision, though this change is
the prerequisite that makes "glyphs as paths" possible), stroke-to-fill
final-quality stroking, moving overlay *composition* into Rust (the host
composes; Rust draws), a second device, or any pixel readback.

## Consequences

Easier:

- One encoder and one scene model for the interactive line; the text decision
  lands in the same pipeline instead of a second one.
- Overlays composite in the scene — no second GPU stack, no per-layer
  submissions, no retained command map, no changed-node merge (Vello is
  immediate-mode; the scene re-encodes every frame in Rust, bounded by packet
  size, not document size — Graphite's measured document-graph re-evaluation
  tax does not exist here).
- The staging readback and the two-device adapter question are gone — there is
  one device and it is Rust's.
- Device loss has a defined recovery: re-run `init_canvas`; the module rebuilds
  device and resources without rebuilding the module.

Harder:

- wgpu on wasm is heavy — the measured shipped-module delta is on record
  (+1,462,504 raw / +412,298 gzip vs pre-Vello), CI-enforced at 1,700,000 /
  510,000, and the cost is a one-time immutably-cached download. Graphite's
  25 MB remains the counterexample that this is still the right trade.
- Vello is pre-1.0 with ~3 breaking releases/yr and its `wgpu` pin moves with
  it; all pins are exact and upgrades are witnessed by the parity harness.
- Immediate-mode re-encode retires the delta for authored geometry: every
  frame re-encodes in Rust. The packet-revision / document-revision sequencing
  and staleness rules are untouched.
- Browser-side verification is a real backlog: first-frame GPU stall (research
  estimate up to ~1.5 s), Firefox non-Windows `dispatchWorkgroupsIndirect`, and
  on-screen pixel parity (including the deliberate compositing-order change —
  grid now composites above selection chrome and the preview) are pending the
  real-browser spike; no results are fabricated in the interim.

Documents that must change (done in this change): `renderer.md`,
`wasm-boundary.md` (protocol v3, stage placement, overlays in the scene,
TypeGPU-host retirement), `research-ledger.md` (react-vello row → adopted,
measured), this ADR, and the 0007 pointer added in the same edit. The docs the
code now contradicts were fixed in the same change: `performance.md`'s
TypeGPU-era measurement references, `current-state.md`'s pointer-to-pixels
trace, `invariants.md`'s I31/I33 enforcement citations, and
`renderer-build.md`'s pipeline and upgrade-procedure text.

## Risks

- **Browser-GPU maturity is unverified in this environment.** First-frame
  timings, the Firefox non-Windows indirect-dispatch check, on-screen pixel
  identity, and device-loss recovery on hardware are pending the real-browser
  spike. How it shows up: a blank canvas, a multi-second first frame, or a
  platform where Vello's compute path fails — each is a structured diagnostic
  (`VELLO_ENCODE_FAILED` / `VELLO_RENDER_FAILED` / `WEBGPU_DEVICE_LOST`) with
  the last valid frame preserved, never a silent fallback.
- **Vello pre-1.0 churn.** A breaking release lands under us; the parity
  harness is the tripwire, and the pins move together with the measurement
  recorded before any bump.
- **vello#470 failure class.** A hostile or buggy packet reaches the encoder;
  the finiteness boundary (`VELLO_ENCODE_FAILED:<node>:<field>`, including
  f64 values that overflow the f32 streams) is the defense, tested headless.
- **The compositing-order difference is misread as a regression.** The scene
  draws authored + preview, then selection, then grid/guides — the retired
  host drew grid below selection. This is renderer state (I31); the spike's
  pixel references must witness it as expected.

## Validation

- Protocol v3 round-trip and v2-retention tests; the v2 packets the interactive
  encoder produces flow through the v3 pipeline unchanged
  (`benchmarks/protocol-v2-batch.test.ts`).
- Cargo tests (29): `(zIndex, order)` draw sequence via the COLOR-tag order
  witness, overlay-after-authored order, culling, fill rules, stroke
  descriptors, determinism, and the non-finite boundary rejections.
- Encode-level parity harness in vitest against the compiled module: fixtures
  pinned to recorded stream fingerprints, references re-recorded 2026-08-08
  with the environment noted, missing-reference and stale-reference failure
  paths asserted (`benchmarks/encode-parity.test.ts`,
  `benchmarks/parity-references.ts`).
- Render failure preserves the last valid frame and the document; stale frames
  still discarded; non-finite input rejected at the boundary (wasm host tests).
- Size records with environment and toolchain at each dependency step; the
  shipped artifact is CI-ceilinged as a regression tripwire, not a target.
- `npm run typecheck` / `npm test` / `npm run lint` / `npm run format:check` /
  `npm run build` all green (close-out 8.2).
- **Pending, recorded as pending:** first-frame timings, Firefox
  non-Windows indirect-dispatch, and on-screen pixel references (tasks 2.4,
  2.5, 6.4, 7.3) — all need a real browser, which this environment does not
  have. No result is claimed for them.

## Revisit When

- The real-browser spike (tasks 2.4/2.5) reports: a first-frame stall far above
  the research estimate, a Firefox non-Windows `dispatchWorkgroupsIndirect`
  failure, or on-screen pixels that fail the parity requirement. Any of these
  reopens the platform-support question.
- A Vello release changes the scene model or the renderer embedding API; the
  parity harness must witness the upgrade before the pins move.
- The text decision (roadmap 3.1) lands: it extends this decision — glyphs
  flow through the same pipeline — and its own ADR should cite this one.
- The flip conditions of the rejected alternatives become product constraints:
  "no pre-1.0 dependency and no wgpu on wasm, ever" (→ lyon), or "zero new
  Rust" (→ analytic fringes). Either is a product-level constraint not
  currently in force.
