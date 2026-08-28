# Glass fills — design

## The technique (prior art)

Studied: `jeantimex/glass-effect-webgpu` (MIT, stated in its README; no LICENSE
file is present in the repository — recorded in the research ledger).
Lesson extracted: **backdrop sampling with a progressive blur pyramid**. The
demo renders its scene to an offscreen texture, pre-blurs it into a pyramid of
levels (0/8/16/32/64 device px) with a two-pass separable 25-tap Gaussian, and
its glass surface shader samples the sharp backdrop for refraction and the
pyramid for blur — interpolating between adjacent levels — so a surface's cost
is constant regardless of its blur radius. Blur radii are multiplied by DPR at
build time (the demo's `BlurPyramid.generate(source, dpr)`).

**Adopted:** the pyramid shape, the separable Gaussian, progressive
level-sampling, radius × DPR, the stacked-over-backdrop composition model.
**Rejected:** springs/liquid deformation (interaction is kernel-side; not
paint), displacement maps, HTML-in-Canvas DOM capture (scenes are authored
documents, not DOM), per-element re-blur "stack" strategy (cost ×N; see
Deferred), the demo's instance-manager/control-panel scaffolding.

**Implementation is independent** — no WGSL or TS is ported; the concept is
rebuilt in the module's own wgpu/TypeGPU style with Crafty's failure, budget
and keying discipline. The demo's `glass.wgsl` (≈50 KB) is a demo shader with
unbounded features; Crafty's composite is a small pipeline with six uniform
fields.

**Implementation note (sections 1–2 landed):** `projectGlassRecords` walks the
document tree with the encoder's order rule (one slot per visible node,
depth-first pre-order) so record `order` values are the slots the glass
layers would occupy in the scene — sorting by `(zIndex, order)` reproduces
the scene's relative draw sequence. The projection also adds authored
`opacity` to the record (the design's record shape did not list it): the
composite must honour node opacity exactly like solid fills do, and the scene
projection of glass nodes cannot carry it (they project at opacity 0).

## The authored model

`fill: string | GlassFill` (additive union — source-compatible widening; every
existing fixture and document stays valid; no `schemaVersion` bump, no
migration, matching the `.ui` discipline of additive node fields).

```ts
type GlassFill = {
  kind: "glass";
  blurRadius: number;   // world units, ≥ 0, finite — never zoom-baked
  tint: string;         // hex color
  tintOpacity: number;  // 0..1
  saturation: number;   // ≥ 0, 1 = neutral
  refraction?: number;  // 0..1 displacement, default 0
};
```

Validation: `FILL_GLASS_INVALID:<field>` per field, `FILL_GLASS_GEOMETRY_UNSUPPORTED`
for path/text/group. Geometry: rectangles and frames (both encode rect
geometry). Path glass is deferred — the composite draws rect quads; path
regions would need coverage rendering in the composite pass.

## The projection

The kernel's renderer projection today is one lossy output
(`editorDocumentToScene`, `scene-adapter.ts:69`); the architecture's Target is
a real resolved packet (`scene-resolution.md`), and extending the legacy
`Scene` to carry glass is a **prohibited pattern**. So glass rides the
projection's second output: the adapter returns `{ scene, glassRecords }` where
each record is `{ nodeId, bounds, transform, blurRadius, tint, tintOpacity,
saturation, refraction, zIndex, order }` — plain values, disposable, no Scene
change. This is a deliberate small step toward the resolution target, not a
rework of it: `declarative-scene-api` is a separate change (an ergonomic
projection for app/agent visuals) and is unaffected.

## The packet

`RenderFrame.glassSurfaces: GlassSurface[]`, structural types in
`draw-protocol.ts` (the overlay precedent — the host composes the overlay
packet from kernel records without importing the kernel; glass mirrors that
shape). Each surface carries explicit `(zIndex, order)`; the encoder merges
surfaces and scene commands into one sorted sequence for the composite.
`DRAW_PROTOCOL_VERSION` → 4; v3 stays accepted (`isSupportedDrawProtocolVersion`).
Malformed descriptor → `RENDER_PACKET_INVALID`, nothing presented (I29).

## The module passes

Module-owned GPU (ADR 0010 — the host must not grow a GPU clause for one
effect; reversing that boundary would be worse than the effect):

```
non-glass frames (unchanged):  Vello(1 encoding: authored + preview + overlays) → present
glass frames:
  pass 1  Vello(scene encoding: authored minus glass + preview) → offscreen
  pass 2  pyramid: offscreen → 5 levels (0/8/16/32/64 dev px, separable 25-tap)
  pass 3  composite: per glass surface, textured quad sampling the pyramid
          (progressive: radius → level pair, lerped; refraction offsets the
          sample by a bounded amount) with per-surface uniforms
          (bounds/transform, tint, tintOpacity, saturation, radius, refraction)
          drawn in (zIndex, order) — merged, never array order
  pass 4  Vello(overlay encoding: selection + grid/guides) → offscreen
  present (unchanged)
```

- The overlay split is required: overlays must composite **above** glass (spec:
  overlays are never blurred by glass). Non-glass frames keep today's
  single-encoding path — no regression, and the split's cost is measured in
  the real-browser spike, not guessed.
- The pyramid targets are recreated only when the device size changes
  (configure is a GPU sync point — the existing offscreen/surface discipline).
- Progressive radius mapping: device radius = `blurRadius × zoom × DPR`
  clamped to `[0, maxLevel]`; level pair by radius, linear interpolation
  between the adjacent blurred samples. Radius 0 = sharp backdrop + tint.
- Pass failure → `VELLO_RENDER_FAILED`-style module strings, mapped in
  `failure-policy.ts` to `GLASS_PYRAMID_FAILED` / `GLASS_COMPOSITE_FAILED` with
  the same `preservation: "authored-state-and-last-valid-packet"` guarantee:
  nothing presented, last valid frame stays.

## Budget

Structural cap on glass surfaces per frame (mirrors `MAX_GRID_OVERLAY_LINES`).
Degradation is explicit, not silent truncation: surfaces beyond the cap draw as
**flat tint** (tint at tintOpacity) in the composite, and the frame reports
`GLASS_SURFACES_CAPPED:<n>`. Flat-tint degradation keeps the surface visible,
ordered and styled — a glass card that lost its blur is still a legible card.
The cap's value is a structural constant; real budgets (pyramid build cost,
composite cost, per-surface cost) are measured in the real-browser spike with
fixtures and distributions — nothing is invented here.

