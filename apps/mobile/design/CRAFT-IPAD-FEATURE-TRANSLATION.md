# Craft on iPad: Feature Translation and Substrate Decision

Research date: 2026-08-28
Status: **Proposed architecture and normative implementation gate.** This file
records decisions and acceptance criteria; it does not claim that the iPad
translation is implemented.
Target: iPadOS 27, compatible with iPadOS 26 and resizable iPad windows.

## Decision served

Translate the existing Crafty structured visual-authoring system into Curiosity's
Expo/React Native/SwiftUI/UIKit/Metal application without creating a second
document model, weakening Crafty's command invariants, or preventing later 3D
authoring.

The decision is not "which toolbar feature should the Metal demo gain next?" It
is "which existing product subsystem owns each feature on iPad, and which Apple
framework is only an adapter or backend?"

## Evidence language

- **Documented** — established by inspected source, a primary Apple source, or
  upstream project documentation.
- **Inference** — the architectural conclusion drawn from documented evidence.
- **Unknown** — requires an ADR, implementation spike, benchmark, or physical
  accessibility audit. Unknown does not mean absent.

## Executive decision

1. **The Crafty `EditorDocument` is the one authored model.** Stable node and
   path-point IDs, pages, hierarchy, component references, semantic surfaces,
   layout intent, and future authored concepts extend that versioned model. They
   do not get parallel Swift or React Native representations. **Documented:**
   [C1][C2]
2. **The Crafty kernel is the one editing authority.** Selection semantics,
   hit testing, snapping, tools, validated invertible commands, transactions,
   clipboard planning, and history stay above every renderer. Human, Pencil,
   accessibility, collaboration, and agent inputs all dispatch through the same
   command boundary. **Documented:** [C1][C2][C3]
3. **`CanvasScene.swift` is a renderer proof, not a substrate.** Its hardcoded
   rectangles, colors, selection handles, and scene ownership must be deleted
   when the first authoritative packet-driven slice lands. It must not evolve
   into a Swift-authored scene graph. **Inference:** [C1][C5]
4. **The native canvas is an adapter and backend host.** UIKit owns raw platform
   input, Pencil capabilities, focus, text-input integration, accessibility
   projection, drag/drop, and `MTKView`. It emits inputs to the kernel and draws
   resolved packets; it never mutates authored nodes directly. **Inference:**
   [A1][A2][A3][A5][A7]
5. **Reuse the existing Rust/Vello renderer before rewriting it.** The preferred
   first spike compiles Crafty's platform-neutral Rust encoder/render core as an
   iOS static library, presents through wgpu's Metal backend and the
   `MTKView`/`CAMetalLayer`, and consumes the same versioned `RenderFrame` as the
   web host. wgpu documents Metal support on iOS; Vello uses wgpu, but its iOS
   embedding is not a polished supported integration. This is therefore a
   high-value candidate, not a ratified fact. **Documented + inference:**
   [C5][R1][R2][R3]
6. **Direct Swift/Metal is a fallback backend, not a second product.** If the
   Rust-native spike fails its gates, a Swift/Metal renderer may consume the same
   packet and parity fixtures. Product semantics, identity, history, components,
   tokens, and hit-test decisions remain outside Metal. **Inference:** [C1][C5]
7. **The current 4×4 matrix does not make Craft 3D-ready by itself.** 3D requires
   authored spatial semantics, commands, asset/material/camera records, hit
   testing, accessibility, persistence, and a resolved 3D packet. RealityKit is
   deferred until a real slice needs its scene, lighting, physics, AR, or USD
   capabilities. **Documented + inference:** [A8]

## Runtime ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| **Crafty TypeScript kernel in the mobile JS runtime** | `EditorDocument`, validation/migration, commands, transactions, history, tools, snapping, selection semantics, hierarchy, clipboard, resolution orchestration | React component state, native gesture recognizers, GPU resources |
| **Expo Router + React Native** | Curiosity shell, adaptive Craft panel composition, layers/inspector projections, subscriptions to narrow kernel slices, loading/error UI | Canonical nodes, per-pointer render loops, duplicated command logic |
| **SwiftUI through `@expo/ui`** | Native menus, pickers, buttons, toggles, sliders, and presentations where system behavior is the value | Canvas document, scene graph, custom path/text layout |
| **UIKit native canvas adapter** | Actual/coalesced/predicted/hover input collection, gesture arbitration transport, Pencil interaction, keyboard/focus bridge, `UITextView` editing overlay, accessibility elements/actions, context menus and drag/drop, `MTKView` host | Durable geometry, independent snapping, a second undo stack, persisted `PKDrawing` unless an ink node is ratified |
| **Crafty resolution stages** | Components, variables, layout boxes, text runs and other disposable values with provenance/diagnostics | Writing resolved values back into authored records |
| **Rust/Vello/wgpu Metal candidate** | Decode versioned packets, encode rect/path/text/overlay geometry, GPU resource caches, render and present, preserve the last valid frame | Product semantics, document mutation, selection decisions, accessibility semantics |
| **Direct Swift/Metal fallback** | The same backend responsibilities behind the same packet and tests | Any behavior unavailable to the Rust backend unless the protocol itself is revised |
| **`.ui` store + `UIDocument` adapter** | Canonical package snapshots, revisions, atomic publication, local Files integration and conflict surfacing | Renderer packets, selection, hover, live camera, presence |
| **Project collaboration service** | Membership, accepted operation order, snapshots, comments, and ephemeral presence transport | Silent last-writer data loss, global undo, GPU state |

### Required data flow

```text
UIKit input / keyboard / accessibility / agent / remote operation
  -> one normalized Crafty input or command boundary
  -> EditorKernel transaction + validated invertible command(s)
  -> canonical EditorDocument revision
  -> component/token/layout/text resolution
  -> versioned RenderFrame + accessibility projection
  -> Rust/Vello/wgpu-Metal candidate OR packet-compatible Swift/Metal fallback
  -> MTKView presentation

React Native and SwiftUI observe narrow projections; neither sits in the
pointer-to-pixel loop and neither becomes the document.
```

Transport is deliberately not ratified. The first spike must determine whether
Expo module events are sufficient or whether a JSI/TurboModule/C-ABI path is
needed for batched input and render packets. Changing transport must not change
the messages' semantics.

### Application-shell boundary

Craft is an artifact type inside Curiosity's content-first project hierarchy; it
is not a top-level tab. The selected Craft document owns the window by default.
The first leading reveal opens the Craft-document list and that list's leading
control opens its parent source/collection sidebar. On wide windows either
navigation column may be pinned. Craft pages, Layers, and Inspector are
artifact-local editor tools and must never be presented as the global source or
artifact navigator.

Memory is not a Craft mode or a top-level destination. Relevant evidence,
decisions, sources, and people appear through the contextual inspector and
ratified smart knowledge collections. This shell decision does not move any
authored Craft data out of `EditorDocument` or make global navigation part of
the renderer packet.

## Feature translation matrix

Every acceptance cell is binary. Performance rows require a named fixture,
recorded environment, and a distribution; no unmeasured number is a budget.

