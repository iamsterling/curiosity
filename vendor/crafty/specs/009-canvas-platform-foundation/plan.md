# Implementation Plan: Canvas Platform Foundation

## Strategy

Follow Architecture A (walking skeleton) toward B (pragmatic production path) from `docs/research/architecture-alternatives-and-plan.md`, and the S1–S2 vertical slices from `docs/research/document-grid-pages.md`. Kernel-first: implement pure logic with tests, then bolt the browser surface. Ratify the explicit decisions D1–D12 into code and tests — never guess them (architecture report §12).

The first wave is W1 → W2 → W3 → W4 (dependencies left to right). W5–W9 (workers, persistence v2, observability, adapter retirement, envelope work) are gated behind measured thresholds (D11) and opened only after the first wave gates pass.

## Architecture

- `packages/editor-kernel`: owns the document (schema v2), commands, transactions, history, interaction state machine, coordinates, resolution (identity for now), and revision stream. No React, no GPU.
- `apps/crafty-web`: owns canvas lifecycle, capability messaging, and renderer projection; `App.tsx` shrinks to subscriptions + command dispatch. It never owns document or GPU resource graphs.
- `packages/scene-renderer`: owns the stable renderer contract, protocol versions, diagnostics, and host selection.
- `packages/scene-renderer-wasm`: owns WASM initialization and deterministic `RenderFrame` production (Rust), the retained TypeGPU/current host, and the grid overlay layer.
- Rust/WASM: deterministic scene traversal, transform resolution, ordering, packet encoding; gains changed-node batch encoding (protocol v2).

## Work Units

### W1 — Browser integration bolt (A)
- Replace `App.tsx` `scene`/`drag` state ownership with kernel-backed document adapter + kernel input router; pan/zoom/create/move/resize/undo/redo/delete/save/reload through commands; marquee + multi-selection overlay; browser interaction tests.
- Owned files: `apps/crafty-web/src/App.tsx` (+ new `apps/crafty-web/src/editor/` harness), `packages/editor-kernel/src/interaction.ts` (marquee effects), `packages/editor-kernel/src/kernel.ts` (revision stream, `getProjection`).
- Gate: browser pointer tests green; accidental-rectangle regression test green; no `setScene` outside the adapter.

### W2 — Infinite canvas core + adaptive grid (A→B)
- Unbounded page-root semantics, unified zoom clamp, world pan limit, page content bounds, grid overlay packet (dot/line, major/minor, LOD + hysteresis), rulers/guides/snap services (kernel), grid overlay layer in the host.
- Owned files: `packages/editor-kernel/src/coordinates.ts`, `packages/editor-kernel/src/document.ts` (v2 PageCanvas), `packages/editor-kernel/src/grid.ts` (new), `packages/scene-renderer/src/draw-protocol.ts` (overlay packet), `packages/scene-renderer-wasm/src/webgpu-renderer.ts`/`typegpu-rectangle-host.ts` (grid layer).
- Gate: coordinate invariants + round-trip tests; grid overlay assertion tests (LOD density, hysteresis, snap decoupling); 10k fixture within budget.

### W3 — Retained host + protocol v2 (A)
- Per-material capacity-cached vertex buffers, ordered submission batches, packet revision tracking, changed-node batch encode in Rust, full-rebuild fallback; evidence exposes revision + cache stats.
- Owned files: `packages/scene-renderer/src/draw-protocol.ts`, `packages/scene-renderer-wasm/src/lib.rs`, `packages/scene-renderer-wasm/src/webgpu-renderer.ts` (wire `capacity-resource-cache.ts` + `ordered-submission-batches.ts` into the real path), `packages/scene-renderer/src/wasm-bridge.ts`.
- Gate: parity tests green for current vs retained host; zero unbounded allocations per frame (allocation counter test); batch parity (same pixel hash, ≥3× encode speed) or documented no-go.

### W4 — TypeGPU decision gate (A/B branch)
- Fix candidate opacity/fill divergence (alpha contract: Rust owns alpha in `fill[3]`), verify Turbopack build, run parity + budget benches with recorded environment, write adoption ADR `docs/editor/adrs/0007-typegpu-host.md`.
- Owned files: `packages/scene-renderer-wasm/src/typegpu-rectangle-host.ts`, `packages/scene-renderer-wasm/benchmarks/*`, `docs/editor/adrs/0007-typegpu-host.md`.
- Gate: ADR-E5 conditions met or documented rejection; no dead host code ships (either path compiles and tests).

### Later (gated, not in this wave)
W5 worker resolution pipeline, W6 crash-safe persistence + document-v1 API, W7 observability + quality-gates integration, W8 adapter retirement, W9+ envelope work (binary protocol, text, components, wgpu peer). Each opens only after the preceding gate proves the bottleneck (D11). Document-grid slices S3–S8 (handles/rotate/marquee completion, frames/multi-select, copy/paste, constraints/auto-layout, components/variants/tokens, history marks + persistence v2) schedule on the same contracts.

## Verification

- Kernel unit + property tests (test matrix #1–#14): coordinates, pages, grid, snap, guides, gestures, paste.
- Host tests (#15–#16): retained allocation counters, protocol v2 batch parity.
- Browser integration tests (#17–#18): page tabs/restore, grid/guides.
- Perf fixtures (#19–#20): grid plan < 2 ms, page switch < 250 ms.
- Full repository checks: `npm run build`, `typecheck`, `test`, `lint`, `format:check`, Rust tests.
