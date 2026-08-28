# Research: API-Owned Reusable Product Engine

## Current Findings

- `@crafty/api` exists and is the intended user-facing facade.
- Reusable discovery, generated config, workspace validation, compilation, and preview behavior now belongs in `@crafty/api`.
- CLI and MCP route through `@crafty/api`, which is the desired consumer shape.
- VS Code keeps host-specific code inside its app boundary and calls `@crafty/api` for reusable behavior.
- The previous architecture rating identified the old service package as a god-module and `@crafty/api` as too thin/leaky.

## Decision

Move reusable product engine implementation into `@crafty/api`, split by module. Do not keep a separate reusable app-services package. App-specific services belong to their apps.

## Rationale

- Users should learn one package: `@crafty/api`.
- Reusable implementation should live with the public SDK contract to avoid a facade/service split-brain.
- App services are app-local by definition; package-level reusable code should not be named app-services.

## Deferred Questions

- Whether `@crafty/api` should expose subpath exports later, e.g. `@crafty/api/discovery`.
- Whether a future Studio app should live under `apps/` if it is reintroduced.
