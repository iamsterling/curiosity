# Editor package consolidation — tasks

- [x] **H2 Resize arming** — the 16px corner test moved into the interaction
  reducer (`RESIZE_HANDLE_SCREEN_PX`, `cornerHit`, `selectedBounds` context
  field); the `move` effect carries `resize?: boolean`; `armResize`/
  `resizeStart` and the `previewMove` branch are deleted. 4 new reducer
  tests; the harness resize test passes unchanged (339 → 339 suite).
- [x] **H3 Marquee geometry** — `marqueeSelectableIds` (document-native,
  visibility-/lock-inheriting, pre-order) + `kernel.marqueeSelect(world,
  additive)`; the projected-Scene walk (`flattenSelectable`,
  `collectWorldBounds`, `intersects`, `getFrame`) is deleted. 8 new kernel
  tests (suite 339 → 347).
- [x] **H4 Paste target resolution** — the kernel resolves the paste parent
  over the authored document via `documentHitTest` (which gains its first
  production caller); the harness's `pasteTargetParent` and its spatial-index
  walk are deleted. 4 new clipboard tests (suite 347 → 351); one existing
  assertion updated for the intended document-native rule.
- [x] **H5 Duplicate** — `kernel.duplicateSelection()`: fresh ids, "copy"
  name, +24 offset, one history entry, selection lands on the copy; the
  harness's clone routine is deleted. 5 new kernel tests (suite 351 → 356).

## Follow-up (in progress): harness semantics → kernel

Debt item 3, applied in slices after the consolidation landed. The harness
(`packages/editor/src/ui/editor/harness.ts`) should end as a thin adapter: DOM
events in, kernel calls out, projection to the renderer. **All five slices
landed (H1–H5); the harness still holds the spatial index for click
hit-testing and the pen session's bookkeeping — the smaller remaining
candidates.**

## Follow-up (applied 2026-08-08): renderer package merge

The follow-up to 1.4's cycle-breaking work: `scene-renderer` + `scene-renderer-wasm`
merged into ONE `packages/scene-renderer`, decided after the consolidation landed.
The JS/WASM line was never a package boundary — the versioned packet protocol is
the enforcement, so the split only doubled build/tests/bundle surface.

- [x] F1 Host TS (`src/`) + module TS (`src/wasm/`) + the cargo crate
  (`rust/`, incl. WGSL shaders that ride `include_str!`) + committed
  wasm-bindgen output (`pkg/`) in one package; exports map: `.` (host,
  built to dist) and `./wasm` (module side, shipped as source — Next
  consumes workspace source; the module side cannot emit because its
  imports reach the generated `pkg/` glue outside rootDir)
- [x] F2 Two tsconfigs: `tsconfig.json` (host build, excludes `src/wasm/`)
  and `tsconfig.wasm.json` (module typecheck, noEmit)
- [x] F3 The renderer regression benchmarks (pen drag, encode parity,
  protocol v2 batch) moved to `apps/crafty-web/benchmarks/` — the only
  cycle-free home, because the benchmark needs `@crafty/editor` +
  `@crafty/pen-import` and the editor depends on the renderer (a
  renderer-side devDependency would be a turbo-visible cycle). The wasm
  subpath gained `initWasm`/`serializeRenderPacket` re-exports so the
  benchmarks import through the package API, not package-internal paths
- [x] F4 Scripts: build/test/patch scripts point at `rust/` + `pkg/`; CI
  (`renderer.yml`) path filters, cargo working-directory and artifact
  paths updated; bundle/dev/browser filters drop the merged package
- [x] F5 Docs: AGENTS.md map, current-state, wasm-boundary, renderer,
  interaction-conformance, testing counts (scene-renderer 90 vitest + 42
  cargo), apps/cli readme
- [x] F6 Verified: typecheck clean (except pre-existing crafty-web
  ai-elements), 90 vitest + 42 cargo + 13 app benchmarks green, lint
  clean

## 1. Package rename and structure

- [x] 1.1 `git mv packages/editor-kernel packages/editor`; package.json: name `@crafty/editor`, exports map with `./kernel` and `./ui`; move `src/*` → `src/kernel/*`; update internal relative imports
- [x] 1.2 `packages/editor/package.json`: add the ui kit's third-party deps moved from `apps/crafty-web`; keep the kernel subpath free of react imports (lint-enforced)
- [x] 1.3 Update all `@crafty/editor-kernel` imports to `@crafty/editor/kernel` in scene-renderer, pen-import, scene-store, scene-renderer-wasm (benchmark), apps/cli
- [x] 1.4 Update dependency entries in all consuming package.json files; **plus** the cycle-breaking work the move forced: the shared viewport constants (`ZOOM_MIN`/`ZOOM_MAX`/`WORLD_LIMIT`) moved to `packages/scene-model/src/constants.ts` (the leaf) so `scene-renderer` no longer imports the kernel, and the WASM/WebGPU runtime loader is injected into `CanvasStage` via a `CanvasStageRuntime` prop (wired by the app in `canvas-stage-with-runtime.tsx`) so the editor package does not depend on `scene-renderer-wasm` (which depends on `pen-import` → kernel). `status-bar.tsx` uses a plain anchor instead of `next/link`, letting the package drop the `next` dependency and stay NodeNext-clean. The pre-existing `dropdown-menu.tsx` exactOptionalPropertyTypes error moved with the file and was fixed (`checked ?? false`).

