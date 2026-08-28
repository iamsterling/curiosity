# ADR 0021: Chrome glass returns — the floating chrome wears the module's glass

Status: Accepted — implemented
Date: 2026-08-10
Reverses: ADR 0012 decision 6 ("chrome glass is CSS, not GPU") and the
liquid-chrome rejection's verdict ("the interface bans glass effects,
absolutely").

## Context

The floating chrome shell (top bar, tool rail, status strip, floating panels)
sat over the canvas in plain theme styling (`bg-card/95 backdrop-blur-sm`),
per the ADR 0012 decision that chrome glass is CSS. The liquid-chrome
experiment had previously moved chrome glass *geometry* into the frame with
the demo's full liquid look — progressive per-fragment blur, Snell bezel
refraction, directional specular, chromatic aberration and springs — and the
browser verdict was unambiguous: "the editor became incredibly laggy". The
product decision became: **the interface bans glass effects**; authored glass
fills stayed (ADR 0012). The removal preserved the authored-glass
infrastructure that the experiment had fixed: the overlay-blit split (the
black-canvas fix), the composite's 5-arg `textureSampleLevel` calls, the naga
validation test, and the inert `screen`/`radius`/`scale`/`pressed`/`hovered`
fields in the 28-f32 surface record, packed as zeros/ones so the buffer
stride never drifted again.

The product owner has now re-decided: the floating chrome is to wear the
module's glass, the full liquid look. The rejection verdict is deliberately
reversed; the lesson of the experiment — that the cost must be measured in
the browser and recorded, not assumed — is carried forward in this record.

## Decision

1. **The chrome's glass geometry enters the frame through the module's
   composite pass**; content and interaction stay DOM. `RenderFrame` gains an
   additive optional `chromeGlass` (canvas-relative CSS-px bounds, radius,
   host-integrated spring `scaleX`/`scaleY`, `pressed`/`hovered` 0..1,
   host-marked `flat`), no protocol version bump (optional field, per-field
   validation `RENDER_PACKET_INVALID:chromeGlass[<i>].<field>`, module-side
   look constants).
2. **The chrome budget, the overlay precedent**: 16 surfaces, host-capped
   first; past the cap chrome surfaces draw flat tint — visible and ordered,
   never vanishing (`CHROME_GLASS_SURFACES_CAPPED`). The module mirrors the
   cap defensively.
3. **The liquid light model returns** in the module's own pipeline (the
   rejected proposal's design, independently implemented; the demo's WGSL
   was never vendored): edge-progressive blur sampled per-fragment from the
   existing 5-level pyramid, Snell bezel refraction over the squircle-lip
   profile, the directional specular (tapered rim, quarter-circle falloff,
   intensity²), chromatic RGB split at the edges, spring-scaled SDF and a
   soft offset shadow. Look constants are the demo's defaults, module-side.
   The authored-glass path (screen = 0) is untouched.
4. **Springs are host-side TS** (semi-implicit Euler, sub-stepped at 1/120;
   deformationX/Y 300/15, glassBgOpacity 800/50, specularOpacity 420/20) —
   kernel-free, no React on the path. The canvas stage measures
   `[data-chrome-glass]` pills per frame, integrates with rAF dt, and packs
   the result; a quantized change key plus a rest-park (settled springs snap
   to their targets) keeps the draw loop idling at rest.
5. **Pass order**: scene → pyramid → authored composite → overlay render →
   overlay blit → chrome composite → present. Chrome samples the scene-only
   pyramid — grid and selection stay sharp through chrome v1 (the recorded
   fidelity gap, accepted; the second-pyramid fix is the triggered
   follow-up).
6. **Degradation, not fallback**: without WebGPU (SSR, unavailability,
   device loss) the DOM pills keep their plain theme styling — the CSS
   appearance is gated by a `glass-active` class the canvas stage manages,
   added on the first successful frame, dropped on failure.
7. **Measurement is part of the decision.** The headless measurement on this
   change (agent-browser, this host, 1280×577, DPR 1): rest p50 16.7 ms
   (idle — the draw loop early-returns), interaction (pan) p50 16.7 ms,
   p95 16.7 ms, max 16.8 ms with the full liquid fragment active; the
   no-glass A/B baseline measured identically. The rejection verdict
   ("incredibly laggy") is not reproduced in this environment; the user's
   browser remains the visual and performance oracle, and the dial-backs are
   designed in (flat-tint past the budget; springs can be disabled; the
   fragment's progressive sampling can clamp to a fixed level pair).

## Consequences

- The chrome boundary is partially re-decided, as the rejected proposal
  recorded: chrome *geometry* enters the frame, chrome *content* stays DOM.
  The invariants hold: nothing authored in the GPU, chrome is renderer
  state, overlays composite above authored glass, pointer-down never
  mutates.
- Every frame is a glass frame while chrome exists: the split encoding,
  pyramid and composite are the every-frame path — the exact condition that
  exposed the black-canvas bug, which is fixed, tested, and now exercised
  permanently.
- Grid/selection sharpness through chrome is a recorded, accepted fidelity
  gap (scene-only pyramid); the fix (a second pyramid over the composited
  image) is triggered by a visual judgement in the browser and a measurement
  that its cost is acceptable.
- **Discovered and fixed en route**: the overlay `axes` records were decoded
  by the module as `OverlayLine` (which requires `weight`) while the kernel
  emitted them without it — every frame dropped while the grid origin was on
  screen, leaving the canvas black. The wire shape is fixed at its source
  (axes carry `weight: "major"`); the canvas now renders with the grid
  visible and the origin in view. This was a latent pre-existing defect, not
  introduced by this change; it is the same decode-mismatch class the
  record's "never drift apart again" discipline exists for.
- Chrome surfaces carry chrome keys, never document ids. The composite's
  surface record stays 28 f32; the previously inert fields are live for
  chrome and inert for authored surfaces.

## Alternatives considered

- **CSS `backdrop-filter` only** (ADR 0012 #6 as written) — reversed by this
  decision: the user wants the module's glass, and CSS cannot do refraction,
  chromatic split or springs (the liquid-glass-chrome research table).
- **The full liquid look vs the cheap frosted path** — the cheap path (the
  authored cost model) was offered and declined; the user chose the liquid
  look. The measured record above stands against the rejection verdict.
- **Two pyramids (blurred grid through chrome)** — deferred with a trigger;
  the user accepted the sharp-grid gap for this pass.
- **Chrome glass as a second WebGPU device** — rejected (the scene device is
  module-owned; a second device would compete for the same adapter).

## Prior art

`jeantimex/glass-effect-webgpu` (MIT, README-stated): the progressive blur
pyramid, the light model and the spring model are adopted as concepts and
implemented independently in the module's own pipeline — the existing
research-ledger row's discipline, unchanged. No source is vendored.
