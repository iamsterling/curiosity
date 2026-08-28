# Competitive text systems — comparative evidence synthesis

**Date:** 2026-08-15
**Decision served:** consolidate seven competitor studies into an evidence base for
later Crafty text decisions. This report does **not** select a text engine,
architecture, schema, protocol, renderer, or parity target.

## Evidence frame

This synthesis compares the dated studies of
[Figma](2026-08-15-figma-text-system.md),
[Sketch](2026-08-15-sketch-text-system.md),
[Penpot](2026-08-15-penpot-text-system.md),
[Framer](2026-08-15-framer-text-system.md),
[Canva](2026-08-15-canva-text-system.md),
[Illustrator](2026-08-15-illustrator-text-system.md), and
[Affinity Designer](2026-08-15-affinity-designer-text-system.md). Each report was
read directly. All seven exist and frame facts, vendor claims, bounded inference,
unknowns, dates/versions, and source quality. Their confidence labels are retained
below; repetition across reports does not raise confidence.

**Version boundaries matter.** Figma, Framer and Canva were studied through
current public product/API documentation on the study date; no retained Framer
output capture independently verifies emitted implementation details. Sketch
combines current 2026 product/API documentation with the public format pinned at
official `sketch-hq/sketch-document` commit
`4493900abbfa49ae82fbcb8ad85cccf2cc2256b0` (`@sketch-hq/sketch-file-format`
6.5.0), whose older vocabulary is retained.
Penpot distinguishes shipped 2.17.0 from pinned upstream `develop` at commit
`59ef076`. Illustrator has one directly inspected developer page; its retained
Help findings are reproducible search extracts, not inspected pages, and include
explicitly scoped web-Beta evidence. Affinity's detailed evidence is for legacy
Designer 2; the post-Canva “all-new Affinity” text relationship is unknown.

**Evidence classes used here:**

- **Implementation fact:** directly disclosed source, schema, emitted output, or
  implementation documentation.
- **Product/API fact:** directly documented behavior or public interface; it does
  not establish internal storage or mechanism.
- **Vendor claim:** first-party statement whose effectiveness was not independently
  measured.
- **Bounded inference:** narrow consequence of facts, not promoted to a fact.
- **Unknown:** no checked evidence supports a conclusion. Absence of disclosure is
  never treated as feature absence.

## Normalized terminology

| Synthesis term | Meaning | Competitor vocabulary that maps here |
|---|---|---|
| **Logical content** | Durable character/string content before shaping | Figma `characters`; Sketch attributed-string string; Penpot text leaves; Canva plaintext/rich text; Framer text/CMS content |
| **Inline range** | Contiguous logical-text interval carrying character-level intent | Figma styled segment/range; Sketch string attribute; Canva formatted region; Penpot leaf; Affinity selected character range (behavior only) |
| **Paragraph/block** | Structural scope for alignment, direction, lists, spacing, or composition | Penpot paragraph; Canva paragraph formatting; Framer CMS block; Sketch paragraph style; Illustrator extract-only composer labels; Affinity paragraph controls |
| **Container policy** | How text relates to available geometry and overflow | Figma auto-resize modes; Sketch Fit/Fixed/Relative; Penpot `grow-type`; Framer Fit Text; Illustrator extract-only point/frame/path descriptions; Affinity artistic/frame/shape/path |
| **Resolved layout** | Font-dependent lines, glyph positions, bounds, carets, and overflow | Sketch `glyphBounds`; Penpot `position-data`/Skia paragraphs; otherwise mostly undisclosed derived output |
| **Font request** | Authored identity, face, variation, feature, or service reference | family/style tuples; Sketch descriptor; Canva `fontRef`; typography/style references |
| **Font resolution** | Availability, matching, fallback, substitution, byte provisioning, and licensing | Figma load precondition; Sketch embedding/replacement; Penpot font provisioning; Framer documented web-font delivery; Canva service-owned refs; Affinity missing-font workflow |
| **Editing adapter** | Platform surface receiving keyboard, clipboard, IME, or accessibility input | Directly evidenced only for Penpot V3 (`contenteditable` capture); undisclosed for the other editors |
| **Interchange fidelity** | How much logical content, intent, font state, and geometry survives a boundary | Native format, SDK, Markdown/RTF, PDF/SVG, static export, or third-party importer evidence; never implied by “export succeeds” |

