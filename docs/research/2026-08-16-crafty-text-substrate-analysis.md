# Crafty authored-text substrate — current implementation trace

**Date:** 2026-08-16
**Repository HEAD:** `238968a8ca9459dc24496d3cf0e364aca6e9ae62`
**Contract:** `crafty-text-substrate-remediation`
**Decision served:** establish the implementation substrate that later text
architecture work must translate into. This is a reverse-engineering record, not
an engine, schema, packet, migration, or implementation proposal.

## Scope and evidence rules

This report traces the current authored text field from the durable document to
pixels, and separately records editing, measurement, hit testing, persistence,
import, export, invalidation, and package ownership. **Source and tests are the
ground truth.** Architecture documents are cited only as architectural intent or
as contradictions. Status labels mean:

- **Current:** called by the shipping editor path at this HEAD.
- **Transitional:** live compatibility machinery, principally legacy `Scene`.
- **Target:** documented intent with no current product path.
- **Unknown:** not established by the inspected source or tests.

The two supplied research reports are context only. The competitor synthesis
separates logical content, font resolution, resolved layout, editing adapters,
and interchange fidelity
(`docs/research/2026-08-15-competitive-text-systems-synthesis.md:47-63,
235-249`). The Rust/WebGPU study establishes that Vello and WebGPU do not supply
shaping, layout, fallback, or editing semantics
(`docs/research/2026-08-16-rust-webgpu-text-ecosystem.md:7-15,30-50`). Neither
report is used here to infer behavior absent from Crafty's source.

## Executive finding

**Current:** Crafty has real but deliberately minimal text rendering, not merely
legacy/import-only text. A version-4 `EditorDocument` can carry a `kind: "text"`
node and optional plain `text` string. The generic invertible `set-property`
command and inspector can replace the whole string, but that command is not
runtime type-safe for `text`: its property/value union is not discriminated and
document validation does not inspect the field. Component resolution can
apply whole-string text overrides. The active editor projects each non-empty text
node into a protocol-v5 `geometry: "text"` command. Rust parses an embedded Inter
Regular font, maps each Rust `char` independently to one glyph, advances from
`hmtx`, converts a lossy outline approximation into ordinary path geometry, and
Vello renders those paths through the same WebGPU scene path as authored vectors.
That conversion is not evidence of faithful glyph outlines: `move_to` does not
emit the contour's first anchor, `close` records no contour boundary, and all
contours of a glyph are concatenated into one packet subpath
(`packages/scene-renderer/rust/src/text.rs:44-101,146-176`).

This is **not** a text layout or text-editing substrate. There is no authored font
identity or size, no runs or paragraphs, no shaping, kerning, bidi, line breaking,
font fallback, browser/system font access, caret, range selection, IME adapter,
cluster map, glyph hit testing, or text creation tool. Node-box height is the font
size proxy. Selection and hit testing use the transformed authored/resolved box,
not glyph geometry. The `.pen` importer uses a separate heuristic to estimate
missing text bounds and discards imported `fontSize` after that estimate.

The most consequential integration fact is that the shipping editor no longer
uses the older `Scene bytes -> Rust RendererCore.render() -> JSON RenderFrame`
path. It builds a complete packet in TypeScript and calls `renderFrame` directly
(`packages/editor/src/ui/editor/canvas-stage.tsx:415-436`). Legacy `Scene` remains
inside that construction for rect projection, hierarchy, hover/scoping index, and
compatibility callers. Text commands travel in the unfortunately named
`pathCommands` side projection before packet convergence
(`packages/editor/src/ui/editor/harness.ts:390-415,442-524`;
`packages/scene-renderer/src/scene-packet.ts:161-189`).

## Capability matrix

