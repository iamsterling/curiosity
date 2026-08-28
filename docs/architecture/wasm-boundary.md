# The JavaScript / WASM Boundary

Status: **Current** for the boundary shape. **Transitional** for the transport.
The GPU clause of the original decision is deliberately reversed: Rust owns the
device, surface, render and present (recorded in ADR 0010, this change's
close-out); the packet remains the only per-frame crossing, one-way.

Ratified by [ADR 0003](adrs/0003-coarse-render-boundary.md). Detailed primary-source
research: [`../research/rust-wasm-boundary.md`](../research/rust-wasm-boundary.md)
and the react-vello model study
([`../research/react-vello-declarative-renderer.md`](../research/react-vello-declarative-renderer.md)).

## The decision

**Coarse, and now one-way.** TypeScript sends a validated scene snapshot or a
changed-node batch; Rust resolves geometry into a versioned render packet;
the host composes the overlay packet and submits one packet per frame; the
module encodes, renders and presents on its own device and surface. There is
no pixel readback to the host.

**There is no per-shape JS/WASM call in the render loop.** That is the whole
point. A boundary crossed once per frame is an engineering decision; a boundary
crossed once per shape is a performance ceiling you cannot raise later without
rewriting both sides.

The framework-neutral `@crafty/scene-api` sits above this boundary. Its
disposable serializable primitive descriptions resolve purely into `RenderFrame`
packets; it imports no Vello, wgpu, or WASM implementation. The optional React
entry point only collects React props and submits the resulting packet, and does
not become a second document or an editing path.

## Where the crate lives

`packages/scene-renderer/rust/` — `Cargo.toml`, `rust/src/lib.rs` (~3,100 lines),
dependencies `serde`, `serde_json`, `wasm-bindgen`, and the pinned Vello line
(`vello` 0.9.0 with the wgpu feature, `vello_encoding` 0.9.0, `wgpu` 29.0.4 —
upgrades witnessed by the parity harness), plus wasm32-only `web-sys`/`js-sys`.
Built by `scripts/build-scene-renderer-wasm.mjs`:

```
cargo build --target wasm32-unknown-unknown --release
wasm-bindgen target/.../crafty_renderer_wasm.wasm --out-dir pkg --target web
```

`crates/crafty-renderer-wasm/src/` is an **empty leftover directory**. Ignore it;
it is a delete candidate.

## The exported surface

The boundary is the methods on `RendererCore` (`lib.rs`). Two families:

**Packet production (v2 scene → v3 packet, headless):**

```rust
RendererCore::new()
RendererCore::set_scene(scene_bytes: &[u8], frame_id: &str, delta_json: Option<String>)
RendererCore::set_viewport(...)
RendererCore::set_selection(selected_layer_id: Option<String>)
RendererCore::render() -> Result<String, JsValue>     // JSON RenderFrame
RendererCore::encode_frame(frame_json: &str) -> Result<String, JsValue>
//   {bytes, fingerprint, paths, segments} — headless encode-level parity hook
```

**The GPU line (wasm32 only):**

```rust
RendererCore::set_error_callback(callback)   // MUST precede init_canvas
RendererCore::init_canvas(canvas)            // surface (+ shared device/renderer on first call)
RendererCore::render_packet(frame_json)      // encode + render + present; the per-frame crossing
RendererCore::recover_canvas(canvas)         // device-loss recovery: resets the shared GPU stack, re-inits
```

The module owns **one** device/queue/renderer per module instance (first
`init_canvas` builds it; later calls — editor remounts — reuse it and create
only a new surface for their canvas; `recover_canvas` is the sole exception,
resetting the stack after a real device loss). This is deliberate: two
concurrent `requestAdapter` chains make the browser cancel the in-flight
request, and the cancelled promise fires a JsFuture closure that js-sys
already freed at settlement — the "closure invoked recursively or after
being dropped" panic (wasm-bindgen#3294, reproduced on every page load with
two init sequences). One chain, settled once, cannot double-fire.

The panic class is additionally made impossible at the build: js-sys frees a
JsFuture's once-closures at settlement from inside the invoked one, so a
browser firing a cleared reaction again would call a freed wrapper — the
generated glue's `real` is patched at build time
(`scripts/patch-wbg-closures.mjs`) so a zeroed slot is a logged no-op
instead of a wasm call (`src/wbg-closure-guard.test.ts` pins the invariant).
The module cannot fix js-sys's internals; the guard keeps the frame alive
either way.

Per frame the host calls `render()` (or re-encodes a batch packet) to obtain
the packet, composes the overlay packet, and calls `render_packet` exactly
once. `encode_frame` is the headless witness and the parity hook, not a render
path.

Keeping this surface small is a design constraint, not an accident. Every method
added is a synchronisation point that has to be sequenced, versioned and tested.

## Stage placement

