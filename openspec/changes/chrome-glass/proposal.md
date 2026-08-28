# Chrome glass returns: the floating chrome wears the module's glass

Status: **Implemented** (2026-08-10, ADR 0021) — the product decision
re-decided the liquid-chrome rejection. The design is the rejected
proposal's own design, rebuilt on the substrate that survived the removal;
the open question — whether the liquid look's per-fragment cost is
acceptable — was settled by measurement in the browser and recorded below.
The verdict was **not reproduced** in the measured environment; the user's
browser remains the visual and performance oracle, and the flat-tint
degradation is the documented dial-back.

## The record (cited, not re-litigated)

- **ADR 0012 decision 6**: "Chrome glass is CSS, not GPU" —
  `docs/architecture/adrs/0012-glass-fills.md:64-68`. This proposal reverses
  that decision for the chrome surfaces: their glass geometry enters the frame
  through the module's existing composite pass; content and interaction stay
  DOM.
- **The liquid-chrome experiment shipped then died on a browser verdict**:
  "the editor became 'incredibly laggy'", and the product decision was "the
  interface bans glass effects, absolutely" — `openspec/changes/liquid-chrome/proposal.md:1-14`
  and `docs/research/liquid-glass-chrome.md:149-164`. This proposal reverses
  that ban. The user is the product owner; the ban was their call and the
  reversal is their call.
- **What survived the removal** — all of it is authored-glass infrastructure
  and all of it is in place today:
  - the overlay-blit split fix (`wgpu_present.rs` `PresentState.overlay`,
    pass order scene → pyramid → authored composite → overlay target → blit →
    present), the fix for the black-canvas wipe that the every-frame split
    exposed (`liquid-glass-chrome.md:134-142`);
  - the composite shader's fixed 5-arg `textureSampleLevel` calls
    (`glass-composite.wgsl:107-108`), which had likely never compiled against
    a device before the experiment (`liquid-glass-chrome.md:126-131`);
  - the naga shader-validation test that catches WGSL compile bugs on every
    cargo test (`liquid-glass-chrome.md:160-163`);
  - the inert chrome fields that the struct keeps so the buffer stride and
    the Rust packer never drift apart again: `screen`, `radius`, `scale_x`,
    `scale_y`, `pressed`, `hovered` (`glass-composite.wgsl:26,46-52`;
    `rust/src/lib.rs:430-437`). They are packed as zeros/ones today. This
    proposal resurrects them.
- **The fidelity gap was recorded, not hidden**: "overlay content (grid,
  selection) shows sharp through chrome glass v1 (the pyramid holds the scene
  only — the second-pyramid fix is the triggered follow-up)"
  (`liquid-glass-chrome.md:144-147`). The user has chosen to accept that gap
  for this pass (scene-only pyramid); the follow-up trigger is recorded below.

## Confirmed state of the code (defect vs improvement, honestly labelled)

- **Confirmed defect (improvement this change fixes)**: the composite shader
  draws full rects only — `CORNERS` at `glass-composite.wgsl:68-71` and no
  SDF in the fragment. Chrome pills need rounded rects; the inert `radius`
  field is the intended hook. Authored glass surfaces are rects and keep
  radius 0 (no authored behavior change).
- **Confirmed defect (improvement this change fixes)**: the composite's
  vertex shader anchors every surface through the world affine
  (`glass-composite.wgsl:80-82`). Chrome surfaces are screen-anchored
  (canvas-relative CSS px); the inert `screen` field is the intended switch.
- **Confirmed defect (improvement this change fixes)**: every frame is a
  glass frame once chrome is present, so the split encoding becomes the
  every-frame path — the exact condition that exposed the black-canvas bug.
  That bug is fixed and tested; this change adds the pass-order witness tests
  that lock the every-frame path down.
- **Confirmed defect, separate change (not part of this proposal)**: grid
  overlay lines were not device-pixel snapped — measured at pan 3.7/DPR 2 a
  "1px" minor line spanned device px [22.40, 24.40], fractional and soft, and
  at high zoom the unit-step pixel grid beat against the LOD grid (the
  "wacky grid"). The fix ships alongside in the same session as a plain bug
  fix (no ADR, no protocol change): the module's encoder snaps every overlay
  line and dot to device pixels, and the pixel grid renders one line per
  device pixel with its own budget, replacing the LOD lines at
  `zoom × pixelRatio ≥ 4`; this proposal does not cover it.

