# The liquid-glass look and the WebGPU adoption boundary

Dated: 2026-08-08. Investigation record, not doctrine.

## The question

The toolbar was asked to adopt
[`jeantimex/glass-effect-webgpu`](https://github.com/jeantimex/glass-effect-webgpu)
"fully" and mimic Apple's liquid-glass appearance. This report separates what
that repository actually is from what the look requires, and records why the
chrome stays CSS while the GPU technique is staged.

## What the reference repository is

MIT (stated in its README; no LICENSE file in-tree — recorded in the
research-ledger row). A real-time liquid-glass renderer:

- **Pipeline** — a fullscreen WebGPU pass chain: rendered scene → offscreen
  texture → progressive gaussian blur pyramid (levels 0/8/16/32/64 device px,
  two-pass separable 25-tap) → glass surfaces sampling the pyramid with
  per-surface uniforms (refraction offset, tint, saturation, specular,
  shadow, thickness, bezel) → composite. Springs (`springs.ts`) drive liquid
  deformation of the glass geometry on press/drag/release; a displacement
  map feeds the shader.
- **DOM capture** — the background can be a live DOM subtree via the
  experimental HTML-in-Canvas API (`copyElementImageToTexture`,
  Chrome-Canary flag `canvas-draw-element`), with `html2canvas` as the static
  fallback. Text stays selectable only on the flag-gated path.
- **Presets** — circle/rectangle/switch/slider/split-menu/player controls,
  all parameterising the same shader.

## The shader's light model (studied from `glass.wgsl`)

The look is not gradients — it is a specific light model, and each term
translates (or fails to translate) to CSS on its own:

| Shader term                                        | Meaning                                                                                                                               | CSS translation                                                                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `surface_convex_squircle` / `surface_lip`          | the bezel is a raised lip with a curved profile                                                                                       | the bezel ring + inset rim shadows                                                                                                               |
| `calculate_displacement` (Snell's law)             | the bezel **refracts** the backdrop inward — edge lensing                                                                             | **impossible** (backdrop-filter has no displacement) — the frosted bezel ring carries the illusion                                               |
| `calculate_progressive_blur`                       | blur is `blur_amount + edge_factor·50`: **frosted edge, near-clear center**                                                           | two blur layers: the surface blurs hard, a `::before` window inset by the bezel re-samples at low blur                                           |
| `calculate_specular`                               | directional light (`specular_angle`): rim thickness tapers with `dot(normal, lightDir)²`, falloff `sqrt(1-(1-t)²)`, intensity squared | a radial highlight positioned just above the top edge, transparent at the sides — brightest along the light direction, nothing on the lower half |
| `apply_glass_theme`                                | bright surfaces get `color·1.03+0.2` (the fill brightens the backdrop)                                                                | low-alpha white fill (~10%), never an opaque tint                                                                                                |
| `glass_bg_opacity` raised on press                 | pressed glass turns more opaque                                                                                                       | `:hover` opacity bump                                                                                                                            |
| shadow                                             | soft `smoothstep` shadow only outside the shape                                                                                       | drop shadow + dark lower rim (light from above)                                                                                                  |
| frost noise, chromatic aberration, magnifying lens | surface texture, RGB-split edges, center magnification                                                                                | **impossible** in CSS — skipped, recorded                                                                                                        |

The first CSS attempt shipped a flat tint at 52% opacity with a full-width
linear "sheen" — a uniform strip, not directional light, and the opacity
killed the backdrop entirely. It read as gradients because it was gradients;
the shader study replaced it with the two-blur progressive window, the
directional radial specular, and the near-clear fill above.

## The adoption boundary (already decided; this change stays inside it)

The `glass-fills` proposal's Decision and the research-ledger row
(jeantimex/glass-effect-webgpu) settled both halves:

1. **The technique** — the blur pyramid and progressive sampling were adopted
   for the _authored_ `glass` fill (ADR 0012, module-owned composite pass
   between scene render and overlay render). That is the substrate real
   liquid glass in documents will ride. Springs, displacement maps and
   HTML-in-Canvas capture were rejected: interaction is kernel-side and
   scenes are not DOM.
2. **The chrome** — rendering the toolbar inside the GPU frame reverses the
   chrome boundary (React DOM composited by the browser over the WebGPU
   canvas; the packet carries no chrome). Chrome glass is CSS
   `backdrop-filter`, which the browser composites itself.

Nothing in the new repository reading changes that: the repo's interactive
live-DOM path is flag-gated experimental, its fallback is a static capture
(no toolbar interactivity), and a second WebGPU device for chrome would
compete with the scene device the module owns. "Full adoption" is therefore
not a viable literal instruction — the _appearance_ is adopted as far as the
boundary allows, and the _technique_ is already adopted where the boundary
allows (authored glass).

## What Apple's liquid glass actually is, and what CSS can do

The liquid-glass look decomposes into layers of increasing GPU dependence:

| Layer                                              | Technique                                                        | CSS-achievable                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Frosted tint + backdrop blur                       | backdrop-filter blur/saturate/brightness over sampled content    | yes (already shipped in `glass-fills`)                                     |
| Progressive blur (frosted edge, clear center)      | blur that ramps with distance from the bezel                     | yes — two blur layers (surface + inset window)                             |
| Directional specular                               | highlight along the light direction, tapered rim, curved falloff | yes — radial highlight from just above the top edge, transparent elsewhere |
| Bezel                                              | raised lip profile, bright top rim, dark lower rim               | yes (border color-mix + inset shadows)                                     |
| Pressed opacity                                    | glass fills slightly on press                                    | yes (`:hover` bump)                                                        |
| Refraction of the backdrop                         | displaced texture sampling (Snell's law) in a shader             | no — needs the GPU pass (authored-glass ADR 0012 territory)                |
| Spring liquid deformation                          | displacement map + spring dynamics                               | no — needs the GPU pass; interaction kernel-side when it comes             |
| Frost noise, chromatic aberration, magnifying lens | procedural texture, RGB-split edges, center magnification        | no                                                                         |

The shader-informed CSS subset shipped in this change: the `glass-pill` and
`glass-surface` utilities carry the progressive two-blur window, the
directional radial specular, the near-clear fill, the bezel rims and the
pressed opacity — each term traced to its shader counterpart above.
Backdrop-filter support degrades gracefully to tint + bezel alone.

## Conclusion

The toolbar wears the liquid-glass _appearance_ in CSS now, with the shortcut
pills and options the toolbar needs. The WebGPU _technique_ stays where the
boundary already put it: the authored-glass pipeline (ADR 0012) for documents,
staged behind the real-browser spike; chrome stays DOM. Springs/refraction on
chrome remain rejected unless the chrome boundary itself is re-decided.

## Postscript: the chrome-glass build (2026-08-08, `openspec/changes/liquid-chrome`)

The user overruled the CSS-only conclusion: the toolbar was to look like the
demo, and the boundary was re-decided — chrome glass _geometry_ enters the
frame through the module's existing composite pass (the DOM keeps content and
interaction; the canvas stage measures the pills, springs drive the squash,
the composite shader carries the demo's light model). Shipped:

- The composite shader (`glass-composite.wgsl`) ports, for `screen` surfaces:
  edge-progressive blur via per-fragment pyramid sampling, Snell bezel
  refraction over the squircle-lip profile, the directional specular
  (tapered rim, quarter-circle falloff, intensity²), chromatic RGB split,
  spring scale on the SDF, soft offset shadow. Look constants are the demo's
  defaults.
- The demo's spring integrator (`springs.ts`) host-side, driving
  deformationX/Y (300/15 — the liquid overshoot), glassBgOpacity (800/50)
  and specularOpacity (420/20).
- Chrome surfaces draw in a second composite call after the overlay pass; a
  separate budget (16, host-capped, flat-tint degradation).
- **Bug found en route, not fabricated**: the authored composite shader's
  `textureSampleLevel(pyramid, sampler, uv, surface.level0)` calls were
  missing the array-index/level arguments for `texture_2d_array` — the
  authored glass pipeline's WGSL has likely never compiled against a device.
  Fixed in the rewrite (5-arg form). Headless tests cannot catch this class
  of bug (they never compile WGSL); the browser is the oracle.
- **The black-canvas bug, proven from vello's source**: vello's render fills
  its whole target with the base color on every call — the glass split path
  rendered the scene, then rendered the overlay into the same target, and
  the second fill wiped the scene to near-black. Present since the
  glass-fills split was written; never browser-verified, exposed the moment
  chrome glass made the split the every-frame path. Fixed: the overlay
  renders into its own target over a transparent base and is blitted over
  the scene+glass offscreen with straight-alpha source-over (`ALPHA_BLENDING`;
  pinned Vello 0.9 output is straight RGBA after unpremultiplication);
  pass order is now scene → pyramid → authored composite → overlay target →
  blit → chrome composite → present. This also fixes the authored-glass
  path, which had the same latent wipe.
- **Browser-gated, recorded not hidden**: on-screen verification of both the
  chrome glass and the authored-glass fixes; overlay content (grid,
  selection) shows sharp through chrome glass v1 (the pyramid holds the
  scene only — the second-pyramid fix is the triggered follow-up); the
  no-GPU fallback re-adds the CSS utilities to the pills.

## Postscript 3: the return (2026-08-10, `openspec/changes/chrome-glass`)

The product owner re-decided: the interface's glass ban is lifted for the
**floating chrome** — the top bar, tool rail, status strip and floating
panels wear the module's glass again, the full liquid look, with the
experiment's lessons carried forward. ADR 0021 reverses ADR 0012 #6 and
Postscript 2's verdict.

What the return rebuilt (the rejected design, on the surviving substrate):
screen-anchored chrome surfaces (`screen`, `radius`, spring `scale_x/y`,
`pressed`, `hovered` — the fields kept inert in the record after the
removal), the chrome fragment (progressive blur, Snell bezel refraction,
directional specular, chromatic split, spring-scaled SDF, soft offset
shadow), the host springs and tracker, the 16-surface budget with flat-tint
degradation, and the CSS fallback gated by `glass-active`. Chrome composites
after the overlay blit, sampling the scene-only pyramid — grid and selection
stay sharp through chrome v1, the recorded gap (the second-pyramid fix
remains the triggered follow-up).

The performance record, measured in the browser (agent-browser, this host,
1280×577, DPR 1): interaction (pan) p50 16.7 ms / p95 16.7 ms / max 16.8 ms
with the liquid fragment active, matching the no-glass A/B baseline — the
"incredibly laggy" verdict was **not** reproduced in this environment. The
user's browser is the visual and performance oracle; the dial-backs are
designed in (flat tint past the budget, springs off, fixed level pair).

**Discovered and fixed en route, not fabricated**: the overlay `axes`
records reached the module without the `weight` field its `OverlayLine`
decode requires — every frame dropped while the grid origin was on screen,
leaving the canvas black. The wire shape is fixed at its source (axes carry
`weight: "major"`); the grid renders again with the origin in view. This
decode-mismatch class is exactly what the "never drift apart again"
discipline in Postscript 1's record was for.

## Postscript 2: the rejection (2026-08-08)

The browser verdict ended the chrome-glass experiment: the editor became
"incredibly laggy", and the product decision is that **the interface bans
glass effects, absolutely — while users keep the ability to create glass
effects** (authored glass fills remain, ADR 0012). The chrome-glass path was
removed cleanly: protocol fields, module support, the shader's screen branch
and chrome fragment, the host tracker and springs, the DOM attributes and
the CSS utilities. The toolbar keeps its flesh (pills, kbd hints, tool
shortcuts, the grid pill) in plain theme styling. What survived, because it
is authored-glass infrastructure: the overlay-blit split fix (the overlay
renders into its own target and is blitted over the scene — the authored
path's correctness fix), the WGSL compile fixes, and the naga validation
test that catches shader-compile bugs on every cargo test. Non-glass
documents never touch the split path: the render cost is exactly the
pre-experiment single-pass path.
