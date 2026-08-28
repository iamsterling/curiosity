# Tasks: Canvas Platform Foundation

Wave 1 tasks are implementation-ready; later tasks open only after their gates pass (measurement rule D11). Each task owns explicit files, ends at a measurable gate, and must leave `npm run build`, `typecheck`, `test`, `lint`, `format:check`, and Rust tests green.

## T001 - OpenSpec change record

- **Files:** `specs/009-canvas-platform-foundation/*`
- **Output:** spec, plan, research, contracts, data-model, and tasks cross-referencing the research reports and existing contracts
- **Verification:** artifacts exist and reference `docs/research/*.md` and existing renderer/editor contracts

## T002 - Browser integration bolt (W1)

- **Files:** `apps/crafty-web/src/App.tsx` (+ `apps/crafty-web/src/editor/` harness), `packages/editor-kernel/src/interaction.ts`, `packages/editor-kernel/src/kernel.ts`
- **Output:** kernel-backed document adapter and input router; pan/zoom/create/move/resize/undo/redo/delete/save/reload through commands; marquee + multi-selection overlay; browser pointer tests; accidental-rectangle regression fixed
- **Verification:** browser pointer tests green; no `setScene` outside the adapter; one committed gesture = one history entry

## T003 - Infinite canvas core (W2)

- **Files:** `packages/editor-kernel/src/coordinates.ts`, `packages/editor-kernel/src/document.ts` (v2 PageCanvas), `packages/editor-kernel/src/grid.ts` (new), `packages/scene-renderer/src/draw-protocol.ts`
- **Output:** unbounded page root semantics; unified zoom clamp + world pan limit; adaptive grid descriptor + `gridPlan()` LOD with hysteresis; rulers/guides/snap services; coordinate invariants + property tests
- **Verification:** test matrix #1, #6–#12 green; 10k fixture within budget

## T004 - Grid overlay layer (W2 browser bolt)

- **Files:** `packages/scene-renderer-wasm/src/webgpu-renderer.ts`, `typegpu-rectangle-host.ts`, host tests
- **Output:** grid/rulers/guides rendered as overlay packets — never authored geometry; pixel grid at high zoom; overlay cannot mutate authored packets
- **Verification:** overlay assertion tests; browser grid/guides integration test (#18); grid plan < 2 ms (#19)

## T005 - Retained host + protocol v2 (W3)

- **Files:** `packages/scene-renderer/src/draw-protocol.ts`, `packages/scene-renderer-wasm/src/lib.rs`, `packages/scene-renderer-wasm/src/webgpu-renderer.ts`, `packages/scene-renderer/src/wasm-bridge.ts`
- **Output:** protocol v2 (revision fields, changed-node batches, dirty region); Rust changed-node batch encode with full-rebuild fallback; capacity-cache + ordered batches wired into the real host; allocation counters; evidence exposes revision + cache stats
- **Verification:** parity tests green; zero unbounded allocations per frame (#15); batch parity ≥3× encode speed or documented no-go (#16)

## T006 - TypeGPU decision gate (W4)

- **Files:** `packages/scene-renderer-wasm/src/typegpu-rectangle-host.ts`, `packages/scene-renderer-wasm/benchmarks/*`, `docs/editor/adrs/0007-typegpu-host.md`
- **Output:** opacity/fill parity resolved; Turbopack build evidence; parity + budget benches with recorded environment; adoption ADR
- **Verification:** ADR conditions met or documented rejection; no dead host code ships

## T007 - Multi-page foundation (S1)

- **Files:** `packages/editor-kernel/src/document.ts`, `commands.ts`, `kernel.ts`, `packages/editor-kernel/src/migration.ts` (new), browser page tabs
- **Output:** page CRUD/reorder; `set-page-viewport` with rest-camera rule; per-page selection; undo entries with `pageId`; v1→v2 migration registry with per-step validation
- **Verification:** test matrix #2–#5 green; page switch < 250 ms (#20); browser page-tabs/restore test (#17)

## T008 - Copy/paste across pages (S5)

- **Files:** `packages/editor-kernel/src/clipboard.ts` (new), `commands.ts`, `kernel.ts`, browser Cmd/C/V wiring
- **Output:** `ClipboardContent` with mint-and-insert; override path remap; paste = 1 history entry; paste-at-cursor; paste preview
- **Verification:** test matrix #14 green; browser paste test (#28 from document-grid report) green

## T009 - Wave 1 integration verification

- **Files:** benchmark harness, quality-gates rows, docs
- **Output:** full wave-1 gates measured with `(fixture, hardware, browser, build)` recorded; risks and open questions updated in the research ledger; remaining work units re-baselined
- **Verification:** every quality-gates row for wave 1 has an executable check; full repository checks green