| Capability | Status | Exact current behavior and evidence |
|---|---|---|
| Authored kind/content | **Current, minimal** | `NodeKind` includes `"text"`; `DocumentNode.text?: string` is the only text-specific authored field (`packages/editor/src/kernel/document.ts:5-12,126-148`). Text existed in the v1 kind set, so no text migration was added (`document.ts:345-356,696-733`). The foundation fixture authors one string (`document.ts:781-793`). |
| Runtime validation | **Current, incomplete** | `validateNode` validates generic geometry/visibility/layout and kind, but has no check that `text` is a string or that only text nodes carry it (`document.ts:499-542`). By contrast, transitional `Scene` explicitly validates `Layer.text` as a string (`packages/scene-model/src/index.ts:149-168`). Thus the TypeScript interface expresses a stronger contract than persisted-document runtime validation. |
| Commands / undo | **Current, whole property; invertible but not runtime type-safe** | Generic `set-property` includes `"text"` and returns an inverse (`packages/editor/src/kernel/commands.ts:53,1152-1161`). Its value union is not property-discriminated: a number or boolean is a legal command-union value even when `property` is `"text"`. The setter rejects non-fill objects only, and `validateNode` never checks `text`, so such a runtime payload is accepted into the document (`commands.ts:1152-1161`; `document.ts:499-542`). There are no insert/delete/replace-range, style-range, paragraph, or text-creation commands. |
| UI editing | **Current, property field only** | Inspector renders an HTML `<input>` for a selected text layer and dispatches one `set-property` on every `onChange` (`packages/editor/src/ui/editor-primitives/panels/inspector.tsx:149-165,393-409`). This edits the whole string outside the canvas. There is no canvas caret/range editor. |
| Editing state/input | **Absent / Target** | `EditorState.focusedId?` exists but has no producer or consumer (`packages/editor/src/kernel/kernel.ts:10-24`; repository search finds no other use). `EditorTool` has no text tool and the closed effect vocabulary has no text effects (`packages/editor/src/kernel/interaction.ts:82-92,138-187`). Keyboard bindings only avoid shortcuts when an ordinary DOM input/textarea/contenteditable owns the event (`packages/editor/src/ui/editor/keyboard-bindings.tsx:20-24,35-68`). No `beforeinput` or composition event path exists. |
| Component resolution | **Current, whole string** | `text` is a supported override; non-string override values produce `COMPONENT_PROPERTY_INVALID`; resolved nodes remain disposable and carry provenance (`packages/editor/src/kernel/component-resolution.ts:3-20,22-45,56-67,129-180`). This can alter rendered text without mutating the definition. It does not bind component property definitions to a particular text node automatically; explicit node overrides do the visual work. |
| Legacy Story override | **Transitional, visually broken for text** | `LayerOverride` includes text and `applyStoryOverrides` applies it (`packages/scene-model/src/index.ts:76-83,171-202,259-269`). But the active text commands are built from `resolvedDocument` before Story overrides, while Story overrides are applied only to the legacy `Scene`; `sceneToRenderFrame` deliberately emits no rect for Scene text (`packages/editor/src/ui/editor/harness.ts:3870-3899`; `packages/scene-renderer/src/scene-packet.ts:72-85`). Therefore a Story text override changes scaffolding that is not drawn and does not change the text command. No focused test catches this. |
| Animation evaluation | **Implemented utility, not current product path** | `EvaluatedNodePatch` permits discrete `text` changes (`packages/editor/src/kernel/animation-resolution.ts:42-74`), but only tests and the kernel barrel import this module; `EditorKernel.getProjection` does not invoke it (`kernel.ts:237-248`). |
| Intrinsic measurement / layout | **Fallback only** | `intrinsicMeasurementKey` includes node id, text, and authored width/height. Hug sizing passes the existing bounds back as its “measurement” and emits `LAYOUT_INTRINSIC_FALLBACK:<id>` for text (`packages/editor/src/kernel/layout.ts:15-35,46-68,98-127`). No font metrics or glyph layout feed Taffy. Layout can replace a text node's resolved box (`layout.ts:148-156`), and rendering then treats that resolved box height as font size. |
| Packet construction | **Current** | Protocol v5 declares `DrawGeometry = "rect" | "path" | "text"`; a text command carries string plus optional size (`packages/scene-renderer/src/draw-protocol.ts:4-34,206-221`). `textCommandFor` uses local box `(0,0,width,height)`, composed world transform, authored fill/opacity/order, and `fontSize = max(resolved bounds height, 1)` (`packages/editor/src/ui/editor/harness.ts:390-415`). `projectPathCommands` emits it only when `node.text` is truthy and the node is not a compound member (`harness.ts:442-524`). Empty string and absent text produce no command. |
| Packet merge / WASM crossing | **Current** | The stage builds a base frame from transitional Scene rects, appends text/path commands, glass and overlays with `composeRenderFrame`, then submits `SceneRenderer.renderFrame` (`packages/editor/src/ui/editor/canvas-stage.tsx:390-436`; `packages/scene-renderer/src/scene-packet.ts:161-189`). The host serializes that complete `RenderFrame` once and calls `RendererCore.render_packet` (`packages/scene-renderer/src/wasm/webgpu-renderer.ts:303-353,503-519`; `packages/scene-renderer/src/wasm-bridge.ts:319-363`). |
| Rust decode / text realization | **Current, single-line advance ladder** | Rust mirrors `text: Option<String>` and `fontSize: Option<f64>` (`packages/scene-renderer/rust/src/lib.rs:344-370`). `encode_text` requires both, calls `text_geometry`, then fills resulting geometry as one ordinary Vello path (`rust/src/vello_encoder.rs:312-343,418-438`). Missing packet payload is an encode error; empty or all-skipped content draws nothing. |
| Font access | **Current, one embedded face** | Inter Regular bytes are compiled into WASM with `include_bytes!`; `ttf-parser` is the only text/font dependency (`packages/scene-renderer/rust/src/text.rs:13-20,111-125`; `rust/Cargo.toml:19-23`). There is no `FontFace`, `document.fonts`, Fontique, fontdb, browser-installed-font, URL-font, binary registration, family matching, fallback chain, font version identity, or substitution diagnostic in product code. |
| Shaping / lines | **Absent** | The loop iterates Rust Unicode scalar values (`text.chars()`), obtains one cmap glyph per scalar, and advances by `hmtx`; controls/newlines/zero-width space are skipped and missing glyphs advance but do not draw (`rust/src/text.rs:38-42,127-178`). There is no GSUB/GPOS, kerning, cluster mapping, bidi, script/language input, wrapping, alignment, overflow, or multi-line positioning. |
| Glyph geometry | **Current, derived, disposable, and topologically lossy** | `GlyphOutline::move_to` updates only `last` and therefore drops each contour's first anchor; `close` emits nothing and preserves no contour boundary (`rust/src/text.rs:44-101`). `text_geometry` creates exactly one `subpath_id` per glyph and assigns every collected point to it, so a glyph's multiple contours are concatenated rather than represented as separate closed subpaths; it even marks that glyph subpath `closed: false` (`rust/src/text.rs:146-176`). Scaling, y-flipping, and rebasing still occur (`rust/src/text.rs:117-193`), but current rendering is not evidence of contour-topology or pixel fidelity. Glyph geometry never enters the document or packet. Rebase anchors the retained-point minimum rather than preserving font side-bearing/top metrics, and command width does not constrain or clip the advance ladder. |
| GPU composition | **Current, no text-specific GPU resource** | Text is already Vello path encoding before GPU submission. Vello renders to an `Rgba8Unorm` offscreen texture with Area AA; the module-owned wgpu device/surface then presents it (`rust/src/wgpu_present.rs:1017-1065,1079-1146,1286-1339,1370-1429`). There is no glyph atlas, glyph texture, text shader, cache, SDF/MSDF, or text-specific bind group. The only checked custom WGSL files are present/glass shaders, not text shaders (`rust/src/lib.rs:1433-1437`). |
| Selection / hit test | **Current, box only** | Kernel `documentHitTest` and deep-hit logic transform the node-local AABB and apply a geometry narrow phase only for authored paths; text takes the generic box branch (`packages/editor/src/kernel/interaction.ts:556-625`). Marquee likewise uses transformed boxes (`interaction.ts:628-658`). Selection overlays therefore describe the text node box, not ink, lines, graphemes, or carets. |
| Transitional spatial index | **Current for hover/scope, box only** | Legacy Scene index stores transformed local bounds and filters visibility/locks; it has no text geometry narrow phase (`packages/scene-model/src/spatial-index.ts:24-84`). The harness rebuilds it from the projected Scene (`packages/editor/src/ui/editor/harness.ts:3870-3900`). This is the known second hit-test implementation. |
| Serialization/versioning | **Current** | Canonical document serialization validates, recursively sorts keys, and JSON-serializes the authored document (`packages/editor/src/kernel/document.ts:681-693`). `.ui` persistence stores that document directly in immutable revision entries and publishes via a manifest (`packages/scene-store/src/index.ts:370-410,503-520`). Plain `text` therefore survives save/load and canonical snapshots; no font bytes or resolved glyphs exist to serialize. |
| Legacy import | **Current, text survives** | Legacy Scene v1 accepts text layers/overrides and `sceneToEditorDocument` copies `layer.text` (`packages/scene-model/src/index.ts:59-83,149-168`; `packages/editor/src/kernel/scene-adapter.ts:36-52,68-82`). The migration chain retains it without text-specific transformation. |
| `.pen` import | **Current, lossy heuristic** | A `.pen` text node's `content` becomes `Layer.text`. When dimensions are missing, width is estimated as `max(20, scalar JS string length * fontSize * 0.62)` and height as `fontSize * 1.25` (`packages/pen-import/src/index.ts:283-312,546-590`). The intermediate Scene is then migrated into v4 (`pen-import/src/index.ts:652-678`). Imported `fontSize` is not authored; with explicit bounds it has no rendering effect, and without bounds it affects only the estimated box, whose height later becomes the renderer size proxy. |
| Export | **Absent for design output** | No PDF/SVG/PNG/HTML/live-text export path was found under the product apps or store. `snapshotDocument` exports canonical authored JSON bytes as a base64 operational snapshot, not a visual/interchange format (`packages/scene-store/src/index.ts:568-592`). The CLI `save`/`load` faces operate on the native package/document boundary, not text layout export. |
| Scene API | **Current separate packet-authoring surface** | `@crafty/scene-api` exposes a renderer-facing `SceneText { text, fill, fontSize? }` and resolves it directly to a protocol-v5 command (`packages/scene-api/src/description.ts:46-68`; `packages/scene-api/src/resolver.ts:36-69`). It is not the authored editor document, does not add text layout, and currently has no text-specific test. |

