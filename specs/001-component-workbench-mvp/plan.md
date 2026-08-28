# Implementation Plan: Component Workbench MVP

## Architecture

This repo already uses npm workspaces with Turborepo and `packages/*`. The MVP adds app workspaces under `apps/*` and shared packages under `packages/*` while preserving existing `@crafty/*` style and strict TypeScript settings.

## Package Responsibilities

- `apps/vscode-extension`: VS Code desktop extension, command registration, app-local MCP process, webview creation, and webview bridge.
- `packages/schemas`: zod schemas and inferred TypeScript types for tools, messages, timelines, tests, and traces.
- `packages/api`: Crafty-owned source discovery and reusable product engine.
- `apps/vscode-extension/src/mcp-server/timeline`: app-local minimal timeline validation and playback summaries.
- Shared package/config stubs were removed until they have real consumers.

## Data Flow

1. Agent calls MCP tool.
2. MCP validates input with `packages/schemas`.
3. MCP calls Crafty API discovery plus app-local test/timeline helpers.
4. Result returns as text + `structuredContent` JSON.
5. VS Code extension can spawn the MCP server and load webview assets.
6. Webview sends typed messages to extension; extension returns structured workbench state.

## MCP Design

Tools: `component.list`, `component.inspect`, `component.render`, `variant.list`, `state.set`, `timeline.create`, `timeline.play`, `test.run`, `visual.diff`. All return `{ ok, ... }` payloads with structured diagnostics on failure/unsupported states.

## VS Code Extension Design

- Commands: `craftyWorkbench.open`, `craftyWorkbench.startMcpServer`, `craftyWorkbench.runComponentChecks`.
- Extension hosts webview panel and bridges basic messages.
- MCP process manager starts the extension-local MCP entrypoint via node.

## Webview Design

React + Vite + Tailwind + small local shadcn-style primitives. Layout: left component list, center iframe/render canvas, right inspector for variants/state/timeline, bottom tests/trace/log panel.

### Freeform Canvas Ergonomics

The webview canvas may provide local, non-mutating layout affordances for human steering, including pan/zoom, draggable DOM-backed story frames, contextual node chrome, and transient alignment snapping. Snapping math stays in canvas world coordinates, uses existing `CanvasNodeFrame` geometry, and renders guide overlays without changing shared component contracts or source files.

## Crafty Source Registry Design

- Validate workspace root and keep scans bounded.
- Use `@crafty/api` project discovery as the component source of truth.
- Map discovered source components into `ComponentTarget`, `StoryTarget`, and `VariantTarget` records for current UI compatibility.
- Return native render placeholders until Crafty's source renderer is connected.

## Testing Strategy

- Vitest unit tests for schemas, API discovery, extension MCP, webview canvas helpers, and app-local timeline/test helpers.
- MCP smoke tests can validate tool registration and structured outputs.
- Webview/extension compile checks verify TypeScript and build wiring.

## Verification Commands

- `npm install`
- `npm run build`
- `npm run test`
- `npm run typecheck`
- Package-specific: `npm run build --workspace <name>`, `npm run test --workspace <name>`.
