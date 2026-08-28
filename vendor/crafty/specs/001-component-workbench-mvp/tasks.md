# Tasks: Component Workbench MVP

## T001 - Spec Kit baseline
- **Files touched**: `.specify/constitution.md`, `.specify/feature.json`, `specs/001-component-workbench-mvp/*`
- **Expected output**: source-of-truth spec, plan, research, data model, contracts, quickstart, tasks.
- **Verification command**: `test -f specs/001-component-workbench-mvp/spec.md`
- **Dependencies**: none
- **Acceptance criteria**: constitution encodes agent-first MCP/CLI, real components, safety, testability, traceability, and MVP scope.

## T002 - Workspace wiring
- **Files touched**: `package.json`, `turbo.json`, app/package manifests, tsconfigs
- **Expected output**: npm workspace includes `apps/*` and new packages; build/test/typecheck tasks wired.
- **Verification command**: `npm run typecheck`
- **Dependencies**: T001
- **Acceptance criteria**: no duplicate root conventions; existing package names remain intact.

## T003 - Shared schemas
- **Files touched**: `packages/schemas/src/*`, `packages/schemas/test/*`
- **Expected output**: zod schemas/types for components, variants, render, timeline, tests, MCP, webview messages.
- **Verification command**: `npm run test --workspace @crafty/schemas`
- **Dependencies**: T002
- **Acceptance criteria**: all MCP inputs/outputs have typed schemas and structured errors.

## T004 - Crafty source registry
- **Files touched**: `apps/vscode-extension/src/workbench/source-registry.ts`, `apps/vscode-extension/src/mcp-server/server.ts`, `apps/vscode-extension/src/webview/panel.ts`
- **Expected output**: registry, inspector, variant/state helpers backed by Crafty project discovery.
- **Verification command**: `npm run test --workspace @crafty/vscode-extension`
- **Dependencies**: T003
- **Acceptance criteria**: inspection returns metadata/limitations and never reads outside provided records.

## T005 - Native render placeholders
- **Files touched**: `apps/vscode-extension/src/workbench/source-registry.ts`, `packages/schemas/src/*`, `packages/schemas/test/*`
- **Expected output**: Crafty render targets return structured unsupported diagnostics until native rendering is connected.
- **Verification command**: `npm run test --workspace @crafty/vscode-extension && npm run test --workspace @crafty/schemas`
- **Dependencies**: T003,T004
- **Acceptance criteria**: returns Crafty source targets or useful diagnostics when source discovery is empty.

## T006 - Timeline helpers
- **Files touched**: `apps/vscode-extension/src/mcp-server/timeline/*`
- **Expected output**: minimal timeline validation and playback summary.
- **Verification command**: `npm run test --workspace @crafty/vscode-extension`
- **Dependencies**: T003
- **Acceptance criteria**: timestamped state/prop/interaction events validate deterministically.

## T007 - Test runner integration
- **Files touched**: `apps/vscode-extension/src/testing/*`, `apps/vscode-extension/src/mcp-server/server.ts`
- **Expected output**: safe explicit/detected test command runner and visual/a11y placeholders.
- **Verification command**: `npm run test --workspace @crafty/vscode-extension`
- **Dependencies**: T003
- **Acceptance criteria**: no invented shell commands; unsupported state is structured.

## T008 - MCP server package
- **Files touched**: `packages/mcp/src/*`, `packages/mcp/package.json`
- **Expected output**: MCP tools for list/inspect/render/variants/state/timeline/test/visual diff.
- **Verification command**: `npm run build --workspace @crafty/mcp`
- **Dependencies**: T003-T007
- **Acceptance criteria**: tools return JSON `structuredContent` and actionable diagnostics.

## T009 - VS Code extension app
- **Files touched**: `apps/vscode-extension/src/*`, `apps/vscode-extension/package.json`
- **Expected output**: commands, MCP process helper, webview panel/html/messaging.
- **Verification command**: `npm run build --workspace @crafty/vscode-extension`
- **Dependencies**: T008
- **Acceptance criteria**: extension compiles and command IDs are declared.

## T010 - VS Code webview app
- **Files touched**: `apps/vscode-extension/webview/src/*`, configs
- **Expected output**: React workbench shell with list, canvas, inspector, tests, trace.
- **Verification command**: `npm run typecheck:webview --workspace @crafty/vscode-extension`
- **Dependencies**: T003,T009
- **Acceptance criteria**: app builds with coherent minimal UI and no direct filesystem access.

## T011 - Skill and docs
- **Files touched**: `skills/component-workbench/SKILL.md`, READMEs
- **Expected output**: agent workflow guidance and package docs.
- **Verification command**: `test -f skills/component-workbench/SKILL.md`
- **Dependencies**: T008-T010
- **Acceptance criteria**: skill requires list/inspect/render/test evidence before done claims.

## T012 - Drift check and verification
- **Files touched**: `specs/001-component-workbench-mvp/tasks.md` if status needs updates
- **Expected output**: implementation matches spec or spec is intentionally updated.
- **Verification command**: `npm run build && npm run test && npm run typecheck`
- **Dependencies**: all prior tasks
- **Acceptance criteria**: final summary links implementation to task IDs and reports limitations.

## T013 - Freeform canvas alignment snapping
- **Files touched**: `apps/vscode-extension/webview/src/store/workbench-store.ts`, `apps/vscode-extension/webview/src/components/canvas/viewport-frame.tsx`, `specs/001-component-workbench-mvp/plan.md`, `specs/001-component-workbench-mvp/tasks.md`
- **Expected output**: dragged canvas nodes snap their left/center/right and top/center/bottom anchors to sibling nodes within a small screen-space threshold, with transient guide overlays.
- **Verification command**: `npm run typecheck:webview --workspace @crafty/vscode-extension && npm run build --workspace @crafty/vscode-extension`
- **Dependencies**: T010
- **Acceptance criteria**: snapping uses world-coordinate geometry, guide overlays clear on pointer release/cancel, and no shared schemas or source components are mutated.