## End-to-end current path

### 1. Durable authored state and mutation

1. `EditorDocument.schemaVersion` is 4. A text node is an ordinary
   `DocumentNode` distinguished by `kind` and optional `text`; there is no
   typography object (`packages/editor/src/kernel/document.ts:5-12,126-148,
   279-295`).
2. Human inspector edits dispatch the same `DocumentCommand` substrate used by
   other callers. `applyDocumentCommand` clones/replaces the node, reports
   `changed`, and provides the inverse, but its subsequent whole-document
   validation does **not** validate the `text` kind/type contract
   (`packages/editor/src/kernel/commands.ts:53,72-84,1152-1161`;
   `packages/editor/src/kernel/document.ts:499-542`). The normal inspector emits
   a string, but runtime/API callers can submit `{ property: "text", value: 42 }`
   or a boolean because the command union couples `text` to the full scalar value
   union. Those values pass the object-only guard and document validation.
3. A changed command increments `EditorState.documentRevision`, clears the
   memoized kernel projection through `emit`, and preserves selection only for
   live node ids (`packages/editor/src/kernel/kernel.ts:168-209`).
4. `getProjection` resolves components, materializes a disposable resolved
   document, evaluates optional layout, and overlays resolved boxes without
   mutating authored state (`kernel.ts:237-248`;
   `packages/editor/src/kernel/component-resolution.ts:22-45,143-190`;
   `packages/editor/src/kernel/layout.ts:130-156`).

