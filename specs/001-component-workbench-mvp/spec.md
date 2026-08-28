# Feature Spec: Component Workbench MVP

## Problem

AI agents need a reliable way to inspect, render, modify, test, and verify real UI components without relying on screenshots of fake design files, third-party catalogs, or human-only dashboards. Current design workflows drift from code when they model components outside Crafty's own source-discovery engine.

## Target Users

- **Primary**: AI agents editing and verifying UI code.
- **Secondary**: Humans in VS Code who observe, approve, debug, and steer agent work.

## User Stories

1. As a VS Code user, I can open a Component Workbench panel from the command palette.
2. As a VS Code user, I can see Crafty-detected source components or useful diagnostics when none are found.
3. As a VS Code user, I can select a source target and see native render progress or placeholder state.
4. As a VS Code user, I can see variants, state controls, test results, and trace/log events in one workbench.

## Agent Stories

1. As an agent, I can call `component.list` to discover component targets using structured JSON.
2. As an agent, I can call `component.inspect` and `variant.list` before editing.
3. As an agent, I can call `component.render` and `test.run` after an edit to gather evidence.
4. As an agent, I receive actionable structured errors instead of UI-only failures.
5. As an agent, I can use timeline tools for a minimal timestamped event model without expecting a full animation editor.

## MVP Scope

- Cohesive workspace surfaces for the VS Code extension, app-local webview/MCP host code, schemas, and API-owned source discovery.
- React/TSX source component discovery through Crafty's own project-structure engine.
- MCP tools for list/inspect/render/variants/state/timeline/test/visual diff.
- VS Code desktop extension commands and a React/Vite/Tailwind webview shell.
- Structured trace/test/render result schemas and tests for core packages.

## Non-goals

- Freeform vector design, drag/drop editing, Figma import, cloud sync, auth, payments, collaboration, marketplace publishing, full Framer-quality timeline editing, advanced visual regression infrastructure, and broad framework support beyond the initial React/TSX source-discovery path.

## Acceptance Criteria

- Spec Kit artifacts exist and are non-fluffy.
- Repo builds, typechecks, and tests for implemented packages.
- VS Code extension compiles and registers workbench/MCP/test commands.
- Webview app builds and shows component list, canvas, variants/state, timeline stub, tests, and trace sections.
- MCP server starts and exposes machine-readable JSON tools.
- `component.list` returns structured Crafty source components or useful diagnostics.
- Component discovery works from source files without requiring a third-party component catalog.
- `test.run` returns structured command results or clear unsupported diagnostics.
- Skill file explains when and how agents use the workbench.
- Safety constraints are encoded in adapters and contracts.

## Risks

- Source projects vary widely; MVP must degrade gracefully.
- VS Code webview asset loading has strict URI/CSP constraints.
- MCP tool names with dots must remain client-compatible.
- Running project tests can become unsafe if commands are invented; commands must be explicit or detected.
- Scope can expand into a design tool; constitution blocks that.

## Success Demo

1. Open repo in VS Code.
2. Run “Open Component Workbench”.
3. Extension starts/points to MCP server.
4. Workbench requests components and displays detected source targets or diagnostics.
5. Agent calls `component.list`, `component.inspect`, and `variant.list`.
6. Agent edits code through normal editing tools.
7. Agent calls `component.render` or `test.run`.
8. Workbench trace/log shows the operation and final evidence.
