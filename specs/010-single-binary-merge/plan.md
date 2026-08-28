# Implementation Plan: Single-Binary Merge

## Steps

1. **Static export** — `apps/crafty-web/next.config.mjs`: `output: "export"`, drop the `/api` rewrites (the merged server serves the API). Verified: `next build` emits the WASM renderer into `out/`.
2. **Server absorption** — move `apps/crafty-server` into `apps/cli/src/server.ts`:
   - `createCraftyRequestHandler` (http/https-agnostic) plus `createCraftyServer` wrapper; test surface preserved and moved.
   - `dataDir` option: load the scene from `<dataDir>/scene.json` on boot, persist on successful PUT (revision-checked).
   - Static serving reads embedded assets via the generated manifest when standalone, falls back to `node:fs` under Node/vitest.
   - Removed the old `import.meta.url` auto-run guard (it fires inside compiled binaries, where every bundled module's `import.meta.url` equals `file://` + `process.argv[1]`).
3. **Merged entry** — `apps/cli`:
   - `src/index.ts` dispatches on argv: `serve` → serve face; `api` → API-only dev face; known CLI command names → `@crafty/cli` `run`; otherwise → desktop face.
   - Desktop face: loopback server on 4173, opens the system browser.
   - Serve face: data directory, Tailscale-aware certificates, HTTPS on `0.0.0.0:4173`.
4. **Packaging** — `scripts/build-crafty-binary.mjs`: build deps, generate the web-assets manifest, `bun build --compile` into `dist/crafty`. (`--asset` and `--embed` were both tried; neither is resolvable at runtime in bun 1.3.14 — the `with { type: "file" }` import manifest is the working mechanism.)
5. **Remove MCP** — deleted `packages/mcp`; live docs cleaned (`docs/operator-workflows.md`, README, `apps/cli/readme.md`, current-state audit). Historical specs/research keep their records.
6. **Docs** — README run instructions (desktop + iPad + CLI), operator workflows, `apps/cli/readme.md`, this spec.
7. **Verification** — `npm run build`, `typecheck`, `test`, `lint`, `format:check`; binary smoke tests from a foreign cwd: desktop face serves `/` (embedded), the WASM asset, and `/api/scene`; traversal 404s; CLI face runs `list` and `doctor`; serve face answers HTTPS with Tailscale certs; persistence round-trip across restart.
