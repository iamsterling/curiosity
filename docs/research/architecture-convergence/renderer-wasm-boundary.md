# Renderer And WASM Boundary

## Evidence

- The TS protocol is versioned and coarse-grained in
  `packages/scene-renderer/src/draw-protocol.ts`.
- `loadWasmWebGpuRuntime` creates a long-lived Rust `RendererCore`; the host
  sends one composed packet per frame.
- Rust owns the GPU/device/queue/Vello state; encoding is separately testable.
- Error mapping and last-valid-frame behavior are tested at the TS boundary.
- The primary sources support this shape:
  [wasm-bindgen futures](https://rustwasm.github.io/docs/wasm-bindgen/reference/js-promises-and-rust-futures.html),
  [wasm-bindgen closures](https://rustwasm.github.io/docs/wasm-bindgen/reference/passing-rust-closures-to-js.html),
  [wgpu Instance](https://docs.rs/wgpu/29.0.4/wgpu/struct.Instance.html),
  [wgpu Surface](https://docs.rs/wgpu/29.0.4/wgpu/struct.Surface.html),
  [Vello Renderer](https://docs.rs/vello/latest/vello/struct.Renderer.html),
  and the [WebGPU specification](https://www.w3.org/TR/webgpu/).

## Provisional direction

Do not replace the boundary with binary transport or a new engine facade until
serialization, device recovery, and browser presentation are measured.

Keep raw GPU handles, Vello scenes/encodings, shader resources, product
semantics, and per-shape calls behind the boundary. Treat the packet as the
compatibility contract.

Focus the next renderer audit on one question: confirm the suspected split-path
inversion around `packages/scene-renderer/rust/src/lib.rs:1320-1344` and reconcile
renderer documentation with protocol v5/text and the current module-owned path.
