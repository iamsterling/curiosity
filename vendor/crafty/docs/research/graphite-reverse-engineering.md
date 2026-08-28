# Graphite research for Crafty's vector-path decision

Research performed 2026-08-07 against a Graphite clone at
`/private/tmp/claude-501/-Volumes-dev-crafty/3aeeb8f7-4450-449d-af04-1039a5914906/scratchpad/Graphite`
(latest commit `4b01abe36d30cd97fc9d7e3979a71bd8f723651c`, dated 2026-08-06, so
the clone is *current*), the Graphite blog archive, a Developer Voices podcast
transcript (Dec 2024), and GitHub PR/issues via search. All file:line citations
are into the clone unless a URL is given.

---

## 1. The rendering path, precisely

### What rasterizes paths in the browser today (Aug 2026)

Two complete rendering pipelines coexist, chosen per render request:

- **Vello over wgpu/WebGPU** — the live viewport path when a GPU is available.
- **SVG DOM** — the fallback, and still the *display medium for both modes*.

**The dual-implementation tax.** The `Render` trait requires every graphic type
to implement BOTH a DOM-ish SVG serialiser and a Vello encoder:

- `Render::render_svg(&self, render: &mut SvgRender, render_params: &RenderParams)` — `node-graph/libraries/rendering/src/renderer.rs:634`
- `Render::render_to_vello(&self, scene: &mut Scene, transform: DAffine2, context: &mut RenderContext, _render_params: &RenderParams)` — `renderer.rs:636`
- Dispatch by variant for both (`renderer.rs:660-683`).
- Selection of output at the node level: `render_intermediate` matches
  `render_params.render_output_type { Vello | Svg }` and calls the respective
  method — `node-graph/nodes/gstd/src/render_node.rs:51-73`.
- `RenderOutputType` enum (`renderer.rs:204-209`): `Svg` is `#[default]`;
  `RenderParams.render_output_type` is a field (`renderer.rs:218`).

**Where the choice is made.** The runtime decides per execution, not at build
time — `editor/src/node_graph_executor/runtime.rs:232-238`:

```rust
// We may want to render via the SVG pipeline even though raster was requested,
// if SVG Preview render mode is active or WebGPU/Vello is unavailable
if render_config.export_format == ExportFormat::Raster
    && (render_config.render_mode == RenderMode::SvgPreview
        || self.editor_api.application_io.as_ref().unwrap().gpu_executor().is_none())
{
    render_config.export_format = ExportFormat::Svg;
}
```

So: **when the wgpu executor could not be constructed (no WebGPU), the whole
document is re-serialised to SVG and handed to the browser's SVG rasteriser** —
a completely separate code path that must track the Vello path's correctness.
There is no vello CPU fallback in the live path: `WgpuExecutor::with_context`
builds the vello `Renderer` with `use_cpu: false` and returns `None` on any
failure — `node-graph/libraries/wgpu-executor/src/lib.rs:122-133`. (Vello does
offer a CPU backend; Graphite does not use it on the viewport path.)

**The frontend.** `frontend/src/components/panels/Document.svelte`:

- The artwork element is literally an SVG element populated with an HTML string:
  `{#if !$appWindow.viewportHolePunch}<svg class="artboards" style:width={canvasWidthCSS} style:height={canvasHeightCSS}>{@html artworkSvg}</svg>{/if}` — `Document.svelte:700-704`.
- Even in Vello mode, the *transport* to the frontend is still an SVG wrapper:
  the executor presents the vello output into a hidden offscreen canvas
  registered on `window.imageCanvases`, and the Rust side emits a small SVG
  containing `<foreignObject><div data-canvas-placeholder="..."></div></foreignObject>` — `editor/src/node_graph_executor.rs:662-680` (the `CanvasFrame` arm,
  `node_graph_executor.rs:680-687`). The Svelte component then swaps the
  placeholder for the real canvas element (`Document.svelte:184-222`).
- Pure-SVG mode sends the entire artwork SVG: `FrontendMessage::UpdateDocumentArtwork { svg }` (`node_graph_executor.rs:664-675`).
- The "Initializing Renderer…" overlay exists precisely because on web the
  first Vello frame may be late (`Document.svelte:57-59, 721-723`).

**The web Vello path, end to end:**

1. `render_intermediate` builds `vello::Scene` (`render_node.rs:53-59`).
2. `render` node appends the scene under the viewport transform, applies the
   non-finite-transform fixup, and calls
   `executor.render_vello_scene(...)` — `render_node.rs:112-142`.
3. `WgpuExecutor::render_vello_scene` renders into an offscreen texture of
   `size` pixels with `AaConfig::Msaa16`, serialised behind a `Mutex<Renderer>`
   and a wgpu-sync queue read guard — `wgpu-executor/src/lib.rs:70-106`.
4. `CanvasSurface::present` blits the texture to a wgpu `Surface` backed by a
   hidden HTML canvas (created via `web_sys`/`wasm_bindgen` and kept alive on
   `window.imageCanvases`), configuring the surface on EVERY present —
   `node-graph/libraries/canvas-utils/src/wasm.rs:87-141` (configure at
   `wasm.rs:104-116`; `Rgba8Unorm`, `present_mode: surface_caps.present_modes[0]`,
   `desired_maximum_frame_latency: 2`, full-width blit `wasm.rs:123-137`).
5. Frontend splices the canvas into the DOM inside the svg/foreignObject
   wrapper (see above).

Note: the entire artwork is rasterised at viewport resolution and copied as one
texture per frame; there is no retained geometry, no per-node caching on the
GPU side in this path (the Rust `node_graph_executor` does cache at the node
level upstream, see §4).

