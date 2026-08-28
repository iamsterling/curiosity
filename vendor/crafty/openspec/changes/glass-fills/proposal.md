# Glass fills: backdrop-sampled surfaces for the document and the chrome

Status: **Proposed**

## The Problem

The authored paint vocabulary is a single hex string — `fill: string`
(`packages/editor-kernel/src/document.ts:84`) — and the renderer's packet
carries it as a flat `fill: [r,g,b,a]` (`packages/scene-renderer/src/draw-protocol.ts:14`).
Renderer gap 1 states it plainly: "Paint vocabulary is flat colour. Paths and
rects render filled and stroked; there are no gradients, shadows, blur, masks
or blend modes." No node can sample what was drawn behind it. Customers cannot
author glass UIs — the dominant current surface language of interface design
(frosted panels, backdrop blur, the "liquid glass" trend). Crafty's own chrome
(sidebar, canvas strip, inspector) is flat opaque surface, next to but not
under any visual layering.

The surface language is a product decision, not a toolbar feature: when glass
ships it must be a first-class authored fill — reference plus intent — rendered
by the shared renderer, not a CSS-only crutch that works in no exported product.

## The Decision

Two surfaces, one visual language, two honest mechanisms.

**Chrome: CSS backdrop-filter, no renderer involvement.** The editor chrome is
React DOM composited by the browser over the WebGPU canvas; `backdrop-filter`
(blur/saturate/brightness) plus translucent tint and an inset highlight is the
same frosted look the demo gets from the GPU, at zero renderer cost, and it
keeps the React-chrome boundary intact. WebGPU chrome would mean rendering the
toolbar inside the frame — an architectural reversal of the chrome boundary,
rejected.

**Authored: a `glass` fill kind, rendered by a module-owned composite pass.**
The document's `fill` becomes `string | GlassFill` (additive — no migration,
existing documents untouched). A glass node renders **the scene content drawn
before it** — everything with lower `(zIndex, order)` plus ancestor content —
blurred to an authored `blurRadius` (world units; device radius = world × zoom
× DPR, never baked into the document), tinted, saturation-adjusted, with an
optional refraction offset. Technique, studied from
`jeantimex/glass-effect-webgpu` (MIT, README-stated; no LICENSE file in-tree)
and implemented independently: a **blur pyramid** — the offscreen scene texture
pre-blurred into five levels (0/8/16/32/64 device px, separable 25-tap
Gaussian) — sampled **progressively** (radius mapped to a level, lerped
between adjacent levels), so glass cost is constant per surface regardless of
radius. The pyramid is skipped entirely when a frame has no glass. The demo's
springs/liquid deformation, displacement maps and HTML-in-Canvas capture are
rejected: interaction is kernel-side and scenes are not DOM.

Glass surfaces draw in a dedicated composite pass **between** the scene render
and the overlay render, so selection, grid and guides always composite above
glass. Overlapping glass uses a single shared backdrop ("merged"
composition); per-surface stacked re-blur is deferred (a measured optimisation
with a real trigger). Geometry: rectangles and frames only in v1 — path glass
deferred. Budget: bounded surfaces per frame with explicit degradation —
surfaces beyond the cap draw as flat tint, never vanish silently, and a
diagnostic code reports the cap (the overlay budget precedent).

## What Changes

- **`packages/editor-kernel`** — `fill: string | GlassFill` (kind, blurRadius,
  tint, tintOpacity, saturation, refraction) with per-field validation codes
  (`FILL_GLASS_INVALID:<field>`); glass accepted on rectangle and frame nodes,
  rejected on path/text/group; commands, clipboard and canonical serialization
  carry it (additive union — no `schemaVersion` bump, no migration).
- **`packages/editor-kernel/src/scene-adapter.ts`** — the renderer projection
  gains a second output: kernel-side glass records (node id, world bounds,
  transform, glass params, `(zIndex, order)`). The legacy `Scene` is **not
  extended** (prohibited pattern) — the records ride alongside it.
