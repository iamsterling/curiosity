# ADR 0012: Glass fills — backdrop sampling with a module-owned blur pyramid

Status: Accepted — implemented (headless)
Date: 2026-08-08
Implementation status: The authored fill model (kernel), the projection, the
protocol v4 surfaces, the module's blur pyramid + composite passes and the
host budget are implemented and verified headless (kernel, protocol, bridge
and cargo tests). On-screen pixels — the composite's appearance on hardware —
are pending the real-browser spike (the renderer's standing gap 8); nothing
in this record claims otherwise.

## Context

The authored paint vocabulary was a single hex `fill` string
(`document.ts:84`) and the renderer's packet carried flat `[r,g,b,a]`
(draw-protocol.ts). Renderer gap 1: "no gradients, shadows, blur, masks or
blend modes". No node could sample what was drawn behind it, so customers
could not author glass UIs — the dominant current surface language of
interface design. The product also wanted the frosted look on its own chrome.

The technique was researched from `jeantimex/glass-effect-webgpu` (MIT,
README-stated; no LICENSE file in-tree — recorded in the research ledger):
render the scene to an offscreen texture, pre-blur it into a fixed pyramid
(0/8/16/32/64 device px, two-pass separable 25-tap Gaussian), and let each
glass surface sample the pyramid **progressively** (radius mapped to an
adjacent level pair, interpolated), so per-surface cost is independent of
radius. The demo's springs, displacement maps and HTML-in-Canvas capture were
rejected: interaction is kernel-side and scenes are not DOM. **No source was
ported** — the pyramid and Gaussian are textbook post-processing rebuilt in
the module's own pipeline with Crafty's failure, budget and keying discipline.

## Decision

1. **`fill` becomes `string | GlassFill`** — an additive authored union, no
   schema bump, no migration. A glass fill is reference plus intent: the
   resolved backdrop is renderer state, never written into the document.
   Fields: `blurRadius` (world units — zoom is applied at render, never baked),
   `tint`/`tintOpacity`, `saturation`, optional `refraction`. Validation is
   per-field with stable codes (`FILL_GLASS_INVALID:<field>`); glass is
   restricted to rect-geometry nodes (rectangle and frame; path/text/group →
   `FILL_GLASS_GEOMETRY_UNSUPPORTED`) because the composite draws rect quads.
2. **The composite lives in the module** (ADR 0010's GPU clause): the frame's
   glass surfaces are drawn by a module-owned pass sampling the pyramid,
   between the scene render and the overlay render — overlays always composite
   above glass and are never blurred by it. Glass frames split the single
   encoding into scene + overlay halves (two Vello renders, pyramid + composite
   between); non-glass frames keep the single-encoding path unchanged.
3. **The protocol carries glass without product semantics**: `RenderFrame`
   gains `glassSurfaces` (structural, kernel-neutral — the overlay precedent);
   `DRAW_PROTOCOL_VERSION` → 4 with v3 still accepted. Surfaces are validated
   at the boundary (`RENDER_PACKET_INVALID:glassSurfaces.<field>`), sorted by
   `(zIndex, order)` — array order is never trusted.
4. **The projection is kernel-side**: `projectGlassRecords` walks the document
   with the encoder's order rule (one slot per visible node, DFS pre-order)
   and composes world transforms. The legacy `Scene` is **not extended**
   (prohibited pattern); glass nodes project into the Scene with opacity 0 and
   the tint hex — the Scene cannot express "draw nothing", and `visible:
   false` would hide a glass frame's children. `GLASS_SURFACES_CAPPED` /
   `GLASS_PYRAMID_FAILED` / `GLASS_COMPOSITE_FAILED` join the vocabulary.
5. **The budget degrades, it never hides**: surfaces past the cap stay in the
   packet as `flat` (plain tint, visible and ordered) and the render result
   reports the count — the overlay budget precedent (host policy, Rust
   defensive mirror).
6. **Chrome glass is CSS, not GPU**: the chrome is React DOM composited by the
   browser over the WebGPU canvas, so `backdrop-filter` (blur/saturate/
   brightness + tint + inset highlight) is the same frosted look at zero
   renderer cost, SSR-safe. The demo's machinery applies to *rendered
   content* — the authored document — never to DOM chrome.

## Consequences

- Customers author glass panels/cards as a fill; the renderer samples the
  scene behind them. Radius stays authored in world units; zooming changes the
  effective blur without touching the document.
- Glass-over-glass is **merged** composition in v1 (a shared backdrop): a
  later surface blurs the earlier surface's flat tint, not its blurred
  result. Stacked re-blur (per-surface pyramid rebuild, cost ×N) is deferred
  behind a real customer need and a measurement.
- The composite is a new GPU code path that is **unproven on hardware** until
  the real-browser spike: pyramid build cost scales with canvas size × DPR (5
  textures), and glass frames render twice. Both are measured in the spike;
  the non-glass path is byte-identical to before.
- Path glass, glass strokes, bezel/specular edge highlight, gradients, masks
  and blend modes remain deferred (renderer gap 1, partially resolved for
  rects only).

## Alternatives considered

- **CSS-only for authored glass** — rejected: authored documents render on the
  WebGPU canvas with no DOM; customer output is exported, and the renderer is
  the product's surface.
- **Vello-native blur** — rejected: Vello has no backdrop-blur primitive;
  forking it for one fill is out of proportion.
- **Host-side (TypeGPU) composite** — rejected: reversing ADR 0010's GPU
  clause for one effect is worse than the effect.
- **Mask-texture composite** — rejected: the composite draws from packet
  geometry directly; no extra target or pass.
- **Stacked per-surface re-blur** (the demo's "stack" strategy) — deferred:
  cost ×N; merged composition covers the trend's use cases for v1.
- **Chrome glass in the GPU** — rejected: chrome is React DOM by design;
  `backdrop-filter` is the same look at zero cost.
- **Per-field strictness for existing hex fills** — rejected: existing fills
  were never validated; glass adds strict validation only for its own fields.

## Prior art

`jeantimex/glass-effect-webgpu` (MIT, README-stated): the progressive blur
pyramid and backdrop sampling are **adopted as concepts, implemented
independently**; the demo's scaffolding is **rejected**. Research ledger row
added 2026-08-08. No external code is vendored; no license beyond the README
claim is assumed.