**Desktop (native) divergence.** The desktop app is CEF (Chromium Embedded
Framework) with a **hole-punch**: the DOM viewport region is punched out of the
CEF window (`viewportHolePunch` in `Document.svelte:692-693, 700-704`) and the
native host renders into the window. The editor process pushes RGBA frames
(software shared memory, or an accelerated texture plane on win/linux/mac —
`desktop/ui/src/frames/receive.rs:92-131`, `desktop/ui/src/frames/surface.rs`)
to the host, which uploads them into a wgpu texture (`surface.rs:28-80`). The
editor side is compiled for native via `frontend/wrapper` with `native`
feature — `frontend/wrapper/Cargo.toml` (features `web`/`gpu`/`native`).

### Was SVG the primary path for years? What were the consequences?

**Yes.** Vello integration landed only in Q3 2024 as Dennis Kobert's GSoC
project, and it was *opt-in* via Preferences:

> "Alternate render engine using Vello that brings increased code simplicity
> and performance (especially with raster layers), but currently only works in
> browsers with WebGPU support and must be enabled via File > Preferences"
> — Graphite progress report Q3 2024 (blog, 2024-10-15), PRs #1802, #1865,
> #1844, #1871, #1874, #1875, #1899, #1905, #1900, #1907, #1902, #1897, #1915, #1996.

Year-in-review 2024 (blog, 2025-01-16):

> "he integrated the Vello high-performance vector graphics renderer to replace
> our SVG-based rendering method. ... Vello can be turned on from the editor
> preferences menu and will be enabled by default later in 2025 when browser
> support for the WebGPU API, which Vello relies on, becomes widespread."

The 2023 look-back lists for 2024: "Deploying GPU-based rendering by default
and moving from an experimental to a production-ready hardware-accelerated
compositing system using Vello".

As of the clone (Aug 2026) the *default* for a normal browser session is still
the Vello texture path only when `gpu_executor()` is `Some`; `SvgPreview`
render mode (a user-facing RenderMode option, `vector/style.rs:427`,
toggled at `document_message_handler.rs:3321-3343`) still forces SVG. The
SVG machinery is kept alive by: SVG Preview mode, the no-GPU fallback, SVG
export (`ExportFormat::Svg` → SVG output in `render_node.rs:160-163`), and
thumbnails.

**Consequences observed in the archive and source:**

- Every graphic node carries two full rendering implementations that must stay
  in lockstep (fills, strokes, masks, gradients with different clear-spread
  semantics — see `ClearGuardPlacement::SvgStopOrder` vs
  `VelloRampTexels`, `renderer.rs:403-412`, and the gradient-placement
  divergence `renderer.rs:378-395`). The comments document *renderer-specific
  behaviour differences* (SVG stop-order guards vs Vello ramp-texel guards;
  linear gradient shear handling) — a permanent correctness tax.
- SVG output is produced by string-building with indent tracking
  (`SvgRender`/`SvgSegment`, `renderer.rs:69-197`) — hand-serialised XML,
  including `image_data` maps so the frontend can inject raster data.
- Perf: the Vello work was motivated by performance; before it, "working in
  Graphite was too slow for practical usability" (year-in-review 2024, on
  Dennis's GSoC contributions). The 2024 review also says Alpha 3 "brought the
  formerly abysmal performance up to now-adequate levels".
- FireFox crashed with Vello after a WebGPU spec change until deps were
  updated ("Update of Wasm dependencies to fix a crash in Firefox with Vello
  due to a WebGPU spec change", Q4 2024 report, #2027).

### Vello/wgpu integration details

- **Version pins** (workspace `Cargo.toml`): `wgpu = 29.0` (`Cargo.toml:135-140`,
  with `fragile-send-sync-non-atomic-wasm`, `spirv`, `strict_asserts`),
  `kurbo = 0.13` (`Cargo.toml:168`), `vello = "0.9"`, `vello_encoding = "0.9"`
  (`Cargo.toml:169-170`), `parley = "0.9"` / `skrifa = "0.42"` (`Cargo.toml:174-175`),
  `resvg/usvg = "0.47"` (`Cargo.toml:171-172`), `linesweeper = "0.4"` (`Cargo.toml:236`),
  `polycool = "0.4"` (`Cargo.toml:176`).
- **Wasm GPU setup**: wgpu's own WebGPU backend is used; the wasm build of the
  context does `request_adapter` with `PowerPreference::HighPerformance`,
  `compatible_surface: None`, `force_fallback_adapter: false`, then
  `request_device` with the adapter's full limits — `wgpu-executor/src/context.rs:70-105`
  (`#[cfg(target_family = "wasm")]` split from the native adapter-enumeration
  path, `context.rs:45-69`). No `web_sys::Gpu` calls are hand-written; wgpu
  owns the browser WebGPU binding (the crate is `web-sys`-adjacent only via
  canvas-utils for the surface target).
- **The `wgpu-sync` crate** (`libraries/wgpu-sync/src/lib.rs`) exists because:
  "`wgpu::Surface::configure` recreates the swapchain and waits for the GPU to
  idle. A concurrent `submit`, `get_current_texture`, or `present` makes that
  wait fail (validation error, panic, or driver crash on the unsafe hal
  usage)." (`lib.rs:5-7`). It wraps `Instance`/`Adapter`/`Queue`/`Surface` with
  a shared `RwLock`: `configure` takes the write lock, everything else a read
  lock; guards hold their read lock for their lifetime
  (`lib.rs:37-206`). Graphite's render tasks run concurrently on the executor,
  and the surface is configured on every `present()` (canvas-utils
  `wasm.rs:104`), so this crate is load-bearing — the executor renders to
  offscreen textures in parallel while the presenter re-configures the surface.
- **Workarounds baked into the renderer:**
  - Non-finite gradient transforms: `render_node.rs:120-133` — `scene.append`
    composes `Affine::scale(INFINITY)` (used for full-viewport gradient fills)
    with the viewport rotation, producing `±INFINITY` (and the old equality
    check missed negative infinity); the fix scans every transform in the
    encoding and replaces non-finite ones with a finite viewport-covering
    scale. Comment cites xi.zulipchat vello thread near/538435044.
  - Vello linear gradients cannot express shear: `gradient_placement`,
    `renderer.rs:378-395` — radial keeps the full matrix (ellipse), linear is
    reduced to a non-sheared gradient line.
  - Vello's ramp bake has 512 texels (`VELLO_GRADIENT_RAMP_TEXELS`,
    `renderer.rs:397-398`) and its pad-extension samples the outermost texel,
    so `Clear` spread needs guard stops that own the outermost ramp texel
    (`ClearGuardPlacement::VelloRampTexels`, `renderer.rs:403-412`), costing
    ~0.4% of ramp colour resolution.
  - Vello "ignores the first stop's position and always treats it as 0":
    `renderer.rs:473` comment.
  - AaConfig::Msaa16 fixed antialiasing (`wgpu-executor/src/lib.rs:81`).