- **`packages/scene-renderer`** — `RenderFrame.glassSurfaces`: a structural
  list (no kernel import, the overlay precedent), `(zIndex, order)` explicit.
  `DRAW_PROTOCOL_VERSION` → 4, version 3 still accepted. Malformed glass
  descriptors → `RENDER_PACKET_INVALID`.
- **`packages/scene-renderer-wasm`** — module-owned GPU (ADR 0010): blur
  pyramid (separable Gaussian, five levels, textures recreated only on device
  size change) + glass composite pass (textured quads, per-surface uniforms,
  drawn in `(zIndex, order)`). Frame order when glass exists: scene render →
  pyramid → composite → overlay render → present; non-glass frames keep the
  single-render path unchanged. New failure-policy stages/codes for the
  pyramid and composite, same preservation guarantee (nothing presented, last
  valid frame stays).
- **`apps/crafty-web`** — chrome glass: CSS utilities (backdrop blur/saturate/
  brightness + tint + inset highlight) applied to the shell surfaces; SSR-safe
  (pure CSS, no client effects, no JS path).
- **Docs** — ADR 0012 (the glass fill decision: backdrop sampling, module
  composite, v4 protocol, additive schema, rejected alternatives, MIT prior
  art), `renderer.md` and `current-state.md` reality updates, a
  `research-ledger.md` row for the demo repository.
- **Tests** — kernel: validation codes, geometry restriction, round-trip,
  clipboard, canonical byte determinism; protocol: v4/v3 gate, malformed
  rejection, `(zIndex, order)` preservation; module: decode → descriptor
  structs, pass-order witnesses, budget degradation; the `.ui` round-trip
  fixture gains a glass fill. On-screen pixel proof is recorded as pending the
  real-browser spike (the existing honest caveat, gap 8) — nothing fabricated.

## Files

- `packages/editor-kernel/src/document.ts` — the fill union + `GlassFill`.
- `packages/editor-kernel/src/validate.ts` (or the existing validation home) —
  per-field bounds and geometry-kind gates with codes.
- `packages/editor-kernel/src/scene-adapter.ts` — glass records projection.
- `packages/scene-renderer/src/draw-protocol.ts` — v4 `glassSurfaces` + gate.
- `packages/scene-renderer-wasm/src/lib.rs` — Gaussian blur, pyramid, composite
  pass, pass order, budget degradation, failure codes.
- `packages/scene-renderer-wasm/src/index.ts` — host relay additions.
- `apps/crafty-web/src/app/globals.css` + shell layout — chrome glass utilities
  and application.
- `docs/architecture/adrs/0012-glass-fills.md`, `renderer.md`,
  `current-state.md`, `research-ledger.md` — decision record and reality
  updates.

## Risks

- **GPU work unproven on hardware.** Pyramid + composite are headless-tested
  (decode, pass order, budgets); real pixels wait for the real-browser spike —
  the same honest caveat as renderer gap 8. No numbers are invented.
- **Per-frame pyramid cost scales with canvas size × DPR** (five textures of
  scene size). Mitigation: pyramid and composite are skipped when the frame has
  no glass; textures are recreated only on size change. Budgets are measured in
  the spike, not invented here.
- **Glass frames render twice** (scene pass + overlay pass split around the
  composite). Measured in the spike; the non-glass path is unchanged.
- **Fill union churn** — every node fixture and test that constructs `fill`
  compiles unchanged (union widening is source-compatible), but validation
  must stay exhaustive.
- **Chrome panels sit beside the canvas**, so the frosted chrome reads against
  the page background today. Floating glass panels over the canvas is a layout
  decision the CSS supports without renderer work — recorded, not built here.
- **Glass-over-glass is approximate in v1** (shared backdrop, "merged"
  composition). Documented in the design with the trigger that un-defers
  stacked composition.

## Deliberately Out of Scope

Liquid/spring deformation and displacement maps; HTML-in-Canvas; path glass;
strokes on glass surfaces; bezel/specular edge highlight (deferred, trigger in
design.md); gradients, masks and blend modes (the rest of renderer gap 1);
chrome rendered inside the GPU frame; any change to the declarative-scene-api
packet-production rework (glass rides the existing projection path; the two
are independent).
