# WebGPU / TypeGPU Renderer Research

Status: research only — no production source, package manifest, or docs outside this worktree were modified; nothing committed or pushed. All evidence below is from the current working tree (commit `d98c982`) and primary external sources, with retrieval dates.

Date: 2026-08-06
Reviewer notes: proven facts are cited to primary sources; analysis-level claims are explicitly marked `HYPOTHESIS` and are benchmark candidates, not decisions.

---

## 1. Executive Summary

Crafty's renderer is a coarse-grained WASM→JSON→WebGPU pipeline (`packages/scene-renderer-wasm/`). Two hosts exist side by side: the **current host** (`webgpu-renderer.ts`, retained growth-doubling `GPUBuffer` + `writeBuffer` + full clear each frame) and a **TypeGPU candidate** (`typegpu-rectangle-host.ts`, new buffer every frame via `root.createBuffer`, full clear each frame). Both re-encode every rectangle on the CPU every frame and neither configures GPU blending.

Key findings:

1. **TypeGPU 0.11.9 (published 2026-06-25) fully supports the resource-management path Crafty already uses** — schemas, `tgpu.initFromDevice`, vertex layouts, retained buffers with slice writes (`.write(..., {startOffset})`), `patch`, indirect draws, and even `GPURenderBundleEncoder` interop (`.with(encoder)`). The `'use gpu'` TypeScript-shader path requires `unplugin-typegpu`, which lists esbuild/farm/rolldown/rollup/rspack/vite/webpack + babel — **not Turbopack**. Crafty's current candidate uses zero `'use gpu'` code, so it is Turbopack-safe as written; the build-plugin question only becomes live if `'use gpu'` shaders are adopted.
2. **Next.js 16 (Crafty pins 16.3.0) makes Turbopack the default bundler**; Turbopack does not support webpack plugins (unplugin-family tools are not webpack loaders). Next 16 does auto-run Babel for app files when a Babel config is present, and `unplugin-typegpu` ships a maintained Babel plugin — a constrained `'use gpu'` path exists under Turbopack, but it must be verified empirically.
3. **The TypeGPU candidate's per-frame `destroy()` + `createBuffer()` is the single largest architectural regression vs. the current host.** `root.createBuffer` with initial data is mapped-at-creation (the user agent zeroes the buffer before mapping — a documented cost) and allocates a new GPU resource every frame. The repo already contains the right tool (`capacity-resource-cache.ts`) but nothing wires it into either host.
4. **Neither host enables blending.** WebGPU's default is blend disabled (replace). The benchmark test suite documents a "known double-opacity visual mismatch" between the hosts, but with no blend state both hosts composite translucent shapes incorrectly over each other. This is a correctness gate that must be fixed before parity claims.
5. **The TypeGPU schema as written costs 33% more memory per vertex than the current host** (32 B vs 24 B/vertex; `d.struct` 16-byte alignment pads `vec2f+vec4f` to 32 B, while the current host interleaves 6 floats = 24 B). Proven by the existing parity test (`candidateByteLength: 2304` vs `currentByteLength: 1728` for 72 vertices). Reordering/`unorm8x4` packing or instancing recovers this.
6. **The existing benchmarks only measure CPU encode functions** — no GPU-side harness exists. Reproducible GPU benchmarks (upload, draw, present latency, allocations) are the missing foundation; a proposed matrix is in §8.
7. **Device-loss handling is detect-only today.** The current host flags `device.lost` and returns a diagnostic; the failure policy requires full device/root/resource rebuild and retained-packet replay. TypeGPU has no device-loss API (`root.destroy()` is a no-op for `initFromDevice` roots), so recovery is a WebGPU-level concern — well-documented patterns exist (toji.dev, Figma).
8. **Figma's migration report (2025-09-18) is the closest production analog**: C++→WASM renderer, explicit draw args, batched uniform uploads into one buffer with per-draw offsets, bind-group caching, async-only readback forcing non-load-blocking compatibility tests, device blocklisting, and dynamic backend fallback. Crafty's proof does a **load-blocking readback at init** (`index.ts:45`) — exactly the pattern Figma abandoned as "hundreds of milliseconds" of load cost.

Recommended next step: fix blend/opacity correctness in whichever host wins the next spike, retain a capacity-grown TypeGPU buffer, extend the bench harness into the browser (GPU timeline), then re-run the budget fixtures (50 ms / 10k rects input-to-preview, 16 ms / 1k changed-batch sync). Stop/go gates in §10.

---

## 2. Scope and Method

