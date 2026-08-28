# Vello for Crafty — research report

Date: 2026-08-07. READ-ONLY research; nothing in /Volumes/dev/crafty was modified.

**Verified correction (2026-08-07, from the implementation prototype — see
`packages/scene-renderer-wasm/benchmarks/vello-cpu-prototype-report.md` and
`openspec/changes/vector-path-rendering/`):** this report's §0/§10/§11
premise that vello_cpu shares the scene/encoding model with the vello-classic
wgpu renderer ("both phases are the same imaging model and the same
Scene-building code") is **false as published**. `vello_cpu` 0.2.0 exposes a
PostScript-style retained-state API (`RenderContext` → `set_paint` /
`fill_rect` / `fill_path` → `render(&mut Pixmap, &mut Resources)`), consumes
no `vello_encoding`, and does not depend on it. A phase-A encoder written
against vello_cpu will NOT be reusable by a vello-classic wgpu phase without a
second encoder (or `vello_hybrid`, unpublished on crates.io as of this date).
The rest of the report stands; the prototype verified packet expressibility,
both fill rules reaching the rasterizer, +28,910 raw wasm bytes (+16.8%), and
~0.77 ms/frame for the 10k fixture.

## 0. Recommendation (read this first)

**Vello embedded is the recommendation, but with eyes open: it is a pre-1.0 dependency on
a fast-moving train, and Crafty must treat it as an *owned* subsystem (pin a version,
witness every upgrade with a pixel-parity harness, keep the existing rect pipeline
splittable).** It is the only option that (a) satisfies the roadmap question — "which
choice also serves glyph rasterization later" — because Vello's text path and Crafty's
path rendering would be the same code, (b) keeps Rust owning *what to draw* and TypeScript
owning the GPU device, which is Crafty's ratified boundary (ADR 0003/0007), and (c) is
production-proven in exactly Crafty's category: an interactive Rust→WASM vector editor
(Graphite ships Vello behind a feature flag and its Canvas, and both Keavon and the Vello
team treat browser integration as the hard part, not drawing quality).

The two strongest alternatives:

1. **CPU tessellation with lyon feeding the existing TypeGPU rect pipeline** — same
   boundary, no new GPU code, but pushes tessellation onto the JS main thread or a worker,
   reinvents what Vello's compute pipeline does, and does nothing for glyphs (lyon is not
   a text rasterizer).
2. **Analytic-AA fringes in WGSL** (the "fringe" approach of the SVGRasterizer/`xilem`-adjacent
   world, and what half of stencil-then-cover actually reduces to) — smallest change to the
   existing host, best incremental story for "paths alongside rects", but every new feature
   (strokes, gradients, images, clipping, glyphs) is a fresh pipeline-and-AA investigation,
   and the total work to reach roadmap 3.3 exceeds embedding Vello.

Stencil-then-cover and tiny-skia are the weakest fits: stencil-then-cover's MSAA quality is
below Vello's analytic AA and it reimplements the whole pipeline; tiny-skia is a CPU raster
backend that inverts the ratified boundary (TS would own rendering policy that belongs to
Rust) and cannot be the interactive path for large scenes.

The cheap de-risking prototype, in order of value: (1) a headless Rust test that encodes
Crafty's 10k-rect fixture as a Vello `Scene` and renders it with `vello_cpu` (the new CPU
renderer, v0.2.0, published today) — this answers "does Vello's scene model express our
packet" with zero browser work; (2) a wasm32 build of vello + vello_encoding measuring
binary size and encode cost per frame; (3) a one-page browser demo rendering a Vello
`Encoding` from a `wasm-bindgen`-exported builder into a texture on the existing TypeGPU
root, with the existing rect pipeline rendering the same scene beside it — the coexistence
test that decides whether "paths alongside rects" is a trap.

**Key caveats to state now:** Vello is 0.9.0 (pre-1.0), releases ~3 months apart, and each
minor release has been breaking (wgpu 26→27→28→29 across 2025-2026; a wgpu-30 PR is open).
The renderer's core is being actively replaced by the "Sparse Strips" line (`vello_cpu`,
`vello_hybrid` — 0.2.0 published 2026-08-07), which explicitly has **no API stability
guarantees**. Vello's own README says browser support is tested on Chrome and "WebGPU
support in Firefox and Safari is still experimental" — the README statement may lag Safari's
actual 2026 status (Safari shipped WebGPU in 18.4/26), and Crafty already runs on WebGPU,
so this is a platform risk Crafty already accepted. Embedding Vello under wgpu means Vello
brings its own wgpu dependency pinned to its release; wgpu and TypeGPU must coexist on one
device, which is the same-device-ownership question the prototype (3) must prove.

## 1. Vello today (2026-08-07)

**Versions (crates.io, fetched 2026-08-07):**