### 2. Editor projection and transitional Scene

1. `CanvasEditor.getSnapshot` reads the kernel projection and calls `buildScene`
   with the **resolved document**, so component text overrides and resolved boxes
   reach rendering (`packages/editor/src/ui/editor/harness.ts:811-863`).
2. `buildScene` projects the resolved document to legacy Scene, optionally applies
   a legacy Story, and separately computes `pathCommands`, which includes text
   (`harness.ts:3870-3899`).
3. `editorDocumentToScene` copies plain text into `Layer.text`; legacy Scene still
   supplies hierarchy, ordering slots, rects, and the spatial index
   (`packages/editor/src/kernel/scene-adapter.ts:155-197`).
4. `sceneToRenderFrame` skips every Scene text rect but still advances its order
   slot and computes selection bounds from the box
   (`packages/scene-renderer/src/scene-packet.ts:62-85,89-123`). This prevents the
   old colored-placeholder rectangle from drawing.
5. `projectPathCommands` walks the resolved document with the same
   `parent * translate(bounds.x,y) * transform` composition. For truthy text it
   appends a text command with fill, content, and height-derived size
   (`harness.ts:442-524`). This channel is not viewport-culled.

### 3. Packet and WASM boundary

1. The rAF stage creates one complete `RenderFrame`: base rect commands,
   text/path commands, authored/chrome glass, grid/guides, selection/editing
   overlays, and preview (`packages/editor/src/ui/editor/canvas-stage.tsx:390-436`;
   `packages/scene-renderer/src/scene-packet.ts:161-189`).
2. `SceneRenderer.renderFrame` applies only glass budgets before forwarding the
   frame (`packages/scene-renderer/src/wasm-bridge.ts:319-363`).
3. `createWebGpuRendererInstance.renderFrame` validates protocol/revision,
   serializes JSON, and calls `core.render_packet`; this is the sole per-frame
   JS-to-WASM crossing (`packages/scene-renderer/src/wasm/webgpu-renderer.ts:
   303-353,562-565`).
4. Rust `serde_json` decodes the complete packet, sorts glass, creates separate
   scene/overlay encodings when composition requires it, and calls the
   module-owned presentation state (`packages/scene-renderer/rust/src/lib.rs:
   1311-1364`). Product semantics do not cross this boundary.

### 4. Rust outline generation to pixels

1. `encode_scene_into` re-sorts all draw calls by `(z_index, order)` and dispatches
   `"text"` to `encode_text` (`rust/src/vello_encoder.rs:418-438`).
2. `encode_text` requires plain content and numeric size, generates derived path
   geometry from embedded Inter, and encodes one nonzero fill with the command's
   transform/color (`vello_encoder.rs:312-343`).