| Feature | Canonical Crafty representation and current evidence | iPad ownership and native precedent | Alternatives and decision | Accessibility, undo, and collaboration | Binary acceptance and renderer/3D implications |
| --- | --- | --- | --- | --- | --- |
| **1. Workspace, project, file, pages** | `EditorDocument` contains workspace/project/file identity, ordered pages, page roots, and per-page canvas settings. The mounted web product lists and creates local files and supports page create/switch/rename/reorder/delete. File rename/delete and real workspace/project collections remain gaps. **Documented:** [C2][C8] | RN composes source → collection → artifact navigation and page chrome; native menus present choices; kernel changes page and retains page-local session state. | Keep the canonical file/page behavior, port page management, and rebuild project/file collection UI in Curiosity's content-first shell. Do not turn router routes, Swift navigation state, or Metal scenes into files/pages. | Page and layer navigators provide a complete nonspatial route. Page changes are local session state; shared file edits remain durable operations. | Open 100-page generated fixture; changing page restores its camera/selection; serialized bytes contain no active selection. Renderer receives only the active resolved page. No top-level surface tabs appear; Craft Layers cannot replace the artifact list. 3D scenes would still belong to pages/files. |
| **2. Infinite canvas, pan, zoom, grid, guides** | Live camera is ephemeral; rest camera, grid, guides, and snap settings are per-page authored records. Coordinate conversion and clamping belong to the kernel. The mounted web route supports pan/zoom presets and shortcuts, back-to-content recovery, grid/guide rendering, strip-authored guides, and guide movement; guide deletion and per-family snap settings are implemented but unmounted. **Documented:** [C2][C3][C8] | UIKit gathers pan/pinch/wheel; kernel owns screen/world math and accepted viewport. `MTKView` resizes in device pixels. `UICanvasFeedbackGenerator` may signal accepted snaps. | Keep camera/guide semantics, port back-to-content and guide authoring, and rebuild native input/presentation. A `UIScrollView` is not authoritative camera state and must not clamp the authored world to content size. | Canvas exposes accessibility zoom actions and named zoom values. Grid is never the only positioning cue. Presence sends page/world coordinates, never another user's camera mutation. | Pan/pinch cannot create content; zoom keeps its anchor stable; resize updates drawable and projection; off-canvas content exposes recovery; guide create/move/delete round-trips; rest camera stays out of undo. 3D later adds a distinct spatial camera record. |
| **3. Selection, marquee, deep select, isolation, hit testing** | Ordered multi-selection, per-page memory, marquee, deep select, isolation, locked/hidden filtering, path-aware tests, and broad-phase infrastructure exist. Two historical hit-test paths still need convergence. **Documented:** [C2][C3] | Kernel is the only semantic hit tester. UIKit converts platform coordinates and gives precedence to accessible/visible overlay controls before forwarding. Metal draws selection only. | GPU color picking and UIKit view-per-node are rejected as identity/selection authorities. A GPU broad phase may accelerate only if exact kernel narrow-phase results remain the reference. | `UIAccessibilityElement` per semantic node exposes label, selected/locked state, Select/Edit actions and a screen-correct frame/path. Layers panel is the complete alternative. Remote selection is ephemeral and never changes local selection. | The same fixture selected by touch, Pencil, keyboard, VoiceOver action, layers row, and agent command yields the same IDs. Locked/hidden ancestors cannot leak. No triangle, grid line, handle, or remote cursor is an accessibility element. |
| **4. Move, resize, rotate, corner radius, keyboard nudge** | Eight handles, rotated handle positions, local-space resize, aspect/from-center modifiers, 15° rotate snap, corner-radius handles, multi-move, keyboard nudge, and a mounted width/height HUD are implemented through transactions/commands. Exact numeric fields exist only in the currently unmounted Inspector. **Documented:** [C2][C3][C8] | UIKit captures pointer/Pencil/key state; kernel computes geometry and modifiers; renderer draws screen-constant handles as ephemeral overlays. A rebuilt Inspector offers exact numeric entry. | Keep transform semantics and HUD information; port interactions; rebuild Inspector presentation. Native `CGAffineTransform` may be a transport type, not a second transform implementation. | Custom actions and inspector fields provide Move/Resize/Rotate without dragging. One drag is one local transaction. Remote previews are presence; only committed command batches are durable. | Opposite edge/center stays pinned under every handle and rotation fixture; cancel restores byte-identical document; one undo restores the gesture; handles remain constant in screen points. 3D gizmos require a new spatial-transform contract. |
| **5. Snapping, alignment, distribution, measurement** | Snapping and its visible evidence are UI-exposed. Six alignment actions are UI-exposed. Distribution commands are implemented but unmounted. Measurement is pure utility code with no product overlay. Per-family snap controls are implemented but unmounted. These are four independently shippable capabilities, not one availability claim. **Documented:** [C2][C3][C8] | Kernel owns candidates, ranking, alignment, distribution, and measurement results. UIKit can play system canvas alignment haptics only after an accepted snap. Metal draws bounded evidence overlays. | Keep kernel semantics; port snapping/alignment; rebuild controls and measured overlays; defer measurement UX until its interaction contract is specified. Do not reimplement thresholds in Swift or shaders. | Announce a snap only when useful and noninterrupting; exact position remains available in Inspector. Collaboration sends final geometry, not local guide animations. | Table-driven priority tests pass for every input source; hidden targets never snap; bypass applies to the current event; overlays and corrected geometry name the same decision. Alignment and distribution each have separate action/undo tests. 3D snapping is a separate family. |
| **6. Layers, hierarchy, order, visibility, lock** | Flat ID map plus parent backlink and ordered `childIds`; cycle/backlink validation; hierarchy keyboard traversal, one-step stacking, reorder/reparent, and legal drop destinations exist. A rich `LayersPanel` is implemented, but the active web route mounts only its toggle, so the panel is not a current reachable surface. **Documented + inference:** [C2][C8] | RN virtualized tree owns presentation; native context menus/drag/drop are adapters; kernel validates every reorder/reparent. | Keep hierarchy semantics and keyboard grammar; rebuild the artifact-local Layers surface. Do not port the dead-toggle composition. A nested React/Swift array must not become identity. | Tree semantics, expanded state, level, position, selected/hidden/locked values, keyboard reorder, and named Move Before/After/Inside actions are required. Reorder is one durable operation. | Canvas and Layers selection stay in sync by ID; invalid cycles/mixed targets are rejected atomically; coordinate-preserving reparent fixtures pass; 10k-node tree scrolling does not subscribe every row to pointer moves. 3D outliner can project the same identity rules. |
| **7. Groups** | `group` nodes and atomic `planGroup`/`planUngroup` command batches preserve sibling order and reject mixed parents. **Documented:** [C2] | Layers/canvas invoke the same plans; renderer resolves group transforms but draws no authored group chrome. | A visual-only selection box is not a group. Do not flatten children merely to optimize draw calls. | Group is announced as a container with item count; Enter/double-click enters, Escape exits. Group/ungroup is one undoable accepted operation. | Group then ungroup restores canonical bytes and order; cancel cannot leave a partial group; remote clients resolve identical hierarchy. 3D groups can reuse structure only after transform semantics are explicit. |
| **8. Frames, clipping, constraints, auto layout** | Frame creation atomically absorbs contained, visible, unlocked top-level siblings and rebases coordinates. Versioned auto-layout/sizing intent and Taffy evaluation are implemented; authoring controls live in the unmounted Inspector. The packet has no clipping/mask vocabulary and constraints are not end-to-end. **Documented:** [C2][C8] | Kernel/resolution owns frame absorption, layout intent, and boxes; RN Inspector edits descriptors; renderer eventually clips resolved descendants. | Keep frame/layout semantics; port frame absorption; rebuild authoring UI; defer clipping/constraints until a packet/schema ADR. `UIStackView`, SwiftUI layout, CSS, and renderer-side layout are rejected as authorities. | Frame reports layout mode and child count; exact controls are keyboard/VoiceOver operable. Remote edits transmit intent, never computed boxes. | Frame absorption preserves visual coordinates and one-step undo; nested layout produces the same resolved boxes web/iPad; authored bounds remain unchanged; clip tests cover transform nesting and overlays before clipping ships. 3D layout needs a separate model. |
| **9. Rectangle, ellipse, line, and frame tools** | All four tools are mounted. Rectangles default to a 16-unit radius; ellipses are true four-cubic closed paths; lines are true two-point open paths; frame creation has absorption semantics. Line authoring is real, but production packet emission omits its stroke, so visible realization is defective. **Documented + inference:** [C3][C5][C8] | UIKit reports normalized input; kernel reducer owns arbitration, constraints, snap, preview, commit/cancel. Metal renders preview after authored content. | Keep tool geometry and semantics; port input; repair the shared packet's stroke realization before claiming Line parity. UIKit shape layers and Swift draft objects are rejected as authored shapes. | Tool buttons have labels/shortcuts; an Inspector or command action supplies non-drag creation. Preview is local presence at most; commit is one command. | Every tool has below-threshold, cancellation, pinch interruption, modifier, snap, undo, and cross-input tests. Rect corner pixels and ellipse/path packets match; Line must remain visible after commit with explicit fill/stroke semantics. 3D primitives become new tools/effects. |
| **10. Pen, path editing, Pencil, hover** | Stable point/subpath IDs, fractional order keys, corner/free/asymmetric/mirrored/auto modes, exact bounds, point/handle hit tests, join/close/delete/move commands, pen reducer effects, and deep path overlays are UI-exposed. Joining onto an existing path has a confirmed handle-preservation defect. **Documented:** [C2][C3][C4][C8] | UIKit owns actual/coalesced samples, estimated-property correction, predicted samples, Pencil hover, double tap and squeeze. Kernel owns anchors, Bézier intent, snap, commands, and transaction. Predictions/hover draw only ephemeral overlays. **Documented precedent:** [A1][A2] | Keep the vector point model; repair join semantics before porting Pen; rebuild only the Pencil/input adapter. `PKCanvasView`/`PKDrawing` is rejected as the canonical vector pen. | Point/handle operations have named actions and Inspector coordinates. Hover never acts. Double tap/squeeze respect system settings and remain nondestructive. Only actual samples/commits may sync. | Joining preserves every pre-existing handle and point ID; actual/coalesced samples can affect the transaction; predicted samples disappear on next actual event and never serialize; cancel restores exact bytes. No Pencil property enters the document unless a future stroke schema ratifies it. |
| **11. Destructive booleans and live compounds** | Destructive union/subtract/intersect/exclude actions are UI-exposed. Live compounds store operation + ordered members, resolve a disposable outline, flatten invertibly, and have command support, but no current authoring UI; member reordering also has a confirmed correctness defect. **Documented:** [C4][C8] | Kernel performs boolean semantics; renderer consumes only the resolved path. A rebuilt Inspector/Layers surface selects live operation and member order after repair. | Keep destructive boolean semantics; port their actions; repair and then expose live compounds. Metal, Core Graphics, and RealityKit may render an outline but must not decide topology. | Operation and operand count/order are announced. Remote operations require stable operand IDs and explicit precondition failure, never silent repair. | Canonical fixtures match web results; open/area-less/mixed-parent failures keep bytes unchanged; compound member reorder changes order exactly once and undo restores exact members/IDs. Future 3D CSG is separate. |
| **12. Paint, stroke, effects, blend, glass** | Scalar selection/creation fill and stroke controls and number-key opacity are mounted. Rounded-rectangle projection and Vello encoding are implemented. The low-level protocol can stroke paths, but production rect/path commands omit authored stroke descriptors; gradients, multiple paints, shadows, masks, blend modes, and clipping lack packet vocabulary. Glass is bounded renderer/chrome experimentation, not a general content paint. **Documented + inference:** [C2][C5][C8] | Inspector uses native color/control presentations. Resolution turns ratified token references into values. Renderer owns raster/composite realization only. | Keep scalar authored fields and rounded corners; repair fill/stroke packet semantics; defer advanced paint/effects until ADR. Content-layer Liquid Glass is prohibited. | Every style has a textual value and noncolor state cues. Style edits are commands; remote edits carry intent/token binding. | First gate defines rect/path/open-path fill-plus-stroke semantics and passes pixels for opacity, width, cap, join, and corner radius. Advanced paint ships only after versioned schema and cross-backend fixtures. 3D materials are separate typed records. |
| **13. Images and assets** | `image` kind exists but canonical asset reference, decode/upload, crop/fit, package blob, and renderer path are incomplete. **Documented:** [C2][C5] | UIKit supplies photo/file pickers and permissions; asset service validates metadata and hashes bytes; renderer decodes/uploads disposable textures. | Base64 in document JSON, `UIImage` identity, Photos identifiers as permanent identity, and unbounded texture residency are rejected. | Image node exposes alt description/role and crop actions; missing asset is explicit. Clipboard/collaboration transfer a content-addressed reference plus availability state. | Import, rotate/crop/fit, missing/corrupt, memory-pressure eviction, package round-trip, and accessibility fixtures pass. 3D textures can reuse content addressing, not 2D crop semantics. |
| **14. Text model, shaping, typography, rendering** | Text node owns plain content; bounded embedded-Inter outline rendering exists. Font intent, itemization, bidi, shaping, line breaking, fallback, cluster maps, rich runs, and full fidelity remain open. **Documented:** [C2][C6] | Shared resolver must produce glyph/line/cluster geometry. Core Text is a native conformance oracle and possible resolver only after a parity/portability ADR; Metal/Vello draws resolved runs. **Documented precedent:** [A4] | Hidden DOM/canvas measurement, RN `Text` measurement, and separate web/iPad layout are rejected as silent authorities. Atlas vs vector realization remains measured. | Logical text and cluster maps drive reading, caret, selection, hit testing and remote ranges. Typography edits are invertible commands; resolved glyphs never sync. | Multiscript/bidi/ligature/emoji/variable-font/fallback/line-break fixtures record content, clusters, lines and pixels on both targets. No rich-text UI before the font/cluster schema and resolver pass. 3D text consumes resolved glyphs as geometry or texture without changing authored content. |
| **15. Text editing, IME, Scribble, selection** | `focusedId` and plain-text command exist; production caret, ranges, composition, grapheme movement, typing coalescence and editing mode remain incomplete. **Documented:** [C6] | UIKit `UITextView`/TextKit 2 owns first-responder, marked text, keyboard, Scribble, edit menu, caret/range presentation and accessibility during editing. Kernel owns committed content/ranges and undo units. **Documented precedent:** [A3] | A custom Metal IME or invisible RN `TextInput` is rejected as the first approach. The native overlay must not become an unsynchronized second string. | Native text view supplies granular VoiceOver navigation. Composition stays ephemeral/local; only committed text commands sync. Remote caret mapping waits for collaboration text semantics. | CJK composition, dead keys, dictation, Scribble, grapheme deletion, bidi arrows, selection, paste, Escape/blur, dynamic type, zoom/rotation placement, and one-word undo fixtures pass. Overlay and rendered cluster geometry stay aligned. |
| **16. Components, instances, variants, tokens, libraries** | Local component instances resolve in the production kernel with deterministic IDs, provenance, and sparse supported overrides; definition/instance/detach commands exist. Variant/state maps, variables, and library pins are foundation only: current resolution does not consume their full intent, and no authoring UI is mounted. **Documented + inference:** [C2][C8] | Kernel resolves references/intent; RN Layers/Inspector present provenance and overrides; renderer sees expanded values only. | Keep and later port local component resolution; rebuild authoring UI; defer variants, token resolution, and remote libraries until their resolvers and failure contracts exist. Detached copies, native view components, and GPU token lookup are rejected. | Instance boundaries constrain selection; properties and override state are announced. Stable IDs and sparse deltas are collaboration anchors. | Definition edit updates every instance projection without rewriting instance bytes; missing/stale/orphaned references diagnose; clipboard and package round-trip IDs/provenance. Variant/token/library claims require resolved-value fixtures, not schema presence. |
| **17. Inspector, toolbars, menus, context actions** | The active route mounts history, panel toggles, zoom, seven tools, colors, pages, selection actions, keyboard bindings, command palette, and context menu. The exported Inspector/Layers/floating panel implementations are not composed, so their visible toggles are dead. Snap settings, gesture sensitivity, status, states, and manual scene actions are also unmounted. **Documented + inference:** [C1][C2][C8] | RN owns adaptive artifact-local panel composition; `@expo/ui` SwiftUI controls and UIKit menus/commands provide system behavior; narrow kernel subscriptions prevent pointer-move rerenders. | Keep command/action coverage; port useful mounted actions; rebuild Layers/Inspector for iPad; reject dead toggles and legacy/debug surfaces as precedent. | Reading order follows visible navigation, artifact content, then contextual Inspector; labels, values, validation, and shortcuts are explicit. Equivalent actions exist outside gestures. | Every visible toggle opens a real surface; every field dispatches the same command as canvas manipulation; external replacement updates controls; global artifact navigation and Craft-local panels remain distinct; no unrelated drag rerenders a panel in the measured fixture. |
| **18. Undo, redo, transactions, cancellation** | Every mutation validates and returns an inverse; continuous gestures preview in one transaction; batches are atomic; undo restores selection but not live camera. History is currently process-local and unbounded. **Documented:** [C1][C2] | Kernel remains sole history owner. Native `NSUndoManager` can expose menu/system integration only as an adapter to kernel actions, not keep another stack. | Native view undo registration and React state snapshots are rejected as authorities. History bounding/coalescing requires explicit policy and tests. | Accessible Undo/Redo and keyboard commands expose labels. In collaboration, local undo becomes a new inverse operation against accepted state; it never rewinds other actors. | One gesture/typing unit equals one history entry; cancel is byte-identical; failed atomic batch records nothing; page behavior matches current tests. Collaboration undo/rebase remains **Unknown** until ADR. |
| **19. Clipboard, paste, drag/drop** | Internal copy, preview-first paste, paste-at-point, paste-in-place, duplicate, reminting/remapping, and diagnostics are UI-exposed or implemented. The browser writes a MIME-tagged textual payload through `navigator.clipboard`; it does not install a true custom OS MIME item. Drag/drop and ordinary text/image interoperability are gaps. **Documented:** [C2][C8] | UIKit `UIPasteboard`, `UIDragInteraction`, `UIDropInteraction` and item providers adapt OS transfer; kernel validates/parses/plans insertion. | Keep clipboard planning; port paste semantics; rebuild OS type/item-provider integration; defer image transfer to the asset slice. Archiving Swift objects or copying resolved/GPU state is rejected. | Drag/drop points and Paste actions are exposed to assistive tech. External/untrusted payloads fail closed. Paste is one accepted operation with diagnostics. | Cross-app native type plus safe text fallback, paste-in-place, missing component, malformed data, semantic link, path ID and undo fixtures pass. A prefixed string alone does not satisfy native-type acceptance. |
| **20. Infinite-canvas performance and failure recovery** | The protocol supports full/batch packets, changed IDs, dirty regions, bounded glass resources, and WebGPU recovery; rect commands are viewport culled while selected geometry is retained. A 10k-rectangle fixture exists. Path/text culling, bounded history, workers, and native latency/memory evidence remain gaps. **Documented:** [C5][C8] | Kernel emits dirty IDs; renderer uses viewport culling, caches keyed by stable IDs, bounded overlays/resources and event-driven `MTKView` drawing when idle. UIKit collects high-fidelity input without driving RN rerenders. | Keep packet/recovery contracts; port proven culling rules; rebuild native lifecycle integration. No invented FPS/latency budget, unbounded cache, per-node bridge call, or fallback with different semantics. | Accessibility projection must also be measured and virtualized without hiding the complete Layers route. Device loss never loses edits. | Generated wide/deep/text/image fixtures record median+p95 input-to-pixel, frame, memory, load/save and recovery on Sterling's iPad. Device loss preserves document and last valid frame. 3D gets separate fixtures and budgets. |
| **21. GPU-object accessibility and focus** | Crafty has semantic IDs and hierarchy but no native canvas accessibility projection. **Documented gap:** [C2] | `MTKView` is an accessibility container with disposable `UIAccessibilityElement`s keyed by node ID; UIKit supplies frames/paths, traits, values, custom actions, zoom, ordering and focus. **Documented precedent:** [A5][A6] | One accessibility element for the entire canvas is insufficient; one per triangle/handle is wrong; invisible mirror views that become state owners are rejected. | Layers provide complete traversal; canvas projection follows current page/isolation and exposes selected/locked/component/text semantics. Actions dispatch kernel commands. | Physical VoiceOver, Voice Control, Switch Control, Full Keyboard Access, AX5, Reduce Motion/Transparency, Increase Contrast and Assistive Access audits pass. Selection and geometry remain correct after pan/zoom/rotate. |
| **22. Persistence, migration, import/export** | `.ui` directory packages store canonical sorted `EditorDocument` bytes in immutable revision entries, publish the manifest last, check expected revision, reject unknown versions, and import `.pen`. The mounted web route autosaves with debounce and stale-revision retry. Manual save/reload/status and browser picker flows are unmounted or absent. **Documented:** [C7][C8] | Keep the existing store as format authority. Rebuild only the native package codec/`UIDocument` bridge for coordinated async I/O, safe save, Files integration, autosave, and explicit conflicts. **Documented precedent:** [A9] | Core Data/SwiftData rewrite, renderer-packet storage, silent latest-wins, and a mobile-only format are rejected. | Save/conflict state is announced; autosave does not steal focus. Presence/selection never serialize. Shared conflicts require deliberate merge or user choice. | Web-created package opens/saves on iPad and vice versa byte-canonically; crash/torn-write, stale revision, migration, unknown version, Files/provider round-trip and offline restore fixtures pass. 3D assets extend package roles/versioning. |
| **23. Durable collaboration and local drafts** | Stable IDs, invertible transactions, local gesture/agent previews, and stale whole-document persistence detection are prerequisites, not a collaboration protocol. The collaboration ADR is only Proposed; the repository `scene-sync` work is non-production and currently fails to build, so it is not implementation evidence. **Documented:** [C1][C2][C8] | Project service owns membership and accepted operation order. Proposed envelope: operation ID, actor, project/file, base revision, command batch and resulting server revision. Local previews/drafts remain local until commit. | Defer implementation until an ADR selects ordering/merge/rebase/undo semantics. CloudKit, WebSocket, CRDT, OT, and server serialization remain provider/merge alternatives; CloudKit does not supply Crafty semantics. **Unknown:** [A10] | Undo is actor-local inverse work; conflicts surface; no participant can mutate another's camera/selection. Offline queue/rebase and text concurrency require ADR tests. | Two-client deterministic replay, idempotency, disconnect/reconnect, stale base, rejected precondition, offline queue, local undo after remote edit and snapshot compaction suites pass before calling Craft collaborative. |
| **24. Presence, shared cursors, selections, comments** | No authoritative backend model exists. **Documented gap.** | Presence channel carries actor/session, file/page, world cursor, selection IDs, viewport metadata and expiry; it is ephemeral. Proposed comment threads are durable project records anchored to page/world, node ID, or supported subobject ID, with explicit orphan state. | Presence in `EditorDocument`, cursor nodes, comment text in node metadata, and navigation-coupled presence are rejected. | Remote identity never relies on color alone; cursors are hidden from the accessibility traversal but summarized on request. Comments are normal accessible content with author/time/status. | Presence expiration, rate/coalescing, page transforms, hidden actor, deleted anchor/orphan, resolve/reopen, permissions, offline comment and screen-reader suites pass. Renderer receives bounded cursor overlays only. |
| **25. Agent and code-driven editing** | A transport-neutral local command-room adapter supports capabilities, revisions, bounded queries/commands, idempotency, previews, commit/rollback, receipts, and activity overlays. Semantic records and source-map utilities exist. No active-route chat, transport, command-room instance, code generation, or user action makes this a discoverable product feature. **Documented + inference:** [C1][C2][C8] | Future contextual Chat/agent UI requests commands; kernel validates the same operations as human input; native canvas shows bounded ephemeral activity overlays only. | Keep the command-room and semantic foundations; defer product exposure until transport, permissions, review, and audit are designed. Agent-only mutation APIs, raw replacement, and GPU-side generation are rejected. | Agent changes are labeled, reviewable, cancellable and announce meaningful completion; permissions apply identically. Collaboration records actor type without weakening checks. | Equivalent human/agent command batches produce identical canonical bytes; denied/expired/cancelled requests leave no partial edit; an audit links operation to resulting revision. Foundation code alone does not pass product acceptance. |
| **26. 2D-to-3D evolution** | Current document is 2D affine. SIMD3 vertices/depth/4×4 projection exist only in the provisional Swift renderer. **Documented:** [C2] | A future ADR defines spatial node kinds, transform representation, mesh/curve assets, materials, lights, cameras, units, selection and resolved packet. Metal remains viable; RealityKit becomes a backend candidate for PBR/physics/AR/USD. **Documented precedent:** [A8] | Reinterpreting 2D matrices as 3D, storing RealityKit entities, or adding `z` ad hoc to every node is rejected. | 3D objects need semantic summaries, hierarchy, named camera views, nonspatial transform controls and keyboard/assistive alternatives to gizmos. | No 3D implementation before schema/command/package/protocol/accessibility ADR. First slice round-trips one primitive, camera, material, selection, transform, undo, export and two-client replay without altering 2D bytes. |

