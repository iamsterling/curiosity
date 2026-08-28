# Crafty on Dokploy

One Dokploy **project**, four parts, one public domain — the multi-zone
platform as a service mesh on the project's Docker network:

| Service | Image target (`Dockerfile`) | Role |
|---|---|---|
| **crafty-base** | `base` | Public entry: `/` + `/docs` (baked marketing static), rewrites to the other zones, `/api/health` |
| **crafty-editor** | `editor` | Internal: the file browser, the editor and the scene API (`/editor/*`, `/api/*`) |
| **crafty-admin** | `admin` | Internal: system administration (`/admin` via the base's rewrite) |
| **crafty-postgres** | managed service | better-auth tables (stage 3) |

Only the base has a public domain; the editor and admin answer only on the
internal Docker network, reachable through the base's server-side rewrites.

## The shared build

One `Dockerfile`, three targets. A single `builder` stage compiles the full
artifact once — Rust toolchain, wasm encoder, marketing static, all three
zone standalones. Each zone target is a runner that copies only its own
standalone out of the builder:

```
FROM oven/bun AS builder   # bun install + toolchain + bundle
FROM runner AS base        # COPY dist/base  → /app/zone  (HEALTHCHECK /api/health)
FROM runner AS editor      # COPY dist/web   → /app/zone  (HEALTHCHECK /editor)
FROM runner AS admin       # COPY dist/admin → /app/zone  (HEALTHCHECK /)
```

On one daemon the first zone build pays the toolchain + bundle; the other
two reuse the cached builder layers and are pure copies. Each runner image
contains only its service's code — the admin image ships the editor's
*kernel* (document layer) but never the canvas: its node_modules closure
stops at the kernel's dependency boundary (see
`scripts/build-crafty-binary.mjs`), so no renderer, no wasm, no React UI
libraries. The standalone root layout is identical in every image
(`/app/zone/apps/web/*/server.js`), so the CMD is shared.

In Dokploy, set the app's **build stage** field to the zone target.

## Build arguments

| Arg | Services | Notes |
|---|---|---|
| `ZONE_EDITOR_URL` | base only | `http://<editor-appName>:3000`. The rewrites are baked into the routes manifest at build time (and turbo hashes the vars — see `turbo.json`), so these must be build args, not runtime env. |
| `ZONE_ADMIN_URL` | base only | `http://<admin-appName>:3000`, same reason. |

## Environment (per service)

| Variable | Value | Services |
|---|---|---|
| `CRAFTY_DATA_DIR` | `/data` (the shared volume mount) | all |
| `DATABASE_URL` | `${{project.DATABASE_URL}}` | all (stage 3) |
| `PORT` / `HOSTNAME` | `3000` / `0.0.0.0` | baked into the image |

## Wiring

1. Create the three applications in the Crafty project (source **Docker
   Image**, our registry, `crafty-base:latest` / `crafty-editor:latest` /
   `crafty-admin:latest` — the image field must be fully qualified);
   mount the `crafty-data` volume at `/data` on each; set
   `CRAFTY_DATA_DIR=/data` and `DATABASE_URL=${{project.DATABASE_URL}}`.
2. Add the domain to the base only; point the DNS A record at the VPS IP;
   Dokploy provisions Let's Encrypt via Traefik.
3. Deploy — normally via the CI loop, not by hand.

## The CI loop

`.github/workflows/deploy.yml` runs on a **self-hosted runner on the VPS**
(the images must run on amd64 — building on any other host produces images
the VPS cannot run). On every push to `main` it builds the three zone
targets (the shared builder stage makes the second and third builds cache
hits), pushes them to the Dokploy registry, and triggers the three
applications to redeploy from the new tags. The apps never build
server-side.

Repository configuration: the zone hostnames and application IDs are
**variables** (`REGISTRY_URL`, `EDITOR_HOST`, `ADMIN_HOST`, `*_APP_ID`);
registry credentials and the Dokploy API key are **secrets**.

## Running locally

`compose.yaml` at the repo root runs the same platform from the same
Dockerfile: `docker compose up --build`, then `open http://localhost:3000`.
The base's rewrites target the compose service names, so the local and
deployed topologies are identical. The `postgres` service is Postgres 18+;
its volume mounts `/var/lib/postgresql` (the 18+ layout), not the legacy
`/var/lib/postgresql/data` path, which the 18+ entrypoint refuses to run
with.

The editor service additionally bind-mounts the repo (`.:/app`) so the
editor container can run a live dev server against the source; the
`/apps/web/editor/node_modules` and `/apps/web/editor/.next` mounts keep
the container's own install and cache.

## Notes

- **Scenes persist via the shared volume** — all three services mount
  `crafty-data` at `/data`; the store is a filesystem, and every zone reads
  the same directory.
- **The desktop/serve artifact is unchanged** — `bun run bundle` still
  produces the full `dist/` with the `dist/crafty` launcher for local use;
  the Dockerfile's builder runs the same bundle.
- Auth (stage 3) makes `CRAFTY_AUTH_MODE=on` + `BETTER_AUTH_SECRET` needed
  on the editor and admin services; the auth API stays with the editor zone.
