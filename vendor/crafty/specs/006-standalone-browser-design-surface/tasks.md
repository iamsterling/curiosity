# Tasks: Standalone Browser Design Surface

## T001 - OpenSpec and workspace shape

- **Files:** `specs/006-standalone-browser-design-surface/*`, workspace package manifests
- **Output:** approved standalone browser product boundary and package scripts
- **Verification:** spec artifacts exist and scripts are discoverable

## T002 - Scene model contracts

- **Files:** `packages/scene-model/*`
- **Output:** typed scenes, layers, frames, stories, visual overrides, revisions, canonical serialization
- **Verification:** unit tests cover valid scenes, malformed input, stale revisions, and deterministic bytes

## T003 - Loopback scene server

- **Files:** `apps/crafty-server/*`
- **Output:** local HTTP server serving the client and scene load/save/snapshot endpoints
- **Verification:** server contract tests cover loopback binding, validation, save/load, stale writes, and error responses

## T004 - Browser WebGL shell

- **Files:** `apps/crafty-web/*`
- **Output:** visible browser editor with WebGL canvas, toolbar, layer tree, inspector, and story panel
- **Verification:** browser smoke test shows seeded scene and state labels

## T005 - Canvas interaction

- **Files:** `packages/scene-renderer/*`, `apps/crafty-web/*`
- **Output:** selection, pan, zoom, move, resize, duplicate, delete, reorder
- **Verification:** interaction tests and manual browser flow

## T006 - Visual stories and states

- **Files:** `packages/scene-model/*`, `apps/crafty-web/*`
- **Output:** non-destructive Storybook-like visual state switching
- **Verification:** state switching changes rendered output and preserves base-scene bytes

## T007 - Persistence and snapshots

- **Files:** server/client persistence and snapshot modules
- **Output:** explicit save/reload and deterministic snapshot capture
- **Verification:** stale revision, reload, and byte-identical snapshot tests

## T008 - Developer run experience

- **Files:** root scripts, README, local developer documentation
- **Output:** one command starts the local server/browser flow; VS Code is optional
- **Verification:** fresh install and documented command path

## T009 - Responsive browser shell

- **Files:** `apps/crafty-web/src/App.tsx`, `apps/crafty-web/src/styles.css`, `apps/crafty-web/index.html`, `apps/crafty-web/src/components/ui/*`
- **Output:** full-viewport WebGL stage, floating sidebar trigger, responsive navigation sidebar, responsive details sheet/drawer, and browser zoom suppression.
- **Verification:** desktop and mobile browser smoke tests confirm viewport sizing, sidebar open/close, details panel behavior, custom wheel/pinch zoom, and no browser page zoom.

## T010 - Viewport geometry correction

- **Files:** `packages/scene-renderer/*`, `apps/crafty-web/src/App.tsx`
- **Output:** world-space layer bounds remain unchanged while a rotation-free viewport applies only pan and zoom; inverse hit testing uses the same transform.
- **Verification:** zoom anchor, pan, resize, and hit-test tests remain aligned at multiple zoom levels.

## T011 - Drag-to-draw visual layers

- **Files:** `packages/scene-renderer/*`, `apps/crafty-web/src/App.tsx`
- **Output:** dragging an empty canvas region previews and commits a visual rectangle layer on release; invalid/small drafts are discarded; no real component source is created.
- **Verification:** draw, cancel, minimum-size, selection, save/reload, and deterministic snapshot tests.

## T012 - WASM-first renderer boundary

- **Files:** `packages/scene-renderer/*`, `specs/006-standalone-browser-design-surface/plan.md`
- **Output:** canonical scene bytes and viewport state cross a typed WASM renderer bridge; the browser fails closed when the WASM backend is unavailable.
- **Verification:** bridge contract tests cover scene serialization, viewport/device-pixel-ratio forwarding, safe initialization failure, and no-fallback diagnostics.

## T013 - Foundational WASM/WebGPU parity

- **Files:** `packages/scene-model/*`, `packages/scene-renderer/*`, `packages/scene-renderer-wasm/*`, `apps/crafty-web/*`, this spec
- **Output:** parent-local affine node transforms, transform-aware model hit testing, a versioned WASM draw-command protocol, and explicit WebGPU buffer reuse/disposal with device-loss diagnostics.
- **Verification:** scene-model and Rust tests cover transform composition and world geometry; repository checks pass; browser smoke confirms the ready WASM/WebGPU surface over the Tailscale HTTPS URL.
