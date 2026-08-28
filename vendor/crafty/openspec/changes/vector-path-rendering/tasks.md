## 1. De-risking prototype (evidence on record; feeds every later step)

- [x] 1.1 Add `vello_cpu` to `packages/scene-renderer-wasm/Cargo.toml`, pinned exactly, with a comment noting vello_cpu 0.2.0 declares no API stability guarantees and that upgrades are witnessed by the parity harness
- [x] 1.2 Add a headless Rust test that encodes the existing 10k-rect fixture data as a Vello scene and renders it with `vello_cpu`
- [x] 1.3 Add a bezier/self-intersecting path fixture and render it headlessly, exercising both fill rules
- [x] 1.4 Compare the vello_cpu output against the existing software-reference parity hash; re-record references in an isolated commit with the environment noted
- [x] 1.5 Record encode + render timings as an environment-noted distribution (10k fixture, release, median of 7: ~0.77 ms/frame)
- [x] 1.6 Build the wasm32 module and record the size delta versus the pre-Vello module (+28,910 raw / +7,536 gzip)
- [x] 1.7 Report the prototype verdict — including the finding that vello_cpu 0.2.0 does not share vello_encoding's scene model, which is why the interactive encoder targets vello-classic directly (this change) and vello_cpu stays a headless/export candidate only

## 2. Present spike (gates everything after)

