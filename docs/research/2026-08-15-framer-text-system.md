# Framer dynamic text: public-evidence study

**Decision served:** establish what the current Framer website builder demonstrably does for dynamic text, and what is *not* safe to infer from it, before any future Crafty text-system decision. This is a competitive architecture study, **not** an implementation proposal.
**Research date:** 2026-08-15. **Scope:** public current product and clearly separated historical Motion material. **Clean-room note:** no Framer source was copied or inspected; only published documentation and Motion's public documentation/repository were read.

## Frame and revisable plan

**Effort tier: deep.** The question crosses durable content, browser layout, publishing, typography, localization, and historical naming; a feature checklist would be misleading.

| Sub-question / depth budget | Initial evidence path | Completion rule |
|---|---|---|
| 1. What is authored for text, styles, components, CMS and locales? (3) | Current Help + dated updates | Direct product documentation for each claim or mark unknown. |
| 2. What executes in editor, preview and published output? (3) | Developer render-target API and SSR documentation | Separate documented output from internal-architecture inference. |
| 3. How do sizing, fonts, layout, quality and performance behave? (3) | Font/fit-text documentation | State claimed behaviour, mechanism only where exposed. |
| 4. What is known about rich editing, bidi/RTL, import/export? (2) | Help/release docs | Explicitly name IME, caret, shaping and file-model gaps. |
| 5. Does “Framer Motion” or Framer X answer current-editor questions? (2) | Motion’s own docs/repo and Framer developer docs | Date/scope separation, no name-based transfer. |

**Loop 1 — search/read/synthesis.** Current official Help and release notes established styles, CMS, locales, fonts, RTL, semantic tags, variable/OpenType features and Fit Text. Gap found: editor/published parity and underlying web primitives.
**Loop 2 — deepen only that gap.** Framer developer documentation established canvas/preview/export render targets; Framer Help documents React/SSR HTML output and its font-delivery policy. Gap found: no public contract for editor text input or internal layout/shaping, and no retained direct output capture supporting implementation-level classification.
**Loop 3 — historical disambiguation.** Motion’s first-party docs/repository established that it is a separately consumable, renamed animation library; it does not document Framer’s text editor. No authoritative current Framer X text-model source was found in the allotted frame.

## Executive summary

