# Multi-zone platform — design

Grounding: the Next 16 multi-zones guide shipped in this repo
(`node_modules/next/dist/docs/01-app/02-guides/multi-zones.md`) is the
authoritative reference for the mechanics. Key facts it establishes:

- A zone is a normal Next app with an `assetPrefix`; the app owning `/`
  needs neither. Since Next 15 the zone's own server serves its prefixed
  assets in-process; in Crafty's multi-process topology the base app still
  rewrites each zone's asset prefix (`/editor-static/*`, `/admin-static/*`)
  so the browser's asset requests reach the right zone process.
- Routing to zones is done with `rewrites` in one app (recommended over an
  external proxy); destinations are URLs — production domains, or localhost
  ports in dev.
- Cross-zone navigation is a **hard navigation** (no shared RSC payload, no
  prefetch, no shared layouts); links between zones are plain `<a>`.
- Zone paths must be globally unique across the domain.

## 1. Zone topology

```
                        domain
                          │
              ┌───────────▼───────────┐
              │   apps/base (blank)   │  rewrites table · /api/health · 404
              └───────────┬───────────┘
       ┌────────────┬─────┴──────┬──────────────┐
       ▼            ▼            ▼              ▼
   marketing     docs        admin           editor (crafty-web)
   /             /docs/*     /admin/*        /files/*  /api/*
   static        static      auth-required   auth API + save boundary
```

- **`apps/base`** — blank by construction: no product logic, no scene-store,
  no auth. Its `next.config` holds `beforeFiles` rewrites whose destinations
  come from env (`ZONE_MARKETING_URL`, `ZONE_ADMIN_URL`, `ZONE_EDITOR_URL`),
  so the same build runs in the bundled artifact (loopback URLs) and,
  later, against independently deployed zones. Static marketing/docs output
  is copied into the base app's `public/` at bundle time, so `/` and
  `/docs/*` are served by the base itself — zero marketing runtime in v1.
  `app/api/health/route.ts` is its only own route.
- **`apps/marketing`** — landing + docs. `output: "export"` for v1; content
  is authored here and its static output is consumed by the bundle (and
  mounted under the base app's `public/` in dev too, or served by its own
  `next dev` when being worked on — the dev supervisor decides by
  availability).
- **`apps/admin`** — new. Server Components reading scene-store (files,
  revisions, snapshots) + better-auth admin plugin (users/sessions). Every
  route guarded by session check in the layout. No auth route mount.
- **`apps/crafty-web`** — the editor zone. Loses `/` (the file browser moves
  to `/files`) and gains the auth API mount. Everything else — kernel
  wiring, panels, renderer adapter, scene API — stays where it is.

Path ownership is a table in `design.md` and enforced by the base app's
rewrites; a path not in the table is a 404 by construction.

## 2. Deployment model: one artifact, many processes

The distribution stays a self-contained `dist/` directory with the bundled
bun runtime (ADR 0015). It now contains four standalone server trees (base,
admin, editor) plus the static marketing output inside the base's `public/`,
and the launcher grows a supervisor role:

```
dist/crafty serve        → TLS terminator (existing) → base :4173
                            base rewrites → marketing (static, in-process)
                                          → admin    :4174 (loopback)
                                          → editor   :4175 (loopback)
dist/crafty serve --http → no TLS, bind 0.0.0.0:3000 (behind Traefik on Dokploy)
```

Zone ports are env-configured (`ZONE_ADMIN_URL=http://127.0.0.1:4174` …)
with defaults. `next-server.ts` generalises from one spawned server to a
managed set: spawn, wait-for-port, shutdown-on-signal (the existing pattern
per zone). Independent deployment later = point the env URLs at real domains;
nothing else changes.

**Costs accepted:** each zone is a separate process (memory), and a full
reload happens at zone boundaries (marketing → editor). Both are inherent to
multi-zone and are mitigated by keeping every flow *inside* a zone: the
editor zone contains the file browser → editor → API path, so a working
session never crosses a boundary.

## 3. Auth (better-auth)