3. `text_geometry` reparses the same embedded face per text command per encoded
   frame. Its `OutlineBuilder` drops `move_to` anchors, records no `close`, and
   concatenates all contours into one open subpath per glyph; therefore the
   resulting path is a lossy approximation, not a faithful outline witness
   (`rust/src/text.rs:44-101,146-176`). No face, glyph-outline, shaped-run, or
   text-layout cache exists (`rust/src/text.rs:111-193`).
4. Vello consumes the resulting path encoding. Its GPU renderer writes an
   offscreen texture using Area AA; glass and overlays compose around that scene;
   a fullscreen present pass copies the result to the canvas surface
   (`rust/src/wgpu_present.rs:1121-1284,1286-1339`). Text has no distinct GPU
   pipeline or resource lifetime.

## Resolution, measurement, and invalidation details

### Authored versus resolved

- **Authored:** node id/kind, whole logical string, box, transform, fill,
  opacity, ordering, generic layout sizing, and component/Story override records.
- **Resolved today:** component-expanded whole strings and layout-replaced boxes.
  There is no `ResolvedText`, run, line, glyph, caret, cluster, fallback, or font
  diagnostic record. The Rust outline geometry is a render-time temporary.
- **Ephemeral:** node selection/hover and an unused `focusedId`; no text editing
  session state exists.

This separation preserves the invariant that rendering never writes authored
state, but the current resolved layer is too coarse to answer any font-dependent
layout or editing query.

### Measurement coupling

There are three mutually non-equivalent notions of text size:

1. **Authored/resolved node box:** authoritative for selection, hit testing,
   marquee, layout participation, and packet width/height.
2. **`.pen` import estimate:** JavaScript string `length` (UTF-16 code units)
   times `fontSize * 0.62`, by `fontSize * 1.25`, only when input dimensions are
   absent.
3. **Rust retained-point geometry:** the lossy Inter outline conversion at
   `node box height`, advanced by `hmtx`, rebased to its retained-point minimum,
   with no width constraint.

No test asserts agreement among these. Long text can render beyond the box while
remaining selectable only inside the box; short ink can leave selectable empty
box area. Resizing the box vertically changes glyph scale, whereas resizing it
horizontally does not reflow or scale text. Hug sizing reports the pre-existing
box and a fallback diagnostic rather than measuring the Rust result.

### Invalidation

- Every successful whole-string `set-property` changes document revision and
  invalidates the kernel/harness projection (`kernel.ts:168-209,237-248`).
- “Successful” here includes invalid non-string runtime values: the generic
  command accepts scalar union values, its guard rejects only object values for
  non-fill properties, and `validateNode` omits `text` (`commands.ts:53,1152-1161`;
  `document.ts:499-542`). A truthy invalid value then passes the harness's text
  branch and is copied to the packet at runtime (`harness.ts:396-414,488-499`).
  JSON serialization preserves the wrong primitive, while Rust requires
  `DrawCall.text: Option<String>`; `serde_json::from_str` can therefore reject the
  entire frame before encoding/presentation, leaving the last valid frame in
  place but producing a render failure (`draw-protocol.ts:13-34`;
  `rust/src/lib.rs:344-370,1281-1315`).
- The scene cache key includes document revision, Story id, frame id, and save
  revision; rebuilding regenerates every active-page text/path command
  (`harness.ts:3870-3899`).
- The current stage submits a full TypeScript-built packet. The legacy
  `computeSceneDelta` includes `Layer.text` in comparisons
  (`packages/scene-renderer/src/wasm-bridge.ts:102-167`), but that delta machinery
  belongs to the compatibility `render(Scene, ...)` path, not the editor's
  current `renderFrame` path.
- Rust reparses Inter and regenerates every visible text command's lossy path
  conversion on each submitted packet. There is no content/font/size cache and
  no affected-run invalidation graph.
- Rect Scene commands are viewport-culled, but host-projected text/path commands
  are not (`scene-packet.ts:37-85`; `harness.ts:442-524`).

## Package boundaries and ownership constraints

1. **`@crafty/editor/kernel` owns durable text and editing semantics.** Its text
   source depends on no renderer API; kernel imports of `@crafty/scene-model` are
   limited to shared constants, the transitional scene adapter, and tests
   (`packages/editor/package.json:6-24`; repository search under
   `packages/editor/src/kernel`). Current whole-text mutation is invertible but
   not runtime type-safe. Future durable mutations must be both rejected on an
   invalid kind/type pairing and invertible here.
2. **`@crafty/editor/ui` owns browser chrome and packet projection glue.** It may
   depend on `@crafty/scene-renderer`; current `textCommandFor` lives here. React
   must not become canonical state or drive per-pointer rendering.
