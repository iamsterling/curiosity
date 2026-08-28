# Competitor Capability Matrix: Figma, Penpot, Excalidraw, tldraw, Rive

Status: research, August 2026 · Evidence captured 2026-08-06 · Feeds: editor roadmap, `specs/002-figma-design-parity-roadmap`, renderer-failure policy

Primary-source-only product research. Every claim below was verified by fetching the cited URL on 2026-08-06; no marketing-only assertions are included, and anything not directly verifiable is marked `inferred`/`medium|low` or listed under Open Questions. No Crafty source, package manifests, or docs were modified to produce this file; nothing was committed.

---

## 1. Method and rubrics

**Evidence types**

| Type | Meaning |
|---|---|
| `official docs` | Product/help/developer documentation published by the vendor |
| `engineering blog` | Vendor engineering/company blog post with technical content |
| `source repository` | Code, README, LICENSE, or in-repo docs at an exact file path |
| `release notes` | Official GitHub releases / npm registry metadata / changelog |

**Classification**

| Label | Meaning |
|---|---|
| `native` | Capability ships in the product by default and is documented as such |
| `configurable` | Capability exists but is toggled/parameterized (user or developer setting) |
| `inferred` | Claim derived from source inspection or documented absence; no direct statement exists |

**Confidence**: `high` = direct statement in a verified primary source; `medium` = summary of a linked article, presence without details, or absence established from one source; `low` = could not be fully verified this session.

**Scope note**: for SaaS (Figma, Rive editor) "version/date" means blog publish date or capture date (Figma help pages carry no visible edit dates); for open source it is the release tag/date or repo branch + capture date.

---

## 2. System snapshot

| System | License (exact) | Current version / date captured | Core stack (primary-source verified) |
|---|---|---|---|
| Figma | Proprietary SaaS (no source) | WebGPU renderer shipped 2025-09-18; auto-layout flexbox-parity default July 2026 | C++ engine → WASM (Emscripten), WebGL + WebGPU (Dawn, naga), server-authoritative sync |
| Penpot | MPL-2.0 (`raw.githubusercontent.com/penpot/penpot/main/LICENSE`) | 2.17.0, 2026-07-22 (latest); WebGL (beta) since 2.16.0 (2026-06-11) | ClojureScript + React SPA; legacy SVG-in-DOM renderer; new Rust/Emscripten/Skia WASM renderer; Clojure + PostgreSQL backend |
| Excalidraw | MIT (`excalidraw/excalidraw` LICENSE) | npm `@excalidraw/excalidraw` 0.18.1, 2026-04-20 | Canvas 2D API + rough.js, React, HTML text-editing overlay |
| tldraw | Custom "tldraw license" (source-available; dev-only by default, production requires license key) | SDK 5.3.0, 2026-08-05 | React + @tldraw/state signals; shapes rendered as HTML DOM ("DOM canvas"); own sync engine (not Yjs) |
| Rive | Editor proprietary SaaS; runtimes MIT (`rive-app/rive-runtime` LICENSE; `@rive-app/canvas` 2.39.2 MIT) | Runtime 2.39.2; `.riv` format major v7 | Custom C++ "Rive Renderer"; backends Metal/Vulkan/D3D11/D3D12/OpenGL-WebGL (+ WebGPU in-tree), Canvas2D/Skia/Impeller adapters |

---

## 3. Figma

Figma is closed-source; evidence is official help docs + engineering blog. Help-center article IDs are stable; content "updated" dates are not published.

### 3.1 Infinite canvas

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Canvas is an unbounded 2D browser workspace; blog calls the WebGL bet "a smooth, infinite canvas in the browser" and the tool "a powerful 2D WebGL rendering engine that supports very large documents" | https://www.figma.com/blog/figma-rendering-powered-by-webgpu/ | 2025-09-18 | engineering blog | native | high | Copy: canvas is unbounded, free pan/zoom; no world bounds. No numeric limits are documented — do not invent any |
| Continuous zoom + freeform pan (space-drag, trackpad); zoom percentage user-settable; zoom-to-fit/selection | https://help.figma.com/hc/en-us/articles/15297425105303-Explore-design-files ; https://help.figma.com/hc/en-us/articles/360041065034-Adjust-your-zoom-and-view-options | captured 2026-08-06 | official docs | native / configurable | high | Copy: percentage zoom control + zoom-to-fit/selection. Min/max zoom bounds NOT documented — open question before shipping a clamp |

### 3.2 Grids / guides / snapping

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Frame-level "layout guides" (renamed from "layout grid" May 2025): uniform grid, column, row — count, width/height, offset, margin, gutter, color/opacity; combinable, shareable as styles | https://help.figma.com/hc/en-us/articles/360040450513-Create-layout-guides | captured 2026-08-06 | official docs | native | high | Copy: guides as frame-scoped, non-destructive settings; three kinds from one config object |
| Pixel grid visible at ≥400% zoom; "Snap to pixel grid" toggle; frames/sections/components always snap even when toggle is off | https://help.figma.com/hc/en-us/articles/360041065034-Adjust-your-zoom-and-view-options | captured 2026-08-06 | official docs | configurable | high | Copy: always-snap container nodes + opt-in toggle for free layers — cheap, prevents blurry output |
| Smart selection: uniform spacing/distribution handles; rearrange/duplicate/delete reflow for 1D and 2D selections | https://help.figma.com/hc/en-us/articles/360040450233-Arrange-layers-with-Smart-selection | captured 2026-08-06 | official docs | native | high | Copy later (high QoL, non-trivial geometry); not needed for first editor milestone |
| Layers inside a frame align to that frame's guides | https://help.figma.com/hc/en-us/articles/360039957734-Apply-constraints-to-define-how-layers-resize | captured 2026-08-06 | official docs | native | medium | Copy: guide-snap for frame children. Canvas-level ruler guides unverified — see Open Questions |

### 3.3 Pages

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| File = multiple pages, "each page is its own canvas", per-page share links | https://help.figma.com/hc/en-us/articles/15297425105303-Explore-design-files | captured 2026-08-06 | official docs | native | high | Copy: page = independent canvas root. Matches Crafty's Workspace/Project/File/Page layering |
| Document tree: root → page objects → object hierarchy | https://www.figma.com/blog/how-figmas-multiplayer-technology-works/ | 2019-10-16 | engineering blog | native | high | Copy: root→pages→objects as the durable tree skeleton |
| Pages load on demand (first page + dependencies, rest streamed on navigation via QueryGraph); slowest loads −33%, client memory −70% | https://www.figma.com/blog/speeding-up-file-load-times-one-page-at-a-time/ | 2024-05-22 | engineering blog | native | high | Copy the granularity: page-scoped load/stream/subscribe, even local-first — informs export, snapshot, and undo boundaries. Do NOT copy the server-side QueryGraph |

### 3.4 Frames

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Frames are first-class containers (dimensions, fills, strokes, radius, effects, nesting, "Clip Content"); groups have no properties of their own | https://help.figma.com/hc/en-us/articles/360041539473-Frames-in-Figma-Design | captured 2026-08-06 | official docs | native | high | Copy: frame = styled container + clip flag; group = property-less selection bundle |
| Layout guides, constraints, auto layout, prototyping are gated to frames | https://help.figma.com/hc/en-us/articles/15297425105303-Explore-design-files | captured 2026-08-06 | official docs | native | high | Copy: gate layout/constraint systems to container nodes |
| Per-axis resize constraints (Left/Right/Left+Right/Center/Scale), default Top+Left; not applicable to auto-layout children | https://help.figma.com/hc/en-us/articles/360039957734-Apply-constraints-to-define-how-layers-resize | captured 2026-08-06 | official docs | configurable | high | Copy constraints only as the static-container resize model; do not run them inside auto layout (§8 synthesis) |

### 3.5 Hierarchy

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Node map `Map<ObjectID, Map<Property, Value>>`; parent-child stored as a parent-link property **on the child** to preserve identity across reparenting | https://www.figma.com/blog/how-figmas-multiplayer-technology-works/ | 2019-10-16 | engineering blog | native | high | Copy — already Crafty's plan (stable IDs, node maps, parent links on nodes); this blog is the primary justification |
| Child order via fractional indexing (fraction in (0,1), average-insert), synced as one atomic parent+position property | https://www.figma.com/blog/how-figmas-multiplayer-technology-works/ | 2019-10-16 | engineering blog | native | high | Copy: fractional indexing for ordered children — deterministic, concurrent-reorder safe, trivial to implement |
| DOM-like parent/child/sibling semantics; objects smaller than a frame become its children | https://help.figma.com/hc/en-us/articles/360039959014-Parent-child-and-sibling-relationships | captured 2026-08-06 | official docs | native | high | Copy the auto-reparent rule with care: make it a documented, deterministic kernel rule, not implicit magic |
| Instance subtrees lazily materialized (deferred on unloaded pages); 2026 "Materializer" rewrite derives subtrees with push-based dependency invalidation; variable-mode changes 40–50% faster in large files | https://www.figma.com/blog/how-we-rebuilt-the-foundations-of-component-instances/ | 2026-03-17 | engineering blog | native | high | Copy the concept: derived component subtrees are resolved/cached/invalidated-by-dependency, never authored — maps directly to Crafty's resolution stage |

### 3.6 Components / variants

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Main component + linked instances that auto-receive main updates | https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-components-in-Figma | captured 2026-08-06 | official docs | native | high | Copy: main/instance as distinct records with explicit linking — matches Crafty's components/instances-as-records plan |
| Variants: component set with named properties/values; instances configured via property dropdowns; default variant = top-left | https://help.figma.com/hc/en-us/articles/360056440594-Create-and-use-variants | captured 2026-08-06 | official docs | native | high | Copy: variants as a property/values matrix over a component set — cheap data model, high value; Penpot (§4.6) shows a simpler equivalent |
| Libraries publish components/styles/variables cross-file; update review is per-user accept/ignore | https://help.figma.com/hc/en-us/articles/360041051154-Guide-to-libraries-in-Figma | captured 2026-08-06 | official docs | native | high | Copy the accept/ignore update gate UX. Do NOT copy the server library registry — Crafty imports are local files (pen.dev research: pinning/diff/update-gating are the gaps to beat) |