## Consolidated current-web baseline and disposition

Availability and translation are separate axes:

- **Exposed** means reachable from the mounted `/editor/[slug]` route.
- **Implemented** means operational code exists but the route does not expose it.
- **Foundation** means a schema, command, evaluator, or utility seam exists without
  an end-to-end user flow.
- **Gap** means the required product path is absent or materially unrealized.
- **Keep** preserves canonical Crafty semantics or storage.
- **Port** exposes kept behavior through iPad input and chrome adapters.
- **Rebuild** creates an iPad-specific projection, host, or OS integration against
  the same canonical contract.
- **Defer** prohibits product work until the named gate or ADR passes.

`Keep` never means copying web UI. `Rebuild` never authorizes a second document,
command implementation, hit tester, history stack, or renderer-specific product
model.

| # | Capability | Current web status | iPad decision | Order/dependency |
| ---: | --- | --- | --- | --- |
| 1 | Local files and pages | File list/create and complete page management are **Exposed**; file rename/delete and workspace/project collections are **Gaps**. | **Keep + Port** pages and file identity; **Rebuild** content-first project/collection/artifact navigation. | P1 after rectangle; no top-level tabs. |
| 2 | Canvas camera, grid, guides | Pan/zoom, presets, back-to-content, guide create/move are **Exposed**; guide delete/snap settings UI is **Implemented**. | **Keep + Port** camera/guides; **Rebuild** native input and adaptive controls. | P1; native host depends on G1. |
| 3 | Selection/hit testing | Single/additive/marquee/deep selection, isolation, filtering, and overlays are **Exposed**. | **Keep + Port** exactly; renderer only visualizes. | P0 for one rectangle, P1 for complete grammar. |
| 4 | Transform editing | Move/resize/rotate/radius/nudge and dimensions HUD are **Exposed**; numeric fields are **Implemented** in the unavailable Inspector. | **Keep + Port** transforms; **Rebuild** Inspector and accessibility actions. | P0 rectangle, then P1 multi-selection. |
| 5a | Snapping | Grid/guide/object/rhythm/path snapping and evidence are **Exposed**; settings UI is **Implemented**. | **Keep + Port**; native haptics follow accepted kernel decisions only. | P1. |
| 5b | Alignment | Six actions are **Exposed**. | **Keep + Port** actions. | P1. |
| 5c | Distribution | Commands are **Implemented**, with no mounted caller. | **Keep + Port** only after direct command tests and an accessible action surface. | P1/P2. |
| 5d | Measurement | Pure utilities are **Foundation** only. | **Defer** until overlay, units, and accessibility behavior are specified. | P2 ADR/design note. |
| 6 | Layers/hierarchy/order/visibility/lock | Keyboard hierarchy/stacking is **Exposed**; rich panel is **Implemented** but unavailable. | **Keep** hierarchy; **Rebuild** artifact-local Layers. Reject dead-toggle behavior. | P1; verify reparent coordinates first. |
| 7 | Groups | Group/ungroup are **Exposed**; atomic plans are implemented. | **Keep + Port** after transformed-parent fixtures pass. | P1. |
| 8 | Frames/layout/clipping/constraints | Frame absorption is **Exposed**; auto-layout evaluation is **Implemented**; authoring UI is unavailable; clipping/constraints are **Gaps**. | **Keep + Port** frame/layout; **Rebuild** controls; **Defer** clipping/constraints to packet ADR. | P2. |
| 9 | Rect/ellipse/line/frame tools | All are **Exposed**; ellipse and radius are real; committed Line realization is **Defective** because stroke is omitted. | **Keep + Port** tools; repair shared stroke packet before Line acceptance. | Rect in P0; all tools in P2 after B2. |
| 10 | Pen/path editing/Pencil | Deep Pen/path editing is **Exposed**; native Pencil features are a **Gap**; join handle preservation is **Defective**. | **Keep** path model; repair join; **Rebuild** UIKit Pencil/hover adapter. | P2 after B2 and defect repair. |
| 11 | Booleans/compounds | Destructive booleans are **Exposed**; live compounds are **Implemented** without UI and reorder is **Defective**. | **Keep + Port** destructive actions; repair then expose compounds. | P2. |
| 12 | Paint/stroke/effects | Scalar color/opacity and rounded corners are **Exposed**; stroke realization is **Defective**; advanced paints/effects are **Gaps**. | **Keep** scalar intent; **Rebuild/repair** packet realization; **Defer** advanced model to ADR. | B2 then P2; advanced P3. |
| 13 | Images/assets | `image` kind is **Foundation**; import, references, package blobs, decode/upload, crop/fit are **Gaps**. | **Defer**, then **Rebuild** asset service, OS import, package role, and texture path. | P3 after B4. |
| 14 | Text model/rendering | Loaded plain text has bounded outline rendering; production shaping/typography and a text tool are **Gaps**. | **Keep** canonical string; **Defer** richer authoring until text ADR/resolver; then **Port** resolved packets. | P3 after B5. |
| 15 | Text editing/IME/Scribble | Plain property mutation is **Foundation**; canvas editing is a **Gap**. | **Rebuild** with UIKit/TextKit overlay only after range/cluster contract. | P3 after row 14. |
| 16 | Components/variants/tokens/libraries | Local component resolution is **Implemented**; full variants/tokens/libraries and authoring UI are **Foundation/Gaps**. | **Keep + Port** local resolution later; **Rebuild** authoring; **Defer** unresolved systems. | P3. |
| 17 | Inspector/toolbars/menus/actions | Broad tool/command/context surfaces are **Exposed**; Layers/Inspector toggles are dead; several debug/settings surfaces are unmounted. | **Port** useful actions; **Rebuild** iPad panels; **Reject** dead toggles and debug/legacy UI as product precedent. | P0 minimal Inspector, P1 full core chrome. |
| 18 | Undo/redo/transactions/cancel | Core behavior is **Exposed/Implemented**; history is process-local, unbounded, and unpersisted. | **Keep + Port** as sole history authority; **Defer** collaborative/bounded policy to explicit design. | P0 and every later slice. |
| 19 | Clipboard/paste/drag/drop | Rich internal clipboard is **Exposed/Implemented**; true OS type, drag/drop, and ordinary interoperability are **Gaps**. | **Keep** planning; **Rebuild** `UIPasteboard`/item-provider integration; defer image payloads to assets. | P1, then P3 assets. |
| 20 | Performance/recovery | Rect culling, batch protocol, recovery, diagnostics, and 10k fixture are **Implemented/Exposed**; native evidence and broader culling are **Gaps**. | **Keep** packet/recovery contracts; **Rebuild** native lifecycle/caches and measure rather than assume. | G1 and continuous gates. |
| 21 | GPU-object accessibility/focus | Canvas exposes one generic element; semantic object projection is a **Gap**. | **Rebuild** UIKit accessibility projection keyed by canonical IDs; keep Layers as complete route. | One rectangle in P0; virtualization in P1/P2. |
| 22 | Persistence/migration/import/export | Canonical `.ui`, autosave, revisions, snapshot and `.pen` import are **Implemented**; native Files/package integration is a **Gap**. | **Keep** format/store; **Rebuild** shared package codec plus controlled `UIDocument` writer. | P0 read/save, full B3 gate in P1. |
| 23 | Durable collaboration/drafts | Only prerequisites and proposed documents exist; `scene-sync` is non-production and does not build. | **Defer** until ordering/merge/rebase/offline/undo ADR. | P4 after B6. |
| 24 | Presence/cursors/comments | **Gap**; only proposed ephemeral concepts exist. | **Defer**, then build separate ephemeral presence and durable comment models. | P4 after row 23. |
| 25 | Agents/code-driven editing | Command-room, activity, semantics, and source-map seams are **Foundation/Implemented** without a product caller. | **Keep** foundations; **Defer** exposure until transport, permission, review, and audit contracts. | P4; never bypass kernel. |
| 26 | 3D | Authored schema, tools, packets, and interactions are **Gaps**. | **Defer** entirely until named slice and full ADR. | P5 after B8. |

