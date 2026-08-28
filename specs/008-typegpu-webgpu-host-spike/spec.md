# Feature Spec: TypeGPU WebGPU Host Spike

## Problem

Crafty's Rust/WASM renderer now produces a versioned `RenderFrame`, but the browser host still performs manual WebGPU setup and per-frame vertex-buffer submission in `scene-renderer-wasm/src/webgpu-renderer.ts`. The host does not yet demonstrate retained GPU resources, typed buffer layouts, explicit batching, or a measured device-loss recovery policy.

Figma's WebGPU migration shows that the durable boundary is not a direct API swap. It requires explicit draw inputs, batched uploads, resource reuse, compatibility testing, asynchronous failure handling, and a controlled fallback strategy.

## Product Direction

Evaluate TypeGPU as a typed WebGPU host layer while preserving Crafty's Rust/WASM render-plan boundary and editor-kernel ownership. The first result is a benchmarked, reversible renderer spike and an adoption decision, not a broad shader or document-model migration.

## Scope

- Add a pinned TypeGPU renderer-host spike with the minimum WebGPU type/tooling setup required by the selected build path.
- Keep the existing `RenderFrame` and draw-protocol version stable while translating its rectangle commands through typed vertex schemas.
- Make draw inputs explicit and batch compatible commands into reusable GPU buffers and render passes.
- Reuse pipeline, buffer, bind-group, and texture resources by stable keys where the spike requires them.
- Surface initialization failure, shader/pipeline failure, queue failure, and device loss as structured renderer diagnostics.
- Define and test the approved fallback/degradation behavior when WebGPU is unavailable or lost. Do not claim a fallback backend that has not been implemented.
- Compare TypeGPU output with the current host using deterministic command, pixel, and bounded-performance evidence.

## Non-Goals

- Replacing Rust/WASM scene traversal, geometry resolution, packet encoding, or headless rendering.
- Changing the editor-kernel document model, persistence API, or browser mutation flow.
- Adding blur, text, image, compute, MSAA, render bundles, or advanced material systems beyond what is needed to measure the host seam.
- Implementing WebGL parity or silently reintroducing a fallback backend.
- Rewriting all WGSL into TypeScript shader functions before the build compatibility gate passes.

## Acceptance Criteria

- The spike consumes the existing versioned `RenderFrame` without per-shape JS/WASM calls and without changing the Rust packet contract.
- A typed vertex schema and explicit pipeline contract are used for the rectangle path, or the adoption decision documents why the current build path prevents that integration.
- Repeated renders reuse compatible GPU resources and do not allocate an unbounded new vertex buffer or pipeline per frame.
- For the representative scene, TypeGPU and the current renderer produce the same draw ordering, command count, geometry bounds, and deterministic pixel reference within documented tolerance.
- Device loss and initialization failure preserve the last authored document and last valid packet, return structured diagnostics, and produce an explicit user-visible degraded state.
- The fallback decision is backed by a capability matrix and tests; no unsupported WebGL or alternate backend is presented as available.
- Performance is measured for the 10,000-rectangle and 1,000-node changed-batch fixtures using the existing renderer budgets, with hardware and browser recorded.
- `npm run build`, `npm run typecheck`, `npm run test`, `npm run lint`, `npm run format:check`, and Rust tests pass.