### 3.7 Variables / tokens

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Six typed variable kinds (color, number, string, boolean, timing, easing); variables can reference other variables — "gives you the ability to implement design tokens" | https://help.figma.com/hc/en-us/articles/14506821864087-Overview-of-variables-collections-and-modes | captured 2026-08-06 | official docs | native | high | Copy: alias/reference semantics are the core of any token system; six kinds is a reasonable enum; tokens stay document records |
| Collections (≤5,000 variables each) + modes (light/dark, size); number variables bind to font size/weight, line height, letter spacing, padding, gap; scoping restricts usage | https://help.figma.com/hc/en-us/articles/14506821864087-Overview-of-variables-collections-and-modes ; https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma | captured 2026-08-06 | official docs | native / configurable | high | Copy: modes (named value sets) + scope whitelist. The 5,000/collection cap is an artifact, not a goal |
| REST API + Plugin API support for variables | https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma | captured 2026-08-06 | official docs | configurable | medium | Copy: make variables queryable over the local scene API from day one |

### 3.8 Auto-layout / constraints

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Auto layout = flexbox-class engine: direction flows + grid flow, wrap, padding, gap (incl. auto gap), alignment, resize modes hug/fill/fixed/min-max | https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout | captured 2026-08-06 | official docs | native | high | Copy: the five resize behaviors (hug/fill/fixed/min/max) as the layout vocabulary — they compose deterministically |
| Explicit CSS-flexbox parity: border-box sizing for fill children, inside-stroke-as-border, auto gap = space-between (never negative), Dev Mode output maps directly to flexbox; new version default for new frames July 2026, legacy removed January 2027 | https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind | captured 2026-08-06 | official docs | native | high | Copy the decision: define Crafty auto-layout as flexbox-parity from the start (deterministic, CSS-exportable). Learn from Figma's pain — do not carry a legacy layout engine forward |
| Constraints = pre-flexbox resize model, disabled inside auto layout; "Ignore auto layout" ≈ CSS absolute positioning | https://help.figma.com/hc/en-us/articles/360039957734-Apply-constraints-to-define-how-layers-resize | captured 2026-08-06 | official docs | native | high | Do NOT copy the dual model (constraints + auto layout + ignore). One primary model (flexbox-parity) + absolute escape; constraints only for static containers if ever |

### 3.9 Text / vector / image

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Custom text rendering for cross-browser consistency; only TTF/OTF fonts; OpenType/variable fonts; text-on-path | https://help.figma.com/hc/en-us/articles/360039956434-Guide-to-text-in-Figma-Design | captured 2026-08-06 | official docs | native | high | Do NOT copy custom text rendering initially — large browser-independent rasterization investment; use platform text, revisit only if export fidelity demands |
| Vector networks: paths branch in multiple directions, no single start/end; bezier handles; per-point caps | https://help.figma.com/hc/en-us/articles/360040450213-Vector-networks | captured 2026-08-06 | official docs | native | high | Do NOT copy the network model for the first editor; standard closed/open paths + booleans (Penpot §4.9) cover the same ground with less complexity |
| Images are fills on any layer (JPG/PNG/HEIC/WebP/GIF; MP4/MOV/WebM video), 4096×4096 downscale cap; SVG import converts to editable vector layers, not bitmaps | https://help.figma.com/hc/en-us/articles/360040028034-Add-images-and-videos-to-design-files | captured 2026-08-06 | official docs | native | high | Copy: images-as-fills + SVG→editable-vectors import; 4096 cap is a defensible default |

### 3.10 Multiplayer / revision semantics

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Custom sync: property-level LWW with server-defined ordering; explicitly "not OTs" and "not true CRDTs"; one server process per document; offline edits re-applied on reconnect | https://www.figma.com/blog/how-figmas-multiplayer-technology-works/ | 2019-10-16 | engineering blog | native | high | Copy the semantic insight: atomic-per-property updates + stable IDs + fractional indexing are the collab-friendly foundation (Crafty's local transaction model already matches). Do NOT copy the server architecture |
| Conflicts atomic at the property-value boundary — "the end result will be either AB or BC but never ABC... Figma is a design tool, not a text editor" | https://www.figma.com/blog/how-figmas-multiplayer-technology-works/ | 2019-10-16 | engineering blog | native | high | Copy: whole-value text conflicts, never char-level merge — a product decision adoptable before any multiplayer exists |
| Version history: automatic checkpoint every 30 minutes + named versions; restore/duplicate/share-link non-destructive | https://help.figma.com/hc/en-us/articles/360038006754-Use-version-history | captured 2026-08-06 | official docs | native | high | Copy: timed auto-checkpoints + named versions, non-destructive restore; Penpot's pinned-vs-7-day policy (§4.10) is an alternative |
| Toggleable multiplayer cursors; canvas-positioned comment threads with reply/react/resolve | https://help.figma.com/hc/en-us/articles/360041065034-Adjust-your-zoom-and-view-options ; https://help.figma.com/hc/en-us/articles/360039825314-Guide-to-comments-in-Figma | captured 2026-08-06 | official docs | native | high | Copy: comments as document-adjacent threads (Crafty already plans comment records); cursors are cheap presence |

### 3.11 Rendering strategy

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Renderer is C++ compiled to WASM via Emscripten; migrated WebGL → WebGPU while keeping a WebGL path; dynamic mid-session WebGPU→WebGL fallback; device loss triggers backend swap | https://www.figma.com/blog/figma-rendering-powered-by-webgpu/ | 2025-09-18 | engineering blog | native | high | Copy the fallback policy — Crafty's renderer-failure-policy doc already targets this; the blog is the primary justification. Copy: explicit draw-call args, batched uniform uploads, bind-group reuse |
| Shaders kept in WebGL1-GLSL, auto-translated to WGSL via custom shader processor + naga; compute shaders (blur); MSAA | https://www.figma.com/blog/figma-rendering-powered-by-webgpu/ | 2025-09-18 | engineering blog | native | high | Copy the approach: one shader source → GLSL + WGSL via naga; avoid maintaining two dialects |
| WASM adoption cut load time 3× (2017); same C++ compiles natively (x64/arm64) for server-side rendering | https://www.figma.com/blog/webassembly-cut-figmas-load-time-by-3x/ | 2017-06-08 | engineering blog | native | high | Copy: one engine, WASM + native targets — validates Crafty's Rust/WASM + native path |
| Spot-verified 2026-08-06: C++/Emscripten, "smooth, infinite canvas in the browser", Dawn for native WebGPU, async readback handling, blocklist + fallback rollout | https://www.figma.com/blog/figma-rendering-powered-by-webgpu/ | 2025-09-18 | engineering blog | native | high | Anchor citation for the renderer section of the research ledger |

### 3.12 Virtualization / culling

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Page-level on-demand loading with subscription-set streaming (only subscribed content synced/rendered); instance sublayers on unloaded pages not materialized (70% node-memory cut, 33% fewer OOMs) | https://www.figma.com/blog/speeding-up-file-load-times-one-page-at-a-time/ | 2024-05-22 | engineering blog | native | high | Copy: virtualization at the document-data layer (page-scoped). Strongest published evidence that data-layer culling matters as much as render-layer |
| Viewport-tile culling of rendered geometry: **not documented** in any primary source | — | — | — | inferred | low | Do not cite Figma for viewport culling; use Excalidraw/tldraw/Penpot evidence (§§5.12, 6.12, 4.12) |

