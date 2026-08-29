# Current State

Status: verified against the working tree, 2026-08-29. Every claim below cites a
path. Where a previous document contradicts the code, that is called out.

## What Crafty is right now

A single Node/TypeScript monorepo containing **one product lineage**: the
canvas. A kernel-backed infinite-canvas design surface rendered through
Rust/WASM → WebGPU. The older block-compiler lineage was retired in one
deliberate change (19 packages, the VS Code extension, its test workspaces) —
see [ADR 0016](adrs/0016-block-compiler-lineage-retirement.md) and
[`legacy-and-cleanup.md`](legacy-and-cleanup.md).

## Packages, honestly

### Canvas lineage

| Package                   | Role                                                                                                                                                                                                                                                                                                              | State                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `packages/editor`         | **The editor package.** `kernel/` subpath: authored document, commands, transactions, history, shared shape creation, tools, clipboard, grid, point types, booleans, compounds — zero React, zero DOM. `rendering/` subpath: framework-free resolved-document → path/text/compound/glass packet projection shared by web and native hosts. `ui/` subpath: chrome (primitives kit, editor primitives, harness, canvas stage, keyboard bindings, overlay/persistence/autosave) | **Current**                                                                                |
| `packages/scene-model`    | Legacy `Scene` v1 wire format + spatial index                                                                                                                                                                                                                                                                     | **Transitional** — compatibility format, 7 tests                                                      |
| `packages/scene-renderer` | Draw protocol v5 (v1–v4 accepted), WASM bridge, failure policy, glass surface budget, chrome glass budget, path/overlay command channels (`.` subpath); Rust encoder + module-owned Vello wgpu renderer (device, surface, present) + glass pyramid/composite (`./wasm` subpath, crate in `rust/`); coarse native C ABI and arm64 iOS static-library build (`rust/native-ffi/`) | **Current** for web and native S0/S1: 102 vitest + 65 core unit + 4 core integration + 6 native-FFI tests. Physical-iPad packet presentation is proven; CoreSimulator is recorded as unsupported because its Metal adapter lacks `INDIRECT_EXECUTION`. No alternate renderer masks that blocker. |
| `packages/pen-import`     | pen.dev `.pen` → `Scene` import                                                                                                                                                                                                                                                                                   | **Current**, 11 tests                                                                                 |
| `packages/scene-store`    | Node-side file store: slugs, atomic writes, revisions, listing, snapshots                                                                                                                                                                                                                                         | **Current**, 17 tests                                                                                 |
| `apps/web/editor`         | Next.js **server** app: Server Components, route handlers, client editor island; the editor chrome comes from `@crafty/editor/ui`, the wasm runtime is wired in by the app                                                                                                      | **Current**, no tests of its own — the editor test surface lives in `packages/editor` |
| `apps/cli`                | Launcher: desktop / serve / import / save / load faces                                                                                                                                                                                                                                                            | **Current**, 21 tests                                                                                 |

### Retired

The block-compiler lineage (19 packages, `apps/vscode-extension`,
`apps/web`, its test workspaces) was removed in one change; see
[ADR 0016](adrs/0016-block-compiler-lineage-retirement.md). The frozen specs
(`specs/`) and the historical ADRs (`docs/adr/`) survive for intent archaeology.

### Directories that look real but are not

- `crates/crafty-renderer-wasm/src/` — **empty**. The Rust crate actually lives at
  `packages/scene-renderer/rust/` (`rust/Cargo.toml`, `rust/src/lib.rs`). Delete candidate.

## The forward path: pointer to pixels

This is the real path, traced through the code.

