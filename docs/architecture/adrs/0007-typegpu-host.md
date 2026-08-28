# ADR 0007: TypeGPU Host Adoption (Bounded Rectangle-Host Integration)

Status: Accepted — implemented (bounded); **the canvas role recorded here is
retired by [ADR 0010](0010-vello-wgpu-adoption.md)** — the TypeGPU host's
device ownership, compositing and retained submission are gone; the host keeps
overlay composition and frame encoding. This record stands as the decision as
it was made and measured on 2026-08-06.
Date: 2026-08-06
Implementation status: Browser/GPU submission and device-loss recovery remain unproven

## Context

W4 of `specs/009-canvas-platform-foundation/plan.md` is the TypeGPU decision gate: fix the candidate opacity/fill divergence (Rust owns alpha in `fill[3]`), verify the Turbopack build, run parity and budget benchmarks with a recorded environment, and record an adoption decision. Research (`docs/research/webgpu-typegpu.md` §7, §10) framed the as-committed candidate as a schema/typing spike whose value is the typed API surface, and set gate G6: `next build`/`next dev` on Turbopack must pass with the runtime-API path, with `'use gpu'` shader transforms only via a verified Babel route.

The candidate host (`typegpu-rectangle-host.ts`) and the production retained host (`webgpu-renderer.ts`, protocol v2 with `capacity-resource-cache.ts` + `ordered-submission-batches.ts`) diverged: the candidate used a bespoke single-buffer capacity loop, while production used per-material capacity-cached buffers plus ordered batches. Contract D5 forbids shipping dead code: either the candidate path compiles and tests, or it is removed with this ADR recording why.

## Options Considered

- **Reject TypeGPU entirely** and keep raw WebGPU only. Rejected: the typed vertex layout, slice writes, instance stepping, and instrumentation hooks are the research-identified path to the target host (§7 target row), the candidate already ships and passes, and the retained host already consumes its primitives.
- **Adopt TypeGPU including `'use gpu'` shader-function transforms** via `unplugin-typegpu`. Rejected: `unplugin-typegpu` lists supported bundlers as *esbuild, farm, rolldown, rollup, rspack, vite, webpack*, plus a *babel* plugin — Turbopack is not listed (docs.swmansion.com/TypeGPU/tooling/unplugin-typegpu, fetched 2026-08-06). Turbopack does not support webpack plugins, and the Babel route is unverified in this stack (webgpu-typegpu.md §5.6). The raw-WGSL path inside TypeGPU schemas/buffers has no such dependency.
- **Remove the single-buffer candidate host** and keep only the retained composition. Rejected: the candidate is the minimal gate artifact that isolates the TypeGPU runtime-API path (schema, layout, buffer write, submission) from composition machinery; removing it would reduce the gate to an untestable claim and leave the B1-style A/B benchmark without its baseline host.
- **Extend the candidate to full per-layer composition**. Rejected: ordered batches matter only when multiple submissions exist (overlay layers); the production composition's correctness and allocation behavior are already covered by `retained-host.test.ts`. Duplicating the composition into the candidate would create two hosts to keep in lockstep without a gate purpose.

## Decision

**Adopt a bounded TypeGPU rectangle-host integration.** The TypeGPU 0.11.9 runtime API (schemas, `tgpu.vertexLayout`, capacity buffers, `tgpu.initFromDevice`) is the host substrate; shaders remain raw WGSL strings; `'use gpu'`/unplugin transforms are not used.

Reconciliation (W4, task 1): `createTypeGpuRectangleHost` now composes `createCapacityResourceCache` with a single `"scene"` key instead of its bespoke capacity loop, giving the candidate and production identical capacity semantics (minimum 256 vertices, ×2 doubling, zero per-frame buffer allocations). Both paths share `encodeCommandsVertices`, `rectangleShader`, and `rectangleVertexLayout`, so candidate and retained encode outputs are identical by construction — asserted by test, not assumed. The single-buffer shape is the correct gate shape: the gate measures the TypeGPU runtime-API path in isolation, and batch planning is production-composition concern covered independently.

## Evidence

| Item | Result | Where |
| --- | --- | --- |
| Opacity/fill parity | `fill[3]` alpha contract; translucent fixture position/color delta 0, hash equal | `renderer-host-comparison.test.ts` |
| Current vs candidate parity | Representative pixel hash pinned `7ff6f3cc…`; delta 0 both axes | `renderer-host-comparison.test.ts` |
| Candidate vs retained parity | All 4 fixtures: identical vertices, delta 0, identical pixel hash | `renderer-host-comparison.test.ts` (new) |
| Budget, 10,000 rects (≤50 ms) | current 2.77 ms, candidate 0.67 ms, retained 3.55 ms mean | `renderer-host-comparison.bench.ts` |
| Budget, 1,000-node batch (≤16 ms) | current 0.29 ms, candidate 0.04 ms, retained 0.28 ms mean | `renderer-host-comparison.bench.ts` |
| Environment | Vitest 3.2.7 headless Node, macOS arm64, GPU not exercised, working tree, TypeGPU 0.11.9; `CRAFTY_BENCH_BROWSER/GPU/BUILD` recorded | the report file was deleted with the TypeGPU submission path (vector-path-rendering section 6); the numbers survive inline here, and the retired harness's fixtures live on in `benchmarks/renderer-comparison-fixtures.ts` |
| Protocol v2 batch parity (T005) | changed-node batch vs full re-encode: same pixel hash, 3.35–3.70× faster (latest run 3.18×), gate ≥3× met | `protocol-v2-batch.test.ts` |
| Allocations | Zero per-frame buffer allocations; ×2 growth 256 → 1024 → 4096 vertices; 1 buffer on repeated renders | `typegpu-rectangle-host.test.ts`, `retained-host.test.ts` |
| Turbopack build | Full `npm run build` passes (27/27 tasks); `▲ Next.js 16.3.0 (Turbopack)` compiled with the TypeGPU host wired in; raw-WGSL path only | build output, 2026-08-06 |
| No dead code (D5) | Candidate host compiles, typechecks, and is unit-tested; its primitives are consumed by the production host | `typegpu-rectangle-host.test.ts` |

## Consequences

The retained production composition is unchanged in behavior (protocol v2, capacity cache, ordered batches) and keeps the TypeGPU primitives as its substrate, which buys typed layouts, slice writes, and instance stepping for the gated optimizations (B4 instancing, B6 render bundles). The 32-byte vertex stride (+33% vs 24-byte legacy) is accepted per research risk R3; candidate encode is 4.1× faster than the legacy host at 10k rects, and a packed layout or instancing is the future mitigation. Shader-function migration stays off the build path until the Babel route is verified.

## Risks and Validation

Residual gaps, none blocking adoption: browser/GPU rendering parity is unverified (CPU-only harness; B0 blending fixture pending a browser bench harness); device-loss recovery has no integration test (B8); batch parity numbers above are T005 CPU-side evidence, not a browser batch test; `'use gpu'` adoption is gated on a verified Turbopack-compatible route (webgpu-typegpu.md gate G6/G7). Production budget claims remain CPU-side until G2 baselines exist on ≥2 device classes. Validation is the W4 gate: parity, budgets, Turbopack build, and `npm run build`/`typecheck`/`test`/`lint`/`format:check` all green with the host wired in.
