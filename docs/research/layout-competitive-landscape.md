# Competitive Landscape: Custom Layout Engine + Bidirectional Translation

**Date:** 2026-08-09 · **Status:** Research synthesis (five parallel deep-research tracks: in-repo state, embeddable engines, design-tool layout models, translation/round-trip prior art, WASM architecture precedents). Companion to `layout-systems.md` (open ADR: Yoga vs Taffy vs own engine).

## TL;DR

1. **Nobody in the field does bidirectional layout translation.** Every design tool's code path is one-way (design → code snapshot); every bidirectional editor (Utopia, Onlook, Paper, Webflow) sidesteps translation by making one representation the truth. Round-tripping CSS flex/grid ↔ Yoga ↔ SwiftUI ↔ a custom model is genuinely unoccupied territory — and the research explains why each hop is lossy.
2. **The field has converged twice.** Design tools converged on *declared* flexbox-style flow with a quarantined absolute escape hatch (Figma 2019→, Penpot 2023, Rive 2024, Sketch Stacks 2025); inference-based models (Sketch Smart Layout, Adobe XD Responsive Resize) died or were relabeled "Legacy." The Rust ecosystem converged on **Taffy** (Servo, Bevy, Zed/GPUI, Blitz, Slint, Lapce).
3. **Recommended posture:** build the custom model as a *flexbox-common-kernel IR with per-subtree dialect flags* (Yoga's Errata API is the proven pattern), embed or crib Taffy's algorithms for the CSS-conformant math, treat SwiftUI/Compose custom layouts as opaque foreign nodes with sampled behavior, and validate translation with Chrome-rendered fixtures at multiple viewports (the Yoga/Taffy conformance method).

---

## 1. Where crafty stands today

- **No layout engine exists** — `bounds: Rect` is the single geometric truth; `align-nodes` is a one-shot bounds rewrite; snapping/grid are positioning aids, not layout (`packages/editor/src/kernel/`). `docs/architecture/layout.md` marks layout "Target. Nothing exists."
- The architecture already reserves the slot: per-child constraints + a flexbox-subset auto layout (Fixed/Hug/Fill) at **stage 4 of the resolution pipeline** (ADR-0005, `scene-resolution.md`), with the engine choice an open ADR (`docs/research/layout-systems.md`).
- The document model has the needed spine: explicit `parentId`/`childIds`, closed command union with inverses, kernel façade — layout work means adding *authored intent* fields to `DocumentNode` plus a resolve stage that never writes back to `bounds`.
- **One-way translation already exists in-repo:** `packages/pen-import` evaluates pen.dev auto-layout (direction/gap/padding/justify/align/fill_container) and flattens it to absolute bounds at import (`index.ts:280-390`) — a precedent for the "in" direction, and exactly the lossy flattening a live engine would replace.
- The WASM canvas is Rust (`packages/scene-renderer/rust` → wgpu/Vello, draw protocol v4), while the kernel/document model is TypeScript. **Where layout runs (TS kernel vs Rust WASM) is a real architectural decision** — see §5.

## 2. How design tools model layout

### Figma — custom C++ engine, "a thoughtful subset of flexbox"
- C++ → WASM core (custom renderer, WebGL→WebGPU 2025); Auto Layout is a **custom engine**, not Yoga. The 2020 rewrite added bidirectional container↔child resolution (hug-parent containing fill-child) — the same fixed-point problem flexbox solves.
- Model: `layoutMode NONE|HORIZONTAL|VERTICAL|GRID`, per-axis FIXED/AUTO sizing, HUG/FILL/FIXED sugar, `layoutGrow` (effectively binary), wrap (horizontal only), **negative itemSpacing** (overlap), `strokesIncludedInLayout`, `itemReverseZIndex`, min/max. Absent: margins, percentages, flex-basis, fractional grow, space-around/evenly.
- Absolute children inside auto layout use Figma's **legacy pin/center/scale constraints**, not CSS insets.
- **Figma Grid (Config 2025, beta)** is CSS-Grid-inspired, not CSS Grid: no user-facing fr/%/named areas/subgrid; its "Auto" track emits as `minmax(0,1fr)` ≠ CSS `auto`.
- **2025 flexbox-convergence migration**: single-child SPACE_BETWEEN now start-aligned, auto gap clamps at 0, strokes→border/outline semantics, border-box fills — old and new behavior coexist **until January 2027**. Any Figma translator must handle both.
- Dev Mode CSS is a computed-style snapshot (fixed px, no tokens); non-auto-layout content falls back to absolute.

### Penpot — CSS flex/grid *is* the model (hand-written engine, twice)
- Flex (v1.17, 2023) and Grid (v2.0, 2024) with real CSS semantics: reverse directions, wrap, negative gaps, space-around/evenly, **per-item margins**, named grid areas, spans, `%/fr/auto/px` tracks. Not implemented: `minmax()`, `repeat()`, subgrid, baseline, `order`.
- Engine is hand-written Clojure/ClojureScript (`common/geom/shapes/flex_layout/`), **now being ported to Rust/WASM** (`render-wasm/src/shapes/modifiers/flex_layout.rs` ~800 lines, `grid_layout.rs` ~940) alongside the Skia-based renderer — two parallel engines that must agree during migration.
- What CSS fidelity buys: Inspect emits real `display:flex/grid` with zero translation. What it costs: years of performance complaints on layout-heavy files, and no conformance/deviation document (the subset boundary is only discoverable from source). Their in-repo dev notes (`layout-grid-subtleties.md`) catalog the *editor-layer* pain: cell assignment under drag, hidden children freeing cells, reorder vs component-copy integrity.

### Rive — forked Yoga, extended with grid tracks, shipped in WASM
- Layouts (Oct 2024) are **Yoga, forked** (`rive-app/yoga`, branch `rive_changes_v2_0_1_2_grid`, adds `YGGridTrackList`), symbol-renamed, compiled into every runtime including WASM. The "Rive uses Taffy" rumor is **false** (build-file evidence; Taffy appears only as a transitive Bevy dep).
- Layout properties are **animatable and state-machine-drivable**; layout participation is **opt-in per node** ("Layouts only affect other Layouts") so shapes/text stay freely animatable. Recompute via `ComponentDirt` dirty flags over a topologically sorted dependency list.
- **Closest architectural precedent to crafty**: vendored a battle-tested engine, extended it, wired it into a custom dirty/update loop, shipped in WASM.

### Framer / Webflow / Paper / Play — eliminate translation entirely
- Framer's canvas is real DOM/React: Stacks *are* flexbox (Fit→`min-content`, Fill→`flex:1 0 0px`), pins are literal `position:absolute`. Cost: where CSS lacks a primitive (breakpoint-conditional *structure*) Framer duplicates DOM subtrees per breakpoint.
- Webflow is a GUI over a real stylesheet — zero loss, one-way export, CEO-admitted steeper learning curve ("users need to think somewhat like a developer").
- Play's canvas was the actual SwiftUI/UIKit runtime (1:1 SwiftUI export); Apple acquired it (2026).
- Lesson: representation collapse is the zero-loss strategy, but you inherit that model's limits and platform.

### Sketch / Adobe XD — the failure of inferred intent
- Sketch Smart Layout persisted only `axis + anchor + min/max` and *inferred* spacing from geometry; in May 2025 Sketch shipped flexbox-style **Stacks** and relabeled Smart Layout "Legacy."
- XD's Responsive Resize inferred constraints at resize time from undocumented heuristics; dominant complaint was silent wrong guesses; product dead.
- **Inferred intent fails silently; declared intent fails loudly. Declared won everywhere.**

### Subform — dead product, best non-CSS model
- Uniform per-axis `space-before / size / space-after` triple; three units (px, %, **stretch** with built-in min/max) legal in any slot — justify/align/margin:auto all fall out as stretch-spacing. Two positioning modes only (self-directed / parent-directed). Engine was GC-free and compiled to WASM in 2018; open-sourced (`lynaghk/subform-layout`).
- Structurally closer to SwiftUI's Spacer idiom than CSS is — the published bridge model between the two worlds.

## 3. Embeddable engines

| Engine | Models | Lang/WASM | API | Serialization/CSS-in | Adoption | License |
|---|---|---|---|---|---|---|
| **Taffy 0.13** | Flex, Grid, Block, float, calc() | Rust; WASM-clean (`no_std`); JS bindings WIP | Retained `TaffyTree` **+ trait-based algorithms over your own tree** (`LayoutPartialTree`); measure closures | **serde feature + CSS `parse` feature** | Servo (grid is browser-grade), Bevy, Zed/GPUI (pins upstream 0.12.2), Blitz, Slint, Lapce | MIT |
| **Yoga 3.2** | Flexbox only | C++20, C ABI; official npm WASM ESM since 3.0 | Retained YGNode, imperative setters, dirty-marking, measure fns | None first-party | React Native, Litho, Satori, **Rive (forked)** | MIT |
| **Clay** | Flexbox-inspired custom | C99 single header; **15 kB wasm**, arena-allocated | Immediate mode → render-command list | None | Indie/game UIs | Zlib |
| **Morphorm** | Subform-style (Pixels/%/Stretch/Auto) | Rust | Trait-based over user storage, single pass | None | Vizia | MIT |
| **Cassowary (kiwi / kasuari)** | Linear constraints w/ priorities (Auto Layout) | C++/Rust, WASM-clean | Incremental solver | Constraints are data | Apple Auto Layout, Matplotlib, Ratatui | BSD/MIT |

Key facts:
- **Yoga's documented CSS deviations** (dialect flags for any IR): defaults `flex-direction: column`, `align-content: flex-start`, `flex-shrink: 0`, `position: relative`, always border-box; no `order`/`z-index`/grid; `UseWebDefaults` + per-subtree **Errata API** (`YGErrataNone/Classic/All`) manage a decade of compat-preserved bugs.
- **Both leaders validate the same way**: generate expected layouts by rendering HTML fixtures in real Chrome (Yoga pioneered; Taffy's gentest). Adopt this — it gives round-trip validation nearly free.
- Performance is a wash at document scale (~10k nodes ≈ 4 ms full relayout for both; Taffy faster deep, Yoga faster wide). **Incrementality matters more than throughput**: Yoga dirty-marking + measure cache; Taffy per-node `Cache` keyed by `LayoutInput` (min-content/max-content/final passes each get slots).
- The stretch → stretch2 → Taffy lineage: the Rust ecosystem already consolidated once. Don't build on the graveyard; watch the **Blitz stack** (Stylo + Taffy + Parley = "browser layout à la carte").
- **Two paradigms**: style-driven property bags (CSS/Yoga/Taffy/Figma) vs constraints-down/sizes-up negotiation (Flutter/SwiftUI/Compose/Masonry's new BiAxial protocol, xilem PR #701). A constraints-down substrate can *host* flex/grid containers as nodes; a flex-shaped core can't cleanly host negotiation children.

## 4. Translation and round-tripping — prior art

### 4.1 The two semantic families
- **Family A — style-driven box-flow** (CSS, Yoga, Taffy, Figma, Penpot): layout semantics are already data → near-lossless to an IR.
- **Family B — negotiation protocols** (SwiftUI's propose/choose, Compose's measure-once constraints, Flutter's BoxConstraints, UIKit Cassowary): translatable only for built-in containers (HStack/Row/Column ↔ flex row/column, Spacer ↔ grow/auto-margin, weight ↔ grow). Custom `Layout`/`MeasurePolicy`/`RenderBox` bodies are Turing-complete and **fundamentally untranslatable** except by behavioral sampling.

### 4.2 The safe IR kernel (everything surveyed can express or host this)
Box tree with: direction + wrap; main/cross alignment; gap; padding/border/margin; per-child grow/shrink/basis (or weight); min/max clamps; absolute escape hatch with insets; aspect ratio; intrinsic leaf sizing via measure callbacks.

**Dialect-divergent (needs errata-style flags):** defaults (Yoga column vs web row), box-sizing, `position:static` availability, percent resolution, `flex`-shorthand basis, baseline rules.

**Untranslatable (opaque nodes + sampled behavior):** custom measure/place code; SwiftUI ideal-size / `layoutPriority` / alignment guides; cross-hierarchy Cassowary constraints; full CSS Grid power (only CSS/Taffy/Penpot speak it — plan a documented grid→nested-flex lowering with a "was-lowered-from-grid" annotation); exact web multi-pass intrinsics under single-pass hosts.

**Figma-specific hazards:** negative gap + `itemReverseZIndex` (no CSS equivalent), constraint-based abspos (not insets), binary `layoutGrow`, Grid "Auto" = `minmax(0,1fr)`, stroke/border-box toggles, dual legacy/new semantics until Jan 2027.

### 4.3 Four proven bidirectionality strategies (decreasing fidelity, increasing generality)
1. **Representation collapse** (Paper, Penpot, Utopia, Onlook): one representation is truth. Utopia = code-as-truth + canvas gestures as AST transformations gated on *recognized* patterns; zero-loss where it applies, gesture set shrinks to what's recognizable.
2. **Ownership partitioning** (Plasmic, Figma Code Connect): draw a boundary, regenerate only one side; no merge.
3. **IR + per-target serializers** (Mitosis, TeleportHQ UIDL, DivKit, Airbnb Lona): proven design→code at scale; **nobody has demonstrated the reverse parser at layout-semantic depth** — code→IR exists only for constrained subsets.
4. **Inference for unstructured residue**: absolute → flex is shippable but heuristic (Figma "Suggest auto layout," Motiff, Locofy ML). The principled framing is **InferUI** (OOPSLA 2018): synthesis from rendered examples + idiom priors, disambiguated by **multiple viewport samples** (92% cross-device generalization). LLM benchmark (Figma2Code, 2026) confirms frontier models copy absolute values instead of inferring intent — a dedicated hierarchy-inference model in front of a deterministic compiler (Builder.io Visual Copilot) is the only production-validated recipe.

### 4.4 Interchange formats
No neutral layout interchange standard exists. Closest: Figma's REST node schema (de facto, proprietary), the open `.penpot` JSON-in-ZIP (best open CSS-semantics schema), TeleportHQ UIDL (published JSON-schema UI IR, layout = CSS-in-JSON), Taffy's serde'd `Style` struct (best "flex-tree as plain data"). SDUI meta-finding: schema-first JSON contracts evolve far more additively (71%) than code-defined ones — design the IR schema-first, evolve additively.

## 5. Architecture precedents (WASM, text, incrementality)

- **Figma pattern**: scene graph + layout + text + render all inside one WASM module; React chrome reads derived state; property-level binary deltas (kiwi format) cross the boundary and serve multiplayer/undo/plugins alike. Layout results never round-trip to JS per node.
- **Per-node JS↔WASM chatter is the one architecture that reliably loses** (yoga-layout npm's per-node wrappers + manual `free()`; pure-TS "flexily" beats WASM Yoga 1.7–5.5× on tiny hot trees purely on boundary overhead). Batch flat typed-array/arena-ID updates are the fast path. For crafty this frames the decision: either layout lives in the Rust renderer module beside the scene, or it lives in the TS kernel with the whole tree local — the losing option is TS-driven per-node calls into WASM.
- **Text is the hard part and the bigger decision.** Neither Yoga nor Taffy does text; both delegate via measure callbacks (min-content / max-content / final-width probes — why per-node caches exist). Stacks: HarfBuzz (C++, what Figma-class and Rive use), Parley (Linebender; HarfRust shaping, inline boxes; what Blitz uses), cosmic-text (HarfRust + swash). Wire measure callbacks from day one; cache shaping keyed by (content, style, width-bucket) — that cache dominates relayout cost.
- **Layout cost lands in interaction latency, not rendering** (Figma's 2020 rewrite, Penpot's freezes and Rust port, Rive's opt-in-per-node all exist because layout recomputes per drag frame). Design incremental/dirty-subtree relayout from the start; relayout boundaries (Flutter) confine propagation.

## 6. Strategic implications for crafty

1. **The bidirectional goal is differentiating and real** — no incumbent does it. The viable shape is not a lossless universal converter but: common-kernel IR + dialect flags + opaque foreign nodes + inference for unstructured input + **behavioral round-trip tests** (assert equivalence at N viewport sizes, not property equality — the InferUI criterion, and the only fidelity definition that survives dialect differences).
2. **Engine: embed/crib Taffy first, custom only if design semantics force it.** It's MIT Rust matching our WASM renderer, flex+grid+block, browser-grade (Servo), trait-level API that runs over *our* document tree without an owned tree, and first-party serde + CSS parsing — the "in/out" halves of the translation requirement. Rive's Yoga-fork proves vendoring+extending beats bespoke; Penpot's two-engines-that-must-agree is the cautionary tale. Figma went custom for designer-facing tri-state semantics — but those (Fixed/Hug/Fill per ADR-0005) map onto flex via a thin adapter (`flex-grow`/`stretch`/fixed); budget a divergence list and treat custom as the fallback if it outgrows adapter shims.
3. **Version semantics from day one** — per-subtree errata/behavior flags in the document format (Yoga Errata, Figma's 2025–2027 dual-behavior migration are the same lesson). Files must keep rendering as authored.
4. **Ship a closed, honest subset** (Penpot's enumerable property set round-trips exactly; Figma Grid draws criticism precisely where "Auto" silently diverges from CSS). An enumerable property set is what makes translation tractable.
5. **Layout is a resolve stage, never a bounds writer** — matches ADR-0005 and the industry pattern: authored intent fields on `DocumentNode`, resolved frames as derived output, measured frames recorded alongside declared style (the lossless fallback *and* the inference input).
6. **Conformance harness immediately**: CSS fixtures rendered in Chrome → expected frames → assert our engine and every translation direction reproduce them. Both Yoga and Taffy generate their test suites this way; Penpot's lack of one is why its deviations are unknowable.
7. **The editor-layer semantics are the actual cost center** (Penpot's grid-subtleties notes): drag-into-layout cell assignment, hidden/absolute children, reorder vs component-copy integrity, temporary inferred structure during gestures (Motiff's "infer for this gesture only" pattern). Budget more for interaction design than for the flexbox algorithm.

## Sources

Primary URLs are inline throughout the per-track reports; headline sources: github.com/DioxusLabs/taffy · yogalayout.dev (2.0/3.0 announcements, incremental-layout, external-layout docs) · figma.com/blog (auto layout, WASM, WebGPU, multiplayer, incremental frame loading) · developers.figma.com FrameNode/layoutPositioning · penpot.app/blog + penpot repo (`shape/layout.cljc`, `render-wasm/.../flex_layout.rs`, `layout-grid-subtleties.md`) · rive.app/blog (layouts, n-slicing) + rive-app/yoga fork · github.com/lynaghk/subform-layout + "Why not flexbox?" · developer.apple.com/documentation/swiftui/layout · sri.inf.ethz.ch/publications/bielik2018inferui · mitosis.builder.io · docs.teleporthq.io/uidl · github.com/concrete-utopia/utopia · linebender.org (Parley, xilem PR #701) · nicbarker/clay · ratatui/kasuari · servo.org blog.
