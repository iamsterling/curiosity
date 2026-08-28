## 1. Protocol: chrome glass surfaces

- [x] 1.1 Add `DrawChromeGlassSurface` (id, CSS-px canvas-relative bounds, radius, scaleX/scaleY, pressed, hovered, host-marked flat) and `RenderFrame.chromeGlass?` with `MAX_CHROME_GLASS_SURFACES = 16` to `draw-protocol.ts`, additive without a protocol version bump
- [x] 1.2 Add chrome validation to `failure-policy.ts` (`RENDER_PACKET_INVALID:chromeGlass[<i>].<field>`: finite bounds, radius ≥ 0, scale > 0, pressed/hovered in [0,1], flat boolean) and the `CHROME_GLASS_SURFACES_CAPPED` diagnostic
- [x] 1.3 Add protocol round-trip tests: budget under/over the cap, flat degradation preserving every field, malformed fields with stable codes

## 2. Module: decode, pack, pass order

- [x] 2.1 Add `ChromeGlassSurface` decode + validation + module cap in `rust/src/lib.rs`; the split-encoding gate is `needs_split` (authored glass OR chrome — chrome-only frames split too, because chrome composites above the overlay, which needs its own target)
- [x] 2.2 Pack chrome surfaces into the shared params buffer after authored surfaces (screen=1, radius, scaleX/scaleY, pressed, hovered fill the previously inert fields); `prepare_composite` + staged `draw_composite` calls: authored `[0, n)` between scene and overlay, chrome `[n, n+m)` after the overlay blit
- [x] 2.3 WGSL: the `screen` vertex branch (device = bounds × pixelRatio, canvas-relative) and the chrome fragment — progressive blur, Snell bezel refraction, directional specular, chromatic split, soft shadow, spring-scaled SDF — with the demo's look constants as module-side defaults; authored path (screen=0) byte-identical
- [x] 2.4 Rust tests: chrome serde round-trip, packer witnesses (incl. flat past the cap), `needs_split` gate; the naga validation test covers the chrome fragment (and caught the `dFdx` → `dpdx` rename the dialect requires)

## 3. Host: springs, tracker, stage wiring

- [x] 3.1 `chrome-glass.ts`: the spring integrator (semi-implicit Euler, 1/120 substeps, deformationX/Y 300/15, glassBgOpacity 800/50, specularOpacity 420/20) with rest-parking (settled springs snap to targets), and the tracker (per-element DOM rects, hover/press listeners, canvas-relative measurement)
- [x] 3.2 Unit tests: settle, underdamped overshoot, press/release round-trip, rest-parking, frame-rate independence, tracker measurement math
- [x] 3.3 Canvas stage: measure `[data-chrome-glass]` rects per frame, integrate springs with rAF dt, pass `chromeGlass` in render options; render when the quantized chrome key changed even if the document revision did not (and idle when it is stable)
- [x] 3.4 Manage the `glass-active` class (add when a frame renders, drop on failure); chrome elements keep their CSS appearance as the no-GPU fallback

## 4. DOM and shell

- [x] 4.1 Mark the top bar, tool rail, status strip and floating panels `data-chrome-glass` (+ `data-chrome-radius`) in the layout; add the `glass-active` gating rule to `globals.css` (transparent backgrounds under GPU glass, CSS appearance otherwise)
- [x] 4.2 Verify hover/press wiring: DOM hover states render over the GPU glass (browser-verified)

## 5. Verify, measure, record

- [x] 5.1 `bun run typecheck` (editor/scene-renderer/editor-web + dependents clean; `@crafty/cms` failures pre-existing), `bun run test` (editor 429, scene-renderer 98 vitest + 54 cargo), `bun run lint`, `bun run format:check`, wasm build
- [x] 5.2 Browser verification: chrome draws as glass over the canvas (glass-active on, DOM transparent, canvas pixel-verified rendering scene + grid), springs squash on press (unit-tested; visual loop is the user's browser), fallback appearance returns when the module is unavailable (class-gated by design)
- [x] 5.3 Performance record: headless agent-browser, this host, 1280×577, DPR 1 — interaction (pan) p50 16.7 ms / p95 16.7 ms / max 16.8 ms with the liquid fragment active; no-glass A/B baseline identical; rest phase idles at 60 fps (the render loop early-returns once the chrome key stabilizes). The "incredibly laggy" rejection verdict was not reproduced here; the user's browser is the oracle, dial-backs recorded in the ADR
- [x] 5.4 ADR 0021 written (the boundary re-decision, recorded at close-out); research ledger + `liquid-glass-chrome.md` postscript 3 amended; `current-state.md` + `renderer.md` updated for the reality change — including the en-route find: the overlay `axes` records lacked the `weight` field the module's `OverlayLine` decode requires, dropping every frame while the grid origin was on screen (fixed at the source, grid renders again)

## En-route finds (recorded, not hidden)

- **The axes/weight decode mismatch** (above) — pre-existing, latent since the
  platform foundation; exposed the moment frames were actually inspected.
- **The chrome-key churn**: settled springs converge asymptotically, so
  full-precision change keys re-rendered every frame at rest; the quantized
  key + rest-parking fix keeps the draw loop idle.
- **The `dFdx` → `dpdx` dialect rename**: the module's naga frontend (and the
  WebGPU spec) names derivatives `dpdx`/`dpdy`; the naga validation test
  caught it at cargo-test time, exactly the safety net the record promised.
