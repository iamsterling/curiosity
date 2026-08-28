# Implementation Plan: Standalone Browser Design Surface

## Strategy

Build one vertical browser slice before attempting real component integration. Reuse the existing deterministic identity, revision, diagnostics, and snapshot concepts where they fit, but keep the new scene model independent from executable components.

## Architecture

- `apps/crafty-server`: loopback HTTP server, static client serving, scene JSON API, revision checks, and snapshot endpoint.
- `apps/crafty-web`: React browser client with a WASM-only renderer bridge.
- `packages/scene-model`: typed scene, layer, frame, story/state, revision, and canonical serialization contracts.
- `packages/scene-renderer`: model-owned selection bridge, WASM renderer contract, and viewport transform helpers with no server or React dependency.
- VS Code extension: optional adapter only; no new product behavior depends on it.

## Vertical Slice

1. Define the scene model and canonical serialization.
2. Implement the loopback server with in-memory seed scene and explicit save/load revision checks.
3. Implement the browser shell: toolbar, canvas, layer tree, inspector, and story panel.
4. Implement WASM/WebGPU rendering for frames, rectangles, text placeholders, and selection bounds.
5. Implement selection, pan, zoom, move, resize, duplicate, delete, and reorder.
6. Implement visual story/state switching through non-destructive overrides.
7. Add deterministic snapshots and browser/client contract tests.
8. Add the developer run command and document the local browser flow.

## Product Boundaries

- Visual representation is the source of truth for this slice.
- Real component source is not read, executed, or mutated.
- Server persistence is explicit and revision-checked.
- Renderer consumes canonical scene bytes and typed viewport state; it never writes persistence.
- UI owns interaction projection and sends typed scene commands.
- WASM owns authoritative scene traversal and draw-command encoding; the WebGPU host owns GPU resource submission; no browser fallback renderer is permitted.

## Foundational Parity Gate

The renderer foundation is accepted only when the scene model exposes parent-local affine transforms, the spatial index resolves world-space hits using the same transform composition as the renderer, the WASM output uses a versioned draw-command protocol, and the WebGPU host reuses and disposes GPU buffers while surfacing device loss. This is the parity floor; richer geometry and product features build on it.

## Verification

- `npm run build`
- `npm run typecheck`
- `npm run test`
- `npm run lint`
- `npm run format:check`
- Browser smoke test for start, render, select, transform, state switch, save, reload.
- Deterministic snapshot comparison for the same scene/state input.
