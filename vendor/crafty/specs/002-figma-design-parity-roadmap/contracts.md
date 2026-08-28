# Contracts: Figma-Level Design Parity Roadmap

## Current Slice

The first slice is webview-local and does not introduce MCP or extension contracts. This is intentional: keyboard nudging and edit-handle resize are local steering affordances and must not mutate source components directly.

## Helper Contracts

### `keyboardDeltaForKey(key, step)`

- **Input**: keyboard key string and numeric step.
- **Output**: `{ x, y }` for arrow keys, otherwise `undefined`.
- **Invariant**: no DOM state is required, so it is unit-testable.

### `pointerDeltaInWorldSpace(start, current, zoom)`

- **Input**: start/current client points and canvas zoom.
- **Output**: world-coordinate delta.
- **Invariant**: pointer math is normalized before geometry mutation.

### `frameFromCornerHandleDrag(originFrame, handle, delta)`

- **Input**: original frame, corner handle id, world delta.
- **Output**: `{ x, y, width, height }` patch.
- **Invariant**: opposite edges stay anchored and dimensions never drop below `1px`.

## Future Contract Boundary

Any feature that mutates real component source, shared design tokens, or exported assets must define zod schemas in `packages/schemas` and be available through MCP/CLI before UI-only controls are considered complete.
