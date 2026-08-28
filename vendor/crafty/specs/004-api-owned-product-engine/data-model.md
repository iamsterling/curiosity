# Data Model: API-Owned Reusable Product Engine

## API Engine Module

Reusable module inside `packages/api/src/*`.

- `discovery`: project structure discovery and classification.
- `config`: generated Crafty config and manifest writing.
- `workspace`: block listing, inspection, validation summaries, workspace compilation.
- `preview`: block/workspace preview server orchestration that is not host-specific.
- `validation`: public validation helpers backed by lower-level contracts/core.

## App-Local Service

Host-specific module inside an app/package.

- VS Code examples: webview panel lifecycle, VS Code messaging, extension command registration.
- Studio examples: HTTP route registration, request/response shaping, server lifecycle, browser-client template delivery.

## Primitive Package

Lower-level reusable package below API.

- Examples: `@crafty/contracts`, `@crafty/core`, `@crafty/compiler-html`, `@crafty/schemas`.
- App-only canvas and timeline helpers live inside the VS Code extension so package boundaries reflect actual reuse.

## Transitional Shim

Temporary package or module preserving imports while consumers migrate.

- Must include explicit deprecation comments.
- Must not gain new functionality.
- Must have a removal task in `tasks.md`.