1. **Current Framer is documented as a browser-web publishing system for text, not as a disclosed canvas text renderer.** Framer says published sites are React-built and server-pre-rendered to semantic HTML. The editor has a product-specific “Canvas” render target, but public documentation does not describe its text-rendering implementation. **Confirmed fact / highly credible inference.** [Framer SSR documentation](https://www.framer.com/help/articles/make-site-readable-by-ai-agents/); [RenderTarget reference](https://www.framer.com/developers/components-reference)
2. **The product model visibly separates reusable text styles, per-range styling, page breakpoints, CMS rich text, locale overrides and responsive layout.** Styles include font/size/weight/line-height/color; a text element can carry multiple styles; styles may vary by page breakpoint. Locale strings have fallback languages and are edited/previewed on canvas. **Confirmed fact.** [Text styles](https://www.framer.com/help/articles/how-to-use-text-styles/); [Locales](https://www.framer.com/help/articles/adding-a-new-locale/)
3. **Web-platform delivery is a material part of the documented capability.** Framer publicly describes CSS `font-display: swap`, size-adjusted fallbacks, unicode subset delivery, WOFF2 conversion, semantic headings, `lang`/`hreflang`, and server-rendered HTML. These sources do not support attributing published-site text delivery to an undocumented bespoke text engine. **Confirmed fact / highly credible inference.** [Font optimization](https://www.framer.com/help/articles/how-are-fonts-optimized-in-framer/); [semantic tags](https://www.framer.com/help/articles/text-styles-and-semantic-tags/); [language attributes](https://www.framer.com/help/articles/language-attribute/)
4. **There is a real context-boundary limitation:** text-style breakpoints do not automatically work inside components because components cannot access page-level breakpoints. This is stronger evidence than a general “responsive text” feature claim. **Confirmed fact.** [Component breakpoint limitation](https://www.framer.com/help/articles/why-aren-t-my-text-style-breakpoints-working-in-components/)
5. **Do not use Framer Motion as evidence of the current editor’s text architecture.** Motion (formerly Framer Motion) is a public React/JavaScript/Vue animation library; Framer exposes it to code components, while the current website builder separately documents canvas/preview/published render targets. It establishes an animation relationship, not text storage, shaping, editing, or renderer internals. **Confirmed fact / rejection of overreach.** [Motion docs](https://motion.dev/docs/react); [Motion repository](https://github.com/motiondivision/motion); [Framer API](https://www.framer.com/developers/components-reference)

## Findings and evidence

### 1. Current authored/dynamic content surface

| Area | Publicly evidenced behaviour | Evidence class and confidence | Verdict |
|---|---|---|---|
| Text layer and style reuse | A text style contains reusable font, size, weight, line height and color; it is globally reflected where applied. A layer defaults to no style. Authors can apply styles to a selected range, including multiple styles in one text element, and locally override a selected range’s color. | **Confirmed fact — high.** Official current Help. [Source](https://www.framer.com/help/articles/how-to-use-text-styles/) | **Adopted as evidence:** authored text and reusable style identity are distinct visible concepts. No internal data schema inferred. |
| Semantics | New styles are assigned `h1`–`h6`, `p`, or `span`; an instance can override the tag via Accessibility. | **Confirmed fact — high.** [Source](https://www.framer.com/help/articles/text-styles-and-semantic-tags/) | **Adapted lesson:** visual typography and output semantics are separate controls. |
| CMS/rich text | A CMS text layer can use a text style. CMS rich-text accepts Markdown then converts it to structured formatted content; documented blocks include headings, paragraphs, lists, tables, code blocks and blockquotes. CMS copy-out is Markdown, not an editable raw-Markdown mode. | **Confirmed fact — high.** [Styles + CMS](https://www.framer.com/help/articles/how-to-use-text-styles/); [CMS Markdown](https://www.framer.com/help/articles/using-markdown-in-the-cms/) | **Adopted as evidence:** dynamic content is structured rather than only a plain string. |
| CMS limitation | Formatted CMS text supports bold, but Framer documents no built-in per-bold-color control; its workarounds are paragraph style or custom CSS. | **Confirmed fact — high.** [Source](https://www.framer.com/help/articles/bold-text-color-cms-formatted-text/) | **Adopted as negative evidence:** rich-text run styling is not unlimited. |
| Localization | A locale is language plus optional region and optional fallback language. Framer lists project strings such as titles, descriptions, and alt text in a localization table, permits manual/AI translation, and supports in-canvas locale editing/preview. The 2023 announcement explicitly included plain and formatted text, CMS variables, images and a project-wide locale variable. | **Confirmed fact — high.** [Current Help](https://www.framer.com/help/articles/adding-a-new-locale/); [2023 release](https://www.framer.com/updates/localization) | **Adopted as evidence:** translated values are a contextual content dimension, not merely a post-publish service. |
| Text style breakpoints | A style can contain Desktop/Tablet/Mobile property values for size, line height, letter spacing and paragraph spacing. | **Confirmed fact — high.** [Source](https://www.framer.com/help/articles/how-to-use-text-styles/) | **Adapted lesson:** responsive style values can be associated with the reusable style. |
| Component boundary | Those text-style breakpoint values do *not* automatically function in a component, per Framer, because a component cannot access the page-level breakpoints. | **Confirmed fact — high.** [Source](https://www.framer.com/help/articles/why-aren-t-my-text-style-breakpoints-working-in-components/) | **Adopted as risk:** inherited responsive context must be explicitly specified; the product’s limitation is not evidence that the limitation is necessary. |

### 2. Browser/DOM responsibilities versus the editor canvas

**Published runtime.** Framer says sites are built with React and server-pre-rendered to HTML; non-JS crawlers receive complete text, headings, paragraphs, semantic HTML, metadata and structured data. It separately says a downloaded site is HTML, CSS, JavaScript and static assets. **Confirmed fact — high.** [SSR](https://www.framer.com/help/articles/make-site-readable-by-ai-agents/); [portability](https://www.framer.com/help/articles/porting-your-data-from-framer/)

**Editor/canvas.** Code Components are documented to render on the Canvas, Preview and published site. `RenderTarget` distinguishes `canvas`, `export`, `thumbnail`, and `preview`/live site; animated components are advised to be static on Canvas and Export to avoid canvas-performance and export-tiling problems. **Confirmed fact — high.** [Components introduction](https://www.framer.com/developers/components-introduction); [RenderTarget](https://www.framer.com/developers/components-reference)

**Bounded inference.** These sources establish multiple rendering contexts and runtime output, but not whether regular editable text in the editor is DOM, canvas, a hybrid overlay, or another renderer. Claiming “Framer’s editor text is DOM” or “Framer renders editor text on canvas” would exceed the evidence. **Highly credible inference / unknown implementation.** [RenderTarget](https://www.framer.com/developers/components-reference)

**Verdict: adopted as boundary evidence.** Framer demonstrates that publishing-quality text can delegate layout, shaping, accessibility and fallback to the browser, while the editor can still expose a Canvas context. It does not disclose a transferable editor-renderer architecture.

### 3. Intrinsic sizing, layout, and responsive type

* **Fit Text (May 2023):** Framer documents a Fit size on a text layer, multi-line hard breaks, min/max ranges set on the text or an ancestor, custom-web-font/icon/emoji support, and says it can select the right size before JavaScript runs without resize calculations. The last statement is a vendor performance claim; the output mechanism is not specified. **Confirmed feature / vendor claim for mechanism — high/medium.** [Source](https://www.framer.com/updates/fit-text)
* **Text effects (July 2024):** Framer can animate characters, words, lines and elements with appearance/layer-in-view/section-in-view triggers. This proves a runtime can segment text for effects; it does not reveal its grapheme, script, bidi, or line-breaking policy. **Confirmed feature; implementation unknown — high.** [Source](https://www.framer.com/updates/text-effects)
* **Variable fonts (November 2024) and OpenType (January 2025):** the font picker exposes font-dependent variable properties (examples: width/weight/slant), supports animation via component variants/interactions, and offers Google-font OpenType controls including stylistic sets, character variants and ligatures. **Confirmed fact — high.** [Variable-font release](https://www.framer.com/updates/variable-fonts); [OpenType release](https://www.framer.com/updates/opentype-google-fonts)
* **RTL (October 2025):** with Reverse layout, stacks and grids flip for RTL locales; authors can use a layout-direction variable for layout/style/component properties. This is layout-direction support, not published evidence of the Unicode Bidirectional Algorithm, cursor movement, or mixed-direction text editing. **Confirmed fact / bounded unknown — high.** [Release](https://www.framer.com/updates/right-to-left-layout-direction); [current guide](https://www.framer.com/help/articles/rtl-best-practices/)

**Verdict: adapted lesson.** “Responsive text” is a composition of sizing policy, available width, font features, layout context and locale—not simply a font-size property. Framer’s public API also demonstrates that a page-level breakpoint model and a component-level model can diverge.

### 4. Fonts, fallback, quality, and performance

| Documented mechanism or claim | Evidence and limit | Verdict |
|---|---|---|
| Font sources | Framer lists Google Fonts, Fontshare, uploaded custom fonts, open-source fonts and Framer alternatives (Inter/Inter Display). Custom fonts can be used by project text layers; Figma-imported text may fall back to Framer’s default if its custom font is unavailable. | **Confirmed fact — high.** [Font optimization](https://www.framer.com/help/articles/how-are-fonts-optimized-in-framer/); [custom fonts/import caveat](https://www.framer.com/help/articles/how-to-add-custom-fonts/) **Verdict: adopted as risk evidence:** font identity/availability affects fidelity at import time. |
| Fallback policy | Framer documents Auto/Always/Never font-loading modes. Auto selectively uses `font-display: swap` for 300–800 and qualifying Google/Fontshare serif/sans faces; it says it computes CSS such as `size-adjust` to reduce layout shift. | **Confirmed fact — high for the stated policy; vendor claim — medium for the effectiveness.** [Source](https://www.framer.com/help/articles/how-are-fonts-optimized-in-framer/) **Verdict: adapted lesson:** fallback policy is a user-visible quality/performance choice, not an incidental loader detail. |
| Delivery optimization | Framer says Google and its alternatives receive alphabet subsets selected by browser `unicode-range` demand, and uploaded fonts after November 2023 are converted to WOFF2. This is a documented delivery policy, not retained direct evidence of any particular site’s emitted resources or savings. | **Confirmed fact — high for the stated policy; vendor claim — medium for effectiveness.** [Docs](https://www.framer.com/help/articles/how-are-fonts-optimized-in-framer/) **Verdict: adopted as evidence:** language coverage and loading behavior meet in font-resource selection. |
| Rendering-quality measurements | No Framer primary source found here publishes text pixel-comparison methodology, glyph-atlas strategy, shaping engine, fallback face list, font-load CLS distribution, canvas quality comparison, or per-frame text benchmarks. | **Unknown — high confidence that the public evidence is absent within this study.** [Font docs are limited to described policy](https://www.framer.com/help/articles/how-are-fonts-optimized-in-framer/) **Verdict: deferred:** no numerical quality/performance conclusion is supportable. |

### 5. Components, publishing parity, and export/import

* **Code components:** React 18-compatible components render directly in Canvas, Preview and published sites; they have visual property controls and auto-sizing. Framer exposes all Motion for React to such components. **Confirmed fact — high.** [Components](https://www.framer.com/developers/components-introduction); [API](https://www.framer.com/developers/components-reference)
* **Overrides:** are React higher-order components applied to a canvas layer but active only in Preview/published sites. This is an explicit editor/runtime divergence surface, not parity. **Confirmed fact — high.** [Overrides](https://www.framer.com/developers/overrides-introduction)
* **Publishing:** site publication has preview/staging/production workflow; output is standard web files and CMS can be exported through plugins as CSV or JSON. **Confirmed fact — high.** [Publishing](https://www.framer.com/help/articles/publishing-your-framer-website/); [portability](https://www.framer.com/help/articles/porting-your-data-from-framer/)
* **Text interchange:** CMS rich text has Markdown paste/copy semantics. The research found no official evidence that it is an export/import format for the complete Framer document, styles, locale overrides, component state, or layout behavior. **Confirmed fact / unknown scope — high.** [CMS Markdown](https://www.framer.com/help/articles/using-markdown-in-the-cms/)

**Verdict: adopted as risk evidence.** A product can provide shared render targets while still deliberately allow runtime-only code and export-specific static rendering. “Canvas/preview/published” must not be treated as an unconditional parity guarantee.

### 6. Editing semantics, bidi, and historical products

| Question | Result | Verdict |
|---|---|---|
| In-canvas ordinary text editing | Public Help demonstrates that authors double-click a text layer to replace text and can range-select styling, but does not specify transactions, selection anchoring, undo coalescing, clipboard fidelity or concurrent edits. **Confirmed surface / unknown semantics.** [Editing help](https://www.framer.com/help/articles/just-bought-a-template-what-s-next/); [range styling](https://www.framer.com/help/articles/how-to-use-text-styles/) | **Deferred:** no internal edit model may be inferred. |
| IME/composition, dead keys, emoji grapheme navigation, bidi caret/selection | No primary Framer documentation found in scope that specifies these behaviours or gives a test matrix. RTL documentation covers layout reversal; it is not an IME or bidi-editing contract. **Unknown.** [RTL guide](https://www.framer.com/help/articles/rtl-best-practices/) | **Deferred:** these remain necessary verification topics, not capabilities proven by localization. |
| Shaping/line break/feature precedence | Framer supports OpenType and variable font controls, but does not identify a shaping engine, OpenType precedence order, fallback selection, hyphenation, line-break algorithm, or editor-vs-published matching contract. **Unknown.** [Variable fonts](https://www.framer.com/updates/variable-fonts); [OpenType](https://www.framer.com/updates/opentype-google-fonts) | **Deferred.** |
| Framer Motion | Current Motion is explicitly “previously Framer Motion,” offers React/JS/Vue animation, browser APIs plus JS fallback, layout animation and animated DOM/SVG elements. It is useful evidence about runtime animation only. **Confirmed fact.** [Motion docs](https://motion.dev/docs/react); [repository](https://github.com/motiondivision/motion) | **Rejected as text-architecture evidence.** |
| Framer X | No authoritative, current primary source was located within the budget that connects Framer X’s historic product implementation to current Framer text. Its name must not be used as a surrogate source for present behavior. **Unknown.** | **Rejected as evidence pending a dated primary source.** |

## Comparison matrix: documented responsibility split

This is a Framer-only matrix, not a claim about Crafty and not a statement of Framer internals.

| Concern | Current editor Canvas | Preview/published web runtime | Export / portability | Evidence note |
|---|---|---|---|---|
| Text authoring/style selection | Exposed: layer/range styles; locale can be edited on Canvas | Resolved text appears in web page | CMS Markdown copy/paste; CMS export via plugins | Public docs prove surface, not storage. [Styles](https://www.framer.com/help/articles/how-to-use-text-styles/) · [Locales](https://www.framer.com/help/articles/adding-a-new-locale/) · [CMS](https://www.framer.com/help/articles/using-markdown-in-the-cms/) |
| Layout and sizing | Canvas target exists; ordinary text renderer unspecified | Browser HTML/CSS path; Fit Text claims correct pre-JS sizing | Export target distinct; animated components should be static there | Contexts are explicit, parity is not. [Render targets](https://www.framer.com/developers/components-reference) · [Fit Text](https://www.framer.com/updates/fit-text) |
| Fonts and shaping | Unspecified | Documented browser font-loading/fallback policy | Downloaded site has web assets | Browser delivery is documented for the published path; emitted resources and editor implementation are unverified. [Font docs](https://www.framer.com/help/articles/how-are-fonts-optimized-in-framer/) |
| Semantics/accessibility | Author chooses style/tag | SSR semantic HTML and automatic `lang`/`hreflang` | HTML/CSS/JS/assets downloadable | Strong published-web proof. [SSR](https://www.framer.com/help/articles/make-site-readable-by-ai-agents/) · [language](https://www.framer.com/help/articles/language-attribute/) |
| Runtime custom behavior | Code component may render on Canvas | Overrides active only Preview/published | Export can force static | A documented controlled divergence. [Overrides](https://www.framer.com/developers/overrides-introduction) |

## Gaps, contradictions, and unknowns

* **No disclosed current editor text engine.** Public API calls the editor context “Canvas,” but gives no architecture for standard text. This is a gap, not proof of canvas text.
* **No editing correctness contract.** IME, composition events, selection/caret/bidi navigation, undo grouping, copy/paste rich text, spellcheck, accessibility of editor text, and collaboration semantics are not documented in checked sources.
* **No published renderer-quality benchmark.** Claims such as “blazing fast,” “no expensive calculations,” or reduced layout shift are vendor claims lacking a disclosed fixture, browser matrix, measurements, or distribution. They must not be compared numerically with another product.
* **Feature interaction remains unknown.** The public material does not state how Fit Text, text effects segmentation, OpenType feature settings, variable axes, locale fallback, and dynamic CMS strings interact when they change line breaks.
* **A documented contradiction/limitation:** text styles can have page breakpoints, while the same breakpoints do not automatically apply within components. This is a real context limitation, not a documentation inconsistency. [Styles](https://www.framer.com/help/articles/how-to-use-text-styles/) · [component limitation](https://www.framer.com/help/articles/why-aren-t-my-text-style-breakpoints-working-in-components/)
* **Terminology risk:** Framer’s current product, historical Framer X, Framer Motion, and current Motion share history/names but are not interchangeable evidence sources. [Motion’s rename](https://github.com/motiondivision/motion)

## Evidence-grounded recommendations (no implementation prescription)

| Recommendation for the named decision | Confidence | Verdict and rationale |
|---|---|---|
| Treat Framer as evidence for a *web-publishing* text capability set—structured rich content, reusable styles, responsive/locale context, and web delivery—not as evidence for a particular editor text renderer. | **High** | **Adopted.** Direct sources establish the former and leave the latter unknown. |
| Keep component-responsive context as a first-class research risk. Framer’s own documented page/component breakpoint boundary is a concrete warning against assuming a reusable component automatically sees page responsiveness. | **High** | **Adapted.** The lesson is the boundary/risk, not Framer’s limitation as a solution. |
| Treat fonts as assets plus delivery/fallback policy, and avoid using appearance before the intended font loads as a fidelity oracle. | **High** | **Adapted.** Framer explicitly exposes swap policy, matching, subsets and import substitution. |
| Do not transfer conclusions from Motion/Framer Motion or unverified Framer X material to current Framer editable text. | **High** | **Rejected.** They do not document the required subsystem. |
| Before any architecture decision based on Framer, obtain reproducible black-box evidence for IME, bidi caret behavior, dynamic-content relayout, text-effect segmentation, and canvas/preview/published parity. | **High** | **Deferred pending verification.** Public documentation is insufficient for these claims. |

## Source quality and audit trail

All substantive sources were read directly. They are primary vendor documentation or first-party Motion materials; no secondary source or unretained live-output capture is used for a material claim.

| ID | Source | Type / SIFT-CRAAP assessment | Used for |
|---|---|---|---|
| S1 | [Framer Help: Using text styles](https://www.framer.com/help/articles/how-to-use-text-styles/) | Official current product docs; high authority/relevance; vendor purpose but procedural claims are directly testable. | Style, rich ranges, CMS, breakpoints. |
| S2 | [Framer Help: font optimization](https://www.framer.com/help/articles/how-are-fonts-optimized-in-framer/) | Official current docs; high authority; performance effectiveness treated as vendor claim. | Font sources, swap/size-adjust, subsets, WOFF2. |
| S3 | [Framer Help: agent-readable sites](https://www.framer.com/help/articles/make-site-readable-by-ai-agents/) | Official current docs; high authority. | React, SSR, semantic HTML. |
| S4 | [Framer Developers: components](https://www.framer.com/developers/components-introduction) and [reference](https://www.framer.com/developers/components-reference) | Official API docs; high authority. | Render targets, auto sizing, Motion availability. |
| S5 | [Framer Developers: overrides](https://www.framer.com/developers/overrides-introduction) | Official API docs; high authority. | Preview/runtime-only divergence. |
| S6 | [Framer Help: locales](https://www.framer.com/help/articles/adding-a-new-locale/) and [2023 localization release](https://www.framer.com/updates/localization) | Official current + dated release. | Locale model and historical introduction. |
| S7 | [Framer Help: RTL](https://www.framer.com/help/articles/rtl-best-practices/) and [2025 RTL release](https://www.framer.com/updates/right-to-left-layout-direction) | Official docs/release; high authority. | Layout-direction scope. |
| S8 | [Fit Text release](https://www.framer.com/updates/fit-text), [Text Effects release](https://www.framer.com/updates/text-effects), [Variable Fonts release](https://www.framer.com/updates/variable-fonts), [OpenType release](https://www.framer.com/updates/opentype-google-fonts) | Official dated product announcements; high authority for availability/date, vendor claims labeled. | Feature timeline and exposed controls. |
| S9 | [Semantic tags](https://www.framer.com/help/articles/text-styles-and-semantic-tags/), [language](https://www.framer.com/help/articles/language-attribute/) | Official current docs. | Output semantic/accessibility evidence. |
| S10 | [CMS Markdown](https://www.framer.com/help/articles/using-markdown-in-the-cms/), [portability](https://www.framer.com/help/articles/porting-your-data-from-framer/) | Official current docs. | Content/file interchange scope. |
| S11 | [Motion docs](https://motion.dev/docs/react), [Motion repo](https://github.com/motiondivision/motion) | First-party docs/repository (MIT); used only for scope/history, no source imported. | Distinguish Motion from Framer text architecture. |

### Sufficiency / stop check

* **Coverage:** every requested branch has direct evidence or is explicitly marked unknown.
* **Triangulation:** no retained direct published-output capture supports an implementation-level claim. Web-runtime and font-delivery findings are therefore limited to Framer’s official documentation, with vendor policy/effectiveness distinctions stated; most product features are necessarily single-vendor primary-source claims and are marked as such.
* **Saturation:** the second and third passes added context boundaries and historical disambiguation, but no source disclosed the editor text engine or IME contract. Further general web searching would likely add marketing, not primary evidence.
* **Stop decision:** stop at scope/budget. Further verification is needed only if the caller needs editor input or exact layout-parity claims.

## Promising leads not pursued

| Thread | Why off-frame / not pursued | Estimated value/cost | One-line authorization plan |
|---|---|---|---|
| Authenticated editor black-box probes (IME, Arabic/Hebrew mixed text, cursor, copy/paste, undo) | Requires an account/UI operation and a documented test protocol; public research cannot establish it. | Very high / medium | Obtain authorized test project; mutate one factor per case and record editor/preview/published deltas. |
| Per-site emitted CSS for Fit Text/effects | Arbitrary public pages may not exercise every feature; broad template crawling is weak evidence without controlled fixtures. | High / medium | Publish controlled Framer fixtures for each feature and inspect SSR HTML/CSS before/after resize. |
| Archived Framer X release/doc archaeology | Historical only and no authoritative source surfaced during bounded search; low relevance to current product. | Low / high | Authorize a date-bounded archive study with each claim tied to a contemporaneous Framer source. |
| Accessibility-tree/screen-reader comparison across Canvas, Preview and published | Valuable for a visual editor but needs interactive browser/screen-reader instrumentation. | High / high | Define one text fixture and capture DOM/accessibility trees for all render targets. |
