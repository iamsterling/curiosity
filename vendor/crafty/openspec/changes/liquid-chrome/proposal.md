# Liquid chrome: the toolbar rendered by the module's glass pipeline

Status: **Rejected after implementation** — the interface bans glass effects.
The chrome-glass path was built and shipped, the performance verdict in the
browser was unambiguous (the editor became "incredibly laggy"), and the
product decision is: **the editor interface never renders glass; authored
glass fills remain a user capability** (the ADR 0012 pipeline, now fixed —
see the research postscript). The chrome-glass code was removed: protocol
fields, module support, shader path, host tracker, DOM attributes and the
CSS utilities are gone. What survived the experiment, because it is authored-
glass infrastructure: the overlay-blit split fix (the overlay can never
share the scene target), the WGSL compile fixes, and the naga shader
validation test that caught them. The toolbar keeps its flesh (pills, kbd
hints, tool shortcuts) in plain theme styling.

## The Problem

The toolbar was asked to adopt `jeantimex/glass-effect-webgpu` and mimic
Apple's liquid-glass look. The CSS route (`glass-pill`/`glass-surface`
utilities) cannot reproduce the repo's look — refraction, directional
specular, edge-progressive blur and spring deformation are shader terms, and
a CSS approximation reads as flat gradients. The module already owns the
transferable machinery from that repo (the blur pyramid + glass composite
pass, ADR 0012): it draws rect-geometry glass surfaces sampling the
already-rendered scene. The toolbar pills _are_ rect-geometry glass surfaces
— the only missing pieces are a host-composed chrome surface channel and the
demo's light model in the composite shader.

## The Decision

**Chrome glass geometry moves into the frame; chrome content and interaction
stay DOM.** The toolbar capsule, its tool pills, the active-tool pill and the
option pills render in the canvas frame through the existing glass composite
pass — with the demo's light model ported into the composite shader — while
the DOM buttons above them go transparent and keep icons, kbd badges, focus
and pointer handling. This partially reverses the glass-fills decision that
"WebGPU chrome would mean rendering the toolbar inside the frame — an
architectural reversal of the chrome boundary, rejected": the _geometry_
enters the frame, the _content_ does not, and the invariants hold (nothing
authored in the GPU, chrome is renderer state, overlays composite above
authored content, pointer-down never mutates). The authored/renderer line is
untouched.

**The light model, ported from the repo's `glass.wgsl`** (independent
reimplementation in the module's own pipeline — no WGSL or TS ported verbatim;
research-ledger row already on record):

- **Progressive blur** — blur ramps with distance from the bezel
  (`blur + (1-bezel_t)·progressive·50`): frosted edge, near-clear center,
  sampled per-fragment from the existing 5-level pyramid (the demo's
  `sample_blur_pyramid`, `calculate_progressive_blur`).
- **Bezel refraction** — the bezel region displaces the sampled backdrop
  inward via the surface-height derivative (Snell's law, the demo's
  `calculate_displacement` with the squircle-lip profile), capped.
- **Directional specular** — rim highlight along a fixed light direction
  (`specular_angle`), rim thickness tapering with `dot(normal, lightDir)²`,
  quarter-circle falloff (`sqrt(1-(1-t)²)`), intensity² (the demo's
  `calculate_specular`), over the SDF gradient normal.
- **Chromatic aberration** — RGB split of the displaced samples at the edges
  (the demo's default look: `chromaticAberration` on, 0.2/0.4).
- **Springs** — the demo's spring integrator (semi-implicit Euler,
  sub-stepped at 1/120, per-property stiffness/damping) drives the pill
  squash on press (`deformationX/Y`, 300/15 — the underdamped liquid
  overshoot) and the opacity/specular lift on hover/press
  (`glassBgOpacity` 800/50, `specularOpacity` 420/20 — the demo's
  `springs.ts`). Host-side TS, kernel-free, unit-testable.
- **The demo's look constants** as chrome defaults: white tint at low
  opacity, `specularOpacity` 0.8 / thickness 2 / blur 2 / angle π/3,
  `refractiveIndex` 1.5, `maxDisplacementScale` 0.8.

**Pass order**: scene render → pyramid → authored composite → overlay render
→ **chrome composite** → present. Chrome glass draws above overlays (the
toolbar floats above selection chrome). Known v1 fidelity gap, recorded not
hidden: the pyramid contains only the scene render, so overlay content (grid
lines, selection outlines) appears sharp through chrome glass — the demo's
background includes its grid. Fixing it needs a second pyramid over the
composited image ("glass frames render twice", the ADR 0012 cost note); the
trigger is a visual judgement in the browser.

