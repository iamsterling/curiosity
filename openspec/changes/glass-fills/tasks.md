# Glass fills — tasks

## 1. Kernel: the glass fill model

- [x] 1.1 `packages/editor-kernel/src/document.ts`: `fill: string | GlassFill`; `GlassFill` type (`kind: "glass"`, `blurRadius`, `tint`, `tintOpacity`, `saturation`, optional `refraction`) — additive union, no schema change
- [x] 1.2 Validation: per-field bounds with `FILL_GLASS_INVALID:<field>` (non-finite/negative `blurRadius`, malformed `tint`, out-of-range `tintOpacity`/`refraction`, `saturation < 0`); geometry gate — rectangle and frame accept, path/text/group reject with `FILL_GLASS_GEOMETRY_UNSUPPORTED`; the fill-mutating commands and their inverses carry it
- [x] 1.3 Clipboard: glass fills survive mint/apply and instance overrides
- [x] 1.4 Canonical serialization: glass descriptor byte-stable (sorted keys, no timestamps); parse accepts it on the current schema version
- [x] 1.5 Tests: valid round-trip; one test per invalid field code; geometry gate; clipboard; canonical determinism against a committed fixture (`glass-fills.test.ts`)

## 2. Kernel: the projection records

- [x] 2.1 `scene-adapter.ts`: `projectGlassRecords(document)` — glass records `{ nodeId, bounds, transform, blurRadius, tint, tintOpacity, saturation, refraction, opacity, zIndex, order }` (`opacity` added to the design's record shape so the composite honours authored node opacity); the legacy `Scene` is untouched (no Scene extension); glass nodes project into the Scene with opacity 0 + the tint hex (the Scene cannot express "draw nothing", and `visible: false` would hide a glass frame's children)
- [x] 2.2 Tests: records match the authored nodes (params, transform, `(zIndex, order)`); order mirrors the encoder's visible-slot traversal; invisible glass emits no record; scene projection keeps children and draws nothing (`glass-fills.test.ts`)

## 3. Protocol v4

- [x] 3.1 `packages/scene-renderer/src/draw-protocol.ts`: structural `GlassSurface` types (no kernel import, the overlay precedent); `RenderFrame.glassSurfaces?`; `DRAW_PROTOCOL_VERSION` → 4; version 3 still accepted
- [x] 3.2 Descriptor validation at the boundary: non-finite/out-of-range → `RENDER_PACKET_INVALID`, nothing presented (`glassSurfaceError` in `failure-policy.ts`, enforced in `retainValidPacket` + the bridge)
- [x] 3.3 Tests: v4 encode/decode; v3 accepted; malformed rejected; `(zIndex, order)` preserved regardless of array order

## 4. Module: pyramid + composite (lib.rs)

- [x] 4.1 Separable 25-tap Gaussian blur + blur pyramid (levels 0/8/16/32/64 device px, radius × DPR), textures recreated only on device size change; pyramid skipped when the frame has no glass (`glass-blur.wgsl` + `GlassPass::generate_pyramid`)
- [x] 4.2 Composite pass: per-surface textured quads sampling the pyramid (progressive: radius → adjacent level pair, lerped; refraction offset bounded), per-surface uniforms, drawn in merged `(zIndex, order)`; radius 0 = sharp backdrop + tint (`glass-composite.wgsl` + `GlassPass::composite`)
- [x] 4.3 Pass order: scene render → pyramid → composite → overlay render → present on glass frames; non-glass frames keep the single-encoding path unchanged (`encode_scene_frame`/`encode_overlay_frame` split; `render_packet_inner` drives it)
- [x] 4.4 Budget: host-side cap (`budgetGlassSurfaces` in wasm-bridge.ts) marks over-cap surfaces `flat` + reports `GLASS_SURFACES_CAPPED:<n>`; module-side defensive hard cap (256) draws no more than its bound (the grid-overlay mirror precedent)
- [x] 4.5 Failure policy: `GLASS_PYRAMID_FAILED` / `GLASS_COMPOSITE_FAILED` codes + stages + module-string mapping; the pyramid has no fallible wgpu step today (its code stays in the vocabulary for the spike)
- [x] 4.6 Headless tests: decode → descriptor structs; `(zIndex, order)` sort; split-encoding path-count partition; budget degradation + rejection; pixel proof recorded as pending the real-browser spike in `benchmarks/pixel-parity-recording.md`

## 5. Chrome

- [x] 5.1 CSS fallback in `apps/web/editor/src/app/globals.css`: `glass-active` removes the DOM surface paint only after a successful module frame; without WebGPU (including SSR) the existing translucent theme classes remain visible, with no effects or JS required
- [x] 5.2 Apply the chrome glass marker to the current floating shell surfaces in `apps/web/editor/src/app/files/[slug]/layout.tsx` (the toolbar capsule, tool rail, status strip and floating panels); the current shell uses module glass with a CSS fallback rather than the superseded sidebar/canvas-strip arrangement
- [ ] 5.3 Visual verification in the browser (deliberately pending; no pixel success is claimed without browser evidence)
- [x] 5.3a Document the frosted-chrome boundary and fallback in `docs/architecture/react-boundary.md`

## 6. Docs, ADR and close-out

- [x] 6.1 ADR 0012: glass fills — backdrop sampling + module composite (pyramid, progressive blur, v4 protocol with v3 accepted, additive fill union, geometry restriction, budget degradation); rejected alternatives (CSS-only authored, Vello-native, host-side composite, mask texture, stacked re-blur, chrome in GPU); the MIT prior art and the independent-implementation record
- [x] 6.2 `docs/architecture/research-ledger.md`: the `jeantimex/glass-effect-webgpu` row — source, lesson (progressive blur pyramid), adopted (pyramid/Gaussian/progressive/radius × DPR) vs rejected (springs, displacement, HTML-in-Canvas), MIT note (README-stated, no LICENSE file in-tree)
- [x] 6.3 Update `renderer.md` (protocol v4, pass structure, gap 1 partial resolution: glass rects) and `current-state.md`
- [ ] 6.4 The `.ui` loss-list fixture gains a glass fill (ties into crafty-ui-format task 6.1) — save → reload → identical
- [x] 6.5 Full verification: `npm run typecheck`, `npm test`, `npm run lint`, `npm run format:check`, `npm run build` (rebuild changed packages first — the stale-`dist` rule)
