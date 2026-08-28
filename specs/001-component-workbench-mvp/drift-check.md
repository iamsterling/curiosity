# Drift Check: Component Workbench MVP

## Result

Implementation matches the MVP intent with explicit limitations documented below.

## Matches spec

- Spec Kit artifacts exist before implementation: constitution, feature metadata, spec, plan, tasks, research, data model, contracts, quickstart.
- Workspace wiring respects existing npm/Turborepo conventions instead of switching to pnpm.
- MCP/agent-facing surface exists before relying on UI: `@crafty/mcp` exposes `component.list`, `component.inspect`, `component.render`, `variant.list`, `state.set`, `timeline.create`, `timeline.play`, `test.run`, and `visual.diff`.
- Shared packages own contracts and reusable engine logic: schemas, API, MCP, compiler/core primitives, and native Crafty source discovery.
- VS Code extension registers the required commands and owns process/webview boundaries only.
- Webview is React + Vite + Tailwind under the VS Code extension with a minimal workbench layout.
- Skill file exists with evidence and safety rules.

## Intentional adaptations

- The repo uses `npm@11.12.1` and `package-lock.json`; implementation preserved npm instead of introducing pnpm.
- Empty legacy app placeholders were not reused as duplicate names; MCP moved to the standalone `@crafty/mcp` workspace while VS Code workbench code lives under `apps/vscode-extension`.
- shadcn/ui is represented by local shadcn-style primitives and `components.json`; the CLI was not invoked.

## Known MVP limitations

- Native component rendering is still limited; source discovery reads Crafty project records and returns structured unsupported diagnostics where rendering is not connected.
- `state.set`, `timeline.play`, and `visual.diff` are structured placeholders.
- VS Code extension webview currently initializes placeholder state; full MCP client request/response bridging is next work.
- Extension host was compiled but not manually launched in VS Code in this environment.

## Verification

- `npm install`
- `npm run build`
- `npm run test`
- `npm run typecheck`
- Final combined verification: `npm run build && npm run test && npm run typecheck`
