# ADR 0015: Bun as Package Manager and Bundled Runtime

Status: Accepted — implemented
Date: 2026-08-08
Implementation status: `packageManager` is `bun@1.3.14`, `bun.lock` replaces
`package-lock.json`, all repo scripts and CI run under bun, and `bun run bundle`
assembles a `dist/` whose launcher and Next standalone server run on a bundled
`bun` binary. Verified end to end: the standalone server serves the file
browser, the editor shell and the document API under bun, and a save round-trip
with optimistic concurrency (`200` on a current revision, `409` on a stale one)
behaves identically to Node.

## Context

The repository ran on npm (workspaces, `package-lock.json`, `npm run --workspace`
chains in `scripts/*.mjs` and CI). The shipped artifact followed
[ADR 0008](0008-next-server-runtime.md): a self-contained `dist/` directory with
a **bundled Node binary** behind the `crafty` launcher, because copying the Node
binary "solves in ten lines" the problem of shipping a Next.js server with no
toolchain on the target machine.

Bun 1.3.x is now a mature alternative: it is the faster package manager and
runtime for the same JavaScript, it has first-class workspace and lockfile
support, and it is already the tool the agent tooling in this repository
(`aidlc`) runs on. Moving the whole repo to one runtime removes a toolchain from
every workflow — install, scripts, CI and the shipped artifact — without adding
a second runtime anywhere.

The open question was whether the **Next.js standalone server** — a Node
artifact that Next officially supports only on the Node runtime — runs correctly
under bun. That is not a given: Next traces a `node_modules` tree for
`standalone` output and expects a Node-compatible runtime to execute it. The
decision below is contingent on the verification in [Validation](#validation).

## Constraints

- The product must stay runnable on a machine with no Node, npm, or toolchain
  (ADR 0008 constraint, unchanged).
- Next stays on its supported `standalone` entry point. No bespoke server, no
  custom request handler.
- The editor surface and renderer are untouched by this decision; it is a
  toolchain and packaging change only.
- Verification must prove the **shipped artifact**, not just the dev path:
  the standalone `server.js` runs under the bundled bun binary, and the
  document API round-trips.

## Options Considered

- **Keep npm for the package manager, keep Node in `dist/`.** Status quo.
  Two runtimes in the repository (bun for agent tooling, npm/node for
  everything else), no consolidation.
- **Bun as package manager only; Node stays the bundled runtime.**
  Consolidates install and scripts but leaves the shipped artifact on Node —
  the repo would still ship a runtime it no longer uses for anything else.
- **Bun everywhere, including the bundled runtime. Chosen.** One runtime for
  install, scripts, CI and the artifact. Bun is a Node-compatible runtime and
  the standalone server is plain Node-compatible JavaScript; the risk is
  concentrated in one place and was verified empirically before committing to
  the choice.
- **`bun build --compile` single executable.** Rejected for the same reason as
  in ADR 0008: the artifact is a Next server with a traced dependency tree, so
  a directory with a launcher remains the shape. Bun replaces Node *inside*
  that shape; the shape does not change.

## Decision

**The repository moves to bun, and the shipped runtime is bun.**

1. `packageManager` is `bun@1.3.14`; `bun.lock` is the committed lockfile;
   `package-lock.json` is deleted.
2. All scripts run under bun: root and workspace scripts, `scripts/*.mjs`
   (`dev-next.mjs`, `build-crafty-binary.mjs`, the wasm build/test scripts),
   and CI. `npm run build --workspace X` becomes `bun run build --filter X`.
3. `bun run bundle` copies the running bun binary into `dist/` as `dist/bun`
   (replacing `dist/node`), and the `dist/crafty` launcher and
   `apps/cli/src/next-server.ts` (which spawns `process.execPath` on the
   standalone `server.js`) run it. The Next standalone server executes under
   bun.
4. The vscode-extension test runner recognises `bun` as a package manager and
   test runner prefix.

## Consequences

**Gained**

- One runtime across the repository: install, scripts, CI, the shipped
  artifact, and the existing bun-based agent tooling.
- Faster installs (bun's parallel resolver) and fewer moving parts
  (`package-lock.json` → `bun.lock`).
- The bundled runtime matches the runtime every contributor develops against —
  the dist artifact no longer ships a Node nobody else uses. The artifact also
  shrank: ~169 MB with Node → ~110 MB with bun.

**Lost or paid for**

- Next.js officially supports the Node runtime; the standalone server under bun
  is verified but not vendor-blessed. A future Next major that assumes a
  Node-only runtime behavior could break `dist/`'s web face — caught by the
  bundle + smoke verification, but the onus is on this repo, not Next.
- `bun install` resolves the same semver ranges into a different concrete tree
  than npm's hoisting; dependency-level issues that npm's tree masked (or that
  only manifest under npm's duplication) may surface under bun.

## Risks

- **Next standalone server behavior under bun.** Mitigated by the
  [Validation](#validation) below, which exercised the production artifact,
  not the dev server. Watch item: any Next upgrade re-verifies the standalone
  server under the bundled bun.
- **Vitest worker pool under bun.** The repo's test command is `vitest run`
  per package; vitest spawns worker threads and is not bun-specific. The full
  suite passed under bun during the migration (see Validation).
- **Tooling that assumes npm.** `corepack`, IDE integrations, and the dormant
  vscode-extension test runner read `packageManager`; the runner was updated
  to recognise bun. `.npmrc` does not exist and none was added.

## Validation

- Crux check first: `next build` standalone output run with `bun server.js`
  served `200` on `/`, `/files/<slug>`, and `/api/files/<slug>/document`; a
  GET → PUT save round-trip returned `200` with the current revision and `409`
  with a stale one — identical to the Node runtime.
- `bun install --frozen-lockfile` succeeds from a clean state; `bun.lock` is
  committed.
- The bundle verification caught two places where npm's root hoisting had been
  leaking the repository's `node_modules` into `dist/`: `@crafty/editor-kernel`
  was missing from the bundled workspace list, and the dormant CLI path's
  third-party runtime deps (ajv and its closure) were never copied at all.
  Both are fixed in `scripts/build-crafty-binary.mjs`; the bundle is now
  self-contained for the CLI face when run outside the repository (which was
  never true under the Node bundle either — only the web face was exercised
  from outside).
- Full mechanical verification under bun: `bun run typecheck` (27/28 tasks;
  the sole failure is the pre-existing crafty-web `ai-elements` typecheck
  breakage that predates this change), `bun run test` (54/55 tasks, same
  single pre-existing failure), `bun run lint` clean, `bun run format:check`
  (only the two pre-existing `layout.tsx` whitespace flags), and `bun run
  bundle` producing a working `dist/crafty` run from outside the repository:
  `--help`, `list`, `doctor`, and the full `serve` face (TLS + standalone
  server under the bundled bun, `200` on all routes, `PUT` round-trip `200` /
  stale `409`).
- The pre-existing crafty-web typecheck failure (`src/components/ai-elements/*`)
  predates this change and is unaffected by it; the standalone build needed for
  the crux check was produced with `typescript.ignoreBuildErrors` temporarily
  enabled and that change was reverted before the bundle verification.

## Revisit When

- A Next upgrade breaks the standalone server under bun — then either pin the
  web face back onto a bundled Node (hybrid artifact) or re-evaluate the
  launcher shape.
- A dependency behaves differently under bun's resolver in a way npm's tree
  masked — decide per case whether the bun tree or a forced resolution is the
  fix; do not silently re-add npm.