## Chrome

Pure CSS utilities in the app stylesheet (a `glass` surface token family):
`backdrop-filter: blur() saturate() brightness()`, translucent background
tint, 1px inset highlight, hairline border. Applied to the sidebar panel
surfaces, the canvas strip and the inspector header in the server layout —
SSR-safe by construction (no effects, no JS). `backdrop-filter` unsupported →
the tint and border alone (spec: graceful degradation). Panels currently sit
beside the canvas, so the frost reads against the page background; floating
glass panels over the canvas is a layout change the CSS already supports —
recorded, not built here.

## Alternatives considered

1. **CSS-only for authored glass** — rejected: authored documents render on
   the WebGPU canvas with no DOM; customer output is exported/embedded, and
   the renderer is the product's surface. CSS is the chrome mechanism, never
   the authored one.
2. **Vello-native blur** — rejected: Vello has no backdrop-blur primitive, and
   forking Vello for one fill is out of proportion.
3. **Host-side (TypeGPU) composite** — rejected: ADR 0010 moved the GPU clause
   to the module; resurrecting a host GPU path for one effect reverses the
   boundary.
4. **Mask-texture composite** (glass regions rendered as a mask, composite
   reads it) — rejected: the composite draws from the packet geometry
   directly; no extra target or pass.
5. **Per-surface stacked re-blur** (the demo's "stack" strategy: each surface
   samples the previous composite result) — deferred: rebuilds a pyramid per
   surface, cost ×N, and v1's merged composition covers the trend's use cases
   (panels, cards, overlays). Trigger to un-defer: a real customer need for
   glass-over-glass depth, measured before building.
6. **Chrome glass in the GPU** — rejected: chrome is React DOM by design
   (react-boundary.md); `backdrop-filter` is the same look at zero cost.

## Deferred, with triggers

- Path glass, glass strokes, bezel/specular edge highlight — the composite's
  rect-quad shape bounds all three. Trigger: visual polish pass / a customer
  surface that needs them; the pipeline shape (per-surface uniforms in one
  pass) extends to both without rework.
- Gradients, masks, blend modes — the rest of renderer gap 1, separate
  changes.

## Tests

- **Kernel** (no DOM): per-field validation codes; geometry gate; command
  round-trip and inverse; clipboard mint/apply with a glass fill; canonical
  byte determinism.
- **Protocol** (scene-renderer vitest): v4 gate + v3 accepted; malformed
  descriptor → `RENDER_PACKET_INVALID`; `(zIndex, order)` preservation.
- **Module** (cargo + vitest parity harness): decode → descriptor structs;
  pass-order witnesses; budget degradation with the `GLASS_SURFACES_CAPPED`
  report. On-screen pixels: recorded in `pixel-parity-recording.md` as pending
  the real-browser spike — nothing fabricated.
- **Round-trip**: the `.ui` loss-list fixture gains a glass fill
  (crafty-ui-format task 6.1 ties in).
- **Chrome**: the style is declarative CSS; the spec's no-JS scenario is
  checked in the served HTML, verified visually.