| Release | Date | wgpu | MSRV | Notes |
|---|---|---|---|---|
| v0.9.0 | 2026-05-15 | **v29** | 1.88 | `GlyphRun` gains `font_embolden`, `brush_transform`; skrifa 0.42 (VARC glyphs); bicubic `ImageQuality::High`; atlas residency preserved across renders |
| v0.8.0 | 2026-03-20 | v28 | 1.92 | **Text migrated to `glifo`** (#1562); text is now an *optional feature* (#1455); render targets cleared before draw |
| v0.7.0 | 2026-01-13 | v27 | 1.88 | wgpu 27 matched to Bevy 0.18 |
| v0.6.0 | 2025-10-03 | v26 | 1.86 | `render_to_surface` removed → `render_to_texture` + your own blit (#803); wgpu 26 matched to Bevy 0.17 |
| v0.5.1 | 2025-08-22 | v26 | 1.85 | — |
| v0.5.0 | 2025-05-08 | — | 1.85 | — |

Sources: https://github.com/linebender/vello/releases ,
https://crates.io/crates/vello (downloads 582,390 total; 331,008 in the last 90 days;
57 reverse dependencies; Apache-2.0 OR MIT), https://github.com/linebender/vello/blob/main/CHANGELOG.md .

**Still pre-1.0: yes.** 0.x since the 2024 rename from piet-gpu, ~3 releases/year, every
release breaking in some way (wgpu bumps are the recurring breaking change; one minor
removed a public API — `render_to_surface` — and another restructured resource ownership
into `Resources`). Maintained by the linebender org (raphlinus, LaurenzV, xStrom,
waywardmonkeys, nicoburns, grebmeg + 70 contributors). 4.2k stars, last push 2026-07-14.
Roadmap is a Google Doc, not a published semver plan:
https://docs.google.com/document/d/1gEqf7ehTzd89Djf_VpkL0B_Fb15e0w5fuv_UzyacAPU/edit
(the "Sparse Strips" roadmap).

**The big 2026 development: "Sparse Strips" is replacing the classic renderer.** Three new
crates live in the vello repo: `vello_cpu` (CPU renderer, no GPU), `vello_hybrid` (CPU
preprocessing + GPU rasterization), `vello_sparse_shaders`, `vello_common`. Both CPU and
hybrid reached **v0.2.0 on 2026-08-07 (today)**; the release notes say explicitly: "does
not provide any API stability guarantees, as we intend to redesign the API to be consistent
across the Vello renderers". The hybrid rewrite (#1759) removed coarse rasterization and
the render graph, removed `SceneConstraints`/`RenderError::SlotsExhausted`. The classic
`vello` crate (wgpu compute) remains the stable-ish line. Also released today: Glifo v0.3.0
(glifo moved into the vello repo, #1539).

**Stabilization roadmap: none published for 1.0.** The sparse-strips roadmap doc exists;
a 1.0 date is not stated in any release note I could verify. Flag: I could not verify any
public statement about when `vello` (classic) would reach 1.0; treat 0.9.x as the "stable
line" with the caveat that the maintainers are visibly investing in the CPU/hybrid line.

An open PR upgrades to wgpu 30 (https://github.com/linebender/vello/pull/1754 , opened
2026-07-19, blocked on wgpu-profiler), and one comment notes "we need to wait for #1664
to be merged and make a new Vello release" — confirming the release cadence (~2-3 months).

## 2. wgpu / WebGPU / browser compatibility (2026-08-07)

**wgpu version.** vello 0.9.0 (2026-05-15) requires `wgpu ^29.0.3`; the crate pins to a specific wgpu line and updates it every 1–2 releases (26→27→28→29 across 2025–2026; v0.7.0 explicitly matched wgpu 27 to "the version used by the upcoming Bevy 0.18"). An open PR upgrades to wgpu 30 (https://github.com/linebender/vello/pull/1754 , opened 2026-07-19, blocked on `wgpu-profiler`). So an embedded Vello brings a wgpu dependency pinned by Vello's release, not by Crafty. wgpu 30 is the current wgpu line (crates.io, 2026); vello 0.9's wgpu 29 is one minor behind. Sources: https://github.com/linebender/vello/releases , https://github.com/linebender/vello/blob/main/CHANGELOG.md , https://crates.io/crates/wgpu .

**wasm32-unknown-unknown.** Yes — this is a supported target; Vello's own web demo (https://linebender.github.io/vello) and the `with_winit` example build with `cargo-run-wasm` for `wasm32-unknown-unknown`, and Vello is designed to work within WebGPU `Limits::default` ("We aim to target all environments which can support WebGPU with the default limits. We defer to wgpu for this support." — README). Two packaging gotchas are documented: (1) the wgpu **webgpu backend feature must be enabled** (`wgpu_default`) or `wgpu::Instance::new` panics on wasm — the exact cause of a 2026 blank-page regression in the hosted demos (https://github.com/linebender/vello_svg/pull/81 , https://github.com/linebender/vello_svg/issues/80); (2) `vello::util`'s `block_on_wgpu` panics on wasm by design.

**Browser gaps.** Vello's README is honest and slightly stale: "Web is not currently a primary target for Vello… tested using production versions of Chrome, but WebGPU support in Firefox and Safari is still experimental." Chrome has run it for years. Firefox: Vello needs `dispatchWorkgroupsIndirect` (its workgroup counts are computed GPU-side); MDN's compat data records Firefox **141 as supporting it "Windows only"**, and Mozilla bug 1930756 "Enable indirect dispatch in WebGPU" shipped in Firefox 134+ (https://bugzilla.mozilla.org/show_bug.cgi?id=1930756) — the two records disagree on scope, and I could not verify Firefox's macOS/Linux indirect-dispatch status for 2026 (FLAG). A 2025 report of the linebender demos failing on Firefox Nightly (https://bugzilla.mozilla.org/show_bug.cgi?id=1888749) was exactly this gap; it is resolved on Windows. Safari: MDN records `dispatchWorkgroupsIndirect` in Safari 26 (https://developer.mozilla.org/en-US/docs/Web/API/GPUComputePassEncoder/dispatchWorkgroupsIndirect); a 2025 Vello issue reporter measured "Safari technology preview with WebGPU support is the fastest" (https://github.com/linebender/vello/issues/936).

**Driver/implementation bugs observed in the wild (all must be treated as platform risk, none as blockers):**
- First-frame GPU stalls of ~1.5 s on Windows/Chrome vs ~75 ms on Apple silicon, attributed to workgroup-memory zero-initialization polyfills and shader compilation (https://github.com/linebender/vello/issues/936). Graphite hit a Firefox crash from a WebGPU spec change mid-2024, fixed only by tracking wgpu from git (https://github.com/GraphiteEditor/Graphite/pull/2027).
- Android/Vulkan clip-layer black frames fixed in 0.9.0 (https://github.com/linebender/vello/pull/1637); Adreno/WebGL issues in the hybrid renderer (sparse-strips 0.0.9).
- The 2026-07 "hard-errors on all major browsers" demo report turned out to be Vello's own feature-gating bug, not browsers (vello_svg #80/#81).

**Implication for Crafty:** Crafty already lives or dies on WebGPU (ADR 0007; `WEBGPU_UNAVAILABLE` is a first-class diagnostic), so Vello adds no *new* platform dependence; it adds a *second* GPU stack (wgpu on wasm) beside TypeGPU, on the same adapter. What it does add: Firefox non-Windows is the weakest platform, and the first-frame compile cost. Both are measurable with the prototype in §11.

## 3. Embedding vs adoption — the API shape

**Vello embeds as a library; you own the instance, the device, the queue and the target texture.** The documented pattern (docs.rs/vello, README, 100% documented crate):

```rust
let mut renderer = Renderer::new(&device, RendererOptions { use_cpu: false, antialiasing_support: AaSupport::all(), num_init_threads: ... })?;
renderer.render_to_texture(&device, &queue, &scene, &texture_view, &RenderParams { base_color, width, height, antialiasing_method })?;
```

- `Renderer::new(&Device, RendererOptions)` (https://docs.rs/vello/latest/vello/struct.Renderer.html) — created once per device; keeps pipelines and (since 0.8) a `Resources` object owning image/glyph atlases. Not `Sync`; single-threaded use.
- `render_to_texture(&Device, &Queue, &Scene, &TextureView, &RenderParams)` renders into a **host-provided texture** — it must be `Rgba8Unorm` with `STORAGE_BINDING` usage (it's a compute renderer). **Rendering into a texture without presenting is the primary API.** `render_to_surface` was removed in 0.6.0; the recommended path is render-to-texture + your own blit (`wgpu::util::TextureBlitter`), or render directly to the surface texture's view (discouraged: "some GPUs assume that you will not be rendering to the surface using a compute pipeline"). So: host owns canvas, device, texture; Vello writes pixels; host presents. That maps exactly onto Crafty's "TypeScript owns the GPU" IF the host's device is a wgpu device — which is the crux (see §10 integration sketch).
- `register_texture` / `override_image` (0.9.0) let a host draw GPU-resident textures through the scene — relevant for Crafty's future images (roadmap 3.4).
- `vello::util::RenderContext` (device/surface management, `TextureBlitter`) is a convenience for windowed apps; a host that already owns a device does not need it (and `block_on_wgpu` panics on wasm).

**vello_encoding's role.** Two layers, both in the vello repo:
- **`vello::Scene`** — the immediate-mode builder: `scene.fill(Fill::NonZero, Affine, brush, brush_transform, &shape)`, `scene.stroke(&Stroke, ...)`, `push_layer/pop_layer` for clipping/blend groups, `Scene::draw_glyphs` for text, `Scene::draw_image`. Order of calls = z-order; there is no zIndex concept — the host orders. `Scene::reset()` must be called between frames ("Rendering from a Scene will not clear it… a scene which is retained between frames will… quickly increase the complexity of the render result" — docs.rs/vello/struct.Scene.html).
- **`vello_encoding`** — the raw binary streams the GPU consumes (tags, path segments, transform stream, style stream, draw objects, ramps, clips): `Encoding`, `PathEncoder`, `Style` (stroke/fill, nonzero/evenodd via `FLAGS_FILL_BIT`), `DrawColor/DrawLinearGradient/DrawRadialGradient/DrawSweepGradient/DrawImage/DrawBlurRoundedRect`, `GlyphRun`, `Resolver`/`Resources` for late-bound textures, `Layout`/`BufferSizes`/`WorkgroupCounts` for the render setup (https://docs.rs/vello_encoding/latest/vello_encoding/). `Scene::encoding()`/`encoding_mut()` exposes it for manual encoding — Graphite uses manual encoding for gradient tables ("implementation of Vello rendering for these tables using manual encoding", GraphiteEditor/Graphite#3989). vello_encoding has **no wgpu dependency** — it is pure data, wasm-friendly, and usable headless (that is what makes the vello_cpu de-risk path in §11 possible).

**So the embedding answers:** a host passes a coarse packet of geometry by *building a Scene in Rust* from its own command list, and gets an image by calling `render_to_texture` into a texture it owns. One JS/WASM crossing per frame; no per-shape crossings; the Scene builder is the only "scene graph structure" imposed, and it is an append-only immediate-mode stream, not a retained tree.

## 4. The scene/encoding model vs Crafty's authored packet

**Mapping is direct.** Crafty's `DrawCommand { geometry, nodeId, bounds, transform, fill, opacity, zIndex, order }` (draw-protocol.ts) maps to: `scene.fill(Fill::NonZero, Affine::new(a,b,c,d,e,f), brush, None, &rect/path)` with alpha = fill.a × opacity, and the Rust encoder already sorts by `(zIndex, order)` (lib.rs `submit()`), which is exactly the insertion order Vello needs. Nothing in the packet is product semantics; the scene carries geometry, paint and order — the renderer receives no components/tokens/variants. **No conflict with the ratified boundary** (ADR 0003/I30): the boundary survives; the *shape of the payload* changes (paths instead of rects; order sorted in Rust, as today).

**Does Vello impose its own structure?** Only an ordering discipline (insertion order) and a transform model (`kurbo::Affine`, f64) — both already present in Crafty's encoder. Vello has no retained hierarchy: no parent/child nesting, no clip tree (clips are push/pop layers), no zIndex. Crafty's authored hierarchy (frames→layers, I32-adjacent) is flattened before encoding today and would stay flattened.

**Tessellation: Vello does it all on the GPU; lyon becomes unnecessary.** Path flattening (curve→line soup), tiling/binning, stroking (GPU-side stroking is on by default in the scene builder, `GPU_STROKES = true` in scene.rs; only dash patterns are expanded CPU-side into stroked paths), fill and blend are compute passes inside the Renderer. `vello_encoding`'s `LineSoup`/`Tile` types are GPU-side intermediates, not host-side tessellation. If Crafty adopts Vello, the roadmap-3.3 phrase "tessellation in the encoder" is satisfied by Vello's compute pipeline; no lyon anywhere in the path. (lyon's only role would be in the non-Vello alternatives, §9.)

**Incrementality: Vello is immediate-mode.** There is no retained-scene-fragment API. Raph's vision document says retained fragments are a goal, not a feature ("the goal of retaining scene fragments is motivating design decisions… I will focus on immediate mode first" — https://github.com/linebender/vello/blob/main/doc/vision.md); the sparse-strips line even *removed* the recording feature (vello 0.0.8 changelog, #1611: "Support for recordings… removed… due to a number of downsides"). Servo's Canvas2D implementation resets the scene every frame ("vello scenes only grow… We need to reset scene on each render (~each frame) and providing old frame as backdrop", https://github.com/servo/servo/pull/38406). **Consequence: Crafty's `changedNodeIds` delta mechanism (protocol v2, `mergeRetainedCommands`) has no Vello-side analogue — the scene re-encodes every frame.** The host-side retained map and batch merge retire for authored geometry; the delta's remaining uses are dirty-region diagnostics. This is a real (but honest) simplification: encoding is cheap relative to drawing, and the whole reason for the delta was JSON encode cost, which disappears when the encoder writes binary encoding streams in-process.

## 5. Antialiasing quality

- Default is **analytic area AA**: `AaConfig::Area` — "the alpha value for a pixel is computed from integrating the winding number over its square area… very accurate when the shape has winding number of 0 or 1 everywhere, but can result in conflation artifacts otherwise… generally better performance than the multi-sampling methods" (https://docs.rs/vello/latest/vello/enum.AaConfig.html). `Msaa8`/`Msaa16` are also supported (used notably for stroke joins/caps, where area AA of the stroked outline is imperfect), configured per-render via `RenderParams.antialiasing_method` and declared up front via `AaSupport`.
- **Fill rules: both.** `Fill::NonZero` (default) and `Fill::EvenOdd` are first-class; encoded in the style stream (`FLAGS_FILL_BIT` in vello_encoding, https://docs.rs/vello_encoding/latest/vello_encoding/struct.Style.html); the pipeline carries the rule through to the fine stage (`DRAW_INFO_FLAGS_FILL_RULE_BIT`). There is even a dedicated `fill_type` test scene (vello #389).
- **Self-intersecting paths:** handled by the winding-number machinery (nonzero works on self-intersections by definition; evenodd likewise); the documented caveat is conflation artifacts where winding ≠ {0,1} under *area* AA (the classic case: two overlapping subpaths under nonzero), which is the standard tradeoff of analytic AA vs MSAA — for a design tool's editing view this is the right trade (and Vello's `AaConfig::Msaa16` exists when a user cares).
- **Quality vs lyon+MSAA:** lyon produces exact triangle meshes; quality then depends entirely on the host's MSAA (4×–8×) and depth/coverage handling. For fills, analytic AA is measurably sharper at edges than MSAA×4 and is resolution-independent (no "jaggies at zoom" artifacts); for strokes, Vello's own maintainers found analytic AA of stroked outlines insufficient and use MSAA for stroke joins/caps — which is evidence that "analytic only" (the fringe alternative, §9) is the risky part, not the fills.
- Correctness history: degenerate gradient/radial handling fixed over time (vello #316, sparse-strips 0.0.8 changelog), "high winding counts" fixes (0.0.9), fill correctness is enforced by a shared reference-software test suite (`vello_tests`/probes in the CPU/hybrid line).

## 6. Performance and dynamic-geometry cost

**Published data points (maturity caveat: benches are mostly native/CPU, not browser-GPU):**
- Raph's Khronos demo slide: "120 fps for paris-30k SVG test image on M1 Max — 50k paths, ~1M path segments" (https://www.khronos.org/developers/linkto/vello-demonstration; older talk, indicative not contractual).
- Fine-stage microbenchmarks on M2 Max (ns per operation: fills, strokes, gradients, blend modes, images) recorded in https://github.com/linebender/vello/pull/999 — these measure the raster shader, not end-to-end.
- A maintained comparative benchmark page for the renderer family: https://laurenzv.github.io/vello_chart/ (cited in the vello release notes; not time-locked).
- Sparse-strips (CPU/hybrid) 0.1.0/0.2.0 release notes claim "competitive performance" for vello_cpu with SIMD (x86 and NEON), multi-threaded render contexts, and up to 10% gains from frontend rewrites.

**Dynamic geometry (dragging a bezier handle):** Vello's architecture is *built* for this — the transform is applied GPU-side, path encoding is transform-independent, and the whole scene re-rasterizes each frame with no CPU tessellation. The GPU pipeline cost scales with (paths × segments × covered tiles), not with edit frequency. The per-frame CPU costs are (a) Scene/Encoding build, (b) optional `bump_estimate` (issue #541: **enabled, it costs 1.75×–2.3× encoding time**; without it, GPU buffers may need reallocation), (c) any image/glyph atlas work. For Crafty's 10k-rect fixture, rects have a dedicated fast path (vello hybrid changelog: "Special case drawing rectangles"; classic `fill_rect`/`fill_blurred_rounded_rect` fast paths, sparse-strips 0.0.8). There is no published end-to-end "drag a handle at 60fps" number I could cite; the honest answer is: **must be measured on the fixture**, and the architecture is the right shape (this is exactly what Graphite and Servo do per-frame).

**Incremental encoding: does not exist** (see §4). The host re-encodes everything each frame; there is no append-changes API, no retained fragments (recordings removed in 0.0.8). This is the single biggest delta-vs-Vello cost and it falls on the CPU side.

## 7. Text / glyphs

**Vello's text story is real and is exactly the "done once" answer the roadmap asks for.** Since 0.8.0, text rendering in all Vello renderers goes through **Glifo** (moved into the vello repo, https://github.com/linebender/vello/pull/1539; "Migrated text rendering to glifo", v0.8.0 changelog #1562): glyph outline extraction from **skrifa** (font parsing, VARC support since 0.42), glyph outline caching, COLR/bitmap emoji, synthetic embolden, text decorations with skip-ink, and — since v0.9.0 — `GlyphRun.font_embolden` and `brush_transform` (gradients painting glyphs). Text is encoded through the same `Scene` as everything else (`Scene::draw_glyphs` / `DrawGlyphs` builder; https://docs.rs/vello/latest/vello/struct.DrawGlyphs.html), so glyphs run through the same compute pipeline as paths — **glyph rasterization is Vello's job, not an external step**. Parley (linebender's shaping/layout crate, skrifa 0.42, ~parley 0.9.0) supplies the shaping that Vello doesn't; Glifo is the layer between Parley's output and Vello's Scene (https://linebender.org/blog/tmil-25/). Status honesty: Glifo is "experimental… under rapid development" (README), "first cut at glyph caching — more work is needed" (TMIL 25), text is feature-gated in vello (optional feature since 0.8.0 #1455). For Crafty's roadmap 3.1/3.3: adopting Vello buys one coherent path→glyph rasterizer; the shaping choice (parley vs a hand-rolled skrifa loop) remains a separate decision, but the *rasterization* double-work disappears.

## 8. WASM size and load cost

- **~570 kB** total wasm bundle for the `vello_hybrid` WebGL example built with the **WebGPU** browser backend (wgpu issue #3103, comment by a Vello contributor quoting their build). WebGL-only backend: 3.6 MB (wgpu-core + naga dominate). Classic vello is a superset of hybrid's shader needs, so ~0.5–1 MB is the honest planning figure for vello + vello_encoding + wgpu-webgpu on wasm32; Crafty's current module is a few tens of kB, so this is a ~10–20× module growth (acceptable for a design tool, but a real load-cost change; measure, don't guess).
- cargo-bloat of Dioxus Blitz (wgpu+vello native): naga 1.0 MiB, wgpu_core 759 KiB, **vello 135 KiB**, wgpu_hal 121 KiB (https://github.com/gfx-rs/wgpu/issues/3103) — i.e. Vello itself is small; wgpu+naga is the weight.
- Load cost beyond bytes: first-frame GPU stalls (issue #936, §2) and a load-blocking readback — Crafty's own `loadWasmWebGpuRuntime` already does a load-blocking 1×1 readback proof, a pattern the existing research flagged as expensive (webgpu-typegpu.md §1.8); adding Vello's shader compilation on top needs the GPU-timeline bench to confirm init stays under budget.
- `vello_encoding`/`vello_cpu` have no wgpu dependency — a vello_cpu-first build adds only vello_common + glifo deps (vello_cpu 0.2.0 published 2026-08-07) and keeps the module small; this is the cheapest wasm-size staging (§11).

## 9. Production users in 2026, and Graphite's experience

**Who ships it:**
- **Graphite** (Rust→WASM vector editor, the closest analog): Vello integrated via GSoC 2024 (https://github.com/GraphiteEditor/Graphite/pull/1802), shipped opt-in behind a preference with an SVG-render fallback, checkbox disabled without WebGPU (GraphiteEditor/Graphite#1844). By late 2025 the direction inverted: "Make SVG renderer a preview render mode and take Vello out of preferences" (GraphiteEditor/Graphite#3512); the Vello integration tracking issue closed 2025-12-22 (GraphiteEditor/Graphite#1845); Vello-only features exist now (Pixel Preview render mode, #3847/#3881). So: opt-in → de-facto default within ~18 months, with the SVG pipeline demoted to a preview/fallback mode.
- **Servo** (Mozilla's Rust browser): Canvas2D implemented on Vello, with `vello_cpu` measured as competitive on their use-case (https://github.com/servo/servo/pull/38406).
- **CuTTY** (Alacritty fork): daily-driver terminal replacing its OpenGL renderer with the wgpu/Vello + parley stack, "cut roughly 4,000 lines of renderer and font-handling code" (https://crates.io/crates/cutty_terminal).
- Others: Dioxus Blitz (wgpu+vello; cargo-bloat data above), Xilem/Masonry moved to the "imaging" abstraction with vello-classic and vello_cpu backends (TMIL 25), `nowui-render-gpu`, uzumaki-ui, `bevy_vello` (vello tracks Bevy's wgpu line on purpose), Velato (Lottie demo, https://linebender.org/velato/).

**What Graphite hit (verified pain, all in issues/PRs):**
- Surface/configure races and panics: `Surface::configure` "map callback was leaked" panic reproduced via Vello's own examples (https://github.com/gfx-rs/wgpu/issues/4214) — this is the class of bug the **wgpu-sync** crate (nical) addresses; note: the fix landed in wgpu itself (#4220/#4227). I could NOT verify that Graphite adopted the `wgpu-sync` crate specifically — the task brief asserted it; the underlying race is documented (FLAG).
- Browser churn: Firefox crash from a WebGPU spec change mid-2024 forced tracking wgpu from git and forking vello for texture integration (GraphiteEditor/Graphite#2027).
- Transform bugs: "Fix gradient render transforms with Vello" (GraphiteEditor/Graphite#2059); Vello itself documents the NaN/non-finite transform invariant: "NaN or large float values will drop nearly any scene down to 12fps" (https://github.com/linebender/vello/issues/470) — Graphite's workaround is to sanitize transforms at the boundary. Crafty already rejects non-finite viewport/transform values at the boundary (lib.rs `set_viewport`, wasm-boundary.md "Non-finite values are rejected at the boundary") — the same rule must extend to path data.
- Early integration missteps they reported: transforms wrong on first attempt, stroke-style translation bugs, UB breaking CI (catch_unwind sandboxing — trivial on native, "pretty hacky workaround" on wasm) (Graphite GSoC discussion https://github.com/GraphiteEditor/Graphite/discussions/1773).
- What they praise (implicitly, by direction): Vello became the *default* renderer and now gates new features (pixel preview). Servo's engineer: for their Canvas2D workload vello_cpu "actually performs better" than GPU vello given readback costs (servo/servo#38406) — a useful caution that GPU isn't automatically the right interactive path.

## 10. Alternatives ranking (given Crafty's constraints)

Ranked for: one coarse packet/frame, TS owns GPU, Rust encodes, paths alongside a working rect pipeline, glyphs later.

| Option | Maturity | AA quality | Integration effort vs Crafty's files | Glyphs later | Verdict |
|---|---|---|---|---|---|
| **(a) Vello embedded (wgpu)** | 0.9.x, breaking ~3×/yr; sparse-strips line unstable | Analytic area + MSAA8/16; production-grade | Highest: boundary ADR (GPU ownership moves for authored geometry), second GPU stack (wgpu beside TypeGPU), immediate-mode re-encode replaces the delta machinery | **Yes — glifo/skrifa, same pipeline** | **Recommended** |
| **(b) lyon CPU tessellation → existing TypeGPU rect pipeline** | lyon_tessellation 1.0.20 (2026-03-21), stable 1.0 since 2022 | MSAA-dependent (host must add sample counts/coverage) | Medium: lyon in the Rust encoder, new TS pipelines for fill mesh (+stencil or cover), tolerance-scaled tessellation per drag | No — lyon is not text | Strong alternative; fails the "done once" test |
| **(c) stencil-then-cover (DIY)** | n/a (build it) | MSAA-dependent, full-screen extra passes | High: new TS passes + stencil state; every feature after (gradients, images, clips) is new work | No | Weakest; only justified if (a)+(b) are ruled out |
| **(d) tiny-skia CPU raster** | 0.12.0 (2026-02-02), BSD-3-Clause, 400 dependents | Skia raster quality (the reference for "good") | Medium: Rust rasterizes into a buffer, TS uploads one texture; but CPU-bound and resolution-bound | No — text missing by design (tiny-skia issue #1) | Interim only; dead end for interactive GPU path; **inverts** the "Rust owns encoding, TS owns GPU" split the other way |
| **(e) analytic-AA fringes in WGSL** | n/a (build it) | Good for fills; strokes/joins/caps are the hard part (Vello itself uses MSAA there) | Low start (one new pipeline beside rects), compounding forever | No | Best incremental *start*; worst total cost to roadmap 3.3 + text |

**Recommendation: (a) Vello embedded** — staged so the boundary question is answered before the wgpu gamble (see §11 prototype step 3): phase A ships paths+strokes+gradients+glyphs on **vello_cpu** inside the existing WASM module (boundary untouched, headless export for free, no wgpu risk), phase B moves the interactive canvas to **vello classic/hybrid on wgpu** once (i) the Firefox-indirect-dispatch and (ii) the two-GPU-stack coexistence questions are answered on Crafty's actual fixtures. Both phases are the same imaging model and the same Scene-building code, so the roadmap's "work done once rather than twice" holds.

**The two strongest alternatives: (b) lyon** (if the constraint is "no pre-1.0 dependency and no wgpu on wasm, ever" — then pay CPU tessellation forever and solve AA once) and **(e) fringes** (if the constraint is "zero new Rust" — then pay bespoke pipelines forever). What would flip the decision to (b): a hard budget/cadence constraint (lyon is 1.0-stable, one dep, boundary-preserving) combined with a decision that glyph rasterization will be handled by a separate atlas path anyway (e.g. via an existing skia-canvas approach). What would flip it to (d): a product decision that the interactive canvas may be CPU-rastered at native resolution (e.g. if target browsers' WebGPU coverage is judged insufficient) — then tiny-skia beats vello_cpu on maturity and size, at the cost of no text, BSD-3 license, and no GPU escape hatch.

## 11. Integration sketch against Crafty's architecture

**What crosses the JS/WASM boundary today:** `set_scene(canonicalBytes, frameId, deltaJson)` → `render() → JSON RenderFrame` (draw-protocol v2: `commands: DrawCommand[]`), TS host merges retained map, encodes vertices, submits via TypeGPU (`webgpu-renderer.ts:132`).

**With Vello (CPU phase — boundary-preserving):**
1. `draw-protocol.ts`: bump to protocol v3; add `geometry: "path"` (plus, in the same change, optional `stroke`, and keep `"rect"` accepted forever as a fast path). The packet stays JSON-shaped and product-semantics-free; `(zIndex, order)` ordering unchanged.
2. `lib.rs`: `RendererCore` grows a Vello scene encoder — after the existing sort by `(zIndex, order)`, build `vello::Scene` (or `vello_encoding::Encoding` directly): rects via the rect fast path, paths via `scene.fill(Fill::NonZero|EvenOdd, Affine, solid-brush, None, &Path)`, strokes via `scene.stroke`. `render()` now also invokes `vello_cpu` (RenderContext::render to a pixmap) and returns `(packetJson, imageBytes, width, height)` — the first binary crossing; keep the JSON frame for diagnostics/evidence as today. Sanitize non-finite transforms/paths at the boundary (the #470 invariant).
3. TS host: authored content stops being vertex-encoded; instead one texture upload + one textured-quad draw in the existing scene submission layer, before overlays. `capacity-resource-cache` still applies (texture + quad buffer). The rect pipeline is *not* deleted — overlays (selection, grid, guides) stay rects in TypeGPU, and the parity/coexistence tests (§11 step 3) prove the two renderers agree before anything is removed.
4. Delta machinery: `changedNodeIds`/`mergeRetainedCommands` retire for authored geometry (nothing retained GPU-side anymore); keep full-rebuild semantics and the packetRevision/documentRevision sequencing intact.
5. Failure policy: same codes; add `VELLO_ENCODE_FAILED`/`VELLO_RENDER_FAILED`; "no fallback backend" (I32) holds — vello_cpu is *the* backend of the phase, not a fallback.

**GPU phase (wgpu embedding):** the authored scene renders via `Renderer::render_to_texture` into a texture owned by a wgpu device. The crux: **wgpu (Rust) cannot adopt Crafty's existing TypeGPU `GPUDevice`** — there is no wasm API to import a browser device into wgpu (unverified; flag) — and two devices on one adapter with two queues introduce cross-queue synchronization hazards reading Vello's output texture. The workable shape is: **wgpu owns the canvas context for the authored scene** (its own device, queue, texture); overlays — still computed TS-side from the packet — move into the same Scene as rect draws (overlays remain renderer state, never authored geometry; `withOverlays` output just travels in the packet); the TypeGPU host's canvas role shrinks to nothing. **That is an ADR-0003/0007 reversal for the canvas** ("TypeScript owns the GPU") and must be a deliberate, recorded decision with the existing boundary table (wasm-boundary.md "Stage placement") rewritten: Rust owns device+queue for the authored path because Vello's renderer IS the drawing stage; TS keeps device ownership only if Crafty stays on the vello_cpu phase. The wasm-bindgen surface grows from 5 methods to ~7 (`create_vello_renderer(device-like handles)`, `render_scene(...)`) — wgpu-on-wasm exposes `navigator.gpu` internally, so the surface is really `render_to_texture(scene) -> u32 texture-slot` plus init/teardown.

**Is "adding paths alongside rects" a trap?** In the CPU phase, no — it is the natural coexistence (rects degrade to a fast path inside Vello; overlays stay rects in TypeGPU; a texture-composite quad is the only new TS code). In the GPU phase, the trap is *two* GPU stacks forever: if Vello takes the canvas, keeping TypeGPU for overlays means two devices/two queues with a sync hazard at the composite — resolve it by moving overlays into the Scene (rect fast path) rather than keeping a parallel TS render pass.

**Cheapest de-risking prototype (in order):**
1. **Headless Rust test (hours, no browser):** encode Crafty's 10k-rect fixture and a bezier/self-intersecting fixture as `vello::Scene`; render with `vello_cpu`; compare against the existing software-reference hash; measure encode + render times on recorded hardware. Answers Q4/Q5/Q6 for the CPU path and produces the first real pixel-parity harness.
2. **wasm32 size build (1 day):** add vello_encoding + vello_cpu to the existing crate; record module size delta and encode cost; keep `bump_estimate` off (1.75–2.3× encode penalty, issue #541).
3. **Two-GPU-stack browser spike (2–3 days):** one page, Vello (wgpu) rendering the fixture into an offscreen texture while the existing TypeGPU host renders the same fixture beside it; verify per-frame ordering and init latency on Chrome/macOS/Safari; on Firefox-other-than-Windows, record what breaks. This is the decision gate for the boundary ADR.

## 12. Risks and the decision frame

1. **Pre-1.0 dependency with a breaking cadence (~3/yr).** Mitigations: pin exact versions, upgrade as an owned ritual with the parity harness from prototype 1; the classic `vello` line is the conservative choice (the sparse-strips CPU/hybrid line explicitly has no stability guarantees).
2. **Firefox (non-Windows) indirect-dispatch uncertainty** — the one browser-platform gap that could exclude a platform: verify current coverage before the GPU phase; vello_cpu phase is unaffected.
3. **Two GPU stacks / boundary reversal** — the ADR-3/7 question; decide deliberately; the composite sync hazard is the sharp edge.
4. **Immediate-mode re-encode** — the delta machinery dies; CPU encode + (optionally) bump-estimate cost per frame; measure on the 10k fixture before committing.
5. **NaN/non-finite invariants** — reject at the boundary (Crafty already does); #470 shows the failure mode.
6. **Load cost** — ~0.5–1 MB wasm + first-frame shader compile (up to ~1.5 s on Windows/Chrome in the wild, #936); measure init; consider `pipeline_cache` (RendererOptions supports it; the with_winit example persists a pipeline cache) and non-load-blocking init.
7. **Glifo is experimental** — text depends on it maturing; but the same is true of every text alternative Crafty would build itself.

**Decision frame:** adopt Vello. If the team's blast-radius discipline says "no pre-1.0 GPU deps this year", ship the vello_cpu phase first (it is also the headless/export path roadmap 4.4 wants) and keep the wgpu phase as the measured, ADR-gated step. The two alternatives that survive scrutiny are lyon (stable, but text-blind and CPU-tessellating) and analytic fringes (zero-dependency, but a permanent feature tax); both fail the roadmap's "which choice also serves glyph rasterization later" test.

## 13. Explicitly unverified / flagged

- A published vello 1.0 stabilization date: **none found** (only the sparse-strips roadmap Google Docs, which describe the CPU/hybrid line, not a 1.0 date for classic vello).
- Firefox's 2026 indirect-dispatch coverage outside Windows (MDN says FF141 Windows-only; Mozilla bug 1930756 says fixed in FF134; conflicting, unresolved here).
- That Graphite specifically uses the `wgpu-sync` crate (the underlying `Surface::configure` race is documented in wgpu#4214 and fixed in wgpu itself; wgpu-sync adoption by Graphite not confirmed).
- The exact end-to-end 60 fps drag cost for Vello on wasm/WebGPU (no published number; must be measured on Crafty's fixture; `vello_chart` exists for CPU-side comparisons).
- Whether wgpu can adopt an externally created `GPUDevice` on wasm (assumed impossible; no such API found).
- Exact vello_cpu fps on large scenes (claimed "competitive performance" in release notes; benchmark needed).
- Safari's current (2026-08) WebGPU maturity beyond MDN compat data (MDN: `dispatchWorkgroupsIndirect` in Safari 26; a 2025 report praised Safari TP performance).

## 14. Source list (fetched 2026-08-07)

- https://github.com/linebender/vello/releases ; https://crates.io/crates/vello ; https://github.com/linebender/vello/blob/main/CHANGELOG.md
- https://docs.rs/vello/latest/vello/struct.Renderer.html ; https://docs.rs/vello/latest/vello/struct.Scene.html ; https://docs.rs/vello/latest/vello/enum.AaConfig.html ; https://docs.rs/vello/latest/vello/struct.DrawGlyphs.html ; https://docs.rs/vello/latest/vello/util/struct.RenderContext.html
- https://docs.rs/vello_encoding/latest/vello_encoding/ ; https://docs.rs/vello_encoding/latest/vello_encoding/struct.Style.html ; https://docs.rs/vello_encoding/latest/vello_encoding/struct.Encoding.html
- https://github.com/linebender/vello/blob/main/doc/vision.md ; https://github.com/linebender/vello/pull/1754 (wgpu 30) ; https://github.com/linebender/vello/issues/541 (bump estimate) ; https://github.com/linebender/vello/issues/936 (GPU stall) ; https://github.com/linebender/vello/issues/470 (NaN transforms) ; https://github.com/linebender/vello/pull/999 (fine benches)
- https://linebender.org/blog/tmil-25/ ; https://laurenzv.github.io/vello_chart/ ; https://www.khronos.org/developers/linkto/vello-demonstration
- Graphite: https://github.com/GraphiteEditor/Graphite/pull/1802 , #1844 , #1845 , #2027 , #2059 , #3512 , #3847/#3881 , #3989 , https://github.com/GraphiteEditor/Graphite/discussions/1773
- Servo: https://github.com/servo/servo/pull/38406 ; CuTTY: https://crates.io/crates/cutty_terminal
- Browsers: https://developer.mozilla.org/en-US/docs/Web/API/GPUComputePassEncoder/dispatchWorkgroupsIndirect ; https://bugzilla.mozilla.org/show_bug.cgi?id=1930756 ; https://bugzilla.mozilla.org/show_bug.cgi?id=1888749 ; https://github.com/linebender/vello_svg/issues/80 , https://github.com/linebender/vello_svg/pull/81
- wgpu: https://crates.io/crates/wgpu ; https://github.com/gfx-rs/wgpu/issues/4214 ; https://github.com/gfx-rs/wgpu/issues/3103 (wasm sizes)
- Alternatives: https://crates.io/crates/lyon_tessellation ; https://crates.io/crates/tiny-skia ; https://docs.rs/lyon_tessellation/ ; https://github.com/nical/lyon
- Crafty context read: packages/scene-renderer/src/draw-protocol.ts ; packages/scene-renderer-wasm/src/lib.rs ; packages/scene-renderer-wasm/src/webgpu-renderer.ts ; docs/architecture/{renderer,wasm-boundary,scene-resolution,roadmap}.md ; docs/research/webgpu-typegpu.md