```
DOM pointer event on <canvas>
  packages/editor/src/ui/editor/canvas-stage.tsx:234  onPointerDown / Move / Up
      │  setPointerCapture; converts client coords to canvas-local via getBoundingClientRect
      ▼
CanvasEditor.handlePointerDown/Move/Up
  packages/editor/src/ui/editor/harness.ts:374
      │  pointer bookkeeping, two-finger pinch detection (pinch cancels the gesture first)
      ▼
transitionInteraction(state, input, context) — PURE REDUCER
  packages/editor/src/kernel/interaction.ts:45
      │  returns { state, effects[] }.  Effects are drawn from a per-tool vocabulary
      │  (TOOL_EFFECT_VOCABULARIES, interaction.ts:33) — the rectangle tool is the
      │  only tool that can emit commit-rectangle.
      ▼
CanvasEditor.applyEffect
  packages/editor/src/ui/editor/harness.ts:519
      │  select → kernel.setSelection/toggleSelection
      │  pan/zoom → mutates harness-owned viewport, mirrors into kernel
      │  preview-rectangle / update-marquee → harness draftBounds (ephemeral)
      │  move → kernel.beginTransaction + kernel.preview(set-bounds…)
      │  commit-rectangle → kernel.dispatch(create-node)
      ▼
EditorKernel
  packages/editor/src/kernel/kernel.ts:60
      │  dispatch / dispatchBatch / beginTransaction / preview / commit / rollback / undo / redo
      ▼
applyDocumentCommand
  packages/editor/src/kernel/commands.ts:157
      │  every mutating branch ends in assertValid() → validateEditorDocument()
      │  and returns an explicit inverse command
      ▼
kernel emits → CanvasEditor.emit() → listeners
      ▼
CanvasEditor.getSnapshot()  harness.ts:98
      │  editorDocumentToScene(document)   ← projects EditorDocument down to legacy Scene
      │  applyStoryOverrides(scene, frameId, storyId)
      │  createSceneSpatialIndex(scene, frameId)   ← the index used for hit testing
      │  renderRevision += 1                       ← the render loop's change signal
      ▼
requestAnimationFrame loop   packages/editor/src/ui/editor/canvas-stage.tsx
      │  reads editor.getSnapshot() DIRECTLY; draws when renderRevision changed.
      │  React is NOT on this path.
      ▼
SceneRenderer.render(scene, frameId, viewport, selectedId, previewBounds, {overlay})
  packages/scene-renderer/src/wasm-bridge.ts:104
      │  computeSceneDelta(previousScene, scene, frameId) → changedNodeIds
      │  canonicalSceneBytes(scene) → RendererCore.set_scene(bytes, frameId, deltaJson)
      │  RendererCore.set_viewport(...)
      ▼
Rust: RendererCore.render()  packages/scene-renderer/rust/src/lib.rs:708
      │  traverses the frame, multiplies transforms, parses colours,
       │  emits a JSON RenderFrame (draw protocol v5; v1–v4 accepted) with
       │  commands sorted by (zIndex, order)
      ▼
webgpu-renderer.ts  packages/scene-renderer/src/wasm/webgpu-renderer.ts
      │  composes the overlay packet (grid, guides) + selectionBounds + preview rects
      │  serializes → render_packet(json) — the ONLY per-frame crossing, JS → WASM
      ▼
Rust  vello_encoder (same module, lib.rs)
      │  decodes packet + overlay → vello::encoding::Encoding (overlays after authored content)
      │  Vello wgpu renderer → offscreen texture → module-owned present pipeline → surface
      ▼
pixels
```

## The reverse path: state to chrome

```
EditorKernel.getProjection()  kernel.ts:120
   → { document, resolvedDocument, resolvedBoxes, layoutDiagnostics, state,
       documentRevision }, memoised on a change counter
CanvasEditor.getSnapshot()    harness.ts:98
   → EditorProjection: scene, frame, pages, activePageId, selectedIds, viewport,
     draftBounds, revision, documentRevision, storyId, canUndo, canRedo,
     interaction, pastePreview, pasteDiagnostics, renderRevision
useEditorSelector(select, isEqual)   packages/editor/src/ui/editor/editor-context.tsx
   → useSyncExternalStore over one slice, cached by projection identity
Toolbar / PagesPanel / LayersPanel / StatesPanel / InspectorPanel / StatusBar
   → independent subscribers, each to the slice it renders
```

