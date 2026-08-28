# Feature Spec: Editor Kernel Integration

## Problem

The browser surface has an editor-kernel foundation, but the running editor still stores its canonical scene in React state and performs move, resize, duplicate, delete, reorder, and inspector mutations through direct nested updates. This leaves the renderer-independent kernel as a parallel proof instead of the editor's mutation authority.

## Product Direction

Wire the standalone browser surface to the editor kernel without broadening the document feature set. The current `Scene` API remains a compatibility persistence format for this change. The kernel document is the browser's authoritative authored state; a tested adapter projects it to and from the legacy scene format for the existing server and renderer.

## Scope

- Scene-to-editor-document and editor-document-to-scene compatibility adapters.
- Kernel-backed load, save, reload, create, move, resize, delete, duplicate, reorder, and inspector edits.
- Semantic drag transactions with preview, commit, rollback, undo, redo, and selection cleanup.
- Kernel-backed rectangle creation while preserving visual story overrides and deterministic snapshots.
- Browser integration tests for the mutation and history path.

## Non-Goals

- Component resolution, libraries, auto layout, rich text, collaboration, or a new server schema.
- Replacing the existing Rust/WASM draw protocol.
- Preserving runtime or selection state in persisted scene bytes.

## Acceptance Criteria

- Loading a scene creates one editor kernel and does not use React nested mutation as the authored source of truth.
- Every browser document mutation is represented by a validated kernel command or transaction.
- Pointer move and resize produce one semantic undo entry; cancellation produces none.
- Undo and redo restore the projected scene and selection coherently.
- Delete removes the selected node from both document hierarchy and selection.
- Save serializes the kernel projection, and reload reconstructs the same kernel document.
- Story switching changes only the renderer projection and does not mutate the kernel base document.
- Existing scene persistence, snapshots, WASM rendering, fallback regression contracts, and extension builds remain green.