| Concern | Owner | Why |
|---|---|---|
| Commands, transactions, history, validation | **TypeScript** | Editing semantics must be testable headless and fast to iterate on |
| Input, tools, gestures | **TypeScript** | DOM-adjacent, and the reducer must be trivially testable |
| Persistence, HTTP | **TypeScript** (app) | Process boundary |
| Geometry traversal, transform composition, colour parsing, packet encoding, ordering | **Rust** | Deterministic, hot, and reusable for headless export and future native hosts |
| Vello scene building (authored packet + overlay packet, `(zIndex, order)` sequence) | **Rust** | The scene model the renderer consumes; deterministic and pinned by the parity harness |
| WebGPU device, adapter, queue, canvas surface, renderer, present pipeline | **Rust** (wasm32) | Deliberate reversal of ADR 0003's GPU clause (react-vello model): the module owns device, surface, render and present; the host hands over the canvas element once and submits the packet. ADR 0010 records the reversal |
| Overlay packet composition (grid, guides, selection chrome) | **TypeScript** | Overlays are renderer state composed after the authored packet (I31); only their *drawing* is Rust's |
| Layout, spatial index rebuild, thumbnails, export prep, font processing, migrations | **Workers — target** | Only after serialization cost is measured |

The rule behind the table: **TypeScript owns anything that needs to change
weekly; Rust owns anything that is deterministic, hot, and stable.** The GPU
row is the deliberate exception to that rule, and it is the same exception
react-vello ships in production on this exact stack: the device is
browser-bound, but its lifetime is manageable through `wasm-bindgen` (the
canvas element is handed over once), and owning it end to end removes the
staging-readback and two-device problems of the split design.

## Transport

**Current:** `canonicalSceneBytes(scene)` in, JSON string out. Both directions
serialize.

This is documented as a **proof transport**. The measured alternative — a binary
packet with a typed layout, or writing directly into WASM linear memory and
returning an offset/length pair — is an optimisation to be justified by a
benchmark, not a prerequisite. The research report
([`../research/rust-wasm-boundary.md`](../research/rust-wasm-boundary.md))
covers the alternatives (serde JSON vs binary, transferable buffers,
SharedArrayBuffer, SIMD, LTO, allocator choice) with measured thresholds.

**Do not** change the transport speculatively. Do change it when a benchmark on a
representative fixture shows serialization dominating frame time, and record the
measurement in the ADR.

## Sequencing

Rules that already hold and must not be relaxed:

- Every render request carries `documentRevision` and a monotonic
  `requestSequence` (`wasm-bridge.ts:129`).
- A result whose revision is older than the current document is **discarded**,
  never applied.
- The renderer reports `packetRevision` and `commandCount` so staleness is
  observable (`RendererEvidence`).
- Cancellation is cooperative at boundaries. There is no way to interrupt a
  `render()` call mid-flight, which is acceptable because it is bounded and
  synchronous; it will stop being acceptable when resolution moves to workers.

## Error handling

The module reports **structured strings**, never opaque traps:

- `VELLO_ENCODE_FAILED:<node>:<field>` — the encoder rejected a non-finite or
  out-of-range value at the boundary (the vello#470 failure class); the
  packet is preserved and the document untouched.
- `VELLO_RENDER_FAILED:<stage>[:<detail>]` — an init, render or present step
  failed; nothing is presented, so the surface keeps showing the last valid
  frame.
- `WEBGPU_DEVICE_LOST:<reason>: <message>` — delivered via
  `set_error_callback` (registered before `init_canvas`; device loss can fire
  at any point after `request_device`).

The host wraps every call in a try/catch and maps the strings onto the
failure-policy vocabulary through `diagnosticFromModuleError`
(`failure-policy.ts:64`); strings the module does not own fall back to
`recordRendererFailure`. A Rust panic must never propagate as an opaque trap
that loses the document.

Rust-side rules:

- No `unwrap()` on data derived from the packet. Malformed input is a diagnostic,
  not a panic.
- Non-finite values are rejected at the boundary, not propagated to the GPU.
- Diagnostics carry stable codes, not formatted prose.
- The failure boundary is explicit: `set_error_callback` before `init_canvas`,
  and `render_packet` failing changes nothing — the last presented frame and
  the document both survive.

## Future backends

The encoder builds `vello::encoding::Encoding` — the scene model the wgpu
renderer consumes — so the same encoder feeds:

- the browser WebGPU host (today, module-owned device and surface),
- a headless `vello_cpu` host for server-side thumbnails and export (the
  prototype measured it as a candidate; its API diverges from the interactive
  line, so it is evaluated separately),
- a native `wgpu` host for a desktop app, reusing the same module-owned
  present structure.

The encoder stays pure; the hosts stay thin. The wgpu line's measured cost of
owning the GPU in Rust is on record
(`benchmarks/vello-wgpu-dependency-cost.md`: +1,462,504 raw / +412,298 gzip
shipped vs the pre-Vello module).

## Rules

- **No per-node crossings in the render loop.** If you are tempted, you need a
  batch, not a call.
- **The packet is the only per-frame crossing, and it is one-way.** One call
  (`render_packet`) carries the frame's packet JS → WASM; no pixel data
  returns to the host.
- **The boundary is versioned.** `DRAW_PROTOCOL_VERSION` gates compatibility, and
  `isSupportedDrawProtocolVersion` accepts the previous version.
- **Rust never learns product semantics.** No components, tokens, variants,
  states or triggers cross this boundary.
- **Rust never mutates the document.** It has no reference to one — it receives a
  projected scene.
- **Every new crossing is justified by a measurement**, and the measurement goes
  in the ADR.