- Inspected working tree (evidence cited as `path:line`): `packages/scene-renderer-wasm/src/{index.ts,webgpu-renderer.ts,typegpu-rectangle-host.ts,capacity-resource-cache.ts,ordered-submission-batches.ts}`, `benchmarks/{renderer-host-comparison.bench.ts,renderer-host-comparison.ts,renderer-comparison-fixtures.ts,renderer-host-comparison.test.ts}`, `packages/scene-renderer/src/draw-protocol.ts`, `docs/editor/{wasm-boundary.md,renderer-contract.md,renderer-failure-policy.md,target-architecture.md,current-state-audit.md,research-ledger.md,implementation-roadmap.md}`, `apps/crafty-web/src/App.tsx`, root and package manifests.
- Primary external sources fetched on 2026-08-06 (URLs in §11): TypeGPU official docs (docs.swmansion.com), npm registry metadata, Next.js 16.3.0 docs, WebGPU spec (Editor's Draft, 2026-08-05), toji.dev WebGPU best practices, Figma engineering blog, MDN OffscreenCanvas.
- No `.pen` design files, no implementation changes. Benchmarks below are proposals, not executed results.

---

## 3. Current Working-Tree Evidence

### 3.1 Architecture (as-built)

```
React (App.tsx) ──> loadWasmWebGpuRuntime (index.ts) ──> createSceneRenderer
        │                  │  init WASM, requestAdapter/Device, configure context,
        │                  │  load-blocking readback proof (index.ts:15-31,45)
        └─ render(activeScene, frameId, viewport, selection, draftBounds)
              │
              └─ WASM RendererCore: set_scene → set_selection → core.render() → JSON RenderFrame
                    │  (JSON.parse at webgpu-renderer.ts:113)
                    └─ TS encode (per-rect 6 vertices) → GPUBuffer upload → one pass → submit
```

Boundary contract (`docs/editor/wasm-boundary.md`): coarse-grained; TS owns the WebGPU device and resource lifetimes; JSON is explicitly "a proof transport. A binary packet is a measured optimization, not a prerequisite." Renderer contract budgets (`docs/editor/renderer-contract.md`): ≤50 ms input-to-preview @ 10,000 rectangles; ≤16 ms packet sync @ 1,000-node changed batch; ≤250 ms page switch; no unbounded allocation per frame.

### 3.2 Current host — `webgpu-renderer.ts`

| Aspect | Evidence | Notes |
|---|---|---|
| Vertex layout | `arrayStride: 24`, `float32x2` + `float32x4` (lines 93) | 24 B/vertex; 144 B/rect |
| Encode | `DrawEncoder.encodeRect` pushes 36 numbers/rect into a JS `number[]` (lines 38-45) | GC churn; `new Float32Array(vertices)` copy (line 49) |
| Buffer | Retained; doubles on growth `2 ** ceil(log2(bytes))`, min 256 B; `destroy()` + recreate on growth (lines 50-54) | Good pattern; re-upload is full-buffer every frame (line 55) |
| Upload | `device.queue.writeBuffer(buffer, 0, data)` (line 55) | Recommended default path (see §5.2) |
| Pipeline | One `layout: "auto"` pipeline created once (lines 91-96) | Cached; no bind groups needed (vertex-only) |
| Pass | One encoder; `loadOp: "clear"` every frame (line 57) | Full-screen clear + full redraw per frame |
| Opacity | **Ignored** — `encodeRect` pushes `...fill` only (line 44) | Translucent fixture alpha stays 0.5 |
| Blend | Not configured anywhere | Default = disabled (replace), §5.1 |
| Device loss | `device.lost.then(...)` sets a flag; `render()` returns `WEBGPU_DEVICE_LOST` diagnostic (lines 86-89, 110) | Detect-only; no recovery |

### 3.3 TypeGPU candidate — `typegpu-rectangle-host.ts`

| Aspect | Evidence | Notes |
|---|---|---|
| Root | `tgpu.initFromDevice({ device })` (line 89) | TypeGPU-documented way to wrap an existing device |
| Pipeline | Raw `device.createRenderPipeline` with `tgpu.vertexLayout` (lines 90-100) | Uses TypeGPU only for schema/layout; not the `pipeline.with(...).draw` API |
| Schema | `d.struct({ position: d.vec2f, color: d.vec4f })` (lines 4-7) | 32 B/vertex due to vec4f alignment; 192 B/rect (33% more than current host) |
| Buffer | **`buffer?.destroy()` then `root.createBuffer(schemaForCount(n), vertices)` every frame** (lines 110-111) | New GPU allocation + mapped-at-creation write + zero-init per frame |
| Encode | `encodeRectangleVertices` builds `RectangleVertexInput[]` JS array (lines 48-72) | Same CPU-transform cost as current host; also builds per-vertex `[x,y]`/`[r,g,b,a]` tuples |
| Opacity | Multiplied into alpha: `command.fill[3] * command.opacity` (line 64) | The documented 0.25 vs 0.5 mismatch in the parity test |
| Pass | `loadOp: "clear"` every frame (lines 113-119) | Same as current host |
| Dispose | `root.destroy()` (line 132) | TypeGPU: `root.destroy()` "does nothing" for `initFromDevice` roots (docs); its own buffer destroy is the real cleanup |

### 3.4 Unwired infrastructure

- `capacity-resource-cache.ts` — generic capacity cache (min capacity, growth factor, destroy-on-replace). Used only by its own test.
- `ordered-submission-batches.ts` — batches items by `(resourceKey, layer)` with running vertex offsets. Used only by its own test.
- Both are precisely the primitives the renderer-contract's "retained and incremental behavior" and the failure policy's resource ownership need; neither host consumes them yet.

### 3.5 Benchmarks (existing)

- `renderer-host-comparison.bench.ts`: CPU-only `bench()` over `encodeCurrentHostVertices` vs `encodeRectangleVertices` on two fixtures (10,000 rects / 1,000-node changed batch); environment captured via `CRAFTY_BENCH_BROWSER/OS/GPU/BUILD` env vars; budgets `{ tenThousandRectangles: 50, thousandNodeChangedBatch: 16 }` ms.
- `renderer-host-comparison.test.ts`: deterministic pixel parity via software raster hash (128×128), byte-length assertions, and the documented translucent mismatch (`maximumColorDelta: 0.25`).
- No benchmark exercises the GPU timeline (`queue.submit` → `onSubmittedWorkDone`), uploads, buffer allocation counts, or present latency. There is no browser-automation harness for renderer benches.

---

## 4. Proven Facts — TypeGPU 0.11.9

Version/date facts (npm registry, fetched 2026-08-06):
- `typegpu@0.11.9` is `latest`; published **2026-06-25T16:53:32Z**. `0.11.0` published 2026-04-14 (matches the official 0.11 release post, dated Apr 14, 2026). `unplugin-typegpu@0.11.6` published 2026-06-25.
- The local agent skill (`/Users/sterling/.agents/skills/typegpu`, mirrored at `.claude/skills/typegpu`) targets 0.11.2 and predates 0.11.9 — its API claims were verified against the live 0.11.x docs below, not treated as authoritative.

Facts from official docs (docs.swmansion.com/TypeGPU, fetched 2026-08-06):

1. **Roots**: `tgpu.init()` requests a device; `tgpu.initFromDevice({ device })` wraps an existing `GPUDevice` (`apis/roots/`). `root.configureContext({ canvas, alphaMode })` accepts `HTMLCanvasElement | OffscreenCanvas` and defaults format to `navigator.gpu.getPreferredCanvasFormat()`; it throws if no context could be obtained. `root.destroy()` calls `device.destroy()`; **if the root was created via `initFromDevice()`, this method does nothing**.
2. **Buffers** (`apis/buffers/`): `root.createBuffer(schema, initial)` supports initial values and initializer callbacks run while the buffer is still **mapped at creation**. Buffers get `COPY_SRC|COPY_DST` automatically; `.$usage('vertex'|'index'|'uniform'|'storage'|'indirect')` and `.$addFlags(...)` add more. Writes: `.write(data, { startOffset })` supports **slice updates** (offsets computed with `d.memoryLayoutOf`); `.patch(...)` for partial struct/array updates (replaced `writePartial` in 0.11); `common.writeSoA` for struct-of-arrays. **TypedArray/ArrayBuffer writes are copied verbatim and must include WGSL padding**; the 0.11 release post ranks write forms "Each one is more efficient than the previous" in the order instance → tuples → typed arrays. Existing-GPUBuffer wrapping (`createBuffer(schema, gpuBuffer)`) keeps external lifecycle.
3. **Vertex layouts / pipelines** (`apis/pipelines/`): `tgpu.vertexLayout(arrayOfSchema, stepMode?)` supports `"vertex" | "instance"` step modes (instance stepping available). `root.createRenderPipeline({ vertex, fragment, attribs, targets, primitive, depthStencil, multisample })` — targets can carry blend state (`GPUBlendState` per target). Pipelines expose `.with(bindGroup)`, `.withColorAttachment({view})`, `.withIndexBuffer(buffer)`, `.with(vertexLayout, buffer)`, then `.draw(count, instances?)` / `.drawIndexed(...)` / `drawIndirect` / `drawIndexedIndirect`; indirect buffers need `.$usage('indirect')` with documented layouts (4×u32 for draw, 5 fields for drawIndexed). Underlying WebGPU pipeline objects are **created lazily**, just before first execution (or via `root.unwrap`).
4. **Render bundles**: TypeGPU pipelines accept a raw `GPURenderBundleEncoder` via `.with(encoder)` and record `.draw/.drawIndexed/.draw*Indirect` into it; the caller finishes the bundle and executes it through a pass (`apis/pipelines/` → "WebGPU encoder interoperability").
5. **Custom encoders / interop** (`apis/pipelines/` + skill `references/advanced.md`): `.with(encoder)` / `.with(pass)` on a live `GPUCommandEncoder`/`GPURenderPassEncoder` lets TypeGPU calls interleave with raw WebGPU commands in one command buffer. `root.unwrap(resource)` returns raw handles; `root.device` exposes the device.
6. **Instrumentation**: pipelines expose `withTimestampWrites` / `withPerformanceCallback` (`apis/pipelines/` → "Timing performance"; `advanced/timestamp-queries/`); `timestamp-query` is an optional feature gated via `tgpu.init({ device: { requiredFeatures/optionalFeatures } })` with `root.enabledFeatures` runtime checks (`advanced/enabling-features/`).
7. **Textures/samplers**: stabilized in 0.11 — `root.createTexture(...)` / `root.createSampler(...)` without the `~unstable` prefix (0.11 release post).
8. **Bind groups**: `tgpu.bindGroupLayout({...})` + `root.createBindGroup(layout, {...})`; fixed resources (`createUniform/createMutable/createReadonly`) skip manual bind groups. (Official skill also warns: `createBindGroup` and `texture.createView` allocate fresh GPU objects per call — cache them.)
9. **Build plugin** (`tooling/unplugin-typegpu/`): transforms `'use gpu'` TS to WGSL ahead of time (tinyest AST), auto-names resources. **Supported bundlers: esbuild, farm, rolldown, rollup, rspack, vite, webpack, plus a babel plugin.** The Vite/Rollup and Babel plugins are the actively maintained ones; others "may be limited" in stability. Turbopack is not listed.
10. **0.11 migration** (`migrations/0-11/` + release post): `writePartial` deprecated → `.patch`; textures/samplers stabilized; efficient write overloads; `std.range`/`tgpu.unroll`; boolean short-circuiting; `tgpu.const` accepts dynamic schemas; eslint-plugin-typegpu added; unplugin rewritten (esbuild support added).

---

## 5. Proven Facts — WebGPU Platform

Sources: WebGPU spec Editor's Draft dated 2026-08-05 (gpuweb.github.io/gpuweb/), toji.dev best-practices pages (buffer-uploads updated 2023-02-03, render-bundles 2024-01-22, device-loss 2024-10-23), Figma blog (2025-09-18), MDN OffscreenCanvas (doc last modified 2024-10-26), Next.js docs (v16.3.0, last updated 2026-08-03).

### 5.1 Spec-level facts (verified against spec text)

- **Blend default**: `GPUColorTargetState.blend` — "If left undefined, disables blending for this color target." → default is replace (spec §10.3.5 Color Target State). Crafty's hosts ship no blend state, so all draws are replace.
- **Default limits** (spec §3.6.2.1 `GPUSupportedLimits`): `maxBufferSize` = 268,435,456 B (256 MiB); `maxStorageBufferBindingSize` = 134,217,728 B (128 MiB); `maxVertexBufferArrayStride` = 2048 B; `maxVertexBuffers` = 8; `maxVertexAttributes` = 16; `maxInterStageShaderVariables` = 16 (core) / 15 (compatibility).
- **`GPUQueue.writeBuffer(buffer, bufferOffset, data, dataOffset?, size?)`** writes into a `GPUBuffer` on the queue timeline; the buffer needs `COPY_DST`.
- **Render bundles**: "To reuse rendering commands across multiple submissions, use `GPURenderBundle`." Command buffers can only be submitted once; bundles are pre-encoded render-pass content that skip per-execution validation/encoding (toji render-bundles explains the wire path: JS → C++ → GPU process → validation → native API; bundles skip most of that at execution time). Bundle restrictions: cannot set viewport/scissor, blend constant, stencil reference, or run occlusion queries or nested bundles (toji). Pipeline/bind group/vertex state is reset before and after each bundle — each bundle must fully specify its state.
- **Device loss**: `device.lost` is a promise resolving to `GPUDeviceLostInfo { reason, message }`; `reason` is only ever `'destroyed'` or `'unknown'`; **message is implementation-defined and "should never be parsed by applications"**. All objects created from the lost device become unusable. Adapters are consumed by `requestDevice()` and may expire — get a fresh adapter before each device request. `requestDevice()` always resolves to a GPUDevice (possibly one whose `lost` promise is already resolved).
- **Worker exposure**: WebGPU interfaces are `[Exposed = (Window, Worker)]` (e.g., `GPUCommandBuffer` in spec §12.1); canvas contexts are available in workers via OffscreenCanvas (MDN: "available in Web Workers", `transferControlToOffscreen()`, `requestAnimationFrame` in workers, `transferToImageBitmap()` + `bitmaprenderer` for display; Baseline widely available since March 2023).

### 5.2 Buffer upload guidance (toji, buffer-uploads)

- **"When in doubt, `writeBuffer()`!"** — safe default, lets the UA pick the optimal path; some architectures make it the most efficient path; **preferred for WASM apps** (avoids an extra copy out of the WASM heap); no buffer-size constraint beyond `COPY_DST`; "there's not any explicit downsides to using this path".
- `mappedAtCreation` for buffers written once: no usage flags needed, avoids a CPU copy if you generate into the mapped range, **but the UA must zero the buffer before mapping** (per-frame creation therefore pays zeroing + allocation every frame).
- Staging-buffer ring (2-3 rotating `MAP_WRITE|COPY_SRC` buffers re-mapped after copy) for frequently written data where you want explicit control: higher complexity, higher memory, avoids waiting on maps.
- GPU-side generation (compute) is the ultimate path when data is algorithmic.

### 5.3 Render bundles guidance (toji, render-bundles)

- Only help when **CPU-bound** (reducing command submission overhead); no GPU benefit. Effective only if **executed more than once**; "if you are rebuilding your render bundles on a per-frame basis to accommodate new or updated draw calls then you may be better off simply doing the draws directly."
- Bundles + dynamic content: resources are re-bound (not snapshotted) at execution — buffer contents (view matrices, vertex data) can change between executions without re-encoding; indirect draws keep draw counts dynamic. Mixing static bundles with dynamic direct draws is encouraged.

### 5.4 Device-loss guidance (toji, device-loss)

- Recovery: request a **new adapter**, then a new device, re-configure the canvas, and rebuild all device-owned resources. Prefer "restart just the GPU content" and restore app state that lives only on the GPU from JS-side retained state.
- Chrome specifics: `about:gpucrash` kills the GPU process (good test); crash limits — 1 crash: new adapter OK; 2 crashes within 2 min: page can't get a new adapter (resets on refresh); 3 within 2 min: all pages blocked; platform crash frequency (~3-6 within 5 min): GPU process stops restarting → browser restart only. `device.destroy()` simulates loss for testing (slightly different semantics: unmaps mapped buffers; doesn't block new devices). Flags to disable limits for testing: `--disable-domain-blocking-for-3d-apis --disable-gpu-process-crash-limit`.
- If `requestAdapter()` returns null after a loss, recommend a browser/device restart; but a null adapter at startup just means no WebGPU support.

