# Implementation Plan: API-Owned Reusable Product Engine

## Architecture Decision

`@crafty/api` becomes the reusable product engine and public SDK. App-specific services live inside the app that owns the lifecycle. The old reusable app service package has been removed instead of kept as transitional tech debt.

## Target Package Layout

```txt
packages/api/src/
  index.ts
  discovery/
  config/
  workspace/
  preview/
  validation/

apps/vscode-extension/src/services/
  workbench-state.ts
  webview-panel.ts
  vscode-messaging.ts

future app hosts keep route/session lifecycle in their own app boundary
```

## Dependency Direction

```txt
contracts/core/compiler/runtime primitives
        ↓
@crafty/api
        ↓
cli / mcp / vscode / userland / app hosts
```

## Migration Phases

### Phase 1: Split API internals

- Create focused API modules for discovery, config generation, workspace block operations, validation, compile, and preview.
- Move reusable implementation from the removed app service package into those modules.
- Keep `packages/api/src/index.ts` as the public export/facade barrel.

### Phase 2: Migrate consumers

- Ensure CLI and MCP depend only on `@crafty/api`.
- Migrate Studio-era reusable calls to `@crafty/api` before package removal.
- Migrate VS Code reusable calls to `@crafty/api` where host lifecycle does not require app-local code.

### Phase 3: App-local services

- Keep VS Code message/webview lifecycle under `apps/vscode-extension`.
- Keep future app host route/session lifecycle under its owning app boundary.
- Extract oversized app files into app-local service modules without moving host lifecycle into API.

### Phase 4: Remove transitional package

- Remove the old app service package from workspace dependencies after all consumers migrate.

## Verification Commands

- `npm run typecheck --workspace @crafty/api`
- `npm run test --workspace @crafty/api`
- `npm run build --workspace @crafty/api`
- `npm run typecheck --workspace @crafty/cli`
- `npm run test --workspace @crafty/cli`
- `npm run build --workspace @crafty/cli`
- `npm run typecheck --workspace @crafty/mcp`
- `npm run test --workspace @crafty/mcp`
- `npm run build --workspace @crafty/mcp`
- `npm run typecheck --workspace @crafty/vscode-extension`
- `npm run typecheck:webview --workspace @crafty/vscode-extension`
- `npm run test --workspace @crafty/vscode-extension`
- `npm run build --workspace @crafty/vscode-extension`