3. **`@crafty/scene-model` is a leaf and transitional compatibility format.** It
   can carry only plain text and Story whole-string overrides. Extending it with a
   new document concept would prolong the migration seam
   (`packages/scene-model/package.json:1-13`;
   `packages/editor/src/kernel/scene-adapter.ts:13-33`).
4. **`@crafty/scene-renderer` owns the kernel-neutral draw protocol, WASM bridge,
   Rust encoder, Vello/wgpu resources, and presentation.** Its only workspace
   dependency is `scene-model`, and its TypeScript source does not import editor
   semantics (`packages/scene-renderer/package.json:6-24`). The renderer may
   receive resolved text geometry/resources, but not components, history, tools,
   or authored-reference semantics.
5. **Rust owns what is drawn; TypeScript owns packet composition; the module owns
   GPU lifetime.** The present implementation also gives Rust one embedded font
   and the temporary advance ladder. That is current placement, not a mandate for
   future text-layout ownership (`rust/src/lib.rs:1253-1288`).
6. **`@crafty/pen-import` is an ingestion adapter.** It depends on editor kernel
   plus scene-model, deliberately uses Scene as an intermediate, and outputs a
   validated current document (`packages/pen-import/package.json:13-16`;
   `packages/pen-import/src/index.ts:660-678`). Its estimate is not authoritative
   editor measurement.
7. **`@crafty/scene-store` owns native persistence and import publication.** It
   depends on editor, pen-import, and scene-model and stores the authored document,
   never glyph results (`packages/scene-store/package.json:13-17`;
   `packages/scene-store/src/index.ts:13-25`).
8. **`@crafty/scene-api` is a separate renderer-facing packet authoring API.** It
   depends on renderer/model, not editor, so its `SceneText` is not a second
   canonical document schema (`packages/scene-api/package.json:15-19`).

## Existing extension seams, without a design selection

These are concrete boundaries already present, not recommendations for a chosen
engine or representation:

- `DocumentNode` plus versioned validation/migration is the only durable schema
  seam (`document.ts:126-148,649-779`). Any richer authored text contract would
  have to be explicit here and survive canonical persistence.
- `DocumentCommand` / `applyDocumentCommand` is the only mutation/history seam
  (`commands.ts:8-72,1152-1161`).
- `resolveScene -> resolvedSceneToDocument -> projectResolvedDocument` is the
  existing disposable resolution seam (`component-resolution.ts:15-45,143-190`;
  `layout.ts:148-156`). It currently resolves whole values and boxes only.
- `IntrinsicMeasurement`, `MeasurementDependency`, and the injected versioned
  layout evaluator are the existing measurement/invalidation contract
  (`layout.ts:3-44,92-127`). Their current text data is fallback geometry.
- Protocol-v5 `DrawCommand` is the coarse renderer boundary. It already accepts
  text content/size, while Rust `DrawCall` mirrors those fields
  (`draw-protocol.ts:13-34`; `rust/src/lib.rs:344-370`). Changing semantics or
  ownership here is a protocol decision, not a local UI refactor.
- `RendererCore.render_packet` is the one per-frame WASM edge, and
  `wgpu_present::PresentState` is the module-owned GPU composition seam
  (`rust/src/lib.rs:1281-1346`; `rust/src/wgpu_present.rs:1017-1065`).
- Overlay commands already provide a renderer-state channel above authored
  content. Existing selection overlays are node geometry, not text range/caret
  semantics (`canvas-stage.tsx:390-412`; `draw-protocol.ts:95-141`).
- `failure-policy.ts` and the structured Rust error strings are the diagnostic/
  last-valid-frame seam; font or text failures must not mutate the document or
  replace the last valid image.

## Forbidden shortcuts implied by current invariants

- Do not persist shaped glyphs, outlines, line boxes, caret geometry, atlas slots,
  or fallback results as authored data. Authored state is canonical; renderer/GPU
  products are disposable.
- Do not mutate text directly from React, DOM handlers, renderer code, an import
  adapter, or an agent-only path. Mutations require inverses, honest `changed`
  reporting, and explicit text-kind/type validation; the current generic setter
  does not yet satisfy that validation requirement.
- Do not add text semantics to legacy `Scene`, Rust GPU structures, or WGSL.
  `Scene` is transitional and `RenderFrame` must remain product-semantic-free.
- Do not measure with a DOM/Canvas path that diverges from rendered geometry, and
  do not treat the `.pen` heuristic or node box as font metrics.
- Do not implement caret/range hit testing from ink pixels or node bounds; current
  box hit testing cannot supply logical offsets.
- Do not serialize ephemeral focus, composition, selection, hover, or live camera.
- Do not introduce a second coordinate or hit-test implementation. The repository
  already has two of each (`docs/architecture/invariants.md:234-243`).