**Why same-domain works.** Zones share the domain, so cookies are domain-wide.
One zone issues the session; every zone sees it. No OAuth/OIDC flow, no
`SameSite=None`, no cross-origin CORS — the multi-app machinery from the
better-auth research (OIDC provider, generic OAuth) is unnecessary.

**Layout:**

- **`packages/auth`** (`@crafty/auth`) — the shared configuration factory:
  database adapter (Postgres via `postgres`, the better-auth standard),
  `BETTER_AUTH_SECRET`, session expiry, cookie prefix, and the mode gate
  (`CRAFTY_AUTH_MODE === "on"`). App-specific plugins are added per zone:
  the admin plugin in the admin zone only. This respects the package
  boundary convention: one configuration, two consumers, no duplicated
  session logic.
- **Editor zone** mounts `app/api/auth/[...all]/route.ts` with the
  `nextCookies` plugin (cookies must be settable from RSC/server actions).
  This is the only auth API on the domain.
- **Admin zone** runs the same config (its own instance, same DB + secret),
  no route mount; guards are `auth.api.getSession({ headers })` in the
  layout, redirecting to the editor zone's sign-in. The better-auth admin
  plugin backs users/sessions management.
- **Conditional mode.** `CRAFTY_AUTH_MODE=off` (the default; local/serve
  faces never set it): no database connection is opened, the auth route
  returns 404, guards pass. Current local behavior is bit-for-bit unchanged.
  `on` (Dokploy): DB required at startup, guards active, sign-in at
  `/files/sign-in` (editor zone). The gate lives in `packages/auth` and is
  the single decision point — no zone re-implements "is auth on".

**Database.** better-auth needs users/sessions tables — Crafty's first
database. Postgres, Dokploy-managed, internal Docker hostname. Table
creation: better-auth CLI-generated SQL applied at container start, before
the launcher spawns zones (validated in stage 4; the standalone-tracing
pitfall from the Dokploy research — migration scripts must not import
modules outside the traced graph — argues for SQL-in, not code-in).

**Non-goal:** local-first mode never gains auth. The desktop and serve faces
stay open on trusted networks; auth is a deployment concern, which is why the
mode gate is a deployment variable, not a product setting.

## 4. Dev workflow

`dev-next.mjs` becomes a supervisor: builds the shared packages, then starts
base + admin + editor `next dev` servers on their dev ports, wiring the same
`ZONE_*_URL` env contract. Marketing runs as its own dev server when its
routes are being worked on; the base's `/` rewrite falls back to the editor
zone's `/files` redirect when the marketing dev server is absent. One
command (`bun run dev`), one origin (`:4173`), unchanged developer
experience for editor work.

## 5. Dokploy: one cohesive whole

One Dokploy **project** containing one Application + one Postgres service
+ one volume:

- **Dockerfile** (`deploy/Dockerfile`): multi-stage with `oven/bun`; the
  builder stage carries the Rust toolchain (wasm32 target) +
  wasm-bindgen-cli at the locked version (the existing CI recipe), runs
  `bun run bundle`; the runner stage is just the `dist/` directory +
  `CMD ./dist/crafty serve --http` on `0.0.0.0:3000`. Healthcheck against
  `/api/health`.
- **Postgres** service: better-auth tables; internal hostname, no exposed
  port.
- **Volume**: the scene data directory (`CRAFTY_DATA_DIR`) — scene files,
  revisions, snapshots persist across deploys.
- **Env contract** (documented in `deploy/README.md`): `DATABASE_URL`,
  `BETTER_AUTH_SECRET`, `CRAFTY_AUTH_MODE=on`, `ZONE_*_URL` defaults, port.
- **Traefik**: one domain, auto TLS; the launcher's own TLS terminator is
  off (`--http`).
- Startup order: apply auth SQL → start launcher (which spawns zones).

## 6. What this change does NOT do

- No kernel, schema, renderer-protocol, or command changes.
- No auth in local mode; no change to the desktop/serve faces' trust model.
- No move of the authored/resolved line; scene-store stays the single store,
  read by the editor zone and the admin zone alike (zones are serving
  boundaries, not data boundaries — micro-frontends, not microservices).
- No library/component surfaces, no design-system infrastructure.