### Independently tracked capabilities the 26-row matrix had collapsed

| Capability | Current evidence | Decision |
| --- | --- | --- |
| Command palette/action discovery | ⌘K exposes tools, camera, history, grouping, alignment, and order. | **Port** as system commands/search, resolving keyboard precedence before P1 acceptance. |
| Back-to-content recovery | Mounted when no visible content intersects the viewport. | **Keep + Port** in P1; include keyboard and accessibility action. |
| Selection dimensions HUD | Mounted width/height feedback. | **Keep** information; **Port** a non-obscuring HUD and mirror values in Inspector/VoiceOver. |
| Duplicate semantics | Ordinary duplicate, smart repeat-offset duplicate, and Alt-drag are distinct. | **Keep + Port** all three; test them independently rather than naming one generic Duplicate. |
| Hierarchy keyboard grammar | Enter/Tab/Escape traverse child/sibling/parent; command/double-click deep-select. | **Keep + Port** with Full Keyboard Access focus tests. |
| Frame absorption | Creation absorbs and rebases contained eligible siblings. | **Keep + Port** only after world-coordinate and undo fixtures pass. |
| Rounded rectangle creation | Default radius and direct corner handles are active; renderer carries/encodes radius. | **Keep + Port**; remove all stale “corner rendering gap” claims. |
| Guide authoring versus snap evidence | Strip creation/movement and ephemeral accepted-snap evidence are separate. | **Port** both as separate behaviors; only authored guides serialize. |
| Stroke authoring versus realization | UI authors scalar stroke; low-level encoder can stroke; production packets omit it. | **Repair** protocol/projection before porting Line or claiming stroke parity. |
| Destructive booleans versus live compounds | Destructive menu actions are mounted; live compounds are not. | **Port** destructive first; **Defer** compound UI until member reorder is repaired. |
| Native clipboard typing | Web uses a MIME-prefixed string, not a true custom OS item. | **Rebuild** with declared native type plus safe text fallback; do not copy the limitation. |
| Panel toggle versus panel availability | Layers/Inspector toggles mount but panels do not. | **Reject** dead toggles; every iPad toggle must reveal a real, accessible surface. |
| Agent transaction foundation | Local service is transport-neutral and has no active product caller. | **Keep + Defer**; do not advertise as agent editing. |
| Animation/prototyping evaluator | Pure trigger/action/tween/spring evaluator is **Foundation** with no persisted connection flow or caller. | **Defer** until interaction schema, authoring, playback, accessibility, and export have a product slice. |
| Legacy snapshots/states | Unmounted `StatesPanel` edits legacy Story overrides, not component states. | **Defer migration decision**; do not port as the component-state model. |
| Account sheet | Static “Crafty / Signed in” presentation only. | **Reject as auth precedent**; Curiosity account and sharing remain shell/service concerns. |

