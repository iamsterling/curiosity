# Performance

Status: **Partially measured.** CPU encoding is benchmarked with recorded
environments. Nothing about GPU submission, browser frame time, or input latency
has been measured at all.

The rule this document exists to enforce: **do not invent a numeric budget you
have not measured, and do not optimise something you have not measured.** Where a
budget is not yet justified, this file specifies how it will be measured instead
of guessing a number.

## What has actually been measured

Source: the TypeGPU-era host comparison report was deleted with the TypeGPU
submission path; the measurements survive in ADR 0007's evidence table.

The TypeGPU-era host comparisons (current vs candidate vs retained host,
command-to-vertex encode, allocation discipline) were measured on the hosts
that the vector-path change retired; the numbers survive in
[ADR 0007](adrs/0007-typegpu-host.md)'s evidence table, and their fixtures
live on in `packages/scene-renderer/benchmarks/renderer-comparison-fixtures.ts`.
What is measured today is the Vello encode line:

### Vello encode and render cost (headless)

- vello_cpu prototype (the headless/export candidate, dev-only):
  **0.408 ms render median** on the 10k-rect fixture, ~0.77 ms/frame total
  encode + render, recorded as a distribution with the environment in
  `packages/scene-renderer/benchmarks/vello-cpu-prototype-report.md`
  (2026-08-07, Apple M5, release profile, `CRAFTY_BENCH_*` recorded).
- Vello wgpu line module-size deltas at each dependency step (encoder-only
  and renderer+present), with toolchain and pinned versions noted:
  `packages/scene-renderer/benchmarks/vello-wgpu-dependency-cost.md`.
  The shipped module is 1,637,283 raw / 484,923 gzip, CI-enforced as a
  regression tripwire, not a target.

### Protocol v2 changed-node batches

Against the real wasm-bindgen `RendererCore` (release build, median of 7),
recorded while the retained host was still live (ADR 0007, 2026-08-06):

| Path | Fixture | Median encode |
|---|---|---:|
| Full re-encode | 1,000 nodes | 0.936–1.102 ms |
| Changed-node batch | 1,000 nodes, 100 changed | 0.260–0.298 ms |

**3.35–3.70× faster**, meeting the ≥3× gate, which is still asserted as a
live test (`benchmarks/protocol-v2-batch.test.ts`: batch ≤ full, speedup ≥3×).
The merged batch output reproduces the full re-encode command list exactly.
The batch-vs-full decision now lives in the v2 encoder (a batch packet is
re-requested as a full packet); the merge contract itself is pinned in that
test.

### Determinism / parity

Encode-level parity, GPU-less: rect and path fixtures (representative,
translucent, 10k-rect, bezier/self-intersecting) encode through the compiled
wasm module to recorded stream fingerprints (FNV-1a over the binary streams —
platform-independent by construction), re-recorded with the environment noted
(`benchmarks/encode-parity.test.ts`, `benchmarks/parity-references.ts`,
2026-08-08). A fixture without a recorded reference fails the suite — it
cannot pass vacuously. Cross-run determinism is also asserted in the Rust
encoder's own tests. The old "two hosts encode identically" pixel-reference
comparison retired with the TypeGPU host; pixel identity on real hardware is
pending the browser spike (tasks 6.4/7.3).

### Overlay cost

Deterministic per-zoom draw counts, asserted in `src/grid-overlay.test.ts`
and tabulated in [`renderer.md`](renderer.md). Worst case (zoom 4) adds 4,086
vertices against the 10k fixture's 60,000 — about 7% — well under the
2,000-command budget cap.

## What has not been measured — and matters more

| Area | Status |
|---|---|
| Browser frame time | **Unknown.** No end-to-end frame measurement exists. |
| Input latency (pointer → pixel) | **Unknown.** The metric that actually determines whether the tool feels professional. |
| GPU submission cost | **Unknown.** All benchmarks stop at CPU encoding. |
| Device-loss recovery on hardware | **Unproven.** Policy is tested; real recovery is not. |
| React render cost per pointer-move | **Unknown**, and structurally significant — see [`react-boundary.md`](react-boundary.md). |
| Spatial index rebuild during drag | **Unknown.** Currently O(n) per document change. |
| Document validation per command | **Unknown.** Currently O(n) per command. |
| `structuredClone` per `beginTransaction` | **Unknown.** O(document) per gesture. |
| Scene projection per emit | **Unknown.** `editorDocumentToScene` + `applyStoryOverrides` per projection change, cached by revision. |
| Document load / save | **Unknown.** |
| Memory ceiling | **Unknown.** History is unbounded. |
| Turbopack + wasm module build | **Proven** by the full `bun run build`; the TypeGPU Turbopack question retired with the host. |