Each panel subscribes to its own slice. Zooming re-renders the zoom readout, not
the layers tree.

There is a second, server-side read path that never touches the kernel. Since
the multi-zone platform split (`openspec/changes/multi-zone-platform/`), these
routes live in the **editor zone** (`apps/web/editor`), reachable through the
base app's rewrites — in dev via `bun run dev` (base on :4173, zones on
loopback), in the bundle via `dist/crafty serve`:

```
apps/web/editor/src/app/editor/page.tsx     → listFiles(dataDirectory())  → file browser HTML
apps/web/editor/src/app/editor/[slug]/page.tsx → readDocument(dataDirectory(), slug) → props for the island
```

## Verified findings that contradict earlier documentation

These are the real gaps. Each is a citable discrepancy between a previous
document and the code. The renderer's `Scene` projection and host-composed
path/glass/chrome channels are transitional compatibility seams, not a second
canonical document model.

### 1. React drove the render loop — FIXED

Previously `App.tsx` ran a `useLayoutEffect` keyed on the projection, so every
kernel emit re-rendered the whole 474-line editor component before the frame was
drawn. A drag rendered the entire tree per pointer move.

`App.tsx` is gone. `packages/editor/src/ui/editor/canvas-stage.tsx` now owns a
`requestAnimationFrame` loop that reads `editor.getSnapshot()` directly and draws
when `EditorProjection.renderRevision` changes. Panels are independent sliced
subscribers via `useEditorSelector`. A drag renders no React components. See
[`react-boundary.md`](react-boundary.md) and
[ADR 0008](adrs/0008-next-server-runtime.md).

### 2. Coordinate math is duplicated, and the browser uses the wrong copy

`docs/editor/coordinate-spaces.md` claimed _"All conversion belongs in
`packages/editor/src/kernel/coordinates.ts`."_ In fact `screenToWorld`,
`worldToScreen` and `zoomAt` are implemented **twice**:

- `packages/editor/src/kernel/coordinates.ts:37-40`
- `packages/scene-renderer/src/index.ts:51-54`

The constants are shared (`scene-model/src/constants.ts` — `ZOOM_MIN`/
`ZOOM_MAX`/`WORLD_LIMIT`, the leaf package, since the editor package must
depend on the renderer without a cycle), but the functions are separate
implementations with different clamping behaviour, and `harness.ts:4` imports
the **scene-renderer** copies. The kernel's own copies are used only inside the
kernel and its tests.
See [`coordinate-systems.md`](coordinate-systems.md).

### 3. There are two hit-test implementations; the kernel's is now on the selection paths — PARTIALLY FIXED

`packages/editor/src/kernel/interaction.ts:84` exports `documentHitTest`, a
correct transform-aware, visibility- and lock-respecting hit test over
`EditorDocument`. It now has a production caller: the kernel's paste-target
resolution uses it (`kernel.ts`, `pasteTargetParent`).

Pointer selection and context-menu selection now go through
`documentHitTest` over the resolved authored document. The remaining production
uses of `createSceneSpatialIndex` (`packages/scene-model/src/spatial-index.ts:43`)
built over the **projected legacy `Scene`** are hover highlighting and marquee
scope-container discovery in `harness.ts`. That index respects visibility and
transforms but not `locked`, because legacy `Layer` has no `locked` field.

### 4. The document schema is v5, not v1

`docs/editor/document-model.md` described "`EditorDocument` v1". The current
schema version is `5` (`packages/editor/src/kernel/document.ts`): v2 added
`PageCanvas` (grid, rulers, guides, snap, rest camera — `document.ts:437`), and
v3 added the `"path"` kind, v4 added target-neutral semantic surface and
relationship registries, and v5 made text content required on text nodes through
the explicit `v4-to-v5-require-text-content` migration. The `compound` kind later
joined the v3 kind set additively — a new value only appears when authored, so
there was no schema bump and no migration (ADR 0014); the versioned kind sets
already parameterise acceptance, so a v2 reader rejects compound documents at
its own kind set, exactly like `path`. The migration chain
(`DOCUMENT_MIGRATIONS`, `document.ts:458`) was exercised for real for the first
time by v3: chaining v1 → v2 → v3 → v4 → v5 round-trips without data loss, and the
accepted node-kind set is parameterised by version so a v1 or v2 document can
never validate with a `path` node in it (`document.test.ts:261-289`).