### Defect and risk register

| ID | Finding | Required disposition | Binary closure evidence |
| --- | --- | --- | --- |
| D1 | Production rect/path projection omits authored stroke; open Line can disappear and fill/stroke semantics are incomplete. | Fix at shared schema/projection/packet boundary before native Line/Pen parity. | Filled, stroked, fill+stroke, and open-path fixtures match recorded web/iPad packets and pixels for width/cap/join/opacity. |
| D2 | Joining a Pen session to an existing path loses existing handle intent. | Root-cause and repair canonical Pen join; do not patch only native input. | Join fixtures retain all prior point IDs/types/handles; cancel is byte-identical; undo/redo restores both states. |
| D3 | Live compound member reordering is incorrect. | Repair command/plan and inverse before exposing compound UI. | Move first/middle/last in both directions; resolved outline follows order; one undo restores exact canonical bytes. |
| D4 | Active web Layers and Inspector buttons toggle state without mounted panels. | Do not port; rebuild reachable artifact-local panels and remove dead states from acceptance precedent. | Every visible toggle reveals, focuses, dismisses, and restores a real panel at every supported width. |
| D5 | Shortcut precedence lets broad handlers win over more specific combinations. | Centralize/table-drive command resolution before porting the keyboard map. | Every registered chord invokes exactly one expected command under all modifier combinations; text input/composition consumes editing keys first. |
| D6 | Group/reparent coordinate preservation is likely wrong under transformed parents. | Treat as blocking risk for hierarchy/frame port and fix the canonical plan if reproduced. | Reparent/group/ungroup across translated/rotated/scaled parents preserves world geometry and order; cancel/undo restore exact bytes. |
| D7 | Native `CanvasScene.swift` owns hardcoded product-looking geometry. | Replace only with passing packet-driven rendering; add no features to it. | Canonical rectangle renders with no authored geometry, color, selection, or handle state owned by `CanvasScene.swift`. |