### 3.13 Export

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Formats: PNG (32-bit RGBA), JPG, SVG, PDF 1.7; per-format settings (scale, suffix, color profile, outline text, simplify stroke, include id); 72 DPI base; SVG/PDF export at 1× only | https://help.figma.com/hc/en-us/articles/13402894554519-Export-formats-and-settings-for-static-designs | captured 2026-08-06 | official docs | configurable | high | Copy: per-format preset objects (format + scale + suffix) — Penpot's multi-export (§4.13) shows the same pattern. 1×-only SVG/PDF is a limitation, not best practice |
| Export targets: layers, frames, components, groups, sections, slices (partial canvas), whole page, whole file (.fig); bulk export; "Copy as PNG / Copy as SVG" | https://help.figma.com/hc/en-us/articles/360040028114-Export-static-designs-from-Figma | captured 2026-08-06 | official docs | native | high | Copy: slice/region export + clipboard formats; skip `.fig` export — Crafty's own format is the goal |
| Programmatic export via Plugin/REST APIs (existence corroborated; endpoint docs 404'd this session) | https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma | captured 2026-08-06 | official docs | native (existence) / inferred (details) | low | Copy: expose export as an API on the local scene server |

---

## 4. Penpot (MPL-2.0, open source)

Penpot is the only fully open-source full design tool surveyed. Its developer docs are unusually precise, and the in-repo `render-wasm/` docs are the best primary source for tile-based canvas rendering of any system here.

### 4.1 Infinite canvas

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Viewport is "practically infinite"; pan (space-drag / two-finger scroll), zoom (Ctrl+scroll, zoom lens Z); boards provide bounded artboards | https://help.penpot.app/user-guide/designing/workspace-basics/ | captured 2026-08-06 | official docs | native | high | Copy the model: unbounded viewport + bounded container nodes; no numeric limits documented |
| Viewport is a SPA component with dedicated ruler/guide/snap/presence submodules (`frontend/src/app/main/ui/workspace/`) | https://github.com/penpot/penpot/tree/develop/frontend/src/app/main/ui/workspace | develop branch, 2026-08-06 | source repository | native | high | Copy the module decomposition (viewport vs rulers vs snap vs presence) as organization, not the ClojureScript implementation |

### 4.2 Grids / guides / snapping

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Three guide types (square, columns, rows) at board level (count, type, width/height, gutter, margin, color, opacity); ruler guides; snap-to-guides and snap-to-pixel toggles; "Guides are only visible in the viewport and will never be shown on exports" | https://help.penpot.app/user-guide/designing/workspace-basics/ | captured 2026-08-06 | official docs | native | high | Copy: guide config object (type/count/gutter/margin/color) + explicit "guides never export" rule |
| Dynamic alignment: edge/center guides + equal-distance distribution while moving; snapping state persisted | https://help.penpot.app/user-guide/designing/workspace-basics/ | captured 2026-08-06 | official docs | native | high | Copy: edge/center alignment guides + distance indicators; persist snap preference |

### 4.3 Pages

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Multi-page files as tabs; add/remove/rename; `---` page separator convention | https://help.penpot.app/user-guide/designing/workspace-basics/ | captured 2026-08-06 | official docs | native | high | Copy: pages as named canvases; separators are a trivial nicety |
| Data model: file `data` holds `Pages` plus library assets (Components, MediaItems, Colors, Typographies); `Container` entity abstracts page-or-component | https://help.penpot.app/technical-guide/developer/data-model/ | captured 2026-08-06 | official docs | native | high | Copy the Container abstraction (page and component share container logic) — simplifies Crafty's resolution pipeline; aligned with Crafty's distinct-records model |

### 4.4 Frames

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Boards (Penpot's frames): top-level containers, nestable, optional clip-content, act as screens in View mode; resize-to-fit; size presets | https://help.penpot.app/user-guide/designing/layers/ | captured 2026-08-06 | official docs | native | high | Copy: container-with-clip + resize-to-fit action; presets are convenience, skip initially |
| `frame` shape type distinct from `group`; frames carry `shapes` (child UUIDs), `showContent`, `hideInViewer` | https://help.penpot.app/technical-guide/developer/data-model/penpot-file-format/ | captured 2026-08-06 | official docs | native | high | Copy: explicit child UUID arrays + visibility flags in the durable format |

### 4.5 Hierarchy

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| `ShapeTree`: frames/groups contain any non-frame shape; every shape stores a parent reference and its children; `parentId`/`frameId` are required base attributes in the file format | https://help.penpot.app/technical-guide/developer/data-model/ ; https://help.penpot.app/technical-guide/developer/data-model/penpot-file-format/ | captured 2026-08-06 | official docs | native | high | Copy: required parent refs in the schema (self-validating trees). Penpot stores parent ref + children list; Crafty picks one canonical direction with enforced invariants |
| Layers panel: grouping, nesting, deep selection, reorder, collapse/expand, layer-type filters | https://help.penpot.app/user-guide/designing/workspace-basics/ | captured 2026-08-06 | official docs | native | high | Copy: layer-type filter as a kernel query, not UI-only |

### 4.6 Components / variants

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Main component + instances ("component copies"); overrides, detach, restore-main, swap, push-to-main ("Update main component") | https://help.penpot.app/user-guide/design-systems/components/ | captured 2026-08-06 | official docs | native | high | Copy: update-main/restore-main semantics — a clean two-way sync model for local component libraries |
| Variants: components grouped into one component with named properties/values, boolean toggles (true/false, on/off), override preservation across variants, "Combine as variants" bulk conversion; layers between variants connected when they share name, type, hierarchy level | https://help.penpot.app/user-guide/design-systems/variants/ | captured 2026-08-06 | official docs | native | high | Copy: property/values matrix + the connected-layer rule (same name+type+hierarchy) — a documented override-mapping heuristic Crafty can adopt or improve |
| Any file publishes as a Shared Library; connected files reuse components and import tokens; cross-file "Update main component" notifications | https://help.penpot.app/user-guide/design-systems/libraries/ | captured 2026-08-06 | official docs | native | high | Copy: file-level library publish + token import from libraries. MPL-2.0 allows study; do not port code |

### 4.7 Variables / tokens

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Native Design Tokens following the W3C DTCG "Design Tokens Format Module" draft: color, dimension, opacity, rotation, sizing, spacing, stroke width, number, individual + composite typography, shadow; aliases, math (incl. round/max), token sets, themes, theme groups; JSON/ZIP import/export | https://help.penpot.app/user-guide/design-systems/design-tokens/ | captured 2026-08-06 | official docs | native | high | Copy the DTCG compliance decision: token JSON import/export against the W3C DTCG draft is the interop standard — Crafty should be DTCG-compatible for import/export |
| Token binding on numeric/color fields in the Design sidebar (size/position, rotation, radius, layout spacing, typography, stroke width, shadows, blur) — shipped 2.16.0 | https://github.com/penpot/penpot/releases (2.16.0, 2026-06-11) ; https://help.penpot.app/user-guide/design-systems/design-tokens/ | 2026-06-11 | release notes + official docs | native | high | Copy: token binding on scalar/color inspector fields; composite typography tokens (2.17.0) are the hard part — defer |
| Legacy color/typography "styles" are distinct from tokens; applying a typography token detaches a typography style and vice versa | https://help.penpot.app/user-guide/design-systems/assets/ | captured 2026-08-06 | official docs | native | high | Do NOT copy the parallel styles+tokens system — one mechanism (tokens) with an import adapter for legacy styles |

### 4.8 Auto-layout / constraints

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| "Flex Layout" built over Flexbox and "Grid Layout" behaving like CSS Grid, on any layer/group/board: direction, wrap, align/justify, gap, padding, margin, fit/fix sizing, absolute positioning, grid units fr/auto/px, merged areas; Inspect tab generates production CSS | https://help.penpot.app/user-guide/designing/flexible-layouts/ | captured 2026-08-06 | official docs | native | high | Copy: CSS Grid as a second layout primitive (Figma only approximates it with auto layout grid-flow); fr/auto/px units + merged areas are directly portable semantics |
| Per-shape resize constraints (left/right/left&right/center/scale; top/bottom) define behavior when the parent container resizes; default is "Scale" | https://help.penpot.app/user-guide/designing/layers/ | captured 2026-08-06 | official docs | native | high | Copy: constraints as a separate, container-scoped feature; note Penpot's default (Scale) differs from Figma's (Top+Left) — pick one deliberately |

### 4.9 Text / vector / image

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Rich-text layers (font family/size/weight, line height, letter spacing, case, alignment, decoration, auto LTR/RTL); Google Fonts catalog + custom TTF/OTF/WOFF/WOFF2 uploads | https://help.penpot.app/user-guide/designing/text-typo/ | captured 2026-08-06 | official docs | native | high | Copy: the font formats list (TTF/OTF/WOFF/WOFF2) — wider than Figma's TTF/OTF; WOFF support is cheap for web-first |
| Bezier paths + freehand curves, node editing; five non-destructive boolean operators (union, difference, intersection, exclusion, flatten) | https://help.penpot.app/user-guide/designing/layers/ | captured 2026-08-06 | official docs | native | high | Copy: non-destructive boolean ops (bool shape type keeps operands) — matches a durable, re-resolvable document model |
| Shapes correspond 1:1 to SVG nodes; SVG import converts elements back into shapes, with metadata round-trip for Penpot-exported SVG (2.16.0: preserve vector content when pasting SVG) | https://help.penpot.app/technical-guide/developer/data-model/ ; https://github.com/penpot/penpot/releases | captured 2026-08-06 | official docs + release notes | native | high | Copy: SVG↔shape round-trip with embedded metadata — the basis for lossless import/export of Crafty documents |

### 4.10 Multiplayer / revision semantics

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Real-time multi-user editing: persistent websocket per open file sends presence (connections, mouse movement) and receives other users' changes "in real time" | https://help.penpot.app/technical-guide/developer/architecture/frontend/ | captured 2026-08-06 | official docs | native | high | Copy the presence channel design (websocket per file, presence + change fan-out). Conflict resolution internals are NOT documented — open question |
| Revision semantics: pinned (named, kept forever) + autosaved (~7 days) versions; restore reverts file; read-only preview of saved versions (2.16.0); history entries carry author/timestamp (2.17.0); per-session undo/redo action list | https://help.penpot.app/user-guide/designing/workspace-basics/ ; https://github.com/penpot/penpot/releases | captured 2026-08-06 | official docs + release notes | native | high | Copy: pinned-vs-autosave retention policy + per-entry author/timestamp metadata — stronger than Figma's flat 30-min checkpoint for auditability |
| Comment threads with replies, read-state, dashboard notifications; threads are first-class entities in the data model (CommentThreads/Comments) | https://help.penpot.app/user-guide/designing/workspace-basics/ ; https://help.penpot.app/technical-guide/developer/data-model/ | captured 2026-08-06 | official docs | native | high | Copy: comments as document records with read-state — confirms Crafty's plan |

### 4.11 Rendering strategy

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Frontend is ClojureScript + React SPA; legacy renderer renders every shape as SVG elements in the DOM (`ui/shapes`: "convert all types of shapes in the corresponding svg elements"); web worker handles thumbnails and geometric snap indexes | https://help.penpot.app/technical-guide/developer/architecture/frontend/ | captured 2026-08-06 | official docs | native | high | Do NOT copy the SVG-in-DOM renderer as a strategy (it is the thing Penpot itself is replacing); copy the worker split (thumbnails + snap indexes off-main-thread) |
| New WASM render engine (`render-wasm/`): Rust crate targeting Emscripten, canvas-based, using Skia (rust-skia); live/GPU path = WebGL surfaces + Skia; vector path = single CPU Skia canvas for PDF (and future SVG) export | https://github.com/penpot/penpot/tree/develop/render-wasm ; https://raw.githubusercontent.com/penpot/penpot/develop/render-wasm/docs/rendering_architecture.md | develop branch, 2026-08-06 | source repository | native | high | Copy the architecture: one engine, two targets (live GPU vs export vector). Crafty's Rust/WASM encoder + WebGPU host maps 1:1; Skia as the vector-export path is a strong precedent for PDF/SVG fidelity |
| WebGL rendering (Beta) is opt-in user preference since 2.16 (off by default; design workspace canvas only; view/exports still legacy SVG); 2.17 renders prototype viewer via WASM/Skia and guides via WebGL; background blur requires WebGL renderer | https://help.penpot.app/user-guide/first-steps/troubleshooting-webgl/ ; https://github.com/penpot/penpot/releases | 2.16.0 2026-06-11; 2.17.0 2026-07-22 | official docs + release notes | configurable | high | Copy: staged rollout (opt-in beta, then per-surface migration). Do NOT copy the two-renderer co-existence for long — it multiplies maintenance (Figma's WebGL+WebGPU fallback is the lighter dual path) |

### 4.12 Virtualization / culling

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| WASM engine tile rendering: screen subdivided into 512×512 px tiles (zoom-independent); only visible/needed tiles drawn; tile→shape index; texture cache with LRU eviction; preload "interest" region beyond viewport; tiles prioritized by distance to viewport center; per-frame tile budget | https://raw.githubusercontent.com/penpot/penpot/develop/render-wasm/docs/tile_rendering.md | develop branch, 2026-08-06 | source repository | native (WASM engine) | high | Copy: tile-based rendering with LRU texture cache + priority-by-distance + per-frame budget. The most complete public culling spec surveyed — Crafty's render-plan should address each of these mechanisms explicitly |
| Legacy SVG renderer: no viewport culling documented; only mitigation is "Focus mode" ("can also improve performance") | https://help.penpot.app/technical-guide/developer/architecture/frontend/ ; https://help.penpot.app/user-guide/designing/workspace-basics/ | captured 2026-08-06 | official docs | inferred | medium | Confirms the cost of DOM-per-shape: no culling strategy exists at all. Evidence against SVG-DOM rendering at scale |

### 4.13 Export

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Layer export presets: PNG, JPEG, WEBP, SVG, PDF with scale + suffix; multi-export (same layer, multiple formats/scales, one click); page's boards → single PDF ("leverage the capabilities of PDF vectorial format"); copy-as-image context menu (2.16.0) | https://help.penpot.app/user-guide/export-import/exporting-layers/ | captured 2026-08-06 | official docs | native | high | Copy: multi-export presets + page→single-PDF. WEBP support is a Figma gap Crafty can fill |
| File export/import: open `.penpot` format v3 — ZIP container with readable JSON metadata + binary assets (manifest.json, pages/ per-shape JSON, media, colors, components, typographies, tokens.json); `.zip` import; 1 GB import cap; v1 binary deprecated | https://help.penpot.app/user-guide/export-import/export-import-files/ ; https://help.penpot.app/technical-guide/developer/data-model/penpot-file-format/ | captured 2026-08-06 | official docs | native | high | Copy the container design: ZIP + readable JSON + binary assets + published format spec. This is the reference pattern for Crafty's own open persistence/export format (not `.pen`, not `.fig`) |
| Token import/export is JSON per DTCG conventions (single file, multifile folder with $themes.json/$metadata.json, or ZIP); tokens importable from connected libraries | https://help.penpot.app/user-guide/design-systems/design-tokens/ | captured 2026-08-06 | official docs | native | high | Copy: token interchange via DTCG JSON, including the multifile/$themes layout |

---

## 5. Excalidraw (MIT, open source)

The smallest and most focused system surveyed. Its source is the evidence for most claims; absence-of-feature claims are `inferred` from the element/type model.

### 5.1 Infinite canvas

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| "Infinite, canvas-based whiteboard"; whole scene is one `elements` array, no extents; zoom clamped `MIN_ZOOM = 0.1` / `MAX_ZOOM = 30`, `ZOOM_STEP = 0.1` | https://raw.githubusercontent.com/excalidraw/excalidraw/master/README.md ; https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/common/src/constants.ts | master, 2026-08-06 | source repository | native | high | Copy: explicit zoom clamp constants (10%–3000%). Crafty should define and document its clamp instead of leaving it implicit like Figma |

### 5.2 Grids / guides / snapping

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Grid is an optional toggle drawn on the static canvas (`strokeGrid`, `gridSize`/`gridStep`; defaults 20 px, bold line every 5); not drawn on export | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/renderer/staticScene.ts ; https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/common/src/constants.ts | master, 2026-08-06 | source repository | configurable | high | Copy: grid as render-only overlay (never exported), user-configurable step — same principle as Figma/Penpot guides |
| Object snapping: `SNAP_DISTANCE = 8` (zoom-scaled) drives point/corner/gap snaps while moving, resizing, creating; dashed "snap lines"; Ctrl/Cmd temporarily toggles | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/snapping.ts | master, 2026-08-06 | source repository | native | high | Copy: 8 px screen-space snap threshold scaled by zoom + snap-line rendering + temporary toggle key |

### 5.3 Pages

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| **No pages**: scene is a single ordered `elements` array (plus id map); no page concept in the scene model or appState | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/element/src/Scene.ts | master, 2026-08-06 | source repository | inferred (documented absence) | high | Do not copy the absence — Crafty pages are a core differentiator. Note: absence is verified against source, worth citing when reviewers ask "do we need pages?" |

### 5.4 Frames

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Frames exist: `frame`/`magicframe` element types; children carry `frameId`; clipping; frame names; per-frame export (`exportToCanvas`/`exportToSvg` accept `exportingFrame`) | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/element/src/frame.ts ; https://docs.excalidraw.com/docs/codebase/frames | master, 2026-08-06 | source repository + official docs | native | high | Copy: minimal frame = container id on children + clip + per-frame export. Introduced in 0.16.0 (2023-09-19) — a small team shipped frames in a release; scope evidence for Crafty |
| Frames constrain element ordering (children before parent in array) for correct clipping | https://docs.excalidraw.com/docs/codebase/frames | 2026 (live) | official docs | inferred | high | Copy: document ordering invariants for clipping in the data model |

### 5.5 Hierarchy

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Grouping via per-element `groupIds: string[]` (nested groups = array depth); groups are selection/transform units, not parented containers | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/element/src/groups.ts | master, 2026-08-06 | source repository | native | high | Copy: flat group membership array as an alternative to parent-node grouping; cheap and reorder-safe |
| Z-order = array order via fractional indices (`syncMovedIndices`/`syncInvalidIndices`, `validateFractionalIndices`); bring-to-front/send-to-back actions | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/element/src/Scene.ts | master, 2026-08-06 | source repository | native | high | Copy: fractional-index z-order — third independent confirmation of Figma's approach; safe for concurrent edits |

### 5.6 Components / variants

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| **None**: fixed element type enum (rectangle, diamond, ellipse, arrow, line, freedraw, text, image, eraser, frame, ...); nearest analog is copy/paste "shape libraries" | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/common/src/constants.ts | master, 2026-08-06 | source repository | inferred (documented absence) | high | Baseline evidence that a component system is not needed for sketching tools; irrelevant for Crafty's structured design-doc positioning |

### 5.7 Variables / tokens

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| **None**: per-element concrete style values over a fixed palette (open-color); "customizing styles" docs cover editor CSS theming only | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/common/src/constants.ts ; https://docs.excalidraw.com/docs/@excalidraw/excalidraw/customizing-styles | master, 2026-08-06 | source repository + official docs | inferred (documented absence) | medium | Absence note only; no guidance to copy |

### 5.8 Auto-layout / constraints

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| **None** in-editor; layout happens only at import time via `@excalidraw/mermaid-to-excalidraw` (one-shot conversion) | https://plus.excalidraw.com/blog/excalidraw-in-2024/ ; https://registry.npmjs.org/@excalidraw/excalidraw/latest | 2025-01-09 blog; 0.18.1 2026-04-20 | engineering blog + registry manifest | inferred | high | Absence note only. (Mermaid→scene import is a separate feature idea, not layout.) |

### 5.9 Text / vector / image

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Text drawn on canvas with `context.fillText` (multiline, RTL-aware); **editing** happens in an HTML `<textarea>` overlay positioned/scaled/rotated via CSS transform | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/element/src/renderElement.ts ; https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/wysiwyg/textWysiwyg.tsx | master, 2026-08-06 | source repository | native | high | Copy: DOM-overlay text editing (textarea over canvas with matching transform) — pragmatic pattern for Crafty's first editor milestone |
| Shapes drawn via rough.js on Canvas 2D (sketch style); per-element offscreen cached canvases; freedraw via perfect-freehand; images via `context.drawImage` with crop; eraser tool | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/element/src/renderElement.ts | master, 2026-08-06 | source repository | native | high | Copy the per-element offscreen canvas cache idea; do NOT copy Canvas 2D as the final renderer (Crafty's WebGPU path supersedes it) |

### 5.10 Multiplayer / revision semantics

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Collab is app-level: hosted app uses the socket.io `excalidraw-room` server (or VITE_APP_WS_SERVER_URL) + Firebase for scene/files; the OSS npm editor ships no collab | https://raw.githubusercontent.com/excalidraw/excalidraw-room/master/README.md | master, 2026-08-06 | source repository | configurable | high | Copy: collab as an opt-in app layer over a plain scene model — validates keeping Crafty's core multiplayer-free |
| End-to-end encryption: room key from URL decrypts socket payloads (`decryptData`) and encrypts files pre-upload; `ENCRYPTION_KEY_BITS = 128` | https://raw.githubusercontent.com/excalidraw/excalidraw/master/excalidraw-app/collab/Collab.tsx | master, 2026-08-06 | source repository | native (hosted app) | high | Copy the design when Crafty adds shared sessions: URL-carried room key, client-side AES, encrypted payloads |
| Presence: mouse-location broadcasts, idle/active thresholds (60 s/3 s), user-follow with visible-bounds relay | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/common/src/constants.ts ; https://raw.githubusercontent.com/excalidraw/excalidraw/master/excalidraw-app/collab/Collab.tsx | master, 2026-08-06 | source repository | native (hosted app) | high | Copy: idle detection + follow-by-bounds — small, standard presence vocabulary |
| Undo/redo is in-memory only (`History` undoStack/redoStack of deltas); multiplayer undo/redo added 0.18.0 (2025-03-11); **no server-side version history** in OSS (versioning is a commercial Excalidraw+ roadmap item) | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/history.ts ; https://github.com/excalidraw/excalidraw/releases | 0.18.0 2025-03-11 | source repository + release notes | native (in-memory) | high | Copy: diff-based undo stacks; note that server-side history is what separates commercial from OSS — Crafty's local versioning is a differentiator |

### 5.11 Rendering strategy

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Canvas 2D API (no WebGL anywhere) via rough.js (`rough.canvas`); separate static (elements/grid) vs interactive (selection/UI) canvas layers; React for chrome; npm deps: roughjs 4.6.4, perfect-freehand 1.2.0 | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/element/src/renderElement.ts | master, 2026-08-06 | source repository | native | high | Copy the two-layer canvas split (content vs UI overlay); do NOT copy Canvas 2D for the product renderer |
| Frame labels rendered in DOM while editing (comment in export code) | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/scene/export.ts | master, 2026-08-06 | source repository | inferred | medium | Minor: hybrid canvas/DOM rendering for labels is a known wart, not a pattern to copy |

### 5.12 Virtualization / culling

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Viewport culling: `getVisibleCanvasElements` filters elements by `isElementInViewport(element, ..., {zoom, offset, scroll})`; only visible elements passed to `renderStaticScene`; memoized per viewport | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/scene/Renderer.ts ; https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/renderer/staticScene.ts | master, 2026-08-06 | source repository | native | high | Copy: viewport-rect culling of the render list as the baseline (Crafty's spatial index makes this trivial); memoize per viewport-change |
| Per-element offscreen canvas caching (WeakMap keyed by element) avoids redrawing unchanged elements | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/element/src/renderElement.ts | master, 2026-08-06 | source repository | native | high | Copy: cache resolved geometry/textures per stable element id — same idea as Figma's bind-group reuse and Penpot's tile cache |

### 5.13 Export

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Export API: `exportToCanvas`, `exportToBlob`, `exportToSvg`, `exportToClipboard({type: 'png'|'svg'|'json'})`; options exportBackground/exportWithDarkMode/exportEmbedScene | https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export | 2026 (live) | official docs | native | high | Copy: exportEmbedScene — scene JSON embedded in exported PNG/SVG as base64 payload; brilliant round-trip pattern for Crafty exports |
| SVG export: rough.svg into an SVG root, inlined font-face declarations, per-frame clipPath, `<!-- svg-source:excalidraw -->` + `payload-version:2` base64 scene; font subsetting since 0.18.0 | https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/scene/export.ts ; https://github.com/excalidraw/excalidraw/releases | 0.18.0 2025-03-11 | source repository + release notes | native | high | Copy: font subsetting in SVG export (small, high-value); payload comments for tool detection |
| PNG honors background choice, padding, scale; `.excalidraw` JSON open format; MIME types `application/vnd.excalidraw+json`, `application/vnd.excalidraw.clipboard+json` | https://raw.githubusercontent.com/excalidraw/excalidraw/master/README.md | master, 2026-08-06 | source repository | native | high | Copy: registered MIME types for clipboard formats — a detail Figma/Penpot docs don't cover |

---

## 6. tldraw (custom source-available license)

Corrections vs. common assumptions (all source-verified): current SDK is 5.3.0; shapes render as **HTML DOM**, not SVG; sync is **tldraw's own engine, not Yjs**; there is **no WebGL renderer** in the repo.

### 6.1 Infinite canvas

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Camera system: x/y position + z zoom in page space; `screenToPage()`/`pageToScreen()`; per-page camera records auto-created and restored on page switch | https://tldraw.dev/sdk-features/camera ; https://tldraw.dev/sdk-features/pages | 2026 (live) | official docs | native | high | Copy: camera as a per-page record (persisted viewport state per page) — directly portable to Crafty pages |

### 6.2 Grids / guides / snapping

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| `gridSize` is document-scoped on the `TLDocument` record (default 10 px, "persists across sessions and syncs"); `gridSteps` zoom-adaptive option; `maybeSnapToGrid` when grid mode enabled (v3.5.0, 2024-11-26) | https://raw.githubusercontent.com/tldraw/tldraw/main/packages/tlschema/src/records/TLDocument.ts ; https://api.github.com/repos/tldraw/tldraw/releases | main v5.3.0; 2026-08-06 | source repository + release notes | configurable | high | Copy: grid size stored **in the document** (not a UI preference) — matches Crafty's durable-model principle |
| SnapManager (`editor.snaps`): bounds snapping (edges/centers/corners), handle snapping, gap snapping; 8 px threshold scaled by zoom; snap lines as SVG overlays | https://tldraw.dev/sdk-features/snapping | 2026 (live) | official docs | native | high | Copy: the three snap kinds (bounds/handle/gap) — same 8 px threshold as Excalidraw; treat 8 px as an industry norm |

### 6.3 Pages

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Multi-page core: `page:` records, each with own shapes, camera, selection state; document-wide undo/redo; `maxPages` option default 40 | https://tldraw.dev/sdk-features/pages | 2026 (live) | official docs | native | high | Copy: page = independent scene-graph root record. The maxPages=40 cap is a product decision — Crafty should decide deliberately, not inherit |

### 6.4 Frames

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Frame shape: container with labeled header, holds other shapes; children clipped to bounds, move/rotate with frame, export together as one unit; `FrameShapeUtil.isExportBoundsContainer() = true`; arrows can bind to frames (v5.3.0 fix: bound arrows duplicate/delete with frame) | https://tldraw.dev/sdk-features/frame-shape ; https://api.github.com/repos/tldraw/tldraw/releases | 2026 (live); v5.3.0 2026-08-05 | official docs + release notes | native | high | Copy: frame as export-bounds container + label header (labels are a cheap, high-QoL touch) |

### 6.5 Hierarchy

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Flat record store (shapes/pages/bindings/assets records) with parent-child via `parentId` (page id or shape id) and fractional-index `index` for z-order; `binding:` records for relational edges; `getSortedChildIdsForParent` | https://tldraw.dev/sdk-features/parenting ; https://tldraw.dev/sdk-features/store | 2026 (live) | official docs | native | high | Copy: flat records + parentId + fractional index (fourth independent confirmation); **bindings as first-class records** — matches Crafty's prototype-connection plans |
| Store: three scopes (document/session/presence), indexed queries, computed caches, transactions, snapshots with migrations | https://tldraw.dev/sdk-features/store | 2026 (live) | official docs | native | high | Copy the scope split: document vs session (UI state) vs presence (ephemeral) — validates Crafty's "runtime state never serialized" rule |

### 6.6 Components / variants

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| **None**: extensibility via ShapeUtil classes + `configure()` options; "templates" in release notes are npm starter kits, not canvas components | https://tldraw.dev/docs/shapes ; https://raw.githubusercontent.com/tldraw/tldraw/main/README.md | main v5.3.0, 2026-08-06 | official docs + source repository | inferred (documented absence) | high | Absence note only. (ShapeUtil extension model is a plugin pattern, not a component system — don't conflate) |

### 6.7 Variables / tokens

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| **None**: per-shape style props constrained to fixed enums (color, fill, size, dash, font) | https://tldraw.dev/sdk-features/default-shapes | 2026 (live) | official docs | inferred (documented absence) | high | Absence note only |

### 6.8 Auto-layout / constraints

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| **None** built-in; the generic binding system (fromId/toId + lifecycle hooks) is explicitly positioned as the way to implement layout constraints yourself ("layout bindings" example app) | https://tldraw.dev/sdk-features/bindings | 2026 (live) | official docs | n/a (extension point only) | high | Copy the binding lifecycle hooks (onBeforeCreate/onAfterChange etc.) as the extension seam for future auto-layout in Crafty |

### 6.9 Text / vector / image

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| 13 default shape types (text, note, geo, draw, line, highlight, image, video, bookmark, embed, frame, group, arrow); rich text via TipTap; pressure-sensitive draw stored delta-encoded base64; raster image shapes with crop/flip; iframe embeds | https://tldraw.dev/sdk-features/default-shapes | 2026 (live) | official docs | native | high | Copy: delta-encoded base64 path storage (compact + pressure fidelity); embedded-content shape type (Crafty may want live preview embeds) |
| Shapes render as HTML divs with CSS transforms; export produces SVG, wrapping non-SVG shapes in `<foreignObject>` | https://tldraw.dev/sdk-features/image-export | 2026 (live) | official docs | inferred | high | Copy the foreignObject fallback for vector export of DOM-rendered content — useful until Crafty's renderer covers all nodes |

### 6.10 Multiplayer / revision semantics

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| tldraw sync is **tldraw's own engine, not Yjs**: "Our tldraw sync engine uses the same public APIs that you can use instead to connect other backends like Yjs, Replicache, Liveblocks, or your own custom-built solution"; `@tldraw/sync-core@5.3.0` has no yjs dependency | https://tldraw.dev/blog/announcing-tldraw-sync ; https://registry.npmjs.org/@tldraw/sync-core/latest | blog 2024-08-05; 5.3.0 2026-08-05 | engineering blog + registry | native | high | Copy the architecture: sync as a replaceable backend behind one API; the engine choice is not the product. Corrects the common "tldraw = yjs" assumption in earlier notes |
| Sync model: WebSocket rooms, `TLSocketRoom` per document (authoritative state + conflict resolution), InMemory/SQLite storage backends, presence via `instance_presence` records; long-term document history explicitly NOT provided ("storing snapshots of documents over time for long-term history" is left to you) | https://tldraw.dev/docs/sync | 2026 (live) | official docs | native (history: absent) | high | Copy: server-authoritative room per document + pluggable storage; the explicit long-term-history gap is evidence Crafty's durable local versioning is a differentiator |
| Undo/redo is session-local, diff-based (marks/bail/squash); captures only `source: 'user'` changes (ignores remote); remote merges batch into one history entry | https://tldraw.dev/sdk-features/history ; https://tldraw.dev/sdk-features/collaboration | 2026 (live) | official docs | native (local-only) | high | Copy: user-sourced-change tagging in history + batching remote merges — design Crafty's undo to tolerate future sync |

### 6.11 Rendering strategy

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| v5 renders shapes as HTML DOM elements (divs) positioned with CSS transforms, memoized per-shape React components driven by @tldraw/state signals; README calls it a "DOM canvas" | https://raw.githubusercontent.com/tldraw/tldraw/main/packages/editor/src/lib/components/Shape.tsx ; https://raw.githubusercontent.com/tldraw/tldraw/main/README.md | main v5.3.0, 2026-08-06 | source repository | native | high | Do NOT copy DOM-per-shape rendering for Crafty's core renderer (it caps at DOM-node scale); copy the signal-driven update model (only changed shapes re-render) |
| No WebGL renderer in the repo (packages list verified); only WebGL content is the v4.1.0 "Shader Starter Kit" (user-side canvas background template) | https://api.github.com/repos/tldraw/tldraw/contents/packages ; https://api.github.com/repos/tldraw/tldraw/releases | main v5.3.0; 2026-08-06 | source repository | inferred (documented absence) | high | Absence note: corrects the assumption that "whiteboard SDK = WebGL"; tldraw's own perf answer is culling + signals |

### 6.12 Virtualization / culling

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Culling via spatial index: offscreen shapes stay in DOM but get `display: none`; selected/editing shapes never culled; per-shape opt-out via `ShapeUtil.canCull`; "a canvas with 10,000 shapes might only render 50 if the rest are out of view" | https://tldraw.dev/sdk-features/culling ; https://tldraw.dev/sdk-features/performance | 2026 (live; performance page edited 2026-01-31) | official docs | native | high | Copy: culling with protected set (selection/editing never culled) + per-node opt-out — cheap and predictable |
| Performance systems: reactive signals (only changed shapes re-render), batched store updates, debounced zoom (>500 shapes), geometry caching, LOD (image resolution via steppedScreenScale; pattern fills → solid at low zoom) | https://tldraw.dev/sdk-features/performance | 2026-01-31 (edited) | official docs | native | high | Copy: LOD for raster content + pattern simplification at low zoom — two knobs Crafty's render-plan should include |

### 6.13 Export

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Export pipeline produces self-contained SVG (fonts embedded, styles inlined, media → data URLs), rasterizes to PNG/JPEG/WebP; APIs `getSvgElement`, `getSvgString`, `toImage`, `toImageDataUrl`; options format/pixelRatio/background/padding | https://tldraw.dev/sdk-features/image-export | 2026 (live) | official docs | native | high | Copy: self-contained SVG (font embedding + style inlining + data URLs) as the export contract — matches Penpot's vector-export path |
| Clipboard: versioned, LZ-compressed `TLContent` (shapes+bindings+assets+schema) in `<div data-tldraw>` HTML payload; paste with ID remapping + schema migration | https://tldraw.dev/sdk-features/clipboard | 2026 (live) | official docs | native | high | Copy: versioned + compressed clipboard payload with schema migration and ID remapping — Crafty's clipboard should carry schema version too |

---

## 7. Rive (editor SaaS; runtimes MIT)

Positioning note: Rive is a motion/animation tool, not a general design editor. Absences (pages, tokens, Figma-style variants) are `inferred` from the full docs index; the docs tree was enumerated, not guessed.

### 7.1 Infinite canvas

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| "The Stage is an infinite canvas where you can place artboards containing all your graphics"; "You can create infinite artboards on the Stage" | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/interface-overview/stage.mdx ; https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/fundamentals/artboards.mdx | main, 2026-08-06 | official docs | native | high | Same model as Penpot/Figma: unbounded stage, bounded composition units |

### 7.2 Grids / guides / snapping

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Rulers, guides (lockable/clearable), snapping toggle + pixel snapping, align-to-artboard-or-each-other, distribute spacing; no document grid documented | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/interface-overview/stage.mdx | main, 2026-08-06 | official docs | native (features); inferred (grid absence) | high / medium | Confirms the common feature set (rulers/guides/snap/align/distribute); grid absence is fine for artboard-centric tools |

### 7.3 Pages

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| **No pages**: artboards are the composition unit; one active artboard at a time; "only the active artboard's hierarchy is displayed in the tree" | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/fundamentals/artboards.mdx | main, 2026-08-06 | official docs | inferred (documented absence) | high | Absence note only — Rive files are runtime assets, not documents |

### 7.4 Frames (artboards)

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Artboards: bounded, sizeable frames (Width/Height; **Fixed or Hug** sizing), fill/background, origin point, per-artboard layout settings and render presets; root of the scene graph | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/fundamentals/artboards.mdx | main, 2026-08-06 | official docs | native | high | Copy: Fixed-vs-Hug sizing on containers (same vocabulary as Figma/Penpot) + per-container render presets (export settings attached to the frame) |

### 7.5 Hierarchy

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Scene graph: artboard > node tree, arbitrary nesting; children inherit parent transforms from parent origin; hierarchy controls draw order; parent indices serialized in the .riv file | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/interface-overview/hierarchy.mdx ; https://raw.githubusercontent.com/rive-app/rive-docs/main/runtimes/advanced-topic/format.mdx | main, 2026-08-06 | official docs | native | high | Copy: parent-index serialization in a binary format (compact, deterministic); "inherits parent transforms" is the baseline model |

### 7.6 Components / variants

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Reusable Components (formerly "Nested Artboards") with instances (Node/Leaf/Layout modes; simple/remap animations; mix values); "Changes made to the source component are reflected across all of its instances"; only flagged components export | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/fundamentals/components.mdx | main, 2026-08-06 | official docs | native | high | Copy: the instance-mode model (node vs layout) and explicit "export only flagged components" rule — a deliberate include/exclude bit Crafty may want |
| **No Figma-style variants**; instead a data-binding system (View Models: Number/String/Boolean/Trigger/Enum/Color/Image/Artboard/List properties; "Stateful Components") | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/fundamentals/components.mdx ; https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/data-binding/view-models.mdx | main, 2026-08-06 | official docs | native (binding); inferred (variant absence) | high | Copy the property-type enum idea for data binding; do NOT copy it as a variant replacement |

### 7.7 Variables / tokens

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| **No design tokens**; variable-like mechanisms are deprecated state-machine Inputs (boolean/trigger/number — "DEPRECATED: Use Data Binding instead of Inputs") and View Model properties | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/state-machine/inputs.mdx | main, 2026-08-06 | official docs | native (state-machine vars); inferred (token absence) | high | Copy the deprecation discipline: Rive replaced a variable mechanism with a cleaner one in-place — evidence for Crafty to evolve tokens in-place rather than parallel systems |

### 7.8 Auto-layout / constraints

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Full layout system "a bit like Flex Boxes in CSS, but without being forced to work exclusively in a box model": Row/Column (+ reverse), wrap, justify, gap, padding/margin, Fixed/Hug/Fill + `fr` (fill-ratio) units, min/max size, absolute vs relative positioning, clip, LTR/RTL | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/layouts/layouts-%26-constraints.mdx | main, 2026-08-06 | official docs | native | high | Copy: layout coexisting with freeform canvas + fr units (same semantics as Penpot's grid fr and Figma's fill) — convergent evidence for the layout vocabulary |
| Constraints are rigging/animation constraints (IK, distance, transform, translation, scale, rotation) — not Figma-style resize constraints | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/layouts/layouts-%26-constraints.mdx | main, 2026-08-06 | official docs | native | high | Terminology warning: "constraints" means different things across products — keep Crafty's naming distinct |

### 7.9 Text / vector / image

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Text via runs + styles + glyph modifiers (per-glyph animation); vector via paths, procedural shapes, trim paths, Shape Builder combining; images as assets + deformable image meshes; bones + IK skeletal animation | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/text/text-runs.mdx | main, 2026-08-06 | official docs | native | high | Copy the text-run model (multiple styles within one text element = Penpot/Figma rich-text equivalent) — a clean data shape for Crafty text records |

### 7.10 Multiplayer / revision semantics

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Multi-user presence (shared-file cursors, toggleable); server-side Revision History: auto-save, named revisions, and "even restoring revisions is non-destructive" (copy-and-reinsert) | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/fundamentals/revision-history.mdx ; https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/interface-overview/stage.mdx | main, 2026-08-06 | official docs | native | high | Copy: non-destructive restore (restore creates a new revision rather than overwriting) — same philosophy as Figma/Penpot; good default for Crafty |
| No documented comments/branching/merge semantics | — | — | — | inferred | medium | Absence note only |

### 7.11 Rendering strategy

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| Custom C++ vector renderer ("Rive Renderer") with RenderContextImpl backends for Metal, Vulkan, D3D11, D3D12, OpenGL/WebGL, plus WebGPU in-tree; Canvas2D/Skia/Impeller adapters over an abstract Renderer interface | https://raw.githubusercontent.com/rive-app/rive-runtime/main/README.md | main, 2026-08-06 | source repository | native | high | Copy: abstract renderer interface with multiple backends + WebGPU as one backend (Crafty's WebGPU-host + future native wgpu path is the same shape) |
| Renderer is "a novel geometric reduction of antialiased vector paths into unique triangle patches. A massively parallel triangle rasterization pipeline... for drawing Bézier curves"; earlier content used Skia/HTML Canvas | https://rive.app/blog/vector-rendering (engineering blog, 2024-03-19) | 2024-03-19 | engineering blog | native | high | Note only: a GPU vector-triangulation approach (cf. Figma's WebGL vector rendering). Too deep to copy; the takeaway is that GPU vector rendering is the production bar |
| Content ships as compiled binary `.riv` (current major format v7; fingerprint "RIVE"; LEB128 varints; table-of-contents with backing types so older runtimes skip unknown objects/properties) | https://raw.githubusercontent.com/rive-app/rive-docs/main/runtimes/advanced-topic/format.mdx | main, 2026-08-06 | official docs | native | high | Copy the ToC skip-unknown design: forward-compatible binary formats tolerate version skew — directly applicable to Crafty's versioned render packets and scene API |

### 7.12 Virtualization / culling

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| CPU-level draw-op culling: each draw's pixel bounds intersected with the accumulated clip bounds (`overallClipPixelBounds`), skipping draws whose intersection is empty | https://raw.githubusercontent.com/rive-app/rive-runtime/main/renderer/src/rive_renderer.cpp | main, 2026-08-06 | source repository | native | high | Copy: clip-bounds-accumulated culling in the renderer (cull at draw-list construction, not just viewport rect) — complements Excalidraw/tldraw/Penpot evidence |

### 7.13 Export

| Claim | URL | Version/date | Evidence | Class | Conf. | Crafty guidance |
|---|---|---|---|---|---|---|
| `.riv` export (Publish / Export > For runtime) for the open-source runtimes; file designed for backwards compatibility (newer editor files load in older runtimes; unknown features skipped) | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/exporting/exporting-for-runtime.mdx | main, 2026-08-06 | official docs | native | high | Copy: runtime-export pipeline separate from document format — Crafty's render packets are the analog; backwards-compat policy is a lesson |
| Cloud renderer for video/static: H.264, GIF, PNG Sequence, SVG Sequence, WebM, PNG, SVG via render presets + queue; paid plans gate export | https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/exporting/exporting-for-video-and-static-design.mdx | main, 2026-08-06 | official docs | native (paid) | high | Do NOT copy cloud-render dependency for static export — offline/local export is a Crafty differentiator; note SVG is available even for motion |

---

## 8. Synthesis: what Crafty should and should not copy

Grounded in Crafty's target architecture: durable renderer-independent authored document; kernel-owned commands/transactions/history; stable IDs + node maps + parent links + explicit child order; resolution pipeline (reference → layout → animation → world transforms → scene snapshot → versioned render packets → Rust/WASM encoder + WebGPU host); local-first, multiplayer later.

### 8.1 Copy (evidence-backed)

| What | From | Evidence anchor | Why |
|---|---|---|---|
| Node map + parent-link-on-child + stable IDs | Figma | figma.com/blog/how-figmas-multiplayer-technology-works/ (2019-10-16) | Already Crafty's plan; this is the primary justification; collab-safe identity |
| Fractional indexing for ordered children | Figma, Excalidraw, tldraw (3 independent confirmations) | Figma blog; excalidraw `Scene.ts`; tldraw `parenting` docs | Deterministic, concurrent-reorder safe, trivial |
| Instance subtrees resolved/cached/invalidated-by-dependency, never authored | Figma | figma.com/blog/how-we-rebuilt-the-foundations-of-component-instances/ (2026-03-17) | Maps 1:1 to Crafty's resolution stage; 40–50% mode-change speedup evidence |
| Variants as property/values matrix + connected-layer override rule | Figma, Penpot | help.figma.com 360056440594; help.penpot.app variants doc | Cheap data model; Penpot documents the override-mapping heuristic |
| DTCG (W3C) token JSON import/export + sets/themes/groups | Penpot | help.penpot.app design-tokens doc | The interop standard; Crafty should be DTCG-compatible for token interchange |
| Token alias/reference + modes + scoping | Figma, Penpot | help.figma.com 14506821864087 | Core token semantics; modes = light/dark value sets |
| Flexbox-parity auto layout (hug/fill/fixed/min-max, border-box, inside-stroke-as-border) defined from day one | Figma | help.figma.com 42031586813719 | Deterministic, CSS-exportable; avoid Figma's legacy-engine migration pain (default July 2026, removal Jan 2027) |
| CSS Grid as a second layout primitive (fr/auto/px, merged areas) | Penpot | help.penpot.app flexible-layouts doc | Penpot's grid is real CSS Grid; Figma only approximates it |
| Per-page camera records + page-scoped load/stream granularity | tldraw, Figma | tldraw.dev pages/camera docs; figma.com/blog/speeding-up-file-load-times (2024-05-22) | Fits Crafty's Workspace/Project/File/Page layering; −70% client memory evidence |
| Page/component share a Container abstraction | Penpot | help.penpot.app data-model doc | Simplifies the resolution pipeline |
| Bindings as first-class records with lifecycle hooks | tldraw | tldraw.dev bindings doc | Matches Crafty's prototype-connection records; extension seam for future auto-layout |
| Whole-value (never char-level) text conflicts | Figma | figma.com/blog/how-figmas-multiplayer-technology-works/ | Product decision adoptable before any multiplayer |
| Undo/redo tagged `source: user` + remote merges batched to one history entry | tldraw | tldraw.dev history + collaboration docs | Future-proofs Crafty's undo for sync |
| Timed auto-checkpoints + named versions, non-destructive restore; pinned-vs-autosave retention + author/timestamp entries | Figma, Penpot, Rive | help.figma.com 360038006754; help.penpot.app workspace-basics; rive revision-history doc | Convergent history semantics; Penpot's policy is more auditable |
| 8 px screen-space snap threshold + snap-line rendering + three snap kinds (bounds/handle/gap) | Excalidraw, tldraw | excalidraw `snapping.ts`; tldraw.dev snapping doc | Industry norm, both verify the same number |
| Guides as frame-scoped non-destructive settings that never export; pixel snapping with always-snap containers | Figma, Penpot, Excalidraw | help.figma.com 360040450513 + 360041065034; help.penpot.app workspace-basics; excalidraw `staticScene.ts` | Convergent across all three |
| Viewport-rect culling of render list + per-element cached canvases + clip-bounds-accumulated draw culling | Excalidraw, tldraw, Penpot, Rive | excalidraw `Renderer.ts`; tldraw.dev culling doc; penpot `render-wasm/docs/tile_rendering.md`; rive `rive_renderer.cpp` | Crafty's spatial index makes culling trivial; the Penpot tile spec (512px tiles, LRU, priority, budget) is the most complete public design |
| Tile-based rendering with LRU texture cache, preload region, distance priority, per-frame budget | Penpot | `render-wasm/docs/tile_rendering.md` | Direct input to Crafty's render-plan design |
| LOD: stepped image resolution + pattern simplification at low zoom | tldraw | tldraw.dev performance doc | Two concrete knobs for the render plan |
| One shader source → GLSL + WGSL via naga; batched uniform uploads; bind-group reuse; explicit draw-call args | Figma | figma.com/blog/figma-rendering-powered-by-webgpu/ (2025-09-18) | Validates Crafty's render-packet approach; avoids dual shader dialects |
| Dynamic backend fallback on device loss (WebGPU→WebGL), device blocklist rollout | Figma | figma.com/blog/figma-rendering-powered-by-webgpu/ | Already Crafty's renderer-failure-policy target; this is the anchor citation |
| One engine, WASM + native targets | Figma | figma.com/blog/webassembly-cut-figmas-load-time-by-3x/ (2017-06-08) | Validates Rust/WASM + native wgpu path |
| Abstract renderer interface with multiple backends; WebGPU as one backend | Rive | rive-runtime README | Same shape as Crafty's WebGPU-host + future native path |
| Versioned binary container with skip-unknown table-of-contents | Rive | rive docs `format.mdx` (major v7) | Forward-compatible version skew handling for Crafty's render packets |
| SVG↔shape round-trip with embedded metadata; SVG import → editable vectors | Penpot, Figma | help.penpot.app data-model; help.figma.com 360040028034 | Lossless import/export foundation |
| Images-as-fills + 4096×4096 downscale cap | Figma | help.figma.com 360040028034 | Simple, defensible default |
| DOM-overlay text editing (textarea over canvas) | Excalidraw | `textWysiwyg.tsx` | Pragmatic first-milestone pattern |
| Rich text via runs/styles (multi-style text) | Rive | rive docs text-runs | Clean text record shape |
| Export: self-contained SVG (fonts embedded, styles inlined, media→data URLs) + foreignObject fallback | tldraw | tldraw.dev image-export | The export contract; Penpot's Skia CPU path is the vector-fidelity alternative |
| Scene-JSON embedded in exported PNG/SVG + registered clipboard MIME types | Excalidraw | `scene/export.ts`; README | Round-trip exports; clipboard content negotiation |
| Multi-export presets (format + scale + suffix) incl. WEBP; page→single PDF; slice/region export; copy-as-PNG/SVG | Penpot, Figma | help.penpot.app exporting-layers; help.figma.com 360040028114 + 13402894554519 | Product surface worth matching; WEBP fills a Figma gap |
| Collab as opt-in app layer over a plain scene model; URL-carried room key + client-side encryption; presence with idle detection | Excalidraw, Penpot | excalidraw `Collab.tsx`; penpot architecture/frontend | Multiplayer-free core is validated; when Crafty adds sync, these are the patterns |
| `.penpot`-style open container format: ZIP + readable JSON + binary assets + published spec | Penpot | help.penpot.app penpot-file-format | Reference pattern for Crafty's own format/export (not `.pen`, not `.fig`) |
| Document-scoped grid size + persisted snap preference | tldraw, Penpot | tldraw `TLDocument.ts`; help.penpot.app workspace-basics | Grid/snap state belongs in the document, not UI prefs |

### 8.2 Do NOT copy

| What | From | Reason |
|---|---|---|
| Server-side OT/CRDT machinery, QueryGraph, one-process-per-document sync | Figma | Multiplayer is future; the semantics (property-atomic LWW, fractional indexing) are the lesson, not the architecture |
| Constraints + auto layout + "ignore auto layout" triple model | Figma | Figma itself is migrating to flexbox parity; carry one model forward |
| Custom (browser-independent) text rendering | Figma | Large investment; platform text suffices initially |
| Vector networks (branching paths) | Figma | Standard paths + non-destructive booleans (Penpot) cover the need |
| SVG-in-DOM renderer and its two-renderer co-existence | Penpot | The thing Penpot is replacing; no culling strategy; dual renderers multiply maintenance (Figma's dynamic fallback is the lighter dual path) |
| ClojureScript/Potok architecture, Penpot code, or Penpot naming | Penpot | MPL-2.0 allows reading; Crafty's TypeScript kernel is independently designed (research-ledger rule) |
| DOM-per-shape ("DOM canvas") rendering | tldraw | Caps at DOM-node scale; Crafty has a WebGPU path; copy the signal update model instead |
| tldraw SDK dependency for the product core | tldraw | Custom source-available license, production requires license key (research-ledger rule) |
| Yjs (or any single sync engine) as the product | tldraw | tldraw's own docs: the engine should be replaceable behind one API |
| Parallel legacy styles + new tokens systems | Penpot | One token mechanism + import adapters |
| Cloud-render export dependency / paid export gates | Rive | Offline local export is a Crafty differentiator |
| `.pen`, `.fig`, or any external format as persistence | all | External formats are import/export adapters only (research-ledger rule) |
| maxPages=40 or 5,000-variables-per-collection caps | tldraw, Figma | Artifacts of their scale, not goals; decide caps deliberately |

### 8.3 Decisions surfaced by this research

1. **Layout model**: adopt flexbox-parity (hug/fill/fixed/min-max) as primary; decide now whether CSS Grid is in scope (Penpot proves it is tractable) or deferred.
2. **Token standard**: commit to DTCG-compatible JSON import/export; decide whether Crafty's internal token model is DTCG-shaped or DTCG-interchange-only.
3. **Zoom clamp**: define and document explicit min/max zoom (Excalidraw: 0.1–30) — Figma never documented theirs.
4. **Auto-reparent rule**: Figma's "smaller-than-frame becomes child" is implicit magic; Crafty should make it an explicit, documented kernel rule or reject it.
5. **History retention**: choose Figma's flat 30-min checkpoints, Penpot's pinned-vs-7-day split, or Rive's restore-creates-new-revision; all are non-destructive.
6. **Constraint defaults**: Penpot defaults "Scale", Figma defaults "Top+Left" — pick deliberately.
7. **Culling budget**: adopt Penpot's per-frame tile budget + distance priority as the rendering contract once real loads exist.

---

## 9. Source index (all URLs verified by fetch on 2026-08-06)

### Figma
- https://www.figma.com/blog/figma-rendering-powered-by-webgpu/ (2025-09-18; spot-verified 2026-08-06)
- https://www.figma.com/blog/webassembly-cut-figmas-load-time-by-3x/ (2017-06-08)
- https://www.figma.com/blog/how-figmas-multiplayer-technology-works/ (2019-10-16)
- https://www.figma.com/blog/speeding-up-file-load-times-one-page-at-a-time/ (2024-05-22)
- https://www.figma.com/blog/how-we-rebuilt-the-foundations-of-component-instances/ (2026-03-17)
- https://help.figma.com/hc/en-us/articles/15297425105303-Explore-design-files
- https://help.figma.com/hc/en-us/articles/360041065034-Adjust-your-zoom-and-view-options
- https://help.figma.com/hc/en-us/articles/360040450513-Create-layout-guides
- https://help.figma.com/hc/en-us/articles/360040450233-Arrange-layers-with-Smart-selection
- https://help.figma.com/hc/en-us/articles/360041539473-Frames-in-Figma-Design
- https://help.figma.com/hc/en-us/articles/360039957734-Apply-constraints-to-define-how-layers-resize
- https://help.figma.com/hc/en-us/articles/360039959014-Parent-child-and-sibling-relationships
- https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-components-in-Figma
- https://help.figma.com/hc/en-us/articles/360056440594-Create-and-use-variants
- https://help.figma.com/hc/en-us/articles/360041051154-Guide-to-libraries-in-Figma
- https://help.figma.com/hc/en-us/articles/14506821864087-Overview-of-variables-collections-and-modes
- https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma
- https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout
- https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind
- https://help.figma.com/hc/en-us/articles/360039956434-Guide-to-text-in-Figma-Design
- https://help.figma.com/hc/en-us/articles/360040450213-Vector-networks
- https://help.figma.com/hc/en-us/articles/360040028034-Add-images-and-videos-to-design-files
- https://help.figma.com/hc/en-us/articles/360038006754-Use-version-history
- https://help.figma.com/hc/en-us/articles/360039825314-Guide-to-comments-in-Figma
- https://help.figma.com/hc/en-us/articles/13402894554519-Export-formats-and-settings-for-static-designs
- https://help.figma.com/hc/en-us/articles/360040028114-Export-static-designs-from-Figma

### Penpot
- https://github.com/penpot/penpot (repo; MPL-2.0 LICENSE at raw.githubusercontent.com/penpot/penpot/main/LICENSE)
- https://github.com/penpot/penpot/releases (2.17.0 2026-07-22; 2.16.0 2026-06-11; 2.16.2 2026-07-01; 2.15.x)
- https://github.com/penpot/penpot/tree/develop/frontend/src/app/main/ui/workspace
- https://github.com/penpot/penpot/tree/develop/render-wasm
- https://raw.githubusercontent.com/penpot/penpot/develop/render-wasm/docs/tile_rendering.md
- https://raw.githubusercontent.com/penpot/penpot/develop/render-wasm/docs/rendering_architecture.md
- https://help.penpot.app/user-guide/designing/workspace-basics/
- https://help.penpot.app/user-guide/designing/layers/
- https://help.penpot.app/user-guide/designing/flexible-layouts/
- https://help.penpot.app/user-guide/designing/text-typo/
- https://help.penpot.app/user-guide/design-systems/components/
- https://help.penpot.app/user-guide/design-systems/variants/
- https://help.penpot.app/user-guide/design-systems/design-tokens/
- https://help.penpot.app/user-guide/design-systems/assets/
- https://help.penpot.app/user-guide/design-systems/libraries/
- https://help.penpot.app/user-guide/export-import/exporting-layers/
- https://help.penpot.app/user-guide/export-import/export-import-files/
- https://help.penpot.app/user-guide/first-steps/troubleshooting-webgl/
- https://help.penpot.app/technical-guide/developer/architecture/
- https://help.penpot.app/technical-guide/developer/architecture/frontend/
- https://help.penpot.app/technical-guide/developer/data-model/
- https://help.penpot.app/technical-guide/developer/data-model/penpot-file-format/

### Excalidraw
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/README.md
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/LICENSE (MIT)
- https://github.com/excalidraw/excalidraw/releases (0.16.0 2023-09-19; 0.18.0 2025-03-11; 0.18.1 2026-04-20)
- https://registry.npmjs.org/@excalidraw/excalidraw/latest (0.18.1)
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/common/src/constants.ts
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/element/src/Scene.ts
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/element/src/frame.ts
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/element/src/groups.ts
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/element/src/renderElement.ts
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/snapping.ts
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/renderer/staticScene.ts
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/scene/Renderer.ts
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/scene/export.ts
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/history.ts
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/wysiwyg/textWysiwyg.tsx
- https://raw.githubusercontent.com/excalidraw/excalidraw/master/excalidraw-app/collab/Collab.tsx
- https://raw.githubusercontent.com/excalidraw/excalidraw-room/master/README.md
- https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export
- https://docs.excalidraw.com/docs/codebase/frames
- https://plus.excalidraw.com/blog/excalidraw-in-2024/ (2025-01-09)

### tldraw
- https://registry.npmjs.org/tldraw/latest (5.3.0, 2026-08-05)
- https://registry.npmjs.org/@tldraw/sync-core/latest (5.3.0; no yjs dependency)
- https://raw.githubusercontent.com/tldraw/tldraw/main/LICENSE.md (tldraw license)
- https://raw.githubusercontent.com/tldraw/tldraw/main/README.md
- https://raw.githubusercontent.com/tldraw/tldraw/main/packages/editor/src/lib/components/Shape.tsx
- https://raw.githubusercontent.com/tldraw/tldraw/main/packages/tlschema/src/records/TLDocument.ts
- https://api.github.com/repos/tldraw/tldraw/releases?per_page=100 (v3.0.0 2024-09-13; v3.5.0 2024-11-26; v4.0.0 2025-09-18; v4.1.0 2025-10-15; v5.0.0 2026-05-06; v5.3.0 2026-08-05)
- https://api.github.com/repos/tldraw/tldraw/contents/packages (no webgl package)
- https://tldraw.dev/blog/announcing-tldraw-sync (2024-08-05)
- https://tldraw.dev/community/license
- https://tldraw.dev/docs/sync
- https://tldraw.dev/docs/shapes
- https://tldraw.dev/sdk-features/camera
- https://tldraw.dev/sdk-features/pages
- https://tldraw.dev/sdk-features/snapping
- https://tldraw.dev/sdk-features/culling
- https://tldraw.dev/sdk-features/performance
- https://tldraw.dev/sdk-features/history
- https://tldraw.dev/sdk-features/frame-shape
- https://tldraw.dev/sdk-features/parenting
- https://tldraw.dev/sdk-features/default-shapes
- https://tldraw.dev/sdk-features/image-export
- https://tldraw.dev/sdk-features/clipboard
- https://tldraw.dev/sdk-features/store
- https://tldraw.dev/sdk-features/bindings
- https://tldraw.dev/sdk-features/collaboration
- https://tldraw.dev/sdk-features/options

### Rive
- https://raw.githubusercontent.com/rive-app/rive-runtime/main/README.md (repo renamed from rive-renderer; MIT)
- https://raw.githubusercontent.com/rive-app/rive-runtime/main/LICENSE (MIT)
- https://raw.githubusercontent.com/rive-app/rive-runtime/main/renderer/src/rive_renderer.cpp
- https://registry.npmjs.org/@rive-app/canvas/latest (2.39.2, MIT)
- https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/interface-overview/stage.mdx
- https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/interface-overview/hierarchy.mdx
- https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/fundamentals/artboards.mdx
- https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/fundamentals/components.mdx
- https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/fundamentals/revision-history.mdx
- https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/layouts/layouts-%26-constraints.mdx
- https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/text/text-runs.mdx
- https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/state-machine/inputs.mdx
- https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/exporting/exporting-for-runtime.mdx
- https://raw.githubusercontent.com/rive-app/rive-docs/main/editor/exporting/exporting-for-video-and-static-design.mdx
- https://raw.githubusercontent.com/rive-app/rive-docs/main/runtimes/advanced-topic/format.mdx (.riv, major v7)

---

## 10. Open questions / limitations

- **Figma zoom bounds, canvas coordinate limits, per-file node/page limits**: not documented in any primary source. Viewport-tile culling of Figma's renderer is also undocumented — Figma must not be cited for render-layer culling.
- **Figma ruler guides** (canvas-level, distinct from frame layout guides): no dedicated help article found; only frame-level guide snapping was verified.
- **Figma programmatic export endpoints** (`exportAsync`, REST images endpoints): the docs 404'd this session; only API existence is corroborated by the variables guide.
- **Penpot sync internals**: websocket change fan-out is documented; whether conflict handling is CRDT/OT/LWW is not published anywhere primary. Penpot also does not document nested-component support, canvas size/page count/shape count limits (only the 1 GB import cap), or when the WebGL beta becomes default.
- **Excalidraw**: the historical "End-to-end encryption" blog post is dead (404); encryption is verified from source instead. Server-side version history ships only in the commercial Excalidraw+ (roadmap).
- **tldraw**: grid-mode toggle storage in 5.x is not documented (gridSize is document-scoped, but the on/off flag's location is unclear); tldraw sync's wire protocol/conflict semantics are not publicly specified; no WebGL renderer exists in the repo at 5.3.0.
- **Rive**: the vector-rendering blog post URL is cited from the agent's verified fetch but re-verification of the exact slug should be done before external quoting; Rive docs moved from help.rive.app to rive.app/docs (source: rive-docs repo).
- **Dates**: SaaS help pages (Figma, and docs sites without edit dates) are captured 2026-08-06 without visible edit dates; blog/release dates are exact.
- **Method limit**: `inferred` claims for absence of features were verified against source/model enumerations (Excalidraw element types, tldraw packages, Rive docs index), not against every possible code path.

---

*Research artifact only. No production source, package manifest, or doc outside this report was modified; nothing was committed. All URLs verified live on 2026-08-06. Figma WebGPU blog post and Rive export/format/culling sources were re-verified directly during synthesis.*
