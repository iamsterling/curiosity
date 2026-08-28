# Layout systems survey: flexbox, grid, Yoga, SwiftUI, Compose, Flutter, Taffy, and the design-tool consensus

Status: research, 2026-08-08. Primary sources: W3C specs, official vendor
documentation, vendor engineering material, and the reference implementations
cited inline. Nothing from any system is copied into Crafty; this report
extracts the problems, the constraints and the architectural lesson. The
survey brief (per-system facts, algorithms, limitation lists, full URL index)
was compiled 2026-08-08; this report synthesizes it and draws the Crafty
conclusion.

## 1. The families

Every layout system in production today descends from one of four lineages.

**The flexbox family — one-dimensional free-space distribution.** CSS
Flexbox (W3C REC 2018) is the shared ancestor. A container has a main axis
and a cross axis; the layout algorithm resolves flexible lengths in two
passes per line — measure each item's hypothetical main size from
`flex-basis` (content-sized when `auto`), compute free space, then grow or
shrink items proportionally (`flex-shrink` scales by the item's base size),
clamped by per-item min/max. Its descendants are the embeddable engines:
**Yoga** (Meta, MIT, C++ flexbox subset; the React Native engine; measure
callbacks for text; ~45 KB gzipped WASM; v2 reworked W3C-conformance with an
errata API) and **Taffy** (DioxusLabs, MIT, pure Rust; the only embeddable
engine with flexbox *and* grid; Bevy/iced/Dioxus; no_std; WASM as a Rust
target). Every design tool derives from the same model: Figma Auto Layout,
Penpot's flex layout (which implements CSS flexbox and grid in its own
ClojureScript engine, flex modifiers moved to WASM in 2025), Framer stacks
(which compile to real CSS), Sketch stacks.

**The two-dimensional track family — grid.** CSS Grid (REC 2020; Level 2
subgrid shipping since 2023) sizes tracks up front via sizing functions
(`fr`, `minmax`, `auto`, content-based), distributes spanning items'
contributions across spanned tracks, then places items into cells. It is the
only native 2D model; no embeddable engine had grid until Taffy (2022+), and
no mobile framework has a real grid algorithm (SwiftUI's LazyVGrid and
Compose's LazyVerticalGrid are lazy viewport wrappers, not track-sizing
engines). Flexbox and grid are complementary, not overlapping: flexbox
cannot align wrapped lines' columns; grid cannot reflow by content.

**The constraint-pass family — single-pass measure.** Flutter
(RenderObject: constraints down, size up, position down; flex factors with
tight/loose fit; intrinsic dimension queries that trigger speculative
re-layouts) and Jetpack Compose (constraints in, size out, place; children
measured at most once; weighted children split remaining space after
unweighted measurement; intrinsic measurements as a pre-measure step) are
two independent implementations of the same contract. Both are flexbox-
*inspired* in distribution (weight ≈ grow) but lack basis/shrink semantics.

**The proposal family — SwiftUI Layout.** Parent proposes a size, child
responds with its size, parent places. `ProposedViewSize` is optional
(nil = ideal, 0 = minimum, ∞ = as much as possible); `layoutPriority`
apportions space in binary priority order, not proportionally; `Spacer` is
the flex-grow; no weights, no percentages, no gap property, no absolute
positioning primitive.

**The constraint-solver lineage — Cassowary/Auto Layout.** Linear
equalities/inequalities over view attributes solved by a dual-simplex
incremental solver (Badros, Borning, Stuckey, TOCHI 2001; adopted by Apple
for Lion 2011 and iOS 6 2012). Arbitrary relations are expressible — that
was the point — but the solver is comparatively slow, behavior is
non-deterministic from the author's view (conflicts break at runtime, not
authoring time), and Figma's blog documents why design tools abandoned the
constraint UX: "hidden interrelationships between constraints and resizing
created an invisible dependency." Everything new is deterministic
algorithmic layout.

## 2. What each model cannot express

- **Flexbox family**: no 2D (wrapped lines' columns never align, no
  spanning, no tracks, no `fr`); no content↔container negotiation beyond
  measured content sizes. Yoga additionally lacks grid, block and `calc()`.
- **Grid**: no content-driven reflow (auto-placement ≠ flex wrap); no
  free-space distribution between items; coarse ordering.
- **SwiftUI**: no absolute positioning (offset is paint-only), no
  proportional distribution, no percentages, no fit-content primitive.
- **Compose/Flutter**: no grid; no shrink/basis semantics; intrinsics are
  approximations (Compose) or speculative re-layouts O(n²) worst case
  (Flutter, cached); measure-once is a hard rule.
- **Auto Layout**: everything expressible, determinism the author's job.

## 3. The design-tool consensus

