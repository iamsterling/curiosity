# Implementation Plan: Editor Kernel Integration

## Strategy

Keep the existing server and renderer contracts stable while moving browser authored state behind a compatibility adapter. The adapter is deliberately temporary and is not allowed to expand the legacy scene model with new editor semantics.

## Architecture

- `packages/editor-kernel`: canonical document, commands, transactions, history, and scene compatibility adapter.
- `apps/crafty-web`: owns only React projection state, kernel instance lifecycle, renderer projection, and panel subscriptions.
- `packages/scene-model`: remains the legacy persistence/render projection for this migration step.
- `apps/crafty-server`: unchanged API boundary, with scene validation and optimistic revision checks retained.

## Mutation Flow

```text
pointer / panel / keyboard action
        -> editor kernel command or transaction
        -> validated EditorDocument
        -> compatibility projection
        -> story projection
        -> resolved legacy render scene
        -> WASM/WebGPU packet
```

Preview commands update the kernel transaction but are not saved. Commit creates one history entry. Rollback restores the transaction's document snapshot and clears previews.

## Verification

- Unit tests for adapter round trips and stable IDs.
- Kernel tests for command history, multi-step preview replacement, delete selection cleanup, and reorder.
- Browser integration tests for create, select, move, resize, cancel, delete, undo, redo, save, reload, and story switching.
- `npm run build`, `npm run typecheck`, `npm run test`, `npm run lint`, `npm run format:check`, and Rust tests.