This normalization is intentionally lossy only at the vocabulary level. It does
not claim that a Figma segment, Sketch persisted range, Penpot leaf, and Canva SDK
region have identical identity, indexing, persistence, or merge semantics.

## Comparative matrix

Cells state the strongest safe conclusion and its limit. “Undisclosed” means the
report found no suitable evidence, not that the product lacks the capability.

| System | Document model | Shaping / layout | Font policy | Editing / IME / bidi | Rendering | Dynamic / layout behavior | Performance / invalidation | Interchange | Disclosure confidence |
|---|---|---|---|---|---|---|---|---|---|
| **Figma** | **API fact:** raw text, numeric ranges, effective styled segments, linked styles and variables; private persistence unknown. | **Vendor policy fact:** Figma owns typography decisions and documents product-specific line boxes; shaper, breaker and index units undisclosed. | **API/product fact:** edits are font-load-gated; missing fonts explicit; local/cloud sources documented. Noto-only fallback is a single historical 2020 claim, not current exhaustive policy. | Range editing is exposed; caret, grapheme, bidi, IME, accessibility and collaboration granularity unknown. | **Implementation fact, non-text-specific:** shared C++ Wasm/native renderer and WebGPU/WebGL rollout; glyph representation/raster/cache unknown. | Fixed box, fixed-width/auto-height, and auto-size policy exposed; line algorithm unknown. | Generic GPU batching/reuse disclosed; no text benchmark or text invalidation graph. | Plugin read/write surface is rich; private format and PDF/SVG/HTML fidelity unknown. | High for API and stated line policy; low for proprietary text internals. [Report](2026-08-15-figma-text-system.md) |
| **Sketch** | **Pinned format fact (`4493900…`, format 6.5.0):** persisted attributed string plus ranged attributes, text behavior, line-spacing behavior and `glyphBounds`; offset unit unknown. | Product/API exposes metrics and features; exact engine and current-to-historical sizing mapping unknown. Apple vocabulary is **not** proof of Core Text/TextKit delegation. | **Pinned format/current-product fact:** missing-font lockout/replacement, preview, font references/data, licensed embedding, variable-axis bounds and closest-weight behavior. | Basic edit entry and rich paste documented; IME, grapheme, bidi caret, accessibility and undo semantics unknown. | Text raster/cache/AA route undisclosed; outline slowdown is qualitative only. | Current Fit/Fixed/Relative and stack interaction; pinned historical schema uses different three-mode terms; mapping unresolved. | No text benchmark or invalidation lifecycle; `glyphBounds` cannot safely be called a cache. | Public ZIP/JSON schema pinned at format package 6.5.0 and current versioning docs are strong; newer-to-older saves can lose data. Export fidelity and range units remain unknown. | High for the pinned public schema/API/product behavior; low for runtime architecture. [Report](2026-08-15-sketch-text-system.md) |
| **Penpot** | **Source fact:** nested root→paragraph-set→paragraph→leaf content, scoped styles, persistent grow mode, derived legacy `position-data`. | **Source fact:** opt-in V3 uses Skia Paragraph in Rust/WASM; legacy DOM/SVG and V2 paths coexist. | Browser provisions bytes; Skia provider/collection and named Noto/emoji fallback are source-visible; exact language selection and all cache eviction unknown. | **Source fact:** browser `contenteditable` captures input/composition; Rust owns content mutation, selection/caret and overlays. UTF-16 conversion and partial RTL handling visible; known non-grapheme and navigation limitations. | **Source fact:** V3 Skia paints text and editing overlays; SVG/DOM route remains selectable. | Auto width/height/fixed layout is source-visible; font readiness gates measurement; migration is incomplete. | **Source fact:** content/layout versions, paragraph/extents caches, explicit clears, width keys and 40 ms resize debounce. No transferable benchmark. | Native ZIP+JSON v3 and migrations documented; shipped fallback-font export clipping defect fixed in 2.17 but not independently retested. | Highest implementation confidence, but **transitional** and version-gated; MPL-2.0 source cannot be imported without review. [Report](2026-08-15-penpot-text-system.md) |
| **Framer** | **Documented product fact:** reusable/range styles, CMS structured rich text, locales and breakpoint-dependent values; storage schema unknown. | **Documented published-runtime claim / bounded inference:** Framer says sites are server-pre-rendered to semantic HTML, making browser layout/shaping the safe published-path inference. No retained output capture verifies emitted HTML/CSS/font details; ordinary editor Canvas mechanism is undisclosed. | Web-font sources, WOFF2 conversion, `font-display`, size-adjusted fallback and unicode subsets are vendor-documented policies; effectiveness and emitted resources are unverified, and editor matching is unknown. | Basic canvas text edit/range styling is documented; IME, bidi caret, grapheme, undo and collaboration semantics unknown. RTL evidence concerns layout reversal, not bidi editing. | Semantic SSR HTML and downloadable web files are vendor-documented; editor renderer unknown. Canvas/preview/export targets explicitly diverge for some documented code behavior. | Fit Text, locale content, text effects, responsive style values; component cannot automatically access page breakpoints. | Vendor claims pre-JS sizing and reduced shift; no disclosed fixture, distribution or text benchmark. | Downloadable HTML/CSS/JS/assets and CMS Markdown/CSV/JSON surfaces are documented; no whole-document rich-text fidelity contract or retained output inspection. | High for documented product/web-delivery claims; low for emitted implementation details and editor internals. Framer Motion is rejected as text evidence. [Report](2026-08-15-framer-text-system.md) |
| **Canva** | **SDK fact:** whole plaintext or numeric-range rich text inside positioned containers; inline and paragraph domains; canonical storage unknown. | Controls are exposed but shaper, breaker, measurement, effects and overflow policy undisclosed. | Opaque backend `fontRef` plus enumerated face capabilities; Apps cannot access font files. Fallback, variation and matching policy unknown; licensing limits portability. | SDK ranges and commit sessions exposed; index units, IME, bidi, direction, caret and first-party live-edit model unknown. | GPU/Canvas/SVG/glyph route and editor/export parity undisclosed. | Preview tagged template fields/autofill exist; success does not guarantee fit, reflow, overflow handling, or field-level diagnostics. | Presence transport has narrow metrics, explicitly not text evidence. No text cache/invalidation benchmark. | Static export formats exposed; editable text/font preservation unknown. SDK content sessions are not evidence of internal collaboration operations. | Medium/high for SDK boundary; very low for proprietary internals. Current docs contradict on line-height and Preview APIs are unstable. [Report](2026-08-15-canva-text-system.md) |
| **Illustrator** | **Direct developer fact:** Illustrator exposes editable-text APIs. **Extract-only vendor claims:** point/frame/path/vertical text and Character-panel controls; canonical schema, run boundaries, styles surface and desktop parity are unknown. | **Extract-only vendor claim:** 2023 Help search text names Middle Eastern/South Asian single-line and every-line composers and script support; algorithm, current desktop behavior, Unicode pin and shaper are unknown. | Illustrator variable-font UI, local/Adobe Fonts, missing-font workflow and substitution policy are **unknown** in the remediated evidence. Standards establish portability risks only. | Editable text is directly documented; mixed-script support is extract-only. Range units, caret affinity, IME, normalization and undo are unknown. | Anti-aliasing choices are extract-only; engine, raster, GPU, workers and caches are undisclosed. | Point/frame/vertical and path overflow/control descriptions are extract-only, with web-Beta evidence not proving desktop parity; threading, conversion and persistence remain unknown. | No official text performance or invalidation evidence; extract-only anti-aliasing controls are not architecture evidence. | Import/export extensibility is directly documented; PDF/SVG live-text, font embedding/subsetting, variations and outlining conditions unknown. | Low-to-medium for bounded product claims because most Help evidence is extract-only; low for object model/runtime/export internals. Standards and an Adobe patent are not product evidence. [Report](2026-08-15-illustrator-text-system.md) |
| **Affinity Designer** | **Product fact (legacy V2):** artistic, frame, shape and path text, local ranges and hierarchical styles; native schema unknown. | Controls demonstrate layout needs; shaper, bidi, breaker, measurement and exact path algorithm undisclosed. | Missing-font alert/system substitution, variable axes and OpenType controls documented; identity, fallback order, embedding and cross-platform determinism unknown. | Caret/range selection, overwrite and RTF/TXT paste documented; IME, grapheme, bidi, accessibility and undo unknown. | Raster/atlas/cache route undisclosed; post-Canva text architecture also unknown. | Reflow versus scale, fit, overflow and path reflow are distinct behavior; current-product continuity is unverified. | No credible text benchmark or cache/invalidation disclosure. | RTF/TXT and PDF variable-font staticization documented; native schema absent; third-party importer is partial evidence only. | High for legacy V2 help behavior; low for internals and current “all-new Affinity.” [Report](2026-08-15-affinity-designer-text-system.md) |