The pattern is clear: **the renderer's hot path is measured; the editor's is
not.** That is backwards relative to where the structural problems are.

## How to establish a budget

Do these in order. Skipping to step 4 is how fictional budgets get written down.

1. **Define the fixture.** A named, committed, deterministic document. Fixtures
   are code, not descriptions.
2. **Define the operation.** "Pan by 200px at zoom 1 on fixture X", not "panning
   feels slow".
3. **Record the environment.** Machine, OS, browser, GPU, build mode. The
   recorded reports do this with `CRAFTY_BENCH_*` variables
   (`benchmarks/vello-cpu-prototype-report.md` is the model) — follow that
   convention.
4. **Measure a distribution.** Median and p95 over ≥7 iterations. A single
   number is noise.
5. **Set the budget above the measured p95** with headroom, and write down *why*
   that headroom.
6. **Assert it in a test** so it becomes a regression gate, as the existing
   encoding budgets are.

A budget without a fixture, an environment and a distribution is decoration.

## Stress fixtures

**Exists:** `createTenThousandNodeDocument` (`editor/src/kernel/stress-fixtures.ts`)
— 10,000 sibling rectangles in a 100-wide grid under one page root. Plus a real
imported `.pen` document at `test-workspaces/pen/sample-card.pen`, used by
`benchmarks/pen-drag-regression.test.ts` to prove nested-child drag still emits
commands under a batch packet.

**Needed**, and each exercises a different failure mode:

| Fixture | Exercises |
|---|---|
| Deep hierarchy (1,000 nodes, depth 50) | recursive traversal, transform composition, stack depth |
| Wide flat page (50,000 nodes) | index build, encoding, culling |
| Many component instances (5,000 instances of 20 definitions) | resolution and instance expansion |
| Large text document (100 text nodes, 10k chars) | shaping and glyph cache |
| Clipping-heavy (200 nested clipping frames) | clip stack |
| Many images (500 distinct assets) | texture memory and atlas paging |
| Many state variants (50 components × 5 axes) | state-matrix resolution |
| Many pages (100 pages, 500 nodes each) | page switching, per-page camera/selection memory |
| Large design system (10 libraries, 1,000 shared components) | cross-file resolution |
| Pathological transforms (deep rotation/skew nesting) | numerical precision |

Fixtures should be generated by committed code, not stored as large JSON blobs,
so they stay diffable and parameterisable.

## Known structural costs

Documented so they are not rediscovered as mysteries. **None is a bug. Each is a
correctness-first choice with a known optimisation if measurement demands one.**

| Cost | Current behaviour | Optimisation if needed |
|---|---|---|
| Full document validation per command | O(nodes), `commands.ts:34` | incremental validation over the touched subtree |
| `structuredClone` on `beginTransaction` | O(document) per gesture | structural sharing, or command-log rollback |
| Scene projection per emit | O(nodes), cached by `documentRevision` | consume `EditorDocument` in the encoder; retire the projection |
| Spatial index rebuild | O(nodes) per document change | incremental update from the command's dirty set |
| `computeSceneDelta` diff | O(nodes) per render | propagate the kernel's dirty set instead of diffing output |
| JSON packet transport | serialize + parse per frame | binary packet or shared linear memory |
| React re-render per emit | whole `App` tree | rAF loop + sliced subscriptions |
| Unbounded history | grows monotonically | bounded stack with an explicit policy |
| No viewport culling | every visible node encoded | cull in the encoder using the viewport already in the packet |

## Priorities

Judged by expected impact per unit of risk, not by how interesting the work is:

1. **Get React out of the render path.** Every other frame-time measurement is
   contaminated until this is done.
2. **Measure input latency** on the 10k fixture with a recorded environment.
   This is the number that decides whether Crafty feels professional.
3. **Close the browser/GPU gate** — real submission, visual parity on hardware,
   device-loss recovery.
4. **Add viewport culling**, the cheapest large win for big documents.
5. Only then revisit transport, validation and index incrementality — with
   numbers.