**Budget**: a separate chrome cap (16 surfaces, hard-capped in the module;
host caps first). Past the cap chrome surfaces draw flat tint, never vanish —
the degradation doctrine. Chrome surfaces carry no document ids (their
`id`s are chrome keys — cache keys, not identity).

**Not adopted, recorded**: HTML-in-Canvas DOM capture and the flag-gated
live-DOM path stay rejected (interactive content stays real DOM above the
frame); frost noise and the multi-shape liquid morphing (smin SDF blends,
split-menu) stay deferred — the pill squash is the liquid motion v1.

## What Changes

- **`packages/scene-renderer/src/draw-protocol.ts`** — `DrawChromeGlassSurface`
  (id, canvas-relative CSS-px bounds, radius, spring scaleX/scaleY,
  pressed/hovered 0..1) and `RenderFrame.chromeGlass?` — additive, no version
  bump (the demo's defaults are module-side constants, not packet fields).
- **`packages/scene-renderer-wasm/src/lib.rs`** — `ChromeGlassSurface` decode +
  validation (finite, bounded, cap 16); the surface-params record grows 24 →
  28 f32 (radius, screen, scaleX, scaleY, pressed, hovered — authored
  surfaces default them); the split-encoding gate becomes
  `glass.is_empty() && chrome.is_empty()`; a chrome composite draw after the
  overlay pass (instance offset into the shared params buffer).
- **`packages/scene-renderer-wasm/src/glass-composite.wgsl`** — the light
  model above, for `screen` surfaces: rounded-rect SDF (radius), per-fragment
  progressive pyramid sampling, Snell bezel displacement, directional
  specular over the SDF gradient, chromatic RGB split, soft offset shadow
  (quads padded by the shadow margin), spring scale applied to the SDF.
- **`apps/crafty-web/src/editor/chrome-glass.ts`** (new) — the spring
  integrator (the demo's `stepGlassSprings`) and the chrome-glass tracker:
  per-pill DOM rects, hover/press state from DOM listeners, spring
  integration. No React on the path.
- **`apps/crafty-web/src/editor/canvas-stage.tsx`** — the rAF loop measures
  `[data-chrome-glass]` elements (canvas-relative rects), integrates the
  springs with rAF dt, and passes `chromeGlass` in the render options.
- **`apps/crafty-web/src/components/editor/editor-toolbar.tsx` + layout** —
  the pills and capsule get `data-chrome-glass` and drop their CSS
  backgrounds (transparent DOM above the canvas glass); kbd badges, icons,
  titles and interactions unchanged.
- **Tests** — chrome-glass springs (settle, overshoot, press/release);
  protocol round-trip; module decode/validation/pass-order witnesses
  (chrome draws after overlays); budget flat degradation. Pixel proof is
  the browser: the WGSL is headless-tested only (decode, params, order) —
  the standing gap-8 honesty, with the user's browser as the visual oracle.

## Files

- `packages/scene-renderer/src/draw-protocol.ts`
- `packages/scene-renderer-wasm/src/lib.rs`, `glass-composite.wgsl`
- `apps/crafty-web/src/editor/chrome-glass.ts` (+ test),
  `canvas-stage.tsx`
- `apps/crafty-web/src/components/editor/editor-toolbar.tsx`,
  `app/files/[slug]/layout.tsx`, `app/globals.css` (CSS glass retired from
  the toolbar; stays for the inspector panel, which sits beside the canvas)
- `docs/research/liquid-glass-chrome.md` (reality update),
  `docs/architecture/research-ledger.md` (amended conclusion)
- ADR at close-out (the boundary partial-reversal, recorded when shipped)

## Risks

- **Unverifiable pixels here.** The WGSL is written against the demo shader
  and headless-tested; the visual iteration loop is the user's browser.
- **DOM/canvas alignment.** A sub-pixel misalignment between the canvas-drawn
  glass and the transparent DOM buttons would show as a double edge; the
  measurement is `getBoundingClientRect` × DPR on the same frame the canvas
  uses, and the bezel is drawn inside the measured rect, not around it.
- **Nested composite cost.** Chrome frames run one extra composite draw;
  the pyramid is built once per glass frame either way. Measured in the
  browser, no invented numbers.
- **Grid-through-glass.** Overlay content shows sharp through chrome glass
  v1 (recorded above; the second-pyramid fix has a trigger).
- **No-browser degradation.** Without WebGPU the canvas glass cannot draw:
  the DOM buttons would be invisible. Mitigation: when the module reports
  unavailability, canvas-stage re-adds the CSS glass classes to the pills
  (the utility stays in globals.css as the fallback, not the answer).
