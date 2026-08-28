# Troubleshooting: Empty Workbench Project Structure

## Symptom

The VS Code workbench Pages rail renders `No Project Structure` even when the opened workspace contains a Next.js app-router project.

## Root Causes

1. The extension host previously bundled third-party registry loading and project-structure discovery in one `try`/`catch`. If registry loading failed, the response dropped the independently discoverable project structure and sent an empty navigation payload.
2. Project discovery only checked top-level `app`, `src/app`, `pages`, and `src/pages` roots. Monorepos commonly place Next.js apps under nested package roots such as `apps/web/src/app`.
3. The host and webview can race during startup if `workbench.ready` is sent before both message listeners are registered. In that case the discovery payload is never requested or received and the rail stays on the initial `No project structure` fallback.

## Fix Plan

- Discover page roots recursively, while skipping ignored build/dependency directories.
- Support app-router roots ending in `app` or `src/app` and pages-router roots ending in `pages` or `src/pages`.
- Keep app-router screens limited to `page.*` files; do not classify `route.*` API endpoints as screens.
- Support generic React `screens`/`views` directories and `src/App.*` entrypoints so non-Next workspaces still get useful screen entries.
- Separate shared components from composed components when files live under `shared`/`common` component paths or are reused by multiple discovered components.
- Build workbench navigation from project discovery even when optional registry-style enrichment returns diagnostics or throws.
- Register host and webview message listeners before loading webview HTML or sending `workbench.ready`.
- Preserve the grouped rail: Screens, Shared components, Components, Primitives.