- **Texture pool**: 256 MiB texture cache with reuse
  (`wgpu-executor/src/lib.rs:33`, `texture_cache.rs`); the vello `Renderer`
  itself is behind a `Mutex` (single renderer, serialised).
- **GPU-accelerated raster nodes** use rust-gpu-style shader compilation into
  compute shaders (`shader_runtime/` in wgpu-executor; `ShaderRuntime::new`
  `lib.rs:137`) — separate from Vello.

---

## 2. Geometry / editing model

### The document: a node graph, not a document tree

Graphite's authored state is a Graphene node graph: every layer is a node
(Path, Rect, Text, ...), and **edits are expressed by mutating node inputs**.
There is no document-command/undo model in Crafty's sense; history operates on
graph mutations (`document_history.rs`). Vector geometry specifically lives in
the **Path node**, whose second input is a mutable `VectorModification` record
that accumulates *delta layers*:

- `network_interface.vector_modify(&node_id, modification_type)` mutates the
  node's input value in place, appending the modification — `editor/src/messages/portfolio/document/utility_types/network_interface/mutations.rs:89-104`.
- Each `GraphOperationMessage::Vector { layer, modification_type }` →
  `ModifyInputsContext::vector_modify` → `RunDocumentGraph`
  (`graph_operation/utility_types.rs:941-948`).

### The vector data model: three columnar domains

`Vector { stroke: Option<Stroke>, colinear_manipulators: Vec<[HandleId; 2]>, point_domain, segment_domain, region_domain }`
— `node-graph/libraries/vector-types/src/vector/vector_types.rs:20-30`.

- **PointDomain** `{ id: Vec<PointId>, position: Vec<DVec2> }` — SoA columns
  (`vector_attributes.rs:85-89`).
