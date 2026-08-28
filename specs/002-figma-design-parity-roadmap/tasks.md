# Tasks: Figma-Level Design Parity Roadmap

## T001 - Roadmap Spec Kit artifacts
- **Files touched**: `.specify/feature.json`, `specs/002-figma-design-parity-roadmap/spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `contracts.md`, `quickstart.md`, `drift-check.md`
- **Expected output**: phased Figma-parity roadmap with constitution-safe boundaries and full Spec Kit artifact traceability.
- **Verification command**: `test -f specs/002-figma-design-parity-roadmap/spec.md`
- **Dependencies**: existing `001-component-workbench-mvp`
- **Acceptance criteria**: roadmap is explicit about phases, non-goals, and real-component source-of-truth constraints.

## T002 - Canvas geometry helper extraction
- **Files touched**: `apps/vscode-extension/webview/src/lib/canvas-geometry.ts`, `apps/vscode-extension/webview/src/components/canvas/viewport-frame.tsx`
- **Expected output**: reusable helpers for frame nudging and corner-handle resizing.
- **Verification command**: `npm run typecheck:webview --workspace @crafty/vscode-extension`
- **Dependencies**: T001
- **Acceptance criteria**: helpers document coordinate invariants and avoid duplicating resize math in JSX.

## T003 - Canvas handle metadata extraction
- **Files touched**: `apps/vscode-extension/webview/src/lib/canvas-handles.ts`, `apps/vscode-extension/webview/src/components/canvas/viewport-frame.tsx`
- **Expected output**: one source of truth for corner handle ids, labels, cursors, and positioning classes.
- **Verification command**: `npm run build --workspace @crafty/vscode-extension`
- **Dependencies**: T002
- **Acceptance criteria**: edit handles render from shared metadata and remain selectable/draggable.

## T004 - Interaction regression verification
- **Files touched**: implementation files only if drift is found
- **Expected output**: selected-mode nudging, shift nudging, edit-handle selection, and corner resize still work.
- **Verification command**: `npm run test --workspace @crafty/vscode-extension`
- **Dependencies**: T002,T003
- **Acceptance criteria**: typecheck/test/build pass and limitations are documented in final summary.