## Renderer decision gate

The preferred Rust/Vello native route is accepted only if one bounded spike
passes S0–S6. Simulator evidence can accelerate build/debug, but every lifecycle,
pixel, recovery, latency, and memory claim below requires Sterling's physical
iPad:

| Step | Pass condition |
| --- | --- |
| **S0 — Factor and link** | Existing Rust encoder is factored without changing recorded web packet fingerprints; an arm64 iOS static library links through a documented C ABI in simulator and device Release builds. |
| **S1 — Present one packet** | wgpu Metal presents a versioned canonical rectangle packet through the existing `MTKView`/`CAMetalLayer`; no hardcoded scene value contributes to the frame. |
| **S2 — Fixture and pixel parity** | Rect, rounded-rect, path, overlay, and bounded text-footprint fixtures are accepted by web and iPad; comparisons record scale, color space, reference device, tolerance, and raw diff output. |
| **S3 — Surface lifecycle** | Resize, window scale, appearance, background/foreground, drawable replacement, and repeated mount/unmount preserve the document and resume valid presentation without duplicate renderer ownership. |
| **S4 — Recovery** | Memory warning and simulated/real device-loss paths preserve authored state, surface a bounded diagnostic, and retain or restore the last valid frame without process restart when the platform permits. |
| **S5 — Latency and memory evidence** | The 10k fixture records build mode, OS, hardware/GPU, sample count, median and p95 frame time and input-to-pixel latency, peak/steady memory, and recovery time. A budget is proposed only from this distribution. |
| **S6 — Boundary audit and decision** | No Swift-authored scene records, product semantics, independent hit testing, or per-node bridge calls were introduced. The spike report records **accept Rust/Vello/wgpu** or the exact failed check that triggers a packet-compatible Swift/Metal fallback. |

If any check fails, record the failure before choosing direct Swift/Metal. The
fallback must still consume `RenderFrame`, pass the same semantic/parity suite,
and keep full rebuild as the correctness reference.

## Prioritized parity sequence and release gates

Order is dependency-driven, not a delivery estimate. A tranche can be designed
earlier, but cannot claim implementation acceptance while its predecessor or
named blocker is open.