## Design (the rejected proposal's design, rebuilt on the surviving substrate)

1. **Protocol — additive, no version bump.** `DrawChromeGlassSurface`:
   `id`, canvas-relative CSS-px `bounds`, `radius`, spring `scaleX`/`scaleY`,
   `pressed`/`hovered` (0..1, host-integrated). `RenderFrame.chromeGlass?`
   optional array, kernel-neutral (the glassSurfaces precedent). No bump:
   the field is optional, serde ignores unknown fields, and the module's
   validation is per-field (`RENDER_PACKET_INVALID:chromeGlass.<field>`).
   The demo's look constants are module-side defaults, not packet fields.
2. **The chrome budget, the overlay precedent**: a separate chrome cap —
   16 surfaces, host-capped first, the module mirroring with a hard cap.
   Past the cap, chrome surfaces draw flat tint — visible and ordered, never
   vanishing. Chrome surfaces carry chrome keys, never document ids.
3. **Rust**: `ChromeGlassSurface` decode + validation (finite, bounded, cap);
   the surface-params record is already 28 f32 with the chrome fields inert
   (`wgpu_present.rs:519`); chrome packs them for real (screen=1, radius,
   scale, pressed, hovered) and appends to the shared params buffer. The
   split-encoding gate becomes `glass.is_empty() && chrome.is_empty()`
   (`lib.rs:1194-1221` today keys on `glass` only). A chrome composite draw
   runs after the overlay blit, before present — instance offset into the
   shared params buffer, same pipeline.
4. **WGSL — the light model, rebuilt in the module's own pipeline** (the
   demo's look, the removed shader's design, per the recorded spec in
   `liquid-glass-chrome.md:32-52` and the rejected proposal):
   - `screen` surfaces anchor device = bounds × pixelRatio (canvas-relative,
     no world affine); the SDF takes the spring scale and `radius`;
   - **progressive blur** — blur ramps with distance from the bezel
     (`blur + (1-bezel_t)·progressive·50`), per-fragment sampling of the
     existing pyramid;
   - **bezel refraction** — Snell's-law displacement of the backdrop sample
     over the squircle-lip profile, capped;
   - **directional specular** — rim highlight along the fixed light
     direction, thickness tapering with `dot(normal, lightDir)²`,
     quarter-circle falloff, intensity², over the SDF gradient normal;
   - **chromatic aberration** — RGB split of the displaced samples at the
     edges;
   - **soft offset shadow** — smoothstep shadow outside the shape, quads
     padded by the shadow margin;
   - look constants: the demo's defaults (white tint at low opacity,
     specularOpacity 0.8 / thickness 2 / blur 2 / angle π/3,
     refractiveIndex 1.5, maxDisplacementScale 0.8).
   - The authored-glass fragment path is untouched (screen=0 keeps today's
     behavior byte-for-byte).
5. **Springs, host-side TS, kernel-free** — the demo's spring integrator
   (semi-implicit Euler, sub-stepped at 1/120, per-property
   stiffness/damping: deformationX/Y 300/15 — the underdamped liquid
   overshoot — glassBgOpacity 800/50, specularOpacity 420/20) and the
   chrome-glass tracker: per-pill DOM rects, hover/press state from DOM
   listeners, spring integration on rAF dt. No React on the path. The canvas
   stage measures `[data-chrome-glass]` elements each frame (canvas-relative
   rects), integrates springs with rAF dt, and passes `chromeGlass` in the
   render options.