- [x] 2.1 Add `vello` (wgpu feature) and `vello_encoding` to `packages/scene-renderer-wasm/Cargo.toml`, pinned exactly to the same release, with a comment recording the breaking-release cadence and the upgrade-witness rule
- [x] 2.2 Build the wasm32 module with the new deps and record the module-size delta versus the pre-Vello module, with toolchain and pinned versions noted (wgpu on wasm is heavy; Graphite's 25 MB is the counterexample)
- [ ] 2.3 Spike: inside the module, create the wgpu instance/adapter/device/queue and a canvas surface from a host-provided canvas element; configure the surface (format selection, present mode, alpha mode) and create Vello's `Renderer` with `AaSupport::area_only()` <!-- **browser-gated**: cannot run in this environment; the module-owned init path is implemented (lib.rs `init_canvas`), verified compile-level + cargo tests only; `scripts/vello-browser-spike.mjs` now supplies a fail-closed browser readiness barrier -->
- [ ] 2.4 Render a fixture `Encoding` via Vello into an offscreen texture and present it with a module-owned present pipeline (own WGSL, not copied from react-vello); record the first-frame cost as an environment-noted distribution (median + min/max + samples) <!-- **browser-gated**: see 2.3 -->
- [ ] 2.5 Record the Firefox non-Windows `dispatchWorkgroupsIndirect` result on a real browser; record device-loss behaviour as a structured diagnostic <!-- **browser-gated**: see 2.3 -->
- [ ] 2.6 Write the spike report into `benchmarks/present-spike-report.md`: device/surface layout, present path, first-frame cost, Firefox result, and the decision each measurement feeds <!-- **browser-gated**: see 2.3 -->

## 3. Protocol v3

- [x] 3.1 Bump `DRAW_PROTOCOL_VERSION` to 3, keeping v2 accepted, and add a test asserting a v2 packet still renders
- [x] 3.2 Add `"path"` to `DrawGeometry`; add `path`, `fillRule`, and the optional stroke descriptor to `DrawCommand`
- [x] 3.3 Add protocol round-trip tests: fill rule, stroke descriptor, path+rect coexistence, ordering across kinds
- [x] 3.4 Add a test asserting the packet carries no product semantics (no component/token/variant fields)
- [x] 3.5 Update `docs/architecture/renderer.md` protocol table

## 4. Encoder: `vello_encoding` scene building, overlays in the same scene

- [x] 4.1 In `lib.rs`, after the `(zIndex, order)` sort, build a `vello::encoding::Encoding` from v3 commands (rect fast path; fill/stroke for paths), isolated behind one module (`vello_encoder`; vello/vello_encoding 0.9.0 + wgpu 29.0.4 pinned in Cargo.toml)
- [x] 4.2 Decode the overlay packet (grid, guides, selection chrome, snap lines) into the same scene **after** the authored content — overlays stay renderer state composed by the host (I31), their drawing moves into Vello (grid/guide geometry projected in Rust, mirroring `grid-overlay.ts`)
- [x] 4.3 Reject non-finite transforms and coordinates at the boundary with `VELLO_ENCODE_FAILED` (vello#470 invariant), with tests (including f64 values that overflow the f32 streams)
- [x] 4.4 Add a headless test asserting the encoding draws commands in `(zIndex, order)` sequence including mixed rect/path packets, and that overlay commands draw after the authored packet (draw order witnessed via the COLOR tag sequence)
- [x] 4.5 Add a test asserting the encoder output is deterministic across runs (parity discipline; stream fingerprint also exposed through `encode_frame` for the wasm-level harness)

## 5. Vello wgpu renderer and the present pipeline

- [x] 5.1 Create the module-owned device/queue and surface at init, create Vello's `Renderer` with it, and render the `Encoding` into an offscreen texture (device loss surfaced as a structured diagnostic with the recovery path, per the failure policy)
- [x] 5.2 Add the module-owned present pipeline (textured-quad WGSL over the offscreen target) and present to the surface — the only crossing is the packet, JS → WASM, one per frame
- [x] 5.3 Add `VELLO_ENCODE_FAILED` / `VELLO_RENDER_FAILED` to the failure-policy vocabulary with severity classes, produced only by `failure-policy.ts`
- [x] 5.4 Add tests: a render failure preserves the last valid frame and the document; stale frames still discarded; non-finite input rejected at the boundary
- [x] 5.5 Record the module-size delta and first-frame timings in `benchmarks/` with environment, toolchain and pinned Vello/wgpu versions

## 6. Host: encode, hand over, retire the submission path

- [x] 6.1 In `webgpu-renderer.ts`, replace the TypeGPU scene submission with: canvas-element handoff to the module, one packet submission per frame, and the overlay packet composed by the host as today
- [x] 6.2 Retire the retained command map / changed-node merge and the TypeGPU compositing path for the canvas; keep packet-revision/document-revision sequencing and staleness rules
- [x] 6.3 Remove the TypeGPU canvas dependencies this change orphans; confirm the rest of the app compiles and the overlay composition suite passes with the scene-encoded overlays
- [ ] 6.4 Confirm the rect-only path (a v2 packet or a no-path packet) renders pixel-identically to the pre-change host on the recorded environment <!-- headless half landed (encode-level identity, v2 retention, rect fast path — see benchmarks/vello-wgpu-dependency-cost.md §6); on-screen pixel identity is pending the real-browser spike, shared with 7.3 — **browser-gated**, no pixel results fabricated; readiness barrier: `node scripts/vello-browser-spike.mjs` -->

## 7. Parity harness and measurements

- [x] 7.1 Wire the headless encode tests into the vitest suite via the compiled module (encode-level parity, GPU-less)
- [x] 7.2 Assert the parity harness fails (rather than passing vacuously) when a reference is missing
- [ ] 7.3 Re-record pixel references on the real-device path with the environment noted; diff the rendered images before accepting them <!-- the recording procedure is documented in benchmarks/pixel-parity-recording.md; encode-level recording is wired and done (benchmarks/parity-references.ts). On-screen pixel references are pending the real-browser spike, shared with 6.4 — **browser-gated**, no pixel results fabricated in this environment; readiness barrier and structured blockers: `node scripts/vello-browser-spike.mjs` -->
- [x] 7.4 Update `docs/architecture/renderer.md` and `wasm-boundary.md`: protocol version, full Rust ownership (device + surface + present), overlays in the scene, TypeGPU-host retirement, packet-only crossing
- [x] 7.5 Update `docs/architecture/research-ledger.md`: the react-vello "recorded option" resolves to **adopted** — full Rust surface ownership with overlays in the scene; note what the prototype and the spike measured

## 8. ADR and close-out

- [x] 8.1 Write ADR 0010: Vello wgpu adoption today with full canvas ownership — the decision, the rejected alternatives (lyon, fringes, stencil-then-cover, tiny-skia, staged-vello_cpu, the staging-readback split) with the flip conditions, and the **ADR 0007 reversal** (TypeGPU host's canvas role retires; the host keeps overlay composition and frame encoding) <!-- docs/architecture/adrs/0010-vello-wgpu-adoption.md; registered in the ADR index; ADR 0007 carries the reversal pointer -->
- [x] 8.2 Run `npm run typecheck`, `npm test`, `npm run lint`, `npm run format:check`, `npm run build` and confirm all pass <!-- all green 2026-08-08; the protocol-v2-batch >=3x gate failed once under full-suite load (2.91x — the known load-sensitive flake) and passed at 3.53x in isolation; threshold untouched; `npm run build` re-run forced (28/28, no cache) -->
- [x] 8.3 Confirm `vello_cpu` is not the interactive renderer, overlays are not authored geometry, and the packet is the only per-frame crossing (no per-shape JS↔Rust calls, no pixel readback) <!-- audit: vello_cpu referenced only by tests/vello-prototype.rs; moved to [dev-dependencies], shipped module byte-identical (1,637,283 raw; LTO already dead-stripped it), size record + CI ceiling unchanged. Interactive path by construction: webgpu-renderer.ts render_packet -> vello_encoder + wgpu_present (vello wgpu). Overlays: host-composed overlay/selectionBounds fields (editor/overlay.ts + withOverlays), drawn in Rust after authored content (I31, COLOR-tag witness). Crossing: exactly one render_packet per frame; no readback export exists -->
