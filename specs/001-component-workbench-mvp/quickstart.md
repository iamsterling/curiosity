# Quickstart: Component Workbench MVP

## Install

```bash
npm install
```

## Build and verify

```bash
npm run build
npm run test
npm run typecheck
```

## Start MCP server

```bash
npm run start --workspace @crafty/mcp -- .
```

MCP clients should connect over stdio and call:

1. `component.list`
2. `component.inspect`
3. `variant.list`
4. `component.render`
5. `test.run`

## Open VS Code workbench

1. Open the repo in VS Code.
2. Launch extension development host for `apps/vscode-extension`.
3. Run command: **Open Component Workbench**.
4. Confirm the workbench panel loads with component list, render canvas, inspector, tests, and trace sections.

## Test with Crafty project sources

Use a Crafty workspace with generated config and component records discoverable through `@crafty/api`.

Optional local source checks:

- Run `crafty config .` to refresh generated project metadata.
- Confirm the native component registry returns source ids through `component.list`.

If no Crafty component sources exist, `component.list` must return `ok: true`, empty components/sources, and diagnostics explaining that no Crafty sources were found.
