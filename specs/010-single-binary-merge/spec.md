# Feature Spec: Single-Binary Merge

## Problem

Crafty today ran as four disjoint surfaces: a Next.js dev server, a separate loopback scene server, a standalone CLI, and a VS Code extension. A customer must install Node, npm, and the repo to use the product. Spec 006 explicitly deferred packaging: "an installable binary is a packaging target after the local Node runtime proves useful." The browser surface and canvas platform are now proven.

## Decision

Ship one executable named `crafty` with three faces:

| Face | Invocation | What it does |
|---|---|---|
| Desktop | `crafty` | Starts the embedded server loopback-only, opens the system browser |
| Serve | `crafty serve` | Starts the embedded server over HTTPS on `0.0.0.0`, issues Tailscale-aware certificates, prints the device URL — the iPad continues the same session |
| CLI | `crafty <command>` | list / doctor / validate / compile / compile-workspace / preview / preview-workspace / inspect / inspect-workspace / discover / config / facade, reusing `@crafty/cli` |

One process serves the static web export (index.html, hashed assets, the Rust/WASM renderer) and the scene API on the same origin, so the existing relative `/api/*` calls in the web client work unchanged.

## Merged Codebase

- `apps/crafty-server` is **absorbed into `apps/cli`** — there is one server, one app, one binary. `apps/cli/src/server.ts` owns the scene API, static serving, and persistence; `apps/cli/src/index.ts` is the single entry point dispatching all faces.
- `apps/crafty-web` builds to a static export (`output: "export"`); the dev-time Next rewrites are removed because the merged server owns `/api`.
- `packages/cli` becomes a library (bin removed) consumed by the merged entry.
- `packages/mcp` is removed entirely; nothing in the product consumes it.
- The dev flow (`npm run dev`) now starts the merged app's API-only face on `127.0.0.1:4174` instead of a separate server app.

## Packaging

`scripts/build-crafty-binary.mjs` builds the dependency chain, then `bun build --compile` produces `dist/crafty`. Web assets are embedded via a build-generated manifest (`apps/cli/src/web-assets.generated.ts`) of `with { type: "file" }` imports, resolved at runtime through `Bun.file` — the only embedding mechanism this bun version exposes at runtime.

## Continuity

The scene already lives server-side with revision-checked saves (`PUT /api/scene` with `expectedRevision`). The binary adds disk persistence under a data directory (default `~/.crafty`, override `CRAFTY_DATA_DIR`), so the document survives restarts and is shared across devices: the Mac desktop face and the iPad both talk to the same server process and the same persisted scene.

## Security

- Desktop face binds loopback only (`127.0.0.1`), a secure context — no certificate needed.
- Serve face binds `0.0.0.0` over HTTPS with a locally generated CA; the customer installs the CA once per device (existing iPad flow, generalized to the binary's data directory).
- Bind hosts remain whitelisted (`0.0.0.0`, `::`, `127.0.0.1`, `::1`, `localhost`).

## Out of Scope

- MCP surface (removed).
- Native desktop window (browser-tab desktop face; a Tauri native shell is a later enhancement and does not change the single-binary core).
- Windows/Linux packaging matrix (the build script targets the host platform; the layout is portable).