## 2. Move the chrome from crafty-web

- [x] 2.1 `apps/crafty-web/src/editor/*` → `packages/editor/src/ui/editor/`: harness, editor-context, editor-chrome, canvas-stage, keyboard-bindings, editing-overlays, overlay, persistence, autosave, save-with-retry, tool-shortcuts, theme-accent, mutable-ref, preferences + all tests
- [x] 2.2 `apps/crafty-web/src/components/ui/*` → `packages/editor/src/ui/primitives/`, plus `cn` (`ui/lib/cn.ts`) and `use-mobile` (`ui/lib/use-mobile.ts`)
- [x] 2.3 `apps/crafty-web/src/components/editor/*` → `packages/editor/src/ui/editor-primitives/`: `editor-panels.tsx` split into panel-shell/pages-panel/layers-panel/states-panel/scene-actions/status-bar/renderer-proof-chip; `editor-toolbar.tsx` split into tool-button/tool-toggle-group/active-tool-pill/grid-toggle/selection-actions/history-actions/zoom-{trigger,in,out,input,preset}/gesture-control with shared `selectors.ts` and `canvas-center.ts`; plus canvas-context-menu and panels/inspector
- [x] 2.4 `packages/editor/src/ui/index.ts` barrel: re-exports the ui surface; `apps/crafty-web` imports `@crafty/editor/ui` (layout.tsx, page.tsx, ai-elements)
- [x] 2.5 `apps/crafty-web/package.json`: removed the moved third-party deps; depends on `@crafty/editor` + `@crafty/scene-renderer-wasm` (for the runtime wiring)

## 3. Scripts and build surface

- [x] 3.1 `scripts/dev-next.mjs` buildPackages: `@crafty/editor`
- [x] 3.2 `scripts/build-crafty-binary.mjs`: buildPackages + dist workspace list
- [x] 3.3 root `package.json` `build:browser` filter: `@crafty/editor`
- [x] 3.4 `scripts/lint.mjs`: kernel-React-free check (`packages/editor/src/kernel/**` must not import react/react-dom)
- [x] 3.5 Confirmed the rename does not leak into the Rust side (the wasm benchmark's kernel/pen-import imports moved to devDependencies)

## 4. Docs (live docs only; specs/007–011, ADRs, research are frozen)

- [x] 4.1 `docs/architecture/editor-kernel.md` → `editor.md`: retitled to the editor package (kernel + chrome), package layout section, lint-enforced no-React rule, harness path updates
- [x] 4.2 `docs/architecture/README.md`: index entry for editor.md
- [x] 4.3 `AGENTS.md`: repository map row, React-boundary diagram, dependency-flow rule (scene-model is the leaf; kernel subpath never depends on the renderer)
- [x] 4.4 `docs/architecture/current-state.md`: package table, path citations, forward/reverse path traces, finding 2 (constants in scene-model), debt item 3 wording, test counts (editor 335, crafty-web none — moved)
- [x] 4.5 Other live docs: react-boundary, testing (counts), coordinate-systems, performance, research-ledger, invariants, editor.md, apps/cli/readme.md
- [x] 4.6 README.md / operator-workflows.md: no stale package references remain

## 5. Verification

- [x] 5.1 `bun run typecheck` — all packages clean except the pre-existing `apps/crafty-web` ai-elements failures (untouched; the dropdown-menu failure moved into the package and was fixed)
- [x] 5.2 `bun run test` for editor (335), scene-model (7), scene-renderer (52), scene-store (41), pen-import (13), scene-renderer-wasm (51+1 skipped), apps/cli (21) — all green, harness tests still React/DOM-free
- [x] 5.3 crafty-web has no tests of its own — they moved with the code into `packages/editor`
- [x] 5.4 `bun run lint` (including the kernel-React-free check) clean; `format:check` only the two pre-existing flags
- [x] 5.5 `bun run build --filter @crafty/editor` emits `dist/kernel/` + `dist/ui/`; bundle script syntax-checked (full `bun run bundle` blocked by the pre-existing crafty-web build failure)