### 5. Document-native persistence — FIXED

The store now persists the authored document directly in a `.ui` directory
package:

- Save: `CanvasEditor.snapshotForSave()` → `PUT /api/files/<slug>/document` →
  `writeDocument` writes a synced immutable `document-<revision>.ui`, publishes
  the manifest commit point, and verifies the selected publication before
  acknowledging it.
- Load: the Server Component calls `readDocument`, which validates and migrates
  the canonical document before passing it to the editor island.

The loss-list fixture and product-path tests cover page canvases, components,
instances, libraries, variables, locked nodes, metadata and path geometry.
`Scene` remains only for renderer projection and the one-shot legacy
`scene.json` read/conversion. Legacy path layers are diagnosed rather than
silently dropped. Autosave is debounced and stale document writes surface a
conflict without replaying local bytes at another revision.

### 6. Viewport has two owners — FIXED

The kernel owns the live camera: `EditorState.viewport` (`kernel.ts:15`) is THE
viewport; the harness reads it through a getter (`harness.ts:441`) and writes
only via `kernel.setViewport`. `PageCanvas.rest` remains the authored per-page
rest camera, written on page switch. The harness-owned field and its
`syncKernelViewport()` mirror — the second representation — are gone.

The live camera is ephemeral: a fresh camera is centred on the world origin by
the canvas stage (`centerOrigin`), undo/redo never move it, and the rest-camera
write is bookkeeping, not a history entry. The write happens on every SETTLED
camera — gesture end, wheel/pinch zoom, trackpad pan, preset zoom, pen-session
close (`CanvasEditor.persistRestCamera`) — so a reload restores the zoom and
coordinate focus.

### 7. Resize is inferred inside the move effect — FIXED

The 16px corner test now lives in the interaction reducer
(`interaction.ts`: `RESIZE_HANDLE_SCREEN_PX`, `cornerHit`, a `selectedBounds`
context field), and the `move` effect carries `resize?: boolean` — resize is no
longer smuggled through `move` with no vocabulary entry; the reducer arms it
explicitly. `armResize` and the harness's `resizeStart` branch are gone. There
is still no other handle and no rotation — one handle, modelled in the
vocabulary, is the current surface.

## What actually works

Backed by tests, not by intent:

- **Document validation on every mutation.** Every mutating branch of
  `applyDocumentCommand` calls `assertValid`, which runs full structural
  validation: id/key agreement, parent existence, back-links, page-root shape,
  cycle detection. `packages/editor/src/kernel/document.test.ts` (29 tests).
- **Path geometry as a validated, invertible, editable model (schema v3).**
  The `path` node kind, id-keyed point map over ordered subpaths, authored
  handle modes (corner/free/asymmetric/mirrored/`auto`), and the
  derived-and-verified `bounds` rule (true bezier extrema, min corner pinned
  at `(0,0)`) are implemented and validated; eight path commands with exact
  inverses, including a payload-free self-inverse `reverse-subpath`, are
  kernel-tested (`path-commands.test.ts`, 12 tests). Point selection survives
  undo and is filtered against live geometry, the clipboard carries path
  geometry with fresh id minting, and hit testing has a geometry narrow phase
  (`path-selection.test.ts`).
