# Research: TypeGPU WebGPU Host Spike

## Sources

### Figma rendering: Powered by WebGPU

Source: https://www.figma.com/blog/figma-rendering-powered-by-webgpu/

Relevant lessons:

- Move from implicit global graphics state to explicit draw inputs.
- Batch uniform/resource uploads instead of updating GPU state independently for every draw.
- Reuse bind groups and resources to avoid allocation and submission regressions.
- Treat asynchronous errors and device loss as normal runtime inputs.
- Measure across device classes and keep a controlled fallback path during rollout.

Crafty implication: preserve the coarse Rust/WASM render-packet boundary, then improve the TypeScript host and resource policy. Figma's architecture supports keeping a compiled renderer core while changing the graphics backend.

### TypeGPU documentation

Sources:

- https://docs.swmansion.com/TypeGPU/
- https://docs.swmansion.com/TypeGPU/getting-started
- https://docs.swmansion.com/TypeGPU/tooling/ai-tools
- https://docs.swmansion.com/TypeGPU/tooling/unplugin-typegpu

Relevant capabilities:

- A single `d.*` schema can describe GPU layout, CPU buffer layout, and TypeScript types.
- Typed vertex layouts and render pipelines can make buffer/shader wiring explicit.
- `tgpu.initFromDevice(device)` can wrap an existing WebGPU device, which fits Crafty's existing device initialization boundary.
- One root should own the resource graph for the host/device lifecycle.
- TypeGPU shader functions require a build transform; the documented plugin support does not list Next.js Turbopack.

The current npm version observed during research was `0.11.9`. The installed official agent skill targets `0.11.2`; implementation must pin and verify the selected version rather than assume compatibility.

### Current Crafty implementation

Relevant files:

- `packages/scene-renderer/src/draw-protocol.ts`
- `packages/scene-renderer-wasm/src/webgpu-renderer.ts`
- `packages/scene-renderer-wasm/src/index.ts`
- `docs/editor/renderer-contract.md`
- `docs/editor/wasm-boundary.md`

Current behavior already has a useful coarse boundary and structured diagnostics, but the host uses handwritten WGSL, a manually packed vertex array, one growing GPU buffer, and one render pass per frame. It intentionally has no WebGL fallback today.

## Open Decisions

- Whether the Next.js build can support the TypeGPU shader transform without moving the host to another package/build.
- Whether TypeGPU improves measurable correctness or maintainability enough to justify the added dependency and tooling.
- Whether Crafty should implement an alternate fallback backend or keep explicit degraded rendering for the first native slice.