### 5.5 Figma's migration (figma.com/blog/figma-rendering-powered-by-webgpu/, 2025-09-18, Alex Ringlein / Luke Anderson)

- Renderer is C++ compiled to WASM (Emscripten) for the browser and native for servers; WebGPU via Emscripten bindings (deprecated, moving to Dawn's `emdawnwebgpu`).
- Made draw-call state explicit (all inputs as arguments), which fixed bugs and prepared the WebGPU path.
- **Batched uniform uploads**: instead of per-uniform upload, they encode many draws with uniform structs, then on `submit()` upload all uniform data to one buffer and draw with offsets into it — a direct model for Crafty's `ordered-submission-batches.ts` + per-frame uniform/vertex buffer.
- Optimizations after regression analysis: "caching and reusing `bindGroups` as much as possible, and finding ways to better batch draw calls into `renderPasses`."
- **Async-only readback** made load-blocking GPU compatibility tests unviable ("could increase load times by hundreds of milliseconds") → non-load-blocking compat tests post-session, device blocklisting by measured fallback rate, and a **dynamic WebGPU→WebGL fallback mid-session**.
- Future plans: compute-shader blur, MSAA, and **RenderBundles to reduce CPU overhead of submission**.

### 5.6 Next.js 16.3.0 / Turbopack facts (nextjs.org/docs/app/api-reference/turbopack)

- **Turbopack is the default bundler in Next.js 16** (v16.0.0 change note: "Turbopack becomes the default bundler for Next.js"); opt out with `--webpack`.
- "Turbopack does not support webpack plugins... We do support webpack loaders" (`turbopack.rules`). unplugin-typegpu is an unplugin (esbuild-family transform), not a webpack loader — it cannot be used under Turbopack directly.
- "Starting in Next.js 16, Turbopack uses Babel automatically if it detects a configuration file" — with `turbopackUseBuiltinBabel` (default true) and node_modules excluded unless a loader is configured. The Babel path of `unplugin-typegpu/babel` is therefore the only documented `'use gpu'` route under Turbopack, and it is unverified in this stack.

---

## 6. Analysis per Optimization Topic

Each item: current Crafty state → alternative → verdict. `PROVEN` = supported by the sources above or the working tree; `HYPOTHESIS` = needs the benchmarks in §8.

### 6.1 Retained display lists & changed-node batches
- Current: both hosts re-encode the full frame every render; the protocol is full-command JSON (`draw-protocol.ts:18-24`). The contract (`renderer-contract.md`) mandates retained pipelines/buffers/textures by stable cache keys and changed-node batches as protocol v2.
- Alternative: retain geometry per node id in a capacity buffer; on a changed batch, write only changed slices (`buffer.write(data, {startOffset})` — PROVEN TypeGPU API; `d.memoryLayoutOf` gives offsets).
- Verdict: PROVEN feasibility; HYPOTHESIS benefit magnitude. The 1,000-node changed batch (10% of 10k) is exactly the case where partial writes should beat full re-upload; benchmark in §8.3. The existing `ordered-submission-batches.ts` + `capacity-resource-cache.ts` are the building blocks. `current-state-audit.md` already lists "Full JSON sync per frame → retained scene plus change batches" as a risk with this mitigation.

### 6.2 Dirty regions
- Current: full `loadOp: "clear"` + redraw of every rectangle every frame (both hosts).
- Alternative: `loadOp: "load"` + `pass.setScissorRect` to limit fragment work to the dirty rect (PROVEN WebGPU API; not in TypeGPU docs but reachable via `.with(pass)` interop or raw pass).
- Verdict: HYPOTHESIS. Under pan/zoom the whole viewport is dirty every frame (camera transform in every vertex), so dirty-rect only helps static-camera local edits (move/resize one node, hover overlays). Present cost is full-surface regardless (canvas presentation), so the win is vertex + fragment load only. Measure in §8.5 before building any region logic. Tiling (region texture cache) is a much larger design with no WebGPU-native support — defer until a benchmark shows clear-and-redraw failing (no evidence today for ≤10k rects).

### 6.3 Persistent / capacity buffers
- Current host: retained growth-doubling buffer, `writeBuffer` full upload (PROVEN sound pattern per §5.2).
- TypeGPU candidate: `destroy()` + `createBuffer` every frame (PROVEN bad: allocation + zero-init + mapped write per frame, §5.2; and TypeGPU has no buffer-resize API in 0.11.9 docs — growth is destroy/recreate).
- Verdict: PROVEN. The candidate must be migrated to a capacity-grown retained buffer using the existing `capacity-resource-cache.ts` (growth policy already implemented and unit-tested). No new primitives needed.

### 6.4 Bind-group and pipeline caches
- Current: one pipeline cached; no bind groups (vertex-only path). PROVEN fine for the rectangle-only protocol.
- Alternative: when uniforms/instancing arrive, cache `root.createBindGroup(...)` results by (layout, buffer) key — PROVEN needed (docs: bind groups allocate fresh GPU objects per call; Figma: "caching and reusing bindGroups as much as possible").
- Verdict: PROVEN that caching is required; not yet exercised. Add a bind-group cache alongside instancing (§6.6). TypeGPU pipelines are lazy-created (PROVEN) — the first frame of any new pipeline pays compile cost; with one pipeline this is a one-time cost.

### 6.5 Vertex format / memory layout
- Current host: 24 B/vertex interleaved float32x2 + float32x4.
- TypeGPU candidate schema: 32 B/vertex (vec4f 16-byte alignment pads the struct). PROVEN via the parity test's byte-length assertions (72 verts → 2304 B vs 1728 B, +33%).
- Alternatives (PROVEN mechanisms, HYPOTHESIS outcome): reorder/pack the struct; use `unorm8x4` color (WGSL pack/unpack helpers documented in skill `advanced.md`); or move to instancing (next item), which changes the layout entirely.
- Verdict: fix in the next spike; the 10k fixture at 24 B/vertex ≈ 1.73 MB vs 2.30 MB — comfortably inside the 256 MiB `maxBufferSize`, so this is about upload bandwidth and cache, not capacity (HYPOTHESIS: measurable but minor).

### 6.6 Instancing / indirect draws
- Current: 6 duplicated vertices per rect; CPU transforms every vertex into clip space; one `draw()`.
- Alternative (PROVEN API support): `tgpu.vertexLayout(schema, "instance")` + `d.builtin.instanceIndex` (listed in skill docs and 0.11 docs) with per-instance attributes (bounds + transform + color ≈ 48-64 B), vertex shader expands the quad; one `draw(count, instances)`. Indirect (`$usage('indirect')`, `drawIndirect`) only pays off when draw counts are GPU-computed (culling/particles — toji) — not applicable to Crafty's CPU-driven scene yet.
- Verdict: HYPOTHESIS magnitude, PROVEN feasibility. Expected wins: ~2.5-4× less vertex memory, less CPU transform work, same draw count. This is the pattern 2D engines (incl. Figma-style renderers) converge on; benchmark §8.4. Indirect: defer (no GPU-side count computation in the current protocol).

### 6.7 Texture atlases
- Current: no textures in the draw protocol (`DrawGeometry = "rect"` only).
- Alternative: atlas images/glyphs/gradients once geometry extends; TypeGPU 0.11 stabilized `createTexture`/`createSampler` (PROVEN) and docs cover samplers/views.
- Verdict: not actionable today; record as the future path for the renderer-contract extension points (text runs, images, gradients). Do not build an atlas layer before the first textured geometry exists.

### 6.8 Render bundles
- Current: one pass, one pipeline, one draw per frame — nothing to bundle.
- Alternative (PROVEN support): record into `GPURenderBundleEncoder` via TypeGPU `.with(encoder)`; execute via `pass.executeBundles`.
- Verdict: HYPOTHESIS for Crafty's timeline. With a single draw call there is no command-submission overhead to save. Bundles become relevant when (a) the scene is retained/unchanged across frames while the camera/overlay changes (resources re-bound at execution, so camera uniform buffer updates work without re-encoding — toji), or (b) multi-layer composition (scene + selection + preview — matching `ordered-submission-batches.ts` layers) grows to many draws. Figma explicitly plans bundles for submission CPU overhead — supporting evidence that this is the right direction when the scene is retained. Benchmark §8.6 before adopting; the "rebuild per frame" anti-pattern (toji) must be avoided.

### 6.9 Upload / write strategies
- Current: full-buffer `writeBuffer` per frame — PROVEN recommended default; "preferred route for WASM apps" once geometry comes out of the WASM heap as bytes.
- Candidate: mapped-at-creation per-frame — PROVEN to include zero-init cost; wrong fit for per-frame updates.
- Future options (PROVEN, toji): retained buffer + partial `writeBuffer`/TypeGPU slice writes; staging ring only if profiling shows `writeBuffer` is a bottleneck (it is "a perfectly acceptable path... from a performance perspective" for frequent updates); compute-side generation only if geometry becomes algorithmic.
- JSON.parse of the frame (current host) means the WASM-heap-copy advantage doesn't apply yet; binary packet (contract-sanctioned, "measured optimization") would make it real.

### 6.10 Alpha / blending
- Current: no blend state in either host (PROVEN, §5.1 → replace); canvas configured `alphaMode: "premultiplied"` (`index.ts:43`) while the protocol encodes straight (non-premultiplied) RGBA; current host ignores opacity entirely; candidate multiplies opacity into alpha but that alpha is never blended.
- Consequences (PROVEN from code): the translucent parity test documents `maximumColorDelta: 0.25`; with no blend, overlapping translucent rects are visually wrong in both hosts; the premultiplied canvas alphaMode also expects premultiplied color in the texture for correct page compositing.
- Fix options (HYPOTHESIS on visual outcome, PROVEN mechanisms): enable per-target alpha blend with premultiplied factors (matches `alphaMode: "premultiplied"`) and encode premultiplied colors; or set `alphaMode: "opaque"` and keep straight colors with standard src-over blend. Both are one `targets[].blend` field in TypeGPU's pipeline descriptor (PROVEN — targets carry `GPUBlendState`).
- Verdict: correctness gate — fix before any further parity or budget work, and add a blending fixture to the parity suite (rect over rect with translucency, not just over the clear color).

### 6.11 Clipping
- Current: no clipping in the protocol.
- Options: scissor rects (per-pass, PROVEN) for axis-aligned dirty-area clipping; stencil-based shape clipping (raw WGSL, PROVEN API exists, no TypeGPU sugar documented); fragment discard in WGSL for simple cases.
- Verdict: HYPOTHESIS design space. Scissor + dirty regions (§6.2) is the only near-term item; shape clipping waits for geometry beyond rectangles. No action now.

### 6.12 Device-loss recovery
- Current: detect-only (`webgpu-renderer.ts:86-89`); policy requires full rebuild (`renderer-failure-policy.md` — recreate device, root, pipeline, buffers, then resubmit the retained packet).
- TypeGPU: no device-loss API; `root.destroy()` no-op for `initFromDevice` (PROVEN) — recovery is: new adapter → new device → new root → recreate every resource → re-configure context → replay retained packet (toji pattern, PROVEN).
- Constraints (PROVEN): always request a fresh adapter after loss; never parse `message` — use `reason`; handle `requestAdapter() === null` after loss as browser-restart advice; Chrome crash-frequency limits can make immediate recovery impossible.
- Crafty-specific: the "last valid packet" must live on the JS side (it already does — the renderer never owns the document), so replay is cheap (re-run `render()` with the retained `RenderFrame`). Test with `device.destroy()` and `about:gpucrash` (Chrome).
- Verdict: implement per policy; gate in §10. Also note Figma's dynamic fallback is a stronger pattern that the current "no fallback by default" policy deliberately excludes — revisit only after the approved-backend matrix is exercised.

### 6.13 OffscreenCanvas / workers
- Current: device + canvas on the main thread (`index.ts`).
- Options (PROVEN): WebGPU is worker-exposed; OffscreenCanvas contexts work in workers (`transferControlToOffscreen`, rAF in workers); TypeGPU `configureContext` accepts `OffscreenCanvas`.
- Verdict: HYPOTHESIS value. Input events land on the main thread, so worker rendering adds a postMessage round trip to input-to-present; the win is main-thread jank reduction for encode/JSON work. The target-architecture table already lists "WebGPU resource ownership: Host TypeScript; worker owns canvas" as a candidate split. Sequence it after budgets are met on the main thread and only if main-thread encode/upload dominates (§8). The readback proof would also move off-thread.

### 6.14 Input-to-present latency
- Current: pointer → React state → `renderer.render()` → WASM `core.render()` → JSON.parse → TS encode → writeBuffer → submit → present (implicit vsync). No segmentation instrumentation exists (only the CPU bench with env-var metadata).
- Instrumentation options (PROVEN): `performance.now()` around each segment; `device.queue.onSubmittedWorkDone()` for queue-timeline completion; TypeGPU `withTimestampWrites`/`withPerformanceCallback` for GPU-timeline timing (feature-gated: `timestamp-query` in `root.enabledFeatures`); Chromium tracing for wire/GPU-process costs.
- Verdict: build the segmented measurement first (§8.2) — the 50 ms budget cannot be managed without knowing where time goes. HYPOTHESIS: JSON stringify/parse + per-vertex JS math dominate at 10k rects; binary packet and direct-to-typed-array encoding are the likely fixes (both contract-sanctioned).

### 6.15 Memory / allocation budgets
- Current: per-frame JS `number[]` push (GC churn) → `Float32Array` copy → full-buffer write; candidate per-frame GPU buffer alloc. No allocation instrumentation. Contract: "no unbounded allocation per frame".
- Options (PROVEN mechanisms): encode directly into a reused `Float32Array` (skip `number[]`); capacity-retained GPU buffer (skip per-frame allocs); typed-array write path in TypeGPU (verbatim copy, must include padding).
- Sizes at fixture scale (PROVEN math): 10k rects → 60k verts → 1.73 MB (current) / 2.30 MB (candidate schema) — far under the 256 MiB buffer limit; the budget question is bandwidth + allocator churn, not capacity. GPU memory budget: keep all buffers/textures under 256 MiB `maxBufferSize` per allocation and track totals; atlas/instancing changes must be accompanied by an accounting table in the bench output.

### 6.16 Instrumentation (renderer observability)
- Current: `RendererEvidence` exposes commandCount/protocolVersion (index.ts + App.tsx renderer-proof panel); CPU bench env metadata.
- Needed (PROVEN mechanisms): segmented frame timings (input→encode→upload→submit→present-observed), GPU timestamps where available, allocation counters (buffers created/destroyed per frame, bytes), device-loss events, and the existing diagnostics codes from `renderer-failure-policy.md` mapped to each segment. TypeGPU `withTimestampWrites` exists but `timestamp-query` is not universally supported — feature-detect (PROVEN pattern in TypeGPU enabling-features docs).
- Verdict: fold into the bench harness (§8); production telemetry stays behind the evidence/diagnostics contract.

---

## 7. Comparison: Current Host vs TypeGPU Candidate vs Target

| Dimension | Current host (`webgpu-renderer.ts`) | TypeGPU candidate (as committed) | Target (post-research) |
|---|---|---|---|
| Buffer per frame | Retained, grows by doubling | **New alloc + destroy every frame** | Capacity-retained via `capacity-resource-cache.ts` |
| Vertex bytes/rect | 144 (24 B/v × 6) | 192 (32 B/v × 6) | ≤96 via instancing or packed layout |
| Opacity handling | Ignored | Folded into alpha (unblended) | Blend-enabled pipeline + premultiplied encoding |
| Blend state | None (replace) | None (replace) | Per-target `GPUBlendState` |
| Upload | Full-buffer `writeBuffer` | Mapped-at-creation (zero-init) | Retained + slice writes; `writeBuffer` for full rebuilds |
| Type safety | `any`-typed GPU objects | Typed schemas/layouts | Typed everywhere, `root.unwrap` escape hatches |
| Render bundles | No | No | Later, for retained scene + overlay layers |
| Instancing | No | No | After bench (§8.4) |
| Device loss | Detect + diagnostic | None (inherits browser behavior) | Full rebuild + retained-packet replay (§6.12) |
| Turbopack | N/A (raw WebGPU) | Runtime-API only — builds under Turbopack | Same; `'use gpu'` only via Babel route (verified) |
| Correctness fixture | Parity-tested vs candidate | Parity-tested vs current (mismatch documented) | Shared parity + blending fixtures |

The TypeGPU candidate as committed is a *schema/typing spike*, not yet a performance spike: its only performance-relevant property vs the current host is worse (per-frame allocation, bigger vertices). Its value is the typed API surface, slice writes, instance stepping, bundle interop, and instrumentation hooks — all of which the target row consumes.

---

## 8. Proposed Reproducible Benchmarks

Principle: every bench records fixture, browser/build, OS, GPU (existing `CRAFTY_BENCH_*` env pattern), and a fixed measurement protocol (median-of-N after warmup; report p50/p95; `onSubmittedWorkDone` for queue-timeline). GPU benches need a browser-automation harness (Playwright driving a bench page that renders to an offscreen canvas or the real canvas); the current vitest bench is CPU-only.

- **B0 (correctness, not perf)**: extend parity fixtures with a translucent-over-translucent overlap and a blend-enabled host; assert pixel hashes equal across hosts once blending matches. Gate everything on B0.
- **B1 (encode, CPU)**: extend the existing bench — current host vs candidate vs "direct-into-reused-Float32Array" vs "instanced-record encoder". Fixtures: 1k/10k/50k rects; budgets: existing 50 ms/16 ms.
- **B2 (upload, queue timeline)**: retained capacity buffer, full `writeBuffer` vs partial slice writes (1k-of-10k changed) vs per-frame mapped-at-creation (candidate today). Metric: submit→`onSubmittedWorkDone`.
- **B3 (frame pipeline, end-to-end)**: pointer→render→submit→`onSubmittedWorkDone` with segment timestamps; 10k/50k rects; also JSON frame path vs (future) binary packet path when it lands.
- **B4 (instancing)**: 6-vert vs instanced quad: CPU encode ms, uploaded bytes, GPU draw ms (timestamp queries when `timestamp-query` is available; else `onSubmittedWorkDone` delta).
- **B5 (dirty region)**: static camera, 200×200 px dirty rect: full clear+redraw vs `load`+scissor; GPU time via timestamps.
- **B6 (render bundles)**: retained scene + changing overlay: direct draws vs static-scene bundle + dynamic overlay draws vs per-frame rebuilt bundle (the anti-pattern control). Metric: command-encoding CPU time.
- **B7 (memory)**: allocations/frame (created/destroyed GPU buffers, JS allocations via long-task/GC observation), retained byte totals; assert "no unbounded allocation per frame".
- **B8 (device loss)**: `device.destroy()` and `about:gpucrash` (Chrome flags per toji): measure recovery time (loss→new device→replay retained packet→present) and assert < 250 ms page-switch-style budget or a documented degraded state.
- **B9 (build)**: `next build` + `next dev` (Turbopack, Next 16.3.0) with the runtime-API TypeGPU path; separate spike for `unplugin-typegpu/babel` if `'use gpu'` is ever adopted.
- **B10 (worker)**: main-thread vs worker-owned OffscreenCanvas render of B3; measure main-thread long-task time and input-to-present (includes postMessage hop).

Hardware matrix to record: at minimum the dev machine (darwin) + one integrated-GPU laptop and one discrete-GPU desktop if available; Figma's experience (§5.5) is that WebGPU gains vary widely by device class — record, don't average.

---

## 9. Risks

| # | Risk | Impact | Evidence basis | Mitigation |
|---|---|---|---|---|
| R1 | TypeGPU candidate's per-frame buffer churn ships | Per-frame GPU allocs + zero-init; jank at scale | §5.2, §6.3 | Capacity-retained buffer via existing cache; B2 gate |
| R2 | Correctness claims on translucent content | Wrong visuals for real documents | §6.10 (no blend in either host) | B0 blending fixtures before parity claims |
| R3 | Vertex layout regression (+33% bytes) | Upload bandwidth, cache pressure | §3.3, parity test | Packed layout or instancing (§6.5/§6.6) |
| R4 | `'use gpu'` adopted later without a Turbopack path | Build break; toolchain fork (webpack) | §4.9, §5.6 | Keep runtime-API path; verify Babel route in a B9 spike before committing to TS shaders |
| R5 | Unmeasured GPU path | Budget gates are fiction | §3.5 (CPU-only benches) | Browser bench harness (B1-B10) before budget claims |
| R6 | Device loss mid-session with detect-only handling | Frozen/black canvas | §5.4, §6.12 | Recovery loop + B8; keep retained packet JS-side |
| R7 | Load-blocking readback proof | +hundreds of ms load on some devices | Figma §5.5; `index.ts:45` | Move proof to non-load-blocking; device blocklist pattern if needed |
| R8 | Bundles adopted per-frame | No gain or regression | toji §5.3 ("rebuild per frame → draw directly") | Only after retained scene; B6 |
| R9 | Dirty-rect/tiling complexity ahead of evidence | Wasted engineering | §6.2 | B5 first; defer tiles |
| R10 | Worker rendering adds input-to-present hop | Perceived latency | §6.13 | B10 before adopting; main-thread budgets first |
| R11 | TypeGPU docs/skill version drift (skill targets 0.11.2) | Stale API guidance | §4 version facts | Pin 0.11.9; re-verify skill claims against docs at each bump |

---

## 10. Recommended Sequence and Stop/Go Gates

### Sequence (each step ends with its gate)

1. **Correctness step (no new architecture)**: add blend state to the winning host's pipeline target, premultiply or switch `alphaMode` to `opaque` consistently, fix opacity handling in the current host, extend parity fixtures with overlap-translucency. — *Gate G0.*
2. **Host convergence spike**: retain a capacity-grown TypeGPU buffer (wire `capacity-resource-cache.ts`), encode directly into reused typed arrays, keep the raw-WGSL shader + TypeGPU schema/layout. Land B1/B2/B7 numbers vs the current host. — *Gate G1.*
3. **GPU bench harness**: browser-automation bench page (B2-B8) with environment capture; record baseline on ≥2 device classes. — *Gate G2* (baselines recorded, budgets re-stated per device).
4. **Retained display list + changed batches**: protocol v2 (revision, node ids, changed batches), partial slice writes, `ordered-submission-batches.ts` wired for scene/selection/preview layers. — *Gate G3.*
5. **Instancing** (B4) then **render bundles for the retained scene** (B6) then **dirty-region scissor** (B5) — in that order, each gated on its bench. — *Gate G4.*
6. **Device-loss recovery** (§6.12) + B8; move the readback proof off the load path (R7). — *Gate G5.*
7. **Turbopack verification** (B9) and only then decide on `'use gpu'`/unplugin adoption. — *Gate G6.*
8. **Workers/OffscreenCanvas** (B10) only if G2-G4 show main-thread encode/submit dominating and B10 confirms no latency regression. — *Gate G7.*

### Gates

- **G0 GO**: both hosts pixel-match on all fixtures including translucent overlap; blend state present; opacity semantics equal. STOP: otherwise — no budget work on a visually wrong path.
- **G1 GO**: TypeGPU host with retained buffer ≤ current host on B1 encode time, ≤ on B2 upload, and zero per-frame GPU buffer allocations (B7). STOP if: per-frame allocation persists, or encode ≥ 2× current host.
- **G2 GO**: baselines for B2-B8 recorded on ≥2 device classes; 50 ms/16 ms budgets either met or re-scoped with per-device numbers. STOP: no production budget claims without this.
- **G3 GO**: 1,000-node changed batch sync ≤16 ms (existing budget) on the retained path; full rebuild remains the tested fallback. STOP if partial writes do not beat full re-upload on the target class — then keep full uploads and drop the changed-batch protocol v2 from the critical path.
- **G4 GO**: each of instancing/bundles/dirty-rect shows a measured win on the target device class (encode CPU time or GPU time per B4/B6/B5). STOP: skip that optimization; the single-draw full-redraw path remains acceptable below the fixture scale.
- **G5 GO**: recovery from `destroy()` and `about:gpucrash` completes within the 250 ms page-switch budget or reports the defined degraded state; retained packet replayed pixel-identically (B0 parity reused).
- **G6 GO**: `next build`/`next dev` on Turbopack 16.3.0 pass with the runtime-API path; if `'use gpu'` is required by a feature, the Babel-plugin path builds and typechecks, or the feature is scoped to raw WGSL strings.
- **G7 GO**: B10 shows worker rendering with no input-to-present regression and reduced main-thread long tasks; otherwise keep the main-thread host.

---

## 11. References (retrieved 2026-08-06 unless noted)

TypeGPU (Software Mansion, MIT):
- npm `typegpu` — https://www.npmjs.com/package/typegpu (0.11.9, published 2026-06-25; registry JSON: https://registry.npmjs.org/typegpu)
- npm `unplugin-typegpu` — https://www.npmjs.com/package/unplugin-typegpu (0.11.6, published 2026-06-25)
- Docs home — https://docs.swmansion.com/TypeGPU/
- Roots (initFromDevice, configureContext incl. OffscreenCanvas, root.destroy) — https://docs.swmansion.com/TypeGPU/apis/roots/
- Buffers (slice writes, patch, writeSoA, mapped-at-creation init, existing-buffer wrap, usage flags) — https://docs.swmansion.com/TypeGPU/apis/buffers/
- Pipelines (targets/blend, with(encoder) incl. GPURenderBundleEncoder, drawIndexed/indirect, lazy creation, timestamp API) — https://docs.swmansion.com/TypeGPU/apis/pipelines/
- Enabling features (requiredFeatures/optionalFeatures, enabledFeatures) — https://docs.swmansion.com/TypeGPU/advanced/enabling-features/
- Build plugin / bundler list — https://docs.swmansion.com/TypeGPU/tooling/unplugin-typegpu/
- TypeGPU 0.11 release post (2026-04-14; write API tiers, patch, texture/sampler stabilization, unplugin rewrite) — https://docs.swmansion.com/TypeGPU/blog/typegpu-011/
- 0.11 migration guide — https://docs.swmansion.com/TypeGPU/migrations/0-11/
- Local agent skill (targets 0.11.2; advanced.md for indirect/layout/pack-unpack, setup.md for unplugin) — `/Users/sterling/.agents/skills/typegpu/` and `.claude/skills/typegpu/`

WebGPU platform:
- W3C WebGPU spec, Editor's Draft, dated 2026-08-05 — https://gpuweb.github.io/gpuweb/ (canonical: https://www.w3.org/TR/webgpu/). Cited sections: GPUColorTargetState blend default (§10.3.5), default limits (§3.6.2.1), GPUQueue.writeBuffer (§19.2), GPURenderBundle (§18), GPUDevice.lost/GPUDeviceLostInfo (§4.4, §22.1), worker exposure (§12.1).
- toji.dev WebGPU best practices (Brandon Jones) — https://toji.dev/webgpu-best-practices/ : Buffer Uploads (updated 2023-02-03), Render Bundles (2024-01-22), Device Loss (2024-10-23), Bind Groups, Indirect Draws.
- Figma: "Figma rendering: Powered by WebGPU", Alex Ringlein, Luke Anderson, 2025-09-18 — https://www.figma.com/blog/figma-rendering-powered-by-webgpu/
- MDN OffscreenCanvas (doc last modified 2024-10-26) — https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas

Next.js / Turbopack:
- Next.js 16.3.0 Turbopack docs (last updated 2026-08-03; Turbopack default since v16.0.0; no webpack plugins; Babel auto-detection; loaders via `turbopack.rules`) — https://nextjs.org/docs/app/api-reference/turbopack

Working tree evidence:
- `packages/scene-renderer-wasm/src/{webgpu-renderer.ts,typegpu-rectangle-host.ts,index.ts,capacity-resource-cache.ts,ordered-submission-batches.ts}`
- `packages/scene-renderer-wasm/benchmarks/*`
- `packages/scene-renderer/src/draw-protocol.ts`
- `docs/editor/{wasm-boundary.md,renderer-contract.md,renderer-failure-policy.md,target-architecture.md,current-state-audit.md,research-ledger.md,implementation-roadmap.md}`
- `apps/crafty-web/src/App.tsx`, `apps/crafty-web/package.json` (next 16.3.0), `packages/scene-renderer-wasm/package.json` (typegpu 0.11.9)

---

## 12. Proven Facts vs Hypotheses (quick index)

**Proven (primary sources / working tree):** TypeGPU 0.11.9 release date & API surface (§4); unplugin bundler list excludes Turbopack (§4.9); Turbopack default in Next 16 + no webpack plugins (§5.6); blend default = disabled (§5.1); default limits (§5.1); writeBuffer guidance + mappedAtCreation zeroing + WASM preference (§5.2); bundle reuse requirement + per-frame rebuild anti-pattern (§5.3); device-loss recovery pattern + Chrome crash limits + message-not-parseable (§5.4); Figma batching/bind-group/readback/fallback findings (§5.5); OffscreenCanvas worker availability (§5.6/MDN); current hosts' per-frame behavior, opacity omission, no blend, load-blocking readback, CPU-only benches, unwired capacity cache, byte-length delta (33% vertex overhead) (§3).

**Hypotheses (benchmark candidates):** magnitude of partial-write savings (B2/B3); dirty-region/scissor value (B5); instancing benefit (B4); bundle benefit for retained scenes (B6); worker offload net effect (B10); JSON path being the dominant latency segment (B3); whether blend cost matters on target devices (B0/B3); the Babel-based `'use gpu'` route under Turbopack (B9).
