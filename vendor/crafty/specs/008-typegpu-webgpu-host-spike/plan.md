# Implementation Plan: TypeGPU WebGPU Host Spike

## Strategy

Use the current renderer as the control implementation. Introduce TypeGPU behind the existing `SceneRenderer` and WASM runtime interfaces so the browser can compare hosts without changing authored state or the Rust packet producer.

The first gate is build compatibility. TypeGPU's shader-function transform plugin documents Vite, Babel, webpack, and other bundlers, but not Next.js Turbopack. If the current Next build cannot transform TypeGPU shader functions reliably, isolate the spike in a supported package/build boundary or limit the first comparison to TypeGPU resource/schema APIs with the existing WGSL path. Do not weaken the production build to force the dependency in.

## Architecture

- `packages/scene-renderer`: owns the stable renderer contract, host selection, protocol version, diagnostics, and comparison hooks.
- `packages/scene-renderer-wasm`: continues to own WASM initialization and `RenderFrame` production; adds a TypeGPU host candidate without changing the Rust boundary.
- `apps/crafty-web`: continues to own canvas lifecycle, capability messaging, and renderer projection; it does not own GPU resource graphs.
- TypeGPU: owns typed schemas, pipeline/resource declarations, buffer writes, and render submission inside the candidate host.
- Rust/WASM: continues deterministic scene traversal, transform resolution, ordering, and render-packet encoding.

## Host Flow

```text
EditorDocument projection
        -> validated Scene
        -> Rust/WASM RenderFrame
        -> host comparison boundary
        -> typed/batched GPU resources
        -> WebGPU render pass
        -> evidence and structured diagnostics
```

## Resource Policy

- Create one TypeGPU root for the host/device lifecycle; do not create roots per frame.
- Cache the pipeline and compatible vertex buffers by format/layout key.
- Reuse a capacity-sized buffer and grow only when required.
- Batch compatible rectangle commands into one upload and render pass where ordering permits.
- Keep selection and preview overlays explicit so overlay state cannot mutate authored packets.

## Failure Policy

The candidate host must distinguish unsupported WebGPU, initialization failure, shader/pipeline failure, queue submission failure, and device loss. It must keep the last authored document and last valid packet intact. The spike may report degraded rendering, but it must not claim dynamic fallback until an approved backend and recovery test exist.

## Verification

- TypeGPU schema and vertex-layout unit tests.
- Host comparison tests for ordering, geometry, resource reuse, and deterministic serialization/evidence.
- Device-loss and unavailable-WebGPU tests using a fake or controlled device boundary.
- Browser smoke test for initialization, render, edit projection, and visible degraded diagnostics.
- Performance runs for the existing 10,000-rectangle and 1,000-node changed-batch fixtures.
