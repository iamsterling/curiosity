# ADR 0008: Crafty Ships a Next.js Server Runtime

Status: Accepted — implemented; the bundled-Node choice is superseded by [0015](0015-bun-runtime.md) (the shipped runtime is now bun; the Next server decision stands)
Date: 2026-08-07
Implementation status: Implemented. `apps/crafty-web` builds with `output: "standalone"`; `apps/cli` launches it. The bespoke HTTP server (`apps/cli/src/server.ts`) is deleted.

## Context

Crafty previously built `apps/crafty-web` with `output: "export"`. The static
files were base64-encoded into `apps/cli/src/web-assets.generated.ts` and served
by a hand-written Node `http` server in `apps/cli/src/server.ts`, which also
hosted the scene API. `bun build --compile` produced a single `dist/crafty`
executable.

Consequences of that topology:

- **Server Components were inert.** `app/page.tsx` was a Server Component, but
  with no server at request time it rendered once at build and its whole body
  was `<App />` — a single 474-line `"use client"` component holding the entire
  editor. The "server components are the default" convention was true and
  without effect.
- **Two HTTP implementations.** Route dispatch, slug validation, static serving
  and body limits were hand-rolled in `server.ts`, separate from anything the
  framework provides.
- **A split-origin development setup.** `scripts/dev-next.mjs` ran the API on
  `127.0.0.1:4174` and Next on `4173`, with no rewrite connecting them.
- **No surface for anything but the canvas.** `/` merely redirected to
  `/files/untitled`. A file browser, library catalog, or component gallery had
  nowhere to live except as more client components fetching JSON.

The roadmap's Phase 4 (cross-file design systems) needs exactly those browse
surfaces, and they are the workload Server Components are good at.

## Constraints

- The editor surface is irreducibly client-side: WebGPU device, pointer capture,
  a 60 fps render loop, and an in-memory kernel holding the canonical document.
  No part of that can be server-rendered.
- Server Components must not become a route for putting document state on the
  server. The kernel owns the authored document (ADR 0002).
- The serve face must keep working over HTTPS on `0.0.0.0` with the existing
  Tailscale-aware local CA — WebGPU requires a secure origin.
- The product must stay runnable on a machine with no Node, npm, or toolchain.
- Offline operation must be preserved.

## Options Considered

- **Keep the static export.** Zero migration cost, but Server Components stay
  permanently inert and every future browse surface is a client component with a
  fetch waterfall. Rejected: it forecloses the architecture the roadmap needs.
- **Custom Next server (`next({ dev }).getRequestHandler()`) wrapped in
  `node:https`.** Would let one process terminate TLS and serve the app.
  Rejected: it puts the app off Next's supported `standalone` entry point,
  complicates tracing and the packaged build, and couples TLS to the app server.
- **Standalone Next server + separate TLS terminator.** Chosen. Next stays on
  its supported entry point; HTTPS is a transport concern handled by a thin
  reverse proxy in the serve face.
- **Electron or Tauri shell.** Rejected for now: a much larger dependency and
  platform-build surface to solve a problem (bundling a runtime) that copying
  the Node binary solves in ten lines.

## Decision

**Crafty ships a Next.js server runtime.**

1. `apps/crafty-web` builds with `output: "standalone"`.
2. Routes:
   - `/` — Server Component file browser, reading `@crafty/scene-store` directly.
   - `/files/[slug]` — Server Component shell that reads the scene on the server
     and passes it to the client island as serializable props.
   - `/api/files/[slug]/{scene,import,snapshot}` — route handlers replacing the
     bespoke HTTP server.
3. Store logic moves to **`packages/scene-store`** — slug rules, atomic
   persistence, optimistic revisions, listing, snapshots — so the Server
   Components, the route handlers and the CLI share one implementation.
4. `apps/cli` becomes a **launcher**: `desktop` starts the standalone server on
   loopback and opens the browser; `serve` starts it on loopback and terminates
   TLS in front of it. The `api` face is removed — Next owns the API.
5. `npm run bundle` produces a self-contained `dist/` directory: the Next
   standalone build, the compiled CLI, the workspace packages, **and the Node
   binary**, behind a `dist/crafty` launcher script.

The client boundary is explicit and narrow: **`EditorSurface` and below is
client; everything above it is server.**

## Consequences

**Gained**

- The scene is read on the server and arrives as props — no fetch-on-mount, no
  empty first frame, one origin, no split-origin dev setup.
- A real place for file browsing, and later library/component catalogs and
  version history, without inventing a client data layer.
- One HTTP implementation instead of two; body limits, routing and slug
  validation come from the framework and the shared store.
- `packages/scene-store` is independently testable (17 tests) with no HTTP.
- Persistence became crash-safe (temp file → fsync → rename) as part of the
  extraction, closing a gap `persistence.md` had recorded.

**Lost or paid for**

- `bun build --compile` no longer suffices. The artifact is a ~169 MB directory
  with a bundled Node runtime rather than a single ~100 MB executable. Still one
  thing to copy, still no toolchain required on the target machine.
- The serve face runs two processes (TLS proxy + app server) on two ports.
- Server startup is slower than the previous hand-written server.
- SSR now runs the client component tree, so the editor must stay
  SSR-safe — no bare `window`/`document` access during render.

## Risks

- **Hydration divergence.** The editor is constructed during SSR and again on
  the client. Mitigated by keeping browser-only reads (`matchMedia`,
  `localStorage`, `devicePixelRatio`) inside effects, not render. If this proves
  fragile, the fallback is to render the shell server-side and mount the editor
  client-only.
- **Standalone packaging drift.** Next does not copy `.next/static` or `public`
  into the standalone output; the bundle script does it explicitly. A Next
  upgrade could change the traced layout.
- **Binary size.** 169 MB. If it becomes a problem, ship without the bundled
  Node and require it on the target machine, or revisit a native shell.

## Validation

- `npm run build`, `npm run typecheck`, `npm run test`, `npm run lint`,
  `npm run format:check` all pass.
- End-to-end against the standalone server: RSC file browser `200`, RSC editor
  shell serves canvas markup, `GET /api/files/<slug>/scene` returns a scene,
  a valid `PUT` persists to disk and bumps the revision, a stale `PUT` returns
  `409`, an invalid slug returns `400`, snapshot returns a canonical hash, and a
  saved file appears in the Server Component listing.
- The packaged `dist/crafty` was run from outside the repository and served both
  routes.
- `packages/scene-store` has 17 tests covering slugs, atomic writes, canonical
  bytes, optimistic revisions, listing and snapshots.

## Revisit When

- The bundled artifact size blocks distribution — reconsider a native shell or
  an external Node requirement.
- SSR of the editor tree causes hydration problems that effect-scoping cannot
  fix — switch the editor island to client-only mounting.
- Server Actions become the better fit for mutations than route handlers; today
  the client kernel already owns mutation batching and the API is a thin save
  boundary, so actions would add indirection without removing any.
