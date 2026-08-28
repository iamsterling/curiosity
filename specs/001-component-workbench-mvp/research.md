# Research: Component Workbench MVP

## Repo conventions

- Existing monorepo uses `npm@11.12.1`, npm workspaces, and Turborepo.
- Current workspace glob was `packages/*`; MVP adds `apps/*` rather than switching package managers.
- Packages are ESM, strict TypeScript, `tsc -p`, Vitest, `src/index.ts`, and `.js` relative imports.
- Existing ADR 0004 says MCP must be a thin wrapper over shared services.

## MCP approach

- Use existing `@modelcontextprotocol/sdk` imports already present in `packages/mcp`.
- Use stdio transport for local-first MVP.
- Register tools with zod schemas and return both text JSON and `structuredContent`.
- Keep MCP app logic thin; shared packages own detection, rendering metadata, timelines, tests, and structured error shapes.

## Storybook integration

- React + Vite Storybook detection should look for `.storybook/main.*`, `@storybook/react-vite`, and Storybook scripts.
- Primary story index endpoint is `/index.json`; `/stories.json` is legacy fallback.
- Local static indexes can appear as `storybook-static/index.json`, `storybook-static/stories.json`, or `.storybook/index.json` in simple fixtures.
- Accept `{ entries }` and legacy `{ stories }` shapes.
- Render URLs should use `iframe.html?id=<storyId>` when a base URL is known.

## VS Code webview constraints

- Use desktop extension `createWebviewPanel` for MVP.
- Enable scripts only for the webview panel.
- Convert built webview assets with `webview.asWebviewUri`.
- Use tight CSP with script nonce and constrained `localResourceRoots`.
- Webview must not read workspace files directly; all operations go through extension/MCP messages.

## shadcn/Vite usage

- MVP can use local shadcn-style primitives and `components.json` without invoking the shadcn CLI.
- Vite should emit predictable static assets to simplify VS Code HTML loading.
- Tailwind can be minimal and scoped to the webview app.

## Known risks

- Storybook setups vary and may require auth/dev server startup; MVP returns diagnostics instead of hiding failure.
- VS Code extension packaging is not marketplace-ready.
- Visual diff and accessibility are placeholders unless a project explicitly provides tools.