6. **Pass order**: scene → pyramid → authored composite → overlay render →
   overlay blit → **chrome composite** → present. Chrome samples the
   scene-only pyramid — grid and selection stay sharp through chrome v1, the
   recorded fidelity gap, accepted by decision (user's call).
7. **Degradation, the doctrine, not a fallback**: without WebGPU the chrome
   cannot be drawn in-frame, so the DOM pills keep their plain theme styling
   (the current `bg-card/95 backdrop-blur-sm` utilities stay in the CSS as
   the no-GPU appearance, gated by a `glass-active` class the canvas stage
   manages). When the module reports unavailability or a device loss, the
   class drops and the CSS appearance returns.
8. **Measurement is part of the change, not an afterthought.** The previous
   verdict ("incredibly laggy") was browser-measured; this change records a
   comparable measurement before close-out: rest-frame times and interaction
   frame times (pan/zoom/drag) in the real browser, environment + distribution
   recorded per `docs/architecture/performance.md`. If the liquid fragment's
   cost repeats the verdict, the recorded dial-backs are: (a) chrome surfaces
   past the budget already draw flat tint; (b) springs can be disabled with
   static glass; (c) the fragment's progressive sampling can clamp to a fixed
   level pair. The product call belongs to the user; the numbers belong to
   this record.

## What changes (files)

- `packages/scene-renderer/src/draw-protocol.ts` — `DrawChromeGlassSurface` +
  `RenderFrame.chromeGlass?` + `MAX_CHROME_GLASS_SURFACES` (16).
- `packages/scene-renderer/src/failure-policy.ts` — chrome validation codes
  under `RENDER_PACKET_INVALID:chromeGlass.<field>`; budget diagnostics.
- `packages/scene-renderer/src/wasm-bridge.ts` — chrome surface encode/decode
  round-trip.
- `packages/scene-renderer/rust/src/lib.rs` — `ChromeGlassSurface` decode +
  validation + cap; packer fills the inert fields; split gate
  `glass.is_empty() && chrome.is_empty()`; chrome composite draw after the
  overlay blit.
- `packages/scene-renderer/rust/src/glass-composite.wgsl` — the `screen`
  vertex branch + the chrome fragment (light model above); authored path
  unchanged.
- `apps/web/editor/src/components/editor/chrome-glass.ts` (new) — springs +
  tracker; unit tests.
- `packages/editor/src/ui/editor/canvas-stage.tsx` — measure, integrate,
  pass `chromeGlass`, manage the `glass-active` class.
- `apps/web/editor/src/app/editor/[slug]/layout.tsx` + `globals.css` — the
  chrome elements carry `data-chrome-glass`; CSS appearance stays as the
  no-GPU fallback, transparent when `glass-active`.
- Tests: springs (settle, overshoot, press/release); protocol round-trip;
  module decode/validation/cap/pass-order witnesses (chrome draws after the
  overlay blit); budget flat degradation. WGSL is headless-tested only via
  naga validation (the standing gap-8 honesty) — the browser is the visual
  oracle, and the perf record below closes it for this change.
- `docs/research/liquid-glass-chrome.md` (postscript 3: the return, with the
  measurement), `docs/architecture/research-ledger.md` (amended conclusion),
  `docs/architecture/current-state.md` + `renderer.md` (reality update),
  ADR at close-out (the boundary re-decision).

## Explicitly out of scope

- The second pyramid (blurred grid/selection through chrome) — the recorded
  follow-up; trigger: a visual judgement in the browser once v1 ships, and a
  measurement that the second pyramid's cost is acceptable.
- HTML-in-Canvas DOM capture and the flag-gated live-DOM path (interactive
  content stays real DOM above the frame).
- Frost noise and multi-shape liquid morphing (smin blends, split menus).
- Any authored-glass behavior change (authored surfaces keep today's rect
  path and level-pair sampling).
- The device-pixel grid snapping fix (separate bug fix, same session).

## Risks

- **The perf verdict repeats.** It was measured once; the numbers in this
  proposal's close-out settle it. The dial-backs are already designed in.
- **Unverifiable pixels headless.** WGSL is naga-validated only; the visual
  loop is the user's browser (gap-8 honesty, unchanged).
- **DOM/canvas alignment.** A sub-pixel misalignment between the canvas-drawn
  glass and the transparent DOM buttons would show as a double edge; the
  measurement is `getBoundingClientRect` × DPR on the same frame the canvas
  uses, and the bezel is drawn inside the measured rect, not around it.
- **Grid-through-glass.** Sharp by decision, recorded, follow-up triggered.
- **Every-frame split cost.** The split encoding (two Vello renders + blit)
  becomes the every-frame path; it already is the authored-glass path and is
  measured in the close-out record.