- Do not assume WebGPU, Vello, or `ttf-parser` supplies shaping, fallback, line
  layout, IME, or accessibility. The inspected code assigns none of those jobs.
- Do not add chatty per-glyph JS/WASM calls. The enforced crossing is one coarse
  packet per frame.
- Do not infer a numeric performance budget. Neither supplied report nor current
  tests provide a transferable text workload distribution.

## Tests: current witnesses and missing oracles

### Existing witnesses

- Canonical current-document serialization and v1-to-v4 migration are tested on
  fixtures that include foundation/seed text
  (`packages/editor/src/kernel/document-serialization.test.ts:7-39`).
- Component registry tests establish text property declarations; resolution code
  validates string override values
  (`packages/editor/src/kernel/component-resolution.test.ts:1-10`;
  `component-resolution.ts:129-140`).
- Interaction/marquee tests include `text-foundation` among selectable box nodes
  (`packages/editor/src/kernel/interaction.test.ts:170-225`).
- Clipboard fixtures include and round-trip text descendants
  (`packages/editor/src/kernel/clipboard.test.ts:18-56`).
- Glass validation explicitly rejects a glass fill on text and preserves the old
  fill (`packages/editor/src/kernel/glass-fills.test.ts:60-66`).
- Protocol test proves v5 recognizes and JSON-carries `geometry: "text"`, string,
  and size (`packages/scene-renderer/src/draw-protocol.test.ts:440-460`).
- Rust encoder tests prove `"Hi"` creates some retained points and one filled
  Vello path, skipped/control-only strings draw nothing without failure, and
  absent text payload is a contract violation
  (`packages/scene-renderer/rust/src/vello_encoder.rs:1164-1258`). The positive
  test is a weak oracle: it asserts one encoded path, at least two glyph-level
  subpaths, and more than ten points. It neither compares source-font contours
  nor checks holes, winding/closure, first anchors, or pixels. Its comment that
  the result draws “exactly how an authored outline would draw” is unsupported by
  those assertions and contradicted by `GlyphOutline`'s contour loss
  (`rust/src/text.rs:44-101,146-176`).
- `.pen` tests prove explicit text content/bounds survive into schema v4 and that
  missing dimensions use the heuristic (`packages/pen-import/src/index.test.ts:
  11-72`). Store tests prove imported documents publish and read back identically
  (`packages/scene-store/src/index.test.ts:808-850`).
- Generic renderer host tests cover packet revision/failure behavior, protecting
  the last-valid-frame boundary, though not text semantics
  (`packages/scene-renderer/src/wasm/webgpu-renderer-host.test.ts`).

### Missing oracles

No existing focused test was found for:

1. a `set-property` text edit, its inverse, undo/redo, no-op behavior, or invalid
   non-string payload. The missing invalid-payload oracle must submit at least a
   number and boolean through `applyDocumentCommand`/kernel dispatch and assert a
   stable rejection code plus unchanged document/history; acceptance or a later
   renderer decode failure is not valid behavior;
2. current document validation rejecting non-string text or text on non-text kinds.
   Explicit `text` kind/type validation, with rejection evidence at deserialization
   and command boundaries, is a prerequisite to treating whole-text mutation as
   validated;
3. the harness's exact text command (content, resolved transform, fill, order,
   height-derived size), empty-string omission, or active-page isolation;
4. component text override -> resolved document -> packet -> Rust path;
5. the observed Story text-override loss;
6. agreement—or intentional disagreement—between box, importer estimate, glyph
   ink, selection, and overflow;
7. kerning, ligatures, combining marks, emoji/ZWJ, RTL/bidi, Indic/CJK, newline,
   whitespace, missing glyphs, or fallback diagnostics;
8. font-byte identity, versioning, browser availability, substitution, licensing,
   or export embedding;
9. caret, grapheme/range selection, IME composition/cancellation, accessibility,
   clipboard rich text, or typing undo coalescence;
10. glyph contour topology or browser pixel output. A prerequisite fidelity
    corpus must include multi-contour/hole glyphs (for example `O`, `B`, `8`),
    compare emitted contour count, first anchors, closure, and winding against
    the parsed font outline, and include golden pixel comparisons at multiple
    sizes/transforms. Only that topology-plus-pixel oracle can support a faithful
    outline claim; the current `Hi` point-count witness cannot;
11. text-specific culling, cache behavior, invalidation scope, memory, or measured
    distributions;
12. any text behavior through `@crafty/scene-api` (its resolver test contains no
    text fixture).

## Documentation contradictions at this HEAD

