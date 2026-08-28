# Adobe Illustrator dynamic text: public-evidence study

**Date:** 2026-08-15
**Decision served:** establish what can safely be learned from Illustrator's public text behaviour and interfaces before a separate text-system decision. This is a clean-room competitive study, not a design or implementation proposal.

## Executive summary

Adobe official search extracts describe point text, bounded text frames, horizontal/vertical tools, and type-on-a-path controls including alignment, spacing, baseline shift, movement/flip, and overflow. **Extract-only vendor claim (not direct-page inspected; reproducibility record in source table).** — [Adobe: Create type on a path](https://helpx.adobe.com/illustrator/using/creating-type-path.html); [Adobe: Illustrator on the web, Add text](https://helpx.adobe.com/uk/illustrator/web/add-and-edit-artwork/create-text/add-text.html).

Official search extracts describe character-formatting controls and Middle Eastern/South Asian Single-line and Every-line composer labels. **Extract-only vendor claim (not direct-page inspected; reproducibility record in source table).** They do **not** disclose a canonical text-object schema, exact run-boundary rules, shaping-library identity, thread model, cache topology, or exporter-fidelity contract. **Unknown beyond the recorded extracts.** — [Adobe: Character panel](https://helpx.adobe.com/illustrator/desktop/design-with-text/edit-format-text/character-panel-overview.html); [Adobe: Asian scripts](https://helpx.adobe.com/illustrator/using/asian-scripts.html).

The defensible competitive lesson is that logical Unicode text, derived font-dependent layout, and editing positions cannot be treated as one thing. This is a **highly credible inference** from public behaviour and Unicode/OpenType, not a disclosed Illustrator architecture. **Verdict: adapted as a research constraint; no solution selected.**

## Frame, sub-question tree, and revisable plan

**Effort tier:** deep primary-source study. Depth budgets: A–E/G 3; F/H/I 2.

| Branch | Question | Evidence plan |
|---|---|---|
| A | Point/area/path and vertical models | Adobe Help and public API surface |
| B | Attributes, paragraphs, styles | Adobe UI/help |
| C | Composition, scripts, bidi, editing | Adobe composers + Unicode |
| D | OpenType, variations, font absence | Adobe font docs + OpenType |
| E | Measurement/layout | Adobe docs + SVG/OpenType |
| F | Rendering/performance/threading | Official disclosures; record negative results |
| G | PDF/SVG fidelity and compatibility | Adobe + SVG/PDF-format capability |
| H | SDK/file-format facts | Official Adobe developer/SDK material only |
| I | Patents | Attributable disclosures only; never infer shipping |

**Revision after remediation pass:** direct retrieval of every cited Adobe Help URL timed out on 2026-08-15. Help-supported observations are therefore individually labelled **extract-only**, with exact search extract, query, URL, and date preserved in the source table; unpreserved-extract claims (styles panels, variable fonts, local-font preview, and the newer composer page) were removed. Standards coverage distinguishes format capability from Illustrator exporter guarantees. SDK and performance remain negative results.

## Findings with evidence

### A. Text modes and visible editing semantics

| Observation | Evidence / confidence | Verdict |
|---|---|---|
| A web-Beta Help search extract says selecting adds point text, dragging creates a text frame, and horizontal/vertical text can be added. | **Extract-only vendor claim; not direct-page inspected.** [Adobe web Add text](https://helpx.adobe.com/uk/illustrator/web/add-and-edit-artwork/create-text/add-text.html). It is not desktop-parity proof. | **Adapted:** if independently verified, point and constrained-area modes are distinct user concepts. |
| A Help search extract says type-on-path accepts a path/shape outline and supports movement/flip, alignment, spacing, baseline shift, and overflow. | **Extract-only vendor claim; not direct-page inspected.** [Adobe type-on-path help](https://helpx.adobe.com/illustrator/using/creating-type-path.html). | **Adapted:** if independently verified, path text has attachment, path-relative placement and overflow semantics; it is not merely rotated glyphs. |
| Text stays editable as a product object: Adobe says its API can “select, manipulate, edit and enhance text.” | **Confirmed fact.** [Adobe Developer—Illustrator](https://developer.adobe.com/illustrator/). | **Adopted observation:** live text is not only rendered paths. |
| Current desktop point↔area conversion, threaded-text topology, and overset persistence were not confirmed with an inspected Adobe source. | **Unknown.** | **Deferred:** verification target, not a fact. |

### B. Character formatting, paragraphs, and styles

An Adobe Help search extract lists leading, tracking, pair kerning, vertical scale, and anti-aliasing choices in the Character panel. **Extract-only vendor claim; not direct-page inspected.** — [Adobe Character panel](https://helpx.adobe.com/illustrator/desktop/design-with-text/edit-format-text/character-panel-overview.html). It suggests user-visible formatting dimensions but does not establish storage records or script-uniform applicability. The previously cited styles-panel claim was removed because its official extract was not preserved.

**Highly credible inference:** editable mixed-format text needs a relationship between logical ranges and effective character/paragraph properties because selected portions can receive character controls and paragraphs can choose composers. It does not follow that Illustrator stores a particular run format. **Verdict: adapted as problem statement; implementation deferred.**

### C. Composition, Unicode, bidi, vertical and complex scripts

An Adobe Help search extract for the 2023 Asian-scripts page says Illustrator supports Indic, Middle Eastern, and South East Asian languages; it says the Middle Eastern and South Asian Composer provides correct word shaping for many non-Western scripts and lists Middle Eastern & South Asian Single-line and Every-line Composer. **Extract-only vendor claim; not direct-page inspected.** — [Adobe: 2023 Asian scripts](https://helpx.adobe.com/illustrator/using/asian-scripts.html). The newer composer-page claim was removed because its official extract was not preserved.

“Every-line” supports only the narrow conclusion that Illustrator exposes a paragraph-level alternative to a single-line composer. Its optimization objective, dictionaries/hyphenation, penalty model, incremental recomposition scope, and relation to InDesign are **unknown**. Do not infer an internal “Adobe Paragraph Composer.”

* Unicode bidi preserves logical storage order while deriving per-paragraph display order; it distinguishes bidi from shaping. **Confirmed fact (standard, not Illustrator implementation).** [UAX #9](https://www.unicode.org/reports/tr9/)
* Grapheme clusters approximate user-perceived characters, while caret placement also needs font/layout information for ligatures and complex scripts. **Confirmed fact (standard).** [UAX #29](https://www.unicode.org/reports/tr29/)
* SVG text specifies complex-script shaping, bidi, horizontal/vertical writing, baselines, font positioning/substitution, and path layout. **Confirmed fact (standard).** [SVG 2 Text](https://www.w3.org/TR/SVG2/text.html)

**Competitor lesson (highly credible inference):** logical text, visual glyph placement, and editing positions need conceptual separation; otherwise bidi, ligatures and cluster-safe selection conflict. **Verdict: adapted as a constraint; no engine/API chosen.**

### D. OpenType, variable fonts, fallback and missing fonts

The direct Help pages formerly supporting Illustrator variable-font UI, Momochidori, local/Adobe Fonts, and hover preview timed out, and their exact extracts were not preserved. **Unknown in this remediation report.**

OpenType explains that a variable font's `fvar` axis space may alter outlines, font/glyph metrics, anchors, GPOS/JSTF positioning, baselines and colour-glyph data. **Confirmed fact (standard, not a claim that Illustrator exposes every table).** [OpenType Font Variations](https://learn.microsoft.com/en-us/typography/opentype/spec/otvaroverview).

Missing-font workflows, substitution order, retained identity/version, and platform differences are **unknown**.

CSS Fonts independently shows the portability problem: family matching is prioritized and may operate per character/cluster; platform installed fonts differ. **Confirmed fact (standard, not Illustrator behaviour).** [CSS Fonts 4 matching](https://www.w3.org/TR/css-fonts-4/#font-matching-algorithm). **Verdict: adapted risk—font availability must not be mistaken for layout fidelity.**

### E. Measurement and layout

No inspected Adobe source specifies a public measurement API, bounds contract, rounding regime, line-break algorithm, or incremental-layout invalidation. **Unknown.** The extract-only Character and type-on-path descriptions make metric-affecting controls and path overflow plausible product behaviour, but neither establishes measurement semantics.

SVG places glyphs by advances plus kerning/spacing, derives line boxes from font metrics, and recognizes distinct baselines; variable-font data can modify metrics and positioning. **Confirmed fact (standards).** [SVG text metrics](https://www.w3.org/TR/SVG2/text.html#GlyphsMetrics); [OpenType variations](https://learn.microsoft.com/en-us/typography/opentype/spec/otvaroverview). **Verdict: deferred.** Exact compatibility needs font-versioned direct-behaviour fixtures, not documentation.

### F. Rendering, performance, threading

An Adobe Help search extract lists anti-aliasing choices None, Sharp, Crisp, and Strong. **Extract-only vendor claim; not direct-page inspected.** — [Adobe Character panel](https://helpx.adobe.com/illustrator/desktop/design-with-text/edit-format-text/character-panel-overview.html).

No inspected official source discloses shaping engine, glyph atlas/rasterizer, GPU representation, workers, locks, incremental recomposition, benchmarks, or latency budgets. **Unknown. Verdict: rejected as performance-architecture evidence.** Do not treat a UI anti-aliasing menu or marketing as a threading claim.

### G. PDF/SVG interchange and fidelity

Adobe says extensions can import/export custom file formats. **Confirmed fact** — [Adobe Developer—Illustrator](https://developer.adobe.com/illustrator/). Inspected material does not specify whether a particular Illustrator PDF/SVG export retains live text, embeds/subsets fonts, serializes variation coordinates, preserves all OpenType features, or outlines under defined conditions. **Unknown.**

SVG 2 can represent text, nested `tspan` styling/positioning and `textPath`; it includes CSS-derived font/feature/writing-mode/direction properties and notes that correct rendering can require the authoring font. **Confirmed fact (format capability, not an Illustrator export guarantee).** [SVG 2 Text](https://www.w3.org/TR/SVG2/text.html).

**Highly credible inference:** “successful export,” editable export, and pixel-equivalent export are different claims. **Verdict: adapted as interchange-test risk; no export design implied.**

### H–I. SDK/file-format facts and patents

* **Current official developer fact (direct-page inspected):** Adobe advertises C++ plug-ins plus JavaScript/AppleScript/VBScript automation and editable-text API access. **Confirmed fact.** [Adobe Developer—Illustrator](https://developer.adobe.com/illustrator/)
* **SDK/file-format limit:** no current official reference defining `TextFrame`, `TextRange`, `CharacterAttributes`, `ParagraphAttributes`, range index units, or `.ai` text serialization was retrieved. Those names occur in legacy/community material but are intentionally not relied on. **Unknown pending official SDK archive.**
* **Patent result:** Adobe's [US9696818B2, “Bidirectional text selection”](https://patents.google.com/patent/US9696818B2/en) discloses generic logical/visual-index selection. **Confirmed fact about the patent; unknown for Illustrator. Verdict: rejected as product-architecture evidence.**

## Behaviour/claim matrix

| Dimension | Public evidence | Not disclosed | Confidence / verdict |
|---|---|---|---|
| Text modes | Extract-only descriptions of point/frame/path, vertical tools, path controls | Object graph, threads, conversion persistence | Extract-only / **adapted pending direct verification** |
| Formatting | Extract-only Character-panel controls | Run encoding, style cascade | Extract-only / **deferred** |
| Composer | Extract-only 2023 ME/SA single/every-line labels | Algorithm, dictionaries, objective | Extract-only / **no internal inference** |
| International | Extract-only description of Indic, Middle Eastern, and South East Asian language support; web-Beta vertical text | Unicode version, script matrix, platform divergence | Extract-only / **verify** |
| Variable fonts | OpenType variable-font capability (standard) | Illustrator UI, arbitrary-axis/export retention | Illustrator evidence unknown / **deferred** |
| Fonts | CSS portability risk (standard) | Illustrator local/Adobe Fonts and substitution/identity/version rules | Illustrator evidence unknown / **risk unknown** |
| Measurement | Extract-only descriptions of metric-affecting controls and path overflow | Bounds/rounding/caret geometry | Unknown / **no benchmark claim** |
| Export | Extensible import/export; SVG can represent text | Illustrator fidelity/outline/embed policy | Partial / **test, do not assume** |
| Performance | Extract-only anti-aliasing control | Engine/workers/caches/benchmarks | Unknown / **rejected template** |

## Historical distinctions and contradictions

1. **Current versus historical:** only a 2023-page search extract was retained; it does not prove older-release defaults or current desktop behaviour.
2. **Desktop versus web:** point/frame wording is from a web-Beta search extract; it does not establish desktop feature parity.
3. **Standards versus product:** Unicode/SVG/OpenType establish constraints and format capability, never Illustrator's private engine or exact export.
4. **Patent versus shipped product:** an Adobe patent proves an attributable disclosure, not product use.

## Gaps and verification needed

* Current desktop object model and private `.ai`/PDF-compatible text data.
* Composer scope/algorithm, text-range indexing, caret affinity, IME, normalization and undo granularity.
* Missing-font substitution/persistence and macOS/Windows differences.
* OpenType feature/custom-axis/colour-font coverage and PDF/SVG font/variation/outline policy.
* Bounds rounding, path-offset rules and cross-target fidelity.
* Performance/cache/threading. No benchmark was found; none is invented.

Further verification is needed only before claiming compatibility/fidelity. It should use official SDK archives and controlled black-box samples, one changed property at a time, reopened and exported on both platforms under applicable terms. That work is outside this documentary study.

## Competitor lessons and risks (not a solution)

| Observation | Lesson/risk | Verdict |
|---|---|---|
| Extract-only sources describe three authoring modes. | “Text” may hide different containment and overflow semantics; direct verification is needed. | **Adapted pending verification** |
| An extract-only source lists alternate composers. | Composition policy may be user-visible quality behaviour, not an incidental draw call. | **Adapted pending verification** |
| Unicode/OpenType separate text, shaping, bidi and metrics. | Code points, glyphs and cursor stops are not interchangeable. | **Adopted** as research finding |
| Variable fonts can change metrics. | A coordinate change can invalidate more than paint. | **Adapted** |
| Private performance design is undisclosed. | Incumbent behaviour is not evidence for workers/caches. | **Rejected** as template |
| SVG text depends on font/feature support. | Editable and pixel-equivalent export differ. | **Adapted** |

## Source quality and audit trail

Adobe Developer was directly inspected. Every retained Adobe Help claim is based only on the individually preserved official search extract below: direct retrieval of each Help URL timed out on 2026-08-15. These extracts are reproducible leads, not inspected primary-page evidence and not confirmed implementation facts. Adobe is vendor-authored and never treated as a benchmark. Unicode, SVG, OpenType and CSS Fonts are primary standards for their claims. The patent is primary only for its disclosure; no source supports an unpublished implementation inference.

| # | Source | Quality / use |
|---|---|---|
| 1 | [Adobe Developer](https://developer.adobe.com/illustrator/) | Primary vendor developer page; public extensibility/editability |
| 2 | [Type on a path](https://helpx.adobe.com/illustrator/using/creating-type-path.html) | **Extract-only; direct page timed out.** Retrieved 2026-08-15. Query: `site:helpx.adobe.com/illustrator/using/creating-type-path.html Illustrator type on a path flip align spacing baseline shift overflow`. Exact extract: “Use the Type on a Path tool to add text to any path or shape outline, move or flip text, and add effects to it. You can also adjust the alignment of the text and spacing between the characters to modify the appearance. ... If your text cannot fit along your path, you can see at the bottom of the bounding area. You can resize the type area to display the overflow text. ... To move text across a path without changing the direction of the type, use the Baseline Shift option in the Character panel.” |
| 3 | [Web Add text](https://helpx.adobe.com/uk/illustrator/web/add-and-edit-artwork/create-text/add-text.html) | **Extract-only; direct page timed out.** Retrieved 2026-08-15. Query: `site:helpx.adobe.com/uk/illustrator/web/add-and-edit-artwork/create-text/add-text.html Illustrator web add text point text drag frame horizontal vertical`. Exact extract: “Select anywhere on the artboard to add point text and start typing. To add text within a boundary, drag the pointer to create a text frame. ... You can add text horizontally or vertically. Select the Type tool and then select the Vertical Type tool.” |
| 4 | [Character panel](https://helpx.adobe.com/illustrator/desktop/design-with-text/edit-format-text/character-panel-overview.html) | **Extract-only; direct page timed out.** Retrieved 2026-08-15. Query: `site:helpx.adobe.com/illustrator/desktop/design-with-text/edit-format-text/character-panel-overview.html Illustrator Character panel leading tracking kerning vertical scale anti-aliasing`. Exact extract: “Set the leading | Sets the vertical space between lines of text. ... Set the tracking for the selected characters | Adjusts the overall spacing between multiple selected characters. ... Set the kerning between two characters | Adjusts the spacing between a specific pair of characters. ... Vertical Scale | Stretches or compresses the text vertically. ... Set the anti-aliasing method | Applies edge smoothing to improve text appearance on screen. Options include None, Sharp, Crisp, and Strong.” |
| 5 | [Asian scripts 2023](https://helpx.adobe.com/illustrator/using/asian-scripts.html) | **Extract-only; direct page timed out.** Retrieved 2026-08-15. Query: `site:helpx.adobe.com/illustrator/using/asian-scripts.html Illustrator Middle Eastern South Asian Composer Single-line Every-line`. Exact extract: “Illustrator includes support for Indic, Middle Eastern, and South East Asian languages. You can create documents using text from these languages. The additional Middle Eastern and South Asian Composer provides correct word shaping for many non-Western scripts. ... Middle Eastern & South Asian Single-line Composer ... Middle Eastern & South Asian Every-line Composer.” |
| 6 | [UAX #9](https://www.unicode.org/reports/tr9/) | Primary stable Unicode standard; bidi |
| 7 | [UAX #29](https://www.unicode.org/reports/tr29/) | Primary stable Unicode standard; segmentation/editing |
| 8 | [SVG 2 Text](https://www.w3.org/TR/SVG2/text.html) | Primary W3C spec; text/path/layout capability |
| 9 | [OpenType variations](https://learn.microsoft.com/en-us/typography/opentype/spec/otvaroverview) | Primary OpenType spec; variable metrics |
| 10 | [CSS Fonts 4](https://www.w3.org/TR/css-fonts-4/#font-matching-algorithm) | W3C Working Draft; matching portability risk |
| 11 | [US9696818B2](https://patents.google.com/patent/US9696818B2/en) | Patent disclosure only; bidi selection |

**Source count:** 11 checked sources: 1 directly inspected Adobe page, 4 Adobe Help search extracts, 5 standards/specifications, and 1 patent. **Extract-only product claims:** text modes/path controls, Character-panel controls, and composer labels have no inspected Help-page support in this report and are not independent measurements. Variable-font UI, styles panels, local/Adobe Fonts, and hover-preview claims were removed.

## Stop check

All planned public-claim branches are covered or named unknown. The remediation curiosity pass tested direct retrieval for every cited Help URL; each timed out, while four reproducible official extracts support bounded, explicitly labelled claims. No extract was preserved for variable-font, style-panel, local-font, or newer-composer assertions, so those claims were removed. The final pass found no public source disclosing SDK object layout, private file format, performance/threading, or exporter guarantees. **Stop reason: coverage achieved; further verification needs accessible Adobe pages or controlled black-box study.**

## Promising leads not pursued

| Thread | Why off-frame; value/cost | One-line next step |
|---|---|---|
| Official current SDK archive | High value / medium cost; direct retrieval not available in this pass | Obtain versioned Adobe SDK and record object-model facts only. |
| Desktop differential corpus | Very high / high; needs licensed app, terms and platform matrix | Change one property per `.ai`, reopen/export on macOS and Windows. |
| PDF/SVG output corpus | High / medium; docs cannot answer fidelity | Inspect retained text/font/positions for controlled samples. |
| Missing-font platform corpus | High / high; controlled licensed fonts required | Remove/replace one version at a time and record warnings/layout/save. |
| Patent family search | Low / medium; patents do not prove architecture | Use only for an IP provenance review. |
