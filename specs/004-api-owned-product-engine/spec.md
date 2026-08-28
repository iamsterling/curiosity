# Feature Spec: API-Owned Reusable Product Engine

## Problem

Crafty now has a public `@crafty/api` package, and reusable product logic must live there instead of in app-owned service packages. If code is reusable across CLI, MCP, VS Code, and userland, it belongs in `@crafty/api`; if code is app-specific, it should live inside that app.

## Target Users

- **Primary**: Crafty maintainers evolving the API, CLI, MCP, and VS Code workbench.
- **Secondary**: Developers importing `@crafty/api` as the one supported reusable product engine.
- **Agent Users**: AI agents that need one stable package surface for discover/config/compile/preview/validation flows.

## User Stories

1. As a Crafty user, I can import `@crafty/api` and access reusable Crafty capabilities without knowing about internal app service packages.
2. As a CLI/MCP maintainer, I can depend on `@crafty/api` only for reusable logic.
3. As a VS Code maintainer, I can keep app-specific services local to the app while composing reusable API methods.
4. As a contributor, I can tell where new code belongs using one rule: reusable engine code goes in API; app-only orchestration goes in the app.

## Scope

- Move reusable discovery/config/workspace/preview/validation implementation from the removed app service package into `@crafty/api` modules.
- Keep only genuinely reusable lower-level packages (`contracts`, `core`, `compiler-html`, `schemas`) as primitives below API; app-only helpers should live with their owning app.
- Move or keep app-specific services inside their owning apps/packages.
- Update CLI/MCP to continue depending only on `@crafty/api`.
- Update VS Code boundaries so reusable calls flow through `@crafty/api` where practical.
- Remove the old app service package once consumers have migrated.

## Non-goals

- Changing public `crafty.*` method names.
- Rewriting all VS Code UI state management in this migration.
- Moving pure block/compiler primitive packages into API.
- Adding plugin/runtime config execution.

## Acceptance Criteria

- `@crafty/api` owns reusable product engine modules, not only a pass-through facade.
- No CLI/MCP code imports removed app service packages.
- VS Code does not import removed app service packages for reusable engine behavior after migration.
- App-local services stay under the app/package that owns their host-specific lifecycle.
- Removed service packages stay absent from workspace manifests and lockfiles.
- Typecheck/test/build pass for API, CLI, MCP, and VS Code extension after migration.

## Risks

- Moving too much into API could make it the new god package unless API is split into focused modules.
- Moving app-specific host lifecycle into API would recreate the same boundary problem in reverse.
- Imports can silently bypass the intended API if migration is not enforced by drift checks.

## Success Demo

1. `import { crafty, createCrafty } from "@crafty/api"` remains the public SDK entrypoint.
2. `crafty config .`, MCP tools, and VS Code workbench loading all reuse API-owned engine modules.
3. Searching the repo for removed app service package imports returns no active consumers.