| Document claim | Implementation evidence | Classification |
|---|---|---|
| `typography.md` says almost nothing exists, `DrawGeometry` is rect, and text renders as a colored rectangle (`docs/architecture/typography.md:1-8`). | Protocol v5 has text, the host emits text commands, and Rust derives a Vello path from embedded Inter, albeit with the documented contour-topology loss (`draw-protocol.ts:4-34`; `harness.ts:390-415`; `rust/src/text.rs:44-101,146-176`; `rust/src/vello_encoder.rs:312-343`). | **Stale contradiction.** Its missing shaping/editing/font-model statements remain true. |
| `renderer.md` accurately describes packet convergence and appended path/text commands (`docs/architecture/renderer.md:104-113`) but later says “No text,” text rectangles, no authored culling, and ignored corner radius (`renderer.md:416-434`). | Current source renders text/path; rect Scene commands are culled; corner radius is encoded. Host text/path commands remain uncullled. | **Internally contradictory document.** |
| `scene-resolution.md` says there is no `ResolvedScene`, no component expansion, no layout, and the path is Scene bytes into Rust packet generation (`docs/architecture/scene-resolution.md:32-52`). | `ResolvedScene`, component expansion, resolved-document materialization, and layout projection are live (`component-resolution.ts:3-45,143-190`; `kernel.ts:237-248`); editor submits a TS-built full packet (`canvas-stage.tsx:415-436`). | **Stale contradiction.** |
| `wasm-boundary.md` says current transport is canonical Scene bytes in and JSON out (`docs/architecture/wasm-boundary.md:121-128`). | That compatibility API exists, but the current editor's per-frame edge is complete packet JSON in through `renderFrame -> render_packet`; no packet returns (`webgpu-renderer.ts:303-353`; `rust/src/lib.rs:1281-1288`). | **Stale for product path; true only for compatibility path's first phase.** |
| `document-model.md` lists seven kinds (omitting compound), one rect geometry, path absent, and text/image colored rectangles (`docs/architecture/document-model.md:73-96,112-122`). | Source includes compound; renderer has rect/path/text; path and text render, image still does not (`document.ts:10-12`; `draw-protocol.ts:4-10`). | **Stale contradiction.** |
| `invariants.md` says renderer receives projected Scene, selection overlay comes from removed paths, focus/current page-canvas data is lost on save, components have no resolver/cycle check, kernel hit test is unused, and native save is violated (`docs/architecture/invariants.md:152-175,198-243`). | Current editor sends full packet; persistence is document-native; component resolver/validation and production document hit tests exist; two hit tests still remain (`scene-store/src/index.ts:370-410,503-520`; `component-resolution.ts:69-190`; `interaction.ts:556-658`). | **Broadly stale.** Core invariants (canonical authored state, renderer semantic boundary, overlays, ordering, no fallback) still constrain text work. |
| `current-state.md` correctly says protocol-v5 text renders with embedded Inter and lists missing shaping/editing/font selection (`docs/architecture/current-state.md:323-333`). Its pointer-to-pixels trace still routes the editor through `SceneRenderer.render -> set_scene -> Rust render()` (`current-state.md:79-108`). | `canvas-stage.tsx` now builds and submits `RenderFrame` directly. | **Partly current, partly stale.** |

## Constraint summary for later architecture work

The usable substrate is narrower and more concrete than either “no text” or “text
system”:

- durable plain logical string plus generic box/paint/order whose runtime
  validator currently accepts an invalid `text` type and kind pairing;
- invertible whole-property mutation that is **not** runtime type-safe or
  validated for text; invalid scalar payloads can survive to packet decode;
- disposable component/layout projection, but no text-specific resolved artifact;
- protocol-v5 content-and-size command appended in TypeScript;
- one embedded Inter face and scalar-by-scalar advance with topologically lossy
  outline conversion in Rust;
- ordinary Vello path rendering on a module-owned WebGPU stack;
- node-box selection/hit testing and no editing adapter;
- canonical native persistence and lossy `.pen` ingestion;
- no visual/live-text export and no font resource service;
- full text reprojection/re-tessellation on each relevant frame, with no text
  cache and no host-command culling.

Any later architecture translation must preserve authored/resolved/packet/GPU
separation, the command/history contract, coarse WASM boundary, renderer semantic
neutrality, canonical persistence, diagnostics/last-valid-frame behavior, and
the prohibition on adding another coordinate or hit-test authority. This report
selects no representation, engine, GPU strategy, font policy, or editing model.
Before current text mutation or outline fidelity can be used as substrate
guarantees, two explicit prerequisites must land with rejection/fidelity
evidence: (1) document and command validation that permits `text?: string` only
on text nodes and rejects wrong runtime payload types before mutation, and (2) a
font-outline topology plus rendered-pixel corpus that detects dropped anchors,
lost contour boundaries, closure/winding errors, and visible raster differences.

**Blocker:** none for this bounded current-state trace.