| Gate | Included work | Binary acceptance |
| --- | --- | --- |
| **G0 — Kernel portability** | Import the kernel-only package into Expo/Hermes; isolate browser globals behind adapters rather than porting semantics to Swift. | **PASSED 2026-08-28.** Mobile loads `crafty-kernel-portability.ui`, executes cancel/move/undo/redo/canonical serialization through `@crafty/editor/kernel`, and matches the built web kernel's bytes. The bundled Release/Hermes app reports `CRAFTY KERNEL / VERIFIED` on the iPad mini simulator and builds, installs, and launches on Sterling's physical iPad mini. |
| **G1 — Packet renderer S0–S6** | Run the bounded Rust/Vello/wgpu iOS spike above and record an accept/fallback decision. | **PASS** only when S0–S6 all pass. **FAIL** records the exact failed check and starts a packet-compatible Swift/Metal spike; it does not authorize more `CanvasScene.swift` product work. |
| **P0 — Canonical rectangle** | Load one canonical rectangle from `.ui`; packet-render it; select, move, resize, rotate, inspect, save, relaunch, undo/redo, and accessibility-operate it. Include the content-first Craft artifact shell without top-level tabs. | **PASS** only when touch/pointer, keyboard, Layers, VoiceOver custom action, and agent-equivalent command select the same ID; each transform is one transaction; cancel is byte-identical; save/relaunch preserves canonical bytes; web/iPad packets match; one object has a correct accessibility frame/path; `CanvasScene.swift` owns no product geometry. |
| **P1 — Core 2D editor** | Files/pages; camera and back-to-content; multi/deep selection and isolation; core Layers/Inspector; hierarchy/groups; guides; snapping/alignment/distribution; command palette/menus; duplicate modes; clipboard; native `.ui` package handling; performance/accessibility virtualization. | **PASS** only when D4–D6 are closed or explicitly excluded by a narrower slice; all visible controls work at supported widths; page/artifact navigation is distinct from editor-local panels; transformed hierarchy preserves world geometry; 10k tree/canvas fixtures and Files/provider recovery meet recorded budgets. |
| **P2 — Vector, frame, and layout fidelity** | Repair stroke semantics; shape tools; Pen/path editing with Pencil/coalesced/predicted/hover input; destructive booleans; repaired live compounds; frame absorption; auto-layout controls; then clipping/constraints if their ADR passes. | **PASS** only when D1–D3 are closed; Line remains visible; Pen join preserves handles; predictions never serialize; compounds reorder/undo exactly; layout packets match web; clipping is not claimed before transformed clip/overlay fixtures pass. |
| **P3 — Rich content and design systems** | Text schema/resolver/display, then TextKit editing/IME/Scribble, then rich runs; image/package assets; advanced paint/effects; local components/overrides, then tokens/variants/libraries. | **PASS** per independent ADR-backed slice. Text requires multiscript cluster/line/pixel parity and native editing tests; assets require content-addressed package/pressure/corruption tests; component systems require provenance and missing/stale reference diagnostics. Schema-only records do not count. |
| **P4 — Connected work** | Durable collaboration first; then offline queue/local undo, presence/cursors/comments; then permissioned agent/code-driven editing and activity. | **PASS** only after two-client deterministic replay, idempotency, reconnect/rebase, local undo after remote work, permission denial, comment orphaning, and agent audit/rollback suites pass. `scene-sync` and local command-room foundations are not acceptance evidence. |
| **P5 — Authored 3D** | One named product slice with spatial schema, commands, packages, accessibility, renderer packet, selection, transforms, materials/camera, export, and collaboration semantics. | **PASS** only when the full slice round-trips and replays without changing existing 2D bytes. A 4×4 matrix, depth buffer, or RealityKit entity alone fails. |

### P0 canonical rectangle checklist

The first functional slice is intentionally complete rather than broad:

1. Open one web-generated canonical `.ui` package through the shared codec.
2. Project one authored rectangle into a versioned `RenderFrame` and draw it with
   the G1-selected backend.
3. Select by canonical kernel hit test; render hover/selection/handles as
   ephemeral overlays.
4. Move, eight-handle resize, and rotate using kernel transactions; expose exact
   values through a minimal artifact-local Inspector.
5. Expose the rectangle as one semantic accessibility element with Select, Move,
   Resize, and Rotate alternatives, and as one synchronized Layers row.
6. Save through the controlled native package writer, terminate, relaunch, and
   load the same canonical authored bytes.
7. Verify one-step undo/redo for each committed gesture and exact rollback for
   cancellation.
8. Compare canonical bytes and packet fingerprints against web; record pixels on
   the physical iPad.

Anything that does not help this checklist or G1 is out of scope for the next
implementation move. In particular: no Line/Pen workaround in Swift, no advanced
paint, no collaboration veneer, no 3D, and no new feature in `CanvasScene.swift`.

## Blocker register

| ID | Blocks | Decision required to unblock |
| --- | --- | --- |
| **B1 — Native renderer** | P0 and every visible editor slice | Complete S0–S6 and select Rust/Vello/wgpu or packet-compatible Swift/Metal from evidence. |
| **B2 — Fill/stroke protocol** | Line, Pen visual parity, advanced vector pixels | Ratify open/closed path fill+stroke semantics, rect stroke behavior, cap/join/width/color/opacity representation, packet versioning, and parity fixtures. |
| **B3 — Native `.ui` package I/O** | Durable P0 save/relaunch and P1 Files behavior | Share the package codec; define the controlled `UIDocument` writer, manifest publication, coordination/conflict UX, provider behavior, crash/torn-write tests, and no account-specific committed data. |
| **B4 — Paint/assets/clipping** | Images, masks/clips, gradients/effects | ADR covers versioned paints, asset references/package blobs, crop/fit, decode/upload/cache limits, clip/mask order, diagnostics, and migration. |
| **B5 — Text** | Production text tools/editing | ADR covers font identity/fallback, shaping/line breaking, rich-range and cluster indexing, resolver ownership, packet glyph runs, and TextKit mapping. |
| **B6 — Collaboration** | Durable multi-user editing, presence/comments, connected agents | ADR selects accepted ordering, conflict/rebase, local undo, offline queue, snapshots/compaction, permission and provider contracts; production implementation must build. |
| **B7 — Large-page accessibility** | Claiming complete accessibility/performance parity | Define semantic projection eligibility, ordering, focus retention, virtualization window, Layers fallback, update coalescing, and physical assistive-technology fixtures. |
| **B8 — Authored 3D** | Any 3D product implementation | ADR defines spatial schema, transforms/units, assets/materials/lights/cameras, commands, hit testing, package roles, resolved packet, accessibility, export, and backend criteria. |

## Mandatory tests for every feature slice

A feature is not translated because it appears in the toolbar. Each slice must
include:

- canonical document round-trip and unknown-version rejection where relevant;
- valid command, exact inverse, no-op honesty, failed-precondition atomicity,
  undo and redo;
- pointer/Pencil/keyboard/accessibility/agent equivalence for supported actions;
- gesture threshold, cancellation, pinch interruption and tool-switch rollback;
- web/iPad resolved packet parity plus recorded pixels where it draws;
- VoiceOver, Voice Control, Switch Control and Full Keyboard Access behavior;
- collaboration replay/idempotency behavior once collaboration exists;
- named stress fixture and measured distribution when a performance claim is
  made;
- renderer failure preserving authored state and the last valid frame.

## Unknowns requiring ADRs or spikes

1. **B1:** batched native transport and Rust/Vello/wgpu iOS product viability
   versus packet-compatible Swift/Metal. Kernel portability itself passed.
2. **B2:** one versioned fill/stroke contract across rect, closed path, and open
   path production projection and both renderer backends.
3. **B3:** shared native package codec, controlled `UIDocument` writer,
   coordinated Files/provider behavior, crash recovery, and conflict UX.
4. **B4:** paint model, clipping/masks, image assets, package blob roles, and
   bounded decode/GPU residency.
5. **B5:** text font model, shaper/line breaker, fallback, rich-range/cluster
   indexing, glyph realization, and native editing mapping.
6. **B6:** collaboration ordering/merge/rebase, local undo under concurrency,
   offline behavior, permissions, and provider.
7. **B7:** accessibility element virtualization and focus retention for very
   large pages.
8. **B8:** authored 3D semantics and RealityKit-versus-direct-Metal backend
   criteria.

## Curiosity pass

**GO — native Rust renderer reuse.** Decision relevance and expected value are
high: wgpu documents an iOS Metal backend, Crafty already uses Vello/wgpu, and
reuse could preserve one encoder, path implementation and parity suite. Novelty
and integration cost are also high, so the result is a bounded spike rather than
an architectural claim. [R1][R2][R3]

