# Contracts: Editor Kernel Integration

## Adapter Contract

```ts
sceneToEditorDocument(scene: Scene): EditorDocument
editorDocumentToScene(document: EditorDocument, revision: number): Scene
```

The adapter must preserve stable node IDs, page/frame identity, hierarchy, geometry, paint, visibility, opacity, z-order, text placeholders, and frame stories. Runtime editor state is excluded.

## Mutation Contract

Every authored browser change must use `EditorKernel.dispatch`, `beginTransaction`/`preview`/`commit`, or `rollback`. Direct `setScene` is permitted only to install the adapter projection after kernel state changes or server reload.

## History Contract

- A committed create, delete, reorder, property edit, move, or resize is one history entry.
- A cancelled transaction has no history entry and restores the prior document.
- Undo and redo update the projected scene and remove selection references to deleted nodes.

## Persistence Contract

Save sends `editorDocumentToScene(kernel.getDocument(), currentRevision)` to the existing revision-checked API. Reload replaces the kernel with `sceneToEditorDocument(response.scene)` and clears ephemeral selection, gesture, and history state.
