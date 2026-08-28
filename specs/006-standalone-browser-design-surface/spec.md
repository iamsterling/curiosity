# Feature Spec: Standalone Browser Design Surface

## Problem

Crafty currently presents a mostly inert VS Code workbench, while the intended product is a local visual design surface: a Figma/Pencil-like canvas for composing and inspecting visual representations, with Storybook-like stories and states. The first product slice must make the canvas itself useful without requiring VS Code or real executable UI components.

## Product Direction

Crafty is a local browser application backed by a local server. The VS Code extension is an optional integration adapter, not the primary product shell. The first implementation models visual scenes and visual states; real React/TSX component execution and source mutation are explicitly deferred.

## Target Users

- **Primary:** Designers creating visual compositions and inspecting states locally.
- **Secondary:** Developers reviewing visual states and deterministic output.
- **Future:** Component authors connecting visual representations to real component registries.

## User Stories

1. As a designer, I can start Crafty locally and open the editor in a browser without VS Code.
2. As a designer, I can create and select visual layers on a WebGPU canvas.
3. As a designer, I can pan, zoom, move, resize, and reorder visual layers.
4. As a designer, I can group layers into frames and inspect the layer tree.
5. As a designer, I can define Storybook-like stories, variants, and visual states for a frame.
6. As a designer, I can save and reload the scene from local storage through the server.
7. As a developer, I can capture a deterministic scene snapshot for the same scene and state.

## Initial Scope

### Local Runtime

- A local Crafty server serves the browser client and a versioned JSON scene API.
- Default bind is loopback only.
- The browser client works without VS Code.
- An installable binary is a packaging target after the local Node runtime proves useful; it is not required for the first slice.

### Visual Scene Model

- Scene, frame, group, rectangle, text placeholder, and image-placeholder visual layers.
- Stable layer IDs, bounds, fill/stroke, opacity, corner radius, visibility, and z-order.
- Frames provide a bounded viewport and layer-tree root.
- Visual layers are representations only. They are not executable React/TSX components.

### Canvas Interaction

- Select one layer.
- Pan and zoom the viewport.
- Move and resize the selected layer.
- Add, duplicate, delete, and reorder visual layers.
- Show selection bounds, handles, coordinates, and a non-color focus state.
- Keep interaction state in the browser projection; persist only explicit scene changes.

### Foundational Parity Floor

Foundational parity means the substrate can support the same class of document and rendering architecture as Penpot/Figma; it does not mean product or feature parity. Before adding richer geometry or component execution, the WASM/WebGPU path must provide:

- Stable node identity, parent-local affine transforms, deterministic world-space ordering, and transform-aware hit testing.
- A versioned draw-command protocol shared by the Rust/WASM encoder and the TypeScript/WebGPU host.
- Explicit GPU resource ownership, reuse, disposal, and device-loss diagnostics.
- Canonical scene bytes that remain the source of truth while the renderer remains a pure projection.

Vector paths, text shaping, images, constraints, auto-layout, components, collaboration, and cloud persistence remain later layers on this foundation.

### Storybook-Like Visual States

- Story entries belong to a frame.
- Each story has a name, variant/state labels, and a visual layer override set.
- A state switch changes the rendered visual representation without mutating the base scene.
- The side panel lists stories and makes the active state visible.

### Persistence And Snapshots

- Save and load scenes through the loopback server.
- Optimistic revision checks reject stale writes.
- Snapshot serialization is canonical and deterministic.
- Snapshot metadata is separate from canonical scene payload bytes.

## Non-Goals

- VS Code as the primary runtime.
- Real React, TSX, Storybook, or native component execution.
- Source-code mutation from the visual editor.
- Cloud persistence, collaboration, auth, telemetry, marketplace, or hosted deployment.
- Full Figma parity, vector editing, auto-layout, prototyping, comments, or multiplayer.
- Treating visual layers as production-ready component implementations.

## Acceptance Criteria

- `npm run dev` starts a loopback Crafty server and browser client, or the repository documents the exact equivalent command.
- Opening the local URL shows a non-empty WebGPU canvas, toolbar, layer tree, inspector, and story/state panel.
- A user can add a rectangle, select it, move it, resize it, duplicate it, delete it, and see the layer tree update.
- A user can create at least two visual states and switch between them without changing base-scene data.
- Save, reload, stale-revision rejection, and deterministic snapshot serialization have automated tests.
- The UI remains useful without VS Code.
- Existing VS Code integration remains buildable but is not required for acceptance.

## Constraints

- Preserve the existing strict TypeScript and security boundary posture.
- Validate all server JSON inputs and enforce loopback/path containment rules.
- Keep the HTML/fallback and timeline placeholder contracts intact until a later replacement decision.
- Use the WASM/WebGPU renderer directly; do not make a DOM canvas, WebGL fallback, or VS Code webview the primary renderer.