`CURIOSITY_NO_GO`:

- **Custom Liquid Glass shaders:** no decision value for Craft content and
  conflicts with the native material boundary.
- **CloudKit selection now:** a storage provider does not resolve merge, undo,
  operation or presence semantics.
- **RealityKit adoption now:** there is no authored 3D slice; adopting it would
  create a second scene graph before its value can be measured.
- **PencilKit as canonical pen:** `PKDrawing` would bypass stable path-point IDs,
  vector commands, booleans and collaboration.
- **Premature performance constants:** no native fixture distribution exists.

## Evidence and bibliography

### Repository evidence

- **[C1]** [`vendor/crafty/AGENTS.md`](../../../vendor/crafty/AGENTS.md) — selected
  because it states the enforced canonical-document, command, transaction,
  renderer and framework-boundary invariants. Source and tests remain stronger
  where prose is stale.
- **[C2]** `vendor/crafty/packages/editor/src/kernel/{document,commands,kernel,
  clipboard,hierarchy,layout,component-resolution}.ts` and adjacent tests —
  selected as current executable evidence for schema v5, commands, history,
  hierarchy, clipboard, layout and components.
- **[C3]** `vendor/crafty/packages/editor/src/kernel/{interaction,snap,
  coordinates,path-geometry}.ts` and adjacent tests — selected as current
  executable evidence for tools, selection, transforms, snapping and path input.
- **[C4]** `vendor/crafty/packages/editor/src/kernel/{boolean,compound}.ts` and
  adjacent tests — selected as current executable evidence for destructive and
  nondestructive vector booleans.
- **[C5]** `vendor/crafty/packages/scene-renderer/`, especially
  `src/draw-protocol.ts`, `rust/Cargo.toml`, encoder tests and
  `docs/architecture/{renderer,performance}.md` — selected for the actual
  packet/Vello/wgpu line, measured evidence and known gaps.
- **[C6]** `vendor/crafty/docs/architecture/typography.md` and
  `vendor/crafty/docs/research/2026-08-16-crafty-text-substrate-analysis.md` —
  selected because they separate current bounded text from unresolved shaping,
  editing and accessibility work.
- **[C7]** `vendor/crafty/docs/architecture/persistence.md` and ADR 0011 —
  selected for the implemented `.ui` package, publication and stale-revision
  contract.
- **[C8]** `vendor/crafty/apps/web/editor/src/app/editor/`,
  `vendor/crafty/packages/editor/src/ui/editor/`,
  `vendor/crafty/packages/editor/src/ui/editor-primitives/`, current renderer
  projection/encoder source, `vendor/crafty/packages/scene-store/src/index.ts`,
  and collaboration ADR/caller searches — selected as the exhaustive mounted
  web-product audit. Active route composition is stronger evidence of product
  reachability than an exported component or command. Repeated negative caller
  searches distinguish unmounted implementations and foundations from features.

### Apple primary sources

- **[A1]** [Apple HIG — Apple Pencil and
  Scribble](https://developer.apple.com/design/human-interface-guidelines/apple-pencil-and-scribble)
  — preferred primary source for hover, double tap, squeeze, Scribble and
  PencilKit product behavior.
- **[A2]** [Handling input from Apple
  Pencil](https://developer.apple.com/documentation/uikit/handling-input-from-apple-pencil),
  [coalesced touches](https://developer.apple.com/documentation/uikit/uievent/coalescedtouches(for:)),
  and [predicted
  touches](https://developer.apple.com/documentation/uikit/uievent/predictedtouches(for:))
  — preferred API sources for actual/coalesced/predicted/estimated sample
  semantics.
- **[A3]** [`UITextInput`](https://developer.apple.com/documentation/uikit/uitextinput)
  and [Using TextKit 2 to interact with
  text](https://developer.apple.com/documentation/uikit/using-textkit-2-to-interact-with-text)
  — preferred primary sources for marked text, selection, caret/range geometry,
  keyboard services and native editing.
- **[A4]** [Core Text](https://developer.apple.com/documentation/coretext) —
  preferred primary source for Apple-native font discovery, shaping/typesetting,
  metrics and glyph runs; it is precedent, not proof of cross-platform parity.
- **[A5]** [Accessibility for
  UIKit](https://developer.apple.com/documentation/uikit/accessibility-for-uikit)
  and [`UIAccessibilityElement`](https://developer.apple.com/documentation/uikit/uiaccessibilityelement)
  — preferred API sources for exposing custom-rendered objects.
- **[A6]** [Enhance the accessibility of your reading app —
  WWDC26](https://developer.apple.com/videos/play/wwdc2026/219/), [Support Full
  Keyboard Access — WWDC21](https://developer.apple.com/videos/play/wwdc2021/10120/),
  and [Making Apps More Accessible With Custom Actions —
  WWDC19](https://developer.apple.com/videos/play/wwdc2019/250/) — selected for
  current custom-rendered text, geometry, custom actions and cross-assistive-tech
  behavior.
- **[A7]** [`MTKView`](https://developer.apple.com/documentation/metalkit/mtkview)
  — preferred primary source for the Metal-aware UIKit host, drawable sizing,
  depth/stencil and presentation lifecycle.
- **[A8]** [RealityKit Entity Component
  System](https://developer.apple.com/documentation/realitykit/implementing-systems-for-entities-in-a-scene),
  [custom materials](https://developer.apple.com/documentation/realitykit/modifying-realitykit-rendering-using-custom-materials),
  and [low-level rendering](https://developer.apple.com/documentation/realitykit/low-level-rendering)
  — preferred primary sources for the capabilities RealityKit could provide to a
  future 3D backend.
- **[A9]** [`UIDocument`](https://developer.apple.com/documentation/uikit/uidocument)
  — preferred primary source for package I/O, safe save, autosave, file
  coordination and explicit conflict handling.
- **[A10]** [`CKSyncEngine`](https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5)
  and [`CKShare`](https://developer.apple.com/documentation/cloudkit/ckshare)
  — preferred primary sources for Apple sync/share capabilities and, equally,
  evidence of the product merge semantics they do not define.

### Relevant upstream implementations

- **[R1]** [`wgpu` documentation](https://docs.rs/wgpu/latest/wgpu/) — selected
  because it explicitly documents a native Metal backend on macOS and iOS.
- **[R2]** [Linebender Vello](https://github.com/linebender/vello) — selected
  because it is Crafty's pinned renderer and declares wgpu as its platform layer.
- **[R3]** [Vello iOS integration issue
  #778](https://github.com/linebender/vello/issues/778) — retained as bounded
  implementation evidence that UIKit/CAMetalLayer embedding has been explored
  and demonstrated. It is an upstream discussion, not a support guarantee or an
  independent benchmark.

## Evidence limitations

- Several Crafty architecture pages lag current source. This report resolves
  conflicts in favor of current source/tests and does not repeat stale "missing"
  claims where the implementation now exists.
- The current mounted web route was inspected statically. Browser permission
  behavior, deployed-build equivalence, visual hit areas, and physical assistive
  technology behavior still require runtime smoke evidence.
- Apple framework capability does not prove that a third-party editor uses that
  framework internally or that two platforms produce identical typography.
- No native Vello/wgpu iPad artifact, GPU pixel comparison, latency distribution,
  memory profile, device-loss test, or large-document accessibility audit exists
  yet. Those remain explicit gates.
- Static design files cannot prove runtime accessibility, Pencil latency, IME,
  collaboration or dynamic material behavior.

## Stop decision

Coverage is sufficient for the architecture gate and parity plan: all 26 feature
domains plus independently discoverable mounted, unmounted, foundation-only, and
defective capabilities have a current-web classification, canonical owner, iPad
disposition, dependency order, and binary gate. The evidence is saturated for
deciding **what must and must not be built next**: complete B1/S0–S6, then P0;
add no more hardcoded Swift scene features and no second model.

Research stops before selecting the text engine, collaboration algorithm,
transport, or 3D backend because each now has a named ADR/spike and acceptance
gate. Further browsing without those fixtures would add options, not decision
quality.
