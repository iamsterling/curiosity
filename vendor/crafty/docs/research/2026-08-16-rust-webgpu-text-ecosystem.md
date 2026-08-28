# Rust/WebGPU text ecosystem — implementation evidence study

**Date:** 2026-08-16
**Decision served:** establish the independently verifiable text-engine and GPU-composition facts that a later Crafty substrate decision can evaluate.
**Non-decision:** this study does not select Crafty’s engine, schema, render packet, dependency set, or performance budget.

## Executive summary

1. **Confirmed fact:** Vello is a vector renderer, not a complete text system. Its public glyph API accepts a font plus *already positioned glyphs*; the Linebender Vello editor example obtains those glyph runs from Parley. Vello 0.9.0 adds glyph drawing controls and uses `skrifa` 0.42, while its separately released `glifo` 0.1.1 is explicitly experimental glyph rendering/caching—not shaping or paragraph layout. [Vello 0.9.0 changelog](https://github.com/linebender/vello/blob/875f324f21da93019cae9e8e61d4abfd69893206/CHANGELOG.md), [Parley Vello-editor source](https://github.com/linebender/parley/blob/1df9544bf0bd675d304001c0d0b35df2d220cd14/examples/vello_editor/src/text.rs), [Glifo README](https://github.com/linebender/vello/blob/66bb6c1095355f602be390e882378bca931d1b86/glifo/README.md).
2. **Confirmed fact:** Parley is the most explicit Linebender-side ownership split: Fontique handles enumeration/fallback, HarfRust shaping, Skrifa font access/scaled hinted outlines, ICU4X Unicode analysis, and Parley does layout plus selection/editing utilities. It is a released, actively evolving 0.x library, but its public tracking issue still lists bidi direction overrides, some CSS whitespace/overflow behavior, inline-span bounds, and editor scrolling as open work. [Parley 0.10.0 README](https://github.com/linebender/parley/blob/1df9544bf0bd675d304001c0d0b35df2d220cd14/README.md), [tracking issue #208](https://github.com/linebender/parley/issues/208).
3. **Confirmed fact:** Glyphon is a different, atlas-composition stack: it delegates shaping/layout/rasterization to `cosmic-text`, packs glyph images with `etagere`, then samples them in an existing wgpu render pass. Its current pinned source contains distinct mask and color atlases and an LRU/generation usage policy. Glyphon is therefore neither a shaper nor an editor; use of its re-exported cosmic-text editor remains caller-owned. [Glyphon README](https://github.com/grovesNL/glyphon/blob/49dc8f7bafa8091f4d71521fd62ee6f647b556f5/README.md), [Cargo manifest](https://github.com/grovesNL/glyphon/blob/49dc8f7bafa8091f4d71521fd62ee6f647b556f5/Cargo.toml), [usage-tracker commit](https://github.com/grovesNL/glyphon/commit/49dc8f7bafa8091f4d71521fd62ee6f647b556f5).
4. **Highly credible inference:** “WebGPU text quality” is not a property supplied by WebGPU. The standard specifies programmable GPU resources, command encoding, rasterization and blending, but no text shaping, fallback, glyph representation, hinting, or caret semantics. Quality follows the selected CPU/WASM text pipeline, font bytes, raster/path algorithm, compositing, and fixture/device validation. [WebGPU CRD](https://www.w3.org/TR/webgpu/), [Unicode bidi UAX #9](https://www.unicode.org/reports/tr9/), [OpenType 1.9.1](https://learn.microsoft.com/en-us/typography/opentype/spec/).
5. **Confirmed normative fact:** The CSS Font Loading API can construct `FontFace` from URL or binary data, is exposed in Window and Worker, and gives a worker an initially empty font source. [CSS Font Loading §2/§4](https://www.w3.org/TR/css-font-loading/). **Highly credible inference:** deterministic shaping by Crafty would require it to explicitly provision shaper-readable font bytes and deterministic identity/fallback inputs; the normative API does not itself prescribe that ownership architecture. This is an integration boundary, not a demonstrated blocker.

**Verdict:** **Deferred.** The evidence supports a concern-separated evaluation (input/editing, Unicode/shaping, layout/fallback, glyph realization, and GPU composition), not adoption of any one stack.

## Frame, plan, and method

### Sub-question tree and budget

| Branch | Depth budget | Result |
|---|---:|---|
| A. Linebender ownership: Vello → Parley → Fontique/HarfRust/Skrifa/ICU4X → Glifo/Peniko | 2 | Covered by pinned releases/source and an open tracking issue. |
| B. Atlas ownership: Glyphon → cosmic-text → swash/fontdb/HarfRust/Skrifa → wgpu | 2 | Covered by pinned source, crate docs, release notes and cache source commit. |
| C. Standards/browser limits: WebGPU, Unicode bidi, OpenType, CSS font loading | 2 | Covered by normative/official sources. |
| D. Maturity, licenses, representations, performance evidence and historical Piet | 2 | Covered; unsupported measurements are explicitly excluded. |

**Method and source quality.** I used upstream tagged source, Cargo metadata/docs, official standards, releases, and maintainer-maintained issue tracking. GitHub README/release claims are treated as first-party implementation documentation, not benchmark proof. Standards define constraints, not evidence that a library implements every feature. No source was copied; only functional descriptions are recorded.

### Responsibility diagram (not an architecture proposal)

```text
logical UTF-8 text + styles + locale/direction + font requests
       │
       ├─ Parley path:
       │    Fontique (enumerate/load/fallback) ─┐
       │    ICU4X (analysis/bidi/segments)      ├─ Parley layout + selection/edit utilities
       │    HarfRust (GSUB/GPOS shaping)        │        │ positioned glyph runs + line geometry
       │    Skrifa (font metrics/outlines/hint) ┘        ├─ Vello DrawGlyphs / glifo: glyph realization
       │                                                  └─ Vello/wgpu: vector/path GPU composition
       │
       └─ Glyphon path:
            fontdb + fallback / HarfRust / Skrifa / Unicode modules / swash
                  └─ cosmic-text Buffer/layout/editor + SwashCache
                         └─ Glyphon: raster images → mask/color atlas → quads in wgpu pass

peniko: portable vector brush/image/font-resource vocabulary used around Vello;
it is not a paragraph shaper, layout engine, or atlas text renderer.
wgpu/WebGPU: GPU device/resources/passes; neither owns text semantics.
```

## Findings with evidence

### A. Vello / Parley / fontations path

| Layer | Confirmed ownership and boundary | Status and evidence | Verdict |
|---|---|---|---|
| Vello | Receives font + glyph ids/positions through `DrawGlyphs`; draws them as part of its vector scene. Its 0.9.0 release exposes synthetic emboldening, brush transforms and upgraded Skrifa/peniko/wgpu dependencies. | **Current, alpha/0.x.** `v0.9.0` is commit `875f324f21da93019cae9e8e61d4abfd69893206`; API breaks have occurred across releases. [Changelog](https://github.com/linebender/vello/blob/875f324f21da93019cae9e8e61d4abfd69893206/CHANGELOG.md) | **Adapt:** renderer consumes resolved glyphs; **reject:** treating Vello as layout/shaping. |
| Parley | Rich-text layout, line breaking, bidi resolution and selection/edit utilities; its own README names Fontique/HarfRust/Skrifa/ICU4X as distinct dependencies. | **Current, 0.x.** `v0.10.0`, commit `1df9544bf0bd675d304001c0d0b35df2d220cd14`; release adds opt-in complex-script dictionary breaking. [README](https://github.com/linebender/parley/blob/1df9544bf0bd675d304001c0d0b35df2d220cd14/README.md), [release](https://github.com/linebender/parley/releases/tag/v0.10.0) | **Defer:** promising complete layout boundary, but evaluate missing features and API maturity. |
| Fontique | Enumerates/loads font data and chooses fallback runs; its web-font loading/unloading, unicode-range, incremental transfer and loading-state work remain explicitly tracked. | **Current but evolving.** [Parley stack description](https://github.com/linebender/parley/blob/1df9544bf0bd675d304001c0d0b35df2d220cd14/README.md), [open tracker](https://github.com/linebender/parley/issues/208) | **Adapt:** font resolution must be its own invalidation/state machine; **defer:** browser policy. |
| HarfRust | Rust HarfBuzz port used by Parley for shaping. This is a shaping boundary, not line breaking or fallback. | **Confirmed dependency role** in Parley’s tagged README. [README](https://github.com/linebender/parley/blob/1df9544bf0bd675d304001c0d0b35df2d220cd14/README.md) | **Adapt** the boundary, not a dependency decision. |
| Skrifa/fontations | OpenType parsing, metrics, variation coordinates and glyph outline scaling/hinting. Tagged README supports `glyf`, CFF/CFF2, COLR v0/v1; bitmap-table access is raw via `read-fonts`. It does not claim paragraph shaping/layout. | **Current.** Fontations pinned 2026-08-15 commit `565b4164ca58ab7b4f0e98223619948a3205c9a8`; Vello 0.9 pins Skrifa 0.42, while Fontations main reports 0.44. [Skrifa README](https://github.com/googlefonts/fontations/blob/565b4164ca58ab7b4f0e98223619948a3205c9a8/skrifa/README.md), [Vello release](https://github.com/linebender/vello/blob/875f324f21da93019cae9e8e61d4abfd69893206/CHANGELOG.md) | **Adapt:** retain font parsing/outline/raster concerns separately from shaping. |
| Glifo | Accepts positioned glyphs, paints decorations, and caches glyphs; it aims to share hinting instances/advances with a shaper. | **Experimental.** `glifo-v0.1.1` resolves to commit `66bb6c1095355f602be390e882378bca931d1b86`; README says rapid development. [README](https://github.com/linebender/vello/blob/66bb6c1095355f602be390e882378bca931d1b86/glifo/README.md), [tag object](https://api.github.com/repos/linebender/vello/git/tags/b42b0f1f3613f326bf9d35ac9728e31a644d182d) | **Defer:** evidence of an intended renderer-side cache boundary, not production readiness. |
| Peniko | Generic brushes, styles, image resources and owned shareable `FontData`; built over kurbo/color/resource-handle. | **Current vocabulary crate.** peniko 0.6.1, published 2026-07-13. [docs](https://docs.rs/peniko/0.6.1/peniko/) | **Reject** categorizing it as a text engine. |

**Text representation.** The tagged Parley Vello editor iterates positioned glyph runs, draws underline/strike separately, passes font size, variation coordinates and hinting into `vello::Scene::draw_glyphs`, and independently draws cursor/selection geometry. That is source-level evidence that editing geometry is produced above Vello, not by the GPU renderer. [editor source](https://github.com/linebender/parley/blob/1df9544bf0bd675d304001c0d0b35df2d220cd14/examples/vello_editor/src/text.rs). **Verdict: Adapt** the separation; **defer** whether its exact APIs fit a durable document.

**Color/bitmap/outline evidence.** Vello 0.9 upgrades Skrifa for VARC glyphs; prior Vello releases record fixes for bitmap emoji scaling, COLR emoji, and Apple color emoji. Glifo offers an optional PNG feature for bitmap glyphs. These are implementation facts for supported representation classes, not a claim of full OpenType color-font conformance or a browser-parity guarantee. [Vello changelog](https://github.com/linebender/vello/blob/875f324f21da93019cae9e8e61d4abfd69893206/CHANGELOG.md), [Glifo README](https://github.com/linebender/vello/blob/66bb6c1095355f602be390e882378bca931d1b86/glifo/README.md). **Verdict: Defer** feature-level validation against a controlled font corpus.

### B. glyphon / cosmic-text / swash path

| Layer | Confirmed ownership and boundary | Status and evidence | Verdict |
|---|---|---|---|
| cosmic-text | Owns a `FontSystem`, `Buffer` shaping/layout, optional Swash raster cache and editing abstractions. Documentation identifies HarfRust shaping, fontdb discovery, custom fallback/layout, Unicode bidi/linebreak/segmentation dependencies, and optional swash rasterization. | **Current.** 0.19.0 published 2026-04-22; source pinned 2026-08-08 commit `daae9c75d52322f8fb3af6168d76561540914e1f`. [0.18.2 API docs](https://docs.rs/cosmic-text/0.18.2/cosmic_text/), [tagged-source README](https://github.com/pop-os/cosmic-text/blob/daae9c75d52322f8fb3af6168d76561540914e1f/README.md), [0.19 release](https://github.com/pop-os/cosmic-text/releases/tag/0.19.0) | **Defer:** broad, coherent stack with an editor, but integration and policy must be tested. |
| swash | Low-level font introspection, complex shaping and glyph scaling/rasterization; deliberately excludes application layout and GPU composition. It documents GSUB/GPOS, variable fonts, cluster/source ranges, hinting, subpixel positioning, outlines and several color/bitmap formats. | **Current.** 0.2.10 source-head commit `7773843df0d63cd468db61a29c152b5e7a99d4ab`; cosmic-text 0.18.2 depends on swash 0.2.6. [README](https://github.com/dfrg/swash/blob/7773843df0d63cd468db61a29c152b5e7a99d4ab/README.md), [0.2.6 docs](https://docs.rs/swash/0.2.6/swash/) | **Adapt:** rasterization is separable from composition; **defer** version alignment. |
| Glyphon | wgpu middleware: cosmic-text output/rasterization → `etagere` atlas packing → sampled textured quads in an existing render pass. | **Current source, release cadence caveat.** Source commit `49dc8f7bafa8091f4d71521fd62ee6f647b556f5` declares 0.12.0/wgpu 30/cosmic-text 0.19; latest GitHub release remains 0.9.0 (2025-04), so release-versus-main must not be conflated. [README](https://github.com/grovesNL/glyphon/blob/49dc8f7bafa8091f4d71521fd62ee6f647b556f5/README.md), [manifest](https://github.com/grovesNL/glyphon/blob/49dc8f7bafa8091f4d71521fd62ee6f647b556f5/Cargo.toml), [release API](https://api.github.com/repos/grovesNL/glyphon/releases/latest) | **Defer:** demonstrated integration pattern, not automatically an appropriate renderer boundary. |
| Glyphon cache | Separate mask/color atlases; LRU cache; glyphs touched in the current generation are protected from eviction and `trim` advances the generation. Full-atlas failure is surfaced as `PrepareError::AtlasFull` in the inspected change. | **Confirmed source fact**, not a throughput measurement. [commit](https://github.com/grovesNL/glyphon/commit/49dc8f7bafa8091f4d71521fd62ee6f647b556f5) | **Adapt:** cache key/usage/eviction must be explicit; **reject:** treating cached images as document identity. |

**Editing geometry.** cosmic-text exposes `Cursor`, `LayoutCursor`, `Affinity`, `Editor`, and laid-out glyph/run types; its 0.19 release adds cursor-position/RTL helpers and a highlight fix. This substantiates editing-support availability, not browser IME/a11y integration or a complete design-editor editing contract. [API docs](https://docs.rs/cosmic-text/0.18.2/cosmic_text/), [0.19 release](https://github.com/pop-os/cosmic-text/releases/tag/0.19.0). **Verdict: Defer.**

### C. GPU strategies actually evidenced

| Strategy | Evidence in scope | What it does **not** prove | Verdict |
|---|---|---|---|
| Vector outlines / GPU path rendering | Vello consumes glyph ids/positions and its ecosystem uses Skrifa paths; Parley’s Vello editor uses Vello glyph drawing rather than a texture atlas. [editor source](https://github.com/linebender/parley/blob/1df9544bf0bd675d304001c0d0b35df2d220cd14/examples/vello_editor/src/text.rs) | Exact per-glyph internal Vello representation, its cache algorithm, or comparative quality/cost. | **Defer** until fixture measurements. |
| Alpha and color bitmap atlases | Glyphon documents atlas sampling and its source change names separate mask/color atlases; swash documents alpha/color bitmap and color-font realization. [Glyphon README](https://github.com/grovesNL/glyphon/blob/49dc8f7bafa8091f4d71521fd62ee6f647b556f5/README.md), [Swash README](https://github.com/dfrg/swash/blob/7773843df0d63cd468db61a29c152b5e7a99d4ab/README.md) | SDF/MSDF use, browser subpixel-LCD behavior, or atlas-size adequacy. | **Adapt** explicit mask/color separation as a research dimension. |
| SDF/MSDF | **Unknown / negative result:** no checked primary source says Vello, Parley, Glyphon, cosmic-text or swash uses SDF/MSDF as its ordinary glyph path. | Absence in checked sources is not proof a code path cannot exist. | **Reject** asserting SDF/MSDF as part of either traced stack. |
| Subpixel / antialiasing | Swash documents horizontal subpixel rendering/fractional positioning; Vello’s historical maintainer discussion said Vello lacked subpixel support at that time. The current Vello evidence checked here does not establish a changed LCD/subpixel contract. [Swash README](https://github.com/dfrg/swash/blob/7773843df0d63cd468db61a29c152b5e7a99d4ab/README.md), [Vello issue #452](https://github.com/linebender/vello/issues/452) | That any browser/platform will show identical subpixel AA; issue discussion is historical and not a current guarantee. | **Defer** and qualify native/browser separately. |

### D. Standards, determinism, WASM, maturity and history

**Unicode/OpenType requirements.** **Confirmed fact:** UAX #9 reorders logical text per paragraph after resolved embedding levels; it explicitly says combining marks attach to their preceding logical base even after reordering/shaping. OpenType 1.9.1 defines advanced-layout and variation tables. Therefore a renderer receiving glyph positions cannot reconstruct correct editing or fallback semantics from pixels/paths alone. [UAX #9 §3](https://www.unicode.org/reports/tr9/), [OpenType specification](https://learn.microsoft.com/en-us/typography/opentype/spec/). **Verdict: Adapt** logical-order and resolved-geometry as distinct artifacts.

**Browser/WASM constraints.** **Confirmed normative fact:** CSS Font Loading allows URL or binary `FontFace` construction, exposes `FontFace`/`FontFaceSet` to Window and Worker, and gives a worker an initially empty font source. `wgpu` 29 documents a wasm WebGPU backend and says WebGL/WebGPU objects cannot be shared between threads. [CSS Font Loading](https://www.w3.org/TR/css-font-loading/), [wgpu 29 docs](https://docs.rs/wgpu/29.0.0/wgpu/). **Highly credible inference:** deterministic shaping by Crafty would require it to explicitly provision shaper-readable font bytes and deterministic identity/fallback inputs. The normative browser APIs do not prove or prescribe that architecture. **Unknown:** exact browser support and policy for every browser/worker/build configuration was not tested. **Verdict: Defer** browser qualification to a real font-loading prototype and conformance corpus.

**Determinism.** **Highly credible inference:** deterministic layout is achievable only relative to pinned font bytes/version, Unicode data, feature/variation/language/direction inputs, algorithm versions, and declared fallback order. CSS itself specifies that generic-family mapping and matching can vary by platform and language; WebGPU notes rasterization/precision artifacts can be machine-specific. [CSS Fonts 4](https://www.w3.org/TR/css-fonts-4/), [WebGPU privacy considerations](https://www.w3.org/TR/webgpu/#privacy). **Verdict: Adapt** the input inventory; **defer** a determinism promise.

**Historical Piet.** **Confirmed fact:** Piet is a cross-platform 2D abstraction with backend-provided platform graphics/text and is explicitly in maintenance mode; it is not a modern Vello/wgpu text substrate. Its API still demonstrates that `Text`, `TextLayout`, hit testing and line metrics are distinct public concerns. [Piet README](https://github.com/linebender/piet/blob/main/README.md), [Piet 0.8 docs](https://docs.rs/piet/0.8.0/piet/). **Verdict: Adapt** the concern split only; **reject** Piet as the current path.

## Project, version, license, and maturity table

| Project | Pin examined (as of study date) | License | Scope / readiness reading |
|---|---|---|---|
| Vello | 0.9.0, `875f324f21da93019cae9e8e61d4abfd69893206` | Apache-2.0 OR MIT | Current alpha/0.x GPU vector renderer; text rendering capability, not full layout. |
| Glifo | 0.1.1, `66bb6c1095355f602be390e882378bca931d1b86` | Apache-2.0 OR MIT | Explicitly experimental glyph renderer/cache. |
| Parley | 0.10.0, `1df9544bf0bd675d304001c0d0b35df2d220cd14` | Apache-2.0 OR MIT | Active 0.x rich layout/edit utilities; documented open feature work. |
| Fontations/Skrifa | main `565b4164ca58ab7b4f0e98223619948a3205c9a8`; Vello pin 0.42, source main 0.44 | Apache-2.0 OR MIT | Active OpenType parsing/metrics/outlines, not paragraph layout. |
| Peniko | 0.6.1 (published 2026-07-13) | Apache-2.0 OR MIT | Styling/resource vocabulary, not text layout. |
| cosmic-text | source `daae9c75d52322f8fb3af6168d76561540914e1f`; released 0.19.0 | Apache-2.0 OR MIT | Active all-in-one text buffer/layout/edit/raster abstraction; its README retains several roadmap gaps. |
| Swash | source 0.2.10 `7773843df0d63cd468db61a29c152b5e7a99d4ab`; cosmic-text 0.18.2 uses 0.2.6 | Apache-2.0 OR MIT | Active low-level font/shaping/raster library; intentionally not composition/layout. |
| Glyphon | main `49dc8f7bafa8091f4d71521fd62ee6f647b556f5` declares 0.12.0; latest GitHub release 0.9.0 | MIT OR Apache-2.0 OR Zlib | Active source but release lag; wgpu atlas renderer, no editor ownership. |
| wgpu | 29.0.0 (published 2026-03-19) | Apache-2.0 OR MIT | Cross-platform GPU abstraction; text-agnostic. |
| Piet | 0.8.0 (published 2025-08-29) | Apache-2.0 OR MIT | Historical/maintenance-mode abstraction. |

All licenses above are source/package metadata claims checked at their cited upstream URLs. A later dependency/import decision still requires normal lockfile and license review; this research authorizes no import.

## Performance and cache evidence

There is **no transferable numeric performance result** in the checked sources. Vello and Glyphon document cache/resource mechanisms, Parley release notes identify a prior large-paragraph complexity regression, and cosmic-text describes an 8 MB/106,746-line edit test, but none supplies a common fixture, device/browser matrix, warm/cold font state, distributions, or a Crafty workload. [Parley releases](https://github.com/linebender/parley/releases), [cosmic-text README](https://github.com/pop-os/cosmic-text/blob/daae9c75d52322f8fb3af6168d76561540914e1f/README.md). **Verdict: Reject** using any of these as a Crafty budget.

Required later measurements: controlled Latin/Arabic/Indic/CJK/emoji fixtures; pinned font files and variation values; cold/warm byte and atlas states; typing/style/width/fallback mutations; layout, raster/upload, paint, memory, eviction and device-loss observations; environment and percentile distributions.

## Gaps, contradictions, and risks

| Gap / risk | Confidence | Consequence |
|---|---|---|
| No checked current source establishes Vello’s exact glyph cache/raster algorithm or full text conformance. | **Unknown** | Do not claim outline versus atlas internals beyond its positioned-glyph public boundary. |
| Glifo is explicitly experimental; Parley has tracked incomplete layout/bidi/editor work. | **Confirmed fact** | Treat examples and current APIs as evaluation candidates, not production guarantees. |
| Glyphon main says 0.12.0 but its latest GitHub release is 0.9.0. | **Confirmed fact** | Pin a commit or published crate deliberately; do not call main “released.” |
| CSS generic/system font mapping can vary by platform, language, user preferences and available fonts. | **Confirmed normative fact** | A browser-facing path cannot treat a generic/system-family name as a cross-platform byte identity. |
| Deterministic shaping by Crafty would require explicit provisioning of shaper-readable font bytes plus deterministic identity and fallback inputs. | **Highly credible inference** | Evaluate byte provisioning, fallback and licensing policy before making parity claims. |
| IME, accessibility tree, clipboard and browser selection adapter behavior are not proven by the Rust libraries. | **Unknown** | Keep platform input adapter outside text-layout claims. |
| SDF/MSDF has no supporting primary-source evidence in the traced stacks. | **Negative result** | Do not smuggle it into an option comparison. |
| Color/bitmap support varies by table/renderer/version. | **Confirmed fact** | Test COLR, bitmap and variation-color fixtures independently. |

## Recommendations for the later evaluator (not a selection)

1. **Adapt — high confidence:** score candidates on explicit ownership boundaries, not feature labels: platform input/IME; logical edits and offsets; font source/fallback; Unicode segmentation+bidi+shaping; line layout/hit geometry; glyph realization; GPU cache/composition. Evidence: both traced stacks split these differently.
2. **Adapt — highly credible inference:** make font byte identity, license/embedding policy, fallback order, variation coordinates, language/direction and feature settings first-class evaluation inputs. The standards establish browser font-loading/matching behavior; the need for Crafty to explicitly provision shaper-readable bytes for deterministic shaping is an inference, not a normative API requirement.
3. **Defer — high confidence:** production readiness of Parley/Glifo/Vello for a design editor until the open-feature list, WASM font path, complex editing corpus, color glyphs and device/browser test matrix are qualified.
4. **Reject — high confidence:** choosing an engine because it uses WebGPU, because a competitor appears high quality, or from an unqualified upstream performance anecdote.

## Audit trail and stop check

**Sources checked:** 22 primary/official sources: 13 upstream tagged/commit/release/docs sources (Vello, Glifo, Parley, Fontations/Skrifa, Glyphon, cosmic-text, Swash, Peniko, wgpu, Piet); 4 official standards (WebGPU, CSS Font Loading, CSS Fonts, UAX #9); 1 OpenType specification; 2 upstream issue trackers; 2 GitHub release/tag API records. No secondary source carries a material claim.

**SIFT/CRAAP notes:** standards are authoritative for normative API behavior and requirements, not library behavior or Crafty’s ownership architecture; pinned source/release manifests are authoritative for version/license/dependency boundaries; issues are only used for explicitly tracked incompleteness or dated maintainer discussion, never for performance. Vendor/library claims about “fast” or “high quality” were not converted into measurements.

**Sufficiency check:** every requested branch has supporting evidence or a named unknown; both mandated paths were independently traced; current versus historical/experimental classifications are explicit; performance claims were rejected as non-transferable. The second pass added the font-loading, release-lag, open-feature, and historical Piet clarifications rather than new architectural claims. The final remediation separates the confirmed CSS Font Loading API facts from the **highly credible inference** that deterministic Crafty shaping needs explicitly provisioned shaper-readable font bytes; further browser testing is needed to validate an implementation, not this source-scope classification. Saturation reached. **Blocker:** none.

## Promising leads not pursued

| Thread | Why off-frame now | Value / cost | One-line authorization plan |
|---|---|---|---|
| Compile/run a browser WASM text corpus for both paths | Requires a separate prototype, fonts and controlled browser/device matrix. | High / high | Build no-product-code harness with pinned fonts and record screenshots/geometry/distributions. |
| Source-level glyph representation teardown in current Vello/glifo | Would exceed the public-boundary question and needs a pinned clean-room code study. | Medium / medium | Trace only cache keys, glyph sources and resource lifetime at one tag. |
| Fontique WASM/webfont API qualification | Open tracker identifies it, but current behavior needs an executable corpus. | High / medium | Pin Parley/Fontique and test binary registration, removal, fallback and invalidation in wasm. |
| SDF/MSDF ecosystem comparison (e.g., alternative Rust renderers) | Not evidenced as part of either required stack. | Medium / medium | Separate landscape with source-verified representatives and quality fixtures. |
