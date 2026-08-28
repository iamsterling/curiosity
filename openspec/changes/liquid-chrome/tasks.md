# Liquid chrome — tasks

> **Closed: rejected after implementation.** The interface bans glass (the
> performance verdict); the chrome-glass path is fully removed. The numbered
> tasks below record what was built and what the close-out kept or removed.

## 1. Chrome glass channel — REMOVED at close-out

- [x] 1.1 `DrawChromeGlassSurface` + `RenderFrame.chromeGlass` in draw-protocol.ts (additive, no version bump) <!-- removed: the protocol fields are gone; authored glassSurfaces untouched -->
- [x] 1.2 `withChromeGlass` host composition (webgpu-renderer.ts) + render-options threading <!-- removed -->
- [x] 1.3 Boundary validation: `chromeSurfaceError`, `budgetChromeGlass`, `CHROME_GLASS_CAPPED` <!-- removed -->
- [x] 1.4 Module: `ChromeGlassSurface` serde + decode, split-encoding gate, `chrome_surface_params`, second composite draw after the overlay pass <!-- removed; the surface record stays 28 f32 with the chrome fields inert (the buffer stride and the WGSL struct must never drift apart again — the bug class that blanked the canvas) -->

## 2. The light model — REMOVED at close-out (authored composite keeps its fixes)

- [x] 2.1 `glass-composite.wgsl`: SDF, progressive pyramid sampling, Snell bezel refraction, directional specular, chromatic split, spring scale, shadow <!-- the chrome fragment and screen branch are gone; the authored path keeps the fixed textureSampleLevel calls and the instance varying -->
- [x] 2.2 The authored composite's broken `textureSampleLevel` calls fixed (missing array-index/level for texture_2d_array) <!-- KEPT — the authored glass pipeline would never have compiled against a device -->
- [x] 2.3 Pass order: scene → pyramid → authored composite → overlays → chrome composite → present <!-- KEPT as: scene → pyramid → authored composite → overlay target → blit → present (the chrome draw removed) -->
- [x] 2.4 Budget: module hard cap <!-- the chrome cap removed; the authored cap stays -->

## 3. Springs and DOM — REMOVED at close-out

- [x] 3.1 `chrome-glass.ts`: the repo's `stepGlassSprings` integrator <!-- deleted with the host tracker -->
- [x] 3.2 canvas-stage: `[data-chrome-glass]` measurement, hover/press listeners, spring integration, render gate <!-- removed; the draw loop is back to render-on-change with no per-frame DOM measurement -->
- [x] 3.3 Toolbar pills carry `data-chrome-glass` and are transparent above the canvas glass <!-- removed: the pills are plain theme surfaces (bg-card + border) again; kbd badges, tool shortcuts, the active-tool pill and the grid pill stay -->

## 4. Verification

- [x] 4.1 Host tests: springs, protocol round-trip, budget + validation, withChromeGlass composition <!-- the chrome tests were removed with the code; 177 vitest green after the revert -->
- [x] 4.2 Module tests: chrome decode + gate, params layout contract, authored defaults, and **shipped WGSL validation** (naga parse + full validator over all three shaders) <!-- 37 cargo green; the WGSL validation test is KEPT — it caught the fragment-stage instance_index builtin and the vec2/f32 radius bug, both of which would have blanked the canvas -->
- [x] 4.2b **The black-canvas bug, proven from vello's source**: vello's render fills its whole target with the base color on every call — the glass split path rendered the scene, then rendered the overlay into the same target, and the second fill wiped the scene. Fixed with the overlay-target + blit; KEPT, it is the authored-glass path's correctness fix <!-- pass order: scene → pyramid → authored composite → overlay target → blit → present -->
- [x] 4.3 Browser verdict: the chrome glass rendered (liquid pills, squash on press) and the editor became "incredibly laggy" — the product decision: the interface bans glass, authored glass stays <!-- this is the rejection that closed the change -->
- [ ] 4.4 Authored-glass on-screen verification remains browser-gated (the pipeline now has a working pass order and compiled shaders; pixel proof waits for a document with a glass fill in the browser) <!-- the standing honest caveat -->

## 5. Docs

- [x] 5.1 Proposal (boundary partial-reversal recorded, then the rejection) <!-- status: Rejected after implementation -->
- [x] 5.2 Research report postscript (shipped reality, the shader bug, the black-canvas bug, the rejection) <!-- docs/research/liquid-glass-chrome.md -->
- [ ] 5.3 ADR at close-out (the chrome boundary: the interface never renders glass; authored glass is a user capability) <!-- when 4.4 lands or on request — the decision is recorded in the proposal and the research postscript in the meantime -->