- **Point types, pen/node tools, booleans and compounds.** The
  `set-point-type` conversion matrix and the `auto` handle mode (a closed
  chord-tangent formula resolved at projection, never stored; demote-on-edit
  in one invertible transaction) are kernel-tested (`vector-point-types.test.ts`,
  16 tests). The pen and node tools get their closed effect vocabulary in the
  interaction reducer — screen-constant ÷zoom hit geometry, the modifier
  grammar in `constrainHandleDrag`, one transaction per gesture (`interaction.ts`,
  `interaction.test.ts`). Union/intersect/subtract/exclude run kernel-side:
  exact intersections → flatten-with-backdata → split-then-classify on a
  quantized topology grid → re-emission of original curve fragments
  (`path-boolean.test.ts`, 34 tests). The `compound` kind is authored
  non-destructive — members + operation, the merged outline a disposable
  resolved projection re-resolved on every member edit — with flatten as the
  destructive bake (`path-compound.test.ts`, 21 tests).
- **Paths render in production through the packet.** The harness composes
  resolved path commands into the frame (`pathCommands` channel; the scene
  adapter projects path and compound layers as opacity-0 rectangles instead
  of throwing `SCENE_ADAPTER_UNSUPPORTED_KIND:path`), and the module encodes
  them like every command — previously no document with a path could project
  at all. The editing overlays (grippies, marquee, pen session) ride the
  same host-composed `overlayCommands` channel (ADR 0014).
- **Invertible commands and real undo/redo**, including selection and page
  restoration across undo (`kernel.ts:242`), `pages.test.ts` (15 tests).
- **Transactional drag.** `beginTransaction` → repeated `preview` → `commit` or
  `rollback`. A cancelled drag restores the pre-transaction document
  (`kernel.ts:167`). One history entry per drag, not one per pointer-move.
- **Tool arbitration.** `TOOL_EFFECT_VOCABULARIES` makes "a zoom created a
  rectangle" unrepresentable; wheel input while a gesture is in flight resets the
  interaction to idle and emits only a zoom (`interaction.ts:46`).
  `interaction.test.ts` (15 tests).
- **Clipboard with id minting and override remapping**, including diagnostics for
  dropped overrides and missing components (`clipboard.ts`, 16 tests).
- **Fixed grid projection (current).** The kernel's pure `gridPlan` supplies one
  fixed plan. The editor host reveals it strictly above `510%`, reaches its
  capped `0.60` opacity at `600%`, and animates reveal/reversal over 450 ms. The
  renderer device-pixel snaps it after authored content; guides draw after the
  grid. An adaptive nice-number LOD
  ladder with hysteresis remains **Target**, not current behavior.
- **Server-composed floating chrome (current).** The editor layout directly
  composes separate centered history and panel-toggle pills, the bottom creation
  controls, and one stage-relative selection-action leaf. The latter portals
  after mount and remains offscreen-aware; it is not duplicated in fixed top
  chrome (`apps/web/editor/src/app/editor/[slug]/layout.tsx`).
- **Draw protocol v2 with changed-node batches**, retained-command merge, capacity
  buffers with ×2 doubling and zero per-frame allocation, ordered submission
  batches (`scene-renderer`, 90 vitest tests including CPU encoding budgets for
  10,000 rectangles and 1,000 nodes).
- **Renderer failure never touches the document.** Eleven diagnostic codes, each
  carrying `preservation: "authored-state-and-last-valid-packet"`
  (`failure-policy.ts`), 21 tests.
- **No WebGL fallback, explicitly.** `createSceneRenderer` returns an
  `unavailableRenderer` that renders nothing and says so (`scene-renderer/src/index.ts:68`).

## What is incomplete

