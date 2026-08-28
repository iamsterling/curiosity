# CPU path tessellation & rasterization options for Crafty — research report

Date: 2026-08-07. Purpose: decide how Crafty's renderer (today: solid rects only,
`DrawGeometry = "rect"`) adds filled and stroked vector paths, with glyphs later
on the same pipeline. READ-ONLY research; all facts below carry sources, and
anything unverifiable is flagged explicitly.

## 1. lyon — the incumbent choice for CPU tessellation

### 1.1 Version and maintenance status

- `lyon_tessellation` **1.0.20**, published **2026-03-21** (crates.io API:
  `updated_at 2026-03-21T15:09:44Z`). Owner: `nical` (Nicolas Silva, Mozilla).
- `lyon_path` **1.0.19** (2026-03-08), `lyon_geom` **1.0.19** (2026-03-08),
  `lyon_algorithms` **1.0.20** (2026-05-03), umbrella `lyon` 1.0.19 (2026-03-08).
- GitHub: 2.6k stars, 155 forks, 1,640 commits; recent commit activity in 2026
  (bug fixes to the fill tessellator as late as 2026-03-21: "Don't merge nearby
  vertices in the fill tessellator when intersections are disabled", "Avoid some
  panics when tessellating a self-intersecting polygon with intersections
  disabled"). Nical is actively maintaining — **not** abandoned. Caveat: it is a
  one-maintainer project; release cadence is irregular but the last several
  releases are all within 2024–2026.
- License: **MIT OR Apache-2.0** (docs.rs, both crates). No GPL-style
  complications. (`lyon_svg`, a separate old crate, is 0.17.2 from 2021 — not
  relevant here.)
- `lyon_algorithms` is `#![no_std]` (lib.rs header); lyon_path/lyon_geom are
  no_std with optional alloc/std. WASM compatibility is fine — lyon is used in
  wasm contexts (e.g. bevy_prototype_lyon, Lavagna). The fill tessellator is
  f32-only math (Point = [f32;2] via lyon_geom), which is the right precision for
  tessellation output.

### 1.2 Sub-crate map

| Crate | Role |
|---|---|
| `lyon_geom` | Geometry primitives: points, vectors, boxes, transforms, bezier curves (cubic/quadratic), arc math, flattening helpers |
| `lyon_path` | Path storage (`Path`, `PathBuilder`), events (`PathEvent`/`IdEvent`), attributes, `Winding`, `LineCap`, `LineJoin`, `FillRule` |
| `lyon_tessellation` | `FillTessellator`, `StrokeTessellator`, `FillOptions`, `StrokeOptions`, geometry builders (`VertexBuffers`, `BuffersBuilder`) |
| `lyon_algorithms` | aabb, area, fit, hatching, hit_test, length, measure, raycast, rounded_polygon, walk, winding |

Notable: **there is no dash module in lyon_algorithms 1.0.20** (module list
confirmed from lib.rs: aabb, area, fit, hatching, hit_test, length, measure,
raycast, rect, rounded_polygon, walk, winding). Dashing must be implemented by
the consumer (lyon_path has the primitives — path length/measure/walk — to
build it, but lyon ships no dash iterator). [Source: crates.io API +
https://github.com/nical/lyon blob crates/algorithms/src/lib.rs]

### 1.3 Fill tessellator

- `FillTessellator` + `FillOptions`: `{ tolerance, fill_rule, sweep_orientation,
  handle_intersections }`.
- **Both fill rules**: `FillRule::EvenOdd` (the DEFAULT) and `FillRule::NonZero`
  — `FillOptions::even_odd()` / `non_zero()` constructors. So nonzero is
  supported. [Source: docs.rs FillOptions]
- **Self-intersections: yes, resolved in the tessellator itself.** Default
  `handle_intersections: true`; docs: "A fast path to avoid some expensive
  operations if the path is known to not have any self-intersections. Do not set
  this to false if the path may have intersecting edges else the tessellator may
  panic or produce incorrect results." The FillTessellator docs state
  "Self-intersections, for example, introduce a new vertex where two edges
  meet" — the tessellator computes exact edge-edge intersections (it is a
  sweep-line algorithm per the lyon wiki). [Sources: docs.rs FillOptions,
  docs.rs FillTessellator]
- Coincident vertices are merged; vertex source tracking (`VertexSource`, Edge
  {from, to, t}) and interpolated float attributes are available for gradient
  interpolation later (this is how you'd carry per-vertex UVs for gradients).
- Direct streaming: `FillTessellator::builder()` tessellates from a
  `PathBuilder` command stream without an intermediate path structure — ideal
  for feeding Crafty's canonical path data (subpaths + anchors) straight in.
- Flattening tolerance default 0.1 (max distance from true curve to polygon
  approximation).
- Sweep orientation Vertical default (horizontal available).
- Known robustness note: tessellator does not handle NaN inputs; a 2026 commit
  fixed "some panics when tessellating a self-intersecting polygon with
  intersections disabled" — i.e., the safe configuration for Crafty
  (handle_intersections=true) is the default and the most-tested path.

### 1.4 Stroke tessellator

- `StrokeTessellator` + `StrokeOptions`: `{ start_cap, end_cap, line_join,
  line_width, variable_line_width, miter_limit, tolerance }`.
- **Caps**: `LineCap::Butt | Square | Round` (SVG 1.1 + SVG2). **Joins**:
  `LineJoin::Miter | MiterClip | Round | Bevel` — includes SVG2's miter-clip,
  which design tools need (Figma defaults to something miter-like; miter-clip is
  the "safe miter"). [Sources: docs.rs LineCap, LineJoin]
- **Miter limit**: default 4.0, SVG-defined; minimum 1.0 enforced.
- **Variable width**: `variable_line_width` — a per-vertex attribute index that
  scales width per vertex (pressure/tapered strokes).
- **Dashing**: NOT in lyon (see 1.2).
- **Quality is the known weak point.** Nical himself (issue #891, 2024-01):
  "The stroke tessellator is a pretty naive algorithm that works with only some
  local information, so it has artifacts like that. For fully artifact-free
  stroking a different algorithm is needed (for example converting the stroke to
  a fill which is unfortunately much slower."
  - Issue #891: wrong results / protruding spikes when stroke width is much
    larger than segment length (short segments + wide strokes).
  - Issue #16 "Spikes when large line is used" (referenced by #891).
  - Self-overlapping (self-intersecting) strokes: the strip-of-triangles output
    **overlaps itself**, double-shading under transparency — documented in the
    StrokeTessellator doc comment itself: "if the path overlap with itself ...
    some triangles will overlap in the intersecting region ... the spec mandates
    that each point along a semi-transparent path is shaded once no matter how
    many times the path overlaps with itself". Same issue tracked downstream in
    ruffle-rs/ruffle#7565 (semi-transparent strokes rendered incorrectly).
  - **Stroke-to-fill conversion is NOT shipped in lyon.** Issue #564
    ("Stroke-to-fill conversion", 2020) and #644 (implement stroke tessellator
    on top of fill tessellator, 2021) are both still open/closed-as-duplicate —
    no production stroke-to-fill in lyon as of 1.0.20. Nical points to
    **tiny-skia-path** as having a good stroke-to-fill, and had a WIP in his
    personal `path_renderer` repo. There is a third-party crate
    `lyon_extra` (dev-dependency of lyon_tessellation) — its status is
    exploratory, not canonical (flag: not verified).
  - Practical mitigation used by real projects: split/avoid the pathological
    cases; most real-world strokes (segment length >> width) are fine.

### 1.5 no_std / wasm compatibility

- lyon_algorithms, lyon_path, lyon_geom are no_std (alloc). lyon_tessellation
  has optional serde; no std-only features known (flag: the tessellation crate's
  exact no_std posture was not verified line-by-line, but its only deps are
  float_next_after, lyon_path, num-traits — all no_std-able).
- No unsafe in lyon's core algorithms (per the project's style; not verified by
  audit — flag).

### 1.6 URLs

- https://crates.io/crates/lyon_tessellation (1.0.20, 2026-03-21)
- https://crates.io/crates/lyon_path (1.0.19, 2026-03-08)
- https://crates.io/crates/lyon_algorithms (1.0.20, 2026-05-03)
- https://github.com/nical/lyon (2.6k stars; active)
- https://docs.rs/lyon_tessellation/latest/lyon_tessellation/struct.FillOptions.html
- https://docs.rs/lyon_tessellation/latest/lyon_tessellation/struct.StrokeOptions.html
- https://github.com/nical/lyon/issues/891 (stroke artifacts)
- https://github.com/nical/lyon/issues/564 (stroke-to-fill, open)
- https://github.com/ruffle-rs/ruffle/issues/7565 (self-overlapping transparent strokes)

## 2. Antialiasing without a GPU-AA system

lyon ships no AA (FAQ: "There is currently no built-in support for antialiasing...
msaa, taa, fxaa"). What real projects do (2026):

1. **MSAA 4x on WebGPU — the dominant default.** Rerun's re_renderer states it
   plainly: "As of writing 4 samples is the only option (other than Off) that
   works with WebGPU, and it is guaranteed to be always available" (`MsaaMode`,
   re_renderer context.rs). WebGPU v1 pipelines support only sampleCount 1 or 4
   (webgpufundamentals MSAA lesson). MSAA 4x costs: 4× framebuffer memory for a
   multisample texture, one resolve pass, and on tiled mobile GPUs it is
   substantially more expensive than on desktop (rerun's ViewBuilder notes
   alpha-to-coverage and tonemapping interactions and that "this gets us onto a
   potentially much costlier rendering path, especially for tiling GPUs").
   Figma's WebGPU migration explicitly relies on MSAA ("MSAA: Multi-sample
   anti-aliasing without hacks" — kaelan.fyi research summary of Figma's
   rendering architecture). bevy default is MSAA 4x; bevy_prototype_lyon
   (lyon-in-bevy) renders with `Msaa::Sample4`. egui_wgpu defaults to MSAA off
   because epaint feathers; MSAA on is optional for 3D content.
2. **Analytic AA fringe geometry (feathering) — the egui/nanovg/femtovg route.**
   egui's epaint tessellator expands every edge by ~1 physical pixel and emits
   inner/outer vertices with alpha ramping to transparent, computed per-vertex
   on the CPU and interpolated per-pixel by the GPU ("feathering",
   `TessellationOptions`, epaint docs; default 1.0 px). nanovg does the same
   (inset path by 0.5px + 1px feather; but known artifacts when more than one
   path covers one pixel — coverage is not accumulated correctly, nanovg issue
   #415; the workaround is MSAA). femtovg (nanovg port) keeps `fringe_width`
   and feather params in its shader params (`params.rs`). This approach costs
   ~2× edge triangles and no extra render target, is resolution-adaptive per
   pixel ratio, and is what a self-contained UI stack (egui) ships to millions
   of users. Quality caveats: feathering uses a linear gradient approximation of
   coverage; overlapping edges double-dip; thin strokes (<1px) become gray.
3. **Supersampling** — render 2×/4× and downsample. Simple, correct, but
   fragment-shader-bound; webgpufundamentals describes it as the wasteful
   baseline. Not what production 2D tools use in 2026 except in offline
   renderers (e.g. stb_truetype's optional 2×2 glyph oversampling).
4. **Compute/analytic AA per-pixel (Slug, windfoil, Vello, Skia kComputeAnalyticAA).**
   2025-2026 is where the interesting work is: windfoil (texel-org, Matt
   DesLauriers, WebGPU WGSL) computes an exact box-filter winding integral per
   pixel in the fragment shader; it "beats Slug and Skia" on edge accuracy
   (~0.164/255 delta vs Skia), handles overlapping strokes for free, and
   benchmarks against Eric Lengyel's Slug reference. ThorVG (2026-01, issue
   #4093) is replacing its MSAA 4x with analytical AA specifically to improve
   low-power/mobile performance. Skia Graphite has an experimental
   `kComputeAnalyticAA` path strategy (compute-rasterized coverage masks).
   Vello's fine rasterizer is analytic (area of coverage) with an optional
   multisampled mode (`AaConfig::Msaa16` in its example). This is the
   "no extra passes, exact coverage" end of the spectrum, but it is the most
   shader/algorithm work.
5. **Verdict for Crafty:** MSAA 4x is guaranteed-available on WebGPU and is
   what shipping products (Figma, bevy, rerun) do; it makes lyon's triangles
   look correct with ~1 frame's worth of extra resolve cost. It cannot coexist
   with alpha-blended overlapping semi-transparent strokes correctly (MSAA
   averages samples; double-shaded stroke interiors still double-blend — the
   lyon stroke overlap problem survives MSAA). Feathering is the standard
   no-extra-pass alternative and pairs well with a design-tool aesthetic
   (crisp 1px hairlines need pixel-aligning anyway, as egui's stroke-kinds
   work shows).

## 3. Performance — CPU retessellation at 60fps

**Published lyon numbers:** There is a `bench/tess` suite in the lyon repo
(fill/stroke/flatten benchmarks on the lyon logo and GhostScript tiger), but
**no current, machine-citable absolute numbers in the repo docs** (bench output
is generated locally; the repo has no results table as of 2026 — flag:
no published figure found). The reliable qualitative anchors:

- Nical's 2019 post ("A new tessellator", lyon 0.15): the rewritten fill
  tessellator is "about 50% faster than libtess2 (industry standard) on the
  workloads I compared (mostly the Rust logo and GhostScript tiger)" — and
  roughly half of its time goes to self-intersection handling; tessellating the
  logo without curves is "more than twice as fast" than a flattened version
  (i.e. intersection handling dominates, flattening is cheap).
- The algorithm is a single-pass sweep-line, y-monotone decomposition, f32
  internally, with scan/update phases that recover from floating-point invalid
  states instead of panicking (0.15+ design).
- libtess2-class tessellators are known to handle a typical design-tool path
  (say 50–500 segments, mostly simple) in well under 1 ms on modern CPUs — but
  **that is an extrapolation from the relative claims above, not a published
  lyon number.** Flag explicitly.

**Is 60fps drag retessellation realistic? Yes, with the right architecture:**

- A bezier drag only mutates one node; Crafty's delta protocol already
  re-encodes only changed subtrees. Retessellating ONE path (hundreds of
  segments) per frame is far inside budget even with `handle_intersections`
  on; the pathological cases are dense scenes of many paths (10k+ nodes), not
  a drag. This is exactly how bevy_prototype_lyon/egui operate: egui
  retessellates its entire UI every frame and ships.
- The honest caveat: `FillTessellator` re-runs the full sweep on the whole
  path. There is **no incremental/retained tessellation** in lyon: the
  `TessellationResult` carries only stats + `geometry_id` (a convenience
  label), not a retained mesh you can patch (docs.rs TessellationResult; the
  geometry_id is for debugging/batching, not incrementalism). So the design
  must be: tessellate per changed path per frame (fine), and cache tessellation
  per (node, transform-affine-only-zoom) where possible. Since Crafty's
  transforms are affine and per-node, a path whose *geometry* is unchanged but
  whose view transform changed can reuse its node-local tessellation and
  re-transform on the GPU (CPU-side transform of a few thousand vertices is
  also cheap). Tolerance must scale with zoom: flattening tolerance is a
  distance in local units, so zooming in demands re-flattening at finer
  tolerance — the lyon wiki says exactly this ("When zooming in, the path
  should be re-tessellated in order to satisfy the same approximation threshold
  per device pixel"). Practical approach: tolerance ≈ 0.25 / zoom (or 1 screen
  px / zoom) per node.
- **Vello's paper gives a GPU-side datapoint**: entire Nehab 2020 stroking
  timings dataset < 1.5 ms on desktop GPUs, 3.48 ms on Mali-G78 (GPU stroke
  expansion). That's GPU, not CPU, but it brackets what "correct stroking" costs
  on modern hardware.

## 4. WASM size cost of lyon_tessellation

**No published figure found for wasm32-unknown-unknown lyon build sizes.** What
is verifiable: the crate itself is ~186 KB of source (rustio.net metric),
tarball ~60–90 KB; dependencies are tiny (float_next_after, num-traits,
lyon_path, lyon_geom — all pure Rust, no std-heavy deps, no unsafe-required
deps); feature flags `default = ["std"]`, optional `serialization` (serde),
`profiling`, `debugger`. By comparison, the existing Crafty encoder already
compiles serde+serde_json+wasm-bindgen; lyon_tessellation is a modest addition.
Order-of-magnitude expectation (ESTIMATE, not measured): roughly
100–250 KB wasm before gzip for lyon_tessellation+path+geom compiled `--release`
with wasm-opt, and much less gzipped (typical pure-Rust geometry code; the
crate's own "adds ~200 KiB to your binary" claim for tiny-skia's *entire*
rasterizer is a useful analog — tiny-skia README). Crafty should measure this
at integration time against its existing bundle budget; the encoding-side cost
is real but not decision-critical, and lyon's no_std posture means a
feature-gated std build could even shrink further (flag: not verified for the
tessellation crate itself).

## 5. Alternatives

### 5.1 kurbo (linebender) — path geometry + CPU stroke expansion
- **0.13.1** (2026-05-13), ~36M downloads; MIT/Apache-2.0; f64 math; the
  geometric foundation of Vello/peniko and of Raph Levien's work. Home:
  https://github.com/linebender/kurbo.
- `kurbo::stroke` / `stroke_with` (added 2023, issue #285 closed): CPU
  stroke-expansion into a `BezPath` (a fill outline of the stroke). Quality:
  "attempts a fairly high degree of correctness, but ultimately is based on
  computing parallel curves and adding joins and caps, rather than computing
  the rigorously correct parallel sweep (which requires evolutes)" (kurbo docs).
  Known gaps: self-intersection trimming of the expanded outline is explicitly
  out of scope (relies on the renderer handling it, e.g. via the fill
  tessellator's intersection handling); the pathological case "stroke width >
  2× circle radius" intentionally matches Skia's behavior rather than the
  mathematically-correct disc; performance is "pretty slow" (issue #317, open
  since 2023 — optimization deferred); variable width strokes not yet shipped
  (planned). **Production-ready for a design tool? Partially.** It is
  correctness-oriented and battle-tested inside Vello, but the output is a
  bezier outline that still needs filling, and it's not fast enough to call
  per-frame for many paths (issue #317). Fine as a fallback/offline stroker.
- The 2024 PACMCGIT paper "GPU-friendly Stroke Expansion" (Levien & Uguray,
  https://arxiv.org/abs/2405.00127) is the current state of the art for
  strokes: fully parallel GPU stroke expansion (Euler-spiral offsetting,
  caps/joins generated in compute), WebGPU-portable; Vello's stroke rework
  (vello issue #303) is the tracked plan to move kurbo CPU stroke expansion
  into compute; **as of vello 0.9 the compute-side rework status is not fully
  public — flag: stroke rework issue closed but no release note confirms
  shipped compute stroke expansion; assume strokes still go through CPU
  expansion + fill in current vello.**

### 5.2 tiny-skia — CPU rasterizer (Skia port)
- **0.12.0** (2026-02-02), ~40M downloads, stewarded by linebender (maintained
  by RazrFalcon + linebender org). ~14 KLOC, "adds around 200KiB to your
  binary", SIMD: SSE2/AVX on x86, NEON on ARM; 20–100% slower than Skia on
  x86-64, 100–300% slower on ARM (README; benchmark results page in repo).
  Works on wasm (resvg runs on WASM; also used in wasm examples).
- Scope: fills, strokes (incl. dashing), gradients, blend modes, clip, masks —
  a complete CPU rasterizer producing a pixel buffer. **No text rendering of
  its own** (resvg layers rustybuzz+ttf-parser+fontdb on top and rasterizes
  glyph outlines as paths).
- `tiny-skia-path` is the geometry-only subset and contains a **stroke-to-fill
  converter** that lyon's maintainer pointed to as "a good implementation"
  (lyon issue #564 comment; `tiny_skia_path::path_geometry::stroke_path`).
  tiny-skia's rasterizer itself uses analytic coverage (Skia-style) — no MSAA
  needed — and has a dedicated "high quality" pipeline.
- For Crafty: tiny-skia is the natural **offline/export rasterizer** (thumbnail
  generation, PNG/PDF export, server-side renders — roadmap 4.4 "headless
  render"), and its stroke-to-fill is a candidate for correct transparent
  strokes at export time. It is NOT the interactive canvas path: it writes
  pixels on the CPU, which is exactly what Crafty's architecture (Rust owns the
  packet, TS owns the GPU) deliberately avoids per-frame.

### 5.3 zeno, femtovg, path-tessellation, others
- **zeno** 0.3.3 (2025-05-08) — linebender's tessellation prototype
  (tessellator + clipping + AA); effectively superseded by Vello; no release
  in 15 months. Do not build on it. (Flag: "superseded" is my judgment from
  linebender trajectory — the repo is not archived, but development stopped.)
- **femtovg** 0.26.0 (2026-07-20, active) — nanovg port with OpenGL-ES and
  WGPU backends. Renderer model: CPU tessellation of beziers to polygons
  (nanovg's own tessellator), feathering AA in shader, **stencil-buffer for
  concave fills** (`CommandType::ConcaveFill`, `StencilStroke` in its wgpu
  renderer), even-odd/nonzero fill rules, gradients, text (glyph atlas from
  fontdb/ttf-parser? it uses stb-style atlas — has glyph textures + color
  fonts). This is the "batteries included but nanovg-quality" option: mature
  and actively maintained, but its AA is the known-imperfect feathering (nanovg
  #415), its fill path for concave shapes is stencil-based, and its tessellator
  is the nanovg one (not intersection-handling — nanovg relies on stencil for
  correctness of self-intersecting fills). Useful as a whole-scene renderer
  baseline; not a component for Crafty's packet pipeline.
- **path-tessellation** (adamnemecek) — tessellator + triangulation + SVG
  parsing (2021-era, effectively dormant). Not a 2026 option. (Flag: last
  release not re-verified this session.)
- **Vello** 0.9.0 (2026-05-15), alpha status per its own docs; 4.2k stars;
  WebGPU via wgpu (browser is "not a primary target"; Chrome-only testing;
  "WebGPU implementations are incomplete... you might run into issues").
  Vello CPU ("sparse strips") is broadly usable and benchmarks competitively
  (2nd after Blend2D on ARM in the Blend2D suite, TMIL-19/25). Vello Hybrid is
  "roughly beta quality" (2026 Q1 report). Verdict for Crafty: **Vello is the
  destination architecture for a compute-based renderer, not a dependency to
  add now** — it is alpha, brings its own full pipeline (fine raster,
  binning, layers) that conflicts with the ratified coarse-packet/TypeGPU
  boundary, and its WebGPU-on-the-web posture is weaker than Crafty's
  requirement. The *ideas* to harvest: analytic AA, GPU stroke expansion,
  Euler-spiral flattening.

### 5.4 Stencil-then-cover — current state
- Canonical form: NVIDIA's 2012 SIGGRAPH paper (Kilgard & Bolz), productized
  as GL NV_path_rendering, shipped inside Adobe Illustrator (2–6× faster than
  CPU at FHD; 5–16× at UHD — 2014 paper). Also the classic OpenGL red-book
  technique. Modern status:
  - **Skia Graphite still ships it**: `kTessellation` strategy = "paths are
    rendered using tessellation and the classic stencil-and-cover algorithm
    w/ MSAA" (RendererProvider.h, current). It coexists with CPU-atlas,
    compute-analytic-AA, and SparseStrips strategies.
  - **Flutter/Impeller** is actively migrating toward it (issue #123671):
    libtess2 CPU tessellation is the current bottleneck ("tessellation can
    easily account for >50% of CPU time"; "libtess2 is not parallelizable");
    STC is "trivially parallelizable"; the blocker was stencil-buffer
    contention with the clip stack, unblocked by clip replay (flutter#137448);
    **nonZero winding is the hard case** — "evenOdd is trivial... a workable
    solution to cancel out parts of the geometry fan outside the path isn't
    obvious" for nonZero. STC landed experimentally behind a constexpr flag
    (flutter engine PR #50817).
  - Correctness: even-odd and non-zero (with stencil counting/tricks),
    self-intersections handled by stencil winding — the GPU does the
    intersection work implicitly via the stencil buffer, which is the appeal
    (zero CPU tessellation). Costs: 2–3 passes per path (stencil pass + cover
    pass), stencil framebuffer memory, an extra framebuffer op per path, and
    **AA is MSAA-only or per-sample shader tricks** (Kilgard's polar stroking
    uses gl_SampleMask; WebGPU exposes sample_mask so it's portable). lyon's
    wiki assessment: "requires a lot more memory accesses and render target
    switches... hard to implement any anti-aliasing other than msaa."
  - Verdict: STC wins when CPU tessellation is the bottleneck (huge
    uneditable scenes, CAD). For a design tool with per-path editing, it is
    harder to reason about and to make pixel-perfect, and WebGPU stencil +
    MSAA interplay with Crafty's existing rect pipeline and overlays would
    need its own pass structure. It is a legitimate long-term architecture but
    the wrong first step here.

## 6. Strokes — where caps/joins/dashes get computed

- **CPU stroke expansion (lyon StrokeTessellator)**: strip-of-triangles along
  the path; caps/joins/miter-limit/variable-width computed per-vertex on the
  CPU. Fast, but naive: known spikes when width >> segment length (issues #16,
  #891), and self-overlapping strokes double-blend under alpha (documented in
  StrokeTessellator docs; ruffle#7565). Design tools render semi-transparent
  strokes all the time, so this is a real quality limit. **Dashing is not in
  lyon** — you'd dash the path (via lyon_path measure/walk) before stroking.
- **Stroke-to-fill (CPU)**: expand the stroke into a filled outline (kurbo's
  `stroke`, tiny-skia-path's converter), then fill with nonzero fill rule —
  the fill tessellator's intersection handling makes overlaps correct.
  Quality: best-in-class correctness; cost: noticeably slower (Nical: "much
  slower"; kurbo issue #317 tracks performance). Design-tool pattern:
  **use the naive stroker during drag previews, stroke-to-fill for final
  render** (or a tolerance-gated quality switch).
- **GPU-side stroke expansion (Vello / Levien-Uguray 2024)**: strokes computed
  in compute shaders from path soup; caps/joins/parallel curves via Euler
  spirals; dashing on CPU (paper does CPU dashing; issue #303 says "dashing
  will be computed during encoding"). This is the 2026 state of the art; not
  yet a shippable dependency for Crafty (Vello alpha), but the paper is
  portable and the algorithm is public.
- **What design tools actually need**: SVG-grade joins (miter, miter-clip,
  round, bevel), caps (butt/square/round), miter limit (SVG default 4),
  variable width (pressure), dashes with exact on/off phase at caps, correct
  semi-transparent self-overlap, and hairline (0.5–1px) strokes that stay
  crisp — that last one is a pixel-alignment + AA problem (egui PR #4943's
  stroke-kind outside/middle/inside and pixel-grid alignment is the model
  lesson), not a tessellation problem.

## 7. Glyphs later — which options double-duty as a glyph path

- **lyon as glyph pipeline: yes, direct.** TrueType glyph outlines are
  quadratic beziers, CFF/CFF2 are cubic — both are lyon_path/lyon_geom native.
  The established stack is ttf-parser (or skrifa, linebender's modern parser,
  0.45.1, 2026-07-23) → outline builder → lyon flatten+tessellate → triangle
  mesh (string2path R package does exactly ttf-parser + lyon; vectortext demo
  does rusttype + lyon). Zero new concepts: glyph fill = path fill, glyph
  stroke = path stroke, AA = same MSAA/feather as everything else. If Crafty
  goes tessellation, glyphs ride the same pipeline for free (this is the
  roadmap's stated question and it answers "yes"). Caveat: small font sizes
  need hinting for quality; neither lyon nor tessellation-on-GPU does hinting —
  Figma/Sketch render unhinted glyphs and look fine on HiDPI, but low-DPI
  small text is where a glyph-atlas-with-hinting (e.g. a fontdue/FreeType-style
  rasterizer) beats vector text. Crafty's roadmap 3.1 already plans a glyph
  atlas; the tessellation pipeline then covers the "vector text at large
  sizes" case and the atlas covers small sizes.
- **tiny-skia**: rasterizes glyph outlines (as paths) into the pixel buffer —
  good for export/thumbnails; no hinting pipeline; not for the canvas.
- **Stencil-then-cover / analytic coverage**: classic font renderers
  (FreeType, Skia) use **analytic per-pixel coverage** of the outline — the
  same math as the Slug/windfoil/Vello fine raster and the same math as
  MSAA's coverage sampling at 4 positions. STC with MSAA is exactly "rasterize
  the glyph outline once into coverage, shade once" — so yes, stencil-and-cover
  is structurally the font-rendering approach (NV_path_rendering was famous for
  this). But the better glyph answer is the same as the fill answer: any
  coverage-based rasterization (MSAA on triangles, or analytic) serves glyphs;
  tessellating glyph outlines per-frame is only viable for large text
  (the lyon wiki: "for very small paths — most text in web pages — tessellation
  is probably not the best trade-off, since generating the tessellation may
  take as long as rasterizing the shape").
- **Bottom line for glyphs**: choose the fill path and glyphs inherit it.
  The glyph-specific additions (shaping, hinting, atlas caching) are
  orthogonal to the fill-tessellation choice.

## 8. Comparison table

Ratings are directional (Low/Med/High), grounded in the sections above.

| Criterion | lyon fill (CPU tess) | lyon stroke (CPU tess) | kurbo::stroke + fill | tiny-skia (CPU raster) | Vello (GPU compute) | Stencil-then-cover (GPU) |
|---|---|---|---|---|---|---|
| Version / status (2026-08) | 1.0.20, active | same | 0.13.1, active | 0.12.0, active | 0.9.0, **alpha** | Skia Graphite ships it; Impeller experimental |
| AA quality | none built-in; MSAA4 (guaranteed on WebGPU) or feathering | same | same | analytic coverage (Skia-grade) | analytic + MSAA16 option | MSAA-only (or sample_mask tricks) |
| Fill-rule correctness | both nonzero + evenodd, exact intersections | n/a | n/a (output is a fill) | nonzero + evenodd | both | evenodd trivial; **nonzero hard** (Impeller) |
| Self-intersections | resolved in tessellator (handle_intersections default on) | **overlap double-blends** under alpha; spikes at short segs | handled downstream by fill; expansion itself out of scope for trimming | handled | handled (coverage) | handled via stencil winding |
| Stroke quality | n/a | Med — known artifacts (issues #16, #891); no dash | High correctness; slow (issue #317); no variable width yet | High (incl. dash, stroke-to-fill) | High (paper; compute expansion) | High but pass-heavy |
| Dynamic-geometry cost @60fps drag | Low for single path; full re-tess per path; no incremental API | Low (fast naive strip) | High (slow) | n/a for canvas | Low on GPU; needs whole pipeline | Low (no CPU tess) |
| WASM size | ~100–250 KB est. (no published figure) | same | small (f64 geom) | ~200 KiB claim; whole rasterizer | large (whole engine) | n/a (TS/GPU) |
| Maturity/risk | High (9+ yr stable, 500 deps, fuzzed, 2026 fixes) | High (but quality ceiling documented) | Med-High | High | **Low-Med** (alpha, web not primary target) | Med (engine-internal; hard to adopt piecemeal) |
| Glyph reuse | direct (TTF quads / OTF cubics are lyon-native) | same | same | rasterizes outlines; no hinting | full text pipeline (glifo) | classic coverage model |

## 9. Integration with Crafty's actual pipeline

Crafty's pipeline: JS/kernel → JSON scene + delta → Rust `RendererCore` encoder
→ JSON `RenderFrame` (v2) → TypeGPU host (retained commands, capacity buffers,
submission layers) → WebGPU. `DrawGeometry = "rect"` today; the renderer docs
say adding geometry = new `DrawGeometry` variant + Rust encoder branch + host
pipeline + parity tests, and the packet never carries product semantics.

- **lyon (fill + stroke tessellation) — fits the ratified architecture with
  minimal disturbance.** The encoder stays the only producer: `RendererCore`
  gains a per-command geometry payload (`{"geometry":"path","tess":[...]}` or a
  binary blob); lyon runs inside the existing Rust crate; output is a plain
  index+vertex pair per node. The TypeGPU host needs: (1) a triangle mesh
  submission layer with its own vertex layout (position + uv + coverage if
  feathering, else position only), (2) per-node mesh buffers keyed by nodeId in
  the capacity-resource-cache pattern, (3) retention semantics for mesh
  buffers in `mergeRetainedCommands` (drop meshes of removed nodes; the
  `changedNodeIds` mechanism extends naturally — a node's mesh buffer key is
  its nodeId), (4) one new pipeline with `multisample.count=4` for the MSAA
  resolve (WebGPU mandates 4 or 1; everything in the same render pass must
  agree, so the rect pipeline either also becomes MSAA 4x or paths render into
  the same multisample target — simplest: make the whole scene pass 4x, as
  bevy/rerun/figma do). No compute shaders, no new render target beyond the
  multisample texture, no per-shape JS/WASM crossings: the coarse boundary
  holds. Feathering (egui-style) is an alternative that needs no multisample
  target at all — decide when the MSAA-vs-memory trade is measured.
- **kurbo** integrates exactly like lyon (it is also a Rust-side producer of
  geometry) — it just can't be the per-frame stroker, only the
  quality-stroke/offline path, so it slots in as an alternate stroke encoder
  branch, not a pipeline change.
- **tiny-skia** does NOT feed the GPU pipeline; it is a parallel CPU
  rasterizer — for Crafty it's the export/thumbnail backend (roadmap 4.4),
  sharing the same Rust encoder crate but producing pixels, not packets.
- **Vello** would replace the renderer, not extend it: it brings its own
  scene encoding, compute pipeline, binning, layers and AA; the ratified
  "Rust encodes packet / TS owns GPU via TypeGPU" boundary and the
  `scene-renderer`/`scene-renderer-wasm` split would be absorbed. That is an
  ADR-scale reversal, only justified when Vello exits alpha and its web story
  matures.
- **Stencil-then-cover** needs its own pass structure (stencil-only pass per
  path, cover pass, stencil buffer attachment, `sample_mask` handling for AA)
  and fights the current single-submission-layer host; also the nonZero
  problem. Not the first step.

## 10. Recommendation

**Fill: use lyon (`lyon_tessellation` 1.0.20) in the existing Rust encoder,
rendered as triangles through the existing TypeGPU host, with MSAA 4x as the
AA layer.**

- Both fill rules, self-intersections resolved in-tessellator (the default and
  most-tested configuration), holes, coincident-vertex merging, per-vertex
  interpolated attributes (ready for gradient UVs in roadmap 3.3), direct
  streaming from Crafty's canonical subpath/anchor data via
  `FillTessellator::builder()` (no intermediate path storage), MIT/Apache-2.0,
  actively maintained (releases in March/May 2026), fuzzed robustness, and
  glyphs later ride the identical pipeline (TTF/OTF outlines are lyon-native
  quadratics/cubics). It is the only option that fits the ratified coarse
  boundary without re-architecting. Per-frame cost during a bezier drag is one
  path's retessellation — comfortably inside budget; cache tessellation per
  nodeId and scale flattening tolerance with zoom (≈ 1 screen px / zoom).
- **The tradeoff that would flip it:** if measurement shows MSAA 4x
  unacceptable on target hardware (memory/bandwidth on tiled mobile GPUs) and
  feathering quality is insufficient for a design tool, then the flip is toward
  analytic per-pixel coverage (windfoil/Slug-style or the Vello fine raster) —
  which argues for waiting on Vello rather than building the analytic shader
  by hand. If WASM size becomes the binding constraint against a tight budget,
  the same lyon choice still wins (it is replaceable later without touching
  the protocol: tessellation is an encoder-internal detail).
- **Separately, AA**: MSAA 4x is the guaranteed-available, shipped-by-Figma
  default on WebGPU. Ship MSAA 4x first (one multisample target + resolve, all
  pipelines at count 4), keep egui-style feathering as the documented
  no-multisample alternative if mobile costs bite, and treat analytic coverage
  as the long-term quality ceiling. Do not attempt analytic AA in the first
  iteration.

**Strokes: two-stage — lyon's `StrokeTessellator` during interaction, and
stroke-to-fill for final quality; dashes computed upstream of the stroker.**

- Interaction (drag previews at 60fps): lyon's naive strip stroker — fast,
  and its known artifacts (width >> segment length spikes, alpha
  double-blending on self-overlap) are acceptable while moving; Figma-quality
  still needs the second stage.
- Final render / export: expand the stroke to a fill outline and run it
  through the fill path with nonzero rule. Lyon itself does NOT ship
  stroke-to-fill (issue #564 open) — implement or vend the algorithm from
  tiny-skia-path (MIT-licensed, pointed at by lyon's maintainer as the good
  implementation) or kurbo's `stroke` (f64, slow, correct). This gives
  correct transparent self-overlap, miter/miter-clip/round/bevel joins, all
  caps, and miter-limit handling (lyon's StrokeOptions already carries
  miter_clip and variable width).
- Dashing: lyon has no dash; dash the path before stroking using lyon_path
  measure/walk (or at encode time in Crafty, which is what Vello does —
  dashing at encoding, not in the rasterizer).
- **The tradeoff that would flip strokes:** if a single correct stroker is
  required from day one at interactive rates (e.g. semi-transparent stroke
  opacity is a launch criterion during editing), the flip is to implementing
  the Levien–Uguray GPU stroke expansion (paper-published, portable to WGSL)
  — a much larger project, and the reason to wait for Vello's compute stroke
  rework to land and stabilize rather than build it in-house.

**Do not adopt now:** Vello (alpha; web secondary; would replace the ratified
boundary), stencil-then-cover (nonZero problem + pass restructuring; Impeller
itself hasn't shipped it), zeno (dormant), path-tessellation (dormant).
femtovg is a credible whole-scene alternative but its feathering + stencil
model is strictly worse for a design tool than lyon + MSAA.

**The glyph answer:** tessellation serves glyphs directly (large text); a
hinting-capable atlas rasterizer serves small text (roadmap 3.1 already
anticipates the atlas). No glyph-specific rasterization decision is forced by
the fill choice.

## 11. Honest uncertainty ledger

- No published absolute lyon benchmark numbers (paths/sec or ms) were found
  for 2024–2026; the "well under 1 ms for typical design paths" claim is an
  extrapolation from the 2019 blog's relative claims, not a measured figure.
- No published wasm32 size figure for lyon exists; the 100–250 KB estimate is
  an order-of-magnitude estimate, not a measurement. Crafty should measure at
  integration time.
- Whether Vello 0.9 ships GPU-side stroke expansion is unconfirmed from
  release notes; the stroke-rework issue is closed but no changelog line
  explicitly confirms compute expansion. Assume CPU `kurbo::stroke` until
  proven otherwise.
- lyon_tessellation's exact no_std posture was not verified line-by-line
  (only lyon_algorithms was confirmed `#![no_std]`); its dependency list
  (float_next_after, lyon_path, num-traits) is no_std-compatible.
- Vello "supersedes zeno" is an inference from linebender's public trajectory,
  not a statement in either repo.
- MSAA-4x-always-available on WebGPU is a strong secondary-source claim from
  Rerun's renderer code ("guaranteed to be always available") and
  webgpufundamentals (only 1 or 4); it was not re-verified against the W3C
  spec text this session, though it matches the spec's sampler-count
  constraints as commonly reported.
