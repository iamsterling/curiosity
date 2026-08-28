# ADR 0016: Retire the Block-Compiler Lineage

Status: Accepted — implemented
Date: 2026-08-08

## Context

The repository contains two product lineages. The canvas lineage — kernel,
renderer, store, web app, launcher — is the product. The block-compiler
lineage — "load component blocks, validate them against contracts, compile to
HTML/CSS, preview, inspect in a VS Code webview" — is a different, earlier
product. It has received no design work, and its vocabulary (`componentId`,
`sourceRevision`, `targetId`) is from that other product.

The inventory in [`legacy-and-cleanup.md`](../legacy-and-cleanup.md) classified
it as uncertain and required a deliberate decision rather than an opportunistic
cleanup commit. This ADR is that decision.

The verified facts at decision time:

- 19 packages + `apps/vscode-extension` + `apps/web` (an empty, untracked
  directory) belong to the lineage. Only 8 packages/apps serve the canvas
  product.
- The lineage's only bridge into the shipped product was one import line:
  `apps/cli/src/index.ts` → `@crafty/cli` → `@crafty/api`, backing the
  `list/doctor/validate/compile/preview/inspect/discover/config/facade` CLI
  faces.
- `authoring`, `baseline` and `quality-gates` were imported by nothing at all —
  dead even within the lineage.
- `turbo run build/typecheck/test` has no filters, so every verification pass
  built and tested the whole dormant lineage — roughly doubling the build and
  test surface for a product that receives zero design work.
- The two "worth keeping" arguments had already been absorbed: atomic
  temp-file/fsync/rename writes now live in `packages/scene-store`, and the
  determinism/capability-profile ideas from `packages/animation` were never
  wired to the canvas; the canvas motion model is designed separately
  ([`animation.md`](../animation.md)) and makes the same separation of intent
  from resolved frame.

## Constraints

- The canvas product loses nothing that serves it. The launcher keeps
  `desktop`, `serve`, `import`, `save` and `load`; only the old-product CLI
  commands are cut.
- The retained lessons must survive: atomic writes (in `scene-store`), the
  intent/resolved-frame separation (in `animation.md` as target design), the
  thin-facade principle (in `agent-editing.md` prior art).
- Historical records are not destroyed: the four ADRs in `docs/adr/` and the
  frozen specs in `specs/` stay for intent archaeology.

## Options Considered

1. **Keep it dormant.** It builds, it tests, the CLI faces ship in the binary.
   Lost because the cost is now concrete — every verification pass builds and
   tests it, and two component models in one repo confuse anyone reading the
   code cold. "Dormant" in practice meant "build and test forever".
2. **Keep the VS Code extension, retire the rest.** The extension is a shipped
   face of a product that is not being developed; keeping it forces keeping
   most of its support tree (`api`, `contracts`, `core`, `compiler-html`,
   `generation`, `animation`, `target-registry`, `webgl-target`, `facade`,
   `extension-bridge`, `schemas`). That is most of the surface for one
   unshipped-to product face.
3. **Full retirement (chosen).** Delete the whole lineage in one deliberate
   change, cut the `cli` face from the launcher, and record the decision here.

## Decision

Retire the block-compiler lineage entirely: delete the 19 packages, the VS Code
extension, the empty `apps/web`, the `component-workbench` skill, and the
lineage's test workspaces; cut the `cli` face and the old CLI commands from the
launcher; remove the lineage from the bundle script, the root build filter and
the docs. The decision does **not** cover the frozen historical records
(`docs/adr/0001`–`0004`, `specs/`), which stay for archaeology.

## Consequences

- The repo is exactly the canvas product: 6 packages + 2 apps, one build and
  test surface.
- `./dist/crafty <old-command>` stops existing; `--help` documents only the
  live faces. Anyone who relied on the old CLI commands must keep an older
  build.
- `scripts/build-crafty-binary.mjs` no longer bundles `@crafty/api`/`@crafty/cli`
  or their third-party runtime deps (ajv et al.), shrinking `dist/`.
- `docs/architecture/legacy-and-cleanup.md` Part 2 is rewritten as a removal
  record; `current-state.md`, `README.md`, `operator-workflows.md`, `roadmap.md`,
  `animation.md`, `agent-editing.md`, `openspec/config.yaml` and the repo map in
  `AGENTS.md` are updated to the single-lineage reality.

## Risks

- The old product's good code (atomic writes, determinism, thin facade) is
  gone from the tree. It was already absorbed in principle; if the canvas
  needs a concrete reference later, it can be recovered from git history —
  the same way `source-repository`'s write pattern was re-derived for
  `scene-store`.
- The `cli` face is a capability regression for anyone using the old commands.
  If a need resurfaces, the canvas product's own faces are the pattern to
  extend — not the deleted lineage.

## Validation

- `bun run typecheck`, `bun run test`, `bun run lint` and `bun run format:check`
  pass with the lineage gone.
- `bun run bundle` assembles `dist/` from the canvas packages only (the ajv
  bundling loop is gone, so the bundle does not depend on the deleted packages).
- `./dist/crafty --help` lists no old-product commands.

## Revisit When

A concrete user need for any of the old CLI commands (list, doctor, validate,
compile, preview, inspect, discover, config, facade) or for a VS Code surface.
The canvas product's own faces are the correct place to rebuild such a need;
the deleted packages are not coming back as-is.