| Area                                         | Reality                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node kinds                                   | `page-root`, `frame`, `group`, `rectangle`, `text`, `image`, `path`, `compound` exist as _records_. The renderer draws **rectangles, paths and text glyphs** (`DrawGeometry = "rect" \| "path" \| "text"`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Vector paths                                 | **Edited and rendered.** Schema v3: `path` kind, `PathGeometry` (id-keyed point map over ordered subpaths, fractional order keys, authored handle modes incl. `auto`), eight path commands with exact inverses, full validation including the derived-and-verified `bounds` rule. Point types via the `set-point-type` conversion matrix; the pen/node tools' closed effect vocabulary in the interaction reducer (screen-constant ÷zoom hit geometry, the `constrainHandleDrag` modifier grammar); kernel-side booleans union/intersect/subtract/exclude (exact intersections, flatten-with-backdata, split-then-classify on a 1/512-of-extent topology grid, curve-fragment re-emission; features within one grid cell of a parallel edge are unstable by design); the `compound` kind (authored members + operation; merged outline is a disposable resolved projection; flatten is the destructive bake). Production draws authored paths through the shared `@crafty/editor/rendering` packet projection used by both web and native hosts — the legacy Scene cannot carry path geometry, so path and compound layers project opacity-0. The save/reload round trip still silently degrades path and compound geometry (finding 5) until the `Scene` persistence round-trip is retired. |
| Strokes, gradients, shadows, masks, clipping | Strokes render for paths (width, caps, joins, dash). Gradients, shadows, masks, clipping and `cornerRadius` remain absent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Glass fills                                  | **Rendered for rects** (ADR 0012): authored `GlassFill` union, kernel projection (`projectGlassRecords`), protocol v4 `glassSurfaces`, module-owned blur pyramid + composite pass between scene and overlay renders; host budget degrades to flat tint (`GLASS_SURFACES_CAPPED`). **Chrome glass returned (ADR 0021, 2026-08-10): the floating chrome's pills draw in-frame through the same composite** — screen-anchored `chromeGlass` records, the liquid light model (progressive blur, Snell bezel refraction, directional specular, chromatic split, springs), a 16-surface budget with flat-tint degradation (`CHROME_GLASS_SURFACES_CAPPED`), and the DOM pills transparent under the `glass-active` class with the plain CSS appearance as the no-GPU fallback. Chrome composites after the overlay blit, sampling the scene-only pyramid — grid/selection stay sharp through chrome (the recorded gap; the second-pyramid fix is the triggered follow-up). Measured headless (agent-browser, this host, 1280×577, DPR 1): interaction p50 16.7 ms with the liquid fragment active, matching the no-glass baseline; the user's browser is the oracle. Path glass, glass strokes and bezel/specular polish deferred.                       |
| Text                                         | **Rendered as a bounded compatibility foothold** (protocol v5, ADRs 0020 and 0024): single-line glyph tessellation (`ttf-parser` over embedded Inter, OFL 1.1) into the ordinary nonzero path pipeline; each source contour is one closed subpath with exact terminal-wrap normalization and independently checked controls/winding. A test-only real-WebGPU oracle passed `O/B/8 × 16/32/64 ×` four transforms with exact same-coordinate RGBA on the recorded Apple-M5/Metal environment; ordinary WASM omits the oracle exports. The box height remains the size proxy. Text-layer scene rects are invisible scaffolding. Still absent: shaping, metrics, editing, caret, line breaking, font selection, and any full-fidelity claim. See [`typography.md`](typography.md). |
| Culling                                      | **Authored rects are viewport-culled at encode time** (ADR 0020): the encoder skips layers whose world box cannot intersect the viewport; the selection is never culled; culled parents still recurse into in-viewport children. The host-composed path/text channel is not yet culled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Images                                       | A node kind. No decode, upload, or texture path.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Layout                                       | **Foundation current; integration transitional.** Optional versioned `autoLayout`, `sizing`, and flow/absolute records; validated invertible commands; Crafty IR → one coarse Taffy 0.13 WASM call; last-valid failure policy; resolved boxes feed the kernel/canvas projection and selection geometry. Browser-reference fixtures cover three containing widths. Constraints, grid, interaction semantics, translators, inference, foreign layouts, and incrementality remain target work. See [`layout.md`](layout.md) and ADR 0013.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Components                                   | `ComponentDefinition` / `ComponentInstance` records are persisted and validated, survive clipboard operations, and participate in the current component-resolution projection. Component authoring UI remains incomplete.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Variants / states                            | `variants` and `states` maps exist on `ComponentDefinition`. Unused. The "States" panel in the UI drives legacy `Story` overrides, which are a different, weaker mechanism.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Tokens / variables                           | A `variables` record on the document. Nothing reads it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Cross-file libraries                         | `LibraryReference` with `libraryId`, `version`, `integrity`, `status`. Nothing resolves it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Animation / prototyping                      | Nothing. Motion semantics are designed as **Target** in [`animation.md`](animation.md); the dormant lineage's `packages/animation` was retired with it (ADR 0016).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Multi-select UI                              | The kernel holds an ordered selection set and marquee commits multi-selection; the renderer draws a selection outline for **one** id (`SceneRenderer.render(..., selectedLayerId, ...)`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Collaboration                                | None. Single revision integer with optimistic concurrency.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Workers / OffscreenCanvas                    | None. Everything is on the main thread.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Architectural debt, ranked

1. **`Scene` as the persistence format.** Causes finding 5. Everything the
   document model gained since v1 is unsaveable. Fixing this unblocks components,
   tokens, guides and per-page cameras simultaneously. **Now the top item.**
2. **Duplicated coordinate and hit-test implementations.** Two of each, with the
   production path using the weaker copy in both cases.
3. **The harness is doing kernel work.** `CanvasEditor` owns the viewport, resize
   arming, marquee geometry, and paste-target resolution — editor semantics that
   live in the harness (`packages/editor/src/ui/editor/harness.ts`) rather than
   the kernel. **Mostly fixed (H1–H5):** the live viewport, resize arming,
   marquee selection, paste-target resolution and duplicate are kernel-owned.
    The harness still holds the spatial index for hover/scoping queries and the
    pen session's world-anchored bookkeeping.
4. **Legacy `Story` overrides** still back the "States" panel, a weaker mechanism
   than the component-state model it will be superseded by.

Resolved by [ADR 0008](adrs/0008-next-server-runtime.md): React in the render
path, and `App.tsx` as a 474-line component owning every concern.

## Build and verification

```sh
bun run build        # turbo: tsc per package; next build (standalone); cargo + wasm-bindgen
bun run typecheck    # turbo, strict TS with noUncheckedIndexedAccess + exactOptionalPropertyTypes
bun run test         # turbo → vitest per package (+ cargo test for the Rust crate)
bun run lint         # scripts/lint.mjs — bans console.log and unresolved implementation TODOs
bun run format:check
bun run bundle       # scripts/build-crafty-binary.mjs → dist/ (zone standalones + CLI + Bun)
bun run dev          # scripts/dev-next.mjs → the zone dev supervisor (base on :4173, HTTPS)
```

`bun run bundle` produces a directory, not a single executable: Crafty ships
Next zone servers, so `dist/` contains `base/` (the domain path-table app),
`web/` (the editor zone: surface + scene API), `cli/`, `node_modules/`, a
bundled `bun` runtime, and a `crafty` launcher. The launcher spawns every zone
on a loopback port behind the base app; `serve --http` turns off Crafty's own
TLS for reverse proxies (Dokploy/Traefik). Nothing needs to be installed on the
target machine. Full topology and the auth plan:
`openspec/changes/multi-zone-platform/`.

The web Rust artifact builds via `scripts/build-scene-renderer-wasm.mjs`
(`cargo build --target wasm32-unknown-unknown --release` then `wasm-bindgen
--target web`) and requires `cargo` and `wasm-bindgen` on the machine. The
native artifact builds via `scripts/build-scene-renderer-ios.sh` for
`aarch64-apple-ios` or `aarch64-apple-ios-sim`; Curiosity's local canvas pod
links ABI version 1. The native C ABI now creates a retained-layer wgpu surface
and accepts one whole `RenderFrame` per presentation. Curiosity sources that
packet from a canonical `.ui` document through `EditorKernel` and the shared
scene projection; Swift no longer authors the S1 rectangle. A physical iPad
proved the renderer presentation path; CoreSimulator reaches Vello submission but lacks wgpu's
required `INDIRECT_EXECUTION` downlevel flag. S1 records that exact unsupported
runtime blocker and no alternate renderer masks it.
