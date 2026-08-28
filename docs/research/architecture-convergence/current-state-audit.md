# Current-State Audit

## Runtime map

- `packages/editor/src/kernel` owns the document, commands, transactions,
  history, selection, viewport state, and interaction reducer.
- `packages/editor/src/ui/editor/harness.ts` adapts DOM-facing events and still
  contains editing semantics such as reparent rebasing, rest-camera persistence,
  pen-session ownership, and legacy story creation.
- React consumes the editor through an external store in
  `packages/editor/src/ui/editor/editor-context.tsx`.
- `canvas-stage.tsx` owns the direct render loop and reads snapshots outside
  React rendering.
- `packages/scene-renderer` owns the TS draw protocol and Rust/WASM/WebGPU host.
- `packages/scene-store` owns document package persistence and revisions.
- `apps/web/editor` owns the Next.js route shell and route handlers.

## Important transitional seams

- Renderer input still combines legacy `Scene`, `pathCommands`, glass surfaces,
  and overlay channels. Evidence: `scene-adapter.ts`, `harness.ts`, and
  `packages/scene-renderer/src/wasm/webgpu-renderer.ts`.
- Normal selection uses document hit testing while context-menu hit testing
  still uses the legacy scene spatial index.
- Coordinate conversion has kernel, renderer, and harness responsibilities.
- Legacy story state remains connected to the current editor and states panel.
- The public MCP/command-room surface does not exist. `scene-sync` is revisioned
  command broadcast and `agent-activity.ts` is an in-process lifecycle seam.

## Documentation drift

Source is stronger evidence than prose. Current drift includes:

- `/editor` and `apps/web/editor` in code versus `/files` and older app names in
  architecture docs and some live links.
- Protocol v5 and text in code versus v4/v2/no-text claims in renderer docs.
- Component persistence and resolution in code versus “not persisted/no
  resolution” claims in current-state prose.
- Accumulating transaction previews in code versus replacing previews in docs.
- Actual tool union larger than the stale editor documentation list.

## Baseline

- Baseline commit: `03b01ca75f95badcb3bbd5eb32ba6e0ccc63a825`
- Worktree was clean before research.
- `bun run typecheck`: passed.
- `bun run lint`: passed.
- `bun run format:check`: passed.
- `bun run test --filter @crafty/editor`: passed, `475/475`.
- The full parallel `bun run test` once timed out in the expensive grid test;
  the isolated editor suite passed. Treat this as a verification/environment
  observation, not as a cleared full-suite result.
