# Multi-zone platform: base router, marketing/docs, admin, and the editor zone

Status: **Proposed**

## The Problem

Crafty is one Next.js app (`apps/crafty-web`) that owns every path: `/` is the
file browser, `/files/[slug]` is the editor, `/api/*` is the save boundary.
Three forces are converging:

1. **New surfaces are coming** — a public landing page and docs, and an admin
   panel. A landing page does not belong next to the editor's kernel wiring,
   and the admin panel needs its own lifecycle. Every surface added to the
   single app grows one build, one deploy, and one security story.
2. **Auth does not exist.** Crafty has no users, sessions or login anywhere —
   the desktop/serve faces run on trusted local networks by design. An admin
   panel is the first surface that cannot exist without it, and the deployed
   instance (Dokploy) will need it for the editor too.
3. **Deployment is local-artifact-only.** `bun run bundle` produces a
   single-process `dist/`; there is no path from the repo to a hosted
   instance. The user wants the entire project deployed on Dokploy "as one
   cohesive whole" — one stack, one domain, all surfaces.

The organising principle remains: **Crafty is a structured visual-authoring
system with a renderer**. The zone split must not move any authored/resolved
boundary, kernel semantics, or renderer protocol — it is a serving topology
change plus an auth layer, both strictly above the editor.

## The Decision

Three slices, one change.

**Slice 1 — multi-zone topology.** A blank `apps/base` app is the path table
for the domain: a root layout, a `rewrites` table (Next 16 multi-zones —
`node_modules/next/dist/docs/01-app/02-guides/multi-zones.md`), and
`/api/health`. Every content surface becomes a peer zone with its own
`assetPrefix`:

| Path | Zone | App | Notes |
|---|---|---|---|
| `/` | marketing | `apps/marketing` | Landing + docs (`/docs/*`); static export for v1, baked into the base app at bundle time — zero runtime |
| `/admin/*` | admin | `apps/admin` | Auth required; better-auth admin plugin; scene-store administration |
| `/files/*`, `/api/*` | editor | `apps/crafty-web` | The existing app, minus `/`; owns the auth API paths `/api/auth/*` |
| everything else | base | `apps/base` | 404; `/api/health` is the only route of its own |

Deployment stays **one artifact, many processes**: the launcher spawns each
zone's standalone server on loopback ports (env-configured), the base app's
rewrites point at them, and the existing TLS terminator (serve face) sits in
front — with an HTTP mode for running behind Traefik on Dokploy. Zones remain
independently buildable and, later, independently deployable by pointing
rewrite destinations at real domains.

**Slice 2 — auth with better-auth.** `packages/auth` (`@crafty/auth`) holds
the shared better-auth configuration (Postgres adapter, secret, session
options). The editor zone mounts the auth API (`/api/auth/*` — one mount,
unique paths); the admin zone runs the same config with the admin plugin and
guards via `auth.api.getSession` in Server Components. Same-domain cookies
make the session visible to every zone without cross-origin machinery. Auth
is **conditional on deployment mode**: `CRAFTY_AUTH_MODE=off` (local/serve
faces — no DB, no guards, current behavior unchanged) vs `on` (Dokploy —
login required for the editor and admin zones; marketing stays public).

**Slice 3 — Dokploy as one cohesive whole.** One Dokploy project: a
Dockerfile-built Application (the bundle, built inside the image with the
Rust toolchain) running the launcher in HTTP mode, a managed PostgreSQL
service for better-auth, a volume for the scene data directory, one domain
via Traefik. The stack config lives in the repo (`deploy/`).

The editor kernel, renderer, document schema and React-boundary conventions
are untouched by all three slices.

## Open decision points (in scope, to be settled during implementation)

- **Auth scope on deploy**: full product behind login (recommended — a
  deployed instance is a private instance) vs admin-only for v1.
- **Marketing build**: static export baked into the base app (recommended for
  v1) vs a full server zone from day one.
- **Admin v1 scope**: users/sessions (better-auth admin plugin) + file
  administration via scene-store; libraries/system settings deferred.