- **SegmentDomain** `{ id: Vec<SegmentId>, start_point: Vec<usize>, end_point: Vec<usize>, handles: Vec<BezierHandles>, stroke: Vec<StrokeId> }`
  (`vector_attributes.rs:212-219`). Start/end reference the point table **by
  index, not id** (a deliberate 2024 change, #1949 "Switch of attribute-based
  vector data from referencing point IDs to indexes in the points table";
  also #1888 "Segment domain point reference as index"). `BezierHandles` =
  `Linear | Quadratic { handle } | Cubic { handle_start, handle_end }`
  (`subpath/structs.rs`). Handles are therefore **per-segment**, not per-point:
  a shared anchor has distinct incoming/outgoing handles carried by its two
  incident segments.
- **RegionDomain** `{ id: Vec<RegionId>, segment_range: Vec<RangeInclusive<SegmentId>>, fill: Vec<FillId> }`
  (`vector_attributes.rs:596-601`) — a region is an ordered *range of segment
  ids*, i.e. closed subpaths ARE the fill regions; a closed subpath appends its
  segments then pushes one region spanning `first_seg..=last_seg`
  (`vector_types.rs:129-140`). This is the "vector network with explicit
  regions" model: faces are materialised records, and a point can have 3+
  incident segments (network topology) with no subpath bookkeeping.

Id types are strongly-typed newtype u64s (`create_ids! { PointId, SegmentId,
RegionId, StrokeId, FillId }`, `vector_attributes.rs:25-52`). Point ids are
**content-derived hashes** in places: `generate_from_hash(node_id, ...)`
(`vector_attributes.rs:38-43`) — ids derived from content so pasting/duplicating
yields stable ids, at the cost of collision discipline (Crafty's design.md
Decision 10 explicitly rejects this).

### Subpath: the tool-time conversion layer

Tools and hit-testing work on a separate structure: `Subpath<PointId> {
manipulator_groups: Vec<ManipulatorGroup<PointId>>, closed: bool }`
(`subpath/mod.rs:18-21`) with `ManipulatorGroup { anchor: DVec2, in_handle: Option<DVec2>, out_handle: Option<DVec2>, id: PointId }`
(`subpath/structs.rs`). Handles are anchor-centric here (in/out per anchor);
conversion `Subpath ⇄ Vector` (a) infers linear/quadratic/cubic per segment
from which handles exist (`append_subpath`, `vector_types.rs:84-141`) and (b)
is lossy for network topologies (a subpath is one ordered ring; a network is
not). `ManipulatorPointId::{Anchor(PointId), PrimaryHandle(SegmentId), EndHandle(SegmentId)}`
(`vector/misc.rs:436-443`) — handles addressed BY SEGMENT id. Segment lookup is
linear: `resolve_id` is `position()` over the id column
(`vector_attributes.rs:176-178`); `next_id` is a max-scan (`:163-165`);
`append_subpath` had "reduce linear searches" issue #2189.

### Hit testing: `ClickTarget` with a bounds cache

`ClickTarget { target_type: ClickTargetType::{Subpath|FreePoint|CompoundPath}, stroke_width, bounding_box, bounding_box_cache: Arc<RwLock<BoundingBoxCache>> }`
(`vector/click_target.rs:125-131`). CompoundPath tests multiple subpaths with
the non-zero fill rule so holes work (`click_target.rs:38-44`). The
`BoundingBoxCache` is an 8-entry ring buffer keyed by a 7-bit rotation
fingerprint avoiding repeated rotated-bbox computation (`click_target.rs:44-122,
191-217`, skew bypasses the cache). Click targets are produced during the
render metadata pass and shipped to the frontend for overlay hit-testing
(`UpdateClickTargets`, `frontend_message.rs:201`).

### Tool state machines and the drag path

- `pen_tool.rs` — 2,335 lines; `path_tool.rs` — 3,663 lines;
  `common_functionality/shape_editor.rs` — 2,320 lines; `freehand_tool.rs`,
  `spline_tool.rs`, `select_tool.rs` also live.
- `PathToolData` scratch struct holds drag bookkeeping: snap manager, lasso
  polygon, selection status, opposing-handle lengths, saved selections before
  handle drags, etc. (`path_tool.rs:556-580`).
- Drag flow: pointer move → `PathToolMessage::Drag` → `shape_editor.move_anchor/move_primary/move_end` (`shape_editor.rs:930-1000`, `move_selected_points_and_segments` `:1258`) → several `GraphOperationMessage::Vector`
  messages per move (e.g. slide_point emits 4–5 separate modifications,
  `path_tool.rs:1299-1400`) → each appends a modification to the Path node's
  `VectorModification` input and queues `RunDocumentGraph`
  (`graph_operation/utility_types.rs:941-948`).
- Snapping tunables: `SELECTION_THRESHOLD = 10.0` (screen px),
  `MAX_SNAP_CANDIDATES = 10`, `DRAG_THRESHOLD`, `DRILL_THROUGH_THRESHOLD`,
  `HANDLE_ROTATE_SNAP_ANGLE`, `SEGMENT_INSERTION_DISTANCE` —
  `editor/src/consts.rs:46,112`.

### The per-frame re-evaluation tax (confirmed from source + docs)

- Every vector modification is a *graph edit*; the volunteer guide is explicit:
  "updating a node's data every frame while interactively drawing a shape
  changes the actual program ... This program must be recompiled and executed
  every frame a change is made." (`volunteer-guide-graphene.txt`).
- `RunDocumentGraph` → `submit_current_node_graph_evaluation`
  (`node_graph_executor.rs:176-214`) → `execute_network` on the whole document
  network (`runtime.rs:377`). The executor is async and coalesces requests,
  but each execution is a full document-graph run whose leaf is the render
  node — a full scene re-encode plus a full viewport texture render
  (`render_node.rs:112-142`).
- Memoization is deliberately weak: the compiler wraps nodes with
  `memoize`+`monitor`+context-nullification (`interpreted-executor/src/node_registry.rs:465-471`),
  and `memoize` **caches exactly one input-output pair**, keyed by a
  `CacheHash` of the input ("Currently, only one input-output pair is cached.
  Subsequent calls with different inputs will overwrite the previous cache." —
  `node-graph/nodes/gcore/src/memo.rs:20`). Any changed input (a dragged
  anchor) invalidates the whole downstream chain up to the render output.
- Open issues confirm the consequence: #2100 "Long node graph evaluations hang
  frontend", #1606 "Incremental graph compilation" (open), #1607 "Spatial
  (resolution-aware and context-aware) caching" (open), #3339 "Hitching when
  there's a hidden raster layer", #1913 "Performance leak when many layers are
  in a scene", #847 "Memory usage spirals out of control as document history
  grows".
- History: `ModifyInputsContext` and the graph mutation layer serialize every
  mutation (`transaction_modified`), and per-frame mutations are the norm
  because every drag frame mutates the graph.

### What Graphite's model is NOT

- Not a destructive command/undo document: mutations are graph edits with
  graph-history snapshots; the `VectorModification` record is an *edits-as-
  delta-layers* design that exists to survive graph re-evaluation (Crafty's
  design.md Decision 10 calls this out as non-transferable).
- Region fills are materialised faces in a network, not "closed subpath ⇒
  fill" — strictly more expressive than Crafty's chosen model, and the source
  of the network→subpath conversion tax for tools/export.
- Per-segment handles (Figma-style tangents per segment) vs Crafty's
  per-point `handleIn/handleOut` — Graphite can express 3+-edge vertices with
  distinct tangents per edge, but pays for it in segment-centric bookkeeping.

---

## 3. Text / glyphs

- **Layout: parley 0.9** (`TextContext { font_context: FontContext,
  layout_context: LayoutContext<()> }`, thread-local, `text_context.rs:69-128`);
  fonts via parley/fontique; **outlines: skrifa 0.42**.
- **Both render paths convert every glyph to a kurbo BezPath and draw it as a
  filled path — there is no glyph atlas, no GPU glyph texture, and even the SVG
  path emits `<path d=...>` elements, not `<text>`**:
  - `draw_glyph_run_to_bezpaths` (`renderer.rs:2483-2512`): per glyph,
    `SkrifaFontRef::from_index(...).outline_glyphs()` +
    `outline.draw(DrawSettings::unhinted(...))` into a `BezPath`.
  - SVG: `List<String>::render_svg` lays out, converts to bezpaths, emits
    `<g transform=...><path d=.../></g>` per glyph run (`renderer.rs:2605-2660`).
  - Vello: same conversion, paths filled into the vello scene (both directions
    share `for_each_styled_glyph_run`, `text_context.rs:19-67`).
- **Text editing** happens in a DOM contenteditable overlay
  (`DisplayEditableTextbox`, `Document.svelte:705-709`), not in the renderer.
- Consequence for Crafty: Graphite avoided the glyph-atlas problem by never
  rasterising glyphs; text is always vector outlines. That is the path model
  that serves glyph rendering directly, but it is CPU-heavy (per-frame shaping
  + outline extraction on every layout change) and there is no
  hinting/rendering-quality story at small sizes.

---

## 4. What went wrong (highest-value section)

### The SVG performance wall (2019–2024)

- The editor rendered its viewport as an SVG string injected into the DOM
  (`{@html artworkSvg}`) until Q3 2024; the frontend had no canvas raster path
  of its own for artwork (overlays only). Vello integration (PR #1802, merged
  2024-07-22) was the first GPU path and stayed opt-in via Preferences; the
  maintainer's own summary of the pre-Vello era: "working in Graphite was too
  slow for practical usability" (year-in-review 2024), and Alpha 3 "brought the
  formerly abysmal performance up to now-adequate levels".
- Consequence of SVG-first: every graphic node still carries both `render_svg`
  and `render_to_vello` (renderer.rs:634-636); the two paths drift — clear
  spread needs different guard-stop schemes per renderer
  (`ClearGuardPlacement`, renderer.rs:403-412), linear gradients differ under
  shear (renderer.rs:378-395), clipping masks broke specifically in the Vello
  path (#3443, vello push_clip_layer bug linebender/vello#1198), the
  Rasterize node exists only on web because it was built on the SVG renderer
  (#3719).
- Even today, "SVG Preview" remains a user-selectable RenderMode
  (`style.rs:427`, `document_message_handler.rs:3321-3343`), the no-GPU
  fallback is full-document SVG serialization (runtime.rs:232-238), and SVG
  export keeps the SVG writer alive (render_node.rs:160-163). The SVG pipeline
  is a permanent parallel implementation, not a deleted chapter.
- SVG import was also a performance wall: #2515 "SVG import is exponentially
  slow with respect to the number of layers", #3123 "Very slow performance
  importing SVGs". GSoC 2026 is still "Feature-Complete SVG Import and
  Rendering Support" (discussion #4183) — SVG import/export fidelity remains an
  open project in 2026.

### bezier-rs: built in-house, then archived in favour of kurbo (2025)

- bezier-rs was Graphite's own computational-geometry library (anchor-centric
  paths, per-anchor handles). In 2025 it was **deprecated and archived**; the
  deprecation notice (Keavon/Bezier-rs README, archived repo) says: "Graphite
  has moved to Kurbo as of 2025, which offers superior performance and
  correctness compared to the naïve and unoptimized algorithms implemented
  here... Bezier-rs is anchor-centric while Kurbo (like SVG) is segment-centric."
- The migration was a GSoC 2025 project (discussion #2652) done node-by-node:
  Offset Path (#2596, #2946), Solidify Stroke (#2608), Position/Tangent on Path
  (#2611), Sample Points (#2629), Scatter Points (#2634), Bounding Box (#2662),
  Morph (#2696), Spline (#2701), Round Corners/Auto-Tangents (#2964), Centroid
  and the `Subpath` struct itself (#2977, #3036 — "eliminating all remaining
  usages of Bezier-rs"). Tracking issues: #2635, #2325.
- Current source confirms zero bezier-rs in the workspace Cargo.lock/Cargo.toml;
  strokes use `kurbo::stroke` (vector_nodes.rs:1419-1429), offsets use
  `kurbo::offset_bezpath` (vector_nodes.rs:1375-1384), and bounds use
  `kurbo::stroke` (vector_types.rs:274-302). Lesson: a bespoke geometry
  library is a liability unless it is maintained like a product; the Linebender
  stack (kurbo/vello/parley/skrifa) won.

### Boolean ops: two rewrites, ended on linesweeper (2026)

- Q2 2024: first Boolean Operation node (#1759) on bezier-rs.
- Q3 2024: "Rewritten boolean operations algorithm that runs purely in Rust
  instead of making high-overhead calls into a JavaScript library" (#1952,
  #2000) — the original called bezier-rs **across the JS/WASM boundary per
  operation**.
- 2026: custom path-bool replaced by **linesweeper** (PR #2670, commit
  58aae4f, merged ~Mar 2026; bump 0.4 in #4273, Jun 2026; see also discussion
  #3528 for the replacement rationale and #4103 for API limitations of the
  0.3/0.4 linesweeper topology API). The clone pins `linesweeper = "0.4"`
  (Cargo.toml:236) and `node-graph/nodes/path-bool/src/lib.rs:13-14` uses
  `linesweeper::{BinaryOp, FillRule, Topology}`.
- History of booleans = three implementations in three years (bezier-rs → pure
  Rust path_bool → linesweeper). Boolean ops are the single most rewritten
  subsystem in Graphite's vector stack.

### The node-graph re-evaluation tax

- The document is a graph; every tool edit mutates graph inputs and triggers
  `RunDocumentGraph` (96 call sites in the editor; the executor coalesces but
  each run is a full document evaluation to a render output).
- Official docs: "This program must be recompiled and executed every frame a
  change is made" (volunteer-guide-graphene.txt).
- Memoization caches exactly one input-output pair per node keyed by input
  hash (memo.rs:20); a changed anchor hash-invalidates the whole downstream
  chain to the render node; the render output re-encodes and re-rasterizes the
  full scene per run.
- Only the "interpreted" execution regime exists; JIT/compiled regimes are
  design docs (volunteer-guide-graphene, "currently the only mode that's
  implemented"). Async execution still blocks: #1608 — "while we do
  technically have async execution, it still blocks our event loop which
  requires a full start-to-finish graph compilation and execution before
  showing the result"; #3781 (2026-02) plans an executor refactor; #2100 "Long
  node graph evaluations hang frontend" is still open.
- Measured frame times (PR #1946, with caching): Painted dreams 85ms → 5.5ms,
  Isometric fountain 7.1 → 4.2, Spires 6.8 → 5.5, String lights 6.2 → 5.8,
  Red dress 115ms → 115ms — i.e. 5–6ms of Rust graph+render execution per
  frame is the floor on demo documents, and one artwork refused to benefit
  from caching.
- The path tool compensates at the tool level: `PathToolData` carries
  snap caches and saved selections, `compute_modified_vector` recomputes the
  modified vector for hit testing (`network_interface/structure.rs:8`), and
  the Select tool has ClickTarget caches — all downstream of the same
  re-evaluation.

### Maintainer admissions (blog archive)

- "Working in Graphite was too slow for practical usability" before the 2024
  perf work; "formerly abysmal performance" (year-in-review 2024).
- 2023 was largely a two-steps-back refactor year: "much of the team's time
  was spent on refactors to swap short-term placeholder code with
  Graphene-powered replacements", 62 regressions burnt down, 6000 lines of
  dead code removed at year end (looking-back-on-2023).
- Vello remained experimental until "browser support for the WebGPU API
  becomes widespread" (year-in-review 2024); the clone (Aug 2026) still keys
  the Vello path on `gpu_executor().is_some()` with SVG as the fallback and
  `SvgPreview` as a user-facing mode; issue #3512 ("Make SVG renderer a preview
  render mode and take Vello out of preferences") is the plan, and #3796
  (2026-02, open) replaces the desktop SVG Preview rasterizer with resvg.

### WASM size / load-time pain

- The wasm binary exceeded **25 MB per file** and had to be split so
  Cloudflare deployments stay under the 25 MB limit — commit 97a43e6 "Split up
  Wasm binaries so Cloudflare deployments stay below 25 MB per file".
- Fonts embedded in the wasm cost "a couple megabytes" (PR #585) and were
  removed from the binary to cut size.
- Debug builds hit the "too many wasm locals" wasm-pack bug #981 and needed
  `#[inline(never)]` workarounds (commit c814abc3, #1159).

### The fine-grained message boundary's costs

- 86 JS→Rust commands (`frontend/wrapper/src/editor_commands.rs`, `fn ` count)
  and 89 Rust→JS `FrontendMessage` variants
  (`editor/src/messages/frontend/frontend_message.rs`), all serialized over
  wasm-bindgen per call.
- The project's own issue list documents the spam: #767 "Key repeat from
  modifier keys causes message spam and dropped frames", #698 "Reduce message
  spam to the Layer Tree's options bar widgets", #975 "Debounce widget inputs
  to minimize backend spam", #3072 "Defer messages across dispatcher
  invocations" (the `Defer`/`DeferMessage` system exists precisely for this),
  #1103 "Sending rasterized images from JS to Rust runs out of wasm memory".
- Per-frame pattern: every UI widget value change is a message; every pointer
  event is a message; every graph mutation is a message that queues a full
  graph run. The frontend "philosophy is to be as lightweight and minimal as
  possible... quickly hands off its work to the WebAssembly editor backend"
  (volunteer-guide/codebase-overview) — i.e. the backend is the source of
  truth and the boundary is crossed constantly.

### Other structural scars

- The desktop app needed CEF + hole-punch + shared-memory frame shipping
  (desktop/ui/frames/*) because the web frontend owns the DOM but the artwork
  must be native-rendered — a third rendering delivery mechanism.
- Text edit overlay lives in DOM contenteditable; the frontend still owns
  rulers, overlays, and the graph UI in Svelte, with #1922 "Reimplement the
  node graph UI in the backend" still open and #1877 "Upgrade to Svelte 5 and
  remove slow manual component event delegation" still open.

---

## 5. The Rust/WASM/TypeScript boundary — copy or avoid?

Graphite's boundary: **fine-grained, per-interaction, chatty**.
- ~86 JS→Rust commands, ~89 Rust→JS message variants (counted in the clone).
- Every UI interaction is a message; message traffic is itself a documented
  performance problem (issues #698, #767, #975, #3072, #1103).
- Vector edits go: JS/Svelte event → wasm command call → editor message →
  graph mutation → `RunDocumentGraph` → full graph evaluation → full SVG
  string or full texture blit back to JS. One drag frame = multiple round
  trips with a full-document render each.
- Even the *Vello* path ships the whole artwork to the frontend as a
  foreignObject-SVG wrapper around a hidden canvas, then the Svelte component
  splices the canvas into the DOM (node_graph_executor.rs:680-687,
  Document.svelte:184-222) — the artwork *display* is still DOM-mediated, and
  the presenter blits the full viewport texture on every frame
  (canvas-utils/wasm.rs:87-141).

Verdict: **avoid copying.** Crafty's coarse one-packet-per-frame boundary with
a retained command map and no per-shape crossings
(`wasm-boundary.md`, ADR 0003) is precisely the property Graphite lacks: the
JS side never needs to know about per-node mutations, and the render loop is a
single Rust encoder call per frame (`RendererCore::render()`). The Graphite
evidence for staying coarse: every optimisation the Graphite team made was an
attempt to *reduce* boundary traffic (message deferral #3072, debounce #975,
Rust-side wire generation #2830, "removing unnecessary graph re-compiles and
frontend updates" — GSoC 2024 weekly report), and the boundary volume is still
an open problem in 2026.

---

## 6. Uncertainty flags

1. **Clone-vs-live-repo**: the clone is a depth-1 checkout of a commit dated
   2026-08-06 (current), but GitHub-web evidence shows very recent activity
   (#4103 May 2026, #4273 Jun 2026, #4183 GSoC 2026) that matches the clone's
   state (linesweeper 0.4, path-bool via linesweeper). Items I could not fully
   verify in the clone: the exact merge date/status of #3512 (SVG-as-preview
   mode) — the clone still has `RenderMode::SvgPreview` and a Vello/Svg
   choice keyed on GPU availability, so as of the clone Vello is *not* the
   sole default with SVG only a preview.
2. **"105 call sites"** — I measured 96 `NodeGraphMessage::RunDocumentGraph`
   sites in the clone; the reported figure may include other graph-run paths
   (eyedropper, thumbnails, `GraphUpdate`). Treat as "~100".
3. **Message counts**: 86 commands / 89 variants counted by regex; the
   macro-generated `editor_commands` module produces wasm-bindgen exports, so
   the exact JS-facing count includes macro-generated wrappers — 86 is the
   author-written command count.
4. **Per-frame drag cost**: I confirmed the *mechanism* (vector_modify →
   RunDocumentGraph per message; single-pair memoize; full execute_network)
   from source, and the maintainers' own numbers from PR #1946's comment
   table, but I did not measure a live drag.
5. **Vello CPU fallback**: vello itself can render on CPU; Graphite's
   WgpuExecutor sets `use_cpu: false` (lib.rs:127) — confirmed in clone; the
   live repo could have changed this, though nothing in the searched issues
   suggests it.
6. **Blog archive**: the .txt files for several posts were empty; the HTML
   blog index pages were used to confirm article titles/dates, and the
   substantive posts (Q1–Q4 2024 reports, year-in-review 2024, looking-back
   2023, distributed-computing, volunteer guides) were read in full. No
   claims in this report rest on an unread post.
7. **GSoC 2025/2026 claims** (bezier-rs retirement details, linesweeper
   migration) come from GitHub discussion #2652, the archived bezier-rs
   README, and PR/issue pages via web search — consistent with the clone.
8. **`web_sys` usage**: I found no hand-written `web_sys::Gpu`; wgpu owns the
   browser WebGPU binding. canvas-utils uses `web_sys` only for the HTML
   canvas element. If the live repo changed GPU init, this may lag.

---

## (b) What Crafty should COPY

1. **One well-maintained geometry stack instead of a bespoke library.**
   Graphite's strongest recent move was dropping bezier-rs for kurbo
   (deprecation notice: "naïve and unoptimized algorithms"; anchor-centric vs
   segment-centric mismatch) and delegating booleans to linesweeper. Crafty
   should adopt kurbo (or its equivalent) for curve math, flattening,
   bounding-box-with-extrema, projection and offset — and treat any bespoke
   geometry crate as a liability. This directly supports design.md Decision 10
   ("bezier-rs's full algorithm surface — Crafty needs bbox-with-extrema, de
   Casteljau split, point projection, and flattening — a much smaller
   surface"): take those specific functions from kurbo, don't rebuild.
2. **Segment-degenerate-bbox discipline.** `nonzero_bounding_box`
   (vector_types.rs:315-327) and the I8-relaxation decision in Crafty's
   design.md are the same lesson: zero-area paths are legal and every
   bounds consumer must survive them.
3. **The per-segment `BezierHandles` encoding as a *conversion target*, not a
   storage format.** Graphite's `Linear | Quadratic | Cubic` inference from
   which handles exist (vector_types.rs:89-93) is exactly what a subpath-based
   model needs when handing geometry to a renderer/tessellator. Crafty's
   per-point `handleIn/handleOut` authored model can convert to this per-
   segment form at the packet boundary without adopting Graphite's storage.
4. **Bounded hit-test caches with explicit invalidation.** `ClickTarget`'s
   bounding box + 8-entry rotated-bounds ring cache (click_target.rs:44-131)
   and the lesson of #1946 (caching click targets took Painted dreams from
   85ms to 5.5ms) validate Crafty's plan to keep hit testing out of the
   per-frame re-encode path — cache hit-testable geometry on the kernel side,
   invalidate by id, not by full rebuild.
5. **Text as vector outlines.** Graphite shapes with parley and draws every
   glyph as a filled bezpath through skrifa outlines (renderer.rs:2483-2512)
   in BOTH render paths. For Crafty, whose roadmap puts text (3.1) before
   vectors (3.3) and whose renderer has no glyph raster path, the practical
   lesson is: a path model that can carry glyph outlines unblocks text without
   a GPU glyph atlas; the subpath+points model chosen in vector-path-data-model
   is sufficient for glyph outlines (each glyph = one subpath ring). This also
   means "glyph rasterization eventually" can be *deferred* safely — the
   encoder can emit glyph outlines as ordinary path geometry first, and a
   texture atlas can come later as a pure host-side optimisation.
6. **The fallback lesson in reverse.** Graphite's SVG fallback is the reason
   its renderer has two implementations. Crafty's "no fallback backend"
   invariant (I32) is the correct answer to the same problem — but note
   Graphite's rationale: WebGPU coverage was NOT universal for years even in
   2025-2026. Crafty should keep the option open at the *packet* level (a
   headless encoder is already planned) rather than at the *pipeline* level,
   which is exactly what the pure Rust encoder + thin hosts design
   (wasm-boundary.md:113-121) provides.
7. **Columnar/SoA point storage.** `PointDomain { id: Vec, position: Vec }`
   (vector_attributes.rs:85-89) is a cheap, high-value layout; Crafty's flat
   id-keyed point map (Record<PointId, Point>) can adopt the same separation
   when the hot paths (encode, bounds, hit-test) materialise, without changing
   the authored schema.

## (c) What Crafty should AVOID

1. **The dual renderer.** Two full rendering implementations per graphic type
   (SVG writer + Vello encoder, 9 `impl Render` blocks × 2 each,
   renderer.rs:634-636) with renderer-specific semantics divergences
   (ClearGuardPlacement, gradient_placement) is a permanent tax Graphite has
   lived with since 2019 and still pays in 2026 (SVG Preview mode, no-GPU
   fallback, SVG export, resvg on desktop). Crafty's single packet → single
   host is the right shape; never add a second rasterizer for feature parity.
2. **Edits that mutate graph inputs.** Every vector edit in Graphite is a
   graph-input mutation with a full-graph re-evaluation consequence
   (mutations.rs:89-104 → RunDocumentGraph → execute_network). Crafty's
   validated invertible commands with `beforeDocument`-computed inverses
   (kernel.ts:157) are strictly better for drags: one transaction, one commit,
   one re-encode of named changed nodes. Do not introduce any path that edits
   document state outside `DocumentCommand`.
3. **One-pair memoization as the caching strategy.** Graphite's memoize node
   caches a single input-output pair keyed by full-input hash (memo.rs:20),
   which makes drags re-run everything downstream. Crafty's changed-node batch
   + retained command map (renderer.md §incremental) is the correct
   granularity: name what changed, rebuild only that.
4. **Handles addressed by segment ids with linear id resolution.**
   `resolve_id` is O(n) linear scan (vector_attributes.rs:176-178),
   `next_id` is a max-scan, `append_subpath` had a "reduce linear searches"
   issue (#2189). Crafty's per-point `(pointId, "in"|"out")` addressing avoids
   the segment-lookup tax entirely; keep ids in a HashMap or SoA-indexable
   structure, never linear scans in drag paths.
5. **Materialised region/face records.** `RegionDomain` with explicit
   segment ranges exists because Graphite is a network with faces
   (vector_types.rs:129-140). Crafty's closed-subpath-is-a-fill-region model
   is simpler and the design.md flip condition (shape-builder) already covers
   when to revisit. Do not pre-build face records.
6. **Content-derived ids.** `generate_from_hash` (vector_attributes.rs:38-43)
   makes id stability depend on hash discipline; Crafty's minted ids (I22)
   are the safer rule — Graphite's own history has no counterexample that
   would justify content-derived ids, and paste/duplicate semantics are the
   killer case.
7. **The chatty message boundary.** 86 commands / 89 message variants with
   documented spam problems (#698, #767, #975, #1103, #3072) is the
   counterexample to Crafty's coarse boundary. Every new JS↔Rust crossing
   should be treated as a defect until measured (wasm-boundary.md:125-134).
8. **A DOM-mediated artwork display.** Even Graphite's Vello path goes through
   an SVG/foreignObject wrapper and a per-frame full-viewport texture blit
   into a hidden canvas (node_graph_executor.rs:680-687, canvas-utils
   wasm.rs:87-141), plus `present_mode: present_modes[0]` (usually Fifo) and a
   surface re-configure per present that needs a whole sync crate
   (wgpu-sync). Crafty's retained WebGPU host with capacity caches and zero
   steady-state allocations (renderer.md:85-88) is the better pattern; if a
   future Crafty renderer ever presents to a surface, it must copy
   wgpu-sync's lock discipline rather than rediscover the race.
9. **25 MB+ wasm.** Graphite's binary exceeded Cloudflare's 25 MB limit and
   had to be split (commit 97a43e6). Crafty's encoder crate is deliberately
   tiny (serde + wasm-bindgen, wasm-boundary.md:21-22); keep the geometry
   dependencies (kurbo etc.) on the *kernel/encoder* side measured, and do not
   let vello-scale dependencies into the wasm until a size budget exists.

## (d) What is node-graph-specific and must NOT transfer

These are the tempting wrong conclusions; Crafty's design.md Decision 10
already names several, here is the evidence:

1. **VectorModification delta-layers (edits-as-deltas on a graph input).**
   Graphite's path edits are *records of deltas layered onto an upstream
   vector*, because the node graph must be able to re-run from the graph and
   replay the edits (mutations.rs:89-104; vector_modification.rs:304-334).
   Crafty has no re-evaluation-from-graph problem: the document IS the state
   and commands carry exact inverses. The two mechanisms look superficially
   similar ("edits"), but the VectorModification survives *graph recompute*,
   while Crafty's commands survive *undo*. Do not add a delta-layer vector
   input to the path node kind.
2. **Full-document re-evaluation as the normal edit path.** "This program
   must be recompiled and executed every frame a change is made"
   (volunteer-guide-graphene) is a consequence of the graph being the
   document. Crafty's kernel → packet → retained-host pipeline exists
   precisely to make an edit O(changed), not O(document).
3. **The node-graph execution model itself** (interpreted-only executor,
   shadow-structure async polling, #3781) — nothing to transfer; it exists to
   run user-authored procedural graphs, which Crafty does not have.
4. **Region/face materialisation** (see (c)5) — network-specific, flip-
   condition gated in design.md.
5. **Content-derived ids** (see (c)6) — needed for stable identity across
   graph re-runs; Crafty mints ids once and never re-derives.
6. **Bezier-rs's full algorithm surface.** The "archive your geometry
   library" lesson transfers; the *decision to have had one* does not. Crafty
   should consume kurbo's specific algorithms (bbox-with-extrema, split,
   projection, flattening) without recreating the Surface.
7. **The segment-centric vs anchor-centric duality.** Graphite must convert
   between its network (segment-owned handles) and its tool model (anchor-
   owned handles) because tools and storage disagree (subpath/structs.rs vs
   vector_attributes.rs). Crafty chose one model (anchor-owned, per-point
   handles, design.md Decision 4) — the duality is the thing to avoid, not to
   emulate.
