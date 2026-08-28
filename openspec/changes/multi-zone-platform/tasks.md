# Multi-zone platform — tasks

Stages are deliberately sequenced: the platform split (1) must land green
before any zone exists; auth (3) before the Dokploy deploy (4) is meaningful.

> **Blocked-on note:** this change's verification depends on the ADR 0016
> retirement landing first — the working tree's in-flight rename of
> `@crafty/editor-kernel` → `@crafty/editor` (staged, mid-consumer-update)
> leaves the workspace unresolvable. `scripts/dev-next.mjs` and
> `scripts/build-crafty-binary.mjs` reference the pre-rename package name in
> their build lists; they must move to `@crafty/editor` when the retirement
> lands.
>
> **Resolved 2026-08-09:** the retirement landed in the tree; both scripts
> now build `@crafty/editor` and run `build:wasm` for `@crafty/scene-renderer`
> explicitly (the wasm encoder is a build unit inside the package, not a
> separate package). Stage 1 verification is green.

## 1. Platform split: base app + editor zone + supervisor

- [x] 1.1 `apps/base`: scaffold (root layout, `next.config` with the
  `afterFiles` rewrite table driven by `ZONE_*_URL` env with loopback
  defaults, `app/api/health/route.ts`); blank by construction — no
  scene-store, no auth, no product routes; `/` redirects to `/files` as a
  stage-1 placeholder for marketing
- [x] 1.2 Editor zone: move the file browser from `/` to `/files` (deleted
  the old `/` route from `apps/crafty-web`); added `assetPrefix`
  `/editor-static`; dev port moved to 4175 (loopback — the base owns :4173)
- [x] 1.3 `scripts/dev-next.mjs` is now a supervisor: shared-package
  builds, then base + admin-slot + editor dev servers with the `ZONE_*_URL`
  contract; `/` falls back to the `/files` redirect when no marketing dev
  server is present <!-- verification pending the retirement landing -->
- [x] 1.4 `scripts/build-crafty-binary.mjs`: zone table (base/editor/admin
  standalone trees → `dist/base`, `dist/web`, `dist/admin`); the launcher
  supervisor (`apps/cli/src/next-server.ts` `startZones`: spawn all zones,
  wait-for-port per zone, shutdown-on-signal); `--http` mode
  (`apps/cli/src/serve.ts`, `faces.ts`, `index.ts`) <!-- verification
  pending the retirement landing -->
- [x] 1.5 Verification: `bun run dev` (base :4173 HTTPS → editor :4175; `/` 307→`/files`; `/files`, `/files/<slug>`, scene API 200 through the base; `/api/health` 200 on the base; 404 table; `/editor-static/*` asset flow through the base), `bun run bundle`, `dist/crafty serve --http` from a foreign cwd — all routes green, save round-trip 200, shutdown kills the whole zone tree (process-group) <!-- verified 2026-08-09; two pre-existing retirement bugs fixed en route: missing "use client" on harness.ts/use-mobile.ts, and the wasm subpath exports pointing at src (Turbopack ESM resolution) — now `./wasm` → dist/wasm/index.js with src/wasm included in the main tsconfig -->
- [ ] 1.6 Update `docs/architecture/current-state.md`, `README.md`,
  `docs/operator-workflows.md` for the new topology and commands <!-- in progress: current-state + operator-workflows + README updated; final pass with the rest of the change -->

## 2. Zones: marketing (static) and admin

- [x] 2.1 `apps/web/marketing`: landing at `/` + docs at `/docs`,
  `output: "export"`, `assetPrefix: /marketing-static`
- [x] 2.2 Bundle integration: the export is baked into the base app's
  `public/` before the base's build (assets remapped `_next` →
  `marketing-static/_next`, clean URLs normalized to directory-index files);
  the base's optional catch-all serves the static site (`/` and `/docs/*`)
  behind the zone rewrites; the dev supervisor runs the marketing dev server
  on :4177 and the base rewrites `/` + `/docs/*` to it when it is up
- [x] 2.3 `apps/web/admin`: scaffold with Server Components reading
  scene-store (files list with revision/page/snapshot columns) — no auth yet
  (stage 3 gates it); the base rewrites `/admin` and `/admin/*` to it
  path-preserving; the launcher spawns it (dist/admin)
- [x] 2.4 Verification: dev (four zones, `/` → marketing landing, `/docs`
  200, editor + admin + health + 404 table green) and the bundled
  `dist/crafty serve --http` from a foreign cwd — `/`, `/docs`, `/files`,
  `/files/<slug>`, `/admin`, `/api/health` all 200 with content checks, the
  marketing asset flow through `/marketing-static/*`, save round-trip 200
  <!-- verified 2026-08-09; the base's own `/` route was removed — the
  marketing static site owns the root now -->

## 3. Auth: better-auth under the shared configuration

- [ ] 3.1 `packages/auth`: shared better-auth config factory — Postgres
  adapter, `BETTER_AUTH_SECRET`, session options, `CRAFTY_AUTH_MODE` gate
  (off = no DB, 404 auth API, guards pass); tests for the gate and the
  session contract (kernel-style, no DOM)
- [ ] 3.2 Editor zone: mount `/api/auth/[...all]` with `nextCookies`;
  sign-in page at `/files/sign-in`; guard `/files/*` when mode is `on`
- [ ] 3.3 Admin zone: same shared config + admin plugin (users/sessions);
  layout-level session guard redirecting to the editor zone's sign-in
- [ ] 3.4 Auth SQL (better-auth CLI-generated) applied at start in
  deployed mode; document the standalone-tracing constraint
- [ ] 3.5 Verification: local mode unchanged (no DB, no guards); deployed
  mode — sign-in on the editor zone, session valid in the admin zone,
  marketing public

## 4. Dokploy: one cohesive whole

- [x] 4.1 `deploy/`: Dockerfile (oven/bun multi-stage, Rust toolchain +
  wasm-bindgen-cli at the locked version, `bun run bundle`, runner = dist +
  `./dist/crafty serve --http` on `0.0.0.0:3000`), healthcheck on
  `/api/health`, env contract and README
- [ ] 4.2 Wire the stack on the Dokploy instance: Application (Dockerfile
  build), managed Postgres, data volume, domain via Traefik; env set per
  the contract
- [ ] 4.3 First deploy: `/api/health` green; marketing, editor flows and
  admin behind login on the public domain; scenes and sessions survive a
  restart
- [ ] 4.4 ADR: the zone topology, the auth model (mode-gated better-auth,
  one auth mount) and the one-artifact-many-processes deployment — recorded
  after implementation, superseding the single-process wording of ADR 0008's
  distribution shape where they conflict
