# Tasks: API-Owned Reusable Product Engine

- [x] Create focused `packages/api/src/discovery`, `config`, `workspace`, `preview`, and `validation` modules.
- [x] Move reusable implementation from the removed app service package into API modules.
- [x] Keep `packages/api/src/index.ts` as the public facade/barrel.
- [x] Migrate Studio-era reusable calls to `@crafty/api` before package removal.
- [x] Migrate VS Code reusable calls to `@crafty/api` where they are not host-specific.
- [x] Confirm CLI and MCP continue to depend only on `@crafty/api`.
- [x] Move app-specific service code into app-local service modules as needed.
- [x] Remove the app service package instead of keeping a transitional package.
- [x] Update package dependencies and lockfile.
- [x] Update tests to import and exercise `@crafty/api` as the reusable engine.
- [x] Run impacted verification commands from `plan.md`.