## Convergent capability expectations

These are **observed recurring problem dimensions**, not invented Crafty parity
requirements.

1. **Logical content and typographic intent outlive a rendering result.** Figma's
   public ranges, Sketch's persisted attributed string, Penpot's source-visible
   tree, and Canva's SDK regions directly evidence content plus scoped intent.
   Adobe's directly inspected developer page describes editable Illustrator text,
   while Affinity behavior independently requires live editable text rather than
   flattened outlines. The safe convergence is the separation
   problem—not one shared run schema. [Figma §1](2026-08-15-figma-text-system.md#1-authored-text-runs-styles-and-layout-modes),
   [Sketch §1](2026-08-15-sketch-text-system.md#1-durable-text-and-attributed-string-model),
   [Penpot A](2026-08-15-penpot-text-system.md#a-persistent-model-and-styles),
   [Canva §1](2026-08-15-canva-text-system.md#1-public-text-model-and-web-editing-boundary);
   primary contracts: [Figma `TextNode`](https://www.figma.com/plugin-docs/api/TextNode/),
   [Sketch attributed-string schema at `4493900…`](https://raw.githubusercontent.com/sketch-hq/sketch-document/4493900abbfa49ae82fbcb8ad85cccf2cc2256b0/packages/file-format/schema/objects/attributed-string.schema.yaml),
   [Penpot pinned text schema](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/shape/text.cljc),
   [Canva Richtext API](https://www.canva.dev/docs/apps/api/latest/design-create-richtext-range/).
2. **Character and paragraph scopes are materially different.** This distinction
   is explicit in Sketch's pinned schema, Penpot's source partition, Canva's API,
   and Affinity controls. Illustrator contributes only extract-only composer and
   character-control descriptions, not a directly inspected paragraph/run model.
   Exact cascade, inheritance and range normalization remain product-specific.
3. **Container policy is authored behavior, not merely measured bounds.** Across
   products, intrinsic/fit, constrained/wrapped, point/artistic, frame/area,
   shape/path, and overflow behaviors recur. The taxonomies do not map one-to-one:
   Sketch itself has unresolved current-versus-historical terminology, while
   Canva's SDK cannot author a predefined text height. No universal enum follows.
4. **Font state is broader than a family name.** Availability, face/weight,
   variation coordinates, loaded bytes or service references, fallback,
   substitution, embedding/delivery, version identity and licensing all affect
   editability or fidelity. Direct examples include Figma's load precondition,
   Sketch's licensed embedding and edit lockout, Penpot's font-ready measurement,
   Framer's documented web-delivery policy, Canva's opaque non-portable refs, and
   Affinity's explicit substitution alert.
   [Sketch report](2026-08-15-sketch-text-system.md#4-fonts-fallbacksubstitution-embedding-variableopentype-typography);
   primary examples: [Figma font policy](https://help.figma.com/hc/en-us/articles/360039956894-Add-and-manage-fonts),
   [Sketch Fonts](https://www.sketch.com/docs/interface-and-settings/document-settings/fonts/),
   [Framer font delivery](https://www.framer.com/help/articles/how-are-fonts-optimized-in-framer/),
   [Canva Fonts API](https://www.canva.dev/docs/apps/api/latest/asset-find-fonts/).
5. **Dynamic content causes layout work.** Component overrides, locales, CMS,
   template autofill, responsive styles, variable-font changes, and path/frame
   edits can alter lines and bounds. Framer's component-breakpoint limitation and
   Canva's autofill-without-geometry-guarantee are concrete evidence that context
   and replacement success do not imply correct layout.
   [Framer report](2026-08-15-framer-text-system.md#1-current-authoreddynamic-content-surface),
   [Framer primary limitation](https://www.framer.com/help/articles/why-aren-t-my-text-style-breakpoints-working-in-components/),
   [Canva report](2026-08-15-canva-text-system.md#5-dynamic-data-templates-and-replacement-semantics),
   [Canva Autofill contract](https://www.canva.dev/docs/apps/api/preview/design-autofill-design/).
6. **Interchange has multiple fidelity levels.** Every study separates successful
   import/export from editable text preservation and pixel equivalence. Sketch's
   public format gives the strongest structured contract; Penpot exposes native
   data and a real export/font regression; Affinity's third-party importer exposes
   partial projection; Canva lists export formats without fidelity rules, while
   Illustrator directly documents only extensible import/export and leaves its
   PDF/SVG text-fidelity policy unknown.
   [Sketch report](2026-08-15-sketch-text-system.md#6-file-format-and-interchange-evolution),
   [Penpot report](2026-08-15-penpot-text-system.md#d-collaboration-components-importexport-and-migration);
   primary examples: [Sketch versioning](https://developer.sketch.com/file-format/versioning),
   [Penpot export defect #10208](https://github.com/penpot/penpot/issues/10208),
   [Canva export API](https://www.canva.dev/docs/apps/api/latest/design-request-export/).
7. **IME, bidi caret behavior, grapheme editing and accessibility are disclosure
   blind spots.** Only Penpot provides a source trace of composition forwarding,
   offset conversion and editor-owned caret/selection—and that trace also exposes
   current limitations. Product support for localization, RTL layout, OpenType, or
   mixed-script rendering must not be promoted into an editing-correctness claim.
   [Penpot report](2026-08-15-penpot-text-system.md#b-editing-model-and-ime),
   [composition adapter](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/shapes/text/v3_editor.cljs),
   [Unicode bidi standard used only as context](https://www.unicode.org/reports/tr9/).
8. **No competitor supplies a transferable numeric text-performance target.**
   Penpot supplies cache/invalidation mechanisms but no benchmark; other reports
   contain generic renderer claims, qualitative warnings, or unrelated presence
   metrics. Numeric comparison would be fabricated.
   [Figma evidence limit](2026-08-15-figma-text-system.md#4-rendering-quality-caches-and-invalidation),
   [Canva benchmark caveat](2026-08-15-canva-text-system.md#6-collaboration-conflict-and-performance-evidence),
   [Penpot invalidation summary](2026-08-15-penpot-text-system.md#c-layout-renderer-fonts-and-caches).

## Materially different architectural approaches

### 1. Evidenced custom layout/edit path: Penpot, transitional

Penpot is the only report with source-level evidence of a named current text path:
browser input/IME capture feeding Rust/WASM editor state and Skia Paragraph layout,
paint, caret and selection. It also retains legacy DOM/SVG and V2 paths behind
separate gates. The lesson is not “choose Skia”; it is that separating native input
capture from deterministic geometry is feasible **and** that a multi-pipeline
migration creates duplicate measurement, font-timing and correctness surfaces.
[Primary source links and version pin](2026-08-15-penpot-text-system.md#source-audit-trail)

### 2. Framer's documented web-publishing path

Framer documents sites as server-pre-rendered semantic HTML and downloadable web
files, and separately documents its web-font delivery policy. Browser layout,
shaping, accessibility and fallback are therefore a bounded inference for the
published path, not an independently observed implementation result. No retained
output capture verifies emitted HTML/CSS/font resources. This evidence says
nothing about the ordinary editor Canvas, whose text implementation remains
proprietary and undisclosed. [Framer responsibility split](2026-08-15-framer-text-system.md#comparison-matrix-documented-responsibility-split)

### 3. Proprietary stack with policy/API disclosure: Figma

Figma states that it owns formerly platform-dependent typography decisions for
cross-platform consistency and discloses a shared C++ renderer, but does not name
its shaper, breaker, glyph representation, editor adapter, or cache topology. This
is evidence against *complete* OS-policy delegation, not evidence for a specific
custom text engine. [Figma §§2–4](2026-08-15-figma-text-system.md#2-fonts-fallback-opentype-and-measurement)

### 4. Proprietary stacks with behavior or extension contracts only

Sketch's Apple-like terms do not prove Core Text/TextKit usage. Canva exposes an
SDK facade and service-owned font references, not its editor internals. Illustrator
has direct evidence only for editable-text extensibility; its Help-based container,
formatting and composer claims are extract-only. Affinity exposes legacy desktop
typography and container behavior but no engine or schema. These four must stay in
the “undisclosed” runtime class; grouping them does not imply they share an
architecture or evidence strength.

## Contradictions and confidence boundaries that must remain visible

| Conflict or tension | What remains true | What must not be averaged away |
|---|---|---|
| Canva guide says apps cannot set line height; current generated API exposes `lineHeightEm`. | The primary docs conflict. | Do not convert this into an unqualified support checkmark; context/host availability needs clarification. |
| Sketch current Fit/Fixed/Relative versus historical Flexible/Fixed/FixedWidthAndHeight. | Both vocabularies are directly documented. | Exact mapping and runtime semantics remain unknown. |
| Penpot guide claims automatic RTL detection; traced source chiefly shows explicit direction and Skia calls. | Direction support and some RTL caret logic are evidenced. | Detection algorithm and full bidi correctness remain unverified. |
| Penpot “WASM text” versus retained SVG/V2/V3 gates. | V3 is real source-backed implementation. | It is not a completed universal replacement or necessarily shipped default. |
| Figma's 2020 Noto-only fallback statement versus current unknown policy. | It is valid historical first-party evidence. | It is not a fresh exhaustive chain/version contract. |
| Framer Canvas, preview, export, and published targets. | Multiple targets and vendor-documented semantic web output are evidenced; no retained emitted-output capture exists. | Shared target names do not guarantee ordinary-text parity; some code behavior explicitly diverges, and emitted implementation details remain unverified. |
| Affinity Designer 2 help versus “all-new Affinity.” | Legacy V2 behavior is well documented. | Continuity into the current post-Canva product is unknown. |
| Illustrator web Beta point/frame evidence versus desktop. | A reproducible official search extract describes web-Beta point/frame behavior. | It is extract-only, not an inspected-page fact or desktop parity proof. |

## Proven implementation facts versus observed product behavior

**Implementation-level facts available:** Penpot's pinned source path, caches and
feature gates; Sketch's public persisted interchange schema pinned at commit
`4493900abbfa49ae82fbcb8ad85cccf2cc2256b0` / format package 6.5.0 (not runtime);
and Figma's generic renderer implementation (not its text route). Framer has
vendor documentation for its published-web contract and font-delivery policy, but
no retained output capture supporting an emitted-implementation classification.
These evidence different layers and are not interchangeable.

**Product/API behavior only:** most Figma typography, Sketch editor behavior,
Framer authoring and documented publishing behavior, Canva SDK, Affinity findings,
and Illustrator's directly inspected developer claims. Illustrator Help claims
are a still-lower extract-only vendor-evidence class. Such evidence can identify
user-visible problems and boundary conditions, but cannot select a shaper, line
breaker, offset representation, cache, raster strategy, threading model, or
canonical schema.

**Standards evidence:** Unicode, OpenType, SVG, CSS Fonts, and Apple text documents
in the source reports define external constraints or available platform behavior.
They are not evidence that a competitor conforms to or uses a particular stack.
Likewise, Adobe's patent and Affinity's third-party importer do not establish a
shipping implementation.

## Lessons and constraints applicable to later Crafty decisions

These are research dispositions, not an architecture choice.

| Evidence-backed lesson | Confidence | Verdict for later consideration |
|---|---|---|
| Keep authored logical content/intent distinguishable from resolved glyph geometry and ephemeral editing state. | High: direct format/source/API evidence from multiple independent products; exact representations differ. | **Adapt** the separation as a constraint; **defer** its Crafty representation. |
| Specify range/selection offset units and every conversion boundary. | High: all public numeric-range contracts omit units except Penpot's traced UTF-16 conversion boundary, where non-grapheme limitations are visible. | **Adapt** as a correctness question; no unit selected. |
| Treat font resolution, byte readiness, fallback/substitution, variation, licensing and export embedding as separate states. | High for problem existence; product policies differ. | **Adapt** the decomposition; **reject** copying any one vendor policy as universal. |
| Treat container/path/fit behavior and dynamic context as explicit layout inputs rather than inferred geometry. | High for visible behavior; no common taxonomy or algorithm. | **Adapt** the evaluation dimensions; **defer** semantics and parity scope. |
| Preserve diagnostics for missing, substituted, stale, or unavailable font resources. | High product evidence from Figma, Sketch and Affinity; Penpot export defect shows consequence. | **Adapt** as a failure-mode requirement candidate; no workflow selected. |
| Keep input/IME capture, logical editing, layout, paint and interchange as separately testable concerns. | High as a boundary model; only Penpot discloses one composition. | **Adapt** the test decomposition; **defer** ownership placement. |
| Evaluate output fidelity as logical/editable/pixel-equivalent levels, per format and feature. | High across all reports. | **Adapt** as a research and test rubric; **reject** binary “export works.” |
| Do not select engines, caches, glyph representations, or budgets from competitor appearance or generic renderer posts. | High confidence negative result. | **Reject** architectural inference; **defer** to independent evidence and measurement. |
| Avoid concurrent legacy/new text paths unless migration evidence justifies their compatibility cost. | High for Penpot's documented transition; transferability is contextual. | **Adapt** as migration risk, not a blanket prohibition. |

## Evidence gaps and proposed future probes

No probe below is authorized by this synthesis. They are diagnostics for a later,
separately scoped black-box or standards study.

1. **Shared complex-text editing corpus:** emoji ZWJ, combining marks, Indic
   clusters, Thai/Lao boundaries, Arabic/Hebrew/Latin/digits with isolates, dead
   keys, CJK IMEs, cancellation, replacement, selection affinity, word/line moves,
   deletion, copy/paste, undo and accessibility exposure. Record logical content,
   visual selection/caret and composition state by platform; do not infer internals.
2. **Range-unit probes:** insert/split/style around non-BMP, combining and ZWJ
   sequences through each documented API/format; determine byte/code-unit/scalar/
   grapheme behavior without assuming that API units equal storage units.
3. **Font identity and absence matrix:** same family with different versions,
   static/variable duplicates, absent style, absent glyph, locale fallback, color
   emoji and licensing-restricted fonts. Record diagnostics, geometry changes,
   save/reopen effects and editor/export divergence.
4. **Dynamic relayout matrix:** mutate content, width, locale, breakpoint/component
   context, variation axis, OpenType features, path geometry and template fields;
   compare overflow, bounds and line changes. This directly targets Framer's
   context boundary and Canva's unspecified Autofill geometry.
5. **Interchange ladder:** controlled native/PDF/SVG/HTML/RTF/Markdown samples,
   one property changed per fixture; inspect logical text, run/paragraph intent,
   fonts/variations/features, path/container semantics and pixels independently.
6. **Version/platform qualification:** pin Sketch document/app versions, Penpot
   release flags, Illustrator desktop/web, Affinity V2/current, and macOS/Windows/
   browser versions before making compatibility claims.
7. **Performance/invalidation evidence:** only after a representative fixture and
   environment exist, measure edit-to-layout and layout-to-paint distributions,
   cold/warm font states, affected-scope recomputation, memory and export. Do not
   reuse Canva pointer metrics, Figma generic-renderer claims, or outline warnings.

## Pre-commitment criteria for using this research later

A future text architecture proposal should not cite competitor evidence as support
unless all applicable checks are true:

- the claim links to a dated report and its primary citation;
- product/API behavior is not presented as an implementation fact;
- browser/OS delegation, proprietary-undisclosed behavior, and evidenced custom
  engines remain distinct;
- current, historical, transitional, Beta and Preview qualifications survive;
- contradictions above remain explicit;
- a parity claim has a controlled behavioral fixture, not feature-name similarity;
- an engine/cache/raster/performance choice has independent technical evidence and
  project measurements, not competitor appearance;
- licensing gates remain intact, especially Penpot MPL source, Canva font assets,
  and proprietary file formats.

**Revisit triggers:** a competitor publishes a versioned text schema or engine
disclosure; Penpot V3 becomes the shipped/default sole path; current Affinity text
documentation supersedes V2; Canva resolves the line-height conflict or stabilizes
Preview APIs; a controlled cross-product corpus is completed; or Crafty frames a
specific text decision whose alternatives require deeper evidence.

## Non-goals and conclusion

This report does not recommend a Crafty text engine, choose Rust versus TypeScript,
define a document schema or renderer packet, prescribe glyph rasterization, create
an OpenSpec change, or declare competitor parity requirements.

The robust comparative conclusion is narrower: mature products converge on the
need to preserve editable logical content and scoped typography while resolving
font-dependent layout under explicit container and dynamic context. They diverge
substantially in delivery context and disclosed implementation. Penpot evidences a
transitional browser-input/custom-Skia path; Framer documents a browser-native
published-web contract without retained emitted-output verification; Figma
discloses policy ownership but not its text mechanism; the
remaining proprietary products expose behavior, APIs or formats without enough
runtime evidence to transfer an architecture. The most consequential gaps—offset
units, IME/bidi/grapheme behavior, fallback identity, invalidation and interchange
fidelity—remain test questions, not inferred answers.