All four major design tools converge on the same per-axis sizing vocabulary:
**hug / fill / fixed** (Figma: HUG/FILL/FIXED; Penpot: `auto`/`fill`/`fix`;
Sketch: fit/fixed; Framer: fit-content/fill/fixed) — mapping to CSS as
`fit-content`, stretch, and explicit px. Two lessons from the tool lineage:

- **Figma's engine history** (blog, "the making of the new Auto Layout"):
  child-first layout was guaranteed-valid until stretch/fill created
  container↔component dependency cycles, forcing an iterative multi-pass
  solver that "goes back and forth between container and component." The
  lesson: hug/fill makes layout **bidirectional** — the container's size can
  depend on children *and* children can depend on the container's size —
  which a strict one-pass algorithm cannot express.
- **Figma's 2024–25 alignment rework** moved behavior toward real CSS
  (border-box model, content-area space distribution, `space-between`-like
  auto gap) — the stated motivation being hand-off fidelity: "Auto layout
  was designed to mirror how the web renders layouts, but a few edge cases
  never quite matched CSS."

Penpot proves the whole thing embeddable at design-tool scale: spec-accurate
flexbox and grid implemented from scratch in its own engine, exported as real
CSS.

## 4. The interpretation question

The requirement: one authored layout document, interpreted by web (CSS), iOS
(SwiftUI/Auto Layout) and Android (Compose). The evidence converges on a
single defensible choice: **a flexbox-family model with explicit per-axis
sizing modes (hug/fill/fixed + min/max) and gap/padding/alignment** — the
design-tool consensus model, which is deliberately a restricted,
spec-compatible subset of CSS flexbox.

- **Web**: the model *is* (a subset of) CSS — hug→`fit-content`/
  `flex-basis:auto`, fill→`flex-grow`, fixed→px.
- **Android**: exact via embeddable engines (Yoga/Taffy) — React Native
  already proves the pipeline (authored flexbox → Yoga → native), and
  near-native via Row/Column + weight when native Compose is mandated.
- **iOS**: the weak leg. SwiftUI stacks lack grow/shrink; fill requires
  approximation (`frame(maxWidth:.infinity)`, layoutPriority, or a custom
  flexbox `Layout` — a well-understood ~100-line container, which is exactly
  what the Layout protocol enables). Auto Layout can express hug/fill as
  constraints but wrapping gets painful. In practice iOS teams embed Yoga or
  FlexLayout for true flexbox; design-tool exporters emit CSS, not Swift.

**No other candidate maps cleanly**: grid is native only to web (and Rust);
proposal-based and constraint-pass models are implementation strategies, not
document languages — they express *how to compute*, not *what is authored*.
React Native (flexbox document → Yoga compute → native render) and Framer
(stacks document → real CSS) are the two working proofs of the
"authored model / interpreted targets" pattern.

**Known-failure envelope** of the consensus model: wrap + cross-line
alignment (needs grid), content-dependent cross-axis sizing (needs two-pass
measurement, which SwiftUI/Compose intrinsics only approximate), and
proportional shrink (not native in any mobile stack).

## 5. Crafty conclusion

The authored layout model in the document should be **the flexbox-family
consensus model**: per-axis sizing modes (hug/fill/fixed), direction,
wrap, gap, padding, alignment — a declared subset, exactly as Figma and
Penpot have done. It is:

- natively executable on web (the subset *is* CSS),
- exactly executable on Android and iOS via embeddable engines (Yoga, and
  Taffy if grid joins the model),
- the industry-standard authoring vocabulary across all four design tools
  (designers arrive fluent),
- translatable with documented losses to SwiftUI/Compose when native
  renderers are mandated.

Grid is a **second, additive layout family**, not a replacement: the
flexbox subset cannot express 2D track layout, and grid is the only model
that maps to web natively. Both can be authored against Crafty's own
engine semantics and interpreted per target.

Constraint solving (Cassowary/Auto Layout) is rejected as an authored
model: non-deterministic under conflict, opaque to debug, slow, and
abandoned by the design-tool industry for exactly these reasons.

The layout **engine** question (own implementation vs Yoga via WASM vs
Taffy in Rust) remains open — this report bounds it, it does not decide it.
The decision is an ADR when layout authoring lands, informed by: the
flexbox-subset scope (own implementation of the subset is a bounded,
well-specified project — Penpot did it), the bidirectional hug/fill
dependency (Figma's engine-history lesson: the engine must iterate between
container and child, which Yoga/Taffy's CSS-flexbox single passes handle
the way CSS does — content-sized containers measure children first), and
the existing Rust/WASM module boundary (Taffy in the module is the natural
fit for a grid+flex engine, at the cost of a dependency whose size affects
the core; Yoga via WASM is the battle-tested, ~45 KB option).

The alignment buttons landed in the inspector (2026-08-08) are the first
tangible step of this model: they dispatch the kernel's `align-nodes`
command, and the sizing-mode vocabulary (hug/fill/fixed) is the shape of
the authored layout fields to come.
