# Implementation Plan: Figma-Level Design Parity Roadmap

## Strategy

Implement the roadmap as phased, component-native capabilities. The initial implementation does **not** attempt broad parity; it extracts and stabilizes the reusable interaction primitives that later Figma-like features will need.

## Architecture Boundaries

- `apps/vscode-extension/webview/src/components/*`: presentation, event wiring, visual chrome.
- `apps/vscode-extension/webview/src/store/*`: webview-local state only; no hidden source mutations.
- `apps/vscode-extension/webview/src/lib/*`: reusable interaction and geometry helpers used by components and tests.
- Future shared contracts must move to `packages/schemas` before being used by MCP/CLI.

## First Slice: Canvas Interaction Primitives

1. Extract frame geometry helpers for keyboard nudging and corner-handle resize math.
2. Extract static corner-handle metadata used by the canvas overlay.
3. Keep React components focused on event handling and rendering.
4. Add comments documenting geometry invariants: opposite-edge anchoring, minimum size, and world-coordinate deltas.

## Verification

- `npm run typecheck:webview --workspace @crafty/vscode-extension`
- `npm run test --workspace @crafty/vscode-extension`
- `npm run build --workspace @crafty/vscode-extension`

## Future Slices

- Box selection and selection bounds helpers.
- Align/distribute commands over selected frames.
- Layout-grid and guide model.
- Component override model connected to the native Crafty component registry.
- Token/style binding contracts surfaced through MCP before UI mutation.
