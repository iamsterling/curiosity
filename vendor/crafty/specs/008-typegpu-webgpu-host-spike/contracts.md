# Contracts: TypeGPU WebGPU Host Spike

## Existing Render Packet

The spike consumes the existing `RenderFrame` contract:

- `protocolVersion` must equal `DRAW_PROTOCOL_VERSION`.
- `frameId` identifies the rendered frame.
- `viewport` contains dimensions, pixel ratio, pan, and zoom.
- `commands` contain stable node IDs, bounds, affine transforms, RGBA fill, opacity, z-order, and traversal order.
- `selectionBounds` is an overlay input and is not authored document state.

The Rust/WASM packet producer remains unchanged in this change.

## Candidate Host

```ts
interface RendererHost {
  render(frame: RenderFrame, canvas: HTMLCanvasElement): RendererResult;
  dispose(): void;
}
```

The implementation may use TypeGPU internally, but callers depend only on the existing `SceneRenderer` and `WasmRendererInstance` contracts.

## Typed Rectangle Vertex

The candidate rectangle path must define one stable vertex layout containing at least:

- clip-space or screen-space position
- RGBA color

If opacity is not folded into color before upload, opacity must be an explicit field. The layout must be shared by the vertex shader input and the CPU upload path; no untyped positional casts are allowed in the candidate host.

## Diagnostics

Candidate failures use existing renderer diagnostics where possible:

- `CANVAS_NOT_READY`
- `WASM_MODULE_UNAVAILABLE`
- `WASM_MODULE_FAILED`
- `WASM_RENDER_FAILED`
- `WEBGPU_DEVICE_LOST`

New diagnostics must identify the stage (`typegpu-init`, `pipeline`, `buffer-upload`, `submit`, or `device-loss`) and preserve the last valid packet/document.

## Determinism Evidence

For identical `RenderFrame` input, the host must report or test:

- identical command ordering
- identical command count
- identical transformed geometry bounds
- stable serialized vertex data or an approved numeric tolerance
- stable pixel reference or an approved pixel tolerance
